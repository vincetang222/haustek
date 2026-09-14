# Hạ tầng bản chạy thật · Haustek

Tài liệu này là thứ đội lập trình code theo khi rời bản mẫu. `KIEN-TRUC.md`
tả hình dạng hệ thống **như bản mẫu đang có**; file này tả hình dạng **khi
lên máy chủ**, và thay hẳn mục 11 của tài liệu ấy.

Từ đây trở đi, `portal/` không còn là nguồn dữ liệu. Nó là hai thứ khác, và
cả hai đều quý: **đặc tả hành vi** (màn nào nói gì, ai thấy gì) và **bộ sinh
ca kiểm thử** (mỗi phép kiểm trong `test/` dịch thành một test trên hệ thật).

## Đọc gì trước

| Bạn là | Đọc mục |
|---|---|
| Người mới vào dự án | 1, 2, 3 |
| Người code phần tiền | 1, 4, 5, 6 |
| Người code phần quyền | 3, 7, 8 |
| Người trực hệ thống | 5, 9, 10 |
| Người quyết định ngân sách | 9, 11, 12 |

Tài liệu này tả **lược đồ**. Phần **vật lý và tiền** — byte để ở đâu, máy cỡ
nào, mỗi tháng tốn bao nhiêu, làm theo thứ tự nào — ở `TRIEN-KHAI.md`.

Quy mô mục tiêu dùng xuyên suốt: **1.000.000 bài** trong danh mục · **350.000
bài có phát sinh mỗi kỳ** · **60 nền tảng**, trong đó khoảng 9 có tiền trên
một bài điển hình · **100.000 bên thụ hưởng**, 40.000 bên có tiền mỗi kỳ ·
**60 kỳ** sau năm năm. Bản mẫu đang chạy ở khoảng 1/20 quy mô ấy.

---

## 1. Mười nguyên tắc nền

Xếp theo thứ tự ưu tiên. Hai nguyên tắc va nhau thì cái số nhỏ hơn thắng.

**N1 · Tiền là số nguyên micro-USD.** Mọi khoản tiền là `bigint` đơn vị 10⁻⁶
USD; mọi tỷ lệ là điểm cơ bản nguyên (`phi_bp = 1500` là 15,00%). Không
`double`, không `numeric`. Lý do không phải là độ chính xác — `numeric` chính
xác — mà là `numeric` **không ép** người viết mã trả lời câu "phần dư đi
đâu". Bản mẫu có mười một điểm làm tròn rời rạc vì không ai bị buộc trả lời.

**N2 · Phần cuối của mỗi phép chia được định nghĩa là HIỆU.** `net = ghi_nhan
− phi`; `label_cut = net − nghe_si`. Nhờ thế "tổng các phần = tổng gốc" là
đẳng thức tuyệt đối viết được thành `CHECK` với sai số **bằng 0**, không phải
một bài kiểm chạy sau với dung sai hai xu. Chia 1 thành n phần thì dùng phần
dư lớn nhất (Hare), phần dư rơi vào bên có `ben_id` nhỏ nhất để kết quả xác
định.

**N3 · Danh tính đến từ phiên, không bao giờ từ tham số.** Không một chữ ký
hàm nào nhận `ben_id`. Bản mẫu kiểm quyền bằng `assertParty(role, partyId)`,
tức là kiểm biên chỉ số mảng: đổi hai con số là đọc được dữ liệu người khác.
Trên máy chủ, `ben` là khoá ngoại thật và RLS quyết định ai đọc dòng nào.

**N4 · Tham số định giá không sửa được sau khi kỳ đã chốt.** Hợp đồng, tỷ lệ,
bảng giá nền tảng, tỷ giá: chỉ-thêm, có khoảng hiệu lực theo kỳ, `REVOKE
UPDATE`. Nhờ thế tính lại kỳ 05/2026 hôm nay **bắt buộc** ra đúng con số đã
đông cứng. Trong bản mẫu, đổi `feePct` hay `labelTuTra` hôm nay làm mọi con
số sống của mọi kỳ lịch sử đổi theo trong khi bảng chốt đứng yên, và từ đó
hai số của cùng một kỳ lệch nhau vĩnh viễn.

**N5 · Bảng tiền đã chốt là bất biến, khoá theo lần chốt.** Mọi bảng do lô
chốt kỳ ghi đều mang `chot_id` **trong khoá chính**. Huỷ chốt không sửa và
không xoá dòng nào: nó phát một lô đảo và một `chot_id` mới.

**N6 · Ví là số DẪN XUẤT; sổ cái luôn thắng.** `so_du_ben` cập nhật trong
cùng giao dịch với dòng sổ nên luôn khớp, nhưng nó không phải sự thật. Job
đêm dựng lại số dư từ `so_cai`; lệch thì sổ cái đúng.

**N7 · Ứng dụng không bao giờ tính tiền lúc đọc.** Mọi con số đối tác nhìn
thấy đến từ một bảng đã vật chất hoá lúc chốt kỳ. **Không lấy mẫu ở bất cứ
đâu** — bản mẫu có tám chỗ lấy mẫu rồi chuẩn hoá ngược, và chính chỗ ấy đã
giấu mất toàn bộ tiền chia sẻ thật (mục 12).

**N8 · Một database, một engine truy vấn.** Hồ Parquet chỉ là kho lưu trữ bất
biến của dòng thô để truy vết khi tranh chấp. Nó không nằm trên đường phục vụ
và không nằm trên đường chốt kỳ. Hai nguồn sự thật cho tiền là thứ tài liệu
này tồn tại để loại bỏ.

**N9 · Mọi bảng dữ kiện có RLS phải mang sẵn cột bên thụ hưởng ở vị trí dẫn
đầu chỉ mục.** Policy nào phải đi qua một phép nối hay một CTE đệ quy để biết
"dòng này của ai" là án tử hiệu năng. CI đỏ nếu `EXPLAIN` của một đường nóng
chuyển sang `Seq Scan`.

