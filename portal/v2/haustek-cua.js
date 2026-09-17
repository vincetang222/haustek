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

   VÒNG 26 — hai cột. Cột trái đăng nhập, cột phải nói sản phẩm này để
   làm gì. Lấy bố cục từ trang đăng nhập của HAUSTEK CRM theo yêu cầu của
   chủ dự án; CRM trước đó đã mượn khung cột trái của portal, nên đây là
   mượn lại đúng chiều còn thiếu. Nội dung cột phải do bên gọi truyền vào
   (khoá `phai`) vì hai cổng nói với hai người khác nhau: nội bộ nói với
   nhân viên, cổng đối tác nói với nghệ sĩ và label. Không truyền thì cột
   phải không dựng, và cửa trở lại đúng hình một cột như vòng 25.
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
   Cột phải — chỉ dựng khi bên gọi truyền `phai`
     nhan   dòng nhãn nhỏ trên cùng
     h      [trước, phần nhấn, sau] — ghép thành một tiêu đề lớn
     p      một đoạn
     so     [{n, s}]  · ba con số
     trich  câu trích, trichAi là người nói
     the    [chuỗi]   · các thẻ tròn
     link   {chu, href}
   --------------------------------------------------------------------- */
function vePhai(p) {
  if (!p) return '';
  var h = p.h || ['', '', ''];
  var so = (p.so || []).map(function (x) {
    return '<div><b>' + esc(x.n) + '</b><span>' + esc(x.s) + '</span></div>';
  }).join('');
  var the = (p.the || []).map(function (x) { return '<i>' + esc(x) + '</i>'; }).join('');
  return '<div class="cua-phai">' +
    (p.nhan ? '<div class="cua-nhan"><span class="cua-dot"></span>' + esc(p.nhan) + '</div>' : '') +
    '<h2 class="cua-h">' + esc(h[0]) + '<em>' + esc(h[1]) + '</em>' + esc(h[2]) + '</h2>' +
    (p.p ? '<p class="cua-p">' + esc(p.p) + '</p>' : '') +
    (so ? '<div class="cua-so">' + so + '</div>' : '') +
    (p.trich ? '<div class="cua-trich">' + esc(p.trich) +
      (p.trichAi ? '<span>' + esc(p.trichAi) + '</span>' : '') + '</div>' : '') +
    (the ? '<div class="cua-the">' + the + '</div>' : '') +
  '</div>';
}

/* ---------------------------------------------------------------------
   Màn hình
   --------------------------------------------------------------------- */
function ve(c) {
  var vi = HT.lang !== 'en';
  /* GIỌNG CỦA THẺ NÀY.
     Bản trước nói ĐÚNG mọi thứ nhưng nói về CHÍNH NÓ năm lần quanh ba ô
     nhập: dưới ô mật khẩu, dưới nút, ở tiêu đề danh sách mẫu, ở mô tả danh
     sách ấy, rồi ở chân thẻ. Người đến đây để đăng nhập, không để đọc ghi
     chú phát hành, nên năm khối chữ ấy đọc như máy đọc.
     Nay nói một lần, ngay chỗ nó liên quan, bằng câu có chủ ngữ. Và hai thứ
     phải giữ nguyên vì chúng là lời khai thật, không phải trang trí: "không
     kiểm mật khẩu" (bộ kiểm cua-dang-nhap.js canh đúng câu này — một bản
     mẫu giấu chuyện ấy đi là lừa người dùng) và câu về nhật ký đăng nhập.
     Hai thứ tiếng viết riêng, không dịch chữ sang chữ: tiếng Việt cần chủ
     ngữ ở chỗ tiếng Anh bỏ được, và "bản chính thức" tự nhiên hơn "hệ thật". */
  var t = {
    email:    'Email',
    matKhau:  vi ? 'Mật khẩu' : 'Password',
    mkMo:     vi ? 'Bản mẫu không kiểm mật khẩu, nên bạn gõ gì cũng vào được — hoặc cứ để trống.'
                 : 'This prototype does not check passwords, so type anything you like — or leave it blank.',
    nut:      vi ? 'Đăng nhập' : 'Sign in',
    quen:     vi ? 'Quên mật khẩu?' : 'Forgot your password?',
    quenMo:   vi ? 'Bản chính thức sẽ gửi email đặt lại giúp bạn.'
                 : 'The live system will email you a reset link.',
    mauTd:    vi ? 'Xem thử bằng một tài khoản có sẵn' : 'Look around with a sample account',
    mauMo:    vi ? 'Chọn một dòng để điền sẵn email. Bản chính thức sẽ không liệt kê ai có tài khoản — danh sách này chỉ có ở đây, để bạn xem thử.'
                 : 'Pick a row and we will fill the email in for you. The live system will never list who has an account — this list exists only here, so you can look around.',
    ghiChu:   vi ? 'Mọi lần đăng nhập đều được ghi lại, kể cả lần bị từ chối.'
                 : 'Every sign-in is recorded, including the ones that are turned away.',
    doiNgu:   vi ? 'English' : 'Tiếng Việt'
  };

  var mau = (c.mau || []).map(function (m) {
    return '<button type="button" class="cua-mau" data-mau="' + esc(m.email) + '">' +
      '<b>' + esc(m.ten) + '</b>' +
      '<span>' + esc(m.email) + '</span>' +
      (m.phu ? '<i>' + esc(m.phu) + '</i>' : '') + '</button>';
  }).join('');

  return '<div class="cua-nen">' +

    '<div class="cua-trai">' +
      '<div class="cua-ngu">' +
        '<button type="button" class="btn sm ghost" data-cua-ngu>' + esc(t.doiNgu) + '</button>' +
      '</div>' +
      '<div class="cua-hieu"><span class="cua-dot"></span>Haustek</div>' +

      '<div class="cua">' +
        '<div class="cua-dau">' +
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

        '<div class="cua-chan"><span>' + esc(t.ghiChu) + '</span></div>' +
      '</div>' +

      (c.them ? '<div class="cua-them">' + c.them + '</div>' : '') +
    '</div>' +

    vePhai(c.phai) +
  '</div>';
}

