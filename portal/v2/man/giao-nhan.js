/* =====================================================================
   NỘI BỘ · GIAO NHẬN NỀN TẢNG
   ---------------------------------------------------------------------
   Gửi mới hoặc gửi lại (redeliver) danh mục tới từng nền tảng. Một yêu
   cầu có tên, đối tượng giao (theo label, danh sách UPC, file UPC, hay
   chọn bản phát hành) và danh sách nền tảng. Bên phải là các yêu cầu đã
   tạo, để tra lại tiến độ và đổi trạng thái.
   ===================================================================== */
"use strict";
(function () {

var LOC = { ten: '', loai: 'producer', giaTri: '', dem: '', nt: null, tim: '', tt: '' };
var TT = ['queued', 'sending', 'done', 'failed', 'cancelled'];
var KIEU_TT = { queued: 'info', sending: 'warn', done: 'ok', failed: 'no', cancelled: '' };

HT.dangKy({
  id: 'giao-nhan', nav: 'navGiaoNhan', nhom: 'nhomVanHanh', icon: 'swap',
  vai: ['ops', 'mgmt'],
  dem: function (c) { try { var n = c.A.deliveries.list().filter(function (x) { return x.status === 'queued' || x.status === 'sending'; }).length; return n ? String(n) : ''; } catch (e) { return ''; } },

  chu: {
    vi: {
      navGiaoNhan: 'Giao nhận nền tảng', h1: 'Giao nhận nền tảng',
      mo: 'Gửi mới hoặc gửi lại danh mục tới từng nền tảng. Chọn đối tượng giao, chọn nền tảng, đặt tên yêu cầu để tra lại sau.',
      kCho: 'Đang chờ gửi', kGui: 'Đang gửi', kXong: 'Đã xong', kLoi: 'Lỗi', kBanGhi: 'bản ghi × nền tảng đang chờ',
      taoMoi: 'Yêu cầu giao nhận mới', taoMoiMo: 'Mỗi yêu cầu gửi một tập bản ghi tới một hoặc nhiều nền tảng. Nền tảng xác nhận xong thì trạng thái từng bản ghi ở Danh mục tự cập nhật.',
      hTen: 'Tên yêu cầu', hTenMo: 'Ví dụ: Giao lại catalog Nightform sang Apple Music', hDoiTuong: 'Giao theo',
      producer: 'Theo label / nhà sản xuất', 'upc-list': 'Theo danh sách UPC', 'upc-file': 'Theo file UPC', albums: 'Chọn bản phát hành',
      hProducer: 'Mã đối tác (label hoặc nghệ sĩ)', hProducerMo: 'Toàn bộ bản ghi của đối tác này sẽ được giao.',
      hUpcList: 'Danh sách UPC', hUpcListMo: 'Mỗi dòng một UPC, hoặc cách nhau bằng dấu phẩy.',
      hUpcFile: 'Tên file UPC (.csv)', hUpcFileMo: 'Bản mẫu chỉ ghi tên file; hệ thống thật đọc file để đếm UPC.', hSoDong: 'Số UPC trong file',
      hAlbums: 'Mã bản phát hành (HSTK-…)', hAlbumsMo: 'Mỗi dòng một mã hồ sơ phát hành.',
      hNenTang: 'Nền tảng', chonHet: 'Chọn tất cả', boHet: 'Bỏ chọn', daChon: '{n} nền tảng đã chọn',
      gui: 'Tạo yêu cầu giao nhận', daTao: 'Đã tạo yêu cầu {id}',
      daCo: 'Yêu cầu đã tạo', daCoMo: 'Tra lại tiến độ, đổi trạng thái hoặc mở chi tiết.', tim: 'Tìm mã hoặc tên yêu cầu…', moiTt: 'Mọi trạng thái',
      cMa: 'Mã', cTen: 'Yêu cầu', cDoiTuong: 'Đối tượng', cNt: 'Nền tảng', cTienDo: 'Tiến độ', cTt: 'Trạng thái', cNguoi: 'Người tạo', cLuc: 'Tạo lúc',
      queued: 'Chờ gửi', sending: 'Đang gửi', done: 'Đã xong', failed: 'Lỗi', cancelled: 'Đã huỷ',
      batDau: 'Bắt đầu gửi', danhDauXong: 'Đánh dấu đã xong', danhDauLoi: 'Đánh dấu lỗi', huy: 'Huỷ yêu cầu', guiLai: 'Gửi lại',
      daDoi: 'Đã cập nhật trạng thái', khong: 'Chưa có yêu cầu nào', khongMo: 'Tạo yêu cầu đầu tiên ở thẻ bên trái.',
      dGiaTri: 'Giá trị', dSo: 'Số bản ghi', dTong: 'Tổng lượt gửi (bản ghi × nền tảng)', dDaGui: 'Đã gửi', dCapNhat: 'Cập nhật lần cuối',
      huyHoi: 'Huỷ yêu cầu {id}?', huyHoiMo: 'Các bản ghi chưa gửi sẽ không được gửi nữa. Bản ghi đã gửi giữ nguyên trên nền tảng.'
    },
    en: {
      navGiaoNhan: 'Platform delivery', h1: 'Platform delivery',
      mo: 'Deliver or redeliver catalogue to platforms. Pick what to deliver, pick the platforms, name the request so you can find it later.',
      kCho: 'Queued', kGui: 'Sending', kXong: 'Done', kLoi: 'Failed', kBanGhi: 'recording × platform pending',
      taoMoi: 'New delivery request', taoMoiMo: 'Each request sends a set of recordings to one or more platforms. Once the platform confirms, each recording’s status in the Catalogue updates itself.',
      hTen: 'Request name', hTenMo: 'e.g. Redeliver the Nightform catalogue to Apple Music', hDoiTuong: 'Deliver by',
      producer: 'By label / producer', 'upc-list': 'By UPC list', 'upc-file': 'By UPC file', albums: 'Pick releases',
      hProducer: 'Client ID (label or artist)', hProducerMo: 'Every recording of this partner will be delivered.',
      hUpcList: 'UPC list', hUpcListMo: 'One UPC per line, or comma-separated.',
      hUpcFile: 'UPC file name (.csv)', hUpcFileMo: 'The prototype records the file name; the real system reads it to count UPCs.', hSoDong: 'UPCs in the file',
      hAlbums: 'Release IDs (HSTK-…)', hAlbumsMo: 'One release submission ID per line.',
      hNenTang: 'Platforms', chonHet: 'Select all', boHet: 'Clear', daChon: '{n} platforms selected',
      gui: 'Create delivery request', daTao: 'Request {id} created',
      daCo: 'Existing requests', daCoMo: 'Check progress, change status or open details.', tim: 'Search ID or name…', moiTt: 'Any status',
      cMa: 'ID', cTen: 'Request', cDoiTuong: 'Subject', cNt: 'Platforms', cTienDo: 'Progress', cTt: 'Status', cNguoi: 'Created by', cLuc: 'Created',
      queued: 'Queued', sending: 'Sending', done: 'Done', failed: 'Failed', cancelled: 'Cancelled',
      batDau: 'Start sending', danhDauXong: 'Mark done', danhDauLoi: 'Mark failed', huy: 'Cancel request', guiLai: 'Resend',
      daDoi: 'Status updated', khong: 'No requests yet', khongMo: 'Create the first one in the card on the left.',
      dGiaTri: 'Value', dSo: 'Recordings', dTong: 'Total sends (recordings × platforms)', dDaGui: 'Sent', dCapNhat: 'Last updated',
      huyHoi: 'Cancel request {id}?', huyHoiMo: 'Unsent recordings will not be sent. Recordings already sent stay on the platform.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, vi = c.lang === 'vi', me = A.staff.me;
    var ds = A.deliveries.list();
    if (LOC.nt === null) LOC.nt = {};
    var dem = { queued: 0, sending: 0, done: 0, failed: 0, cancelled: 0 }, choGui = 0;
    ds.forEach(function (x) { dem[x.status] = (dem[x.status] || 0) + 1; if (x.status === 'queued' || x.status === 'sending') choGui += Math.max(0, x.progress.total - x.progress.sent); });

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [
        { l: t('kCho'), v: HT.fmt.n(dem.queued) },
        { l: t('kGui'), v: HT.fmt.n(dem.sending), mau: dem.sending ? HB.mau('warn') : '' },
        { l: t('kXong'), v: HT.fmt.n(dem.done) },
        { l: t('kLoi'), v: HT.fmt.n(dem.failed), mau: dem.failed ? HB.mau('no') : '' }
      ]
    });

    /* ---- biểu mẫu ---- */
    var soNt = Object.keys(LOC.nt).filter(function (k) { return LOC.nt[k]; }).length;
    var oGiaTri = '';
    if (LOC.loai === 'producer') {
      oGiaTri = '<label class="fld"><span>' + HM.esc(t('hProducer')) + '</span><input class="in" data-gia-tri list="ds-doi-tac" value="' + HM.esc(LOC.giaTri) + '" placeholder="HTK-L001"></label>' +
        '<datalist id="ds-doi-tac">' + A.parties.list({}).rows.slice(0, 200).map(function (r) { return '<option value="' + HM.esc(r.clientId) + '">' + HM.esc(r.name) + '</option>'; }).join('') + '</datalist>' +
        '<div class="hint">' + HM.esc(t('hProducerMo')) + '</div>';
    } else if (LOC.loai === 'upc-list') {
      oGiaTri = '<label class="fld"><span>' + HM.esc(t('hUpcList')) + '</span><textarea class="in" data-gia-tri rows="5" placeholder="880012345678">' + HM.esc(LOC.giaTri) + '</textarea></label>' +
        '<div class="hint">' + HM.esc(t('hUpcListMo')) + '</div>';
    } else if (LOC.loai === 'upc-file') {
      oGiaTri = '<label class="fld"><span>' + HM.esc(t('hUpcFile')) + '</span><input class="in" data-gia-tri value="' + HM.esc(LOC.giaTri) + '" placeholder="redeliver-0904.csv"></label>' +
        '<label class="fld"><span>' + HM.esc(t('hSoDong')) + '</span><input class="in" data-dem type="number" min="1" value="' + HM.esc(LOC.dem) + '"></label>' +
        '<div class="hint">' + HM.esc(t('hUpcFileMo')) + '</div>';
    } else {
      oGiaTri = '<label class="fld"><span>' + HM.esc(t('hAlbums')) + '</span><textarea class="in" data-gia-tri rows="4" placeholder="HSTK-2608-001">' + HM.esc(LOC.giaTri) + '</textarea></label>' +
        '<div class="hint">' + HM.esc(t('hAlbumsMo')) + '</div>';
    }
    var theTao = HM.the({
      h2: HM.esc(t('taoMoi')), p: HM.esc(t('taoMoiMo')),
      than: '<label class="fld"><span>' + HM.esc(t('hTen')) + '</span><input class="in" data-gn-ten value="' + HM.esc(LOC.ten) + '" placeholder="' + HM.esc(t('hTenMo')) + '"></label>' +
        '<div class="fld"><span>' + HM.esc(t('hDoiTuong')) + '</span><div class="chips">' + A.deliveries.subjects.map(function (s) {
          return '<button type="button" class="pill' + (LOC.loai === s.id ? ' on' : '') + '" data-loai="' + s.id + '">' + HM.esc(t(s.id)) + '</button>';
        }).join('') + '</div></div>' +
        oGiaTri +
        '<div class="fld"><span>' + HM.esc(t('hNenTang')) + ' · ' + HM.esc(t('daChon').replace('{n}', soNt)) + '</span>' +
          '<div class="checks">' + A.platformNames.map(function (n) {
            return '<label><input type="checkbox" data-nt="' + HM.esc(n) + '"' + (LOC.nt[n] ? ' checked' : '') + '> ' + HM.esc(n) + '</label>';
          }).join('') + '</div>' +
          '<div class="btnrow" style="margin-top:8px"><button type="button" class="btn sm" data-chon-het>' + HM.esc(t('chonHet')) + '</button>' +
          '<button type="button" class="btn sm ghost" data-bo-het>' + HM.esc(t('boHet')) + '</button></div></div>' +
        '<div class="btnrow" style="margin-top:14px"><button type="button" class="btn pri" data-gui>' + HM.icon('swap') + HM.esc(t('gui')) + '</button></div>'
    });

    /* ---- danh sách ---- */
    var q = LOC.tim.trim().toLowerCase();
    var loc = ds.filter(function (x) {
      if (LOC.tt && x.status !== LOC.tt) return false;
      return !q || x.id.toLowerCase().indexOf(q) >= 0 || x.name.toLowerCase().indexOf(q) >= 0;
    });
    var theDs = HM.the({
      h2: HM.esc(t('daCo')) + ' <span class="muted">(' + ds.length + ')</span>', p: HM.esc(t('daCoMo')),
      thoBody: true,
      than: '<div class="bar" style="padding:0 18px 12px">' +
        '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
        '<select class="in" data-tt style="width:auto;height:34px"><option value="">' + HM.esc(t('moiTt')) + '</option>' +
          TT.map(function (k) { return '<option value="' + k + '"' + (LOC.tt === k ? ' selected' : '') + '>' + HM.esc(t(k)) + '</option>'; }).join('') + '</select></div>' +
        (loc.length ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cTen')) + '</th><th>' + HM.esc(t('cDoiTuong')) + '</th><th>' + HM.esc(t('cNt')) + '</th>' +
          '<th style="width:140px">' + HM.esc(t('cTienDo')) + '</th><th>' + HM.esc(t('cTt')) + '</th></tr></thead><tbody>' +
          loc.map(function (x) {
            var pct = x.progress.total ? x.progress.sent / x.progress.total * 100 : 0;
            return '<tr class="pick" data-mo="' + HM.esc(x.id) + '">' +
              '<td><div class="t-ttl">' + HM.esc(HM.dai(x.name, 46)) + '</div><div class="t-sub">' + HM.esc(x.id + ' · ' + HT.fmt.luc(x.createdAt) + ' · ' + x.by) + '</div></td>' +
              '<td>' + HM.esc(t(x.subject.type)) + '<div class="t-sub">' + HM.esc(HT.fmt.n(x.subject.count) + (vi ? ' bản ghi' : ' recordings')) + '</div></td>' +
              '<td><div class="chips">' + x.platforms.map(function (n) { return '<span class="chip q">' + HM.esc(n) + '</span>'; }).join('') + '</div></td>' +
              '<td><div class="meter"><i style="width:' + pct.toFixed(0) + '%;background:' + (x.status === 'failed' ? 'var(--danger)' : x.status === 'done' ? 'var(--ok)' : 'var(--accent)') + '"></i></div>' +
                '<div class="hint">' + HM.esc(HT.fmt.n(x.progress.sent) + ' / ' + HT.fmt.n(x.progress.total)) + '</div></td>' +
              '<td>' + HM.tag(t(x.status), KIEU_TT[x.status]) + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : HM.trong({ icon: 'swap', tieuDe: t('khong'), moTa: t('khongMo') }))
    });

    html += '<div class="grid g31" style="grid-template-columns:minmax(0,5fr) minmax(0,7fr)">' + theTao + theDs + '</div>';
    root.innerHTML = html;
    HB.gan(root);

    HM.nhap(root, '[data-gn-ten]', function (el) { LOC.ten = el.value; });
    HM.nhap(root, '[data-gia-tri]', function (el) { LOC.giaTri = el.value; });
    HM.nhap(root, '[data-dem]', function (el) { LOC.dem = el.value; });
    HM.bam(root, '[data-loai]', function (el) { LOC.loai = el.getAttribute('data-loai'); LOC.giaTri = ''; c.veLai(); });
    HM.doi(root, '[data-nt]', function (el) { LOC.nt[el.getAttribute('data-nt')] = el.checked; var s = root.querySelector('.fld .checks'); if (s) { var n = Object.keys(LOC.nt).filter(function (k) { return LOC.nt[k]; }).length; s.parentNode.querySelector('span').textContent = t('hNenTang') + ' · ' + t('daChon').replace('{n}', n); } });
    HM.bam(root, '[data-chon-het]', function () { A.platformNames.forEach(function (n) { LOC.nt[n] = true; }); c.veLai(); });
    HM.bam(root, '[data-bo-het]', function () { LOC.nt = {}; c.veLai(); });
    HM.bam(root, '[data-gui]', function () {
      var nt = A.platformNames.filter(function (n) { return LOC.nt[n]; });
      var count = LOC.loai === 'upc-file' ? (+LOC.dem || 0) : LOC.loai === 'producer' ? demBanGhi(A, LOC.giaTri) : 0;
      try {
        var d = A.deliveries.create({ name: LOC.ten, subject: { type: LOC.loai, value: LOC.giaTri.trim(), count: count || undefined }, platforms: nt }, me.email);
        c.thongBao(t('daTao').replace('{id}', d.id), 'ok');
        LOC.ten = ''; LOC.giaTri = ''; LOC.dem = ''; LOC.nt = {};
        c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.doi(root, '[data-tt]', function (el) { LOC.tt = el.value; c.veLai(); });
    HM.bam(root, '[data-mo]', function (el) { moYeuCau(c, el.getAttribute('data-mo')); });
  }
});

/* Số bản ghi của một đối tác, để yêu cầu "theo label" biết tổng lượt gửi. */
function demBanGhi(A, clientId) {
  var r = null;
  A.parties.list({ q: clientId }).rows.forEach(function (x) { if (x.clientId.toLowerCase() === String(clientId).trim().toLowerCase()) r = x; });
  return r ? r.tracks : 0;
}

function moYeuCau(c, id) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', me = A.staff.me;
  var x = null; A.deliveries.list().forEach(function (y) { if (y.id === id) x = y; });
  if (!x) return;
  var pct = x.progress.total ? x.progress.sent / x.progress.total * 100 : 0;
  var nut = [];
  if (x.status === 'queued') nut.push(['sending', t('batDau'), 'pri'], ['cancelled', t('huy'), 'ghost']);
  if (x.status === 'sending') nut.push(['done', t('danhDauXong'), 'pri'], ['failed', t('danhDauLoi'), '']);
  if (x.status === 'failed') nut.push(['queued', t('guiLai'), 'pri']);
  c.nganTruot(
    HM.so([
      { l: t('cTienDo'), v: HT.fmt.pct(pct / 100), lon: true, s: HT.fmt.n(x.progress.sent) + ' / ' + HT.fmt.n(x.progress.total) },
      { l: t('cTt'), html: HM.tag(t(x.status), KIEU_TT[x.status]) }
    ]) +
    '<div class="meter" style="margin:10px 0 14px"><i style="width:' + pct.toFixed(0) + '%"></i></div>' +
    HM.kv([
      { t: t('cDoiTuong'), v: t(x.subject.type) },
      { t: t('dGiaTri'), v: x.subject.value || '—' },
      { t: t('dSo'), v: HT.fmt.n(x.subject.count) },
      { t: t('cNt'), v: x.platforms.join(', ') },
      { t: t('dTong'), v: HT.fmt.n(x.progress.total) },
      { t: t('cNguoi'), v: x.by },
      { t: t('cLuc'), v: HT.fmt.luc(x.createdAt) },
      { t: t('dCapNhat'), v: HT.fmt.luc(x.updatedAt) }
    ]) +
    (nut.length ? '<div class="btnrow" style="margin-top:14px">' + nut.map(function (n) {
      return '<button type="button" class="btn sm ' + n[2] + '" data-tt-moi="' + n[0] + '">' + HM.esc(n[1]) + '</button>';
    }).join('') + '</div>' : ''),
    { tieuDe: x.name, phu: x.id,
      khiMo: function (dr) {
        HM.bam(dr, '[data-tt-moi]', function (el) {
          var tt = el.getAttribute('data-tt-moi');
          var doi = function () {
            try { A.deliveries.setStatus(id, tt, me.email); c.thongBao(t('daDoi'), 'ok'); c.dongNgan(); c.veLai(); }
            catch (e) { c.thongBao(e.message, 'no'); }
          };
          if (tt === 'cancelled') c.xacNhan(t('huyHoi').replace('{id}', id), HM.esc(t('huyHoiMo')), t('huy'), true).then(function (ok) { if (ok) doi(); });
          else doi();
        });
      } });
}

})();
