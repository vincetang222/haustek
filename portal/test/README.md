# Kiểm thử

## 1. Ranh giới quyền — không cần trình duyệt

```bash
node portal/test/api-guard.js
```

41 phép kiểm chạy thẳng trên lõi (vòng 3 thêm: đối tác chỉ thấy số NET, ví và rút tiền, ticket và khiếu nại theo phạm vi, dự báo theo phạm vi, bảng kê và PDF; vòng 4 thêm: xu hướng ngày và playlist theo phạm vi). Đây là thứ **phải chạy trong CI** — mốc số 2 trong tài
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

## 2. Trình duyệt thật

Cần một server tĩnh đang chạy và `playwright` (`npm i -g playwright`).

```bash
npx http-server portal -p 8099 -c-1 &

node portal/test/smoke.js    # vẽ hết mọi màn hình intranet, gom lỗi console
node portal/test/flow.js     # đi hết một chu trình vận hành
node portal/test/edge.js     # thu hồi duyệt sạch 12 kỳ rồi mở lại từng màn hình
```

`smoke.js` — mở từng màn hình, đổi sang kỳ chưa duyệt, đổi sang VND, và báo lỗi nếu
màn hình nào ném lỗi hoặc ghi ra console.

`flow.js` — đi đúng con đường một người vận hành đi hằng tháng, rồi kiểm tra kết quả
xuất hiện ở cổng khách:

```
nạp luồng còn thiếu → khớp một dòng treo → ghi nhận chênh lệch
  → chốt tỷ giá → xét duyệt kỳ → cổng đối tác thấy kỳ mới
```

`edge.js` — trường hợp biên khắc nghiệt nhất: thu hồi duyệt **sạch cả 12 kỳ**, rồi mở lại
từng màn hình intranet và cả cổng khách. Đây là chỗ code hay chết vì chia cho 0, đọc `[0]`
của mảng rỗng, hoặc so với kỳ trước không tồn tại.

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
node test/v2-tuong-phan.js && node test/v2-tieng-anh.js && node test/api-guard.js
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
