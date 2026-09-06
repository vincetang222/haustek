/* =====================================================================
   CỔNG ĐỐI TÁC · THANH TOÁN
   ---------------------------------------------------------------------
   Đây là SỔ GHI những gì Haustek đã trả và trả khi nào. Không phải một
   cái ví.

   Không số dư khả dụng, không nút rút tiền, không dự báo, không cộng
   tổng qua các kỳ. Tiền đang chạy nằm ở tài khoản phân phối của bạn và
   ở đó nó luôn đúng; ở đây chỉ có con số ghi trên bảng kê đã ký, kèm
   ngày chuyển và tài khoản nhận.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };
function tien(b) {
  return (b.tienTe === 'VND' ? '' : '$') + Number(b.soTien).toLocaleString('vi-VN') + (b.tienTe === 'VND' ? ' ₫' : '');
}

HT.dangKy({
  id: 'k-thanh-toan', nav: 'Thanh toán', icon: 'cash',
  chu: { vi: { nav: 'Thanh toán' } },
  khaDung: function (c) { return !!(c.phien && c.phien.coTien); },
  ve: function (root, c) {
    var api = c.api, ph = c.phien;
    var d = api.thanhToan(ph.doiTacId);
    var bk = d.bangKe || [];
    var daChuyen = bk.filter(function (b) { return b.trangThai === 'da-chuyen'; });

    /* api.thanhToan KHÔNG trả ngày ứng: đó là chi tiết nội bộ. Viết
       api.ngayVi(t.ngayUng) ở đây thì trang hiện "ngày NaN tháng NaN"
       ngay trước mặt đối tác. Chỉ dùng đúng những trường lõi có trả. */
    var tamUng = (d.tamUng || []).map(function (t) {
      var pct = t.phanTram != null ? t.phanTram : (t.soTien ? Math.round(t.daHoan / t.soTien * 100) : 0);
      return HM.the({
        h2: 'Khoản tạm ứng',
        than: '<p style="font-size:14.5px;line-height:1.6">Đã hoàn <b>' + pct + '%</b> khoản tạm ứng ' +
          e('$' + Number(t.soTien).toLocaleString('vi-VN')) + '.</p>' +
          '<div style="max-width:420px;margin-top:8px">' + HM.thanh(t.daHoan, t.soTien, 'đã hoàn') + '</div>' +
          '<p class="say" style="margin-top:8px">' + e(t.ghiChu || 'Khoản này khấu trừ dần vào bảng kê các kỳ tới.') + '</p>'
      });
    }).join('');

    root.innerHTML = HM.dau({ h1: 'Thanh toán' }) +
      '<div class="tomtat">Trang này là sổ ghi những gì Haustek đã chuyển cho bạn và chuyển ngày nào. ' +
        'Số tiền lấy đúng từ bảng kê của bên phân phối, Haustek không tính lại. ' +
        'Số liệu đang chạy của kỳ này bạn xem thẳng ở tài khoản phân phối, nơi nó luôn mới nhất.</div>' +
      (bk.length
        ? HM.the({
            h2: bk.length + ' kỳ đã có bảng kê',
            p: 'Nhịp báo cáo của bạn: ' + (d.nhipBaoCao === 'thang' ? 'hằng tháng' : 'hằng quý') + '.',
            thoBody: true,
            than: '<div class="hang">' + bk.map(function (b) {
              return '<div class="d"><div class="c"><b>Kỳ ' + e(b.ky) + ' · ' + e(tien(b)) + '</b>' +
                '<span class="khi">' + e('theo bảng kê ' + b.nguon) +
                (b.ngayChuyen
                  ? e(' · đã chuyển ' + api.ngayVi(b.ngayChuyen) + ' vào ' + b.taiKhoanNhanMask)
                  : ' · Haustek đang làm thủ tục chuyển khoản') + '</span>' +
                (b.khauTruTamUng ? '<span class="khi">' + e('đã khấu trừ tạm ứng $' + b.khauTruTamUng + (b.ghiChuKhauTru ? ' · ' + b.ghiChuKhauTru : '')) + '</span>' : '') +
                '</div>' +
                '<div class="btnrow">' + (b.ngayChuyen ? HM.tag('đã chuyển', 'ok') : HM.tag('đang xử lý', '')) + '</div></div>';
            }).join('') + '</div>'
          })
        : HM.the({ thoBody: true, than: HM.trong({
            tieuDe: 'Bảng kê đầu tiên của bạn sẽ hiện ở đây',
            moTa: 'Nhịp báo cáo của bạn là ' + (d.nhipBaoCao === 'thang' ? 'hằng tháng' : 'hằng quý') +
              '. Ngay khi bên phân phối gửi báo cáo kỳ tới, Haustek đưa bảng kê lên đây kèm ngày chuyển khoản.' }) })) +
      tamUng +
      HM.the({ h2: 'Tài khoản nhận tiền', than: d.nganHang
        ? HM.kv([{ t: 'Ngân hàng', v: d.nganHang.nganHang },
                 { t: 'Chủ tài khoản', v: d.nganHang.chuTaiKhoan },
                 { t: 'Số tài khoản', v: d.nganHang.soTaiKhoanMask }]) +
          '<p class="say" style="margin-top:10px">Cần đổi tài khoản, bạn nhắn cho người phụ trách để Haustek cập nhật.</p>'
        : '<p style="font-size:14px;line-height:1.6">Thêm tài khoản nhận tiền để Haustek chuyển được. ' +
          'Bạn nhắn số tài khoản cho người phụ trách, hoặc gửi một yêu cầu ở mục Việc của tôi.</p>' });
  }
});

})();
