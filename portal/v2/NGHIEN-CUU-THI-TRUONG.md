# Nghiên cứu thị trường và học thuật — vòng 5

Tài liệu này tóm tắt hai đợt nghiên cứu (thị trường các nền tảng phân phối,
và tài liệu khoa học / chuyên môn) thực hiện tháng 9/2026 để quyết định tính
năng vòng 5 của Haustek Portal. Mỗi nhận định có nguồn; các nguồn bị chặn
truy cập trực tiếp thì lấy qua trang trợ giúp, thông cáo và báo chuyên ngành
được lập chỉ mục, và được ghi rõ là như vậy.

## 1. Thị trường: các cổng phân phối và dịch vụ label (2025–2026)

### 1.1 Ma trận tính năng

✓ đã có · ◐ một phần / trả thêm · — không có / không tìm thấy · ? chưa kiểm được

| Nền tảng | Xu hướng ngày | Playlist / nhân khẩu | TikTok / video ngắn | YouTube CID / UGC | Splits | Tạm ứng | Pre-save / smart link | Dolby Atmos | Quản lý tác quyền | Quyền liên quan | Sync / thương hiệu | Pitch playlist | Vai trong đội | White-label / API | 2FA | Mô hình giá |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ONErpm | ✓ | ✓ | ◐ | ✓ tracker | ◐ | ◐ | ✓ | ? | ✓ | ✓ | ◐ | ✓ nội bộ | ✓ | ✓ Enterprise | ? | ~15% hoa hồng |
| DistroKid | ✓ (Plus+) | — | — | ◐ trả thêm | ✓ | — | ✓ HyperFollow | ◐ $26.99 | — | — | — | ◐ | — | — | ✓ email | Thuê bao $24.99–89.99 |
| TuneCore | ✓ | ◐ | ✓ TikTok/Douyin | ✓ | ✓ | — | ◐ | ◐ $16.99 | ◐ $75 + 20% | — | ◐ | ✓ Accelerator | ? | — | ✓ Authy | Thuê bao $24.99–54.99; 20% mạng xã hội |
| CD Baby | ◐ | ◐ | — | ✓ | ? | ◐ | ✓ Show.co | ? | ◐ Boost | ◐ | ✓ Boost | — | — | — | ? | Theo bản phát hành + 9% |
| The Orchard | ✓ | ✓ | ◐ | ✓ | ? | ? | ✓ | ? | ✓ | ✓ | ✓ | ✓ | ? | ◐ | ? | Thương lượng |
| FUGA | ✓ + API | ✓ | ◐ | ✓ | ✓ RASA | ✓ | ? | ✓ | ◐ | ✓ | ◐ | ✓ | ? | ✓ API | ? | B2B |
| Symphonic | ✓ | ✓ | ✓ UGC | ✓ | ✓ SplitShare | — | ✓ Hypeddit | ◐ $24.99 | ✓ | ✓ | ✓ | ◐ Partner | ✓ 6 vai | — | ✓ step-up | $29.99 hoặc hoa hồng |
| Amuse | ✓ | ◐ | ? | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | ◐ | — | ? | Thuê bao $23.99–59.99 |
| Revelator | ✓ | ✓ | ✓ | ✓ | ✓ | — | ? | ✓ | ✓ | ? | — | — | ✓ | ✓ 19 ngôn ngữ | ? | SaaS / hoa hồng |
| Curve | ◐ | — | — | — | ✓ hợp đồng | ✓ dự phòng | — | — | ✓ | — | — | — | ✓ | ◐ | ? | Từ £250/tháng |
| Ditto | ✓ | ✓ | ? | ✓ | ✓ | ? | ✓ | ? | ◐ 15% | — | ◐ 15% | ◐ | ◐ | — | ? | $19–319/năm |
| Believe Backstage | ✓ | ✓ | ◐ | ✓ | ◐ | ✓ | ✓ | ✓ | — | — | — | ✓ | ✓ | — | ? | Thương lượng |
| Kobalt / AWAL | ✓ | ✓ cảnh báo | ? | ✓ | — | ◐ | — | ? | ✓ | ✓ | ✓ | ✓ | ? | — | ? | 15–30% |

