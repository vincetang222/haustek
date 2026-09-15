/* =====================================================================
   KIỂM TRA CRM — chạy thật trong Chromium bằng Playwright
   ---------------------------------------------------------------------
   Khác với api-guard.js (chạy thẳng trên lõi, không cần trình duyệt):
   crm.html là một file HTML với script nội tuyến, đụng vào document ngay
   lúc nạp, nên phải kiểm trong trình duyệt thật.

   42 phép kiểm, phủ đúng những gì dễ vỡ nhất khi sửa file 5000+ dòng này:
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

// 10 chuỗi duyệt hai cấp, saved views, bulk actions
/* Tắt STORE_READY trước khi xoá: handler 'pagehide' gọi saveNow() lúc rời trang
   nên xoá xong mà reload ngay thì trạng thái cũ được ghi lại y nguyên. */
await p.evaluate(()=>{ window.STORE_READY = false; localStorage.clear(); });
await p.reload(); await p.waitForTimeout(1000); await p.click('.login-btn'); await p.waitForTimeout(400);

const chain = await p.evaluate(()=>{
  const big = DB.opps.find(o=>o.stage==='negotiation' && o.amount>REGION_THRESHOLD);
  const small = DB.opps.find(o=>o.stage==='negotiation' && o.amount>0 && o.amount<REGION_THRESHOLD);
  advance(big.id,1); advance(small.id,1);
  const afterSubmit = {big:DB.opps.find(o=>o.id===big.id).stage, small:DB.opps.find(o=>o.id===small.id).stage};
  setUser('Trần Quốc Bảo');                 /* sếp country */
  advance(big.id,1); advance(small.id,1);
  const afterCountry = {big:DB.opps.find(o=>o.id===big.id).stage, small:DB.opps.find(o=>o.id===small.id).stage};
  setUser('Priya Raman');                   /* sếp vùng */
  advance(big.id,1);
  const afterRegion = DB.opps.find(o=>o.id===big.id).stage;
  setUser('Ethan Nguyen');
  return {bigAmt:big.amount, smallAmt:small.amount, thr:REGION_THRESHOLD, afterSubmit, afterCountry, afterRegion, bigId:big.id};
});
F('A&R trình lên sếp country', chain.afterSubmit.big==='waiting' && chain.afterSubmit.small==='waiting');
F('deal lớn qua country thì tới sếp vùng', chain.afterCountry.big==='region');
F('deal nhỏ ('+chain.smallAmt+'<'+chain.thr+') bỏ qua sếp vùng, lên thẳng portal', chain.afterCountry.small==='portal');
F('deal CHƯA điền giá trị vẫn phải qua sếp vùng', await p.evaluate(()=>{
  const o=DB.opps.find(x=>x.stage==='negotiation' && !x.amount);
  if(!o) return true;
  advance(o.id,1); setUser('Trần Quốc Bảo'); advance(o.id,1);
  const st=DB.opps.find(x=>x.id===o.id).stage; setUser('Ethan Nguyen');
  return st==='region'; }));
F('sếp vùng duyệt xong thì lên portal', chain.afterRegion==='portal');
F('sếp country KHÔNG ký thay được cấp vùng', await p.evaluate(()=>{
  const o=DB.opps.find(x=>x.stage==='region'); if(!o) return true;
  setUser('Trần Quốc Bảo'); const ok=canAdvance(o); setUser('Ethan Nguyen'); return !ok; }));
F('A&R KHÔNG tự duyệt deal của mình được', await p.evaluate(()=>{
  const o=DB.opps.find(x=>x.stage==='waiting'); if(!o) return true;
  setUser('Nguyen Ngoc Lam'); const ok=canAdvance(o); setUser('Ethan Nguyen'); return !ok; }));
F('từ chối trả deal về đàm phán, không giết deal', await p.evaluate(()=>{
  const o=DB.opps.find(x=>x.stage==='waiting'); if(!o) return true;
  advance(o.id,0); return DB.opps.find(x=>x.id===o.id).stage==='negotiation'; }));
F('CRM không đẩy tiếp được giai đoạn do portal cầm', await p.evaluate(()=>{
  const o=DB.opps.find(x=>x.stage==='won'); const s0=o.stage;
  advance(o.id,1); return DB.opps.find(x=>x.id===o.id).stage===s0; }));
F('bàn giao lấy deal từ giai đoạn portal trở đi', await p.evaluate(id=>
  handoffRows().some(r=>r.dealId===id), chain.bigId));

// saved views
await p.evaluate(()=>{ go('opps'); setOppF('negotiation'); sortBy('amount');
  state.views={}; state.views.opps=[Object.assign({name:'Deal đàm phán'}, viewSnap('opps'))];
  setOppF('all'); state.sort={key:null,dir:1}; render(); });
