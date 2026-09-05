/* =====================================================================
   CỔNG ĐỐI TÁC · DỰ BÁO
   ---------------------------------------------------------------------
   Báo cáo doanh thu của nền tảng về sau một tới ba tháng, nhưng lượt nghe
   mỗi ngày thì có ngay. Trang này nhân lượt nghe hằng ngày với mức trả
   trung bình của từng nền tảng (từ các kỳ đã xét duyệt) để đối tác biết
   kỳ đang mở đang đi tới đâu, bài nào đang lên, và kỳ tới trông thế nào.
   Mọi con số ở đây là ước tính; số thật chỉ có khi nền tảng gửi báo cáo.
   ===================================================================== */
"use strict";
(function () {

HT.dangKy({
  id: 'k-du-bao', nav: 'navDuBao', nhom: 'nhomBai', icon: 'up',

  chu: {
    vi: {
      navDuBao: 'Dự báo', h1: 'Dự báo',
      mo: 'Lượt nghe mỗi ngày của các bài đã lên nền tảng, nhân với mức trả trung bình của từng nền tảng. Đây là ước tính cho kỳ đang mở; số thật chỉ có khi nền tảng gửi báo cáo.',
      kDuKien: 'Dự kiến kỳ {k}', kToiNay: 'Đã đạt tới hôm nay', k7: '7 ngày qua', k28: '28 ngày qua',
      phanLabel: 'phần label', luot: 'lượt nghe', truoc7: '7 ngày trước', truoc28: '28 ngày trước',
      ngay: 'ngày {a}/{b} của kỳ',
      dienBien: 'Lượt nghe 60 ngày gần nhất', dienBienMo: 'Mỗi điểm là một ngày. Phần nét đứt là các ngày còn lại của kỳ, ước theo mức trung bình 7 ngày qua.',
      duBao: 'dự báo', luotNgay: 'Lượt nghe trong ngày',
      nenTang: 'Theo nền tảng', nenTangMo: 'Tỷ trọng lượt nghe 28 ngày qua và mức trả trung bình của từng nền tảng, từ đó ra số dự kiến của kỳ.',
      cNt: 'Nền tảng', cLuot28: 'Lượt nghe 28 ngày', cTyTrong: 'Tỷ trọng', cMucTra: 'Mức trả', mucTraMo: 'USD / 1.000 lượt nghe', cDkLuot: 'Dự kiến lượt nghe', cDkTien: 'Dự kiến tiền',
      cDkTienLb: 'Dự kiến doanh thu', cDkLabel: 'Phần label',
      topBai: 'Bài hát tăng trưởng mạnh', topBaiMo: 'Theo lượt nghe 7 ngày qua so với 7 ngày trước đó. Bấm một dòng để mở hồ sơ bài hát.',
      cBai: 'Bài hát', cNs: 'Nghệ sĩ', cLuot7: 'Lượt nghe 7 ngày', cTang: 'Tăng trưởng', cTien7: 'Dự kiến tiền 7 ngày',
      kyToi: 'Kỳ tới {k}', kyToiMo: 'Ước theo mức 7 ngày qua, điều chỉnh theo xu hướng 28 ngày, cho đủ số ngày của kỳ tới.',
      kyToiLuot: 'Lượt nghe dự kiến', kyToiTien: 'Thu nhập dự kiến', kyToiDt: 'Doanh thu dự kiến', kyToiLabel: 'Phần label dự kiến',
      phuongPhap: 'Phương pháp', canhBao: 'Đây là ước tính', canhBaoMo: 'Nền tảng có thể điều chỉnh lượt nghe (lọc gian lận, đổi mức trả) trước khi báo cáo. Số ghi vào ví là số trong báo cáo đã xét duyệt, không phải số ở trang này.',
      baiDem: '{n} bài hát đang có lượt nghe được tính vào dự báo.',
      trong: 'Chưa có cơ sở để dự báo', trongMo: 'Cần ít nhất một kỳ đã xét duyệt để biết mức trả của từng nền tảng. Dự báo sẽ có sau kỳ đầu tiên.'
    },
    en: {
      navDuBao: 'Forecast', h1: 'Forecast',
      mo: 'Daily streams of tracks live on platforms, multiplied by each platform’s average payout. An estimate for the open period; actual figures arrive with the platforms’ reports.',
      kDuKien: 'Projected for {k}', kToiNay: 'Month to date', k7: 'Last 7 days', k28: 'Last 28 days',
      phanLabel: 'label keeps', luot: 'streams', truoc7: 'previous 7 days', truoc28: 'previous 28 days',
      ngay: 'day {a} of {b}',
      dienBien: 'Streams, last 60 days', dienBienMo: 'One point per day. The dashed part is the rest of the period, estimated from the 7-day average.',
      duBao: 'forecast', luotNgay: 'Streams that day',
      nenTang: 'By platform', nenTangMo: 'Share of streams over the last 28 days and each platform’s average payout, which together give the projection.',
      cNt: 'Platform', cLuot28: 'Streams, 28 days', cTyTrong: 'Share', cMucTra: 'Payout', mucTraMo: 'USD per 1,000 streams', cDkLuot: 'Projected streams', cDkTien: 'Projected money',
      cDkTienLb: 'Projected revenue', cDkLabel: 'Label keeps',
      topBai: 'Fastest-growing tracks', topBaiMo: 'By streams in the last 7 days against the 7 before. Open a row for the track’s record.',
      cBai: 'Track', cNs: 'Artist', cLuot7: 'Streams, 7 days', cTang: 'Growth', cTien7: 'Projected, 7 days',
      kyToi: 'Next period {k}', kyToiMo: 'Based on the last 7 days, adjusted by the 28-day trend, over the full length of the next period.',
      kyToiLuot: 'Projected streams', kyToiTien: 'Projected income', kyToiDt: 'Projected revenue', kyToiLabel: 'Projected label share',
      phuongPhap: 'Method', canhBao: 'This is an estimate', canhBaoMo: 'Platforms may adjust streams (fraud filtering, rate changes) before reporting. What is credited to your wallet is the approved report, not this page.',
      baiDem: '{n} tracks with streams are counted in the forecast.',
      trong: 'Nothing to forecast from yet', trongMo: 'At least one approved period is needed to know each platform’s payout. The forecast appears after the first one.'
    }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
    var la = me.role === 'label';
    var f;
    try { f = api.forecast(me.role, me.partyId); } catch (e) { f = null; }
    if (!f || !f.days.length || !(f.perStream > 0)) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) }) +
        HM.the({ than: HM.trong({ icon: 'clock', tieuDe: t('trong'), moTa: t('trongMo') }) });
      return;
    }
    var tien = la ? function (x) { return x.revenue; } : function (x) { return x.mine; };

    var html = HM.dau({ h1: HM.esc(t('h1')) + ' <span>' + HM.esc(f.openPeriod) + '</span>', mo: HM.esc(t('mo')) });

    /* tia 12 điểm: cộng dồn 60 ngày thành 12 nhóm 5 ngày */
    var tia = [];
    for (var g = 0; g < 12; g++) { var s = 0; for (var d = g * 5; d < g * 5 + 5 && d < f.days.length; d++) s += f.days[d].streams; tia.push(s); }
    /* Dải P10–P90 từ độ dao động ngày của 28 ngày gần nhất: Joslyn & LeClerc
       (2012) — dự báo có dải làm quyết định tốt hơn và giảm tác hại khi sai. */
    var d28 = f.days.slice(-28).map(function (x) { return x.streams; });
    var mu = d28.reduce(function (a2, b2) { return a2 + b2; }, 0) / (d28.length || 1);
    var cv = mu > 0 ? Math.sqrt(d28.reduce(function (a2, b2) { return a2 + (b2 - mu) * (b2 - mu); }, 0) / (d28.length || 1)) / mu : 0;
    var conLaiTyLe = Math.max(0, f.daysInMonth - f.daysElapsed) / f.daysInMonth;
    var bienDo = Math.min(0.35, 1.28 * cv * Math.sqrt(1 + 6 * conLaiTyLe));   /* càng nhiều ngày chưa tới, dải càng rộng */
    var duKien = la ? f.projected.revenue : f.projected.mine;
    var dai = { thap: duKien * (1 - bienDo), cao: duKien * (1 + bienDo) };
    html += HM.so([
      { l: t('kDuKien').replace('{k}', f.openPeriod), v: HT.fmt.usd0(duKien), lon: true,
        s: (vi ? 'Dải P10–P90: ' : 'P10–P90 band: ') + HT.fmt.usd0(dai.thap) + ' – ' + HT.fmt.usd0(dai.cao) + (la ? ' · ' + t('phanLabel') + ' ' + HT.fmt.usd0(f.projected.mine) : '') + ' · ' + HT.fmt.n(f.projected.streams) + ' ' + t('luot'), tia: tia },
      { l: t('kToiNay'), v: HT.fmt.n(f.projected.monthToDate),
        s: t('luot') + ' · ' + HT.fmt.usd0(la ? f.projected.monthToDateRevenue : f.projected.monthToDateMine) + ' · ' + t('ngay').replace('{a}', f.daysElapsed).replace('{b}', f.daysInMonth) },
      { l: t('k7'), v: HT.fmt.n(f.last7), d: HM.lech(f.last7, f.prev7, t('truoc7')) },
      { l: t('k28'), v: HT.fmt.n(f.last28), d: HM.lech(f.last28, f.prev28, t('truoc28')) }
    ]);

    /* ---- thẻ 1: đường 60 ngày + nét đứt tới hết kỳ ---- */
    var avg7 = f.last7 / 7;
    var conLai = Math.max(0, f.daysInMonth - f.daysElapsed);
    var truc = f.days.map(function (x) { return nhanNgay(x.date); });
    var gt = f.days.map(function (x) { return x.streams; });
    var cuoi = new Date(f.asOf + 'T00:00:00');
    for (var k = 1; k <= conLai; k++) {
      var nd = new Date(cuoi.getTime() + k * 864e5);
      truc.push(String(nd.getDate()).padStart(2, '0') + '.' + String(nd.getMonth() + 1).padStart(2, '0'));
      gt.push(Math.round(avg7));
    }
    html += HM.the({
      h2: HM.esc(t('dienBien')), p: HM.esc(t('dienBienMo')),
      than: HB.o({
        loai: 'duong', cao: 240, dinhDang: 'so', chuThich: false, noiBat: f.days.length - 1,
        truc: truc,
        tieuDeTip: function (i) { return truc[i] + (i >= f.days.length ? ' · ' + t('duBao') : ''); },
        chuoi: [{ ten: t('luotNgay'), gt: gt, mau: P[0], dubao: conLai ? f.days.length : null }]
      }),
      chan: HM.esc(t('baiDem').replace('{n}', HT.fmt.n(f.tracksCounted)))
    });

    /* ---- thẻ 2: theo nền tảng: bảng + donut ---- */
    var bp = f.byPlatform.slice().sort(function (a, b) { return b.streams28 - a.streams28; });
    var laKhac = function (r) { return r.name === 'Nền tảng khác' || r.nameEn === 'Other platforms'; };
    var top = bp.filter(function (r) { return !laKhac(r); }).slice(0, 5);
    var duLai = bp.filter(function (r) { return top.indexOf(r) < 0; });
    var phan = top.map(function (r, i) { return { ten: c.song(r, 'name'), gt: r.streams28, mau: P[i] }; });
    if (duLai.length) phan.push({ ten: vi ? 'Nền tảng khác' : 'Other platforms', gt: duLai.reduce(function (s2, r) { return s2 + r.streams28; }, 0), mau: HB.mauKhac() });
    var tongDk = bp.reduce(function (s2, r) { return s2 + tien({ revenue: r.projectedRevenue, mine: r.projectedMine }); }, 0);
    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('nenTang')), p: HM.esc(t('nenTangMo')),
        thoBody: true,
        than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cNt')) + '</th><th class="num">' + HM.esc(t('cLuot28')) + '</th><th class="num">' + HM.esc(t('cTyTrong')) + '</th>' +
          '<th class="num">' + HM.esc(t('cMucTra')) + '<div class="t-sub" style="font-weight:400">' + HM.esc(t('mucTraMo')) + '</div></th>' +
          '<th class="num">' + HM.esc(t('cDkLuot')) + '</th><th class="num band">' + HM.esc(la ? t('cDkTienLb') : t('cDkTien')) + '</th>' +
          (la ? '<th class="num">' + HM.esc(t('cDkLabel')) + '</th>' : '') + '</tr></thead><tbody>' +
          bp.map(function (r) {
            return '<tr><td>' + HM.esc(c.song(r, 'name')) + '</td><td class="num">' + HM.esc(HT.fmt.n(r.streams28)) + '</td>' +
              '<td class="num">' + HM.esc(HT.fmt.pct(r.share)) + '</td>' +
              '<td class="num mono">' + HM.esc(HT.fmt.usd(la ? r.per1k : r.per1kMine)) + '</td>' +
              '<td class="num">' + HM.esc(HT.fmt.n(r.projectedStreams)) + '</td>' +
              '<td class="num band"><b>' + HM.esc(HT.fmt.usd0(la ? r.projectedRevenue : r.projectedMine)) + '</b></td>' +
              (la ? '<td class="num">' + HM.esc(HT.fmt.usd0(r.projectedMine)) + '</td>' : '') + '</tr>';
          }).join('') + '</tbody><tfoot><tr><td>' + HM.esc(vi ? 'Tổng cộng' : 'Total') + '</td>' +
          '<td class="num">' + HM.esc(HT.fmt.n(f.last28)) + '</td><td class="num">100%</td><td class="num"></td>' +
          '<td class="num">' + HM.esc(HT.fmt.n(f.projected.streams)) + '</td>' +
          '<td class="num band">' + HM.esc(HT.fmt.usd0(tongDk)) + '</td>' +
          (la ? '<td class="num">' + HM.esc(HT.fmt.usd0(f.projected.mine)) + '</td>' : '') + '</tr></tfoot></table></div>'
      }) +
      HM.the({
        h2: HM.esc(vi ? 'Tỷ trọng lượt nghe 28 ngày' : 'Share of streams, 28 days'),
        than: HB.o({ loai: 'vong', cao: 190, dinhDang: 'so', tenTong: t('luot'), phan: phan,
          giua: { v: HB.gonSo(f.last28), l: t('luot') } }) +
          '<h4 class="sec">' + HM.esc(vi ? 'Mức trả trung bình' : 'Blended payout') + '</h4>' +
          HM.kv([
            { t: la ? t('cDkTienLb') : t('cDkTien'), v: HT.fmt.usd((la ? f.perStreamRevenue : f.perStream) * 1000) + ' / 1.000 ' + t('luot'), manh: true },
            la ? { t: t('cDkLabel'), v: HT.fmt.usd(f.perStream * 1000) + ' / 1.000 ' + t('luot') } : null
          ])
      }) + '</div>';

    /* ---- thẻ 3: bài tăng trưởng mạnh ---- */
    var tt = f.topTracks.slice().sort(function (a, b) { return (b.growth || 0) - (a.growth || 0); });
    html += HM.the({
      h2: HM.esc(t('topBai')), p: HM.esc(t('topBaiMo')),
      thoBody: true,
      than: tt.length ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cBai')) + '</th>' + (la ? '<th>' + HM.esc(t('cNs')) + '</th>' : '') +
        '<th class="num">' + HM.esc(t('cLuot7')) + '</th><th class="num">' + HM.esc(t('cTang')) + '</th><th class="num band">' + HM.esc(t('cTien7')) + '</th></tr></thead><tbody>' +
        tt.map(function (x) {
          return '<tr class="pick" data-bg="' + x.id + '"><td>' + HM.tenBia({ bia: x.id, ten: HM.dai(x.title, 40), phu: la ? '' : x.artist }) + '</td>' +
            (la ? '<td>' + HM.esc(HM.dai(x.artist, 26)) + '</td>' : '') +
            '<td class="num">' + HM.esc(HT.fmt.n(x.streams7)) + '</td>' +
            '<td class="num">' + (x.growth == null ? '<span class="nil">—</span>' : HM.lechHtml(1 + x.growth, 1, '')) + '</td>' +
            '<td class="num band"><b>' + HM.esc(HT.fmt.usd(la ? x.revenue7 : x.mine7)) + '</b></td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="card-b"><p class="say">' + HM.esc(t('trongMo')) + '</p></div>'
    });

    /* ---- thẻ 4: kỳ tới + phương pháp ---- */
    html += '<div class="grid g2">' +
      HM.the({
        h2: HM.esc(t('kyToi').replace('{k}', f.nextPeriod)), p: HM.esc(t('kyToiMo')),
        than: HM.so([
          { l: t('kyToiLuot'), v: HT.fmt.n(f.next.streams) },
          { l: la ? t('kyToiDt') : t('kyToiTien'), v: HT.fmt.usd0(la ? f.next.revenue : f.next.mine), mau: HB.mau('ok') },
          la ? { l: t('kyToiLabel'), v: HT.fmt.usd0(f.next.mine) } : null
        ].filter(Boolean)) +
          '<div style="margin-top:12px">' + HM.ghi({ kieu: 'warn', tieuDe: HM.esc(t('canhBao')), than: HM.esc(t('canhBaoMo')) }) + '</div>'
      }) +
      HM.the({
        h2: HM.esc(t('phuongPhap')),
        than: '<p class="say">' + HM.esc(c.song(f, 'note')) + '</p>' +
          HM.kv([
            { t: vi ? 'Số liệu tới ngày' : 'Data as of', v: HT.fmt.ngay(f.asOf) },
            { t: vi ? 'Bài hát được tính' : 'Tracks counted', v: HT.fmt.n(f.tracksCounted) },
            { t: vi ? 'Kỳ đang mở' : 'Open period', v: f.openPeriod + ' · ' + t('ngay').replace('{a}', f.daysElapsed).replace('{b}', f.daysInMonth) }
          ])
      }) + '</div>';

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-bg]', function (el) {
      var hs;
      try { hs = api.trackAsset(me.role, me.partyId, +el.getAttribute('data-bg')); }
      catch (e) { c.thongBao(e.message, 'no'); return; }
      var kn = [];
      try { kn = api.claims(me.role, me.partyId).rows.filter(function (r) { return r.track && r.track.isrc === hs.isrc; }); } catch (e) { kn = []; }
      HTS.moNgan(c, hs, { mineLabel: la ? HTS.t('label') : HTS.t('toi'), revenueLabel: la ? HTS.t('gop') : HTS.t('toi'), anMine: !la,
        tien: HT.fmt.usd, tien0: HT.fmt.usd0, claims: kn, hoTro: true, tabDau: 'nt', playlists: HTS.plCua(c, hs.id) });
      var dr = document.querySelector('.drawer');
      if (dr) {
        HM.bam(dr, '[data-yc-mkt]', function (b) { HT.moTicket(c, { type: 'marketing', trackId: +b.getAttribute('data-yc-mkt') }); });
        HM.bam(dr, '[data-yc-ht]', function (b) { HT.moTicket(c, { type: 'nen-tang', trackId: +b.getAttribute('data-yc-ht') }); });
      }
    });
  }
});

function nhanNgay(s) { return String(s).slice(8, 10) + '.' + String(s).slice(5, 7); }

})();
