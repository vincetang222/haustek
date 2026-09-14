# Kiến trúc Haustek Portal

Tài liệu này là chỗ đọc trước khi sửa lõi. Nó ghi *hình dạng* của hệ thống
— lược đồ dữ liệu, ranh giới giữa các tầng, hệ mã định danh, cách nâng lược
đồ, mô hình người dùng và chuỗi tiền — cùng những quyết định đã chốt với chủ
dự án ở vòng 22, để về sau không nhầm lẫn lại. Mỗi mục có bài kiểm tương ứng
trong `test/`; mục nào chưa có bài kiểm thì ghi rõ.

## 1. Ba tầng, hai cổng

```
haustek-core.js            LÕI: state + luật + hai mặt tiền (admin, api)
   ├─ HAUSTEK.admin        nội bộ, đã bọc quyền theo vai (boQuyen)
   ├─ HAUSTEK.api          đối tác: gói đã tính, đã cắt, đã giấu tên nhân sự
   ├─ HAUSTEK.storage      xuất / nhập JSON, thông tin lược đồ
   └─ HAUSTEK.i18n         dịch chuỗi lõi sinh lúc hiện (lỗi, nhật ký)
v2/haustek-shell.js        KHUNG: điều hướng, ngôn ngữ, chế độ, hộp thoại, bảng, toast
v2/haustek-man.js + *.js   khuôn và mảnh giao diện dùng chung
v2/man/*.js                TRANG: mỗi trang một file, chỉ vẽ
   ├─ 28 trang nội bộ       nhận lõi qua c.A
   └─ 18 trang k-*.js       nhận lõi qua c.api (sau lockdown)
```

Quy tắc ranh giới (bài kiểm `test/ranh-gioi-trang.js`):

- Trang không đọc state thô (`A.state(` đã bỏ khỏi mặt tiền). Muốn số nào
  thì lõi mở một hàm đọc có tên (`rates.raw()`, `ingest.trangThai()`,
  `advances.theoKy()`, `storage.thongTin()`…).
- Trang nội bộ chỉ chạm lõi qua `c.A`; trang đối tác chỉ qua `c.api` và
  không được nhắc tới "admin" dù trong chuỗi.
- Chỉ năm file được tự lưu `localStorage`, và chỉ với khoá `haustek.*`
  riêng: `roi.js` (tham số ROI), `theo-doi.js` (yêu thích),
  `haustek-hoso.js` (nháp hồ sơ), `haustek-man.js` (ghi chú đã tắt),
  `haustek-shell.js` (mật độ bảng, ngôn ngữ, chế độ). Mọi quyết định
  nghiệp vụ đi qua lõi và nằm trong `state`.
- `khach.html` gọi `HAUSTEK.lockdown()` ở dòng đầu: `admin` biến mất,
  `H` bị đóng băng. `i18n` và `storage.available` sống sót vì không mang
  dữ liệu.

## 2. Lược đồ state và di trú

`state` là một object JSON, lưu ở `localStorage` khoá `haustek.portal.v1`.
Mọi khoá của nó khai trong `LUOC_DO` (54 mục), mỗi mục có `kieu`
(`mang` · `bang` · `gia`), `nhom` (`nghiep-vu` · `van-hanh` · `he-thong`)
và một dòng mô tả. `ensureShape()` đọc từ bảng ấy; bài kiểm
`test/luoc-do.js` bắt khoá thêm mà quên khai, và khoá khai mà state không
có.

Hai phiên bản tách nhau:

| | Hằng | Đổi khi | Hậu quả |
|---|---|---|---|
| Ứng dụng | `CFG.VERSION` (1.4.0) | mỗi vòng | chỉ để hiển thị và ghi vào `state.v` |
| Lược đồ | `CFG.LUOC_DO_VER` (3) | hình dạng state đổi | `DI_TRU` nâng state cũ từng bước |

`DI_TRU` là mảng các bước `{den, mo, chay(s)}` chạy theo thứ tự `den` lớn
dần cho tới `CFG.LUOC_DO_VER`. Mỗi bước phải idempotent và chỉ đụng hình
dạng — không đọc hằng sinh lúc nạp (STAFF, PERIODS) vì chạy trước khi
những thứ đó tồn tại. Lịch sử:

- **2** — bỏ `deliveries / bulk / priceExtra / bkSentric` (mã chết từ vòng
  14); ticket `messages[]` → `body + comments[] + done`; `accounts[].ben[]`;
  `chiTraDao`; đọc lại bộ đếm mã (`khoiTaoMaDem`).
- **3** — bỏ dòng tỷ lệ của nghệ sĩ độc lập (`rates` có `partyKey` "A:");
  tài khoản cũ có `ben[]` và vai `nhan`.

