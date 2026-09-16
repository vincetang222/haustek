# Note gửi team CRM

Ba việc: bản chất bốn lỗi các bạn tìm ra, một thứ chúng tôi học từ phân
quyền của các bạn, và đề nghị về thương hiệu chung.

---

## 1 · Bốn lỗi ấy là MỘT lỗi, lặp bốn lần

Các bạn liệt kê bốn chỗ. Chúng tôi đo lại hai chỗ nặng nhất và nhận cả bốn.
Nhưng nếu chỉ sửa bốn chỗ thì chỗ thứ năm sẽ tới, vì cả bốn cùng một gốc:

> **Chúng tôi kiểm đúng cái ví dụ mình đã đo, rồi coi như đã kiểm cả lớp.**

Cụ thể, từng cái một:

| Lỗi | Cái chúng tôi đo | Cái chúng tôi tưởng đã kiểm |
|---|---|---|
| Câu ghép | một câu có vế đầu là khoá tra thẳng | **mọi** câu ghép |
| Tạm ứng | trường `totalAdvanceUSD` | **mọi** trường tiền |
| i18n | 8 câu `new Error` | **mọi** câu lỗi |
| Sai đơn vị | gói 0,85 "bị CHẶN" | gói 0,85 **bị chặn đúng lý do** |

Bài kiểm câu ghép của chúng tôi dùng vế đầu là `Gói không mang dấu…` — một
khoá tra thẳng. Nó đi đường khác và **không bao giờ chạm vòng dò mẫu**, tức
là đúng cái đường hỏng. Xanh, và không chứng minh gì.

### Chỗ tệ nhất là cái thứ tư, và nó đáng nói riêng

Gói sai đơn vị bị chặn — nhưng bị chặn bởi **trần phí 3–50%**, một hàng rào
dựng vì lý do hoàn toàn khác. Chúng tôi đo, thấy chữ "CHẶN", rồi **chép
nguyên vào tài liệu soát như bằng chứng bản vá chạy đúng**.

Đó không phải là kiểm thiếu. Đó là **đo đúng đầu ra của một cơ chế sai** —
và nó nguy hiểm hơn hẳn một bài kiểm thiếu, vì nó tạo ra bằng chứng giả.
Ngày ai đó nới trần phí lên 99% vì một lý do chính đáng nào đó, gói sai đơn
vị lại đi lọt câm, và không dòng nào trong mã nhắc rằng hai thứ ấy dính nhau.

**Luật chúng tôi rút ra, và xin đề nghị cho cả hai đội:**

> Một bài kiểm chỉ có giá trị khi nó nêu được **cơ chế** chặn, không chỉ
> **kết quả** chặn. "Bị chặn" là chưa đủ — phải là "bị chặn bởi đúng hàng
> rào dựng cho việc này".

Cách làm rẻ nhất: bài kiểm khẳng định luôn **nội dung câu từ chối**, không
chỉ khẳng định có ném. Khẳng định câu chữ thì hàng rào đổi là bài kiểm đỏ.

### Và một luật nữa, từ lần thứ tư của cùng một kiểu lỗi

Nhánh `cổng bỏ qua` của các bạn nêu ba lần "xanh vì một lý do không liên
quan đến thứ nó định kiểm". Xin bổ sung lần thứ tư, của chúng tôi:

Vòng 26, bản gói một trang không có cửa đăng nhập, vì `dung-goi.js` gõ cứng
danh sách thư viện và thiếu mất một file. Bài kiểm gác nó, `goi-du-trang.js`,
**gõ cứng đúng cùng danh sách ấy**. Nên nó xanh — nó xanh vì nó **đồng ý với
lỗi**.

> Bài kiểm không được lấy dữ kiện từ cùng nguồn với thứ nó kiểm. Cùng danh
> sách, cùng đường dẫn, cùng phép đếm file — đều là cùng một nguồn.

Bốn lần rồi. Hai luật trên, nếu cả hai đội cùng giữ, đóng được cả bốn.

---

## 2 · Chúng tôi lấy một thứ từ phân quyền của các bạn

Phần quản trị của CRM làm tốt hơn Portal ở một điểm, và chúng tôi đã áp vào.

Chỗ đáng học không phải bảng quyền — hai bên tách nhiệm vụ đều kỹ. Nó là
**`REGION_THRESHOLD`**: deal nhỏ được bỏ qua sếp vùng, nhưng cái bỏ qua ấy
là **một con số ai cũng đọc được, sửa được ở tab Phân quyền**. Bỏ qua một
chặng duyệt mà vẫn để lại dấu.

Portal thì không. Đo được trên bản trước:

```
PROPOSAL_FLOW.approve.from = ["submitted", "checked"]

trình đề xuất       → submitted
giám đốc duyệt      → approved
lịch sử:            ["submitted", "approved"]
có dòng nào nói đã bỏ qua bước kế toán kiểm?   KHÔNG
```

Không ngưỡng, không giới hạn số tiền, không một chữ. Người soát sáu tháng
sau **không phân biệt được "kế toán đã kiểm và thấy ổn" với "không ai kiểm"**.

Đã sửa — và cố ý **không chặn**, vì thẩm quyền duyệt thẳng là của giám đốc,
đó là chuyện tổ chức chứ không phải chuyện mã:

- `reviewProposal` đánh dấu `boQuaKiem` lên đề xuất và lên đúng dòng lịch sử
- nhật ký ghi `duyệt thẳng, không qua bước kế toán kiểm`
- thẻ xét duyệt hiện huy hiệu **Không qua kế toán**, dòng lịch sử nói rõ vì sao
- `qc-bat-bien` ghim cả hai chiều, và đã kiểm ngược: bỏ dấu đi thì bài ấy đỏ

Còn **ngưỡng** thì chúng tôi không tự đặt. CRM có `REGION_THRESHOLD = 10000`
vì đó là quyết định vận hành của các bạn. Ngưỡng tương đương bên Portal phải
do giám đốc chốt, không phải do chúng tôi nghĩ ra một con số.

---

## 3 · Thương hiệu chung — tin tốt, và một chỗ lệch

Chúng tôi đo cả hai bảng màu ra HSL. Kết quả gọn hơn dự đoán.

**Màu thương hiệu đã chung rồi.** Không phải "gần giống" — cùng sắc độ:

| | Portal | CRM | lệch |
|---|---|---|---|
| accent | `#0C7287` H190 S84% | `#0A6274` H190 S84% | **0°** |
| ok | `#136E46` H154 S71% | `#10693F` H152 S74% | 2° |
| warn | `#A15F00` H35 | `#855200` H37 | 2° |
| danger | `#C8102E` H350 | `#B31229` H351 | 1° |

Bốn màu mang nghĩa đều trùng sắc độ, chỉ khác độ sáng 3–6 điểm. Tức là hai
bên đã suy từ cùng một gốc thương hiệu và suy đúng.

**Chỗ lệch nằm ở TRỤC XÁM, và nó lệch thật:**

| | Portal | CRM |
|---|---|---|
| nền trang | H217 S25% | H240 S9% |
| mực | H212 S22% | H240 S13% |
| kẻ | H214 S22% | H240 S10% |

Lệch 23–28° sắc độ, và xám của Portal **bão hoà gấp 2–3 lần**. Đặt hai app
cạnh nhau thì mọi màu nhấn khớp nhau, nhưng Portal ám xanh lam rõ còn CRM
gần trung tính. Người dùng không đọc ra "hai thương hiệu" — họ đọc ra **một
thương hiệu bị dựng lệch ở một trong hai app**. Lệch ít khó chịu hơn lệch
nhiều, nhưng nó trông giống lỗi chứ không giống chủ ý.

### Đề nghị: Portal đi theo CRM, không phải gặp nhau ở giữa

Nói thẳng là các bạn đúng, và các bạn đã ghi rõ lý do trong mã:

> *"Bản CRM đã trôi sang H=217 S=25 — tức lệch 28° về phía ice và bão hoà
> gấp ba. Đó là lý do 3-4% màu hiện có không đọc ra là màu: màu lạnh duy
> nhất của thương hiệu đang đứng trên một nền cùng họ với nó. Kéo về 240 để
> ice cách nền đúng 50°."*

**H=217 S=25% đúng là trục xám Portal đang dùng hôm nay.** Các bạn đã chẩn
đúng một bệnh mà Portal vẫn còn mang: accent teal H190 đứng trên nền H217 —
cách nhau 27°, cùng họ lạnh. Kéo nền về H240 thì khoảng cách thành 50° và
màu nhấn mới đọc ra là màu.

Chúng tôi **chưa đổi** — đổi trục xám là đổi mọi mặt của 47 trang, phải chạy
lại toàn bộ đo tương phản, và là quyết định của chủ dự án chứ không phải
việc gài vào một vòng sửa lỗi. Nhưng chúng tôi đề nghị làm, và đề nghị lấy
số của các bạn.

### Bốn việc để hai app thành một sản phẩm

1. **Một file token chung**, cả hai cùng nạp — `haustek-tokens.css`. Hiện
   mỗi bên tự khai một bảng; trùng nhau là do cùng suy đúng, không phải do
   cùng đọc một nguồn. Cái gì trùng nhau bằng kỷ luật thì sớm muộn sẽ lệch.

2. **Thống nhất TÊN token, không chỉ giá trị.** Đang lệch:
   `--paper` ↔ `--card`, `--muted` ↔ `--faint`, `--head` của CRM là **dải
   tối** còn `--head` của Portal là **dải sáng** — cùng tên, ngược nghĩa.
   Chỗ ấy phải sửa trước khi có file chung, không thì file chung sinh lỗi.

3. **Chốt một sắc độ cho dải điều hướng.** Portal `--chrome #0E1A24`
   (H207 S44%), CRM `--head #24242E` (H240 S12%). Đây là mảng màu lớn nhất
   và cố định nhất trên màn hình — nó quyết định cảm giác "cùng một app"
   nhiều hơn mọi thứ khác.

4. **Gửi các bạn bài kiểm tương phản của chúng tôi.**
   `portal/test/v2-tuong-phan.js` — nó đo màu **trên trang đã render**, ở cả
   hai chế độ, rồi tính theo WCAG. Không đọc bảng biến, vì biến đúng mà
   thành phần dùng nhầm cặp thì vẫn hỏng.

   Đúng vòng này nó vừa bắt được của chúng tôi 45 chỗ dưới chuẩn — hoá ra là
   **một lỗi lặp 45 lần**: nút Đăng xuất mặc mực của trang (`--ink-2`) trong
   khi nó nằm trên mặt chrome. Biến đúng, cặp sai, và chỉ hỏng ở chế độ sáng.

   Bảng màu chung chỉ là chung khi **cả hai bên chứng minh được**. Một file
   token không chứng minh gì; một phép đo trên trang thật thì có.
