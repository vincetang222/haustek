# Hợp đồng giữa khung và màn hình

Khung (`haustek-shell.js`) lo phần chung; màn hình chỉ lo nội dung của nó.
Mọi thứ dưới đây là những gì khung **hứa** cung cấp, và những gì màn hình
**phải** giữ.

## Đăng ký

```js
HT.dangKy({ id, nav, nhom, icon, dem, chu, ve });
```

| Trường | Bắt buộc | Nghĩa |
|---|---|---|
| `id` | có | Mã màn, dùng làm `#hash`. Chữ thường, gạch nối. |
| `ve(root, c)` | có | Dựng nội dung vào `root`. Được gọi lại mỗi lần đổi kỳ / ngôn ngữ / chế độ. |
| `nav` | nên | Khoá chữ cho nhãn ở cột trái. Thiếu thì lấy `id`. |
| `nhom` | không | Khoá chữ cho tên nhóm. Cùng nhóm thì xếp cạnh nhau theo thứ tự nạp file. |
| `icon` | không | Tên trong `HT.IC`. Mặc định `grid`. |
| `dem(c)` | không | Chuỗi nhỏ cạnh nhãn. Bắt đầu bằng `!` thì hiện màu cảnh báo. Ném lỗi thì bỏ qua, không làm hỏng cột trái. |
| `chu` | nên | `{ vi:{}, en:{} }`. Tra bằng `c.t('khoa')`. Thiếu khoá thì rơi về từ điển khung, rồi về chính chuỗi khoá. |

## Ngữ cảnh `c`

```
lang cur kyKey ky kys                     ngôn ngữ, tiền tệ, kỳ đang xem
fmt esc icon CHU                          định dạng và thoát chuỗi
t(khoa)                                   chữ của màn này, rồi tới chữ của khung
tien(v) tien2(v)                          số tiền theo tiền tệ đang chọn (0 và 2 chữ số thập phân)
doiKy(k) di(id) veLai()                   đổi kỳ, sang màn khác, vẽ lại màn này
thongBao(chu, kieu)                       'ok' | 'no' | không truyền
hoiThoai(o) → Promise                     trả về object từ các [data-o], hoặc null nếu huỷ
xacNhan(tieuDe, moTa, nhan, nguyHiem)     → Promise<boolean>
nganTruot(html, {tieuDe, phu, khiMo})     ngăn trượt bên phải
dongNgan()                                đóng ngăn
bang(o)                                   bảng có sắp xếp + phân trang
A                                         HAUSTEK.admin — CHỈ có ở cửa nội bộ
api phien                                 HAUSTEK.api và phiên khách — CHỈ có ở cổng khách
```

Màn hình của cửa nội bộ dùng `c.A`; màn hình của cổng khách dùng `c.api` + `c.phien`.
**Không màn nào được dùng cả hai** — dùng cả hai nghĩa là màn đó chạy được ở cả hai
cửa, và đó là con đường ngắn nhất để một ngày nào đó nó chạy nhầm cửa.

## Bốn luật màn hình phải giữ

1. **Mọi chuỗi từ dữ liệu đi qua `HM.esc()` trước khi ghép vào HTML.**
   Tên nghệ sĩ ở đây có `&`, `'`, `:`, dấu tiếng Việt: `nae & de'lay`, `ling:chi`,
   `HƯƠNGMYBÔNG`.

2. **Gọi `HB.gan(root)` sau khi đặt `root.innerHTML`**, nếu màn có biểu đồ.
   Biểu đồ cần bề ngang thật để vẽ, mà bề ngang chỉ có sau khi HTML vào DOM.
   Ngăn trượt cũng vậy: gọi `HB.gan(dr)` trong `khiMo`.

