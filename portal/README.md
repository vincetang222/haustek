# Haustek Portal — bản mẫu chạy được

Hai trang, một lõi dữ liệu. Mở bằng trình duyệt là chạy, không cần cài gì.

| File | Ai dùng | Làm gì |
|---|---|---|
| `intranet.html` | Nội bộ Haustek | Nạp dữ liệu, khớp ISRC, đối chiếu, duyệt kỳ, đặt tỷ lệ, tạm ứng, chi trả, tài khoản |
| `dashboard.html` | Label và nghệ sĩ | Xem số của kỳ đã duyệt, bóc theo cửa hàng và lãnh thổ, xem tiền đi đâu |
| `haustek-core.js` | cả hai | Lõi dữ liệu — đóng vai database + API |
| `haustek-ui.css` | cả hai | Bảng màu và các thành phần giao diện |
| `screens/*.js` | intranet | Mỗi file một màn hình, tự đăng ký vào khung |

## Chạy thế nào

Mở thẳng `intranet.html` bằng Chrome hoặc Firefox là được.

Muốn chắc ăn (và bắt buộc nếu dùng Safari) thì chạy một server tĩnh trong thư mục này:

```bash
npx http-server -p 8099 -c-1 .
# rồi mở http://127.0.0.1:8099/intranet.html
```

Safari chặn `localStorage` với file mở thẳng từ ổ đĩa, nên trạng thái sẽ không lưu được.
Trong trường hợp đó dùng nút **Snapshot** ở góc trên để xuất/nhập trạng thái bằng file JSON.

## Số liệu từ intranet chảy sang dashboard bằng cách nào

Đây là câu hỏi chính, nên nói rõ.

**Danh mục và doanh thu không được truyền đi.** Chúng sinh tại chỗ bằng một bộ sinh số giả
ngẫu nhiên có hạt giống cố định — hai trang mở riêng vẫn ra đúng cùng một con số, không cần
đồng bộ gì.

**Thứ được truyền là QUYẾT ĐỊNH của admin:** đã nạp luồng nào cho kỳ nào, khớp tay dòng nào,
tỷ lệ đổi từ kỳ nào, tạm ứng bao nhiêu, và **đã duyệt kỳ nào**. Chừng đó nằm gọn trong một
object JSON nhỏ, lưu ở `localStorage`, khoá `haustek.portal.v1`.

Chuỗi việc đầy đủ:

```
intranet: nạp đủ 3 luồng cho kỳ X
        → khớp nốt các dòng treo ở hàng chờ ISRC
        → đối chiếu: tổng file gốc = đã khớp + đang treo, lệch phải bằng 0
        → chốt tỷ giá cho kỳ
        → DUYỆT KỲ  ← cánh cửa duy nhất
        → chạy bảng chi trả (trừ tạm ứng, áp ngưỡng chi trả)
dashboard: kỳ X hiện ra trong ô chọn kỳ, và chỉ lúc này mới hiện
```

Chưa duyệt thì `HAUSTEK.api` ném lỗi cho mọi lời gọi vào kỳ đó. Không phải ẩn đi — là
không trả về.

Mở hai tab cạnh nhau: duyệt một kỳ ở intranet, tab dashboard tự nhận ra và tải lại
(qua sự kiện `storage`).

## Hai mặt tiền, một lõi

```
haustek-core.js
├── HAUSTEK.admin   ← toàn bộ dữ liệu thô, tên đơn vị phân phối, tỷ lệ gốc,
│                     hàng chờ khớp, nút duyệt kỳ.   CHỈ intranet.html
└── HAUSTEK.api     ← gói dữ liệu đã tính sẵn và đã cắt bớt, cho đúng một
                      người xem, đúng một kỳ đã duyệt.  CHỈ dashboard.html
```

`dashboard.html` gọi `HAUSTEK.lockdown()` ở dòng đầu tiên. Sau lời gọi đó `HAUSTEK.admin`
biến mất khỏi trang — mở dev tools cũng không lấy được. Cuối trang dashboard có khối
**"Trình duyệt này thực sự nhận được những gì"**: hiện đúng những gói JSON máy chủ vừa gửi
xuống, kích thước từng gói, và năm phép kiểm tra chạy thật chứ không phải chữ trang trí.

Trong sản phẩm thật, thứ tương đương là: những dữ liệu ấy chưa bao giờ rời khỏi máy chủ.
Ở một bản mẫu chạy trong một trình duyệt, đây là cách gần nhất để chứng minh cùng nguyên tắc.
Xem mục 5.1 và 2.7 tài liệu bàn giao.

## Trạng thái khởi điểm

Mở lần đầu, bản mẫu ở tình huống của một hệ thống đã chạy gần một năm:

- 10 kỳ đầu (08/2025 – 05/2026) đã đối chiếu xong, đã duyệt, đã có bảng chi trả
- **06/2026** — đủ ba luồng nhưng đối chiếu còn lệch $41,37 ở luồng YouTube
- **07/2026** — chưa nạp TikTok

Hai kỳ cuối chính là việc phải làm, và cũng là lý do label với nghệ sĩ chưa thấy chúng.
Muốn quay lại từ đầu: nút **Snapshot → Đặt lại toàn bộ**.

## Quy mô đang chạy thật trong bản mẫu

- 50.000 bản ghi · 900 nghệ sĩ · 40 label
- 12 kỳ × 3 luồng = 1.800.000 ô doanh thu giữ trong bộ nhớ
- bóc theo 218 cửa hàng × 16 lãnh thổ, tính từ mã bản ghi chứ không lưu sẵn
- bảng danh mục 50.000 dòng cuộn mượt vì chỉ vẽ ~30 dòng đang nhìn thấy

Dựng lõi mất khoảng 0,8 giây, vẽ lại một màn hình dưới 400ms.

## Cái gì thật, cái gì giả

**Thật** — mô hình dữ liệu, chuỗi chia tiền, tỷ lệ có ngày hiệu lực, cách theo dõi ba luồng,
hàng chờ khớp ISRC, quy tắc đối chiếu, cổng duyệt kỳ, thu hồi tạm ứng, ngưỡng chi trả,
ranh giới quyền giữa ba vai, nhật ký kiểm toán.

**Giả** — bản thân các con số, và việc "nạp file" chỉ là bật cờ chứ không đọc file thật.
Đường ống nạp thật cần parser riêng cho từng luồng, mà muốn viết được thì phải có
file mẫu (xem màn hình **Câu hỏi còn treo**).

**Chưa có** — đăng nhập thật, database, quy đổi tiền tệ theo từng nền tảng, tab tác quyền
cho label (còn chờ chốt label có kiêm publisher không).

## Bước tiếp theo

Bản mẫu này là đặc tả để viết schema, không phải code để bê nguyên. Thứ tự đề nghị:

1. Trả lời 6 câu hỏi ở màn hình **Câu hỏi còn treo**, gửi hai file mẫu → chốt schema
2. Viết RLS cho ba vai **trước** khi viết giao diện, kèm test chứng minh nghệ sĩ A không
   truy vấn được dữ liệu nghệ sĩ B — test này phải chạy trong CI
3. Nạp một luồng thật, một kỳ thật, đối chiếu tổng với file gốc tới từng xu
4. Dựng bảng rollup, làm màn admin trước
5. Mở cho label, rồi nghệ sĩ
