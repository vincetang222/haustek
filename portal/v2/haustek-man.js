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
function dau(o) {
  return '<div class="page"><div><h1>' + (o.h1 || '') + giup(o.mo) + '</h1></div>' +
    (o.so && o.so.length ? '<div class="page-kpis">' + o.so.map(function (k) {
      return '<div class="page-kpi"><div class="l">' + esc(k.l) + '</div>' +
        '<div class="v"' + (k.mau ? ' style="color:' + k.mau + '"' : '') + '>' + esc(k.v) + '</div></div>';
    }).join('') + '</div>' : '') +
    (o.nut ? '<div class="page-act">' + o.nut + '</div>' : '') + '</div>';
}

/* ---- dải ô số ---- */
/* Ô số. `di` biến ô thành một đường dẫn: bấm vào con số "4 việc quá hạn"
   phải ra đúng bốn việc ấy, chứ không phải bắt người ta tự đi tìm. Sự kiện
   do shell uỷ nhiệm ở tầng document, nên ô số sống qua mọi lần vẽ lại. */
function so(list) {
  return '<div class="kpis">' + list.filter(Boolean).map(function (k) {
    var mo = k.di
      ? ' data-di="' + esc(k.di) + '"' + Object.keys(k.loc || {}).map(function (x) {
          return ' data-loc-' + esc(x) + '="' + esc(k.loc[x]) + '"'; }).join('') + ' role="link" tabindex="0"'
      : '';
    return '<div class="kpi' + (k.lon ? ' hero' : '') + (k.di ? ' bam' : '') + '"' + mo +
      (k.tip ? ' data-tip="' + esc(k.tip) + '"' : '') + '>' +
      '<div class="l">' + esc(k.l) + '</div>' +
      '<div class="v' + (!k.html && String(k.v == null ? '' : k.v).length >= 12 ? ' dai' : '') + '">' + (k.html || esc(k.v)) + '</div>' +
      (k.s ? '<div class="s">' + (k.sHtml ? k.s : esc(k.s)) + '</div>' : '') +
      '</div>';
  }).join('') + '</div>';
}

