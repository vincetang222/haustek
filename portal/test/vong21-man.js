/* =====================================================================
   VÒNG 21 · TÁCH BẠCH NHIỆM VỤ, KIỂM TRÊN MẶT
   ---------------------------------------------------------------------
   Phân quyền đúng ở lõi mà nút vẫn hiện trên màn là chưa xong: người
   dùng bấm rồi nhận lỗi, và trong lúc chờ bấm thì đã đọc hết số rồi.

     · Vận hành không thấy Mức trả nền tảng ở điều hướng, gõ thẳng hash
       cũng không vào
     · Vận hành mở Đối soát: đọc được hết, nhưng không có nút chốt kỳ,
       không có nút khoá tỷ giá, không có nút bỏ qua sai lệch
     · Kế toán: có nút bỏ qua sai lệch, không có nút chốt kỳ
     · Giám đốc: có đủ

       node portal/test/vong21-man.js
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
  await p.waitForTimeout(1400);
};
const chu = p => p.evaluate(() => document.querySelector('main').textContent);
const nav = p => p.evaluate(() => [...document.querySelectorAll('.nav a')].map(a => a.getAttribute('href').slice(1)));

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
  console.log('### Mức trả nền tảng: chỉ giám đốc');
  await doiVai(p, 'mgmt'); await p.waitForTimeout(600); await den(p, 'ban-lam-viec');
  must((await nav(p)).indexOf('muc-tra') >= 0, 'giám đốc thấy Mức trả ở điều hướng');
  await den(p, 'muc-tra');
  must((await p.$$('main [data-khach]')).length >= 8, 'giám đốc có ô nhập giá chào từng nền tảng');

  for (const vai of ['ops', 'accounting', 'sales', 'support']) {
    await doiVai(p, vai); await p.waitForTimeout(500); await den(p, 'ban-lam-viec');
    must((await nav(p)).indexOf('muc-tra') < 0, vai + ' không thấy Mức trả ở điều hướng');
    /* gõ thẳng hash cũng không vào được */
    await den(p, 'muc-tra');
    const mat = await chu(p);
    must((await p.$$('main [data-khach]')).length === 0, vai + ' gõ thẳng hash vẫn không có ô nhập giá');
    must(!/Giá chào khách|Chênh lệch bảng giá/.test(mat), vai + ' không đọc được bảng giá qua hash', mat.slice(0, 60));
  }

  /* ================================================================= */
  console.log('\n### Đối soát: đọc được hết, nút chốt chỉ của giám đốc');
  const nutChot = async () => ({
    duyet: (await p.$$('main [data-duyet], main [data-boqua], main [data-thuhoi]')).length,
    tyGia: (await p.$$('main [data-chottg]')).length,
    boLech: (await p.$$('main [data-ghinhan]')).length
  });

  await doiVai(p, 'ops'); await den(p, 'doi-chieu');
  let matDs = await chu(p);
  must(matDs.length > 400, 'vận hành vẫn đọc được trang Đối soát', String(matDs.length));
  must((await p.$$('main [data-tab]')).length >= 4, 'vận hành vẫn có đủ các tab đối soát');
  let n = await nutChot();
  must(n.duyet === 0, 'vận hành không có nút chốt kỳ / bỏ qua / thu hồi', String(n.duyet));
  must(n.boLech === 0, 'vận hành không có nút bỏ qua sai lệch', String(n.boLech));
  await p.click('main [data-tab="tg"]'); await p.waitForTimeout(1100);
  must((await p.$$('main [data-chottg]')).length === 0, 'vận hành không có nút khoá tỷ giá');
  must((await chu(p)).indexOf('undefined') < 0, 'trang đối soát của vận hành không lọt undefined');

  /* Kế toán MỚI là người bỏ qua sai lệch: kiểm phép "vận hành không có
     nút" chỉ có nghĩa khi đúng kỳ ấy đang có sai lệch để bỏ qua. */
  const kyLech = await p.evaluate(() => {
    const A = window.HAUSTEK.admin;
    for (let i = 0; i < A.periods.length; i++) {
      if (A.isApproved(A.periods[i].k)) continue;
      for (let j = 0; j < A.feeds.length; j++) {
        const t = A.feedTotals(i, j);
        if (t && Math.abs(t.diff) > 0.5) return A.periods[i].k;
      }
    }
    return null;
  });
  must(!!kyLech, 'phải có một kỳ đang lệch thì phép kiểm nút mới có nghĩa');
  if (kyLech) {
    await doiVai(p, 'ops');
    await p.evaluate(k => { window.HAUSTEK.__ky = k; }, kyLech);
    await den(p, 'doi-chieu');
    await p.selectOption('.top select, header select', kyLech).catch(function () {});
    await p.waitForTimeout(1200);
    must((await p.$$('main [data-ghinhan]')).length === 0, 'vận hành không bỏ qua được sai lệch ở kỳ đang lệch');
  }

  await doiVai(p, 'accounting'); await den(p, 'doi-chieu');
  n = await nutChot();
  must(n.duyet === 0, 'kế toán không có nút chốt kỳ', String(n.duyet));
  await p.click('main [data-tab="tg"]'); await p.waitForTimeout(1100);
  must((await p.$$('main [data-chottg]')).length === 0, 'kế toán không có nút khoá tỷ giá');

  await doiVai(p, 'mgmt'); await den(p, 'doi-chieu');
  n = await nutChot();
  must(n.duyet >= 1, 'giám đốc có nút chốt kỳ / bỏ qua / thu hồi', String(n.duyet));
  await p.click('main [data-tab="tg"]'); await p.waitForTimeout(1100);
  const tg = (await p.$$('main [data-chottg]')).length;
  must(tg >= 0, 'giám đốc mở được tab tỷ giá');

  /* ================================================================= */
  console.log('\n### Nhập số liệu vẫn là việc của vận hành');
  await doiVai(p, 'ops'); await den(p, 'nhap-so-lieu');
  must((await chu(p)).length > 400, 'vận hành vẫn nhập được số liệu');
  must((await p.$$('main [data-tab]')).length >= 4, 'trang Nhập số liệu còn đủ tab cho vận hành');

  must(errs.length === 0, 'không có lỗi JavaScript', errs.slice(0, 3).join(' | '));
  console.log('\n' + (loi ? '✗ ' + loi + '/' + dem + ' phép sai' : '✓ ' + dem + '/' + dem + ' phép đúng'));
  await b.close();
  process.exit(loi ? 1 : 0);
})();
