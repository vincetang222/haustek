# Haustek CRM

Hệ **song song** với portal, không phải một phần của nó. Một file chạy được.

| File | Làm gì |
|---|---|
| `index.html` | Toàn bộ CRM — lead, cơ hội, khách hàng, người liên hệ, việc, nhân sự, duyệt giá, báo cáo, nhật ký, phân quyền, bàn giao portal |
| `HANDOFF.md` | Giao kèo bàn giao sang portal, và những gì nó chưa làm |
| `../portal/SYNC.md` | Hướng dẫn đồng bộ hai chiều, viết cho đội làm portal |
| `test/smoke.mjs` | 74 phép kiểm trên chính CRM |
| `test/handoff-e2e.mjs` | 34 phép kiểm xuyên hai app — cả chuỗi CEO duyệt và chiều ngược |
| `test/finmodel.mjs` | 79 phép kiểm mô hình tài chính, đối chiếu với số tính tay |

## Mô hình tài chính

Gặp khách, nhập điều khoản, ra ngay bảng lời lỗ từng năm. Không hiện công thức —
người ngồi đàm phán cần câu trả lời, không cần biết nó ra từ đâu.

Hiện ở hai chỗ: trong form tạo cơ hội (cập nhật ngay lúc gõ) và trên trang chi
tiết deal.

**Lấy số ở đâu.** Mô hình đọc thẳng các trường form đã có, không bắt nhập lại:

| Trường form | Dùng để |
|---|---|
| `ytIncome` · `audioIncome` · `pubIncome` · `ugcIncome` · `thirdIncome` · `syncIncome` · `neighIncome` · `newRelIncome` | doanh thu từng nguồn |
| `pctYT` · `pctDist` · `pctPub` · `pctUGC` · `pct3rd` · `pctSync` · `pctNeigh` · `pctDistNew` | tỷ lệ chia **riêng của từng nguồn** |
| `advance` · `mktBudget` · `prodFund` · `legalFee` | tiền bỏ ra |
| `recoupRate` | giữ lại bao nhiêu phần của nghệ sĩ để thu hồi |
| `prob` | nhân ra lợi nhuận kỳ vọng |

Mỗi nguồn có tỷ lệ chia riêng và đà riêng: YouTube chia 70/30 còn sync chia
50/50; catalogue trôi xuống còn bản phát hành mới lên đỉnh trong ba tháng rồi
mới trôi; sync và quyền liên quan về theo cục nên giữ phẳng — giữ phẳng là thừa
nhận không biết, còn hơn bịa ra một đường cong.

**Báo cáo 12 tháng của khách.** Dán vào ô trong phần mô hình — chấp mọi kiểu:
dán từ Excel có nhãn tháng và năm, ngăn bằng phẩy, dấu phân nhóm kiểu Anh
(1,200) hay kiểu Việt (1.200). Nhiều dòng thì mỗi dòng lấy số cuối, vì bảng nào
cũng để doanh thu ở cột phải. Từ đó mô hình **đo** đà tăng giảm thay vì dùng giả
định, và nói rõ trên màn hình rằng nó đang đo hay đang đoán.

Lệch trên 15% giữa lời khai của khách và sao kê thì hiện cảnh báo đỏ — đó là
việc phải hỏi lại trước khi trình duyệt, không phải việc làm tròn.

**Cho ra:** hoà vốn tiền mặt tháng thứ mấy · thu hồi xong advance tháng thứ mấy ·
lời lỗ từng năm với luỹ kế · lợi nhuận toàn kỳ · bội số vốn · tỷ suất mỗi năm ·
giá trị quy về hôm nay · lợi nhuận × xác suất · ba kịch bản thận trọng/cơ sở/lạc
quan · **trần advance** theo mức lãi muốn giữ.

**Hai con số vẫn là giả định, chưa phải số của Haustek** — giao diện ghi rõ:

- **Đà trôi −12%/năm** chỉ dùng khi CHƯA dán báo cáo của khách. Dán vào là bỏ.
- **Chi phí vốn 12%/năm** dùng để quy tiền các năm sau về hôm nay.

### Chi phí vốn lấy ở đâu

Nó là **ngưỡng lợi nhuận tối thiểu** — dưới mức đó thì Haustek thà làm việc khác
với số tiền ấy. Câu cần trả lời không phải "lãi suất nào" mà là: *nếu không ứng
số tiền này cho deal, Haustek sẽ làm gì với nó, và việc đó sinh lời bao nhiêu?*