Nguồn chính: trang trợ giúp và thông cáo của từng nền tảng (DistroKid Splits
và Recoupments; TuneCore Trends & Analytics, Accelerator, Fees & Penalties;
Symphonic SplitShare Overview và Two-Factor Authentication; Amuse Fast
Forward; FUGA Downloading Statements và Spotify penalty policy; Revelator
release notes 1–6/2025; Curve Payments; ONErpm Business Intelligence), cùng
Music Business Worldwide, Music Week, A2IM.

### 1.2 Mười hai tính năng phổ biến nhất hoặc khác biệt nhất

1. **Chia sẻ tác quyền tự động có thu hồi (splits với recoupment).** Có ở
   DistroKid, TuneCore, Symphonic, Amuse, LANDR, UnitedMasters, Revelator,
   Stem, Ditto. Mời qua email + phần trăm; người cộng tác chỉ thấy phần của
   mình; DistroKid và Symphonic thêm ngưỡng thu hồi để producer được trả
   trước; Symphonic cho sửa hàng loạt nhiều bài. → Vòng 5: trang *Chia sẻ
   tác quyền* hai cổng, lõi `splitsOf`, `setSplit`, `removeSplit`,
   `acceptSplit`.
2. **Xu hướng ngày trộn dữ liệu nền tảng và mạng xã hội** (ONErpm, TuneCore
   với TikTok/Douyin và mốc "Key Dates", Revelator có CSV). Phân biệt rõ
   "xu hướng (chưa chính thức)" với "thu nhập (chính thức)". → đã có từ
   vòng 4 (*Xu hướng ngày*), giữ dòng chú thích phân biệt.
3. **Tạm ứng dựa trên dữ liệu** (Amuse Royalty Advances tính offer mỗi ngày
   trong Wallet, $50–300k; FUGA RASA có dự phòng, bù trừ chéo). → đã có
   *Tạm ứng*; chưa có offer tự động (để mở).
4. **Bảng kê tải về kèm hoá đơn tự lập** (FUGA gói ZIP: PDF self-bill +
   CSV, bản đa tiền tệ; Orchard xuất theo kỳ kế toán; Curve tự lập hoá đơn
   theo hợp đồng). → đã có *Báo cáo theo tháng*; vòng 5 thêm dòng thuế và
   ghi chú hoá đơn điện tử cho tổ chức.
5. **Chi trả toàn cầu có xử lý thuế và tiền tệ** (Curve 35+ tiền tệ, 180+
   nước, khấu trừ thuế; DistroKid và ONErpm qua Tipalti, thu W-9/W-8BEN
   hằng năm; Revelator ví USDC không ngưỡng). → Vòng 5: báo giá rút tiền có
   khấu trừ 10% thuế TNCN cho cá nhân từ 2 triệu đồng (Thông tư 111/2013).
6. **Hiển thị Content ID / UGC** (ONErpm tracker, Vydia Claims Dashboard,
   Songtrust claims). → đã có *Quản lý quyền* / khiếu nại; chưa có danh sách
   video UGC (để mở).
7. **Pre-save / smart link có pixel** (HyperFollow, Ditto SmartLinks miễn
   phí, Symphonic qua Hypeddit / Feature.fm, Believe Backstage Links). →
   Vòng 5: *Chiến dịch* với liên kết thông minh, phễu xem → bấm → lưu trước.
8. **Vai trong đội** (Symphonic sáu vai: Content, Royalties, Analytics,
   SplitShare, Admin, Owner; ONErpm Enterprise theo phòng ban). → đã có vai
   nhân viên nội bộ; vai trong tài khoản đối tác để mở.
9. **Pitch playlist biên tập theo gói** (TuneCore Accelerator, Symphonic
   Partner, AWAL). → Vòng 5: *Chiến dịch* loại pitch playlist.
10. **Quản lý tác quyền và quyền liên quan như dòng doanh thu thứ hai**
    (TuneCore $75 + 20%, CD Baby Boost, Ditto 15%, Songtrust $100 + 15/20%).
    → đã có luồng tác quyền; quyền liên quan để mở.
11. **Kiểm soát gian lận và an toàn.** Spotify phạt ≈ €10 / bài / tháng từ
    4/2024 khi lượt nghe giả vượt mức; TuneCore, UnitedMasters, FUGA chuyển
    phạt cho tài khoản; DistroKid có quy trình strike / quiz; Apple tăng
    phạt 10–50% doanh thu (2/2026); Deezer bỏ lượt nghe giả khỏi quỹ và
    phát hiện 85% lượt nghe trên nhạc AI thuần là giả. → Vòng 5: *Chất lượng
    lượt nghe* hai cổng, sổ phạt, khiếu nại, xác nhận / gỡ có nhật ký.
