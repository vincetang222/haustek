/* =====================================================================
   NỘI BỘ · ĐỐI TÁC
   ---------------------------------------------------------------------
   Danh sách xếp theo "ai lâu nhất chưa có tin", vì đó là câu hỏi duy
   nhất mà một danh sách đối tác trả lời được mà chỗ khác không trả lời
   được. Xếp theo tên thì chỉ là một quyển danh bạ.

   Trang một đối tác là trái tim của phần mềm này: một dòng thời gian
   hợp nhất, mọi thứ đã xảy ra giữa Haustek và họ, theo thứ tự, không
   tab, không lọc bắt buộc. Trên nó là MỘT ĐOẠN VĂN tiếng Việt kể lại
   quan hệ, đặt trên mọi con số. Dưới nó là ô soạn luôn hiện.

   Công tắc "Chỉ những dòng đối tác thấy" là một tính năng an toàn, không
   phải một bộ lọc tiện tay: người viết ghi chú nội bộ phải nhìn tận mắt
   được cái đối tác sẽ đọc, trước khi gõ thêm câu nào.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };
var CHI_THAY = false;        /* công tắc "chỉ dòng đối tác thấy" */
var SOAN = 'lien-lac';       /* tab ô soạn đang mở */
/* Dòng thời gian mở ra HAI MƯƠI dòng. Đổ hết một lúc thì trang cao tám
   nghìn điểm ảnh, và cái đáng đọc nhất (mấy dòng gần đây) chìm nghỉm
   giữa lịch sử ba năm. Bấm là dài thêm. */
var SO_DONG = 20;

var SOAN_TAB = [
  { k: 'lien-lac', l: 'Ghi liên lạc' },
  { k: 'nhan',     l: 'Nhắn cho đối tác' },
  { k: 'ghi-chu',  l: 'Ghi chú nội bộ' },
  { k: 'tom-tat',  l: 'Sửa tóm tắt' }
];
var KENH = [['goi', 'Gọi điện'], ['zalo', 'Nhắn Zalo'], ['email', 'Gửi email'], ['gap', 'Gặp trực tiếp']];
var KET_QUA = [['da-chot', 'Đã chốt'], ['cho-doi-tac', 'Chờ đối tác'], ['goi-lai', 'Cần gọi lại']];

var TEN_LOAI = { 'ghi-chu': 'Ghi chú nội bộ', 'lien-lac': 'Liên lạc', 'tin-nhan': 'Tin nhắn',
  'thong-bao': 'Thông báo', 'trang-thai': 'Trạng thái', 'moc': 'Mốc', 'bang-ke': 'Bảng kê', 'tep': 'Tệp' };

var NGOAI = [
  { k: 'onerpm',  ten: 'OneRPM',      url: 'https://app.onerpm.com' },
  { k: 'believe', ten: 'Believe',     url: 'https://backstage.believe.com' },
  { k: 'warner',  ten: 'Warner',      url: 'https://www.wmg.com' },
  { k: 'ytcms',   ten: 'YouTube CMS', url: 'https://studio.youtube.com' }
];

function chonHtml(khoa, ds, gt) {
  return '<select class="in" ' + khoa + '>' + ds.map(function (x) {
    return '<option value="' + e(x[0]) + '"' + (x[0] === gt ? ' selected' : '') + '>' + e(x[1]) + '</option>';
  }).join('') + '</select>';
}

/* =====================================================================
   Câu tóm tắt quan hệ · sinh từ dữ liệu, đặt TRÊN mọi con số
   ---------------------------------------------------------------------
   Đây là thứ chủ sở hữu đọc đầu tiên mỗi lần mở một đối tác, nên nó phải
   là một đoạn văn đọc được, không phải bốn ô số ghép lại.
   ===================================================================== */
