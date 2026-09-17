# Gửi đội portal · vòng 34

Chủ dự án hỏi "phí tạm ứng có cần không". Chúng tôi đo lại, và **con số
quyết định trong `advanceCalc` đang sai gần hai lần** — theo hướng làm phí
trông rẻ hơn thực tế. Mục 1 là chỗ đó. Mục 2–5 là việc CRM đã làm xong.
Mục 6 trở đi là việc của các bạn.

---

## 1 · `roiFee` đang báo thiếu 1,96 lần

```js
const roiFee = recoupMonths ? feePct * 12 / Math.max(recoupMonths, 1) : null;
```

Công thức này coi khoản ứng là **vay trả một cục cuối kỳ** — gốc nằm nguyên
suốt kỳ rồi trả một lần. Nhưng chính mã của các bạn thu hồi **trả dần**:

```js
const recoup = cents(Math.min(bal, gross));   // mỗi kỳ vét sạch
```

Dư nợ giảm mỗi kỳ, nên vốn bình quân còn lại chỉ khoảng một nửa gốc. Tính
IRR trên đúng dòng tiền ấy (chi ra `amount` ở t=0, thu về `monthlyNet` mỗi
tháng cho tới khi đủ `repayment`), trên cả 428 đối tác ở đúng `maxAdvance`:

| | `roiFee` hệ báo | IRR thật |
|---|---|---|
| Toàn danh mục (trọng số USD) | 8,64%/năm | **16,95%/năm** |
| Hạng B (n=220) | 8,30% | 16,27% |
| Hạng C (n=207) | 10,05% | 19,75% |

Phân bố IRR: p10 15,1% · trung vị 16,9% · p90 23,7%.

**Hệ quả:** phí 12% không phải "xấp xỉ chi phí vốn" như con số 8,6% gợi ý —
nó là lợi tức thật ~17%/năm. Chúng tôi suýt khuyên chủ dự án bỏ phí dựa
trên con số cũ.

Đề nghị: sửa `roiFee` thành IRR, hoặc ít nhất đổi tên thành
`roiFeeDonGian` và ghi rõ nó giả định trả một cục — đừng để một con số
dùng để định giá mang tên gợi ý rằng nó là lợi suất thật.

### Và `roi` đang chạy ngược ở hai chỗ

```js
const retained = recoupMonths ? cents(Math.min(recoupMonths, 24) * monthlyGross * margin) : 0;
const roi = amount > 0 ? (feeIncome + retained) / amount : 0;
```

**(a) `retained` không phải lợi tức của khoản ứng.** Đó là hoa hồng hợp
đồng Haustek thu **dù có ứng hay không** — `monthlyKeep` đọc từ
`partySeries`, tức dữ liệu lịch sử. Đưa vào `roi` là tính hai lần. Đo:
nếu bỏ `retained` thì `roi` = `feePct` phẳng 0,12 cho mọi ca, dưới sàn
`ROI_RUI_RO.roiSan = 0,20` → **428/428 bị gắn cờ rủi ro**. Tức ngưỡng 0,20
đang được nuôi bằng một khoản thu không liên quan.

**(b) Tăng phí làm deal TRÔNG an toàn hơn.** Đo: ở 12% có 46 khoản "trong
ngưỡng", ở 0% còn **0**. Nhưng phí kéo dài thu hồi 12% (16,0 → 14,3 tháng
khi bỏ phí), tức deal thật sự **rủi ro hơn**. Thước đo rủi ro đang thưởng
đúng cái nó phải phạt.

**(c) Chỉ số phạt việc thu hồi nhanh.** `retained` nhân với
`min(recoupMonths, 24)`, nên thu hồi càng nhanh thì `roi` càng thấp — dù
thu hồi nhanh là điều tốt cho Haustek.

Đề nghị: `roi = feeIncome / amount`, và hiện `retained` thành một dòng
riêng có nhãn *"hoa hồng vẫn thu dù không ứng"*. Rồi đặt lại `roiSan` theo
thang mới — nếu để nguyên 0,20 thì mọi khoản đều đỏ.

### Hai chỗ nữa trong cùng hàm

**`approve` = 0/428 ở MỌI mức phí.** `ADVANCE_THANG` = 18/15/12 tháng,
nhưng dòng đẩy reason dùng ngưỡng 12 tháng, và `approve` chỉ khi `reasons`
rỗng. Nên ở đúng trần hệ tự đề xuất, hệ không bao giờ khuyến nghị duyệt.
Hoặc hạ trần, hoặc nâng ngưỡng reason — nhưng hai con số phải biết nhau.