12. **Minh bạch thời điểm tiền về** (Kobalt "Collection Gap", ví Amuse và
    Revelator xem "tiền đang về" là màn chính). → đã có nhịp báo cáo theo
    nguồn trong Ví; biểu đồ khoảng cách thu để mở.

### 1.3 Mẫu giao diện đáng học

- ONErpm Daily Trends: một màn, nhiều nền tảng, lọc theo cửa hàng / thị
  trường / bản phát hành, so với kỳ trước hoặc cùng kỳ năm trước, tab
  Playlist Tracker và CID Tracker kề bên.
- DistroKid Splits: nhập email + %, người cộng tác chỉ thấy phần của họ,
  ngưỡng thu hồi tự trở về phần trăm khi đủ.
- Symphonic SplitShare: tự áp cho bản phát hành sau khi nhận một lần, gán
  hàng loạt, bảng kê riêng cho người nhận.
- Amuse Wallet: điều kiện tạm ứng tính từ dữ liệu, offer làm mới mỗi ngày,
  phí ghi rõ trên từng offer.
- TuneCore "Key Dates" và nhãn "xu hướng chưa chính thức vs doanh số
  chính thức".
- FUGA gói bảng kê ZIP có PDF tự lập hoá đơn và CSV theo tiền tệ.
- Believe Promotion Kit: sinh tự động bài đăng mạng xã hội từ metadata.
- Curve onboarding người nhận: thu thông tin ngân hàng và thuế, kiểm tra
  tài khoản, lập hoá đơn, trả bằng nội tệ.

### 1.4 Thị trường Việt Nam

- Zing MP3 (VNG) và NhacCuaTui là hai nền tảng nội địa lớn, trả theo lượt
  nghe thấp hơn nền tảng phương Tây, gửi báo cáo tháng cho đơn vị phân
  phối. Decision Lab Q4/2025: YouTube 74%, Zing MP3 45%, TikTok 32%,
  Spotify 27%, Apple Music 9% người dùng.
- Các đơn vị trong nước: Yeah1 (Sony mua 49% mảng nhạc, 1/2026), POPS
  Music, Metub (liên doanh Virgin Music, 9/2025), BH Media, DAO Music
  (hợp tác The Orchard); Believe có mặt từ 2019.
- Thuế khi trả cho cá nhân: thu nhập bản quyền chịu 5% trên phần vượt 10
  triệu đồng mỗi hợp đồng; khoản chi từ 2 triệu đồng mỗi lần cho cá nhân
  cư trú không có hợp đồng lao động khấu trừ 10% thuế TNCN tại nguồn
  (Thông tư 111/2013, Điều 25). Hoá đơn điện tử bắt buộc từ 7/2022; Nghị
  định 117/2025 buộc nền tảng có chức năng thanh toán khấu trừ thuế cho cá
  nhân từ 4/2025. → Cổng cần cờ tình trạng thuế theo người nhận (cá nhân /
  tổ chức, cư trú / không cư trú) để chọn 5% / 10% / 0% và cấp chứng từ
  khấu trừ; trả bằng VND; bảng kê song song VND và USD.
- Khoảng trống: không cổng toàn cầu nào khảo sát có sẵn chi trả VND, logic
  thuế TNCN 5% / 10% và hoá đơn điện tử Việt Nam; cộng với nạp báo cáo Zing
  MP3 / NhacCuaTui, đây là chỗ Haustek khác biệt rõ nhất.
- Mức trả mỗi 1.000 lượt (USD gộp về đơn vị phân phối, trước khi chia) ở
  Việt Nam thấp hơn Âu–Mỹ 2–3 lần vì giá thuê bao (Spotify Premium 59.000 ₫
  ≈ 2,3 USD so với 11,99 USD ở Mỹ) và CPM quảng cáo thấp; tỷ lệ nghe miễn
  phí cao. Tham chiếu dùng cho dữ liệu mẫu và cột *Tham chiếu VN* trong
  trang Mức trả nền tảng: Spotify ≈ 1,6 · Apple Music ≈ 3,2 · YouTube Music
  ≈ 0,75 · Facebook ≈ 0,45 · Zing MP3 ≈ 0,4 · Instagram ≈ 0,4 · TikTok ≈
  0,35 · NhacCuaTui ≈ 0,3 · nhóm nền tảng khác (Deezer, Amazon, Tidal…) ≈
  2,5. Nguồn: khoảng giá công bố của các đơn vị phân phối và báo cáo nghệ sĩ
  Việt Nam 2024–2025 (Spotify VN 0,0012–0,0020 USD/lượt; YouTube Music
  0,0006–0,0009; Apple Music 0,0025–0,0040; Zing MP3 và NhacCuaTui dưới
  0,0005), Duetti *Music Economics Report 2025* (trung bình toàn cầu Spotify
  ≈ 3,0 USD/1.000, thị trường mới nổi thấp hơn 40–60 %). Đây là ước lượng
  để dựng bản mẫu; Haustek nhập số thật từ báo cáo nền tảng để ghi đè.