**N10 · Cái gì không chứng minh được thì không viết vào đây.** Con số nào
chưa đo thì ghi rõ là ước lượng và ghi luôn cách đo. Mục 11 liệt kê những chỗ
chỉ biết được sau khi đọc file báo cáo thật.

---

## 2. Quy ước chung

| Mục | Quyết định |
|---|---|
| Hệ quản trị | PostgreSQL 16+ |
| Extension | `btree_gist` (EXCLUDE trên bigint + khoảng), `citext`, `pgcrypto`, `pg_trgm`, `pg_partman`, `pgaudit` |
| Kiểu tiền | `bigint` micro-USD (10⁻⁶). VND: `bigint` đồng nguyên |
| Kiểu tỷ lệ | `int` điểm cơ bản. `1500` = 15,00% · `10000` = 100,00% |
| Kỳ | `ky_id smallint` — 60 kỳ nay, 600 kỳ trong năm mươi năm |
| Đặt tên | snake_case tiếng Việt không dấu; trường có bản EN thêm hậu tố `_en` |
| Phân vùng | `PARTITION BY RANGE (ky_id)`, một phân vùng một kỳ. **Mọi khoá duy nhất trên bảng phân vùng phải chứa cột phân vùng** — Postgres từ chối nếu thiếu, và đó là lý do `so_cai` phân vùng theo `ky_id` chứ không theo thời điểm ghi |
| Cấm sửa | `REVOKE UPDATE, DELETE, TRUNCATE … FROM PUBLIC` (không phải `FROM ALL`; `ALL` không phải grantee) |
| Phép chia | Chỉ áp dụng trên số **không âm**. `/` trên `bigint` cắt về phía 0, nên với số âm nó là `ceil` chứ không phải `floor`. Điều chỉnh âm đi đường riêng (mục 4.6) |

`sinh_ma(loai, thang)` là **cửa duy nhất** phát mọi mã, kể cả `HTK-L###`,
`HTK-A####`, `HTK-N####`:

```sql
INSERT INTO ma_dem VALUES (p_loai, p_thang, 1)
ON CONFLICT (loai, thang) DO UPDATE SET dem = ma_dem.dem + 1
RETURNING dem;
```

Bản mẫu ghép mã đối tác ở bốn chỗ rời nhau từ **chỉ số mảng**. Nạp lại danh
sách theo thứ tự khác là toàn bộ mã phía sau trượt một bậc và tiền của người
này vào ví người kia. Từ đây mã là một cột `text` phát một lần, không bao giờ
tính lại từ vị trí. Giữ `ben.ma_cu` mười hai tháng để truy vết.

---

## 3. Ba lớp danh tính thành bảng thật

```
nguoi_dung ──< nguoi_dung_ben >── ben ──< bai_ben >── bai
 (đăng nhập)     (giữ bên nào)   (thụ hưởng)  (vai trên bài)
```

Bản mẫu ghép khoá bên bằng chuỗi: `"L:3"`, `"A:142"`, `"N:U0019"`. Vòng 23 đã
chứng minh hình dạng ấy hỏng: thêm loại bên thứ ba làm ba hàm seed tra mảng
bằng `+partyKey.slice(2)` ra `NaN`, và hệ không dựng nổi. Trên máy chủ,
`ben_id` là `bigint` và loại bên là một cột.

| Bảng | Cột chính | Khoá · chỉ mục | Dòng |
|---|---|---|---|
| `nguoi_dung` | `id` · `ma` · `email citext` · `ten` · `trang_thai` (`moi_moi`·`hoat_dong`·`tam_khoa`·`ngung`) · `mfa_bat` | PK `id` · UNIQUE `ma` · UNIQUE `email` | 120.000 |
| `ben` | `id` · `ma` · `loai` (`label`·`nghe_si`·`nguoi_nhan`) · `ten` · `ten_en` · `la_ca_nhan` · `ma_so_thue` · `quoc_gia` · `label_me_id` · `trang_thai` · `gop_vao_ben_id` · `ma_cu` | PK `id` · UNIQUE `ma` · `btree(label_me_id) WHERE NOT NULL` | 100.000 |
| `nguoi_dung_ben` | `nguoi_dung_id` · `ben_id` · `vai` (`chu`·`ke_toan`·`chi_doc`) · `la_mac_dinh` · `hieu_luc tstzrange` | PK cặp · FK cả hai `ON DELETE RESTRICT` · partial UNIQUE `(nguoi_dung_id) WHERE la_mac_dinh` | 140.000 |
| `phien` | `id uuid` · `nguoi_dung_id` · `ben_hien_id` · `dong_vai_ben_id` · `chi_doc` · `nhan_su_id` · `het_han` · `kiem_lai_luc` | PK `id` · CHECK `(ben_hien_id IS NULL) <> (nhan_su_id IS NULL)` | 500.000 |
| `uy_quyen` | `ben_uy_id` · `ben_nhan_uy_id` · `pham_vi` (`doc_danh_muc`·`doc_tat_ca`) · `hieu_luc tstzrange` · `cap_boi` | `EXCLUDE USING gist (ben_uy_id =, ben_nhan_uy_id =, hieu_luc &&)` | 2.000 |
| `ben_bao_phu` | `ben_goc_id` · `ben_phu_id` · `muc` · `pham_vi` · `het_han` | PK cặp | 120.000 |
| `bai_ben` | `bai_id` · `ben_id` · `vai` (`chu`·`nghe_si`·`tac_gia`·`cong_tac`) · `pct_bp` · `goc` · `hieu_luc int4range` | UNIQUE `(bai_id, ben_id, vai, lower(hieu_luc))` · `EXCLUDE` chống chồng khoảng cho vai `chu`/`nghe_si` · **`btree(ben_id, vai, bai_id)`** | 3.000.000 |

Bốn điều bắt buộc, mỗi điều vá một lỗi đã biết:

1. **`UNIQUE (bai_id, ben_id, vai, …)` là phép khử trùng mà bản mẫu thiếu.**
   Chỉ mục người viết đẩy cùng một bài vào hai lần khi một người đứng cả hai
   vai tác giả; mười hai nghệ sĩ bị ảnh hưởng và cổng đối tác báo thừa tới
   7,40 USD một kỳ (mục 12). Ràng buộc này làm chuyện ấy không xảy ra được.
