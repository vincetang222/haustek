# Haustek Portal v2

Hai cổng, một lõi.

```
portal/
  haustek-core.js          máy chủ giả lập — dữ liệu, luật chia tiền, hai mặt tiền admin/api
  v2/
    haustek-theme.css      hệ màu và thành phần giao diện, hai chế độ sáng/tối
    haustek-shell.js       khung ứng dụng: điều hướng, ngôn ngữ, chế độ, hộp thoại, bảng
    haustek-bieudo.js      biểu đồ SVG theo biến CSS (đổi chế độ là đổi màu, không vẽ lại tay)
    haustek-man.js         khuôn dùng chung cho mười lăm trang
    intranet.html          CỔNG NỘI BỘ  — giữ HAUSTEK.admin
    khach.html             CỔNG KHÁCH HÀNG — gọi HAUSTEK.lockdown() rồi chỉ còn HAUSTEK.api
    fonts-nhung.css        bộ chữ nhúng sẵn (Be Vietnam Pro, IBM Plex Mono), không gọi ra Google Fonts
    VAN-PHONG.md           chuẩn thuật ngữ và văn phong tiếng Việt cho mọi chữ trên cổng
    NGHIEN-CUU-NGUOI-DUNG.md  từng vai dùng cổng để làm gì, trang nào trả lời, chỗ nào còn thiếu
    man/                   mười lăm trang, mỗi trang một file
  haustek-them.js          mảnh giao diện vòng 5 dùng chung: cảnh báo, chia sẻ, ngưỡng, metadata, giải thích, chiến dịch, phân trang nhẹ
  NGHIEN-CUU-THI-TRUONG.md nghiên cứu thị trường và học thuật vòng 5, có nguồn
  dung-goi.js              dựng goi-mot-trang.html: cả hai cổng trong một file để dán lên trình xem
  goi-mot-trang.html       bản gói đã dựng
  test/                    bộ kiểm thử (xem test/README.md)
```

## Hai cổng tách hẳn

| | Nội bộ (`intranet.html`) | Khách hàng (`khach.html`) |
|---|---|---|
| Mặt tiền dữ liệu | `HAUSTEK.admin` — toàn quyền | `HAUSTEK.api` — đã lọc, đã tính sẵn |
| Kỳ nhìn thấy | cả 12 kỳ, kể cả kỳ đang làm dở | chỉ kỳ **đã duyệt** |
| Bí mật kinh doanh | tên đơn vị phân phối, tỷ lệ gốc, đưa vào lúc khởi động | không có trong bản lõi khách tải về |
| Sửa được gì | nhập báo cáo, khớp, tỷ lệ, tạm ứng, xét duyệt kỳ | không sửa gì |
| Trang | 17 | 13 |

Hai file HTML nạp **cùng một** `haustek-core.js`. Khác nhau ở dòng đầu: `khach.html`
gọi `HAUSTEK.lockdown()` **trước khi** chạy bất cứ trang nào, và không bao giờ gọi
`provideSecrets()`.

> Nói cho đúng: đây là **hình dạng** của ranh giới, không phải ranh giới đã được thực
> thi. Hai trang cùng gốc thì nạp lại lõi trong iframe là có lại `.admin`, và
> `localStorage` thì trang nào cùng gốc cũng đọc được. Xem tab **Quản trị → Ranh giới
> hai cổng** để biết cái gì thật sự chặn được và cái gì không.

## Hai mươi sáu trang nội bộ

