/* =====================================================================
   CỔNG ĐỐI TÁC · NGHỆ SĨ CỦA LABEL
   ---------------------------------------------------------------------
   Chỉ label mới có trang này. Câu hỏi của chủ label mỗi tháng: từng
   nghệ sĩ trong roster mang về bao nhiêu, Haustek thanh toán cho nghệ sĩ
   bao nhiêu, và label được hưởng bao nhiêu trên từng người.

   Tạm ứng cá nhân của nghệ sĩ KHÔNG có ở đây: đó là chuyện giữa nghệ sĩ
   với Haustek (giả định của bản mẫu, câu hỏi cần chốt số 8).
   ===================================================================== */
"use strict";
(function () {

var LOC = { tim: '', sap: 'revenue', huong: -1 };

HT.dangKy({
  id: 'k-nghe-si', nav: 'navNs', nhom: 'nhomLabel', icon: 'user',
  khaDung: function (c) { return c.phien && c.phien.me && c.phien.me.role === 'label'; },

  chu: {
    vi: {
      navNs: 'Nghệ sĩ', h1: 'Nghệ sĩ của label',
      mo: 'Từng nghệ sĩ trong roster mang về bao nhiêu trong kỳ, số thanh toán cho nghệ sĩ và phần label được hưởng.',
      soNs: 'Nghệ sĩ trong roster', coDt: 'Có doanh thu kỳ này', gop: 'Doanh thu của roster',
      traNs: 'Thanh toán cho nghệ sĩ', labelHuong: 'Phần label được hưởng',
      tim: 'Tìm tên hoặc mã nghệ sĩ…',
      cNs: 'Nghệ sĩ', cBai: 'Bài hát có doanh thu', cLuot: 'Lượt nghe', cGop: 'Doanh thu',
      cNsHuong: 'Phần nghệ sĩ', cLabel: 'Phần label', cTyLe: 'Tỷ lệ',
      topNs: 'Nghệ sĩ mang về doanh thu nhiều nhất kỳ này', topNsMo: 'Theo doanh thu. Bấm một dòng trong bảng để xem chi tiết.',
      khongCo: 'Không có nghệ sĩ nào khớp với từ khoá', khongCoMo: 'Thử tìm bằng mã đối tác của nghệ sĩ.',
      chuaMo: 'Kỳ này chưa chốt sổ', chuaMoMo: 'Số liệu theo nghệ sĩ chỉ hiển thị sau khi kỳ được xét duyệt.',
      ghiChu: 'Phần nghệ sĩ là số Haustek thanh toán thẳng cho nghệ sĩ theo tỷ lệ label đã đặt; phần label là phần còn lại. Phần nghệ sĩ, phần label và điểm producer cộng lại bằng doanh thu.',
      xuat: 'Xuất CSV', hienThi: 'Hiển thị',
      chiTiet: 'Bài hát của nghệ sĩ này trong kỳ', khongBai: 'Kỳ này nghệ sĩ chưa có bài hát nào phát sinh doanh thu.',
      diemProducer: 'Điểm producer'
    },
    en: {
      navNs: 'Artists', h1: 'Artists on your label',
      mo: 'What each artist on the roster brought in this period, what Haustek pays the artist, and what the label keeps.',
      soNs: 'Artists on the roster', coDt: 'Earning this period', gop: 'Roster revenue',
      traNs: 'Paid to artists', labelHuong: 'Label’s share',
      tim: 'Search artist name or code…',
      cNs: 'Artist', cBai: 'Earning tracks', cLuot: 'Streams', cGop: 'Revenue',
      cNsHuong: 'Artist share', cLabel: 'Label share', cTyLe: 'Rate',
      topNs: 'Top artists this period', topNsMo: 'By revenue. Open a row in the table for details.',
      khongCo: 'No artist matches', khongCoMo: 'Try the artist’s client ID.',
      chuaMo: 'Period not closed', chuaMoMo: 'Per-artist figures appear once the period is approved.',
      ghiChu: 'The artist share is what Haustek pays the artist directly at the rate the label set; the label share is the remainder. Artist share, label share and producer points add back to revenue.',
      xuat: 'Export CSV', hienThi: 'Showing',
      chiTiet: 'This artist’s tracks this period', khongBai: 'No track by this artist earned this period.',
      diemProducer: 'Producer points'
    }
  },

  dem: function (c) {
    try { return HT.fmt.n(c.api.rosterArtists(c.phien.me.role, c.phien.me.partyId).rows.length); } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, P = HB.dayMau();
    var r;
    try { r = api.roster(me.role, me.partyId, c.kyKey); }
    catch (e) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) }) +
        HM.the({ than: HM.trong({ icon: 'clock', tieuDe: t('chuaMo'), moTa: t('chuaMoMo') }) });
      return;
    }
    var hd;
    try { hd = api.contract(me.role, me.partyId, c.kyKey); } catch (e) { hd = null; }

    var q = LOC.tim.trim().toLowerCase();
    var rows = r.rows.filter(function (x) {
      return !q || x.name.toLowerCase().indexOf(q) >= 0 || x.clientId.toLowerCase().indexOf(q) >= 0;
    });
    rows.sort(function (a, b) {
      var k = LOC.sap, va = a[k], vb = b[k];
      if (typeof va === 'string') return va.localeCompare(vb, 'vi') * LOC.huong;
      return (va - vb) * LOC.huong;
    });

    var html = HM.dau({ h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>', mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('gop'), v: HT.fmt.usd0(r.total.revenue), lon: true },
      { l: t('traNs'), v: HT.fmt.usd0(r.total.artist), s: hd ? HT.fmt.pct(hd.artistShare) + (c.lang === 'vi' ? ' của doanh thu' : ' of revenue') : '' },
      { l: t('labelHuong'), v: HT.fmt.usd0(r.total.labelCut), s: hd ? HT.fmt.pct(hd.labelShare) + (c.lang === 'vi' ? ' của doanh thu' : ' of revenue') : '', mau: HB.mau('ok') },
      { l: t('soNs'), v: HT.fmt.n(r.count), s: HT.fmt.n(r.earning) + ' ' + (c.lang === 'vi' ? 'có doanh thu' : 'earning') }
    ]);

    var top = r.rows.filter(function (x) { return x.revenue > 0; }).slice(0, 8);
    if (top.length) {
      html += HM.the({
        h2: HM.esc(t('topNs')), p: HM.esc(t('topNsMo')),
        than: HB.o({ loai: 'thanh', tenTong: t('cGop'), hang: top.map(function (x, i) {
          return { ten: x.name, gt: x.revenue, phu: x.clientId, mau: P[i % 8] };
        }) })
      });
    }

    html += HM.the({
      h2: HM.esc(t('cNs')) + ' <span class="muted">(' + HM.esc(HT.fmt.n(rows.length)) + ')</span>',
      hanhDong: '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim value="' + HM.esc(LOC.tim) +
        '" placeholder="' + HM.esc(t('tim')) + '"></div>' +
        '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>',
      thoBody: true,
      than: rows.length ? '<div class="tw"><table class="t"><thead><tr>' +
        cot('name', t('cNs'), false) + cot('tracks', t('cBai'), true) + cot('streams', t('cLuot'), true) +
        cot('revenue', t('cGop'), true) + cot('artist', t('cNsHuong'), true) + cot('labelCut', t('cLabel'), true) +
        '</tr></thead><tbody>' + rows.map(function (x) {
          return '<tr class="pick" data-ns="' + x.artistId + '">' +
            '<td><div class="t-ttl">' + HM.esc(x.name) + '</div><div class="t-sub">' + HM.esc(x.clientId) + '</div></td>' +
            '<td class="num">' + (x.tracks ? HM.esc(HT.fmt.n(x.tracks)) : '<span class="nil">—</span>') + '</td>' +
            '<td class="num">' + (x.streams ? HM.esc(HT.fmt.n(x.streams)) : '<span class="nil">—</span>') + '</td>' +
            '<td class="num">' + (x.revenue ? HM.esc(HT.fmt.usd(x.revenue)) : '<span class="nil">—</span>') + '</td>' +
            '<td class="num">' + (x.artist ? HM.esc(HT.fmt.usd(x.artist)) : '<span class="nil">—</span>') + '</td>' +
            '<td class="num band">' + (x.labelCut ? HM.esc(HT.fmt.usd(x.labelCut)) : '<span class="nil">—</span>') + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><td>' + HM.esc(c.lang === 'vi' ? 'Tổng cộng' : 'Total') + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(rows.reduce(function (s, x) { return s + x.tracks; }, 0))) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(rows.reduce(function (s, x) { return s + x.streams; }, 0))) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.usd(rows.reduce(function (s, x) { return s + x.revenue; }, 0))) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.usd(rows.reduce(function (s, x) { return s + x.artist; }, 0))) + '</td>' +
        '<td class="num band">' + HM.esc(HT.fmt.usd(rows.reduce(function (s, x) { return s + x.labelCut; }, 0))) + '</td></tr></tfoot></table></div>'
        : HM.trong({ icon: 'user', tieuDe: t('khongCo'), moTa: t('khongCoMo') }),
      chan: HM.esc(t('ghiChu'))
    });

    root.innerHTML = html;
    HB.gan(root);

    function cot(k, nhan, so) {
      return '<th class="s' + (so ? ' num' : '') + (LOC.sap === k ? ' sorted' : '') + '" data-sx="' + k + '">' + HM.esc(nhan) +
        (LOC.sap === k ? '<span class="ar">' + (LOC.huong > 0 ? '↑' : '↓') + '</span>' : '') + '</th>';
    }
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-sx]', function (el) {
      var k = el.getAttribute('data-sx');
      if (LOC.sap === k) LOC.huong = -LOC.huong; else { LOC.sap = k; LOC.huong = k === 'name' ? 1 : -1; }
      c.veLai();
    });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('nghe-si-' + me.clientId + '-' + c.kyKey + '.csv',
        [c.lang === 'vi' ? 'Mã nghệ sĩ' : 'Artist ID', c.lang === 'vi' ? 'Tên' : 'Name', t('cBai'), t('cLuot'), t('cGop'), t('cNsHuong'), t('cLabel'), t('diemProducer')],
        rows.map(function (x) { return [x.clientId, x.name, x.tracks, x.streams, x.revenue.toFixed(2), x.artist.toFixed(2), x.labelCut.toFixed(2), x.producer.toFixed(2)]; }));
    });
    HM.bam(root, '[data-ns]', function (el) { moNgheSi(c, r.rows.filter(function (x) { return x.artistId === +el.getAttribute('data-ns'); })[0]); });
  }
});

