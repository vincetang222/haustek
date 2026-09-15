/* =====================================================================
   KIỂM TRA CRM — chạy thật trong Chromium bằng Playwright
   ---------------------------------------------------------------------
   Khác với api-guard.js (chạy thẳng trên lõi, không cần trình duyệt):
   crm.html là một file HTML với script nội tuyến, đụng vào document ngay
   lúc nạp, nên phải kiểm trong trình duyệt thật.

   24 phép kiểm, phủ đúng những gì dễ vỡ nhất khi sửa file 5000+ dòng này:
   ranh giới quyền · thoát HTML · song ngữ và hai tiền tệ · chỉ số tuần ·
   lưu trạng thái và hồi sinh kiểu Date · cả 12 tab · drawer/chi tiết/import ·
   hiệu năng bảng ảo hoá · không tràn ngang ở khổ điện thoại ·
   sidebar · điểm quan hệ · command palette.

       node crm/test/smoke.mjs
   ===================================================================== */
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { execSync } from 'node:child_process';

/* Playwright có thể nằm ở node_modules của repo hoặc cài global — thử cả hai. */
async function loadChromium(){
  for (const m of ['playwright','playwright-core','@playwright/test']) {
    try { return (await import(m)).chromium; } catch (e) {}
  }
  try {
    const root = execSync('npm root -g', {stdio:['ignore','pipe','ignore']}).toString().trim();
    return (await import(pathToFileURL(path.join(root,'playwright','index.mjs')).href)).chromium;
  } catch (e) {}
  console.error('Cần Playwright:  npm i -D playwright   (hoặc npm i -g playwright)');
  process.exit(2);
}
const chromium = await loadChromium();

/* chạy từ thư mục gốc repo:  node crm/test/smoke.mjs */
const FILE = pathToFileURL(path.resolve('crm/index.html')).href;
let FAILED = 0;
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1600,height:1000}});
const errs=[]; p.on('pageerror',e=>errs.push('PE '+e.message));
p.on('console',m=>{const x=m.text(); if(m.type()==='error'&&!/ERR_C|CERT/.test(x))errs.push('C:'+x);});
await p.goto(FILE);
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload(); await p.waitForTimeout(700);
const F=(n,v)=>{ if(!v) FAILED++; console.log((v?'  ok  ':'  LỖI')+'  '+n); };

await p.click('.login-btn'); await p.waitForTimeout(400);
// 1 permissions still enforced
const perm = await p.evaluate(()=>{ setUser('Hannah Le');
  const r={role:meUser().role, audit:(go('audit'),state.view), perms:(go('perms'),state.view),
    handoff:(go('handoff'),state.view), canEditOther:canEdit('Ethan Nguyen'), scoped:sOpps().length, all:allOpps().length};
  setUser('Ethan Nguyen'); return r; });
F('AR bị chặn khỏi audit/perms/handoff', perm.audit==='home'&&perm.perms==='home'&&perm.handoff==='home');
F('AR không sửa được bản ghi người khác', perm.canEditOther===false);
F('AR chỉ thấy bản ghi của mình ('+perm.scoped+'/'+perm.all+')', perm.scoped<perm.all);
// 2 XSS still safe
const xss = await p.evaluate(()=>{ window.__pwned=false;
  DB.opps[0].name='<img src=x onerror="window.__pwned=true">EVIL';
  const a=DB.accounts.find(x=>x.id===DB.opps[0].accountId); if(a) a.name="O'Brien \"Q\" <b>b</b>";
  go('opps'); return window.__pwned; });
F('XSS vẫn bị chặn', xss===false);
// 3 i18n + currency
const i18 = await p.evaluate(()=>{ setLang('en'); const en=document.querySelector('.ptitle')?.textContent;
  setLang('vi'); const vi=document.querySelector('.ptitle')?.textContent;
  setCur('VND'); const v=money(1000); setCur('USD'); const u=money(1000);
  return {en,vi,v,u}; });
F('VI/EN đổi được ('+i18.vi+' / '+i18.en+')', i18.en!==i18.vi);
F('USD/VND đổi được ('+i18.u+' / '+i18.v+')', i18.v.includes('VND')&&i18.u.includes('USD'));
// 4 metrics aligned
const met = await p.evaluate(()=>{ const g=goalCalc(null);
  return {stat:DB.leads.filter(l=>l.created>=weekStart()).length, goal:g.actual[0],
    states:g.actual.map((a,i)=>Math.min(100,Math.round(a/(g.target[i]||1)*100)))}; });
