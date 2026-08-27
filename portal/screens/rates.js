"use strict";
/* =====================================================================
   MÀN HÌNH: TỶ LỆ CHIA THEO NGÀY HIỆU LỰC
   ---------------------------------------------------------------------
   Tỷ lệ chia là một BẢNG có ngày hiệu lực, không phải một cột trên bảng
   nghệ sĩ. Khác biệt đó chỉ lộ ra đúng một lần: hôm có người sửa tỷ lệ và
   báo cáo các kỳ đã chốt đổi theo. Lúc ấy tiền đã chuyển đi rồi, không
   còn đường lùi — nên màn hình này đặt LỊCH SỬ ở giữa, còn ô nhập tỷ lệ
   mới thì bị chặn cứng: chỉ chọn được kỳ chưa duyệt.

   Một điểm dễ hiểu nhầm, ghi rõ ở đây để người sửa sau khỏi đoán: con số
   lưu trong bảng tỷ lệ là PHẦN NGHỆ SĨ GIỮ (xem splitRec trong lõi —
   artistBase = net × rate). Với label, phần label giữ là 1 − rate. Nên
   mọi chỗ hiện tỷ lệ ở đây đều nói kèm cả hai vế, không để trống một vế
   rồi ai muốn hiểu sao thì hiểu.
   ===================================================================== */
(function () {

const CSS = `
.rt-t{display:block;font-size:12.5px;font-weight:600;color:var(--teal);margin-bottom:4px}
.rt-bar{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:11px}
.rt-count{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.75;margin-bottom:9px}
.rt-multi td{background:#FFF8F9}
.rt-multi td:first-child{box-shadow:inset 3px 0 0 var(--red-bright)}
.rt-sel td{background:var(--teal-soft)}
.rt-now td{background:var(--teal-soft)}
.rt-live{display:block;font-family:var(--mono);font-size:10.5px;color:var(--teal);margin-top:7px;line-height:1.6}
.rt-cols{display:grid;gap:12px;grid-template-columns:1fr;margin-top:14px}
@media(min-width:1120px){.rt-cols{grid-template-columns:1.25fr 1fr}}
.rt-sub{font-family:var(--mono);font-size:9.5px;color:var(--muted);display:block;margin-top:2px}
.rt-note{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.8;margin-top:10px}
.rt-out-lab{font-family:var(--mono);font-size:9.5px;color:var(--muted);text-align:right;display:block}
`;

/* Bao nhiêu dòng bên nhận vẽ ra một lần. 40 label + hơn 400 nghệ sĩ độc
   lập vẽ hết cũng không chậm, nhưng bảng dài 450 dòng thì không ai đọc —
   cắt ở 60 và nói thẳng còn bao nhiêu dòng nữa. */
const LIMIT = 60;

/* Trạng thái riêng của màn hình: ô tìm và bên nhận đang mở. Để ở đây thay
   vì trong DOM để sau ctx.refresh() (đặt xong một mốc tỷ lệ) người dùng
   quay lại đúng chỗ đang đứng, không phải tìm lại từ đầu. */
const ui = { q: "", only: false, sel: null };

const fold = s => String(s == null ? "" : s).toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d");

/* ---------------------------------------------------------------------
   DỰNG DANH SÁCH BÊN NHẬN
   Bên nhận = 40 label + các nghệ sĩ độc lập. Nghệ sĩ thuộc label không
   có dòng riêng: tiền của họ đi qua tỷ lệ của label.
   Không đụng tới 50.000 bản ghi — số bản ghi lấy từ chỉ mục dựng sẵn.
   --------------------------------------------------------------------- */
function buildParties(A, periodKey) {
  const out = [];
  A.labels.forEach(l => out.push({
    key: l.key, kind: "label", name: l.name, clientId: l.clientId, id: l.id,
    tracks: A.idxOf(A.byLabel, l.id).length,
    rate: A.rates.rateFor(l.key, periodKey),
    marks: A.rates.scheduleFor(l.key).length
  }));
  A.artists.forEach(a => {
    if (a.labelId >= 0) return;
    out.push({
      key: a.key, kind: "indie", name: a.name, clientId: a.clientId, id: a.id,
      tracks: A.idxOf(A.byArtist, a.id).length,
      rate: A.rates.rateFor(a.key, periodKey),
      marks: A.rates.scheduleFor(a.key).length
    });
  });
  out.forEach(p => { p.f = fold(p.name) + " " + fold(p.clientId) + " " + fold(p.key); });
  /* Xếp theo số bản ghi giảm dần: sửa tỷ lệ ở đầu bảng là đụng vào nhiều
     tiền nhất, nên chúng phải nằm trong tầm mắt. */
  out.sort((x, y) => y.tracks - x.tracks || x.name.localeCompare(y.name, "vi"));
  return out;
}

/* Vế còn lại của tỷ lệ, nói bằng lời của đúng loại bên nhận. */
function otherSide(fmt, party, rate) {
  return (party.kind === "label" ? "label giữ " : "Haustek giữ thêm ") + fmt.pct(1 - rate);
}

/* Mốc này phủ những kỳ nào, và trong đó bao nhiêu kỳ đã chốt sổ. Số kỳ đã
   chốt mới là thứ đáng sợ: mỗi kỳ ở đó là một lần tiền đã chuyển đi. */
function coverage(A, sched, n) {
  const fromIdx = A.pIndexOf(sched[n].from);
  if (fromIdx < 0) return { text: "kỳ " + sched[n].from + " (không có trong danh sách kỳ)", closed: 0 };
  const nextIdx = sched[n + 1] ? A.pIndexOf(sched[n + 1].from) : -1;
  const endIdx = nextIdx > fromIdx ? nextIdx - 1 : A.periods.length - 1;
  let closed = 0;
  for (let i = fromIdx; i <= endIdx; i++) if (A.isApproved(A.periods[i].k)) closed++;
  const text = nextIdx > fromIdx
    ? (endIdx === fromIdx ? "chỉ kỳ " + A.periods[fromIdx].label
                          : "kỳ " + A.periods[fromIdx].label + " → " + A.periods[endIdx].label)
    : "từ kỳ " + A.periods[fromIdx].label + " tới nay";
  return { text, closed, fromIdx, endIdx };
}

/* ---------------------------------------------------------------------
   MÔ PHỎNG
   Lặp qua ĐÚNG các bản ghi của bên nhận này trong kỳ, một vòng, rồi giữ
   lại (doanh thu, điểm producer) để kéo thanh trượt bao nhiêu lần cũng
   không phải quét lại. splitRec của lõi chỉ đọc được tỷ lệ đã lưu trong
   bảng, nên phép chia phải viết lại ở đây — bám đúng thứ tự của lõi:
   phí Haustek trước, rồi phần bên nhận, điểm producer trừ vào phần nghệ
   sĩ chứ không cộng thêm bên trên.
   --------------------------------------------------------------------- */
function collect(A, party, pIdx) {
  const idx = party.kind === "label" ? A.idxOf(A.byLabel, party.id) : A.idxOf(A.byArtist, party.id);
  const rows = [];
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k];
    const g = A.grossRec(i, pIdx);
    if (g <= 0) continue;
    rows.push([g, A.track(i).producerPts]);
  }
  return { rows, all: idx.length };
}
function calc(H, A, rows, rate) {
  const c = H.cents, FEE = A.cfg.HAUSTEK_FEE;
  let gross = 0, fee = 0, net = 0, keep = 0, prod = 0, artist = 0;
  for (let k = 0; k < rows.length; k++) {
    const g = rows[k][0], pts = rows[k][1];
    const f = c(g * FEE), n = c(g - f);
    const base = c(n * rate), lc = c(n - base);
    const pr = Math.min(c(n * pts), base);
    gross += g; fee += f; net += n; keep += lc; prod += pr; artist += c(base - pr);
  }
  return { gross: c(gross), fee: c(fee), net: c(net), keep: c(keep), producer: c(prod), artist: c(artist) };
}

