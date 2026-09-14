# Kiểm thử

## 1. Ranh giới quyền — không cần trình duyệt

```bash
node portal/test/api-guard.js
```

70 phép kiểm chạy thẳng trên lõi (vòng 10 thêm: quyền suy ra từ cây tổ chức, trưởng / chuyên viên khác phạm vi, nhân sự thêm / chuyển / khoá theo vai, hàm thêm dữ liệu đúng vai, cổng đối tác thêm nghệ sĩ và đề nghị chiến dịch, bảng kiểm hồ sơ; vòng 9 thêm: ticket theo bộ phận gắn vai — mỗi bộ phận chỉ thấy hàng đợi của mình, chuyển bộ phận bỏ người phụ trách, đối tác thấy bộ phận; nhân viên tạo hồ sơ phát hành thay đối tác — hỗ trợ bị chặn, kinh doanh chỉ tài khoản mình; vòng 8 thêm: phân quyền nội bộ theo vai — kế toán chỉ tiền ra vào, kinh doanh chỉ đối tác và đề xuất của mình, vận hành không tiền, hỗ trợ chỉ đọc, chuông và tìm nhanh không dẫn tới màn bị cấm; vòng 6 thêm: đối tác chỉ thấy đề xuất của mình, chỉ giám đốc duyệt và kế toán kiểm số, duyệt tạm ứng ghi đúng sổ, đối tác không đề nghị vượt mức tối đa, gói tạm ứng đối tác không lộ gộp / phần giữ / ROI, phí hợp đồng chỉ áp từ kỳ mở kế tiếp, mức trả nhập tay đổi dự báo và xoá thì quay về; vòng 5 thêm: chia sẻ tác quyền, cảnh báo chất lượng và khiếu nại theo phạm vi, gói vòng 5 không lộ số gộp, giải thích khớp ví, thuế khấu trừ khi rút, thông báo và tìm nhanh theo phạm vi; vòng 3 thêm: đối tác chỉ thấy số NET, ví và rút tiền, ticket và khiếu nại theo phạm vi, dự báo theo phạm vi, bảng kê và PDF; vòng 4 thêm: xu hướng ngày và playlist theo phạm vi). Đây là thứ **phải chạy trong CI** — mốc số 2 trong tài
liệu bàn giao: chứng minh nghệ sĩ A không truy vấn được dữ liệu nghệ sĩ B.

Kiểm những gì:

- nghệ sĩ A không đọc được bài, tổng, hay chi tiết của nghệ sĩ B
- label chỉ thấy nghệ sĩ trong label mình, không mở được tab tác quyền,
  không đọc được bản ghi của nghệ sĩ độc lập
- kỳ chưa duyệt: không một lời gọi nào trả về số — kể cả số đúng
- payload gửi xuống khách không chứa tên đơn vị phân phối, mã đối tác, hay tỷ lệ gốc
- tổng khách nhìn thấy khớp tổng admin tính ra, tới từng xu
- chuỗi chia tiền cân: phí + phần label giữ + điểm producer + phần nghệ sĩ = doanh thu gộp
- điểm producer trừ vào phần nghệ sĩ, không cộng thêm bên trên
- nghệ sĩ không gọi được danh sách nghệ sĩ của label; roster của label chỉ gồm nghệ sĩ
  thuộc label, cộng đúng phần label được hưởng, và không lộ tạm ứng cá nhân của nghệ sĩ
- hợp đồng của nghệ sĩ thuộc label lấy đúng tỷ lệ của label đó; nghệ sĩ độc lập không có label
- hồ sơ phát hành của nghệ sĩ này không lọt sang nghệ sĩ khác; label không gửi được hồ sơ cho
  nghệ sĩ ngoài roster; hồ sơ đi đúng bốn bước, không nhảy bước, mỗi bước một dòng nhật ký
- `lockdown()` gỡ hẳn mặt tiền admin và mọi ranh giới vẫn giữ nguyên sau đó

Một phép kiểm mang **nhãn cảnh báo có chủ ý**: bản mẫu chưa có phiên đăng nhập nên
`partyId` đến từ tham số. Khi lên thật, `partyId` phải lấy từ phiên trên máy chủ —
không thì sửa một con số trên URL là xem được người khác, và 26 phép kiểm còn lại
trở nên vô nghĩa.

Khi lên Postgres, dịch từng phép kiểm ở đây thành một test SQL trên policy RLS.

