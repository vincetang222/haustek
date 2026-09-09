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

## Hai mươi tám trang nội bộ

| Trang | File | Trả lời câu gì |
|---|---|---|
| Tổng quan | `man/tong-quan.js` | Kỳ này đóng được chưa, tiền chia đi đâu, còn gì treo |
| **Tác quyền** | `man/xuat-ban.js` | Tác phẩm (ISWC) tách khỏi bản ghi (ISRC), tác giả và tỷ lệ, và đăng ký với mười bảy hội tác quyền. Bốn tab: tiền đang để trên bàn (lãnh thổ có doanh thu mà chưa đăng ký ở hội của lãnh thổ ấy); việc còn phải làm xếp theo tiền; bảng tác phẩm có ngăn chi tiết sửa được tác giả, tỷ lệ và trạng thái từng hội; nhập bảng xuất của Sentric. Tổng tỷ lệ tác giả phải đúng 100% và phải có ISWC mới gửi đăng ký được. Vận hành, kế toán và giám đốc |
| **Phiếu giao việc** | `man/phieu-giao.js` | Chỗ nhân viên chép metadata sang OneRPM và các tool khác. Bốn tab: Metadata xếp đúng thứ tự năm bước của OneRPM, mỗi trường một nút chép; Tool là bảng tick đã đẩy lên đâu, ai đẩy, tool trả về mã gì; Store chọn nền tảng sẽ phân phối tới; Link dán đường dẫn store thật của từng bài sau khi lên kệ, khoá theo ISRC, dán nhầm cột bị chặn tại chỗ. Chưa tick tool nào thì không đánh dấu phát hành được. **Vận hành thấy nút; giám đốc chỉ thấy tiến độ** — dải ô số chỗ tắc, cột đọng bao nhiêu ngày, ai chạm gần nhất — vì giám đốc xét duyệt chứ không làm tác vụ hằng ngày |
| **Nhập số liệu** | `man/nhap-so-lieu.js` | Chỗ điều phối viên ngồi mỗi ngày. Năm tab: lượt nghe hằng ngày (ngày nào nguồn chưa về thì gõ tổng vào), doanh thu theo kỳ × nguồn (gõ tổng lấy trên báo cáo OneRPM / Warner / Believe / YouTube CMS), doanh thu theo từng bài (khi báo cáo có dòng riêng), nhật ký nhập có nút gỡ. Số gõ tay đè lên số máy sinh |
| Nhập báo cáo | `man/nap-du-lieu.js` | Kỳ nào thiếu nguồn nào: bảng 12 kỳ × 4 nguồn |
| Khớp ISRC | `man/khop-isrc.js` | Tiền chưa có chủ nằm ở đâu, khớp về ai |
| Đối soát & xét duyệt kỳ | `man/doi-chieu.js` | Tổng hệ thống có khớp file gốc không, xét duyệt được chưa |
| Phát hành | `man/phat-hanh.js` | Hồ sơ phát hành đối tác gửi lên: tiếp nhận → cấp ISRC/UPC → đã phát hành, hoặc trả lại bổ sung |
| **Kế toán** | `man/ke-toan.js` | Bút toán kỳ, công nợ bên thụ hưởng, tạm ứng phải thu, ghi nhận 12 kỳ, thuế |
| Thanh toán | `man/chi-tra.js` | Ba tab: thanh toán theo kỳ (bên nào được bao nhiêu, vì sao phần còn lại chưa thanh toán được); yêu cầu rút tiền của đối tác (tiếp nhận, chuyển khoản, số tham chiếu, từ chối, tạo hộ); bảng kê PDF từng bên thụ hưởng theo kỳ |
| Tạm ứng | `man/tam-ung.js` | Ai còn nợ, thu hồi tới đâu, còn mấy kỳ nữa |
| Tỷ lệ chia | `man/ty-le.js` | Bảng tỷ lệ có ngày hiệu lực, đổi từ kỳ nào |
| Danh mục | `man/danh-muc.js` | 50.000 bản ghi, tìm được, lọc bản có vấn đề; mở ra xem dòng tiền, quy trình phát hành, trạng thái từng nền tảng, lượt nghe và doanh thu theo nền tảng theo tháng |
| Nền tảng | `man/nen-tang.js` | Toàn danh mục: từng nền tảng mang về bao nhiêu lượt nghe, bao nhiêu tiền mỗi kỳ; kỳ thiếu nguồn nào thì cột đó bằng 0. Thẻ *Trong "Nền tảng khác" có gì* bóc riêng 210 nền tảng nhỏ, có ô tìm và xuất CSV |
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
| Mức trả nền tảng | `man/muc-tra.js` | Bảng giá của công ty: nền tảng trả về bao nhiêu trên 1.000 lượt, và Haustek chào khách bao nhiêu. Bảng giá quy lượt nghe ra doanh thu ghi nhận, rồi phí % hợp đồng mới cắt trên số ấy — hai thứ khác hẳn nhau. Khối tác động bày năm số của kỳ gần nhất và hai dòng thu nhập tách rời: phí hợp đồng và chênh lệch bảng giá |
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
| Nền tảng | `man/k-nen-tang.js` | Từng nền tảng mang về bao nhiêu lượt nghe, bao nhiêu tiền mỗi tháng, cho cả tài khoản; bóc được cả dòng "Nền tảng khác" ra từng nền tảng nhỏ |
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
node test/chuoi-thieu.js                                # đọc tĩnh: khoá gọi mà chưa khai, khoá lệch một thứ tiếng
node test/goi-du-trang.js                               # bản gói có đúng mọi trang của hai cổng
node test/roi-cong-thuc.js                              # công thức ROI đối chiếu bảng tính gốc
node test/roi-man.js                                    # trang ROI trên mặt: số, dải kết luận, cảnh báo rủi ro
node test/vong19-man.js                                 # vòng 19: khoá lọt, vai giao việc, rủi ro, nền tảng nhỏ, bảng hết phẳng
node dung-goi.js && node test/v2-nhu-artifact.js && node test/v2-khong-mang.js   # bản gói chạy trong trình xem, không mạng
```

Chạy trọn bộ trước khi công bố; `vong15-man.js` … `vong19-man.js` là bài kiểm
riêng của từng vòng, giữ lại để vòng sau không phá vòng trước.

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
| Mức trả nền tảng (chênh lệch bảng giá) | ✓ | | | | |
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

## Vòng 20: phí Haustek và streaming rate là hai thứ khác hẳn nhau

Đây là sửa một lỗi mô hình, không phải thêm tính năng. Vòng 16 gộp nhầm hai
khái niệm, và cái nhầm ấy đi thẳng vào chuỗi tiền.

### Cái nhầm

| | Là gì | Ai quyết định | Đổi khi nào |
|---|---|---|---|
| **Streaming rate** | giá Haustek đưa ra cho mỗi nền tảng, USD / 1.000 lượt | bảng giá của **công ty**, chung cho mọi khách | ký lại với nền tảng, hoặc đổi chính sách giá |
| **Phí Haustek** | phần trăm thoả thuận trong hợp đồng | **từng khách một** | ký lại hợp đồng với khách ấy |

Vòng 16 viết:

```js
const net = kh == null ? gross - gross * feeOf(i) : kh;   // kh = lượt ÷ 1000 × rate
const fee = gross - net;                                   // ← phí thành SỐ DƯ
```

Hễ một nền tảng có giá, **phí hợp đồng thôi không còn là phần trăm đã ký** —
nó thành phần còn lại sau khi trừ bảng giá. Ba hệ quả:

* Trang Mức trả tự định nghĩa "biên là chênh lệch hai mức", tức là coi bảng
  giá chính là cách Haustek ăn tiền.
* `setPlatformRate` chặn `khách > nền tảng`. Chặn ấy chỉ có nghĩa nếu bảng giá
  là cách chia biên; nếu nó là điều khoản thương mại thì chào cao hơn tháng ấy
  thu về là **rủi ro cần cảnh báo**, không phải lỗi nhập liệu.
* Hai số cùng tên `per1k`: mức nền tảng trả về Haustek, và số ròng của đối tác
  trên 1.000 lượt. Trùng tên là bước đầu của lẫn nghĩa.

### Mô hình đúng: hai thứ áp THEO THỨ TỰ

Bảng giá trước, phí sau. Thứ tự ngược lại không đứng được — hai số sẽ không
cộng lại thành gộp và một trong hai lại thành số dư.

```
gộp ghi nhận = Σ (lượt nghe nền tảng j ÷ 1.000 × giá nền tảng j)
phí Haustek  = gộp ghi nhận × phí% của hợp đồng
đối tác nhận = gộp ghi nhận − phí Haustek
```

Nền tảng nào chưa có giá thì phần của nền tảng ấy lấy thẳng gộp thật làm số
ghi nhận, nên bật dần từng nền tảng được.

**Haustek do đó có hai dòng thu nhập, và chúng phải đọc được tách rời:**

| Dòng | Công thức | Dấu | Sửa gì thì nó đổi |
|---|---|---|---|
| Phí hợp đồng | gộp ghi nhận × phí% | luôn dương | ký lại hợp đồng |
| Chênh lệch bảng giá | gộp thật − gộp ghi nhận | **âm được** | đổi bảng giá |

Gộp hai số ấy thành một con số "biên" là mất khả năng biết mình lãi nhờ đâu:
nhờ phí đã ký, hay nhờ chào thấp hơn số nền tảng trả về.

### Trên một kỳ thật

Đặt giá Spotify bằng 85% mức nền tảng trả về, kỳ 08/2025:

```
gộp thật              $155.994
gộp ghi nhận          $149.426
  phí hợp đồng         $22.414   (15,0% — bình quân có trọng số của các hợp đồng)
  trả đối tác         $127.012
