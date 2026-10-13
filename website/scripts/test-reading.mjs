import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { validSnapshot, taipeiDay } from '../worker/reading.js';

// Exercise the real Worker and SQLite Durable Object without touching production totals.
// Start Wrangler locally on port 8790 with fresh local persistence and
// --var READING_REPORT_KEY:local-test-only before running this file.
const base = 'http://127.0.0.1:8790';
const mf = { dispatchFetch: fetch };
const getReport = () => mf.dispatchFetch(base + '/api/reading/report', { headers: { Authorization: 'Bearer local-test-only' } }).then(r => r.json());
const event = { id: crypto.randomUUID(), started: Date.now() - 60000, path: '/articles/test/', source: 'threads', article: true, ms: 0, depth: 10, clinic: 0, related: 0 };
const post = (e, extra = {}) => mf.dispatchFetch(base + '/api/reading', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(e) });
try {
  assert.equal((await mf.dispatchFetch(base + '/api/reading/report')).status, 401);
  assert.equal((await mf.dispatchFetch(base + '/api/reading/report', { headers: { Authorization: 'Bearer wrong' } })).status, 401);
  assert.equal((await post(event, { Origin: 'https://elsewhere.test' })).status, 403);
  assert.equal((await post({ ...event, path: '/patient?name=private' })).status, 400);
  assert.equal((await post({ ...event, ms: 99999999 })).status, 400);
  assert.equal((await post(event, { 'User-Agent': 'Googlebot' })).status, 204);
  assert.equal((await getReport()).rows.length, 0);
  assert.equal((await post(event)).status, 204);
  const later = { ...event, ms: 45000, depth: 92, clinic: 1, related: 2 };
  for (const e of [later, later, event]) assert.equal((await post(e)).status, 204);
  assert.equal((await post({ ...later, source: 'facebook' })).status, 409);
  let report = await getReport();
  assert.equal(report.rows.length, 1);
  assert.deepEqual(Object.fromEntries(['views','ms','half','deep','engaged','clinic','related'].map(k=>[k,report.rows[0][k]])),
    { views: 1, ms: 45000, half: 1, deep: 1, engaged: 1, clinic: 1, related: 2 });
  assert.equal((await post({ ...event, id: crypto.randomUUID(), article: false, path: '/clinic/', depth: 0 })).status, 204);
  assert.equal((await getReport()).rows.length, 2);
  const visits = await mf.dispatchFetch(base + '/api/visits').then(r=>r.json());
  assert.equal(visits.total, 0, 'Reading events must not change the legacy counter');
  assert.equal(taipeiDay(Date.parse('2026-10-12T17:00:00Z')), '2026-10-13');
  assert.equal(validSnapshot({ ...event, started: Date.now()-3*86400000 }), false);
  console.log('PASS Worker: auth, origins, bots, bounds, idempotency, ordering, separate legacy counter, timezone.');
} finally { /* The caller owns the local Wrangler process. */ }

// Run the real browser module against a controllable clock and DOM to check active time.
const source = await fs.readFile(new URL('../src/scripts/reading.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function browser({ dnt = '0', disabled = false } = {}) {
  let now=0, focus=true, rect={top:100,bottom:2100,height:2000};
  const callbacks={}, intervals=[], requests=[];
  const doc={body:{hasAttribute:()=>true}, referrer:'https://www.threads.com/@doctor?secret=never-send', visibilityState:'visible',hasFocus:()=>focus,
    querySelector:()=>({getBoundingClientRect:()=>rect}),addEventListener:(n,f)=>{callbacks[n]=f;}};
  const local = { getItem:()=>disabled?'1':null };
  const ctx={exports:{},document:doc,navigator:{webdriver:false,doNotTrack:dnt},localStorage:local,
    location:{hostname:'drhaohao.test',origin:base,pathname:'/articles/test/',href:base+'/articles/test/?secret=never-send'},
    crypto:{randomUUID:()=>crypto.randomUUID()},URL,Date:{now:()=>1700000000000+now},performance:{now:()=>now},innerHeight:800,
    addEventListener:(n,f)=>{callbacks[n]=f;},setInterval:(f,ms)=>{intervals.push({f,ms});},
    fetch:async(_,opts)=>{requests.push(JSON.parse(opts.body));return {ok:true};}};
  vm.runInNewContext(js,ctx);
  return { requests, callbacks, doc,
    step:ms=>{now+=ms;intervals.filter(t=>t.ms===1000).forEach(t=>t.f());},
    focus:v=>{focus=v;callbacks[v?'focus':'blur']();},
    rect:r=>{rect=r;callbacks.scroll();}, disable:()=>{disabled=true;},
    flush:()=>callbacks.pagehide?.(), };
}
assert.equal(browser({dnt:'1'}).requests.length,0);
assert.equal(browser({disabled:true}).requests.length,0);
const b=browser();
assert.equal(b.requests[0].source,'threads');
assert.equal(JSON.stringify(b.requests).includes('secret'),false);
b.step(10000);b.focus(false);b.step(300000);b.focus(true);b.step(90000);b.flush();
assert.equal(b.requests.at(-1).ms,70000, 'Background excluded and idle time capped at 60 seconds');
b.callbacks.pointerdown();b.step(5000);b.rect({top:-1200,bottom:800,height:2000});b.flush();
assert.equal(b.requests.at(-1).ms,75000);assert.equal(b.requests.at(-1).depth,100);
const count=b.requests.length;b.disable();b.step(1000);b.flush();assert.equal(b.requests.length,count);
console.log('PASS browser: DNT, opt-out, source minimization, background pause, idle cap, resume and article depth.');
