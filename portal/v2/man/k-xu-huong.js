/* =====================================================================
   CỔNG ĐỐI TÁC · XU HƯỚNG NGÀY
   ---------------------------------------------------------------------
   Báo cáo doanh thu về sau một tới ba tháng; lượt nghe theo ngày thì
   nền tảng gửi gần như tức thời. Trang này là chỗ đối tác xem "tuần này
   thế nào": tổng lượt nghe của cửa sổ 7 / 28 / 60 ngày so với cửa sổ
   trước, biểu đồ theo ngày (cột, vùng hoặc đường), rồi xếp hạng theo bài
   hát, bản phát hành, nghệ sĩ (label), thị trường, nền tảng, và nhân
   khẩu học người nghe. Không có tiền ở đây: tiền chỉ có khi kỳ được xét
   duyệt, trang Dự báo mới nhân lượt nghe với mức trả.
   ===================================================================== */
"use strict";
(function () {

var LOC = { ngay: 28, tab: 'bai', kieu: 'vung' };
function moBai(c, id, la) {
  var api = c.api, me = c.phien.me, hs;
  try { hs = api.trackAsset(me.role, me.partyId, id); } catch (e) { c.thongBao(e.message, 'no'); return; }
  HTS.moNgan(c, hs, { mineLabel: la ? HTS.t('label') : HTS.t('toi'), revenueLabel: la ? HTS.t('gop') : HTS.t('toi'), anMine: !la,
    tien: HT.fmt.usd, tien0: HT.fmt.usd0, playlists: HTS.plCua(c, id), hoTro: true, tabDau: 'pl' });
  var dr = document.querySelector('.drawer');
  if (dr && HT.moTicket) {
    HM.bam(dr, '[data-yc-mkt]', function (b) { HT.moTicket(c, { type: 'marketing', trackId: +b.getAttribute('data-yc-mkt') }); });
    HM.bam(dr, '[data-yc-ht]', function (b) { HT.moTicket(c, { type: 'nen-tang', trackId: +b.getAttribute('data-yc-ht') }); });
  }
}

HT.dangKy({
  id: 'k-xu-huong', nav: 'navXuHuong', nhom: 'nhomBai', icon: 'up',

  chu: {
    vi: {
      navXuHuong: 'Xu hướng ngày', h1: 'Xu hướng ngày',
      mo: 'Lượt nghe theo ngày do nền tảng gửi về, xếp theo bài hát, bản phát hành, thị trường và nền tảng. Đây là số theo dõi xu hướng; tiền chỉ có khi kỳ được xét duyệt.',
      kTong: 'Lượt nghe {n} ngày', kyTruoc: '{n} ngày trước', kNgay: 'Trung bình mỗi ngày', kBai: 'Bài hát có lượt nghe', kBaiS: 'trong cửa sổ đang chọn',
      kNt: 'Nền tảng dẫn đầu', kTt: 'Thị trường dẫn đầu', cuaTong: 'của tổng',
      dienBien: 'Lượt nghe theo ngày', dienBienMo: 'Mỗi cột hoặc điểm là một ngày. Đổi cửa sổ và kiểu biểu đồ ở góc phải.',
      n7: '7 ngày', n28: '28 ngày', n60: '60 ngày', cot: 'Cột', vung: 'Vùng', duong: 'Đường', luot: 'Lượt nghe',
      top: 'Xếp hạng trong cửa sổ', topMo: 'Thanh là tỷ lệ so với dòng đứng đầu; phần trăm là thay đổi so với cửa sổ trước. Bấm một bài hát để mở hồ sơ.',
      tabBai: 'Bài hát', tabPh: 'Bản phát hành', tabNs: 'Nghệ sĩ', tabTt: 'Thị trường', tabNt: 'Nền tảng',
      nhanKhau: 'Người nghe của bạn', nhanKhauMo: 'Nhân khẩu học do nền tảng cung cấp, tính trên cửa sổ đang chọn.',
      gioiTinh: 'Giới tính', doTuoi: 'Độ tuổi', nguon: 'Nguồn nghe', thueBao: 'Loại thuê bao', boQua: 'Tỷ lệ bỏ qua bài', cungCap: 'Số liệu do nền tảng cung cấp:',
      track: 'track', bai: 'bài hát', phanTram: '% người nghe',
      trong: 'Chưa có lượt nghe theo ngày', trongMo: 'Nền tảng bắt đầu gửi lượt nghe theo ngày sau khi bài hát đầu tiên lên nền tảng.',
      luuY: 'Lưu ý'
    },
    en: {
      navXuHuong: 'Daily trends', h1: 'Daily trends',
      mo: 'Daily streams as reported by the platforms, grouped by track, release, market and platform. These track momentum; money only appears once a period is approved.',
      kTong: 'Streams, {n} days', kyTruoc: 'previous {n} days', kNgay: 'Average per day', kBai: 'Tracks with streams', kBaiS: 'in the selected window',
      kNt: 'Top platform', kTt: 'Top market', cuaTong: 'of total',
      dienBien: 'Streams per day', dienBienMo: 'One bar or point per day. Change the window and chart type on the right.',
      n7: '7 days', n28: '28 days', n60: '60 days', cot: 'Bar', vung: 'Area', duong: 'Line', luot: 'Streams',
      top: 'Ranking in the window', topMo: 'Bars are relative to the top row; the percentage is the change against the previous window. Open a track for its record.',
      tabBai: 'Tracks', tabPh: 'Releases', tabNs: 'Artists', tabTt: 'Markets', tabNt: 'Platforms',
      nhanKhau: 'Your listeners', nhanKhauMo: 'Demographics provided by the platforms, over the selected window.',
      gioiTinh: 'Gender', doTuoi: 'Age', nguon: 'Source', thueBao: 'Subscription', boQua: 'Skip rate', cungCap: 'Data provided by:',
      track: 'tracks', bai: 'tracks', phanTram: '% of listeners',
      trong: 'No daily streams yet', trongMo: 'Platforms start sending daily streams once your first track is live.',
      luuY: 'Note'
    }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, vi = c.lang === 'vi', P = HB.dayMau(), la = me.role === 'label';
    var d;
    try { d = api.dailyTrends(me.role, me.partyId, LOC.ngay); } catch (e) { d = null; }
    if (!d || !d.total) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) }) + HM.the({ than: HM.trong({ icon: 'up', tieuDe: t('trong'), moTa: t('trongMo') }) });
      return;
    }
    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(HT.fmt.date(d.from) + ' – ' + HT.fmt.date(d.to)) + '</span>',
      mo: HM.esc(t('mo'))
    });
    /* "Nền tảng khác" là rổ gom các nền tảng nhỏ, không phải một nền tảng dẫn đầu */
    var ntDau = d.byPlatform.filter(function (x) { return x.name !== 'Nền tảng khác'; })[0] || d.byPlatform[0];
    html += HM.so([
      { l: t('kTong').replace('{n}', d.days), v: HT.fmt.n(d.total), lon: true, tia: d.series.map(function (s) { return s.streams; }),
        d: HM.lech(d.total, d.prevTotal, t('kyTruoc').replace('{n}', d.days)) },
      { l: t('kNgay'), v: HT.fmt.n(d.avgPerDay) },
      { l: t('kBai'), v: HT.fmt.n(d.tracksCounted), s: t('kBaiS') },
      ntDau ? { l: t('kNt'), v: c.song(ntDau, 'name'), s: HT.fmt.pct(ntDau.streams / d.total) + ' ' + t('cuaTong') } : null,
      d.byCountry[0] ? { l: t('kTt'), v: d.byCountry[0].name, s: HT.fmt.pct(d.byCountry[0].streams / d.total) + ' ' + t('cuaTong') } : null
    ].filter(Boolean));

    /* ---- biểu đồ theo ngày: cột / vùng / đường ---- */
    var truc = d.series.map(function (s) { return s.date.slice(8, 10) + '/' + s.date.slice(5, 7); });
    var chuoi = [{ ten: t('luot'), gt: d.series.map(function (s) { return s.streams; }), mau: P[0] }];
    var tip = function (i) { return HT.fmt.date(d.series[i].date); };
    var bd = LOC.kieu === 'cot'
      ? HB.o({ loai: 'cot', cao: 260, dinhDang: 'so', chuThich: false, truc: truc, chuoi: chuoi, tieuDeTip: tip })
      : HB.o({ loai: 'duong', cao: 260, dinhDang: 'so', chuThich: false, vung: LOC.kieu === 'vung', truc: truc, chuoi: chuoi, tieuDeTip: tip });
    html += HM.the({
      h2: HM.esc(t('dienBien')), p: HM.esc(t('dienBienMo')),
      hanhDong: [7, 28, 60].map(function (n) {
          return '<button type="button" class="pill' + (LOC.ngay === n ? ' on' : '') + '" data-ngay="' + n + '">' + HM.esc(t('n' + n)) + '</button>';
        }).join('') + '<span style="width:8px"></span>' +
        ['cot', 'vung', 'duong'].map(function (k) {
          return '<button type="button" class="pill' + (LOC.kieu === k ? ' on' : '') + '" data-kieu="' + k + '">' + HM.esc(t(k)) + '</button>';
        }).join(''),
      than: bd,
      chan: HM.esc(c.song(d, 'note'))
    });

    /* ---- xếp hạng theo chiều ---- */
    var tabs = [{ k: 'bai', l: t('tabBai') }, { k: 'ph', l: t('tabPh') }]
      .concat(la ? [{ k: 'ns', l: t('tabNs') }] : [])
      .concat([{ k: 'tt', l: t('tabTt') }, { k: 'nt', l: t('tabNt') }]);
    if (!tabs.some(function (x) { return x.k === LOC.tab; })) LOC.tab = 'bai';
    var rows;
    if (LOC.tab === 'bai') rows = d.topTracks.slice(0, 12).map(function (x) { return { ten: x.title, phu: x.artist + ' · ' + x.isrc, gt: x.streams, bia: x.id, lech: HM.lech(x.streams, x.prev), pick: true, attr: 'data-bg="' + x.id + '"' }; });
    else if (LOC.tab === 'ph') rows = d.topReleases.slice(0, 12).map(function (x) { return { ten: x.title, phu: x.artist + ' · ' + x.type + ' · ' + x.tracks + ' ' + t('track'), gt: x.streams, bia: x.trackId, lech: HM.lech(x.streams, x.prev), pick: true, attr: 'data-bg="' + x.trackId + '"' }; });
    else if (LOC.tab === 'ns') rows = d.topArtists.slice(0, 12).map(function (x) { return { ten: x.name, phu: x.clientId + ' · ' + x.tracks + ' ' + t('bai'), gt: x.streams, hinh: true, seed: x.clientId, lech: HM.lech(x.streams, x.prev) }; });
    else if (LOC.tab === 'tt') rows = d.byCountry.map(function (x, i) { return { ten: x.name, gt: x.streams, mau: P[i % 8], phuV: HT.fmt.pct(x.streams / d.total) }; });
    else rows = d.byPlatform.map(function (x, i) { return { ten: c.song(x, 'name'), gt: x.streams, mau: x.name === 'Nền tảng khác' ? HB.mauKhac() : P[i % 8], phuV: HT.fmt.pct(x.streams / d.total) }; });

    var demo = d.demo;
    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('top')), p: HM.esc(t('topMo')),
        than: HM.tabs(tabs, LOC.tab) + HM.xepHang(rows)
      }) +
      HM.the({
        h2: HM.esc(t('nhanKhau')), p: HM.esc(t('nhanKhauMo')),
        than: '<div class="grid g2" style="margin-bottom:0">' +
          '<div><h4 class="sec" style="margin-top:0">' + HM.esc(t('gioiTinh')) + '</h4>' +
            HB.o({ loai: 'vong', cao: 150, dinhDang: 'so', chuThich: true, tenTong: t('phanTram'),
              phan: demo.gender.map(function (x, i) { return { ten: c.song(x, 'label'), gt: x.pct, mau: [P[6], P[4], HB.mauKhac()][i] }; }) }) + '</div>' +
          '<div><h4 class="sec" style="margin-top:0">' + HM.esc(t('thueBao')) + '</h4>' +
            HB.o({ loai: 'vong', cao: 150, dinhDang: 'so', chuThich: true, tenTong: t('phanTram'),
              phan: demo.subscription.map(function (x, i) { return { ten: c.song(x, 'label'), gt: x.pct, mau: [P[0], P[3], P[1], P[2]][i] }; }) }) + '</div></div>' +
          '<h4 class="sec">' + HM.esc(t('doTuoi')) + '</h4>' +
          HB.o({ loai: 'thanh', dinhDang: 'so', tenTong: t('phanTram'), hang: demo.age.map(function (x, i) { return { ten: c.song(x, 'label'), gt: x.pct, mau: i === demo.age.length - 1 ? HB.mauKhac() : P[0] }; }) }) +
          '<h4 class="sec">' + HM.esc(t('nguon')) + '</h4>' +
          HB.o({ loai: 'thanh', dinhDang: 'so', tenTong: t('phanTram'), hang: demo.source.map(function (x, i) { return { ten: c.song(x, 'label'), gt: x.pct, mau: P[i % 8] }; }) }) +
          '<div class="hint" style="margin-top:10px">' + HM.esc(t('boQua') + ': ' + HT.fmt.pct(demo.skippedPct / 100) + ' · ' + t('cungCap') + ' ' + demo.providers.join(', ')) + '</div>'
      }) + '</div>';

    root.innerHTML = html;
    HB.gan(root);
    HM.bam(root, '[data-ngay]', function (el) { LOC.ngay = +el.getAttribute('data-ngay'); c.veLai(); });
    HM.bam(root, '[data-kieu]', function (el) { LOC.kieu = el.getAttribute('data-kieu'); c.veLai(); });
    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-bg]', function (el) { moBai(c, +el.getAttribute('data-bg'), la); });
  }
});

})();
