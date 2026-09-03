/* =====================================================================
   NỘI BỘ · ĐỐI CHIẾU & DUYỆT KỲ
   ---------------------------------------------------------------------
   Đây là cánh cửa duy nhất mở số liệu cho khách. Trước khi bấm nút đó,
   bốn điều kiện phải xanh hết, và bốn điều kiện đó không phải trang trí:
   ba trong bốn cái là chặn cứng.

   Đối chiếu nghĩa là: tổng trên file gốc = phần đã khớp + phần treo.
   Lệch một xu cũng là lệch — hoặc parser sai, hoặc file thiếu dòng. Cả
   hai đều không được để lọt sang bước duyệt. Muốn bỏ qua thì phải GHI
   NHẬN chênh lệch bằng tay, có ghi chú, có tên người ghi.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'doi';

HT.dangKy({
  id: 'doi-chieu', nav: 'navDoi', nhom: 'nhomVanHanh', icon: 'check',

  chu: {
    vi: {
      navDoi: 'Đối soát & xét duyệt kỳ', h1: 'Đối soát & xét duyệt kỳ',
      mo: 'Tổng trên file gốc phải bằng phần đã khớp cộng phần chưa khớp ISRC, chính xác tới từng xu. Kỳ chưa xét duyệt thì label và nghệ sĩ chưa xem được con số nào.',
      tDoi: 'Đối soát theo nguồn', tDk: 'Điều kiện xét duyệt', tTg: 'Tỷ giá', tXem: 'Xem trước thanh toán', tLs: 'Các kỳ',
      luong: 'Nguồn', ttFile: 'Tổng trên file gốc', daKhop: 'Đã khớp bản ghi',
      treo: 'Chưa khớp ISRC', lech: 'Chênh lệch', truyThu: 'Truy thu kỳ khác',
      ghiNhan: 'Ghi nhận chênh lệch', daGhiNhan: 'Đã ghi nhận',
      khop: 'cân đối', chuaNap: 'chưa nhập',
      duyetKy: 'Xét duyệt kỳ', thuHoi: 'Huỷ xét duyệt', daDuyet: 'Kỳ đã xét duyệt',
      chotTg: 'Chốt tỷ giá kỳ', doiTg: 'Đổi tỷ giá hiện hành',
      tgKhoa: 'Đã chốt', tgChua: 'Chưa chốt',
      xemTruoc: 'Bảng thanh toán nếu xét duyệt kỳ ngay bây giờ',
      seChi: 'Sẽ thanh toán', donSang: 'Chuyển sang kỳ sau', thuTamUng: 'Thu hồi tạm ứng', giuLai: 'Giữ lại (điểm producer)',
      benNhan: 'bên thụ hưởng', boQua: 'Xét duyệt kèm ghi nhận ngoại lệ',
      canhBoQua: 'Ngoại lệ sẽ được ghi vĩnh viễn vào hồ sơ xét duyệt kỳ, kèm tên người xét duyệt. Chỉ xét duyệt theo cách này khi biết chắc lý do và chấp nhận trách nhiệm.',
      lyDo: 'Lý do', nguoiDuyet: 'Người xét duyệt'
    },
    en: {
      navDoi: 'Reconcile & approve', h1: 'Reconcile & approve period',
      mo: 'The source file total must equal matched plus held — to the cent. Until a period is approved, clients see nothing.',
      tDoi: 'Reconciliation by feed', tDk: 'Approval conditions', tTg: 'FX rate', tXem: 'Payout preview', tLs: 'All periods',
      luong: 'Feed', ttFile: 'Source file total', daKhop: 'Matched to recordings',
      treo: 'Held', lech: 'Variance', truyThu: 'Back-claims from other periods',
      ghiNhan: 'Accept variance', daGhiNhan: 'Accepted',
      khop: 'balanced', chuaNap: 'not loaded',
      duyetKy: 'Approve period', thuHoi: 'Revoke approval', daDuyet: 'Period approved',
      chotTg: 'Lock the period FX rate', doiTg: 'Change the working rate',
      tgKhoa: 'Locked', tgChua: 'Not locked',
      xemTruoc: 'Payout table if approved now',
      seChi: 'Payable', donSang: 'Carried to next period', thuTamUng: 'Recouped against advances', giuLai: 'Held (producer)',
      benNhan: 'payees', boQua: 'Approve, overriding unmet conditions',
      canhBoQua: 'An override is written permanently into the approval record, with the name of whoever made it. Only do this knowing exactly why, and accepting the consequence.',
      lyDo: 'Reason', nguoiDuyet: 'Approved by'
    }
  },

  dem: function (c) {
    var n = c.A.periods.filter(function (p, i) { return !c.A.isApproved(p.k) && c.A.canApprove(i); }).length;
    return n ? String(n) : '';
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, pi = c.ky.idx, pk = c.kyKey;
    var r = A.recon(pi);
    var dk = A.approvalChecks(pi);
    var duyet = A.isApproved(pk);
    var hong = dk.filter(function (x) { return !x.ok; });
    var nay = HM.nho(A, 'agg:' + pi, function () { return A.agg('admin', 0, pi, 'rec'); });

    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>',
      mo: HM.esc(t('mo')),
      so: [
        { l: t('ttFile'), v: c.tien(r.control) },
        { l: t('lech'), v: c.tien2(r.diff),
          mau: Math.abs(r.diff) > 0.005 ? HB.mau('danger') : HB.mau('ok') },
        { l: c.lang === 'vi' ? 'Trạng thái' : 'Status', v: duyet ? t('daDuyet') : (hong.length ? String(hong.length) + (c.lang === 'vi' ? ' điều kiện chưa đạt' : ' blocked') : (c.lang === 'vi' ? 'sẵn sàng' : 'ready')),
          mau: duyet ? HB.mau('ok') : hong.length ? HB.mau('warn') : HB.mau('accent') }
      ]
    });

    /* ---- dải hành động chính ---- */
    if (duyet) {
      var ap = A.approvalOf(pk);
      html += HM.ghi({ kieu: 'ok',
        tieuDe: HM.esc(t('daDuyet')) + ' · ' + HM.esc(HT.fmt.luc(ap.at)),
        than: HM.esc(t('nguoiDuyet')) + ': ' + HM.esc(ap.by) +
          (ap.note ? ' · ' + HM.esc(ap.note) : '') +
          (ap.overrides && ap.overrides.length
            ? '<br><span class="neg">' + HM.esc(c.lang === 'vi' ? 'Ngoại lệ đã ghi nhận: ' : 'Overrode: ') +
              HM.esc(ap.overrides.join(', ')) + '</span>' : ''),
        nut: '<button type="button" class="btn sm dang" data-thuhoi>' + HM.esc(t('thuHoi')) + '</button>' });
    } else if (!hong.length) {
      html += HM.ghi({ kieu: 'ok',
        tieuDe: HM.esc(c.lang === 'vi' ? 'Đủ bốn điều kiện, kỳ ' + c.ky.label + ' có thể xét duyệt' : 'All four conditions met — ' + c.ky.label + ' can be approved'),
        than: HM.esc(c.lang === 'vi'
          ? 'Sau khi xét duyệt, hệ thống ghi bảng thanh toán vào sổ, thu hồi tạm ứng, chuyển phần dưới ngưỡng sang kỳ sau, và mở kỳ này cho label và nghệ sĩ xem.'
          : 'On approval the payout table is written, advances are recouped, sub-threshold amounts carry forward, and labels and artists can see the period.'),
        nut: '<button type="button" class="btn go" data-duyet>' + HM.icon('check') + HM.esc(t('duyetKy')) + '</button>' });
    } else {
      html += HM.ghi({ kieu: 'warn',
        tieuDe: HM.esc(c.lang === 'vi' ? hong.length + ' điều kiện chưa đạt' : hong.length + ' conditions not met'),
        than: hong.map(function (x) { return '<b>' + HM.esc(c.song(x, 'label')) + '</b>' + (c.lang === 'vi' ? ' · ' : ' — ') + HM.esc(c.song(x, 'detail')); }).join('<br>'),
        nut: '<button type="button" class="btn sm dang" data-boqua>' + HM.esc(t('boQua')) + '</button>' });
    }

    html += HM.tabs([
      { k: 'doi', l: t('tDoi'), icon: 'check' },
      { k: 'dk', l: t('tDk'), icon: 'list', dem: dk.filter(function (x) { return x.ok; }).length + '/' + dk.length },
      { k: 'tg', l: t('tTg'), icon: 'swap' },
      { k: 'xem', l: t('tXem'), icon: 'cash' },
      { k: 'ls', l: t('tLs'), icon: 'cal' }
    ], TAB);

    if (TAB === 'doi') html += veDoi(c, r);
    if (TAB === 'dk') html += veDk(c, dk, nay);
    if (TAB === 'tg') html += veTg(c);
    if (TAB === 'xem') html += veXem(c);
    if (TAB === 'ls') html += veLs(c);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-duyet]', function () { duyetKy(c, false); });
    HM.bam(root, '[data-boqua]', function () { duyetKy(c, true); });
    HM.bam(root, '[data-thuhoi]', function () { thuHoi(c); });
    HM.bam(root, '[data-ghinhan]', function (el) { ghiNhanLech(c, +el.getAttribute('data-ghinhan')); });
    HM.bam(root, '[data-chottg]', function () { chotTyGia(c); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('doi-chieu-' + c.kyKey + '.csv',
        ['Nguồn', 'Trạng thái', 'Tổng trên file gốc', 'Đã khớp', 'Truy thu kỳ khác', 'Đã khớp từ file kỳ này', 'Chưa khớp ISRC', 'Chênh lệch', 'Đã ghi nhận'],
        A.recon(c.ky.idx).rows.map(function (x) {
          return [c.song(x.feed, 'name'), x.status, x.control.toFixed(2), x.attributed.toFixed(2),
                  x.adjustments.toFixed(2), x.fromFile.toFixed(2), x.pending.toFixed(2),
                  x.diff.toFixed(2), x.accepted ? x.accepted.note || 'có, không ghi chú' : ''];
        }));
    });
  }
});

