/* Bật EN rồi soi những chỗ CHỈ chứa chữ của giao diện — nhãn, tiêu đề
   thẻ, đầu cột, tab, câu giải thích. Tên nghệ sĩ, tên bài, tên label,
   tên cửa hàng là DỮ LIỆU tiếng Việt và phải giữ nguyên ở chế độ EN;
   nên không soi ô dữ liệu, chỉ soi khung. */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

/* KHÔNG soi 'main .card-h h2': tiêu đề thẻ nhiều chỗ là DỮ LIỆU — tên
   bài, tên bên nhận, nhãn kỳ. Soi nó là báo nhầm tên bài tiếng Việt
   thành chữ chưa dịch. Phụ đề .card-h p thì luôn là chữ của giao diện. */
const CHO = 'main .card-h p, main .kpi .l, main .kpi .s, main th, ' +
  'main .tabs button, main .page h1, main .page p, main .page-kpi .l, main .say, main .hint, ' +
  'main .check b, main .check span, main .note b, main .note p, main .empty b, main .empty span, ' +
  'main .card-f, main dl.kv dt, main h4.sec, main .stat b, main label.fld, main .wf .lbl, main .wf .nt, ' +
  '.nav a span, .nav-grp, .top-note';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let hong = 0;
  for (const trang of ['v2/intranet.html', 'v2/khach.html']) {
    const p = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
    await dungFontThat(p);
    await p.goto('http://127.0.0.1:8099/' + trang, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    await p.click('[data-l="en"]'); await p.waitForTimeout(300);
    const man = await p.$$eval('.nav a', a => a.map(x => x.getAttribute('href').slice(1)));
    const con = [];
    for (const m of man) {
      await p.evaluate(id => { location.hash = '#' + id; }, m);
      await p.waitForTimeout(280);
      const tabs = await p.$$eval('main [data-tab]', bs => bs.map(x => x.getAttribute('data-tab')));
      for (const tb of (tabs.length ? tabs : [null])) {
        if (tb) { await p.click('main [data-tab="' + tb + '"]').catch(() => {}); await p.waitForTimeout(280); }
        const r = await p.evaluate(sel => {
          /* Dấu chỉ có trong tiếng Việt, không có trong tiếng Anh — ă â đ
             ê ô ơ ư và các dấu thanh. */
          const VN = /[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/;
          const out = [];
          document.querySelectorAll(sel).forEach(e => {
            const t = (e.textContent || '').trim();
            if (!t || t.length < 3) return;
            /* Tên nghệ sĩ, tên label, tên bài là DỮ LIỆU tiếng Việt và phải
               giữ nguyên ở chế độ EN. Trong câu giải thích chúng luôn nằm
               trong ngoặc kép — bỏ phần trong ngoặc ra trước khi soi, không
               thì một câu tiếng Anh trích tên "nae & de'lay" bị báo là chưa
               dịch. */
            /* Chỉ bóc ngoặc KÉP. Bóc cả ngoặc đơn thì dấu nháy trong chính
               tên dữ liệu (nae & de'lay) bị hiểu là mở ngoặc, và phần bóc
               ra lệch hẳn đi. */
            const soi = t.replace(/["“”][^"“”]{1,48}["“”]/g, ' ');
            if (VN.test(soi)) out.push(t.slice(0, 60));
          });
          return [...new Set(out)];
        }, CHO);
        r.forEach(x => con.push(m + (tb ? '/' + tb : '') + ' → ' + x));
      }
    }
    const u = [...new Set(con)];
    console.log('\n=== ' + trang + ' · EN ===');
    if (u.length) { u.slice(0, 40).forEach(x => console.log('  ' + x)); hong += u.length; }
    else console.log('  khung đã dịch hết');
    await p.context().close();
  }
  await b.close();
  console.log(hong ? '\n>>> ' + hong + ' chỗ còn tiếng Việt trong khung EN' : '\n>>> khung EN sạch');
  process.exit(hong ? 1 : 0);
})();
