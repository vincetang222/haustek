# Kiểm thử

## 1. Ranh giới quyền — không cần trình duyệt

```bash
node portal/test/api-guard.js
```

18 phép kiểm chạy thẳng trên lõi. Đây là thứ **phải chạy trong CI** — mốc số 2 trong tài
liệu bàn giao: chứng minh nghệ sĩ A không truy vấn được dữ liệu nghệ sĩ B.

Kiểm những gì:

- nghệ sĩ A không đọc được bài, tổng, hay chi tiết của nghệ sĩ B
- label chỉ thấy nghệ sĩ trong label mình, không mở được tab tác quyền,
  không đọc được bản ghi của nghệ sĩ độc lập
- kỳ chưa duyệt: không một lời gọi nào trả về số — kể cả số đúng
- payload gửi xuống khách không chứa tên đơn vị phân phối, mã đối tác, hay tỷ lệ gốc
- tổng khách nhìn thấy khớp tổng admin tính ra, tới từng xu
- chuỗi chia tiền cân: phí + phần label giữ + điểm producer + phần nghệ sĩ = doanh thu gộp
- điểm producer trừ vào phần nghệ sĩ, không cộng thêm bên trên
- `lockdown()` gỡ hẳn mặt tiền admin và mọi ranh giới vẫn giữ nguyên sau đó

Một phép kiểm mang **nhãn cảnh báo có chủ ý**: bản mẫu chưa có phiên đăng nhập nên
`partyId` đến từ tham số. Khi lên thật, `partyId` phải lấy từ phiên trên máy chủ —
không thì sửa một con số trên URL là xem được người khác, và 17 phép kiểm còn lại
trở nên vô nghĩa.

Khi lên Postgres, dịch từng phép kiểm ở đây thành một test SQL trên policy RLS.

## 2. Trình duyệt thật

Cần một server tĩnh đang chạy và `playwright` (`npm i -g playwright`).

```bash
npx http-server portal -p 8099 -c-1 &

node portal/test/smoke.js    # vẽ hết mọi màn hình intranet, gom lỗi console
node portal/test/flow.js     # đi hết một chu trình vận hành
```

`smoke.js` — mở từng màn hình, đổi sang kỳ chưa duyệt, đổi sang VND, và báo lỗi nếu
màn hình nào ném lỗi hoặc ghi ra console.

`flow.js` — đi đúng con đường một người vận hành đi hằng tháng, rồi kiểm tra kết quả
xuất hiện ở cổng khách:

```
nạp luồng còn thiếu → khớp một dòng treo → ghi nhận chênh lệch
  → chốt tỷ giá → duyệt kỳ → cổng khách thấy kỳ mới
```

Biến môi trường: `BASE` (mặc định `http://127.0.0.1:8099`), `CHROMIUM` (đường dẫn
chromium nếu playwright không tự tìm được), `SHOTS` (nơi lưu ảnh chụp).
