"use strict";
/* =====================================================================
   MÀN HÌNH: CÂU HỎI CÒN TREO
   ---------------------------------------------------------------------
   Bản mẫu này chạy được từ đầu đến cuối, nhưng có mấy chỗ nó đang ĐOÁN.
   Đoán trúng thì không ai để ý. Đoán trật thì hỏng ở tầng dữ liệu, tức
   là sửa schema, chạy lại migration, tính lại các kỳ đã chốt — chứ
   không phải sửa vài dòng giao diện.
   Nên chỗ đoán không được nằm rải rác trong ghi chú của lập trình viên.
   Nó phải là một trang, có ô nhập, có nút lưu, xuất ra được một file
   đem thẳng sang cho người viết migration.

   Ba thứ màn hình này phải làm cho ra:
     1. nói rõ VÌ SAO câu hỏi quan trọng — không ai chịu ngồi trả lời
        bảy câu hỏi kỹ thuật nếu không thấy mất gì khi trả lời sai;
     2. nói rõ bản mẫu đang đoán gì — người đọc chỉ cần xác nhận hoặc
        bác bỏ, nhẹ hơn nhiều so với bắt họ tự nghĩ ra câu trả lời;
     3. giữ lại câu trả lời và xuất được ra ngoài.

   Lưu bằng nút, không tự lưu khi gõ: mỗi lần A.answers.set() là một
   dòng nhật ký và một lần ghi xuống localStorage. Tự lưu theo từng phím
   thì nhật ký kín đặc, không còn đọc được nữa.
   ===================================================================== */
