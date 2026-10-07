/** Original flat editorial artwork. Run with Node to rebuild covers, optionally passing one slug. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'src/assets/generated/articles');
const ink = '#155f6b', light = '#b9dad8', paper = '#fcfaf5', gold = '#d39b56';
const p = (d, fill = 'none', stroke = ink, width = 9) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const c = (x, y, r, fill = light, stroke = 'none', width = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const rect = (x, y, w, h, r = 20, fill = paper, stroke = ink, width = 8) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const text = (x, y, value, size = 26, fill = ink, weight = 500) => `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif">${value}</text>`;
const oxygen = () => c(1000, 164, 51, paper, ink, 4) + text(966, 179, 'O₂', 43, ink, 700);
const human = () => c(829, 223, 26, ink) + p('M813 265 L785 330 L840 362 L865 427 M797 300 L878 303 L912 273 M787 331 L745 398 L690 417', 'none', ink, 23);
const drawings = {
  chamber: rect(661, 246, 382, 172, 78, light) + c(757, 332, 46, paper, ink, 6) + c(912, 332, 46, paper, ink, 6) + text(884, 347, 'O₂', 40, ink, 700) + rect(707, 424, 38, 28, 6, ink, 'none') + rect(960, 424, 38, 28, 6, ink, 'none') + c(852, 191, 42, paper, ink, 6) + p('M852 191 L872 171 M852 235 V245', 'none', ink, 6) + p('M686 475 H1020', 'none', gold, 5),
  glucose: rect(731, 166, 190, 294, 30) + rect(754, 208, 144, 111, 12, light, 'none') + p('M770 270 H794 L806 247 L824 291 L839 259 H881', 'none', ink, 6) + c(827, 394, 19, paper, ink, 5) + p('M1001 303 C1001 303 963 346 963 370 A38 38 0 0 0 1039 370 C1039 346 1001 303 Z', gold, 'none') + p('M704 494 H1015', 'none', light, 5),
  liver: p('M672 310 C669 246 713 211 782 221 C840 229 858 244 907 222 C947 203 1000 218 1004 259 C1009 294 977 310 945 318 C905 326 876 348 840 376 C797 410 738 427 699 394 C679 378 671 344 672 310 Z', light) + p('M874 242 C868 286 849 331 807 375', 'none', ink, 7) + c(744, 295, 12, gold) + c(784, 277, 10, gold) + c(757, 340, 11, gold) + c(803, 317, 8, gold) + p('M702 455 H1008', 'none', light, 5),
  hiking: p('M644 429 L769 204 L919 429 Z', '#d6e7dd', 'none') + p('M794 430 L933 235 L1082 430 Z', light, 'none') + p('M742 253 L769 204 L802 253 L778 245 L768 261 Z', paper, 'none') + p('M700 471 C775 424 813 438 845 394 C866 365 870 349 883 330', 'none', gold, 10) + `<g transform="translate(227 91) scale(.74)">${human()}</g>` + p('M935 330 L958 441', 'none', ink, 5),
  strength: `<g transform="rotate(-18 830 310)">${rect(668, 291, 336, 38, 12, ink, 'none')}${rect(696, 243, 44, 132, 10, light)}${rect(740, 214, 46, 192, 10, light)}${rect(886, 214, 46, 192, 10, light)}${rect(932, 243, 44, 132, 10, light)}</g>` + p('M697 472 H779 M798 472 H881 M900 472 H983', 'none', gold, 10),
  sports: human() + c(954, 380, 47, gold, ink, 5) + p('M908 380 H1000 M954 333 V427 M929 341 C950 364 950 397 929 419 M979 341 C958 364 958 397 979 419', 'none', ink, 3) + p('M699 466 H1012', 'none', light, 6) + oxygen(),
  wound: `<g transform="rotate(-28 833 326)">${rect(683, 266, 300, 120, 48, '#e8c6a1')}${rect(783, 275, 100, 102, 20, paper, 'none')}${[714,743,923,951].map(x => c(x, 326, 5, paper)).join('')}${p('M812 327 H854 M833 306 V348', 'none', ink, 7)}</g>` + p('M719 452 C770 476 869 487 960 449', 'none', light, 6) + oxygen(),
  aesthetic: p('M807 197 C752 224 742 302 766 359 C780 393 813 404 827 432 M807 197 C870 180 918 225 916 271 L941 317 L914 329 C916 364 897 384 863 382 L861 435', '#e9dcd0') + p('M858 284 Q878 274 891 284 M874 348 H903', 'none', ink, 6) + p('M761 427 Q809 410 827 432 Q848 416 861 435 L924 470 H705 Z', light, ink, 5) + c(750, 180, 7, gold) + oxygen(),
  brain: p('M856 447 V405 C902 394 929 349 924 294 C919 232 873 190 815 192 C752 194 710 246 712 305 L687 347 L720 358 L726 394 L779 397 V447', '#e0e9e4') + p('M758 294 C736 267 758 240 781 243 C783 218 817 218 829 235 C851 217 878 236 873 256 C901 257 904 292 885 303 C885 328 856 337 838 321 C815 340 790 330 789 312 C767 320 751 310 758 294 Z', light, ink, 6) + p('M829 235 V310 M779 244 Q804 257 792 277 M873 256 Q847 254 847 280 M758 293 Q782 283 789 311 M885 303 Q861 294 847 309', 'none', ink, 5) + oxygen(),
  hearing: p('M766 315 C724 240 781 190 829 190 C891 190 927 237 914 286 C905 321 874 333 867 374 C862 410 839 437 815 415 C801 403 798 389 799 375', 'none', ink, 13) + p('M789 282 C771 245 804 223 831 231 C864 239 875 264 858 291 C842 312 816 302 812 331 L834 349', 'none', ink, 9) + p('M693 279 Q677 307 694 338 M661 258 Q633 307 662 359', 'none', gold, 7) + oxygen(),
  diving: p('M657 422 Q707 403 757 422 T857 422 T957 422 T1057 422 M678 455 Q728 436 778 455 T878 455 T978 455', 'none', light, 7) + `<g transform="rotate(-14 833 316)">${c(924, 281, 28, ink)}${p('M881 298 L806 319 L754 292 M812 320 L756 355 L710 350 M871 310 L888 351 L938 356', 'none', ink, 19)}${rect(810, 270, 65, 30, 12, gold, 'none')}${p('M753 292 L712 282 L735 304 Z M710 350 L674 349 L698 370 Z', light, ink, 3)}${rect(924, 268, 28, 19, 6, light, paper, 3)}</g>` + c(1011, 258, 9, 'none', ink, 3) + c(1031, 223, 13, 'none', ink, 3) + oxygen(),
};

export const covers = [
  ['hbot-introduction', '高壓氧治療', ['高壓氧治療', '總覽與入門'], '原理・評估・流程・主題導讀', 'chamber'],
  ['glp1-blood-sugar-benefits', '體重管理', ['瘦瘦針', '與血糖管理'], '認識作用・持續追蹤', 'glucose'],
  ['glp1-fatty-liver-benefits', '體重管理', ['瘦瘦針', '與脂肪肝'], '減重之外，還要評估什麼？', 'liver'],
  ['hiking-strength-preparation', '運動傷害', ['爬山之前', '先練好腿'], '上坡推進・下坡控制・穩定', 'hiking'],
  ['strength-training-for-life-and-recovery', '肌力訓練', ['重訓與', '日常活動力'], '從訓練入門到傷後恢復', 'strength'],
  ['hbot-sports-recovery', '高壓氧治療', ['運動傷害', '與疲勞恢復'], '運動員經驗與輔助治療', 'sports'],
  ['hbot-wound-healing', '高壓氧治療', ['高壓氧', '與傷口修復'], '特定難癒傷口的整合照護', 'wound'],
  ['hbot-aesthetic-procedures', '高壓氧治療', ['高壓氧', '與醫美治療'], '術後恢復與缺血併發症', 'aesthetic'],
  ['hbot-brain-injury-concussion', '高壓氧治療', ['高壓氧', '與腦傷後恢復'], '持續症狀的研究與評估', 'brain'],
  ['hbot-sudden-hearing-loss', '高壓氧治療', ['高壓氧', '與突發性耳聾'], '突然聽不清楚，及時就醫', 'hearing'],
  ['hbot-diving', '高壓氧治療', ['高壓氧', '與潛水減壓病'], '症狀改善・功能恢復・時機', 'diving'],
];

await fs.mkdir(out, { recursive: true });
for (const [slug, category, title, caption, drawing] of covers) {
  if (process.argv[2] && process.argv[2] !== slug) continue;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${paper}"/>
    <path d="M639 0 H1200 V630 H985 C1080 494 660 534 639 0" fill="#edf3ef"/>
    ${c(847, 314, 210, '#e3eeea')}
    ${rect(76, 78, 184, 46, 23, '#dfede8', 'none')}${text(99, 110, category, 25, ink, 700)}
    ${text(76, 252, title[0], 55, '#203a40', 700)}${text(76, 331, title[1], 55, '#203a40', 700)}
    ${p('M79 376 H139', 'none', gold, 5)}${text(76, 429, caption, 27, '#50666b')}
    ${drawings[drawing]}
    ${p('M76 538 H1124', 'none', '#d7e1dc', 2)}
    ${text(76, 582, '程皓醫師・健康衛教', 24, ink, 600)}${text(984, 582, '主題示意', 23, '#607873')}
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(path.join(out, `${slug}.webp`));
  console.log(`Cover: ${slug}`);
}
