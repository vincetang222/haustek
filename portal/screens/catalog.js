"use strict";
/* =====================================================================
   DANH MỤC BẢN GHI — 50.000 dòng, và hai cột không được rời khỏi đây
   ---------------------------------------------------------------------
   Màn hình này làm hai việc rất khác nhau, cố ý gộp vào một chỗ:

     1. Tra cứu danh mục ở quy mô thật. 50.000 bản ghi không bao giờ được
        dựng thành 50.000 thẻ HTML — lọc và sắp xếp chạy một vòng qua
        mảng số, chỉ chừng 30 dòng đang nhìn thấy mới thành DOM.

     2. Là nơi DUY NHẤT trong toàn hệ thống hiện tên đơn vị phân phối và
        tỷ lệ gốc trong hợp đồng (mục 2.7: bí mật kinh doanh). Cổng khách
        không có đường nào chạm tới hai thứ này — tầng API còn ném lỗi nếu
        thấy chúng lọt vào payload. Nên chúng nằm trong một khối riêng, có
        nhãn riêng, để người mở màn hình này trước mặt khách biết đường mà
        đóng lại.

   Panel cuối trang giữ nguyên văn 18 cột của file master data khách gửi.
   Nó ở đây chứ không nằm trong tài liệu rời vì mỗi lần nhìn danh mục là
   một lần nhớ ra danh mục hiện tại còn thiếu gì.
   ===================================================================== */
