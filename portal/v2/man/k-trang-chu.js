/* =====================================================================
   CỔNG ĐỐI TÁC · TRANG CHỦ
   ---------------------------------------------------------------------
   Ba câu trả lời trong mười giây, đúng thứ tự này:
     1. Haustek cần gì ở bạn
     2. Haustek đang làm gì cho bạn
     3. bao giờ có tiền (chỉ khi đối tác mua dịch vụ có tiền về)

   Trang này là thứ khách hàng nhìn, nên giọng ở đây quan trọng hơn mọi
   trang khác trong phần mềm. Không màu đỏ, không đếm ngược, không một con
   số nào đối tác không làm gì được với nó.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };

HT.dangKy({
  id: 'k-trang-chu', nav: 'Trang chủ', icon: 'home',
  chu: { vi: { nav: 'Trang chủ' } },
  ve: function (root, c) {
    var api = c.api, ph = c.phien, id = ph.doiTacId;
    var d = api.trangChu(id);
    var ns = ph.nguoiPhuTrach;

    /* Lời chào có TÊN MỘT NGƯỜI và một số điện thoại. Đây là câu trả lời
       theo nghĩa đen cho "có ai đang làm việc của tôi không". */
    var chao = '<div class="tomtat">Chào ' + e(ph.ten) + '. ' +
      (ns ? 'Người phụ trách của bạn ở Haustek là <b>' + e(ns.ten) + '</b> · ' +
        '<a href="tel:' + e(ns.dienThoai) + '">' + e(ns.dienThoai) + '</a>. ' : '') +
      (d.canBan.length
        ? 'Haustek đang chờ bạn ' + d.canBan.length + ' việc, xem ngay bên dưới.'
        : d.dangLam.length
          ? 'Haustek đang làm ' + d.dangLam.length + ' việc cho bạn, không cần bạn làm gì lúc này.'
          : 'Hiện không có việc nào đang chạy.') +
      '</div>';

    /* ---- 1 · cần bạn ---- */
    var canBan = d.canBan.length
      ? HM.the({
          h2: 'Haustek đang chờ bạn',
          p: 'Mỗi dòng là một việc bạn làm xong thì Haustek đi tiếp được ngay.',
          thoBody: true,
          than: '<div class="hang">' + d.canBan.map(function (x, i) {
            return '<div class="d"><div class="n">' + (i + 1) + '</div>' +
              '<div class="c"><b>' + e(x.viec) + '</b> · ' + e(x.tieuDe) +
              '<span class="khi">' + e('Mong nhận trước ' + (x.han ? api.ngayVi(x.han) : 'khi bạn tiện')) + '</span></div>' +
              '<div class="btnrow"><button type="button" class="btn pri sm" data-di="k-viec" data-loc-id="' + e(x.viecId) + '">Mở việc</button></div>' +
              '</div>';
          }).join('') + '</div>'
        })
      : HM.the({ h2: 'Haustek đang chờ bạn', thoBody: true,
          than: HM.trong({ xong: true, tieuDe: 'Không có gì cần bạn lúc này.',
            moTa: 'Haustek sẽ nhắn khi cần bạn gửi hoặc duyệt gì đó.',
            diem: [{ n: d.soViecXong, l: 'việc đã xong' }, { n: d.dangLam.length, l: 'việc đang chạy' }]
              .filter(function (x) { return x.n > 0; }) }) });

    /* ---- 2 · Haustek đang làm gì ---- */
    var dangLam = d.dangLam.length
      ? HM.the({
          h2: 'Haustek đang làm cho bạn',
          thoBody: true,
          than: '<div class="hang">' + d.dangLam.map(function (v) {
            return '<div class="d"><div class="c"><b>' + e(v.tieuDe) + '</b>' +
              '<span class="khi">' + e(v.dichVuTen + ' · ' +
                (v.nguoiPhuTrachTen || (ns ? ns.ten : 'Haustek')) + ' phụ trách') + '</span>' +
              '<span class="khi">' + e(v.buocTiep ? 'Bước tiếp: ' + v.buocTiep : (v.camKet || 'Đang chạy đúng tiến độ.')) + '</span></div>' +
              '<div class="btnrow"><button type="button" class="btn sm" data-di="k-viec" data-loc-id="' + e(v.id) + '">Xem</button></div></div>';
          }).join('') + '</div>'
        })
      : '';

    /* ---- 3 · bao giờ có tiền · chỉ khi có dịch vụ mang tiền về ---- */
    var tien = '';
    if (ph.coTien) {
      var bk = d.bangKeGanNhat;
      tien = HM.the({
        h2: 'Thanh toán',
        p: 'Số tiền là con số ghi trên bảng kê của bên phân phối, Haustek không tính lại.',
        than: bk
          ? '<p style="font-size:14.5px;line-height:1.6">Bảng kê gần nhất là kỳ <b>' + e(bk.ky) + '</b>, ' +
            '<b>' + e(soTien(bk)) + '</b> theo bảng kê ' + e(bk.nguon) + '. ' +
            (bk.ngayChuyen ? 'Đã chuyển vào tài khoản ' + e(bk.taiKhoanNhanMask) + ' ngày ' + e(api.ngayVi(bk.ngayChuyen)) + '.'
                           : 'Haustek đang làm thủ tục chuyển khoản.') + '</p>'
          : '<p style="font-size:14.5px;line-height:1.6">Bảng kê đầu tiên của bạn sẽ có ở đây khi bên phân phối gửi báo cáo kỳ tới.</p>',
        chan: '<div class="sp"></div><div class="btnrow"><button type="button" class="btn" data-di="k-thanh-toan">Xem tất cả bảng kê</button></div>'
      });
    }

    /* ---- hồ sơ đang chờ nền tảng ---- */
    var ph2 = (d.banPhatHanhDangXuLy || []).length
      ? HM.the({ h2: 'Bản phát hành đang xử lý', thoBody: true,
          than: '<div class="hang">' + d.banPhatHanhDangXuLy.map(function (b) {
            return '<div class="d"><div class="c"><b>' + e(b.ten) + '</b>' +
              '<span class="khi">' + e(b.nenTangCau || b.nenTangTen) + '</span></div>' +
              '<div class="btnrow"><button type="button" class="btn sm" data-di="k-nhac">Xem</button></div></div>';
          }).join('') + '</div>' })
      : '';

    root.innerHTML = HM.dau({ h1: 'Trang chủ' }) + chao + canBan + dangLam + ph2 + tien;
  }
});

function soTien(bk) {
  return (bk.tienTe === 'VND' ? '' : '$') + Number(bk.soTien).toLocaleString('vi-VN') + (bk.tienTe === 'VND' ? ' ₫' : '');
}

})();
