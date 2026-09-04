/* =====================================================================
   CỔNG ĐỐI TÁC · HỆ THỐNG LABEL
   ---------------------------------------------------------------------
   Chỉ label mẹ (label có label con) mới có trang này. Câu hỏi của chủ
   label mẹ: toàn hệ thống kỳ này làm ra bao nhiêu, từng label con và
   từng nghệ sĩ bên dưới đóng góp bao nhiêu, và muốn xem kỹ một label con
   thì mở cổng của label con đó với tư cách người được uỷ quyền.

   Tiền KHÔNG đi qua label mẹ: phần label được hưởng của mỗi bản ghi thuộc
   về label trực tiếp quản lý bản ghi đó. Label mẹ chỉ theo dõi số liệu
   (giả định của bản mẫu, câu hỏi cần chốt số 9).
   ===================================================================== */
"use strict";
(function () {

var TOP_NS = 5;   /* số nghệ sĩ hiện sẵn dưới mỗi label trong cây */

var LOC = { sap: 'gross', huong: -1, moRong: {} };

HT.dangKy({
  id: 'k-he-thong', nav: 'navHeThong', icon: 'tree',
  khaDung: function (c) {
    var me = c.phien && c.phien.me;
    return !!(me && me.role === 'label' && me.childLabels > 0);
  },

  chu: {
    vi: {
      navHeThong: 'Hệ thống label', h1: 'Hệ thống label',
      mo: 'Toàn bộ label con và nghệ sĩ bên dưới, theo kỳ đã xét duyệt. Phần label được hưởng của mỗi bản ghi thuộc về label trực tiếp quản lý bản ghi đó; label mẹ theo dõi số liệu, không có dòng tiền đi qua label mẹ (câu hỏi cần chốt số 9).',
      kGop: 'Doanh thu gộp toàn hệ thống', kTraNs: 'Thanh toán cho nghệ sĩ',
      kLabel: 'Phần label được hưởng toàn hệ thống', kLabelMe: 'trong đó label mẹ: {n}',
      kNs: 'Nghệ sĩ toàn hệ thống', kLabelCon: '{n} label con',
      dienBien: 'Diễn biến qua các kỳ',
      dienBienMo: 'Doanh thu gộp của label mẹ và từng label con, chồng theo từng kỳ đã xét duyệt. Kỳ đang chọn được tô đậm.',
      cauTruc: 'Cấu trúc',
      cauTrucMo: 'Label mẹ, các label con và nghệ sĩ bên dưới. Bấm một label con để xem chi tiết.',
      labelMe: 'Label mẹ', labelCon: 'Label con', labelConS: 'label con',
      nsTrucTiep: 'nghệ sĩ trực tiếp', ns: 'nghệ sĩ', nsHuong: 'nghệ sĩ được hưởng',
      gop: 'gộp', phanLabel: 'phần label', baiCoDt: 'bài hát có doanh thu',
      them: 'và {n} nghệ sĩ khác', thuGon: 'Thu gọn danh sách',
      khongNs: 'Chưa có nghệ sĩ nào', khongDt: 'chưa có doanh thu',
      xemCong: 'Xem cổng của label này',
      bang: 'Label con',
      cLabel: 'Label', cNs: 'Nghệ sĩ', cBai: 'Bài hát có doanh thu / tổng', cLuot: 'Lượt nghe',
      cGop: 'Doanh thu gộp', cNsHuong: 'Phần nghệ sĩ', cLabelHuong: 'Phần label', cTyLe: 'Tỷ lệ',
      tong: 'Tổng cộng toàn hệ thống',
      ghiChu: 'Tỷ lệ là tỷ lệ nghệ sĩ được hưởng trên doanh thu sau phí dịch vụ Haustek, do từng label đặt riêng. Phần label của một label con thuộc về label con đó; label mẹ theo dõi số liệu, không được hưởng phần này.',
      xuat: 'Xuất CSV',
      chuaMo: 'Kỳ này chưa chốt sổ', chuaMoMo: 'Số liệu hệ thống label chỉ hiển thị sau khi kỳ được xét duyệt.',
      nganNs: 'Nghệ sĩ của label con này trong kỳ', cMa: 'Mã', cTen: 'Nghệ sĩ',
      nganKhongNs: 'Kỳ này label con chưa có nghệ sĩ nào phát sinh doanh thu.'
    },
    en: {
      navHeThong: 'Label network', h1: 'Label network',
      mo: 'Every sub-label and the artists under it, for approved periods. The label share of each recording belongs to the label that directly manages it; the parent label sees the figures, no money passes through it (open question 9).',
      kGop: 'Network gross revenue', kTraNs: 'Paid to artists',
      kLabel: 'Label share across the network', kLabelMe: 'of which parent label: {n}',
      kNs: 'Artists across the network', kLabelCon: '{n} sub-labels',
      dienBien: 'Across periods',
      dienBienMo: 'Gross revenue of the parent label and each sub-label, stacked per approved period. The selected period is highlighted.',
      cauTruc: 'Structure',
      cauTrucMo: 'Parent label, sub-labels and the artists under each. Open a sub-label for details.',
      labelMe: 'Parent label', labelCon: 'Sub-label', labelConS: 'sub-labels',
      nsTrucTiep: 'direct artists', ns: 'artists', nsHuong: 'artist share',
      gop: 'gross', phanLabel: 'label share', baiCoDt: 'earning tracks',
      them: 'and {n} more artists', thuGon: 'Show fewer',
      khongNs: 'No artists yet', khongDt: 'nothing earned',
      xemCong: 'Open this label’s portal',
      bang: 'Sub-labels',
      cLabel: 'Label', cNs: 'Artists', cBai: 'Earning tracks / total', cLuot: 'Streams',
      cGop: 'Gross', cNsHuong: 'Artist share', cLabelHuong: 'Label share', cTyLe: 'Rate',
      tong: 'Network total',
      ghiChu: 'Rate is the artist share of revenue after the Haustek service fee, set by each label. A sub-label’s label share belongs to that sub-label; the parent label sees the figure but does not receive it.',
      xuat: 'Export CSV',
      chuaMo: 'Period not closed', chuaMoMo: 'Label network figures appear once the period is approved.',
      nganNs: 'This sub-label’s artists this period', cMa: 'Code', cTen: 'Artist',
      nganKhongNs: 'No artist of this sub-label earned this period.'
    }
  },

  dem: function (c) {
    try { return c.phien.me.childLabels > 0 ? HT.fmt.n(c.phien.me.childLabels) : ''; } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, P = HB.dayMau(), vi = c.lang === 'vi';
    var d;
    try { d = api.labelTree(me.role, me.partyId, c.kyKey); }
    catch (e) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>', mo: HM.esc(t('mo')) }) +
        HM.the({ than: HM.trong({ icon: 'clock', tieuDe: t('chuaMo'), moTa: t('chuaMoMo') }) });
      return;
    }
    var own = d.own, cons = d.children, tong = d.total;

    var html = HM.dau({ h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>', mo: HM.esc(t('mo')) });

    /* ---- ô số ---- */
    html += HM.so([
      { l: t('kGop'), v: HT.fmt.usd0(tong.gross), lon: true },
      { l: t('kTraNs'), v: HT.fmt.usd0(tong.artist) },
      { l: t('kLabel'), v: HT.fmt.usd0(tong.labelCut), mau: HB.mau('ok'),
        s: t('kLabelMe').replace('{n}', HT.fmt.usd0(own.labelCut)) },
      { l: t('kNs'), v: HT.fmt.n(tong.artists), s: t('kLabelCon').replace('{n}', HT.fmt.n(cons.length)) }
    ]);

    /* ---- diễn biến: cột chồng, label mẹ + từng label con ---- */
    var noiBat = -1;
    d.history.forEach(function (h, i) { if (h.k === c.kyKey) noiBat = i; });
    html += HM.the({
      h2: HM.esc(t('dienBien')), p: HM.esc(t('dienBienMo')),
      than: HB.o({
        loai: 'cot', cao: 230, chuThich: true,
        truc: d.history.map(function (h) { return h.label; }),
        tieuDeTip: function (i) { return (vi ? 'Kỳ ' : 'Period ') + d.history[i].label; },
        chuoi: [{ ten: own.name + ' · ' + t('labelMe').toLowerCase(), gt: d.history.map(function (h) { return h.own; }), mau: P[0] }]
          .concat(cons.map(function (ch, i) {
            return { ten: ch.name, gt: d.history.map(function (h) { return h.children[i]; }), mau: P[(i + 1) % 8] };
          })),
        noiBat: noiBat
      })
    });

    /* ---- cấu trúc: cây ---- */
    html += HM.the({
      h2: HM.esc(t('cauTruc')), p: HM.esc(t('cauTrucMo')),
      than: '<ul class="tree"><li>' +
        '<div class="nd me"><div class="ic">' + HM.icon('tree') + '</div>' +
          '<div><b>' + HM.esc(own.name) + '</b><span>' + HM.esc(own.clientId + ' · ' + t('labelMe').toLowerCase() + ' · ' +
            HT.fmt.n(own.artistsCount) + ' ' + t('nsTrucTiep')) + '</span></div>' +
          '<div class="v">' + HM.esc(HT.fmt.usd0(own.gross)) + '<span>' + HM.esc(t('phanLabel') + ' ' + HT.fmt.usd0(own.labelCut)) + '</span></div>' +
        '</div>' +
        veNgheSi(c, own) +
        (cons.length ? '<ul>' + cons.map(function (ch) {
          return '<li><div class="nd pick" data-lc="' + ch.labelId + '"><div class="ic">' + HM.icon('layers') + '</div>' +
            '<div><b>' + HM.esc(ch.name) + '</b><span>' + HM.esc(ch.clientId + ' · ' + HT.fmt.n(ch.artistsCount) + ' ' + t('ns') +
              ' · ' + t('nsHuong') + ' ' + HT.fmt.pct(ch.rate)) + '</span></div>' +
            '<div class="v">' + HM.esc(HT.fmt.usd0(ch.gross)) + '<span>' + HM.esc(t('phanLabel') + ' ' + HT.fmt.usd0(ch.labelCut)) + '</span></div>' +
            '</div>' +
            veNgheSi(c, ch, '<li><div class="btnrow" style="padding:2px 0 10px 12px"><button type="button" class="btn sm" data-xem-thay="' + ch.labelId + '">' +
              HM.icon('out') + HM.esc(t('xemCong')) + '</button></div></li>') +
            '</li>';
        }).join('') + '</ul>' : '') +
        '</li></ul>'
    });

    /* ---- bảng label con: label mẹ đứng đầu, label con sắp xếp được ---- */
    var rows = cons.slice().sort(function (a, b) {
      var k = LOC.sap, va = a[k], vb = b[k];
      if (typeof va === 'string') return va.localeCompare(vb, 'vi') * LOC.huong;
      return (va - vb) * LOC.huong;
    });
    function dong(x, laMe) {
      return '<tr' + (laMe ? '' : ' class="pick" data-lc="' + x.labelId + '"') + '>' +
        '<td><div class="t-ttl">' + HM.esc(x.name) + (laMe ? ' ' + HM.tag(t('labelMe'), 'info') : '') + '</div>' +
          '<div class="t-sub">' + HM.esc(x.clientId) + '</div></td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(x.artistsCount)) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(x.earning) + ' / ' + HT.fmt.n(x.tracks)) + '</td>' +
        '<td class="num">' + (x.streams ? HM.esc(HT.fmt.n(x.streams)) : '<span class="nil">—</span>') + '</td>' +
        '<td class="num">' + (x.gross ? HM.esc(HT.fmt.usd(x.gross)) : '<span class="nil">—</span>') + '</td>' +
        '<td class="num">' + (x.artist ? HM.esc(HT.fmt.usd(x.artist)) : '<span class="nil">—</span>') + '</td>' +
        '<td class="num band">' + (x.labelCut ? HM.esc(HT.fmt.usd(x.labelCut)) : '<span class="nil">—</span>') + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.pct(x.rate)) + '</td></tr>';
    }
    html += HM.the({
      h2: HM.esc(t('bang')) + ' <span class="muted">(' + HM.esc(HT.fmt.n(cons.length)) + ')</span>',
      hanhDong: '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>',
      thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr>' +
        cot('name', t('cLabel'), false) + cot('artistsCount', t('cNs'), true) + cot('earning', t('cBai'), true) +
        cot('streams', t('cLuot'), true) + cot('gross', t('cGop'), true) + cot('artist', t('cNsHuong'), true) +
        cot('labelCut', t('cLabelHuong'), true) + cot('rate', t('cTyLe'), true) +
        '</tr></thead><tbody>' + dong(own, true) + rows.map(function (x) { return dong(x, false); }).join('') +
        '</tbody><tfoot><tr><td>' + HM.esc(t('tong')) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(tong.artists)) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(tong.earning) + ' / ' + HT.fmt.n(tong.tracks)) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(tong.streams)) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.usd(tong.gross)) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.usd(tong.artist)) + '</td>' +
        '<td class="num band">' + HM.esc(HT.fmt.usd(tong.labelCut)) + '</td>' +
        '<td class="num"></td></tr></tfoot></table></div>',
      chan: HM.esc(t('ghiChu'))
    });

    root.innerHTML = html;
    HB.gan(root);

    function cot(k, nhan, so) {
      return '<th class="s' + (so ? ' num' : '') + (LOC.sap === k ? ' sorted' : '') + '" data-sx="' + k + '">' + HM.esc(nhan) +
        (LOC.sap === k ? '<span class="ar">' + (LOC.huong > 0 ? '↑' : '↓') + '</span>' : '') + '</th>';
    }
    HM.bam(root, '[data-sx]', function (el) {
      var k = el.getAttribute('data-sx');
      if (LOC.sap === k) LOC.huong = -LOC.huong; else { LOC.sap = k; LOC.huong = k === 'name' ? 1 : -1; }
      c.veLai();
    });
    HM.bam(root, '[data-mo]', function (el) {
      var id = el.getAttribute('data-mo');
      LOC.moRong[id] = !LOC.moRong[id];
      c.veLai();
    });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('he-thong-label-' + me.clientId + '-' + c.kyKey + '.csv',
        [vi ? 'Mã label' : 'Label ID', vi ? 'Tên' : 'Name', vi ? 'Vai trò' : 'Role', t('cNs'),
         vi ? 'Bài hát có doanh thu' : 'Earning tracks', vi ? 'Tổng bài hát' : 'Total tracks', t('cLuot'),
         t('cGop'), t('cNsHuong'), t('cLabelHuong'), t('cTyLe')],
        [own].concat(rows).map(function (x) {
          return [x.clientId, x.name, x.labelId === own.labelId ? t('labelMe') : t('labelCon'), x.artistsCount,
                  x.earning, x.tracks, x.streams, x.gross.toFixed(2), x.artist.toFixed(2), x.labelCut.toFixed(2), (x.rate * 100).toFixed(1) + '%'];
        }));
    });
    /* Nút "Xem cổng của label này" nằm trong cây; nút đó do trang khởi
       động xử lý (đổi phiên rồi nạp lại), ở đây không mở ngăn chồng lên. */
    HM.bam(root, '[data-lc]', function (el, e) {
      if (e.target.closest('[data-xem-thay]')) return;
      moLabelCon(c, cons.filter(function (x) { return x.labelId === +el.getAttribute('data-lc'); })[0]);
    });
  }
});

