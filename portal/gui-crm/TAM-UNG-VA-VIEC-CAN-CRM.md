# Tạm ứng: mô hình thật · và toàn bộ việc CRM cần đáp ứng

Chủ dự án hỏi "phí tạm ứng có phải tiền lời không", và mô tả mô hình mình
hiểu. Phần 1 trả lời bằng số đo trên mã. Phần 2 trở đi là danh sách việc
CRM cần làm, gom hết các vòng lại một chỗ.

---

## 1 · Phí tạm ứng KHÔNG phải tiền lời

Tiền lời chạy theo **thời gian**. Phí này thì không:

```js
repayment = amount × (1 + feePct)      // ADVANCE_FEE = 12%
```

Một lần, trên gốc, xong. Ứng 500 triệu thì phải thu hồi **560 triệu** — thu
hồi trong 6 tháng hay 30 tháng cũng đúng 60 triệu ấy, không hơn không kém.

Đo trên dữ liệu thật, cùng một đối tác:

| ứng | phải thu hồi | phí Haustek ăn | số tháng | lợi suất/năm *của riêng phí* |
|---|---|---|---|---|
| 8.000 | 8.960 | 960 | 2,5 | 57,6% |
| 20.000 | 22.400 | 2.400 | 6,3 | 22,9% |
| 60.000 | 67.200 | 7.200 | 18,8 | 7,7% |

Cột cuối mới là chỗ dễ hiểu nhầm. **Phí luôn đúng 12% của gốc**; chỉ *lợi
suất theo năm* đổi, vì cùng 12% ấy trải trên nhiều tháng hơn. Nói cách khác:
đây là **phí trọn gói, không phải lãi suất** — và vì thế **thu hồi càng
nhanh càng lời**, còn deal thu hồi chậm thì Haustek chôn vốn mà vẫn chỉ ăn
đúng 12%.

### Mô hình chủ dự án mô tả — đúng cơ chế, lệch một con số

> *"Doanh thu 100, hợp đồng 70/30, ứng trước 500 triệu. Mỗi lần tiền về split
> 70/30, tôi lấy 30, rồi lấy 70 của khách bù cho đủ đến khi huề vốn."*

Cơ chế **đúng y như mã đang chạy**: thu hồi lấy từ **phần của đối tác**,
không đụng vào 30 của Haustek. Haustek vẫn ăn 30 mỗi kỳ như thường; khoản
ứng được trừ dần vào 70 kia.

Chỉ lệch một chỗ: **"huề vốn" ở mã là 560 triệu, không phải 500 triệu.**

Nếu ý của chủ dự án là thu hồi đúng 500 rồi thôi — tức Haustek kiếm tiền
bằng 30% hợp đồng, còn khoản ứng chỉ là ứng trước không tính phí — thì phải
đặt `feePct = 0`. Mã nhận số 0 bình thường. **Đây là quyết định kinh doanh,
không phải lỗi**, nhưng hiện hệ đang mặc định 12% mà chưa ai chốt.

### Một chỗ tinh hơn, cần CRM biết khi dựng deal

Thu hồi lấy từ `earnedByParty` — **phần bên ấy thật sự được hưởng**, không
phải toàn bộ 70.

Với **nghệ sĩ độc lập** thì hai cái là một. Với **label**, 70 còn phải chia
tiếp cho nghệ sĩ của label; mã chỉ thu hồi từ phần **label giữ lại**, trừ khi
label ký `labelTuTra` (tự trả nghệ sĩ, nên nhận trọn 70).

Nghĩa là: **cùng một khoản ứng, cùng một doanh thu, nhưng label thu hồi chậm
hơn nghệ sĩ độc lập.** Không thu hồi vào tiền của nghệ sĩ là đúng — họ không
vay. Nhưng người dựng deal ở CRM phải biết, không thì hứa 12 tháng hoà vốn
mà thực tế 30 tháng.

---

## 2 · Số giám đốc đã duyệt thì không được đổi — hiện CHƯA đúng

Chủ dự án nêu nguyên tắc này. Đo trên mã:

```
giám đốc duyệt ứng 20.000  →  số phải thu hồi: 22.400
gọi advances.set(ben, 1)   →  số phải thu hồi:      1
→ Số giám đốc đã duyệt bị đè. Không có hàng rào nào.
```

`advances.set()` nằm trong nhóm quyền `tien` (kế toán và giám đốc). Nó có lý
do tồn tại — nhập số dư đầu kỳ khi chuyển từ sổ cũ sang. Nhưng nó không phân
biệt "đặt số dư ban đầu" với "đè lên một khoản giám đốc vừa duyệt".

**Portal sẽ sửa** (không cần CRM làm gì): một khoản sinh ra từ đề xuất đã
duyệt thì `set()` phải từ chối, và muốn đổi thì đi đường đề xuất mới —
để lần đổi nào cũng có người duyệt và có vết.

Ghi ở đây vì nó chạm tới cầu nối: **CRM đừng bao giờ gọi `advances.set()`**,
kể cả khi sau này có quyền. Đường duy nhất là `proposeAdvance`.

