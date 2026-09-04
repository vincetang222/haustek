/* =====================================================================
   CỔNG KHÁCH · TỔNG QUAN
   ---------------------------------------------------------------------
   Người mở màn này là nghệ sĩ hoặc label, không phải kế toán. Họ có đúng
   ba câu hỏi, và màn phải trả lời theo thứ tự đó:
     1. Kỳ này tôi được bao nhiêu?
     2. Vì sao lại là con số đó — tiền đi đâu trên đường về tay tôi?
     3. Bao giờ tiền vào tài khoản?

   Cái màn này KHÔNG được làm: bắt người ta tự cộng, tự suy, hay tự đoán
   vì sao kỳ này ít hơn kỳ trước. Nếu số giảm thì nói ra vì sao.
   ===================================================================== */
"use strict";
(function () {

var LUONG = 'rec';   /* rec = doanh thu bản ghi · pub = tác quyền */

HT.dangKy({
  id: 'k-tong-quan', nav: 'navTong', icon: 'grid',

  chu: {
    vi: {
      navTong: 'Tổng quan', h1: 'Tổng quan',
      banGhi: 'Doanh thu bản ghi', tacQuyen: 'Tác quyền',
      veTay: 'Thu nhập kỳ này', gop: 'Doanh thu gộp', luot: 'Lượt nghe', bai: 'Bài hát có doanh thu',
      chuoi: 'Chi tiết dòng tiền',
      chuoiMo: 'Từ doanh thu gộp đến thu nhập của bạn, theo đúng hợp đồng. Các khoản cộng lại đúng bằng con số ở trên.',
      dienBien: 'Diễn biến qua các kỳ',
      dienBienMo: 'Biểu đồ chỉ hiển thị các kỳ đã chốt sổ. Kỳ chưa chốt sổ để trống, không phải bằng 0.',
      cuaHang: 'Thu nhập theo nền tảng', lanhTho: 'Thu nhập theo thị trường',
      topBai: 'Bài hát có doanh thu cao nhất kỳ này', xemHet: 'Xem tất cả',
      chiTra: 'Khi nào bạn nhận được tiền',
      seChi: 'Sẽ thanh toán trong đợt tới', duoiNguong: 'Dưới ngưỡng thanh toán tối thiểu',
      duoiNguongMo: 'Thu nhập của bạn kỳ này dưới ngưỡng {n} nên được chuyển sang kỳ sau. Khoản này không bị mất.',
      tamUng: 'Khoản tạm ứng', xemUng: 'Xem chi tiết',
      lichChi: 'Các kỳ gần đây', kyChi: 'Kỳ', soChi: 'Đã thanh toán',
      donTiep: 'chuyển sang kỳ sau', truUng: 'khấu trừ tạm ứng',
      nguongLa: 'Ngưỡng thanh toán tối thiểu là {n}',
      nguongLaMo: 'Khoản dưới ngưỡng được chuyển sang kỳ sau, không bị mất. Ngưỡng này tồn tại vì phí chuyển khoản quốc tế chiếm phần rất lớn với khoản nhỏ: chuyển $12 thì phí chiếm gần hết $12.',
      xemBangKe: 'Mở bảng kê kỳ này',
      trongMo: 'Kỳ này chưa có số liệu',
      chuaMo: 'Kỳ này chưa chốt sổ', chuaMoMo: 'Số liệu chỉ hiển thị sau khi Haustek đối soát xong với tất cả các nền tảng.',
      tyGia: 'Tỷ giá kỳ này', chotLuc: 'đã chốt ngày', chuaChot: 'chưa chốt',
      soVoi: 'so với kỳ', khac: 'nền tảng khác',
      khongTq: 'Bạn chưa có bài hát nào đăng ký phần sáng tác',
      kyCoTq: 'Các kỳ đã có báo cáo tác quyền',
      kyCoTqMo: 'Chọn một kỳ để xem số liệu của kỳ đó.',
      soSangTac: 'Bài hát bạn có phần sáng tác',
      nhipTq: 'Chu kỳ báo cáo tác quyền',
      nhipTq1: 'Các tổ chức quản lý tác quyền (VCPMC ở Việt Nam, The MLC ở Mỹ, ASCAP, PRS, GEMA và các tổ chức khác) chốt sổ theo <b>quý</b>, không theo tháng.',
      nhipTq2: 'Các tổ chức này báo cáo <b>trễ một đến hai quý</b> so với thời điểm bài hát thực tế được nghe. Vì vậy tác quyền của một bài hát được nghe hôm nay thường khoảng nửa năm sau mới có trong báo cáo.',
      nhipTq3: 'Do đó phần lớn các kỳ <b>không có báo cáo tác quyền nào</b>. Đây là điều bình thường, không có nghĩa là bài hát của bạn không có doanh thu.',
      tongTq: 'Tổng tác quyền của các kỳ đã có báo cáo',
      khongTqMo: 'Tác quyền thuộc về người sáng tác. Nếu bạn có sáng tác mà chưa thấy ở đây, phần sáng tác của bạn chưa được đăng ký. Bạn vui lòng liên hệ Haustek để bổ sung.',
      hd: 'Hợp đồng & tỷ lệ', hdMo: 'Tỷ lệ đang áp dụng cho kỳ này và căn cứ của tỷ lệ đó.',
      hdLabel: 'Thuộc label', hdDocLap: 'Loại hợp đồng', hdDocLapV: 'Độc lập, ký trực tiếp với Haustek', hdLabelV: 'Label, quản lý nghệ sĩ',
      hdPhi: 'Phí dịch vụ Haustek', hdPhiMo: 'trên doanh thu gộp',
      hdTyLe: 'Tỷ lệ bạn được hưởng', hdTyLeLb: 'Tỷ lệ nghệ sĩ được hưởng', hdTyLeMo: 'trên doanh thu sau phí dịch vụ',
      hdPhanLabel: 'Phần label được hưởng', hdPhanHt: 'Phần Haustek theo hợp đồng độc lập', hdPhanLbCua: 'Phần label được hưởng',
      hdHieuLuc: 'Hiệu lực từ kỳ', hdCanCu: 'Căn cứ', hdCanCuKhong: 'Hợp đồng gốc',
      hdThanhToan: 'Bên thanh toán', hdThanhToanV: 'Haustek thanh toán trực tiếp cho bạn theo tỷ lệ này',
      hdNguong: 'Ngưỡng thanh toán tối thiểu', hdProducer: 'Bài hát có điểm producer', hdProducerMo: 'điểm producer được khấu trừ từ phần của bạn',
      hdLichSu: 'Lịch sử tỷ lệ', hdKy: 'Từ kỳ', hdGiaDinh: 'Bản mẫu giả định Haustek thanh toán trực tiếp cho từng nghệ sĩ theo tỷ lệ do label đặt. Nếu thực tế label tự chia cho nghệ sĩ thì trang này sẽ thay đổi (câu hỏi cần chốt số 8).',
      hdTacQuyen: 'Phí quản lý tác quyền',
      hdLabelMe: 'Label mẹ', hdLabelCon: 'Label con', hdLabelConV: '{n} label con, xem trang Hệ thống label',
      moLabel: 'Label · {n} bài hát đã gửi tới nền tảng', moLabelCon: 'Label con của {p} · {n} bài hát đã gửi tới nền tảng'
    },
    en: {
      navTong: 'Overview', h1: 'Overview',
      banGhi: 'Recording revenue', tacQuyen: 'Publishing',
      veTay: 'Yours this period', gop: 'Gross revenue', luot: 'Streams', bai: 'Earning tracks',
      chuoi: 'Where the money goes on its way to you',
      chuoiMo: 'Step by step, per your contract. It adds back to the figure above.',
      dienBien: 'Across periods',
      dienBienMo: 'Only closed periods are shown. An unclosed period has no bar — that is not zero.',
      cuaHang: 'Where it was played', lanhTho: 'Which countries',
      topBai: 'Top earning tracks', xemHet: 'See all',
      chiTra: 'When the money arrives',
      seChi: 'Paid next run', duoiNguong: 'Below the payout threshold',
      duoiNguongMo: 'Your amount this period is below the {n} threshold, so it is added to next period. Nothing is lost.',
      tamUng: 'Your advance', xemUng: 'See details',
      lichChi: 'Recent periods', kyChi: 'Period', soChi: 'Transferred',
      donTiep: 'carried', truUng: 'recouped',
      nguongLa: 'The payout threshold is {n}',
      nguongLaMo: 'Below it, the amount carries to the next period rather than being lost. The threshold exists because international transfer fees eat a small amount whole — send $12 and the fee takes nearly all of it.',
      xemBangKe: 'Open this period’s statement',
      trongMo: 'Nothing this period',
      chuaMo: 'Period not open', chuaMoMo: 'This period is not closed yet. Figures open once reconciliation with every platform is finished.',
      tyGia: 'Period FX rate', chotLuc: 'locked', chuaChot: 'not locked',
      soVoi: 'vs', khac: 'others',
      khongTq: 'No registered writer share yet',
      kyCoTq: 'Periods with a publishing report',
      kyCoTqMo: 'Open one to see its figures.',
      soSangTac: 'Works you co-wrote',
      nhipTq: 'How publishing arrives',
      nhipTq1: 'Collecting societies — VCPMC in Vietnam, The MLC in the US, ASCAP, PRS, GEMA and others — settle <b>quarterly</b>, not monthly.',
      nhipTq2: 'And they report <b>one to two quarters late</b> relative to when the music actually played. So publishing on a track released today usually arrives about six months later.',
      nhipTq3: 'That is why most periods simply have <b>no report at all</b> — normal, and not a sign that your works earned nothing.',
      tongTq: 'Publishing across reported periods',
      khongTqMo: 'Publishing belongs to the writers. If you write and see nothing here, your writer share has not been registered — contact Haustek.',
      hd: 'Agreement & rate', hdMo: 'The rate applied this period and what it is based on.',
      hdLabel: 'Under label', hdDocLap: 'Agreement type', hdDocLapV: 'Independent, signed directly with Haustek', hdLabelV: 'Label, managing artists',
      hdPhi: 'Haustek service fee', hdPhiMo: 'of gross revenue',
      hdTyLe: 'Your share', hdTyLeLb: 'Paid to artists', hdTyLeMo: 'of revenue after the service fee',
      hdPhanLabel: 'Label’s share', hdPhanHt: 'Haustek’s share under the independent agreement', hdPhanLbCua: 'Label’s share',
      hdHieuLuc: 'Effective from', hdCanCu: 'Basis', hdCanCuKhong: 'Original agreement',
      hdThanhToan: 'Paid by', hdThanhToanV: 'Haustek pays you directly at this rate',
      hdNguong: 'Minimum payout', hdProducer: 'Tracks with producer points', hdProducerMo: 'producer points come off your share',
      hdLichSu: 'Rate history', hdKy: 'From', hdGiaDinh: 'The prototype assumes Haustek pays each artist directly at the rate the label set. If the label pays its artists itself, this page changes (open question 8).',
      hdTacQuyen: 'Publishing administration fee',
      hdLabelMe: 'Parent label', hdLabelCon: 'Sub-labels', hdLabelConV: '{n} sub-labels, see the Label network page',
      moLabel: 'Label · {n} tracks delivered to platforms', moLabelCon: 'Sub-label of {p} · {n} tracks delivered to platforms'
    }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t;
    var P = HB.dayMau();

    /* Label không bao giờ có tab tác quyền — tác quyền thuộc người sáng
       tác, không đi qua label. Không phải giấu; là không tồn tại. */
    var coPub = me.hasPublishing;
    if (!coPub) LUONG = 'rec';

    var s;
    try { s = api.summary(me.role, me.partyId, c.kyKey, LUONG); }
    catch (e) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>' }) +
        HM.the({ than: HM.trong({ icon: 'clock', tieuDe: t('chuaMo'), moTa: t('chuaMoMo') }) });
      return;
    }

    /* Không lặp ô số ở đầu trang: dải ô số ngay dưới đã có đủ, kèm so
       sánh với kỳ trước. Đầu trang chỉ mang tên và câu dẫn. */
    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>',
      mo: HM.esc(c.song(me, 'belongsTo') ? (c.lang === 'vi'
        ? (me.independent ? 'Hợp đồng độc lập với Haustek' : 'Nghệ sĩ thuộc ' + me.belongsTo)
        : (me.independent ? 'Independent agreement with Haustek' : 'Artist under ' + me.belongsTo))
        : (me.parentLabel ? t('moLabelCon').replace('{p}', me.parentLabel.name) : t('moLabel')).replace('{n}', HT.fmt.n(me.trackCount)))
    });

    if (coPub) {
      html += HM.tabs([
        { k: 'rec', l: t('banGhi'), icon: 'disc' },
        { k: 'pub', l: t('tacQuyen'), icon: 'book' }
      ], LUONG);
    }

    if (s.emptyReason) {
      html += HM.the({
        than: HM.trong({ icon: LUONG === 'pub' ? 'cal' : 'empty',
          tieuDe: t('trongMo'), moTa: c.song(s, 'emptyReason'),
          nut: s.nextPub ? '<button type="button" class="btn pri" data-kyto="' + HM.esc(s.nextPub.k) + '">' +
            HM.esc((c.lang === 'vi' ? 'Xem kỳ ' : 'See ') + s.nextPub.label) + '</button>' : '' })
      });
      /* Ô trống không được là ngõ cụt. Người mở tab này đang hỏi "tiền tác
         quyền của tôi đâu"; trả lời "kỳ này chưa có" rồi để trắng nửa màn
         là bỏ dở câu trả lời ngay giữa chừng. */
      if (LUONG === 'pub') html += veTacQuyenTrong(c);
      root.innerHTML = html;
      HB.gan(root);
      HM.bam(root, '[data-tab]', function (el) { LUONG = el.getAttribute('data-tab'); c.veLai(); });
      HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
      return;
    }

    /* ---- ô số lớn ---- */
    html += HM.so([
      { l: t('veTay'), v: HT.fmt.usd(s.total), lon: true,
        s: s.prevTotal != null ? HM.lechHtml(s.total, s.prevTotal, s.prevLabel) : '', sHtml: true },
      { l: t('gop'), v: HT.fmt.usd0(s.gross),
        s: c.lang === 'vi' ? 'trước các khoản khấu trừ' : 'before deductions' },
      s.streams != null ? { l: t('luot'), v: HT.fmt.n(s.streams),
        s: s.prevStreams != null ? HM.lechHtml(s.streams, s.prevStreams, s.prevLabel) : '', sHtml: true } : null,
      { l: t('tyGia'), v: HT.fmt.n(s.fx.rate) + ' ₫',
        s: s.fx.locked ? t('chotLuc') + ' ' + HT.fmt.ngay(s.fx.at) : t('chuaChot') }
    ].filter(Boolean));

    /* ---- chuỗi tiền ---- */
    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('chuoi')), p: HM.esc(t('chuoiMo')),
        than: '<div class="wf">' + s.chain.map(function (b) {
          return '<div class="st ' + (b.kind === 'out' ? 'out' : b.kind === 'final' ? 'fin' : '') + '">' +
            '<div class="mk"></div>' +
            '<div><div class="lbl">' + HM.esc(c.song(b, 'label')) + '</div>' +
            (c.song(b, 'note') ? '<div class="nt">' + HM.esc(c.song(b, 'note')) + '</div>' : '') + '</div>' +
            '<div class="amt">' + HM.esc(HT.fmt.usd(b.value)) + '</div></div>';
        }).join('') + '</div>' +
        '<div style="margin-top:16px">' + HB.o({ loai: 'thac', cao: 190,
          buoc: s.chain.map(function (b) {
            return { l: c.song(b, 'label'), v: b.value, nt: c.song(b, 'note'),
                     kind: b.kind === 'top' ? 'top' : b.kind === 'final' ? 'final' : 'out' };
          }) }) + '</div>'
      }) +
      veKhiNao(c, s) + '</div>';

    /* ---- hợp đồng & tỷ lệ ---- */
    html += veHopDong(c);

    /* ---- diễn biến ---- */
    var xh = api.trend(me.role, me.partyId, LUONG);
    html += HM.the({
      h2: HM.esc(t('dienBien')), p: HM.esc(t('dienBienMo')),
      than: HB.o({
        loai: 'cot', cao: 220, hienGiaTri: true, chuThich: false,
        truc: xh.points.map(function (x) { return x.label; }),
        tieuDeTip: function (i) { return (c.lang === 'vi' ? 'Kỳ ' : 'Period ') + xh.points[i].label; },
        chuTrong: c.lang === 'vi' ? 'Kỳ này chưa chốt sổ' : 'Period not closed yet',
        chuoi: [{ ten: t('veTay'), gt: xh.points.map(function (x) { return x.value; }), mau: P[0] }],
        noiBat: (function () {
          for (var i = 0; i < xh.points.length; i++) if (xh.points[i].k === c.kyKey) return i;
          return -1;
        })()
      }),
      chan: (function () {
        var mo = xh.points.filter(function (x) { return x.open; });
        var tong = mo.reduce(function (a, x) { return a + x.value; }, 0);
        return (c.lang === 'vi' ? 'Tổng ' + mo.length + ' kỳ đã chốt sổ: ' : mo.length + ' closed periods total: ') +
          '<b>' + HM.esc(HT.fmt.usd(tong)) + '</b>';
      })()
    });

    /* ---- cửa hàng & lãnh thổ ---- */
    var ch = api.breakdown(me.role, me.partyId, c.kyKey, LUONG, 'store');
    var lt = api.breakdown(me.role, me.partyId, c.kyKey, LUONG, 'terr');
    html += '<div class="grid g2">' +
      HM.the({
        h2: HM.esc(t('cuaHang')),
        p: HM.esc(c.lang === 'vi'
          ? 'Thu nhập của bạn, tách theo từng nền tảng.'
          : 'Your money, split by where the track was played.'),
        /* Dòng đuôi gộp các nền tảng nhỏ: giá trị của nó vẫn nằm trong
           tổng, chỉ đổi cách gọi tên (tên hai thứ tiếng từ tầng dữ liệu
           nếu có, không thì "n nền tảng khác" như trước). */
        than: HB.o({ loai: 'thanh', hang: ch.rows.map(function (r, i) {
          return { ten: c.song(r, 'name'), gt: r.value, mau: P[i % 8] };
        }).concat(ch.tail ? [{ ten: ch.tail.name ? c.song(ch.tail, 'name') + ' (' + HT.fmt.n(ch.tail.count) + ')' : ch.tail.count + ' ' + t('khac'),
                              gt: ch.tail.value, mau: HB.mau('neutral-bar') }] : []) }),
        chan: ch.tail
          ? (c.lang === 'vi' ? 'Còn ' + ch.tail.count + ' nền tảng khác được gộp vào dòng cuối. Tổng vẫn đúng bằng ' : ch.tail.count + ' more, folded into the last row — the total is still ') +
            '<b>' + HM.esc(HT.fmt.usd(s.total)) + '</b>'
          : ''
      }) +
      HM.the({
        h2: HM.esc(t('lanhTho')),
        than: HB.o({ loai: 'thanh', hang: lt.rows.slice(0, 8).map(function (r, i) {
          return { ten: r.name, gt: r.value, mau: P[i % 8] };
        }) })
      }) + '</div>';

    /* ---- top bài ---- */
    var bg = api.tracks(me.role, me.partyId, c.kyKey, LUONG, { sort: 'mine', dir: -1 });
    html += HM.the({
      h2: HM.esc(t('topBai')),
      p: HT.fmt.n(bg.total) + (c.lang === 'vi' ? ' bài hát có doanh thu trong kỳ' : ' tracks earned this period'),
      hanhDong: '<button type="button" class="btn sm" data-di="k-ban-ghi">' + HM.esc(t('xemHet')) + '</button>',
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr>' +
        '<th>' + (c.lang === 'vi' ? 'Bài hát' : 'Track') + '</th>' +
        (LUONG === 'rec' ? '<th class="num">' + HM.esc(t('luot')) + '</th>' : '') +
        '<th class="num">' + HM.esc(t('gop')) + '</th>' +
        '<th class="num band">' + HM.esc(t('veTay')) + '</th></tr></thead><tbody>' +
        bg.rows.slice(0, 10).map(function (r) {
          return '<tr class="pick" data-bg="' + r.id + '">' +
            '<td><div class="t-ttl">' + HM.esc(HM.dai(r.title, 36)) + '</div>' +
            '<div class="t-sub">' + HM.esc(r.isrc) + ' · ' + HM.esc(r.type) + '</div></td>' +
            (LUONG === 'rec' ? '<td class="num">' + HM.esc(HT.fmt.n(r.streams)) + '</td>' : '') +
            '<td class="num">' + HM.esc(HT.fmt.usd0(r.gross)) + '</td>' +
            '<td class="num band">' + HM.esc(HT.fmt.usd(r.mine)) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
    });

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { LUONG = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
    HM.bam(root, '[data-bg]', function (el) { moBai(c, +el.getAttribute('data-bg'), LUONG); });
  }
});

