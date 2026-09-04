/* =====================================================================
   CỔNG ĐỐI TÁC · HỖ TRỢ
   ---------------------------------------------------------------------
   Một chỗ để hỏi Haustek và thấy câu hỏi đó đi tới đâu: yêu cầu đã gửi,
   ai đang phụ trách, hạn xử lý là bao giờ, Haustek đã trả lời gì. Thêm
   phần khiếu nại bản quyền mà Haustek đang xử lý thay đối tác trên các
   nền tảng, vì đó cũng là "việc Haustek đang làm cho tôi".

   Hộp thoại tạo yêu cầu được xuất ra HT.moTicket(c, mặc định) để trang
   Bài hát và Danh mục gọi từ nút "Yêu cầu hỗ trợ marketing" / "Gửi yêu
   cầu hỗ trợ" trong hồ sơ bài hát.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'mo' };
var KIEU_TT = { open: 'info', in_progress: 'link', waiting: 'warn', done: 'ok' };
var CHU_TT = { open: 'ttOpen', in_progress: 'ttDoing', waiting: 'ttWaiting', done: 'ttDone' };
var KIEU_UT = { low: '', normal: '', high: 'warn', urgent: 'no' };
var CHU_UT = { low: 'utLow', normal: 'utNormal', high: 'utHigh', urgent: 'utUrgent' };

HT.dangKy({
  id: 'k-ho-tro', nav: 'navHoTro', nhom: 'nhomHoTro', icon: 'info',

  chu: {
    vi: {
      navHoTro: 'Hỗ trợ', h1: 'Hỗ trợ',
      mo: 'Yêu cầu bạn đã gửi cho Haustek, ai đang phụ trách và đã xử lý tới đâu. Khiếu nại bản quyền Haustek đang xử lý thay bạn cũng ở đây.',
      kMo: 'Yêu cầu đang mở', kXong: 'Đã xong', kKn: 'Khiếu nại bản quyền đang xử lý', kHan: 'Hạn xử lý gần nhất',
      choNt: 'chờ nền tảng phản hồi', tongKn: 'tổng số khiếu nại đã ghi nhận', khongHan: 'không có yêu cầu nào đang mở',
      tabMo: 'Đang mở', tabXong: 'Đã xong', guiMoi: 'Gửi yêu cầu mới',
      cMa: 'Mã', cLoai: 'Loại', cTieuDe: 'Tiêu đề', cBai: 'Bài hát', cTt: 'Trạng thái', cPhuTrach: 'Người phụ trách', cHan: 'Hạn xử lý', cCapNhat: 'Cập nhật',
      ttOpen: 'Đã gửi', ttDoing: 'Đang xử lý', ttWaiting: 'Chờ nền tảng phản hồi', ttDone: 'Đã xong',
      utLow: 'Thấp', utNormal: 'Bình thường', utHigh: 'Cao', utUrgent: 'Khẩn',
      quaHan: 'quá hạn', chuaGiao: 'Chưa phân công',
      trongMo: 'Bạn không có yêu cầu nào đang mở', trongMoMo: 'Khi cần Haustek hỗ trợ về phát hành, nền tảng, thanh toán hay marketing, bạn bấm "Gửi yêu cầu mới".',
      trongXong: 'Chưa có yêu cầu nào đã xong', trongXongMo: 'Yêu cầu đã xử lý xong sẽ được lưu ở đây để bạn xem lại.',
      theoLoai: 'Yêu cầu theo loại', theoLoaiMo: 'Tính trên toàn bộ yêu cầu bạn đã gửi.',
      theoTt: 'Theo trạng thái',
      knTieuDe: 'Khiếu nại bản quyền đang xử lý',
      knMo: 'Haustek theo dõi Content ID và khiếu nại trên các nền tảng; mỗi dòng dưới đây là một việc Haustek đang xử lý thay bạn. Bạn không cần làm gì thêm trừ khi Haustek hỏi.',
      knTrong: 'Không có khiếu nại bản quyền nào đang xử lý trên bài hát của bạn.',
      knDaXong: 'khiếu nại đã giải quyết hoặc đã nhả claim',
      /* ngăn chi tiết */
      luong: 'Trao đổi', traLoi: 'Trả lời Haustek', guiTra: 'Gửi phản hồi', daGuiTra: 'Đã gửi phản hồi',
      ban: 'Bạn', haustek: 'Haustek', taoLuc: 'Gửi lúc', xongLuc: 'Xong lúc', uuTien: 'Mức ưu tiên',
      daXongGhi: 'Yêu cầu này đã xong. Nếu vẫn còn vướng, bạn trả lời ngay dưới đây và yêu cầu sẽ được mở lại.',
      /* hộp thoại tạo yêu cầu */
      hoiTieuDe: 'Gửi yêu cầu hỗ trợ', hoiMo: 'Haustek tiếp nhận trong giờ làm việc. Hạn xử lý tính theo mức ưu tiên: bình thường 3 ngày, cao 2 ngày.',
      hoiLoai: 'Loại yêu cầu', hoiTd: 'Tiêu đề', hoiNd: 'Nội dung', hoiBai: 'Bài hát liên quan (tuỳ chọn)', hoiTimBai: 'Gõ tên bài hát hoặc mã ISRC…',
      hoiUt: 'Mức ưu tiên', hoiGui: 'Gửi yêu cầu', daGui: 'Đã gửi yêu cầu', hanXuLy: 'hạn xử lý',
      khongBai: 'Không tìm thấy bài hát', boChon: 'Bỏ chọn',
      mkTd: 'Yêu cầu hỗ trợ marketing cho bài hát {t}', ntTd: 'Hỗ trợ về bài hát {t} trên nền tảng'
    },
    en: {
      navHoTro: 'Support', h1: 'Support',
      mo: 'Requests you have sent Haustek, who is handling each one and how far it has got. Rights claims Haustek is handling for you are here too.',
      kMo: 'Open requests', kXong: 'Done', kKn: 'Rights claims in progress', kHan: 'Nearest due date',
      choNt: 'waiting on a platform', tongKn: 'claims logged in total', khongHan: 'no open request',
      tabMo: 'Open', tabXong: 'Done', guiMoi: 'New request',
      cMa: 'ID', cLoai: 'Type', cTieuDe: 'Title', cBai: 'Track', cTt: 'Status', cPhuTrach: 'Handled by', cHan: 'Due', cCapNhat: 'Updated',
      ttOpen: 'Sent', ttDoing: 'In progress', ttWaiting: 'Waiting on the platform', ttDone: 'Done',
      utLow: 'Low', utNormal: 'Normal', utHigh: 'High', utUrgent: 'Urgent',
      quaHan: 'overdue', chuaGiao: 'Not assigned yet',
      trongMo: 'You have no open request', trongMoMo: 'When you need help with a release, a platform, a payment or marketing, use “New request”.',
      trongXong: 'No request has been closed yet', trongXongMo: 'Closed requests are kept here for reference.',
      theoLoai: 'Requests by type', theoLoaiMo: 'Across every request you have sent.',
      theoTt: 'By status',
      knTieuDe: 'Rights claims in progress',
      knMo: 'Haustek watches Content ID and claims on the platforms; each row is something Haustek is handling for you. Nothing is needed from you unless Haustek asks.',
      knTrong: 'No rights claim is in progress on your tracks.',
      knDaXong: 'claims resolved or released',
      luong: 'Conversation', traLoi: 'Reply to Haustek', guiTra: 'Send reply', daGuiTra: 'Reply sent',
      ban: 'You', haustek: 'Haustek', taoLuc: 'Sent', xongLuc: 'Closed', uuTien: 'Priority',
      daXongGhi: 'This request is closed. If something is still wrong, reply below and it reopens.',
      hoiTieuDe: 'New support request', hoiMo: 'Haustek picks requests up during working hours. The due date follows the priority: normal 3 days, high 2 days.',
      hoiLoai: 'Request type', hoiTd: 'Title', hoiNd: 'Details', hoiBai: 'Related track (optional)', hoiTimBai: 'Type a track title or ISRC…',
      hoiUt: 'Priority', hoiGui: 'Send request', daGui: 'Request sent', hanXuLy: 'due',
      khongBai: 'No track found', boChon: 'Clear',
      mkTd: 'Marketing support for “{t}”', ntTd: 'Platform issue with “{t}”'
    }
  },

  dem: function (c) {
    try { var n = c.api.tickets(c.phien.me.role, c.phien.me.partyId).counts.open; return n ? String(n) : ''; }
    catch (e) { return ''; }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
    var tk = api.tickets(me.role, me.partyId);
    var kn;
    try { kn = api.claims(me.role, me.partyId); } catch (e) { kn = { rows: [], counts: { open: 0, total: 0 } }; }
    var mo = tk.rows.filter(function (x) { return x.status !== 'done'; });
    var xong = tk.rows.filter(function (x) { return x.status === 'done'; });
    var choNt = mo.filter(function (x) { return x.status === 'waiting'; }).length;
    var gan = mo.slice().sort(function (a, b) { return a.dueAt < b.dueAt ? -1 : 1; })[0];
    var loaiCua = function (id) { var x = tk.types.filter(function (y) { return y.id === id; })[0]; return x ? c.song(x, 'label') : id; };

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kMo'), v: HT.fmt.n(mo.length), lon: true, s: choNt ? HT.fmt.n(choNt) + ' ' + t('choNt') : '' },
      { l: t('kXong'), v: HT.fmt.n(xong.length) },
      { l: t('kKn'), v: HT.fmt.n(kn.counts.open), mau: kn.counts.open ? HB.mau('warn') : '', s: HT.fmt.n(kn.counts.total) + ' ' + t('tongKn') },
      { l: t('kHan'), v: gan ? HT.fmt.ngay(gan.dueAt) : '—', s: gan ? gan.id + ' · “' + HM.dai(gan.title, 30) + '”' : t('khongHan'),
        mau: gan && gan.dueAt < homNay() ? HB.mau('no') : '' }
    ]);

    html += '<div class="bar">' + HM.tabs([
      { k: 'mo', l: t('tabMo'), icon: 'clock', dem: mo.length },
      { k: 'xong', l: t('tabXong'), icon: 'check', dem: xong.length }
    ], LOC.tab) + '<div class="sp"></div>' +
      '<button type="button" class="btn pri" data-moi>' + HM.icon('up') + HM.esc(t('guiMoi')) + '</button></div>';

    var ds = LOC.tab === 'mo' ? mo : xong;
    var bang = ds.length
      ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cMa')) + '</th><th>' + HM.esc(t('cTieuDe')) + '</th><th>' + HM.esc(t('cTt')) + '</th>' +
        '<th>' + HM.esc(t('cPhuTrach')) + '</th><th>' + HM.esc(t('cHan')) + '</th><th>' + HM.esc(t('cCapNhat')) + '</th></tr></thead><tbody>' +
        ds.map(function (x) {
          var qua = x.status !== 'done' && x.dueAt < homNay();
          return '<tr class="pick" data-tk="' + HM.esc(x.id) + '">' +
            '<td class="mono" style="white-space:nowrap">' + HM.esc(x.id) + '<div class="t-sub" style="font-family:var(--f)">' + HM.tag(loaiCua(x.type), 'link') + '</div></td>' +
            '<td><div class="t-ttl">' + HM.esc(HM.dai(x.title, 60)) + '</div>' +
              (x.track ? '<div class="t-sub">' + HM.esc(x.track.title) + ' · ' + HM.esc(x.track.isrc) + '</div>' : '') + '</td>' +
            '<td>' + HM.tag(t(CHU_TT[x.status] || x.status), KIEU_TT[x.status] || '') +
              (x.priority === 'high' || x.priority === 'urgent' ? ' ' + HM.tag(t(CHU_UT[x.priority]), KIEU_UT[x.priority]) : '') + '</td>' +
            '<td>' + (x.assigneeName ? HM.esc(x.assigneeName) : '<span class="muted">' + HM.esc(t('chuaGiao')) + '</span>') + '</td>' +
            '<td class="mono' + (qua ? '' : ' muted') + '"' + (qua ? ' style="color:var(--danger)"' : '') + '>' + HM.esc(HT.fmt.ngay(x.dueAt)) + (qua ? '<div class="t-sub" style="color:var(--danger)">' + HM.esc(t('quaHan')) + '</div>' : '') + '</td>' +
            '<td class="mono muted">' + HM.esc(HT.fmt.luc(x.updatedAt)) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : HM.trong({ icon: LOC.tab === 'mo' ? 'check' : 'clock', tieuDe: t(LOC.tab === 'mo' ? 'trongMo' : 'trongXong'), moTa: t(LOC.tab === 'mo' ? 'trongMoMo' : 'trongXongMo'),
          nut: LOC.tab === 'mo' ? '<button type="button" class="btn pri" data-moi>' + HM.esc(t('guiMoi')) + '</button>' : '' });

    /* ---- cơ cấu: donut theo loại, thanh theo trạng thái ---- */
    var demLoai = {};
    tk.rows.forEach(function (x) { demLoai[x.type] = (demLoai[x.type] || 0) + 1; });
    var phanLoai = tk.types.map(function (ty, i) { return { ten: c.song(ty, 'label'), gt: demLoai[ty.id] || 0, mau: P[i % 8] }; })
      .filter(function (p) { return p.gt > 0; }).sort(function (a, b) { return b.gt - a.gt; });
    if (phanLoai.length > 6) {
      var du = phanLoai.slice(5).reduce(function (s, p) { return s + p.gt; }, 0);
      phanLoai = phanLoai.slice(0, 5).concat([{ ten: vi ? 'Loại khác' : 'Other types', gt: du, mau: HB.mauKhac() }]);
    }
    var demTt = {};
    tk.rows.forEach(function (x) { demTt[x.status] = (demTt[x.status] || 0) + 1; });
    var mauTt = { open: P[6], in_progress: P[0], waiting: P[1], done: P[5] };
    var hangTt = ['open', 'in_progress', 'waiting', 'done'].map(function (k) { return { ten: t(CHU_TT[k]), gt: demTt[k] || 0, mau: mauTt[k] }; });

    html += '<div class="grid g31">' +
      HM.the({ thoBody: true, than: bang }) +
      HM.the({
        h2: HM.esc(t('theoLoai')), p: HM.esc(t('theoLoaiMo')),
        than: (tk.rows.length
          ? HB.o({ loai: 'vong', cao: 170, dinhDang: 'so', phan: phanLoai, tenTong: vi ? 'Yêu cầu' : 'Requests', giua: { v: HT.fmt.n(tk.rows.length), l: vi ? 'yêu cầu' : 'requests' } })
          : '<p class="say">' + HM.esc(t('trongMoMo')) + '</p>') +
          '<h4 class="sec">' + HM.esc(t('theoTt')) + '</h4>' +
          HB.o({ loai: 'thanh', dinhDang: 'so', tenTong: vi ? 'Yêu cầu' : 'Requests', hang: hangTt })
      }) + '</div>';

    /* ---- khiếu nại bản quyền, gộp theo bài hát ---- */
    var knMo = kn.rows.filter(function (r) { return r.status !== 'resolved' && r.status !== 'released'; });
    var theoBai = [];
    knMo.forEach(function (r) {
      var g = theoBai.filter(function (x) { return x.isrc === r.track.isrc; })[0];
      if (!g) { g = { isrc: r.track.isrc, title: r.track.title, artist: r.track.artist, rows: [] }; theoBai.push(g); }
      g.rows.push(r);
    });
    html += HM.the({
      h2: HM.esc(t('knTieuDe')) + (knMo.length ? ' <span class="muted">(' + knMo.length + ')</span>' : ''),
      p: HM.esc(t('knMo')),
      than: theoBai.length
        ? theoBai.map(function (g) {
            return '<div class="t-ttl" style="margin:14px 0 6px;font-size:13.5px">' + HM.esc(g.title) + ' <span class="muted" style="font-weight:400">· ' + HM.esc(g.artist) + ' · ' + HM.esc(g.isrc) + '</span></div>' +
              HTS.khieuNai(g.rows).replace(/<p class="say"[^>]*>.*?<\/p>/, '');
          }).join('')
        : '<div class="note ok">' + HM.icon('check') + '<div><b>' + HM.esc(t('knTrong')) + '</b></div></div>',
      chan: kn.counts.total - knMo.length > 0 ? HM.esc(HT.fmt.n(kn.counts.total - knMo.length) + ' ' + t('knDaXong')) : ''
    });

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-moi]', function () { HT.moTicket(c, {}); });
    HM.bam(root, '[data-tk]', function (el) { moChiTiet(c, el.getAttribute('data-tk')); });
  }
});

