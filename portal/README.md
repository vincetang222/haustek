# Haustek Portal — bản mẫu chạy được

Hai cửa, một lõi. Mở bằng trình duyệt là chạy, không cần cài gì.

Bản đang dùng là **v3**, ở thư mục `v2/`. Chi tiết kiến trúc ở
[`v2/README.md`](v2/README.md).

| File | Ai dùng | Làm gì |
|---|---|---|
| `v2/intranet.html` | Nội bộ Haustek | Hôm nay · Việc · Đối tác · Thông báo · Quản trị |
| `v2/khach.html` | Đối tác | Trang chủ · Việc · Nhạc · Thanh toán · Trao đổi · Tài khoản |
| `haustek-loi.js` | cả hai | Lõi dữ liệu, đóng vai database và API |
| `goi-mot-trang.html` | gửi đi xem | Cả hai cửa gói vào một file, mở bằng `file://` cũng chạy |
| `v2/phase2/` | không nạp | Mã của những gì đã tháo ra khỏi phase 1, giữ nguyên để dùng lại |

Hai file cũ `intranet.html` và `dashboard.html` ở thư mục gốc là bản v1,
giữ để đối chiếu, không còn phát triển.

## Phần mềm này là gì

**Sổ theo dõi việc** và **kênh thông báo** giữa Haustek với đối tác.
Chỉ vậy.

Việc thật diễn ra ở OneRPM, Believe, Warner và YouTube CMS: đưa nhạc lên
nền tảng, gỡ claim, đọc báo cáo doanh thu, xem tiền về. Portal không làm
lại, không chép về, không tính lại bất cứ thứ gì trong số đó.

Portal giữ đúng thứ không nơi nào khác giữ: ai phụ trách đối tác nào, đã
gọi ai lúc nào và chốt gì, Haustek hứa ngày nào, việc đang tới đâu, đã
đưa đối tác tệp gì, họ đã đọc chưa.

Xương sống là **việc**, mỗi việc gắn một trong mười mảng dịch vụ Haustek
bán: phát hành, label, sự kiện, sản xuất âm nhạc, booking, chiến lược
marketing, chiến dịch digital, mạng xã hội, content, media. Một hồ sơ
phát hành, một đêm diễn, một buổi thu, một tháng chăm kênh đều là một
việc, đi qua cùng một hàng đợi và cùng một dòng thời gian.

## Chạy thế nào

Mở thẳng `v2/intranet.html` bằng Chrome hoặc Firefox là được.

Muốn chắc ăn (và bắt buộc nếu dùng Safari) thì chạy một server tĩnh:

```bash
python3 -m http.server 8099 --directory .
# rồi mở http://127.0.0.1:8099/v2/intranet.html
```

Safari chặn `localStorage` với file mở thẳng từ ổ đĩa, nên trạng thái sẽ
không lưu được.

## Dữ liệu nằm ở đâu

Toàn bộ trạng thái nằm trong `localStorage`, khoá `haustek.portal.v3`.
Lần đầu mở, lõi gieo một bộ dữ liệu mẫu **xác định** (cùng hạt giống thì
cùng con số, ở mọi máy): 10 nhân sự, 40 đối tác, 120 việc, 500 bản phát
hành, hơn 3.000 dòng thời gian.

Lõi tự xoá khoá `haustek.portal.v1` và `v2` nếu gặp, rồi gieo lại. Không
có đường nào để dữ liệu của lõi cũ chạy trên lõi mới: hai mô hình dữ liệu
khác hẳn nhau, và một bản ghi nửa cũ nửa mới còn tệ hơn không có gì.

Muốn gieo lại từ đầu: mở console, gõ `HAUSTEK.admin.gieoLai()`.

## Hai cửa tách hẳn

`v2/khach.html` gọi `HAUSTEK.lockdown()` **trước khi nạp bất cứ trang
nào**. Sau dòng đó `HAUSTEK.admin` không còn tồn tại trong trang, nên một
trang đối tác gọi nhầm sẽ hỏng ngay và ồn ào, thay vì lặng lẽ đọc được dữ
liệu không thuộc về nó.

Ranh giới nguy hiểm nhất là **ghi chú nội bộ**. Lõi ép ba việc để nó
không lọt ra: `A.dong.them` ném lỗi nếu không nói rõ `hienChoDoiTac`,
dòng `ghi-chu` bị ép `false` kể cả khi người gọi cố đặt `true`, và trang
đối tác nội bộ có công tắc soi đúng cái đối tác sẽ đọc.
`test/api-guard.js` kiểm cả ba.

## Cửa nhận hồ sơ phát hành

Portal là trang tĩnh, không có máy chủ. Đường từ biểu mẫu công khai
`metadata.html` vào portal là **nhập tay có kiểm soát**: nhân viên dán
JSON mà Google Apps Script xuất ra vào ô "Nhận hồ sơ" ở trang Việc, và
`submission_id` **giữ nguyên** làm mã việc lẫn mã bản phát hành.

**Portal không sinh mã.** Sinh mã thứ hai ở đây là biến một không gian mã
thành hai, và từ đó mọi câu "bạn cho mình xin mã hồ sơ" đều có hai câu
trả lời đúng.

## Dựng bản gói một trang

```bash
node dung-goi.js            # ra goi-mot-trang.html
```

Bản gói nhúng sẵn bộ chữ, không gọi ra mạng ngoài, mở bằng `file://` vẫn
chạy đủ hai cửa.

## Kiểm thử

Xem [`test/README.md`](test/README.md). Phép kiểm bắt buộc chạy trong CI:

```bash
node test/api-guard.js
```
