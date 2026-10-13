// The read-only reporting key stays outside the repository. No key is written to the report.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const workspace = path.resolve(root, '../..');
const keyPath = process.env.READING_REPORT_KEY_FILE || path.join(workspace, '.tools/reading-report-key.txt');
const key = (await fs.readFile(keyPath, 'utf8')).trim();
const days = Number(process.argv[2] || 30);
if (!Number.isInteger(days) || days < 1 || days > 180) throw Error('Days must be 1–180');
const response = await fetch(`https://drhaohao.com/api/reading/report?days=${days}`, { headers: { Authorization: `Bearer ${key}` } });
if (!response.ok) throw Error(`Report unavailable (${response.status})`);
const data = await response.json();
const titles = new Map([['/', '首頁'], ['/clinic/', '門診時間與預約'], ['/about/', '關於程皓醫師'], ['/articles/', '全部文章'], ['/privacy/', '閱讀統計與隱私']]);
for (const file of await fs.readdir(path.join(root, 'src/content/articles'))) {
  if (!file.endsWith('.md')) continue;
  const md = await fs.readFile(path.join(root, 'src/content/articles', file), 'utf8');
  titles.set(`/articles/${file.slice(0, -3)}/`, md.match(/^title:\s*(.+)$/m)?.[1] ?? file);
}
const fields = ['views', 'ms', 'half', 'deep', 'engaged', 'clinic', 'related'];
const zero = () => Object.fromEntries(fields.map(k => [k, 0]));
const pages = new Map(), sources = new Map(), daily = new Map();
const total = zero(), articles = zero();
function add(target, row) { for (const k of fields) target[k] += row[k]; }
for (const row of data.rows) {
  add(total, row); if (row.article) add(articles, row);
  if (!pages.has(row.path)) pages.set(row.path, { ...zero(), path: row.path, article: row.article });
  add(pages.get(row.path), row);
  if (!sources.has(row.source)) sources.set(row.source, zero());
  add(sources.get(row.source), row);
  if (!daily.has(row.day)) daily.set(row.day, zero());
  add(daily.get(row.day), row);
}
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = (n, d) => d ? `${(n / d * 100).toFixed(1)}%` : '尚無資料';
const time = (ms, count) => count ? `${Math.round(ms / count / 1000)} 秒` : '尚無資料';
const date = s => new Date(s).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
const sourceNames = { direct: '直接／來源不明', internal: '站內連結', threads: 'Threads', facebook: 'Facebook', instagram: 'Instagram', google: 'Google', bing: 'Bing', chatgpt: 'ChatGPT', perplexity: 'Perplexity', other: '其他外部來源' };
const rows = [...pages.values()].sort((a,b) => b.views-a.views);
const table = rows.map(p => `<tr><td><a href="https://drhaohao.com${escape(p.path)}">${escape(titles.get(p.path) || p.path)}</a>${p.article ? '' : '<small>一般頁面</small>'}</td><td>${p.views}</td><td>${time(p.ms,p.views)}</td><td>${p.article ? pct(p.half,p.views) : '—'}</td><td>${p.article ? pct(p.deep,p.views) : '—'}</td><td>${p.article ? pct(p.engaged,p.views) : '—'}</td><td>${p.clinic}</td><td>${p.related}</td></tr>`).join('');
const html = `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>程皓醫師｜網站閱讀報表</title>
<style>body{font:16px/1.7 "Microsoft JhengHei",sans-serif;background:#f5f8f7;color:#243c43;margin:0}main{max-width:1250px;margin:auto;padding:32px 24px}h1{color:#155f6b}a{color:#155f6b}small{display:block;color:#667b80}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}.card{background:white;border:1px solid #d8e4e0;border-radius:14px;padding:20px}.number{display:block;font-size:30px;font-weight:bold;color:#155f6b}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;background:white}th,td{padding:12px;text-align:left;border-bottom:1px solid #dde5e1}th{white-space:nowrap;background:#e6f0ec}td:first-child{min-width:230px}.note{border-left:4px solid #cfa15a;background:#fff8e9;padding:16px}li{margin-bottom:7px}</style>
<main><p>程皓醫師・私人閱讀報表</p><h1>大家有在閱讀嗎？</h1><p>統計期間：${data.from} ～ ${data.through}（台灣時間）<br>功能起算：${date(data.startedAt)}<br>報表更新：${date(data.generatedAt)}</p>
<div class="cards"><div class="card">頁面瀏覽次數<strong class="number">${total.views}</strong><small>不是不重複訪客數</small></div><div class="card">文章瀏覽次數<strong class="number">${articles.views}</strong></div><div class="card">文章每次瀏覽平均有效停留<strong class="number">${time(articles.ms,articles.views)}</strong></div><div class="card">文章閱讀投入比例<strong class="number">${pct(articles.engaged,articles.views)}</strong><small>有效停留 ≥ 30 秒且正文進度 ≥ 50%</small></div></div>
<p class="note">${total.views ? '資料仍在累積。請搭配文章長度與瀏覽量解讀，少量瀏覽可能造成比例大幅波動。' : '統計剛啟用，目前尚無符合條件的瀏覽資料。過往頁尾累計人次不會併入這份閱讀報表。'} 此報表只表示瀏覽行為，不能證明逐字讀完、理解文章或完成掛號。</p>
<h2>文章與頁面表現</h2><div class="scroll"><table><thead><tr><th>頁面</th><th>瀏覽</th><th>平均有效停留／次</th><th>正文達 50%</th><th>正文達 90%</th><th>閱讀投入比例</th><th>門診相關點擊</th><th>文章延伸點擊</th></tr></thead><tbody>${table || '<tr><td colspan="8">尚無資料</td></tr>'}</tbody></table></div>
<h2>來源分類</h2><p>這是每次頁面載入的來源，不是整段造訪的最初來源；社群 App 隱藏來源時，可能列為直接／來源不明。</p><table><tr><th>來源</th><th>瀏覽次數</th></tr>${[...sources].sort((a,b)=>b[1].views-a[1].views).map(([s,r])=>`<tr><td>${escape(sourceNames[s] || s)}</td><td>${r.views}</td></tr>`).join('')}</table>
<h2>每日瀏覽</h2><table><tr><th>日期</th><th>瀏覽次數</th><th>有效停留總秒數</th></tr>${[...daily].map(([d,r])=>`<tr><td>${d}</td><td>${r.views}</td><td>${Math.round(r.ms/1000)}</td></tr>`).join('')}</table>
<h2>如何解讀</h2><ul><li>每次頁面載入算一次瀏覽；重整與自己查看網站都可能計入。可在網站頁尾的隱私設定停用本瀏覽器的閱讀統計。</li><li>停留只計前景且取得焦點的時間；無操作超過 60 秒暫停，每次載入最多累計一小時。</li><li>閱讀深度以正文為範圍、可視區域底緣為位置，並非整頁頁尾。短文章或快速捲動也可能達到 90%。</li><li>門診相關點擊含門診頁、預約／掛號連結及電話；延伸點擊含文章頁上的其他專欄連結，都是次數而非完成預約人數。</li><li>每 30 秒及頁面切換時回傳。斷線、瀏覽器阻擋、停用統計與已知爬蟲等，可能讓資料少於頁尾瀏覽計數。</li><li>資料僅從功能啟用後累積；每日彙總保留約 180 日。私人報表請妥善保管。</li></ul></main></html>`;
const out = path.join(workspace, 'output'); await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out,'網站閱讀統計.html'), html);
await fs.writeFile(path.join(out,'reading-statistics.json'), JSON.stringify(data,null,2));
console.log(`Report refreshed: ${total.views} page views, ${articles.views} article views.\n${path.join(out,'網站閱讀統計.html')}`);
