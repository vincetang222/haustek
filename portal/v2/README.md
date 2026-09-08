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

## Hai mươi lăm trang nội bộ

| Trang | File | Trả lời câu gì |
|---|---|---|
| Tổng quan | `man/tong-quan.js` | Kỳ này đóng được chưa, tiền chia đi đâu, còn gì treo |
| **Nhập số liệu** | `man/nhap-so-lieu.js` | Chỗ điều phối viên ngồi mỗi ngày. Bốn tab: lượt nghe hằng ngày (ngày nào nguồn chưa về thì gõ tổng vào), doanh thu theo kỳ × nguồn (gõ tổng lấy trên báo cáo OneRPM / Warner / Believe / YouTube CMS), doanh thu theo từng bài (khi báo cáo có dòng riêng), nhật ký nhập có nút gỡ. Số gõ tay đè lên số máy sinh |
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
| Đối tác | `man/doi-tac.js` | Quản lý tài khoản đối tác: người phụ trách, doanh thu quý, phân loại, hợp đồng, trạng thái; ngăn hồ sơ có nút *Đề xuất tạm ứng* / *Đề xuất hợp đồng* mở hộp thoại tính ROI sống |
| Hỗ trợ | `man/ho-tro.js` | Hàng đợi yêu cầu hỗ trợ: hạn, ưu tiên, người phụ trách, trả lời |
| Quản lý quyền | `man/quyen.js` | Xung đột Content ID và khiếu nại trên nền tảng; cài đặt video theo tài khoản |
| Theo dõi | `man/theo-doi.js` | Bài hát, tài khoản, bản phát hành đang lên trong cửa sổ 7 / 28 / 60 ngày; yêu thích (lưu trình duyệt, có Lưu / Khôi phục), top hits, đang bùng nổ, số playlist và video ngắn |
| Chất lượng lượt nghe | tab trong `man/danh-muc.js` | Cảnh báo lượt nghe bất thường gom theo tài khoản (kiểu tách nhỏ để lách ngưỡng), năm tín hiệu có bằng chứng, bài bị nền tảng gắn cờ kèm số lượt nghe bị gỡ khỏi báo cáo, xác nhận / gỡ có nhật ký; sức khoẻ metadata toàn danh mục |
| Chia sẻ tác quyền | `man/chia-se.js` | Splits của mọi tài khoản: ai được chia bao nhiêu, lời mời chưa nhận, thu hồi còn dở; xác nhận thay có nhật ký |
| Chiến dịch | `man/chien-dich.js` | Liên kết thông minh / pre-save, pitch playlist, quảng cáo trả phí của mọi tài khoản, phễu kết quả và chi tiết |
| Xét duyệt | `man/xet-duyet.js` | Đề xuất tạm ứng và hợp đồng: kinh doanh hoặc đối tác đề xuất, kế toán kiểm số, giám đốc duyệt / từ chối / trả lại. Mỗi đề xuất chụp bản tính lúc tạo: thu nhập ròng 12 kỳ, tăng trưởng, độ dao động, tập trung bài đầu, mức ứng tối đa theo hạng rủi ro, khoản thu hồi, thời gian thu hồi, phí ứng thu về, phần Haustek giữ trong thời gian thu hồi, ROI; hợp đồng so phần Haustek giữ theo phí hiện tại và phí đề xuất. Duyệt xong tự ghi sổ tạm ứng hoặc áp phí mới từ kỳ mở kế tiếp |
| Tính ROI | `man/roi.js` | Dựng lại bảng tính ROI_Haustek.xlsx: nhập doanh thu danh mục mỗi tháng, khoản ứng (tiền mặt cộng ngân sách truyền thông và sản xuất nếu thu hồi được), tỷ lệ nghệ sĩ hưởng, phần vẫn trả nghệ sĩ trong lúc thu hồi, kỳ hạn, độc quyền, phí môi giới, chi phí bản phát hành. Ra: hoa hồng Haustek mỗi tháng (ô D3), phần giữ lại để thu hồi (G3), số tháng thu hồi (I3), hoa hồng cả kỳ hạn (D5), ROI kỳ hạn (J5), ROI mỗi năm (K5), ROI sau chi phí (J12), phần chưa thu hồi khi hết hạn và ROI thực. Bốn kịch bản: danh mục nền và ba mốc thưởng. Số nhập tay nên chạy được cho đối tác chưa có trên hệ thống; có sẵn thì bấm *Lấy số từ đối tác* |
| Mức trả nền tảng | `man/muc-tra.js` | USD gộp trên 1.000 lượt của từng nền tảng, suy từ báo cáo 3 kỳ và hiệu chỉnh theo thị trường Việt Nam; nhập số thật từng nền tảng hoặc dán CSV để ghi đè, dự báo và giải thích số đổi theo ngay |
| **Hiệu suất** | `man/hieu-suat.js` | Từng người: đã giao, đang làm, đúng hạn, quá hạn, thời gian xử lý trung bình, mức. Bấm một người ra dòng việc của họ, biểu đồ theo tháng, việc đang mở kèm bước quy trình còn dở, và ô đánh giá cuối năm. Tab thứ ba là sổ tay quy trình của cả sáu loại việc. Chỉ Level 1–2 |
| **Hiệu quả vốn** | `man/hieu-qua-von.js` | Tiền tạm ứng đã đi, đã về, còn đọng; đường thu hồi quá khứ nối tiếp dự báo mười hai tháng bằng nét đứt; từng hợp đồng có nhịp thu hồi, số tháng còn cần và có kịp hạn hợp đồng không; lứa ký và tuổi nợ. Chỉ Level 1–2 |
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
| Tổ chức | Level 1–2 mọi khối, không phân theo vai ||||
| Kế toán, Thanh toán, Tạm ứng, Chia sẻ tác quyền | ✓ | ✓ | | | |
| Đối soát & xét duyệt kỳ | ✓ | ✓ | | ✓ | |
| Xét duyệt | ✓ | ✓ (kiểm số) | ✓ (đề xuất của mình) | | |
| Tính ROI hợp đồng | ✓ | ✓ | ✓ | | |
| Đối tác | ✓ | | ✓ (của mình) | | |
| Chiến dịch | ✓ | | ✓ | ✓ | |
| Theo dõi, Nhập báo cáo, Khớp ISRC, Danh mục, Nền tảng | ✓ | | | ✓ | |
| Mức trả nền tảng (biên Haustek) | ✓ | | | | |
| Danh mục (có tab Chất lượng lượt nghe), Phát hành (hỗ trợ chỉ đọc), Quản lý quyền | ✓ | | | ✓ | ✓ |

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