/* ---------------------------------------------------------------------
   Danh sách nghệ sĩ dưới một nút của cây: 5 người có doanh thu cao nhất,
   phần còn lại gộp thành một dòng "và n nghệ sĩ khác" bấm để mở rộng.
   Danh sách api trả về đã sắp theo doanh thu gộp giảm dần.
   --------------------------------------------------------------------- */
function veNgheSi(c, lb, duoi) {
  var t = c.t;
  var ds = lb.artists || [];
  if (!ds.length && !duoi) return '';
  var mo = !!LOC.moRong[lb.labelId];
  var hien = mo ? ds : ds.slice(0, TOP_NS);
  var con = ds.length - hien.length;
  return '<ul>' + (ds.length ? hien.map(function (a) {
    return '<li><div class="nd"><div class="ic ns">' + HM.icon('user') + '</div>' +
      '<div><b>' + HM.esc(a.name) + '</b><span>' + HM.esc(a.clientId + ' · ' +
        (a.tracks ? HT.fmt.n(a.tracks) + ' ' + t('baiCoDt') : t('khongDt'))) + '</span></div>' +
      '<div class="v">' + (a.gross ? HM.esc(HT.fmt.usd0(a.gross)) : '<span class="nil">—</span>') +
        '<span>' + HM.esc(t('phanLabel') + ' ' + HT.fmt.usd0(a.labelCut)) + '</span></div>' +
      '</div></li>';
  }).join('') : '<li><div class="nd"><div class="ic ns">' + HM.icon('user') + '</div><div><span>' + HM.esc(t('khongNs')) + '</span></div><div></div></div></li>') +
    (con > 0 ? '<li class="more" data-mo="' + lb.labelId + '">' + HM.esc(t('them').replace('{n}', HT.fmt.n(con))) + '</li>' : '') +
    (mo && ds.length > TOP_NS ? '<li class="more" data-mo="' + lb.labelId + '">' + HM.esc(t('thuGon')) + '</li>' : '') +
    (duoi || '') + '</ul>';
}

