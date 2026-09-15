# Bàn giao từ CRM sang Portal — phương án

Trả lời cho câu hỏi: *"có một số thông tin từ CRM có thể sẽ push qua Portal
để giám đốc duyệt và legal/admin lên hợp đồng cho khách."*

Tài liệu này **chưa phải là mã đã viết**. Nó là thứ phải chốt trước khi viết,
vì có ba chuyện làm sai thì phải đập đi làm lại, và một chuyện làm sai thì
mất tiền thật.

---

## 0 · Ba câu trả lời ngắn

**Một.** Phía CRM đã đặc tả xong hợp đồng hai chiều, và đặc tả ấy **đúng**:
hai lời gọi mà CRM dựng ra (`A.rates.add`, `A.advances.set`) tồn tại thật
trong lõi Portal, đúng thứ tự tham số, đúng đơn vị. Người viết CRM đã đọc lõi,
không đoán.

**Hai.** Nhưng **đường truyền không chạy được như đã viết**. `localStorage`
không đi qua được giữa hai bản công bố artifact. Nó chỉ chạy khi hai ứng dụng
cùng một tên miền thật — mà điều đó thì kho này làm được ngay.

**Ba.** Và Portal **không nên chạy hai lời gọi ấy**, dù chúng tồn tại. Chúng
nhắm vào sai bảng, và một trong hai *ghi đè* chỗ mà luồng duyệt hiện tại
*cộng dồn*. Chi tiết ở mục 4.

---

## 1 · Đường truyền — trả lời trước vì nó quyết định phần còn lại

### Bản demo artifact: KHÔNG chạy

Origin là bộ ba (giao thức, tên miền, cổng). `localStorage` khoá theo origin.
CRM và Portal là hai artifact riêng, hai origin riêng — nên
`haustek.crm.handoff.v1` và `haustek.portal.contracts.v1` là hai vùng nhớ
không bao giờ gặp nhau.

Điều nguy hiểm không phải là nó hỏng. Là nó **hỏng im lặng**:
`localStorage.setItem()` bên Portal vẫn **thành công**, ghi vào một vùng nhớ
mà CRM không đọc được. Nếu giao diện báo "đã gửi về CRM" thì nó đang nói dối
một cách hoàn toàn thuyết phục.

> Phần này tôi **chưa kiểm được bằng trình duyệt**: sandbox không đăng nhập
> được claude.ai, `curl` vào địa chỉ artifact trả về 403 của Cloudflare. Độ
> tin cậy cao (tài liệu nền tảng nói rõ lưu trữ tách theo từng artifact, và
> đó chính là mục đích của khung cách ly), **không phải chắc chắn tuyệt đối**.
>
> Phép thử một phút, nên chạy trước khi viết dòng mã nào: mở hai artifact,
> chọn khung của từng artifact làm ngữ cảnh JS trong devtools, so
> `location.origin`; rồi `localStorage.setItem('__thu','1')` bên này và đọc
> bên kia.

Cho bản demo: **chép tay hai chiều**. CRM hiện gói JSON trong một khối bôi
đen được; người vận hành dán sang Portal. Portal hiện phản hồi y như vậy.
Cách này chạy ở mọi kiểu triển khai và không cần quyền gì. Đừng dùng
`navigator.clipboard` — `clipboard-write` có thể bị Permissions-Policy chặn
trong khung; bôi đen rồi Ctrl-C thì không cần quyền nào cả.

### Bản thật trên haustek-group.com: CHẠY ĐÚNG NGUYÊN VĂN

Cả kho này deploy lên Vercel thành **một site tĩnh, một tên miền**
(`vercel.json` ở gốc kho). Đặt CRM vào `haustek-group.com/crm/` cạnh
`haustek-group.com/portal/` là hai app **cùng origin** — đường dẫn không tính
vào origin — nên hợp đồng localStorage chạy đúng như CRM đã viết, kể cả sự
kiện `storage` bắn sang tab kia đang mở.

