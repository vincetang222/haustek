# Ai dùng cổng Haustek, để làm gì, và cổng đã đáp được tới đâu

Tài liệu này là chỗ ghi lại việc nghiên cứu người dùng: từng vai, mục đích của họ
mỗi khi mở cổng, câu hỏi họ cần trả lời, trang nào đang trả lời, và chỗ nào còn
thiếu. Mọi tính năng thêm vào đều phải trỏ được về một dòng trong đây.

## 1. Bối cảnh nghiệp vụ

Haustek phân phối bản ghi lên các nền tảng (Spotify, Apple Music, YouTube,
TikTok, Zing…) qua một đối tác phân phối chính và hai hợp đồng ký trực tiếp
(YouTube, TikTok). Mỗi tháng có ba nguồn báo cáo doanh thu về; tác quyền về theo
quý từ các tổ chức quản lý tác quyền (VCPMC, The MLC, ASCAP…). Tiền chia theo
chuỗi: doanh thu gộp → phí dịch vụ Haustek → phần label (hoặc phần Haustek theo
hợp đồng độc lập) → điểm producer → phần nghệ sĩ → khấu trừ tạm ứng → ngưỡng
thanh toán tối thiểu → số thanh toán. Kỳ chỉ mở cho đối tác sau khi **xét duyệt**.

Hai giả định lớn của bản mẫu, chưa được xác nhận (xem tab Câu hỏi cần chốt):

* **Haustek thanh toán thẳng cho nghệ sĩ thuộc label** theo tỷ lệ label khai, không
  chuyển cả gói cho label rồi label tự chia. Nếu thực tế là label tự chia thì
  trang của ca sĩ thuộc label phải đổi hẳn: họ không có "số thanh toán" từ Haustek,
  chỉ có "phần được hưởng theo bảng chia của label".
* **Con số trong file báo cáo là doanh thu gộp thật**, phí Haustek 15% tính trên đó.

## 2. Các vai và mục đích

| Vai | Ai | Mở cổng để làm gì | Nhịp |
|---|---|---|---|
| Vận hành Haustek | ops@ | Nhập báo cáo, khớp dòng chưa có ISRC, đối soát tới từng xu, chốt tỷ giá, xét duyệt kỳ, chạy thanh toán, trả lời thắc mắc của đối tác | hằng tháng, dồn vào tuần thứ ba và tư |
| Kế toán Haustek | kế toán | Bút toán kỳ, công nợ theo bên thụ hưởng, tạm ứng phải thu, thuế khấu trừ, chứng từ, đối chiếu sao kê | hằng tháng, sau xét duyệt |
| Kinh doanh Haustek | sales1@, sales2@ | Tài khoản mình phụ trách: doanh thu quý, chỉ tiêu, mới ký, sắp hết hạn hợp đồng, chưa đăng nhập, chưa đủ hồ sơ; tài khoản dẫn đầu | hằng tuần |
| Hỗ trợ Haustek | support1@, support2@ | Hàng đợi yêu cầu hỗ trợ (ticket) của đối tác theo hạn xử lý; xung đột Content ID và khiếu nại trên nền tảng | hằng ngày |
| Quản lý Haustek | mgmt@ | Doanh thu phí 12 kỳ, top đối tác, tiền chưa khớp, vấn đề cần chốt trước khi lên hệ thống thật | hằng tháng, hằng quý |
| Label (hãng đĩa, công ty quản lý) | chủ label, kế toán label | Doanh thu cả roster, phần label được hưởng, phần trả từng nghệ sĩ, bảng kê, tạm ứng của label, tỷ lệ theo phụ lục | hằng tháng |
| Ca sĩ / nghệ sĩ thuộc label | nghệ sĩ có hợp đồng với label | Bài nào ra tiền, mình được bao nhiêu sau phần label, bao giờ nhận, tỷ lệ đang áp là gì và theo phụ lục nào, tạm ứng cá nhân | hằng tháng, sau khi kỳ mở |
| Nghệ sĩ độc lập | ký trực tiếp với Haustek | Như trên nhưng không có label; phần Haustek theo hợp đồng độc lập hiện rõ | hằng tháng |
| Tác giả / nhạc sĩ | nghệ sĩ có đăng ký phần sáng tác | Tác quyền về chưa, quý nào có báo cáo, chia với đồng tác giả thế nào | hằng quý |
| Producer | có tên trong danh mục, chưa có mã | Chưa có tài khoản. Điểm producer đang giữ lại vì chưa rõ người nhận (câu hỏi cần chốt số 3) | — |
| **Label mẹ** (công ty có nhiều label con) | chủ tập đoàn / giám đốc nội dung | Theo dõi từng label con và nghệ sĩ bên dưới: doanh thu, phần label, roster; mở cổng của label con để xem như chính họ | hằng tháng, sau xét duyệt |
| **Label con** | label ký riêng, nằm dưới một label mẹ | Như label; biết mình thuộc label mẹ nào; không thấy label mẹ hay label con khác | hằng tháng |
| Người khai metadata | nghệ sĩ hoặc quản lý | Gửi hồ sơ phát hành mới (form metadata ở trang chủ), theo dõi trạng thái: đã gửi → đã tiếp nhận → đã cấp ISRC → đã phát hành → đã có doanh thu | theo từng lần phát hành |

