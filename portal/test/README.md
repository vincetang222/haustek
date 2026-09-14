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
node portal/test/edge.js     # thu hồi duyệt sạch 12 kỳ rồi mở lại từng màn hình
```

`smoke.js` — mở từng màn hình, đổi sang kỳ chưa duyệt, đổi sang VND, và báo lỗi nếu
màn hình nào ném lỗi hoặc ghi ra console.

`flow.js` — đi đúng con đường một người vận hành đi hằng tháng, rồi kiểm tra kết quả
xuất hiện ở cổng khách:

```
nạp luồng còn thiếu → khớp một dòng treo → ghi nhận chênh lệch
  → chốt tỷ giá → duyệt kỳ → cổng khách thấy kỳ mới
```

`edge.js` — trường hợp biên khắc nghiệt nhất: thu hồi duyệt **sạch cả 12 kỳ**, rồi mở lại
từng màn hình intranet và cả cổng khách. Đây là chỗ code hay chết vì chia cho 0, đọc `[0]`
của mảng rỗng, hoặc so với kỳ trước không tồn tại.

Biến môi trường: `BASE` (mặc định `http://127.0.0.1:8099`), `CHROMIUM` (đường dẫn
chromium nếu playwright không tự tìm được), `SHOTS` (nơi lưu ảnh chụp).

## 3. CRM — chạy trong trình duyệt thật

```bash
node portal/test/crm-smoke.mjs
```

16 phép kiểm trên `portal/crm.html`. Khác với `api-guard.js`, file này phải mở
trình duyệt: CRM là một file HTML có script nội tuyến, đụng vào `document` ngay
lúc nạp, không tách ra chạy bằng Node được.

Cần Playwright (`npm i -D playwright`). Test tự tìm cả bản cài global.

Phủ những chỗ dễ vỡ nhất khi sửa file 5000 dòng đó:

- ranh giới quyền — A&R không vào được Nhật ký, Phân quyền, Bàn giao portal;
  không sửa được bản ghi người khác; chỉ thấy phần của mình
- mọi chuỗi từ dữ liệu vẫn qua `esc()` — thử nhét `<img onerror>` vào tên deal
- song ngữ VI/EN và hai tiền tệ USD/VND
- hai con số "tuần này" trên trang chính phải bằng nhau
- lưu trạng thái: đổi trạng thái rồi tải lại trang vẫn còn, và **không trường
  `Date` nào bị JSON biến thành chuỗi** — đây là phép kiểm quan trọng nhất
- cả 12 tab vẽ được, drawer, trang chi tiết, import wizard
- bảng ảo hoá: 5.000 cơ hội phải vẽ dưới 200ms
- khổ 390px: không view nào tràn ngang
