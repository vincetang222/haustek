/* =====================================================================
   VÒNG 19 CHẠY THẬT TRONG TRÌNH DUYỆT
   ---------------------------------------------------------------------
   Sáu việc của vòng này, mỗi việc kiểm trên mặt chứ không kiểm trong lõi:

     · Không còn tên khoá lọt ra màn hình (cachMo, diemProducer…)
     · Phiếu giao việc: vận hành có nút, giám đốc chỉ có tình trạng
     · Trang ROI: ROI thấp hoặc hoàn vốn dài thì phải kêu ngay trên mặt
     · Nền tảng nhỏ bóc ra được ở cả hai cổng, cộng lại khớp
     · Tạm ứng nói bằng SỐ THÁNG, không nói bằng phần trăm
     · Bảng hết phẳng: đầu cột, kẻ dòng, dòng tổng tách hẳn nhau

       node portal/test/vong19-man.js
   ===================================================================== */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

let loi = 0, dem = 0;
function must(ok, ten, them) { dem++; if (!ok) { loi++; console.log('  ✗ ' + ten + (them ? ' · ' + them : '')); } else console.log('  ✓ ' + ten); }

const doiVai = (p, vai) => p.evaluate(v => {
  const A = window.HAUSTEK.admin, ai = A.staff.list().find(x => x.role === v && x.active !== false);
  if (ai) A.staff.setMe(ai.id);
}, vai);
const den = async (p, man) => {
  await p.evaluate(() => { location.hash = '#__khong_co__'; });
  await p.waitForTimeout(120);
  await p.evaluate(m => { location.hash = '#' + m; }, man);
  await p.waitForTimeout(1500);
};
const chu = p => p.evaluate(() => document.querySelector('main').textContent);

/* Tên khoá lọt ra màn hình là một phần tử mà TOÀN BỘ nội dung của nó là
   một định danh camelCase: "cachMo", "diemProducer". Phải đọc từng phần
   tử lá chứ không đọc textContent của cả trang — nối chữ của hai phần tử
   liền nhau ("…lượt nghe" + "Doanh thu") cũng ra hình dạng ấy mà không
   phải lỗi. Mã ISRC, mã hồ sơ và URL không dính vì có số, gạch hay dấu. */
const khoaLot = p => p.evaluate(() => {
  const ra = new Set();
  document.querySelectorAll('main *').forEach(e => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim();
    if (t.length < 5 || t.length > 40) return;
    if (!/^[a-z][A-Za-z]*[A-Z][A-Za-z]*$/.test(t)) return;
    ra.add(t);
  });
  return [...ra];
});
/* Tên nền tảng thật cũng có dạng ấy — iHeartRadio, friDay. Loại chúng ra
   bằng chính danh sách store của lõi, không bằng bảng chép tay; cổng đối
   tác đã lockdown nên danh sách phải lấy sẵn từ cổng nội bộ. */