F('hai con số tuần khớp ('+met.stat+'='+met.goal+')', met.stat===met.goal);
F('mục tiêu có phổ đạt/gần/chưa ['+met.states+']', new Set(met.states.map(x=>x>=100?'h':x>=60?'n':'m')).size>1);
// 5 persistence
await p.evaluate(()=>{ const o=DB.opps.find(x=>x.stage==='waiting'); window.__t=o.id; decide(o.id,1); saveNow(); });
const tid = await p.evaluate(()=>window.__t);
await p.reload(); await p.waitForTimeout(900);
F('trạng thái sống qua reload', await p.evaluate(id=>DB.opps.find(o=>o.id===id)?.stage!=='waiting', tid));
F('0 trường Date hỏng kiểu', (await p.evaluate(()=>Object.keys(DATE_FIELDS).flatMap(c=>DB[c].flatMap(r=>DATE_FIELDS[c].filter(k=>k in r&&r[k]!=null&&!(r[k] instanceof Date)))).length))===0);
// 6 all tabs
let allok=true;
for (const v of ['home','leads','opps','accounts','contacts','tasks','people','approvals','handoff','reports','audit','perms']) {
  const ok = await p.evaluate(vv=>{ try{ go(vv); return document.getElementById('view').children.length>0; }catch(e){ return false; } }, v);
  if(!ok) allok=false;
}
F('cả 12 tab vẽ được', allok);
// 7 drawer / record / import
F('drawer mở được', await p.evaluate(()=>{ go('opps'); openDrawer('opp',DB.opps[0].id); const o=!!document.querySelector('.drawer'); closeDrawer(); return o; }));
F('trang chi tiết mở được', await p.evaluate(()=>{ openOpp(DB.opps.find(o=>o.stage!=='lost').id); return !!document.querySelector('.rtabs'); }));
F('import wizard mở được', await p.evaluate(()=>{ go('leads'); openImport(); const o=!!document.querySelector('.modal,.mscrim,.imp'); closeDrawer&&closeDrawer(); document.getElementById('overlay').innerHTML=''; return o; }));
// 8 perf
const perf = await p.evaluate(()=>{ const s=DB.opps.slice(); for(let i=0;i<5000;i++)DB.opps.push(Object.assign({},s[i%s.length],{id:'z'+i}));
  const t0=performance.now(); go('opps'); const t1=performance.now();
  return {ms:Math.round(t1-t0), dom:document.querySelectorAll('#view *').length}; });
F('5k cơ hội vẽ <200ms ('+perf.ms+'ms, '+perf.dom+' node)', perf.ms<200&&perf.dom<3000);
// 9 sidebar + trí tuệ quan hệ + command palette
const nav = await p.evaluate(()=>({g:[...document.querySelectorAll('.navgrp')].map(e=>e.textContent),
  n:document.querySelectorAll('.side .tab').length, amp:document.body.innerHTML.includes('&amp;amp;')}));
F('sidebar 3 nhóm · 12 mục · không thoát HTML hai lần', nav.g.length===3 && nav.n===12 && !nav.amp);
const rel = await p.evaluate(()=>{const i=relIndex();
  const bad=[...i.values()].filter(r=>!(r.score>=0&&r.score<=100)).length;
  return {n:i.size, bad, cooling:relCooling().length};});
F('điểm quan hệ tính được ('+rel.n+' khách, '+rel.cooling+' đang nguội)', rel.n>5 && rel.bad===0 && rel.cooling>0);
F('sắp xếp theo điểm quan hệ đúng', await p.evaluate(()=>{ go('accounts'); sortBy('rel');
  const a=[...document.querySelectorAll('#view .rel-n')].map(e=>+e.textContent);
  sortBy('rel');
  const d=[...document.querySelectorAll('#view .rel-n')].map(e=>+e.textContent);
  return a.length>3 && a.every((v,i)=>i===0||a[i-1]<=v) && d.every((v,i)=>i===0||d[i-1]>=v); }));
await p.evaluate(()=>go('home')); await p.waitForTimeout(150);
await p.keyboard.press('Control+k'); await p.waitForTimeout(250);
F('⌘K mở command palette', await p.evaluate(()=>!!document.querySelector('.pal')));
/* 'music' chứ không phải 'flyaway': phép kiểm XSS ở trên đã đổi tên bản ghi
   Flyaway, nên gõ 'flyaway' chỉ còn khớp một người liên hệ — test sẽ hỏng vì
   dữ liệu đã bị chính test làm bẩn, không phải vì palette sai. */
await p.keyboard.type('music'); await p.waitForTimeout(250);
F('palette tìm xuyên nhiều loại bản ghi', await p.evaluate(()=>{
  const k=[...document.querySelectorAll('.pal-kind')].map(e=>e.textContent);
  return new Set(k).size>1; }));
await p.keyboard.press('Enter'); await p.waitForTimeout(400);
F('Enter mở bản ghi rồi đóng palette', await p.evaluate(()=>!document.querySelector('.pal') && !!state.oppId));
F('palette tôn trọng phân quyền', await p.evaluate(()=>{ setUser('Hannah Le');
  const mine=palBuild('a').filter(x=>x.k==='opp').length; const all=DB.opps.length;
  setUser('Ethan Nguyen'); return mine<all; }));
F('tên và ngày KHÔNG bị ép font mono', await p.evaluate(()=>{
  go('opps'); openOpp(DB.opps.find(o=>o.stage!=='lost').id);
  const e=document.querySelector('.rec-m-v');
  return !e || !/Plex/.test(getComputedStyle(e).fontFamily); }));

// 10 mobile
const m=await b.newPage({viewport:{width:390,height:844}});
await m.goto(FILE); await m.click('.login-btn'); await m.waitForTimeout(400);
let ov=0; for(const v of ['home','leads','opps','accounts','contacts','tasks','people','approvals','handoff','reports','audit','perms']){
  const r=await m.evaluate(vv=>{go(vv);return document.documentElement.scrollWidth-window.innerWidth;},v); if(r>1)ov++; }
F('390px: không view nào tràn ngang', ov===0);
if(errs.length) FAILED++;
console.log('\nLỗi JS: '+errs.length);
errs.slice(0,5).forEach(e=>console.log('  '+e));
await b.close();
console.log(FAILED ? ('\n'+FAILED+' phép kiểm HỎNG') : '\n24 đạt · 0 hỏng');
process.exit(FAILED?1:0);
