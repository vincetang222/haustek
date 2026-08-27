const { chromium } = require('playwright'); const fs=require('fs');
const OUT = process.env.SHOTS || (__dirname + '/shots'); fs.mkdirSync(OUT,{recursive:true});
const errs=[];
(async()=>{
const b=await chromium.launch({executablePath: process.env.CHROMIUM || undefined});
const ctx=await b.newContext({viewport:{width:1500,height:1050}});
const p=await ctx.newPage();
p.on('pageerror',e=>errs.push('pageerror: '+e.message+'\n  '+(e.stack||'').split('\n').slice(1,4).join('\n  ')));
p.on('console',m=>{const t=m.text(); if(m.type()==='error'&&!t.includes('Failed to load resource'))errs.push('console.error: '+t)});
await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/intranet.html',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2000);
const screens=await p.evaluate(()=>HAUSTEK.screens.map(s=>s.id));
console.log('đã đăng ký:',screens.join(', '));
for(const id of screens){
  await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/intranet.html#'+id,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1400);
  const r=await p.evaluate(()=>{const e=document.getElementById('screen');
    const bad=e.innerHTML.includes('Màn hình này lỗi');
    return {len:e.innerHTML.length,bad,msg:bad?(e.querySelector('.hint')||{}).textContent:'',
      txt:e.innerText.replace(/\n+/g,' | ').slice(0,260)};});
  console.log(`${r.bad?'LỖI':'ok '} ${id.padEnd(11)} ${String(r.len).padStart(6)}c  ${r.bad?'>>> '+r.msg:r.txt}`);
  await p.screenshot({path:`${OUT}/in-${id}.png`,fullPage:true});
  // đổi sang kỳ chưa duyệt để bắt lỗi trường hợp biên
  await p.selectOption('#period','11'); await p.waitForTimeout(1100);
  const r2=await p.evaluate(()=>{const e=document.getElementById('screen');
    return {bad:e.innerHTML.includes('Màn hình này lỗi'),msg:e.innerHTML.includes('Màn hình này lỗi')?(e.querySelector('.hint')||{}).textContent:''};});
  if(r2.bad) console.log(`    LỖI ở kỳ 07/2026: ${r2.msg}`);
  await p.selectOption('#period','9'); await p.waitForTimeout(400);
  // VND
  await p.click('[data-cur=VND]'); await p.waitForTimeout(900);
  const r3=await p.evaluate(()=>document.getElementById('screen').innerHTML.includes('Màn hình này lỗi'));
  if(r3) console.log('    LỖI ở chế độ VND');
  await p.click('[data-cur=USD]'); await p.waitForTimeout(300);
}
await b.close();
console.log('\n=== LỖI ('+errs.length+') ==='); errs.slice(0,30).forEach(e=>console.log(e));
})().catch(e=>{console.error('HARNESS:',e);process.exit(2)});
