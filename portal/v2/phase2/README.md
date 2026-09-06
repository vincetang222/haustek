# Phase 2 · đã tháo ra, chưa xoá

Vòng 11 thu hẹp phạm vi phần mềm: Haustek Portal chỉ còn là **sổ theo dõi
việc** và **kênh thông báo** giữa Haustek với đối tác. Mọi thứ trùng với
OneRPM, Believe, Warner và YouTube CMS đều được tháo ra khỏi phase 1.

Mã của chúng nằm nguyên ở đây, không xoá. Lý do đơn giản: xoá thì mất hẳn,
mà giữ lại một thư mục không được nạp thì không tốn gì cả (bản gói chỉ đọc
những tệp có tên trong `dung-goi.js`). Cái gì có người xin thì lấy lại; cái
gì một năm không ai xin thì lúc đó mới xoá, và lúc đó xoá là một quyết định
có căn cứ chứ không phải một cú đoán.

## Đang giữ ở đây

| Tệp | Là gì |
|---|---|
| `haustek-core.js` | Lõi cũ, 5.223 dòng. Mô hình dữ liệu xoay quanh bản ghi, kỳ tác quyền và chia tiền. |
| `haustek-bieudo.js` | Thư viện biểu đồ SVG. Phase 1 không vẽ biểu đồ nào. |
| `haustek-taisan.js` | Ngăn chi tiết bài hát: quy trình 11 bước, trạng thái từng nền tảng, ma trận theo tháng. |
| `haustek-them.js` | Mảnh giao diện vòng 5: cảnh báo chất lượng, chia sẻ tác quyền, ngưỡng, chiến dịch. Phần biểu mẫu và phân trang của tệp này đã gộp vào `haustek-man.js`. |
| `man/` (42 trang) | Toàn bộ trang của hai cổng trước vòng 11. |

## Muốn chạy lại một trang ở đây

Ba việc, theo thứ tự:

1. Trang cũ gọi `haustek-core.js`, không gọi `haustek-loi.js`. Hai lõi có
   mô hình dữ liệu khác hẳn nhau, nên không có đường nào "nạp cả hai".
   Hoặc viết lại trang theo lõi mới, hoặc dựng riêng một cửa chạy lõi cũ.
2. Khung đã đổi: không còn nhóm điều hướng, không còn ô chọn kỳ,
   `dungDuoc()` không còn hỏi `A.quyen.man`, hợp đồng `dem` đổi sang
   `{n, muc}`. Trang cũ nào đọc `c.kyKey` hoặc `c.kys` sẽ nhận `undefined`.
3. Thêm tên trang vào `dung-goi.js` và vào tệp HTML của cửa tương ứng.

## Vì sao từng thứ bị tháo

**Ví, số dư khả dụng, rút tiền, dự báo, mức trả nền tảng, lượt nghe, xu
hướng, playlist, cảnh báo chất lượng.** Tất cả đều là số liệu mà bên phân
phối đã có, tính đúng hơn và cập nhật sớm hơn. Portal chép về là tạo ra bản
thứ hai của cùng một con số, và bản thứ hai bao giờ cũng cũ hơn bản gốc.
Chỗ nào cần số thật thì phase 1 đưa đường dẫn ra công cụ thật.

**Đối soát, khớp ISRC, xét duyệt kỳ, sổ kế toán, thuế khấu trừ.** Đây là
việc của phần mềm kế toán, không phải của một sổ theo dõi việc. Nếu kế toán
thật sự đang dùng, phần này quay lại nguyên vẹn ở phase 2 và tách thành
mô-đun riêng.

**Cây tổ chức có đếm sống, ma trận phân quyền nhiều vai, uỷ quyền xem giữa
label mẹ và label con.** Với mười người thì đây là trang trí, và trang trí
trong phần mềm nghiệp vụ là chỗ để sai lệch trốn vào.

**Chia sẻ tác quyền theo phần trăm, mời người cộng tác.** Đã có sẵn trong
OneRPM và Believe, làm kỹ hơn.

**Trang báo cáo riêng cho bốn mảng marketing.** Phase 1 mỗi mảng có một thẻ
việc trong hàng đợi chung. Trang riêng chỉ nên có khi có người xin.