Bốn thứ làm gãy origin một cách im lặng, phải canh:

| Gãy vì | Cách tránh |
|---|---|
| `http` với `https` | ép HTTPS |
| `www.haustek-group.com` với `haustek-group.com` | chốt một bản chính, redirect bản kia |
| cổng khác mặc định | không dùng |
| mở bằng `file://` | origin mờ, `localStorage` ném luôn — lõi đã ghi chú chuyện này |

Đổi lại: cùng origin nghĩa là **không có ranh giới bảo mật nào giữa hai app**.
CRM đọc và ghi đè được toàn bộ `haustek.portal.v1`. Câu "CRM chỉ đọc" là một
**quy ước**, không phải một hàng rào. Portal đã tự nói đúng câu ấy về chính
nó ở trang Quản trị; đừng giả vờ khác đi cho CRM.

### Bản sau nữa: cả hai đều không

Hai ứng dụng dùng chung một khoá lưu trữ trình duyệt là tiện lợi của bản mẫu.
Câu trả lời thật là một endpoint HTTP mà Portal gọi vào.

### Hệ quả cho cách viết mã

**Viết bộ phân tích nhận vào một CHUỖI, và nhốt kênh truyền vào đúng hai hàm.**

```js
const KENH_CRM = { vao: "haustek.crm.handoff.v1", ra: "haustek.portal.contracts.v1" };
function kenhCrmDoc()  { /* đọc localStorage → {co, text} */ }
function kenhCrmGhi(t) { /* ghi localStorage → true|false */ }
```

Mọi thứ phía trên hai hàm ấy chỉ làm việc với **văn bản**. Ngày đổi sang HTTP
là sửa hai thân hàm. Và trang phải **nói thẳng kênh nào đang dùng** — "Kênh
localStorage: không thấy gói nào" — chứ không bao giờ được coi một lượt
`setItem` thành công là đã giao hàng.

---

## 2 · Hợp đồng dữ liệu — đã đối chiếu với mã CRM

### CRM → Portal · khoá `haustek.crm.handoff.v1`

```js
{ v:"1.0.0", source:"haustek-crm", at:<ISO>, bound:<n>, total:<n>, deals:[ {
    dealId, dealName, account, accountType, country,
    amountUSD, closeDate, owner,
    rights:{dist,pub,yt},
    terms:{ artistSharePct, initialAdvanceUSD, marketingFundUSD,
            totalAdvanceUSD, termMonths, exclusivityMonths, findersFeePct } | null,
    portalPartyKey: "A:<id>" | "L:<id>" | null    // GẮN TAY bên CRM
} ] }
```

Mọi trường `*Pct` là **phần trăm** (12,5), không phải phân số. CRM đã tự bắt
lỗi này một lần và ghi chú lại trong mã nguồn của họ.

### Portal → CRM · khoá `haustek.portal.contracts.v1`

```js
{ v:"1.0.0", deals:[ {dealId, status, updatedAt, note, by, url} ] }
```

`status` ∈ `ceo_rejected · ceo_approved · drafting · ready · signed`, và CRM
tự ánh xạ sang giai đoạn của nó. Chiều về **không mang một con số tiền nào** —
chỉ mã deal, một từ trạng thái, lúc nào, ai, vì sao. Lộ ra thì lộ hình dạng
một cái pipeline, không lộ bảng giá.

---

## 3 · Ba cửa sập đã đo được

Chạy thật trên lõi, không suy luận:

**Một · `rates.add` từ chối mọi khoá `A:`**

| Lời gọi | `A:` (nghệ sĩ) | `L:` (label) |
|---|---|---|
| `rates.add` | **BỊ CHẶN** | ghi được |
| `advances.set` | ghi được | ghi được |

