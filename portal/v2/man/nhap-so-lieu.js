/* =====================================================================
   NỘI BỘ · NHẬP SỐ LIỆU
   ---------------------------------------------------------------------
   Trang này là chỗ điều phối viên ngồi mỗi ngày. Mọi trang khác chỉ đọc
   lại thứ được gõ ở đây, nên nếu có một trang phải chạy nhanh, gọn, không
   bắt bấm nhiều thì là trang này.

   Bốn việc, đúng theo nhịp thật của công việc:
     · mỗi ngày — soát lượt nghe, ngày nào nguồn chưa về thì gõ vào;
     · mỗi tháng — báo cáo nền tảng về thì gõ tổng của nguồn đó vào kỳ;
     · khi cần — gõ số của từng bài, đè lên phần chia đều;
     · bất cứ lúc nào — mở nhật ký xem ai gõ gì, gõ nhầm thì gỡ.

   Số gõ tay luôn thắng số máy sinh. Bảng luôn hiện cả hai để người gõ
   thấy mình vừa làm lệch bao nhiêu so với ước tính — lệch nhiều thường
   là gõ nhầm đơn vị tiền hoặc nhầm kỳ, không phải thị trường đổi.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'ngay';
var CHON = { pIdx: null, fId: 0, q: '' };

HT.dangKy({
  id: 'nhap-so-lieu', nav: 'navNhap', nhom: 'nhomVanHanh', icon: 'down2',
  vai: ['ops', 'accounting', 'mgmt'],

  chu: {
    vi: {
      navNhap: 'Nhập số liệu', h1: 'Nhập số liệu',
      mo: 'Chỗ gõ số từ OneRPM, Warner, Believe, YouTube CMS vào hệ thống. Số gõ tay thắng số ước tính.',
      tNgay: 'Lượt nghe hằng ngày', tTien: 'Doanh thu theo kỳ', tBai: 'Doanh thu theo bài', tSu: 'Nhật ký nhập',
      kNgayThieu: 'Ngày chờ nhập', kNgayThieuS: 'nguồn nền tảng chậm 1–2 ngày là bình thường',
      kNguonThieu: 'Nguồn chưa có số', kNguonThieuS: 'trên mọi kỳ chưa xét duyệt',
      kDaGo: 'Dòng đã gõ tay', kDaGoS: 'đang đè lên số ước tính',
      kDoanhThu: 'Doanh thu đang ghi sổ', kDoanhThuS: 'cả 12 kỳ, chỉ nguồn đã có số',

      cNgay: 'Ngày', cLuot: 'Lượt nghe', cUoc: 'Ước tính', cTrangThai: 'Trạng thái', cNguoi: 'Người nhập', cTT: 'Thao tác',
      sTay: 'Đã nhập tay', sTuDong: 'Tự động', sCho: 'Chờ nhập',
      goNgay: 'Nhập lượt nghe ngày {d}', goNgayMo: 'Tổng lượt nghe cả danh mục trong ngày đó, cộng mọi nền tảng. Lấy trên bảng điều khiển của từng nền tảng rồi cộng lại.',
      lLuot: 'Tổng lượt nghe', traTuDong: 'Trả về số tự động', daGoNgay: 'Đã ghi {d}: {v} lượt', daTraNgay: 'Đã trả ngày {d} về số tự động',
      ngayMo: 'Phần mềm tự cập nhật những ngày đã có số. Chỉ ngày nào nguồn chưa về mới cần gõ, và chỉ cần tổng.',

      cKy: 'Kỳ', cTong: 'Đang ghi sổ', cChot: 'Số đã chốt', cLech: 'Lệch ước tính', cDuyet: 'Kỳ',
      chuaCo: 'chưa có số', daDuyet: 'đã xét duyệt', dangMo: 'đang mở',
      goKy: 'Nhập doanh thu · {f} · {p}', goKyMo: 'Tổng tiền của nguồn này trong kỳ này, lấy thẳng trên báo cáo. Những bài chưa gõ riêng sẽ chia theo tỷ trọng để cộng lại đúng bằng số này.',
      lTien: 'Tổng doanh thu nguồn (USD)', lNguon: 'Lấy số từ đâu', lGhiChu: 'Ghi chú (tên file, ngày tải)',
      daGoKy: 'Đã ghi {f} · {p}: {v}', uoc: 'Ước tính', dangCo: 'Đang ghi sổ',
      tienMo: 'Mỗi ô là một nguồn trong một kỳ. Bấm để gõ tổng lấy từ báo cáo. Kỳ đã xét duyệt thì khoá lại.',

      chonKy: 'Kỳ', chonNguon: 'Nguồn', timBai: 'Tìm tên bài hoặc ISRC', cBai: 'Bài hát', cIsrc: 'Mã ISRC',
      goBai: 'Gõ số cho bài này', luuBai: 'Lưu', daGoBai: 'Đã ghi {t}: {v}', goiY: 'Đang hiện những bài có doanh thu lớn nhất kỳ. Gõ để tìm bài khác.',
      dan: 'Dán từ bảng tính', danMo: 'Bôi đen cột ISRC và cột tiền trên báo cáo rồi dán vào đây. Mỗi dòng một bài, ngăn cách bằng tab, dấu phẩy hoặc chấm phẩy. Dòng nào không tra được ISRC thì bỏ qua và báo lại.',
      danNut: 'Nhận khối này', danXong: 'Đã nhận {a} dòng, bỏ qua {b} dòng', danKhong: 'Không nhận được dòng nào. Kiểm lại cột ISRC.',
      danBo: 'Dòng bị bỏ qua',
      baiMo: 'Chỉ gõ theo bài khi báo cáo có dòng riêng cho bài đó. Bài đã gõ tay không bị chia lại khi bạn sửa tổng của nguồn.',
      daTay: 'đã gõ tay',

      cLuc: 'Lúc', cKieu: 'Kiểu', cDoiTuong: 'Nội dung', cTruoc: 'Số trước', cSau: 'Số sau',
      kieuKy: 'Tổng nguồn', kieuBai: 'Theo bài', go: 'Gỡ', hoiGo: 'Gỡ dòng vừa nhập',
      hoiGoMo: 'Gỡ xong số quay về mức trước đó. Việc này có ghi nhật ký.', daGo: 'Đã gỡ dòng {id}',
      suMo: 'Sáu mươi dòng gần nhất. Gỡ một dòng là trả số về đúng mức trước khi gõ.',
      trongSu: 'Chưa ai gõ số nào. Bảng bên trái vẫn đang chạy bằng số ước tính.',

      in: 'Bản in', inTieu: 'Nhật ký nhập số liệu', inPhu: 'Ai gõ số nào, lúc nào, và số trước đó là bao nhiêu.',
      qt: 'Quy trình mỗi ngày'
    },
    en: {
      navNhap: 'Data entry', h1: 'Data entry',
      mo: 'Where figures from OneRPM, Warner, Believe and YouTube CMS are keyed in. Keyed figures beat estimates.',
      tNgay: 'Daily streams', tTien: 'Revenue by period', tBai: 'Revenue by track', tSu: 'Entry log',
      kNgayThieu: 'Days awaiting entry', kNgayThieuS: 'platform feeds run one to two days behind',
      kNguonThieu: 'Feeds with no figure', kNguonThieuS: 'across all unapproved periods',
      kDaGo: 'Hand-keyed rows', kDaGoS: 'currently overriding the estimate',
      kDoanhThu: 'Revenue on the books', kDoanhThuS: 'all 12 periods, feeds with a figure only',

      cNgay: 'Date', cLuot: 'Streams', cUoc: 'Estimate', cTrangThai: 'Status', cNguoi: 'Entered by', cTT: 'Actions',
      sTay: 'Keyed in', sTuDong: 'Automatic', sCho: 'Awaiting entry',
      goNgay: 'Enter streams for {d}', goNgayMo: 'Total catalogue streams that day across every platform. Take each platform’s daily total and add them up.',
      lLuot: 'Total streams', traTuDong: 'Back to automatic', daGoNgay: 'Recorded {d}: {v} streams', daTraNgay: '{d} is back on the automatic figure',
      ngayMo: 'The software keeps the settled days up to date on its own. Only days the feed has not reached need keying, and only the total.',

      cKy: 'Period', cTong: 'On the books', cChot: 'Figure keyed', cLech: 'vs estimate', cDuyet: 'Period',
      chuaCo: 'no figure', daDuyet: 'approved', dangMo: 'open',
      goKy: 'Enter revenue · {f} · {p}', goKyMo: 'This feed’s total for this period, straight off the report. Tracks without their own figure are scaled so they add up to exactly this.',
      lTien: 'Feed revenue total (USD)', lNguon: 'Where the figure came from', lGhiChu: 'Note (file name, download date)',
      daGoKy: 'Recorded {f} · {p}: {v}', uoc: 'Estimate', dangCo: 'On the books',
      tienMo: 'Each cell is one feed in one period. Click to key in the report total. Approved periods are locked.',

      chonKy: 'Period', chonNguon: 'Feed', timBai: 'Search title or ISRC', cBai: 'Track', cIsrc: 'ISRC code',
      goBai: 'Key a figure for this track', luuBai: 'Save', daGoBai: 'Recorded {t}: {v}', goiY: 'Showing the period’s largest earners. Type to find another track.',
      dan: 'Paste from a spreadsheet', danMo: 'Select the ISRC column and the amount column on the report and paste them here. One track per line, separated by a tab, comma or semicolon. Lines whose ISRC cannot be matched are skipped and listed back.',
      danNut: 'Take this block', danXong: 'Took {a} lines, skipped {b}', danKhong: 'Nothing could be taken. Check the ISRC column.',
      danBo: 'Skipped lines',
      baiMo: 'Key a track only when the report itemises it. Hand-keyed tracks are not rescaled when you change the feed total.',
      daTay: 'keyed',

      cLuc: 'When', cKieu: 'Kind', cDoiTuong: 'What', cTruoc: 'Was', cSau: 'Now',
      kieuKy: 'Feed total', kieuBai: 'Per track', go: 'Undo', hoiGo: 'Undo this entry',
      hoiGoMo: 'The figure returns to what it was before. The undo is logged.', daGo: 'Undid {id}',
      suMo: 'The last sixty rows. Undoing one returns the figure to what it was before it was keyed.',
      trongSu: 'Nothing keyed yet. The tables are still running on estimates.',

      in: 'Print view', inTieu: 'Data entry log', inPhu: 'Who keyed what, when, and what it was before.',
      qt: 'The daily routine'
    }
  },

  dem: function (c) {
    try { var x = c.A.nhapLieu.conThieu(); return x.tong ? '!' + x.tong : ''; } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var thieu = A.nhapLieu.conThieu();
    var bang = A.nhapLieu.bang();
    var daGo = A.nhapLieu.nhatKy(999).length;
    var tongSo = bang.reduce(function (s, r) { return s + r.thuc; }, 0);
    if (CHON.pIdx == null) {
      var mo = bang.filter(function (r) { return !r.duyet; })[0];
      CHON.pIdx = mo ? mo.pIdx : bang.length - 1;
    }

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: '<button type="button" class="btn sm ghost" data-in>' + HM.icon('file') + HM.esc(t('in')) + '</button>'
    });
    html += HM.so([
      { l: t('kNgayThieu'), v: HT.fmt.n(thieu.ngay), s: t('kNgayThieuS'), mau: thieu.ngay ? HB.mau('warn') : HB.mau('ok') },
      { l: t('kNguonThieu'), v: HT.fmt.n(thieu.ky), s: t('kNguonThieuS'), mau: thieu.ky ? HB.mau('warn') : HB.mau('ok') },
      { l: t('kDaGo'), v: HT.fmt.n(daGo), s: t('kDaGoS'), mau: daGo ? HB.mau('ok') : '' },
      { l: t('kDoanhThu'), v: c.tien(tongSo), s: t('kDoanhThuS'), lon: true }
    ]);
    html += HM.tabs([
      { k: 'ngay', l: t('tNgay'), icon: 'cal' },
      { k: 'tien', l: t('tTien'), icon: 'cash' },
      { k: 'bai', l: t('tBai'), icon: 'disc' },
      { k: 'su', l: t('tSu'), icon: 'clock' }
    ], TAB);

    if (TAB === 'ngay') html += veNgay(c);
    if (TAB === 'tien') html += veTien(c, bang);
    if (TAB === 'bai') html += veBai(c, bang);
    if (TAB === 'su') html += veSu(c);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-in]', function () { inRa(c); });
    HM.bam(root, '[data-o-ngay]', function (el) { goNgay(c, el.getAttribute('data-o-ngay'), el.getAttribute('data-uoc')); });
    HM.bam(root, '[data-tra-ngay]', function (el) {
      var d = el.getAttribute('data-tra-ngay');
      try { A.nhapLieu.xoaNgay(d, A.staff.me.name); c.thongBao(t('daTraNgay').replace('{d}', HT.fmt.ngay(d)), 'ok'); HM.quenHet(); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-o-ky]', function (el) {
      var v = el.getAttribute('data-o-ky').split(':');
      goKy(c, +v[0], +v[1]);
    });
    HM.doi(root, '[data-chon-ky]', function (el) { CHON.pIdx = +el.value; c.veLai(); });
    HM.doi(root, '[data-chon-nguon]', function (el) { CHON.fId = +el.value; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { CHON.q = el.value; c.veLai(); });
    HM.bam(root, '[data-luu-bai]', function (el) {
      var i = +el.getAttribute('data-luu-bai');
      var o = root.querySelector('[data-so-bai="' + i + '"]');
      var v = o ? o.value : '';
      if (v === '') return;
      try {
        var e2 = A.nhapLieu.ghiBai(CHON.pIdx, CHON.fId, i, parseFloat(String(v).replace(',', '.')), { nguon: nguonMacDinh(A) }, A.staff.me.name);
        c.thongBao(t('daGoBai').replace('{t}', e2.tenBai).replace('{v}', c.tien2(e2.tien)), 'ok');
        HM.quenHet(); c.veLai();
      } catch (err) { c.thongBao(err.message, 'no'); }
    });
    HM.bam(root, '[data-nhan-dan]', function () {
      var o = root.querySelector('[data-dan]');
      if (!o || !o.value.trim()) return;
      try {
        var kq = A.nhapLieu.danBai(CHON.pIdx, CHON.fId, o.value, { nguon: nguonMacDinh(A) }, A.staff.me.name);
        if (!kq.ok.length) { c.thongBao(t('danKhong'), 'no'); return; }
        c.thongBao(t('danXong').replace('{a}', kq.ok.length).replace('{b}', kq.bo.length), 'ok');
        if (kq.bo.length) {
          c.hoiThoai({ tieuDe: t('danBo') + ' · ' + kq.bo.length, moTa: HM.esc(t('danMo')),
            than: '<ul class="say-list">' + kq.bo.slice(0, 20).map(function (x) {
              return '<li>' + HM.esc((c.lang === 'en' ? 'Line ' : 'Dòng ') + x.dong + ' · ' + x.ly + ' · ' + HM.dai(x.chu, 40)) + '</li>';
            }).join('') + '</ul>', huy: false, dong: c.lang === 'en' ? 'Close' : 'Đóng' });
        }
        HM.quenHet(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-go]', function (el) {
      var id = el.getAttribute('data-go');
      c.xacNhan(t('hoiGo'), HM.esc(t('hoiGoMo')), t('go'), true).then(function (ok) {
        if (!ok) return;
        try { A.nhapLieu.go(id, A.staff.me.name); c.thongBao(t('daGo').replace('{id}', id), 'ok'); HM.quenHet(); c.veLai(); }
        catch (e) { c.thongBao(e.message, 'no'); }
      });
    });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
  }
});

function nguonMacDinh(A) { return A.nhapLieu.nguon()[0].id; }

/* =====================================================================
   TAB 1 — LƯỢT NGHE HẰNG NGÀY
   Việc lặp mỗi ngày. Bảng xếp ngày mới nhất lên đầu vì đó là ngày duy
   nhất người dùng thật sự cần chạm tới.
   ===================================================================== */
