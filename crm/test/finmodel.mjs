/* Kiểm mô hình tài chính bằng số TÍNH TAY, không phải bằng chính nó.
   Mỗi phép kiểm dưới đây có một con số mà người đọc tự nhân chia lại được. */
/* Nạp Playwright theo cách DI ĐỘNG, giống bốn bộ kiểm còn lại.
   Trước đây file này nhúng cứng /opt/node22/lib/node_modules/playwright/index.mjs
   — đường dẫn của đúng một máy. Nó xanh ở máy đó và ERR_MODULE_NOT_FOUND ở mọi
   nơi khác; CI bắt được ngay lần chạy thật đầu tiên trên main. */
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

async function loadChromium() {
  for (const m of ['playwright', 'playwright-core', '@playwright/test']) {
    try { return (await import(m)).chromium; } catch (e) {}
  }
  try {
    const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return (await import(pathToFileURL(path.join(root, 'playwright', 'index.mjs')).href)).chromium;
  } catch (e) {}
  console.error('Cần Playwright:  npm i -D playwright   (hoặc npm i -g playwright)');
  process.exit(2);
}
const chromium = await loadChromium();

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const PORT = 8273;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const srv = http.createServer((rq, rs) => {
  const f = path.resolve(ROOT, decodeURIComponent(rq.url.split('?')[0]).replace(/^\/+/, ''));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control':'no-store' });
  fs.createReadStream(f).pipe(rs);
});
await new Promise(r => srv.listen(PORT, '127.0.0.1', r));

const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 180)));
await p.goto('http://127.0.0.1:' + PORT + '/crm/index.html');
await p.waitForTimeout(600);
await p.click('.login-btn');
await p.waitForTimeout(350);

let FAILED = 0;
const F = (name, cond, got) => {
  if (cond) console.log('  ok    ' + name);
  else { FAILED++; console.log('  LỖI  ' + name + (got !== undefined ? '  → ' + got : '')); }
};
const near = (a, b2, tol) => Math.abs(a - b2) <= (tol === undefined ? 0.5 : tol);

/* Kịch bản gốc, mọi con số dưới đây suy ra từ đây:
   1.000/tháng gộp · nghệ sĩ 70% · advance 10.000 · 72 tháng · không trôi, không phí
   → Haustek giữ 300/tháng, thu hồi 700/tháng
   → thu đủ 10.000 sau 14 tháng ×700 = 9.800, tháng 15 lấy nốt 200
   → hoà vốn tiền mặt đúng tháng thứ 10 (10 × 1.000 = 10.000) */
const BASE = { gross:1000, share:0.7, pass:0, dist:0, fee:0,
               adv:10000, mkt:0, prod:0, term:72, growth:0, disc:12, recoupMkt:1 };

const r = await p.evaluate(i => {
  const m = finModel(i);
  return { outlay:m.outlay, inflow:m.inflow, profit:m.profit, multiple:m.multiple,
           payback:m.payback, recoupMonth:m.recoupMonth, irr:m.irr, npv:m.npv,
           nYears:m.years.length, y1:m.years[0], y2:m.years[1], y6:m.years[5],
           m1:m.months[0], m15:m.months[14], m16:m.months[15] };
}, BASE);

console.log('\n— nền tảng —');
F('vốn bỏ ra = advance', near(r.outlay, 10000), r.outlay);
F('tháng 1 Haustek giữ 300 + thu hồi 700 = 1.000', near(r.m1.net, 1000), r.m1.net);
F('tháng 15 chỉ thu nốt 200 nên chỉ còn 500', near(r.m15.net, 500), r.m15.net);
F('tháng 16 hết thu hồi, chỉ còn 300', near(r.m16.net, 300), r.m16.net);
F('thu hồi xong ở tháng 15', r.recoupMonth === 15, r.recoupMonth);
F('hoà vốn tiền mặt ở tháng 10', r.payback === 10, r.payback);

/* tổng tiền về = 14×1.000 + 500 + 57×300 = 31.600 */
F('tổng tiền về 31.600', near(r.inflow, 31600), r.inflow);
F('lợi nhuận 21.600', near(r.profit, 21600), r.profit);
F('bội số vốn 3,16 lần', near(r.multiple, 3.16, 0.01), r.multiple);
F('72 tháng chia thành 6 năm', r.nYears === 6, r.nYears);