`portalPartyKey` của CRM gắn tay và có thể là `A:`. Một nút "áp dụng cả hai"
ngây thơ sẽ **ghi xong tạm ứng rồi mới ném ở tỷ lệ** — tiền vào sổ, điều
khoản không vào. Deal áp dụng một nửa tệ hơn deal chưa áp dụng.

Lõi chặn là **đúng**, không phải lỗi: nghệ sĩ độc lập nhận toàn bộ phần sau
phí Haustek, không có label đứng giữa để chia. `rateFor` trả thẳng `1` cho
khoá `A:`, di trú vòng 3 đã xoá sạch mọi dòng `A:` khỏi bảng tỷ lệ, và
`test/tien-ba-lop.js` ghim cái ném ấy lại.

**Hai · `contractCalc` kẹp số trong im lặng**

| Gửi vào | Ghi ra |
|---|---|
| `feePct 0,875` (artistShare 12,5%) | **0,5** |
| `feePct 0,02` (artistShare 98%) | **0,03** |
| `feePct 0` | **0,15** |
| `months 120` | **60** |

Nên phía nhận phải **từ chối bằng tên** trước khi gọi, chứ đừng phó mặc:
`artistSharePct` trong [50, 97], `termMonths` trong [6, 60]. Không thì giám
đốc duyệt một con số, hệ ghi một con số khác, và không ai thấy.

**Ba · kỳ đã xét duyệt thì không đặt tỷ lệ mới được**

CRM gửi `closeDate` (một ngày), không gửi mã kỳ. Ai áp dụng cũng phải tự chọn
kỳ hiệu lực — chọn nhầm kỳ đã chốt sổ là bị từ chối.

---

## 4 · Vì sao Portal KHÔNG chạy hai lời gọi CRM dựng sẵn

Chúng chạy được, nhưng chúng nhắm sai chỗ.

- **`A.rates.add`** ghi vào bảng chia **label ↔ nghệ sĩ của label**, không
  phải phí Haustek. CRM không có trường nào mang nghĩa ấy. Và nó ném với một
  nửa số dòng của chính CRM (khoá `A:`).
- **`A.advances.set`** **thay** số dư gốc, trong khi luồng duyệt đề xuất
  **cộng dồn**. Một lượt đẩy từ CRM xoá mất khoản tạm ứng giám đốc đã duyệt
  quý trước, và hàng rào duy nhất ở đó chỉ chặn hạ xuống dưới phần đã thu hồi.

**Nên đề nghị CRM xoá hai chuỗi lời gọi ấy khỏi giao diện.** Để đấy là mời
người vận hành dán chúng vào cạnh luồng thật và ghi sổ hai lần. Đây là thay
đổi duy nhất phương án này yêu cầu ở phía CRM.

Đường đúng: deal từ CRM vào Portal như một **đề xuất** (`DX-`), đi qua đúng
luồng xét duyệt đang có — giám đốc duyệt bằng đúng hai cái nút anh ấy vẫn
bấm — và nhánh duyệt sẵn có ghi cả hai sổ một lượt, có nhật ký. **Không có
đường ghi tiền nào mới được mở ra.**

---

## 5 · Hai lỗi tiền có sẵn mà đường này chạm vào mỗi deal

**(a) Cờ `labelTuTra` bị xoá mỗi lần duyệt hợp đồng — ĐÃ SỬA (vòng 26).**

Đo được: đặt `labelTuTra = true` cho một label rồi duyệt một đề xuất hợp đồng
của chính label ấy → cờ về `false`. Cờ này quyết định Haustek trả thẳng cho
nghệ sĩ của label hay để label tự trả. Tức là **ai nhận tiền vừa đổi mà không
ai quyết định chuyện đó**.

Nguyên nhân: `applyApproved` gán đè cả bản ghi `state.contracts[bên]` thay vì
trộn vào. Đã sửa, và `test/qc-bat-bien.js` ghim lại — bỏ bản sửa ra thì bài
kiểm đỏ ngay.

