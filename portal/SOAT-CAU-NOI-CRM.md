# Soát nhánh `crm-cau-noi-v2` · bước 1

Soát trên commit `6207602`, dựng từ `829907e`. Mọi kết luận dưới đây đều
chạy thật trên nhánh của các bạn, không đọc chay.

**Kết luận: thông qua bước 1, sau khi sửa bốn chỗ.** Kiến trúc đúng như đã
chốt, và có một chỗ các bạn làm tốt hơn bản đặc tả.

**Bốn chỗ ấy chúng tôi đã sửa và kiểm sẵn**, để các bạn khỏi phải gõ lại:
`portal/gui-crm/va-buoc-1.patch`, áp một lệnh. Chúng tôi không đẩy lên nhánh
của các bạn — nhánh ấy là của các bạn. Mỗi bài kiểm mới đều đã kiểm ngược:
trả bản sửa về như cũ thì đúng bài ấy đỏ, và chỉ bài ấy.

---

## 1 · Những gì đã đúng — có kiểm

| Điều đã chốt | Trên nhánh |
|---|---|
| Deal vào như đề xuất, không mở đường ghi tiền mới | đúng · `tvTrinh` chỉ gọi `proposeContract`, tiền chỉ chạm sổ ở `applyApproved` |
| `khoaCrm` (CRM khai) tách `khoa` (Portal quyết) | đúng · `ganBen` bắt buộc `coDoiTac(khoa)`, `nhanGoi` không bao giờ ghi `khoa` |
| `terms` nguyên văn, quy đổi đúng một chỗ | đúng · quy đổi chỉ nằm trong `tvTrinh` |
| Hai bảng `kieu:"bang"`, không nâng `LUOC_DO_VER` | đúng · `luoc-do` 12 đạt trên nhánh các bạn |
| Không thêm trạng thái vào luồng đề xuất, không dựng vai legal | đúng |
| Không nhận trùng một deal | đúng · `thuongVuDay[dealId]` |

Bộ kiểm của chúng tôi chạy trên nhánh các bạn: `api-guard` 103 · `qc-bat-bien`
15 · `qc-quyen` 14 · `luoc-do` 12 · `aaa` 11 · `ranh-gioi-trang` 7 ·
`tien-ba-lop` 23 · `ma-dinh-danh` 8 · `thuong-vu` 28 — không bộ nào đỏ.
**Trừ một bộ**: `i18n-loi` 211 đạt · 8 hỏng, xem mục 2(d).

**Phân quyền làm khéo hơn chúng tôi dặn.** Chúng tôi khuyên khai từng thành
viên, tránh luật cấp đối tượng. Các bạn khai cả hai — và đó mới đúng, vì
`bocDoiTuong` lấy `QUYEN_HAM[ten + "." + k] || nhom`: luật thành viên thắng,
luật đối tượng làm nền. Kết quả đo được:

```
accounting  đọc: được   · nhận gói: CHẶN   ← kế toán kiểm số, không mang deal vào
sales       đọc: được   · nhận gói: được
mgmt        đọc: được   · nhận gói: được
ops         đọc: CHẶN   · nhận gói: CHẶN
support     đọc: CHẶN   · nhận gói: CHẶN
```

**Chỗ 72 tháng: các bạn làm tốt hơn đặc tả.** Bản đặc tả bảo chặn bằng khoảng
gõ cứng `[6, 60]`. Các bạn đi hỏi chính `contractCalc` rồi so kết quả — nên
ngày lõi đổi trần, chỗ này đi theo, không ai phải nhớ. Đo được:

```
deal 72 tháng → CHẶN: "Thời hạn 72 tháng nằm ngoài khoảng Portal nhận
                       (60 tháng là mức gần nhất)..."
deal 60 tháng → trình được, hợp đồng ghi đúng 60
```

Cảm ơn các bạn tìm ra chỗ này. Nó thuộc nhóm lỗi tệ nhất: hai hệ nói hai con
số về cùng một deal mà không bên nào báo gì.

---

## 2 · Bốn chỗ phải sửa trước bước 2

### (a) `tvPhanTram` đoán đơn vị — CHẶN

```js
return n > 1 ? n / 100 : n;          /* 70 → 0.70 ; 0.7 → 0.7 */
```

