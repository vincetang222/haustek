<!-- Vòng 35 · bản thiết kế trang Thương vụ.
     Dựng từ bốn phương án độc lập, chấm bởi ba lăng kính (người dùng thật /
     an toàn tiền / hợp với hệ sẵn có), rồi tổng hợp.

     Bảng điểm:
       KHÔNG dựng trang mới      6,3/10 · 13 cú bấm
       Hàng đợi một cột          6,0/10 · 14 cú bấm
       Dòng đời thương vụ        6,0/10 · 10 cú bấm
       Bàn làm việc theo vai     5,7/10 · 10 cú bấm

     Bản tổng hợp KHÔNG chọn một trong bốn: dựng trang riêng, nhưng ghép hai
     lý lẽ không bác được của phương án đứng đầu vào trang Xét duyệt.

     Sáu khẳng định về lõi đã được đo lại tại chỗ, không lấy từ bản tổng hợp:
       L1  "thuong-vu" vắng trong MAN_TAT_CA; manCoQuyen trả true khi
           QUYEN_MAN[id] rỗng  → trang mới mọi vai đều thấy.           ĐÚNG
       L5  khopKhoa = false cả khi CRM không khai portalPartyKey
           (tvNoiDung đặt khoaCrm = null)                              ĐÚNG
       L3  tvNhanGoi ném MỘT chuỗi ghép kq.loi.join(" · ")             ĐÚNG
       L8  partiesListChoVai đặt opts.manager = _me.id với sales
           không phải trưởng                                          ĐÚNG
       L9  đối tác vừa tạo xong đọc ra viec = "gia-han",
           coHopDong = true                                    ĐO ĐƯỢC
       L10 tvTrinh in "chốt lại với khách" — trái VAN-PHONG.md         ĐÚNG

     Phạm vi ảnh hưởng của L9, đo trên 428 đối tác trong sổ: 3 bên xếp
     "gia-han", 428 bên có hạn suy ra từ hàm băm. Nên L9 chỉ chạm đúng
     những bên tạo mới từ đây về sau, không đảo nhãn của sổ hiện có. -->

# BẢN THIẾT KẾ CUỐI · TRANG THƯƠNG VỤ

Tài liệu dựng. Mọi khẳng định về lõi đã đối chiếu mã tại `portal/haustek-core.js`, `portal/v2/man/xet-duyet.js`, `portal/v2/haustek-man.js`, `portal/v2/haustek-shell.js`, `portal/test/`.

---

## 0 · Quyết định mở đầu, và chỗ phương án thắng đúng

Dựng trang riêng `thuong-vu`. Nhưng phương án **"Không dựng trang mới"** nêu hai lý lẽ mà ba phương án kia không bác được, và cả ba hội đồng đều xác nhận. Nói thẳng:

**Lý lẽ một, không bác được.** `lech` chỉ sinh ra trên thương vụ đã trình (`tvNhanGoi`, dòng 4655). Lúc ấy vật đang nằm trên bàn giám đốc là **đề xuất**, không phải thương vụ. Một trang Thương vụ riêng đặt dòng chênh lệch ở trang A trong khi cú bấm duyệt xảy ra ở trang B. Trang riêng thua hẳn ở đây.

**Lý lẽ hai, không bác được.** Kế toán **không có trang `doi-tac`** (`TO_CHUC`, khối tài chính, dòng 2591). Khối "Điều khoản CRM gửi" đặt trong ngăn hồ sơ **đề xuất** là bề mặt duy nhất người kiểm số chạm được trước khi bấm "Đã kiểm số".

Vì vậy bản thiết kế này **không chọn một trong hai**. Trang `thuong-vu` là cửa nhận gói, gắn đối tác và trình. Ba chỗ ghép vào `xet-duyet.js` ở mục 11 là **bắt buộc**, không phải tuỳ chọn: thiếu chúng thì trang riêng để cảnh báo ở ngoài cửa tiền, đúng lỗi phương án thắng đã chỉ ra.

Chỗ trang riêng thắng lại, cũng đo được:

- **Huy hiệu không phải tách đôi một con số.** Nhồi thương vụ vào Xét duyệt buộc huy hiệu kinh doanh chọn giữa "thương vụ chờ trình" và "đề xuất bị trả lại của chính tôi" (`xet-duyet.js:138` giao nút "Gửi lại" cho đúng người đề xuất). Hai trang thì hai huy hiệu, không mất con số nào.
- **Sửa `nutDx` / `moDx` là sửa luôn Bàn làm việc.** `xet-duyet.js:231-233` phơi `HT.nutDeXuat`, `HT.xuLyDeXuat`, `HT.moDeXuat`; `ban-lam-viec.js:162, 163, 198` gọi cả ba. Mọi nhánh "dòng này là đề xuất hay thương vụ" chảy sang một bảng không có viên lọc và không có cột nói chờ ai. Lời hứa "chỉ sửa hai tệp" không đứng.
- **Cửa nhập dữ liệu không đặt cạnh cửa quyết tiền.** Ban giám đốc có `deXuatTao` (`NHOM_GIAM_DOC_BO` chỉ bỏ `nhapLieu`, `kiemSo`, `tyGia`, `phatHanhHo`). Gom ô dán JSON vào đúng trang có nút "Duyệt" là rút đường dán gói, tự trình, tự duyệt xuống một màn hình.
- **"13 deal giờ ra sao" có một chỗ trả lời trọn.** Phương án thắng tự nhận không có chỗ nào trả lời được câu này.

---

## 1 · Thay đổi bắt buộc ở lõi, làm trước khi dựng trang

Không chỗ nào trong danh sách này là tuỳ chọn. Trang không dựng được, hoặc dựng ra sẽ nói dối, nếu thiếu.

**L1 · Khai trang vào ma trận quyền.** `MAN_TAT_CA` (dòng 2533) chưa có `"thuong-vu"`; `man` của khối `kinh-doanh` (2570) và `tai-chinh` (2591) cũng chưa có. `manCoQuyen()` (7500-7508) trả `true` khi `QUYEN_MAN[id]` rỗng, nên trang mới **mọi vai đều thấy**, kể cả vận hành và hỗ trợ, là hai khối không có nhóm `deXuat` nên `A.thuongVu.list()` ném `NO_QUYEN` ngay lúc vẽ. `test/qc-quyen.js` mở đầu bằng đúng câu cảnh báo này. Ba chỗ sửa trong lõi, cộng một thẻ `<script>` trong `intranet.html` đặt **trên** `man/xet-duyet.js`.

**L2 · `thuongVu.soatTrinh(id)` → nhóm `deXuat`.** Tách toàn bộ khối kiểm của `tvTrinh` (4722-4800) ra một hàm không tác dụng phụ `tvSoat(tv)`; `tvTrinh` gọi nó rồi ném câu đầu tiên, `soatTrinh` trả nguyên kết quả. Trả về:

```
{ ok, chan: [{ ma, cau }], phi, thang, docQuyen, ung, thuHoi, phiUng,
  haiDeXuat, coHopDong, viec, hanSuyRa, chanBoi }
```

`phi` là số `tvTrinh` sẽ dùng, `ung = Math.max(totalAdvanceUSD, initialAdvanceUSD + marketingFundUSD)`, `thuHoi = ung × (1 + ADVANCE_FEE)`. Lý do: lõi tự khai `tvTrinh` là **ranh giới quy đổi duy nhất** (4706, 4722). Để trang tự lật `1 − artistSharePct/100` và tự chạy `Math.max` là dựng chỗ quy đổi thứ hai, và số trong hộp xác nhận sẽ có ngày khác số vào sổ. `chanBoi` ghi mã đề xuất đang chắn khi `A_deXuatChoCuaBen` chặn.

**L3 · `thuongVu.xemGoi(goi)` → nhóm `deXuatTao`.** Đọc, không ghi. Trả `{ok, loi, tong, moi, lamMoi, dongBang, giongHet, dsDongBang:[dealId]}`. Dùng lại `tvKiemGoi`, `tvNoiDung`, `tvGiongNhau` và bảng `thuongVuDay` — không chép luật. Lý do: `nhanGoi` **ném** khi gói còn lỗi, và ném một câu ghép `kq.loi.join(" · ")` (4628), nên đi theo khuôn `catch → c.thongBao` là dồn cả danh sách lỗi vào một dòng, mất đúng tính chất "thấy hết lỗi một lượt" mà `tvKiemGoi` cố ý dựng ra để giữ.

