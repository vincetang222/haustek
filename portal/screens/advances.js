"use strict";
/* =====================================================================
   MÀN HÌNH: TẠM ỨNG & THU HỒI
   ---------------------------------------------------------------------
   Tạm ứng là tiền Haustek đã đưa trước. Bên nào đã nhận thì tiền kỳ này
   của họ KHÔNG về tay: nó đi trừ dần vào khoản đã ứng cho tới khi hết.
   Màn hình nào hiện "số tiền kỳ này" mà bỏ qua chặng này là đang hứa với
   người ta một khoản họ sẽ không nhận được — và lời hứa đó chỉ vỡ ra vào
   ngày họ không thấy tiền vào tài khoản.

   Ba con số rất dễ lẫn, nên gọi tên rạch ròi ở khắp file:
     opening   — ĐÃ ỨNG, số gốc ghi trong hợp đồng
     recouped  — ĐÃ THU HỒI được, cộng dồn qua các kỳ đã duyệt
     balance   — CÒN PHẢI THU HỒI = opening − recouped

   Chỉ kỳ ĐÃ DUYỆT mới trừ được đồng nào: runPayout trong lõi chỉ chạy
   đúng một lần, lúc duyệt kỳ. Nên mọi ước tính ở đây đều bám vào bảng
   chi trả của kỳ đã duyệt, không bám vào doanh thu kỳ đang làm dở.
   ===================================================================== */