2. **`ben_bao_phu` mang `pham_vi` và `het_han`.** Làm phẳng cây label vào một
   bảng tra là để policy chạy bằng một index-only scan thay vì CTE đệ quy.
   Nhưng nếu làm phẳng mà vứt phạm vi và thời hạn của uỷ quyền thì một uỷ
   quyền "chỉ đọc danh mục" đã hết hạn vẫn mở toàn bộ dữ liệu. Trigger dựng
   lại bảng này phải chép cả hai cột, và policy phải đọc cả hai.
3. **`dong_vai_ben_id` KHÔNG bao giờ được dùng cho hàm ghi tiền.** Label mẹ
   xem thay label con là quyền ĐỌC. Mọi hàm `SECURITY DEFINER` động tới tiền
   (yêu cầu rút, khai ngân hàng, nhận lời mời, huỷ lệnh rút) đọc
   `phien.ben_hien_id`, và ném nếu `dong_vai_ben_id IS NOT NULL`. Đóng vai
   không nối chuỗi: đã đóng vai thì không đóng tiếp vai khác.
4. **Phiên phải được kiểm lại.** `phien.kiem_lai_luc` buộc mọi giao dịch có
   tiền kiểm lại ba thứ: tài khoản còn `hoat_dong`, `nguoi_dung_ben` còn hiệu
   lực, uỷ quyền (nếu đang đóng vai) chưa hết hạn. Không có bước này thì khoá
   một tài khoản không đuổi được phiên đang mở của nó.

Chọn bên theo phiên: `SET LOCAL app.ben = <ben_id>` ở đầu mỗi giao dịch, lấy
từ `phien`, không bao giờ từ tham số HTTP. `ben_phien()` đọc biến ấy.

---

## 4. Chuỗi tiền

### 4.1 Miền tiền

| Bảng | Vai trò | Khoá | Phân vùng |
|---|---|---|---|
| `ky` | máy trạng thái của kỳ: `mo` → `dang_chot` → `da_duyet` → `dang_dao` | PK `ky_id` | — |
| `chot` | một LẦN chốt: `id` · `ky_id` · `lan` · `trang_thai` (`nhap`·`hieu_luc`·`da_dao`) · `chot_boi` · `duyet_boi` · `luc` | PK `id` · partial UNIQUE `(ky_id) WHERE trang_thai='hieu_luc'` | — |
| `phan_bo_ky` | phần của mỗi bên trước thu hồi | PK `(ky_id, chot_id, ben_id)` | RANGE `ky_id` |
| `chia_se_ky` | phần chia sẻ đã áp | PK `(ky_id, chot_id, bai_id, chia_se_id)` | RANGE `ky_id` |
| `chi_tra_dong` | dòng chi trả: `phai_tra` · `thu_hoi` · `don_ky_vao` · `don_ky_ra` | PK `(ky_id, chot_id, ben_id)` | RANGE `ky_id` |
| `so_cai` | dòng sổ có dấu, append-only | PK `(ky_id, id)` · `btree(ben_id, id)` | RANGE `ky_id` |
| `so_du_ben` | số dẫn xuất: `kha_dung` · `dang_xu_ly` · `da_rut` | PK `ben_id` | — |
| `tam_ung` / `tam_ung_thu_hoi` | gốc và từng lượt thu hồi | PK `id` · `(tam_ung_id, ky_id, chot_id)` | — |
| `doi_chieu_ky` | bốn đẳng thức, `lech_micro` là cột `GENERATED` | PK `(ky_id, nguon)` | — |

`partial UNIQUE (ky_id) WHERE trang_thai='hieu_luc'` là ràng buộc quan trọng
nhất của cả miền: một kỳ có nhiều lần chốt trong lịch sử nhưng **đúng một**
lần đang có hiệu lực. Mọi view của đối tác nối qua điều kiện ấy. Thiếu nó thì
sau một lần huỷ chốt, bảng kê cộng đôi — và không ai phát hiện được vì cả hai
lô đều đúng khi nhìn riêng.

### 4.2 Chốt kỳ là giao dịch gì

Ba pha, và pha 1 phải ghi vào một `chot` đã tồn tại ở trạng thái `nhap`:

| Pha | Làm gì | Ghi vào |
|---|---|---|
| 0 | `INSERT INTO chot (ky_id, lan, trang_thai) VALUES (…, 'nhap')` · `ky.trang_thai = 'dang_chot'` | `chot` |
| 1 | Phân bổ: từ `dt_bai_ky_nen_tang` × tham số hiệu lực tại kỳ → phần mỗi bên | `phan_bo_ky` |
| 2 | Áp chia sẻ: trừ chủ, cộng bên nhận, theo `ORDER BY chia_se.id` | `chia_se_ky` |
| 3 | Thu hồi tạm ứng, ngưỡng chi trả, dồn kỳ, ghi sổ, cập nhật ví | `chi_tra_dong` · `tam_ung_thu_hoi` · `so_cai` · `so_du_ben` |
| 4 | `chot.trang_thai = 'hieu_luc'` · `ky.trang_thai = 'da_duyet'` | một dòng |

Pha 4 là **một** lệnh `UPDATE` và nó phải nằm trong cùng giao dịch với pha 3.
Không được commit `ky.trang_thai='da_duyet'` trước khi bảng phục vụ dựng
xong: cửa RLS mở ra trên bảng rỗng thì đối tác đăng nhập vào thấy số không.

Idempotency là **ràng buộc, không phải quy ước**: khoá chính của bốn bảng
trên đã chứa `chot_id`, nên chạy hai lần cùng một `chot_id` là vi phạm khoá
chính. Không cần cờ "đã chạy chưa".

Bốn mắt (D5) là **constraint trigger** kiểm tập hợp, có `pg_advisory_xact_lock`
trên `ky_id`: người ký `chot.chot_boi` không được trùng người ký
`chot.duyet_boi`, và không ai trong hai người đó được có mặt trong
`nhap_tay.boi` của kỳ. `CHECK` không làm được vì nó chỉ thấy một dòng.

