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
  if (a >= 1e3) return dau + Math.round(a / 1e3) + (E ? 'K' : 'N');
  return usd0(v);
}
function gonSo(v) {
  var a = Math.abs(v), E = en();
  if (a >= 1e9) return thapPhan(a / 1e9, 1) + (E ? 'B' : ' tỷ');
  if (a >= 1e6) return thapPhan(a / 1e6, a >= 1e7 ? 0 : 1) + (E ? 'M' : 'Tr');
  if (a >= 1e3) return Math.round(a / 1e3) + (E ? 'K' : 'N');
  return so(v);
}

/* ---------------------------------------------------------------------
   Chọn mốc trục tung cho ra số tròn mắt người, không phải số máy tính
   --------------------------------------------------------------------- */
function mocTruc(dinh, n) {
  n = n || 4;
  if (!(dinh > 0)) return { moc: [0, 1], tran: 1 };
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
     duong:{ten, gt:[…], mau, phai:true},  ← đường, có thể dùng trục phải
     cao, dinhDang:'tien'|'so', hienGiaTri, dangDo:[idx…], mo:[idx…],
     chuThich:true
   }
   Ba trạng thái của một cột, đừng gộp làm hai:
     · null           → chưa có số nào (kỳ khách chưa được mở) → vạch cụt
     · dangDo có idx  → có số nhưng chưa chốt → cột viền đứt
     · còn lại        → đã chốt → cột đặc
   ===================================================================== */
