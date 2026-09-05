/* =====================================================================
   NỘI BỘ · BÀN LÀM VIỆC
   ---------------------------------------------------------------------
   Trang đầu tiên mỗi nhân viên nhìn thấy, dựng theo VAI của người đang
   đăng nhập (bản mẫu: ô chọn nhân viên ở cột trái):
     · kinh doanh: tài khoản phụ trách, doanh thu quý so với chỉ tiêu,
       hợp đồng sắp hết hạn, tài khoản chưa kích hoạt;
     · hỗ trợ: ticket của tôi theo hạn, hàng đợi chưa gán, khiếu nại
       bản quyền sắp hết hạn tranh chấp;
     · kế toán: yêu cầu rút tiền đang chờ, bảng kê PDF còn thiếu, ticket
       thanh toán, kỳ chưa xét duyệt;
     · vận hành: hàng đợi phát hành, giao nhận và sửa hàng loạt đang chạy,
       ticket phát hành / nền tảng, dự báo;
     · quản lý: bức tranh chung của cả bốn đội.
   Mỗi bàn chỉ có việc của vai đó; mở rộng thì sang trang chuyên sâu.
   ===================================================================== */
"use strict";
(function () {

var KIEU_TT = { open: 'info', in_progress: 'link', waiting: 'warn', done: 'ok' };
var KIEU_UU = { low: '', normal: '', high: 'warn', urgent: 'no' };
var KIEU_KN = { open: 'info', disputed: 'warn', escalated: 'no', resolved: 'ok', released: '' };

HT.dangKy({
  id: 'ban-lam-viec', nav: 'navBan', nhom: 'nhomVanHanh', icon: 'grid',
  dem: function (c) {
    try {
      var me = c.A.staff.me;
      if (me.role === 'support') { var k = c.A.tickets.counts(me.id); var n = k.open + k.in_progress + k.waiting; return n ? (k.overdue ? '!' : '') + n : ''; }
      if (me.role === 'accounting') { var w = c.A.withdrawals.counts(); return w.requested ? String(w.requested) : ''; }
      return '';
    } catch (e) { return ''; }
  },

  chu: {
    vi: {
      navBan: 'Bàn làm việc', h1: 'Bàn làm việc', homNay: 'Việc của bạn hôm nay, {d}.', nhanVien: 'Nhân viên', vaiTro: 'Vai',
      dxCho: 'Chờ xét duyệt', dxChoMo: 'Tạm ứng và hợp đồng do kinh doanh hoặc đối tác đề xuất, kèm ROI và hạng rủi ro tính từ 12 kỳ thu nhập. Kế toán kiểm số trước, bạn duyệt sau.', dxChoS: '{a} tạm ứng chờ duyệt · {b} đã kiểm số', moXetDuyet: 'Mở xét duyệt', dxKhong: 'Không có đề xuất nào chờ duyệt', dxKhongMo: 'Đề xuất mới từ kinh doanh hoặc đối tác sẽ hiện ở đây.',
      dxToi: 'Đề xuất của tôi', dxToiMo: 'Tạm ứng và hợp đồng bạn đã đề xuất; trạng thái đổi khi kế toán kiểm số và giám đốc xét duyệt.', dxTaoUng: 'Đề xuất tạm ứng', dxTaoHd: 'Đề xuất hợp đồng', dxToiKhong: 'Bạn chưa có đề xuất nào', dxToiKhongMo: 'Bấm nút phía trên, hoặc mở ngăn một đối tác trong sổ đối tác.',
      dxKiem: 'Cần kiểm số', dxKiemMo: 'Đề xuất mới gửi. Đối chiếu thu nhập 12 kỳ với bảng kê và sổ tạm ứng, rồi bấm Đã kiểm để giám đốc xét duyệt.', dxKiemKhong: 'Không có đề xuất nào cần kiểm số', dxKiemKhongMo: 'Đề xuất đã kiểm chuyển sang chờ giám đốc duyệt.',
      dxNoiDung: 'Nội dung', dxThaoTac: 'Thao tác', dxRoi: 'ROI', dxThuHoi: 'thu hồi {n} tháng', dxTuDoiTac: 'từ cổng đối tác',
      ticketToi: 'Ticket của tôi', ticketToiMo: 'Đang mở, sắp hạn trước. Bấm một dòng để xử lý.',
      hangDoi: 'Hàng đợi chưa gán', hangDoiMo: 'Ticket đối tác gửi lên chưa có người phụ trách.', nhanViec: 'Nhận việc', daNhan: 'Đã nhận việc',
      khongTicket: 'Không có ticket nào', khongTicketMo: 'Hàng đợi trống. Sang trang Hỗ trợ để xem toàn bộ.',
      kMo: 'Ticket đang mở', kQuaHan: 'Quá hạn', kKhan: 'Khẩn', kChuaGan: 'Chưa gán', kKn: 'Khiếu nại tôi phụ trách', kKnHet: 'sắp hết hạn tranh chấp',
      theoTt: 'Ticket toàn đội theo trạng thái', khieuNai: 'Khiếu nại bản quyền của tôi', khieuNaiMo: 'Sắp hết hạn tranh chấp lên đầu.',
      cMa: 'Mã', cTieuDe: 'Tiêu đề', cDoiTac: 'Đối tác', cUu: 'Ưu tiên', cHan: 'Hạn', cTt: 'Trạng thái', cNv: 'Người phụ trách',
      cBai: 'Bài hát', cNt: 'Nền tảng', cHetHan: 'Hết hạn tranh chấp', cXem: 'Lượt xem/ngày',
      open: 'Mới', in_progress: 'Đang xử lý', waiting: 'Chờ phản hồi', done: 'Đã xong',
      knOpen: 'Mới', knDisputed: 'Đang tranh chấp', knEscalated: 'Đã chuyển lên', knResolved: 'Đã giải quyết', knReleased: 'Đã nhả',
      low: 'Thấp', normal: 'Thường', high: 'Cao', urgent: 'Khẩn', quaHan: 'quá hạn', conNgay: 'còn {n} ngày',
      moHoTro: 'Mở trang Hỗ trợ', moQuyen: 'Mở quản lý quyền', moDoiTac: 'Mở sổ đối tác', moChiTra: 'Mở thanh toán', moGiaoNhan: 'Mở giao nhận', moSuaHl: 'Mở sửa hàng loạt', moPhatHanh: 'Mở phát hành', moDuBao: 'Xem dự báo', moDoiChieu: 'Mở xét duyệt kỳ',
      /* kinh doanh */
      kdDt: 'Doanh thu gộp quý {q}', kdTk: 'Tài khoản phụ trách', kdLabel: 'label', kdNs: 'nghệ sĩ', kdChiTieu: 'Chỉ tiêu quý', kdDat: 'đạt {p}',
      kdMoi: 'Tài khoản mới', kdGiaHan: 'Cần gia hạn', kdTienDo: 'Tiến độ chỉ tiêu', kdTienDoMo: 'Doanh thu gộp quý của các tài khoản bạn phụ trách so với chỉ tiêu.',
      kdTop: 'Tài khoản lớn nhất', kdTopMo: 'Theo doanh thu gộp quý. Bấm để mở sổ đối tác.',
      kdGiaHanMo: 'Hợp đồng hết hạn trong 90 ngày tới. Liên hệ đối tác trước khi hết hạn.', cHopDong: 'Hết hạn', cDtQ: 'Doanh thu gộp quý',
      kdChuY: 'Tài khoản cần chú ý', kdChuYMo: 'Chưa có tài khoản cổng, chưa đăng nhập lần nào hoặc còn thiếu hồ sơ.',
      kdChuaTk: 'Chưa có tài khoản cổng', kdChuaDn: 'Chưa đăng nhập', kdThieu: 'Thiếu hồ sơ', kdKhong: 'Không có tài khoản nào cần chú ý',
      kdTheoHang: 'Theo hạng', quyTruoc: 'quý trước',
      /* kế toán */
      ktRut: 'Yêu cầu rút tiền đang chờ', ktRutMo: 'Đối tác đã gửi yêu cầu, chờ kế toán chuyển khoản.', ktKhongRut: 'Không có yêu cầu rút tiền nào đang chờ',
      cSoTien: 'Số tiền', cNgay: 'Ngày yêu cầu', cNh: 'Ngân hàng', xuLy: 'Xử lý',
      ktBangKe: 'Bảng kê PDF theo kỳ', ktBangKeMo: 'Mỗi bên thụ hưởng của kỳ đã xét duyệt cần một bảng kê PDF. Đính kèm tất cả tạo bảng kê mẫu cho bản mẫu này.',
      cKy: 'Kỳ', cDaDinh: 'Đã đính kèm', dinhHet: 'Đính kèm tất cả', daDinh: 'Đã đính kèm bảng kê cho kỳ {k}',
      kRutCho: 'Rút tiền đang chờ', kRutTien: 'yêu cầu chờ chuyển khoản', kDangChuyen: 'Đang chuyển khoản', kBkThieu: 'Bảng kê PDF còn thiếu', kKyChua: 'Kỳ chưa xét duyệt',
      ktTicket: 'Ticket thanh toán', ktTicketMo: 'Đối tác hỏi về thanh toán, tạm ứng, hoá đơn.',
      ktKy: 'Phần được hưởng của đối tác theo kỳ', ktKyMo: 'Tổng phần được hưởng của mọi bên thụ hưởng, mỗi kỳ. Kỳ đang chọn tô đậm.',
      /* vận hành */
      vhPhatHanh: 'Hồ sơ phát hành', vhGiaoNhan: 'Giao nhận đang chạy', vhSuaHl: 'Sửa hàng loạt chờ áp dụng', vhTicket: 'Ticket phát hành / nền tảng', vhKn: 'Khiếu nại đang mở',
      vhHangDoi: 'Giao nhận và sửa hàng loạt', vhHangDoiMo: 'Yêu cầu chưa xong. Bấm để mở trang tương ứng.',
      vhTicketMo: 'Ticket loại phát hành và nền tảng đang mở, sắp hạn trước.',
      vhDuBao: 'Dự báo danh mục', vhDuBaoMo: 'Lượt nghe mỗi ngày của toàn danh mục, nhân với mức trả trung bình từng nền tảng.',
      dbDuKien: 'Dự kiến kỳ {k}', dbTang7: '7 ngày qua so với 7 ngày trước', dbTang28: '28 ngày', dbLuot: 'Lượt nghe mỗi ngày',
      /* quản lý */
      qlDt: 'Doanh thu gộp kỳ {k}', qlKd: 'Đội kinh doanh so với chỉ tiêu quý', qlKdMo: 'Doanh thu gộp quý của các tài khoản mỗi nhân viên phụ trách.',
      qlHoTro: 'Đội hỗ trợ', qlHoTroMo: 'Ticket toàn đội theo trạng thái; quá hạn và khẩn cần xử lý ngay.',
      qlKt: 'Kế toán', qlVh: 'Vận hành', qlDoiTac: 'Đối tác',
      qlTop: 'Bài hát tăng trưởng mạnh nhất', qlTopMo: 'Lượt nghe 7 ngày qua so với 7 ngày trước đó, toàn danh mục.',
      cTang: 'Tăng trưởng', cLuot7: 'Lượt nghe 7 ngày'
    },
    en: {
      navBan: 'My desk', h1: 'My desk', homNay: 'Your work for today, {d}.', nhanVien: 'Staff', vaiTro: 'Role',
      dxCho: 'Awaiting approval', dxChoMo: 'Advances and contracts proposed by sales or partners, with ROI and a risk grade from 12 periods of earnings. Accounting checks first, you approve.', dxChoS: '{a} in advances pending · {b} checked', moXetDuyet: 'Open approvals', dxKhong: 'Nothing awaiting approval', dxKhongMo: 'New proposals from sales or partners show up here.',
      dxToi: 'My proposals', dxToiMo: 'Advances and contracts you proposed; status moves as accounting checks and the director approves.', dxTaoUng: 'Propose advance', dxTaoHd: 'Propose contract', dxToiKhong: 'You have no proposals yet', dxToiKhongMo: 'Use the buttons above, or open a partner’s drawer in Partners.',
      dxKiem: 'Figures to check', dxKiemMo: 'Newly submitted proposals. Reconcile 12 periods of earnings against statements and the advance ledger, then mark Checked so the director can approve.', dxKiemKhong: 'No proposal needs a check', dxKiemKhongMo: 'Checked proposals move on to the director.',
      dxNoiDung: 'Terms', dxThaoTac: 'Actions', dxRoi: 'ROI', dxThuHoi: 'recoup {n} mo', dxTuDoiTac: 'from the partner portal',
      ticketToi: 'My tickets', ticketToiMo: 'Open ones, soonest due first. Open a row to work it.',
      hangDoi: 'Unassigned queue', hangDoiMo: 'Partner tickets nobody owns yet.', nhanViec: 'Take it', daNhan: 'Assigned to you',
      khongTicket: 'No tickets', khongTicketMo: 'The queue is empty. The Support page has everything.',
      kMo: 'Open tickets', kQuaHan: 'Overdue', kKhan: 'Urgent', kChuaGan: 'Unassigned', kKn: 'My rights claims', kKnHet: 'dispute deadline near',
      theoTt: 'Team tickets by status', khieuNai: 'My rights claims', khieuNaiMo: 'Nearest dispute deadline first.',
      cMa: 'ID', cTieuDe: 'Title', cDoiTac: 'Partner', cUu: 'Priority', cHan: 'Due', cTt: 'Status', cNv: 'Assignee',
      cBai: 'Track', cNt: 'Store', cHetHan: 'Dispute deadline', cXem: 'Daily views',
      open: 'New', in_progress: 'In progress', waiting: 'Waiting', done: 'Done',
      knOpen: 'New', knDisputed: 'Disputed', knEscalated: 'Escalated', knResolved: 'Resolved', knReleased: 'Released',
      low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent', quaHan: 'overdue', conNgay: '{n} days left',
      moHoTro: 'Open Support', moQuyen: 'Open Rights', moDoiTac: 'Open Partners', moChiTra: 'Open Payouts', moGiaoNhan: 'Open Delivery', moSuaHl: 'Open Bulk edit', moPhatHanh: 'Open Releases', moDuBao: 'See the forecast', moDoiChieu: 'Open approval',
      kdDt: 'Quarter gross {q}', kdTk: 'Accounts managed', kdLabel: 'labels', kdNs: 'artists', kdChiTieu: 'Quarter target', kdDat: '{p} reached',
      kdMoi: 'New accounts', kdGiaHan: 'Renewals due', kdTienDo: 'Target progress', kdTienDoMo: 'Quarter gross of your accounts against the target.',
      kdTop: 'Largest accounts', kdTopMo: 'By quarter gross. Open the Partners directory for more.',
      kdGiaHanMo: 'Contracts ending within 90 days. Reach out before they lapse.', cHopDong: 'Ends', cDtQ: 'Quarter gross',
      kdChuY: 'Accounts needing attention', kdChuYMo: 'No portal account, never logged in, or missing paperwork.',
      kdChuaTk: 'No portal account', kdChuaDn: 'Never logged in', kdThieu: 'Incomplete', kdKhong: 'No account needs attention',
      kdTheoHang: 'By class', quyTruoc: 'previous quarter',
      ktRut: 'Withdrawals waiting', ktRutMo: 'Partners have requested; accounting transfers.', ktKhongRut: 'No withdrawal is waiting',
      cSoTien: 'Amount', cNgay: 'Requested', cNh: 'Bank', xuLy: 'Process',
      ktBangKe: 'PDF statements per period', ktBangKeMo: 'Every payee of an approved period needs a PDF statement. Attach all creates sample statements in this prototype.',
      cKy: 'Period', cDaDinh: 'Attached', dinhHet: 'Attach all', daDinh: 'Statements attached for {k}',
      kRutCho: 'Withdrawals waiting', kRutTien: 'requests waiting for transfer', kDangChuyen: 'Being transferred', kBkThieu: 'PDF statements missing', kKyChua: 'Periods not approved',
      ktTicket: 'Payment tickets', ktTicketMo: 'Partners asking about payments, advances, invoices.',
      ktKy: 'Partners’ earnings per period', ktKyMo: 'Everything owed to payees, per period. The selected period is highlighted.',
      vhPhatHanh: 'Release submissions', vhGiaoNhan: 'Deliveries running', vhSuaHl: 'Bulk edits queued', vhTicket: 'Release / platform tickets', vhKn: 'Open claims',
      vhHangDoi: 'Deliveries and bulk edits', vhHangDoiMo: 'Unfinished requests. Open a row for its page.',
      vhTicketMo: 'Open tickets of type release and platform, soonest due first.',
      vhDuBao: 'Catalogue forecast', vhDuBaoMo: 'Daily streams across the catalogue times each platform’s average payout.',
      dbDuKien: 'Projected for {k}', dbTang7: 'last 7 days vs the 7 before', dbTang28: '28 days', dbLuot: 'Streams per day',
      qlDt: 'Gross revenue {k}', qlKd: 'Sales team against quarter targets', qlKdMo: 'Quarter gross of the accounts each salesperson manages.',
      qlHoTro: 'Support team', qlHoTroMo: 'Team tickets by status; overdue and urgent need attention now.',
      qlKt: 'Accounting', qlVh: 'Operations', qlDoiTac: 'Partners',
      qlTop: 'Fastest-growing tracks', qlTopMo: 'Streams in the last 7 days against the 7 before, whole catalogue.',
      cTang: 'Growth', cLuot7: 'Streams, 7 days'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, vi = c.lang === 'vi', me = A.staff.me;
    var html = HM.dau({
      h1: HM.esc(t('h1')),
      mo: HM.esc(t('homNay').replace('{d}', HT.fmt.date(A.asOf()))),
      so: [{ l: t('nhanVien'), v: me.name }, { l: t('vaiTro'), v: vi ? me.title : me.titleEn }]
    });
    var ve = { sales: veSales, support: veSupport, accounting: veKeToan, ops: veVanHanh, mgmt: veQuanLy }[me.role] || veVanHanh;
    html += ve(c);
    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-tk]', function (el) { if (HT.hoTroMo) HT.hoTroMo(c, el.getAttribute('data-tk')); else c.di('ho-tro'); });
    HM.bam(root, '[data-nhan]', function (el, e) {
      e.stopPropagation();
      try { A.tickets.assign(el.getAttribute('data-nhan'), me.id, me.email); c.thongBao(t('daNhan'), 'ok'); c.veLai(); }
      catch (err) { c.thongBao(err.message, 'no'); }
    });
    HM.bam(root, '[data-dinh-het]', function (el) {
      var pk = el.getAttribute('data-dinh-het');
      try { A.statements.attachAll(pk, me.email); c.thongBao(t('daDinh').replace('{k}', A.periods[A.pIndexOf(pk)].label), 'ok'); c.veLai(); }
      catch (err) { c.thongBao(err.message, 'no'); }
    });
    /* xét duyệt: nút và ngăn dùng chung với màn Xét duyệt */
    HM.bam(root, '[data-dx]', function (el, e) { e.stopPropagation(); if (HT.xuLyDeXuat) HT.xuLyDeXuat(c, el.getAttribute('data-dx'), el.getAttribute('data-id')); else c.di('xet-duyet'); });
    HM.bam(root, 'tr[data-pr]', function (el, e) { if (e.target.closest('button')) return; if (HT.moDeXuat) HT.moDeXuat(c, el.getAttribute('data-pr')); else c.di('xet-duyet'); });
    HM.bam(root, '[data-them-ung]', function () { if (HT.deXuatTamUng) HT.deXuatTamUng(c, null); else c.di('xet-duyet'); });
    HM.bam(root, '[data-them-hd]', function () { if (HT.deXuatHopDong) HT.deXuatHopDong(c, null); else c.di('xet-duyet'); });
  }
});

/* ---------------------------------------------------------------------
   Xét duyệt trên bàn làm việc: giám đốc duyệt, kế toán kiểm, kinh doanh
   theo dõi đề xuất của mình. Bảng gọn; chi tiết và bản tính ROI mở ở ngăn.
   --------------------------------------------------------------------- */
var DX_CHO = ['submitted', 'checked', 'returned'];
function bangDx(c, rows, nut) {
  var t = c.t;
  return '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + HM.esc(t('cDoiTac')) + '</th><th>' + HM.esc(t('dxNoiDung')) + '</th><th class="num">' + HM.esc(t('dxRoi')) + '</th><th>' + HM.esc(t('cTt')) + '</th>' + (nut ? '<th>' + HM.esc(t('dxThaoTac')) + '</th>' : '') + '</tr></thead><tbody>' +
    rows.map(function (p) {
      var roi = p.type === 'advance' ? p.calc.roi : null;
      return '<tr class="pick" data-pr="' + HM.esc(p.id) + '"><td>' + HM.tenBia({ ten: p.party.name, seed: p.party.clientId, phu: p.id + ' · ' + (p.byRole === 'partner' ? t('dxTuDoiTac') : p.by) }) + '</td>' +
        '<td><div class="t-ttl">' + HM.esc(c.song(p, 'moTa')) + '</div><div class="t-sub" style="font-family:var(--f)">' + HTM.tagKn(p.calc.recommendation) + (p.calc.grade ? ' ' + HTM.tagHang(p.calc.grade) : '') + '</div></td>' +
        '<td class="num">' + (roi == null ? '<span class="nil">—</span>' : '<b>' + HM.esc(HT.fmt.pct(roi)) + '</b><div class="t-sub" style="font-family:var(--f)">' + HM.esc(t('dxThuHoi').replace('{n}', p.calc.recoupMonths == null ? '—' : p.calc.recoupMonths)) + '</div>') + '</td>' +
        '<td>' + HTM.tagDx(p.status) + '</td>' +
        (nut ? '<td>' + (HT.nutDeXuat ? HT.nutDeXuat(c, p) : '') + '</td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
}
function theDxQuanLy(c) {
  var A = c.A, t = c.t, k = A.proposals.counts();
  var rows = A.proposals.list().filter(function (p) { return p.status === 'submitted' || p.status === 'checked'; })
    .sort(function (a, b) { return (a.status === 'checked' ? 0 : 1) - (b.status === 'checked' ? 0 : 1) || b.ageDays - a.ageDays; });
  var ung = rows.filter(function (p) { return p.type === 'advance'; }).reduce(function (s, p) { return s + p.terms.amount; }, 0);
  return HM.the({ h2: HM.esc(t('dxCho')) + ' <span class="muted">(' + rows.length + ')</span>', p: HM.esc(t('dxChoMo') + ' ' + t('dxChoS').replace('{a}', c.tien2(ung)).replace('{b}', k.checked)),
    hanhDong: '<button type="button" class="btn sm pri" data-di="xet-duyet">' + HM.esc(t('moXetDuyet')) + '</button>', thoBody: rows.length > 0,
    than: rows.length ? bangDx(c, rows.slice(0, 6), true) : HM.trong({ icon: 'check', tieuDe: t('dxKhong'), moTa: t('dxKhongMo') }) });
}
function theDxSales(c) {
  var A = c.A, t = c.t, me = A.staff.me;
  var rows = A.proposals.list().filter(function (p) { return p.by === me.name; })
    .sort(function (a, b) { return (DX_CHO.indexOf(a.status) >= 0 ? 0 : 1) - (DX_CHO.indexOf(b.status) >= 0 ? 0 : 1) || String(b.updatedAt).localeCompare(String(a.updatedAt)); });
  return HM.the({ h2: HM.esc(t('dxToi')) + ' <span class="muted">(' + rows.length + ')</span>', p: HM.esc(t('dxToiMo')),
    hanhDong: '<div class="btnrow" style="flex-wrap:nowrap"><button type="button" class="btn sm" data-them-hd>' + HM.icon('file') + HM.esc(t('dxTaoHd')) + '</button><button type="button" class="btn sm pri" data-them-ung>' + HM.icon('cash') + HM.esc(t('dxTaoUng')) + '</button></div>', thoBody: rows.length > 0,
    than: rows.length ? bangDx(c, rows.slice(0, 6), true) : HM.trong({ icon: 'cash', tieuDe: t('dxToiKhong'), moTa: t('dxToiKhongMo') }) });
}
function theDxKeToan(c) {
  var A = c.A, t = c.t;
  var rows = A.proposals.list().filter(function (p) { return p.status === 'submitted'; }).sort(function (a, b) { return b.ageDays - a.ageDays; });
  return HM.the({ h2: HM.esc(t('dxKiem')) + ' <span class="muted">(' + rows.length + ')</span>', p: HM.esc(t('dxKiemMo')),
    hanhDong: '<button type="button" class="btn sm" data-di="xet-duyet">' + HM.esc(t('moXetDuyet')) + '</button>', thoBody: rows.length > 0,
    than: rows.length ? bangDx(c, rows.slice(0, 6), true) : HM.trong({ icon: 'check', tieuDe: t('dxKiemKhong'), moTa: t('dxKiemKhongMo') }) });
}

/* ---------------------------------------------------------------------
   Khối dùng chung
   --------------------------------------------------------------------- */
function quaHan(A, tk) { return tk.status !== 'done' && tk.dueAt && tk.dueAt.slice(0, 10) < A.asOf(); }
function tenLoai(A, c, id) {
  var x = null; (A.tickets.types || []).forEach(function (y) { if (y.id === id) x = y; });
  return x ? c.song(x, 'label') : id;
}
function bangTicket(c, rows, opts) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  opts = opts || {};
  if (!rows.length) return HM.trong({ icon: 'check', tieuDe: t('khongTicket'), moTa: t('khongTicketMo') });
  return '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cTieuDe')) + '</th><th>' + HM.esc(t('cUu')) + '</th>' +
    '<th>' + HM.esc(t('cHan')) + '</th><th>' + HM.esc(t(opts.nhan ? 'cNv' : 'cTt')) + '</th></tr></thead><tbody>' +
    rows.map(function (x) {
      var qh = quaHan(A, x);
      return '<tr class="pick" data-tk="' + HM.esc(x.id) + '">' +
        '<td><div class="t-ttl">' + HM.esc(HM.dai(x.title, 44)) + '</div><div class="t-sub">' + HM.esc(x.id + ' · ' + tenLoai(A, c, x.type) + ' · ' + (x.party ? x.party.name : '')) + '</div></td>' +
        '<td>' + HM.tag(t(x.priority), KIEU_UU[x.priority]) + '</td>' +
        '<td style="white-space:nowrap' + (qh ? ';color:var(--danger);font-weight:600' : '') + '">' + HM.esc(HT.fmt.date(x.dueAt)) + (qh ? '<div class="t-sub" style="color:var(--danger)">' + HM.esc(t('quaHan')) + '</div>' : '') + '</td>' +
        '<td>' + (opts.nhan
          ? '<button type="button" class="btn sm pri" data-nhan="' + HM.esc(x.id) + '">' + HM.esc(t('nhanViec')) + '</button>'
          : HM.tag(t(x.status), KIEU_TT[x.status])) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}
function bangKhieuNai(c, rows) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  if (!rows.length) return '<p class="say">' + HM.esc(vi ? 'Không có khiếu nại nào đang mở.' : 'No open claim.') + '</p>';
  return '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cBai')) + '</th><th>' + HM.esc(t('cNt')) + '</th>' +
    '<th>' + HM.esc(t('cHetHan')) + '</th><th class="num">' + HM.esc(t('cXem')) + '</th><th>' + HM.esc(t('cTt')) + '</th></tr></thead><tbody>' +
    rows.map(function (x) {
      var d = x.expiresAt ? Math.round((Date.parse(x.expiresAt.slice(0, 10)) - Date.parse(A.asOf())) / 864e5) : null;
      return '<tr class="pick" data-di="quyen">' +
        '<td><div class="t-ttl">' + HM.esc(HM.dai(x.track.title, 30)) + '</div><div class="t-sub">' + HM.esc(x.id + ' · ' + x.track.artist) + '</div></td>' +
        '<td>' + HM.esc(x.store) + '</td>' +
        '<td' + (d != null && d <= 7 ? ' style="color:var(--danger);font-weight:600"' : '') + '>' + (x.expiresAt ? HM.esc(HT.fmt.date(x.expiresAt)) + (d != null ? '<div class="t-sub">' + HM.esc(d < 0 ? t('quaHan') : t('conNgay').replace('{n}', d)) + '</div>' : '') : '<span class="nil">—</span>') + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(x.dailyViews)) + '</td>' +
        '<td>' + HM.tag(t('kn' + x.status.charAt(0).toUpperCase() + x.status.slice(1)), KIEU_KN[x.status]) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}
function nutLoi(c, ds) {
  return '<div class="btnrow" style="margin:0 0 16px">' + ds.map(function (x) {
    return '<button type="button" class="btn sm" data-di="' + x[0] + '">' + HM.icon(x[2] || 'right') + HM.esc(c.t(x[1])) + '</button>';
  }).join('') + '</div>';
}
function donutTicket(c) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var k = A.tickets.counts();
  return HB.o({ loai: 'vong', cao: 170, dinhDang: 'so', tenTong: 'Ticket', chuThich: true,
    giua: { v: HT.fmt.n(k.open + k.in_progress + k.waiting), l: t('kMo').toLowerCase() },
    phan: [
      { ten: t('open'), gt: k.open, mau: P[0] },
      { ten: t('in_progress'), gt: k.in_progress, mau: P[6] },
      { ten: t('waiting'), gt: k.waiting, mau: P[3] },
      { ten: t('done'), gt: k.done, mau: HB.mauKhac() }
    ] });
}
function sapHan(a, b) { return String(a.dueAt || '').localeCompare(String(b.dueAt || '')); }

/* ---------------------------------------------------------------------
   Kinh doanh
   --------------------------------------------------------------------- */
function veSales(c) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', P = HB.dayMau(), me = A.staff.me;
  var k = A.sales.kpi(me.id, c.ky.idx);
  var chuY = ['no-account', 'never-logged', 'incomplete'].map(function (st) {
    return { st: st, rows: A.parties.list({ manager: me.id, status: st }).rows };
  });
  var html = nutLoi(c, [['doi-tac', 'moDoiTac', 'user'], ['ho-tro', 'moHoTro', 'info']]);
  html += HM.so([
    { l: t('kdDt').replace('{q}', k.quarterLabel), v: HT.fmt.usd0(k.revenueQ), lon: true, d: HM.lech(k.revenueQ, k.revenuePrevQ, t('quyTruoc')) },
    { l: t('kdChiTieu'), v: HT.fmt.usd0(k.target), s: t('kdDat').replace('{p}', HT.fmt.pct(k.targetPct)), mau: k.targetPct >= 1 ? HB.mau('ok') : HB.mau('warn') },
    { l: t('kdTk'), v: HT.fmt.n(k.accounts), s: HT.fmt.n(k.labels) + ' ' + t('kdLabel') + ' · ' + HT.fmt.n(k.artists) + ' ' + t('kdNs') },
    { l: t('kdMoi'), v: HT.fmt.n(k.newAccounts) },
    { l: t('kdGiaHan'), v: HT.fmt.n((k.renewals || []).length), mau: (k.renewals || []).length ? HB.mau('warn') : '' }
  ]);
  var pct = Math.max(0, Math.min(100, k.targetPct * 100));
  html += theDxSales(c);
  html += '<div class="grid g3">' +
    HM.the({
      h2: HM.esc(t('kdTienDo')), p: HM.esc(t('kdTienDoMo')),
      than: '<div class="meter" style="height:14px"><i style="width:' + pct.toFixed(1) + '%;background:' + (k.targetPct >= 1 ? HB.mau('ok') : P[0]) + '"></i></div>' +
        '<div class="hint">' + HM.esc(HT.fmt.usd0(k.revenueQ) + ' / ' + HT.fmt.usd0(k.target) + ' · ' + t('kdDat').replace('{p}', HT.fmt.pct(k.targetPct))) + '</div>' +
        '<h4 class="sec">' + HM.esc(t('kdTop')) + '</h4>' +
        HB.o({ loai: 'thanh', tenTong: t('cDtQ'), hang: (k.top || []).slice(0, 6).map(function (x, i) { return { ten: x.name, gt: x.revenueQ, mau: P[i % 8], phu: x.clientId + ' · ' + x.classification }; }) })
    }) +
    HM.the({
      h2: HM.esc(t('kdTheoHang')),
      than: HB.o({ loai: 'vong', cao: 170, dinhDang: 'so', tenTong: t('kdTk'), chuThich: true, giua: { v: HT.fmt.n(k.accounts), l: t('kdTk').toLowerCase() },
        phan: (k.byClass || []).map(function (x, i) { return { ten: (vi ? 'Hạng ' : 'Class ') + x.c, gt: x.n, mau: P[i % 8] }; }) }) +
        '<h4 class="sec">' + HM.esc(t('kdChuY')) + '</h4><p class="hint" style="margin-top:0">' + HM.esc(t('kdChuYMo')) + '</p>' +
        (chuY.some(function (g) { return g.rows.length; })
          ? chuY.map(function (g) {
              if (!g.rows.length) return '';
              return '<div class="hint" style="margin-top:10px"><b>' + HM.esc(t(g.st === 'no-account' ? 'kdChuaTk' : g.st === 'never-logged' ? 'kdChuaDn' : 'kdThieu')) + '</b> (' + g.rows.length + ')</div>' +
                '<div class="chips">' + g.rows.slice(0, 8).map(function (x) { return '<span class="chip" data-di="doi-tac" style="cursor:pointer">' + HM.esc(HM.dai(x.name, 22)) + '</span>'; }).join('') +
                (g.rows.length > 8 ? '<span class="chip q">+' + (g.rows.length - 8) + '</span>' : '') + '</div>';
            }).join('')
          : '<p class="say">' + HM.esc(t('kdKhong')) + '</p>')
    }) + '</div>';
  html += '<div class="grid g2">' +
    HM.the({
      h2: HM.esc(t('kdGiaHan')) + ' <span class="muted">(' + (k.renewals || []).length + ')</span>', p: HM.esc(t('kdGiaHanMo')),
      thoBody: true,
      than: (k.renewals || []).length ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cDoiTac')) + '</th><th>' + HM.esc(t('cHopDong')) + '</th><th class="num">' + HM.esc(t('cDtQ')) + '</th></tr></thead><tbody>' +
        k.renewals.slice(0, 8).map(function (x) {
          return '<tr class="pick" data-di="doi-tac"><td><div class="t-ttl">' + HM.esc(HM.dai(x.name, 30)) + '</div><div class="t-sub">' + HM.esc(x.clientId) + '</div></td>' +
            '<td>' + HM.esc(HT.fmt.date(x.contractEnd)) + '<div class="t-sub" style="color:var(--warn)">' + HM.esc(x.daysToEnd < 0 ? t('quaHan') : t('conNgay').replace('{n}', x.daysToEnd)) + '</div></td>' +
            '<td class="num">' + HM.esc(c.tien(x.revenueQ)) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="card-b"><p class="say">' + HM.esc(t('kdKhong')) + '</p></div>'
    }) +
    HM.the({
      h2: HM.esc(t('kdTop')), p: HM.esc(t('kdTopMo')),
      hanhDong: '<button type="button" class="btn sm" data-di="doi-tac">' + HM.esc(t('moDoiTac')) + '</button>',
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cDoiTac')) + '</th><th>' + HM.esc(vi ? 'Hạng' : 'Class') + '</th><th class="num">' + HM.esc(t('cDtQ')) + '</th></tr></thead><tbody>' +
        (k.top || []).slice(6, 14).map(function (x) {
          return '<tr class="pick" data-di="doi-tac"><td><div class="t-ttl">' + HM.esc(HM.dai(x.name, 30)) + '</div><div class="t-sub">' + HM.esc(x.clientId) + '</div></td>' +
            '<td>' + HM.tag(x.classification, x.classification === 'A' ? 'ok' : x.classification === 'B' ? 'info' : '') + '</td>' +
            '<td class="num">' + HM.esc(c.tien(x.revenueQ)) + '<div class="t-sub">' + HM.lechHtml(x.revenueQ, x.revenuePrevQ) + '</div></td></tr>';
        }).join('') + '</tbody></table></div>'
    }) + '</div>';
  return html;
}

/* ---------------------------------------------------------------------
   Hỗ trợ
   --------------------------------------------------------------------- */
function veSupport(c) {
  var A = c.A, t = c.t, me = A.staff.me;
  var toi = A.tickets.list({ status: 'open-all', assignee: me.id }).sort(sapHan);
  var chuaGan = A.tickets.list({ status: 'open-all' }).filter(function (x) { return !x.assignee; }).sort(sapHan);
  var kn = A.claims.list({ status: 'open-all', assignee: me.id }).sort(function (a, b) { return String(a.expiresAt || '9').localeCompare(String(b.expiresAt || '9')); });
  var k = A.tickets.counts(me.id);
  var knHet = kn.filter(function (x) { return x.expiresAt && (Date.parse(x.expiresAt.slice(0, 10)) - Date.parse(A.asOf())) / 864e5 <= 7; }).length;
  var html = nutLoi(c, [['ho-tro', 'moHoTro', 'info'], ['quyen', 'moQuyen', 'alert'], ['doi-tac', 'moDoiTac', 'user']]);
  html += HM.so([
    { l: t('kMo'), v: HT.fmt.n(toi.length), lon: true, s: HT.fmt.n(k.overdue) + ' ' + t('quaHan') },
    { l: t('kQuaHan'), v: HT.fmt.n(k.overdue), mau: k.overdue ? HB.mau('no') : '' },
    { l: t('kKhan'), v: HT.fmt.n(k.urgent), mau: k.urgent ? HB.mau('no') : '' },
    { l: t('kChuaGan'), v: HT.fmt.n(chuaGan.length), mau: chuaGan.length ? HB.mau('warn') : '' },
    { l: t('kKn'), v: HT.fmt.n(kn.length), s: knHet + ' ' + t('kKnHet') }
  ]);
  html += '<div class="grid g3">' +
    HM.the({ h2: HM.esc(t('ticketToi')), p: HM.esc(t('ticketToiMo')), thoBody: true, than: bangTicket(c, toi.slice(0, 10)) }) +
    HM.the({ h2: HM.esc(t('theoTt')), than: donutTicket(c) }) + '</div>';
  html += '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('hangDoi')) + ' <span class="muted">(' + chuaGan.length + ')</span>', p: HM.esc(t('hangDoiMo')), thoBody: true, than: bangTicket(c, chuaGan.slice(0, 8), { nhan: true }) }) +
    HM.the({ h2: HM.esc(t('khieuNai')), p: HM.esc(t('khieuNaiMo')), thoBody: kn.length > 0, than: bangKhieuNai(c, kn.slice(0, 8)) }) + '</div>';
  return html;
}

/* ---------------------------------------------------------------------
   Kế toán
   --------------------------------------------------------------------- */
function veKeToan(c) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
  var wc = A.withdrawals.counts();
  var cho = A.withdrawals.list({ status: 'requested' }).concat(A.withdrawals.list({ status: 'processing' }));
  var ky = A.periods.filter(function (p) { return A.isApproved(p.k); }).map(function (p) { var s = A.statements.list(p.k); return { k: p.k, label: p.label, attached: s.attached, total: s.total }; }).reverse();
  var thieu = ky.reduce(function (a, x) { return a + (x.total - x.attached); }, 0);
  var chuaDuyet = A.periods.filter(function (p) { return !A.isApproved(p.k); }).length;
  var tkTt = A.tickets.list({ status: 'open-all', type: 'thanh-toan' }).sort(sapHan);
  var html = nutLoi(c, [['chi-tra', 'moChiTra', 'cash'], ['doi-chieu', 'moDoiChieu', 'check'], ['ho-tro', 'moHoTro', 'info']]);
  html += HM.so([
    { l: t('kRutCho'), v: HT.fmt.usd(wc.pendingAmount), lon: true, s: HT.fmt.n(wc.requested + wc.processing) + ' ' + t('kRutTien') },
    { l: t('kDangChuyen'), v: HT.fmt.n(wc.processing) },
    { l: t('kBkThieu'), v: HT.fmt.n(thieu), mau: thieu ? HB.mau('warn') : '' },
    { l: t('ktTicket'), v: HT.fmt.n(tkTt.length) },
    { l: t('kKyChua'), v: HT.fmt.n(chuaDuyet) }
  ]);
  html += theDxKeToan(c);
  html += '<div class="grid g3">' +
    HM.the({
      h2: HM.esc(t('ktRut')) + ' <span class="muted">(' + cho.length + ')</span>', p: HM.esc(t('ktRutMo')),
      hanhDong: '<button type="button" class="btn sm pri" data-di="chi-tra">' + HM.esc(t('xuLy')) + '</button>',
      thoBody: cho.length > 0,
      than: cho.length ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cDoiTac')) + '</th><th class="num">' + HM.esc(t('cSoTien')) + '</th><th>' + HM.esc(t('cNgay')) + '</th><th>' + HM.esc(t('cTt')) + '</th></tr></thead><tbody>' +
        cho.map(function (w) {
          return '<tr class="pick" data-di="chi-tra"><td><div class="t-ttl">' + HM.esc(w.party.name) + '</div><div class="t-sub">' + HM.esc(w.id + ' · ' + (w.bank ? w.bank.bank : '')) + '</div></td>' +
            '<td class="num"><b>' + HM.esc(HT.fmt.usd(w.amount)) + '</b></td><td>' + HM.esc(HT.fmt.date(w.requestedAt)) + '</td>' +
            '<td>' + HM.tag(w.status === 'requested' ? (vi ? 'Chờ xử lý' : 'Requested') : (vi ? 'Đang chuyển' : 'Processing'), w.status === 'requested' ? 'info' : 'warn') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="say">' + HM.esc(t('ktKhongRut')) + '</p>'
    }) +
    HM.the({
      h2: HM.esc(t('ktBangKe')), p: HM.esc(t('ktBangKeMo')), thoBody: true,
      than: '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + HM.esc(t('cKy')) + '</th><th class="num">' + HM.esc(t('cDaDinh')) + '</th><th>' + HM.esc(vi ? 'Thao tác' : 'Action') + '</th></tr></thead><tbody>' +
        ky.slice(0, 6).map(function (x) {
          var du = x.attached >= x.total;
          return '<tr><td class="mono">' + HM.esc(x.label) + '</td><td class="num"' + (du ? '' : ' style="color:var(--warn);font-weight:600"') + '>' + HM.esc(HT.fmt.n(x.attached) + ' / ' + HT.fmt.n(x.total)) + '</td>' +
            '<td>' + (du ? HM.tag(vi ? 'Đủ' : 'Complete', 'ok') : '<button type="button" class="btn sm" data-dinh-het="' + HM.esc(x.k) + '">' + HM.esc(t('dinhHet')) + '</button>') + '</td></tr>';
        }).join('') + '</tbody></table></div>'
    }) + '</div>';
  html += '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('ktTicket')), p: HM.esc(t('ktTicketMo')), thoBody: true, than: bangTicket(c, tkTt.slice(0, 8)) }) +
    HM.the({
      h2: HM.esc(t('ktKy')), p: HM.esc(t('ktKyMo')),
      than: HB.o({ loai: 'cot', cao: 200, chuThich: false, truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
        tieuDeTip: function (i) { return (vi ? 'Kỳ ' : 'Period ') + A.periods[i].label; },
        chuoi: [{ ten: t('ktKy'), gt: A.periods.map(function (p, i) { return A.isApproved(p.k) ? A.agg('admin', 0, i, 'rec').total : null; }), mau: P[0] }],
        noiBat: c.ky.idx, chuTrong: vi ? 'Chưa xét duyệt' : 'Not approved' })
    }) + '</div>';
  return html;
}

/* ---------------------------------------------------------------------
   Vận hành
   --------------------------------------------------------------------- */
function veVanHanh(c) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
  var gn = A.deliveries.list().filter(function (x) { return x.status !== 'done' && x.status !== 'cancelled' && x.status !== 'failed'; });
  var sl = A.bulk.list().filter(function (x) { return x.status === 'queued'; });
  var tk = A.tickets.list({ status: 'open-all' }).filter(function (x) { return x.type === 'phat-hanh' || x.type === 'nen-tang'; }).sort(sapHan);
  var kc = A.claims.counts();
  var rl = null; try { rl = A.releases.counts(); } catch (e) { rl = null; }
  var rlMo = rl ? Object.keys(rl).filter(function (k) { return k !== 'released' && k !== 'total' && typeof rl[k] === 'number'; }).reduce(function (a, k) { return a + rl[k]; }, 0) : 0;
  var db = null; try { db = A.forecast(); } catch (e) { db = null; }
  var html = nutLoi(c, [['phat-hanh', 'moPhatHanh', 'disc'], ['giao-nhan', 'moGiaoNhan', 'swap'], ['sua-hang-loat', 'moSuaHl', 'list'], ['ho-tro', 'moHoTro', 'info']]);
  html += HM.so([
    { l: t('vhTicket'), v: HT.fmt.n(tk.length), lon: true, s: HT.fmt.n(tk.filter(function (x) { return quaHan(A, x); }).length) + ' ' + t('quaHan') },
    { l: t('vhPhatHanh'), v: HT.fmt.n(rlMo) },
    { l: t('vhGiaoNhan'), v: HT.fmt.n(gn.length) },
    { l: t('vhSuaHl'), v: HT.fmt.n(sl.length) },
    { l: t('vhKn'), v: HT.fmt.n(kc.open + kc.disputed + kc.escalated) }
  ]);
  html += '<div class="grid g3">' +
    HM.the({ h2: HM.esc(t('vhTicket')), p: HM.esc(t('vhTicketMo')), thoBody: true, than: bangTicket(c, tk.slice(0, 10)) }) +
    HM.the({
      h2: HM.esc(t('vhHangDoi')), p: HM.esc(t('vhHangDoiMo')), thoBody: true,
      than: '<div class="tw"><table class="t" style="min-width:0"><tbody>' +
        gn.map(function (x) {
          var pct = x.progress && x.progress.total ? x.progress.sent / x.progress.total * 100 : 0;
          return '<tr class="pick" data-di="giao-nhan"><td><div class="t-ttl">' + HM.esc(HM.dai(x.name, 40)) + '</div><div class="t-sub">' + HM.esc(x.id + ' · ' + x.platforms.join(', ')) + '</div>' +
            '<div class="meter" style="margin-top:6px"><i style="width:' + pct.toFixed(0) + '%"></i></div></td><td>' + HM.tag(x.status, x.status === 'sending' ? 'warn' : 'info') + '</td></tr>';
        }).join('') +
        sl.map(function (x) {
          return '<tr class="pick" data-di="sua-hang-loat"><td><div class="t-ttl">' + HM.esc(x.id + ' · ' + x.action) + '</div><div class="t-sub">' + HM.esc(HT.fmt.n(x.count) + ' UPC · ' + (x.value || '')) + '</div></td><td>' + HM.tag(x.status, 'info') + '</td></tr>';
        }).join('') +
        (!gn.length && !sl.length ? '<tr><td class="muted">' + HM.esc(vi ? 'Không có yêu cầu nào đang chạy.' : 'Nothing running.') + '</td></tr>' : '') +
        '</tbody></table></div>'
    }) + '</div>';
  if (db) html += theDuBao(c, db);
  return html;
}

function theDuBao(c, db) {
  var t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
  var days = db.days || [];
  return HM.the({
    h2: HM.esc(t('vhDuBao')), p: HM.esc(t('vhDuBaoMo')),
    hanhDong: '<button type="button" class="btn sm" data-di="nen-tang">' + HM.esc(t('moDuBao')) + '</button>',
    than: HM.so([
      { l: t('dbDuKien').replace('{k}', db.openPeriod), v: HT.fmt.usd0(db.projected.revenue), s: HT.fmt.n(db.projected.streams) + ' ' + (vi ? 'lượt nghe' : 'streams') },
      { l: t('dbTang7'), v: HT.fmt.pct(db.growth7), mau: db.growth7 >= 0 ? HB.mau('ok') : HB.mau('no') },
      { l: t('dbTang28'), v: HT.fmt.pct(db.growth28), mau: db.growth28 >= 0 ? HB.mau('ok') : HB.mau('no') }
    ]) + '<div style="margin-top:14px">' + HB.o({ loai: 'duong', cao: 170, dinhDang: 'so', chuThich: false,
      truc: days.map(function (d) { return d.date.slice(8, 10) + '/' + d.date.slice(5, 7); }),
      tieuDeTip: function (i) { return HT.fmt.date(days[i].date); },
      chuoi: [{ ten: t('dbLuot'), gt: days.map(function (d) { return d.streams; }), mau: P[0] }] }) + '</div>'
  });
}

/* ---------------------------------------------------------------------
   Quản lý
   --------------------------------------------------------------------- */
function veQuanLy(c) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
  var pi = c.ky.idx;
  var nay = A.agg('admin', 0, pi, 'rec');
  var truoc = pi > 0 ? A.agg('admin', 0, pi - 1, 'rec') : null;
  var tia = A.periods.map(function (p, i) { return A.agg('admin', 0, i, 'rec').gross; });
  var k = A.tickets.counts(), kc = A.claims.counts(), wc = A.withdrawals.counts();
  var sales = A.staff.byRole('sales').map(function (s) { return A.sales.kpi(s.id, pi); });
  var db = null; try { db = A.forecast(); } catch (e) { db = null; }
  var quaHanRows = A.tickets.list({ status: 'open-all' }).filter(function (x) { return quaHan(A, x) || x.priority === 'urgent'; }).sort(sapHan);
  var knRows = A.claims.list({ status: 'open-all' }).sort(function (a, b) { return String(a.expiresAt || '9').localeCompare(String(b.expiresAt || '9')); });
  var html = nutLoi(c, [['tong-quan', 'moDuBao', 'grid'], ['doi-tac', 'moDoiTac', 'user'], ['ho-tro', 'moHoTro', 'info'], ['chi-tra', 'moChiTra', 'cash']]);
  html += HM.so([
    { l: t('qlDt').replace('{k}', c.ky.label), v: c.tien(nay.gross), lon: true, tia: tia, d: truoc ? HM.lech(nay.gross, truoc.gross, A.periods[pi - 1].label) : null },
    { l: t('kMo'), v: HT.fmt.n(k.open + k.in_progress + k.waiting), s: HT.fmt.n(k.overdue) + ' ' + t('quaHan'), mau: k.overdue ? HB.mau('no') : '' },
    { l: t('vhKn'), v: HT.fmt.n(kc.open + kc.disputed + kc.escalated) },
    { l: t('kRutCho'), v: HT.fmt.usd(wc.pendingAmount), s: HT.fmt.n(wc.requested + wc.processing) + ' ' + t('kRutTien') },
    db ? { l: t('dbDuKien').replace('{k}', db.openPeriod), v: HT.fmt.usd0(db.projected.revenue), d: { chu: (db.growth7 >= 0 ? '▲ ' : '▼ ') + HT.fmt.pct(Math.abs(db.growth7)) + ' · 7d', duong: db.growth7 >= 0 } } : null
  ].filter(Boolean));
  html += theDxQuanLy(c);
  html += '<div class="grid g3">' +
    HM.the({
      h2: HM.esc(t('qlKd')), p: HM.esc(t('qlKdMo')),
      hanhDong: '<button type="button" class="btn sm" data-di="doi-tac">' + HM.esc(t('moDoiTac')) + '</button>',
      than: HB.o({ loai: 'thanh', tenTong: t('cDtQ'), hang: sales.map(function (x, i) {
        return { ten: x.staff.name, gt: x.revenueQ, mau: x.targetPct >= 1 ? HB.mau('ok') : P[i % 8], phu: t('kdChiTieu') + ' ' + HT.fmt.usd0(x.target) + ' · ' + t('kdDat').replace('{p}', HT.fmt.pct(x.targetPct)) };
      }) }) +
      sales.map(function (x, i) {
        return '<div class="hint" style="margin-top:6px"><b>' + HM.esc(x.staff.name) + '</b> · ' + HM.esc(HT.fmt.n(x.accounts) + ' ' + t('kdTk').toLowerCase() + ' · ' + HT.fmt.n((x.renewals || []).length) + ' ' + t('kdGiaHan').toLowerCase()) + '</div>' +
          '<div class="meter"><i style="width:' + Math.min(100, x.targetPct * 100).toFixed(1) + '%;background:' + (x.targetPct >= 1 ? HB.mau('ok') : P[i % 8]) + '"></i></div>';
      }).join('')
    }) +
    HM.the({ h2: HM.esc(t('qlHoTro')), p: HM.esc(t('qlHoTroMo')), hanhDong: '<button type="button" class="btn sm" data-di="ho-tro">' + HM.esc(t('moHoTro')) + '</button>', than: donutTicket(c) }) + '</div>';
  html += '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('kQuaHan')) + ' & ' + HM.esc(t('kKhan')), thoBody: true, than: bangTicket(c, quaHanRows.slice(0, 8)) }) +
    HM.the({ h2: HM.esc(t('vhKn')), hanhDong: '<button type="button" class="btn sm" data-di="quyen">' + HM.esc(t('moQuyen')) + '</button>', thoBody: knRows.length > 0, than: bangKhieuNai(c, knRows.slice(0, 8)) }) + '</div>';
  if (db) {
    html += '<div class="grid g3">' + theDuBao(c, db) +
      HM.the({
        h2: HM.esc(t('qlTop')), p: HM.esc(t('qlTopMo')), thoBody: true,
        than: '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + HM.esc(t('cBai')) + '</th><th class="num">' + HM.esc(t('cLuot7')) + '</th><th class="num">' + HM.esc(t('cTang')) + '</th></tr></thead><tbody>' +
          (db.topTracks || []).slice(0, 8).map(function (x) {
            return '<tr><td><div class="t-ttl">' + HM.esc(HM.dai(x.title, 28)) + '</div><div class="t-sub">' + HM.esc(x.artist) + '</div></td>' +
              '<td class="num">' + HM.esc(HT.fmt.n(x.streams7)) + '</td>' +
              '<td class="num"><span class="' + (x.growth >= 0 ? 'pos' : 'neg') + '">' + HM.esc((x.growth >= 0 ? '▲ ' : '▼ ') + HT.fmt.pct(Math.abs(x.growth))) + '</span></td></tr>';
          }).join('') + '</tbody></table></div>'
      }) + '</div>';
  }
  return html;
}

})();