chênh lệch bảng giá     $6.568
Haustek giữ            $28.982  =  $22.414 + $6.568
```

Hai phép kiểm luôn phải đúng: `gộp ghi nhận = phí + trả đối tác`, và
`gộp thật = gộp ghi nhận + chênh lệch bảng giá`.

### Những gì đã đổi

* `splitRec()` trả thêm `ghiNhan`, `bienGia`, `phiPct`; `fee` nay là
  `ghiNhan × phiPct`, **không bao giờ** là số dư.
* `agg()` mang theo `ghiNhan` và `bienGia`; `revenueAgg()` cho label trừ phí
  trên **gộp ghi nhận** chứ không trên gộp thật.
* `mucTraTacDong()` trả `ghiNhan`, `phi`, `phiPct`, `bienGia`, `giuLai` — và
  `phiPct` là **bình quân có trọng số theo doanh thu** của các hợp đồng, không
  phải `CFG.HAUSTEK_FEE` lấy làm đại diện.
* `setPlatformRate()` bỏ chặn `khách > nền tảng`; số 0 và số âm vẫn chặn.
* Đổi tên cho hết trùng nghĩa: `bien` → `bienGia`, và `per1k` của đối tác →
  `netTren1k` (dự báo: `tren1k` / `netTren1k`). Từ nay `per1k` **chỉ** có
  nghĩa "nền tảng trả về Haustek".
* `FORBIDDEN` thêm `ghiNhan` và `bienGia`: `bienGia = gộp thật − gộp ghi nhận`,
  nên lọt một trong hai là đối tác suy ngược ra được nền tảng trả Haustek bao
  nhiêu. Chặn cứng ở `scrub()`.

### Chênh lệch tính riêng trong sổ kế toán

Hai dòng thu nhập nằm ở **hai tài khoản khác nhau**, vì hai thứ khác nhau
quyết định chúng và chúng sửa được độc lập:

| TK | Tên | Do cái gì quyết định |
|---|---|---|
| **511** | Doanh thu cung cấp dịch vụ (phí dịch vụ Haustek) | phần trăm trong hợp đồng |
| **5118** | Chênh lệch bảng giá nền tảng | bảng giá của công ty |

Bút toán ghi nhận doanh thu kỳ vì thế có năm dòng, không phải bốn. Bên Nợ
là số **nền tảng trả về**; ba dòng Có đầu chia theo **gộp ghi nhận**; phần
lệch giữa hai bên là chênh lệch bảng giá, đứng riêng ở 5118:

```
Nợ  131  Phải thu từ nền tảng             $153.977,46
Có  511  Phí dịch vụ theo hợp đồng         $22.254,24
Có  3311 Phải trả label                    $26.611,57
Có  3312 Phải trả nghệ sĩ                  $99.492,95
Có  5118 Chênh lệch bảng giá                $5.618,70
                                          ────────────
                        Tổng Nợ = Tổng Có $153.977,46
