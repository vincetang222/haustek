/* =====================================================================
   NỘI BỘ · HỖ TRỢ
   ---------------------------------------------------------------------
   Hàng đợi ticket của đối tác (gửi từ cổng đối tác hoặc nhân viên tạo hộ)
   và cửa dẫn sang khiếu nại bản quyền. Một ticket đi qua bốn trạng thái:
   mới → đang xử lý → chờ phản hồi → đã xong; hạn xử lý tính theo ưu tiên.
   Màn này xuất hai hàm cho màn khác dùng:
     HT.moTicketNoiBo(c, {partyKey, name, clientId})  hộp thoại tạo ticket
     HT.hoTroMo(c, id)                                 mở thẳng một ticket
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'ticket', tim: '', loai: '', tt: 'open-all', nv: '', uu: '', toi: false,
            sx: 'updatedAt', dir: -1, co: 25, moId: null };
var BANG = null;

var UU = ['low', 'normal', 'high', 'urgent'];
var TT = ['open', 'in_progress', 'waiting', 'done'];
var KIEU_UU = { low: '', normal: 'info', high: 'warn', urgent: 'no' };
var KIEU_TT = { open: 'info', in_progress: 'link', waiting: 'warn', done: 'ok' };
var KIEU_KN = { open: 'info', disputed: 'warn', escalated: 'no', resolved: 'ok', released: '' };

var CHU = {
  vi: {
    navHoTro: 'Hỗ trợ', h1: 'Hỗ trợ đối tác',
    mo: 'Ticket đối tác gửi lên hoặc nhân viên tạo hộ, theo hạn xử lý và người phụ trách. Khiếu nại bản quyền xử lý ở trang Quản lý quyền.',
    tTicket: 'Ticket', tKn: 'Khiếu nại bản quyền',
    kDangMo: 'Ticket đang mở', kQuaHan: 'Quá hạn', kKhan: 'Khẩn cấp', kCho: 'Chờ phản hồi', kXong: 'Đã xong', kTong: 'tổng',
    low: 'Thấp', normal: 'Bình thường', high: 'Cao', urgent: 'Khẩn',
    open: 'Mới', in_progress: 'Đang xử lý', waiting: 'Chờ phản hồi', done: 'Đã xong',
    knOpen: 'Mới', knDisputed: 'Đang tranh chấp', knEscalated: 'Đã leo thang', knResolved: 'Đã giải quyết', knReleased: 'Đã nhả',
    tim: 'Tìm mã ticket, tiêu đề, đối tác…',
    moiLoai: 'Mọi loại', moiTt: 'Mọi trạng thái', dangMoHet: 'Đang mở (tất cả)', moiNv: 'Mọi người phụ trách', chuaGan: 'chưa gán', moiUu: 'Mọi ưu tiên',
    chiToi: 'Chỉ của tôi', taoTicket: 'Tạo ticket hộ đối tác', xuat: 'Xuất CSV',
    cMa: 'Mã', cUu: 'Ưu tiên', cLoai: 'Loại', cTieuDe: 'Tiêu đề', cBai: 'Bài hát', cNv: 'Người phụ trách', cHan: 'Hạn', cCapNhat: 'Cập nhật', cTt: 'Trạng thái',
    khong: 'Không có ticket nào', khongMo: 'Đổi bộ lọc phía trên, hoặc tạo ticket hộ đối tác.',
    quaHan: 'quá hạn', dDoiTac: 'Đối tác', dNguoiTao: 'Người tạo', nguonPortal: 'gửi từ cổng đối tác', nguonStaff: 'nhân viên tạo hộ',
    dTaoLuc: 'Tạo lúc', dDong: 'Đóng lúc', hanhDong: 'Hành động', nhanViec: 'Nhận việc', ganCho: 'Gán cho…', doiTt: 'Đổi trạng thái…', doiUu: 'Đổi ưu tiên…',
    luongTin: 'Trao đổi', benDoiTac: 'Đối tác', benHaustek: 'Haustek', traLoi: 'Trả lời', guiTraLoi: 'Gửi trả lời',
    guiMo: 'Đối tác thấy nội dung này trên cổng của họ. Ticket mới sẽ tự chuyển sang đang xử lý.',
    daNhan: 'Đã nhận việc', daGan: 'Đã gán cho', daDoiTt: 'Đã đổi trạng thái', daDoiUu: 'Đã đổi ưu tiên', daGui: 'Đã gửi trả lời',
    taoMo: 'Dùng khi đối tác gọi điện hoặc gửi email thay vì tạo ticket trên cổng. Đối tác thấy ticket này trong mục Hỗ trợ của họ.',
    hDoiTac: 'Đối tác', hTimDt: 'Nhập tên hoặc mã đối tác', daChon: 'Đã chọn', khongThay: 'Không tìm thấy', hLoai: 'Loại yêu cầu', hTieuDe: 'Tiêu đề', hNoiDung: 'Nội dung',
    taoGhi: 'Hạn xử lý tính theo ưu tiên: khẩn 1 ngày, cao 2 ngày, bình thường 3 ngày, thấp 7 ngày.',
    canDoiTac: 'Chưa chọn đối tác', canTieuDe: 'Chưa nhập tiêu đề', daTao: 'Đã tạo ticket',
    ngheSi: 'Nghệ sĩ', ngheSiDl: 'Nghệ sĩ độc lập', labelCon: 'Label con', thuoc: 'thuộc',
    knMo: 'Xung đột Content ID và khiếu nại trên nền tảng được xử lý ở trang Quản lý quyền. Ở đây chỉ tóm tắt số đang mở.',
    knDangMo: 'Đang mở', knXem: 'Lượt xem/ngày đang tranh chấp', knTheoTt: 'Khiếu nại theo trạng thái', knDau: 'Khiếu nại đang mở có lượt xem cao nhất',
    moQuyen: 'Mở quản lý quyền', cNenTang: 'Nền tảng', cXem: 'Lượt xem/ngày', khieuNai: 'khiếu nại', ticket: 'ticket'
  },
  en: {
    navHoTro: 'Support', h1: 'Partner support',
    mo: 'Tickets raised by partners or logged on their behalf, by due date and assignee. Rights claims are handled on the Rights page.',
    tTicket: 'Tickets', tKn: 'Rights claims',
    kDangMo: 'Open tickets', kQuaHan: 'Overdue', kKhan: 'Urgent', kCho: 'Waiting', kXong: 'Done', kTong: 'total',
    low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent',
    open: 'New', in_progress: 'In progress', waiting: 'Waiting', done: 'Done',
    knOpen: 'New', knDisputed: 'Disputed', knEscalated: 'Escalated', knResolved: 'Resolved', knReleased: 'Released',
    tim: 'Search ticket ID, title, partner…',
    moiLoai: 'All types', moiTt: 'All statuses', dangMoHet: 'Open (all)', moiNv: 'All assignees', chuaGan: 'unassigned', moiUu: 'All priorities',
    chiToi: 'Mine only', taoTicket: 'Log a ticket for a partner', xuat: 'Export CSV',
    cMa: 'ID', cUu: 'Priority', cLoai: 'Type', cTieuDe: 'Title', cBai: 'Track', cNv: 'Assignee', cHan: 'Due', cCapNhat: 'Updated', cTt: 'Status',
    khong: 'No tickets', khongMo: 'Change the filters above, or log a ticket for a partner.',
    quaHan: 'overdue', dDoiTac: 'Partner', dNguoiTao: 'Created by', nguonPortal: 'from the partner portal', nguonStaff: 'logged by staff',
    dTaoLuc: 'Created', dDong: 'Closed', hanhDong: 'Actions', nhanViec: 'Take it', ganCho: 'Assign to…', doiTt: 'Change status…', doiUu: 'Change priority…',
    luongTin: 'Conversation', benDoiTac: 'Partner', benHaustek: 'Haustek', traLoi: 'Reply', guiTraLoi: 'Send reply',
    guiMo: 'The partner sees this on their portal. A new ticket moves to in progress automatically.',
    daNhan: 'Ticket taken', daGan: 'Assigned to', daDoiTt: 'Status changed', daDoiUu: 'Priority changed', daGui: 'Reply sent',
    taoMo: 'For requests that arrive by phone or email instead of the portal. The partner sees this ticket under Support on their side.',
    hDoiTac: 'Partner', hTimDt: 'Type a partner name or ID', daChon: 'Selected', khongThay: 'Not found', hLoai: 'Request type', hTieuDe: 'Title', hNoiDung: 'Details',
    taoGhi: 'Due date follows priority: urgent 1 day, high 2 days, normal 3 days, low 7 days.',
    canDoiTac: 'Pick a partner first', canTieuDe: 'Enter a title', daTao: 'Ticket created',
    ngheSi: 'Artist', ngheSiDl: 'Independent artist', labelCon: 'Sub-label', thuoc: 'under',
    knMo: 'Content ID conflicts and platform claims are handled on the Rights page. This is only a summary of what is open.',
    knDangMo: 'Open', knXem: 'Daily views in dispute', knTheoTt: 'Claims by status', knDau: 'Open claims with the most daily views',
    moQuyen: 'Open rights', cNenTang: 'Platform', cXem: 'Views/day', khieuNai: 'claims', ticket: 'tickets'
  }
};
function T(k) { return (CHU[HT.lang] || CHU.vi)[k] || k; }

function bayGio() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
function tenNv(A, id) { var s = id ? A.staff.get(id) : null; return s ? s.name : ''; }
function tenTheoEmail(A, email) {
  var s = A.staff.list().filter(function (x) { return x.email === email; })[0];
  return s ? s.name : email;
}
function loaiCua(A, id) {
  return A.tickets.types.filter(function (x) { return x.id === id; })[0] || { id: id, label: id, labelEn: id };
}
function quaHan(tk) { return tk.status !== 'done' && tk.dueAt < bayGio(); }
function nhanKn(s) { return T('kn' + s.charAt(0).toUpperCase() + s.slice(1)); }

HT.dangKy({
  id: 'ho-tro', nav: 'navHoTro', nhom: 'nhomDoiTac', icon: 'info',
  vai: ['support', 'ops', 'accounting', 'mgmt', 'sales'],
  chu: CHU,

  dem: function (c) {
    var k = c.A.tickets.counts();
    var mo = k.open + k.in_progress + k.waiting;
    return k.overdue ? '!' + k.overdue : (mo ? String(mo) : '');
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var dem = A.tickets.counts(), kn = A.claims.counts();
    var dangMo = dem.open + dem.in_progress + dem.waiting;
    var knMo = kn.open + kn.disputed + kn.escalated;

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')), nut: LOC.tab === 'khieunai' ? '' : '<button type="button" class="btn pri" data-tao>' + HM.icon('info') + HM.esc(t('taoTicket')) + '</button>' });
    html += HM.tabs([
      { k: 'ticket', l: t('tTicket'), icon: 'info', dem: dangMo },
      { k: 'khieunai', l: t('tKn'), icon: 'alert', dem: knMo }
    ], LOC.tab);

    var rows = [];
    if (LOC.tab === 'ticket') { rows = locTicket(c); html += veTicket(c, dem, rows); }
    else html += veKhieuNai(c, kn, knMo);

    root.innerHTML = html;
    if (LOC.tab === 'ticket') dungBang(c, root, rows);
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) {
      LOC.tim = el.value; c.veLai();
      var o = document.querySelector('main [data-tim]');
      if (o) { o.focus(); try { o.setSelectionRange(o.value.length, o.value.length); } catch (e) {} }
    });
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; c.veLai(); });
    HM.doi(root, '[data-tt]', function (el) { LOC.tt = el.value; c.veLai(); });
    HM.doi(root, '[data-nv]', function (el) { LOC.nv = el.value; c.veLai(); });
    HM.doi(root, '[data-uu]', function (el) { LOC.uu = el.value; c.veLai(); });
    HM.bam(root, '[data-toi]', function () { LOC.toi = !LOC.toi; c.veLai(); });
    HM.bam(root, '[data-tao]', function () { moTao(c, null); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('ticket.csv',
        [t('cMa'), t('cUu'), t('cLoai'), t('cTieuDe'), t('dDoiTac'), t('cBai'), t('cNv'), t('cHan'), t('dTaoLuc'), t('cCapNhat'), t('cTt')],
        rows.map(function (r) {
          return [r.id, t(r.priority), r.loaiNhan, r.title, r.party.name + ' · ' + r.party.clientId, r.baiTen, r.nvTen, r.dueAt, r.createdAt, r.updatedAt, t(r.status)];
        }));
    });

    if (LOC.moId) { var id = LOC.moId; LOC.moId = null; moTicket(c, id); }
  }
});

/* ---------------------------------------------------------------------
   Lọc ticket theo thanh lọc; thêm vài cột dẫn xuất để bảng sắp xếp được
   (bảng dùng chung sắp xếp theo giá trị thô của khoá).
   --------------------------------------------------------------------- */
