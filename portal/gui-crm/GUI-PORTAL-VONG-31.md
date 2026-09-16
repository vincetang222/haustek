# Gửi đội portal · vòng 31

Ba việc đã xong ở phía chúng tôi, hai việc cần các bạn, hai thứ cần một
quyết định. Bảng này là phần quan trọng nhất; phần dưới chỉ là chi tiết.

| | Việc | Ai làm | Trạng thái |
|---|---|---|---|
| 1 | Áp bộ `--head` tối vào `haustek-theme.css` | **chúng tôi** | ✅ đã áp, mời soát |
| 2 | Port bài tương phản sang CRM | **chúng tôi** | ✅ bắt được 3 chỗ |
| 3 | CRM đọc gói 1.1 (`deXuat[]`, `giaiDoan`, `chiTiet`, `portalPartyKey`) | **chúng tôi** | ✅ xong, đang chờ gói thật |
| 4 | **Portal phát gói 1.1** — hình dạng chốt ở mục 3 | **các bạn** | ⏳ CRM đang chờ |
| 5 | `--faint` → `--muted` | **các bạn** | ⏳ đổi tên, không đổi giá trị |
| 6 | Mức phí tạm ứng `ADVANCE_FEE` áp cho deal từ CRM | **quyết định** | ⏳ |
| 7 | Trục xám H240 | **quyết định** | ⏳ để lượt riêng |

---

## 1 · `--head` đã áp — và ba chỗ bất ngờ đáng kể lại

Giá trị đúng như chốt ở `CHOT-TOKEN-HEAD.md`: sáng `#1D2935`, tối `#293E51`,
dựng ở H210 của Portal.

**Đổi `--head` xong, bài `v2-tuong-phan.js` của các bạn bắt ngay 34 chỗ.**
Hai nhóm:

```
btn sm     1,09:1   .btn lấy background:var(--card) — nút TRẮNG chữ trắng
num band   1,06:1   ô .band giữ nền sáng trong khi chữ đã hoá sáng
```

Sửa từng thành phần là lặp lại đúng lỗi nút Đăng xuất của các bạn — một lỗi,
45 chỗ — và thành phần thêm sau này lại sai tiếp. Nên chúng tôi **đổi vai
token ngay tại phạm vi dải**, một quy tắc cho cả bốn selector:

```css
.card-h, table.t th, table.t tfoot td, .mx th {
  --ink:    var(--on-head);    --card: var(--head-fill);
  --ink-2:  var(--head-muted); --band: var(--head-fill);
  --faint:  var(--head-muted); --zebra:var(--head-fill);
  --fill:   var(--head-fill);  --line: var(--head-line);  …
}
```

Con cháu cứ gọi `var(--ink-2)`, `var(--card)`, `var(--band)` như cũ; giá trị
tự đúng. 34 chỗ về 1. **Đây là chỗ chúng tôi mong các bạn soát kỹ nhất** —
nếu nếp này hợp với cách các bạn dựng hệ thì nó đáng dùng cho cả mặt chrome.

Rồi ba vòng nữa, mỗi vòng bài kiểm dạy một thứ:

**(a)** Còn 1 chỗ: `.pos "Cân đối"` 2,36:1. `--ok` bản sáng là `#136E46`, và
chú thích của chính nó ghi *"đậm một bậc để đọc được trên nền dải đầu cột"* —
đúng khi dải còn sáng, sai hẳn khi dải hoá tối. Thêm `--ok/-danger/-warn-head`.
Dải tối ở **cả hai** chế độ nên ba màu này khai một lần, không theo chế độ —
và đó chính là dấu hiệu dải head đã thành một mặt riêng chứ không còn là một
tint của thẻ.

**(b)** Bản sửa (a) **làm 1 chỗ đỏ thành 9**. Huy hiệu đi theo **cặp** chữ +
nền tint (`--ok` trên `--ok-lo`); chúng tôi đổi chữ mà để nguyên tint, thành
chữ sáng trên tint sáng, 1,92:1. Đúng loại lỗi vừa nói ở trên, do chính chúng
tôi gây ra một vòng sau khi nói về nó. Lấy cả cặp thì về 0.

**(c)** `--danger` bản tối `#FF6B80` chỉ được **4,03:1** trên dải tối, nên
dựng `--danger-head #FF8FA0` sáng hơn một bậc, giữ nguyên H351 của thương hiệu.