let STORE = [];
const khoaThat = async p => (await khoaLot(p)).filter(x => STORE.indexOf(x) < 0);

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
  STORE = await p.evaluate(() => (window.HAUSTEK.admin.stores || []).map(String));

  /* ================================================================= */
  console.log('### không còn tên khoá lọt ra màn hình');
  await doiVai(p, 'ops');
  for (const m of ['phieu-giao', 'nen-tang', 'nhap-so-lieu']) {
    await den(p, m);
    const lot = await khoaThat(p);
    must(lot.length === 0, m + ' không lọt tên khoá', lot.slice(0, 5).join(', '));
  }

  /* ================================================================= */
  console.log('\n### phiếu giao việc: vận hành làm, giám đốc xét');
  await doiVai(p, 'ops'); await den(p, 'phieu-giao');
  must((await p.$$('main tr.pick')).length > 0, 'vận hành thấy danh sách hồ sơ');
  await p.click('main tr.pick'); await p.waitForTimeout(1200);
  must((await p.$$('main [data-chep]')).length > 0, 'vận hành có nút chép từng ô metadata');
  await p.click('main [data-tab="tool"]'); await p.waitForTimeout(1200);
  const nutTool = (await p.$$('main [data-tool], main [data-tool-bo]')).length;
  must(nutTool > 0, 'vận hành có nút đánh dấu đã đẩy tool', String(nutTool));
  /* Tab link chỉ có ô dán khi bài đã được cấp ISRC, nên phải mở đúng một
     hồ sơ đã có mã chứ không mở bừa hồ sơ đầu bảng. */
  await p.click('main [data-ve-ds]'); await p.waitForTimeout(900);
  await p.click('main [data-loc="link"]'); await p.waitForTimeout(900);
  const coLink = (await p.$$('main tr.pick')).length;
  must(coLink > 0, 'có hồ sơ đã phát hành còn thiếu link để thử');
  await p.click('main tr.pick'); await p.waitForTimeout(1200);
  await p.click('main [data-tab="link"]'); await p.waitForTimeout(1200);
  must((await p.$$('main [data-link-luu]')).length > 0, 'vận hành có nút lưu link');

  /* Đổi vai xong phải quay về danh sách: màn nhớ hồ sơ đang mở. */
  await doiVai(p, 'mgmt'); await den(p, 'phieu-giao');
  if ((await p.$$('main [data-ve-ds]')).length) { await p.click('main [data-ve-ds]'); await p.waitForTimeout(900); }
  let matGd = await chu(p);
  must((await p.$$('main .kpi')).length >= 4, 'giám đốc thấy dải ô số tiến độ trước danh sách');
  must(matGd.indexOf('Chưa đẩy tool nào') >= 0, 'ô số nói rõ bao nhiêu hồ sơ chưa lên tool nào');
  must(matGd.indexOf('Đọng (ngày)') >= 0 && matGd.indexOf('Chạm gần nhất') >= 0, 'bảng có cột đọng bao lâu và ai chạm gần nhất');
  must((await p.$$('main [data-chep]')).length === 0, 'giám đốc không có nút chép ở danh sách');
  await p.click('main tr.pick'); await p.waitForTimeout(1200);
  must((await p.$$('main [data-chep]')).length === 0, 'giám đốc mở hồ sơ vẫn không có nút chép từng ô');
  must((await p.$$('main [data-chep-khoi]')).length === 0, 'giám đốc không có nút chép cả khối');
  await p.click('main [data-tab="tool"]'); await p.waitForTimeout(1200);
  must((await p.$$('main [data-tool], main [data-tool-bo]')).length === 0, 'giám đốc không có nút đánh dấu tool');
  must((await chu(p)).indexOf('Đã đẩy') >= 0 || (await chu(p)).indexOf('Chưa') >= 0, 'giám đốc vẫn đọc được tình trạng từng tool');
  await p.click('main [data-tab="link"]'); await p.waitForTimeout(1200);
  must((await p.$$('main [data-link-luu], main [data-link-bo]')).length === 0, 'giám đốc không có nút sửa link');
  await p.click('main [data-tab="store"]'); await p.waitForTimeout(1200);
  must((await p.$$('main [data-store-luu]')).length === 0, 'giám đốc không có nút lưu danh sách store');
  must((await p.$$('main [data-store]:not([disabled])')).length === 0, 'ô tick store bị khoá với giám đốc');

  /* ================================================================= */
  console.log('\n### trang ROI: rủi ro phải kêu ngay trên mặt');
  await doiVai(p, 'mgmt'); await den(p, 'roi');
  const dat = async (k, v) => { await p.evaluate(([kk, vv]) => {
    const el = document.querySelector('main [data-r="' + kk + '"]');
    if (!el) throw new Error('không thấy ô ' + kk);
    el.value = String(vv);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, [k, v]); await p.waitForTimeout(900); };
  const oSo = await p.$$('main [data-r]');
  must(oSo.length > 0, 'trang ROI có ô nhập');
  await dat('monthlyIncome', 3300);
  await dat('cashAdvance', 3000);
  let matRoi = await chu(p);
  must(matRoi.indexOf('Cảnh báo rủi ro') < 0, 'khoản nhỏ về nhanh thì không kêu');
  await dat('cashAdvance', 120000);
  matRoi = await chu(p);
  must(matRoi.indexOf('Cảnh báo rủi ro') >= 0, 'khoản lớn phải có thẻ cảnh báo rủi ro');
  must(matRoi.indexOf('Rủi ro cao') >= 0, 'vượt trần 28 tháng thì ghi rủi ro cao');
  must(/sàn\s*20/.test(matRoi) || matRoi.indexOf('dưới sàn') >= 0, 'cảnh báo nói rõ sàn ROI 20%');
  must(matRoi.indexOf('28') >= 0, 'cảnh báo nói rõ trần 28 tháng');
  must(matRoi.indexOf('undefined') < 0 && matRoi.indexOf('NaN') < 0, 'thẻ cảnh báo không lọt undefined hay NaN');

  /* ================================================================= */
  console.log('\n### tạm ứng nói bằng số tháng, không nói bằng phần trăm');
  const ung = await p.evaluate(() => {
    const A = window.HAUSTEK.admin, pk = A.parties.list().rows[0].partyKey;
    const c = A.advanceCalc(pk, 0, 0.12);
    return { capThang: c.capThang, grade: c.grade, max: c.maxAdvance, thang: c.monthlyForward };
  });
  must(ung.capThang >= 12 && ung.capThang <= 18, 'trần tạm ứng nằm trong 12–18 tháng', String(ung.capThang));
  must(Math.abs(ung.max - ung.thang * ung.capThang) <= 1, 'trần đúng bằng số tháng × thu nhập ròng một tháng');

  /* ================================================================= */
  console.log('\n### nền tảng nhỏ bóc ra được, cộng lại khớp');
  await doiVai(p, 'ops'); await den(p, 'nen-tang');
  let matNt = await chu(p);
  must(matNt.indexOf('Trong "Nền tảng khác" có gì') >= 0, 'nội bộ có thẻ bóc nền tảng nhỏ');
  must((await p.$$('main [data-tim-duoi]')).length === 1, 'thẻ có ô tìm tên nền tảng');
  must(matNt.indexOf('Deezer') >= 0 || matNt.indexOf('Tidal') >= 0, 'thấy tên nền tảng nhỏ thật');
  const soDong = await p.evaluate(() => document.querySelectorAll('#nt-duoi tbody tr').length);
  must(soDong > 50, 'bảng bóc ra hàng trăm dòng, không phải vài dòng', String(soDong));
  await p.fill('main [data-tim-duoi]', 'deez'); await p.waitForTimeout(700);
  const locDong = await p.evaluate(() => document.querySelectorAll('#nt-duoi tbody tr').length);
  must(locDong > 0 && locDong < soDong, 'ô tìm lọc được danh sách', locDong + '/' + soDong);
  must(errs.length === 0, 'thẻ nền tảng nhỏ không gây lỗi JavaScript', errs.slice(0, 2).join(' | '));

  /* ================================================================= */
  console.log('\n### bảng hết phẳng: đầu cột, kẻ dòng, dòng tổng tách hẳn');
  for (const th of ['light', 'dark']) {
    await p.evaluate(t => {
      const ds = [...document.querySelectorAll('[data-th="' + t + '"]')];
      (ds.find(e => e.getBoundingClientRect().width > 0) || ds[0]).click();
    }, th);
    await p.waitForTimeout(400);
    const d = await p.evaluate(() => {
      const L = c => { const s = c / 255; return s <= .03928 ? s / 12.92 : Math.pow((s + .055) / 1.055, 2.4); };
      const doc = s => (s.match(/-?\d+(\.\d+)?/g) || [0, 0, 0]).slice(0, 3).map(Number);
      const lum = ([r, g, b]) => .2126 * L(r) + .7152 * L(g) + .0722 * L(b);
      const ct = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      const th = document.querySelector('main table.t thead th');
      const td = document.querySelector('main table.t tbody td');
      if (!th || !td) return null;
      const the = th.closest('.the') || th.closest('.card') || document.querySelector('main .the') || document.body;
      const nenThe = doc(getComputedStyle(the).backgroundColor);
      const s = getComputedStyle(th), s2 = getComputedStyle(td);
      return {
        dauCot: ct(doc(s.backgroundColor), nenThe),
        dam: +s.fontWeight,
        keDuoiDau: parseFloat(s.borderBottomWidth),
        keDong: ct(doc(s2.borderBottomColor), nenThe),
        keDongDay: parseFloat(s2.borderBottomWidth)
      };
    });
    must(!!d, th + ': đọc được kiểu của bảng');
    if (!d) continue;
    must(d.dauCot >= 1.12, th + ': dải đầu cột tách khỏi mặt thẻ', d.dauCot.toFixed(3));
    must(d.dam >= 600, th + ': chữ đầu cột đậm', String(d.dam));
    must(d.keDuoiDau >= 2, th + ': kẻ dưới đầu cột dày hơn kẻ giữa dòng', d.keDuoiDau + 'px vs ' + d.keDongDay + 'px');
    must(d.keDong >= 1.2, th + ': kẻ giữa hai dòng đủ rõ để thấy dòng', d.keDong.toFixed(3));
  }
  await p.evaluate(() => {
    const ds = [...document.querySelectorAll('[data-th="light"]')];
    (ds.find(e => e.getBoundingClientRect().width > 0) || ds[0]).click();
  });

  /* ================================================================= */
  console.log('\n### cổng đối tác: nền tảng nhỏ và chú thích trong dấu ?');
  await p.goto('http://127.0.0.1:8099/v2/khach.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  await p.evaluate(() => { location.hash = '#k-nen-tang'; });
  await p.waitForTimeout(1600);
  const matK = await chu(p);
  must(matK.indexOf('Trong "Nền tảng khác" có gì') >= 0, 'đối tác cũng bóc được nền tảng nhỏ');
  must((await p.$$('main #k-nt-duoi tbody tr')).length > 20, 'bảng của đối tác có nhiều dòng');
  must(!/Doanh thu gộp|Phí Haustek/.test(matK), 'thẻ nền tảng nhỏ của đối tác không lộ số gộp hay phí');
  const lotK = await khoaThat(p);
  must(lotK.length === 0, 'trang nền tảng đối tác không lọt tên khoá', lotK.slice(0, 4).join(', '));

  await p.evaluate(() => { location.hash = '#k-tam-ung'; });
  await p.waitForTimeout(1600);
  const matTu = await chu(p);
  must(/\d+ tháng thu nhập/.test(matTu) || matTu.indexOf('tháng thu nhập') >= 0,
    'mức tối đa nói bằng số tháng thu nhập');
  must((await p.$$('main .help')).length > 0, 'chú thích nằm trong dấu ? cạnh tiêu đề');
  must(await p.evaluate(() => window.HAUSTEK.admin === undefined), 'cổng đối tác vẫn không có mặt tiền admin');

  must(errs.length === 0, 'không có lỗi JavaScript', errs.slice(0, 3).join(' | '));
  console.log('\n' + (loi ? '✗ ' + loi + '/' + dem + ' phép sai' : '✓ ' + dem + '/' + dem + ' phép đúng'));
  await b.close();
  process.exit(loi ? 1 : 0);
})();
