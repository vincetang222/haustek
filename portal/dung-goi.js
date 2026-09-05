/* Gói cả hai cửa vào MỘT trang để xem online mà không phải tải gì.
   Khác bản nhiều file ở đúng một chỗ: màn hình không tự đăng ký lúc nạp
   file nữa mà nằm trong hàm, và trang chọn chạy bộ nào tuỳ cửa đang mở.
   Nhờ vậy cửa khách vẫn gọi lockdown() TRƯỚC khi bất cứ màn nào chạy —
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

const NOIBO = ['ban-lam-viec','tong-quan','theo-doi','chat-luong','chia-se','chien-dich','xet-duyet','muc-tra','nap-du-lieu','khop-isrc','doi-chieu','phat-hanh','giao-nhan','sua-hang-loat','bang-gia','ke-toan',
               'chi-tra','tam-ung','ty-le','danh-muc','nen-tang','doi-tac','ho-tro','quyen','quan-tri'];
const KHACH = ['k-tong-quan','k-ban-ghi','k-danh-muc','k-nen-tang','k-du-bao','k-xu-huong','k-playlist','k-chat-luong','k-chia-se','k-chien-dich','k-phat-hanh','k-nghe-si','k-he-thong','k-vi','k-bang-ke','k-tam-ung','k-ho-tro','k-tai-lieu'];
const boc = ds => ds.map(n =>
  '/* ---- man/' + n + '.js ---- */\nfunction(){\n' + doc(V + 'man/' + n + '.js') + '\n}').join(',\n');