/* năm 1: 12 tháng đầu đều đang thu hồi → 12 × 1.000 = 12.000, trừ vốn 10.000 */
F('năm 1 thu 12.000', near(r.y1.net, 12000), r.y1.net);
F('năm 1 lời 2.000 sau khi trừ vốn', near(r.y1.profit, 2000), r.y1.profit);
/* năm 2: tháng 13,14 còn thu hồi (2×1.000), tháng 15 = 500, 9 tháng cuối = 300 */
F('năm 2 thu 5.200', near(r.y2.net, 5200), r.y2.net);
F('năm 6 chỉ còn phần chia 3.600', near(r.y6.net, 3600), r.y6.net);

/* ---- đây là chỗ bảng cũ tính thiếu ---- */
const old = await p.evaluate(i => {
  const net = i.gross * (1 - i.share);
  return { total: net * i.term, roi: (net * i.term) / i.adv };
}, BASE);
console.log('\n— so với bảng ROI cũ —');
console.log('  cũ : tổng thu ' + old.total + ' · ROI ' + old.roi.toFixed(2) + ' lần');
console.log('  mới: tổng thu ' + Math.round(r.inflow) + ' · bội số ' + r.multiple.toFixed(2) + ' lần');
F('chênh lệch đúng bằng advance được thu hồi', near(r.inflow - old.total, 10000), r.inflow - old.total);
F('bội số mới hơn ROI cũ đúng 1,00 lần', near(r.multiple - old.roi, 1, 0.01), r.multiple - old.roi);

console.log('\n— giá trị thời gian —');
F('NPV nhỏ hơn lợi nhuận danh nghĩa', r.npv < r.profit, r.npv.toFixed(0) + ' < ' + r.profit);
F('NPV vẫn dương ở deal này', r.npv > 0, r.npv.toFixed(0));
F('IRR nằm trong khoảng hợp lý', r.irr > 0.5 && r.irr < 5, r.irr);

const disc = await p.evaluate(i => {
  const a = finModel(Object.assign({}, i, {disc:0})).npv;
  const b = finModel(Object.assign({}, i, {disc:30})).npv;
  return {a, b};
}, BASE);
F('chiết khấu cao hơn thì NPV thấp hơn', disc.b < disc.a, disc.b.toFixed(0) + ' < ' + disc.a.toFixed(0));
F('chiết khấu 0% thì NPV = lợi nhuận danh nghĩa', near(disc.a, r.profit, 1), disc.a);

console.log('\n— doanh thu trôi xuống —');
const dk = await p.evaluate(i => {
  const flat = finModel(Object.assign({}, i, {growth:0}));
  const down = finModel(Object.assign({}, i, {growth:-12}));
  const up   = finModel(Object.assign({}, i, {growth:12}));
  return { flat:flat.inflow, down:down.inflow, up:up.inflow,
           y1down:down.years[0].gross, y2down:down.years[1].gross };
}, BASE);
F('trôi xuống thì thu ít hơn phẳng', dk.down < dk.flat, Math.round(dk.down) + ' < ' + Math.round(dk.flat));
F('tăng trưởng thì thu nhiều hơn phẳng', dk.up > dk.flat, Math.round(dk.up) + ' > ' + Math.round(dk.flat));
/* -12%/năm: doanh thu gộp năm 2 phải xấp xỉ 88% năm 1 */
F('năm 2 còn ~88% năm 1 khi trôi 12%/năm',
  near(dk.y2down / dk.y1down, 0.88, 0.005), (dk.y2down / dk.y1down).toFixed(3));

console.log('\n— thu hồi và pass-through —');
const pt = await p.evaluate(i => {
  const no = finModel(Object.assign({}, i, {pass:0}));
  const half = finModel(Object.assign({}, i, {pass:0.5}));
  return { noM:no.recoupMonth, halfM:half.recoupMonth, noIn:no.inflow, halfIn:half.inflow };
}, BASE);
F('trả lại nghệ sĩ 50% thì thu hồi lâu gấp đôi', pt.halfM === 29 || pt.halfM === 30, pt.halfM);
F('pass-through không làm đổi tổng tiền Haustek nhận về',
  near(pt.noIn, pt.halfIn, 1), Math.round(pt.noIn) + ' vs ' + Math.round(pt.halfIn));

