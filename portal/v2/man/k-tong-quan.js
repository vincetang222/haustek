/* =====================================================================
   CỔNG ĐỐI TÁC · TỔNG QUAN
   ---------------------------------------------------------------------
   Người mở màn này là nghệ sĩ hoặc label, không phải kế toán. Họ có đúng
   ba câu hỏi, và màn phải trả lời theo thứ tự đó:
     1. Kỳ này tôi được bao nhiêu, và so với kỳ trước thì sao?
     2. Tiền đó đã vào ví chưa, rút được bao nhiêu, kỳ tới bao giờ về?
     3. Tiền đến từ đâu: nền tảng, thị trường, bài hát, nghệ sĩ nào?

   Từ lõi 1.3 đối tác CHỈ thấy số NET. "Doanh thu" của label là phần trả
   nghệ sĩ cộng phần label; "thu nhập" của nghệ sĩ là phần của chính họ.
   Các khoản khấu trừ theo hợp đồng nằm trong bảng kê PDF Haustek gửi, không
   xuất hiện ở đây. Cái màn này KHÔNG được làm: bắt người ta tự cộng, tự
   suy, hay tự đoán vì sao kỳ này ít hơn kỳ trước.
   ===================================================================== */
"use strict";
(function () {

var LUONG = 'rec';   /* rec = doanh thu bản ghi · pub = tác quyền */

HT.dangKy({
  id: 'k-tong-quan', nav: 'navTong', icon: 'grid',

  chu: {
    vi: {
      nhomBai: 'Bài hát', nhomLabel: 'Label', nhomTaiChinh: 'Tài chính', nhomHoTro: 'Hỗ trợ',
      navTong: 'Tổng quan', h1: 'Tổng quan',
      banGhi: 'Doanh thu bản ghi', tacQuyen: 'Tác quyền',
      veTay: 'Thu nhập kỳ này', veTayLb: 'Phần label được hưởng kỳ này',
      doanhThu: 'Doanh thu', doanhThuMo: 'phần nghệ sĩ và phần label cộng lại',
      traNs: 'Thanh toán cho nghệ sĩ', cuaDoanhThu: 'của doanh thu',
      luot: 'Lượt nghe', bai: 'Bài hát có doanh thu', baiMo: 'trong kỳ này',
      tyGia: 'Tỷ giá kỳ này', chotLuc: 'đã chốt ngày', chuaChot: 'chưa chốt',
      dienBien: 'Diễn biến qua các kỳ',
      dienBienMo: 'Chỉ các kỳ đã xét duyệt. Kỳ chưa xét duyệt để trống, không phải bằng 0.',
      tongKy: 'Tổng {n} kỳ đã xét duyệt', duKien: 'Dự kiến kỳ {k}', xemDuBao: 'Xem dự báo',
      vi: 'Ví của bạn', viMo: 'Mỗi kỳ được xét duyệt thì phần của bạn được ghi vào ví. Bạn rút khi muốn.',
      khaDung: 'Số dư khả dụng', dangXuLy: 'đang xử lý', daRut: 'đã rút',
      rut: 'Rút tiền', moVi: 'Mở ví',
      duoiNguong: 'Số dư khả dụng dưới ngưỡng rút tối thiểu {n}. Khoản này vẫn nằm trong ví và cộng dồn với kỳ sau.',
      ghiKy: 'Ghi vào ví kỳ này', ghiKyTru: 'sau khấu trừ tạm ứng',
      kyTiep: 'Kỳ tiếp theo dự kiến ghi vào ví', kyTiepKhong: 'Mọi kỳ có báo cáo đều đã ghi vào ví',
      nhip: 'Nhịp ghi vào ví', gan: 'Các kỳ gần đây', kyChi: 'Kỳ', soGhi: 'Ghi vào ví',
      tamUng: 'Khoản tạm ứng', xemUng: 'Xem chi tiết', daUng: 'Số đã tạm ứng', truKy: 'Khấu trừ kỳ này', conTru: 'Còn phải khấu trừ',
      chuoi: 'Chi tiết dòng tiền', chuoiMo: 'Doanh thu của kỳ chia cho nghệ sĩ và label theo tỷ lệ bạn đã đặt.',
      cuaHang: 'Thu nhập theo nền tảng', cuaHangMo: 'Phần của bạn, tách theo nơi bài hát được nghe.',
      lanhTho: 'Thu nhập theo thị trường', lanhThoMo: 'Tám thị trường mang về nhiều nhất trong kỳ.',
      khac: 'Nền tảng khác', tong: 'tổng',
      topNs: 'Nghệ sĩ mang về nhiều nhất', topNsMo: 'Theo doanh thu kỳ này.', xemRoster: 'Xem roster',
      topBai: 'Bài hát có doanh thu cao nhất kỳ này', xemHet: 'Xem tất cả', baiKy: 'bài hát có doanh thu trong kỳ',
      cBai: 'Bài hát',
      hd: 'Hợp đồng & nhịp báo cáo', hdMo: 'Tỷ lệ đang áp dụng cho kỳ này, và tiền về ví theo nhịp nào.',
      hdLabel: 'Thuộc label', hdDocLap: 'Loại hợp đồng', hdDocLapV: 'Độc lập, ký với Haustek', hdLabelV: 'Label, quản lý nghệ sĩ',
      hdTyLe: 'Tỷ lệ bạn được hưởng', hdTyLeLb: 'Tỷ lệ nghệ sĩ được hưởng', hdPhanLabel: 'Phần label', hdPhanLbCua: 'Phần label được hưởng',
      hdHieuLuc: 'Hiệu lực từ kỳ', hdCanCu: 'Căn cứ', hdCanCuKhong: 'Hợp đồng gốc',
      hdThanhToan: 'Bên thanh toán', hdThanhToanV: 'Haustek thanh toán trực tiếp cho bạn theo tỷ lệ này',
      hdNguong: 'Ngưỡng rút tiền tối thiểu', hdProducer: 'Bài hát có điểm producer', hdProducerMo: 'điểm producer được khấu trừ từ phần của bạn',
      hdLichSu: 'Lịch sử tỷ lệ', hdKy: 'Từ kỳ',
      hdGiaDinh: 'Bản mẫu giả định Haustek thanh toán trực tiếp cho từng nghệ sĩ theo tỷ lệ do label đặt. Nếu thực tế label tự chia cho nghệ sĩ thì trang này sẽ thay đổi (câu hỏi cần chốt số 8).',
      hdLabelMe: 'Label mẹ', hdLabelCon: 'Label con', hdLabelConV: '{n} label con', xemHeThong: 'xem trang Hệ thống label',
      hdNhip: 'Nhịp báo cáo của nền tảng',
      moLabel: 'Label · {n} bài hát đã gửi tới nền tảng', moLabelCon: 'Label con của {p} · {n} bài hát đã gửi tới nền tảng',
      docLap: 'Hợp đồng độc lập với Haustek', thuocLb: 'Nghệ sĩ thuộc {l}',
      trongMo: 'Kỳ này chưa có số liệu', xemKy: 'Xem kỳ {k}',
      chuaMo: 'Kỳ này chưa xét duyệt', chuaMoMo: 'Số liệu chỉ hiển thị sau khi Haustek đối soát xong với tất cả các nền tảng và xét duyệt kỳ.',
      khongTq: 'Bạn chưa có bài hát nào đăng ký phần sáng tác',
      kyCoTq: 'Các kỳ đã có báo cáo tác quyền', kyCoTqMo: 'Chọn một kỳ để xem số liệu của kỳ đó.',
      soSangTac: 'Bài hát bạn có phần sáng tác', nhipTq: 'Chu kỳ báo cáo tác quyền',
      nhipTq1: 'Các tổ chức quản lý tác quyền (VCPMC ở Việt Nam, The MLC ở Mỹ, ASCAP, PRS, GEMA và các tổ chức khác) chốt sổ theo <b>quý</b>, không theo tháng.',
      nhipTq2: 'Các tổ chức này báo cáo <b>trễ một đến hai quý</b> so với thời điểm bài hát thực tế được nghe. Vì vậy tác quyền của một bài hát được nghe hôm nay thường khoảng nửa năm sau mới có trong báo cáo.',
      nhipTq3: 'Do đó phần lớn các kỳ <b>không có báo cáo tác quyền nào</b>. Đây là điều bình thường, không có nghĩa là bài hát của bạn không có doanh thu.',
      tongTq: 'Tổng tác quyền của các kỳ đã có báo cáo',
      chuaTq: 'Chưa có kỳ nào có báo cáo tác quyền đã xét duyệt.'
    },
    en: {
      nhomBai: 'Tracks', nhomLabel: 'Label', nhomTaiChinh: 'Finance', nhomHoTro: 'Help',
      navTong: 'Overview', h1: 'Overview',
      banGhi: 'Recording revenue', tacQuyen: 'Publishing',
      veTay: 'Yours this period', veTayLb: 'Label keeps this period',
      doanhThu: 'Revenue', doanhThuMo: 'artists’ and label’s parts combined',
      traNs: 'Paid to artists', cuaDoanhThu: 'of revenue',
      luot: 'Streams', bai: 'Earning tracks', baiMo: 'this period',
      tyGia: 'Period FX rate', chotLuc: 'locked', chuaChot: 'not locked',
      dienBien: 'Across periods',
      dienBienMo: 'Approved periods only. An unapproved period is left blank; that is not zero.',
      tongKy: '{n} approved periods in total', duKien: 'Projected for {k}', xemDuBao: 'See the forecast',
      vi: 'Your wallet', viMo: 'Each approved period credits your share to the wallet. Withdraw whenever you like.',
      khaDung: 'Available balance', dangXuLy: 'in progress', daRut: 'withdrawn',
      rut: 'Withdraw', moVi: 'Open wallet',
      duoiNguong: 'The available balance is below the {n} minimum. It stays in the wallet and adds up with the next period.',
      ghiKy: 'Credited this period', ghiKyTru: 'after advance recoupment',
      kyTiep: 'Next period expected in the wallet', kyTiepKhong: 'Every reported period is already credited',
      nhip: 'Crediting cadence', gan: 'Recent periods', kyChi: 'Period', soGhi: 'Credited',
      tamUng: 'Your advance', xemUng: 'See details', daUng: 'Advanced', truKy: 'Recouped this period', conTru: 'Left to recoup',
      chuoi: 'Where the money goes', chuoiMo: 'The period’s revenue, split between artists and label at the rate you set.',
      cuaHang: 'Where it was played', cuaHangMo: 'Your share, split by platform.',
      lanhTho: 'Which countries', lanhThoMo: 'The eight markets that earned most this period.',
      khac: 'Other platforms', tong: 'total',
      topNs: 'Top artists', topNsMo: 'By revenue this period.', xemRoster: 'See the roster',
      topBai: 'Top earning tracks', xemHet: 'See all', baiKy: 'tracks earned this period',
      cBai: 'Track',
      hd: 'Agreement & cadence', hdMo: 'The rate applied this period, and how money reaches the wallet.',
      hdLabel: 'Under label', hdDocLap: 'Agreement type', hdDocLapV: 'Independent, signed with Haustek', hdLabelV: 'Label, managing artists',
      hdTyLe: 'Your share', hdTyLeLb: 'Artist share', hdPhanLabel: 'Label’s share', hdPhanLbCua: 'Label keeps',
      hdHieuLuc: 'Effective from', hdCanCu: 'Basis', hdCanCuKhong: 'Original agreement',
      hdThanhToan: 'Paid by', hdThanhToanV: 'Haustek pays you directly at this rate',
      hdNguong: 'Minimum withdrawal', hdProducer: 'Tracks with producer points', hdProducerMo: 'producer points come off your share',
      hdLichSu: 'Rate history', hdKy: 'From',
      hdGiaDinh: 'The prototype assumes Haustek pays each artist directly at the rate the label set. If the label pays its artists itself, this page changes (open question 8).',
      hdLabelMe: 'Parent label', hdLabelCon: 'Sub-labels', hdLabelConV: '{n} sub-labels', xemHeThong: 'see the Label network page',
      hdNhip: 'Platform reporting cadence',
      moLabel: 'Label · {n} tracks delivered to platforms', moLabelCon: 'Sub-label of {p} · {n} tracks delivered to platforms',
      docLap: 'Independent agreement with Haustek', thuocLb: 'Artist under {l}',
      trongMo: 'Nothing this period', xemKy: 'See {k}',
      chuaMo: 'Period not approved yet', chuaMoMo: 'Figures open once reconciliation with every platform is finished and the period is approved.',
      khongTq: 'No registered writer share yet',
      kyCoTq: 'Periods with a publishing report', kyCoTqMo: 'Open one to see its figures.',
      soSangTac: 'Works you co-wrote', nhipTq: 'How publishing arrives',
      nhipTq1: 'Collecting societies (VCPMC in Vietnam, The MLC in the US, ASCAP, PRS, GEMA and others) settle <b>quarterly</b>, not monthly.',
      nhipTq2: 'They report <b>one to two quarters late</b> relative to when the music actually played, so publishing on a track played today usually arrives about six months later.',
      nhipTq3: 'That is why most periods simply have <b>no report at all</b>. That is normal, and not a sign that your works earned nothing.',
      tongTq: 'Publishing across reported periods',
      chuaTq: 'No period has an approved publishing report yet.'
    }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, vi = c.lang === 'vi';
    var P = HB.dayMau();
    var la = me.role === 'label';

    /* Label không bao giờ có tab tác quyền: tác quyền thuộc người sáng
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
      mo: HM.esc(!la
        ? (me.independent ? t('docLap') : t('thuocLb').replace('{l}', c.song(me, 'belongsTo') || ''))
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
            HM.esc(t('xemKy').replace('{k}', s.nextPub.label)) + '</button>' : '' })
      });
      /* Ô trống không được là ngõ cụt: người mở tab này đang hỏi "tiền tác
         quyền của tôi đâu"; trả lời "kỳ này chưa có" rồi để trắng nửa màn
         là bỏ dở câu trả lời ngay giữa chừng. */
      if (LUONG === 'pub') html += veTacQuyenTrong(c);
      root.innerHTML = html;
      HB.gan(root);
      HM.bam(root, '[data-tab]', function (el) { LUONG = el.getAttribute('data-tab'); c.veLai(); });
      HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
      return;
    }

    /* ---- diễn biến: dùng cho tia trong ô số và biểu đồ đường ---- */
    var xh = api.trend(me.role, me.partyId, LUONG);
    var kyMo = xh.points.filter(function (x) { return x.open; });
    var noiBat = -1;
    xh.points.forEach(function (x, i) { if (x.k === c.kyKey) noiBat = i; });
    var db = null;
    if (LUONG === 'rec') { try { db = api.forecast(me.role, me.partyId); } catch (e) { db = null; } }

    /* ---- ô số: một ô lớn, còn lại mỗi ô một câu ---- */
    html += HM.so([
      { l: la ? t('veTayLb') : t('veTay'), v: HT.fmt.usd(s.total), lon: true,
        tia: kyMo.map(function (x) { return x.value; }),
        d: HM.lech(s.total, s.prevTotal, s.prevLabel) },
      la ? { l: t('doanhThu'), v: HT.fmt.usd0(s.revenue), s: t('doanhThuMo'),
             d: HM.lech(s.revenue, s.prevRevenue, s.prevLabel) } : null,
      la && s.paidToArtists != null ? { l: t('traNs'), v: HT.fmt.usd0(s.paidToArtists),
             s: (s.revenue > 0 ? HT.fmt.pct(s.paidToArtists / s.revenue) + ' ' : '') + t('cuaDoanhThu') } : null,
      s.streams != null ? { l: t('luot'), v: HT.fmt.n(s.streams),
             d: HM.lech(s.streams, s.prevStreams, s.prevLabel) } : null,
      !la ? { l: t('bai'), v: HT.fmt.n(s.tracks), s: t('baiMo') } : null,
      { l: t('tyGia'), v: HT.fmt.n(s.fx.rate) + ' ₫',
        s: s.fx.locked ? t('chotLuc') + ' ' + HT.fmt.ngay(s.fx.at) : t('chuaChot') }
    ].filter(Boolean));

    /* ---- hàng 1: đường 12 kỳ + ví ---- */
    var tongMo = kyMo.reduce(function (a, x) { return a + x.value; }, 0);
    var chanDb = '';
    if (db && db.projected) {
      chanDb = ' · ' + HM.esc(t('duKien').replace('{k}', db.openPeriod)) + ' <b>' + HM.esc(HT.fmt.usd0(db.projected.mine)) + '</b>' +
        ' <a href="#k-du-bao">' + HM.esc(t('xemDuBao')) + '</a>';
    }
    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('dienBien')), p: HM.esc(t('dienBienMo')),
        than: HB.o({
          loai: 'duong', cao: 330, chuThich: false, dinhDang: 'tien',
          truc: xh.points.map(function (x) { return x.label; }),
          tieuDeTip: function (i) { return (vi ? 'Kỳ ' : 'Period ') + xh.points[i].label; },
          chuoi: [{ ten: la ? t('veTayLb') : t('veTay'), gt: xh.points.map(function (x) { return x.open ? x.value : null; }), mau: P[0] }],
          noiBat: noiBat
        }),
        chan: HM.esc(t('tongKy').replace('{n}', HT.fmt.n(kyMo.length))) + ': <b>' + HM.esc(HT.fmt.usd(tongMo)) + '</b>' + chanDb
      }) +
      veVi(c, s, la) + '</div>';

    /* ---- hàng 2 ---- */
    var ch = api.breakdown(me.role, me.partyId, c.kyKey, LUONG, 'store');
    var lt = api.breakdown(me.role, me.partyId, c.kyKey, LUONG, 'terr');
    var theNenTang = HM.the({
      h2: HM.esc(t('cuaHang')), p: HM.esc(t('cuaHangMo')),
      than: veVong(c, ch, s.total, t)
    });
    var theThiTruong = HM.the({
      h2: HM.esc(t('lanhTho')), p: HM.esc(t('lanhThoMo')),
      than: HB.o({ loai: 'thanh', tenTong: la ? t('veTayLb') : t('veTay'), hang: lt.rows.slice(0, 8).map(function (r, i) {
        return { ten: r.name, gt: r.value, mau: P[i % 8] };
      }) })
    });

    if (la) {
      html += '<div class="grid g2">' +
        HM.the({
          h2: HM.esc(t('chuoi')), p: HM.esc(t('chuoiMo')),
          than: '<div class="wf">' + s.chain.map(function (b) {
            return '<div class="st ' + (b.kind === 'out' ? 'out' : b.kind === 'final' ? 'fin' : '') + '">' +
              '<div class="mk"></div>' +
              '<div><div class="lbl">' + HM.esc(c.song(b, 'label')) + '</div>' +
              (c.song(b, 'note') ? '<div class="nt">' + HM.esc(c.song(b, 'note')) + '</div>' : '') + '</div>' +
              '<div class="amt">' + HM.esc(HT.fmt.usd(b.value)) + '</div></div>';
          }).join('') + '</div>' +
          '<div style="margin-top:16px">' + HB.o({ loai: 'thac', cao: 180,
            buoc: s.chain.map(function (b) {
              return { l: c.song(b, 'label'), v: b.value, nt: c.song(b, 'note'),
                       kind: b.kind === 'top' ? 'top' : b.kind === 'final' ? 'final' : 'out' };
            }) }) + '</div>'
        }) + theNenTang + '</div>';

      var ro = null;
      try { ro = api.roster(me.role, me.partyId, c.kyKey); } catch (e) { ro = null; }
      var topNs = ro ? ro.rows.filter(function (x) { return x.revenue > 0; }).slice(0, 6) : [];
      html += '<div class="grid g2">' + theThiTruong +
        (topNs.length ? HM.the({
          h2: HM.esc(t('topNs')), p: HM.esc(t('topNsMo')),
          hanhDong: '<button type="button" class="btn sm" data-di="k-nghe-si">' + HM.esc(t('xemRoster')) + '</button>',
          than: HB.o({ loai: 'thanh', tenTong: t('doanhThu'), hang: topNs.map(function (x, i) {
            return { ten: x.name, gt: x.revenue, mau: P[i % 8], phu: t('hdPhanLbCua').toLowerCase() + ' ' + HT.fmt.usd0(x.labelCut) };
          }) })
        }) : '') + '</div>';
    } else {
      html += '<div class="grid g2">' + theNenTang + theThiTruong + '</div>';
    }

    /* ---- hợp đồng & nhịp báo cáo ---- */
    html += veHopDong(c, la);

    /* ---- top bài ---- */
    var bg = api.tracks(me.role, me.partyId, c.kyKey, LUONG, { sort: 'mine', dir: -1 });
    html += HM.the({
      h2: HM.esc(t('topBai')),
      p: HT.fmt.n(bg.total) + ' ' + HM.esc(t('baiKy')),
      hanhDong: '<button type="button" class="btn sm" data-di="k-ban-ghi">' + HM.esc(t('xemHet')) + '</button>',
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr>' +
        '<th>' + HM.esc(t('cBai')) + '</th>' +
        (LUONG === 'rec' ? '<th class="num">' + HM.esc(t('luot')) + '</th>' : '') +
        (la ? '<th class="num">' + HM.esc(t('doanhThu')) + '</th>' : '') +
        '<th class="num band">' + HM.esc(la ? t('hdPhanLbCua') : t('veTay')) + '</th></tr></thead><tbody>' +
        bg.rows.slice(0, 10).map(function (r) {
          return '<tr class="pick" data-bg="' + r.id + '">' +
            '<td>' + HM.tenBia({ bia: r.id, ten: HM.dai(r.title, 36), phu: r.isrc + ' · ' + r.type + (la && r.artist ? ' · ' + r.artist : '') }) + '</td>' +
            (LUONG === 'rec' ? '<td class="num">' + HM.esc(HT.fmt.n(r.streams)) + '</td>' : '') +
            (la ? '<td class="num">' + HM.esc(HT.fmt.usd0(r.revenue)) + '</td>' : '') +
            '<td class="num band"><b>' + HM.esc(HT.fmt.usd(r.mine)) + '</b></td></tr>';
        }).join('') + '</tbody></table></div>'
    });

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { LUONG = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
    HM.bam(root, '[data-bg]', function (el) { moBai(c, +el.getAttribute('data-bg'), LUONG, la); });
  }
});

