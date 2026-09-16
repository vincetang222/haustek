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

/* Danh sách trang ĐỌC THẲNG TỪ HAI TRANG THẬT, không chép tay.
   Trước đây hai mảng này gõ cứng ở đây, và hệ quả đúng như phải thế: vòng
   15 thêm ba trang mới vào intranet.html mà quên thêm vào đây, nên suốt
   hai vòng bản gói một trang — tức bản người ngoài mở ra xem — thiếu hẳn
   ba trang ấy, trong khi mọi bài kiểm đều xanh vì chúng kiểm trang thật.
   Đọc từ thẻ <script src="man/…"> thì danh sách không bao giờ lệch được
   nữa: thêm trang vào trang thật là bản gói có ngay. */
function manCua(trang) {
  const html = doc(V + trang);
  const ra = [];
  const re = /<script\s+src="man\/([a-z0-9-]+)\.js"><\/script>/gi;
  let m;
  while ((m = re.exec(html))) ra.push(m[1]);
  if (!ra.length) throw new Error('Không đọc được trang nào từ ' + trang);
  return ra;
}
const NOIBO = manCua('intranet.html');
const KHACH = manCua('khach.html');

/* Danh sách THƯ VIỆN cũng đọc thẳng từ trang thật, vì đúng một lý do đã
   xảy ra thật thêm một lần nữa. Ghi chú ngay trên kể chuyện vòng 15 quên
   thêm ba TRANG vào mảng gõ cứng, và cách chữa là đọc từ trang thật. Chữa
   xong một nửa: danh sách trang thì tự đọc, danh sách thư viện vẫn gõ tay
   ngay dưới đây. Vòng 25 thêm v2/haustek-cua.js vào cả hai trang thật mà
   không thêm vào mảng ấy — nên bản gói một trang, tức bản người ngoài mở
   ra xem, KHÔNG CÓ trang đăng nhập, trong khi hai trang thật có, và cả 22
   phép kiểm của cua-dang-nhap.js vẫn xanh vì chúng kiểm trang thật.
   Người dùng báo "vẫn chưa thấy screen đăng nhập" đúng vào chỗ đó.
   Giờ chữa nốt nửa còn lại: cả hai danh sách đều đọc từ trang thật, nên
   thêm file vào trang thật là bản gói có ngay, không nhớ gì cả. */
function thuVienCua(trang) {
  const html = doc(V + trang);
  const ra = [];
  /* Khớp mọi <script src="..."> KHÔNG nằm trong man/ — tức các file thư
     viện. '../haustek-core.js' cũng khớp, và V + '../haustek-core.js' là
     đường dẫn hợp lệ cho fs, nên không phải xử lý riêng. */
  const re = /<script\s+src="((?:\.\.\/)?[a-z0-9-]+\.js)"><\/script>/gi;
  let m;
  while ((m = re.exec(html))) ra.push(m[1]);
  return ra;
}
const THU_VIEN = (function () {
  const ra = [];
  thuVienCua('intranet.html').concat(thuVienCua('khach.html')).forEach(f => {
    if (ra.indexOf(f) < 0) ra.push(f);   /* giữ THỨ TỰ NẠP của trang thật */
  });
  if (!ra.length) throw new Error('Không đọc được thư viện nào từ hai trang thật');
  return ra;
})();
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
THU_VIEN.forEach(f => PHAN.push('<scr'+'ipt>', doc(V + f), '</scr'+'ipt>'));
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

