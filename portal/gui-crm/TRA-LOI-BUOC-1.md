# Trả lời bước 1 — đã áp bản vá, và bốn chỗ phải sửa thêm

Cảm ơn hai file `.patch` và tài liệu hợp đồng dữ liệu. Chúng tôi **đã áp
`va-buoc-1.patch`**, nhưng không áp nguyên trạng: kiểm ngược từng lỗi bằng
cách khôi phục mã cũ rồi đo lại, và ba trong bốn lỗi đúng như các bạn khai.
Lỗi thứ tư thì bản vá không sửa được, nên chúng tôi sửa tiếp.

Tất cả số dưới đây là đo được, không phải đọc mã rồi suy.

---

## 1 · Đường dịch câu ghép chưa chạy, và bộ kiểm không thấy nó

Nhánh tách `" · "` mới thêm vào `dichLoi()` nằm **sau** vòng dò `LOI_MAU_EN`,
nên với đúng những câu cần nó thì nó không bao giờ tới lượt: một mẫu đã nuốt
trọn câu ghép trước đó.

Hai kiểu nuốt, cả hai đo được:

```
VI  Deal thứ 1 thiếu mã deal · Deal thứ 2 thiếu mã deal
EN  Deal 1 thiếu mã deal · Deal thứ 2 has no deal id
```

Số `1` của vế đầu bị `/^Deal thứ (.+) thiếu mã deal$/` khớp **xuyên** dấu
phân cách rồi dán vào đuôi tiếng Anh của vế cuối. Câu này đọc như đã dịch —
tệ hơn hẳn một câu còn nguyên tiếng Việt, vì nó trông đúng.

3/8 gói mẫu ra câu kiểu ấy.

**Đảo thứ tự thôi thì hỏng theo chiều ngược lại.** Chúng tôi thử, và
`"Không có quyền: x (vai mgmt · cần ops)"` vỡ ngay: câu ấy mang `" · "` bên
*trong* một lỗi duy nhất, tách ra thì nửa sau vô nghĩa, nửa đầu vẫn khớp mẫu
lỏng nên tưởng dịch được, và câu ra mất hẳn phần `role/needs`.

Cách chúng tôi chốt: **tách trước, nhưng chỉ nhận khi MỌI vế dịch được.**
Câu ghép thật thì vế nào cũng là một lỗi trọn vẹn; câu có `·` bên trong thì
nửa sau không dịch được và nó rơi xuống dò mẫu nguyên câu như cũ. Giữ thêm
một lần tách **sau** vòng dò cho ca ghép lẫn (có vế dịch được, có vế chưa).
Ba mẫu `Deal thứ` / `Gói thuộc phiên bản` siết thành `([^·]+)` để không khớp
xuyên được nữa.

### Chỗ này đáng nói hơn cả bản thân lỗi

`i18n-loi.js` **không hề nhìn thấy** tám câu lỗi của `tvKiemGoi`. Chúng là
`loi.push("…")` chứ không `new Error(…)`, mà bộ trích chỉ đọc `new Error`.
Nên con số *"219 đạt"* trong thư của các bạn không nói gì về tám câu ấy — nó
đúng, nhưng đúng về chuyện khác.

Và bản vá còn vô tình **gỡ nốt câu ghép ra khỏi tầm bộ kiểm**: đổi
`throw new Error(kq.loi.join(" · "))` thành `const cau = …; throw new Error(cau)`
làm rổ câu mẫu tụt từ 216 xuống 215. Hoàn nguyên đúng một dòng ấy thì
`i18n-loi.js` đỏ ngay với `X · X  =>  X · X`.

Đã sửa bộ trích: đọc cả `loi.push(`, nhận cả nháy đơn (câu
`'Gói không mang dấu "haustek-crm"'` bọc nháy đơn vì bên trong có nháy kép —
bộ đọc cũ lấy nhầm phần bên trong làm literal và dựng ra câu mẫu
`Xhaustek-crmX`, một câu không tồn tại). Ba câu ghép có thật được ghim thẳng
vào danh sách mẫu động.

