# Chốt · `--head` là dải TỐI

Chủ dự án đã quyết: **lấy nếp của CRM — dải đầu bảng và đầu thẻ là một dải
tối, tách hẳn khỏi thân bảng.** Portal đi theo.

Note này nói đủ để các bạn làm một lượt, và nói cả chỗ chúng tôi đo ra là
việc này **nhỏ hơn nó nghe**.

---

## 1 · Vì sao đây là chỗ phải chốt trước mọi thứ khác

Các bạn nêu `--head` trong danh sách "tên lệch". Chúng tôi đo lại thì nó
không cùng loại với hai cái kia:

| | `--paper` ↔ `--card` | `--muted` ↔ `--faint` | `--head` |
|---|---|---|---|
| giá trị | `#FFFFFF` ↔ `#FFFFFF` | cùng vai | `#24242E` ↔ `#E2E7EE` |
| loại xung đột | **tên** | **tên** | **nghĩa** |
| đổi tên xong có đổi mặt không | không | không | **có** |

Hai cái đầu là đặt tên khác nhau cho cùng một thứ — đổi tên là xong, không
một pixel nào đổi. `--head` thì hai bên **đang nói ngược nhau**. Một file
token chung mà chưa chốt chỗ này thì mọi đầu cột của một trong hai app lộn
ngược ngay lần nạp đầu tiên.

---

## 2 · Không phải một mã màu — là một bộ bốn

Đây là chỗ dễ hỏng nhất, nên nói trước bằng một con số.

Nếu Portal lấy `--head: #24242E` của CRM mà giữ nguyên `color: var(--ink)`:

```
nền #24242E · mực #1A2129  →  1.06 : 1
```

Chữ biến mất. Chuẩn AA đòi 4,5.

CRM làm được vì `--head` ở đó không đứng một mình — nó đi thành **bộ bốn**,
mực ghim vào dải chứ không mượn mực của trang:

```css
--head:       #24242E;   /* dải */
--head-line:  #3A3A48;   /* kẻ dưới — để --card-line ở đây sẽ thành vạch 10:1 */
--on-head:    #F2F2F6;   /* mực thường trên dải */
--head-muted: #A9A9B6;   /* mực phụ; chữ 10,5px VIẾT HOA cần dư ngưỡng */
```

Đây đúng loại lỗi bài `v2-tuong-phan.js` của các bạn sinh ra để bắt: **biến
đúng, cặp sai**. Lấy một token mà bỏ ba token còn lại là dựng lại đúng cái
lỗi 45 chỗ vừa sửa xong, chỉ khác chỗ.

---

## 3 · Đo hai app, bốn tổ hợp

```
                   thẻ       dải head    tách thẻ↔head    mực trên head    tương phản mực
CRM · sáng       #FFFFFF    #24242E        15,36:1          #F2F2F6          13,76:1
CRM · tối        #1F1F27    #34343F         1,33:1          #F1F1F4          10,90:1
Portal · sáng    #FFFFFF    #E2E7EE         1,24:1          #1A2129          13,06:1
Portal · tối     #172532    #21323F         1,18:1          #E8EEF4          11,28:1
```

### Và đây là chỗ đáng mừng: **chỉ chế độ SÁNG đổi**

Nhìn cột "tách thẻ↔head": chế độ tối thì CRM 1,33 và Portal 1,18 — **hai bên
đã đồng ý sẵn**, cùng hướng (dải sáng hơn thẻ) và cùng độ, lệch 0,15.

Chỗ lệch thật chỉ có một: **chế độ sáng, 15,36 so với 1,24.**

Nên "head tối" không có nghĩa "dải tối ở cả hai chế độ". Nếp của CRM phát
biểu đúng ra là:

> **Dải head luôn tương phản với thẻ — tối hơn ở nền sáng, sáng hơn ở nền
> tối.** Nó là một vạch ghim ngang mỗi bảng, cho mắt một mốc cố định khi
> cuộn.

Chú thích trong mã CRM nói thẳng lý do chọn graphite chứ không gần-đen:
*"để không dựng thêm một vùng 17:1 thứ hai trong tầm mắt suốt tám tiếng."*
Xin giữ cả cái cân nhắc ấy, đừng lấy đen hơn.

---

## 4 · Đúng năm chỗ trong `haustek-theme.css`

Chúng tôi đếm rồi — nhỏ hơn nó nghe:

| dòng | chỗ | mực hiện tại | nên thành |
|---|---|---|---|
| 440 | `.card-h` | *thừa kế* | `--on-head` |
| 600 | `table.t th` | `var(--ink)` | `--on-head` |
| 645 | `table.t tfoot td` | `var(--ink)` | `--on-head` |
| 1008 | `.mx th` | `var(--ink-2)` | `--head-muted` |
| 1141 | `table.mx thead th:first-child` | *thừa kế* | `--on-head` |

Cộng thêm kẻ dưới ở dòng 440 và 600: `--card-line` / `--line-2` → `--head-line`.

**Phạm vi mặt nhìn, đếm trên `portal/v2/man/`:**

```
<table class="t">      115 bảng  ·  41 trang     ← phần lớn công việc
class="card-h"           9 chỗ   ·   7 trang
class="mx"               4 chỗ   ·   1 trang (nap-du-lieu.js)
```

Bảng là phần lớn. Đầu thẻ và bảng ma trận thì ít — nên nếu muốn chia làm hai
lượt, `table.t` đi trước là gọn nhất.

CRM cũng để `.card-h` ăn `--head` (cùng `--head-line` làm kẻ dưới), nên sau
lượt này hai app khớp cả ở đầu thẻ lẫn đầu bảng, không chỉ ở bảng.

---

## 5 · Cổng nghiệm thu

`v2-tuong-phan.js` của chính các bạn. Nó đo trên trang đã render nên nó bắt
được cái bẫy ở mục 2 mà không cần ai nhớ — đúng như nó vừa bắt 45 chỗ nút
Đăng xuất.

Chạy cả bốn tổ hợp trang × chế độ, và chúng tôi đề nghị **thêm một phép ghim
nếp** để lần sau không ai phải đọc lại note này:

```
với mỗi chế độ: tương phản(--card, --head) >= 3:1
```

Ngưỡng 3:1 là ngưỡng WCAG cho ranh giới thành phần, và nó phát biểu đúng
điều đang chốt: dải head phải **tách ra**, không phải một tint của thẻ. Đặt
phép ấy vào là chế độ tối của cả hai app hiện đang **trượt** (1,33 và 1,18)
— và đó là thông tin, không phải lỗi của lượt này: nó cho thấy nếp "dải neo"
mới chỉ có thật ở chế độ sáng, ở cả hai bên.

Chúng tôi nêu ra để các bạn quyết, chứ không tự đặt: **có kéo chế độ tối
theo cùng nếp không?** Nếu có thì đó là một quyết định thiết kế riêng, không
phải hệ quả của chốt này.

---

## 6 · Hai tên còn lại — rẻ, và nên làm cùng lượt

Khác `--head`, hai cái này đổi tên xong không một pixel nào đổi. Đề nghị:

| vai | CRM | Portal | đề nghị | vì sao |
|---|---|---|---|---|
| mặt thẻ | `--paper` | `--card` | **`--card`** | gọi theo vai (thẻ), không theo chất liệu (giấy) — và đi liền với `--card-line` đã có ở cả hai bên |
| mực phụ | `--muted` | `--faint` | **`--muted`** | đã là từ chuẩn trong hệ thiết kế; `--faint` dễ đọc thành "mờ hơn nữa", tức một bậc thứ ba không tồn tại |

Cả hai đều là đồng xu sấp ngửa — giá trị nằm ở chỗ **chọn một**, không ở chỗ
chọn cái nào. Nếu các bạn thấy ngược lại thì cứ lấy tên bên kia, chúng tôi
đổi theo; chỉ xin đừng để mở.

---

## 7 · Còn để mở: trục xám

Đề nghị ở mục 3 note của các bạn — Portal kéo trục xám về H240 của CRM —
**chưa chốt**. Nó lớn hơn hẳn `--head`: đổi mọi mặt nền của 47 trang và phải
chạy lại toàn bộ đo tương phản.

Chúng tôi đồng ý về hướng, và cảm ơn các bạn đã đọc kỹ chú thích trong mã
CRM đến thế. Nhưng nên làm **sau** lượt này, trên một cây đã xanh, chứ không
gộp hai thay đổi màu vào một lượt — hỏng thì không biết tại cái nào.

---

## Tóm tắt

1. `--head` = dải tối, nếp CRM. **Đã chốt.**
2. Lấy **cả bộ bốn**, không lấy mỗi `--head` — nếu không là 1,06:1.
3. Chỉ chế độ **sáng** đổi; chế độ tối hai bên đã đồng ý sẵn.
4. Năm selector · 115 bảng trên 41 trang, 9 đầu thẻ, 4 bảng ma trận.
5. `--card` và `--muted` thắng hai tên còn lại — đổi tên, không đổi mặt.
6. Trục xám để lượt sau.
