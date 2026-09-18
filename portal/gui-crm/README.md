# Hộp thư hai chiều · Portal ↔ CRM

Thư mục này bắt đầu ở vòng 28 như một chiều gửi sang CRM; từ vòng 31 cả hai
đội cùng đặt file vào đây. Đọc từ dưới lên theo vòng.

## Bản vá gửi CRM — áp bằng `git apply`

| File | Vòng | Nội dung | Trạng thái |
|---|---|---|---|
| `va-buoc-1.patch` | 28 | 4 lỗi cầu nối + 4 bài kiểm | CRM đã áp, và tìm thêm 4 lỗi trong đó |
| `them-gioi-han.patch` | 28 | Portal công bố khoảng nó nhận (`thuongVu.gioiHan`) | **chưa áp** |
| `phat-goi-1-1.patch` | 32 | Portal phát gói 1.1 trả về CRM | mời áp — CRM đang chờ đúng cái này |

```bash
git checkout crm-cau-noi-v2
git apply phat-goi-1-1.patch
cd portal && node test/thuong-vu.js      # 63 đạt
```

## Tài liệu

| File | Của ai | Nội dung |
|---|---|---|
| `HOP-DONG-DU-LIEU-1-2.md` | Portal | **bản đang dùng** · gói vào cắt còn 23 khoá, gói ra 1.2.0 báo cả ba trạng thái |
| `HOP-DONG-DU-LIEU-1-1.md` | Portal | *(đã thay bằng 1.2)* sáu đề nghị để hai hệ đi cùng nhịp |
| `NOTE-GUI-CRM.md` | Portal | bản chất bốn lỗi, hai luật kiểm thử, thương hiệu chung |
| `QUY-TRINH-KY-HOP-DONG.md` | Portal | tư vấn quy trình ký điện tử, và một lỗ trong chuỗi tiền |
| `TAM-UNG-VA-VIEC-CAN-CRM.md` | Portal | phí tạm ứng là gì (đo thật), và toàn bộ việc CRM cần đáp ứng |
| `TRA-LOI-BUOC-1.md` · `TRA-LOI-BUOC-3.md` | CRM ↔ Portal | soát bước 1 và bước 3 |
| `CHOT-TOKEN-HEAD.md` | CRM | chốt `--head` là dải tối, kèm số đo và ảnh dựng |
| `GUI-PORTAL-VONG-31.md` | CRM | ba việc xong, hai việc cần Portal, hai quyết định |
| `chon-head.html` · `.png` | CRM | chín phương án dải head dựng thật, hai chế độ |

## Quyết định đã chốt

| | Quyết định | Vòng |
|---|---|---|
| `--head` | dải **tối**, nếp CRM · sáng `#1D2935` · tối `#293E51`, dựng ở H210 của Portal | 31 |
| Chế độ tối | **không** kéo theo phép ghim `tương phản(--card, --head) ≥ 3:1`. Thẻ tối đã sát sàn, đen tuyền cũng chỉ được 1,35:1 — ghim 3:1 chỉ cho chế độ sáng | 32 |
| Trục xám H240 | **có đổi**, nhưng để **một lượt riêng** trên cây đã xanh. Gộp hai thay đổi màu vào một lượt thì hỏng không biết tại cái nào | 32 |
| `--card` / `--muted` | thắng `--paper` / `--faint`. Đổi tên, không đổi một pixel nào | 31 |
| Phí tạm ứng | **BỎ HẲN.** Ứng bao nhiêu thu hồi đúng bấy nhiêu. Lợi nhuận Haustek đến từ phí dịch vụ theo hợp đồng, không từ một khoản thu của đối tác. Hằng số xoá hẳn khỏi lõi, không giữ tham số mặc định 0 | 35 |
| Cửa cảnh báo tạm ứng | đo bằng **số tháng thu hồi**, không bằng ROI. Bỏ phí thì `roi = retained/amount` và `amount` triệt tiêu: đo trên L:38, ứng 0,25× đến 1,25× trần đều ra 0,489 | 35 |
| Gói CRM → Portal | cắt tám trường không đổi được quyết định nào; khoá lạ **mang số** bị chặn ở cửa trình, mang chuỗi hoặc boolean thì cho qua | 35 |
| Đóng băng sau khi trình | chỉ đóng băng **điều khoản**, không đóng băng nhãn. Trước đây mọi trường đều đóng băng, nên một khác biệt ngoài `terms` sinh ra dòng chênh lệch có cột trước trùng khít cột sau | 35 |

## Còn chờ quyết

1. `feeOf` đọc `signedAt` hay `approvedAt` — **chặn cả luồng ký điện tử**.
2. Phí mới chạy từ kỳ ký, kỳ duyệt, hay kỳ thoả thuận (hiện hồi tố 3 tháng,
   không ai từng quyết). Hộp xác nhận trình đang in "từ kỳ mở tiếp theo";
   câu ấy chỉ đúng khi quyết định số 2 chốt theo hướng ấy.
3. ~~Phí tạm ứng 12% hay 0%~~ — **đã chốt vòng 35: bỏ hẳn.**

## Lệ chung rút ra, cả hai đội cùng giữ

1. Bài kiểm phải nêu được **cơ chế** chặn, không chỉ **kết quả** chặn.
2. Bài kiểm **không được lấy dữ kiện từ cùng nguồn** với thứ nó kiểm.
3. Bỏ qua một chặng duyệt thì phải **đọc được**, dù luồng có cho phép.
4. Sửa một lỗi hiện ở N chỗ thì sửa ở **phạm vi**, đừng sửa N chỗ.
