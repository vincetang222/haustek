# Đồng bộ CRM ↔ Portal

Tài liệu cho **đội làm portal**. Mọi hình dạng dữ liệu dưới đây trích từ code đang
chạy, không viết theo trí nhớ — chạy `node crm/test/handoff-e2e.mjs` là kiểm được.

---

## 1. Toàn cảnh

Hai ứng dụng song song, mỗi bên một vòng đời:

| | CRM (`crm/`) | Portal (`portal/`) |
|---|---|---|
| Đơn vị làm việc | **deal** — sửa liên tục vài tuần tới vài tháng | **kỳ** — đã duyệt là chốt |
| Người dùng | A&R, sếp country, sếp vùng | admin vận hành, CEO, legal |
| Giữ gì | lead, cơ hội, khách hàng, hoạt động, nhật ký | danh mục, doanh thu, tỷ lệ chia, tạm ứng, chi trả |

**CRM không giữ đồng nào. Portal không giữ deal nào.**

Đi qua ranh giới chỉ có hai thứ, mỗi thứ một chiều:

```
        haustek.crm.handoff.v1  (CRM ghi → portal đọc)
CRM ─────────────────────────────────────────────────→ Portal
    ←─────────────────────────────────────────────────
        haustek.portal.contracts.v1  (portal ghi → CRM đọc)
```

---

## 2. Ba khoá lưu trữ và ai được ghi

| Khoá | Ghi | Đọc | Nội dung |
|---|---|---|---|
| `haustek.crm.v1` | **chỉ CRM** | chỉ CRM | toàn bộ trạng thái CRM |
| `haustek.crm.handoff.v1` | **chỉ CRM** | portal | deal đã qua chuỗi duyệt CRM |
| `haustek.portal.contracts.v1` | **chỉ portal** | CRM (chỉ-đọc) | trạng thái + đường dẫn hợp đồng |
| `haustek.portal.v1` | **chỉ portal** | chỉ portal | quyết định vận hành của portal |

**Luật một chiều.** Mỗi khoá đúng một người ghi. Đó là lý do không cần khoá chốt,
không có tranh chấp ghi đồng thời, và không bên nào phải chờ bên nào.

Phá luật này thì hỏng thế nào: nếu portal ghi vào `haustek.crm.handoff.v1`, lần
lưu trạng thái kế tiếp của CRM sẽ ghi đè sạch — `handoffPublish()` dựng lại toàn
bộ khoá từ `DB.opps` mỗi lần `store.save()` chạy. Không phải merge, là thay thế.
Bạn sẽ mất dữ liệu mà không có lỗi nào báo.

> **Bắt buộc: cùng origin.** `localStorage` chỉ chia sẻ giữa hai trang cùng origin.
> Chromium coi **mỗi `file://` là một origin mờ riêng**, nên mở hai app bằng
> `file://` thì chúng không thấy nhau và mọi phép kiểm sẽ xanh một cách vô nghĩa.
> Phải phục vụ cả hai qua HTTP cùng tên miền. Trên Vercel thì `/crm` và `/portal`
> cùng domain nên tự động đúng.

---

## 3. Chiều đi: `haustek.crm.handoff.v1`

CRM ghi lại toàn bộ khoá này mỗi lần lưu trạng thái.

```json
{
  "v": "1.0.0",
  "source": "haustek-crm",
  "at": "2026-09-15T05:22:31.004Z",
  "total": 13,
  "bound": 1,
  "deals": [ /* … */ ]
}
```

Một phần tử `deals[]`:

```json
{
  "dealId": "o164",
  "dealName": "Flyaway Records — Distribution 2026",
  "account": "Flyaway Records (ViVi ENM)",
  "accountType": "label",
  "country": "VN",
  "amountUSD": 18000,
  "closeDate": "2026-09-11",
  "owner": "Ethan Nguyen",
  "rights": { "dist": true, "pub": false, "yt": true },
  "terms": {
    "artistSharePct": 70,
    "initialAdvanceUSD": 14000,
    "marketingFundUSD": 2100,
    "totalAdvanceUSD": 16100,
    "termMonths": 72,
    "exclusivityMonths": 36,
    "findersFeePct": 0
  },
  "portalPartyKey": null
}
```

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `dealId` | string | có | khoá chính, ổn định suốt đời deal |
| `dealName` · `account` | string | có | chuỗi tự do — **phải `esc()` trước khi ghép vào HTML** |
| `accountType` | `"artist"` \| `"label"` | có | |
| `country` | string | có | mã quốc gia ngắn |
| `amountUSD` | number | có | luôn USD, đã làm tròn |
| `closeDate` | `"YYYY-MM-DD"` \| null | có | |
| `owner` | string | có | tên A&R phụ trách |
| `rights` | object 3 boolean | có | `dist` · `pub` · `yt` |
| `terms` | object \| **null** | có | `null` khi deal chưa chạy máy tính advance |
| `portalPartyKey` | `"A:<id>"` \| `"L:<id>"` \| **null** | có | `null` là chưa ai gắn |

**`terms` có thể là `null`.** Deal ký mà không chạy máy tính advance thì không có
điều khoản để ghi sổ. Đừng giả định nó luôn tồn tại.

Deal xuất hiện ở đây khi giai đoạn của nó là `portal` hoặc bất kỳ giai đoạn nào
do portal cầm lái (`legal`, `signature`, `won`) — tức **ngay sau khi chuỗi duyệt
trong CRM xong**, chứ không đợi tới lúc đã ký. Đợi tới `won` mới trình thì CEO
chẳng còn gì để duyệt.

---

## 4. Chiều về: `haustek.portal.contracts.v1`

Portal ghi. CRM đọc chỉ-đọc — nó không sửa, không ghi, không suy diễn thêm.

```json
{
  "v": "1.0.0",
  "deals": [
    {
      "dealId": "o164",
      "status": "ready",
      "note": "Đã ghi tỷ lệ và tạm ứng vào sổ",
      "by": "portal",
      "updatedAt": "2026-09-15T05:40:12.881Z",
      "url": "https://haustek-group.com/portal/contracts/o164"
    }
  ]
}
```

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `dealId` | string | có | khớp `dealId` chiều đi |
| `status` | enum bên dưới | có | |
| `note` | string | không | hiện dưới ô Hợp đồng trong CRM |
| `by` | string | không | ai đổi |
| `updatedAt` | ISO 8601 | **có** | CRM dùng làm dấu chống áp lại; đổi trạng thái thì **phải** đổi mốc này |
| `url` | string | không | đường dẫn hợp đồng, xem mục 7 |

`status` nhận đúng năm giá trị, và CRM chuyển giai đoạn theo bảng này:

| `status` | Giai đoạn CRM | Ý nghĩa |
|---|---|---|
| `ceo_rejected` | `negotiation` | CEO không duyệt — deal về tay A&R sửa rồi trình lại |
| `ceo_approved` | `legal` | CEO gật, chưa ghi sổ |
| `drafting` | `legal` | đã ghi sổ, legal đang soạn |
| `ready` | `signature` | hợp đồng xong, chờ ký |
| `signed` | `won` | đã ký |

Giá trị lạ ngoài năm cái trên: CRM **giữ nguyên giai đoạn** và chỉ lưu trạng thái
để hiển thị. Không đoán, không vá.

---

## 5. Ai được đổi cái gì

```
CRM cầm lái                            Portal cầm lái
negotiation → waiting → region → portal │ legal → signature → won
                                        │
   A&R, sếp country, sếp vùng           │   CEO, legal
```

- **Giai đoạn CRM cầm lái**: portal ghi trạng thái vào cũng bị **bỏ qua**.
  `inboxApply()` chỉ chạm deal đang ở `portal` hoặc trong `PORTAL_STAGES`.
  Deal còn trong chuỗi duyệt thì portal không có quyền kéo đi.
- **Giai đoạn portal cầm lái**: CRM **không đẩy tiếp được**. `advance()` từ chối
  và báo "Giai đoạn này do portal điều khiển". Nút đi tiếp trên trang chi tiết
  biến mất.

Chuỗi duyệt bên CRM, để bạn biết deal đến tay portal sau những gì:

| Từ | Tới | Cần quyền |
|---|---|---|
| `negotiation` | `waiting` | người phụ trách deal |
| `waiting` | `region` | `approveCountry` |
| `region` | `portal` | `approveRegion` |

