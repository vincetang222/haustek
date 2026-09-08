/* =====================================================================
   NỘI BỘ · HIỆU SUẤT NHÂN VIÊN
   ---------------------------------------------------------------------
   Câu hỏi của người quản lý là "ai đang đuối, đuối ở chỗ nào", không phải
   "ai giỏi hơn ai". Nên trang này KHÔNG chấm một điểm tổng. Bốn cột đứng
   cạnh nhau — đã giao, đang làm, đúng hạn, quá hạn — cộng thời gian xử lý
   trung bình. Một người quá hạn nhiều có thể là làm chậm, cũng có thể là
   đang ôm toàn việc khó; hai chuyện ấy chỉ phân biệt được khi nhìn cả
   dòng việc của người đó, nên bấm vào một người là mở ra dòng việc.

   Ô đánh giá cuối năm để người quản lý tự viết. Hệ thống giữ số và giữ
   chữ, không tự kết luận thay.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'nguoi';
var LOC = { vai: '' };

HT.dangKy({
  id: 'hieu-suat', nav: 'navHieuSuat', nhom: 'nhomHeThong', icon: 'chart',

  chu: {
    vi: {
      navHieuSuat: 'Hiệu suất', h1: 'Hiệu suất nhân viên',
      mo: 'Việc đã giao, đúng hạn, quá hạn và thời gian xử lý của từng người. Chỉ Level 1–2 mở được.',
      nguon: 'Nguồn số: ticket hỗ trợ, khiếu nại bản quyền, và mỗi lần một người đẩy hồ sơ phát hành sang bước sau. Việc không có hạn thì không tính vào tỷ lệ đúng hạn.',
      tNguoi: 'Theo người', tThang: 'Theo tháng', tQt: 'Quy trình từng loại việc',

      kNguoi: 'Người đang làm việc', kMo: 'Việc đang mở', kQuaHan: 'Việc quá hạn', kQuaHanS: 'tính trên việc có hạn',
      kDungHan: 'Tỷ lệ đúng hạn', kDungHanS: 'cả công ty, mọi việc có hạn',

      cNguoi: 'Người', cCap: 'Cấp', cVai: 'Khối', cGiao: 'Đã giao', cDangLam: 'Đang làm',
      cDungHan: 'Đúng hạn', cQuaHan: 'Quá hạn', cTyLe: 'Tỷ lệ đúng hạn', cGio: 'Xử lý trung bình',
      cMuc: 'Mức', gio: 'giờ', khong: 'Chưa ai được giao việc nào.',
      moiVai: 'Mọi khối',

      dTieu: 'Dòng việc của {n}', dDangLam: 'Việc đang mở', dQuaHan: 'Việc từng quá hạn', dThang: 'Theo tháng',
      dBuoc: 'Bước', dHan: 'Hạn', dViec: 'Việc', dLoai: 'Loại', dTrangThai: 'Trạng thái',
      lTicket: 'Ticket hỗ trợ', lKhieuNai: 'Tranh chấp', lPhatHanh: 'Phát hành',
      dTrong: 'Không còn việc nào đang mở.', dQhTrong: 'Chưa có việc nào quá hạn.',
      xemViec: 'Mở trang', qh: 'quá hạn', conHan: 'còn hạn',

      dg: 'Đánh giá cuối năm', dgMo: 'Người quản lý viết. Số ở trên là căn cứ, không phải kết luận.',
      dgVier: 'Viết đánh giá', dgMuc: 'Mức', dgNhanXet: 'Nhận xét', dgLuu: 'Lưu đánh giá',
      dgDaLuu: 'Đã lưu đánh giá {n} năm {y}', dgChua: 'Chưa có đánh giá năm nay.', dgNam: 'Năm',

      bdGiao: 'Đã giao', bdXong: 'Đã xong', bdQuaHan: 'Quá hạn',
      thangMo: 'Mười hai tháng gần nhất, gộp cả công ty. Cột đỏ cao lên là tháng đội bị dồn việc.',
      qtMo: 'Mỗi loại việc một quy trình. Nhân viên làm theo bảng này, và mỗi việc giữ bảng riêng của nó.',
      qtNhip: 'Nhịp', nhipNgay: 'Mỗi ngày', nhipThang: 'Mỗi tháng', nhipViec: 'Theo từng việc',
      qtSoBuoc: '{n} bước', qtKhoi: 'Khối',

      in: 'Bản in', inTieu: 'Hiệu suất nhân viên', inPhu: 'Việc đã giao, đúng hạn, quá hạn và thời gian xử lý trung bình.',
      kd: 'Kết quả kinh doanh', kdMo: 'Người khối kinh doanh còn được đo bằng doanh số, không chỉ bằng kỷ luật việc.',
      kdTk: 'Tài khoản phụ trách', kdQuy: 'Doanh thu quý', kdChiTieu: 'Chỉ tiêu quý', kdDat: 'Đạt chỉ tiêu',
      kdMoi: 'Tài khoản mới 120 ngày', kdGiaHan: 'Hợp đồng hết hạn trong 120 ngày', kdChuaVao: 'Chưa đăng nhập lần nào'
    },
    en: {
      navHieuSuat: 'Performance', h1: 'Team performance',
      mo: 'Work assigned, on time, overdue and handling time, per person. Level 1–2 only.',
      nguon: 'Sources: support tickets, rights claims, and each time someone moves a release file to its next step. Work with no deadline does not count towards the on-time rate.',
      tNguoi: 'By person', tThang: 'By month', tQt: 'Runbook per kind of work',

      kNguoi: 'People at work', kMo: 'Open items', kQuaHan: 'Overdue items', kQuaHanS: 'of items that have a deadline',
      kDungHan: 'On-time rate', kDungHanS: 'company-wide, all items with a deadline',

      cNguoi: 'Person', cCap: 'Level', cVai: 'Unit', cGiao: 'Assigned', cDangLam: 'Open',
      cDungHan: 'On time', cQuaHan: 'Overdue', cTyLe: 'On-time rate', cGio: 'Avg handling',
      cMuc: 'Band', gio: 'h', khong: 'Nobody has been assigned any work yet.',
      moiVai: 'All units',

      dTieu: '{n}’s work', dDangLam: 'Open items', dQuaHan: 'Items that ran late', dThang: 'By month',
      dBuoc: 'Steps', dHan: 'Due', dViec: 'Item', dLoai: 'Kind', dTrangThai: 'Status',
      lTicket: 'Support ticket', lKhieuNai: 'Dispute', lPhatHanh: 'Release',
      dTrong: 'Nothing open right now.', dQhTrong: 'Nothing has run late.',
      xemViec: 'Open screen', qh: 'overdue', conHan: 'in time',

      dg: 'Year-end review', dgMo: 'Written by the manager. The figures above are evidence, not a verdict.',
      dgVier: 'Write the review', dgMuc: 'Band', dgNhanXet: 'Comments', dgLuu: 'Save review',
      dgDaLuu: 'Saved {n}’s {y} review', dgChua: 'No review for this year yet.', dgNam: 'Year',

      bdGiao: 'Assigned', bdXong: 'Done', bdQuaHan: 'Overdue',
      thangMo: 'The last twelve months, company-wide. A tall red bar is a month the team fell behind.',
      qtMo: 'One runbook per kind of work. People follow it, and each item keeps its own copy.',
      qtNhip: 'Cadence', nhipNgay: 'Daily', nhipThang: 'Monthly', nhipViec: 'Per item',
      qtSoBuoc: '{n} steps', qtKhoi: 'Unit',

      in: 'Print view', inTieu: 'Team performance', inPhu: 'Work assigned, on time, overdue and average handling time.',
      kd: 'Commercial results', kdMo: 'People in Sales are also measured on revenue, not only on work discipline.',
      kdTk: 'Accounts managed', kdQuy: 'Quarter revenue', kdChiTieu: 'Quarter target', kdDat: 'Against target',
      kdMoi: 'New accounts, 120 days', kdGiaHan: 'Contracts ending within 120 days', kdChuaVao: 'Never logged in'
    }
  },

  dem: function (c) {
    try {
      var n = c.A.hieuSuat.bang().reduce(function (s, r) { return s + r.quaHan; }, 0);
      return n ? '!' + n : '';
    } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var ds = A.hieuSuat.bang();
    var mo = ds.reduce(function (s, r) { return s + r.dangLam; }, 0);
    var qh = ds.reduce(function (s, r) { return s + r.quaHan; }, 0);
    var coHan = ds.reduce(function (s, r) { return s + r.coHan; }, 0);
    var dung = ds.reduce(function (s, r) { return s + r.dungHan; }, 0);

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: '<button type="button" class="btn sm ghost" data-in>' + HM.icon('file') + HM.esc(t('in')) + '</button>'
    });
    html += HM.so([
      { l: t('kNguoi'), v: HT.fmt.n(ds.length) },
      { l: t('kMo'), v: HT.fmt.n(mo) },
      { l: t('kQuaHan'), v: HT.fmt.n(qh), s: t('kQuaHanS'), mau: qh ? HB.mau('no') : HB.mau('ok') },
      { l: t('kDungHan'), v: coHan ? HT.fmt.pct(dung / coHan) : '—', s: t('kDungHanS'), lon: true,
        mau: coHan ? HB.mau(dung / coHan >= 0.9 ? 'ok' : dung / coHan >= 0.75 ? 'warn' : 'no') : '' }
    ]);
    html += HM.tabs([
      { k: 'nguoi', l: t('tNguoi'), icon: 'user' },
      { k: 'thang', l: t('tThang'), icon: 'chart' },
      { k: 'qt', l: t('tQt'), icon: 'list' }
    ], TAB);

    if (TAB === 'nguoi') html += veNguoi(c, ds);
    if (TAB === 'thang') html += veThang(c);
    if (TAB === 'qt') html += veQt(c);

    root.innerHTML = html;
    HB.gan(root);
    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-in]', function () { inRa(c, ds); });
    HM.doi(root, '[data-vai]', function (el) { LOC.vai = el.value; c.veLai(); });
    HM.bam(root, '[data-nv]', function (el) { moNv(c, el.getAttribute('data-nv')); });
    HM.bam(root, '[data-qt]', function (el) { moQt(c, el.getAttribute('data-qt')); });
  }
});

/* cây tổ chức trả về theo khối; chỉ cần tên khối để đọc cho dễ */
var _khoi = null;
function KHOI(A) { if (!_khoi) { try { _khoi = (A.toChuc.cay() || {}).khoi || []; } catch (e) { _khoi = []; } } return _khoi; }