| Tiền ở đâu ra | Lấy con số nào |
|---|---|
| Đi vay để ứng | Lãi vay thật, **sau thuế** — lãi vay được trừ khi tính thuế TNDN |
| Tiền tự có | Việc tốt nhất khác số tiền đó làm được: deal khác, mua catalogue, trả nợ trước hạn |
| Vừa vay vừa tự có | Trộn theo tỷ trọng hai nguồn |

**Lãi gửi ngân hàng là sàn, không phải đáp án.** Gửi ngân hàng gần như không rủi
ro; ứng tiền cho nghệ sĩ thì có thể mất trắng. Lấy lãi tiết kiệm làm ngưỡng thì
mọi deal chỉ cần hơn 5–6% đã thành "đáng làm".

**Bẫy đơn vị tiền.** Mô hình chạy bằng USD. Lãi suất VND đã bao gồm kỳ vọng VND
mất giá — đem nó chiết khấu dòng tiền USD là trừ hai lần, một lần cho tiền tệ và
một lần cho thời gian.

**Đừng tính rủi ro hai lần.** Mô hình đã có kịch bản thận trọng và nhân xác suất.
Nhồi thêm phần bù rủi ro lớn vào chi phí vốn là trừ cùng một rủi ro hai lượt.

### Chưa có con số đó vẫn dùng được

Điểm NPV đổi dấu chính là IRR. Nên chi phí vốn chỉ quyết định khi nó rơi SÁT tỷ
suất của deal. Đo trên ba deal thật:

| Deal | IRR | Chi phí vốn chạy 0% → 30% |
|---|---|---|
| Khoẻ | 56%/năm | dương ở cả 10 mức — kết luận không đổi |
| Biên mỏng | 4%/năm | đổi dấu quanh 4% |
| Dài, tiền về chậm | 6%/năm | đổi dấu quanh 6% |

Vì vậy mô hình ghi thẳng lên màn hình deal chịu được chi phí vốn tới đâu, và chỉ
đòi con số thật khi khoảng cách hẹp tới mức nó thật sự quyết định.

**Khác gì bảng ROI cũ.** Bảng cũ trả lời được một câu: toàn kỳ lời mấy lần. Nó bỏ
qua ba thứ:

1. **Doanh thu phẳng.** Nó nhân doanh thu tháng hiện tại cho đủ 72 tháng.
   Catalogue nhạc trôi xuống, giả định phẳng 6 năm là tự thổi phồng.
2. **Không có giá trị thời gian.** Tiền năm thứ 6 cộng ngang tiền năm nay, nên
   deal 72 tháng luôn trông đẹp hơn deal 24 tháng dù tiền về chậm hơn.
3. **Mâu thuẫn về khoản thu hồi.** Nó tính ra "bao nhiêu tháng thu hồi advance"
   — tức thừa nhận advance quay về từ phần chia của nghệ sĩ — nhưng lúc tính ROI
   lại coi advance như mất hẳn. Cùng một khoản tiền, hai cách đối xử ngược nhau
   trong cùng một bảng.

Mô hình mới chạy theo **từng tháng** rồi mới gộp theo năm, vì thu hồi advance là
sự kiện có thời điểm: tháng nào advance còn dư thì Haustek giữ lại phần của nghệ
sĩ, hết dư thì trả. Chạy thẳng theo năm sẽ làm nhoè đúng cái mốc đó.

Kiểm bằng số tính tay, không kiểm bằng chính nó. Ví dụ trong `test/finmodel.mjs`:
1.000/tháng, nghệ sĩ 70%, ứng 10.000 → giữ 300/tháng, thu hồi 700/tháng → hoà vốn
đúng tháng thứ 10, thu hồi xong tháng 15, tổng về 31.600. Bảng cũ cho 21.600 —
chênh đúng 10.000, đúng bằng advance mà nó quên không tính là đã quay về.

## Hệ màu

Đo trước khi sửa. Ở màn danh sách, **87% diện tích vùng nội dung là trắng thuần**,
nền trang chênh với thẻ đúng **1,16:1**, màu chỉ chiếm 3–4%, và phân cấp gần như
hoàn toàn dựa vào viền 1px. Đó là thứ đọc ra "flat".

Chẩn đoán gốc: bảng xám của CRM đã **trôi 28°** khỏi bảng màu thương hiệu. Cả sáu
xám trong playbook nằm ở H=240 S≤13%; CRM đang ở H=217 S=25 — tức ngả về phía
xanh ice. Màu lạnh duy nhất của thương hiệu đang đứng trên một nền cùng họ với
nó, nên mắt không đọc ra đó là màu. Thêm màu vào lúc đó chỉ làm bệnh nặng hơn.

