/* =====================================================================
   NỘI BỘ · THÔNG BÁO
   ---------------------------------------------------------------------
   Thông báo ở đây là THƯ DO NGƯỜI VIẾT, không phải chuông hệ thống tự
   bắn. Ba cách gửi, một hộp soạn duy nhất.

   Gửi cho hai đối tác trở lên thì BẮT BUỘC xem trước. Một lá thư đi tới
   ba mươi đối tác không có nút thu hồi, nên bước xem trước ở đây là cái
   phanh, không phải một màn hình thừa.

   Tab Bảng kê là bàn của kế toán: lưới đối tác nhân kỳ, ô nào trống thì
   thấy ngay. Số tiền hiện ra là số GHI TRÊN BẢNG KÊ PDF kèm nguồn, portal
   không cộng lại của OneRPM hay Believe.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };
var TAB = [
  { k: 'soan',    l: 'Soạn thông báo' },
  { k: 'da-gui',  l: 'Đã gửi' },
  { k: 'bang-ke', l: 'Bảng kê' }
];
var GUI_TOI = [
  ['chon',          'Một hoặc vài đối tác'],
  ['theo-dich-vu',  'Tất cả đối tác mua một dịch vụ'],
  ['tat-ca',        'Tất cả đối tác đang hợp tác']
];
/* Bản nháp giữ trong bộ nhớ trang: đổi tab rồi quay lại vẫn còn chữ vừa gõ. */
var NHAP = { kieu: 'chon', doiTacIds: [], dichVu: '', tieuDe: '', noiDung: '', mauId: '' };
var XEM_TRUOC = null;

function chonHtml(khoa, ds, gt) {
  return '<select class="in" ' + khoa + '>' + ds.map(function (x) {
    return '<option value="' + e(x[0]) + '"' + (String(x[0]) === String(gt) ? ' selected' : '') + '>' + e(x[1]) + '</option>';
  }).join('') + '</select>';
}
function loiNguoi(err) {
  var m = String(err && err.message || '');
  return { 'thieu-tieu-de': 'Cần một dòng tiêu đề trước đã.',
    'thieu-noi-dung': 'Nội dung đang trống.',
    'khong-co-nguoi-nhan': 'Cách gửi này hiện không khớp đối tác nào. Đổi nhóm nhận rồi thử lại.',
    'so-tien-khong-hop-le': 'Số tiền phải lớn hơn 0 và đúng như ghi trên bảng kê.',
    'thieu-ky': 'Chưa chọn kỳ.',
    'thieu-doi-tac': 'Chưa chọn đối tác.',
    'khong-thay-bang-ke': 'Không tìm thấy bảng kê này.'
  }[m] || 'Chưa gửi được. Thử lại, nếu vẫn vậy thì báo người quản trị.';
}

/* Ai sẽ nhận. Hỏi thẳng lõi chứ không tự lọc lại: tự lọc thì màn hình xem
   trước và cái thực sự gửi đi có thể lệch nhau, và lệch ở đúng chỗ không
   ai kiểm được. */
function nguoiNhan(A) {
  return A.thongBao.nguoiNhan(guiToiHienTai());
}
function guiToiHienTai() {
  if (NHAP.kieu === 'chon') return { kieu: 'chon', doiTacIds: NHAP.doiTacIds.slice() };
  if (NHAP.kieu === 'theo-dich-vu') return { kieu: 'theo-dich-vu', dichVu: NHAP.dichVu ? [NHAP.dichVu] : [] };
  return { kieu: 'tat-ca' };
}

/* =====================================================================
   Tab 1 · Soạn
   ===================================================================== */
