/* =====================================================================
   NỘI BỘ · QUẢN TRỊ
   ---------------------------------------------------------------------
   Bốn tab, không hơn. Không ma trận phân quyền nhiều vai, không cây tổ
   chức có đếm sống, không sổ tài sản: mười người thì những thứ đó là
   trang trí, và trang trí trong phần mềm nghiệp vụ là chỗ để sai lệch
   trốn vào.

   Tab Dịch vụ là tab quan trọng nhất và dễ bị coi thường nhất: đổi cam
   kết phản hồi từ 2 lên 3 ngày là đổi một LỜI HỨA với đối tác. Nên ô nhập
   đứng cạnh đúng câu mà đối tác đang đọc, và mọi lần đổi đều vào nhật ký.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };
var TAB = [
  { k: 'nhan-su',  l: 'Nhân sự' },
  { k: 'tai-khoan', l: 'Tài khoản cổng đối tác' },
  { k: 'dich-vu',  l: 'Dịch vụ' },
  { k: 'nhat-ky',  l: 'Nhật ký' }
];

function loiNguoi(err) {
  var m = String(err && err.message || '');
  return { 'chi-quan-ly': 'Việc này cần quyền quản lý. Nhờ giám đốc làm giúp, hoặc đổi sang tài khoản quản lý ở cột trái.',
    'thieu-ten': 'Cần điền họ tên.',
    'email-khong-hop-le': 'Địa chỉ email chưa đúng dạng.',
    'email-da-co': 'Email này đã có tài khoản rồi.',
    'khong-thay-nhan-su': 'Không tìm thấy nhân sự này.',
    'khong-thay-doi-tac': 'Không tìm thấy đối tác này.',
    'khong-thay-dich-vu': 'Không tìm thấy dịch vụ này.',
    'so-ngay-khong-hop-le': 'Số ngày phải từ 1 đến 30.'
  }[m] || 'Chưa lưu được. Thử lại, nếu vẫn vậy thì báo người quản trị.';
}

/* ---- tab 1 · nhân sự ---- */
function veNhanSu(root, c) {
  var A = c.A, me = A.nhanSu.toi, quanLy = me.vai === 'quan-ly';
  var ds = A.nhanSu.list();
  var boPhanTen = {};
  A.boPhan.forEach(function (b) { boPhanTen[b.id] = b.vi; });

  root.innerHTML = HM.the({
    h2: ds.length + ' người',
    p: 'Bộ phận quyết định việc nào rơi vào hàng đợi của ai ở trang Hôm nay.',
    hanhDong: quanLy ? '<button type="button" class="btn pri" data-them>Thêm người</button>' : '',
    thoBody: true,
    than: '<div class="hang">' + ds.map(function (n) {
      var viec = A.viec.list({ nguoiPhuTrachId: n.id, trangThai: 'dang-mo' }).length;
      return '<div class="d">' +
        '<div class="c"><b>' + e(n.ten) + '</b>' + (n.id === me.id ? ' ' + HM.tag('đang đăng nhập', 'ok') : '') +
        '<span class="khi">' + e(n.chucDanh + ' · ' + (boPhanTen[n.boPhan] || n.boPhan) + ' · ' + n.email) + '</span>' +
        '<span class="khi">' + e(viec ? viec + ' việc đang chạy' : 'không giữ việc nào') +
        (n.vai === 'quan-ly' ? ' · có quyền quản lý' : '') + '</span></div>' +
        '<div class="btnrow">' +
          '<button type="button" class="btn sm" data-xem-nhu="' + e(n.id) + '">Xem Hôm nay của họ</button>' +
          (quanLy ? '<button type="button" class="btn sm" data-sua="' + e(n.id) + '">Sửa</button>' : '') +
        '</div></div>';
    }).join('') + '</div>'
  }) + (quanLy ? '' : HM.ghi({ kieu: 'info', tieuDe: 'Chỉ đọc',
    than: 'Bạn đang đăng nhập bằng tài khoản nhân viên nên chỉ xem được. Thêm và sửa nhân sự cần quyền quản lý.' }));

  var oForm = function (n) {
    return [
      { k: 'ten', l: 'Họ tên', req: true, v: n ? n.ten : '' },
      { k: 'email', l: 'Email', req: true, v: n ? n.email : '' },
      { k: 'dienThoai', l: 'Điện thoại', v: n ? n.dienThoai : '' },
      { k: 'chucDanh', l: 'Chức danh', v: n ? n.chucDanh : '' },
      { k: 'boPhan', l: 'Bộ phận', kieu: 'select', v: n ? n.boPhan : 'kinh-doanh',
        opts: A.boPhan.map(function (b) { return [b.id, b.vi]; }),
        hint: 'Việc chưa có người phụ trách sẽ hiện ở trang Hôm nay của cả bộ phận này.' },
      { k: 'vai', l: 'Quyền', kieu: 'select', v: n ? n.vai : 'nhan-vien',
        opts: [['nhan-vien', 'Nhân viên'], ['quan-ly', 'Quản lý']] }
    ];
  };
  HM.bam(root, '[data-them]', function () {
    HM.hoiForm(c, { tieuDe: 'Thêm người', fields: oForm(null) }).then(function (f) {
      if (!f) return;
      try { var n = A.nhanSu.them(f); c.thongBao('Đã thêm ' + n.ten + '.', 'ok'); c.veLai(); }
      catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
    });
  });
  HM.bam(root, '[data-sua]', function (el) {
    var n = A.nhanSu.get(el.getAttribute('data-sua'));
    HM.hoiForm(c, { tieuDe: 'Sửa ' + n.ten, fields: oForm(n) }).then(function (f) {
      if (!f) return;
      try { A.nhanSu.sua(n.id, f); c.thongBao('Đã lưu.', 'ok'); c.veLai(); }
      catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
    });
  });
  /* Bản mẫu: đổi người đang đăng nhập để xem trang Hôm nay của từng vị
     trí. Hệ thật lấy người dùng từ tài khoản đăng nhập. */
  HM.bam(root, '[data-xem-nhu]', function (el) {
    try { sessionStorage.setItem('haustek.nv', el.getAttribute('data-xem-nhu')); } catch (err) {}
    location.hash = '#hom-nay';
    location.reload();
  });
}

