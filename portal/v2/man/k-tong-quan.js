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
      veTay: 'Về tay bạn kỳ này', gop: 'Doanh thu gộp', luot: 'Lượt nghe', bai: 'Bài có doanh thu',
      chuoi: 'Tiền đi đâu trên đường về tay bạn',
      chuoiMo: 'Từng chặng một, theo đúng hợp đồng. Cộng lại đúng bằng con số ở trên.',
      dienBien: 'Diễn biến qua các kỳ',
      dienBienMo: 'Chỉ hiện kỳ đã chốt sổ. Kỳ chưa chốt không có vạch — không phải bằng 0.',
      cuaHang: 'Nghe ở đâu', lanhTho: 'Nghe từ nước nào',
      topBai: 'Bài kiếm nhiều nhất kỳ này', xemHet: 'Xem tất cả',
      chiTra: 'Khi nào tiền vào tài khoản',
      seChi: 'Sẽ chi kỳ tới', duoiNguong: 'Dưới ngưỡng chi trả',
      duoiNguongMo: 'Số của bạn kỳ này dưới ngưỡng {n} nên được cộng dồn sang kỳ sau. Tiền không mất đi đâu cả.',
      tamUng: 'Khoản tạm ứng', xemUng: 'Xem chi tiết',
      lichChi: 'Các kỳ gần đây', kyChi: 'Kỳ', soChi: 'Đã chuyển',
      donTiep: 'dồn tiếp', truUng: 'trừ tạm ứng',
      nguongLa: 'Ngưỡng chi trả là {n}',
      nguongLaMo: 'Dưới ngưỡng thì khoản đó dồn sang kỳ sau chứ không mất. Ngưỡng tồn tại vì phí chuyển khoản quốc tế ăn hết một khoản nhỏ — chuyển $12 thì phí nuốt gần hết $12.',
      xemBangKe: 'Mở bảng kê kỳ này',
      trongMo: 'Kỳ này chưa có gì',
      chuaMo: 'Kỳ chưa mở', chuaMoMo: 'Kỳ này chưa được chốt sổ. Số liệu chỉ mở sau khi đối chiếu xong với tất cả các nền tảng.',
      tyGia: 'Tỷ giá kỳ này', chotLuc: 'chốt lúc', chuaChot: 'chưa chốt',
      soVoi: 'so với kỳ', khac: 'nơi khác',
      khongTq: 'Bạn chưa có bài nào đăng ký phần sáng tác',
      kyCoTq: 'Những kỳ đã có báo cáo tác quyền',
      kyCoTqMo: 'Bấm vào một kỳ để xem số của kỳ đó.',
      soSangTac: 'Bài bạn có phần sáng tác',
      nhipTq: 'Tác quyền về theo nhịp nào',
      nhipTq1: 'Các tổ chức quản lý quyền — VCPMC ở Việt Nam, The MLC ở Mỹ, ASCAP, PRS, GEMA và những nơi khác — chốt sổ theo <b>quý</b>, không phải theo tháng.',
      nhipTq2: 'Rồi họ báo cáo về <b>trễ một tới hai quý</b> so với lúc bài thật sự được phát. Nên tiền tác quyền của một bài phát hôm nay thường về sau nửa năm.',
      nhipTq3: 'Vì vậy phần lớn các kỳ đơn giản là <b>không có báo cáo nào</b> — và đó là chuyện bình thường, không phải bài của bạn không phát sinh.',
      tongTq: 'Tổng tác quyền các kỳ đã có',
      khongTqMo: 'Tác quyền thuộc về người sáng tác. Nếu bạn có sáng tác mà chưa thấy ở đây thì phần sáng tác chưa được đăng ký — liên hệ Haustek để bổ sung.'
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
      khongTqMo: 'Publishing belongs to the writers. If you write and see nothing here, your writer share has not been registered — contact Haustek.'
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

    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>',
      so: [
        { l: t('veTay'), v: HT.fmt.usd(s.total) },
        s.streams != null ? { l: t('luot'), v: HB.gonSo(s.streams) } : null,
        { l: t('bai'), v: HT.fmt.n(s.tracks) }
      ].filter(Boolean)
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
          tieuDe: t('trongMo'), moTa: s.emptyReason,
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
        s: c.lang === 'vi' ? 'trước mọi khoản trừ' : 'before deductions' },
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
            '<div><div class="lbl">' + HM.esc(b.label) + '</div>' +
            (b.note ? '<div class="nt">' + HM.esc(b.note) + '</div>' : '') + '</div>' +
            '<div class="amt">' + HM.esc(HT.fmt.usd(b.value)) + '</div></div>';
        }).join('') + '</div>' +
        '<div style="margin-top:16px">' + HB.o({ loai: 'thac', cao: 190,
          buoc: s.chain.map(function (b) {
            return { l: b.label, v: b.value, nt: b.note,
                     kind: b.kind === 'top' ? 'top' : b.kind === 'final' ? 'final' : 'out' };
          }) }) + '</div>'
      }) +
      veKhiNao(c, s) + '</div>';

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
        return (c.lang === 'vi' ? 'Cộng ' + mo.length + ' kỳ đã chốt: ' : mo.length + ' closed periods total: ') +
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
          ? 'Số tiền của bạn, bóc theo nơi bài được nghe.'
          : 'Your money, split by where the track was played.'),
        than: HB.o({ loai: 'thanh', hang: ch.rows.map(function (r, i) {
          return { ten: r.name, gt: r.value, mau: P[i % 8] };
        }).concat(ch.tail ? [{ ten: ch.tail.count + ' ' + t('khac'), gt: ch.tail.value, mau: HB.mau('neutral-bar') }] : []) }),
        chan: ch.tail
          ? (c.lang === 'vi' ? 'Còn ' + ch.tail.count + ' nơi nữa, gộp vào dòng cuối — tổng vẫn đúng bằng ' : ch.tail.count + ' more, folded into the last row — the total is still ') +
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
      p: HT.fmt.n(bg.total) + (c.lang === 'vi' ? ' bài có doanh thu trong kỳ' : ' tracks earned this period'),
      hanhDong: '<button type="button" class="btn sm" data-di="k-ban-ghi">' + HM.esc(t('xemHet')) + '</button>',
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr>' +
        '<th>' + (c.lang === 'vi' ? 'Bài' : 'Track') + '</th>' +
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
            ? 'Chưa kỳ nào có báo cáo tác quyền được chốt sổ.'
            : 'No period has a closed publishing report yet.') + '</p>')
    }) + '</div>';

  return html;
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
      ? 'Kỳ này chưa có bảng chi trả.'
      : 'No payout record for this period.') + '</p>';
  } else if (p.payable > 0) {
    than = HM.so([{ l: t('seChi'), v: HT.fmt.usd(p.payable), lon: true, mau: HB.mau('ok') }]) +
      '<p class="say" style="margin-top:12px">' + HM.esc(c.lang === 'vi'
        ? 'Khoản này sẽ được chuyển trong kỳ chi trả tới.'
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
      ? 'Kỳ này toàn bộ phần bạn kiếm được đi trừ vào khoản tạm ứng, nên chưa có khoản chuyển đi.'
      : 'Everything you earned this period went against your advance, so there is no transfer.') + '</p>';
  }

  if (p && p.coversBothStreams) {
    than += '<div class="hint" style="margin-top:10px">' + HM.esc(c.lang === 'vi'
      ? 'Con số chi trả này tính trên CẢ doanh thu bản ghi lẫn tác quyền cộng lại — không chỉ dòng tiền bạn đang xem. Tổng kiếm được cả hai dòng kỳ này: ' + HT.fmt.usd(p.earnedAllStreams) + '.'
      : 'This payout covers BOTH recording and publishing combined, not just the stream you are viewing. Total earned across both: ' + HT.fmt.usd(p.earnedAllStreams) + '.') + '</div>';
  }
  if (p && p.carryIn > 0) {
    than += '<div class="hint">' + HM.esc(c.lang === 'vi'
      ? 'Đã cộng ' + HT.fmt.usd(p.carryIn) + ' dồn từ kỳ trước.'
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
        { t: c.lang === 'vi' ? 'Đã ứng' : 'Advanced', v: HT.fmt.usd0(s.advance.opening) },
        { t: c.lang === 'vi' ? 'Trừ kỳ này' : 'Recouped this period', v: HT.fmt.usd(s.advance.recoupedThisPeriod) },
        { t: c.lang === 'vi' ? 'Còn lại' : 'Left', v: HT.fmt.usd(s.advance.left), manh: true }
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
      { l: c.lang === 'vi' ? 'Về tay bạn' : 'Yours', v: HT.fmt.usd(d.mine), lon: true },
      d.streams != null ? { l: c.lang === 'vi' ? 'Lượt nghe' : 'Streams', v: HT.fmt.n(d.streams) } : null
    ].filter(Boolean)) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Tiền của bài này' : 'This track’s money') + '</h4>' +
    '<div class="wf">' + d.steps.map(function (st) {
      return '<div class="st ' + (st.strong ? 'fin' : (st.value != null && st.value < 0 ? 'out' : '')) + '">' +
        '<div class="mk"></div><div><div class="lbl">' + HM.esc(st.label) + '</div></div>' +
        '<div class="amt">' + HM.esc(st.value != null ? HT.fmt.usd(st.value) : st.text) + '</div></div>';
    }).join('') + '</div>' +
    (d.byStore.length ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Nghe ở đâu' : 'Where it was played') + '</h4>' +
      HB.o({ loai: 'thanh', hang: d.byStore.map(function (x, i) { return { ten: x.name, gt: x.value, mau: P[i % 8] }; }) }) : '') +
    (d.byTerritory.length ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Từ nước nào' : 'From where') + '</h4>' +
      HB.o({ loai: 'thanh', hang: d.byTerritory.map(function (x, i) { return { ten: x.name, gt: x.value, mau: P[i % 8] }; }) }) : ''),
    { tieuDe: d.title, phu: d.isrc + ' · ' + d.type,
      khiMo: function (dr) { HB.gan(dr); } });
}

})();