function cauQuanHe(A, d) {
  var cau = [];
  /* Người đã tự viết tóm tắt thì không nhắc lại chuyện họ vừa viết. Hai câu
     nói cùng một thứ nằm cạnh nhau đọc như phần mềm không nghe ai cả. */
  if (!d.tomTat) {
    var nam = A.cachNgay(d.hopDong.tuNgay);
    var lauCau = nam >= 730 ? Math.round(nam / 365) + ' năm' : nam >= 60 ? Math.round(nam / 30) + ' tháng' : nam + ' ngày';
    var dv = d.dichVu.map(function (x) { return A.dvCua(x).vi.toLowerCase(); });
    cau.push('Đồng hành ' + lauCau + ', từ ' + A.ngayVi(d.hopDong.tuNgay) + '.');
    if (dv.length === 1) cau.push('Haustek làm ' + dv[0] + ' cho họ.');
    else if (dv.length) cau.push('Haustek làm ' + dv.slice(0, -1).join(', ') + ' và ' + dv[dv.length - 1] + ' cho họ.');
  }

  var mo = d.viecDangMo.length;
  if (!mo) cau.push('Hiện không có việc nào đang chạy.');
  else {
    var gap = d.viecDangMo.filter(function (v) { return v.treHanPhanHoi || v.treBuocTiep; });
    cau.push('Đang có ' + mo + ' việc chạy' + (gap.length ? ', trong đó ' + gap.length + ' việc đã quá hạn' : '') + '.');
  }
  var cho = d.canDoiTac.length;
  if (cho) {
    var g0 = d.canDoiTac[0];
    cau.push('Haustek đang chờ họ ' + g0.viec.toLowerCase() + (cho > 1 ? ' và ' + (cho - 1) + ' việc nữa' : '') +
      ', đã chờ ' + g0.soNgayCho + ' ngày.');
  }
  if (d.lienLacCuoi) {
    cau.push('Lần cuối nói chuyện là ' + A.ngayVi(d.lienLacCuoi.luc) + ', ' + A.cachNgay(d.lienLacCuoi.luc) + ' ngày trước.');
  } else {
    cau.push('Chưa ai ghi lại cuộc liên lạc nào với họ.');
  }
  if (d.conHan != null && d.conHan < 0) cau.push('Hợp đồng đã hết hạn ' + A.ngayVi(d.hopDong.denNgay) + '.');
  else if (d.conHan != null && d.conHan <= 60) cau.push('Hợp đồng còn ' + d.conHan + ' ngày.');
  return cau.join(' ');
}

/* =====================================================================
   Danh sách
   ===================================================================== */
