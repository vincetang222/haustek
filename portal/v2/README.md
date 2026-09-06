# Haustek Portal v3

Hai cửa, một lõi.

```
portal/
  haustek-loi.js           lõi: dữ liệu, việc, dòng thời gian, hai mặt tiền admin/api
  v2/
    haustek-theme.css      hệ màu và thành phần giao diện, hai chế độ sáng/tối
    haustek-shell.js       khung: điều hướng phẳng, hộp thoại, ngăn trượt, bảng, chuông, tìm nhanh
    haustek-man.js         khuôn dùng chung cho mười một trang: ô số, thẻ, tab, biểu mẫu, phân trang
    haustek-hoso.js        hồ sơ phát hành bốn bước, dùng chung cả hai cửa
    intranet.html          CỬA NỘI BỘ    — giữ HAUSTEK.admin
    khach.html             CỬA ĐỐI TÁC   — gọi HAUSTEK.lockdown() rồi chỉ còn HAUSTEK.api
    fonts-nhung.css        bộ chữ nhúng sẵn (Be Vietnam Pro, IBM Plex Mono), không gọi ra Google Fonts
    VAN-PHONG.md           chuẩn thuật ngữ và văn phong tiếng Việt cho mọi chữ trên cổng
    NGHIEN-CUU-NGUOI-DUNG.md  từng vai dùng cổng để làm gì, trang nào trả lời, chỗ nào còn thiếu
    man/                   mười một trang, mỗi trang một file
    phase2/                các trang và mô-đun đã tháo ra khỏi phase 1, giữ nguyên để dùng lại
  dung-goi.js              dựng goi-mot-trang.html: cả hai cửa trong một file
  goi-mot-trang.html       bản gói đã dựng
  test/                    bộ kiểm thử (xem test/README.md)
```

## Phần mềm này là gì

Haustek Portal là **sổ theo dõi việc** và **kênh thông báo** giữa Haustek và
đối tác. Chỉ vậy.

Việc thật diễn ra ở **OneRPM, Believe, Warner và YouTube CMS**: đưa nhạc lên
nền tảng, gỡ claim, đọc báo cáo doanh thu, xem tiền về. Portal không làm lại,
không chép về, không tính lại bất cứ thứ gì trong số đó. Con số nào portal tự
tính ra mà bên phân phối cũng có thì là con số thứ hai, và con số thứ hai luôn
là con số sai.

Portal giữ đúng thứ **không nơi nào khác giữ**:

* ai phụ trách đối tác nào
* đã gọi ai lúc nào và chốt được gì
* Haustek hứa ngày nào
* việc đang tới đâu, ai đang nợ ai bước tiếp theo
* đã đưa đối tác tệp gì, đã gửi thông báo gì, họ đã đọc chưa

Xương sống là **việc** (`viec`), mỗi việc gắn một trong mười mảng dịch vụ
Haustek bán. Một hồ sơ phát hành, một đêm diễn, một buổi thu, một tháng chăm
kênh đều là một việc, đi qua cùng một hàng đợi và cùng một dòng thời gian.

## Hai cửa tách hẳn

| | Nội bộ (`intranet.html`) | Đối tác (`khach.html`) |
|---|---|---|
| Mặt tiền dữ liệu | `HAUSTEK.admin` — đọc hết, ghi theo vai | `HAUSTEK.api` — chỉ phần của chính mình |
| Dòng thời gian | mọi dòng, kể cả ghi chú nội bộ và nhật ký liên lạc | chỉ dòng có `hienChoDoiTac = true` |
| Số tiền | số ghi trên bảng kê PDF, kèm nguồn | y hệt, kèm nguồn |
| Khoá cửa | không | `HAUSTEK.lockdown()` chạy **trước** khi nạp trang nào |

`lockdown()` gỡ hẳn `HAUSTEK.admin` khỏi trang. Sau dòng đó, một trang đối tác
gọi nhầm `c.A` sẽ hỏng ngay và ồn ào, thay vì lặng lẽ đọc được dữ liệu không
thuộc về nó.

### Ranh giới quan trọng nhất

Một câu ghi chú nội bộ kiểu *"đối tác này hay trả chậm, cẩn thận"* lọt sang
cổng đối tác là mất một khách hàng, và không có nút hoàn tác nào cứu được. Nên
lõi ép ba việc:

1. `A.dong.them(o)` **ném lỗi** nếu thiếu `doiTacId` hoặc nếu người gọi không
   nói rõ `hienChoDoiTac`. Không có giá trị mặc định, vì mặc định im lặng là
   cách rò dữ liệu phổ biến nhất.
