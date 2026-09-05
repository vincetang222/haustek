/* =====================================================================
   CỔNG ĐỐI TÁC · VÍ & RÚT TIỀN
   ---------------------------------------------------------------------
   Tiền của đối tác không "được chuyển mỗi kỳ" nữa: mỗi kỳ được xét duyệt
   thì phần được hưởng được ghi vào ví; đối tác rút khi muốn, từ ngưỡng
   tối thiểu trở lên, về tài khoản ngân hàng đã khai. Trang này trả lời:
     1. Trong ví có bao nhiêu, rút được bao nhiêu ngay bây giờ?
     2. Các lần rút trước đi tới đâu (đang chờ, đang chuyển, đã chuyển)?
     3. Tiền vào ví theo nhịp nào, và kỳ tới dự kiến ghi khi nào?
   ===================================================================== */
"use strict";
(function () {

var KIEU_RT = { requested: 'info', processing: 'warn', paid: 'ok', rejected: 'no', cancelled: '' };
var CHU_RT = { requested: 'rtRequested', processing: 'rtProcessing', paid: 'rtPaid', rejected: 'rtRejected', cancelled: 'rtCancelled' };

HT.dangKy({
  id: 'k-vi', nav: 'navVi', nhom: 'nhomTaiChinh', icon: 'cash',

  chu: {
    vi: {
      navVi: 'Ví & rút tiền', h1: 'Ví & rút tiền',
      mo: 'Phần bạn được hưởng của mỗi kỳ đã xét duyệt được ghi vào ví. Bạn rút về tài khoản ngân hàng đã khai khi số dư từ ngưỡng tối thiểu trở lên.',
      kKhaDung: 'Số dư khả dụng', kDang: 'Đang xử lý', kDaRut: 'Đã rút', kNguong: 'Ngưỡng rút tối thiểu',
      tongGhi: 'tổng đã ghi vào ví', yeuCau: 'yêu cầu', lan: 'lần chuyển khoản', theoKy: 'ghi vào ví theo kỳ',
      rut: 'Rút tiền', duoiNguong: 'Số dư khả dụng đang dưới ngưỡng rút tối thiểu {n}. Khoản này vẫn nằm trong ví và cộng dồn với kỳ sau.',
      /* thẻ */
      nganHang: 'Tài khoản nhận tiền', sua: 'Sửa', khai: 'Khai tài khoản',
      chuaNh: 'Bạn chưa khai tài khoản nhận tiền', chuaNhMo: 'Cần có tài khoản ngân hàng trước khi gửi yêu cầu rút tiền.',
      nhTen: 'Ngân hàng', nhSo: 'Số tài khoản', nhChu: 'Chủ tài khoản', nhSwift: 'Mã SWIFT', nhTien: 'Tiền tệ nhận', nhCapNhat: 'Cập nhật lần cuối',
      coCau: 'Cơ cấu ví', coCauMo: 'Toàn bộ số đã ghi vào ví, chia theo phần đã rút, đang xử lý và còn khả dụng.',
      nhip: 'Nhịp báo cáo', nhipMo: 'Tiền vào ví theo nhịp báo cáo của từng nhóm nền tảng, không theo một ngày cố định.',
      nhipCau: 'Có báo cáo tới đâu, Haustek ghi vào ví tới đó. Vì vậy phần TikTok của một tháng thường về ví muộn hơn phần của các nền tảng khác.',
      kyTiep: 'Kỳ tiếp theo dự kiến ghi vào ví: {k}', khongKyTiep: 'Mọi kỳ đã có báo cáo đều đã ghi vào ví.',
      lichSu: 'Lịch sử rút tiền', lichSuMo: 'Mỗi yêu cầu rút tiền và trạng thái xử lý của Haustek.',
      cMa: 'Mã', cNgay: 'Ngày yêu cầu', cSoTien: 'Số tiền', cTt: 'Trạng thái', cNh: 'Tài khoản nhận',
      rtRequested: 'Đang chờ xử lý', rtProcessing: 'Đang chuyển khoản', rtPaid: 'Đã chuyển khoản', rtRejected: 'Từ chối', rtCancelled: 'Đã huỷ',
      thamChieu: 'Số tham chiếu', chuyenLuc: 'chuyển lúc', lyDo: 'Lý do', huy: 'Huỷ yêu cầu',
      huyHoi: 'Huỷ yêu cầu rút tiền {id}?', huyHoiMo: 'Số tiền {n} sẽ trở lại số dư khả dụng. Bạn có thể gửi yêu cầu mới bất cứ lúc nào.', daHuy: 'Đã huỷ yêu cầu',
      trongRt: 'Bạn chưa rút tiền lần nào', trongRtMo: 'Khi số dư khả dụng từ ngưỡng tối thiểu trở lên, bạn bấm "Rút tiền" để gửi yêu cầu.',
      ghiKy: 'Khoản ghi vào ví theo kỳ', ghiKyMo: 'Mỗi kỳ được xét duyệt là một lần ghi vào ví. Khấu trừ tạm ứng (nếu có) trừ trước khi ghi.',
      cKy: 'Kỳ', cDuyet: 'Ngày xét duyệt', cHuong: 'Phần được hưởng', cHuongLb: 'Phần label được hưởng', cTru: 'Khấu trừ tạm ứng', cGhi: 'Ghi vào ví',
      trongKy: 'Chưa có kỳ nào ghi vào ví', trongKyMo: 'Khoản đầu tiên được ghi khi Haustek xét duyệt kỳ đầu tiên có doanh thu của bạn.',
      /* hộp thoại */
      hoiRut: 'Rút tiền', hoiRutMo: 'Số dư khả dụng {a} · ngưỡng rút tối thiểu {b}. Haustek chuyển khoản trong 2 ngày làm việc kể từ khi tiếp nhận.',
      hoiSoTien: 'Số tiền rút (USD)', hoiGhiChu: 'Ghi chú cho kế toán (tuỳ chọn)', guiRut: 'Gửi yêu cầu rút tiền', daGuiRut: 'Đã gửi yêu cầu rút tiền',
      hoiNh: 'Tài khoản nhận tiền', hoiNhMo: 'Tên chủ tài khoản phải trùng với tên trên hợp đồng. Haustek đối chiếu trước khi chuyển khoản.',
      luuNh: 'Lưu tài khoản', daLuuNh: 'Đã lưu tài khoản nhận tiền', canNh: 'Bạn cần khai tài khoản nhận tiền trước. Lưu xong, hộp thoại rút tiền sẽ mở lại.'
    },
    en: {
      navVi: 'Wallet & withdrawals', h1: 'Wallet & withdrawals',
      mo: 'Your share of each approved period is credited to your wallet. Withdraw to your registered bank account once the balance reaches the minimum.',
      kKhaDung: 'Available balance', kDang: 'In progress', kDaRut: 'Withdrawn', kNguong: 'Minimum withdrawal',
      tongGhi: 'credited in total', yeuCau: 'requests', lan: 'transfers', theoKy: 'credited per period',
      rut: 'Withdraw', duoiNguong: 'Your available balance is below the {n} minimum. It stays in the wallet and adds up with the next period.',
      nganHang: 'Payout account', sua: 'Edit', khai: 'Add account',
      chuaNh: 'No payout account yet', chuaNhMo: 'A bank account is needed before a withdrawal can be requested.',
      nhTen: 'Bank', nhSo: 'Account number', nhChu: 'Account holder', nhSwift: 'SWIFT code', nhTien: 'Receiving currency', nhCapNhat: 'Last updated',
      coCau: 'Wallet breakdown', coCauMo: 'Everything credited so far, split into withdrawn, in progress and still available.',
      nhip: 'Reporting cadence', nhipMo: 'Money reaches the wallet on each platform group’s reporting cadence, not on a fixed day.',
      nhipCau: 'Whatever has reported is credited; the rest follows when its report lands. That is why a month’s TikTok part usually arrives later than the other platforms.',
      kyTiep: 'Next period expected in the wallet: {k}', khongKyTiep: 'Every reported period is already credited.',
      lichSu: 'Withdrawal history', lichSuMo: 'Each withdrawal request and where Haustek has taken it.',
      cMa: 'ID', cNgay: 'Requested', cSoTien: 'Amount', cTt: 'Status', cNh: 'To account',
      rtRequested: 'Pending', rtProcessing: 'Transferring', rtPaid: 'Transferred', rtRejected: 'Rejected', rtCancelled: 'Cancelled',
      thamChieu: 'Reference', chuyenLuc: 'sent', lyDo: 'Reason', huy: 'Cancel request',
      huyHoi: 'Cancel withdrawal {id}?', huyHoiMo: '{n} returns to your available balance. You can request again any time.', daHuy: 'Request cancelled',
      trongRt: 'No withdrawal yet', trongRtMo: 'Once the available balance reaches the minimum, use “Withdraw” to send a request.',
      ghiKy: 'Credits per period', ghiKyMo: 'Every approved period is one credit. An advance offset (if any) comes off before crediting.',
      cKy: 'Period', cDuyet: 'Approved', cHuong: 'Earned', cHuongLb: 'Label keeps', cTru: 'Advance offset', cGhi: 'Credited',
      trongKy: 'Nothing credited yet', trongKyMo: 'The first credit lands when Haustek approves your first earning period.',
      hoiRut: 'Withdraw', hoiRutMo: 'Available {a} · minimum {b}. Haustek sends the transfer within 2 working days of picking the request up.',
      hoiSoTien: 'Amount (USD)', hoiGhiChu: 'Note for accounting (optional)', guiRut: 'Send withdrawal request', daGuiRut: 'Withdrawal requested',
      hoiNh: 'Payout account', hoiNhMo: 'The account holder must match the name on your agreement. Haustek checks before transferring.',
      luuNh: 'Save account', daLuuNh: 'Payout account saved', canNh: 'Add a payout account first. Once saved, the withdrawal dialog reopens.'
    }
  },

  dem: function (c) {
    try {
      var w = c.api.wallet(c.phien.me.role, c.phien.me.partyId);
      return w.available >= w.threshold ? HB.gonTien(w.available) : '';
    } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
    var la = me.role === 'label';
    var w = api.wallet(me.role, me.partyId);
    var duoi = w.available < w.threshold;
    var dangXuLy = w.withdrawals.filter(function (x) { return x.status === 'requested' || x.status === 'processing'; });
    var daRut = w.withdrawals.filter(function (x) { return x.status === 'paid'; });

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kKhaDung'), v: HT.fmt.usd(w.available), lon: true, s: t('tongGhi') + ' ' + HT.fmt.usd0(w.totalCredit),
        tia: w.credits.slice(-12).map(function (x) { return x.credit; }) },
      { l: t('kDang'), v: HT.fmt.usd(w.pending), s: HT.fmt.n(dangXuLy.length) + ' ' + t('yeuCau'), mau: w.pending > 0 ? HB.mau('warn') : '' },
      { l: t('kDaRut'), v: HT.fmt.usd(w.paid), s: HT.fmt.n(daRut.length) + ' ' + t('lan'), mau: HB.mau('ok') },
      { l: t('kNguong'), v: HT.fmt.usd0(w.threshold) }
    ]);

    html += '<div class="bar">' +
      (duoi ? '<p class="hint" style="margin:0;flex:1;min-width:0">' + HM.esc(t('duoiNguong').replace('{n}', HT.fmt.usd0(w.threshold))) + '</p>' : '<div class="sp"></div>') +
      '<button type="button" class="btn pri" data-rut' + (duoi ? ' disabled' : '') + '>' + HM.icon('cash') + HM.esc(t('rut')) + '</button></div>';

    /* ---- hàng 1: tài khoản · cơ cấu ví · nhịp báo cáo ---- */
    var theNh = HM.the({
      h2: HM.esc(t('nganHang')),
      hanhDong: '<button type="button" class="btn sm" data-nh>' + HM.icon('gear') + HM.esc(w.bank ? t('sua') : t('khai')) + '</button>',
      than: w.bank
        ? HM.kv([
            { t: t('nhTen'), v: w.bank.bank, manh: true },
            { t: t('nhSo'), v: anSo(w.bank.account) },
            { t: t('nhChu'), v: w.bank.holder },
            w.bank.swift ? { t: t('nhSwift'), v: w.bank.swift } : null,
            { t: t('nhTien'), v: w.bank.currency || 'USD' },
            w.bank.updatedAt ? { t: t('nhCapNhat'), v: HT.fmt.luc(w.bank.updatedAt) } : null
          ])
        : HM.trong({ icon: 'alert', tieuDe: t('chuaNh'), moTa: t('chuaNhMo'),
            nut: '<button type="button" class="btn pri sm" data-nh>' + HM.esc(t('khai')) + '</button>' })
    });
    var theCoCau = HM.the({
      h2: HM.esc(t('coCau')), p: HM.esc(t('coCauMo')),
      than: w.totalCredit > 0
        ? HB.o({ loai: 'vong', cao: 180, giua: { v: HT.fmt.usd0(w.totalCredit), l: vi ? 'đã ghi vào ví' : 'credited' },
            tenTong: vi ? 'Số tiền' : 'Amount',
            phan: [
              { ten: t('kDaRut'), gt: w.paid, mau: P[5] },
              { ten: t('kDang'), gt: w.pending, mau: P[1] },
              { ten: t('kKhaDung'), gt: w.available, mau: P[0] }
            ] })
        : '<p class="say">' + HM.esc(t('trongKyMo')) + '</p>'
    });
    var theNhip = HM.the({
      h2: HM.esc(t('nhip')), p: HM.esc(t('nhipMo')),
      than: w.cadence.map(function (g) {
        return '<div class="stat" style="align-items:flex-start"><b style="max-width:none">' + HM.esc(c.song(g, 'label')) +
          '<p>' + HM.esc(c.song(g, 'note')) + '</p></b><span class="v" style="white-space:normal;max-width:45%;font-size:12.5px">' + HM.esc(g.platforms.join(', ')) + '</span></div>';
      }).join('') +
        '<p class="say" style="margin-top:10px">' + HM.esc(t('nhipCau')) + '</p>',
      chan: HM.esc(w.nextPeriod ? t('kyTiep').replace('{k}', w.nextPeriod.label) : t('khongKyTiep'))
    });
    html += '<div class="grid g3" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">' + theNh + theCoCau + theNhip + '</div>';

    /* ---- lịch sử rút tiền ---- */
    html += HM.the({
      h2: HM.esc(t('lichSu')) + (w.withdrawals.length ? ' <span class="muted">(' + w.withdrawals.length + ')</span>' : ''),
      p: HM.esc(t('lichSuMo')),
      thoBody: true,
      than: w.withdrawals.length
        ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cMa')) + '</th><th>' + HM.esc(t('cNgay')) + '</th>' +
          '<th class="num">' + HM.esc(t('cSoTien')) + '</th><th>' + HM.esc(t('cTt')) + '</th><th>' + HM.esc(t('cNh')) + '</th><th>' + HM.esc(c.lang === 'vi' ? 'Thao tác' : 'Actions') + '</th></tr></thead><tbody>' +
          w.withdrawals.map(function (x) {
            var phu = '';
            if (x.status === 'paid') phu = t('thamChieu') + ' ' + (x.ref || '—') + (x.paidAt ? ' · ' + t('chuyenLuc') + ' ' + HT.fmt.luc(x.paidAt) : '');
            else if (x.status === 'rejected') phu = t('lyDo') + ': ' + (x.why || '—');
            else if (x.status !== 'requested') phu = HT.fmt.luc(x.updatedAt);
            return '<tr>' +
              '<td class="mono">' + HM.esc(x.id) + '</td>' +
              '<td class="mono muted">' + HM.esc(HT.fmt.luc(x.requestedAt)) + '</td>' +
              '<td class="num"><b>' + HM.esc(HT.fmt.usd(x.amount)) + '</b></td>' +
              '<td>' + HM.tag(t(CHU_RT[x.status] || x.status), KIEU_RT[x.status] || '') + (phu ? '<div class="t-sub" style="font-family:var(--f)">' + HM.esc(phu) + '</div>' : '') + '</td>' +
              '<td style="font-size:12.5px">' + HM.esc(x.bank ? x.bank.bank + ' ' + anSo(x.bank.account) : '—') + '</td>' +
              '<td class="num">' + (x.status === 'requested' ? '<button type="button" class="btn sm ghost" data-huy="' + HM.esc(x.id) + '">' + HM.esc(t('huy')) + '</button>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : HM.trong({ icon: 'cash', tieuDe: t('trongRt'), moTa: t('trongRtMo') })
    });

    /* ---- khoản ghi vào ví theo kỳ: cột 12 kỳ + bảng ---- */
    var cr = w.credits.slice(-12);
    var coTru = w.credits.some(function (x) { return x.recoup > 0.004; });
    html += HM.the({
      h2: HM.esc(t('ghiKy')), p: HM.esc(t('ghiKyMo')),
      thoBody: true,
      than: w.credits.length
        ? '<div class="card-b" style="padding-bottom:6px">' + HB.o({
            loai: 'cot', cao: 200, hienGiaTri: true, chuThich: coTru,
            truc: cr.map(function (x) { return x.label; }),
            tieuDeTip: function (i) { return (vi ? 'Kỳ ' : 'Period ') + cr[i].label; },
            ghiChuTip: function (i) { return (vi ? 'Xét duyệt ' : 'Approved ') + HT.fmt.ngay(cr[i].approvedAt); },
            chuoi: [{ ten: t('cGhi'), gt: cr.map(function (x) { return x.credit; }), mau: P[0] }]
              .concat(coTru ? [{ ten: t('cTru'), gt: cr.map(function (x) { return x.recoup; }), mau: P[7] }] : [])
          }) + '</div>' +
          '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cKy')) + '</th><th>' + HM.esc(t('cDuyet')) + '</th>' +
          '<th class="num">' + HM.esc(la ? t('cHuongLb') : t('cHuong')) + '</th>' + (coTru ? '<th class="num">' + HM.esc(t('cTru')) + '</th>' : '') +
          '<th class="num band">' + HM.esc(t('cGhi')) + '</th></tr></thead><tbody>' +
          w.credits.slice().reverse().map(function (x) {
            return '<tr' + (x.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '><td class="mono">' + HM.esc(x.label) + '</td>' +
              '<td class="mono muted">' + HM.esc(HT.fmt.ngay(x.approvedAt)) + '</td>' +
              '<td class="num">' + HM.esc(HT.fmt.usd(x.earned)) + '</td>' +
              (coTru ? '<td class="num">' + (x.recoup > 0.004 ? '−' + HM.esc(HT.fmt.usd(x.recoup)) : '<span class="nil">—</span>') + '</td>' : '') +
              '<td class="num band"><b>' + HM.esc(HT.fmt.usd(x.credit)) + '</b></td></tr>';
          }).join('') + '</tbody><tfoot><tr><td colspan="2">' + HM.esc(vi ? 'Tổng cộng' : 'Total') + '</td>' +
          '<td class="num">' + HM.esc(HT.fmt.usd(w.credits.reduce(function (s, x) { return s + x.earned; }, 0))) + '</td>' +
          (coTru ? '<td class="num">−' + HM.esc(HT.fmt.usd(w.credits.reduce(function (s, x) { return s + x.recoup; }, 0))) + '</td>' : '') +
          '<td class="num band">' + HM.esc(HT.fmt.usd(w.totalCredit)) + '</td></tr></tfoot></table></div>'
        : HM.trong({ icon: 'clock', tieuDe: t('trongKy'), moTa: t('trongKyMo') })
    });

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-rut]', function () { hoiRut(c, w); });
    HM.bam(root, '[data-nh]', function () { hoiNganHang(c, w, null); });
    HM.bam(root, '[data-huy]', function (el) {
      var id = el.getAttribute('data-huy');
      var x = w.withdrawals.filter(function (y) { return y.id === id; })[0];
      c.xacNhan(t('huyHoi').replace('{id}', id), HM.esc(t('huyHoiMo').replace('{n}', HT.fmt.usd(x ? x.amount : 0))), t('huy'), true).then(function (ok) {
        if (!ok) return;
        try { api.cancelWithdrawal(me.role, me.partyId, id); c.thongBao(t('daHuy') + ' · ' + id, 'ok'); c.veLai(); }
        catch (e) { c.thongBao(e.message, 'no'); }
      });
    });
  }
});