/* ---------------------------------------------------------------------
   mo(cauHinh) — cửa duy nhất của file này
     ten     'internal' | 'portal'   · khoá phiên tách theo cổng
     tieuDe, phu
     dangNhap(email) → danh tính, hoặc ném
     mau     [{ email, ten, phu }]   · danh sách bản mẫu, có thể bỏ trống
     phai    xem vePhai() bên trên   · cột phải, có thể bỏ trống
     them    HTML thô dưới thẻ đăng nhập, có thể bỏ trống
     xong(danhTinh)                  · gọi khi đã vào được
   --------------------------------------------------------------------- */
function mo(c) {
  /* Bản gói một trang nạp mọi script ở PHẦN ĐẦU trang, nên lúc hàm này
     chạy thì document.body chưa tồn tại và appendChild ném ngay — trang
     trắng, không một dòng chữ. Hai trang thật không gặp vì script của
     chúng nằm trong <body>.
     HT.chay() đã vấp và đã chữa đúng kiểu này (haustek-shell.js, chỗ
     "if (!document.body)"); cửa đứng TRƯỚC khung nên phải tự chữa lấy. */
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', function () { mo(c); });
    return;
  }

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

/* =====================================================================
   CHỮ Ở TẤM BÊN PHẢI — MỘT NGUỒN DUY NHẤT
   ---------------------------------------------------------------------
   Trước đây đoạn chữ này nằm nguyên văn ở BA chỗ: v2/intranet.html,
   v2/khach.html và dung-goi.js. Ba bản chép tay của cùng một đoạn thì
   sớm muộn lệch nhau — đúng cái đã làm bản gói mất cửa đăng nhập ở vòng
   26, khi danh sách thư viện được gõ cứng ở hai nơi. Khai một chỗ ở đây,
   ba nơi cùng gọi.

   Chữ phải theo v2/VAN-PHONG.md. Hai điều dễ quên nhất:
     · cổng đối tác KHÔNG nhắc phí dịch vụ, doanh thu gộp, hay chữ "NET"
       (mục "partner-facing revenue" trong bảng thuật ngữ) — đó là đúng
       bức chắn mà test/api-guard.js canh ở tầng dữ liệu, nên chữ trên
       màn hình cũng phải giữ;
     · không gạch ngang dài giữa câu (mục 2.4).
   ===================================================================== */
function chu(lang) {
  var en = lang === 'en';
  return {
    noiBo: {
      nhan: en ? 'Internal portal' : 'Cổng nội bộ',
      h: en ? ['Every figure ', 'traces back', ' to one track']
            : ['Mỗi con số đều ', 'truy ngược được', ' về một bài hát'],
      p: en
        ? 'Revenue is recognised by period and by source, then the three-layer split runs. Every figure on every page opens up, down to the track that produced it.'
        : 'Doanh thu ghi nhận theo từng kỳ và từng nguồn, rồi chuỗi chia ba lớp chạy. Mọi con số trên mọi trang đều mở ra được, cho tới đúng bài hát sinh ra nó.',
      trich: en
        ? 'A partner only ever receives figures net of the fee. Gross revenue, the Haustek service fee and the distributor’s name are in no payload that crosses to the partner portal.'
        : 'Đối tác chỉ nhận số đã trừ phí. Doanh thu gộp, phí dịch vụ Haustek và tên đơn vị phân phối không nằm trong bất kỳ gói dữ liệu nào gửi sang cổng đối tác.',
      trichAi: en ? 'Design rule · test/api-guard.js checks every payload returned'
                  : 'Nguyên tắc dựng hệ · test/api-guard.js kiểm từng gói trả về'
    },
    doiTac: {
      nhan: en ? 'Partner portal' : 'Cổng đối tác',
      h: en ? ['Your money, ', 'explained', ' line by line']
            : ['Tiền của bạn, ', 'giải thích được', ' từng dòng'],
      p: en
        ? 'What each period paid, which platform it came from, what is sitting in your wallet, and where a withdrawal request has got to. The figures here are yours alone, with nobody else’s mixed in.'
        : 'Từng kỳ trả bao nhiêu, đến từ nền tảng nào, ví còn bao nhiêu, và yêu cầu rút tiền đang đi tới đâu. Số ở đây là của riêng bạn, không lẫn của ai khác.',
      trich: en
        ? 'Every figure here is what you actually receive. No table asks you to add up, subtract, or work out for yourself why this period differs from the last.'
        : 'Mọi con số ở đây đều là số bạn thực nhận. Không bảng nào bắt bạn tự cộng, tự trừ, hay tự đoán vì sao kỳ này khác kỳ trước.',
      trichAi: en ? 'How this portal is built' : 'Cách cổng này được dựng'
    }
  };
}

global.HTCua = { mo: mo, raKhoi: raKhoi, phienCua: phienCua, chu: chu };

})(window);
