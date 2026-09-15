# Haustek CRM

Hệ **song song** với portal, không phải một phần của nó. Một file chạy được.

| File | Làm gì |
|---|---|
| `index.html` | Toàn bộ CRM — lead, cơ hội, khách hàng, người liên hệ, việc, nhân sự, duyệt giá, báo cáo, nhật ký, phân quyền, bàn giao portal |
| `HANDOFF.md` | Giao kèo bàn giao sang portal, và những gì nó chưa làm |
| `../portal/SYNC.md` | Hướng dẫn đồng bộ hai chiều, viết cho đội làm portal |
| `test/smoke.mjs` | 55 phép kiểm trên chính CRM |
| `test/handoff-e2e.mjs` | 34 phép kiểm xuyên hai app — cả chuỗi CEO duyệt và chiều ngược |

## Vì sao để riêng, không nhét vào `portal/`

Hai hệ khác vòng đời và khác người dùng.

Portal chạy theo **kỳ**: nạp dữ liệu, khớp ISRC, đối chiếu, duyệt kỳ, chi trả.
Nó là sổ sách — đã duyệt thì chốt, không sửa.

CRM chạy theo **deal**: một cơ hội đi từ đàm phán tới ký, mất vài tuần tới vài
tháng, và sửa liên tục suốt đường đi.

Trộn hai thứ đó vào một khung thì mỗi lần đổi CRM lại phải lo có làm vỡ sổ tiền
hay không. Để riêng thì ranh giới rõ: **CRM không giữ đồng nào, portal không giữ
deal nào.**

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
node crm/test/smoke.mjs         # 55 phép kiểm trên CRM
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