2. Dòng `loai: 'ghi-chu'` bị **ép** `hienChoDoiTac = false`, kể cả khi người
   gọi cố đặt `true`.
3. Trang `doi-tac` có công tắc **"Chỉ những dòng đối tác thấy"** gọi
   `A.dong.choDoiTac(id)`, để người viết ghi chú nhìn tận mắt cái đối tác sẽ
   đọc, trước khi gõ thêm câu nào.

`portal/test/api-guard.js` kiểm cả ba, cộng ranh giới giữa hai đối tác bất kỳ.

## Sáu mục nội bộ, sáu trang đối tác

**Nội bộ** — năm mô-đun, sáu mục điều hướng:

| id | Tên | Trả lời câu gì |
|---|---|---|
| `hom-nay` | Hôm nay | Hôm nay ai cần gì ở tôi, và đội đã làm được gì |
| `viec` | Việc | Hàng đợi duy nhất của cả mười mảng dịch vụ |
| — | Hồ sơ phát hành | Lối tắt tới `#viec?dichVu=phat-hanh`, không phải mô-đun riêng |
| `doi-tac` | Đối tác | Sổ đối tác, và trang câu chuyện của từng đối tác |
| `thong-bao` | Thông báo | Soạn và gửi thông báo; tab thứ hai là Bảng kê |
| `quan-tri` | Quản trị | Nhân sự, tài khoản cổng đối tác, dịch vụ, nhật ký |

**Đối tác** — sáu trang, và điều hướng **sinh theo dịch vụ đối tác thật sự
mua**. Một thương hiệu chỉ chạy chiến dịch digital thấy bốn trang, chứ không
thấy một bức tường trang tiền trống trông như hỏng:

`k-trang-chu` · `k-viec` · `k-nhac` (chỉ khi có `phat-hanh` hoặc `label`) ·
`k-thanh-toan` (chỉ khi dịch vụ có tiền về) · `k-trao-doi` · `k-tai-khoan`

Trang `doi-tac` nội bộ có nút **"Xem cổng như đối tác này"**. Không có nút đó
thì đặt sai một trường `dichVu` sẽ âm thầm giấu mất trang Thanh toán của một
đối tác, và không ai biết cho tới lúc họ gọi điện hỏi.

## Cửa nhận hồ sơ phát hành

Portal là trang tĩnh, không có máy chủ. Trong phase 1, đường từ biểu mẫu công
khai `metadata.html` vào portal là **nhập tay có kiểm soát**: nhân viên dán
JSON mà Google Apps Script xuất ra vào ô "Nhận hồ sơ" ở trang `viec`, và
`submission_id` **giữ nguyên** làm `viec.id` và `banPhatHanh.id`.

**Portal không sinh mã.** Ghi rõ ở đây để lời hứa "một không gian mã" không âm
thầm thành hai. Webhook tự động là phase 2.

## Điều khung không làm

`haustek-shell.js`, `haustek-man.js` và `haustek-hoso.js` **không có một tham
chiếu `HAUSTEK.` nào**. Khung chỉ biết hợp đồng `HT.chay()` và `HT.dangKy()`.
Nhờ vậy lõi thay được mà khung giữ nguyên, và vòng này đã thay thật: 5.223
dòng `haustek-core.js` xuống còn một lõi gọn hơn nhiều.

Khung cũng **không có biểu đồ**. Phase 1 không vẽ một biểu đồ nào; mọi thứ
"bao nhiêu phần trăm rồi" đều là `HM.thanh()`.

## Điều đã tháo sang phase sau

Ví và số dư khả dụng · rút tiền · dự báo tăng trưởng · mức trả nền tảng ·
lượt nghe và xu hướng · playlist · cảnh báo chất lượng · chia sẻ tác quyền theo
phần trăm · đối soát và khớp ISRC · xét duyệt kỳ · sổ kế toán và thuế khấu trừ ·
cây tổ chức có đếm sống · ma trận phân quyền nhiều vai · uỷ quyền xem giữa label
mẹ và label con · trang báo cáo riêng cho bốn mảng marketing · tiếng Anh toàn
giao diện.

Mã của chúng nằm nguyên trong `v2/phase2/`, không xoá. Cái gì có người xin thì
lấy lại; cái gì một năm không ai xin thì lúc đó mới xoá.

## Chạy thử

```bash
python3 -m http.server 8099 --directory .
# rồi mở
#   http://127.0.0.1:8099/portal/v2/intranet.html
#   http://127.0.0.1:8099/portal/v2/khach.html

node portal/dung-goi.js          # dựng lại goi-mot-trang.html
node portal/test/api-guard.js    # ranh giới hai cổng, không cần trình duyệt
```
