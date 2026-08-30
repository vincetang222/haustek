/* Bấm thật vào mọi thứ bấm được: từng dòng bảng, từng nút mở hộp thoại,
   từng ngăn trượt — ở cả hai cửa, cả hai chế độ. Màn hình dựng ra đẹp mà
   bấm vào thì nổ là thứ bài kiểm ảnh tĩnh không bao giờ thấy. */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');

/* Nút nào bấm vào là ĐỔI SỔ thì không bấm ở đây — chuỗi vận hành có bài
   riêng (v2-luong.js), và bấm bừa ở đây sẽ làm hỏng trạng thái của chính
   những màn còn lại chưa kiểm. */
const KHONG_BAM = ['data-duyet', 'data-boqua', 'data-thuhoi', 'data-xoahet',
  'data-nhapjson', 'data-xuatjson', 'data-in', 'data-reset'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let hong = 0;

  for (const trang of ['v2/intranet.html', 'v2/khach.html']) {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 } });
    const p = await ctx.newPage();
    await dungFontThat(p);
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t); });
    await p.goto('http://127.0.0.1:8099/' + trang, { waitUntil: 'networkidle' });
    await p.evaluate(() => { try { localStorage.removeItem('haustek.portal.v1'); } catch (e) {} });
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(1000);

    const man = await p.$$eval('.nav a', as => as.map(a => a.getAttribute('href').slice(1)));
    console.log('\n=== ' + trang + ' ===');

    for (const m of man) {
      await p.evaluate(id => { location.hash = '#' + id; }, m);
      await p.waitForTimeout(320);
      const tabs = await p.$$eval('main [data-tab]', bs => bs.map(x => x.getAttribute('data-tab')));
      const ghi = [];

      for (const tb of (tabs.length ? tabs : [null])) {
        if (tb) { await p.click('main [data-tab="' + tb + '"]').catch(() => {}); await p.waitForTimeout(320); }
        const nhan = m + (tb ? '/' + tb : '');

        /* --- mở tối đa 3 dòng bảng, xem ngăn trượt dựng được không --- */
        const soDong = await p.$$eval('main tr.pick, main .bars.pick .row', e => e.length);
        for (let i = 0; i < Math.min(3, soDong); i++) {
          const el = (await p.$$('main tr.pick, main .bars.pick .row'))[i];
          if (!el) break;
          await el.click().catch(() => {});
          await p.waitForTimeout(300);
          const dr = await p.evaluate(() => {
            const d = document.querySelector('.drawer.on');
            if (!d) return null;
            return { dai: d.textContent.length, xau: /NaN|undefined|\[object/.test(d.textContent),
                     mau: (d.textContent.match(/NaN|undefined|\[object \w+\]/g) || []).slice(0, 2).join(',') };
          });
          if (dr) {
            if (dr.xau) { ghi.push('ngăn trượt dòng ' + i + ' có số hỏng: ' + dr.mau); hong++; }
            else if (dr.dai < 120) { ghi.push('ngăn trượt dòng ' + i + ' gần như trống'); hong++; }
            await p.keyboard.press('Escape'); await p.waitForTimeout(160);
          }
        }

        /* --- mở mọi hộp thoại an toàn rồi Escape --- */
        const nut = await p.$$eval('main button[data-sua],main button[data-them],main button[data-nap],' +
          'main button[data-pub],main button[data-ghinhan],main button[data-chottg],main button[data-themtk],' +
          'main button[data-park],main button[data-go],main button[data-gopub],main button[data-khop]',
          es => es.map((e, i) => i));
        for (let i = 0; i < Math.min(3, nut.length); i++) {
          const es = await p.$$('main button[data-sua],main button[data-them],main button[data-nap],' +
            'main button[data-pub],main button[data-ghinhan],main button[data-chottg],main button[data-themtk],' +
            'main button[data-park],main button[data-go],main button[data-gopub],main button[data-khop]');
          const el = es[i];
          if (!el) break;
          const attr = await el.evaluate(e => e.getAttributeNames().filter(a => a.indexOf('data-') === 0).join(','));
          if (KHONG_BAM.some(k => attr.indexOf(k) >= 0)) continue;
          await el.click().catch(() => {});
          await p.waitForTimeout(280);
          const mo = await p.evaluate(() => {
            const d = document.querySelectorAll('.modal-bg');
            if (!d.length) return null;
            return { so: d.length, dai: d[0].textContent.length,
                     xau: /NaN|undefined|\[object/.test(d[0].textContent) };
          });
          if (mo) {
            if (mo.so > 1) { ghi.push('mở ' + mo.so + ' hộp thoại cùng lúc (' + attr + ')'); hong++; }
            if (mo.xau) { ghi.push('hộp thoại có số hỏng (' + attr + ')'); hong++; }
            await p.keyboard.press('Escape'); await p.waitForTimeout(200);
            const con = await p.$$eval('.modal-bg', e => e.length);
            if (con) { ghi.push('Escape không đóng được hộp thoại (' + attr + ')'); hong++; await p.evaluate(() => { document.querySelectorAll('.modal-bg').forEach(x => x.remove()); }); }
          }
        }

        /* --- chuột rê lên biểu đồ: mách nước phải hiện --- */
        const bd = await p.$('main .bd .hz, main .bars .row[data-tip]');
        if (bd) {
          /* Bấm vào dòng bảng bên trên đã cuộn trang xuống, nên phần tử
             này có thể đang nằm trên đỉnh khung nhìn. Kéo nó vào tầm mắt
             TRƯỚC rồi mới đo — đo trước rồi rê là rê vào chỗ không có gì,
             và bài kiểm sẽ báo mách nước hỏng trong khi nó vẫn chạy. */
          await bd.scrollIntoViewIfNeeded().catch(() => {});
          await p.waitForTimeout(150);
          const hop = await bd.boundingBox();
          if (hop) await p.mouse.move(hop.x + hop.width / 2, hop.y + hop.height / 2);
          await p.waitForTimeout(220);
          const tip = await p.evaluate(() => {
            const t = document.querySelector('.tip.on');
            return t ? { dai: t.textContent.length, xau: /NaN|undefined/.test(t.textContent) } : null;
          });
          if (!tip) { ghi.push('rê chuột lên biểu đồ không hiện mách nước'); hong++; }
          else if (tip.xau) { ghi.push('mách nước có số hỏng'); hong++; }
        }
        if (ghi.length) console.log('  ' + nhan + ': ' + ghi.splice(0).join(' · '));
      }
    }
    if (errs.length) { console.log('  LỖI JS:\n    ' + [...new Set(errs)].slice(0, 8).join('\n    ')); hong += errs.length; }
    else console.log('  (không có lỗi JavaScript nào)');
    await ctx.close();
  }
  await b.close();
  console.log(hong ? '\n>>> ' + hong + ' vấn đề' : '\n>>> bấm hết, không vỡ chỗ nào');
  process.exit(hong ? 1 : 0);
})();
