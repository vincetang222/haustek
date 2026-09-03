/* =====================================================================
   NỘI BỘ · NẠP DỮ LIỆU
   ---------------------------------------------------------------------
   Ba luồng doanh thu bản ghi, mỗi luồng một mối, một lịch, một định dạng
   — cộng thêm tác quyền về theo quý và tách hẳn ra. Đường ống này mới là
   chỗ hệ thống sống hay chết; giao diện chỉ là cái nhìn vào nó.

   Thứ màn này phải nói rõ, và không màn nào khác nói thay được:
     · kỳ nào còn thiếu luồng nào — nhìn một cái là thấy, không phải bấm;
     · nạp một luồng thì tiền của luồng đó mới có mặt trong tổng;
     · nạp báo cáo tác quyền vào tháng giữa quý là đặt cả quý tiền vào
       sai kỳ, nên chặn lại chứ không cảnh báo suông.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'luoi';

HT.dangKy({
  id: 'nap-du-lieu', nav: 'navNap', nhom: 'nhomVanHanh', icon: 'down2',

  chu: {
    vi: {
      navNap: 'Nhập báo cáo', h1: 'Nhập báo cáo',
      mo: 'Ba nguồn báo cáo doanh thu bản ghi và một dòng tiền tác quyền theo quý. Kỳ còn thiếu nguồn báo cáo thì chưa thể xét duyệt.',
      tLuoi: 'Bảng kỳ × nguồn', tLuong: 'Theo từng nguồn', tOng: 'Quy trình nhập báo cáo 8 bước', tSu: 'Lịch sử nhập báo cáo',
      nap: 'Nhập báo cáo', napLai: 'Nhập lại báo cáo', go: 'Gỡ báo cáo', daNap: 'đã nhập', thieu: 'chưa nhập',
      kyDuyet: 'đã xét duyệt', tenFile: 'Tên file', khiNao: 'Nhập lúc',
      tacQuyen: 'Tác quyền', quy: 'Quý',
      dongDuoc: 'Kỳ đủ nguồn báo cáo', chuaDu: 'Kỳ còn thiếu nguồn', tongTien: 'Doanh thu đã ghi sổ',
      hoiNap: 'Nhập báo cáo', hoiGo: 'Gỡ báo cáo khỏi kỳ',
      hoiGoMo: 'Gỡ báo cáo là rút toàn bộ doanh thu của nguồn đó khỏi tổng của kỳ. Những dòng đã khớp thủ công từ danh sách chờ khớp vẫn còn, nhưng chưa tính vào tổng cho tới khi nhập lại báo cáo.',
      khongSua: 'Kỳ đã xét duyệt. Muốn nhập lại báo cáo, cần huỷ xét duyệt trước.',
      chonKy: 'Chọn kỳ', chonLuong: 'Chọn nguồn',
      sinhDong: 'dòng mới vào danh sách chờ khớp ISRC',
      khongQuy: 'không phải cuối quý'
    },
    en: {
      navNap: 'Data loading', h1: 'Data loading',
      mo: 'Three recording-revenue feeds plus a quarterly publishing stream. A period missing a feed is a period that cannot be approved.',
      tLuoi: 'Period × feed grid', tLuong: 'Feed by feed', tOng: 'The 8-step pipeline', tSu: 'Load history',
      nap: 'Load', napLai: 'Reload', go: 'Unload', daNap: 'loaded', thieu: 'not loaded',
      kyDuyet: 'approved', tenFile: 'File', khiNao: 'Loaded at',
      tacQuyen: 'Publishing', quy: 'Q',
      dongDuoc: 'Complete periods', chuaDu: 'Incomplete periods', tongTien: 'Revenue booked',
      hoiNap: 'Load a feed', hoiGo: 'Unload a feed',
      hoiGoMo: 'Unloading takes all of that feed’s money back out of the period total. Rows matched by hand from the queue stay, but will not count towards the total until the feed is loaded again.',
      khongSua: 'Period approved — revoke the approval before reloading.',
      chonKy: 'Period', chonLuong: 'Feed',
      sinhDong: 'new rows into the ISRC matching queue',
      khongQuy: 'not a quarter end'
    }
  },

  dem: function (c) {
    var n = 0;
    c.A.periods.forEach(function (p, i) { n += c.A.missingFeeds(i).length; });
    return n ? '!' + n : '';
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, P = HB.dayMau();
    var duLuong = A.periods.filter(function (p, i) { return A.missingFeeds(i).length === 0; }).length;

    var tongDaVao = HM.nho(A, 'tongMoiKy', function () {
      return A.periods.map(function (p, i) { return A.agg('admin', 0, i, 'rec').gross; });
    });

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [
        { l: t('dongDuoc'), v: duLuong + '/' + A.periods.length },
        { l: t('chuaDu'), v: String(A.periods.length - duLuong) },
        { l: t('tongTien'), v: c.tien(tongDaVao.reduce(function (s, v) { return s + v; }, 0)) }
      ]
    });

    html += HM.tabs([
      { k: 'luoi', l: t('tLuoi'), icon: 'grid' },
      { k: 'luong', l: t('tLuong'), icon: 'list' },
      { k: 'ong', l: t('tOng'), icon: 'swap' },
      { k: 'su', l: t('tSu'), icon: 'clock' }
    ], TAB);

    if (TAB === 'luoi') html += veLuoi(c);
    if (TAB === 'luong') html += veLuong(c);
    if (TAB === 'ong') html += veOng(c);
    if (TAB === 'su') html += veSu(c);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-nap]', function (el) {
      var v = el.getAttribute('data-nap').split(':');
      napLuong(c, +v[0], +v[1], el.hasAttribute('data-lai'));
    });
    HM.bam(root, '[data-go]', function (el) {
      var v = el.getAttribute('data-go').split(':');
      goLuong(c, +v[0], +v[1]);
    });
    HM.bam(root, '[data-pub]', function (el) { napPub(c, +el.getAttribute('data-pub')); });
    HM.bam(root, '[data-gopub]', function (el) { goPub(c, +el.getAttribute('data-gopub')); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
  }
});

/* =====================================================================
   TAB 1 — LƯỚI KỲ × LUỒNG
   Mười hai dòng, năm cột. Nhìn một cái là biết kỳ nào hổng chỗ nào — đó
   là toàn bộ lý do màn này tồn tại.
   ===================================================================== */
