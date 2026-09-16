# CRM và Portal giẫm chân nhau ở đâu — và ranh giới nên nằm ở đâu

Trả lời cho: *"trong repo có các phần liên quan đến CRM… hiện đang bị trùng
lặp chức năng duyệt hợp đồng của CRM và Portal."*

Bạn nhìn đúng. Nhưng chỗ trùng không nằm ở nơi dễ đoán nhất, nên phần đầu tài
liệu này là đo đạc, không phải ý kiến.

---

## 0 · Trước hết: trong repo KHÔNG có ứng dụng CRM

Tôi đã tìm theo tên file và theo nội dung, trên cả ba nhánh. Kết quả: không có
mã nguồn CRM nào trong kho này. CRM chỉ tồn tại dưới dạng một bản công bố
artifact riêng.

Thứ *thật sự* nằm trong repo là **Portal đang mang sẵn các chức năng hình dáng
CRM**. Đó mới là chỗ trùng lặp, và nó nằm ngay trong 28 trang nội bộ:

| Trang Portal | Việc nó làm | CRM cũng làm việc này? |
|---|---|---|
| `xet-duyet` | **tạo** đề xuất hợp đồng (kỳ hạn, phí, độc quyền) và tạm ứng, rồi duyệt ba bước | **có** — toàn bộ pipeline cơ hội của CRM |
| `roi` | tính ROI hợp đồng, kịch bản, ngưỡng rủi ro | **có** — `advCalcResult`, cảnh báo chi phí vốn |
| `tam-ung` | sổ tạm ứng, đặt gốc, thu hồi | một nửa — CRM tính ra số, không giữ sổ |
| `ty-le` | bảng chia label ↔ nghệ sĩ | không |
| `doi-tac` | hồ sơ đối tác, người phụ trách, hạn hợp đồng | **có** — accounts, owner, tier |

Ba dòng đầu là chỗ hai hệ chồng lên nhau. `ty-le` thì không: đó là chuyện chia
tiền *sau khi* đã ký, CRM không có khái niệm ấy.

---

## 1 · Chỗ trùng nặng nhất: Portal tạo được cả một thương vụ

`v2/man/xet-duyet.js` không chỉ *duyệt*. Nó có form **tạo**:

```js
A.proposals.proposeContract(pk, { months, feePct, exclusive, note }, …)
A.proposals.proposeAdvance (pk, { amount, feePct, note }, …)
```

và hai hàm ấy phơi ra toàn cục (`HT.deXuatHopDong`, `HT.deXuatTamUng`) nên
trang nào cũng mở được. Tức là một nhân viên kinh doanh ngồi trong Portal dựng
được trọn vẹn một thương vụ — kỳ hạn, phí, tạm ứng — rồi đẩy qua ba bước duyệt.

Đó đúng là việc mà pipeline của CRM sinh ra để làm, với chuỗi riêng của nó:
A&R trình → sếp country → sếp vùng → đẩy lên portal.

**Một thương vụ đi qua cả hai hệ hiện phải qua 4–5 cửa người**, trong đó ít
nhất ba cửa là "soát lại con số".

---

## 2 · Và không có gì phân biệt được KÝ MỚI với GIA HẠN

Đây là phát hiện quyết định, đo được:

```
đối tác trong hệ                        428
trong đó có BẢN GHI HỢP ĐỒNG              3
hàng đợi "sắp hết hạn" của kinh doanh   138
trong đó có bản ghi hợp đồng thật         2
```

Cả **ba** đề xuất hợp đồng trong dữ liệu mẫu đều ghi `"Gia hạn trước hạn"` ở ô
ghi chú — nhưng **hai trong ba** là cho bên không có hợp đồng nào để mà gia
hạn. Ghi chú là văn xuôi: không lọc được, không đếm được, không định tuyến
được, và người duyệt đọc xong vẫn không biết mình đang ký mới hay định giá lại
một quan hệ đã chạy.

Và `contractEndOf()` **suy ra** ngày hết hạn từ hash mã bên khi không có hợp
đồng thật. Nên 136 trong 138 việc "sắp hết hạn" mà kinh doanh đang nhìn là
ngày do hàm băm sinh ra, không phải ngày trong một hợp đồng.

Ở bản mẫu thì đó là dữ liệu gieo, hợp lý. Nhưng nó nói một điều thật về kiến
trúc: **Portal đang chạy một quy trình gia hạn mà bên dưới chưa có hợp đồng
nào.** Hệ thật sự sinh ra hợp đồng là CRM.

---

## 3 · Ranh giới nên nằm ở đâu

Không phải "bỏ một trong hai". Hai hệ làm hai việc khác nhau, chỉ là hiện chưa
ai vạch đường:

| | CRM | Portal |
|---|---|---|
| **Ký mới** một bên chưa từng chạy qua hệ | **chủ** — có chuỗi duyệt ba cấp, có phán đoán thương mại | nhận kết quả |
| **Gia hạn / đổi điều khoản** một bên đang chạy | không biết gì | **chủ** — có 12 kỳ số liệu thật |
| **Kiểm con số** deal dựa trên | ước tính khách khai | **nguồn duy nhất** — `dealRoiTuDoiTac` đọc doanh thu thật |
| **Vận hành sau khi ký** — sổ tỷ lệ, sổ tạm ứng, chi trả | không | **chủ** |