## 2. Không cần trình duyệt: hạ tầng và chất lượng lõi

```bash
node portal/test/luoc-do.js         # lược đồ state và di trú
node portal/test/ma-dinh-danh.js    # mã định danh không trùng
node portal/test/ranh-gioi-trang.js # trang không chạm state thô, không tự lưu
node portal/test/qc-bat-bien.js     # bất biến chuỗi tiền trên mọi kỳ, mọi đối tác
node portal/test/qc-quyen.js        # ma trận quyền: trang mở được thì hàm gọi được
node portal/test/qc-vai-quet.js     # mọi vai × mọi trang × mọi hàm đọc (283 phép)
node portal/test/qc-dem-nho.js      # đệm không được phép thiu
node portal/test/aaa.js             # hội đồng đi qua mọi cửa, giám đốc qua cửa
node portal/test/tien-ba-lop.js     # ba lớp người / bên / vai, độc lập 100%, label tự trả, huỷ chốt bù trừ
node portal/test/i18n-loi.js        # mọi lỗi lõi có bản tiếng Anh
```

| Bài | Kiểm gì |
|---|---|
| `luoc-do.js` | Mọi khoá của state phải khai trong `LUOC_DO` và ngược lại; kiểu khai khớp kiểu thật; state lược đồ 1 (còn `messages[]` trong ticket, còn `deliveries`) nhập lên là được nâng chứ không bị bỏ; di trú chạy hai lần cho cùng kết quả; file thuộc lược đồ mới hơn bị từ chối; ghi rồi nạp lại qua localStorage giữ `luocDoVer` và `maDem`. |
| `ma-dinh-danh.js` | Mã trong mười bảng không trùng và đúng mẫu; tạo liên tiếp năm việc ra năm mã tăng dần; xoá tài khoản rồi tạo lại không lấy lại mã cũ; **kiểm thử hồ sơ (preview) không ăn bộ đếm**; bút toán đếm riêng theo tháng; nạp lại lõi từ localStorage (tải lại trang) rồi tạo tiếp không trùng; nạp state không có `maDem` thì bộ đếm được đọc lại từ dữ liệu. Bài này sinh ra vì sáu bộ đếm từng là biến module — tải lại trang là về 0, và HSTK-2609-001, U0018, BT-202607-002 đã trùng thật. |
| `ranh-gioi-trang.js` | Đọc mã nguồn 46 trang và 4 file khung: không trang nào gọi `A.state(`; trang nội bộ chỉ chạm lõi qua `c.A`; trang đối tác không nhắc tới "admin" dù trong chuỗi; localStorage chỉ ở năm file được phép và chỉ với khoá `haustek.*` riêng; mỗi trang `HT.dangKy` đúng một lần. |
| `qc-bat-bien.js` | Với mọi kỳ đã duyệt và mọi đối tác: gộp = phí + phần các bên; ví = tổng tín dụng − đã rút; bảng kê đối tác khớp ví tới từng xu; thu hồi duyệt rồi duyệt lại cho đúng số cũ. |
| `qc-quyen.js` | `QUYEN_MAN`, `QUYEN_NHOM`, `QUYEN_HAM`, `MAN_CAP` phải nhất quán: trang mà vai mở được thì mọi hàm trang ấy gọi phải nằm trong nhóm vai ấy có; không vai nào trắng bảng; giám đốc không cầm nhập liệu lẫn kiểm số. |
| `qc-vai-quet.js` | Đăng nhập từng vai, mở từng trang, gọi từng hàm đọc trang ấy dùng — hàm nào ném "Không có quyền" trên trang được mở là hỏng. |
| `qc-dem-nho.js` | Mỗi hàm có đệm phải chứng minh: đổi thứ nó phụ thuộc (bảng giá, tỷ lệ, duyệt kỳ) thì số đổi theo, trả về chỗ cũ thì số về chỗ cũ. |
| `aaa.js` | Vòng 22: vai hội đồng (bod) là đường tắt DUY NHẤT và không có trong bảng nào; giám đốc qua cửa như mọi vai — không gõ số, không bỏ qua sai lệch, không gõ tỷ giá, không tạo hồ sơ thay; `giamSat` là nhóm có tên; chỉ hội đồng đưa người vào / ra khối hội đồng, thành viên cuối không khoá được; nhật ký ghi đúng người. Đọc cả mã nguồn lõi và trang để chắc không còn `role === "mgmt"`. |
| `tien-ba-lop.js` | Bốn quyết định tiền vòng 22: nghệ sĩ độc lập 100% sau phí; label tự trả theo hợp đồng (`labelTuTra`); ba lớp người dùng ↔ bên thụ hưởng ↔ vai trên bài — người cộng tác nhận lời mời được trả THẬT (trừ chủ, cộng bên nhận, ngưỡng thu hồi), tài khoản người nhận HTK-N được cấp tự động, một đăng nhập nhiều bên; huỷ chốt có bù trừ (sổ cái + rồi −, ví có thể âm và rút bị chặn). Kèm các lỗi lẻ: preview kỳ đã duyệt, tỷ giá báo giá rút tiền, dòng tỷ lệ của label mới, di trú lược đồ 3. |
| `i18n-loi.js` | Đọc mọi `new Error(...)` trong lõi (201 câu) và đòi `HAUSTEK.i18n.loi` dịch được từng câu sang tiếng Anh không còn dấu — thêm lỗi mới mà quên bản dịch là đỏ. |

