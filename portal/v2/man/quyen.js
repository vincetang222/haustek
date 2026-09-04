/* =====================================================================
   NỘI BỘ · QUẢN LÝ QUYỀN
   ---------------------------------------------------------------------
   Hai việc của đội hỗ trợ bản quyền:
     1. Xung đột Content ID và khiếu nại trên nền tảng: lọc, nhận việc,
        gửi tranh chấp, chuyển lên nền tảng, đóng. Mỗi khiếu nại có hạn
        tranh chấp 30 ngày; quá hạn là mất quyền ở thị trường đó, nên
        cột hết hạn tô đỏ khi còn dưới 7 ngày.
     2. Cài đặt video theo tài khoản: kênh, chính sách, tự động nhận
        quyền, kênh được phép.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'kn', tim: '', nt: '', loai: '', tt: 'open-all', nv: '', thiTruong: '', toi: false,
            chon: {}, tkQ: '', pk: '' };
var TT = {
  vi: { open: 'Mới', disputed: 'Đang tranh chấp', escalated: 'Đã chuyển lên nền tảng', resolved: 'Đã giải quyết', released: 'Đã nhả' },
  en: { open: 'New', disputed: 'Disputed', escalated: 'Escalated', resolved: 'Resolved', released: 'Released' }
};
var KIEU = { open: 'info', disputed: 'warn', escalated: 'link', resolved: 'ok', released: '' };
var UT = { vi: { urgent: 'Khẩn', high: 'Cao', normal: 'Thường' }, en: { urgent: 'Urgent', high: 'High', normal: 'Normal' } };
var UT_KIEU = { urgent: 'no', high: 'warn', normal: '' };
var UT_HANG = { urgent: 0, high: 1, normal: 2 };
var CS = { vi: { monetize: 'Kiếm tiền', track: 'Theo dõi', block: 'Chặn' }, en: { monetize: 'Monetise', track: 'Track', block: 'Block' } };

function ngayCach(asOf, iso) {
  if (!iso) return null;
  return Math.round((Date.parse(String(iso).slice(0, 10)) - Date.parse(asOf)) / 864e5);
}
function tenNv(A, id) { var s = A.staff.get(id); return s ? s.name : (id || ''); }

HT.dangKy({
  id: 'quyen', nav: 'navQuyen', nhom: 'nhomDoiTac', icon: 'alert',
  vai: ['support', 'ops', 'mgmt'],

  chu: {
    vi: {
      nhomDoiTac: 'Đối tác', navQuyen: 'Quản lý quyền', h1: 'Quản lý quyền',
      mo: 'Xung đột Content ID và khiếu nại trên nền tảng đối với bản ghi trong danh mục, và cài đặt video theo tài khoản.',
      tabKn: 'Xung đột và khiếu nại', tabVideo: 'Cài đặt video',
      kDangMo: 'Đang mở', kDangMoS: 'mới · tranh chấp · đã chuyển lên', kXem: 'Lượt xem/ngày đang tranh chấp',
      kHetHan: 'Sắp hết hạn tranh chấp', kHetHanS: 'trong 7 ngày', kXong: 'Đã giải quyết 30 ngày', kXongS: 'đã giải quyết hoặc đã nhả',
      tim: 'Tìm UPC, ISRC, Asset ID, bài hát, bên liên quan…',
      moiNenTang: 'Mọi nền tảng', moiLoai: 'Mọi loại', moiNv: 'Mọi người phụ trách', moiTt: 'Mọi thị trường', chiToi: 'Chỉ của tôi', xuat: 'Xuất CSV',
      ttOpenAll: 'Đang mở (tất cả)', ttAll: 'Mọi trạng thái',
      daChon: 'đã chọn', chonTrang: 'Chọn cả trang', boChon: 'Bỏ chọn', ganToi: 'Gán cho tôi', danhDauXong: 'Đánh dấu đã giải quyết', chuyenLen: 'Chuyển lên nền tảng',
      cNt: 'Nền tảng', cLoai: 'Loại', cHan: 'Hết hạn', cBai: 'Bài hát / nghệ sĩ', cDoiTac: 'Đối tác', cTt: 'Thị trường', cBen: 'Bên liên quan',
      cXem: 'Lượt xem/ngày', cTrangThai: 'Trạng thái', cCapNhat: 'Cập nhật', cUuTien: 'Ưu tiên', cNv: 'Người phụ trách',
      khong: 'Không có khiếu nại nào khớp bộ lọc', khongMo: 'Đổi bộ lọc phía trên, hoặc tắt "Chỉ của tôi".',
      nhanViec: 'Nhận việc', ganCho: 'Gán cho…', guiTranhChap: 'Gửi tranh chấp', daGiaiQuyet: 'Đã giải quyết', nhaClaim: 'Nhả claim',
      hoiGhi: 'Ghi chú', hoiGhiMo: 'Ghi chú lưu vào lịch sử của khiếu nại. Đối tác nhìn thấy dòng ghi chú mới nhất trên cổng của họ.',
      hoiTc: 'Gửi tranh chấp tới nền tảng?', hoiTcMo: 'Hạn tranh chấp được đặt lại 30 ngày kể từ hôm nay. Ghi rõ căn cứ (hợp đồng, file master).',
      hoiCl: 'Chuyển lên nền tảng?', hoiClMo: 'Chuyển hồ sơ cho đội hỗ trợ của nền tảng xử lý. Hạn được đặt lại 30 ngày.',
      hoiGq: 'Đánh dấu đã giải quyết?', hoiGqMo: 'Nền tảng đã xác nhận quyền về Haustek, hoặc bên kia đã rút khiếu nại.',
      hoiNha: 'Nhả claim?', hoiNhaMo: 'Nhả claim nghĩa là Haustek không giữ quyền với bản ghi này trên nền tảng. Thao tác này không hoàn tác được.',
      hoiGan: 'Gán cho người phụ trách', hoiGanMo: 'Chọn người trong đội hỗ trợ.', hoiGanAi: 'Người phụ trách',
      hoiHangLoat: 'Áp dụng cho {n} khiếu nại đã chọn?', hoiHangLoatMo: 'Mỗi khiếu nại nhận cùng một ghi chú và một dòng nhật ký riêng.',
      daDoi: 'Đã cập nhật', daGan: 'Đã gán', khieuNai: 'khiếu nại',
      chiTiet: 'Chi tiết', ghiChu: 'Ghi chú và lịch sử', chuaGhi: 'Chưa có ghi chú nào', ngayTao: 'Ngày tạo', hetHan: 'Hạn tranh chấp',
      khongHan: 'không có hạn', quaHan: 'quá hạn', conNgay: 'còn {n} ngày', homNay: 'hôm nay', chuaGan: 'chưa gán',
      phanLoai: 'Phân loại', luotXem: 'Lượt xem mỗi ngày', benKhac: 'Bên liên quan', khongBen: 'không có bên khác',
      /* cài đặt video */
      vdTim: 'Tìm tài khoản theo tên hoặc mã…', vdChon: 'Chọn tài khoản để xem và sửa cài đặt video',
      vdChonMo: 'Gõ tên hoặc mã đối tác vào ô tìm, hoặc bấm một tài khoản đã có cài đặt ở bên phải.',
      vdCoSan: 'Tài khoản đã có cài đặt', vdKetQua: 'Kết quả', vdKhongThay: 'Không tìm thấy tài khoản',
      vdKenh: 'Kênh YouTube', vdKenhMo: 'Mã kênh (UC…) đã liên kết với Content ID.', vdChinhSach: 'Chính sách Content ID',
      vdTuDong: 'Tự động nhận quyền', vdTuDongMo: 'Tự động nhận quyền với video của bên thứ ba dùng bản ghi trong danh mục.',
      vdWhitelist: 'Kênh được phép', vdWhitelistMo: 'Mỗi dòng một kênh. Video của các kênh này không bị nhận quyền.',
      luu: 'Lưu cài đặt', daLuu: 'Đã lưu cài đặt video', vdCapNhat: 'Cập nhật lần cuối',
      vdChua: 'Tài khoản này chưa có cài đặt video; lưu để tạo mới.',
      loaiLabel: 'Label', loaiSub: 'Label con', loaiArtist: 'Nghệ sĩ'
    },
    en: {
      nhomDoiTac: 'Partners', navQuyen: 'Rights manager', h1: 'Rights manager',
      mo: 'Content ID conflicts and platform claims on catalogue recordings, plus per-account video settings.',
      tabKn: 'Conflicts and claims', tabVideo: 'Video settings',
      kDangMo: 'Open', kDangMoS: 'new · disputed · escalated', kXem: 'Daily views in dispute',
      kHetHan: 'Disputes expiring', kHetHanS: 'within 7 days', kXong: 'Closed in 30 days', kXongS: 'resolved or released',
      tim: 'Search UPC, ISRC, Asset ID, track, other party…',
      moiNenTang: 'All stores', moiLoai: 'All categories', moiNv: 'Any assignee', moiTt: 'All countries', chiToi: 'Only my issues', xuat: 'Export CSV',
      ttOpenAll: 'Open (all)', ttAll: 'Any status',
      daChon: 'selected', chonTrang: 'Select page', boChon: 'Clear', ganToi: 'Assign to me', danhDauXong: 'Mark resolved', chuyenLen: 'Escalate',
      cNt: 'Store', cLoai: 'Category', cHan: 'Expiry', cBai: 'Track / artist', cDoiTac: 'Partner', cTt: 'Country', cBen: 'Other party',
      cXem: 'Daily views', cTrangThai: 'Status', cCapNhat: 'Updated', cUuTien: 'Priority', cNv: 'Assignee',
      khong: 'No claim matches the filters', khongMo: 'Change the filters above, or switch off "Only my issues".',
      nhanViec: 'Take it', ganCho: 'Assign to…', guiTranhChap: 'File dispute', daGiaiQuyet: 'Resolve', nhaClaim: 'Release claim',
      hoiGhi: 'Note', hoiGhiMo: 'The note goes into the claim history. The partner sees the latest note on their portal.',
      hoiTc: 'File a dispute with the platform?', hoiTcMo: 'The dispute window resets to 30 days from today. State the evidence (contract, master file).',
      hoiCl: 'Escalate to the platform?', hoiClMo: 'Hands the case to the platform’s support team. The window resets to 30 days.',
      hoiGq: 'Mark as resolved?', hoiGqMo: 'The platform confirmed Haustek’s ownership, or the other party withdrew.',
      hoiNha: 'Release the claim?', hoiNhaMo: 'Releasing means Haustek no longer holds rights on this recording at the platform. This cannot be undone.',
      hoiGan: 'Assign an owner', hoiGanMo: 'Pick someone on the support team.', hoiGanAi: 'Assignee',
      hoiHangLoat: 'Apply to {n} selected claims?', hoiHangLoatMo: 'Each claim gets the same note and its own audit line.',
      daDoi: 'Updated', daGan: 'Assigned', khieuNai: 'claims',
      chiTiet: 'Details', ghiChu: 'Notes and history', chuaGhi: 'No notes yet', ngayTao: 'Created', hetHan: 'Dispute deadline',
      khongHan: 'no deadline', quaHan: 'overdue', conNgay: '{n} days left', homNay: 'today', chuaGan: 'unassigned',
      phanLoai: 'Classification', luotXem: 'Daily views', benKhac: 'Other party', khongBen: 'no other party',
      vdTim: 'Search account by name or ID…', vdChon: 'Pick an account to view and edit its video settings',
      vdChonMo: 'Type a partner name or ID in the search box, or click an account that already has settings on the right.',
      vdCoSan: 'Accounts with settings', vdKetQua: 'Results', vdKhongThay: 'No account found',
      vdKenh: 'YouTube channel', vdKenhMo: 'Channel ID (UC…) linked to Content ID.', vdChinhSach: 'Content ID policy',
      vdTuDong: 'Auto-claim', vdTuDongMo: 'Automatically claim third-party videos that use catalogue recordings.',
      vdWhitelist: 'Allowed channels', vdWhitelistMo: 'One channel per line. Videos from these channels are not claimed.',
      luu: 'Save settings', daLuu: 'Video settings saved', vdCapNhat: 'Last updated',
      vdChua: 'This account has no video settings yet; save to create them.',
      loaiLabel: 'Label', loaiSub: 'Sub-label', loaiArtist: 'Artist'
    }
  },

  dem: function (c) { var n = c.A.claims.counts().open; return n ? '!' + n : ''; },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var dem = A.claims.counts();
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [{ l: t('kDangMo'), v: HT.fmt.n(dem.open + dem.disputed + dem.escalated) },
           { l: t('kXem'), v: HB.gonSo(dem.views) }] });
    html += HM.tabs([
      { k: 'kn', l: t('tabKn'), icon: 'alert', dem: dem.open + dem.disputed + dem.escalated },
      { k: 'video', l: t('tabVideo'), icon: 'disc', dem: Object.keys(A.state().videoSettings).length }
    ], LOC.tab);
    var phan = LOC.tab === 'video' ? veVideo(c) : veKhieuNai(c);
    root.innerHTML = html + phan.html;
    phan.sau(root);
    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
  }
});

