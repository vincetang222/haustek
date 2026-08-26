# Giao kèo module màn hình intranet

Mỗi màn hình là MỘT file `screens/<id>.js`, nạp bằng thẻ `<script>` thường
(không phải module ES). File tự đăng ký:

```js
HAUSTEK.registerScreen({
  id: "overview",              // trùng tên file, dùng làm #hash
  nav: "Tổng quan",            // nhãn ngắn ở cột điều hướng
  group: "Vận hành",           // tiêu đề nhóm trong cột điều hướng
  title: "Tổng quan vận hành", // tiêu đề trang
  subtitle: "…",               // HTML ngắn dưới tiêu đề (được phép có <b>)
  badge(ctx){ return "3"; },   // tuỳ chọn — con số đỏ cạnh mục điều hướng, trả "" nếu không có
  render(root, ctx){ … }       // BẮT BUỘC — vẽ vào root (một div rỗng)
});
```

## `ctx` có gì

| Trường | Nghĩa |
|---|---|
| `ctx.pIdx` · `ctx.period` · `ctx.periodKey` | kỳ đang chọn ở thanh trên (0..11) |
| `ctx.periods` | mảng 12 kỳ `{k,idx,label,year,month,quarter}` |
| `ctx.cur` | `"USD"` hoặc `"VND"` |
| `ctx.money(v)` · `ctx.money2(v)` | định dạng tiền theo tiền tệ đang chọn (money2 có 2 số lẻ) |
| `ctx.admin` | toàn bộ mặt tiền admin — xem bên dưới |
| `ctx.fmt` `ctx.esc` `ctx.H` | định dạng · thoát HTML · namespace HAUSTEK |
| `ctx.setPeriod(i)` | đổi kỳ rồi vẽ lại |
| `ctx.go(id)` | nhảy sang màn hình khác |
| `ctx.refresh()` | vẽ lại màn hình hiện tại (gọi sau khi đổi trạng thái) |
| `ctx.toast(msg, kind)` | `kind`: `"ok"` · `"no"` · bỏ trống |
| `ctx.modal({title,hint,body,ok,cancel,danger,onMount})` | Promise → object các `[data-field]`, hoặc `null` nếu huỷ |
| `ctx.confirm(title, hint, okLabel, danger)` | Promise → boolean |

## `ctx.admin` (viết tắt `A`)

Hằng số và danh mục:
`A.cfg` `A.distributor` `A.periods` `A.feeds` `A.pubFeed` `A.stores` `A.storeW`
`A.storeFeed` `A.storeTopCount` `A.territories` `A.territoryW` `A.pubSources`
`A.pubSourceW` `A.labels` `A.artists` `A.counts` `A.questions` `A.samplesNeeded`

Tra cứu bản ghi: `A.track(i)` (đầy đủ) · `A.titleOf(i)` `A.isrcOf(i)` `A.typeOf(i)`
`A.artistOf(i)` `A.labelOf(i)` `A.streamsOf(i,p)` · `A.trackCount` (50.000)
Chỉ mục: `A.idxOf(A.byArtist, artistId)` · `A.idxOf(A.byLabel, labelId)` · `A.idxOf(A.byWriter, artistId)`

Tiền: `A.grossRec(i,p)` `A.grossPub(i,p)` `A.grossRecByFeed(i,p,f)` `A.grossOf(i,p,stream)`
`A.splitRec(i,gross,periodKey)` → `{gross,fee,net,labelCut,producer,artist,rate}`
`A.mineOf(i,p,role,partyId,stream)` · `A.splitDim(i,total,weights)` → Float64Array
`A.agg(role,partyId,pIdx,stream)` → `{total,gross,fee,labelCut,producer,artist,streams,tracks}`
(role `"admin"` bỏ qua partyId)