### 4.3 Huỷ chốt ghi gì

```
chot cũ:  trang_thai = 'da_dao'          (không sửa dòng dữ liệu nào)
lô đảo:   so_cai nhận dòng ÂM đối xứng, mang chot_id cũ, loai='dao'
tạm ứng:  tam_ung_thu_hoi nhận dòng ÂM   (KHÔNG DELETE)
tiến độ:  ky.trang_thai = 'mo'           (phải lùi, xem dưới)
chốt mới: chot mới ở trạng thái 'nhap', chạy lại từ pha 1
```

Ba chỗ dễ sai, đã vá:

- **Phải lùi con trỏ tiến độ.** Nếu hệ giữ một mốc "đã duyệt tới kỳ N" mà huỷ
  chốt không lùi mốc ấy, kỳ vừa đảo không bao giờ chốt lại được: tiền đã rời
  ví và không có đường quay lại. Lùi mốc nằm trong cùng giao dịch với lô đảo.
- **Không `DELETE` dòng thu hồi tạm ứng.** Bản mẫu `delete adv.byPeriod[pk]`,
  và đó là cách duy nhất nó làm được vì nó không có sổ. Trên máy chủ, xoá
  dòng thu hồi va thẳng vào N5; thay bằng dòng âm, và ràng buộc
  `Σ tam_ung_thu_hoi ≤ goc` vẫn đúng vì tổng có dấu.
- **Ví âm là trạng thái hợp lệ.** Đối tác đã rút theo lần duyệt cũ mà lần
  duyệt mới thấp hơn thì `so_du_ben.kha_dung` âm. Rút tiền bị chặn tới khi
  kỳ sau bù đủ. Đây đúng là hành vi bản mẫu đang có (D4).

### 4.4 Chỉnh số một kỳ cũ

Không `DETACH`/`ATTACH` phân vùng: `ALTER TABLE … DETACH PARTITION` lấy
`ACCESS EXCLUSIVE` trên bảng cha và chặn mọi người đọc của **mọi** kỳ, còn
`DETACH CONCURRENTLY` không chạy được trong khối giao dịch. Thay vào đó:
`MERGE` trong phân vùng, rồi một `chot` mới.

Delta phải tính trên **toàn bộ** dòng chi trả, không chỉ `phai_tra`: bỏ qua
`don_ky_ra` và `thu_hoi` là trả hai lần phần đã dồn kỳ. Và vì mốc thu hồi với
phần dồn kỳ là cột cộng dồn sống, chỉnh kỳ N **có** đụng kỳ N+1 trở đi — nên
thủ tục chỉnh số phải chạy lại các kỳ sau đó theo thứ tự, không được hứa
"các kỳ sau không bị đụng".

### 4.5 Chia sẻ tác quyền

`chia_se` có `hieu_luc_tu_ky` và `da_thu_hoi_micro` là cột cộng dồn trong
giao dịch chốt kỳ. Ba quy tắc:

- `chi_tra_chia_se` khoá chính phải đủ chiều: `(ky_id, chot_id, bai_id,
  chia_se_id)`. Một người cộng tác có thể giữ **hai** chia sẻ trên cùng một
  bài (một do label đặt, một do nghệ sĩ đặt) và khoá thô hơn sẽ nuốt một dòng.
- Luôn có dòng, kể cả khi không trả được: `so_tien_micro = 0` kèm `ly_do_bo`
  (chủ bài không đủ phần, chia sẻ chưa hiệu lực, bên nhận chưa có ví). Không
  có dòng thì không ai giải trình được vì sao tháng này không nhận được gì.
- `hieu_luc_tu_ky` phải được chốt **bên trong** giao dịch chốt kỳ, không phải
  đọc "kỳ mở hiện tại" từ bên ngoài. Người cộng tác nhận lời mời đúng lúc pha
  1 đang chạy thì hai giá trị khác nhau và tiền rơi vào khe.

### 4.6 Doanh thu âm và biên giá âm

Nền tảng thu hồi tiền kỳ trước (clawback) là chuyện bình thường. Hai chỗ phải
có đường riêng:

- Dòng doanh thu âm **không đi qua phép chia**. Nó vào `so_cai` như một bút
  toán điều chỉnh gắn `ben_id` đã xác định từ kỳ gốc, kèm `nguon_dieu_chinh`.
- `bien_gia_micro < 0` (bảng giá đối tác cao hơn báo cáo thật) phải bị `CHECK`
  chặn, hoặc được duyệt tường minh bằng một dòng `doi_chieu_ky` có người ký:
  đó là Haustek chia ra nhiều hơn số thu về.

### 4.7 Bốn đẳng thức đối chiếu

Chạy trước khi cho phép pha 4. `doi_chieu_ky.lech_micro` là cột `GENERATED`,
và `CHECK (trang_thai='khop') = (lech_micro = 0)`.

| # | Đẳng thức | Bắt lỗi gì |
|---|---|---|
| Đ1 | Σ `lo_nhap.tong_kiem_soat` = Σ `dt_bai_ky_nen_tang.gop_that` **+ Σ `dt_tac_quyen_ky.gop_that`** | đọc thiếu dòng · nhập sót nguồn |
| Đ2 | Σ `phan_bo_ky` + Σ phí = Σ gộp ghi nhận | phép chia làm rơi tiền |
| Đ3 | Σ `so_cai` của một bên = `so_du_ben.kha_dung` + `dang_xu_ly` + `da_rut` | ví lệch sổ |
| Đ4 | Σ `chi_tra_dong.phai_tra` = Σ dòng sổ dương của lô | lô ghi thiếu |

Đ1 **phải** cộng cả doanh thu tác quyền. Bỏ sót nó thì mọi kỳ có file hội tác
quyền đều báo lệch, và cái cổng chặn duyệt biến thành cái nút người ta bấm
qua cho xong — tệ hơn là không có cổng.

---

## 5. Đồng thời

