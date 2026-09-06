/* =====================================================================
   CỔNG ĐỐI TÁC · NHẠC CỦA TÔI
   ---------------------------------------------------------------------
   Danh mục bản phát hành và bài hát, tồn tại độc lập với việc: nhạc đã
   lên nền tảng ba năm trước vẫn nằm ở đây dù không còn việc nào mở.

   KHÔNG có lượt nghe, không doanh thu, không biểu đồ. Những con số đó
   nằm ở Spotify for Artists, ở OneRPM, ở YouTube Studio, và ở đó chúng
   luôn đúng. Chép về đây là tạo ra bản thứ hai của cùng một con số, và
   bản thứ hai bao giờ cũng cũ hơn bản gốc.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };
var NEN_TANG = [
  { k: 'spotify', ten: 'Spotify' },
  { k: 'apple',   ten: 'Apple Music' },
  { k: 'youtube', ten: 'YouTube Music' }
];

HT.dangKy({
  id: 'k-nhac', nav: 'Nhạc của tôi', icon: 'disc',
  chu: { vi: { nav: 'Nhạc của tôi' } },
  /* Chỉ hiện cho đối tác thật sự có nhạc. Một thương hiệu chỉ chạy chiến
     dịch digital mà thấy trang này trống trơn thì tưởng phần mềm hỏng. */
  khaDung: function (c) { return !!(c.phien && c.phien.coNhac); },
  ve: function (root, c) {
    var api = c.api, ph = c.phien;
    var ds = api.nhac(ph.doiTacId);
    var daLen = ds.filter(function (b) { return b.nenTang === 'da-len'; }).length;
    var soTrack = ds.reduce(function (s, b) { return s + (b.soTrack || 0); }, 0);

    /* Danh sách GỌN, mở từng bản một. Đổ cả bốn mươi bản phát hành kèm
       toàn bộ track ra một trang thì trang dài mười nghìn điểm ảnh, và
       người muốn tìm một bài phải cuộn qua ba mươi chín bản không liên
       quan. Mở cái đang cần, đóng phần còn lại. */
    var mo = c.loc.mo || '';
    var st = HM.nho(null, 'k-nhac.trang', function () { return { trang: 0 }; });
    var tr = HM.phanTrang(ds, st, 12);

    var dong = tr.page.map(function (b) {
      var dangMo = b.id === mo;
      var link = NEN_TANG.filter(function (n) { return b.duongDan && b.duongDan[n.k]; }).map(function (n) {
        return '<a href="' + e(b.duongDan[n.k]) + '" target="_blank" rel="noopener">' + HM.icon('out') +
          '<span>Nghe trên ' + e(n.ten) + '</span></a>';
      }).join('');
      var track = dangMo ? (b.track || []).map(function (t) {
        return '<div class="d" style="padding:6px 0;border-top:1px solid var(--line)">' +
          '<div class="c">' + t.thuTu + '. ' + e(t.ten) +
          (t.featuring ? ' <span class="khi">feat. ' + e(t.featuring) + '</span>' : '') +
          '<span class="khi">' + (t.isrc ? 'ISRC ' + e(t.isrc) : 'chưa cấp ISRC') + '</span></div></div>';
      }).join('') : '';

      return '<div class="d" style="align-items:flex-start;flex-wrap:wrap">' +
        '<div class="c"><b>' + e(b.ten) + '</b> ' +
          (b.nenTang === 'da-len' ? HM.tag(b.nenTangTen, 'ok') : HM.tag(b.nenTangTen, '')) +
          '<span class="khi">' + e(({ single: 'Single', ep: 'EP', album: 'Album' }[b.loai] || b.loai) +
            ' · ' + b.soTrack + ' bài · phát hành ' + api.ngayVi(b.ngayPhatHanh) +
            (b.upc ? ' · UPC ' + b.upc : '')) + '</span>' +
          (b.nenTang !== 'da-len' && b.nenTangCau ? '<span class="khi">' + e(b.nenTangCau) + '</span>' : '') +
          ((b.canBoSung || []).length ? '<span class="khi">Haustek đang chờ bạn: ' + e(b.canBoSung.join(', ')) + '.</span>' : '') +
          (dangMo
            ? (link ? '<div class="ngoai" style="margin-top:10px">' + link + '</div>' : '') +
              '<div style="margin-top:8px">' + track + '</div>' +
              '<div class="khi" style="margin-top:8px">Mã hồ sơ ' + e(b.id) + '</div>'
            : '') +
        '</div>' +
        '<div class="btnrow">' +
          ((b.canBoSung || []).length
            ? '<button type="button" class="btn pri sm" data-di="k-viec" data-loc-id="' + e(b.id) + '">Mở việc</button>'
            : b.nenTang !== 'da-len'
              ? '<button type="button" class="btn sm" data-hoi="' + e(b.id) + '">Hỏi Haustek</button>' : '') +
          '<button type="button" class="btn sm" data-mo="' + e(dangMo ? '' : b.id) + '">' +
            (dangMo ? 'Thu gọn' : 'Xem bài hát') + '</button>' +
        '</div></div>';
    }).join('');

    root.innerHTML = HM.dau({ h1: 'Nhạc của tôi' }) +
      '<div class="tomtat">Bạn có <b>' + ds.length + ' bản phát hành</b> và ' + soTrack + ' bài hát ở đây' +
        (daLen ? ', trong đó ' + daLen + ' bản đã lên nền tảng' : '') + '. ' +
        'Lượt nghe và doanh thu bạn xem thẳng trên Spotify for Artists, YouTube Studio hoặc tài khoản phân phối, ' +
        'nơi số liệu luôn là mới nhất.</div>' +
      (ds.length
        ? HM.the({ thoBody: true, than: '<div class="hang">' + dong + '</div>' + tr.chan })
        : HM.trong({
            tieuDe: 'Nhạc của bạn sẽ hiện ở đây',
            moTa: 'Ngay khi bản phát hành đầu tiên được gửi lên, bạn thấy nó ở trang này kèm mã ISRC và đường dẫn nghe.' }));

    HM.bam(root, '[data-mo]', function (el) { c.datLoc({ mo: el.getAttribute('data-mo') }); });
    HM.ganTrang(root, st, c.veLai);

    HM.bam(root, '[data-hoi]', function (el) {
      var ma = el.getAttribute('data-hoi');
      var b = ds.filter(function (x) { return x.id === ma; })[0];
      HM.hoiForm(c, {
        tieuDe: 'Hỏi về ' + (b ? b.ten : ma),
        moTa: 'Câu hỏi của bạn tới thẳng người phụ trách.',
        fields: [
          { k: 'tieuDe', l: 'Bạn muốn hỏi gì', req: true, rong: true, v: 'Hỏi tiến độ ' + (b ? b.ten : ma) },
          { k: 'noiDung', l: 'Nội dung', kieu: 'textarea', rows: 4, req: true, rong: true }
        ]
      }).then(function (f) {
        if (!f) return;
        try {
          var kq = api.guiYeuCau(ph.doiTacId, { dichVu: 'ho-tro', tieuDe: f.tieuDe, noiDung: f.noiDung + '\n\nMã hồ sơ: ' + ma });
          c.thongBao(kq.bienNhan, 'ok');
        } catch (err) { c.thongBao('Chưa gửi được. Bạn gọi thẳng người phụ trách giúp.', 'warn'); }
      });
    });
  }
});

})();