Deal có `amountUSD` **lớn hơn 0 và nhỏ hơn** `REGION_THRESHOLD` (mặc định 10.000
USD) thì từ `waiting` nhảy thẳng lên `portal`, bỏ qua sếp vùng. Deal **chưa điền
giá trị** (`amountUSD` bằng 0) **không** được coi là nhỏ — nếu không thì bỏ trống
ô giá trị là đường né sếp vùng.

---

## 6. Thứ tự bắt buộc: CEO duyệt trước, ghi sổ sau

```
deal tới portal
   ↓
CEO duyệt          → backSet(dealId, "ceo_approved", …)
   ↓                 CHƯA đụng vào sổ
ghi sổ             → A.rates.add(...)  +  A.advances.set(...)
   ↓                 rồi backSet(dealId, "drafting", …)
legal soạn         → backSet(dealId, "ready" | "signed", …)
```

Màn hình `portal/screens/crm-handoff.js` **không hiện nút "Ghi vào sổ"** cho tới
khi có bản ghi `ceo_approved`. Nếu bạn viết lại màn hình này, giữ nguyên chốt đó:
ghi tỷ lệ và tạm ứng vào sổ khi CEO chưa gật là ghi một cam kết thương mại chưa
ai phê — đúng thứ mà cả chuỗi duyệt sinh ra để chặn.

### Ràng buộc của lõi portal, đã va phải thật

**`A.rates.add(partyKey, rate, fromPeriodKey, by, note)` ném lỗi với kỳ đã duyệt.**

```
Error: Kỳ 2025-11 đã duyệt — không đặt tỷ lệ hiệu lực vào kỳ đã chốt
```

Đúng như vậy: kỳ đã duyệt thì tiền đã chia rồi. Nên ô chọn kỳ **chỉ được liệt kê
kỳ còn mở**:

```js
const open = A.periods.filter(p => !A.isApproved(p.k));
```

Mời người chọn một kỳ chắc chắn bị từ chối là mời họ bấm vào lỗi.

Và kỳ hiệu lực **không suy ra được** từ ngày ký. "Ký 11/09" không nói được tiền
bắt đầu chia từ kỳ nào — đó là quyết định thương mại, phải để người chọn.

**`A.advances.set(partyKey, opening, note)` THAY THẾ, không cộng dồn.**

Nếu bên nhận đã có khoản ứng từ nguồn khác, gọi thẳng là xoá mất một khoản nợ có
thật. Phải đọc `A.advances.list()` trước, và hỏi người nếu ghi chú hiện có không
mang dấu của chính deal này.

---

## 7. Đường dẫn hợp đồng

Legal để hợp đồng trên portal, nên chiều về mang thêm `url` để A&R bấm thẳng từ CRM.

**Cả hai bên đều kiểm, không bên nào tin bên kia.** CRM không có quyền tin một khoá
do phía khác ghi; portal kiểm tại nguồn để người vận hành biết mình gõ sai ngay.

Dùng đúng hàm này ở cả hai phía — **đừng so tiền tố chuỗi**:

```js
function safeUrl(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  let u;
  try { u = new URL(raw, location.href); } catch (e) { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  return u.href;
}
```

Vì sao phải nhờ bộ phân tích URL chứ không tự kiểm: những chuỗi dưới đây đều lách
qua kiểu `raw.startsWith("javascript:")`, và đều bị hàm trên chặn (đã thử tay):

| Đầu vào | Kết quả |
|---|---|
| `javascript:alert(1)` | chặn |
| `JaVaScRiPt:alert(1)` | chặn |
| `   javascript:alert(1)` (khoảng trắng đầu) | chặn |
| `java<TAB>script:alert(1)` | chặn |
| `java<LF>script:alert(1)` | chặn |
| `data:text/html,<script>…` | chặn |
| `vbscript:msgbox(1)` | chặn |
| `/portal/contracts/o164` | giải về origin đang chạy |

Bộ phân tích URL tự bóc ký tự điều khiển trước khi xét giao thức, nên `java<TAB>script:`
hiện nguyên hình là `javascript:` và rớt.

Thẻ neo phải có đủ:

```html
<a href="…" target="_blank" rel="noopener noreferrer">
```