## Vòng 16: mức trả nhập tay quyết định tiền, đối soát lượt nghe hằng ngày

Hai câu trả lời của người dùng, làm thành hai đường đi thật.

### 1 · Mức trả nhập tay là căn cứ trả tiền đối tác

> *"Mức trả: tôi nhập tay vào sau → từ đó bạn có thể tính tiền chi trả cho đối tác."*

Trước vòng này, hai mức trong bảng giá (`per1k` nền tảng trả về, `khach` Haustek
trả đối tác) chỉ dùng cho **dự báo**. Tiền thật vẫn chia theo tỷ lệ hợp đồng.
Nhập một con số rồi không thấy gì đổi thì không ai tin con số ấy.

Nay `splitRec()` đọc bảng giá trước:

```
Nền tảng ĐÃ có mức trả đối tác  →  tiền đối tác = lượt nghe ÷ 1.000 × mức trả
Nền tảng CHƯA có mức            →  giữ nguyên: gộp × (1 − phí Haustek)
```

Cộng lại theo từng bản ghi ra `net`; phần còn lại là `fee` — phần Haustek giữ.
Ba điều đã cân nhắc và viết thẳng vào chú thích trong lõi:

* **Doanh thu GỘP không đổi.** Bảng giá chỉ quyết định số tiền *chảy sang phía
  đối tác*, không đụng vào số nền tảng trả về.
* **Tỷ lệ hợp đồng label ↔ nghệ sĩ không đụng đến.** Bảng giá quyết định tổng
  về phía đối tác; chia tổng ấy giữa label và nghệ sĩ vẫn theo hợp đồng.
