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

  chu: {
    vi: {
      themGia: 'Thêm dòng giá', giaTay: 'Giá nhập tay', giaTayMo: 'Giá do vận hành nhập, đè lên bảng mẫu ở đúng ô nền tảng · nhóm · tiền tệ.', fLoaiGia: 'Áp cho', fGia: 'Giá', fHieuLuc: 'Hiệu lực từ', daThemGia: 'Đã lưu dòng giá', nhapTay: 'Giá nhập tay', xoa: 'Xoá',
      navBangGia: 'Bảng giá nền tảng', h1: 'Bảng giá nền tảng',
      mo: 'Nhóm giá album và track của các nền tảng bán tải về, theo từng nền tảng và tiền tệ.',
      chonNhom: 'Chọn nhóm giá', album: 'Giá album', track: 'Giá track',
      cNt: 'Nền tảng', khongBan: 'không bán', apDung: 'Áp dụng nhóm giá cho UPC', apDungMo: 'Sang trang Sửa hàng loạt, chọn đổi giá album hoặc đổi giá track và dán danh sách UPC.',
      soNt: 'Nền tảng bán tải về', soTien: 'Tiền tệ', nhomHienTai: 'Nhóm đang xem',
      ghiChu: 'Bảng giá mẫu. Hệ thống thật lấy giá từ hợp đồng với từng nền tảng, có lịch sử theo ngày hiệu lực.',
      soSanh: 'So sánh bốn nhóm giá', soSanhMo: 'Giá bằng USD của từng nhóm. Hai thước đo khác cỡ nên vẽ hai biểu đồ, không chồng lên nhau.'
    },
    en: {
      themGia: 'Add a price row', giaTay: 'Prices entered by hand', giaTayMo: 'Entered by operations; overrides the sample grid for that store · tier · currency.', fLoaiGia: 'Applies to', fGia: 'Price', fHieuLuc: 'Effective from', daThemGia: 'Price row saved', nhapTay: 'Entered by hand', xoa: 'Remove',
      navBangGia: 'Store pricing', h1: 'Store pricing',
      mo: 'Album and track price tiers on download stores, per store and currency.',
      chonNhom: 'Pick a price tier', album: 'Album price', track: 'Track price',
      cNt: 'Store', khongBan: 'not sold', apDung: 'Apply tier to UPCs', apDungMo: 'Go to Bulk edit, choose album price or track price and paste the UPC list.',
      soNt: 'Download stores', soTien: 'Currencies', nhomHienTai: 'Tier shown',
      ghiChu: 'Sample grid. The real system takes prices from each store agreement, with a dated history.',
      soSanh: 'Compare the four tiers', soSanhMo: 'USD prices per tier. Two measures of different size, so two charts rather than one stacked bar.'
    }
  },

  ve: function (root, c) {
    var t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
    var nhom = NHOM.filter(function (x) { return x.id === LOC.nhom; })[0] || NHOM[0];
    var gia = nhom[LOC.loai], A = c.A;
    var them = A.pricing.list();
    var giaThem = function (nt, tt) { var x = them.filter(function (y) { return y.store === nt && y.tier === nhom.id && y.currency === tt && y.kind === LOC.loai; })[0]; return x ? x.price : null; };
    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: A.quyen.nhom('vanHanh') ? '<button type="button" class="btn pri" data-them-gia>' + HM.icon('cash') + HM.esc(t('themGia')) + '</button>' : '',
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
            TIEN.map(function (tt) { var g2 = giaThem(nt.n, tt); return '<td class="num">' + (g2 != null ? '<b class="pos" title="' + HM.esc(t('nhapTay')) + '">' + HM.esc(dinhGia(g2, tt)) + '</b>' : nt.tien.indexOf(tt) >= 0 ? '<b>' + HM.esc(dinhGia(gia[tt], tt)) + '</b>' : '<span class="nil">' + HM.esc(t('khongBan')) + '</span>') + '</td>'; }).join('') + '</tr>';
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

    if (them.length) html += HM.the({ h2: HM.esc(t('giaTay')) + ' <span class="muted">(' + them.length + ')</span>', p: HM.esc(t('giaTayMo')), thoBody: true,
      than: '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + HM.esc(t('cNt')) + '</th><th>' + HM.esc(t('chonNhom')) + '</th><th>' + HM.esc(t('fLoaiGia')) + '</th><th class="num">' + HM.esc(t('fGia')) + '</th><th>' + HM.esc(t('fHieuLuc')) + '</th><th></th></tr></thead><tbody>' +
        them.map(function (x) { var nh = NHOM.filter(function (y) { return y.id === x.tier; })[0]; return '<tr><td>' + HM.esc(x.store) + '</td><td>' + HM.esc(nh ? (vi ? nh.ten : nh.en) : x.tier) + '</td><td>' + HM.esc(t(x.kind)) + '</td><td class="num"><b>' + HM.esc(dinhGia(x.price, x.currency)) + '</b></td><td class="mono">' + HM.esc(HT.fmt.ngay(x.effective)) + '</td><td>' + (A.quyen.nhom('vanHanh') ? '<button type="button" class="btn sm ghost" data-xoa-gia="' + HM.esc([x.store, x.tier, x.currency, x.kind].join('|')) + '">' + HM.esc(t('xoa')) + '</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' });
    root.innerHTML = html;
    HB.gan(root);
    HM.bam(root, '[data-them-gia]', function () {
      HTM.hoiForm(c, { tieuDe: t('themGia'), dong: t('themGia'), fields: [
        { k: 'store', l: t('cNt'), kieu: 'select', opts: NEN_TANG.map(function (x) { return [x.n, x.n]; }), kbb: false }, { k: 'tier', l: t('chonNhom'), kieu: 'select', opts: NHOM.map(function (x) { return [x.id, vi ? x.ten : x.en]; }), v: LOC.nhom, kbb: false },
        { k: 'kind', l: t('fLoaiGia'), kieu: 'select', opts: [['album', t('album')], ['track', t('track')]], v: LOC.loai, kbb: false }, { k: 'currency', l: t('soTien'), kieu: 'select', opts: TIEN.map(function (x) { return [x, x]; }), kbb: false },
        { k: 'price', l: t('fGia'), kieu: 'number', min: 0, step: 0.01, req: true }, { k: 'effective', l: t('fHieuLuc'), kieu: 'date', v: new Date().toISOString().slice(0, 10), kbb: false }
      ] }).then(function (f) {
        if (!f) return;
        try { A.pricing.add(f, A.staff.me.email); c.thongBao(t('daThemGia'), 'ok'); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); }
      });
    });
    HM.bam(root, '[data-xoa-gia]', function (el) { var p = el.getAttribute('data-xoa-gia').split('|'); try { A.pricing.remove({ store: p[0], tier: p[1], currency: p[2], kind: p[3] }, A.staff.me.email); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); } });
    HM.bam(root, '[data-nhom]', function (el) { LOC.nhom = el.getAttribute('data-nhom'); c.veLai(); });
    HM.bam(root, '[data-loai]', function (el) { LOC.loai = el.getAttribute('data-loai'); c.veLai(); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
  }
});

})();
