# Haustek Portal — bản mẫu chạy được

Hai cổng, một lõi. Mở bằng trình duyệt là chạy, không cần cài gì.

| Đường dẫn | Ai dùng | Làm gì |
|---|---|---|
| `v2/intranet.html` | Nội bộ Haustek | Nạp báo cáo, khớp ISRC, đối chiếu, xét duyệt kỳ, tỷ lệ, tạm ứng, chi trả, hỗ trợ, phát hành, tổ chức |
| `v2/khach.html` | Label và nghệ sĩ | Xem số NET của kỳ đã duyệt, ví và rút tiền, bảng kê, bài hát, hỗ trợ |
| `haustek-core.js` | cả hai | Lõi dữ liệu — đóng vai database + API, giữ mọi luật |
| `v2/man/*.js` | từng cổng | Mỗi trang một file; `k-*.js` là trang của cổng đối tác |
| `goi-mot-trang.html` | xem online | Cả hai cổng gói vào một file, dựng bằng `node dung-goi.js` |
| `index.html` | | Trang chọn: hai cổng, bản gói, bản thiết kế, tài liệu |

Bản v1 (`intranet.html`, `dashboard.html`, `screens/`) đã gỡ ở vòng 22; lịch sử còn trong git.

## Đọc gì trước

- **`KIEN-TRUC.md`** — kiến trúc: lược đồ state, ranh giới lõi ↔ trang ↔ cổng, hệ mã định danh,
  di trú lược đồ, mô hình người dùng ↔ bên thụ hưởng ↔ vai trên bài, chuỗi tiền, quyền và AAA,
  các quyết định đã chốt. Sửa lõi thì đọc file này trước.
- **`TRIEN-KHAI.md`** — lưu ở đâu, tốn bao nhiêu, làm theo thứ tự nào: dung lượng thật của
  500.000 bài, chọn nhà cung cấp, chi phí hằng tháng, lộ trình 12 tháng, và tuần này làm gì.
- **`HA-TANG.md`** — hạ tầng bản CHẠY THẬT: lược đồ Postgres với khoá và chỉ mục, chốt kỳ là
  giao dịch gì, huỷ chốt ghi gì, đồng thời và idempotency, RLS và bảng dịch từ `test/api-guard.js`
  sang luật thật, ngân sách mili-giây cho từng đường nóng, chín chặng di trú. Rời bản mẫu thì
  code theo file này.
- **`v2/README.md`** — từng vòng đã làm gì, từng trang trả lời câu hỏi gì, và những chỗ bản mẫu
  cố tình không chứng minh.
- **`v2/VAN-PHONG.md`** — chuẩn thuật ngữ và giọng tiếng Việt cho mọi chữ trên cổng
  (*trang* không phải màn, *đối tác* không phải khách hàng, " · " làm dấu ngăn).
- **`test/README.md`** — bộ kiểm: ranh giới quyền, hạ tầng, bất biến tiền, và các bài chạy trên
  trình duyệt thật.

## Chạy thế nào

Mở thẳng `v2/intranet.html` bằng Chrome hoặc Firefox là được. Muốn chắc ăn (và bắt buộc nếu
dùng Safari, vì Safari chặn `localStorage` với file mở từ ổ đĩa):

```bash
cd portal && python3 -m http.server 8099 --bind 127.0.0.1
# rồi mở http://127.0.0.1:8099/v2/intranet.html
```

Trạng thái nằm ở `localStorage` khoá `haustek.portal.v1`; trang **Quản trị → Dữ liệu** xuất và
nhập được file JSON, và cho biết phiên bản lược đồ đang chạy.

## Số liệu chảy từ cổng nội bộ sang cổng đối tác bằng cách nào

**Danh mục và doanh thu không được truyền đi.** Chúng sinh tại chỗ bằng một bộ sinh số giả
ngẫu nhiên có hạt giống cố định — hai cổng mở riêng vẫn ra đúng cùng một con số.

**Thứ được truyền là QUYẾT ĐỊNH của nội bộ:** đã nạp nguồn nào cho kỳ nào, khớp tay dòng nào,
tỷ lệ đổi từ kỳ nào, bảng giá nền tảng, tạm ứng, bút toán, và **đã xét duyệt kỳ nào**. Chừng
đó là một object JSON, khai đầy đủ trong `LUOC_DO` của lõi (54 khoá), lưu ở `localStorage`.

```
nội bộ: nạp đủ nguồn cho kỳ X → khớp dòng treo → ghi nhận chênh lệch → chốt tỷ giá
        → XÉT DUYỆT KỲ  ← cánh cửa duy nhất
        → bảng chi trả (trừ tạm ứng, áp ngưỡng)
đối tác: kỳ X hiện ra trong ô chọn kỳ, và chỉ lúc này mới hiện
```

Chưa duyệt thì `HAUSTEK.api` ném lỗi cho mọi lời gọi vào kỳ đó. Không phải ẩn đi — là
không trả về.