* **Không chặn trên.** Hứa trả cao hơn số nền tảng trả về thì phần Haustek giữ
  âm, và màn hiện đúng số âm ấy màu đỏ. Giấu đi thì tháng sau mới biết lỗ.

Chi phí: đường này chỉ bật khi đã có ít nhất một mức trả đối tác
(`coMucTraKhach()`), và kết quả mỗi kỳ được nhớ theo phiên bản
(`NHAP_VER` + bảng ghi đè). Đo trên 50.000 bản ghi: 14ms → 131ms lần đầu,
80ms các lần sau.

**Trang Mức trả** có thêm khối *"Đặt mức này thì kỳ … ra sao"*: từng nền tảng
với lượt nghe, mức thực tế trên 1.000, nền tảng trả về bao nhiêu, trả đối tác
bao nhiêu, Haustek giữ bao nhiêu, và nhãn *Bảng giá* / *Phần trăm*. Bốn ô số
đầu khối, trong đó có **lệch so với cách tính cũ**. Nền tảng nào âm thì dòng
đỏ và có cảnh báo đếm rõ bao nhiêu nền tảng.

**Bảng kê phía đối tác** — trong bảng "Giải thích con số" — gắn nhãn *bảng giá*
lên đúng nền tảng đang chạy theo mức đã ký, và dòng mức trả bình quân nói rõ
"*n* nền tảng chạy theo bảng giá đã ký; số còn lại theo tỷ lệ hợp đồng".
Đối tác vẫn **không** thấy mức nền tảng trả về hay biên — `api-guard` quét mọi
gói của cổng đối tác để bảo đảm điều đó.

### 2 · Đối soát lượt nghe hằng ngày qua đường dẫn store

> *"Mỗi bài hát sau khi phát hành sẽ có đường link dẫn tới nền tảng (store) được
> phát hành. Bạn lấy link đó và cập nhật mỗi ngày (reconcile số, tương tự với kế toán)."*

Làm đúng như sổ kế toán: một bên là số hệ thống, một bên là số đọc được từ
store, chênh lệch nằm giữa, và **mọi bút toán đều gỡ được**.

Hai mức đối soát, ở hai tab của trang **Nhập số liệu**:

| | Đối soát theo ngày | Đối soát theo bài |
|---|---|---|
| Việc | hằng ngày, tám nền tảng | khi một bài trông lạ |
| Số hệ thống | lượt ngày × cơ cấu nền tảng | lượt ngày của bài × cơ cấu của chính bài ấy |
| Đường dẫn | — | link store thật của bài, mở tab mới |
| Ghi | `ghiDoiSoat(ngay, plat, thucTe)` | `ghiDoiSoatBai(i, ngay, plat, thucTe)` |
| Gỡ | `boDoiSoat` | `boDoiSoatBai` |

Ngưỡng lệch là **2%**: dưới thì `khớp`, trên thì `lệch` và dòng đỏ. Việc còn
phải làm hiện ở huy hiệu điều hướng và ở bàn làm việc vận hành.

**Một ngày chỉ có một con số.** `dongBoNgayTuDoiSoat()` giữ nguyên tắc ấy: nền
tảng nào đã đối soát thì lấy số đã gõ, nền tảng còn lại giữ số hệ thống, phần
đuôi giữ tỷ trọng 8%. Không sinh ra con số thứ hai để hai bảng đá nhau.

Tab **Đối soát theo bài** khi chưa gõ gì thì bày sẵn tám bài nghe nhiều nhất
bảy ngày qua — mở ra là có việc làm ngay, gõ tên hoặc ISRC thì đổi sang kết quả tìm.

### Ba lỗi cũ mà vòng này lôi ra

* **Nút "Giải thích" ở bảng kê đối tác không làm gì.** Tay bấm được gắn trong
  nhánh *kỳ chưa mở*, nên đối tác nào có bảng kê thật lại là người bấm không ra
  gì. Nay gắn ở một chỗ dùng chung cho cả hai nhánh.
* **Đối soát theo bài gõ vào thì không gỡ ra được.** Thêm `boDoiSoatBai` và nút
  gỡ ngay cạnh ô nhập.
