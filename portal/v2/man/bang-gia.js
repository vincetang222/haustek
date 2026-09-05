/* =====================================================================
   NỘI BỘ · BẢNG GIÁ NỀN TẢNG
   ---------------------------------------------------------------------
   Nhóm giá (price tier) của các nền tảng bán tải về: chọn một nhóm thì
   thấy giá album và giá track theo từng nền tảng và tiền tệ. Nền tảng
   streaming không dùng giá; bảng này chỉ áp cho iTunes, Amazon, Beatport,
   7digital, Qobuz, Bandcamp. Muốn đổi nhóm giá cho nhiều bản phát hành
   thì sang Sửa hàng loạt (đổi giá album / đổi giá track theo UPC).
   Số liệu là bảng giá mẫu để thấy hình dạng; hệ thống thật lấy từ hợp
   đồng với từng nền tảng.
   ===================================================================== */
"use strict";
(function () {

var LOC = { nhom: 'front', loai: 'album' };
var NHOM = [
  { id: 'front',  ten: 'Front · mới phát hành', en: 'Front · new release', mo: 'Áp dụng cho bản phát hành mới trong 6 tháng đầu.', moEn: 'For new releases in their first 6 months.',
    album: { USD: 9.99, EUR: 9.99, GBP: 7.99, JPY: 1528, VND: 149000, BRL: 34.9, AUD: 16.99 }, track: { USD: 1.29, EUR: 1.29, GBP: 0.99, JPY: 255, VND: 19000, BRL: 3.9, AUD: 2.19 } },
  { id: 'mid',    ten: 'Mid · phổ thông', en: 'Mid · standard', mo: 'Mức mặc định cho phần lớn danh mục.', moEn: 'Default tier for most of the catalogue.',
    album: { USD: 7.99, EUR: 7.99, GBP: 6.99, JPY: 1222, VND: 119000, BRL: 27.9, AUD: 13.99 }, track: { USD: 0.99, EUR: 0.99, GBP: 0.79, JPY: 204, VND: 15000, BRL: 2.9, AUD: 1.69 } },
  { id: 'back',   ten: 'Back · catalog cũ', en: 'Back · deep catalogue', mo: 'Bản phát hành trên 2 năm, bán theo giá thấp để giữ doanh số.', moEn: 'Releases older than 2 years, priced low to keep sales moving.',
    album: { USD: 5.99, EUR: 5.99, GBP: 4.99, JPY: 917, VND: 89000, BRL: 20.9, AUD: 10.99 }, track: { USD: 0.69, EUR: 0.69, GBP: 0.59, JPY: 153, VND: 12000, BRL: 1.9, AUD: 1.19 } },
  { id: 'budget', ten: 'Budget · khuyến mại', en: 'Budget · promotion', mo: 'Đợt khuyến mại ngắn hạn, cần vận hành bật và tắt bằng tay.', moEn: 'Short promotions, switched on and off by operations.',
    album: { USD: 3.99, EUR: 3.99, GBP: 3.49, JPY: 611, VND: 59000, BRL: 13.9, AUD: 6.99 }, track: { USD: 0.49, EUR: 0.49, GBP: 0.39, JPY: 102, VND: 9000, BRL: 1.4, AUD: 0.89 } }
];
var NEN_TANG = [
  { n: 'iTunes / Apple Music', tien: ['USD', 'EUR', 'GBP', 'JPY', 'VND', 'BRL', 'AUD'] },
  { n: 'Amazon Music', tien: ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'AUD'] },
  { n: 'Beatport', tien: ['USD', 'EUR', 'GBP'] },
  { n: '7digital', tien: ['USD', 'EUR', 'GBP', 'AUD'] },
  { n: 'Qobuz', tien: ['USD', 'EUR', 'GBP'] },
  { n: 'Bandcamp', tien: ['USD', 'EUR', 'GBP', 'AUD'] }
];
var TIEN = ['USD', 'EUR', 'GBP', 'JPY', 'VND', 'BRL', 'AUD'];
function dinhGia(v, tt) {
  if (v == null) return null;
  if (tt === 'VND') return HT.fmt.n(v) + ' ₫';
  if (tt === 'JPY') return '¥' + HT.fmt.n(v);
  var ky = { USD: '$', EUR: '€', GBP: '£', BRL: 'R$', AUD: 'A$' }[tt] || (tt + ' ');
  return ky + v.toFixed(2);
}

HT.dangKy({
  id: 'bang-gia', nav: 'navBangGia', nhom: 'nhomVanHanh', icon: 'cash',
  vai: ['ops', 'mgmt', 'accounting'],

  chu: {
    vi: {
      navBangGia: 'Bảng giá nền tảng', h1: 'Bảng giá nền tảng',
      mo: 'Nhóm giá của các nền tảng bán tải về. Chọn một nhóm để xem giá album và giá track theo từng nền tảng và tiền tệ. Nền tảng streaming không dùng giá.',
      chonNhom: 'Chọn nhóm giá', album: 'Giá album', track: 'Giá track',
      cNt: 'Nền tảng', khongBan: 'không bán', apDung: 'Áp dụng nhóm giá cho UPC', apDungMo: 'Sang trang Sửa hàng loạt, chọn đổi giá album hoặc đổi giá track và dán danh sách UPC.',
      soNt: 'Nền tảng bán tải về', soTien: 'Tiền tệ', nhomHienTai: 'Nhóm đang xem',
      ghiChu: 'Bảng giá mẫu để thấy hình dạng. Hệ thống thật lấy giá từ hợp đồng với từng nền tảng và có lịch sử thay đổi theo ngày hiệu lực.',
      soSanh: 'So sánh bốn nhóm giá', soSanhMo: 'Giá bằng USD của từng nhóm. Hai thước đo khác cỡ nên vẽ hai biểu đồ, không chồng lên nhau.'
    },
    en: {
      navBangGia: 'Store pricing', h1: 'Store pricing',
      mo: 'Price tiers on download stores. Pick a tier to see album and track prices per store and currency. Streaming platforms do not use prices.',
      chonNhom: 'Pick a price tier', album: 'Album price', track: 'Track price',
      cNt: 'Store', khongBan: 'not sold', apDung: 'Apply tier to UPCs', apDungMo: 'Go to Bulk edit, choose album price or track price and paste the UPC list.',
      soNt: 'Download stores', soTien: 'Currencies', nhomHienTai: 'Tier shown',
      ghiChu: 'Sample price grid to show the shape. The real system takes prices from each store agreement, with a dated change history.',
      soSanh: 'Compare the four tiers', soSanhMo: 'USD prices per tier. Two measures of different size, so two charts rather than one stacked bar.'
    }
  },

  ve: function (root, c) {
    var t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
    var nhom = NHOM.filter(function (x) { return x.id === LOC.nhom; })[0] || NHOM[0];
    var gia = nhom[LOC.loai];
    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [{ l: t('soNt'), v: HT.fmt.n(NEN_TANG.length) }, { l: t('soTien'), v: HT.fmt.n(TIEN.length) }, { l: t('nhomHienTai'), v: vi ? nhom.ten : nhom.en }]
    });
    html += '<div class="bar">' +
      '<span class="muted" style="font-size:13px">' + HM.esc(t('chonNhom')) + '</span>' +
      NHOM.map(function (x) { return '<button type="button" class="pill' + (LOC.nhom === x.id ? ' on' : '') + '" data-nhom="' + x.id + '">' + HM.esc(vi ? x.ten : x.en) + '</button>'; }).join('') +
      '<div class="sp"></div>' +
      [['album', t('album')], ['track', t('track')]].map(function (x) { return '<button type="button" class="pill' + (LOC.loai === x[0] ? ' on' : '') + '" data-loai="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
      '<button type="button" class="btn sm pri" data-di="sua-hang-loat">' + HM.icon('list') + HM.esc(t('apDung')) + '</button></div>';

    html += HM.the({
      h2: HM.esc((vi ? nhom.ten : nhom.en) + ' · ' + t(LOC.loai)), p: HM.esc(vi ? nhom.mo : nhom.moEn),
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cNt')) + '</th>' + TIEN.map(function (tt) { return '<th class="num">' + tt + '</th>'; }).join('') + '</tr></thead><tbody>' +
        NEN_TANG.map(function (nt) {
          return '<tr><td><div class="t-ttl">' + HM.esc(nt.n) + '</div><div class="t-sub" style="font-family:var(--f)">' + nt.tien.length + ' ' + HM.esc(t('soTien').toLowerCase()) + '</div></td>' +
            TIEN.map(function (tt) { return '<td class="num">' + (nt.tien.indexOf(tt) >= 0 ? '<b>' + HM.esc(dinhGia(gia[tt], tt)) + '</b>' : '<span class="nil">' + HM.esc(t('khongBan')) + '</span>') + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>',
      chan: HM.esc(t('apDungMo') + ' ' + t('ghiChu'))
    });

    html += HM.the({
      h2: HM.esc(t('soSanh')), p: HM.esc(t('soSanhMo')),
      than: '<div class="grid g2">' + [['album', P[0]], ['track', P[1]]].map(function (k) {
        return '<div><h4 class="sec">' + HM.esc(t(k[0])) + ' · USD</h4>' +
          HB.o({ loai: 'cot', cao: 180, dinhDang: function (v) { return '$' + Number(v).toFixed(2); }, hienGiaTri: true, truc: NHOM.map(function (x) { return x.id.charAt(0).toUpperCase() + x.id.slice(1); }),
            tieuDeTip: function (i) { return vi ? NHOM[i].ten : NHOM[i].en; },
            chuoi: [{ ten: t(k[0]), gt: NHOM.map(function (x) { return x[k[0]].USD; }), mau: k[1] }] }) + '</div>';
      }).join('') + '</div>'
    });

    root.innerHTML = html;
    HB.gan(root);
    HM.bam(root, '[data-nhom]', function (el) { LOC.nhom = el.getAttribute('data-nhom'); c.veLai(); });
    HM.bam(root, '[data-loai]', function (el) { LOC.loai = el.getAttribute('data-loai'); c.veLai(); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
  }
});

})();
