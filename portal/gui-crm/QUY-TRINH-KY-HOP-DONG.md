# Quy trình ký hợp đồng điện tử — tư vấn

Chủ dự án mô tả luồng mong muốn và nói *"khá rối rắm"*. Đúng là rối, nhưng
rối ở một chỗ gọi tên được — và có một chỗ **phải sửa trước khi chạy luồng
này**, vì nó nằm trong chuỗi tiền.

---

## 0 · Luồng đang mong muốn, viết lại cho gọn

```
CRM      người có thẩm quyền duyệt deal
  ↓      số và điều khoản sync sang Portal
PORTAL   giám đốc duyệt                      ← tiền chạm sổ ở đây
  ↓      kết quả về CRM
CRM      A&R theo dõi · pháp chế soạn hợp đồng
  ↓      pháp chế tải bản nháp lên
CRM      A&R và quản lý đọc, duyệt bản nháp
  ↓      pháp chế đưa lên phần mềm ký (DocuSign / Adobe Sign)
DS       giám đốc ký
  +
PORTAL   giám đốc thấy việc cần làm, bấm "đã ký"
```

**Ba hệ, năm cửa người, và giám đốc xuất hiện hai lần.** Đó là chỗ rối. Nó
không rối vì nhiều bước — nhiều bước là đúng với một hợp đồng thật. Nó rối
vì **cùng một dữ kiện đang có nhiều hơn một chủ**.

---

## 1 · Nguyên tắc: mỗi dữ kiện có đúng MỘT chủ, mọi hệ khác đọc

Đây cũng là nguyên tắc đã cứu cầu nối CRM ↔ Portal ở bốn vòng vừa rồi. Áp
vào luồng ký:

| Dữ kiện | Chủ | Vì sao |
|---|---|---|
| Điều khoản deal | **CRM** | nơi đàm phán |
| "Tiền được duyệt" | **Portal** | giám đốc duyệt ở đây, tiền chạm sổ ở đây |
| Bản hợp đồng, bản nháp | **CRM** | pháp chế làm việc ở đó |
| **Chữ ký** | **DocuSign** | đó là bản ghi pháp lý, không phải một ô tick |
| "Việc giám đốc phải làm hôm nay" | **Portal** | đó là hàng đợi của họ |

Đọc bảng này thì bước cuối trong luồng mong muốn hiện ra là sai:

> **Giám đốc không nên bấm "đã ký" ở đâu cả.**

Chữ ký là dữ kiện DocuSign sở hữu. Bấm "đã ký" ở Portal là dựng **nguồn thứ
hai cho một dữ kiện đã có chủ** — và nó sẽ lệch: người ký xong quên bấm, hoặc
bấm rồi mới ký, hoặc ký bản khác. Đúng loại lỗi im lặng đã mất bốn vòng để
dọn ở cầu nối.

**Nên làm:** việc trong Portal **tự biến mất** khi DocuSign báo hoàn tất
(webhook). Giám đốc chỉ ký một lần, ở một chỗ.

**Nếu bản mẫu chưa nối được webhook:** giữ nút, nhưng đừng để nó là một ô
đúng/sai. Đặt tên **"Đánh dấu đã ký"**, bắt nhập **mã hồ sơ DocuSign**, và
ghi rõ đây là ghi nhận tay. Khi ấy nó là một bản ghi đối soát được, không
phải một lời khai.

---

## 2 · Giám đốc chỉ mở MỘT hệ

Giám đốc xuất hiện hai lần trong luồng, và hai lần ấy **khác việc thật**:
duyệt tiền ≠ ký giấy. Giữ cả hai. Nhưng đừng bắt họ đi tìm deal qua ba công
cụ.

- Việc trong Portal mang **link mở thẳng hồ sơ DocuSign**. Một cú bấm từ
  hàng đợi tới trang ký.
- Giám đốc **không cần mở CRM** lần nào.
- Hai việc của cùng một deal hiện thành **một dòng đổi trạng thái**, không
  phải hai việc rời: *chờ duyệt → đã duyệt, chờ ký → đã ký*.

Hàng đợi mà bắt người ta nhảy hệ sẽ thành hàng đợi không ai tin, và khi đó
mọi thứ quay về nhắn tin cho nhau.

---

## 3 · Chỗ PHẢI sửa trước: Portal đang coi "duyệt" là "đã ký"

Đây là phần quan trọng nhất của tài liệu này, và nó không phải chuyện quy
trình — nó nằm trong chuỗi tiền. Đo được:

```
giám đốc duyệt đề xuất hợp đồng (phí 42%)
  → state.contracts ghi ngay:  feePct 0.42 · from 2026-09-01 · approvedAt 2026-09-16
  → có trường signedAt không?  KHÔNG
  → feeOf() áp 42% cho tiền từ kỳ 2026-06 trở đi
chưa ai ký một chữ nào.
```

Hai điều cùng lúc:

1. **Không có chỗ nào phân biệt "đã duyệt" với "đã ký".** Portal tin là có
   hợp đồng kể từ lúc giám đốc bấm duyệt.
2. **Mức phí còn hồi tố** về kỳ 2026-06, tức **ba tháng trước ngày duyệt**.

Ở luồng cũ điều này vô hại: duyệt *là* quyết định, hợp đồng giấy là thủ tục
theo sau. Ở luồng đang mô tả thì khác hẳn — giữa lúc duyệt và lúc ký có
nhiều ngày hoặc nhiều tuần cho pháp chế soạn, A&R đọc, quản lý duyệt. **Và
đối tác có thể không ký.** Suốt quãng ấy Portal đang trả tiền theo một hợp
đồng chưa tồn tại.