console.log('\n— trường hợp biên —');
const edge = await p.evaluate(i => {
  const zero = finModel(Object.assign({}, i, {gross:0}));
  const noAdv = finModel(Object.assign({}, i, {adv:0, mkt:0, prod:0}));
  const huge = finModel(Object.assign({}, i, {adv:5000000}));
  const share1 = finModel(Object.assign({}, i, {share:1}));
  const bad = finModel(Object.assign({}, i, {share:5, pass:-3, term:0, growth:0}));
  return {
    zeroIn: zero.inflow, zeroIrr: zero.irr, zeroPay: zero.payback,
    noAdvIrr: noAdv.irr, noAdvVerdict: finVerdict(noAdv).k,
    hugeIrr: huge.irr, hugePay: huge.payback, hugeVerdict: finVerdict(huge).k,
    share1In: share1.inflow, share1Recoup: share1.recoupMonth,
    badYears: bad.years.length, badFinite: isFinite(bad.inflow) && isFinite(bad.npv)
  };
}, BASE);
F('doanh thu 0 thì không có tiền về', near(edge.zeroIn, 0), edge.zeroIn);
F('doanh thu 0 thì không hoà vốn', edge.zeroPay === 0, edge.zeroPay);
F('doanh thu 0 thì IRR không tồn tại', edge.zeroIrr === null, edge.zeroIrr);
F('không bỏ vốn thì IRR vô nghĩa, không phải vô cực', edge.noAdvIrr === null, edge.noAdvIrr);
F('không bỏ vốn thì kết luận là "không áp dụng"', edge.noAdvVerdict === 'na', edge.noAdvVerdict);
F('advance quá lớn thì không hoà vốn trong kỳ', edge.hugePay === 0, edge.hugePay);
F('advance quá lớn thì kết luận là lỗ', edge.hugeVerdict === 'bad', edge.hugeVerdict);
/* nghệ sĩ 100%: Haustek không giữ gì, nhưng vẫn thu hồi được advance */
F('nghệ sĩ 100% thì Haustek chỉ thu về đúng phần advance',
  near(edge.share1In, 10000), edge.share1In);
F('nghệ sĩ 100% vẫn thu hồi xong', edge.share1Recoup > 0, edge.share1Recoup);
F('tham số vô lý không làm vỡ mô hình', edge.badFinite && edge.badYears >= 1,
  edge.badYears + '/' + edge.badFinite);

console.log('\n— nhiều nguồn doanh thu, mỗi nguồn một tỷ lệ —');
const ms = await p.evaluate(i => {
  /* hai nguồn bằng nhau nhưng chia khác nhau: 1.000 chia 70/30 và 1.000 chia 50/50
     → Haustek giữ 300 + 500 = 800/tháng, gộp thành một nguồn "bình quân 60%"
     thì cũng ra 800 — nhưng chỉ đúng khi hai nguồn trôi cùng tốc độ. */
  const two = finModel(Object.assign({}, i, {adv:0, mkt:0, prod:0, term:12, growth:0,
    streams:[{k:'a', gross:1000, share:0.7, curve:'cat'},
             {k:'b', gross:1000, share:0.5, curve:'cat'}]}));
  const one = finModel(Object.assign({}, i, {adv:0, mkt:0, prod:0, term:12, growth:0,
    gross:2000, share:0.6}));
  /* giờ cho chúng trôi khác nhau: sync giữ phẳng, catalogue trôi −50%/năm */
  const mix = finModel(Object.assign({}, i, {adv:0, mkt:0, prod:0, term:12, growth:-50,
    streams:[{k:'cat', gross:1000, share:0.7, curve:'cat'},
             {k:'sync',gross:1000, share:0.5, curve:'flat'}]}));
  const allCat = finModel(Object.assign({}, i, {adv:0, mkt:0, prod:0, term:12, growth:-50,
    streams:[{k:'cat', gross:1000, share:0.7, curve:'cat'},
             {k:'c2',  gross:1000, share:0.5, curve:'cat'}]}));
  /* bản phát hành mới lên dần 3 tháng rồi mới trôi */
  const rel = finModel(Object.assign({}, i, {adv:0, mkt:0, prod:0, term:12, growth:0, rampMo:3,
    streams:[{k:'r', gross:900, share:0, curve:'rel'}]}));
  return { twoIn:two.inflow, oneIn:one.inflow, mixIn:mix.inflow, allCatIn:allCat.inflow,
           m1:rel.months[0].gross, m2:rel.months[1].gross, m3:rel.months[2].gross, m4:rel.months[3].gross };
}, BASE);
F('hai nguồn cùng tốc độ = một nguồn bình quân', near(ms.twoIn, ms.oneIn, 1),
  Math.round(ms.twoIn) + ' vs ' + Math.round(ms.oneIn));
