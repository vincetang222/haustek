"use strict";
/* =====================================================================
   MÀN HÌNH: ĐỐI CHIẾU & DUYỆT KỲ
   ---------------------------------------------------------------------
   Duyệt kỳ là thao tác duy nhất trên toàn hệ thống có hậu quả ra ngoài:
   ngay sau nó label và nghệ sĩ đăng nhập là thấy số, và bảng chi trả đã
   chạy — tạm ứng bị trừ, phần dưới ngưỡng bị dồn sang kỳ sau. Sửa lại
   sau khi khách đã đọc và đã nhận tiền thì tốn gấp mười.
   Vì vậy thứ tự trên màn hình này là cố ý: ĐỐI CHIẾU trước, ĐIỀU KIỆN
   sau, nút duyệt nằm dưới cùng. Nút "duyệt bất chấp" vẫn phải có, vì
   ngoài đời vẫn có ngày phải chốt sổ trong khi còn lệch — nhưng nó bắt
   ghi lý do và để lại dấu trong nhật ký.
   ===================================================================== */
(function () {

const CSS = `
.cl-diff b{font-family:var(--mono);font-size:12.5px;font-variant-numeric:tabular-nums;color:var(--red)}
.cl-bad{background:var(--red-soft)}
.cl-tot td{border-top:1px solid var(--hair2);background:#FAFAFC;font-weight:600}
.cl-tot td .sub{font-weight:400}
.cl-go{width:100%;justify-content:center;padding:15px;font-size:12.5px;letter-spacing:.1em}
.cl-cur td{background:var(--teal-soft)}
.cl-act{margin-top:9px}
.cl-seat b{display:block;font-size:12.5px}
.cl-foot{margin-top:11px}
`;

/* Chênh lệch là con số phải khớp TỚI TỪNG XU, nên khi đang xem bằng VND
   thì vẫn phải nhìn thấy số USD gốc — quy đổi rồi làm tròn sẽ nuốt mất
   đúng phần cần soát. */
function diffText(ctx, v) {
  const s = (v > 0 ? "+" : "") + ctx.money2(v);
  return ctx.cur === "VND" ? s + '<span class="sub">' + ctx.esc(ctx.fmt.usd(v)) + "</span>" : ctx.esc(s);
}

/* Chênh lệch đã ghi nhận của một kỳ — đọc thẳng từ trạng thái, không
   phải quét danh mục, nên bảng 12 kỳ dùng được. */
function varianceOf(A, periodKey) {
  const all = A.state().variance || {};
  let count = 0, sum = 0;
  for (const k in all) if (k.indexOf(periodKey + ":") === 0) { count++; sum += all[k].amount || 0; }
  return { count, sum };
}

/* ---------------------------------------------------------------------
   HỘP THOẠI — mỗi cái đổi một thứ có thật trong trạng thái, nên cái nào
   cũng try/catch rồi refresh, không cái nào tự đoán thay người dùng.
   --------------------------------------------------------------------- */
async function askVariance(ctx, row) {
  const A = ctx.admin, esc = ctx.esc, per = A.periods[ctx.pIdx];
  const res = await ctx.modal({
    title: "Ghi nhận chênh lệch · " + row.feed.short + " · kỳ " + per.label,
    hint: "Đang lệch <b>" + esc(ctx.fmt.usd(row.diff)) + "</b> giữa tổng trên file gốc và tổng hệ thống tính được. "
        + "Ghi nhận không làm số đúng lên — nó chỉ nói rằng đã có người nhìn, đã biết vì sao, và chấp nhận đóng kỳ với khoản lệch đó. "
        + "Lý do viết ở đây là thứ duy nhất người đọc lại sổ sáu tháng sau còn có.",
    body: '<label class="fld">Vì sao lệch</label>'
        + '<textarea data-field="note" rows="4" placeholder="ví dụ: đối tác gửi bù 3 dòng lãnh thổ nhỏ ở kỳ sau · đã xác nhận qua email 12.08"></textarea>'
        + '<p class="note" style="margin-top:8px">Ghi vào nhật ký kèm tên người thao tác và thời điểm. Không xoá được.</p>',
    ok: "Ghi nhận chênh lệch", danger: true
  });
  if (!res) return;
  const note = String(res.note || "").trim();
  if (!note) { ctx.toast("Phải ghi lý do — chênh lệch không lý do thì kỳ sau không ai đọc lại được", "no"); return; }
  try {
    A.ingest.acceptVariance(ctx.pIdx, row.feed.id, note);
    ctx.toast("Đã ghi nhận chênh lệch " + row.feed.short, "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

async function askLockFx(ctx) {
  const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt, per = A.periods[ctx.pIdx];
  const now = A.fx.get();
  const res = await ctx.modal({
    title: "Chốt tỷ giá cho kỳ " + per.label,
    hint: "Tỷ giá chốt ở đây đóng cứng vào kỳ " + esc(per.label) + " và không đổi được nữa sau khi duyệt.",
    body: '<label class="fld">1 USD = ? ₫</label>'
        + '<input type="number" data-field="rate" min="1" step="1" style="width:190px" value="' + esc(now.rate) + '">'
        + '<p class="note" style="margin-top:8px">Tỷ giá đang dùng chung: 1 USD = ' + esc(fmt.num(now.rate)) + ' ₫ · '
        + esc(fmt.date(now.at)) + ' · chính sách: ' + esc(now.policy) + '</p>',
    ok: "Chốt tỷ giá cho kỳ này"
  });
  if (!res) return;
  const rate = Number(String(res.rate).replace(/[^\d.]/g, ""));
  if (!(rate > 0)) { ctx.toast("Tỷ giá phải lớn hơn 0", "no"); return; }
  try {
    A.fx.lock(ctx.pIdx, rate);
    ctx.toast("Đã chốt tỷ giá kỳ " + per.label + ": 1 USD = " + fmt.num(rate) + " ₫", "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

async function askApprove(ctx, seats) {
  const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt, per = A.periods[ctx.pIdx];
  const ok = await ctx.confirm(
    "Duyệt kỳ " + per.label + " và mở cho khách?",
    "Ngay sau khi bấm: <b>" + seats.total + " tài khoản khách</b> (" + seats.labels + " label · " + seats.artists
    + " nghệ sĩ) đăng nhập là thấy số của kỳ " + esc(per.label) + ".<br>"
    + "Bảng chi trả chạy luôn tại thời điểm này: trừ vào khoản tạm ứng, phần dưới "
    + esc(fmt.usd0(A.cfg.PAYOUT_MIN)) + " dồn sang kỳ sau. Số chốt lúc này là số khách đọc — "
    + "đổi tỷ lệ về sau không làm đổi kỳ đã chốt.<br>"
    + "Muốn sửa thì phải thu hồi duyệt, và khách sẽ thấy kỳ này biến mất khỏi cổng của họ.",
    "Duyệt và mở cho khách");
  if (!ok) return;
  try {
    const rows = A.approve(ctx.pIdx, "mgmt@haustek-group.com", "Đối chiếu khớp, đủ điều kiện", false);
    ctx.toast("Đã duyệt kỳ " + per.label + " · bảng chi trả " + rows.length + " dòng", "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

async function askOverride(ctx, failed) {
  const A = ctx.admin, esc = ctx.esc, per = A.periods[ctx.pIdx];
  const res = await ctx.modal({
    title: "Duyệt bất chấp kỳ " + per.label,
    hint: "Đang bỏ qua <b>" + failed.length + "</b> điều kiện: " + failed.map(c => esc(c.label)).join(" · ") + ".<br>"
        + "Khách sẽ thấy số của kỳ này ngay, kể cả phần chưa đối chiếu xong. Lần duyệt này ghi vào nhật ký "
        + "kèm danh sách điều kiện bị bỏ qua, và nó nằm lại đó vĩnh viễn.",
    body: '<label class="fld">Lý do duyệt khi chưa đủ điều kiện</label>'
        + '<textarea data-field="note" rows="4" placeholder="ví dụ: hạn chi trả 25.08, TikTok hẹn gửi bù kỳ sau · giám đốc vận hành đồng ý"></textarea>'
        + '<p class="note" style="margin-top:8px">Bắt buộc. Không ghi lý do thì không duyệt được.</p>',
    ok: "Duyệt bất chấp", danger: true
  });
  if (!res) return;
  const note = String(res.note || "").trim();
  if (!note) { ctx.toast("Phải ghi lý do mới duyệt bất chấp được", "no"); return; }
  try {
    const rows = A.approve(ctx.pIdx, "mgmt@haustek-group.com", note, true);
    ctx.toast("Đã duyệt kỳ " + per.label + " (bỏ qua " + failed.length + " điều kiện) · " + rows.length + " dòng chi trả", "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

async function askRevoke(ctx) {
  const A = ctx.admin, esc = ctx.esc, per = A.periods[ctx.pIdx];
  const res = await ctx.modal({
    title: "Thu hồi duyệt kỳ " + per.label + "?",
    hint: "Label và nghệ sĩ mất quyền xem kỳ " + esc(per.label) + " ngay lập tức — kỳ này biến khỏi cổng khách.<br>"
        + "Phần đã thu hồi tạm ứng của kỳ được hoàn lại, và phần dồn sang kỳ sau trả về đúng số dồn VÀO kỳ này, "
        + "không xoá trắng. Tiền đã chuyển ra ngoài thì hệ thống không đòi lại được — đó là việc của kế toán.",
    body: '<label class="fld">Lý do thu hồi</label>'
        + '<textarea data-field="why" rows="3" placeholder="ví dụ: đối tác gửi lại file YouTube, số cũ thiếu 2 lãnh thổ"></textarea>'
        + '<p class="note" style="margin-top:8px">Để trống thì nhật ký chỉ ghi lại thời điểm và người thao tác.</p>',
    ok: "Thu hồi duyệt", danger: true
  });
  if (!res) return;
  try {
    A.revoke(ctx.pIdx, String(res.why || "").trim());
    ctx.toast("Đã thu hồi duyệt kỳ " + per.label, "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

/* =====================================================================
   MÀN HÌNH
   ===================================================================== */
HAUSTEK.registerScreen({
  id: "close",
  nav: "Đối chiếu & duyệt",
  group: "Vận hành",
  title: "Đối chiếu và duyệt kỳ",
  subtitle: "Duyệt kỳ là <b>cánh cửa duy nhất</b> mở số liệu cho label và nghệ sĩ. Chưa duyệt thì khách không thấy đồng nào của kỳ này — kể cả khi số đã tính xong và đã đúng.",

  /* Đếm bằng cờ trạng thái thôi: badge được tính lại ở mọi lần vẽ của
     mọi màn hình, đụng vào recon ở đây là cả portal chậm theo. */
  badge(ctx) {
    const A = ctx.admin;
    let n = 0;
    A.periods.forEach((p, i) => { if (!A.missingFeeds(i).length && !A.isApproved(p.k)) n++; });
    return n ? String(n) : "";
  },

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
    const P = A.periods, pi = ctx.pIdx, pk = ctx.periodKey, per = P[pi];
    const m2 = v => ctx.money2(v);

    /* Hai lời gọi nặng nhất màn hình — mỗi cái quét cả danh mục theo
       từng luồng. Gọi ĐÚNG MỘT LẦN ở đây rồi dùng lại ở mọi khối bên
       dưới; tuyệt đối không gọi lại trong vòng lặp 12 kỳ. */
    const rec = A.recon(pi);
    const checks = A.approvalChecks(pi);

    const appr = A.approvalOf(pk);
    const failed = checks.filter(c => !c.ok);
    const seatList = A.accounts.list().filter(a => a.role !== "admin" && a.status === "active");
    const seats = {
      total: seatList.length,
      labels: seatList.filter(a => a.role === "label").length,
      artists: seatList.filter(a => a.role === "artist").length
    };

    /* ---------- 1. đối chiếu từng luồng ---------- */
    function reconPanel() {
      const body = rec.rows.map(r => {
        const loaded = r.status === "loaded";
        const bad = loaded && !r.accepted && Math.abs(r.diff) > 0.005;
        let diffCell;
        if (!loaded) {
          diffCell = '<span class="dim">—</span>';
        } else if (r.accepted) {
          diffCell = '<span class="chip wait">Đã ghi nhận ' + esc(m2(r.accepted.amount)) + "</span>"
            + '<span class="sub">' + esc(r.accepted.note || "không ghi lý do") + " · " + esc(fmt.when(r.accepted.at)) + "</span>";
        } else if (bad) {
          diffCell = "<b>" + diffText(ctx, r.diff) + "</b>"
            + (appr
              ? '<span class="sub">kỳ đã duyệt — thu hồi duyệt rồi mới ghi nhận được</span>'
              : '<div class="btnrow cl-act" style="justify-content:flex-end">'
                + '<button class="btn sm dang" data-var="' + r.feed.id + '">Ghi nhận chênh lệch</button></div>');
        } else {
          diffCell = '<span class="chip ok">0,00 · khớp</span>';
        }
        return `<tr class="${bad ? "cl-bad" : ""}">
          <td><b>${esc(r.feed.name)}</b><span class="sub">${esc(r.feed.fmt)}</span></td>
          <td>${loaded
            ? `<span class="chip ok">Đã nạp</span><span class="sub">${esc(fmt.when(r.at))}</span>`
            : `<span class="chip no">Chưa nạp</span><div class="btnrow cl-act"><button class="btn sm" data-go="ingest">Nạp luồng này</button></div>`}</td>
          <td class="mono">${esc(r.file || "—")}</td>
          <td class="num">${loaded ? esc(m2(r.control)) : '<span class="dim">—</span>'}</td>
          <td class="num">${loaded ? esc(m2(r.fromFile)) + (r.adjustments > 0.005
            ? `<span class="sub">+ ${esc(m2(r.adjustments))} truy thu kỳ cũ, không nằm trong file này</span>` : "")
            : '<span class="dim">—</span>'}</td>
          <td class="num">${loaded
            ? (r.pending > 0.005
                ? esc(m2(r.pending)) + '<span class="sub">chưa khớp được ISRC</span>'
                : '<span class="dim">0</span>')
            : '<span class="dim">—</span>'}</td>
          <td class="num cl-diff">${diffCell}</td>
        </tr>`;
      }).join("");

      const nLoaded = rec.rows.filter(r => r.status === "loaded").length;
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Đối chiếu từng luồng · kỳ ${esc(per.label)}</h3>
            <div class="hint">${nLoaded}/${A.feeds.length} luồng đã nạp · mỗi luồng đối chiếu riêng, gộp lại thì một luồng lệch sẽ bị một luồng khác che mất</div>
          </div>
        </div>
        <div class="tb-wrap"><table class="tb">
          <thead><tr>
            <th>Luồng</th><th>Trạng thái nạp</th><th>File</th>
            <th class="num">Tổng trên file gốc</th><th class="num">Đã khớp được</th>
            <th class="num">Đang treo</th><th class="num">Chênh lệch</th>
          </tr></thead>
          <tbody>
            ${body}
            <tr class="cl-tot">
              <td>Tổng cộng</td>
              <td><span class="sub">${nLoaded === A.feeds.length ? "đủ luồng" : "còn thiếu luồng — tổng dưới đây nhỏ hơn sự thật"}</span></td>
              <td class="mono">—</td>
              <td class="num">${esc(m2(rec.control))}</td>
              <td class="num">${esc(m2(rec.fromFile))}${rec.adjustments > 0.005
                ? `<span class="sub">+ ${esc(m2(rec.adjustments))} truy thu kỳ cũ</span>` : ""}</td>
              <td class="num">${esc(m2(rec.pending))}</td>
              <td class="num cl-diff">${Math.abs(rec.diff) > 0.005
                ? "<b>" + diffText(ctx, rec.diff) + "</b>"
                : '<span class="chip ok">0,00 · khớp</span>'}</td>
            </tr>
          </tbody>
        </table></div>
        <div class="note cl-foot">tổng trên file gốc = phần đã khớp + phần đang treo; chênh lệch phải bằng 0 tới từng xu.</div>
        ${rec.pending > 0.005 ? `<div class="btnrow cl-act">
          <button class="btn sm" data-go="match">Sang khớp ISRC · ${esc(m2(rec.pending))} đang treo</button>
          <span class="note">tiền treo vẫn nằm trong tổng trên file gốc, nhưng chưa biết trả cho ai</span>
        </div>` : ""}
      </div>`;
    }

    /* ---------- 2. điều kiện duyệt ---------- */
    function checksPanel() {
      const items = checks.map(c => {
        const btn = (c.id === "fx" && !c.ok && !appr)
          ? '<div class="btnrow cl-act"><button class="btn sm pri" data-fx>Chốt tỷ giá</button></div>' : "";
        return `<div class="check ${c.ok ? "ok" : "no"}">
          <div class="mk">${c.ok ? "✓" : "▲"}</div>
          <div><b>${esc(c.label)}</b><span>${esc(c.detail)}</span>${btn}</div>
        </div>`;
      }).join("");
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Điều kiện duyệt</h3>
            <div class="hint">${failed.length
              ? failed.length + "/" + checks.length + " điều kiện chưa đạt"
              : "Đủ " + checks.length + "/" + checks.length + " điều kiện"}</div>
          </div>
        </div>
        <div class="checks">${items}</div>
        <div class="note">Tỷ giá phải khoá theo từng kỳ. Không khoá thì mọi con số VND của kỳ trôi theo tỷ giá hôm nay:
        cùng một báo cáo kỳ ${esc(per.label)}, mở tháng này ra một số, mở tháng sau ra số khác — và không ai còn biết
        số nào là số đã chi. Khoá rồi thì kỳ đọc lại lúc nào cũng ra đúng số đã chi.</div>
      </div>`;
    }

    /* ---------- 3. khối duyệt ---------- */
    function approvePanel() {
      if (appr) {
        const over = appr.overrides || [];
        const labelOf = id => { const c = checks.find(x => x.id === id); return c ? c.label : id; };
        const pay = A.payoutOf(pk) || [];
        const paid = pay.filter(r => r.payable > 0).length;
        const sumPay = pay.reduce((s, r) => s + r.payable, 0);
        const sumRec = pay.reduce((s, r) => s + r.recoup, 0);
        const held = pay.find(r => r.kind === "producer");
        const laterOpen = P.slice(pi + 1).filter(p => A.isApproved(p.k));
        return `<div class="panel">
          <div class="okbar">
            <div class="ic">✓</div>
            <div>
              <b>Kỳ ${esc(per.label)} đã duyệt — khách đang thấy số của kỳ này</b>
              <span>${esc(appr.by)} · ${esc(fmt.when(appr.at))}${appr.note ? " · " + esc(appr.note) : ""}</span>
            </div>
          </div>
          <div class="drill-cols">
            <div class="mini">
              <h4>Lần duyệt này</h4>
              <table>
                <tr><td>Người duyệt</td><td>${esc(appr.by)}</td></tr>
                <tr><td>Lúc</td><td>${esc(fmt.when(appr.at))}</td></tr>
                <tr><td>Ghi chú</td><td>${esc(appr.note || "—")}</td></tr>
                <tr><td>Điều kiện bỏ qua</td><td>${over.length
                  ? '<span class="chip no">' + over.length + "</span>"
                  : '<span class="chip ok">không</span>'}</td></tr>
              </table>
              ${over.length ? `<div class="note" style="margin-top:9px">Đã bỏ qua: ${
                over.map(id => esc(labelOf(id))).join(" · ")}. Kỳ này đóng sổ trong khi những điều kiện đó chưa đạt.</div>` : ""}
            </div>
            <div class="mini">
              <h4>Bảng chi trả đã chạy</h4>
              <table>
                <tr><td>Bên nhận có tiền kỳ này</td><td>${fmt.num(paid)} / ${fmt.num(pay.length)}</td></tr>
                <tr><td>Tổng thực trả</td><td>${esc(ctx.money(sumPay))}</td></tr>
                <tr><td>Trừ vào tạm ứng</td><td>${esc(ctx.money(sumRec))}</td></tr>
                ${held ? `<tr><td>Điểm producer giữ lại</td><td>${esc(ctx.money(held.earned))}</td></tr>` : ""}
              </table>
              <div class="note" style="margin-top:9px">${held
                ? "Điểm producer chưa gắn được danh tính nên nằm lại một dòng riêng, không lặng lẽ biến mất."
                : "Số này chốt tại thời điểm duyệt và không đổi theo tỷ lệ đặt sau."}</div>
            </div>
          </div>
          <div class="btnrow cl-act">
            <button class="btn dang" data-revoke>Thu hồi duyệt</button>
            <button class="btn sm" data-go="payouts">Xem bảng chi trả</button>
            ${laterOpen.length ? `<span class="note">phải thu hồi ${esc(laterOpen.map(p => p.label).join(", "))} trước</span>` : ""}
          </div>
        </div>`;
      }

      const openBefore = P.slice(0, pi).filter(p => !A.isApproved(p.k));
      const orderWarn = openBefore.length ? `<div class="warn">
        <div class="ic">▲</div>
        <div>
          <b>Còn ${openBefore.length} kỳ trước chưa duyệt: ${esc(openBefore.map(p => p.label).join(", "))}</b>
          <span>Kỳ phải đóng theo thứ tự. Phần tiền dưới ngưỡng dồn từ kỳ này sang kỳ sau và tạm ứng thu hồi dần
          qua từng kỳ — duyệt nhảy cóc thì hai chuỗi đó đứt, và không cách nào phát hiện ra sau khi đã chi tiền.</span>
        </div></div>` : "";

      if (!failed.length) {
        return `<div class="panel">
          <div class="panel-head">
            <div>
              <h3>Duyệt kỳ ${esc(per.label)}</h3>
              <div class="hint">Đủ ${checks.length}/${checks.length} điều kiện · ${seats.total} tài khoản khách đang chờ mở kỳ này</div>
            </div>
          </div>
          ${orderWarn}
          <button class="btn go cl-go" data-approve>Duyệt kỳ và mở cho khách</button>
          <div class="note cl-foot">Bấm xong: ${seats.labels} label và ${seats.artists} nghệ sĩ thấy số của kỳ ${esc(per.label)} ngay,
          bảng chi trả chạy luôn (trừ tạm ứng, dồn phần dưới ${esc(fmt.usd0(A.cfg.PAYOUT_MIN))} sang kỳ sau).</div>
        </div>`;
      }

      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Duyệt kỳ ${esc(per.label)}</h3>
            <div class="hint">Còn ${failed.length}/${checks.length} điều kiện chưa đạt — nút duyệt đang khoá</div>
          </div>
        </div>
        ${orderWarn}
        <div class="warn">
          <div class="ic">▲</div>
          <div>
            <b>Chưa duyệt được: ${esc(failed.map(c => c.label).join(" · "))}</b>
            <span>Mở kỳ cho khách lúc này là gửi ra ngoài một con số mình biết là chưa đúng.
            Xử lý nốt ở hai khối trên rồi quay lại — nút sẽ tự sáng.</span>
          </div>
        </div>
        <button class="btn go cl-go" disabled>Duyệt kỳ và mở cho khách</button>
        <div class="btnrow cl-act">
          <button class="btn dang" data-override>Duyệt bất chấp (ghi lý do)</button>
          <span class="note">bắt buộc ghi lý do · lần duyệt này để lại dấu vĩnh viễn trong nhật ký, kèm danh sách điều kiện đã bỏ qua</span>
        </div>
      </div>`;
    }

    /* ---------- 4. sau khi duyệt thì ai thấy gì ---------- */
    function seatsPanel() {
      const rows = [
        { r: "Admin", c: "chip", w: "Toàn bộ: doanh thu gộp tách theo từng luồng, hàng chờ khớp ISRC, tỷ lệ gốc, tên đơn vị phân phối, bảng chi trả, nhật ký.",
          n: "Thấy cả kỳ chưa duyệt — đó là chỗ làm việc." },
        { r: "Label", c: "chip lbl", w: "Doanh thu bản ghi của nghệ sĩ thuộc label, phần label giữ, phần trả cho nghệ sĩ, bóc theo cửa hàng và lãnh thổ, danh sách bài.",
          n: "Không thấy tác quyền — tác quyền thuộc người sáng tác, không đi qua label. Không thấy nghệ sĩ của label khác." },
        { r: "Nghệ sĩ", c: "chip ind", w: "Phần của mình sau khi trừ phí, phần label (hoặc phần Haustek giữ thêm nếu độc lập) và điểm producer; khoản tạm ứng còn lại và thực nhận kỳ này. Có phần sáng tác thì thêm dòng tiền tác quyền.",
          n: "Chỉ bài của mình. Không thấy số của nghệ sĩ khác, kể cả cùng label." }
      ];
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Sau khi duyệt thì ai thấy gì</h3>
            <div class="hint">Cắt dữ liệu nằm ở tầng máy chủ, không phải ở giao diện — cổng khách không bao giờ nhận được phần không thuộc về mình</div>
          </div>
        </div>
        <div class="tb-wrap"><table class="tb">
          <thead><tr><th>Vai</th><th>Thấy gì của kỳ ${esc(per.label)}</th><th>Không thấy</th></tr></thead>
          <tbody>${rows.map(x => `<tr>
            <td><span class="${x.c}">${esc(x.r)}</span></td>
            <td class="cl-seat">${esc(x.w)}</td>
            <td class="dim">${esc(x.n)}</td>
          </tr>`).join("")}</tbody>
        </table></div>
        <div class="note cl-foot">Khách chỉ thấy <b>tên cửa hàng</b> và <b>số tiền phần mình</b> — thứ họ vốn đã biết.
        Tên đơn vị phân phối và tỷ lệ gốc không bao giờ rời khỏi trang intranet này, kể cả trong dữ liệu thô của trình duyệt khách.</div>
      </div>`;
    }

    /* ---------- 5. tình trạng 12 kỳ ---------- */
    function periodsPanel() {
      const body = P.map((p, i) => {
        const miss = A.missingFeeds(i);
        const pend = A.queue.pendingTotal(p.k);
        const ap = A.approvalOf(p.k);
        const v = varianceOf(A, p.k);
        const isCur = i === pi;

        let diffCell;
        if (isCur) {
          diffCell = Math.abs(rec.diff) > 0.005
            ? '<span class="chip no">' + esc((rec.diff > 0 ? "+" : "") + m2(rec.diff)) + "</span>"
            : '<span class="chip ok">khớp</span>';
          if (v.count) diffCell += '<span class="sub">' + v.count + " khoản đã ghi nhận · " + esc(m2(v.sum)) + "</span>";
        } else if (ap) {
          diffCell = (ap.overrides || []).indexOf("recon") >= 0
            ? '<span class="chip no">duyệt bất chấp</span>'
            : v.count ? '<span class="chip wait">đã ghi nhận ' + esc(m2(v.sum)) + "</span>"
                      : '<span class="chip ok">khớp</span>';
        } else {
          diffCell = v.count
            ? '<span class="chip wait">đã ghi nhận ' + esc(m2(v.sum)) + "</span>"
            : '<span class="dim">chưa soát</span>';
        }

        return `<tr class="${isCur ? "cl-cur" : ""}">
          <td><b>${esc(p.label)}</b>${isCur ? '<span class="sub">đang xem</span>' : ""}</td>
          <td>${miss.length
            ? `<span class="chip no">${A.feeds.length - miss.length}/${A.feeds.length}</span><span class="sub">thiếu ${esc(miss.map(f => f.short).join(", "))}</span>`
            : `<span class="chip ok">${A.feeds.length}/${A.feeds.length}</span>`}</td>
          <td>${diffCell}</td>
          <td class="num">${pend > 0.005 ? esc(m2(pend)) : '<span class="dim">0</span>'}</td>
          <td>${ap
            ? `<span class="chip ok">Đã duyệt</span><span class="sub">${esc(fmt.date(ap.at))}${
                (ap.overrides || []).length ? " · bỏ qua " + ap.overrides.length : ""}</span>`
            : '<span class="chip wait">Chưa duyệt</span>'}</td>
          <td class="num">${isCur
            ? '<span class="dim">đang xem</span>'
            : '<button class="btn sm" data-per="' + i + '">Chọn kỳ này</button>'}</td>
        </tr>`;
      }).join("");

      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Tình trạng ${P.length} kỳ</h3>
            <div class="hint">Kỳ nào còn hở thì hở ở đâu — nhìn một lượt là biết phải quay lại kỳ nào</div>
          </div>
        </div>
        <div class="tb-wrap"><table class="tb">
          <thead><tr>
            <th>Kỳ</th><th>Luồng</th><th>Chênh lệch</th>
            <th class="num">Tiền treo</th><th>Duyệt</th><th class="num"></th>
          </tr></thead>
          <tbody>${body}</tbody>
        </table></div>
        <div class="note cl-foot">Cột chênh lệch chỉ tính đầy đủ cho kỳ đang chọn: đối chiếu một kỳ phải quét
        ${fmt.num(A.trackCount)} bản ghi × ${A.feeds.length} luồng, làm cả ${P.length} kỳ trong một lần vẽ thì trang đứng hình.
        Các kỳ khác hiện lại kết quả đã ghi nhận — chọn kỳ nào thì kỳ đó được đối chiếu lại đầy đủ ở bảng trên.</div>
      </div>`;
    }

    root.innerHTML = "<style>" + CSS + "</style>"
      + reconPanel() + checksPanel() + approvePanel()
      + '<div class="grid2 even">' + seatsPanel() + periodsPanel() + "</div>";

    /* Khung intranet không có hàm toàn cục — mọi nút gắn sự kiện sau khi
       DOM đã dựng xong, không dùng onclick="" trong chuỗi HTML. */
    root.querySelectorAll("[data-go]").forEach(b => {
      b.addEventListener("click", () => {
        try { ctx.go(b.dataset.go); } catch (e) { ctx.toast(e.message, "no"); }
      });
    });
    root.querySelectorAll("[data-per]").forEach(b => {
      b.addEventListener("click", () => {
        try { ctx.setPeriod(+b.dataset.per); } catch (e) { ctx.toast(e.message, "no"); }
      });
    });
    root.querySelectorAll("[data-var]").forEach(b => {
      b.addEventListener("click", () => {
        const row = rec.rows.find(r => r.feed.id === +b.dataset.var);
        if (row) askVariance(ctx, row);
      });
    });
    const fxBtn = root.querySelector("[data-fx]");
    if (fxBtn) fxBtn.addEventListener("click", () => askLockFx(ctx));
    const okBtn = root.querySelector("[data-approve]");
    if (okBtn) okBtn.addEventListener("click", () => askApprove(ctx, seats));
    const ovBtn = root.querySelector("[data-override]");
    if (ovBtn) ovBtn.addEventListener("click", () => askOverride(ctx, failed));
    const rvBtn = root.querySelector("[data-revoke]");
    if (rvBtn) rvBtn.addEventListener("click", () => askRevoke(ctx));
  }
});

})();
