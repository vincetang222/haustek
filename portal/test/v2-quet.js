/* Quét mọi màn hình của một cửa v2: mở từng mục điều hướng, từng tab
   trong màn, ở cả hai chế độ sáng/tối và cả hai ngôn ngữ. Bắt lỗi
   JavaScript, ô trống không đáng có, chữ tràn khung, và placeholder
   {…} lọt ra màn hình. */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

const TRANG = process.argv[2] || 'v2/intranet.html';
const RONG = (process.argv[3] || '1500').split(',').map(Number);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let hong = 0;

  for (const W of RONG) {
    const ctx = await b.newContext({ viewport: { width: W, height: 1100 } });
    const p = await ctx.newPage();
    await dungFontThat(p);
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    p.on('console', m => {
      const t = m.text();
      if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t);
    });
    await p.goto('http://127.0.0.1:8099/' + TRANG, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);

    const man = await p.$$eval('.nav a', as => as.map(a => ({ id: a.getAttribute('href').slice(1), ten: a.textContent.trim() })));
    console.log('\n=== ' + W + 'px · ' + TRANG + ' · ' + man.length + ' màn ===');

    for (const theme of ['light', 'dark']) {
      await p.click('[data-th="' + theme + '"]');
      await p.waitForTimeout(200);
      for (const lang of ['vi', 'en']) {
        await p.click('[data-l="' + lang + '"]');
        await p.waitForTimeout(150);
        const doi = [];
        for (const m of man) {
          await p.evaluate(id => { location.hash = '#' + id; }, m.id);
          await p.waitForTimeout(260);
          /* mở từng tab trong màn */
          const tabs = await p.$$eval('main [data-tab]', bs => bs.map(x => x.getAttribute('data-tab')));
          const ds = tabs.length ? tabs : [null];
          for (const tb of ds) {
            if (tb) { await p.click('main [data-tab="' + tb + '"]').catch(() => {}); await p.waitForTimeout(260); }
            const r = await p.evaluate(() => {
              const main = document.querySelector('main');
              const out = { rong: false, ph: [], tran: [], chuHoa: 0, trong: false };
              if (!main || main.children.length === 0) { out.rong = true; return out; }
              const txt = [];
              main.querySelectorAll('*').forEach(e => {
                if (e.children.length) return;
                const t = (e.textContent || '').trim();
                if (!t) return;
                txt.push(t);
                if (/\{\w+\}/.test(t)) out.ph.push(t.slice(0, 40));
                /* Nằm trong khung cuộn ngang thì không phải tràn — đó là
                   cách bảng rộng được thiết kế để hiển thị. */
                let cuon = false;
                for (let a = e.parentElement; a && a !== main; a = a.parentElement) {
                  const ov = getComputedStyle(a).overflowX;
                  if (ov === 'auto' || ov === 'scroll') { cuon = true; break; }
                }
                if (cuon) return;
                const er = e.getBoundingClientRect(), pr = main.getBoundingClientRect();
                if (er.width > 0 && (er.right > pr.right + 1.5 || er.left < pr.left - 1.5))
                  out.tran.push(t.slice(0, 34));
              });
              if (main.textContent.includes('Màn hình này lỗi') || main.textContent.includes('This screen failed'))
                out.trong = true;
              /* nhãn viết hoa hết kiểu máy — dấu hiệu "trông như AI" khách đã chỉ ra */
              document.querySelectorAll('main .l, main .card-h h2, main th').forEach(e => {
                const t = (e.textContent || '').trim();
                if (t.length > 3 && t === t.toUpperCase() && /[A-ZĐÂÊÔƯ]/.test(t)) out.chuHoa++;
              });
              out.dai = main.textContent.length;
              return out;
            });
            const nhan = m.id + (tb ? '/' + tb : '');
            const loi = [];
            if (r.rong) loi.push('TRỐNG');
            if (r.trong) loi.push('MÀN LỖI');
            if (r.ph.length) loi.push('placeholder: ' + [...new Set(r.ph)].slice(0, 2).join(' | '));
            if (r.tran.length) loi.push('tràn: ' + [...new Set(r.tran)].slice(0, 2).join(' | '));
            if (r.chuHoa) loi.push('nhãn HOA×' + r.chuHoa);
            if (r.dai < 400) loi.push('quá ít nội dung (' + r.dai + ' ký tự)');
            if (loi.length) { doi.push(nhan + ' → ' + loi.join(' · ')); hong++; }
          }
        }
        console.log(' ' + theme + '/' + lang + ': ' + (doi.length ? '\n   ' + doi.join('\n   ') : 'ok — ' + man.length + ' màn sạch'));
      }
    }
    if (errs.length) { console.log(' LỖI JS:\n   ' + [...new Set(errs)].slice(0, 8).join('\n   ')); hong += errs.length; }
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (hong ? '>>> ' + hong + ' vấn đề' : '>>> sạch'));
  process.exit(hong ? 1 : 0);
})();