function veCot(cfg, W) {
  var H = cfg.cao || 210;
  var P = dayMau();
  var chuoi = (cfg.chuoi || []).map(function (s, i) {
    return { ten: s.ten, gt: s.gt, mau: s.mau || P[i % 8] };
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
    chuoi.forEach(function (s) { var v = s.gt[i]; if (v != null) { t += v; co = true; } });
    tong.push(t); coSo.push(co);
  }
  var dinh = Math.max.apply(null, tong.concat([0]));
  var tr = mocTruc(dinh, 4);
  var LE_T = 14, LE_D = 26, LE_P = 8;
  var LE_TR = cfg.anTruc ? 6 : 52;
  var cao = H - LE_T - LE_D;
  var rong = W - LE_TR - LE_P;
  var bcao = function (v) { return tr.tran > 0 ? v / tr.tran * cao : 0; };
  var bw = n ? rong / n : rong;
  var wcot = Math.min(bw * 0.62, 46);

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
      /* Vạch cụt "chưa có số". Dùng --bar-bg thì ở chế độ tối nó gần như
         trùng nền thẻ, và người đọc thấy một khoảng trống — trống có nghĩa
         là số 0, mà đây không phải số 0, đây là "chưa biết". Dùng đường
         viền để nó nhìn thấy được ở cả hai chế độ. */
      s += '<rect class="b" x="' + x.toFixed(1) + '" y="' + (duoi - 5) + '" width="' + wcot.toFixed(1) +
        '" height="5" rx="1.5" fill="' + mau('neutral-bar') + '"/>';
    } else {
      var y0 = duoi;
      chuoi.forEach(function (se) {
        var v = se.gt[i2] || 0;
        if (v <= 0) return;
        var h = bcao(v);
        y0 -= h;
        s += '<rect class="b" x="' + x.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + wcot.toFixed(1) +
          '" height="' + Math.max(h, 0.8).toFixed(1) + '" rx="' + (h > 5 ? 2 : 0) + '"' +
          ' fill="' + se.mau + '"' + (moCot ? ' opacity=".42"' : '') +
          (doTruc ? ' stroke="' + se.mau + '" stroke-width="1.2" stroke-dasharray="3 2" fill-opacity=".2"' : '') + '/>';
        dong.push(dongTip(se.ten, dayDu(v), se.mau));
      });
      if (cfg.hienGiaTri && tong[i2] > 0) {
        s += '<text class="vl' + (noiBat ? ' big' : '') + '" x="' + (x + wcot / 2).toFixed(1) + '" y="' +
          (duoi - bcao(tong[i2]) - 6).toFixed(1) + '" text-anchor="middle">' + esc(dinhDang(tong[i2])) + '</text>';
      }
    }
    /* vùng bắt chuột phủ hết chiều cao, không phải chỉ phần cột — cột thấp
       thì không ai rê trúng được vài pixel */
    var tip = '<b>' + esc(cfg.tieuDeTip ? cfg.tieuDeTip(i2) : truc[i2]) + '</b>' +
      (coSo[i2] ? dong.join('') +
        (chuoi.length > 1 ? '<span class="r" style="float:none;display:block;margin-top:5px;' +
          'border-top:1px solid rgba(255,255,255,.16);padding-top:5px">' + esc(dayDu(tong[i2])) + '</span>' : '')
        : '<span class="d">' + esc(cfg.chuTrong || 'Chưa có số liệu') + '</span>') +
      (doTruc ? '<span class="d">Chưa duyệt kỳ — số còn chạy</span>' : '') +
      (cfg.ghiChuTip ? '<span class="d">' + esc(cfg.ghiChuTip(i2)) + '</span>' : '');
    s += '<g class="hz"' + (cfg.chon ? ' style="cursor:pointer"' : '') +
      ' data-tip="' + esc(tip) + '" data-i="' + i2 + '" tabindex="0">' +
      '<rect class="hit" x="' + (LE_TR + i2 * bw).toFixed(1) + '" y="' + LE_T + '" width="' + bw.toFixed(1) +
      '" height="' + cao + '"/></g>';
  }

  /* đường phủ lên trên (ví dụ: số lượt nghe so với tiền) */
  if (cfg.duong && n) {
    var d = cfg.duong, dinh2 = Math.max.apply(null, d.gt.map(function (v) { return v || 0; }).concat([0]));
    var mauD = d.mau || mau('s4');
    var pt = [], du = [];
    for (var j = 0; j < n; j++) {
      if (d.gt[j] == null) continue;
      var xx = LE_TR + j * bw + bw / 2;
      var yy = LE_T + cao - (dinh2 > 0 ? d.gt[j] / dinh2 * cao * 0.88 : 0);
      pt.push(xx.toFixed(1) + ',' + yy.toFixed(1));
      du.push('<circle class="dot2" cx="' + xx.toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="3" fill="' + mauD + '"/>');
    }
    s += '<polyline class="ln" points="' + pt.join(' ') + '" stroke="' + mauD + '"/>' + du.join('');
  }

  /* nhãn trục hoành — nếu chật thì bỏ bớt, không xoay chữ */
  var buocNhan = Math.ceil(n / Math.max(1, Math.floor(rong / 46)));
  for (var i3 = 0; i3 < n; i3++) {
    if (i3 % buocNhan !== 0 && i3 !== n - 1 && cfg.noiBat !== i3) continue;
    s += '<text class="lb' + (cfg.noiBat === i3 ? ' on' : '') + '" x="' + (LE_TR + i3 * bw + bw / 2).toFixed(1) +
      '" y="' + (H - 9) + '" text-anchor="middle">' + esc(truc[i3]) + '</text>';
  }
  s += '<line class="ax" x1="' + LE_TR + '" y1="' + (LE_T + cao) + '" x2="' + (W - LE_P) + '" y2="' + (LE_T + cao) + '"/>';
  s += '</svg>';

  if (cfg.chuThich !== false && (chuoi.length > 1 || cfg.duong)) {
    s += '<div class="leg">' + chuoi.map(function (se) {
      return '<span><i style="background:' + se.mau + '"></i>' + esc(se.ten) + '</span>';
    }).join('') + (cfg.duong ? '<span><i style="background:' + (cfg.duong.mau || mau('s4')) +
      ';border-radius:50%"></i>' + esc(cfg.duong.ten) + '</span>' : '') + '</div>';
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
        dongTip(cfg.tenTong || 'Doanh thu', dayDu(r.gt || 0), r.mau || P[i % 8]) +
        '<span class="d">' + thapPhan(phanTram * 100, 1) + '% của phần đang xem' +
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
      dongTip(cfg.tenTong || 'Số tiền', dayDu(p.gt), mauP) +
      '<span class="d">' + thapPhan(p.gt / tong * 100, 1) + '% tổng</span>') + '">' +
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
  var LE_T = 20, LE_D = 34, LE_TR = 52, LE_P = 8;
  var cao = H - LE_T - LE_D, rong = W - LE_TR - LE_P;
  var n = b.length, bw = rong / n, wcot = Math.min(bw * 0.6, 56);

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
  var mOk = mau('ok'), mAcc = mau('s1'), mTru = mau('neutral-bar');

  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
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
      dongTip(st.kind === 'out' ? 'Trừ đi' : 'Số tiền', usd0(Math.abs(st.v)), mauC) +
      (st.nt ? '<span class="d">' + esc(st.nt) + '</span>' : '')) + '">' +
      '<rect class="b" x="' + x.toFixed(1) + '" y="' + yt.toFixed(1) + '" width="' + wcot.toFixed(1) +
      '" height="' + Math.max(yb - yt, 1.5).toFixed(1) + '" rx="2" fill="' + mauC + '"/>' +
      '<rect class="hit" x="' + (LE_TR + i * bw).toFixed(1) + '" y="' + LE_T + '" width="' + bw.toFixed(1) +
      '" height="' + cao + '"/></g>';
    if (i > 0 && st.kind !== 'final') {
      var ynoi = y(mucTren[i - 1] === mucTren[i] ? mucTren[i] : (st.v < 0 ? mucTren[i] : mucDuoi[i]));
      s += '<line class="gl dash" x1="' + (LE_TR + (i - 1) * bw + (bw + wcot) / 2).toFixed(1) + '" y1="' + ynoi.toFixed(1) +
        '" x2="' + x.toFixed(1) + '" y2="' + ynoi.toFixed(1) + '"/>';
    }
    s += '<text class="vl" x="' + (x + wcot / 2).toFixed(1) + '" y="' + (yt - 6).toFixed(1) + '" text-anchor="middle">' +
      esc((st.v < 0 ? '−' : '') + gonTien(Math.abs(st.v)).replace('−', '')) + '</text>';
    var chu = String(st.l);
    if (chu.length > Math.floor(bw / 6.4)) chu = chu.slice(0, Math.max(4, Math.floor(bw / 6.4) - 1)) + '…';
    s += '<text class="lb' + (st.kind === 'final' ? ' on' : '') + '" x="' + (LE_TR + i * bw + bw / 2).toFixed(1) +
      '" y="' + (H - 11) + '" text-anchor="middle">' + esc(chu) + '</text>';
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
        dongTip('Số tiền', dayDu(p.gt || 0), p.mau || P[i % 8]) +
        '<span class="d">' + thapPhan((p.gt || 0) / tong * 100, 1) + '% tổng</span>') + '"></i>';
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
