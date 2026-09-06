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

    /* api.taiKhoan trả dịch vụ dưới dạng { id, vi }, không phải mảng mã.
       Đọc nhầm thì cả thẻ cam kết biến mất mà không báo lỗi gì. */
    var camKet = (d.dichVu || []).map(function (dv) {
      if (!dv || !dv.id) return '';
      return '<div class="d" style="padding:10px 0;border-top:1px solid var(--line)">' +
        '<div class="c"><b>' + e(dv.vi) + '</b><span class="khi">' + e(api.camKet(dv.id)) + '</span></div></div>';
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
          { t: 'Thời hạn', v: api.ngayVi(d.hopDong.tuNgay) + ' đến ' + api.ngayVi(d.hopDong.denNgay) },
          { t: 'Còn lại', v: (function () {
              var n = Math.round((new Date(d.hopDong.denNgay) - new Date(api.homNay())) / 86400000);
              return n < 0 ? 'đã hết hạn' : n + ' ngày'; })() },
          { t: 'Nhịp bảng kê', v: d.hopDong.nhipBaoCao === 'thang' ? 'hằng tháng' : 'hằng quý' }
        ]) }) +
        (d.nganHang ? HM.the({ h2: 'Tài khoản nhận tiền', than: HM.kv([
          { t: 'Ngân hàng', v: d.nganHang.nganHang },
          { t: 'Chủ tài khoản', v: d.nganHang.chuTaiKhoan },
          { t: 'Số tài khoản', v: d.nganHang.soTaiKhoanMask }
        ]) + '<p class="say" style="margin-top:10px">Cần đổi tài khoản, bạn nhắn cho ' +
          e(ns ? ns.ten : 'người phụ trách') + '.</p>' }) : '') +
        ((d.nghesiThuocLabel || []).length ? HM.the({ h2: 'Nghệ sĩ thuộc quản lý', thoBody: true,
          than: '<div class="card-b" style="padding-top:2px">' + d.nghesiThuocLabel.map(function (a) {
            return '<div class="d" style="padding:8px 0;border-top:1px solid var(--line)"><div class="c">' +
              e(a && a.ten ? a.ten : a) + '</div></div>';
          }).join('') + '</div>' }) : '') +
      '</div></div>';
  }
});

})();