## 3. Câu hỏi từng vai cần trả lời, và trang trả lời

### Vận hành

| Câu hỏi | Trang | Trạng thái |
|---|---|---|
| Kỳ này còn thiếu nguồn nào, còn vướng gì trước khi xét duyệt? | Tổng quan · Nhập báo cáo · Đối soát & xét duyệt | có |
| Dòng nào chưa khớp ISRC, hệ thống gợi ý gì? | Khớp ISRC | có |
| Tổng trên hệ thống có khớp file gốc không? | Đối soát | có |
| Xét duyệt xong thì ai nhận bao nhiêu, ai dưới ngưỡng, ai đang khấu trừ tạm ứng? | Thanh toán | có |
| Hồ sơ phát hành nào đang chờ tiếp nhận, thiếu gì? | **Phát hành** (mới) | thêm trong vòng này |

### Kế toán

| Câu hỏi | Trang | Trạng thái |
|---|---|---|
| Doanh thu kỳ ghi vào khoản nào, Nợ/Có cân đối chưa? | Kế toán · Bút toán kỳ | có |
| Từng bên thụ hưởng: dư đầu, phát sinh, khấu trừ, đã thanh toán, dư cuối? | Kế toán · Công nợ | có |
| Thuế khấu trừ tại nguồn, thuế nhà thầu, VAT trên phí ước tính bao nhiêu, còn thiếu gì? | Kế toán · Thuế & khấu trừ | có (ước tính, ghi rõ chưa mô hình hoá) |

### Label

| Câu hỏi | Trang | Trạng thái |
|---|---|---|
| Kỳ này roster mang về bao nhiêu, label được hưởng bao nhiêu? | Tổng quan | có |
| **Từng nghệ sĩ trong roster** mang về bao nhiêu, phần nghệ sĩ, phần label, ai đang có tạm ứng? | **Nghệ sĩ** (mới) | thêm trong vòng này |
| Bài nào của roster ra tiền? | Bài hát | có |
| Bảng kê để gửi kế toán? | Bảng kê thanh toán | có |
| Tỷ lệ đang áp theo phụ lục nào, đổi từ kỳ nào? | **Hợp đồng & tỷ lệ** (thẻ mới ở Tổng quan) | thêm trong vòng này |
| Bản phát hành nào của roster đang chờ, đã lên? | Phát hành | có |
| **Từng bài hát** của roster đã đi tới bước nào, đã có mặt trên nền tảng nào (đường dẫn), nền tảng nào còn kẹt, Haustek còn thiếu gì từ label? | **Danh mục bài hát** (mới) · ngăn hồ sơ bài hát (tab Quy trình, Nền tảng) | thêm trong vòng này |
| Từng nền tảng mang về bao nhiêu lượt nghe, bao nhiêu tiền **mỗi tháng**, cho cả roster và cho từng bài? | **Nền tảng** (mới) · ngăn hồ sơ bài hát, tab Theo tháng | thêm trong vòng này |
| Bài nào chưa ra tiền dù đã phát hành lâu? | Danh mục bài hát (lọc Có vấn đề / Còn thiếu; bước Báo cáo doanh thu) | thêm trong vòng này |

### Label mẹ