| Việc | Trước | Sau |
|---|---|---|
| Nền trang ↔ mặt thẻ | 1,16:1 | **1,37:1** |
| Dải tiêu đề bảng | trắng-xám, 1,24:1 | **graphite tối, 15,4:1** |
| Sọc xen kẽ ở bảng thường | *không có* | có |
| Rê chuột dòng chẵn bảng tài chính | *không phản hồi* | có |
| Viền ô nhập | 1,42:1 — trượt WCAG 1.4.11 | **4,27:1** |
| Cặp màu trượt WCAG AA | 14 | **0** / 830 cặp đo |

Vài quyết định đáng ghi lại:

- **Dải tiêu đề bảng đổi thành tối.** Đây là đòn duy nhất thật sự chặt mảng
  trắng. Chọn graphite `#24242E` chứ không gần-đen, để không dựng thêm một vùng
  17:1 thứ hai trong tầm mắt suốt tám tiếng. Ở theme tối nó đảo chiều — sáng hơn
  thẻ — nhưng giữ nguyên nghĩa "đây là nắp, không phải dữ liệu".
- **`--app-bg` tách khỏi `--surface`.** `var(--surface)` dùng 20 chỗ nhưng chỉ
  một chỗ là nền trang; 19 chỗ còn lại là tint bên trong thẻ. Không tách thì
  không thể đẩy nền trang xuống mà không kéo theo mọi hover.
- **`--row-hover` tách khỏi `--zebra`.** Trước đây hover và sọc chẵn dùng chung
  một token, nên rê chuột lên dòng chẵn của bảng dự báo tài chính là không có
  phản hồi nào.
- **`--line-strong` cho viền control.** WCAG 1.4.11 đòi 3:1 cho biên định danh
  một thành phần bấm được; `--line` cũ chỉ 1,42:1 nên mọi ô nhập trong CRM đang
  trượt. Tách token thay vì ép `--line` dày lên — ép nó sẽ đóng khung nặng mọi
  thẻ.
- **Nút chính lấy lại Signal Red thật.** Bản cũ phải làm đỏ sẫm lại để đỡ chữ
  trắng, tức đánh mất chính độ tươi của `#FF2E4C`. Nay là nền đỏ tươi + chữ mực,
  đúng cách playbook dùng nó.
- **Vòng focus chuyển từ đỏ sang teal.** Đỏ đang là màu báo lỗi ở ngay rule kế
  bên — ô đang gõ và ô sai không được cùng màu.
- **Màu biểu đồ: một bộ tám hex chạy đúng ở CẢ HAI theme.** Chúng nằm trong cửa
  sổ độ sáng đạt ≥3:1 với cả nền trắng lẫn thẻ tối, nên không cần một dòng JS
  nào để đổi theo theme — và một giai đoạn không thể đổi danh tính màu khi người
  dùng bật nền tối.
- **21 màu hex cứng của theme sáng** nằm rải rác trong CSS đã chuyển hết sang
  token. Chúng là lý do theme tối chưa bao giờ hoàn chỉnh.

## Vì sao để riêng, không nhét vào `portal/`

Hai hệ khác vòng đời và khác người dùng.

Portal chạy theo **kỳ**: nạp dữ liệu, khớp ISRC, đối chiếu, duyệt kỳ, chi trả.
Nó là sổ sách — đã duyệt thì chốt, không sửa.

CRM chạy theo **deal**: một cơ hội đi từ đàm phán tới ký, mất vài tuần tới vài
tháng, và sửa liên tục suốt đường đi.

Trộn hai thứ đó vào một khung thì mỗi lần đổi CRM lại phải lo có làm vỡ sổ tiền
hay không. Để riêng thì ranh giới rõ: **CRM không giữ đồng nào, portal không giữ
deal nào.**

## Giá trị deal ≠ doanh thu Haustek

`amount` của một deal là **doanh thu catalogue của nghệ sĩ** nhân 12 tháng. Với
tỷ lệ chia 70/30 thì deal 18.000 USD mang về cho Haustek 5.400 USD, không phải
18.000. Đọc con số gộp như doanh thu công ty là sai hơn ba lần.

Báo cáo tách rõ hai thứ này ở thẻ **Doanh thu Haustek so với giá trị deal**, và
nói thẳng còn bao nhiêu deal chưa nhập điều khoản nên chưa tính được.

Cái đi qua ranh giới chỉ là sáu trường của một deal đã ký — đủ để portal dựng
điều khoản thương mại, không hơn. Lead, người liên hệ, hoạt động, nhật ký của
CRM **không** sang portal.

## Chạy

Mở thẳng `index.html` bằng Chrome hoặc Firefox là chạy.