Điểm mấu chốt nằm ở hàng thứ ba. CRM có sẵn một chuỗi cảnh báo tên là
`finGapHigh`: *"Khách khai {a}/tháng nhưng báo cáo 12 tháng chỉ cho thấy {b}"*.
Chuỗi ấy tồn tại vì **CRM không cầm số liệu doanh thu — Portal cầm.** Nên:

> Cửa duyệt của Portal không phải là bản sao cửa duyệt của CRM. Nó là **cửa
> duy nhất có thể đối chiếu giả định của deal với tiền đã về thật.**

Hiểu như thế thì bốn cửa người không còn là trùng lặp — chúng khác việc:
country/vùng phán đoán thương mại, kế toán Portal đối chiếu số thật, giám đốc
chốt. Cái đang thiếu chỉ là **nhãn**, để không ai làm lại việc người khác đã
làm.

Một ngoại lệ cần biết: với bên **chưa từng chạy qua Haustek**, Portal không có
gì để đối chiếu (`dealRoiTuDoiTac` đòi `coDoiTac`). Với deal ký mới hoàn toàn,
ước tính của CRM là tất cả những gì có. Đừng trình bày nó như đã được Portal
xác nhận.

---

## 4 · Vòng 27 đã làm gì

**Ký mới hay gia hạn giờ là dữ kiện suy ra, không phải văn xuôi.**
`contractCalc` trả thêm ba trường, và nó suy từ chỗ đáng tin nhất — bên đã có
bản ghi hợp đồng hay chưa — chứ không hỏi người gõ:

```
coHopDong   true | false
viec        'gia-han' | 'moi'
hanSuyRa    true khi ngày hết hạn là do hash sinh ra, không phải từ hợp đồng
```

**Thẻ duyệt nói thẳng.** Huy hiệu `Ký mới` / `Gia hạn` nằm cạnh trạng thái. Với
ký mới, thẻ thêm một dòng:

> *Bên này chưa có bản ghi hợp đồng nào trong hệ — đây là ký mới, không phải
> gia hạn. Deal ký mới thuộc quy trình CRM; nếu nó đã qua CRM thì nhận từ CRM
> để giữ lại chuỗi duyệt đã có.*

Chỗ trùng lặp hiện ra **đúng lúc nó xảy ra**, trước mặt người sắp bấm duyệt —
không chặn ai, không bắt ai khai thêm gì.

**Ngày hết hạn suy diễn thôi giả vờ là dữ kiện.** Khi `hanSuyRa`, ô ngày ghi
*"ngày suy ra, chưa có hợp đồng"* và **không** tô đỏ "sắp hết hạn" nữa. Không
tô đỏ một ngày mình tự nghĩ ra.

**Cố ý không đụng tới `recommendation`.** 425/428 bên chưa có bản ghi hợp đồng;
đẩy "ký mới" vào danh sách `reasons` là đổi khuyến nghị của gần như mọi đề
xuất trong hệ. Đây là chuyện **phân loại**, không phải chuyện rủi ro.

`test/qc-bat-bien.js` ghim cả ba trường.

---

## 5 · Việc tiếp theo, theo thứ tự

1. **Nhận bàn giao từ CRM** (`BAN-GIAO-CRM.md`, đã chốt phương án). Đây là thứ
   cuối cùng làm cho `state.contracts` có dữ liệu thật — và khi có rồi thì
   `viec`, `hanSuyRa`, hàng đợi gia hạn đều tự đúng, không phải sửa gì thêm.
2. **Deal từ CRM vào ở trạng thái `checked`, không phải `submitted`.** Chuỗi
   country/vùng đã soát rồi; bắt kế toán soát lại từ đầu mới là trùng lặp thật.
   `PROPOSAL_FLOW.approve.from` đã nhận `"checked"` sẵn — không phải đổi luồng.
   *Chưa làm: cần chốt xem kế toán có muốn giữ quyền soát lại không.*
3. **Hàng đợi gia hạn đọc từ hợp đồng thật.** Khi `state.contracts` có số, bỏ
   nhánh suy diễn của `contractEndOf` cho bên đã có hợp đồng, và để `renew`
   chỉ đếm những bên có ngày thật.
4. **Cân nhắc: Portal có nên tạo được đề xuất ký mới nữa không.** Vòng này chỉ
   *cảnh báo*. Chặn hẳn là một quyết định vận hành — nếu đội kinh doanh vẫn ký
   trực tiếp không qua CRM thì chặn là chặn người đang làm đúng việc của họ.
   Cần bạn chốt.

---

## 6 · Ba con số nên nhớ

- **428 → 3** · đối tác so với hợp đồng thật. Portal chưa phải là nơi giữ hợp đồng.
- **138 → 2** · hàng đợi gia hạn so với hợp đồng thật đứng sau nó.
- **4–5** · số cửa người một thương vụ đi qua nếu chạy hết cả hai hệ.