**Kiểm ngược:** bộ kiểm đã sửa chạy trên lõi **chưa** sửa → đỏ đúng 3 chỗ.
Trước đó nó xanh. Đó mới là bằng chứng nó canh được thứ nó nói.

`i18n-loi.js`: 211 → **232 đạt · 0 hỏng**.

---

## 2 · Chốt chặn tạm ứng mới đóng một trong bốn cửa

Bản vá soát `totalAdvanceUSD`. CRM gửi **bảy** trường điều khoản, đề xuất hợp
đồng chỉ mang được **ba** (`months`, `feePct`, `exclusive`). Bốn trường còn
lại không có chỗ nào để đi.

Đo trên lõi đã vá:

```
{ totalAdvanceUSD: 16100 }                              → chặn  ✅
{ initialAdvanceUSD: 14000 }                            → LỌT   ❌
{ initialAdvanceUSD: 14000, marketingFundUSD: 2100,
  totalAdvanceUSD: 0 }                                  → LỌT   ❌
{ marketingFundUSD: 2100 }                              → LỌT   ❌
{ findersFeePct: 5 }                                    → LỌT   ❌
{ totalAdvanceUSD: -5000 }                              → LỌT   ❌
{ totalAdvanceUSD: "nhiều" }                            → LỌT   ❌
{ totalAdvanceUSD: 99 }                                 → LỌT   ❌
```

Dòng thứ ba là chính deal mẫu 16.100 của các bạn: CRM chỉ cần **để trống ô
tổng** là đúng khoản ấy đi lọt câm y như trước khi có chốt chặn. Ba dòng
cuối là `tvSo()` nắn rác và số âm về `0`, nên chốt chặn không thấy gì.

Chúng tôi đảo cách làm: **liệt kê trường CHUYỂN ĐƯỢC rồi chặn phần còn lại**
theo đuôi `USD` / `Pct` — chính quy ước đặt tên trong tài liệu của các bạn.
Trường tiền thêm sau này vì thế **tự bị chặn thay vì tự bị nuốt**. Rác và số
âm bị ném chứ không hiểu thành 0.

Đo lại: **10/10 ca sai bị chặn · 4/4 deal sạch vẫn trình được** (kể cả deal
ghi 0 ở cả bốn ô tiền, và hai mép 97% / 50%).

> **Hệ quả vận hành, xin các bạn cân nhắc chứ đừng để chúng tôi tự quyết:**
> `findersFeePct` trong dữ liệu mẫu của chính các bạn là `[0, 2, 3]`, tức
> 2/3 deal có phí môi giới. Cộng với tạm ứng, **gần như mọi deal thật sẽ
> dừng ở bước 1** cho tới khi bước 3 xong. Chúng tôi vẫn cho là chặn đúng
> hơn nuốt — nhưng đây là một quyết định vận hành, không phải một chi tiết
> kỹ thuật.

---

## 3 · Câu từ chối sai đơn vị đang chỉ sai đường

Đây là chỗ bản vá **không** sửa được lỗi nó khai.

`tvPhanTram(0.85)` trả `0.0085`. Giá trị ấy **lọt** cả gate mới
`!(n > 0 && n < 100)` lẫn gate `phanBen <= 0 || >= 1`. Thứ thật sự chặn nó là
**trần phí 3–50% của `contractCalc`** — một hàng rào dựng vì lý do khác hẳn,
nằm cách chỗ nó được khai một quãng.

Bằng chứng nằm ngay trong câu lỗi: gói 0,85 bị chặn bằng

> *"Phí 99,2% nằm ngoài khoảng Portal nhận (gần nhất 50%). Chốt lại trước
> khi trình."*

ném sau `contractCalc`, **không phải** câu `"Tỷ lệ chia … không hợp lệ"` trên
đường `tvPhanTram`.

Hai hệ quả:

1. Nhân viên đọc câu ấy sẽ đi **đàm phán lại mức phí với đối tác**, trong khi
   lỗi thật là CRM gửi phân số vào chỗ đòi phần trăm. Không một dòng nào ở
   bất kỳ đâu nói *"gói sai đơn vị"*.
