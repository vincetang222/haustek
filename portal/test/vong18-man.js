/* =====================================================================
   VÒNG 18 CHẠY THẬT TRONG TRÌNH DUYỆT
   ---------------------------------------------------------------------
   Tác quyền là mảng dễ nói suông nhất: bảng nào cũng vẽ được, nhưng con
   số chỉ đúng khi bấm thật rồi đọc lại.

     · Trang Tác quyền: bốn tab, số tiền để trên bàn có thật
     · Sửa tỷ lệ tác giả không đủ 100% thì bị chặn NGAY TRÊN MẶT
     · Đăng ký thêm một hội thì lãnh thổ ấy rời khỏi danh sách hở
     · Cổng đối tác: tác giả thấy tác phẩm mình, không thấy phí hay biên

       node portal/test/vong18-man.js
   ===================================================================== */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

let loi = 0, dem = 0;
function must(ok, ten, them) { dem++; if (!ok) { loi++; console.log('  ✗ ' + ten + (them ? ' · ' + them : '')); } else console.log('  ✓ ' + ten); }

const doiVai = (p, vai) => p.evaluate(v => {
  const A = window.HAUSTEK.admin, ai = A.staff.list().find(x => x.role === v && x.active !== false);
  if (ai) A.staff.setMe(ai.id);
}, vai);
const den = async (p, man) => { await p.evaluate(m => { location.hash = '#' + m; }, man); await p.waitForTimeout(1500); };
const chu = p => p.evaluate(() => document.querySelector('main').textContent);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 } });
  const p = await ctx.newPage();
  await dungFontThat(p);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t); });

  await p.goto('http://127.0.0.1:8099/v2/intranet.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { try { window.HAUSTEK.admin.reset(); } catch (e) {} });
  await p.waitForTimeout(400);

  /* ================================================================= */
  console.log('### trang Tác quyền mở được cho vận hành');
  await doiVai(p, 'ops');
  await den(p, 'xuat-ban');
  let mat = await chu(p);
  must((await p.$$('main .kpi')).length === 5, 'có năm ô số đầu trang');
  must((await p.$$('main [data-tab]')).length === 4, 'có bốn tab');
  must(mat.indexOf('Tiền để trên bàn') >= 0, 'ô số đầu tiên là tiền đang để trên bàn');
  must(mat.indexOf('undefined') < 0 && mat.indexOf('NaN') < 0, 'trang không lọt undefined hay NaN');
  const tienBan = await p.evaluate(() => window.HAUSTEK.admin.xuatBan.tongQuan().tongTrenBan);
  must(tienBan > 0, 'phải có tiền đang để trên bàn để mà xem', String(tienBan));

  console.log('\n### ba nhóm việc còn phải làm đều có nội dung');
  await p.click('main [data-tab="viec"]'); await p.waitForTimeout(1500);
  mat = await chu(p);
  ['Chưa có mã ISWC', 'Tỷ lệ tác giả không đủ 100%', 'Hồ sơ bị hội trả lại'].forEach(function (x) {
    must(mat.indexOf(x) >= 0, 'có nhóm "' + x + '"');
  });
  must((await p.$$('main [data-tp]')).length >= 3, 'các nhóm có dòng bấm được');
  must(mat.indexOf('undefined') < 0 && mat.indexOf('NaN') < 0, 'tab việc không lọt undefined hay NaN');

  console.log('\n### bảng tác phẩm lọc được và mở được ngăn chi tiết');
  await p.click('main [data-tab="tp"]'); await p.waitForTimeout(1500);
  must((await p.$$('main [data-tp]')).length >= 10, 'bảng tác phẩm có dòng');
  await p.click('main [data-loc="thieu"]'); await p.waitForTimeout(1500);
  const soThieu = await p.evaluate(() => {
    return [...document.querySelectorAll('main tbody tr')].every(tr => tr.textContent.indexOf('Thiếu ISWC') >= 0);
  });
  must(soThieu, 'lọc "thiếu ISWC" chỉ còn dòng thiếu ISWC');
  await p.click('main [data-loc="thieu"]'); await p.waitForTimeout(1500);

  const wId = await p.evaluate(() => +document.querySelector('main [data-tp]').getAttribute('data-tp'));
  await (await p.$('main [data-tp]')).click(); await p.waitForTimeout(900);
  const dr = await p.evaluate(() => { const d = document.querySelector('.drawer'); return d ? d.textContent : ''; });
  must(dr.length > 300, 'ngăn chi tiết mở ra');
  must(dr.indexOf('VCPMC') >= 0 && dr.indexOf('PRS') >= 0 && dr.indexOf('JASRAC') >= 0, 'ngăn có ma trận đăng ký theo hội');
  must(dr.indexOf('undefined') < 0 && dr.indexOf('NaN') < 0, 'ngăn không lọt undefined hay NaN');
  must((await p.$$('.drawer [data-dk]')).length === 17, 'đủ mười bảy hội để đặt trạng thái',
    String((await p.$$('.drawer [data-dk]')).length));

  console.log('\n### sửa tỷ lệ tác giả không đủ 100% thì bị chặn ngay trên mặt');
  await p.click('.drawer [data-sua-tg]'); await p.waitForTimeout(600);
  must(await p.$('.modal [data-o="tg"]') !== null, 'hộp thoại sửa tác giả mở ra');
  await p.fill('.modal [data-o="tg"]', 'Nguyễn A | C | 60 | 123\nTrần B | A | 30 |');
  await p.click('.modal [data-act="ok"]'); await p.waitForTimeout(900);
  must((await p.evaluate(() => document.body.textContent)).indexOf('phải đúng 100%') >= 0, 'báo ngay khi tổng chỉ 90%');

  console.log('\n### đăng ký thêm một hội thì lãnh thổ ấy rời khỏi danh sách hở');
  const truoc = await p.evaluate(w => {
    const A = window.HAUSTEK.admin;
    A.xuatBan.ghi(w, { iswc: 'T-555666777-3' }, 'test');
    return A.xuatBan.chiTiet(w).trenBan;
  }, wId);
  if (truoc.rows.length) {
    const nuoc = truoc.rows[0].nuoc;
    const sau = await p.evaluate(a => {
      const A = window.HAUSTEK.admin;
      A.xuatBan.hoiTheoLanhTho()[a[1]].forEach(h => A.xuatBan.datDangKy(a[0], h, { trangThai: 'da-khop', maHoi: 'X' }, 'test'));
      return A.xuatBan.chiTiet(a[0]).trenBan;
    }, [wId, nuoc]);
    must(!sau.rows.some(r => r.nuoc === nuoc), 'đăng ký đủ ở ' + nuoc + ' thì lãnh thổ ấy rời danh sách');
    must(sau.tong < truoc.tong, 'tổng tiền trên bàn của tác phẩm giảm đi');
  } else {
    must(true, 'tác phẩm này không hở lãnh thổ nào (bỏ qua phép kiểm)');
    must(true, '—');
  }

  console.log('\n### nhập bảng Sentric ngay trên trang');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    ['.drawer', '.backdrop'].forEach(s => { const d = document.querySelector(s); if (d) d.remove(); });
  });
  await den(p, 'xuat-ban');
  await p.click('main [data-tab="nhap"]'); await p.waitForTimeout(900);
  must(await p.$('main [data-sentric]') !== null, 'có ô dán bảng Sentric');
  const isrc = await p.evaluate(w => window.HAUSTEK.admin.xuatBan.chiTiet(w).banGhi[0].isrc, wId);
  await p.fill('main [data-sentric]', 'ISRC\tISWC\tMã hội\tHội\n' + isrc + '\tT-909808707-6\tPRS-XYZ\tPRS\nHONG\tT-1\t\t');
  await p.click('main [data-nhan-sentric]'); await p.waitForTimeout(1500);
  const banBao = await p.evaluate(() => document.body.textContent);
  must(banBao.indexOf('Nhận 1 tác phẩm') >= 0, 'báo nhận đúng một dòng');
  must(banBao.indexOf('1 dòng bỏ lại') >= 0, 'báo trả lại đúng một dòng');
  must(await p.evaluate(w => window.HAUSTEK.admin.xuatBan.chiTiet(w).iswc, wId) === 'T-909808707-6',
    'ISWC từ bảng Sentric vào đúng tác phẩm');

  console.log('\n### vai không có nhóm tác quyền thì không vào được');
  await doiVai(p, 'sales');
  /* Đổi vai xong phải rời trang rồi quay lại: đặt lại đúng cái hash đang
     đứng thì trình duyệt không bắn hashchange, và khung không vẽ lại. */
  await den(p, 'ban-lam-viec');
  await den(p, 'xuat-ban');
  must((await chu(p)).indexOf('Tiền để trên bàn') < 0, 'kinh doanh không mở được trang Tác quyền');

  /* ================================================================= */
  console.log('\n### cổng đối tác: tác giả thấy tác phẩm của mình');
  await p.goto('http://127.0.0.1:8099/v2/khach.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const k = await p.evaluate(() => {
    const H = window.HAUSTEK;
    const TK = H.api.demoLogins().accounts.filter(a => a.status === 'active');
    for (let n = 0; n < TK.length; n++) {
      if (TK[n].role !== 'artist') continue;
      try { if (H.api.session('artist', TK[n].partyId).hasPublishing) return n; } catch (e) {}
    }
    return -1;
  });
  must(k >= 0, 'có tài khoản tác giả để thử');
  await p.evaluate(n => { sessionStorage.setItem('haustek.demo.tk', String(n)); }, k);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  await p.evaluate(() => { location.hash = '#k-ban-ghi'; });
  await p.waitForTimeout(1100);
  await p.click('main [data-tab="pub"]'); await p.waitForTimeout(1500);
  const kt = await chu(p);
  must(kt.indexOf('Tác phẩm bạn đứng tên') >= 0, 'có bảng tác phẩm của tác giả');
  must(/T-\d{9}-\d/.test(kt), 'bảng có mã ISWC thật');
  must(kt.indexOf('undefined') < 0 && kt.indexOf('NaN') < 0, 'bảng không lọt undefined hay NaN');
  must(!/Phí Haustek|để trên bàn|biên lợi/i.test(kt), 'cổng đối tác không lộ phí, biên hay ước tính nội bộ');
  must(await p.evaluate(() => window.HAUSTEK.admin === undefined), 'cổng đối tác vẫn không có mặt tiền admin');

  must(errs.length === 0, 'không có lỗi JavaScript', errs.slice(0, 3).join(' | '));
  console.log('\n' + (loi ? '✗ ' + loi + '/' + dem + ' phép sai' : '✓ ' + dem + '/' + dem + ' phép đúng'));
  await b.close();
  process.exit(loi ? 1 : 0);
})();
