/* =====================================================================
   NỘI BỘ · KẾ TOÁN
   ---------------------------------------------------------------------
   Màn hình vận hành trả lời "tiền về bao nhiêu". Màn hình này trả lời
   một câu khác hẳn, và là câu kế toán phải trả lời được trước kiểm toán
   viên: MỖI ĐỒNG ĐANG NẰM Ở ĐÂU, và ai đang nợ ai.

   Bốn khối:
     · Bút toán kỳ — doanh thu về được ghi nhận thành những khoản gì.
       Nợ phải bằng Có, tới từng xu. Không bằng thì có lỗi ở tầng dưới,
       và màn này nói ra thay vì làm tròn cho đẹp.
     · Công nợ bên nhận — số dư đầu kỳ, phát sinh, thu hồi, đã chi, số
       dư cuối kỳ. Đây là bảng đối chiếu với sao kê ngân hàng.
     · Tạm ứng — khoản phải thu, và tuổi nợ của nó.
     · Thuế & khấu trừ — phần bản mẫu CHƯA mô hình hoá. Nói rõ ra còn
       hơn để trống rồi có người tưởng hệ thống đã lo.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'butoan';
var LOC_CN = { loai: '', tim: '', chi: 'tatca' };
var SAU = [];   /* việc phải làm SAU khi HTML đã vào DOM */

/* Hệ thống tài khoản rút gọn theo Thông tư 200. Tên tài khoản viết đúng
   cách kế toán Việt Nam gọi, không dịch lại cho "dễ hiểu" — người đọc
   bảng này là kế toán, và họ tìm theo số hiệu. */
var TK = {
  '131': { ten: 'Phải thu của khách hàng (đối tác phân phối, nền tảng)', loai: 'ts' },
  '138': { ten: 'Phải thu khác (tạm ứng cho nghệ sĩ, label)', loai: 'ts' },
  '511': { ten: 'Doanh thu cung cấp dịch vụ (phí Haustek)', loai: 'dt' },
  '3311': { ten: 'Phải trả label', loai: 'no' },
  '3312': { ten: 'Phải trả nghệ sĩ', loai: 'no' },
  '3313': { ten: 'Phải trả producer (chưa rõ người nhận)', loai: 'no' },
  '3314': { ten: 'Phải trả tác giả (tác quyền)', loai: 'no' },
  '338': { ten: 'Phải trả khác (tiền chưa rõ chủ)', loai: 'no' }
};

HT.dangKy({
  id: 'ke-toan', nav: 'navKeToan', nhom: 'nhomTien', icon: 'book',

  chu: {
    vi: {
      nhomTien: 'Tiền', navKeToan: 'Kế toán', h1: 'Kế toán',
      mo: 'Doanh thu kỳ này ghi vào những khoản nào, ai đang nợ ai, và phần nào chưa rõ chủ.',
      tBut: 'Bút toán kỳ', tCn: 'Công nợ bên nhận', tUng: 'Tạm ứng phải thu',
      tGhi: 'Ghi nhận 12 kỳ', tThue: 'Thuế & khấu trừ',
      no: 'Nợ', co: 'Có', tk: 'TK', dienGiai: 'Diễn giải', soTien: 'Số tiền',
      canDoi: 'Nợ − Có', canBang: 'Cân', lech: 'Lệch',
      but1: 'Ghi nhận doanh thu bản ghi của kỳ',
      but2: 'Ghi nhận tác quyền theo quý',
      but3: 'Tiền về chưa rõ chủ',
      but4: 'Thu hồi tạm ứng từ khoản phải trả',
      but5: 'Chi trả cho bên nhận trong kỳ',
      chuaDuyet: 'Kỳ chưa duyệt. Bút toán bên dưới là số dự tính, chưa ghi sổ.',
      daDuyet: 'Kỳ đã duyệt. Bút toán đã ghi sổ.',
      tongNo: 'Tổng Nợ', tongCo: 'Tổng Có',
      duDau: 'Dư đầu kỳ', psTang: 'Phát sinh', thuHoi: 'Thu hồi tạm ứng',
      daChi: 'Đã chi', duCuoi: 'Dư cuối kỳ',
      benNhan: 'Bên nhận', loai: 'Loại', tim: 'Tìm tên hoặc mã bên nhận…',
      tatCa: 'Tất cả', coChi: 'Có chi kỳ này', duoiNguong: 'Dưới ngưỡng, dồn kỳ sau', dangTru: 'Đang trừ tạm ứng',
      xuat: 'Xuất CSV', tongCong: 'Tổng cộng',
      ungGoc: 'Đã ứng', ungDaThu: 'Đã thu hồi', ungConLai: 'Còn phải thu', ungKy: 'Còn mấy kỳ',
      giaiThichUng: 'Tạm ứng là khoản Haustek đã trả trước. Đây là tài sản (phải thu), không phải chi phí, và chỉ hết khi bên nhận có đủ doanh thu để trừ.',
      chuaLam: 'Bản mẫu chưa mô hình hoá',
      dtGop: 'Doanh thu gộp', dtPhi: 'Doanh thu phí Haustek', dtPhaiTra: 'Phải trả các bên',
      bienPhi: 'Phí trên doanh thu gộp'
    },
    en: {
      nhomTien: 'Money', navKeToan: 'Accounting', h1: 'Accounting',
      mo: 'What the period’s revenue was booked as, who owes whom, and which part has no owner yet.',
      tBut: 'Period journal', tCn: 'Payee ledger', tUng: 'Advances receivable',
      tGhi: '12-period recognition', tThue: 'Tax & withholding',
      no: 'Dr', co: 'Cr', tk: 'A/C', dienGiai: 'Narrative', soTien: 'Amount',
      canDoi: 'Dr − Cr', canBang: 'Balanced', lech: 'OUT',
      but1: 'Recognise recording revenue for the period',
      but2: 'Recognise quarterly publishing',
      but3: 'Cash received with no identified owner',
      but4: 'Recoup advances against payables',
      but5: 'Pay out to payees',
      chuaDuyet: 'Period not approved — the entries below are a PROJECTION, not posted.',
      daDuyet: 'Period approved — the entries below are posted.',
      tongNo: 'Total Dr', tongCo: 'Total Cr',
      duDau: 'Opening', psTang: 'Arising', thuHoi: 'Recouped',
      daChi: 'Paid', duCuoi: 'Closing',
      benNhan: 'Payee', loai: 'Kind', tim: 'Search payee name or code…',
      tatCa: 'All', coChi: 'Paid this period', duoiNguong: 'Below threshold', dangTru: 'Recouping',
      xuat: 'Export CSV', tongCong: 'Total',
      ungGoc: 'Advanced', ungDaThu: 'Recouped', ungConLai: 'Outstanding', ungKy: 'Periods left',
      giaiThichUng: 'An advance is money Haustek already paid. It is an asset (receivable), not a cost — and it only clears when the payee earns enough to offset it.',
      chuaLam: 'Not modelled in the prototype',
      dtGop: 'Gross revenue', dtPhi: 'Haustek fee revenue', dtPhaiTra: 'Payable to parties',
      bienPhi: 'Fee as share of gross'
    }
  },

  ve: function (root, c) {
    var t = c.t;
    var A = c.A, pi = c.ky.idx;
    var s = soLieu(A, pi, c.kyKey);

    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>',
      mo: HM.esc(t('mo')),
      so: [
        { l: t('dtGop'), v: c.tien(s.gross + s.pubGross) },
        { l: t('dtPhi'), v: c.tien(s.fee + s.pubFee) },
        { l: t('dtPhaiTra'), v: c.tien(s.labelCut + s.artist + s.producer + s.pubWriter) }
      ]
    });

    html += HM.tabs([
      { k: 'butoan', l: t('tBut'), icon: 'book' },
      { k: 'congno', l: t('tCn'), icon: 'cash' },
      { k: 'tamung', l: t('tUng'), icon: 'up' },
      { k: 'ghinhan', l: t('tGhi'), icon: 'chart' },
      { k: 'thue', l: t('tThue'), icon: 'file' }
    ], TAB);

    SAU = [];
    if (TAB === 'butoan') html += veButToan(c, s);
    if (TAB === 'congno') html += veCongNo(c, s);
    if (TAB === 'tamung') html += veTamUng(c);
    if (TAB === 'ghinhan') html += veGhiNhan(c);
    if (TAB === 'thue') html += veThue(c, s);

    root.innerHTML = html;
    SAU.forEach(function (f) { f(root); });
    SAU = [];
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-cn]', function (el) { LOC_CN.chi = el.getAttribute('data-cn'); c.veLai(); });
    HM.doi(root, '[data-cnloai]', function (el) { LOC_CN.loai = el.value; c.veLai(); });
    HM.nhap(root, '[data-cntim]', function (el) { LOC_CN.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-xuatbut]', function () { xuatButToan(c, s); });
    HM.bam(root, '[data-xuatcn]', function () { xuatCongNo(c, s); });
    HM.bam(root, '[data-benct]', function (el) { moChiTiet(c, el.getAttribute('data-benct'), s); });
  }
});

