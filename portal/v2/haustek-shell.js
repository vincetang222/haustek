/* =====================================================================
   HAUSTEK PORTAL v2 — KHUNG ỨNG DỤNG DÙNG CHUNG
   ---------------------------------------------------------------------
   Một khung cho cả hai cửa. Khác nhau ở chỗ nạp màn hình nào và cầm mặt
   tiền dữ liệu nào:
     · intranet.html  giữ HAUSTEK.admin  — toàn quyền
     · khach.html     gọi HAUSTEK.lockdown() rồi chỉ còn HAUSTEK.api

   Khung lo: chế độ sáng/tối, ngôn ngữ, điều hướng, hộp thoại, ngăn
   trượt, thông báo, định dạng số. Màn hình chỉ lo nội dung của nó.
   ===================================================================== */
"use strict";
(function (global) {

var LS_THEME = 'haustek.theme';   /* auto | light | dark */
var LS_LANG  = 'haustek.lang';    /* vi | en */

/* ---------------------------------------------------------------------
   Chế độ sáng/tối
   Ba trạng thái, không phải hai: "auto" là để trống thuộc tính cho
   prefers-color-scheme quyết định. Chọn tay thì đóng dấu lên thẻ gốc.
   --------------------------------------------------------------------- */
function docKho(k, mac) {
  try { return localStorage.getItem(k) || mac; } catch (e) { return mac; }
}
function ghiKho(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var theme = docKho(LS_THEME, 'auto');
var lang  = docKho(LS_LANG, 'vi');

function apTheme() {
  var el = document.documentElement;
  if (theme === 'auto') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', theme);
}
apTheme();

/* ---------------------------------------------------------------------
   Chữ dùng chung cho khung
   --------------------------------------------------------------------- */
var CHU = {
  vi: {
    internal: 'Nội bộ', portal: 'Cổng khách hàng',
    themeAuto: 'Theo máy', themeLight: 'Sáng', themeDark: 'Tối',
    period: 'Kỳ', currency: 'Tiền tệ', search: 'Tìm',
    cancel: 'Huỷ', confirm: 'Xác nhận', close: 'Đóng', save: 'Lưu',
    approved: 'đã duyệt', notApproved: 'chưa duyệt',
    loading: 'Đang dựng số liệu…',
    noScreen: 'Trang này chưa dựng xong.',
    errScreen: 'Trang này lỗi',
    of: 'trong', rows: 'dòng mỗi trang', showing: 'Hiện',
    all: 'Tất cả', none: '—',
    menu: 'Mở menu', closeMenu: 'Đóng menu',
    display: 'Hiển thị'
  },
  en: {
    internal: 'Internal', portal: 'Client portal',
    themeAuto: 'System', themeLight: 'Light', themeDark: 'Dark',
    period: 'Period', currency: 'Currency', search: 'Search',
    cancel: 'Cancel', confirm: 'Confirm', close: 'Close', save: 'Save',
    approved: 'approved', notApproved: 'not approved',
    loading: 'Building data…',
    noScreen: 'This screen is not built yet.',
    errScreen: 'This screen failed',
    of: 'of', rows: 'rows per page', showing: 'Show',
    all: 'All', none: '—',
    menu: 'Open navigation', closeMenu: 'Close navigation',
    display: 'Display'
  }
};

/* ---------------------------------------------------------------------
   Icon — nét mảnh, vẽ tay, không dùng ký tự thay hình
   --------------------------------------------------------------------- */
var IC = {
  grid:  '<path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9"/>',
  down:  '<path d="M2.5 5 8 10.5 13.5 5"/>',
  left:  '<path d="M9.5 2.5 4 8l5.5 5.5"/>',
  right: '<path d="M6.5 2.5 12 8l-5.5 5.5"/>',
  x:     '<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>',
  check: '<path d="M3 8.5l3.5 3.5L13 4.5"/>',
  alert: '<path d="M8 1.8 15 14H1zM8 6.5v3.2M8 11.6v.1"/>',
  info:  '<circle cx="8" cy="8" r="6.4"/><path d="M8 7.4v4M8 4.9v.1"/>',
  clock: '<circle cx="8" cy="8" r="6.2"/><path d="M8 4.4V8l2.6 1.6"/>',
  cal:   '<rect x="2" y="3" width="12" height="11" rx="1.6"/><path d="M2 6.6h12M5.5 1.4v3M10.5 1.4v3"/>',
  swap:  '<path d="M3 5h10l-3-3M13 11H3l3 3"/>',
  disc:  '<circle cx="8" cy="8" r="6.2"/><circle cx="8" cy="8" r="1.7"/>',
  shop:  '<path d="M2.5 6h11l-1 7.6h-9zM5.6 6V4a2.4 2.4 0 0 1 4.8 0v2"/>',
  globe: '<circle cx="8" cy="8" r="6.2"/><path d="M1.8 8h12.4M8 1.8c1.9 2 1.9 10.4 0 12.4M8 1.8c-1.9 2-1.9 10.4 0 12.4"/>',
  user:  '<circle cx="8" cy="5.4" r="2.7"/><path d="M2.8 13.6c0-2.6 2.3-4.1 5.2-4.1s5.2 1.5 5.2 4.1"/>',
  cash:  '<rect x="1.8" y="4" width="12.4" height="8" rx="1.6"/><circle cx="8" cy="8" r="1.9"/>',
  book:  '<path d="M3 2.5h7.5A2.5 2.5 0 0 1 13 5v8.5H5.5A2.5 2.5 0 0 1 3 11z"/><path d="M3 11h10"/>',
  file:  '<path d="M4 1.8h5l3 3v9.4H4z"/><path d="M9 1.8v3h3M6 8.5h4M6 11h4"/>',
  down2: '<path d="M8 2.5v8M4.6 7.4 8 10.8l3.4-3.4M3 13.2h10"/>',
  up:    '<path d="M8 13.5v-8M4.6 8.6 8 5.2l3.4 3.4M3 2.8h10"/>',
  gear:  '<circle cx="8" cy="8" r="2.4"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8 3.4 3.4"/>',
  sun:   '<circle cx="8" cy="8" r="3.1"/><path d="M8 1.4v1.8M8 12.8v1.8M14.6 8h-1.8M3.2 8H1.4M12.7 3.3l-1.3 1.3M4.6 11.4l-1.3 1.3M12.7 12.7l-1.3-1.3M4.6 4.6 3.3 3.3"/>',
  moon:  '<path d="M13.4 9.6A5.8 5.8 0 0 1 6.4 2.6a5.9 5.9 0 1 0 7 7z"/>',
  auto:  '<circle cx="8" cy="8" r="6.2"/><path d="M8 1.8v12.4" /><path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor" stroke="none"/>',
  list:  '<path d="M2.5 4h11M2.5 8h11M2.5 12h7"/>',
  chart: '<path d="M2 13.5V8M6 13.5V4M10 13.5v-7M14 13.5V2.5"/>',
  ask:   '<circle cx="8" cy="8" r="6.4"/><path d="M6.2 6.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.3M8 11.9v.1"/>',
  /* Kính lúp. Trước đây ô tìm mượn tạm icon dấu hỏi — trông như nút trợ
     giúp, và người ta không bấm vào ô để gõ. */
  tim:   '<circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4 14 14"/>',
  empty: '<circle cx="8" cy="8" r="6.2"/><path d="M5.4 8.6h5.2"/>',
  out:   '<path d="M6.5 3.5H3.2v9.3h9.3V9.5M9.5 2.5h4v4M13.5 2.5 7.8 8.2"/>',
  menu:  '<path d="M2.5 4.2h11M2.5 8h11M2.5 11.8h11"/>'
};
function icon(n, extra) {
  return '<svg viewBox="0 0 16 16"' + (extra || '') + '>' + (IC[n] || '') + '</svg>';
}

/* ---------------------------------------------------------------------
   Định dạng số và ngày — ĐI THEO NGÔN NGỮ đang chọn.

   Trước đây chỗ này cố định kiểu Việt với lý do "công cụ nội bộ của một
   công ty Việt Nam". Lý do đó đúng với cửa nội bộ, nhưng sai hẳn với cổng
   khách: người bật EN là đối tác nước ngoài, và với họ "$7.537,23" đọc ra
   bảy nghìn hay bảy đô là chuyện hên xui. Tiền là chỗ không được để ai
   đoán, nên tiếng nào thì viết số theo tiếng đó.

   Ngày cũng vậy: 06.07.2026 ở VI là 6 tháng 7, ở EN người đọc rất dễ hiểu
   thành 7 tháng 6. Nên bản EN viết hẳn tên tháng ra.
   --------------------------------------------------------------------- */
var fx = 26150;
function setFx(v) { fx = v || fx; }
function loc() { return lang === 'en' ? 'en-US' : 'vi-VN'; }
var THANG_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var fmt = {
  n:  function (v) { return Math.round(v).toLocaleString(loc()); },
  n1: function (v) { return v.toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }); },
  usd: function (v) {
    return (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString(loc(),
      { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  usd0: function (v) {
    return (v < 0 ? '−$' : '$') + Math.round(Math.abs(v)).toLocaleString(loc());
  },
  /* Đồng Việt Nam thì luôn viết kiểu Việt, kể cả ở giao diện EN — đó là
     cách con số ấy in ra trên uỷ nhiệm chi. */
  vnd: function (v) { return Math.round(v * fx).toLocaleString('vi-VN') + ' ₫'; },
  tien: function (v, cur) { return cur === 'VND' ? fmt.vnd(v) : fmt.usd0(v); },
  tien2: function (v, cur) { return cur === 'VND' ? fmt.vnd(v) : fmt.usd(v); },
  pct: function (v, d) {
    return (v * 100).toLocaleString(loc(),
      { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) + '%';
  },
  delta: function (a, b) {
    if (b == null || !b) return null;
    return (a - b) / b;
  },
  luc: function (s) {
    if (!s) return '—';
    s = String(s);
    if (lang === 'en')
      return s.slice(8, 10) + ' ' + (THANG_EN[+s.slice(5, 7) - 1] || '') + ' ' + s.slice(0, 4) +
        ', ' + s.slice(11, 16);
    return s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4) + ' ' + s.slice(11, 16);
  },
  ngay: function (s) {
    if (!s) return '—';
    s = String(s);
    if (lang === 'en')
      return s.slice(8, 10) + ' ' + (THANG_EN[+s.slice(5, 7) - 1] || '') + ' ' + s.slice(0, 4);
    return s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4);
  }
};

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------------------------------------------------------------------
   Sổ đăng ký màn hình
   --------------------------------------------------------------------- */
var MAN = [];
function dangKy(def) {
  if (!def || !def.id || typeof def.ve !== 'function')
    throw new Error('Trang phải có id và hàm ve(root, ctx)');
  MAN.push(def);
}

/* ---------------------------------------------------------------------
   Thông báo · hộp thoại · ngăn trượt
   --------------------------------------------------------------------- */
function oThongBao() {
  var el = document.querySelector('.toasts');
  if (!el) { el = document.createElement('div'); el.className = 'toasts'; document.body.appendChild(el); }
  return el;
}
function thongBao(msg, kieu) {
  var el = document.createElement('div');
  el.className = 'toast' + (kieu ? ' ' + kieu : '');
  el.textContent = msg;
  oThongBao().appendChild(el);
  setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
  setTimeout(function () { el.remove(); }, 3600);
}

function hoiThoai(o) {
  return new Promise(function (xong) {
    /* Chỉ một hộp thoại tại một thời điểm. Chồng hai cái lên nhau thì
       cái dưới vẫn nhận phím Esc và vẫn trả về giá trị — người dùng bấm
       Huỷ một lần mà hai luồng cùng chạy tiếp. */
    var dangCo = document.querySelector('.modal-bg');
    if (dangCo) dangCo.remove();
    var bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' +
      '<h3>' + esc(o.tieuDe || '') + '</h3>' +
      (o.moTa ? '<p class="h">' + o.moTa + '</p>' : '') +
      '<div data-than>' + (o.than || '') + '</div>' +
      '<div class="modal-f">' +
        '<button type="button" class="btn" data-act="huy">' + esc(o.huy || CHU[lang].cancel) + '</button>' +
        (o.dong === false ? '' :
          '<button type="button" class="btn ' + (o.nguyHiem ? 'dang' : 'pri') + '" data-act="ok">' +
          esc(o.dong || CHU[lang].confirm) + '</button>') +
      '</div></div>';
    function tat(v) { bg.remove(); document.removeEventListener('keydown', phim); xong(v); }
    function phim(e) { if (e.key === 'Escape') tat(null); }
    bg.addEventListener('click', function (e) {
      if (e.target === bg) return tat(null);
      var b = e.target.closest('button[data-act]');
      if (!b) return;
      if (b.dataset.act === 'huy') return tat(null);
      var form = {};
      bg.querySelectorAll('[data-o]').forEach(function (f) { form[f.dataset.o] = f.value; });
      tat(form);
    });
    document.addEventListener('keydown', phim);
    document.body.appendChild(bg);
    var dau = bg.querySelector('[data-o], button[data-act=ok]');
    if (dau) dau.focus();
    if (o.khiMo) o.khiMo(bg);
  });
}
function xacNhan(tieuDe, moTa, nhan, nguyHiem) {
  return hoiThoai({ tieuDe: tieuDe, moTa: moTa, dong: nhan, nguyHiem: nguyHiem }).then(function (r) { return !!r; });
}

/* Ngăn trượt bên phải — dùng cho mọi màn hình có "bấm một dòng xem chi tiết" */
function nganTruot(noiDung, opt) {
  /* Dựng thẻ mới mỗi lần mở, vì khiMo() gắn sự kiện lên chính thẻ ngăn.
     Dùng lại thẻ cũ là chồng sự kiện của lần mở trước lên lần này. */
  var cu = document.querySelector('.drawer');
  if (cu) cu.remove();
  var dr = document.createElement('aside');
  dr.className = 'drawer';
  document.body.appendChild(dr);
  var bd = document.querySelector('.backdrop');
  if (!bd) {
    bd = document.createElement('div'); bd.className = 'backdrop'; document.body.appendChild(bd);
    bd.addEventListener('click', dongNgan);
    document.addEventListener('keydown', function (e) {
      var d = document.querySelector('.drawer.on');
      if (e.key === 'Escape' && d) dongNgan();
    });
  }
  dr.innerHTML = '<div class="drawer-h"><div style="flex:1;min-width:0">' +
      '<h3>' + esc((opt && opt.tieuDe) || '') + '</h3>' +
      ((opt && opt.phu) ? '<p>' + esc(opt.phu) + '</p>' : '') +
    '</div><button type="button" class="x" data-dong>' + icon('x') + '</button></div>' +
    '<div class="drawer-b">' + noiDung + '</div>';
  dr.querySelector('[data-dong]').addEventListener('click', dongNgan);
  /* Bật lớp ở khung hình sau, để trình duyệt kịp nhận thẻ mới rồi mới
     chạy hiệu ứng trượt — đặt ngay thì thẻ hiện ra không có chuyển động. */
  requestAnimationFrame(function () { dr.classList.add('on'); bd.classList.add('on'); });
  if (opt && opt.khiMo) opt.khiMo(dr);
}
function dongNgan() {
  var dr = document.querySelector('.drawer'), bd = document.querySelector('.backdrop');
  if (dr) dr.classList.remove('on');
  if (bd) bd.classList.remove('on');
}

/* ---------------------------------------------------------------------
   Bảng có sắp xếp + phân trang — dùng lại ở nhiều màn, viết một lần
   --------------------------------------------------------------------- */
function bang(o) {
  /* o: { cot:[{k,l,num,s,w}], dong:[], sort, dir, trang, co, veDong(d,i), chon(d) } */
  var st = { sort: o.sort, dir: o.dir == null ? -1 : o.dir, trang: 0, co: o.co || 25 };
  var host = o.host, loc = o.loc || function (d) { return d; };
  var api = {
    st: st,
    ve: ve,
    dong: function () { return loc(o.dong()); }
  };
  function sapXep(rows) {
    if (!st.sort) return rows;
    return rows.slice().sort(function (a, b) {
      var x = a[st.sort], y = b[st.sort];
      if (x == null) x = typeof y === 'string' ? '' : 0;
      if (y == null) y = typeof x === 'string' ? '' : 0;
      if (typeof x === 'string') return x.localeCompare(y, 'vi') * st.dir;
      return (x - y) * st.dir;
    });
  }
  function ve() {
    var rows = sapXep(loc(o.dong()));
    var het = Math.max(0, Math.ceil(rows.length / st.co) - 1);
    if (st.trang > het) st.trang = het;
    var a = st.trang * st.co, page = rows.slice(a, a + st.co);
    var th = o.cot.map(function (c) {
      var on = st.sort === c.k;
      return '<th class="' + (c.num ? 'num ' : '') + (c.s === false ? '' : 's ') +
        (on ? 'sorted band' : '') + '"' + (c.s === false ? '' : ' data-sx="' + esc(c.k) + '"') +
        (c.w ? ' style="width:' + c.w + '"' : '') + '>' + esc(c.l) +
        (on ? '<span class="ar">' + (st.dir > 0 ? '↑' : '↓') + '</span>' : '') + '</th>';
    }).join('');
    var tb = page.map(function (d, i) {
      return '<tr' + (o.chon ? ' class="pick"' : '') + ' data-r="' + (a + i) + '">' +
        o.veDong(d, a + i, st) + '</tr>';
    }).join('');
    host.innerHTML =
      '<div class="card-h" style="padding-bottom:12px"><div class="pager">' +
        '<button type="button" class="pg" data-tr="-1" ' + (st.trang === 0 ? 'disabled' : '') + '>' + icon('left') + '</button>' +
        '<button type="button" class="pg" data-tr="1" ' + (a + st.co >= rows.length ? 'disabled' : '') + '>' + icon('right') + '</button>' +
      '</div><div class="range">' + (rows.length ? fmt.n(a + 1) + '–' + fmt.n(Math.min(rows.length, a + st.co)) : '0') +
        ' ' + CHU[lang].of + ' ' + fmt.n(rows.length) + '</div>' +
      '<div class="sp"></div>' + (o.hanhDong || '') + '</div>' +
      (rows.length
        ? '<div class="tw"><table class="t"><thead><tr>' + th + '</tr></thead><tbody>' + tb + '</tbody>' +
          (o.chan ? '<tfoot>' + o.chan(rows) + '</tfoot>' : '') + '</table></div>'
        : '<div class="empty">' + icon('empty') + '<b>' + esc(o.rongTieuDe || '—') + '</b>' +
          '<span>' + esc(o.rongMoTa || '') + '</span>' +
          (o.rongNut ? '<div class="btnrow">' + o.rongNut + '</div>' : '') + '</div>') +
      '<div class="card-f">' + (o.chanChu ? o.chanChu(rows) : '') +
        '<span class="sp" style="flex:1"></span>' + CHU[lang].showing +
        ' <select class="inline-sel" data-co>' + [12, 25, 50, 100].map(function (n) {
          return '<option value="' + n + '"' + (n === st.co ? ' selected' : '') + '>' + n + '</option>';
        }).join('') + '</select> ' + CHU[lang].rows + '</div>';
    api.rows = rows;
  }
  host.addEventListener('click', function (e) {
    var th = e.target.closest('[data-sx]');
    if (th) {
      var k = th.getAttribute('data-sx');
      if (st.sort === k) st.dir = -st.dir;
      else { st.sort = k; var c = o.cot.filter(function (x) { return x.k === k; })[0]; st.dir = (c && c.num) ? -1 : 1; }
      st.trang = 0; return ve();
    }
    var tr = e.target.closest('[data-tr]');
    if (tr) { st.trang += +tr.getAttribute('data-tr'); return ve(); }
    var row = e.target.closest('tr[data-r]');
    if (row && o.chon) { var d = api.rows[+row.getAttribute('data-r')]; if (d) o.chon(d); }
  });
  host.addEventListener('change', function (e) {
    var s = e.target.closest('[data-co]');
    if (s) { st.co = +s.value; st.trang = 0; ve(); }
  });
  return api;
}

/* ---------------------------------------------------------------------
   Khởi động một cửa (intranet hoặc cổng khách)
   --------------------------------------------------------------------- */
function chay(cauHinh) {
  /* cauHinh: { ten, phu, kyDanhSach(), kyMacDinh, doiKy, chanTrai, coTienTe } */
  /* Gọi lúc trình duyệt còn đang đọc phần đầu trang thì document.body chưa
     tồn tại. Ở bản nhiều file điều đó không xảy ra vì thẻ script nằm trong
     body; ở bản gói một trang thì có. Đợi rồi chạy lại, thay vì ném lỗi. */
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', function () { chay(cauHinh); });
    return null;
  }
  var kys = cauHinh.kyDanhSach();
  var kyHienTai = cauHinh.kyMacDinh != null ? cauHinh.kyMacDinh
                : (kys.length ? kys[kys.length - 1].k : null);
  var cur = 'USD';
  var manHienTai = null;

  function t(k) { return (CHU[lang] && CHU[lang][k]) || k; }

  function ctx() {
    var man = MAN.filter(function (m) { return m.id === manHienTai; })[0];
    return {
      lang: lang, cur: cur, kyKey: kyHienTai,
      ky: kys.filter(function (p) { return p.k === kyHienTai; })[0] || null,
      kys: kys,
      fmt: fmt, esc: esc, icon: icon, CHU: CHU,
      tien: function (v) { return fmt.tien(v, cur); },
      tien2: function (v) { return fmt.tien2(v, cur); },
      /* Chuỗi hai thứ tiếng đến từ TẦNG DỮ LIỆU: tên luồng, điều kiện
         duyệt, từng chặng trong chuỗi tiền của khách. Chúng không nằm
         trong từ điển của màn hình vì màn hình không sinh ra chúng —
         nên lấy bằng hàm này: c.song(o, 'label') trả về o.labelEn khi
         đang ở EN và có bản EN, còn lại trả về o.label. */
      song: function (o, khoa) {
        if (!o) return '';
        if (lang === 'en') {
          var kEn = khoa + 'En';
          if (o[kEn] != null && o[kEn] !== '') return o[kEn];
        }
        return o[khoa] == null ? '' : o[khoa];
      },
      /* chữ của màn hình, thiếu thì rơi về chữ của khung */
      t: function (k) {
        if (man && man.chu && man.chu[lang] && man.chu[lang][k] != null) return man.chu[lang][k];
        return t(k);
      },
      doiKy: function (k) { kyHienTai = k; if (cauHinh.doiKy) cauHinh.doiKy(k); ve(); },
      di: function (id) { location.hash = '#' + id; },
      veLai: ve,
      thongBao: thongBao, hoiThoai: hoiThoai, xacNhan: xacNhan,
      nganTruot: nganTruot, dongNgan: dongNgan, bang: bang,
      A: cauHinh.A || null, api: cauHinh.api || null, phien: cauHinh.phien || null
    };
  }

  /* ---- khung HTML ----
     KHÔNG ghi đè document.body.innerHTML.

     Bản nhiều file để <style> và <link> trong <head>, nên ghi đè body
     không đụng tới chúng. Nhưng bản gói một trang thì toàn bộ nội dung —
     kể cả thẻ <style> mang cả hệ giao diện lẫn bộ chữ nhúng — nằm trong
     <body>, vì trình xem artifact bọc nội dung vào body. Ghi đè body ở
     đó là ứng dụng tự xoá mất bảng màu của chính nó: DOM vẫn dựng đủ,
     nhưng không còn một dòng CSS nào. Trang ra một mớ chữ trần và mấy ô
     đen to bằng nửa màn hình — chính là mấy ô vuông đen.

     Nên chỉ thay đúng phần tử gốc của ứng dụng, không đụng anh em bên
     cạnh. Cách này đúng ở cả hai chỗ, không cần biết tài sản nằm ở đâu. */
  var cuGoc = document.querySelector('.app');
  if (cuGoc) cuGoc.remove();
  var goc = document.createElement('div');
  goc.className = 'app';
  document.body.appendChild(goc);
  /* Hai cụm nút sáng/tối và VI/EN được vẽ HAI LẦN: một ở thanh trên (màn
     rộng), một trong cột điều hướng (điện thoại, thanh trên không còn chỗ).
     CSS quyết định cụm nào hiện; cả hai cùng bắt sự kiện qua data-th /
     data-l nên không cần biết mình đang ở đâu. */
  function oCaiDat() {
    return (cauHinh.coTienTe === false ? '' :
        '<div class="seg" data-cur>' +
          '<button type="button" data-c="USD" class="on">USD</button>' +
          '<button type="button" data-c="VND">VND</button></div>') +
      '<div class="seg" data-theme-sw>' +
        '<button type="button" data-th="auto" title="' + esc(t('themeAuto')) + '">' + icon('auto') + '</button>' +
        '<button type="button" data-th="light" title="' + esc(t('themeLight')) + '">' + icon('sun') + '</button>' +
        '<button type="button" data-th="dark" title="' + esc(t('themeDark')) + '">' + icon('moon') + '</button>' +
      '</div>' +
      '<div class="seg" data-lang>' +
        '<button type="button" data-l="vi">VI</button>' +
        '<button type="button" data-l="en">EN</button></div>';
  }
  goc.innerHTML =
      '<aside class="side" data-side>' +
        '<div class="side-top"><div class="brand"><i></i>HAUSTEK <em data-ten></em></div>' +
          '<button type="button" class="menu-x" data-menu-dong>' + icon('x') + '</button></div>' +
        '<nav class="nav" data-nav></nav>' +
        '<div class="side-ctl"><span data-ctl-l></span>' + oCaiDat() + '</div>' +
        '<div class="side-foot" data-chan></div>' +
      '</aside>' +
      '<div class="menu-bg" data-menu-dong></div>' +
      '<div class="body">' +
        '<header class="top">' +
          '<button type="button" class="menu-btn" data-menu aria-expanded="false">' + icon('menu') + '</button>' +
          '<div class="crumb" data-crumb></div>' +
          '<div class="sp"></div>' +
          '<div class="top-note" data-note></div>' +
          '<select class="inline-sel" data-ky aria-label="Kỳ"></select>' +
          oCaiDat() +
        '</header>' +
        '<main data-main></main>' +
      '</div>';

  /* Cột điều hướng ở màn hẹp là một ngăn trượt từ trái. */
  function moMenu(mo) {
    goc.classList.toggle('menu-mo', !!mo);
    document.body.classList.toggle('menu-mo', !!mo);
    var nut = goc.querySelector('[data-menu]');
    if (nut) nut.setAttribute('aria-expanded', mo ? 'true' : 'false');
  }

  var $ = function (s) { return document.querySelector(s); };

  /* Chữ của MỘT màn cụ thể.
     ctx().t() tra trong từ điển của màn ĐANG MỞ — đúng cho nội dung bên
     trong màn, nhưng sai cho cột điều hướng: cột đó liệt kê cả mười lăm
     màn, mà mỗi màn chỉ mang từ điển của chính nó. Tra bằng ctx().t() thì
     đứng ở màn Tổng quan sẽ thấy "navKeToan", "nhomTien" nằm nguyên trên
     màn hình. Nên ở đây tra theo từng màn một. */
  function chuCua(m, k) {
    if (m && m.chu && m.chu[lang] && m.chu[lang][k] != null) return m.chu[lang][k];
    return (CHU[lang] && CHU[lang][k]) || k;
  }
  /* Tên nhóm do một màn nào đó trong nhóm khai — lấy màn đầu tiên có khai. */
  function chuNhom(k) {
    for (var i = 0; i < MAN.length; i++) {
      var m = MAN[i];
      if (m.chu && m.chu[lang] && m.chu[lang][k] != null) return m.chu[lang][k];
    }
    return (CHU[lang] && CHU[lang][k]) || k;
  }

  function veNav() {
    var c = ctx(), nhom = [];
    MAN.forEach(function (m) {
      var g = nhom.filter(function (x) { return x.ten === (m.nhom || ''); })[0];
      if (!g) { g = { ten: m.nhom || '', muc: [] }; nhom.push(g); }
      g.muc.push(m);
    });
    $('[data-nav]').innerHTML = nhom.map(function (g) {
      return (g.ten ? '<div class="nav-grp">' + esc(chuNhom(g.ten)) + '</div>' : '') +
        g.muc.map(function (m) {
          var dem = '';
          try { dem = m.dem ? (m.dem(c) || '') : ''; } catch (e) { dem = ''; }
          var canh = dem && String(dem).indexOf('!') === 0;
          if (canh) dem = String(dem).slice(1);
          return '<a href="#' + m.id + '" class="' + (m.id === manHienTai ? 'on' : '') + '">' +
            icon(m.icon || 'grid') + '<span>' + esc(chuCua(m, m.nav || m.id)) + '</span>' +
            (dem !== '' ? '<span class="c' + (canh ? ' alert' : '') + '">' + esc(dem) + '</span>' : '') +
            '</a>';
        }).join('');
    }).join('');
  }

  function ve() {
    /* Dựng lại danh sách kỳ mỗi lần vẽ, không nhớ từ lúc khởi động.
       Nhãn trong ô chọn kỳ ("đã duyệt" / "chưa duyệt") là chữ giao diện và
       phải đổi theo ngôn ngữ; nó cũng đổi khi người vận hành vừa duyệt xong
       một kỳ. Nhớ một lần lúc khởi động là cả hai thứ đó đứng im. */
    kys = cauHinh.kyDanhSach();
    var id = (location.hash || '').replace('#', '') || (MAN[0] && MAN[0].id);
    var man = MAN.filter(function (m) { return m.id === id; })[0] || MAN[0];
    if (!man) return;
    manHienTai = man.id;
    var c = ctx();

    $('[data-ten]').textContent = c.t(cauHinh.ten);
    $('[data-crumb]').innerHTML = '<b>' + esc(c.t(cauHinh.ten)) + '</b><i>/</i><span>' +
      esc(chuCua(man, man.nav || man.id)) + '</span>';
    $('[data-menu]').setAttribute('aria-label', c.t('menu'));
    $('[data-menu]').setAttribute('title', c.t('menu'));
    $('.menu-x').setAttribute('aria-label', c.t('closeMenu'));
    $('[data-ctl-l]').textContent = c.t('display');
    $('[data-note]').textContent = cauHinh.ghiChu ? cauHinh.ghiChu(c) : '';
    $('[data-chan]').innerHTML = cauHinh.chanTrai ? cauHinh.chanTrai(c) : '';

    var sel = $('[data-ky]');
    sel.innerHTML = kys.map(function (p) {
      return '<option value="' + esc(p.k) + '"' + (p.k === kyHienTai ? ' selected' : '') + '>' +
        esc(c.t('period')) + ' ' + esc(p.label) + (p.nhan ? ' · ' + esc(p.nhan) : '') + '</option>';
    }).reverse().join('');

    document.querySelectorAll('[data-th]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.th === theme);
    });
    document.querySelectorAll('[data-l]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.l === lang);
    });
    document.querySelectorAll('[data-c]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.c === cur);
    });

    veNav();
    dongNgan();
    /* Thay hẳn thẻ <main> chứ không chỉ xoá ruột nó.
       Màn hình gắn sự kiện theo uỷ nhiệm lên chính thẻ này (HM.bam). Nếu
       giữ lại thẻ cũ, mỗi lần vẽ lại là chồng thêm một bộ sự kiện nữa lên
       cùng một thẻ — bấm một lần mở ba hộp thoại. Thay thẻ thì bộ cũ chết
       theo thẻ cũ, không phải nhớ gỡ tay ở mười lăm màn. */
    var cu = $('[data-main]');
    var root = document.createElement('main');
    root.setAttribute('data-main', '');
    cu.replaceWith(root);
    try { man.ve(root, c); }
    catch (e) {
      root.innerHTML = '<div class="card"><div class="card-b"><h2>' + esc(c.t('errScreen')) +
        '</h2><p class="muted" style="margin:6px 0 10px">' + esc(e && e.message) + '</p>' +
        '<pre class="mono" style="white-space:pre-wrap;font-size:11px;color:var(--faint)">' +
        esc((e && e.stack || '').split('\n').slice(0, 6).join('\n')) + '</pre></div></div>';
      if (global.console) console.error(e);
    }
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-menu]')) { moMenu(!goc.classList.contains('menu-mo')); return; }
    if (e.target.closest('[data-menu-dong]') || e.target.closest('.nav a')) moMenu(false);
    var th = e.target.closest('[data-th]');
    if (th) { theme = th.dataset.th; ghiKho(LS_THEME, theme); apTheme(); return ve(); }
    var l = e.target.closest('[data-l]');
    if (l) { lang = l.dataset.l; ghiKho(LS_LANG, lang); return ve(); }
    var cu = e.target.closest('[data-c]');
    if (cu) { cur = cu.dataset.c; return ve(); }
  });
  document.addEventListener('change', function (e) {
    var k = e.target.closest('[data-ky]');
    if (k) { kyHienTai = k.value; if (cauHinh.doiKy) cauHinh.doiKy(kyHienTai); ve(); }
  });
  global.addEventListener('hashchange', function () { moMenu(false); ve(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && goc.classList.contains('menu-mo')) moMenu(false);
  });
  /* đổi cài đặt sáng/tối của máy khi đang để "theo máy" */
  if (global.matchMedia) {
    var mq = global.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { if (theme === 'auto') ve(); });
  }

  ve();
  return { veLai: ve, ctx: ctx };
}

global.HT = {
  dangKy: dangKy, man: MAN, chay: chay,
  fmt: fmt, esc: esc, icon: icon, IC: IC, CHU: CHU,
  thongBao: thongBao, hoiThoai: hoiThoai, xacNhan: xacNhan,
  nganTruot: nganTruot, dongNgan: dongNgan, bang: bang,
  setFx: setFx,
  get lang() { return lang; },
  get theme() { return theme; }
};

})(window);