`store.load` không bỏ state vì lệch phiên bản ứng dụng nữa; `importJSON`
từ chối file thuộc lược đồ mới hơn. Trang Quản trị → Dữ liệu hiện phiên
bản lược đồ đang chạy và kích thước từng khoá.

## 3. Mã định danh

Mọi mã đi qua `sinhMa(loai, nhom, daCo)`; bộ đếm nằm ở `state.maDem`
(khoá theo loại, và theo tháng với mã có tháng), được ghi cùng state nên
tải lại trang không về 0. `khoiTaoMaDem()` đọc lại bộ đếm từ dữ liệu khi di
trú; `daCo()` là dây an toàn cuối. Bài kiểm `test/ma-dinh-danh.js`.

| Loại | Dạng | Ví dụ |
|---|---|---|
| Hồ sơ phát hành | `HSTK-YYMM-nnn` | HSTK-2609-004 |
| Việc hỗ trợ | `HT-YYMM-nnn` | HT-2609-012 |
| Rút tiền | `RT-YYMM-nnn` | RT-2609-003 |
| Đề xuất | `DX-YYMM-nnn` | DX-2609-010 |
| Bút toán | `BT-YYYYMM-nnn` | BT-202607-001 |
| Tài khoản đăng nhập | `Unnnn` | U0019 |
| Khiếu nại | `CL-nnnn` | CL-0044 |
| Hàng chờ khớp | `Qnnnnn` | Q00053 |
| Số gõ tay | `N-nnnn` | N-0001 |
| Nhân sự | `Snn` | S05 |

Mã đối tác (client ID) là mã *bên thụ hưởng*, không phải mã đăng nhập:
`HTK-L###` label, `HTK-A####` nghệ sĩ, `HTK-N####` người nhận chia sẻ.
Kiểm thử hồ sơ (preview) không ăn bộ đếm.

## 4. Ba lớp: người dùng ↔ bên thụ hưởng ↔ vai trên bài

Quyết định "tách ba lớp" ở vòng 22 (bài kiểm `test/tien-ba-lop.js`):

```
NGƯỜI DÙNG (đăng nhập)        state.accounts[]   Uxxxx · email · vai · ben[]
      │ giữ 1..n
BÊN THỤ HƯỞNG (mang mã HTK)   L:n  label        ví, ngân hàng, hợp đồng, tỷ lệ
                              A:n  nghệ sĩ      ví, ngân hàng, hợp đồng
                              N:Uxxxx người nhận ví, ngân hàng — chỉ để nhận chia sẻ
      │ đứng trên bài với
VAI TRÊN BÀI                  chủ (label hoặc nghệ sĩ) · cộng tác viên · tác giả
```

- Một đăng nhập giữ nhiều bên (`accounts.themBen / boBen`); `partyKey` là
  bên chính, cổng đối tác hiện đúng một bên mỗi phiên.
- Vai đăng nhập: `admin · label · artist · nhan`. Vai `nhan` chỉ có ví.
- Chia sẻ tác quyền (`state.splits[i][]`) mang `goc` (label hay nghệ sĩ đặt;
  cắt vào đúng phần của người đặt), và khi người cộng tác NHẬN lời mời thì
  gắn `taiKhoanId` + `nhan` (bên nhận). Chỉ mục đã nhận và có bên nhận mới
  làm tiền đổi chủ. Người cộng tác chưa có tài khoản thì
  `taiKhoanChoChiaSe()` cấp một tài khoản `nhan` (đang mời) — trả lời câu
  hỏi "mỗi người có phải tạo client ID": có, và hệ thống tự cấp.
- Cổng đối tác: `api.loiMoiChiaSe` (lời mời gửi tới email đăng nhập) và
  `api.acceptSplit` (tự nhận; tiền vào ví của bên đang đăng nhập).
- Chưa làm: cổng đối tác cho tài khoản chỉ có vai `nhan` (ví HTK-N). Nội
  bộ trước, cổng đối tác sau.

## 5. Chuỗi tiền

```
gộp thật (báo cáo nền tảng)
  → bảng giá nền tảng (khach USD/1.000 lượt)      = gộp GHI NHẬN; chênh lệch vào 5118
  → phí Haustek theo hợp đồng (contracts[bên].feePct)
  → phần sau phí:
       label:       labelCut + artist theo rates (tỷ lệ nghệ sĩ trong label)
       độc lập:     toàn bộ phần sau phí về nghệ sĩ (rateFor("A:") = 1)   ← D1
                    (Haustek VẪN thu phí hợp đồng như mọi đối tác; chỉ là
                     không có label đứng giữa nên không có lớp cắt thứ hai)
  → earnedByParty(kỳ):
       label tự trả (contracts[L:].labelTuTra): label nhận labelCut + artist ← D2
       mặc định: Haustek trả thẳng phần nghệ sĩ
  → runPayout(kỳ): chia sẻ hiệu lực trừ chủ / cộng bên nhận (ngưỡng thu hồi
    tính dồn các kỳ đã duyệt), rồi thu hồi tạm ứng, ngưỡng chi trả, dồn kỳ ← D3
  → approve: state.payouts[kỳ] (bảng chốt)
  → creditsOf / walletOf → withdrawalQuote (thuế TNCN cho cá nhân A:/N:,
    tỷ giá của kỳ duyệt gần nhất, phí chuyển tiền) → requestWithdrawal
```

