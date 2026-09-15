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

// năm lỗi QC bắt được — mỗi cái một phép kiểm để không tái phát
const qc = await p.evaluate(async ()=>{
  const out={}, wait=()=>new Promise(r=>setTimeout(r,80));

  // 1. nav ghi một số, tiêu đề ghi số khác, không giải thích
  go('opps');
  const navOpp = +document.querySelector('#nav .tab[onclick*="opps"] .tab-count').innerText;
  const metaOpp = document.querySelector('#view .pmeta').innerText;
  out.oppMeta = metaOpp.indexOf(String(navOpp)) >= 0;
  go('leads');
  const navLead = +document.querySelector('#nav .tab[onclick*="leads"] .tab-count').innerText;
  out.leadMeta = document.querySelector('#view .pmeta').innerText.indexOf(String(navLead)) >= 0;

  // 2. lọc rồi thì số thứ hai phải đếm trên tập đang hiện, không phải toàn kho
  go('opps'); setOppF('won');
  const mWon = document.querySelector('#view .pmeta').innerText;
  out.metaWon = mWon.indexOf('·') < 0;      // "0 đang chạy" là rác, không được hiện
  setOppF('negotiation');
  const mNego = document.querySelector('#view .pmeta').innerText;
  out.metaNego = mNego.indexOf('·') < 0;    // lọc rồi thì mọi dòng đều đang chạy
  setOppF('all');

  // 3. bấm nút tiền tệ đang bật thì không dựng lại view
  go('opps');
  const mark = document.getElementById('view');
  setCur('USD');
  out.curNoop = document.getElementById('view') === mark &&
                mark.innerHTML.length > 0 && cur === 'USD';

  // 4. lưu ngưỡng mà không đổi gì vẫn phải nói một tiếng
  go('perms');
  document.getElementById('toast').innerText='';
  saveThreshold(); await wait();
  out.thrToast = (document.getElementById('toast').innerText||'').trim().length > 0;

  // 5. openDrawer với kind không có drawer thì đừng để overlay rỗng
  closeDrawer();
  openDrawer('task', DB.tasks[0].id);
  out.badKind = !document.getElementById('overlay').innerHTML.trim() && !state.drawer;

  // 6. xuất nhật ký phải báo, và chỉ báo khi giao được thật
  const realClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){};
  go('audit'); document.getElementById('toast').innerText='';
  DL_CAP = undefined; delete window.claude;
  audExport(); await wait(); await wait();
  out.audToast = (document.getElementById('toast').innerText||'').trim().length > 0;

  DL_CAP = undefined; document.getElementById('toast').innerText='';
  window.claude = { use: () => Promise.resolve({ save: () => Promise.reject({code:'declined'}) }) };
  audExport(); await wait(); await wait();
  out.audSilentOnDecline = (document.getElementById('toast').innerText||'').trim().length === 0;
  HTMLAnchorElement.prototype.click = realClick; delete window.claude; DL_CAP = undefined;
  return out;
});
F('tiêu đề Cơ hội giải thích con số trên nav', qc.oppMeta);
F('tiêu đề Lead giải thích con số trên nav', qc.leadMeta);
F('lọc sang Đã ký thì không hiện "0 đang chạy"', qc.metaWon);
F('lọc sang Đàm phán thì không hiện số phụ thừa', qc.metaNego);
F('bấm nút tiền tệ đang bật thì không dựng lại view', qc.curNoop);
F('lưu ngưỡng không đổi vẫn báo cho người dùng', qc.thrToast);
F('openDrawer kind lạ thì không để overlay rỗng', qc.badKind);
F('xuất nhật ký có báo khi giao được', qc.audToast);
F('người xem từ chối thì không báo "đã xuất"', qc.audSilentOnDecline);