/* =====================================================================
   TAB 1 · XUNG ĐỘT VÀ KHIẾU NẠI
   ===================================================================== */
function veKhieuNai(c) {
  var A = c.A, t = c.t, me = A.staff.me, asOf = A.asOf();
  var tatCa = A.claims.list();
  var phanLoai = HM.nho(A, 'quyen:phanLoai', function () {
    var m = {};
    A.parties.list({}).rows.forEach(function (r) { m[r.partyKey] = r; });
    return m;
  });

  /* ---- KPI ---- */
  var dangMo = tatCa.filter(function (x) { return x.status !== 'resolved' && x.status !== 'released'; });
  var xem = dangMo.reduce(function (s, x) { return s + x.dailyViews; }, 0);
  var sapHet = dangMo.filter(function (x) { var d = ngayCach(asOf, x.expiresAt); return d != null && d <= 7; }).length;
  var xong30 = tatCa.filter(function (x) { return (x.status === 'resolved' || x.status === 'released') && ngayCach(asOf, x.updatedAt) >= -30; }).length;

  /* ---- lọc (lõi lọc theo trạng thái, nền tảng, loại, người, thị trường, chữ) ---- */
  var loc = A.claims.list({
    status: LOC.tt === 'all' ? '' : LOC.tt, store: LOC.nt, category: LOC.loai,
    assignee: LOC.toi ? me.id : LOC.nv, country: LOC.thiTruong, q: LOC.tim.trim()
  });
  var rows = loc.map(function (x) {
    var pl = phanLoai[x.partyKey];
    return {
      id: x.id, r: x, store: x.store, loai: c.song(A.claims.categories.filter(function (k) { return k.id === x.category; })[0] || { label: x.category }, 'label'),
      han: x.expiresAt || '', bai: x.track.title, doiTac: x.party.name, pl: pl ? pl.classification : '',
      tt: x.country, ben: x.otherParty || '', xem: x.dailyViews, trangThai: x.status,
      capNhat: x.updatedAt, uuTien: UT_HANG[x.priority] == null ? 9 : UT_HANG[x.priority], nv: tenNv(A, x.assignee)
    };
  });
  var thiTruong = []; tatCa.forEach(function (x) { if (thiTruong.indexOf(x.country) < 0) thiTruong.push(x.country); });
  thiTruong.sort(function (a, b) { return a.localeCompare(b, 'vi'); });
  var nhanVien = A.staff.byRole('support').concat(A.staff.byRole('ops'));

  var html = HM.so([
    { l: t('kDangMo'), v: HT.fmt.n(dangMo.length), lon: true, s: t('kDangMoS') },
    { l: t('kXem'), v: HT.fmt.n(xem) },
    { l: t('kHetHan'), v: HT.fmt.n(sapHet), mau: sapHet ? HB.mau('danger') : '', s: t('kHetHanS') },
    { l: t('kXong'), v: HT.fmt.n(xong30), s: t('kXongS') }
  ]);

  var sel = function (attr, cur, ds, trong) {
    return '<select class="in" ' + attr + ' style="width:auto;height:34px;max-width:220px">' +
      '<option value="">' + HM.esc(trong) + '</option>' +
      ds.map(function (o) { return '<option value="' + HM.esc(o[0]) + '"' + (cur === o[0] ? ' selected' : '') + '>' + HM.esc(o[1]) + '</option>'; }).join('') +
      '</select>';
  };
  html += HM.the({ than:
    '<div class="bar" style="margin-bottom:0">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim value="' + HM.esc(LOC.tim) + '" placeholder="' + HM.esc(t('tim')) + '"></div>' +
      sel('data-nt', LOC.nt, [['YouTube', 'YouTube'], ['Facebook', 'Facebook'], ['TikTok', 'TikTok']], t('moiNenTang')) +
      sel('data-loai', LOC.loai, A.claims.categories.map(function (k) { return [k.id, c.song(k, 'label')]; }), t('moiLoai')) +
      '<select class="in" data-tt style="width:auto;height:34px">' +
        [['open-all', t('ttOpenAll')]].concat(A.claims.statuses.map(function (s) { return [s, TT[c.lang][s]]; })).concat([['all', t('ttAll')]]).map(function (o) {
          return '<option value="' + o[0] + '"' + (LOC.tt === o[0] ? ' selected' : '') + '>' + HM.esc(o[1]) + '</option>';
        }).join('') + '</select>' +
      sel('data-nv', LOC.nv, nhanVien.map(function (s) { return [s.id, s.name]; }), t('moiNv')) +
      sel('data-thi', LOC.thiTruong, thiTruong.map(function (x) { return [x, x]; }), t('moiTt')) +
      '<button type="button" class="pill' + (LOC.toi ? ' on' : '') + '" data-toi>' + HM.icon(LOC.toi ? 'check' : 'user') + HM.esc(t('chiToi')) + '</button>' +
      '<div class="sp"></div>' +
      '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>' +
    '</div>' });

  html += '<div class="bar" data-thanh-chon>' + thanhChon(c, rows) + '</div>';
  html += HM.the({ thoBody: true, than: '<div data-bang></div>' });

  return { html: html, sau: function (root) {
    var boQua = false;
    root.addEventListener('click', function (e) { boQua = !!e.target.closest('[data-chon]'); }, true);
    var b = c.bang({
      host: root.querySelector('[data-bang]'), dong: function () { return rows; }, sort: 'capNhat', dir: -1, co: 25,
      cot: [
        { k: 'chon', l: c.lang === 'vi' ? 'Chọn' : 'Pick', s: false, w: '60px' },
        { k: 'store', l: t('cNt'), w: '96px' },
        { k: 'loai', l: t('cLoai'), w: '140px' },
        { k: 'han', l: t('cHan'), w: '100px' },
        { k: 'bai', l: t('cBai') },
        { k: 'doiTac', l: t('cDoiTac') },
        { k: 'tt', l: t('cTt'), w: '96px' },
        { k: 'ben', l: t('cBen') },
        { k: 'xem', l: t('cXem'), num: true, w: '110px' },
        { k: 'trangThai', l: t('cTrangThai'), w: '130px' },
        { k: 'capNhat', l: t('cCapNhat'), w: '120px' },
        { k: 'uuTien', l: t('cUuTien'), w: '80px' },
        { k: 'nv', l: t('cNv'), w: '130px' }
      ],
      veDong: function (d) {
        var x = d.r, dHan = ngayCach(asOf, x.expiresAt);
        var hanHtml = !x.expiresAt ? '<span class="nil">—</span>'
          : '<span class="mono' + (dHan <= 7 && x.status !== 'resolved' && x.status !== 'released' ? ' neg' : '') + '">' + HM.esc(HT.fmt.ngay(x.expiresAt)) + '</span>';
        return '<td><input type="checkbox" data-chon="' + HM.esc(x.id) + '"' + (LOC.chon[x.id] ? ' checked' : '') + ' aria-label="' + HM.esc(x.id) + '"></td>' +
          '<td>' + HM.esc(x.store) + '</td>' +
          '<td><div class="t-ttl" style="font-weight:500">' + HM.esc(d.loai) + '</div><div class="t-sub mono">' + HM.esc(x.id) + '</div></td>' +
          '<td>' + hanHtml + '</td>' +
          '<td><div class="t-ttl">' + HM.esc(HM.dai(x.track.title, 28)) + '</div><div class="t-sub">' + HM.esc(HM.dai(x.track.artist, 24)) + ' · <span class="mono">' + HM.esc(x.track.isrc) + ' · ' + HM.esc(x.track.upc) + '</span></div></td>' +
          '<td><div class="t-ttl">' + HM.esc(HM.dai(x.party.name, 24)) + '</div><div class="t-sub">' + HM.esc(x.party.clientId) + (d.pl ? ' · ' + HM.esc(d.pl) : '') + '</div></td>' +
          '<td>' + HM.esc(x.country) + '</td>' +
          '<td>' + (x.otherParty ? HM.esc(HM.dai(x.otherParty, 22)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + HM.esc(HT.fmt.n(x.dailyViews)) + '</td>' +
          '<td>' + HM.tag(TT[c.lang][x.status], KIEU[x.status]) + '</td>' +
          '<td class="mono muted">' + HM.esc(HT.fmt.luc(x.updatedAt)) + '</td>' +
          '<td>' + HM.tag(UT[c.lang][x.priority] || x.priority, UT_KIEU[x.priority]) + '</td>' +
          '<td>' + (x.assignee ? HM.esc(HM.dai(tenNv(A, x.assignee), 18)) : '<span class="nil">' + HM.esc(t('chuaGan')) + '</span>') + '</td>';
      },
      chon: function (d) { if (boQua) { boQua = false; return; } moClaim(c, d.id); },
      rongTieuDe: t('khong'), rongMoTa: t('khongMo')
    });
    b.ve();

    var veThanh = function () { root.querySelector('[data-thanh-chon]').innerHTML = thanhChon(c, rows); };
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); focusTim(); });
    HM.doi(root, '[data-nt]', function (el) { LOC.nt = el.value; c.veLai(); });
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; c.veLai(); });
    HM.doi(root, '[data-tt]', function (el) { LOC.tt = el.value; c.veLai(); });
    HM.doi(root, '[data-nv]', function (el) { LOC.nv = el.value; c.veLai(); });
    HM.doi(root, '[data-thi]', function (el) { LOC.thiTruong = el.value; c.veLai(); });
    HM.bam(root, '[data-toi]', function () { LOC.toi = !LOC.toi; c.veLai(); });
    HM.doi(root, '[data-chon]', function (el) {
      var id = el.getAttribute('data-chon');
      if (el.checked) LOC.chon[id] = true; else delete LOC.chon[id];
      veThanh();
    });
    HM.bam(root, '[data-chon-trang]', function () {
      var het = true;
      root.querySelectorAll('[data-chon]').forEach(function (cb) { if (!cb.checked) het = false; });
      root.querySelectorAll('[data-chon]').forEach(function (cb) {
        cb.checked = !het;
        if (!het) LOC.chon[cb.getAttribute('data-chon')] = true; else delete LOC.chon[cb.getAttribute('data-chon')];
      });
      veThanh();
    });
    HM.bam(root, '[data-bo-chon]', function () { LOC.chon = {}; c.veLai(); });
    HM.bam(root, '[data-hang-loat]', function (el) { hangLoat(c, el.getAttribute('data-hang-loat')); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('khieu-nai.csv',
        ['ID', t('cNt'), t('cLoai'), t('cHan'), 'Track', 'Artist', 'ISRC', 'UPC', 'Asset ID', t('cDoiTac'), t('phanLoai'), t('cTt'), t('cBen'), t('cXem'), t('cTrangThai'), t('cUuTien'), t('cNv'), t('ngayTao'), t('cCapNhat')],
        rows.map(function (d) { var x = d.r; return [x.id, x.store, d.loai, x.expiresAt || '', x.track.title, x.track.artist, x.track.isrc, x.track.upc, x.assetId, x.party.name, d.pl, x.country, x.otherParty || '', x.dailyViews, TT[c.lang][x.status], UT[c.lang][x.priority], d.nv, x.createdAt, x.updatedAt]; }));
    });
  } };
}