function veLuoi(c) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var than = '<div class="mx"><table><thead><tr>' +
    '<th>' + (c.lang === 'vi' ? 'Kỳ' : 'Period') + '</th>' +
    A.feeds.map(function (f) { return '<th>' + HM.esc(c.song(f, 'short')) + '</th>'; }).join('') +
    '<th>' + HM.esc(t('tacQuyen')) + '</th>' +
    '<th class="num">' + (c.lang === 'vi' ? 'Doanh thu đã ghi sổ' : 'Booked') + '</th>' +
    '<th>' + (c.lang === 'vi' ? 'Trạng thái kỳ' : 'Period') + '</th>' +
    '</tr></thead><tbody>';

  A.periods.slice().reverse().forEach(function (p) {
    var i = p.idx, duyet = A.isApproved(p.k);
    than += '<tr' + (p.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '>' +
      '<td class="k"><div class="cell">' + HM.esc(p.label) + '</div></td>';
    A.feeds.forEach(function (f) {
      var st = A.state().feeds[p.k][f.id];
      var co = st.status === 'loaded';
      than += '<td>' + (duyet
        ? '<div class="cell">' + HM.cham(co ? 'ok' : 'no', co ? t('daNap') : t('thieu')) + '</div>'
        : '<button type="button" class="cell" ' +
          (co ? 'data-go="' + i + ':' + f.id + '"' : 'data-nap="' + i + ':' + f.id + '"') +
          ' data-tip="' + HM.esc('<b>' + c.song(f, 'name') + '</b>' + (co
            ? '<span class="d">' + HM.esc(st.file) + '<br>' + HT.fmt.luc(st.at) + '<br>Bấm để gỡ báo cáo</span>'
            : '<span class="d">' + HM.esc(c.song(f, 'fmt')) + '<br>Bấm để nhập báo cáo</span>')) + '">' +
          HM.cham(co ? 'ok' : 'no', co ? t('daNap') : t('thieu')) + '</button>') + '</td>';
    });
    var pb = A.state().pub[p.k], coPub = pb && pb.status === 'loaded';
    var cuoiQuy = p.month % 3 === 0;
    than += '<td>' + (duyet
      ? '<div class="cell">' + (coPub ? HM.cham('ok', t('quy') + p.quarter) : '<span class="nil">—</span>') + '</div>'
      : '<button type="button" class="cell" ' +
        (coPub ? 'data-gopub="' + i + '"' : 'data-pub="' + i + '"') +
        ' data-tip="' + HM.esc('<b>' + c.song(A.pubFeed, 'name') + '</b><span class="d">' +
          (coPub ? HM.esc(pb.file) : cuoiQuy ? 'Cuối quý ' + p.quarter + ', có thể nhập báo cáo'
                 : 'Tháng ' + p.month + ' ' + HM.esc(t('khongQuy')) + '. Nhập báo cáo vào đây sẽ đặt doanh thu cả quý vào sai kỳ') +
          '</span>') + '">' +
        (coPub ? HM.cham('ok', t('quy') + p.quarter)
               : cuoiQuy ? HM.cham('warn', t('quy') + p.quarter) : '<span class="nil">—</span>') +
        '</button>') + '</td>';
    than += '<td class="num"><div class="cell" style="justify-content:flex-end">' +
      HM.esc(c.tien(A.agg('admin', 0, i, 'rec').gross)) + '</div></td>' +
      '<td><div class="cell">' + (duyet ? HM.tag(t('kyDuyet'), 'ok')
        : A.canApprove(i) ? HM.tag(c.lang === 'vi' ? 'đủ điều kiện xét duyệt' : 'ready', 'info')
        : HM.tag(c.lang === 'vi' ? 'chưa đủ điều kiện' : 'blocked', 'warn')) + '</div></td></tr>';
  });
  than += '</tbody></table></div>';

  return HM.the({
    h2: HM.esc(t('tLuoi')),
    p: c.lang === 'vi'
      ? 'Bấm một ô của kỳ chưa xét duyệt để nhập hoặc gỡ báo cáo của nguồn đó. Kỳ đã xét duyệt được khoá lại: sửa số liệu của kỳ mà label và nghệ sĩ đã đọc phải là thao tác có chủ ý.'
      : 'Click a cell on an unapproved period to load or unload that feed. Approved periods are locked — changing figures a client has already read must be deliberate.',
    thoBody: true, than: than,
    chan: (c.lang === 'vi'
      ? 'Ô đỏ không có nghĩa là mất tiền. Doanh thu của nguồn đó chưa được tính, nên mọi con số của kỳ đang thiếu đúng phần ấy.'
      : 'A red cell does not mean lost money. It means that feed’s money is not being counted — every figure for the period is short by exactly that much.')
  });
}