function veSoan(root, c) {
  var A = c.A;
  var nn;
  try { nn = nguoiNhan(A); } catch (err) { nn = { doiTac: [], soDoiTac: 0, soNguoiDung: 0 }; }

  if (XEM_TRUOC) return veXemTruoc(root, c, nn);

  var mau = A.thongBao.mau();
  var dsDt = A.doiTac.list().filter(function (d) { return d.trangThai === 'dang-hop-tac'; });

  var oNhan;
  if (NHAP.kieu === 'chon') {
    oNhan = '<div class="fgrp span2"><label class="fld">Chọn đối tác</label>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:190px;overflow:auto;padding:4px 2px">' +
      dsDt.map(function (d) {
        var on = NHAP.doiTacIds.indexOf(d.id) >= 0;
        return '<button type="button" class="btn sm' + (on ? ' pri' : '') + '" data-tick="' + e(d.id) + '">' + e(d.ten) + '</button>';
      }).join('') + '</div></div>';
  } else if (NHAP.kieu === 'theo-dich-vu') {
    oNhan = '<div class="fgrp span2"><label class="fld">Dịch vụ</label>' +
      chonHtml('data-dv', [['', 'Chọn một dịch vụ']].concat(
        A.dichVu.filter(function (x) { return !x.kyThuat; }).map(function (x) { return [x.id, x.vi]; })), NHAP.dichVu) + '</div>';
  } else {
    oNhan = '<div class="fgrp span2"><div class="fhint">Gửi cho tất cả đối tác đang hợp tác.</div></div>';
  }

  var cauNhan = nn.soDoiTac
    ? 'Sẽ gửi tới <b>' + nn.soDoiTac + ' đối tác</b> · ' + nn.soNguoiDung + ' người đọc được'
    : 'Chưa có ai trong danh sách nhận.';

  root.innerHTML =
    HM.the({
      h2: 'Soạn thông báo',
      p: 'Thông báo là thư do bạn viết. Đối tác đọc nó ở mục Trao đổi trên cổng của họ.',
      than:
        '<div class="fldrow two-up">' +
          '<div class="fgrp"><label class="fld">Gửi cho</label>' + chonHtml('data-kieu', GUI_TOI, NHAP.kieu) + '</div>' +
          '<div class="fgrp"><label class="fld">Mẫu có sẵn <span class="kbb">(không bắt buộc)</span></label>' +
            chonHtml('data-mau', [['', 'Tự viết']].concat(mau.map(function (m) { return [m.id, m.ten]; })), NHAP.mauId) + '</div>' +
          oNhan +
          '<div class="fgrp span2"><label class="fld">Tiêu đề *</label>' +
            '<input class="in" data-tieu-de value="' + e(NHAP.tieuDe) + '" placeholder="Một dòng nói rõ việc gì"></div>' +
          '<div class="fgrp span2"><label class="fld">Nội dung *</label>' +
            '<textarea class="in" data-noi rows="9" placeholder="Chào bạn,">' + e(NHAP.noiDung) + '</textarea></div>' +
        '</div>',
      chan: '<div class="range">' + cauNhan + '</div><div class="sp"></div>' +
        '<div class="btnrow">' +
          '<button type="button" class="btn" data-xoa-nhap>Xoá nháp</button>' +
          '<button type="button" class="btn pri" data-tiep>' +
            (nn.soDoiTac >= 2 ? 'Xem trước rồi gửi' : 'Gửi thông báo') + '</button></div>'
    }) +
    HM.ghi({
      dong: 'tb-mau', kieu: 'info', tieuDe: 'Chỗ trống trong mẫu',
      than: 'Mẫu có sẵn để lại vài chỗ trong ngoặc nhọn như <b>{ten}</b> hoặc <b>{ky}</b>. Bạn thay bằng chữ thật trước khi gửi; portal không tự điền hộ, vì đoán sai một cái tên trong thư gửi đối tác thì tệ hơn là để trống.'
    });

  HM.doi(root, '[data-kieu]', function (el) { NHAP.kieu = el.value; c.veLai(); });
  HM.doi(root, '[data-dv]', function (el) { NHAP.dichVu = el.value; c.veLai(); });
  HM.doi(root, '[data-mau]', function (el) {
    NHAP.mauId = el.value;
    var m = mau.filter(function (x) { return x.id === el.value; })[0];
    if (m) { NHAP.tieuDe = m.tieuDe; NHAP.noiDung = m.noiDung; }
    c.veLai();
  });
  HM.bam(root, '[data-tick]', function (el) {
    var id = el.getAttribute('data-tick'), i = NHAP.doiTacIds.indexOf(id);
    if (i >= 0) NHAP.doiTacIds.splice(i, 1); else NHAP.doiTacIds.push(id);
    giuChu(root); c.veLai();
  });
  HM.nhap(root, '[data-tieu-de]', function (el) { NHAP.tieuDe = el.value; }, 250);
  HM.nhap(root, '[data-noi]', function (el) { NHAP.noiDung = el.value; }, 250);
  HM.bam(root, '[data-xoa-nhap]', function () {
    c.xacNhan('Xoá bản nháp?', 'Chữ đang gõ sẽ mất.', 'Xoá nháp').then(function (ok) {
      if (!ok) return;
      NHAP = { kieu: 'chon', doiTacIds: [], dichVu: '', tieuDe: '', noiDung: '', mauId: '' };
      c.veLai();
    });
  });
  HM.bam(root, '[data-tiep]', function () {
    giuChu(root);
    if (!NHAP.tieuDe.trim()) { c.thongBao('Cần một dòng tiêu đề trước đã.', 'warn'); return; }
    if (!NHAP.noiDung.trim()) { c.thongBao('Nội dung đang trống.', 'warn'); return; }
    if (!nn.soDoiTac) { c.thongBao('Chưa chọn ai để gửi.', 'warn'); return; }
    if (nn.soDoiTac >= 2) { XEM_TRUOC = true; c.veLai(); return; }
    gui(c, nn);
  });
}