**L4 · `tvDem()` trả thêm hai số.** Hiện trả `{moi, daTrinh, daBo}`. Thêm `chuaGan` (trangThai `moi` và `!khoa`) và `chenhLech` (trangThai `daTrinh` và `lech.length`). Một vòng quét bảng thương vụ, không đụng bảng đề xuất. Lý do: `dem()` chạy mỗi lần vẽ điều hướng; gọi `tvList()` ở đó là quét chéo bảng đề xuất theo từng dòng.

**L5 · `tvList` trả thêm hai trường.**

- `khoaTinh`: `"chuaGan" | "crmKhongDeNghi" | "khop" | "khac"`. Cờ `khopKhoa` hiện tại là `!!(x.khoa && x.khoaCrm && x.khoa === x.khoaCrm)` (4925), tức `false` **cả khi CRM không khai `portalPartyKey`**, mà `tvNoiDung` đặt `khoaCrm = null` khi gói thiếu trường ấy (4598). Treo huy hiệu "Khác đối tác CRM đề nghị" theo `!khopKhoa` là dán cảnh báo sai lên mọi deal ký mới. Ba trạng thái, không phải hai.
- `lech[i].khac`: mảng `[{khoa, ten, truoc, sau}]`, chỉ những khoá khác nhau, so bằng `tvChuoiOn` (4610). Lý do: `lech[i]` lưu nguyên hai object `terms` (4659). Bắt trang tự viết vòng so là biến trang thành chỗ thứ hai biết hình dạng `terms` của CRM.

**L6 · `thuongVu.goiDaPhat()` → nhóm `deXuat`.** Đọc `TV_TRA_KHOA` từ localStorage, trả `{co, luc, total, deals, khop}` với `khop` là kết quả so từng deal của gói đã ghi với `tvGoiTra()` dựng lại tại chỗ. Lý do: `test/ranh-gioi-trang.js` cấm trang đọc localStorage ngoài ba trang có ghi chú. Và `reviewProposal` bọc `tvPhatGoi` trong `try` rồi nuốt lỗi vào `audit.log("thuongVu.phatLoi", …)` (4332-4335), một dòng nhật ký mà **kinh doanh không có quyền đọc** (`QUYEN_HAM.audit = "doiSoat"`, khối kinh doanh không có nhóm ấy). Thiếu hàm này thì trang hứa "đây là câu đang gửi về CRM" trong khi localStorage có thể đã không ghi được.

**L7 · `thuongVu.lienQuan(deXuatId)` → nhóm `deXuat`.** Phơi `thuongVuLienQuan` (4554) nhưng trả bản ghi thương vụ đã qua `tvList` thay vì boolean. Lý do: ba chỗ ghép ở mục 11 cần, cho **mỗi dòng đề xuất**, câu trả lời "thương vụ nào trình ra cái này". Không có nó, `xet-duyet.js` phải quét `list({trangThai:'daTrinh'})` rồi dò `deXuat[]` cho từng dòng, mà `dongDx` chạy lại toàn bảng mỗi lần gõ một ký tự vào ô tìm (`HM.nhap`, dòng 100).

**L8 · `thuongVu.benGoiY(id, q)` → nhóm `deXuatTao`.** Trả `[{khoa, ten, ma, loai, nguoiPhuTrach, coHopDong, hanHopDong, hanSuyRa, laCrmDeNghi}]`, **không mang một con số tiền nào**. Lý do: `A.parties.list` đi qua `partiesListChoVai` (7592), và với vai `sales` không phải trưởng thì `opts.manager = _me.id` — chuyên viên chỉ thấy tài khoản mình phụ trách. Thương vụ CRM trỏ tới bên do người khác phụ trách thì hộp gắn đối tác **không có dòng nào để bấm**, và `tvGanBen` ném "Không có đối tác". Gắn đối tác là quyết định phải nhìn được mọi đối tác; hàm này mở đúng chừng ấy và không mở doanh thu.

**L9 · Đối tác tạo lúc nhận thương vụ không được tính là đã có hợp đồng.** `parties.create` ghi `state.contracts[pk]` vô điều kiện, kèm `to: to || addDays(from, 730)`. `contractCalc` đọc `coHopDong = !!ct` (4038), nên một bên vừa tạo ba mươi giây trước sẽ được dán nhãn **"gia hạn"**. Sửa: `create` ghi thêm `khoiTao: true` khi người gọi không khai `to`, `share`, `feePct`; `contractCalc` đọc `coHopDong = !!(ct && !ct.khoiTao)`.

**L10 · Hai câu trong lõi nói sai, sửa chuỗi.**

- `tvTrinh` (4808): "Sửa điều khoản bên CRM hoặc chốt lại với **khách** trước khi trình." `VAN-PHONG.md` cấm "khách". Đổi thành "chốt lại với đối tác".
- `tvTrinh` (4718): "Thương vụ đã bỏ …, không trình được nữa. **CRM gửi lại deal nếu muốn mở lại.**" Câu sau **không đúng**: `tvNhanGoi` (4655) thấy `cu.trangThai !== "moi"` thì đóng băng và ghi chênh lệch, `daBo` rơi vào đúng nhánh ấy. Không có đường nào đưa thương vụ `daBo` về `moi`. Đổi thành: "Bỏ là quyết định cuối. Mở lại cần một mã deal mới bên CRM."
- `xet-duyet.js` chuỗi `hoiDuyetHd` và `moTaDeXuat` trong lõi dùng "Phí Haustek". `VAN-PHONG.md` chốt **"phí dịch vụ Haustek"**.

**L11 · `TV_TEN_TIEN` mở thành `TV_TEN_DK`,** phủ thêm `artistSharePct` ("phần bên cấp quyền nhận"), `termMonths` ("thời hạn hợp đồng"), `exclusivityMonths` ("thời hạn độc quyền"), giữ nguyên bốn trường tiền đã có, vẫn một nguồn cho cả `vi` và `en` (5905 đang dịch theo bảng này). Lý do: bảng chênh lệch và câu chặn của cửa trình phải gọi cùng một trường bằng cùng một tên.

---

## 2 · Trang, điều hướng, huy hiệu

**Đăng ký** (`v2/man/thuong-vu.js`, thẻ `<script>` đặt ngay trên `man/xet-duyet.js` trong `intranet.html`; `dung-goi.js` đọc danh sách trang từ chính các thẻ ấy nên bản gói tự có):

```js
HT.dangKy({
  id: 'thuong-vu', nav: 'navThuongVu', nhom: 'nhomTien', icon: 'down2',
  dem: demTv, chu: { vi: {...}, en: {...} }, ve: ve
});
```

**Tên trang.** Nhãn điều hướng "Thương vụ". Tiêu đề `h1` "Thương vụ từ CRM". Nhóm điều hướng `nhomTien` (Tài chính), đứng ngay trên "Xét duyệt" để hai chặng cuối nằm cạnh nhau.

**Chú thích** nằm trong dấu `?` cạnh `h1`, không rải chữ ra trang. `HM.dau` chỉ có **một** khe chữ và khe ấy render thành nút `?` (`giup(o.mo)`), nên không có dòng mô tả dưới tiêu đề. Nội dung dấu `?`:

> CRM gửi thương vụ đã đàm phán sang bằng một gói JSON. Portal gắn đối tác thật rồi trình thành đề xuất cho giám đốc quyết. Trình xong thì điều khoản đóng băng: gói tới sau chỉ ghi thêm một dòng chênh lệch.

**Huy hiệu `dem()`.** Một quy tắc, không ngoại lệ: **con số trên một mục điều hướng luôn là việc vai ấy bấm được ở trang ấy.** Không con số nào đếm hai loại vật thể.

| Vai | Huy hiệu trang Thương vụ | Vì sao |
|---|---|---|
| kinh doanh, ban giám đốc, hội đồng (có `deXuatTao`) | `'!' + dem.moi`, rỗng khi bằng 0 | Thương vụ `moi` là việc họ gắn đối tác hoặc trình. Cả hai nút đều ở trang này. |
| kế toán (có `deXuat`, không có `deXuatTao`) | **rỗng** | Không nút nào trên trang này của họ. Gắn một dấu chấm than lên một trang không bấm được là một cái bẫy. Tín hiệu của kế toán nằm trên dòng đề xuất ở trang Xét duyệt, xem mục 11. |
| vận hành, hỗ trợ | không thấy trang | L1 |