Một công ty có nhiều label con (mỗi label con là một tài khoản riêng, ký riêng,
tỷ lệ riêng). Chủ công ty muốn nhìn cả cây: label con nào mang về bao nhiêu, nghệ
sĩ nào của label con nào, và khi cần thì mở cổng của label con để xem đúng những
gì label con thấy. Tiền **không** đi qua label mẹ (giả định; câu hỏi cần chốt số 9).

| Câu hỏi | Trang | Trạng thái |
|---|---|---|
| Toàn hệ thống kỳ này gộp bao nhiêu, phần label bao nhiêu, bao nhiêu nghệ sĩ? | **Hệ thống label** (mới) | thêm trong vòng này |
| Từng label con: roster, doanh thu gộp, phần nghệ sĩ, phần label, tỷ lệ? | Hệ thống label · bảng Label con · ngăn từng label con | thêm trong vòng này |
| Nghệ sĩ nào thuộc label con nào, ai đang mang về nhiều nhất? | Hệ thống label · Cấu trúc (cây label mẹ → label con → nghệ sĩ) | thêm trong vòng này |
| Xem cổng của một label con như chính họ? | nút **Xem cổng của label này** → biểu ngữ "Đang xem với tư cách label con" | thêm trong vòng này |
| Label mẹ có được hưởng phần nào trên doanh thu label con không? | chưa: câu hỏi cần chốt số 9, bản mẫu giả định không | mở |

### Label con

Như label, thêm dòng **Label mẹ** trên thẻ Hợp đồng & tỷ lệ và trong cột trái.
Không thấy label mẹ, không thấy label con khác (kiểm bằng api-guard).

### Ca sĩ thuộc label

Đây là vai đông nhất (55% nghệ sĩ trong bản mẫu) và trước vòng này là vai được
nghĩ ít nhất: họ dùng chung trang với nghệ sĩ độc lập, chỉ khác một chặng "Phần
label" trong chuỗi tiền, và không có chỗ nào nói họ thuộc label nào, tỷ lệ bao
nhiêu, ai trả tiền cho họ.

| Câu hỏi | Trang | Trạng thái |
|---|---|---|
| Kỳ này tôi được bao nhiêu? | Tổng quan | có |
| Từ doanh thu gộp tới phần của tôi trừ những gì? Phần label là bao nhiêu và theo tỷ lệ nào? | Tổng quan · Chi tiết dòng tiền | có, nhưng chưa nói tỷ lệ |
| **Tôi thuộc label nào, tỷ lệ đang áp bao nhiêu, theo phụ lục nào, hiệu lực từ kỳ nào, ai chuyển tiền cho tôi?** | **Hợp đồng & tỷ lệ** (thẻ mới) | thêm trong vòng này |
| Bao giờ tiền vào tài khoản, có bị khấu trừ tạm ứng không? | Tổng quan · Khi nào nhận tiền · Tạm ứng | có |
| Bài nào của tôi ra tiền, nghe ở đâu? | Bài hát | có |
| Tác quyền của tôi (nếu có sáng tác)? | Tổng quan · tab Tác quyền | có |
| Bản phát hành tôi đã gửi đang ở bước nào? | Phát hành | có |
| **Bài hát của tôi** đã đi tới bước nào, đã lên Spotify / Apple Music / YouTube Music / TikTok / Zing chưa, đường dẫn đâu, còn thiếu gì? | **Danh mục bài hát** (mới) · ngăn hồ sơ bài hát | thêm trong vòng này |
| Nền tảng nào mang về nhiều nhất, mỗi tháng bao nhiêu lượt nghe, bao nhiêu tiền? | **Nền tảng** (mới) · ngăn hồ sơ bài hát, tab Theo tháng | thêm trong vòng này |

### Nghệ sĩ độc lập

Như ca sĩ thuộc label, thay "phần label" bằng "phần Haustek theo hợp đồng độc
lập"; thẻ Hợp đồng & tỷ lệ nói rõ tỷ lệ bạn hưởng sau phí.

### Tác giả

| Câu hỏi | Trang | Trạng thái |
|---|---|---|
| Quý nào có báo cáo tác quyền, tổng bao nhiêu? | Tổng quan · tab Tác quyền | có |
| Bài nào tôi có phần sáng tác, chia với ai? | Bài hát · tab Tác quyền | có |
| Vì sao kỳ này trống? | Tổng quan (giải thích nhịp theo quý) · Tài liệu · Câu hỏi thường gặp | có |

