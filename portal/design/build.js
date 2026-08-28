/* Ghép ba hướng thành một trang so sánh. Chạy lại mỗi khi sửa một hướng:
   node portal/design/build.js */
const fs = require('fs'), path = require('path');
const D = __dirname;
const snap = fs.readFileSync(path.join(D, 'snapshot.json'), 'utf8');

const HUONG = [
  { id: 'd1', ten: 'D1 · Bám ảnh mẫu', canvas: '#F5F6F8', chu: '#1A2129',
    mo: 'Khung tối bên trái, nội dung sáng — dựng gần nhất với nền tảng khách đang dùng.',
    tham: 'Ảnh khách gửi' },
  { id: 'd2', ten: 'D2 · Thoáng', canvas: '#F5F6F8', chu: '#1A2129',
    mo: 'Cùng khung tối + nền sáng, nhưng bớt thẻ. Nhiều phần nằm thẳng trên nền.',
    tham: 'Ảnh khách gửi · ít khối hơn' },
  { id: 'd3', ten: 'D3 · Bảng làm chủ', canvas: '#F5F6F8', chu: '#1A2129',
    mo: 'Bảng lên trước, biểu đồ đỡ. Mở ra là dò số ngay.',
    tham: 'Ảnh khách gửi · kiểu kế toán' },
  { id: 'a', ten: 'Sáng, tinh',   canvas: '#F7F7F8', chu: '#16161A',
    mo: 'Nền sáng, ít đường kẻ, nhiều khoảng thở. Màu chỉ xuất hiện ở chỗ có nghĩa.',
    tham: 'Linear · Stripe Dashboard' },
  { id: 'b', ten: 'Tối, theo brand', canvas: '#0F0F14', chu: '#F2F2F5',
    mo: 'Đúng brand playbook Haustek. Đỏ #FF2E4C và ice blue chỉ đạt chuẩn tương phản trên nền tối.',
    tham: 'Grafana · Vercel' },
  { id: 'c', ten: 'Biểu đồ dẫn dắt', canvas: '#EFF0F3', chu: '#15151C',
    mo: 'Biểu đồ chiếm phần lớn màn hình, bảng lùi xuống. Mở ra thấy ngay xu hướng.',
    tham: 'Power BI' }
];

function doc(f) {
  const p = path.join(D, 'huong-' + f + '.html');
  if (!fs.existsSync(p)) return '<div class="chua-co">Hướng ' + f.toUpperCase() + ' chưa dựng xong.</div>';
  return fs.readFileSync(p, 'utf8');
}

/* Ruột trang: dùng chung cho hai bản xuất.
   · chon-huong.html          — trang đứng riêng, mở bằng file:// hay server tĩnh
   · chon-huong.artifact.html — chỉ phần thân, để publish thành trang có link
     (nơi publish tự bọc doctype/head/body, nên không được tự viết các thẻ đó) */