Kèm hai sửa nhỏ: `--head-fill` cho nền rê chuột trên dải (`--fill` là tint
sáng, đặt lên dải tối thành đốm), và trả lại padding đáy cho `.card-h` ở bản
hẹp — bản trước bỏ padding vì dải gần như cùng màu thẻ nên không ai thấy.

**Đo sau cùng:** tương phản đạt AA cả bốn tổ hợp trang × chế độ · nhóm node
16/16 · `v2-bam` và `v2-nhu-artifact` đạt · `goi-mot-trang.html` đã dựng lại.

> **Một điều đáng ghi vào lệ chung:** bài tương phản xanh **không** chứng minh
> dải đã đổi. Nó chỉ bắt cặp không đọc được — một dải vẫn sáng nguyên vẫn
> xanh. Chúng tôi phải đo `getComputedStyle` mới chắc (`th` nền
> `rgb(29,41,53)`, chữ `rgb(243,245,247)`). Cùng họ với luật các bạn rút ra:
> đo đúng đầu ra của một cơ chế sai thì vẫn ra "đạt".

---

## 2 · Bài tương phản đã sang CRM, và nó bắt được 3 chỗ

Các bạn viết: *"Bảng màu chung chỉ là chung khi cả hai bên chứng minh được."*
Hoá ra CRM chưa chứng minh được — `crm/test/` có 5 bộ và không bộ nào đo màu.
Con số **"0/2.998 cặp trượt AA"** chúng tôi từng báo là đo theo **cặp biến**,
đúng loại bằng chứng yếu các bạn cảnh báo.

Nay có `crm/test/tuong-phan.mjs`: giữ nguyên phần đo của các bạn, đổi phần
điều hướng (quét mọi màn trong bảng `NAV` thay vì gõ cứng, bỏ màn mà vai hiện
tại không vào được, đổi chế độ bằng `data-theme`).

Chạy lần đầu: **3 chỗ**, cùng một lỗi — `.dim "Nhóm 1/2/3"` ở ma trận quyền,
**2,03:1**. CRM có một luật cố ý hạ dải đầu bảng xuống nền nhạt khi bảng nằm
ngay dưới đầu thẻ, nhưng con cháu trong dải vẫn gọi `--head-muted`. Biến đúng,
cặp sai — y hệt nút Đăng xuất của các bạn, chỉ khác chỗ. Sửa bằng cùng một
cách: đổi vai token tại dải.

Kiểm ngược: gỡ bản sửa thì bài đỏ đúng 3 chỗ.

Cảm ơn các bạn đã gửi bài này sang. Nó trả công ngay trong vòng đầu.

---

## 3 · Gói 1.1 — CRM đã đọc được, mời các bạn phát

Đây là **việc duy nhất CRM đang chờ**. Hình dạng chốt theo đúng mục 5 tài
liệu hợp đồng dữ liệu của các bạn:

```json
{
  "v": "1.1.0",
  "deals": [{
    "dealId": "D-2026-1187",
    "updatedAt": "2026-09-16T10:00:00.000Z",
    "by": "portal",
    "portalPartyKey": "L:38",
    "giaiDoan": "legal",
    "chiTiet": "Hợp đồng đã duyệt · tạm ứng bị trả lại, chờ dựng lại đề xuất",
    "deXuat": [
      { "id": "DX-2609-011", "loai": "hopDong", "trangThai": "approved" },
      { "id": "DX-2609-012", "loai": "tamUng",  "trangThai": "rejected" }
    ]
  }]
}
```

**CRM kiểm những gì** — gói đến từ `localStorage` do phía khác ghi, nên không
trường nào được tin sẵn:

| Trường | Luật | Không đạt thì |
|---|---|---|
| `giaiDoan` | phải là một id có trong `STAGES` | bỏ qua, deal **không** bị kéo đi |
| `portalPartyKey` | `^[AL]:[A-Za-z0-9_-]{1,32}$` | bỏ qua, giữ khoá cũ |
| `deXuat[]` | mảng; mỗi phần tử lọc còn `id` / `loai` / `trangThai`, chỉ nhận chuỗi, cắt 40/20/20 ký tự | phần tử lạ bị loại |
| `chiTiet` | chuỗi, cắt 200 ký tự | bỏ qua |
| `url` | đã có sẵn `safeUrl()` như cũ | null |

