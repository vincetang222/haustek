# Hợp đồng dữ liệu 1.1 · để hai hệ đi cùng nhịp

Bản 1.0 đã chạy được. Sáu đề nghị dưới đây không phải để làm nó đẹp hơn —
mỗi đề nghị đóng lại **một lối im lặng đã đo được**, tức là một chỗ hai hệ
mang hai con số cho cùng một deal mà không bên nào báo gì.

Đếm tới giờ: bốn lỗi tìm được trên cầu nối, **ba trong bốn đều là im lặng**,
không phải sập. Đó là thứ đắt nhất trong ghép hệ, vì nó chỉ hiện ra khi
giám đốc đã ký.

---

## 1 · Đơn vị nằm trong TÊN trường, không nằm trong trí nhớ

Chỗ đau nhất và cũng dễ đóng nhất.

```
1.0    artistSharePct: 70        70% hay 0,70? tuỳ người đọc
1.1    artistShareBps: 7000      điểm cơ bản, số nguyên, không còn gì để đoán
```

Cùng một trường, hai hệ, hai cách hiểu — các bạn đã gặp ở phía mình
(*"deal tạo từ form gửi 0,02 còn deal cũ gửi 2"*), chúng tôi gặp lại ở phía
Portal (`tvPhanTram` đoán theo độ lớn). Cả hai lần đều tự sửa được, và cả
hai lần **cái mơ hồ vẫn còn nguyên trong tên trường** nên nó sẽ quay lại.

Điểm cơ bản (basis point) là số nguyên: `7000` = 70,00%. Không dấu phẩy,
không làm tròn, không có `Math.round(x * 1000) / 10` ở giữa.

**Cách chuyển, không gãy:** bản 1.1 gửi **cả hai** trường. Portal đọc `Bps`
nếu có, rơi về `Pct` nếu không, và **ném nếu hai trường không khớp** —
lệch nhau là đang có lỗi ở một bên, không phải chuyện để chọn bên nào đúng.
Sang 2.0 thì bỏ hẳn `Pct`.

Áp dụng cho mọi trường đuôi `Pct`: `feePct`, `findersFeePct`.

---

## 2 · Portal công bố khoảng nó nhận · CRM đọc LÚC DỰNG DEAL

Lỗi 72 tháng các bạn tìm ra không nằm ở chỗ Portal cắt câm. Nó nằm ở chỗ
**người bán đã hứa 72 tháng trước khi biết Portal chỉ nhận tới 60.** Chặn
lúc trình là đúng, nhưng lúc ấy đã hứa rồi.

`them-gioi-han.patch` đưa khoảng ấy ra thành dữ liệu:

```js
A.thuongVu.gioiHan()
→ { v: "1.0.0",
    termMonths:     { min: 6,  max: 60 },
    artistSharePct: { min: 50, max: 97 },
    totalAdvanceUSD:{ max: 0, nguong: 100, ghiChu: "chưa nối chân tạm ứng ở bước 1" } }
```

Số đọc từ `HD_KHOANG` — cùng hằng số `contractCalc` dùng, không chép lại.
Đổi trần ở lõi thì bản công bố đi theo, và bài kiểm `Giới hạn công bố khớp
đúng điều Portal thật sự nhận` ghim mối ấy: nó thử đúng 4 mốc biên và 4 mốc
vượt biên, nên hai bên **không thể lệch nhau mà vẫn xanh**.

Về sau có máy chủ thật thì đây là `GET /api/thuong-vu/gioi-han`, CRM gọi
lúc mở form dựng deal và vô hiệu hoá luôn những mức nằm ngoài.

Lưu ý `artistSharePct.min = 50`: Haustek không nhận phí quá 50%. Nếu deal
thật của các bạn có đi dưới mức ấy, nói sớm — đó là chuyện chính sách, sửa
`HD_KHOANG` là xong, nhưng phải là một quyết định chứ không phải một lần
cắt câm.

---

## 3 · Mỗi deal mang số bản (`rev`)

Bản vá hiện so **nội dung** để biết gói tới có khác gói cũ không. Chạy được,
nhưng là suy ra. Một số nguyên tăng dần thì rẻ hơn và không phải đoán:

```json
{ "dealId": "D-2026-1187", "rev": 3, "terms": { ... } }
```

Được ba thứ cùng lúc:

- **Gửi lại y nguyên** → `rev` bằng nhau → bỏ qua, không phải so cả cây.
- **Gói tới trễ, không đúng thứ tự** → `rev` nhỏ hơn bản đang giữ → bỏ qua.
  Hiện chưa có cách nào phát hiện, và một lần gửi lại chậm sẽ ghi đè bản mới
  bằng bản cũ.
- **Dòng lệch nói được số bản** — *"Portal đang giữ rev 2, CRM đã lên rev 4"* —
  thay vì bắt người đọc so hai khối JSON.

---

## 4 · CRM phải ĐỌC kết quả trả về, không chỉ gửi

Đây là điều kiện để bản vá (c) có ích. `tvNhanGoi` nay trả:

```js
{ them: 2, capNhat: 1, lech: 1, bo: 5, ids: [...], idLech: ["D-2026-1187"] }
```

`lech: 1` nghĩa là: **Portal đang giữ bản cũ của deal ấy, và giám đốc đang
duyệt trên bản cũ đó.** Bản mới các bạn vừa gửi được ghi lại nhưng cố ý
không đè lên — quyết định đã lên bàn rồi thì gói tới sau không được lặng lẽ
đổi nó.

