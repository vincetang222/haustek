# Triển khai thật · lưu ở đâu, tốn bao nhiêu, làm theo thứ tự nào

`KIEN-TRUC.md` tả hệ thống **như bản mẫu đang có**. `HA-TANG.md` tả **lược đồ
dữ liệu khi lên máy chủ** — bảng nào, khoá nào, chốt kỳ là giao dịch gì. File
này tả phần còn lại: **vật lý và tiền**. Byte để ở đâu, máy cỡ nào, mỗi tháng
tốn bao nhiêu, và tuần này phải làm gì.

Người đọc là chủ doanh nghiệp, không phải kỹ sư hạ tầng. Mục 1 trả lời thẳng
câu hỏi; từ mục 3 trở đi mới đi sâu.

| Bạn muốn biết | Đọc mục |
|---|---|
| 500.000 bài lưu ở đâu | 1, 2, 4 |
| Tốn bao nhiêu tiền | 6, 7 |
| Chọn nhà cung cấp nào | 5, 9 |
| Tuần này làm gì | 11, 12 |
| Chỗ nào còn chưa biết | 13 |

---

## 0. Một điều phải nói trước: quy mô trong hai tài liệu đang lệch nhau

`HA-TANG.md` viết cho **1.000.000 bài**. Câu hỏi lần này hỏi **500.000 bài**.
File này trả lời đúng câu hỏi — mọi con số dưới đây là cho 500.000 bài — nhưng
đội lập trình sẽ code theo `HA-TANG.md`, tức là dựng và mua máy cho gấp đôi.

**Phải chốt một con số.** Hoặc sửa `HA-TANG.md` xuống 500.000, hoặc nhân đôi
mọi con số ở đây. Để hai con số cùng tồn tại là cách chắc chắn nhất để mua sai
máy hoặc tuyển sai người.

Khuyến nghị: giữ `HA-TANG.md` ở 1.000.000 làm **trần thiết kế** (lược đồ,
khoá, phân vùng phải chịu được), và dùng 500.000 làm **mốc mua sắm**. Ghi rõ
cả hai vai trò ấy vào đầu `HA-TANG.md`.

---

## 1. Trả lời ngắn

**Haustek hôm nay không giữ một byte âm thanh nào, và đó không phải thiếu sót
— đó là thiết kế.** Vì vậy "500.000 bài hát lưu ở đâu" không phải bài toán kho
nhạc. Toàn bộ dữ liệu thật của Haustek sau năm năm nằm gọn trong **khoảng
100–170 GB**, tức một đĩa trên một máy chủ bình thường.

Ba kho, ba việc khác nhau:

| Kho | Đựng gì | Cỡ ở năm 5 |
|---|---|---|
| **PostgreSQL** | Danh tính, danh mục, tiền, ví, sổ cái, quyền | ~50–90 GB dữ liệu · mua **200 GB đĩa** |
| **Object storage** (kho đối tượng) | File báo cáo thô của nền tảng, hồ Parquet, sao lưu | ~35–80 GB |
| **Kho cột** (Parquet + DuckDB) | Dòng thô và lượt nghe hằng ngày để phân tích | nằm trong kho trên |

Chi phí hạ tầng: **8–17 triệu đồng/tháng ở năm 1**, **46–93 triệu ở năm 5**.
Đó là **4% chi phí công ty ở năm 1 và khoảng 13% ở năm 5**; phần còn lại,
78–93%, là **lương đội**. Máy chủ không phải chỗ đáng tối ưu.

Chỗ đáng tối ưu là chỗ khác, và nó lớn hơn tiền máy chủ nhiều: **phí chuyển
tiền cho từng bên thụ hưởng**. Ở quy mô năm 5, khoảng 20.000 lệnh chuyển mỗi
kỳ × 1.100–11.000 đ mỗi lệnh là **22–220 triệu đồng một kỳ** — bằng 0,2 tới
4,8 lần toàn bộ hoá đơn hạ tầng, đều đặn, mãi mãi. Cần gạt đã có sẵn trong
thiết kế: **ngưỡng thanh toán tối thiểu**. Nâng ngưỡng từ 5 USD lên 20 USD cắt
số lệnh đi khoảng một nửa và tiết kiệm nhiều tiền hơn mọi tối ưu máy chủ cộng
lại.

Và việc quan trọng nhất **không tốn một đồng máy chủ nào**: lấy file báo cáo
THẬT của ba kỳ gần nhất về mà đọc. Bốn con số quyết định cả kiến trúc lẫn biên
chế chỉ hiện ra từ file thật, và hôm nay chưa ai biết chúng.

---

## 2. Haustek giữ gì và không giữ gì

Đây là chỗ hiểu nhầm đắt nhất trong cả tài liệu. Chọn nhầm thì sai khoảng
**200 lần** về dung lượng, và sai hẳn về trách nhiệm pháp lý.

| Loại file | Haustek giữ | Bằng chứng |
|---|---|---|
| File âm thanh (WAV / master) | **Không** | `HA-TANG.md` mục 6 — lược đồ bản chạy thật liệt kê bảy bảng dữ liệu, **không có bảng nào cho audio** |
| | | `v2/haustek-hoso.js:183` — trường WAV là `<input type="url">`, gợi ý sẵn `https://drive.google.com/…`, nhãn "**Link** file WAV" |
| | | `v2/haustek-hoso.js:271` — link WAV chỉ được kiểm **khi có giá trị**; tức là còn không bắt buộc |
| Ảnh bìa | **Không** | `v2/haustek-hoso.js:149` cũng là một link; ảnh hiện trên trang là ảnh **sinh xác định** từ mã bài (`HM.bia`) |
| Bảng kê PDF | **Không** | Đối tác tự in từ trình duyệt |
| File báo cáo thô của nền tảng | **Có** — đây là nguồn sự thật về tiền | `HA-TANG.md` mục 6 · `lo_nhap` UNIQUE `sha256` · `dong_tho` Parquet |
| Dữ liệu có cấu trúc | **Có toàn bộ** | `HA-TANG.md` mục 3–6 |

Lý do gốc nằm trong `v2/README.md`: *"Haustek **không tự phân phối**. Đối tác
gửi hồ sơ lên cổng, rồi nhân viên ngồi gõ lại metadata ấy sang OneRPM và các
tool khác."* File nhạc đi từ Google Drive của đối tác thẳng sang OneRPM ·
Believe · ADA. **Haustek đứng giữa và chỉ cầm con trỏ.**

### Nhưng có một lý do thật để cân nhắc giữ

Chính lõi đang đòi *"file master gốc kèm ngày tạo"* là một trong **bốn bằng
chứng bắt buộc** khi tranh chấp bản quyền (`haustek-core.js:5953`). Nếu Haustek
không giữ, mỗi lần tranh chấp là phải đi xin lại đối tác — mà đối tác thường
đã mất file, hoặc link Drive đã chết, hoặc người ấy đã rời label.

Quyết định này **không quyết bằng cảm tính, quyết bằng một phép đo mười phút**:
mở hai mươi hồ sơ phát hành cũ, bấm thử từng link WAV, đếm bao nhiêu link còn
sống. Tỷ lệ link chết là con số duy nhất trả lời được câu hỏi. Xem mục 11.