function locTicket(c) {
  var A = c.A, me = A.staff.me;
  var f = { q: LOC.tim.trim(), type: LOC.loai, priority: LOC.uu };
  if (LOC.tt) f.status = LOC.tt;
  if (LOC.toi) f.assignee = me.id;
  else if (LOC.nv && LOC.nv !== '-') f.assignee = LOC.nv;
  var ds = A.tickets.list(f);
  if (!LOC.toi && LOC.nv === '-') ds = ds.filter(function (x) { return !x.assignee; });
  return ds.map(function (x) {
    var o = Object.assign({}, x);
    o.uuIdx = UU.indexOf(x.priority);
    o.ttIdx = TT.indexOf(x.status);
    o.loaiNhan = c.song(loaiCua(A, x.type), 'label');
    o.baiTen = x.track ? x.track.title : '';
    o.nvTen = tenNv(A, x.assignee);
    o.tenDt = x.party.name;
    o.quaHan = quaHan(x);
    return o;
  });
}

function veTicket(c, dem, rows) {
  var A = c.A, t = c.t, me = A.staff.me;
  var dangMo = dem.open + dem.in_progress + dem.waiting;
  var sel = function (attr, gia, chon, rong) {
    return '<select class="in" ' + attr + ' style="width:auto;height:34px;max-width:' + (rong || 200) + 'px"' + '>' +
      chon.map(function (o) { return '<option value="' + HM.esc(o[0]) + '"' + (o[0] === gia ? ' selected' : '') + '>' + HM.esc(o[1]) + '</option>'; }).join('') +
      '</select>';
  };
  var html = HM.so([
    { l: t('kDangMo'), v: HT.fmt.n(dangMo), lon: true,
      s: dem.open + ' ' + t('open').toLowerCase() + ' · ' + dem.in_progress + ' ' + t('in_progress').toLowerCase() + ' · ' + dem.waiting + ' ' + t('waiting').toLowerCase() },
    { l: t('kQuaHan'), v: HT.fmt.n(dem.overdue), mau: dem.overdue ? HB.mau('danger') : '' },
    { l: t('kKhan'), v: HT.fmt.n(dem.urgent), mau: dem.urgent ? HB.mau('warn') : '' },
    { l: t('kCho'), v: HT.fmt.n(dem.waiting) },
    { l: t('kXong'), v: HT.fmt.n(dem.done), s: HT.fmt.n(dem.total) + ' ' + t('kTong') }
  ]);

  html += '<div class="bar">' +
    '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim value="' + HM.esc(LOC.tim) + '" placeholder="' + HM.esc(t('tim')) + '"></div>' +
    sel('data-loai', LOC.loai, [['', t('moiLoai')]].concat(A.tickets.types.map(function (x) { return [x.id, c.song(x, 'label')]; }))) +
    sel('data-tt', LOC.tt, [['open-all', t('dangMoHet')]].concat(TT.map(function (s) { return [s, t(s)]; })).concat([['', t('moiTt')]])) +
    (LOC.toi ? '' : sel('data-nv', LOC.nv, [['', t('moiNv')], ['-', t('chuaGan')]].concat(A.staff.list().map(function (s) { return [s.id, s.name]; })))) +
    sel('data-uu', LOC.uu, [['', t('moiUu')]].concat(UU.map(function (p) { return [p, t(p)]; }))) +
    '<button type="button" class="pill' + (LOC.toi ? ' on' : '') + '" data-toi>' + HM.icon('user') + HM.esc(t('chiToi')) +
      ' <span class="muted">' + A.tickets.counts(me.id).open + '</span></button>' +
    '<div class="sp"></div>' +
    '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button></div>';

  html += HM.the({ thoBody: true, than: '<div data-bang></div>' });
  return html;
}

