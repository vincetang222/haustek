/* =====================================================================
   CỔNG ĐỐI TÁC · PLAYLIST & BẢNG XẾP HẠNG
   ---------------------------------------------------------------------
   Bài hát của đối tác đang nằm ở playlist biên tập, playlist thuật toán
   hay bảng xếp hạng nào, vị trí bao nhiêu, vào từ ngày nào, còn ở đó
   không. Trên cùng là các playlist mang về nhiều lượt nghe nhất; dưới là
   từng vị trí, lọc theo nền tảng, loại và trạng thái. Bấm một dòng để mở
   hồ sơ bài hát ngay ở tab Playlist.
   ===================================================================== */
"use strict";
(function () {

var LOC = { nt: '', loai: '', tt: 'active', tim: '', trang: 0, co: 25 };
var PL = { key: null, d: null };
var KIEU = { editorial: 'info', algorithmic: 'link', chart: 'warn' };

function lay(c) {
  var me = c.phien.me, key = me.role + ':' + me.partyId;
  if (PL.key !== key) { PL.d = c.api.playlists(me.role, me.partyId); PL.key = key; }
  return PL.d;
}

HT.dangKy({
  id: 'k-playlist', nav: 'navPlaylist', nhom: 'nhomBai', icon: 'list',
  dem: function (c) { try { var n = lay(c).counts.newMonth; return n ? String(n) : ''; } catch (e) { return ''; } },

  chu: {
    vi: {
      navPlaylist: 'Playlist & bảng xếp hạng', h1: 'Playlist & bảng xếp hạng',
      mo: 'Bài hát của bạn đang có mặt ở playlist và bảng xếp hạng nào trên từng nền tảng, vị trí bao nhiêu và từ ngày nào. Nền tảng cập nhật mỗi ngày.',
      kDangCo: 'Vị trí đang có', kDangCoS: 'trên {n} playlist và bảng xếp hạng', kMoi: 'Mới trong 30 ngày', kBxh: 'Vị trí trên bảng xếp hạng', kReach: 'Người theo dõi tiếp cận', kReachS: 'tổng người theo dõi các playlist đang có mặt', kRoi: 'Đã rời',
      top: 'Playlist mang về nhiều lượt nghe nhất', topMo: 'Ước tính lượt nghe 7 ngày từ từng playlist, theo vị trí và số người theo dõi.',
      theoLoai: 'Theo loại', bienTap: 'Playlist biên tập', thuatToan: 'Playlist thuật toán', bxh: 'Bảng xếp hạng', theoNt: 'Theo nền tảng', viTri: 'vị trí',
      danhSach: 'Từng vị trí', tim: 'Tìm bài hát, ISRC hoặc tên playlist…', moiNt: 'Mọi nền tảng', moiLoai: 'Mọi loại',
      ttActive: 'Đang có mặt', ttRemoved: 'Đã rời', ttAll: 'Tất cả',
      cBai: 'Bài hát', cPl: 'Playlist / bảng xếp hạng', cNt: 'Nền tảng', cViTri: 'Vị trí', cTheoDoi: 'Người theo dõi', cThem: 'Ngày vào', cTt: 'Trạng thái', cLuot: 'Lượt nghe 7 ngày',
      active: 'Đang có mặt', removed: 'Đã rời', roiNgay: 'rời ngày {d}',
      khong: 'Không có vị trí nào khớp bộ lọc', khongMo: 'Đổi bộ lọc phía trên.',
      trong: 'Chưa có bài hát nào trong playlist hay bảng xếp hạng', trongMo: 'Khi nền tảng đưa bài hát của bạn vào playlist hoặc bảng xếp hạng, vị trí sẽ hiện ở đây trong ngày.',
      xuat: 'Xuất CSV', baiHat: 'bài hát', hienThi: 'Đang hiển thị'
    },
    en: {
      navPlaylist: 'Playlists & charts', h1: 'Playlists & charts',
      mo: 'Which playlists and charts your tracks are on, per platform, at what position and since when. Platforms update daily.',
      kDangCo: 'Current placements', kDangCoS: 'across {n} playlists and charts', kMoi: 'New in 30 days', kBxh: 'Chart positions', kReach: 'Follower reach', kReachS: 'followers of the playlists you are on', kRoi: 'Removed',
      top: 'Playlists driving the most streams', topMo: 'Estimated 7-day streams from each playlist, by position and follower count.',
      theoLoai: 'By kind', bienTap: 'Editorial playlists', thuatToan: 'Algorithmic playlists', bxh: 'Charts', theoNt: 'By platform', viTri: 'placements',
      danhSach: 'Every placement', tim: 'Search track, ISRC or playlist…', moiNt: 'Any platform', moiLoai: 'Any kind',
      ttActive: 'Listed', ttRemoved: 'Removed', ttAll: 'All',
      cBai: 'Track', cPl: 'Playlist / chart', cNt: 'Platform', cViTri: 'Position', cTheoDoi: 'Followers', cThem: 'Added', cTt: 'Status', cLuot: 'Streams, 7 days',
      active: 'Listed', removed: 'Removed', roiNgay: 'removed {d}',
      khong: 'No placement matches the filters', khongMo: 'Change the filters above.',
      trong: 'No playlist or chart placements yet', trongMo: 'When a platform adds your track to a playlist or chart, the placement appears here within the day.',
      xuat: 'Export CSV', baiHat: 'tracks', hienThi: 'Showing'
    }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, vi = c.lang === 'vi', P = HB.dayMau(), la = me.role === 'label';
    var d;
    try { d = lay(c); } catch (e) { d = null; }
    if (!d || !d.rows.length) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) }) + HM.the({ than: HM.trong({ icon: 'list', tieuDe: t('trong'), moTa: t('trongMo') }) });
      return;
    }
    var k = d.counts;
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kDangCo'), v: HT.fmt.n(k.active), lon: true, s: t('kDangCoS').replace('{n}', HT.fmt.n(k.playlists)) },
      { l: t('kMoi'), v: HT.fmt.n(k.newMonth), mau: k.newMonth ? HB.mau('ok') : '' },
      { l: t('kBxh'), v: HT.fmt.n(k.charts) },
      { l: t('kReach'), v: HT.fmt.n(k.reach), s: t('kReachS') },
      { l: t('kRoi'), v: HT.fmt.n(k.removed) }
    ]);

    var theoLoai = ['editorial', 'algorithmic', 'chart'].map(function (kind) {
      return d.rows.filter(function (r) { return r.kind === kind && r.status === 'active'; }).length;
    });
    /* vị trí đang có theo nền tảng, từ danh sách playlist (đủ toàn cục, không bị cắt 600 dòng) */
    var theoNt = {};
    d.playlists.forEach(function (p) { if (p.active > 0) theoNt[p.platform] = (theoNt[p.platform] || 0) + p.active; });
    var ntRows = Object.keys(theoNt).map(function (n) { return { n: n, v: theoNt[n] }; }).sort(function (a, b) { return b.v - a.v; });
    var tongNt = ntRows.reduce(function (s, x) { return s + x.v; }, 0);
    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('top')), p: HM.esc(t('topMo')),
        than: HM.xepHang(d.playlists.filter(function (p) { return p.active > 0; }).slice(0, 10).map(function (p, i) {
          return { ten: c.song(p, 'playlist'), phu: p.platform + ' · ' + c.song(p, 'kindLabel') + (p.followers ? ' · ' + HT.fmt.n(p.followers) + ' ' + t('cTheoDoi').toLowerCase() : '') + ' · ' + p.active + ' ' + t('baiHat'),
                   gt: p.streams7, hinh: true, seed: p.platform + p.playlist, mau: P[i % 8], phuV: '#' + p.bestPosition };
        }))
      }) +
      HM.the({
        h2: HM.esc(t('theoLoai')),
        than: HB.o({ loai: 'vong', cao: 190, dinhDang: 'so', chuThich: true, tenTong: t('kDangCo'),
          giua: { v: HT.fmt.n(k.active), l: t('kDangCo').toLowerCase() },
          phan: [{ ten: t('bienTap'), gt: theoLoai[0], mau: P[0] }, { ten: t('thuatToan'), gt: theoLoai[1], mau: P[6] }, { ten: t('bxh'), gt: theoLoai[2], mau: P[3] }] }) +
          (ntRows.length ? '<h4 class="sec" style="margin-top:16px">' + HM.esc(t('theoNt')) + '</h4>' +
            HM.xepHang(ntRows.map(function (x, i) { return { ten: x.n, gt: x.v, hinh: true, seed: x.n, mau: P[i % 8], phuV: tongNt ? HT.fmt.pct(x.v / tongNt) : '' }; })) : '') +
          '<p class="hint" style="margin-top:12px">' + HM.esc(c.song(d, 'note')) + '</p>'
      }) + '</div>';

    /* ---- bảng từng vị trí ---- */
    var q = LOC.tim.trim().toLowerCase();
    var nts = []; d.rows.forEach(function (r) { if (nts.indexOf(r.platform) < 0) nts.push(r.platform); });
    var rows = d.rows.filter(function (r) {
      if (LOC.nt && r.platform !== LOC.nt) return false;
      if (LOC.loai && r.kind !== LOC.loai) return false;
      if (LOC.tt && r.status !== LOC.tt) return false;
      if (q && (r.title + ' ' + r.isrc + ' ' + r.playlist + ' ' + r.playlistEn).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var het = Math.max(0, Math.ceil(rows.length / LOC.co) - 1);
    if (LOC.trang > het) LOC.trang = het;
    var dau = LOC.trang * LOC.co, trang = rows.slice(dau, dau + LOC.co);
    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      '<select class="in" data-nt style="width:auto;height:34px"><option value="">' + HM.esc(t('moiNt')) + '</option>' +
        nts.map(function (n) { return '<option value="' + HM.esc(n) + '"' + (LOC.nt === n ? ' selected' : '') + '>' + HM.esc(n) + '</option>'; }).join('') + '</select>' +
      '<select class="in" data-loai style="width:auto;height:34px"><option value="">' + HM.esc(t('moiLoai')) + '</option>' +
        [['editorial', t('bienTap')], ['algorithmic', t('thuatToan')], ['chart', t('bxh')]].map(function (x) { return '<option value="' + x[0] + '"' + (LOC.loai === x[0] ? ' selected' : '') + '>' + HM.esc(x[1]) + '</option>'; }).join('') + '</select>' +
      [['active', t('ttActive'), k.active], ['removed', t('ttRemoved'), k.removed], ['', t('ttAll'), k.total]].map(function (x) {
        return '<button type="button" class="pill' + (LOC.tt === x[0] ? ' on' : '') + '" data-tt="' + x[0] + '">' + HM.esc(x[1]) + ' <b>' + HT.fmt.n(x[2]) + '</b></button>';
      }).join('') +
      '<div class="sp"></div><button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button></div>';

    html += HM.the({
      thoBody: true,
      than: rows.length
        ? '<div class="card-h" style="padding-bottom:12px"><div class="pager">' +
            '<button type="button" class="pg" data-tr="-1"' + (LOC.trang === 0 ? ' disabled' : '') + '>' + HM.icon('left') + '</button>' +
            '<button type="button" class="pg" data-tr="1"' + (dau + LOC.co >= rows.length ? ' disabled' : '') + '>' + HM.icon('right') + '</button></div>' +
          '<div class="range">' + HT.fmt.n(dau + 1) + '–' + HT.fmt.n(Math.min(rows.length, dau + LOC.co)) + ' ' + HM.esc(c.CHU[c.lang].of) + ' ' + HT.fmt.n(rows.length) + '</div></div>' +
          '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cBai')) + '</th><th>' + HM.esc(t('cPl')) + '</th><th>' + HM.esc(t('cNt')) + '</th>' +
          '<th class="num">' + HM.esc(t('cViTri')) + '</th><th class="num">' + HM.esc(t('cTheoDoi')) + '</th><th>' + HM.esc(t('cThem')) + '</th><th>' + HM.esc(t('cTt')) + '</th><th class="num">' + HM.esc(t('cLuot')) + '</th></tr></thead><tbody>' +
          trang.map(function (r) {
            return '<tr class="pick" data-bg="' + r.trackId + '"' + (r.status === 'removed' ? ' style="opacity:.65"' : '') + '>' +
              '<td>' + HM.tenBia({ bia: r.trackId, ten: HM.dai(r.title, 30), phu: (la ? r.artist + ' · ' : '') + r.isrc }) + '</td>' +
              '<td><div class="t-ttl">' + HM.esc(c.song(r, 'playlist')) + '</div><div class="t-sub" style="font-family:var(--f)">' + HM.tag(c.song(r, 'kindLabel'), KIEU[r.kind]) + '</div></td>' +
              '<td>' + HM.esc(r.platform) + '</td>' +
              '<td class="num"><b>#' + r.position + '</b></td>' +
              '<td class="num">' + (r.followers ? HM.esc(HT.fmt.n(r.followers)) : '<span class="nil">—</span>') + '</td>' +
              '<td class="mono">' + HM.esc(HT.fmt.date(r.addedAt)) + '</td>' +
              '<td>' + HM.tag(t(r.status), r.status === 'active' ? 'ok' : '') + (r.removedAt ? '<div class="t-sub" style="font-family:var(--f)">' + HM.esc(t('roiNgay').replace('{d}', HT.fmt.date(r.removedAt))) + '</div>' : '') + '</td>' +
              '<td class="num">' + (r.streams7 ? HM.esc(HT.fmt.n(r.streams7)) : '<span class="nil">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="card-f"><span class="sp" style="flex:1"></span>' + HM.esc(c.CHU[c.lang].showing) +
          ' <select class="inline-sel" data-co>' + [12, 25, 50, 100].map(function (n) { return '<option value="' + n + '"' + (n === LOC.co ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select> ' + HM.esc(c.CHU[c.lang].rows) + '</div>'
        : HM.trong({ icon: 'list', tieuDe: t('khong'), moTa: t('khongMo') })
    });

    root.innerHTML = html;
    HB.gan(root);
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; LOC.trang = 0; c.veLai(); });
    HM.doi(root, '[data-nt]', function (el) { LOC.nt = el.value; LOC.trang = 0; c.veLai(); });
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; LOC.trang = 0; c.veLai(); });
    HM.doi(root, '[data-co]', function (el) { LOC.co = +el.value; LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tt]', function (el) { LOC.tt = el.getAttribute('data-tt'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tr]', function (el) { LOC.trang += +el.getAttribute('data-tr'); c.veLai(); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('playlist-' + me.clientId + '.csv',
        ['ISRC', t('cBai'), vi ? 'Nghệ sĩ' : 'Artist', t('cPl'), vi ? 'Loại' : 'Kind', t('cNt'), t('cViTri'), t('cTheoDoi'), t('cThem'), t('cTt'), t('cLuot')],
        rows.map(function (r) { return [r.isrc, r.title, r.artist, c.song(r, 'playlist'), c.song(r, 'kindLabel'), r.platform, r.position, r.followers, r.addedAt, t(r.status), r.streams7]; }));
    });
    HM.bam(root, '[data-bg]', function (el) {
      var id = +el.getAttribute('data-bg'), hs;
      try { hs = api.trackAsset(me.role, me.partyId, id); } catch (e) { c.thongBao(e.message, 'no'); return; }
      HTS.moNgan(c, hs, { mineLabel: la ? HTS.t('label') : HTS.t('toi'), revenueLabel: la ? HTS.t('gop') : HTS.t('toi'), anMine: !la,
        tien: HT.fmt.usd, tien0: HT.fmt.usd0, playlists: d.rows.filter(function (r) { return r.trackId === id; }), hoTro: true, tabDau: 'pl' });
      var dr = document.querySelector('.drawer');
      if (dr && HT.moTicket) {
        HM.bam(dr, '[data-yc-mkt]', function (b) { HT.moTicket(c, { type: 'marketing', trackId: +b.getAttribute('data-yc-mkt') }); });
        HM.bam(dr, '[data-yc-ht]', function (b) { HT.moTicket(c, { type: 'nen-tang', trackId: +b.getAttribute('data-yc-ht') }); });
      }
    });
  }
});

})();