### Ba kịch bản, và cái giá của từng cái

| | Năm 1 | Năm 5 |
|---|---|---|
| **(a) Hiện trạng — không giữ file nào** | ~25 GB | **~100–170 GB** |
| **(b) Thêm: tự lưu ảnh bìa và ảnh nghệ sĩ** | ~0,9 TB | **~1,4 TB** |
| **(c) Thêm nữa: giữ master FLAC cả danh mục** | ~15 TB | **~22 TB** |

Chênh giữa (a) và (c) là khoảng **200 lần**. Nhưng điều bất ngờ: **bản thân
chuyện lưu 22 TB không đắt** — trên Backblaze B2 là khoảng 97 USD/tháng, tức
2,6 triệu đồng. Cái đắt không phải chỗ lưu. Cái đắt là **dự án kéo 500.000 file
về từ Drive của đối tác**: kiểm checksum từng file, quét virus, ba bản sao,
chuỗi giữ chứng cứ, và một người chịu trách nhiệm cho việc đó. Với bài cũ,
việc ấy gần như không làm nổi.

**Khuyến nghị: chốt bằng văn bản rằng Haustek không lưu bản gốc audio** — và
đọc lại hợp đồng với OneRPM · Believe · ADA xem có điều khoản nào buộc giữ bản
sao không. Nếu về sau đổi ý thì làm cho **bài mới từ ngày bật trở đi** (khoảng
111 GB một tháng), đừng kéo ngược cả danh mục.

Kịch bản (b) — tự lưu ảnh bìa — thì **đáng làm sớm**: ảnh nhỏ, nó xuất hiện
trên mọi trang, và link Drive của đối tác thì mục nát. 859 GB là rẻ.

---

## 3. Ba kho, ba việc khác nhau

Ranh giới này đáng treo thành một câu trong phòng:

> **Số nào xuất hiện trên bảng kê hay trong ví thì ở Postgres. Số nào chỉ
> xuất hiện trên biểu đồ thì ở kho cột.**

| | PostgreSQL | Object storage | Kho cột (Parquet) |
|---|---|---|---|
| Đựng | danh tính · danh mục · **tiền** · ví · sổ cái · quyền | file báo cáo gốc · sao lưu · ảnh (nếu lưu) | dòng thô · lượt nghe hằng ngày |
| Tính chất | giao dịch, phải đúng tuyệt đối | chỉ ghi thêm, không sửa | đọc nhiều, ghi một lần |
| Sai thì sao | **mất tiền** | mất bằng chứng | hiện sai biểu đồ |
| Công cụ đọc | SQL qua ứng dụng | HTTP có URL ký hạn | DuckDB |

Và một luật một chiều: **hồ dữ liệu chỉ chạm đường tiền đúng một lần, ở bước
nạp, TRƯỚC cổng đối chiếu Đ1** (`HA-TANG.md` mục 4.7). Sau điểm ấy, tiền không
bao giờ đọc lại từ hồ.

Lý do thật của việc tách hồ khỏi Postgres **không phải hiệu năng** — 22 triệu
dòng một kỳ Postgres gánh được. Lý do là **để một truy vấn phân tích viết sai
không bao giờ chạm được vào bảng dùng để chia tiền.**

---

## 4. Dung lượng thật

### 4.1 PostgreSQL

| Mốc | Danh mục | Kỳ | Bên | Dữ liệu (kể cả chỉ mục) | Đĩa phải mua |
|---|---|---|---|---|---|
| Năm 1 | 150.000 bài | 12 | ~15.000 | 8–20 GB | **100 GB** |
| Năm 3 | 350.000 bài | 36 | ~35.000 | 25–50 GB | **200 GB** |
| Năm 5 | 500.000 bài | 60 | ~50.000 | **45–90 GB** | **200–400 GB** |

Hệ số giữa dữ liệu và đĩa là **4,2 lần** — không phải 3,5. Nó gồm: ×1,2 cho
bloat (chỗ trống Postgres để lại sau khi sửa dòng), rồi ×3,5 cho WAL, bản sao
lưu nền và chỗ thở khi `VACUUM FULL` hoặc đổi lược đồ. Ai nhân 3,5 vào dữ liệu
logic sẽ mua thiếu 17%.

### 4.2 Object storage

| Mốc | Báo cáo gốc + hồ Parquet | Sao lưu bản thứ hai |
|---|---|---|
| Năm 1 | 2–5 GB | ~150 GB |
| Năm 3 | 14–30 GB | ~600 GB |
| Năm 5 | **35–80 GB** | ~1,5 TB |

Toàn bộ hồ năm năm dưới 120 GB, tức **dưới 2 USD một tháng**. Rẻ tới mức không
có lý do gì để bàn cãi — nhưng **bản gốc thì không mua lại được**, nên giữ
nguyên byte kèm SHA-256 và khoá ghi (Object Lock / WORM).

### 4.3 Bảng kê PDF — đừng sinh sẵn

Ở năm 5, nếu sinh sẵn bảng kê cho mọi bên mọi kỳ thì khoảng **600.000 file ≈
80–160 GB**, mà phần lớn không ai mở. Kỳ đã duyệt là bất biến nên sinh lại luôn
ra đúng bản cũ — điều kiện duy nhất cần để **sinh lúc người ta bấm tải**, đệm
với ETag = `chot_id`.

Lý do chính để không sinh sẵn **không phải số GB** (số ấy nhỏ): bảng kê mang
tên và số tài khoản, tức là **dữ liệu cá nhân**. Càng ít bản sao nằm rải rác
càng tốt.

### 4.4 Chỗ sai số lớn nhất, xếp theo sức nặng

1. **Haustek có giữ file nhạc không** — hệ số ~200 lần. Không giả định nào
   khác gần được.
2. **`nhat_ky` ghi vết bảng nào** — hiện `HA-TANG.md` mục 7 nói nó chụp
   **nguyên dòng** của mọi bảng. Nếu nó ghi vết cả `phan_bo_ky`, `chia_se_ky`,
   `chi_tra_dong`, `so_cai` mỗi lần chốt kỳ thì **riêng nó vượt 100 GB** và
   toàn bộ mục 4.1 phải viết lại. Đây là câu hỏi thiết kế phải chốt **trước**
   khi ước dung lượng, không phải một hệ số nhân. Khuyến nghị: đổi từ ảnh chụp
   nguyên dòng sang **ghi chênh lệch theo trường**, che cột dữ liệu cá nhân,
   chỉ giữ khoá tham chiếu.
3. **Tỷ số bài / bản phát hành** quyết định số ảnh bìa — biên độ gấp 4 lần.
4. **Chính sách giữ `luot_ngay_bai`** — 100 ngày cho 16 GB, bỏ chính sách cho
   291 GB, hệ số 18.
5. **Số dòng thô một kỳ** — nếu sai gấp ba thì hồ Parquet năm 5 không phải
   35–80 GB mà 100–240 GB, và thời gian chốt kỳ sai gấp ba. Chỉ đo được ở
   bước 1 của lộ trình.

---

## 5. Chọn nhà cung cấp

### 5.1 Ba phương án

