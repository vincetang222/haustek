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
  id: 'k-tai-lieu', nav: 'navTl', nhom: 'nhomHoTro', icon: 'file',

  chu: {
    vi: {
      navTl: 'Tài liệu', h1: 'Tài liệu',
      mo: 'Bảng kê thanh toán các kỳ, và cách tính từng con số.',
      tBk: 'Bảng kê thanh toán các kỳ', tHd: 'Hợp đồng & chứng từ', tCh: 'Câu hỏi thường gặp',
      cKy: 'Kỳ', cChot: 'Chốt sổ', cVe: 'Thu nhập của bạn', cChi: 'Đã thanh toán', cTai: '',
      xem: 'Mở bảng kê', tai: 'Tải CSV', taiHet: 'Tải tất cả các kỳ (CSV)',
      chuaCo: 'Chưa có kỳ nào chốt sổ',
      chuaCoMo: 'Bảng kê sẽ xuất hiện ở đây ngay khi một kỳ chốt sổ. Một kỳ chỉ chốt sổ sau khi Haustek đối soát xong với tất cả các nền tảng.',
      choKy: 'Đang chờ chốt sổ', choKyMo: 'Các kỳ này đã nhận được báo cáo nhưng chưa đối soát xong, nên chưa chốt sổ.',
      hdTrong: 'Chưa có chứng từ nào ở đây',
      hdTrongMo: 'Hợp đồng, phụ lục và chứng từ chuyển tiền chưa được đưa lên cổng, hiện vẫn được gửi qua email. Nếu cần bản nào, bạn vui lòng gửi mã đối tác về ops@haustek-group.com.',
      hoi1: 'Vì sao thu nhập kỳ này của tôi thấp hơn kỳ trước?',
      dap1: 'Có ba lý do thường gặp nhất, theo thứ tự. Một: bài hát mới đã qua giai đoạn cao điểm, doanh thu một bài hát thường cao nhất trong 1–2 kỳ đầu rồi giảm dần. Hai: có nền tảng báo cáo trễ, phần đó được ghi nhận ở kỳ sau chứ không mất. Ba: bạn đang trong giai đoạn khấu trừ tạm ứng, nên vẫn có thu nhập nhưng chưa có khoản thanh toán.',
      hoi2: 'Bài hát của tôi có hàng triệu lượt nghe, vì sao doanh thu lại thấp?',
      dap2: 'Mỗi lượt nghe được trả rất ít, và mức trả chênh lệch nhiều giữa các nền tảng và các thị trường. Một lượt nghe ở Mỹ được trả gấp nhiều lần một lượt nghe ở Việt Nam. Khi mở một bài hát, phần "Thu nhập theo thị trường" cho thấy chênh lệch đó bằng số liệu thực tế của chính bài hát đó.',
      hoi3: 'Khi nào tôi nhận được tiền tác quyền?',
      dap3: 'Tác quyền được chốt theo quý, không theo tháng, và các tổ chức quản lý tác quyền thường báo cáo trễ một đến hai quý. Vì vậy tab Tác quyền trống ở nhiều kỳ là bình thường, không có nghĩa là bài hát của bạn không có doanh thu. Kỳ nào có báo cáo, cổng đều ghi rõ.',
      hoi4: 'Vì sao có kỳ tôi không nhận được thanh toán?',
      dap4: 'Có hai khả năng. Một là thu nhập kỳ đó dưới ngưỡng thanh toán tối thiểu nên được chuyển sang kỳ sau, không mất. Hai là bạn đang trong giai đoạn khấu trừ tạm ứng. Trang Tạm ứng cho biết bạn thuộc trường hợp nào.',
      hoi5: 'Số trên bảng kê có phải là số tôi thực nhận vào tài khoản không?',
      dap5: 'Không hoàn toàn. Đó là số trước thuế và trước phí chuyển khoản. Phần chênh lệch được ghi trên chứng từ của từng lần chuyển tiền.',
      hoi6: 'Danh sách có bài hát không phải của tôi, hoặc thiếu bài hát của tôi thì phải làm gì?',
      dap6: 'Bạn gửi mã ISRC của bài hát đó cùng mã đối tác của bạn về ops@haustek-group.com. Đây là lỗi khớp danh mục và có thể sửa được, nhưng bắt buộc phải có mã ISRC vì tên bài hát trùng nhau rất nhiều.',
      hoi7: 'Vì sao kỳ gần nhất vẫn chưa chốt sổ?',
      dap7: 'Một kỳ chỉ chốt sổ khi đã nhận đủ ba nguồn báo cáo doanh thu và tổng trên hệ thống khớp với tổng trên file gốc đến từng xu. Chốt sổ sớm khi còn thiếu một nguồn sẽ đưa cho bạn một con số thiếu nhưng trông vẫn như đầy đủ.',
      lienHe: 'Liên hệ hỗ trợ',
      lienHeMo: 'Khi gửi email, bạn kèm đủ ba thông tin sau để Haustek tra đúng dòng trong vài phút: mã đối tác, kỳ báo cáo và mã ISRC của bài hát cần kiểm tra.'
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
        { l: c.lang === 'vi' ? 'Mã đối tác' : 'Client ID', v: me.clientId }
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

  var pdfCua = {};
  try { (api.statements(me.role, me.partyId).rows || []).forEach(function (r) { if (r.pdf) pdfCua[r.k] = r.pdf; }); } catch (e) { pdfCua = {}; }
  var ds = c.kys.map(function (p) {
    var o = { k: p.k, label: p.label, tong: null, chi: null, chot: null, pdf: pdfCua[p.k] || null };
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
      ? 'Mỗi kỳ đã chốt sổ có một bảng kê. Số liệu trong đó là số đã dùng để thanh toán, không tính lại theo tỷ giá hôm nay.'
      : 'Every closed period has a statement. Its figures are the ones money moved on, not recomputed at today’s rate.',
    hanhDong: '<button type="button" class="btn sm pri" data-taihet>' + HM.icon('down2') + HM.esc(t('taiHet')) + '</button>',
    thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('cKy')) + '</th>' +
      '<th>' + HM.esc(t('cChot')) + '</th>' +
      '<th class="num">' + HM.esc(t('cVe')) + '</th>' +
      '<th class="num">' + HM.esc(t('cChi')) + '</th>' +
      '<th>' + HM.esc(c.lang === 'vi' ? 'Bảng kê PDF' : 'PDF statement') + '</th>' +
      '<th style="width:180px">' + HM.esc(c.lang === 'vi' ? 'Thao tác' : 'Actions') + '</th></tr></thead><tbody>' +
      ds.map(function (r) {
        return '<tr' + (r.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '>' +
          '<td><div class="t-ttl">' + HM.esc(r.label) + '</div></td>' +
          '<td class="mono muted">' + HM.esc(HT.fmt.ngay(r.chot)) + '</td>' +
          '<td class="num">' + (r.tong != null ? HM.esc(HT.fmt.usd(r.tong)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (r.chi != null && r.chi > 0
            ? HM.esc(HT.fmt.usd(r.chi))
            : '<span class="muted">' + HM.esc(c.lang === 'vi' ? 'chuyển sang kỳ sau' : 'carried') + '</span>') + '</td>' +
          '<td>' + (r.pdf ? '<span class="tag ok">' + HM.icon('file') + HM.esc(HM.dai(r.pdf.file, 28)) + '</span>'
                          : '<span class="muted">' + HM.esc(c.lang === 'vi' ? 'Haustek chưa gửi' : 'not sent yet') + '</span>') + '</td>' +
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
        ? 'Một kỳ chỉ chốt sổ khi đã nhận đủ ba nguồn báo cáo doanh thu và tổng trên hệ thống khớp với tổng trên file gốc đến từng xu.'
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
    h2: c.lang === 'vi' ? 'Các tài liệu sẽ có ở đây' : 'What will live here',
    p: c.lang === 'vi'
      ? 'Danh sách này để bạn biết cổng còn thiếu tài liệu nào, không phải là cam kết.'
      : 'This list is here so you know what the portal is still missing — not as a promise.',
    than: [
      [c.lang === 'vi' ? 'Hợp đồng phân phối và các phụ lục' : 'The distribution agreement and its annexes',
       c.lang === 'vi' ? 'Kèm ngày ký, để đối chiếu với tỷ lệ chia đang áp dụng cho từng kỳ.'
                       : 'With signature dates, to check against the split rate applied in each period.'],
      [c.lang === 'vi' ? 'Chứng từ mỗi lần chuyển tiền' : 'A voucher for each transfer',
       c.lang === 'vi' ? 'Số tiền trước thuế, phần khấu trừ, phí chuyển khoản, và số thực nhận.'
                       : 'Amount before tax, withholding, transfer fee, and what actually landed.'],
      [c.lang === 'vi' ? 'Chứng từ khấu trừ thuế' : 'Tax withholding certificates',
       c.lang === 'vi' ? 'Cần khi bạn quyết toán thuế thu nhập cá nhân.'
                       : 'What you need when filing personal income tax.'],
      [c.lang === 'vi' ? 'Giấy xác nhận khoản tạm ứng' : 'Advance acknowledgements',
       c.lang === 'vi' ? 'Số đã tạm ứng, ngày tạm ứng và tiến độ khấu trừ.' : 'Amount advanced, date, and recoupment progress.']
    ].map(function (x) {
      return '<div class="stat" style="align-items:flex-start"><b style="max-width:none">' + HM.esc(x[0]) +
        '<p>' + HM.esc(x[1]) + '</p></b>' +
        '<span class="v"><span class="tag warn">' + HM.esc(c.lang === 'vi' ? 'chưa có' : 'not yet') + '</span></span></div>';
    }).join(''),
    chan: HM.esc(c.lang === 'vi'
      ? 'Nếu cần bản nào ngay, bạn gửi mã đối tác ' + me.clientId + ' về ops@haustek-group.com.'
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
          HM.esc(c.lang === 'vi' ? 'Mở một bài hát để xem chi tiết' : 'Open a track') + '</button></div>' : '') +
        (i === 3 ? '<div class="btnrow" style="margin-top:12px">' +
          '<button type="button" class="btn sm" data-di="k-tam-ung">' +
          HM.esc(c.lang === 'vi' ? 'Mở trang Tạm ứng' : 'Open the advance page') + '</button></div>' : '')
    });
  }).join('') +
  HM.the({
    dai: { kieu: 'info', icon: 'info', chu: HM.esc(t('lienHe')) },
    h2: HM.esc(t('lienHe')),
    than: '<p class="say">' + HM.esc(t('lienHeMo')) + '</p>' +
      HM.kv([
        { t: c.lang === 'vi' ? 'Mã đối tác của bạn' : 'Your client ID', v: me.clientId, manh: true },
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
      d.push([me.clientId, me.name, p.label, s.approvedAt, s.fx.rate, 'Thanh toán', 'Chuyển từ kỳ trước',
              s.payout.carryIn.toFixed(2), Math.round(s.payout.carryIn * s.fx.rate), '']);
      d.push([me.clientId, me.name, p.label, s.approvedAt, s.fx.rate, 'Thanh toán', 'Số thực thanh toán',
              s.payout.payable.toFixed(2), Math.round(s.payout.payable * s.fx.rate), s.payout.note || '']);
      d.push([me.clientId, me.name, p.label, s.approvedAt, s.fx.rate, 'Thanh toán', 'Chuyển sang kỳ sau',
              s.payout.carryOut.toFixed(2), Math.round(s.payout.carryOut * s.fx.rate), '']);
    }
    HM.csv('bang-ke-' + me.clientId + '-' + pk + '.csv',
      ['Mã đối tác', 'Bên thụ hưởng', 'Kỳ', 'Chốt sổ', 'Tỷ giá', 'Dòng tiền', 'Khoản mục', 'Số tiền USD', 'Quy đổi VND', 'Ghi chú'], d);
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
    ['Mã đối tác', 'Bên thụ hưởng', 'Kỳ', 'Chốt sổ', 'Tỷ giá', 'Doanh thu gộp bản ghi',
     'Thu nhập của bạn (bản ghi)', 'Tác quyền', 'Cộng phát sinh', 'Chuyển từ kỳ trước',
     'Khấu trừ tạm ứng', 'Số thực thanh toán', 'Chuyển sang kỳ sau', 'Lượt nghe', 'Số bài hát'], d);
}

})();
