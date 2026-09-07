# Bảng tính ROI của Haustek: đọc lại và dựng vào phần mềm

File nguồn: `ROI_Haustek.xlsx`, sáu sheet — `REVENUE CAL`, `Catalog ROI.`,
`Trigger 1 ROI`, `Trigger 2 ROI `, `Trigger 3 ROI`, `Mail Merge`.
Bản dựng trong phần mềm: `A.roi.tinh()` và `A.roi.kichBan()` ở
`haustek-core.js`, trang `man/roi.js`, phép kiểm `test/roi-cong-thuc.js`.

## 1. Bảng tính đang mô tả thương vụ gì

Haustek ứng trước một khoản cho một danh mục đang có doanh thu, rồi thu lại
bằng **hai đường chạy song song**:

| Đường | Chạy trong bao lâu | Ô |
|---|---|---|
| Hoa hồng Haustek trên doanh thu tháng | suốt kỳ hạn | `D3 = A3 × (1 − C2)` |
| Phần của nghệ sĩ giữ lại để thu hồi khoản ứng | đến khi hết nợ | `G3 = A3 − D3 − F3` |

Vì khoản ứng được thu hồi hết từ đường thứ hai, cái mà `J5 = D5 / B3` đo là
**lãi trên vốn**, không phải doanh thu trên vốn: `1,03×` nghĩa là ngoài việc
lấy lại đủ 50.000, hoa hồng cả kỳ hạn còn mang về thêm 103% số vốn ấy.
`K5 = J5 / J3 × 12` đưa về mỗi năm — 20,6%/năm ở sheet Catalog.

Kết luận đó **chỉ đúng khi khoản ứng thu hồi kịp trong kỳ hạn**. Không sheet
nào kiểm điều kiện này (mục 2.4).

## 2. Bốn chỗ bảng tính tính lệch

### 2.1 Ô I3 — số tháng thu hồi luôn ra âm

```
I3 =(H3/G3)-1        với H3 = -B3 + G3
   = (-B3 + G3)/G3 - 1
   = -B3/G3 + 1 - 1
   = -B3/G3
```

Độ lớn đúng, dấu ngược. Ba sheet đọc được đều in ra số âm: −20,47 · −23,81 ·
−22,22. Nên là `=B3/G3` (hoặc `=-H3/G3`). Trong phần mềm số này là dương, và
có thêm một số tháng làm tròn lên để nói với người đọc — 20,5 tháng nghĩa là
tháng thứ 21 mới hết nợ.

### 2.2 Ô J11 — tổng chi phí luôn bằng 0

```
I7  Cost / Hour        → giá trị nằm ở J7
I8  Releases/Ex Year   → J8
I9  Total Releases     → J9
J11 =J9*J6*J7
```

`J6` là ô trống, không có nhãn ở `I6` (`I6` chỉ chứa một dấu cách). Nhân với
ô trống nên `J11 = 0` ở cả bốn sheet, và do đó `J12` (*ROI After Costs*) luôn
bằng đúng `J5`. Nhìn vào bảng thì tưởng đã trừ chi phí, thực ra chưa trừ gì.

Ý định có lẽ là *số bản × giờ mỗi bản × đơn giá giờ*, nhưng "giờ mỗi bản"
không có dòng riêng. Phần mềm nhận đủ ba ô đó, có nhãn rõ ràng.

### 2.3 Ô D7 — "Net for ONErpm" không nhất quán giữa các sheet

| Sheet | Công thức D7 |
|---|---|
| Catalog ROI. | `=D3*J3` — không trừ chi phí |
| Trigger 1 / 2 / 3 | `=D5-J11` — có trừ chi phí |

Cả bốn đều **không** trừ phí môi giới `J10`, trong khi `J12` thì có trừ. Nên
D7 và J12 đang kể hai câu chuyện khác nhau về cùng một thương vụ. Phần mềm
trừ cả hai ở cả bốn kịch bản, nên `D7 = J12 × B3` luôn đúng.

### 2.4 Không sheet nào kiểm khoản ứng có thu hồi kịp không

Sheet `Trigger 2 ROI ` là ví dụ ngay trong file: thu hồi mất 22,2 tháng,
trong khi độc quyền còn lại `K3 = 33 − 18 = 15` tháng. Hết độc quyền, nghệ sĩ
có quyền đi nơi khác và dòng thu hồi có thể đứt — nhưng `J5` vẫn in ra
`0,585×` như thể mọi thứ chạy đủ kỳ hạn. Người đọc phải tự lấy `I3` so với
`K3` bằng mắt.

Phần mềm tính thêm:

* **phần chưa thu hồi khi hết kỳ hạn** — `khoản ứng − phần giữ lại × kỳ hạn`,
* **ROI thực** — trừ tiếp phần chưa thu hồi ấy, vì đó là lỗ chứ không phải
  tiền treo,
* **tháng hoà vốn** — tháng đầu tiên tiền về (hoa hồng cộng thu hồi) vượt
  khoản ứng,
