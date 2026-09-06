/* =====================================================================
   NỘI BỘ · VIỆC · hàng đợi chung cho cả mười mảng dịch vụ
   ---------------------------------------------------------------------
   Một dòng hàng đợi là một câu tiếng Việt đọc được: đối tác nào, việc gì,
   ai nợ ai cái gì, hạn ngày nào, và đúng một nút cho việc phải làm tiếp.
   Không phải một hàng bảng sáu cột bắt người đọc tự ghép nghĩa.

   Ngăn chi tiết có thứ tự bắt buộc, và thứ tự ấy chính là màn hình:
     1 tóm tắt · 2 bước tiếp · 3 mốc · 4 số liệu · 5 dòng thời gian ·
     6 ô soạn ghim dưới cùng.
   Số liệu đứng SAU câu chữ, vì người mở việc lúc chín giờ sáng cần biết
   phải làm gì trước, chứ không cần biết bao nhiêu phần trăm.

   Ghi một cuộc gọi vừa xong phải mất dưới mười lăm giây, nên ô soạn luôn
   hiện, không nằm sau hộp thoại nào, và tab mặc định là "Ghi liên lạc".

   Cửa nhận hồ sơ phát hành nằm ở đây: dán JSON do biểu mẫu công khai
   xuất ra, mã hồ sơ giữ nguyên làm mã việc. Portal không sinh mã.
   ===================================================================== */