F('nguồn giữ phẳng thu nhiều hơn nguồn cùng trôi', ms.mixIn > ms.allCatIn,
  Math.round(ms.mixIn) + ' > ' + Math.round(ms.allCatIn));
F('bản phát hành mới lên dần: tháng 1 bằng 1/3 đỉnh', near(ms.m1, 300), ms.m1);
F('bản phát hành mới: tháng 2 bằng 2/3 đỉnh', near(ms.m2, 600), ms.m2);
F('bản phát hành mới: tháng 3 đạt đỉnh', near(ms.m3, 900), ms.m3);
F('bản phát hành mới: qua đỉnh thì mới bắt đầu trôi', ms.m4 <= 900 + 0.5, ms.m4);

console.log('\n— đo đà từ báo cáo 12 tháng —');
const tr = await p.evaluate(() => {
  const down = [];
  /* dựng đúng −20%/năm rồi xem có đo ngược lại ra không */
  for (let m = 0; m < 12; m++) down.push(5000 * Math.pow(Math.pow(0.8, 1/12), m));
  const flat = [3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000];
  const up   = []; for (let m = 0; m < 12; m++) up.push(2000 * Math.pow(Math.pow(1.5, 1/12), m));
  const noisy= [3000, 9000, 1200, 5000, 800, 7000, 2000, 6000, 1000, 4000, 2500, 3500];
  return {
    down: finTrend(down), flat: finTrend(flat), up: finTrend(up), noisy: finTrend(noisy),
    ba: finTrend([100,110,120]), rong: finTrend([]),
    coSo0: finTrend([1000,0,1100,0,1200,0,1300,1400]),
    amHet: finTrend([-5,-4,-3,-2,-1])
  };
});
F('đo đúng −20%/năm từ chuỗi giảm 20%/năm', near(tr.down.yearly, -20, 0.6), tr.down.yearly);
F('chuỗi đi ngang thì đà bằng 0', near(tr.flat.yearly, 0, 0.1), tr.flat.yearly);
F('đo đúng +50%/năm từ chuỗi tăng 50%/năm', near(tr.up.yearly, 50, 1.5), tr.up.yearly);
F('chuỗi đều thì độ bám sát gần 1', tr.down.r2 > 0.99, tr.down.r2);
F('chuỗi nhảy loạn thì độ bám sát thấp', tr.noisy.r2 < 0.3, tr.noisy.r2);
F('dưới 4 tháng thì từ chối đo', tr.ba === null, tr.ba);
F('không có số thì từ chối đo', tr.rong === null, tr.rong);
F('tháng bằng 0 bị loại, phần còn lại vẫn đo được', tr.coSo0 !== null && tr.coSo0.n === 5, tr.coSo0 && tr.coSo0.n);
F('toàn số âm thì từ chối đo', tr.amHet === null, tr.amHet);
F('nhịp hiện tại lấy trung bình 3 tháng cuối',
  near(tr.flat.runRate, 3000), tr.flat.runRate);

