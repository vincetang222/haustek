# Haustek Portal v2

Hai cửa, một lõi.

```
portal/
  haustek-core.js          máy chủ giả lập — dữ liệu, luật chia tiền, hai mặt tiền admin/api
  v2/
    haustek-theme.css      hệ màu và thành phần giao diện, hai chế độ sáng/tối
    haustek-shell.js       khung ứng dụng: điều hướng, ngôn ngữ, chế độ, hộp thoại, bảng
    haustek-bieudo.js      biểu đồ SVG theo biến CSS (đổi chế độ là đổi màu, không vẽ lại tay)
    haustek-man.js         khuôn dùng chung cho mười lăm màn hình
    intranet.html          CỬA NỘI BỘ  — giữ HAUSTEK.admin
    khach.html             CỔNG KHÁCH — gọi HAUSTEK.lockdown() rồi chỉ còn HAUSTEK.api
    man/                   mười lăm màn hình, mỗi màn một file
```

## Hai cửa tách hẳn

| | Nội bộ (`intranet.html`) | Khách (`khach.html`) |
|---|---|---|
| Mặt tiền dữ liệu | `HAUSTEK.admin` — toàn quyền | `HAUSTEK.api` — đã lọc, đã tính sẵn |
| Kỳ nhìn thấy | cả 12 kỳ, kể cả kỳ đang làm dở | chỉ kỳ **đã duyệt** |
| Bí mật kinh doanh | tên đơn vị phân phối, tỷ lệ gốc — nạp lúc khởi động | không có trong bản lõi khách tải về |
| Sửa được gì | nạp, khớp, tỷ lệ, tạm ứng, duyệt kỳ | không sửa gì |
| Màn hình | 10 | 5 |

Hai file HTML nạp **cùng một** `haustek-core.js`. Khác nhau ở dòng đầu: `khach.html`
gọi `HAUSTEK.lockdown()` **trước khi** nạp bất cứ màn hình nào, và không bao giờ gọi
`provideSecrets()`.

> Nói cho đúng: đây là **hình dạng** của ranh giới, không phải ranh giới đã được thực
> thi. Hai trang cùng gốc thì nạp lại lõi trong iframe là có lại `.admin`, và
> `localStorage` thì trang nào cùng gốc cũng đọc được. Xem tab **Quản trị → Ranh giới
> hai cửa** để biết cái gì thật sự chặn được và cái gì không.

## Mười màn nội bộ

| Màn | File | Trả lời câu gì |
|---|---|---|
| Tổng quan | `man/tong-quan.js` | Kỳ này đóng được chưa, tiền chia đi đâu, còn gì treo |
| Nạp dữ liệu | `man/nap-du-lieu.js` | Kỳ nào thiếu luồng nào — lưới 12 kỳ × 4 nguồn |
| Khớp ISRC | `man/khop-isrc.js` | Tiền chưa có chủ nằm ở đâu, khớp về ai |
| Đối chiếu & duyệt kỳ | `man/doi-chieu.js` | Tổng hệ thống có khớp file gốc không, duyệt được chưa |
| **Kế toán** | `man/ke-toan.js` | Bút toán kỳ, công nợ bên nhận, tạm ứng phải thu, ghi nhận 12 kỳ, thuế |
| Chi trả | `man/chi-tra.js` | Ai nhận bao nhiêu, vì sao phần còn lại chưa về tay họ |
| Tạm ứng | `man/tam-ung.js` | Ai còn nợ, thu hồi tới đâu, còn mấy kỳ nữa |
| Tỷ lệ chia | `man/ty-le.js` | Bảng tỷ lệ có ngày hiệu lực, đổi từ kỳ nào |
| Danh mục | `man/danh-muc.js` | 50.000 bản ghi, tìm được, mở ra xem tiền từng bài |
| Quản trị | `man/quan-tri.js` | Tài khoản, nhật ký, câu hỏi treo, dữ liệu, ranh giới |

## Năm màn khách