"use strict";
(function () {

/* ---------------------------------------------------------------------
   Hằng số của màn
   --------------------------------------------------------------------- */
/* Tab đọc thẳng từ A.viec.dem(): mỗi tab một khoá đếm có sẵn trong lõi,
   không tự đếm lại ở đây. Đếm hai nơi là hai con số, và con số thứ hai
   luôn là con số sai. */
var TAB = [
  { k: 'cua-toi',     l: 'Của tôi',                  d: 'cuaToi' },
  { k: 'tre',         l: 'Đã quá hạn',               d: 'tre' },
  { k: 'chua-gan',    l: 'Chưa có người phụ trách',  d: 'chuaGan' },
  { k: 'dang-lam',    l: 'Đang làm',                 d: 'dangLam' },
  { k: 'cho-doi-tac', l: 'Chờ đối tác',              d: 'choDoiTac' },
  { k: 'dang-mo',     l: 'Tất cả đang mở',           d: 'dangMo' },
  { k: 'xong',        l: 'Đã xong',                  d: 'xong' }
];

var KENH = [['goi', 'Gọi điện'], ['zalo', 'Nhắn Zalo'], ['email', 'Gửi email'], ['gap', 'Gặp trực tiếp']];
var KET_QUA = [['da-chot', 'Đã chốt'], ['cho-doi-tac', 'Chờ đối tác trả lời'], ['goi-lai', 'Hẹn gọi lại']];

var SOAN_TAB = [
  { k: 'lien-lac',   l: 'Ghi liên lạc' },
  { k: 'nhan',       l: 'Nhắn cho đối tác' },
  { k: 'ghi-chu',    l: 'Ghi chú nội bộ' },
  { k: 'trang-thai', l: 'Đổi trạng thái' }
];

var LOAI_DONG = {
  'trang-thai': 'Trạng thái', 'lien-lac': 'Liên lạc', 'ghi-chu': 'Ghi chú nội bộ',
  'tin-nhan': 'Tin nhắn', 'tep': 'Tệp', 'bang-ke': 'Bảng kê', 'moc': 'Mốc', 'thong-bao': 'Thông báo'
};

/* Đường ra công cụ thật. Portal không vẽ lại số của bên phân phối, chỉ mở
   đúng chỗ cần mở. */
var CONG_CU = [
  { k: 'onerpm',  ten: 'OneRPM',      url: 'https://app.onerpm.com/' },
  { k: 'believe', ten: 'Believe',     url: 'https://backstage.believe.com/' },
  { k: 'ytcms',   ten: 'YouTube CMS', url: 'https://studio.youtube.com/' }
];

/* Lỗi lõi ném ra bằng mã ngắn. Người dùng đọc câu, không đọc mã. */
var LOI = {
  'thieu-doi-tac': 'Chưa chọn đối tác cho hồ sơ này.',
  'thieu-ma-ho-so': 'Tệp JSON không có submission_id. Biểu mẫu công khai luôn sinh mã này.',
  'ma-da-co': 'Mã hồ sơ này đã có trong portal rồi.',
  'thieu-ten': 'Tệp JSON không có tên bản phát hành.',
  'thieu-tom-tat': 'Cần một câu tóm tắt cuộc liên lạc.',
  'thieu-noi-dung': 'Cần nội dung trước khi lưu.',
  'khong-thay-viec': 'Không tìm thấy việc này.',
  'khong-thay-moc': 'Không tìm thấy mốc này.',
  'khong-thay-ban-phat-hanh': 'Không tìm thấy bản phát hành gắn với việc này.',
  'trang-thai-khong-hop-le': 'Trạng thái không hợp lệ.',
  'thieu-dich-vu': 'Việc phải thuộc một dịch vụ.',
  'thieu-tieu-de': 'Việc phải có tiêu đề.'
};
function loiChu(e) {
  var m = e && e.message ? String(e.message) : '';
  return LOI[m] || ('Chưa lưu được: ' + m);
}

/* ---------------------------------------------------------------------
   Trạng thái riêng của màn
   Bộ lọc KHÔNG nằm ở đây: bộ lọc đọc từ c.loc và ghi bằng c.datLoc, để một
   đường dẫn dán cho đồng nghiệp mở ra đúng thứ mình đang xem.
   --------------------------------------------------------------------- */
var trang = { trang: 0 };
var khoaTrang = '';
var moNhanHoSo = false;
var soanTab = 'lien-lac';
var chiDoiTacThay = false;
var nganId = null;
var veTrangLai = null;

/* ---------------------------------------------------------------------
   Tiện ích nhỏ
   --------------------------------------------------------------------- */
function e(s) { return HM.esc(s == null ? '' : s); }
function giaTri(goc, sel) { var o = goc.querySelector(sel); return o ? o.value : ''; }
function chonHtml(khoa, ds, hienTai) {
  return '<select class="in" ' + khoa + '>' + ds.map(function (x) {
    return '<option value="' + e(x[0]) + '"' + (String(x[0]) === String(hienTai) ? ' selected' : '') + '>' + e(x[1]) + '</option>';
  }).join('') + '</select>';
}
/* "hôm nay" · "quá hạn 4 ngày" · "hạn 18/9". Ngày Việt, không bao giờ ISO. */
function cauHan(A, ngay) {
  if (!ngay) return 'chưa đặt hạn';
  var d = A.cachNgay(ngay);
  if (d === 0) return 'hạn là hôm nay';
  if (d > 0) return 'quá hạn ' + d + ' ngày';
  return 'hạn ' + A.ngayGonVi(ngay);
}
function tenTrangThai(A, id) {
  var ds = A.trangThaiViec, i;
  for (i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i].vi;
  return id;
}
function tenNenTang(A, id) {
  var ds = A.nenTangPhatHanh, i;
  for (i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i].vi;
  return id;
}
function tenTrangThaiPh(A, id) {
  var ds = A.trangThaiPhatHanh, i;
  for (i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i].vi;
  return id;
}

/* ---------------------------------------------------------------------
   Bộ lọc
   --------------------------------------------------------------------- */
function docLocMan(c) {
  var l = c.loc || {};
  var tab = l.tab;
  /* Lối tắt "Hồ sơ phát hành" chỉ mang dichVu. Mở ra mà rơi vào tab "Của
     tôi" thì phần lớn trường hợp là một danh sách trống trông như hỏng,
     nên có bộ lọc thì mặc định là toàn bộ việc đang mở. Người không phụ
     trách việc nào (giám đốc, kế toán) cũng vậy: mở ra phải thấy hàng đợi
     của đội, không phải một ô trống. */
  if (!tab) {
    if (l.dichVu || l.doiTacId || l.q) tab = 'dang-mo';
    else tab = c.A.viec.dem().cuaToi > 0 ? 'cua-toi' : 'dang-mo';
  }
  return {
    tab: tab,
    dichVu: l.dichVu || '',
    nguoiPhuTrachId: l.nguoiPhuTrachId || '',
    doiTacId: l.doiTacId || '',
    q: l.q || ''
  };
}
function locChoLoi(c, lm) {
  var A = c.A, o = { dichVu: lm.dichVu || null, doiTacId: lm.doiTacId || null, q: lm.q || null };
  if (lm.nguoiPhuTrachId) o.nguoiPhuTrachId = lm.nguoiPhuTrachId;
  if (lm.tab === 'cua-toi') { o.trangThai = 'dang-mo'; if (!o.nguoiPhuTrachId) o.nguoiPhuTrachId = A.nhanSu.toi.id; }
  else if (lm.tab === 'tre') { o.trangThai = 'dang-mo'; o.tre = true; }
  else if (lm.tab === 'chua-gan') { o.trangThai = 'dang-mo'; o.chuaGan = true; }
  else if (lm.tab === 'dang-lam') o.trangThai = 'dang-lam';
  else if (lm.tab === 'cho-doi-tac') o.trangThai = 'cho-doi-tac';
  else if (lm.tab === 'xong') o.trangThai = 'xong';
  else o.trangThai = 'dang-mo';
  return o;
}

/* ---------------------------------------------------------------------
   Một dòng hàng đợi
   --------------------------------------------------------------------- */
function cauViec(A, v, dt) {
  var cau = '<b>' + e(v.doiTacTen) + '</b> · ' + e(v.tieuDe) + '.';
  var lh = dt && dt.lienHe && dt.lienHe[0];
  if (v.trangThai === 'xong') return cau + ' Đã xong ngày ' + e(A.ngayGonVi(v.xongLuc || v.capNhatLuc)) + '.';
  if (v.trangThai === 'huy') return cau + ' Việc đã dừng.';
  if (v.treHanPhanHoi) {
    return cau + ' Quá hạn phản hồi ' + A.cachNgay(v.hanPhanHoi) + ' ngày.' +
      (lh ? ' Gọi hoặc nhắn Zalo cho ' + e(lh.ten) + (lh.dienThoai ? ' (' + e(lh.dienThoai) + ')' : '') + '.'
          : ' Hồ sơ đối tác chưa có số điện thoại.');
  }
  if (v.canDoiTac) {
    return cau + ' Đối tác cần làm: ' + e(v.canDoiTac.viec) + ', ' + e(cauHan(A, v.canDoiTac.han)) +
      '. Đã chờ ' + A.cachNgay(v.capNhatLuc) + ' ngày.';
  }
  if (v.buocTiep) {
    var ai = v.buocTiep.aiLam === 'doi-tac' ? 'Đối tác cần làm' : 'Haustek cần làm';
    return cau + ' ' + ai + ': ' + e(v.buocTiep.viec) + ', ' + e(cauHan(A, v.buocTiep.hanNgay)) + '.';
  }
  if (v.trangThai === 'moi') return cau + ' Việc mới nhận, ' + e(cauHan(A, v.hanPhanHoi)) + ' để phản hồi.';
  return cau + ' Chưa đặt bước tiếp cho việc này.';
}
function khiViec(A, v) {
  var ds = [v.dichVuTen];
  ds.push(v.nguoiPhuTrachTen ? v.nguoiPhuTrachTen : 'chưa có người phụ trách');
  ds.push('cập nhật ' + (v.ngayImLang === 0 ? 'hôm nay' : v.ngayImLang + ' ngày trước'));
  if (v.hanGiao) ds.push('hẹn giao ' + A.ngayGonVi(v.hanGiao));
  return e(ds.join(' · '));
}
function nutViec(v) {
  if (!v.nguoiPhuTrachId && v.trangThai !== 'xong' && v.trangThai !== 'huy')
    return '<button type="button" class="btn sm pri" data-nhan="' + e(v.id) + '">Nhận việc</button>';
  if (v.trangThai === 'cho-doi-tac')
    return '<button type="button" class="btn sm" data-nhac="' + e(v.id) + '">Nhắc đối tác</button>';
  if (v.trangThai === 'xong' || v.trangThai === 'huy')
    return '<button type="button" class="btn sm ghost" data-mo="' + e(v.id) + '">Mở việc</button>';
  return '<button type="button" class="btn sm" data-ghi="' + e(v.id) + '">Ghi liên lạc</button>';
}
function veHang(A, ds, dtIx, batDau) {
  return '<div class="hang">' + ds.map(function (v, i) {
    var dt = dtIx[v.doiTacId];
    var tre = v.treHanPhanHoi || v.treBuocTiep;
    return '<div class="d' + (tre ? ' tre' : '') + '" data-viec="' + e(v.id) + '">' +
      '<span class="n">' + (batDau + i + 1) + '</span>' +
      '<div class="c">' + cauViec(A, v, dt) + '<span class="khi">' + khiViec(A, v) + '</span></div>' +
      '<div class="btnrow">' + nutViec(v) + '</div>' +
      '</div>';
  }).join('') + '</div>';
}

/* ---------------------------------------------------------------------
   Ngăn chi tiết · khối 4 · ba hình dạng chiTiet, không có hình thứ tư
   --------------------------------------------------------------------- */
/* Bảng kiểm hồ sơ phát hành, dựng theo đúng định nghĩa trường của
   metadata.html qua HHS. conThieu do người tiếp nhận ghi, mục nào đối tác
   không tự bổ sung được thì vẫn nằm đây nhưng cổng đối tác không thấy. */
function kiemHoSo(b) {
  var muc = [];
  function them(ten, bat, dat) { muc.push({ vi: ten, en: ten, bat: !!bat, ok: !!dat }); }
  var tr = b.track || [];
  var duIsrc = tr.length > 0;
  tr.forEach(function (t) { if (!t.isrc) duIsrc = false; });
  them('Tên bản phát hành', true, b.ten);
  them('Ngày phát hành', true, b.ngayPhatHanh);
  them('Mã UPC', true, b.upc);
  them('Mã ISRC cho mọi track', true, duIsrc);
  them('Ảnh bìa vuông 3000×3000', false, b.anhBia);
  them('Đường dẫn trên nền tảng', false, b.duongDan && (b.duongDan.spotify || b.duongDan.apple || b.duongDan.youtube));
  (b.conThieu || []).forEach(function (x) { them(x.muc, x.mucDo === 'chan', false); });
  var soBat = 0, soOk = 0;
  muc.forEach(function (m) { if (m.bat) soBat++; if (m.ok) soOk++; });
  return { muc: muc, batBuoc: soBat, diem: muc.length ? Math.round(soOk / muc.length * 100) : 0 };
}
function veNgoai(A, dt, b) {
  var ds = [];
  CONG_CU.forEach(function (x) {
    var ma = dt && dt.maNgoai ? dt.maNgoai[x.k] : '';
    if (!ma) return;
    ds.push('<a href="' + e(x.url) + '" target="_blank" rel="noopener">' + HM.icon('out') +
      '<span>Mở ' + e(x.ten) + '</span><em>' + e(ma) + '</em></a>');
  });
  if (b && b.duongDan) {
    if (b.duongDan.spotify) ds.push('<a href="' + e(b.duongDan.spotify) + '" target="_blank" rel="noopener">' + HM.icon('out') + '<span>Mở trang Spotify của bản phát hành</span></a>');
    if (b.duongDan.apple) ds.push('<a href="' + e(b.duongDan.apple) + '" target="_blank" rel="noopener">' + HM.icon('out') + '<span>Mở trang Apple Music của bản phát hành</span></a>');
  }
  if (!ds.length) return '<p class="hint">Hồ sơ đối tác chưa ghi mã tài khoản ở bên phân phối nào.</p>';
  return '<div class="ngoai">' + ds.join('') + '</div>' +
    '<p class="hint">Số liệu và tiền nằm ở công cụ phân phối. Portal mở đúng chỗ, không chép số về.</p>';
}
function veChiTietPhatHanh(A, v) {
  var b = v.banPhatHanh || (v.banPhatHanhId ? A.banPhatHanh.get(v.banPhatHanhId) : null) || A.banPhatHanh.get(v.id);
  var ct = v.chiTiet || {};
  if (!b) {
    return '<p class="hint">Việc này thuộc mảng phát hành nhưng chưa gắn bản phát hành nào. ' +
      'Nhận hồ sơ ở ô "Nhận hồ sơ" trên trang Việc để gắn mã.</p>';
  }
  var soIsrc = typeof ct.isrcDaCap === 'number' ? ct.isrcDaCap : (ct.isrcDaCap || []).length;
  var html = HM.kv([
    { t: 'Mã hồ sơ', v: b.id },
    { t: 'Loại', v: { single: 'Single', ep: 'EP', album: 'Album' }[b.loai] || b.loai },
    { t: 'Ngày phát hành', v: A.ngayVi(b.ngayPhatHanh) },
    { t: 'Trạng thái hồ sơ', v: tenTrangThaiPh(A, b.trangThai) },
    { t: 'Trạng thái nền tảng', vHtml: true,
      v: e(tenNenTang(A, b.nenTang)) + ' <span class="muted">· cập nhật ' + e(A.ngayGonVi(b.nenTangCapNhatLuc)) + '</span>' },
    { t: 'Số track', v: (b.track || []).length + ' track, ' + soIsrc + ' track đã có ISRC' },
    { t: 'UPC', v: b.upc || ct.upc || 'chưa cấp' }
  ]);
  if (b.nenTangGhiChu) html += '<p class="hint">' + e(b.nenTangGhiChu) + '</p>';

  html += '<h4 class="sec">Cập nhật trạng thái nền tảng</h4>' +
    '<div class="btnrow">' + A.nenTangPhatHanh.map(function (x) {
      return '<button type="button" class="btn sm' + (b.nenTang === x.id ? ' pri' : '') + '" data-nen-tang="' + e(x.id) + '">' + e(x.vi) + '</button>';
    }).join('') + '</div>' +
    '<p class="hint">Trạng thái này do người đặt tay và luôn hiện kèm ngày cập nhật ở cả hai cổng, ' +
    'nên đối tác biết con số cũ tới đâu.</p>';

  var HHS = window.HHS;
  var kiem = kiemHoSo(b);
  if (HHS && HHS.bangKiem) html += HHS.bangKiem(kiem, { gon: true });
  if (HHS && HHS.chiTiet && ct.payloadHoSo) {
    var rows = HHS.chiTiet(ct.payloadHoSo, { ngay: A.ngayVi });
    if (rows && rows.length) html += '<h4 class="sec">Hồ sơ metadata đối tác đã khai</h4>' + HM.kv(rows);
  }
  if ((b.track || []).length) {
    html += '<h4 class="sec">Track</h4>' + HM.kv((b.track || []).map(function (t) {
      var phu = HHS && HHS.trackChiTiet ? HHS.trackChiTiet(t) : '';
      return { t: t.thuTu + '. ' + t.ten + (t.featuring ? ' feat. ' + t.featuring : ''),
        v: (t.isrc || 'chưa cấp ISRC') + (phu ? ' · ' + phu : '') };
    }));
  }
  html += '<h4 class="sec">Mở ở công cụ thật</h4>' + veNgoai(A, v.doiTac, b);
  return html;
}
function veChiTietSuKien(A, v) {
  var ct = v.chiTiet || {};
  var rows = [];
  if (ct.ngayGio) rows.push({ t: 'Ngày diễn', v: A.ngayVi(ct.ngayGio) + ' · ' + A.thuTrongTuan(ct.ngayGio) + ' · ' + A.gioVi(ct.ngayGio) });
  if (ct.diaDiem) rows.push({ t: 'Địa điểm', v: ct.diaDiem });
  if (ct.lineup && ct.lineup.length) rows.push({ t: 'Line-up', v: ct.lineup.join(' · ') });
  if (ct.phanCong && ct.phanCong.length) rows.push({ t: 'Phân công', v: ct.phanCong.join(' · ') });
  if (!rows.length) return '<p class="hint">Chưa ghi ngày, địa điểm và line-up cho đêm diễn này.</p>';
  return HM.kv(rows);
}
function veChiTietChung(A, v) {
  var ct = v.chiTiet || {};
  var rows = [];
  if (ct.moTa) rows.push({ t: 'Mô tả', v: ct.moTa });
  if (ct.mocThoiGian) rows.push({ t: 'Mốc thời gian', v: ct.mocThoiGian });
  if (ct.khoangNganSach) rows.push({ t: 'Khoảng ngân sách', v: ct.khoangNganSach });
  if (!rows.length) return '<p class="hint">Chưa ghi mô tả, mốc thời gian và khoảng ngân sách cho việc này.</p>';
  return HM.kv(rows);
}
function veChiTiet(A, v) {
  if (v.dichVu === 'phat-hanh') return veChiTietPhatHanh(A, v);
  if (v.dichVu === 'su-kien') return veChiTietSuKien(A, v);
  return veChiTietChung(A, v);
}

/* ---------------------------------------------------------------------
   Ngăn chi tiết · khối 5 · dòng thời gian của việc
   --------------------------------------------------------------------- */
function veDongThoiGian(A, v) {
  /* Công tắc bắt buộc: người viết ghi chú phải nhìn tận mắt cái đối tác
     sẽ đọc, nên đường đọc thứ hai đi đúng hàm cổng đối tác dùng. */
  var ds = chiDoiTacThay ? A.dong.choDoiTac(v.doiTacId, { viecId: v.id }) : A.dong.theoViec(v.id);
  var html = '<label class="tickrow"><input type="checkbox" data-chi-dt' + (chiDoiTacThay ? ' checked' : '') +
    '><span>Chỉ những dòng đối tác thấy</span></label>';
  if (!ds.length) {
    return html + HM.trong({ tieuDe: 'Chưa có dòng nào cho việc này.',
      moTa: 'Ghi một cuộc liên lạc ở ô soạn bên dưới là dòng đầu tiên có mặt.' });
  }
  var gioiHan = ds.slice(0, 40);
  var ngayCu = '';
  html += '<div class="dt">' + gioiHan.map(function (d) {
    var ngay = String(d.luc).slice(0, 10);
    var dau = '';
    if (ngay !== ngayCu) { ngayCu = ngay; dau = '<div class="ngay">' + e(A.ngayVi(ngay)) + '</div>'; }
    return dau + '<div class="m' + (d.loai === 'lien-lac' || d.loai === 'moc' ? ' ta' : '') + '">' +
      '<div class="h"><b>' + e(d.tieuDe) + '</b>' +
      '<time>' + e(A.gioVi(d.luc)) + '</time>' +
      '<span class="ai">' + e((LOAI_DONG[d.loai] || d.loai) + (d.boi && d.boi.ten ? ' · ' + d.boi.ten : '')) + '</span>' +
      (d.hienChoDoiTac ? '' : '<span class="rieng">nội bộ</span>') + '</div>' +
      (d.noiDung ? '<p>' + e(d.noiDung) + '</p>' : '') +
      (d.daXem ? '<span class="dax">' + e(d.daXem.ten + ' đã xem lúc ' + A.gioVi(d.daXem.luc) + ' ngày ' + A.ngayGonVi(d.daXem.luc)) + '</span>' : '') +
      '</div>';
  }).join('') + '</div>';
  if (ds.length > gioiHan.length) html += '<p class="hint">Đang hiện 40 dòng gần nhất trong ' + ds.length + ' dòng.</p>';
  return html;
}

/* ---------------------------------------------------------------------
   Ngăn chi tiết · khối 6 · ô soạn bốn tab, ghim dưới cùng
   --------------------------------------------------------------------- */
function veSoan(A, v) {
  var than = '', nut = '', goi = '';
  if (soanTab === 'lien-lac') {
    than = '<div class="fldrow two-up">' +
      '<div class="fgrp"><label class="fld">Kênh</label>' + chonHtml('data-soan-kenh', KENH, 'goi') + '</div>' +
      '<div class="fgrp"><label class="fld">Kết quả</label>' + chonHtml('data-soan-ketqua', KET_QUA, 'da-chot') + '</div>' +
      '</div>' +
      '<textarea class="in" data-soan-noi rows="2" placeholder="Vừa gọi ai, chốt được gì."></textarea>';
    nut = 'Lưu liên lạc';
    goi = 'Một câu là đủ. Dòng liên lạc chỉ nội bộ đọc.';
  } else if (soanTab === 'nhan') {
    than = '<textarea class="in" data-soan-noi rows="3" placeholder="Nội dung gửi cho đối tác."></textarea>';
    nut = 'Gửi cho đối tác';
    goi = 'Đối tác đọc được nguyên văn dòng này ở cổng đối tác.';
  } else if (soanTab === 'ghi-chu') {
    than = '<textarea class="in" data-soan-noi rows="3" placeholder="Ghi chú cho đồng nghiệp."></textarea>';
    nut = 'Lưu ghi chú';
    goi = 'Ghi chú nội bộ không có đường nào lộ sang cổng đối tác.';
  } else {
    than = '<div class="fldrow two-up">' +
      '<div class="fgrp"><label class="fld">Trạng thái</label>' +
      chonHtml('data-soan-tt', A.trangThaiViec.map(function (x) { return [x.id, x.vi]; }), v.trangThai) + '</div>' +
      '</div>' +
      '<textarea class="in" data-soan-noi rows="2" placeholder="Lý do đổi trạng thái (không bắt buộc)."></textarea>';
    nut = 'Đổi trạng thái';
    goi = 'Đổi trạng thái sinh một dòng đối tác đọc được.';
  }
  return '<div class="soan">' + HM.tabs(SOAN_TAB, soanTab) + than +
    '<div class="ft"><span class="hint">' + e(goi) + '</span>' +
    '<button type="button" class="btn pri" data-luu-soan>' + e(nut) + '</button></div></div>';
}

/* ---------------------------------------------------------------------
   Ngăn chi tiết · thân đầy đủ, đúng thứ tự bắt buộc
   --------------------------------------------------------------------- */
function thanNgan(c, v) {
  var A = c.A;
  var html = '';

  /* 1 · tóm tắt. Đứng đầu vì đây là câu người mới nhận việc cần đọc. */
  html += '<div class="tomtat">' + e(v.tomTat || 'Việc này chưa có tóm tắt.') + '</div>' +
    '<div class="btnrow"><button type="button" class="btn sm ghost" data-sua-tomtat>Sửa tóm tắt</button>' +
    '<button type="button" class="btn sm ghost" data-loc-doi-tac="' + e(v.doiTacId) + '">Mọi việc của ' + e(v.doiTacTen) + '</button></div>';

  /* 2 · bước tiếp: ai nợ ai cái gì, hạn ngày nào. */
  html += '<h4 class="sec">Bước tiếp</h4>';
  if (v.canDoiTac) {
    html += '<p class="say">Đối tác cần làm: <b>' + e(v.canDoiTac.viec) + '</b>, ' + e(cauHan(A, v.canDoiTac.han)) +
      '. Việc đã ở trạng thái chờ đối tác ' + A.cachNgay(v.capNhatLuc) + ' ngày.</p>';
  } else if (v.buocTiep) {
    html += '<p class="say">' + (v.buocTiep.aiLam === 'doi-tac' ? 'Đối tác cần làm' : 'Haustek cần làm') +
      ': <b>' + e(v.buocTiep.viec) + '</b>, ' + e(cauHan(A, v.buocTiep.hanNgay)) + '.</p>';
  } else if (v.trangThai === 'xong') {
    html += '<p class="say">Việc đã xong ngày ' + e(A.ngayVi(v.xongLuc || v.capNhatLuc)) + ', không còn bước tiếp.</p>';
  } else {
    html += '<p class="say">Chưa đặt bước tiếp. Đặt một câu ngắn kèm ngày để việc không nằm im.</p>';
  }
  if (v.trangThai !== 'xong' && v.trangThai !== 'huy') {
    html += '<div class="btnrow">' +
      '<button type="button" class="btn sm" data-buoc-tiep>Đặt bước tiếp của Haustek</button>' +
      '<button type="button" class="btn sm" data-can-doi-tac>Chuyển sang chờ đối tác</button>' +
      (v.nguoiPhuTrachId ? '' : '<button type="button" class="btn sm pri" data-nhan-ngan>Nhận việc</button>') +
      '</div>';
  }
  html += '<p class="hint">' + e('Hạn phản hồi ' + A.ngayVi(v.hanPhanHoi) + ' · cam kết ' +
    A.dvCua(v.dichVu).camKetPhanHoi + ' ngày làm việc của mảng ' + v.dichVuTen.toLowerCase() +
    (v.hanGiao ? ' · hẹn giao ' + A.ngayVi(v.hanGiao) : '')) + '</p>';

  /* 3 · mốc. Tiến độ là một thanh, không phải một biểu đồ. */
  html += '<h4 class="sec">Mốc</h4>';
  var moc = v.moc || [];
  if (!moc.length) {
    html += '<p class="hint">Việc này không chia mốc.</p>';
  } else {
    var xong = 0;
    moc.forEach(function (m) { if (m.xongLuc) xong++; });
    html += HM.thanh(xong, moc.length, 'Mốc') +
      '<p class="hint">' + xong + ' trong ' + moc.length + ' mốc đã xong.</p>' +
      '<div class="hang">' + moc.map(function (m) {
        return '<div class="d">' +
          '<span class="n">' + (m.xongLuc ? HM.icon('check') : HM.icon('clock')) + '</span>' +
          '<div class="c">' + e(m.ten) + '<span class="khi">' +
          (m.xongLuc ? e('xong ngày ' + A.ngayGonVi(m.xongLuc)) : e(cauHan(A, m.han))) + '</span></div>' +
          '<div class="btnrow">' + (m.xongLuc ? '' :
            '<button type="button" class="btn sm ghost" data-xong-moc="' + e(m.id) + '">Đánh dấu xong</button>') + '</div>' +
          '</div>';
      }).join('') + '</div>';
  }

  /* 4 · số liệu, chỉ sau khi đã nói xong việc phải làm. */
  html += '<h4 class="sec">' + (v.dichVu === 'phat-hanh' ? 'Bản phát hành' : v.dichVu === 'su-kien' ? 'Đêm diễn' : 'Chi tiết việc') + '</h4>';
  html += veChiTiet(A, v);
  if (v.baoGia && v.baoGia.tong != null) {
    html += '<h4 class="sec">Báo giá đã chốt</h4>' + HM.kv([
      { t: 'Tổng', v: A.tien0(v.baoGia.tong) },
      { t: 'Đặt cọc', v: v.baoGia.coc ? A.tien0(v.baoGia.coc) : 'không có' },
      { t: 'Hạn xác nhận', v: v.baoGia.hanXacNhan ? A.ngayVi(v.baoGia.hanXacNhan) : 'chưa đặt' },
      { t: 'Đã xác nhận', v: v.baoGia.xacNhanLuc ? A.ngayVi(v.baoGia.xacNhanLuc) : 'chưa xác nhận' }
    ]) + '<p class="hint">Báo giá ở đây chỉ là dấu vết đã chốt phạm vi. Hoá đơn và công nợ nằm ở phần mềm kế toán.</p>';
  }

  /* 5 · dòng thời gian của riêng việc này. */
  html += '<h4 class="sec">Dòng thời gian của việc</h4>' + veDongThoiGian(A, v);

  /* 6 · ô soạn, ghim dưới cùng, luôn hiện. */
  html += veSoan(A, v);
  return html;
}

/* ---------------------------------------------------------------------
   Mở, vẽ lại và gắn sự kiện cho ngăn
   Vẽ lại RUỘT ngăn chứ không mở lại ngăn: mở lại là chạy lại hiệu ứng
   trượt và mất chỗ cuộn, ghi một cuộc gọi sẽ không còn dưới mười lăm giây.
   --------------------------------------------------------------------- */
function veLaiNgan(c) {
  var dr = document.querySelector('.drawer');
  if (!dr || !nganId) return;
  var v = c.A.viec.get(nganId);
  if (!v) return;
  var than = dr.querySelector('.drawer-b');
  if (than) than.innerHTML = thanNgan(c, v);
}
function moNgan(c, id, opt) {
  var A = c.A, v = A.viec.get(id);
  if (!v) { c.thongBao('Không tìm thấy việc này.', 'no'); return; }
  nganId = id;
  chiDoiTacThay = false;
  soanTab = (opt && opt.soanTab) || 'lien-lac';
  c.nganTruot(thanNgan(c, v), {
    tieuDe: v.tieuDe,
    phu: v.doiTacTen + ' · ' + v.dichVuTen + ' · mã ' + v.id,
    khiMo: function (dr) {
      ganNgan(dr, c);
      if (opt && opt.soan) {
        var o = dr.querySelector('.soan textarea');
        if (o) o.focus();
      }
    }
  });
}
function ganNgan(dr, c) {
  var A = c.A;
  function lamMoi() { veLaiNgan(c); if (veTrangLai) veTrangLai(); }
  function viec() { return A.viec.get(nganId); }

  HM.bam(dr, '.soan [data-tab]', function (el) {
    soanTab = el.getAttribute('data-tab');
    veLaiNgan(c);
    var o = dr.querySelector('.soan textarea');
    if (o) o.focus();
  });

  HM.bam(dr, '[data-luu-soan]', function () {
    var v = viec(); if (!v) return;
    var chu = (giaTri(dr, '[data-soan-noi]') || '').trim();
    try {
      if (soanTab === 'lien-lac') {
        if (!chu) { c.thongBao('Cần một câu tóm tắt cuộc liên lạc.', 'no'); return; }
        A.dong.ghiLienLac({ doiTacId: v.doiTacId, viecId: v.id, tomTat: chu,
          kenh: giaTri(dr, '[data-soan-kenh]'), ketQua: giaTri(dr, '[data-soan-ketqua]') });
        c.thongBao('Đã ghi liên lạc.', 'ok');
      } else if (soanTab === 'nhan') {
        if (!chu) { c.thongBao('Cần nội dung trước khi gửi.', 'no'); return; }
        A.dong.nhanChoDoiTac({ doiTacId: v.doiTacId, viecId: v.id, noiDung: chu });
        c.thongBao('Đã gửi cho đối tác.', 'ok');
      } else if (soanTab === 'ghi-chu') {
        if (!chu) { c.thongBao('Cần nội dung trước khi lưu.', 'no'); return; }
        A.dong.ghiChuNoiBo({ doiTacId: v.doiTacId, viecId: v.id, noiDung: chu });
        c.thongBao('Đã lưu ghi chú nội bộ.', 'ok');
      } else {
        var tt = giaTri(dr, '[data-soan-tt]');
        A.viec.doiTrangThai(v.id, tt, chu);
        c.thongBao('Đã chuyển sang ' + tenTrangThai(A, tt).toLowerCase() + '.', 'ok');
      }
      lamMoi();
    } catch (err) { c.thongBao(loiChu(err), 'no'); }
  });

  HM.doi(dr, '[data-chi-dt]', function (el) {
    chiDoiTacThay = !!el.checked;
    veLaiNgan(c);
  });

  HM.bam(dr, '[data-sua-tomtat]', function () {
    var v = viec(); if (!v) return;
    HM.hoiForm(c, {
      tieuDe: 'Sửa tóm tắt việc', dong: 'Lưu tóm tắt',
      moTa: 'Một đoạn cho người nhận bàn giao: đối tác muốn gì, đã thống nhất tới đâu.',
      fields: [{ k: 'tomTat', l: 'Tóm tắt', kieu: 'textarea', rows: 4, v: v.tomTat, req: true, rong: true }]
    }).then(function (f) {
      if (!f) return;
      try { A.viec.suaTomTat(v.id, f.tomTat); c.thongBao('Đã lưu tóm tắt.', 'ok'); lamMoi(); }
      catch (err) { c.thongBao(loiChu(err), 'no'); }
    });
  });

  HM.bam(dr, '[data-buoc-tiep]', function () {
    var v = viec(); if (!v) return;
    var cu = v.buocTiep && v.buocTiep.aiLam === 'haustek' ? v.buocTiep : null;
    HM.hoiForm(c, {
      tieuDe: 'Bước tiếp của Haustek', dong: 'Lưu bước tiếp',
      moTa: 'Một câu ngắn và một ngày. Không có hai thứ đó thì việc nằm im mà không ai biết.',
      fields: [
        { k: 'viec', l: 'Haustek cần làm gì', v: cu ? cu.viec : '', req: true, rong: true },
        { k: 'hanNgay', l: 'Hạn', kieu: 'date', v: cu ? cu.hanNgay : A.hanLamViec(A.homNay(), 2), kbb: false }
      ]
    }).then(function (f) {
      if (!f) return;
      try {
        A.viec.datBuocTiep(v.id, { viec: f.viec, aiLam: 'haustek', hanNgay: f.hanNgay });
        c.thongBao('Đã đặt bước tiếp.', 'ok'); lamMoi();
      } catch (err) { c.thongBao(loiChu(err), 'no'); }
    });
  });

  HM.bam(dr, '[data-can-doi-tac]', function () {
    var v = viec(); if (!v) return;
    HM.hoiForm(c, {
      tieuDe: 'Chuyển sang chờ đối tác', dong: 'Chuyển sang chờ đối tác',
      moTa: 'Câu này hiện nguyên văn ở khối "Việc cần bạn" của cổng đối tác, nên viết như đang nói với họ.',
      fields: [
        { k: 'viec', l: 'Đối tác cần làm gì', v: v.canDoiTac ? v.canDoiTac.viec : '', req: true, rong: true },
        { k: 'hanNgay', l: 'Hẹn ngày', kieu: 'date', v: v.canDoiTac ? v.canDoiTac.han : A.hanLamViec(A.homNay(), 3), kbb: false }
      ]
    }).then(function (f) {
      if (!f) return;
      try {
        A.viec.datBuocTiep(v.id, { viec: f.viec, aiLam: 'doi-tac', hanNgay: f.hanNgay });
        c.thongBao('Việc đã chuyển sang chờ đối tác.', 'ok'); lamMoi();
      } catch (err) { c.thongBao(loiChu(err), 'no'); }
    });
  });

  HM.bam(dr, '[data-nhan-ngan]', function () {
    var v = viec(); if (!v) return;
    try { A.viec.nhan(v.id); c.thongBao('Bạn đã nhận việc này.', 'ok'); lamMoi(); }
    catch (err) { c.thongBao(loiChu(err), 'no'); }
  });

  HM.bam(dr, '[data-xong-moc]', function (el) {
    var v = viec(); if (!v) return;
    try { A.viec.xongMoc(v.id, el.getAttribute('data-xong-moc')); c.thongBao('Đã đánh dấu mốc xong.', 'ok'); lamMoi(); }
    catch (err) { c.thongBao(loiChu(err), 'no'); }
  });

  HM.bam(dr, '[data-nen-tang]', function (el) {
    var v = viec(); if (!v) return;
    var b = v.banPhatHanh || (v.banPhatHanhId ? A.banPhatHanh.get(v.banPhatHanhId) : null);
    if (!b) { c.thongBao('Việc này chưa gắn bản phát hành nào.', 'no'); return; }
    var tt = el.getAttribute('data-nen-tang');
    HM.hoiForm(c, {
      tieuDe: 'Trạng thái nền tảng · ' + b.ten, dong: 'Lưu trạng thái',
      moTa: 'Trạng thái này và ngày cập nhật hiện cùng nhau ở cả hai cổng.',
      fields: [{ k: 'ghiChu', l: 'Ghi chú cho đối tác', kieu: 'textarea', rows: 2, v: b.nenTangGhiChu || '', rong: true }]
    }).then(function (f) {
      if (!f) return;
      try {
        A.banPhatHanh.datNenTang(b.id, tt, f.ghiChu);
        c.thongBao('Đã cập nhật trạng thái nền tảng.', 'ok'); lamMoi();
      } catch (err) { c.thongBao(loiChu(err), 'no'); }
    });
  });

  HM.bam(dr, '[data-loc-doi-tac]', function (el) {
    c.datLoc({ doiTacId: el.getAttribute('data-loc-doi-tac'), tab: 'dang-mo' });
  });
}

/* ---------------------------------------------------------------------
   Ô nhận hồ sơ phát hành
   --------------------------------------------------------------------- */
function veNhanHoSo(A) {
  var ds = A.doiTac.list({ trangThai: 'dang-hop-tac' }).sort(function (a, b) { return a.ten.localeCompare(b.ten, 'vi'); });
  return HM.the({
    h2: 'Nhận hồ sơ phát hành',
    p: 'Dán nguyên tệp JSON mà biểu mẫu metadata công khai xuất ra.',
    than: '<div class="fldrow two-up">' +
      '<div class="fgrp"><label class="fld">Đối tác gửi hồ sơ</label>' +
      chonHtml('data-hs-doi-tac', ds.map(function (d) { return [d.id, d.ten]; }), '') + '</div>' +
      '</div>' +
      '<textarea class="in" data-hs-json rows="6" placeholder=\'{"submission_id": "HSTK-2609-001", "ten": "Tên bản phát hành", "track": []}\'></textarea>' +
      '<p class="hint">Mã hồ sơ (submission_id) trong tệp JSON trở thành mã việc và mã bản phát hành; portal giữ nguyên mã đó và không tự sinh mã mới.</p>',
    chan: '<div class="btnrow"><button type="button" class="btn pri" data-hs-luu>Nhận hồ sơ</button>' +
      '<button type="button" class="btn ghost" data-hs-dong>Đóng ô này</button></div>'
  });
}

/* ---------------------------------------------------------------------
   Đăng ký trang
   --------------------------------------------------------------------- */
HT.dangKy({
  id: 'viec', nav: 'Việc', icon: 'list',

  dem: function (c) {
    var d = c.A.viec.dem();
    if (d.tre > 0) return { n: d.tre, muc: 'tre' };
    if (d.chuaGan > 0) return { n: d.chuaGan, muc: 'hom-nay' };
    return { n: d.cuaToi, muc: 'thuong' };
  },

  ve: function (root, c) {
    var A = c.A;
    var lm = docLocMan(c);
    var khoa = [lm.tab, lm.dichVu, lm.nguoiPhuTrachId, lm.doiTacId, lm.q].join('|');
    if (khoa !== khoaTrang) { khoaTrang = khoa; trang.trang = 0; }

    function veTrang(giuTim) {
      var dem = A.viec.dem();
      var ds = A.viec.list(locChoLoi(c, lm));
      if (lm.tab === 'tre') {
        ds = ds.sort(function (a, b) {
          var x = (a.buocTiep && a.buocTiep.hanNgay) || a.hanPhanHoi || '9999';
          var y = (b.buocTiep && b.buocTiep.hanNgay) || b.hanPhanHoi || '9999';
          return x < y ? -1 : x > y ? 1 : 0;
        });
      }
      var dtIx = {};
      A.doiTac.list().forEach(function (d) { dtIx[d.id] = d; });
      var hn = A.homNayCua(A.nhanSu.toi.id);

      var html = HM.dau({
        h1: 'Việc',
        mo: e('Một hàng đợi cho cả mười mảng dịch vụ. Mỗi dòng là một việc và một bước tiếp; bấm vào dòng để mở ngăn ghi liên lạc.'),
        nut: '<button type="button" class="btn' + (moNhanHoSo ? ' pri' : '') + '" data-mo-nhan>' +
          HM.icon('disc') + 'Nhận hồ sơ</button>'
      });

      /* Thanh lọc. Đọc từ địa chỉ, ghi bằng datLoc, không giữ trạng thái riêng. */
      html += '<div class="bar">' +
        '<div class="srch">' + HM.icon('tim') +
        '<input type="search" data-q value="' + e(lm.q) + '" placeholder="Tìm theo tên việc, mã hồ sơ hoặc tên đối tác"></div>' +
        chonHtml('data-loc-dv', [['', 'Tất cả dịch vụ']].concat(A.dichVu.map(function (d) { return [d.id, d.vi]; })), lm.dichVu) +
        chonHtml('data-loc-nguoi', [['', 'Tất cả người phụ trách']].concat(A.nhanSu.list().map(function (n) { return [n.id, n.ten]; })), lm.nguoiPhuTrachId) +
        '</div>';

      var chip = [];
      if (lm.doiTacId) {
        var dtc = dtIx[lm.doiTacId];
        chip.push('<span class="chip">Đối tác <b>' + e(dtc ? dtc.ten : lm.doiTacId) + '</b>' +
          '<button type="button" data-bo-loc="doiTacId" aria-label="Bỏ lọc đối tác">' + HM.icon('x') + '</button></span>');
      }
      if (lm.q) chip.push('<span class="chip q">Từ khoá <b>' + e(lm.q) + '</b>' +
        '<button type="button" data-bo-loc="q" aria-label="Bỏ từ khoá">' + HM.icon('x') + '</button></span>');
      if (lm.dichVu) chip.push('<span class="chip">Dịch vụ <b>' + e(A.dvCua(lm.dichVu).vi) + '</b>' +
        '<button type="button" data-bo-loc="dichVu" aria-label="Bỏ lọc dịch vụ">' + HM.icon('x') + '</button></span>');
      if (chip.length) html += '<div class="chips">' + chip.join('') + '</div>';

      if (moNhanHoSo) html += veNhanHoSo(A);

      html += HM.tabs(TAB.map(function (t) { return { k: t.k, l: t.l, dem: dem[t.d] }; }), lm.tab);

      var pt = HM.phanTrang(ds, trang, 20);
      var coLoc = !!(lm.q || lm.dichVu || lm.doiTacId || lm.nguoiPhuTrachId);
      var than;
      if (!ds.length && coLoc) {
        than = HM.trong({
          tieuDe: 'Không có việc nào khớp bộ lọc này.',
          moTa: 'Bỏ bớt một bộ lọc hoặc đổi tab để thấy phần còn lại của hàng đợi.',
          nut: '<button type="button" class="btn sm" data-bo-het>Bỏ hết bộ lọc</button>'
        });
      } else if (!ds.length) {
        than = HM.trong({
          xong: true,
          tieuDe: 'Không còn việc nào trong danh sách này.',
          moTa: 'Đội đã dọn sạch phần này. Đổi tab để xem phần còn lại.',
          diem: [
            { n: hn.daXongHomNay.viec, l: 'việc xong hôm nay' },
            { n: hn.daXongHomNay.lienLac, l: 'lượt liên lạc hôm nay' },
            { n: hn.daXongTuanNay.viec, l: 'việc xong tuần này' }
          ]
        });
      } else {
        than = veHang(A, pt.page, dtIx, trang.trang * 20);
      }
      /* pt.chan đã là một khối .card-f hoàn chỉnh, nên dán thẳng vào thân
         thẻ (thoBody) thay vì bọc thêm một lớp chân nữa. */
      html += HM.the({
        h2: e((TAB.filter(function (t) { return t.k === lm.tab; })[0] || TAB[0]).l) +
          ' <span class="muted">(' + ds.length + ')</span>',
        p: e('Mỗi dòng một việc và một bước tiếp. Nút trên dòng là việc phải làm ngay, không phải nút xem.'),
        thoBody: true,
        than: than + (pt.chan || '')
      });

      /* Khoe việc đã xong: hàng đợi nào cũng phải có chỗ nói việc đã làm. */
      var dsXong = (hn.daXongHomNay.dsViec || []).slice(0, 5);
      html += HM.the({
        h2: 'Đội đã làm xong',
        chan: e('Hôm nay ' + hn.daXongHomNay.viec + ' việc và ' + hn.daXongHomNay.lienLac +
          ' lượt liên lạc · tuần này ' + hn.daXongTuanNay.viec + ' việc.'),
        thoBody: !!dsXong.length,
        than: dsXong.length
          ? '<div class="hang">' + dsXong.map(function (v) {
              var dt = dtIx[v.doiTacId];
              return '<div class="d" data-viec="' + e(v.id) + '">' +
                '<span class="n">' + HM.icon('check') + '</span>' +
                '<div class="c"><b>' + e(dt ? dt.ten : '') + '</b> · ' + e(v.tieuDe) + '.' +
                '<span class="khi">' + e('xong lúc ' + A.gioVi(v.xongLuc) + ' · ' + A.dvCua(v.dichVu).vi) + '</span></div>' +
                '<div class="btnrow"><button type="button" class="btn sm ghost" data-mo="' + e(v.id) + '">Mở việc</button></div>' +
                '</div>';
            }).join('') + '</div>'
          : '<p class="say">Hôm nay chưa đóng việc nào. Tuần này đội đã đóng ' + hn.daXongTuanNay.viec + ' việc.</p>'
      });

      root.innerHTML = html;
      if (HT.canhBang) HT.canhBang(root);
      if (giuTim && lm.q) {
        var oq = root.querySelector('[data-q]');
        if (oq) { oq.focus(); try { oq.setSelectionRange(oq.value.length, oq.value.length); } catch (err) {} }
      }
    }

    veTrangLai = veTrang;
    veTrang(true);

    /* ---- sự kiện, uỷ nhiệm hết trên root ---- */
    HM.bam(root, '.tabs [data-tab]', function (el) { c.datLoc({ tab: el.getAttribute('data-tab') }); });
    HM.doi(root, '[data-loc-dv]', function (el) { c.datLoc({ dichVu: el.value }); });
    HM.doi(root, '[data-loc-nguoi]', function (el) {
      /* Chọn người khác trong khi đang ở tab "Của tôi" là một câu tự mâu
         thuẫn, nên chuyển luôn sang tab tất cả việc đang mở. */
      c.datLoc({ nguoiPhuTrachId: el.value, tab: el.value && lm.tab === 'cua-toi' ? 'dang-mo' : lm.tab });
    });
    HM.nhap(root, '[data-q]', function (el) { c.datLoc({ q: el.value.trim() }); }, 350);
    HM.bam(root, '[data-bo-loc]', function (el) {
      var o = {};
      o[el.getAttribute('data-bo-loc')] = '';
      c.datLoc(o);
    });
    HM.bam(root, '[data-bo-het]', function () {
      c.datLoc({ q: '', dichVu: '', doiTacId: '', nguoiPhuTrachId: '' });
    });

    HM.bam(root, '[data-mo-nhan]', function () { moNhanHoSo = !moNhanHoSo; veTrang(); });
    HM.bam(root, '[data-hs-dong]', function () { moNhanHoSo = false; veTrang(); });
    HM.bam(root, '[data-hs-luu]', function () {
      var o = root.querySelector('[data-hs-json]');
      var chu = o ? o.value.trim() : '';
      if (!chu) { c.thongBao('Chưa dán nội dung JSON.', 'no'); return; }
      var payload;
      try { payload = JSON.parse(chu); }
      catch (err) { c.thongBao('Nội dung dán vào không phải JSON hợp lệ.', 'no'); return; }
      try {
        var b = A.banPhatHanh.nhanHoSo(payload, giaTri(root, '[data-hs-doi-tac]'));
        moNhanHoSo = false;
        c.thongBao('Đã nhận hồ sơ ' + b.id + ' và mở việc cùng mã.', 'ok');
        veTrang();
        moNgan(c, b.viecId || b.id, {});
      } catch (err) { c.thongBao(loiChu(err), 'no'); }
    });

    HM.bam(root, '[data-nhan]', function (el) {
      try {
        A.viec.nhan(el.getAttribute('data-nhan'));
        c.thongBao('Bạn đã nhận việc này.', 'ok');
        veTrang();
      } catch (err) { c.thongBao(loiChu(err), 'no'); }
    });
    HM.bam(root, '[data-ghi]', function (el) { moNgan(c, el.getAttribute('data-ghi'), { soan: true, soanTab: 'lien-lac' }); });
    HM.bam(root, '[data-nhac]', function (el) { moNgan(c, el.getAttribute('data-nhac'), { soan: true, soanTab: 'nhan' }); });
    HM.bam(root, '[data-mo]', function (el) { moNgan(c, el.getAttribute('data-mo'), {}); });
    HM.bam(root, '.hang .d[data-viec]', function (el, ev) {
      /* Nút trên dòng đã có việc của nó; bấm phần còn lại của dòng thì mở ngăn. */
      if (ev && ev.target && ev.target.closest('button')) return;
      moNgan(c, el.getAttribute('data-viec'), {});
    });

    HM.ganTrang(root, trang, veTrang);
  }
});

/* Lối tắt điều hướng: không phải một trang, chỉ là một dòng trỏ sang Việc
   kèm sẵn bộ lọc. Nhờ vậy "Hồ sơ phát hành" dùng lại y nguyên mã trên. */
HT.dangKy({ id: 'ho-so-phat-hanh', nav: 'Hồ sơ phát hành', icon: 'disc', di: 'viec', loc: { dichVu: 'phat-hanh' } });

})();