/* =====================================================================
   GOM SỐ LIỆU MỘT KỲ
   ===================================================================== */
function soLieu(A, pi, pk) {
  return HM.nho(A, 'ketoan:' + pi, function () {
    var rec = A.agg('admin', 0, pi, 'rec');
    var pub = A.agg('admin', 0, pi, 'pub');
    var pubFee = Math.round(pub.gross * A.cfg.PUB_FEE * 100) / 100;
    var duyet = A.isApproved(pk);
    var chi = duyet ? A.payoutOf(pk) : A.previewPayout(pi);
    var treo = A.queue.pendingTotal(pk);

    var tong = { earned: 0, carryIn: 0, recoup: 0, payable: 0, carryOut: 0, giu: 0 };
    chi.forEach(function (r) {
      if (r.held) { tong.giu += r.earned; return; }
      tong.earned += r.earned; tong.carryIn += r.carryIn;
      tong.recoup += r.recoup; tong.payable += r.payable; tong.carryOut += r.carryOut;
    });
    var lam = function (v) { return Math.round(v * 100) / 100; };
    Object.keys(tong).forEach(function (k) { tong[k] = lam(tong[k]); });

    return {
      pi: pi, pk: pk, duyet: duyet,
      gross: rec.gross, fee: rec.fee, labelCut: rec.labelCut,
      producer: rec.producer, artist: rec.artist,
      streams: rec.streams, tracks: rec.tracks,
      pubGross: pub.gross, pubFee: pubFee, pubWriter: lam(pub.gross - pubFee),
      pubCo: A.pubLoaded(pi),
      treo: treo, chi: chi, tong: tong
    };
  });
}

/* =====================================================================
   TAB 1 — BÚT TOÁN KỲ
   ===================================================================== */