`noopener` để trang đích không với được `window.opener`; `noreferrer` để không rò
đường dẫn nội bộ nếu link trỏ ra ngoài.

**Chú ý riêng cho CRM:** `esc()` trong CRM trước đây không thoát dấu nháy đơn. Đã
sửa — nay thoát cả `'` và `` ` ``. Nếu bạn ghép URL vào thuộc tính ở phía portal,
kiểm lại hàm thoát của mình: một URL chứa dấu nháy đơn là đủ để thoát ra ngoài
thuộc tính dùng nháy đơn.

**Giữ `url` khi chỉ đổi trạng thái.** Legal gắn link lúc soạn xong rồi còn bấm "đã
ký" nữa; mỗi lần đổi trạng thái mà xoá link thì A&R mất đường vào hợp đồng đúng
lúc cần nhất. `backSet()` hiện giữ lại `url` cũ khi tham số `url` là `undefined`.

---

## 8. Tính bất biến khi ghi lại

Câu hỏi: làm sao biết deal nào đã ghi vào sổ rồi?

**Nguồn sự thật là chính cái sổ**, không phải một danh sách "đã xử lý" nuôi riêng.
Mỗi lần ghi, ghi chú mang dấu:

```
CRM <dealId> — <tên deal>
```

Muốn biết đã ghi chưa thì dò dấu đó:

```js
function markRe(dealId) {
  return new RegExp("^CRM " + dealId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|$)");
}
const rate = A.rates.scheduleFor(pk).some(r => markRe(id).test(r.note || ""));
const adv  = A.advances.list().some(a => a.partyKey === pk && markRe(id).test(a.note || ""));
```

Vì sao không nuôi danh sách riêng: hai nguồn sự thật thì kiểu gì cũng có ngày lệch
nhau — ghi sổ thành công nhưng danh sách chưa kịp cập nhật, hoặc ngược lại. Dò
thẳng vào sổ thì tải lại trang, xoá cache, hay mở máy khác đều ra cùng một đáp án.

Đổi lại: **đừng sửa tay ghi chú đó**, sửa là màn hình quên mất deal đã xử lý.

---

## 9. Vì sao KHÔNG khớp tự động theo tên

Đã đối chiếu thật hai danh mục:

| | Portal | CRM |
|---|---|---|
| Nghệ sĩ | 900, sinh từ PRNG có hạt giống cố định | 35 khách hàng, tên thật |
| Label | 40, tên hư cấu (`Nightform Records`…) | tên thật (`Sconnect Music`…) |

Trùng **đúng một tên trên 23** (`Hà Quỳnh Như`), và **không label nào trùng**.

Khớp theo tên ở đây là bịa ra quan hệ không có thật, mà hậu quả là **tiền chảy
sang nhầm người**. Nên `portalPartyKey` do người gắn tay bên CRM; portal chỉ kiểm
id có thật không, vì chỉ portal mới có danh mục:

```js
function partyOk(A, key) {
  const m = /^([AL]):(\d+)$/.exec(key || "");
  if (!m) return false;
  const id = Number(m[2]);
  return m[1] === "A" ? A.artists.some(x => x.id === id)
                      : A.labels.some(x => x.id === id);
}
```

---

## 10. Cạm bẫy đã va phải thật

**Bẫy TDZ khiến trang không boot nổi.** Biến ở tầng module khai báo bằng `let` mà
bị gọi trong lúc dựng dữ liệu mẫu sẽ vỡ vùng chết tạm thời:

```
ReferenceError: Cannot access 'REL_CACHE' before initialization
```

`seedAudit()` gọi `logAudit()` hàng trăm lần, `logAudit` gọi `saveSoon()` → tất cả
chạy **trước** dòng khai báo. Dùng `var` cho các biến cờ ở tầng module.

**`localStorage.clear()` rồi reload không xoá được gì.** Handler `pagehide` gọi
`saveNow()` lúc rời trang và ghi lại y nguyên. Trong test phải tắt cờ lưu trước:

```js
await page.evaluate(() => { window.STORE_READY = false; localStorage.clear(); });
await page.reload();
```

**`file://` là origin mờ.** Xem lại mục 2.