/* Giữ con trỏ trong ô tìm sau khi vẽ lại: thẻ <main> bị thay mới mỗi lần. */
function focusTim() {
  var el = document.querySelector('main [data-tim]');
  if (el) { el.focus(); var n = el.value.length; try { el.setSelectionRange(n, n); } catch (e) {} }
}

function thanhChon(c, rows) {
  var t = c.t, n = 0;
  rows.forEach(function (d) { if (LOC.chon[d.id]) n++; });
  return '<span class="tag ' + (n ? 'info' : '') + '">(' + HT.fmt.n(n) + ') ' + HM.esc(t('daChon')) + '</span>' +
    '<button type="button" class="btn sm ghost" data-chon-trang>' + HM.esc(t('chonTrang')) + '</button>' +
    (n ? '<button type="button" class="btn sm ghost" data-bo-chon>' + HM.esc(t('boChon')) + '</button>' +
         '<span class="sp"></span>' +
         '<button type="button" class="btn sm" data-hang-loat="gan">' + HM.icon('user') + HM.esc(t('ganToi')) + '</button>' +
         '<button type="button" class="btn sm" data-hang-loat="escalated">' + HM.icon('up') + HM.esc(t('chuyenLen')) + '</button>' +
         '<button type="button" class="btn sm go" data-hang-loat="resolved">' + HM.icon('check') + HM.esc(t('danhDauXong')) + '</button>'
       : '');
}

