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

const NOIBO = ['tong-quan','nap-du-lieu','khop-isrc','doi-chieu','ke-toan',
               'chi-tra','tam-ung','ty-le','danh-muc','quan-tri'];
const KHACH = ['k-tong-quan','k-ban-ghi','k-bang-ke','k-tam-ung','k-tai-lieu'];
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
      (lang === 'vi' ? 'Cổng khách' : 'Client') + '</button></div>' +
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

  function nạpPhien() {
    var s = api.session(toi.role, toi.partyId);
    var p = api.periods(toi.role, toi.partyId);
    return { me: s, kys: p.open, cho: p.waiting, kyTacQuyen: p.pubOpen, moiNhat: p.latest };
  }
  var PHIEN = nạpPhien();

  HT.chay({
    ten: 'portal', api: api, phien: PHIEN, coTienTe: false,
    kyDanhSach: function () { return PHIEN.kys.map(function (p) { return { k: p.k, label: p.label }; }); },
    kyMacDinh: PHIEN.moiNhat,
    ghiChu: function () { return PHIEN.me.clientId; },
    chanTrai: function (c) {
      var opts = TK.map(function (a, i) {
        return '<option value="' + i + '"' + (a === toi ? ' selected' : '') + '>' + HT.esc(a.name) + '</option>';
      }).join('');
      return '<b>' + HT.esc(PHIEN.me.name) + '</b><span>' + HT.esc(toi.role === 'label' ? 'Label'
          : (PHIEN.me.independent ? (c.lang === 'vi' ? 'Nghệ sĩ độc lập' : 'Independent artist')
                                  : (c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist'))) + '</span>' +
        '<select class="inline-sel" data-ai style="margin-top:9px;width:100%">' + opts + '</select>' +
        oChonCua(c.lang, '<p>' + HT.esc(c.lang === 'vi'
          ? 'Bản mẫu: đổi tài khoản hoặc đổi cửa để xem góc nhìn khác. Hệ thật không có hai ô này.'
          : 'Prototype: switch account or door to see another view. The real system has neither control.') + '</p>');
    }
  });

  document.addEventListener('change', function (e) {
    var s = e.target.closest('[data-ai]');
    if (!s) return;
    dat(K_TK, s.value);
    location.hash = '#k-tong-quan';
    location.reload();
  });

} else {
  MAN_NOIBO.forEach(function (f) { f(); });
  var A = HAUSTEK.admin;
  A.provideSecrets({
    code: 'DIST-1',
    name: 'Đối tác phân phối chính (tên thật điền khi triển khai)',
    grossRate: 0.86,
    contact: 'nội bộ · không hiển thị cho khách'
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
                 nhan: A.isApproved(p.k) ? (en ? 'approved' : 'đã duyệt')
                                         : (en ? 'not approved' : 'chưa duyệt') };
      });
    },
    kyMacDinh: A.periods[A.periods.length - 1].k,
    ghiChu: function (c) {
      var f = A.fx.get();
      var khoa = f.locked[c.kyKey];
      return '1 USD = ' + HT.fmt.n(khoa ? khoa.rate : f.rate) + ' ₫' +
        (khoa ? '' : (c.lang === 'vi' ? ' · chưa chốt' : ' · not locked'));
    },
    chanTrai: function (c) {
      return '<b>ops@haustek-group.com</b><span>' +
        HT.esc(c.lang === 'vi' ? 'Tài khoản vận hành' : 'Operations account') + '</span>' +
        oChonCua(c.lang, '<p>' + HT.esc(c.lang === 'vi'
          ? 'Duyệt một kỳ ở đây rồi đổi sang cổng khách: kỳ đó hiện ra bên ấy.'
          : 'Approve a period here, then switch to the client portal: it appears there.') + '</p>');
    }
  });
}

})();
</scr`+`ipt>`);

const html = PHAN.join('\n');
const ra = process.argv[2] || (__dirname + '/goi-mot-trang.html');
fs.writeFileSync(ra, html);
console.log(ra, '·', (html.length / 1024).toFixed(0), 'KB');
