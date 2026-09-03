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
| Sửa được gì | nhập báo cáo, khớp, tỷ lệ, tạm ứng, duyệt kỳ | không sửa gì |
| Trang | 10 | 5 |

Hai file HTML nạp **cùng một** `haustek-core.js`. Khác nhau ở dòng đầu: `khach.html`
gọi `HAUSTEK.lockdown()` **trước khi** chạy bất cứ trang nào, và không bao giờ gọi
`provideSecrets()`.

> Nói cho đúng: đây là **hình dạng** của ranh giới, không phải ranh giới đã được thực
> thi. Hai trang cùng gốc thì nạp lại lõi trong iframe là có lại `.admin`, và
> `localStorage` thì trang nào cùng gốc cũng đọc được. Xem tab **Quản trị → Ranh giới
> hai cổng** để biết cái gì thật sự chặn được và cái gì không.

## Mười trang nội bộ

| Trang | File | Trả lời câu gì |
|---|---|---|
| Tổng quan | `man/tong-quan.js` | Kỳ này đóng được chưa, tiền chia đi đâu, còn gì treo |
| Nhập dữ liệu | `man/nap-du-lieu.js` | Kỳ nào thiếu nguồn nào: bảng 12 kỳ × 4 nguồn |
| Khớp ISRC | `man/khop-isrc.js` | Tiền chưa có chủ nằm ở đâu, khớp về ai |
| Đối soát & xét duyệt kỳ | `man/doi-chieu.js` | Tổng hệ thống có khớp file gốc không, xét duyệt được chưa |
| Phát hành | `man/phat-hanh.js` | Hồ sơ phát hành đối tác gửi lên: tiếp nhận → cấp ISRC/UPC → đã phát hành, hoặc trả lại bổ sung |
| **Kế toán** | `man/ke-toan.js` | Bút toán kỳ, công nợ bên nhận, tạm ứng phải thu, ghi nhận 12 kỳ, thuế |
| Chi trả | `man/chi-tra.js` | Ai nhận bao nhiêu, vì sao phần còn lại chưa về tay họ |
| Tạm ứng | `man/tam-ung.js` | Ai còn nợ, thu hồi tới đâu, còn mấy kỳ nữa |
| Tỷ lệ chia | `man/ty-le.js` | Bảng tỷ lệ có ngày hiệu lực, đổi từ kỳ nào |
| Danh mục | `man/danh-muc.js` | 50.000 bản ghi, tìm được, mở ra xem tiền từng bài |
| Quản trị | `man/quan-tri.js` | Tài khoản, nhật ký, câu hỏi treo, dữ liệu, ranh giới |

## Năm trang khách hàng

| Trang | File | Trả lời câu gì |
|---|---|---|
| Tổng quan | `man/k-tong-quan.js` | Kỳ này tôi được bao nhiêu, vì sao, bao giờ tiền vào |
| Bài của tôi | `man/k-ban-ghi.js` | Từng bài, phần về tay tôi trên mỗi bài |
| Nghệ sĩ | `man/k-nghe-si.js` | Chỉ label: từng nghệ sĩ trong roster mang về bao nhiêu, phần nghệ sĩ, phần label |
| Phát hành | `man/k-phat-hanh.js` | Bản phát hành trong danh mục, hồ sơ đang xử lý, gửi hồ sơ mới theo đúng trường của form metadata |
| Bảng kê | `man/k-bang-ke.js` | Bản đối soát chính thức: in ra, tải về, gửi kế toán |
| Tạm ứng | `man/k-tam-ung.js` | Vì sao kỳ này có doanh thu mà không nhận được tiền |
| Tài liệu | `man/k-tai-lieu.js` | Bảng kê các kỳ cũ, và câu trả lời cho những câu hay hỏi |

## Màn hẹp: bảng bên, máy tính bảng, điện thoại

Trên 1080px cột điều hướng đứng cố định bên trái. Dưới đó cột thu thành một **ngăn trượt**
mở bằng nút ☰ ở thanh trên, giữ nguyên bố cục dọc (nhóm, số đếm, chân cột), và đóng khi
chọn mục, bấm nền, hoặc nhấn Escape. Dưới 640px thanh trên chỉ còn tên trang và ô chọn kỳ;
cụm USD/VND, sáng/tối và VI/EN chuyển vào ngăn. Con số trong ô số co theo bề rộng ô
(`cqi`), không theo bề rộng cửa sổ. `test/v2-hep.js` đo hình học của khung ở
390 / 640 / 900 / 1024 / 1280px.

## Văn phong tiếng Việt

Mọi chữ tiếng Việt trên cổng theo `v2/VAN-PHONG.md`: một bảng thuật ngữ đã chốt (nguồn dữ
liệu, nhập báo cáo, đối soát, huỷ duyệt, nền tảng, thị trường, được hưởng, khách hàng…) và
mười hai quy tắc viết (không gạch ngang dài giữa câu, không mở câu bằng "nó", không viết
hoa cả cụm, nhãn cột là danh từ ngắn, nút là động từ + tân ngữ). Viết chữ mới thì đọc file
đó trước.

## Bản gói một trang

`node portal/dung-goi.js` nối lõi, khung, hệ giao diện, bộ chữ nhúng và mười lăm trang
thành `goi-mot-trang.html`. Bản gói có ô chọn cổng ở chân cột trái; cổng khách hàng vẫn
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
Việt Nam" — đúng với cổng nội bộ, sai hẳn với cổng khách hàng, vì người bật EN là đối tác nước
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
node test/v2-khach-tk.js                                # 11 tài khoản khách hàng, mỗi tài khoản một góc nhìn
node test/v2-luong.js                                   # chuỗi vận hành: nhập → khớp → chốt → duyệt → khách hàng thấy
node test/v2-tuong-phan.js                              # tương phản WCAG AA đo trên trang đã render, hai chế độ
node test/v2-tieng-anh.js                               # bật EN thì khung không còn tiếng Việt
node test/api-guard.js                                  # ranh giới quyền và chuỗi tiền
node dung-goi.js && node test/v2-nhu-artifact.js && node test/v2-khong-mang.js   # bản gói chạy trong trình xem, không mạng
```

Ba bài đầu cần Chromium ở `/opt/pw-browsers/chromium-1194/` và bộ font thật ở
`/tmp/fonts-local.css` (xem `test/README.md`) — thiếu font thì trang render bằng font
dự phòng rộng hơn, và bài kiểm bố cục đo nhầm thứ.