## 4. Luồng phát hành: từ form metadata ở trang chủ tới doanh thu

Form `metadata.html` hiện đổ về Google Sheets ba tab `Releases`, `Tracks`,
`Splits`. Schema Supabase đã có `releases` (trạng thái `draft → approved → …`),
`tracks` (khoá `isrc` nối với báo cáo doanh thu), `master_splits`,
`publishing_splits`. Cổng phải nối được ba thứ đó:

```
Form trang chủ ──gửi──▶ Hồ sơ phát hành (đã gửi)
                              │  vận hành tiếp nhận, kiểm metadata, cấp ISRC/UPC
                              ▼
                        Đã cấp mã ──đẩy lên nền tảng──▶ Đã phát hành
                              │  báo cáo doanh thu về, khớp theo ISRC
                              ▼
                        Có doanh thu ──▶ vào Danh mục, vào bảng kê của đối tác
```

Trong bản mẫu, vòng này dựng:

* **Cổng đối tác · Phát hành**: danh sách bản phát hành của nghệ sĩ (hoặc của cả
  roster nếu là label) với trạng thái, và nút **Gửi hồ sơ phát hành**: một biểu mẫu
  rút gọn đúng các trường bắt buộc của `metadata.html` (loại phát hành, tên, nghệ
  sĩ chính, ngày phát hành mong muốn, thể loại, ngôn ngữ, danh sách track với tên,
  nghệ sĩ, ISRC nếu có, producer, phần sáng tác và tỉ lệ). Hồ sơ lưu vào trạng thái
  bản mẫu cùng chỗ với mọi quyết định khác.
* **Nội bộ · Phát hành**: danh sách chờ hồ sơ mới; vận hành tiếp nhận, cấp ISRC/UPC,
  đánh dấu đã phát hành. Mỗi bước để lại một dòng nhật ký.
* Bản phát hành đã có doanh thu được suy ra từ danh mục (bản ghi cùng nghệ sĩ,
  cùng kỳ phát hành, cùng UPC) để trang không trống ngay từ đầu.

Khi lên hệ thống thật: form trang chủ ghi thẳng vào `releases`/`tracks`/
`publishing_splits`; cổng đọc bằng RLS như mọi bảng khác. `submission_id`
(HSTK-…) là khoá nối giữa email xác nhận, Google Sheets và cổng.

## 4b. Nguyên tắc số liệu ở cổng đối tác: chỉ số NET (vòng 3)

Đối tác chỉ thấy **số của họ**. Không có "doanh thu gộp", không có "phí dịch vụ",
không có "phần Haustek" ở bất kỳ trang nào của cổng đối tác. Gói dữ liệu chỉ mang
`revenue` (label: phần trả nghệ sĩ + phần label; nghệ sĩ: phần mình) và `mine`
(phần của người xem). Tầng API ném lỗi nếu một gói lọt chữ "gross", "fee", "phí
dịch vụ", "doanh thu gộp" (api-guard kiểm). Căn cứ tính và các khoản khấu trừ nằm
trong **bảng kê PDF** do kế toán Haustek đính kèm từng kỳ; cổng chỉ liệt kê và cho
tải. Tạm ứng của chính đối tác vẫn hiện, vì đó là khoản của họ.

## 4c. Ví, rút tiền và nhịp báo cáo (vòng 3)

Mỗi kỳ được xét duyệt ghi một khoản vào **ví** của đối tác (phần được hưởng sau
khấu trừ tạm ứng). Đối tác bấm **Rút tiền** khi muốn, tối thiểu bằng ngưỡng; kế
toán tiếp nhận, chuyển khoản và ghi số tham chiếu. Nguồn nào về trước ghi trước:
phần lớn nền tảng theo tháng, TikTok theo quý (câu hỏi cần chốt số 10: báo cáo về
muộn ghi vào kỳ nào). Thay cho "chuyển sang kỳ sau", số dư nhỏ hơn ngưỡng đơn giản
nằm lại trong ví.

## 4d. Dự báo tăng trưởng (vòng 3)