| Trang | File | Trả lời câu gì |
|---|---|---|
| Tổng quan | `man/tong-quan.js` | Kỳ này đóng được chưa, tiền chia đi đâu, còn gì treo |
| Nhập báo cáo | `man/nap-du-lieu.js` | Kỳ nào thiếu nguồn nào: bảng 12 kỳ × 4 nguồn |
| Khớp ISRC | `man/khop-isrc.js` | Tiền chưa có chủ nằm ở đâu, khớp về ai |
| Đối soát & xét duyệt kỳ | `man/doi-chieu.js` | Tổng hệ thống có khớp file gốc không, xét duyệt được chưa |
| Phát hành | `man/phat-hanh.js` | Hồ sơ phát hành đối tác gửi lên: tiếp nhận → cấp ISRC/UPC → đã phát hành, hoặc trả lại bổ sung |
| **Kế toán** | `man/ke-toan.js` | Bút toán kỳ, công nợ bên thụ hưởng, tạm ứng phải thu, ghi nhận 12 kỳ, thuế |
| Thanh toán | `man/chi-tra.js` | Ba tab: thanh toán theo kỳ (bên nào được bao nhiêu, vì sao phần còn lại chưa thanh toán được); yêu cầu rút tiền của đối tác (tiếp nhận, chuyển khoản, số tham chiếu, từ chối, tạo hộ); bảng kê PDF từng bên thụ hưởng theo kỳ |
| Tạm ứng | `man/tam-ung.js` | Ai còn nợ, thu hồi tới đâu, còn mấy kỳ nữa |
| Tỷ lệ chia | `man/ty-le.js` | Bảng tỷ lệ có ngày hiệu lực, đổi từ kỳ nào |
| Danh mục | `man/danh-muc.js` | 50.000 bản ghi, tìm được, lọc bản có vấn đề; mở ra xem dòng tiền, quy trình phát hành, trạng thái từng nền tảng, lượt nghe và doanh thu theo nền tảng theo tháng |
| Nền tảng | `man/nen-tang.js` | Toàn danh mục: từng nền tảng mang về bao nhiêu lượt nghe, bao nhiêu tiền mỗi kỳ; kỳ thiếu nguồn nào thì cột đó bằng 0 |
| Bàn làm việc | `man/ban-lam-viec.js` | Trang đầu theo vai: giám đốc (thẻ *Chờ xét duyệt* duyệt / từ chối tại chỗ, đội kinh doanh, dự báo), vận hành, kinh doanh (KPI, chỉ tiêu, *Đề xuất của tôi* và nút đề xuất tạm ứng / hợp đồng), hỗ trợ (ticket, khiếu nại), kế toán (rút tiền, bảng kê, *Cần kiểm số*) |
| Giao nhận nền tảng | `man/giao-nhan.js` | Tạo và theo dõi yêu cầu giao bản ghi tới nền tảng (theo label, UPC, bản phát hành) |
| Sửa hàng loạt | `man/sua-hang-loat.js` | Khoá / mở khoá, đổi giá, đổi ngày phát hành, đổi giá track cho danh sách UPC |
| Đối tác | `man/doi-tac.js` | Quản lý tài khoản đối tác: người phụ trách, doanh thu quý, phân loại, hợp đồng, trạng thái; ngăn hồ sơ có nút *Đề xuất tạm ứng* / *Đề xuất hợp đồng* mở hộp thoại tính ROI sống |
| Hỗ trợ | `man/ho-tro.js` | Hàng đợi yêu cầu hỗ trợ: hạn, ưu tiên, người phụ trách, trả lời |
| Quản lý quyền | `man/quyen.js` | Xung đột Content ID và khiếu nại trên nền tảng; cài đặt video theo tài khoản |
| Theo dõi | `man/theo-doi.js` | Bài hát, tài khoản, bản phát hành đang lên trong cửa sổ 7 / 28 / 60 ngày; yêu thích (lưu trình duyệt, có Lưu / Khôi phục), top hits, đang bùng nổ, số playlist và video ngắn |
| Bảng giá nền tảng | `man/bang-gia.js` | Nhóm giá của các nền tảng bán tải về: giá album và track theo nền tảng và tiền tệ, nối sang Sửa hàng loạt |
| Chất lượng lượt nghe | `man/chat-luong.js` | Cảnh báo lượt nghe bất thường gom theo tài khoản (kiểu tách nhỏ để lách ngưỡng), năm tín hiệu có bằng chứng, bài bị nền tảng gắn cờ kèm số lượt nghe bị gỡ khỏi báo cáo, xác nhận / gỡ có nhật ký; sức khoẻ metadata toàn danh mục |
| Chia sẻ tác quyền | `man/chia-se.js` | Splits của mọi tài khoản: ai được chia bao nhiêu, lời mời chưa nhận, thu hồi còn dở; xác nhận thay có nhật ký |
| Chiến dịch | `man/chien-dich.js` | Liên kết thông minh / pre-save, pitch playlist, quảng cáo trả phí của mọi tài khoản, phễu kết quả và chi tiết |
| Xét duyệt | `man/xet-duyet.js` | Đề xuất tạm ứng và hợp đồng: kinh doanh hoặc đối tác đề xuất, kế toán kiểm số, giám đốc duyệt / từ chối / trả lại. Mỗi đề xuất chụp bản tính lúc tạo: thu nhập ròng 12 kỳ, tăng trưởng, độ dao động, tập trung bài đầu, mức ứng tối đa theo hạng rủi ro, khoản thu hồi, thời gian thu hồi, phí ứng thu về, phần Haustek giữ trong thời gian thu hồi, ROI; hợp đồng so phần Haustek giữ theo phí hiện tại và phí đề xuất. Duyệt xong tự ghi sổ tạm ứng hoặc áp phí mới từ kỳ mở kế tiếp |
| Tính ROI | `man/roi.js` | Dựng lại bảng tính ROI_Haustek.xlsx: nhập doanh thu danh mục mỗi tháng, khoản ứng (tiền mặt cộng ngân sách truyền thông và sản xuất nếu thu hồi được), tỷ lệ nghệ sĩ hưởng, phần vẫn trả nghệ sĩ trong lúc thu hồi, kỳ hạn, độc quyền, phí môi giới, chi phí bản phát hành. Ra: hoa hồng Haustek mỗi tháng (ô D3), phần giữ lại để thu hồi (G3), số tháng thu hồi (I3), hoa hồng cả kỳ hạn (D5), ROI kỳ hạn (J5), ROI mỗi năm (K5), ROI sau chi phí (J12), phần chưa thu hồi khi hết hạn và ROI thực. Bốn kịch bản: danh mục nền và ba mốc thưởng. Số nhập tay nên chạy được cho đối tác chưa có trên hệ thống; có sẵn thì bấm *Lấy số từ đối tác* |
| Mức trả nền tảng | `man/muc-tra.js` | USD gộp trên 1.000 lượt của từng nền tảng, suy từ báo cáo 3 kỳ và hiệu chỉnh theo thị trường Việt Nam; nhập số thật từng nền tảng hoặc dán CSV để ghi đè, dự báo và giải thích số đổi theo ngay |
| Quản trị | `man/quan-tri.js` | Tài khoản, nhật ký, câu hỏi treo, dữ liệu, ranh giới |

## Mười tám trang cổng đối tác