Huy hiệu trang **Xét duyệt giữ nguyên không đổi một dòng nào**. Nhờ thế con số "đề xuất bị trả lại của chính tôi" của kinh doanh (`xet-duyet.js:25`, `k.pending`) không mất đi. Đây là chỗ hai trang thắng một trang.

Hàm phải bọc `try/catch` trả `''`, đúng khuôn `xet-duyet.js:25`:

```js
function demTv(c) {
  try {
    var A = c.A, d = A.thuongVu.dem();
    if (!A.quyen.nhom('deXuatTao')) return '';
    return d.moi ? '!' + d.moi : '';
  } catch (e) { return ''; }
}
```

---

## 3 · Tab

Ba tab, ăn khớp **một đối một** với ba `trangThai` của lõi. Không tab nào gộp hai trạng thái, không tab nào bịa trạng thái thứ tư. Đây là chỗ trang này sạch hơn bản gốc: `xet-duyet` phải gộp `submitted`, `checked`, `returned` vào một tab.

| Tab | Khoá `LOC.tab` | Lọc | Số trên tab | Nghĩa |
|---|---|---|---|---|
| **Chờ xử lý** | `moi` | `list({trangThai:'moi'})` | `dem.moi` | Đã nhận từ CRM, chưa trình. Trong tab này có hai chặng con: chưa gắn đối tác, và đã gắn chờ trình. Cột "Cửa trình" nói rõ đang chờ việc gì. |
| **Đã trình** | `daTrinh` | `list({trangThai:'daTrinh'})` | `dem.daTrinh` | Đã dựng một hoặc hai đề xuất. Trạng thái sống của từng đề xuất đọc lại từ bảng đề xuất mỗi lần vẽ (`tvList`, 4915-4921), nên giám đốc quyết ở trang Xét duyệt là dòng ở đây đổi theo, không ai phải bấm làm mới. |
| **Đã bỏ** | `daBo` | `list({trangThai:'daBo'})` | `dem.daBo` | Bỏ ở Portal, có lý do. Cửa một chiều. |

Số trên tab là một con số một loại vật thể, nên hiện thẳng, không phải ghép hai vế.

---

## 4 · Ô số và hàng lọc

**Bốn ô số** (`HM.so`), cố ý không lặp lại số của tab:

1. **Thương vụ chờ xử lý** · `dem.moi` · ô lớn · dòng phụ `"{a} chưa gắn đối tác"` lấy từ `dem.chuaGan`
2. **Giá trị thương vụ chờ xử lý** · tổng `giaTri` của tab `moi` · dòng phụ "theo số CRM khai, Portal chưa đối chiếu"
3. **Thương vụ có chênh lệch điều khoản** · `dem.chenhLech` · màu cảnh báo khi lớn hơn 0 · **bấm được**, đặt `LOC.tab = 'daTrinh'` và `LOC.vien = 'lech'`
4. **Lần phát gói trả về gần nhất** · từ `goiDaPhat()`: `HT.fmt.date(luc)` · dòng phụ `"{n} thương vụ trong gói"`, hoặc "Chưa phát gói nào" khi `!co`, hoặc huy hiệu đỏ "Chưa gửi được về CRM" khi `!khop`

Ô 3 và ô 4 là hai thứ không ai đi tìm nên phải tự đi tìm người.

**Hàng lọc** (`div.bar`), đúng hình hàng lọc của `xet-duyet.js:88-90`:

- Ba viên lọc: **Mọi thương vụ** · **Chưa gắn đối tác** · **Có chênh lệch điều khoản** (`LOC.vien`)
- Một viên lọc thứ tư chỉ hiện với vai `sales`: **Của tôi**, lọc `phuTrach` khớp `A.staff.me.name`
- Ô tìm: "Tìm đối tác, mã thương vụ, mã deal, mã đề xuất…". Chuỗi tìm ghép `id + dealId + tenBen + maBen + tenCrm + phuTrach + deXuat.map(d => d.id).join(' ')`. Mã đề xuất nằm trong chuỗi tìm là toàn bộ việc tra ngược của kế toán.
- Một viên lọc **tạm thời** xuất hiện sau khi nhận gói: `"13 thương vụ vừa nhận ✕"` hoặc `"3 thương vụ có chênh lệch mới ✕"`, đọc `LOC.chi` (mảng mã). Bấm `✕` xoá. Đây là trạng thái lọc thứ hai, có thật, và được tính vào chi phí dựng.

`LOC = { tab: 'moi', vien: 'all', tim: '', chi: null, trang: 0 }`. Phân trang bằng `HTM.phanTrang`.

---

## 5 · Cột bảng, trái sang phải

Sáu cột. Đầu cột dùng `HM.hoi()` cho dấu `?` cỡ nhãn ở hai cột cần.

| # | Đầu cột | Nội dung |
|---|---|---|
| 1 | **Thương vụ** | `HM.tenBia({ bia: dealId, ten: tv.ten, phu: … })`. Dòng phụ: `"TV-2609-004 · DEAL-8821 · 4 ngày"`. Hai mã đứng cạnh nhau ở **mọi** dòng, để hai đội nói về cùng một vật mà không tra chéo bảng nào. Số ngày đếm từ `nhanLuc`. |
| 2 | **Đối tác** | Đã gắn: tên bên và mã HTK. Chưa gắn: tên CRM khai, chữ mờ, kèm huy hiệu cảnh báo "Chưa gắn đối tác". Dưới tên, một huy hiệu theo `khoaTinh`: `khop` → chữ mờ "gắn theo CRM đề nghị"; `khac` → huy hiệu vàng **"Khác đối tác CRM đề nghị"**; `crmKhongDeNghi` → không huy hiệu nào. Huy hiệu này đi theo thương vụ tới tận cửa cuối, xem mục 11. |
| 3 | **Điều khoản CRM khai** | Dòng chính: `"60 tháng · bên cấp quyền nhận 70%"` — **nguyên văn số CRM gửi, không quy đổi**. Dòng phụ: `"Việt Nam · Nguyễn Văn A · phân phối, YouTube"` (thị trường · người phụ trách · quyền đã đàm phán, ba cờ `dist` `pub` `yt`, cờ nào không có thì bỏ). Đầu cột có dấu `?`: "Số trong cột này là số CRM khai, giữ nguyên văn. Portal quy đổi đúng một lần, lúc trình đề xuất." |
| 4 | **Giá trị** | Canh phải. `giaTri` USD. Dòng phụ khi `soatTrinh().ung ≥ 100`: `"tạm ứng 16.100 USD"`, dùng **số lõi sẽ dùng**, không phải `initialAdvanceUSD`. Không có tạm ứng thì dấu gạch. |
| 5 | **Cửa trình** (tab Chờ xử lý) / **Đề xuất** (tab Đã trình) / **Lý do bỏ** (tab Đã bỏ) | Đầu cột đổi theo tab, vì tab đã quyết dòng nào vào bảng nên một cột không bao giờ mang hai nghĩa cùng lúc. Nội dung ở mục 6. |
| 6 | **Thao tác** | Tối đa hai nút chính, phần còn lại vào menu `⋯` (`HM.menu`), đúng luật `nutDx` (`xet-duyet.js:128-141`). Vai không đủ quyền: `<span class="nil">—</span>`, **không** vẽ nút mờ rồi chặn khi bấm, **không** hiện câu xin lỗi về quyền. |

Cột 5 chi tiết:

- **Tab Chờ xử lý** — đọc `soatTrinh(id)`:
  - chưa gắn đối tác → `HM.tag('Chờ gắn đối tác', 'warn')`
  - đã gắn, `ok` → `HM.tag('Trình được', 'ok')`, dòng phụ `"phí dịch vụ Haustek 30,0% · hai đề xuất"` khi `haiDeXuat`
  - đã gắn, `!ok` → `HM.tag('Chưa trình được', 'no')` và **nguyên văn câu chặn đầu tiên** của lõi, đưa qua `A.i18n.loi(cau, c.lang)` trước khi vẽ. Nhiều câu thì hiện câu đầu cộng `"và 2 điều kiện nữa"`, bấm dòng mở ngăn xem đủ. Khi `chanBoi` có mã, câu ấy đã tự nói: "Đối tác đã có đề xuất hợp đồng DX-2609-003 đang xử lý."
