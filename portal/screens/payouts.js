"use strict";
/* =====================================================================
   MÀN HÌNH: BẢNG CHI TRẢ
   ---------------------------------------------------------------------
   Bảng này KHÔNG được tính lại mỗi lần mở. Lõi chạy runPayout đúng một
   lần, ngay lúc duyệt kỳ, rồi lưu kết quả — nên mở lại kỳ 03/2026 sau
   nửa năm vẫn ra đúng con số đã chuyển đi, dù tỷ lệ, tạm ứng hay danh
   mục đã đổi từ lâu. Màn hình này chỉ ĐỌC bản chụp đó.

   Kỳ chưa duyệt thì không có bảng, và đó là chuyện đúng chứ không phải
   lỗi: trước khi duyệt, mỗi lần nạp thêm một luồng hay khớp thêm một
   dòng ISRC là con số đổi. In ra một bảng chi trả ở giai đoạn đó là mời
   người ta chuyển tiền theo số sắp cũ.

   Ba chỗ dễ đọc sai, nên đều nói bằng chữ ngay trên màn hình:
     · "kiếm được" là tiền của riêng kỳ này, chưa trừ gì.
     · "thực trả" đã trừ tạm ứng VÀ đã bỏ phần dưới ngưỡng sang kỳ sau —
       nên tổng thực trả luôn nhỏ hơn tổng kiếm được, không phải mất tiền.
     · dòng điểm producer không trả cho ai được vì danh mục chỉ có TÊN,
       chưa có mã. Nó nằm lại cuối bảng để nhìn thấy, không biến mất.
   ===================================================================== */