Cổng đối tác chỉ hiện **số NET** của người xem (xem `NGHIEN-CUU-NGUOI-DUNG.md`
mục 4b). Mọi trang tiền ở đây dùng khoá `revenue` / `mine`; tầng API chặn chữ
"gross", "fee", "phí dịch vụ", "doanh thu gộp".

| Trang | File | Trả lời câu gì |
|---|---|---|
| Tổng quan | `man/k-tong-quan.js` | Kỳ này tôi được bao nhiêu, vì sao, bao giờ tiền vào |
| Bài hát của tôi | `man/k-ban-ghi.js` | Từng bài hát, thu nhập của tôi trên mỗi bài |
| Nghệ sĩ | `man/k-nghe-si.js` | Chỉ label: từng nghệ sĩ trong roster mang về bao nhiêu, phần nghệ sĩ, phần label |
| Hệ thống label | `man/k-he-thong.js` | Chỉ label mẹ: từng label con và nghệ sĩ bên dưới, cây label, xem cổng của label con với tư cách người được uỷ quyền |
| Danh mục bài hát | `man/k-danh-muc.js` | Mọi bài hát kể cả bài chưa ra tiền: bước nào của quy trình phát hành, đã lên nền tảng nào (đường dẫn), còn thiếu gì |
| Nền tảng | `man/k-nen-tang.js` | Từng nền tảng mang về bao nhiêu lượt nghe, bao nhiêu tiền mỗi tháng, cho cả tài khoản |
| Dự báo | `man/k-du-bao.js` | Lượt nghe hằng ngày × mức trả của nền tảng: dự kiến kỳ đang mở và kỳ sau, tăng trưởng, bài tăng mạnh |
| Ví & rút tiền | `man/k-vi.js` | Số dư khả dụng, rút tiền, tài khoản nhận tiền, lịch sử, khoản ghi theo kỳ, nhịp báo cáo |
| Hỗ trợ | `man/k-ho-tro.js` | Gửi và theo dõi yêu cầu hỗ trợ; khiếu nại bản quyền Haustek đang xử lý thay bạn |
| Xu hướng ngày | `man/k-xu-huong.js` | Lượt nghe theo ngày (cột / vùng / đường, 7 / 28 / 60 ngày) xếp theo bài hát, bản phát hành, nghệ sĩ, thị trường, nền tảng; nhân khẩu học người nghe |
| Playlist & bảng xếp hạng | `man/k-playlist.js` | Bài hát đang ở playlist biên tập, thuật toán hay bảng xếp hạng nào, vị trí, ngày vào, còn ở đó không; playlist mang về nhiều lượt nghe nhất |
| Chất lượng lượt nghe | `man/k-chat-luong.js` | Tín hiệu bất thường tính từ lượt nghe ngày, bài bị nền tảng gắn cờ kèm lượt bị gỡ và mức phạt, khiếu nại có ghi chú; sức khoẻ metadata từng bài và cách sửa |
| Chia sẻ tác quyền | `man/k-chia-se.js` | Mời producer, nghệ sĩ khách, đồng sáng tác, kỹ sư nhận phần trăm trên số tiền của một bài, tuỳ chọn ngưỡng thu hồi; người cộng tác chỉ thấy phần của họ |
| Chiến dịch | `man/k-chien-dich.js` | Liên kết thông minh có pre-save, pitch playlist biên tập, quảng cáo trả phí: mỗi dòng một phễu kết quả; yêu cầu chiến dịch mới qua ticket marketing |
| Phát hành | `man/k-phat-hanh.js` | Bản phát hành trong danh mục, hồ sơ đang xử lý, gửi hồ sơ mới theo đúng trường của form metadata |
| Bảng kê thanh toán | `man/k-bang-ke.js` | Bản đối soát chính thức: in ra, tải về, gửi kế toán |
| Tạm ứng | `man/k-tam-ung.js` | Vì sao kỳ này có doanh thu mà không nhận được tiền; thẻ *Đề nghị tạm ứng* (mức có thể ứng theo thu nhập ròng 12 kỳ, ví dụ khấu trừ) và gửi đề nghị trong mức tối đa, theo dõi trạng thái, rút đề nghị |
| Tài liệu | `man/k-tai-lieu.js` | Bảng kê các kỳ cũ, và câu trả lời cho những câu hay hỏi |

## Hồ sơ một bài hát dùng chung hai cổng

`haustek-taisan.js` (`HTS`) dựng ngăn trượt cho một bài hát từ gói
`api.trackAsset` (cổng đối tác) hoặc `A.asset` (nội bộ): tab **Quy trình** (bảy
bước, còn thiếu gì), **Nền tảng** (12 nền tảng lớn với trạng thái và đường dẫn,
206 nền tảng khác gộp một dòng), **Theo tháng** (ma trận nền tảng × kỳ, đổi được
lượt nghe / doanh thu gộp / phần được hưởng, xuất CSV), **Playlist** (playlist và
bảng xếp hạng bài đang có mặt, vị trí, ngày vào; cổng đối tác lấy qua
`HTS.plCua`, nội bộ qua `A.playlistsOf`), **Chất lượng** (cảnh báo lượt nghe của
bài với năm tín hiệu, luật trả tiền của nền tảng với thanh tiến độ tới ngưỡng,
điểm sức khoẻ metadata và cách sửa, phần chia sẻ tác quyền). Đầu ngăn có ảnh bìa
sinh xác định từ id bài (`HM.bia`), tên, nghệ sĩ và giai đoạn. Nội bộ đưa thêm tab Dòng
tiền của mình vào qua `them`. Cùng một phép chia theo nền tảng dùng cho ma trận
từng bài, thu nhập theo nền tảng của kỳ và báo cáo nền tảng của cả tài khoản, nên
ba bảng đó cộng lại luôn ra cùng con số (api-guard kiểm điều này).