Hợp đồng nói **mọi trường đuôi `Pct` là phần trăm**, và chính CRM sinh chúng
bằng `Math.round(adv.artistShare * 1000) / 10` — nên giá trị luôn ra dạng `85`,
không bao giờ `0.85`. Đoán theo độ lớn thì:

```
artistSharePct = 85    → phí Haustek 0.15   ✓ đúng
artistSharePct = 0.85  → phí Haustek 0.15   ✗ gói sai đơn vị ĐI LỌT, y như gói đúng
```

Dòng thứ hai là vấn đề: theo hợp đồng, `0.85` nghĩa là bên cấp quyền nhận
**0,85%** và Haustek giữ 99,15%. Portal đọc thành 85%. **Lệch 100 lần, không
ai báo gì, và con số ấy đi thẳng vào hợp đồng.**

Đây đúng là chỗ CRM đã sửa ở phía mình và ghi lại trong mã nguồn: *"deal tạo
từ form gửi 0,02 còn deal cũ gửi 2 — cùng một trường, hai đơn vị, và portal
không có cách nào phân biệt."* Các bạn đã bỏ công chuẩn hoá về phần trăm; phép
đoán này dựng lại đúng cái mơ hồ vừa dẹp xong, chỉ là dựng ở bên Portal.

Sửa: chia 100 vô điều kiện, và kiểm khoảng theo **đơn vị phần trăm**.

```js
function tvPhanTram(v) {
  const n = Number(v);
  if (!isFinite(n) || !(n > 0 && n < 100)) return null;   /* 0 < pct < 100 */
  return n / 100;
}
```

**Một chỗ chúng tôi nói sai trong bản soát trước, xin đính chính.** Chúng tôi
viết rằng bản cũ ném nhầm `artistSharePct = 1` vì so `1` với `1`, và rằng
"bên nhận 1% là hợp lệ". Đo lại sau khi sửa thì không phải vậy:

```
85     TRÌNH ĐƯỢC · phí 0.15
0.85   CHẶN · Phí 99.2% nằm ngoài khoảng Portal nhận (gần nhất 50%)…
1      CHẶN · Phí 99% nằm ngoài khoảng Portal nhận (gần nhất 50%)…
60     TRÌNH ĐƯỢC · phí 0.40
```

`1` vẫn bị chặn — nhưng **chặn ở đúng chỗ và nói đúng lý do**: bên nhận 1%
nghĩa là Haustek giữ 99%, ngoài khoảng 3–50% lõi nhận. Câu từ chối nêu luôn
mức gần nhất. Đó mới là điều ta muốn; cái sai của bản cũ là đo bằng độ lớn
(`> 1` hay `< 1`) chứ không phải đo bằng thước của lõi.

Gói sai đơn vị khi đó bị từ chối ngay ở cửa thay vì đi lọt — đúng thứ ta muốn
với dữ liệu từ hệ khác.

### (b) Khoản tạm ứng biến mất không ai báo — CHẶN

`tvTrinh` chỉ gọi `proposeContract`, không đụng tới `totalAdvanceUSD`. Đo được:

```
deal có totalAdvanceUSD 16.100 → trình được, hợp đồng 24 tháng
                               → đề xuất tạm ứng sinh ra: 0
```

Khoản 16.100 nằm trong `tv.terms`, không đi đâu cả, và không có dòng nào nói
nó chưa được xử lý. Chính bộ kiểm của các bạn cũng dùng đúng giá trị ấy làm
dữ liệu mẫu (`test/thuong-vu.js:53`).

Bước 3 mới nối chân tạm ứng — hợp lý. Nhưng tới lúc đó, **trình một deal có
tạm ứng phải bị từ chối**, không được im lặng bỏ qua một điều khoản tiền:

```js
if (tvSo(t.totalAdvanceUSD) >= 100)
  throw new Error("Thương vụ có khoản tạm ứng " + fmt.usd0(tvSo(t.totalAdvanceUSD)) +
    " mà bước này chưa nối chân tạm ứng. Trình bây giờ là mất khoản ấy. " +
    "Chờ bước 3, hoặc tách tạm ứng ra một đề xuất riêng ở trang Xét duyệt.");
```

Ngưỡng 100 lấy theo `advanceCalc`, khớp với chỗ bản đặc tả đã nêu.

### (c) CRM sửa deal rồi gửi lại: bản sửa biến mất — CHẶN

Chỗ này chúng tôi tìm thêm khi đọc `tvNhanGoi`, rồi đo lại cho chắc:

```
lần 1 nhận D-GUI-LAI (artistSharePct 70)  → {"them":1,"bo":0}
CRM sửa điều khoản 70% → 80%, gửi LẠI cùng dealId
lần 2 nhận                                 → {"them":0,"bo":1}
điều khoản Portal CÒN GIỮ: 70%
→ Bản sửa bị bỏ IM LẶNG. Portal giữ 70%, CRM tin là đã gửi 80%.
```

`day[d.dealId]` chặn nhận trùng — đúng, và cần. Nhưng nó đang chặn **cả bản
sửa**. Một deal đổi điều khoản là chuyện thường ngày ở CRM, và đây lại đúng
là cái mà cầu nối này sinh ra để tránh: hai hệ, hai con số, không ai báo gì.

Sửa: tách ba đường thay vì một.

```
gói y nguyên          → bỏ qua, như cũ (gửi lại cả lô là chuyện thường)
khác, CHƯA trình      → làm mới, quyết định chưa lên bàn ai
khác, ĐÃ trình/đã bỏ  → ĐÓNG BĂNG điều khoản, ghi một dòng `lech`
```

Đường thứ ba là chỗ đáng bàn. Chúng tôi chọn **không** để gói tới sau đè lên
một deal đã trình: giám đốc đang duyệt trên bản nào thì phải còn nguyên bản
ấy. Nhưng cũng không để nó biến mất — `tv.lech` giữ lại cả bản cũ lẫn bản
CRM vừa gửi, và `nhanGoi` trả về `{ them, capNhat, lech, bo, ids, idLech }`.

**Việc này chỉ xong một nửa ở phía chúng tôi.** Nửa còn lại là CRM phải *đọc*
`lech` và hiện nó lên chính deal đó — không thì chúng tôi chỉ dời chỗ im lặng
từ Portal sang CRM. Xem `HOP-DONG-DU-LIEU-1-1.md` mục 4.

### (d) Tám câu lỗi mới chưa có bản tiếng Anh — CHẶN

Cái này không phải lỗi logic, nhưng nó chặn merge, nên nói sớm hơn muộn.

```
node portal/test/i18n-loi.js   trên nhánh các bạn → 211 đạt · 8 hỏng
```

Lõi ném lỗi bằng tiếng Việt, khung dịch lúc hiện qua `HAUSTEK.i18n.loi`.
`test/i18n-loi.js` đọc mã nguồn, lấy mọi chuỗi `new Error(...)` và đòi mỗi
chuỗi phải dịch ra một câu không còn dấu tiếng Việt. Tám câu của bước 1 chưa
có trong bảng `LOI_EN`.

Bộ kiểm này không nằm trong `thuong-vu.js` nên các bạn không thấy — hợp lý.
Bản vá thêm đủ bản dịch, và thêm một chỗ nữa: `tvNhanGoi` ném cả danh sách
lỗi của một gói trong một câu ghép bằng `" · "`, nên `dichLoi()` nay dịch
**từng vế**:

```
VI: Gói không mang dấu "haustek-crm" · Deal thứ 1 thiếu mã deal
EN: The payload does not carry the "haustek-crm" marker · Deal 1 has no deal id
```

---

## 3 · Ghi nhận, không chặn

- `tvTrinh` gọi `contractCalc` rồi `proposeContract` lại gọi `contractCalc`
  lần nữa. Vô hại, chỉ là tính hai lần.
- `MA_DINH_DANH.thuongVu` thêm vào mà không có mục `MA_DOC` tương ứng.
  `ma-dinh-danh` vẫn xanh nên hiện không sao; để ý nếu sau này cần đọc ngược
  mã `TV-`.
- `tvKiemGoi` cố ý không ném để người dán thấy hết lỗi một lượt — đúng, nhưng
  `tvNhanGoi` lại nối các lỗi bằng `" · "` rồi ném. Trang ở bước 2 nên gọi
  `kiemGoi` trước và hiện danh sách, đừng để người đọc một chuỗi dài.

---

## 4 · Chuyện lớn hơn bước 1: `main` và nhánh này là hai sản phẩm khác nhau

Đây mới là thứ cần quyết trước khi làm tiếp, và nó không phải lỗi của ai.

Chúng tôi xin đính chính một câu đã nói với chủ dự án: *"trong repo không có
ứng dụng CRM."* Câu ấy đúng vào lúc kiểm, khi `main` còn ở `ebae9e6`. `main`
đã đi tiếp từ đó — giờ có `crm/` đầy đủ. Xin lỗi vì thông tin cũ.