const PHAN = [];
/* Bộ chữ NHÚNG THẲNG vào trang, không gọi ra fonts.googleapis.com.

   Lý do không phải là cho nhanh. Thẻ <link rel=stylesheet> CHẶN việc chạy
   script cho tới khi tải xong; mà mọi màn hình của trang này đều do script
   dựng ra. Nên chỉ cần fonts.googleapis.com chậm hoặc bị chặn — mạng công
   ty, tiện ích chặn quảng cáo, hay đơn giản là nhà mạng chặn — là trang
   đứng lại ở một khoảng trắng có mỗi cái tiêu đề, không báo lỗi gì.
   Đã dựng lại đúng tình huống đó trong trình duyệt: chặn fonts.googleapis
   thì trang trắng, cho qua thì chạy bình thường.

   Nhúng vào thì trang không còn phụ thuộc mạng ngoài nào cả. Chỉ giữ hai
   họ chữ thật sự dùng, và chỉ ba bộ ký tự latin / latin-ext / vietnamese —
   944 KB xuống còn 278 KB. */
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
PHAN.push('<scr'+'ipt>', doc(__dirname + '/haustek-core.js'), '</scr'+'ipt>');
PHAN.push('<scr'+'ipt>', doc(V + 'haustek-shell.js'), '</scr'+'ipt>');
PHAN.push('<scr'+'ipt>', doc(V + 'haustek-bieudo.js'), '</scr'+'ipt>');
PHAN.push('<scr'+'ipt>', doc(V + 'haustek-man.js'), '</scr'+'ipt>');
PHAN.push('<scr'+'ipt>', doc(V + 'haustek-taisan.js'), '</scr'+'ipt>');
PHAN.push('<scr'+'ipt>', doc(V + 'haustek-them.js'), '</scr'+'ipt>');
PHAN.push(`

<script>
"use strict";
/* Mười lăm màn hình nằm trong hàm, chưa chạy. */
var MAN_NOIBO = [`, boc(NOIBO), `];
var MAN_KHACH = [`, boc(KHACH), `];
</scr`+`ipt>

<script>
"use strict";
(function () {

/* Bản gói một trang chạy trong khung cách ly của trình xem: tải file bị
   chặn. Bật cờ để nút Xuất CSV nói thật thay vì im lặng. */
window.HAUSTEK_XEM_ONLINE = true;

var K_CUA = 'haustek.cua', K_TK = 'haustek.demo.tk';
function lay(k, mac) { try { return localStorage.getItem(k) || mac; } catch (e) { return mac; } }
function dat(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var cua = lay(K_CUA, 'noi-bo');

function oChonCua(lang, phu) {
  return '<div class="cua-chon"><div class="seg" data-cua>' +
    '<button type="button" data-c2="noi-bo"' + (cua === 'noi-bo' ? ' class="on"' : '') + '>' +
      (lang === 'vi' ? 'Nội bộ' : 'Internal') + '</button>' +
    '<button type="button" data-c2="khach"' + (cua === 'khach' ? ' class="on"' : '') + '>' +
      (lang === 'vi' ? 'Cổng đối tác' : 'Client') + '</button></div>' +
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
  /* Khoá cửa TRƯỚC khi màn hình nào chạy — y như khach.html. */
  HAUSTEK.lockdown();
  MAN_KHACH.forEach(function (f) { f(); });

  var api = HAUSTEK.api;
  var TK = api.demoLogins().accounts.filter(function (a) { return a.status === 'active'; });
  var i0 = 0;
  try { var v = +localStorage.getItem(K_TK); if (v >= 0 && v < TK.length) i0 = v; } catch (e) {}
  var toi = TK[i0];

  /* Xem với tư cách label con: label mẹ chọn một label con thì phiên
     chuyển sang label con đó, tài khoản đăng nhập vẫn là label mẹ. Khoá
     này chỉ là ý muốn của người dùng; quyền thật kiểm bằng api.delegations. */
  var K_XEM = 'haustek.xemThay';
  function xoaXem() { try { localStorage.removeItem(K_XEM); } catch (e) {} }
  var thay = null;                                        /* {labelId, name, clientId} khi đang xem thay */
  var phienCua = { role: toi.role, partyId: toi.partyId }; /* phiên thật sự dùng để gọi api */
  (function () {
    var id = lay(K_XEM, '');
    if (id === '' || toi.role !== 'label') { xoaXem(); return; }
    var uy = null;
    try { uy = api.delegations(toi.role, toi.partyId); } catch (e) { uy = null; }
    var lc = uy ? uy.viewAs.filter(function (x) { return String(x.labelId) === String(id); })[0] : null;
    if (!lc) { xoaXem(); return; }
    thay = { labelId: lc.labelId, name: lc.name, clientId: lc.clientId };
    phienCua = { role: 'label', partyId: lc.labelId };
  })();

  function nạpPhien() {
    var s = api.session(phienCua.role, phienCua.partyId);
    var p = api.periods(phienCua.role, phienCua.partyId);
    return { me: s, kys: p.open, cho: p.waiting, kyTacQuyen: p.pubOpen, moiNhat: p.latest };
  }
  var PHIEN = nạpPhien();

  HT.chay({
    ten: 'portal', api: api, phien: PHIEN, coTienTe: false,
    kyDanhSach: function () { return PHIEN.kys.map(function (p) { return { k: p.k, label: p.label }; }); },
    kyMacDinh: PHIEN.moiNhat,
    ghiChu: function () { return PHIEN.me.clientId; },
    /* Biểu ngữ ngay trên nội dung trang khi đang xem thay một label con. */
    bieuNgu: function (c) {
      if (!thay) return '';
      var vi = c.lang === 'vi';
      return '<div class="viewas">' + HT.icon('layers') + '<span>' +
        (vi ? 'Đang xem với tư cách label con <b>' + HT.esc(thay.name) + '</b> (' + HT.esc(thay.clientId) + '). Số liệu và bảng kê là của label con này.'
            : 'Viewing as sub-label <b>' + HT.esc(thay.name) + '</b> (' + HT.esc(thay.clientId) + '). Figures and statements belong to this sub-label.') +
        '</span><span class="sp"></span><button type="button" class="btn sm" data-thoi-xem>' +
        HT.esc(vi ? 'Trở về ' + toi.name : 'Back to ' + toi.name) + '</button></div>';
    },
    chanTrai: function (c) {
      var vi = c.lang === 'vi', me = PHIEN.me;
      var opts = TK.map(function (a, i) {
        return '<option value="' + i + '"' + (a === toi ? ' selected' : '') + '>' + HT.esc(a.name) + '</option>';
      }).join('');
      var vai = toi.role !== 'label'
        ? (me.independent ? (vi ? 'Nghệ sĩ độc lập' : 'Independent artist') : (vi ? 'Nghệ sĩ' : 'Artist'))
        : me.parentLabel ? (vi ? 'Label con của ' + me.parentLabel.name : 'Sub-label of ' + me.parentLabel.name)
        : me.childLabels > 0 ? (vi ? 'Label mẹ · ' + me.childLabels + ' label con' : 'Parent label · ' + me.childLabels + ' sub-labels')
        : 'Label';
      return '<b>' + HT.esc(me.name) + '</b><span>' + HT.esc(vai) + '</span>' +
        (thay ? '<span style="display:block;margin-top:3px">' + HT.esc(vi ? 'đăng nhập: ' + toi.name : 'signed in as ' + toi.name) + '</span>' : '') +
        '<select class="inline-sel" data-ai style="margin-top:9px;width:100%">' + opts + '</select>' +
        oChonCua(c.lang, '<p>' + HT.esc(vi
          ? 'Bản mẫu: đổi tài khoản hoặc đổi cổng để xem theo góc nhìn khác. Hệ thống thật không có hai ô chọn này.'
          : 'Prototype: switch account or door to see another view. The real system has neither control.') + '</p>');
    }
  });

  document.addEventListener('change', function (e) {
    var s = e.target.closest('[data-ai]');
    if (!s) return;
    dat(K_TK, s.value);
    xoaXem();
    location.hash = '#k-tong-quan';
    location.reload();
  });

  /* Bấm "Xem cổng của label này" ở bất kỳ đâu (cây label, ngăn trượt) và
     "Trở về" trên biểu ngữ. Quyền kiểm ở api.canViewAs trước khi đổi phiên. */
  document.addEventListener('click', function (e) {
    var x = e.target.closest('[data-xem-thay]');
    if (x) {
      var id = x.getAttribute('data-xem-thay'), ok = false;
      try { ok = !!api.canViewAs(toi.role, toi.partyId, id); } catch (err) { ok = false; }
      if (!ok) {
        HT.thongBao(HT.lang === 'vi' ? 'Bạn không được uỷ quyền xem label này.' : 'You are not authorised to view this label.', 'no');
        return;
      }
      dat(K_XEM, String(id));
      location.hash = '#k-tong-quan';
      location.reload();
      return;
    }
    if (e.target.closest('[data-thoi-xem]')) {
      xoaXem();
      location.hash = '#k-he-thong';
      location.reload();
    }
  });

} else {
  MAN_NOIBO.forEach(function (f) { f(); });
  var A = HAUSTEK.admin;
  try { var NV = localStorage.getItem('haustek.demo.nv'); if (NV) A.staff.setMe(NV); } catch (e) {}
  A.provideSecrets({
    code: 'DIST-1',
    name: 'Đối tác phân phối chính (tên thật điền khi triển khai)',
    grossRate: 0.86,
    contact: 'nội bộ · không hiển thị cho đối tác'
  });
  HT.setFx(A.fx.get().rate);

  HT.chay({
    ten: 'internal', A: A,
    kyDanhSach: function () {
      return A.periods.map(function (p) {
        /* Nhãn này hiện trong ô chọn kỳ ở thanh trên, nên nó là CHỮ GIAO
           DIỆN và phải đổi theo ngôn ngữ. HT.lang là nguồn duy nhất. */
        var en = HT.lang === 'en';
        return { k: p.k, label: p.label, idx: p.idx,
                 nhan: A.isApproved(p.k) ? (en ? 'approved' : 'đã xét duyệt')
                                         : (en ? 'not approved' : 'chưa xét duyệt') };
      });
    },
    kyMacDinh: A.periods[A.periods.length - 1].k,
    ghiChu: function (c) {
      var f = A.fx.get();
      var khoa = f.locked[c.kyKey];
      return '1 USD = ' + HT.fmt.n(khoa ? khoa.rate : f.rate) + ' ₫' +
        (khoa ? '' : (c.lang === 'vi' ? ' · chưa chốt tỷ giá' : ' · not locked'));
    },
    chanTrai: function (c) {
      var me = A.staff.me;
      return '<b>' + HT.esc(me.email) + '</b><span>' + HT.esc(c.lang === 'vi' ? me.title : me.titleEn) + '</span>' +
        '<select class="inline-sel" data-nv style="margin-top:9px;width:100%">' + A.staff.list().map(function (s) {
          return '<option value="' + s.id + '"' + (s.id === me.id ? ' selected' : '') + '>' + HT.esc(s.name + ' · ' + (c.lang === 'vi' ? s.title : s.titleEn)) + '</option>';
        }).join('') + '</select>' +
        oChonCua(c.lang, '<p>' + HT.esc(c.lang === 'vi'
          ? 'Bản mẫu: đổi nhân viên để xem bàn làm việc theo vai; xét duyệt một kỳ ở đây rồi chuyển sang cổng đối tác.'
          : 'Prototype: switch staff to see each role’s desk; approve a period here, then switch to the client portal.') + '</p>');
    }
  });
  document.addEventListener('change', function (e) {
    var s = e.target.closest('[data-nv]');
    if (!s) return;
    dat('haustek.demo.nv', s.value);
    location.hash = '#ban-lam-viec';
    location.reload();
  });
}

})();
</scr`+`ipt>`);

const html = PHAN.join('\n');
const ra = process.argv[2] || (__dirname + '/goi-mot-trang.html');
fs.writeFileSync(ra, html);
console.log(ra, '·', (html.length / 1024).toFixed(0), 'KB');