## 3. Trình duyệt thật

Cần một server tĩnh đang chạy và `playwright` (`npm i -g playwright`).

```bash
cd portal && python3 -m http.server 8099 --bind 127.0.0.1 &
export NODE_PATH=$(npm root -g)
```

Ba bài `smoke.js` / `flow.js` / `edge.js` của bản v1 đã gỡ ở vòng 22 cùng với `intranet.html`,
`dashboard.html` và `screens/`; việc chúng làm (vẽ hết mọi trang, đi trọn chu trình, thu hồi
sạch 12 kỳ rồi mở lại) nay nằm trong `v2-quet.js`, `v2-luong.js` và `v2-khach-tk.js` bên dưới.

`layout.js` — mở trang chọn hướng ở 1500 / 1280 / 1100px, đi hết các hướng, bắt chữ bị cắt,
chữ tràn khung và lỗi console.

## Font thật, không phải font dự phòng

Máy chạy kiểm ở đây bị chặn ra `fonts.googleapis.com`, nên Chromium render bằng font dự
phòng — **rộng hơn** Be Vietnam Pro. Kiểm "vừa khung" bằng font đó là kiểm theo hướng an
toàn, nhưng nó không phải thứ khách nhìn thấy, và nó **giấu mất những lỗi chỉ xảy ra khi
chữ hẹp lại**.

`font-that.js` chặn đường gọi ra ngoài và trả về bộ chữ thật đã tải sẵn. Dựng file font
một lần:

```bash
curl -sSL "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800\
&family=Be+Vietnam+Pro:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" \
  -o /tmp/gf.css
# tải các woff2 trong gf.css về rồi nhúng base64 thay cho URL, ghi ra /tmp/fonts-local.css
```

Trỏ chỗ khác bằng `FONT_CSS=/duong/dan/khac.css`. Không có file thì `layout.js` vẫn chạy,
chỉ cảnh báo là đang dùng font dự phòng.

Chính bài kiểm này bắt được `full is not defined` ở hướng C — một lỗi chỉ nổ khi nhãn dài
quá chỗ, tức chỉ ở bề ngang hẹp, và các bài kiểm trước không thấy vì chúng không thu lỗi
console.

Biến môi trường: `BASE` (mặc định `http://127.0.0.1:8099`), `CHROMIUM` (đường dẫn
chromium nếu playwright không tự tìm được), `SHOTS` (nơi lưu ảnh chụp).

---

## Bài kiểm cho v2