Nếu CRM gửi xong rồi bỏ qua giá trị trả về, chúng tôi chỉ **dời chỗ im lặng
từ Portal sang CRM**, không dẹp được nó. Con số ấy phải hiện lên chính deal
đó, trước mặt người phụ trách A&R, kèm một việc phải làm: *rút đề xuất ở
Portal rồi trình lại, hay giữ bản cũ.*

Cùng lý ấy: `bo` cao bất thường (gửi 40 deal, `them: 0`, `bo: 40`) nghĩa là
đang gửi lại nguyên một lô cũ — không hại gì, nhưng đáng để biết.

---

## 5 · Một deal sinh HAI đề xuất, không phải một

Cần chốt **bây giờ**, trước khi dựng trang bước 2 và chân tạm ứng bước 3,
vì nó đổi hình dòng dữ liệu đường về.

Deal thật của các bạn mang `totalAdvanceUSD` — điều khoản mẫu trong chính bộ
kiểm của các bạn là 16.100. Ở Portal, hợp đồng và tạm ứng là **hai đề xuất
riêng**, hai lần giám đốc bấm, và có thể một cái được duyệt còn cái kia bị
trả. Nên đường về không thể là một `deXuatId`:

```js
/* 1.0 */  { dealId, deXuatId: "DX-2609-011", trangThai: "daTrinh" }
/* 1.1 */  { dealId, deXuat: [ { id: "DX-2609-011", loai: "hopDong", trangThai: "submitted" },
                               { id: "DX-2609-012", loai: "tamUng",  trangThai: "approved"  } ] }
```

**Và một điều tuyệt đối, xin nhắc lại vì nó là lỗi đắt nhất đã gặp:** chân
tạm ứng bước 3 phải đi qua `proposals.proposeAdvance`, **không bao giờ**
`advances.set()`. `advances.set()` **gán đè** số dư gốc; `applyApproved()`
**cộng dồn**. Một lượt đẩy từ CRM gọi thẳng `set()` là xoá mất khoản tạm ứng
giám đốc đã duyệt kỳ trước — các bạn đã kiểm lại trên mã và xác nhận. Tới
khi chân ấy nối xong, bản vá (b) từ chối thẳng những deal có tạm ứng, thay
vì nuốt im lặng một điều khoản tiền.

---

## 6 · Đường về: `portalPartyKey` và một dòng `chiTiet` chỉ để đọc

Hai trường nhỏ, đóng hai khe.

**`portalPartyKey`** — 1.0 đã có chiều đi (CRM khai vào `khoaCrm`) nhưng
chưa có chiều về. Người Portal gắn bên xong thì quyết định ấy nằm lại trong
Portal; lần sau CRM lại gửi deal cho cùng đối tác ấy mà vẫn không biết khoá
nào. Trả về, CRM lưu vào account, lần sau gửi kèm — và `ganBen` từ chỗ phải
quyết thành chỗ chỉ xác nhận.

**`chiTiet`** — một chuỗi **chỉ để hiện**, không để hệ nào đọc bằng mã:

```
"Đang chờ kế toán soát · trình 3 ngày trước"
```

A&R nhìn là biết deal đang nằm đâu, mà CRM **không phải thêm một trạng thái
nào vào máy trạng thái của mình**. Chỗ này quan trọng: nếu Portal trả về một
mã trạng thái, CRM sẽ phải ánh xạ nó vào các bước của mình, và hai máy trạng
thái ghép vào nhau là nguồn lỗi mới. Trả một câu chữ thì không ai ánh xạ gì.

---

## Một điều KHÔNG nên làm

**Đừng cho Portal ghi ngược vào CRM.** Một chiều ghi (CRM → Portal), một
chiều đọc (CRM đọc kết quả). Cho cả hai cùng ghi lên một deal là dựng hai
nguồn sự thật cho cùng một con số — đúng cái sinh ra cả bốn lỗi tới giờ.

Đường về ở mục 4 và 6 là **kết quả đọc được**, không phải lệnh ghi. Khác
nhau ở chỗ: nếu CRM bỏ qua nó, không gì hỏng cả — chỉ là A&R không biết.
Nếu Portal ghi ngược mà CRM cũng đang ghi, hai bên đè nhau và không ai biết
bên nào thắng.

---

## Thứ tự đề nghị

| | Việc | Sửa bên nào | Đóng lối im lặng nào |
|---|---|---|---|
| 1 | Áp `va-buoc-1.patch` | Portal | bốn lỗi đã đo |
| 2 | Đọc `lech` và hiện lên deal | **CRM** | bản sửa bị đóng băng mà A&R không biết |
| 3 | Áp `them-gioi-han.patch`, gọi lúc dựng form | cả hai | hứa với đối tác con số Portal không nhận |
| 4 | Chốt hình đường về (`deXuat[]`, `portalPartyKey`, `chiTiet`) | cả hai | phải chốt TRƯỚC bước 2 |
| 5 | Thêm `artistShareBps` song song | **CRM** | đơn vị đoán theo độ lớn |
| 6 | Thêm `rev` | **CRM** | gói tới trễ đè bản mới bằng bản cũ |

Hai việc đầu làm được ngay hôm nay. Việc 4 là việc duy nhất **chặn bước 2**,
nên nếu chỉ bàn được một thứ thì bàn thứ ấy.
