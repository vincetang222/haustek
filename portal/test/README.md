# Kiểm thử

## 1. Ranh giới hai cổng — không cần trình duyệt

```bash
node portal/test/api-guard.js
```

22 phép kiểm chạy thẳng trên lõi. Đây là thứ **phải chạy trong CI**.

Phép kiểm quan trọng nhất không phải quyền đọc số liệu, mà là **một dòng
nội bộ không có đường nào ra được cổng đối tác**. Một câu ghi chú kiểu
"đối tác này hay trả chậm, cẩn thận" lọt sang cổng đối tác là mất một
khách hàng, và không có nút hoàn tác nào cứu được.

Kiểm những gì:

- ghi chú nội bộ và nhật ký liên lạc không lọt qua bảy lối ra của cổng đối tác
- `A.dong.choDoiTac` chỉ trả dòng có `hienChoDoiTac = true`, đúng của đối tác đó
- dòng `ghi-chu` bị ép `hienChoDoiTac = false` kể cả khi người gọi cố đặt `true`
- `A.dong.them` ném lỗi nếu không nói rõ `hienChoDoiTac` hoặc thiếu `doiTacId`
- đối tác A không thấy việc, bảng kê, bản phát hành của đối tác B
- mã đối tác không có thật thì ném lỗi, không trả rỗng (trả rỗng thì lỗi
  phân quyền trông y hệt "chưa có dữ liệu")
- hai người dùng cùng một đối tác có lượt đọc thông báo riêng
- đổi cam kết phản hồi thì câu ở cổng đối tác đổi theo, và có một dòng nhật ký
- gửi thông báo theo nhóm sinh đúng một dòng cho mỗi đối tác nhận
- số tiền cổng đối tác thấy đúng bằng số ghi trên bảng kê, kèm nguồn
- không lối nào của cổng đối tác trả về `doanhThu`, `luotNghe`, `duBao`, `soDu`
- `lockdown()` gỡ hẳn mặt tiền admin và ranh giới vẫn giữ nguyên sau đó

Phép kiểm chọn đối tác **có đủ bảng kê, bản phát hành và việc**, để không
phép nào rơi vào nhánh "bỏ qua": một test luôn xanh vì không chạy còn tệ
hơn không có test.

Một phép kiểm mang **nhãn cảnh báo có chủ ý**: bản mẫu chưa có phiên đăng
nhập nên `doiTacId` đến từ tham số. Khi lên thật, `doiTacId` phải lấy từ
phiên trên máy chủ; không thì sửa một chuỗi trên URL là xem được đối tác
khác, và 21 phép kiểm còn lại trở nên vô nghĩa.

Khi lên Postgres, dịch từng phép kiểm ở đây thành một policy RLS theo
`doiTacId`.

## 2. Trình duyệt thật

Cần một server tĩnh đang chạy và `playwright` (`npm i -g playwright`).

```bash
python3 -m http.server 8099 --directory portal &
NODE_PATH=$(npm root -g) node portal/test/v2-quet.js v2/intranet.html 1500,1280,1100
NODE_PATH=$(npm root -g) node portal/test/v2-quet.js v2/khach.html 390,640,900
NODE_PATH=$(npm root -g) node portal/test/v2-tuong-phan.js
NODE_PATH=$(npm root -g) node portal/test/v2-hep.js
NODE_PATH=$(npm root -g) node portal/test/v2-khong-mang.js
```

- `v2-quet.js` mở từng mục điều hướng và từng tab ở cả hai chế độ sáng/tối,
  bắt lỗi JavaScript, trang trống, chữ tràn khung, chỗ trống `{…}` lọt ra
- `v2-tuong-phan.js` đo tương phản theo WCAG AA ở cả hai chế độ
- `v2-hep.js` kiểm bố cục ở khung hẹp
- `v2-khong-mang.js` chặn mọi lời gọi ra ngoài, kiểm bản gói vẫn chạy

## 3. Những phép kiểm riêng của vòng 11

Nằm trong thư mục nháp của phiên làm việc, không nằm trong repo. Ba phép
đáng dựng lại nếu cần:

- **Rò ghi chú qua trình duyệt thật**: viết một ghi chú nội bộ ở trang đối
  tác, bật công tắc "Chỉ những dòng đối tác thấy", rồi mở luôn cổng đối tác
  của chính họ. Câu bí mật không được xuất hiện ở hai chỗ sau.
- **Quét `undefined` / `NaN`**: đọc nhầm tên một trường thì JavaScript không
  báo lỗi, nó lặng lẽ in ra "undefined" giữa một câu tiếng Việt. Quét 352
  lượt vẽ (mọi trang × mọi đối tác mẫu × sáu nhân sự) tìm đúng những chữ đó.
  Vòng 11 bắt được ba lỗi kiểu này mà mọi phép kiểm khác đều để lọt.
- **Chiều cao trang**: trang nào cao quá thì người dùng phải cuộn qua thứ
  họ không cần để tới thứ họ cần. Ngưỡng: 2.600 px là đáng xem lại, 4.000 px
  là phải sửa.

## 4. Cổng đo được bằng `grep`

```bash
grep -n "'!'"            portal/v2/man/*.js   # huy hiệu không còn tiền tố cảnh báo
grep -nE "thongBao\(.*\.message" portal/v2/man/*.js   # không dội mã lỗi ra giao diện
grep -n "danger"         portal/v2/man/k-*.js # cổng đối tác không có màu đỏ
grep -n "HB\.\|HTM\.\|HTS\." portal/v2/man/*.js   # không nạp mô-đun đã tháo
grep -n "c\.A\b"         portal/v2/man/k-*.js # cổng đối tác không chạm mặt tiền nội bộ
```

Cả năm phải ra rỗng. Thêm một phép đếm: số toast `'ok'` phải lớn hơn hoặc
bằng số toast `'no'` trong `portal/v2/man/` — một phần mềm chỉ biết báo
lỗi là một phần mềm không bao giờ khen được ai.