| Tình huống | Cơ chế |
|---|---|
| Chạy chốt kỳ hai lần | Khoá chính chứa `chot_id`. Không cần cờ |
| Hai người cùng chốt một kỳ | `pg_advisory_xact_lock(ky_id)` ở pha 0 |
| Rút tiền trong lúc chốt kỳ | `yeu_cau_rut` kiểm `ky.trang_thai <> 'dang_chot'`; `SET LOCAL lock_timeout = '3s'` |
| Hai lệnh rút cùng lúc | `SELECT … FOR UPDATE` trên `so_du_ben` |
| Σ `pct_bp` của chia sẻ vượt 100% | Trigger có `pg_advisory_xact_lock(bai_id)` — **khoá thủ công duy nhất trong hệ**, ghi rõ trong tài liệu vận hành |
| Sửa cùng một hồ sơ | `phien_ban int`, khoá lạc quan |
| Lệnh chuyển tiền thất bại | Hoàn vào ví **và** giảm `dang_xu_ly` trong cùng giao dịch |

Mức cách ly: `READ COMMITTED` cho mọi thứ trừ chốt kỳ và đối chiếu, hai cái
ấy chạy `REPEATABLE READ`.

Job đêm dựng lại số dư dùng mốc nước theo **thời điểm commit**
(`pg_current_snapshot()`), không theo số thứ tự `IDENTITY`. Số thứ tự được
cấp trước khi commit, nên một giao dịch dài làm job bỏ sót dòng sổ vĩnh viễn.

---

## 6. Miền số liệu

| Bảng | Khoá | Phân vùng | Dòng |
|---|---|---|---|
| `lo_nhap` | PK `id` · **UNIQUE `sha256`** · cặp `tong_kiem_soat` / `tong_doc` | — | 4.000 |
| `dong_tho` (Parquet) | `(lo_id, so_dong)` | thư mục `ky/nguon/lo`, sắp theo ISRC | 40M/kỳ · 2,4 tỷ / 5 năm |
| `hang_cho_khop` | UNIQUE `(lo_id, ky_id, nen_tang_id, isrc_tho)` | — | ~3.000/kỳ sau khi gộp |
| `dt_bai_ky_nen_tang` | PK `(ky_id, bai_id, nen_tang_id)` | RANGE `ky_id` | 3,15M/kỳ · 189M / 5 năm |
| `dt_tac_quyen_ky` | PK `(ky_id, tac_pham_id, ben_tac_gia_id)` — **không giữ lãnh thổ** | RANGE `ky_id` | 1,2M/kỳ |
| `luot_ngay_bai` | PK `(ngay, bai_id, nen_tang_id)` · **`btree(bai_id, ngay DESC)`** + BRIN(ngay) | RANGE theo TUẦN, giữ 100 ngày | 280M trong cửa sổ |
| `luot_ngay_ben` | PK `(ngay, ben_id, nen_tang_id)` | RANGE tháng, giữ ngày 400 ngày rồi gộp tuần | 2 GB/năm |

Bốn quyết định có lý do:

- **`dt_bai_ky_nen_tang` không có subpartition HASH.** Thêm `ben_chu_id` vào
  khoá phân vùng thì mất phép khử trùng `(kỳ, bài, nền tảng)`; mà chủ sở hữu
  đổi theo kỳ nên cùng một bài rơi vào hai phần hash và **nạp đôi im lặng**.
  Ở 3,15 triệu dòng một kỳ, hash subpartition không kiếm được gì.
- **`dt_tac_quyen_ky` bỏ chiều lãnh thổ.** Giữ lãnh thổ ở độ hạt chi tiết cho
  tác quyền là 8 triệu dòng một kỳ, và không màn nào đọc tới. Lãnh thổ của
  tác quyền nằm ở bảng tổng hợp riêng nếu sau này cần.
- **`luot_ngay_bai` phải có chỉ mục theo bài.** Chỉ BRIN theo ngày thì mọi
  truy vấn "lượt nghe của bài này 90 ngày qua" quét cả cửa sổ 280 triệu dòng.
- **`hang_cho_khop` gộp theo `(kỳ, nền tảng, ISRC)` trước khi hiện ra người.**
  Tỷ lệ không khớp thật của ngành là 0,5–3%, tức 200.000–1.200.000 dòng thô
  một kỳ. Không ai sửa tay từng dòng. Gộp lại còn khoảng 3.000 mã lạ; sửa một
  mã là khớp cả nghìn dòng. **Con số này quyết định biên chế vận hành**, và
  chỉ biết chắc sau khi đọc file thật (mục 11).

`UNIQUE(sha256)` làm việc dán lại đúng file cũ bị database từ chối. Cặp
`tong_kiem_soat` / `tong_doc` là chỗ duy nhất phát hiện "đọc thiếu 3% dòng"
**trước** khi chia tiền.

---

## 7. Quyền

Hai vai database, hai tiến trình: `haustek_doi_tac` (RLS `ENABLE` +
`FORCE`) và `haustek_noi_bo`. Cả hai đều phải có policy — với `FORCE RLS` và
policy chỉ `TO haustek_doi_tac`, tiến trình nội bộ đọc ra rỗng.

Che cột bằng `REVOKE` + view của đối tác, **không** bằng quét chuỗi. Bản mẫu
có `scrub()` đi tìm mười bảy chuỗi cấm trong payload đã tuần tự hoá: nó bắt
được rò khi tên trường trùng chuỗi cấm và bỏ lọt khi không trùng. Trên máy
chủ, cột nào đối tác không được thấy thì họ không có `SELECT` trên cột ấy.

`nhat_ky` là chỗ rò hay bị quên: nó chứa ảnh chụp nguyên dòng của mọi bảng,
kể cả các cột vừa che, và nó có sẵn `ben_id` với chỉ mục theo bên. Đối tác
không bao giờ có `SELECT` trên `nhat_ky`; cái họ thấy là một view đã lọc cột.

### Bảng dịch từ bản mẫu sang luật thật