## Hai mặt tiền, một lõi

```
haustek-core.js
├── HAUSTEK.admin   ← dữ liệu thô, tên đơn vị phân phối, tỷ lệ gốc, hàng chờ khớp,
│                     nút xét duyệt. Đã bọc quyền theo vai.   CHỈ v2/intranet.html
└── HAUSTEK.api     ← gói đã tính sẵn, đã cắt, đã giấu tên nhân sự, cho đúng một
                      người xem, đúng một kỳ đã duyệt.        CHỈ v2/khach.html
```

`khach.html` gọi `HAUSTEK.lockdown()` ở dòng đầu; sau đó `HAUSTEK.admin` biến mất khỏi trang.
Hai bí mật kinh doanh — tên đơn vị phân phối và tỷ lệ gốc — ngay từ đầu **không nằm trong
`haustek-core.js`**: cổng nội bộ tự nạp chúng lúc khởi động.

### Chỗ bản mẫu KHÔNG chứng minh được

Hai cổng chạy cùng một trình duyệt, cùng một gốc: nạp lại lõi trong một iframe cùng gốc là có
lại `HAUSTEK.admin`; `localStorage` giữ mọi quyết định và trang nào cùng gốc cũng đọc được. Đây
là **hình dạng** của ranh giới, chưa phải ranh giới đã thực thi. Thứ thật sự bảo đảm cách ly
là dữ liệu thô trong database, lọc và tổng hợp ở máy chủ, Row Level Security quyết định ai đọc
dòng nào; `test/api-guard.js` viết hình dạng ấy thành phép kiểm chạy được, và khi lên Postgres
mỗi phép kiểm dịch thành một test SQL trên policy.

> `HAUSTEK.api` ở bản mẫu nhận `partyId` như tham số; ô chọn tài khoản trên cổng đối tác chỉ
> để xem thử. Khi làm thật, **`partyId` phải lấy từ phiên đăng nhập trên máy chủ** — không thì
> sửa một con số trên URL là xem được dữ liệu người khác.

## Quy mô đang chạy trong bản mẫu

- 50.000 bản ghi · 900 nghệ sĩ · 40 label · 12 kỳ × 3 nguồn = 1.800.000 ô doanh thu
- bóc theo 218 cửa hàng × 16 lãnh thổ, tính từ mã bản ghi chứ không lưu sẵn
- dựng lõi ≈ 0,8–3,5 giây tuỳ máy; vẽ lại một trang ≈ 7 ms nhờ đệm theo `duLieuVer()`

## Cái gì thật, cái gì giả

**Thật** — mô hình dữ liệu, chuỗi chia tiền (bảng giá → phí → tỷ lệ → bên thụ hưởng), tỷ lệ có
ngày hiệu lực, hàng chờ ISRC, quy tắc đối chiếu, cổng xét duyệt, thu hồi tạm ứng, ngưỡng chi
trả, ma trận quyền theo vai và cây tổ chức, nhật ký, di trú lược đồ, hệ mã định danh.

**Giả** — bản thân các con số; "nạp file" chỉ bật cờ chứ không đọc file thật.

**Chưa có** — database, **mật khẩu** (trang đăng nhập có thật và tra email thật, nhưng ô mật khẩu không được kiểm — nó có mặt để đội lập trình thấy chỗ nó nằm), quy đổi tiền tệ theo từng nền tảng, và **địa chỉ IP**:
nhật ký đăng nhập ghi thật thời điểm, cổng, người, thiết bị và trình duyệt, nhưng cột Địa chỉ IP
in "chưa có · bản mẫu" ở mọi dòng — trình duyệt biết tên của chính nó, không biết địa chỉ của
chính nó. `test/dang-nhap.js` quét cả kho để cột ấy không bao giờ bị điền cho đẹp.

## Kiểm tra

```bash
node test/api-guard.js        # ranh giới quyền — phải chạy trong CI
node test/luoc-do.js && node test/ma-dinh-danh.js && node test/ranh-gioi-trang.js
node test/qc-bat-bien.js && node test/qc-quyen.js && node test/qc-vai-quet.js && node test/qc-dem-nho.js
```

Bài chạy trên trình duyệt thật (Playwright) xem `test/README.md`.

## Bản gói một trang

`goi-mot-trang.html` (≈1,6 MB, đã gồm bộ chữ nhúng) là cả hai cổng gói vào một file, dựng bằng
`node dung-goi.js` — mỗi lần sửa nguồn phải dựng lại (`test/goi-du-trang.js` bắt trang bị bỏ
sót). Trang trong bản gói nằm trong hàm và chỉ chạy bộ của cổng đang mở, nên cổng đối tác vẫn
gọi `lockdown()` trước khi trang nào chạy. Trình xem online chặn tải file thẳng, nên nút Xuất
CSV đi qua `claude.use('downloads')` khi có (cờ `HAUSTEK_XEM_ONLINE`); `test/v2-nhu-artifact.js`
giả lập cả hai tình huống.
