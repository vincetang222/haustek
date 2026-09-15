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

## 3. Đường nâng cấp — dữ liệu có sống sót khi lên bản mới không

```bash
node portal/test/upgrade.js
```

25 phép kiểm. Đây là phép kiểm bảo vệ thứ duy nhất trong portal **không dựng lại
được**: tỷ lệ chia, khoản tạm ứng, và các kỳ đã duyệt. Danh mục và doanh thu sinh
lại y hệt từ seed; ba thứ trên thì không.

Tình huống dựng lại đúng như thật: người vận hành đã làm việc trên bản cũ, Haustek
đẩy bản mới có đổi lược đồ (`CFG.VERSION` khác đi), người vận hành mở lại trang.
Bản trước đây gặp phiên bản lạ thì `store.load()` trả `null`, lõi tưởng máy trắng,
seed lại, rồi lần `store.save()` đầu tiên ghi đè.

Kiểm những gì:

- sổ bản cũ được chép **nguyên vẹn từng byte** sang `haustek.portal.bak.<v>.<lúc>`
- người vận hành **thấy băng báo** ở cả 11 màn hình, kèm nút tải sổ cũ về —
  cứu được mà không nói thì người ta mở lên chỉ thấy sổ trắng và tin là mất sạch
- bấm "Để sau" chỉ giấu băng, **không** xoá khoá sao lưu
- mở lại năm lần vẫn chỉ giữ tối đa 3 bản sao
- JSON hỏng giữa chừng cũng cứu, cất dưới nhãn `khong-ro`
- cất không được (hết dung lượng) thì **khoá đường ghi** — thà không lưu được còn
  hơn nuốt mất sổ; kiểm bằng cách chặn `setItem` lên khoá sao lưu
- cùng phiên bản thì không đụng gì cả: không đẻ bản sao thừa, không hiện băng

Bản song sinh bên CRM là `crm/test/upgrade.mjs`.

Biến môi trường: `BASE` (mặc định `http://127.0.0.1:8099`), `CHROMIUM` (đường dẫn
chromium nếu playwright không tự tìm được), `SHOTS` (nơi lưu ảnh chụp).

Kiểm thử của CRM nằm ở `crm/test/smoke.mjs` — xem `crm/README.md`.