function veNgay(c) {
  var A = c.A, t = c.t;
  var ds = A.nhapLieu.ngay(30);
  var cho = ds.filter(function (x) { return x.trangThai === 'cho'; });
  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cNgay')) + '</th>' +
    '<th class="num">' + HM.esc(t('cLuot')) + '</th>' +
    '<th class="num">' + HM.esc(t('cUoc')) + HM.hoi(t('ngayMo')) + '</th>' +
    '<th>' + HM.esc(t('cTrangThai')) + '</th>' +
    '<th>' + HM.esc(t('cNguoi')) + '</th>' +
    '<th>' + HM.esc(t('cTT')) + '</th></tr></thead><tbody>' +
    ds.map(function (x) {
      var tag = x.trangThai === 'tay' ? HM.tag(t('sTay'), 'ok')
        : x.trangThai === 'cho' ? HM.tag(t('sCho'), 'warn') : HM.tag(t('sTuDong'), '');
      return '<tr' + (x.trangThai === 'cho' ? ' class="canh"' : '') + '>' +
        '<td class="mono">' + HM.esc(HT.fmt.ngay(x.ngay)) + '</td>' +
        '<td class="num mono"><b>' + (x.tong > 0 ? HM.esc(HT.fmt.n(x.tong)) : '<span class="nil">—</span>') + '</b></td>' +
        '<td class="num mono muted">' + HM.esc(HT.fmt.n(x.tuSinh)) + '</td>' +
        '<td>' + tag + '</td>' +
        '<td class="muted">' + (x.by ? HM.esc(x.by) : '<span class="nil">—</span>') + '</td>' +
        '<td><div class="btnrow" style="flex-wrap:nowrap">' +
          '<button type="button" class="btn sm' + (x.trangThai === 'cho' ? ' pri' : ' ghost') + '" data-o-ngay="' + x.ngay + '" data-uoc="' + x.tuSinh + '">' +
            HM.esc(x.trangThai === 'tay' ? t('goBai') : t('lLuot')) + '</button>' +
          (x.trangThai === 'tay' ? '<button type="button" class="btn sm ghost" data-tra-ngay="' + x.ngay + '">' + HM.esc(t('traTuDong')) + '</button>' : '') +
        '</div></td></tr>';
    }).join('') + '</tbody></table></div>';

  var html = '';
  if (cho.length) {
    html += HM.ghi({ kieu: 'warn', icon: 'clock',
      tieuDe: HM.esc(t('kNgayThieu')) + ' · ' + cho.length,
      than: HM.esc(cho.map(function (x) { return HT.fmt.ngay(x.ngay); }).join(' · ')) });
  }
  html += '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('tNgay')), p: HM.esc(t('ngayMo')), thoBody: true, than: than }) +
    HM.the({ h2: HM.esc(t('qt')), icon: 'list',
      than: HTS.soTay(c, 'nhap-so-lieu') }) +
    '</div>';
  return html;
}

