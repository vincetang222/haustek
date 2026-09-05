/* =====================================================================
   CỔNG KHÁCH · BẢNG KÊ
   ---------------------------------------------------------------------
   Đây là tờ giấy khách in ra, gửi cho kế toán của họ, hoặc mở lại sau
   nửa năm để đối chiếu với sao kê ngân hàng. Nên nó phải:
     · đứng một mình đọc được, không cần màn hình nào khác;
     · có đủ ngày chốt, tỷ giá đã khoá, và mã bên nhận;
     · cộng ra đúng con số đã chuyển đi, không phải con số tính lại hôm nay.

   Khác biệt với màn Tổng quan: tổng quan là để HIỂU, bảng kê là để ĐỐI
   CHIẾU. Cùng số liệu, hai cách bày.
   ===================================================================== */
"use strict";
(function () {

var LUONG = 'rec';

HT.dangKy({
  id: 'k-bang-ke', nav: 'navBangKe', nhom: 'nhomTaiChinh', icon: 'file',

  chu: {
    vi: {
      navBangKe: 'Bảng kê thanh toán', h1: 'Bảng kê thanh toán kỳ',
      mo: 'Chứng từ chính thức của kỳ. Bạn có thể in hoặc tải về.',
      banGhi: 'Doanh thu bản ghi', tacQuyen: 'Tác quyền', caHai: 'Cả hai dòng tiền',
      benNhan: 'Bên thụ hưởng', maKh: 'Mã đối tác', ky: 'Kỳ báo cáo',
      chotSo: 'Thời điểm chốt sổ', tyGia: 'Tỷ giá áp dụng', tyGiaKhoa: 'đã chốt cho kỳ này',
      loaiHd: 'Loại hợp đồng', thuoc: 'Thuộc label',
      muc: 'Khoản mục', soTien: 'Số tiền (USD)', quyVnd: 'Quy đổi (VND)', ghiChu: 'Ghi chú',
      dtBg: 'Doanh thu bản ghi', dtTq: 'Tác quyền',
      cong: 'Cộng phát sinh trong kỳ',
      donTruoc: 'Cộng phần chuyển từ kỳ trước', truUng: 'Khấu trừ tạm ứng',
      thucChi: 'Số thực thanh toán kỳ này', thucChiNgan: 'Thực thanh toán kỳ này', donSau: 'Chuyển sang kỳ sau',
      soBai: 'Số bài hát có doanh thu', soLuot: 'Tổng lượt nghe',
      inRa: 'In bảng kê', taiVe: 'Tải CSV',
      chuaMo: 'Kỳ này chưa chốt sổ',
      chuaMoMo: 'Bảng kê chỉ được lập sau khi kỳ chốt sổ. Chốt sổ nghĩa là Haustek đã nhận đủ báo cáo của tất cả các nền tảng và đối soát khớp đến từng xu.',
      dieuKhoan: 'Căn cứ tính',
      luuY: 'Lưu ý',
      luuYNoiDung: 'Số liệu trong bảng kê này là số trước thuế. Bảng kê PDF do Haustek gửi riêng từng kỳ ghi đầy đủ căn cứ tính và các khoản khấu trừ theo hợp đồng; khi có, bạn tải ở thẻ Bảng kê PDF phía trên.',
      khongTq: 'Kỳ này không có báo cáo tác quyền',
      cacKy: 'Các kỳ đã chốt sổ', xemKy: 'Xem'
    },
    en: {
      navBangKe: 'Statement', h1: 'Period statement',
      mo: 'The official reconciliation for the period. Print it or download it.',
      banGhi: 'Recording revenue', tacQuyen: 'Publishing', caHai: 'Both streams',
      benNhan: 'Payee', maKh: 'Client ID', ky: 'Reporting period',
      chotSo: 'Closed at', tyGia: 'FX rate applied', tyGiaKhoa: 'locked for this period',
      loaiHd: 'Relationship', thuoc: 'Under',
      muc: 'Item', soTien: 'Amount (USD)', quyVnd: 'In VND', ghiChu: 'Note',
      dtBg: 'Recording revenue', dtTq: 'Publishing',
      cong: 'Total arising this period',
      donTruoc: 'Plus carried in from last period', truUng: 'Less advance recouped',
      thucChi: 'PAID THIS PERIOD', thucChiNgan: 'Paid this period', donSau: 'Carried to next period',
      soBai: 'Earning tracks', soLuot: 'Total streams',
      inRa: 'Print statement', taiVe: 'Download CSV',
      chuaMo: 'Period not open',
      chuaMoMo: 'A statement exists only after the period is closed. Closed means every platform has reported and reconciliation balances to the cent.',
      dieuKhoan: 'Basis of calculation',
      luuY: 'Note',
      luuYNoiDung: 'Figures here are before tax. The PDF statement Haustek sends each period carries the full basis of calculation and every contractual deduction; once ready it is in the PDF statement card above.',
      khongTq: 'No publishing report this period',
      cacKy: 'Closed periods', xemKy: 'Open'
    }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t;
    var la = me.role === 'label';

    var rec, pub = null;
    try { rec = api.summary(me.role, me.partyId, c.kyKey, 'rec'); }
    catch (e) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) }) +
        HM.the({ than: HM.trong({ icon: 'clock', tieuDe: t('chuaMo'), moTa: t('chuaMoMo') }) }) +
        veCacKy(c);
      HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
      HM.bam(root, '[data-gt]', function (el) {
      var k = el.getAttribute('data-gt'), ex;
      try { ex = c.api.explain(c.phien.me.role, c.phien.me.partyId, k); } catch (e) { c.thongBao(e.message, 'no'); return; }
      c.hoiThoai({ tieuDe: (c.lang === 'vi' ? 'Giải thích con số kỳ ' : 'How the number for ') + ex.label + (c.lang === 'vi' ? '' : ' is derived'),
        moTa: HM.esc(c.lang === 'vi' ? 'Mỗi bước là một con số có thể kiểm lại; bảng dưới tách theo nền tảng.' : 'Each step is a checkable figure; the table below splits it by platform.'),
        than: HTM.giaiThich(ex, { tien: HT.fmt.usd }), dong: c.lang === 'vi' ? 'Đóng' : 'Close', huy: false, rong: true });
    });
      return;
    }
    if (me.hasPublishing) {
      try { pub = api.summary(me.role, me.partyId, c.kyKey, 'pub'); } catch (e) { pub = null; }
    }

    var tg = rec.fx.rate;
    var chi = rec.payout;
    var coTq = pub && pub.total > 0.004;
    var congPs = Math.round(((rec.total || 0) + (coTq ? pub.total : 0)) * 100) / 100;

    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>',
      mo: HM.esc(t('mo')),
      so: [
        { l: t('cong'), v: HT.fmt.usd(congPs) },
        chi ? { l: t('thucChiNgan'), v: HT.fmt.usd(chi.payable) } : null
      ].filter(Boolean)
    });

    /* ---- đầu bảng kê: ai, kỳ nào, chốt lúc nào, tỷ giá bao nhiêu ---- */
    html += HM.the({
      h2: HM.esc(t('h1')) + ' ' + HM.esc(c.ky.label),
      hanhDong: '<button type="button" class="btn sm" data-in>' + HM.icon('file') + HM.esc(t('inRa')) + '</button>' +
        '<button type="button" class="btn sm pri" data-xuat>' + HM.icon('down2') + HM.esc(t('taiVe')) + '</button>',
      than: '<div class="fldrow two-up">' +
        '<div>' + HM.kv([
          { t: t('benNhan'), v: me.name, manh: true },
          { t: t('maKh'), v: me.clientId },
          { t: t('loaiHd'), v: la ? 'Label' : (me.independent ? (c.lang === 'vi' ? 'Nghệ sĩ độc lập' : 'Independent artist')
                                                              : (c.lang === 'vi' ? 'Nghệ sĩ thuộc label' : 'Artist under a label')) },
          !la && me.belongsTo && !me.independent ? { t: t('thuoc'), v: c.song(me, 'belongsTo') } : null
        ]) + '</div>' +
        '<div>' + HM.kv([
          { t: t('ky'), v: c.ky.label, manh: true },
          { t: t('chotSo'), v: HT.fmt.luc(rec.approvedAt) },
          { t: t('tyGia'), v: HT.fmt.n(tg) + ' ₫ / USD' +
              (rec.fx.locked ? ' · ' + t('tyGiaKhoa') : '') },
          { t: t('soBai'), v: HT.fmt.n(rec.tracks) + (rec.streams != null ? ' · ' + HT.fmt.n(rec.streams) + ' ' + (c.lang === 'vi' ? 'lượt nghe' : 'streams') : '') }
        ]) + '</div></div>'
    });

    /* ---- bảng khoản mục ---- */
    var dong = [];
    var them = function (muc, gt, ghi, kieu) { dong.push({ muc: muc, gt: gt, ghi: ghi || '', kieu: kieu || '' }); };

    rec.chain.forEach(function (b) {
      them(c.song(b, 'label'), b.value, c.song(b, 'note'), b.kind === 'final' ? 'tong' : b.kind === 'top' ? 'dau' : 'tru');
    });
    if (coTq) {
      them('—', null, '', 'ngan');
      pub.chain.forEach(function (b) {
        them(c.song(b, 'label'), b.value, c.song(b, 'note'), b.kind === 'final' ? 'tong' : b.kind === 'top' ? 'dau' : 'tru');
      });
    } else if (me.hasPublishing) {
      them(t('khongTq'), null, pub ? c.song(pub, 'emptyReason') : '', 'ngan');
    }

    them(t('cong'), congPs, '', 'tongto');
    if (chi) {
      if (chi.carryIn > 0.004) them(t('donTruoc'), chi.carryIn,
        c.lang === 'vi' ? 'phần kỳ trước dưới ngưỡng thanh toán tối thiểu' : 'last period’s sub-threshold amount', 'dau');
      if (rec.advance && rec.advance.recoupedThisPeriod > 0.004)
        them(t('truUng'), -rec.advance.recoupedThisPeriod,
          (c.lang === 'vi' ? 'còn phải khấu trừ sau kỳ này: ' : 'left after this period: ') + HT.fmt.usd(rec.advance.left), 'tru');
      them(t('thucChi'), chi.payable, c.song(chi, 'note'), 'tongto');
      if (chi.carryOut > 0.004)
        them(t('donSau'), chi.carryOut,
          (c.lang === 'vi' ? 'dưới ngưỡng thanh toán tối thiểu ' : 'below the ') + HT.fmt.usd0(chi.threshold) +
          (c.lang === 'vi' ? ', cộng vào kỳ sau' : ' threshold — added to next period'), 'dau');
    }

    html += HM.the({
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr>' +
        '<th>' + HM.esc(t('muc')) + '</th>' +
        '<th class="num" style="width:150px">' + HM.esc(t('soTien')) + '</th>' +
        '<th class="num" style="width:170px">' + HM.esc(t('quyVnd')) + '</th></tr></thead><tbody>' +
        dong.map(function (d) {
          if (d.kieu === 'ngan')
            return '<tr><td colspan="3" style="background:var(--band);padding:8px 14px;font-size:12px;color:var(--faint)">' +
              (d.muc === '—' ? HM.esc(c.t('tacQuyen')) : HM.esc(d.muc) + (d.ghi ? (c.lang === 'vi' ? ': ' : ' — ') + HM.esc(d.ghi) : '')) + '</td></tr>';
          var manh = d.kieu === 'tong' || d.kieu === 'tongto';
          return '<tr' + (d.kieu === 'tongto' ? ' style="background:var(--band)"' : '') + '>' +
            '<td><div class="t-ttl"' + (manh ? ' style="font-weight:600"' : '') + '>' + HM.esc(d.muc) + '</div>' +
            (d.ghi ? '<div class="t-sub" style="font-family:var(--f);font-size:11.5px">' + HM.esc(d.ghi) + '</div>' : '') + '</td>' +
            '<td class="num"' + (manh ? ' style="font-weight:600;font-size:14px"' : '') + '>' +
              HM.esc(HT.fmt.usd(d.gt)) + '</td>' +
            '<td class="num muted">' + HM.esc(HT.fmt.n(d.gt * tg)) + ' ₫</td></tr>';
        }).join('') + '</tbody></table></div>',
      chan: HM.esc(c.lang === 'vi'
        ? 'Quy đổi theo tỷ giá đã chốt cho kỳ: 1 USD = ' + HT.fmt.n(tg) + ' ₫. Tỷ giá này được giữ nguyên khi bạn mở lại bảng kê sau này.'
        : 'Converted at the rate locked for this period: 1 USD = ' + HT.fmt.n(tg) + ' ₫. This rate does not change when you reopen the statement later.')
    });

    /* ---- cơ sở tính ---- */
    html += '<div class="grid g2">' +
      HM.the({
        h2: HM.esc(t('dieuKhoan')),
        than: '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Doanh thu trong bảng kê này là phần thuộc về bạn theo hợp đồng, sau khi Haustek đã đối soát với báo cáo của từng nền tảng. Phần label quản lý được hưởng (nếu có) và điểm producer (nếu bài hát có) được tách ra ngay trong bảng trên.'
          : 'Revenue in this statement is the part that belongs to you under your agreement, after Haustek has reconciled every platform’s report. The managing label’s share (if any) and producer points (where the track carries them) are itemised in the table above.') + '</p>' +
          '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Điểm producer được khấu trừ từ phần của nghệ sĩ, không phải là một phần cộng thêm. Nếu cộng thêm, tổng các phần sẽ vượt quá 100%.'
          : 'Producer points come off the artist share rather than being added on top — the other way round, the parts would exceed 100%.') + '</p>' +
          (rec.advance ? '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Khoản tạm ứng được khấu trừ dần vào phần bạn được hưởng mỗi kỳ, cho đến khi khấu trừ hết. Khoản này tính trên cả doanh thu bản ghi và tác quyền cộng lại.'
          : 'The advance is offset against what you earn each period until it clears. It applies to recording and publishing combined.') + '</p>' : '') +
          (me.hasPublishing ? '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Tác quyền là dòng tiền riêng, thuộc về người sáng tác, được báo cáo theo quý và thường trễ một đến hai quý so với doanh thu bản ghi.'
          : 'Publishing is a separate stream belonging to the writers, settled quarterly and usually one to two quarters behind recording revenue.') + '</p>' : '')
      }) +
      HM.the({
        dai: { kieu: 'warn', icon: 'info', chu: HM.esc(t('luuY')) },
        h2: HM.esc(t('luuY')),
        than: '<p class="say">' + HM.esc(t('luuYNoiDung')) + '</p>' +
          '<h4 class="sec">' + (c.lang === 'vi' ? 'Bạn thấy số liệu chưa đúng?' : 'A figure looks wrong?') + '</h4>' +
          '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Bạn gửi mã đối tác ' + me.clientId + ', kỳ ' + c.ky.label + ' và mã ISRC của bài hát cần kiểm tra về ops@haustek-group.com. Có đủ ba thông tin này, Haustek tra đúng dòng trong vài phút; thiếu một thông tin thì phải rà soát cả kỳ.'
          : 'Send client ID ' + me.clientId + ', period ' + c.ky.label + ', and the ISRC of the track in question to ops@haustek-group.com. With those three, the exact row is found in minutes; missing one means combing the whole period.') + '</p>'
      }) + '</div>';

    html += veBaoCaoThang(c);
    html += vePdf(c);
    html += veCacKy(c);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
    HM.bam(root, '[data-in]', function () { window.print(); });
    HM.doi(root, '[data-bk-tu]', function (el) { BK.tu = el.value; c.veLai(); });
    HM.doi(root, '[data-bk-den]', function (el) { BK.den = el.value; c.veLai(); });
    HM.bam(root, '[data-csv-tt]', function (el) { csvKy(c, el.getAttribute('data-csv-tt'), 'tt'); });
    HM.bam(root, '[data-csv-ct]', function (el) { csvKy(c, el.getAttribute('data-csv-ct'), 'ct'); });
    HM.bam(root, '[data-csv-ns]', function (el) { csvKy(c, el.getAttribute('data-csv-ns'), 'ns'); });
    HM.bam(root, '[data-tai-pdf]', function (el) {
      c.thongBao((c.lang === 'vi' ? 'Bản mẫu: tệp ' : 'Prototype: ') + el.getAttribute('data-tai-pdf') + (c.lang === 'vi' ? ' sẽ được tải về từ máy chủ thật.' : ' would download from the real server.'), 'ok');
    });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('bang-ke-' + me.clientId + '-' + c.kyKey + '.csv',
        ['Bên thụ hưởng', 'Mã đối tác', 'Kỳ', 'Chốt sổ', 'Tỷ giá', 'Khoản mục', 'Số tiền USD', 'Quy đổi VND', 'Ghi chú'],
        dong.filter(function (d) { return d.kieu !== 'ngan'; }).map(function (d) {
          return [me.name, me.clientId, c.ky.label, rec.approvedAt, tg,
                  d.muc, d.gt.toFixed(2), Math.round(d.gt * tg), d.ghi];
        }));
    });
  }
});