Huỷ chốt có bù trừ (D4): `revoke()` cất bảng cũ vào `state.chiTraDao[kỳ]`
(lần, lúc, ai, lý do, các dòng) rồi mới mở kỳ; sổ cái của mỗi bên
(`walletOf().soCai`) hiện dòng + của lần duyệt, dòng − của lần huỷ, rồi
dòng duyệt lại. Tổng ví chỉ tính bảng sống; đối tác đã rút theo lần duyệt cũ
thì ví có thể âm và rút tiền bị chặn tới khi kỳ sau bù đủ.

Bất biến giữ bằng `test/qc-bat-bien.js`, `test/tien-ba-lop.js`,
`test/api-guard.js`: gộp thật = ghi nhận + chênh lệch; ghi nhận = phí +
label + nghệ sĩ; bảng chi trả cân từng dòng và tổng không đổi sau chia sẻ;
số ở cổng đối tác khớp số nội bộ tới từng xu; ví = tổng tín dụng − đã rút.

## 6. Quyền

Hai trục: **vai** (từ khối trong cây tổ chức) và **cấp** (từ chức danh,
1 = giám đốc … 6 = thực tập sinh).

- `QUYEN_MAN` (trang) và `QUYEN_NHOM` (nhóm hàm) dựng từ `TO_CHUC`; hàm của
  mặt tiền admin trỏ vào nhóm qua `QUYEN_HAM`; hàm cố ý để mở liệt kê ở
  `QUYEN_MO`. `boQuyen()` bọc toàn bộ mặt tiền: gọi hàm ngoài nhóm là ném
  `NO_QUYEN`.
- `MAN_CAP` chặn thêm theo cấp (Mức trả chỉ cấp 1; Tổ chức, Hiệu suất,
  Hiệu quả vốn từ cấp 2).
- **AAA**: vai `bod` (hội đồng quản trị, khối `hoi-dong`, cờ `aaa`) là
  đường tắt DUY NHẤT: `laAAA()` cho qua ở `coQuyenNhom` và `manCoQuyen`,
  kể cả `MAN_CAP`. Vai này không có trong `VAI_NB` và không có trong bảng
  nào. Giám đốc (`mgmt`) qua cửa như mọi vai: thấy mọi trang trừ Nhập số
  liệu; không cầm `nhapLieu`, `kiemSo`, `tyGia`, `phatHanhHo` (bốn mắt:
  người chốt kỳ không gõ số, không bỏ qua sai lệch, không gõ tỷ giá).
  "Thấy việc của mọi bộ phận, đối tác của mọi người, bản tính đầy đủ" là
  nhóm có tên `giamSat`, chỉ giám đốc có. Chỉ hội đồng đưa người vào / ra
  khối hội đồng hay khoá thành viên hội đồng; thành viên cuối không khoá
  được. Bài kiểm `test/aaa.js`, `test/qc-quyen.js`, `test/qc-vai-quet.js`.
- **Nhật ký đăng nhập** (`state.dangNhap`, vòng 24) tách khỏi `audit`: audit
  ghi người ta LÀM gì, nhật ký này ghi người ta VÀO lúc nào. Cửa ghi duy
  nhất là `ghiDangNhap()`, không nằm trên mặt tiền nào; `dangNhap.ghi` mở
  cho mọi vai (không nhận tham số danh tính, đọc thẳng `_me`), `dangNhap.list`
  thuộc nhóm `quanTri`. Phía đối tác: `moPhien` ghi, `dangNhapCuaToi` đọc,
  cả hai `BEN_MOI`. **Trường `ip` luôn null** — bản mẫu không có máy chủ nên
  không đọc được địa chỉ; bảng `nhat_ky_dang_nhap` của bản thật ở
  `HA-TANG.md` mục 7b. Bài kiểm `test/dang-nhap.js`.

## 7. Việc hỗ trợ (ticket)

`{id, type, title, body, partyKey, party, trackId, track, createdBy, source,
createdAt, updatedAt, status, priority, assignee, dueAt, dept, closedAt,
comments[], done}`. Không còn khung chat: `comments` là bình luận ngắn
(≤ 20 mục × 300 ký tự, `by` = id nhân sự hoặc mã đối tác), `done = {by, at}`
là cái tick của người được giao (hoặc quản trị); đổi người / chuyển bộ phận
thì tick mất; đối tác bình luận lại thì việc tự mở. Cổng đối tác thấy người
viết nội bộ là "Haustek", không lộ id / email nhân sự (`giauNhanSu` trong
`scrub`).