function homNay() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' 00:00:00';
}

/* =====================================================================
   Ngăn chi tiết một yêu cầu: luồng trao đổi và ô trả lời
   ===================================================================== */
function moChiTiet(c, id) {
  var api = c.api, me = c.phien.me, t = c.t, vi = c.lang === 'vi';
  var tk = api.tickets(me.role, me.partyId);
  var x = tk.rows.filter(function (y) { return y.id === id; })[0];
  if (!x) return;
  var ty = tk.types.filter(function (y) { return y.id === x.type; })[0];
  var luong = '<div style="display:flex;flex-direction:column;gap:10px">' + x.messages.map(function (m) {
    var minh = m.who === 'partner';
    return '<div style="display:flex;flex-direction:column;align-items:' + (minh ? 'flex-end' : 'flex-start') + '">' +
      '<div style="max-width:88%;padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.6;' +
        (minh ? 'background:var(--accent-lo);border-bottom-right-radius:4px' : 'background:var(--band);border-bottom-left-radius:4px') + '">' +
        HM.esc(m.text) + '</div>' +
      '<div class="hint">' + HM.esc((minh ? t('ban') : t('haustek') + (x.assigneeName ? ' · ' + x.assigneeName : '')) + ' · ' + HT.fmt.luc(m.at)) + '</div></div>';
  }).join('') + '</div>';

  c.nganTruot(
    '<div class="btnrow" style="margin-bottom:12px">' + HM.tag(t(CHU_TT[x.status] || x.status), KIEU_TT[x.status] || '') +
      HM.tag(t('uuTien') + ': ' + t(CHU_UT[x.priority] || 'utNormal'), KIEU_UT[x.priority] || '') + '</div>' +
    HM.kv([
      { t: t('cLoai'), v: ty ? c.song(ty, 'label') : x.type },
      x.track ? { t: t('cBai'), v: x.track.title + ' · ' + x.track.isrc, manh: true } : null,
      { t: t('cPhuTrach'), v: x.assigneeName || t('chuaGiao') },
      { t: t('cHan'), v: HT.fmt.luc(x.dueAt) },
      { t: t('taoLuc'), v: HT.fmt.luc(x.createdAt) },
      x.closedAt ? { t: t('xongLuc'), v: HT.fmt.luc(x.closedAt) } : null
    ]) +
    '<h4 class="sec">' + HM.esc(t('luong')) + '</h4>' + luong +
    (x.status === 'done' ? '<p class="hint" style="margin-top:12px">' + HM.esc(t('daXongGhi')) + '</p>' : '') +
    '<h4 class="sec">' + HM.esc(t('traLoi')) + '</h4>' +
    '<textarea class="in" rows="3" data-tra placeholder="' + HM.esc(vi ? 'Bạn viết phản hồi ở đây…' : 'Write your reply…') + '"></textarea>' +
    '<div class="btnrow" style="margin-top:10px"><button type="button" class="btn pri sm" data-gui-tra>' + HM.icon('up') + HM.esc(t('guiTra')) + '</button></div>',
    { tieuDe: x.title, phu: x.id + ' · ' + (ty ? c.song(ty, 'label') : x.type),
      khiMo: function (dr) {
        HM.bam(dr, '[data-gui-tra]', function () {
          var o = dr.querySelector('[data-tra]');
          try {
            api.replyTicket(me.role, me.partyId, x.id, o.value);
            c.thongBao(t('daGuiTra') + ' · ' + x.id, 'ok');
            c.veLai();
            moChiTiet(c, x.id);
          } catch (e) { c.thongBao(e.message, 'no'); }
        });
      } });
}