## 2. Học thuật và chuyên môn

### 2.1 Kinh tế streaming và minh bạch tác quyền

| Nguồn | Điểm rút ra cho thiết kế |
|---|---|
| CNM / Deloitte, *Music streaming: impact of the UCPS settlement model* (2021) | Mô hình theo người dùng giảm 17,2% cho top-10 và tăng ~5,2% cho nghệ sĩ ngoài top 10.000; cũng giảm lợi ích của gian lận tập trung. → Ghi rõ mô hình trả của từng nền tảng trên dòng bảng kê. |
| Page & Safir, *User-Centric Revisited* (SERCI 2019) | UCPS không chắc giúp đuôi dài, thêm phức tạp báo cáo. → Không hứa "công bằng"; hiện mức trả hiệu dụng (tiền ÷ lượt) theo thị trường. |
| Dimont, *Royalty Inequity*, Hastings Law Journal 69(2) (2018) | Pro-rata tạo động lực gian lận có tính cấu trúc. → Lớp cảnh báo bất thường là tính năng toàn vẹn bảng kê, không phải phụ trợ. |
| Meyn, Kaiser, Weimar et al., Economics Letters 226 (2023) | ~€170 triệu/năm sẽ dịch chuyển giữa thể loại; thời lượng bài và tiền theo phút nghe giải thích chênh lệch. → Hiện thời lượng và doanh thu mỗi phút cạnh lượt nghe (để mở). |
| Moreau, Wikström, Haampland, Johannessen, Information Economics and Policy 68 (2024) | Artist-centric thay đổi nhỏ, không cải thiện đáng kể cho nghệ sĩ chuyên nghiệp. → Phân đoạn dashboard theo thể loại và tuổi bản phát hành. |
| Spotify: ngưỡng 1.000 lượt / 12 tháng, streamshare theo thị trường (từ 4/2024) | Dòng không được trả phải nói rõ luật. → Nhãn "dưới ngưỡng" ở *Bài hát của tôi* và tab *Chất lượng* trong ngăn hồ sơ. |
| Deezer × UMG artist-centric (2023): ≥1.000 lượt/tháng và ≥500 người nghe; giới hạn 1.000 lượt/người/tháng | Số người nghe là biến tính tiền. → Đưa người nghe vào bảng chính và luật Deezer vào tab *Chất lượng*. |
| Berklee ICE / Rethink Music, *Fair Music* (2015); The MLC nhận $424,4 triệu chưa khớp (2021) | 20–50% tiền không về đúng chủ vì metadata. → Điểm sức khoẻ metadata (ISRC, ISWC, IPI, splits) chặn trước khi giao; rổ "chưa khớp" hiện rõ (đã có *Khớp ISRC*). |
| DDEX ERN / DSR, IPI / ISNI / ISWC / ISRC | Bảng kê nên đối chiếu được tới dòng DSR. → Cấu trúc giải thích số theo lượt nghe → mức trả → tiền, tách theo nền tảng. |

### 2.2 Lượt nghe giả và phát hiện gian lận