- **Tab Đã trình** — hai chip xếp dọc, mỗi chip `HTM.tagDx(trangThai)` đọc từ `tv.deXuat[i].trangThai`: `"Hợp đồng DX-2609-004 · Đã duyệt"`, `"Tạm ứng DX-2609-005 · Trả lại"`. Hai chip khác trạng thái thì thêm nhãn `"Hai đề xuất đã tách"`. Dưới đó, khi `lech.length`: huy hiệu đỏ `"Chênh lệch điều khoản · 2 lần"`, dòng phụ `"CRM gửi lại lúc 14/09 · Portal giữ bản đã trình"`.
- **Tab Đã bỏ** — `tv.lyDo` rút bằng `HM.dai(…, 48)`.

**Không có cột ROI, cột Hạng, cột Khuyến nghị.** Bản tính chỉ dựng lúc tạo đề xuất; trang Xét duyệt đã có. Đưa ba cột rỗng vào đây là làm một phần ba bảng trông như dữ liệu hỏng.

---

## 6 · Thao tác trên dòng và hộp xác nhận

Luật chung: **cú bấm sửa lại được thì không có hộp thoại; cú bấm không quay lại được thì hộp thoại bắt buộc và hộp ấy nói hậu quả bằng tiền, gọi tên đối tác bằng chữ.**

`tvGanBen` gọi lại được chừng nào `trangThai` còn `moi` (4693-4703). `tvTrinh` thì không. `tvBo` thì không.

### 6.1 · Gắn đối tác

Nút chính trên dòng ở tab Chờ xử lý khi chưa gắn; nút phụ "Gắn lại đối tác" trong menu `⋯` khi đã gắn.

Hộp thoại **rộng** (`rong: true`), gồm:

1. **Khối dữ kiện CRM khai**, đặt trên danh sách chọn, không bắt ai nhớ: tên CRM khai, mã `khoaCrm` nếu có, thị trường, người phụ trách, giá trị, ngày đóng.
2. **Ô tìm** nối `thuongVu.benGoiY(id, q)`. Khi `khoaCrm` tra ra một bên có thật, bên ấy **nằm đầu danh sách, mang nhãn "CRM đề nghị", nhưng KHÔNG được chọn sẵn.** Lý do ghi thẳng trong lõi ngay trên `tvGanBen`: "gói có thể sai hoặc bị sửa, quyết định này thì có danh tính". Chọn sẵn rồi để nút đóng tên "Gắn đối tác" biến một quyết định có danh tính thành một cú xác nhận. Một cú bấm thêm cho mỗi deal là giá phải trả, và đó là giá đúng.
3. Mỗi dòng gợi ý hiện: tên, mã HTK, loại (label hoặc nghệ sĩ), người phụ trách, và **một trong hai câu về hợp đồng**: `"Có hợp đồng, hết hạn 12/2027"` hoặc `"Chưa có hợp đồng ở Portal"`. Khi `hanSuyRa` là `true`, ngày ấy **không hiện**: `contractEndOf()` suy ra ngày từ hash mã bên khi không có hợp đồng thật, và `QUY-TRINH-CRM-PORTAL.md` đo được 136 trong 138 việc "sắp hết hạn" là ngày do hàm băm sinh. Một tín hiệu bịa ở đúng bước nguy nhất thì tệ hơn không có tín hiệu.
4. **Khối "Thêm đối tác mới"**, chỉ vẽ với nhóm `doiTacTao`, mở ra khi ô tìm không có kết quả nào. Ba ô: tên (điền sẵn `tenCrm`), loại (điền sẵn theo `loaiBen`), người phụ trách (điền sẵn người đang đăng nhập nếu là kinh doanh). **Không có ô thời hạn, không có ô phần đối tác hưởng, không có ô phí.** Gọi `A.parties.create({name, kind, managerId}, me.email)` rồi `ganBen` ngay. Nhờ L9, bên tạo theo đường này mang `khoiTao: true` nên `contractCalc` vẫn xếp thương vụ vào **ký mới**, không phải gia hạn. Lý do phải có khối này: `tvGanBen` gọi `coDoiTac(khoa)` và ném "Không có đối tác" (4695); `QUY-TRINH-CRM-PORTAL.md` đo 428 đối tác mà chỉ 3 có bản ghi hợp đồng, nên phần lớn deal CRM đẩy sang là ký mới. Không có khối này thì nút chính của bước gắn ném lỗi với phần lớn số dòng.
5. Khi vai là `sales` không phải trưởng và ô tìm không ra gì: một dòng chữ mờ `"Ô tìm tra mọi đối tác trong Portal, không chỉ tài khoản bạn phụ trách."` Câu này chỉ đúng sau khi có L8; trước đó nó là lời hứa vỡ.

**Hộp xác nhận**: không có hộp thứ hai. Nút đóng của chính hộp này tên **"Gắn đối tác"**, và ngay trên nút là một câu:

> Đề xuất hợp đồng và đề xuất tạm ứng sẽ dựng trên sổ của **{tên bên}** · **{mã HTK}**. Đổi lại được cho tới lúc trình đề xuất.

Sau khi gắn, dòng **ở nguyên chỗ cũ trong bảng** (vẫn tab Chờ xử lý), đổi cột 2 và cột 5, nút chính đổi sang "Trình đề xuất". Cố ý không nhảy dòng, không nhảy tab: người đang làm 13 deal không nên bị mất chỗ đứng sau mỗi thao tác.

### 6.2 · Trình đề xuất

Nút chính trên dòng khi đã gắn đối tác. **Nút ở thể mờ, không bấm được, khi `soatTrinh().ok` là `false`**, và cột 5 đã nói vì sao. Không ai bấm một cú để nhận một lời từ chối.

Hộp xác nhận, tiêu đề `"Trình đề xuất · {tên bên}"`, thân:

- Dòng đầu: `{tên bên} · {mã HTK} · TV-2609-004 · DEAL-8821`. Bước cuối còn sửa được là bước rẻ nhất để phát hiện gắn nhầm bên.
- Khi `khoaTinh === 'khac'`: một dòng cảnh báo, `"CRM đề nghị {tên bên CRM khai}. Thương vụ này đang gắn vào {tên bên đã chọn}."`
- **Hậu quả tiền, hợp đồng**:
  > Phí dịch vụ Haustek **30,0%** áp cho {tên bên} từ kỳ mở tiếp theo, hạn **60 tháng**, có độc quyền.

  Thêm câu sau **chỉ khi** `coHopDong`: "Hợp đồng hiện tại của đối tác này hết hiệu lực."
- **Hậu quả tiền, tạm ứng**, chỉ khi `ung ≥ 100`:
  > Khoản tạm ứng **16.100 USD** cộng phí tạm ứng theo mức Portal **12%**, tổng phải thu hồi **18.032 USD**, ghi vào sổ tạm ứng của {tên bên} và thu hồi từ phần đối tác được hưởng mỗi kỳ. Số này khác số CRM khai vì mức phí tạm ứng là chính sách của Portal.

  Ba con số lấy từ `soatTrinh()`, không do trang tính. `ung = Math.max(totalAdvanceUSD, initialAdvanceUSD + marketingFundUSD)`, `thuHoi = ung × 1,12` (`advanceCalc`, 3966). Gói mẫu bỏ trống ô tổng mà khai `initialAdvanceUSD 14000` cộng `marketingFundUSD 2100` vẫn ra đúng 16.100. Hộp ghi 14.000 là nói thiếu 2.100 USD ở đúng câu duy nhất nói về tiền.
- **Hai đề xuất**, chỉ khi `haiDeXuat`:
  > Thương vụ này sinh hai đề xuất: hợp đồng và tạm ứng. Giám đốc quyết riêng từng đề xuất, có thể duyệt một và trả lại một.
- **Dòng khoá cửa**, luôn có, đặt cuối:
  > Trình xong thì điều khoản đóng băng và không đổi được đối tác nữa.

Nút đóng: **"Trình đề xuất"**. Nút huỷ giữ mặc định.

Sau khi trình thành công: thông báo `"Đã trình DX-2609-004 và DX-2609-005"`, dòng chuyển sang tab Đã trình, `LOC.tab` **giữ nguyên** ở Chờ xử lý.

### 6.3 · Bỏ thương vụ

Mục trong menu `⋯`, chỉ ở tab Chờ xử lý.

Hộp xác nhận, `nguyHiem: true`, có `<textarea data-o="lyDo">` **bắt buộc** (nút đóng mờ cho tới khi có chữ; `tvBo` nhận lý do rỗng nhưng lý do rỗng là một dòng nhật ký vô dụng):