/* ---- tab 2 · tài khoản cổng đối tác ---- */
function veTaiKhoan(root, c) {
  var A = c.A;
  var ds = A.doiTac.list().map(function (d) {
    return { dt: d, nd: A.doiTac.nguoiDung(d.id) };
  });
  var chuaCo = ds.filter(function (x) { return !x.nd.length && x.dt.trangThai === 'dang-hop-tac'; });

  var coTk = ds.filter(function (x) { return x.nd.length; });
  var st = HM.nho(A, 'qt.tk.trang', function () { return { trang: 0 }; });
  var tr = HM.phanTrang(coTk, st, 15);

  root.innerHTML =
    (chuaCo.length ? HM.ghi({ kieu: 'info', tieuDe: chuaCo.length + ' đối tác chưa có ai vào được cổng',
      than: 'Họ không đọc được thông báo nào Haustek gửi. Mời một người của họ vào là xong: ' +
        chuaCo.slice(0, 6).map(function (x) { return '<button type="button" class="btn link" data-moi="' + e(x.dt.id) + '">' + e(x.dt.ten) + '</button>'; }).join(', ') +
        (chuaCo.length > 6 ? ' và ' + (chuaCo.length - 6) + ' đối tác nữa' : '') }) : '') +
    HM.the({
      h2: 'Tài khoản cổng đối tác', p: 'Mỗi người một tài khoản riêng, nên lượt đã xem cũng riêng.',
      thoBody: true,
      than: '<div class="hang">' + tr.page.map(function (x) {
        return '<div class="d"><div class="c"><b>' + e(x.dt.ten) + '</b>' +
          '<span class="khi">' + x.nd.map(function (u) {
            return e(u.ten + ' · ' + u.email + ' · ' + ({ 'dang-dung': 'đang dùng', 'da-moi': 'đã mời, chưa đăng nhập', 'khoa': 'đã khoá' }[u.trangThai] || u.trangThai));
          }).join('<br>') + '</span></div>' +
          '<div class="btnrow"><button type="button" class="btn sm" data-moi="' + e(x.dt.id) + '">Mời thêm người</button></div></div>';
      }).join('') + '</div>' + tr.chan
    });
  HM.ganTrang(root, st, c.veLai);

  HM.bam(root, '[data-moi]', function (el) {
    var id = el.getAttribute('data-moi'), dt = A.doiTac.get(id);
    HM.hoiForm(c, {
      tieuDe: 'Mời người của ' + dt.ten + ' vào cổng',
      moTa: 'Họ sẽ đọc được việc, thông báo và bảng kê của chính đối tác này.',
      fields: [{ k: 'ten', l: 'Họ tên', req: true }, { k: 'email', l: 'Email', req: true }]
    }).then(function (f) {
      if (!f) return;
      try { A.doiTac.moiVaoCong(id, f.email, f.ten); c.thongBao('Đã mời ' + f.ten + '.', 'ok'); c.veLai(); }
      catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
    });
  });
}