Muốn phần bàn giao sang portal hoạt động thì phải chạy qua một máy chủ tĩnh, và
cả hai app phải **cùng origin** — Chromium coi mỗi `file://` là một origin riêng
nên hai bên sẽ không thấy `localStorage` của nhau:

```bash
npx http-server -p 8099 -c-1 .
# rồi mở http://127.0.0.1:8099/crm/index.html
#      và http://127.0.0.1:8099/portal/intranet.html
```

Trên Vercel thì cả hai nằm cùng tên miền nên tự động cùng origin.

Safari chặn `localStorage` với file mở thẳng từ ổ đĩa. Khi đó dùng nút
**Snapshot** trên thanh trên để xuất/nhập trạng thái bằng file JSON.

## Trạng thái lưu ở đâu

| Khoá | Ai ghi | Nội dung |
|---|---|---|
| `haustek.crm.v1` | CRM | toàn bộ trạng thái CRM, có phiên bản, sai phiên bản thì bỏ qua |
| `haustek.crm.handoff.v1` | CRM | bản tin bàn giao, portal đọc |
| `haustek.portal.contracts.v1` | **chỉ portal** | trạng thái hợp đồng, CRM đọc chỉ-đọc |
| `haustek.portal.v1` | **chỉ portal** | CRM không bao giờ ghi vào đây |

## Đăng nhập

Bốn tài khoản mẫu, **không có mật khẩu** — màn hình đăng nhập là ô chọn người
dùng. Ranh giới quyền bên trong là thật và có test phủ, nhưng nó chạy phía trình
duyệt nên chỉ chặn được thao tác nhầm, không chặn được người cố ý. Lên thật thì
phải có phiên đăng nhập trên máy chủ.

| Tài khoản | Vai trò |
|---|---|
| `ethan.nguyen` | Manager — thấy tất cả, duyệt cả hai cấp, nhật ký, phân quyền |
| `priya.raman` | Giám đốc khu vực — duyệt cấp vùng |
| `bao.tran` | Giám đốc quốc gia — duyệt cấp country |
| `lam.nguyen` · `valeria.tinoco` | A&R — chỉ thấy bản ghi của mình |
| `hannah.le` | Label Manager — chỉ thấy bản ghi của mình |

Đồng nghiệp không được liệt kê sẵn; gõ đúng tên từ 3 ký tự mới lộ ra, và chi
tiết vẫn bị che nếu không có quyền xem tất cả.

## Kiểm thử

```bash
node crm/test/smoke.mjs         # 74 phép kiểm trên CRM
node crm/test/finmodel.mjs      # 79 phép kiểm mô hình tài chính
node crm/test/handoff-e2e.mjs   # 34 phép kiểm CRM ↔ portal
```

Cần Playwright (`npm i -D playwright`). Cả hai tự tìm bản cài global.

`smoke.mjs` phủ những chỗ dễ vỡ nhất khi sửa file 5000+ dòng: ranh giới quyền,
thoát HTML, song ngữ và hai tiền tệ, chỉ số tuần, lưu trạng thái và hồi sinh kiểu
`Date`, cả 12 tab, drawer/chi tiết/import, hiệu năng bảng ảo hoá, không tràn
ngang ở khổ điện thoại, cùng ba thứ mới: sidebar, điểm quan hệ và command palette.

`handoff-e2e.mjs` dựng sẵn một máy chủ tĩnh rồi mở cả hai app trên cùng origin,
gắn deal bên CRM và ghi vào sổ bên intranet — kiểm cả trường hợp party không tồn
tại, ghi trùng, và chốt chặn đè khoản tạm ứng đang có.

## Điểm quan hệ