/* thao tác hàng loạt trên các dòng đã chọn */
function hangLoat(c, viec) {
  var A = c.A, t = c.t, me = A.staff.me;
  var ids = Object.keys(LOC.chon);
  if (!ids.length) return;
  var chay = function (ghi) {
    var n = 0;
    ids.forEach(function (id) {
      try {
        if (viec === 'gan') A.claims.assign(id, me.id, me.email);
        else A.claims.setStatus(id, viec, me.email, ghi);
        n++;
      } catch (e) { c.thongBao(id + ': ' + e.message, 'no'); }
    });
    LOC.chon = {};
    c.thongBao((viec === 'gan' ? t('daGan') : t('daDoi')) + ' · ' + HT.fmt.n(n) + ' ' + t('khieuNai'), 'ok');
    c.veLai();
  };
  if (viec === 'gan') {
    c.xacNhan(t('hoiHangLoat').replace('{n}', HT.fmt.n(ids.length)), HM.esc(t('hoiGanMo')), t('ganToi')).then(function (ok) { if (ok) chay(''); });
    return;
  }
  c.hoiThoai({
    tieuDe: t('hoiHangLoat').replace('{n}', HT.fmt.n(ids.length)), moTa: HM.esc(t('hoiHangLoatMo')),
    than: '<label class="fld">' + HM.esc(t('hoiGhi')) + '</label><textarea class="in" data-o="ghi" rows="3"></textarea>',
    dong: viec === 'resolved' ? t('danhDauXong') : t('chuyenLen')
  }).then(function (f) { if (f) chay((f.ghi || '').trim()); });
}

