# Giao kèo bàn giao CRM → Portal

`crm.html` ghi. `intranet.html` đọc. Một chiều, không có chiều ngược lại.

## Vì sao không khớp tự động được

Đây là ràng buộc quan trọng nhất, nên nói trước.

Danh mục hai bên **không phải một**:

| | Portal | CRM |
|---|---|---|
| Nghệ sĩ | 900, sinh từ bộ số giả ngẫu nhiên có hạt giống cố định | 35 khách hàng, tên thật |
| Label | 40, tên hư cấu — `Nightform Records`, `Sông Ngầm Records` | tên thật — `Sconnect Music`, `1DEE music` |

Đối chiếu thẳng hai danh sách thì trùng **đúng một cái tên trên 23** (`Hà Quỳnh Như`),
và **không label nào trùng**. Vì vậy mọi ý tưởng "khớp theo tên" đều sai ngay từ đầu,
và code không có chỗ nào làm việc đó.

Thay vào đó: mỗi deal mang một trường `portalPartyKey`, khởi đầu là `null`.
Người vận hành tra id bên intranet rồi **gắn tay** ở tab **Bàn giao portal** trong CRM.
Chưa gắn thì deal vẫn nằm đó, đếm vào con số đỏ cạnh mục điều hướng.

## Khoá lưu trữ

| Khoá | Ai ghi | Nội dung |
|---|---|---|
| `haustek.portal.v1` | **chỉ portal** | quyết định vận hành của portal |
| `haustek.crm.v1` | chỉ CRM | toàn bộ trạng thái CRM |
| `haustek.crm.handoff.v1` | chỉ CRM | bản tin bàn giao, portal đọc |

**CRM không bao giờ ghi vào `haustek.portal.v1`.** Portal là chủ sổ tỷ lệ và sổ tạm ứng;
CRM chỉ đặt bản tin của mình ra một khoá riêng. Hai bên không tranh chấp, không cần khoá chốt.

Bản tin được ghi lại mỗi lần CRM lưu trạng thái.

## Hình dạng bản tin

```json
{
  "v": "1.0.0",
  "source": "haustek-crm",
  "at": "2026-09-14T…",
  "total": 8,
  "bound": 1,
  "deals": [
    {
      "dealId": "o164",
      "dealName": "Flyaway Records — Distribution 2026",
      "account": "Flyaway Records (ViVi ENM)",
      "accountType": "label",
      "country": "VN",
      "amountUSD": 18000,
      "closeDate": "2026-09-11",
      "owner": "Ethan Nguyen",
      "rights": { "dist": true, "pub": false, "yt": true },
      "terms": {
        "artistSharePct": 70,
        "initialAdvanceUSD": 12000,
        "marketingFundUSD": 1800,
        "totalAdvanceUSD": 13800,
        "termMonths": 72,
        "exclusivityMonths": 36,
        "findersFeePct": 0
      },
      "portalPartyKey": null
    }
  ]
}
```

Chỉ deal ở giai đoạn **Đã ký** (`stage === 'won'`) mới có mặt.

`terms` lấy từ `o.ext.advCalcResult` — kết quả máy tính advance trong form cơ hội.
Deal ký mà không chạy máy tính advance thì `terms` là `null`; khi đó không sinh được
lời gọi nào, và đó là đúng: chưa có điều khoản thì chưa có gì để bàn giao.

## Từ bản tin ra lời gọi portal

Một deal đã gắn sinh ra đúng hai lời gọi, khớp chữ ký trong `screens/_CONTRACT.md`:

```js
A.rates.add("L:7", 0.7, "<kỳ hiệu lực>", "Ethan Nguyen",
            "CRM o164 — Flyaway Records — Distribution 2026")
A.advances.set("L:7", 13800, "CRM o164 — ký 2026-09-11")
```

CRM **chỉ dựng sẵn chuỗi** cho người vận hành đối chiếu — xem ở màn hình gắn party.
Nó không tự chạy, vì chỉ portal mới có quyền ghi vào hai sổ đó.

`<kỳ hiệu lực>` phải do người chọn: ngày ký của deal không nói được tiền bắt đầu
chia từ kỳ nào. Đó là quyết định thương mại, không suy ra được từ dữ liệu.

## Việc này CHƯA làm gì

Nói thẳng cho khỏi hiểu nhầm, cùng giọng với `portal/README.md`:

- **Không có máy chủ.** Hai app chạy cùng một trình duyệt, cùng một origin thì mới
  thấy khoá của nhau. Khác máy, khác trình duyệt thì phải dùng nút **Xuất JSON**
  rồi chuyển file bằng tay.
- **Không có xác thực.** Đăng nhập CRM là ô chọn người dùng, không kiểm mật khẩu.
  Ranh giới quyền trong CRM là thật và có kiểm tra, nhưng nó chạy phía trình duyệt
  nên chỉ chặn được thao tác nhầm, không chặn được người cố ý.
- **Không tự đẩy.** Portal không bị đánh thức khi CRM ghi. Người vận hành mở
  intranet và xử lý bản tin.
- **Không có chiều ngược.** Portal thu hồi kỳ hay đổi tỷ lệ thì CRM không biết.

Muốn lên thật thì cả ba khoá `localStorage` phải thành bảng trong Postgres, và
`partyKey` phải lấy từ phiên đăng nhập trên máy chủ — đúng cảnh báo mà
`portal/test/api-guard.js` đã ghi sẵn cho phía portal.

## Bước tiếp theo nếu muốn nối chặt hơn

Viết `portal/screens/crm-handoff.js` theo `screens/_CONTRACT.md`: đọc
`haustek.crm.handoff.v1`, liệt kê deal đã gắn mà chưa ghi sổ, cho admin chọn kỳ
hiệu lực rồi gọi thẳng `A.rates.add()` và `A.advances.set()`. Lúc đó vòng bàn giao
khép kín trong portal, CRM không phải đổi gì.