| Phép kiểm trong `test/api-guard.js` | Luật trên máy chủ |
|---|---|
| Nghệ sĩ A không đọc được bài của nghệ sĩ B | RLS trên `bai_ben`: `ben_id = ben_phien()` |
| Label chỉ thấy nghệ sĩ của mình | RLS qua `ben_bao_phu` có `pham_vi` và `het_han` |
| Kỳ chưa duyệt bị chặn | View nối `chot.trang_thai='hieu_luc'` |
| Đối tác không thấy phí, biên, mức trả nền tảng | `REVOKE SELECT (phi_micro, bien_gia_micro) …` |
| Đối tác không thấy tên nhân sự | View thay `nhan_su_id` bằng hằng `'Haustek'` |
| `QUYEN_API` (vòng 23): phương thức nào cho loại bên nào | `trang_cho_loai_ben` + `quyen_ham`, mặc định ĐÓNG |
| `TRANG_CHO_BEN` (vòng 23) | cùng bảng ấy, cột `ma_trang` |

Hai chỗ RLS **không đủ**, phải chặn ở tầng dịch vụ:

1. **Object storage.** Hồ Parquet và file bảng kê PDF nằm ngoài database. URL
   ký sẵn phải phát qua một hàm kiểm `ben_phien()`, thời hạn ngắn, và đường
   dẫn không bao giờ nhận `bai_id` làm tham số từ client.
2. **Tổng hợp lớn.** Một truy vấn tổng hợp toàn danh mục chạy dưới RLS vẫn
   đúng nhưng chậm; nó phải đi qua bảng đã vật chất hoá theo bên, và bảng ấy
   đặt dưới `ben_id = ben_phien()` **chứ không** dưới `ben_bao_phu()` — nếu
   không, tiền chảy ngược lên cây label và một label mẹ cộng luôn tiền của
   label con vào ví mình.

---

## 7b. Nhật ký đăng nhập

Bản mẫu ghi được ai vào, lúc nào, cổng nào, bằng thiết bị gì. Nó **không**
ghi được địa chỉ IP, vì trình duyệt biết tên của chính nó nhưng không biết
địa chỉ của chính nó. Địa chỉ là thứ **đầu bên kia của kết nối** đọc được,
nên nó xuất hiện đúng lúc có máy chủ, không sớm hơn.

```sql
CREATE TABLE nhat_ky_dang_nhap (
  id           bigserial,
  luc          timestamptz NOT NULL DEFAULT now(),
  den_luc      timestamptz NOT NULL DEFAULT now(),   -- lần gộp cuối
  so_lan       int         NOT NULL DEFAULT 1,
  cong         text        NOT NULL CHECK (cong IN ('doi-tac','noi-bo')),
  ket          text        NOT NULL CHECK (ket IN ('ok','sai-mat-khau','sai-mfa','bi-khoa','het-han','tu-choi')),
  nguoi_dung_id bigint     REFERENCES nguoi_dung(id),
  email_thu    citext,                                -- email ĐÃ GÕ, kể cả khi không có tài khoản
  ben_id       bigint      REFERENCES ben(id),
  phien_id     uuid        REFERENCES phien(id),
  ip           inet        NOT NULL,                  -- KHÔNG NULL trên máy chủ
  ip_nguon     text        NOT NULL CHECK (ip_nguon IN ('ket-noi','proxy-tin-cay')),
  quoc_gia     char(2),                               -- suy từ ip lúc ghi, không tra lại sau
  thiet_bi     text, trinh_duyet text, he_dieu_hanh text,
  PRIMARY KEY (luc, id)
) PARTITION BY RANGE (luc);
```

Chín điều bắt buộc:

1. **`ip inet NOT NULL`, không phải `text`.** Kiểu `inet` so sánh được theo
   dải (`ip << '113.161.0.0/16'`), chuẩn hoá IPv6 (`::1` và `0:0:...:1` là
   một), và từ chối rác ngay lúc ghi. Lưu `text` thì mọi truy vấn "có ai
   khác từ dải này không" thành quét toàn bảng.
2. **`ip_nguon` nói địa chỉ ấy từ đâu ra.** Sau một proxy hay CDN,
   `REMOTE_ADDR` là địa chỉ của proxy còn địa chỉ thật nằm trong
   `X-Forwarded-For` — **mà header ấy máy khách tự đặt được**. Chỉ tin nó
   khi kết nối đến từ dải proxy của chính mình, và ghi rõ `proxy-tin-cay`.
   Tin bừa `X-Forwarded-For` là mở cửa cho bất kỳ ai tự khai mình ở đâu
   cũng được, tức nhật ký an toàn thành vô giá trị.
3. **Ghi cả lần HỎNG.** Bản mẫu không có mật khẩu nên chỉ có `ok` và
   `tu-choi`. Trên máy chủ, `sai-mat-khau` là dòng quan trọng nhất trong
   bảng: nó là thứ duy nhất trả lời "có ai đang dò mật khẩu không".
4. **`email_thu` ghi email ĐÃ GÕ, không phải email tra ra được.** Người ta
   dò mật khẩu bằng những email **không có tài khoản**; nếu chỉ ghi khi tra
   ra `nguoi_dung_id` thì đúng những lần đáng ngờ nhất lại không để lại dấu.
5. **`quoc_gia` suy một lần lúc ghi và đông cứng.** Bảng ánh xạ địa chỉ →
   quốc gia thay đổi theo thời gian; tra lại sau hai năm cho ra một nước
   khác, và một nhật ký đổi nội dung theo thời gian thì không dùng làm bằng
   chứng được.
6. **Chỉ ghi thêm.** `REVOKE UPDATE, DELETE ON nhat_ky_dang_nhap FROM PUBLIC`
   trừ đúng một việc: bước dọn theo thời hạn, và bước ấy `DROP` cả phân
   vùng chứ không `DELETE` từng dòng.
7. **Thời hạn lưu là một con số viết ra, không phải "giữ mãi".** Phân vùng
   theo tháng, giữ **12 tháng** rồi `DROP PARTITION`. Bản mẫu giữ 180 ngày
   vì `localStorage` nhỏ; máy chủ giữ 12 tháng vì đó là khoảng một cuộc
   điều tra gian lận thật cần nhìn lại. Con số này phải trùng với con số
   ghi trong thông báo cho người dùng — lệch một chữ là sai cam kết.