* **Một phép kiểm cũ để sót bảng giá 4,00 USD.** Trước vòng này vô hại vì bảng
  giá chỉ dùng cho dự báo; nay nó làm mọi phép kiểm sau đó tính tiền trên một
  mức bịa ra. Đã dọn, và thêm một dòng kiểm "bàn phải sạch" để lần sau lỗi này
  kêu lên ngay tại chỗ gây ra.

## Vòng 15: chỗ nhập số liệu, xuất PDF, quy trình từng việc, hiệu quả vốn

Sáu việc, theo đúng sáu điều đối tác vận hành nêu ra.

### 1 · Chỗ nhập số liệu

Trước vòng này, `nap-du-lieu.js` chỉ **đánh dấu** một nguồn là đã nạp bằng một tên
file giả — không có chỗ nào gõ số. Nhưng cách Haustek chạy thật là một điều phối
viên mở OneRPM, Warner, Believe, YouTube CMS rồi gõ số vào. Vòng này dựng đúng chỗ
đó: `man/nhap-so-lieu.js` cộng mục **21b** trong lõi.

Ba mức, mức sau đè lên mức trước:

| Mức | Cái gì | Hiệu lực |
|---|---|---|
| máy sinh | ước tính khi báo cáo chưa về | thấp nhất |
| tổng của một nguồn trong một kỳ | số lấy thẳng trên báo cáo | phần chưa gõ theo bài co giãn để cộng lại đúng bằng nó |
| số của từng bài | dòng riêng trên báo cáo | tuyệt đối, không ai chia lại |

Tab *Doanh thu theo bài* còn một ô **dán từ bảng tính**: bôi đen cột ISRC và cột
tiền trên báo cáo rồi dán vào, mỗi dòng một bài. Dòng nào không tra được ISRC hay
số tiền không hợp lệ thì bị bỏ qua và **liệt kê trả lại** kèm số dòng và lý do —
không nuốt im lặng. Gõ tay bốn mươi dòng và dán bốn mươi dòng là khác nhau một
buổi làm.

Gõ tổng vào là nguồn đó được đánh dấu **đã nạp**, ghi rõ do người nhập chứ không
phải do file. Mỗi dòng gõ giữ lại số trước đó, nên nút *Gỡ* trả số về đúng mức cũ.
Kỳ đã xét duyệt bị khoá — sổ đã chốt thì không ai gõ đè.

Lượt nghe đi đường khác: phần mềm tự cập nhật những ngày đã có số, điều phối viên
chỉ gõ những ngày nguồn chưa về (thường là một tới hai ngày gần nhất). Sửa tổng của
một ngày thì cả ngày co giãn theo, nên biểu đồ ngày, dự báo và trang Theo dõi cùng
đọc một con số.

### 2 · Xuất PDF thật

`HM.banIn({ tieuDe, phu, ky, than, nguoi, chan })` mở một overlay khổ giấy — người
dùng **nhìn thấy đúng thứ sắp ra giấy** trước khi bấm In. Nút In gọi `window.print()`;
CSS `@media print` khi `body.dang-in` chỉ để lại tờ giấy. Không dựng bộ sinh PDF
riêng: trình duyệt nào cũng có sẵn "In → Lưu thành PDF", việc cần làm là dựng đúng
cái trang được in.

Có ở: bảng kê đối tác (đối tác **tự xuất**, không phải chờ Haustek tải lên), bảng
chi trả kỳ để kế toán trình ký, hồ sơ tranh chấp để gửi nền tảng, nhật ký nhập số
liệu, bảng hiệu suất nhân viên, và báo cáo hiệu quả vốn.

### 3 · Quy trình từng bước, và bám theo từng việc

Mục **21c** trong lõi giữ sáu quy trình: tranh chấp (10 bước), nhập số liệu hằng
ngày (5), phát hành (6), ticket (4), chi trả kỳ (5), đề xuất (4). Mỗi bước có tên,
mô tả, số giờ cho phép, và *báo cho ai*.

Bước **không** phải trạng thái. Trạng thái là thứ hệ thống tự đổi khi dữ liệu đổi;
bước là thứ con người đánh dấu đã làm. Hai thứ đi song song và soi lẫn nhau: việc
đã "xong" mà bước còn dở là dấu hiệu người làm bỏ qua bước — thường là bước gom
bằng chứng.