* và ba cờ đạt / không đạt: thu hồi trong kỳ hạn, thu hồi trong thời gian
  độc quyền, ROI đạt ngưỡng (mặc định `1,00×` và 24 tháng, sửa được).

## 3. Hai sheet không đọc được số

`Trigger 3 ROI` lấy `C2 =[1]Sumary!E7` và toàn bộ `Mail Merge` lấy từ
`[1]Sumary` và `[2]INPUT` — hai workbook không gửi kèm. File `.xlsx` cũng
không mang phần `externalLinks`, nên đến số đã lưu cache cũng không còn: cả
hai sheet ra `#REF!` từ ô đầu tiên. Còn đọc được **hình dạng công thức**,
không còn số để đối chiếu.

Từ hình dạng ấy vẫn suy ra được cấu trúc thương vụ mà `Mail Merge` mô tả, và
phần mềm dựng theo:

| Cột Mail Merge | Nghĩa |
|---|---|
| `L` Tỉ lệ chia · `M` Doanh thu · `O` Thời hạn · `P` Độc quyền | bốn ô đầu vào chính |
| `Q` Truyền thông · `R` Sản xuất · `S` Tiền mặt · `T` Lương (flow through) | bốn phần của khoản ứng |
| `U/Y/AC` Mốc thưởng · `V/Z/AD` Hệ số · `W/AA/AE` Tiền thưởng · `X/AB/AF` Trong vòng tháng | ba mốc thưởng |
| `AI…BB` | năm số ROI × bốn kịch bản |

`AB2 =[1]Sumary!E18+X2` và `AF2 =[1]Sumary!F18+AB2` cho thấy **cửa sổ thời
gian của các mốc cộng dồn**, và `J3 =57-18`, `K3 =33-18` ở sheet Trigger 2
cho thấy **kỳ hạn và độc quyền còn lại trừ đi số tháng đã trôi**. Phần mềm
làm đúng hai điều đó.

Một chỗ phải đoán: quan hệ giữa *Mốc thưởng*, *Hệ số* và *Tiền thưởng* nằm
trong workbook không gửi kèm. Phần mềm giả định
`tiền thưởng = doanh thu tháng tại mốc × hệ số` — khớp với số mẫu trong file
(3.000 × ~16,7 ≈ 50.000) và là cách thường dùng trong ngành. Sai chỗ này thì
sửa một dòng trong `dealRoiScenarios`.

`REVENUE CAL` rỗng, chỉ có chữ *Link Detail Monthlys report* ở `A1`.

## 4. Hai thang ROI trong phần mềm, đừng so thẳng

| | Trang **Tính ROI** (`A.roi.tinh`) | Trang **Xét duyệt** (`advanceCalc`) |
|---|---|---|
| Trả lời câu | nên mua danh mục này với giá này không | nên ứng cho tài khoản đang chạy này không |
| Tiền về được tính | hoa hồng Haustek suốt kỳ hạn | phí ứng cộng phần Haustek giữ trong thời gian thu hồi (tối đa 24 tháng) |
| Chia cho | khoản ứng | khoản ứng |
| Quy về năm bằng cách chia cho | kỳ hạn | thời gian thu hồi |
| Phí ứng | không có; lãi đến từ hoa hồng | 12% cộng vào khoản phải thu hồi |
| Số đầu vào | người dùng gõ | đọc từ sổ 12 kỳ gần nhất |
| Mốc hoà vốn | `0` | `0` |

Hai cái cùng là *lãi trên vốn* nên cùng lấy 0 làm mốc hoà vốn, nhưng mẫu số
thời gian khác nhau, nên **con số mỗi năm của hai bên không so thẳng được**.
Trang Tính ROI có một thẻ nhắc lại điều này.

## 5. Ai dùng

Đúng ba vai đang có quyền đề xuất (nhóm hàm `deXuat`):

| Vai | Dùng để | Vào từ |
|---|---|---|
| Kinh doanh | dựng thương vụ lúc chào, thử vài mức giá trước khi gửi đề xuất | điều hướng · nút trên Xét duyệt |
| Kế toán | kiểm lại số trước khi giám đốc duyệt | điều hướng · nút trên Xét duyệt và Tạm ứng |
| Giám đốc | quyết, và thử điều khoản thay thế | mọi nơi |

Vận hành và hỗ trợ **không** có: cả trang lẫn `A.roi.*` đều bị chặn, có phép
kiểm trong `api-guard.js`.

Cổng đối tác **không** có, và không nên có: bảng tính này tính phần Haustek
giữ lại, phí môi giới và biên lợi nhuận — đúng loại số mà quy tắc từ vòng 8
giữ ngoài cổng đối tác. Đối tác muốn biết mình ứng được bao nhiêu thì đã có
`k-tam-ung`, chạy trên `advanceOfferOf()` vốn đã lược sạch những số đó.

Khác với `advanceCalc` (kinh doanh và kế toán bị lược mất `roi`, `margin`,
`retained*`), trang này **không lược gì**: số là do chính người dùng gõ vào,
không phải rút từ sổ của một đối tác cụ thể, nên không có gì để rò rỉ.