(function () {

const CSS = `
.qs-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.qs-bar .note{flex:1;min-width:230px;margin:0}
.qs-q{border-left:3px solid var(--hair2)}
.qs-q.done{border-color:var(--pos-hair);border-left-color:var(--pos)}
.qs-head{display:flex;gap:13px;align-items:flex-start;margin-bottom:12px}
.qs-n{font-family:var(--disp);font-weight:800;font-size:19px;line-height:1.15;color:var(--muted2);
  flex:none;min-width:28px;font-variant-numeric:tabular-nums}
.qs-q.done .qs-n{color:var(--pos)}
.qs-head h3{font-family:var(--disp);font-weight:700;font-size:15px;letter-spacing:-.01em;line-height:1.3}
.qs-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:7px}
.qs-why{font-size:13.5px;line-height:1.75;color:var(--ink2);max-width:88ch;margin-bottom:13px}
.qs-why b{color:var(--ink);font-weight:600}
.qs-guess{background:#F7F7FA;border:1px dashed var(--hair2);border-radius:9px;
  padding:11px 13px;margin-bottom:14px}
.qs-guess .lab{font-family:var(--mono);font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--warn);margin-bottom:5px}
.qs-guess p{font-size:12.5px;line-height:1.72;color:var(--ink2);max-width:88ch}
.qs-foot{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:9px}
.qs-dirty{font-family:var(--mono);font-size:10px;color:var(--warn);display:none}
.qs-dirty.on{display:inline}
.qs-file{border:1px solid var(--hair);background:#FAFAFC;border-radius:10px;
  padding:14px 15px;margin-bottom:10px}
.qs-file.got{background:var(--pos-soft);border-color:var(--pos-hair)}
.qs-file-top{display:flex;gap:11px;align-items:flex-start;flex-wrap:wrap;margin-bottom:8px}
.qs-file h4{font-family:var(--disp);font-weight:700;font-size:13.5px;line-height:1.3}
.qs-file .why{font-size:12.5px;line-height:1.72;color:var(--ink2);max-width:88ch}
.qs-file .lead{font-size:12.5px;line-height:1.72;color:var(--ink);max-width:88ch;margin-top:9px;font-weight:500}
.qs-need{list-style:none;margin-top:9px;display:flex;flex-direction:column;gap:5px}
.qs-need li{position:relative;padding-left:15px;font-size:12.5px;line-height:1.7;
  color:var(--ink2);max-width:88ch}
.qs-need li:before{content:"—";position:absolute;left:0;color:var(--muted2)}
.qs-feeds{display:flex;flex-direction:column;gap:5px;margin-top:11px}
.qs-feed{display:flex;gap:10px;align-items:baseline;padding:7px 10px;border-radius:7px;
  background:#fff;border:1px solid var(--hair)}
.qs-feed b{font-size:12px;font-weight:600;flex:none;min-width:150px}
.qs-feed span{font-family:var(--mono);font-size:9.5px;color:var(--muted);line-height:1.6}
.qs-file-foot{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:12px}
`;

/* Trạng thái đánh dấu "đã xin được file" không có chỗ riêng trong lõi.
   Nhét chung vào bảng câu trả lời với tiền tố "sample:" — khoá này không
   đụng id câu hỏi (q1…q7), và các màn hình khác chỉ đọc theo đúng id câu
   hỏi nên không đếm nhầm. */
const SAMPLE_KEY = "sample:";

/* Bản nháp chưa lưu, để ngoài DOM. Lưu một câu là vẽ lại cả trang (nhãn
   đỏ ở cột điều hướng và hàng thẻ số phải đổi theo), mà vẽ lại thì mọi ô
   đang gõ dở bị xoá trắng — giữ ở đây thì chúng sống sót qua ctx.refresh()
   và qua cả lúc người dùng đi sang màn hình khác rồi quay lại. */
const ui = { drafts: Object.create(null) };

/* ---------------------------------------------------------------------
   PHẦN CẦN NÓI THÊM VỀ HAI FILE MẪU
   Tên cột thì tài liệu bàn giao đã có. Thứ không đoán được là GIÁ TRỊ
   THẬT nằm trong ô — nên danh sách dưới đây hỏi vào giá trị, không hỏi
   vào tên cột.
   --------------------------------------------------------------------- */
const SAMPLE_DETAIL = {
  s1: {
    lead: "Xin 10–15 dòng thôi, nhưng phải là dòng thật. Cần nhìn giá trị trong từng ô, không phải tên cột.",
    items: [
      "ISRC viết hoa hay viết thường, có gạch nối không: VNA2P2500123 hay VN-A2P-25-00123. Chuẩn hoá sai một kiểu là cả kỳ không khớp được dòng nào.",
      "Client ID có tiền tố gì, dài mấy ký tự, có bao giờ hai người trùng nhau không — quyền xem của khách bám vào mã này, không bám vào tên.",
      "Ngày viết kiểu nào: 2026-07-01, 01/07/2026 hay 07/01/2026. Hai kiểu sau lẫn ngày với tháng, và lẫn im lặng suốt nửa năm mới lộ.",
      "Tên nghệ sĩ có dấu tiếng Việt, có &, có dấu nháy, có hai chấm — mở file ra còn nguyên hay đã thành ký tự lạ. Encoding hỏng ở đây thì hỏng tới tận màn hình khách.",
      "Ô không có dữ liệu thì để trống, ghi N/A, hay ghi 0 — ba cách hiểu khác hẳn nhau ở bước nạp."
    ],
    note: "Hai cột Distribution và Rate Share đã bị xoá khỏi bản gửi trước. Không cần cả danh mục, chỉ cần vài dòng còn nguyên định dạng."
  },
  s2: {
    lead: "Che hết số tiền cũng được. Thứ cần là tên cột nguyên văn và 1–2 dòng thật, đủ cả ba luồng — thiếu một luồng là thiếu đúng cái khó nhất.",
    items: [
      "Con số ở cột doanh thu là trước hay sau khi đối tác giữ phần của họ. Chính là câu hỏi đắt nhất trong danh sách trên, và chỉ file mới trả lời được.",
      "Tiền tệ ghi ở đâu: một cột riêng, mỗi lãnh thổ một file, hay đã quy sẵn về một loại tiền.",
      "Một dòng là gì: một bài × một cửa hàng × một lãnh thổ × một tháng, hay đã gộp sẵn tới mức nào.",
      "Mỗi luồng gọi tên cửa hàng ra sao — Apple Music hay iTunes, YouTube Music hay YT Music. Ba luồng gọi ba kiểu thì bảng tổng hợp đếm thành ba cửa hàng khác nhau.",
      "Dòng âm (hoàn tiền, truy thu kỳ trước) trông thế nào, và ghi vào kỳ nào.",
      "Cuối file có dòng tổng không — đó là con số đem đi đối chiếu tới từng xu, không có nó thì không biết mình nạp thiếu."
    ],
    note: "Cấu trúc ba file này quyết định toàn bộ thiết kế đường ống nạp: parser, bước chuẩn hoá, bước khớp ISRC, bảng thô. Đây là phần khó nhất và cũng là phần duy nhất không đoán được."
  }
};

/* Câu nào nhìn file mẫu là trả lời được ngay thì nói luôn, để người đọc
   biết đi xin file cũng là đang trả lời câu hỏi. */
const ANSWERED_BY_SAMPLE = { q1: "s1", q2: "s1", q4: "s2", q7: "s2" };

const NUM_WORD = ["không", "một", "hai", "ba", "bốn", "năm", "sáu"];
const numWord = n => NUM_WORD[n] || String(n);
const answered = (A, id) => String(A.answers.get(id) || "").trim();

/* ---------------------------------------------------------------------
   TỔNG HỢP — không đụng tới 50.000 bản ghi, chỉ đọc bảng chi trả của các
   kỳ ĐÃ DUYỆT để biết đã chốt bao nhiêu tiền theo cách hiểu hiện tại.
   --------------------------------------------------------------------- */
function stats(A) {
  const open = [], done = [];
  A.questions.forEach((q, i) => (answered(A, q.id) ? done : open).push(i + 1));

  const samples = A.samplesNeeded.map(s => ({ s, got: String(A.answers.get(SAMPLE_KEY + s.id) || "").trim() }));
  const stillNeed = samples.filter(x => !x.got).length;

  let approved = 0, paid = 0;
  A.periods.forEach(p => {
    if (!A.isApproved(p.k)) return;
    approved++;
    (A.payoutOf(p.k) || []).forEach(r => { paid += r.payable || 0; });
  });

  let last = null;
  for (const r of A.audit.list(200)) if (r.action === "answer.set") { last = r; break; }

  /* Câu nào đang chờ đúng cái file chưa xin được — đếm thật, không đếm cả
     bảng ánh xạ, vì xin được một file là gỡ được một phần. */
  const gotIds = new Set(samples.filter(x => x.got).map(x => x.s.id));
  const blocked = A.questions.filter(q =>
    ANSWERED_BY_SAMPLE[q.id] && !gotIds.has(ANSWERED_BY_SAMPLE[q.id])).length;

  return { open, done, samples, stillNeed, blocked, approved, paid, last, total: A.questions.length };
}

/* Nhật ký ghi "q3 · nội dung câu trả lời…" — chỉ cần lấy lại phần đầu để
   nói "câu 3", đừng in nội dung ra thẻ số. */
function lastTouchLabel(A, entry) {
  if (!entry) return "";
  const id = String(entry.detail || "").split(" ·")[0].trim();
  if (id.indexOf(SAMPLE_KEY) === 0) return "đánh dấu file mẫu";
  const i = A.questions.findIndex(q => q.id === id);
  return i >= 0 ? "câu " + (i + 1) : id;
}

/* ---------------------------------------------------------------------
   XUẤT MARKDOWN — thứ đem sang cho người viết migration
   --------------------------------------------------------------------- */
function buildMd(ctx) {
  const A = ctx.admin, fmt = ctx.fmt, s = stats(A);
  const all = A.answers.all();
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const o = [];

  o.push("# Haustek — trả lời các câu hỏi chặn schema");
  o.push("");
  o.push("Xuất từ bản mẫu intranet lúc " + fmt.when(now) + " · lõi " + ctx.H.VERSION);
  o.push("");
  o.push("Đã trả lời **" + s.done.length + "/" + s.total + "** câu · còn **" + s.stillNeed
    + "/" + A.samplesNeeded.length + "** file mẫu chưa xin được.");
  o.push("");
  o.push("Mỗi câu kèm sẵn phần *bản mẫu đang đoán*. Chỗ nào câu trả lời khác phỏng đoán thì chỗ đó "
    + "phải sửa trước khi viết migration — sửa ở tầng dữ liệu, không phải ở giao diện.");
  o.push("");
  o.push("Tại thời điểm xuất, " + s.approved + "/" + A.periods.length
    + " kỳ đã duyệt và đã chốt chi trả theo đúng những phỏng đoán này.");
  o.push("");

  A.questions.forEach((q, i) => {
    const a = String(all[q.id] || "").trim();
    o.push("---");
    o.push("");
    o.push("## " + (i + 1) + ". " + q.t + "  `" + q.id + "`");
    o.push("");
    o.push("**Vì sao quan trọng.** " + q.why);
    o.push("");
    o.push("**Bản mẫu đang đoán.** " + q.guess);
    o.push("");
    if (a) {
      o.push("**Trả lời:**");
      o.push("");
      a.split(/\r?\n/).forEach(l => o.push("> " + l));
    } else {
      o.push("**Trả lời:** _chưa có — phần này vẫn đang chạy theo phỏng đoán ở trên._");
    }
    o.push("");
  });

  o.push("---");
  o.push("");
  o.push("## File mẫu cần xin");
  o.push("");
  A.samplesNeeded.forEach((sm, i) => {
    const got = String(all[SAMPLE_KEY + sm.id] || "").trim();
    const d = SAMPLE_DETAIL[sm.id];
    o.push("### " + (i + 1) + ". " + sm.t + " — " + (got ? "ĐÃ NHẬN (" + got + ")" : "CHƯA CÓ"));
    o.push("");
    o.push("Vì sao cần: " + sm.why);
    if (d) {
      o.push("");
      o.push(d.lead);
      o.push("");
      d.items.forEach(x => o.push("- " + x));
      o.push("");
      o.push("_" + d.note + "_");
    }
    o.push("");
  });

  o.push("---");
  o.push("");
  o.push("Ba luồng doanh thu bản ghi phải có đủ trong file mẫu số 2: "
    + A.feeds.map(f => f.name + " (" + f.fmt + ")").join(" · ") + ".");
  o.push("");
  o.push("Tác quyền (" + A.pubFeed.name + " · " + A.pubFeed.fmt
    + ") là dòng tiền tách rời, không tính vào ba luồng đó.");
  o.push("");
  return o.join("\n");
}

function download(ctx, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "haustek-tra-loi-schema.md";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* Lưu xong phải vẽ lại: nhãn đỏ ở cột điều hướng, hàng thẻ số và viền
   xanh của panel đều đọc từ trạng thái. Nhưng vẽ lại là dựng lại cả
   trang, nên giữ chỗ cuộn — không thì mỗi lần lưu người dùng bị ném lên
   đầu trang và mất luôn chỗ đang đọc. */
function saveAnswer(ctx, id, text) {
  try {
    ctx.admin.answers.set(id, text);
    ui.drafts[id] = text;
    ctx.toast(text.trim() ? "Đã lưu câu trả lời" : "Đã xoá câu trả lời", "ok");
    const y = window.scrollY;
    ctx.refresh();
    window.scrollTo(0, y);
  } catch (e) {
    ctx.toast(e.message, "no");
  }
}

HAUSTEK.registerScreen({
  id: "questions",
  nav: "Câu hỏi còn treo",
  group: "Quản trị",
  title: "Câu hỏi phải chốt trước khi viết schema",
  subtitle: "Đây là những chỗ bản mẫu đang <b>đoán</b>. Đoán đúng thì không ai để ý; đoán sai thì "
    + "phải sửa schema và chạy lại migration — làm lại từ gốc, không phải sửa giao diện.",

  badge(ctx) {
    const A = ctx.admin;
    const n = A.questions.filter(q => !answered(A, q.id)).length;
    return n ? String(n) : "";
  },

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
    const s = stats(A);

    /* ---------- hàng thẻ số ---------- */
    const kpis = `<div class="kpis">
      <div class="kpi ${s.open.length ? "hero" : "good"}">
        <div class="lab">Đã trả lời</div>
        <div class="val">${s.done.length}/${s.total}</div>
        <div class="sub">${s.open.length
          ? "đã chốt " + esc(fmt.pct(s.done.length / s.total)) + " · còn " + s.open.length + " câu treo"
          : "chốt hết · schema viết được rồi"}</div>
      </div>
      <div class="kpi ${s.open.length ? "bad" : "good"}">
        <div class="lab">Còn phải đoán</div>
        <div class="val">${s.open.length}</div>
        <div class="sub">${s.open.length
          ? "câu " + s.open.join(" · ") + " — mỗi câu là một chỗ trong schema<br>chưa ai xác nhận"
          : "không còn chỗ nào chạy bằng phỏng đoán"}</div>
      </div>
      <div class="kpi ${s.stillNeed ? "bad" : "good"}">
        <div class="lab">File mẫu còn phải xin</div>
        <div class="val">${s.stillNeed}/${A.samplesNeeded.length}</div>
        <div class="sub">${s.stillNeed
          ? "chưa có file thì " + s.blocked + "/" + s.total + " câu ở trên không chốt được"
          : "đã nhận đủ · đối chiếu lại từng phỏng đoán với file thật"}</div>
      </div>
      <div class="kpi">
        <div class="lab">Ghi lần gần nhất</div>
        <div class="val">${s.last ? esc(fmt.date(s.last.at)) : "—"}</div>
        <div class="sub">${s.last
          ? esc(String(s.last.at).slice(11, 16)) + " · " + esc(lastTouchLabel(A, s.last))
          : "chưa ai trả lời câu nào"}</div>
      </div>
    </div>`;

    /* ---------- dải mở đầu: nói ra cái giá của việc đoán sai ---------- */
    const lead = s.open.length
      ? `<div class="warn">
          <span class="ic">▲</span>
          <div>
            <b>Còn ${s.open.length}/${s.total} câu chưa chốt</b>
            <span><span class="pill">${s.approved}/${A.periods.length} kỳ</span> đã duyệt và đã chốt chi trả
            ${esc(ctx.money(s.paid))} theo đúng cách hiểu hiện tại. Một câu trả lời khác đi là tính lại
            từ đầu chuỗi chia tiền cho toàn bộ số kỳ đó, sau khi tiền đã ra khỏi tài khoản.</span>
          </div>
        </div>`
      : `<div class="okbar">
          <span class="ic">✓</span>
          <span>Đã trả lời đủ ${s.total} câu. Xuất ra Markdown rồi đối chiếu từng câu với phần
          “bản mẫu đang đoán” — chỗ nào lệch là chỗ phải sửa trước khi viết migration.</span>
        </div>`;

    const bar = `<div class="qs-bar">
      <button class="btn pri" data-qs-export>Xuất câu trả lời</button>
      <p class="note">Gom cả câu hỏi, phỏng đoán, câu trả lời và hai file cần xin thành một file Markdown
      — đem thẳng sang cho người viết migration. Bản nháp chưa lưu vẫn còn khi bạn chuyển màn hình,
      nhưng đóng tab là mất.</p>
    </div>`;

    /* ---------- một panel cho mỗi câu ---------- */
    const qHTML = A.questions.map((q, i) => {
      const saved = answered(A, q.id);
      const draft = ui.drafts[q.id] === undefined ? A.answers.get(q.id) : ui.drafts[q.id];
      const dirty = String(draft).trim() !== saved;
      const sm = ANSWERED_BY_SAMPLE[q.id];
      const smName = sm ? (A.samplesNeeded.find(x => x.id === sm) || {}).t : "";
      return `<section class="panel qs-q${saved ? " done" : ""}" data-qs-q="${esc(q.id)}">
        <div class="qs-head">
          <div class="qs-n">${String(i + 1).padStart(2, "0")}</div>
          <div>
            <h3>${esc(q.t)}</h3>
            <div class="qs-tags">
              <span class="chip ${saved ? "ok" : "wait"}">${saved ? "đã trả lời" : "chưa trả lời"}</span>
              <span class="chip">${esc(q.id)}</span>
              ${sm && smName ? `<button class="btn sm" data-qs-jump="${esc(sm)}"
                title="${esc(smName)}">Nhìn file mẫu là chốt được ↓</button>` : ""}
            </div>
          </div>
        </div>

        <p class="qs-why"><b>Vì sao quan trọng.</b> ${esc(q.why)}</p>

        <div class="qs-guess">
          <div class="lab">Bản mẫu đang đoán — chưa ai xác nhận</div>
          <p>${esc(q.guess)}</p>
        </div>

        <label class="fld" for="qs-ta-${esc(q.id)}">Câu trả lời từ phía khách</label>
        <textarea id="qs-ta-${esc(q.id)}" rows="4" data-qs-ta="${esc(q.id)}"
          placeholder="Chép nguyên văn câu trả lời của khách. Kèm cả chỗ họ nói “chưa chắc” — chỗ đó vẫn phải hỏi lại.">${esc(draft)}</textarea>

        <div class="qs-foot">
          <button class="btn pri" data-qs-save="${esc(q.id)}"${dirty ? "" : " disabled"}>Lưu câu trả lời</button>
          ${saved ? `<button class="btn sm dang" data-qs-clear="${esc(q.id)}">Xoá câu trả lời</button>` : ""}
          <span class="qs-dirty${dirty ? " on" : ""}" data-qs-dirty="${esc(q.id)}">chưa lưu</span>
        </div>
      </section>`;
    }).join("");

    /* ---------- hai file cần xin ---------- */
    const feedRows = A.feeds.map(f => `<div class="qs-feed">
        <b>${esc(f.name)}</b>
        <span>${esc(f.fmt)} · ${esc(f.note)}</span>
      </div>`).join("");

    const filesHTML = `<div class="panel">
      <div class="panel-head">
        <div>
          <h3>${esc(numWord(A.samplesNeeded.length).replace(/^./, c => c.toUpperCase()))} file mẫu phải xin bằng được</h3>
          <div class="hint">Còn thiếu ${s.stillNeed}/${A.samplesNeeded.length} file.
          Không có file thì phần đường ống nạp vẫn chỉ là bản vẽ trên giấy.</div>
        </div>
        <div class="btnrow"><button class="btn" data-qs-export>Xuất câu trả lời</button></div>
      </div>
      ${A.samplesNeeded.map((sm, i) => {
        const got = String(A.answers.get(SAMPLE_KEY + sm.id) || "").trim();
        const d = SAMPLE_DETAIL[sm.id];
        return `<div class="qs-file${got ? " got" : ""}" data-qs-file="${esc(sm.id)}">
          <div class="qs-file-top">
            <div class="qs-n">${String(i + 1).padStart(2, "0")}</div>
            <div style="flex:1;min-width:200px">
              <h4>${esc(sm.t)}</h4>
              <div class="qs-tags">
                <span class="chip ${got ? "ok" : "no"}">${got ? "đã nhận · " + esc(fmt.date(got)) : "chưa xin được"}</span>
                <span class="chip">${esc(sm.id)}</span>
              </div>
            </div>
          </div>
          <p class="why"><b>Vì sao cần.</b> ${esc(sm.why)}</p>
          ${d ? `<p class="lead">${esc(d.lead)}</p>
            <ul class="qs-need">${d.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
            ${sm.id === "s2" ? `<div class="qs-feeds">${feedRows}</div>
              <p class="why" style="margin-top:9px">Tác quyền về theo đường riêng
              (${esc(A.pubFeed.name)} · ${esc(A.pubFeed.fmt)}) và là dòng tiền tách rời — không tính vào ba luồng trên,
              nhưng sớm muộn cũng phải xin mẫu.</p>` : ""}
            <p class="note" style="margin-top:10px">${esc(d.note)}</p>` : ""}
          <div class="qs-file-foot">
            <button class="btn sm${got ? "" : " pri"}" data-qs-got="${esc(sm.id)}" data-qs-on="${got ? "1" : ""}">
              ${got ? "Bỏ đánh dấu đã nhận" : "Đánh dấu đã nhận"}</button>
            <span class="note">${got
              ? "Đánh dấu ngày " + esc(fmt.date(got)) + " — nhớ đối chiếu lại từng phỏng đoán ở trên với file thật."
              : "Đánh dấu khi file đã về tay, để hàng thẻ số ở trên nói đúng."}</span>
          </div>
        </div>`;
      }).join("")}
      <p class="note" style="margin-top:12px">Nạp thiếu một luồng thì cả kỳ sai mà bảng số vẫn xanh —
      đó là lý do hệ thống theo dõi từng luồng riêng, và cũng là lý do file mẫu phải có đủ cả ba.</p>
    </div>`;

    root.innerHTML = `<style>${CSS}</style>` + kpis + lead + bar + qHTML + filesHTML;

    /* ---------- gắn sự kiện ---------- */
    root.querySelectorAll("[data-qs-ta]").forEach(ta => {
      const id = ta.dataset.qsTa;
      const btn = root.querySelector('[data-qs-save="' + id + '"]');
      const flag = root.querySelector('[data-qs-dirty="' + id + '"]');
      const mark = () => {
        ui.drafts[id] = ta.value;
        const dirty = ta.value.trim() !== answered(A, id);
        if (flag) flag.classList.toggle("on", dirty);
        if (btn) btn.disabled = !dirty;
      };
      ta.addEventListener("input", mark);
      /* Ctrl/Cmd+Enter để lưu: người ngồi trả lời bảy câu liền không muốn
         rời tay khỏi bàn phím sau mỗi câu. */
      ta.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); saveAnswer(ctx, id, ta.value); }
      });
    });

    root.querySelectorAll("[data-qs-save]").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.dataset.qsSave;
        const ta = root.querySelector('[data-qs-ta="' + id + '"]');
        saveAnswer(ctx, id, ta ? ta.value : "");
      });
    });

    root.querySelectorAll("[data-qs-clear]").forEach(b => {
      b.addEventListener("click", async () => {
        const id = b.dataset.qsClear;
        const q = A.questions.find(x => x.id === id);
        try {
          const ok = await ctx.confirm("Xoá câu trả lời cho câu này?",
            (q ? q.t + " — " : "") + "Xoá xong thì bản mẫu quay lại chạy theo phỏng đoán ở khối nền nhạt.",
            "Xoá", true);
          if (!ok) return;
          delete ui.drafts[id];
          saveAnswer(ctx, id, "");
        } catch (e) { ctx.toast(e.message, "no"); }
      });
    });

    root.querySelectorAll("[data-qs-got]").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.dataset.qsGot;
        try {
          const on = !!b.dataset.qsOn;
          ctx.admin.answers.set(SAMPLE_KEY + id, on ? "" : new Date().toISOString().slice(0, 10));
          ctx.toast(on ? "Bỏ đánh dấu — file này vẫn phải xin" : "Đã đánh dấu nhận được file mẫu", "ok");
          const y = window.scrollY;
          ctx.refresh();
          window.scrollTo(0, y);
        } catch (e) { ctx.toast(e.message, "no"); }
      });
    });

    root.querySelectorAll("[data-qs-jump]").forEach(b => {
      b.addEventListener("click", () => {
        const el = root.querySelector('[data-qs-file="' + b.dataset.qsJump + '"]');
        if (el) el.scrollIntoView({ block: "center" });
        else ctx.toast("Không tìm thấy khối file mẫu tương ứng", "no");
      });
    });

    root.querySelectorAll("[data-qs-export]").forEach(b => {
      b.addEventListener("click", () => {
        try {
          download(ctx, buildMd(ctx));
          ctx.toast("Đã tải haustek-tra-loi-schema.md về máy", "ok");
        } catch (e) { ctx.toast(e.message, "no"); }
      });
    });
  }
});

})();