| | **A · Cloud quốc tế quản lý sẵn** | **B · Trong nước tự quản** | **C · Lai** |
|---|---|---|---|
| Hình dạng | RDS + S3 + ALB ở Singapore | VM ở VNG/Viettel/FPT, Postgres tự dựng, MinIO | Postgres và ứng dụng **trong nước** · kho lạnh và sao lưu ở R2/B2 |
| Hạ tầng năm 1 | $520–900 | $330–580 | **$305–630** |
| Hạ tầng năm 5 | $3.200–5.600 | $1.900–3.900 | **$1.730–3.540** |
| Người-giờ vận hành/tháng, năm 5 | 35–60 h | **100–160 h** | 60–100 h |
| Độ trễ tới người dùng VN | 25–45 ms | **5–20 ms** | **5–20 ms** |
| Hoá đơn | USD, thẻ quốc tế | VND, hợp đồng tiếng Việt, VAT khấu trừ | phần lớn VND |
| Rủi ro chính | khoá chặt nhà cung cấp · phí lấy dữ liệu ra · dữ liệu cá nhân ra nước ngoài | **bus factor = 1** — một người biết cách dựng lại · đêm sập không ai trực · failover phải tự diễn tập | hai hợp đồng, hai chỗ hỏng · ranh giới "cái gì được ra nước ngoài" phải viết thành luật trong mã |

**Chốt: phương án C.** Đặt Postgres và ứng dụng trong nước để có độ trễ 5–20 ms
và để dữ liệu cá nhân ở lại Việt Nam; đặt hồ dòng thô và bản sao lưu đã mã hoá
ở Cloudflare R2 hoặc Backblaze B2 vì **phí lấy dữ liệu ra bằng không** — nghĩa
là đổi nhà cung cấp lúc nào cũng được, không bị phạt tiền.

**Chốt sai thì đổi sang đâu:** nếu đội không tìm được người trực Postgres, đổi
phần database sang A (RDS ở Singapore) và chấp nhận 25–45 ms cùng hồ sơ chuyển
dữ liệu đầy đủ. Nếu ngân sách siết, đổi sang B nhưng phải có **hai người** biết
dựng lại hệ thống, không phải một.

### 5.2 Ba chỗ bản nghiên cứu nói quá, phải nói lại cho đúng

Ba điều này ảnh hưởng trực tiếp tới lý do chọn C, nên không được để mơ hồ:

- **Phần hoá đơn ngoại tệ của phương án C không phải 1%.** C vẫn mua Grafana,
  Sentry, Cloudflare, Postmark từ nước ngoài. Ở năm 5 đó là **28–37% hoá đơn
  hạ tầng**. Cái C thật sự mua được là **độ trễ và chỗ ở của dữ liệu cá nhân**,
  không phải tiết kiệm thuế.
- **Thuế nhà thầu** với dịch vụ theo Thông tư 103/2014/TT-BTC là **GTGT 5% +
  TNDN 5%**, không phải 10% + 5%. Phần TNDN 5% là phần không khấu trừ được.
- **Bản sao lưu đã mã hoá đặt ở nước ngoài VẪN là chuyển dữ liệu cá nhân ra
  nước ngoài.** Mã hoá đổi mức rủi ro, không xoá nghĩa vụ lập hồ sơ. Phương án
  C **giảm khối lượng** dữ liệu ra nước ngoài, nó **không bỏ được hồ sơ**.

### 5.3 Quy ước khoá đối tượng — chốt trước khi tải lên byte đầu tiên

Đổi tên ba triệu đối tượng sau này là việc không làm nổi. Chốt ngay:

- Một bảng `tep` trong Postgres giữ **mọi** tham chiếu file. Đường dẫn vật lý
  dựng từ `tep_id`, **không cột URL nào khác trong toàn hệ thống**.
- **Không bao giờ viết URL đầy đủ** (có tên miền, có tên bucket) vào một cột
  database, một file PDF bảng kê, hay một email gửi đối tác. Nếu bảng kê kỳ
  03/2026 chứa một link R2 gõ cứng thì rời R2 là làm hỏng hàng triệu tài liệu
  lưu trữ — kiểu khoá nhà cung cấp không sửa được bằng tiền.
- **Ảnh bìa**: URL công khai theo hash nội dung, qua CDN,
  `Cache-Control: public, max-age=31536000, immutable`. Ảnh bìa đã công khai
  trên Spotify và Apple Music rồi — ký hạn không giấu được gì mà làm tỷ lệ
  trúng đệm về 0.
- **Bảng kê PDF, giấy tờ đối tác, file báo cáo thô**: URL ký hạn 120 giây, cấp
  bởi hàm `SECURITY DEFINER` đọc `ben_phien()`. Đường dẫn dựng từ `tep_id` tra
  trong database, **không bao giờ nhận `bai_id` hay `ben_id` từ tham số HTTP**.
- **Không dùng AWS S3 làm kho chính.** Phí lấy dữ liệu ra ~120 USD/TB nghĩa là
  rời khỏi 18 TB tốn 2.160 USD một lần, và tốn đúng vào lúc tệ nhất — lúc đang
  muốn đi.

---

## 6. Chi phí hằng tháng

Tỷ giá quy đổi ~26.400 đ/USD. Mọi con số là **ước lượng có khoảng dao động**,
không phải báo giá.

| | Năm 1 (~150.000 bài) | Năm 3 (~350.000 bài) | Năm 5 (500.000 bài) |
|---|---|---|---|
| Postgres chính + dự phòng | $115–190 | $227–379 | $455–758 |
| Bản sao chỉ-đọc | — | $95–152 | $303–530 |
| Máy ứng dụng + việc nền | $76–121 | $136–227 | $227–379 |
| Cân tải · WAF · CDN | $11–30 | $25–85 | $200–400 |
| Kho lạnh (hồ + báo cáo gốc) | $0–2 | $3–4 | $2–3 |
| Sao lưu bản thứ hai | $1–2 | $4–6 | $9–15 |
| Giám sát · nhật ký · lỗi | $26–130 | $180–450 | $350–800 |
| Môi trường thử (staging) | $57–95 | $114–208 | $265–455 |
| Tên miền · email · SMS · ký số | $15–40 | $50–150 | $100–300 |
| **Cộng** | **$305–630** | **$830–1.670** | **$1.730–3.540** |
| | **8,1–16,6 tr đ** | **22–44 tr đ** | **46–93 tr đ** |

Chia ra cho dễ đối chiếu với mô hình phí: ở năm 5 là **0,0035–0,0071 USD một
bài một tháng**, hay **0,035–0,071 USD một bên thụ hưởng một tháng**.

### 6.1 Tiền thật sự đi đâu

| Khoản | Năm 1 | Năm 5 | Tỷ trọng năm 5 |
|---|---|---|---|
| **Lương đội** (gross × 1,3: bảo hiểm 21,5% + tháng 13 + thiết bị) | 194–261 tr đ | 351–481 tr đ | **78–85%** |
| Máy chủ + kho + mạng | 8–17 tr đ | 46–93 tr đ | **7–23%** (khoảng 13% ở kịch bản giữa) |
| Công cụ SaaS của đội | $150–400 | $400–1.000 | 2–5% |
| Tuân thủ · kế toán · pháp lý | $80–300 | $200–600 | 1–3% |