**Lệch cơ sở một dòng.** `maxAdvance` tính trên `monthlyForward` (đã chỉnh
đà tăng), `recoupMonths` đo trên `monthlyNet` (lịch sử). Cùng một khoản ứng
đo bằng hai thước. Đây mới là nguồn thật của độ tán `roiFee` 6,9–12,6% —
không phải "phí trọn gói định giá ngược với rủi ro" như thoạt nhìn. Chúng
tôi đã thử kết luận ấy và tự bác bỏ: `roiFee ≡ 1,44/recoupMonths` theo định
nghĩa, nên tương quan −0,985 là tam thức, không mang thông tin.

---

## 2 · CRM hứa label hoà vốn 7,1 tháng, portal sẽ ra 23,8 — **đã sửa**

`advModel` của CRM chỉ có hai lớp: `recoup = avg − net`, coi mọi bên đều
nhận trọn phần sau phí. Đúng với nghệ sĩ độc lập và label tự trả. Với label
để Haustek trả nghệ sĩ thì sai hẳn — `splitRec` chia tiếp `net` thành
`artistBase` và `labelCut`, và thu hồi chỉ lấy được từ `labelCut`.

```
gộp 10.000 · chia 70% · tỷ lệ nghệ sĩ của label 70%

CRM cũ    nguồn thu hồi 7.000/tháng  →   7,1 tháng hoà vốn
portal    nguồn thu hồi 2.100/tháng  →  23,8 tháng
```

Gấp **3,33 lần**, và đó là con số A&R hứa trước mặt đối tác.

