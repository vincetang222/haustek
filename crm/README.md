# Haustek CRM

Hệ **song song** với portal, không phải một phần của nó. Một file chạy được.

| File | Làm gì |
|---|---|
| `index.html` | Toàn bộ CRM — lead, cơ hội, khách hàng, người liên hệ, việc, nhân sự, duyệt giá, báo cáo, nhật ký, phân quyền, bàn giao portal |
| `HANDOFF.md` | Giao kèo bàn giao sang portal, và những gì nó chưa làm |
| `test/smoke.mjs` | 24 phép kiểm trên chính CRM |
| `test/handoff-e2e.mjs` | 17 phép kiểm xuyên hai app — CRM ghi, intranet đọc và vào sổ |

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
| `haustek.portal.v1` | **chỉ portal** | CRM không bao giờ ghi vào đây |

## Đăng nhập

Bốn tài khoản mẫu, **không có mật khẩu** — màn hình đăng nhập là ô chọn người
dùng. Ranh giới quyền bên trong là thật và có test phủ, nhưng nó chạy phía trình
duyệt nên chỉ chặn được thao tác nhầm, không chặn được người cố ý. Lên thật thì
phải có phiên đăng nhập trên máy chủ.

| Tài khoản | Vai trò |
|---|---|
| `ethan.nguyen` | Manager — thấy tất cả, duyệt giá, xem nhật ký, phân quyền, bàn giao |
| `lam.nguyen` · `valeria.tinoco` | A&R — chỉ thấy bản ghi của mình |
| `hannah.le` | Label Manager — chỉ thấy bản ghi của mình |

Đồng nghiệp không được liệt kê sẵn; gõ đúng tên từ 3 ký tự mới lộ ra, và chi
tiết vẫn bị che nếu không có quyền xem tất cả.

## Kiểm thử

```bash
node crm/test/smoke.mjs         # 24 phép kiểm trên CRM
node crm/test/handoff-e2e.mjs   # 17 phép kiểm CRM → portal
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