| Màn | File | Trả lời câu gì |
|---|---|---|
| Tổng quan | `man/k-tong-quan.js` | Kỳ này tôi được bao nhiêu, vì sao, bao giờ tiền vào |
| Bài của tôi | `man/k-ban-ghi.js` | Từng bài, phần về tay tôi trên mỗi bài |
| Bảng kê | `man/k-bang-ke.js` | Bản đối chiếu chính thức — in ra, tải về, gửi kế toán |
| Tạm ứng | `man/k-tam-ung.js` | Vì sao kỳ này có doanh thu mà không nhận được tiền |
| Tài liệu | `man/k-tai-lieu.js` | Bảng kê các kỳ cũ, và câu trả lời cho những câu hay hỏi |

## Chế độ sáng/tối

Ba trạng thái, không phải hai. Nút bật/tắt nằm trên thanh trên của cả hai cửa.

* **Theo máy** — không đóng dấu gì lên thẻ gốc, `prefers-color-scheme` quyết định
* **Sáng** — `[data-theme="light"]`, thắng cả khi máy đang tối
* **Tối** — `[data-theme="dark"]`, thắng cả khi máy đang sáng

Lựa chọn lưu ở `localStorage` (`haustek.theme`), cùng chỗ với ngôn ngữ (`haustek.lang`).
Mọi thành phần chỉ đọc **biến CSS**, không viết mã màu trực tiếp — kể cả biểu đồ, nên
đổi chế độ không cần vẽ lại bằng tay. 21/21 cặp màu chữ–nền đạt chuẩn tương phản
WCAG AA ở **cả hai** chế độ.

## Thêm một màn hình

```js
HT.dangKy({
  id: 'ma-man',              // dùng làm #hash
  nav: 'khoaChu',            // khoá chữ cho nhãn ở cột trái
  nhom: 'khoaNhom',          // khoá chữ cho tên nhóm (không bắt buộc)
  icon: 'grid',              // tên icon trong HT.IC
  dem: function (c) { ... }, // con số nhỏ cạnh nhãn; '!' đứng đầu = màu cảnh báo
  chu: { vi: { khoaChu: 'Tên màn', ... }, en: { khoaChu: 'Screen', ... } },
  ve: function (root, c) { root.innerHTML = '…'; HB.gan(root); }
});
```

`c` (ngữ cảnh) mang: `lang cur kyKey ky kys fmt esc icon CHU t() tien() tien2()
doiKy() di() veLai() thongBao() hoiThoai() xacNhan() nganTruot() dongNgan() bang()
A api phien`.

Khung **thay hẳn thẻ `<main>`** mỗi lần vẽ, nên sự kiện gắn bằng `HM.bam(root, …)`
chết theo thẻ cũ — màn hình không phải nhớ gỡ tay.

## Chạy thử

```bash
cd portal && python3 -m http.server 8099
# rồi mở http://127.0.0.1:8099/v2/intranet.html
```

Bài kiểm (cần `NODE_PATH=$(npm root -g)`):

```bash
node test/v2-quet.js  v2/intranet.html 1500,1280,1100   # mọi màn × mọi tab × 2 chế độ × 2 ngôn ngữ
node test/v2-quet.js  v2/khach.html    1500,1280,1100
node test/v2-bam.js                                     # bấm vào mọi dòng, mọi hộp thoại
node test/v2-khach-tk.js                                # 11 tài khoản khách, mỗi tài khoản một góc nhìn
node test/v2-luong.js                                   # chuỗi vận hành: nạp → khớp → chốt → duyệt → khách thấy
node test/api-guard.js                                  # ranh giới quyền và chuỗi tiền
```

Ba bài đầu cần Chromium ở `/opt/pw-browsers/chromium-1194/` và bộ font thật ở
`/tmp/fonts-local.css` (xem `test/README.md`) — thiếu font thì trang render bằng font
dự phòng rộng hơn, và bài kiểm bố cục đo nhầm thứ.
