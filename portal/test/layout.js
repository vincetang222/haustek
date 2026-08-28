const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for(const W of [1500,1280,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:1000}})).newPage();
  await dungFontThat(p);
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{const t=m.text(); if(m.type()==='error'&&!t.includes('Failed to load resource'))errs.push(t)});
  await p.goto('http://127.0.0.1:8099/design/chon-huong.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(1200);
  if(W===1500){
    const f=await p.evaluate(()=>{const s=document.createElement('span');
      s.style.font='16px "Be Vietnam Pro"';s.textContent='Đêm';document.body.appendChild(s);
      const w1=s.offsetWidth; s.style.font='16px monospace'; const w2=s.offsetWidth; s.remove();
      return {beVietnam:w1, mono:w2, khac:w1!==w2};});
    console.log('font thật đã nạp:', f.khac?'CÓ':'KHÔNG', JSON.stringify(f));
  }
  const out=[];
  for(const w of ['d1','d2','d3','a','b','c']){
    await p.click('[data-p="'+w+'"]').catch(()=>{}); await p.waitForTimeout(700);
    const bad=await p.evaluate(x=>{
      const pane=document.querySelector('[data-pane="'+x+'"]'); if(!pane)return ['chưa có'];
      const r=[];
      pane.querySelectorAll('*').forEach(e=>{
        if(e.children.length)return;
        const t=(e.textContent||'').trim(); if(!t)return;
        if(e.scrollWidth>e.clientWidth+2 && getComputedStyle(e).overflow!=='visible') r.push('cắt: '+t.slice(0,30));
        const er=e.getBoundingClientRect(), pr=pane.getBoundingClientRect();
        if(er.width>0 && (er.right>pr.right+1||er.left<pr.left-1)) r.push('tràn: '+t.slice(0,30));
      });
      return [...new Set(r)].slice(0,3);
    },w);
    out.push(w.toUpperCase()+(bad.length?' '+bad.join(' | '):' ok'));
  }
  console.log(W+'px · '+out.join(' · '));
  if(errs.length) console.log('   lỗi:',errs.slice(0,3).join(' | '));
  await p.context().close();
}
await b.close();
})().catch(e=>{console.error(e.message);process.exit(2)});
