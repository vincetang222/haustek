/* Đo tương phản thật trên trang đã render, ở cả hai chế độ. Đọc màu tính
   toán của từng phần tử có chữ, tìm nền thật sự phía sau nó, rồi tính
   theo công thức WCAG. Không đoán từ bảng biến — biến có thể đúng mà
   thành phần vẫn dùng nhầm cặp. */
const { chromium } = require('playwright');
/* Nút sáng/tối và VI/EN có hai bản — thanh trên và ngăn điều hướng —
   bản nào hiện tuỳ bề rộng. Bấm bản đang hiện. */
async function bamHien(p, sel) {
  await p.evaluate(s => {
    const ds = [...document.querySelectorAll(s)];
    const el = ds.find(e => e.getBoundingClientRect().width > 0) || ds[0];
    if (!el) throw new Error('không thấy ' + s);
    el.click();
  }, sel);
}

const f = require('/home/user/haustek/portal/test/font-that.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
  await f(p);
  let hong = 0;
  for (const trang of ['v2/intranet.html', 'v2/khach.html']) {
    await p.goto('http://127.0.0.1:8099/' + trang, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    const man = await p.$$eval('.nav a', a => a.map(x => x.getAttribute('href').slice(1)));
    for (const th of ['light', 'dark']) {
      await bamHien(p, '[data-th="' + th + '"]'); await p.waitForTimeout(250);
      const xau = [];
      for (const m of man) {
        await p.evaluate(id => { location.hash = '#' + id; }, m);
        await p.waitForTimeout(280);
        const r = await p.evaluate(() => {
          const L = c => { const s = c / 255; return s <= .03928 ? s / 12.92 : Math.pow((s + .055) / 1.055, 2.4); };
          const lum = ([r, g, b]) => .2126 * L(r) + .7152 * L(g) + .0722 * L(b);
          const doc = s => (s.match(/\d+(\.\d+)?/g) || [0, 0, 0]).slice(0, 3).map(Number);
          const alpha = s => { const m = s.match(/rgba?\([^)]*,\s*([\d.]+)\)/); return m ? +m[1] : 1; };
          function nen(el) {
            for (let a = el; a; a = a.parentElement) {
              const c = getComputedStyle(a).backgroundColor;
              if (c && c !== 'transparent' && alpha(c) > .5) return doc(c);
            }
            return [255, 255, 255];
          }
          const out = [];
          document.querySelectorAll('main *, .side *, .top *').forEach(e => {
            if (e.children.length) return;
            const t = (e.textContent || '').trim();
            if (!t || t.length < 2) return;
            const cs = getComputedStyle(e);
            if (cs.visibility === 'hidden' || cs.display === 'none') return;
            const r = e.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) return;
            const fg = doc(cs.color), bg = nen(e);
            const l1 = lum(fg), l2 = lum(bg);
            const ct = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
            const px = parseFloat(cs.fontSize), dam = +cs.fontWeight >= 600;
            const nguong = (px >= 24 || (px >= 18.66 && dam)) ? 3 : 4.5;
            if (ct < nguong) out.push({ t: t.slice(0, 26), ct: +ct.toFixed(2), nguong,
              px: Math.round(px), cls: (e.getAttribute('class') || e.tagName).slice(0, 24) });
          });
          return out;
        });
        r.forEach(x => xau.push(m + ' · ' + x.cls + ' "' + x.t + '" ' + x.ct + ' < ' + x.nguong));
      }
      const u = [...new Set(xau)];
      console.log(trang + ' · ' + th + ': ' + (u.length ? u.length + ' chỗ\n   ' + u.slice(0, 10).join('\n   ') : 'đạt hết'));
      hong += u.length;
    }
  }
  await b.close();
  console.log(hong ? '\n>>> ' + hong + ' chỗ dưới chuẩn' : '\n>>> tương phản đạt WCAG AA ở cả hai chế độ');
  process.exit(hong ? 1 : 0);
})();
