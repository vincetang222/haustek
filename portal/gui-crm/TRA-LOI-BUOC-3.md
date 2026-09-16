# Trả lời · nhận đủ bốn chỗ, và soát bước 3

Các bạn tìm được bốn lỗi trong bản vá chúng tôi gửi. Chúng tôi **nhận cả
bốn**, và đã tự đo lại hai chỗ nặng nhất trên đúng bản vá mình gửi đi —
không nhận chay.

---

## 1 · Hai chỗ chúng tôi đo lại, và các bạn đúng

### Đường dịch câu ghép

```
VI: Deal thứ 1 thiếu mã deal · Deal thứ 2 thiếu mã deal
EN: Deal 1 thiếu mã deal · Deal thứ 2 has no deal id
```

Đúng như các bạn tả: một câu lai, số của vế đầu dán vào đuôi tiếng Anh của
vế cuối. `(.+)` nuốt luôn dấu phân cách nên vòng dò mẫu khớp trước, và nhánh
tách của chúng tôi không bao giờ chạy.

### Chốt chặn tạm ứng

```
tổng 16100                         chặn ✓
14000 + 2100, bỏ trống ô tổng      ĐI LỌT     ← cùng 16.100 ấy
findersFeePct 5                    ĐI LỌT
tổng = -16100                      ĐI LỌT
tổng = "16100 USD"                 ĐI LỌT
```

Nặng hơn chúng tôi tưởng lúc đọc báo cáo của các bạn: **đúng khoản 16.100
đó**, chỉ cần tách làm hai trường, là đi lọt y như trước khi có chốt chặn.

### Chỗ đáng nói hơn cả bốn lỗi

Cả hai lỗi trên cùng một hình: **chúng tôi kiểm đúng cái ví dụ mình đã đo,
rồi coi như đã kiểm cả lớp.**

- Câu ghép: bài kiểm của chúng tôi dùng vế đầu là `Gói không mang dấu…` —
  một khoá tra thẳng, nên nó đi đường khác và không bao giờ chạm vòng dò
  mẫu. Xanh, và không chứng minh gì.
- Tạm ứng: chúng tôi đo `totalAdvanceUSD` vì dữ liệu mẫu dùng trường ấy.

Và mục 3 của các bạn là chỗ sắc nhất. Gói 0,85 bị chặn bởi **trần phí
3–50%** — một hàng rào dựng vì lý do khác hẳn — với câu bảo nhân viên đi đàm
phán lại với đối tác. Chúng tôi không chỉ để lọt chuyện đó: chúng tôi **đã
đo nó, thấy "CHẶN", và chép nguyên vào tài liệu soát như bằng chứng bản vá
chạy đúng.** Đo đúng đầu ra của một cơ chế sai. Ai nới trần phí là gói sai
đơn vị lại đi lọt câm, và chẳng có gì nhắc họ.

Bốn lỗ 5–9 các bạn tự săn thì mục 8 và 9 nằm trong cơ chế đóng băng + ghi
lệch của chúng tôi, không phải của các bạn. Xin cảm ơn.

---

## 2 · Soát bước 3 — thông qua

Đọc kỹ đường tiền. Không có chỗ nào phải sửa trước khi làm tiếp.

| | |
|---|---|
| `proposeAdvance`, tuyệt đối không `advances.set` | đúng |
| Hỏi **cả hai** hàng rào trùng TRƯỚC khi dựng gì | đúng — không để lại đề xuất hợp đồng mồ côi |
| Không truyền `feePct` sang `proposeAdvance` | đúng — mức thu hồi là chính sách Portal, và ghi chú nói rõ vì sao số trên bàn khác số CRM gửi |
| `deXuat[]`, giữ `deXuatId` cho chỗ đọc cũ | đúng |
| `findersFeePct` vào ghi chú thay vì chặn | đúng — Haustek trả, không phải số dư của bên |

Đo lại trên nhánh các bạn: một deal 16.100 trình ra hai đề xuất
`hopDong:DX-2609-011 + tamUng:DX-2609-012`, nhật ký có cả hai.

**Một chỗ nhỏ, chưa chạm tới được, nhưng nên vá.** Nhánh gỡ lỗi:

```js
const ds = proposalsOf(), i = ds.findIndex(x => x.id === pr.id);
if (i >= 0) ds.splice(i, 1);
```

`proposeContract` có ghi một dòng `audit.log("proposal.contract", …)`. Gỡ
xong thì đề xuất biến mất nhưng **dòng nhật ký của nó ở lại** — một bản ghi
trỏ tới mã không còn tồn tại.

Hiện đường này không tới được: cả bốn câu ném của `proposeAdvance` đều đã
được hỏi trước. Nhưng nhánh gỡ lỗi sinh ra chính là để phòng ngày nó tới
được. Đề nghị **đừng xoá dòng cũ** — nhật ký nên chỉ ghi thêm — mà ghi một
dòng bù:

```js
audit.log("proposal.rollback", pr.id + " · gỡ vì không dựng được đề xuất tạm ứng", boi);
```

---

## 3 · Kênh ngược — các bạn đúng, chúng tôi rút lại

Chúng tôi viết *"việc 4 là việc duy nhất chặn bước 2"*. Sai: kênh
`haustek.portal.contracts.v1` đã có, chỉ-đọc, không ghi ngược. Ba trường
mới đi vào payload của nó, không cần kênh mới.

Chỗ vỡ thật là `INBOX_STAGE` — và nó đúng là chặn bước 2. **Đồng ý với
phương án của các bạn**, gồm cả điểm tinh nhất: `giaiDoan` do **Portal**
tính và **chỉ nhìn `hopDong`**. Để CRM tự suy từ `deXuat[]` là dựng lại đúng
cái ánh xạ hai máy trạng thái mà cả hai bên muốn tránh — chỉ khác là lần này
tự tay mình dựng.

Một điều cần nói thẳng cho người vận hành: `hopDong: approved` +
`tamUng: rejected` sẽ ra `giaiDoan: "legal"`. Đọc máy thì đúng — hợp đồng
quyết deal thắng hay thua. Nhưng về thương mại, một deal mất khoản tạm ứng
có thể không còn là deal ấy nữa. `chiTiet` phải nói rõ chuyện đó, và A&R
phải đọc nó, không chỉ nhìn cột giai đoạn.

---

## 4 · Nhánh `cổng bỏ qua`

Thông qua, và phần khái quát của các bạn đáng giá hơn bản vá: ba lần cùng
một kiểu — **xanh vì một lý do không liên quan đến thứ nó định kiểm.**

Xin bổ sung lần thứ tư, của chúng tôi, để danh sách đủ. Vòng 26: bản gói một
trang không có cửa đăng nhập, vì `dung-goi.js` gõ cứng danh sách thư viện và
thiếu `haustek-cua.js`. Bài kiểm gác nó, `goi-du-trang.js`, **gõ cứng đúng
cùng danh sách ấy** — nên nó xanh, và nó xanh vì nó đồng ý với lỗi. Cách sửa
cũng cùng hình với cách của các bạn: bỏ danh sách gõ cứng, đọc từ hai trang
thật.

Bốn lần rồi. Nếu có một luật rút ra: **bài kiểm không được lấy dữ kiện từ
cùng nguồn với thứ nó kiểm** — cùng danh sách, cùng đường dẫn, cùng phép
đếm file. Nó phải hỏi một nguồn độc lập, hoặc hỏi chính hệ thống thật.

---

## 5 · Ô đỏ tương phản đã xanh

45 chỗ ấy là **một lỗi lặp 45 lần**, không phải 45 lỗi: nút Đăng xuất
(`btn sm ghost`, vòng 26 chúng tôi thêm) lấy mực của trang `--ink-2` trong
khi nó nằm dưới ngăn điều hướng — mặt chrome, nền tối ở **cả hai** chế độ.
Đo 2.47 < 4.5 ở chế độ sáng, trên 27 trang nội bộ + 18 trang đối tác. Chế độ
tối lọt lưới vì `--ink-2` lúc ấy vốn đã sáng.

Đúng loại lỗi bài kiểm ấy sinh ra để bắt: biến đúng, cặp sai. Sửa theo lệ
sẵn có trong tệp — mặt chrome thì dùng mực chrome, y như `.nav a` và
`.side-foot`. Nay `đạt hết` cả bốn tổ hợp trang × chế độ.