/* =====================================================================
   Donut theo nền tảng: tối đa sáu phần, phần dư gộp vào "Nền tảng khác"
   màu xám (màu định danh chỉ dành cho nền tảng có tên).
   ===================================================================== */
function veVong(c, ch, tong, t) {
  var P = HB.dayMau();
  var rows = ch.rows.slice();
  var phan = rows.slice(0, 6).map(function (r, i) { return { ten: c.song(r, 'name'), gt: r.value, mau: P[i] }; });
  var du = rows.slice(6).reduce(function (a, r) { return a + r.value; }, 0) + (ch.tail ? ch.tail.value : 0);
  if (du > 0) phan.push({ ten: t('khac'), gt: du, mau: HB.mauKhac() });
  return HB.o({ loai: 'vong', cao: 200, chuThich: true, tenTong: t('veTay'),
    giua: { v: HT.fmt.usd0(tong), l: t('tong') }, phan: phan });
}

/* =====================================================================
   Kỳ tác quyền trống: nói cho hết câu
   ===================================================================== */
function veTacQuyenTrong(c) {
  var t = c.t, me = c.phien.me, api = c.api, P = HB.dayMau();
  var kyCo = c.phien.kyTacQuyen || [];

  var soLieu = kyCo.map(function (p) {
    try { return { k: p.k, label: p.label, v: api.summary(me.role, me.partyId, p.k, 'pub').total }; }
    catch (e) { return null; }
  }).filter(Boolean);
  var tong = soLieu.reduce(function (s, x) { return s + x.v; }, 0);

  return '<div class="grid g3">' +
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
              chuoi: [{ ten: t('tacQuyen'), gt: soLieu.map(function (x) { return x.v; }), mau: P[3] }]
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
            return '<button type="button" class="pill" data-kyto="' + HM.esc(p.k) + '">' + HM.esc(p.label) + '</button>';
          }).join('') + '</div>'
        : '<p class="hint" style="margin-top:12px">' + HM.esc(t('chuaTq')) + '</p>')
    }) + '</div>';
}

