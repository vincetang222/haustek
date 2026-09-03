/* Màn hẹp: bảng bên của trình xem artifact (~900px), máy tính bảng, và
   điện thoại. Bắt đúng lỗi người dùng đã thấy mà các bài quét 1100–1500px
   không thấy: mục điều hướng rơi ra ngoài khung, trang cuộn ngang, thanh
   trên gãy dòng.

   Đo HÌNH HỌC của khung, không đọc CSS: mọi thứ trong .top phải nằm gọn
   trong .top; html và main không được cuộn ngang; ngăn điều hướng trượt
   ra thì đủ mọi mục nằm trong khung, và đóng lại khi chọn mục, khi bấm
   nền, khi nhấn Escape. Ở điện thoại, cụm sáng/tối và VI/EN phải có
   trong ngăn và không còn chiếm chỗ ở thanh trên. */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

const TRANG = (process.argv[2] || 'v2/intranet.html,v2/khach.html').split(',');
const RONG = (process.argv[3] || '390,640,900,1024,1280').split(',').map(Number);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let hong = 0;
  const bao = (w, tr, m) => { console.log('  ✗ ' + w + 'px ' + tr + ' → ' + m); hong++; };

  for (const trang of TRANG) for (const W of RONG) {
    const H = W < 700 ? 760 : 900;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await dungFontThat(p);
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8099/' + trang, { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    const hep = W <= 1080;

    const doKhung = () => p.evaluate(() => {
      const r = e => e ? e.getBoundingClientRect() : null;
      const top = document.querySelector('.top'), side = document.querySelector('.side');
      const main = document.querySelector('main');
      const de = document.documentElement;
      const tran = [];
      const tr = r(top);
      if (top) [...top.children].forEach(ch => {
        const cr = r(ch);
        if (cr.width > 0 && (cr.right > tr.right + 1 || cr.left < tr.left - 1))
          tran.push((ch.className || ch.tagName) + ' +' + Math.round(cr.right - tr.right) + 'px');
      });
      const cuonNgang = de.scrollWidth > de.clientWidth + 1 ||
        document.body.scrollWidth > de.clientWidth + 1 ||
        (main && main.scrollWidth > main.clientWidth + 1);
      const nr = r(document.querySelector('.menu-btn'));
      const sr = r(side);
      const ctl = document.querySelector('.side-ctl');
      const topTheme = document.querySelector('.top [data-theme-sw]');
      return {
        tran, cuonNgang,
        nutHien: !!nr && nr.width > 0,
        sideLeft: sr ? sr.left : null, sideRight: sr ? sr.right : null,
        mo: document.querySelector('.app').classList.contains('menu-mo'),
        nav: [...document.querySelectorAll('.nav a')].map(a => {
          const q = r(a); return { t: a.textContent.trim(), l: q.left, rgt: q.right, w: q.width };
        }),
        vw: de.clientWidth,
        ctlHien: !!ctl && getComputedStyle(ctl).display !== 'none',
        crumbCat: (() => { const c = document.querySelector('.crumb'); return c && c.scrollWidth > c.clientWidth + 1; })(),
        topThemeHien: !!topTheme && topTheme.getBoundingClientRect().width > 0
      };
    });

    let k = await doKhung();
    if (k.cuonNgang) bao(W, trang, 'trang cuộn ngang');
    if (k.tran.length) bao(W, trang, 'thanh trên tràn: ' + k.tran.join(', '));
    if (hep) {
      if (!k.nutHien) bao(W, trang, 'không thấy nút mở điều hướng');
      if (k.sideRight > 0) bao(W, trang, 'cột điều hướng chưa mở mà đã lộ ' + Math.round(k.sideRight) + 'px');

      await p.click('.menu-btn'); await p.waitForTimeout(350);
      k = await doKhung();
      if (!k.mo) bao(W, trang, 'bấm nút mà ngăn không mở');
      if (k.sideLeft < -1) bao(W, trang, 'ngăn mở nhưng còn ở ngoài khung (' + Math.round(k.sideLeft) + 'px)');
      const ngoai = k.nav.filter(a => a.w === 0 || a.l < -1 || a.rgt > k.vw + 1);
      if (ngoai.length) bao(W, trang, 'mục điều hướng ngoài khung: ' + ngoai.map(a => a.t).join(', '));
      if (W <= 640 && !k.ctlHien) bao(W, trang, 'điện thoại: cụm sáng/tối, VI/EN không có trong ngăn');
      if (W <= 640 && k.topThemeHien) bao(W, trang, 'điện thoại: cụm sáng/tối vẫn chiếm chỗ ở thanh trên');
      if (k.cuonNgang) bao(W, trang, 'mở ngăn thì trang cuộn ngang');

      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      k = await doKhung();
      if (k.mo) bao(W, trang, 'Escape không đóng ngăn');

      await p.click('.menu-btn'); await p.waitForTimeout(300);
      await p.mouse.click(k.vw - 10, Math.round(H / 2)); await p.waitForTimeout(300);
      k = await doKhung();
      if (k.mo) bao(W, trang, 'bấm nền không đóng ngăn');

      await p.click('.menu-btn'); await p.waitForTimeout(300);
      const hrefs = await p.$$eval('.nav a', as => as.map(a => a.getAttribute('href')));
      await p.click('.nav a:nth-of-type(2)'); await p.waitForTimeout(400);
      k = await doKhung();
      const hash = await p.evaluate(() => location.hash);
      if (k.mo) bao(W, trang, 'chọn mục xong ngăn vẫn mở');
      if (hash !== hrefs[1]) bao(W, trang, 'chọn mục mà không chuyển màn (' + hash + ')');

      if (W <= 640) {
        await p.click('.menu-btn'); await p.waitForTimeout(300);
        await p.click('.side-ctl [data-th="dark"]'); await p.waitForTimeout(300);
        const th = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
        if (th !== 'dark') bao(W, trang, 'nút Tối trong ngăn không đổi chế độ');
        const van = await doKhung();
        if (!van.mo) bao(W, trang, 'đổi chế độ trong ngăn thì ngăn tự đóng');
        await p.click('.side-ctl [data-th="auto"]'); await p.waitForTimeout(200);
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
    } else {
      if (k.nutHien) bao(W, trang, 'màn rộng mà vẫn hiện nút mở điều hướng');
      if (k.sideLeft !== 0) bao(W, trang, 'màn rộng: cột điều hướng không ở mép trái');
    }

    /* từng màn, từng tab: thanh trên và trang không được tràn */
    const man = await p.$$eval('.nav a', as => as.map(a => a.getAttribute('href').slice(1)));
    for (const id of man) {
      await p.evaluate(id => { location.hash = '#' + id; }, id); await p.waitForTimeout(260);
      const tabs = await p.$$eval('main [data-tab]', bs => bs.map(x => x.getAttribute('data-tab')));
      for (const tb of (tabs.length ? tabs : [null])) {
        if (tb) { await p.click('main [data-tab="' + tb + '"]').catch(() => {}); await p.waitForTimeout(220); }
        const q = await doKhung();
        const nhan = id + (tb ? '/' + tb : '');
        if (q.cuonNgang) bao(W, trang + ' ' + nhan, 'trang cuộn ngang');
        if (q.crumbCat) bao(W, trang + ' ' + nhan, 'tên màn ở thanh trên bị cắt');
        if (q.tran.length) bao(W, trang + ' ' + nhan, 'thanh trên tràn: ' + q.tran.join(', '));
      }
    }
    if (errs.length) bao(W, trang, 'lỗi JS: ' + errs[0]);
    await ctx.close();
  }
  await b.close();
  console.log(hong ? '>>> ' + hong + ' vấn đề ở màn hẹp' : '>>> khung vừa mọi bề rộng ' + RONG.join('/') + 'px');
  process.exit(hong ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