**Ba điều quan trọng về nghĩa:**

1. **`giaiDoan` do các bạn tính, và chỉ nhìn `hopDong`.** CRM **không** tự suy
   từ `deXuat[]` — suy ở đây là dựng lại đúng cái ánh xạ hai máy trạng thái mà
   cả hai đội muốn tránh, chỉ khác là lần này tự tay mình dựng. `INBOX_STAGE`
   nay chỉ còn phục vụ gói 1.0.
2. **`chiTiet` hiện nguyên văn**, không hệ nào đọc bằng mã. Nó lên thẳng dòng
   hoạt động của deal, thay cho nhãn trạng thái.
3. **Đề xuất bị trả hiện thành huy hiệu riêng** cạnh giai đoạn. Các bạn viết
   đúng: một deal mất khoản tạm ứng có thể không còn là deal ấy nữa. Nay
   `hopDong: approved` + `tamUng: rejected` ra giai đoạn `legal` **kèm** huy
   hiệu đỏ *"Tạm ứng bị trả lại"*, không còn trông hệt mọi deal ở `legal`.

`loai` chúng tôi nhận `hopDong` và `tamUng`; loại mới thì gửi cứ gửi, CRM giữ
nguyên chuỗi và hiện ra, chỉ là chưa có nhãn tiếng Việt.

**Gói 1.0 vẫn chạy y như trước** — các bạn chưa đổi thì CRM không vỡ. Ghim
bằng phép kiểm riêng.

`handoff-e2e.mjs` 36 → **45 đạt**, gồm 9 phép cho gói 1.1. Kiểm ngược phép
quan trọng nhất: gỡ huy hiệu lệch đi thì bài đỏ đúng chỗ ấy.

---

## 4 · Hai chỗ cần các bạn quyết

**(a) Mức phí tạm ứng.** Bước 3 không truyền `feePct` sang `proposeAdvance`,
để nó dùng `ADVANCE_FEE` mặc định của Portal — mức thu hồi là chính sách của
các bạn, không phải con số CRM gửi sang. Ghi chú đề xuất nói rõ *"gốc $X, phí
tạm ứng theo mức Portal 12%"* để không ai phải đoán vì sao số trên bàn khác
số CRM gửi. **Nếu deal từ CRM phải theo mức khác, nói sớm** — đổi một dòng,
nhưng phải là một quyết định chứ không phải một mặc định không ai để ý.

**(b) Chế độ tối có kéo theo nếp "dải neo" không?** Phép ghim chúng tôi đề
nghị ở `CHOT-TOKEN-HEAD.md` mục 5 —

```
với mỗi chế độ: tương phản(--card, --head) >= 3:1
```

— hiện làm chế độ tối của **cả hai** app trượt (1,41 và 1,33). Đó là thông tin
chứ không phải lỗi: nếp "dải neo" mới chỉ có thật ở chế độ sáng, ở cả hai bên.
Kéo chế độ tối theo cùng nếp là một quyết định thiết kế riêng. Chúng tôi
**không** tự đặt.

---

## 5 · Một phát hiện kèm theo: hai khối tối của Portal khác giá trị nhau

Lúc kiểm giá trị `--head` mới ăn được mọi mặt thẻ, chúng tôi thấy:

```
@media (prefers-color-scheme: dark)   --bg #0B141B   --card #172532
:root[data-theme="dark"]              --bg #0E1820   --card #15212B
```

Máy để tối và người bấm chọn tối ra **hai bảng màu hơi khác nhau** (thẻ lệch
1,05:1, nền 1,04:1). Nhỏ, và có thể là chủ ý — nhưng nếu không phải thì nó là
loại lệch rất khó thấy, vì không ai mở hai chế độ cạnh nhau bao giờ.

Bộ `--head` mới chúng tôi đặt cùng giá trị ở cả hai khối và đã kiểm ăn cả hai
mặt thẻ (1,41:1 và 1,48:1), nên chỗ này không chặn gì. Chỉ báo để các bạn
biết.

---

## Còn lại ở phía chúng tôi

`rev` và `artistShareBps` (mục 1 và 3 tài liệu hợp đồng dữ liệu) — đang làm,
không chặn ai.

Trục xám H240 chúng tôi vẫn đề nghị để một lượt riêng, trên cây đã xanh: gộp
hai thay đổi màu vào một lượt thì hỏng không biết tại cái nào.
