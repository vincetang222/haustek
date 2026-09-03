/* Dựng lại ĐÚNG hình dạng mà trình xem artifact tạo ra, rồi đòi CSS phải
   thật sự ăn.

   Hai điều bài kiểm này bắt được mà các bài trước không:

   1. Trình xem bọc nội dung vào <body>. File rời mở thẳng thì trình duyệt
      tự đẩy <style>, <link>, <script> lên <head> — nên mọi bài kiểm chạy
      trên file rời đều không bao giờ gặp cảnh tài sản nằm trong body.
      Ứng dụng ghi đè body là tự xoá mất CSS của chính nó, và chỉ hỏng ở
      trong trình xem.

   2. "Trang có dựng được không" KHÔNG đủ. DOM vẫn đủ 10 màn khi không còn
      một dòng CSS nào — nhìn thì trang nát bét, mà bài kiểm vẫn xanh.
      Nên ở đây đo KIỂU ĐÃ TÍNH: nền cột trái phải là màu khung, và icon
      trong cột điều hướng phải nhỏ, không phải ô vuông to bằng nửa màn.
   ===================================================================== */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const NGUON = process.argv[2] || '/home/user/haustek/portal/goi-mot-trang.html';
const RA = '/tmp/nhu-art';

/* Bọc y như trình xem: doctype, head có charset + reset, nội dung vào body. */
function bocNhuTrinhXem(noiDung) {
  return '<!doctype html><html><head><meta charset=utf8>' +
    '<meta name=viewport content="width=device-width,initial-scale=1">' +
    '<style>:root{color-scheme:light}body{margin:0;padding:0;' +
    'font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}' +
    'img{max-width:100%}[hidden]:not([hidden=until-found]){display:none!important}</style>' +
    '</head><body>\n' + noiDung + '\n</body></html>';
}

(async () => {
  fs.mkdirSync(RA, { recursive: true });
  fs.writeFileSync(path.join(RA, 'bocroi.html'), bocNhuTrinhXem(fs.readFileSync(NGUON, 'utf8')));

  const { spawn } = require('child_process');
  const sv = spawn('python3', ['-m', 'http.server', '8131'], { cwd: RA, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));

  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  /* chặn sạch mạng ngoài — trang phải tự đủ */
  await ctx.route('**', r => {
    const u = r.request().url();
    return (u.startsWith('http://127.0.0.1') || u.startsWith('data:') || u.startsWith('blob:'))
      ? r.continue() : r.abort();
  });
  const p = await ctx.newPage();
  const loi = [];
  p.on('pageerror', e => loi.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) loi.push(m.text().slice(0, 200)); });

  await p.goto('http://127.0.0.1:8131/bocroi.html', { waitUntil: 'load' });
  await p.waitForTimeout(3000);

  const r = await p.evaluate(() => {
    const g = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const side = document.querySelector('.side');
    const svg = document.querySelector('.nav a svg');
    const kpi = document.querySelector('main .kpi .v');
    return {
      soMan: document.querySelectorAll('.nav a').length,
      bienChrome: g('--chrome'),
      nenSide: side ? getComputedStyle(side).backgroundColor : null,
      svgRong: svg ? Math.round(svg.getBoundingClientRect().width) : -1,
      fontThan: getComputedStyle(document.body).fontFamily,
      coSo: kpi ? kpi.textContent.trim() : null
    };
  });

  const kiem = [
    ['dựng đủ màn hình', r.soMan >= 5, r.soMan + ' màn'],
    ['biến CSS của hệ giao diện còn sống', r.bienChrome === '#0E1A24', r.bienChrome || '(TRỐNG)'],
    ['cột trái ăn màu khung', r.nenSide === 'rgb(14, 26, 36)', r.nenSide],
    ['icon điều hướng đúng cỡ, không phải ô vuông to', r.svgRong > 0 && r.svgRong <= 24, r.svgRong + 'px'],
    ['bộ chữ của hệ được áp', /Be Vietnam Pro/.test(r.fontThan), r.fontThan.slice(0, 40)],
    ['có số liệu hiện ra', !!r.coSo && !/NaN/.test(r.coSo), r.coSo],
    ['không lỗi JavaScript', loi.length === 0, loi[0] ? loi[0].slice(0, 70) : '—']
  ];
  let hong = 0;
  kiem.forEach(([t, ok, ct]) => { console.log((ok ? '  ok   ' : '  HỎNG ') + t + ' · ' + ct); if (!ok) hong++; });

  /* Xuất CSV trong trình xem: khung chặn tải thẳng, nhưng cấp
     claude.use('downloads'). Giả lập đúng hình dạng đó: use() trả về
     namespace SAU một nhịp (không bao giờ đồng bộ), save() ghi lại yêu
     cầu. Nút Xuất CSV phải đưa đúng file .csv có BOM, có dòng đầu, có
     dữ liệu; và khi use() trả về null thì phải NÓI là không lưu được,
     không im lặng. */
  async function thuXuat(coDownloads) {
    const p2 = await ctx.newPage();
    await p2.addInitScript(co => {
      window.__luu = null;
      window.claude = { use: name => new Promise(r => setTimeout(() =>
        r(co && name === 'downloads'
          ? { save: req => { window.__luu = { filename: req.filename, data: String(req.data) }; return Promise.resolve({ status: 'saved' }); } }
          : null), 40)) };
    }, coDownloads);
    await p2.goto('http://127.0.0.1:8131/bocroi.html#danh-muc', { waitUntil: 'load' });
    await p2.waitForTimeout(2500);
    await p2.click('main [data-xuat]');
    await p2.waitForTimeout(900);
    const r2 = await p2.evaluate(() => ({
      luu: window.__luu,
      toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ')
    }));
    await p2.close();
    return r2;
  }
  const co = await thuXuat(true), khong = await thuXuat(false);
  const dong = co.luu ? co.luu.data.split('\n') : [];
  [
    ['Xuất CSV đưa file qua downloads', !!co.luu && /\.csv$/.test(co.luu.filename), co.luu ? co.luu.filename : '(không gọi save)'],
    ['file có BOM, dòng đầu và dữ liệu', dong.length > 2 && dong[0].charCodeAt(0) === 0xFEFF && dong[0].includes(';'), dong.length + ' dòng'],
    ['báo đã xuất sau khi người xem đồng ý', /Đã xuất|Exported/.test(co.toast), co.toast.slice(0, 60) || '(không có toast)'],
    ['không có downloads thì nói rõ, không im lặng', /không cho lưu file|does not allow saving/.test(khong.toast), khong.toast.slice(0, 60) || '(không có toast)']
  ].forEach(([t, ok, ct]) => { console.log((ok ? '  ok   ' : '  HỎNG ') + t + ' · ' + ct); if (!ok) hong++; });

  await b.close();
  sv.kill();
  console.log(hong ? '\n>>> ' + hong + ' vấn đề khi bọc như trình xem artifact'
                   : '\n>>> chạy đúng khi bọc như trình xem artifact');
  process.exit(hong ? 1 : 0);
})();
