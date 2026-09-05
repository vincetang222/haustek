/* =====================================================================
   NỘI BỘ · THEO DÕI
   ---------------------------------------------------------------------
   Bảng theo dõi kiểu A&R: bài hát, tài khoản, bản phát hành nào đang lên
   trong cửa sổ 7 / 28 / 60 ngày, từ lượt nghe theo ngày nền tảng gửi về.
   Bốn bộ lọc nhanh: tất cả, yêu thích (đánh dấu sao, lưu trong trình
   duyệt), top hits (đứng đầu cửa sổ), đang bùng nổ (tăng gấp đôi mức giữa
   của danh mục so với cửa sổ trước, tối thiểu 5%; ngưỡng hiện ngay trên ô
   số). Mỗi bài có số playlist và bảng xếp hạng đang có
   mặt, và số video ngắn dùng bài đó (ước tính).
   Yêu thích chỉ nằm trong trình duyệt này: nút Lưu / Khôi phục để mang
   sang máy khác, đúng như cảnh báo ở đầu trang.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'bai', loc: 'all', ngay: 28, tim: '', sap: 'streams', dir: -1, co: 25 };
var KHOA = 'haustek.theo-doi.yeuthich';
var YT = null;
function yeuThich() {
  if (YT) return YT;
  try { YT = JSON.parse(localStorage.getItem(KHOA) || '{}') || {}; } catch (e) { YT = {}; }
  ['bai', 'tk', 'ph'].forEach(function (k) { if (!YT[k]) YT[k] = {}; });
  return YT;
}
function luuYt() { try { localStorage.setItem(KHOA, JSON.stringify(YT)); } catch (e) {} }
function sao(loai, id) { var y = yeuThich(); return !!y[loai][id]; }
function soSao() { var y = yeuThich(); return Object.keys(y.bai).length + Object.keys(y.tk).length + Object.keys(y.ph).length; }
function shortForm(id, streams) { return Math.round(streams * (0.003 + (HM.hashChu('sf' + id) % 100) / 100 * 0.012)); }

HT.dangKy({
  id: 'theo-doi', nav: 'navTheoDoi', nhom: 'nhomVanHanh', icon: 'up',
  vai: ['ops', 'sales', 'support', 'mgmt', 'accounting'],

  chu: {
    vi: {
      navTheoDoi: 'Theo dõi', h1: 'Theo dõi',
      mo: 'Bài hát, tài khoản và bản phát hành đang lên trong cửa sổ ngày, từ lượt nghe nền tảng gửi về mỗi ngày. Đánh dấu sao để theo dõi riêng.',
      canhBao: 'Danh sách yêu thích chỉ lưu trong trình duyệt này. Bạn lưu ra tệp định kỳ để không mất khi đổi máy.',
      luu: 'Lưu', khoiPhuc: 'Khôi phục', dong: 'Đóng',
      hoiLuu: 'Lưu danh sách yêu thích', hoiLuuMo: 'Sao chép nội dung dưới đây và cất vào tệp của bạn. Dán lại ở nút Khôi phục trên máy khác.',
      hoiKhoiPhuc: 'Khôi phục danh sách yêu thích', hoiKhoiPhucMo: 'Dán nội dung đã lưu trước đó. Danh sách hiện tại được thay thế.', daKhoiPhuc: 'Đã khôi phục {n} mục yêu thích', loiKhoiPhuc: 'Nội dung không đúng định dạng',
      tabBai: 'Bài hát', tabTk: 'Tài khoản', tabPh: 'Bản phát hành',
      locAll: 'Tất cả', locYt: 'Yêu thích', locTop: 'Top hits', locBung: 'Đang bùng nổ',
      tim: 'Tìm ISRC, bài hát, tài khoản…', n7: '7 ngày', n28: '28 ngày', n60: '60 ngày',
      kTong: 'Lượt nghe toàn danh mục', kyTruoc: 'cửa sổ trước', kBung: 'Đang bùng nổ', kBungS: 'tăng từ {p} trở lên, gấp đôi mức giữa của danh mục', kBungKhong: 'cửa sổ này không có cửa sổ trước để so', kYt: 'Đang theo dõi', kYtS: 'mục đánh dấu sao', kPl: 'Vị trí playlist đang có', kPlS: 'toàn danh mục', kLay: 'Lấy mẫu', kLayS: 'danh mục lớn, số đã nhân theo tỷ lệ mẫu',
      bulkSao: 'Đánh dấu sao', bulkBoSao: 'Bỏ sao', daThemN: 'Đã đánh dấu {n} mục', daBoN: 'Đã bỏ sao {n} mục', cBai: 'Bài hát', cPh: 'Bản phát hành', cTk: 'Tài khoản', cPhatHanh: 'Phát hành gần nhất', cLuot: 'Lượt nghe', cDoi: 'Thay đổi', cPl: 'Playlist & bảng xếp hạng', cSf: 'Video ngắn', cDtQ: 'Doanh thu gộp quý', cLuotQ: 'Lượt nghe quý', cNv: 'Người phụ trách', cHang: 'Hạng',
      khong: 'Không có mục nào', khongMo: 'Đổi bộ lọc hoặc cửa sổ ngày.', khongYt: 'Chưa có mục yêu thích nào', khongYtMo: 'Bấm ngôi sao ở cuối dòng để theo dõi.',
      daThem: 'Đã thêm vào yêu thích', daBo: 'Đã bỏ khỏi yêu thích', track: 'track'
    },
    en: {
      navTheoDoi: 'Monitoring', h1: 'Monitoring',
      mo: 'Tracks, accounts and releases on the rise within a day window, from the daily streams platforms send. Star items to follow them.',
      canhBao: 'Favorites are only saved in this browser. Save them to a file regularly so they survive a change of machine.',
      luu: 'Save', khoiPhuc: 'Restore', dong: 'Close',
      hoiLuu: 'Save favorites', hoiLuuMo: 'Copy the text below into a file of yours. Paste it under Restore on another machine.',
      hoiKhoiPhuc: 'Restore favorites', hoiKhoiPhucMo: 'Paste what you saved earlier. The current list is replaced.', daKhoiPhuc: '{n} favorites restored', loiKhoiPhuc: 'That text is not in the expected format',
      tabBai: 'Tracks', tabTk: 'Accounts', tabPh: 'Releases',
      locAll: 'All', locYt: 'Favorites', locTop: 'Top hits', locBung: 'Booming',
      tim: 'ISRC, track, artist or account…', n7: '7 days', n28: '28 days', n60: '60 days',
      kTong: 'Catalogue streams', kyTruoc: 'previous window', kBung: 'Booming', kBungS: 'up {p} or more, twice the catalogue median', kBungKhong: 'no earlier window to compare against', kYt: 'Following', kYtS: 'starred items', kPl: 'Current playlist placements', kPlS: 'whole catalogue', kLay: 'Sampled', kLayS: 'large catalogue, figures scaled from the sample',
      bulkSao: 'Star', bulkBoSao: 'Unstar', daThemN: 'Starred {n} items', daBoN: 'Unstarred {n} items', cBai: 'Track', cPh: 'Release', cTk: 'Account', cPhatHanh: 'Last release', cLuot: 'Streams', cDoi: 'Change', cPl: 'Playlists & charts', cSf: 'Short-form', cDtQ: 'Quarter gross', cLuotQ: 'Quarter streams', cNv: 'Account manager', cHang: 'Class',
      khong: 'Nothing here', khongMo: 'Change the filter or the window.', khongYt: 'No favorites yet', khongYtMo: 'Use the star at the end of a row to follow it.',
      daThem: 'Added to favorites', daBo: 'Removed from favorites', track: 'tracks'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
    var d = HM.nho(A, 'theo-doi:' + LOC.ngay, function () { return A.dailyTrends(LOC.ngay, 300); });
    var pl = HM.nho(A, 'theo-doi:pl', function () { return A.playlists(); });
    var y = yeuThich();
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: '<button type="button" class="btn" data-luu>' + HM.icon('down2') + HM.esc(t('luu')) + '</button>' +
           '<button type="button" class="btn" data-khoi-phuc>' + HM.icon('up') + HM.esc(t('khoiPhuc')) + '</button>' });
    html += HM.ghi({ kieu: 'info', tieuDe: HM.esc(t('canhBao')), dong: 'theo-doi-yeu-thich' });
    var nguong = nguongBung(d);
    var bung = nguong == null ? null : d.topTracks.filter(function (x) { return x.change != null && x.change >= nguong; }).length;
    html += HM.so([
      { l: t('kTong') + ' · ' + d.days + (vi ? ' ngày' : ' days'), v: HT.fmt.n(d.total), lon: true, tia: d.series.map(function (s) { return s.streams; }), d: HM.lech(d.total, d.prevTotal, t('kyTruoc')) },
      { l: t('kBung'), v: bung == null ? '—' : HT.fmt.n(bung), s: bung == null ? t('kBungKhong') : t('kBungS').replace('{p}', HT.fmt.pct(nguong)), mau: bung ? HB.mau('ok') : '' },
      { l: t('kYt'), v: HT.fmt.n(soSao()), s: t('kYtS') },
      { l: t('kPl'), v: HT.fmt.n(pl.counts.active), s: t('kPlS') },
      d.sampled ? { l: t('kLay'), v: HT.fmt.n(d.tracksCounted) + ' ' + t('track'), s: t('kLayS') } : null
    ].filter(Boolean));

    html += HM.tabs([{ k: 'bai', l: t('tabBai') }, { k: 'tk', l: t('tabTk') }, { k: 'ph', l: t('tabPh') }], LOC.tab);
    html += '<div class="bar">' +
      [['all', t('locAll')], ['yt', t('locYt')], ['top', t('locTop')], ['bung', t('locBung')]].map(function (x) {
        return '<button type="button" class="pill' + (LOC.loc === x[0] ? ' on' : '') + '" data-loc="' + x[0] + '">' + HM.esc(x[1]) + '</button>';
      }).join('') +
      '<div class="srch"><input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      '<div class="sp"></div>' +
      [7, 28, 60].map(function (n) { return '<button type="button" class="pill' + (LOC.ngay === n ? ' on' : '') + '" data-ngay="' + n + '">' + HM.esc(t('n' + n)) + '</button>'; }).join('') +
      '</div>';
    html += HM.the({ thoBody: true, than: '<div data-bang></div>' });
    root.innerHTML = html;
    dungBang(root, c, d, pl);
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-loc]', function (el) { LOC.loc = el.getAttribute('data-loc'); c.veLai(); });
    HM.bam(root, '[data-ngay]', function (el) { LOC.ngay = +el.getAttribute('data-ngay'); c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; dungBang(root, c, d, pl); });
    HM.bam(root, '[data-luu]', function () {
      c.hoiThoai({ tieuDe: t('hoiLuu'), moTa: HM.esc(t('hoiLuuMo')), than: '<textarea class="in mono" rows="6" readonly data-o="json" style="width:100%">' + HM.esc(JSON.stringify(yeuThich())) + '</textarea>', dong: t('dong'), huy: t('dong') });
    });
    HM.bam(root, '[data-khoi-phuc]', function () {
      c.hoiThoai({ tieuDe: t('hoiKhoiPhuc'), moTa: HM.esc(t('hoiKhoiPhucMo')), than: '<textarea class="in mono" rows="6" data-o="json" style="width:100%"></textarea>', dong: t('khoiPhuc') }).then(function (f) {
        if (!f) return;
        try { var o = JSON.parse(f.json); if (!o || typeof o !== 'object') throw 0; YT = { bai: o.bai || {}, tk: o.tk || {}, ph: o.ph || {} }; luuYt(); c.thongBao(t('daKhoiPhuc').replace('{n}', soSao()), 'ok'); c.veLai(); }
        catch (e) { c.thongBao(t('loiKhoiPhuc'), 'no'); }
      });
    });
  }
});

/* Ngưỡng "bùng nổ" theo cửa sổ: gấp đôi mức giữa (median) của thay đổi
   toàn danh mục, tối thiểu 5%. Cửa sổ 7 ngày dao động ít nên ngưỡng thấp
   hơn cửa sổ 28 ngày; số cố định 25% sẽ không bắt được gì ở 7 ngày. */