## Label mẹ, label con, xem thay

`LABELS[i].parentId` dựng cây; `api.labelTree` trả về cây với số liệu kỳ,
`api.delegations` cho biết tài khoản này được xem thay ai. Cổng đối tác ghi
`haustek.demo.xemThay` (sessionStorage; bản gói dùng localStorage) rồi nạp lại với
phiên của label con, và khung vẽ biểu ngữ `.viewas` qua `cauHinh.bieuNgu(c)`. Tiền
không đi qua label mẹ (câu hỏi cần chốt số 9).

## Màn hẹp: bảng bên, máy tính bảng, điện thoại

Trên 1080px cột điều hướng đứng cố định bên trái. Dưới đó cột thu thành một **ngăn trượt**
mở bằng nút ☰ ở thanh trên, giữ nguyên bố cục dọc (nhóm, số đếm, chân cột), và đóng khi
chọn mục, bấm nền, hoặc nhấn Escape. Dưới 640px thanh trên chỉ còn tên trang và ô chọn kỳ;
cụm USD/VND, sáng/tối và VI/EN chuyển vào ngăn. Con số trong ô số co theo bề rộng ô
(`cqi`), không theo bề rộng cửa sổ. `test/v2-hep.js` đo hình học của khung ở
390 / 640 / 900 / 1024 / 1280px.

## Văn phong tiếng Việt

Mọi chữ tiếng Việt trên cổng theo `v2/VAN-PHONG.md`: một bảng thuật ngữ đã chốt (nguồn dữ
liệu, nhập báo cáo, đối soát, xét duyệt, huỷ xét duyệt, thanh toán, nền tảng, thị trường, được hưởng, đối tác…) và
mười hai quy tắc viết (không gạch ngang dài giữa câu, không mở câu bằng "nó", không viết
hoa cả cụm, nhãn cột là danh từ ngắn, nút là động từ + tân ngữ). Viết chữ mới thì đọc file
đó trước.

## Bản gói một trang

`node portal/dung-goi.js` nối lõi, khung, hệ giao diện, bộ chữ nhúng và mười lăm trang
thành `goi-mot-trang.html`. Bản gói có ô chọn cổng ở chân cột trái; cổng đối tác vẫn
gọi `lockdown()` trước khi trang nào chạy. Sửa nguồn xong phải dựng lại rồi chạy
`test/v2-nhu-artifact.js` và `test/v2-khong-mang.js`.

## Hai ngôn ngữ

Nút VI / EN trên thanh trên, lưu ở `localStorage` (`haustek.lang`). Ba tầng chữ:

| Chữ ở đâu | Lấy bằng | Ví dụ |
|---|---|---|
| Của một trang | `c.t('khoa')` — từ điển `chu:{vi,en}` của chính trang đó | "Bảng kê kỳ" / "Period statement" |
| Của khung | `c.t()` rơi về từ điển khung khi trang không có khoá | "Kỳ", "Huỷ", "Đóng" |
| **Của tầng dữ liệu** | `c.song(o, 'label')` → `o.labelEn` khi đang EN | tên nguồn dữ liệu, điều kiện duyệt, từng chặng chuỗi tiền |

Tầng thứ ba là chỗ dễ quên nhất: những chuỗi đó **sinh ra ở `haustek-core.js`**, không ở
trang, nên chúng mang sẵn bản tiếng Anh bên cạnh (`name`/`nameEn`, `label`/`labelEn`,
`note`/`noteEn`). Đọc thẳng `x.label` là bật EN xong vẫn ra tiếng Việt.

**Tên nghệ sĩ, tên bài, tên label, tên nền tảng KHÔNG dịch** — đó là dữ liệu, và
`nae & de'lay` ở chế độ EN vẫn là `nae & de'lay`.

Số và ngày **đi theo ngôn ngữ**: `$7.537,23` và `22.06.2026` ở VI, `$7,537.23` và
`22 Jun 2026` ở EN. Lúc đầu tôi cố định kiểu Việt với lý do "công cụ nội bộ của công ty
Việt Nam" — đúng với cổng nội bộ, sai hẳn với cổng đối tác, vì người bật EN là đối tác nước
ngoài và với họ `$7.537,23` đọc ra bảy nghìn hay bảy đô là chuyện hên xui.

## Chế độ sáng/tối

Ba trạng thái, không phải hai. Nút bật/tắt nằm trên thanh trên của cả hai cổng (ở điện thoại: trong ngăn điều hướng).

* **Theo máy** — không đóng dấu gì lên thẻ gốc, `prefers-color-scheme` quyết định
* **Sáng** — `[data-theme="light"]`, thắng cả khi máy đang tối
* **Tối** — `[data-theme="dark"]`, thắng cả khi máy đang sáng

Lựa chọn lưu ở `localStorage` (`haustek.theme`), cùng chỗ với ngôn ngữ (`haustek.lang`).
Mọi thành phần chỉ đọc **biến CSS**, không viết mã màu trực tiếp — kể cả biểu đồ, nên
đổi chế độ không cần vẽ lại bằng tay. 21/21 cặp màu chữ–nền đạt chuẩn tương phản
WCAG AA ở **cả hai** chế độ.