var K_CUA = 'haustek.cua';
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

  /* Xem với tư cách label con: label mẹ chọn một label con thì phiên
     chuyển sang label con đó, tài khoản đăng nhập vẫn là label mẹ. Khoá
     này chỉ là ý muốn của người dùng; quyền thật kiểm bằng api.delegations. */
  var K_XEM = 'haustek.xemThay';
  function xoaXem() { try { localStorage.removeItem(K_XEM); } catch (e) {} }

  /* Ai đang vào: do CỬA quyết định, y như khach.html. Bản gói khác trang
     thật đúng một chỗ — ô chọn cổng nằm ngay dưới thẻ đăng nhập, để người
     mở bản công bố đổi được sang cổng nội bộ mà KHÔNG phải đăng nhập
     trước rồi mới thấy nút. */
  var toi = null;
  HTCua.mo({
    ten: 'portal',
    tieuDe: HT.lang === 'en' ? 'Partner portal' : 'Cổng đối tác',
    phu: HT.lang === 'en'
      ? 'Your revenue by period, your wallet, and your catalogue.'
      : 'Số tiền theo từng kỳ, ví của bạn, và danh mục của bạn.',
    dangNhap: function (email) { return api.dangNhapBang(email); },
    mau: TK.map(function (a) {
      return { email: a.email, ten: a.name,
               phu: a.kind === 'nhan' ? (HT.lang === 'en' ? 'Collaborator' : 'Người cộng tác')
                  : a.kind === 'sublabel' ? (HT.lang === 'en' ? 'Sub-label' : 'Label con')
                  : a.role === 'label' ? 'Label'
                  : a.kind === 'artist-indie' ? (HT.lang === 'en' ? 'Independent artist' : 'Nghệ sĩ độc lập')
                  : (HT.lang === 'en' ? 'Artist' : 'Nghệ sĩ') };
    }),
    /* Chữ lấy từ haustek-cua.js — cùng nguồn với hai trang thật. Chép tay
       lại ở đây là dựng lại đúng cái đã làm bản gói mất cửa ở vòng 26. */
    phai: Object.assign({}, HTCua.chu(HT.lang).doiTac, {
      the: ['Spotify', 'YouTube Music', 'TikTok', 'Apple Music', 'Zing MP3',
            'NhacCuaTui', 'Facebook', 'Amazon Music', 'Deezer', 'SoundCloud']
    }),
    them: oChonCua(HT.lang, '<p>' + HT.esc(HT.lang === 'vi'
      ? 'Bản gói một trang: đổi cổng để xem phía còn lại. Hệ thật không có ô chọn này.'
      : 'Single-page bundle: switch door to see the other side. The real system has no such control.') + '</p>'),
    xong: function (dt) {
      toi = { role: dt.role, partyId: dt.partyId, name: dt.ten, email: dt.email };
      dungCong();
    }
  });

  function dungCong() {
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
  /* Ghi một dòng nhật ký đăng nhập trước khi dựng phiên — y như khach.html. */
  try { api.moPhien(phienCua.role, phienCua.partyId); } catch (e) {}
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
      var vai = toi.role === 'nhan' ? (vi ? 'Người cộng tác' : 'Collaborator')
        : toi.role !== 'label'
        ? (me.independent ? (vi ? 'Nghệ sĩ độc lập' : 'Independent artist') : (vi ? 'Nghệ sĩ' : 'Artist'))
        : me.parentLabel ? (vi ? 'Label con của ' + me.parentLabel.name : 'Sub-label of ' + me.parentLabel.name)
        : me.childLabels > 0 ? (vi ? 'Label mẹ · ' + me.childLabels + ' label con' : 'Parent label · ' + me.childLabels + ' sub-labels')
        : 'Label';
      /* Ô chọn tài khoản đã đi cùng vòng 25: ai đang vào là do CỬA quyết
         định. Còn lại đúng một ô chọn — ô chọn CỔNG — và nó là thứ riêng
         của bản gói một trang, không phải của sản phẩm. */
      return '<b>' + HT.esc(me.name) + '</b><span>' + HT.esc(vai) + '</span>' +
        (thay ? '<span style="display:block;margin-top:3px">' + HT.esc(vi ? 'đăng nhập: ' + toi.name : 'signed in as ' + toi.name) + '</span>' : '') +
        '<span style="display:block;margin-top:2px" class="mono">' + HT.esc(toi.email) + '</span>' +
        '<button type="button" class="btn sm ghost" data-ra style="margin-top:9px;width:100%">' +
        HT.esc(vi ? 'Đăng xuất' : 'Sign out') + '</button>' +
        oChonCua(c.lang, '<p>' + HT.esc(vi
          ? 'Bản gói một trang: đổi cổng để xem phía còn lại. Hệ thống thật không có ô chọn này.'
          : 'Single-page bundle: switch door to see the other side. The real system has no such control.') + '</p>');
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-ra]')) return;
    HTCua.raKhoi('portal');
    xoaXem();
    location.hash = '';
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
  }   /* hết dungCong() — cổng đối tác */

} else {
  MAN_NOIBO.forEach(function (f) { f(); });
  var A = HAUSTEK.admin;
  A.provideSecrets({
    code: 'DIST-1',
    name: 'Đối tác phân phối chính (tên thật điền khi triển khai)',
    grossRate: 0.86,
    contact: 'nội bộ · không hiển thị cho đối tác'
  });
  HT.setFx(A.fx.get().rate);

  /* Cửa nội bộ — y như intranet.html, cộng ô chọn cổng riêng của bản gói. */
  HTCua.mo({
    ten: 'internal',
    tieuDe: HT.lang === 'en' ? 'Haustek internal' : 'Cổng nội bộ Haustek',
    phu: HT.lang === 'en'
      ? 'Your desk, your department queue, and what you are allowed to approve.'
      : 'Bàn làm việc của bạn, hàng đợi của bộ phận, và những gì bạn được duyệt.',
    dangNhap: function (email) { return A.staff.dangNhapBang(email); },
    mau: A.staff.list().filter(function (s) { return s.active !== false; }).map(function (s) {
      return { email: s.email, ten: s.name, phu: HT.lang === 'en' ? s.titleEn : s.title };
    }),
    /* Chữ lấy từ haustek-cua.js — cùng nguồn với hai trang thật. */
    phai: Object.assign({}, HTCua.chu(HT.lang).noiBo, {
      so: [
        { n: HT.fmt.n(A.counts.tracks),  s: HT.lang === 'en' ? 'tracks' : 'bài hát' },
        { n: HT.fmt.n(A.counts.artists), s: HT.lang === 'en' ? 'artists' : 'nghệ sĩ' },
        { n: HT.fmt.n(A.counts.labels),  s: HT.lang === 'en' ? 'labels' : 'label' }
      ],
      the: A.stores.slice(0, 10)
    }),
    them: oChonCua(HT.lang, '<p>' + HT.esc(HT.lang === 'vi'
      ? 'Bản gói một trang: đổi cổng để xem phía còn lại. Hệ thật không có ô chọn này.'
      : 'Single-page bundle: switch door to see the other side. The real system has no such control.') + '</p>'),
    xong: function () { dungCong(); }
  });

  function dungCong() {
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
      /* Ô chọn nhân viên đã đi cùng vòng 25: vai đến từ tài khoản đã đăng
         nhập. Muốn xem bàn làm việc của vai khác thì đăng xuất rồi vào
         bằng tài khoản khác — đúng như hệ thật bắt phải làm. */
      return '<b>' + HT.esc(me.email) + '</b><span>' + HT.esc(c.lang === 'vi' ? me.title : me.titleEn) + '</span>' +
        '<button type="button" class="btn sm ghost" data-ra style="margin-top:9px;width:100%">' +
        HT.esc(c.lang === 'vi' ? 'Đăng xuất' : 'Sign out') + '</button>' +
        oChonCua(c.lang, '<p>' + HT.esc(c.lang === 'vi'
          ? 'Bản gói một trang: xét duyệt một kỳ ở đây rồi đổi sang cổng đối tác để xem kết quả. Hệ thật không có ô chọn này.'
          : 'Single-page bundle: approve a period here, then switch to the partner door to see the result. The real system has no such control.') + '</p>');
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-ra]')) return;
    HTCua.raKhoi('internal');
    location.hash = '';
    location.reload();
  });
  }   /* hết dungCong() — cổng nội bộ */
}

})();
</scr`+`ipt>`);

const html = PHAN.join('\n');
const ra = process.argv[2] || (__dirname + '/goi-mot-trang.html');
fs.writeFileSync(ra, html);
console.log(ra, '·', (html.length / 1024).toFixed(0), 'KB');