`main` hiện mang:

```
crm/                      ứng dụng CRM + 5 bộ kiểm
portal/                   PORTAL BẢN 1 — lõi 1.842 dòng
portal/screens/crm-handoff.js
.github/workflows/test.yml
```

Nhánh `claude/haustek-intranet-dashboard-ncm1yv` mang:

```
portal/haustek-core.js    lõi 9.205 dòng
portal/v2/                28 trang nội bộ + 20 trang đối tác
portal/test/              26 bộ kiểm
```

`portal/haustek-core.js` có trên **cả hai**, và hai file ấy không chung gì
ngoài cái tên. Bản 1 là bản chúng tôi thay ở vòng 11 và gỡ ở vòng 22; mọi thứ
từ vòng 11 tới 27 — hai cổng, ma trận quyền, chuỗi chia ba lớp, tác quyền,
ví và rút tiền, trang đăng nhập — đều chỉ có trên nhánh.

Nên câu hỏi không phải "xử lý bản v1 thế nào". Là: **`main` và nhánh không
thể cùng đúng.** Hoặc `main` nhận v2 (và v1 + `crm-handoff.js` bị xoá), hoặc
16 vòng làm việc nằm ngoài `main` mãi mãi.

Về `portal/screens/crm-handoff.js`: xin nói công bằng — bản ấy **có** hỏi
người trước khi đè số gốc tạm ứng, và giải thích rõ là THAY THẾ chứ không
cộng dồn. Không im lặng phá. Nhưng nó vẫn ghi thẳng vào sổ, bỏ qua hẳn cửa
duyệt của giám đốc: một người vai `sales` mở màn hình ấy ra là chuyển được
tiền bằng một lần xác nhận. Đó là lý do bước 1 của các bạn đi đường đề xuất,
và đó là đường đúng.

### CI sẽ xanh mà không chạy gì của chúng tôi

`.github/workflows/test.yml` viết tốt và chịu được nhánh thiếu một nửa. Nhưng
bước Portal chạy đúng bốn file:

```
portal/test/upgrade.mjs · smoke.js · flow.js · edge.js
```

Không file nào tồn tại trên nhánh chúng tôi. Và bước dựng máy chủ tĩnh gác
bằng `hashFiles('portal/intranet.html')`, trong khi trang của chúng tôi nằm ở
`portal/v2/intranet.html`.

Nên nếu nhánh này merge vào `main` như hiện nay: CI chạy `api-guard.js` rồi in
*"Nhánh này không có bộ kiểm thử trình duyệt của portal — bỏ qua"*, và **xanh
trong khi 25 trong 26 bộ kiểm của chúng tôi không chạy.** Một cổng xanh mà
không gác gì tệ hơn không có cổng.

Sửa cùng lúc với việc hợp nhất, không phải trước hay sau.

---

## 5 · Đề nghị

1. Áp `portal/gui-crm/va-buoc-1.patch` — cả bốn chỗ ở mục 2, kèm bốn bài
   kiểm. Hoặc gõ lại theo ý mình; mã đều nằm ở trên.
2. **Làm bước 2 đi**, đừng chờ chuyện `main`. Bước 2 là trang, không đụng
   chuỗi tiền, và mỗi bước vẫn đi riêng được như bảng đã chốt.
3. Cân nhắc `them-gioi-han.patch`: Portal công bố khoảng nó nhận
   (6–60 tháng · 50–97% cho bên) để CRM chặn ngay trên form dựng deal, thay
   vì để người bán hứa 72 tháng rồi mới biết. Tuỳ chọn, nhưng nó đóng lại
   chính lỗi các bạn tìm ra, ở phía còn lại.
4. Đọc `HOP-DONG-DU-LIEU-1-1.md` trước khi làm bước 2 — có một việc phải
   chốt trước: **một deal sinh hai đề xuất** (hợp đồng và tạm ứng), nên hình
   dòng dữ liệu đường về phải đổi, và đổi sau khi dựng trang thì tốn hơn.
5. Chuyện `main` để chủ dự án quyết. Nếu chọn hợp nhất, chúng tôi lo phần
   dọn v1 và sửa CI; các bạn giữ `crm/` nguyên vẹn — nó không đụng gì tới
   `portal/v2/`.