Luồng & kỳ: `A.feedLoaded(p,f)` `A.loadedFeedIds(p)` `A.missingFeeds(p)` `A.pubLoaded(p)`
`A.recon(p)` → `{rows:[{feed,status,at,file,attributed,adjustments,fromFile,pending,control,diff,accepted}],…}`
`fromFile` = phần đến từ chính file kỳ này · `adjustments` = khoản truy thu của kỳ khác ghi vào đây.
So với file gốc thì dùng `fromFile`, đừng dùng `attributed` (nó đã cộng cả truy thu vào).
`A.approvalChecks(p)` → `[{id,ok,label,detail}]` · `A.canApprove(p)`
`A.approve(p,by,note,force)` · `A.revoke(p,why)` · `A.isApproved(periodKey)`
Kỳ phải đóng theo thứ tự: không duyệt được kỳ sau khi kỳ trước còn mở, không thu hồi được kỳ trước khi kỳ sau đã duyệt.
`A.approvalOf(periodKey)` · `A.payoutOf(periodKey)` → `[{partyKey,kind,earned,carryIn,recoup,payable,carryOut,advanceLeft}]`
Dòng cuối có thể là `{partyKey:"P:*", kind:"producer", held:true}` — điểm producer chưa gắn được danh tính.
`A.previewPayout(p)` → cùng hình dạng, nhưng **không ghi gì vào sổ**. Màn hình chỉ được dùng cái này;
bản ghi thật chỉ chạy đúng một lần, lúc `approve()`.
`A.earnedByParty(p)` → `Map(partyKey → số tiền)` — **quét cả 50.000 bản ghi, gọi đúng một lần mỗi lần vẽ**.
`A.pIndexOf(periodKey)` → chỉ số kỳ (0..11), `-1` nếu không có.

Nạp: `A.ingest.steps` (8 bước) · `A.ingest.load(p,f,{file,replace})` · `A.ingest.unload(p,f)`
`A.ingest.loadPub(p,{file,force})` · `A.ingest.unloadPub(p)` · `A.ingest.acceptVariance(p,f,note)`
Tác quyền chốt theo quý: `loadPub` ném lỗi nếu kỳ không phải cuối quý, trừ khi `force`.

Hàng chờ khớp ISRC: `A.queue.list({periodKey,status,feedId})` · `A.queue.pendingTotal(periodKey?)`
`A.queue.suggest(qid)` → `[{i,score,why}]` · `A.queue.resolve(qid,trackIdx)` · `A.queue.park(qid,note)` · `A.queue.unpark(qid)`
`A.queue.landingPeriod(qid)` → `{k,label,adjustment}` — kỳ mà tiền sẽ RƠI VÀO nếu khớp bây giờ.
Dòng của kỳ đã duyệt vẫn khớp được: tiền ghi thành **khoản truy thu ở kỳ đang mở** (`adjustment:true`),
kỳ cũ giữ nguyên. Dòng đã khớp mang thêm `intoPeriod`. Mọi phép kiểm quyền trên dòng đã khớp phải dùng
`q.intoPeriod || q.periodKey`, **không dùng `q.periodKey`** — kỳ gốc đã chốt không có nghĩa là tiền nằm ở đó.
Dòng hàng chờ: `{id,periodKey,feedId,isrc,title,artist,store,territory,streams,amount,reason,status,resolvedTo,at}`
`status` ∈ `pending` · `matched` · `parked`

Tỷ lệ: `A.rates.scheduleFor(partyKey)` → `[{partyKey,rate,from,by,at,note}]`
`A.rates.rateFor(partyKey,periodKey)` · `A.rates.add(partyKey,rate,fromPeriodKey,by,note)` · `A.rates.remove(partyKey,from)`
`partyKey` là `"L:<labelId>"` hoặc `"A:<artistId>"` · `A.partyName(key)` `A.partyClientId(key)` `A.partyKeyOfTrack(i)`