/* ---------------------------------------------------------------------
   Ngăn trượt: một khiếu nại
   --------------------------------------------------------------------- */
function moClaim(c, id) {
  var A = c.A, t = c.t, me = A.staff.me, x = A.claims.get(id);
  if (!x) return;
  var asOf = A.asOf(), dHan = ngayCach(asOf, x.expiresAt);
  var cat = A.claims.categories.filter(function (k) { return k.id === x.category; })[0];
  var mo = x.status !== 'resolved' && x.status !== 'released';
  var nut = '';
  if (mo && x.assignee !== me.id) nut += '<button type="button" class="btn sm" data-nhan>' + HM.icon('user') + HM.esc(t('nhanViec')) + '</button>';
  if (mo) nut += '<button type="button" class="btn sm ghost" data-gan>' + HM.esc(t('ganCho')) + '</button>';
  if (x.status === 'open') nut += '<button type="button" class="btn sm pri" data-tt="disputed">' + HM.esc(t('guiTranhChap')) + '</button>';
  if (x.status === 'open' || x.status === 'disputed') nut += '<button type="button" class="btn sm" data-tt="escalated">' + HM.icon('up') + HM.esc(t('chuyenLen')) + '</button>';
  if (mo) nut += '<button type="button" class="btn sm go" data-tt="resolved">' + HM.icon('check') + HM.esc(t('daGiaiQuyet')) + '</button>' +
                 '<button type="button" class="btn sm dang" data-tt="released">' + HM.esc(t('nhaClaim')) + '</button>';
  var hanChu = !x.expiresAt ? t('khongHan') : dHan < 0 ? t('quaHan') + ' ' + HT.fmt.n(-dHan) + ' ' + (c.lang === 'vi' ? 'ngày' : 'days')
    : dHan === 0 ? t('homNay') : t('conNgay').replace('{n}', HT.fmt.n(dHan));

  c.nganTruot(
    '<div class="btnrow" style="margin-bottom:14px">' + HM.tag(TT[c.lang][x.status], KIEU[x.status]) + HM.tag(UT[c.lang][x.priority] || x.priority, UT_KIEU[x.priority]) + '</div>' +
    (nut ? '<div class="btnrow" style="margin-bottom:16px">' + nut + '</div>' : '') +
    '<h4 class="sec">' + HM.esc(t('chiTiet')) + '</h4>' +
    HM.kv([
      { t: 'Asset ID', v: '<span class="mono">' + HM.esc(x.assetId) + '</span>', vHtml: true },
      { t: t('cNt'), v: x.store },
      { t: t('cLoai'), v: cat ? c.song(cat, 'label') + (c.lang === 'vi' && cat.mo ? ' · ' + cat.mo : '') : x.category },
      { t: t('cDoiTac'), v: x.party.name + ' · ' + x.party.clientId },
      { t: 'ISRC · UPC', v: '<span class="mono">' + HM.esc(x.track.isrc) + ' · ' + HM.esc(x.track.upc) + '</span>', vHtml: true },
      { t: t('benKhac'), v: x.otherParty || t('khongBen') },
      { t: t('cTt'), v: x.country },
      { t: t('luotXem'), v: HT.fmt.n(x.dailyViews), manh: true },
      { t: t('cNv'), v: x.assignee ? tenNv(A, x.assignee) : t('chuaGan') },
      { t: t('ngayTao'), v: HT.fmt.luc(x.createdAt) },
      { t: t('cCapNhat'), v: HT.fmt.luc(x.updatedAt) },
      { t: t('hetHan'), v: (x.expiresAt ? HT.fmt.ngay(x.expiresAt) + ' · ' : '') + hanChu, mau: x.expiresAt && dHan <= 7 && mo ? 'neg' : '' }
    ]) +
    '<h4 class="sec">' + HM.esc(t('ghiChu')) + '</h4>' +
    (x.notes.length
      ? '<div class="steps">' + x.notes.slice().reverse().map(function (n, i) {
          return '<div class="s' + (i === 0 ? ' now' : '') + '"><b>' + HM.esc(n.text) + '</b><div class="tm">' + HM.esc(HT.fmt.luc(n.at) + ' · ' + n.by) + '</div></div>';
        }).join('') + '</div>'
      : '<p class="hint">' + HM.esc(t('chuaGhi')) + '</p>'),
    { tieuDe: x.track.title, phu: x.id + ' · ' + x.track.artist, khiMo: function (dr) {
      var xong = function (msg) { c.thongBao(msg + ' · ' + x.id, 'ok'); c.dongNgan(); c.veLai(); };
      HM.bam(dr, '[data-nhan]', function () {
        try { A.claims.assign(x.id, me.id, me.email); xong(t('daGan')); } catch (e) { c.thongBao(e.message, 'no'); }
      });
      HM.bam(dr, '[data-gan]', function () {
        var ds = A.staff.byRole('support').concat(A.staff.byRole('ops'));
        c.hoiThoai({ tieuDe: t('hoiGan'), moTa: HM.esc(t('hoiGanMo')),
          than: '<label class="fld">' + HM.esc(t('hoiGanAi')) + '</label><select class="in" data-o="nv">' +
            ds.map(function (s) { return '<option value="' + s.id + '"' + (s.id === x.assignee ? ' selected' : '') + '>' + HM.esc(s.name + ' · ' + c.song(s, 'title')) + '</option>'; }).join('') + '</select>',
          dong: t('ganCho') }).then(function (f) {
          if (!f) return;
          try { A.claims.assign(x.id, f.nv, me.email); xong(t('daGan')); } catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
      HM.bam(dr, '[data-tt]', function (el) {
        var tt = el.getAttribute('data-tt');
        var hoi = { disputed: ['hoiTc', 'hoiTcMo', 'guiTranhChap'], escalated: ['hoiCl', 'hoiClMo', 'chuyenLen'],
                    resolved: ['hoiGq', 'hoiGqMo', 'daGiaiQuyet'], released: ['hoiNha', 'hoiNhaMo', 'nhaClaim'] }[tt];
        c.hoiThoai({ tieuDe: t(hoi[0]), moTa: HM.esc(t(hoi[1])),
          than: '<label class="fld">' + HM.esc(t('hoiGhi')) + '</label><textarea class="in" data-o="ghi" rows="3"></textarea>' +
                '<div class="hint" style="margin-top:6px">' + HM.esc(t('hoiGhiMo')) + '</div>',
          dong: t(hoi[2]), nguyHiem: tt === 'released' }).then(function (f) {
          if (!f) return;
          try { A.claims.setStatus(x.id, tt, me.email, (f.ghi || '').trim()); xong(t('daDoi')); } catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
    } });
}

/* =====================================================================
   TAB 2 · CÀI ĐẶT VIDEO
   ===================================================================== */
function veVideo(c) {
  var A = c.A, t = c.t;
  var q = LOC.tkQ.trim();
  var ketQua = q ? A.parties.list({ q: q }).rows.slice(0, 8) : [];
  var coSan = Object.keys(A.state().videoSettings);
  var LOAI = { label: t('loaiLabel'), sublabel: t('loaiSub'), artist: t('loaiArtist') };
  var loaiCua = function (pk) { var p = A.parties.list({ q: A.partyClientId(pk) }).rows[0]; return p ? LOAI[p.kind] || p.kind : (pk[0] === 'L' ? LOAI.label : LOAI.artist); };

  var trai = '<div class="srch" style="flex:1 1 auto;max-width:none;margin-bottom:12px">' + HM.icon('tim') +
    '<input type="search" data-tim-tk value="' + HM.esc(LOC.tkQ) + '" placeholder="' + HM.esc(t('vdTim')) + '"></div>';
  if (q) {
    trai += '<h4 class="sec">' + HM.esc(t('vdKetQua')) + ' · ' + HT.fmt.n(ketQua.length) + '</h4>' +
      (ketQua.length
        ? '<div class="tw"><table class="t" style="min-width:0"><tbody>' + ketQua.map(function (r) {
            return '<tr class="pick" data-pk="' + HM.esc(r.partyKey) + '"><td><div class="t-ttl">' + HM.esc(r.name) + '</div>' +
              '<div class="t-sub">' + HM.esc(r.clientId) + ' · ' + HM.esc(LOAI[r.kind] || r.kind) + '</div></td>' +
              '<td class="num">' + (A.videoSettings.get(r.partyKey) ? HM.tag(CS[c.lang][A.videoSettings.get(r.partyKey).policy], 'info') : '<span class="nil">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<p class="hint">' + HM.esc(t('vdKhongThay')) + '</p>');
  }

  var phai = '<div class="chips" style="margin:0">' + coSan.map(function (pk) {
    return '<button type="button" class="pill' + (LOC.pk === pk ? ' on' : '') + '" data-pk="' + HM.esc(pk) + '" style="height:30px;font-size:12.5px">' +
      HM.esc(HM.dai(A.partyName(pk), 26)) + ' <span class="muted mono">' + HM.esc(A.partyClientId(pk)) + '</span></button>';
  }).join('') + '</div>';

  var html = '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('vdChon')), p: HM.esc(t('vdChonMo')), than: trai }) +
    HM.the({ h2: HM.esc(t('vdCoSan')), p: HT.fmt.n(coSan.length) + ' ' + (c.lang === 'vi' ? 'tài khoản' : 'accounts'), than: phai }) +
    '</div>';

  if (LOC.pk) {
    var vs = A.videoSettings.get(LOC.pk) || { channel: '', policy: 'monetize', autoClaim: false, whitelist: [], updatedAt: null };
    html += HM.the({
      h2: HM.esc(A.partyName(LOC.pk)), p: HM.esc(A.partyClientId(LOC.pk) + ' · ' + loaiCua(LOC.pk)),
      hanhDong: vs.updatedAt ? '<span class="hint">' + HM.esc(t('vdCapNhat') + ': ' + HT.fmt.luc(vs.updatedAt)) + '</span>' : '',
      than: (vs.updatedAt ? '' : HM.ghi({ kieu: 'info', tieuDe: HM.esc(t('vdChua')) })) +
        '<div class="grid g2" style="margin-bottom:0">' +
          '<div>' +
            '<label class="fld">' + HM.esc(t('vdKenh')) + '</label><input type="text" class="in mono" data-vd="channel" value="' + HM.esc(vs.channel || '') + '" placeholder="UC…">' +
            '<div class="hint" style="margin:4px 0 12px">' + HM.esc(t('vdKenhMo')) + '</div>' +
            '<label class="fld">' + HM.esc(t('vdChinhSach')) + '</label><select class="in" data-vd="policy">' +
              ['monetize', 'track', 'block'].map(function (k) { return '<option value="' + k + '"' + (vs.policy === k ? ' selected' : '') + '>' + HM.esc(CS[c.lang][k]) + '</option>'; }).join('') + '</select>' +
            '<label class="opt" style="margin-top:12px"><input type="checkbox" data-vd="autoClaim"' + (vs.autoClaim ? ' checked' : '') + '><div><b>' + HM.esc(t('vdTuDong')) + '</b><span>' + HM.esc(t('vdTuDongMo')) + '</span></div></label>' +
          '</div>' +
          '<div>' +
            '<label class="fld">' + HM.esc(t('vdWhitelist')) + '</label><textarea class="in" data-vd="whitelist" rows="7">' + HM.esc((vs.whitelist || []).join('\n')) + '</textarea>' +
            '<div class="hint" style="margin-top:4px">' + HM.esc(t('vdWhitelistMo')) + '</div>' +
          '</div>' +
        '</div>',
      chan: '<div class="btnrow"><button type="button" class="btn pri" data-luu>' + HM.icon('check') + HM.esc(t('luu')) + '</button></div>'
    });
  }

  return { html: html, sau: function (root) {
    HM.nhap(root, '[data-tim-tk]', function (el) { LOC.tkQ = el.value; c.veLai(); var i = document.querySelector('main [data-tim-tk]'); if (i) { i.focus(); var n = i.value.length; try { i.setSelectionRange(n, n); } catch (e) {} } });
    HM.bam(root, '[data-pk]', function (el) { LOC.pk = el.getAttribute('data-pk'); c.veLai(); });
    HM.bam(root, '[data-luu]', function () {
      var o = {};
      root.querySelectorAll('[data-vd]').forEach(function (f) {
        var k = f.getAttribute('data-vd');
        if (k === 'autoClaim') o[k] = !!f.checked;
        else if (k === 'whitelist') o[k] = f.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        else o[k] = f.value.trim();
      });
      try { A.videoSettings.set(LOC.pk, o, A.staff.me.email); c.thongBao(t('daLuu') + ' · ' + A.partyName(LOC.pk), 'ok'); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
  } };
}

})();
