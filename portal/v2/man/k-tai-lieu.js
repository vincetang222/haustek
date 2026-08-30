/* =====================================================================
   CỔNG KHÁCH · TÀI LIỆU
   ---------------------------------------------------------------------
   Hai thứ khách hay đi tìm và thường không tìm thấy ở đâu cả:
     · bảng kê của các kỳ cũ, tải về được, không phải chụp màn hình;
     · câu trả lời cho những câu họ ngại hỏi — "vì sao kỳ này ít hơn",
       "sao tôi thấy triệu lượt mà tiền có bấy nhiêu", "bao giờ có tác
       quyền".

   Ảnh mẫu khách gửi có một màn Documents trống trơn với đúng một dòng
   "no documents". Màn trống là chuyện bình thường; màn trống mà không
   nói gì thì mới là lỗi.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'bangke';

HT.dangKy({
  id: 'k-tai-lieu', nav: 'navTl', icon: 'file',

  chu: {
    vi: {
      navTl: 'Tài liệu', h1: 'Tài liệu',
      mo: 'Bảng kê các kỳ, và giải thích cách con số được tính ra.',
      tBk: 'Bảng kê các kỳ', tHd: 'Hợp đồng & chứng từ', tCh: 'Câu hỏi thường gặp',
      cKy: 'Kỳ', cChot: 'Chốt sổ', cVe: 'Về tay bạn', cChi: 'Đã chi', cTai: '',
      xem: 'Mở', tai: 'Tải CSV', taiHet: 'Tải cả năm (CSV)',
      chuaCo: 'Chưa có kỳ nào được chốt sổ',
      chuaCoMo: 'Bảng kê xuất hiện ở đây ngay khi một kỳ được chốt. Kỳ chỉ chốt sau khi đối chiếu xong với tất cả các nền tảng.',
      choKy: 'Đang chờ chốt sổ', choKyMo: 'Những kỳ này đã có dữ liệu về nhưng chưa đối chiếu xong, nên chưa mở.',
      hdTrong: 'Chưa có chứng từ nào ở đây',
      hdTrongMo: 'Hợp đồng, phụ lục và chứng từ chuyển tiền chưa được đưa lên cổng. Hiện chúng vẫn gửi qua email. Nếu bạn cần một bản, gửi mã khách hàng của bạn về ops@haustek-group.com.',
      hoi1: 'Vì sao kỳ này tôi được ít hơn kỳ trước?',
      dap1: 'Ba lý do hay gặp nhất, theo thứ tự. Một: bài mới hết đà — doanh thu một bài thường cao nhất 1–2 kỳ đầu rồi giảm dần. Hai: kỳ này có nền tảng báo cáo trễ, phần đó sẽ về ở kỳ sau chứ không mất. Ba: bạn đang trong giai đoạn trừ tạm ứng, nên phần kiếm được vẫn có nhưng phần chuyển đi thì chưa.',
      hoi2: 'Tôi thấy hàng triệu lượt nghe, sao tiền chỉ có vậy?',
      dap2: 'Mỗi lượt nghe trả rất ít, và mức trả khác nhau nhiều giữa các nền tảng và các nước. Một lượt nghe ở Mỹ trả gấp nhiều lần một lượt ở Việt Nam. Mở một bài ra, phần "nghe từ nước nào" cho thấy chênh lệch đó bằng con số thật của chính bài đó.',
      hoi3: 'Bao giờ tôi thấy tiền tác quyền?',
      dap3: 'Tác quyền chốt theo quý, không phải hằng tháng, và các tổ chức quản lý thường báo cáo trễ một tới hai quý. Nên kỳ nào trống ở tab Tác quyền là bình thường — nó không có nghĩa là bài của bạn không phát sinh. Kỳ nào có báo cáo thì cổng ghi rõ.',
      hoi4: 'Vì sao có kỳ tôi không nhận được chuyển khoản?',
      dap4: 'Hai khả năng. Hoặc số của kỳ đó dưới ngưỡng chi trả tối thiểu, và nó được cộng dồn sang kỳ sau — không mất. Hoặc bạn đang trừ tạm ứng. Trang Tạm ứng nói rõ bạn ở trường hợp nào.',
      hoi5: 'Số trong bảng kê là số tôi nhận vào tài khoản?',
      dap5: 'Chưa. Đó là số trước thuế và trước phí chuyển khoản. Phần chênh ghi trên chứng từ chuyển tiền của từng lần chi.',
      hoi6: 'Tôi thấy một bài không phải của tôi, hoặc thiếu một bài của tôi?',
      dap6: 'Gửi mã ISRC của bài đó cùng mã khách hàng của bạn về ops@haustek-group.com. Đây là lỗi khớp danh mục, và sửa được — nhưng phải có mã ISRC, vì tên bài trùng nhau rất nhiều.',
      hoi7: 'Vì sao kỳ gần nhất chưa mở?',
      dap7: 'Một kỳ chỉ mở khi cả ba nguồn dữ liệu doanh thu đã về đủ và tổng hệ thống khớp tổng trên file gốc tới từng xu. Mở sớm một kỳ còn thiếu một nguồn là đưa cho bạn một con số thiếu mà trông vẫn như số đủ.',
      lienHe: 'Cần hỗ trợ',
      lienHeMo: 'Khi viết thư, kèm ba thứ này thì tra ra được đúng dòng trong vài phút: mã khách hàng của bạn, kỳ báo cáo, và mã ISRC của bài đang thắc mắc.'
    },
    en: {
      navTl: 'Documents', h1: 'Documents',
      mo: 'Statements by period, and how the figures are worked out.',
      tBk: 'Period statements', tHd: 'Contracts & vouchers', tCh: 'Common questions',
      cKy: 'Period', cChot: 'Closed', cVe: 'Yours', cChi: 'Paid', cTai: '',
      xem: 'Open', tai: 'Download CSV', taiHet: 'Download all (CSV)',
      chuaCo: 'No period is closed yet',
      chuaCoMo: 'A statement appears here as soon as a period closes. A period closes only after reconciliation with every platform.',
      choKy: 'Waiting to close', choKyMo: 'Data has arrived for these periods but reconciliation is not finished, so they are not open.',
      hdTrong: 'No vouchers here yet',
      hdTrongMo: 'Contracts, annexes and transfer vouchers are not on the portal yet; they still go by email. If you need a copy, send your client ID to ops@haustek-group.com.',
      hoi1: 'Why is this period lower than the last?',
      dap1: 'Three usual reasons, in order. One: a release losing momentum — a track usually peaks in its first one or two periods then tapers. Two: a platform reported late; that money arrives next period rather than being lost. Three: you are in the advance-recoupment phase, so you are still earning but nothing is transferred yet.',
      hoi2: 'I see millions of streams — why so little money?',
      dap2: 'A stream pays very little, and the rate varies widely by platform and by country. One stream in the US pays many times one in Vietnam. Open a track: the “from where” breakdown shows that gap in that track’s own real figures.',
      hoi3: 'When do I see publishing money?',
      dap3: 'Publishing settles quarterly, not monthly, and collecting societies usually report one to two quarters late. An empty publishing tab for a period is normal — it does not mean your tracks earned nothing. When a report exists, the portal says so.',
      hoi4: 'Why did I get no transfer some periods?',
      dap4: 'Two possibilities. Either the amount was below the minimum payout threshold and carried forward — nothing is lost. Or you are recouping an advance. The Advance page tells you which.',
      hoi5: 'Is the statement figure what lands in my account?',
      dap5: 'Not quite. It is before tax and before transfer fees. The difference is itemised on each transfer voucher.',
      hoi6: 'I see a track that is not mine, or one of mine is missing?',
      dap6: 'Send that track’s ISRC with your client ID to ops@haustek-group.com. This is a catalogue matching error and it is fixable — but the ISRC is essential, because titles repeat constantly.',
      hoi7: 'Why is the most recent period not open?',
      dap7: 'A period opens only when all three revenue sources have arrived and the system total matches the source files to the cent. Opening a period that is missing a source hands you an incomplete figure that looks complete.',
      lienHe: 'Need help',
      lienHeMo: 'Include these three and the exact row is found in minutes: your client ID, the reporting period, and the ISRC of the track in question.'
    }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t;

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [
        { l: t('tBk'), v: HT.fmt.n(c.kys.length) },
        { l: c.lang === 'vi' ? 'Mã khách hàng' : 'Client ID', v: me.clientId }
      ]
    });

    html += HM.tabs([
      { k: 'bangke', l: t('tBk'), icon: 'file', dem: c.kys.length },
      { k: 'hopdong', l: t('tHd'), icon: 'book' },
      { k: 'cauhoi', l: t('tCh'), icon: 'ask' }
    ], TAB);

    if (TAB === 'bangke') html += veBangKe(c);
    if (TAB === 'hopdong') html += veHopDong(c);
    if (TAB === 'cauhoi') html += veCauHoi(c);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-mo]', function (el) { c.doiKy(el.getAttribute('data-mo')); c.di('k-bang-ke'); });
    HM.bam(root, '[data-tai]', function (el) { taiMotKy(c, el.getAttribute('data-tai')); });
    HM.bam(root, '[data-taihet]', function () { taiTatCa(c); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
  }
});

/* =====================================================================
   TAB 1 — BẢNG KÊ CÁC KỲ
   ===================================================================== */
