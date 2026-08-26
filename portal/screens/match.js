"use strict";
/* =====================================================================
   HÀNG CHỜ KHỚP ISRC — chỗ tiền của người khác nằm lại
   ---------------------------------------------------------------------
   Dòng doanh thu về mà không khớp được bản ghi nào thì KHÔNG được bỏ im.
   Bốn thứ màn hình này phải nói ra cho bằng được:
     · treo bao nhiêu tiền, của kỳ nào, chiếm bao nhiêu phần doanh thu kỳ;
     · treo VÌ SAO — gom theo lý do, vì sửa được ở đường ống nạp thì khỏi
       phải khớp tay mãi;
     · dòng nào nằm trong kỳ ĐÃ DUYỆT — tiền đó đã chốt sổ mà vẫn chưa về
       tay ai, muốn khớp phải thu hồi duyệt kỳ đó trước;
     · gợi ý chỉ là gợi ý. Khớp sai không phải lỗi hiển thị — tiền đi qua
       bảng chi trả thật và về nhầm người.
   ===================================================================== */
(function () {

const H = HAUSTEK;

const CSS = `
.mt-bar{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
.mt-bar select{max-width:none;min-width:150px}
.mt-count{font-family:var(--mono);font-size:10px;color:var(--muted);margin-bottom:9px;line-height:1.7}
.mt-wrap table.tb{min-width:1180px}
.mt-miss{font-family:var(--mono);font-size:11px;color:var(--red)}
.mt-acts{display:flex;gap:5px;flex-wrap:wrap}
.mt-sug{display:flex;gap:11px;align-items:center;padding:9px 11px;border:1px solid var(--hair);
  border-radius:8px;margin-bottom:6px;background:#FAFAFC}
.mt-sug-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;line-height:1.3}
.mt-sug-main b{font-size:12.5px;font-weight:600}
.mt-sug-main span{font-size:10.5px;color:var(--muted)}
.mt-sug-why{flex:none;max-width:180px;display:flex;flex-direction:column;gap:3px;align-items:flex-end;text-align:right}
.mt-sug-why span{font-family:var(--mono);font-size:9.5px;color:var(--muted);line-height:1.5}
.mt-res{margin-top:9px}
.mt-lead{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.8;margin:11px 0 7px}
`;

/* Bộ lọc sống trong module chứ không đi qua A.state(): đây là việc của
   người đang nhìn bảng, không phải quyết định vận hành cần ghi nhật ký.
   Nhờ nằm ngoài hàm render, khớp một dòng xong ctx.refresh() vẫn trả về
   đúng chỗ đang xem thay vì nhảy về đầu. */
const filt = { periodKey: "", status: "", feedId: "" };

const ST = {
  pending: { lab: "Chờ khớp", chip: "no" },
  matched: { lab: "Đã khớp",  chip: "ok" },
  parked:  { lab: "Để lại chờ", chip: "wait" }
};

/* Mỗi lý do hỏng ở một khâu khác nhau của đường ống — ghi thẳng ra đây
   để người đọc bảng biết nên đòi đối tác sửa file hay tự sửa danh mục. */
const FIX = {
  "Thiếu mã ISRC":
    "File gốc về không mang mã. Khớp tay bao nhiêu cũng không hết — phải đòi đối tác trả thêm cột ISRC.",
  "Mã ISRC không có trong danh mục":
    "Mã đúng dạng nhưng danh mục không có: hoặc bài chưa nhập, hoặc là mã thứ hai của bài phát hành lại mà bảng mã phụ chưa ghi.",
  "Mã của nhà phát hành khác":
    "Tiền của bên khác về nhầm địa chỉ. Trả lại đối tác thì đúng hơn là khớp bừa vào một bài của mình."
};

const feedOf = (A, id) => A.feeds.find(f => f.id === id) || { short: "?", name: "Luồng " + id };
const perOf  = (A, k) => { const i = A.pIndexOf(k); return i >= 0 ? A.periods[i] : { label: k, idx: -1, k }; };

/* Một vòng duy nhất trên hàng chờ, dùng lại cho thẻ số, nhãn bộ lọc và
   panel lý do — hàng chờ ngắn, nhưng không có cớ gì quét nó bốn lần. */
function scan(A) {
  const s = {
    all: 0, pend: 0, pendAmt: 0, matched: 0, matchedAmt: 0, parked: 0, parkedAmt: 0,
    lockedPend: 0, lockedAmt: 0, oldestPend: null,
    byPeriod: {}, byFeed: {}, reasons: new Map()
  };
  A.queue.list().forEach(q => {
    s.all++;
    if (q.status === "matched") { s.matched++; s.matchedAmt += q.amount; return; }
    if (q.status === "parked")  { s.parked++;  s.parkedAmt  += q.amount; return; }
    s.pend++; s.pendAmt += q.amount;
    s.byPeriod[q.periodKey] = (s.byPeriod[q.periodKey] || 0) + 1;
    s.byFeed[q.feedId] = (s.byFeed[q.feedId] || 0) + 1;
    const r = s.reasons.get(q.reason) || { reason: q.reason, n: 0, amt: 0 };
    r.n++; r.amt += q.amount; s.reasons.set(q.reason, r);
    const pi = A.pIndexOf(q.periodKey);
    if (s.oldestPend === null || pi < s.oldestPend) s.oldestPend = pi;
    if (A.isApproved(q.periodKey)) { s.lockedPend++; s.lockedAmt += q.amount; }
  });
  return s;
}

/* Tìm tay trong 50.000 bản ghi: MỘT vòng, dừng ngay khi đủ số cần hiện.
   Chỉ soi mã chính và tên bài — mã phụ nằm ở phần gợi ý của lõi. */
/* Người ta gõ không dấu. Bỏ dấu cả hai vế, không thì "dem" không bao giờ
   ra "Đêm" — mà ô này là đường thoát duy nhất khi gợi ý của hệ thống không
   ra gì, tức đúng những dòng treo lâu nhất và khó nhất. */
function boDau(x) {
  return String(x || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}
function searchCatalog(A, needle, limit) {
  const q = boDau(needle);
  const out = [];
  for (let i = 0; i < A.trackCount && out.length < limit; i++) {
    if (boDau(A.isrcOf(i)).indexOf(q) >= 0 || boDau(A.titleOf(i)).indexOf(q) >= 0
        || boDau(A.artistOf(i).name).indexOf(q) >= 0) out.push(i);
  }
  return out;
}

/* ---------------------------------------------------------------------
   HỘP THOẠI KHỚP
   --------------------------------------------------------------------- */
function sugRow(ctx, i, score, why) {
  const A = ctx.admin, esc = ctx.esc;
  const t = A.track(i);
  return `<div class="mt-sug">
    <div class="mt-sug-main">
      <b>${esc(t.title)}</b>
      <span class="mono">${esc(t.isrc)}${t.isrcAlt ? " · mã phụ " + esc(t.isrcAlt) : ""} · ${esc(t.type)}</span>
      <span>${esc(t.artist)} · ${t.label ? esc(t.label) : "Độc lập"}</span>
    </div>
    <div class="mt-sug-why">
      ${score != null ? `<span class="chip ${score >= 90 ? "ok" : score >= 60 ? "info" : "wait"}">${score} điểm</span>` : ""}
      <span>${esc(why)}</span>
    </div>
    <button type="button" class="btn sm pri" data-pick="${i}">Chọn</button>
  </div>`;
}

function qCard(ctx, q) {
  const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
  return `<table class="tb"><tbody>
    <tr><td>Mã ISRC trên file</td><td class="num mono">${
      q.isrc ? esc(q.isrc) : `<span class="mt-miss">— thiếu mã —</span>`}</td></tr>
    <tr><td>Tên bài · nghệ sĩ như file gốc ghi</td><td class="num"><b>${esc(q.title)}</b><span class="sub">${esc(q.artist)}</span></td></tr>
    <tr><td>Luồng · kỳ</td><td class="num mono">${esc(feedOf(A, q.feedId).short)} · ${esc(perOf(A, q.periodKey).label)}</td></tr>
    <tr><td>Cửa hàng · lãnh thổ</td><td class="num">${esc(q.store)} · ${esc(q.territory)}</td></tr>
    <tr><td>Lượt nghe</td><td class="num mono">${fmt.num(q.streams)}</td></tr>
    <tr><td>Số tiền đang treo</td><td class="num mono strong">${ctx.money2(q.amount)}</td></tr>
    <tr><td>Lý do không khớp</td><td class="num">${esc(q.reason)}</td></tr>
  </tbody></table>`;
}

async function openMatch(ctx, q) {
  const A = ctx.admin, esc = ctx.esc;
  let sug = [];
  try { sug = A.queue.suggest(q.id) || []; }
  catch (e) { ctx.toast(e.message, "no"); }

  let picked = null;

  /* Nói trước tiền sẽ rơi vào kỳ nào, đừng để người bấm ngạc nhiên sau khi
     đã bấm — đây là chỗ tiền đổi kỳ, không phải một thao tác vô hại. */
  const land = A.queue.landingPeriod(q.id);
  const landNote = land && land.adjustment
    ? `<div class="infobar" style="margin:12px 0"><span class="ic">↩</span>
        <span>Dòng này thuộc kỳ <b>${esc(perOf(A, q.periodKey).label)}</b> đã chốt.
        Khớp xong, ${esc(ctx.money2(q.amount))} sẽ ghi thành <b>khoản truy thu ở kỳ ${esc(land.label)}</b> —
        kỳ cũ giữ nguyên con số khách đã đọc, và khoản này nằm riêng một dòng ở màn đối chiếu.</span></div>`
    : "";

  const body = qCard(ctx, q) + landNote +
    `<div class="mt-lead">Gợi ý của hệ thống · ${sug.length ? "tối đa 6 bản ghi, xếp theo điểm khớp" : "không có bản ghi nào đủ giống để gợi ý"}</div>` +
    (sug.length ? sug.map(s => sugRow(ctx, s.i, s.score, s.why)).join("")
                : `<p class="note">Mã không tra ra, tên bài cũng không gần bài nào trong danh mục. Tìm tay bên dưới, hoặc để lại chờ đối tác xác nhận.</p>`) +
    `<label class="fld" style="margin-top:15px">Tìm tay trong ${ctx.fmt.num(A.trackCount)} bản ghi · theo mã ISRC hoặc tên bài</label>
     <input type="search" data-msearch placeholder="ít nhất 3 ký tự" style="width:100%">
     <div class="mt-res" data-mres><p class="note">Gõ ít nhất 3 ký tự rồi dừng tay một nhịp — danh mục 50.000 bản ghi, tìm sớm hơn thì trả về nửa danh mục.</p></div>`;

  await ctx.modal({
    title: "Khớp dòng " + q.id,
    hint: "Hệ thống chỉ gợi ý — <b>người quyết định</b>. Khớp sai thì " + ctx.money2(q.amount) +
          " chảy sang nhầm người, đi qua bảng chi trả thật và chỉ lộ ra khi bên kia hỏi. Không chắc thì để lại chờ, đừng khớp bừa.",
    body, ok: false, cancel: "Đóng",
    onMount(bg) {
      const close = () => { const c = bg.querySelector("[data-act=cancel]"); if (c) c.click(); };
      const bindPick = scope => scope.querySelectorAll("[data-pick]").forEach(b => {
        b.onclick = () => { picked = +b.dataset.pick; close(); };
      });
      bindPick(bg);

      const inp = bg.querySelector("[data-msearch]");
      const res = bg.querySelector("[data-mres]");
      let timer = null;
      const run = () => {
        if (!bg.isConnected) return;                 /* đóng hộp thoại giữa lúc chờ debounce */
        const needle = (inp.value || "").trim();
        if (needle.length < 3) {
          res.innerHTML = `<p class="note">Gõ ít nhất 3 ký tự rồi dừng tay một nhịp — danh mục 50.000 bản ghi, tìm sớm hơn thì trả về nửa danh mục.</p>`;
          return;
        }
        const hits = searchCatalog(A, needle, 8);
        res.innerHTML = hits.length
          ? `<div class="mt-lead">${hits.length} kết quả đầu tiên cho “${esc(needle)}”${hits.length === 8 ? " · còn nữa thì gõ rõ hơn" : ""}</div>`
            + hits.map(i => sugRow(ctx, i, null, "Bạn tự tìm ra, hệ thống không chấm điểm")).join("")
          : `<p class="note">Không có bản ghi nào mang mã hoặc tên chứa “${esc(needle)}”.</p>`;
        bindPick(res);
      };
      if (inp) inp.oninput = () => { clearTimeout(timer); timer = setTimeout(run, 250); };
    }
  });

  if (picked === null) return;
  try {
    const land = A.queue.landingPeriod(q.id);
    A.queue.resolve(q.id, picked);
    ctx.toast("Đã khớp " + q.id + " → " + A.titleOf(picked) + " · " + ctx.money2(q.amount)
      + (land && land.adjustment ? " · ghi thành khoản truy thu ở kỳ " + land.label : " về đúng chủ"), "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

/* ---------------------------------------------------------------------
   ĐỂ LẠI CHỜ / TRẢ LẠI HÀNG CHỜ
   --------------------------------------------------------------------- */
async function openPark(ctx, q) {
  const res = await ctx.modal({
    title: "Để lại chờ đối tác · " + q.id,
    hint: "Dùng khi dòng này phải hỏi lại đối tác mới biết của ai. Tiền vẫn treo nguyên, chỉ là không nằm trong danh sách phải làm hôm nay — nhưng vẫn tính vào ngưỡng chặn duyệt kỳ.",
    body: `<label class="fld">Đã hỏi ai, chờ gì</label>
      <textarea data-field="note" rows="3" placeholder="vd: đã gửi mail cho đối tác phân phối ngày 26.08, chờ họ xác nhận mã"></textarea>`,
    ok: "Để lại chờ"
  });
  if (!res) return;
  try {
    ctx.admin.queue.park(q.id, (res.note || "").trim());
    ctx.toast("Đã để lại chờ " + q.id, "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

async function openUnpark(ctx, q) {
  const matched = q.status === "matched";
  const ok = await ctx.confirm(
    matched ? "Bỏ khớp " + q.id + "?" : "Trả " + q.id + " lại hàng chờ?",
    matched
      ? "Số tiền " + ctx.money2(q.amount) + " đang cộng vào bản ghi “" + ctx.admin.titleOf(q.resolvedTo) +
        "” sẽ rút ra ngay, và dòng này quay lại trạng thái chờ khớp."
      : "Dòng này trở lại danh sách phải xử lý hôm nay. Số tiền không đổi — nó chưa bao giờ rời khỏi chỗ treo.",
    matched ? "Bỏ khớp" : "Trả lại hàng chờ", matched);
  if (!ok) return;
  try {
    ctx.admin.queue.unpark(q.id);
    ctx.toast(matched ? "Đã bỏ khớp " + q.id : "Đã trả " + q.id + " lại hàng chờ", "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

/* ---------------------------------------------------------------------
   MÀN HÌNH
   --------------------------------------------------------------------- */
H.registerScreen({
  id: "match",
  nav: "Khớp ISRC",
  group: "Vận hành",
  title: "Hàng chờ khớp ISRC",
  subtitle: "Mỗi dòng ở đây là <b>tiền của người khác</b> đang nằm chờ vì không tra ra bản ghi nào. " +
            "Ngành gọi chỗ này là <b>black box</b> — riêng The MLC đang giữ hơn <b>424 triệu đô</b> chưa tìm ra chủ sở hữu. " +
            "Ở quy mô Haustek con số nhỏ hơn nhiều, nhưng nó vẫn không phải tiền của mình.",

  badge(ctx) {
    const n = ctx.admin.queue.list({ status: "pending" }).length;
    return n ? String(n) : "";
  },

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
    const m2 = v => ctx.money2(v);
    const s = scan(A);

    const pendCur = A.queue.pendingTotal(ctx.periodKey);
    const aggCur = A.agg("admin", 0, ctx.pIdx, "rec");      /* một vòng 50.000, gọi đúng một lần */
    const ratio = aggCur.gross > 0 ? pendCur / aggCur.gross : null;
    const cap = A.cfg.BLACKBOX_CAP;
    const missCur = A.missingFeeds(ctx.pIdx);

    /* ---------- dải cảnh báo ---------- */
    function bars() {
      let out = "";
      if (s.lockedPend) {
        const land = A.periods.find(p => !A.isApproved(p.k));
        out += `<div class="infobar">
        <div class="ic">↩</div>
        <div>
          <b style="display:block;font-size:12.5px;color:var(--teal);margin-bottom:3px">${s.lockedPend} dòng treo thuộc kỳ đã chốt · ${m2(s.lockedAmt)}</b>
          <span>Kỳ đó đã đối chiếu, đã chi tiền và khách đã đọc con số ấy — sửa lại là để hai người
          cùng nhìn một kỳ mà ra hai số khác nhau. Vẫn khớp được bình thường: tiền về đúng chủ,
          nhưng ghi thành <b>khoản truy thu ở kỳ ${land ? esc(land.label) : "đang mở"}</b>, kỳ cũ giữ nguyên.
          Ở màn đối chiếu, khoản truy thu nằm riêng một dòng nên tổng vẫn khớp file gốc.</span>
        </div></div>`;
      }
      if (ratio !== null && ratio > cap) out += `<div class="warn">
        <div class="ic">▲</div>
        <div>
          <b>Kỳ ${esc(ctx.period.label)} chưa duyệt được: tiền treo ${fmt.pct(ratio)} doanh thu kỳ, ngưỡng chặn là ${fmt.pct(cap)}</b>
          <span>${m2(pendCur)} treo trên ${m2(aggCur.gross)} doanh thu gộp.
          Phải kéo xuống dưới ngưỡng — bằng cách khớp, hoặc bằng cách nhận ra dòng đó không phải của Haustek.</span>
        </div></div>`;
      return out;
    }

    /* ---------- thẻ số ---------- */
    function kpis() {
      const curShare = s.pendAmt > 0 ? fmt.pct(pendCur / s.pendAmt) : "—";
      const oldest = s.oldestPend !== null ? A.periods[s.oldestPend].label : null;
      let ratioTxt, ratioCls;
      if (ratio === null) { ratioTxt = "—"; ratioCls = ""; }
      else { ratioTxt = fmt.pct(ratio); ratioCls = ratio > cap ? "bad" : "good"; }
      return `<div class="kpis">
        <div class="kpi ${s.pendAmt > 0 ? "bad" : "good"}">
          <div class="lab">Tiền đang treo</div>
          <div class="val">${m2(s.pendAmt)}</div>
          <div class="sub">${fmt.num(s.pend)} dòng trên cả ${A.periods.length} kỳ${
            s.pendAmt > 0 ? `<br>kỳ ${esc(ctx.period.label)} chiếm ${curShare}` : "<br>không còn đồng nào vô chủ"}</div>
        </div>
        <div class="kpi">
          <div class="lab">Dòng chờ khớp</div>
          <div class="val">${fmt.num(s.pend)}</div>
          <div class="sub">kỳ ${esc(ctx.period.label)}: ${fmt.num(s.byPeriod[ctx.periodKey] || 0)} dòng${
            oldest ? `<br>cũ nhất còn treo: kỳ ${esc(oldest)}` : ""}</div>
        </div>
        <div class="kpi">
          <div class="lab">Đã khớp</div>
          <div class="val">${fmt.num(s.matched)}</div>
          <div class="sub">${m2(s.matchedAmt)} đã về đúng bản ghi<br>${
            s.all ? fmt.pct(s.matched / s.all) : "—"} tổng số dòng từng vào hàng chờ</div>
        </div>
        <div class="kpi">
          <div class="lab">Để lại chờ đối tác</div>
          <div class="val">${fmt.num(s.parked)}</div>
          <div class="sub">${m2(s.parkedAmt)} · đã hỏi, đang chờ trả lời<br>không tính là đã xử lý xong</div>
        </div>
        <div class="kpi ${ratioCls}">
          <div class="lab">Treo / doanh thu kỳ ${esc(ctx.period.label)}</div>
          <div class="val">${ratioTxt}</div>
          <div class="sub">${m2(pendCur)} trên ${m2(aggCur.gross)}<br>vượt ${fmt.pct(cap)} là chặn duyệt kỳ${
            missCur.length ? `<br>kỳ còn thiếu ${missCur.length} luồng nên mẫu số đang nhỏ hơn sự thật` : ""}</div>
        </div>
      </div>`;
    }

    /* ---------- thanh lọc ---------- */
    function filterBar() {
      const perOpts = [`<option value=""${filt.periodKey === "" ? " selected" : ""}>Tất cả các kỳ · ${s.pend} dòng chờ</option>`];
      for (let i = A.periods.length - 1; i >= 0; i--) {
        const p = A.periods[i];
        perOpts.push(`<option value="${esc(p.k)}"${filt.periodKey === p.k ? " selected" : ""}>Kỳ ${esc(p.label)} · ${
          s.byPeriod[p.k] || 0} chờ${p.k === ctx.periodKey ? " · đang chọn ở thanh trên" : ""}${
          A.isApproved(p.k) ? " · đã duyệt" : ""}</option>`);
      }
      const stOpts = [`<option value=""${filt.status === "" ? " selected" : ""}>Mọi trạng thái · ${s.all} dòng</option>`]
        .concat(Object.keys(ST).map(k => `<option value="${k}"${filt.status === k ? " selected" : ""}>${esc(ST[k].lab)} · ${
          k === "pending" ? s.pend : k === "matched" ? s.matched : s.parked} dòng</option>`));
      const fdOpts = [`<option value=""${filt.feedId === "" ? " selected" : ""}>Mọi luồng</option>`]
        .concat(A.feeds.map(f => `<option value="${f.id}"${filt.feedId === String(f.id) ? " selected" : ""}>${
          esc(f.name)} · ${s.byFeed[f.id] || 0} chờ</option>`));
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Lọc hàng chờ</h3>
            <div class="hint">Lọc chạy tại chỗ, không vẽ lại cả trang · bộ lọc giữ nguyên sau khi khớp xong một dòng</div>
          </div>
        </div>
        <div class="mt-bar">
          <select data-mf="periodKey" aria-label="Lọc theo kỳ">${perOpts.join("")}</select>
          <select data-mf="status" aria-label="Lọc theo trạng thái">${stOpts.join("")}</select>
          <select data-mf="feedId" aria-label="Lọc theo luồng">${fdOpts.join("")}</select>
          <button class="btn sm" data-mq="cur">Chỉ kỳ ${esc(ctx.period.label)}</button>
          <button class="btn sm" data-mq="pend">Chỉ dòng đang chờ</button>
          <button class="btn sm" data-mq="clear">Bỏ lọc</button>
        </div>
      </div>`;
    }

    /* ---------- bảng ---------- */
    function pickRows() {
      const f = {};
      if (filt.periodKey) f.periodKey = filt.periodKey;
      if (filt.status) f.status = filt.status;
      if (filt.feedId !== "") f.feedId = +filt.feedId;
      const rank = { pending: 0, parked: 1, matched: 2 };
      return A.queue.list(f).slice().sort((a, b) =>
        (rank[a.status] - rank[b.status]) || (b.amount - a.amount));
    }

    function rowHTML(q) {
      const feed = feedOf(A, q.feedId);
      const per = perOf(A, q.periodKey);
      const locked = A.isApproved(q.periodKey);
      const st = ST[q.status] || { lab: q.status, chip: "" };

      let stCell = `<span class="chip ${st.chip}">${esc(st.lab)}</span>`;
      if (q.status === "matched" && q.resolvedTo != null) {
        stCell += `<span class="sub">${esc(A.titleOf(q.resolvedTo))}</span>
                   <span class="sub">${esc(A.isrcOf(q.resolvedTo))}</span>`;
      } else if (q.status === "parked" && q.note) {
        stCell += `<span class="sub">${esc(q.note)}</span>`;
      }

      let acts;
      /* Dòng của kỳ đã chốt vẫn khớp được — tiền về đúng chủ, nhưng ghi
         thành khoản truy thu ở kỳ đang mở, kỳ cũ giữ nguyên. Chỉ việc GỠ
         khớp là không cho, vì gỡ là rút tiền ra khỏi một kỳ đã chi. */
      const land = q.status === "pending" ? A.queue.landingPeriod(q.id) : null;
      /* Khoá theo kỳ tiền THẬT SỰ rơi vào, không theo kỳ gốc của dòng.
         Một khoản truy thu có kỳ gốc đã chốt nhưng đang nằm ở kỳ đang mở —
         khoá theo kỳ gốc là khoá vĩnh viễn, và người khớp nhầm không còn
         đường lùi nào trong giao diện. */
      const kyDangGiu = q.status === "matched" ? (q.intoPeriod || q.periodKey) : q.periodKey;
      const khoaGo = q.status === "matched" && A.isApproved(kyDangGiu);
      if (khoaGo) {
        acts = `<div class="mt-acts">
          <button class="btn sm" disabled>Bỏ khớp</button>
        </div><span class="sub">tiền đã nằm trong kỳ ${esc(perOf(A, kyDangGiu).label)} đã chốt — không rút lại được khoản đã chi</span>`;
      } else if (q.status === "pending" && land && land.adjustment) {
        acts = `<div class="mt-acts">
          <button class="btn sm pri" data-mact="match" data-id="${esc(q.id)}">Tìm bản ghi khớp</button>
          <button class="btn sm" data-mact="park" data-id="${esc(q.id)}">Để lại chờ</button>
        </div><span class="sub">kỳ đã chốt — sẽ ghi thành khoản truy thu ở kỳ ${esc(land.label)}</span>`;
      } else if (q.status === "pending") {
        acts = `<div class="mt-acts">
          <button class="btn sm pri" data-mact="match" data-id="${esc(q.id)}">Tìm bản ghi khớp</button>
          <button class="btn sm" data-mact="park" data-id="${esc(q.id)}">Để lại chờ</button>
        </div>`;
      } else if (q.status === "matched") {
        acts = `<div class="mt-acts">
          <button class="btn sm dang" data-mact="unpark" data-id="${esc(q.id)}">Bỏ khớp</button>
        </div>`;
      } else {
        acts = `<div class="mt-acts">
          <button class="btn sm" data-mact="unpark" data-id="${esc(q.id)}">Trả lại hàng chờ</button>
        </div>`;
      }

      return `<tr>
        <td class="mono">${esc(q.id)}</td>
        <td class="mono">${esc(per.label)}${locked ? `<span class="sub">đã duyệt</span>` : ""}</td>
        <td>${esc(feed.short)}</td>
        <td class="mono">${q.isrc ? esc(q.isrc) : `<span class="mt-miss">— thiếu mã —</span>`}</td>
        <td><b>${esc(q.title)}</b><span class="sub">${esc(q.artist)}</span></td>
        <td>${esc(q.store)}</td>
        <td>${esc(q.territory)}</td>
        <td class="num mono">${fmt.num(q.streams)}</td>
        <td class="num mono">${m2(q.amount)}</td>
        <td>${esc(q.reason)}</td>
        <td>${stCell}</td>
        <td>${acts}</td>
      </tr>`;
    }

    function tableHTML(list) {
      const amt = list.reduce((t, q) => t + q.amount, 0);
      const pendHere = list.filter(q => q.status === "pending");
      const pendAmtHere = pendHere.reduce((t, q) => t + q.amount, 0);
      const head = `<div class="mt-count">Đang hiện ${fmt.num(list.length)}/${fmt.num(s.all)} dòng · ${m2(amt)}${
        pendHere.length ? ` · trong đó ${fmt.num(pendHere.length)} dòng còn chờ, ${m2(pendAmtHere)} chưa về tay ai` : ""}
        · xếp theo: chờ trước, tiền lớn trước</div>`;
      if (!list.length) return head + `<div class="empty">Không có dòng nào khớp bộ lọc đang đặt.</div>`;
      return head + `<div class="tb-wrap mt-wrap"><table class="tb">
        <thead><tr>
          <th>Mã dòng</th><th>Kỳ</th><th>Luồng</th><th>Mã ISRC</th>
          <th>Bài · nghệ sĩ (như file gốc)</th><th>Cửa hàng</th><th>Lãnh thổ</th>
          <th class="num">Lượt nghe</th><th class="num">Số tiền</th>
          <th>Lý do không khớp</th><th>Trạng thái</th><th>Thao tác</th>
        </tr></thead>
        <tbody>${list.map(rowHTML).join("")}</tbody></table></div>`;
    }

    /* ---------- vì sao không khớp ---------- */
    function whyHTML() {
      const rows = Array.from(s.reasons.values()).sort((a, b) => b.amt - a.amt);
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Vì sao dòng này không khớp</h3>
            <div class="hint">Gom toàn bộ dòng đang chờ, mọi kỳ — không theo thanh lọc.
            Nhóm nào to là chỗ đường ống nạp đang hỏng: sửa ở đó thì khỏi khớp tay kỳ nào cũng như kỳ nào.</div>
          </div>
        </div>
        ${rows.length ? `<div class="tb-wrap"><table class="tb">
          <thead><tr><th>Lý do</th><th class="num">Số dòng</th><th class="num">Tổng tiền</th><th class="num">Phần tiền treo</th></tr></thead>
          <tbody>${rows.map(r => `<tr>
            <td><b>${esc(r.reason)}</b>${FIX[r.reason] ? `<span class="sub">${esc(FIX[r.reason])}</span>` : ""}</td>
            <td class="num mono">${fmt.num(r.n)}</td>
            <td class="num mono">${m2(r.amt)}</td>
            <td class="num mono">${s.pendAmt > 0 ? fmt.pct(r.amt / s.pendAmt) : "—"}</td>
          </tr>`).join("")}</tbody></table></div>`
        : `<div class="empty">Không còn dòng nào chờ khớp.</div>`}
      </div>`;
    }

    /* ---------- dựng ---------- */
    root.innerHTML = `<style>${CSS}</style>` + bars() + kpis() + filterBar() +
      `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Hàng chờ</h3>
            <div class="hint">Tên bài và tên nghệ sĩ để nguyên như file gốc ghi — đó chính là thứ phải đối chiếu bằng mắt</div>
          </div>
        </div>
        <div data-mtbl></div>
      </div>` + whyHTML();

    const host = root.querySelector("[data-mtbl]");

    function paint() {
      host.innerHTML = tableHTML(pickRows());
      host.querySelectorAll("[data-mact]").forEach(b => {
        b.addEventListener("click", () => {
          const q = A.queue.list().find(x => x.id === b.dataset.id);
          if (!q) return ctx.toast("Không còn dòng " + b.dataset.id, "no");
          try {
            if (b.dataset.mact === "match") openMatch(ctx, q);
            else if (b.dataset.mact === "park") openPark(ctx, q);
            else openUnpark(ctx, q);
          } catch (e) { ctx.toast(e.message, "no"); }
        });
      });
    }
    paint();

    const sels = root.querySelectorAll("[data-mf]");
    sels.forEach(sel => {
      sel.addEventListener("change", () => { filt[sel.dataset.mf] = sel.value; paint(); });
    });
    const sync = () => sels.forEach(sel => { sel.value = filt[sel.dataset.mf]; });

    root.querySelectorAll("[data-mq]").forEach(b => {
      b.addEventListener("click", () => {
        const q = b.dataset.mq;
        if (q === "cur") filt.periodKey = ctx.periodKey;
        else if (q === "pend") filt.status = "pending";
        else { filt.periodKey = ""; filt.status = ""; filt.feedId = ""; }
        sync(); paint();
      });
    });

    root.querySelectorAll("[data-mgo]").forEach(b => {
      b.addEventListener("click", () => {
        try { ctx.go(b.dataset.mgo); } catch (e) { ctx.toast(e.message, "no"); }
      });
    });
  }
});

})();