Ở năm 5, cắt **một nửa** hoá đơn hạ tầng tiết kiệm $865–1.770 một tháng. Tuyển
thừa **một** kỹ sư tốn $1.800–2.800 một tháng. **Một quyết định tuyển sai đắt
hơn cả năm tối ưu máy chủ.**

Ở năm 1 thì đừng tối ưu hạ tầng: một tuần kỹ sư dành cho việc ấy là một tuần
không làm lộ trình sản phẩm, đổi lấy một khoản không đáng kể so với lương. Đến
năm 4 thì đáng làm.

### 6.2 Bốn khoản chi phí ẩn mà mọi bảng dự toán đều quên

Ba khoản đầu **lớn hơn hoá đơn máy chủ**. Đây là phần quan trọng nhất của mục 6.

1. **Phí chuyển tiền cho bên thụ hưởng.** ~20.000 lệnh một kỳ × 1.100–11.000 đ
   = **22–220 triệu đồng một kỳ**, đều đặn, mãi mãi. Đây là khoản duy nhất
   trong cả tài liệu có thể **thiết kế để giảm**: ngưỡng thanh toán tối thiểu
   và luật dồn kỳ đã có sẵn trong lõi. Nâng ngưỡng từ 5 USD lên 20 USD cắt số
   lệnh khoảng một nửa.
2. **Chứng từ khấu trừ thuế TNCN điện tử.** Trả tiền cho 20.000–50.000 cá nhân
   mỗi kỳ thì phải khấu trừ 10% tại nguồn và cấp chứng từ điện tử cho từng
   người từng lần. Nhà cung cấp tính 200–500 đ một chứng từ → **4–25 triệu đồng
   một kỳ**, cộng một quy trình phát hành và lưu trữ. Đây là chi phí bắt buộc
   theo luật.
3. **Biên chế hỗ trợ đối tác.** 50.000 bên nhận tiền mỗi kỳ, mỗi bên có thể
   hỏi "sao kỳ này ít hơn kỳ trước". Ở tỷ lệ liên hệ 1–3% là **500–1.500 yêu
   cầu hỗ trợ mỗi kỳ — một tới ba người toàn thời gian**. Ở một hệ mà mỗi con
   số là tiền của người khác, hỗ trợ là biên chế lớn hơn vận hành hệ thống.
4. **Lưu trữ 10 năm theo luật kế toán.** Bảng kê, sổ cái, chứng từ chi trả là
   chứng từ kế toán, phải lưu **10 năm** (Nghị định 174/2016) — không phải 5.
   Ở năm 10, Postgres và kho bảng kê xấp xỉ gấp đôi.

Và một mâu thuẫn phải giải bằng kiến trúc, không bằng thói quen: **khi một bên
rời đi, dữ liệu cá nhân của họ phải xoá theo luật bảo vệ dữ liệu, nhưng chứng
từ kế toán phải giữ 10 năm.** Hai nghĩa vụ va nhau. Giải pháp thông thường là
tách chứng từ kế toán thành bản đã ẩn danh một phần, giữ đủ để kiểm toán và
không đủ để nhận ra người. Việc này tốn tiền và phải thiết kế sớm.

---

## 7. PostgreSQL: máy cỡ nào

### 7.1 Một điều phải nói thẳng

**Cỡ máy không quyết định bởi dung lượng, nó quyết định bởi thời gian chốt
kỳ.** `HA-TANG.md` mục 4.2 cho biết pha 3 ghi vào `chi_tra_dong`,
`tam_ung_thu_hoi`, `so_cai`, `so_du_ben` và pha 4 phải nằm **cùng một giao
dịch** — tức một giao dịch ghi khổng lồ khoá ví mọi đối tác. Máy phải đủ lớn
để giao dịch ấy chạy trong bao lâu là chấp nhận được.

Thời gian ấy **chưa ai đo**. `HA-TANG.md` mục 9 để trống đúng ô đó. Nên mọi
cấu hình máy dưới đây là **điểm khởi đầu để đo, không phải kết luận**.

| Mốc | Cấu hình khởi đầu | Đo gì để biết đúng sai |
|---|---|---|
| Năm 1 | 4 vCPU / 16 GB / 100 GB | thời gian chốt kỳ pha 1–3 |
| Năm 3 | 8 vCPU / 32 GB / 200 GB | như trên, và độ trễ trang danh mục |
| Năm 5 | 16 vCPU / 64 GB / 400 GB | như trên |

### 7.2 Bốn quyết định kỹ thuật chịu lực

**(a) IOPS là chỗ nghẽn trước RAM.** Nếu chạy trên AWS RDS: dưới 400 GiB gp3
thì IOPS bị khoá cứng ở 3.000 và **không mua thêm được**. Cấp đúng 400 GiB
ngay từ đầu — dư 300 GB tốn ~25 USD/tháng, đổi lấy 12.000 IOPS. Món hời nhất
trong cả tài liệu. Ở nhà cung cấp trong nước, IOPS bảo đảm cho NVMe thường là
hạng mục tính tiền **riêng** — phải hỏi khi xin báo giá, đừng giả định.

**(b) `SET LOCAL` sống được với transaction pooling — nhưng chỉ nếu viết đúng.**
Thiết kế RLS của `HA-TANG.md` đặt `app.ben` ở đầu mỗi giao dịch. Với PgBouncer
chế độ transaction:

- Dùng `SELECT set_config('app.ben', $1, true)` — tham số thứ ba `true` nghĩa
  là phạm vi giao dịch. **Bỏ hẳn mọi câu `SET` không có chữ `LOCAL`**, và thêm
  một bài kiểm CI quét mã nguồn tìm chúng. Một câu `SET` thiếu `LOCAL` rò biến
  sang giao dịch của người khác.
- `ben_phien()` phải **`RAISE EXCEPTION`** khi `app.ben` chưa đặt, đừng trả
  `NULL`. Trả `NULL` thì policy lọc sạch và đối tác thấy một cổng rỗng thay vì
  một lỗi — an toàn mà không ai biết là đang hỏng.
- Hai cổng PgBouncer: **6432 transaction** cho web và cổng đối tác, **6433
  session** cho di trú, `pg_dump` và `psql` của người trực.
- **Cấm** `pg_advisory_lock` (bản không có `_xact`), `LISTEN`, con trỏ
  `WITH HOLD`, bảng tạm không `ON COMMIT DROP`.
- **Đừng dùng RDS Proxy** cho thiết kế này: với PostgreSQL, câu `SET` làm nó
  ghim kết nối và ngừng gộp — tức là mất đúng thứ mình mua nó để có.

**(c) Bản sao đọc: năm 1 và năm 5 đều chưa cần để gánh tải.** Tải phục vụ là
vài chục yêu cầu mỗi giây toàn tra khoá chính. Nếu dựng một cái thì dùng cho
ba việc: báo cáo nội bộ quét phân vùng lạnh, `pg_dump`, và bản xuất kế toán
hằng tháng. Và định tuyến **theo phiên, không theo loại câu lệnh**: mọi tuyến
có ghi, và mọi tuyến của cùng phiên ấy trong 30 giây sau đó, đi thẳng vào máy
chính. Nhận lời mời chia sẻ rồi mở ngay trang Phần chia của tôi mà đọc phải bản
sao chậm là thấy dữ liệu cũ của chính mình.