3. **Không nhớ trạng thái quá một lần vẽ, trừ bộ lọc.**
   Khung gọi lại `ve()` mỗi lần đổi kỳ, ngôn ngữ, chế độ. Biến ở phạm vi module giữ
   được bộ lọc và tab đang mở — đúng như mong đợi. Nhưng giữ **số liệu** ở đó là giữ
   số của kỳ cũ.

4. **Việc nặng đi qua `HM.nho(A, khoa, fn)`.**
   Tổng hợp một kỳ là quét 50.000 bản ghi. Bấm đổi sáng/tối một cái là vẽ lại cả màn.
   `HM.nho` nhớ theo **dấu mốc trạng thái**: admin duyệt kỳ hay nạp thêm luồng thì dấu
   mốc đổi và bộ nhớ tạm tự bỏ đi. Sau mỗi hành động đổi sổ, gọi `HM.quenHet()`.

## Khuôn dùng chung (`HM`)

```
dau({h1, mo, so:[{l,v,mau}]})             đầu trang + ô số bên phải
so([{l, v, s, lon, mau, tip, html}])      dải ô số
the({h2, p, than, chan, hanhDong, dai, thoBody, id})
tabs([{k,l,icon,dem}], dangMo)            tab trong màn — bắt bằng [data-tab]
trong({icon, tieuDe, moTa, nut})          ô trống CÓ NÓI LÝ DO
ghi({kieu, tieuDe, than, nut})            ô ghi chú: info | ok | warn | no
kv([{t, v, manh, mau, vHtml, tHtml}])     danh sách khoá : giá trị
tag(chu, kieu)  cham(kieu, chu)  dai(s,n)
bam(root, sel, fn)  doi(...)  nhap(...)   gắn sự kiện theo uỷ nhiệm
csv(ten, cot, dong)                       xuất CSV có BOM, phân cách bằng dấu chấm phẩy
lech(nay, truoc)  lechHtml(...)           so sánh hai kỳ
nho(A, khoa, fn)  quenHet()               nhớ tạm theo dấu mốc trạng thái
```

## Biểu đồ (`HB`)

```
HB.o({loai:'cot',   truc, chuoi, duong, dangDo, mo, noiBat, cao, hienGiaTri,
      anTruc, chuThich, dinhDang, tieuDeTip, ghiChuTip, chuTrong})
HB.o({loai:'thanh', hang:[{ten, gt, phu, mau}], tenTong, dinhDang})
HB.o({loai:'vong',  phan:[{ten, gt, mau}], giua:{v, l}, cao})
HB.o({loai:'thac',  buoc:[{l, v, kind:'top'|'out'|'final', nt}], cao})
HB.tia(gt, {rong, cao, mau})               tia nhỏ nằm trong dòng
HB.chia(phan, {cao, chuThich, dinhDang})   thanh chia phần nằm ngang
HB.mau('accent')  HB.dayMau()              màu đọc từ biến CSS
HB.gonTien(v)  HB.gonSo(v)
```

Ba trạng thái của một cột, **đừng gộp làm hai**:

* `gt[i] === null` → chưa có số nào → vạch cụt
* `dangDo` chứa `i` → có số nhưng chưa chốt → cột viền đứt, vẫn đúng độ cao
* còn lại → đã chốt → cột đặc

Vẽ kỳ chưa chốt thành vạch cụt ở cửa nội bộ là giấu mất thứ người vận hành cần nhìn
nhất: kỳ đang làm dở to cỡ nào.

## Đặt tên

Mã trong dự án này viết bằng tiếng Việt không dấu (`veDong`, `hangCho`, `dangDo`).
Không phải để cho lạ — mà vì mọi thuật ngữ nghiệp vụ ở đây (kỳ, luồng, khớp, treo,
dồn, thu hồi, bên nhận) đều là tiếng Việt trong đầu người vận hành, và dịch chúng
sang tiếng Anh làm mã xa khỏi thứ mà người đọc mã đang nói. Chỉ những gì thuộc về web
mới giữ tên tiếng Anh (`root`, `html`, `id`, `hash`).
