/* Trang có chạy được khi KHÔNG có mạng ra ngoài không?

   Đây là lỗi đã thật sự xảy ra, và là loại lỗi tệ nhất: không có thông
   báo gì cả. Thẻ <link rel=stylesheet> CHẶN việc chạy script cho tới khi
   nó tải xong. Mọi màn hình ở đây đều do script dựng ra. Nên chỉ cần
   fonts.googleapis.com chậm hoặc bị chặn — mạng công ty, tiện ích chặn
   quảng cáo, nhà mạng — là người dùng thấy một khoảng trắng có mỗi cái
   tiêu đề, và không có gì nói cho họ biết vì sao.

   Bài kiểm chặn sạch mọi thứ không phải máy chủ cục bộ, rồi đòi trang
   phải dựng xong bình thường. Nó cũng đếm luôn số yêu cầu ra ngoài — số
   đó phải bằng 0. */
const { chromium } = require('playwright');

const TRANG = process.argv.slice(2);
if (!TRANG.length) TRANG.push('v2/intranet.html', 'v2/khach.html', 'goi-mot-trang.html', 'index.html');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let hong = 0;

  for (const t of TRANG) {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
    /* Chặn TẤT CẢ những gì không phải máy chủ cục bộ. */
    await ctx.route('**', r => {
      const u = r.request().url();
      if (u.startsWith('http://127.0.0.1') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
      return r.abort();
    });
    const p = await ctx.newPage();
    const ngoai = [], loi = [];
    p.on('request', r => {
      const u = r.url();
      if (!u.startsWith('http://127.0.0.1') && !u.startsWith('data:') && !u.startsWith('blob:')) ngoai.push(u);
    });
    p.on('pageerror', e => loi.push(e.message));

    let r = { coApp: false, soMan: 0 };
    try {
      await p.goto('http://127.0.0.1:8099/' + t, { waitUntil: 'load', timeout: 20000 });
      await p.waitForTimeout(2500);
      r = await p.evaluate(() => ({
        coApp: !!document.querySelector('.app') || !!document.querySelector('.cua'),
        soMan: document.querySelectorAll('.nav a').length,
        chuDai: (document.body.textContent || '').trim().length
      }));
    } catch (e) { loi.push('không mở được: ' + e.message); }

    const ok = r.coApp && r.chuDai > 300;
    const sach = ngoai.length === 0;
    console.log((ok && sach && !loi.length ? '  ok   ' : '  HỎNG ') + t +
      ' · dựng được: ' + (r.coApp ? 'có' : 'KHÔNG') +
      (r.soMan ? ' · ' + r.soMan + ' màn' : '') +
      ' · chữ ' + (r.chuDai || 0) +
      ' · gọi ra ngoài: ' + (ngoai.length ? [...new Set(ngoai.map(u => u.split('/')[2]))].join(',') : 'không'));
    if (loi.length) console.log('         lỗi: ' + [...new Set(loi)].slice(0, 2).join(' | '));
    if (!ok || !sach || loi.length) hong++;
    await ctx.close();
  }

  await b.close();
  console.log(hong ? '\n>>> ' + hong + ' trang không tự chạy được khi mất mạng ngoài'
                   : '\n>>> mọi trang tự chạy được, không phụ thuộc mạng ngoài');
  process.exit(hong ? 1 : 0);
})();