/* =====================================================================
   TAB 2 — TỪNG LUỒNG
   ===================================================================== */
function veLuong(c) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var html = '<div class="grid g2">';

  A.feeds.forEach(function (f, fi) {
    var daNap = A.periods.filter(function (p, i) { return A.feedLoaded(i, f.id); }).length;
    var theoKy = HM.nho(A, 'luong:' + f.id, function () {
      return A.periods.map(function (p, i) {
        if (!A.feedLoaded(i, f.id)) return 0;
        var s = 0;
        for (var k = 0; k < A.trackCount; k++) s += A.grossRecByFeed(k, i, f.id);
        return Math.round(s * 100) / 100;
      });
    });
    var st = A.state().feeds[c.kyKey][f.id];
    var co = st.status === 'loaded';
    var duyet = A.isApproved(c.kyKey);
    var treo = A.queue.list({ feedId: f.id, status: 'pending' });

    html += HM.the({
      dai: co ? { kieu: 'ok', icon: 'check', chu: HM.esc(c.ky.label + ' · ' + t('daNap')) }
              : { kieu: 'no', icon: 'alert', chu: HM.esc(c.ky.label + ' · ' + t('thieu')) },
      h2: '<span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:' +
          P[fi] + ';margin-right:8px"></span>' + HM.esc(c.song(f, 'name')),
      p: HM.esc(c.song(f, 'fmt')),
      hanhDong: duyet ? '' : (co
        ? '<button type="button" class="btn sm" data-nap="' + c.ky.idx + ':' + f.id + '" data-lai>' + HM.esc(t('napLai')) + '</button>' +
          '<button type="button" class="btn sm dang" data-go="' + c.ky.idx + ':' + f.id + '">' + HM.esc(t('go')) + '</button>'
        : '<button type="button" class="btn sm pri" data-nap="' + c.ky.idx + ':' + f.id + '">' + HM.esc(t('nap')) + '</button>'),
      than: '<p class="say">' + HM.esc(c.song(f, 'note')) + '</p>' +
        HM.kv([
          { t: c.lang === 'vi' ? 'Kỳ đã nhập' : 'Loaded periods', v: daNap + '/' + A.periods.length },
          { t: t('tenFile') + ' · ' + c.ky.label, v: co ? st.file : '—' },
          { t: t('khiNao'), v: co ? HT.fmt.luc(st.at) : '—' },
          { t: c.lang === 'vi' ? 'Doanh thu kỳ này' : 'This period', v: c.tien(theoKy[c.ky.idx] || 0), manh: true },
          { t: c.lang === 'vi' ? 'Chờ khớp ISRC' : 'On hold in queue',
            v: treo.length ? HT.fmt.n(treo.length) + ' dòng · ' + c.tien(treo.reduce(function (s, q) { return s + q.amount; }, 0)) : '—' }
        ]) +
        '<div style="margin-top:14px">' + HB.o({
          loai: 'cot', cao: 130, anTruc: true, chuThich: false,
          truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
          tieuDeTip: function (i) { return c.song(f, 'short') + ' · ' + (c.lang === 'vi' ? 'kỳ ' : 'period ') + A.periods[i].label; },
          chuTrong: c.lang === 'vi' ? 'Nguồn này chưa nhập báo cáo cho kỳ đó' : 'Feed not loaded for that period',
          chuoi: [{ ten: c.song(f, 'short'), gt: theoKy.map(function (v, i) { return A.feedLoaded(i, f.id) ? v : null; }), mau: P[fi] }],
          noiBat: c.ky.idx
        }) + '</div>'
    });
  });

  /* tác quyền — dòng tiền riêng, đặt riêng */
  var pb = A.state().pub[c.kyKey];
  var coPub = pb && pb.status === 'loaded';
  var kyCoPub = A.periods.filter(function (p, i) { return A.pubLoaded(i); });
  var pubTheoKy = HM.nho(A, 'pubKy', function () {
    return A.periods.map(function (p, i) { return A.pubLoaded(i) ? A.agg('admin', 0, i, 'pub').gross : null; });
  });

  var kyNay = A.periods[c.ky.idx];
  var cuoiQuyNay = kyNay.month % 3 === 0;
  html += HM.the({
    dai: coPub
      ? { kieu: 'ok', icon: 'check', chu: HM.esc(c.ky.label + ' · ' + t('daNap')) }
      : cuoiQuyNay
        ? { kieu: 'warn', icon: 'alert', chu: HM.esc(c.lang === 'vi'
            ? c.ky.label + ' là cuối quý ' + kyNay.quarter + ', còn thiếu báo cáo tác quyền'
            : c.ky.label + ' ends Q' + kyNay.quarter + ' — publishing report missing') }
        : { kieu: 'info', icon: 'info', chu: HM.esc(c.lang === 'vi'
            ? c.ky.label + ' không phải cuối quý, nên không có báo cáo tác quyền là bình thường'
            : c.ky.label + ' is not a quarter end — no publishing report is expected') },
    h2: HM.esc(c.song(A.pubFeed, 'name')),
    p: HM.esc(c.song(A.pubFeed, 'fmt')),
    hanhDong: A.isApproved(c.kyKey) ? '' : (coPub
      ? '<button type="button" class="btn sm dang" data-gopub="' + c.ky.idx + '">' + HM.esc(t('go')) + '</button>'
      : '<button type="button" class="btn sm' + (cuoiQuyNay ? ' pri' : '') + '" data-pub="' + c.ky.idx + '">' +
        HM.esc(t('nap')) + '</button>'),
    than: '<p class="say">' + HM.esc(c.song(A.pubFeed, 'note')) + ' ' +
      (c.lang === 'vi'
        ? '<b>Tác quyền là dòng tiền riêng</b>: thuộc về người sáng tác, không đi qua label, và không tính vào điều kiện “đủ 3 nguồn báo cáo” của kỳ.'
        : '<b>Publishing is a separate money stream</b>: it belongs to the writers, never passes through a label, and does not count towards the period’s “all three feeds” condition.') + '</p>' +
      HM.kv([
        { t: c.lang === 'vi' ? 'Kỳ có báo cáo' : 'Periods with a report',
          v: kyCoPub.length + '/' + A.periods.length + ' · ' + kyCoPub.map(function (p) { return p.label; }).join(', ') },
        { t: t('tenFile'), v: coPub ? pb.file : '—' },
        { t: c.lang === 'vi' ? 'Tác quyền kỳ này' : 'This period',
          v: coPub ? c.tien(A.agg('admin', 0, c.ky.idx, 'pub').gross) : '—', manh: true }
      ]) +
      '<div style="margin-top:14px">' + HB.o({
        loai: 'cot', cao: 130, anTruc: true, chuThich: false,
        truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
        tieuDeTip: function (i) { return 'Tác quyền · kỳ ' + A.periods[i].label; },
        chuTrong: c.lang === 'vi' ? 'Quý này chưa có báo cáo tác quyền' : 'No CMO report for this quarter',
        chuoi: [{ ten: 'Tác quyền', gt: pubTheoKy, mau: HB.dayMau()[3] }],
        noiBat: c.ky.idx
      }) + '</div>'
  });

  return html + '</div>';
}

