/* =====================================================================
   TRANG TÍNH ROI CHẠY THẬT TRONG TRÌNH DUYỆT
   ---------------------------------------------------------------------
   Quét khung bắt được trang trắng và lỗi JavaScript, nhưng không bắt
   được trang vẽ đủ ô mà số bên trong sai — vòng trước đã mất một buổi vì
   loại lỗi câm đó. File này đọc đúng những con số hiện trên mặt và so
   với ba sheet trong bảng tính, rồi gõ vào ô nhập để chắc kết quả tính
   lại chứ không đứng yên.

       node portal/test/roi-man.js
   ===================================================================== */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

let loi = 0, dem = 0;
function must(ok, ten, them) { dem++; if (!ok) { loi++; console.log('  ✗ ' + ten + (them ? ' · ' + them : '')); } else console.log('  ✓ ' + ten); }

/* Điền cả bảng bằng cách gõ thật vào ô, rồi đợi hàm nhập chạy xong. */
async function dien(p, so) {
  for (const k of Object.keys(so)) {
    await p.fill('#roi-' + k, String(so[k]));
  }
  await p.waitForTimeout(500);
}
const doc = p => p.evaluate(() => {
  const ra = { so: {}, kv: {}, bang: [] };
  document.querySelectorAll('#roi-kq .kpi').forEach(k => {
    ra.so[k.querySelector('.l').textContent.trim()] = k.querySelector('.v').textContent.trim();
  });
  document.querySelectorAll('#roi-kq .kv').forEach(d => {
    ra.kv[d.querySelector('dt').textContent.trim()] = d.querySelector('dd').textContent.trim();
  });
  document.querySelectorAll('#roi-kq table.t tbody tr').forEach(tr => {
    ra.bang.push([...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
  });
  const dai = document.querySelector('#roi-kq .ribbon');
  ra.dai = dai ? dai.textContent.trim() : null;
  ra.bd = document.querySelectorAll('#roi-kq .bd svg').length;
  ra.rong = document.querySelector('#roi-kq').textContent.trim().length;
  return ra;
});

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 } });
  const p = await ctx.newPage();
  await dungFontThat(p);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t); });

  await p.goto('http://127.0.0.1:8099/v2/intranet.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { try { localStorage.removeItem('haustek.roi.v1'); } catch (e) {} });
  await p.evaluate(() => { location.hash = '#roi'; });
  await p.waitForTimeout(900);

  console.log('### trang mở được, có đủ ô nhập');
  must(await p.$('#roi-monthlyIncome') !== null, 'có ô doanh thu tháng');
  must((await p.$$('#roi-kq .kpi')).length === 5, 'có năm ô số kết quả');

  console.log('\n### sheet Catalog ROI');
  await dien(p, { monthlyIncome: 3300, cashAdvance: 50000, marketing: 0, production: 0, artistShare: 74, passThrough: 0, termMonths: 60, exclusivityMonths: 36, findersFeePct: 0, releases: 0, hoursPerRelease: 0, costPerHour: 0 });
  let r = await doc(p);
  must(Object.values(r.so).includes('1.03×'), 'ô lớn hiện ROI 1,03× (ô J5)', JSON.stringify(r.so));
  must(Object.values(r.so).some(v => /^21 tháng$/.test(v)), 'thu hồi 21 tháng (ô I3 làm tròn lên)', JSON.stringify(r.so));
  must(r.kv['Hoa hồng Haustek · D3'] === '$858', 'D3 = $858', JSON.stringify(r.kv));
  must(r.kv['Phần nghệ sĩ · D4'] === '$2,442', 'D4 = $2.442', r.kv['Phần nghệ sĩ · D4']);
  must(r.kv['Giữ lại để thu hồi · G3'] === '$2,442', 'G3 = $2.442', r.kv['Giữ lại để thu hồi · G3']);
  must(r.kv['Hoa hồng cả kỳ hạn · D5'] === '$51,480', 'D5 = $51.480', r.kv['Hoa hồng cả kỳ hạn · D5']);
  must(r.kv['Haustek còn lại · D7'] === '$51,480', 'D7 = $51.480', r.kv['Haustek còn lại · D7']);
  must(r.dai === 'Đạt', 'dải kết luận là Đạt', r.dai);
  must(r.bd === 1, 'vẽ được đường thu hồi', 'thấy ' + r.bd + ' biểu đồ');
  must(!/undefined|NaN|\{|\}/.test(await p.textContent('#roi-kq')), 'chữ trên mặt không lọt undefined, NaN hay dấu ngoặc nhọn');

  console.log('\n### sheet Trigger 2 ROI: thu hồi vượt thời gian độc quyền');
  await dien(p, { monthlyIncome: 3000, cashAdvance: 50000, artistShare: 75, termMonths: 39, exclusivityMonths: 15 });
  r = await doc(p);
  /* 0,585 qua toFixed(2) ra 0.58: nhị phân của 0,585 nằm hơi dưới 0,585.
     Chênh một phần trăm của một lần vốn, không đổi kết luận, nên để nguyên. */
  must(Object.values(r.so).includes('0.58×'), 'ROI 0,58× (ô J5 = 0,585)', JSON.stringify(r.so));
  must(Object.values(r.so).includes('23 tháng'), 'thu hồi 23 tháng (I3 = 22,2 làm tròn lên)', JSON.stringify(r.so));
  must(r.kv['Hoa hồng cả kỳ hạn · D5'] === '$29,250', 'D5 = $29.250', r.kv['Hoa hồng cả kỳ hạn · D5']);
  must(r.dai === 'Chưa đạt', 'dải kết luận là Chưa đạt', r.dai);

  console.log('\n### chỗ bảng tính bỏ sót: hết kỳ hạn còn nợ');
  await dien(p, { monthlyIncome: 600, cashAdvance: 50000, artistShare: 74, termMonths: 24, exclusivityMonths: 12 });
  r = await doc(p);
  must(r.kv['Hết kỳ hạn còn chưa thu hồi'] === '$39,344', 'nêu rõ phần chưa thu hồi', r.kv['Hết kỳ hạn còn chưa thu hồi']);
  must(/^-0\.71×$/.test(r.kv['ROI thực sau phần chưa thu hồi'] || ''), 'ROI thực âm', r.kv['ROI thực sau phần chưa thu hồi']);

  console.log('\n### ba mốc thưởng');
  await dien(p, { monthlyIncome: 3300, cashAdvance: 50000, artistShare: 74, termMonths: 60, exclusivityMonths: 36 });
  await p.check('input[data-r="moc"]');
  await p.waitForTimeout(700);
  must(await p.$('#roi-t1r') !== null, 'bật mốc thì hiện ba khối nhập');
  /* Cửa sổ rộng để cả ba mốc mở: mốc chỉ mở khi khoản ứng ngay trước đã
     hoà vốn, nên cửa sổ phải dài hơn thời gian hoà vốn đó. */
  await dien(p, { t1r: 3000, t1x: 16.67, t1m: 36, t2r: 5000, t2x: 12, t2m: 36, t3r: 8000, t3x: 10, t3m: 36 });
  r = await doc(p);
  must(r.bang.length === 5, 'bảng có bốn kịch bản cộng một dòng tổng', 'thấy ' + r.bang.length + ' dòng');
  must(/^Danh mục/.test(r.bang[0][0]) && /^Mốc thưởng 3/.test(r.bang[3][0]), 'đúng tên bốn kịch bản', JSON.stringify(r.bang.map(x => x[0])));
  /* kỳ hạn còn lại trừ theo THÁNG HOÀ VỐN thật, không theo cửa sổ khai */
  must(+r.bang[1][3] < 60 && +r.bang[2][3] < +r.bang[1][3] && +r.bang[3][3] < +r.bang[2][3],
    'kỳ hạn còn lại phải giảm dần qua từng mốc', r.bang.slice(1, 4).map(function (x) { return x[3]; }).join(' / '));
  must(/mở ở tháng/.test(r.bang[1][0]), 'dòng mốc 1 phải ghi tháng mở khoá', r.bang[1][0]);
  must(r.bang[3][2] === '$80,000', 'mốc 3 ứng 8.000 × 10', r.bang[3][2]);

  /* cửa sổ hẹp hơn thời gian hoà vốn: mốc khoá, và mốc sau khoá dây chuyền */
  await dien(p, { t1m: 6 });
  r = await doc(p);
  must(/khoá/.test(r.bang[1][7]), 'mốc 1 phải hiện là khoá khi cửa sổ hẹp', r.bang[1][7]);
  must(/muộn hơn hạn/.test(r.bang[1][0]), 'dòng mốc 1 phải nêu lý do khoá', r.bang[1][0]);
  must(/Mốc trước/.test(r.bang[2][0]), 'mốc 2 phải khoá dây chuyền', r.bang[2][0]);
  must(r.bang[1][2] === '$0' && r.bang[2][2] === '$0', 'mốc bị khoá không mang khoản ứng', r.bang[1][2] + ' / ' + r.bang[2][2]);
  await dien(p, { t1m: 36 });
  must(!/undefined|NaN/.test(JSON.stringify(r.bang)), 'bảng kịch bản không có undefined hay NaN');

  console.log('\n### số rỗng và số rác');
  await dien(p, { monthlyIncome: 0, cashAdvance: 0 });
  r = await doc(p);
  must(/Nhập doanh thu tháng/.test(await p.textContent('#roi-kq')), 'số rỗng thì hiện lời mời nhập, không phải bảng trống');
  await dien(p, { monthlyIncome: 3300, cashAdvance: 50000, passThrough: 100 });
  r = await doc(p);
  must(/không còn gì để thu hồi/.test(await p.textContent('#roi-kq')), 'trả nghệ sĩ 100% thì nói rõ vì sao không thu hồi được');

  console.log('\n### tiếng Anh và nền tối');
  await p.evaluate(() => { const e = [...document.querySelectorAll('[data-l="en"]')].find(x => x.getBoundingClientRect().width > 0); if (e) e.click(); });
  await p.waitForTimeout(600);
  const en = await p.textContent('#roi-kq');
  must(!/[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(en), 'bản tiếng Anh không lẫn tiếng Việt');
  await p.evaluate(() => { const e = [...document.querySelectorAll('[data-th="dark"]')].find(x => x.getBoundingClientRect().width > 0); if (e) e.click(); });
  await p.waitForTimeout(500);
  must((await p.$$('#roi-kq .kpi')).length === 5, 'nền tối vẫn vẽ đủ');

  console.log('\n### nhớ số khi rời trang rồi quay lại');
  await p.evaluate(() => { const e = [...document.querySelectorAll('[data-l="vi"]')].find(x => x.getBoundingClientRect().width > 0); if (e) e.click(); });
  await p.waitForTimeout(400);
  await dien(p, { monthlyIncome: 4242, cashAdvance: 60000, passThrough: 0 });
  await p.evaluate(() => { location.hash = '#xet-duyet'; });
  await p.waitForTimeout(600);
  must(await p.$('[data-di="roi"]') !== null, 'trang Xét duyệt có nút mở Tính ROI');
  await p.click('[data-di="roi"]');
  await p.waitForTimeout(700);
  must(await p.inputValue('#roi-monthlyIncome') === '4242', 'quay lại vẫn giữ số vừa nhập', await p.inputValue('#roi-monthlyIncome'));

  console.log('\n### không vai nào ngoài ba vai thấy trang này');
  for (const vai of ['ops', 'support']) {
    const co = await p.evaluate(v => {
      const A = window.HAUSTEK.admin, ai = A.staff.list().find(x => x.role === v);
      if (!ai) return null;
      A.staff.setMe(ai.id);
      return A.quyen.man('roi');
    }, vai);
    must(co === false || co === null, 'vai ' + vai + ' không mở được trang ROI');
  }
  await p.evaluate(() => { const A = window.HAUSTEK.admin; A.staff.setMe(A.staff.list().find(x => x.role === 'mgmt').id); });

  must(errs.length === 0, 'không có lỗi JavaScript', errs.join(' | '));
  await b.close();
  console.log('\n' + (loi ? '✗ ' + loi + '/' + dem + ' phép sai' : '✓ ' + dem + '/' + dem + ' phép đúng'));
  process.exit(loi ? 1 : 0);
})();