/* =====================================================================
   Thẻ "Hợp đồng & nhịp báo cáo": tỷ lệ đang áp, hiệu lực từ kỳ nào, và
   tiền về ví theo nhịp nào (tháng với phần lớn nền tảng, quý với TikTok).
   Không có dòng nào về khoản khấu trừ: phần đó nằm trong bảng kê PDF.
   ===================================================================== */
function veHopDong(c, la) {
  var t = c.t, me = c.phien.me, api = c.api, vi = c.lang === 'vi';
  var hd;
  try { hd = api.contract(me.role, me.partyId, c.kyKey); } catch (e) { return ''; }
  var thuocLabel = hd.kind === 'artist-label';
  var coTyLe = hd.artistShare != null;
  var rows = [
    hd.parentLabel ? { t: t('hdLabelMe'), v: hd.parentLabel.name + ' · ' + hd.parentLabel.clientId, manh: true } : null,
    thuocLabel && hd.label ? { t: t('hdLabel'), v: hd.label.name + ' · ' + hd.label.clientId, manh: true } : null,
    !thuocLabel ? { t: t('hdDocLap'), v: la ? t('hdLabelV') : t('hdDocLapV') } : null,
    hd.childLabels > 0 ? { t: t('hdLabelCon'), vHtml: true,
      v: HM.esc(t('hdLabelConV').replace('{n}', HT.fmt.n(hd.childLabels))) + ', <a href="#k-he-thong">' + HM.esc(t('xemHeThong')) + '</a>' } : null,
    coTyLe ? { t: la ? t('hdTyLeLb') : t('hdTyLe'), v: HT.fmt.pct(hd.artistShare) + ' ' + t('cuaDoanhThu'), manh: !la } : null,
    coTyLe && hd.labelShare != null ? { t: la ? t('hdPhanLbCua') : t('hdPhanLabel'), v: HT.fmt.pct(hd.labelShare) + ' ' + t('cuaDoanhThu'), manh: la } : null,
    hd.effectiveFrom ? { t: t('hdHieuLuc'), v: hd.effectiveFrom } : null,
    coTyLe ? { t: t('hdCanCu'), v: hd.basis || t('hdCanCuKhong') } : null,
    !la ? { t: t('hdThanhToan'), v: t('hdThanhToanV') } : null,
    { t: t('hdNguong'), v: HT.fmt.usd0(hd.payoutThreshold) },
    !la && hd.producerTracks ? { t: t('hdProducer'), v: HT.fmt.n(hd.producerTracks) + ' · ' + t('hdProducerMo') } : null
  ].filter(Boolean);

  var nhip = (hd.cadence || []).map(function (n) {
    return '<div class="st"><div class="mk"></div><div><div class="lbl">' + HM.esc(c.song(n, 'label')) +
      ' <span class="muted">· ' + HM.esc((n.platforms || []).join(', ')) + '</span></div>' +
      '<div class="nt">' + HM.esc(c.song(n, 'note')) + '</div></div></div>';
  }).join('');
  var lichSu = (hd.history || []).length > 1
    ? '<h4 class="sec">' + HM.esc(t('hdLichSu')) + '</h4><div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' +
      HM.esc(t('hdKy')) + '</th><th class="num">' + HM.esc(la ? t('hdTyLeLb') : t('hdTyLe')) + '</th><th>' + HM.esc(t('hdCanCu')) + '</th></tr></thead><tbody>' +
      hd.history.map(function (h) {
        return '<tr><td class="mono">' + HM.esc(h.from) + '</td><td class="num">' + HM.esc(HT.fmt.pct(h.artistShare)) + '</td><td>' + HM.esc(h.note || t('hdCanCuKhong')) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    : '';
  var than = '<div class="grid g2" style="margin-bottom:0"><div>' + HM.kv(rows) + lichSu + '</div>' +
    '<div><h4 class="sec" style="margin-top:0">' + HM.esc(t('hdNhip')) + '</h4><div class="wf">' + nhip + '</div></div></div>';
  return HM.the({
    h2: HM.esc(t('hd')), p: HM.esc(t('hdMo')),
    than: than,
    chan: HM.esc(c.song(hd, 'statementNote') || '') + (thuocLabel ? ' ' + HM.esc(t('hdGiaDinh')) : '')
  });
}

/* =====================================================================
   Thẻ ví: số dư rút được ngay, kỳ này ghi bao nhiêu, kỳ tới bao giờ về.
   Trước đây thẻ này nói "sẽ thanh toán trong đợt tới"; nay tiền nằm trong
   ví và đối tác tự rút, nên câu trả lời là số dư và nút rút.
   ===================================================================== */
function veVi(c, s, la) {
  var t = c.t, api = c.api, me = c.phien.me, P = HB.dayMau(), vi = c.lang === 'vi';
  var w = null;
  try { w = api.wallet(me.role, me.partyId); } catch (e) { w = null; }
  var than = '';
  if (w) {
    var duNguong = w.available >= w.threshold;
    var ghiKy = null;
    (w.credits || []).forEach(function (x) { if (x.k === c.kyKey) ghiKy = x; });
    than = HM.so([{ l: t('khaDung'), v: HT.fmt.usd(w.available), mau: HB.mau('ok'),
      s: HT.fmt.usd0(w.pending) + ' ' + t('dangXuLy') + ' · ' + HT.fmt.usd0(w.paid) + ' ' + t('daRut') }]) +
      '<div class="btnrow" style="margin-top:12px">' +
        '<button type="button" class="btn pri sm" data-di="k-vi"' + (duNguong ? '' : ' disabled') + '>' + HM.icon('cash') + HM.esc(t('rut')) + '</button>' +
        '<button type="button" class="btn sm" data-di="k-vi">' + HM.esc(t('moVi')) + '</button></div>' +
      (duNguong ? '' : '<p class="hint" style="margin-top:8px">' + HM.esc(t('duoiNguong').replace('{n}', HT.fmt.usd0(w.threshold))) + '</p>') +
      HM.kv([
        { t: t('ghiKy'), v: HT.fmt.usd(ghiKy ? ghiKy.credit : s.total) + (ghiKy && ghiKy.recoup > 0 ? ' · ' + t('ghiKyTru') : ''), manh: true },
        { t: t('kyTiep'), v: w.nextPeriod ? w.nextPeriod.label : t('kyTiepKhong') }
      ]);
    var gan = (w.credits || []).slice(-4).reverse();
    if (gan.length) {
      than += '<h4 class="sec">' + HM.esc(t('gan')) + '</h4>' +
        '<div class="tw"><table class="t" style="min-width:0"><thead><tr>' +
        '<th>' + HM.esc(t('kyChi')) + '</th><th class="num">' + HM.esc(t('soGhi')) + '</th></tr></thead><tbody>' +
        gan.map(function (x) {
          return '<tr' + (x.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '>' +
            '<td class="mono">' + HM.esc(x.label) + '</td><td class="num">' + HM.esc(HT.fmt.usd(x.credit)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    than += '<h4 class="sec">' + HM.esc(t('nhip')) + '</h4>' +
      '<div class="checks">' + (w.cadence || []).map(function (n) {
        return '<div><b>' + HM.esc(c.song(n, 'label')) + '</b> · ' + HM.esc((n.platforms || []).join(', ')) + '</div>';
      }).join('') + '</div>';
  } else {
    than = '<p class="say">' + HM.esc(vi ? 'Ví sẽ mở khi kỳ đầu tiên của bạn được xét duyệt.' : 'The wallet opens once your first period is approved.') + '</p>';
  }

  if (s.advance) {
    than += '<h4 class="sec">' + HM.esc(t('tamUng')) + '</h4>' +
      HM.kv([
        { t: t('daUng'), v: HT.fmt.usd0(s.advance.opening) },
        { t: t('truKy'), v: HT.fmt.usd(s.advance.recoupedThisPeriod) },
        { t: t('conTru'), v: HT.fmt.usd(s.advance.left), manh: true }
      ]) +
      '<div class="meter" style="margin-top:8px"><i style="width:' +
      Math.max(0, Math.min(100, (1 - s.advance.left / Math.max(s.advance.opening, 1)) * 100)).toFixed(1) +
      '%;background:' + P[6] + '"></i></div>' +
      '<div class="btnrow" style="margin-top:12px">' +
      '<button type="button" class="btn sm" data-di="k-tam-ung">' + HM.esc(t('xemUng')) + '</button></div>';
  }
  return HM.the({ h2: HM.esc(t('vi')), p: HM.esc(t('viMo')), than: than });
}

/* =====================================================================
   Ngăn trượt: một bài hát trong kỳ
   ===================================================================== */
function moBai(c, id, luong, la) {
  var api = c.api, me = c.phien.me, P = HB.dayMau(), t = c.t, vi = c.lang === 'vi';
  var d;
  try { d = api.trackDetail(me.role, me.partyId, c.kyKey, luong, id); }
  catch (e) { c.thongBao(e.message, 'no'); return; }

  c.nganTruot(
    HM.so([
      { l: la ? t('hdPhanLbCua') : t('veTay'), v: HT.fmt.usd(d.mine), lon: true },
      la ? { l: t('doanhThu'), v: HT.fmt.usd0(d.revenue) } : null,
      d.streams != null ? { l: t('luot'), v: HT.fmt.n(d.streams) } : null
    ].filter(Boolean)) +
    (d.steps.length > 1 ? '<h4 class="sec">' + HM.esc(t('chuoi')) + '</h4>' +
      '<div class="wf">' + d.steps.map(function (st) {
        return '<div class="st ' + (st.strong ? 'fin' : (st.value != null && st.value < 0 ? 'out' : '')) + '">' +
          '<div class="mk"></div><div><div class="lbl">' + HM.esc(c.song(st, 'label')) + '</div></div>' +
          '<div class="amt">' + HM.esc(st.value != null ? HT.fmt.usd(st.value) : st.text) + '</div></div>';
      }).join('') + '</div>' : '') +
    (d.byStore.length ? '<h4 class="sec">' + HM.esc(t('cuaHang')) + '</h4>' +
      HB.o({ loai: 'thanh', hang: d.byStore.map(function (x, i) { return { ten: c.song(x, 'name'), gt: x.value, mau: P[i % 8] }; }) }) : '') +
    (d.byTerritory.length ? '<h4 class="sec">' + HM.esc(t('lanhTho')) + '</h4>' +
      HB.o({ loai: 'thanh', hang: d.byTerritory.map(function (x, i) { return { ten: x.name, gt: x.value, mau: P[i % 8] }; }) }) : '') +
    (luong === 'rec'
      ? '<div class="btnrow" style="margin-top:14px"><button type="button" class="btn sm" data-ho-so>' +
        HM.icon('layers') + HM.esc(vi ? 'Xem quy trình phát hành và nền tảng' : 'Release pipeline & platforms') + '</button></div>'
      : ''),
    { tieuDe: d.title, phu: d.isrc + ' · ' + d.type + (d.artist ? ' · ' + d.artist : ''),
      khiMo: function (dr) {
        HB.gan(dr);
        HM.bam(dr, '[data-ho-so]', function () {
          var hs;
          try { hs = api.trackAsset(me.role, me.partyId, id); }
          catch (e) { c.thongBao(e.message, 'no'); return; }
          HTS.moNgan(c, hs, { mineLabel: la ? t('hdPhanLbCua') : t('veTay'), revenueLabel: t('doanhThu'), anMine: !la,
            tien: HT.fmt.usd, tien0: HT.fmt.usd0, tabDau: 'nt', hoTro: true, playlists: HTS.plCua(c, id) });
          var dr2 = document.querySelector('.drawer');
          if (dr2 && HT.moTicket) {
            HM.bam(dr2, '[data-yc-mkt]', function (b) { HT.moTicket(c, { type: 'marketing', trackId: +b.getAttribute('data-yc-mkt') }); });
            HM.bam(dr2, '[data-yc-ht]', function (b) { HT.moTicket(c, { type: 'nen-tang', trackId: +b.getAttribute('data-yc-ht') }); });
          }
        });
      } });
}

})();
