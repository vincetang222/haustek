/* =====================================================================
   VÒNG 17 CHẠY THẬT TRONG TRÌNH DUYỆT
   ---------------------------------------------------------------------
   Vòng này là công đoạn NGƯỜI làm: ngồi chép metadata sang OneRPM, tick
   từng tool, rồi dán link store về. Không có phép kiểm nào bắt được lỗi
   ở đây ngoài việc bấm thật từng nút.

     · Phiếu giao việc: metadata xếp theo thứ tự OneRPM, nút chép chạy
     · Tick tool ghi lại mã tool trả về, gỡ tick được
     · Chọn store, lưu, rồi trả về toàn bộ
     · Dán link store, dán nhầm cột thì bị chặn ngay trên mặt
     · Số công khai: ghi vào, hiện bình quân ngày, và TIỀN KHÔNG ĐỔI

       node portal/test/vong17-man.js
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
const den = async (p, man) => { await p.evaluate(m => { location.hash = '#' + m; }, man); await p.waitForTimeout(800); };
const chu = p => p.evaluate(() => document.querySelector('main').textContent);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  await dungFontThat(p);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t); });

  await p.goto('http://127.0.0.1:8099/v2/intranet.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { try { window.HAUSTEK.admin.reset(); } catch (e) {} });
  await p.waitForTimeout(400);

  /* ================================================================= */
  console.log('### phiếu giao việc mở được cho vận hành');
  await doiVai(p, 'ops');
  const tien0 = await p.evaluate(() => {
    const A = window.HAUSTEK.admin;
    A.releases.list().filter(r => r.status === 'submitted').slice(0, 3).forEach(r => {
      A.releases.receive(r.id, 'test'); A.releases.assignCodes(r.id, 'test');
    });
    const ky = A.periods.filter(x => A.isApproved(x.k));
    return A.agg('admin', 0, ky[ky.length - 1].idx, 'rec').artist;
  });
  await den(p, 'phieu-giao');
  must((await p.$$('main [data-hs]')).length >= 3, 'bảng hồ sơ có việc để làm');
  const nav = await p.evaluate(() => {
    const a = [...document.querySelectorAll('[data-nav] a, [data-nav] button')]
      .find(x => (x.getAttribute('href') || '') === '#phieu-giao' || x.dataset.man === 'phieu-giao');
    return a ? a.textContent.trim() : null;
  });
  must(nav !== null, 'trang có mặt trên thanh điều hướng', String(nav));

  const hsId = await p.evaluate(() => document.querySelector('main [data-hs]').getAttribute('data-hs'));
  await (await p.$('main [data-hs]')).click();
  await p.waitForTimeout(800);
  let mat = await chu(p);
  must(mat.indexOf('Album Info') >= 0 && mat.indexOf('Distribution Preferences') >= 0, 'metadata xếp theo đúng các bước của OneRPM');
  must((await p.$$('main [data-chep]')).length >= 20, 'mỗi trường một nút chép', String((await p.$$('main [data-chep]')).length));
  must(mat.indexOf('undefined') < 0 && mat.indexOf('NaN') < 0, 'phiếu không lọt undefined hay NaN');

  console.log('\n### nút chép đưa đúng chữ vào bộ nhớ tạm');
  const can = await p.evaluate(() => document.querySelector('main [data-chep]').getAttribute('data-chep'));
  await p.click('main [data-chep]');
  await p.waitForTimeout(400);
  const daChep = await p.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  must(daChep === can, 'chép đúng nội dung của trường', JSON.stringify(daChep) + ' ≠ ' + JSON.stringify(can));

  console.log('\n### tick tool ghi lại mã tool trả về, gỡ tick được');
  await p.click('main [data-tab="tool"]');
  await p.waitForTimeout(700);
  must((await p.$$('main [data-tool]')).length >= 4, 'có đủ tool để tick');
  await p.click('main [data-tool="onerpm"]');
  await p.waitForTimeout(500);
  must(await p.$('.modal [data-o="ma"]') !== null, 'hộp thoại hỏi mã tool trả về');
  await p.fill('.modal [data-o="ma"]', 'ONE-20260908');
  await p.click('.modal [data-act="ok"]');
  await p.waitForTimeout(900);
  mat = await chu(p);
  must(mat.indexOf('ONE-20260908') >= 0, 'mã tool hiện trên bảng');
  must((await p.$$('main [data-tool-bo="onerpm"]')).length === 1, 'tick xong thì có nút gỡ');
  await p.click('main [data-tool-bo="onerpm"]');
  await p.waitForTimeout(800);
  must((await chu(p)).indexOf('ONE-20260908') < 0, 'gỡ tick thì mã biến mất');
  await p.click('main [data-tool="onerpm"]'); await p.waitForTimeout(500);
  await p.click('.modal [data-act="ok"]'); await p.waitForTimeout(800);

  console.log('\n### chọn store rồi trả về toàn bộ');
  await p.click('main [data-tab="store"]');
  await p.waitForTimeout(700);
  must((await p.$$('main [data-store]')).length >= 30, 'bảng store có đủ nền tảng lớn và store tiếp theo');
  await p.uncheck('main [data-store-het]');
  await p.evaluate(() => { document.querySelectorAll('main [data-store]').forEach((x, i) => { x.checked = i < 3; }); });
  await p.click('main [data-store-luu]');
  await p.waitForTimeout(900);
  const soStore = await p.evaluate(id => window.HAUSTEK.admin.releases.storeCua(id).so, hsId);
  must(soStore === 3, 'lưu đúng ba store', String(soStore));
  await p.check('main [data-store-het]');
  await p.click('main [data-store-luu]');
  await p.waitForTimeout(900);
  must(await p.evaluate(id => window.HAUSTEK.admin.releases.storeCua(id).tatCa, hsId), 'trả về toàn bộ store');

  console.log('\n### dán link store, dán nhầm cột thì bị chặn ngay trên mặt');
  await p.click('main [data-tab="link"]');
  await p.waitForTimeout(800);
  const oLink = await p.$$('main [data-link]');
  must(oLink.length >= 8, 'mỗi track một bảng nền tảng', String(oLink.length));
  const kApple = await p.evaluate(() => {
    const o = [...document.querySelectorAll('main [data-link]')].find(x => x.getAttribute('data-link').indexOf('Apple Music') > 0);
    return o ? o.getAttribute('data-link') : null;
  });
  must(kApple !== null, 'có ô link cho Apple Music');
  await p.fill('main [data-link="' + kApple + '"]', 'https://open.spotify.com/track/xyz');
  await p.click('main [data-link-luu="' + kApple + '"]');
  await p.waitForTimeout(800);
  must((await p.evaluate(() => document.body.textContent)).indexOf('dán nhầm cột') >= 0, 'dán nhầm cột thì báo ngay');
  const kSp = kApple.split('|')[0] + '|Spotify';
  await p.fill('main [data-link="' + kSp + '"]', 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
  await p.click('main [data-link-luu="' + kSp + '"]');
  await p.waitForTimeout(900);
  must((await p.$$('main [data-link-bo="' + kSp + '"]')).length === 1, 'dán đúng thì lưu được và có nút gỡ');

  /* ================================================================= */
  console.log('\n### số công khai: ghi vào, ra bình quân ngày, và tiền không đổi');
  await den(p, 'nhap-so-lieu');
  await p.click('main [data-tab="soat"]');
  await p.waitForTimeout(800);
  await (await p.$('main [data-chon-bai]')).click();
  await p.waitForTimeout(900);
  mat = await chu(p);
  must(mat.indexOf('Số công khai trên store') >= 0, 'có khối số công khai');
  must(mat.indexOf('không dùng để tính tiền') >= 0, 'nhãn "không dùng để tính tiền" nằm ngay cạnh tiêu đề');
  must(mat.indexOf('không công bố số ra ngoài') >= 0, 'nền tảng không công bố nói thẳng ra');
  const oCk = await p.$$('main [data-ck]');
  must(oCk.length === 4, 'đúng bốn nền tảng có số công khai', String(oCk.length));
  const ntCk = await p.evaluate(() => document.querySelector('main [data-ck]').getAttribute('data-ck'));
  await p.fill('main [data-ck="' + ntCk + '"]', '120000');
  await p.click('main [data-ck-luu="' + ntCk + '"]');
  await p.waitForTimeout(900);
  must((await chu(p)).indexOf('120.000') >= 0 || (await chu(p)).indexOf('120,000') >= 0, 'số vừa ghi hiện lên');

  const tien1 = await p.evaluate(() => {
    const A = window.HAUSTEK.admin;
    const ky = A.periods.filter(x => A.isApproved(x.k));
    return A.agg('admin', 0, ky[ky.length - 1].idx, 'rec').artist;
  });
  must(Math.abs(tien1 - tien0) < 0.01, 'ghi số công khai mà tiền của đối tác không đổi', tien0 + ' → ' + tien1);

  console.log('\n### bàn làm việc vận hành đếm hồ sơ chưa đẩy tool');
  await den(p, 'ban-lam-viec');
  mat = await chu(p);
  must(mat.indexOf('Hồ sơ chưa đẩy tool nào') >= 0, 'bàn làm việc có ô số hồ sơ chưa đẩy tool');
  must((await p.$$('[data-di="phieu-giao"], [data-nav] [href="#phieu-giao"]')).length >= 1, 'có lối tắt sang phiếu giao việc');

  console.log('\n### vai không phải vận hành thì không vào được');
  await doiVai(p, 'support');
  await den(p, 'phieu-giao');
  must((await chu(p)).indexOf('Album Info') < 0, 'hỗ trợ không mở được phiếu giao việc');

  must(errs.length === 0, 'không có lỗi JavaScript', errs.slice(0, 3).join(' | '));
  console.log('\n' + (loi ? '✗ ' + loi + '/' + dem + ' phép sai' : '✓ ' + dem + '/' + dem + ' phép đúng'));
  await b.close();
  process.exit(loi ? 1 : 0);
})();