function moNgheSi(c, x) {
  if (!x) return;
  var api = c.api, me = c.phien.me, t = c.t, P = HB.dayMau();
  var bg;
  try { bg = api.tracks(me.role, me.partyId, c.kyKey, 'rec', { q: x.name, sort: 'revenue', dir: -1 }); }
  catch (e) { bg = { rows: [], total: 0 }; }
  var rows = bg.rows.filter(function (r) { return r.artist === x.name; }).slice(0, 12);
  c.nganTruot(
    HM.so([
      { l: t('cGop'), v: HT.fmt.usd(x.revenue), lon: true },
      { l: t('cNsHuong'), v: HT.fmt.usd(x.artist) },
      { l: t('cLabel'), v: HT.fmt.usd(x.labelCut), mau: HB.mau('ok') }
    ]) +
    (x.producer > 0 ? '<p class="hint" style="margin-top:8px">' + HM.esc(t('diemProducer') + ': ' + HT.fmt.usd(x.producer)) + '</p>' : '') +
    '<h4 class="sec">' + HM.esc(t('chiTiet')) + '</h4>' +
    (rows.length ? '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + HM.esc(c.lang === 'vi' ? 'Bài hát' : 'Track') + '</th>' +
      '<th class="num">' + HM.esc(t('cLuot')) + '</th><th class="num">' + HM.esc(t('cGop')) + '</th><th class="num band">' + HM.esc(t('cLabel')) + '</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td><div class="t-ttl">' + HM.esc(HM.dai(r.title, 34)) + '</div><div class="t-sub">' + HM.esc(r.isrc) + '</div></td>' +
          '<td class="num">' + HM.esc(HT.fmt.n(r.streams)) + '</td><td class="num">' + HM.esc(HT.fmt.usd0(r.revenue)) + '</td>' +
          '<td class="num band">' + HM.esc(HT.fmt.usd(r.mine)) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<p class="say">' + HM.esc(t('khongBai')) + '</p>'),
    { tieuDe: x.name, phu: x.clientId + ' · ' + c.ky.label, khiMo: function (dr) { HB.gan(dr); } });
}

})();