## Thêm một trang

```js
HT.dangKy({
  id: 'ma-man',              // dùng làm #hash
  nav: 'khoaChu',            // khoá chữ cho nhãn ở cột trái
  nhom: 'khoaNhom',          // khoá chữ cho tên nhóm (không bắt buộc)
  icon: 'grid',              // tên icon trong HT.IC
  khaDung: function (c) { return c.phien.me.role === 'label'; }, // không bắt buộc: trang chỉ dành cho một vai
  dem: function (c) { ... }, // con số nhỏ cạnh nhãn; '!' đứng đầu = màu cảnh báo
  chu: { vi: { khoaChu: 'Tên trang', ... }, en: { khoaChu: 'Screen', ... } },
  ve: function (root, c) { root.innerHTML = '…'; HB.gan(root); }
});
```

`c` (ngữ cảnh) mang: `lang cur kyKey ky kys fmt esc icon CHU t() tien() tien2()
doiKy() di() veLai() thongBao() hoiThoai() xacNhan() nganTruot() dongNgan() bang()
A api phien`.

Khung **thay hẳn thẻ `<main>`** mỗi lần vẽ, nên sự kiện gắn bằng `HM.bam(root, …)`
chết theo thẻ cũ — trang không phải nhớ gỡ tay.

## Chạy thử

```bash
cd portal && python3 -m http.server 8099
# rồi mở http://127.0.0.1:8099/v2/intranet.html
```

Bài kiểm (cần `NODE_PATH=$(npm root -g)`):

```bash
node test/v2-quet.js  v2/intranet.html 1500,1280,1100   # mọi trang × mọi tab × 2 chế độ × 2 ngôn ngữ
node test/v2-quet.js  v2/khach.html    1500,1280,1100
node test/v2-quet.js  v2/intranet.html 390,640,900      # điện thoại · máy tính bảng · bảng bên trình xem
node test/v2-quet.js  v2/khach.html    390,640,900
node test/v2-hep.js                                     # khung ở màn hẹp: ngăn điều hướng, thanh trên, không cuộn ngang
node test/v2-bam.js                                     # bấm vào mọi dòng, mọi hộp thoại
node test/v2-khach-tk.js                                # 11 tài khoản đối tác, mỗi tài khoản một góc nhìn
node test/v2-luong.js                                   # chuỗi vận hành: nhập → khớp → chốt → xét duyệt → đối tác thấy
node test/v2-tuong-phan.js                              # tương phản WCAG AA đo trên trang đã render, hai chế độ
node test/v2-tieng-anh.js                               # bật EN thì khung không còn tiếng Việt
node test/api-guard.js                                  # ranh giới quyền và chuỗi tiền
node dung-goi.js && node test/v2-nhu-artifact.js && node test/v2-khong-mang.js   # bản gói chạy trong trình xem, không mạng
```

Ba bài đầu cần Chromium ở `/opt/pw-browsers/chromium-1194/` và bộ font thật ở
`/tmp/fonts-local.css` (xem `test/README.md`) — thiếu font thì trang render bằng font
dự phòng rộng hơn, và bài kiểm bố cục đo nhầm thứ.

## Phân quyền theo vai (vòng 8)

Ma trận nằm ở lõi (`haustek-core.js`, mục 19k) — phía "máy chủ" của bản mẫu —
chứ không phải ở từng màn. Ba lớp, cùng một nguồn:

- **Màn** (`QUYEN_MAN`): vai nào mở được màn nào. Thanh điều hướng, chuông,
  tìm nhanh, lối tắt trên bàn làm việc đều đọc từ đây; màn bị cấm không mở
  được qua `#hash`.
- **Nhóm hàm** (`QUYEN_NHOM`, `QUYEN_HAM`): mặt tiền `HAUSTEK.admin` được bọc
  lại, hàm gọi sai vai ném `Không có quyền` — giao diện có giấu nút hay
  không thì máy chủ vẫn chặn.
- **Lược số liệu**: sổ đối tác cho kế toán / vận hành / hỗ trợ không có doanh
  thu, tỷ lệ (kế toán giữ tài khoản ngân hàng để chi trả); kinh doanh chỉ
  thấy tài khoản mình phụ trách, chỉ tiêu và đề xuất của mình; bản tính đề
  xuất bỏ ROI / biên / phần Haustek giữ với kế toán, bỏ thêm phí thu về với
  kinh doanh; vận hành có `forecastStreams()` (lượt nghe, không tiền).

| Màn | Giám đốc | Kế toán | Kinh doanh | Vận hành | Hỗ trợ |
|---|:-:|:-:|:-:|:-:|:-:|
| Bàn làm việc, Hỗ trợ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tổng quan, Tỷ lệ chia, Quản trị | ✓ | | | | |
| Kế toán, Thanh toán, Tạm ứng, Chia sẻ tác quyền | ✓ | ✓ | | | |
| Đối soát & xét duyệt kỳ | ✓ | ✓ | | ✓ | |
| Xét duyệt | ✓ | ✓ (kiểm số) | ✓ (đề xuất của mình) | | |
| Tính ROI hợp đồng | ✓ | ✓ | ✓ | | |
| Đối tác | ✓ | | ✓ (của mình) | | |
| Chiến dịch | ✓ | | ✓ | ✓ | |
| Theo dõi, Nhập báo cáo, Khớp ISRC, Giao nhận, Sửa hàng loạt, Bảng giá, Mức trả, Danh mục, Nền tảng | ✓ | | | ✓ | |
| Chất lượng lượt nghe, Phát hành (hỗ trợ chỉ đọc), Quản lý quyền | ✓ | | | ✓ | ✓ |