Mượn cách [Affinity](https://www.affinity.co/product/relationship-intelligence)
chấm điểm quan hệ trong CRM cho giới đầu tư: không đếm số lần liên hệ trần, mà
cân hai thứ — **gần đây tới mức nào** và **đều tới mức nào**.

| Thành phần | Cách tính | Trọng số |
|---|---|---|
| Độ gần đây | phân rã bán rã 30 ngày kể từ lần chạm cuối | 60% |
| Tần suất | số lần chạm trong 90 ngày, 6 lần là đủ đầy | 40% |

Một khách gọi 10 lần hồi tháng 3 rồi im bặt thì quan hệ đang nguội, dù tổng số
cao. Một khách vừa nói chuyện tuần trước thì đang ấm, dù mới quen.

Thứ dùng được nhất không phải cột điểm, mà là card **Quan hệ đang nguội** ở
trang chính: khách *có deal đang mở* mà điểm đã tụt dưới 28. Đó là chỗ deal chết
âm thầm — không phải vì mất, mà vì không ai gọi lại.

## Command palette

`⌘K` (hoặc `Ctrl+K`, hoặc `/`) mở ô tìm nhanh: gõ tên là ra deal, khách hàng,
người liên hệ, lead, và cả lệnh chuyển trang. `↑` `↓` chọn, `↵` mở, `esc` đóng.

Mỗi loại bản ghi có hạn ngạch riêng chứ không cắt theo tổng — nếu cắt theo tổng
thì với vài nghìn cơ hội, gõ tên một label sẽ chỉ thấy toàn deal và tưởng khách
hàng đó không tồn tại.

Palette đi qua đúng các hàm phạm vi như bảng (`poolOpps`, `sAccounts`…), nên nó
không phải cửa sau để A&R thấy bản ghi của đồng nghiệp — có phép kiểm riêng cho
điều này.

## Chuỗi duyệt

```
CRM cầm lái                              Portal cầm lái
A&R dựng deal
  → Chờ sếp country      (waiting)
  → Chờ sếp vùng         (region)   ← deal dưới ngưỡng bỏ qua bước này
  → Đã trình portal      (portal)  ──→ CEO duyệt
                                        ↓ duyệt xong mới ghi sổ
                                      tỷ lệ chia + tạm ứng vào sổ
                                        ↓
                                      Legal soạn hợp đồng (legal)
                                      Hợp đồng sẵn sàng   (signature)
                                      Đã ký               (won)
  A&R thấy trạng thái  ←──────────────  chiều ngược, chỉ-đọc
```

Bốn điều đáng nói:

**Hai cấp duyệt tách thành hai quyền riêng**, không gộp thành một quyền `approve`.
Gộp lại thì sếp country ký được cả chữ ký của sếp vùng — mà chuỗi hai cấp sinh ra
chính là để điều đó không xảy ra. Tab Chờ duyệt cũng chỉ hiện việc của đúng cấp
người đang đăng nhập.

**Từ chối không giết deal.** Bản trước đẩy thẳng sang `lost`: một cái lắc đầu của
sếp là mất trắng cơ hội, không đường quay lại. Giờ trả về đàm phán để A&R sửa rồi
trình lại.

**Ngưỡng bỏ qua sếp vùng** sửa được ở tab Phân quyền, mặc định 10.000 USD. Deal
**chưa điền giá trị** không tính là nhỏ — `amount` bằng 0 nghĩa là chưa ai định
giá, không phải "đáng 0 đồng". Cho nó lọt cửa là mở đúng một đường để deal lớn né
sếp vùng: bỏ trống ô giá trị.

**CEO duyệt trước, ghi sổ sau.** Ghi tỷ lệ và tạm ứng vào sổ khi CEO chưa gật là
ghi một cam kết thương mại chưa ai phê. Màn hình bên portal không hiện nút ghi sổ
cho tới khi CEO bấm duyệt.

## Chiều ngược portal → CRM

Chiều đi là quyết định thương mại. Chiều về **chỉ là trạng thái**, và CRM đọc
chỉ-đọc: không sửa được hợp đồng, không ghi vào khoá đó, không suy diễn thêm.

| Portal gửi | CRM chuyển giai đoạn thành |
|---|---|
| `ceo_rejected` | Đàm phán (A&R sửa rồi trình lại) |
| `ceo_approved` · `drafting` | Legal soạn hợp đồng |
| `ready` | Chờ ký |
| `signed` | Đã ký |

Vì sao vẫn cần chiều về: không có nó thì deal "biến mất" khỏi CRM đúng lúc trình
lên portal, và người dựng deal phải mở app khác để biết hợp đồng xong chưa — đúng
kiểu quy trình làm người ta bỏ không cập nhật CRM nữa.

## View đã lưu và chọn hàng loạt

**View đã lưu** gói bộ lọc + từ khoá + thứ tự sắp xếp thành một chip đặt tên, lưu
cùng trạng thái nên sống qua reload. Thứ người ta làm hằng ngày không phải "lọc
theo giai đoạn" mà là "mở lại đúng danh sách tôi nhìn mỗi sáng".

**Chọn hàng loạt** có ở cả bốn bảng. `state.sel` giữ đúng một loại bản ghi — đổi
tab hoặc chọn loại khác là bỏ lựa chọn cũ, vì mang theo thì thanh hành động sẽ mời
làm những việc không áp dụng được cho thứ đang chọn. Thanh chỉ hiện việc làm được
với đúng quyền của người đang đăng nhập, và báo trước bao nhiêu bản ghi sẽ bị bỏ
qua vì ngoài phạm vi.