/* =====================================================================
   TAB — ĐỐI CHIẾU
   ===================================================================== */
function veDoi(c, r) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var duyet = A.isApproved(c.kyKey);

  /* Cột hành động chỉ dựng khi có việc để làm. Luôn dựng thì kỳ nào sạch
     cũng để lại một dải trống 170px bên phải, và bảng trông như thiếu số. */
  var coViec = r.rows.some(function (x) { return x.accepted || (Math.abs(x.diff) > 0.005 && !duyet); });
  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('luong')) + '</th>' +
    '<th class="num">' + HM.esc(t('ttFile')) + '</th>' +
    '<th class="num">' + HM.esc(t('daKhop')) + '</th>' +
    '<th class="num">' + HM.esc(t('truyThu')) + '</th>' +
    '<th class="num">' + HM.esc(t('treo')) + '</th>' +
    '<th class="num band">' + HM.esc(t('lech')) + '</th>' +
    (coViec ? '<th style="width:170px"></th>' : '') + '</tr></thead><tbody>' +
    r.rows.map(function (x) {
      var lech = Math.abs(x.diff) > 0.005;
      return '<tr><td><div class="t-ttl">' + HM.esc(c.song(x.feed, 'name')) + '</div>' +
          '<div class="t-sub">' + (x.status === 'loaded' ? HM.esc(x.file) : HM.esc(t('chuaNap'))) + '</div></td>' +
        '<td class="num">' + (x.status === 'loaded' ? HM.esc(c.tien2(x.control)) : '<span class="nil">—</span>') + '</td>' +
        '<td class="num">' + (x.status === 'loaded' ? HM.esc(c.tien2(x.attributed)) : '<span class="nil">—</span>') + '</td>' +
        '<td class="num">' + (x.adjustments > 0.004 ? '−' + HM.esc(c.tien2(x.adjustments)) : '<span class="nil">—</span>') + '</td>' +
        '<td class="num">' + (x.pending > 0.004 ? '<span class="tag warn">' + HM.esc(c.tien2(x.pending)) + '</span>' : '<span class="nil">—</span>') + '</td>' +
        '<td class="num band">' + (x.status !== 'loaded' ? '<span class="nil">—</span>'
          : lech ? '<span class="neg">' + HM.esc(c.tien2(x.diff)) + '</span>'
                 : '<span class="pos">' + HM.esc(t('khop')) + '</span>') + '</td>' +
        (coViec ? '<td>' + (x.accepted
          ? HM.tag(t('daGhiNhan'), 'info')
          : (lech && !duyet ? '<button type="button" class="btn sm dang" data-ghinhan="' + x.feed.id + '">' +
              HM.esc(t('ghiNhan')) + '</button>' : '')) + '</td>' : '') + '</tr>';
    }).join('') + '</tbody>' +
    '<tfoot><tr><td>' + (c.lang === 'vi' ? 'Tổng cả kỳ' : 'Period total') + '</td>' +
      '<td class="num">' + HM.esc(c.tien2(r.control)) + '</td>' +
      '<td class="num">' + HM.esc(c.tien2(r.attributed)) + '</td>' +
      '<td class="num">' + (r.adjustments > 0.004 ? '−' + HM.esc(c.tien2(r.adjustments)) : '—') + '</td>' +
      '<td class="num">' + HM.esc(c.tien2(r.pending)) + '</td>' +
      '<td class="num band">' + HM.esc(c.tien2(r.diff)) + '</td>' +
      (coViec ? '<td></td>' : '') + '</tr></tfoot></table></div>';

  var html = HM.the({
    h2: HM.esc(t('tDoi')),
    p: c.lang === 'vi'
      ? 'Công thức: <b>tổng trên file gốc − phần đã khớp từ file này − phần chưa khớp ISRC = 0</b>. Cột "truy thu kỳ khác" được trừ khỏi phần đã khớp, vì khoản đó không nằm trong file của kỳ này.'
      : 'The identity is: <b>source total − matched from this file − held = 0</b>. Back-claims are subtracted from the matched figure, because they were never in this period’s file.',
    hanhDong: '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') +
      (c.lang === 'vi' ? 'Xuất CSV' : 'Export CSV') + '</button>',
    thoBody: true, than: than
  });

  /* chỗ chênh lệch đã ghi nhận */
  var daGhi = r.rows.filter(function (x) { return x.accepted; });
  if (daGhi.length) {
    html += HM.the({
      h2: c.lang === 'vi' ? 'Chênh lệch đã ghi nhận' : 'Accepted variances',
      p: c.lang === 'vi' ? 'Ghi nhận không làm chênh lệch biến mất. Ghi nhận chỉ xác nhận: đã biết, lý do là gì, và ai chịu trách nhiệm.'
                         : 'Accepting does not make a variance disappear. It records: we know, this is why, and this is who is accountable.',
      than: daGhi.map(function (x) {
        return '<div class="stat"><b>' + HM.esc(c.song(x.feed, 'name')) + '<p>' + HM.esc(x.accepted.note || (c.lang === 'vi' ? '(không ghi chú)' : '(no note)')) + '</p></b>' +
          '<span class="v">' + HM.esc(c.tien2(x.accepted.amount)) + '<em>' + HM.esc(HT.fmt.luc(x.accepted.at)) + '</em></span></div>';
      }).join('')
    });
  }

  /* biểu đồ ba luồng của kỳ */
  html += '<div class="grid g2">' +
    HM.the({
      h2: c.lang === 'vi' ? 'Ba nguồn của kỳ ' + c.ky.label : 'The three feeds, ' + c.ky.label,
      than: HB.o({ loai: 'thanh', hang: r.rows.map(function (x, i) {
        return { ten: c.song(x.feed, 'short'), gt: x.attributed, mau: P[i],
                 phu: x.status === 'loaded' ? x.file : t('chuaNap') };
      }) })
    }) +
    HM.the({
      h2: c.lang === 'vi' ? 'Phân bổ số tiền của kỳ này' : 'Where the period’s money sits',
      than: HM.kv([
        { t: t('ttFile'), v: c.tien2(r.control), manh: true },
        { t: t('daKhop'), v: c.tien2(r.attributed) },
        { t: t('truyThu'), v: r.adjustments > 0.004 ? '−' + c.tien2(r.adjustments) : '—' },
        { t: c.lang === 'vi' ? 'Đã khớp từ file kỳ này' : 'From this file, matched', v: c.tien2(r.fromFile) },
        { t: t('treo'), v: c.tien2(r.pending), mau: r.pending > 0.004 ? 'neg' : '' },
        { t: t('lech'), v: c.tien2(r.diff), manh: true, mau: Math.abs(r.diff) > 0.005 ? 'neg' : 'pos' }
      ]) +
      (r.pending > 0.004
        ? '<div style="margin-top:14px">' + HM.ghi({ kieu: 'warn',
            tieuDe: HM.esc(c.lang === 'vi' ? 'Tiền chưa khớp ISRC vẫn thuộc về một bên thụ hưởng' : 'Held money still belongs to someone'),
            than: HM.esc(c.lang === 'vi'
              ? 'Khoản này không mất đi, nhưng cũng chưa thanh toán được cho ai. Mỗi kỳ xét duyệt xong mà phần này còn nguyên là thêm một lớp tiền chưa xác định người thụ hưởng.'
              : 'It is not lost, but nobody has received it. Every period closed with this untouched adds another layer of ownerless money.'),
            nut: '<button type="button" class="btn sm" data-di="khop-isrc">' + HM.esc(c.lang === 'vi' ? 'Mở danh sách chờ khớp' : 'Open queue') + '</button>' }) + '</div>'
        : '')
    }) + '</div>';

  return html;
}