Trang Quản trị có tab *Phân quyền theo vai* vẽ đúng ma trận này. Cổng đối
tác đã phân quyền theo tài khoản từ vòng 1: label chỉ thấy label và nghệ sĩ
của mình, label con chỉ thấy phần mình, nghệ sĩ chỉ thấy bài của mình; mọi
gói trả về cho đối tác chỉ có số NET.

## Ticket theo bộ phận, tạo hồ sơ thay đối tác, chú thích dấu ? (vòng 9)

**Ticket theo bộ phận.** Mỗi loại yêu cầu thuộc một bộ phận, gắn với vai
nội bộ (`BO_PHAN_TICKET` ở lõi): phát hành, nền tảng → vận hành; thanh toán →
kế toán; marketing, hợp đồng → kinh doanh; quyền, tài khoản, khác → hỗ trợ.
Đối tác gửi yêu cầu thì ticket rơi thẳng vào hàng đợi bộ phận, chưa gán ai;
trang Hỗ trợ của từng vai chỉ hiện hàng đợi của bộ phận mình và việc được
gán đích danh (giám đốc thấy hết). Ngăn ticket có ô *Chuyển bộ phận*: đổi loại
yêu cầu, sang bộ phận khác thì bỏ người phụ trách để hàng đợi mới nhận, có ghi
nhật ký. Cổng đối tác hiện bộ phận đang xử lý ở bảng và ngăn ticket.

**Nhân viên tạo hồ sơ phát hành thay đối tác.** Trang Phát hành có nút *Tạo hồ
sơ thay đối tác* (giám đốc, vận hành, kinh doanh); ngăn Đối tác cũng có nút
*Tạo hồ sơ phát hành* mở sẵn tài khoản đó. Hộp thoại chọn tài khoản, nghệ sĩ
chính (label thì chọn trong roster), thông tin bản phát hành và danh sách
track (mỗi dòng `Tên | ISRC | Producer`). Lõi: `releases.createFor(partyKey,
payload, by)` — kinh doanh chỉ tạo cho tài khoản mình phụ trách, hỗ trợ bị
chặn; hồ sơ mang `submittedRole: "staff"`, đi đúng quy trình tiếp nhận → cấp
mã → phát hành, và đối tác thấy hồ sơ với nhãn *Haustek tạo thay*.

**Chú thích dấu ?.** Câu giải thích không in dưới tiêu đề nữa: `HM.dau({mo})`
và `HM.the({p})` vẽ một nút `?` cạnh tiêu đề (thuộc tính `data-giup`), rê
chuột hoặc bấm để đọc, bấm thì ghim, Esc / bấm ngoài thì đóng. Giải thích dài
(ví dụ cách khấu trừ tạm ứng) gom vào `<details class="hoc">`. 93 chuỗi giải
thích tiếng Việt / tiếng Anh được viết lại ngắn gọn; hàng lối tắt trên bàn làm
việc bỏ vì trùng thanh điều hướng.

## Cây tổ chức, thêm dữ liệu ở mọi màn, hồ sơ phát hành đầy đủ (vòng 10)

**Cây tổ chức là nguồn của quyền.** Lõi (mục 19l) khai công ty → khối →
tổ → chức danh. Mỗi khối mang hồ sơ quyền: danh sách màn và nhóm hàm;
`QUYEN_MAN` / `QUYEN_NHOM` của vòng 8 giờ được dựng từ cây chứ không khai
riêng. Mỗi tổ mang nhiệm vụ thường xuyên (đếm sống từ dữ liệu: hồ sơ chờ
tiếp nhận, rút tiền chờ xử lý, hợp đồng sắp hết hạn…) và lớp tài sản phụ
trách (tài khoản đối tác, hợp đồng, chiến dịch, danh mục, hồ sơ phát hành,
nền tảng, báo cáo kỳ, ví, tạm ứng, bảng kê, ticket, khiếu nại) với số đếm
và phần giao đích danh. Nhân sự nằm trong `state.staff`, gắn khối / tổ /
chức danh: vai suy ra từ khối, phạm vi suy ra từ cấp chức danh (trưởng bộ
phận trở lên thấy cả bộ phận: kinh doanh trưởng thấy mọi đối tác, mọi đề
xuất, chỉ tiêu nhân viên). Màn **Tổ chức** (`to-chuc`) mở cho mọi vai: sơ
đồ khối, "Vị trí của tôi", bảng nhân sự, tài sản, quyền suy ra; giám đốc
thêm khối / tổ / nhân sự, chuyển, khoá. Bàn làm việc mọi vai có thẻ *Nhiệm
vụ của tôi* đọc từ cây.

