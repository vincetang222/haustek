/* Gói cả hai cửa vào MỘT trang để xem online mà không phải tải gì.
   Khác bản nhiều file ở đúng một chỗ: trang không tự đăng ký lúc nạp file
   nữa mà nằm trong hàm, và bản gói chọn chạy bộ nào tuỳ cửa đang mở. Nhờ
   vậy cửa đối tác vẫn gọi lockdown() TRƯỚC khi bất cứ trang nào chạy —
   giữ nguyên ranh giới của bản nhiều file. */
/* Dòng <meta charset="utf-8"> ở đầu là BẮT BUỘC, dù trình xem artifact tự
   thêm một dòng như vậy vào phần đầu trang của nó.

   Lý do: file này còn được mở thẳng từ repo. Máy chủ tĩnh thường trả về
   "Content-type: text/html" KHÔNG kèm charset, nên trình duyệt tự đoán —
   và nó đoán windows-1252. Toàn bộ chữ tiếng Việt trong mã nguồn hỏng
   theo, chuỗi JavaScript đứt giữa chừng, và trang chết ngay với
   "Invalid or unexpected token". Mở trong khung của trình xem thì không
   thấy, vì khung đã khai charset rồi — nên lỗi này chỉ hiện ra khi mở
   thẳng, đúng cách người khác hay mở nhất. */
const fs = require('fs');
const V = __dirname + '/v2/';
const doc = p => fs.readFileSync(p, 'utf8');

/* Năm mô-đun nội bộ, sáu trang đối tác. Danh sách này và hai file
   intranet.html / khach.html phải khớp nhau; lệch một tên là một trang
   biến mất im lặng ở đúng một trong hai bản. */
const NOIBO = ['hom-nay', 'viec', 'doi-tac', 'thong-bao', 'quan-tri'];
const KHACH = ['k-trang-chu', 'k-viec', 'k-nhac', 'k-thanh-toan', 'k-trao-doi', 'k-tai-khoan'];
const boc = ds => ds.map(n =>
  '/* ---- man/' + n + '.js ---- */\nfunction(){\n' + doc(V + 'man/' + n + '.js') + '\n}').join(',\n');

const PHAN = [];
/* Bộ chữ NHÚNG THẲNG vào trang, không gọi ra fonts.googleapis.com.

   Lý do không phải là cho nhanh. Thẻ <link rel=stylesheet> CHẶN việc chạy
   script cho tới khi tải xong; mà mọi trang của bản gói này đều do script
   dựng ra. Nên chỉ cần fonts.googleapis.com chậm hoặc bị chặn — mạng công
   ty, tiện ích chặn quảng cáo, hay đơn giản là nhà mạng chặn — là trang
   đứng lại ở một khoảng trắng có mỗi cái tiêu đề, không báo lỗi gì.

   Nhúng vào thì trang không còn phụ thuộc mạng ngoài nào cả. Chỉ giữ hai
   họ chữ thật sự dùng, và chỉ ba bộ ký tự latin / latin-ext / vietnamese. */