function dungBang(c, root, rows) {
  var A = c.A, t = c.t;
  if (BANG) { LOC.sx = BANG.st.sort; LOC.dir = BANG.st.dir; LOC.co = BANG.st.co; }
  BANG = c.bang({
    host: root.querySelector('[data-bang]'), dong: function () { return rows; },
    sort: LOC.sx, dir: LOC.dir, co: LOC.co,
    cot: [
      { k: 'id', l: t('cMa'), w: '116px' },
      { k: 'uuIdx', l: t('cUu'), w: '104px' },
      { k: 'loaiNhan', l: t('cLoai'), w: '110px' },
      { k: 'title', l: t('cTieuDe') },
      { k: 'baiTen', l: t('cBai'), w: '150px' },
      { k: 'nvTen', l: t('cNv'), w: '140px' },
      { k: 'dueAt', l: t('cHan'), w: '128px' },
      { k: 'updatedAt', l: t('cCapNhat'), w: '128px' },
      { k: 'ttIdx', l: t('cTt'), w: '118px' }
    ],
    veDong: function (r) {
      return '<td class="mono">' + HM.esc(r.id) + '</td>' +
        '<td>' + HM.tag(t(r.priority), KIEU_UU[r.priority]) + '</td>' +
        '<td>' + HM.tag(r.loaiNhan, '') + '</td>' +
        '<td><div class="t-ttl">' + HM.esc(HM.dai(r.title, 64)) + '</div>' +
          '<div class="t-sub">' + HM.esc(r.party.name + ' · ' + r.party.clientId) + '</div></td>' +
        '<td>' + (r.track ? HM.tenBia({ bia: r.trackId, ten: HM.dai(r.track.title, 24), phu: r.track.isrc, cls: 'sm' }) : '<span class="nil">—</span>') + '</td>' +
        '<td>' + (r.nvTen ? HM.esc(r.nvTen) : '<span class="nil">' + HM.esc(t('chuaGan')) + '</span>') + '</td>' +
        '<td class="mono' + (r.quaHan ? ' neg' : '') + '">' + HM.esc(HT.fmt.luc(r.dueAt)) +
          (r.quaHan ? '<div class="t-sub neg">' + HM.esc(t('quaHan')) + '</div>' : '') + '</td>' +
        '<td class="mono muted">' + HM.esc(HT.fmt.luc(r.updatedAt)) + '</td>' +
        '<td>' + HM.tag(t(r.status), KIEU_TT[r.status]) + '</td>';
    },
    chon: function (r) { moTicket(c, r.id); },
    rongTieuDe: t('khong'), rongMoTa: t('khongMo')
  });
  BANG.ve();
}