function veDanhSach(root, c) {
  var A = c.A, loc = c.loc;
  var ds = A.doiTac.list({ q: loc.q, nguoiPhuTrachId: loc.nguoiPhuTrachId, dichVu: loc.dichVu });
  /* Xếp theo lâu nhất chưa có tin. Một danh sách đối tác xếp theo tên chỉ
     là quyển danh bạ; xếp thế này thì nó tự nói ra việc phải làm.
     Người chưa ghi liên lạc nào xếp cuối: chưa biết thì chưa gấp bằng
     biết là đã lâu. */
  ds = ds.slice().sort(function (a, b) {
    if (a.chuaGhiLienLac !== b.chuaGhiLienLac) return a.chuaGhiLienLac ? 1 : -1;
    return (b.ngayImLang || 0) - (a.ngayImLang || 0);
  });

  var st = HM.nho(A, 'doi-tac.trang', function () { return { trang: 0 }; });
  var tr = HM.phanTrang(ds, st, 20);

  var boLoc = '<div class="fldrow" style="margin-bottom:12px">' +
    '<input class="in" data-tim placeholder="Tìm theo tên đối tác" value="' + e(loc.q || '') + '" style="max-width:260px">' +
    chonHtml('data-loc-nguoi style="max-width:210px"',
      [['', 'Tất cả người phụ trách']].concat(A.nhanSu.list().map(function (n) { return [n.id, n.ten]; })), loc.nguoiPhuTrachId || '') +
    chonHtml('data-loc-dv style="max-width:230px"',
      [['', 'Tất cả dịch vụ']].concat(A.dichVu.filter(function (x) { return !x.kyThuat; }).map(function (x) { return [x.id, x.vi]; })), loc.dichVu || '') +
    '</div>';

  var dong = tr.page.map(function (d) {
    var im = d.lienLacCuoi
      ? 'Nói chuyện lần cuối ' + A.cachNgay(d.lienLacCuoi.luc) + ' ngày trước · ' + HM.dai(d.lienLacCuoi.tomTat || '', 62)
      : 'Chưa ghi liên lạc nào';
    return '<div class="d" data-mo="' + e(d.id) + '">' +
      '<div class="c"><b>' + e(d.ten) + '</b> · ' + e(d.nguoiPhuTrachTen || 'chưa có người phụ trách') +
      ' · ' + e(d.dichVu.map(function (x) { return A.dvCua(x).vi; }).join(', ')) +
      '<span class="khi">' + e(im) +
      (d.soViecDangMo ? ' · ' + d.soViecDangMo + ' việc đang chạy' : ' · không có việc đang chạy') + '</span></div>' +
      '<div class="btnrow"><button type="button" class="btn sm" data-mo="' + e(d.id) + '">Mở</button></div>' +
      '</div>';
  }).join('');

  root.innerHTML = HM.dau({
    h1: 'Đối tác',
    mo: 'Xếp theo ai lâu nhất chưa nhận được tin từ Haustek. Trên cùng là người nên gọi hôm nay.',
    nut: '<button type="button" class="btn pri" data-them-dt>Thêm đối tác</button>'
  }) + boLoc +
    HM.the({ h2: ds.length + ' đối tác', thoBody: true,
      than: ds.length ? '<div class="hang">' + dong + '</div>' + tr.chan
        : HM.trong({ tieuDe: 'Không có đối tác nào khớp', moTa: 'Đổi từ khoá tìm hoặc bỏ bớt bộ lọc.' }) });

  HM.bam(root, '[data-mo]', function (el) { c.datLoc({ id: el.getAttribute('data-mo') }); });
  HM.ganTrang(root, st, c.veLai);
  HM.nhap(root, '[data-tim]', function (el) { c.datLoc({ q: el.value.trim() }); }, 350);
  HM.doi(root, '[data-loc-nguoi]', function (el) { c.datLoc({ nguoiPhuTrachId: el.value }); });
  HM.doi(root, '[data-loc-dv]', function (el) { c.datLoc({ dichVu: el.value }); });
  HM.bam(root, '[data-them-dt]', function () { themDoiTac(c); });
}

function themDoiTac(c) {
  var A = c.A;
  HM.hoiForm(c, {
    tieuDe: 'Thêm đối tác',
    moTa: 'Chỉ cần tên và người phụ trách. Những thứ còn lại điền dần khi biết.',
    fields: [
      { k: 'ten', l: 'Tên đối tác', req: true, rong: true },
      { k: 'loai', l: 'Loại', kieu: 'select', opts: [['label', 'Label'], ['nghe-si', 'Nghệ sĩ'], ['thuong-hieu', 'Thương hiệu']] },
      { k: 'nguoiPhuTrachId', l: 'Người phụ trách', kieu: 'select', opts: A.nhanSu.list().map(function (n) { return [n.id, n.ten]; }) },
      { k: 'lienHeTen', l: 'Người liên hệ' },
      { k: 'lienHeDienThoai', l: 'Điện thoại' }
    ]
  }).then(function (f) {
    if (!f) return;
    try {
      var d = A.doiTac.them({ ten: f.ten, loai: f.loai, nguoiPhuTrachId: f.nguoiPhuTrachId, dichVu: [] });
      if (f.lienHeTen) A.doiTac.themLienHe(d.id, { ten: f.lienHeTen, dienThoai: f.lienHeDienThoai });
      c.thongBao('Đã thêm ' + d.ten + '.', 'ok');
      c.datLoc({ id: d.id });
    } catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
  });
}

