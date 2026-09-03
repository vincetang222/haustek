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
/* Máy chủ tĩnh ở 127.0.0.1:8099 hay chết giữa hai lượt chạy (tiến trình
   nền bị dọn theo phiên shell). Mọi bài kiểm đều đi qua hàm này trước khi
   goto, nên kiểm ở đây: chưa nghe thì bật một máy chủ tách hẳn khỏi phiên,
   chờ tới khi trả lời, rồi mới cho bài kiểm chạy. */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
function nghe(cong) {
  return new Promise(r => {
    const q = http.get({ host: '127.0.0.1', port: cong, path: '/' }, res => { res.resume(); r(true); });
    q.on('error', () => r(false)); q.setTimeout(800, () => { q.destroy(); r(false); });
  });
}
async function damBaoMayChu(cong) {
  cong = cong || 8099;
  if (await nghe(cong)) return true;
  const goc = path.resolve(__dirname, '..');
  const c = spawn('python3', ['-m', 'http.server', String(cong), '--bind', '127.0.0.1'],
    { cwd: goc, detached: true, stdio: 'ignore' });
  c.unref();
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 250));
    if (await nghe(cong)) { console.log('[font-that] đã bật máy chủ tĩnh ở :' + cong + ' (' + goc + ')'); return true; }
  }
  console.warn('[font-that] không bật được máy chủ tĩnh ở :' + cong);
  return false;
}
module.exports = async function dungFontThat(page) {
  await damBaoMayChu(8099);
  if (!CSS) { console.warn('[font-that] chưa có ' + P + ' — trang sẽ render bằng font dự phòng'); return false; }
  await page.route('**://fonts.googleapis.com/**', r =>
    r.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: CSS }));
  await page.route('**://fonts.gstatic.com/**', r => r.abort());
  return true;
};
module.exports.damBaoMayChu = damBaoMayChu;