**Thêm dữ liệu ở mọi màn.** Mỗi màn dữ liệu có nút "Thêm …" trên tiêu đề,
mở hộp thoại dựng bằng `HTM.hoiForm` (trường bắt buộc đánh dấu, trường
khác ghi "không bắt buộc", ô chọn bài hát có gợi ý): Đối tác (label /
nghệ sĩ, hợp đồng, người phụ trách, tài khoản cổng), Nền tảng (đang kết
nối / thử / đã lên, người phụ trách), Chiến dịch (kèm yêu cầu từ đối tác),
Chia sẻ tác quyền, Bảng giá (dòng giá nhập tay đè bảng mẫu), Danh mục (mở
hồ sơ phát hành), Kế toán (bút toán điều chỉnh vào kỳ đang mở), Quản lý
quyền (khiếu nại); cổng đối tác: label thêm nghệ sĩ vào roster, đề nghị
chiến dịch (tạo chiến dịch ở trạng thái yêu cầu và ticket marketing về
Kinh doanh). Mọi hàm thêm đi qua ma trận quyền và ghi nhật ký.

**Hồ sơ phát hành đủ metadata.** Theo form ở trang chủ (`metadata.html`):
bản phát hành (nghệ sĩ chính, feat, link Spotify / Apple, nhãn, thể loại
chính / phụ, ngôn ngữ, ngày giờ, pre-save, UPC, số catalog, năm sản xuất,
℗ / ©, phát hành lại, lãnh thổ, ảnh bìa, người thiết kế), từng track (phiên
bản, feat, remixer, ISRC, ngôn ngữ lời, nội dung nhạy cảm, link WAV, mốc
preview, người sáng tác với vai trò / tỷ lệ / nhà xuất bản, producer,
mixing, mastering, sample / cover, mức dùng AI, lời), liên hệ, bốn cam kết.
Form bốn bước dùng chung hai cổng (`haustek-hoso.js`): mỗi bước một chủ
đề, lỗi nói rõ sai gì, nháp tự lưu trong trình duyệt, xem lại trước khi
gửi. Lõi chỉ chặn thứ không thể thiếu; phần còn lại vào **bảng kiểm** (bắt
buộc / khuyến nghị, điểm %) để vận hành thấy còn thiếu gì và đối tác thấy
cùng bảng đó ở ngăn hồ sơ.

**Thiết kế.** Theo ba kho tham khảo (taste-skill, ui-ux-pro-max, marketing
skills): một màu nhấn, một dải xám lạnh, viền mảnh thay bóng, ô số không
hộp riêng, chữ số tabular, nhãn viết thường, huy hiệu chỉ cho trạng thái
thật, mỗi màn một nút chính; form dài chia bước, ghi "không bắt buộc" thay
vì rải dấu sao; ô trống nói việc kế tiếp.

## Bảng tính ROI hợp đồng (vòng 12)

Trang **Tính ROI** dựng lại `ROI_Haustek.xlsx` cho ba vai có quyền đề xuất:
kinh doanh, kế toán, giám đốc. Số nhập tay nên chạy được cho một hồ sơ đang
chào, chưa cần đối tác có trên hệ thống.

Bốn chỗ bảng tính gốc tính lệch, ở đây tính lại: số tháng thu hồi (ô `I3`
rút gọn ra `−B3/G3` nên luôn âm), tổng chi phí (ô `J11` nhân vào một ô trống
không nhãn nên luôn bằng 0, kéo theo "ROI sau chi phí" luôn bằng ROI), "net"
không nhất quán giữa sheet Catalog và ba sheet Trigger, và không sheet nào
kiểm khoản ứng có thu hồi kịp trong kỳ hạn hay không. Chi tiết từng ô, kèm
lý do và cách sửa bảng gốc: [`ROI-BANG-TINH.md`](ROI-BANG-TINH.md).

Trang này và trang Xét duyệt đều đo *lãi trên vốn* nên cùng lấy 0 làm mốc
hoà vốn, nhưng quy về năm theo hai mẫu số khác nhau (kỳ hạn với thời gian
thu hồi), nên **con số mỗi năm của hai bên không so thẳng được**. Trang có
một thẻ nhắc lại điều đó.

Cổng đối tác không có và không nên có: bảng tính này đọc ra phần Haustek
giữ lại, phí môi giới và biên lợi nhuận. Đối tác muốn biết mình ứng được bao
nhiêu thì vẫn dùng `k-tam-ung`, chạy trên `advanceOfferOf()` đã lược sạch.

## Vòng 13: bỏ hai cơ chế không có thật, chốt tỷ giá và phí chuyển tiền

Haustek soát lại và xác nhận hai thứ trong bản mẫu không có trong nghiệp vụ
của họ. Cả hai đến từ nghiên cứu thị trường vòng 5, không từ mô tả nghiệp vụ.

**Điểm producer — gỡ hẳn.** Hợp đồng thu âm kiểu Âu–Mỹ trả cho người sản
xuất bản ghi 3–5% doanh thu ròng, trừ vào phần nghệ sĩ. Hợp đồng của Haustek
không có khoản này. Bản mẫu đang trừ nó trên 34,7% số bài và để tiền lại một
dòng `P:*` "chưa xác định người thụ hưởng" — cộng 10 kỳ đã duyệt là hơn 80.000
USD treo, chưa từng trả cho ai. Đây không phải tính năng thừa mà là **khoản
trừ sai**. Chuỗi chia tiền giờ chỉ còn ba phần:

```
doanh thu gộp − phí Haustek − phần label giữ = phần nghệ sĩ
```

`api-guard.js` có một phép kiểm chốt chuỗi này chỉ có ba phần và `splitRec`
không còn trường `producer`, để nó không quay lại dưới tên khác.

