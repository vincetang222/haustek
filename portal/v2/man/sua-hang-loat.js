/* =====================================================================
   NỘI BỘ · SỬA HÀNG LOẠT
   ---------------------------------------------------------------------
   Bốn thao tác trên nhiều bản phát hành cùng lúc, nhận diện bằng UPC:
   khoá / mở khoá, đổi giá album, đổi ngày phát hành số, đổi giá track.
   Mỗi lần gửi là một yêu cầu có mã, nằm trong "Tổng quan yêu cầu" bên
   phải để tra lại, áp dụng hay huỷ. Hệ thống thật đẩy yêu cầu này tới
   đơn vị phân phối; bản mẫu chỉ lưu và đổi trạng thái.
   ===================================================================== */
"use strict";
(function () {

var LOC = { action: 'lock', upcs: '', giaTri: '', ghi: '', tim: '', tt: '' };
var TT = ['queued', 'done', 'cancelled'];
var KIEU_TT = { queued: 'info', done: 'ok', cancelled: '' };
var ICON = { lock: 'gear', price: 'cash', 'release-date': 'cal', 'track-price': 'disc' };

HT.dangKy({
  id: 'sua-hang-loat', nav: 'navSuaHl', nhom: 'nhomVanHanh', icon: 'list',
  vai: ['ops', 'mgmt'],
  dem: function (c) { try { var n = c.A.bulk.list().filter(function (x) { return x.status === 'queued'; }).length; return n ? String(n) : ''; } catch (e) { return ''; } },

  chu: {
    vi: {
      navSuaHl: 'Sửa hàng loạt', h1: 'Sửa hàng loạt',
      mo: 'Khoá hoặc mở khoá, đổi giá album, đổi ngày phát hành số, đổi giá track cho nhiều bản phát hành cùng lúc, theo danh sách UPC.',
      kCho: 'Chờ áp dụng', kXong: 'Đã áp dụng', kUpc: 'UPC đang chờ', kTong: 'Tổng yêu cầu',
      congCu: 'Công cụ', chonCongCu: 'Chọn thao tác',
      lock: 'Khoá / mở khoá bản phát hành', price: 'Đổi giá album', 'release-date': 'Đổi ngày phát hành số', 'track-price': 'Đổi giá track',
      lockMo: 'Bản phát hành bị khoá không sửa được metadata và không gửi thêm nền tảng cho tới khi mở khoá.',
      priceMo: 'Giá bán album trên các nền tảng bán tải về. Nền tảng streaming không dùng giá này.',
      'release-dateMo': 'Ngày phát hành số mới áp dụng cho mọi nền tảng. Ngày đã qua nghĩa là phát hành ngay.',
      'track-priceMo': 'Giá bán từng track trên các bản phát hành có UPC trong danh sách.',
      hUpc: 'Danh sách UPC', hUpcMo: 'Mỗi dòng một UPC, hoặc cách nhau bằng dấu phẩy. {n} UPC hợp lệ.',
      hLock: 'Thao tác', khoa: 'Khoá', moKhoa: 'Mở khoá',
      hGia: 'Giá album (USD)', hGiaTrack: 'Giá track (USD)', hNgay: 'Ngày phát hành số mới', hGhi: 'Ghi chú (tuỳ chọn)',
      gui: 'Tạo yêu cầu', daTao: 'Đã tạo yêu cầu {id} cho {n} UPC',
      tongQuan: 'Tổng quan yêu cầu', tongQuanMo: 'Mọi yêu cầu sửa hàng loạt đã tạo, mới nhất trước.', tim: 'Tìm mã yêu cầu hoặc UPC…', moiTt: 'Mọi trạng thái',
      cYeuCau: 'Yêu cầu', cUpc: 'UPC', cGiaTri: 'Giá trị', cTt: 'Trạng thái', cNguoi: 'Người tạo', cLuc: 'Tạo lúc',
      queued: 'Chờ áp dụng', done: 'Đã áp dụng', cancelled: 'Đã huỷ',
      apDung: 'Áp dụng', huy: 'Huỷ yêu cầu', daDoi: 'Đã cập nhật trạng thái',
      huyHoi: 'Huỷ yêu cầu {id}?', huyHoiMo: 'Yêu cầu chưa được áp dụng nên huỷ không ảnh hưởng gì tới bản phát hành.',
      apHoi: 'Áp dụng yêu cầu {id}?', apHoiMo: 'Thay đổi được đẩy tới đơn vị phân phối cho {n} UPC. Không hoàn tác được từ đây.',
      khong: 'Chưa có yêu cầu nào', khongMo: 'Tạo yêu cầu đầu tiên ở thẻ bên trái.',
      dUpc: 'UPC trong yêu cầu', dGhi: 'Ghi chú', dCapNhat: 'Cập nhật lần cuối', khongGhi: 'không có'
    },
    en: {
      navSuaHl: 'Bulk edit', h1: 'Bulk edit',
      mo: 'Lock or unlock, change album price, digital release date or track price across many releases at once, by UPC list.',
      kCho: 'Queued', kXong: 'Applied', kUpc: 'UPCs waiting', kTong: 'Requests',
      congCu: 'Tools', chonCongCu: 'Choose an action',
      lock: 'Lock or unlock releases', price: 'Change album price', 'release-date': 'Change digital release date', 'track-price': 'Change track price',
      lockMo: 'A locked release cannot have its metadata edited or be delivered to more platforms until it is unlocked.',
      priceMo: 'Album price on download stores. Streaming platforms ignore it.',
      'release-dateMo': 'The new digital release date applies to every platform. A past date means release now.',
      'track-priceMo': 'Per-track price on the releases whose UPC is in the list.',
      hUpc: 'UPC list', hUpcMo: 'One UPC per line, or comma-separated. {n} valid UPCs.',
      hLock: 'Action', khoa: 'Lock', moKhoa: 'Unlock',
      hGia: 'Album price (USD)', hGiaTrack: 'Track price (USD)', hNgay: 'New digital release date', hGhi: 'Note (optional)',
      gui: 'Create request', daTao: 'Request {id} created for {n} UPCs',
      tongQuan: 'Request overview', tongQuanMo: 'Every bulk edit request, newest first.', tim: 'Search request ID or UPC…', moiTt: 'Any status',
      cYeuCau: 'Request', cUpc: 'UPCs', cGiaTri: 'Value', cTt: 'Status', cNguoi: 'Created by', cLuc: 'Created',
      queued: 'Queued', done: 'Applied', cancelled: 'Cancelled',
      apDung: 'Apply', huy: 'Cancel request', daDoi: 'Status updated',
      huyHoi: 'Cancel request {id}?', huyHoiMo: 'It has not been applied, so cancelling changes nothing on the releases.',
      apHoi: 'Apply request {id}?', apHoiMo: 'The change is pushed to the distributor for {n} UPCs. It cannot be undone from here.',
      khong: 'No requests yet', khongMo: 'Create the first one in the card on the left.',
      dUpc: 'UPCs in the request', dGhi: 'Note', dCapNhat: 'Last updated', khongGhi: 'none'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, vi = c.lang === 'vi', me = A.staff.me, P = HB.dayMau();
    var ds = A.bulk.list();
    var cho = ds.filter(function (x) { return x.status === 'queued'; });
    var upcs = LOC.upcs.split(/[\s,;]+/).filter(Boolean);

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [
        { l: t('kCho'), v: HT.fmt.n(cho.length), mau: cho.length ? HB.mau('warn') : '' },
        { l: t('kUpc'), v: HT.fmt.n(cho.reduce(function (a, x) { return a + x.count; }, 0)) },
        { l: t('kXong'), v: HT.fmt.n(ds.filter(function (x) { return x.status === 'done'; }).length) },
        { l: t('kTong'), v: HT.fmt.n(ds.length) }
      ]
    });

    /* ---- công cụ ---- */
    var oGiaTri = '';
    if (LOC.action === 'lock') {
      oGiaTri = '<div class="fld"><span>' + HM.esc(t('hLock')) + '</span><div class="chips">' +
        [['lock', t('khoa')], ['unlock', t('moKhoa')]].map(function (x) {
          return '<button type="button" class="pill' + ((LOC.giaTri || 'lock') === x[0] ? ' on' : '') + '" data-gia-tri-chon="' + x[0] + '">' + HM.esc(x[1]) + '</button>';
        }).join('') + '</div></div>';
    } else if (LOC.action === 'release-date') {
      oGiaTri = '<label class="fld"><span>' + HM.esc(t('hNgay')) + '</span><input class="in" type="date" data-gia-tri value="' + HM.esc(LOC.giaTri) + '"></label>';
    } else {
      oGiaTri = '<label class="fld"><span>' + HM.esc(LOC.action === 'price' ? t('hGia') : t('hGiaTrack')) + '</span><input class="in" type="number" step="0.01" min="0" data-gia-tri value="' + HM.esc(LOC.giaTri) + '" placeholder="9.99"></label>';
    }
    var theTao = HM.the({
      h2: HM.esc(t('congCu')), p: HM.esc(t('chonCongCu')),
      than: '<div class="chips" style="margin-bottom:14px">' + A.bulk.actions.map(function (a) {
          return '<button type="button" class="pill' + (LOC.action === a.id ? ' on' : '') + '" data-action="' + a.id + '">' + HM.icon(ICON[a.id] || 'list') + ' ' + HM.esc(t(a.id)) + '</button>';
        }).join('') + '</div>' +
        '<p class="say">' + HM.esc(t(LOC.action + 'Mo')) + '</p>' +
        '<label class="fld"><span>' + HM.esc(t('hUpc')) + '</span><textarea class="in mono" data-upcs rows="6" placeholder="880012345678&#10;880012345679">' + HM.esc(LOC.upcs) + '</textarea></label>' +
        '<div class="hint" data-dem-upc>' + HM.esc(t('hUpcMo').replace('{n}', HT.fmt.n(upcs.length))) + '</div>' +
        oGiaTri +
        '<label class="fld"><span>' + HM.esc(t('hGhi')) + '</span><input class="in" data-ghi value="' + HM.esc(LOC.ghi) + '"></label>' +
        '<div class="btnrow" style="margin-top:14px"><button type="button" class="btn pri" data-gui' + (upcs.length ? '' : ' disabled') + '>' + HM.icon('check') + HM.esc(t('gui')) + '</button></div>'
    });

    /* ---- tổng quan yêu cầu ---- */
    var q = LOC.tim.trim().toLowerCase();
    var loc = ds.filter(function (x) {
      if (LOC.tt && x.status !== LOC.tt) return false;
      return !q || x.id.toLowerCase().indexOf(q) >= 0 || x.upcs.some(function (u) { return u.indexOf(q) >= 0; });
    });
    var theDs = HM.the({
      h2: HM.esc(t('tongQuan')) + ' <span class="muted">(' + ds.length + ')</span>', p: HM.esc(t('tongQuanMo')),
      thoBody: true,
      than: '<div class="bar" style="padding:0 18px 12px">' +
        '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
        '<select class="in" data-tt style="width:auto;height:34px"><option value="">' + HM.esc(t('moiTt')) + '</option>' +
          TT.map(function (k) { return '<option value="' + k + '"' + (LOC.tt === k ? ' selected' : '') + '>' + HM.esc(t(k)) + '</option>'; }).join('') + '</select></div>' +
        (loc.length ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cYeuCau')) + '</th><th class="num">' + HM.esc(t('cUpc')) + '</th><th>' + HM.esc(t('cGiaTri')) + '</th><th>' + HM.esc(t('cTt')) + '</th><th>' + HM.esc(vi ? 'Thao tác' : 'Actions') + '</th></tr></thead><tbody>' +
          loc.map(function (x) {
            return '<tr class="pick" data-mo="' + HM.esc(x.id) + '">' +
              '<td><div class="t-ttl">' + HM.icon(ICON[x.action] || 'list') + ' ' + HM.esc(t(x.action)) + '</div><div class="t-sub">' + HM.esc(x.id + ' · ' + HT.fmt.luc(x.createdAt) + ' · ' + x.by) + '</div></td>' +
              '<td class="num">' + HM.esc(HT.fmt.n(x.count)) + '</td>' +
              '<td class="mono">' + HM.esc(giaTriChu(c, x)) + '</td>' +
              '<td>' + HM.tag(t(x.status), KIEU_TT[x.status]) + '</td>' +
              '<td>' + (x.status === 'queued' ? '<div class="btnrow"><button type="button" class="btn sm pri" data-ap="' + HM.esc(x.id) + '">' + HM.esc(t('apDung')) + '</button>' +
                '<button type="button" class="btn sm ghost" data-huy="' + HM.esc(x.id) + '">' + HM.icon('x') + '</button></div>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : HM.trong({ icon: 'list', tieuDe: t('khong'), moTa: t('khongMo') }))
    });

    html += '<div class="grid g31" style="grid-template-columns:minmax(0,5fr) minmax(0,7fr)">' + theTao + theDs + '</div>';
    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-action]', function (el) { LOC.action = el.getAttribute('data-action'); LOC.giaTri = ''; c.veLai(); });
    HM.nhap(root, '[data-upcs]', function (el) {
      LOC.upcs = el.value;
      var n = LOC.upcs.split(/[\s,;]+/).filter(Boolean).length;
      var d = root.querySelector('[data-dem-upc]'); if (d) d.textContent = t('hUpcMo').replace('{n}', HT.fmt.n(n));
      var b = root.querySelector('[data-gui]'); if (b) b.disabled = !n;
    });
    HM.nhap(root, '[data-gia-tri]', function (el) { LOC.giaTri = el.value; });
    HM.doi(root, '[data-gia-tri]', function (el) { LOC.giaTri = el.value; });
    HM.bam(root, '[data-gia-tri-chon]', function (el) { LOC.giaTri = el.getAttribute('data-gia-tri-chon'); c.veLai(); });
    HM.nhap(root, '[data-ghi]', function (el) { LOC.ghi = el.value; });
    HM.bam(root, '[data-gui]', function () {
      try {
        var r = A.bulk.create({ action: LOC.action, upcs: LOC.upcs, value: LOC.action === 'lock' ? (LOC.giaTri || 'lock') : LOC.giaTri, note: LOC.ghi }, me.email);
        c.thongBao(t('daTao').replace('{id}', r.id).replace('{n}', HT.fmt.n(r.count)), 'ok');
        LOC.upcs = ''; LOC.giaTri = ''; LOC.ghi = '';
        c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.doi(root, '[data-tt]', function (el) { LOC.tt = el.value; c.veLai(); });
    HM.bam(root, '[data-ap]', function (el, e) { e.stopPropagation(); apDung(c, el.getAttribute('data-ap')); });
    HM.bam(root, '[data-huy]', function (el, e) { e.stopPropagation(); huy(c, el.getAttribute('data-huy')); });
    HM.bam(root, '[data-mo]', function (el, e) { if (e.target.closest('button')) return; moYeuCau(c, el.getAttribute('data-mo')); });
  }
});

function giaTriChu(c, x) {
  var t = c.t;
  if (x.action === 'lock') return /unlock/i.test(String(x.value)) ? t('moKhoa') : t('khoa');
  if (x.action === 'release-date') return x.value ? HT.fmt.date(x.value) : '—';
  var n = parseFloat(String(x.value || '').replace(',', '.'));
  return isNaN(n) ? (x.value || '—') : HT.fmt.usd(n);
}
function timYc(A, id) { var r = null; A.bulk.list().forEach(function (x) { if (x.id === id) r = x; }); return r; }

function apDung(c, id) {
  var A = c.A, t = c.t, me = A.staff.me, x = timYc(A, id);
  if (!x) return;
  c.xacNhan(t('apHoi').replace('{id}', id), HM.esc(t('apHoiMo').replace('{n}', HT.fmt.n(x.count))), t('apDung'), false).then(function (ok) {
    if (!ok) return;
    try { A.bulk.setStatus(id, 'done', me.email); c.thongBao(t('daDoi'), 'ok'); c.dongNgan(); c.veLai(); }
    catch (e) { c.thongBao(e.message, 'no'); }
  });
}
function huy(c, id) {
  var A = c.A, t = c.t, me = A.staff.me;
  c.xacNhan(t('huyHoi').replace('{id}', id), HM.esc(t('huyHoiMo')), t('huy'), true).then(function (ok) {
    if (!ok) return;
    try { A.bulk.setStatus(id, 'cancelled', me.email); c.thongBao(t('daDoi'), 'ok'); c.dongNgan(); c.veLai(); }
    catch (e) { c.thongBao(e.message, 'no'); }
  });
}

function moYeuCau(c, id) {
  var A = c.A, t = c.t, x = timYc(A, id);
  if (!x) return;
  c.nganTruot(
    HM.so([
      { l: t('cUpc'), v: HT.fmt.n(x.count), lon: true },
      { l: t('cGiaTri'), v: giaTriChu(c, x) },
      { l: t('cTt'), html: HM.tag(t(x.status), KIEU_TT[x.status]) }
    ]) +
    HM.kv([
      { t: t('cYeuCau'), v: t(x.action), manh: true },
      { t: t('cNguoi'), v: x.by },
      { t: t('cLuc'), v: HT.fmt.luc(x.createdAt) },
      { t: t('dCapNhat'), v: HT.fmt.luc(x.updatedAt) },
      { t: t('dGhi'), v: x.note || t('khongGhi') }
    ]) +
    (x.status === 'queued' ? '<div class="btnrow" style="margin-top:12px"><button type="button" class="btn sm pri" data-ap="' + HM.esc(x.id) + '">' + HM.esc(t('apDung')) + '</button>' +
      '<button type="button" class="btn sm ghost" data-huy="' + HM.esc(x.id) + '">' + HM.esc(t('huy')) + '</button></div>' : '') +
    '<h4 class="sec">' + HM.esc(t('dUpc')) + '</h4>' +
    '<div class="chips">' + x.upcs.map(function (u) { return '<span class="chip q mono">' + HM.esc(u) + '</span>'; }).join('') + '</div>',
    { tieuDe: x.id, phu: t(x.action),
      khiMo: function (dr) {
        HM.bam(dr, '[data-ap]', function (el) { apDung(c, el.getAttribute('data-ap')); });
        HM.bam(dr, '[data-huy]', function (el) { huy(c, el.getAttribute('data-huy')); });
      } });
}

})();
