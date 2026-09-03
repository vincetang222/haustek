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
  id: 'k-bang-ke', nav: 'navBangKe', icon: 'file',

  chu: {
    vi: {
      navBangKe: 'Bảng kê', h1: 'Bảng kê kỳ',
      mo: 'Chứng từ chính thức của kỳ. In ra hoặc tải về đều được.',
      banGhi: 'Doanh thu bản ghi', tacQuyen: 'Tác quyền', caHai: 'Cả hai dòng tiền',
      benNhan: 'Bên nhận', maKh: 'Mã khách hàng', ky: 'Kỳ báo cáo',
      chotSo: 'Chốt sổ lúc', tyGia: 'Tỷ giá áp dụng', tyGiaKhoa: 'đã chốt cho kỳ này',
      loaiHd: 'Loại hợp đồng', thuoc: 'Thuộc label',
      muc: 'Khoản mục', soTien: 'Số tiền (USD)', quyVnd: 'Quy đổi (VND)', ghiChu: 'Ghi chú',
      dtBg: 'Doanh thu bản ghi', dtTq: 'Tác quyền',
      cong: 'Cộng phát sinh trong kỳ',
      donTruoc: 'Cộng phần dồn từ kỳ trước', truUng: 'Trừ vào tạm ứng',
      thucChi: 'Số thực chi kỳ này', thucChiNgan: 'Thực chi kỳ này', donSau: 'Dồn sang kỳ sau',
      soBai: 'Số bài có doanh thu', soLuot: 'Tổng lượt nghe',
      inRa: 'In bảng kê', taiVe: 'Tải CSV',
      chuaMo: 'Kỳ này chưa chốt sổ',
      chuaMoMo: 'Bảng kê chỉ có sau khi kỳ chốt sổ. Chốt sổ nghĩa là đã nhận đủ báo cáo của mọi nền tảng và đối soát khớp tới từng xu.',
      dieuKhoan: 'Căn cứ tính',
      luuY: 'Lưu ý',
      luuYNoiDung: 'Số trong bảng này là số trước thuế và trước phí chuyển khoản. Khoản thực nhận vào tài khoản của bạn sẽ nhỏ hơn nếu có thuế hoặc phí; phần chênh ghi rõ trên chứng từ chuyển tiền.',
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
      luuYNoiDung: 'Figures here are BEFORE tax and before transfer fees. What reaches your account may be less; the difference is itemised on the transfer voucher.',
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
      h2: HM.esc(t('h1')) + ' — ' + HM.esc(c.ky.label),
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
          { t: t('soBai'), v: HT.fmt.n(rec.tracks) + (rec.streams != null ? ' · ' + HT.fmt.n(rec.streams) + ' ' + (c.lang === 'vi' ? 'lượt' : 'streams') : '') }
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
        c.lang === 'vi' ? 'phần kỳ trước dưới ngưỡng chi trả' : 'last period’s sub-threshold amount', 'dau');
      if (rec.advance && rec.advance.recoupedThisPeriod > 0.004)
        them(t('truUng'), -rec.advance.recoupedThisPeriod,
          (c.lang === 'vi' ? 'còn lại sau kỳ này: ' : 'left after this period: ') + HT.fmt.usd(rec.advance.left), 'tru');
      them(t('thucChi'), chi.payable, c.song(chi, 'note'), 'tongto');
      if (chi.carryOut > 0.004)
        them(t('donSau'), chi.carryOut,
          (c.lang === 'vi' ? 'dưới ngưỡng ' : 'below the ') + HT.fmt.usd0(chi.threshold) +
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
              (d.muc === '—' ? HM.esc(c.t('tacQuyen')) : HM.esc(d.muc) + (d.ghi ? ' — ' + HM.esc(d.ghi) : '')) + '</td></tr>';
          var manh = d.kieu === 'tong' || d.kieu === 'tongto';
          return '<tr' + (d.kieu === 'tongto' ? ' style="background:var(--band)"' : '') + '>' +
            '<td><div class="t-ttl"' + (manh ? ' style="font-weight:600"' : '') + '>' + HM.esc(d.muc) + '</div>' +
            (d.ghi ? '<div class="t-sub" style="font-family:var(--f);font-size:11.5px">' + HM.esc(d.ghi) + '</div>' : '') + '</td>' +
            '<td class="num"' + (manh ? ' style="font-weight:600;font-size:14px"' : '') + '>' +
              HM.esc(HT.fmt.usd(d.gt)) + '</td>' +
            '<td class="num muted">' + HM.esc(HT.fmt.n(d.gt * tg)) + ' ₫</td></tr>';
        }).join('') + '</tbody></table></div>',
      chan: HM.esc(c.lang === 'vi'
        ? 'Quy đổi theo tỷ giá đã chốt cho kỳ: 1 USD = ' + HT.fmt.n(tg) + ' ₫. Tỷ giá này giữ nguyên khi bạn mở lại bảng kê sau này.'
        : 'Converted at the rate locked for this period: 1 USD = ' + HT.fmt.n(tg) + ' ₫. This rate does not change when you reopen the statement later.')
    });

    /* ---- cơ sở tính ---- */
    html += '<div class="grid g2">' +
      HM.the({
        h2: HM.esc(t('dieuKhoan')),
        than: '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Doanh thu gộp là toàn bộ số tiền các nền tảng báo cáo cho các bài liên quan trong kỳ, trước mọi khoản trừ. Từ đó trừ phí Haustek theo hợp đồng, rồi phần label quản lý giữ lại (nếu có), rồi điểm producer (nếu bài có).'
          : 'Gross is everything the platforms reported for the related tracks in the period, before any deduction. From it comes the contractual Haustek fee, then the managing party’s share, then producer points where the track carries them.') + '</p>' +
          '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Điểm producer trừ vào phần của nghệ sĩ, không cộng thêm bên trên. Làm ngược lại thì tổng các phần vượt quá 100%.'
          : 'Producer points come off the artist share rather than being added on top — the other way round, the parts would exceed 100%.') + '</p>' +
          (rec.advance ? '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Khoản tạm ứng trừ dần vào phần bạn được hưởng mỗi kỳ, cho tới khi hết. Khoản này tính trên cả doanh thu bản ghi lẫn tác quyền cộng lại.'
          : 'The advance is offset against what you earn each period until it clears. It applies to recording and publishing combined.') + '</p>' : '') +
          (me.hasPublishing ? '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Tác quyền là dòng tiền riêng, thuộc về người sáng tác, về theo quý và thường trễ một tới hai quý so với doanh thu bản ghi.'
          : 'Publishing is a separate stream belonging to the writers, settled quarterly and usually one to two quarters behind recording revenue.') + '</p>' : '')
      }) +
      HM.the({
        dai: { kieu: 'warn', icon: 'info', chu: HM.esc(t('luuY')) },
        h2: HM.esc(t('luuY')),
        than: '<p class="say">' + HM.esc(t('luuYNoiDung')) + '</p>' +
          '<h4 class="sec">' + (c.lang === 'vi' ? 'Thấy số không đúng?' : 'A figure looks wrong?') + '</h4>' +
          '<p class="say">' + HM.esc(c.lang === 'vi'
          ? 'Gửi mã khách hàng ' + me.clientId + ', kỳ ' + c.ky.label + ' và mã ISRC của bài cần kiểm tra về ops@haustek-group.com. Đủ ba thứ đó thì tra đúng dòng trong vài phút; thiếu một thứ thì phải rà cả kỳ.'
          : 'Send client ID ' + me.clientId + ', period ' + c.ky.label + ', and the ISRC of the track in question to ops@haustek-group.com. With those three, the exact row is found in minutes; missing one means combing the whole period.') + '</p>'
      }) + '</div>';

    html += veCacKy(c);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
    HM.bam(root, '[data-in]', function () { window.print(); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('bang-ke-' + me.clientId + '-' + c.kyKey + '.csv',
        ['Bên nhận', 'Mã khách hàng', 'Kỳ', 'Chốt sổ', 'Tỷ giá', 'Khoản mục', 'Số tiền USD', 'Quy đổi VND', 'Ghi chú'],
        dong.filter(function (d) { return d.kieu !== 'ngan'; }).map(function (d) {
          return [me.name, me.clientId, c.ky.label, rec.approvedAt, tg,
                  d.muc, d.gt.toFixed(2), Math.round(d.gt * tg), d.ghi];
        }));
    });
  }
});

/* ---- danh sách các kỳ đã chốt, để nhảy nhanh ---- */
function veCacKy(c) {
  var t = c.t;
  return HM.the({
    h2: HM.esc(t('cacKy')),
    p: c.lang === 'vi'
      ? 'Mỗi kỳ một bảng kê. Kỳ chưa chốt sổ không có trong danh sách này.'
      : 'One statement per period. Unclosed periods are not listed.',
    than: '<div class="btnrow">' + c.kys.slice().reverse().map(function (p) {
      return '<button type="button" class="pill' + (p.k === c.kyKey ? ' on' : '') + '" data-kyto="' + HM.esc(p.k) + '">' +
        HM.esc(p.label) + '</button>';
    }).join('') + '</div>'
  });
}

})();