F('view đã lưu hiện thành chip', await p.evaluate(()=>!!document.querySelector('#view .viewchip')));
F('bấm view khôi phục đúng bộ lọc và thứ tự', await p.evaluate(()=>{
  viewApply('opps',0); return state.oppFilter==='negotiation' && state.sort.key==='amount'; }));
F('view sống qua reload', await p.evaluate(()=>{ saveNow(); return true; }));
await p.reload(); await p.waitForTimeout(800);
F('view còn sau khi tải lại', await p.evaluate(()=>viewsFor('opps').length===1));

// bulk actions
const bulk = await p.evaluate(()=>{
  go('opps');
  const ids = DB.opps.filter(o=>o.stage==='negotiation' && o.owner===ME).slice(0,3).map(o=>o.id);
  ids.forEach(id=>selToggle('opps', id));
  return {n:state.sel.ids.length, kind:state.sel.kind, bar:!!document.querySelector('.bulkbar')};
});
F('chọn nhiều dòng hiện thanh hành động ('+bulk.n+')', bulk.n===3 && bulk.bar);
F('đổi tab thì bỏ lựa chọn', await p.evaluate(()=>{ go('leads'); return state.sel.ids.length===0; }));
F('chọn một loại khác thì bỏ lựa chọn cũ', await p.evaluate(()=>{
  go('opps'); selToggle('opps', DB.opps[0].id);
  selToggle('leads', DB.leads[0].id);
  return state.sel.kind==='leads' && state.sel.ids.length===1; }));
F('duyệt hàng loạt chỉ chạm deal đúng quyền', await p.evaluate(()=>{
  selClear(); go('opps');
  const mine = DB.opps.filter(o=>o.stage==='negotiation' && canEdit(o.owner)).slice(0,2);
  mine.forEach(o=>selToggle('opps', o.id));
  bulkRun('advance');
  return mine.every(o=>DB.opps.find(x=>x.id===o.id).stage==='waiting'); }));

// xuất file: cùng một hàm phải chạy được cả trên web server thật lẫn trong
// khung xem artifact, nên kiểm cả hai nhánh thay vì chỉ nhánh đang chạy ở đây
const dlres = await p.evaluate(async ()=>{
  const out = {}, realClick = HTMLAnchorElement.prototype.click;
  let anchors = [];
  HTMLAnchorElement.prototype.click = function(){ anchors.push({name:this.download, href:this.href}); };
  const wait = ()=>new Promise(r=>setTimeout(r,80));

  DL_CAP = undefined; delete window.claude; anchors = [];
  saveFile('a.json','{}','application/json'); await wait();
  out.fallback = anchors.length===1 && anchors[0].name==='a.json' && anchors[0].href.indexOf('blob:')===0;

  let got = null; DL_CAP = undefined; anchors = [];
  window.claude = { use: n => Promise.resolve(n==='downloads'
    ? { save: r => { got = r; return Promise.resolve({status:'saved'}); } } : null) };
  saveFile('b.csv','x,y','text/csv'); await wait();
  out.viaCap = !!got && got.filename==='b.csv' && got.data instanceof Blob && anchors.length===0;

  DL_CAP = undefined; anchors = [];
  window.claude = { use: () => Promise.resolve({ save: () => Promise.reject({code:'declined'}) }) };
  saveFile('c.json','{}','application/json'); await wait();
  out.declined = anchors.length===0;

  DL_CAP = undefined; anchors = [];
  window.claude = { use: () => Promise.reject(new Error('nổ')) };
  saveFile('d.json','{}','application/json'); await wait();
  out.broken = anchors.length===1;

  HTMLAnchorElement.prototype.click = realClick; delete window.claude; DL_CAP = undefined;
  return out;
});
F('không có capability thì xuất bằng thẻ <a download>', dlres.fallback);
F('có capability thì đẩy Blob qua downloads.save', dlres.viaCap);
F('người xem từ chối thì không mở thêm đường tải khác', dlres.declined);
F('capability lỗi thì vẫn rơi về thẻ <a>', dlres.broken);

// 11 mobile
const m=await b.newPage({viewport:{width:390,height:844}});
await m.goto(FILE); await m.click('.login-btn'); await m.waitForTimeout(400);
let ov=0; for(const v of ['home','leads','opps','accounts','contacts','tasks','people','approvals','handoff','reports','audit','perms']){
  const r=await m.evaluate(vv=>{go(vv);return document.documentElement.scrollWidth-window.innerWidth;},v); if(r>1)ov++; }
F('390px: không view nào tràn ngang', ov===0);
if(errs.length) FAILED++;
console.log('\nLỗi JS: '+errs.length);
errs.slice(0,5).forEach(e=>console.log('  '+e));
await b.close();
console.log(FAILED ? ('\n'+FAILED+' phép kiểm HỎNG') : '\n46 đạt · 0 hỏng');
process.exit(FAILED?1:0);
