# Gửi đội CRM · vòng 28

Hai bản vá cho nhánh `crm-cau-noi-v2`, và một đề nghị cho hợp đồng dữ liệu
bước sau.

Chúng tôi **không đẩy lên nhánh của các bạn** — nhánh ấy là của các bạn.
Dưới đây là mã đã chạy được, các bạn áp một lệnh là xong, hoặc gõ lại theo
ý mình cũng được.

```bash
git checkout crm-cau-noi-v2
git apply va-buoc-1.patch        # bốn chỗ phải sửa
git apply them-gioi-han.patch    # tuỳ chọn, xem mục 2 tài liệu hợp đồng
cd portal && node test/thuong-vu.js
```

| File | Nội dung | Bắt buộc? |
|---|---|---|
| `va-buoc-1.patch` | 4 lỗi + 4 bài kiểm mới | **có** — xem `SOAT-CAU-NOI-CRM.md` mục 2 |
| `them-gioi-han.patch` | Portal công bố khoảng nó nhận, để CRM chặn ngay trên form | không, nhưng nên |
| `HOP-DONG-DU-LIEU-1-1.md` | sáu đề nghị để hai hệ đi cùng nhịp | để bàn |

Đã đo trên bản áp sạch từ `origin/crm-cau-noi-v2`:
`thuong-vu` 33 · `i18n-loi` 219 · `api-guard` 103 · `qc-quyen` 14 ·
`qc-bat-bien` 15 · `luoc-do` 12 · `aaa` 11 · `tien-ba-lop` 23. Không bộ nào đỏ.

Mỗi bài kiểm mới đều đã kiểm ngược: trả bản sửa về như cũ thì đúng bài ấy
đỏ, và chỉ bài ấy.
