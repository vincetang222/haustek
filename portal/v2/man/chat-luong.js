/* =====================================================================
   NỘI BỘ · CHẤT LƯỢNG LƯỢT NGHE & METADATA (bàn chống gian lận)
   ---------------------------------------------------------------------
   Vận hành nhìn theo TÀI KHOẢN trước, theo bài sau: vụ Michael Smith
   (2024) tách 660.000 lượt/ngày thành nhiều bài nhỏ để lách ngưỡng từng
   bài, nên gom theo tài khoản mới thấy. Mỗi cảnh báo có bằng chứng (năm
   tín hiệu), diễn biến, và hai thao tác: xác nhận gian lận hoặc gỡ cảnh
   báo, đều ghi nhật ký. Sổ phạt: bài bị nền tảng gắn cờ × mức phạt/tháng.
   Tab thứ ba là sức khoẻ metadata toàn danh mục: thiếu ISWC / IPI thì
   giữ lại trước khi giao.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'tk', muc: 'all', tt: 'open', pk: null, tim: '', trang: 0 };

HT.dangKy({
  id: 'chat-luong', nav: 'navChatLuong', nhom: 'nhomVanHanh', icon: 'alert',
  vai: ['ops', 'sales', 'support', 'mgmt', 'accounting'],
  dem: function (c) { try { return c.A.quality().counts.flagged || null; } catch (e) { return null; } },

  chu: {
    vi: {
      navChatLuong: 'Chất lượng lượt nghe', h1: 'Chất lượng lượt nghe',
      mo: 'Cảnh báo lượt nghe bất thường gom theo tài khoản, sổ phạt của nền tảng và sức khoẻ metadata toàn danh mục. Mỗi cảnh báo có bằng chứng và hai thao tác ghi nhật ký.',
      kCb: 'Cảnh báo', kCbS: '{a} nghiêm trọng · {b} cảnh báo · {c} theo dõi · {n} bài đã quét', kCo: 'Bài bị nền tảng gắn cờ', kCoS: 'phạt {p}/tháng đang treo', kGo: 'Lượt nghe bị gỡ', kTk: 'Tài khoản nhiều bài tăng đồng loạt', kTkS: 'kiểu tách nhỏ để lách ngưỡng', kMo: 'Đang mở', kMoS: '{n} đang khiếu nại', kMd: 'Điểm metadata trung bình', kMdS: '{n} bản ghi thiếu mã quan trọng',
      tabTk: 'Theo tài khoản', tabCb: 'Cảnh báo', tabMd: 'Sức khoẻ metadata',
      cTk: 'Tài khoản', cMau: 'Kiểu', cAlerts: 'Cảnh báo', cNt: 'Nghiêm trọng', cCo: 'Bị gắn cờ', cPhat: 'Phạt / tháng', cGo: 'Lượt bị gỡ', cMo: 'Đang mở',
      mucAll: 'Mọi mức', mucCritical: 'Nghiêm trọng', mucWarn: 'Cảnh báo', mucWatch: 'Theo dõi', ttAll: 'Mọi trạng thái', ttOpen: 'Đang mở', ttDisputed: 'Đang khiếu nại', ttConfirmed: 'Đã xác nhận', ttResolved: 'Đã gỡ',
      tim: 'Tìm bài, ISRC, tài khoản…', dangLoc: 'Đang xem tài khoản', boLoc: 'Bỏ lọc',
      xacNhan: 'Xác nhận gian lận', go: 'Gỡ cảnh báo', hoiXn: 'Xác nhận gian lận cho “{t}”?', hoiXnMo: 'Bài bị giữ lượt nghe trong kỳ đang mở và đưa vào sổ phạt; đối tác thấy trạng thái này ở cổng của họ.', hoiGo: 'Gỡ cảnh báo cho “{t}”', hoiGoMo: 'Ghi lý do (chiến dịch hợp lệ, playlist biên tập, sự kiện) để lần sau không hỏi lại.', ghiChu: 'Ghi chú', daXn: 'Đã xác nhận gian lận', daGo: 'Đã gỡ cảnh báo',
      khong: 'Không có cảnh báo nào khớp bộ lọc', khongMo: 'Đổi bộ lọc phía trên.', khongTk: 'Không có tài khoản nào có cảnh báo',
      mdThieu: 'Mục còn thiếu nhiều nhất', mdThieuMo: 'Số bản ghi thiếu từng mục toàn danh mục (đã nhân theo mẫu).', mdBang: 'Bản ghi bị giữ lại hoặc dưới điểm A', mdBangMo: 'Bấm một bản ghi để xem từng mục và cách sửa.'
    },
    en: {
      navChatLuong: 'Stream quality', h1: 'Stream quality',
      mo: 'Unusual-stream alerts grouped by account, the platform penalty ledger and catalogue-wide metadata health. Every alert carries evidence and two logged actions.',
      kCb: 'Alerts', kCbS: '{a} critical · {b} warning · {c} watch · {n} tracks scanned', kCo: 'Flagged by platforms', kCoS: '{p}/month penalty exposure', kGo: 'Streams removed', kTk: 'Accounts with many small lifts', kTkS: 'spreading streams thin to dodge thresholds', kMo: 'Open', kMoS: '{n} disputed', kMd: 'Average metadata score', kMdS: '{n} recordings missing key identifiers',
      tabTk: 'By account', tabCb: 'Alerts', tabMd: 'Metadata health',
      cTk: 'Account', cMau: 'Pattern', cAlerts: 'Alerts', cNt: 'Critical', cCo: 'Flagged', cPhat: 'Penalty / month', cGo: 'Removed', cMo: 'Open',
      mucAll: 'Any level', mucCritical: 'Critical', mucWarn: 'Warning', mucWatch: 'Watch', ttAll: 'Any status', ttOpen: 'Open', ttDisputed: 'Disputed', ttConfirmed: 'Confirmed', ttResolved: 'Cleared',
      tim: 'Search track, ISRC, account…', dangLoc: 'Showing account', boLoc: 'Clear',
      xacNhan: 'Confirm fraud', go: 'Clear alert', hoiXn: 'Confirm fraud on “{t}”?', hoiXnMo: 'Streams are held in the open period and the track enters the penalty ledger; the partner sees this status in their portal.', hoiGo: 'Clear the alert on “{t}”', hoiGoMo: 'Note the reason (legitimate campaign, editorial playlist, event) so it is not asked again.', ghiChu: 'Note', daXn: 'Fraud confirmed', daGo: 'Alert cleared',
      khong: 'No alerts match the filters', khongMo: 'Change the filters above.', khongTk: 'No accounts with alerts',
      mdThieu: 'Most common gaps', mdThieuMo: 'Recordings missing each item across the catalogue (scaled from the sample).', mdBang: 'Recordings held or below grade A', mdBangMo: 'Click a recording to see each item and how to fix it.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, P = HB.dayMau();
    var q = HM.nho(A, 'chat-luong:q', function () { return A.quality(); });
    var md = HM.nho(A, 'chat-luong:md', function () { return A.metadataReport(); });
    var k = q.counts, lifts = q.cases.filter(function (x) { return x.pattern === 'many-small-lifts'; }).length;
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kCb'), v: HT.fmt.n(k.alerts), lon: true, s: t('kCbS').replace('{a}', k.critical).replace('{b}', k.warn).replace('{c}', k.watch).replace('{n}', HT.fmt.n(k.tracksChecked)) },
      { l: t('kCo'), v: HT.fmt.n(k.flagged), s: t('kCoS').replace('{p}', c.tien2(k.penaltyUsd)), mau: k.flagged ? HB.mau('no') : '' },
      { l: t('kGo'), v: HT.fmt.n(k.removedStreams) },
      { l: t('kTk'), v: HT.fmt.n(lifts), s: t('kTkS'), mau: lifts ? HB.mau('warn') : '' },
      { l: t('kMo'), v: HT.fmt.n(k.open), s: t('kMoS').replace('{n}', k.disputed) },
      { l: t('kMd'), v: String(md.counts.avg), s: t('kMdS').replace('{n}', HT.fmt.n(md.counts.blocking)), mau: md.counts.avg >= 90 ? HB.mau('ok') : HB.mau('warn') }
    ]);
    html += HM.tabs([{ k: 'tk', l: t('tabTk'), dem: q.cases.length }, { k: 'cb', l: t('tabCb'), dem: k.alerts }, { k: 'md', l: t('tabMd'), dem: md.counts.blocking || undefined }], LOC.tab);

    if (LOC.tab === 'tk') {
      html += HM.the({ thoBody: true,
        than: !q.cases.length ? HM.trong({ icon: 'check', tieuDe: t('khongTk'), moTa: '' }) :
          '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cTk')) + '</th><th>' + HM.esc(t('cMau')) + '</th><th class="num">' + HM.esc(t('cAlerts')) + '</th><th class="num">' + HM.esc(t('cNt')) + '</th><th class="num">' + HM.esc(t('cCo')) + '</th><th class="num">' + HM.esc(t('cPhat')) + '</th><th class="num">' + HM.esc(t('cGo')) + '</th><th class="num">' + HM.esc(t('cMo')) + '</th></tr></thead><tbody>' +
          q.cases.map(function (x) {
            return '<tr class="pick" data-pk="' + HM.esc(x.partyKey) + '"><td>' + HM.tenBia({ ten: x.name, seed: x.clientId, phu: x.clientId + ' · ' + x.partyKey }) + '</td>' +
              '<td>' + HM.tag(c.song(x, 'patternLabel'), x.pattern === 'many-small-lifts' ? 'warn' : x.pattern === 'dsp-flag' ? 'no' : x.pattern === 'critical' ? 'no' : '') + '</td>' +
              '<td class="num"><b>' + HT.fmt.n(x.alerts) + '</b></td><td class="num">' + (x.critical ? '<span class="neg">' + x.critical + '</span>' : '<span class="nil">—</span>') + '</td>' +
              '<td class="num">' + (x.flagged ? '<span class="neg">' + x.flagged + '</span>' : '<span class="nil">—</span>') + '</td><td class="num band">' + (x.penaltyUsd ? '<b>' + HM.esc(c.tien2(x.penaltyUsd)) + '</b>' : '<span class="nil">—</span>') + '</td>' +
              '<td class="num">' + HT.fmt.n(x.removedStreams) + '</td><td class="num">' + HT.fmt.n(x.open) + '</td></tr>';
          }).join('') + '</tbody></table></div>',
        chan: HM.esc(c.song(q, 'note')) });
    } else if (LOC.tab === 'cb') {
      var qq = LOC.tim.trim().toLowerCase();
      var rows = q.rows.filter(function (r) {
        if (LOC.pk && r.partyKey !== LOC.pk) return false;
        if (LOC.muc !== 'all' && r.severity !== LOC.muc) return false;
        if (LOC.tt !== 'all' && r.status !== LOC.tt) return false;
        if (qq && (r.title + ' ' + r.isrc + ' ' + r.artist + ' ' + A.partyName(r.partyKey)).toLowerCase().indexOf(qq) < 0) return false;
        return true;
      });
      var pt = HTM.phanTrang(rows, LOC);
      html += '<div class="bar">' +
        (LOC.pk ? '<span class="chip on">' + HM.esc(t('dangLoc') + ': ' + A.partyName(LOC.pk)) + ' <button type="button" data-bo-pk title="' + HM.esc(t('boLoc')) + '">' + HM.icon('x') + '</button></span>' : '') +
        [['all', t('mucAll')], ['critical', t('mucCritical')], ['warn', t('mucWarn')], ['watch', t('mucWatch')]].map(function (x) { return '<button type="button" class="pill' + (LOC.muc === x[0] ? ' on' : '') + '" data-muc="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
        '<span class="muted">·</span>' +
        [['all', t('ttAll')], ['open', t('ttOpen')], ['disputed', t('ttDisputed')], ['confirmed', t('ttConfirmed')], ['resolved', t('ttResolved')]].map(function (x) { return '<button type="button" class="pill' + (LOC.tt === x[0] ? ' on' : '') + '" data-tt="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
        '<div class="sp"></div><div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div></div>';
      html += HM.the({ thoBody: true,
        than: !rows.length ? HM.trong({ icon: 'empty', tieuDe: t('khong'), moTa: t('khongMo') })
          : HTM.bangCanhBao(pt.page, { noiBo: true, tenTk: function (pk) { return A.partyName(pk); },
              nut: function (r) { return r.status === 'open' || r.status === 'disputed' ? '<div class="btnrow" style="flex-wrap:nowrap"><button type="button" class="btn sm dang" data-xn="' + r.trackId + '">' + HM.esc(t('xacNhan')) + '</button><button type="button" class="btn sm" data-go="' + r.trackId + '">' + HM.esc(t('go')) + '</button></div>' : '<span class="nil">—</span>'; } }) + pt.chan,
        chan: HM.esc(c.song(q, 'note')) });
    } else {
      var thieu = md.byCheck.filter(function (x) { return x.missing > 0; });
      var pm = HTM.phanTrang(md.rows, LOC);
      html += '<div class="grid g3">' +
        HM.the({ h2: HM.esc(t('mdThieu')), p: HM.esc(t('mdThieuMo')),
          than: HB.o({ loai: 'thanh', dinhDang: 'so', hang: thieu.map(function (x) { return { ten: c.song(x, 'label'), gt: x.missing, mau: ['iswc', 'ipi', 'splits'].indexOf(x.k) >= 0 ? HB.mau('no') : P[0] }; }) }) }) +
        HM.the({ h2: HM.esc(t('mdBang')), p: HM.esc(t('mdBangMo')), thoBody: true, than: HTM.bangMeta(pm.page, { noiBo: true, tenTk: function (pk) { return A.partyName(pk); } }) + pm.chan, chan: HM.esc(c.song(md, 'note')) }) +
        '</div>';
    }
    root.innerHTML = html;
    HB.gan(root);
    HTM.ganTrang(root, LOC, c.veLai);
    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-muc]', function (el) { LOC.muc = el.getAttribute('data-muc'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tt]', function (el) { LOC.tt = el.getAttribute('data-tt'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-bo-pk]', function () { LOC.pk = null; LOC.trang = 0; c.veLai(); });
    HM.bam(root, 'tr[data-pk]', function (el) { LOC.pk = el.getAttribute('data-pk'); LOC.tab = 'cb'; LOC.tt = 'all'; LOC.trang = 0; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); var i = root.querySelector('[data-tim]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
    function hanhDong(id, status, tieuDe, moTa, xong) {
      var r = q.rows.filter(function (x) { return x.trackId === id; })[0];
      c.hoiThoai({ tieuDe: tieuDe.replace('{t}', r ? r.title : id), moTa: HM.esc(moTa),
        than: (r ? HTM.tinHieu(r) : '') + '<label class="fld" style="margin-top:12px">' + HM.esc(t('ghiChu')) + '</label><textarea class="in" rows="3" data-o="note"></textarea>', dong: status === 'confirmed' ? t('xacNhan') : t('go') })
      .then(function (f) {
        if (!f) return;
        try { A.setAlertStatus(id, status, f.note, A.staff.me.name); c.thongBao(xong, 'ok'); c.veLai(); }
        catch (err) { c.thongBao(err.message, 'no'); }
      });
    }
    HM.bam(root, '[data-xn]', function (el, e) { e.stopPropagation(); hanhDong(+el.getAttribute('data-xn'), 'confirmed', t('hoiXn'), t('hoiXnMo'), t('daXn')); });
    HM.bam(root, '[data-go]', function (el, e) { e.stopPropagation(); hanhDong(+el.getAttribute('data-go'), 'resolved', t('hoiGo'), t('hoiGoMo'), t('daGo')); });
    HM.bam(root, 'tr[data-cl], tr[data-md]', function (el, e) {
      if (e.target.closest('button')) return;
      var id = +(el.getAttribute('data-cl') || el.getAttribute('data-md')), a;
      try { a = A.asset(id); } catch (err) { return; }
      HTS.moNgan(c, a, { noiBo: true, tien: c.tien2, tien0: c.tien, playlists: A.playlistsOf(id), tabDau: 'cl' });
    });
  }
});

})();
