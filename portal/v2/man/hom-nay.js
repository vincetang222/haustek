/* =====================================================================
   NỘI BỘ · HÔM NAY
   ---------------------------------------------------------------------
   Trang mở lúc chín giờ sáng, và là trang duy nhất bắt buộc phải mở. Nó
   trả lời đúng hai câu hỏi: hôm nay ai cần gì ở tôi, và đội đã làm xong
   được gì. Không biểu đồ, không doanh thu, không dải ô số ở đầu trang.

   Mọi dòng đọc từ A.homNayCua(nhanSuId). Trang KHÔNG tự xếp hạng lại:
   thứ tự do lõi quyết định và phải giữ nguyên suốt ngày làm việc, để
   mười một giờ quay lại thì dòng cũ vẫn nằm đúng chỗ cũ.

   Hộp soạn thông báo nằm ở trang thong-bao. Trang này mở nó bằng địa
   chỉ: #thong-bao?soan=moi (soạn mới) hoặc #thong-bao?soan=<doiTacId>
   (soạn sẵn cho một đối tác). Thêm việc: #viec?them=1.
   ===================================================================== */
"use strict";
(function () {

/* Mốc của khối 4, đặt ĐÚNG MỘT LẦN cho mỗi phiên mở trình duyệt. Đọc lại
   localStorage sau mỗi lần vẽ thì khối 4 tự rỗng ngay sau cú bấm đầu
   tiên, và người dùng mất luôn danh sách vừa nhìn thấy. */
var MOC = {};
var MO_HET = false;      /* khối 1 đã bung quá bảy dòng chưa */
var CAP1 = 7;

var TUAN = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

var CHU = {
  vi: {
    nav: 'Hôm nay', h1: 'Hôm nay',
    mo: 'Hôm nay ai cần gì ở bạn, và đội đã làm xong được gì. Thứ tự các dòng do lõi xếp và giữ nguyên cả ngày.',
    soanTb: 'Soạn thông báo', themViec: 'Thêm việc',
    k1: 'Cần bạn hôm nay', k2: 'Việc bạn đang chạy', k3: 'Đang chờ bên ngoài',
    k4: 'Mới về từ đối tác', k5: 'Đội đã làm hôm nay', k6: 'Lâu chưa có tin',
    k7: 'Sắp tới', k8: 'Toàn đội',
    cDoiTac: 'Đối tác', cViec: 'Việc', cBuoc: 'Bước tiếp', cHan: 'Hạn bước tiếp', cCapNhat: 'Cập nhật lần cuối',
    chuaDat: 'chưa đặt bước tiếp', chuaCoHan: 'chưa có hạn', soViec: 'Mở sổ việc của tôi',
    nhanViec: 'Nhận việc', moViec: 'Mở việc', nhacLai: 'Nhắc lại', goi: 'Gọi',
    lauQua: 'Chờ đã lâu, cân nhắc gọi trực tiếp.',
    conDong: 'việc nữa · Xem tất cả',
    xongTieuDe: 'Hết việc cần bạn hôm nay.',
    xongViec: 'việc đã xong', xongTb: 'thông báo đã gửi', xongLl: 'cuộc liên lạc',
    xongDoi: 'Cả đội cũng không còn việc quá hạn.', xemTuan: 'Xem lại tuần này',
    k2Trong: 'Việc bạn nhận sẽ hiện ở đây.', k2TrongMo: 'Nhận một việc ở khối trên là việc đó chuyển xuống khối này.',
    k6Trong: 'Mọi đối tác đều đã nhận tin trong 30 ngày qua.',
    k6TrongMo: 'Không có đối tác nào cần một dòng cập nhật hôm nay.',
    k7Trong: 'Mười bốn ngày tới chưa có mốc nào.',
    k7TrongMo: 'Hạn giao, ngày phát hành, sự kiện và ngày hết hạn hợp đồng sẽ hiện ở đây.',
    sang: 'Ngày mới bắt đầu. Việc đội làm hôm nay sẽ hiện ở đây.',
    m8Moi: 'Việc mới tuần này', m8Xong: 'Việc đã xong tuần này', m8Chay: 'Việc đang chạy',
    m8ImLang: 'Đối tác lâu chưa có tin',
    daNhan: 'Đã nhận việc', daChuyen: 'Đã đánh dấu bảng kê đã chuyển khoản'
  }
};
function T(k) { return (CHU[HT.lang] || CHU.vi)[k] || k; }

/* Lỗi lõi ném ra là MÃ MÁY. Dội thẳng nó lên toast thì người dùng đọc
   "khong-thay-viec" và không biết làm gì tiếp. Mỗi mã một câu tiếng Việt,
   và câu nào cũng nói bước tiếp theo. */
function loiNguoi(err) {
  var m = String(err && err.message || '');
  return { 'khong-thay-viec': 'Việc này vừa bị đổi hoặc đã xong. Tải lại trang là danh sách đúng trở lại.',
    'khong-thay-nhan-su': 'Không tìm thấy người này.',
    'khong-thay-bang-ke': 'Bảng kê này vừa được cập nhật. Mở lại tab Bảng kê để xem bản mới.',
    'chi-quan-ly': 'Việc này cần quyền quản lý. Nhờ giám đốc hoặc trưởng bộ phận làm giúp.',
    'thieu-doi-tac': 'Chưa chọn đối tác nào.'
  }[m] || 'Chưa làm được việc này. Tải lại trang rồi thử lại, nếu vẫn vậy thì báo người quản trị.';
}

/* ---- tiện ích nhỏ ---- */
function tenNgan(ten) { return String(ten || '').split(' ').pop(); }
/* Lõi ghi giờ không đệm số 0 ("9:22"), nên so chuỗi thô thì 9 giờ sáng
   đứng trên 17 giờ. Đệm lại một lần, dùng cho cả sắp xếp lẫn hiển thị. */
function gio2(luc) {
  var t = String(luc || '').slice(11).split(':');
  var h = t[0] || '0', m = t[1] || '0';
  if (h.length < 2) h = '0' + h;
  if (m.length < 2) m = '0' + m;
  return h + ':' + m;
}
function khoaLuc(luc) { return String(luc || '').slice(0, 10) + ' ' + gio2(luc); }
function nut(nhan, khoa, gt, kieu) {
  return '<button type="button" class="btn sm' + (kieu ? ' ' + kieu : '') + '" data-' + khoa + '="' + HM.esc(gt) + '">' + HM.esc(nhan) + '</button>';
}
function so(chu, ma) {
  return '<button type="button" class="btn link" data-so="' + HM.esc(ma) + '">' + HM.esc(chu) + '</button>';
}
/* Đối tác chưa có dòng liên lạc nào thì lõi trả về số ngày tính từ lúc
   tạo hồ sơ, ra những con số bốn chữ số vô nghĩa. Nói đúng sự thật ngắn
   hơn: chưa ghi liên lạc nào. */
function cauImLang(g) {
  if (!g.lanCuoi) return 'Chưa ghi liên lạc nào với <b>' + HM.esc(g.ten) + '</b>.';
  return 'Đã ' + g.soNgay + ' ngày chưa có tin nào tới <b>' + HM.esc(g.ten) + '</b>.';
}
function dauTuan(A, ngayISO, thu) {
  var i = TUAN.indexOf(thu); if (i < 0) i = 1;
  return A.themNgay(ngayISO, -(i === 0 ? 6 : i - 1));
}

/* =====================================================================
   Đầu trang · một câu tình hình, hai nút, không gì khác
   ===================================================================== */
function dauTrang(c, hn) {
  var A = c.A;
  var canToi = hn.canToi.length, dangChay = hn.dangChay.length, doi = hn.deme.dangMo;
  var cau = HM.esc(hn.thu) + ', ' + HM.esc(A.ngayVi(hn.ngay)) + '. ';
  /* "và 0 việc đang chạy" là một mệnh đề nói về cái không tồn tại. Bỏ nó
     đi thì câu ngắn hơn và không ai phải đọc một con số không. */
  if (canToi && dangChay) cau += 'Có ' + so(canToi + ' việc', 'cuaToi') + ' cần bạn hôm nay và ' + so(dangChay + ' việc', 'doi') + ' đang chạy.';
  else if (canToi) cau += 'Có ' + so(canToi + ' việc', 'cuaToi') + ' cần bạn hôm nay.';
  else if (doi) cau += 'Không có việc nào cần bạn hôm nay. Đội đang giữ ' + so(doi + ' việc', 'doi') + '.';
  else cau += 'Hôm nay chưa có việc nào đến hạn.';
  var nutTrang = '<button type="button" class="btn pri" data-di="thong-bao" data-loc-soan="moi">' + HM.esc(T('soanTb')) + '</button>' +
    '<button type="button" class="btn" data-di="viec" data-loc-them="1">' + HM.esc(T('themViec')) + '</button>';
  return HM.dau({ h1: HM.esc(T('h1')), mo: HM.esc(T('mo')), nut: nutTrang }) + '<p class="say">' + cau + '</p>';
}

/* =====================================================================
   Khối 1 · Cần bạn hôm nay
   Chỗ duy nhất trong sản phẩm đòi hỏi công việc. Một dòng là một câu
   tiếng Việt đọc được và đúng một nút; r.cau là HTML lõi sinh nên chèn
   thẳng, phần còn lại escape.
   ===================================================================== */
function dongCanToi(c, r, i) {
  var A = c.A, n = r.nut || {};
  /* Chỉ gắn nhãn "Hạn" khi con số ĐÚNG LÀ một cái hạn. Hàng đợi bảng kê
     mang ngày tải lên, không phải hạn; gọi nó là hạn thì người đọc tin
     một cái hạn không tồn tại. Không chắc thì không gắn nhãn gì cả. */
  var khi = '';
  /* Câu đã nói "quá hạn phản hồi 19 ngày" thì cái chip "Hạn 18/8" bên
     dưới không thêm thông tin nào, chỉ thêm một lần nhắc nữa. Nêu hậu
     quả đúng một lần, ở nơi có nút xử lý. */
  var cauDaCoNgay = /quá hạn|hôm nay|ngày/.test(String(r.cau));
  if (r.nhanNgay && !cauDaCoNgay) khi = HM.tag('Hạn ' + r.nhanNgay, 'warn');
  else if (!cauDaCoNgay && r.viecId && r.ngay && String(r.ngay).slice(0, 10) !== A.homNay())
    khi = HM.esc('Hạn ' + A.ngayGonVi(r.ngay));
  return '<div class="d' + (r.bac <= 1 ? ' tre' : '') + '">' +
    '<span class="n">' + (i + 1) + '</span>' +
    '<div class="c">' + r.cau + (khi ? '<span class="khi">' + khi + '</span>' : '') + '</div>' +
    '<div class="btnrow">' + nut(n.nhan || T('moViec'), 'lam', String(i)) + '</div>' +
    '</div>';
}
function khoi1(c, hn) {
  var ds = hn.canToi;
  if (!ds.length) return khoi1Xong(c, hn);
  var het = MO_HET || ds.length <= CAP1;
  var hien = het ? ds : ds.slice(0, CAP1);
  var than = '<div class="hang">' + hien.map(function (r, i) { return dongCanToi(c, r, i); }).join('') + '</div>';
  var chan = het ? '' : '<button type="button" class="btn link" data-bung="1">Còn ' + (ds.length - CAP1) + ' ' + HM.esc(T('conDong')) + '</button>';
  return HM.the({ h2: HM.esc(T('k1')), than: than, thoBody: true, chan: chan });
}
/* Hết việc là tin vui, và phải trông ra tin vui: con số trong ngày của
   chính người đang đọc, cộng ĐÚNG MỘT gợi ý, không phải một danh sách. */
function khoi1Xong(c, hn) {
  var t = hn.cuaToiHomNay, g = hn.imLang[0], moTa, nutXong;
  if (g) {
    moTa = cauImLang(g) + ' Gửi một dòng cập nhật?';
    nutXong = '<button type="button" class="btn pri" data-di="thong-bao" data-loc-soan="' + HM.esc(g.doiTacId) + '">' + HM.esc(T('soanTb')) + '</button>';
  } else {
    moTa = HM.esc(T('xongDoi'));
    nutXong = '<button type="button" class="btn" data-so="tuan">' + HM.esc(T('xemTuan')) + '</button>';
  }
  return HM.the({ thoBody: true, than: HM.trong({
    xong: true, tieuDe: T('xongTieuDe'), moTaHtml: moTa, nut: nutXong,
    /* Chỉ khoe những con số khác không. Một thẻ khen mà có "0 việc đã
       xong" trong đó thì nó thôi là lời khen. */
    diem: [{ n: t.viec, l: T('xongViec') }, { n: t.thongBao, l: T('xongTb') }, { n: t.lienLac, l: T('xongLl') }]
      .filter(function (x) { return x.n > 0; })
  }) });
}

/* =====================================================================
   Khối 2 · Việc bạn đang chạy
   Bảng gọn, đã sắp theo hạn bước tiếp từ lõi. Cũ quá bảy ngày thì nhắc
   nhẹ bằng một nhãn xám, không phải một lời cảnh báo.
   ===================================================================== */
function khoi2(c, hn) {
  var A = c.A, ds = hn.dangChay;
  if (!ds.length) return HM.the({ h2: HM.esc(T('k2')), thoBody: true,
    than: HM.trong({ tieuDe: T('k2Trong'), moTa: T('k2TrongMo') }) });
  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(T('cDoiTac')) + '</th><th>' + HM.esc(T('cViec')) + '</th><th>' + HM.esc(T('cBuoc')) + '</th>' +
    '<th>' + HM.esc(T('cHan')) + '</th><th>' + HM.esc(T('cCapNhat')) + '</th></tr></thead><tbody>' +
    ds.slice(0, 8).map(function (v) {
      var bt = v.buocTiep, cu = v.capNhatLuc ? A.cachNgay(v.capNhatLuc) : null;
      return '<tr class="pick" data-di="viec" data-loc-id="' + HM.esc(v.id) + '">' +
        '<td>' + HM.esc(v.doiTacTen) + '</td>' +
        '<td><div class="t-ttl">' + HM.esc(v.tieuDe) + '</div>' + HM.tag(v.dichVuTen) + '</td>' +
        '<td>' + (bt ? HM.esc(HM.dai(bt.viec, 52)) : '<span class="muted">' + HM.esc(T('chuaDat')) + '</span>') + '</td>' +
        '<td>' + (bt && bt.hanNgay ? HM.esc(A.ngayGonVi(bt.hanNgay)) : '<span class="muted">' + HM.esc(T('chuaCoHan')) + '</span>') + '</td>' +
        '<td>' + (v.capNhatLuc ? HM.esc(A.ngayGonVi(v.capNhatLuc)) : '') +
          (cu != null && cu > 7 ? ' ' + HM.tag('chưa cập nhật ' + cu + ' ngày') : '') + '</td>' +
        '</tr>';
    }).join('') + '</tbody></table></div>';
  return HM.the({ h2: HM.esc(T('k2')), than: than, thoBody: true,
    chan: '<button type="button" class="btn link" data-so="cuaToi">' + HM.esc(T('soViec')) + '</button>' });
}

/* =====================================================================
   Khối 3 · Đang chờ bên ngoài
   Thu gọn sẵn, đếm trơn, không bao giờ tô màu: chờ người khác không phải
   lỗi của nhân viên, kể cả khi đã chờ ba mươi ngày.
   ===================================================================== */
function khoi3(c, hn) {
  var A = c.A, ds = hn.choBenNgoai;
  if (!ds.length) return '';
  var dong = ds.map(function (v) {
    var cho = (v.canDoiTac && v.canDoiTac.viec) || (v.buocTiep && v.buocTiep.viec) || v.tieuDe;
    var ngay = v.capNhatLuc ? A.cachNgay(v.capNhatLuc) : 0;
    var dt = A.doiTac.get(v.doiTacId), lh = dt && dt.lienHe && dt.lienHe[0];
    var them = '';
    if (ngay > 14 && lh && lh.dienThoai) {
      them = '<span class="khi">' + HM.esc(T('lauQua')) + ' ' +
        '<a href="tel:' + HM.esc(String(lh.dienThoai).replace(/\s/g, '')) + '">' + HM.esc(T('goi') + ' ' + lh.dienThoai) + '</a></span>';
    }
    return '<div class="d"><div class="c">' + HM.esc(cho) + ' · <b>' + HM.esc(v.doiTacTen) + '</b> · đã chờ ' + ngay + ' ngày.' + them + '</div>' +
      '<div class="btnrow"><button type="button" class="btn sm" data-di="thong-bao" data-loc-soan="' + HM.esc(v.doiTacId) + '">' + HM.esc(T('nhacLai')) + '</button></div></div>';
  }).join('');
  return HM.the({ than: '<details class="hoc"><summary>' + HM.esc(T('k3') + ' (' + ds.length + ')') + '</summary>' +
    '<div><div class="hang">' + dong + '</div></div></details>' });
}

/* =====================================================================
   Khối 4 · Mới về từ đối tác
   Hồ sơ mới nghĩa là đối tác gửi việc tới, nên đây là tin tốt: đếm trơn,
   không màu. Không có gì mới thì ẩn hẳn khối, không hiện trạng thái rỗng.
   ===================================================================== */
function docMoi(A, meId) {
  var khoa = 'haustek.homnay.lanCuoi.' + meId;
  if (MOC[meId] === undefined) {
    try { MOC[meId] = localStorage.getItem(khoa) || ''; } catch (e) { MOC[meId] = ''; }
    try { localStorage.setItem(khoa, A.bayGio()); } catch (e2) {}
  }
  return { tuLuc: MOC[meId], ds: A.moiVeTuDoiTac(MOC[meId] || null) };
}
function khoi4(c, moi) {
  var A = c.A, ds = moi.ds.slice(0, 6);
  if (!ds.length) return '';
  var phu = moi.tuLuc
    ? 'Đối tác gửi tới từ ' + A.ngayGonVi(moi.tuLuc) + ' lúc ' + A.gioVi(moi.tuLuc) + '.'
    : 'Đối tác gửi tới gần đây.';
  var dong = ds.map(function (m, i) {
    var d = m.dong;
    var b = m.chuaGan && m.viecId
      ? nut(T('nhanViec'), 'moi4', String(i))
      : (m.viecId ? '<button type="button" class="btn sm" data-di="viec" data-loc-id="' + HM.esc(m.viecId) + '">' + HM.esc(T('moViec')) + '</button>' : '');
    return '<div class="d"><div class="c"><b>' + HM.esc(m.doiTacTen) + '</b> · ' + HM.esc(HM.dai(d.tieuDe, 96)) +
      '<span class="khi">' + HM.esc(gio2(d.luc) + ' ngày ' + A.ngayGonVi(d.luc) +
        (m.viecTieuDe && m.viecTieuDe !== d.tieuDe ? ' · ' + m.viecTieuDe : '')) + '</span></div>' +
      (b ? '<div class="btnrow">' + b + '</div>' : '') + '</div>';
  }).join('');
  return HM.the({ h2: HM.esc(T('k4') + ' (' + moi.ds.length + ')'), thoBody: true,
    than: '<div class="card-b"><p class="say">' + HM.esc(phu) + '</p></div><div class="hang">' + dong + '</div>' });
}

/* =====================================================================
   Khối 5 · Đội đã làm hôm nay
   Khối duy nhất trong sản phẩm có nền màu. Đây là lý do trang này đọc ra
   tích cực: danh sách trên ngắn dần trong khi khối này dài ra.
   ===================================================================== */
function chipDoi(A, d) {
  var ra = [];
  (d.dsViec || []).forEach(function (v) {
    var ns = A.nhanSu.get(v.nguoiPhuTrachId), dt = A.doiTac.get(v.doiTacId);
    ra.push({ luc: v.xongLuc, chu: tenNgan(ns ? ns.ten : '') + ' đã xong ' + v.tieuDe, dt: dt ? dt.ten : '' });
  });
  (d.dsThongBao || []).forEach(function (t) {
    var ns = A.nhanSu.get(t.nguoiGuiId);
    ra.push({ luc: t.guiLuc, chu: tenNgan(ns ? ns.ten : '') + ' đã gửi thông báo · ' + t.tieuDe, dt: '' });
  });
  (d.dsLienLac || []).forEach(function (x) {
    var dt = A.doiTac.get(x.doiTacId);
    ra.push({ luc: x.luc, chu: x.tieuDe, dt: dt ? dt.ten : '' });
  });
  return ra.sort(function (a, b) { return khoaLuc(a.luc) < khoaLuc(b.luc) ? 1 : -1; }).slice(0, 5);
}
function khoi5(c, hn) {
  var A = c.A, d = hn.daXongHomNay, tuan = hn.daXongTuanNay;
  var trong = !d.viec && !d.thongBao && !d.lienLac;
  var gio = +String(A.bayGio()).slice(11, 13);
  var cau;
  if (trong && gio >= 17) cau = 'Tuần này đội đã xong ' + so(tuan.viec + ' việc', 'xong') + '.';
  else if (trong) cau = HM.esc(T('sang'));
  else {
    /* Chỉ kể những thứ THẬT SỰ có. "gửi 0 thông báo" là một mệnh đề nói về
       cái không xảy ra, và nó làm câu khoe thành câu kiểm điểm. */
    var y = [];
    if (d.viec) y.push('xong ' + so(String(d.viec), 'xong') + ' việc');
    if (d.thongBao) y.push('gửi ' + so(String(d.thongBao), 'thongBao') + ' thông báo');
    if (d.lienLac) y.push('ghi ' + so(String(d.lienLac), 'lienLac') + ' cuộc liên lạc');
    cau = 'Hôm nay đội đã ' + (y.length > 1 ? y.slice(0, -1).join(', ') + ' và ' + y[y.length - 1] : y[0]) + '.';
  }
  var chips = chipDoi(A, d);
  var than = '<div class="tomtat">' + cau + '</div>' +
    (chips.length ? '<div class="chips">' + chips.map(function (m) {
      return '<span class="chip"><b>' + HM.esc(gio2(m.luc)) + '</b>' + HM.esc(HM.dai(m.chu, 68) + (m.dt ? ' · ' + m.dt : '')) + '</span>';
    }).join('') + '</div>' : '');
  return HM.the({ h2: HM.esc(T('k5')), than: than });
}

/* =====================================================================
   Khối 6 · Lâu chưa có tin
   Khối làm nhân viên mở portal vào một ngày không có việc gấp, nên nó
   nằm trên trang chủ của mọi vai. Không ô số nào đếm khối này.
   ===================================================================== */
function khoi6(c, hn) {
  var A = c.A, ds = hn.imLang.slice(0, 5);
  if (!ds.length) return HM.the({ h2: HM.esc(T('k6')), thoBody: true,
    than: HM.trong({ xong: true, tieuDe: T('k6Trong'), moTa: T('k6TrongMo') }) });
  var dong = ds.map(function (g) {
    var khi = g.lanCuoi ? 'Lần cuối ' + A.ngayGonVi(g.lanCuoi) + (g.tomTat ? ' · ' + HM.dai(g.tomTat, 60) : '')
      : 'Nhịp cập nhật của dịch vụ đối tác này mua là ' + g.nhip + ' ngày.';
    return '<div class="d"><div class="c">' + cauImLang(g) + ' Gửi một dòng cập nhật?' +
      '<span class="khi">' + HM.esc(khi) + '</span></div>' +
      '<div class="btnrow"><button type="button" class="btn sm" data-di="thong-bao" data-loc-soan="' + HM.esc(g.doiTacId) + '">' + HM.esc(T('soanTb')) + '</button></div></div>';
  }).join('');
  return HM.the({ h2: HM.esc(T('k6')), than: '<div class="hang">' + dong + '</div>', thoBody: true });
}

/* =====================================================================
   Khối 7 · Sắp tới · mười bốn ngày, bốn nguồn, không tô màu dòng nào
   ===================================================================== */
function khoi7(c, hn) {
  var A = c.A, ds = hn.sapToi.slice(0, 5);
  if (!ds.length) return HM.the({ h2: HM.esc(T('k7')), thoBody: true,
    than: HM.trong({ tieuDe: T('k7Trong'), moTa: T('k7TrongMo') }) });
  var dong = ds.map(function (x) {
    return '<div class="d"><div class="c"><b>' + HM.esc(A.ngayGonVi(x.ngay)) + '</b> · ' + HM.esc(x.cau) +
      (x.doiTacTen ? ' · ' + HM.esc(x.doiTacTen) : '') + '</div></div>';
  }).join('');
  return HM.the({ h2: HM.esc(T('k7')), than: '<div class="hang">' + dong + '</div>', thoBody: true });
}

/* =====================================================================
   Khối 8 · Dải quản lý · cuối trang, không màu
   Cặp "mới / đã xong" chính là thế cân bằng; không có thẻ nào tên là
   "Quá hạn và Khẩn".
   ===================================================================== */
function khoi8(c, hn) {
  var A = c.A, t0 = dauTuan(A, hn.ngay, hn.thu);
  var moiTuan = A.viec.list({}).filter(function (v) { return v.moLuc && String(v.moLuc).slice(0, 10) >= t0; }).length;
  /* Dùng ĐÚNG danh sách của khối 6, không tự đặt ngưỡng 30 ngày riêng.
     Hai con số cùng tên mà khác ngưỡng, nằm cách nhau một màn hình, là
     cách chắc chắn nhất để người đọc thôi tin cả hai. */
  var im30 = hn.imLang.length;
  return HM.the({ h2: HM.esc(T('k8')), than: HM.kv([
    { t: T('m8Moi'), v: so(String(moiTuan), 'moi'), vHtml: true },
    { t: T('m8Xong'), v: so(String(hn.daXongTuanNay.viec), 'xong'), vHtml: true },
    { t: T('m8Chay'), v: so(String(hn.deme.dangMo), 'doi'), vHtml: true },
    { t: T('m8ImLang'), v: so(String(im30), 'imLang'), vHtml: true }
  ]) });
}

/* =====================================================================
   Sự kiện
   ===================================================================== */
function ganSuKien(root, c, hn, moi, me) {
  var A = c.A;

  HM.bam(root, '[data-so]', function (el) {
    var k = el.getAttribute('data-so');
    if (k === 'cuaToi') c.di('viec', { nguoiPhuTrachId: me.id, trangThai: 'dang-mo' });
    else if (k === 'doi') c.di('viec', { trangThai: 'dang-mo' });
    else if (k === 'moi') c.di('viec', { trangThai: 'moi' });
    else if (k === 'thongBao') c.di('thong-bao', { tab: 'da-gui' });
    else if (k === 'lienLac') c.di('doi-tac', {});
    else if (k === 'imLang') c.di('doi-tac', { imLang: '1' });
    else c.di('viec', { trangThai: 'xong' });
  });

  HM.bam(root, '[data-bung]', function () { MO_HET = true; c.veLai(); });

  /* Một dòng khối 1 xử lý xong thì biến khỏi khối 1 và số trong câu tình
     hình giảm đi một. Đó là toàn bộ cơ chế tích cực của trang. */
  HM.bam(root, '[data-lam]', function (el) {
    var r = hn.canToi[+el.getAttribute('data-lam')];
    if (!r) return;
    var h = (r.nut || {}).hanh;
    try {
      if (h === 'nhan') { A.viec.nhan(r.viecId); c.thongBao(T('daNhan') + ' · ' + r.doiTacTen, 'ok'); c.veLai(); return; }
      if (h === 'chuyen') { A.bangKe.danhDauDaChuyen(r.nut.id, A.homNay()); c.thongBao(T('daChuyen'), 'ok'); c.veLai(); return; }
      /* Lõi còn trả di:'thanh-toan', là tên trang v2 đã bị gỡ. Bảng kê
         nay nằm ở tab Bảng kê của trang thong-bao, nên đổi hướng ở đây
         để nút không dẫn vào một trang không tồn tại. */
      if (h === 'di') {
        if (r.di === 'thanh-toan') c.di('thong-bao', { tab: 'bang-ke' });
        else c.di(r.di || 'viec', {});
        return;
      }
      c.di('viec', { id: r.viecId });
    } catch (e) { c.thongBao(loiNguoi(e), 'warn'); }
  });

  HM.bam(root, '[data-moi4]', function (el) {
    var m = moi.ds[+el.getAttribute('data-moi4')];
    if (!m || !m.viecId) return;
    try { A.viec.nhan(m.viecId); c.thongBao(T('daNhan') + ' · ' + m.doiTacTen, 'ok'); c.veLai(); }
    catch (e) { c.thongBao(loiNguoi(e), 'warn'); }
  });
}

/* =====================================================================
   Đăng ký
   ===================================================================== */
HT.dangKy({
  id: 'hom-nay', nav: 'Hôm nay', icon: 'cal',
  chu: CHU,
  khaDung: function (c) { return !!c.A; },
  /* Ba mức, không có mức thứ tư và không có màu đỏ: quá hạn là một sự
     thật cần nói, không phải một tai nạn cần hét. */
  dem: function (c) {
    if (!c.A) return null;
    var A = c.A, ds = A.homNayCua(A.nhanSu.toi.id).canToi, hnay = A.homNay();
    var muc = 'thuong';
    if (ds.some(function (r) { return r.bac <= 1; })) muc = 'tre';
    else if (ds.some(function (r) { return String(r.ngay).slice(0, 10) === hnay; })) muc = 'hom-nay';
    return { n: ds.length, muc: muc };
  },
  ve: function (root, c) {
    var A = c.A, me = A.nhanSu.toi;
    var hn = A.homNayCua(me.id);
    var moi = docMoi(A, me.id);
    if (hn.canToi.length <= CAP1) MO_HET = false;
    root.innerHTML =
      dauTrang(c, hn) +
      khoi1(c, hn) +
      khoi2(c, hn) +
      khoi3(c, hn) +
      khoi4(c, moi) +
      khoi5(c, hn) +
      khoi6(c, hn) +
      khoi7(c, hn) +
      (me.vai === 'quan-ly' ? khoi8(c, hn) : '');
    ganSuKien(root, c, hn, moi, me);
  }
});

})();
