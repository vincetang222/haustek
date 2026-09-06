/* =====================================================================
   CỔNG ĐỐI TÁC · TÀI KHOẢN
   ---------------------------------------------------------------------
   Một trang tham chiếu ngắn, đọc như tấm danh thiếp chứ không như bảng
   cài đặt: ai là người của bạn ở Haustek, liên hệ của bạn đang lưu là
   ai, hợp đồng tới ngày nào, tiền về tài khoản nào.

   Có thêm phần cam kết phản hồi theo từng mảng dịch vụ, vì đây là chỗ
   đối tác kiểm tra được Haustek đã hứa những gì.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };

HT.dangKy({
  id: 'k-tai-khoan', nav: 'Tài khoản', icon: 'user',
  chu: { vi: { nav: 'Tài khoản' } },
  ve: function (root, c) {
    var api = c.api, ph = c.phien;
    var d = api.taiKhoan(ph.doiTacId);
    var ns = d.nguoiPhuTrach;

    var camKet = (d.dichVu || ph.dichVu || []).map(function (id) {
      var dv = api.dichVu().filter(function (x) { return x.id === id; })[0];
      if (!dv) return '';
      return '<div class="d" style="padding:10px 0;border-top:1px solid var(--line)">' +
        '<div class="c"><b>' + e(dv.vi) + '</b><span class="khi">' + e(api.camKet(id)) + '</span></div></div>';
    }).join('');

    root.innerHTML = HM.dau({ h1: 'Tài khoản' }) +
      '<div class="doi-2"><div>' +
        (ns ? HM.the({
          h2: 'Người của bạn ở Haustek',
          than: '<div style="display:flex;gap:14px;align-items:center">' + HM.bia(ns.ten, ns.ten, 'md') +
            '<div><b style="font-size:15.5px">' + e(ns.ten) + '</b>' +
            '<div class="say">' + e(ns.chucDanh) + '</div>' +
            '<div style="margin-top:6px;font-size:13.5px">' +
              '<a href="tel:' + e(ns.dienThoai) + '">' + e(ns.dienThoai) + '</a> · ' +
              '<a href="mailto:' + e(ns.email) + '">' + e(ns.email) + '</a></div></div></div>' +
            '<p class="say" style="margin-top:12px">Có gì cần, bạn gọi thẳng. Không phải qua tổng đài nào cả.</p>'
        }) : '') +
        HM.the({ h2: 'Liên hệ của bạn Haustek đang lưu',
          p: 'Haustek gọi và gửi tin theo đúng danh sách này.',
          thoBody: true,
          than: '<div class="card-b" style="padding-top:2px">' + (d.lienHe || []).map(function (x) {
            return '<div class="d" style="padding:10px 0;border-top:1px solid var(--line)">' +
              '<div class="c"><b>' + e(x.ten) + '</b>' + (x.laChinh ? ' ' + HM.tag('liên hệ chính', 'ok') : '') +
              '<span class="khi">' + e(x.vaiTro || '') + (x.gioTienGoi ? ' · tiện gọi ' + e(String(x.gioTienGoi).toLowerCase()) : '') + '</span>' +
              '<span class="khi">' + e(x.dienThoai) + (x.email ? ' · ' + e(x.email) : '') + '</span></div></div>';
          }).join('') +
          '<p class="say" style="margin-top:10px">Cần thêm hoặc bớt người, bạn nhắn cho ' +
            e(ns ? ns.ten : 'người phụ trách') + '.</p></div>' }) +
        (camKet ? HM.the({ h2: 'Haustek hứa gì với bạn',
          p: 'Cam kết phản hồi cho từng mảng dịch vụ bạn đang dùng.',
          thoBody: true, than: '<div class="card-b" style="padding-top:2px">' + camKet + '</div>' }) : '') +
      '</div><div>' +
        HM.the({ h2: 'Hợp đồng', than: HM.kv([
          ['Thời hạn', api.ngayVi(d.hopDong.tuNgay) + ' đến ' + api.ngayVi(d.hopDong.denNgay)],
          ['Nhịp bảng kê', d.hopDong.nhipBaoCao === 'thang' ? 'hằng tháng' : 'hằng quý']
        ]) }) +
        (d.nganHang ? HM.the({ h2: 'Tài khoản nhận tiền', than: HM.kv([
          ['Ngân hàng', d.nganHang.nganHang],
          ['Chủ tài khoản', d.nganHang.chuTaiKhoan],
          ['Số tài khoản', d.nganHang.soTaiKhoanMask]
        ]) }) : '') +
        ((d.ngheSi || []).length ? HM.the({ h2: 'Nghệ sĩ thuộc quản lý', thoBody: true,
          than: '<div class="card-b" style="padding-top:2px">' + d.ngheSi.map(function (a) {
            return '<div class="d" style="padding:8px 0;border-top:1px solid var(--line)"><div class="c">' + e(a.ten || a) + '</div></div>';
          }).join('') + '</div>' }) : '') +
      '</div></div>';
  }
});

})();
