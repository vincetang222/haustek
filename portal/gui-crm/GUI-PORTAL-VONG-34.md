# Gửi đội portal · vòng 34

Chủ dự án hỏi "phí tạm ứng có cần không". Chúng tôi đo lại, và **con số
quyết định trong `advanceCalc` đang sai gần hai lần** — theo hướng làm phí
trông rẻ hơn thực tế. Mục 1 là chỗ đó. Mục 2–4 là việc CRM đã làm xong.
Mục 5 trở đi là việc của các bạn.

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

**Việc của các bạn:** thêm `flowThrough` vào `terms` của `proposeAdvance`
và cho `recoup` tôn trọng nó. Mức bao nhiêu là quyết định kinh doanh —
chúng tôi đề nghị đưa chủ dự án chọn trong khoảng 30–40%.

---

## 4 · 13 deal nằm im, màn hình không nói gì — **đã sửa phía CRM**

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

## 5 · Việc của các bạn, xếp theo thứ tự

| | Việc | Vì sao |
|---|---|---|
| 1 | **Hợp nhất một nhánh portal duy nhất** — đưa `thuongVu` và `phat-goi-1-1.patch` về cùng một cây | Mọi việc dưới đây vô nghĩa cho tới khi xong. Hiện có nhánh CÓ màn hình mà lõi cũ, và nhánh có lõi mới mà không có màn hình. |
| 2 | Dựng màn Thương vụ thật | 13 deal đang chờ một màn hình chưa tồn tại |
| 3 | Sửa `roi` và `roiFee` (mục 1) | Số dùng để định giá đang sai gần 2× và chạy ngược |
| 4 | `flowThrough` vào `terms` và vào `recoup` (mục 3) | Đang có một lời hứa hệ không giữ |
| 5 | `advances.set` từ chối khoản sinh từ đề xuất đã duyệt | Các bạn đã nêu; xin làm sớm |
| 6 | `maxAdvance` trừ dư nợ đang có | Hiện một bên còn nợ vẫn được tính trần như chưa vay |
| 7 | Gói 1.2 cho bảng theo dõi thu hồi | Chi tiết ở mục 6 |

---

## 6 · Gói 1.2 — ba chỗ cần các bạn quyết trước khi dựng

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

## 7 · Hai câu chủ dự án chưa chốt

Ghi lại để các bạn biết vì sao hai việc chưa chạy:

1. **`feePct` 12% hay khác.** Sau khi sửa `roiFee`, con số thật là ~17%/năm
   chứ không phải 8,6%. Chủ dự án đang cân nhắc với dữ kiện mới này.
2. **Mốc bắt đầu áp phí mới.** `feeOf` hiện đọc `fromKey` = kỳ chưa chốt
   đầu tiên, tức hồi tố về trước ngày duyệt. Một điều chúng tôi phải đính
   chính so với cách các bạn mô tả: kỳ **đã chốt** được bảo vệ tuyệt đối —
   đo được 2026-03/04/05 đổi đúng 0 USD sau khi duyệt. Chỗ hồi tố chỉ là
   các kỳ chưa chốt. Nhỏ hơn nó nghe, nhưng vẫn cần một quyết định.

Và một chỗ đáng lưu ý khi chốt câu 2: `feeOf` nằm **trong** `splitRec`, nên
nâng phí của một label là hạ luôn phần của **mọi nghệ sĩ thuộc label ấy** —
những người không ký gì, không ai đề xuất gì cho họ, và không ai hỏi họ.