(function () {

const CSS = `
.po-bar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:11px}
.po-bar .dimtabs{margin-bottom:0}
.po-count{margin-left:auto;text-align:right;font-family:var(--mono);font-size:10px;
  color:var(--muted);line-height:1.75}
.po-count b{color:var(--ink);font-weight:600;font-size:11.5px}
.po-foot{margin-top:9px}
.po-empty{padding:26px;text-align:center;color:var(--muted);font-size:12.5px}
.po-pers{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}
.po-pers .btn{text-transform:none;letter-spacing:.03em}
.po-pers .btn.on{border-color:var(--ink);background:var(--ink);color:#fff}
.po-held{margin-top:9px}
.po-sub{display:block;font-family:var(--mono);font-size:9.5px;color:var(--muted);margin-top:2px}
`;

/* Ngưỡng "coi như bằng 0": mọi số tiền trong lõi đã làm tròn tới xu, nên
   nửa xu là chắc chắn nhiễu chứ không phải tiền. */
const EPS = 0.004;

const FILTERS = [
  { k: "all",   lab: "Tất cả",                     test: () => true },
  { k: "pay",   lab: "Chỉ bên được nhận tiền",     test: r => r.payable > EPS },
  { k: "carry", lab: "Chỉ bên bị dồn sang kỳ sau", test: r => r.carryOut > EPS },
  { k: "rec",   lab: "Chỉ bên đang trừ tạm ứng",   test: r => r.recoup > EPS }
];

const COLS = [
  { k: "name",        lab: "Bên nhận",         w: "minmax(190px,2.2fr)" },
  { k: "kindLab",     lab: "Kiểu",             w: "98px" },
  { k: "earned",      lab: "Kiếm được kỳ này", w: "minmax(126px,1fr)", num: 1 },
  { k: "carryIn",     lab: "Dồn từ kỳ trước",  w: "minmax(120px,1fr)", num: 1 },
  { k: "recoup",      lab: "Trừ tạm ứng",      w: "minmax(108px,1fr)", num: 1 },
  { k: "payable",     lab: "Thực trả",         w: "minmax(118px,1.1fr)", num: 1 },
  { k: "carryOut",    lab: "Dồn sang kỳ sau",  w: "minmax(120px,1fr)", num: 1 },
  { k: "advanceLeft", lab: "Dư nợ tạm ứng",    w: "minmax(118px,1fr)", num: 1 }
];
const TEXT_COL = { name: 1, kindLab: 1 };

/* Ô tìm, bộ lọc và thứ tự sắp xếp là việc của người đang nhìn bảng, không
   phải quyết định vận hành. Để ngoài render thì đổi kỳ hay đổi tiền tệ
   xong vẫn quay về đúng chỗ đang xem. */
const ui = { q: "", f: "all" };
let sortKey = "payable", sortDir = -1;

const fold = s => String(s == null ? "" : s).toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

/* ---------------------------------------------------------------------
   ĐỌC BẢN CHỤP RA DẠNG VẼ ĐƯỢC
   Lõi chỉ lưu partyKey và các con số. Tên, Client ID và kiểu bên nhận
   tra tại đây — tra một lần cho ~940 dòng, không đụng tới 50.000 bản ghi.
   --------------------------------------------------------------------- */
function decorate(A, rows) {
  return rows.map(r => {
    const key = r.partyKey;
    const isProd = r.kind === "producer" || key === "P:*";
    let kindLab = "Nghệ sĩ", kindCls = "chip";
    if (isProd) { kindLab = "Producer"; kindCls = "chip wait"; }
    else if (key[0] === "L") { kindLab = "Label"; kindCls = "chip lbl"; }
    else {
      /* Nghệ sĩ độc lập và nghệ sĩ thuộc label nhận tiền theo hai đường
         khác nhau — bảng chi trả phải phân biệt được bằng mắt. */
      const a = A.artists[+key.slice(2)];
      if (a && a.labelId < 0) { kindLab = "Độc lập"; kindCls = "chip ind"; }
    }
    const name = A.partyName(key), cid = A.partyClientId(key);
    return {
      key, name, cid, kindLab, kindCls, isProd,
      note: r.note || "",
      earned: r.earned || 0, carryIn: r.carryIn || 0, recoup: r.recoup || 0,
      payable: r.payable || 0, carryOut: r.carryOut || 0, advanceLeft: r.advanceLeft || 0,
      f: fold(name + " " + cid + " " + key)
    };
  });
}

/* Một vòng qua bảng là ra hết các con số của hàng thẻ. Dòng điểm producer
   để riêng: nó là tiền GIỮ LẠI vì chưa biết chủ, không phải tiền dồn sang
   kỳ sau vì dưới ngưỡng — gộp hai thứ đó vào một ô là nói sai. */
function summarize(list, minPay) {
  const s = { parties: 0, pool: 0, earned: 0, carryIn: 0, payable: 0, paid: 0,
              recoup: 0, recN: 0, carryOut: 0, carryN: 0,
              zero: 0, zeroRec: 0, zeroCarry: 0, advLeft: 0, held: 0 };
  list.forEach(r => {
    s.pool += r.earned + r.carryIn;
    if (r.isProd) { s.held += r.earned; return; }
    s.parties++;
    s.earned += r.earned; s.carryIn += r.carryIn;
    s.payable += r.payable; s.recoup += r.recoup;
    s.carryOut += r.carryOut; s.advLeft += r.advanceLeft;
    if (r.payable > EPS) s.paid++;
    if (r.recoup > EPS) s.recN++;
    if (r.carryOut > EPS) s.carryN++;
    if (r.earned + r.carryIn > EPS && r.payable <= EPS) {
      s.zero++;
      if (r.recoup > EPS) s.zeroRec++; else s.zeroCarry++;
    }
  });
  s.minPay = minPay;
  return s;
}

/* Kỳ ĐÃ DUYỆT gần nhất trước kỳ đang xem — để mọi con số có chỗ mà so.
   Kỳ chưa duyệt không có bảng chi trả nên không so được, phải bỏ qua. */
function prevPaid(A, pi) {
  for (let i = pi - 1; i >= 0; i--) {
    const p = A.periods[i];
    const rows = A.isApproved(p.k) ? A.payoutOf(p.k) : null;
    if (rows && rows.length) {
      let sum = 0;
      rows.forEach(r => { sum += r.payable || 0; });
      return { period: p, payable: sum };
    }
  }
  return null;
}

/* ---------------------------------------------------------------------
   CSV
   Chỗ dễ hỏng file nhất là tên bên nhận: "nae & de'lay", "ling:chi",
   "Thiện Hí". Nên bọc mọi trường có dấu phẩy hoặc dấu nháy, nhân đôi dấu
   nháy kép bên trong, và mở đầu file bằng BOM — thiếu BOM thì Excel đọc
   UTF-8 thành ký tự rác và người nhận tưởng dữ liệu sai.
   Số ghi dạng thập phân CHẤM, không ký hiệu tiền tệ: cột tiền phải vào
   Excel thành số, không thành chữ.
   --------------------------------------------------------------------- */
const CSV_HEAD = ["client_id", "party_key", "ten", "kieu", "ky", "kiem_duoc_usd",
  "don_tu_ky_truoc_usd", "tru_tam_ung_usd", "thuc_tra_usd", "don_sang_ky_sau_usd", "du_no_tam_ung_usd"];

function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",';\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const csvNum = v => (Math.round((v || 0) * 100) / 100).toFixed(2);

function buildCSV(list, periodKey) {
  const lines = [CSV_HEAD.join(",")];
  list.forEach(r => {
    lines.push([
      csvCell(r.cid), csvCell(r.key), csvCell(r.name), csvCell(r.kindLab), csvCell(periodKey),
      csvNum(r.earned), csvNum(r.carryIn), csvNum(r.recoup),
      csvNum(r.payable), csvNum(r.carryOut), csvNum(r.advanceLeft)
    ].join(","));
  });
  return "﻿" + lines.join("\r\n") + "\r\n";
}

function downloadCSV(text, fileName) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* =====================================================================
   MÀN HÌNH
   ===================================================================== */
HAUSTEK.registerScreen({
  id: "payouts",
  nav: "Chi trả",
  group: "Tiền",
  title: "Bảng chi trả",
  subtitle: "Chỉ kỳ <b>đã duyệt</b> mới có bảng chi trả. Bảng chạy đúng một lần lúc duyệt kỳ rồi giữ nguyên — "
          + "mở lại sau nửa năm vẫn ra đúng con số đã chuyển đi.",

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
    const pi = ctx.pIdx, pk = ctx.periodKey, per = ctx.period;
    const rows = A.isApproved(pk) ? A.payoutOf(pk) : null;

    /* ---------------------------------------------------------------
       1. KỲ CHƯA DUYỆT — dừng ở đây
       --------------------------------------------------------------- */
    if (!rows || !rows.length) {
      const miss = A.missingFeeds(pi);
      const pendN = A.queue.list({ periodKey: pk, status: "pending" }).length;
      const pendAmt = A.queue.pendingTotal(pk);
      const done = A.periods.filter(p => A.isApproved(p.k) && (A.payoutOf(p.k) || []).length);

      /* Kỳ đã duyệt mà bảng trống chỉ xảy ra với snapshot cũ — nói thẳng
         thay vì để người đọc tưởng kỳ chưa duyệt. */
      const approvedButEmpty = A.isApproved(pk);
      const why = [];
      if (miss.length) why.push("còn thiếu luồng " + miss.map(f => f.short).join(" · "));
      if (pendN) why.push(fmt.num(pendN) + " dòng treo ở hàng chờ khớp (" + ctx.money2(pendAmt) + ")");

      root.innerHTML = `<style>${CSS}</style>
        <div class="warn">
          <div class="ic">▲</div>
          <div>
            <b>${approvedButEmpty
              ? "Kỳ " + esc(per.label) + " đã duyệt nhưng không có bảng chi trả trong trạng thái này"
              : "Kỳ " + esc(per.label) + " chưa duyệt — chưa có bảng chi trả"}</b>
            <span>${approvedButEmpty
              ? "Bản chụp chi trả của kỳ này không nằm trong snapshot đang mở. Thu hồi duyệt rồi duyệt lại thì bảng chạy lại."
              : "Bảng chi trả chạy đúng một lần, ngay lúc duyệt kỳ: trừ tạm ứng, dồn phần dưới "
                + esc(fmt.usd0(A.cfg.PAYOUT_MIN)) + " sang kỳ sau, chốt lại số của từng bên nhận. "
                + "Trước lúc đó con số còn đổi theo mỗi lần nạp thêm luồng hay khớp thêm một dòng ISRC — "
                + "in ra bây giờ là mời người ta chuyển tiền theo số sắp cũ."}
              ${why.length ? "<br>Kỳ " + esc(per.label) + ": " + esc(why.join(" · ")) + "." : ""}</span>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3>Kỳ đã duyệt · bấm để xem bảng chi trả</h3>
              <div class="hint">${done.length
                ? fmt.num(done.length) + "/" + A.periods.length + " kỳ đã đóng sổ và đã chạy chi trả"
                : "Chưa kỳ nào đóng sổ — chưa có bảng chi trả nào để xem"}</div>
            </div>
            <div class="btnrow">
              <button class="btn pri" data-po-go="close">Sang đối chiếu &amp; duyệt kỳ</button>
            </div>
          </div>
          ${done.length ? `<div class="po-pers">${done.slice().reverse().map(p => {
            let sum = 0;
            (A.payoutOf(p.k) || []).forEach(r => { sum += r.payable || 0; });
            return `<button class="btn sm" data-po-per="${p.idx}">Kỳ ${esc(p.label)} · ${esc(ctx.money(sum))}</button>`;
          }).join("")}</div>
          <div class="note po-foot">Số bên cạnh mỗi kỳ là tổng thực trả đã chốt của kỳ đó.
            Kỳ mới nhất nằm đầu danh sách.</div>`
          : `<div class="po-empty">Chưa có kỳ nào duyệt xong.</div>`}
        </div>`;

      root.querySelectorAll("[data-po-go]").forEach(b => {
        b.addEventListener("click", () => {
          try { ctx.go(b.dataset.poGo); } catch (e) { ctx.toast(e.message, "no"); }
        });
      });
      root.querySelectorAll("[data-po-per]").forEach(b => {
        b.addEventListener("click", () => {
          try { ctx.setPeriod(+b.dataset.poPer); } catch (e) { ctx.toast(e.message, "no"); }
        });
      });
      return;
    }

    /* ---------------------------------------------------------------
       2. KỲ ĐÃ DUYỆT
       --------------------------------------------------------------- */
    const all = decorate(A, rows);
    const S = summarize(all, A.cfg.PAYOUT_MIN);
    const prev = prevPaid(A, pi);
    const appr = A.approvalOf(pk) || {};
    const coll = new Intl.Collator("vi");

    const kpi = (cls, lab, val, sub) =>
      `<div class="kpi${cls ? " " + cls : ""}"><div class="lab">${lab}</div>
        <div class="val">${val}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>`;

    /* ---------- hàng thẻ số ---------- */
    let payTrend = "kỳ đã duyệt sớm nhất — chưa có kỳ nào để so";
    if (prev && prev.payable > 0) {
      const d = (S.payable - prev.payable) / prev.payable;
      payTrend = `<span class="${d >= 0 ? "up" : "down"}">${d >= 0 ? "▲" : "▼"} ${esc(fmt.pct(Math.abs(d)))}</span>`
        + " so kỳ " + esc(prev.period.label) + " (" + esc(ctx.money(prev.payable)) + ")";
    } else if (prev) {
      payTrend = "kỳ " + esc(prev.period.label) + " không chi đồng nào";
    }
    const poolPct = S.pool > 0 ? fmt.pct(S.payable / S.pool) : "—";
    /* Còn bao nhiêu kỳ nữa mới thu hồi xong tạm ứng — tính theo nhịp kỳ
       này. Con số tạm ứng đứng một mình không nói được gì. */
    const recPeriods = S.recoup > EPS ? Math.ceil(S.advLeft / S.recoup) : 0;

    const kpisHTML = `<div class="kpis">
      ${kpi("hero", "Tổng phải chi kỳ " + esc(per.label), esc(ctx.money(S.payable)),
        payTrend + "<br>" + esc(poolPct) + " số tiền có thể chi kỳ này (" + esc(ctx.money(S.pool)) + ")")}
      ${kpi("", "Bên được nhận tiền", esc(fmt.num(S.paid)),
        "trên " + esc(fmt.num(S.parties)) + " bên có phát sinh · "
        + esc(S.parties > 0 ? fmt.pct(S.paid / S.parties) : "—") + "<br>trung bình "
        + esc(ctx.money(S.paid > 0 ? S.payable / S.paid : 0)) + " mỗi bên")}
      ${kpi("", "Trừ vào tạm ứng", esc(ctx.money(S.recoup)),
        esc(fmt.num(S.recN)) + " bên đang trừ dần · còn nợ " + esc(ctx.money(S.advLeft))
        + "<br>" + (recPeriods > 0
          ? "giữ nhịp này thì còn ~" + esc(fmt.num(recPeriods)) + " kỳ nữa mới thu hồi xong"
          : "kỳ này không thu hồi thêm được đồng nào"))}
      ${kpi(S.carryOut > EPS ? "bad" : "", "Dồn sang kỳ sau", esc(ctx.money(S.carryOut)),
        esc(fmt.num(S.carryN)) + " bên dưới ngưỡng " + esc(fmt.usd0(S.minPay))
        + " — tiền không mất, cộng vào kỳ sau"
        + (S.held > EPS ? "<br>ngoài ra " + esc(ctx.money(S.held)) + " điểm producer giữ lại, dòng riêng cuối bảng" : ""))}
      ${kpi(S.zero > 0 ? "bad" : "good", "Kiếm được nhưng không nhận đồng nào", esc(fmt.num(S.zero)),
        S.zero > 0
          ? esc(fmt.num(S.zeroRec)) + " bên bị tạm ứng ăn hết · " + esc(fmt.num(S.zeroCarry))
            + " bên dưới ngưỡng chi<br>họ vẫn thấy số kiếm được trên cổng khách, kèm lý do chưa nhận"
          : "mọi bên có phát sinh đều nhận được tiền kỳ này")}
    </div>`;

    /* ---------- panel trước khi chi ---------- */
    function beforePanel() {
      const lock = (A.fx.get().locked || {})[pk] || null;
      const pendN = A.queue.list({ periodKey: pk, status: "pending" }).length;
      const pendAmt = A.queue.pendingTotal(pk);
      const items = [
        { ok: true, b: "Kỳ " + per.label + " đã duyệt — bảng dưới đây là bản đã chốt",
          s: (appr.by || "admin") + " · " + fmt.when(appr.at)
             + ((appr.overrides && appr.overrides.length)
                ? " · duyệt trong khi còn " + appr.overrides.length + " điều kiện chưa đạt"
                : "") },
        { ok: !!lock,
          b: lock ? "Tỷ giá đã khoá cho kỳ này" : "Chưa khoá tỷ giá cho kỳ này",
          s: lock
            ? "1 USD = " + fmt.num(lock.rate) + " ₫ · khoá ngày " + fmt.date(lock.at)
              + ". Mọi số VND của kỳ đọc lúc nào cũng ra đúng số đã chi."
            : "Số VND của kỳ đang trôi theo tỷ giá hôm nay: chi theo bảng này rồi tháng sau mở lại sẽ ra số khác. "
              + "Chốt tỷ giá ở màn hình đối chiếu &amp; duyệt trước khi chuyển tiền." },
        { ok: pendN === 0,
          b: pendN === 0 ? "Không còn dòng nào treo ở hàng chờ khớp của kỳ này"
                         : fmt.num(pendN) + " dòng của kỳ này còn treo ở hàng chờ khớp",
          s: pendN === 0
            ? "Toàn bộ tiền về trong kỳ đã tra ra chủ và đã nằm trong bảng chi trả."
            : ctx.money2(pendAmt) + " chưa tra ra chủ nên KHÔNG có trong bảng dưới. "
              + "Khớp sau khi kỳ đã duyệt thì tiền không quay lại kỳ này nữa — nó thành khoản truy thu ghi vào kỳ đang mở." },
        { ok: null,
          b: "Chi rồi thì tỷ lệ của kỳ này không sửa lại được",
          s: "Lõi chặn thẳng việc đặt tỷ lệ hiệu lực vào kỳ đã duyệt. Muốn sửa phải thu hồi duyệt kỳ này "
             + "(và mọi kỳ sau nó), rồi duyệt lại — sau khi tiền đã chuyển đi thì không còn đường lùi. "
             + "Sai tỷ lệ thì sửa TRƯỚC khi bấm chuyển tiền." }
      ];
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Trước khi chi</h3>
            <div class="hint">Bốn thứ phải nhìn lại trước khi đem bảng này đi chuyển tiền</div>
          </div>
          <div class="btnrow">
            <button class="btn sm" data-po-go="close">Đối chiếu &amp; duyệt</button>
            ${pendN ? `<button class="btn sm" data-po-go="match">Hàng chờ khớp · ${esc(fmt.num(pendN))} dòng</button>` : ""}
          </div>
        </div>
        <div class="checks">${items.map(x => `<div class="check${x.ok === true ? " ok" : x.ok === false ? " no" : ""}">
          <div class="mk">${x.ok === true ? "✓" : x.ok === false ? "▲" : "•"}</div>
          <div><b>${esc(x.b)}</b><span>${x.s}</span></div>
        </div>`).join("")}</div>
        <div class="note">Tổng thực trả ${esc(ctx.money(S.payable))} là số đem đi chuyển khoản.
          Phần chênh giữa nó và ${esc(ctx.money(S.pool))} tiền có thể chi nằm ở ba chỗ nhìn thấy được trong bảng:
          trừ tạm ứng, dồn sang kỳ sau${S.held > EPS ? ", và điểm producer chưa gắn được danh tính" : ""}.</div>
      </div>`;
    }

    /* ---------- khung ---------- */
    root.innerHTML = `<style>${CSS}</style>
      ${kpisHTML}
      <div class="panel">
        <div class="tbl-head">
          <h3>Bảng chi trả kỳ ${esc(per.label)}</h3>
          <span class="hint">${esc(fmt.num(all.length))} bên nhận · số đã chốt lúc duyệt, không đổi theo tỷ lệ đặt sau</span>
        </div>
        <div class="po-bar">
          <input type="search" class="search" data-po="q" value="${esc(ui.q)}"
                 placeholder="Tìm tên bên nhận hoặc Client ID" aria-label="Tìm trong bảng chi trả">
          <div class="dimtabs" data-po="filters" role="group" aria-label="Lọc nhanh">
            ${FILTERS.map(f => `<button data-po-f="${esc(f.k)}" class="${ui.f === f.k ? "on" : ""}">${esc(f.lab)}</button>`).join("")}
          </div>
          <button class="btn sm" data-po="csv">Xuất CSV</button>
          <div class="po-count" data-po="count"></div>
        </div>
        <div class="vt">
          <div class="vt-head" data-po="head"></div>
          <div class="vt-body" data-po="body"><div class="vt-spacer" data-po="spacer"></div></div>
        </div>
        <div class="note po-foot" data-po="foot"></div>
      </div>
      ${beforePanel()}`;

    const $ = s => root.querySelector('[data-po="' + s + '"]');
    const head = $("head"), body = $("body"), spacer = $("spacer");
    const countEl = $("count"), footEl = $("foot"), qEl = $("q");

    /* Danh sách đang lọc — giữ lại để nút Xuất CSV dùng đúng thứ đang
       nhìn thấy, không phải cả bảng. */
    let view = all;

    const rowHTML = r => {
      const m = v => v > EPS ? esc(ctx.money2(v)) : '<span class="dim">—</span>';
      return `<div class="tt"><b>${esc(r.name)}</b><span>${esc(r.cid)} · ${esc(r.key)}</span></div>`
        + `<div><span class="${r.kindCls}">${esc(r.kindLab)}</span></div>`
        + `<div class="num">${m(r.earned)}</div>`
        + `<div class="num">${m(r.carryIn)}</div>`
        + `<div class="num">${m(r.recoup)}</div>`
        + `<div class="num pay">${r.payable > EPS ? esc(ctx.money2(r.payable)) : '<span class="dim">0</span>'}</div>`
        + `<div class="num">${m(r.carryOut)}</div>`
        + `<div class="num">${m(r.advanceLeft)}</div>`;
    };

    const vtOpts = { body, spacer, head, rows: all, cols: COLS, rowHTML, sortKey, sortDir };
    let vt = null;
    try { vt = HAUSTEK.vtable(vtOpts); }
    catch (e) { ctx.toast(e.message, "no"); return; }

    function build() {
      const q = fold(ui.q.trim());
      const test = (FILTERS.find(f => f.k === ui.f) || FILTERS[0]).test;
      const out = [];
      for (let i = 0; i < all.length; i++) {
        const r = all[i];
        if (!test(r)) continue;
        if (q && r.f.indexOf(q) < 0) continue;
        out.push(r);
      }
      const k = sortKey, d = sortDir;
      out.sort((a, b) => {
        const x = a[k], y = b[k];
        return (typeof x === "string" ? coll.compare(x, y) : (x - y)) * d;
      });
      return out;
    }

    function paint() {
      try {
        view = build();
        vtOpts.sortKey = sortKey; vtOpts.sortDir = sortDir;
        vt.refresh(view);
        body.scrollTop = 0;
        const sum = summarize(view, S.minPay);
        countEl.innerHTML = `<b>${esc(fmt.num(view.length))}</b> / ${esc(fmt.num(all.length))} bên nhận<br>`
          + `thực trả ${esc(ctx.money(sum.payable))}`
          + (S.payable > 0 ? ` · ${esc(fmt.pct(sum.payable / S.payable))} tổng phải chi` : "");
        footEl.innerHTML = `Chỉ ~30 dòng đang nhìn thấy được dựng thành HTML; ${esc(fmt.num(all.length))} dòng
          còn lại nằm trong bộ nhớ dưới dạng số. Bấm tiêu đề cột để đổi thứ tự sắp xếp.`
          + (S.held > EPS
            ? `<br>Dòng cuối bảng — <b>${esc(ctx.money(S.held))}</b> điểm producer — không trả cho ai được:
               danh mục chỉ có TÊN producer, chưa có mã. Tiền nằm lại và nhìn thấy được, chứ không lặng lẽ biến mất.`
            : "")
          + `<br>Cột <b>Thực trả</b> đã trừ tạm ứng và đã bỏ phần dưới ${esc(fmt.usd0(S.minPay))} sang kỳ sau —
             nên nó luôn nhỏ hơn cột kiếm được, đó là đúng chứ không phải thiếu tiền.`;
        if (!view.length) spacer.innerHTML = `<div class="po-empty">Không có bên nhận nào khớp bộ lọc.</div>`;
      } catch (e) { ctx.toast(e.message, "no"); }
    }

    /* ---------- sự kiện ---------- */
    let qt = null;
    qEl.addEventListener("input", () => {
      clearTimeout(qt);
      qt = setTimeout(() => { ui.q = qEl.value; paint(); }, 200);
    });

    root.querySelectorAll("[data-po-f]").forEach(b => {
      b.addEventListener("click", () => {
        ui.f = b.dataset.poF;
        root.querySelectorAll("[data-po-f]").forEach(x => x.classList.toggle("on", x === b));
        paint();
      });
    });

    head.addEventListener("click", e => {
      const sp = e.target.closest("span");
      if (!sp || !sp.dataset.k) return;
      if (sortKey === sp.dataset.k) sortDir = -sortDir;
      else { sortKey = sp.dataset.k; sortDir = TEXT_COL[sortKey] ? 1 : -1; }
      paint();
    });

    $("csv").addEventListener("click", () => {
      try {
        if (!view.length) { ctx.toast("Bộ lọc đang không còn dòng nào để xuất", "no"); return; }
        downloadCSV(buildCSV(view, pk), "haustek-chi-tra-" + pk + ".csv");
        A.audit.log("payout.export", "Xuất CSV chi trả kỳ " + per.label + " · " + view.length + " dòng");
        ctx.toast("Đã tải " + fmt.num(view.length) + " dòng chi trả kỳ " + per.label + " · số ghi bằng USD", "ok");
      } catch (e) { ctx.toast(e.message, "no"); }
    });

    root.querySelectorAll("[data-po-go]").forEach(b => {
      b.addEventListener("click", () => {
        try { ctx.go(b.dataset.poGo); } catch (e) { ctx.toast(e.message, "no"); }
      });
    });

    paint();
  }
});

})();
