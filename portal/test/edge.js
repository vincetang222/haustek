/* Trường hợp biên: thu hồi duyệt SẠCH mọi kỳ rồi mở lại từng màn hình. */
const { chromium } = require('playwright');
require('fs').mkdirSync(process.env.SHOTS || (__dirname + '/shots'), { recursive: true });
(async()=>{
const b=await chromium.launch({executablePath: process.env.CHROMIUM || undefined});
const ctx=await b.newContext({viewport:{width:1500,height:1050}});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push('[intra] '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))errs.push('[intra] '+m.text())});
await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/intranet.html',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(1800);
const n=await p.evaluate(()=>{const A=HAUSTEK.admin;let c=0;
  for(let i=A.periods.length-1;i>=0;i--){ if(A.isApproved(A.periods[i].k)){ try{A.revoke(i,'thử biên');c++;}catch(e){return 'LỖI thu hồi kỳ '+A.periods[i].label+': '+e.message;} } }
  return c;});
console.log('đã thu hồi',n,'kỳ · còn duyệt:',await p.evaluate(()=>Object.keys(HAUSTEK.admin.state().approved).length));
for(const id of ['overview','ingest','match','close','rates','advances','payouts','catalog','accounts','questions']){
  await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/intranet.html#' + id,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1100);
  const r=await p.evaluate(()=>{const e=document.getElementById('screen');
    const bad=e.innerHTML.includes('Màn hình này lỗi');
    return {bad,msg:bad?(e.querySelector('.hint')||{}).textContent:'',txt:e.innerText.replace(/\n+/g,' | ').slice(0,90)};});
  console.log(`  ${r.bad?'LỖI':'ok '} ${id.padEnd(10)} ${r.bad?'>>> '+r.msg:r.txt}`);
}
// cổng khách khi không kỳ nào mở
const d=await ctx.newPage();
d.on('pageerror',e=>errs.push('[dash] '+e.message));
await d.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/dashboard.html',{waitUntil:'networkidle'});
await d.waitForTimeout(1500);
console.log('CỔNG KHÁCH khi chưa kỳ nào mở:',await d.evaluate(()=>document.getElementById('gateNote').innerText.replace(/\n/g,' | ')));
console.log('  ô chọn kỳ:',await d.evaluate(()=>document.getElementById('period').options.length),'mục');
await d.screenshot({path: (process.env.SHOTS || (__dirname + '/shots')) + '/dash-empty.png',fullPage:true});
await b.close(); console.log('\nlỗi:',errs.length); errs.slice(0,10).forEach(e=>console.log(' ',e));
process.exit(errs.length ? 1 : 0);
})().catch(e=>{console.error('HARNESS:',e.message);process.exit(2)});
