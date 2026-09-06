/* =====================================================================
   CỔNG ĐỐI TÁC · TRAO ĐỔI
   ---------------------------------------------------------------------
   Một dòng duy nhất: tin nhắn hai chiều, thông báo Haustek gửi, tệp đã
   bàn giao, mốc đã qua. Cùng cách trình bày với dòng thời gian ở trang
   đối tác bên nội bộ, để hai phía của phần mềm trông như một phần mềm.

   Mọi dòng tới được đây đều đã có hienChoDoiTac = true từ trong lõi.
   Trang này không tự lọc thêm lần nữa: lọc hai nơi thì sớm muộn hai nơi
   lọc khác nhau, và chỗ lỏng hơn là chỗ rò.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };
var TEN_LOAI = { 'tin-nhan': 'Tin nhắn', 'thong-bao': 'Thông báo Haustek gửi',
  'trang-thai': 'Cập nhật', 'moc': 'Chặng đã qua', 'bang-ke': 'Bảng kê', 'tep': 'Tệp' };

HT.dangKy({
  id: 'k-trao-doi', nav: 'Trao đổi', icon: 'chat',
  chu: { vi: { nav: 'Trao đổi' } },
  dem: function (c) {
    try { return { n: (c.api.chuaDoc(c.phien.doiTacId, c.phien.nguoiDungId) || []).length, muc: 'thuong' }; }
    catch (e) { return null; }
  },
  ve: function (root, c) {
    var api = c.api, ph = c.phien;
    var ds = api.traoDoi(ph.doiTacId);
    var tep = api.taiLieu(ph.doiTacId);
    var chuaDoc = {};
    (api.chuaDoc(ph.doiTacId, ph.nguoiDungId) || []).forEach(function (x) { chuaDoc[x.thongBaoId] = true; });

    /* Mở ra 25 dòng. Đổ tám mươi dòng một lúc thì trang cao tám nghìn
       điểm ảnh và tin nhắn hôm nay nằm lẫn với lịch sử hai năm trước.
       Mười lăm dòng là vừa một màn hình rưỡi. */
    var soHien = +(c.loc.dong || 15);
    var ngayTruoc = '', ra = ['<div class="dt">'];
    ds.slice(0, soHien).forEach(function (x) {
      var ngay = String(x.luc).slice(0, 10);
      if (ngay !== ngayTruoc) {
        ngayTruoc = ngay;
        ra.push('<div class="ngay">' + e(ngay === api.homNay() ? 'Hôm nay' : api.thuTrongTuan(ngay) + ', ' + api.ngayVi(ngay)) + '</div>');
      }
      var cuaBan = x.boi && x.boi.kieu === 'nguoiDung';
      ra.push('<div class="m ta"' + (x.thongBaoId ? ' data-tb="' + e(x.thongBaoId) + '"' : '') + '>' +
        '<div class="h"><b>' + e(x.tieuDe) + '</b>' +
        '<time>' + e(api.gioVi(x.luc)) + '</time>' +
        '<span class="ai">' + e(cuaBan ? 'Bạn gửi' : (TEN_LOAI[x.loai] || '') + (x.boi && x.boi.ten ? ' · ' + x.boi.ten : '')) + '</span>' +
        (x.thongBaoId && chuaDoc[x.thongBaoId] ? HM.tag('mới', 'ok') : '') + '</div>' +
        (x.noiDung ? '<p>' + e(x.noiDung) + '</p>' : '') + '</div>');
    });
    ra.push('</div>');

    root.innerHTML = HM.dau({ h1: 'Trao đổi' }) +
      '<div class="doi-2"><div>' +
        HM.the({
          h2: 'Mọi trao đổi giữa bạn và Haustek',
          p: 'Tin nhắn, thông báo, tệp và các chặng đã qua, xếp theo thời gian.',
          thoBody: true,
          than: '<div class="card-b">' + (ds.length ? ra.join('') : HM.trong({
            tieuDe: 'Chưa có trao đổi nào',
            moTa: 'Bạn nhắn một câu bên dưới là Haustek nhận được ngay.' })) +
            (ds.length > soHien ? '<div class="btnrow" style="justify-content:center;margin-top:6px">' +
              '<button type="button" class="btn" data-them-dong="' + (soHien + 30) + '">Xem thêm ' +
              Math.min(30, ds.length - soHien) + ' dòng nữa</button></div>' : '') + '</div>' +
            '<div class="soan"><label class="fld">Nhắn cho Haustek</label>' +
            '<textarea class="in" data-noi rows="3" placeholder="Bạn cần gì, hoặc muốn hỏi gì."></textarea>' +
            '<div class="ft"><span class="hint">' +
              e(ph.nguoiPhuTrach ? ph.nguoiPhuTrach.ten + ' đọc và trả lời tin của bạn.' : 'Haustek đọc và trả lời tin của bạn.') +
              '</span><button type="button" class="btn pri" data-gui>Gửi</button></div></div>'
        }) +
      '</div><div>' +
        HM.the({
          h2: 'Tài liệu', p: 'Tệp Haustek đã gửi cho bạn.', thoBody: true,
          than: '<div class="card-b" style="padding-top:2px">' + (tep.length
            ? tep.slice(0, 20).map(function (t) {
                return '<div class="d" style="padding:9px 0;border-top:1px solid var(--line)">' +
                  '<div class="c">' + e(t.ten) + '<span class="khi">' +
                  e(api.ngayVi(t.luc) + ' · ' + t.co + ' · ' + t.boiTen + ' gửi') + '</span></div></div>';
              }).join('')
            : '<p class="say">Tệp Haustek bàn giao cho bạn sẽ hiện ở đây.</p>') + '</div>'
        }) +
        (ph.nguoiPhuTrach ? HM.the({ h2: 'Người phụ trách của bạn',
          than: '<p style="font-size:14px;line-height:1.7"><b>' + e(ph.nguoiPhuTrach.ten) + '</b><br>' +
            e(ph.nguoiPhuTrach.chucDanh) + '<br>' +
            '<a href="tel:' + e(ph.nguoiPhuTrach.dienThoai) + '">' + e(ph.nguoiPhuTrach.dienThoai) + '</a><br>' +
            '<a href="mailto:' + e(ph.nguoiPhuTrach.email) + '">' + e(ph.nguoiPhuTrach.email) + '</a></p>' }) : '') +
      '</div></div>';

    /* Đánh dấu đã đọc khi người dùng THẬT SỰ mở thông báo ra, không phải
       lúc trang vừa nạp. Đánh dấu hộ lúc nạp thì cột "đã xem" bên nội bộ
       nói dối, và cả tính năng mất nghĩa. */
    HM.bam(root, '[data-them-dong]', function (el) { c.datLoc({ dong: el.getAttribute('data-them-dong') }); });
    HM.bam(root, '[data-tb]', function (el) {
      var id = el.getAttribute('data-tb');
      try { api.danhDauDaDoc(ph.doiTacId, id, ph.nguoiDungId); } catch (err) {}
      el.classList.remove('moi');
      var tag = el.querySelector('.tag'); if (tag) tag.remove();
    });
    HM.bam(root, '[data-gui]', function () {
      var o = root.querySelector('.soan [data-noi]'), chu = o ? o.value.trim() : '';
      if (!chu) { c.thongBao('Bạn viết vài chữ rồi gửi nhé.', 'warn'); return; }
      var v = api.viec(ph.doiTacId).filter(function (x) { return x.trangThai !== 'xong'; })[0];
      try {
        if (v) { api.traLoi(ph.doiTacId, v.id, chu, ph.nguoiDungId); c.thongBao('Đã gửi cho Haustek.', 'ok'); }
        else {
          var kq = api.guiYeuCau(ph.doiTacId, { dichVu: 'ho-tro', tieuDe: chu.split('\n')[0].slice(0, 80), noiDung: chu });
          c.thongBao(kq.bienNhan, 'ok');
        }
        c.veLai();
      } catch (err) { c.thongBao('Chưa gửi được. Bạn thử lại, hoặc gọi thẳng người phụ trách.', 'warn'); }
    });
  }
});

})();