---

## 3 · Việc CRM cần đáp ứng — gom hết các vòng

### Đã xong ở phía CRM

| | Việc | Vòng |
|---|---|---|
| ✅ | Đọc gói 1.1 (`deXuat[]`, `giaiDoan`, `chiTiet`, `portalPartyKey`) | 31 |
| ✅ | Port bài kiểm tương phản sang CRM, bắt được 3 chỗ | 31 |
| ✅ | Áp bộ `--head` tối cho Portal | 31 |

### Đang làm

| | Việc | Ghi chú |
|---|---|---|
| ⏳ | `rev` cho mỗi deal | số nguyên tăng dần, để phát hiện gói tới trễ |
| ⏳ | `artistShareBps` gửi song song `artistSharePct` | điểm cơ bản, số nguyên: 7000 = 70,00% |

### Cần làm mới — từ vòng này

**(a) Bảng theo dõi thu hồi tạm ứng.** Chủ dự án nói thẳng *"cái này nên có
trong CRM"*, và đúng: A&R là người hứa với đối tác, nên A&R phải thấy lời
hứa ấy đang đi tới đâu. Portal có đủ số; CRM chỉ cần hiện. Mỗi deal cần:

```
gốc đã ứng          500.000.000
phí 12%              60.000.000
phải thu hồi        560.000.000
đã thu hồi          210.000.000   (37,5%)
còn lại             350.000.000
dự kiến hoà vốn     tháng 11/2027  ← theo tốc độ 12 kỳ gần nhất
```

Portal sẽ bổ sung mấy số này vào gói 1.1 (bản 1.2) — **chưa có trong bản
1.1 hiện tại**, nên đừng dựng màn hình rồi chờ dữ liệu. Ta chốt hình dạng
trước, rồi cả hai cùng làm.

**(b) Hiện `lech` lên chính deal.** Việc này nêu từ vòng 28 và vẫn chưa thấy.
`nhanGoi` trả `{ them, capNhat, lech, bo, ids, idLech }`. `lech ≥ 1` nghĩa là
**Portal đang giữ bản cũ và giám đốc đang duyệt trên bản cũ đó**. Nếu CRM gửi
xong rồi bỏ qua giá trị trả về thì ta chỉ dời chỗ im lặng từ Portal sang CRM.
Phải hiện lên deal, kèm việc phải làm: *rút đề xuất ở Portal rồi trình lại,
hay giữ bản cũ*.

**(c) Chặn ngay trên form dựng deal.** `them-gioi-han.patch` (vòng 28) vẫn
chưa áp. Nó cho CRM đọc `thuongVu.gioiHan()`:

```
termMonths      6 – 60 tháng
artistSharePct  50 – 97 %
totalAdvanceUSD ngưỡng 100
```

Lỗi 72 tháng chính các bạn tìm ra nằm ở chỗ **người bán đã hứa trước khi
biết trần**. Chặn lúc trình là đúng nhưng đã muộn.

**(d) Ba việc cho luồng ký hợp đồng điện tử** (xem `QUY-TRINH-KY-HOP-DONG.md`):

1. Pháp chế tải bản nháp lên CRM; A&R và quản lý soát.
2. Màn soát bản nháp phải có **một dòng chữ**:
   > *"Điều khoản đã được duyệt ở Portal ngày {ngày}. Bước này soát câu chữ
   > hợp đồng, không soát lại giá."*
   Thấy giá sai thì **trả đề xuất về Portal**, không sửa trong file Word.
   Không có dòng này thì sớm muộn có hợp đồng mang con số khác con số giám
   đốc đã duyệt.
3. Pháp chế đẩy lên phần mềm ký và **lưu mã hồ sơ** (DocuSign / Adobe Sign)
   vào deal. Mã ấy là thứ Portal cần để đóng việc của giám đốc — **chữ ký
   thuộc về phần mềm ký, không phải một ô tick ở hệ nào cả**.

**(e) Một điều tuyệt đối.** Nhắc lại vì nó là lỗi đắt nhất đã gặp: chân tạm
ứng chỉ đi qua `proposals.proposeAdvance`. **Không bao giờ** `advances.set()`
— hàm ấy **gán đè**, còn `applyApproved()` **cộng dồn**.

---

## 4 · Hai câu Portal đang chờ chủ dự án chốt

Ghi ở đây để CRM biết vì sao hai việc dưới chưa chạy:

1. **`feePct` của tạm ứng: 12% hay 0%?** Mục 1 ở trên. Ảnh hưởng thẳng tới
   con số "hoà vốn" mà A&R hứa với đối tác.
2. **`feeOf` đọc `signedAt` hay `approvedAt`?** Hiện Portal coi "giám đốc
   duyệt" là "đã có hợp đồng", và áp mức phí mới **hồi tố** về kỳ trước đó.
   Ở luồng ký điện tử, giữa duyệt và ký có nhiều tuần — và đối tác có thể
   không ký.

Cả hai đều là quyết định kinh doanh. Portal không tự quyết.