Tạm ứng: `A.advances.list()` → `[{partyKey,name,clientId,kind,opening,note,recouped,balance}]`
`A.advances.set(partyKey,opening,note)` · `A.advances.remove(partyKey)` · `A.advances.total()` · `A.advanceBalance(partyKey)`

Tỷ giá: `A.fx.get()` → `{rate,at,policy,locked}` · `A.fx.set(rate,at,policy)` · `A.fx.lock(pIdx,rate)` · `A.fx.rateFor(periodKey)`

Tài khoản: `A.accounts.list()` → `[{id,email,role,partyKey,status,createdAt,lastSeen,mfa}]`
`A.accounts.add(email,role,partyKey)` · `A.accounts.setStatus(id,status)` · `A.accounts.remove(id)`

Nhật ký: `A.audit.list(limit)` → `[{at,action,detail,by}]` · `A.audit.log(action,detail)`

Câu hỏi treo: `A.answers.get(id)` `A.answers.set(id,text)` `A.answers.all()`

Trạng thái thô: `A.state()` (đọc thôi, đừng sửa trực tiếp — dùng các hàm ở trên để có nhật ký và tự lưu)

## Tiện ích dùng chung

`HAUSTEK.vtable({body,spacer,head,rows,cols,rowHTML,rowHeight,sortKey,sortDir,isSelected})`
→ `{refresh(rows,cols),paint,rowAt(r)}` — bảng ảo hoá, chỉ vẽ ~30 dòng nhìn thấy.
`cols` = `[{k,lab,w,num}]`, `w` là giá trị grid-template-columns (vd `"minmax(180px,2fr)"`).
`rowHTML(row, index)` trả chuỗi các `<div>`, đúng số cột.
Markup cần: `<div class="vt"><div class="vt-head" id="…"></div><div class="vt-body" id="…"><div class="vt-spacer" id="…"></div></div></div>`

`HAUSTEK.barChart(canvasEl, points, {current, height})` — `points` = `[{label,value,open}]`, ba trạng thái:
`value == null` → vạch cụt sát đáy (chưa có số nào) · `open:false` → **cột viền đứt cao đúng giá trị thật**
(có số nhưng chưa chốt) · còn lại → cột đặc (đã chốt). Đừng mô tả cột viền đứt là "vạch xám sát đáy".

`A.store.save()` — hầu hết hàm tự lưu, nhưng nếu bạn đổi một trường trạng thái không đi qua hàm nào
thì phải tự gọi. Tốt nhất là đừng làm vậy.

## Luật bắt buộc

1. **Mọi chuỗi từ dữ liệu phải qua `esc()`** trước khi ghép vào HTML.
   Tên thật trong danh mục: `nae & de'lay`, `ling:chi`, `HƯƠNGMYBÔNG`, `Thiện Hí` — phải hiện đúng.
2. **Không lặp 50.000 bản ghi nhiều lần trong một lần vẽ.** Một vòng là đủ; dùng `A.agg()` khi có thể.
   Vẽ bảng dài phải dùng `vtable`.
3. **Không sửa `A.state()` trực tiếp.** Mọi thay đổi đi qua hàm — để có nhật ký và tự lưu.
4. Đổi trạng thái xong thì gọi `ctx.refresh()`; lỗi thì bắt và `ctx.toast(e.message,"no")`.
5. Chỉ dùng class có sẵn trong `haustek-ui.css`. Thiếu thì thêm `<style>` ngắn trong chính module,
   đặt tên class có tiền tố id màn hình (vd `.ov-…`).
6. Không gọi `HAUSTEK.api.*` ở intranet — đó là tầng của cổng khách.
7. Không thư viện ngoài. Không `innerHTML` với dữ liệu chưa esc. Không `eval`.
8. Tiếng Việt tự nhiên, không dịch sát từ tiếng Anh. Chú thích trong code viết cho người đọc sau
   hiểu **vì sao** làm vậy, không kể lại điều code đã nói.