(function () {

const CSS = `
.ct-bar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:11px}
.ct-bar select{min-width:148px}
.ct-chk{display:flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;
  font-family:var(--mono);font-size:10.5px;color:var(--ink2)}
.ct-chk input{accent-color:var(--red);width:14px;height:14px;cursor:pointer}
.ct-count{margin-left:auto;text-align:right;font-family:var(--mono);font-size:10px;
  color:var(--muted);line-height:1.75}
.ct-count b{color:var(--ink);font-weight:600;font-size:11.5px}
.ct-foot{margin-top:9px}
.ct-sub{display:block;font-family:var(--mono);font-size:9.5px;color:var(--muted);
  margin-top:2px;line-height:1.55;font-weight:400}
.ct-secret{border:1px solid var(--red);background:var(--red-soft);border-radius:9px;padding:12px 13px}
.ct-secret .lab{font-family:var(--mono);font-size:9px;letter-spacing:.09em;text-transform:uppercase;
  color:var(--red);font-weight:600;line-height:1.6;margin-bottom:9px}
.ct-secret table{width:100%;border-collapse:collapse}
.ct-secret td{padding:6px 0;font-size:12px;border-bottom:1px solid #F3C3CC;vertical-align:top}
.ct-secret tr:last-child td{border-bottom:0}
.ct-secret td:last-child{text-align:right;font-family:var(--mono);font-variant-numeric:tabular-nums}
.ct-secret .ct-sub{color:#9C5A67}
.ct-stack{margin-top:15px}
.ct-cols{display:grid;gap:9px;grid-template-columns:1fr}
@media(min-width:1120px){.ct-cols{grid-template-columns:1fr 1fr}}
.ct-grp{border:1px solid var(--hair);border-radius:9px;padding:11px 12px;background:#FAFAFC}
.ct-grp h4{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);margin-bottom:8px}
.ct-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px}
.ct-raw{font-family:var(--mono);font-size:10.5px;line-height:2.15;color:var(--ink2);
  word-break:break-word;margin-bottom:13px}
.ct-obs{display:flex;gap:9px;align-items:flex-start;padding:9px 11px;border-radius:8px;
  background:#FAFAFC;border:1px solid var(--hair);margin-bottom:6px}
.ct-obs i{font-style:normal;flex:none;font-family:var(--mono);font-size:11px;color:var(--red)}
.ct-obs b{display:block;font-size:12.5px;font-weight:500}
.ct-obs span{display:block;font-family:var(--mono);font-size:10px;color:var(--muted);
  margin-top:2px;line-height:1.75}
.ct-empty{padding:26px;text-align:center;color:var(--muted);font-size:12.5px}
`;

/* Bỏ dấu để gõ "huong" vẫn ra "HƯƠNGMYBÔNG". Người Việt gõ không dấu là
   chuyện thường; bắt gõ đúng dấu mới tìm được là tự làm khó mình. */
function fold(s) {
  return String(s == null ? "" : s).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

/* Hai bảng tra dựng MỘT LẦN rồi giữ lại. Danh mục sinh cố định theo hạt
   giống nên không bao giờ lệch, và nhờ vậy mỗi lần gõ phím chỉ còn một
   phép indexOf trên chuỗi đã chuẩn hoá — thay vì 50.000 lần toLowerCase.
   Bảng UPC phải đi qua A.track() (không có hàm tra riêng cho UPC) nên chỉ
   dựng khi có người thật sự tìm bằng dãy số, và cũng chỉ một lần. */
let _hay = null, _upc = null;
function hayIndex(A) {
  if (_hay) return _hay;
  const n = A.trackCount;
  _hay = new Array(n);
  for (let i = 0; i < n; i++) _hay[i] = fold(A.titleOf(i) + " " + A.artistOf(i).name + " " + A.isrcOf(i));
  return _hay;
}
function upcIndex(A) {
  if (_upc) return _upc;
  const n = A.trackCount;
  _upc = new Array(n);
  for (let i = 0; i < n; i++) _upc[i] = A.track(i).upc;
  return _upc;
}

/* Bộ lọc và thứ tự sắp xếp sống ngoài hàm render: đây là việc của người
   đang nhìn bảng, không phải quyết định vận hành cần ghi nhật ký. Nằm
   ngoài render thì đổi kỳ hay đổi tiền tệ xong vẫn quay về đúng chỗ đang
   xem, không nhảy về đầu danh mục. */
const flt = { q: "", own: "", type: "", rev: false };
let sortKey = "gross", sortDir = -1;
let sel = -1;

const COLS = [
  { k: "title",   lab: "Bản ghi",             w: "minmax(200px,2.4fr)" },
  { k: "artist",  lab: "Nghệ sĩ",             w: "minmax(120px,1.3fr)" },
  { k: "own",     lab: "Thuộc về",            w: "minmax(112px,1fr)" },
  { k: "streams", lab: "Lượt nghe kỳ này",    w: "104px", num: 1 },
  { k: "gross",   lab: "Doanh thu gộp",       w: "122px", num: 1 },
  { k: "fee",     lab: "Phí Haustek",         w: "112px", num: 1 },
  { k: "net",     lab: "Về tay nghệ sĩ",      w: "126px", num: 1 }
];
const TEXT_COL = { title: 1, artist: 1, own: 1 };

/* 18 cột nguyên văn trong file master data khách gửi, giữ đúng thứ tự.
   Nhận xét gom theo NHÓM chứ không theo từng cột: cái đáng bàn không phải
   một cột đứng riêng, mà là chỗ mấy cột cùng nói về một thứ. */
const RAW_COLS = ["No.", "ISRC", "ISRC (Optional 1)", "UPC", "Track Name", "Album/Single/EP",
  "Artist", "Producer", "Songwriter/Ins", "Version", "Release Date", "Year Distribution",
  "Status", "Distribution", "Store", "Rate Share", "Client ID", "Artist/Label Names/Channel Name"];

const GROUPS = [
  { h: "Khoá và mã", cols: ["No.", "ISRC", "ISRC (Optional 1)", "UPC"],
    n: "<b>No.</b> là số thứ tự trong file, đổi mỗi lần xuất lại — không làm khoá được. Khoá thật là <b>ISRC</b>. "
     + "Tên cột <b>Optional 1</b> hàm ý còn Optional 2: bài phát hành lại hoặc đổi nhà phân phối mang nhiều mã, "
     + "nên đây phải là bảng mã phụ (mỗi bài 0..n mã), không phải một cột đứng cạnh. "
     + "<b>UPC</b> là mã của bản phát hành chứ không phải của bài — một UPC gánh nhiều ISRC, đừng dùng thay ISRC." },
  { h: "Mô tả bản phát hành", cols: ["Track Name", "Album/Single/EP", "Version", "Release Date", "Year Distribution", "Status"],
    n: "<b>Version</b> (Remix · Acoustic · sped up) chính là chỗ hàng chờ khớp ISRC hay vấp: file doanh thu ghi tên bài "
     + "kèm hậu tố, danh mục để riêng một cột, và hai bên không tự khớp được. "
     + "<b>Release Date</b> và <b>Year Distribution</b> là hai mốc khác nhau — phải chốt mốc nào dùng để xếp bài vào kỳ. "
     + "<b>Status</b> chưa biết tập giá trị: gỡ khỏi kho, tạm ẩn, hay mới là nháp?" },
  { h: "Người trên bản ghi", cols: ["Artist", "Producer", "Songwriter/Ins"],
    n: "Cả ba đều là TÊN CHỮ, không có mã. Không mã thì không phân quyền được, cũng không trả tiền được: "
     + "điểm producer đang phải nằm lại một dòng riêng trong bảng chi trả vì không biết trả cho ai. "
     + "<b>Songwriter/Ins</b> gộp nhiều người vào một ô và không có phần trăm, trong khi tác quyền chia theo phần sáng tác." },
  { h: "Phân phối và tỷ lệ", cols: ["Distribution", "Store", "Rate Share"],
    n: "Hai cột <b>Distribution</b> và <b>Rate Share</b> đã bị xoá khỏi file bàn giao — đúng, đó là bí mật kinh doanh, "
     + "nhưng cũng có nghĩa chưa ai thấy định dạng giá trị thật của chúng. "
     + "<b>Store</b> nằm ngay trên dòng danh mục nghĩa là một bài × một cửa hàng thành một dòng: danh mục phình theo "
     + "hơn 200 cửa hàng trong khi bài vẫn chỉ là một. Cửa hàng thuộc về doanh thu, không thuộc về danh mục." },
  { h: "Danh tính bên nhận", cols: ["Client ID", "Artist/Label Names/Channel Name"],
    n: "Cùng với <b>Artist</b> ở trên, đây là BA trường mang danh tính mà chưa rõ trường nào đóng vai gì. "
     + "<b>Artist</b>: tên nghệ sĩ đứng trên bản ghi. <b>Client ID</b>: mã bên nhận tiền — thứ duy nhất phân quyền bám vào được. "
     + "<b>Artist/Label Names/Channel Name</b>: một ô gộp ba loại tên khác hẳn nhau (nghệ sĩ · label · kênh YouTube), mỗi loại một vai. "
     + "Chưa tách được ba vai này thì chưa trả lời được câu hỏi ai đăng nhập thì thấy dòng nào." }
];

const OBS = [
  { t: "Không cột nào chứa tiền hay lượt nghe",
    d: "Đây là danh mục thuần: nó nói bài nào tồn tại, không nói bài đó kiếm được bao nhiêu. Mọi con số trong bảng phía trên đến từ file doanh thu, không đến từ file này." },
  { t: "Không có kỳ báo cáo",
    d: "Mỗi lần xuất là một ảnh chụp hiện tại. Không có kỳ thì không so được kỳ này với kỳ trước, không chốt sổ được, và sửa một dòng hôm nay là làm đổi luôn số của kỳ đã chi tiền." },
  { t: "Phải có một bảng doanh thu riêng",
    d: "bản ghi × kỳ × luồng × cửa hàng × lãnh thổ, nối vào danh mục bằng ISRC. Bản mẫu này đang chạy đúng theo hình đó — vì vậy mới tách được ba luồng và biết kỳ nào còn thiếu luồng nào." },
  { t: "Ba trường danh tính phải làm rõ vai trò trước khi viết schema",
    d: "Artist · Client ID · Artist/Label Names/Channel Name. Đoán sai chỗ này thì phân quyền sai, và phân quyền sai nghĩa là người này nhìn thấy tiền của người kia." }
];

HAUSTEK.registerScreen({
  id: "catalog",
  nav: "Danh mục",
  group: "Dữ liệu",
  title: "Danh mục bản ghi",
  subtitle: "50.000 bản ghi, tra được bằng tên bài · nghệ sĩ · ISRC · UPC. Đây cũng là trang <b>duy nhất</b> "
          + "hiện hai cột bí mật kinh doanh — <b>tên đơn vị phân phối</b> và <b>tỷ lệ gốc trong hợp đồng</b>. "
          + "Mở một dòng ra thì thấy; cổng khách thì không bao giờ.",

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
    const pi = ctx.pIdx, pk = ctx.periodKey, per = ctx.period;
    const N = A.trackCount;
    const coll = new Intl.Collator("vi");
    const miss = A.missingFeeds(pi);
    const stat = { all: 0, hit: 0, streams: 0 };

    /* ---------- MỘT vòng qua 50.000: lọc, tính tiền, gom tổng ----------
       Không gọi A.track() trong này — nó dựng một object mới cho mỗi bản
       ghi. Các hàm titleOf / isrcOf / typeOf / artistOf / labelOf chỉ đọc
       thẳng mảng có sẵn. Tổng doanh thu cả kỳ cũng cộng luôn ở đây, để
       câu "phần đang lọc chiếm bao nhiêu %" không phải quét thêm lần nữa. */
    function build() {
      const q = fold(flt.q.trim());
      const hay = q ? hayIndex(A) : null;
      /* UPC toàn chữ số — truy vấn có ký tự khác thì chắc chắn không phải UPC */
      const upc = (q && /^[0-9]{3,}$/.test(q)) ? upcIndex(A) : null;
      const rows = [];
      let allG = 0, hitG = 0, hitS = 0;
      for (let i = 0; i < N; i++) {
        const g = A.grossRec(i, pi);
        allG += g;
        if (flt.rev && !(g > 0)) continue;
        if (flt.type && A.typeOf(i) !== flt.type) continue;
        const lb = A.labelOf(i);
        if (flt.own === "label" && !lb) continue;
        if (flt.own === "indie" && lb) continue;
        if (q && hay[i].indexOf(q) < 0 && !(upc && upc[i].indexOf(q) >= 0)) continue;
        const s = g > 0 ? A.splitRec(i, g, pk) : null;
        const st = A.streamsOf(i, pi);
        hitG += g; hitS += st;
        rows.push({ i, title: A.titleOf(i), isrc: A.isrcOf(i), type: A.typeOf(i),
          artist: A.artistOf(i).name, own: lb ? lb.name : "Độc lập", indie: !lb,
          streams: st, gross: g, fee: s ? s.fee : 0, net: s ? s.artist : 0 });
      }
      stat.all = allG; stat.hit = hitG; stat.streams = hitS;
      const k = sortKey, d = sortDir;
      rows.sort((a, b) => {
        const x = a[k], y = b[k];
        return (typeof x === "string" ? coll.compare(x, y) : (x - y)) * d;
      });
      return rows;
    }

    /* ---------- thanh công cụ ---------- */
    const opt = (v, lab, cur) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(lab)}</option>`;
    const barHTML = `
      <div class="ct-bar">
        <input type="search" class="search" data-ct="q" value="${esc(flt.q)}"
               placeholder="Tìm tên bài · nghệ sĩ · ISRC · UPC" aria-label="Tìm trong danh mục">
        <select data-ct="own" aria-label="Thuộc về">
          ${opt("", "Thuộc về: tất cả", flt.own)}${opt("label", "Có label", flt.own)}${opt("indie", "Độc lập", flt.own)}
        </select>
        <select data-ct="type" aria-label="Loại bản phát hành">
          ${opt("", "Loại: tất cả", flt.type)}${opt("Single", "Single", flt.type)}${opt("EP", "EP", flt.type)}${opt("Album", "Album", flt.type)}
        </select>
        <label class="ct-chk"><input type="checkbox" data-ct="rev"${flt.rev ? " checked" : ""}>
          Chỉ bản ghi có doanh thu kỳ ${esc(per.label)}</label>
        <div class="ct-count" data-ct="count"></div>
      </div>`;

    /* ---------- panel cấu trúc file master data ---------- */
    function masterHTML() {
      const open = A.questions.filter(q => !String(A.answers.get(q.id) || "").trim()).length;
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Cấu trúc file master data hiện tại</h3>
            <div class="hint">${RAW_COLS.length} cột, nguyên văn và đúng thứ tự trong file khách gửi.
              Nhận xét bên dưới gom theo nhóm — vấn đề không nằm ở từng cột, mà ở chỗ mấy cột cùng nói về một thứ.</div>
          </div>
        </div>
        <div class="ct-raw">${RAW_COLS.map(c => `<code>${esc(c)}</code>`).join(" · ")}</div>
        <div class="ct-cols">
          ${GROUPS.map(g => `<div class="ct-grp">
            <h4>${esc(g.h)}</h4>
            <div class="ct-chips">${g.cols.map(c => `<code>${esc(c)}</code>`).join("")}</div>
            <p class="note">${g.n}</p>
          </div>`).join("")}
        </div>
        <div class="ct-stack">
          ${OBS.map(o => `<div class="ct-obs"><i>▸</i><div><b>${esc(o.t)}</b><span>${esc(o.d)}</span></div></div>`).join("")}
        </div>
        <div class="btnrow ct-foot">
          <button class="btn sm" data-ct-go="questions">Sang câu hỏi treo</button>
          <span class="note">Sáu câu hỏi này chặn schema${open ? " · còn " + open + "/" + A.questions.length + " câu chưa trả lời" : " · đã trả lời hết"}.
            Cần thêm file mẫu master data 10–15 dòng để thấy ĐỊNH DẠNG GIÁ TRỊ thật, không phải tên cột.</span>
        </div>
      </div>`;
    }

    root.innerHTML = `<style>${CSS}</style>
      <div class="panel">
        ${barHTML}
        <div class="vt">
          <div class="vt-head" data-ct="head"></div>
          <div class="vt-body" data-ct="body"><div class="vt-spacer" data-ct="spacer"></div></div>
        </div>
        <div class="note ct-foot" data-ct="foot"></div>
      </div>
      <div data-ct="drill"></div>` + masterHTML();

    const $ = s => root.querySelector('[data-ct="' + s + '"]');
    const head = $("head"), body = $("body"), spacer = $("spacer");
    const countEl = $("count"), footEl = $("foot"), drillEl = $("drill");

    /* Chỉ chừng 30 dòng nhìn thấy đi qua đây mỗi lần vẽ, nên gọi A.track()
       ở đây là an toàn — UPC không có hàm tra riêng. */
    const rowHTML = r => {
      const upc = A.track(r.i).upc;
      const money = v => r.gross > 0 ? esc(ctx.money2(v)) : "—";
      return `<div class="tt"><b>${esc(r.title)}</b><span>${esc(r.isrc)} · ${esc(r.type)} · UPC ${esc(upc)}</span></div>`
        + `<div>${esc(r.artist)}</div>`
        + `<div><span class="chip ${r.indie ? "ind" : "lbl"}">${esc(r.own)}</span></div>`
        + `<div class="num">${r.streams > 0 ? esc(fmt.num(r.streams)) : "—"}</div>`
        + `<div class="num">${money(r.gross)}</div>`
        + `<div class="num">${money(r.fee)}</div>`
        + `<div class="num pay">${money(r.net)}</div>`;
    };

    const vtOpts = { body, spacer, head, rows: [], cols: COLS, rowHTML,
      sortKey, sortDir, isSelected: r => r.i === sel };
    let vt = null;
    try { vt = HAUSTEK.vtable(vtOpts); }
    catch (e) { ctx.toast(e.message, "no"); return; }

    function paint() {
      try {
        const rows = build();
        vtOpts.sortKey = sortKey; vtOpts.sortDir = sortDir;
        vt.refresh(rows);
        body.scrollTop = 0;
        const shareTxt = stat.all > 0
          ? "giữ " + fmt.pct(stat.hit / stat.all) + " doanh thu gộp kỳ " + per.label
          : "kỳ này chưa có đồng doanh thu nào";
        countEl.innerHTML = `<b>${esc(fmt.num(rows.length))}</b> / ${esc(fmt.num(N))} dòng khớp bộ lọc<br>`
          + `${esc(shareTxt)} · ${esc(fmt.num(stat.streams))} lượt nghe`;
        footEl.innerHTML = `Đang vẽ ~30 dòng nhìn thấy trong tổng số ${esc(fmt.num(rows.length))} dòng —
          phần còn lại nằm trong bộ nhớ dưới dạng số, không dựng ra HTML.
          Lọc và sắp xếp chạy MỘT vòng qua ${esc(fmt.num(N))} bản ghi rồi sort một lần.`
          + (miss.length
            ? `<br>Kỳ ${esc(per.label)} còn thiếu ${miss.map(f => esc(f.short)).join(" · ")} —
               ba cột tiền đang nhỏ hơn sự thật. Cột lượt nghe thì không cắt theo luồng, nên vẫn đủ:
               nhìn một bài nhiều lượt nghe mà ít tiền ở kỳ này là vì vậy.`
            : "");
        if (!rows.length) spacer.innerHTML = `<div class="ct-empty">Không có bản ghi nào khớp bộ lọc.</div>`;
      } catch (e) { ctx.toast(e.message, "no"); }
    }

    /* ---------- ngăn chi tiết ---------- */
    function dimTable(names, weights, total, keep) {
      const parts = A.splitDim(sel, total, weights);
      const list = [];
      for (let j = 0; j < names.length; j++) list.push({ n: names[j], v: parts[j] });
      list.sort((a, b) => b.v - a.v);
      const top = list.slice(0, keep);
      const share = total > 0 ? top.reduce((s, x) => s + x.v, 0) / total : 0;
      return {
        html: top.map(x => `<tr><td>${esc(x.n)}</td><td>${esc(ctx.money2(x.v))}</td></tr>`).join("")
              || `<tr><td colspan="2" class="dim">chưa có</td></tr>`,
        share, rest: list.length - top.length
      };
    }

    function drawDrill() {
      if (sel < 0) { drillEl.innerHTML = ""; return; }
      try {
        const t = A.track(sel);
        const g = A.grossRec(sel, pi);
        const s = A.splitRec(sel, g, pk);
        const prevG = pi > 0 ? A.grossRec(sel, pi - 1) : null;
        const relIdx = A.periods.findIndex(p => p.label === t.releasePeriod);
        const age = relIdx >= 0 ? pi - relIdx : null;

        /* Tỷ lệ chia: lấy đúng dòng ĐANG CÓ HIỆU LỰC trong kỳ đang xem, và
           nói luôn dòng kế tiếp nếu có — đổi tỷ lệ hôm nay không được làm
           đổi kỳ đã chốt, nên người đọc phải thấy mốc hiệu lực chứ không
           chỉ thấy con số. */
        const rate = A.rates.rateFor(t.partyKey, pk);
        const sched = A.rates.scheduleFor(t.partyKey);
        let inForce = null, next = null;
        sched.forEach(r => { if (r.from <= pk) inForce = r; else if (!next) next = r; });
        const perLabel = k => { const p = A.periods.find(x => x.k === k); return p ? p.label : k; };

        const st = g > 0 ? dimTable(A.stores, A.storeW, g, 8) : null;
        const tr = g > 0 ? dimTable(A.territories, A.territoryW, g, 8) : null;

        const row = (lab, val, sub) => `<tr><td>${lab}${sub ? `<span class="ct-sub">${sub}</span>` : ""}</td>
          <td>${val}</td></tr>`;
        const cut = t.labelId >= 0 ? "Label giữ" : "Haustek giữ thêm";
        const pctG = v => g > 0 ? fmt.pct(v / g) : "—";

        let trend = "kỳ sớm nhất, chưa có gì để so";
        if (prevG != null && prevG > 0 && g > 0) {
          const d = (g - prevG) / prevG;
          trend = `<span class="${d >= 0 ? "up" : "down"}">${d >= 0 ? "▲" : "▼"} ${esc(fmt.pct(Math.abs(d)))}</span> so kỳ ${esc(A.periods[pi - 1].label)}`;
        } else if (prevG === 0) trend = "kỳ trước chưa phát sinh";

        drillEl.innerHTML = `<div class="drill">
          <div class="drill-head">
            <div>
              <h3>${esc(t.title)}</h3>
              <div class="meta">${esc(t.isrc)} · ${esc(t.type)} · ${esc(t.artist)}
                ${t.label ? "· " + esc(t.label) : "· độc lập"}
                · ${esc(fmt.num(A.streamsOf(sel, pi)))} lượt nghe kỳ ${esc(per.label)}</div>
            </div>
            <button class="btn sm" data-ct-close="1">Đóng</button>
          </div>
          <div class="drill-cols">

            <div class="mini">
              <h4>Danh mục</h4>
              <table>
                ${row("ISRC", esc(t.isrc))}
                ${t.isrcAlt
                  ? row("ISRC phụ", esc(t.isrcAlt),
                        "Câu hỏi schema còn treo: cột tên là “ISRC (Optional 1)” — hàm ý còn Optional 2. Bản mẫu để mã phụ thành bảng riêng, mỗi bài 0..n mã.")
                  : row("ISRC phụ", "<span class=\"dim\">không có</span>",
                        "Chỉ ~6% bản ghi mang mã thứ hai, nhưng cấu trúc phải chịu được nhiều mã — xem câu hỏi treo.")}
                ${row("UPC", esc(t.upc), "mã của bản phát hành, không phải của bài")}
                ${row("Loại", esc(t.type))}
                ${row("Phát hành", esc(t.releasePeriod),
                      age == null ? "" : age >= 0 ? "đã chạy được " + (age + 1) + " kỳ tính cả kỳ này"
                                                  : "phát hành sau kỳ đang xem — kỳ này chưa có gì để tính")}
                ${row("Nghệ sĩ", esc(t.artist), esc(A.artists[t.artistId].clientId))}
                ${row("Label", t.label ? esc(t.label) : "<span class=\"chip ind\">Độc lập</span>",
                      t.label ? esc(A.labels[t.labelId].clientId) : "nghệ sĩ ký thẳng với Haustek")}
                ${row("Sáng tác", esc(t.writer1) + " · " + esc(fmt.pct(t.writer1Share)),
                      t.writer2 ? esc(t.writer2) + " · " + esc(fmt.pct(1 - t.writer1Share)) : "một mình")}
                ${row("Điểm producer", t.producerPts > 0 ? esc(fmt.pct(t.producerPts)) : "<span class=\"dim\">không có</span>",
                      t.producerPts > 0 ? "trừ vào phần nghệ sĩ, không cộng thêm bên trên" : "")}
              </table>
            </div>

            <div>
              <div class="ct-secret">
                <div class="lab">▲ Chỉ hiện ở intranet — không bao giờ xuống trình duyệt khách</div>
                <table>
                  ${row("Đơn vị phân phối", esc(A.distributor.name))}
                  ${row("Mã đối tác", esc(A.distributor.code))}
                  ${row("Tỷ lệ gốc", esc(fmt.pct(A.distributor.grossRate)),
                        "Haustek nhận " + esc(fmt.pct(A.distributor.grossRate)) + " từ đối tác, phần còn lại là phí của họ. "
                        + "Chưa chốt được con số ở cột doanh thu gộp là trước hay sau khi đối tác giữ phần này — "
                        + "phải xem file báo cáo doanh thu mẫu mới biết.")}
                  ${row("Tỷ lệ chia đang áp", esc(fmt.pct(rate)),
                        "phần nghệ sĩ nhận trong hợp đồng của " + esc(A.partyName(t.partyKey))
                        + " (" + esc(A.partyClientId(t.partyKey)) + ") · "
                        + esc(fmt.pct(1 - rate)) + " còn lại là phần " + esc(t.labelId >= 0 ? "label giữ" : "Haustek giữ thêm"))}
                  ${row("Hiệu lực từ", inForce ? esc(perLabel(inForce.from)) : "—",
                        (inForce && inForce.note ? esc(inForce.note) + " · " : "")
                        + (next ? "đổi thành " + esc(fmt.pct(next.rate)) + " từ kỳ " + esc(perLabel(next.from))
                                : "chưa có phụ lục nào đổi tỷ lệ sau kỳ này"))}
                </table>
              </div>
              <p class="note ct-stack">Tên đối tác và tỷ lệ gốc là bí mật kinh doanh (mục 2.7).
                Tầng API của cổng khách ném lỗi nếu thấy chúng lọt vào gói dữ liệu gửi đi —
                chặn ở tầng dữ liệu, không chỉ chặn ở giao diện.</p>
            </div>

            <div>
              <div class="mini">
                <h4>Chia tiền kỳ ${esc(per.label)}</h4>
                ${g > 0 ? `<table>
                  ${row("Doanh thu gộp", esc(ctx.money2(s.gross)), trend)}
                  ${row("− Phí Haustek", "−" + esc(ctx.money2(s.fee)), esc(fmt.pct(A.cfg.HAUSTEK_FEE)) + " doanh thu gộp")}
                  ${row("− " + esc(cut), "−" + esc(ctx.money2(s.labelCut)), esc(pctG(s.labelCut)) + " doanh thu gộp")}
                  ${s.producer > 0.004 ? row("− Điểm producer", "−" + esc(ctx.money2(s.producer)), "trừ vào phần nghệ sĩ") : ""}
                  ${row("<b>= Về tay nghệ sĩ</b>", "<b>" + esc(ctx.money2(s.artist)) + "</b>", esc(pctG(s.artist)) + " doanh thu gộp · trước khi trừ tạm ứng")}
                </table>` : `<p class="note">Kỳ này bài chưa phát sinh doanh thu${
                    relIdx > pi ? " — phát hành ở kỳ " + esc(t.releasePeriod) + ", sau kỳ đang xem" : ""}.</p>`}
              </div>
              ${g > 0 ? `
              <div class="mini ct-stack">
                <h4>Theo cửa hàng · 8 dòng đầu</h4>
                <table>${st.html}</table>
                <p class="note">8 cửa hàng đầu gánh ${esc(fmt.pct(st.share))} doanh thu bài này ·
                  ${esc(fmt.num(st.rest))} cửa hàng còn lại chia nhau phần đuôi.${miss.length ? `
                  <br>Kỳ này chưa nạp ${miss.map(f => esc(f.short)).join(" · ")}: dòng cửa hàng của luồng đó
                  là phần bóc theo trọng số, không phải tiền đã thật sự về.` : ""}</p>
              </div>
              <div class="mini ct-stack">
                <h4>Theo lãnh thổ · 8 dòng đầu</h4>
                <table>${tr.html}</table>
                <p class="note">${esc(fmt.pct(tr.share))} doanh thu bài này nằm ở 8 lãnh thổ đầu.
                  Bản mẫu bóc từ mã bài; hệ thật đọc thẳng bảng rollup theo bản ghi × cửa hàng × lãnh thổ.</p>
              </div>` : ""}
            </div>

          </div>
        </div>`;

        const btn = drillEl.querySelector("[data-ct-close]");
        if (btn) btn.addEventListener("click", () => { sel = -1; drawDrill(); vt.paint(); });
        drillEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch (e) {
        sel = -1; drillEl.innerHTML = "";
        ctx.toast(e.message, "no");
      }
    }

    /* ---------- sự kiện ---------- */
    /* Khung vẽ lại màn hình chỉ xoá DOM, không dọn timer. Timer còn sống sẽ
       ghi bộ lọc vào biến cấp module rồi bắn vào DOM đã tháo — bộ lọc biến
       mất khỏi bảng đang nhìn, rồi tự hiện ra ở lần vẽ sau mà không ai bấm
       gì. Canh phần tử còn nằm trong trang trước khi làm gì. */
    let qt = null;
    const qEl = $("q");
    qEl.addEventListener("input", () => {
      clearTimeout(qt);
      qt = setTimeout(() => {
        if (!qEl.isConnected) return;
        flt.q = qEl.value; paint();
      }, 200);
    });
    ["own", "type"].forEach(k => {
      $(k).addEventListener("change", e => { flt[k] = e.target.value; paint(); });
    });
    $("rev").addEventListener("change", e => { flt.rev = e.target.checked; paint(); });

    head.addEventListener("click", e => {
      const sp = e.target.closest("span");
      if (!sp || !sp.dataset.k) return;
      if (sortKey === sp.dataset.k) sortDir = -sortDir;
      else { sortKey = sp.dataset.k; sortDir = TEXT_COL[sortKey] ? 1 : -1; }
      paint();
    });

    body.addEventListener("click", e => {
      const r = e.target.closest(".vt-row");
      if (!r) return;
      const row = vt.rowAt(+r.dataset.r);
      if (!row) return;
      sel = sel === row.i ? -1 : row.i;
      vt.paint();
      drawDrill();
    });

    root.querySelectorAll("[data-ct-go]").forEach(b => {
      b.addEventListener("click", () => {
        try { ctx.go(b.dataset.ctGo); } catch (err) { ctx.toast(err.message, "no"); }
      });
    });

    paint();
    if (sel >= 0) drawDrill();
  }
});

})();