/* =====================================================================
   TAB — ĐIỀU KIỆN DUYỆT
   ===================================================================== */
function veDk(c, dk, nay) {
  var A = c.A, t = c.t;
  var giaiThich = {
    feeds: c.lang === 'vi'
      ? 'Thiếu một nguồn báo cáo thì tiền của nguồn đó không có trong tổng. Kỳ vẫn ra một con số: đúng với phần đã nhập, nhưng sai hoàn toàn nếu đọc như doanh thu của cả kỳ.'
      : 'A missing feed means its money is not in the total. The period still produces a figure — correct for what is loaded, and completely wrong if anyone reads it as the period’s revenue.',
    recon: c.lang === 'vi'
      ? 'Chênh lệch dù chỉ một xu cũng là do parser sai hoặc file thiếu dòng. Lỗi nào cũng sẽ lớn hơn một xu ở lần nhập báo cáo sau.'
      : 'A one-cent variance is either a parser bug or a missing row in the file. Both are bigger than one cent next run.',
    queue: c.lang === 'vi'
      ? 'Tiền chưa khớp ISRC vượt ' + HT.fmt.pct(A.cfg.BLACKBOX_CAP, 1) + ' doanh thu của kỳ mà vẫn xét duyệt là hợp thức hoá một khoản tiền chưa xác định người thụ hưởng.'
      : 'Above ' + HT.fmt.pct(A.cfg.BLACKBOX_CAP, 1) + ' of period revenue, closing the books legitimises money with no owner.',
    fx: c.lang === 'vi'
      ? 'Không chốt tỷ giá thì số quy đổi sang VND thay đổi theo tỷ giá hôm nay. Mở lại bảng kê cũ sau nửa năm sẽ ra một con số khác.'
      : 'Without a locked rate the VND figures drift with today’s rate — reopening an old statement six months later gives a different number.'
  };
  var noiToi = { feeds: 'nap-du-lieu', recon: null, queue: 'khop-isrc', fx: null };

  return HM.the({
    h2: HM.esc(t('tDk')),
    p: c.lang === 'vi'
      ? 'Có bốn điều kiện xét duyệt. Ba điều kiện đầu là bắt buộc vì sai là mất tiền của đối tác; điều kiện thứ tư cũng bắt buộc vì sai thì sau này không ai kiểm tra lại được.'
      : 'Four conditions. The first three are hard blocks because getting them wrong loses other people’s money; the fourth because getting it wrong makes the report impossible to audit.',
    than: '<div class="checks">' + dk.map(function (x) {
      return '<div class="check ' + (x.ok ? 'ok' : 'no') + '">' + HM.icon(x.ok ? 'check' : 'alert') +
        '<div style="min-width:0;flex:1"><b>' + HM.esc(c.song(x, 'label')) + '</b>' +
        '<span>' + HM.esc(c.song(x, 'detail')) + '</span>' +
        '<span style="margin-top:6px;color:var(--faint)">' + HM.esc(giaiThich[x.id] || '') + '</span></div>' +
        (noiToi[x.id] && !x.ok ? '<div class="r"><button type="button" class="btn sm" data-di="' + noiToi[x.id] + '">' +
          HM.esc(c.lang === 'vi' ? 'Mở trang xử lý' : 'Fix') + '</button></div>' : '') + '</div>';
    }).join('') + '</div>',
    chan: c.lang === 'vi'
      ? 'Xét duyệt kỳ là việc một chiều về mặt niềm tin: xét duyệt xong là đối tác đã đọc con số. Có thể huỷ xét duyệt, nhưng khi đó hai bên sẽ nhớ hai con số khác nhau.'
      : 'Approving is one-way in terms of trust: after it, a client has read the figure. It can be revoked, but then two people remember two different numbers.'
  });
}