console.log('\n— đọc số khách dán vào —');
const ps = await p.evaluate(() => ({
  phay:   finParseHist('1000, 2000, 3000'),
  lienNhau: finParseHist('1000,2000,3000'),
  xuong:  finParseHist('1000\n2000\n3000'),
  tab:    finParseHist('1000\t2000\t3000'),
  nghin:  finParseHist('1,200 2,400 3,600'),
  nghinVN:finParseHist('4.820\n4.650\n5.010'),
  trieu:  finParseHist('1,234,567\n2,345,678'),
  cotien: finParseHist('$1200 USD, $2400 USD'),
  excel:  finParseHist('Tháng 10/2025\t4.820\nTháng 11/2025\t4.650\nTháng 12/2025\t5.010'),
  thapphan: finParseHist('1200.5\n2400.25'),
  qua12:  finParseHist(Array.from({length:20},(_,k)=>(k+1)*100).join(',')),
  rong:   finParseHist(''),
  null_:  finParseHist(null),
  rac:    finParseHist('không có số nào ở đây')
}));
F('ngăn bằng dấu phẩy có dấu cách', ps.phay.join()==='1000,2000,3000', ps.phay.join());
F('ngăn bằng dấu phẩy không dấu cách', ps.lienNhau.join()==='1000,2000,3000', ps.lienNhau.join());
F('ngăn bằng xuống dòng', ps.xuong.join()==='1000,2000,3000', ps.xuong.join());
F('ngăn bằng tab', ps.tab.join()==='1000,2000,3000', ps.tab.join());
F('bỏ dấu phân nhóm kiểu Anh', ps.nghin.join()==='1200,2400,3600', ps.nghin.join());
F('bỏ dấu phân nhóm kiểu Việt', ps.nghinVN.join()==='4820,4650,5010', ps.nghinVN.join());
F('số hàng triệu có hai dấu phân nhóm', ps.trieu.join()==='1234567,2345678', ps.trieu.join());
F('bỏ ký hiệu tiền tệ', ps.cotien.join()==='1200,2400', ps.cotien.join());
F('dán từ Excel: mỗi dòng lấy số cuối, bỏ nhãn tháng và năm',
  ps.excel.join()==='4820,4650,5010', ps.excel.join());
F('giữ phần thập phân thật', ps.thapphan.join()==='1200.5,2400.25', ps.thapphan.join());
F('dán quá 12 tháng thì lấy 12 tháng gần nhất',
  ps.qua12.length===12 && ps.qua12[11]===2000, ps.qua12.length+'/'+ps.qua12[11]);
F('dán rỗng không vỡ', ps.rong.length===0);
F('null không vỡ', ps.null_.length===0);
F('dán chữ không có số thì trả về rỗng', ps.rac.length===0, ps.rac.join());

console.log('\n— phí pháp lý và xác suất —');
const lp = await p.evaluate(i => {
  const noLegal = finModel(Object.assign({}, i, {legal:0}));
  const legal   = finModel(Object.assign({}, i, {legal:5000}));
  const prob    = finModel(Object.assign({}, i, {prob:0.4}));
  return { a:noLegal.outlay, b:legal.outlay, aRec:noLegal.recoupable, bRec:legal.recoupable,
           aP:noLegal.profit, bP:legal.profit,
           exp:prob.expected, pr:prob.profit };
}, BASE);
F('phí pháp lý cộng vào vốn bỏ ra', near(lp.b - lp.a, 5000), lp.b - lp.a);
F('phí pháp lý KHÔNG thu hồi được từ nghệ sĩ', near(lp.aRec, lp.bRec), lp.aRec+' vs '+lp.bRec);
F('phí pháp lý ăn thẳng vào lợi nhuận', near(lp.aP - lp.bP, 5000), lp.aP - lp.bP);
F('lợi nhuận × xác suất đúng bằng tích', near(lp.exp, lp.pr*0.4, 1), lp.exp);

console.log('\n— ba kịch bản —');
const sc = await p.evaluate(i => finScenarios(i).map(x => ({
  k:x.k, inflow:x.r.inflow, irr:x.r.irr, pay:x.r.payback })), BASE);
sc.forEach(x => console.log('  ' + x.k.padEnd(5) + ' thu ' + Math.round(x.inflow) +
  ' · hoà vốn tháng ' + x.pay + ' · IRR ' + (x.irr === null ? '—' : (x.irr*100).toFixed(0) + '%')));
F('kịch bản thận trọng thấp hơn cơ sở', sc[0].inflow < sc[1].inflow);
F('kịch bản lạc quan cao hơn cơ sở', sc[2].inflow > sc[1].inflow);
F('thận trọng hoà vốn chậm hơn lạc quan', sc[0].pay >= sc[2].pay, sc[0].pay + ' vs ' + sc[2].pay);