Tới giờ hiếm gặp vì hai việc ít đi cùng nhau. Luồng CRM thì **tạo-rồi-duyệt
là đường đi mặc định**, nên nó sẽ gặp ở từng deal.

**(b) Phí lùi ngày về quá khứ — CHƯA SỬA, cần bạn quyết.**

Đo được, hôm nay 15/09/2026, các kỳ đã duyệt tới 05/2026:

```
hợp đồng ghi được:  from = 2026-09-01   ← ngày, đem hiển thị
                    fromKey = 2026-06   ← kỳ, feeOf đọc khoá NÀY
```

Một bản ghi **tự mâu thuẫn với chính nó**. `fromKey` là kỳ chưa chốt sổ đầu
tiên, tức kỳ cũ nhất còn mở — không phải tháng sau. Nên tháng 6, 7, 8 đã chạy
số và đã đối soát **bị tính lại phí** ngay lúc giám đốc bấm duyệt. `closeDate`
của CRM không tham gia vào phép tính này chút nào.

Đây là hành vi **có sẵn cho mọi đề xuất hợp đồng**, không phải do CRM. Nên
**đừng sửa chung với PR thêm luồng CRM**: nó là thay đổi chuỗi tiền của cả
sản phẩm và đáng có một quyết định riêng. Nhưng hộp thoại duyệt phải hiện
**đúng `fromKey` mà mã sẽ dùng**, và cảnh báo khi kỳ của `closeDate` muộn hơn
nó. **Đừng bao giờ in ra một kỳ mà mã không dùng.**

---

## 6 · Phương án chốt

**Xương sống: deal từ CRM vào như một ĐỀ XUẤT, không phải một sổ mới.**

Portal đã sở hữu đúng cái thực thể mà CRM đang bàn giao: một thay đổi thương
mại đang chờ một người quyết. Đi qua `xet-duyet` là thừa hưởng sẵn: cửa duyệt
chỉ mở cho giám đốc, bước kế toán kiểm số, bắt buộc nêu lý do khi từ chối,
dòng thời gian, chuông "đang chờ", tìm nhanh — và quan trọng nhất, một nhánh
duyệt đã ghi cả hai sổ một lượt và đã có nhật ký. **Không có gì mới chạm vào
tiền.**

- Lưu **hai bảng** `thuongVu` và `thuongVuDay`, đều `kieu: "bang"` — nên
  **không cần bước di trú, không cần nâng `LUOC_DO_VER`**.
- Tách **`khoaCrm`** (CRM *khai* là bên nào) khỏi **`khoa`** (Portal *quyết*
  là bên nào). Chỉ người mới ghi được `khoa`, sau khi đọc tên đối tác và mã
  HTK. Đây là hàng rào duy nhất còn đứng vững khi gói dữ liệu bị sửa.
- `terms` lưu **nguyên văn theo đơn vị của CRM**. Bản ghi là *bằng chứng về
  điều hệ khác nói*. Quy đổi đúng **một chỗ**, ở ranh giới trình đề xuất. Quy
  đổi lần thứ hai ở bất cứ đâu là một lỗi tiền câm.
- `drafting / ready / signed` là **bước giấy tờ, không phải trạng thái quyết
  định** → một runbook `QUY_TRINH` mới, tick vào chỗ đã có sẵn. **Không thêm
  một trạng thái nào vào luồng đề xuất** — bán kính ảnh hưởng của việc ấy trải
  khắp hai trang, ba file kiểm và cổng đối tác.
- **Không dựng vai `legal` mới.** Lõi ép vai theo cây tổ chức: thêm một vai là
  sửa `VAI_NB` + `TO_CHUC` + nhóm quyền + chuẩn lại số liệu của `qc-quyen` —
  to hơn chính tính năng này, và không nên lùa vào sau lưng một việc tích hợp.
  Tick runbook có danh tính và có nhật ký, đủ dùng cho tới khi Haustek thật sự
  có người làm pháp chế.

