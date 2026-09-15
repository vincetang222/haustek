/* =====================================================================
   VÀO CỬA — gieo sẵn phiên đăng nhập cho bộ kiểm trình duyệt
   ---------------------------------------------------------------------
   Từ vòng 25, mở cổng mà chưa đăng nhập thì thấy trang đăng nhập chứ
   không thấy cổng. Đúng như hệ thật, và đúng như mong muốn — nhưng nó
   làm mọi bài kiểm đang mở thẳng vào cổng phải đi qua cửa.

   Thay vì sửa từng lệnh goto ở mười hai file, file này bọc newPage() để
   mỗi trang mới tự mang sẵn một phiên. Mỗi bài kiểm chỉ thêm ĐÚNG MỘT
   dòng sau khi mở trình duyệt:

       require('./vao-cua.js').gan(b);

   Bài kiểm nào muốn kiểm CHÍNH CÁI CỬA thì đừng gọi hàm này —
   test/cua-dang-nhap.js là bài ấy.

   Gieo phiên ở đây KHÔNG phải là đi vòng qua hàng rào: lõi vẫn tra email
   ở mỗi lần nạp trang (HTCua.mo gọi lại dangNhap ngay cả khi đã có
   phiên), nên email sai hay tài khoản bị khoá vẫn bị đá ra cửa.
   ===================================================================== */
"use strict";

const NOI_BO_MAC_DINH = "mgmt@haustek-group.com";
const DOI_TAC_MAC_DINH = "label1@vidu.vn";

/* Bọc b.newPage: mọi trang mở sau lời gọi này đều mang sẵn phiên.
     gan(b)                                  · hai tài khoản mặc định
     gan(b, { doiTac: 'artist3@vidu.vn' })    · đổi bên cổng đối tác
     gan(b, { noiBo: 'ops1@haustek-group.com' }) · đổi bên cổng nội bộ */
/* CHỈ gieo khi chưa có phiên. addInitScript chạy lại ở MỌI lần điều hướng,
   kể cả reload — gieo vô điều kiện thì bài kiểm nào đặt phiên rồi reload sẽ
   bị đá về tài khoản mặc định ngay lập tức. Đã gặp thật: v2-khach-tk quét
   mười sáu tài khoản mà cả mười sáu lần đều là Nightform Records, và vẫn
   báo "sạch". Một bài kiểm hỏng kiểu ấy tệ hơn một bài kiểm đỏ. */
function gieo(doiTuong, noiBo, doiTac) {
  return doiTuong.addInitScript(([nb, dt]) => {
    try {
      if (!sessionStorage.getItem("haustek.phien.internal"))
        sessionStorage.setItem("haustek.phien.internal", JSON.stringify({ email: nb }));
      if (!sessionStorage.getItem("haustek.phien.portal"))
        sessionStorage.setItem("haustek.phien.portal", JSON.stringify({ email: dt }));
    } catch (e) {}
  }, [noiBo, doiTac]);
}

function gan(b, o) {
  o = o || {};
  const noiBo = o.noiBo || NOI_BO_MAC_DINH;
  const doiTac = o.doiTac || DOI_TAC_MAC_DINH;
  /* Bọc CẢ HAI đường mở trang. Bộ kiểm trong kho dùng lẫn lộn:
     b.newPage() ở bài này, b.newContext().newPage() ở bài kia. Bọc mỗi
     newPage là bài dùng newContext lọt qua và chết ở '.app' bằng null —
     đã gặp thật với v2-hep lúc dựng vòng 25. */
  if (!b.__cuaGoc) b.__cuaGoc = { newPage: b.newPage.bind(b), newContext: b.newContext.bind(b) };
  const goc = b.__cuaGoc;
  b.newPage = async function () {
    const p = await goc.newPage.apply(null, arguments);
    await gieo(p, noiBo, doiTac);
    return p;
  };
  b.newContext = async function () {
    const ctx = await goc.newContext.apply(null, arguments);
    await gieo(ctx, noiBo, doiTac);
    return ctx;
  };
  return b;
}

/* Đổi tài khoản giữa chừng trên một trang đã mở: đặt phiên rồi nạp lại.
   Dùng cho bài kiểm quét nhiều tài khoản (v2-khach-tk). */
async function doiTaiKhoan(p, cong, email) {
  await p.evaluate(([c, e]) => {
    try { sessionStorage.setItem("haustek.phien." + c, JSON.stringify({ email: e })); } catch (err) {}
  }, [cong, email]);
}

module.exports = { gan, doiTaiKhoan, NOI_BO_MAC_DINH, DOI_TAC_MAC_DINH };
