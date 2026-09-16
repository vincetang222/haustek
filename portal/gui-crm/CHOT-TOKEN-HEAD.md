# Chốt · `--head` là dải TỐI

Chủ dự án đã quyết: **dải đầu bảng và đầu thẻ là một dải tối, tách hẳn khỏi
thân bảng** — nếp của CRM. Và đã chốt luôn giá trị cụ thể:

```css
/* chế độ sáng */              /* chế độ tối */
--head:       #1D2935;         --head:       #293E51;
--head-line:  #364554;         --head-line:  #425D76;
--on-head:    #F3F5F7;         --on-head:    #ECF0F4;
--head-muted: #A5B2C0;         --head-muted: #A3B2C2;
```

**Dựng trong hệ màu H210 của chính Portal, không mượn H240 của CRM.** Chúng
tôi có cân nhắc đưa các bạn thẳng `#24242E` của CRM cho khớp ngay, nhưng một
dải H240 nằm giữa một app H207–217 sẽ đọc ra là lệch chứ không ra là chung.
Trọng lượng mới là thứ phải khớp, và nó khớp: 14,78:1 so với 15,36:1 của CRM.
Khi trục xám về H240 (mục 7) thì hai bên tự hội tụ nốt phần sắc độ.

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
mực ghim vào dải chứ không mượn mực của trang. Bộ chốt cho Portal, kèm số đo:

```css
/* chế độ sáng — thẻ #FFFFFF */
--head:       #1D2935;   /* ↔ thẻ  14,78:1 */
--head-line:  #364554;   /* kẻ dưới — để --card-line ở đây sẽ thành vạch chói */
--on-head:    #F3F5F7;   /* ↔ dải  13,52:1 */
--head-muted: #A5B2C0;   /* ↔ dải   6,85:1 — chữ 10,5px HOA cần dư ngưỡng */

/* chế độ tối — thẻ #172532 */
--head:       #293E51;   /* ↔ thẻ   1,41:1 */
--head-line:  #425D76;
--on-head:    #ECF0F4;   /* ↔ dải   9,64:1 */
--head-muted: #A3B2C2;   /* ↔ dải   5,10:1 */
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

### Chế độ tối: chúng tôi đã thử đi ĐẬM, và đo ra nó phản tác dụng

Hướng đầu tiên của chủ dự án là "đậm hơn nhạt" — áp cho cả hai chế độ. Chúng
tôi dựng thử năm phương án ở chế độ tối trên thẻ `#172532` rồi mới kết luận:

```
                                         ↔ thẻ    ↔ nền trang
E  #121C26   đậm hơn thẻ, chưa đen       1,10:1      1,08:1
F  #0B141B   đúng bằng nền trang         1,19:1      1,00:1
G  #0E171F   đậm hơn cả nền trang        1,16:1      1,03:1
H  #21323F   đang dùng (sáng hơn thẻ)    1,18:1      1,41:1
I  #293E51   ĐÃ CHỐT (sáng hơn nữa)      1,41:1      1,68:1
```

Ba phương án đi đậm **làm dải mờ đi**, không rõ lên. Lý do là trần vật lý:
thẻ `#172532` đã sát sàn, nên ngay cả đen tuyền `#000000` cũng chỉ cho
**1,35:1** so với thẻ. Muốn đạt 3:1 theo hướng đậm thì cần độ sáng **âm** —
không tồn tại. Và tệ hơn con số: dải càng đậm thì càng giống **nền trang**
(E còn 1,08:1 với nền trang), nên mắt đọc nó thành một lỗ thủng xuyên qua
thẻ chứ không phải một dải tiêu đề.

`#293E51` cho **1,41:1** — tách rõ nhất trong cả năm, và tách khỏi cả thẻ
lẫn nền trang. Nó cũng là thứ gần nhất với nếp CRM tối đang dùng (1,33:1).

Nói gọn: cái ta thật sự muốn không phải "đậm", mà là "tách khỏi thẻ". Ở nền
sáng thì tách = đậm xuống; ở nền tối thì tách = sáng lên. Cùng một nếp, chiều
đảo theo chế độ.

**Ảnh dựng thật kèm theo:** `chon-head.png` (nguồn: `chon-head.html`, mở
thẳng bằng trình duyệt). Chín phương án dựng thành bảng thật trên đúng nền
của hai chế độ. Ở hàng dưới nhìn là thấy ngay E/F/G gần như không còn dải.

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

1. `--head` = dải tối, nếp CRM. **Đã chốt**, và chốt luôn giá trị:
   sáng `#1D2935` · tối `#293E51`, dựng ở hệ màu H210 của Portal.
2. Lấy **cả bộ bốn**, không lấy mỗi `--head` — nếu không là 1,06:1.
3. Chỉ chế độ **sáng** đổi hướng. Chế độ tối giữ "dải sáng hơn thẻ" — đã
   thử ba phương án đi đậm và đo ra chúng làm dải MỜ ĐI (1,10–1,19:1 so với
   1,41:1), vì thẻ đã sát sàn: đen tuyền cũng chỉ được 1,35:1.
4. Năm selector · 115 bảng trên 41 trang, 9 đầu thẻ, 4 bảng ma trận.
5. `--card` và `--muted` thắng hai tên còn lại — đổi tên, không đổi mặt.
6. Trục xám để lượt sau.