Chiều về **suy ra từ hồ sơ đã có**, không lưu thêm trạng thái — nên hai bên
không thể lệch nhau. `submitted / checked / returned` **không phát gì cả**:
CRM đã đỗ deal ở giai đoạn `portal` của nó rồi, im lặng mới là tín hiệu thật.

---

## 7 · Thứ tự làm

| # | Bước | Cỡ | Đi riêng được? |
|---|---|---|---|
| 0 | Sửa cờ `labelTuTra` + bài kiểm ghim | ~5 dòng + ~20 kiểm | **Xong rồi, vòng 26** |
| 1 | Lõi: đọc gói, kiểm phong bì, lưu bảng, quyền. Chưa có giao diện | ~200 + ~120 kiểm | có |
| 2 | Trang `thuong-vu`: dán gói, bảng deal, hộp gắn bên | ~300 | có |
| 3 | `trinh()` + hàng rào kiểm số + hai móc đề xuất. **Tiền chạy từ đây** | ~120 + ~80 kiểm | có |
| 4 | Runbook hợp đồng + chiều về + thẻ đẩy | ~170 | có |
| 5 | Đánh bóng: chip CRM ở hàng đề xuất, thẻ lệch, huy hiệu đếm | ~80 | tuỳ |

Thêm **một dòng** vào `intranet.html`. Bản gói tự có trang mới, không phải sửa
lần hai — `dung-goi.js` đọc danh sách từ chính trang thật (vòng 26).
`khach.html` **không đụng tới**: không thứ gì của CRM được lộ sang cổng đối
tác, và `api-guard` nên khẳng định điều đó trước và sau `lockdown()`.

---

## 8 · Việc cố ý KHÔNG làm

- **Vai `legal` / `phap-che` mới** — lý do ở mục 6.
- **Loại đề xuất thứ ba, hay trạng thái mới trong luồng duyệt** — mô hình hoá
  một thứ vốn không phải trạng thái quyết định.
- **Bộ khớp bên mờ có chấm điểm** — cho người chọn, đừng đoán hộ.
- **Bất cứ thứ gì chạy bằng `rights`, `marketingFundUSD`, `findersFeePct`** —
  lưu và hiện ra cho giám đốc thấy phạm vi đang duyệt, nhưng Portal không có
  chỗ nào thi hành chúng. Giả vờ có là dựng một cái danh sách tick đóng vai
  một hàng rào.
- **Đối soát `amountUSD` với dự báo của Portal** — món giá trị nhất còn để
  trên bàn, và Portal đã có sẵn cả bộ "lệch rồi chấp nhận". Nhưng là vòng sau.
- **Chữ ký mã hoá trên gói dữ liệu** — trên cùng một origin thì CRM ghi đè
  được toàn bộ state của Portal, nên chữ ký không chặn được ai. Toàn vẹn thật
  cần máy chủ; nói thẳng thế còn hơn ngụ ý ngược lại.

---

## 9 · Ba câu chưa trả lời được

1. **Origin của khung artifact.** Tin cậy cao, không chắc chắn. Chạy phép thử
   hai khung ở mục 1 trước khi chốt chữ trên giao diện.
2. **`artistSharePct` nghĩa là gì?** Phần đối tác hưởng so với Haustek (cách
   đọc của tài liệu này), hay phần chia nội bộ giữa label và nghệ sĩ của nó?
   Bằng chứng nghiêng về cách đầu, và đó là cách đọc duy nhất khiến deal mang
   theo được kinh tế của Haustek. Nhưng nếu là cách thứ hai thì **mọi deal đều
   sai theo cùng một hướng**. Mã không giải được câu này — cần một câu từ
   người viết CRM.
3. **Phí lùi ngày có phải cố ý không?** Đã sống với mọi đề xuất hợp đồng từ
   lúc luồng ấy ra đời. Cần một quyết định sản phẩm, tách khỏi việc này.