8. **Người dùng đọc được dòng của chính mình.** RLS:
   `USING (nguoi_dung_id = nguoi_dung_phien())`. Đây là quyền truy cập của
   chủ thể dữ liệu theo luật bảo vệ dữ liệu cá nhân, và làm sẵn thì không phải
   dựng quy trình xử lý yêu cầu thủ công về sau.
9. **Đăng nhập lạ phải nối vào lệnh rút tiền.** Tài khoản đối tác giữ ví.
   Quy tắc tối thiểu: một lệnh rút tiền đặt trong **24 giờ** sau lần đăng
   nhập đầu tiên từ một `quoc_gia` chưa từng thấy thì **không tự động
   duyệt** — nó vào hàng chờ người kiểm. Nhật ký mà không nối vào chỗ mất
   tiền thì chỉ là một bảng đẹp.

Văn bản pháp lý áp dụng: **phải rà lại**. Theo tra cứu ở vòng 24, Nghị định
13/2023/NĐ-CP đã bị thay thế bởi Luật 91/2025/QH15 và Nghị định
356/2025/NĐ-CP từ 01/01/2026, và Nghị định 53/2022/NĐ-CP liệt kê đích danh
**địa chỉ mạng đăng nhập gần nhất** vào nhóm dữ liệu phải lưu tại Việt Nam —
tức bảng này rơi thẳng vào nhóm ấy. Chưa có luật sư xác nhận; xem
`TRIEN-KHAI.md` mục 10 trước khi code phần này.

Ba việc **cố ý chưa làm** ở giai đoạn một: chấm điểm rủi ro từng lần vào,
dấu vân tay thiết bị, và tra nhà mạng theo thời gian thực. Cái thứ nhất cần
dữ liệu lịch sử chưa có; hai cái sau thu thập nhiều hơn mức cần để trả lời
câu hỏi đang hỏi, mà dữ liệu cá nhân thu thừa thì chỉ là nợ.

---

## 8. Cổng người cộng tác

Vai `nguoi_nhan` là **năm dòng trong `trang_cho_loai_ben`**, không phải một
nhánh mã mới. Bảng ấy mặc định ĐÓNG.

| Đọc được | Không đọc được |
|---|---|
| Phiên của chính mình | Danh mục, doanh thu bài, nền tảng, lãnh thổ |
| Ví, sổ cái, lệnh rút của chính mình | Tạm ứng, phát hành, chiến dịch, khiếu nại |
| `bai_ben` nơi `ben_id = ben_phien()` và `vai='cong_tac'` | `bai_ben` của người khác trên cùng bài |
| `chi_tra_chia_se` nơi `ben_nhan_id = ben_phien()` | `phan_bo_ky` của chủ bài |
| Lời mời gửi tới mình · việc hỗ trợ của mình | Bất cứ gì của bên thụ hưởng khác |

Ghi được đúng sáu việc, qua sáu hàm `SECURITY DEFINER`: nhận lời mời, khai
tài khoản nhận tiền, gửi yêu cầu rút, huỷ yêu cầu rút, tạo việc hỗ trợ, trả
lời việc hỗ trợ. Cả sáu đọc `phien.ben_hien_id` và ném nếu đang đóng vai.

**Nhận lời mời khoá bằng `moi_token uuid` dùng một lần, không bao giờ bằng
email.** Lời mời gõ nhầm địa chỉ mà chỉ kiểm email thì người lạ nhận vĩnh
viễn. Token có thời hạn, và bên nhận là `ben_phien()` — một đường duy nhất.

**Chiều ngược lại:** chủ bài ĐƯỢC thấy số tiền đã trả cho người cộng tác của
mình (họ cần đối chiếu hợp đồng), nhưng KHÔNG thấy email và không thấy sổ cái
của người ấy.

**Rò suy luận có ý chấp nhận:** người cộng tác biết phần trăm của mình và số
tiền mình nhận, nên chia ra là suy được phần của chủ bài trên bài ấy. Không
tránh được mà vẫn giữ được tính giải trình. Cổng không bày thêm gì: không
doanh thu bài, không lượt nghe, không nền tảng, không lãnh thổ.

---

## 9. Đọc nhanh và ngân sách thời gian

Mọi con số đối tác thấy đến từ bảng `tt_*` dựng lúc chốt kỳ, dựng **đầy đủ**
cho mọi bên, không ngưỡng và không lấy mẫu.

| Đường nóng | Cách chạy | Ngân sách |
|---|---|---|
| Mở tổng quan của một bên | 1 tra khoá chính `tt_ben_ky` | 15 ms |
| Bảng kê một kỳ | 1 range scan `(ben_id, ky_id)` | 40 ms |
| Danh mục 50 dòng đầu | `btree(ben_id, vai, bai_id)` + LIMIT | 60 ms |
| Phần chia của người cộng tác | `btree(ben_nhan_id, ky_id)` | 20 ms |
| Ví + sổ cái 24 dòng | `btree(ben_id, id DESC)` LIMIT 24 | 25 ms |
| Mọi huy hiệu điều hướng | **một** lời gọi `GET /toi/huy-hieu` đọc `huy_hieu_ben` theo PK | 10 ms |
| Chốt kỳ pha 1–3 | theo lô, 40.000 bên | đo ở bước di trú 6 |

Huy hiệu đáng nói riêng: bản mẫu gọi một hàm đếm cho **mỗi** mục điều hướng
mỗi lần vẽ lại. Ở quy mô thật đó là mười lăm truy vấn cho một lần bấm.

Vô hiệu hoá bộ đệm **theo dòng dõi**, không theo bộ đếm ghi toàn cục: mỗi
bảng phục vụ ghi `chay_buoc.id` đã sinh ra nó, và đệm khoá theo id ấy. Kỳ đã
duyệt thì đệm vĩnh viễn với ETag = `chot_id`.

---

## 10. Di trú từ bản mẫu

Chín chặng, mỗi chặng có cổng chấp nhận riêng:

| # | Chặng | Cổng chấp nhận |
|---|---|---|
| 1 | Dựng lược đồ trống + RLS + CI chạy `EXPLAIN` | mọi đường nóng dùng index |
| 2 | Nạp danh tính (người dùng, bên, người dùng ↔ bên) | số bên khớp sổ kinh doanh |
| 3 | Đọc file báo cáo THẬT của ba kỳ gần nhất | tỷ lệ không khớp thật, số dòng thật |
| 4 | Số dư mở đầu | **lấy từ sổ kế toán và sao kê ngân hàng**, không phải chạy lại lịch sử |
| 5 | Chạy song song kỳ đầu | khớp bảng tính kế toán tới từng xu |
| 6 | Chạy song song kỳ thứ hai | khớp lần nữa, và đo thời gian chốt kỳ |
| 7 | Mở cổng đối tác cho 10 bên thử | số trên cổng = số nội bộ |
| 8 | Mở cho tất cả | — |
| 9 | Tắt bản mẫu, giữ làm bộ sinh ca kiểm thử | — |

Hai điều phải nói trước:

- **Số dư mở đầu không phải kết quả chạy lại lịch sử.** Bản mẫu không có sổ,
  nên chạy lại nó chỉ ra một con số plausible chứ không phải con số đúng. Số
  dư mở đầu ghi bằng đúng một lô `so_du_mo` có chữ ký của kế toán trưởng.
- **Cổng chấp nhận là khớp BẢNG TÍNH KẾ TOÁN, hai kỳ liên tiếp** — không phải
  khớp `state.payouts` của bản mẫu. Bản mẫu là đặc tả hành vi, không phải
  nguồn sự thật về tiền.

---

## 11. Chỗ chỉ biết sau khi đọc dữ liệu thật

Bốn con số quyết định kiến trúc mà hôm nay chỉ là ước lượng. Chặng 3 của di
trú tồn tại để đo chúng, và nếu kết quả lệch xa thì phải quay lại sửa tài
liệu này chứ không phải sửa số liệu cho vừa.

| Con số | Ước lượng | Hỏng gì nếu sai |
|---|---|---|
| Tỷ lệ ISRC không khớp | 0,5–3% | biên chế vận hành, kích thước `hang_cho_khop` |
| Số dòng thô một kỳ | 40 triệu | kích thước hồ, thời gian pha 1 |
| Số nền tảng có tiền trên một bài | 9 | cỡ `dt_bai_ky_nen_tang` |
| Số bên có tiền một kỳ | 40.000 | thời gian pha 3, cửa sổ khoá ví |

---

## 12. Đối chiếu với bản mẫu

Bản mẫu làm đúng những việc này, cứ thế dịch sang:

- Tách phí Haustek khỏi bảng giá nền tảng (vòng 20) — hai khái niệm khác hẳn.
- Ba lớp danh tính (vòng 22) — hình dạng đúng, chỉ sai ở khoá dạng chuỗi.
- Huỷ chốt có bù trừ, không xoá bảng đã duyệt (vòng 22).
- Bảng khai quyền mặc định ĐÓNG (vòng 8 cho nội bộ, vòng 23 cho cổng đối tác).
- Đối tác chỉ thấy số sau phí của chính mình; đối soát nội bộ tách phí ra.

Và làm sai những việc này, bản thật phải khác:

| Bản mẫu | Vì sao hỏng | Bản thật |
|---|---|---|
| Chỉ mục người viết nạp một bài hai lần khi một người đứng cả hai vai tác giả | 12 nghệ sĩ, cổng báo thừa tới 7,40 USD một kỳ | `UNIQUE (bai_id, ben_id, vai, …)` |
| Trang Chia sẻ báo 38.132,54 USD "đã trả" trong khi tiền thật đổi chủ là 44,14 USD | ước tính bị gọi là đã trả, và bảng còn lấy mẫu 1/13 bài rồi cắt 300 dòng nên giấu đúng chỗ có tiền | `chi_tra_chia_se` là bảng thật; N7 cấm lấy mẫu |
| Bảng giải thích kỳ đọc trường không tồn tại nên dòng dồn kỳ hiện rỗng | không ai thấy vì không có test | `don_ky_ra` là cột đã ghi, không tính lúc đọc |
| Tạm ứng kẹp số dư về 0 | hạ gốc dưới phần đã thu hồi là mất dấu tiền | `Σ tam_ung_thu_hoi ≤ goc` là ràng buộc |
| Bài kiểm bất biến ví đọc trường `balance` không tồn tại | suốt nhiều vòng không kiểm gì | Đ3 là cột `GENERATED`, không phải điều kiện trong mã kiểm |
| `mucTraVer()` gọi `JSON.stringify` một lần cho **mỗi** bài | 26,7 ms → 294 ms khi bảng giá có 9 nền tảng | tham số định giá là bảng có khoảng hiệu lực, tra bằng index |
| Đổi hợp đồng hôm nay làm số của kỳ lịch sử đổi theo | hai số của cùng một kỳ lệch nhau vĩnh viễn | N4: chỉ-thêm, `REVOKE UPDATE` |

---

## 13. Cố ý không làm ở giai đoạn một

| Không làm | Dấu hiệu đã đến lúc làm |
|---|---|
| Đa vùng, đa bản ghi chính | Đối tác ngoài Việt Nam quá 20% doanh thu |
| Kho cột riêng cho phân tích | Một truy vấn báo cáo vượt 5 giây sau khi đã có index đúng |
| Tách dịch vụ | Đội quá 12 người, hoặc hai miền có nhịp phát hành khác hẳn nhau |
| Tự động khớp ISRC bằng học máy | `hang_cho_khop` vượt 10.000 mã một kỳ sau khi đã gộp |
| Cổng cho hội tác quyền | Có hợp đồng trực tiếp với hội, không qua Sentric |
| Lưu lãnh thổ cho tác quyền | Có nền tảng trả theo lãnh thổ cho tác quyền |

Mỗi dòng ở đây là một lựa chọn, không phải một thiếu sót. Làm sớm cái nào
trong bảng này cũng đổi lấy độ phức tạp hôm nay để mua một thứ chưa cần.