/* =====================================================================
   Kỳ tác quyền trống — nói cho hết câu
   ===================================================================== */
function veTacQuyenTrong(c) {
  var t = c.t, me = c.phien.me, api = c.api, P = HB.dayMau();
  var kyCo = c.phien.kyTacQuyen || [];

  var soLieu = kyCo.map(function (p) {
    try { return { k: p.k, label: p.label, v: api.summary(me.role, me.partyId, p.k, 'pub').total }; }
    catch (e) { return null; }
  }).filter(Boolean);
  var tong = soLieu.reduce(function (s, x) { return s + x.v; }, 0);

  var html = '<div class="grid g3">' +
    HM.the({
      h2: HM.esc(t('nhipTq')),
      than: '<p class="say">' + t('nhipTq1') + '</p>' +
        '<p class="say">' + t('nhipTq2') + '</p>' +
        '<p class="say">' + t('nhipTq3') + '</p>' +
        (soLieu.length
          ? '<div style="margin-top:16px">' + HB.o({
              loai: 'cot', cao: 170, hienGiaTri: true, chuThich: false,
              truc: soLieu.map(function (x) { return x.label; }),
              tieuDeTip: function (i) { return (c.lang === 'vi' ? 'Kỳ ' : 'Period ') + soLieu[i].label; },
              chuoi: [{ ten: c.lang === 'vi' ? 'Tác quyền' : 'Publishing',
                        gt: soLieu.map(function (x) { return x.v; }), mau: P[3] }]
            }) + '</div>'
          : '')
    }) +
    HM.the({
      h2: HM.esc(t('kyCoTq')), p: HM.esc(t('kyCoTqMo')),
      than: HM.so([
        { l: t('soSangTac'), v: HT.fmt.n(me.compositionCount) },
        { l: t('tongTq'), v: HT.fmt.usd0(tong) }
      ]) +
      (kyCo.length
        ? '<div class="btnrow" style="margin-top:14px">' + kyCo.slice().reverse().map(function (p) {
            return '<button type="button" class="pill" data-kyto="' + HM.esc(p.k) + '">' +
              HM.esc(p.label) + '</button>';
          }).join('') + '</div>'
        : '<p class="hint" style="margin-top:12px">' + HM.esc(c.lang === 'vi'
            ? 'Chưa có kỳ nào có báo cáo tác quyền đã chốt sổ.'
            : 'No period has a closed publishing report yet.') + '</p>')
    }) + '</div>';

  return html;
}