**Phạt nền tảng — giữ phát hiện, bỏ số tiền.** Spotify thu ≈ €10 / bài /
tháng khi phát hiện lượt nghe giả, nhưng thu ở **tầng đơn vị phân phối giữ
tài khoản với nền tảng** (OneRPM, Believe, Warner), không ở Haustek. Phần mềm
từng hiện một con số tiền Haustek không kiểm soát và không đối chiếu được.
Giờ chỉ còn trạng thái "nền tảng gắn cờ", **số lượt nghe bị gỡ khỏi báo cáo**
và đường khiếu nại — phần phát hiện sớm vẫn giữ, vì đó là thứ Haustek muốn
biết trước khi OneRPM báo.

**Tỷ giá: ngày cuối tháng, Vietcombank.** Mỗi kỳ chốt một tỷ giá, lấy tỷ giá
bán ra của Vietcombank **ngày cuối cùng của tháng kỳ đó**. Ngày áp dụng do kỳ
quyết định chứ không phải hôm nay là ngày mấy: chốt muộn ba ngày vẫn là tỷ giá
ngày cuối tháng. `A.fx.ngayChot(pIdx)` tính ra ngày ấy, `A.fx.lock()` đóng dấu
đúng ngày ấy kèm nguồn. Bảng kê và trang Tổng quan của đối tác ghi rõ "tỷ giá
bán ra Vietcombank ngày dd.mm.yyyy". Câu hỏi cần chốt số 4 đã có lời giải.

**Phí chuyển tiền tính vào hoá đơn đối tác.** Khi rút tiền có hai khoản trừ,
hai bản chất khác nhau, và cả hai đều hiện rõ chứ không gộp thành một con số
"thực nhận" trống nghĩa:

| Khoản | Bản chất | Chứng từ |
|---|---|---|
| Thuế TNCN | nộp ngân sách thay đối tác, 10% với cá nhân cư trú từ 2.000.000 ₫ | chứng từ khấu trừ |
| Phí chuyển tiền | chi phí ngân hàng, tính vào hoá đơn đối tác theo thoả thuận | hoá đơn |

Phí báo bằng VND (mặc định 22.000 ₫, sửa ở trang Thanh toán, tab *Yêu cầu rút
tiền*) nên giữ VND làm số gốc và quy ra USD theo tỷ giá đang dùng — làm ngược
lại thì số ₫ trên giấy báo nợ lệch. Đối tác thấy cả hai khoản ngay trong ví,
trước khi bấm rút.

## Khung: chuông thông báo, tìm nhanh, bảng dữ liệu

Thanh trên có **chuông** (sự kiện mới của chính người xem: bảng kê sẵn sàng,
rút tiền đổi trạng thái, nền tảng gắn cờ, playlist mới, hồ sơ phát hành, lời
mời chia sẻ; nội bộ: rút tiền chờ, ticket mở, cờ nền tảng, tài khoản tăng đồng
loạt, hồ sơ chờ, giao nhận, metadata thiếu) — mỗi vấn đề một dòng, ba mức, đánh
dấu đã đọc lưu trong trạng thái. **Tìm nhanh** (nút kính lúp hoặc Ctrl K) tìm
bài hát theo tên không dấu hay ISRC, đối tác, hồ sơ (yêu cầu rút, ticket, phát
hành) và tên trang; Enter mở ngăn hồ sơ bài hoặc chuyển trang. Cửa nào cung cấp
dữ liệu cho hai thứ này qua `thongBao`, `danhDauDoc`, `tim`, `moBai` trong cấu
hình `HT.chay`.

Bảng dùng chung (`c.bang`) có số trang, nút đổi mật độ chặt / thoáng (lưu trình
duyệt), cột ô chọn với thanh hành động (`chonNhieu`), gọi lại `khiDoi` khi đổi
sắp xếp / trang / cỡ trang. CSS bảng: đầu cột chữ hoa nhỏ, dính khi cuộn ở màn
rộng (`.card` dùng `overflow:clip` để không chặn sticky), bỏ sọc xen kẽ (giữ
`.zebra` khi cần), thanh tỷ lệ trong ô số (`HM.oThanh`), ảnh đại diện có màu
nền đặc đủ tương phản.

Vòng 7 làm gọn khung: cột điều hướng có **nhóm thu gọn / mở** (nhớ trong trình
duyệt; nhóm chứa màn đang mở luôn mở; nhóm thu gọn mà có việc cần làm mang chấm
đỏ) và **huy hiệu hai mức** — số đếm là chữ mờ, việc cần xử lý là chấm đỏ với số
đậm (màn trả `'!' + n` từ `dem`); các số chỉ là "có bao nhiêu dòng" không đưa lên
điều hướng. Thanh trên có một nút sáng / tối / theo máy xoay vòng (`HT.datGiaoDien`
cho kiểm thử). Tiêu đề trang nhận `nut` (`HM.dau({ nut })`) làm chỗ đặt nút hành
động chính, dùng thống nhất ở Đối tác, Hỗ trợ, Theo dõi, Xét duyệt, Ví, Hỗ trợ
đối tác, Chia sẻ tác quyền, Chiến dịch. Ghi chú tắt được (`HM.ghi({ dong })`),
menu tràn ⋯ (`HM.menu`) cho thao tác phụ trong dòng bảng, định vị cố định để
không bị khung bảng cắt. Bảng: ô có tiêu đề hai dòng giữ tối thiểu 190px, ô chỉ
có nhãn / ảnh / mã không xuống dòng, dòng phụ cắt bằng dấu ba chấm.
