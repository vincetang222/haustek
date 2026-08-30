const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');
const P = '[data-pane="dm"] ';
(async()=>{
const b=await chromium.launch({executablePath: process.env.CHROMIUM || undefined});
const p=await (await b.newContext({viewport:{width:1500,height:1000}})).newPage();
await dungFontThat(p);
const errs=[]; p.on('pageerror',e=>errs.push('pageerror: '+e.message));
p.on('console',m=>{const t=m.text(); if(m.type()==='error'&&!t.includes('Failed to load resource'))errs.push(t)});
await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/design/chon-huong.html#dm',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
const info=()=>p.evaluate(s=>{
  const pane=document.querySelector(s);
  const rows=[...pane.querySelectorAll('tbody tr')];
  return {range:(pane.querySelector('[data-range]')||{}).textContent,
    n:rows.length, dau:rows[0]?rows[0].children[0].innerText.split('\n')[0]:null,
    cot:rows[0]?rows[0].children[5].innerText:null,
    chips:[...pane.querySelectorAll('.dm-chip')].map(c=>c.innerText.replace(/\n/g,' ')),
    foot:(pane.querySelector('[data-foot]')||{}).innerText};
},P.trim());

console.log('BAN ĐẦU  ', JSON.stringify(await info()));
// sắp xếp theo lượt nghe
await p.click(P+'th[data-sort="streams"]'); await p.waitForTimeout(400);
console.log('SẮP LƯỢT NGHE', JSON.stringify(await info()));
// đảo chiều
await p.click(P+'th[data-sort="streams"]'); await p.waitForTimeout(400);
const r2=await info(); console.log('ĐẢO CHIỀU', r2.range, '· dòng đầu', r2.dau);
// lọc theo loại (bấm 2 lần → EP)
await p.click(P+'[data-menu="type"]'); await p.waitForTimeout(300);
await p.click(P+'[data-menu="type"]'); await p.waitForTimeout(400);
const r3=await info(); console.log('LỌC LOẠI ', r3.range, '· chip:', JSON.stringify(r3.chips));
// lọc chủ sở hữu → độc lập
await p.click(P+'[data-menu="owner"]'); await p.waitForTimeout(250);
await p.click(P+'[data-menu="owner"]'); await p.waitForTimeout(400);
const r4=await info(); console.log('THÊM ĐỘC LẬP', r4.range, '· chip:', JSON.stringify(r4.chips));
// tìm
await p.fill(P+'[data-q]','dem'); await p.waitForTimeout(500);
const r5=await info(); console.log('TÌM "dem"', r5.range, '· số dòng', r5.n);
// bỏ hết lọc
const clr=await p.$(P+'[data-clear]');
if(clr){await clr.click(); await p.waitForTimeout(400);}
console.log('BỎ LỌC  ', JSON.stringify((await info()).range));
// phân trang
await p.click(P+'[data-next]'); await p.waitForTimeout(350);
console.log('TRANG SAU', (await info()).range);
// đổi số dòng
await p.selectOption(P+'[data-size]','48'); await p.waitForTimeout(400);
const r6=await info(); console.log('48 DÒNG ', r6.range, '· vẽ ra', r6.n);
// mở ngăn chi tiết
await p.click(P+'tbody tr'); await p.waitForTimeout(500);
const dr=await p.evaluate(s=>{const d=document.querySelector(s+' [data-dr]');
  return {mo:d.classList.contains('on'), txt:d.innerText.replace(/\n/g,' | ').slice(0,260)};},P.trim());
console.log('NGĂN CHI TIẾT mở:',dr.mo);
console.log('   ',dr.txt);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
console.log('ĐÓNG BẰNG ESC:', !(await p.evaluate(s=>document.querySelector(s+' [data-dr]').classList.contains('on'),P.trim())));
// bảng rỗng
await p.fill(P+'[data-q]','zzzzzz'); await p.waitForTimeout(500);
console.log('RỖNG:', await p.evaluate(s=>{const e=document.querySelector(s+' [data-empty]');return e.innerText.replace(/\n/g,' | ');},P.trim()));
await b.close();
console.log('\nlỗi:',errs.length); errs.slice(0,5).forEach(e=>console.log(' ',e));
})().catch(e=>{console.error('HARNESS:',e.message);process.exit(2)});