(function () {

const CSS = `
.ad-bar{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:11px}
.ad-count{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.75;margin-bottom:9px}
.ad-sort{cursor:pointer;user-select:none}
.ad-sort:hover{color:var(--ink)}
.ad-prog{min-width:116px}
.ad-prog b{font-family:var(--mono);font-size:11.5px;font-variant-numeric:tabular-nums}
.ad-prog .rank-bar{margin-top:5px;height:4px}
.ad-prog.done .rank-bar i{background:var(--pos)}
.ad-prog.slow .rank-bar i{background:var(--red-bright)}
.ad-done td{background:#FAFCFA}
.ad-live{display:block;font-family:var(--mono);font-size:10.5px;color:var(--teal);margin-top:7px;line-height:1.6}
.ad-note{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.8;margin-top:10px}
.ad-cols{display:grid;gap:12px;grid-template-columns:1fr}
@media(min-width:1120px){.ad-cols{grid-template-columns:1.05fr 1fr}}
.ad-acts{display:flex;gap:6px;justify-content:flex-end}
.ad-k{margin-left:6px}
`;

/* Bao nhiêu bên nhận đổ vào select một lần. 900 nghệ sĩ nhét hết vào một
   thẻ select là danh sách không ai cuộn nổi — cắt ở 200 và bắt gõ tìm. */
const OPT_LIMIT = 200;

const fold = s => String(s == null ? "" : s).toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d");

/* Trạng thái riêng của màn hình, để ngoài DOM: sau ctx.refresh() (thêm,
   sửa, xoá một khoản) người dùng quay lại đúng chỗ đang đứng. */
const ui = { q: "", sort: "balance", dir: -1 };

/* ---------------------------------------------------------------------
   QUÉT BẢNG CHI TRẢ CỦA CÁC KỲ ĐÃ DUYỆT — một vòng duy nhất, lấy ba thứ:
     · tổng thu hồi từng kỳ (để so kỳ này với kỳ trước)
     · số bên bị trừ từng kỳ
     · mức thu hồi GẦN NHẤT của từng bên — cơ sở duy nhất để ước tính
       còn bao nhiêu kỳ nữa mới sạch nợ
   Duyệt kỳ theo thứ tự tăng dần nên kỳ sau ghi đè kỳ trước: cuối vòng,
   pace giữ đúng mức của kỳ gần nhất mà bên đó thực sự bị trừ.
   --------------------------------------------------------------------- */
function scanPayouts(A, cents) {
  const byPeriod = [], pace = new Map();
  A.periods.forEach(p => {
    if (!A.isApproved(p.k)) return;
    const rows = A.payoutOf(p.k) || [];
    let recoup = 0, parties = 0, earned = 0, below = 0, belowSum = 0, carried = 0;
    rows.forEach(r => {
      earned += r.earned || 0;
      /* Dòng "P:*" là điểm producer chưa gắn được danh tính — nó nằm lại
         nguyên cục chứ không phải một bên nhận rơi xuống dưới ngưỡng.
         Đếm nhầm nó vào là con số dồn sang kỳ sau phồng lên gấp mấy trăm lần. */
      if (r.kind !== "producer") {
        if (r.carryOut > 0.005) { below++; belowSum += r.carryOut; }
        if (r.carryIn > 0.005) carried++;
      }
      if (!(r.recoup > 0.005)) return;
      recoup += r.recoup; parties++;
      pace.set(r.partyKey, { amount: r.recoup, period: p });
    });
    byPeriod.push({ p, recoup: cents(recoup), parties, earned: cents(earned),
                    below, belowSum: cents(belowSum), carried, rows });
  });
  return { byPeriod, pace };
}

/* Dòng bảng: dữ liệu thô của lõi cộng thêm phần chỉ màn hình này cần. */
function buildRows(A, pace) {
  return A.advances.list().map(a => {
    const pc = pace.get(a.partyKey) || null;
    const done = a.balance <= 0.005;
    const pct = a.opening > 0 ? Math.min(a.recouped / a.opening, 1) : (done ? 1 : 0);
    const id = +a.partyKey.slice(2);
    const who = a.kind === "label" ? null : A.artists[id];
    return {
      partyKey: a.partyKey, kind: a.kind, name: a.name, clientId: a.clientId,
      opening: a.opening, recouped: a.recouped, balance: a.balance, note: a.note,
      done, pct, pace: pc,
      /* Không có kỳ nào từng trừ được đồng nào thì thà nói thẳng là chưa
         ước tính được, còn hơn bịa ra một con số bằng doanh thu kỳ dở. */
      periodsLeft: done ? 0 : (pc ? Math.max(1, Math.ceil(a.balance / pc.amount)) : null),
      home: who ? (who.labelId >= 0 ? A.labels[who.labelId].name : "độc lập") : null,
      f: fold(a.name + " " + a.clientId + " " + a.partyKey)
    };
  });
}

/* Ví dụ bằng số phải lấy từ một dòng THẬT trong bảng chi trả đã chốt —
   số bịa ra thì người đọc không đối chiếu lại được với màn hình chi trả. */
function pickExample(scan) {
  for (let n = scan.byPeriod.length - 1; n >= 0; n--) {
    const e = scan.byPeriod[n];
    const hits = e.rows.filter(r => r.recoup > 0.005);
    if (!hits.length) continue;
    /* Dòng dẫn ra phải nói được càng nhiều chặng càng tốt: vẫn còn nợ (thấy
       chặng "còn mấy kỳ nữa") và vẫn còn tiền về tay (thấy chặng ngưỡng chi
       trả). Dòng bị trừ sạch không còn đồng nào là ví dụ cụt. */
    const score = r => (r.advanceLeft > 0.005 ? 2 : 0) + (r.payable > 0.005 ? 1 : 0);
    let best = hits[0];
    for (const r of hits) if (score(r) > score(best)) best = r;
    return { entry: e, row: best };
  }
  return null;
}

/* ---------------------------------------------------------------------
   HỘP THOẠI THÊM / SỬA
   --------------------------------------------------------------------- */
async function askAdvance(ctx, existing) {
  const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
  const rate = A.fx.rateFor(ctx.periodKey);
  const have = new Map();
  A.advances.list().forEach(a => have.set(a.partyKey, a));
  const vnd = v => fmt.vnd(v, rate);

  const picker = existing ? "" :
    '<label class="fld">Kiểu bên nhận</label>'
    + '<select data-field="kind" style="max-width:100%">'
    + '<option value="label">Label — ' + A.labels.length + ' đơn vị</option>'
    + '<option value="artist">Nghệ sĩ — ' + fmt.num(A.artists.length) + ' người</option>'
    + '</select>'
    + '<label class="fld" style="margin-top:13px">Tìm bên nhận</label>'
    + '<input type="search" data-ad-q placeholder="Gõ tên hoặc mã Client ID để thu hẹp…" style="width:100%">'
    + '<label class="fld" style="margin-top:13px">Bên nhận</label>'
    + '<select data-field="party" size="6" style="max-width:100%;width:100%;font-size:11px"></select>'
    + '<span class="ad-live" data-ad-live></span>';

  const res = await ctx.modal({
    title: existing ? "Sửa khoản tạm ứng · " + existing.name : "Thêm khoản tạm ứng",
    hint: existing
      ? "Đang thu hồi được <b>" + esc(fmt.usd0(existing.recouped)) + "</b> trên " + esc(fmt.usd0(existing.opening))
        + " đã ứng. Hạ mức ứng xuống dưới con số đã thu hồi thì dư nợ về 0 ngay và kỳ tới không trừ nữa.<br>"
        + "Các kỳ <b>đã duyệt</b> giữ nguyên con số đã chốt — sửa ở đây chỉ ăn vào những kỳ chưa chạy chi trả."
      : "Khoản ứng ghi ở đây sẽ được trừ dần vào tiền của bên nhận, bắt đầu từ kỳ được duyệt kế tiếp. "
        + "Từ lúc lưu, mọi con số kỳ này của họ hiện ra sẽ là <b>số sau khi trừ</b>, không phải số họ nhận được.",
    body: picker
      + '<label class="fld" style="margin-top:13px">Số tiền đã ứng (USD)</label>'
      + '<input type="number" data-field="amount" min="1" step="1" style="width:170px" value="'
      + esc(existing ? existing.opening : "") + '" placeholder="ví dụ 12000">'
      + '<span class="ad-live" data-ad-amt></span>'
      + '<label class="fld" style="margin-top:13px">Ghi chú</label>'
      + '<textarea data-field="note" rows="3" placeholder="ví dụ: Tạm ứng sản xuất EP — hợp đồng ký 12.08.2026">'
      + esc(existing ? existing.note : "") + '</textarea>'
      + '<p class="note" style="margin-top:8px">Ghi chú là thứ duy nhất người mở lại sổ sáu tháng sau còn có để biết khoản này ở đâu ra. '
      + 'Mọi thay đổi ở đây đều vào nhật ký kèm thời điểm.</p>',
    ok: existing ? "Lưu thay đổi" : "Lưu khoản tạm ứng",
    onMount(bg) {
      const amtEl = bg.querySelector('[data-field="amount"]');
      const amtLive = bg.querySelector("[data-ad-amt]");
      const paintAmt = () => {
        const raw = String(amtEl.value).trim();
        const v = Number(raw.replace(",", "."));
        amtLive.textContent = v > 0 ? "≈ " + vnd(v) + " theo tỷ giá kỳ " + ctx.period.label
          : (raw ? "Số tiền phải lớn hơn 0." : "Nhập số tiền đã ứng, tính bằng USD.");
      };
      amtEl.addEventListener("input", paintAmt);
      paintAmt();
      if (existing) return;

      const kindEl = bg.querySelector('[data-field="kind"]');
      const partyEl = bg.querySelector('[data-field="party"]');
      const qEl = bg.querySelector("[data-ad-q]");
      const live = bg.querySelector("[data-ad-live]");

      let matched = 0;
      function paintLive() {
        const total = matched, key = partyEl.value;
        const old = key ? have.get(key) : null;
        live.textContent = !key
          ? "Không có bên nhận nào khớp — sửa lại ô tìm."
          : old
            ? "Bên này đã có khoản ứng " + fmt.usd0(old.opening) + " (còn phải thu hồi "
              + fmt.usd0(old.balance) + "). Lưu ở đây là ĐÈ LÊN số cũ, không cộng thêm."
            : "Đang hiện " + Math.min(total, OPT_LIMIT) + "/" + total + " bên nhận khớp"
              + (total > OPT_LIMIT ? " — còn " + (total - OPT_LIMIT) + " người nữa, gõ thêm vào ô tìm." : ".");
      }
      function fill() {
        const isLabel = kindEl.value === "label";
        const all = isLabel ? A.labels : A.artists;
        const needle = fold(qEl.value.trim());
        const hit = [];
        for (let i = 0; i < all.length; i++) {
          const p = all[i];
          if (needle && fold(p.name + " " + p.clientId).indexOf(needle) < 0) continue;
          hit.push(p);
        }
        /* Select nhiều dòng (size>1) mở ra KHÔNG chọn sẵn gì cả — không đánh
           dấu dòng đầu thì bấm Lưu ngay sẽ báo "phải chọn một bên nhận". */
        partyEl.innerHTML = hit.slice(0, OPT_LIMIT).map((p, n) => {
          const old = have.get(p.key);
          return '<option value="' + esc(p.key) + '"' + (n === 0 ? " selected" : "") + ">" + esc(p.name) + " · " + esc(p.clientId)
            + (isLabel ? "" : " · " + esc(p.labelId >= 0 ? A.labels[p.labelId].name : "độc lập"))
            + (old ? " · đang nợ " + esc(fmt.usd0(old.balance)) : "") + "</option>";
        }).join("");
        matched = hit.length;
        paintLive();
      }
      kindEl.addEventListener("change", () => { qEl.value = ""; fill(); });
      qEl.addEventListener("input", fill);
      partyEl.addEventListener("change", paintLive);
      fill();
    }
  });
  if (!res) return;

  const amount = Number(String(res.amount == null ? "" : res.amount).replace(",", ".").replace(/[^\d.]/g, ""));
  if (!(amount > 0)) { ctx.toast("Số tiền tạm ứng phải lớn hơn 0", "no"); return; }
  const key = existing ? existing.partyKey : String(res.party || "");
  if (!key) { ctx.toast("Phải chọn một bên nhận", "no"); return; }
  try {
    A.advances.set(key, Math.round(amount * 100) / 100, String(res.note || "").trim());
    ctx.toast((existing ? "Đã sửa khoản ứng của " : "Đã ghi khoản ứng ") + A.partyName(key)
      + " · " + ctx.fmt.usd0(amount), "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

async function askRemove(ctx, row) {
  const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
  const ok = await ctx.confirm(
    "Xoá khoản tạm ứng của " + row.name + "?",
    "Đã ứng <b>" + esc(fmt.usd0(row.opening)) + "</b>, đã thu hồi được <b>" + esc(fmt.usd0(row.recouped))
      + "</b>, còn phải thu hồi <b>" + esc(fmt.usd0(row.balance)) + "</b>.<br>"
      + "Xoá xong, từ kỳ duyệt kế tiếp tiền của bên này về thẳng tay họ, không trừ đồng nào nữa. "
      + (row.recouped > 0.005
          ? "Phần đã trừ trong các kỳ đã duyệt vẫn nằm nguyên trong bảng chi trả của những kỳ đó — "
            + "nhưng lịch sử thu hồi sẽ biến mất khỏi màn hình này, không dựng lại được."
          : "Bên này chưa bị trừ đồng nào nên chưa có gì phải hoàn."),
    "Xoá khoản ứng", true);
  if (!ok) return;
  try {
    A.advances.remove(row.partyKey);
    ctx.toast("Đã xoá khoản tạm ứng của " + row.name, "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

/* =====================================================================
   MÀN HÌNH
   ===================================================================== */
HAUSTEK.registerScreen({
  id: "advances",
  nav: "Tạm ứng & thu hồi",
  group: "Tiền",
  title: "Tạm ứng và thu hồi",
  subtitle: "Bên nào đã nhận tạm ứng thì tiền kỳ này của họ <b>đi trừ dần vào khoản đã ứng, chưa về tay họ</b>. "
          + "Bỏ qua chặng này là hiện lên một con số người ta tưởng sắp nhận được — rồi đến ngày chi trả không thấy đâu.",

  badge(ctx) {
    const n = ctx.admin.advances.list().filter(a => a.balance > 0.005).length;
    return n ? String(n) : "";
  },

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt, cents = ctx.H.cents;
    const per = ctx.period, pk = ctx.periodKey;
    const scan = scanPayouts(A, cents);
    const rows = buildRows(A, scan.pace);

    const totalBalance = A.advances.total();
    const totalOpening = cents(rows.reduce((s, r) => s + r.opening, 0));
    const totalRecouped = cents(rows.reduce((s, r) => s + r.recouped, 0));
    const owing = rows.filter(r => !r.done);
    const cleared = rows.length - owing.length;
    const nLabel = rows.filter(r => r.kind === "label").length;

    const curEntry = scan.byPeriod.find(x => x.p.k === pk) || null;
    const curAt = scan.byPeriod.indexOf(curEntry);
    const prevEntry = curAt > 0 ? scan.byPeriod[curAt - 1] : null;
    const lastEntry = scan.byPeriod.length ? scan.byPeriod[scan.byPeriod.length - 1] : null;
    /* Nhịp thu hồi của kỳ đã duyệt gần nhất — dùng để nói "còn mấy kỳ nữa". */
    const paceAll = lastEntry ? lastEntry.recoup : 0;
    const periodsAll = paceAll > 0.005 ? Math.ceil(totalBalance / paceAll) : null;
    const shareOfEarned = lastEntry && lastEntry.earned > 0 ? totalBalance / lastEntry.earned : null;

    /* ---------- 1. thẻ số ---------- */
    function kpis() {
      const curVal = curEntry ? ctx.money(curEntry.recoup) : "—";
      let curSub;
      if (!curEntry) {
        curSub = "Kỳ " + esc(per.label) + " chưa duyệt — chi trả chưa chạy, chưa trừ được đồng nào."
          + (lastEntry ? "<br>Kỳ đã duyệt gần nhất (" + esc(lastEntry.p.label) + ") thu hồi được "
              + ctx.money(lastEntry.recoup) + "." : "");
      } else {
        const d = prevEntry ? curEntry.recoup - prevEntry.recoup : null;
        curSub = fmt.num(curEntry.parties) + " bên bị trừ trong kỳ<br>"
          + (prevEntry
              ? (Math.abs(d) < 0.005 ? "bằng đúng kỳ " + esc(prevEntry.p.label)
                  : (d > 0 ? "+" : "−") + ctx.money(Math.abs(d)) + " so với kỳ " + esc(prevEntry.p.label)
                    + (prevEntry.recoup > 0 ? " (" + fmt.pct(Math.abs(d) / prevEntry.recoup) + ")" : ""))
              : "kỳ đã duyệt đầu tiên — chưa có kỳ trước để so");
      }
      return `<div class="kpis">
        <div class="kpi hero">
          <div class="lab">Còn phải thu hồi</div>
          <div class="val">${ctx.money(totalBalance)}</div>
          <div class="sub">${fmt.num(owing.length)} bên còn dư nợ${
            shareOfEarned != null ? " · bằng " + fmt.pct(shareOfEarned) + " tổng tiền chia trong kỳ " + esc(lastEntry.p.label) : ""}<br>${
            periodsAll != null
              ? "theo nhịp thu hồi kỳ " + esc(lastEntry.p.label) + " (" + ctx.money(paceAll) + "/kỳ) thì còn khoảng <b>" + periodsAll + " kỳ</b> nữa mới sạch"
              : "chưa kỳ đã duyệt nào trừ được đồng nào — chưa ước tính được nhịp thu hồi"}</div>
        </div>
        <div class="kpi">
          <div class="lab">Bên đang còn nợ</div>
          <div class="val">${fmt.num(owing.length)}</div>
          <div class="sub">trên ${fmt.num(rows.length)} bên có khoản ứng · ${fmt.num(nLabel)} label · ${fmt.num(rows.length - nLabel)} nghệ sĩ<br>tiền kỳ này của họ chưa về tay, đang đi trừ nợ</div>
        </div>
        <div class="kpi good">
          <div class="lab">Đã thu hồi xong</div>
          <div class="val">${fmt.num(cleared)}</div>
          <div class="sub">${rows.length ? fmt.pct(cleared / rows.length) + " số bên có khoản ứng" : "—"}<br>từ kỳ sạch nợ trở đi, tiền của họ về thẳng tay</div>
        </div>
        <div class="kpi">
          <div class="lab">Đã thu hồi được</div>
          <div class="val">${ctx.money(totalRecouped)}</div>
          <div class="sub">${totalOpening > 0 ? fmt.pct(totalRecouped / totalOpening) + " trên " + ctx.money(totalOpening) + " đã ứng" : "—"}<br>cộng dồn qua ${scan.byPeriod.length} kỳ đã duyệt</div>
        </div>
        <div class="kpi ${curEntry ? "" : "bad"}">
          <div class="lab">Thu hồi trong kỳ ${esc(per.label)}</div>
          <div class="val">${curVal}</div>
          <div class="sub">${curSub}</div>
        </div>
      </div>`;
    }

    /* ---------- 2. thu hồi diễn ra thế nào ---------- */
    function howHTML() {
      const ex = pickExample(scan);
      const min = A.cfg.PAYOUT_MIN;
      const steps = [
        ["Kiếm được kỳ này", "Phần của bên nhận sau khi trừ phí Haustek, phần label giữ (hoặc phần Haustek giữ thêm nếu độc lập) và điểm producer — cộng cả phần dồn từ kỳ trước nếu có."],
        ["Trừ vào dư nợ tạm ứng", "Trừ được bao nhiêu trừ bấy nhiêu, tối đa bằng dư nợ còn lại. Đây là chỗ tiền dừng lại: nó về Haustek để bù khoản đã ứng, chưa về tay bên nhận."],
        ["Phần còn lại so với ngưỡng chi trả", "Ngưỡng đang đặt là " + fmt.usd0(min) + ". Trên ngưỡng thì vào danh sách chi của kỳ chi trả tới."],
        ["Dưới ngưỡng thì dồn sang kỳ sau", "Không mất đồng nào — số đó cộng thẳng vào phần kiếm được của kỳ sau, và lại chạy đúng ba bước trên."]
      ];
      let exHTML;
      if (!ex) {
        exHTML = `<div class="empty">Chưa kỳ đã duyệt nào trừ được đồng nào vào tạm ứng — chưa có dòng thật nào để dẫn ra làm ví dụ.</div>`;
      } else {
        const r = ex.row, e = ex.entry;
        const gross = cents(r.earned + r.carryIn);
        const after = cents(gross - r.recoup);
        /* Dòng chính hầu như luôn bị trừ sạch — đó mới là chuyện thường ngày.
           Nên hai chặng cuối phải mượn số ở chỗ khác mới nói được bằng số. */
        const clearedRows = e.rows.filter(x => x.kind !== "producer" && x.recoup > 0.005 && x.payable > 0.005);
        const cleared = clearedRows[0] || null, clearedN = clearedRows.length;
        let carryEx = null;
        for (let n = scan.byPeriod.length - 1; n >= 0 && !carryEx; n--)
          if (scan.byPeriod[n].below > 0) carryEx = { e: scan.byPeriod[n], next: scan.byPeriod[n + 1] || null };
        const step = (cls, lab, val, note) => `<div class="chain-step${cls ? " " + cls : ""}">
          <div class="chain-top"><span class="chain-name">${esc(lab)}</span><span class="chain-val">${ctx.money2(val)}</span></div>
          <div class="chain-note">${note}</div>
        </div>`;
        exHTML = `<div class="ad-ex ad-note" style="margin-top:0">Lấy nguyên một dòng trong bảng chi trả kỳ
          <b>${esc(e.p.label)}</b> — kỳ đã duyệt gần nhất có phát sinh thu hồi. Đây là số thật, đối chiếu lại được ở màn “Chi trả”.</div>
        <div class="chain">
          ${step("", "Kiếm được kỳ " + e.p.label, r.earned,
            esc(A.partyName(r.partyKey)) + " · " + esc(A.partyClientId(r.partyKey))
            + " · " + (r.kind === "label" ? "label" : "nghệ sĩ"))}
          ${r.carryIn > 0.005 ? step("", "+ Dồn từ kỳ trước", r.carryIn, "kỳ trước dưới ngưỡng nên để lại, không mất") : ""}
          ${step("out", "− Trừ vào dư nợ tạm ứng", r.recoup,
            "sau lần trừ này còn phải thu hồi " + esc(fmt.usd0(r.advanceLeft))
            + (r.advanceLeft > 0.005 ? " — chưa hết nợ" : " — vừa sạch nợ ở kỳ này"))}
          ${step(r.payable > 0.005 ? "final" : "", "= Còn lại sau khi trừ", after,
            r.payable > 0.005
              ? "trên ngưỡng " + esc(fmt.usd0(min)) + " → vào danh sách chi của kỳ chi trả tới"
              : (r.carryOut > 0.005
                  ? "dưới ngưỡng " + esc(fmt.usd0(min)) + " → dồn sang kỳ sau, còn nguyên " + esc(fmt.usd0(r.carryOut))
                  : "kỳ này bị trừ hết vào khoản tạm ứng — không còn đồng nào để chi, cũng không có gì để dồn"))}
        </div>
        ${cleared ? `<div class="ad-note">Cũng kỳ ${esc(e.p.label)}, <b>${fmt.num(clearedN)}</b> bên trả xong khoản ứng —
          ví dụ ${esc(A.partyName(cleared.partyKey))}: bị trừ nốt ${ctx.money2(cleared.recoup)}, phần dư
          ${ctx.money2(cleared.payable)} trên ngưỡng ${esc(fmt.usd0(min))} nên về tay họ ngay kỳ đó.</div>` : ""}
        ${carryEx ? `<div class="ad-note">Bước 4 không phải chuyện lý thuyết: kỳ ${esc(carryEx.e.p.label)} có
          <b>${fmt.num(carryEx.e.below)}</b> bên rơi xuống dưới ngưỡng, tổng ${ctx.money2(carryEx.e.belowSum)} dồn sang kỳ sau${
          carryEx.next ? " — và kỳ " + esc(carryEx.next.p.label) + " có " + fmt.num(carryEx.next.carried)
            + " bên mở đầu bằng phần dồn đó" : ""}. Không đồng nào rơi ra ngoài sổ.</div>`
          : `<div class="ad-note">Chưa kỳ đã duyệt nào có bên rơi xuống dưới ngưỡng ${esc(fmt.usd0(min))} — nhánh dồn sang kỳ sau vẫn có đó, chỉ là chưa dùng tới.</div>`}`;
      }
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Thu hồi diễn ra thế nào</h3>
            <div class="hint">Bốn bước, chạy đúng một lần cho mỗi bên nhận vào lúc duyệt kỳ. Chưa duyệt kỳ thì chưa trừ đồng nào.</div>
          </div>
        </div>
        <div class="steps">
          ${steps.map((s, i) => `<div class="step${i === 1 ? " run" : ""}">
            <div class="n">${i + 1}</div>
            <div><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>
          </div>`).join("")}
        </div>
        <div style="margin-top:14px">${exHTML}</div>
      </div>`;
    }

    /* ---------- 3. bảng tạm ứng ---------- */
    const SORTS = {
      name: (a, b) => a.name.localeCompare(b.name, "vi"),
      opening: (a, b) => a.opening - b.opening,
      recouped: (a, b) => a.recouped - b.recouped,
      balance: (a, b) => a.balance - b.balance,
      pct: (a, b) => a.pct - b.pct,
      left: (a, b) => (a.periodsLeft == null ? 1e9 : a.periodsLeft) - (b.periodsLeft == null ? 1e9 : b.periodsLeft)
    };
    function pickRows() {
      const q = fold(ui.q).trim();
      const out = q ? rows.filter(r => r.f.indexOf(q) >= 0) : rows.slice();
      const cmp = SORTS[ui.sort] || SORTS.balance;
      out.sort((a, b) => cmp(a, b) * ui.dir || b.balance - a.balance);
      return out;
    }
    function th(k, lab, num) {
      const on = ui.sort === k;
      return `<th class="ad-sort${num ? " num" : ""}" data-ad-sort="${k}">${esc(lab)}${on ? (ui.dir > 0 ? " ↑" : " ↓") : ""}</th>`;
    }
    function tableHTML(list) {
      const count = `<div class="ad-count">Đang hiện ${fmt.num(list.length)}/${fmt.num(rows.length)} bên nhận có khoản tạm ứng${
        ui.q ? " khớp “" + esc(ui.q) + "”" : ""}. Mặc định xếp theo số còn phải thu hồi giảm dần —
        đầu bảng là chỗ nhiều tiền đang treo nhất. Bấm vào tiêu đề cột để đổi cách xếp.</div>`;
      if (!rows.length) return `<div class="empty">Chưa có khoản tạm ứng nào trong sổ. Bấm “Thêm khoản tạm ứng” để ghi khoản đầu tiên.</div>`;
      if (!list.length) return count + `<div class="empty">Không có bên nhận nào khớp “${esc(ui.q)}”.</div>`;
      return count + `<div class="tb-wrap"><table class="tb">
        <thead><tr>
          ${th("name", "Bên nhận", false)}
          ${th("opening", "Đã ứng", true)}
          ${th("recouped", "Đã thu hồi", true)}
          ${th("balance", "Còn phải thu hồi", true)}
          ${th("pct", "Tiến độ", false)}
          ${th("left", "Còn mấy kỳ nữa", false)}
          <th></th>
        </tr></thead>
        <tbody>${list.map(r => {
          const bar = Math.round(r.pct * 100);
          const cls = r.done ? "done" : (r.pct < 0.15 ? "slow" : "");
          return `<tr class="${r.done ? "ad-done" : ""}">
            <td>
              <b>${esc(r.name)}</b>
              <span class="chip ad-k ${r.kind === "label" ? "lbl" : "ind"}">${r.kind === "label" ? "Label" : "Nghệ sĩ"}</span>
              <span class="sub">${esc(r.clientId)}${r.home ? " · " + esc(r.home) : ""}${r.note ? " · " + esc(r.note) : ""}</span>
            </td>
            <td class="num mono">${ctx.money(r.opening)}</td>
            <td class="num mono">${ctx.money(r.recouped)}<span class="sub">${
              r.opening > 0 ? esc(fmt.pct(r.recouped / r.opening)) + " khoản ứng" : "—"}</span></td>
            <td class="num mono">${ctx.money(r.balance)}<span class="sub">${
              totalBalance > 0 && !r.done ? esc(fmt.pct(r.balance / totalBalance)) + " tổng dư nợ" : "—"}</span></td>
            <td class="ad-prog ${cls}">
              <b>${bar}%</b>
              <div class="rank-bar"><i style="width:${bar}%"></i></div>
            </td>
            <td class="mono">${r.done
              ? `<span class="chip ok">đã thu hồi xong</span>`
              : (r.periodsLeft == null
                  ? `<span class="dim">chưa ước tính được</span><span class="sub">chưa kỳ đã duyệt nào trừ được đồng nào của bên này</span>`
                  : `≈ ${r.periodsLeft} kỳ<span class="sub">theo mức kỳ ${esc(r.pace.period.label)}: ${ctx.money(r.pace.amount)}</span>`)}</td>
            <td><div class="ad-acts">
              <button class="btn sm" data-ad-edit="${esc(r.partyKey)}">Sửa</button>
              <button class="btn sm dang" data-ad-del="${esc(r.partyKey)}">Xoá</button>
            </div></td>
          </tr>`;
        }).join("")}</tbody></table></div>`;
    }

    /* ---------- dựng ---------- */
    root.innerHTML = `<style>${CSS}</style>` + kpis() + `
      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>Các khoản tạm ứng đang theo dõi</h3>
            <div class="hint">Tiền Haustek đã đưa trước, đang thu hồi dần qua từng kỳ được duyệt.
            Con số ở đây là USD gốc, quy đổi theo tỷ giá kỳ đang chọn khi xem bằng VND.</div>
          </div>
          <div class="btnrow">
            <button class="btn pri" data-ad-add>Thêm khoản tạm ứng</button>
          </div>
        </div>
        <div class="ad-bar">
          <input type="search" class="search" data-ad-q placeholder="Tìm theo tên hoặc mã Client ID…" value="${esc(ui.q)}" aria-label="Tìm bên nhận">
          <button class="btn sm" data-ad-clear>Bỏ lọc</button>
        </div>
        <div data-ad-list></div>
        <div class="ad-note">Chỉ kỳ đã duyệt mới trừ được: bảng chi trả chạy đúng một lần, lúc duyệt kỳ.
        Sửa hay xoá một khoản ứng ở đây không đụng tới con số của các kỳ đã chốt — khách đã đọc và đã nhận theo số đó.</div>
      </div>` + howHTML();

    const host = root.querySelector("[data-ad-list]");
    const qInput = root.querySelector("[data-ad-q]");

    function paint() {
      host.innerHTML = tableHTML(pickRows());
      host.querySelectorAll("[data-ad-sort]").forEach(el => {
        el.addEventListener("click", () => {
          const k = el.dataset.adSort;
          if (ui.sort === k) ui.dir = -ui.dir;
          else { ui.sort = k; ui.dir = k === "name" ? 1 : -1; }
          paint();
        });
      });
      host.querySelectorAll("[data-ad-edit]").forEach(b => {
        b.addEventListener("click", () => {
          const r = rows.find(x => x.partyKey === b.dataset.adEdit);
          if (!r) return ctx.toast("Khoản này không còn trong sổ", "no");
          try { askAdvance(ctx, r); } catch (e) { ctx.toast(e.message, "no"); }
        });
      });
      host.querySelectorAll("[data-ad-del]").forEach(b => {
        b.addEventListener("click", () => {
          const r = rows.find(x => x.partyKey === b.dataset.adDel);
          if (!r) return ctx.toast("Khoản này không còn trong sổ", "no");
          try { askRemove(ctx, r); } catch (e) { ctx.toast(e.message, "no"); }
        });
      });
    }

    /* Gõ tìm chỉ vẽ lại bảng — vẽ lại cả màn hình là mất luôn ô đang gõ dở. */
    qInput.addEventListener("input", () => { ui.q = qInput.value; paint(); });
    root.querySelector("[data-ad-clear]").addEventListener("click", () => {
      ui.q = ""; qInput.value = ""; paint(); qInput.focus();
    });
    root.querySelector("[data-ad-add]").addEventListener("click", () => {
      try { askAdvance(ctx, null); } catch (e) { ctx.toast(e.message, "no"); }
    });

    paint();
  }
});

})();
