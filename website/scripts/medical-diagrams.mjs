/** Flat vector diagrams. No meshes, rendered photographs, external assets or raster layers. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/data/medical-visuals.json'), 'utf8'));
const check = process.argv.includes('--check');
const C = { ink: '#213b45', line: '#769b9f', bone: '#f2e9d5', teal: '#16838a', pale: '#dcefeb', orange: '#c86c2e', blue: '#377da5' };
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const p = (d, fill = C.bone, stroke = C.line, width = 3) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const circle = (x,y,r,fill=C.teal) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const text = (x,y,s,size=24,fill=C.ink,anchor='start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
const label = (s,x,y,tx,ty,anchor='start') => p(`M${tx} ${ty} L${x} ${y+10}`, 'none', C.line, 2)+circle(tx,ty,4)+text(x,y,s,24,C.ink,anchor);
const bone = d => p(d);
const wrap = (s,n=24) => Array.from(s).reduce((a,c,i)=>{if(i%n===0)a.push('');a[a.length-1]+=c;return a;},[]);

function knee(scene) {
  let s = bone('M250 65 L350 65 L345 158 Q385 183 355 214 Q325 233 300 209 Q275 233 245 214 Q215 183 255 158 Z')
    + bone('M235 265 Q300 251 365 265 L341 305 L339 388 L261 388 L259 305 Z')
    + bone('M393 283 Q411 273 419 292 L411 388 L394 388 Z');
  if (scene==='knee-meniscus' || scene==='knee-overview') {
    s += p('M236 241 Q265 226 292 241 Q266 252 236 247 Z',C.teal)+p('M308 241 Q337 226 364 241 L364 247 Q338 252 308 241 Z',C.teal);
    s += label('半月板',445,249,342,240);
  }
  if(scene==='knee-overview'||scene==='knee-oa') {
    s += p('M242 216 Q271 235 294 215 M306 215 Q331 235 358 216','none',C.teal,scene==='knee-oa'?5:10);
    s += label(scene==='knee-oa'?'關節軟骨變化':'關節軟骨',24,168,254,218);
  }
  if(scene==='knee-acl') {
    s += p('M334 200 L270 267','none',C.orange,13)+label('前十字韌帶',398,225,307,228);
  }
  if(scene==='knee-mcl') s += p('M232 179 Q214 225 239 290','none',C.orange,13)+label('內側副韌帶',24,228,223,236)+text(26,270,'內側',18)+text(435,310,'外側',18);
  if(scene==='knee-pes') s += p('M211 151 Q185 272 257 301 M185 164 Q174 289 257 301 M160 179 Q165 305 257 301','none',C.teal,7)+circle(256,310,15,'#f2cfac')+label('鵝掌肌腱',24,235,201,270)+label('滑囊區域',414,332,256,310);
  if(scene==='knee-patellar') s += p('M282 233 L294 297','none',C.orange,13)+p('M273 174 Q305 162 315 185 Q315 219 292 238 Q266 215 273 174',C.pale,C.teal)+label('髕骨',430,180,303,200)+label('髕骨肌腱',25,315,288,267);
  s += label('股骨',430,91,347,118)+label('脛骨',75,376,263,345);
  return s;
}
function foot(scene) {
  if(scene==='plantar-fascia') return p('M150 103 Q139 201 115 273 Q104 315 145 333 L455 333 Q484 329 480 309 Q476 294 433 282 Q357 265 282 206 Q240 172 242 103 Z','#f6f4eb')
    +p('M140 279 Q157 258 180 275 L197 310 L135 313 Z',C.bone)
    +p('M159 315 Q260 305 422 296 L441 317 Z',C.pale,C.teal,3)
    +p('M159 315 L422 304 M159 315 L433 311','none',C.teal,3)
    +circle(160,312,11,C.orange)
    +label('跟骨',32,230,153,287)+label('足底筋膜',275,397,292,310,'middle')
    +label('前足',467,238,430,303)+text(300, 50,'足部內側示意',20,C.line,'middle');
  if(scene==='ankle-lateral') return bone('M244 70 L300 70 L294 229 Q275 257 249 235 Z')+bone('M336 70 L359 70 L357 249 L332 253 Z')
    +bone('M268 253 Q311 238 338 267 L411 315 L245 335 Q207 319 230 285 Z')
    +p('M348 249 L299 280 M348 249 L331 316','none',C.orange,10)
    +label('脛骨',100,100,251,131)+label('腓骨',422,114,350,141)+label('外側韌帶',415,249,336,277)+text(300,390,'踝外側結構示意',20,C.line,'middle');
  return p('M270 70 L345 70 Q365 125 339 196 L316 266 L324 325 L431 342 Q450 360 422 369 L262 369 Q242 353 252 319 L262 249 Q228 169 270 70 Z','#f6f4eb')
    +p('M278 85 Q241 165 281 237 Q302 254 324 207 Q346 138 328 85 Z',C.pale,C.teal)
    +p('M292 238 Q285 280 278 338','none',scene==='achilles'?C.orange:C.teal,12)
    +bone('M266 337 L309 337 L320 357 L264 357 Z')
    +(scene==='calf-tear'?circle(293,237,12,C.orange):'')
    +label('小腿肌群', 40,145,271,154)+label(scene==='calf-tear'?'肌腱交界':'阿基里斯腱',382,254,288,264)+label('跟骨',113,375,282,349);
}
 
function shoulder(scene) {
  let s=bone('M170 150 Q240 100 302 144 L281 275 L238 321 Z')+bone('M323 174 Q346 159 370 180 Q396 204 366 236 L381 365 L338 372 L321 235 Q299 206 323 174 Z')
    +p('M181 119 Q250 95 324 122 L357 148','none',C.line,12);
  s+= scene==='shoulder-capsule'?p('M301 147 Q357 133 387 188 Q404 242 337 267 L305 230 Z','none',C.orange,9)
    :p('M217 148 Q285 143 324 169 Q347 180 355 198','none',C.teal,18);
  return s+label('肩胛骨',30,235,222,214)+label('肱骨',444,357,362,319)+label(scene==='shoulder-capsule'?'關節囊':'旋轉肌袖',389,99,336,168)+text(300, 40,'肩部結構・簡化示意',20,C.line,'middle');
}
function elbow(scene) {
 return bone('M239 76 L286 76 L288 239 Q273 272 239 247 Z')+bone('M258 271 Q282 265 294 281 L401 359 L375 384 Z')+bone('M298 252 L423 331 L408 348 L289 273 Z')
   +p(scene==='elbow-ulnar'?'M225 100 Q207 236 238 278 L343 366':'M293 242 Q325 266 365 293','none',scene==='elbow-ulnar'?C.orange:C.teal,10)
   +label('肱骨',350,110,280,130)+label(scene==='elbow-ulnar'?'尺神經':'伸肌腱區',30,245,scene==='elbow-ulnar'?219:307,251)+label('前臂',439,294,371,331);
}
function muscle(scene) {
 let s='';
 if(scene==='hip-glutes'||scene==='hamstrings') {
   s+=p('M226 95 Q209 163 231 216 L224 377 L276 377 L300 238 L324 377 L376 377 L369 216 Q391 163 374 95 Z','#f6f4eb');
   if(scene==='hip-glutes') s+=p('M230 144 Q268 126 298 159 L290 217 Q249 239 231 201 Z M370 144 Q332 126 302 159 L310 217 Q351 239 369 201 Z',C.pale,C.teal)+p('M225 113 Q257 95 286 126 M375 113 Q343 95 314 126','none',C.orange,13)+label('臀中肌區',34,89,249,113)+label('臀大肌',421,232,345,186);
   else s+=p('M246 227 L244 345 M270 235 L263 345 M333 235 L340 345 M357 227 L358 345','none',C.teal,13)+label('腿後肌群',25,274,252,290);
   return s+text(300, 50,'後側示意',20,C.line,'middle');
 }
 s+=p('M118 208 Q161 99 289 129 Q421 150 470 233 Q408 350 286 322 Q161 304 118 208 Z',C.pale,C.teal);
 for(let i=0;i<5;i++)s+=p(`M145 ${185+i*12} Q280 ${108+i*34} 445 ${210+i*9}`,'none',C.teal,4);
 return s+(scene==='muscle-trigger'?circle(309,219,20,C.orange):'')+label('肌肉纖維',30,83,216,161)+(scene==='muscle-trigger'?label('關注區域',424,383,309,219):text(300,390,'肌束放大示意',20,C.line,'middle'));
}
function wrist() {
 let s=bone('M246 74 L275 74 L283 213 L240 213 Z')+bone('M309 74 L328 74 L334 210 L307 210 Z');
 for(let i=0;i<6;i++)s+=`<rect x="${231+i%3*37}" y="${230+Math.floor(i/3)*30}" width="29" height="24" rx="7" fill="${C.bone}" stroke="${C.line}" stroke-width="2"/>`;
 for(let i=0;i<4;i++)s+=p(`M${236+i*31} 296 L${227+i*35} 371`,'none',C.line,14);
 return s+label('橈骨',98,109,253,142)+label('尺骨',414,110,322,142)+label('腕骨',419,263,312,263)+text(300,415,'腕部結構示意',20,C.line,'middle');
}
function vein(scene) {
 let s=p('M242 75 L242 373 M352 75 L352 373','none',C.blue,8)+`<rect x="248" y="75" width="98" height="298" fill="#e0eff7"/>`;
 s+=p('M249 190 Q270 186 287 221 M345 190 Q324 186 307 221','none',C.blue,5)+p('M297 158 L297 99 M283 115 L297 99 L311 115','none',C.teal,5);
 if(scene==='vein-clot')s+=p('M248 282 Q294 252 296 303 Q290 329 248 327 Z',C.orange,C.orange);
 return s+label('靜脈',61,127,245,149)+label('朝心臟回流',399,87,297,119)+label(scene==='vein-clot'?'血塊':'靜脈瓣膜',399,279,scene==='vein-clot'?278:330,scene==='vein-clot'?301:199);
}
function ultrasound() {
 return `<rect x="80" y="226" width="440" height="128" rx="14" fill="${C.pale}"/>`
 +p('M80 227 L520 227 M80 269 L520 269 M80 312 L520 312','none',C.line,5)
 +`<rect x="230" y="90" width="140" height="100" rx="16" fill="${C.teal}"/>`
 +p('M244 198 L197 337 L403 337 L356 198 Z','none',C.teal,2)+label('探頭',420,135,351,145)+label('組織層次',67,401,152,270)+text(300, 50,'超音波檢查・概念示意',20,C.line,'middle');
}
function movement(scene) {
 const poses={
  'movement-hinge':[359,117,337,155,259,226,311,298,276,368,400,221],
  'movement-squat':[327,91,313,134,254,232,345,279,297,368,389,173],
  'movement-running':[332,84,321,123,285,221,374,270,416,341,393,183],
  'movement-step':[322,90,307,129,282,226,365,260,365,331,377,191],
  'movement-training':[301,82,301,124,300,233,348,298,374,368,402,177],
  'movement-agility':[301,82,301,124,300,233,374,279,419,368,402,177],
 };
 const a=poses[scene];if(!a)return null;
 const [hx,hy,sx,sy,px,py,kx,ky,fx,fy,ax,ay]=a;
 let s=circle(hx,hy,25,C.teal)+p(`M${sx} ${sy} L${px} ${py} L${kx} ${ky} L${fx} ${fy} M${px} ${py} L222 302 L196 369 M${sx} ${sy+13} L${ax} ${ay} L${ax+10} ${ay+35}`,'none',C.teal,18)
 +circle(px,py,9,C.orange)+circle(kx,ky,9,C.orange)+p('M145 391 L462 391','none',C.line,3);
 if(scene==='movement-step') s+=p('M323 388 L323 347 L438 347','none',C.line,4);
 return s+text(300, 30,'動作概念示意',20,C.line,'middle')+label('髖部',40,221,px,py)+label('膝部',461,284,kx,ky);
}

function concept(v) {
 // Parallel considerations, not arrows implying a causal mechanism or treatment sequence.
 const headings=v.points.map(p=>p.heading);
 let s=text(300,49,'閱讀重點',20,C.line,'middle');
 for(let i=0;i<3;i++) {
   const y=75+i*115;
   s+=`<rect x="42" y="${y}" width="516" height="94" rx="18" fill="${i===1?'#e8f4ef':'#f3f6f5'}" stroke="#d0dfdc"/>`+circle(86,y+47,23,i===1?C.orange:C.teal)+text(86,y+55,String(i+1),24,'white','middle');
   const lines=wrap(headings[i],15);
   lines.forEach((line,j)=>s+=text(129,y+(lines.length>1?37:56)+j*30,line,26));
 }
 return s;
}
function drawing(v) {
 const s=v.scene;
 if(s.startsWith('knee-'))return knee(s);
 if(['plantar-fascia','achilles','calf-tear','ankle-lateral'].includes(s))return foot(s);
 if(s.startsWith('shoulder-'))return shoulder(s);
 if(s.startsWith('elbow-'))return elbow(s);
 if(['hip-glutes','hamstrings','muscle-fibers','muscle-trigger'].includes(s))return muscle(s);
 if(s==='wrist-load')return wrist();
 if(s.startsWith('vein-'))return vein(s);
 if(s==='assessment-ultrasound')return ultrasound();
 return movement(s)??concept(v);
}
function svg(v, notes=false) {
 const noteHeight = 533 + v.points.reduce((h,p) => h + 46 + wrap(p.text,26).length*29, 0);
  const height=notes?noteHeight+45:440;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(v.title)}・2D 示意圖</title><desc id="desc">${esc(v.points.map(p=>p.heading+'：'+p.text).join(' '))}</desc><rect width="600" height="${height}" fill="#fff"/><g font-family="Noto Sans TC, Microsoft JhengHei, sans-serif">${drawing(v)}`;
 if(notes) {
   s+=p('M32 455 L568 455','none','#d0dfdc',2)+text(32,493,v.title,24);
   let y=533;
   for(const [i,point]of v.points.entries()) {
     s+=text(32,y,`${i+1}. ${point.heading}`,22,C.teal);y+=30;
     for(const line of wrap(point.text,26)){s+=text(32,y,line,20);y+=29;}
     y+=16;
   }
   s+=text(32,height-22,'2D 簡化示意・尚待醫師審閱・比例不供量測',17,C.line);
 }
 return (s+'</g></svg>\n').replaceAll('模型','圖解').replaceAll('人偶','動作');
}
function save(rel,content) {
 const file=path.join(root,rel);
 if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content)throw Error(`Regenerate ${rel}`);}
 else {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
}
for(const v of Object.values(registry.articles)) {
 save(`public/medical-2d/${v.slug}.svg`,svg(v));
 save(`public/medical-2d/${v.slug}-notes.svg`,svg(v,true));
}
// Additional inline figures: reuse the same flat drawing vocabulary, never old 3D posters.
const inline = {
 'knee-acl-hyperextension': ['acl-tear-return-to-play'],
 'landing-mechanics': ['squat-essentials', '落地控制：髖與膝協調'],
 'gymnast-wrist-growth-plate': ['gymnastics-injuries'],
 'msk-ultrasound-guidance': ['msk-ultrasound-self-study'],
 'sport-concussion-pathway': ['sport-related-concussion'],
 'sideline-abcde': ['sideline-doctor-abcde'],
};
for(const [name,[slug,title]]of Object.entries(inline)) {
 const v={...registry.articles[slug]}; if(title)v.title=title;
 save(`public/medical-2d/inline/${name}.svg`,svg(v));
}
// Ultrasound article: landmark maps explain the viewing focus without simulated scan images.
const landmarks={
 shoulder:['肩部：前側定位','結節間溝','肱二頭肌長頭肌腱','對照症狀與其他視窗'],
 elbow:['肘部：外側定位','肱骨外上髁','共同伸肌腱','依適應症補充其他視窗'],
 wrist:['腕部：掌側層次','屈肌支持帶','正中神經與屈肌腱','橫切面與長軸互相對照'],
 hip:['成人前髖：斜長軸','股骨頭','股骨頸','關節前側結構'],
 knee:['膝部：前側定位','髕骨下極','髕腱','脛骨粗隆'],
 ankle:['踝部：肌腱走向','後側：阿基里斯腱','內側：脛後肌腱','外側：腓骨肌腱'],
};
for(const [name,[title,...headings]]of Object.entries(landmarks)) {
 save(`public/medical-2d/inline/ultrasound-${name}.svg`,svg({title,scene:'landmark-map',points:headings.map(heading=>({heading,text:'定位重點；請對照同頁文字說明。'}))}));
}
console.log(`${check?'Verified':'Generated'} ${Object.keys(registry.articles).length} flat diagrams with annotated download cards.`);