## 8. Song ngữ

- Chữ của trang: mỗi trang một bảng `chu: {vi, en}`; `c.t(k)`. Bài kiểm
  `test/chuoi-thieu.js` bắt khoá dùng mà chưa khai ở cả hai ngôn ngữ.
- Dữ liệu lõi sinh mang cặp trường (`label / labelEn`, `name / nameEn`,
  `note / noteEn`, `reason / reasonEn`, `detail / detailEn`…); trang đọc
  qua `c.song(o, 'khoa')`.
- Chuỗi lõi ném hoặc ghi: `HAUSTEK.i18n.loi()` dịch lỗi lúc hiện (toast của
  khung), `i18n.nhatKy()` dịch nhật ký. Bài kiểm `test/i18n-loi.js` đòi mọi
  `new Error` trong lõi có bản dịch; `test/i18n-hai-chieu.js` quét hai cổng
  ở cả hai chiều với ngưỡng 0.
- Dữ liệu người gõ (tiêu đề ticket thật, ghi chú) giữ nguyên ngôn ngữ họ
  viết. Dữ liệu mẫu thì có cả hai thứ tiếng.

## 9. Quy ước đặt tên

- Tiếng Việt không dấu, kiểu camelCase cho hàm và trường mới của vòng 22
  (`labelTuTra`, `chiTraDao`, `giamSat`, `loiMoiChiaSe`); trường có bản EN
  thêm hậu tố `En`.
- Tên tiếng Anh cũ (`earnedByParty`, `walletOf`, `runPayout`) giữ nguyên để
  không đổi mặt tiền; không đặt tên mới bằng tiếng Anh.
- Trang: `man/<ten>.js` nội bộ, `man/k-<ten>.js` đối tác; id trang trùng
  tên file.
- Chữ trên giao diện theo `v2/VAN-PHONG.md`: *trang* (không phải màn), *đối
  tác* (không phải khách hàng), dấu ngăn " · ".

## 10. Quyết định đã chốt (vòng 22)

| # | Quyết định | Ở đâu |
|---|---|---|
| D1 | Nghệ sĩ độc lập vẫn chia sẻ doanh thu với Haustek theo phí hợp đồng; phần sau phí về hết cho họ, không có lớp cắt thứ hai. Cổng của họ chỉ hiện số sau phí; đối soát nội bộ tách phí ra | `rates.rateFor`, `phiTheoLoaiChu`, di trú 3 |
| D2 | Nghệ sĩ thuộc label trả theo hợp đồng từng label (`labelTuTra`); mặc định Haustek trả thẳng | `earnedByParty`, `parties.datLabelTuTra` |
| D3 | Tách ba lớp; người cộng tác đã nhận được trả thật, trừ vào phần của chủ | `chiaSeHieuLuc`, `runPayout`, `acceptSplit` |
| D4 | Huỷ chốt có bù trừ, không xoá bảng đã duyệt | `revoke`, `soCaiCua`, `chiTraDao` |
| D5 | Giám đốc qua cửa; hội đồng (bod) là AAA duy nhất | `laAAA`, `NHOM_GIAM_DOC_BO` |
| D6 | Ticket là bình luận + tick, không chat | `themBinhLuan`, `tickets.tick` |
| D7 | Nội bộ hoàn thiện trước, rồi mới trỏ dữ liệu ra cổng đối tác | cổng cho vai `nhan` để sau |
| D8 | Lược đồ có phiên bản và di trú; mã định danh một chỗ | `LUOC_DO`, `DI_TRU`, `sinhMa` |

## 11. Chỗ bản mẫu không chứng minh được

> Mục này chỉ nói *vì sao* bản mẫu không chứng minh được. Hình dạng của bản
> chạy thật — lược đồ, khoá, chỉ mục, giao dịch chốt kỳ, luật quyền, di trú —
> nằm ở [`HA-TANG.md`](HA-TANG.md).

Hai cổng chạy cùng gốc trong một trình duyệt: nạp lại lõi trong iframe là có
lại `admin`; `localStorage` ai cũng đọc được. Đây là hình dạng của ranh
giới, chưa phải ranh giới đã thực thi. Khi lên máy chủ: dữ liệu thô ở
database, lọc và tổng hợp ở máy chủ, RLS quyết định ai đọc dòng nào;
`partyId` lấy từ phiên đăng nhập, không bao giờ từ tham số. Mỗi phép kiểm
trong `test/api-guard.js` dịch thành một test SQL trên policy.
