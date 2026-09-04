/* =====================================================================
   HAUSTEK PORTAL v2 — HỒ SƠ MỘT BÀI HÁT (dùng chung hai cổng)
   ---------------------------------------------------------------------
   Một bài hát trong danh mục có ba câu hỏi ngoài "được bao nhiêu tiền":
     1. Đã đi tới bước nào của quy trình phát hành, còn thiếu gì?
     2. Đã có mặt ở nền tảng nào, đường dẫn ở đâu, nền tảng nào còn kẹt?
     3. Từng nền tảng mang về bao nhiêu lượt nghe, bao nhiêu tiền mỗi tháng?

   Cổng nội bộ và cổng đối tác cùng trả lời ba câu này bằng cùng một bộ
   khuôn ở đây; chỉ khác dữ liệu đưa vào (nội bộ thấy mọi kỳ, đối tác chỉ
   thấy kỳ đã xét duyệt) và cột tiền cuối (phần label / phần nghệ sĩ).
   ===================================================================== */
"use strict";
(function (global) {

var esc = HT.esc, icon = HT.icon;

var CHU = {
  vi: {
    tabQt: 'Quy trình', tabNt: 'Nền tảng', tabThang: 'Theo tháng',
    stLive: 'Đã lên', stProcessing: 'Đang xử lý', stPending: 'Chưa xác nhận', stRejected: 'Bị từ chối', stTakedown: 'Đã gỡ',
    bDone: 'Đã xong', bDoing: 'Đang thực hiện', bTodo: 'Chưa tới', bIssue: 'Có vấn đề', bSkip: 'Không đăng ký',
    tabKn: 'Khiếu nại', ycMkt: 'Yêu cầu hỗ trợ marketing', ycHt: 'Gửi yêu cầu hỗ trợ về bài hát này',
    knTrong: 'Không có khiếu nại hay xung đột quyền nào trên bài hát này.', knMo: 'Haustek theo dõi Content ID và khiếu nại trên các nền tảng; mỗi dòng dưới đây là một việc Haustek đang xử lý thay bạn.',
    cNenTang: 'Nền tảng', cLoaiKn: 'Loại', cBenKia: 'Bên liên quan', cLuotNgay: 'Lượt xem / ngày', cTrangThaiKn: 'Trạng thái', cCapNhat: 'Cập nhật',
    knOpen: 'Mới ghi nhận', knDisputed: 'Đang tranh chấp', knEscalated: 'Đã chuyển lên nền tảng', knResolved: 'Đã giải quyết', knReleased: 'Đã nhả claim',
    doanhThu: 'Doanh thu',
    gdLive: 'Đã lên đủ nền tảng', gdProcessing: 'Đang xử lý', gdIssue: 'Có vấn đề',
    mChan: 'Chặn', mCanh: 'Cần bổ sung', mGoiY: 'Gợi ý',
    conThieu: 'Còn thiếu và cần xử lý', duCa: 'Hồ sơ đầy đủ, không còn mục nào cần bổ sung.',
    goiY: 'Gợi ý để bài hát hoạt động tốt hơn',
    nenTangLon: 'Nền tảng lớn', nenTangKhac: 'Nền tảng khác', daLen: 'đã lên', chuaXn: 'chưa xác nhận',
    mo: 'Mở', khongLink: 'Không có trang công khai', lenNgay: 'lên ngày',
    luot: 'Lượt nghe', gop: 'Doanh thu', toi: 'Thu nhập của bạn', label: 'Phần label được hưởng',
    kyGan: 'Số liệu cạnh mỗi nền tảng là của kỳ {k}.',
    kyChua: 'Chưa có kỳ nào đã xét duyệt cho bài hát này, nên chưa có số liệu theo nền tảng.',
    tong: 'Tổng', tongKy: 'Tổng kỳ', xuat: 'Xuất CSV',
    thangMo: 'Mỗi cột là một kỳ báo cáo đã xét duyệt. Cột cộng dọc bằng đúng tổng của bài hát trong kỳ đó.',
    thangMoNb: 'Mỗi cột là một kỳ báo cáo. Kỳ chưa xét duyệt vẫn hiện số nhưng chỉ là số đã nhập tới thời điểm này.',
    khongThang: 'Chưa có kỳ nào để hiển thị.',
    tichLuy: 'Tích luỹ các kỳ đã xét duyệt', phatHanh: 'Phát hành', nenTang: 'Nền tảng', thieu: 'Còn thiếu',
    sangTac: 'Sáng tác', producer: 'Điểm producer', maBai: 'Mã bài hát',
    chuaDuyet: 'chưa xét duyệt'
  },
  en: {
    tabQt: 'Pipeline', tabNt: 'Platforms', tabThang: 'By month',
    stLive: 'Live', stProcessing: 'Processing', stPending: 'Unconfirmed', stRejected: 'Rejected', stTakedown: 'Taken down',
    bDone: 'Done', bDoing: 'In progress', bTodo: 'Not yet', bIssue: 'Issue', bSkip: 'Not requested',
    tabKn: 'Claims', ycMkt: 'Request marketing support', ycHt: 'Open a support request about this track',
    knTrong: 'No claim or rights conflict on this track.', knMo: 'Haustek watches Content ID and claims on the platforms; each row is something Haustek is handling for you.',
    cNenTang: 'Platform', cLoaiKn: 'Type', cBenKia: 'Other party', cLuotNgay: 'Views / day', cTrangThaiKn: 'Status', cCapNhat: 'Updated',
    knOpen: 'Logged', knDisputed: 'Disputed', knEscalated: 'Escalated to the platform', knResolved: 'Resolved', knReleased: 'Claim released',
    doanhThu: 'Revenue',
    gdLive: 'Live everywhere', gdProcessing: 'Processing', gdIssue: 'Needs attention',
    mChan: 'Blocking', mCanh: 'Action needed', mGoiY: 'Suggestion',
    conThieu: 'Missing and to do', duCa: 'Nothing missing on this record.',
    goiY: 'Suggestions to help the track perform',
    nenTangLon: 'Major platforms', nenTangKhac: 'Other platforms', daLen: 'live', chuaXn: 'unconfirmed',
    mo: 'Open', khongLink: 'No public page', lenNgay: 'live on',
    luot: 'Streams', gop: 'Revenue', toi: 'Yours', label: 'Label keeps',
    kyGan: 'Figures next to each platform are for {k}.',
    kyChua: 'No approved period yet for this track, so no per-platform figures.',
    tong: 'Total', tongKy: 'Period total', xuat: 'Export CSV',
    thangMo: 'Each column is an approved reporting period. Columns add up to the track’s total for that period.',
    thangMoNb: 'Each column is a reporting period. Unapproved periods show what has been loaded so far.',
    khongThang: 'No period to show yet.',
    tichLuy: 'Across approved periods', phatHanh: 'Released', nenTang: 'Platforms', thieu: 'Missing',
    sangTac: 'Writers', producer: 'Producer points', maBai: 'Track codes',
    chuaDuyet: 'not approved'
  }
};
function t(k) { var l = HT.lang === 'en' ? 'en' : 'vi'; return (CHU[l] && CHU[l][k] != null) ? CHU[l][k] : k; }
function song(o, khoa) {
  if (!o) return '';
  if (HT.lang === 'en' && o[khoa + 'En'] != null && o[khoa + 'En'] !== '') return o[khoa + 'En'];
  return o[khoa] == null ? '' : o[khoa];
}

var KIEU_NT = { live: 'ok', processing: 'info', pending: 'warn', rejected: 'no', takedown: 'no' };
var CHU_NT = { live: 'stLive', processing: 'stProcessing', pending: 'stPending', rejected: 'stRejected', takedown: 'stTakedown' };
var KIEU_GD = { live: 'ok', processing: 'info', issue: 'no' };
var CHU_GD = { live: 'gdLive', processing: 'gdProcessing', issue: 'gdIssue' };
var KIEU_MUC = { chan: 'no', canh: 'warn', goiY: 'info' };
var CHU_MUC = { chan: 'mChan', canh: 'mCanh', goiY: 'mGoiY' };

function tagNenTang(st) { return '<span class="tag ' + (KIEU_NT[st] || '') + '">' + esc(t(CHU_NT[st] || st)) + '</span>'; }
function tagGiaiDoan(gd) { return '<span class="tag ' + (KIEU_GD[gd] || '') + '">' + esc(t(CHU_GD[gd] || gd)) + '</span>'; }
function tagMuc(m) { return '<span class="tag ' + (KIEU_MUC[m] || '') + '">' + esc(t(CHU_MUC[m] || m)) + '</span>'; }
/* dải chấm: 12 nền tảng lớn, mỗi chấm một trạng thái — đọc được từ xa */
function chamNenTang(live, total, stage) {
  var out = '<span class="pdots" title="' + esc(live + '/' + total) + '">';
  for (var i = 0; i < total; i++) out += '<i class="' + (i < live ? 'ok' : (stage === 'issue' ? 'no' : 'off')) + '"></i>';
  return out + '</span>';
}

/* ---- quy trình: danh sách dọc, mỗi bước một dấu ---- */
function quyTrinh(steps) {
  var CH = { done: 'check', doing: 'clock', todo: '', issue: 'alert', skip: 'x' };
  return '<ol class="qt">' + steps.map(function (s) {
    return '<li class="' + esc(s.status) + '"><span class="mk">' + (CH[s.status] ? icon(CH[s.status]) : '') + '</span>' +
      '<div class="bd"><div class="l"><b>' + esc(song(s, 'label')) + '</b>' +
      '<span class="tag ' + (s.status === 'done' ? 'ok' : s.status === 'doing' ? 'info' : s.status === 'issue' ? 'no' : '') + '">' +
      esc(t({ done: 'bDone', doing: 'bDoing', todo: 'bTodo', issue: 'bIssue', skip: 'bSkip' }[s.status] || s.status)) + '</span>' +
      (s.at ? '<span class="d mono">' + esc(HT.fmt.date(s.at)) + '</span>' : '') + '</div>' +
      (song(s, 'note') ? '<div class="n">' + esc(song(s, 'note')) + '</div>' : '') + '</div></li>';
  }).join('') + '</ol>';
}

/* ---- còn thiếu: việc phải làm trước, gợi ý sau ---- */
function conThieu(missing) {
  var viec = missing.filter(function (m) { return m.muc !== 'goiY'; });
  var goiY = missing.filter(function (m) { return m.muc === 'goiY'; });
  var mot = function (m) {
    return '<li class="' + esc(m.muc) + '">' + tagMuc(m.muc) + '<div><b>' + esc(song(m, 'label')) + '</b>' +
      (song(m, 'viec') ? '<span>' + esc(song(m, 'viec')) + '</span>' : '') + '</div></li>';
  };
  var html = '<h4 class="sec">' + esc(t('conThieu')) + (viec.length ? ' <span class="muted">(' + viec.length + ')</span>' : '') + '</h4>';
  html += viec.length ? '<ul class="miss">' + viec.map(mot).join('') + '</ul>'
    : '<div class="note ok">' + icon('check') + '<div><b>' + esc(t('duCa')) + '</b></div></div>';
  if (goiY.length) html += '<h4 class="sec">' + esc(t('goiY')) + '</h4><ul class="miss">' + goiY.map(mot).join('') + '</ul>';
  return html;
}

/* ---- nền tảng: từng dòng một nền tảng, có đường dẫn khi đã lên ---- */
function nenTang(d, opts) {
  opts = opts || {};
  var tien = opts.tien || HT.fmt.usd;
  var coSo = d.lastPeriod != null;
  var html = '<div class="plat">' + d.platforms.map(function (p) {
    var phu = p.status === 'live' && p.liveAt ? t('lenNgay') + ' ' + HT.fmt.date(p.liveAt) : (song(p, 'reason') || '');
    return '<div class="plat-row ' + esc(p.status) + '">' +
      '<div class="pn"><span class="dot ' + (p.status === 'live' ? 'ok' : (p.status === 'rejected' || p.status === 'takedown') ? 'no' : p.status === 'pending' ? 'warn' : 'off') + '"></span>' +
        '<div><b>' + esc(p.name) + '</b>' + (phu ? '<span>' + esc(phu) + '</span>' : '') + '</div></div>' +
      '<div class="ps">' + tagNenTang(p.status) + '</div>' +
      '<div class="pv">' + (coSo && p.streams != null
        ? '<b>' + esc(tien(opts.mine ? p.mine : p.revenue)) + '</b><span>' + esc(HT.fmt.n(p.streams)) + ' ' + esc(t('luot').toLowerCase()) + '</span>'
        : '<span class="nil">—</span>') + '</div>' +
      '<div class="pl">' + (p.url
        ? '<a class="btn sm" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer" title="' + esc(p.url) + '">' + icon('link') + esc(t('mo')) + '</a>'
        : (p.status === 'live' ? '<span class="muted" style="font-size:11.5px">' + esc(t('khongLink')) + '</span>' : '')) + '</div>' +
      '</div>';
  }).join('') +
  '<div class="plat-row other"><div class="pn"><span class="dot ' + (d.others.pending ? 'warn' : 'ok') + '"></span><div><b>' +
    esc(t('nenTangKhac')) + ' (' + esc(HT.fmt.n(d.others.count)) + ')</b><span>' +
    esc(HT.fmt.n(d.others.live) + ' ' + t('daLen') + (d.others.pending ? ' · ' + HT.fmt.n(d.others.pending) + ' ' + t('chuaXn') : '')) + '</span></div></div>' +
    '<div class="ps"></div><div class="pv"></div><div class="pl"></div></div></div>' +
  '<div class="hint">' + esc(coSo ? t('kyGan').replace('{k}', d.lastPeriod) : t('kyChua')) + '</div>';
  return html;
}

/* ---- khiếu nại / xung đột quyền trên bài ---- */
var KIEU_KN = { open: 'info', disputed: 'warn', escalated: 'warn', resolved: 'ok', released: '' };
function khieuNai(rows, opts) {
  if (!rows.length) return '<div class="note ok">' + icon('check') + '<div><b>' + esc(t('knTrong')) + '</b></div></div>';
  return '<p class="say" style="margin-bottom:10px">' + esc(t('knMo')) + '</p><div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' +
    esc(t('cNenTang')) + '</th><th>' + esc(t('cLoaiKn')) + '</th><th>' + esc(t('cBenKia')) + '</th><th class="num">' + esc(t('cLuotNgay')) + '</th><th>' + esc(t('cTrangThaiKn')) + '</th></tr></thead><tbody>' +
    rows.map(function (c) {
      return '<tr><td><b>' + esc(c.store) + '</b><div class="t-sub">' + esc(c.country || '') + '</div></td><td>' + esc(song(c, 'categoryLabel')) + '</td><td>' + esc(c.otherParty || '—') + '</td>' +
        '<td class="num">' + esc(HT.fmt.n(c.dailyViews || 0)) + '</td><td><span class="tag ' + (KIEU_KN[c.status] || '') + '">' + esc(t({ open: 'knOpen', disputed: 'knDisputed', escalated: 'knEscalated', resolved: 'knResolved', released: 'knReleased' }[c.status] || c.status)) + '</span>' +
        '<div class="t-sub">' + esc(t('cCapNhat') + ' ' + HT.fmt.date(c.updatedAt)) + (c.lastNote ? ' · ' + esc(c.lastNote) : '') + '</div></td></tr>';
    }).join('') + '</tbody></table></div>';
}

/* ---- ma trận nền tảng × kỳ ----
   Ba thước đo, một bảng; đổi thước đo là vẽ lại phần thân bảng, không mở
   lại ngăn. Ô có vạch nền theo tỷ lệ so với ô lớn nhất của cùng thước đo,
   để mắt nhìn ra nền tảng nào gánh phần lớn mà không cần đọc từng số. */
function maTran(monthly, opts) {
  opts = opts || {};
  var metric = opts.metric || 'revenue';
  var tien = opts.tien || HT.fmt.usd0, tien2 = opts.tien2 || HT.fmt.usd;
  var per = monthly.periods, rows = monthly.rows, tot = monthly.totals;
  if (!per.length) return '<p class="say">' + esc(t('khongThang')) + '</p>';
  var fmtO = metric === 'streams' ? HT.fmt.n : tien;
  var max = 0;
  rows.forEach(function (r) { r[metric].forEach(function (v) { if (v > max) max = v; }); });
  var tongHang = function (r) { return r[metric].reduce(function (a, b) { return a + b; }, 0); };
  var tongCot = tot[metric].reduce(function (a, b) { return a + b; }, 0);
  var sap = rows.slice().sort(function (a, b) { return tongHang(b) - tongHang(a); });
  var o = function (v) {
    var w = max > 0 ? Math.round(v / max * 100) : 0;
    return '<td class="num' + (v ? '' : ' nil') + '" style="--w:' + w + '%">' + (v ? esc(fmtO(v)) : '—') + '</td>';
  };
  return '<div class="tw mx-w"><table class="t mx"><thead><tr><th>' + esc(t('nenTang')) + '</th>' +
    per.map(function (p) { return '<th class="num' + (p.open === false ? ' dim' : '') + '" title="' + esc(p.open === false ? t('chuaDuyet') : '') + '">' + esc(p.label) + '</th>'; }).join('') +
    '<th class="num band">' + esc(t('tong')) + '</th></tr></thead><tbody>' +
    sap.map(function (r) {
      return '<tr><td>' + esc(song(r, 'name')) + '</td>' + r[metric].map(o).join('') +
        '<td class="num band"><b>' + esc(fmtO(tongHang(r))) + '</b></td></tr>';
    }).join('') + '</tbody><tfoot><tr><td>' + esc(t('tongKy')) + '</td>' +
    tot[metric].map(function (v) { return '<td class="num">' + esc(v ? (metric === 'streams' ? HT.fmt.n(v) : tien2(v)) : '—') + '</td>'; }).join('') +
    '<td class="num band">' + esc(metric === 'streams' ? HT.fmt.n(tongCot) : tien2(tongCot)) + '</td></tr></tfoot></table></div>';
}
function chonThuocDo(cur, opts) {
  opts = opts || {};
  /* Thước đo doanh thu: nội bộ là doanh thu gộp, label là doanh thu sau phí,
     nghệ sĩ là thu nhập của mình (khi đó cột "mine" trùng, không hiện). */
  var ds = [{ k: 'streams', l: t('luot') }, { k: 'revenue', l: opts.revenueLabel || t('gop') }];
  if (opts.mineLabel && !opts.anMine) ds.push({ k: 'mine', l: opts.mineLabel });
  return '<div class="seg mx-seg" data-mx-seg>' + ds.map(function (x) {
    return '<button type="button" data-mx="' + x.k + '"' + (x.k === cur ? ' class="on"' : '') + '>' + esc(x.l) + '</button>';
  }).join('') + '</div>';
}
function csvMaTran(ten, monthly, metric, nhanMetric) {
  var per = monthly.periods;
  HM.csv(ten, [t('nenTang')].concat(per.map(function (p) { return p.label; })).concat([t('tong')]),
    monthly.rows.map(function (r) {
      var tong = r[metric].reduce(function (a, b) { return a + b; }, 0);
      return [r.name].concat(r[metric].map(function (v) { return metric === 'streams' ? v : v.toFixed(2); })).concat([metric === 'streams' ? tong : tong.toFixed(2)]);
    }).concat([[t('tongKy')].concat(monthly.totals[metric].map(function (v) { return metric === 'streams' ? v : v.toFixed(2); }))
      .concat([(function () { var s = monthly.totals[metric].reduce(function (a, b) { return a + b; }, 0); return metric === 'streams' ? s : s.toFixed(2); })()])]));
}

/* ---- ngăn trượt trọn bộ ----
   d: gói api.trackAsset / admin.asset. opts: { mineLabel, tien, tien2,
   noiBo, them:[{k, l, html, khiMo(panel)}], tabDau } */
function moNgan(c, d, opts) {
  opts = opts || {};
  var mineLabel = opts.mineLabel || null;
  var tien = opts.tien || HT.fmt.usd, tien0 = opts.tien0 || HT.fmt.usd0;
  var st = { tab: opts.tabDau || 'qt', metric: opts.metric || 'revenue' };
  var tabs = (opts.them || []).map(function (x) { return { k: x.k, l: x.l }; })
    .concat([{ k: 'qt', l: t('tabQt') }, { k: 'nt', l: t('tabNt') }, { k: 'thang', l: t('tabThang') }])
    .concat(opts.claims ? [{ k: 'kn', l: t('tabKn') + (opts.claims.length ? ' (' + opts.claims.length + ')' : '') }] : []);
  if (!tabs.some(function (x) { return x.k === st.tab; })) st.tab = tabs[0].k;

  var dau = HM.so([
    { l: t('tichLuy'), v: mineLabel ? tien(d.lifetime.mine) : tien(d.lifetime.revenue), lon: true,
      s: mineLabel ? (mineLabel + (opts.anMine ? '' : ' · ' + (opts.revenueLabel || t('gop')).toLowerCase() + ' ' + tien0(d.lifetime.revenue))) : (HT.fmt.n(d.lifetime.streams) + ' ' + t('luot').toLowerCase()) },
    { l: t('phatHanh'), v: HT.fmt.date(d.releaseDate), s: d.type + ' · ' + d.releasePeriod },
    { l: t('nenTang'), html: chamNenTang(d.summary.live, d.summary.total, d.summary.stage) + ' <b>' + esc(d.summary.live + '/' + d.summary.total) + '</b>', s: '' },
    { l: t('thieu'), v: d.summary.missing ? String(d.summary.missing) : '0', mau: d.summary.missing ? HB.mau(d.summary.stage === 'issue' ? 'no' : 'warn') : HB.mau('ok'),
      s: d.summary.hints ? d.summary.hints + ' ' + t('mGoiY').toLowerCase() : '' }
  ]);
  var chiTiet = HM.kv([
    { t: t('maBai'), v: 'ISRC ' + d.isrc + (d.isrcAlt ? ' / ' + d.isrcAlt : '') + ' · UPC ' + d.upc },
    { t: t('sangTac'), v: d.credits.writers.join(', ') },
    d.credits.producerPts ? { t: t('producer'), v: HT.fmt.pct(d.credits.producerPts) } : null
  ]);

  var panels = {};
  (opts.them || []).forEach(function (x) { panels[x.k] = x.html; });
  panels.qt = quyTrinh(d.steps) + conThieu(d.missing);
  panels.nt = nenTang(d, { tien: tien, mine: !!mineLabel });
  if (opts.claims) panels.kn = khieuNai(opts.claims, opts);
  panels.thang = '<p class="say" style="margin-bottom:10px">' + esc(opts.noiBo ? t('thangMoNb') : t('thangMo')) + '</p>' +
    '<div class="bar" style="margin-bottom:10px">' + chonThuocDo(st.metric, { mineLabel: mineLabel, revenueLabel: opts.revenueLabel, anMine: opts.anMine }) + '<div class="sp"></div>' +
    '<button type="button" class="btn sm" data-mx-csv>' + icon('down2') + esc(t('xuat')) + '</button></div>' +
    '<div data-mx-body>' + maTran(d.monthly, { metric: st.metric, tien: tien0, tien2: tien }) + '</div>';

  var html = '<div class="asset-h">' + tagGiaiDoan(d.summary.stage) + '</div>' + dau +
    '<div class="tabs sm" data-asset-tabs>' + tabs.map(function (x) {
      return '<button type="button" data-atab="' + esc(x.k) + '"' + (x.k === st.tab ? ' class="on"' : '') + '>' + esc(x.l) + '</button>';
    }).join('') + '</div>' +
    Object.keys(panels).map(function (k) {
      return '<div data-apanel="' + esc(k) + '"' + (k === st.tab ? '' : ' hidden') + '>' + panels[k] + '</div>';
    }).join('') +
    '<h4 class="sec">' + esc(HT.lang === 'en' ? 'Record details' : 'Thông tin bản ghi') + '</h4>' + chiTiet +
    (opts.hoTro ? '<div class="btnrow" style="margin-top:14px"><button type="button" class="btn sm pri" data-yc-mkt="' + d.id + '">' + icon('up') + esc(t('ycMkt')) + '</button>' +
      '<button type="button" class="btn sm" data-yc-ht="' + d.id + '">' + esc(t('ycHt')) + '</button></div>' : '');

  c.nganTruot(html, {
    tieuDe: d.title, phu: d.isrc + ' · ' + d.artist + (d.label ? ' · ' + d.label : ''),
    khiMo: function (dr) {
      HB.gan(dr);
      (opts.them || []).forEach(function (x) { if (x.khiMo) x.khiMo(dr.querySelector('[data-apanel="' + x.k + '"]')); });
      HM.bam(dr, '[data-atab]', function (el) {
        st.tab = el.getAttribute('data-atab');
        dr.querySelectorAll('[data-atab]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-atab') === st.tab); });
        dr.querySelectorAll('[data-apanel]').forEach(function (p) { p.hidden = p.getAttribute('data-apanel') !== st.tab; });
        var p = dr.querySelector('[data-apanel="' + st.tab + '"]');
        if (p) HB.gan(p);
      });
      HM.bam(dr, '[data-mx]', function (el) {
        st.metric = el.getAttribute('data-mx');
        dr.querySelectorAll('[data-mx]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mx') === st.metric); });
        dr.querySelector('[data-mx-body]').innerHTML = maTran(d.monthly, { metric: st.metric, tien: tien0, tien2: tien });
      });
      HM.bam(dr, '[data-mx-csv]', function () {
        csvMaTran('nen-tang-' + d.isrc + '-' + st.metric + '.csv', d.monthly, st.metric);
      });
    }
  });
}

global.HTS = {
  t: t, song: song,
  tagNenTang: tagNenTang, tagGiaiDoan: tagGiaiDoan, tagMuc: tagMuc, chamNenTang: chamNenTang,
  quyTrinh: quyTrinh, conThieu: conThieu, nenTang: nenTang, maTran: maTran, chonThuocDo: chonThuocDo, csvMaTran: csvMaTran, khieuNai: khieuNai,
  moNgan: moNgan
};

})(window);