```

Chênh lệch **âm** thì dòng 5118 chuyển sang bên **Nợ** — một khoản giảm trừ
doanh thu, không phải một khoản phí — và sổ vẫn cân.

**Kế toán thấy tổng, không thấy bảng giá.** Họ phải đọc được tổng chênh lệch
để ghi sổ, nhưng bảng giá từng nền tảng vẫn là số Level 1–2: `agg()` trả
`bienGia` cho mọi vai nội bộ, còn `mucTraTacDong()` và `platformRatesFull()`
vẫn chặn ở nhóm `tong`. api-guard kiểm cả hai chiều.

### Bài kiểm giữ cho lỗi không quay lại

`api-guard` có hai phép mới, và phép quan trọng nhất là phép chứng minh phí
**không** phải số dư:

```js
must(Math.abs(sau.ghiNhan - sau.fee - sau.artist - sau.labelCut) < 2,
  "chuỗi phải cân trên GỘP GHI NHẬN");
must(sau.gross - sau.fee - sau.artist - sau.labelCut > 1,
  "chuỗi cân trên gộp THẬT nghĩa là phí lại đang là số dư");
must(Math.abs(tyLePhi - truoc.fee / truoc.ghiNhan) < 0.005,
  "đổi bảng giá mà TỶ LỆ phí đổi theo — phí đang bị bảng giá quyết định");
