/* =====================================================================
   QC · TRANG MỞ ĐƯỢC THÌ HÀM PHẢI GỌI ĐƯỢC
   ---------------------------------------------------------------------
   Ma trận quyền đúng ở lõi vẫn có thể hỏng trên mặt: một trang được cấp
   cho vai kế toán nhưng bên trong gọi một hàm chỉ giám đốc gọi được thì
   người dùng mở ra chỉ thấy màn vỡ. Lỗi này không bao giờ hiện với giám
   đốc, vì giám đốc đi qua mọi nhóm.

   Nên: đăng nhập lần lượt từng vai, mở HẾT trang vai ấy thấy, bấm hết
   tab trong trang, và bắt mọi lỗi trang. Riêng "Không có quyền" bị tính
   là lỗi nặng: nó nghĩa là ma trận tự mâu thuẫn.

       node portal/test/qc-vai-quet.js
   ===================================================================== */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

const VAI = ['mgmt', 'accounting', 'sales', 'ops', 'support'];
let loi = 0, dem = 0;
function must(ok, ten, them) { dem++; if (!ok) { loi++; console.log('  ✗ ' + ten + (them ? ' · ' + them : '')); } else console.log('  ✓ ' + ten); }

const doiVai = (p, vai) => p.evaluate(v => {
  const A = window.HAUSTEK.admin, ai = A.staff.list().find(x => x.role === v && x.active !== false);
  if (!ai) throw new Error('không có nhân sự vai ' + v);
  A.staff.setMe(ai.id);
}, vai);
const den = async (p, man) => {
  await p.evaluate(() => { location.hash = '#__khong_co__'; });
  await p.waitForTimeout(90);
  await p.evaluate(m => { location.hash = '#' + m; }, man);
  await p.waitForTimeout(700);
};
const nav = p => p.evaluate(() => [...document.querySelectorAll('.nav a')].map(a => a.getAttribute('href').slice(1)));

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 } });
  const p = await ctx.newPage();
  await dungFontThat(p);
  let errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t); });

  await p.goto('http://127.0.0.1:8099/v2/intranet.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { try { window.HAUSTEK.admin.reset(); } catch (e) {} });
  await p.waitForTimeout(400);

  const MOI = await p.evaluate(() => Object.keys(window.HAUSTEK.admin.quyen.bang().man));
  let tongTrang = 0, tongTab = 0;

  for (const vai of VAI) {
    console.log('\n### vai ' + vai);
    await doiVai(p, vai);
    await den(p, 'ban-lam-viec');
    const thay = await nav(p);
    const nen = await p.evaluate(v => window.HAUSTEK.admin.quyen.cua(v).man, vai);

    /* điều hướng phải khớp ma trận: thấy trang không được cấp là rò, thiếu
       trang được cấp là mất việc. Trang có khai khaDung() riêng thì có thể
       vắng chính đáng, nên chỉ bắt chiều "thấy mà không được cấp". */
    const ro = thay.filter(m => nen.indexOf(m) < 0);
    must(!ro.length, vai + ': điều hướng không hiện trang ngoài quyền', ro.join(', '));

    for (const man of thay) {
      errs = [];
      await den(p, man);
      const co = await p.$eval('main', el => el.textContent.trim().length).catch(() => 0);
      must(co > 40, vai + ' · ' + man + ': có nội dung', co + ' ký tự');
      tongTrang++;

      /* bấm hết tab của trang: nhiều màn chỉ gọi hàm nặng ở tab thứ hai */
      const tabs = await p.$$('main [data-tab]');
      for (let i = 1; i < tabs.length; i++) {
        try { await tabs[i].click({ timeout: 1500 }); await p.waitForTimeout(320); tongTab++; } catch (e) {}
      }
      const quyen = errs.filter(e => /Không có quyền|NO_QUYEN/.test(e));
      must(!quyen.length, vai + ' · ' + man + ': không đòi quyền mà vai không có', quyen[0]);
      const khac = errs.filter(e => !/Không có quyền|NO_QUYEN/.test(e));
      must(!khac.length, vai + ' · ' + man + ': không lỗi trang', khac[0]);
    }

    /* gõ thẳng hash vào trang ngoài quyền: phải bị từ chối tử tế, không vỡ */
    const cam = MOI.filter(m => nen.indexOf(m) < 0);
    errs = [];
    for (const man of cam) {
      await den(p, man);
      const vao = await p.evaluate(() => (location.hash || '').slice(1));
      must(vao !== man, vai + ': gõ thẳng #' + man + ' không vào được');
    }
    must(!errs.length, vai + ': từ chối trang cấm mà không vỡ', errs[0]);
  }

  console.log('\n' + tongTrang + ' lượt mở trang · ' + tongTab + ' lượt bấm tab · ' + dem + ' phép kiểm · ' + loi + ' lỗi');
  await b.close();
  process.exit(loi ? 1 : 0);
})();