/* Người dùng gõ xong chưa kịp mất focus mà đã bấm nút thì chữ cuối chưa
   vào NHAP. Quét lại một lượt trước mọi thao tác đọc bản nháp. */
function giuChu(root) {
  var a = root.querySelector('[data-tieu-de]'), b = root.querySelector('[data-noi]');
  if (a) NHAP.tieuDe = a.value;
  if (b) NHAP.noiDung = b.value;
}

/* Bước xem trước: hiện ĐÚNG danh sách người nhận theo tên và ĐÚNG chữ họ
   sẽ đọc. Không có nút thu hồi ở đời thật, nên cái phanh nằm ở đây. */
function veXemTruoc(root, c, nn) {
  root.innerHTML = HM.the({
    h2: 'Xem trước trước khi gửi',
    p: 'Gửi rồi thì không thu hồi được. Đọc lại một lượt.',
    than:
      '<p class="say" style="margin-bottom:12px">Thư này sẽ tới <b>' + nn.soDoiTac + ' đối tác</b>, ' +
        nn.soNguoiDung + ' người có tài khoản đọc được.</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;max-height:150px;overflow:auto">' +
        nn.doiTac.map(function (d) { return HM.tag(d.ten, ''); }).join('') + '</div>' +
      '<div style="border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;background:var(--band)">' +
        '<b style="display:block;font-size:14.5px;margin-bottom:8px">' + e(NHAP.tieuDe) + '</b>' +
        '<div style="white-space:pre-wrap;font-size:13px;line-height:1.6;color:var(--ink-2)">' + e(NHAP.noiDung) + '</div>' +
      '</div>' +
      (/\{[a-zA-Z]+\}/.test(NHAP.tieuDe + NHAP.noiDung)
        ? HM.ghi({ kieu: 'warn', tieuDe: 'Còn chỗ trống chưa thay',
            than: 'Trong thư còn dấu ngoặc nhọn như <b>{ten}</b>. Đối tác sẽ đọc đúng dấu ngoặc đó. Quay lại thay bằng chữ thật.' })
        : ''),
    chan: '<div class="sp"></div><div class="btnrow">' +
      '<button type="button" class="btn" data-quay-lai>Quay lại sửa</button>' +
      '<button type="button" class="btn pri" data-gui>Gửi cho ' + nn.soDoiTac + ' đối tác</button></div>'
  });
  HM.bam(root, '[data-quay-lai]', function () { XEM_TRUOC = null; c.veLai(); });
  HM.bam(root, '[data-gui]', function () { gui(c, nn); });
}

function gui(c, nn) {
  try {
    var kq = c.A.thongBao.gui({ tieuDe: NHAP.tieuDe.trim(), noiDung: NHAP.noiDung.trim(), guiToi: guiToiHienTai() });
    c.thongBao('Đã gửi tới ' + kq.soDoiTac + ' đối tác.', 'ok');
    NHAP = { kieu: 'chon', doiTacIds: [], dichVu: '', tieuDe: '', noiDung: '', mauId: '' };
    XEM_TRUOC = null;
    c.datLoc({ tab: 'da-gui' });
  } catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
}

/* =====================================================================
   Tab 2 · Đã gửi · ai đã đọc, ai chưa
   ===================================================================== */