**(d) Ở quy mô này, gần như chắc chắn chưa cần tách ra khỏi Postgres.** Không
sharding, không microservices, không Aurora. 50–90 GB dữ liệu và tập nóng vài
GB không cần bất cứ thứ gì đặc biệt.

### 7.3 Sao lưu và khôi phục

| Tầng | Giữ bao lâu | Dùng khi |
|---|---|---|
| PITR (khôi phục về một thời điểm) | **35 ngày**, không phải 7 | lỗi thao tác — xoá nhầm, chạy nhầm lệnh |
| Bản xuất logic miền tiền mỗi kỳ, ghi vào kho có khoá ghi | **10 năm** | kiểm toán, tranh chấp |
| `pg_dump -Fc` toàn bộ hằng tuần | 12 tuần | dựng lại môi trường thử |
| Bản sao thứ hai ở nhà cung cấp **khác** | 30 ngày | nhà cung cấp chính sập hoặc khoá tài khoản |

Mục tiêu: **RPO bằng 0 cho giao dịch tiền đã ghi nhận** (bản sao đồng bộ + lưu
WAL liên tục), ≤ 5 phút cho phần còn lại. **RTO 4 giờ ngày thường, 1 giờ trong
cửa sổ chốt kỳ** — và đóng băng phát hành phần mềm suốt cửa sổ ấy. Nhịp của
Haustek là tháng, nên mua RTO 15 phút cho cả năm là trả tiền cho thứ không dùng;
nhưng mất một giờ đúng ngày chốt kỳ thì cả công ty đứng.

**Diễn tập khôi phục là sản phẩm, không phải nghi lễ.** Một lần trước khi mở
cho đối tác (coi là cổng chấp nhận), một lần sau kỳ chốt thật đầu tiên, rồi
**hằng quý**, cộng một lần sau mỗi lần nâng phiên bản chính. Mỗi lần do **một
người KHÁC người đã dựng hệ thống** thực hiện.

Và mỗi lần diễn tập phải chạy **bốn đẳng thức Đ1–Đ4** của `HA-TANG.md` mục 4.7
trên dữ liệu vừa khôi phục, đối chiếu số dư của năm bên thật, khớp tới từng
micro-USD. **Ghi giờ đồng hồ thật và tên người vào một sổ. Sổ ấy mới là sản
phẩm của buổi diễn tập, không phải cái máy chủ vừa dựng lại.**

Lưu ý phí: bản sao lưu phải kéo về thử mỗi quý, nên chọn nơi **không tính phí
lấy dữ liệu ra**. R2 miễn phí vô điều kiện; B2 miễn phí tới 3 lần dung lượng
lưu, vượt thì tính tiền.

---

## 8. Đường nạp báo cáo hằng tháng

### 8.1 Hàng đợi việc nền: pg-boss, không Redis, không Temporal

Lý do quyết định: **ghi việc trong cùng giao dịch với dòng dữ liệu.**
`INSERT INTO lo_nhap` và `send('doc-lo', …)` cùng commit hoặc cùng quay lại.
Với Redis thì hai hệ thống, hai lần ghi, và có một khe hở giữa chúng.

Redis + BullMQ hơn pg-boss ở giới hạn tốc độ, luồng việc phụ thuộc, và thông
lượng hàng trăm nghìn việc mỗi giây. Haustek không cần món nào trong ba món ấy,
mà phải thêm một hệ thống có trạng thái thứ hai để sao lưu, giám sát, nâng cấp
và bảo mật.

**Điều kiện sẽ đổi ý:** khi có luồng việc nhiều bước dài ngày cần bù trừ tự
động mà ràng buộc database không mua được. Hiện tại chưa có — `chot_id` trong
khoá chính đã biến việc chạy chốt kỳ hai lần thành một vi phạm ràng buộc, tức
là tính bền đã mua bằng lược đồ rồi.

### 8.2 Bốn chỗ phải sửa so với `HA-TANG.md`

1. **`UNIQUE(sha256)` là chưa đủ.** Nó chặn dán lại **đúng byte cũ**. Nhưng
   cổng của hãng xuất lại cùng dữ liệu ra file XLSX mới là đổi `sha256` — file
   khác, nội dung y hệt, và hệ nạp đôi. Thêm partial unique
   `(ky_id, nguon_id) WHERE trang_thai = 'hieu_luc'` và một cột
   `thay_the_lo_id`.
2. **Chen một bảng trung gian theo lô:** `dt_lo (lo_id, bai_id, nen_tang_id,
   gop_that, luot)`. Dựng `dt_bai_ky_nen_tang` như **tổng của các lô hiệu lực**,
   không ghi thẳng từ lô bằng `gop = gop + …` — chạy lại một lô kiểu ấy là cộng
   hai lần.
3. **`tong_kiem_soat` lấy ở đâu phải quy định rõ cho từng nguồn.**
   `HA-TANG.md` gọi cặp `tong_kiem_soat` / `tong_doc` là "chỗ duy nhất phát
   hiện đọc thiếu 3% dòng trước khi chia tiền" nhưng không nói con số ấy từ đâu
   ra. Nguồn nào không có thì **bắt người tải file gõ tay vào cổng, có ghi tên
   người gõ**.
4. **Tách `ky_id` (tháng phát sinh doanh thu) khỏi `nhan_luc` (lúc file về).**
   Báo cáo về tháng 10 thường là doanh thu tháng 8 — nền tảng báo cho hãng phân
   phối chậm ~45 ngày rồi hãng báo tiếp. Và bắt trình đọc **xác minh kỳ ghi bên
   trong file** khớp với kỳ người dùng chọn. Chọn nhầm kỳ là đặt cả kỳ tiền vào
   sai chỗ.

### 8.3 Việc tải file bằng tay

Ở giai đoạn một, giữ nguyên việc tải tay — nhưng biến nó thành **một việc có
mã, có người chịu trách nhiệm, có hạn và có người thay**, không phải một thói
quen trong đầu ai đó. Đây là chỗ hệ đứt trong thực tế, không phải chỗ băng
thông. Bản mẫu đã có sẵn hạ tầng: mã việc, định tuyến theo bộ phận, hạn xử lý.

Song song, mở đầu mối hỏi từng hãng về giao file tự động — SFTP theo chuẩn
ngành DDEX DSR, hoặc API. Hỏi **riêng từng hãng một**.

**Tuyệt đối không** tự động hoá bằng cách lưu mật khẩu cổng của hãng rồi cho
máy đăng nhập giả người. Thường vi phạm điều khoản sử dụng, hỏng ngay khi cổng
đổi giao diện hoặc bật xác thực hai lớp, và đặt một bộ thông tin đăng nhập có
quyền xem toàn bộ doanh thu vào một chỗ khó bảo vệ.

### 8.4 Lịch vận hành

| Nhịp | Việc |
|---|---|
| Hằng ngày | nạp lượt nghe · ghi Parquet vào hồ **cùng lúc** với ghi vào Postgres |
| Hằng tháng | tải báo cáo từng nguồn **ngay khi nó về**, đừng đợi đủ ba nguồn · khớp ISRC · chốt tỷ giá · chốt kỳ · chạy bốn đẳng thức |
| Hằng quý | diễn tập khôi phục · xoay khoá ứng dụng · rà hồ sơ dữ liệu cá nhân |
| Hằng năm | xoay khoá ký URL (hai khoá cùng hiệu lực trong thời gian chuyển) · rà chính sách lưu |

