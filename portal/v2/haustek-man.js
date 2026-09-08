/* =====================================================================
   HAUSTEK PORTAL v2 — TIỆN ÍCH CHO MÀN HÌNH
   ---------------------------------------------------------------------
   Mười lăm màn hình dùng chung một bộ khuôn: đầu trang, dải ô số, thẻ,
   tab, ô trống, ô ghi chú. Viết một lần ở đây thay vì chép mười lăm lần —
   chép mười lăm lần thì sửa một chỗ là quên mười bốn chỗ.
   ===================================================================== */
"use strict";
(function (global) {

var esc = HT.esc, icon = HT.icon;

function dai(s, n) {
  s = String(s == null ? '' : s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/* ---- đầu trang ---- */
/* o.nut: nút hành động chính của trang, đứng bên phải tiêu đề — một chỗ
   cho mọi màn, thay cho mỗi màn tự đặt nút một kiểu dưới dải ô số. */
/* Câu giải thích không in ra nữa: một dấu ? cạnh tiêu đề, rê chuột hoặc
   bấm để đọc. Chữ đã được màn hình escape sẵn nên đặt thẳng vào thuộc tính. */
function giup(chu) {
  if (!chu) return '';
  var nhan = HT.lang === 'en' ? 'What is this?' : 'Giải thích';
  return '<button type="button" class="help" data-giup="' + chu + '" aria-label="' + nhan + '" title="">?</button>';
}
/* Cùng một dấu ? ấy, cỡ nhãn — dùng cho nhãn ô nhập và đầu cột, thay cho
   một dòng chữ giải thích nằm chình ình dưới mỗi ô. Một ký hiệu cho cả
   sản phẩm: đọc quen một chỗ là quen mọi chỗ. */
function hoi(chu) {
  if (!chu) return '';
  var nhan = HT.lang === 'en' ? 'What is this?' : 'Giải thích';
  return '<button type="button" class="help hi" data-giup="' + esc(chu) + '" aria-label="' + nhan + '" title="">?</button>';
}

function dau(o) {
  return '<div class="page"><div><h1>' + (o.h1 || '') + giup(o.mo) + '</h1></div>' +
    (o.so && o.so.length ? '<div class="page-kpis">' + o.so.map(function (k) {
      return '<div class="page-kpi"><div class="l">' + esc(k.l) + '</div>' +
        '<div class="v"' + (k.mau ? ' style="color:' + k.mau + '"' : '') + '>' + esc(k.v) + '</div></div>';
    }).join('') + '</div>' : '') +
    (o.nut ? '<div class="page-act">' + o.nut + '</div>' : '') + '</div>';
}

/* ---- dải ô số ---- */
function so(list) {
  return '<div class="kpis">' + list.map(function (k) {
    return '<div class="kpi' + (k.lon ? ' hero' : '') + '"' +
      (k.tip ? ' data-tip="' + esc(k.tip) + '"' : '') + '>' +
      '<div class="l">' + (k.icon === false ? '' : icon(k.icon || suyHieu(k.l).icon)) + esc(k.l) + '</div>' +
      /* số dài (từ 12 ký tự, cỡ hàng tỷ) hạ cỡ chữ một bậc để không tràn ô ở khung hẹp */
      '<div class="v' + (!k.html && String(k.v == null ? '' : k.v).length >= 12 ? ' dai' : '') + '"' + (k.mau ? ' style="color:' + k.mau + '"' : '') + '>' + (k.html || esc(k.v)) + '</div>' +
      (k.s ? '<div class="s">' + (k.sHtml ? k.s : esc(k.s)) + '</div>' : '') +
      /* chênh lệch so với kỳ trước: viên nhỏ xanh / đỏ; tia: đường bé 12 kỳ */
      (k.d ? '<span class="d ' + (k.d.duong ? 'pos' : 'neg') + '">' + esc(k.d.chu) + '</span>' : '') +
      (k.tia && k.tia.length > 1 && typeof HB !== 'undefined' ? '<div class="tia">' + HB.tia(k.tia, { rong: 160, cao: 26, mau: k.lon ? HB.mau('accent') : (k.tiaMau || null), vung: true }) + '</div>' : '') +
      '</div>';
  }).join('') + '</div>';
}

/* ---- thẻ ---- */
/* Tiêu đề khối nằm TRONG một huy hiệu có icon và nền tô theo loại.
   o.mau: 'accent' | 'ok' | 'warn' | 'no' | 'tho' — bỏ trống thì suy từ tên
   o.icon: tên icon — bỏ trống thì cũng suy từ tên

   Vì sao suy từ tên chứ không bắt mỗi thẻ tự khai: hơn hai trăm thẻ trong
   sản phẩm, khai tay thì vừa sót vừa lệch nhau. Suy từ tên cho mỗi thẻ một
   mốc thị giác đúng nghĩa ngay, mà thẻ nào cần khác vẫn khai đè được.
   Bảng dưới đọc theo THỨ TỰ: từ khoá hẹp đứng trước từ khoá rộng, vì
   "quá hạn thanh toán" phải ra cảnh báo chứ không ra tiền. */
var HIEU = [
  [/quá hạn|chậm|vấn đề|lỗi|từ chối|rủi ro|cảnh báo|bất thường|khiếu nại|tranh chấp|thiếu|chưa khớp|gian lận/i, 'alert', 'no'],
  [/chờ|cần |đang xử lý|hàng đợi|sắp|tồn|chưa /i, 'clock', 'warn'],
  [/đã duyệt|đã xong|hoàn tất|đạt|thành công|đã chuyển|đã trả|đã ghi/i, 'check', 'ok'],
  [/roi|dự báo|tăng trưởng|xu hướng|chỉ tiêu|hiệu quả|so sánh|phân bổ|thống kê|biểu đồ/i, 'chart', 'accent'],
  [/doanh thu|tiền|thanh toán|chi trả|tạm ứng|ứng |ví |phí|thuế|tỷ giá|hoá đơn|số dư|mức trả|giá /i, 'cash', 'accent'],
  [/tỷ lệ|chia sẻ|chia |quy đổi|đổi /i, 'swap', 'accent'],
  [/bảng kê|báo cáo|hồ sơ|phát hành|tài liệu|chứng từ|file|xuất /i, 'file', 'accent'],
  [/kế toán|sổ |bút toán|nhật ký/i, 'book', 'accent'],
  [/bài hát|bản ghi|danh mục|track|album|đĩa|lượt nghe|playlist/i, 'disc', 'accent'],
  [/nền tảng|cửa hàng|kênh|store|spotify|apple|youtube/i, 'shop', 'accent'],
  [/đối tác|nghệ sĩ|label|khách|nhân sự|đội |nhân viên|người |tài khoản|liên hệ/i, 'user', 'accent'],
  [/tổ chức|cây |khối |bộ phận|phân quyền|quyền/i, 'tree', 'accent'],
  [/kỳ |tháng|quý|năm|lịch|thời hạn|hạn /i, 'cal', 'accent'],
  [/ticket|hỗ trợ|yêu cầu|đề nghị/i, 'ask', 'accent'],
  [/chiến dịch|quảng bá|marketing/i, 'globe', 'accent'],
  [/cài đặt|cấu hình|quản trị|hệ thống/i, 'gear', 'accent'],
  [/danh sách|bảng |dòng |chi tiết/i, 'list', 'accent'],
  [/nhiệm vụ|việc |quy trình|bước/i, 'layers', 'accent']
];
function suyHieu(chu) {
  var t = String(chu || '').replace(/<[^>]*>/g, ' ');
  for (var i = 0; i < HIEU.length; i++) if (HIEU[i][0].test(t)) return { icon: HIEU[i][1], mau: HIEU[i][2] };
  return { icon: (HT.manNay && HT.manNay.icon) || 'grid', mau: 'accent' };
}
function huyHieu(chu, o) {
  o = o || {};
  var g = suyHieu(chu);
  var ic = o.icon === false ? '' : icon(o.icon || g.icon);
  return '<h2 class="cbadge cb-' + (o.mau || g.mau) + '">' + ic + '<span>' + chu + '</span></h2>';
}
function the(o) {
  return '<div class="card"' + (o.id ? ' id="' + esc(o.id) + '"' : '') + '>' +
    (o.dai ? '<div class="ribbon ' + o.dai.kieu + '">' + icon(o.dai.icon || 'info') +
      '<span>' + o.dai.chu + '</span></div>' : '') +
    (o.h2 || o.hanhDong ? '<div class="card-h">' +
      (o.h2 ? huyHieu(o.h2, o) + giup(o.p) : '') +
      '<div class="sp"></div>' +
      (o.hanhDong ? '<div class="btnrow">' + o.hanhDong + '</div>' : '') + '</div>' : '') +
    (o.thoBody ? o.than : '<div class="card-b">' + (o.than || '') + '</div>') +
    (o.chan ? '<div class="card-f">' + o.chan + '</div>' : '') + '</div>';
}

/* ---- tab trong màn ---- */
function tabs(list, cur) {
  return '<div class="tabs">' + list.map(function (t) {
    return '<button type="button" data-tab="' + esc(t.k) + '"' +
      (t.k === cur ? ' class="on"' : '') + '>' + (t.icon ? icon(t.icon) : '') +
      /* Số đếm cạnh nhãn tab: dùng --ink-2 chứ không phải --faint. Thanh
         tab nằm trên nền trang (đậm hơn nền thẻ), nên màu mờ nhất vừa đủ
         đọc trên thẻ lại hụt chuẩn ở đây. */
      esc(t.l) + (t.dem != null ? ' <span class="muted">(' + esc(t.dem) + ')</span>' : '') + '</button>';
  }).join('') + '</div>';
}

/* ---- ô trống ---- */
function trong(o) {
  return '<div class="empty">' + icon(o.icon || 'empty') +
    '<b>' + esc(o.tieuDe) + '</b><span>' + (o.moTaHtml || esc(o.moTa || '')) + '</span>' +
    (o.nut ? '<div class="btnrow">' + o.nut + '</div>' : '') + '</div>';
}

/* ---- ô ghi chú ---- */
/* o.dong = khoá: ghi chú tắt được, nhớ trong trình duyệt để không hiện lại. */
function daTat(k) { try { return localStorage.getItem('haustek.ghi.' + k) === '1'; } catch (e) { return false; } }
function ghi(o) {
  if (o.dong && daTat(o.dong)) return '';
  return '<div class="note ' + (o.kieu || 'info') + '">' + icon(o.icon || (o.kieu === 'no' ? 'alert' : o.kieu === 'ok' ? 'check' : 'info')) +
    '<div style="min-width:0;flex:1"><b>' + (o.tieuDe || '') + '</b>' +
    (o.than ? '<p>' + o.than + '</p>' : '') + '</div>' +
    (o.nut ? '<div class="btnrow" style="align-self:center">' + o.nut + '</div>' : '') +
    (o.dong ? '<button type="button" class="note-x" data-ghi-dong="' + esc(o.dong) + '" aria-label="' + esc(HT.lang === 'en' ? 'Dismiss' : 'Đóng') + '" title="' + esc(HT.lang === 'en' ? 'Dismiss' : 'Đóng') + '">' + icon('x') + '</button>' : '') + '</div>';
}
/* Menu tràn: một nút ⋯ mở danh sách thao tác phụ. Dùng <details> nên không
   cần trạng thái; danh sách định vị cố định lúc mở để không bị khung bảng
   cắt. Các nút bên trong vẫn nhận sự kiện qua HM.bam của màn. */
function menu(items, o) {
  o = o || {};
  var ds = (items || []).filter(Boolean);
  if (!ds.length) return '';
  return '<details class="menu"><summary class="btn sm ghost" aria-label="' + esc(o.nhan || (HT.lang === 'en' ? 'More' : 'Thêm')) + '" title="' + esc(o.nhan || (HT.lang === 'en' ? 'More' : 'Thêm')) + '">' + icon('more') + '</summary>' +
    '<div class="menu-list">' + ds.join('') + '</div></details>';
}
/* hộp chú thích nổi cho nút ? : rê chuột thì hiện, bấm thì ghim, Esc / bấm ngoài thì đóng */
var _tip = null, _tipGhim = null;
function tipBox() { if (!_tip) { _tip = document.createElement('div'); _tip.className = 'tipbox'; _tip.hidden = true; document.body.appendChild(_tip); } return _tip; }
function tipHien(nut) {
  var b = tipBox(); b.innerHTML = nut.getAttribute('data-giup') || ''; b.hidden = false;
  var r = nut.getBoundingClientRect(); b.style.left = '0px'; b.style.top = '0px';
  var w = b.offsetWidth, h = b.offsetHeight;
  var left = Math.max(8, Math.min(r.left - 8, window.innerWidth - w - 8));
  var top = r.bottom + 8; if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
  b.style.left = left + 'px'; b.style.top = top + 'px';
}
function tipAn() { if (_tip) _tip.hidden = true; if (_tipGhim) { _tipGhim.classList.remove('on'); _tipGhim = null; } }
document.addEventListener('mouseover', function (e) { var n = e.target.closest && e.target.closest('.help'); if (n && !_tipGhim) tipHien(n); });
document.addEventListener('mouseout', function (e) { var n = e.target.closest && e.target.closest('.help'); if (n && !_tipGhim) tipAn(); });
document.addEventListener('focusin', function (e) { var n = e.target.closest && e.target.closest('.help'); if (n && !_tipGhim) tipHien(n); });
document.addEventListener('focusout', function (e) { var n = e.target.closest && e.target.closest('.help'); if (n && !_tipGhim) tipAn(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tipAn(); });
document.addEventListener('click', function (e) {
  var n = e.target.closest && e.target.closest('.help');
  if (n) { e.preventDefault(); if (_tipGhim === n) { tipAn(); } else { tipAn(); _tipGhim = n; n.classList.add('on'); tipHien(n); } return; }
  if (_tipGhim && !(e.target.closest && e.target.closest('.tipbox'))) tipAn();
});
document.addEventListener('click', function (e) {
  var x = e.target.closest('[data-ghi-dong]');
  if (x) { try { localStorage.setItem('haustek.ghi.' + x.getAttribute('data-ghi-dong'), '1'); } catch (err) {} var n = x.closest('.note'); if (n) n.remove(); return; }
  document.querySelectorAll('details.menu[open]').forEach(function (d) {
    if (!d.contains(e.target) || e.target.closest('.menu-list button')) d.removeAttribute('open');
  });
});
document.addEventListener('toggle', function (e) {
  var d = e.target; if (!d || !d.classList || !d.classList.contains('menu')) return;
  var ls = d.querySelector('.menu-list'); if (!ls) return;
  if (!d.open) { ls.style.cssText = ''; return; }
  var r = d.querySelector('summary').getBoundingClientRect();
  ls.style.position = 'fixed'; ls.style.visibility = 'hidden'; ls.style.top = '0'; ls.style.left = '0'; ls.style.right = 'auto';
  var w = ls.offsetWidth, h = ls.offsetHeight;
  var top = r.bottom + 4; if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
  var left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
  ls.style.top = top + 'px'; ls.style.left = left + 'px'; ls.style.visibility = '';
}, true);

/* ---- danh sách khoá : giá trị ---- */
function kv(rows) {
  return rows.filter(Boolean).map(function (r) {
    return '<dl class="kv"><dt>' + (r.tHtml ? r.t : esc(r.t)) + '</dt>' +
      '<dd' + (r.manh ? ' style="font-weight:600"' : '') + (r.mau ? ' class="' + r.mau + '"' : '') + '>' +
      (r.vHtml ? r.v : esc(r.v)) + '</dd></dl>';
  }).join('');
}

/* ---- nhãn ---- */
function tag(chu, kieu) { return '<span class="tag ' + (kieu || '') + '">' + esc(chu) + '</span>'; }
function cham(kieu, chu) { return '<span class="dot ' + kieu + '"></span>' + esc(chu); }

/* ---- gắn sự kiện theo uỷ nhiệm ---- */
function bam(root, sel, fn) {
  root.addEventListener('click', function (e) {
    var el = e.target.closest(sel);
    /* không chặn mặc định khi bấm vào ô nhập / ô chọn: checkbox phải còn đổi được trạng thái */
    if (el && root.contains(el)) { if (!e.target.closest('input,select,textarea,label,summary,a[href^="http"]')) e.preventDefault(); fn(el, e); }
  });
}
function doi(root, sel, fn) {
  root.addEventListener('change', function (e) {
    var el = e.target.closest(sel);
    if (el && root.contains(el)) fn(el, e);
  });
}
function nhap(root, sel, fn, cho) {
  var hen = null;
  root.addEventListener('input', function (e) {
    var el = e.target.closest(sel);
    if (!el || !root.contains(el)) return;
    clearTimeout(hen);
    hen = setTimeout(function () { fn(el); }, cho == null ? 180 : cho);
  });
}

/* ---------------------------------------------------------------------
   Xuất CSV
   Dấu phân cách là chấm phẩy và có BOM ở đầu: Excel bản tiếng Việt mở
   file dấu phẩy không có BOM thì dồn hết vào một cột và mất dấu.
   --------------------------------------------------------------------- */
function csv(ten, cot, dong) {
  var q = function (v) {
    if (v == null) return '';
    var s = String(v);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  var txt = '\uFEFF' + cot.map(q).join(';') + '\n' +
    dong.map(function (r) { return r.map(q).join(';'); }).join('\n');
  var vi = HT.lang !== 'en';
  var soDong = dong.length.toLocaleString(vi ? 'vi-VN' : 'en-US');
  var baoXong = function () {
    HT.thongBao(vi ? 'Đã xuất ' + ten + ' · ' + soDong + ' dòng' : 'Exported ' + ten + ' · ' + soDong + ' rows', 'ok');
  };
  var baoKhongTai = function () {
    HT.thongBao(vi ? 'Trình xem này không cho phép lưu file. Mở bản mã nguồn để xuất ' + ten
                   : 'This viewer does not allow saving files. Open the source build to export ' + ten, 'no');
  };

  /* Tải thẳng: bản nhiều file, hoặc bản gói mở thẳng từ repo. */
  function taiThang() {
    try {
      var b = new Blob([txt], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = ten;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
      /* Khung cách ly của trình xem chặn mọi lượt tải file: không báo lỗi,
         chỉ đơn giản không có gì xảy ra. Nói ra còn hơn để người dùng bấm
         ba lần rồi tưởng nút hỏng. */
      if (global.HAUSTEK_XEM_ONLINE) baoKhongTai(); else baoXong();
    } catch (e) {
      HT.thongBao((vi ? 'Trình duyệt chặn tải file: ' : 'The browser blocked the download: ') + e.message, 'no');
    }
  }

  /* Trong trình xem artifact, trang không được tải file thẳng, nhưng được
     ĐƯA file cho người xem qua claude.use('downloads'): người xem thấy hộp
     xác nhận tên file và cỡ, đồng ý thì mới lưu. Có đường đó thì đi đường
     đó; không có (bản nhiều file, hay trình xem không cấp) thì tải thẳng. */
  var claude = global.claude;
  if (!claude || typeof claude.use !== 'function') { taiThang(); return; }
  claude.use('downloads').then(function (dl) {
    if (!dl) { taiThang(); return; }
    return dl.save({ filename: ten, data: txt }).then(baoXong, function (e) {
      var ma = e && e.code;
      if (ma === 'declined') return;   /* người xem đã từ chối, không cần nói thêm */
      if (ma === 'rate_limited') {
        HT.thongBao(vi ? 'Một hộp thoại lưu file đang chờ trả lời. Trả lời xong rồi bấm lại.'
                       : 'A save prompt is still open. Answer it, then try again.', 'no');
        return;
      }
      baoKhongTai();
    });
  }, taiThang);
}

/* ---------------------------------------------------------------------
   So sánh hai kỳ — trả về chuỗi "▲ 12,4% so với 05/2026"
   --------------------------------------------------------------------- */
function lech(nay, truoc, nhanTruoc) {
  if (truoc == null || !truoc) return null;
  var d = (nay - truoc) / truoc;
  var pt = Math.abs(d * 100).toFixed(1);
  if (HT.lang !== 'en') pt = pt.replace('.', ',');
  var s = (d >= 0 ? '▲ ' : '▼ ') + pt + '%';
  var noi = HT.lang === 'en' ? ' vs ' : ' so với ';
  return { chu: s + (nhanTruoc ? noi + nhanTruoc : ''), duong: d >= 0, ty: d };
}
function lechHtml(nay, truoc, nhanTruoc) {
  var l = lech(nay, truoc, nhanTruoc);
  if (!l) return '';
  return '<span class="' + (l.duong ? 'pos' : 'neg') + '">' + esc(l.chu) + '</span>';
}


/* ---------------------------------------------------------------------
   Nhớ tạm kết quả nặng
   Tổng hợp một kỳ là quét 50.000 bản ghi. Vẽ biểu đồ 12 kỳ tách theo ba
   luồng là 1,8 triệu lượt — bấm đổi sáng/tối một cái là trang đứng hình
   nửa giây. Nhớ lại theo DẤU MỐC của trạng thái: admin duyệt kỳ hay nạp
   thêm luồng thì dấu mốc đổi và bộ nhớ tạm tự bỏ đi, nên không bao giờ
   hiện số cũ sau khi vừa thay đổi.
   --------------------------------------------------------------------- */
var _nho = {}, _moc = null;
function moc(A) {
  if (!A || !A.state) return 'khach';
  var s = A.state();
  return [Object.keys(s.approved).length, s.queue.length, s.rates.length,
          Object.keys(s.match).length, Object.keys(s.variance).length,
          Object.keys(s.advances).length, s.publishedAt,
          Object.keys(s.feeds).map(function (k) {
            return Object.keys(s.feeds[k]).map(function (f) { return s.feeds[k][f].status[0]; }).join('');
          }).join(''),
          Object.keys(s.pub).map(function (k) { return s.pub[k].status[0]; }).join('')].join('|');
}
function nho(A, key, fn) {
  var m = moc(A);
  if (_moc !== m) { _nho = {}; _moc = m; }
  if (!(key in _nho)) _nho[key] = fn();
  return _nho[key];
}
function quenHet() { _nho = {}; _moc = null; }

/* ---------------------------------------------------------------------
   Ảnh bìa và ảnh đại diện
   Bản mẫu không có file ảnh thật, nên mỗi bài hát / bản phát hành nhận
   một bìa SVG sinh XÁC ĐỊNH từ mã (cùng mã thì cùng bìa ở mọi trang, cả
   hai cổng): nền chuyển sắc hai màu, một hình gợi ý, hai chữ cái đầu tên.
   Hệ thống thật thay bằng <img> tới kho ảnh; kích cỡ và lớp CSS giữ nguyên.
   --------------------------------------------------------------------- */
function hashChu(s) {
  s = String(s == null ? '' : s);
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function chuDau(ten) {
  var w = String(ten || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  var c = w.length > 1 ? w[0].charAt(0) + w[1].charAt(0) : (w[0] || '♪').slice(0, 2);
  return c.toUpperCase();
}
function bia(seed, ten, cls) {
  var h = typeof seed === 'number' ? (Math.imul(seed + 1, 2654435761) >>> 0) : hashChu(seed);
  var h1 = h % 360, h2 = (h1 + 35 + ((h >>> 7) % 110)) % 360, kieu = (h >>> 17) % 6;
  var c1 = 'hsl(' + h1 + ' 62% 46%)', c2 = 'hsl(' + h2 + ' 70% 28%)', c3 = 'hsl(' + ((h1 + 180) % 360) + ' 75% 68%)';
  var id = 'bia' + h.toString(36);
  var hinh = kieu === 0 ? '<circle cx="31" cy="11" r="15" fill="' + c3 + '" opacity=".55"/>'
    : kieu === 1 ? '<path d="M0 40 L40 6 L40 40 Z" fill="' + c3 + '" opacity=".45"/>'
    : kieu === 2 ? '<circle cx="20" cy="20" r="13.5" fill="none" stroke="' + c3 + '" stroke-width="3" opacity=".65"/>'
    : kieu === 3 ? '<rect x="-8" y="25" width="56" height="7" transform="rotate(-22 20 20)" fill="' + c3 + '" opacity=".5"/>'
    : kieu === 4 ? '<circle cx="8" cy="33" r="11" fill="' + c3 + '" opacity=".5"/><circle cx="34" cy="6" r="6" fill="#fff" opacity=".35"/>'
    : '<path d="M0 30 Q10 18 20 30 T40 30 V40 H0 Z" fill="' + c3 + '" opacity=".5"/>';
  return '<svg class="bia' + (cls ? ' ' + cls : '') + '" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
    '<rect width="40" height="40" fill="url(#' + id + ')"/>' + hinh +
    '<text x="20" y="25.5" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" fill-opacity=".92" font-family="inherit" letter-spacing=".5">' + esc(chuDau(ten)) + '</text></svg>';
}
function hinh(ten, seed, cls) {
  var h = hashChu(seed != null ? seed : ten), hue = h % 360, hue2 = (hue + 42) % 360;
  /* Chữ trắng trên nền màu: vàng / lục / lam nhạt (40°–190°) sáng hơn các
     màu khác ở cùng độ sáng HSL, nên hạ độ sáng để giữ tương phản ≥ 4,5.
     background-color đặc là màu cuối của gradient — trình duyệt và phép
     kiểm tương phản đọc màu này, gradient chỉ là lớp trang trí bên trên. */
  var toi = (hue2 >= 40 && hue2 <= 190) ? 29 : 36;
  var nen = 'hsl(' + hue2 + ' 58% ' + toi + '%)';
  return '<span class="hinh' + (cls ? ' ' + cls : '') + '" aria-hidden="true" style="background-color:' + nen + ';background-image:linear-gradient(135deg,hsl(' + hue + ' 55% ' + (toi + 8) + '%),' + nen + ')">' + esc(chuDau(ten)) + '</span>';
}
/* Ô số kèm thanh tỷ lệ mảnh, đặt trong <td class="num">: thấy hình ngay
   trong bảng, không phải đọc từng số. max là giá trị lớn nhất của cột. */
function oThanh(v, max, o) {
  o = o || {};
  var p = max > 0 ? Math.max(0, Math.min(100, v / max * 100)) : 0;
  var chu = o.chu != null ? o.chu : HT.fmt.n(v);
  return '<span class="cb"' + (o.mau ? ' style="--cb-mau:' + o.mau + '"' : '') + '><b>' + esc(chu) + '</b><i style="--p:' + p.toFixed(1) + '%"></i></span>';
}
/* Ô tên có bìa bên trái: dùng trong <td> và danh sách. */
function tenBia(o) {
  return '<div class="t-bia">' + (o.bia != null ? bia(o.bia, o.ten, o.cls || '') : hinh(o.ten, o.seed, o.cls || '')) +
    '<div><div class="t-ttl">' + (o.tenHtml || esc(o.ten)) + '</div>' + (o.phu ? '<div class="t-sub">' + (o.phuHtml ? o.phu : esc(o.phu)) + '</div>' : '') + '</div></div>';
}
/* Danh sách xếp hạng có bìa, thanh tỷ lệ và chênh lệch: top bài, top playlist, top nghệ sĩ. */
function xepHang(rows, o) {
  o = o || {};
  var max = 0; rows.forEach(function (r) { if (r.gt > max) max = r.gt; });
  var dd = o.dinhDang || function (v) { return HT.fmt.n(v); };
  return '<ol class="rank">' + rows.map(function (r, i) {
    var pct = max > 0 ? Math.max(2, r.gt / max * 100) : 0;
    return '<li' + (r.attr ? ' ' + r.attr : '') + (r.pick ? ' class="pick"' : '') + '><span class="no">' + (i + 1) + '</span>' +
      (r.bia != null ? bia(r.bia, r.ten, 'sm') : r.hinh ? hinh(r.ten, r.seed, 'sm') : '<span></span>') +
      '<div class="rk-t"><div class="t-ttl">' + esc(r.ten) + '</div>' + (r.phu ? '<div class="t-sub">' + esc(r.phu) + '</div>' : '') +
        '<div class="rk-bar"><i style="width:' + pct.toFixed(1) + '%' + (r.mau ? ';background:' + r.mau : '') + '"></i></div></div>' +
      '<div class="rk-v"><b>' + esc(dd(r.gt)) + '</b>' + (r.lech != null && r.lech.chu ? '<span class="' + (r.lech.duong ? 'pos' : 'neg') + '">' + esc(r.lech.chu) + '</span>' : (r.phuV ? '<span class="muted">' + esc(r.phuV) + '</span>' : '')) + '</div></li>';
  }).join('') + '</ol>';
}

/* =====================================================================
   BẢN IN — xem trước rồi mới in, và in ra là ra PDF
   ---------------------------------------------------------------------
   Trình duyệt nào cũng có sẵn "In → Lưu thành PDF", nên chỗ cần làm không
   phải là dựng một bộ sinh PDF mà là dựng đúng cái trang được in: khổ
   giấy, chữ đen trên nền trắng, bảng có viền, đầu trang có tên công ty,
   kỳ báo cáo, ngày in và người in.

   Overlay hiện trước để người dùng nhìn thấy đúng thứ sắp ra giấy. Nút In
   gọi window.print(); nếu trình duyệt chặn (một số khung nhúng chặn hộp
   thoại), overlay vẫn còn đó và Ctrl+P vẫn ra đúng bản này.
   ===================================================================== */
var _inLop = null;
function dongIn() {
  if (_inLop) { _inLop.remove(); _inLop = null; }
  document.body.classList.remove('dang-in');
}
function banIn(o) {
  o = o || {};
  dongIn();
  var vi = HT.lang !== 'en';
  var ngay = new Date();
  var dNgay = String(ngay.getDate()).padStart(2, '0') + '.' + String(ngay.getMonth() + 1).padStart(2, '0') + '.' + ngay.getFullYear();
  var nguoi = o.nguoi || '';
  var el = document.createElement('div');
  el.className = 'in-lop';
  el.innerHTML =
    '<div class="in-thanh">' +
      '<b>' + esc(vi ? 'Bản in' : 'Print view') + '</b>' +
      '<span class="sp"></span>' +
      '<button type="button" class="btn sm" data-in-in>' + icon('file') + (vi ? 'In · Lưu PDF' : 'Print · Save PDF') + '</button>' +
      '<button type="button" class="btn sm ghost" data-in-dong>' + icon('x') + (vi ? 'Đóng' : 'Close') + '</button>' +
    '</div>' +
    '<div class="in-cuon"><div class="in-giay">' +
      '<div class="in-dau">' +
        '<div class="in-hieu">HAUSTEK<span>' + esc(vi ? 'Công ty phân phối âm nhạc' : 'Music distribution') + '</span></div>' +
        '<div class="in-meta">' +
          (o.ky ? '<div>' + esc(vi ? 'Kỳ' : 'Period') + ': <b>' + esc(o.ky) + '</b></div>' : '') +
          '<div>' + esc(vi ? 'Ngày in' : 'Printed') + ': <b>' + esc(dNgay) + '</b></div>' +
          (nguoi ? '<div>' + esc(vi ? 'Người in' : 'By') + ': <b>' + esc(nguoi) + '</b></div>' : '') +
        '</div>' +
      '</div>' +
      '<h1 class="in-ttl">' + esc(o.tieuDe || '') + '</h1>' +
      (o.phu ? '<p class="in-phu">' + esc(o.phu) + '</p>' : '') +
      '<div class="in-than">' + (o.than || '') + '</div>' +
      '<div class="in-chan">' + (o.chan
        ? esc(o.chan)
        : esc(vi ? 'Bản in nội bộ Haustek. Số liệu tính tới ngày in; kỳ chưa xét duyệt có thể còn đổi.'
                 : 'Haustek internal print. Figures as of the print date; unapproved periods may still change.')) + '</div>' +
    '</div></div>';
  document.body.appendChild(el);
  _inLop = el;
  document.body.classList.add('dang-in');
  el.querySelector('[data-in-dong]').addEventListener('click', dongIn);
  el.querySelector('[data-in-in]').addEventListener('click', function () {
    try { window.print(); } catch (e) { /* khung nhúng chặn: overlay vẫn còn, Ctrl+P vẫn đúng */ }
  });
  el.addEventListener('click', function (e) { if (e.target === el) dongIn(); });
  el.querySelector('[data-in-in]').focus();
  return el;
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && _inLop) dongIn(); });

/* Chép một chuỗi vào bộ nhớ tạm. Nhân viên ngồi gõ lại metadata sang
   OneRPM sẽ bấm nút này vài chục lần một hồ sơ, nên nó phải chạy được ở
   MỌI chỗ: trang thường, file:// và cả khung sandbox của trình xem
   artifact — chỗ mà navigator.clipboard bị chặn không báo lỗi. Nên thử
   API mới trước, hỏng thì rơi xuống execCommand trên một textarea tạm. */
function chep(chu) {
  var s = String(chu == null ? '' : chu);
  if (!s) return Promise.resolve(false);
  function cachCu() {
    try {
      var o = document.createElement('textarea');
      o.value = s;
      o.setAttribute('readonly', '');
      o.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(o);
      o.select(); o.setSelectionRange(0, s.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(o);
      return !!ok;
    } catch (e) { return false; }
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText)
      return navigator.clipboard.writeText(s).then(function () { return true; },
        function () { return cachCu(); });
  } catch (e) {}
  return Promise.resolve(cachCu());
}

global.HM = {
  chep: chep,
  dau: dau, so: so, the: the, huyHieu: huyHieu, suyHieu: suyHieu, tabs: tabs, trong: trong, ghi: ghi, menu: menu, kv: kv,
  hoi: hoi, banIn: banIn, dongIn: dongIn,
  tag: tag, cham: cham, bam: bam, doi: doi, nhap: nhap, csv: csv,
  lech: lech, lechHtml: lechHtml, dai: dai, esc: esc, icon: icon,
  nho: nho, quenHet: quenHet, moc: moc,
  bia: bia, hinh: hinh, tenBia: tenBia, xepHang: xepHang, hashChu: hashChu, oThanh: oThanh
};

})(window);