Đã thêm hai ô vào máy tính advance của CRM ("Bên cấp quyền" và "Tỷ lệ nghệ
sĩ của label") và bài kiểm `crm/test/doi-chieu-so.mjs` mã hoá lại đúng công
thức `splitRec` của các bạn rồi đòi `advModel` ra cùng số.

> **Nhờ các bạn một việc:** khi `splitRec` đổi, bài kiểm ấy sẽ đỏ ở phía
> CRM. Đó là ý đồ — nhưng nghĩa là các bạn cần báo trước một vòng, đừng đổi
> im lặng.

Xin nói thêm cho công bằng: `dealRoiTuDoiTac` của chính portal mắc đúng lỗi
này — nó tính `artistShare = 1 − phi` với `phi = monthlyKeep/monthlyGross`,
tức chỉ trừ phí Haustek, không đụng phần nghệ sĩ của label. Nó đang cầm sẵn
số đúng trong tay (`partySeries` trả cả `keep`) mà không dùng.

---

## 3 · Pass-through là một lời hứa không ai giữ — **CRM đã cảnh báo, portal phải làm**

Cả hai máy tính đều có tham số pass-through: CRM có ô `ac_pass`, portal có
`passThrough` trong `roi.tinh`. Nhưng **sổ cái thu hồi 100%**:

```js
const recoup = cents(Math.min(bal, gross));
```

và gói bàn giao không mang trường ấy (7 trường `terms`, không có
`passThrough`). Nên A&R gõ 30%, thấy thu hồi dài ra, hứa với đối tác — rồi
portal vét sạch. Đối tác nhận **0 đồng suốt trung vị 16 tháng**.

Đây cũng là chỗ Haustek khác thị trường rõ nhất. Mức chia 15% của các bạn
ngang AWAL và ONErpm, rẻ hơn mức 25–30% ngành thường lấy khi có kèm cấp
vốn. Phí 12% trọn gói nằm giữa biên Stem công bố (5–25%). **Giá thì ổn;
điều khoản mới là chỗ khắc nghiệt** — beatBread, Stem, UnitedMasters đều cho
đối tác giữ lại một phần dòng tiền trong kỳ thu hồi.

Phía CRM tạm thời chỉ làm được một việc: ô ấy nay tự khai thẳng rằng portal
chưa tôn trọng số này, và bài kiểm ghim câu cảnh báo để không ai lặng lẽ gỡ.

**Chủ dự án đã chốt: mức flow-through đi theo TỪNG thương vụ, không phải
một tỷ lệ cố định.** Nên đừng dựng một hằng số, kể cả một hằng số cấu hình
được — mức phải đọc từ gói của deal ấy.

Xem tiếp mục 4: chúng tôi đã gửi trường ấy đi rồi, và chốt chặn của các
bạn đang chặn nó (đúng như nó nên làm).

---

## 4 · `flowThroughPct` đã nằm trong gói — và chốt chặn của các bạn đang chặn nó

CRM nay gửi ba trường mới trong `terms`. Chúng tôi đo phản ứng của portal
trước khi gửi, trên đúng `haustek-core.js` của nhánh `crm-cau-noi-v2`:

| trường gửi | `thuongVu.trinh` phản ứng |
|---|---|
| `flowThroughPct: 0` | qua |
| `flowThroughPct: 30` | **chặn** — "Thương vụ mang điều khoản tiền mà bước này chưa nối chân: flowThroughPct 30%" |
| `labelArtistRatePct: 70` | **chặn** — cùng câu ấy |
| `rightsHolder: "label"` | qua (không đuôi `USD`/`Pct` nên chốt chặn tiền không đụng tới) |

**Chặn như vậy là đúng, và chúng tôi gửi trường ấy đi vì nó chặn.** So với
hiện trạng — A&R gõ 30%, gói bỏ trường đi, sổ cái vét 100%, đối tác nhận 0
đồng suốt trung vị 16 tháng — thì một câu báo ngay lúc trình là bước tiến,
không phải bước lùi. Lời hứa vẫn vỡ, nhưng vỡ trước mặt người trình chứ
không vỡ sau lưng đối tác.

Nên **đừng vội thêm `flowThroughPct` vào `TV_CHUYEN_DUOC` để cho nó đi
lọt.** Mở cổng mà `recoup` chưa tôn trọng thì đúng bằng quay lại lời hứa
vỡ trong im lặng, chỉ khác là lần này có một trường trong sổ làm chứng
rằng ai cũng biết. Hai việc phải đi cùng một lượt:

```js
/* 1. cho qua cổng */
const TV_CHUYEN_DUOC = [..., "flowThroughPct", "labelArtistRatePct"];

/* 2. và cùng lượt ấy, sổ cái tôn trọng nó — mức của CHÍNH deal ấy */
const ft = clamp01(tvPhanTram(t.flowThroughPct));       /* 30 → 0,30 */
const recoup = cents(Math.min(bal, gross * (1 - ft)));
```

`ft` phải theo từng khoản ứng, nên nó cần chỗ nằm trong `state.advances[pk]`
(hoặc trong `pr.terms` của đề xuất rồi `applyApproved` chép sang), chứ không
phải một khoá cấu hình chung.

**Một chỗ xin các bạn chặn hộ:** `flowThroughPct = 100` thì `recoup` bằng 0
và khoản ứng **không bao giờ thu hồi xong**. CRM đã tách được hai trạng thái
ấy (trước đây cả hai cùng ra số 0, đọc xuôi thành "thu hồi xong ngay"), và
gói gửi `monthsToRecoup: null` kèm `neverRecoups: true` thay vì để
`JSON.stringify(Infinity)` lặng lẽ thành `null`. Nhưng người gõ số vẫn là
người bên CRM — xin `proposeAdvance` từ chối thẳng mức làm `recoup` về 0,
đừng nhận rồi treo vĩnh viễn.

**Còn `labelArtistRatePct`:** CRM chỉ gửi khi `rightsHolder === "label"`
(tức Haustek trả nghệ sĩ thay label). Lý do đo được: mặc định ô ấy là 70,
mà với nghệ sĩ độc lập và label tự trả thì nó không vào công thức — gửi vô
điều kiện là **chặn đứng mọi deal** bằng một trường vô nghĩa với phần lớn
trong số đó. Nếu các bạn nhận trường này, xin giữ đúng giao ước ấy: vắng
mặt nghĩa là "không áp dụng", không phải "bằng 0".

---

## 5 · 13 deal nằm im, màn hình không nói gì — **đã sửa phía CRM**

Đo trên dữ liệu thật của CRM: **13 deal đang ở phần portal cầm lái, 158.600
USD, 0 deal từng nhận một dòng trạng thái nào về.** Trang Bàn giao không có
một chữ nào về chuyện đó.

Nguyên nhân thì nằm ở phía các bạn, và nó lớn hơn một lỗi giao diện:

- `A.thuongVu` **không tồn tại** trên nhánh của các bạn (đếm: 0 lần trong
  `haustek-core.js`). Module cầu nối chỉ sống trên nhánh `crm-cau-noi-v2`.
- **Không mã nào ghi** `haustek.portal.contracts.v1`. Bộ phát nằm trong
  `phat-goi-1-1.patch` mà chính README ghi "chưa áp".
- Màn Thương vụ chưa có giao diện: 0 mục menu, 0 dòng UI.

Nghĩa là quy trình qua lại **chưa tồn tại đầy đủ ở bất kỳ nhánh nào**.

CRM nay có dải "Đường về từ portal": đang chờ bao nhiêu deal và bao nhiêu
tiền, nhận tin về lần cuối lúc nào, và nếu chưa bao giờ thì nói **chưa bao
giờ** kèm lý do đọc được (thiếu khoá / sai phiên bản / JSON hỏng).

---

## 6 · Việc của các bạn, xếp theo thứ tự

| | Việc | Vì sao |
|---|---|---|
| 1 | **Hợp nhất một nhánh portal duy nhất** — đưa `thuongVu` và `phat-goi-1-1.patch` về cùng một cây | Mọi việc dưới đây vô nghĩa cho tới khi xong. Hiện có nhánh CÓ màn hình mà lõi cũ, và nhánh có lõi mới mà không có màn hình. |
| 2 | Dựng màn Thương vụ thật | 13 deal đang chờ một màn hình chưa tồn tại |
| 3 | Sửa `roi` và `roiFee` (mục 1) | Số dùng để định giá đang sai gần 2× và chạy ngược |
| 4 | `flowThroughPct` vào `TV_CHUYEN_DUOC` **và** vào `recoup`, cùng một lượt (mục 4) | Chủ dự án đã chốt: mức theo từng deal. Trường đã nằm trong gói và đang bị chốt chặn của các bạn chặn — mở cổng mà chưa nối sổ cái là quay lại đúng lời hứa vỡ trong im lặng |
| 5 | `advances.set` từ chối khoản sinh từ đề xuất đã duyệt | Các bạn đã nêu; xin làm sớm |
| 6 | `maxAdvance` trừ dư nợ đang có | Hiện một bên còn nợ vẫn được tính trần như chưa vay |
| 7 | Gói 1.2 cho bảng theo dõi thu hồi | Chi tiết ở mục 7 |

---

## 7 · Gói 1.2 — ba chỗ cần các bạn quyết trước khi dựng

Chúng tôi đo và thấy ba chỗ **không làm được như đề nghị ban đầu**:

**(a) Không tách được gốc và phí trên dữ liệu đang có.** `state.advances`
chỉ lưu `{opening, note, noteEn, byPeriod}`, và `opening` đã là gốc+phí gộp
một số. 175/175 dòng hiện có không mang thông tin phí. Chia `opening/1,12`
là **sai** vì chúng là dòng gieo sẵn, không qua đề xuất.

→ Đề nghị: thêm `goc`/`phiPct`/`phi` vào `state.advances` **khi duyệt đề
xuất** trở đi, và với 175 dòng cũ thì gửi `null` để CRM hiện "—". Đừng
backfill bằng phép chia.

**(b) "Dự kiến hoà vốn" không hiện được một ngày.** Backtest trên 149 bên:
lệch tổng chỉ +2,1% nhưng **sai số theo từng bên trung vị 22,4%, p90
64,6%**. Đúng ở cấp sổ, sai ở cấp một đối tác — mà A&R đọc ở cấp một đối
tác.

→ Đề nghị: hiện **dải** (sớm nhất / dự kiến / muộn nhất), đừng hiện một
tháng.

**(c) Hạn hợp đồng hiện là số bịa từ hash.**

```js
const nam = 2 + ((hash(id, 84) * 3) | 0);   /* hợp đồng 2, 3 hoặc 4 năm */
```

135/135 bên còn dư nợ có hạn suy từ hash, 0 bên có hạn thật. Nên mọi cảnh
báo kiểu "thu hồi vượt hạn hợp đồng" trên dữ liệu mẫu đều vô nghĩa.

→ Đừng đưa `hanHopDong` vào gói 1.2 cho tới khi có `state.contracts[pk].to`
thật. Nếu muốn có cảnh báo ấy thì việc trước là nhập hạn thật.

---

## 8 · Hai câu chủ dự án chưa chốt

Ghi lại để các bạn biết vì sao hai việc chưa chạy:

1. **`feePct` 12% hay khác.** Sau khi sửa `roiFee`, con số thật là ~17%/năm
   chứ không phải 8,6%. Chủ dự án đang cân nhắc với dữ kiện mới này.
2. **Mốc bắt đầu áp phí mới.** Chỗ này chúng tôi đo kỹ lại và thấy nó lớn
   hơn một câu hỏi chính sách: hệ đang không có mốc nào cả, và bản ghi hợp
   đồng mang hai mốc lệch nhau 3 tháng — xem mục 9.

Và một câu **đã chốt**: mức flow-through đi theo **từng thương vụ**, không
phải một tỷ lệ cố định. Chi tiết và phần CRM đã làm nằm ở mục 4.

---

## 9 · "Mốc bắt đầu áp phí" — hiện không phải một mốc nào cả

Chủ dự án hỏi mốc ấy là gì. Đọc mã rồi đo, câu trả lời là: hệ **chưa có**
mốc nào, nó lấy tạm một thứ không ai chọn.

```js
const nextOpen = PERIODS.find(p => !state.approved[p.k]);
const from = nextOpen ? nextOpen.k : PERIODS[P - 1].k;
```

`fromKey` = **kỳ chưa chốt sổ đầu tiên**. Không phải ngày ký, không phải
ngày duyệt, không phải một kỳ hai bên thoả thuận — mà là "kỳ nào tình cờ
còn mở lúc bấm duyệt".

**Đo được, trên dữ liệu mẫu đang chạy** (ASOF 2026-09-17, đã chốt tới
2026-05, còn mở 2026-06 và 2026-07). Duyệt một hợp đồng phí 30% cho A:30:

```json
{"from":"2026-09-01", "fromKey":"2026-06", "to":"2027-08-31", "months":12}
```

Ba chỗ mâu thuẫn trong **một bản ghi**:

1. `from` = 2026-09-01 (thứ người ta đọc là ngày bắt đầu) và `fromKey` =
   2026-06 (thứ `feeOf` thật sự dùng) **cách nhau 3 tháng**. Màn hình nói
   một đằng, tiền chạy một nẻo.
2. `to` = `from` + 12 tháng. Hợp đồng 12 tháng, nhưng thu phí từ 2026-06
   tới 2027-08 là **15 tháng phí**.
3. Không cái nào là ngày duyệt (2026-09-17).

**Và mốc ấy trôi theo việc kế toán chốt sổ nhanh hay chậm.** Cùng một hợp
đồng, cùng một ngày, cùng 30%, cùng một nghệ sĩ — chỉ khác ở chỗ kế toán
đã kịp chốt 2026-06 trước khi giám đốc bấm duyệt hay chưa:

| | `feeFrom` | nghệ sĩ mất |
|---|---|---|
| kế toán chưa chốt 2026-06 | 2026-06 | **543,82 USD** |
| kế toán đã chốt 2026-06 | 2026-07 | **310,83 USD** |

Chênh **232,99 USD**, quyết định bởi lịch làm việc của kế toán, không phải
bởi điều gì hai bên ký.

**Chỗ chúng tôi đính chính cho các bạn:** kỳ **đã chốt** được bảo vệ tuyệt
đối — 10 kỳ từ 2025-08 tới 2026-05 đổi đúng **0,00 USD** sau khi duyệt, và
**0 bên khác** bị đổi tiền. Hồi tố chỉ chạm các kỳ chưa chốt. Nhỏ hơn nó
nghe, nhưng "nhỏ" không phải "đúng".

### Ba chính sách để chủ dự án chọn

| | mốc | trên ví dụ trên | ưu / nhược |
|---|---|---|---|
| **A** | kỳ duyệt (`2026-09`) | nghệ sĩ mất 0 USD ở kỳ cũ | không hồi tố chút nào; nhưng deal duyệt chậm thì Haustek mất phí những tháng đã làm việc |
| **B** | kỳ hai bên ghi trong hợp đồng | tuỳ điều khoản | đúng bản chất thương mại nhất; cần một ô nhập và một chỗ lưu |
| **C** | kỳ chưa chốt đầu tiên (**hiện tại**) | 543,82 hoặc 310,83, tuỳ kế toán | không ai chọn, không ai giải thích được cho đối tác |

Chúng tôi đề nghị **B, với A làm mặc định** khi hợp đồng không ghi gì: mốc
là một điều khoản, nên nó phải nằm trong `pr.terms` và đi qua chuỗi duyệt
như mọi điều khoản khác, chứ không suy ra từ trạng thái sổ sách. Cụ thể:
thêm `feeFromKey` vào `terms` của `proposeContract`, `applyApproved` chép
thẳng sang `fromKey`, và khi vắng thì lấy kỳ của ngày duyệt — **không** lấy
`PERIODS.find(p => !state.approved[p.k])`.

Việc trước mắt, dù chọn chính sách nào: **cho `from` và `fromKey` nói cùng
một chuyện.** Hiện một bản ghi mang hai mốc khác nhau 3 tháng, và người
đọc không có cách nào biết cái nào là thật.

### Và một chỗ nữa, xin cân nhắc trước khi chốt

`feeOf` nằm **trong** `splitRec`. Nên nâng phí của một label là hạ luôn
phần của **mọi nghệ sĩ thuộc label ấy** — những người không ký gì, không ai
đề xuất gì cho họ, và không ai hỏi họ. Hồi tố một điều khoản của A sang
tiền của B là chuyện khác hẳn hồi tố lên chính A; nếu chọn B hay C thì đây
là chỗ cần một quyết định riêng, không đi kèm.