```

Cùng với: chào đúng mức thực tế thì chênh lệch về 0 **nhưng phí vẫn còn**
(nếu phí biến mất theo thì phí đang là chênh lệch trá hình); chào cao hơn thì
chênh lệch âm **nhưng phí vẫn dương** (hai dòng đã tách rời); và chào cao hơn
mức nền tảng trả về thì lưu được, chỉ số 0 và số âm mới bị chặn.

Một phép riêng cho sổ kế toán: ba dòng Có phải cân với **gộp ghi nhận**, và
nếu chúng đã cân với **gộp thật** thì chênh lệch đang bị nhét vào phí và tài
khoản 5118 không còn lý do tồn tại.

## Vòng 19: ứng theo số tháng, cảnh báo rủi ro, nền tảng nhỏ, giao việc theo vai

### 1 · Khoản ứng đo bằng SỐ THÁNG doanh thu, không phải phần trăm

Trước vòng này, trần tạm ứng là một tỷ lệ phần trăm của thu nhập ròng mười
hai tháng dự kiến (60 / 45 / 30% theo hạng). Cách nói ấy sai với thị trường:
đối tác ứng **12 đến 18 tháng thu nhập**, và họ nghĩ bằng tháng chứ không
nghĩ bằng phần trăm.

| Hạng rủi ro | Trần | Nghĩa là |
|---|---|---|
| A | **18 tháng** | thu nhập đều, tăng, không dồn vào một bài, đủ 6 kỳ có số |
| B | **15 tháng** | ở giữa |
| C | **12 tháng** | dao động lớn, giảm mạnh, dồn vào một bài, hoặc dưới 3 kỳ có số |

`advanceCalc()` trả thêm ba trường: `capThang` (trần theo tháng),
`monthlyForward` (thu nhập ròng một tháng đã chỉnh theo đà tăng), và
`ungThang` (khoản đang xét bằng bao nhiêu tháng). Trần đúng bằng
`monthlyForward × capThang`, api-guard kiểm tới từng đô la.

**Phí ứng 12% là chuyện khác hẳn** và không được lẫn vào: nó cộng vào khoản
phải thu hồi, không phải quy mô khoản ứng.

### 2 · Cảnh báo rủi ro: sàn ROI 20%, mốc 12 tháng, trần 28 tháng

Một khoản ứng lãi 18% mà mười tám tháng mới về đủ thì trên giấy vẫn là số
dương — nhưng đó là mười tám tháng vốn nằm im. `roiRuiRo(roi, thang)` chấm
ba mức, và trang ROI bày thẻ cảnh báo **ngay dưới dải ô số, trước mọi bảng**:

| Mức | Khi nào |
|---|---|
| `ok` | ROI ≥ 20% và hoàn vốn trong 12 tháng |
| `canh` · Cần cân nhắc | ROI < 20% **hoặc** hoàn vốn quá 12 tháng |
| `cao` · Rủi ro cao | hoàn vốn quá **28 tháng**, hoặc không hoàn vốn trong kỳ hạn |

Cảnh báo nói cả con số lẫn ngưỡng ("ROI 12%, dưới sàn 20%" · "Hoàn vốn ở
tháng 41, quá trần 28 tháng"), hai thứ tiếng. `dealRoiScenarios()` cũng chấm
cho cả bốn kịch bản cộng lại, hiện ở dòng tổng.

**Cảnh báo bị giấu đúng những vai đã bị giấu ROI.** Câu "ROI 12%, dưới sàn
20%" nói thẳng con số, nên `ruiRo` nằm trong `CALC_AN` của kinh doanh và kế
toán — nếu không thì cảnh báo trở thành lối rò số qua cửa sau. Giám đốc thấy
đủ; api-guard kiểm cả ba vai.

### 3 · Hơn hai trăm nền tảng nhỏ: bóc ra được, cộng lại khớp

Tám nền tảng lớn đứng riêng, 210 nền tảng còn lại gộp thành một dòng "Nền
tảng khác". Gộp thì bảng mới đọc được — nhưng gộp xong mà không có chỗ nào
bóc ra thì không ai trả lời được câu đơn giản nhất: *tháng này Deezer về bao
nhiêu*.

`platformTail(role, partyId, pIdx)` bóc đúng dòng ấy cho một kỳ. Nó **lấy
chính con số của dòng "Nền tảng khác" làm mốc rồi chia xuống**, chứ không
tính lại theo đường khác rồi hy vọng hai bên gặp nhau: tổng khớp tới từng
xu và từng lượt nghe, api-guard kiểm.

Thẻ *Trong "Nền tảng khác" có gì* có ở cả hai cổng — trang Nền tảng nội bộ
(doanh thu gộp, lượt nghe, tỷ trọng đuôi, xuất CSV) và trang Nền tảng của
đối tác (chỉ số ròng của họ, không có gộp, không có phí). Cả hai có ô tìm
theo tên.

### 4 · Giao việc: giám đốc xét duyệt, vận hành làm

Giám đốc **đa số là xét duyệt**, không tick từng tool hay dán từng link.
Phiếu giao việc vì thế đổi mặt theo vai qua một cờ duy nhất (`coLam()`),
không rải điều kiện khắp nơi rồi sót một chỗ:

| | Vận hành | Giám đốc |
|---|---|---|
| Dải ô số tiến độ | — | **có**: chưa đẩy tool nào · chờ dán link · đọng lâu nhất · đang theo dõi |
| Cột "Đọng (ngày)" và "Chạm gần nhất" | — | **có** |
| Nút chép từng ô metadata, chép cả khối | có | — |
| Nút đánh dấu đã đẩy tool | có | — |
| Ô dán link, nút lưu / bỏ link | có | — (link hiện thành liên kết đọc được) |
| Tick chọn store, nút lưu danh sách | có | — (khoá) |

Giám đốc vẫn đọc được **toàn bộ** tình trạng: tool nào xong, ai làm, lúc
nào, link nào đã có. Chỉ mất nút bấm.

### 5 · Bảng hết phẳng: tăng tương phản của khung, không chỉ của chữ

Chữ đạt WCAG AA mà bảng vẫn đọc ra một mảng xám, vì **đường kẻ** giữa hai
dòng chỉ 1,15:1 so với mặt thẻ. Vòng này nâng cả khung:

* đường kẻ giữa hai dòng **1,30:1**, kẻ dưới đầu cột và trên dòng tổng dày
  **2px** thay vì 1px
* dải đầu cột tách hẳn khỏi mặt thẻ, chữ đầu cột **đậm 600** và dùng mực
  chính thay vì mực phụ
* ba tầng trong một dòng: cột đầu là **danh tính** (đậm 500, mực chính), cột
  số là **số** (mực chính, chữ số đều bề ngang), dòng nhỏ dưới tên là **phụ**
  (mực nhạt)
* dòng tổng đóng bảng lại: nền đậm hơn thân, kẻ trên dày, chữ đậm

Nền đậm thêm một bậc thì chữ trên nền ấy phải đậm theo, nếu không nó tụt
xuống dưới AA — `--ink-2`, `--faint`, `--link` và `--ok` đều đã chỉnh lại và
`v2-tuong-phan.js` xác nhận cả hai chế độ vẫn sạch. `vong19-man.js` đo trực
tiếp trên trang: độ tương phản của dải đầu cột, độ dày kẻ, độ đậm chữ đầu cột.

### 6 · Hai chỗ tên khoá lọt ra màn hình, và bài kiểm chặn tái diễn

Trang Phiếu giao việc in ra chữ `cachMo`, `c1`, `dsTool` — mười một khoá
chưa khai. Trang Nghệ sĩ xuất CSV với đầu cột `diemProducer`, một chuỗi đã
bỏ từ vòng 13. Không bài kiểm nào bắt được, vì `t('k')` không khai thì trả
lại chính tên khoá chứ không ném lỗi.

`portal/test/chuoi-thieu.js` đọc tĩnh cả 45 trang: bóc `chu.vi` / `chu.en`
(gỡ được cả kiểu `chu: CHU`), thu mọi lời gọi `t('…')` của chính trang ấy
(không tính `HTS.t` / `HTM.t`), rồi báo khoá **gọi mà chưa khai**, khoá
**chỉ có một thứ tiếng**, và khoá khai mà không dùng. 2.941 khoá tiếng Việt,
sạch. `vong19-man.js` kiểm thêm trên mặt: phần tử nào có nội dung là một
định danh camelCase thì đó là khoá lọt (trừ tên nền tảng thật như
`iHeartRadio`, lấy từ chính danh sách store của lõi).

### 7 · Ba chỗ nhỏ

* **Link ADA** đúng là `https://www.ada-music.com/`.
* **Sentric và Believe chung công ty chủ quản nhưng hoạt động tách bạch**:
  hợp đồng riêng, người phụ trách riêng, kỳ báo cáo riêng. Có tài khoản
  Believe **không** có nghĩa là có sẵn đường vào Sentric.