| Bài | Kiểm gì |
|---|---|
| `v2-quet.js <trang> <bề ngang>` | Mở mọi trang × mọi tab × 2 chế độ × 2 ngôn ngữ. Bắt trang trống, trang lỗi, chữ tràn khung, **số tràn ô** (ô số, đầu cột, ô bảng), icon ô tìm đè chữ, placeholder `{…}` lọt ra, nhãn viết hoa kiểu máy. Chạy ở 390 / 640 / 900 để kiểm điện thoại, máy tính bảng và bảng bên của trình xem artifact. |
| `v2-hep.js [trang] [bề ngang]` | Khung ở màn hẹp: mọi thứ trong thanh trên phải nằm gọn trong thanh trên, trang không cuộn ngang, tên trang không bị cắt; ngăn điều hướng trượt ra đủ mục và đóng lại khi chọn mục, bấm nền, nhấn Escape; ở điện thoại cụm sáng/tối và VI/EN nằm trong ngăn. Mặc định 390 / 640 / 900 / 1024 / 1280, hai cổng. |
| `v2-nhu-artifact.js` | Bọc bản gói một trang **đúng như trình xem artifact** (nội dung nằm trong `<body>`, chặn sạch mạng ngoài) rồi đo kiểu đã tính: cột trái phải ăn màu khung, icon điều hướng phải 16px chứ không phải ô vuông to, bộ chữ phải là Be Vietnam Pro. DOM dựng đủ mà không còn CSS thì bài này đỏ, các bài khác vẫn xanh. |
| `v2-khong-mang.js` | Chặn mọi thứ không phải localhost, đòi cả bốn trang (hai cổng, bản gói, trang chọn) dựng được với **0 lời gọi ra ngoài**. |
| `v2-bam.js` | Bấm thật: mở 3 dòng đầu mỗi bảng, mở mọi hộp thoại an toàn, rê chuột lên biểu đồ. Bắt `NaN`, `undefined`, hộp thoại chồng nhau, Escape không đóng được. |
| `v2-khach-tk.js` | Lặp qua cả 11 tài khoản mẫu. Label không có tab tác quyền, nghệ sĩ độc lập có chặng "Haustek giữ thêm", người đang nợ tạm ứng có màn riêng — quét một tài khoản là quét đúng một trong số đó. |
| `v2-luong.js` | Chuỗi vận hành đầu-cuối, bấm bằng chuột: ghi nhận chênh lệch → chốt tỷ giá → duyệt kỳ → khách nhìn thấy → sổ kế toán cân → thu hồi → mọi thứ trả về. |
| `v2-tuong-phan.js` | Đo tương phản chữ/nền **trên trang đã render**, không phải theo cặp biến. Đây là điểm khác biệt quan trọng: bộ biến có thể đúng mà thành phần vẫn ghép nhầm cặp, và chữ 11px trên nền thẻ thì chuẩn AA đòi 4,5:1 chứ không phải 3:1. |
| `roi-cong-thuc.js` | Không cần trình duyệt. Neo `A.roi.tinh()` vào từng ô của `ROI_Haustek.xlsx` theo ba sheet còn đọc được số (Catalog, Trigger 1, Trigger 2), và chốt cách tính **đúng** ở bốn chỗ bảng tính lệch: số tháng thu hồi phải dương, tổng chi phí phải nhân đủ ba yếu tố, "net" phải trừ cả chi phí lẫn phí môi giới, còn nợ khi hết kỳ hạn phải bị trừ vào ROI. Kèm số biên (chia cho 0, tỷ lệ quá 100%, chữ lọt vào ô số) và ranh giới quyền theo vai. |
| `vong15-man.js` | Bốn thứ mới của vòng 15 chạy thật: gõ lượt nghe cho một ngày rồi trả về tự động và kiểm đường lượt nghe có đổi theo; gõ tổng doanh thu một nguồn rồi đọc lại ô trên bảng; gỡ một dòng nhật ký; mở bản in, bấm In, đóng lại; bấm đánh dấu và bỏ đánh dấu một bước trong bảng quy trình tranh chấp; xuất hồ sơ tranh chấp; mở hai trang cấp quản lý với Level 1 và kiểm Level 3 trở xuống bị chặn; và bên cổng đối tác, tự xuất bảng kê PDF. Chính bài này bắt được chỗ `hieuSuat.cua()` đặt trùng tên `dangLam` cho một con số và một mảng, khiến ngăn trượt in ra NaN mà không ném lỗi nào. |
| `vong16-man.js` | Hai đường đi của vòng 16, chạy thật trên trình duyệt: gõ mức trả đối tác ở trang Mức trả rồi đọc lại tiền của nghệ sĩ ở `agg` — số phải đổi; hứa trả cao hơn mức nền tảng trả về thì dòng đỏ và có cảnh báo; gỡ bảng giá thì mọi số hoàn nguyên. Rồi mở bảng đối soát của một ngày, gõ lệch 0,5% (khớp) và lệch 40% (lệch), gỡ ra về lại chờ; sang tab theo bài, kiểm đường dẫn store là https thật, gõ số cho một nền tảng và gỡ ra. Cuối cùng sang cổng đối tác mở bảng "Giải thích con số" và kiểm nhãn *bảng giá* có mặt còn mức gốc và biên thì không. Chính bài này bắt được nút "Giải thích" ở bảng kê đối tác gắn tay bấm nhầm vào nhánh *kỳ chưa mở*, nên bấm không ra gì với đối tác có bảng kê thật. |
| `vong17-man.js` | Công đoạn NGƯỜI làm của vòng 17, bấm thật từng nút: mở phiếu giao việc, kiểm metadata có đủ các bước của OneRPM, bấm nút chép rồi **đọc lại bộ nhớ tạm** xem có đúng chữ không; tick tool và kiểm mã tool trả về hiện lên, gỡ tick thì mã biến mất; chọn ba store rồi trả về toàn bộ; dán link Spotify vào ô Apple Music và đòi hệ thống báo "dán nhầm cột"; ghi số công khai rồi **đọc lại `agg()` để chắc tiền không đổi một xu**; và kiểm vai hỗ trợ không mở được trang. |
| `vong18-man.js` | Tác quyền chạy thật: mở trang, kiểm năm ô số và bốn tab, đòi con số tiền-để-trên-bàn phải lớn hơn 0; kiểm ba nhóm việc còn phải làm đều có nội dung; lọc "thiếu ISWC" rồi kiểm mọi dòng còn lại đều thiếu thật; mở ngăn chi tiết và đếm đủ mười bảy hội; **gõ tỷ lệ tác giả chỉ 90% rồi đòi hệ thống báo ngay trên mặt**; đăng ký đủ một lãnh thổ rồi kiểm lãnh thổ ấy rời khỏi danh sách hở và tổng tiền giảm; dán bảng Sentric hai dòng và kiểm nhận một, trả lại một; kiểm vai kinh doanh không vào được; và bên cổng đối tác, tác giả thấy tác phẩm mình với ISWC thật mà không thấy phí hay biên. |
| `goi-du-trang.js` | Không cần trình duyệt. So danh sách `<script src="man/…">` của `intranet.html` và `khach.html` với những gì thực sự nằm trong `goi-mot-trang.html`, và bắt cả file trang mồ côi. Bài này sinh ra vì vòng 15 thêm ba trang mà quên thêm vào danh sách gõ cứng trong `dung-goi.js`: suốt hai vòng, bản gói — tức bản artifact người ngoài xem — thiếu hẳn ba trang mới, mà mọi bài kiểm vẫn xanh vì bài nào cũng kiểm trang thật chứ không kiểm gói. |
| `roi-man.js` | Trang Tính ROI chạy thật: **đọc con số hiện trên mặt** rồi so với bảng tính, chứ không chỉ xem trang có vẽ ra hay không. Gõ vào ô nhập rồi kiểm kết quả có tính lại; bật ba mốc thưởng rồi kiểm bảng bốn kịch bản; đổi sang EN và nền tối; rời trang rồi quay lại xem số có được nhớ. Chính bài này bắt được lỗi `HM.nhap` dùng chung một đồng hồ hoãn cho cả trang. |
| `i18n-hai-chieu.js` | Vòng 22. Đổi ngôn ngữ rồi đi hết mọi trang và mọi tab của hai cổng, soi MỌI text node và thuộc tính (placeholder, aria-label, title). Dữ liệu — tên nghệ sĩ, tên bài, tên nhân sự, tên người cộng tác, ghi chú người gõ — bị loại trước khi soi; phần còn lại phải sạch ở cả hai chiều (ngưỡng 0): bật EN không còn tiếng Việt, bật VI không còn chữ khung tiếng Anh. Chính bài này bắt được 142 chỗ sót sau khi các trang đã "dịch xong": lý do hàng chờ, ghi chú tạm ứng, tên thị trường, nhật ký thao tác, tiêu đề ticket mẫu, tên nền tảng gom. |
| `v2-tieng-anh.js` | Bật EN rồi soi những chỗ **chỉ chứa chữ của giao diện** — nhãn, phụ đề thẻ, đầu cột, tab, câu giải thích. Tên nghệ sĩ, tên bài, tên label là DỮ LIỆU tiếng Việt và phải giữ nguyên, nên bài kiểm bỏ qua tiêu đề thẻ (nhiều chỗ là dữ liệu) và bóc phần trong ngoặc kép trước khi soi. |