> Tiêu đề: Bỏ thương vụ TV-2609-004
> Mô tả: Bỏ là quyết định cuối. Thương vụ đã bỏ không trình được nữa, và CRM gửi lại cùng mã deal cũng không mở lại được; mở lại cần một mã deal mới bên CRM. Gói trả về CRM chỉ mang thương vụ đã trình, nên bên CRM sẽ không đọc được dòng trạng thái nào cho thương vụ này.
> Nhãn ô: Lý do bỏ (ghi vào bản ghi và nhật ký thao tác)
> Nút đóng: Bỏ thương vụ

Câu thứ hai và thứ ba đều đo được: `tvNhanGoi` (4655) không đưa `daBo` về `moi`; `tvGoiTra` (4567) bỏ qua mọi thương vụ `trangThai !== "daTrinh"`.

### 6.4 · Các nút còn lại

- **"Mở đề xuất"** (tab Đã trình): gọi `HT.moDeXuat(c, id)`. **Kiểm trước**: `A.proposals.get(id)` trả `null` với vai `sales` khi `p.by !== me.name` (`proposalGetChoVai`, 7588). Null thì không vẽ nút, thay bằng chữ mờ `"Đề xuất do {người trình} trình. Chỉ người trình và cấp trưởng mở được hồ sơ đề xuất."` Vẽ một nút không làm gì khi bấm là hỏng hơn không vẽ.
- **"Phát gói trả về CRM"** ở tiêu đề trang, nhóm `deXuatTao`, kiểu `ghost`. Gọi `A.thuongVu.phatGoi(me.name)`. Cần vì `tvPhatGoi` chỉ tự chạy trong `reviewProposal` (4331), tức **chỉ sau khi có người xét duyệt một đề xuất**. Mười ba thương vụ trình xong mà chưa ai quyết thì khoá `haustek.portal.contracts.v1` vẫn rỗng, đúng khoảng thời gian A&R cần biết nhất. Hộp xác nhận: `"Ghi lại gói trạng thái cho CRM đọc. Gói mang {n} thương vụ đã trình, không mang thương vụ chưa trình và không mang thương vụ đã bỏ. Gói không mang một con số tiền nào."`
- **"Nhận gói từ CRM"** ở tiêu đề trang, nhóm `deXuatTao`, kiểu `pri`, ký hiệu `down2`. Mục 7.

Tiêu đề trang vì thế có đúng **hai** nút, không phải bốn.

---

## 7 · Luồng dán gói JSON từ CRM

Hộp thoại **rộng**, tiêu đề "Nhận gói từ CRM", mở ra với con trỏ đã nằm trong ô dán.

**Thân hộp:**

- Một `<textarea data-o="goi" rows="10">`, nhãn "Gói JSON từ CRM".
- Dưới ô: một vùng `[data-kiem]` cập nhật sau mỗi lần gõ, debounce 220 ms (đúng nhịp `xemTinh` đang dùng, `xet-duyet.js:224`). Gọi `A.thuongVu.xemGoi(giaTri)`.
- Nút đóng "Nhận gói" **mờ và không bấm được** cho tới khi `ok`.

**Khi gói có lỗi.** Hiện **đủ mọi lỗi một lượt**, mỗi lỗi một dòng, dưới ô dán, không sửa từng cái một, không dồn thành một dòng thông báo. Đây là lý do `tvKiemGoi` cố ý không ném và trả `loi[]` (4451). Các câu lỗi là câu của lõi, đưa qua `A.i18n.loi` trước khi vẽ:

```
Gói không mang dấu "haustek-crm"
Deal thứ 4 thiếu mã deal
Deal thứ 7 có mã deal không phải chuỗi (object)
Mã deal DEAL-8821 xuất hiện 2 lần trong cùng một gói
```

Chân vùng kiểm khi có lỗi: `"Gói có 4 chỗ phải sửa. Sửa bên CRM rồi xuất lại gói."` Không được gọi `nhanGoi` khi còn lỗi: nó ném một câu ghép `kq.loi.join(" · ")` và cả danh sách sẽ dồn vào một dòng.

**Khi gói sạch và có deal trùng.** Vùng kiểm hiện bốn dòng, dựng từ `xemGoi`:

```
Gói mang 13 thương vụ
  9 thương vụ mới
  2 làm mới thương vụ chưa trình
  1 thương vụ đã trình, gói này ghi một dòng chênh lệch
  1 bỏ qua vì y nguyên bản đã nhận
```

Vế thứ tư là chỗ nói ra chuyện trùng: cùng một `dealId` đã nhận rồi, nội dung y nguyên, lõi bỏ qua. Vế thứ ba là chuyện khác hẳn: cùng `dealId`, nội dung khác, mà thương vụ đã trình, nên lõi **đóng băng** và ghi chênh lệch. Dòng ấy liệt kê mã: `"DEAL-8821"`.

Một câu nữa dưới đó khi vế thứ ba lớn hơn 0: `"Điều khoản đã trình không đổi theo gói mới."`

**Sau khi bấm "Nhận gói".** Không dùng một dòng thông báo trôi mất. Trang vẽ một **khối kết quả** ngay dưới hàng lọc, giữ nguyên cho tới thao tác kế tiếp, đọc thẳng `{them, capNhat, lech, bo, ids, idLech}` mà `nhanGoi` trả về:

| Số | Bấm được | Bấm thì làm gì |
|---|---|---|
| Đã nhận 9 thương vụ mới | có | `LOC.tab='moi'`, `LOC.chi = ids` |
| Làm mới 2 thương vụ | không | lõi không trả mảng mã cho vế này |
| 1 thương vụ có chênh lệch mới | có | `LOC.tab='daTrinh'`, `LOC.chi = idLech` |
| Bỏ qua 1 thương vụ y nguyên | không | lõi không trả mảng mã cho vế này |

Hai số không bấm được thì vẽ trơn, không giả vờ là nút. Vế nào bằng 0 thì **không in ra** — đúng cách `audit.log` của lõi đã dựng câu ấy (4683-4685).

`LOC.chi` sinh ra viên lọc tạm thời ở hàng lọc, có dấu `✕` để xoá.

**Không tự nhảy tab.** Người vừa dán gói đang muốn thấy 13 dòng vừa nhận. Nhảy sang tab khác là giấu đúng thứ họ vừa tạo ra. Dòng chênh lệch tới bằng một cú bấm rõ ràng, không bằng một chuyển động bất ngờ.

**Kênh vào.** Chân hộp có một dòng chữ mờ, cố định: `"Bản mẫu nhận gói bằng cách dán. Bản vận hành thật sẽ đọc thẳng từ CRM."` Không bao giờ được coi một lượt dán thành công là đã đồng bộ hai hệ.

---

## 8 · Deal có tạm ứng: hai đề xuất, có thể một duyệt một trả

`tvTrinh` (4841-4860) dựng thật hai đề xuất, và `tv.deXuat` là một **mảng**. `tvChiTiet` (4540-4552) đã có sẵn ca "hợp đồng đã duyệt, tạm ứng bị trả lại". Trang đi theo lõi, không dựng máy trạng thái thứ hai.

**Bốn chỗ nói ra chuyện một deal hai lần bấm, ba chỗ đầu nằm trước cú bấm:**

1. **Trước khi trình.** Cột 4 ghi `"tạm ứng 16.100 USD"`; cột 5 ghi dòng phụ `"hai đề xuất"`. Hộp trình có khối riêng, mục 6.2. Không ai bị bất ngờ vì danh sách chờ của giám đốc dài thêm hai dòng.
2. **Sau khi trình, trên dòng thương vụ.** Cột 5 có hai chip xếp dọc với trạng thái sống. Đây là chỗ **duy nhất** một lõi ba trạng thái nói được sự thật "hợp đồng đã duyệt, tạm ứng bị trả lại": ô trạng thái của thương vụ vẫn chỉ là `daTrinh` và trang **không bịa trạng thái thứ tư để che**.
3. **Trên hai dòng đề xuất ở trang Xét duyệt.** Huy hiệu chéo nhau, mục 11 ghép #2.
4. **Trong hộp duyệt.** Một câu về đề xuất đi kèm và trạng thái sống của nó, cộng câu chặn hiểu nhầm, mục 11 ghép #3.

**Chỗ vỡ, nói thẳng, không giấu.** Đề xuất tạm ứng bị trả lại thì **không có đường dựng lại từ thương vụ**: `tvTrinh` ném "Thương vụ đã trình đề xuất" (4711). Ngăn trượt của thương vụ ấy hiện đúng hai câu và một nút:

> Đề xuất tạm ứng DX-2609-005 bị trả lại. Thương vụ đã trình nên không trình lại được. Dựng lại bằng hộp Đề xuất tạm ứng, với đối tác đã điền sẵn và khoản tạm ứng lấy từ điều khoản CRM.
> Đề xuất dựng theo đường này **không gắn vào thương vụ**, nên gói trả về CRM sẽ không báo nó. Bên CRM đọc mãi câu "tạm ứng bị trả lại, chờ dựng lại đề xuất".
> [Nút: Đề xuất tạm ứng] → `HT.deXuatTamUng(c, tv.khoa)`

Câu thứ hai đo được: `tvGoiTra` (4567) đọc `tv.deXuat`, mảng chỉ gán một lần trong `tvTrinh`. Trang in câu ấy ra thay vì bày một nút rồi để người dùng tự phát hiện.

Một câu nữa trên chip khi hợp đồng đã duyệt mà tạm ứng bị trả: `"Phí dịch vụ Haustek đang có hiệu lực là phí đàm phán kèm khoản tạm ứng này."`

---

## 9 · Kế toán chỉ đọc thì trang khác thế nào

Kế toán có nhóm `deXuat` nên `A.thuongVu.list()`, `dem()`, `soatTrinh()`, `goiDaPhat()`, `lienQuan()` gọi được. Kế toán **không** có `deXuatTao` nên bốn hàm ghi bị lõi chặn. **Không sửa `QUYEN_HAM` một dòng nào.**

Khác đúng năm chỗ:

1. Tiêu đề trang **không vẽ** hai nút "Nhận gói từ CRM" và "Phát gói trả về CRM". Gác bằng đúng biểu thức `xet-duyet.js:79` đang dùng: `A.quyen.nhom('deXuatTao')`.
2. Cột Thao tác trên **mọi** dòng là `<span class="nil">—</span>`, trừ nút "Mở đề xuất" ở tab Đã trình. Không vẽ nút mờ rồi chặn khi bấm, không hiện câu xin lỗi về quyền.
3. Menu `⋯` không vẽ.
4. Huy hiệu điều hướng **rỗng**, mục 2.
5. Viên lọc "Của tôi" không vẽ (chỉ vai `sales`).

Ô số, tab, cột, ngăn trượt, khối chênh lệch: **y hệt vai kinh doanh**. Không cắt bớt.

**Việc thật của kế toán ở trang này là tra ngược.** Cầm một mã `DX-2609-004` đang nằm trên bàn, gõ vào ô tìm, ra đúng dòng thương vụ, mở ngăn, đọc điều khoản nguyên văn CRM khai, biết ai gắn đối tác và gói nào đã sửa điều khoản sau khi trình. Hai chi tiết làm được việc ấy — ô tìm nhận mã đề xuất, ngăn giữ nguyên văn `terms` — là toàn bộ phần dành riêng cho kế toán trên trang này.

**Việc kế toán sắp bấm thì nằm ở trang Xét duyệt**, và đó là nơi phải đặt tín hiệu, không phải ở đây. Xem ghép #1 và #4 ở mục 11.

Ban giám đốc mở trang này thấy đủ nút như kinh doanh, vì `NHOM_GIAM_DOC_BO` không bỏ `deXuatTao`. Trang không giả vờ chặn bằng cách ẩn nút; chuyện ấy xử lý ở mục 12, chỗ dễ sai thứ ba.

---

## 10 · Trạng thái rỗng

Bốn ô trống, mỗi ô nói đúng vì sao trống, đúng khuôn `trongTab()` (`xet-duyet.js:109-115`). Thứ tự kiểm: bộ lọc trước, tab sau.

**1 · Bộ lọc hoặc ô tìm không khớp** (`LOC.vien !== 'all' || LOC.tim || LOC.chi`)
- Ký hiệu `tim` · "Không có thương vụ nào khớp bộ lọc"
- "Bỏ viên lọc đang chọn hoặc xoá ô tìm."

**2 · Tab Chờ xử lý rỗng** — đây là trạng thái ngày đầu chạy, khi Portal có 0 thương vụ
- Ký hiệu `down2` · "Chưa nhận gói nào từ CRM"
- Với nhóm `deXuatTao`: "CRM xuất gói JSON của các thương vụ đã đàm phán xong. Dán gói vào bằng nút Nhận gói từ CRM ở đầu trang." · Nút **"Nhận gói từ CRM"**
- Với kế toán: "CRM xuất gói JSON cho kinh doanh nhận. Thương vụ nhận rồi sẽ hiện ở đây." · không nút

**3 · Tab Đã trình rỗng**
- Ký hiệu `check` · "Chưa có thương vụ nào đã trình"
- "Thương vụ gắn đối tác rồi trình thì Portal dựng đề xuất hợp đồng, kèm đề xuất tạm ứng nếu thương vụ có tạm ứng, và thương vụ chuyển sang tab này."
- Nút "Xem tab Chờ xử lý ({n})" khi `dem.moi > 0`

**4 · Tab Đã bỏ rỗng**
- Ký hiệu `file` · "Chưa bỏ thương vụ nào"
- "Thương vụ bỏ ở Portal nằm ở đây kèm lý do. Bỏ rồi thì không trình lại được."
- Nút "Xem tab Chờ xử lý ({n})" khi `dem.moi > 0`

Ô trống nào cũng có một đường đi tiếp, trừ ô trống của kế toán ở tab Chờ xử lý, và ô ấy nói rõ ai là người đi tiếp.

---

## 11 · Ba chỗ ghép bắt buộc vào Xét duyệt, một chỗ vào Đối tác

Đây là phần phương án thắng đúng. Thiếu bốn ghép này thì trang riêng để mọi cảnh báo ở ngoài cánh cửa tiền.

**Ghép #1 · Dòng đề xuất sinh từ thương vụ mang hai huy hiệu** (`dongDx`, `xet-duyet.js:116-127`).

Gọi `A.thuongVu.lienQuan(p.id)`, `null` thì không đổi gì. Khác `null` thì cột Trạng thái thêm:
- khi `tv.lech.length`: huy hiệu đỏ **"CRM đã đổi điều khoản sau khi trình"**
- khi `tv.khoaTinh === 'khac'`: huy hiệu vàng **"Khác đối tác CRM đề nghị"**

Không thêm dòng phụ "Từ CRM DEAL-8821": `tvTrinh` đã nhét `"Từ CRM " + dealId + " · " + tên` vào `terms.note` (4854) và `dongDx` đã in `HM.dai(note, 48)` ở đúng dòng phụ ấy (dòng 119). Nói lại lần nữa là phí một dòng phụ hẹp.

**Ghép #2 · Hai đề xuất anh em nhận ra nhau.** Cùng lời gọi `lienQuan`, dòng phụ cột Nội dung thêm: `"Tạm ứng đi kèm DX-2609-005: chờ kiểm số"` trên dòng hợp đồng, `"Hợp đồng đi kèm DX-2609-004: đã duyệt"` trên dòng tạm ứng. Trạng thái lấy từ `tv.deXuat[i].trangThai`, vốn đã là trạng thái sống.

**Ghép #3 · Chênh lệch vào THÂN hộp xác nhận Duyệt** (`thaoTac`, nhánh `act === 'approve'`, dòng 150-156).

Đường bấm thật của giám đốc là điều hướng → dòng → Duyệt → hộp → Duyệt. Đường ấy **không đi qua ngăn hồ sơ**. Huy hiệu ở ghép #1 nằm trên dòng, không nằm trong hộp. `applyApproved` cộng thẳng vào `state.advances` và ghi đè `state.contracts[partyKey]` ngay khi hộp đóng, không có đường đảo.

Nên trước `HTM.theDeXuat(p, …)` trong `than`, chèn khi `lienQuan(p.id)` trả về thương vụ có `lech`:

> **Chênh lệch điều khoản với CRM**
> CRM gửi lại điều khoản lúc 14/09/2026, sau khi thương vụ đã trình. Portal giữ bản đã trình.
>
> | Điều khoản đã trình | CRM gửi sau |
> |---|---|
> | phần bên cấp quyền nhận 70% | 80% |
> | thời hạn hợp đồng 60 tháng | 36 tháng |
>
> Duyệt là duyệt bản bên trái.

Bảng dựng từ `lech[cuối].khac` (L5). Chỉ liệt kê khoá khác nhau.

Thêm, cùng chỗ, khi `khoaTinh === 'khac'`: `"CRM đề nghị {tên bên CRM khai}; đề xuất này dựng trên sổ của {tên bên đã gắn}."`