/* ---- tab 3 · dịch vụ và cam kết phản hồi ---- */
function veDichVu(root, c) {
  var A = c.A;
  var ds = A.dichVu.filter(function (d) { return !d.kyThuat; });
  var boPhanTen = {};
  A.boPhan.forEach(function (b) { boPhanTen[b.id] = b.vi; });

  root.innerHTML = HM.the({
    h2: 'Mười mảng dịch vụ',
    p: 'Cam kết phản hồi là lời hứa Haustek đưa ra khi nhận một yêu cầu. Đổi ở đây là đổi câu đối tác đọc.',
    thoBody: true,
    than: '<div class="hang">' + ds.map(function (d) {
      var soViec = A.viec.list({ dichVu: d.id, trangThai: 'dang-mo' }).length;
      return '<div class="d" style="align-items:flex-start">' +
        '<div class="c"><b>' + e(d.vi) + '</b>' +
        '<span class="khi">' + e(boPhanTen[d.boPhan] || d.boPhan) +
        (soViec ? ' · ' + soViec + ' việc đang chạy' : ' · không có việc đang chạy') + '</span>' +
        '<span class="khi" style="margin-top:7px;color:var(--ink-2);font-style:italic">' +
          e('Đối tác đang đọc: “' + A.caiDat.cauCongKhai(d.id) + '”') + '</span></div>' +
        '<div class="btnrow" style="align-items:center;gap:7px">' +
          '<input class="in" type="number" min="1" max="30" style="width:74px;text-align:right" ' +
            'data-cam-ket="' + e(d.id) + '" value="' + e(d.camKetPhanHoi) + '">' +
          '<span class="range">ngày làm việc</span></div>' +
        '</div>';
    }).join('') + '</div>'
  });

  HM.doi(root, '[data-cam-ket]', function (el) {
    var id = el.getAttribute('data-cam-ket'), n = parseInt(el.value, 10);
    if (!(n >= 1 && n <= 30)) { c.thongBao('Số ngày phải từ 1 đến 30.', 'warn'); c.veLai(); return; }
    try {
      A.caiDat.datCamKet(id, n);
      c.thongBao('Đã đổi cam kết. Câu đối tác đọc cũng đổi theo.', 'ok');
      c.veLai();
    } catch (err) { c.thongBao(loiNguoi(err), 'warn'); c.veLai(); }
  });
}

/* ---- tab 4 · nhật ký ---- */
function veNhatKy(root, c) {
  var A = c.A, ds = A.nhatKy(120);
  root.innerHTML = HM.the({
    h2: 'Nhật ký thao tác',
    p: 'Ai đổi gì, lúc nào. Đủ để trả lời câu "sao cái này đổi rồi".',
    thoBody: true,
    than: ds.length ? '<div class="hang">' + ds.map(function (x) {
      return '<div class="d"><div class="c">' +
        '<b>' + e(x.boiTen) + '</b> · ' + e(cauNhatKy(x)) +
        '<span class="khi">' + e(A.ngayVi(x.luc) + ' lúc ' + A.gioVi(x.luc)) + '</span></div></div>';
    }).join('') + '</div>' : HM.trong({ tieuDe: 'Chưa có thao tác nào được ghi', moTa: 'Thao tác đầu tiên sẽ hiện ở đây.' })
  });
}
function cauNhatKy(x) {
  var m = {
    'nhan-su.them': 'thêm người', 'nhan-su.sua': 'sửa hồ sơ nhân sự',
    'doi-tac.them': 'thêm đối tác', 'doi-tac.lien-he': 'thêm liên hệ',
    'doi-tac.nguoi-phu-trach': 'đổi người phụ trách',
    'nguoi-dung.moi': 'mời tài khoản cổng đối tác',
    'dich-vu.cam-ket': 'đổi cam kết phản hồi'
  }[x.hanhDong] || x.hanhDong;
  return m + (x.chiTiet ? ' · ' + x.chiTiet : '');
}

HT.dangKy({
  id: 'quan-tri', nav: 'Quản trị', icon: 'gear',
  chu: { vi: { nav: 'Quản trị' } },
  ve: function (root, c) {
    var tab = c.loc.tab || 'nhan-su';
    root.innerHTML = HM.dau({ h1: 'Quản trị', mo: 'Người, tài khoản, dịch vụ và nhật ký. Bốn thứ, không hơn.' }) + HM.tabs(TAB, tab);
    var than = document.createElement('div');
    root.appendChild(than);
    HM.bam(root, '[data-tab]', function (el) { c.datLoc({ tab: el.getAttribute('data-tab') }); });
    if (tab === 'tai-khoan') veTaiKhoan(than, c);
    else if (tab === 'dich-vu') veDichVu(than, c);
    else if (tab === 'nhat-ky') veNhatKy(than, c);
    else veNhanSu(than, c);
  }
});

})();