`HTS.soTay(c, id)` vẽ quy trình để đọc; `HTS.buocViec(c, id, viecId)` vẽ đúng quy
trình ấy bám vào một việc cụ thể, có thanh tiến độ và nút đánh dấu; `HTS.ganBuoc`
gắn nút. Đã gắn ở: ngăn khiếu nại, ngăn ticket, ngăn hồ sơ phát hành, trang chi trả
(theo kỳ), bàn làm việc của vận hành (theo ngày).

### 4 · Hiệu suất nhân viên

`man/hieu-suat.js` (mục **21d** trong lõi). Ba nguồn việc có chủ và có hạn — ticket
hỗ trợ, khiếu nại bản quyền, và mỗi lần một người đẩy hồ sơ phát hành sang bước sau
— gộp thành một dòng việc cho mỗi người.

Cố ý **không chấm một điểm tổng**. Một con số duy nhất giấu mất chuyện người này
nhận toàn việc khó. Bốn cột đứng cạnh nhau (đã giao · đang làm · đúng hạn · quá hạn)
cộng thời gian xử lý trung bình, rồi người quản lý tự kết luận. Ô đánh giá cuối năm
để trống cho người quản lý viết; hệ thống chỉ giữ.

### 5 · Hiệu quả sử dụng vốn

`man/hieu-qua-von.js` (mục **21e**). Quá khứ đọc thẳng từ bảng chi trả các kỳ đã
chốt sổ, không ước lượng. Tương lai nối tiếp bằng nhịp thu hồi ba kỳ gần nhất của
đúng đối tác ấy, vẽ nét đứt.

Sáu con số đầu bảng: đã giải ngân · đã thu hồi · còn đọng · tỷ lệ thu hồi · doanh
thu trên mỗi đô vốn · thời gian hoà vốn trung bình. Bảng từng hợp đồng nói thẳng
cái người ký hợp đồng cần biết: theo nhịp này còn cần bao nhiêu tháng, và hợp đồng
còn bao nhiêu tháng — **có kịp hay không**. Thêm phân lứa theo năm ký và tuổi nợ
của phần chưa thu.

Một giả định có nói rõ trên màn: ngày giải ngân lấy theo ngày ký hợp đồng, vì bản
mẫu chưa giữ ngày chuyển tiền riêng.

### 6 · Chú thích vào một ký hiệu

Dấu `?` vốn đã dùng cho tiêu đề trang và tiêu đề thẻ, nay dùng cho cả nhãn ô nhập
và đầu cột: `HM.hoi(chu)`. Bỏ hẳn dòng `.fhint` dưới mỗi ô ở trang ROI, ở bộ dựng
biểu mẫu `HTM.hoiForm` và ở biểu mẫu hồ sơ phát hành — biểu mẫu hồ sơ có hơn ba
mươi ô, in hết chú thích ra thì dài gấp đôi mà chẳng ai đọc. Một ký hiệu cho cả sản
phẩm: đọc quen một chỗ là quen mọi chỗ.

### Dọn theo

Bàn làm việc của vận hành còn hai lối tắt tới *Giao nhận* và *Sửa hàng loạt* — hai
trang đã bỏ ở vòng 14 — nên bấm vào không ra gì. Đã thay bằng lối tắt tới Nhập số
liệu, cộng hai ô số *ngày chờ nhập* và *nguồn chưa có số*, cộng khối quy trình hằng
ngày đánh dấu được tại chỗ.

## Vòng 14: hết phẳng, sáu cấp tổ chức, hai mức trả, mốc theo hoà vốn

**Huy hiệu tiêu đề.** Tên mỗi khối nằm TRONG một huy hiệu có icon và nền tô,
thay vì là một dòng chữ đen trên nền trắng. Đầu thẻ có dải nền và đường kẻ
dưới, nên mắt tách được "nhãn của khối" khỏi "nội dung" mà không cần đọc.
Nhãn ô số cũng thành huy hiệu, nhỏ và nhạt hơn.