Và thêm, cùng chỗ, khi `p.by === me.name`: `"Đề xuất này do bạn trình."` Câu ấy không chặn ai — thẩm quyền là chuyện của giám đốc — nhưng nó đặt việc tự trình tự duyệt ra trước mắt người bấm, và `reviewProposal` đã ghi cờ `boQuaKiem` khi duyệt thẳng từ `submitted` (4312-4317).

**Ghép #4 · Ngăn hồ sơ đề xuất có khối "Thương vụ CRM"** (`moDx`, dòng 170-180).

Chèn ngay dưới `HTM.theDeXuat(p, …)`, trên hàng nút. Ba khối, chỉ vẽ khi `lienQuan(p.id)` khác `null`:

- **"Điều khoản CRM gửi"** — `HM.kv` từng trường của `tv.terms`, **nguyên văn, không quy đổi**, nhãn lấy từ `TV_TEN_DK`. Đây là chỗ duy nhất kế toán so được số Portal dựng với số CRM gửi trên cùng một màn hình trước khi bấm "Đã kiểm số": đề xuất hợp đồng chỉ mang `{months, feePct, exclusive, note}` (4287), đã mất dấu `artistSharePct` gốc hoàn toàn.
- **"Chênh lệch điều khoản"** khi có — mỗi lần một khối, mới nhất trên cùng, ghi thời điểm, người dán gói, và bảng hai cột chỉ liệt kê khoá khác nhau. Dấu `?` cạnh tiêu đề mục:
  > Portal giữ điều khoản đã trình và không sửa theo gói tới sau. Muốn chạy điều khoản mới thì từ chối đề xuất này rồi mở một deal mới bên CRM với mã deal khác. Chỗ này giữ tối đa 20 lần gần nhất.

  Câu ấy đúng với lõi: `TV_LECH_TRAN = 20` (4394); `tvNhanGoi` so với bản ghi **liền trước** rồi mới chặn ghi trùng (4657-4665), nên dãy 70 → 80 → 70 → 80 ghi bốn dòng. Không được viết "CRM gửi lại bao nhiêu lần cũng chỉ thêm một dòng".
- **Liên kết ngược**: `"Từ thương vụ TV-2609-004 · deal CRM DEAL-8821"` kèm nút "Mở trang Thương vụ" (`c.di('thuong-vu')`) — chỉ vẽ cho vai có trang `thuong-vu`, tức không vẽ cho vận hành và hỗ trợ.

**Ghép #5 · Chuỗi `hoiKiemMo` phải nói đúng việc kế toán vừa làm.** Chuỗi hiện tại (dòng 38): *"Bạn đã đối chiếu thu nhập 12 kỳ với bảng kê và sổ tạm ứng."* Với đề xuất sinh từ thương vụ CRM, và nhất là với bên ký mới chưa từng chạy qua Haustek, Portal **không có 12 kỳ nào để đối chiếu**. Thêm chuỗi `hoiKiemMoCrm`:

> Bạn đã đối chiếu điều khoản CRM khai với điều khoản Portal dựng. Số của đề xuất này đến từ ước tính của CRM, không từ 12 kỳ doanh thu thật.

Chọn chuỗi theo `lienQuan(p.id)`.

**Ghép #6 · `v2/man/doi-tac.js`, ngăn hồ sơ đối tác.** Chèn **ngay sau khối `HM.kv` và trước khối Ví** (điểm chèn có thật, dòng 294-325). Mục "Thương vụ từ CRM", chỉ vẽ khi `list()` có thương vụ nào `khoa === pk`, kèm dấu `?`:

> Thương vụ do CRM gửi sang. Gắn đối tác rồi trình thì Portal dựng đề xuất hợp đồng, kèm đề xuất tạm ứng nếu thương vụ có tạm ứng.

Ba nhóm dòng: chưa gắn nhưng CRM đề nghị gắn vào bên này; đã gắn chưa trình; đã trình, hiện hai mã đề xuất với trạng thái sống và **nguyên văn chuỗi `chiTiet` Portal đang gửi về CRM** (từ `goiDaPhat()`, không phải dựng lại). Người Haustek đọc đúng câu mà A&R bên CRM đang đọc, không phải đoán.

Nút trong mục dùng đúng khuôn quyền `btnrow` sẵn có ở dòng 356-358: `A.quyen.nhom('deXuatTao')`.

Cột Tình trạng ở **danh sách** đối tác thêm huy hiệu "Thương vụ chờ xử lý" khi bên ấy có thương vụ `moi`.

---

## 12 · Ba chỗ dễ làm sai nhất, và cách trang chặn từng chỗ

### Chỗ một · Gắn nhầm đối tác

Đây là chỗ một cái tên văn xuôi của CRM biến thành một danh tính có sổ tiền. Gắn sai thì phí dịch vụ Haustek và toàn bộ khoản tạm ứng vào sổ của công ty khác. `applyApproved` **cộng dồn vào `state.advances[partyKey]` và ghi đè `state.contracts[partyKey]`, không có đường đảo**. Sau khi trình thì `tvGanBen` ném ngay (4695). Gói CRM khai tên bên bằng chữ tự do; Portal có 428 đối tác, nhiều bên trùng tên, label mẹ và label con.

Năm lớp, không lớp nào là một dòng cảnh báo trôi giữa trang:

1. **Hộp gắn không nhận chữ tự do.** Phải bấm chọn một dòng trong danh sách. Bên CRM đề nghị nằm đầu, mang nhãn "CRM đề nghị", **không được chọn sẵn**.
2. **Mỗi dòng gợi ý đủ dữ kiện phân biệt hai bên trùng tên**: tên, mã HTK, loại, người phụ trách, và tình trạng hợp đồng. Ngày hết hạn **không hiện khi `hanSuyRa`**, vì đó là ngày do hàm băm sinh.
3. **Câu hậu quả nằm ngay trên nút đóng, viết bằng tiền chứ không bằng thao tác**, và gọi tên bên cùng mã HTK ra bằng chữ.
4. **Huy hiệu ba trạng thái, kêu đúng một chỗ.** Chỉ `khac` mới có huy hiệu vàng. `crmKhongDeNghi` im lặng, `khop` chỉ có chữ mờ "gắn theo CRM đề nghị" để người soát biết đây là xác nhận chứ không phải tra cứu. Một huy hiệu kêu ở chỗ không có gì xảy ra là một huy hiệu người ta học cách bỏ qua.
5. **Huy hiệu ấy đi theo tới tận cửa cuối.** Ghép #1 đưa nó lên dòng đề xuất, ghép #3 đưa nó vào thân hộp Duyệt. Hộp trình ở mục 6.2 in lại tên và mã đối tác ở dòng đầu, là lần cuối còn sửa được.

Lớp không có: sau khi trình thì không gỡ ra được. Ngăn trượt ghi thẳng câu ấy thay vì để người dùng đi tìm.

### Chỗ hai · Duyệt một đề xuất mà CRM đã đổi điều khoản sau khi trình

Lõi cố ý đóng băng: `tvNhanGoi` (4655) không sửa thương vụ đã trình, chỉ ghi một dòng chênh lệch. Nhưng đề xuất đang nằm trong danh sách chờ vẫn mang `feePct` cũ, và nếu chênh lệch chỉ nằm ở trang Thương vụ thì giám đốc duyệt số cũ trong khi CRM tin là đã gửi số mới — **đúng thứ cầu nối này sinh ra để dẹp, chỉ dời sang một trang khác**.

Bốn chỗ, chỗ thứ tư là chỗ quyết định:

1. Ngay lúc dán gói: một số bấm được trong khối kết quả, lọc thẳng ra các thương vụ ấy.
2. Ô số thứ ba ở đầu trang Thương vụ, màu cảnh báo, bấm được.
3. Huy hiệu đỏ trên dòng đề xuất ở trang Xét duyệt (ghép #1) và trong ngăn hồ sơ đề xuất (ghép #4).
4. **Bảng hai cột trong thân hộp xác nhận Duyệt** (ghép #3), đặt trên nút. Đây là chỗ duy nhất chắc chắn nằm trên đường bấm của giám đốc.

Trang **cố ý không có nút "Nhận điều khoản mới"**. Đóng băng là quyết định của lõi, và một nút như thế sẽ sửa số đang nằm trên bàn giám đốc.

### Chỗ ba · Bấm một cú để nhận một lời từ chối, hoặc duyệt một con số khác con số vào sổ

Sáu cửa của `tvTrinh` chặn thật và chặn thường xuyên. `GUI-PORTAL-VONG-34.md` mục 4 đo trên chính lõi này: `flowThroughPct 30` và `labelArtistRatePct 70` đều bị chặn, và cả hai nay nằm trong gói CRM gửi. Hai cửa nữa — `A_deXuatChoCuaBen` cho hợp đồng và cho tạm ứng — người bấm **không tự gỡ được**: hai deal cùng một label trong gói 13 deal là chuyện thường, và deal thứ hai phải chờ giám đốc quyết deal thứ nhất.

Ba lớp:

1. **Cột Cửa trình nói trước cú bấm**, nguyên văn câu từ chối của lõi, đưa qua `A.i18n.loi`. Nút "Trình đề xuất" để mờ. Không ai bấm một cú để nhận một lời từ chối.
2. **Câu ấy đến từ `soatTrinh()`, không do trang chép lại.** Trang không được chép bảy hàng rào rồi trôi khỏi lõi. Lõi ghi rõ mục đích của cách viết ấy: "trường tiền mới thêm sau này tự bị chặn thay vì tự bị nuốt."
3. **Hộp trình ghi ba con số lõi sẽ dùng**, không ghi số CRM khai: phí 30,0%, tạm ứng 16.100 USD, tổng phải thu hồi 18.032 USD. Ghi 14.000 là nói thiếu 2.100 USD ở đúng câu duy nhất nói về tiền.

---

## 13 · Việc cố ý không làm vòng này

**1 · Không đọc thẳng khoá `haustek.crm.handoff.v1`.** Gói vào bằng cách dán. Hai lý do: `test/ranh-gioi-trang.js` cấm trang tự đọc localStorage ngoài ba trang có ghi chú người dùng, và bản mẫu chưa có máy chủ. Khi đổi sang HTTP, chỗ sửa là **một hàm lõi**, không phải trang: `thuongVu.kenhDoc()` trả `{co, text}`, và hộp dán chỉ đổi từ "dán vào ô" sang "đọc từ kênh". Chân hộp đã nói rõ kênh nào đang dùng, nên không ai nhầm một lượt dán thành công với một lượt đồng bộ.

**2 · Không có nút nhận điều khoản mới khi có chênh lệch.** Mục 12, chỗ hai.

**3 · Không mở lại thương vụ đã bỏ, và không mở lại thương vụ mà đề xuất hợp đồng bị từ chối.** Cả hai đang kẹt vĩnh viễn ở trạng thái hiện tại: `tvGanBen`, `tvTrinh`, `tvBo` đều ném. Mở lại là một luật tiền, phải viết ở lõi với điều kiện và dấu vết riêng, không bịa từ trang. Vòng này trang chỉ **nói ra** chỗ kẹt: tab Đã bỏ ghi lý do; tab Đã trình, khi hợp đồng ở `rejected` hoặc `withdrawn`, hiện một dòng `"Đề xuất hợp đồng đã đóng. Thương vụ không trình lại được; mở lại cần một mã deal mới bên CRM."` Một deal chết mà nằm im không ai đếm thì tệ hơn một deal chết có tên.

**4 · Không dựng lại đề xuất tạm ứng bị trả lại từ thương vụ.** Mục 8. Nút mở hộp đã có sẵn; đề xuất mới không vào `tv.deXuat` nên `goiTra` không báo nó về CRM, và trang in câu ấy ra chứ không giấu.

**5 · Không có thao tác hàng loạt.** Gắn đối tác là quyết định có danh tính, trình là cú bấm không quay lại được; gộp mười ba quyết định ấy vào một cú bấm là bỏ đúng thứ hai lớp chặn đầu tiên dựng ra để giữ. Chi phí bấm đo được và nói thẳng ở đây: **2 cú cho cả gói, cộng 4 cú cho mỗi deal** (chọn bên, xác nhận gắn, mở hộp trình, xác nhận trình) — khoảng 54 cú cho 13 deal. Việc rẻ nhất giảm được ở vòng sau, và là ứng viên đầu tiên: **một nút "Xác nhận gắn theo CRM đề nghị" cho các thương vụ có `khoaCrm` tra ra đối tác có thật**, với điều kiện mỗi lần gắn vẫn ghi một dòng nhật ký riêng có danh tính, và nút ấy **không** kéo theo việc trình.

**6 · Không tính ROI, hạng rủi ro hay khuyến nghị trên trang này.** Bản tính chỉ dựng lúc tạo đề xuất; trang Xét duyệt đã có đủ. Ba cột rỗng là ba cột nói dối.

**7 · Không lọc thương vụ theo người phụ trách ở lõi.** `partiesListChoVai` và `proposalsListChoVai` có lọc; `tvList` thì không, và giữ nguyên như vậy. Deal từ CRM tới **trước khi ai nhận nó trong Portal**, nên ẩn theo chủ là giấu đúng phần việc chưa ai nhận. Viên lọc "Của tôi" ở trang trả lại quyền chọn cho người dùng mà không giấu gì của ai.

**8 · Không dựng băng chặng, không dựng dòng đời sáu bước.** Chặng 1 và chặng 6 nằm ngoài tầm nhìn của Portal, và dòng đời dựng từ nhật ký thao tác thì **kinh doanh không có quyền đọc** (`QUYEN_HAM.audit = "doiSoat"`). Ba tab bằng ba trạng thái là thứ nói đúng những gì Portal thật sự biết.

---

## 14 · Chữ, bài kiểm, và mấy điểm văn phong phải giữ

**Chữ hai thứ tiếng** khai đủ trong khối `chu: {vi, en}` của `HT.dangKy`. Không chuỗi nào gõ thẳng vào HTML. Câu lỗi của lõi đi qua `A.i18n.loi(msg, lang)` **trước khi vẽ**, vì chúng nằm thường trực trong ô bảng chứ không chỉ thoáng qua một dòng thông báo như `xet-duyet.js` đang làm. `LOI_MAU_EN` (5910) đã có mẫu cho các câu chặn của `tvTrinh`.

**Từ đã chốt, dùng đúng:**

| Trong mã | Trên trang |
|---|---|
| `lech` | **chênh lệch** |
| fee | **phí dịch vụ Haustek**, không phải "phí Haustek" |
| `nuoc` | **thị trường**, không phải "nước" |
| queue | **danh sách chờ**, không phải "hàng chờ" |
| approve | **xét duyệt**; nhãn trạng thái **đã duyệt** giữ như `HTM.tagDx` đang dùng |

Nhãn cột và nhãn ô số là **danh từ hoặc cụm danh từ đầy đủ**: "Thương vụ chờ xử lý", "Cửa trình", "Điều khoản CRM khai", "Lần phát gói trả về gần nhất". Không "Chờ", không "Đã trình 3".

Nút là **động từ cộng tân ngữ**: "Nhận gói từ CRM", "Gắn đối tác", "Trình đề xuất", "Bỏ thương vụ", "Phát gói trả về CRM", "Mở đề xuất". Không "Nhận", không "Trình".

Không gạch ngang dài giữa câu. Nối bằng " · " hoặc hai chấm. Mọi chú thích nằm trong dấu `?` cạnh tiêu đề trang, tiêu đề mục hoặc đầu cột; không rải chữ ra trang.

**Bài kiểm phải xanh sau vòng này:**

- `test/qc-quyen.js` — sau L1. Trước L1 nó đỏ ở phép "Mọi trang khối được giao đều nằm trong danh sách trang của lõi".
- `test/ranh-gioi-trang.js` — trang không đọc localStorage, không chạm `HAUSTEK.admin`.
- `test/thuong-vu.js` — thêm phép cho `soatTrinh` (kết quả trùng khớp câu `tvTrinh` ném), `xemGoi` (không ghi gì vào state), `goiDaPhat` (phát hiện được khoá chưa ghi).
- `test/i18n-hai-chieu.js`, `test/i18n-loi.js`, `test/chuoi-thieu.js` — không chuỗi tiếng Việt nào lọt khi bật EN.
- `test/v2-hep.js` (390 px), `test/v2-tuong-phan.js`, `test/v2-quet.js`, `test/v2-bam.js` — trang mới vào bộ quét. Tiêu đề trang có đúng **hai** nút, nên `page-act` không vỡ ở khung hẹp.
- `test/goi-du-trang.js` — bản gói có trang mới, tự động, vì `dung-goi.js` đọc danh sách trang từ thẻ `<script>` trong `intranet.html`.