* Chú thích rời được thu vào dấu **?** cạnh tiêu đề ở trang Tạm ứng nội bộ,
  ngăn Tạm ứng của đối tác, và thẻ danh sách store trong Phiếu giao việc.

## Vòng 18: tác quyền — tác phẩm, đăng ký với hội, và tiền đang để trên bàn

Mảng này **khác hẳn** bản ghi, và lẫn hai thứ ấy là lỗi tốn tiền nhất trong
ngành:

| | Bản ghi (recording) | Tác phẩm (work) |
|---|---|---|
| Mã | **ISRC** | **ISWC** |
| Là gì | ai hát, ai thu | ai sáng tác |
| Tiền từ đâu | store (Spotify, Apple…) | hội tác quyền từng nước |
| Ai lo | OneRPM / Believe / ADA | **Sentric** |

Một tác phẩm đẻ ra nhiều bản ghi: bản gốc, bản live, bản cover của người
khác. Tiền tác quyền bám theo **tác phẩm**, nên một bài được cover mười lần
thì tác giả vẫn ăn cả mười.

### 1 · Tiền đang để trên bàn

Đây là con số đáng giá nhất của cả trang, và là lý do trang này tồn tại.

Muốn thu tiền tác quyền ở một nước thì tác phẩm phải **đăng ký với hội của
nước ấy**. Chưa đăng ký thì hội **vẫn thu tiền** — nhưng không biết trả cho
ai, nên giữ trong quỹ chưa phân phối, và sau ba tới năm năm là mất hẳn.

`tienTrenBan(w)` bắt chéo hai thứ: lãnh thổ nào đang **có doanh thu**, và
tác phẩm đã đăng ký ở hội nào. Chỗ giao nhau là tiền đang hở. Bản đồ lãnh
thổ → hội có mười lăm nước:

```
Việt Nam → VCPMC       Hoa Kỳ → ASCAP + The MLC   Anh → PRS
Nhật → JASRAC          Hàn Quốc → KOMCA           Đức → GEMA
Pháp → SACEM           Úc → APRA AMCOS            Canada → SOCAN
Đài Loan → MÜST        Thái Lan → MCT             Singapore → COMPASS
Brazil → UBC/ECAD      Mexico → SACM              Indonesia → WAMI
```
cộng YouTube Content ID cho toàn cầu — mười bảy hội cả thảy.