/* ---- thẻ ---- */
function the(o) {
  return '<div class="card"' + (o.id ? ' id="' + esc(o.id) + '"' : '') + '>' +
    (o.dai ? '<div class="ribbon ' + o.dai.kieu + '">' + icon(o.dai.icon || 'info') +
      '<span>' + o.dai.chu + '</span></div>' : '') +
    (o.h2 || o.hanhDong ? '<div class="card-h"><div style="min-width:0"><h2>' + (o.h2 || '') + giup(o.p) + '</h2>' +
      '</div><div class="sp"></div>' +
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
/* Hai trạng thái rỗng, hai nghĩa khác nhau.
   trong({...})               — chưa có gì, mời thêm vào.
   trong({ xong:true, diem })  — có, và đã xong hết. Đây là tin vui và phải
   trông ra tin vui; `diem` là mấy con số để khoe: [{ n, l }]. */
function trong(o) {
  return '<div class="empty' + (o.xong ? ' xong' : '') + '">' + icon(o.icon || (o.xong ? 'check' : 'empty')) +
    '<b>' + esc(o.tieuDe) + '</b><span>' + (o.moTaHtml || esc(o.moTa || '')) + '</span>' +
    (o.diem && o.diem.length ? '<div class="diem">' + o.diem.map(function (d) {
      return '<span><b>' + esc(String(d.n)) + '</b>' + esc(d.l) + '</span>'; }).join('') + '</div>' : '') +
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
/* Dấu mốc phải KHÔNG BIẾT GÌ về hình dạng state của lõi. Bản trước đọc
   thẳng s.approved, s.queue, s.feeds... nên đổi lõi là khung chết ngay ở
   dòng Object.keys, trước cả khi trang kịp vẽ ra chữ nào.

   Ở đây chỉ hỏi một câu lõi nào cũng trả lời được: dữ liệu đã đổi bao
   nhiêu lần rồi. Lõi khai `A.moc()` thì dùng; không khai thì đếm kích
   thước các mảng cấp một, đủ để biết có gì vừa thêm hay vừa bớt. */
function moc(A) {
  if (!A) return 'khach';
  if (typeof A.moc === 'function') { try { return String(A.moc()); } catch (e) { return 'loi'; } }
  if (typeof A.state !== 'function') return 'tinh';
  var s;
  try { s = A.state(); } catch (e) { return 'loi'; }
  if (!s || typeof s !== 'object') return 'trong';
  var ra = [];
  Object.keys(s).sort().forEach(function (k) {
    var v = s[k];
    ra.push(k + ':' + (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : String(v).slice(0, 12)));
  });
  return ra.join('|');
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

/* ---------------------------------------------------------------------
   Biểu mẫu, phân trang, thanh tiến độ · gộp về từ haustek-them.js
   --------------------------------------------------------------------- */
/* Ô nhập nào không bắt buộc thì NÓI RÕ là không bắt buộc, thay vì đánh dấu
   sao vào những ô bắt buộc rồi để người ta tự suy ra phần còn lại. */
function form(fields) {
  return '<div class="fldrow two-up">' + fields.filter(Boolean).map(function (f) {
    var id = 'data-o="' + esc(f.k) + '"', req = f.req ? ' *' : '';
    var kbb = !f.req && f.kbb !== false && f.kieu !== 'hidden' && f.kieu !== 'check'
      ? ' <span class="kbb">(không bắt buộc)</span>' : '';
    var than;
    if (f.kieu === 'hidden') return '<input type="hidden" ' + id + ' value="' + esc(f.v == null ? '' : f.v) + '">';
    if (f.kieu === 'select') than = '<select class="in" ' + id + '>' + (f.opts || []).map(function (x) {
      return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(f.v == null ? '' : f.v) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select>';
    else if (f.kieu === 'textarea') than = '<textarea class="in" ' + id + ' rows="' + (f.rows || 3) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + '>' + esc(f.v == null ? '' : f.v) + '</textarea>';
    else if (f.kieu === 'check') return '<div class="fgrp' + (f.rong ? ' span2' : '') + '"><label class="tickrow"><input type="checkbox" ' + id + (f.v ? ' checked' : '') + ' value="1"><span>' + esc(f.l) + '</span></label>' + (f.hint ? '<div class="fhint">' + esc(f.hint) + '</div>' : '') + '</div>';
    else than = '<input class="in" ' + id + ' type="' + (f.kieu || 'text') + '" value="' + esc(f.v == null ? '' : f.v) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.list ? ' list="' + esc(f.list) + '"' : '') + '>';
    return '<div class="fgrp' + (f.rong ? ' span2' : '') + '"><label class="fld">' + esc(f.l) + req + kbb + '</label>' + than + (f.hint ? '<div class="fhint">' + esc(f.hint) + '</div>' : '') + '</div>';
  }).join('') + '</div>';
}
function hoiForm(c, o) {
  return c.hoiThoai({ tieuDe: o.tieuDe, moTa: o.moTa ? esc(o.moTa) : '', than: form(o.fields) + (o.them || ''),
    dong: o.dong, rong: o.rong !== false, khiMo: o.khiMo }).then(function (f) {
    if (!f) return null;
    var thieu = o.fields.filter(Boolean).filter(function (x) { return x.req && !String(f[x.k] == null ? '' : f[x.k]).trim(); });
    /* Nói thiếu ô nào, không nói "biểu mẫu không hợp lệ" rồi để người ta dò. */
    if (thieu.length) { c.thongBao('Còn thiếu: ' + thieu.map(function (x) { return x.l; }).join(', '), 'no'); return null; }
    o.fields.filter(Boolean).forEach(function (x) { if (x.kieu === 'check') f[x.k] = f[x.k] === '1' || f[x.k] === 'on' || f[x.k] === true; });
    return f;
  });
}
function phanTrang(rows, st, co) {
  co = co || 25;
  var het = Math.max(0, Math.ceil(rows.length / co) - 1);
  if (!(st.trang >= 0)) st.trang = 0;
  if (st.trang > het) st.trang = het;
  var a = st.trang * co;
  return { page: rows.slice(a, a + co), chan: rows.length > co
    ? '<div class="card-f"><div class="range">' + (a + 1) + '–' + Math.min(rows.length, a + co) + ' trong ' + rows.length + '</div>' +
      '<div class="pager"><button type="button" class="pg" data-hm-tr="-1"' + (st.trang === 0 ? ' disabled' : '') + '>' + icon('left') + '</button>' +
      '<span class="range">' + (st.trang + 1) + ' / ' + (het + 1) + '</span>' +
      '<button type="button" class="pg" data-hm-tr="1"' + (a + co >= rows.length ? ' disabled' : '') + '>' + icon('right') + '</button></div></div>' : '' };
}
function ganTrang(root, st, veLai) {
  bam(root, '[data-hm-tr]', function (el) { st.trang = (st.trang || 0) + (+el.getAttribute('data-hm-tr')); veLai(); });
}
/* Tiến độ. Phase 1 không có biểu đồ nào; mọi thứ "bao nhiêu phần trăm rồi"
   đều là thanh này. */
function thanh(xong, tong, nhan) {
  var p = tong > 0 ? Math.round(xong / tong * 100) : 0;
  return '<div class="meter" role="img" aria-label="' + esc((nhan || '') + ' ' + p + '%') + '">' +
    '<i style="width:' + p + '%"></i></div>';
}

global.HM = {
  dau: dau, so: so, the: the, tabs: tabs, trong: trong, ghi: ghi, menu: menu, kv: kv,
  tag: tag, cham: cham, bam: bam, doi: doi, nhap: nhap, csv: csv,
  lech: lech, lechHtml: lechHtml, dai: dai, esc: esc, icon: icon,
  nho: nho, quenHet: quenHet, moc: moc,
  bia: bia, hinh: hinh, tenBia: tenBia, xepHang: xepHang, hashChu: hashChu, oThanh: oThanh,
  form: form, hoiForm: hoiForm, phanTrang: phanTrang, ganTrang: ganTrang, thanh: thanh
};

})(window);
