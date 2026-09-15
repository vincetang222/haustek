/* =====================================================================
   CỬA — trang đăng nhập, dùng chung cho cả hai cổng
   ---------------------------------------------------------------------
   Chạy TRƯỚC khung. Không có phiên thì dựng màn hình đăng nhập và dừng
   ở đó; có phiên rồi thì gọi thẳng xong() và khung dựng như thường.

   Vì sao là một file chung mà không phải một trang trong man/: trang
   trong man/ nằm BÊN TRONG khung — có điều hướng, có thanh trên, có ô
   chọn kỳ. Cửa phải đứng trước tất cả những thứ ấy, nên nó không thể là
   một trang.

   Vì sao hai cổng vẫn có hai cửa riêng chứ không gộp làm một: cổng đối
   tác gọi HAUSTEK.lockdown() nên trong trang ấy HAUSTEK.admin KHÔNG còn
   tồn tại. Một cửa gộp phải nạp cả hai mặt tiền, tức là phá đúng cái ranh
   giới mà test/ranh-gioi-trang.js đang canh. File này chỉ VẼ; việc tra
   tài khoản do bên gọi truyền vào.

   BẢN MẪU KHÔNG CÓ MẬT KHẨU. Ô mật khẩu có mặt vì hình dạng thật của
   trang đăng nhập cần nó — đội lập trình phải thấy chỗ nó nằm — nhưng ô
   ấy tự khai ngay bên dưới rằng bản mẫu không kiểm. Không giấu chuyện đó
   đi, và cũng không bỏ ô đi rồi để người đọc tự đoán.
   ===================================================================== */