const ruot = `<title>Ba hướng nhìn Haustek</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script>window.SNAP = ${snap};</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Be Vietnam Pro',system-ui,sans-serif;background:#0B0B0F;color:#E8E8EE}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
:focus-visible{outline:2px solid #7FD6E8;outline-offset:2px}

.chrome{position:sticky;top:0;z-index:100;background:rgba(11,11,15,.94);
  backdrop-filter:saturate(160%) blur(10px);border-bottom:1px solid #23232D}
.chrome-in{max-width:1560px;margin:0 auto;padding:12px 22px;
  display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.mark{font-family:'Archivo',system-ui,sans-serif;font-weight:800;font-size:13px;
  letter-spacing:.16em;white-space:nowrap}
.mark i{color:#FF2E4C;font-style:normal}
.mark em{font-style:normal;color:#8A8A9C;font-weight:600;font-size:11px;margin-left:8px;letter-spacing:.08em}
.tabs{display:flex;gap:4px;background:#17171E;border:1px solid #26262F;border-radius:10px;padding:3px}
.tabs button{padding:8px 15px;border-radius:7px;font-size:13px;font-weight:500;
  color:#9A9AAE;transition:.14s;white-space:nowrap}
.tabs button:hover{color:#E8E8EE}
.tabs button.on{background:#FF2E4C;color:#fff;font-weight:600}
.tabs button .k{font-family:'IBM Plex Mono',monospace;font-size:10px;opacity:.65;margin-right:6px}
.spacer{flex:1}
.hint-k{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#6E6E80;letter-spacing:.04em}

.brief{max-width:1560px;margin:0 auto;padding:26px 22px 20px}
.brief h1{font-family:'Archivo',system-ui,sans-serif;font-weight:800;
  font-size:clamp(22px,2.6vw,30px);letter-spacing:-.02em;line-height:1.15;margin-bottom:10px}
.brief p{font-size:14px;line-height:1.7;color:#B4B4C2;max-width:74ch}
.brief p + p{margin-top:9px}
.brief b{color:#fff;font-weight:600}
.cards{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));
  margin-top:18px}
.card{background:#15151C;border:1px solid #24242E;border-radius:11px;padding:15px 16px;
  cursor:pointer;transition:.15s;text-align:left}
.card:hover{border-color:#3A3A48}
.card.on{border-color:#FF2E4C;background:#1B1218}
.card .k{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:#6E6E80;margin-bottom:7px}
.card h3{font-family:'Archivo',system-ui,sans-serif;font-weight:700;font-size:16px;margin-bottom:6px}
.card.on h3{color:#FF8FA1}
.card p{font-size:12.5px;line-height:1.6;color:#9A9AAE}
.card .tham{display:inline-block;margin-top:9px;font-family:'IBM Plex Mono',monospace;
  font-size:10px;color:#6E6E80;background:#1E1E27;border-radius:5px;padding:3px 8px}

.note{max-width:1560px;margin:0 auto;padding:0 22px 18px}
.note div{background:#15151C;border:1px solid #24242E;border-left:3px solid #7FD6E8;
  border-radius:9px;padding:13px 16px;font-size:12.5px;line-height:1.75;color:#9A9AAE}
.note b{color:#BFE9F3;font-weight:600}

.stage-wrap{padding:0 22px 60px;max-width:1560px;margin:0 auto}
.stage{border-radius:14px;overflow:hidden;border:1px solid #26262F}
.pane{display:none}
.pane.on{display:block}
.chua-co{padding:70px 20px;text-align:center;font-family:'IBM Plex Mono',monospace;
  font-size:12px;color:#6E6E80;background:#111117}

footer{max-width:1560px;margin:0 auto;padding:0 22px 50px;
  font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.9;color:#5E5E70}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>

<div class="chrome"><div class="chrome-in">
  <div class="mark"><i>●</i> HAUSTEK <em>CHỌN HƯỚNG NHÌN</em></div>
  <div class="tabs" id="tabs">
${HUONG.map((h, i) => `    <button data-p="${h.id}"${i === 0 ? ' class="on"' : ''}><span class="k">${i + 1}</span>${h.ten}</button>`).join('\n')}
  </div>
  <div class="spacer"></div>
  <div class="hint-k">bấm ${HUONG.map((h, i) => i + 1).join(' · ')} trên bàn phím để lật nhanh</div>
</div></div>

<div class="brief">
  <h1>Cùng một màn hình, cùng một bộ số, ba hướng nhìn</h1>
  <p>Đây là màn <b>Tổng quan vận hành</b> của intranet, kỳ 06/2026 — đã nạp đủ ba luồng,
     chưa duyệt, đối chiếu còn lệch $41,37. Cả ba hướng vẽ đúng cùng những con số đó,
     nên khác nhau bao nhiêu là khác ở phần nhìn, không phải ở nội dung.</p>
  <p>Anh lật qua ba cái rồi chỉ một. Tôi dựng lại chín màn hình còn lại theo hướng đó.</p>
  <div class="cards" id="cards">
${HUONG.map((h, i) => `    <button class="card${i === 0 ? ' on' : ''}" data-p="${h.id}">
      <div class="k">${h.ten}</div>
      <h3>${h.ten}</h3>
      <p>${h.mo}</p>
      <span class="tham">${h.tham}</span>
    </button>`).join('\n')}
  </div>
</div>

<div class="note"><div>
  <b>Chưa có trong bản này:</b> song ngữ Việt–Anh. Tôi làm ở bước dựng thật, sau khi anh
  chốt hướng — thêm vào đây chỉ làm rối việc chọn. Phần chữ đã cắt hết đoạn giảng giải
  của bản cũ; nhãn ngắn lại, ai cần hiểu sâu thì để tooltip.
</div></div>

<div class="stage-wrap">
  <div class="stage" id="stage">
${HUONG.map((h, i) => `    <div class="pane${i === 0 ? ' on' : ''}" data-pane="${h.id}" style="background:${h.canvas};color:${h.chu}">
${doc(h.id)}
    </div>`).join('\n')}
  </div>
</div>

<footer>
  Bản mẫu · số liệu sinh tại chỗ ở quy mô thật, không phải doanh thu Haustek<br>
  Bảng màu chuỗi dữ liệu đã kiểm bằng máy: lệch màu CVD, sàn tương phản, dải độ sáng, ngưỡng sắc độ — đạt cả ba hướng
</footer>

<script>
(function () {
  var panes = document.querySelectorAll('[data-pane]');
  function go(id) {
    panes.forEach(function (p) { p.classList.toggle('on', p.dataset.pane === id); });
    document.querySelectorAll('[data-p]').forEach(function (b) { b.classList.toggle('on', b.dataset.p === id); });
    location.hash = id;
    window.dispatchEvent(new Event('resize'));
  }
  document.querySelectorAll('[data-p]').forEach(function (b) {
    b.addEventListener('click', function () { go(b.dataset.p); });
  });
  /* Phím tắt đánh số theo thứ tự tab. Cắm cứng a/b/c như trước là sai ngay
     khi thêm hướng mới, mà dòng gợi ý lại vẫn ghi cũ. */
  var IDS = [].map.call(document.querySelectorAll('[data-p]'), function (b) { return b.dataset.p; });
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= IDS.length) return go(IDS[n - 1]);
    var k = e.key.toLowerCase();
    if (IDS.indexOf(k) >= 0) go(k);
  });
  var h = (location.hash || '').replace('#', '');
  if (IDS.indexOf(h) >= 0) go(h);
})();
</script>
`;
const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
${ruot}
</body>
</html>`;

fs.writeFileSync(path.join(D, 'chon-huong.html'), html);
fs.writeFileSync(path.join(D, 'chon-huong.artifact.html'), ruot);
const co = HUONG.filter(h => fs.existsSync(path.join(D, 'huong-' + h.id + '.html'))).map(h => h.id);
console.log('đã dựng design/chon-huong.html · hướng có sẵn: ' + (co.join(', ') || 'chưa có cái nào'));
