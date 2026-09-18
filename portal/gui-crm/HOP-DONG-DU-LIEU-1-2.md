# Hợp đồng dữ liệu CRM ↔ Portal · bản 1.2

Thay cho `HOP-DONG-DU-LIEU-1-1.md`. Hai thay đổi lớn: gói vào **cắt xuống mức tối thiểu**, gói ra **báo cả deal chưa trình và deal đã bỏ**.

## Vì sao cắt

Chủ sản phẩm chốt: *"chúng ta không clone crm, chỉ sync thông tin giá trị của họ vào bên mình để theo quy trình xét duyệt."*

Phép thử một dòng, áp cho từng trường: **trường này có đổi được một quyết định nào không?** Ba quyết định Portal thật sự đưa ra là (1) nhận gói hay từ chối, (2) đây có phải bên đúng không và có trình không, (3) báo gì về CRM. Trường không đổi được quyết định nào thì cắt, và cắt ở **hợp đồng dữ liệu**, không phải giấu ở giao diện.

## Gói vào · CRM → Portal

```jsonc
{
  "v": "1.0.0",                    // Portal chặn theo số major
  "source": "haustek-crm",         // hàng rào chống dán gói hệ khác
  "at": "2026-09-18T03:00:00Z",    // MỚI DÙNG: gói cũ hơn gói đã nhận thì Portal từ chối
  "total": 13,                     // MỚI DÙNG: khác deals.length thì Portal từ chối, bắt gói bị cắt cụt
  "deals": [
    {
      "dealId": "DEAL-8821",       // khoá nối duy nhất, BẮT BUỘC, phải là chuỗi
      "dealName": "Nightform 2026",// tên người Portal đọc; là chữ CRM duy nhất ra tới ghi chú đề xuất
      "account": "Nightform Records",   // tên hiện khi chưa gắn đối tác
      "accountType": "label",      // "label" hoặc "artist". KHÔNG khai thì Portal để trống, không tự đoán
      "owner": "Nguyễn Văn A",     // viên lọc "Của tôi" ở trang Thương vụ
      "amountUSD": 12400,          // CHỈ ĐỂ HIỆN. Không chạm một sổ nào bên Portal
      "portalPartyKey": "L:38",    // CRM đề nghị gắn vào bên nào. Portal quyết lại rồi trả về
      "rights": { "dist": true, "pub": false, "yt": true },
      "terms": {
        "artistSharePct": 70,      // PHẦN TRĂM, không phải phân số. Khoảng 50–97
        "termMonths": 24,
        "exclusivityMonths": 24,
        "totalAdvanceUSD": 16100,  // hoặc để trống và khai hai ô dưới
        "initialAdvanceUSD": 14000,
        "marketingFundUSD": 2100,  // CỘNG vào khoản tạm ứng, không phải khoản riêng
        "findersFeePct": 2         // đi vào ghi chú đề xuất
      }
    }
  ]
}
```

### Tám trường đã cắt · đừng gửi nữa

| Trường | Vì sao cắt |
|---|---|
| `bound` (phong bì) | không việc nào đọc, không cả lọt vào bản ghi |
| `country` | không đổi được câu "đây có phải bên đúng không" |
| `closeDate` | Portal ghi vào bản ghi rồi không dòng nào đọc. Kỳ áp hợp đồng chọn bằng **kỳ mở tiếp theo**, nên ngày này không chạm một mốc tiền nào |
| `rightsHolder` | không hàm nào đọc |
| `monthsToRecoup` | Portal tự tính từ thu nhập ròng thật của bên ấy |
| `neverRecoups` | không hàm nào đọc |
| `passThrough` | không có sổ nào ở Portal nhận khoản này |
| `rev` (đề nghị 1.1) | việc chống gói tới trễ đã chuyển lên phong bì bằng `at`, rẻ hơn |

Gửi thừa **không làm hỏng gói**: khoá lạ mang chuỗi hoặc `true`/`false` thì Portal cho qua. Nhưng khoá lạ **mang số** thì Portal chặn ở cửa trình, xem dưới.

### Hai trường tiền Portal vẫn chặn, cố ý

`flowThroughPct` và `labelArtistRatePct` giữ trong hợp đồng và **giữ nguyên chặn**. Câu từ chối nguyên văn:

> Thương vụ mang điều khoản tiền mà bước này chưa nối chân: flowThroughPct 30% · labelArtistRatePct 70%