/* Lỗi lõi ném ra là mã máy. Đổi sang câu người đọc được, và câu nào cũng
   phải có bước tiếp theo, không phải chỉ nói cái gì sai. */
function loiNguoi(err) {
  var m = String(err && err.message || '');
  return { 'thieu-ten': 'Cần điền tên đối tác trước đã.',
    'chi-quan-ly': 'Việc này cần quyền quản lý. Nhờ giám đốc hoặc trưởng bộ phận làm giúp.',
    'thieu-doi-tac': 'Chưa chọn đối tác nào.',
    'thieu-noi-dung': 'Ô nội dung đang trống.',
    'thieu-tom-tat': 'Ghi một dòng vừa chốt được gì thì mới lưu được.',
    'email-khong-hop-le': 'Địa chỉ email chưa đúng dạng.',
    'email-da-co': 'Email này đã có tài khoản rồi.'
  }[m] || 'Chưa lưu được. Thử lại, nếu vẫn vậy thì báo người quản trị.';
}

/* =====================================================================
   Trang một đối tác
   ===================================================================== */
function veMot(root, c, id) {
  var A = c.A, d = A.doiTac.get(id);
  if (!d) { root.innerHTML = HM.trong({ tieuDe: 'Không tìm thấy đối tác này', moTa: 'Có thể đường dẫn đã cũ.', nut: '<button type="button" class="btn" data-ve-ds>Về danh sách</button>' }); HM.bam(root, '[data-ve-ds]', function () { c.datLoc({ id: '' }); }); return; }

  var ds = CHI_THAY ? A.dong.choDoiTac(id) : A.dong.theoDoiTac(id);
  var hien = ds.slice(0, SO_DONG);

  root.innerHTML =
    '<div class="nhandien">' + HM.bia(d.id, d.ten, 'md') +
      '<div class="ten"><h1>' + e(d.ten) + '</h1>' +
        '<div class="p">' + e(({ label: 'Label', 'nghe-si': 'Nghệ sĩ', 'thuong-hieu': 'Thương hiệu' })[d.loai] || d.loai) +
        ' · ' + e(d.dichVu.map(function (x) { return A.dvCua(x).vi; }).join(', ') || 'chưa gắn dịch vụ') +
        ' · phụ trách: ' + e(d.nguoiPhuTrach ? d.nguoiPhuTrach.ten : 'chưa có') + '</div></div>' +
      '<div class="btnrow">' +
        '<button type="button" class="btn" data-ve-ds>Về danh sách</button>' +
        '<button type="button" class="btn" data-xem-nhu="' + e(d.id) + '">Xem cổng như đối tác này</button>' +
      '</div></div>' +

    '<div class="tomtat">' + (d.tomTat ? e(d.tomTat) + ' ' : '') + e(cauQuanHe(A, d)) + '</div>' +

    '<div class="doi-2"><div>' +
      HM.so([
        { l: 'Việc đang chạy', v: d.viecDangMo.length, di: 'viec', loc: { doiTacId: d.id, tab: 'tat-ca' },
          s: d.viecDangMo.length ? d.viecDangMo.filter(function (v) { return v.treBuocTiep || v.treHanPhanHoi; }).length + ' việc quá hạn' : 'đã xong hết' },
        { l: 'Đối tác cần làm', v: d.canDoiTac.length,
          s: d.canDoiTac.length ? 'chờ ' + d.canDoiTac[0].soNgayCho + ' ngày' : 'không chờ gì' },
        d.bangKe.length ? { l: 'Bảng kê gần nhất', v: A.tien0(d.bangKe[0].soTien),
          s: 'kỳ ' + d.bangKe[0].ky + ' · theo bảng kê ' + d.bangKe[0].nguon +
             (d.bangKe[0].ngayChuyen ? ' · đã chuyển ' + A.ngayGonVi(d.bangKe[0].ngayChuyen) : ' · chưa chuyển') } : null,
        { l: 'Tệp đã gửi', v: d.tep.length, s: d.tep.length ? 'gần nhất ' + A.ngayGonVi(d.tep[0].taiLenLuc) : 'chưa gửi tệp nào' }
      ]) +
      HM.the({
        h2: 'Dòng thời gian',
        p: 'Mọi thứ đã xảy ra giữa Haustek và đối tác này, một cột, theo thứ tự thời gian.',
        hanhDong: '<label class="tickrow" style="font-size:12.5px"><input type="checkbox" data-chi-thay' + (CHI_THAY ? ' checked' : '') +
          '><span>Chỉ những dòng đối tác thấy</span></label>',
        thoBody: true,
        than: '<div class="card-b">' + (hien.length ? veDong(A, hien) :
          HM.trong({ tieuDe: 'Chưa có dòng nào ở đây', moTa: 'Ghi một cuộc liên lạc bên dưới là dòng đầu tiên xuất hiện.' })) +
          (ds.length > hien.length ? '<div class="btnrow" style="justify-content:center;margin-top:6px">' +
            '<button type="button" class="btn" data-them-dong>Xem thêm ' + Math.min(40, ds.length - hien.length) + ' dòng nữa</button></div>' : '') +
          '</div>' + veSoan(A, d),
      }) +
    '</div><div>' + veCotPhai(A, c, d) + '</div></div>';

  ganMot(root, c, d);
}