Sau khi bài đã lên nền tảng, lượt nghe mỗi ngày là con số về sớm nhất. Dự báo =
lượt nghe hằng ngày × mức trả trung bình USD/1.000 lượt của từng nền tảng (rút từ
ba kỳ đã xét duyệt gần nhất) × phần của người xem. Cho kỳ đang mở và kỳ sau, kèm
tăng trưởng 7 và 28 ngày, theo nền tảng, bài tăng mạnh. Bản mẫu sinh lượt nghe
hằng ngày xác định; hệ thống thật lấy từ API phân tích của nền tảng (Spotify for
Artists, YouTube Analytics, TikTok Insights).

## 4e. Quy trình phát hành đủ 11 bước, có marketing (vòng 3)

Hồ sơ → tiếp nhận → cấp mã → kiểm tra nội dung, bản quyền, Content ID → lên lịch
và đặt trước (pre-save) → gửi nền tảng → đề xuất playlist biên tập → có mặt trên
nền tảng → chiến dịch marketing sau phát hành → theo dõi và tối ưu → báo cáo doanh
thu. Bước không đăng ký (pre-save, pitch, marketing) ghi rõ "không đăng ký" và có
nút yêu cầu hỗ trợ marketing tạo ticket cho đội hỗ trợ.

## 5. Chỗ còn mở, ghi rõ để không ai tưởng đã xong

* Producer chưa có mã nên chưa có tài khoản và chưa nhận được tiền (câu hỏi 3).
* Thuế và khấu trừ chỉ là ước tính (trang Kế toán nói rõ).
* Chưa có đăng nhập thật; ô chọn tài khoản chỉ để xem thử.
* Label có kiêm publisher không (câu hỏi 6) quyết định label có thấy tác quyền.
* Ai thanh toán cho ca sĩ thuộc label (câu hỏi 8).
* Label mẹ có được hưởng phần nào trên doanh thu label con không (câu hỏi 9, thêm
  trong vòng này). Bản mẫu coi cây label là **uỷ quyền xem**, không phải dòng tiền.
* Trạng thái từng nền tảng (đã lên, đang xử lý, bị từ chối, đã gỡ) và đường dẫn ở
  bản mẫu là sinh xác định từ mã bản ghi. Hệ thống thật lấy từ phản hồi giao nhận
  (DDEX) của từng nền tảng; đường dẫn Spotify / Apple / YouTube Music về theo mã
  của nền tảng sau khi bản ghi lên.
* Mục "còn thiếu" (lời bài hát, ngôn ngữ, nhà xuất bản, mã producer, đồng sáng tác
  chưa xác nhận) là những kiểm tra hồ sơ hệ thống thật nên làm ngay lúc nhận
  metadata; bản mẫu chỉ hiện chúng trên bài đã phát hành để thấy hình dạng.
* Báo cáo về muộn (TikTok theo quý) ghi vào kỳ nào (câu hỏi 10, vòng 3).
* Rút tiền: bản mẫu chưa có xác thực hai lớp khi đổi tài khoản ngân hàng và chưa
  có hạn mức rút theo ngày; hệ thống thật cần cả hai.
* Dự báo là ước tính từ lượt nghe hằng ngày; con số thật chỉ có khi nền tảng báo
  cáo. Cổng nói rõ điều này ở mọi chỗ hiện dự báo.
* Bảng kê PDF ở bản mẫu chỉ là bản ghi tên file; hệ thống thật lưu file trên kho
  đối tượng có chữ ký số và đường dẫn tải có hạn.
* Hợp đồng đối tác: bản mẫu sinh ngày ký và ngày hết hạn từ kỳ đầu có doanh thu,
  nên một phần roster đang "đã hết hạn nhưng vẫn có doanh thu" và được xếp vào
  nhóm cần gia hạn. Hệ thống thật lấy ngày từ hợp đồng đã ký và cần quy tắc riêng
  cho hợp đồng tự động gia hạn (câu hỏi 11).
* Nhân viên và vai (kinh doanh, hỗ trợ, kế toán, vận hành, quản lý) ở bản mẫu là
  danh sách cố định với ô chọn để xem thử; hệ thống thật lấy vai từ tài khoản đăng
  nhập và phân quyền theo vai ở tầng máy chủ, không chỉ ẩn trang ở cột trái.