| Nguồn | Điểm rút ra |
|---|---|
| Drott, *Fake Streams, Listening Bots, and Click Farms*, American Music 38(2) (2020) | Tăng đột ngột không giải thích được là rủi ro, không chỉ là tin tốt. |
| Yu, *On click-fraud under pro-rata revenue sharing rule* (2026) | Năng lực phát hiện quyết định mức gian lận cân bằng; đơn vị phân phối có lợi khi phát hiện tốt và cho thấy điều đó. |
| CNM, *Manipulation des écoutes en ligne* (2023) | 1–3% lượt nghe ở Pháp năm 2021 là giả, và là sàn. → Nền 1–3%; cảnh báo chỉ nhắm phần vượt xa. |
| Spotify artificial streaming (2024); TuneCore, FUGA chuyển phạt | ≈ €10 / bài / tháng, gỡ lượt nghe khỏi báo cáo, có thể giữ tiền. → Trạng thái "nền tảng gắn cờ", sổ phạt, đường khiếu nại. |
| Deezer 2022–2026 | 7–8% lượt nghe giả; 85% trên nhạc AI thuần; toàn bộ bị bỏ khỏi quỹ. → Hiện "lượt báo về" và "lượt bị gỡ". |
| Music Fights Fraud Alliance; Beatdapp ước ≥10% toàn cầu | Uy tín đơn vị phân phối bị ảnh hưởng. → Nhật ký cảnh báo và thao tác là bằng chứng thẩm định. |
| US v. Michael Smith (DOJ SDNY, 2024–2026) | 10.000 tài khoản bot, rải ~660.000 lượt/ngày thật mỏng để dưới ngưỡng từng bài. → Gom theo TÀI KHOẢN, không chỉ theo bài; cảnh báo tạo việc không thể bỏ qua. |

Tín hiệu tính được từ số ngày (đã cài trong `qualityOf`): vọt so với nền
28 ngày (z-score, phải ≥ 1,5× nền), một thị trường chiếm ≥ 55% (trừ thị
trường nhà) hay ≥ 80%, lượt nghe trên mỗi người nghe ≥ 5, tỷ lệ nghe ngắn
30–31 giây ≥ 45%, phụ thuộc ≤ 2 playlist ≥ 70% (chỉ là bằng chứng phụ).
Điểm: hành vi máy (lặp nghe, nghe ngắn, vọt mạnh) nặng hơn tín hiệu thị
trường; ≥ 4 điểm hoặc bị nền tảng gắn cờ → nghiêm trọng, 2–3 → cảnh báo,
1 → theo dõi.

### 2.3 Bảng dữ liệu và dashboard

| Nguồn | Điểm rút ra (đã áp dụng vòng 5) |
|---|---|
| Laubheimer (NN/g), *Data Tables: Four Major User Tasks* (2022); NN/g về bảng lớn, thao tác hàng loạt, đầu cột dính | Đầu cột dính ở màn rộng; chọn nhiều dòng với thanh hành động; phân trang có số trang. |
| Material Design – Data tables | Số căn phải, chữ căn trái, chữ số bề rộng đều (`tabular-nums`). |
| IBM Carbon – Data table | Nhiều mật độ dòng; dòng mở rộng cho chi tiết. → Nút đổi mật độ chặt / thoáng lưu theo trình duyệt. |
| Baymard – phân trang vs cuộn vô hạn (2016) | Không cuộn vô hạn; giữ chân bảng và tổng luôn với tới được. |
| Enders (A List Apart, 2008) | Sọc xen kẽ giúp ít, chủ yếu bảng rất rộng. → Bỏ sọc mặc định, giữ `.zebra` cho bảng nhiều cột số. |
| Few, *Information Dashboard Design*; *Common Pitfalls* | ≤ 6 ô số trên đầu màn, mỗi ô có bối cảnh kỳ trước, không thừa độ chính xác. |
| Tufte, *Sparkline theory and practice* (2006) | Tia và thanh trong ô thay cho biểu đồ riêng. → `HM.oThanh` trong cột số. |
| NN/g, *Dashboards: preattentive*; Nielsen, *Progressive disclosure* | Thanh / đường thay bánh; tóm tắt → bảng kê → dòng → báo cáo gốc. |
| WCAG 2.2 SC 1.4.3 / 1.4.11; Crameri et al., Nature Communications (2020) | Chữ 4,5:1, vạch 3:1; tăng / giảm không chỉ bằng đỏ – xanh. → Kiểm tương phản tự động, ảnh đại diện có màu nền đặc. |
| Du, Amor, Ma, Wünsche, *Data Visualization for Improving Financial Literacy* (2025/26) | Bản đơn giản mặc định cho người sáng tạo; bản phân tích cho label. |

### 2.4 Niềm tin và khả năng hiểu bảng kê