### 2 · Trang Tác quyền, bốn tab theo thứ tự đáng lo

* **Tiền để trên bàn** — tác phẩm nào hở lãnh thổ nào, xếp theo tiền
* **Việc còn phải làm** — ba nhóm, mỗi nhóm xếp theo **tiền** chứ không theo
  bảng chữ cái: chưa có ISWC; tỷ lệ tác giả không đủ 100%; hồ sơ bị hội trả
  lại (từ chối hoặc trùng lặp)
* **Tác phẩm** — tra cứu, lọc, mở ngăn chi tiết: tác giả và tỷ lệ, danh sách
  bản ghi, và ma trận đăng ký mười bảy hội với trạng thái đặt tay đè được
* **Nhập từ Sentric** — dán bảng xuất vào

Hai luật cứng trong lõi:

* **Tổng tỷ lệ tác giả phải đúng 100%** mới ghi được. Hội tác quyền nào cũng
  trả lại hồ sơ không đủ 100%, nên chặn ở đây rẻ hơn chặn sau ba tháng.
* **Chưa có ISWC thì chưa gửi đăng ký được.** Xin mã qua Sentric trước.

### 3 · Nối với Sentric

`nhapSentric()` nhận bảng bốn cột `ISRC · ISWC · Mã hội · Hội`, tra ISRC
ngược về tác phẩm, ghi ISWC và trạng thái đăng ký. Dòng nào không tra được
thì **trả lại kèm lý do** chứ không nuốt.

Thứ tự nên hỏi Sentric khi lên thật:

1. **Có API hoặc giao file SFTP cho khách label không** — hỏi người phụ trách
   tài khoản. Sentric và Believe **chung công ty chủ quản nhưng hoạt động
   tách bạch**: hợp đồng riêng, người phụ trách riêng, kỳ báo cáo riêng, số
   liệu không chảy qua nhau. Đừng cho rằng có tài khoản Believe là có sẵn
   đường vào Sentric — phải mở đầu mối riêng.
2. Không có API thì **xuất CSV theo kỳ**, máy chủ Haustek tự tải mỗi tháng.
3. Cuối cùng mới là **dán tay** như hàm hiện nay.

Cả ba đường đều đổ vào đúng một bảng, nên đổi đường không phải viết lại
trang.

### 4 · Cổng đối tác: tác giả thấy tài sản của mình

Tab Tác quyền ở trang *Bài hát của tôi* có thêm bảng **Tác phẩm bạn đứng
tên**: tên, ISWC, **tỷ lệ của bạn**, đồng tác giả và tỷ lệ của họ, số bản
ghi, và **đã đăng ký ở hội nào**.

Bảng bản ghi phía trên trả lời *"kỳ này tôi được bao nhiêu"*; bảng này trả
lời *"tài sản của tôi gồm những gì và đã đăng ký ở đâu"* — hai câu khác nhau,
và câu thứ hai mới là câu người sáng tác hay hỏi nhất.

Đồng tác giả thấy tên và tỷ lệ của nhau — đó là chuyện bình thường và cần
thiết trong tác quyền. Nhưng **phần Haustek giữ, phí, và ước tính tiền đang
để trên bàn thì không ra khỏi cổng nội bộ**; `api-guard` quét gói để bảo đảm.

### Tốc độ

Quét cả danh mục để đếm việc còn lại mất khoảng 400ms, mà trang gọi lại mỗi
lần vẽ. Nên `viecConLai()` nhớ kết quả theo phiên bản dữ liệu tác quyền: sửa
một tác phẩm hay một đăng ký thì bản nhớ hỏng và tính lại. Đo được:
**412ms lần đầu → 0ms các lần sau → 393ms sau khi sửa**.

### Danh sách tool phân phối đã chốt

OneRPM · Believe Music · ADA (Warner Music) · YouTube CMS *(sắp có, có nhãn
riêng trên phiếu giao việc)*. Danh sách vẫn sửa được ở lõi khi ký thêm hoặc
bỏ một nhà phân phối.

## Vòng 17: phiếu giao việc phát hành, và số công khai trên store

Haustek **không tự phân phối**. Đối tác gửi hồ sơ lên cổng, rồi nhân viên
ngồi gõ lại metadata ấy sang OneRPM và các tool khác. Vòng này dựng đúng chỗ
ngồi làm việc đó.

### 1 · Trang Phiếu giao việc phát hành

Một hồ sơ đi qua ba chặng, chặng nào cũng để lại vết ai làm lúc nào:

```
đối tác gửi  →  chép sang tool  →  dán link store về
(trang Phát hành)   (tab Metadata + Tool)    (tab Link)
```

**Tab Metadata** xếp các trường đúng thứ tự năm bước của OneRPM
(Album Info → Track Upload → Album Art → Distribution Preferences), nhãn giữ
nguyên tiếng Anh như trên tool để mắt đi từ trên xuống mà không phải dịch
ngược. Mỗi trường một nút chép, và mỗi khối một nút "chép cả khối" (ra dạng
`nhãn⇥giá trị`, dán thẳng vào bảng tính được).