function veButToan(c, s) {
  var A = c.A, t = c.t;

  function butToan(ten, giaiThich, dong) {
    var no = 0, co = 0;
    dong.forEach(function (d) { if (d.no) no += d.gt; else co += d.gt; });
    no = Math.round(no * 100) / 100; co = Math.round(co * 100) / 100;
    var lech = Math.round((no - co) * 100) / 100;
    return { ten: ten, giaiThich: giaiThich, dong: dong, no: no, co: co, lech: lech };
  }

  var bt = [];

  bt.push(butToan(t('but1'),
    c.lang === 'vi'
      ? 'Doanh thu từ ba nguồn dữ liệu, đã khớp tới từng bản ghi. Phí Haustek là doanh thu của công ty; ba khoản còn lại là nợ phải trả, chưa phải khoản đã chi.'
      : 'Revenue from the three feeds, matched to recordings. The Haustek fee is company revenue; the other three are liabilities, not costs already paid.',
    [
      { no: true, tk: '131', mo: c.lang === 'vi' ? 'Phải thu doanh thu kỳ ' + c.ky.label : 'Receivable, ' + c.ky.label, gt: s.gross },
      { no: false, tk: '511', mo: c.lang === 'vi' ? 'Phí Haustek ' + HT.fmt.pct(A.cfg.HAUSTEK_FEE) : 'Haustek fee ' + HT.fmt.pct(A.cfg.HAUSTEK_FEE), gt: s.fee },
      { no: false, tk: '3311', mo: c.lang === 'vi' ? 'Phần của label, cộng phần Haustek giữ thêm với nghệ sĩ độc lập' : 'Label share, plus extra Haustek share on independents', gt: s.labelCut },
      { no: false, tk: '3313', mo: c.lang === 'vi' ? 'Điểm producer, trừ vào phần nghệ sĩ' : 'Producer points — deducted from the artist share', gt: s.producer },
      { no: false, tk: '3312', mo: c.lang === 'vi' ? 'Phần nghệ sĩ, sau khi trừ điểm producer' : 'Artist share, after producer points', gt: s.artist }
    ]));

  if (s.pubCo && s.pubGross > 0.004) {
    bt.push(butToan(t('but2'),
      c.lang === 'vi'
        ? 'Tác quyền là dòng tiền tách rời, thuộc về tác giả. Không đi qua label, không nằm trong bút toán bên trên.'
        : 'Publishing is a separate stream and belongs to the writers. It never passes through a label, and is not part of the entry above.',
      [
        { no: true, tk: '131', mo: c.lang === 'vi' ? 'Tác quyền quý ' + A.periods[s.pi].quarter + '/' + A.periods[s.pi].year : 'Publishing Q' + A.periods[s.pi].quarter, gt: s.pubGross },
        { no: false, tk: '511', mo: c.lang === 'vi' ? 'Phí quản lý ' + HT.fmt.pct(A.cfg.PUB_FEE) : 'Admin fee ' + HT.fmt.pct(A.cfg.PUB_FEE), gt: s.pubFee },
        { no: false, tk: '3314', mo: c.lang === 'vi' ? 'Phần tác giả, chia theo bảng tỷ lệ sáng tác' : 'Writer share, per the split table', gt: s.pubWriter }
      ]));
  }

  if (s.treo > 0.004) {
    bt.push(butToan(t('but3'),
      c.lang === 'vi'
        ? 'Tiền đã về tài khoản nhưng chưa khớp được bản ghi nào. Ghi vào phải trả khác: đây không phải doanh thu của Haustek, dù đang nằm trong tài khoản Haustek.'
        : 'Cash has arrived but matches no recording. Booked to other payables — it is NOT Haustek revenue, even though it sits in Haustek’s account.',
      [
        { no: true, tk: '131', mo: c.lang === 'vi' ? 'Tiền về theo báo cáo, chưa khớp' : 'Cash from file, unmatched', gt: s.treo },
        { no: false, tk: '338', mo: c.lang === 'vi' ? A.queue.list({ periodKey: s.pk, status: 'pending' }).length + ' dòng đang treo ở hàng chờ khớp ISRC' : 'Rows held in the ISRC queue', gt: s.treo }
      ]));
  }

  if (s.tong.recoup > 0.004) {
    bt.push(butToan(t('but4'),
      c.lang === 'vi'
        ? 'Bên nhận có doanh thu nhưng còn nợ Haustek tạm ứng. Khoản phải trả giảm, khoản phải thu tạm ứng giảm theo. Không phát sinh chuyển tiền.'
        : 'A payee earned money but owes Haustek an advance. The payable falls and the advance receivable falls with it. No cash moves.',
      [
        { no: true, tk: '3312', mo: c.lang === 'vi' ? 'Giảm phải trả bên nhận' : 'Reduce payee payable', gt: s.tong.recoup },
        { no: false, tk: '138', mo: c.lang === 'vi' ? 'Thu hồi tạm ứng kỳ này' : 'Advance recouped this period', gt: s.tong.recoup }
      ]));
  }

  if (s.tong.payable > 0.004) {
    bt.push(butToan(t('but5'),
      c.lang === 'vi'
        ? 'Phần vượt ngưỡng ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) + ' được chi. Phần dưới ngưỡng (' + HT.fmt.usd(s.tong.carryOut) + ') không có bút toán: vẫn nằm nguyên ở tài khoản phải trả và dồn sang kỳ sau.'
        : 'Amounts above the ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) + ' threshold are paid. Amounts below — ' + HT.fmt.usd(s.tong.carryOut) + ' — have NO entry: they stay in payables and carry forward.',
      [
        { no: true, tk: '3311', mo: c.lang === 'vi' ? 'Chi trả label và nghệ sĩ kỳ ' + c.ky.label : 'Pay labels and artists, ' + c.ky.label, gt: s.tong.payable },
        { no: false, tk: '131', mo: c.lang === 'vi' ? 'Chuyển khoản đi (bản mẫu gộp một dòng; hệ thống thật đối chiếu với sao kê ngân hàng)' : 'Bank transfer out (one line here — the real system reconciles to the bank statement)', gt: s.tong.payable }
      ]));
  }

  var tongNo = 0, tongCo = 0;
  bt.forEach(function (b) { tongNo += b.no; tongCo += b.co; });
  tongNo = Math.round(tongNo * 100) / 100; tongCo = Math.round(tongCo * 100) / 100;
  var lechTong = Math.round((tongNo - tongCo) * 100) / 100;

  var html = HM.ghi({
    kieu: s.duyet ? 'ok' : 'warn',
    tieuDe: HM.esc(s.duyet ? t('daDuyet') : t('chuaDuyet')),
    than: HM.esc(s.duyet
      ? (c.lang === 'vi'
         ? 'Bảng chi trả kỳ này đã ghi sổ lúc ' + HT.fmt.luc(A.approvalOf(s.pk).at) + '. Số dưới đây là số đã dùng để chuyển tiền.'
         : 'The payout table was written at ' + HT.fmt.luc(A.approvalOf(s.pk).at) + '. The figures below are the ones money moved on.')
      : (c.lang === 'vi'
         ? 'Chưa duyệt kỳ thì chưa ghi bảng chi trả nào. Bút toán dưới đây tính từ dữ liệu hiện có và sẽ đổi nếu nhập thêm nguồn hay khớp thêm dòng.'
         : 'Until the period is approved no payout table exists. The entries below are recomputed from current data and will change if another feed is loaded or another row matched.')),
    nut: '<button type="button" class="btn sm" data-di="doi-chieu">' +
      HM.esc(c.lang === 'vi' ? 'Mở trang duyệt kỳ' : 'Open approval') + '</button>'
  });

  html += bt.map(function (b, i) {
    return HM.the({
      h2: (i + 1) + '. ' + HM.esc(b.ten),
      p: HM.esc(b.giaiThich),
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr>' +
        '<th style="width:74px">' + HM.esc(t('tk')) + '</th>' +
        '<th>' + HM.esc(t('dienGiai')) + '</th>' +
        '<th class="num" style="width:150px">' + HM.esc(t('no')) + '</th>' +
        '<th class="num" style="width:150px">' + HM.esc(t('co')) + '</th></tr></thead><tbody>' +
        b.dong.map(function (d) {
          return '<tr><td class="mono">' + HM.esc(d.tk) + '</td>' +
            '<td><div class="t-ttl">' + HM.esc(TK[d.tk].ten) + '</div>' +
            '<div class="t-sub" style="font-family:var(--f);font-size:12px">' + HM.esc(d.mo) + '</div></td>' +
            '<td class="num">' + (d.no ? HM.esc(c.tien2(d.gt)) : '<span class="nil">—</span>') + '</td>' +
            '<td class="num">' + (!d.no ? HM.esc(c.tien2(d.gt)) : '<span class="nil">—</span>') + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr>' +
        '<td colspan="2">' + HM.esc(t('canDoi')) + ' · ' +
        (Math.abs(b.lech) < 0.005 ? '<span class="pos">' + HM.esc(t('canBang')) + '</span>'
          : '<span class="neg">' + HM.esc(t('lech')) + ' ' + HM.esc(HT.fmt.usd(b.lech)) + '</span>') + '</td>' +
        '<td class="num">' + HM.esc(c.tien2(b.no)) + '</td>' +
        '<td class="num">' + HM.esc(c.tien2(b.co)) + '</td></tr></tfoot></table></div>'
    });
  }).join('');

  /* bảng cân đối tổng */
  html += HM.the({
    dai: Math.abs(lechTong) < 0.005
      ? { kieu: 'ok', icon: 'check', chu: HM.esc(c.lang === 'vi'
          ? 'Tổng Nợ bằng tổng Có tới từng xu: ' + c.tien2(tongNo)
          : 'Total debits equal total credits to the cent — ' + c.tien2(tongNo)) }
      : { kieu: 'no', icon: 'alert', chu: HM.esc(c.lang === 'vi'
          ? 'Lệch ' + HT.fmt.usd(lechTong) + '. Lỗi nằm ở tầng tính, không phải ở trang này'
          : 'OUT BY ' + HT.fmt.usd(lechTong) + ' — the fault is in the calculation layer, not this screen') },
    h2: c.lang === 'vi' ? 'Cân đối cả kỳ' : 'Period balance',
    hanhDong: '<button type="button" class="btn sm" data-xuatbut>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>',
    than: HM.so([
      { l: t('tongNo'), v: c.tien(tongNo) },
      { l: t('tongCo'), v: c.tien(tongCo) },
      { l: t('canDoi'), v: c.tien2(lechTong), mau: Math.abs(lechTong) < 0.005 ? HB.mau('ok') : HB.mau('danger') }
    ]) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Số dư theo tài khoản sau các bút toán trên' : 'Balances by account after the entries above') + '</h4>' +
    (function () {
      var duNo = {}, duCo = {};
      bt.forEach(function (b) {
        b.dong.forEach(function (d) {
          if (d.no) duNo[d.tk] = Math.round(((duNo[d.tk] || 0) + d.gt) * 100) / 100;
          else duCo[d.tk] = Math.round(((duCo[d.tk] || 0) + d.gt) * 100) / 100;
        });
      });
      var ma = Object.keys(TK).filter(function (k) { return duNo[k] || duCo[k]; });
      return '<div class="tw"><table class="t"><thead><tr>' +
        '<th style="width:74px">' + HM.esc(t('tk')) + '</th><th>' + (c.lang === 'vi' ? 'Tên tài khoản' : 'Account') + '</th>' +
        '<th class="num">' + HM.esc(t('no')) + '</th><th class="num">' + HM.esc(t('co')) + '</th>' +
        '<th class="num band">' + (c.lang === 'vi' ? 'Số dư' : 'Balance') + '</th></tr></thead><tbody>' +
        ma.map(function (k) {
          var du = Math.round(((duNo[k] || 0) - (duCo[k] || 0)) * 100) / 100;
          return '<tr><td class="mono">' + HM.esc(k) + '</td>' +
            '<td>' + HM.esc(TK[k].ten) + '</td>' +
            '<td class="num">' + (duNo[k] ? HM.esc(c.tien2(duNo[k])) : '<span class="nil">—</span>') + '</td>' +
            '<td class="num">' + (duCo[k] ? HM.esc(c.tien2(duCo[k])) : '<span class="nil">—</span>') + '</td>' +
            '<td class="num band">' + HM.esc(c.tien2(du)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    })(),
    chan: c.lang === 'vi'
      ? 'Bản mẫu ghi bút toán ở mức tổng cả kỳ. Hệ thống thật ghi từng dòng doanh thu, nhờ vậy bảng đối chiếu với sao kê ngân hàng mới lần ra được từng khoản.'
      : 'The prototype posts at period level. A real system posts per revenue line — which is exactly what lets a bank reconciliation trace an individual amount.'
  });

  return html;
}

/* =====================================================================
   TAB 2 — CÔNG NỢ BÊN NHẬN
   ===================================================================== */
function veCongNo(c, s) {
  var A = c.A, t = c.t;
  var rows = s.chi.filter(function (r) { return !r.held; }).map(function (r) {
    return {
      key: r.partyKey, ten: A.partyName(r.partyKey), ma: A.partyClientId(r.partyKey),
      loai: r.kind, duDau: r.carryIn, ps: r.earned, thu: r.recoup,
      chi: r.payable, duCuoi: r.carryOut, ungConLai: r.advanceLeft
    };
  });

  var loc = rows.filter(function (r) {
    if (LOC_CN.loai && r.loai !== LOC_CN.loai) return false;
    if (LOC_CN.chi === 'cochi' && !(r.chi > 0)) return false;
    if (LOC_CN.chi === 'duoi' && !(r.duCuoi > 0)) return false;
    if (LOC_CN.chi === 'tru' && !(r.thu > 0)) return false;
    if (LOC_CN.tim) {
      var q = LOC_CN.tim.toLowerCase();
      if (r.ten.toLowerCase().indexOf(q) < 0 && r.ma.toLowerCase().indexOf(q) < 0) return false;
    }
    return true;
  });

  var tg = { duDau: 0, ps: 0, thu: 0, chi: 0, duCuoi: 0 };
  loc.forEach(function (r) {
    tg.duDau += r.duDau; tg.ps += r.ps; tg.thu += r.thu; tg.chi += r.chi; tg.duCuoi += r.duCuoi;
  });

  var giu = s.chi.filter(function (r) { return r.held; })[0];

  var html = HM.the({
    h2: HM.esc(t('tCn')) + ' · ' + HM.esc(c.ky.label),
    p: c.lang === 'vi'
      ? 'Mỗi dòng phải thoả: <b>dư đầu kỳ + phát sinh − thu hồi tạm ứng = đã chi + dư cuối kỳ</b>. Dòng nào không thoả là dòng có tiền đi lạc.'
      : 'Each row satisfies: <b>opening + arising − recouped = paid + closing</b>. Any row that does not is a row where money went astray.',
    hanhDong: '<button type="button" class="btn sm" data-xuatcn>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>',
    than: '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-cntim placeholder="' +
        HM.esc(t('tim')) + '" value="' + HM.esc(LOC_CN.tim) + '"></div>' +
      '<select class="in" data-cnloai style="width:auto;height:34px">' +
        '<option value="">' + HM.esc(t('tatCa')) + '</option>' +
        '<option value="label"' + (LOC_CN.loai === 'label' ? ' selected' : '') + '>Label</option>' +
        '<option value="artist"' + (LOC_CN.loai === 'artist' ? ' selected' : '') + '>' +
          HM.esc(c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist') + '</option></select>' +
      [['tatca', t('tatCa')], ['cochi', t('coChi')], ['duoi', t('duoiNguong')], ['tru', t('dangTru')]].map(function (x) {
        return '<button type="button" class="pill' + (LOC_CN.chi === x[0] ? ' on' : '') + '" data-cn="' + x[0] + '">' +
          HM.esc(x[1]) + '</button>';
      }).join('') + '</div>' +
      HM.so([
        { l: t('duDau'), v: c.tien(tg.duDau) },
        { l: t('psTang'), v: c.tien(tg.ps), lon: true },
        { l: t('thuHoi'), v: '−' + c.tien(tg.thu) },
        { l: t('daChi'), v: c.tien(tg.chi) },
        { l: t('duCuoi'), v: c.tien(tg.duCuoi) }
      ])
  });

  html += HM.the({ thoBody: true, than: '<div data-bangcn></div>' });

  if (giu) {
    html += HM.ghi({ kieu: 'warn',
      tieuDe: HM.esc(c.lang === 'vi'
        ? 'Giữ lại ' + c.tien2(giu.earned) + ': điểm producer chưa rõ người nhận'
        : 'Holding ' + c.tien2(giu.earned) + ' — producer points with no identity'),
      than: HM.esc(c.lang === 'vi'
        ? 'Cột Producer trong danh mục hiện chỉ ghi tên, không có mã. Không có mã thì không biết trả cho ai, nên khoản này nằm ở một dòng riêng, nhìn thấy được, chứ không lặng lẽ biến mất khỏi bảng chi trả. Đây là câu hỏi còn treo số 3.'
        : 'The catalogue’s Producer column holds a NAME, not an id. Without an id there is nobody to pay, so the amount sits on its own visible row rather than quietly vanishing. This is open question 3.'),
      nut: '<button type="button" class="btn sm" data-di="quan-tri">' +
        HM.esc(c.lang === 'vi' ? 'Xem câu hỏi còn treo' : 'Open questions') + '</button>' });
  }

  /* Bảng chỉ dựng được sau khi HTML đã nằm trong DOM — hàm bang() cần
     một phần tử thật để gắn sự kiện vào. */
  SAU.push(function (root) {
    var host = root.querySelector('[data-bangcn]');
    if (!host) return;
    var b = c.bang({
      host: host, dong: function () { return loc; }, sort: 'ps', dir: -1, co: 25,
      cot: [
        { k: 'ten', l: t('benNhan') },
        { k: 'loai', l: t('loai'), w: '90px' },
        { k: 'duDau', l: t('duDau'), num: true, w: '110px' },
        { k: 'ps', l: t('psTang'), num: true, w: '120px' },
        { k: 'thu', l: t('thuHoi'), num: true, w: '110px' },
        { k: 'chi', l: t('daChi'), num: true, w: '120px' },
        { k: 'duCuoi', l: t('duCuoi'), num: true, w: '110px' }
      ],
      veDong: function (r) {
        return '<td><div class="t-ttl">' + HM.esc(HM.dai(r.ten, 32)) + '</div>' +
            '<div class="t-sub">' + HM.esc(r.ma) + '</div></td>' +
          '<td>' + HM.tag(r.loai === 'label' ? 'Label' : (c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist'),
            r.loai === 'label' ? 'info' : 'link') + '</td>' +
          '<td class="num">' + (r.duDau > 0.004 ? HM.esc(c.tien2(r.duDau)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(r.ps)) + '</td>' +
          '<td class="num">' + (r.thu > 0.004 ? '<span class="neg">−' + HM.esc(c.tien2(r.thu)) + '</span>' : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (r.chi > 0.004 ? '<b>' + HM.esc(c.tien2(r.chi)) + '</b>' : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (r.duCuoi > 0.004 ? '<span class="tag warn">' + HM.esc(c.tien2(r.duCuoi)) + '</span>' : '<span class="nil">—</span>') + '</td>';
      },
      chon: function (r) { moChiTiet(c, r.key, s); },
      chan: function (rs) {
        var g = { duDau: 0, ps: 0, thu: 0, chi: 0, duCuoi: 0 };
        rs.forEach(function (r) { g.duDau += r.duDau; g.ps += r.ps; g.thu += r.thu; g.chi += r.chi; g.duCuoi += r.duCuoi; });
        return '<tr><td colspan="2">' + HM.esc(t('tongCong')) + ' · ' + HT.fmt.n(rs.length) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(g.duDau)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(g.ps)) + '</td>' +
          '<td class="num">−' + HM.esc(c.tien2(g.thu)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(g.chi)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(g.duCuoi)) + '</td></tr>';
      },
      chanChu: function (rs) {
        var g = { duDau: 0, ps: 0, thu: 0, chi: 0, duCuoi: 0 };
        rs.forEach(function (r) { g.duDau += r.duDau; g.ps += r.ps; g.thu += r.thu; g.chi += r.chi; g.duCuoi += r.duCuoi; });
        var trai = Math.round((g.duDau + g.ps - g.thu) * 100) / 100;
        var phai = Math.round((g.chi + g.duCuoi) * 100) / 100;
        return (Math.abs(trai - phai) < 0.005
          ? '<span class="pos">' + HM.esc(c.lang === 'vi' ? 'Cân: dư đầu + phát sinh − thu hồi = đã chi + dư cuối = ' : 'Balanced: ') + HM.esc(c.tien2(trai)) + '</span>'
          : '<span class="neg">' + HM.esc(c.lang === 'vi' ? 'Lệch ' : 'OUT BY ') + HM.esc(HT.fmt.usd(trai - phai)) + '</span>');
      },
      rongTieuDe: c.lang === 'vi' ? 'Không có bên nhận nào' : 'No payee',
      rongMoTa: c.lang === 'vi' ? 'Không có bên nhận nào trong kỳ khớp bộ lọc hiện tại.' : 'No payee in this period matches the filters.'
    });
    b.ve();
  });

  return html;
}

/* =====================================================================
   TAB 3 — TẠM ỨNG PHẢI THU
   ===================================================================== */
function veTamUng(c) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var ds = A.advances.list();
  var conNo = ds.filter(function (x) { return x.balance > 0; });
  var xong = ds.filter(function (x) { return x.balance <= 0 && x.opening > 0; });
  var tongGoc = ds.reduce(function (s, x) { return s + x.opening; }, 0);
  var tongThu = ds.reduce(function (s, x) { return s + x.recouped; }, 0);

  /* Nhịp thu hồi = số bên đó kiếm được trong kỳ đang xem. Quét toàn danh
     mục MỘT lần cho cả bảng, không phải một lần mỗi dòng. */
  var kiem = HM.nho(A, 'kiem:' + c.ky.idx, function () { return A.earnedByParty(c.ky.idx); });

  var theoKy = HM.nho(A, 'ungTheoKy', function () {
    var st = A.state();
    return A.periods.map(function (p) {
      var s = 0;
      Object.keys(st.advances).forEach(function (k) {
        var b = st.advances[k].byPeriod || {};
        s += b[p.k] || 0;
      });
      return Math.round(s * 100) / 100;
    });
  });

  var html = HM.the({
    h2: HM.esc(t('tUng')),
    p: HM.esc(t('giaiThichUng')),
    than: HM.so([
      { l: t('ungGoc'), v: c.tien(tongGoc), s: HT.fmt.n(ds.length) + (c.lang === 'vi' ? ' bên nhận' : ' payees') },
      { l: t('ungDaThu'), v: c.tien(tongThu),
        s: HT.fmt.pct(tongGoc ? tongThu / tongGoc : 0) + (c.lang === 'vi' ? ' đã thu hồi' : ' recovered') },
      { l: t('ungConLai'), v: c.tien(A.advances.total()), lon: true,
        s: HT.fmt.n(conNo.length) + (c.lang === 'vi' ? ' bên còn nợ' : ' still owing'),
        mau: HB.mau('warn') },
      { l: c.lang === 'vi' ? 'Đã trả xong' : 'Cleared', v: HT.fmt.n(xong.length) }
    ]) +
    '<div style="margin-top:6px">' + HB.chia([
      { ten: t('ungDaThu'), gt: tongThu, mau: P[6] },
      { ten: t('ungConLai'), gt: A.advances.total(), mau: P[4] }
    ]) + '</div>'
  });

  html += '<div class="grid g2">' +
    HM.the({
      h2: c.lang === 'vi' ? 'Thu hồi qua từng kỳ' : 'Recoupment period by period',
      p: c.lang === 'vi' ? 'Chỉ kỳ đã duyệt mới ghi lượt thu hồi. Kỳ chưa duyệt là cột trống, không phải bằng 0.'
                         : 'Only approved periods record a recoupment — an unapproved period is an empty column, not a zero.',
      than: HB.o({ loai: 'cot', cao: 180, hienGiaTri: true, chuThich: false,
        truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
        tieuDeTip: function (i) { return 'Kỳ ' + A.periods[i].label; },
        chuTrong: c.lang === 'vi' ? 'Kỳ chưa duyệt' : 'Period not approved',
        chuoi: [{ ten: t('ungDaThu'), gt: theoKy.map(function (v, i) { return A.isApproved(A.periods[i].k) ? v : null; }), mau: P[6] }],
        noiBat: c.ky.idx })
    }) +
    HM.the({
      h2: c.lang === 'vi' ? 'Nợ lớn nhất' : 'Largest outstanding',
      than: HB.o({ loai: 'thanh', tenTong: t('ungConLai'), hang: conNo.slice(0, 8).map(function (x, i) {
        return { ten: HM.dai(x.name, 26), gt: x.balance, mau: P[i % 8],
                 phu: x.clientId + ' · ' + (c.lang === 'vi' ? 'đã ứng ' : 'advanced ') + HT.fmt.usd0(x.opening) };
      }) })
    }) + '</div>';

  html += HM.the({
    h2: c.lang === 'vi' ? 'Sổ tạm ứng' : 'Advance ledger',
    hanhDong: '<button type="button" class="btn sm" data-di="tam-ung">' + HM.icon('out') +
      (c.lang === 'vi' ? 'Quản lý tạm ứng' : 'Manage advances') + '</button>',
    thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('benNhan')) + '</th>' +
      '<th class="num">' + HM.esc(t('ungGoc')) + '</th>' +
      '<th class="num">' + HM.esc(t('ungDaThu')) + '</th>' +
      '<th class="num band">' + HM.esc(t('ungConLai')) + '</th>' +
      '<th style="width:180px">' + (c.lang === 'vi' ? 'Tiến độ thu hồi' : 'Recovery') + '</th>' +
      '<th class="num">' + HM.esc(t('ungKy')) + '</th></tr></thead><tbody>' +
      ds.slice(0, 60).map(function (x) {
        var pc = x.opening > 0 ? x.recouped / x.opening : 1;
        var nhip = kiem.get(x.partyKey) || 0;
        var soKy = x.balance <= 0 ? 0 : nhip > 0 ? Math.ceil(x.balance / nhip) : null;
        return '<tr><td><div class="t-ttl">' + HM.esc(HM.dai(x.name, 34)) + '</div>' +
          '<div class="t-sub">' + HM.esc(x.clientId) + ' · ' + HM.esc(x.note || '') + '</div></td>' +
          '<td class="num">' + HM.esc(c.tien(x.opening)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien(x.recouped)) + '</td>' +
          '<td class="num band">' + (x.balance > 0
            ? '<span class="neg">' + HM.esc(c.tien(x.balance)) + '</span>'
            : '<span class="pos">' + HM.esc(c.lang === 'vi' ? 'xong' : 'clear') + '</span>') + '</td>' +
          '<td><div class="meter thin"><i style="width:' + Math.min(100, pc * 100).toFixed(1) + '%;background:' +
            (x.balance > 0 ? P[4] : HB.mau('ok')) + '"></i></div>' +
            '<div class="t-sub">' + HT.fmt.pct(pc) + '</div></td>' +
          '<td class="num">' + (x.balance <= 0 ? '—' : soKy == null
            ? '<span class="nil">' + HM.esc(c.lang === 'vi' ? 'chưa phát sinh' : 'no earnings') + '</span>'
            : HM.esc(String(soKy))) + '</td></tr>';
      }).join('') + '</tbody></table></div>',
    chan: HT.fmt.n(ds.length) + (c.lang === 'vi' ? ' bên nhận có tạm ứng · hiện 60 dòng đầu'
                                                 : ' payees with advances · first 60 shown')
  });

  return html;
}

/* =====================================================================
   TAB 4 — GHI NHẬN 12 KỲ
   ===================================================================== */
function veGhiNhan(c) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var ds = HM.nho(A, 'ghinhan12', function () {
    return A.periods.map(function (p, i) {
      var r = A.agg('admin', 0, i, 'rec');
      var pub = A.pubLoaded(i) ? A.agg('admin', 0, i, 'pub') : null;
      var pf = pub ? Math.round(pub.gross * A.cfg.PUB_FEE * 100) / 100 : 0;
      return { p: p, gross: r.gross, fee: r.fee, labelCut: r.labelCut,
               producer: r.producer, artist: r.artist, streams: r.streams,
               pubGross: pub ? pub.gross : 0, pubFee: pf,
               treo: A.queue.pendingTotal(p.k), duyet: A.isApproved(p.k) };
    });
  });
  var tg = ds.reduce(function (s, r) {
    s.gross += r.gross; s.fee += r.fee; s.labelCut += r.labelCut;
    s.producer += r.producer; s.artist += r.artist;
    s.pubGross += r.pubGross; s.pubFee += r.pubFee; s.treo += r.treo;
    return s;
  }, { gross: 0, fee: 0, labelCut: 0, producer: 0, artist: 0, pubGross: 0, pubFee: 0, treo: 0 });

  var html = HM.the({
    h2: HM.esc(t('tGhi')),
    p: c.lang === 'vi'
      ? 'Doanh thu Haustek thật sự ghi nhận là <b>phí</b>, không phải doanh thu gộp. Doanh thu gộp chỉ chảy qua tài khoản, phần lớn là tiền của người khác.'
      : 'Haustek’s recognised revenue is the <b>fee</b>, not gross. Gross merely flows through the account — most of it is other people’s money.',
    than: HM.so([
      { l: c.lang === 'vi' ? 'Gộp 12 kỳ' : 'Gross, 12 periods', v: c.tien(tg.gross + tg.pubGross) },
      { l: c.lang === 'vi' ? 'Doanh thu Haustek' : 'Haustek revenue', v: c.tien(tg.fee + tg.pubFee), lon: true,
        mau: HB.mau('ok') },
      { l: t('bienPhi'), v: HT.fmt.pct((tg.fee + tg.pubFee) / (tg.gross + tg.pubGross || 1)) },
      { l: c.lang === 'vi' ? 'Còn treo, chưa rõ chủ' : 'Still ownerless', v: c.tien(tg.treo), mau: HB.mau('warn') }
    ]) +
    '<div style="margin-top:14px">' + HB.o({
      loai: 'cot', cao: 240,
      truc: A.periods.map(function (p) { return p.label; }),
      tieuDeTip: function (i) { return 'Kỳ ' + A.periods[i].label + (ds[i].duyet ? ' · đã duyệt' : ' · chưa duyệt'); },
      dangDo: ds.map(function (r, i) { return r.duyet ? -1 : i; }).filter(function (i) { return i >= 0; }),
      noiBat: c.ky.idx,
      chuoi: [
        { ten: t('dtPhi'), gt: ds.map(function (r) { return Math.round((r.fee + r.pubFee) * 100) / 100; }), mau: P[5] },
        { ten: c.lang === 'vi' ? 'Phải trả label' : 'Payable to labels', gt: ds.map(function (r) { return r.labelCut; }), mau: P[1] },
        { ten: c.lang === 'vi' ? 'Phải trả producer' : 'Payable to producers', gt: ds.map(function (r) { return r.producer; }), mau: P[2] },
        { ten: c.lang === 'vi' ? 'Phải trả nghệ sĩ' : 'Payable to artists', gt: ds.map(function (r) { return r.artist; }), mau: P[0] },
        { ten: c.lang === 'vi' ? 'Phải trả tác giả' : 'Payable to writers',
          gt: ds.map(function (r) { return Math.round((r.pubGross - r.pubFee) * 100) / 100; }), mau: P[3] }
      ]
    }) + '</div>'
  });

  html += HM.the({
    thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + (c.lang === 'vi' ? 'Kỳ' : 'Period') + '</th>' +
      '<th class="num">' + HM.esc(t('dtGop')) + '</th>' +
      '<th class="num band">' + HM.esc(t('dtPhi')) + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Label' : 'Labels') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Producer' : 'Producers') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Nghệ sĩ' : 'Artists') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Tác quyền' : 'Publishing') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Treo' : 'Held') + '</th>' +
      '<th>' + (c.lang === 'vi' ? 'Sổ' : 'Books') + '</th></tr></thead><tbody>' +
      ds.slice().reverse().map(function (r) {
        return '<tr class="pick" data-kyto="' + r.p.k + '"' +
          (r.p.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '>' +
          '<td class="mono">' + HM.esc(r.p.label) + '</td>' +
          '<td class="num">' + HM.esc(c.tien(r.gross + r.pubGross)) + '</td>' +
          '<td class="num band">' + HM.esc(c.tien(r.fee + r.pubFee)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien(r.labelCut)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien(r.producer)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien(r.artist)) + '</td>' +
          '<td class="num">' + (r.pubGross > 0 ? HM.esc(c.tien(r.pubGross - r.pubFee)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (r.treo > 0.004 ? '<span class="tag warn">' + HM.esc(c.tien(r.treo)) + '</span>' : '<span class="nil">—</span>') + '</td>' +
          '<td>' + (r.duyet ? HM.tag(c.lang === 'vi' ? 'đã chốt' : 'closed', 'ok')
            : HM.tag(c.lang === 'vi' ? 'chưa chốt' : 'open', 'warn')) + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><td>' + HM.esc(t('tongCong')) + '</td>' +
      '<td class="num">' + HM.esc(c.tien(tg.gross + tg.pubGross)) + '</td>' +
      '<td class="num band">' + HM.esc(c.tien(tg.fee + tg.pubFee)) + '</td>' +
      '<td class="num">' + HM.esc(c.tien(tg.labelCut)) + '</td>' +
      '<td class="num">' + HM.esc(c.tien(tg.producer)) + '</td>' +
      '<td class="num">' + HM.esc(c.tien(tg.artist)) + '</td>' +
      '<td class="num">' + HM.esc(c.tien(tg.pubGross - tg.pubFee)) + '</td>' +
      '<td class="num">' + HM.esc(c.tien(tg.treo)) + '</td><td></td></tr></tfoot></table></div>'
  });

  return html;
}

/* =====================================================================
   TAB 5 — THUẾ & KHẤU TRỪ
   Phần bản mẫu CHƯA làm. Để trống là để người đọc tưởng hệ thống đã lo.
   ===================================================================== */
function veThue(c, s) {
  var A = c.A, t = c.t;
  var muc = [
    { t: c.lang === 'vi' ? 'Thuế thu nhập cá nhân khấu trừ tại nguồn' : 'Personal income tax withheld at source',
      d: c.lang === 'vi'
        ? 'Với cá nhân cư trú không ký hợp đồng lao động, mức khấu trừ thông thường là 10% trên khoản chi từ 2 triệu đồng trở lên. Ai được miễn, ai đã làm cam kết, ai có mã số thuế: hệ thống phải biết từng người, không thể áp một tỷ lệ cho tất cả.'
        : 'For resident individuals without an employment contract, 10% is normally withheld on payments of VND 2m or more. Who is exempt, who filed a commitment, who has a tax code — the system must know per person, not apply one rate to all.',
      c: c.lang === 'vi' ? 'Cần: mã số thuế, tình trạng cư trú, và bảng tỷ lệ theo loại bên nhận'
                         : 'Needs: tax code, residency status, and a rate table per payee type' },
    { t: c.lang === 'vi' ? 'Thuế nhà thầu nước ngoài' : 'Foreign contractor tax',
      d: c.lang === 'vi'
        ? 'Nghệ sĩ hoặc label ở nước ngoài nhận tiền từ Việt Nam chịu cơ chế thuế khác hẳn, còn tuỳ hiệp định tránh đánh thuế hai lần với từng nước.'
        : 'Artists or labels abroad receiving money from Vietnam fall under a different regime, further shaped by the double-tax treaty with each country.',
      c: c.lang === 'vi' ? 'Cần: quốc gia cư trú của từng bên nhận' : 'Needs: residency country per payee' },
    { t: c.lang === 'vi' ? 'Thuế giá trị gia tăng trên phí dịch vụ' : 'VAT on the service fee',
      d: c.lang === 'vi'
        ? 'Phần Haustek ghi nhận là doanh thu dịch vụ và chịu VAT. Phần chảy qua để trả cho nghệ sĩ không phải doanh thu của Haustek. Ghi nhầm chỗ này là khai vống doanh thu lên gần bảy lần.'
        : 'What Haustek recognises is service revenue and carries VAT. The part flowing through to artists is not Haustek revenue — booking it wrongly overstates revenue nearly sevenfold.',
      c: c.lang === 'vi' ? 'Đã tách đúng trong bút toán: TK 511 chỉ nhận phần phí' : 'Already separated: account 511 receives only the fee' },
    { t: c.lang === 'vi' ? 'Hoá đơn và chứng từ chi' : 'Invoices and payment vouchers',
      d: c.lang === 'vi'
        ? 'Mỗi khoản chi phải có chứng từ gắn đúng bên nhận và đúng kỳ. Bảng chi trả ở đây là căn cứ lập chứng từ, nhưng bản mẫu chưa sinh chứng từ.'
        : 'Every payment needs a voucher tied to the right payee and period. The payout table here is the source for those vouchers, but the prototype does not generate them.',
      c: c.lang === 'vi' ? 'Cần: đánh số chứng từ, trạng thái chuyển tiền, đối chiếu sao kê'
                         : 'Needs: voucher numbering, transfer status, bank reconciliation' },
    { t: c.lang === 'vi' ? 'Chênh lệch tỷ giá' : 'FX differences',
      d: c.lang === 'vi'
        ? 'Tiền về bằng USD, chi ra bằng VND, hai thời điểm cách nhau vài tuần. Chênh lệch đó là lãi hoặc lỗ tỷ giá, phải ghi nhận riêng. Bản mẫu hiện chốt một tỷ giá cho cả kỳ và bỏ qua phần chênh.'
        : 'Money arrives in USD and leaves in VND, weeks apart. That gap is an FX gain or loss and must be recognised separately — the prototype locks one rate per period and ignores the difference.',
      c: c.lang === 'vi' ? 'Liên quan câu hỏi còn treo số 4 về chính sách tỷ giá' : 'Tied to open question 4 on FX policy' }
  ];

  return HM.ghi({ kieu: 'warn',
    tieuDe: HM.esc(c.lang === 'vi'
      ? 'Bản mẫu chưa mô hình hoá thuế và khấu trừ'
      : 'The prototype does not model tax or withholding'),
    than: HM.esc(c.lang === 'vi'
      ? 'Con số "sẽ chi" ở mọi trang khác là số trước thuế. Trong hệ thống thật, số thật sự chuyển vào tài khoản bên nhận nhỏ hơn, và bên nhận sẽ hỏi tại sao. Danh sách dưới đây là những gì phải bổ sung, viết ra để không ai tưởng phần này đã xong.'
      : 'The “payable” figure on every other screen is BEFORE tax. In a real system the amount that reaches the payee’s account is smaller — and they will ask why. The list below is what must be added, written down so nobody assumes it is done.')
  }) +
  HM.the({
    h2: HM.esc(t('tThue')),
    than: muc.map(function (m) {
      return '<div class="stat" style="align-items:flex-start"><b style="max-width:none">' + HM.esc(m.t) +
        '<p>' + HM.esc(m.d) + '</p></b>' +
        '<span class="v" style="max-width:230px;white-space:normal;text-align:right;font-size:12px;color:var(--faint)">' +
        HM.esc(m.c) + '</span></div>';
    }).join('')
  }) +
  HM.the({
    h2: c.lang === 'vi' ? 'Ước tính nếu áp khấu trừ 10% cho cá nhân cư trú' : 'If 10% withholding applied to resident individuals',
    p: c.lang === 'vi'
      ? 'Chỉ là phép nhân để thấy độ lớn của phần còn thiếu. <b>Không</b> dùng con số này cho việc thật: tỷ lệ thật tuỳ từng người.'
      : 'A multiplication to show the size of what is missing. Do NOT use these figures for anything real — the actual rate depends on each individual.',
    than: (function () {
      var choNs = s.chi.filter(function (r) { return !r.held && r.kind === 'artist' && r.payable > 0; });
      var tongNs = choNs.reduce(function (x, r) { return x + r.payable; }, 0);
      var choLb = s.chi.filter(function (r) { return !r.held && r.kind === 'label' && r.payable > 0; });
      var tongLb = choLb.reduce(function (x, r) { return x + r.payable; }, 0);
      return HM.kv([
        { t: c.lang === 'vi' ? 'Sẽ chi cho nghệ sĩ (cá nhân)' : 'Payable to artists (individuals)',
          v: c.tien2(tongNs) + ' · ' + HT.fmt.n(choNs.length) + (c.lang === 'vi' ? ' người' : ' people') },
        { t: c.lang === 'vi' ? 'Khấu trừ ước tính 10%' : 'Estimated 10% withholding', v: '−' + c.tien2(tongNs * 0.1), mau: 'neg' },
        { t: c.lang === 'vi' ? 'Thực nhận ước tính' : 'Estimated net to artists', v: c.tien2(tongNs * 0.9), manh: true },
        { t: c.lang === 'vi' ? 'Sẽ chi cho label (tổ chức)' : 'Payable to labels (entities)',
          v: c.tien2(tongLb) + ' · ' + (c.lang === 'vi' ? 'cơ chế khác, cần hoá đơn' : 'different regime, invoice required') }
      ]);
    })()
  });
}

/* =====================================================================
   NGĂN TRƯỢT — một bên nhận
   ===================================================================== */
function moChiTiet(c, key, s) {
  var A = c.A;
  var r = s.chi.filter(function (x) { return x.partyKey === key; })[0];
  if (!r) return;
  var la = key[0] === 'L';
  var a = A.agg(la ? 'label' : 'artist', +key.slice(2), s.pi, 'rec');
  var pub = la ? null : A.agg('artist', +key.slice(2), s.pi, 'pub');
  var ung = A.advances.list().filter(function (x) { return x.partyKey === key; })[0];

  c.nganTruot(
    HM.kv([
      { t: c.lang === 'vi' ? 'Mã bên nhận' : 'Payee code', v: A.partyClientId(key) },
      { t: c.lang === 'vi' ? 'Loại' : 'Kind', v: la ? 'Label' : (c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist') },
      { t: c.lang === 'vi' ? 'Bản ghi có doanh thu kỳ này' : 'Earning recordings', v: HT.fmt.n(a.tracks) }
    ]) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Công nợ kỳ ' + c.ky.label : 'Ledger, ' + c.ky.label) + '</h4>' +
    HM.kv([
      { t: c.lang === 'vi' ? 'Dư đầu kỳ (dồn từ kỳ trước)' : 'Opening (carried in)', v: c.tien2(r.carryIn) },
      { t: c.lang === 'vi' ? 'Phát sinh: doanh thu bản ghi' : 'Arising — recording', v: c.tien2(la ? a.labelCut : a.artist) },
      !la && pub && pub.total > 0.004 ? { t: c.lang === 'vi' ? 'Phát sinh: tác quyền' : 'Arising — publishing', v: c.tien2(pub.total) } : null,
      { t: c.lang === 'vi' ? 'Tổng phát sinh' : 'Total arising', v: c.tien2(r.earned), manh: true },
      { t: c.lang === 'vi' ? 'Thu hồi tạm ứng' : 'Advance recouped', v: r.recoup > 0.004 ? '−' + c.tien2(r.recoup) : '—', mau: r.recoup > 0.004 ? 'neg' : '' },
      { t: c.lang === 'vi' ? 'Đã chi' : 'Paid', v: c.tien2(r.payable), manh: true },
      { t: c.lang === 'vi' ? 'Dư cuối kỳ (dồn sang kỳ sau)' : 'Closing (carried out)', v: c.tien2(r.carryOut) }
    ]) +
    '<div class="hint" style="margin-top:10px">' + (function () {
      var trai = Math.round((r.carryIn + r.earned - r.recoup) * 100) / 100;
      var phai = Math.round((r.payable + r.carryOut) * 100) / 100;
      return Math.abs(trai - phai) < 0.005
        ? '<span class="pos">' + HM.esc(c.tien2(r.carryIn) + ' + ' + c.tien2(r.earned) + ' − ' + c.tien2(r.recoup) +
          ' = ' + c.tien2(r.payable) + ' + ' + c.tien2(r.carryOut)) + '</span>'
        : '<span class="neg">' + HM.esc('Lệch ' + HT.fmt.usd(trai - phai)) + '</span>';
    })() + '</div>' +
    (ung ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Tạm ứng' : 'Advance') + '</h4>' +
      HM.kv([
        { t: c.lang === 'vi' ? 'Đã ứng' : 'Advanced', v: c.tien2(ung.opening) },
        { t: c.lang === 'vi' ? 'Đã thu hồi' : 'Recouped', v: c.tien2(ung.recouped) },
        { t: c.lang === 'vi' ? 'Còn phải thu' : 'Outstanding', v: c.tien2(ung.balance), manh: true },
        { t: c.lang === 'vi' ? 'Ghi chú' : 'Note', v: ung.note || '—' }
      ]) : '') +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Thu nhập 12 kỳ' : 'Earned across 12 periods') + '</h4>' +
    HB.o({ loai: 'cot', cao: 150, anTruc: true, chuThich: false,
      truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
      tieuDeTip: function (i) { return 'Kỳ ' + A.periods[i].label; },
      chuoi: [{ ten: c.lang === 'vi' ? 'Được hưởng' : 'Earned',
        gt: A.periods.map(function (p, i) {
          var g = A.agg(la ? 'label' : 'artist', +key.slice(2), i, 'rec');
          return g.total;
        }) }],
      noiBat: s.pi }),
    { tieuDe: A.partyName(key), phu: A.partyClientId(key),
      khiMo: function (dr) { HB.gan(dr); } });
}

/* =====================================================================
   XUẤT
   ===================================================================== */
function xuatButToan(c, s) {
  var A = c.A;
  var d = [];
  var push = function (bt, tk, mo, no, co) { d.push([bt, tk, TK[tk].ten, mo, no ? no.toFixed(2) : '', co ? co.toFixed(2) : '']); };
  push(c.t('but1'), '131', 'Phải thu doanh thu kỳ', s.gross, 0);
  push(c.t('but1'), '511', 'Phí Haustek', 0, s.fee);
  push(c.t('but1'), '3311', 'Phần label', 0, s.labelCut);
  push(c.t('but1'), '3313', 'Điểm producer', 0, s.producer);
  push(c.t('but1'), '3312', 'Phần nghệ sĩ', 0, s.artist);
  if (s.pubCo && s.pubGross > 0.004) {
    push(c.t('but2'), '131', 'Tác quyền quý', s.pubGross, 0);
    push(c.t('but2'), '511', 'Phí quản lý', 0, s.pubFee);
    push(c.t('but2'), '3314', 'Phần tác giả', 0, s.pubWriter);
  }
  if (s.treo > 0.004) {
    push(c.t('but3'), '131', 'Tiền về chưa khớp', s.treo, 0);
    push(c.t('but3'), '338', 'Chưa xác định chủ', 0, s.treo);
  }
  if (s.tong.recoup > 0.004) {
    push(c.t('but4'), '3312', 'Giảm phải trả', s.tong.recoup, 0);
    push(c.t('but4'), '138', 'Thu hồi tạm ứng', 0, s.tong.recoup);
  }
  if (s.tong.payable > 0.004) {
    push(c.t('but5'), '3311', 'Chi trả bên nhận', s.tong.payable, 0);
    push(c.t('but5'), '131', 'Chuyển khoản đi', 0, s.tong.payable);
  }
  HM.csv('but-toan-' + s.pk + '.csv',
    ['Bút toán', 'Số hiệu TK', 'Tên tài khoản', 'Diễn giải', 'Nợ (USD)', 'Có (USD)'], d);
}

function xuatCongNo(c, s) {
  var A = c.A;
  HM.csv('cong-no-' + s.pk + '.csv',
    ['Mã bên nhận', 'Tên', 'Loại', 'Dư đầu kỳ', 'Phát sinh', 'Thu hồi tạm ứng', 'Đã chi', 'Dư cuối kỳ', 'Dư nợ tạm ứng'],
    s.chi.filter(function (r) { return !r.held; }).map(function (r) {
      return [A.partyClientId(r.partyKey), A.partyName(r.partyKey), r.kind,
              r.carryIn.toFixed(2), r.earned.toFixed(2), r.recoup.toFixed(2),
              r.payable.toFixed(2), r.carryOut.toFixed(2), r.advanceLeft.toFixed(2)];
    }));
}

})();