/* Dòng thời gian, gom theo ngày. Dựng bằng một mảng rồi join: một đối tác
   hai trăm dòng mà nối chuỗi trong vòng lặp thì trang giật thấy rõ. */
function veDong(A, ds) {
  var ra = ['<div class="dt">'], ngayTruoc = '';
  for (var i = 0; i < ds.length; i++) {
    var x = ds[i], ngay = String(x.luc).slice(0, 10);
    if (ngay !== ngayTruoc) {
      ngayTruoc = ngay;
      var nhan = ngay === A.homNay() ? 'Hôm nay' : A.thuTrongTuan(ngay) + ', ' + A.ngayVi(ngay);
      ra.push('<div class="ngay">' + e(nhan) + '</div>');
    }
    ra.push('<div class="m' + (x.hienChoDoiTac ? ' ta' : '') + '">' +
      '<div class="h"><b>' + e(x.tieuDe) + '</b>' +
        '<time>' + e(A.gioVi(x.luc)) + '</time>' +
        '<span class="ai">' + e(TEN_LOAI[x.loai] || x.loai) + (x.boi && x.boi.ten ? ' · ' + e(x.boi.ten) : '') + '</span>' +
        (x.hienChoDoiTac ? '' : '<span class="rieng">nội bộ</span>') +
      '</div>' +
      (x.noiDung ? '<p>' + e(x.noiDung) + '</p>' : '') +
      (x.daXem ? '<span class="dax">' + e(x.daXem.ten + ' đã xem ' + A.ngayGonVi(x.daXem.luc)) + '</span>' : '') +
      '</div>');
  }
  ra.push('</div>');
  return ra.join('');
}

/* Ô soạn ghim dưới dòng thời gian, LUÔN hiện. Ghi một cuộc gọi vừa xong
   phải mất vài giây; mở hộp thoại đã hết ba giây rồi. */