/* =====================================================================
   TAB 3 — ĐƯỜNG ỐNG 8 BƯỚC
   ===================================================================== */
function veOng(c) {
  var A = c.A, t = c.t;
  return HM.the({
    h2: HM.esc(t('tOng')),
    p: c.lang === 'vi'
      ? 'Mỗi lần bấm “Nhập báo cáo” ở bản mẫu là mô phỏng tám bước này. Trong hệ thống thật, tám bước này là phần khó và tốn công nhất của dự án, không phải giao diện.'
      : 'Each “Load” in this prototype simulates these eight steps. In the real system they are the hardest and most expensive part of the project — not the interface.',
    than: '<div class="steps">' + A.ingest.steps.map(function (s, i) {
      return '<div class="s ' + (i === 2 ? 'now' : 'ok') + '">' +
        '<b>' + (i + 1) + '. ' + HM.esc(c.song(s, 't')) + '</b><span>' + HM.esc(c.song(s, 'd')) + '</span>' +
        (i === 2 ? '<div class="tm">' + HM.esc(c.lang === 'vi'
          ? 'Dòng không khớp được đưa vào danh sách chờ khớp, xem trang Khớp ISRC'
          : 'Unmatched rows go to the queue — see ISRC matching') + '</div>' : '') + '</div>';
    }).join('') + '</div>',
    chan: '<button type="button" class="btn sm" data-di="khop-isrc">' + HM.icon('out') +
      (c.lang === 'vi' ? 'Mở danh sách chờ khớp ISRC' : 'Open the matching queue') + '</button>'
  }) + HM.the({
    h2: c.lang === 'vi' ? 'Vì sao khâu khớp ISRC là nơi dễ thất thoát tiền nhất' : 'Why ISRC matching is where money goes missing',
    than: '<p class="say">' + (c.lang === 'vi'
      ? 'Một dòng doanh thu về mà không khớp được bản ghi nào thì chưa thuộc về ai. Nếu hệ thống không báo, khoản tiền đó nằm lại trong tài khoản Haustek và không ai biết. Riêng The MLC ở Mỹ đang giữ hơn 424 triệu USD chưa xác định được người thụ hưởng, không phải vì gian lận mà vì không khớp được.'
      : 'A revenue line that matches no recording belongs to nobody. If the system stays quiet, that money sits in Haustek’s account and nobody knows. The MLC in the US alone holds over $424m of unmatched royalties — not through dishonesty, but because nothing matched.') + '</p>' +
      '<p class="say">' + (c.lang === 'vi'
      ? 'Vì vậy quy trình ở đây <b>không được phép tự khớp</b>. Hệ thống chấm điểm gợi ý, xếp hạng, rồi dừng lại chờ người quyết định. Ngưỡng <code>' +
        HT.fmt.pct(A.cfg.BLACKBOX_CAP, 1) + '</code> doanh thu kỳ chặn hẳn nút xét duyệt: tiền chưa khớp vượt ngưỡng thì không thể xét duyệt kỳ.'
      : 'So the pipeline here <b>never auto-matches</b>. It scores suggestions, ranks them, then stops and waits for a person. And the <code>' +
        HT.fmt.pct(A.cfg.BLACKBOX_CAP, 1) + '</code> threshold blocks the approve button outright: too much on hold, no period close.') + '</p>'
  });
}