/* ---------------------------------------------------------------------
   Ngăn trượt: một label con
   --------------------------------------------------------------------- */
function moLabelCon(c, ch) {
  if (!ch) return;
  var t = c.t, vi = c.lang === 'vi';
  var ds = (ch.artists || []).slice().sort(function (a, b) { return b.gross - a.gross; });
  c.nganTruot(
    HM.so([
      { l: t('cGop'), v: HT.fmt.usd(ch.gross), lon: true },
      { l: t('cNsHuong'), v: HT.fmt.usd(ch.artist) },
      { l: t('cLabelHuong'), v: HT.fmt.usd(ch.labelCut), mau: HB.mau('ok') }
    ]) +
    HM.kv([
      { t: t('cNs'), v: HT.fmt.n(ch.artistsCount) + (vi ? ' · ' + HT.fmt.n(ch.earningArtists) + ' có doanh thu' : ' · ' + HT.fmt.n(ch.earningArtists) + ' earning') },
      { t: t('cBai'), v: HT.fmt.n(ch.earning) + ' / ' + HT.fmt.n(ch.tracks) },
      { t: t('cLuot'), v: HT.fmt.n(ch.streams) },
      { t: vi ? 'Tỷ lệ nghệ sĩ được hưởng' : 'Artist share rate', v: HT.fmt.pct(ch.rate), manh: true }
    ]) +
    '<div class="btnrow" style="margin-top:12px"><button type="button" class="btn pri sm" data-xem-thay="' + ch.labelId + '">' +
      HM.icon('out') + HM.esc(t('xemCong')) + '</button></div>' +
    '<h4 class="sec">' + HM.esc(t('nganNs')) + '</h4>' +
    (ds.length ? '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + HM.esc(t('cTen')) + '</th>' +
      '<th class="num">' + HM.esc(vi ? 'Bài hát' : 'Tracks') + '</th><th class="num">' + HM.esc(t('cLuot')) + '</th>' +
      '<th class="num">' + HM.esc(t('cGop')) + '</th><th class="num band">' + HM.esc(t('cLabelHuong')) + '</th></tr></thead><tbody>' +
      ds.map(function (a) {
        return '<tr><td><div class="t-ttl">' + HM.esc(a.name) + '</div><div class="t-sub">' + HM.esc(a.clientId) + '</div></td>' +
          '<td class="num">' + (a.tracks ? HM.esc(HT.fmt.n(a.tracks)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (a.streams ? HM.esc(HT.fmt.n(a.streams)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (a.gross ? HM.esc(HT.fmt.usd0(a.gross)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num band">' + (a.labelCut ? HM.esc(HT.fmt.usd(a.labelCut)) : '<span class="nil">—</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<p class="say">' + HM.esc(t('nganKhongNs')) + '</p>'),
    { tieuDe: ch.name, phu: ch.clientId + ' · ' + t('labelCon') + ' · ' + c.ky.label, khiMo: function (dr) { HB.gan(dr); } });
}

})();