Cắt chúng khỏi gói là mở cho deal đi qua trong khi Portal thu hồi tạm ứng vét 100% phần đối tác: A&R đã hứa đối tác giữ lại 30% mà đối tác nhận 0 đồng, và không ai biết. Chặn thì vỡ trước mặt người trình. **Deal label có flow-through khác 0 không trình được**, và đó là giá đúng.

### Cửa mới: khoá lạ mang số cũng bị chặn

Chốt chặn cũ đọc theo đuôi tên (`USD`, `Pct`). Đo được: gói mang `passThrough: 30`, không đuôi `Pct`, **trình qua**. Một lần gõ sai đuôi là hàng rào biến mất. Giờ:

- khoá lạ **mang số dương** → chặn, câu từ chối ghi `"<tên khoá> <số> (khoá lạ mang số)"`
- khoá lạ mang **chuỗi** hoặc **boolean** → cho qua, để CRM còn thêm được nhãn mà không chặn cả deal

## Gói ra · Portal → CRM · bản 1.2.0

Khoá `localStorage`: `haustek.portal.contracts.v1`

```jsonc
{
  "v": "1.2.0",
  "source": "haustek-portal",
  "at": "2026-09-18T04:00:00Z",
  "total": 13,
  "deals": [
    {
      "dealId": "DEAL-8821",
      "trangThai": "daTrinh",          // MỚI · "moi" | "daTrinh" | "daBo"
      "portalPartyKey": "L:38",        // bên Portal ĐÃ QUYẾT, có thể khác bên CRM đề nghị
      "giaiDoan": "legal",             // portal | legal | negotiation
      "chiTiet": "Hợp đồng đã duyệt · tạm ứng bị trả lại, chờ dựng lại đề xuất",
      "updatedAt": "2026-09-18T04:00:00Z",
      "deXuat": [
        { "id": "DX-2609-004", "loai": "hopDong", "trangThai": "approved" },
        { "id": "DX-2609-005", "loai": "tamUng",  "trangThai": "rejected" }
      ]
    },
    {
      "dealId": "DEAL-8822",
      "trangThai": "moi",              // MỚI Ở BẢN 1.2
      "portalPartyKey": null,
      "giaiDoan": "portal",
      "chiTiet": "Đã nhận, chưa gắn đối tác",
      "updatedAt": "2026-09-18T04:00:00Z",
      "deXuat": []
    },
    {
      "dealId": "DEAL-8823",
      "trangThai": "daBo",             // MỚI Ở BẢN 1.2
      "lyDo": "Đối tác đổi ý",
      "portalPartyKey": null,
      "giaiDoan": "negotiation",
      "chiTiet": "Portal đã bỏ thương vụ · Đối tác đổi ý",
      "updatedAt": "2026-09-18T04:00:00Z",
      "deXuat": []
    }
  ]
}
```

**Vì sao mở rộng.** Bản 1.1 chỉ mang deal đã trình. Nghĩa là 13 deal các bạn gửi sang, trình xong mà chưa ai quyết, thì bên các bạn không đọc được dòng nào — im lặng ở đúng khoảng thời gian A&R cần biết nhất. Và một deal Portal đã bỏ thì biến mất hẳn. Một deal chết mà nằm im không ai đếm thì tệ hơn một deal chết có tên.

**Khoá `by` đã bỏ**: nó gõ cứng chuỗi `"portal"`, một hằng số không mang tin nào.

**Gói ra vẫn không mang một con số tiền nào.** Có bài kiểm ép điều đó.

## Ba việc phía CRM

1. **Ngừng gửi tám trường đã cắt.** Không gấp: gửi thừa không làm hỏng gói, trừ khi trường ấy mang số.
2. **Khai `at` và `total` cho đúng.** Portal giờ dùng cả hai để từ chối gói tới trễ và gói bị cắt cụt.
3. **Đọc thêm `trangThai` và `lyDo` ở gói ra.** Ba trạng thái, không phải một.

## Một thay đổi hành vi cần biết

Trước đây Portal đóng băng **mọi trường** sau khi thương vụ đã trình. Hệ quả đo được: đổi một nhãn không phải điều khoản cũng sinh một dòng "chênh lệch" có cột trước trùng khít cột sau — một xung đột không xảy ra, đặt trước mặt giám đốc.

Giờ **chỉ `terms` đóng băng**. Tên deal, tên tài khoản, loại bên, người phụ trách và `amountUSD` làm mới bình thường kể cả trên thương vụ đã chốt, vì chúng không đổi được quyết định đã lên bàn. Gửi lại deal với điều khoản mới thì vẫn ghi một dòng chênh lệch như cũ.