Chạy:

```bash
cd portal && python3 -m http.server 8099 &
export NODE_PATH=$(npm root -g)
node test/v2-quet.js v2/intranet.html 1500,1280,1100
node test/v2-quet.js v2/khach.html    1500,1280,1100
node test/v2-quet.js v2/intranet.html 390,640,900      # điện thoại · máy tính bảng · bảng bên
node test/v2-quet.js v2/khach.html    390,640,900
node test/v2-hep.js
node test/v2-bam.js && node test/v2-khach-tk.js && node test/v2-luong.js
node test/v2-tuong-phan.js && node test/v2-tieng-anh.js && node test/i18n-hai-chieu.js && node test/api-guard.js
node test/luoc-do.js && node test/ma-dinh-danh.js && node test/ranh-gioi-trang.js
node test/qc-bat-bien.js && node test/qc-quyen.js && node test/qc-vai-quet.js && node test/qc-dem-nho.js
node test/roi-cong-thuc.js && node test/roi-man.js && node test/vong15-man.js && node test/vong16-man.js \
  && node test/vong17-man.js && node test/vong18-man.js && node test/goi-du-trang.js
node dung-goi.js && node test/v2-nhu-artifact.js && node test/v2-khong-mang.js
```

`dung-goi.js` dựng `goi-mot-trang.html`: cả hai cổng, bộ chữ và hệ giao diện gói vào một
file để dán lên trình xem artifact hoặc mở thẳng từ repo. Mỗi lần sửa nguồn phải dựng lại.