function goNgay(c, ngay, uoc) {
  var A = c.A, t = c.t;
  var hien = A.nhapLieu.ngay(30).filter(function (x) { return x.ngay === ngay; })[0] || {};
  c.hoiThoai({
    tieuDe: t('goNgay').replace('{d}', HT.fmt.ngay(ngay)),
    moTa: HM.esc(t('goNgayMo')),
    than: '<label class="fld">' + HM.esc(t('lLuot')) + '</label>' +
      '<input class="in mono" type="number" min="0" step="1" data-o="luot" value="' + (hien.trangThai === 'tay' ? hien.tong : '') + '" placeholder="' + HM.esc(HT.fmt.n(+uoc || 0)) + '">' +
      '<label class="fld">' + HM.esc(t('lGhiChu')) + '</label>' +
      '<input class="in" data-o="ghi" value="' + HM.esc(hien.ghiChu || '') + '">',
    dong: t('lLuot')
  }).then(function (r) {
    if (!r || r.luot === '') return;
    try {
      A.nhapLieu.ghiNgay(ngay, parseFloat(r.luot), { ghiChu: r.ghi }, A.staff.me.name);
      c.thongBao(t('daGoNgay').replace('{d}', HT.fmt.ngay(ngay)).replace('{v}', HT.fmt.n(parseFloat(r.luot))), 'ok');
      HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

/* =====================================================================
   TAB 2 — DOANH THU THEO KỲ × NGUỒN
   Ma trận mười hai dòng, ba cột. Ô nào chưa có số thật thì hiện số ước
   tính bằng chữ mờ, để phân biệt ngay bằng mắt.
   ===================================================================== */
function veTien(c, bang) {
  var t = c.t, A = c.A;
  var feeds = A.feeds;
  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cKy')) + '</th>' +
    feeds.map(function (f) { return '<th class="num">' + HM.esc(c.song(f, 'short')) + '</th>'; }).join('') +
    '<th class="num">' + HM.esc(t('cTong')) + '</th>' +
    '<th class="num">' + HM.esc(t('cLech')) + HM.hoi(t('tienMo')) + '</th>' +
    '<th>' + HM.esc(t('cDuyet')) + '</th></tr></thead><tbody>' +
    bang.slice().reverse().map(function (r) {
      var lech = r.tuSinh > 0 ? (r.thuc - r.tuSinh) / r.tuSinh : 0;
      return '<tr>' +
        '<td><b>' + HM.esc(r.label) + '</b></td>' +
        r.cot.map(function (o) {
          if (!o.nap) return '<td class="num"><button type="button" class="btn sm ghost" data-o-ky="' + r.pIdx + ':' + o.fId + '"' + (r.duyet ? ' disabled' : '') + '>' + HM.esc(t('chuaCo')) + '</button></td>';
          return '<td class="num mono">' +
            '<button type="button" class="o-tien' + (o.chot != null ? ' go' : '') + '" data-o-ky="' + r.pIdx + ':' + o.fId + '"' + (r.duyet ? ' disabled' : '') + '>' +
              '<b>' + HM.esc(c.tien(o.thuc)) + '</b>' +
              (o.chot != null ? '<span>' + HM.esc(t('cChot')) + '</span>' : '<span class="muted">' + HM.esc(t('uoc')) + '</span>') +
            '</button></td>';
        }).join('') +
        '<td class="num mono"><b>' + HM.esc(c.tien(r.thuc)) + '</b></td>' +
        '<td class="num mono">' + (Math.abs(lech) < 0.001 ? '<span class="nil">—</span>'
          : '<span class="' + (lech > 0 ? 'pos' : 'neg') + '">' + (lech > 0 ? '+' : '') + HM.esc(HT.fmt.pct(lech)) + '</span>') + '</td>' +
        '<td>' + (r.duyet ? HM.tag(t('daDuyet'), 'ok') : HM.tag(t('dangMo'), '')) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  return HM.the({ h2: HM.esc(t('tTien')), p: HM.esc(t('tienMo')), thoBody: true, than: than });
}

function goKy(c, pIdx, fId) {
  var A = c.A, t = c.t;
  var r = A.nhapLieu.bang()[pIdx];
  var o = r.cot.filter(function (x) { return x.fId === fId; })[0];
  var f = A.feeds[fId];
  var nguon = A.nhapLieu.nguon();
  c.hoiThoai({
    tieuDe: t('goKy').replace('{f}', c.song(f, 'short')).replace('{p}', r.label),
    moTa: HM.esc(t('goKyMo')),
    than: HM.kv([{ t: t('uoc'), v: c.tien2(o.tuSinh) }, { t: t('dangCo'), v: c.tien2(o.thuc), manh: true }]) +
      '<label class="fld">' + HM.esc(t('lTien')) + '</label>' +
      '<input class="in mono" type="number" min="0" step="0.01" data-o="tien" value="' + (o.chot != null ? o.chot : '') + '" placeholder="' + o.tuSinh.toFixed(2) + '">' +
      '<label class="fld">' + HM.esc(t('lNguon')) + '</label>' +
      '<select class="in" data-o="nguon">' + nguon.map(function (n) {
        return '<option value="' + n.id + '"' + (o.nguon === n.id ? ' selected' : '') + '>' + HM.esc(c.lang === 'en' ? n.en : n.vi) + '</option>';
      }).join('') + '</select>' +
      '<label class="fld">' + HM.esc(t('lGhiChu')) + '</label>' +
      '<input class="in" data-o="ghi" placeholder="onerpm-2026-06.csv">',
    dong: t('tTien')
  }).then(function (res) {
    if (!res || res.tien === '') return;
    try {
      var e = A.nhapLieu.ghiKy(pIdx, fId, parseFloat(String(res.tien).replace(',', '.')), { nguon: res.nguon, ghiChu: res.ghi }, A.staff.me.name);
      c.thongBao(t('daGoKy').replace('{f}', c.song(f, 'short')).replace('{p}', r.label).replace('{v}', c.tien2(e.tien)), 'ok');
      HM.quenHet(); c.veLai();
    } catch (err) { c.thongBao(err.message, 'no'); }
  });
}

/* =====================================================================
   TAB 3 — DOANH THU THEO BÀI
   Ô nhập nằm ngay trên dòng, không mở hộp thoại: gõ mười bài liên tiếp là
   việc thật, mở mười hộp thoại thì không ai làm.
   ===================================================================== */
function veBai(c, bang) {
  var A = c.A, t = c.t;
  var r = bang[CHON.pIdx];
  var kq = A.nhapLieu.baiTrongKy(CHON.pIdx, CHON.fId, { q: CHON.q, limit: 40 });
  var thanh = '<div class="bar">' +
    '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
      HM.esc(t('timBai')) + '" value="' + HM.esc(CHON.q) + '"></div>' +
    '<select class="in" data-chon-ky style="width:auto;height:34px" aria-label="' + HM.esc(t('chonKy')) + '">' + bang.map(function (x) {
      return '<option value="' + x.pIdx + '"' + (x.pIdx === CHON.pIdx ? ' selected' : '') + (x.duyet ? ' disabled' : '') + '>' + HM.esc(x.label) + (x.duyet ? ' · ' + HM.esc(t('daDuyet')) : '') + '</option>';
    }).join('') + '</select>' +
    '<select class="in" data-chon-nguon style="width:auto;height:34px" aria-label="' + HM.esc(t('chonNguon')) + '">' + A.feeds.map(function (f) {
      return '<option value="' + f.id + '"' + (f.id === CHON.fId ? ' selected' : '') + '>' + HM.esc(c.song(f, 'short')) + '</option>';
    }).join('') + '</select>' +
    '</div>';

  var than = thanh + '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cBai')) + '</th><th>' + HM.esc(t('cIsrc')) + '</th>' +
    '<th class="num">' + HM.esc(t('cUoc')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTong')) + '</th>' +
    '<th>' + HM.esc(t('goBai')) + HM.hoi(t('baiMo')) + '</th></tr></thead><tbody>' +
    kq.rows.map(function (x) {
      return '<tr>' +
        '<td>' + HM.tenBia({ ten: x.title, seed: x.i, bia: x.i, phu: x.artist }) + '</td>' +
        '<td class="mono muted">' + HM.esc(x.isrc) + '</td>' +
        '<td class="num mono muted">' + HM.esc(c.tien2(x.tuSinh)) + '</td>' +
        '<td class="num mono"><b>' + HM.esc(c.tien2(x.thuc)) + '</b>' + (x.goTay ? ' ' + HM.tag(t('daTay'), 'ok') : '') + '</td>' +
        '<td><div class="bar" style="margin:0;gap:6px;flex-wrap:nowrap">' +
          '<input class="in mono" type="number" min="0" step="0.01" style="width:110px" data-so-bai="' + x.i + '" value="' + (x.goTay ? x.thuc : '') + '" placeholder="' + x.tuSinh.toFixed(2) + '"' + (r.duyet ? ' disabled' : '') + '>' +
          '<button type="button" class="btn sm pri" data-luu-bai="' + x.i + '"' + (r.duyet ? ' disabled' : '') + '>' + HM.esc(t('luuBai')) + '</button>' +
        '</div></td></tr>';
    }).join('') + '</tbody></table></div>';

  if (!kq.rows.length) than = thanh + HM.trong({ icon: 'tim', tieuDe: t('timBai'), moTa: t('goiY') });
  return HM.the({ h2: HM.esc(t('tBai')), p: HM.esc(CHON.q ? t('baiMo') : t('goiY')), thoBody: true, than: than }) +
    HM.the({ h2: HM.esc(t('dan')), p: HM.esc(t('danMo')), icon: 'down2',
      than: '<textarea class="in mono" rows="6" data-dan placeholder="VNA2P2600123\t1520.40&#10;VNA2P2600124\t880.15"' + (r.duyet ? ' disabled' : '') + '></textarea>' +
        '<div class="btnrow" style="margin-top:10px"><button type="button" class="btn pri" data-nhan-dan' + (r.duyet ? ' disabled' : '') + '>' +
        HM.icon('down2') + HM.esc(t('danNut')) + '</button></div>' });
}

/* =====================================================================
   TAB 4 — NHẬT KÝ
   ===================================================================== */
function veSu(c) {
  var A = c.A, t = c.t;
  var ds = A.nhapLieu.nhatKy(60);
  if (!ds.length) return HM.the({ h2: HM.esc(t('tSu')), than: HM.trong({ icon: 'clock', tieuDe: t('trongSu'), moTa: t('suMo') }) });
  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cLuc')) + '</th><th>' + HM.esc(t('cKieu')) + '</th><th>' + HM.esc(t('cDoiTuong')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTruoc')) + '</th><th class="num">' + HM.esc(t('cSau')) + '</th>' +
    '<th>' + HM.esc(t('cNguoi')) + '</th><th>' + HM.esc(t('cTT')) + '</th></tr></thead><tbody>' +
    ds.map(function (e) {
      return '<tr>' +
        '<td class="mono muted">' + HM.esc(HT.fmt.luc(e.at)) + '</td>' +
        '<td>' + HM.tag(e.kieu === 'ky' ? t('kieuKy') : t('kieuBai'), e.kieu === 'ky' ? '' : 'ok') + '</td>' +
        '<td>' + HM.esc((e.kieu === 'ky' ? e.nguonBaoCao : (e.tenBai || '')) + ' · ' + e.kyTen) +
          '<div class="t-sub">' + HM.esc(e.nguonTen + (e.ghiChu ? ' · ' + e.ghiChu : '')) + '</div></td>' +
        '<td class="num mono muted">' + HM.esc(c.tien2(e.truoc || 0)) + '</td>' +
        '<td class="num mono"><b>' + HM.esc(c.tien2(e.tien)) + '</b></td>' +
        '<td class="muted">' + HM.esc(e.by || '—') + '</td>' +
        '<td><button type="button" class="btn sm ghost" data-go="' + HM.esc(e.id) + '">' + HM.esc(t('go')) + '</button></td></tr>';
    }).join('') + '</tbody></table></div>';
  return HM.the({ h2: HM.esc(t('tSu')), p: HM.esc(t('suMo')), thoBody: true, than: than });
}

/* ---- bản in nhật ký ---- */
function inRa(c) {
  var A = c.A, t = c.t;
  var ds = A.nhapLieu.nhatKy(200);
  var than = '<h2>' + HM.esc(t('tSu')) + '</h2>' +
    '<table><thead><tr><th>' + HM.esc(t('cLuc')) + '</th><th>' + HM.esc(t('cKieu')) + '</th><th>' + HM.esc(t('cDoiTuong')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTruoc')) + '</th><th class="num">' + HM.esc(t('cSau')) + '</th><th>' + HM.esc(t('cNguoi')) + '</th></tr></thead><tbody>' +
    (ds.length ? ds.map(function (e) {
      return '<tr><td>' + HM.esc(HT.fmt.luc(e.at)) + '</td><td>' + HM.esc(e.kieu === 'ky' ? t('kieuKy') : t('kieuBai')) + '</td>' +
        '<td>' + HM.esc((e.kieu === 'ky' ? e.nguonBaoCao : (e.tenBai || '')) + ' · ' + e.kyTen + ' · ' + e.nguonTen) + '</td>' +
        '<td class="num">' + HM.esc(c.tien2(e.truoc || 0)) + '</td><td class="num">' + HM.esc(c.tien2(e.tien)) + '</td>' +
        '<td>' + HM.esc(e.by || '—') + '</td></tr>';
    }).join('') : '<tr><td colspan="6">' + HM.esc(t('trongSu')) + '</td></tr>') + '</tbody></table>';
  HM.banIn({ tieuDe: t('inTieu'), phu: t('inPhu'), than: than, nguoi: A.staff.me.name });
}

})();
