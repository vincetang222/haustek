/* Proxy chặn fonts.googleapis.com nên Chromium ở đây render bằng font dự
   phòng — rộng hơn Be Vietnam Pro. Bài kiểm vừa khung vì thế là kiểm theo
   hướng an toàn, nhưng nó KHÔNG phải thứ khách nhìn thấy. Chặn đường gọi
   ra ngoài và trả về bộ chữ thật đã tải sẵn, để đo đúng cái khách thấy. */
const fs = require('fs');
/* Dựng file này một lần:
     curl -sSL "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800\
&family=Be+Vietnam+Pro:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" -o gf.css
   rồi tải các woff2 trong đó về và nhúng base64 vào (xem README).
   Đặt kết quả ở đường dẫn dưới, hoặc trỏ biến FONT_CSS sang chỗ khác. */
const P = process.env.FONT_CSS || '/tmp/fonts-local.css';
const CSS = fs.existsSync(P) ? fs.readFileSync(P, 'utf8') : null;
module.exports = async function dungFontThat(page) {
  if (!CSS) { console.warn('[font-that] chưa có ' + P + ' — trang sẽ render bằng font dự phòng'); return false; }
  await page.route('**://fonts.googleapis.com/**', r =>
    r.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: CSS }));
  await page.route('**://fonts.gstatic.com/**', r => r.abort());
  return true;
};