/* số tài khoản: chỉ hiện bốn số cuối, phần còn lại thay bằng dấu chấm */
function anSo(so) {
  so = String(so || '').replace(/^-/, '');
  return so.length > 4 ? '···· ' + so.slice(-4) : so;
}

/* ---- hộp thoại rút tiền ---- */
function hoiRut(c, w) {
  var api = c.api, me = c.phien.me, t = c.t, vi = c.lang === 'vi';
  if (!w.bank) {
    c.thongBao(t('canNh'), 'no');
    hoiNganHang(c, w, function () { hoiRut(c, api.wallet(me.role, me.partyId)); });
    return;
  }
  c.hoiThoai({
    tieuDe: t('hoiRut'),
    moTa: HM.esc(t('hoiRutMo').replace('{a}', HT.fmt.usd(w.available)).replace('{b}', HT.fmt.usd0(w.threshold))),
    than: '<label class="fld">' + HM.esc(t('hoiSoTien')) + '</label>' +
      '<input class="in" type="number" data-o="amount" min="' + w.threshold + '" max="' + w.available + '" step="0.01" value="' + w.available.toFixed(2) + '">' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(t('hoiGhiChu')) + '</label><input class="in" data-o="note">' +
      '<h4 class="sec">' + HM.esc(t('nganHang')) + '</h4>' +
      HM.kv([
        { t: t('nhTen'), v: w.bank.bank },
        { t: t('nhSo'), v: anSo(w.bank.account) },
        { t: t('nhChu'), v: w.bank.holder, manh: true }
      ]) +
      '<h4 class="sec">' + HM.esc(vi ? 'Thuế khấu trừ và số thực nhận' : 'Withholding and net amount') + '</h4><div data-thue></div>' +
      '<div class="hint">' + HM.esc(vi ? 'Cần đổi tài khoản nhận tiền thì bấm "Sửa" ở thẻ Tài khoản nhận tiền trước khi gửi yêu cầu.'
                                        : 'To change the account, use “Edit” on the payout account card before sending.') + '</div>',
    dong: t('guiRut')
  }).then(function (f) {
    if (!f) return;
    try {
      var kq = api.requestWithdrawal(me.role, me.partyId, { amount: +f.amount, note: f.note });
      c.thongBao(t('daGuiRut') + ' · ' + kq.id + ' · ' + HT.fmt.usd(kq.amount) + (kq.tax && kq.tax.pit ? ' · ' + (vi ? 'thực nhận ' : 'net ') + HT.fmt.usd(kq.tax.net) : ''), 'ok');
      c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
  /* dòng thuế cập nhật theo số tiền đang gõ: cá nhân từ 2 triệu đồng mỗi lần chi thì khấu trừ 10% TNCN */
  setTimeout(function () {
    var md = document.querySelector('.modal'); if (!md) return;
    var inp = md.querySelector('[data-o="amount"]'), host = md.querySelector('[data-thue]');
    function ve() {
      var q; try { q = api.withdrawalQuote(me.role, me.partyId, +inp.value || 0); } catch (e) { host.innerHTML = ''; return; }
      host.innerHTML = HM.kv([
        { t: vi ? 'Số tiền rút' : 'Amount', v: HT.fmt.usd(q.amount) + ' · ' + HT.fmt.n(q.vnd) + ' ₫' },
        { t: (vi ? 'Thuế TNCN khấu trừ' : 'Personal income tax withheld') + ' ' + HT.fmt.pct(q.rate), v: q.pit ? '− ' + HT.fmt.usd(q.pit) + ' · ' + HT.fmt.n(q.pitVnd) + ' ₫' : (vi ? 'không' : 'none') },
        { t: vi ? 'Thực nhận' : 'Net to you', v: HT.fmt.usd(q.net) + ' · ' + HT.fmt.n(q.netVnd) + ' ₫', manh: true }
      ]) + '<p class="hint" style="margin-top:6px">' + HM.esc(vi ? q.rule : q.ruleEn) + (q.certificate ? ' ' + HM.esc(vi ? 'Chứng từ khấu trừ tải ở Bảng kê thanh toán sau khi chuyển.' : 'The withholding certificate is available in Statements after payment.') : '') + '</p>';
    }
    if (inp && host) { ve(); inp.addEventListener('input', ve); }
  }, 30);
}

/* ---- hộp thoại khai / sửa tài khoản ngân hàng ---- */
function hoiNganHang(c, w, sauDo) {
  var api = c.api, me = c.phien.me, t = c.t;
  var b = w.bank || {};
  c.hoiThoai({
    tieuDe: t('hoiNh'), moTa: HM.esc(t('hoiNhMo')),
    than: '<div class="fldrow two-up">' +
      '<div><label class="fld">' + HM.esc(t('nhTen')) + ' *</label><input class="in" data-o="bank" value="' + HM.esc(b.bank || '') + '" placeholder="Vietcombank"></div>' +
      '<div><label class="fld">' + HM.esc(t('nhSo')) + ' *</label><input class="in" data-o="account" inputmode="numeric" value="' + HM.esc(String(b.account || '').replace(/^-/, '')) + '"></div>' +
      '<div><label class="fld">' + HM.esc(t('nhChu')) + ' *</label><input class="in" data-o="holder" value="' + HM.esc(b.holder || me.name.toUpperCase()) + '"></div>' +
      '<div><label class="fld">' + HM.esc(t('nhSwift')) + '</label><input class="in" data-o="swift" value="' + HM.esc(b.swift || '') + '" placeholder="BFTVVNVX"></div>' +
      '<div><label class="fld">' + HM.esc(t('nhTien')) + '</label><select class="in" data-o="currency">' +
        '<option value="USD"' + (b.currency !== 'VND' ? ' selected' : '') + '>USD</option><option value="VND"' + (b.currency === 'VND' ? ' selected' : '') + '>VND</option></select></div></div>',
    dong: t('luuNh')
  }).then(function (f) {
    if (!f) return;
    try {
      api.setBank(me.role, me.partyId, { bank: f.bank, account: f.account, holder: f.holder, swift: f.swift, currency: f.currency });
      c.thongBao(t('daLuuNh'), 'ok');
      c.veLai();
      if (sauDo) sauDo();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

})();