function tenMuc(c, m) { return m ? (c.lang === 'en' ? m.en : m.vi) : '—'; }
function kieuMuc(m) { return !m ? '' : m.id === 'tot' ? 'ok' : m.id === 'dat' ? '' : 'warn'; }
function tenLoai(c, loai) {
  var t = c.t;
  return loai === 'ticket' ? t('lTicket') : loai === 'khieuNai' ? t('lKhieuNai') : t('lPhatHanh');
}

/* =====================================================================
   TAB 1 — THEO NGƯỜI
   ===================================================================== */
function veNguoi(c, ds) {
  var A = c.A, t = c.t;
  var loc = LOC.vai ? ds.filter(function (r) { return r.role === LOC.vai; }) : ds;
  var vais = [];
  ds.forEach(function (r) { if (vais.indexOf(r.role) < 0) vais.push(r.role); });

  var thanh = '<div class="bar">' +
    '<select class="in" data-vai style="width:auto;height:34px" aria-label="' + HM.esc(t('cVai')) + '">' +
      '<option value="">' + HM.esc(t('moiVai')) + '</option>' +
      vais.map(function (v) {
        var k = KHOI(A).filter(function (x) { return x.vai === v; })[0];
        return '<option value="' + v + '"' + (LOC.vai === v ? ' selected' : '') + '>' + HM.esc(k ? c.song(k, 'vi') : v) + '</option>';
      }).join('') + '</select></div>';

  if (!loc.length) return HM.the({ h2: HM.esc(t('tNguoi')), than: thanh + HM.trong({ icon: 'user', tieuDe: t('khong'), moTa: t('nguon') }) });

  var than = thanh + '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cNguoi')) + '</th><th>' + HM.esc(t('cCap')) + '</th>' +
    '<th class="num">' + HM.esc(t('cGiao')) + '</th><th class="num">' + HM.esc(t('cDangLam')) + '</th>' +
    '<th class="num">' + HM.esc(t('cDungHan')) + '</th><th class="num">' + HM.esc(t('cQuaHan')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTyLe')) + HM.hoi(t('nguon')) + '</th>' +
    '<th class="num">' + HM.esc(t('cGio')) + '</th><th>' + HM.esc(t('cMuc')) + '</th></tr></thead><tbody>' +
    loc.map(function (r) {
      return '<tr class="pick" data-nv="' + r.id + '">' +
        '<td>' + HM.tenBia({ ten: r.name, seed: r.email, phu: r.email }) + '</td>' +
        '<td>' + HM.tag('Level ' + r.cap, r.cap <= 2 ? 'ok' : '') + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(r.giao)) + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(r.dangLam)) + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(r.dungHan)) + '</td>' +
        '<td class="num mono">' + (r.quaHan ? '<span class="neg">' + HM.esc(HT.fmt.n(r.quaHan)) + '</span>' : '<span class="nil">0</span>') + '</td>' +
        '<td class="num mono"><b>' + (r.tyLeDungHan == null ? '<span class="nil">—</span>' : HM.esc(HT.fmt.pct(r.tyLeDungHan / 100))) + '</b></td>' +
        '<td class="num mono muted">' + (r.gioTb == null ? '—' : HM.esc(HT.fmt.n(r.gioTb) + ' ' + t('gio'))) + '</td>' +
        '<td>' + HM.tag(tenMuc(c, r.muc), kieuMuc(r.muc)) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  return HM.the({ h2: HM.esc(t('tNguoi')), p: HM.esc(t('nguon')), thoBody: true, than: than });
}

