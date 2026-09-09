/* =====================================================================
   VÒNG 16 CHẠY THẬT TRONG TRÌNH DUYỆT
   ---------------------------------------------------------------------
   Hai thứ của vòng này đều là "gõ vào một chỗ, tiền đổi ở chỗ khác",
   nên phép kiểm phải đi đúng con đường người dùng đi: gõ mức trả ở trang
   Mức trả rồi đọc lại số tiền, gõ số đối soát ở trang Nhập số liệu rồi
   đọc lại trạng thái. Quét khung không bắt được loại lỗi này.

     · Mức trả: bảng tác động có thật, đổi theo ô vừa gõ, biên âm thì đỏ
     · Đối soát ngày: gõ số nền tảng trả về, khớp / lệch, gỡ ra hoàn nguyên
     · Đối soát theo bài: đường dẫn store thật, gõ số cho từng nền tảng
     · Cổng đối tác: bảng giải thích ghi rõ nền tảng nào chạy theo bảng giá

       node portal/test/vong16-man.js
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
  console.log('### bảng giá nền tảng có bảng tác động lên tiền thật');
  await doiVai(p, 'mgmt');
  await den(p, 'muc-tra');
  let mat = await chu(p);
  must(mat.indexOf('Đặt mức này thì kỳ') >= 0, 'trang có khối "đặt mức này thì kỳ … ra sao"');
  must((await p.$$('main table.t tbody tr.sum')).length >= 1, 'bảng tác động có dòng tổng');
  must(mat.indexOf('Chưa nền tảng nào có giá chào') >= 0, 'chưa có giá chào thì nói rõ gộp ghi nhận bằng gộp thật');
  must((await p.$$('main [data-khach]')).length >= 8, 'mỗi nền tảng có một ô nhập mức trả đối tác');

  /* mức thực tế của kỳ chốt gần nhất, để gõ một con số có nghĩa */
  const soLieu = await p.evaluate(() => {
    const A = window.HAUSTEK.admin;
    const ky = A.periods.filter(x => A.isApproved(x.k));
    const pi = ky.length ? ky[ky.length - 1].idx : A.periods.length - 1;
    const d = A.mucTraTacDong(pi);
    const sp = d.rows[0];
    const a = A.agg('admin', 0, pi, 'rec');
    return { pi: pi, nt: sp.name, thuc: sp.thucTe1k, tra: d.tra, artist: a.artist, fee: a.fee };
  });
  must(soLieu.thuc > 0, 'đọc được mức thực tế của ' + soLieu.nt, String(soLieu.thuc));

  console.log('\n### gõ mức trả đối tác thì tiền của đối tác đổi theo');
  const q = s => 'main [data-' + s + '="' + soLieu.nt + '"]';
  await p.fill(q('gia'), String(soLieu.thuc));
  await p.fill(q('khach'), String(Math.round(soLieu.thuc * 0.875 * 10000) / 10000));
  await p.click(q('luu'));
  await p.waitForTimeout(900);
  mat = await chu(p);
  must(mat.indexOf('Bảng giá') >= 0, 'bảng tác động gắn nhãn nền tảng chạy theo bảng giá');
  must(mat.indexOf('Chưa nền tảng nào nhập mức trả đối tác') < 0, 'ghi chú "chưa nhập" biến mất khi đã nhập');
  const sau = await p.evaluate(pi => {
    const A = window.HAUSTEK.admin, a = A.agg('admin', 0, pi, 'rec');
    return { tra: A.mucTraTacDong(pi).tra, artist: a.artist, fee: a.fee, gross: a.gross };
  }, soLieu.pi);
  must(Math.abs(sau.tra - soLieu.tra) > 1, 'tiền trả đối tác đổi sau khi đặt mức', soLieu.tra + ' → ' + sau.tra);
  must(Math.abs(sau.artist - soLieu.artist) > 1, 'phần về nghệ sĩ đổi theo mức vừa đặt');
  must(Math.abs(sau.gross - sau.fee - sau.artist - (sau.gross - sau.fee - sau.artist)) < 1, 'chuỗi vẫn cộng được');

  console.log('\n### hứa trả cao hơn mức nền tảng trả về thì hiện ra đỏ, không giấu');
  const cao = Math.round(soLieu.thuc * 1.2 * 10000) / 10000;
  await p.fill(q('gia'), String(cao));
  await p.fill(q('khach'), String(cao));
  await p.click(q('luu'));
  await p.waitForTimeout(900);
  mat = await chu(p);
  must(mat.indexOf('đang chào cao hơn số nền tảng trả về') >= 0, 'có cảnh báo chênh lệch bảng giá âm');
  must((await p.$$('main table.t tbody tr.canh')).length >= 1, 'dòng âm được đánh dấu');
  must((await p.$$('main table.t .neg')).length >= 1, 'số âm hiện màu âm');

  console.log('\n### gỡ bảng giá thì mọi số quay về như cũ');
  await p.click(q('bo'));
  await p.waitForTimeout(900);
  const ve = await p.evaluate(pi => {
    const A = window.HAUSTEK.admin, a = A.agg('admin', 0, pi, 'rec');
    return { tra: A.mucTraTacDong(pi).tra, artist: a.artist, fee: a.fee };
  }, soLieu.pi);
  must(Math.abs(ve.artist - soLieu.artist) < 1 && Math.abs(ve.fee - soLieu.fee) < 1, 'gỡ ra thì số hoàn nguyên');
  must(Math.abs(ve.tra - soLieu.tra) < 1, 'bảng tác động cũng hoàn nguyên');

  /* ================================================================= */
  console.log('\n### đối soát lượt nghe theo nền tảng của một ngày');
  await doiVai(p, 'ops');
  await den(p, 'nhap-so-lieu');
  const nutNgay = await p.$('main [data-soat-ngay]');
  must(nutNgay !== null, 'mỗi ngày có nút mở bảng đối soát');
  await nutNgay.click();
  await p.waitForTimeout(800);
  const oNt = await p.$$('main [data-so-nt]');
  must(oNt.length === 8, 'bảng đối soát có đủ tám nền tảng', String(oNt.length));
  const ngay = await p.evaluate(() => document.querySelector('main [data-soat-ngay].on, main [data-soat-ngay]').getAttribute('data-soat-ngay'));
  const nt0 = await p.evaluate(() => document.querySelector('main [data-so-nt]').getAttribute('data-so-nt'));
  const heThong = await p.evaluate(a => window.HAUSTEK.admin.nhapLieu.nenTangNgay(a[0]).find(r => r.plat === a[1]).heThong, [ngay, nt0]);
  must(heThong > 0, 'nền tảng đầu bảng có số hệ thống để đối chiếu');

  await p.fill('main [data-so-nt="' + nt0 + '"]', String(Math.round(heThong * 1.005)));
  await p.click('main [data-luu-nt="' + nt0 + '"]');
  await p.waitForTimeout(900);
  let tt = await p.evaluate(a => window.HAUSTEK.admin.nhapLieu.nenTangNgay(a[0]).find(r => r.plat === a[1]), [ngay, nt0]);
  must(tt.trangThai === 'khop', 'lệch nửa phần trăm được coi là khớp', tt.trangThai);
  must((await chu(p)).indexOf('undefined') < 0, 'bảng đối soát không lọt undefined');

  await p.fill('main [data-so-nt="' + nt0 + '"]', String(Math.round(heThong * 1.4)));
  await p.click('main [data-luu-nt="' + nt0 + '"]');
  await p.waitForTimeout(900);
  tt = await p.evaluate(a => window.HAUSTEK.admin.nhapLieu.nenTangNgay(a[0]).find(r => r.plat === a[1]), [ngay, nt0]);
  must(tt.trangThai === 'lech' && Math.abs(tt.lechPct - 0.4) < 0.02, 'lệch bốn mươi phần trăm bị đánh dấu lệch', tt.trangThai);
  must((await p.$$('main table.t tbody tr.canh')).length >= 1, 'dòng lệch được đánh dấu trên mặt');

  await p.click('main [data-bo-nt="' + nt0 + '"]');
  await p.waitForTimeout(900);
  tt = await p.evaluate(a => window.HAUSTEK.admin.nhapLieu.nenTangNgay(a[0]).find(r => r.plat === a[1]), [ngay, nt0]);
  must(tt.trangThai === 'cho' && tt.thucTe == null, 'gỡ đối soát thì về lại chờ');

  /* ================================================================= */
  console.log('\n### đối soát theo bài đi qua đường dẫn store của bài ấy');
  await p.click('main [data-tab="soat"]');
  await p.waitForTimeout(800);
  const dongBai = await p.$('main [data-chon-bai]');
  must(dongBai !== null, 'có danh sách bài để chọn');
  const idBai = await p.evaluate(() => +document.querySelector('main [data-chon-bai]').getAttribute('data-chon-bai'));
  await dongBai.click();
  await p.waitForTimeout(900);
  await p.evaluate(i => { window.__baiDaChon = i; }, idBai);
  const link = await p.$$eval('main a[href^="https://"]', a => a.map(x => x.getAttribute('href')));
  must(link.length >= 3, 'bài đã chọn có đường dẫn store thật', String(link.length));
  must(link.every(h => h.indexOf('https://') === 0), 'mọi đường dẫn đều là https');
  const oBai = await p.$$('main [data-so-bai-nt]');
  must(oBai.length >= 3, 'mỗi nền tảng của bài có một ô nhập số', String(oBai.length));
  const ntBai = await p.evaluate(() => document.querySelector('main [data-so-bai-nt]').getAttribute('data-so-bai-nt'));
  await p.fill('main [data-so-bai-nt="' + ntBai + '"]', '98765');
  await p.click('main [data-luu-bai-nt="' + ntBai + '"]');
  await p.waitForTimeout(900);
  const daGhi = await p.evaluate(a => {
    const A = window.HAUSTEK.admin;
    return A.nhapLieu.baiNgay(a[0], a[1]).rows.find(r => r.plat === a[2]);
  }, [await p.evaluate(() => window.__baiDaChon), await p.evaluate(() => document.querySelector('main [data-soat-chon-ngay]').value), ntBai]);
  must(daGhi && daGhi.thucTe === 98765, 'số đối soát theo bài được ghi đúng', JSON.stringify(daGhi && daGhi.thucTe));
  must(await p.$('main [data-bo-bai-nt="' + ntBai + '"]') !== null, 'gõ xong thì có nút gỡ ngay bên cạnh');
  await p.click('main [data-bo-bai-nt="' + ntBai + '"]');
  await p.waitForTimeout(900);
  const daGo = await p.evaluate(a => {
    const A = window.HAUSTEK.admin;
    return A.nhapLieu.baiNgay(a[0], a[1]).rows.find(r => r.plat === a[2]);
  }, [await p.evaluate(() => window.__baiDaChon), await p.evaluate(() => document.querySelector('main [data-soat-chon-ngay]').value), ntBai]);
  must(daGo && daGo.thucTe == null && daGo.trangThai === 'cho', 'gỡ đối soát theo bài thì về lại chờ');
  must((await chu(p)).indexOf('NaN') < 0, 'bảng theo bài không lọt NaN');

  /* ================================================================= */
  console.log('\n### cổng đối tác đọc được nền tảng nào chạy theo bảng giá');
  await doiVai(p, 'mgmt');
  await den(p, 'muc-tra');
  await p.fill(q('gia'), String(soLieu.thuc));
  await p.fill(q('khach'), String(Math.round(soLieu.thuc * 0.9 * 10000) / 10000));
  await p.click(q('luu'));
  await p.waitForTimeout(800);

  await p.goto('http://127.0.0.1:8099/v2/khach.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  await p.evaluate(() => { location.hash = '#k-bang-ke'; });
  await p.waitForTimeout(900);
  const nutGt = await p.$('[data-gt]');
  must(nutGt !== null, 'bảng kê có nút giải thích con số');
  if (nutGt) {
    await nutGt.click();
    await p.waitForTimeout(700);
    const hop = await p.evaluate(() => { const m = document.querySelector('.modal'); return m ? m.textContent : ''; });
    must(hop.indexOf('bảng giá') >= 0, 'bảng giải thích ghi rõ nền tảng chạy theo bảng giá');
    must(hop.indexOf('undefined') < 0 && hop.indexOf('NaN') < 0, 'bảng giải thích không lọt undefined hay NaN');
    must(hop.indexOf('khach') < 0 && hop.indexOf('bienPct') < 0, 'bảng giải thích không lộ mức gốc hay biên');
  }

  must(errs.length === 0, 'không có lỗi JavaScript', errs.slice(0, 3).join(' | '));
  console.log('\n' + (loi ? '✗ ' + loi + '/' + dem + ' phép sai' : '✓ ' + dem + '/' + dem + ' phép đúng'));
  await b.close();
  process.exit(loi ? 1 : 0);
})();