function nguongBung(d) {
  var ch = d.topTracks.map(function (x) { return x.change; }).filter(function (x) { return x != null; }).sort(function (a, b) { return a - b; });
  if (!ch.length) return null;   /* cửa sổ 60 ngày: không còn cửa sổ trước để so */
  var med = ch[Math.floor(ch.length / 2)];
  return Math.max(0.05, Math.round(med * 2 * 1000) / 1000);
}

function dungBang(root, c, d, pl) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', y = yeuThich();
  var host = root.querySelector('[data-bang]'); if (!host) return;
  var q = LOC.tim.trim().toLowerCase(), nguong = nguongBung(d);
  /* Số playlist đang có mặt của từng bài: hỏi thẳng lõi theo id, vì bảng
     playlist toàn danh mục chỉ trả về 600 dòng đầu. */
  var plCua = HM.nho(A, 'theo-doi:plCua:' + LOC.ngay, function () {
    var m = {};
    d.topTracks.forEach(function (x) { m[x.id] = A.playlistsOf(x.id).filter(function (p) { return p.status === 'active'; }).length; });
    return m;
  });
  var rows, cot, veDong, loaiYt = LOC.tab;
  if (LOC.tab === 'bai') {
    rows = d.topTracks.map(function (x, i) { return { id: x.id, title: x.title, artist: x.artist, isrc: x.isrc, type: x.type, streams: x.streams, prev: x.prev, change: x.change, pl: plCua[x.id] || 0, sf: shortForm(x.id, x.streams), hang: i + 1, rel: A.releaseDateOf(x.id) }; });
    var maxS = rows.reduce(function (m, r) { return r.streams > m ? r.streams : m; }, 0);
    cot = [{ k: 'title', l: t('cBai') }, { k: 'rel', l: t('cPhatHanh'), w: '120px' }, { k: 'streams', l: t('cLuot'), num: true, w: '120px' }, { k: 'change', l: t('cDoi'), num: true, w: '100px' },
           { k: 'pl', l: t('cPl'), num: true, w: '130px' }, { k: 'sf', l: t('cSf'), num: true, w: '100px' }, { k: 'yt', l: '★', s: false, w: '44px' }];
    veDong = function (r) {
      return '<td>' + HM.tenBia({ bia: r.id, ten: HM.dai(r.title, 34), phu: r.artist + ' · ' + r.isrc }) + '</td>' +
        '<td class="mono">' + HM.esc(HT.fmt.date(r.rel)) + '</td>' +
        '<td class="num band">' + HM.oThanh(r.streams, maxS) + '</td>' +
        '<td class="num">' + (r.change == null ? '<span class="nil">—</span>' : '<span class="' + (r.change >= 0 ? 'pos' : 'neg') + '">' + HM.esc((r.change >= 0 ? '▲ ' : '▼ ') + HT.fmt.pct(Math.abs(r.change))) + '</span>') + '</td>' +
        '<td class="num">' + (r.pl ? '<span class="tag info">' + r.pl + '</span>' : '<span class="nil">—</span>') + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(r.sf)) + '</td>' +
        '<td>' + nutSao('bai', r.id) + '</td>';
    };
  } else if (LOC.tab === 'ph') {
    rows = d.topReleases.map(function (x) { return { id: x.id, trackId: x.trackId, title: x.title, artist: x.artist, type: x.type, tracks: x.tracks, releasePeriod: x.releasePeriod, streams: x.streams, prev: x.prev, change: x.change }; });
    cot = [{ k: 'title', l: t('cPh') }, { k: 'releasePeriod', l: t('cPhatHanh'), w: '120px' }, { k: 'streams', l: t('cLuot'), num: true, w: '120px' }, { k: 'change', l: t('cDoi'), num: true, w: '100px' }, { k: 'yt', l: '★', s: false, w: '44px' }];
    veDong = function (r) {
      return '<td>' + HM.tenBia({ bia: r.trackId, ten: HM.dai(r.title, 34), phu: r.artist + ' · ' + r.type + ' · ' + r.tracks + ' ' + t('track') }) + '</td>' +
        '<td class="mono">' + HM.esc(r.releasePeriod) + '</td>' +
        '<td class="num band"><b>' + HM.esc(HT.fmt.n(r.streams)) + '</b></td>' +
        '<td class="num">' + (r.change == null ? '<span class="nil">—</span>' : '<span class="' + (r.change >= 0 ? 'pos' : 'neg') + '">' + HM.esc((r.change >= 0 ? '▲ ' : '▼ ') + HT.fmt.pct(Math.abs(r.change))) + '</span>') + '</td>' +
        '<td>' + nutSao('ph', r.id) + '</td>';
    };
  } else {
    var ds = HM.nho(A, 'theo-doi:tk', function () { return A.parties.list({}).rows; });
    rows = ds.map(function (x) { return { id: x.partyKey, title: x.name, clientId: x.clientId, kind: x.kind, managerName: x.managerName || '', classification: x.classification, streams: x.streamsQ, revenueQ: x.revenueQ, revenuePrevQ: x.revenuePrevQ, change: x.revenuePrevQ > 0 ? (x.revenueQ - x.revenuePrevQ) / x.revenuePrevQ : null, tracks: x.tracks }; });
    cot = [{ k: 'title', l: t('cTk') }, { k: 'managerName', l: t('cNv'), w: '140px' }, { k: 'classification', l: t('cHang'), w: '60px' }, { k: 'streams', l: t('cLuotQ'), num: true, w: '130px' }, { k: 'revenueQ', l: t('cDtQ'), num: true, w: '140px' }, { k: 'change', l: t('cDoi'), num: true, w: '100px' }, { k: 'yt', l: '★', s: false, w: '44px' }];
    veDong = function (r) {
      return '<td>' + HM.tenBia({ ten: HM.dai(r.title, 34), seed: r.clientId, phu: r.clientId + ' · ' + r.kind + ' · ' + HT.fmt.n(r.tracks) + ' ' + t('track') }) + '</td>' +
        '<td>' + (r.managerName ? HM.esc(r.managerName) : '<span class="nil">—</span>') + '</td>' +
        '<td>' + HM.tag(r.classification, r.classification === 'A' ? 'ok' : r.classification === 'B' ? 'info' : '') + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(r.streams)) + '</td>' +
        '<td class="num band"><b>' + HM.esc(c.tien(r.revenueQ)) + '</b></td>' +
        '<td class="num">' + (r.change == null ? '<span class="nil">—</span>' : '<span class="' + (r.change >= 0 ? 'pos' : 'neg') + '">' + HM.esc((r.change >= 0 ? '▲ ' : '▼ ') + HT.fmt.pct(Math.abs(r.change))) + '</span>') + '</td>' +
        '<td>' + nutSao('tk', r.id) + '</td>';
    };
  }
  function nutSao(loai, id) { return '<button type="button" class="btn sm ghost" data-yt="' + HM.esc(loai + '|' + id) + '" title="★" style="font-size:16px;line-height:1;padding:2px 8px;color:' + (sao(loai, id) ? 'var(--warn)' : 'var(--faint)') + '">' + (sao(loai, id) ? '★' : '☆') + '</button>'; }
  var loc = rows.filter(function (r) {
    if (LOC.loc === 'yt' && !y[loaiYt][r.id]) return false;
    if (LOC.loc === 'bung' && !(nguong != null && r.change != null && r.change >= nguong)) return false;
    if (q && ((r.title || '') + ' ' + (r.artist || '') + ' ' + (r.isrc || '') + ' ' + (r.clientId || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  if (LOC.loc === 'top') loc = loc.slice().sort(function (a, b) { return b.streams - a.streams; }).slice(0, 20);
  var b = c.bang({
    host: host, dong: function () { return loc; }, sort: LOC.sap, dir: LOC.dir, co: LOC.co, cot: cot,
    veDong: veDong,
    rongTieuDe: LOC.loc === 'yt' ? t('khongYt') : t('khong'), rongMoTa: LOC.loc === 'yt' ? t('khongYtMo') : t('khongMo'),
    khiDoi: function (st) { LOC.sap = st.sort; LOC.dir = st.dir; LOC.co = st.co; },
    khoa: function (r) { return String(r.id); },
    chonNhieu: { nut: [{ k: 'sao', l: t('bulkSao'), pri: true }, { k: 'boSao', l: t('bulkBoSao') }],
      khi: function (k, rows, api) {
        var y2 = yeuThich();
        rows.forEach(function (r) { if (k === 'sao') y2[loaiYt][r.id] = 1; else delete y2[loaiYt][r.id]; });
        luuYt(); c.thongBao((k === 'sao' ? t('daThemN') : t('daBoN')).replace('{n}', rows.length), 'ok');
        api.xoaChon(); if (LOC.loc === 'yt') dungBang(root, c, d, pl); else c.veLai();
      } }
  });
  b.ve();
  HM.bam(host, '[data-yt]', function (el, e) {
    e.stopPropagation();
    var p = el.getAttribute('data-yt').split('|'), loai = p[0], id = p.slice(1).join('|');
    var y2 = yeuThich();
    if (y2[loai][id]) delete y2[loai][id]; else y2[loai][id] = 1;
    luuYt(); c.thongBao(y2[loai][id] ? t('daThem') : t('daBo'), 'ok');
    if (LOC.loc === 'yt') dungBang(root, c, d, pl); else b.ve();
  });
  HM.bam(host, 'tbody tr', function (el, e) {
    if (e.target.closest('button, td.sel, input, .bulk')) return;
    var r = b.rows[+el.getAttribute('data-r')]; if (!r) return;
    if (LOC.tab === 'tk') { c.di('doi-tac'); return; }
    var id = LOC.tab === 'bai' ? r.id : r.trackId;
    var a; try { a = A.asset(id); } catch (err) { return; }
    HTS.moNgan(c, a, { noiBo: true, tien: c.tien2, tien0: c.tien, playlists: A.playlistsOf(id), tabDau: LOC.tab === 'bai' ? 'pl' : 'qt' });
  });
}

})();