function veSoan(A, d) {
  var than, nut;
  if (SOAN === 'lien-lac') {
    than = '<div class="fldrow two-up">' +
      '<div class="fgrp"><label class="fld">Kênh</label>' + chonHtml('data-kenh', KENH, 'goi') + '</div>' +
      '<div class="fgrp"><label class="fld">Kết quả</label>' + chonHtml('data-ketqua', KET_QUA, 'da-chot') + '</div></div>' +
      '<textarea class="in" data-noi rows="2" placeholder="Vừa gọi ai, chốt được gì."></textarea>';
    nut = 'Ghi liên lạc';
  } else if (SOAN === 'nhan') {
    than = '<textarea class="in" data-noi rows="3" placeholder="Nội dung gửi cho ' + e(d.ten) + '."></textarea>';
    nut = 'Gửi cho đối tác';
  } else if (SOAN === 'ghi-chu') {
    than = '<textarea class="in" data-noi rows="3" placeholder="Ghi cho đồng nghiệp đọc. Đối tác không bao giờ thấy dòng này."></textarea>';
    nut = 'Lưu ghi chú';
  } else {
    than = '<textarea class="in" data-noi rows="3" placeholder="Một đoạn kể lại quan hệ với đối tác này.">' + e(d.tomTat || '') + '</textarea>';
    nut = 'Lưu tóm tắt';
  }
  var hint = SOAN === 'nhan' ? 'Dòng này đối tác đọc được ngay ở cổng của họ.'
    : SOAN === 'ghi-chu' ? 'Ghi chú nội bộ không có đường nào ra cổng đối tác.'
    : SOAN === 'tom-tat' ? 'Tóm tắt hiện ở đầu trang này, chỉ nội bộ đọc.'
    : 'Ghi lại để người sau không phải gọi lại hỏi cùng một câu.';
  return '<div class="soan">' + HM.tabs(SOAN_TAB, SOAN) + than +
    '<div class="ft"><span class="hint">' + e(hint) + '</span>' +
    '<button type="button" class="btn pri" data-luu>' + e(nut) + '</button></div></div>';
}

function veCotPhai(A, c, d) {
  var lh = (d.lienHe || []).map(function (x) {
    return '<div class="d" style="padding:10px 0;border-top:1px solid var(--line)">' +
      '<div class="c"><b>' + e(x.ten) + '</b>' + (x.laChinh ? ' ' + HM.tag('liên hệ chính', 'ok') : '') +
      '<span class="khi">' + e(x.vaiTro || '') + (x.gioTienGoi ? ' · gọi được ' + e(x.gioTienGoi).toLowerCase() : '') + '</span>' +
      '<span class="khi"><a href="tel:' + e(x.dienThoai) + '">' + e(x.dienThoai) + '</a>' +
        (x.email ? ' · <a href="mailto:' + e(x.email) + '">' + e(x.email) + '</a>' : '') + '</span></div></div>';
  }).join('');

  var mn = d.maNgoai || {};
  var ngoai = NGOAI.filter(function (n) { return mn[n.k]; }).map(function (n) {
    return '<a href="' + e(n.url) + '" target="_blank" rel="noopener">' + HM.icon('out') +
      '<span>' + e(n.ten) + '</span><em>' + e(mn[n.k]) + '</em></a>';
  }).join('');

  var viec = d.viecDangMo.slice(0, 8).map(function (v) {
    return '<div class="d" data-viec="' + e(v.id) + '" style="padding:9px 0;border-top:1px solid var(--line);cursor:pointer">' +
      '<div class="c">' + e(v.tieuDe) + '<span class="khi">' + e(v.dichVuTen) +
      (v.buocTiep ? ' · ' + e(v.buocTiep.viec) : '') + '</span></div></div>';
  }).join('');

  return HM.the({ h2: 'Liên hệ', thoBody: true, than: '<div class="card-b" style="padding-top:2px">' +
      (lh || '<p class="say">Chưa có liên hệ nào. Thêm một cái tên và một số điện thoại thì lần sau gọi được ngay.</p>') +
      '<div class="btnrow" style="margin-top:12px"><button type="button" class="btn sm" data-them-lh>Thêm liên hệ</button></div></div>' }) +
    (viec ? HM.the({ h2: 'Việc đang chạy', thoBody: true, than: '<div class="card-b" style="padding-top:2px">' + viec + '</div>' }) : '') +
    (ngoai ? HM.the({ h2: 'Mở ở công cụ thật', p: 'Số liệu và tiền nằm ở đây, portal không chép về.', thoBody: true,
      than: '<div class="card-b"><div class="ngoai">' + ngoai + '</div></div>' }) : '') +
    HM.the({ h2: 'Hợp đồng', thoBody: true, than: '<div class="card-b">' + HM.kv([
      ['Thời hạn', A.ngayVi(d.hopDong.tuNgay) + ' đến ' + A.ngayVi(d.hopDong.denNgay)],
      ['Còn lại', d.conHan < 0 ? 'đã hết hạn' : d.conHan + ' ngày'],
      ['Nhịp bảng kê', d.hopDong.nhipBaoCao === 'thang' ? 'hằng tháng' : 'hằng quý'],
      ['Tài khoản nhận', d.nganHang ? d.nganHang.nganHang + ' ' + d.nganHang.soTaiKhoanMask : 'chưa khai']
    ]) + '</div>' });
}