/* ---- ngăn trượt: một người ---- */
function moNv(c, id) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var x = A.hieuSuat.cua(id);
  if (!x) return;
  var nam = new Date().getFullYear();
  var dg = x.danhGia ? x.danhGia[nam] : null;

  var bd = x.theoThang.length > 1 ? HB.o({ loai: 'cot', cao: 170, chuThich: true,
    truc: x.theoThang.map(function (m) { return m.thang.slice(5) + '/' + m.thang.slice(2, 4); }),
    chuoi: [
      { ten: t('bdGiao'), gt: x.theoThang.map(function (m) { return m.giao; }), mau: P[0] },
      { ten: t('bdXong'), gt: x.theoThang.map(function (m) { return m.xong; }), mau: HB.mau('ok') },
      { ten: t('bdQuaHan'), gt: x.theoThang.map(function (m) { return m.quaHan; }), mau: HB.mau('no') }
    ] }) : '';

  /* Người khối kinh doanh: thêm doanh số. Hai thước đo cạnh nhau mới đủ —
     đúng hạn mà không có doanh số cũng không phải là làm tốt. */
  var kd = '';
  if (x.role === 'sales') {
    var k = null;
    try { k = A.sales.kpi(x.id, c.ky.idx); } catch (e) { k = null; }
    if (k) {
      kd = '<h4 class="sec">' + HM.esc(t('kd')) + '</h4>' +
        '<p class="hint">' + HM.esc(t('kdMo')) + '</p>' +
        HM.kv([
          { t: t('kdTk'), v: HT.fmt.n(k.accounts), manh: true },
          { t: t('kdQuy'), v: c.tien(k.revenueQ) },
          { t: t('kdChiTieu'), v: k.target ? c.tien(k.target) : '—' },
          { t: t('kdDat'), v: k.targetPct == null ? '—' : HT.fmt.pct(k.targetPct),
            manh: true, mau: k.targetPct == null ? '' : k.targetPct >= 1 ? 'pos' : 'neg' },
          { t: t('kdMoi'), v: HT.fmt.n(k.newAccounts) },
          { t: t('kdGiaHan'), v: HT.fmt.n(k.renewals.length), mau: k.renewals.length ? 'neg' : '' },
          { t: t('kdChuaVao'), v: HT.fmt.n(k.neverLogged) }
        ]);
    }
  }

  var dsMo = x.viecMo.length
    ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('dViec')) + '</th><th>' + HM.esc(t('dLoai')) + '</th>' +
      '<th>' + HM.esc(t('dBuoc')) + '</th><th>' + HM.esc(t('dHan')) + '</th></tr></thead><tbody>' +
      x.viecMo.map(function (v) {
        return '<tr><td><b>' + HM.esc(HM.dai(v.tieuDe, 44)) + '</b><div class="t-sub">' + HM.esc(v.id) + '</div></td>' +
          '<td>' + HM.tag(tenLoai(c, v.loai), '') + '</td>' +
          '<td class="mono">' + (v.buocTong ? HM.esc(v.buocXong + '/' + v.buocTong) + (v.buocTiep ? '<div class="t-sub">' + HM.esc(v.buocTiep) + '</div>' : '') : '<span class="nil">—</span>') + '</td>' +
          '<td>' + (v.han ? '<span class="' + (v.quaHan ? 'neg' : 'muted') + '">' + HM.esc(HT.fmt.ngay(String(v.han).slice(0, 10))) + '</span>' : '<span class="nil">—</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    : '<p class="hint">' + HM.esc(t('dTrong')) + '</p>';

  var dsQh = x.quaHanGanDay.length
    ? '<ul class="say-list">' + x.quaHanGanDay.map(function (v) {
        return '<li>' + HM.esc(HM.dai(v.tieuDe, 40)) + ' <span class="muted">· ' + HM.esc(tenLoai(c, v.loai) + ' · ' + v.id) + '</span></li>';
      }).join('') + '</ul>'
    : '<p class="hint">' + HM.esc(t('dQhTrong')) + '</p>';

  c.nganTruot(
    HM.kv([
      { t: t('cCap'), v: 'Level ' + x.cap + ' · ' + (c.lang === 'en' ? x.capTen.en : x.capTen.vi) },
      { t: t('cGiao'), v: HT.fmt.n(x.giao), manh: true },
      { t: t('cDangLam'), v: HT.fmt.n(x.dangLam) },
      { t: t('cDungHan'), v: HT.fmt.n(x.dungHan) + ' / ' + HT.fmt.n(x.coHan) },
      { t: t('cQuaHan'), v: HT.fmt.n(x.quaHan), mau: x.quaHan ? 'neg' : '' },
      { t: t('cTyLe'), v: x.tyLeDungHan == null ? '—' : HT.fmt.pct(x.tyLeDungHan / 100), manh: true },
      { t: t('cGio'), v: x.gioTb == null ? '—' : HT.fmt.n(x.gioTb) + ' ' + t('gio') },
      { t: t('cMuc'), v: tenMuc(c, x.muc) }
    ]) +
    kd +
    (bd ? '<h4 class="sec">' + HM.esc(t('dThang')) + '</h4>' + bd : '') +
    '<h4 class="sec">' + HM.esc(t('dDangLam')) + '</h4>' + dsMo +
    '<h4 class="sec">' + HM.esc(t('dQuaHan')) + '</h4>' + dsQh +
    '<h4 class="sec">' + HM.esc(t('dg')) + '</h4>' +
    (dg
      ? HM.kv([{ t: t('dgMuc'), v: dg.muc || '—', manh: true }, { t: t('dgNhanXet'), v: dg.nhanXet || '—' },
               { t: t('dgNam'), v: String(nam) + ' · ' + (dg.by || '') + ' · ' + HT.fmt.luc(dg.at) }])
      : '<p class="hint">' + HM.esc(t('dgChua')) + '</p>') +
    '<div class="btnrow" style="margin-top:12px"><button type="button" class="btn sm pri" data-dg>' + HM.esc(t('dgVier')) + '</button></div>',
    { tieuDe: t('dTieu').replace('{n}', x.name), phu: x.email, khiMo: function (dr) {
      HM.bam(dr, '[data-dg]', function () {
        var mucs = A.hieuSuat.muc();
        c.hoiThoai({ tieuDe: t('dgVier') + ' · ' + x.name, moTa: HM.esc(t('dgMo')),
          than: '<label class="fld">' + HM.esc(t('dgMuc')) + '</label>' +
            '<select class="in" data-o="muc">' + mucs.map(function (m) {
              return '<option value="' + HM.esc(c.lang === 'en' ? m.en : m.vi) + '"' + (dg && dg.muc === (c.lang === 'en' ? m.en : m.vi) ? ' selected' : '') + '>' + HM.esc(c.lang === 'en' ? m.en : m.vi) + '</option>';
            }).join('') + '</select>' +
            '<label class="fld">' + HM.esc(t('dgNhanXet')) + '</label>' +
            '<textarea class="in" data-o="nx" rows="4">' + HM.esc(dg ? dg.nhanXet || '' : '') + '</textarea>',
          dong: t('dgLuu') }).then(function (f) {
          if (!f) return;
          try {
            A.hieuSuat.ghiDanhGia(x.id, nam, { muc: f.muc, nhanXet: f.nx }, A.staff.me.name);
            c.thongBao(t('dgDaLuu').replace('{n}', x.name).replace('{y}', nam), 'ok');
            c.dongNgan(); c.veLai();
          } catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
    } });
}

/* =====================================================================
   TAB 2 — THEO THÁNG
   ===================================================================== */
function veThang(c) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var ds = A.hieuSuat.congTy();
  if (!ds.length) return HM.the({ h2: HM.esc(t('tThang')), than: HM.trong({ icon: 'chart', tieuDe: t('khong'), moTa: t('thangMo') }) });
  var bang = A.hieuSuat.bang();
  var xh = bang.filter(function (r) { return r.quaHan > 0; }).slice(0, 10);

  /* Gộp theo khối: một tháng cả công ty đuối thường là một khối đuối, chứ
     không phải mọi người cùng chậm. Cột này chỉ ra đúng khối ấy. */
  var khoi = {};
  bang.forEach(function (r) {
    var k = khoi[r.role] || (khoi[r.role] = { role: r.role, nguoi: 0, giao: 0, dangLam: 0, quaHan: 0, coHan: 0, dungHan: 0 });
    k.nguoi++; k.giao += r.giao; k.dangLam += r.dangLam; k.quaHan += r.quaHan; k.coHan += r.coHan; k.dungHan += r.dungHan;
  });
  var dsKhoi = Object.keys(khoi).map(function (v) {
    var k = khoi[v], kh = KHOI(A).filter(function (x) { return x.vai === v; })[0];
    k.ten = kh ? c.song(kh, 'vi') : v;
    k.tyLe = k.coHan ? Math.round(k.dungHan / k.coHan * 1000) / 10 : null;
    return k;
  }).sort(function (a, b) { return b.giao - a.giao; });

  var bangThang = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('dThang')) + '</th><th class="num">' + HM.esc(t('bdGiao')) + '</th>' +
    '<th class="num">' + HM.esc(t('bdXong')) + '</th><th class="num">' + HM.esc(t('bdQuaHan')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTyLe')) + '</th></tr></thead><tbody>' +
    ds.slice().reverse().map(function (m) {
      var tl = m.giao ? (m.giao - m.quaHan) / m.giao : null;
      return '<tr><td class="mono">' + HM.esc(m.thang.slice(5) + '/' + m.thang.slice(0, 4)) + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(m.giao)) + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(m.xong)) + '</td>' +
        '<td class="num mono">' + (m.quaHan ? '<span class="neg">' + HM.esc(HT.fmt.n(m.quaHan)) + '</span>' : '<span class="nil">0</span>') + '</td>' +
        '<td class="num mono"><b>' + (tl == null ? '—' : HM.esc(HT.fmt.pct(tl))) + '</b></td></tr>';
    }).join('') + '</tbody></table></div>';

  var bangKhoi = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('qtKhoi')) + '</th><th class="num">' + HM.esc(t('kNguoi')) + '</th>' +
    '<th class="num">' + HM.esc(t('cGiao')) + '</th><th class="num">' + HM.esc(t('cDangLam')) + '</th>' +
    '<th class="num">' + HM.esc(t('cQuaHan')) + '</th><th class="num">' + HM.esc(t('cTyLe')) + '</th></tr></thead><tbody>' +
    dsKhoi.map(function (k) {
      return '<tr><td><b>' + HM.esc(k.ten) + '</b></td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(k.nguoi)) + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(k.giao)) + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(k.dangLam)) + '</td>' +
        '<td class="num mono">' + (k.quaHan ? '<span class="neg">' + HM.esc(HT.fmt.n(k.quaHan)) + '</span>' : '<span class="nil">0</span>') + '</td>' +
        '<td class="num mono"><b>' + (k.tyLe == null ? '—' : HM.esc(HT.fmt.pct(k.tyLe / 100))) + '</b></td></tr>';
    }).join('') + '</tbody></table></div>';

  var bd = ds.length > 1 ? HB.o({ loai: 'cot', cao: 220, chuThich: true, dinhDang: 'so',
    truc: ds.map(function (m) { return m.thang.slice(5) + '/' + m.thang.slice(2, 4); }),
    chuoi: [
      { ten: t('bdGiao'), gt: ds.map(function (m) { return m.giao; }), mau: P[0] },
      { ten: t('bdXong'), gt: ds.map(function (m) { return m.xong; }), mau: HB.mau('ok') },
      { ten: t('bdQuaHan'), gt: ds.map(function (m) { return m.quaHan; }), mau: HB.mau('no') }
    ] }) : '';

  return HM.the({ h2: HM.esc(t('tThang')), p: HM.esc(t('thangMo')),
      than: bd + bangThang }) +
    '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('qtKhoi')), p: HM.esc(t('nguon')), thoBody: true, than: bangKhoi }) +
    HM.the({ h2: HM.esc(t('cQuaHan')), p: HM.esc(t('kQuaHanS')),
      than: xh.length ? HM.xepHang(xh.map(function (r) {
          return { ten: r.name, gt: r.quaHan, phu: 'Level ' + r.cap, attr: 'data-nv="' + r.id + '"',
            mau: HB.mau('no'), phuV: r.tyLeDungHan == null ? '' : HT.fmt.pct(r.tyLeDungHan / 100) };
        }), { dinhDang: function (v) { return HT.fmt.n(v); } })
        : HM.trong({ icon: 'check', tieuDe: t('dQhTrong'), moTa: t('kQuaHanS') }) }) +
    '</div>';
}

/* =====================================================================
   TAB 3 — QUY TRÌNH TỪNG LOẠI VIỆC
   ===================================================================== */
function veQt(c) {
  var A = c.A, t = c.t;
  var ds = A.quyTrinh.list();
  var nhip = { ngay: t('nhipNgay'), thang: t('nhipThang'), viec: t('nhipViec') };
  return HM.the({ h2: HM.esc(t('tQt')), p: HM.esc(t('qtMo')), icon: 'list', thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('tQt')) + '</th><th>' + HM.esc(t('qtKhoi')) + '</th>' +
      '<th>' + HM.esc(t('qtNhip')) + '</th><th class="num">' + HM.esc(t('dBuoc')) + '</th></tr></thead><tbody>' +
      ds.map(function (q) {
        var k = KHOI(A).filter(function (x) { return x.vai === q.vai; })[0];
        return '<tr class="pick" data-qt="' + HM.esc(q.id) + '">' +
          '<td><b>' + HM.esc(c.lang === 'en' ? q.en : q.vi) + '</b><div class="t-sub">' + HM.esc(HM.dai(c.lang === 'en' ? (q.moEn || q.mo) : q.mo, 92)) + '</div></td>' +
          '<td>' + HM.esc(k ? c.song(k, 'vi') : q.vai) + '</td>' +
          '<td>' + HM.esc(nhip[q.nhip] || q.nhip) + '</td>' +
          '<td class="num mono">' + HM.esc(t('qtSoBuoc').replace('{n}', q.soBuoc)) + '</td></tr>';
      }).join('') + '</tbody></table></div>' });
}

function moQt(c, id) {
  var q = c.A.quyTrinh.get(id);
  if (!q) return;
  c.nganTruot(HTS.soTay(c, id),
    { tieuDe: c.lang === 'en' ? q.en : q.vi, phu: c.t('qtSoBuoc').replace('{n}', q.buoc.length) });
}

/* ---- bản in ---- */
function inRa(c, ds) {
  var t = c.t, A = c.A;
  var than = '<h2>' + HM.esc(t('tNguoi')) + '</h2>' +
    '<table><thead><tr><th>' + HM.esc(t('cNguoi')) + '</th><th>' + HM.esc(t('cCap')) + '</th>' +
    '<th class="num">' + HM.esc(t('cGiao')) + '</th><th class="num">' + HM.esc(t('cDangLam')) + '</th>' +
    '<th class="num">' + HM.esc(t('cDungHan')) + '</th><th class="num">' + HM.esc(t('cQuaHan')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTyLe')) + '</th><th class="num">' + HM.esc(t('cGio')) + '</th>' +
    '<th>' + HM.esc(t('cMuc')) + '</th></tr></thead><tbody>' +
    ds.map(function (r) {
      return '<tr><td>' + HM.esc(r.name) + '</td><td>Level ' + r.cap + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(r.giao)) + '</td><td class="num">' + HM.esc(HT.fmt.n(r.dangLam)) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(r.dungHan)) + '</td><td class="num">' + HM.esc(HT.fmt.n(r.quaHan)) + '</td>' +
        '<td class="num">' + (r.tyLeDungHan == null ? '—' : HM.esc(HT.fmt.pct(r.tyLeDungHan / 100))) + '</td>' +
        '<td class="num">' + (r.gioTb == null ? '—' : HM.esc(HT.fmt.n(r.gioTb) + ' ' + t('gio'))) + '</td>' +
        '<td>' + HM.esc(tenMuc(c, r.muc)) + '</td></tr>';
    }).join('') + '</tbody></table>' +
    '<div class="in-ghi">' + HM.esc(t('nguon')) + '</div>';
  HM.banIn({ tieuDe: t('inTieu'), phu: t('inPhu'), than: than, nguoi: A.staff.me.name });
}

})();