## 6. Tính năng tham khảo từ các nền tảng cùng ngành (OneSystem, ONErpm Artist Oracle)

Ảnh tham khảo của người đặt hàng cho thấy những gì một công ty phân phối chuyên
nghiệp cho A&R và quản lý tài khoản nhìn mỗi ngày. Vòng này lấy những thứ trực
tiếp phục vụ vận hành và kế toán Haustek; phần còn lại ghi để làm sau.

| Tính năng tham khảo | Ở Haustek | Trạng thái |
|---|---|---|
| Monthly Sales (doanh thu theo tháng) | Nội bộ · Tổng quan · Diễn biến 12 kỳ | có |
| Top accounted sales: gross / avg royalty rate / net theo tài khoản | Nội bộ · Tổng quan · **Đối tác dẫn đầu kỳ này** | thêm trong vòng này |
| Negative balances, months to recoup | Nội bộ · Tổng quan · **Tạm ứng còn phải thu hồi** (số kỳ dự kiến) | thêm trong vòng này |
| Next releases: ngày, tài khoản, chiến dịch | Nội bộ · Tổng quan · **Phát hành sắp tới** (chưa có chiến dịch marketing) | thêm một phần |
| Total streams per account | Nội bộ · Tổng quan · **Lượt nghe theo đối tác** | thêm trong vòng này |
| Sales per store / per month (báo cáo theo nền tảng theo tháng) | Nội bộ · **Nền tảng**; cổng đối tác · **Nền tảng** | thêm trong vòng này |
| Track discovery strategies (Artist Oracle: bài đang lên ở đâu, đề xuất playlist) | chưa; cần dữ liệu playlist / xu hướng từ nền tảng | làm sau |
| My Key Releases: lọc theo trạng thái, ngày, tài khoản | Nội bộ · Phát hành (lọc trạng thái) + Danh mục (lọc Có vấn đề / Còn thiếu) | có một phần |
| Releases to manage: to approve / to validate / in progress / issues | Nội bộ · Phát hành: Chờ tiếp nhận / Chờ cấp mã / Chờ phát hành / Trả lại bổ sung | có (tên bước theo quy trình Haustek) |
| My accounts: Managed / Signed / Inactive / Incomplete / Never logged in / Delegation received–given, cột hợp đồng (rate, turnover, ngày ký, ngày hết hạn, account manager) | Nội bộ · **Đối tác** (vòng 3): tab Đang quản lý / Sắp hết hạn / Không hoạt động / Chưa đủ hồ sơ / Chưa đăng nhập / Chưa cấp tài khoản; cột người phụ trách, tỷ lệ, doanh thu quý và quý trước, phân loại A/B/C, ngày ký, hết hạn, tài khoản, ngân hàng; **uỷ quyền xem** = label mẹ → label con | có (ngày ký / hết hạn sinh xác định, thay bằng master data khi có) |
| Rights Manager dashboard: lọc UPC / ISRC / Asset ID / loại xung đột / trạng thái / bên khác / nền tảng / thị trường / ngày; chỉ của tôi; cột lượt xem mỗi ngày, ưu tiên, hết hạn | Nội bộ · **Quản lý quyền** (vòng 3): xung đột Content ID và khiếu nại, chọn nhiều dòng, tranh chấp / chuyển lên nền tảng / giải quyết / nhả; đối tác thấy khiếu nại trên bài của mình trong hồ sơ bài hát và trang Hỗ trợ | có |
| Video settings: tìm tài khoản, chính sách Content ID, kênh | Nội bộ · Quản lý quyền · tab Cài đặt video | có |
| Album delivery dashboard: tạo yêu cầu giao (tên, theo producer / UPC list / UPC file / albums, chọn nền tảng), danh sách yêu cầu | Nội bộ · **Giao nhận nền tảng** (vòng 3) | có |
| Multiple releases edition tools: khoá / mở khoá, đổi giá album, đổi ngày phát hành số, đổi giá track; tổng quan yêu cầu | Nội bộ · **Sửa hàng loạt** (vòng 3) | có |
| Bàn làm việc theo vai (sales KPI, support tickets, kế toán) | Nội bộ · **Bàn làm việc** (vòng 3): mgmt, vận hành, kinh doanh, hỗ trợ, kế toán | có |