2. Ai nới trần phí của `contractCalc` là mọi gói sai đơn vị **lại đi lọt
   câm**, và bộ kiểm hiện tại không đủ sức báo — phép kiểm ở
   `thuong-vu.js:292` chỉ khẳng định `!sai.ok`, không kiểm câu lỗi, nên nó
   vẫn xanh kể cả khi thứ chặn là một hàng rào không liên quan.

Nay chặn đúng chỗ, gọi đúng tên, và mách giá trị cần gửi:

> *"artistSharePct = 0.85 trông như phân số. Trường đuôi Pct phải là phần
> trăm, nên 0.85 nghĩa là bên cấp quyền nhận 0.85%. Nếu ý là 85% thì gửi 85.
> Lệch 100 lần — sửa đơn vị bên CRM rồi gửi lại gói."*

Và phép kiểm nay **kiểm câu lỗi**, không chỉ kiểm có chặn hay không.

> Một đính chính nhỏ: chú thích mới khai *"1 (bên nhận 1%) là hợp lệ"*. Đo
> end-to-end thì `1` **vẫn bị từ chối** (phí 99% ngoài khoảng 3–50%), cả
> trước lẫn sau vá. Chỉ câu lỗi là khá lên.

---

## 4 · Bốn lỗ hai tác tử săn tìm đo được — đã sửa luôn

Ngoài bốn lỗi các bạn nêu, chúng tôi cho hai tác tử đi tìm thứ *không* ai
khai. Bốn chỗ nặng:

### 4.1 Ô nhiễm prototype — lỗi này là của chúng tôi

`kho["__proto__"]` trả về `Object.prototype`, một thứ **truthy**, nên hàng
rào `if (!tv) throw` của `ganBen` / `trinh` / `bo` mở toang.

```
A.thuongVu.bo("__proto__", "phá thử", "ke-la")   → KHÔNG ném
({}).trangThai                                    → "daBo"
A.parties.list().rows[0].trangThai                → "daBo"
A.proposals.list()[0].trangThai                   → "daBo"
```

`constructor`, `toString`, `valueOf`, `hasOwnProperty` cũng vậy. Mọi id khác
(`null`, `0`, `""`, mã không có thật) thì ném đúng — hàng rào **chỉ thủng
đúng ở khoá prototype**. Thêm `tvTra()` tra bằng khoá riêng.

Mã thương vụ sẽ đến từ dữ liệu CRM khi trang bước 2 ra mắt, nên đây không
phải chỗ để tin.

### 4.2 Thương vụ đã bỏ vẫn trình được

Chỉ `"daTrinh"` chặn được, `"daBo"` thì không. Một deal đã cố ý bỏ, có ghi
lý do, chỉ cần một cú bấm Trình là vào thẳng hàng chờ giám đốc — mang theo
`lyDo` treo lại mâu thuẫn với trạng thái mới.

Nặng hơn vì **bài kiểm đang bảo lãnh điều ngược lại**: bài ở
`thuong-vu.js:243` tên là *"Bỏ thương vụ ghi lý do, và không trình được
nữa"* nhưng thân bài chưa bao giờ gọi `trinh()` — nó chỉ đọc `trangThai` và
`lyDo` rồi xanh. Cái tên ấy đang bảo lãnh cho một bảo đảm không tồn tại.

Nay `daBo` là trạng thái kết thúc với cả ba cửa, và bài kiểm mới **gọi
`trinh()` thật**.

### 4.3 `dealId` không phải chuỗi bị `String()` ép về cùng một khoá

Mọi object thành `"[object Object]"`. Đo: hai deal `dealId` là `{crm:1}` và
`{crm:2}`, tên khác nhau → **một** bản ghi ra, deal đầu biến mất không dấu
vết, và kết quả trả về `{them:1, capNhat:1}` trông **y hệt** một lần đồng bộ
lại bình thường. `true` → `"true"`, `123` → `"123"`, `[1,2]` → `"1,2"` cũng
lọt theo đường ấy.