### Đề nghị

Thêm `signedAt` và `hoSoKy` (mã hồ sơ DocuSign) vào `state.contracts`, rồi
**chốt một trong hai** — đây là quyết định kinh doanh, chúng tôi không tự
quyết:

| | `feeOf` đọc | Được gì | Mất gì |
|---|---|---|---|
| **(a)** | chỉ khi có `signedAt` | tiền đi theo hợp đồng đã ký, không bao giờ sớm hơn | kỳ giữa duyệt và ký vẫn tính theo mức cũ, sau phải truy thu hoặc bù |
| **(b)** | như hiện nay, từ `approvedAt` | không phải tính bù | phải hiện rõ **"chưa ký"** ở hồ sơ đối tác, và phải có việc nhắc nếu quá N ngày chưa ký |

Chọn cái nào cũng được, nhưng **đừng để ngầm định**. Hiện tại hệ đang làm
(b) mà không có phần cảnh báo của (b) — tức là đang lấy cái tiện của (b) và
bỏ cái giá của nó.

Chuyện hồi tố ba tháng là một câu hỏi riêng, cũng cần chốt: phí mới nên chạy
từ **kỳ ký**, **kỳ duyệt**, hay **kỳ hai bên thoả thuận**? Ba đáp án đều
hợp lý, nhưng hiện mã đang chọn một cái mà không ai từng quyết.

---

## 4 · Hai cửa đọc bản nháp đang đọc gì?

A&R và quản lý đọc bản nháp sau khi giám đốc đã duyệt điều khoản ở Portal.
Nếu họ đọc lại **điều khoản** thì đó là chỗ trùng lặp vòng 27 vừa dọn, quay
lại bằng cửa sau. Nếu họ đọc **câu chữ** — tên pháp nhân, ngày, lãnh thổ,
điều khoản chấm dứt, chính tả — thì đó là việc thật và không ai khác làm
được.

**Một dòng chữ trên màn hình giải quyết cả lớp vấn đề này:**

> *"Điều khoản đã được duyệt ở Portal ngày 16/09. Bước này soát câu chữ hợp
> đồng, không soát lại giá."*

Nếu người đọc thấy giá sai thì đường đi là **trả đề xuất về Portal**, không
phải sửa trong bản Word. Nói rõ chỗ ấy, không thì sớm muộn có một hợp đồng
mang con số khác con số giám đốc đã duyệt.

---

## 5 · Luồng đề nghị, sau khi sửa

```
CRM      A&R dựng deal · người có thẩm quyền duyệt
  ↓      gói 1.0 sang Portal
PORTAL   kế toán soát → giám đốc duyệt          ← tiền chạm sổ
  ↓      gói 1.1 về CRM (giaiDoan "legal")
CRM      pháp chế soạn · tải bản nháp
CRM      A&R + quản lý soát CÂU CHỮ (không soát giá)
  ↓      pháp chế đẩy lên DocuSign
PORTAL   việc "Ký hợp đồng D-2026-1187" → link mở thẳng hồ sơ
DS       giám đốc ký MỘT lần
  ↓      webhook
PORTAL   việc tự đóng · state.contracts ghi signedAt + mã hồ sơ
  ↓      gói 1.1 về CRM (giaiDoan "won")
CRM      A&R thấy deal đã xong
```

Vẫn năm cửa người — không cắt được cửa nào, vì mỗi cửa là một người khác
nhìn một thứ khác. Nhưng:

- giám đốc **chỉ mở Portal**, và **ký một lần**;
- không ai gõ lại dữ kiện hệ khác đã có;
- **không ô tick nào** đại diện cho một chữ ký.

---

## 6 · Việc cần làm, theo thứ tự

| | Việc | Ai | Chặn ai |
|---|---|---|---|
| 1 | `signedAt` + `hoSoKy` trong `state.contracts` | Portal | chặn cả luồng ký |
| 2 | **Chốt (a) hay (b) ở mục 3** | chủ dự án | chặn việc 1 |
| 3 | Chốt kỳ bắt đầu của phí mới (ký / duyệt / thoả thuận) | chủ dự án | không chặn, nhưng đang sai ngầm |
| 4 | Việc "Ký hợp đồng" trong hàng đợi giám đốc, có link | Portal | |
| 5 | Nhận webhook DocuSign → đóng việc, ghi `signedAt` | Portal | cần việc 1 |
| 6 | Dòng chữ "soát câu chữ, không soát giá" | CRM | rẻ, làm ngay được |
| 7 | Gói 1.1 thêm `hopDongKy` khi có việc 1 | cả hai | bản 1.2 |

Việc 2 và 3 là **quyết định**, không phải mã. Chúng tôi dừng ở đây chờ chốt.

---

## 7 · Còn một câu chưa trả lời: mức phí tạm ứng

Câu hỏi cũ vẫn để mở. Mô tả luồng ở trên nói về **điều khoản deal** — số
tiền, kỳ hạn, tỷ lệ chia — và những thứ đó đúng là do CRM chốt rồi Portal
duyệt.

Nhưng **phí thu hồi tạm ứng** (`ADVANCE_FEE`) là thứ khác: đó là giá vốn
Haustek tính khi ứng tiền trước, không phải một điều khoản đàm phán với đối
tác. Hiện bước 3 để nó dùng mức mặc định của Portal và ghi rõ trong ghi chú
đề xuất để giám đốc thấy.

Chúng tôi **giữ nguyên như vậy** cho tới khi có chỉ đạo khác — và nói ra ở
đây để nó là một lựa chọn có người biết, không phải một mặc định không ai để ý.
