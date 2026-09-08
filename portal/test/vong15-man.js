/* =====================================================================
   VÒNG 15 CHẠY THẬT TRONG TRÌNH DUYỆT
   ---------------------------------------------------------------------
   Bốn thứ mới của vòng này đều là thứ NGƯỜI DÙNG GÕ VÀO, nên phép kiểm
   phải gõ thật rồi đọc lại con số trên mặt — quét khung chỉ bắt được
   trang trắng, không bắt được ô nhập gõ xong mà bảng đứng yên.

     · trang Nhập số liệu: gõ tổng nguồn, gõ lượt nghe ngày, gỡ ra
     · bảng bước quy trình: bấm đánh dấu, bấm bỏ đánh dấu
     · bản in: mở overlay, có đủ tiêu đề và bảng, đóng lại được
     · hai trang cấp quản lý: mở được với Level 1, chặn với Level 4

       node portal/test/vong15-man.js
   ===================================================================== */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

let loi = 0, dem = 0;
function must(ok, ten, them) { dem++; if (!ok) { loi++; console.log('  ✗ ' + ten + (them ? ' · ' + them : '')); } else console.log('  ✓ ' + ten); }

const doiVai = (p, vai) => p.evaluate(v => {
  const A = window.HAUSTEK.admin, ai = A.staff.list().find(x => x.role === v && x.active !== false);
  if (ai) A.staff.setMe(ai.id);
  return ai ? ai.id : null;
}, vai);
const doiNguoi = (p, id) => p.evaluate(i => { window.HAUSTEK.admin.staff.setMe(i); }, id);
const den = async (p, man) => { await p.evaluate(m => { location.hash = '#' + m; }, man); await p.waitForTimeout(700); };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 } });
  const p = await ctx.newPage();
  await dungFontThat(p);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t); });
  /* hộp thoại xác nhận: nhận hết, vì phép kiểm nào cũng cố tình bấm tiếp */
  await p.addInitScript(() => { window.__noPrint = true; });

  await p.goto('http://127.0.0.1:8099/v2/intranet.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { try { window.HAUSTEK.admin.reset(); } catch (e) {} });
  await p.waitForTimeout(400);

  /* ================================================================= */
  console.log('### trang Nhập số liệu mở được cho điều phối viên');
  await doiVai(p, 'ops');
  await den(p, 'nhap-so-lieu');
  must(await p.$('main [data-tab="ngay"]') !== null, 'có tab lượt nghe hằng ngày');
  must((await p.$$('main [data-tab]')).length === 4, 'có đủ bốn tab');
  must((await p.$$('main .kpi')).length === 4, 'có bốn ô số đầu trang');
  const nav = await p.evaluate(() => {
    const a = [...document.querySelectorAll('[data-nav] a, [data-nav] button')]
      .find(x => (x.getAttribute('href') || '') === '#nhap-so-lieu' || x.dataset.man === 'nhap-so-lieu');
    return a ? a.textContent.trim() : null;
  });
  must(nav !== null, 'trang có mặt trên thanh điều hướng', String(nav));

  console.log('\n### gõ lượt nghe cho một ngày rồi trả về tự động');
  const truocNgay = await p.evaluate(() => window.HAUSTEK.admin.dailyStreams(0, 0));
  const oNgay = await p.$('main [data-o-ngay]');
  must(oNgay !== null, 'có nút nhập cho ngày gần nhất');
  await oNgay.click();
  await p.waitForTimeout(400);
  must(await p.$('.modal [data-o="luot"]') !== null, 'hộp thoại nhập lượt nghe mở ra');
  await p.fill('.modal [data-o="luot"]', '1234567');
  await p.click('.modal [data-act="ok"]');
  await p.waitForTimeout(700);
  const sauNgay = await p.evaluate(() => window.HAUSTEK.admin.nhapLieu.ngay(1)[0]);
  must(sauNgay.trangThai === 'tay' && sauNgay.tong === 1234567, 'ngày vừa gõ được ghi đúng', JSON.stringify(sauNgay.tong));
  must(await p.evaluate(() => window.HAUSTEK.admin.dailyStreams(0, 0)) !== truocNgay, 'đường lượt nghe đổi theo số vừa gõ');
  const traVe = await p.$('main [data-tra-ngay]');
  must(traVe !== null, 'có nút trả về số tự động');
  await traVe.click();
  await p.waitForTimeout(600);
  must(await p.evaluate(() => window.HAUSTEK.admin.nhapLieu.ngay(1)[0].trangThai) !== 'tay', 'trả về tự động có tác dụng');

  console.log('\n### gõ tổng doanh thu một nguồn trong một kỳ');
  await p.click('main [data-tab="tien"]');
  await p.waitForTimeout(500);
  must((await p.$$('main [data-o-ky]')).length >= 3, 'bảng kỳ × nguồn có ô bấm được');
  const oKy = await p.evaluate(() => {
    const n = [...document.querySelectorAll('main [data-o-ky]')].find(x => !x.disabled);
    return n ? n.getAttribute('data-o-ky') : null;
  });
  must(oKy !== null, 'có ít nhất một ô của kỳ đang mở');
  await p.click('main [data-o-ky="' + oKy + '"]');
  await p.waitForTimeout(400);
  must(await p.$('.modal [data-o="tien"]') !== null, 'hộp thoại nhập doanh thu mở ra');
  must(await p.$('.modal [data-o="nguon"]') !== null, 'hộp thoại có ô chọn nguồn lấy số');
  await p.fill('.modal [data-o="tien"]', '54321.5');
  await p.click('.modal [data-act="ok"]');
  await p.waitForTimeout(800);
  const pIdx = +oKy.split(':')[0], fId = +oKy.split(':')[1];
  const cot = await p.evaluate(a => window.HAUSTEK.admin.nhapLieu.bang()[a[0]].cot[a[1]], [pIdx, fId]);
  must(Math.abs(cot.thuc - 54321.5) < 0.05, 'tổng nguồn bằng đúng số vừa gõ', String(cot.thuc));
  must(cot.chot === 54321.5, 'số đã chốt được ghi lại');
  const mat = await p.evaluate(() => document.querySelector('main').textContent);
  must(mat.indexOf('undefined') < 0 && mat.indexOf('NaN') < 0, 'bảng không lọt undefined hay NaN');

  console.log('\n### nhật ký ghi lại và gỡ được');
  await p.click('main [data-tab="su"]');
  await p.waitForTimeout(500);
  must((await p.$$('main [data-go]')).length >= 1, 'nhật ký có dòng vừa gõ');
  const hangSu = await p.evaluate(() => document.querySelectorAll('main table.t tbody tr').length);
  must(hangSu >= 1, 'nhật ký hiện ít nhất một dòng', String(hangSu));
  await p.click('main [data-go]');
  await p.waitForTimeout(400);
  await p.click('.modal [data-act="ok"]');
  await p.waitForTimeout(700);
  const conLai = await p.evaluate(() => window.HAUSTEK.admin.nhapLieu.nhatKy(99).length);
  must(conLai < hangSu, 'gỡ một dòng thì nhật ký ngắn đi', String(conLai) + ' < ' + String(hangSu));

  console.log('\n### bản in mở ra đúng khổ giấy rồi đóng lại được');
  await p.evaluate(() => { window.print = function () { window.__daIn = (window.__daIn || 0) + 1; }; });
  await p.click('main [data-in]');
  await p.waitForTimeout(450);
  must(await p.$('.in-lop .in-giay') !== null, 'overlay bản in hiện ra');
  must(await p.evaluate(() => document.body.classList.contains('dang-in')), 'thân trang được đánh dấu đang in');
  const inTxt = await p.evaluate(() => document.querySelector('.in-giay').textContent);
  must(inTxt.indexOf('HAUSTEK') >= 0, 'bản in có tên công ty ở đầu trang');
  must(inTxt.indexOf('undefined') < 0 && inTxt.indexOf('NaN') < 0, 'bản in không lọt undefined hay NaN');
  await p.click('.in-lop [data-in-in]');
  await p.waitForTimeout(200);
  must(await p.evaluate(() => window.__daIn) === 1, 'nút In gọi lệnh in của trình duyệt');
  await p.click('.in-lop [data-in-dong]');
  await p.waitForTimeout(300);
  must(await p.$('.in-lop') === null, 'đóng overlay thì bản in biến mất');
  must(await p.evaluate(() => document.body.classList.contains('dang-in')) === false, 'đóng xong bỏ luôn dấu đang in');

  console.log('\n### bảng bước quy trình bấm được ở trang Quản lý quyền');
  await doiVai(p, 'support');
  await den(p, 'quyen');
  const dongKn = await p.$('main table.t tbody tr');
  must(dongKn !== null, 'bảng khiếu nại có dòng');
  await dongKn.click();
  await p.waitForTimeout(700);
  must((await p.$$('.drawer .buoc')).length === 10, 'ngăn trượt có đủ mười bước của quy trình tranh chấp',
    String((await p.$$('.drawer .buoc')).length));
  must(await p.$('.drawer .buoc.tiep') !== null, 'bước kế tiếp được làm nổi');
  await p.click('.drawer .buoc [data-buoc]');
  await p.waitForTimeout(400);
  await p.fill('.modal [data-o="ghi"]', 'kiểm thử vòng 15');
  await p.click('.modal [data-act="ok"]');
  await p.waitForTimeout(800);
  const xong = await p.evaluate(() => document.querySelectorAll('.drawer .buoc.xong').length);
  must(xong === 1, 'đánh dấu xong thì bước đầu chuyển sang trạng thái đã làm', String(xong));
  must(await p.evaluate(() => (document.querySelector('.drawer .buoc-dau b') || {}).textContent) === '1/10',
    'thanh tiến độ ghi 1/10');
  await p.click('.drawer .buoc.xong [data-buoc]');
  await p.waitForTimeout(700);
  must(await p.evaluate(() => document.querySelectorAll('.drawer .buoc.xong').length) === 0, 'bỏ đánh dấu thì bước trở lại chưa làm');

  console.log('\n### xuất hồ sơ tranh chấp ra bản in');
  await p.click('.drawer [data-in-hs]');
  await p.waitForTimeout(450);
  const hs = await p.evaluate(() => { const g = document.querySelector('.in-giay'); return g ? g.textContent : ''; });
  must(hs.indexOf('Asset ID') >= 0, 'hồ sơ in có mã tài sản');
  must(hs.indexOf('undefined') < 0 && hs.indexOf('NaN') < 0, 'hồ sơ in không lọt undefined hay NaN');
  await p.click('.in-lop [data-in-dong]');
  await p.waitForTimeout(250);

  console.log('\n### hai trang cấp quản lý');
  const gd = await p.evaluate(() => {
    const A = window.HAUSTEK.admin;
    const ai = A.staff.list().find(x => A.toChuc.chucDanh.find(d => d.id === x.chucDanh && d.cap === 1));
    if (ai) A.staff.setMe(ai.id);
    return ai ? { id: ai.id, cap: A.staff.me.cap } : null;
  });
  must(gd && gd.cap === 1, 'tìm được một người Level 1 để thử');
  await den(p, 'hieu-suat');
  must(await p.$('main table.t tbody tr') !== null, 'trang Hiệu suất có bảng nhân viên');
  const hsTxt = await p.evaluate(() => document.querySelector('main').textContent);
  must(hsTxt.indexOf('undefined') < 0 && hsTxt.indexOf('NaN') < 0, 'trang Hiệu suất không lọt undefined hay NaN');
  await p.click('main table.t tbody tr');
  await p.waitForTimeout(700);
  must(await p.$('.drawer [data-dg]') !== null, 'ngăn trượt có nút viết đánh giá cuối năm');
  await p.click('.drawer [data-dg]');
  await p.waitForTimeout(400);
  await p.fill('.modal [data-o="nx"]', 'Nhận xét thử.');
  await p.click('.modal [data-act="ok"]');
  await p.waitForTimeout(700);
  const dg = await p.evaluate(() => {
    const A = window.HAUSTEK.admin, ds = A.hieuSuat.bang();
    return A.hieuSuat.cua(ds[0].id).danhGia;
  });
  must(dg && Object.keys(dg).length > 0, 'đánh giá cuối năm được lưu lại');

  await den(p, 'hieu-qua-von');
  must((await p.$$('main .kpi')).length === 6, 'trang Hiệu quả vốn có sáu ô số');
  must(await p.$('main .bd svg') !== null, 'đường thu hồi vẽ được');
  const vonTxt = await p.evaluate(() => document.querySelector('main').textContent);
  must(vonTxt.indexOf('undefined') < 0 && vonTxt.indexOf('NaN') < 0, 'trang Hiệu quả vốn không lọt undefined hay NaN');
  for (const tab of ['hd', 'lop']) {
    await p.click('main [data-tab="' + tab + '"]');
    await p.waitForTimeout(500);
    const tx = await p.evaluate(() => document.querySelector('main').textContent);
    must(tx.indexOf('undefined') < 0 && tx.indexOf('NaN') < 0, 'tab ' + tab + ' không lọt undefined hay NaN');
  }

  console.log('\n### cấp dưới không mở được hai trang ấy');
  const chan = await p.evaluate(() => {
    const A = window.HAUSTEK.admin;
    const ai = A.staff.list().find(x => { A.staff.setMe(x.id); return A.staff.me.cap > 2 && x.active !== false; });
    if (!ai) return null;
    A.staff.setMe(ai.id);
    return { cap: A.staff.me.cap, hs: A.quyen.man('hieu-suat'), von: A.quyen.man('hieu-qua-von') };
  });
  must(chan && chan.cap > 2 && !chan.hs && !chan.von, 'Level 3 trở xuống bị chặn cả hai trang', JSON.stringify(chan));

  console.log('\n### chú thích nằm trong ký hiệu, không rải chữ ra ngoài');
  await p.evaluate(() => { const A = window.HAUSTEK.admin; A.staff.setMe(A.staff.list().find(x => x.role === 'mgmt').id); });
  await den(p, 'roi');
  must((await p.$$('main .fhint')).length === 0, 'trang ROI không còn dòng chú thích dài dưới ô nhập');
  must((await p.$$('main .fld .help')).length >= 10, 'mọi nhãn ô nhập đều có dấu ? để đọc chú thích',
    String((await p.$$('main .fld .help')).length));

  console.log('\n### cổng đối tác tự xuất được bảng kê PDF');
  const p2 = await ctx.newPage();
  await dungFontThat(p2);
  p2.on('pageerror', e => errs.push('KHACH PAGEERROR ' + e.message));
  p2.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('KHACH CONSOLE ' + t); });
  await p2.goto('http://127.0.0.1:8099/v2/khach.html', { waitUntil: 'networkidle' });
  await p2.evaluate(() => { location.hash = '#k-bang-ke'; });
  await p2.waitForTimeout(1100);
  must(await p2.$('main [data-in]') !== null, 'bảng kê có nút xuất PDF');
  await p2.click('main [data-in]');
  await p2.waitForTimeout(500);
  must(await p2.$('.in-lop .in-giay') !== null, 'bản in bảng kê mở ra');
  const bk = await p2.evaluate(() => document.querySelector('.in-giay').textContent);
  must(bk.indexOf('HAUSTEK') >= 0, 'bản in bảng kê có đầu trang Haustek');
  must(bk.indexOf('undefined') < 0 && bk.indexOf('NaN') < 0, 'bản in bảng kê không lọt undefined hay NaN');
  await p2.click('.in-lop [data-in-dong]');
  await p2.waitForTimeout(250);
  must(await p2.$('.in-lop') === null, 'đóng được bản in bên cổng đối tác');

  must(errs.length === 0, 'không có lỗi JavaScript', errs.slice(0, 3).join(' | '));
  await b.close();
  console.log('\n' + (loi ? '✗ ' + loi + '/' + dem + ' phép sai' : '✓ ' + dem + '/' + dem + ' phép đúng'));
  process.exit(loi ? 1 : 0);
})();