/* =====================================================================
   HT.moTicket(c, { type, trackId, title }) — hộp thoại tạo yêu cầu, dùng
   chung cho trang này và cho nút yêu cầu hỗ trợ trong hồ sơ bài hát.
   ===================================================================== */
HT.moTicket = function (c, mac) {
  mac = mac || {};
  var api = c.api, me = c.phien.me, vi = c.lang === 'vi';
  var man = HT.man.filter(function (m) { return m.id === 'k-ho-tro'; })[0];
  var t = function (k) { return (man.chu[c.lang] && man.chu[c.lang][k] != null) ? man.chu[c.lang][k] : k; };
  var types = [];
  try { types = api.tickets(me.role, me.partyId).types; } catch (e) { types = []; }
  var chon = null;
  if (mac.trackId != null) {
    try { var a = api.trackAsset(me.role, me.partyId, mac.trackId); chon = { id: a.id, title: a.title, isrc: a.isrc }; } catch (e) { chon = null; }
  }
  var tieuDe = mac.title || (chon ? (mac.type === 'marketing' ? t('mkTd') : mac.type === 'nen-tang' ? t('ntTd') : '').replace('{t}', chon.title) : '');

  function veChon(bg) {
    var kq = bg.querySelector('[data-kq]'), an = bg.querySelector('[data-o=trackId]'), o = bg.querySelector('[data-timbai]');
    an.value = chon ? String(chon.id) : '';
    if (chon) {
      kq.innerHTML = '<span class="chip"><b>' + HM.esc(HM.dai(chon.title, 40)) + '</b> <span class="muted">' + HM.esc(chon.isrc) + '</span>' +
        '<button type="button" data-bo title="' + HM.esc(t('boChon')) + '">' + HM.icon('x') + '</button></span>';
      o.hidden = true;
    } else { kq.innerHTML = ''; o.hidden = false; }
  }

  c.hoiThoai({
    tieuDe: t('hoiTieuDe'), moTa: HM.esc(t('hoiMo')),
    than: '<div class="fldrow two-up">' +
      '<div><label class="fld">' + HM.esc(t('hoiLoai')) + '</label><select class="in" data-o="type">' +
        types.map(function (ty) { return '<option value="' + HM.esc(ty.id) + '"' + (ty.id === mac.type ? ' selected' : '') + '>' + HM.esc(c.song(ty, 'label')) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="fld">' + HM.esc(t('hoiUt')) + '</label><select class="in" data-o="priority">' +
        '<option value="normal">' + HM.esc(t('utNormal')) + '</option><option value="high">' + HM.esc(t('utHigh')) + '</option></select></div></div>' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(t('hoiTd')) + ' *</label><input class="in" data-o="title" value="' + HM.esc(tieuDe) + '">' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(t('hoiNd')) + ' *</label><textarea class="in" rows="4" data-o="body"></textarea>' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(t('hoiBai')) + '</label>' +
      '<input class="in" data-timbai placeholder="' + HM.esc(t('hoiTimBai')) + '">' +
      '<input type="hidden" data-o="trackId" value="">' +
      '<div data-kq style="margin-top:8px;max-height:200px;overflow:auto"></div>',
    dong: t('hoiGui'),
    khiMo: function (bg) {
      var o = bg.querySelector('[data-timbai]'), kq = bg.querySelector('[data-kq]');
      var hen = null;
      veChon(bg);
      o.addEventListener('input', function () {
        clearTimeout(hen);
        hen = setTimeout(function () {
          var q = o.value.trim();
          if (q.length < 2) { kq.innerHTML = ''; return; }
          var rows = [];
          try { rows = api.catalogue(me.role, me.partyId, { q: q, limit: 8, sort: 'streams' }).rows; } catch (e) { rows = []; }
          kq.innerHTML = rows.length
            ? '<div class="bars pick">' + rows.map(function (r) {
                return '<div class="row" data-pick="' + r.id + '" data-title="' + HM.esc(r.title) + '" data-isrc="' + HM.esc(r.isrc) + '" style="grid-template-columns:minmax(0,1fr) auto">' +
                  '<div class="nm"><b>' + HM.esc(HM.dai(r.title, 40)) + '</b><em>' + HM.esc(r.artist + ' · ' + r.isrc) + '</em></div>' +
                  '<div class="vv" style="font-size:12px">' + HTS.tagGiaiDoan(r.stage) + '</div></div>';
              }).join('') + '</div>'
            : '<p class="hint">' + HM.esc(t('khongBai')) + '</p>';
        }, 200);
      });
      bg.addEventListener('click', function (e) {
        var p = e.target.closest('[data-pick]');
        if (p) { e.preventDefault(); chon = { id: +p.getAttribute('data-pick'), title: p.getAttribute('data-title'), isrc: p.getAttribute('data-isrc') }; veChon(bg); o.value = ''; return; }
        if (e.target.closest('[data-bo]')) { e.preventDefault(); chon = null; veChon(bg); }
      });
      var td = bg.querySelector('[data-o=title]');
      if (td && !td.value) td.focus(); else { var nd = bg.querySelector('[data-o=body]'); if (nd) nd.focus(); }
    }
  }).then(function (f) {
    if (!f) return;
    try {
      var kq = api.createTicket(me.role, me.partyId, {
        type: f.type, title: f.title, body: f.body, priority: f.priority,
        trackId: f.trackId ? +f.trackId : undefined
      });
      c.thongBao(t('daGui') + ' · ' + kq.id + ' · ' + t('hanXuLy') + ' ' + HT.fmt.ngay(kq.dueAt), 'ok');
      if ((location.hash || '').replace('#', '') === 'k-ho-tro') c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
};

})();
