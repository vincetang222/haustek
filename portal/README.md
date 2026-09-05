# Haustek Portal — bản mẫu chạy được

Hai trang, một lõi dữ liệu. Mở bằng trình duyệt là chạy, không cần cài gì.

| File | Ai dùng | Làm gì |
|---|---|---|
| `intranet.html` | Nội bộ Haustek | Nạp dữ liệu, khớp ISRC, đối chiếu, duyệt kỳ, đặt tỷ lệ, tạm ứng, chi trả, tài khoản |
| `dashboard.html` | Label và nghệ sĩ | Xem số của kỳ đã duyệt, bóc theo cửa hàng và lãnh thổ, xem tiền đi đâu |
| `haustek-core.js` | cả hai | Lõi dữ liệu — đóng vai database + API |
| `haustek-ui.css` | cả hai | Bảng màu và các thành phần giao diện |
| `screens/*.js` | intranet | Mỗi file một màn hình, tự đăng ký vào khung |

## Mười màn hình intranet

**Vận hành** — Tổng quan · Nạp dữ liệu · Khớp ISRC · Đối chiếu & duyệt kỳ
**Tiền** — Tỷ lệ chia · Tạm ứng & thu hồi · Chi trả
**Dữ liệu** — Danh mục
**Quản trị** — Tài khoản & nhật ký · Câu hỏi còn treo

Mỗi màn hình là một file trong `screens/`, tự đăng ký vào khung qua
`HAUSTEK.registerScreen()`. Viết thêm màn hình mới thì đọc `screens/_CONTRACT.md`
rồi thêm một file và một thẻ `<script>` trong `intranet.html`.

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
biến mất khỏi trang và không lời gọi nào của trang đó lấy lại được. Hai bí mật kinh doanh —
tên đơn vị phân phối và tỷ lệ gốc — thì ngay từ đầu đã **không nằm trong `haustek-core.js`**:
`intranet.html` tự nạp chúng vào lúc khởi động, nên bản sao lõi mà khách tải về không mang
theo gì cả.

Cuối trang dashboard có khối **"Trình duyệt này thực sự nhận được những gì"**: hiện đúng những
gói JSON vừa nhận, kích thước từng gói, và năm phép kiểm **chạy thật trên chính payload và
chính tầng API** — trong đó có hai phép thử tấn công: hỏi bản ghi ngoài phạm vi, và hỏi một kỳ
chưa duyệt. Cả hai phải bị từ chối.

### Chỗ bản mẫu KHÔNG chứng minh được — đọc kỹ

Hai trang chạy trong cùng một trình duyệt, cùng một gốc (origin). Nên vẫn còn đường vòng mà
bản mẫu không bịt được, và cũng không giả vờ là bịt được:

- nạp lại `haustek-core.js` trong một iframe cùng gốc là có lại nguyên `HAUSTEK.admin`
- `localStorage` giữ toàn bộ quyết định của admin, trang nào cùng gốc cũng đọc được

Vì vậy: đây là **hình dạng** của ranh giới, chưa phải ranh giới đã được thực thi. Thứ thật sự
bảo đảm cách ly nằm ở mục 5.1 tài liệu bàn giao — dữ liệu thô trong database, lọc và tổng hợp
chạy ở máy chủ, Row Level Security quyết định ai đọc được dòng nào. Cái ở đây nói rõ tầng API
phải có hình dạng gì để RLS bên dưới có nghĩa, và `portal/test/api-guard.js` viết hình dạng ấy
thành phép kiểm chạy được.

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

**Chưa có** — database, quy đổi tiền tệ theo từng nền tảng, tab tác quyền cho label
(còn chờ chốt label có kiêm publisher không), và **đăng nhập thật** — đọc kỹ chỗ này:

> Ở bản mẫu, `HAUSTEK.api` nhận `partyId` như một tham số. Ô chọn tài khoản trên cổng khách
> chỉ là để xem thử. Khi làm thật, **`partyId` phải lấy từ phiên đăng nhập trên máy chủ,
> không bao giờ lấy từ tham số gửi lên** — nếu không thì sửa một con số trên URL là xem
> được dữ liệu người khác, và mọi phép kiểm khác trong file này trở nên vô nghĩa.
> `portal/test/api-guard.js` ghi rõ điều này thành một phép kiểm có nhãn cảnh báo.

## Kiểm tra

```bash
node portal/test/api-guard.js       # 56 phép kiểm ranh giới quyền, không cần trình duyệt
```

Đây là mốc số 2 trong tài liệu bàn giao — test chứng minh nghệ sĩ A không truy vấn được
dữ liệu nghệ sĩ B, và phải chạy trong CI. Bản mẫu chưa có database nên chưa viết được
Row Level Security thật, nhưng ranh giới thì đã có: những gì file này kiểm tra chính là
những gì các policy RLS sau này phải bảo đảm. Lên Postgres thì dịch từng phép kiểm thành
một test SQL.

## Bước tiếp theo

Bản mẫu này là đặc tả để viết schema, không phải code để bê nguyên. Thứ tự đề nghị:

1. Trả lời 7 câu hỏi ở tab **Câu hỏi còn treo**, gửi hai file mẫu → chốt schema
2. Viết RLS cho ba vai **trước** khi viết giao diện, kèm test chứng minh nghệ sĩ A không
   truy vấn được dữ liệu nghệ sĩ B — test này phải chạy trong CI
3. Nhập một nguồn thật, một kỳ thật, đối soát tổng với file gốc tới từng xu
4. Dựng bảng rollup, làm cổng nội bộ trước
5. Mở cho label, rồi nghệ sĩ

## Bản gói một trang

`goi-mot-trang.html` (≈1,6 MB, đã gồm bộ chữ nhúng) là cả hai cổng gói vào một file,
dựng bằng `node portal/dung-goi.js` — dùng để xem online mà không phải tải gì về.

Khác bản nhiều file ở đúng một chỗ: trang không tự đăng ký lúc tải file
nữa mà nằm trong hàm, và bản gói chạy bộ nào tuỳ cổng đang mở. Nhờ vậy cổng
đối tác **vẫn gọi `lockdown()` trước khi bất cứ trang nào chạy** — ranh giới giữ
nguyên. Đổi cổng bằng ô ở chân cột trái; đổi xong trang tải lại, và vì trạng
thái nằm chung trong `localStorage` nên duyệt một kỳ ở cổng nội bộ rồi sang
cổng đối tác là thấy kỳ đó hiện ra.

Một điểm khác duy nhất: trình xem online chạy trong khung cách ly và **chặn
mọi lượt tải file thẳng**. Nút Xuất CSV vì thế đi đường khác khi có: gọi
`claude.use('downloads')` để trình xem hỏi người dùng có lưu file không, rồi
mới lưu (bản gói được công bố với `capabilities: {downloads: true}`). Trình
xem không cấp đường đó thì nút báo rõ là không lưu được, thay vì im lặng
không làm gì (cờ `HAUSTEK_XEM_ONLINE`). `test/v2-nhu-artifact.js` giả lập cả
hai tình huống.