console.log('\n— chi phí vốn quan trọng tới đâu —');
const hd = await p.evaluate(() => {
  const mk = i => finModel(i);
  /* Điểm NPV đổi dấu phải trùng IRR — đó là định nghĩa của IRR, và cũng là lý do
     nói được "deal chịu được chi phí vốn tới X%". */
  const base = {gross:5650, share:0.7, pass:0, dist:0, fee:0, adv:70000, mkt:10000,
                prod:0, legal:3500, term:60, growth:-17.9, recoupMkt:1};
  const irr = mk(Object.assign({}, base, {disc:12})).irr * 100;
  const duoi = mk(Object.assign({}, base, {disc: irr - 2})).npv;
  const tren = mk(Object.assign({}, base, {disc: irr + 2})).npv;
  const tai  = mk(Object.assign({}, base, {disc: irr})).npv;

  const mong = {gross:2000, share:0.8, pass:0, dist:0, fee:0.02, adv:60000, mkt:5000,
                prod:0, legal:2000, term:60, growth:-20, recoupMkt:1};
  const irrM = mk(Object.assign({}, mong, {disc:12})).irr * 100;

  const lbl = (i, d) => {
    const r = mk(Object.assign({}, i, {disc:d}));
    const h = finHurdleHTML(r, Object.assign({}, i, {disc:d}));
    return h.indexOf('finhurdle ok')>=0 ? 'ok'
         : h.indexOf('finhurdle near')>=0 ? 'near'
         : h.indexOf('finhurdle bad')>=0 ? 'bad' : 'trong';
  };
  return { irr, duoi, tren, tai, irrM,
           khoe12: lbl(base, 12), khoeSat: lbl(base, Math.round(irr)-3),
           mong12: lbl(mong, 12), mong2: lbl(mong, 2),
           khongVon: finHurdleHTML(mk(Object.assign({}, base, {adv:0, mkt:0, prod:0, legal:0})),
                                   Object.assign({}, base, {disc:12})) };
});
F('dưới IRR thì giá trị hôm nay còn dương', hd.duoi > 0, Math.round(hd.duoi));
F('trên IRR thì giá trị hôm nay âm', hd.tren < 0, Math.round(hd.tren));
F('đúng tại IRR thì giá trị hôm nay bằng 0', near(hd.tai, 0, 60), Math.round(hd.tai));
F('deal khoẻ ở mức 12% thì báo khoảng cách rộng', hd.khoe12==='ok', hd.khoe12);
F('cùng deal đó mà đặt chi phí vốn sát IRR thì báo hẹp', hd.khoeSat==='near', hd.khoeSat);
F('deal biên mỏng ở mức 12% thì báo không đạt', hd.mong12==='bad', hd.mong12);
F('deal biên mỏng ở mức 2% thì lại đạt', hd.mong2!=='bad', hd.mong2);
F('không bỏ vốn thì không hiện dòng ngưỡng', hd.khongVon==='', hd.khongVon.slice(0,30));

console.log('\n— advance tối đa —');
const mx = await p.evaluate(i => {
  const at25 = finMaxAdvance(Object.assign({}, i, {adv:0}), 0.25);
  const at50 = finMaxAdvance(Object.assign({}, i, {adv:0}), 0.50);
  const chk = finModel(Object.assign({}, i, {adv:at25}));
  return { at25, at50, irrAt25: chk.irr };
}, BASE);
console.log('  ngưỡng 25%/năm → ứng tối đa ' + mx.at25 + ' · ngưỡng 50% → ' + mx.at50);
F('ngưỡng lợi nhuận cao hơn thì ứng được ít hơn', mx.at50 < mx.at25, mx.at50 + ' < ' + mx.at25);
F('ứng đúng mức tối đa thì vẫn đạt ngưỡng', mx.irrAt25 >= 0.25 - 0.005, mx.irrAt25);

console.log('\nLỗi JS: ' + errs.length);
errs.slice(0, 4).forEach(e => console.log('  ' + e));
if (errs.length) FAILED++;
await b.close();
srv.close();
console.log(FAILED ? ('\n' + FAILED + ' phép kiểm HỎNG') : '\n79 đạt · 0 hỏng');
process.exit(FAILED ? 1 : 0);