### 4.4 Hai deal cùng mã trong **cùng một gói**

Cơ chế đóng băng + ghi lệch chỉ lo xung đột **giữa** các gói. Trong một gói
thì deal sau rơi vào nhánh *"khác, chưa trình → làm mới"* và ghi đè deal
trước: không lệch, không cờ, không dòng nhật ký nào nêu mâu thuẫn. Đo: ba
deal cùng mã (60 / 70 / 80%) vào, còn lại 80%.

Nay gói tự mâu thuẫn thì bị chặn cả gói.

### Thêm ba chỗ nhỏ hơn

- **`tv.lech` phình vô hạn.** `terms` đã đóng băng nên `truoc`/`sau` không
  bao giờ đổi, mà CRM đồng bộ lại cả bộ mỗi lần nó lưu. Đo 450 lần gửi lại
  cùng một gói → **450 bản ghi giống hệt nhau, 149 KB cho một thương vụ**.
  Nay chặn trùng + trần 20, cùng lối với `audit` (400) và `dangNhap` (300).
- **`tvGiongNhau` nhạy thứ tự khoá.** `JSON.stringify` giữ nguyên thứ tự, nên
  `terms` y hệt chỉ khác thứ tự khoá bị ghi một dòng **lệch oan** với `truoc`
  và `sau` giống hệt nhau. Nay so theo khoá đã sắp.
- **`LUOC_DO` khai sai đúng chỗ chịu lực.** Khai
  `thuongVuDay[dealId] = {luc, boi, maGoi}` trong khi mã ghi `tvId` — mà toàn
  bộ việc chọn một trong ba đường của `nhanGoi` đọc chính trường ấy. Sai này
  có từ HEAD, không do bản vá; nhưng bản vá làm nó chịu lực. Đã khai lại.

---

## 5 · Việc 4 của các bạn — kênh ngược **đã có sẵn**

Các bạn viết *"việc 4 là việc duy nhất chặn bước 2"*. Chúng tôi nghĩ nó
không chặn, vì kênh ấy đã tồn tại và đang chạy:

```js
const INBOX_KEY     = 'haustek.portal.contracts.v1';
const INBOX_VERSION = '1.0.0';
```

CRM đọc chỉ-đọc từ khoá này, kiểm mọi URL bằng `safeUrl()` trước khi tin,
và **không ghi ngược** — đúng nguyên tắc ở mục "Một điều KHÔNG nên làm" của
các bạn. Nên `deXuat[]`, `portalPartyKey`, `chiTiet` không cần kênh mới; ba
trường ấy **đi vào payload của khoá này**.

### Nhưng có một chỗ vỡ thật, và nó đúng là chặn bước 2

CRM ánh xạ trạng thái portal sang giai đoạn CRM bằng một bảng:

```js
const INBOX_STAGE = {
  ceo_rejected:'negotiation', ceo_approved:'legal',
  drafting:'legal', ready:'signature', signed:'won'
};
```

Bảng này giả định **một deal có một trạng thái**. Việc 5 của các bạn — một
deal sinh hai đề xuất, hợp đồng và tạm ứng, hai lần giám đốc bấm, **có thể
một cái duyệt một cái trả** — làm giả định ấy sai hẳn. Deal có
`hopDong: approved` và `tamUng: rejected` thì `INBOX_STAGE` không có ô nào
đúng, và nếu chọn đại một ô thì CRM đẩy deal sang `legal` trong khi khoản
tạm ứng vừa bị trả.

Đây chính là *"hai máy trạng thái ghép vào nhau"* mà mục 6 của các bạn cảnh
báo — và nó đã nằm sẵn trong mã rồi, chứ không phải rủi ro tương lai.

### Đề nghị của chúng tôi

Giữ `INBOX_STAGE` cho **đề xuất hợp đồng** (nó là thứ quyết định deal thắng
hay thua), và đưa phần còn lại sang `chiTiet` — đúng như các bạn đề xuất,
một chuỗi **chỉ để hiện**, không ai ánh xạ:

```js
{
  dealId: "D-2026-1187",
  portalPartyKey: "L:38",
  deXuat: [
    { id: "DX-2609-011", loai: "hopDong", trangThai: "approved" },
    { id: "DX-2609-012", loai: "tamUng",  trangThai: "rejected" }
  ],
  giaiDoan: "legal",                    /* SUY TỪ hopDong, không từ tamUng */
  chiTiet: "Hợp đồng đã duyệt · tạm ứng bị trả lại, chờ dựng lại đề xuất"
}
```

`giaiDoan` do **Portal tính** và nói rõ nó chỉ nhìn `hopDong`. Để CRM tự suy
từ `deXuat[]` là dựng lại đúng cái ánh xạ hai máy trạng thái mà cả hai bên
đều muốn tránh.

`portalPartyKey` trả về thì `ganBen` từ chỗ phải quyết thành chỗ chỉ xác
nhận — chúng tôi đồng ý, và CRM đã có sẵn chỗ lưu (`HANDOFF_BIND`).

---

## 6 · Một thứ phía CRM phải dọn, chúng tôi nhận

Mục 5 tài liệu của các bạn nhắc *"tuyệt đối không `advances.set()`"*. CRM
hiện vẫn **dựng chuỗi ấy cho người vận hành chép tay**:

```js
A.advances.set("L:38", 16100, "CRM D-2026-1187 — ký 2026-09-01")
A.rates.add("L:38", 0.7, "<kỳ hiệu lực>", …)
```

CRM không tự chạy chúng, nhưng nó đang **in ra công thức của chính lỗi đắt
nhất** và mời người vận hành gõ vào. Chúng tôi sẽ gỡ và thay bằng đường đi
qua thương vụ. Việc này thuộc phía chúng tôi.

---

## 7 · Bộ kiểm của các bạn chỉ chạy được trên đúng một máy

Không liên quan bản vá, nhưng chặn mọi thứ khác:

**21/22 bộ kiểm trình duyệt gõ cứng**

```js
executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
```

Đường dẫn ấy có trong container dev của chúng ta, nên các bạn không thấy.
Trên runner CI thì không có — `npx playwright install` đặt trình duyệt ở chỗ
khác với số phiên bản khác. Hai file còn gõ cứng `/home/user/haustek/…`.

Chính `README.md` của các bạn đã khai biến `CHROMIUM` và `BASE`, và
`catalog-ui.js` đã đọc `process.env.CHROMIUM` đúng cách. 21 file còn lại thì
không. Chúng tôi đã sửa cả 21 cho khớp với chính quy ước của các bạn — đổi
đúng một biểu thức mỗi file, đo lại `chromium.launch()` trần chạy được ở đây.

`BASE` thì chúng tôi **để nguyên**: 21 file gõ cứng `http://127.0.0.1:8099`,
mà CI cũng phục vụ đúng địa chỉ ấy nên không hỏng gì. Các bạn tự quyết có
muốn dọn không.

**Kèm theo:** cổng CI trước đây gõ cứng bốn tên file
(`upgrade.mjs`, `smoke.js`, `flow.js`, `edge.js`) — cả bốn đã bị gỡ ở vòng
22. Trên nhánh này CI chạy **0/41** bộ rồi báo **xanh**. Nay loại từng bộ
suy ra từ nội dung file (`module.exports` → phụ trợ; nhắc `playwright` →
cần trình duyệt), nên bộ kiểm mới tự được chạy, không ai phải nhớ.

---

## 8 · Những chỗ chúng tôi **không** sửa, và vì sao

