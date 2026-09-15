/* Kiểm mô hình tài chính bằng số TÍNH TAY, không phải bằng chính nó.
   Mỗi phép kiểm dưới đây có một con số mà người đọc tự nhân chia lại được. */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

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

console.log('\n— ba kịch bản —');
const sc = await p.evaluate(i => finScenarios(i).map(x => ({
  k:x.k, inflow:x.r.inflow, irr:x.r.irr, pay:x.r.payback })), BASE);
sc.forEach(x => console.log('  ' + x.k.padEnd(5) + ' thu ' + Math.round(x.inflow) +
  ' · hoà vốn tháng ' + x.pay + ' · IRR ' + (x.irr === null ? '—' : (x.irr*100).toFixed(0) + '%')));
F('kịch bản thận trọng thấp hơn cơ sở', sc[0].inflow < sc[1].inflow);
F('kịch bản lạc quan cao hơn cơ sở', sc[2].inflow > sc[1].inflow);
F('thận trọng hoà vốn chậm hơn lạc quan', sc[0].pay >= sc[2].pay, sc[0].pay + ' vs ' + sc[2].pay);

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
console.log(FAILED ? ('\n' + FAILED + ' phép kiểm HỎNG') : '\n38 đạt · 0 hỏng');
process.exit(FAILED ? 1 : 0);