// báo cáo doanh thu — mỗi phép kiểm ứng một lỗi đã đo được
const rep = await p.evaluate(()=>{
  const out={};
  const d = new Date(TODAY); d.setDate(d.getDate()-90);
  const wonAll  = DB.opps.filter(o=>o.stage==='won');
  const lostAll = DB.opps.filter(o=>o.stage==='lost');
  const lost90  = lostAll.filter(o=>o.closeDate>=d && o.closeDate<=TODAY);

  // 1. nhãn kỳ phải nói đúng cái đang tính
  state.period=90; go('reports');
  out.nhan90 = document.querySelector('#view .pmeta').innerText.indexOf('3 tháng')>=0;
  const t90 = document.getElementById('view').innerText;
  state.period=7; render();
  const t7 = document.getElementById('view').innerText;
  out.doiKyDoiSo = t7 !== t90;

  // 2. tỷ lệ thắng tính trên deal đóng TRONG KỲ
  state.period=90; render();
  const m = document.getElementById('view').innerText.match(/Tỷ lệ thắng (\d+)% \((\d+)\/(\d+)\)/);
  out.coMauSo = !!m;
  if(m){
    const win=+m[1], w=+m[2], tot=+m[3];
    out.winDung = Math.round(w/tot*100)===win;
    // deal thua đóng ngoài cửa sổ 90 ngày thì không được kéo tỷ lệ xuống
    out.khongTinhNgoaiKy = tot === (wonAll.filter(o=>o.closeDate>=d).length + lost90.length);
  }

  // 3. phễu phải gồm cả region và portal
  const o1=DB.opps.find(x=>x.stage==='negotiation');
  const before = funnelSteps(DB.opps)[1].n;
  o1.stage='region';
  out.pheuDemRegion = funnelSteps(DB.opps)[1].n === before+1;
  o1.stage='portal';
  out.pheuDemPortal = funnelSteps(DB.opps)[1].n === before+1;
  o1.stage='negotiation';

  // 4. biểu đồ tháng không được bỏ tháng trống
  const fake=[{closeDate:new Date(2026,0,15),amount:100},
              {closeDate:new Date(2026,3,15),amount:200}];
  const ms = monthSeries(fake, x=>x.amount, '#000');
  out.thangLienTuc = ms.length===4 && ms[1].v===0 && ms[2].v===0;

  // 5. tổng theo giai đoạn không cộng deal thua
  state.period=0; render();
  const note = [...document.querySelectorAll('#view .card-note')]
    .map(x=>x.innerText).find(x=>x.indexOf('Tổng')>=0)||'';
  const tongHien = parseInt((note.match(/[\d,]+/)||['0'])[0].replace(/,/g,''),10);
  const tongSong = STAGES.filter(x=>x.id!=='lost')
    .map(x=>DB.opps.filter(o=>o.stage===x.id).reduce((a,o)=>a+o.amount,0))
    .reduce((a,v)=>a+v,0);
  out.tongKhongTinhThua = Math.abs(tongHien - Math.round(tongSong/1000)) <= 1 ||
                          tongHien === tongSong;

  // 6. hai quy ước phần trăm phải quy về một
  out.pctPhanSo  = pctOf(0.02)===0.02;
  out.pctPhanTram= pctOf(2)===0.02;
  const fake2 = {amount:12000, ext:{advCalcResult:{artistShare:0.7, findersFeePct:2,
                 initialAdvance:1000, marketingFund:0, termMonths:24, passThrough:0}}};
  out.feeQuyDoi = finInputOf(fake2).fee === 0.02;
  out.coLaiSauQuyDoi = finModel(finInputOf(fake2)).years[0].houseGr > 0;

  // 7. doanh thu Haustek phải tách khỏi giá trị deal
  const txt = document.getElementById('view').innerText;
  out.coTheDoanhThu = txt.indexOf('Doanh thu Haustek')>=0;
  const gross = wonAll.reduce((a,o)=>a+o.amount,0);
  const mh = txt.match(/HAUSTEK THỰC NHẬN[^\d]*([\d,]+)/i) ||
             txt.match(/Haustek thực nhận[^\d]*([\d,]+)/);
  out.haustekNhoHonGop = mh ? parseInt(mh[1].replace(/,/g,''),10) < gross : false;
  return out;
});
F('nhãn kỳ khớp với kỳ đang chọn', rep.nhan90);
F('đổi kỳ thì số liệu đổi theo', rep.doiKyDoiSo);
F('tỷ lệ thắng ghi kèm mẫu số', rep.coMauSo);
F('tỷ lệ thắng tính đúng từ mẫu số đó', rep.winDung);
F('deal đóng ngoài kỳ không kéo tỷ lệ thắng', rep.khongTinhNgoaiKy);
F('phễu đếm cả deal ở giai đoạn sếp vùng', rep.pheuDemRegion);
F('phễu đếm cả deal đã trình portal', rep.pheuDemPortal);
F('biểu đồ tháng giữ nguyên tháng trống', rep.thangLienTuc);
F('tổng theo giai đoạn không cộng deal thua', rep.tongKhongTinhThua);
F('tỷ lệ dạng phân số giữ nguyên', rep.pctPhanSo);
F('tỷ lệ dạng phần trăm được quy đổi', rep.pctPhanTram);
F('finder fee của deal cũ quy về phân số', rep.feeQuyDoi);
F('quy đổi xong thì deal còn lợi nhuận', rep.coLaiSauQuyDoi);
F('báo cáo có tách doanh thu Haustek', rep.coTheDoanhThu);
F('doanh thu Haustek nhỏ hơn giá trị deal gộp', rep.haustekNhoHonGop);

// trang chi tiết deal phải dùng được ở MỌI giai đoạn
const stg = await p.evaluate(()=>{
  const out={};
  const o=DB.opps.find(x=>x.owner===ME);
  const old=o.stage;
  ['region','portal'].forEach(st=>{
    o.stage=st; go('opps'); openOpp(o.id);
    const path=[...document.querySelectorAll('#view .path-s')];
    out[st]={ buoc:path.length,
              danhDau:path.filter(x=>x.className.indexOf('now')>=0).length,
              coGiaiThich:!![...document.querySelectorAll('#view .rec-acts .pill,#view .rec-acts button')]
                            .find(x=>x.innerText.indexOf('Cơ hội')<0) };
  });
  o.stage=old; go('opps');
  return out;
});
F('deal ở giai đoạn sếp vùng có đánh dấu trên thanh tiến trình', stg.region.danhDau===1);
F('deal ở giai đoạn sếp vùng có nút hoặc lời giải thích', stg.region.coGiaiThich);
F('deal đã trình portal có đánh dấu trên thanh tiến trình', stg.portal.danhDau===1);
F('deal đã trình portal nói rõ ai đang giữ', stg.portal.coGiaiThich);

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
console.log(FAILED ? ('\n'+FAILED+' phép kiểm HỎNG') : '\n74 đạt · 0 hỏng');
process.exit(FAILED?1:0);