| Chỗ | Vì sao để lại |
|---|---|
| Nhật ký `audit` bị đẩy trôi khi nhận gói lớn | **Có sẵn ở HEAD, không do bản vá.** Một tác tử quy nhầm cho bản vá; tác tử khác đo lại trên cả hai cây và đính chính. Gói 500 deal sinh 1000 dòng, vòng đệm 400 dòng bị quét sạch 2,5 lần — mất dấu vết duyệt kỳ, chốt tỷ giá, nhập nguồn. Cần hạn ngạch riêng cho nhóm `thuongVu.*` hoặc gộp dòng. Là quyết định của lõi, không phải của cầu nối. |
| `localStorage` đầy thì `nhanGoi` báo đạt mà không lưu | `store.save()` trả `false` và không ai đọc — nếp có sẵn của cả lõi. Nhưng đường CRM là đường **duy nhất** mà khối lượng do hệ khác quyết định và không có trần, nên nó biến một nếp cũ thành đường mất dữ liệu câm thật sự. Đo: nhân viên thấy "500 thương vụ mới", tải lại trang là mất sạch. |
| `manCoQuyen()` mặc định **MỞ** cho id trang lạ | `A.quyen.man("thuong-vu")` trả `true` cho **mọi vai**, kể cả `ops` và `support` vốn bị chặn ở cả bảy hàm. Hôm nay vô hại vì chưa có trang. Lúc dựng trang bước 2 mà quên khai vào `MAN_TAT_CA` / `QUYEN_MAN` thì hai vai ấy thấy trang trong khi mọi lời gọi bên trong ném `NO_QUYEN`. |
| `khoaCrm` chưa bao giờ đối chiếu với `khoa` | Chú thích đầu khối quảng cáo hai khoá tách nhau là *"hàng rào còn đứng vững kể cả khi gói bị sửa tay"*, nhưng không dòng mã nào so hai bên. Đo: CRM khai `L:38`, người gắn `L:14` → trình được, không một lời. `accountType: "artist"` gắn vào một label cũng vậy. Đây là **quyết định thiết kế** — cảnh báo hay chặn — nên để các bạn chốt. |
| Không có trần nào cho số deal mỗi gói / tổng thương vụ | Tốc độ không thành vấn đề (đo: gói 5000 deal → 54 ms). Dung lượng thì có, và nó nối thẳng vào chỗ quota ở trên. |

---

## 9 · Trả lời các mục còn lại trong tài liệu hợp đồng

**Mục 1 — `artistShareBps`.** Đồng ý, và chúng tôi làm phía CRM. Nhưng xin
để `Pct` sống song song **lâu hơn một vòng**: chốt chặn sai đơn vị ở mục 3
trên kia chỉ chặt được vì nó biết khoảng hợp lệ của `Pct`. Bỏ `Pct` cùng lúc
với thêm `Bps` là mất hàng rào ngay lúc đổi đơn vị — đúng lúc dễ sai nhất.

**Mục 2 — `them-gioi-han.patch`.** Chúng tôi sẽ áp và gọi lúc dựng form. Ghi
nhận `artistSharePct.min = 50`: CRM đang sinh deal 72 tháng trong dữ liệu
mẫu, tức đã vượt `termMonths.max = 60`. Sẽ chặn ở form thay vì để bước 1 từ
chối.

**Mục 3 — `rev`.** Đồng ý hoàn toàn, và nó còn giải quyết một thứ so nội
dung không làm được: **gói tới trễ không đúng thứ tự**. Hiện chưa có cách
nào phát hiện. Chúng tôi làm phía CRM.

**Mục 6 — `chiTiet`.** Đồng ý, và xin nhấn mạnh phần các bạn viết: *"trả một
câu chữ thì không ai ánh xạ gì"*. Đúng — và như mục 5 trên kia, `INBOX_STAGE`
đang là chỗ ánh xạ ấy, nên nó là chỗ phải sửa trước.

---

## Chúng tôi làm gì tiếp

1. Gỡ `handoffCalls()` khỏi CRM (mục 6) — **ngay**
2. `rev` + `artistShareBps` phía CRM (mục 1, 3)
3. Đọc `lech` và hiện lên deal (việc 2 trong bảng của các bạn)
4. Áp `them-gioi-han.patch` và gọi lúc dựng form (việc 3)

Chờ các bạn chốt hình đường về ở mục 5 trên kia trước khi dựng trang bước 2.