/* =====================================================================
   TAB 2 — KHIẾU NẠI BẢN QUYỀN: chỉ tóm tắt và dẫn sang trang Quản lý quyền
   ===================================================================== */
function veKhieuNai(c, kn, knMo) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var dau = A.claims.list({ status: 'open-all' }).sort(function (a, b) { return b.dailyViews - a.dailyViews; }).slice(0, 8);
  var mauKn = { open: P[0], disputed: P[1], escalated: P[7], resolved: P[5], released: HB.mauKhac() };
  return HM.the({
    h2: HM.esc(t('tKn')), p: HM.esc(t('knMo')),
    hanhDong: '<button type="button" class="btn sm pri" data-di="quyen">' + HM.icon('out') + HM.esc(t('moQuyen')) + '</button>',
    than: HM.so([
      { l: t('knDangMo'), v: HT.fmt.n(knMo), mau: knMo ? HB.mau('warn') : '' },
      { l: t('knOpen'), v: HT.fmt.n(kn.open) },
      { l: t('knDisputed'), v: HT.fmt.n(kn.disputed) },
      { l: t('knEscalated'), v: HT.fmt.n(kn.escalated), mau: kn.escalated ? HB.mau('danger') : '' },
      { l: t('knXem'), v: HB.gonSo(kn.views) }
    ]) +
    '<div class="grid g2" style="margin:14px 0 0">' +
      '<div><h4 class="sec">' + HM.esc(t('knTheoTt')) + '</h4>' +
        HB.o({ loai: 'vong', cao: 170, dinhDang: 'so', tenTong: t('khieuNai'),
          phan: A.claims.statuses.map(function (s) { return { ten: nhanKn(s), gt: kn[s] || 0, mau: mauKn[s] }; }),
          giua: { v: HT.fmt.n(kn.total), l: t('khieuNai') } }) + '</div>' +
      '<div><h4 class="sec">' + HM.esc(t('knDau')) + '</h4>' +
        (dau.length ? '<div class="tw"><table class="t" style="min-width:0"><thead><tr>' +
          '<th>' + HM.esc(t('cMa')) + '</th><th>' + HM.esc(t('cBai')) + '</th><th>' + HM.esc(t('cNenTang')) + '</th>' +
          '<th class="num">' + HM.esc(t('cXem')) + '</th><th>' + HM.esc(t('cTt')) + '</th></tr></thead><tbody>' +
          dau.map(function (x) {
            return '<tr class="pick" data-di="quyen"><td class="mono">' + HM.esc(x.id) + '</td>' +
              '<td>' + HM.tenBia({ bia: x.trackId, ten: HM.dai(x.track.title, 22), phu: HM.dai(x.party.name, 24), cls: 'sm' }) + '</td>' +
              '<td>' + HM.esc(x.store) + '</td>' +
              '<td class="num">' + HM.esc(HT.fmt.n(x.dailyViews)) + '</td>' +
              '<td>' + HM.tag(nhanKn(x.status), KIEU_KN[x.status]) + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<p class="hint">—</p>') + '</div>' +
    '</div>'
  });
}

/* =====================================================================
   NGĂN TRƯỢT — một ticket: thông tin, hành động, trao đổi, ô trả lời
   ===================================================================== */
function moTicket(c, id) {
  var A = c.A, me = A.staff.me, tk = A.tickets.get(id);
  if (!tk) return;
  var qh = quaHan(tk), loai = loaiCua(A, tk.type), nv = tenNv(A, tk.assignee);
  var selNho = function (attr, dau, chon) {
    return '<select class="in" ' + attr + ' style="width:auto;height:28px;font-size:12.5px;padding:0 8px">' +
      '<option value="">' + HM.esc(dau) + '</option>' +
      chon.map(function (o) { return '<option value="' + HM.esc(o[0]) + '">' + HM.esc(o[1]) + '</option>'; }).join('') + '</select>';
  };
  var tin = tk.messages.map(function (m) {
    var staff = m.who === 'staff';
    var ai = staff ? T('benHaustek') + ' · ' + tenTheoEmail(A, m.by) : T('benDoiTac') + ' · ' + m.by;
    return '<div style="display:flex;justify-content:' + (staff ? 'flex-end' : 'flex-start') + ';margin:7px 0">' +
      '<div style="max-width:88%;min-width:0;background:' + (staff ? 'var(--accent-lo)' : 'var(--fill)') +
        ';border-radius:' + (staff ? '12px 12px 3px 12px' : '12px 12px 12px 3px') + ';padding:9px 12px;font-size:13px;line-height:1.55">' +
        '<div style="font-size:11.5px;color:var(--faint);margin-bottom:3px">' + HM.esc(ai + ' · ' + HT.fmt.luc(m.at)) + '</div>' +
        HM.esc(m.text || '') + '</div></div>';
  }).join('');

  c.nganTruot(
    '<div class="btnrow" style="margin-bottom:14px">' +
      HM.tag(T(tk.status), KIEU_TT[tk.status]) + HM.tag(T(tk.priority), KIEU_UU[tk.priority]) +
      HM.tag(c.song(loai, 'label'), '') + (qh ? HM.tag(T('quaHan'), 'no') : '') + '</div>' +
    HM.kv([
      { t: T('dDoiTac'), v: tk.party.name + ' · ' + tk.party.clientId, manh: true },
      tk.track ? { t: T('cBai'), v: tk.track.title + ' · ' + tk.track.isrc } : null,
      { t: T('dNguoiTao'), v: tk.createdBy + ' · ' + (tk.source === 'portal' ? T('nguonPortal') : T('nguonStaff')) },
      { t: T('dTaoLuc'), v: HT.fmt.luc(tk.createdAt) },
      { t: T('cHan'), v: HT.fmt.luc(tk.dueAt) + (qh ? ' · ' + T('quaHan') : ''), mau: qh ? 'neg' : '' },
      { t: T('cNv'), v: nv || T('chuaGan') },
      { t: T('cCapNhat'), v: HT.fmt.luc(tk.updatedAt) },
      tk.closedAt ? { t: T('dDong'), v: HT.fmt.luc(tk.closedAt) } : null
    ]) +
    '<h4 class="sec">' + HM.esc(T('hanhDong')) + '</h4>' +
    '<div class="btnrow">' +
      (tk.assignee !== me.id ? '<button type="button" class="btn sm pri" data-nhan>' + HM.icon('user') + HM.esc(T('nhanViec')) + '</button>' : '') +
      selNho('data-gan', T('ganCho'), A.staff.list().filter(function (s) { return s.id !== tk.assignee; }).map(function (s) { return [s.id, s.name + ' · ' + c.song(s, 'title')]; })) +
      selNho('data-doitt', T('doiTt'), TT.filter(function (s) { return s !== tk.status; }).map(function (s) { return [s, T(s)]; })) +
      selNho('data-doiuu', T('doiUu'), UU.filter(function (p) { return p !== tk.priority; }).map(function (p) { return [p, T(p)]; })) +
    '</div>' +
    '<h4 class="sec">' + HM.esc(T('luongTin')) + ' (' + tk.messages.length + ')</h4>' +
    '<div>' + tin + '</div>' +
    '<h4 class="sec">' + HM.esc(T('traLoi')) + '</h4>' +
    '<textarea class="in" data-tl rows="3"></textarea>' +
    '<div class="btnrow" style="margin-top:8px"><button type="button" class="btn sm pri" data-gui>' + HM.esc(T('guiTraLoi')) + '</button>' +
      '<span class="hint" style="margin:0">' + HM.esc(T('guiMo')) + '</span></div>',
    { tieuDe: tk.title, phu: tk.id + ' · ' + tk.party.clientId, khiMo: function (dr) {
      var lam = function (fn, msg) {
        try { fn(); c.thongBao(msg, 'ok'); LOC.moId = id; c.veLai(); }
        catch (e) { c.thongBao(e.message, 'no'); }
      };
      HM.bam(dr, '[data-nhan]', function () { lam(function () { A.tickets.assign(id, me.id, me.email); }, T('daNhan') + ' · ' + id); });
      HM.doi(dr, '[data-gan]', function (el) {
        if (!el.value) return;
        var ten = tenNv(A, el.value);
        lam(function () { A.tickets.assign(id, el.value, me.email); }, T('daGan') + ' ' + ten);
      });
      HM.doi(dr, '[data-doitt]', function (el) {
        if (!el.value) return;
        var s = el.value;
        lam(function () { A.tickets.setStatus(id, s, me.email); }, T('daDoiTt') + ' · ' + T(s));
      });
      HM.doi(dr, '[data-doiuu]', function (el) {
        if (!el.value) return;
        var p = el.value;
        lam(function () { A.tickets.setPriority(id, p, me.email); }, T('daDoiUu') + ' · ' + T(p));
      });
      HM.bam(dr, '[data-gui]', function () {
        var o = dr.querySelector('[data-tl]');
        lam(function () { A.tickets.reply(id, o.value, me.email); }, T('daGui'));
      });
    } }
  );
}

/* =====================================================================
   Hộp thoại tạo ticket hộ đối tác — dùng chung với màn Đối tác
   mac: {partyKey, name, clientId} để chọn sẵn đối tác, hoặc null
   ===================================================================== */
function moTao(c, mac) {
  var A = c.A, me = A.staff.me;
  c.hoiThoai({
    tieuDe: T('taoTicket'), moTa: HM.esc(T('taoMo')),
    than:
      '<label class="fld">' + HM.esc(T('hDoiTac')) + '</label>' +
      '<input class="in" data-timben placeholder="' + HM.esc(T('hTimDt')) + '" value="' + HM.esc(mac ? mac.name : '') + '">' +
      '<input type="hidden" data-o="key" value="' + HM.esc(mac ? mac.partyKey : '') + '">' +
      '<div data-kq style="margin-top:6px;max-height:170px;overflow:auto">' +
        (mac ? '<p class="hint pos">' + HM.esc(T('daChon') + ': ' + mac.name + (mac.clientId ? ' · ' + mac.clientId : '')) + '</p>' : '') + '</div>' +
      '<div class="fldrow two-up" style="margin-top:12px">' +
        '<div><label class="fld">' + HM.esc(T('hLoai')) + '</label><select class="in" data-o="loai">' +
          A.tickets.types.map(function (x) { return '<option value="' + x.id + '">' + HM.esc(c.song(x, 'label')) + '</option>'; }).join('') + '</select></div>' +
        '<div><label class="fld">' + HM.esc(T('cUu')) + '</label><select class="in" data-o="uu">' +
          UU.map(function (p) { return '<option value="' + p + '"' + (p === 'normal' ? ' selected' : '') + '>' + HM.esc(T(p)) + '</option>'; }).join('') + '</select></div>' +
      '</div>' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(T('hTieuDe')) + '</label><input class="in" data-o="tieuDe">' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(T('hNoiDung')) + '</label><textarea class="in" data-o="noiDung" rows="3"></textarea>' +
      '<div class="hint">' + HM.esc(T('taoGhi')) + '</div>',
    dong: T('taoTicket'),
    khiMo: function (bg) {
      var o = bg.querySelector('[data-timben]'), kq = bg.querySelector('[data-kq]'), an = bg.querySelector('[data-o=key]');
      var hen = null;
      var lam = function () {
        var s = o.value.trim().toLowerCase();
        an.value = '';
        if (s.length < 2) { kq.innerHTML = ''; return; }
        var hit = [];
        A.labels.forEach(function (x) {
          if (hit.length < 20 && (x.name.toLowerCase().indexOf(s) >= 0 || x.clientId.toLowerCase().indexOf(s) >= 0))
            hit.push({ key: x.key, name: x.name, ma: x.clientId, mo: x.parentId >= 0 ? T('labelCon') + ' · ' + A.labels[x.parentId].name : 'Label' });
        });
        A.artists.forEach(function (x) {
          if (hit.length < 20 && (x.name.toLowerCase().indexOf(s) >= 0 || x.clientId.toLowerCase().indexOf(s) >= 0))
            hit.push({ key: x.key, name: x.name, ma: x.clientId, mo: x.labelId >= 0 ? T('ngheSi') + ' ' + T('thuoc') + ' ' + A.labels[x.labelId].name : T('ngheSiDl') });
        });
        kq.innerHTML = hit.length
          ? '<div class="bars pick">' + hit.map(function (h) {
              return '<div class="row" data-pick="' + HM.esc(h.key) + '" data-ten="' + HM.esc(h.name) + '" data-ma="' + HM.esc(h.ma) + '">' +
                '<div class="nm"><b>' + HM.esc(HM.dai(h.name, 34)) + '</b><em>' + HM.esc(h.ma + ' · ' + h.mo) + '</em></div>' +
                '<div class="vv" style="font-size:12px" class="mono">' + HM.esc(h.key) + '</div></div>';
            }).join('') + '</div>'
          : '<p class="hint">' + HM.esc(T('khongThay')) + '</p>';
      };
      o.addEventListener('input', function () { clearTimeout(hen); hen = setTimeout(lam, 180); });
      kq.addEventListener('click', function (e) {
        var el = e.target.closest('[data-pick]');
        if (!el) return;
        an.value = el.getAttribute('data-pick');
        o.value = el.getAttribute('data-ten');
        kq.innerHTML = '<p class="hint pos">' + HM.esc(T('daChon') + ': ' + el.getAttribute('data-ten') + ' · ' + el.getAttribute('data-ma')) + '</p>';
      });
    }
  }).then(function (r) {
    if (!r) return;
    if (!r.key) { c.thongBao(T('canDoiTac'), 'no'); return; }
    var tieuDe = (r.tieuDe || '').trim();
    if (!tieuDe) { c.thongBao(T('canTieuDe'), 'no'); return; }
    try {
      var tk = A.tickets.create({ type: r.loai, title: tieuDe, body: (r.noiDung || '').trim() || tieuDe, partyKey: r.key, priority: r.uu }, me.email);
      c.thongBao(T('daTao') + ' · ' + tk.id, 'ok');
      LOC.moId = tk.id;
      if ((location.hash || '') === '#ho-tro') c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

/* Cửa cho màn khác: tạo ticket hộ đối tác, hoặc mở thẳng một ticket */
HT.moTicketNoiBo = function (c, mac) { moTao(c, mac || null); };
HT.hoTroMo = function (c, id) {
  LOC.moId = id; LOC.tab = 'ticket';
  if ((location.hash || '') === '#ho-tro') c.veLai(); else c.di('ho-tro');
};

})();