Chép chứ không gõ lại là có lý do: **gõ nhầm một ký tự ISRC là tháng sau tiền
không khớp** và phải lần ngược cả kỳ.

> `HM.chep()` thử `navigator.clipboard` trước, hỏng thì rơi xuống
> `execCommand` trên một textarea tạm — vì trong khung sandbox của trình xem
> artifact, clipboard API bị chặn mà không báo lỗi.

**Tab Tool** là bảng tick từng tool: OneRPM, Believe, YouTube CMS, TikTok
SoundOn, Facebook Rights Manager. Mỗi dòng ghi **mã tool trả về** (để sau này
lần ngược), người tick và thời điểm. Danh sách tool sửa được vì mỗi công ty
một bộ và bộ ấy đổi theo hợp đồng.

Một luật cứng: **chưa tick tool nào thì `releases.publish()` từ chối**. Đánh
dấu "đã phát hành" khi bài chưa đi đâu cả là nói dối đối tác, và đây đúng là
chỗ hay quên nhất.

**Tab Store** chọn store sẽ phân phối tới (8 nền tảng lớn + 24 store tiếp
theo, còn lại theo mặc định nhà phân phối). Bỏ chọn hết là quay về toàn bộ.

**Tab Link** để dán link store thật của **từng bài** sau khi lên kệ. Link
khoá theo **ISRC** chứ không theo số thứ tự bản ghi — đổi hệ, gộp danh mục,
nhập lại từ đầu thì link vẫn bám đúng bài. Dán nhầm cột bị chặn tại chỗ:
`kiemLink()` so tên miền với nền tảng, dán link Spotify vào ô Apple Music là
báo ngay chứ không đợi đối tác phát hiện.

Link dán tay **thắng** link sinh ra, ở cả `linkNenTang()` lẫn `deliveryOf()`,
nên đối tác thấy đúng link thật trên cổng của họ.

### 2 · Số công khai trên store — tín hiệu, không phải tiền

Câu hỏi của người dùng: *"các số liệu stream mình có cơ chế tự vào link và
đọc số không?"* Câu trả lời trung thực, ghi thẳng vào lõi:

| Nền tảng | Có công bố | Nguồn | Đọc tự động |
|---|---|---|---|
| YouTube Music | có (lượt xem) | **API chính thức** (Data API v3) | được, khi có máy chủ |
| Spotify | có (lượt phát **cộng dồn**) | trang bài | không — điều khoản cấm, trang có chống bot |
| Zing MP3 | có | trang bài | không có API chính thức |
| NhacCuaTui | có | trang bài | không có API chính thức |
| Apple Music, TikTok, Facebook, Instagram | **không** | — | — |

Ba lý do con số này **không bao giờ được chạm vào chuỗi chia tiền**, mỗi lý
do đủ để một mình nó chặn:

1. Nền tảng đếm "lượt phát" khác với lượt nghe **được trả tiền**.
2. Số công khai là **cộng dồn** từ ngày phát hành, không theo ngày.
3. Nhiều nền tảng không công bố gì cả.

Vậy dùng để làm gì? Một việc, nhưng đáng: **báo động sớm**. Báo cáo doanh thu
về sau một tới hai tháng; số công khai đọc được hôm nay. Bài đang bùng nổ hay
bị gỡ khỏi store thì thấy ngay.

Bảng nằm ở trang **Nhập số liệu → tab Đối soát theo bài**, ngay cạnh tiêu đề
có nhãn đỏ **"không dùng để tính tiền"**. Nền tảng nào không công bố thì ghi
thẳng lý do vào đúng dòng ấy. `ckNhip()` lấy hiệu hai lần đọc liên tiếp chia
số ngày ở giữa để ra bình quân mỗi ngày; số **lùi** so với lần trước thì dòng
đỏ và có chú thích, vì đó là dấu hiệu nền tảng tính lại hoặc bài bị gỡ.

`api-guard` có một phép kiểm chỉ để canh đúng điều này: ghi số công khai vào
rồi đọc lại `agg()` — `gross`, `fee`, `artist`, `labelCut` phải **không đổi
một xu nào**.

### 3 · Đặc tả phía máy chủ cho bộ đọc tự động

Bản mẫu chạy trong trình duyệt, không có máy chủ, và CORS chặn thẳng mọi lời
gọi sang store. Nên `soCongKhai.docTuDong()` **nói thật là chưa nối** thay vì
trả về một con số bịa:

```
Spotify      → "chỉ có số trên trang, không có API chính thức"
YouTube      → "chưa nối máy chủ. Cần một dịch vụ chạy nền gọi YouTube Data API"
Apple Music  → "không công bố số ra ngoài"
```

Khi lên thật, phần cần viết là một dịch vụ chạy nền:

* **YouTube**: `GET youtube/v3/videos?part=statistics&id=<videoId>` với API key.
  Lấy `videoId` từ link store đã dán. Quota mặc định 10.000 đơn vị/ngày, mỗi
  lời gọi 1 đơn vị — thừa sức cho cả danh mục.