/* ---- báo cáo theo tháng: mọi kỳ đã xét duyệt trong khoảng chọn, có tải về ---- */
var BK = { tu: null, den: null };
function veBaoCaoThang(c) {
  var api = c.api, me = c.phien.me, vi = c.lang === 'vi', la = me.role === 'label';
  var st;
  try { st = api.statements(me.role, me.partyId).rows; } catch (e) { return ''; }
  if (!st || !st.length) return '';
  var ks = st.map(function (r) { return r.k; });
  var den = BK.den && ks.indexOf(BK.den) >= 0 ? BK.den : ks[0];
  var tu = BK.tu && ks.indexOf(BK.tu) >= 0 ? BK.tu : ks[Math.min(ks.length - 1, 5)];
  if (tu > den) { var x = tu; tu = den; den = x; }
  var rows = st.filter(function (r) { return r.k >= tu && r.k <= den; });
  var tong = { revenue: 0, mine: 0, credit: 0, streams: 0 };
  rows.forEach(function (r) { tong.revenue += r.revenue; tong.mine += r.mine; tong.credit += r.credit; tong.streams += r.streams; });
  var chon = function (attr, gt) {
    return '<select class="inline-sel" ' + attr + '>' + st.map(function (r) { return '<option value="' + r.k + '"' + (r.k === gt ? ' selected' : '') + '>' + HM.esc(r.label) + '</option>'; }).join('') + '</select>';
  };
  var th = function (s, num) { return '<th' + (num ? ' class="num"' : '') + '>' + HM.esc(s) + '</th>'; };
  var nutTai = function (r) {
    return '<div class="btnrow">' +
      (r.pdf ? '<button type="button" class="btn sm" data-tai-pdf="' + HM.esc(r.pdf.file) + '">' + HM.icon('file') + 'PDF</button>' : '<span class="muted" style="font-size:12px">' + HM.esc(vi ? 'PDF chưa có' : 'PDF pending') + '</span>') +
      '<button type="button" class="btn sm ghost" data-csv-tt="' + r.k + '">' + HM.esc(vi ? 'Tóm tắt' : 'Summary') + '</button>' +
      '<button type="button" class="btn sm ghost" data-csv-ct="' + r.k + '">' + HM.esc(vi ? 'Chi tiết' : 'Details') + '</button>' +
      (la ? '<button type="button" class="btn sm ghost" data-csv-ns="' + r.k + '">' + HM.esc(vi ? 'Theo nghệ sĩ' : 'By artist') + '</button>' : '') + '</div>';
  };
  return HM.the({
    h2: HM.esc(vi ? 'Báo cáo theo tháng' : 'Monthly reports'),
    p: HM.esc(vi ? 'Mỗi kỳ đã xét duyệt một dòng, với bảng kê PDF và các bảng CSV để tải về. Chọn khoảng kỳ ở góc phải.' : 'One row per approved period, with the PDF statement and CSV tables to download. Pick the range on the right.'),
    hanhDong: '<span class="muted" style="font-size:12.5px">' + HM.esc(vi ? 'Từ' : 'From') + '</span> ' + chon('data-bk-tu', tu) + ' <span class="muted" style="font-size:12.5px">' + HM.esc(vi ? 'đến' : 'to') + '</span> ' + chon('data-bk-den', den),
    thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' + th(vi ? 'Kỳ' : 'Period') +
      (la ? th(vi ? 'Doanh thu' : 'Revenue', true) + th(vi ? 'Thanh toán cho nghệ sĩ' : 'Paid to artists', true) + th(vi ? 'Phần label được hưởng' : 'Label keeps', true) : th(vi ? 'Thu nhập của bạn' : 'Yours', true)) +
      th(vi ? 'Lượt nghe' : 'Streams', true) + th(vi ? 'Ghi vào ví' : 'Credited', true) + th(vi ? 'Tải về' : 'Download') + th(vi ? 'Xét duyệt' : 'Approved') + '</tr></thead><tbody>' +
      '<tr style="background:var(--band);font-weight:600"><td>' + HM.esc(vi ? 'Tổng cộng' : 'Totals') + '</td>' +
      (la ? '<td class="num">' + HM.esc(HT.fmt.usd(tong.revenue)) + '</td><td class="num">' + HM.esc(HT.fmt.usd(tong.revenue - tong.mine)) + '</td><td class="num">' + HM.esc(HT.fmt.usd(tong.mine)) + '</td>' : '<td class="num">' + HM.esc(HT.fmt.usd(tong.mine)) + '</td>') +
      '<td class="num">' + HM.esc(HT.fmt.n(tong.streams)) + '</td><td class="num band">' + HM.esc(HT.fmt.usd(tong.credit)) + '</td><td></td><td></td></tr>' +
      rows.map(function (r) {
        return '<tr' + (r.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '><td><button type="button" class="btn sm ghost" data-kyto="' + HM.esc(r.k) + '" style="font-family:var(--mono)">' + HM.esc(r.label) + '</button></td>' +
          (la ? '<td class="num">' + HM.esc(HT.fmt.usd(r.revenue)) + '</td><td class="num">' + HM.esc(HT.fmt.usd(r.revenue - r.mine)) + '</td><td class="num">' + HM.esc(HT.fmt.usd(r.mine)) + '</td>' : '<td class="num">' + HM.esc(HT.fmt.usd(r.mine)) + '</td>') +
          '<td class="num">' + HM.esc(HT.fmt.n(r.streams)) + '</td>' +
          '<td class="num band"><b>' + HM.esc(HT.fmt.usd(r.credit)) + '</b>' + (r.recoup > 0 ? '<div class="t-sub" style="font-family:var(--f)">' + HM.esc((vi ? 'khấu trừ tạm ứng ' : 'advance recouped ') + HT.fmt.usd(r.recoup)) + '</div>' : '') + '</td>' +
          '<td>' + nutTai(r) + ' <button type="button" class="btn sm ghost" data-gt="' + HM.esc(r.k) + '" title="' + HM.esc(vi ? 'Giải thích con số' : 'Explain this number') + '">' + HM.icon('ask') + HM.esc(vi ? 'Giải thích' : 'Explain') + '</button></td>' +
          '<td class="mono muted">' + HM.esc(HT.fmt.ngay(r.approvedAt)) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
  });
}
function csvKy(c, k, loai) {
  var api = c.api, me = c.phien.me, vi = c.lang === 'vi', la = me.role === 'label';
  var ky = c.kys.filter(function (p) { return p.k === k; })[0], nhan = ky ? ky.label.replace('/', '-') : k;
  try {
    if (loai === 'tt') {
      var s = api.summary(me.role, me.partyId, k, 'rec');
      HM.csv('tom-tat-' + me.clientId + '-' + nhan + '.csv', [vi ? 'Khoản mục' : 'Item', 'USD', vi ? 'Ghi chú' : 'Note'],
        s.chain.map(function (b) { return [c.song(b, 'label'), b.value.toFixed(2), c.song(b, 'note') || '']; })
          .concat([[vi ? 'Lượt nghe' : 'Streams', s.streams, ''], [vi ? 'Bài hát có doanh thu' : 'Earning tracks', s.tracks, '']]));
    } else if (loai === 'ct') {
      var kq = api.tracks(me.role, me.partyId, k, 'rec', { sort: 'mine', dir: -1 });
      HM.csv('chi-tiet-' + me.clientId + '-' + nhan + '.csv', ['ISRC', vi ? 'Bài hát' : 'Track', vi ? 'Loại' : 'Type', vi ? 'Nghệ sĩ' : 'Artist', vi ? 'Lượt nghe' : 'Streams', (la ? (vi ? 'Doanh thu' : 'Revenue') : (vi ? 'Thu nhập' : 'Yours')) + ' USD'].concat(la ? [(vi ? 'Phần label' : 'Label keeps') + ' USD'] : []),
        kq.rows.map(function (r) { return [r.isrc, r.title, r.type, r.artist, r.streams == null ? '' : r.streams, (la ? r.revenue : r.mine).toFixed(2)].concat(la ? [r.mine.toFixed(2)] : []); }));
    } else {
      var ro = api.roster(me.role, me.partyId, k);
      HM.csv('theo-nghe-si-' + me.clientId + '-' + nhan + '.csv', [vi ? 'Mã nghệ sĩ' : 'Artist ID', vi ? 'Nghệ sĩ' : 'Artist', vi ? 'Bài hát' : 'Tracks', vi ? 'Lượt nghe' : 'Streams', (vi ? 'Doanh thu' : 'Revenue') + ' USD', (vi ? 'Thanh toán cho nghệ sĩ' : 'Paid to artist') + ' USD', (vi ? 'Phần label' : 'Label keeps') + ' USD'],
        ro.rows.map(function (x) { return [x.clientId, x.name, x.tracks, x.streams, x.revenue.toFixed(2), x.artist.toFixed(2), x.labelCut.toFixed(2)]; }));
    }
  } catch (e) { c.thongBao(e.message, 'no'); }
}

/* ---- bảng kê PDF do Haustek tải lên cho kỳ này ---- */
function vePdf(c) {
  var api = c.api, me = c.phien.me, vi = c.lang === 'vi';
  var row = null;
  try { (api.statements(me.role, me.partyId).rows || []).forEach(function (r) { if (r.k === c.kyKey) row = r; }); } catch (e) { row = null; }
  if (!row) return '';
  var pdf = row.pdf;
  return HM.the({
    dai: { kieu: pdf ? 'ok' : 'info', icon: 'file', chu: HM.esc(vi ? 'Bảng kê PDF' : 'PDF statement') },
    h2: HM.esc(vi ? 'Bảng kê PDF do Haustek gửi' : 'PDF statement from Haustek'),
    p: HM.esc(vi
      ? 'Bản chính thức của kỳ, có đầy đủ căn cứ tính và các khoản khấu trừ theo hợp đồng. Haustek tải lên sau khi xét duyệt kỳ.'
      : 'The official copy for the period, with the full basis of calculation and every contractual deduction. Haustek uploads it after approving the period.'),
    than: pdf
      ? HM.kv([
          { t: vi ? 'Tệp' : 'File', v: pdf.file, manh: true },
          { t: vi ? 'Tải lên lúc' : 'Uploaded', v: HT.fmt.luc(pdf.at) },
          { t: vi ? 'Kích thước' : 'Size', v: (pdf.size / 1024).toFixed(0) + ' KB' }
        ]) + '<div class="btnrow" style="margin-top:12px"><button type="button" class="btn pri sm" data-tai-pdf="' + HM.esc(pdf.file) + '">' +
          HM.icon('down2') + HM.esc(vi ? 'Tải bảng kê PDF' : 'Download PDF') + '</button></div>'
      : '<p class="say">' + HM.esc(vi
          ? 'Haustek chưa tải bảng kê PDF của kỳ này lên. Khi có, nút tải xuất hiện ở đây và bạn nhận được thông báo.'
          : 'Haustek has not uploaded this period’s PDF statement yet. Once it is up, the download button appears here and you are notified.') + '</p>'
  });
}

/* ---- danh sách các kỳ đã chốt, để nhảy nhanh ---- */
function veCacKy(c) {
  var t = c.t;
  return HM.the({
    h2: HM.esc(t('cacKy')),
    p: c.lang === 'vi'
      ? 'Mỗi kỳ có một bảng kê. Kỳ chưa chốt sổ không có trong danh sách này.'
      : 'One statement per period. Unclosed periods are not listed.',
    than: '<div class="btnrow">' + c.kys.slice().reverse().map(function (p) {
      return '<button type="button" class="pill' + (p.k === c.kyKey ? ' on' : '') + '" data-kyto="' + HM.esc(p.k) + '">' +
        HM.esc(p.label) + '</button>';
    }).join('') + '</div>'
  });
}

})();