/* =====================================================================
   TAB — TỶ GIÁ
   ===================================================================== */
function veTg(c) {
  var A = c.A, t = c.t, f = A.fx.get();
  var khoa = f.locked[c.kyKey] || null;
  var duyet = A.isApproved(c.kyKey);

  return '<div class="grid g2">' +
    HM.the({
      dai: khoa ? { kieu: 'ok', icon: 'check', chu: HM.esc(t('tgKhoa') + ' · 1 USD = ' + HT.fmt.n(khoa.rate) + ' ₫ · ' + HT.fmt.ngay(khoa.at)) }
                : { kieu: 'warn', icon: 'alert', chu: HM.esc(t('tgChua') + ' · ' + c.ky.label) },
      h2: HM.esc(t('chotTg')) + ' ' + HM.esc(c.ky.label),
      p: c.lang === 'vi'
        ? 'Thông lệ ngành là giữ nguyên đồng tiền gốc của từng nền tảng, đến lúc thanh toán mới quy đổi. Bản mẫu tính bằng USD và chốt một tỷ giá cho mỗi kỳ lúc xét duyệt. Đây là câu hỏi cần chốt số 4.'
        : 'Industry practice is to keep each platform’s source currency and convert at payout. The prototype computes in USD and locks one rate per period at approval — this is open question 4.',
      hanhDong: duyet ? '' : '<button type="button" class="btn sm pri" data-chottg>' +
        HM.esc(khoa ? (c.lang === 'vi' ? 'Đổi tỷ giá đã chốt' : 'Change locked rate') : t('chotTg')) + '</button>',
      than: HM.kv([
        { t: c.lang === 'vi' ? 'Tỷ giá hiện hành' : 'Working rate', v: HT.fmt.n(f.rate) + ' ₫ / USD' },
        { t: c.lang === 'vi' ? 'Chính sách' : 'Policy', v: f.policy },
        { t: c.lang === 'vi' ? 'Tỷ giá đã chốt cho kỳ này' : 'Locked for this period',
          v: khoa ? HT.fmt.n(khoa.rate) + ' ₫ · ' + HT.fmt.ngay(khoa.at) : t('tgChua'), manh: true },
        { t: c.lang === 'vi' ? 'Doanh thu gộp của kỳ, quy đổi ra VND' : 'Period gross in VND',
          v: HT.fmt.n(A.agg('admin', 0, c.ky.idx, 'rec').gross * (khoa ? khoa.rate : f.rate)) + ' ₫' }
      ])
    }) +
    HM.the({
      h2: c.lang === 'vi' ? 'Tỷ giá đã chốt của 12 kỳ' : 'Locked rates across 12 periods',
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr><th>' + (c.lang === 'vi' ? 'Kỳ' : 'Period') + '</th>' +
        '<th class="num">' + (c.lang === 'vi' ? 'Tỷ giá' : 'Rate') + '</th>' +
        '<th>' + (c.lang === 'vi' ? 'Ngày chốt' : 'Locked on') + '</th>' +
        '<th>' + (c.lang === 'vi' ? 'Trạng thái' : 'Period status') + '</th></tr></thead><tbody>' +
        A.periods.slice().reverse().map(function (p) {
          var k = f.locked[p.k];
          return '<tr class="pick" data-kyto="' + p.k + '"><td class="mono">' + HM.esc(p.label) + '</td>' +
            '<td class="num">' + (k ? HM.esc(HT.fmt.n(k.rate)) + ' ₫' : '<span class="nil">—</span>') + '</td>' +
            '<td class="mono">' + (k ? HM.esc(HT.fmt.ngay(k.at)) : '—') + '</td>' +
            '<td>' + (A.isApproved(p.k) ? HM.tag(c.lang === 'vi' ? 'đã xét duyệt' : 'approved', 'ok')
              : HM.tag(c.lang === 'vi' ? 'chưa xét duyệt' : 'open', 'warn')) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
    }) + '</div>';
}

/* =====================================================================
   TAB — XEM TRƯỚC CHI TRẢ
   ===================================================================== */
function veXem(c) {
  var A = c.A, t = c.t, pi = c.ky.idx;
  var duyet = A.isApproved(c.kyKey);
  var rows = duyet ? A.payoutOf(c.kyKey) : HM.nho(A, 'xem:' + pi, function () { return A.previewPayout(pi); });
  var tong = { earned: 0, recoup: 0, payable: 0, carryOut: 0, giu: 0 };
  rows.forEach(function (r) {
    if (r.held) { tong.giu += r.earned; return; }
    tong.earned += r.earned; tong.recoup += r.recoup; tong.payable += r.payable; tong.carryOut += r.carryOut;
  });
  var P = HB.dayMau();
  var coChi = rows.filter(function (r) { return r.payable > 0; }).length;

  return HM.the({
    dai: duyet ? { kieu: 'ok', icon: 'check', chu: HM.esc(c.lang === 'vi' ? 'Bảng thanh toán đã ghi sổ lúc xét duyệt kỳ' : 'This is the payout table recorded at approval') }
               : { kieu: 'info', icon: 'info', chu: HM.esc(c.lang === 'vi'
                   ? 'Bản xem trước, chưa ghi vào sổ. Bảng thanh toán chính thức chỉ ghi đúng một lần, lúc xét duyệt kỳ.'
                   : 'Preview only — nothing is written. The real table is written exactly once, at approval.') },
    h2: HM.esc(t('xemTruoc')),
    hanhDong: '<button type="button" class="btn sm" data-di="chi-tra">' + HM.icon('out') +
      (c.lang === 'vi' ? 'Mở trang thanh toán' : 'Open payouts') + '</button>',
    than: HM.so([
      { l: t('seChi'), v: c.tien(tong.payable), lon: true, s: HT.fmt.n(coChi) + ' ' + t('benNhan') },
      { l: t('thuTamUng'), v: c.tien(tong.recoup) },
      { l: t('donSang'), v: c.tien(tong.carryOut),
        s: c.lang === 'vi' ? 'dưới ngưỡng ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) : 'below ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) },
      { l: t('giuLai'), v: c.tien(tong.giu),
        s: c.lang === 'vi' ? 'chưa xác định người thụ hưởng' : 'no identity to pay' }
    ]) +
    '<div style="margin-top:6px">' + HB.chia([
      { ten: t('seChi'), gt: tong.payable, mau: P[0] },
      { ten: t('thuTamUng'), gt: tong.recoup, mau: P[4] },
      { ten: t('donSang'), gt: tong.carryOut, mau: P[7] },
      { ten: t('giuLai'), gt: tong.giu, mau: P[3] }
    ]) + '</div>',
    chan: c.lang === 'vi'
      ? 'Tổng được hưởng của kỳ là ' + HM.esc(c.tien2(tong.earned + tong.giu)) + ', bằng đúng “phần nghệ sĩ được hưởng” cộng “phần label được hưởng” cộng “điểm producer” ở trang tổng quan.'
      : 'Total earned this period is ' + HM.esc(c.tien2(tong.earned + tong.giu)) + ' — exactly artists plus labels plus producer points from the overview.'
  });
}

/* =====================================================================
   TAB — CÁC KỲ
   ===================================================================== */
function veLs(c) {
  var A = c.A;
  return HM.the({
    h2: c.lang === 'vi' ? 'Mười hai kỳ' : 'Twelve periods',
    p: c.lang === 'vi'
      ? 'Các kỳ phải xét duyệt theo đúng thứ tự. Tiền dưới ngưỡng chuyển từ kỳ này sang kỳ sau, tạm ứng thu hồi dần qua từng kỳ. Xét duyệt không theo thứ tự làm đứt cả hai chuỗi, và không có cách nào phát hiện sau khi đã thanh toán.'
      : 'Periods must close in order. Sub-threshold money carries forward and advances recoup period by period — approving out of order breaks both chains, undetectably, after the money has moved.',
    thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + (c.lang === 'vi' ? 'Kỳ' : 'Period') + '</th>' +
      '<th>' + (c.lang === 'vi' ? 'Nguồn' : 'Feeds') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Doanh thu gộp' : 'Gross') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Chưa khớp ISRC' : 'Held') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Tỷ giá' : 'FX') + '</th>' +
      '<th>' + (c.lang === 'vi' ? 'Trạng thái' : 'Status') + '</th></tr></thead><tbody>' +
      A.periods.slice().reverse().map(function (p) {
        var i = p.idx, thieu = A.missingFeeds(i);
        var f = A.fx.get().locked[p.k];
        return '<tr class="pick" data-kyto="' + p.k + '"' +
          (p.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '>' +
          '<td class="mono">' + HM.esc(p.label) + '</td>' +
          '<td>' + A.feeds.map(function (fd) {
            return '<span class="dot ' + (A.feedLoaded(i, fd.id) ? 'ok' : 'no') + '" data-tip="' +
              HM.esc(c.song(fd, 'name') + ': ' + (A.feedLoaded(i, fd.id) ? 'đã nhập' : 'chưa nhập')) + '"></span>';
          }).join('') + (thieu.length ? '<span class="faint" style="font-size:11.5px">' +
            HM.esc(thieu.map(function (x) { return c.song(x, 'short'); }).join(', ')) + '</span>' : '') + '</td>' +
          '<td class="num">' + HM.esc(c.tien(A.agg('admin', 0, i, 'rec').gross)) + '</td>' +
          '<td class="num">' + (A.queue.pendingTotal(p.k) > 0.004
            ? HM.esc(c.tien(A.queue.pendingTotal(p.k))) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (f ? HM.esc(HT.fmt.n(f.rate)) : '<span class="nil">—</span>') + '</td>' +
          '<td>' + (A.isApproved(p.k) ? HM.tag(c.lang === 'vi' ? 'đã xét duyệt' : 'approved', 'ok')
            : A.canApprove(i) ? HM.tag(c.lang === 'vi' ? 'sẵn sàng' : 'ready', 'info')
            : HM.tag(c.lang === 'vi' ? 'chưa đủ điều kiện' : 'blocked', 'warn')) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
  });
}

/* =====================================================================
   HÀNH ĐỘNG
   ===================================================================== */
function duyetKy(c, boQua) {
  var A = c.A, pi = c.ky.idx;
  var hong = A.approvalChecks(pi).filter(function (x) { return !x.ok; });
  var xem = A.previewPayout(pi);
  var seChi = xem.reduce(function (s, r) { return s + r.payable; }, 0);
  var soBen = xem.filter(function (r) { return r.payable > 0; }).length;

  c.hoiThoai({
    tieuDe: (c.lang === 'vi' ? 'Xét duyệt kỳ ' : 'Approve ') + c.ky.label,
    moTa: HM.esc(c.lang === 'vi'
      ? 'Sau khi xét duyệt: hệ thống ghi bảng thanh toán vào sổ, thu hồi tạm ứng, chuyển phần dưới ngưỡng sang kỳ sau, chốt tỷ giá, và mở kỳ này cho label và nghệ sĩ xem trên cổng đối tác.'
      : 'On approval: the payout table is written, advances are recouped, sub-threshold money carries forward, the FX rate locks, and labels and artists see this period on their portal.') +
      (boQua && hong.length ? '<br><br><span class="neg"><b>' + HM.esc(c.t('canhBoQua')) + '</b></span>' : ''),
    than: HM.kv([
      { t: c.lang === 'vi' ? 'Sẽ thanh toán cho' : 'Payable to', v: HT.fmt.n(soBen) + ' ' + c.t('benNhan') },
      { t: c.lang === 'vi' ? 'Tổng sẽ thanh toán' : 'Total payable', v: HT.fmt.usd(seChi), manh: true },
      hong.length ? { t: c.lang === 'vi' ? 'Điều kiện chưa đạt' : 'Unmet conditions',
        v: hong.map(function (x) { return c.song(x, 'label'); }).join(' · ') } : null
    ]) +
    '<label class="fld" style="margin-top:14px">' + (c.lang === 'vi' ? 'Người xét duyệt' : 'Approved by') + '</label>' +
    '<input class="in" data-o="by" value="ops@haustek-group.com">' +
    '<label class="fld" style="margin-top:12px">' + (c.lang === 'vi' ? 'Ghi chú vào hồ sơ xét duyệt' : 'Note on the approval record') + '</label>' +
    '<textarea class="in" data-o="note" rows="2">' +
      HM.esc(hong.length ? '' : (c.lang === 'vi' ? 'Đã đối soát xong, đủ điều kiện xét duyệt' : 'Reconciled and approved')) + '</textarea>',
    dong: boQua ? (c.lang === 'vi' ? 'Xét duyệt kèm ghi nhận ngoại lệ' : 'Approve with override') : c.t('duyetKy'),
    nguyHiem: !!boQua
  }).then(function (r) {
    if (!r) return;
    try {
      A.approve(c.ky.idx, r.by, r.note, !!boQua);
      c.thongBao(c.lang === 'vi' ? 'Đã xét duyệt kỳ ' + c.ky.label + '. Đối tác đã xem được số liệu'
                                  : 'Approved ' + c.ky.label + ' — clients can now see it', 'ok');
      HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

function thuHoi(c) {
  var A = c.A;
  c.hoiThoai({
    tieuDe: (c.lang === 'vi' ? 'Huỷ xét duyệt kỳ ' : 'Revoke ') + c.ky.label,
    moTa: '<span class="neg">' + HM.esc(c.lang === 'vi'
      ? 'Đối tác đã đọc con số của kỳ này. Huỷ xét duyệt thì đối tác mất quyền xem và con số có thể thay đổi. Nếu tiền đã chuyển đi rồi, việc này phải giải thích trực tiếp với đối tác, hệ thống không xử lý thay được.'
      : 'Clients have already read this period’s figures. Revoking removes their access and the numbers may change — if money has already moved, this needs explaining in words, not by the system.') + '</span><br><br>' +
      HM.esc(c.lang === 'vi'
        ? 'Hệ thống hoàn lại phần tạm ứng đã thu hồi và khôi phục phần chuyển từ kỳ trước về đúng số ban đầu, không xoá trắng.'
        : 'The system restores the advance recoupment and the carry-in as it was — it does not zero them.'),
    than: '<label class="fld">' + HM.esc(c.t('lyDo')) + '</label>' +
      '<textarea class="in" data-o="why" rows="3" placeholder="' +
      HM.esc(c.lang === 'vi' ? 'Ví dụ: đối tác TikTok gửi lại file kỳ 06/2026, thiếu 3 thị trường' : '') + '"></textarea>',
    dong: c.t('thuHoi'), nguyHiem: true
  }).then(function (r) {
    if (!r) return;
    try { A.revoke(c.ky.idx, r.why); c.thongBao(c.lang === 'vi' ? 'Đã huỷ xét duyệt' : 'Approval revoked'); HM.quenHet(); c.veLai(); }
    catch (e) { c.thongBao(e.message, 'no'); }
  });
}

function ghiNhanLech(c, fid) {
  var A = c.A, tt = A.feedTotals(c.ky.idx, fid);
  c.hoiThoai({
    tieuDe: c.t('ghiNhan') + ' · ' + c.song(A.feeds[fid], 'name'),
    moTa: HM.esc(c.lang === 'vi'
      ? 'Ghi nhận không làm chênh lệch biến mất, cũng không sửa số. Ghi nhận chỉ xác nhận: đã xem, lý do là gì, và ai chịu trách nhiệm. Ghi nhận xong, kỳ mới đủ điều kiện xét duyệt.'
      : 'Accepting does not make the variance vanish and does not change any figure. It records that a person looked, why, and who is accountable. Only then can the period be approved.'),
    than: HM.kv([
      { t: c.lang === 'vi' ? 'Chênh lệch' : 'Variance', v: HT.fmt.usd(tt.diff), manh: true },
      { t: c.lang === 'vi' ? 'Tỷ lệ so với tổng của nguồn' : 'As share of the feed', v: HT.fmt.pct(tt.control ? Math.abs(tt.diff) / tt.control : 0, 4) }
    ]) +
    '<label class="fld" style="margin-top:14px">' + HM.esc(c.t('lyDo')) + '</label>' +
    '<textarea class="in" data-o="note" rows="3" placeholder="' +
    HM.esc(c.lang === 'vi' ? 'Ví dụ: đối tác xác nhận qua email ngày 22.08 rằng bản gửi lần đầu thiếu 3 dòng thị trường nhỏ, sẽ bổ sung vào kỳ sau' : '') + '"></textarea>',
    dong: c.t('ghiNhan')
  }).then(function (r) {
    if (!r) return;
    if (!r.note || !r.note.trim()) { c.thongBao(c.lang === 'vi' ? 'Cần ghi rõ lý do' : 'A reason is required', 'no'); return; }
    A.ingest.acceptVariance(c.ky.idx, fid, r.note.trim());
    c.thongBao(c.lang === 'vi' ? 'Đã ghi nhận chênh lệch' : 'Variance accepted', 'ok');
    HM.quenHet(); c.veLai();
  });
}

function chotTyGia(c) {
  var A = c.A, f = A.fx.get(), khoa = f.locked[c.kyKey];
  c.hoiThoai({
    tieuDe: c.t('chotTg') + ' ' + c.ky.label,
    moTa: HM.esc(c.lang === 'vi'
      ? 'Tỷ giá đã chốt được dùng vĩnh viễn để quy đổi mọi con số VND của kỳ này. Mở lại bảng kê cũ sau nửa năm vẫn phải ra đúng số tiền đã chuyển đi.'
      : 'The locked rate converts every VND figure for this period, permanently. Reopening the statement six months later must still produce the amount that was actually transferred.'),
    than: '<div class="fldrow two-up">' +
      '<div><label class="fld">' + (c.lang === 'vi' ? 'Tỷ giá (₫ / USD)' : 'Rate (₫ / USD)') + '</label>' +
      '<input class="in" data-o="rate" type="number" step="1" value="' + (khoa ? khoa.rate : f.rate) + '"></div>' +
      '<div><label class="fld">' + (c.lang === 'vi' ? 'Tỷ giá hiện hành' : 'Working rate') + '</label>' +
      '<input class="in" value="' + HM.esc(HT.fmt.n(f.rate)) + '" disabled></div></div>' +
      '<div class="hint">' + HM.esc(c.lang === 'vi' ? 'Chính sách hiện tại: ' + f.policy : 'Policy: ' + f.policy) + '</div>',
    dong: c.t('chotTg')
  }).then(function (r) {
    if (!r) return;
    try {
      A.fx.lock(c.ky.idx, +r.rate);
      HT.setFx(A.fx.get().rate);
      c.thongBao(c.lang === 'vi' ? 'Đã chốt tỷ giá kỳ ' + c.ky.label : 'Rate locked for ' + c.ky.label, 'ok');
      HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

})();