/* =====================================================================
   Thẻ "Hợp đồng & tỷ lệ": tỷ lệ đang áp, hiệu lực từ kỳ nào, căn cứ, ai
   thanh toán. Trước đây ca sĩ thuộc label không có chỗ nào nói họ thuộc
   label nào và tỷ lệ bao nhiêu; đây là chỗ đó.
   ===================================================================== */
function veHopDong(c) {
  var t = c.t, me = c.phien.me, api = c.api;
  var hd;
  try { hd = api.contract(me.role, me.partyId, c.kyKey); } catch (e) { return ''; }
  var la = hd.kind === 'label', thuocLabel = hd.kind === 'artist-label';
  var rows = [
    /* Label con nói rõ mình thuộc label mẹ nào; label mẹ nói mình có bao
       nhiêu label con và chỉ sang trang Hệ thống label. */
    hd.parentLabel ? { t: t('hdLabelMe'), v: hd.parentLabel.name + ' · ' + hd.parentLabel.clientId, manh: true } : null,
    thuocLabel ? { t: t('hdLabel'), v: hd.label.name + ' · ' + hd.label.clientId, manh: true } : null,
    !thuocLabel ? { t: t('hdDocLap'), v: la ? t('hdLabelV') : t('hdDocLapV') } : null,
    hd.childLabels > 0 ? { t: t('hdLabelCon'), vHtml: true,
      v: HM.esc(t('hdLabelConV').replace('{n}', HT.fmt.n(hd.childLabels))).replace(
        HM.esc(c.lang === 'vi' ? 'xem trang Hệ thống label' : 'see the Label network page'),
        '<a href="#k-he-thong">' + HM.esc(c.lang === 'vi' ? 'xem trang Hệ thống label' : 'see the Label network page') + '</a>') } : null,
    { t: t('hdPhi'), v: HT.fmt.pct(hd.haustekFee) + ' ' + t('hdPhiMo') },
    { t: la ? t('hdTyLeLb') : t('hdTyLe'), v: HT.fmt.pct(hd.artistShare) + ' ' + t('hdTyLeMo'), manh: !la },
    { t: la ? t('hdPhanLbCua') : (thuocLabel ? t('hdPhanLabel') : t('hdPhanHt')), v: HT.fmt.pct(hd.counterpartShare) + ' ' + t('hdTyLeMo'), manh: la },
    { t: t('hdHieuLuc'), v: hd.effectiveFrom || '—' },
    { t: t('hdCanCu'), v: hd.basis || t('hdCanCuKhong') },
    !la ? { t: t('hdThanhToan'), v: t('hdThanhToanV') } : null,
    { t: t('hdNguong'), v: HT.fmt.usd0(hd.payoutThreshold) },
    !la && hd.producerTracks ? { t: t('hdProducer'), v: HT.fmt.n(hd.producerTracks) + ' · ' + t('hdProducerMo') } : null,
    me.hasPublishing ? { t: t('hdTacQuyen'), v: HT.fmt.pct(hd.pubFee) } : null
  ];
  var lichSu = hd.history.length > 1
    ? '<h4 class="sec">' + HM.esc(t('hdLichSu')) + '</h4><div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' +
      HM.esc(t('hdKy')) + '</th><th class="num">' + HM.esc(la ? t('hdTyLeLb') : t('hdTyLe')) + '</th><th>' + HM.esc(t('hdCanCu')) + '</th></tr></thead><tbody>' +
      hd.history.map(function (h) {
        return '<tr><td class="mono">' + HM.esc(h.from) + '</td><td class="num">' + HM.esc(HT.fmt.pct(h.artistShare)) + '</td><td>' + HM.esc(h.note || t('hdCanCuKhong')) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    : '';
  /* Có lịch sử tỷ lệ thì bảng lịch sử đứng cột phải; không có thì chia
     đôi danh sách khoá–giá trị, đừng để trống nửa thẻ. */
  var co = rows.filter(Boolean), nua = Math.ceil(co.length / 2);
  var than = lichSu
    ? '<div class="grid g2" style="margin-bottom:0"><div>' + HM.kv(co) + '</div><div>' + lichSu + '</div></div>'
    : '<div class="grid g2" style="margin-bottom:0"><div>' + HM.kv(co.slice(0, nua)) + '</div><div>' + HM.kv(co.slice(nua)) + '</div></div>';
  return HM.the({
    h2: HM.esc(t('hd')), p: HM.esc(t('hdMo')),
    than: than,
    chan: thuocLabel ? HM.esc(t('hdGiaDinh')) : ''
  });
}

/* =====================================================================
   Thẻ "khi nào tiền vào tài khoản"
   ===================================================================== */
function veKhiNao(c, s) {
  var t = c.t, P = HB.dayMau();
  var p = s.payout;
  var than = '';

  if (!p) {
    than = '<p class="say">' + HM.esc(c.lang === 'vi'
      ? 'Kỳ này chưa có số liệu thanh toán.'
      : 'No payout record for this period.') + '</p>';
  } else if (p.payable > 0) {
    than = HM.so([{ l: t('seChi'), v: HT.fmt.usd(p.payable), lon: true, mau: HB.mau('ok') }]) +
      '<p class="say" style="margin-top:12px">' + HM.esc(c.lang === 'vi'
        ? 'Khoản này sẽ được chuyển khoản trong đợt thanh toán tới.'
        : 'This will be transferred in the next payout run.') + '</p>';
  } else if (p.carryOut > 0) {
    than = HM.so([{ l: t('duoiNguong'), v: HT.fmt.usd(p.carryOut), lon: true, mau: HB.mau('warn') }]) +
      '<p class="say" style="margin-top:12px">' +
      HM.esc(t('duoiNguongMo').replace('{n}', HT.fmt.usd0(p.threshold))) + '</p>' +
      '<div class="meter" style="margin-top:10px"><i style="width:' +
        Math.min(100, p.carryOut / p.threshold * 100).toFixed(1) + '%;background:' + P[4] + '"></i></div>' +
      '<div class="hint">' + HM.esc(HT.fmt.usd(p.carryOut) + ' / ' + HT.fmt.usd0(p.threshold)) + '</div>';
  } else {
    than = '<p class="say">' + HM.esc(c.lang === 'vi'
      ? 'Kỳ này toàn bộ phần bạn được hưởng đã được khấu trừ vào tạm ứng, nên không có khoản nào được thanh toán.'
      : 'Everything you earned this period went against your advance, so there is no transfer.') + '</p>';
  }

  if (p && p.coversBothStreams) {
    than += '<div class="hint" style="margin-top:10px">' + HM.esc(c.lang === 'vi'
      ? 'Số thanh toán này tính trên cả doanh thu bản ghi và tác quyền cộng lại, không chỉ dòng tiền bạn đang xem. Tổng được hưởng của cả hai dòng tiền kỳ này: ' + HT.fmt.usd(p.earnedAllStreams) + '.'
      : 'This payout covers BOTH recording and publishing combined, not just the stream you are viewing. Total earned across both: ' + HT.fmt.usd(p.earnedAllStreams) + '.') + '</div>';
  }
  if (p && p.carryIn > 0) {
    than += '<div class="hint">' + HM.esc(c.lang === 'vi'
      ? 'Đã cộng ' + HT.fmt.usd(p.carryIn) + ' chuyển từ kỳ trước.'
      : HT.fmt.usd(p.carryIn) + ' carried in from the previous period is included.') + '</div>';
  }

  /* Lịch sử chi trả vài kỳ gần nhất. Thẻ này nếu chỉ có một con số thì
     bỏ trống hơn nửa chiều cao, mà câu hỏi "kỳ trước tôi được bao nhiêu"
     là câu hỏi ngay sau đó — trả lời luôn ở đây thay vì bắt đi tìm. */
  var gan = c.kys.slice(-4).reverse().map(function (kp) {
    try {
      var x = c.api.summary(c.phien.me.role, c.phien.me.partyId, kp.k, 'rec');
      return { k: kp.k, label: kp.label, p: x.payout };
    } catch (e) { return null; }
  }).filter(function (x) { return x && x.p; });

  if (gan.length) {
    than += '<h4 class="sec">' + HM.esc(t('lichChi')) + '</h4>' +
      '<div class="tw"><table class="t" style="min-width:0"><thead><tr>' +
      '<th>' + HM.esc(t('kyChi')) + '</th><th class="num">' + HM.esc(t('soChi')) + '</th>' +
      '</tr></thead><tbody>' + gan.map(function (x) {
        return '<tr' + (x.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '>' +
          '<td class="mono">' + HM.esc(x.label) + '</td>' +
          '<td class="num">' + (x.p.payable > 0
            ? HM.esc(HT.fmt.usd(x.p.payable))
            : '<span class="muted">' + HM.esc(x.p.carryOut > 0 ? t('donTiep') : t('truUng')) + '</span>') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  than += '<h4 class="sec">' + HM.esc(t('nguongLa').replace('{n}',
      HT.fmt.usd0(p ? p.threshold : 50))) + '</h4>' +
    '<p class="say" style="font-size:12.5px">' + HM.esc(t('nguongLaMo')) + '</p>' +
    '<div class="btnrow" style="margin-top:12px">' +
    '<button type="button" class="btn sm" data-di="k-bang-ke">' + HM.esc(t('xemBangKe')) + '</button></div>';

  if (s.advance) {
    than += '<h4 class="sec">' + HM.esc(t('tamUng')) + '</h4>' +
      HM.kv([
        { t: c.lang === 'vi' ? 'Số đã tạm ứng' : 'Advanced', v: HT.fmt.usd0(s.advance.opening) },
        { t: c.lang === 'vi' ? 'Khấu trừ kỳ này' : 'Recouped this period', v: HT.fmt.usd(s.advance.recoupedThisPeriod) },
        { t: c.lang === 'vi' ? 'Còn phải khấu trừ' : 'Left', v: HT.fmt.usd(s.advance.left), manh: true }
      ]) +
      '<div class="meter" style="margin-top:8px"><i style="width:' +
      Math.max(0, Math.min(100, (1 - s.advance.left / Math.max(s.advance.opening, 1)) * 100)).toFixed(1) +
      '%;background:' + P[6] + '"></i></div>' +
      '<div class="btnrow" style="margin-top:12px">' +
      '<button type="button" class="btn sm" data-di="k-tam-ung">' + HM.esc(t('xemUng')) + '</button></div>';
  }

  return HM.the({ h2: HM.esc(t('chiTra')), than: than });
}

/* =====================================================================
   Ngăn trượt — một bài
   ===================================================================== */
function moBai(c, id, luong) {
  var api = c.api, me = c.phien.me, P = HB.dayMau();
  var d;
  try { d = api.trackDetail(me.role, me.partyId, c.kyKey, luong, id); }
  catch (e) { c.thongBao(e.message, 'no'); return; }

  c.nganTruot(
    HM.so([
      { l: c.lang === 'vi' ? 'Thu nhập của bạn' : 'Yours', v: HT.fmt.usd(d.mine), lon: true },
      d.streams != null ? { l: c.lang === 'vi' ? 'Lượt nghe' : 'Streams', v: HT.fmt.n(d.streams) } : null
    ].filter(Boolean)) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Chi tiết dòng tiền của bài hát này' : 'This track’s money') + '</h4>' +
    '<div class="wf">' + d.steps.map(function (st) {
      return '<div class="st ' + (st.strong ? 'fin' : (st.value != null && st.value < 0 ? 'out' : '')) + '">' +
        '<div class="mk"></div><div><div class="lbl">' + HM.esc(c.song(st, 'label')) + '</div></div>' +
        '<div class="amt">' + HM.esc(st.value != null ? HT.fmt.usd(st.value) : st.text) + '</div></div>';
    }).join('') + '</div>' +
    (d.byStore.length ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Thu nhập theo nền tảng' : 'Where it was played') + '</h4>' +
      HB.o({ loai: 'thanh', hang: d.byStore.map(function (x, i) { return { ten: c.song(x, 'name'), gt: x.value, mau: P[i % 8] }; }) }) : '') +
    (d.byTerritory.length ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Thu nhập theo thị trường' : 'From where') + '</h4>' +
      HB.o({ loai: 'thanh', hang: d.byTerritory.map(function (x, i) { return { ten: x.name, gt: x.value, mau: P[i % 8] }; }) }) : ''),
    { tieuDe: d.title, phu: d.isrc + ' · ' + d.type,
      khiMo: function (dr) { HB.gan(dr); } });
}

})();