/* ---------------------------------------------------------------------
   HỘP THOẠI
   --------------------------------------------------------------------- */
async function askAddRate(ctx, party, presetPct) {
  const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
  const open = A.periods.filter(p => !A.isApproved(p.k));
  if (!open.length) {
    ctx.toast("Mọi kỳ đều đã duyệt — không còn kỳ nào đặt hiệu lực được. Mốc mới phải chờ kỳ sau mở.", "no");
    return;
  }
  const now = A.rates.rateFor(party.key, ctx.periodKey);
  const def = presetPct != null ? Math.round(presetPct * 10) / 10 : Math.round(now * 1000) / 10;
  const isLabel = party.kind === "label";
  const res = await ctx.modal({
    title: "Thêm mốc tỷ lệ · " + party.name,
    hint: "Mốc mới chỉ đặt được vào kỳ <b>chưa duyệt</b> — danh sách dưới đây đã lọc sẵn. "
        + "Các kỳ đã chốt giữ nguyên tỷ lệ của chính chúng, mốc này không với tới được.<br>"
        + "Đang áp cho kỳ " + esc(ctx.period.label) + ": <b>" + esc(fmt.pct(now)) + "</b> nghệ sĩ giữ · "
        + esc(otherSide(fmt, party, now)) + ".",
    body: '<label class="fld">Hiệu lực từ kỳ</label>'
        + '<select data-field="from" style="max-width:100%">'
        + open.map(p => '<option value="' + esc(p.k) + '"' + (p.k === ctx.periodKey ? " selected" : "") + '>Kỳ '
            + esc(p.label) + ' · chưa duyệt' + (p.k === ctx.periodKey ? " · đang chọn ở thanh trên" : "") + '</option>').join("")
        + '</select>'
        + '<label class="fld" style="margin-top:13px">Phần nghệ sĩ giữ (%)</label>'
        + '<input type="number" data-field="rate" min="0.5" max="99.5" step="0.5" style="width:130px" value="' + esc(def) + '">'
        + '<span class="rt-live" data-rt-live></span>'
        + '<label class="fld" style="margin-top:13px">Ghi chú</label>'
        + '<textarea data-field="note" rows="3" placeholder="ví dụ: Phụ lục hợp đồng ký 12.08.2026 — áp từ kỳ 07/2026"></textarea>'
        + '<p class="note" style="margin-top:8px">Ghi chú là thứ duy nhất người đọc lại sổ sáu tháng sau còn có để biết vì sao tỷ lệ đổi. '
        + 'Mốc mới được ghi vào nhật ký kèm người đặt và thời điểm.</p>',
    ok: "Lưu mốc tỷ lệ",
    onMount(bg) {
      /* Vế còn lại đổi theo từng lần gõ — để không ai lưu nhầm 30% khi ý
         họ là "label giữ 30%". */
      const inp = bg.querySelector('[data-field="rate"]');
      const live = bg.querySelector("[data-rt-live]");
      const paint = () => {
        const v = Number(String(inp.value).replace(",", "."));
        live.textContent = (v > 0 && v < 100)
          ? "→ nghệ sĩ giữ " + v + "% · " + (isLabel ? "label giữ " : "Haustek giữ thêm ") + Math.round((100 - v) * 10) / 10 + "%"
          : "Tỷ lệ phải là số lớn hơn 0 và nhỏ hơn 100.";
      };
      inp.addEventListener("input", paint);
      paint();
    }
  });
  if (!res) return;
  const pct = Number(String(res.rate == null ? "" : res.rate).replace(",", ".").replace(/[^\d.]/g, ""));
  if (!(pct > 0 && pct < 100)) {
    ctx.toast("Tỷ lệ phải là số trong khoảng 0–100, và không được bằng 0 hay 100", "no");
    return;
  }
  const from = String(res.from || "");
  if (!from) { ctx.toast("Phải chọn kỳ bắt đầu hiệu lực", "no"); return; }
  try {
    A.rates.add(party.key, pct / 100, from, "mgmt@haustek-group.com", String(res.note || "").trim());
    const p = A.periods[A.pIndexOf(from)];
    ctx.toast("Đã đặt " + pct + "% cho " + party.name + " từ kỳ " + (p ? p.label : from), "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

async function askRemoveRate(ctx, party, mark, fallback) {
  const A = ctx.admin, fmt = ctx.fmt, esc = ctx.esc;
  if (A.isApproved(mark.from)) {
    ctx.toast("Mốc này đã áp cho một kỳ đã duyệt — không xoá được", "no");
    return;
  }
  const p = A.periods[A.pIndexOf(mark.from)];
  const ok = await ctx.confirm(
    "Xoá mốc " + fmt.pct(mark.rate) + " từ kỳ " + (p ? p.label : mark.from) + "?",
    "Sau khi xoá, kỳ " + esc(p ? p.label : mark.from) + " trở về tỷ lệ của mốc liền trước: <b>"
      + esc(fmt.pct(fallback)) + "</b> nghệ sĩ giữ · " + esc(otherSide(fmt, party, fallback)) + ".<br>"
      + "Kỳ này chưa duyệt nên chưa ai nhận tiền theo mốc đang xoá — xoá bây giờ là an toàn.",
    "Xoá mốc", true);
  if (!ok) return;
  try {
    A.rates.remove(party.key, mark.from);
    ctx.toast("Đã xoá mốc từ kỳ " + (p ? p.label : mark.from), "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

/* =====================================================================
   MÀN HÌNH
   ===================================================================== */
HAUSTEK.registerScreen({
  id: "rates",
  nav: "Tỷ lệ chia",
  group: "Tiền",
  title: "Tỷ lệ chia theo ngày hiệu lực",
  subtitle: "Tỷ lệ không phải một cột trên bảng nghệ sĩ — nó là một <b>bảng có ngày hiệu lực</b>. "
          + "Đổi tỷ lệ hôm nay chỉ ăn vào kỳ chưa duyệt; báo cáo các kỳ đã chốt giữ nguyên con số khách đã đọc và đã nhận.",

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt, H = ctx.H;
    const pi = ctx.pIdx, pk = ctx.periodKey, per = ctx.period;
    const parties = buildParties(A, pk);
    const nLabel = parties.filter(p => p.kind === "label").length;
    const nIndie = parties.length - nLabel;
    const marks = parties.reduce((s, p) => s + p.marks, 0);
    const changed = parties.filter(p => p.marks > 1);
    const openPeriods = A.periods.filter(p => !A.isApproved(p.k));
    const curLocked = A.isApproved(pk);

    /* ---------- 1. vì sao phải có ngày hiệu lực ---------- */
    function why() {
      let ex = "";
      if (changed.length) {
        const c = changed[0];
        const sc = A.rates.scheduleFor(c.key);
        const last = sc[sc.length - 1], prev = sc[sc.length - 2];
        const lp = A.periods[A.pIndexOf(last.from)];
        ex = "<span>Ví dụ đang có trong bảng: <b>" + esc(c.name) + "</b> đổi từ " + esc(fmt.pct(prev.rate))
           + " sang " + esc(fmt.pct(last.rate)) + " kể từ kỳ " + esc(lp ? lp.label : last.from)
           + ". Các kỳ trước đó vẫn tính bằng " + esc(fmt.pct(prev.rate)) + " — và sẽ mãi như vậy.</span>";
      }
      return `<div class="infobar">
        <div class="ic">◆</div>
        <div>
          <b class="rt-t">Vì sao tỷ lệ phải có ngày hiệu lực</b>
          <span>Nếu tỷ lệ chỉ là một cột trên bảng nghệ sĩ thì nó chỉ có một giá trị: giá trị hôm nay.
          Sửa cột đó là mọi báo cáo cũ tính lại theo số mới.</span>
          <span>Nghệ sĩ mở lại kỳ đã nhận tiền, thấy con số khác con số họ đã nhận. Không ai giải thích được,
          vì hệ thống đã quên mất tỷ lệ cũ là bao nhiêu.</span>
          <span>Đó là cách nhanh nhất mất niềm tin của nghệ sĩ, và là lỗi không sửa được sau khi đã chi tiền —
          tiền chuyển đi rồi thì việc còn lại là của kế toán, không phải của phần mềm.</span>
          <span>Nên ở đây tỷ lệ là một bảng: mỗi dòng một mốc, mỗi mốc một kỳ bắt đầu. Mốc mới chỉ đặt được vào
          kỳ <b>chưa duyệt</b>; kỳ đã chốt khoá luôn tỷ lệ của chính nó.</span>
          ${ex}
        </div></div>`;
    }

    /* ---------- 2. thẻ số ---------- */
    function kpis() {
      return `<div class="kpis">
        <div class="kpi hero">
          <div class="lab">Bên nhận có tỷ lệ riêng</div>
          <div class="val">${fmt.num(parties.length)}</div>
          <div class="sub">${fmt.num(nLabel)} label · ${fmt.num(nIndie)} nghệ sĩ độc lập<br>nghệ sĩ thuộc label đi theo tỷ lệ của label, không có dòng riêng</div>
        </div>
        <div class="kpi">
          <div class="lab">Mốc tỷ lệ trong lịch sử</div>
          <div class="val">${fmt.num(marks)}</div>
          <div class="sub">trung bình ${(marks / Math.max(parties.length, 1)).toFixed(2)} mốc mỗi bên nhận<br>mốc đã áp cho kỳ đã duyệt thì không xoá được nữa</div>
        </div>
        <div class="kpi ${changed.length ? "bad" : ""}">
          <div class="lab">Đã từng đổi tỷ lệ</div>
          <div class="val">${fmt.num(changed.length)}</div>
          <div class="sub">${parties.length ? fmt.pct(changed.length / parties.length) : "—"} số bên nhận có nhiều hơn 1 mốc<br>${
            changed.length ? "đánh dấu đỏ ở bảng dưới" : "cả danh mục vẫn đang chạy tỷ lệ khởi tạo"}</div>
        </div>
        <div class="kpi ${curLocked ? "" : "good"}">
          <div class="lab">Kỳ ${esc(per.label)}</div>
          <div class="val">${curLocked ? "Đã khoá" : "Đặt được"}</div>
          <div class="sub">${curLocked
            ? "kỳ đã duyệt — tỷ lệ của kỳ này không đổi được nữa"
            : "kỳ chưa duyệt — mốc mới đặt được vào đúng kỳ này"}<br>còn ${openPeriods.length}/${A.periods.length} kỳ chưa duyệt để đặt hiệu lực</div>
        </div>
      </div>`;
    }

    /* ---------- 3. bảng bên nhận ---------- */
    function pickRows() {
      const q = fold(ui.q).trim();
      let rows = ui.only ? changed : parties;
      if (q) rows = rows.filter(p => p.f.indexOf(q) >= 0);
      return rows;
    }

    function listHTML(rows) {
      const shown = rows.slice(0, LIMIT);
      const rest = rows.length - shown.length;
      const filtered = rows.length !== parties.length;
      const count = `<div class="rt-count">Đang hiện ${fmt.num(shown.length)}/${fmt.num(rows.length)} bên nhận${
        ui.only ? " đã từng đổi tỷ lệ" : ""}${ui.q ? " khớp “" + esc(ui.q) + "”" : ""}${
        filtered ? " · lọc từ " + fmt.num(parties.length) + " bên nhận" : ""}.
        ${rest > 0 ? "Còn <b>" + fmt.num(rest) + "</b> dòng nữa chưa hiện — gõ tên hoặc mã Client ID vào ô tìm để thu hẹp." : "Đã hiện hết."}
        <br>Xếp theo số bản ghi giảm dần: sửa tỷ lệ ở đầu bảng là đụng vào nhiều tiền nhất.</div>`;
      if (!rows.length) return count + `<div class="empty">Không có bên nhận nào khớp “${esc(ui.q)}”.</div>`;
      return count + `<div class="tb-wrap"><table class="tb">
        <thead><tr>
          <th>Bên nhận</th><th>Kiểu</th><th class="num">Bản ghi</th>
          <th class="num">Tỷ lệ áp cho kỳ ${esc(per.label)}</th><th class="num">Mốc</th><th></th>
        </tr></thead>
        <tbody>${shown.map(p => {
          const cls = (p.marks > 1 ? "rt-multi " : "") + (p.key === ui.sel ? "rt-sel" : "");
          return `<tr class="${cls}">
            <td><b>${esc(p.name)}</b><span class="sub">${esc(p.clientId)}</span></td>
            <td><span class="chip ${p.kind === "label" ? "lbl" : "ind"}">${p.kind === "label" ? "Label" : "Độc lập"}</span></td>
            <td class="num mono">${fmt.num(p.tracks)}<span class="sub">${
              A.trackCount ? fmt.pct(p.tracks / A.trackCount) + " danh mục" : "—"}</span></td>
            <td class="num mono">${esc(fmt.pct(p.rate))}<span class="sub">${esc(otherSide(fmt, p, p.rate))}</span></td>
            <td class="num mono">${p.marks}${p.marks > 1 ? `<span class="sub">đã đổi ${p.marks - 1} lần</span>` : ""}</td>
            <td><button class="btn sm${p.key === ui.sel ? " pri" : ""}" data-rt-open="${esc(p.key)}">Xem lịch sử</button></td>
          </tr>`;
        }).join("")}</tbody></table></div>`;
    }

    /* ---------- 4. lịch sử một bên nhận ---------- */
    function schedHTML(party, sched) {
      if (!sched.length) return `<div class="empty">Bên nhận này chưa có mốc tỷ lệ nào — đang chạy tỷ lệ mặc định của hệ thống.</div>`;
      const applying = A.rates.rateFor(party.key, pk);
      return `<div class="tb-wrap"><table class="tb">
        <thead><tr>
          <th>Hiệu lực từ</th><th class="num">Tỷ lệ</th><th>Phủ những kỳ nào</th>
          <th>Ai đặt · lúc nào</th><th>Ghi chú</th><th></th>
        </tr></thead>
        <tbody>${sched.map((r, n) => {
          const cov = coverage(A, sched, n);
          const p = A.periods[A.pIndexOf(r.from)];
          const locked = A.isApproved(r.from);
          const isNow = cov.fromIdx != null && pi >= cov.fromIdx && pi <= cov.endIdx;
          const fallback = n > 0 ? sched[n - 1].rate : 0.8;
          return `<tr class="${isNow ? "rt-now" : ""}">
            <td><b>Kỳ ${esc(p ? p.label : r.from)}</b><span class="sub">${esc(r.from)}</span></td>
            <td class="num mono"><b>${esc(fmt.pct(r.rate))}</b><span class="sub">${esc(otherSide(fmt, party, r.rate))}</span></td>
            <td>${esc(cov.text)}<span class="sub">${cov.closed
              ? cov.closed + " kỳ trong đó đã chốt sổ và đã chi tiền"
              : "chưa kỳ nào trong đó được duyệt"}</span></td>
            <td class="mono">${esc(r.by || "—")}<span class="sub">${esc(String(r.at || "").length > 10 ? fmt.when(r.at) : fmt.date(r.at))}</span></td>
            <td>${r.note ? esc(r.note) : `<span class="dim">—</span>`}${
              isNow ? `<span class="sub">đang áp cho kỳ ${esc(per.label)} · ${esc(fmt.pct(applying))}</span>` : ""}</td>
            <td>${locked
              ? `<span class="chip">đã khoá</span><span class="sub">kỳ đã duyệt — số này khách đã đọc</span>`
              : `<button class="btn sm dang" data-rt-del="${esc(r.from)}" data-rt-back="${fallback}">Xoá mốc</button>`}</td>
          </tr>`;
        }).join("")}</tbody></table></div>`;
    }

    /* ---------- 5. mô phỏng tác động ---------- */
    function simHTML(party, got, cur0) {
      const miss = A.missingFeeds(pi);
      const head = `<div class="panel-head">
        <div>
          <h3>Thử tỷ lệ khác · kỳ ${esc(per.label)}</h3>
          <div class="hint">Tính trên đúng ${fmt.num(got.rows.length)} bản ghi của bên nhận này có doanh thu trong kỳ
          (trên tổng ${fmt.num(got.all)} bản ghi). <b>Kéo thanh trượt không lưu gì cả</b> — bảng tỷ lệ chỉ đổi khi bấm nút lưu.</div>
        </div>
      </div>`;
      if (!got.rows.length) {
        return `<div class="panel">${head}<div class="empty">Kỳ ${esc(per.label)} chưa bản ghi nào của bên nhận này phát sinh doanh thu — chưa có gì để mô phỏng.${
          miss.length ? " Kỳ này còn thiếu " + miss.length + " luồng dữ liệu." : ""}</div></div>`;
      }
      const pct0 = Math.round(cur0.rate * 1000) / 10;
      const s = cur0.split;
      const m = v => ctx.money2(v);
      const row = (lab, note, key, val, fixed) => `<tr>
        <td>${esc(lab)}${note ? `<span class="sub">${esc(note)}</span>` : ""}</td>
        <td class="num mono">${m(val)}</td>
        <td class="num mono"${fixed ? "" : ` data-rt-c="${key}"`}>${fixed ? `<span class="dim">không đổi</span>` : m(val)}</td>
        <td class="num mono"${fixed ? "" : ` data-rt-d="${key}"`}>${fixed ? "—" : "±0"}</td>
      </tr>`;
      return `<div class="panel">${head}
        ${miss.length ? `<div class="warn"><div class="ic">▲</div><div>
          <b>Kỳ ${esc(per.label)} còn thiếu ${miss.length}/${A.feeds.length} luồng</b>
          <span>${esc(miss.map(f => f.short).join(" · "))} chưa nạp, nên doanh thu gộp dưới đây nhỏ hơn sự thật.
          Chênh lệch giữa hai cột vẫn đúng về tỷ lệ, nhưng con số tuyệt đối sẽ lớn hơn khi nạp đủ.</span>
        </div></div>` : ""}
        <div class="set-row">
          <div class="set-name">Kéo thử phần nghệ sĩ giữ
            <span>Đang áp cho kỳ ${esc(per.label)}: ${esc(fmt.pct(cur0.rate))} · ${esc(otherSide(fmt, party, cur0.rate))}</span>
          </div>
          <div class="slider">
            <input type="range" min="1" max="99" step="0.5" value="${pct0}" data-rt-range aria-label="Thử tỷ lệ phần nghệ sĩ giữ">
            <span class="pct" data-rt-pct>${pct0}%</span>
          </div>
          <div>
            <div class="set-out" data-rt-out>${m(s.artist)}</div>
            <span class="rt-out-lab">về tay nghệ sĩ</span>
          </div>
        </div>
        <div class="tb-wrap" style="margin-top:12px"><table class="tb">
          <thead><tr>
            <th>Khoản mục</th>
            <th class="num">Đang áp · ${esc(fmt.pct(cur0.rate))}</th>
            <th class="num">Thử · <span data-rt-head>${pct0}%</span></th>
            <th class="num">Chênh</th>
          </tr></thead>
          <tbody>
            ${row("Doanh thu gộp", fmt.num(got.rows.length) + " bản ghi có doanh thu trong kỳ", "gross", s.gross, true)}
            ${row("− Phí Haustek", fmt.pct(A.cfg.HAUSTEK_FEE) + " trên doanh thu gộp · không phụ thuộc tỷ lệ", "fee", s.fee, true)}
            ${row("= Còn lại để chia", "phần đem chia giữa bên nhận và nghệ sĩ", "net", s.net, true)}
            ${row(party.kind === "label" ? "Phần label giữ" : "Phần Haustek giữ thêm", "vế còn lại của tỷ lệ", "keep", s.keep, false)}
            ${row("− Điểm producer", "trừ vào phần nghệ sĩ, không cộng thêm bên trên", "producer", s.producer, false)}
            ${row("= Về tay nghệ sĩ", "trước khi trừ tạm ứng", "artist", s.artist, false)}
          </tbody></table></div>
        <div class="btnrow rt-note" style="margin-top:12px">
          <button class="btn pri" data-rt-save>Lưu tỷ lệ đang kéo thành mốc mới</button>
          <button class="btn" data-rt-reset>Trả về tỷ lệ đang áp</button>
        </div>
        <div class="rt-note">Đây mới chỉ là phép thử trên màn hình: chưa dòng nào được ghi vào bảng tỷ lệ, chưa kỳ nào đổi số.
        Bấm lưu thì mở hộp thoại đặt mốc — ở đó vẫn phải chọn kỳ hiệu lực, và vẫn chỉ chọn được kỳ chưa duyệt.</div>
      </div>`;
    }

    /* ---------- 6. nghệ sĩ trong label ---------- */
    function rosterHTML(party) {
      if (party.kind !== "label") return "";
      const list = [];
      A.artists.forEach(a => {
        if (a.labelId !== party.id) return;
        list.push({ a, n: A.idxOf(A.byArtist, a.id).length });
      });
      list.sort((x, y) => y.n - x.n || x.a.name.localeCompare(y.a.name, "vi"));
      const shown = list.slice(0, 12);
      const restN = list.length - shown.length;
      const restTracks = list.slice(12).reduce((s, x) => s + x.n, 0);
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Tỷ lệ này đang chia tiền của ai</h3>
            <div class="hint">${fmt.num(list.length)} nghệ sĩ thuộc ${esc(party.name)} · ${fmt.num(party.tracks)} bản ghi.
            Đổi một con số ở đây là đổi phần chia của tất cả những người dưới đây cùng lúc.</div>
          </div>
        </div>
        ${list.length ? `<div class="tb-wrap"><table class="tb">
          <thead><tr><th>Nghệ sĩ</th><th class="num">Bản ghi</th><th class="num">Phần danh mục label</th></tr></thead>
          <tbody>${shown.map(x => `<tr>
            <td><b>${esc(x.a.name)}</b><span class="sub">${esc(x.a.clientId)}</span></td>
            <td class="num mono">${fmt.num(x.n)}</td>
            <td class="num mono">${party.tracks ? esc(fmt.pct(x.n / party.tracks)) : "—"}</td>
          </tr>`).join("")}</tbody></table></div>
          ${restN > 0 ? `<div class="rt-note">Còn ${fmt.num(restN)} nghệ sĩ nữa trong label này (${fmt.num(restTracks)} bản ghi) không liệt kê ở đây — bảng chỉ hiện 12 người nhiều bản ghi nhất.</div>` : ""}`
          : `<div class="empty">Label này chưa có nghệ sĩ nào trong danh mục.</div>`}
      </div>`;
    }

    /* ---------- dựng ---------- */
    root.innerHTML = `<style>${CSS}</style>` + why() + kpis() + `
      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>Bên nhận và tỷ lệ đang áp</h3>
            <div class="hint">Label và nghệ sĩ độc lập — hai loại bên nhận duy nhất có tỷ lệ riêng.
            Dòng viền đỏ là bên nhận đã từng đổi tỷ lệ: kỳ cũ và kỳ mới của họ không cùng một con số.</div>
          </div>
        </div>
        <div class="rt-bar">
          <input type="search" class="search" data-rt-q placeholder="Tìm theo tên hoặc mã Client ID…" value="${esc(ui.q)}" aria-label="Tìm bên nhận">
          <button class="btn sm" data-rt-only="multi">Chỉ bên nhận đã đổi tỷ lệ</button>
          <button class="btn sm" data-rt-only="clear">Bỏ lọc</button>
        </div>
        <div data-rt-list></div>
      </div>
      <div data-rt-drill></div>`;

    const listHost = root.querySelector("[data-rt-list]");
    const drillHost = root.querySelector("[data-rt-drill]");
    const qInput = root.querySelector("[data-rt-q]");

    function paintList() {
      listHost.innerHTML = listHTML(pickRows());
      listHost.querySelectorAll("[data-rt-open]").forEach(b => {
        b.addEventListener("click", () => {
          ui.sel = ui.sel === b.dataset.rtOpen ? null : b.dataset.rtOpen;
          paintList(); paintDrill();
          if (ui.sel) drillHost.scrollIntoView({ block: "nearest" });
        });
      });
    }

    function paintDrill() {
      const party = parties.find(p => p.key === ui.sel);
      if (!party) {
        drillHost.innerHTML = `<div class="panel"><div class="empty">
          Chọn một bên nhận ở bảng trên để xem lịch sử tỷ lệ, thêm mốc mới và thử tác động của tỷ lệ khác lên kỳ ${esc(per.label)}.
        </div></div>`;
        return;
      }
      const sched = A.rates.scheduleFor(party.key);
      const got = collect(A, party, pi);
      const rate = A.rates.rateFor(party.key, pk);
      const cur0 = { rate, split: calc(H, A, got.rows, rate) };

      drillHost.innerHTML = `<div class="drill">
        <div class="drill-head">
          <div>
            <h3>${esc(party.name)} <span class="chip ${party.kind === "label" ? "lbl" : "ind"}">${
              party.kind === "label" ? "Label" : "Nghệ sĩ độc lập"}</span></h3>
            <div class="meta">${esc(party.clientId)} · mã nội bộ ${esc(party.key)} · ${fmt.num(party.tracks)} bản ghi trong danh mục<br>
            Kỳ ${esc(per.label)}: ${esc(fmt.pct(rate))} nghệ sĩ giữ · ${esc(otherSide(fmt, party, rate))} ·
            ${sched.length} mốc trong lịch sử · ${curLocked ? "kỳ này đã duyệt, tỷ lệ đã khoá" : "kỳ này chưa duyệt"}</div>
          </div>
          <div class="btnrow">
            <button class="btn pri" data-rt-add>Thêm mốc tỷ lệ mới</button>
            <button class="btn" data-rt-close>Đóng</button>
          </div>
        </div>
        ${schedHTML(party, sched)}
        <div class="rt-note">Mốc nào đã áp cho một kỳ đã duyệt thì khoá luôn: kỳ đó đã đối chiếu, đã chốt, khách đã đọc con số ấy.
        Muốn sửa thì phải thu hồi duyệt kỳ đó ở màn “Đối chiếu &amp; duyệt” trước — và khách sẽ thấy kỳ đó biến mất khỏi cổng của họ.</div>
        <div class="rt-cols">
          <div>${simHTML(party, got, cur0)}</div>
          <div>${rosterHTML(party)}</div>
        </div>
      </div>`;

      drillHost.querySelectorAll("[data-rt-add]").forEach(b => {
        b.addEventListener("click", () => {
          try { askAddRate(ctx, party, null); } catch (e) { ctx.toast(e.message, "no"); }
        });
      });
      drillHost.querySelectorAll("[data-rt-close]").forEach(b => {
        b.addEventListener("click", () => { ui.sel = null; paintList(); paintDrill(); });
      });
      drillHost.querySelectorAll("[data-rt-del]").forEach(b => {
        b.addEventListener("click", () => {
          const mark = sched.find(r => r.from === b.dataset.rtDel);
          if (!mark) return ctx.toast("Không còn mốc này", "no");
          try { askRemoveRate(ctx, party, mark, Number(b.dataset.rtBack)); }
          catch (e) { ctx.toast(e.message, "no"); }
        });
      });

      /* ---- thanh trượt: cập nhật tại chỗ, không vẽ lại cả ngăn ---- */
      const range = drillHost.querySelector("[data-rt-range]");
      if (!range) return;
      const pctEl = drillHost.querySelector("[data-rt-pct]");
      const headEl = drillHost.querySelector("[data-rt-head]");
      const outEl = drillHost.querySelector("[data-rt-out]");
      const cells = {}, deltas = {};
      drillHost.querySelectorAll("[data-rt-c]").forEach(el => { cells[el.dataset.rtC] = el; });
      drillHost.querySelectorAll("[data-rt-d]").forEach(el => { deltas[el.dataset.rtD] = el; });

      const apply = () => {
        const v = Number(range.value);
        const t = calc(H, A, got.rows, v / 100);
        pctEl.textContent = v + "%";
        headEl.textContent = v + "%";
        outEl.textContent = ctx.money2(t.artist);
        ["keep", "producer", "artist"].forEach(k => {
          if (cells[k]) cells[k].textContent = ctx.money2(t[k]);
          if (!deltas[k]) return;
          const d = t[k] - cur0.split[k];
          deltas[k].textContent = Math.abs(d) < 0.005 ? "±0" : (d > 0 ? "+" : "−") + ctx.money2(Math.abs(d));
          deltas[k].className = "num mono " + (Math.abs(d) < 0.005 ? "dim" : (d > 0 ? "up" : "down"));
        });
      };
      range.addEventListener("input", apply);

      const save = drillHost.querySelector("[data-rt-save]");
      if (save) save.addEventListener("click", () => {
        try { askAddRate(ctx, party, Number(range.value)); } catch (e) { ctx.toast(e.message, "no"); }
      });
      const reset = drillHost.querySelector("[data-rt-reset]");
      if (reset) reset.addEventListener("click", () => {
        range.value = String(Math.round(cur0.rate * 1000) / 10);
        apply();
      });
    }

    /* Gõ tìm chỉ vẽ lại bảng bên nhận — vẽ lại cả màn hình là mất luôn ô
       đang gõ dở và ngăn lịch sử đang mở. */
    qInput.addEventListener("input", () => { ui.q = qInput.value; paintList(); });
    const onlyBtns = root.querySelectorAll("[data-rt-only]");
    onlyBtns.forEach(b => {
      b.addEventListener("click", () => {
        ui.only = b.dataset.rtOnly === "multi";
        if (!ui.only) { ui.q = ""; qInput.value = ""; }
        onlyBtns.forEach(x => x.classList.toggle("pri", (x.dataset.rtOnly === "multi") === ui.only));
        paintList();
      });
    });
    onlyBtns.forEach(x => x.classList.toggle("pri", (x.dataset.rtOnly === "multi") === ui.only));

    paintList();
    paintDrill();
  }
});

})();