* **Zing MP3 / NhacCuaTui**: không có API, phải đọc trang. Đây là phần dễ vỡ
  nhất (đổi giao diện là hỏng) và nên có cảnh báo khi bộ đọc trả về rỗng
  nhiều ngày liền, thay vì im lặng ghi 0.
* **Spotify / Apple Music / TikTok**: không làm. Ghi tay từ Spotify for
  Artists / Apple Music for Artists.
* Ghi vào bằng đúng `soCongKhai.ghi()` với `nguon: "may"` thay vì `"tay"`.

Nhưng ưu tiên **cao hơn hẳn** việc này: hỏi OneRPM có API hoặc giao file
SFTP hằng ngày cho **Daily Trends** không. Một nguồn, đủ mọi nền tảng, và là
số thật sự tính tiền.

### Một lỗi cũ đáng kể mà vòng này lôi ra

`dung-goi.js` gõ cứng danh sách trang. Vòng 15 thêm ba trang vào
`intranet.html` mà quên thêm vào đó, nên **suốt hai vòng, bản gói một trang —
tức bản artifact người ngoài mở ra xem — thiếu hẳn `nhap-so-lieu`,
`hieu-suat` và `hieu-qua-von`**, trong khi toàn bộ bài kiểm vẫn xanh vì bài
nào cũng kiểm trang thật chứ không kiểm gói.

Đã sửa hai lớp:

* `dung-goi.js` **đọc danh sách từ thẻ `<script src="man/…">` của hai trang
  thật**, không chép tay nữa — thêm trang vào trang thật là bản gói có ngay.
* Thêm `portal/test/goi-du-trang.js`: so danh sách trang của hai trang thật
  với những gì thực sự nằm trong bản gói, và bắt cả file trang mồ côi (viết
  xong mà quên đấu dây). Lệch một trang là đỏ ngay tại chỗ gây ra.

Bản gói nay có đủ **27 trang nội bộ + 18 trang đối tác**.

## Vòng 16: mức trả nhập tay quyết định tiền, đối soát lượt nghe hằng ngày

Hai câu trả lời của người dùng, làm thành hai đường đi thật.

### 1 · Mức trả nhập tay là căn cứ trả tiền đối tác

> *"Mức trả: tôi nhập tay vào sau → từ đó bạn có thể tính tiền chi trả cho đối tác."*

Trước vòng này, hai mức trong bảng giá (`per1k` nền tảng trả về, `khach` giá
Haustek chào khách) chỉ dùng cho **dự báo**. Tiền thật vẫn chia theo tỷ lệ hợp
đồng. Nhập một con số rồi không thấy gì đổi thì không ai tin con số ấy. Nay
bảng giá là đầu vào của tiền thật.

> **Vòng 16 làm đúng việc này nhưng làm SAI cách.** Nó để bảng giá *thay chỗ*
> phí hợp đồng, biến phí thành số dư. **Vòng 20 sửa lại** — đọc mục
> *"Vòng 20"* để lấy mô hình đúng; phần dưới đây giữ nguyên để hiểu vì sao
> tính năng tồn tại, không phải để chép công thức.

Chi phí: đường này chỉ bật khi đã có ít nhất một giá chào
(`coMucTraKhach()`), và kết quả mỗi kỳ được nhớ theo phiên bản
(`NHAP_VER` + bảng ghi đè). Đo trên 50.000 bản ghi: 14ms → 131ms lần đầu,
80ms các lần sau.

**Trang Mức trả** có thêm khối *"Đặt mức này thì kỳ … ra sao"*, và
**Bảng kê phía đối tác** gắn nhãn *bảng giá* lên đúng nền tảng đang chạy theo
giá đã chào. Đối tác **không** thấy mức nền tảng trả về hay chênh lệch bảng
giá — `api-guard` quét mọi gói của cổng đối tác để bảo đảm điều đó.

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
| `khach` giá Haustek chào khách | 4,00 USD / 1.000 lượt |
| `bienGia` chênh lệch bảng giá | 0,40 · 9,1% |

Chênh lệch ấy **không phải** phí Haustek — phí là phần trăm trong hợp đồng của
từng khách, cắt trên doanh thu đã quy theo bảng giá. Xem mục *Vòng 20*.

Trang chỉ Level 1–2 mở được, và `platformRatesFull` / `setPlatformRate` chuyển
sang nhóm hàm `tong` (giám đốc). `api-guard` quét **mọi hàm của cổng đối tác
nhận (role, partyId)** và đòi không gói nào mang `khach`, `per1k`, `ghiNhan`,
`bienGia` hay `bienGiaPct`.

Câu "hai cơ chế biên chồng nhau thì trả thiếu, phải chốt cái nào thắng" của
vòng 14 nay đã có lời đáp, và lời đáp là **không cái nào thắng cái nào**:
chúng là hai thứ khác nhau và áp theo thứ tự — bảng giá quy ra doanh thu ghi
nhận, phí hợp đồng cắt trên số ấy. Xem mục *Vòng 20*.

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