Đọc từng nguồn ngay khi nó về, đừng đợi: ba nguồn về ba ngày khác nhau, và
danh sách chờ khớp của hai nguồn đầu đã được xử lý xong trước khi nguồn thứ ba
về — tức là pha tốn người nhất được trải ra thay vì dồn vào một ngày.

---

## 9. Kho cột và phân tích

**Chọn DuckDB đọc thẳng Parquet trên object storage. Không ClickHouse, không
lakehouse, không orchestrator ở giai đoạn một.** Ở 22 triệu dòng một kỳ đã sắp
theo ISRC và cắt phân vùng, DuckDB trả lời trong vài giây trên một laptop, chi
phí 0 đồng, vận hành gần bằng không.

Hồ hai lớp, dựng ngay tuần đầu:

- `goc/` — giữ **nguyên byte** kèm SHA-256 và khoá ghi (Object Lock / WORM).
- `parquet/` — bản chuyển đổi, nén **ZSTD-3** (không Snappy), **sắp theo ISRC
  trong mỗi file**.

Hai chi tiết quyết định tốc độ:

- **Sắp theo ISRC** — Parquet ghi min/max mỗi row group; không sắp thì min/max
  phủ toàn miền và mọi truy vấn quét cả file. Đây là khác biệt giữa 2 giây và
  2 phút.
- **Phân vùng đúng hai mức** `ky=` rồi `nguon=`, không sâu hơn. Phân vùng
  `ky/nguon/nen_tang/lanh_tho` sinh hàng trăm nghìn thư mục, và mỗi lệnh liệt
  kê trên object storage tốn tiền lẫn thời gian. Cũng gộp Parquet lượt nghe
  theo tháng: 30 file ngày → 1 file tháng.

Nếu về sau chọn Athena hoặc BigQuery, **đặt hạn mức byte quét ngay trong ngày
bật**, trước khi ai viết truy vấn đầu tiên. Một truy vấn quét toàn hồ 120 GB
tốn 0,60 USD; một trang tự làm mới mỗi 30 giây tốn hơn 1.400 USD một tháng.

**Chặn lượt nghe hằng ngày chảy vào tiền bằng hình dạng lược đồ, không bằng lời
dặn:** `luot_ngay_bai` **không có cột tiền, không có `ben_id`**, và mọi trang
đọc nó phải hiện chữ "ước tính". Lượt nghe hằng ngày về trước, không đầy đủ, bị
nền tảng chỉnh lại sau khi gỡ lượt nghe giả, và không có lãnh thổ. Sẽ có người
muốn nhân nó với mức trả để "biết trước" — lược đồ phải làm việc ấy không thực
hiện được.

---

## 10. Pháp lý Việt Nam

> **Cảnh báo:** phần này do vòng nghiên cứu tra cứu, **chưa có luật sư xác
> nhận**, và luật bảo vệ dữ liệu cá nhân của Việt Nam vừa thay đổi. Dùng nó làm
> danh sách câu hỏi mang đi hỏi luật sư, **đừng dùng làm kết luận**.

### 10.1 Văn bản nào đang có hiệu lực

Theo tra cứu: **Nghị định 13/2023/NĐ-CP đã bị thay thế** bởi **Luật Bảo vệ dữ
liệu cá nhân 91/2025/QH15** và **Nghị định 356/2025/NĐ-CP** từ 01/01/2026.
`HA-TANG.md` mục 7b và phần chính sách trên cổng đối tác đang trích Nghị định
13 — **phải rà lại toàn bộ** sau khi luật sư xác nhận. Một tài liệu hạ tầng
trích văn bản đã bị thay thế thì mọi nghĩa vụ suy ra từ nó đều đáng ngờ.

Ngoài ra: **Nghị định 53/2022/NĐ-CP** về lưu trữ dữ liệu trong nước, và **Luật
An ninh mạng 116/2025** hiệu lực 01/7/2026.

### 10.2 Dữ liệu nào phải ở trong nước

Nghị định 53/2022 liệt kê đích danh **email, số điện thoại đăng ký, và địa chỉ
mạng đăng nhập/đăng xuất gần nhất** vào nhóm phải lưu trong nước. Tức là nhật
ký đăng nhập của vòng 24 rơi thẳng vào nhóm ấy.

| Được ra nước ngoài | Phải ở trong nước |
|---|---|
| Hồ Parquet dòng thô: ISRC × nền tảng × kỳ × số tiền — không tên người, không số tài khoản | `nguoi_dung` · `ben` · `so_cai` · `so_du_ben` · khai báo ngân hàng · mã số thuế |
| Bản sao lưu **đã mã hoá** (vẫn phải lập hồ sơ) | Khoá giải mã · **nhật ký đăng nhập** |
| Tài sản tĩnh của cổng (JS, CSS, font) | Bảng kê PDF — mang tên và số tài khoản, sinh theo yêu cầu từ bảng trong nước |

### 10.3 Ba nghĩa vụ có hạn chót

1. **Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân** — lập trong **60 ngày** kể
   từ khi bắt đầu xử lý thật, cập nhật 6 tháng một lần. Dự án này còn đang thêm
   bên tham gia (cổng người cộng tác), nên hồ sơ sẽ phải cập nhật.
2. **Hồ sơ chuyển dữ liệu ra nước ngoài** — nếu dùng **bất kỳ** thành phần nào
   ở nước ngoài: cloud, dịch vụ nhật ký, email, phân tích, CDN, hay chỉ một bản
   sao lưu. Nộp trong **60 ngày**.
3. **Quy trình 72 giờ khi lộ dữ liệu** — ai phát hiện, ai xác minh, ai ký văn
   bản gửi cơ quan, mẫu thông báo cho người bị ảnh hưởng. Viết sẵn, vì 72 giờ
   không đủ để vừa xử lý sự cố vừa nghĩ ra quy trình.

Mức phạt: theo tra cứu, trần **5% doanh thu năm liền trước** áp cho vi phạm
**chuyển dữ liệu ra nước ngoài**, với **sàn 3 tỷ đồng**; vi phạm khác trần 3 tỷ.
Với một công ty nhỏ, sàn 3 tỷ đồng là con số đáng sợ hơn tỷ lệ phần trăm — và
nó chĩa thẳng vào phương án C. **Hỏi luật sư ở bước 0 của lộ trình, trước khi
chọn nhà cung cấp**, không phải sau.

### 10.4 Nhật ký đăng nhập

Căn cứ xử lý là **thực hiện hợp đồng và nghĩa vụ theo quy định pháp luật**,
**không phải sự đồng ý**. Lý do thực tế: nhật ký hệ thống phải lưu tối thiểu 12
tháng theo Nghị định 53/2022 — nếu lấy sự đồng ý làm căn cứ thì một người rút
đồng ý là Haustek kẹt giữa hai nghĩa vụ trái nhau.

Chi tiết kỹ thuật ở `HA-TANG.md` mục 7b.

