/* =====================================================================
   HAUSTEK PORTAL v2 — BIỂU ĐỒ
   ---------------------------------------------------------------------
   Vẽ bằng SVG chứ không phải canvas, vì ba lý do:
     · màu lấy thẳng từ biến CSS, nên đổi sáng/tối là biểu đồ đổi theo,
       không phải vẽ lại bằng mã màu cứng;
     · từng cột là một phần tử thật, nên chỉ chuột và bàn phím đều chạm
       được — canvas thì phải tự tính toạ độ;
     · phóng to trang không vỡ nét.

   Cách dùng ở màn hình:
       root.innerHTML = '…' + HB.cot({ diem: […] }) + '…';
       HB.gan(root);          // đo bề ngang thật rồi vẽ
   Gọi HB.gan() một lần ở cuối hàm ve() là đủ cho mọi biểu đồ trong màn.
   ===================================================================== */
"use strict";
(function (global) {

var SO = 0;
var KHO = {};          /* id → cấu hình */
var DANG_TREO = [];    /* các biểu đồ đang gắn trên trang, để vẽ lại khi đổi bề ngang */

/* ---------------------------------------------------------------------
   Màu — đọc từ biến CSS mỗi lần vẽ, không nhớ lại.
   Nhớ lại là sai ngay lần đầu người dùng bấm nút đổi sáng/tối.
   --------------------------------------------------------------------- */
function mau(ten) {
  return getComputedStyle(document.documentElement).getPropertyValue('--' + ten).trim() || '#888';
}
function dayMau() {
  var s = getComputedStyle(document.documentElement), out = [];
  for (var i = 1; i <= 8; i++) out.push((s.getPropertyValue('--s' + i) || '').trim() || '#888');
  return out;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
/* Ngôn ngữ do khung giữ; biểu đồ đọc nhờ, không giữ bản sao — giữ bản sao
   là một ngày nào đó hai bên lệch nhau và trục tung viết một kiểu, ô số
   bên cạnh viết kiểu khác. */
function en() { return typeof HT !== 'undefined' && HT.lang === 'en'; }
/* Chữ hiện trong mách nước và chú thích của biểu đồ. Trước đây viết thẳng
   tiếng Việt, nên bật EN thì biểu đồ vẫn nói tiếng Việt. */
function T(vi, e) { return en() ? e : vi; }
function loc() { return en() ? 'en-US' : 'vi-VN'; }
function so(v) { return Math.round(v).toLocaleString(loc()); }
function usd0(v) { return (v < 0 ? '−$' : '$') + Math.round(Math.abs(v)).toLocaleString(loc()); }
/* Trục tung của báo cáo tiền: rút gọn tới mức đọc lướt được, nhưng không
   rút tới mức mất nghĩa. $1,2Tr thay cho $1.234.567 là được; $1Tr thì
   không, vì $1.4Tr cũng ra $1Tr. */
function thapPhan(x, n) {
  var s = x.toFixed(n);
  return en() ? s : s.replace('.', ',');
}
function gonTien(v) {
  var a = Math.abs(v), E = en();
  var dau = (v < 0 ? '−' : '') + '$';
  if (a >= 1e9) return dau + thapPhan(a / 1e9, a >= 1e10 ? 0 : 1) + (E ? 'B' : ' tỷ');
  if (a >= 1e6) return dau + thapPhan(a / 1e6, a >= 1e7 ? 0 : 1) + (E ? 'M' : 'Tr');
  if (a >= 1e3) return dau + Math.round(a / 1e3) + 'K';
  return usd0(v);
}
function gonSo(v) {
  var a = Math.abs(v), E = en();
  if (a >= 1e9) return thapPhan(a / 1e9, 1) + (E ? 'B' : ' tỷ');
  if (a >= 1e6) return thapPhan(a / 1e6, a >= 1e7 ? 0 : 1) + (E ? 'M' : 'Tr');
  if (a >= 1e3) return Math.round(a / 1e3) + 'K';
  return so(v);
}

/* ---------------------------------------------------------------------
   Chọn mốc trục tung cho ra số tròn mắt người, không phải số máy tính
   --------------------------------------------------------------------- */
function mocTruc(dinh, n) {
  n = n || 4;
  if (!(dinh > 0)) return { moc: [0], tran: 1 };
  var tho = dinh / n;
  var bac = Math.pow(10, Math.floor(Math.log(tho) / Math.LN10));
  var chuan = [1, 2, 2.5, 5, 10];
  var buoc = bac * 10;
  for (var i = 0; i < chuan.length; i++) {
    if (bac * chuan[i] >= tho) { buoc = bac * chuan[i]; break; }
  }
  var tran = Math.ceil(dinh / buoc) * buoc, moc = [];
  for (var v = 0; v <= tran + 1e-9; v += buoc) moc.push(v);
  return { moc: moc, tran: tran };
}

/* ---------------------------------------------------------------------
   Đăng ký một biểu đồ và trả về chỗ trống để nhét vào HTML
   --------------------------------------------------------------------- */
function o(cfg) {
  var id = 'bd' + (++SO);
  KHO[id] = cfg;
  return '<div class="bd" data-bd="' + id + '"' +
    (cfg.caoToiThieu ? ' style="min-height:' + cfg.caoToiThieu + 'px"' : '') + '></div>';
}

/* ---------------------------------------------------------------------
   Gắn: đo bề ngang thật của từng chỗ trống rồi vẽ
   --------------------------------------------------------------------- */
function gan(root) {
  root = root || document;
  DANG_TREO = DANG_TREO.filter(function (x) { return document.body.contains(x.el); });
  var ds = root.querySelectorAll('[data-bd]');
  for (var i = 0; i < ds.length; i++) {
    (function (el) {
      var cfg = KHO[el.getAttribute('data-bd')];
      if (!cfg) return;
      var mucNay = { el: el, cfg: cfg };
      DANG_TREO.push(mucNay);
      ve(el, cfg);
    })(ds[i]);
  }
}
function veLaiTatCa() {
  DANG_TREO = DANG_TREO.filter(function (x) { return document.body.contains(x.el); });
  DANG_TREO.forEach(function (x) { ve(x.el, x.cfg); });
}
var hen = null;
global.addEventListener('resize', function () {
  clearTimeout(hen);
  hen = setTimeout(veLaiTatCa, 140);
});

function ve(el, cfg) {
  var w = el.clientWidth || el.parentNode.clientWidth || 640;
  if (w < 80) w = 640;
  var f = LOAI[cfg.loai];
  if (!f) { el.innerHTML = ''; return; }
  el.innerHTML = f(cfg, w);
  if (cfg.sauKhiVe) cfg.sauKhiVe(el);
}

/* =====================================================================
   MÁCH NƯỚC (tooltip)
   Một hộp duy nhất cho cả trang, đi theo con trỏ. Nội dung nằm sẵn trong
   thuộc tính data-tip của từng cột — không phải tính lại lúc rê chuột.
   ===================================================================== */
var hopTip = null;
function oTip() {
  if (!hopTip) { hopTip = document.createElement('div'); hopTip.className = 'tip'; document.body.appendChild(hopTip); }
  return hopTip;
}
function datTip(html, x, y) {
  var t = oTip();
  t.innerHTML = html;
  t.classList.add('on');
  var r = t.getBoundingClientRect();
  var l = x + 14, tp = y - r.height - 12;
  if (l + r.width > innerWidth - 8) l = x - r.width - 14;
  if (tp < 8) tp = y + 18;
  t.style.left = Math.max(8, l) + 'px';
  t.style.top = tp + 'px';
}
function anTip() { if (hopTip) hopTip.classList.remove('on'); }

document.addEventListener('pointermove', function (e) {
  var g = e.target.closest ? e.target.closest('[data-tip]') : null;
  if (!g) { anTip(); return; }
  datTip(g.getAttribute('data-tip'), e.clientX, e.clientY);
}, true);
/* KHÔNG nghe pointerleave ở pha bắt (capture). pointerleave không nổi
   bọt, nhưng listener bắt trên document vẫn nhận được nó của MỌI phần tử
   con — nên rê chuột từ cột này sang cột kia là một lần "rời" và mách
   nước tắt ngay sau khi vừa bật. Rời khỏi vùng có mách nước đã được
   pointermove ở trên lo rồi; ở đây chỉ cần lo lúc con trỏ rời hẳn cửa sổ. */
document.documentElement.addEventListener('pointerleave', anTip);
document.addEventListener('scroll', anTip, true);

/* mách nước theo bàn phím: nhóm nào focus được thì hiện ngay tại chỗ nó */
document.addEventListener('focusin', function (e) {
  var g = e.target.closest ? e.target.closest('[data-tip]') : null;
  if (!g) return;
  var r = g.getBoundingClientRect();
  datTip(g.getAttribute('data-tip'), r.left + r.width / 2, r.top);
});
document.addEventListener('focusout', anTip);

function dongTip(ten, gt, mau2) {
  return '<span><i style="background:' + esc(mau2) + '"></i>' + esc(ten) +
    '<span class="r">' + esc(gt) + '</span></span>';
}

/* =====================================================================
   1. CỘT THEO KỲ  — có thể chồng nhiều chuỗi, có thể kèm một đường
   ---------------------------------------------------------------------
   cfg: {
     loai:'cot', truc:[nhãn…],
     chuoi:[{ten, gt:[…], mau}],           ← chồng lên nhau
     cao, dinhDang:'tien'|'so', hienGiaTri, dangDo:[idx…], mo:[idx…],
   KHÔNG có đường phủ trục phải: hai thước đo khác đơn vị thì vẽ hai biểu đồ
   nhỏ chung trục hoành, không chồng lên nhau bằng hai trục tung.
     chuThich:true
   }
   Ba trạng thái của một cột, đừng gộp làm hai:
     · null           → chưa có số nào (kỳ khách chưa được mở) → vạch cụt
     · dangDo có idx  → có số nhưng chưa chốt → cột viền đứt
     · còn lại        → đã chốt → cột đặc
   ===================================================================== */
/* Cột bo đỉnh, vuông đáy: dữ liệu mọc từ một đường đáy chung, đỉnh mềm. */
function cotBo(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  if (r <= 0.5) return 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'h' + w.toFixed(1) + 'v' + h.toFixed(1) + 'h' + (-w).toFixed(1) + 'z';
  return 'M' + x.toFixed(1) + ' ' + (y + r).toFixed(1) +
    'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + (-r) +
    'h' + (w - 2 * r).toFixed(1) +
    'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r +
    'v' + (h - r).toFixed(1) + 'h' + (-w).toFixed(1) + 'z';
}
/* Nhãn trục hoành dài thì xuống dòng ở khoảng trắng, không cắt cụt bằng "…". */
function taiDong(chu, toiDa) {
  chu = String(chu || '');
  if (chu.length <= toiDa) return [chu];
  var tu = chu.split(' '), d1 = '', d2 = '';
  tu.forEach(function (w) {
    if (!d2 && (d1 + ' ' + w).trim().length <= toiDa) d1 = (d1 + ' ' + w).trim();
    else d2 = (d2 + ' ' + w).trim();
  });
  if (!d1) { d1 = chu.slice(0, toiDa); d2 = chu.slice(toiDa); }
  if (d2.length > toiDa) d2 = d2.slice(0, Math.max(1, toiDa - 1)) + '…';
  return d2 ? [d1, d2] : [d1];
}

function veCot(cfg, W) {
  var H = cfg.cao || 210;
  var P = dayMau();
  var chuoi = (cfg.chuoi || []).map(function (se, i) {
    return { ten: se.ten, gt: se.gt, mau: se.mau || P[i % 8] };
  });
  var truc = cfg.truc || [];
  var n = truc.length;
  var dangDo = cfg.dangDo || [], mo = cfg.mo || [];
  var dinhDang = cfg.dinhDang === 'so' ? gonSo : gonTien;
  var dayDu = cfg.dinhDang === 'so' ? so : usd0;

  /* tổng theo cột để tính đỉnh */
  var tong = [], coSo = [];
  for (var i = 0; i < n; i++) {
    var t = 0, co = false;
    chuoi.forEach(function (se) { var v = se.gt[i]; if (v != null) { t += v; co = true; } });
    tong.push(t); coSo.push(co);
  }
  var dinh = Math.max.apply(null, tong.concat([0]));
  var tr = mocTruc(dinh, 4);
  var LE_T = 18, LE_D = 26, LE_P = 8;
  var LE_TR = cfg.anTruc ? 6 : 52;
  var cao = H - LE_T - LE_D;
  var rong = W - LE_TR - LE_P;
  var bcao = function (v) { return tr.tran > 0 ? v / tr.tran * cao : 0; };
  var bw = n ? rong / n : rong;
  /* Cột mảnh, phần còn lại của ô là khoảng thở. Cột to hết ô nhìn nặng và
     trẻ con ở cỡ lớn. */
  var wcot = Math.min(bw * 0.6, 28);
  var KHE = 2;   /* khe hở màu nền giữa hai đoạn chồng, thay cho viền */

  /* Ghi số lên cột nào: cột đang xem và cột cao nhất. Ghi số lên mọi cột
     là một rừng số không ai đọc; trục tung và mách nước lo phần còn lại.
     hienGiaTri: 'het' giữ đường thoát cho biểu đồ ít cột. */
  var nhan = {};
  if (cfg.hienGiaTri) {
    if (cfg.noiBat != null && cfg.noiBat >= 0) nhan[cfg.noiBat] = true;
    var iMax = -1;
    for (var m = 0; m < n; m++) if (coSo[m] && tong[m] > 0 && (iMax < 0 || tong[m] > tong[iMax])) iMax = m;
    if (iMax >= 0) nhan[iMax] = true;
    if (cfg.hienGiaTri === 'het' || n <= 6) for (var m2 = 0; m2 < n; m2++) if (coSo[m2] && tong[m2] > 0) nhan[m2] = true;
  }

  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(cfg.moTa || '') + '">';

  /* lưới ngang + nhãn trục tung */
  tr.moc.forEach(function (v) {
    var y = LE_T + cao - bcao(v);
    s += '<line class="gl" x1="' + LE_TR + '" y1="' + y.toFixed(1) + '" x2="' + (W - LE_P) + '" y2="' + y.toFixed(1) + '"/>';
    if (!cfg.anTruc)
      s += '<text class="vl" x="' + (LE_TR - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' +
        esc(v === 0 ? '0' : dinhDang(v)) + '</text>';
  });

  /* cột */
  for (var i2 = 0; i2 < n; i2++) {
    var x = LE_TR + i2 * bw + (bw - wcot) / 2;
    var duoi = LE_T + cao;
    var doTruc = dangDo.indexOf(i2) >= 0;
    var moCot = mo.indexOf(i2) >= 0;
    var noiBat = cfg.noiBat === i2;
    var dong = [];
    if (!coSo[i2]) {
      /* Vạch cụt "chưa có số": nhìn thấy được ở cả hai chế độ, và khác hẳn
         một cột bằng 0. */
      s += '<rect class="b" x="' + x.toFixed(1) + '" y="' + (duoi - 4) + '" width="' + wcot.toFixed(1) +
        '" height="4" rx="1.5" fill="' + mau('neutral-bar') + '"/>';
    } else {
      var doan = [];
      chuoi.forEach(function (se) {
        var v = se.gt[i2] || 0;
        if (v > 0) doan.push({ v: v, mau: se.mau, ten: se.ten });
      });
      var y0 = duoi;
      doan.forEach(function (d, k) {
        var h = bcao(d.v), tren = k === doan.length - 1;
        var dinhDoan = y0 - h;
        var hVe = Math.max(tren ? h : h - KHE, 0.8);
        s += '<path class="b" d="' + cotBo(x, dinhDoan, wcot, hVe, tren && h > 5 ? 4 : 0) + '"' +
          ' fill="' + d.mau + '"' + (moCot ? ' opacity=".42"' : '') +
          (doTruc ? ' stroke="' + d.mau + '" stroke-width="1.2" stroke-dasharray="3 2" fill-opacity=".22"' : '') + '/>';
        dong.push(dongTip(d.ten, dayDu(d.v), d.mau));
        y0 = dinhDoan;
      });
      if (nhan[i2]) {
        s += '<text class="vl' + (noiBat ? ' big' : '') + '" x="' + (x + wcot / 2).toFixed(1) + '" y="' +
          (duoi - bcao(tong[i2]) - 6).toFixed(1) + '" text-anchor="middle">' + esc(dinhDang(tong[i2])) + '</text>';
      }
    }
    /* vùng bắt chuột phủ hết chiều cao, không phải chỉ phần cột */
    var tip = '<b>' + esc(cfg.tieuDeTip ? cfg.tieuDeTip(i2) : truc[i2]) + '</b>' +
      (coSo[i2] ? dong.join('') +
        (chuoi.length > 1 ? '<span class="r" style="float:none;display:block;margin-top:5px;' +
          'border-top:1px solid rgba(255,255,255,.16);padding-top:5px">' + esc(dayDu(tong[i2])) + '</span>' : '')
        : '<span class="d">' + esc(cfg.chuTrong || T('Chưa có số liệu', 'No data yet')) + '</span>') +
      (doTruc ? '<span class="d">' + esc(T('Kỳ chưa xét duyệt, số liệu còn thay đổi', 'Period not approved, figures still moving')) + '</span>' : '') +
      (cfg.ghiChuTip ? '<span class="d">' + esc(cfg.ghiChuTip(i2)) + '</span>' : '');
    s += '<g class="hz"' + (cfg.chon ? ' style="cursor:pointer"' : '') +
      ' data-tip="' + esc(tip) + '" data-i="' + i2 + '" tabindex="0">' +
      '<rect class="hit" x="' + (LE_TR + i2 * bw).toFixed(1) + '" y="' + LE_T + '" width="' + bw.toFixed(1) +
      '" height="' + cao + '"/></g>';
  }

  /* nhãn trục hoành: nếu chật thì bỏ bớt, không xoay chữ */
  var buocNhan = Math.ceil(n / Math.max(1, Math.floor(rong / 46)));
  for (var i3 = 0; i3 < n; i3++) {
    if (i3 % buocNhan !== 0 && i3 !== n - 1 && cfg.noiBat !== i3) continue;
    s += '<text class="lb' + (cfg.noiBat === i3 ? ' on' : '') + '" x="' + (LE_TR + i3 * bw + bw / 2).toFixed(1) +
      '" y="' + (H - 9) + '" text-anchor="middle">' + esc(truc[i3]) + '</text>';
  }
  s += '<line class="ax" x1="' + LE_TR + '" y1="' + (LE_T + cao) + '" x2="' + (W - LE_P) + '" y2="' + (LE_T + cao) + '"/>';
  s += '</svg>';

  if (cfg.chuThich !== false && chuoi.length > 1) {
    s += '<div class="leg">' + chuoi.map(function (se) {
      return '<span><i style="background:' + se.mau + '"></i>' + esc(se.ten) + '</span>';
    }).join('') + '</div>';
  }
  return s;
}

/* =====================================================================
   2. THANH NGANG XẾP HẠNG — cửa hàng, lãnh thổ, bên nhận
   cfg: { loai:'thanh', hang:[{ten, gt, phu, mau}], dinhDang, cao }
   ===================================================================== */
function veThanh(cfg, W) {
  var hang = cfg.hang || [];
  var dayDu = cfg.dinhDang === 'so' ? so : usd0;
  var dinh = Math.max.apply(null, hang.map(function (r) { return r.gt || 0; }).concat([0.0001]));
  var tong = hang.reduce(function (s2, r) { return s2 + (r.gt || 0); }, 0);
  var P = dayMau();
  return '<div class="bars' + (cfg.chon ? ' pick' : '') + '">' + hang.map(function (r, i) {
    var pc = dinh > 0 ? (r.gt || 0) / dinh : 0;
    var phanTram = tong > 0 ? (r.gt || 0) / tong : 0;
    return '<div class="row"' + (cfg.chon ? ' data-h="' + i + '" tabindex="0"' : '') +
      ' data-tip="' + esc('<b>' + esc(r.ten) + '</b>' +
        dongTip(cfg.tenTong || T('Doanh thu', 'Revenue'), dayDu(r.gt || 0), r.mau || P[i % 8]) +
        '<span class="d">' + thapPhan(phanTram * 100, 1) + T('% trong phần đang xem', '% of this view') +
        (r.phu ? ' · ' + esc(r.phu) : '') + '</span>') + '">' +
      '<div class="nm">' + esc(r.ten) + (r.phu ? '<em>' + esc(r.phu) + '</em>' : '') +
      '<div class="bar"><i style="width:' + (pc * 100).toFixed(2) + '%;background:' +
      (r.mau || P[i % 8]) + '"></i></div></div>' +
      '<div class="vv">' + esc(dayDu(r.gt || 0)) +
      '<em>' + thapPhan(phanTram * 100, 1) + '%</em></div></div>';
  }).join('') + '</div>';
}

/* =====================================================================
   3. VÒNG — chia phần. Chỉ dùng khi số phần ít (≤6) và tổng có nghĩa.
   cfg: { loai:'vong', phan:[{ten,gt,mau}], giua:{v,l}, cao }
   ===================================================================== */
function veVong(cfg, W) {
  var phan = (cfg.phan || []).filter(function (p) { return (p.gt || 0) > 0; });
  var tong = phan.reduce(function (s, p) { return s + p.gt; }, 0);
  var P = dayMau();
  var H = cfg.cao || 190;
  var R = Math.min(H, W) / 2 - 6, r0 = R * 0.62;
  var cx = R + 6, cy = H / 2;
  var dayDu = cfg.dinhDang === 'so' ? so : usd0;
  var goc = -Math.PI / 2, s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
  phan.forEach(function (p, i) {
    var sw = tong > 0 ? p.gt / tong * Math.PI * 2 : 0;
    var g2 = goc + sw;
    var lon = sw > Math.PI ? 1 : 0;
    var x1 = cx + R * Math.cos(goc), y1 = cy + R * Math.sin(goc);
    var x2 = cx + R * Math.cos(g2), y2 = cy + R * Math.sin(g2);
    var x3 = cx + r0 * Math.cos(g2), y3 = cy + r0 * Math.sin(g2);
    var x4 = cx + r0 * Math.cos(goc), y4 = cy + r0 * Math.sin(goc);
    var mauP = p.mau || P[i % 8];
    s += '<g class="hz" tabindex="0" data-tip="' + esc('<b>' + esc(p.ten) + '</b>' +
      dongTip(cfg.tenTong || T('Số tiền', 'Amount'), dayDu(p.gt), mauP) +
      '<span class="d">' + thapPhan(p.gt / tong * 100, 1) + T('% tổng số', '% of total') + '</span>') + '">' +
      '<path class="b" fill="' + mauP + '" d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
      'A' + R + ' ' + R + ' 0 ' + lon + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
      'L' + x3.toFixed(1) + ' ' + y3.toFixed(1) +
      'A' + r0 + ' ' + r0 + ' 0 ' + lon + ' 0 ' + x4.toFixed(1) + ' ' + y4.toFixed(1) + 'Z"/></g>';
    goc = g2;
  });
  if (cfg.giua) {
    s += '<text x="' + cx + '" y="' + (cy - 1) + '" text-anchor="middle" style="font-size:17px;font-weight:600;' +
      'fill:' + mau('ink') + '">' + esc(cfg.giua.v) + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" class="lb">' + esc(cfg.giua.l) + '</text>';
  }
  s += '</svg>';
  var W2 = R * 2 + 18;
  var chu = '<div style="flex:1;min-width:150px">' + phan.map(function (p, i) {
    return '<div class="stat" style="padding:5px 0;border:0;font-size:12.5px">' +
      '<b><span style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:7px;background:' +
      (p.mau || P[i % 8]) + '"></span>' + esc(p.ten) + '</b>' +
      '<span class="v">' + esc(dayDu(p.gt)) + '<em>' + thapPhan(p.gt / tong * 100, 1) + '%</em></span></div>';
  }).join('') + '</div>';
  return '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
    '<div style="width:' + W2 + 'px;flex:none">' + s.replace('viewBox="0 0 ' + W + ' ', 'viewBox="0 0 ' + W2 + ' ') + '</div>' +
    chu + '</div>';
}

/* =====================================================================
   4. BẬC THANG TIỀN (waterfall) — chuỗi "tiền đi đâu"
   cfg: { loai:'thac', buoc:[{l, v, kind:'top'|'out'|'final', nt}] }
   Vẽ đúng nghĩa bậc thang: mỗi khoản trừ là một khối rơi xuống từ mức
   trước, không phải một cột mọc từ đáy. Vẽ từ đáy là đúng số nhưng sai
   nghĩa — người đọc không thấy được tiền rơi đi đâu.
   ===================================================================== */
function veThac(cfg, W) {
  var b = cfg.buoc || [];
  if (!b.length) return '';
  var H = cfg.cao || 210;
  var LE_T = 20, LE_D = 40, LE_TR = 52, LE_P = 8;
  var cao = H - LE_T - LE_D, rong = W - LE_TR - LE_P;
  var n = b.length, bw = rong / n, wcot = Math.min(bw * 0.6, 40);

  /* mức tích luỹ */
  var mucTren = [], mucDuoi = [], chay = 0, dinh = 0;
  b.forEach(function (st, i) {
    if (st.kind === 'top') { mucDuoi.push(0); chay = st.v; mucTren.push(chay); }
    else if (st.kind === 'final') { mucDuoi.push(0); mucTren.push(st.v); }
    else { var t = chay; chay = chay + st.v; mucDuoi.push(Math.min(t, chay)); mucTren.push(Math.max(t, chay)); }
    dinh = Math.max(dinh, mucTren[i]);
  });
  var tr = mocTruc(dinh, 4);
  var y = function (v) { return LE_T + cao - (tr.tran > 0 ? v / tr.tran * cao : 0); };
  /* Khoản trừ dùng màu xám đậm (--s8), không dùng --neutral-bar: ở chế độ
     sáng, --neutral-bar gần trùng nền thẻ và các khối "Phí", "Phần label"
     gần như không nhìn thấy. Đây đúng là chỗ người dùng báo biểu đồ lỗi. */
  var mOk = mau('ok'), mAcc = mau('s1'), mTru = mau('s8');

  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(cfg.moTa || '') + '">';
  tr.moc.forEach(function (v) {
    s += '<line class="gl" x1="' + LE_TR + '" y1="' + y(v).toFixed(1) + '" x2="' + (W - LE_P) + '" y2="' + y(v).toFixed(1) + '"/>' +
      '<text class="vl" x="' + (LE_TR - 8) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' +
      esc(v === 0 ? '0' : gonTien(v)) + '</text>';
  });
  b.forEach(function (st, i) {
    var x = LE_TR + i * bw + (bw - wcot) / 2;
    var yt = y(mucTren[i]), yb = y(mucDuoi[i]);
    var mauC = st.kind === 'final' ? mOk : st.kind === 'top' ? mAcc : mTru;
    s += '<g class="hz" tabindex="0" data-tip="' + esc('<b>' + esc(st.l) + '</b>' +
      dongTip(st.kind === 'out' ? T('Khoản trừ', 'Deducted') : T('Số tiền', 'Amount'), usd0(Math.abs(st.v)), mauC) +
      (st.nt ? '<span class="d">' + esc(st.nt) + '</span>' : '')) + '">' +
      '<path class="b" d="' + cotBo(x, yt, wcot, Math.max(yb - yt, 1.5), st.kind === 'out' ? 0 : 4) + '" fill="' + mauC + '"/>' +
      '<rect class="hit" x="' + (LE_TR + i * bw).toFixed(1) + '" y="' + LE_T + '" width="' + bw.toFixed(1) +
      '" height="' + cao + '"/></g>';
    if (i > 0 && st.kind !== 'final') {
      var ynoi = y(mucTren[i - 1] === mucTren[i] ? mucTren[i] : (st.v < 0 ? mucTren[i] : mucDuoi[i]));
      s += '<line class="gl dash" x1="' + (LE_TR + (i - 1) * bw + (bw + wcot) / 2).toFixed(1) + '" y1="' + ynoi.toFixed(1) +
        '" x2="' + x.toFixed(1) + '" y2="' + ynoi.toFixed(1) + '"/>';
    }
    s += '<text class="vl" x="' + (x + wcot / 2).toFixed(1) + '" y="' + (yt - 6).toFixed(1) + '" text-anchor="middle">' +
      esc((st.v < 0 ? '−' : '') + gonTien(Math.abs(st.v)).replace('−', '')) + '</text>';
    var dongChu = taiDong(st.l, Math.max(6, Math.floor(bw / 6.2)));
    var xChu = (LE_TR + i * bw + bw / 2).toFixed(1);
    var yChu = dongChu.length > 1 ? H - 22 : H - 11;
    s += '<text class="lb' + (st.kind === 'final' ? ' on' : '') + '" x="' + xChu + '" y="' + yChu + '" text-anchor="middle">' +
      dongChu.map(function (d, k) { return '<tspan x="' + xChu + '" dy="' + (k ? 11 : 0) + '">' + esc(d) + '</tspan>'; }).join('') +
      '</text>';
  });
  s += '<line class="ax" x1="' + LE_TR + '" y1="' + (LE_T + cao) + '" x2="' + (W - LE_P) + '" y2="' + (LE_T + cao) + '"/></svg>';
  return s;
}

/* =====================================================================
   5. TIA — đường bé xíu nằm trong ô số hoặc trong dòng bảng
   ===================================================================== */
function tia(gt, opt) {
  opt = opt || {};
  var W = opt.rong || 84, H = opt.cao || 22;
  var v = gt.filter(function (x) { return x != null; });
  if (v.length < 2) return '<svg width="' + W + '" height="' + H + '"></svg>';
  var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
  var dai = hi - lo || 1;
  var b = W / (gt.length - 1), pt = [], cuoi = null;
  gt.forEach(function (x, i) {
    if (x == null) return;
    var yy = H - 2 - (x - lo) / dai * (H - 4);
    pt.push((i * b).toFixed(1) + ',' + yy.toFixed(1));
    cuoi = { x: i * b, y: yy };
  });
  var m = opt.mau || mau('s1');
  return '<svg width="' + W + '" height="' + H + '" style="display:inline-block;vertical-align:middle;overflow:visible">' +
    '<polyline points="' + pt.join(' ') + '" fill="none" stroke="' + m + '" stroke-width="1.5" ' +
    'stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>' +
    (cuoi ? '<circle cx="' + cuoi.x.toFixed(1) + '" cy="' + cuoi.y.toFixed(1) + '" r="2.2" fill="' + m + '"/>' : '') +
    '</svg>';
}

/* =====================================================================
   6. THANH CHIA PHẦN NẰM NGANG — một dòng, nhiều phần
   ===================================================================== */
function chia(phan, opt) {
  opt = opt || {};
  var P = dayMau();
  var tong = phan.reduce(function (s, p) { return s + (p.gt || 0); }, 0) || 1;
  var dayDu = opt.dinhDang === 'so' ? so : usd0;
  return '<div class="prog" style="' + (opt.cao ? 'height:' + opt.cao + 'px' : '') + '">' +
    phan.map(function (p, i) {
      return '<i style="width:' + ((p.gt || 0) / tong * 100).toFixed(2) + '%;background:' +
        (p.mau || P[i % 8]) + '" data-tip="' + esc('<b>' + esc(p.ten) + '</b>' +
        dongTip(T('Số tiền', 'Amount'), dayDu(p.gt || 0), p.mau || P[i % 8]) +
        '<span class="d">' + thapPhan((p.gt || 0) / tong * 100, 1) + T('% tổng số', '% of total') + '</span>') + '"></i>';
    }).join('') + '</div>' +
    (opt.chuThich === false ? '' : '<div class="leg">' + phan.map(function (p, i) {
      return '<span><i style="background:' + (p.mau || P[i % 8]) + '"></i>' + esc(p.ten) +
        ' <b>' + esc(dayDu(p.gt || 0)) + '</b></span>';
    }).join('') + '</div>');
}

var LOAI = { cot: veCot, thanh: veThanh, vong: veVong, thac: veThac };

global.HB = {
  o: o, gan: gan, veLaiTatCa: veLaiTatCa,
  tia: tia, chia: chia, mau: mau, dayMau: dayMau,
  gonTien: gonTien, gonSo: gonSo, mocTruc: mocTruc,
  dongTip: dongTip, anTip: anTip
};

})(window);