PHAN.push(`<meta charset="utf-8">
<title>Haustek Portal</title>
<style>
`, doc(V + 'fonts-nhung.css'), `
`, doc(V + 'haustek-theme.css'), `

/* ---- ô chọn cửa, chỉ có ở bản gói một trang ---- */
.cua-chon{margin-top:10px}
.cua-chon .seg{width:100%}
.cua-chon .seg button{flex:1;padding:7px 8px;font-size:11.5px}
.cua-chon p{font-size:11px;color:var(--on-chrome-3);line-height:1.55;margin-top:7px}
</style>

`);
PHAN.push('<scr'+'ipt>', doc(__dirname + '/haustek-loi.js'), '</scr'+'ipt>');
PHAN.push('<scr'+'ipt>', doc(V + 'haustek-shell.js'), '</scr'+'ipt>');
PHAN.push('<scr'+'ipt>', doc(V + 'haustek-man.js'), '</scr'+'ipt>');
PHAN.push('<scr'+'ipt>', doc(V + 'haustek-hoso.js'), '</scr'+'ipt>');
PHAN.push(`

<script>
"use strict";
/* Mười một trang nằm trong hàm, chưa chạy. */
var MAN_NOIBO = [`, boc(NOIBO), `];
var MAN_KHACH = [`, boc(KHACH), `];
</scr`+`ipt>

<script>
"use strict";
(function () {

/* Bản gói một trang chạy trong khung cách ly của trình xem: tải file bị
   chặn. Bật cờ để nút nào có xuất file thì nói thật thay vì im lặng. */
window.HAUSTEK_XEM_ONLINE = true;

var K_CUA = 'haustek.cua', K_TK = 'haustek.doi-tac-mau', K_NV = 'haustek.nv';
function lay(k, mac) { try { return localStorage.getItem(k) || mac; } catch (e) { return mac; } }
function dat(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var cua = lay(K_CUA, 'noi-bo');

function oChonCua(phu) {
  return '<div class="cua-chon"><div class="seg" data-cua>' +
    '<button type="button" data-c2="noi-bo"' + (cua === 'noi-bo' ? ' class="on"' : '') + '>Nội bộ</button>' +
    '<button type="button" data-c2="khach"' + (cua === 'khach' ? ' class="on"' : '') + '>Cổng đối tác</button></div>' +
    (phu || '') + '</div>';
}

document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-c2]');
  if (!b) return;
  dat(K_CUA, b.getAttribute('data-c2'));
  location.hash = '';
  location.reload();
});

if (cua === 'khach') {
  /* Lấy danh sách tài khoản mẫu TRƯỚC, rồi khoá cửa TRƯỚC khi trang nào
     chạy — y như khach.html. */
  var TK = HAUSTEK.api.dangNhapMau();
  HAUSTEK.lockdown();
  MAN_KHACH.forEach(function (f) { f(); });

  var api = HAUSTEK.api;
  var id0 = lay(K_TK, '');
  /* Mặc định chọn đối tác dùng nhiều dịch vụ nhất, chỉ khi chưa ai chọn.
     Danh sách xếp theo tên, nên đối tác đầu bảng có thể chỉ mua một dịch
     vụ và người mở lần đầu sẽ thấy cổng mỏng nhất rồi tưởng đó là tất cả. */
  var toi = TK.filter(function (t) { return t.doiTacId === id0; })[0]
         || TK.slice().sort(function (a, b) { return (b.dichVu || []).length - (a.dichVu || []).length; })[0];
  dat(K_TK, toi.doiTacId);
  var PHIEN = api.phien(toi.doiTacId);

  HT.chay({
    ten: 'portal', api: api, phien: PHIEN,
    thongBao: function () {
      var ds = api.chuaDoc(PHIEN.doiTacId, PHIEN.nguoiDungId) || [];
      return { items: ds.map(function (d) {
        return { id: d.thongBaoId, title: d.tieuDe, body: d.noiDung || '', di: 'k-trao-doi' };
      }), unread: ds.length };
    },
    danhDauDoc: function (c, ids) {
      (ids === 'all' ? (api.chuaDoc(PHIEN.doiTacId, PHIEN.nguoiDungId) || []).map(function (d) { return d.thongBaoId; }) : ids)
        .forEach(function (x) { try { api.danhDauDaDoc(PHIEN.doiTacId, x, PHIEN.nguoiDungId); } catch (e) {} });
      return true;
    },
    ghiChu: function () { return PHIEN.ten; },
    chanTrai: function () {
      var opts = TK.map(function (t) {
        return '<option value="' + HT.esc(t.doiTacId) + '"' + (t.doiTacId === toi.doiTacId ? ' selected' : '') + '>' +
          HT.esc(t.ten) + '</option>';
      }).join('');
      var ns = PHIEN.nguoiPhuTrach;
      return '<b>' + HT.esc(PHIEN.ten) + '</b>' +
        '<span>' + HT.esc(ns ? 'Phụ trách: ' + ns.ten : 'Đối tác Haustek') + '</span>' +
        '<select class="inline-sel" data-ai style="margin-top:9px;width:100%">' + opts + '</select>' +
        oChonCua('<p>' + HT.esc(
          'Bản mẫu: đổi đối tác hoặc đổi cửa để xem theo góc nhìn khác. Hệ thống thật không có hai ô chọn này.') + '</p>');
    }
  });

  document.addEventListener('change', function (e) {
    var s = e.target.closest('[data-ai]');
    if (!s) return;
    dat(K_TK, s.value);
    location.hash = '#k-trang-chu';
    location.reload();
  });

} else {
  MAN_NOIBO.forEach(function (f) { f(); });
  var A = HAUSTEK.admin;
  try { var NV = lay(K_NV, ''); if (NV) A.nhanSu.datToi(NV); } catch (e) {}

  HT.chay({
    ten: 'internal', A: A,
    thongBao: function () { return A.chuong(); },
    danhDauDoc: function () { return true; },
    tim: function (c, q) {
      var kq = A.timKiem(q, 5);
      return kq.doiTac.map(function (d) { return { title: d.ten, sub: 'Đối tác', di: 'doi-tac' }; })
        .concat(kq.viec.map(function (v) { return { title: v.tieuDe, sub: v.doiTacTen + ' · việc', di: 'viec' }; }))
        .concat(kq.banPhatHanh.map(function (b) { return { title: b.ten, sub: 'Bản phát hành', di: 'viec' }; }));
    },
    ghiChu: function () {
      var hn = A.homNayCua(A.nhanSu.toi.id);
      return A.thuTrongTuan(hn.ngay) + ', ' + A.ngayVi(hn.ngay);
    },
    chanTrai: function () {
      var me = A.nhanSu.toi;
      return '<b>' + HT.esc(me.ten) + '</b><span>' + HT.esc(me.chucDanh) + '</span>' +
        '<select class="inline-sel" data-nv style="margin-top:9px;width:100%">' + A.nhanSu.list().map(function (s) {
          return '<option value="' + s.id + '"' + (s.id === me.id ? ' selected' : '') + '>' +
            HT.esc(s.ten + ' · ' + s.chucDanh) + '</option>';
        }).join('') + '</select>' +
        oChonCua('<p>' + HT.esc(
          'Bản mẫu: đổi người để xem trang Hôm nay của từng vị trí, hoặc đổi sang cổng đối tác để xem phía bên kia.') + '</p>');
    }
  });
  document.addEventListener('change', function (e) {
    var s = e.target.closest('[data-nv]');
    if (!s) return;
    dat(K_NV, s.value);
    location.hash = '#hom-nay';
    location.reload();
  });
}

})();
</scr`+`ipt>`);

const html = PHAN.join('\n');
const ra = process.argv[2] || (__dirname + '/goi-mot-trang.html');
fs.writeFileSync(ra, html);
console.log(ra, '·', (html.length / 1024).toFixed(0), 'KB');
