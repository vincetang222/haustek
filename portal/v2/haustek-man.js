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
function dau(o) {
  return '<div class="page"><div><h1>' + (o.h1 || '') + '</h1>' +
    (o.mo ? '<p>' + o.mo + '</p>' : '') + '</div>' +
    (o.so && o.so.length ? '<div class="page-kpis">' + o.so.map(function (k) {
      return '<div class="page-kpi"><div class="l">' + esc(k.l) + '</div>' +
        '<div class="v"' + (k.mau ? ' style="color:' + k.mau + '"' : '') + '>' + esc(k.v) + '</div></div>';
    }).join('') + '</div>' : '') + '</div>';
}

/* ---- dải ô số ---- */
function so(list) {
  return '<div class="kpis">' + list.map(function (k) {
    return '<div class="kpi' + (k.lon ? ' hero' : '') + '"' +
      (k.tip ? ' data-tip="' + esc(k.tip) + '"' : '') + '>' +
      '<div class="l">' + esc(k.l) + '</div>' +
      '<div class="v"' + (k.mau ? ' style="color:' + k.mau + '"' : '') + '>' + (k.html || esc(k.v)) + '</div>' +
      (k.s ? '<div class="s">' + (k.sHtml ? k.s : esc(k.s)) + '</div>' : '') + '</div>';
  }).join('') + '</div>';
}

/* ---- thẻ ---- */
function the(o) {
  return '<div class="card"' + (o.id ? ' id="' + esc(o.id) + '"' : '') + '>' +
    (o.dai ? '<div class="ribbon ' + o.dai.kieu + '">' + icon(o.dai.icon || 'info') +
      '<span>' + o.dai.chu + '</span></div>' : '') +
    (o.h2 || o.hanhDong ? '<div class="card-h"><div style="min-width:0"><h2>' + (o.h2 || '') + '</h2>' +
      (o.p ? '<p>' + o.p + '</p>' : '') + '</div><div class="sp"></div>' +
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
function ghi(o) {
  return '<div class="note ' + (o.kieu || 'info') + '">' + icon(o.icon || (o.kieu === 'no' ? 'alert' : o.kieu === 'ok' ? 'check' : 'info')) +
    '<div style="min-width:0;flex:1"><b>' + (o.tieuDe || '') + '</b>' +
    (o.than ? '<p>' + o.than + '</p>' : '') + '</div>' +
    (o.nut ? '<div class="btnrow" style="align-self:center">' + o.nut + '</div>' : '') + '</div>';
}

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
    if (el && root.contains(el)) { e.preventDefault(); fn(el, e); }
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
  var txt = '﻿' + cot.map(q).join(';') + '\n' +
    dong.map(function (r) { return r.map(q).join(';'); }).join('\n');
  try {
    var b = new Blob([txt], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = ten;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    /* Bản xem online chạy trong khung cách ly, và khung đó chặn mọi lượt
       tải file — không báo lỗi, chỉ đơn giản không có gì xảy ra. Nói ra
       còn hơn để người dùng bấm ba lần rồi tưởng nút hỏng. */
    if (global.HAUSTEK_XEM_ONLINE) {
      HT.thongBao('Bản xem online không tải file được — mở bản mã nguồn để xuất ' + ten, 'no');
    } else {
      HT.thongBao('Đã xuất ' + ten + ' · ' + dong.length.toLocaleString('vi-VN') + ' dòng', 'ok');
    }
  } catch (e) {
    HT.thongBao('Trình duyệt chặn tải file: ' + e.message, 'no');
  }
}

/* ---------------------------------------------------------------------
   So sánh hai kỳ — trả về chuỗi "▲ 12,4% so với 05/2026"
   --------------------------------------------------------------------- */
function lech(nay, truoc, nhanTruoc) {
  if (truoc == null || !truoc) return null;
  var d = (nay - truoc) / truoc;
  var s = (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d * 100).toFixed(1).replace('.', ',') + '%';
  return { chu: s + (nhanTruoc ? ' so với ' + nhanTruoc : ''), duong: d >= 0, ty: d };
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

global.HM = {
  dau: dau, so: so, the: the, tabs: tabs, trong: trong, ghi: ghi, kv: kv,
  tag: tag, cham: cham, bam: bam, doi: doi, nhap: nhap, csv: csv,
  lech: lech, lechHtml: lechHtml, dai: dai, esc: esc, icon: icon,
  nho: nho, quenHet: quenHet, moc: moc
};

})(window);