### 10.5 Bí mật và khoá

Tách làm hai công cụ:

- **Kho bí mật máy** — khoá ứng dụng, khoá ký URL, khoá phiên. Xoay theo quý,
  xoay ngay khi có người nghỉ việc.
- **Kho mật khẩu người** — tài khoản OneRPM · Believe · ADA · YouTube CMS ·
  Sentric. Đây là những tài khoản **dùng chung**, và đó là chỗ yếu nhất trong
  toàn bộ an ninh của Haustek: một bộ thông tin đăng nhập nhìn thấy toàn bộ
  doanh thu.

Mã hoá **cấp cột** cho số tài khoản ngân hàng và mã số thuế cá nhân, khoá giữ ở
dịch vụ quản lý khoá chứ không trong database. Hai cột này chỉ bao giờ được đọc
theo `ben_id` nên không cần index — mất khả năng tìm kiếm trên chúng không
thiệt gì, mà một bản kết xuất lọt ra ngoài không còn là sự cố phải báo cáo.

---

## 11. Tuần này làm gì

Năm việc. Không việc nào cần tiền, cần tuyển người, hay cần chọn nhà cung cấp.

**1 · Lấy file báo cáo THẬT của ba kỳ gần nhất, từ cả bốn nguồn.**
OneRPM · Believe · YouTube CMS · Sentric. Tải về một thư mục, viết một script
khoảng năm mươi dòng đếm bốn con số:

- số dòng thô một kỳ
- **tỷ lệ ISRC không tra được trong danh mục**
- số nền tảng có tiền trên một bài điển hình
- số bên có tiền một kỳ

`HA-TANG.md` mục 11 nói thẳng bốn con số này quyết định kiến trúc và chỉ biết
sau khi đọc dữ liệu thật. **Tỷ lệ không khớp quyết định biên chế vận hành** —
tức là nó quyết định một khoản lương, và lương là 78–93% chi phí. Đây là việc
có giá trị nhất trong cả tài liệu, và nó tốn 40–80 giờ chứ không tốn đồng nào.

**2 · Mở hai mươi hồ sơ phát hành cũ, bấm thử từng link WAV, đếm link còn sống.**
Tỷ lệ link chết là con số duy nhất trả lời được câu "có phải xây kho file
không". Mười phút.

**3 · Viết ra một trang giấy: hôm nay tiền chạy bằng cái gì.**
File Excel nào, ai giữ, ai đối chiếu với ai, chỗ nào chép tay, chỗ nào tính
lại. Đây là thứ phải số hoá. Không có nó trên giấy thì người mới tuyển ngồi
đoán, và cổng chấp nhận "khớp bảng tính kế toán" không có cái để khớp vào.

**4 · Chốt số dư mở đầu với kế toán trưởng tại một ngày cắt.**
Lấy từ **sổ kế toán và sao kê ngân hàng**, in ra, ký. `HA-TANG.md` chặng 4 nói
thẳng: chạy lại lịch sử bản mẫu chỉ ra một con số nghe hợp lý chứ không phải
con số đúng, vì bản mẫu không có sổ.

**5 · Đóng băng bản mẫu bằng một tag git.**
Ghi vào README rằng từ nay `portal/` là **đặc tả hành vi**, không phải nguồn dữ
liệu. Nếu bản mẫu còn được sửa tính năng trong lúc dựng hệ thật thì đích đến di
động, và không ai biết hệ thật đã đuổi kịp chưa. Mười phút.

Và một việc cần hẹn lịch với người ngoài, nên đặt luôn trong tuần này: **hỏi
luật sư** về hồ sơ dữ liệu cá nhân và hồ sơ chuyển dữ liệu ra nước ngoài —
trước khi chọn nhà cung cấp hạ tầng.

---

## 12. Lộ trình 12 tháng

`HA-TANG.md` mục 10 có chín chặng. Lộ trình này **đảo thứ tự một chỗ** và thêm
thời gian, con người, cổng chấp nhận.

**Đảo chặng 3 lên trước chặng 1: đọc file báo cáo thật TRƯỚC khi dựng lược đồ.**
`HA-TANG.md` tự nói bốn con số ấy quyết định kiến trúc và chỉ biết sau khi đọc
dữ liệu thật. Dựng lược đồ trước là dựng theo ước lượng rồi sửa lại — mà sửa
phân vùng sau khi đã nạp dữ liệu là việc rất đắt.

| # | Giai đoạn | Tháng | Ai | Cổng chấp nhận |
|---|---|---|---|---|
| **G0** | Đọc dữ liệu thật · chốt "không lưu audio" bằng văn bản · hỏi luật sư · chốt số dư mở đầu | 1 | 1 người + kế toán trưởng + luật sư | Có bốn con số thật. Có một dòng trong `HA-TANG.md`. Có chữ ký kế toán trưởng |
| **G1** | Dựng lược đồ + RLS + CI chạy `EXPLAIN` | 2–3 | 1 kỹ sư dữ liệu | **Mọi đường nóng dùng chỉ mục, không một `Seq Scan` nào** |
| **G2** | Nạp danh tính (người dùng, bên, người dùng ↔ bên) | 3–4 | 1 kỹ sư | Số bên khớp sổ kinh doanh |
| **G3** | Đường nạp: đọc file, khớp ISRC, hàng chờ, bốn đẳng thức | 4–6 | 2 kỹ sư | Nạp lại cùng file hai lần ra cùng kết quả · bốn đẳng thức cân |
| **G4** | Chốt kỳ, ví, chi trả · **đo thời gian chốt kỳ** | 6–8 | 2 kỹ sư | **Khớp bảng tính kế toán tới từng xu, hai kỳ liên tiếp** |
| **G5** | Chạy song song kỳ đầu | 8–9 | cả đội | **Một điều phối viên và một kế toán làm trọn một kỳ trên hệ mới mà không mở Excel lần nào**, có người ngồi quan sát ghi lại |
| **G6** | Chạy song song kỳ thứ hai · diễn tập khôi phục | 9–10 | cả đội | Khớp lần nữa · khôi phục xong dưới RTO đã đặt · sổ diễn tập có chữ ký |
| **G7** | Mở cổng đối tác theo lô: 10 → 100 → 1.000 | 10–12 | 1 kỹ sư + hỗ trợ | Mỗi lô chạy trọn **ít nhất một kỳ** trước khi mở lô sau · số trên cổng = số nội bộ |
| **G8** | Mở cho tất cả | 12+ | | |
| **G9** | Đóng băng bản mẫu, giữ làm bộ sinh ca kiểm thử | sau G8 | | |

Cổng kiểu "đã làm xong trang X" không đo được gì. Cổng của G5 — một người thật
làm trọn một kỳ mà không mở Excel — bắt đúng những chỗ hệ mới còn thiếu mà
không ai nghĩ ra khi ngồi viết mã.

Mở cổng đối tác theo lô vì **đối tác thấy số sai một lần là mất niềm tin**, và
sửa một con số đã hiện lên cổng tốn nhiều lần công so với sửa trước khi hiện.
Lô nhỏ giữ thiệt hại ở mức mười cuộc gọi chứ không phải năm mươi nghìn.

### 12.1 Đội ngũ