(function (global) {
"use strict";

var LS_PHIEN = 'haustek.phien';    /* cổng nào đang có ai vào — sessionStorage */

function esc(s) { return HT.esc(s == null ? '' : String(s)); }
function doc(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function ghi(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
function xoa(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

/* Khoá phiên tách theo cổng: vào cổng nội bộ rồi mở cổng đối tác ở tab
   khác thì hai phiên không đè lên nhau. */
function khoa(ten) { return LS_PHIEN + '.' + ten; }

/* ---------------------------------------------------------------------
   Đọc / ghi / xoá phiên
   --------------------------------------------------------------------- */
function phienCua(ten) {
  var s = doc(khoa(ten));
  if (!s) return null;
  try { var o = JSON.parse(s); return (o && o.email) ? o : null; } catch (e) { return null; }
}
function luuPhien(ten, o) { ghi(khoa(ten), JSON.stringify(o)); }
function raKhoi(ten) { xoa(khoa(ten)); }

/* ---------------------------------------------------------------------
   Màn hình
   --------------------------------------------------------------------- */
function ve(c) {
  var vi = HT.lang !== 'en';
  var t = {
    vao:      vi ? 'Đăng nhập' : 'Sign in',
    email:    vi ? 'Email' : 'Email',
    matKhau:  vi ? 'Mật khẩu' : 'Password',
    mkMo:     vi ? 'Bản mẫu không kiểm mật khẩu — gõ gì cũng được, hoặc để trống.'
                 : 'The prototype does not check passwords — type anything, or leave it empty.',
    nut:      vi ? 'Vào cổng' : 'Sign in',
    quen:     vi ? 'Quên mật khẩu?' : 'Forgot your password?',
    quenMo:   vi ? 'Hệ thật gửi link đặt lại qua email. Bản mẫu chưa có bước ấy.'
                 : 'The real system emails a reset link. The prototype has no such step yet.',
    mauTd:    vi ? 'Tài khoản mẫu của bản mẫu' : 'Prototype sample accounts',
    mauMo:    vi ? 'Bấm một dòng để điền email. Hệ thật không bao giờ liệt kê ai có tài khoản — danh sách này là thang gỗ của bản mẫu và sẽ bỏ đi.'
                 : 'Click a row to fill the email. The real system never lists who has an account — this is prototype scaffolding and goes away.',
    ghiChu:   vi ? 'Mỗi lần vào, kể cả lần bị từ chối, để lại một dòng ở nhật ký đăng nhập.'
                 : 'Every sign-in, refused ones included, leaves a line in the sign-in log.',
    doiNgu:   vi ? 'English' : 'Tiếng Việt'
  };

  var mau = (c.mau || []).map(function (m) {
    return '<button type="button" class="cua-mau" data-mau="' + esc(m.email) + '">' +
      '<b>' + esc(m.ten) + '</b>' +
      '<span>' + esc(m.email) + '</span>' +
      (m.phu ? '<i>' + esc(m.phu) + '</i>' : '') + '</button>';
  }).join('');

  return '<div class="cua-nen"><div class="cua">' +
    '<div class="cua-dau">' +
      '<div class="cua-hieu">Haustek</div>' +
      '<h1>' + esc(c.tieuDe) + '</h1>' +
      '<p>' + esc(c.phu) + '</p>' +
    '</div>' +

    '<form class="cua-form" data-cua-form novalidate>' +
      '<label class="fld" for="cua-email">' + esc(t.email) + '</label>' +
      '<input class="in" type="email" id="cua-email" name="email" autocomplete="username" ' +
        'autocapitalize="off" spellcheck="false" data-cua-email>' +
      '<label class="fld" for="cua-mk">' + esc(t.matKhau) + '</label>' +
      '<input class="in" type="password" id="cua-mk" name="matkhau" autocomplete="current-password">' +
      '<p class="cua-nho">' + esc(t.mkMo) + '</p>' +
      '<div class="cua-loi" data-cua-loi hidden role="alert"></div>' +
      '<button type="submit" class="btn pri cua-nut">' + esc(t.nut) + '</button>' +
      '<p class="cua-nho cua-giua">' + esc(t.quen) + ' <span class="muted">' + esc(t.quenMo) + '</span></p>' +
    '</form>' +

    (mau ? '<details class="cua-mau-hop"><summary>' + esc(t.mauTd) + '</summary>' +
      '<p class="cua-nho">' + esc(t.mauMo) + '</p>' +
      '<div class="cua-mau-ds">' + mau + '</div></details>' : '') +

    '<div class="cua-chan">' +
      '<span>' + esc(t.ghiChu) + '</span>' +
      '<button type="button" class="btn sm ghost" data-cua-ngu>' + esc(t.doiNgu) + '</button>' +
    '</div>' +
  '</div></div>';
}

/* ---------------------------------------------------------------------
   mo(cauHinh) — cửa duy nhất của file này
     ten     'internal' | 'portal'   · khoá phiên tách theo cổng
     tieuDe, phu
     dangNhap(email) → danh tính, hoặc ném
     mau     [{ email, ten, phu }]   · danh sách bản mẫu, có thể bỏ trống
     xong(danhTinh)                  · gọi khi đã vào được
   --------------------------------------------------------------------- */
function mo(c) {
  var cu = phienCua(c.ten);
  if (cu) {
    /* Có phiên rồi: tra lại theo email chứ không tin dữ liệu đã lưu.
       Tài khoản bị khoá sau khi người ta đã vào thì lần nạp trang sau
       phải đá ra — đây đúng là chỗ HA-TANG.md mục 3 gọi là "phiên phải
       được kiểm lại". */
    var lai = null;
    try { lai = c.dangNhap(cu.email); } catch (e) { lai = null; }
    if (lai) { c.xong(lai); return; }
    raKhoi(c.ten);
  }

  /* Dựng vào một hộp RIÊNG rồi gỡ hẳn hộp ấy lúc vào được.
     HT.chay() THÊM <div class="app"> vào body chứ không thay body, nên cửa
     không tự gỡ thì nó nằm đè 720px phía trên cổng và người dùng phải cuộn
     xuống mới thấy trang. Đã gặp thật lúc dựng vòng 25. */
  var hop = document.createElement('div');
  hop.setAttribute('data-cua-hop', '');
  hop.innerHTML = ve(c);
  document.body.appendChild(hop);

  var form = hop.querySelector('[data-cua-form]');
  var oEmail = hop.querySelector('[data-cua-email]');
  var oLoi = hop.querySelector('[data-cua-loi]');
  if (oEmail) oEmail.focus();

  function vao(dt) {
    hop.remove();
    document.removeEventListener('click', bamTrongCua);
    c.xong(dt);
  }

  function bao(m) {
    if (!oLoi) return;
    oLoi.textContent = m;
    oLoi.hidden = !m;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (oEmail.value || '').trim();
    if (!email) { bao(HT.lang === 'en' ? 'Enter your email.' : 'Nhập email của bạn.'); oEmail.focus(); return; }
    var dt = null;
    try { dt = c.dangNhap(email); }
    catch (err) { bao(HT.lang === 'en' ? 'That email or password is not right.' : err.message); oEmail.select(); return; }
    luuPhien(c.ten, { email: dt.email || email });
    vao(dt);
  });

  function bamTrongCua(e) {
    var m = e.target.closest ? e.target.closest('[data-mau]') : null;
    if (m) { oEmail.value = m.getAttribute('data-mau'); bao(''); oEmail.focus(); return; }
    var n = e.target.closest ? e.target.closest('[data-cua-ngu]') : null;
    if (n) {
      try { localStorage.setItem('haustek.lang', HT.lang === 'en' ? 'vi' : 'en'); } catch (err) {}
      location.reload();
    }
  }
  document.addEventListener('click', bamTrongCua);
}

global.HTCua = { mo: mo, raKhoi: raKhoi, phienCua: phienCua };

})(window);
