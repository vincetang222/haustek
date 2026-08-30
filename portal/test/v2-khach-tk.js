/* Cổng khách nhìn rất khác nhau tuỳ người đang đăng nhập: label không có
   tab tác quyền, nghệ sĩ độc lập có chặng "Haustek giữ thêm", người đang
   nợ tạm ứng có cả một màn riêng. Quét MỘT tài khoản là quét đúng một
   trong số đó. Đây quét hết. */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1100 } });
  const p = await ctx.newPage();
  await dungFontThat(p);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t); });

  await p.goto('http://127.0.0.1:8099/v2/khach.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  const n = await p.$$eval('[data-ai] option', o => o.length);
  console.log('số tài khoản mẫu:', n);
  let hong = 0;

  for (let i = 0; i < n; i++) {
    await p.evaluate(v => { try { sessionStorage.setItem('haustek.demo.tk', v); } catch (e) {} }, String(i));
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const ai = await p.$eval('.side-foot b', e => e.textContent.trim());
    const vt = await p.$eval('.side-foot span', e => e.textContent.trim());
    const man = await p.$$eval('.nav a', as => as.map(a => a.getAttribute('href').slice(1)));
    const doi = [];
    for (const m of man) {
      await p.evaluate(id => { location.hash = '#' + id; }, m);
      await p.waitForTimeout(240);
      /* mở mọi tab trong màn */
      const tabs = await p.$$eval('main [data-tab]', bs => bs.map(x => x.getAttribute('data-tab')));
      for (const tb of (tabs.length ? tabs : [null])) {
        if (tb) { await p.click('main [data-tab="' + tb + '"]').catch(() => {}); await p.waitForTimeout(240); }
        const r = await p.evaluate(() => {
          const main = document.querySelector('main');
          const txt = main ? main.textContent : '';
          return { dai: txt.length,
                   loi: txt.includes('Màn hình này lỗi') || txt.includes('This screen failed'),
                   nan: /NaN|undefined|\{\w+\}/.test(txt),
                   maunan: (txt.match(/NaN|undefined/g) || []).slice(0, 2).join(',') };
        });
        const nhan = m + (tb ? '/' + tb : '');
        if (r.loi) { doi.push(nhan + ' MÀN LỖI'); hong++; }
        else if (r.nan) { doi.push(nhan + ' số hỏng: ' + r.maunan); hong++; }
        else if (r.dai < 300) { doi.push(nhan + ' quá ít nội dung (' + r.dai + ')'); hong++; }
      }
      /* mở một dòng bảng nếu có, xem ngăn trượt có dựng được không */
      const co = await p.$('main tr.pick');
      if (co) {
        await co.click();
        await p.waitForTimeout(350);
        const dr = await p.evaluate(() => {
          const d = document.querySelector('.drawer.on');
          return d ? { dai: d.textContent.length, loi: /NaN|undefined/.test(d.textContent) } : null;
        });
        if (!dr) { doi.push(m + ' ngăn trượt không mở'); hong++; }
        else if (dr.loi) { doi.push(m + ' ngăn trượt có số hỏng'); hong++; }
        await p.keyboard.press('Escape');
        await p.waitForTimeout(150);
      }
    }
    console.log((i + 1) + '. ' + ai + ' (' + vt + ') · ' + man.length + ' màn: ' +
      (doi.length ? '\n     ' + doi.join('\n     ') : 'ok'));
  }
  if (errs.length) { console.log('LỖI JS:\n  ' + [...new Set(errs)].slice(0, 8).join('\n  ')); hong += errs.length; }
  await b.close();
  console.log(hong ? '\n>>> ' + hong + ' vấn đề' : '\n>>> sạch');
  process.exit(hong ? 1 : 0);
})();