Icon và màu **suy từ chính tên khối** (`HM.suyHieu`) chứ không bắt mỗi thẻ
tự khai: sản phẩm có hơn hai trăm thẻ, khai tay thì vừa sót vừa lệch nhau.
Bảng từ khoá đọc theo thứ tự, từ hẹp trước từ rộng, để "quá hạn thanh toán"
ra cảnh báo chứ không ra tiền. Thẻ nào cần khác vẫn khai đè `icon` / `mau`.

Tương phản nâng một bậc: nền trang tối hơn (`#F2F4F7` → `#EBEEF3`), viền thẻ
đậm hơn, bóng hai tầng thay cho một tầng `.04` gần như vô hình, và chế độ tối
tách tầng rõ hơn. Một cái bẫy gặp ngay: số đếm trong ngoặc ở tiêu đề thẻ pha
mờ 72% trên nền tô của huy hiệu chỉ còn **1,53:1** — bài đo tương phản bắt
được; muốn nhẹ hơn thì giảm độ đậm chứ không giảm màu.

**Bốn trang bỏ đi.** Giao nhận nền tảng, Sửa hàng loạt, Bảng giá nền tảng:
chưa cần ở giai đoạn này. Chất lượng lượt nghe không bỏ mà **gộp vào Danh
mục bài hát** thành một tab — số liệu lượt nghe là số liệu của bài hát, để
riêng một trang thì không ai hiểu nó là gì. Nội bộ còn 22 trang.

**Sáu cấp tổ chức, số nhỏ là cấp cao.**

| Level | Chức danh |
|:-:|---|
| 1 | Giám đốc |
| 2 | Quản lý · Trưởng bộ phận |
| 3 | Trưởng nhóm |
| 4 | Chuyên viên |
| 5 | Nhân viên |
| 6 | Thực tập sinh |

Hệ thống dừng ở Level 6: sâu hơn thì không ai còn biết ai báo cáo cho ai.
Cách đánh số này NGƯỢC với bản cũ (0 thấp, 3 cao) nên mọi phép so đã đảo
dấu — `laTruong` giờ là `cap <= 2`.

Trang Tổ chức chặn theo **cấp**, không theo vai (`MAN_CAP`): trưởng bộ phận
kinh doanh cũng là quản lý và phải vào được, còn chuyên viên cùng vai thì
không. Chặn theo vai sẽ chặn nhầm cả hai chiều. Tab Nhân sự có một hàng sáu
bậc kèm số người mỗi bậc, bậc trống thì nhạt hẳn.

**Mức trả nền tảng giữ hai số, và là chỗ nhạy nhất sản phẩm.**

| | Ví dụ |
|---|---|
| `per1k` nền tảng trả về Haustek | 4,40 USD / 1.000 lượt |
| `khach` Haustek trả đối tác | 4,00 USD / 1.000 lượt |
| biên | 0,40 · 9,1% |

Trang chỉ Level 1–2 mở được, và `platformRatesFull` / `setPlatformRate` chuyển
sang nhóm hàm `tong` (giám đốc). `api-guard` quét **mọi hàm của cổng đối tác
nhận (role, partyId)** và đòi không gói nào mang `khach`, `bien` hay `bienPct`.

Còn một câu chưa chốt: mức trả đối tác hiện được **ghi và hiển thị**, chưa nối
vào đường tính tiền thật — tiền trả đối tác vẫn đi theo phần trăm phí Haustek.
Hai cơ chế biên chồng nhau thì trả thiếu, nên phải chốt cái nào thắng.

**Mốc thưởng mở khoá theo hoà vốn, không theo lịch.** Khoản ứng gốc hoà vốn
xong thì mốc 1 mới được ứng; mốc 1 hoà vốn xong mới tới mốc 2. Đây là cách
duy nhất giữ cho Haustek không ôm hai khoản ứng chưa thu hồi cùng lúc trên
một đối tác. "Trong vòng N tháng" vì thế là **hạn chót** chứ không phải lịch
trả: hoà vốn muộn hơn N thì mốc đó không mở, và mọi mốc sau khoá theo dây
chuyền. Bảng bốn kịch bản hiện cột *Mở khoá* kèm lý do khoá ngay trong dòng.

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