function veBangKe(c) {
  var api = c.api, me = c.phien.me, t = c.t;

  if (!c.kys.length) {
    return HM.the({ than: HM.trong({ icon: 'file', tieuDe: t('chuaCo'), moTa: t('chuaCoMo') }) }) + veCho(c);
  }

  var ds = c.kys.map(function (p) {
    var o = { k: p.k, label: p.label, tong: null, chi: null, chot: null };
    try {
      var s = api.summary(me.role, me.partyId, p.k, 'rec');
      o.tong = s.total; o.chot = s.approvedAt;
      o.chi = s.payout ? s.payout.payable : null;
      if (me.hasPublishing) {
        try { var q = api.summary(me.role, me.partyId, p.k, 'pub'); o.tong += q.total; } catch (e) {}
      }
    } catch (e) {}
    return o;
  }).reverse();

  return HM.the({
    h2: HM.esc(t('tBk')),
    p: c.lang === 'vi'
      ? 'Mỗi kỳ đã chốt sổ có một bảng kê. Con số trong đó là con số đã dùng để chuyển tiền, không tính lại theo tỷ giá hôm nay.'
      : 'Every closed period has a statement. Its figures are the ones money moved on, not recomputed at today’s rate.',
    hanhDong: '<button type="button" class="btn sm pri" data-taihet>' + HM.icon('down2') + HM.esc(t('taiHet')) + '</button>',
    thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('cKy')) + '</th>' +
      '<th>' + HM.esc(t('cChot')) + '</th>' +
      '<th class="num">' + HM.esc(t('cVe')) + '</th>' +
      '<th class="num">' + HM.esc(t('cChi')) + '</th>' +
      '<th style="width:180px"></th></tr></thead><tbody>' +
      ds.map(function (r) {
        return '<tr' + (r.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '>' +
          '<td><div class="t-ttl">' + HM.esc(r.label) + '</div></td>' +
          '<td class="mono muted">' + HM.esc(HT.fmt.ngay(r.chot)) + '</td>' +
          '<td class="num">' + (r.tong != null ? HM.esc(HT.fmt.usd(r.tong)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (r.chi != null && r.chi > 0
            ? HM.esc(HT.fmt.usd(r.chi))
            : '<span class="muted">' + HM.esc(c.lang === 'vi' ? 'dồn tiếp' : 'carried') + '</span>') + '</td>' +
          '<td><div class="btnrow">' +
            '<button type="button" class="btn sm" data-mo="' + HM.esc(r.k) + '">' + HM.esc(t('xem')) + '</button>' +
            '<button type="button" class="btn sm ghost" data-tai="' + HM.esc(r.k) + '">' + HM.icon('down2') + '</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
  }) + veCho(c);
}

function veCho(c) {
  var cho = c.phien.cho || [];
  if (!cho.length) return '';
  return HM.the({
    dai: { kieu: 'info', icon: 'clock', chu: HM.esc(c.t('choKy')) },
    h2: HM.esc(c.t('choKy')),
    p: HM.esc(c.t('choKyMo')),
    than: '<div class="btnrow">' + cho.map(function (p) {
      return '<span class="chip q">' + HM.esc(p.label) + '</span>';
    }).join('') + '</div>' +
      '<p class="hint" style="margin-top:12px">' + HM.esc(c.lang === 'vi'
        ? 'Một kỳ chỉ mở khi cả ba nguồn dữ liệu doanh thu đã về đủ và tổng hệ thống khớp tổng trên file gốc tới từng xu.'
        : 'A period opens only when all three revenue sources have arrived and the system total matches the source files to the cent.') + '</p>'
  });
}

/* =====================================================================
   TAB 2 — HỢP ĐỒNG & CHỨNG TỪ  (ô trống có nói lý do)
   ===================================================================== */
function veHopDong(c) {
  var t = c.t, me = c.phien.me;
  return HM.the({
    than: HM.trong({ icon: 'book', tieuDe: t('hdTrong'), moTa: t('hdTrongMo') })
  }) +
  HM.the({
    h2: c.lang === 'vi' ? 'Những gì sẽ có ở đây' : 'What will live here',
    p: c.lang === 'vi'
      ? 'Danh sách này viết ra để bạn biết cổng còn thiếu gì, chứ không phải để hứa.'
      : 'This list is here so you know what the portal is still missing — not as a promise.',
    than: [
      [c.lang === 'vi' ? 'Hợp đồng phân phối và các phụ lục' : 'The distribution agreement and its annexes',
       c.lang === 'vi' ? 'Kèm ngày ký, để đối chiếu với tỷ lệ chia đang áp cho từng kỳ.'
                       : 'With signature dates, to check against the split rate applied in each period.'],
      [c.lang === 'vi' ? 'Chứng từ mỗi lần chuyển tiền' : 'A voucher for each transfer',
       c.lang === 'vi' ? 'Số tiền trước thuế, phần khấu trừ, phí chuyển khoản, và số thực nhận.'
                       : 'Amount before tax, withholding, transfer fee, and what actually landed.'],
      [c.lang === 'vi' ? 'Chứng từ khấu trừ thuế' : 'Tax withholding certificates',
       c.lang === 'vi' ? 'Thứ bạn cần khi quyết toán thuế thu nhập cá nhân.'
                       : 'What you need when filing personal income tax.'],
      [c.lang === 'vi' ? 'Giấy xác nhận khoản tạm ứng' : 'Advance acknowledgements',
       c.lang === 'vi' ? 'Số đã ứng, ngày ứng, và tiến độ trừ.' : 'Amount advanced, date, and recoupment progress.']
    ].map(function (x) {
      return '<div class="stat" style="align-items:flex-start"><b style="max-width:none">' + HM.esc(x[0]) +
        '<p>' + HM.esc(x[1]) + '</p></b>' +
        '<span class="v"><span class="tag warn">' + HM.esc(c.lang === 'vi' ? 'chưa có' : 'not yet') + '</span></span></div>';
    }).join(''),
    chan: HM.esc(c.lang === 'vi'
      ? 'Cần một bản ngay bây giờ: gửi mã khách hàng ' + me.clientId + ' về ops@haustek-group.com.'
      : 'Need a copy now: send client ID ' + me.clientId + ' to ops@haustek-group.com.')
  });
}

/* =====================================================================
   TAB 3 — CÂU HỎI THƯỜNG GẶP
   ===================================================================== */
function veCauHoi(c) {
  var t = c.t, me = c.phien.me;
  var hoi = [];
  for (var i = 1; i <= 7; i++) hoi.push([t('hoi' + i), t('dap' + i)]);

  return hoi.map(function (h, i) {
    return HM.the({
      h2: (i + 1) + '. ' + HM.esc(h[0]),
      than: '<p class="say">' + HM.esc(h[1]) + '</p>' +
        (i === 1 ? '<div class="btnrow" style="margin-top:12px">' +
          '<button type="button" class="btn sm" data-di="k-ban-ghi">' +
          HM.esc(c.lang === 'vi' ? 'Mở một bài xem chi tiết' : 'Open a track') + '</button></div>' : '') +
        (i === 3 ? '<div class="btnrow" style="margin-top:12px">' +
          '<button type="button" class="btn sm" data-di="k-tam-ung">' +
          HM.esc(c.lang === 'vi' ? 'Xem trang tạm ứng' : 'Open the advance page') + '</button></div>' : '')
    });
  }).join('') +
  HM.the({
    dai: { kieu: 'info', icon: 'info', chu: HM.esc(t('lienHe')) },
    h2: HM.esc(t('lienHe')),
    than: '<p class="say">' + HM.esc(t('lienHeMo')) + '</p>' +
      HM.kv([
        { t: c.lang === 'vi' ? 'Mã khách hàng của bạn' : 'Your client ID', v: me.clientId, manh: true },
        { t: c.lang === 'vi' ? 'Kỳ đang xem' : 'Period in view', v: c.ky ? c.ky.label : '—' },
        { t: 'Email', v: 'ops@haustek-group.com' }
      ])
  });
}

/* =====================================================================
   TẢI VỀ
   ===================================================================== */
function taiMotKy(c, pk) {
  var api = c.api, me = c.phien.me;
  var p = c.kys.filter(function (x) { return x.k === pk; })[0];
  try {
    var s = api.summary(me.role, me.partyId, pk, 'rec');
    var d = s.chain.map(function (b) {
      return [me.clientId, me.name, p.label, s.approvedAt, s.fx.rate,
              'Doanh thu bản ghi', b.label, b.value.toFixed(2), Math.round(b.value * s.fx.rate), b.note || ''];
    });
    if (me.hasPublishing) {
      try {
        var q = api.summary(me.role, me.partyId, pk, 'pub');
        q.chain.forEach(function (b) {
          d.push([me.clientId, me.name, p.label, q.approvedAt, q.fx.rate,
                  'Tác quyền', b.label, b.value.toFixed(2), Math.round(b.value * q.fx.rate), b.note || '']);
        });
      } catch (e) {}
    }
    if (s.payout) {
      d.push([me.clientId, me.name, p.label, s.approvedAt, s.fx.rate, 'Chi trả', 'Dồn từ kỳ trước',
              s.payout.carryIn.toFixed(2), Math.round(s.payout.carryIn * s.fx.rate), '']);
      d.push([me.clientId, me.name, p.label, s.approvedAt, s.fx.rate, 'Chi trả', 'Số thực chi',
              s.payout.payable.toFixed(2), Math.round(s.payout.payable * s.fx.rate), s.payout.note || '']);
      d.push([me.clientId, me.name, p.label, s.approvedAt, s.fx.rate, 'Chi trả', 'Dồn sang kỳ sau',
              s.payout.carryOut.toFixed(2), Math.round(s.payout.carryOut * s.fx.rate), '']);
    }
    HM.csv('bang-ke-' + me.clientId + '-' + pk + '.csv',
      ['Mã khách hàng', 'Bên nhận', 'Kỳ', 'Chốt sổ', 'Tỷ giá', 'Dòng tiền', 'Khoản mục', 'Số tiền USD', 'Quy đổi VND', 'Ghi chú'], d);
  } catch (e) { c.thongBao(e.message, 'no'); }
}

function taiTatCa(c) {
  var api = c.api, me = c.phien.me;
  var d = [];
  c.kys.forEach(function (p) {
    try {
      var s = api.summary(me.role, me.partyId, p.k, 'rec');
      var pub = 0;
      if (me.hasPublishing) { try { pub = api.summary(me.role, me.partyId, p.k, 'pub').total; } catch (e) {} }
      d.push([me.clientId, me.name, p.label, s.approvedAt, s.fx.rate,
              s.gross.toFixed(2), s.total.toFixed(2), pub.toFixed(2),
              (s.total + pub).toFixed(2),
              s.payout ? s.payout.carryIn.toFixed(2) : '',
              s.advance ? s.advance.recoupedThisPeriod.toFixed(2) : '',
              s.payout ? s.payout.payable.toFixed(2) : '',
              s.payout ? s.payout.carryOut.toFixed(2) : '',
              s.streams == null ? '' : s.streams, s.tracks]);
    } catch (e) {}
  });
  HM.csv('bang-ke-tat-ca-ky-' + me.clientId + '.csv',
    ['Mã khách hàng', 'Bên nhận', 'Kỳ', 'Chốt sổ', 'Tỷ giá', 'Doanh thu gộp bản ghi',
     'Về tay bạn (bản ghi)', 'Tác quyền', 'Cộng phát sinh', 'Dồn từ kỳ trước',
     'Trừ tạm ứng', 'Số thực chi', 'Dồn sang kỳ sau', 'Lượt nghe', 'Số bài'], d);
}

})();