/* =====================================================================
   TAB 4 — LỊCH SỬ NẠP
   ===================================================================== */
function veSu(c) {
  var A = c.A;
  var ds = A.audit.list(400).filter(function (a) { return a.action.indexOf('ingest') === 0; });
  if (!ds.length) return HM.the({ than: HM.trong({ tieuDe: c.lang === 'vi' ? 'Chưa có lần nhập báo cáo nào' : 'No loads yet', moTa: '' }) });
  return HM.the({
    h2: c.lang === 'vi' ? 'Lịch sử nhập báo cáo' : 'Load history',
    p: HT.fmt.n(ds.length) + (c.lang === 'vi' ? ' lần nhập báo cáo trong nhật ký thao tác' : ' recorded loads'),
    thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th style="width:150px">' + (c.lang === 'vi' ? 'Thời điểm' : 'When') + '</th>' +
      '<th style="width:120px">' + (c.lang === 'vi' ? 'Thao tác' : 'Action') + '</th>' +
      '<th>' + (c.lang === 'vi' ? 'Chi tiết' : 'Detail') + '</th>' +
      '<th style="width:200px">' + (c.lang === 'vi' ? 'Người thực hiện' : 'By') + '</th></tr></thead><tbody>' +
      ds.slice(0, 120).map(function (a) {
        return '<tr><td class="num mono">' + HM.esc(HT.fmt.luc(a.at)) + '</td>' +
          '<td>' + HM.tag(a.action.replace('ingest.', ''), a.action === 'ingest.unload' ? 'no' : 'info') + '</td>' +
          '<td>' + HM.esc(a.detail) + '</td>' +
          '<td class="mono">' + HM.esc(a.by) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
  });
}

/* =====================================================================
   HÀNH ĐỘNG
   ===================================================================== */
function napLuong(c, pi, fid, lai) {
  var A = c.A, f = A.feeds[fid], p = A.periods[pi];
  c.hoiThoai({
    tieuDe: c.t('hoiNap') + ' · ' + c.song(f, 'name'),
    moTa: HM.esc(p.label) + ' · ' + HM.esc(c.song(f, 'fmt')),
    than: '<label class="fld">' + (c.lang === 'vi' ? 'Tên file báo cáo' : 'Report file name') + '</label>' +
      '<input class="in" data-o="file" value="' + HM.esc(f.id === 0 ? 'sales-report-' + p.k.replace('-', '') + '.csv'
        : f.id === 1 ? 'yt-' + p.k.replace('-', '') + '-partner.csv.gz' : 'tiktok-' + p.k.replace('-', '') + '.xlsx') + '">' +
      '<div class="hint">' + (c.lang === 'vi'
        ? 'Bản mẫu không đọc file thật. Thao tác này đánh dấu nguồn là “đã nhập”, đưa doanh thu của nguồn vào tổng của kỳ, và đưa một vài dòng không khớp được vào danh sách chờ khớp, giống như một lần nhập báo cáo thật.'
        : 'The prototype does not read a real file. It flags the feed as loaded, brings its money into the period total, and drops a few unmatchable rows into the queue — exactly as a real load would.') + '</div>',
    dong: c.t('nap')
  }).then(function (r) {
    if (!r) return;
    try {
      var kq = A.ingest.load(pi, fid, { file: r.file, replace: !!lai });
      c.thongBao(c.song(f, 'short') + ' · ' + p.label + (c.lang === 'vi' ? ': đã nhập · ' : ' — loaded · ') +
        kq.added + ' ' + c.t('sinhDong'), 'ok');
      HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

function goLuong(c, pi, fid) {
  var A = c.A, f = A.feeds[fid], p = A.periods[pi];
  var mat = 0;
  for (var k = 0; k < A.trackCount; k++) mat += A.grossRecByFeed(k, pi, fid);
  c.xacNhan(c.t('hoiGo') + ' · ' + c.song(f, 'short') + ' · ' + p.label,
    HM.esc(c.t('hoiGoMo')) + '<br><br>' +
    (c.lang === 'vi' ? 'Tổng của kỳ sẽ giảm ' : 'The period total will drop by ') +
    '<b>' + HM.esc(c.tien2(mat)) + '</b>.',
    c.t('go'), true).then(function (ok) {
      if (!ok) return;
      try { A.ingest.unload(pi, fid); c.thongBao(c.song(f, 'short') + ' · ' + p.label + (c.lang === 'vi' ? ': đã gỡ' : ' — unloaded')); HM.quenHet(); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
}

function napPub(c, pi) {
  var A = c.A, p = A.periods[pi];
  var cuoiQuy = p.month % 3 === 0;
  c.hoiThoai({
    tieuDe: (c.lang === 'vi' ? 'Nhập báo cáo tác quyền · ' : 'Load publishing report · ') + p.label,
    moTa: cuoiQuy
      ? HM.esc(c.lang === 'vi' ? 'Cuối quý ' + p.quarter + '/' + p.year + ', đúng kỳ chốt tác quyền.'
                               : 'End of Q' + p.quarter + ' ' + p.year + ' — the correct publishing period.')
      : '<span class="neg">' + HM.esc(c.lang === 'vi'
        ? 'Tháng ' + p.month + ' không phải cuối quý. Tác quyền chốt theo quý: nhập báo cáo quý vào đây sẽ đặt doanh thu cả quý vào sai kỳ, và không ai phát hiện vì con số vẫn hiển thị trên hệ thống.'
        : 'Month ' + p.month + ' is not a quarter end. Publishing settles quarterly — loading a quarterly report here puts a whole quarter of money in the wrong period, and nobody notices because the figure still "exists".') + '</span>',
    than: '<label class="fld">' + (c.lang === 'vi' ? 'Tên file' : 'File name') + '</label>' +
      '<input class="in" data-o="file" value="vcpmc-quy' + p.quarter + '-' + p.year + '.xlsx">' +
      (cuoiQuy ? '' : '<label class="opt" style="margin-top:12px"><input type="checkbox" data-buoc>' +
        '<div><b>' + (c.lang === 'vi' ? 'Vẫn nhập báo cáo vào kỳ này' : 'Load into this period anyway') + '</b>' +
        '<span>' + (c.lang === 'vi' ? 'Chỉ chọn khi chắc chắn báo cáo này thuộc tháng ' + p.month + '.'
                                    : 'Only if this report genuinely belongs to month ' + p.month + '.') + '</span></div></label>'),
    dong: c.t('nap'),
    khiMo: function (bg) {
      var nut = bg.querySelector('[data-act=ok]'), cb = bg.querySelector('[data-buoc]');
      if (!cuoiQuy && cb) { nut.disabled = true; cb.addEventListener('change', function () { nut.disabled = !cb.checked; }); }
    }
  }).then(function (r) {
    if (!r) return;
    try {
      A.ingest.loadPub(pi, { file: r.file, force: !cuoiQuy });
      c.thongBao((c.lang === 'vi' ? 'Đã nhập báo cáo tác quyền quý ' : 'Publishing loaded, Q') + p.quarter + '/' + p.year, 'ok');
      HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

function goPub(c, pi) {
  var A = c.A, p = A.periods[pi];
  c.xacNhan((c.lang === 'vi' ? 'Gỡ báo cáo tác quyền · ' : 'Unload publishing · ') + p.label,
    c.lang === 'vi' ? 'Toàn bộ tiền tác quyền của kỳ này sẽ được rút khỏi tổng.' : 'All publishing money for this period leaves the total.',
    c.t('go'), true).then(function (ok) {
      if (!ok) return;
      try { A.ingest.unloadPub(pi); c.thongBao(c.lang === 'vi' ? 'Đã gỡ báo cáo tác quyền' : 'Unloaded'); HM.quenHet(); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
}

})();
