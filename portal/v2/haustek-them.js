/* =====================================================================
   HAUSTEK · MẢNH GIAO DIỆN VÒNG 5 (HTM) — dùng chung hai cổng
   ---------------------------------------------------------------------
   Chia sẻ tác quyền, chất lượng lượt nghe, ngưỡng trả tiền, sức khoẻ
   metadata, giải thích con số, chiến dịch. Mỗi hàm nhận DỮ LIỆU đã tính
   từ lõi và trả về HTML; màn hình nào cũng vẽ được cùng một mảnh, cổng
   đối tác hay nội bộ chỉ khác cột tài khoản và nút hành động.
   Chữ hai thứ tiếng nằm ở đây vì các mảnh này không thuộc riêng màn nào.
   ===================================================================== */
"use strict";
(function (global) {

var esc = function (s) { return HT.esc(s); };
var icon = function (n) { return HT.icon(n); };

var CHU = {
  vi: {
    mucCritical: 'Nghiêm trọng', mucWarn: 'Cảnh báo', mucWatch: 'Theo dõi',
    ttOpen: 'Đang mở', ttDisputed: 'Đang khiếu nại', ttResolved: 'Đã gỡ', ttConfirmed: 'Đã xác nhận',
    tinHieu: 'Tín hiệu', nguong: 'ngưỡng', luot7: 'Lượt nghe 7 ngày', nen: 'nền / ngày', nguoiNghe: 'người nghe',
    co: 'Nền tảng gắn cờ', goBo: 'lượt bị gỡ', phat: 'phạt', thang: '/tháng', khieuNai: 'Khiếu nại', xuLy: 'Xử lý',
    cBai: 'Bài hát', cTk: 'Tài khoản', cMuc: 'Mức', cTinHieu: 'Tín hiệu vượt ngưỡng', cLuot: 'Lượt nghe 7 ngày', cCo: 'Cờ nền tảng', cTt: 'Trạng thái', cThaoTac: 'Thao tác',
    lichSu: 'Diễn biến', chuaCo: 'Chưa có thao tác nào.',
    chuSoHuu: 'Chủ bản ghi', cong: 'Người cộng tác', cPhan: 'Phần chia', cDaChia: 'Đã chia', cThuHoi: 'Thu hồi', them: 'Thêm người', bo: 'Bỏ', nhan: 'Đã nhận', moi: 'Chờ nhận', xacNhanThay: 'Xác nhận thay',
    thuHoiCon: 'còn {n} để thu hồi', thuHoiXong: 'đã thu hồi đủ', chuaChia: 'chưa có người cộng tác',
    ngRule: 'Luật trả tiền của nền tảng', datNguong: 'đạt', duoiNguong: 'dưới ngưỡng', uocTinh: 'ước tính', khongNguong: 'không có ngưỡng',
    mdDiem: 'Điểm metadata', mdThieu: 'thiếu {n} mục', mdDu: 'đủ', mdChan: 'giữ lại trước khi giao', mdGoiY: 'Cách sửa',
    gtBuoc: 'Chuỗi suy ra con số', gtNt: 'Theo nền tảng', cNt: 'Nền tảng', cLuotN: 'Lượt nghe', cMucTra: 'Mức trả / 1.000', cTien: 'Số tiền',
    cdLoai: 'Loại', cdTrangThai: 'Trạng thái', cdThoiGian: 'Thời gian', cdKq: 'Kết quả', cdNgay: 'ngày',
    cdRunning: 'Đang chạy', cdPlanned: 'Sắp chạy', cdDone: 'Đã xong',
    xem: 'lượt xem', bam: 'lượt bấm', luuTruoc: 'lưu trước', chuyenDoi: 'chuyển đổi', daGui: 'đã gửi', daNhan: 'nhận', choKq: 'chờ', tuChoi: 'từ chối',
    nganSach: 'ngân sách', daChi: 'đã chi', hienThi: 'hiển thị', luotNghe: 'lượt nghe quy được', giaLuot: 'giá mỗi lượt nghe',
    cDoiTac: 'Đối tác', cAlerts: 'Cảnh báo', cCoNt: 'Bị gắn cờ', cPhat: 'Phạt / tháng', cMau: 'Kiểu', cMo: 'Đang mở'
  },
  en: {
    mucCritical: 'Critical', mucWarn: 'Warning', mucWatch: 'Watch',
    ttOpen: 'Open', ttDisputed: 'Disputed', ttResolved: 'Cleared', ttConfirmed: 'Confirmed',
    tinHieu: 'Signals', nguong: 'threshold', luot7: 'Streams, 7 days', nen: 'baseline / day', nguoiNghe: 'listeners',
    co: 'Flagged by platform', goBo: 'streams removed', phat: 'penalty', thang: '/month', khieuNai: 'Dispute', xuLy: 'Handle',
    cBai: 'Track', cTk: 'Account', cMuc: 'Level', cTinHieu: 'Signals over threshold', cLuot: 'Streams, 7 days', cCo: 'Platform flag', cTt: 'Status', cThaoTac: 'Actions',
    lichSu: 'History', chuaCo: 'No actions yet.',
    chuSoHuu: 'Owner', cong: 'Collaborators', cPhan: 'Share', cDaChia: 'Paid out', cThuHoi: 'Recoup', them: 'Add person', bo: 'Remove', nhan: 'Accepted', moi: 'Invited', xacNhanThay: 'Accept on behalf',
    thuHoiCon: '{n} left to recoup', thuHoiXong: 'fully recouped', chuaChia: 'no collaborators',
    ngRule: 'Platform payout rules', datNguong: 'met', duoiNguong: 'below threshold', uocTinh: 'estimate', khongNguong: 'no threshold',
    mdDiem: 'Metadata score', mdThieu: '{n} missing', mdDu: 'complete', mdChan: 'held before delivery', mdGoiY: 'How to fix',
    gtBuoc: 'How the number is derived', gtNt: 'By platform', cNt: 'Platform', cLuotN: 'Streams', cMucTra: 'Rate / 1,000', cTien: 'Amount',
    cdLoai: 'Kind', cdTrangThai: 'Status', cdThoiGian: 'Timing', cdKq: 'Results', cdNgay: 'days',
    cdRunning: 'Running', cdPlanned: 'Planned', cdDone: 'Done',
    xem: 'views', bam: 'clicks', luuTruoc: 'pre-saves', chuyenDoi: 'conversion', daGui: 'sent', daNhan: 'accepted', choKq: 'pending', tuChoi: 'declined',
    nganSach: 'budget', daChi: 'spent', hienThi: 'impressions', luotNghe: 'attributed streams', giaLuot: 'cost per stream',
    cDoiTac: 'Partner', cAlerts: 'Alerts', cCoNt: 'Flagged', cPhat: 'Penalty / month', cMau: 'Pattern', cMo: 'Open'
  }
};
function t(k) { var d = CHU[HT.lang] || CHU.vi; return d[k] != null ? d[k] : (CHU.vi[k] != null ? CHU.vi[k] : k); }
function song(o, k) { return HT.lang === 'en' && o[k + 'En'] ? o[k + 'En'] : o[k]; }
function n(v) { return HT.fmt.n(v); }
function pct(v) { return HT.fmt.pct(v); }

/* ---- mức cảnh báo và trạng thái ---- */
function tagMuc(sev) {
  return sev === 'critical' ? HM.tag(t('mucCritical'), 'no') : sev === 'warn' ? HM.tag(t('mucWarn'), 'warn') : HM.tag(t('mucWatch'), '');
}
function tagTt(st) {
  return st === 'disputed' ? HM.tag(t('ttDisputed'), 'info') : st === 'resolved' ? HM.tag(t('ttResolved'), 'ok') : st === 'confirmed' ? HM.tag(t('ttConfirmed'), 'no') : HM.tag(t('ttOpen'), 'warn');
}

/* ---- năm tín hiệu của một bài: giá trị so với ngưỡng, ô vượt được tô ---- */
function tinHieu(r) {
  return '<div class="sig">' + r.signals.map(function (s) {
    var v = s.value == null ? '—' : (s.unit === '%' ? n(s.value) + '%' : s.unit === 'σ' ? n(s.value) + 'σ' : n(s.value) + '×');
    var ng = s.unit === '%' ? s.threshold + '%' : s.unit === 'σ' ? s.threshold + 'σ' : s.threshold + '×';
    return '<div class="sig-i' + (s.hit ? ' hit' : '') + '"><b>' + esc(v) + '</b><span>' + esc(song(s, 'label')) + (s.extra && s.hit ? ' · ' + esc(s.extra) : '') + '</span><em>' + esc(t('nguong') + ' ' + ng) + '</em></div>';
  }).join('') + '</div>';
}
function chipTinHieu(r) {
  var hits = r.signals.filter(function (s) { return s.hit; });
  if (!hits.length && r.dsp) return '<span class="tag no">' + esc(t('co')) + '</span>';
  return hits.map(function (s) { return '<span class="tag ' + (r.severity === 'critical' ? 'no' : r.severity === 'warn' ? 'warn' : '') + '" title="' + esc(song(s, 'label')) + '">' + esc(song(s, 'label')) + '</span>'; }).join(' ');
}
function coNenTang(r) {
  if (!r.dsp) return '<span class="nil">—</span>';
  return '<div class="t-ttl" style="color:var(--danger)">' + esc(r.dsp.platform) + ' · ' + esc(HT.fmt.date(r.dsp.at)) + '</div>' +
    '<div class="t-sub" style="font-family:var(--f)">' + esc(n(r.dsp.removedStreams) + ' ' + t('goBo') + ' · ' + t('phat') + ' ' + HT.fmt.usd(r.dsp.penaltyUsd) + t('thang')) + '</div>';
}
/* bảng cảnh báo; opts: { noiBo, nut(r) → html nút } */
function bangCanhBao(rows, opts) {
  opts = opts || {};
  if (!rows.length) return '';
  return '<div class="tw"><table class="t"><thead><tr><th>' + esc(t('cBai')) + '</th>' + (opts.noiBo ? '<th>' + esc(t('cTk')) + '</th>' : '') +
    '<th>' + esc(t('cMuc')) + '</th><th>' + esc(t('cTinHieu')) + '</th><th class="num">' + esc(t('cLuot')) + '</th><th>' + esc(t('cCo')) + '</th><th>' + esc(t('cTt')) + '</th>' +
    (opts.nut ? '<th>' + esc(t('cThaoTac')) + '</th>' : '') + '</tr></thead><tbody>' +
    rows.map(function (r) {
      return '<tr class="pick" data-cl="' + r.trackId + '"><td>' + HM.tenBia({ bia: r.trackId, ten: HM.dai(r.title, 34), phu: r.artist + ' · ' + r.isrc }) + '</td>' +
        (opts.noiBo ? '<td><div class="t-ttl">' + esc(HM.dai(opts.tenTk ? opts.tenTk(r.partyKey) : r.partyKey, 24)) + '</div><div class="t-sub">' + esc(r.partyKey) + '</div></td>' : '') +
        '<td>' + tagMuc(r.severity) + '</td><td>' + chipTinHieu(r) + '</td>' +
        '<td class="num"><b>' + esc(n(r.last7)) + '</b><div class="t-sub" style="font-family:var(--f)">' + esc(n(r.baselinePerDay) + ' ' + t('nen')) + '</div></td>' +
        '<td>' + coNenTang(r) + '</td><td>' + tagTt(r.status) + '</td>' +
        (opts.nut ? '<td>' + opts.nut(r) + '</td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
}
/* chi tiết một cảnh báo: tín hiệu, cờ, diễn biến */
function theCanhBao(r) {
  return '<div class="bar" style="margin-bottom:10px">' + tagMuc(r.severity) + tagTt(r.status) +
      '<span class="muted" style="font-size:12.5px">' + esc(n(r.last7) + ' ' + t('luot7').toLowerCase() + ' · ' + n(r.listeners7) + ' ' + t('nguoiNghe') + ' · ' + n(r.baselinePerDay) + ' ' + t('nen')) + '</span></div>' +
    tinHieu(r) +
    (r.dsp ? '<div class="note no" style="margin-top:12px"><div>' + icon('alert') + '</div><div><b>' + esc(t('co') + ': ' + r.dsp.platform + ' · ' + HT.fmt.date(r.dsp.at)) + '</b>' +
      '<p>' + esc(song(r.dsp, 'reason') + ' · ' + n(r.dsp.removedStreams) + ' ' + t('goBo') + ' · ' + t('phat') + ' ' + HT.fmt.usd(r.dsp.penaltyUsd) + t('thang')) + '</p></div></div>' : '') +
    '<h4 class="sec" style="margin-top:14px">' + esc(t('lichSu')) + '</h4>' +
    (r.history && r.history.length ? '<ul class="tl">' + r.history.slice().reverse().map(function (h) {
      return '<li><b>' + esc(h.status) + '</b> · <span class="mono">' + esc(h.at) + '</span>' + (h.by ? ' · ' + esc(h.by) : '') + (h.note ? '<div class="muted" style="font-size:12.5px">' + esc(h.note) + '</div>' : '') + '</li>';
    }).join('') + '</ul>' : '<p class="say">' + esc(t('chuaCo')) + '</p>');
}

/* ---- chia sẻ tác quyền ---- */
function dongCong(cg, o) {
  o = o || {};
  var tt = cg.status === 'accepted' ? HM.tag(t('nhan'), 'ok') : HM.tag(t('moi'), 'warn');
  var th = cg.recoup ? (cg.recouping ? '<span class="muted" style="font-size:11.5px">' + esc(t('thuHoiCon').replace('{n}', HT.fmt.usd0(cg.recoup - cg.recouped))) + '</span>' : '<span class="pos" style="font-size:11.5px">' + esc(t('thuHoiXong')) + '</span>') : '';
  return '<div class="cong">' + HM.hinh(cg.name, cg.email, 'sm') + '<div class="cong-t"><b>' + esc(cg.name) + '</b><span>' + esc(song(cg, 'roleLabel') + ' · ' + cg.email) + '</span>' + th + '</div>' +
    '<div class="cong-r"><b>' + esc(n(cg.pct)) + '%</b>' + tt + (o.nut ? o.nut(cg) : '') + '</div></div>';
}
/* bảng chia sẻ; opts: { noiBo, tenTk(partyKey), tien(v), nutCong(row, cg), nutBai(row) } */
function bangChiaSe(rows, opts) {
  opts = opts || {}; var tien = opts.tien || HT.fmt.usd;
  return '<div class="tw"><table class="t"><thead><tr><th>' + esc(t('cBai')) + '</th>' + (opts.noiBo ? '<th>' + esc(t('cTk')) + '</th>' : '') +
    '<th class="num">' + esc(t('chuSoHuu')) + '</th><th>' + esc(t('cong')) + '</th><th class="num">' + esc(t('cDaChia')) + '</th>' + (opts.nutBai ? '<th>' + esc(t('cThaoTac')) + '</th>' : '') + '</tr></thead><tbody>' +
    rows.map(function (r) {
      var daChia = r.collaborators.reduce(function (s, c) { return s + c.payable; }, 0);
      return '<tr data-cs="' + r.trackId + '"><td>' + HM.tenBia({ bia: r.trackId, ten: HM.dai(r.title, 34), phu: r.artist + ' · ' + r.isrc }) + '</td>' +
        (opts.noiBo ? '<td><div class="t-ttl">' + esc(HM.dai(opts.tenTk ? opts.tenTk(r.partyKey) : '', 24)) + '</div></td>' : '') +
        '<td class="num"><b>' + esc(n(r.ownerPct)) + '%</b><div class="meter thin" style="width:72px;margin:5px 0 0 auto"><i style="width:' + r.ownerPct + '%"></i></div></td>' +
        '<td>' + (r.collaborators.length ? r.collaborators.map(function (cg) { return dongCong(cg, { nut: opts.nutCong ? function (x) { return opts.nutCong(r, x); } : null }); }).join('') : '<span class="nil">' + esc(t('chuaChia')) + '</span>') + '</td>' +
        '<td class="num band"><b>' + esc(tien(daChia)) + '</b></td>' +
        (opts.nutBai ? '<td>' + opts.nutBai(r) + '</td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
}

/* ---- ngưỡng trả tiền của nền tảng ---- */
function nguong(m) {
  return '<div class="checks">' + m.rules.map(function (r) {
    var co = r.threshold != null;
    var chu = co ? (n(r.value) + ' / ' + n(r.threshold) + (r.value2 != null ? ' · ' + n(r.value2) + ' / ' + n(r.threshold2) + ' ' + t('nguoiNghe') : '')) : t('khongNguong');
    return '<div class="check ' + (r.ok ? 'ok' : 'no') + '">' + icon(r.ok ? 'check' : 'alert') + '<div><b>' + esc(r.platform) + ' · ' + esc(r.ok ? t('datNguong') : t('duoiNguong')) + (r.estimated ? ' · ' + esc(t('uocTinh')) : '') + '</b><span>' + esc(song(r, 'rule')) + '</span>' +
      (co ? '<div class="meter thin" style="margin-top:6px;max-width:260px"><i style="width:' + Math.round(r.progress * 100) + '%;background:' + (r.ok ? 'var(--ok)' : 'var(--warn)') + '"></i></div>' : '') + '</div>' +
      '<div class="r mono">' + esc(chu) + '</div></div>';
  }).join('') + '</div>';
}

/* ---- sức khoẻ metadata ---- */
function diemMeta(h, cls) {
  var mau = h.grade === 'A' ? 'var(--ok)' : h.grade === 'B' ? 'var(--warn)' : 'var(--danger)';
  return '<span class="score' + (cls ? ' ' + cls : '') + '" style="--p:' + h.score + '%;--mau:' + mau + '" title="' + esc(t('mdDiem') + ' ' + h.score) + '"><b>' + h.score + '</b><i></i></span>';
}
function kiemMeta(h) {
  return '<div class="bar" style="margin-bottom:10px">' + diemMeta(h, 'lon') + '<div><b style="font-size:14px">' + esc(t('mdDiem')) + ' · ' + esc(h.grade) + '</b><div class="muted" style="font-size:12.5px">' +
      esc(h.missing ? t('mdThieu').replace('{n}', h.missing) : t('mdDu')) + (h.blocking ? ' · ' + esc(t('mdChan')) : '') + '</div></div></div>' +
    '<div class="checks">' + h.checks.map(function (c) {
      return '<div class="check ' + (c.ok ? 'ok' : (c.w >= 15 ? 'no' : '')) + '">' + icon(c.ok ? 'check' : 'alert') + '<div><b>' + esc(song(c, 'label')) + '</b>' + (!c.ok ? '<span>' + esc(t('mdGoiY') + ': ' + song(c, 'hint')) + '</span>' : '') + '</div><div class="r mono">' + c.w + '</div></div>';
    }).join('') + '</div>';
}
function bangMeta(rows, opts) {
  opts = opts || {};
  return '<div class="tw"><table class="t"><thead><tr><th>' + esc(t('cBai')) + '</th>' + (opts.noiBo ? '<th>' + esc(t('cTk')) + '</th>' : '') + '<th class="num">' + esc(t('mdDiem')) + '</th><th>' + esc(HT.lang === 'en' ? 'Missing' : 'Còn thiếu') + '</th></tr></thead><tbody>' +
    rows.map(function (h) {
      return '<tr class="pick" data-md="' + h.trackId + '"><td>' + HM.tenBia({ bia: h.trackId, ten: HM.dai(h.title, 34), phu: h.artist + ' · ' + h.isrc }) + '</td>' +
        (opts.noiBo ? '<td>' + esc(HM.dai(opts.tenTk ? opts.tenTk(h.partyKey) : '', 24)) + '</td>' : '') +
        '<td class="num">' + diemMeta(h) + '</td><td>' + h.checks.filter(function (c) { return !c.ok; }).map(function (c) { return '<span class="tag ' + (c.w >= 15 ? 'no' : '') + '">' + esc(song(c, 'label')) + '</span>'; }).join(' ') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}

/* ---- giải thích con số của kỳ: chuỗi bước + bảng nền tảng ---- */
function giaiThich(ex, opts) {
  opts = opts || {}; var tien = opts.tien || HT.fmt.usd;
  return '<ol class="ladder">' + ex.steps.map(function (s) {
    return '<li' + (s.tong ? ' class="tong"' : '') + '><span class="ld-l">' + esc(song(s, 'label')) + (song(s, 'detail') ? '<em>' + esc(song(s, 'detail')) + '</em>' : '') + '</span>' +
      '<b class="ld-v">' + esc(s.kind === 'so' ? n(s.value) : tien(s.value)) + '</b></li>';
  }).join('') + '</ol>' +
  (ex.platforms && ex.platforms.length ? '<h4 class="sec" style="margin-top:14px">' + esc(t('gtNt')) + '</h4><div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + esc(t('cNt')) + '</th><th class="num">' + esc(t('cLuotN')) + '</th><th class="num">' + esc(t('cMucTra')) + '</th><th class="num">' + esc(t('cTien')) + '</th></tr></thead><tbody>' +
    ex.platforms.map(function (p) { return '<tr><td>' + esc(song(p, 'name')) + '</td><td class="num">' + esc(n(p.streams)) + '</td><td class="num mono">' + esc(HT.fmt.usd(p.per1k)) + '</td><td class="num"><b>' + esc(tien(p.amount)) + '</b></td></tr>'; }).join('') +
    '</tbody></table></div>' : '') +
  '<p class="hint" style="margin-top:10px">' + esc(song(ex, 'note')) + '</p>';
}

/* ---- chiến dịch ---- */
function tagCd(st) { return st === 'running' ? HM.tag(t('cdRunning'), 'ok') : st === 'planned' ? HM.tag(t('cdPlanned'), 'info') : HM.tag(t('cdDone'), ''); }
function ketQuaCd(r, tien) {
  tien = tien || HT.fmt.usd;
  if (r.kind === 'smartlink') return '<div class="fun"><span><b>' + esc(n(r.views)) + '</b>' + esc(t('xem')) + '</span><i></i><span><b>' + esc(n(r.clicks)) + '</b>' + esc(t('bam')) + '</span><i></i><span><b>' + esc(n(r.presaves)) + '</b>' + esc(t('luuTruoc')) + '</span></div><div class="t-sub" style="font-family:var(--f)">' + esc(t('chuyenDoi') + ' ' + pct(r.conversion) + ' · ' + r.url) + '</div>';
  if (r.kind === 'pitch') return '<div class="fun"><span><b>' + esc(n(r.pitched)) + '</b>' + esc(t('daGui')) + '</span><i></i><span><b class="pos">' + esc(n(r.accepted)) + '</b>' + esc(t('daNhan')) + '</span>' + (r.pending ? '<i></i><span><b>' + esc(n(r.pending)) + '</b>' + esc(t('choKq')) + '</span>' : '') + '</div>';
  return '<div class="fun"><span><b>' + esc(tien(r.spent)) + '</b>' + esc(t('daChi') + ' / ' + tien(r.budget)) + '</span><i></i><span><b>' + esc(n(r.impressions)) + '</b>' + esc(t('hienThi')) + '</span><i></i><span><b>' + esc(n(r.clicks)) + '</b>' + esc(t('bam')) + '</span><i></i><span><b class="pos">' + esc(n(r.streams)) + '</b>' + esc(t('luotNghe')) + '</span></div><div class="t-sub" style="font-family:var(--f)">' + esc(r.channel + ' · ' + t('giaLuot') + ' ' + tien(r.costPerStream)) + '</div>';
}
function bangChienDich(rows, opts) {
  opts = opts || {}; var tien = opts.tien || HT.fmt.usd;
  return '<div class="tw"><table class="t"><thead><tr><th>' + esc(t('cBai')) + '</th>' + (opts.noiBo ? '<th>' + esc(t('cTk')) + '</th>' : '') + '<th>' + esc(t('cdLoai')) + '</th><th>' + esc(t('cdThoiGian')) + '</th><th>' + esc(t('cdKq')) + '</th><th>' + esc(t('cdTrangThai')) + '</th></tr></thead><tbody>' +
    rows.map(function (r) {
      return '<tr class="pick" data-cd="' + esc(r.id) + '"><td>' + HM.tenBia({ bia: r.trackId, ten: HM.dai(r.title, 32), phu: r.artist }) + '</td>' +
        (opts.noiBo ? '<td>' + esc(HM.dai(opts.tenTk ? opts.tenTk(r.partyKey) : r.partyKey, 24)) + '</td>' : '') +
        '<td><div class="t-ttl">' + esc(song(r, 'kindLabel')) + '</div><div class="t-sub">' + esc(r.id) + '</div></td>' +
        '<td class="mono" style="font-size:12px">' + esc(HT.fmt.date(r.start) + ' → ' + HT.fmt.date(r.end)) + '<div class="t-sub">' + esc(r.days + ' ' + t('cdNgay')) + '</div></td>' +
        '<td>' + ketQuaCd(r, tien) + '</td><td>' + tagCd(r.status) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}
function theChienDich(r, tien) {
  var html = '<div class="bar" style="margin-bottom:12px">' + tagCd(r.status) + '<span class="muted" style="font-size:12.5px">' + esc(song(r, 'kindLabel') + ' · ' + HT.fmt.date(r.start) + ' → ' + HT.fmt.date(r.end)) + '</span></div>' + ketQuaCd(r, tien);
  if (r.kind === 'smartlink') html += '<h4 class="sec" style="margin-top:14px">' + esc(t('bam')) + '</h4>' + HB.o({ loai: 'thanh', hang: r.byStore.map(function (s, i) { return { ten: s.name, gt: s.clicks, mau: HB.dayMau()[i % 8] }; }), dinhDang: 'so' });
  if (r.kind === 'pitch') html += '<h4 class="sec" style="margin-top:14px">Playlist</h4><div class="checks">' + r.playlists.map(function (p) {
    return '<div class="check ' + (p.result === 'accepted' ? 'ok' : p.result === 'declined' ? 'no' : '') + '">' + icon(p.result === 'accepted' ? 'check' : p.result === 'declined' ? 'x' : 'clock') + '<div><b>' + esc(song(p, 'playlist')) + '</b><span>' + esc(p.platform) + '</span></div><div class="r">' + esc(p.result === 'accepted' ? t('daNhan') : p.result === 'declined' ? t('tuChoi') : t('choKq')) + '</div></div>';
  }).join('') + '</div>';
  return html;
}

/* Phân trang nhẹ cho bảng dựng bằng HTM: st.trang là chỉ số trang, co dòng
   mỗi trang; màn hình gắn [data-htm-tr] để lật trang. */
function phanTrang(rows, st, co) {
  co = co || 25;
  var het = Math.max(0, Math.ceil(rows.length / co) - 1);
  if (!(st.trang >= 0)) st.trang = 0; if (st.trang > het) st.trang = het;
  var a = st.trang * co;
  return { page: rows.slice(a, a + co), chan: rows.length > co
    ? '<div class="card-f"><div class="range">' + n(a + 1) + '–' + n(Math.min(rows.length, a + co)) + ' ' + (HT.lang === 'en' ? 'of' : 'trong') + ' ' + n(rows.length) + '</div>' +
      '<div class="pager"><button type="button" class="pg" data-htm-tr="-1"' + (st.trang === 0 ? ' disabled' : '') + '>' + icon('left') + '</button>' +
      '<span class="range">' + (st.trang + 1) + ' / ' + (het + 1) + '</span>' +
      '<button type="button" class="pg" data-htm-tr="1"' + (a + co >= rows.length ? ' disabled' : '') + '>' + icon('right') + '</button></div></div>' : '' };
}
function ganTrang(root, st, veLai) {
  HM.bam(root, '[data-htm-tr]', function (el) { st.trang = (st.trang || 0) + (+el.getAttribute('data-htm-tr')); veLai(); });
}

global.HTM = { t: t, song: song, phanTrang: phanTrang, ganTrang: ganTrang, tagMuc: tagMuc, tagTt: tagTt, tinHieu: tinHieu, chipTinHieu: chipTinHieu, bangCanhBao: bangCanhBao, theCanhBao: theCanhBao,
  dongCong: dongCong, bangChiaSe: bangChiaSe, nguong: nguong, diemMeta: diemMeta, kiemMeta: kiemMeta, bangMeta: bangMeta, giaiThich: giaiThich,
  tagCd: tagCd, ketQuaCd: ketQuaCd, bangChienDich: bangChienDich, theChienDich: theChienDich };

})(window);