| Giai đoạn | Cần gì |
|---|---|
| G0–G2 | **1 kỹ sư dữ liệu Postgres** (người quan trọng nhất) + chủ dự án |
| G3–G4 | thêm **1 kỹ sư backend** |
| G5–G7 | thêm **1 người hỗ trợ đối tác** và **0,5 QA** |
| Sau G8 | thêm hỗ trợ theo tỷ lệ liên hệ đo được ở G7 |

**Đừng tuyển kỹ sư giao diện trước tháng thứ sáu.** 48 trang của bản mẫu đã là
đặc tả giao diện hoàn chỉnh, có cả bài kiểm hình học ở 390/640/900/1024/1280px.
Trong sáu tháng đầu không có gì để vẽ — chỉ có chuỗi tiền để dựng. Tuyển ngược
là trả lương cho người ngồi chờ.

Thuê ngoài được: dựng hạ tầng ban đầu, kiểm thử bảo mật, tư vấn pháp lý.
Không thuê ngoài được: chuỗi tiền, quy tắc khớp ISRC, quan hệ với các hãng
phân phối.

### 12.2 Bốn cái bẫy về thứ tự

1. **Dựng giao diện đẹp trước khi đọc file báo cáo thật.** Giao diện đã có sẵn
   trong bản mẫu; dữ liệu thật thì chưa ai nhìn.
2. **Chọn nhà cung cấp cloud trước khi hỏi luật sư về chỗ ở của dữ liệu.** Đổi
   nhà cung cấp sau khi đã nạp dữ liệu là dự án hàng tháng.
3. **Tuyển người trước khi có quy trình trên giấy.** Người mới sẽ tự nghĩ ra
   quy trình, và mỗi người nghĩ ra một kiểu.
4. **Mua máy theo dung lượng.** Ràng buộc thật là thời gian chốt kỳ, và nó chưa
   ai đo. Mua một máy nhỏ ở G1, đo ở G4, mua đúng ở G6.

### 12.3 Khi nào tắt được bản mẫu

Ba điều kiện, đủ cả ba:

- hai kỳ liên tiếp khớp bảng tính kế toán tới từng xu (G6 xong);
- toàn bộ đối tác đã chuyển sang hệ mới và chạy trọn ít nhất một kỳ (G8 xong);
- mọi phép kiểm trong `test/` đã có bản tương ứng chạy trên hệ thật.

Và khi tắt thì **đóng băng chứ không xoá**. 36 file kiểm thử với hơn bảy nghìn
dòng trong `test/` là tài sản đắt nhất của bản mẫu: mỗi phép kiểm ở đó dịch
thành một test trên hệ thật, và nó là chỗ duy nhất tra được "hành vi đúng là
gì".

---

## 13. Quyết định phải chốt trước khi viết dòng mã đầu tiên

| # | Câu hỏi | Chốt sai thì hỏng gì |
|---|---|---|
| Q1 | **Haustek có lưu bản gốc audio không?** | Sai ~200 lần về dung lượng, và sai hẳn về trách nhiệm pháp lý khi tranh chấp |
| Q2 | **Quy mô thiết kế là 500.000 hay 1.000.000 bài?** | Mua sai máy, tuyển sai người, và hai tài liệu nói hai điều khác nhau |
| Q3 | **`nhat_ky` ghi vết bảng nào, ghi nguyên dòng hay ghi chênh lệch?** | Ghi nguyên dòng mọi bảng thì riêng nó vượt 100 GB, và nó nhân bản email lẫn số tài khoản vào một bảng chỉ-ghi-thêm |
| Q4 | **Dữ liệu nào được phép ra nước ngoài?** | Phạt sàn 3 tỷ đồng, và phải viết thành luật trong mã chứ không phải thói quen |
| Q5 | **Ngưỡng thanh toán tối thiểu là bao nhiêu?** | Quyết định 22–220 triệu đồng phí chuyển tiền mỗi kỳ — khoản lớn hơn hoá đơn hạ tầng |
| Q6 | **Chốt kỳ chạy trong bao lâu là chấp nhận được?** | Đây mới là thứ quyết định cỡ máy, không phải dung lượng đĩa |
| Q7 | **Chứng từ kế toán giữ 10 năm va với quyền xoá dữ liệu cá nhân — giải thế nào?** | Hai nghĩa vụ trái nhau; giải muộn là phải sửa lược đồ sau khi đã có dữ liệu thật |

---

## 14. Chỗ chưa biết, phải đo mới trả lời được

Những câu này **không đoán được**, và tài liệu này cố ý không đoán:

| Chưa biết | Đo bằng cách nào | Ảnh hưởng tới |
|---|---|---|
| Tỷ lệ ISRC không khớp thật | bước 1 của mục 11 | **biên chế vận hành** — tức là lương |
| Số dòng thô một kỳ thật | bước 1 của mục 11 | cỡ hồ Parquet, thời gian pha 1, cỡ máy |
| Thời gian chốt kỳ | đo ở G4 | cỡ máy Postgres |
| Tỷ lệ link WAV còn sống | bước 2 của mục 11 | Q1 — có xây kho file không |
| Các hãng phân phối có API giao file không | hỏi từng hãng | có tự động hoá được đường nạp không |
| Có API lấy lượt nghe hằng ngày không, hay chỉ dashboard | hỏi nhà phân phối chính | đổi kết quả theo hệ số 100× — nếu chỉ có dashboard thì lượt nghe là dữ liệu gõ tay |
| Giá NVMe và IOPS bảo đảm ở nhà cung cấp trong nước | xin báo giá | dòng chi lớn nhất của phương án C |
| VNG/Viettel có bán Postgres quản lý sẵn ở cấu hình cần không | hỏi | nếu không thì "dùng managed" và "đặt trong nước" triệt tiêu nhau |
| Tỷ lệ đối tác liên hệ hỗ trợ mỗi kỳ | đo ở G7 lô 100 và lô 1.000 | biên chế hỗ trợ — lớn hơn biên chế vận hành hệ thống |

---

## 15. Cố ý không làm ở giai đoạn một

Ghi ra để không ai tưởng là quên:

- **Kubernetes, microservices, service mesh.** Một ứng dụng, một database, hai
  máy. Thêm lớp điều phối là thêm một hệ thống phải học, phải vá, phải trực.
- **Nhiều vùng địa lý (multi-region).** Người dùng ở Việt Nam. Một vùng.
- **Lakehouse đầy đủ** — Iceberg, Delta, catalog, orchestrator. DuckDB đọc
  Parquet đã đủ cho 22 triệu dòng một kỳ.
- **Bản sao đọc để gánh tải.** Chưa cần ở cả năm 1 lẫn năm 5.
- **Chấm điểm rủi ro từng lần đăng nhập, dấu vân tay thiết bị.** Cái đầu cần dữ
  liệu lịch sử chưa có; cái sau thu thập nhiều hơn mức cần để trả lời câu hỏi
  đang hỏi — mà dữ liệu cá nhân thu thừa chỉ là nợ.
- **Tự động tải báo cáo bằng cách giả người đăng nhập.** Xem mục 8.3.

Mỗi mục trên có một điều kiện để đổi ý, và điều kiện ấy phải là **một con số đo
được**, không phải cảm giác.
