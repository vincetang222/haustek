/* =====================================================================
   CỔNG ĐỐI TÁC · CHẤT LƯỢNG LƯỢT NGHE & METADATA
   ---------------------------------------------------------------------
   Hai việc đối tác cần thấy trước khi nền tảng phạt hoặc giữ tiền:
   · Cảnh báo lượt nghe bất thường: năm tín hiệu tính từ số ngày (vọt so
     với nền, một thị trường chiếm quá nửa, lặp nghe, phụ thuộc playlist,
     nghe ngắn), bài bị nền tảng gắn cờ kèm số lượt bị gỡ và mức phạt, và
     nút khiếu nại có ghi chú — mỗi vấn đề một dòng, không lặp.
   · Sức khoẻ metadata: điểm từng bài, mục còn thiếu và cách sửa; thiếu
     ISWC / IPI thì Haustek giữ lại trước khi giao.
   Nguồn: Spotify 4/2024, Deezer 2023–2026, CNM 2023, Berklee 2015, MLC.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'cb', muc: 'all', tt: 'all', tim: '', trang: 0 };
var NHO = { key: null, q: null, md: null };
function lay(c) {
  var me = c.phien.me, key = me.role + ':' + me.partyId;
  if (NHO.key !== key) { NHO.q = c.api.quality(me.role, me.partyId); NHO.md = c.api.metadataReport(me.role, me.partyId); NHO.key = key; }
  return NHO;
}
function lamMoi() { NHO.key = null; if (HTS.lamMoiQ) HTS.lamMoiQ(); }
function moBai(c, id) {
  var me = c.phien.me, la = me.role === 'label', hs;
  try { hs = c.api.trackAsset(me.role, me.partyId, id); } catch (e) { c.thongBao(e.message, 'no'); return; }
  HTS.moNgan(c, hs, { mineLabel: la ? HTS.t('label') : HTS.t('toi'), revenueLabel: la ? HTS.t('gop') : HTS.t('toi'), anMine: !la,
    tien: HT.fmt.usd, tien0: HT.fmt.usd0, playlists: HTS.plCua(c, id), hoTro: true, tabDau: 'cl' });
}

HT.dangKy({
  id: 'k-chat-luong', nav: 'navChatLuong', nhom: 'nhomBai', icon: 'alert',
  dem: function (c) { try { var q = lay(c).q; return q.counts.critical + q.counts.warn || null; } catch (e) { return null; } },

  chu: {
    vi: {
      navChatLuong: 'Chất lượng lượt nghe', h1: 'Chất lượng lượt nghe',
      mo: 'Tín hiệu bất thường tính từ lượt nghe theo ngày, bài bị nền tảng gắn cờ, và sức khoẻ metadata của từng bài. Xem sớm để không bị gỡ lượt nghe hay giữ tiền.',
      kCb: 'Cảnh báo', kCbS: '{a} nghiêm trọng · {b} cảnh báo · {c} theo dõi', kCo: 'Bài bị nền tảng gắn cờ', kCoS: 'phạt {p}/tháng nếu không khiếu nại', kGo: 'Lượt nghe bị gỡ khỏi báo cáo',
      kKn: 'Đang khiếu nại', kKnS: 'trong {n} cảnh báo đang mở', kMd: 'Điểm metadata trung bình', kMdS: '{a} bài A · {b} bài B · {c} bài C', kChan: 'Bị giữ lại trước khi giao', kChanS: 'thiếu ISWC hoặc IPI',
      tabCb: 'Cảnh báo lượt nghe', tabMd: 'Sức khoẻ metadata',
      mucAll: 'Mọi mức', mucCritical: 'Nghiêm trọng', mucWarn: 'Cảnh báo', mucWatch: 'Theo dõi', ttAll: 'Mọi trạng thái', ttOpen: 'Đang mở', ttDisputed: 'Đang khiếu nại', ttResolved: 'Đã gỡ',
      tim: 'Tìm bài hát, ISRC…', khieuNai: 'Khiếu nại',
      khong: 'Không có cảnh báo nào khớp bộ lọc', khongMo: 'Đổi bộ lọc phía trên.', trong: 'Không có tín hiệu bất thường', trongMo: 'Lượt nghe của bạn đang trong mức bình thường của ngành (nền gian lận 1–3%).',
      hoiKn: 'Khiếu nại cảnh báo cho “{t}”', hoiKnMo: 'Ghi rõ nguồn lượt nghe (chiến dịch quảng cáo, playlist, sự kiện) để Haustek gửi kèm cho nền tảng. Mỗi cảnh báo chỉ khiếu nại một lần.', hoiKnNote: 'Lý do và bằng chứng', gui: 'Gửi khiếu nại', daKn: 'Đã ghi nhận khiếu nại',
      mdThieu: 'Mục còn thiếu nhiều nhất', mdThieuMo: 'Số bài thiếu từng mục; cột đỏ là mã quan trọng.', mdBang: 'Bài chưa đạt điểm A', mdBangMo: 'Bấm một bài để xem từng mục và cách sửa.', mdDu: 'Toàn bộ bài đạt điểm A', mdDuMo: 'Metadata đầy đủ, không có gì phải sửa.'
    },
    en: {
      navChatLuong: 'Stream quality', h1: 'Stream quality',
      mo: 'Unusual signals computed from daily streams, tracks flagged by platforms, and the metadata health of each track. See it early, before streams are removed or money is held.',
      kCb: 'Alerts', kCbS: '{a} critical · {b} warning · {c} watch', kCo: 'Flagged by platforms', kCoS: '{p}/month penalty unless disputed', kGo: 'Streams removed from reports',
      kKn: 'Disputed', kKnS: 'of {n} open alerts', kMd: 'Average metadata score', kMdS: '{a} tracks A · {b} B · {c} C', kChan: 'Held before delivery', kChanS: 'missing ISWC or IPI',
      tabCb: 'Stream alerts', tabMd: 'Metadata health',
      mucAll: 'Any level', mucCritical: 'Critical', mucWarn: 'Warning', mucWatch: 'Watch', ttAll: 'Any status', ttOpen: 'Open', ttDisputed: 'Disputed', ttResolved: 'Cleared',
      tim: 'Search track, ISRC…', khieuNai: 'Dispute',
      khong: 'No alerts match the filters', khongMo: 'Change the filters above.', trong: 'No unusual signals', trongMo: 'Your streams sit within the industry’s normal range (baseline fraud 1–3%).',
      hoiKn: 'Dispute the alert for “{t}”', hoiKnMo: 'Describe the source of the streams (ad campaign, playlist, event) so Haustek can pass it to the platform. Each alert can be disputed once.', hoiKnNote: 'Reason and evidence', gui: 'Send dispute', daKn: 'Dispute recorded',
      mdThieu: 'Most common gaps', mdThieuMo: 'Tracks missing each item; red bars are key identifiers.', mdBang: 'Tracks below grade A', mdBangMo: 'Click a track to see each item and how to fix it.', mdDu: 'Every track scores A', mdDuMo: 'Metadata is complete; nothing to fix.'
    }
  },

  ve: function (root, c) {
    var t = c.t, vi = c.lang === 'vi', P = HB.dayMau(), d;
    try { d = lay(c); } catch (e) { root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) }) + HM.the({ than: '<p class="say">' + HM.esc(e.message) + '</p>' }); return; }
    var q = d.q, md = d.md, k = q.counts;
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kCb'), v: HT.fmt.n(k.alerts), lon: true, s: t('kCbS').replace('{a}', k.critical).replace('{b}', k.warn).replace('{c}', k.watch) },
      { l: t('kCo'), v: HT.fmt.n(k.flagged), s: t('kCoS').replace('{p}', HT.fmt.usd(k.penaltyUsd)), mau: k.flagged ? HB.mau('no') : '' },
      { l: t('kGo'), v: HT.fmt.n(k.removedStreams) },
      { l: t('kKn'), v: HT.fmt.n(k.disputed), s: t('kKnS').replace('{n}', k.open) },
      { l: t('kMd'), v: String(md.counts.avg), s: t('kMdS').replace('{a}', md.counts.A).replace('{b}', md.counts.B).replace('{c}', md.counts.C), mau: md.counts.avg >= 90 ? HB.mau('ok') : md.counts.avg >= 70 ? HB.mau('warn') : HB.mau('no') },
      { l: t('kChan'), v: HT.fmt.n(md.counts.blocking), s: t('kChanS'), mau: md.counts.blocking ? HB.mau('warn') : '' }
    ]);
    html += HM.tabs([{ k: 'cb', l: t('tabCb'), dem: k.alerts }, { k: 'md', l: t('tabMd'), dem: md.counts.tracks - md.counts.A || undefined }], LOC.tab);

    if (LOC.tab === 'cb') {
      var qq = LOC.tim.trim().toLowerCase();
      var rows = q.rows.filter(function (r) {
        if (LOC.muc !== 'all' && r.severity !== LOC.muc) return false;
        if (LOC.tt !== 'all' && r.status !== LOC.tt) return false;
        if (qq && (r.title + ' ' + r.isrc + ' ' + r.artist).toLowerCase().indexOf(qq) < 0) return false;
        return true;
      });
      var pt = HTM.phanTrang(rows, LOC);
      html += '<div class="bar">' +
        [['all', t('mucAll')], ['critical', t('mucCritical')], ['warn', t('mucWarn')], ['watch', t('mucWatch')]].map(function (x) { return '<button type="button" class="pill' + (LOC.muc === x[0] ? ' on' : '') + '" data-muc="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
        '<span class="muted">·</span>' +
        [['all', t('ttAll')], ['open', t('ttOpen')], ['disputed', t('ttDisputed')], ['resolved', t('ttResolved')]].map(function (x) { return '<button type="button" class="pill' + (LOC.tt === x[0] ? ' on' : '') + '" data-tt="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
        '<div class="sp"></div><div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div></div>';
      html += HM.the({
        thoBody: true,
        than: !q.rows.length ? HM.trong({ icon: 'check', tieuDe: t('trong'), moTa: t('trongMo') })
          : !rows.length ? HM.trong({ icon: 'empty', tieuDe: t('khong'), moTa: t('khongMo') })
          : HTM.bangCanhBao(pt.page, { nut: function (r) { return r.status === 'open' && (r.dsp || r.severity !== 'watch') ? '<button type="button" class="btn sm" data-kn="' + r.trackId + '">' + HM.esc(t('khieuNai')) + '</button>' : '<span class="nil">—</span>'; } }) + pt.chan,
        chan: HM.esc(c.song(q, 'note'))
      });
    } else {
      var thieu = md.byCheck.filter(function (x) { return x.missing > 0; });
      var pm = HTM.phanTrang(md.rows, LOC);
      html += '<div class="grid g3">' +
        HM.the({ h2: HM.esc(t('mdThieu')), p: HM.esc(t('mdThieuMo')),
          than: HB.o({ loai: 'thanh', dinhDang: 'so', hang: thieu.map(function (x) { return { ten: c.song(x, 'label'), gt: x.missing, mau: ['iswc', 'ipi', 'splits'].indexOf(x.k) >= 0 ? HB.mau('no') : P[0] }; }) }) }) +
        HM.the({ h2: HM.esc(t('mdBang')), p: HM.esc(t('mdBangMo')), thoBody: true, than: md.rows.length ? HTM.bangMeta(pm.page) + pm.chan : HM.trong({ icon: 'check', tieuDe: t('mdDu'), moTa: t('mdDuMo') }), chan: HM.esc(c.song(md, 'note')) }) +
        '</div>';
    }
    root.innerHTML = html;
    HB.gan(root);
    HTM.ganTrang(root, LOC, c.veLai);
    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-muc]', function (el) { LOC.muc = el.getAttribute('data-muc'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tt]', function (el) { LOC.tt = el.getAttribute('data-tt'); LOC.trang = 0; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); var i = root.querySelector('[data-tim]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
    HM.bam(root, '[data-kn]', function (el, e) {
      e.stopPropagation();
      var id = +el.getAttribute('data-kn'), r = q.rows.filter(function (x) { return x.trackId === id; })[0];
      c.hoiThoai({ tieuDe: t('hoiKn').replace('{t}', r ? r.title : id), moTa: HM.esc(t('hoiKnMo')),
        than: (r ? HTM.tinHieu(r) : '') + '<label class="fld" style="margin-top:12px">' + HM.esc(t('hoiKnNote')) + '</label><textarea class="in" rows="3" data-o="note"></textarea>', dong: t('gui') })
      .then(function (f) {
        if (!f || !f.note) return;
        try { c.api.disputeAlert(c.phien.me.role, c.phien.me.partyId, id, f.note); lamMoi(); c.thongBao(t('daKn'), 'ok'); c.veLai(); }
        catch (err) { c.thongBao(err.message, 'no'); }
      });
    });
    HM.bam(root, 'tr[data-cl], tr[data-md]', function (el, e) {
      if (e.target.closest('button')) return;
      moBai(c, +(el.getAttribute('data-cl') || el.getAttribute('data-md')));
    });
  }
});

})();