**Kiểu `Date` không sống sót qua JSON.** CRM có 9 trường `Date` phải hồi sinh khi
nạp lại, kể cả `audit[].oldV` / `audit[].newV` vốn là `Date` khi trường được sửa
là `closeDate`. Thiếu một cái là `.getMonth()` vỡ âm thầm sau reload.

---

## 11. Nếu lên máy chủ thật

Ba khoá `localStorage` thành ba bảng. Những chỗ hiện đang giả định sai vì chạy
trong trình duyệt:

| Hiện tại | Lên thật cần |
|---|---|
| `haustek.crm.handoff.v1` | bảng `deal_handoff`, khoá chính `deal_id`, khoá ngoại sang `deals` |
| `haustek.portal.contracts.v1` | bảng `contract_status`, khoá chính `deal_id`, có `updated_at` và `updated_by` thật |
| `portalPartyKey` | khoá ngoại thật sang `artists.id` / `labels.id`, ràng buộc tồn tại ở tầng DB chứ không phải regex |
| ai ghi khoá nào | phân quyền ghi ở tầng DB (RLS), không phải quy ước giữa hai file JS |
| `by: "portal"` | id người dùng thật từ phiên đăng nhập máy chủ |
| đăng nhập CRM | hiện **không có mật khẩu** — là ô chọn người dùng. Ranh giới quyền là thật và có test phủ, nhưng chạy phía trình duyệt nên chỉ chặn thao tác nhầm, không chặn người cố ý |
| `REGION_THRESHOLD` | cấu hình cấp tổ chức, không phải biến trong bản lưu của từng người |

Phần `portal/test/api-guard.js` đã ghi sẵn cảnh báo tương đương cho phía portal:
khi lên Postgres, dịch từng phép kiểm ở đó thành một test SQL.

---

## 12. Hợp đồng test — chạy cái này để chứng minh hai bên còn khớp

```bash
node crm/test/handoff-e2e.mjs   # 34 phép kiểm xuyên hai app
node crm/test/smoke.mjs         # 42 phép kiểm trên CRM
node portal/test/api-guard.js   # 21 phép kiểm ranh giới quyền portal
```

`handoff-e2e.mjs` tự dựng máy chủ tĩnh rồi mở **cả hai app trên cùng origin**, đi
hết chuỗi: gắn party bên CRM → CEO duyệt bên portal → ghi sổ → legal gắn link và
đổi trạng thái → CRM nhận ngược về. Nó kiểm cả những thứ **phải KHÔNG xảy ra**:

- CEO chưa duyệt thì không có nút ghi sổ, và sổ chưa bị ghi gì
- party không tồn tại bị chặn
- deal chưa gắn `portalPartyKey` bị chặn
- ghi lại lần hai không tạo bản ghi trùng
- CRM không ghi vào khoá chiều về
- giai đoạn portal cầm lái thì CRM không đẩy tiếp được
- URL độc (6 biến thể) bị chặn và không lọt vào DOM
- đè khoản tạm ứng đang có thì phải hỏi trước

**Sửa bất cứ thứ gì ở mục 3, 4, 5, 6 thì chạy lại cả ba.** Nếu bạn đổi hình dạng
dữ liệu, sửa luôn phép kiểm tương ứng trong cùng một commit — test còn xanh mà
hợp đồng đã đổi là tệ hơn test đỏ.

---

## 13. Những gì hiện CHƯA làm được

Nói thẳng, đúng giọng `portal/README.md`:

- **Không có máy chủ.** Hai app chỉ thấy nhau khi cùng trình duyệt, cùng origin.
  Khác máy thì phải dùng nút **Xuất JSON** và chuyển file bằng tay.
- **Không có xác thực thật.** Xem mục 11.
- **Không tự đẩy.** Portal không bị đánh thức khi CRM ghi, và ngược lại. CRM đọc
  khoá chiều về lúc khởi động và mỗi lần đổi tab; portal đọc khi mở màn hình.
  Không có websocket, không có polling.
- **Portal không biết khi CRM sửa một deal đã trình.** Đổi tỷ lệ bên CRM sau khi
  đã ghi sổ thì phải tự xử lý ở màn hình Tỷ lệ chia.
- **Một deal ghi cho một party.** Deal đồng sở hữu phải tách tay.