| Nguồn | Điểm rút ra |
|---|---|
| Hesmondhalgh et al., *Music Creators' Earnings in the Digital Era* (UK IPO 2021) | ~76% nhạc sĩ không hiểu hoặc thấy thu nhập streaming khó hiểu hơn nguồn khác. → Khả năng hiểu là chỉ số phải đo. |
| UK DCMS Committee (2021); Chỉ thị EU 2019/790 Điều 19 | Nghĩa vụ thông tin đầy đủ theo hình thức khai thác, doanh thu, khoản phải trả, ít nhất hằng năm. → Bảng kê tách theo nền tảng, thị trường, kỳ. |
| Loewenstein, Sunstein, Golman, *Disclosure: Psychology Changes Everything* (2014) | Công khai chỉ hiệu quả khi đơn giản, chuẩn hoá, sinh động. → Một bố cục bảng kê cho mọi nền tảng, thuật ngữ giải thích. |
| Kulesza et al., *Too much, too little, or just right?* (VL/HCC 2013) | Giải thích đủ chuỗi làm tăng mô hình nhận thức và niềm tin. → Nút *Giải thích* ở *Báo cáo theo tháng*: lượt nghe → mức trả → tiền → điều chỉnh → ghi ví, tách theo nền tảng. |
| Joslyn & LeClerc, J. Exp. Psych.: Applied 18(1) (2012); Kay, Kola, Hullman, Munson (CHI 2016) | Dự báo có dải làm quyết định tốt hơn và giảm tác hại khi sai. → *Dự báo* hiện dải P10–P90. |
| Ancker et al., BMC Med. Inform. Decis. Mak. (2017); Pielot et al. (MobileHCI 2014) | Cảnh báo lặp làm giảm chấp nhận. → Mỗi vấn đề một thông báo, ba mức, đánh dấu đã đọc. |
| Salazar (NN/g), *Indicators, Validations, and Notifications* (2015) | Trạng thái là chỉ báo trên dòng; sự kiện mới là thông báo. → Nhãn trên dòng bảng + chuông chỉ báo sự kiện mới. |

## 3. Khuyến nghị đã cài trong vòng 5 và phần còn mở

Đã cài:
- Chia sẻ tác quyền (splits) có thu hồi, hai cổng, người cộng tác chỉ thấy
  phần của họ.
- Chất lượng lượt nghe: năm tín hiệu, gom theo tài khoản, sổ phạt, khiếu
  nại / xác nhận / gỡ có nhật ký; tab *Chất lượng* trong mọi ngăn hồ sơ.
- Ngưỡng trả tiền của nền tảng (Spotify 1.000 / 12 tháng, Deezer 1.000 và
  500 người nghe) với thanh tiến độ; nhãn "dưới ngưỡng" trên dòng bài.
- Sức khoẻ metadata theo bài và toàn danh mục, giữ lại khi thiếu ISWC / IPI.
- Giải thích con số từng kỳ (chuỗi bước + theo nền tảng).
- Báo giá rút tiền có khấu trừ 10% thuế TNCN cho cá nhân, hoá đơn điện tử
  cho tổ chức.
- Chuông thông báo (mỗi vấn đề một dòng, ba mức) và tìm nhanh Ctrl K.
- Chiến dịch: liên kết thông minh / pre-save, pitch playlist, quảng cáo.
- Dải P10–P90 cho dự báo; bảng dữ liệu: đầu cột dính, mật độ, thanh trong
  ô, chọn nhiều dòng, số trang.

Vòng 6 (theo phản hồi người dùng):
- Mức trả hiệu chỉnh về thị trường Việt Nam (§1.4) và trang nhập số thật
  từng nền tảng, ghi đè số suy từ báo cáo, dự báo đổi theo.
- Xét duyệt tạm ứng và hợp đồng cho giám đốc, với bản tính ROI, hạng rủi ro
  và khuyến nghị (theo cách các đơn vị cấp vốn cho nghệ sĩ như beatBread,
  Amuse Fast Forward, Sound Royalties định mức ứng theo phần trăm thu nhập
  12 tháng dự kiến và điều chỉnh theo độ dao động, xu hướng, tập trung
  danh mục); kế toán kiểm số, kinh doanh và đối tác đề xuất, đối tác chỉ
  thấy số của mình.

Còn mở (đề xuất vòng sau): offer tạm ứng tự động kiểu Amuse; danh sách video
UGC theo bài; vai trong tài khoản đối tác; quyền liên quan (SoundExchange,
các tổ chức trong nước); biểu đồ khoảng cách thu (Kobalt); chỉ số hiểu bảng
kê đo bằng kiểm thử với người dùng; thời lượng và doanh thu mỗi phút nghe.