function veDaGui(root, c) {
  var A = c.A;
  var ds = A.thongBao.list();
  var st = HM.nho(A, 'tb.trang', function () { return { trang: 0 }; });
  var tr = HM.phanTrang(ds, st, 15);

  var dong = tr.page.map(function (t) {
    var pct = t.soNhan ? Math.round(t.soDoc / t.soNhan * 100) : 0;
    var conLai = (t.chuaDoc || []).slice(0, 4).map(function (x) { return x.ten || x; }).join(', ');
    return '<div class="d">' +
      '<div class="c"><b>' + e(t.tieuDe) + '</b>' +
      '<span class="khi">' + e(A.ngayVi(t.guiLuc) + ' · ' + t.nguoiGuiTen + ' gửi cho ' + t.soNhan + ' đối tác') + '</span>' +
      '<span class="khi" style="display:flex;align-items:center;gap:9px;margin-top:6px">' +
        '<span style="flex:0 0 110px">' + HM.thanh(t.soDoc, t.soNhan, 'đã xem') + '</span>' +
        '<span>' + t.soDoc + '/' + t.soNhan + ' đã xem' +
        (conLai ? ' · chưa xem: ' + e(conLai) + ((t.chuaDoc || []).length > 4 ? ' và ' + ((t.chuaDoc || []).length - 4) + ' nữa' : '') : '') +
        '</span></span></div>' +
      '<div class="btnrow"><button type="button" class="btn sm" data-doc="' + e(t.id) + '">Đọc lại</button></div>' +
      '</div>';
  }).join('');

  root.innerHTML = HM.the({
    h2: ds.length + ' thông báo đã gửi',
    p: 'Cột đã xem thay cho câu "bạn nhận được tin nhắn của mình chưa".',
    thoBody: true,
    than: ds.length ? '<div class="hang">' + dong + '</div>' + tr.chan
      : HM.trong({ tieuDe: 'Chưa gửi thông báo nào', moTa: 'Thông báo đầu tiên bạn gửi sẽ hiện ở đây kèm ai đã đọc.' })
  });

  HM.ganTrang(root, st, c.veLai);
  HM.bam(root, '[data-doc]', function (el) {
    var t = ds.filter(function (x) { return x.id === el.getAttribute('data-doc'); })[0];
    if (!t) return;
    c.nganTruot('<h2>' + e(t.tieuDe) + '</h2>' +
      '<p class="say">' + e(A.ngayVi(t.guiLuc) + ' · ' + t.nguoiGuiTen + ' gửi cho ' + t.soNhan + ' đối tác') + '</p>' +
      '<div style="white-space:pre-wrap;font-size:13.5px;line-height:1.65;margin-top:14px">' + e(t.noiDung) + '</div>' +
      ((t.chuaDoc || []).length ? '<h3 style="margin-top:20px">Chưa xem</h3><p class="say">' +
        e((t.chuaDoc || []).map(function (x) { return x.ten || x; }).join(', ')) + '</p>' : ''),
      { ten: 'Thông báo' });
  });
}

/* =====================================================================
   Tab 3 · Bảng kê · bàn của kế toán
   ===================================================================== */