function ganMot(root, c, d) {
  var A = c.A;
  HM.bam(root, '[data-ve-ds]', function () { SO_DONG = 20; c.datLoc({ id: '' }); });
  HM.bam(root, '[data-them-dong]', function () { SO_DONG += 30; c.veLai(); });
  HM.bam(root, '[data-viec]', function (el) { c.di('viec', { id: el.getAttribute('data-viec') }); });
  HM.doi(root, '[data-chi-thay]', function (el) { CHI_THAY = el.checked; c.veLai(); });
  HM.bam(root, '.soan [data-tab]', function (el) { SOAN = el.getAttribute('data-tab'); c.veLai(); });
  HM.bam(root, '[data-xem-nhu]', function (el) {
    try { localStorage.setItem('haustek.xem-nhu', el.getAttribute('data-xem-nhu')); } catch (err) {}
    window.open('khach.html#k-trang-chu', '_blank');
  });
  HM.bam(root, '[data-them-lh]', function () {
    HM.hoiForm(c, { tieuDe: 'Thêm liên hệ', fields: [
      { k: 'ten', l: 'Họ tên', req: true }, { k: 'vaiTro', l: 'Vai trò' },
      { k: 'dienThoai', l: 'Điện thoại', req: true }, { k: 'email', l: 'Email' },
      { k: 'gioTienGoi', l: 'Giờ tiện gọi', ph: 'Chiều 14h đến 17h' }
    ] }).then(function (f) {
      if (!f) return;
      try { A.doiTac.themLienHe(d.id, f); c.thongBao('Đã thêm ' + f.ten + '.', 'ok'); c.veLai(); }
      catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
    });
  });
  HM.bam(root, '[data-luu]', function () {
    var o = root.querySelector('.soan [data-noi]');
    var chu = o ? o.value.trim() : '';
    if (!chu) { c.thongBao('Ô nội dung đang trống.', 'warn'); return; }
    var k = root.querySelector('.soan [data-kenh]'), q = root.querySelector('.soan [data-ketqua]');
    try {
      if (SOAN === 'lien-lac') { A.dong.ghiLienLac({ doiTacId: d.id, tomTat: chu, kenh: k ? k.value : 'goi', ketQua: q ? q.value : 'da-chot' }); c.thongBao('Đã ghi liên lạc.', 'ok'); }
      else if (SOAN === 'nhan') { A.dong.nhanChoDoiTac({ doiTacId: d.id, noiDung: chu }); c.thongBao('Đã gửi cho ' + d.ten + '.', 'ok'); }
      else if (SOAN === 'ghi-chu') { A.dong.ghiChuNoiBo({ doiTacId: d.id, noiDung: chu }); c.thongBao('Đã lưu ghi chú nội bộ.', 'ok'); }
      else { A.doiTac.suaTomTat(d.id, chu); c.thongBao('Đã lưu tóm tắt.', 'ok'); }
      SO_DONG = 20;
      c.veLai();
    } catch (err) { c.thongBao(loiNguoi(err), 'warn'); }
  });
}

HT.dangKy({
  id: 'doi-tac', nav: 'Đối tác', icon: 'user',
  chu: { vi: { nav: 'Đối tác' } },
  ve: function (root, c) {
    var id = c.loc.id;
    if (id) veMot(root, c, id); else veDanhSach(root, c);
  }
});

})();