### Ba lần bài kiểm đo nhầm thứ

Ghi lại để lần sau đỡ mất thời gian tìm lại:

1. **Font.** Proxy chặn `fonts.googleapis.com`, nên Chromium ở đây render bằng font dự
   phòng rộng hơn Be Vietnam Pro. Mọi bài kiểm bố cục phải gọi `font-that.js` trước,
   không thì đo một trang không ai nhìn thấy.
2. **Khung cuộn ngang.** Bảng rộng nằm trong `.tw{overflow-x:auto}` là thiết kế có
   chủ ý, không phải tràn. Bài kiểm phải bỏ qua phần tử có tổ tiên đang cuộn ngang.
3. **Cuộn trang.** Bấm vào một dòng bảng làm trang cuộn xuống; đo toạ độ trước rồi
   mới rê chuột là rê vào chỗ không có gì, và bài kiểm báo "mách nước hỏng" trong khi
   nó vẫn chạy. Phải `scrollIntoViewIfNeeded()` rồi mới đo.
4. **Tương phản.** Đo theo cặp biến CSS thì ra 21/21 đạt; đo trên trang đã render thì
   ra 685 chỗ dưới chuẩn. Bộ biến đúng không có nghĩa là thành phần ghép đúng cặp, và
   chữ 11px đòi ngưỡng khác chữ 16px.
5. **Chữ tiếng Việt trong chế độ EN.** Không thể chỉ tìm dấu tiếng Việt: một nửa nội
   dung trang là dữ liệu tiếng Việt và phải giữ nguyên. Phải chọn đúng những ô CHỈ
   chứa chữ giao diện, và bóc tên riêng trong ngoặc kép ra.
6. **Trình xem artifact bọc nội dung vào body.** File rời mở thẳng thì trình duyệt tự
   đẩy `<style>` lên head, nên không bài kiểm nào trên file rời gặp cảnh ứng dụng ghi
   đè `body.innerHTML` và xoá mất CSS của chính nó. Phải bọc y như trình xem rồi đo
   kiểu đã tính, không đo "có dựng được không".
7. **Bề ngang.** Quét ở 1100–1500px thì cột điều hướng thu thành hàng ngang trông vẫn
   ổn; ở 900px (bảng bên của trình xem) hàng đó dài hơn khung 468px và ở điện thoại
   cả trang cuộn ngang. Người dùng nhìn ở bề ngang nào thì phải quét ở bề ngang đó.
8. **Cỡ chữ theo `vw`.** Con số trong ô số co theo bề rộng cửa sổ vẫn tràn khi dải ô
   nằm trong một thẻ hẹp hơn. Cỡ chữ phải theo bề rộng Ô (`cqi`), và bài kiểm phải đo
   `scrollWidth > clientWidth` của từng ô chứ không chỉ so với mép `main`.