function veBangKe(root, c) {
  var A = c.A;
  var kys = A.bangKe.ky(), kyNay = c.loc.ky || kys[kys.length - 1];
  var ds = A.bangKe.list({ ky: kyNay });
  var thieu = A.bangKe.thieu(kyNay);
  var tong = ds.length + thieu.length;
  var chuaChuyen = ds.filter(function (b) { return b.trangThai === 'da-tai-len'; });

  root.innerHTML =
    HM.tabs(kys.map(function (k) { return { k: k, l: 'Kỳ ' + k }; }), kyNay) +
    HM.the({
      h2: 'Kỳ ' + kyNay,
      p: 'Số tiền là con số ghi trên bảng kê PDF của bên phân phối. Portal không cộng lại.',
      than:
        '<p style="font-size:14px;margin-bottom:10px"><b>Đã có ' + ds.length + '/' + tong + ' bảng kê.</b>' +
          (chuaChuyen.length ? ' Trong đó ' + chuaChuyen.length + ' bảng kê đã lên nhưng chưa đánh dấu đã chuyển khoản.' : ' Tất cả đã chuyển khoản xong.') + '</p>' +
        '<div style="max-width:420px">' + HM.thanh(ds.length, tong, 'bảng kê đã tải lên') + '</div>' +
        (thieu.length ? '<p class="say" style="margin-top:12px">Còn thiếu: ' +
          thieu.map(function (d) { return '<button type="button" class="btn link" data-them-bk="' + e(d.id) + '">' + e(d.ten) + '</button>'; }).join(', ') + '</p>' : ''),
      chan: '<div class="sp"></div><div class="btnrow"><button type="button" class="btn pri" data-them-bk="">Tải lên bảng kê</button></div>'
    }) +
    HM.the({
      h2: 'Bảng kê kỳ ' + kyNay, thoBody: true,
      than: ds.length ? '<div class="hang">' + ds.map(function (b) {
        return '<div class="d">' +
          '<div class="c"><b>' + e(b.doiTacTen) + '</b> · ' + e(A.tien0(b.soTien)) +
          '<span class="khi">' + e('theo bảng kê ' + b.nguon) +
          (b.ngayChuyen ? e(' · đã chuyển ' + A.ngayVi(b.ngayChuyen) + ' vào ' + b.taiKhoanNhanMask)
                        : e(' · tải lên ' + A.ngayVi(b.taiLenLuc) + ', chưa đánh dấu đã chuyển')) +
          '</span></div>' +
          (b.ngayChuyen ? '<div class="btnrow">' + HM.tag('đã chuyển', 'ok') + '</div>'
            : '<div class="btnrow"><button type="button" class="btn sm" data-chuyen="' + e(b.id) + '">Đánh dấu đã chuyển</button></div>') +
          '</div>';
      }).join('') + '</div>'
        : HM.trong({ tieuDe: 'Kỳ này chưa có bảng kê nào', moTa: 'Tải bảng kê từ OneRPM hoặc Believe về, rồi đưa lên đây kèm số tiền ghi trên đó.' })
    });

  HM.bam(root, '[data-tab]', function (el) { c.datLoc({ ky: el.getAttribute('data-tab') }); });
  HM.bam(root, '[data-chuyen]', function (el) {
    try { A.bangKe.danhDauDaChuyen(el.getAttribute('data-chuyen'), A.homNay()); c.thongBao('Đã đánh dấu chuyển khoản.', 'ok'); c.veLai(); }
    catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
  });
  HM.bam(root, '[data-them-bk]', function (el) {
    var dtId = el.getAttribute('data-them-bk');
    var ung = thieu.length ? thieu : A.doiTac.list();
    HM.hoiForm(c, {
      tieuDe: 'Tải lên bảng kê',
      moTa: 'Điền đúng con số ghi trên bảng kê PDF. Portal không tự tính lại.',
      fields: [
        { k: 'doiTacId', l: 'Đối tác', kieu: 'select', opts: ung.map(function (d) { return [d.id, d.ten]; }), v: dtId },
        { k: 'ky', l: 'Kỳ', kieu: 'select', opts: kys.map(function (k) { return [k, k]; }), v: kyNay },
        { k: 'nguon', l: 'Nguồn', kieu: 'select', opts: [['OneRPM', 'OneRPM'], ['Believe', 'Believe'], ['Warner', 'Warner'], ['YouTube CMS', 'YouTube CMS']] },
        { k: 'soTien', l: 'Số tiền ghi trên bảng kê (USD)', kieu: 'number', req: true },
        { k: 'ngayChuyen', l: 'Ngày đã chuyển khoản', kieu: 'date', hint: 'Bỏ trống nếu chưa chuyển.' }
      ]
    }).then(function (f) {
      if (!f) return;
      try { A.bangKe.them(f); c.thongBao('Đã ghi bảng kê.', 'ok'); c.veLai(); }
      catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
    });
  });
}

HT.dangKy({
  id: 'thong-bao', nav: 'Thông báo', icon: 'chat',
  chu: { vi: { nav: 'Thông báo' } },
  dem: function (c) {
    var A = c.A;
    try {
      var kys = A.bangKe.ky(), kyNay = kys[kys.length - 1];
      var n = A.bangKe.thieu(kyNay).length + A.bangKe.list({ ky: kyNay }).filter(function (b) { return b.trangThai === 'da-tai-len'; }).length;
      return { n: n, muc: 'thuong' };
    } catch (e) { return null; }
  },
  ve: function (root, c) {
    var tab = c.loc.tab || 'soan';
    /* Trang Hôm nay mở thẳng hộp soạn sẵn cho một đối tác: #thong-bao?soan=DT-0007 */
    if (c.loc.soan) {
      tab = 'soan';
      if (c.loc.soan !== 'moi' && NHAP.doiTacIds.indexOf(c.loc.soan) < 0) {
        NHAP.kieu = 'chon'; NHAP.doiTacIds = [c.loc.soan];
      }
    }
    var than = document.createElement('div');
    root.innerHTML = HM.dau({
      h1: 'Thông báo',
      mo: 'Thư do người viết, gửi cho đối tác. Không phải chuông hệ thống tự bắn.'
    }) + HM.tabs(TAB, tab);
    root.appendChild(than);
    HM.bam(root, '[data-tab]:not([data-tab="' + tab + '"])', function (el) {
      var k = el.getAttribute('data-tab');
      if (['soan', 'da-gui', 'bang-ke'].indexOf(k) >= 0) { XEM_TRUOC = null; c.datLoc({ tab: k, soan: '', ky: '' }); }
    });
    if (tab === 'da-gui') veDaGui(than, c);
    else if (tab === 'bang-ke') veBangKe(than, c);
    else veSoan(than, c);
  }
});

})();
