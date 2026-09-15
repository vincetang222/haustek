"use strict";
/* =====================================================================
   MÀN HÌNH: BÀN GIAO TỪ CRM
   ---------------------------------------------------------------------
   CRM (crm/index.html) là hệ RIÊNG, không phải một màn hình của portal.
   Nó giữ lead, cơ hội, khách hàng, nhật ký của nó — và không đẩy thứ gì
   trong đó sang đây. Thứ duy nhất đi qua ranh giới là vài trường của một
   deal ĐÃ KÝ, đủ để dựng điều khoản thương mại:

       tỷ lệ chia cho nghệ sĩ  →  A.rates.add()
       tạm ứng (gồm marketing) →  A.advances.set()

   Chiều đi một phía: CRM ghi khoá localStorage `haustek.crm.handoff.v1`,
   màn hình này đọc. CRM không bao giờ ghi vào `haustek.portal.v1`, và
   màn hình này không ghi ngược lại khoá của CRM. Không bên nào sửa sổ
   của bên kia, nên không cần khoá chốt, không có tranh chấp.

   VÌ SAO PHẢI GẮN TAY, KHÔNG KHỚP TỰ ĐỘNG
   Danh mục hai bên không phải một. Portal có 900 nghệ sĩ và 40 label sinh
   từ bộ số giả ngẫu nhiên, label toàn tên hư cấu. CRM dùng tên thật của
   khách hàng. Đối chiếu thẳng hai danh sách thì trùng đúng MỘT tên trên
   23, và không label nào trùng. Khớp theo tên ở đây là bịa ra quan hệ
   không có thật — mà hậu quả là tiền chảy sang nhầm người. Nên mỗi deal
   phải được người gắn tay vào một partyKey bên CRM trước; ở đây chỉ nhận
   những deal đã gắn.

   VIẾT VÀO SỔ LÀ VIỆC CỦA NGƯỜI, KHÔNG PHẢI CỦA MÁY
   Kỳ hiệu lực của tỷ lệ không suy ra được từ ngày ký: "ký 11/09" không
   nói được tiền bắt đầu chia từ kỳ nào. Đó là quyết định thương mại, nên
   admin phải chọn. Và chỉ chọn được kỳ CÒN MỞ — lõi từ chối đặt tỷ lệ
   hiệu lực vào kỳ đã chốt, đúng như vậy: kỳ đã duyệt thì tiền đã chia rồi.
   ===================================================================== */
(function () {

const CSS = `
.ch-head{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.ch-src{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.75}
.ch-src b{color:var(--ink)}
.ch-pick{display:flex;gap:7px;align-items:center;font-family:var(--mono);font-size:10.5px;color:var(--muted)}
.ch-pick select{font:inherit;font-size:11.5px;padding:6px 9px;border:1px solid var(--hair2);
  border-radius:8px;background:var(--card);color:var(--ink)}
.ch-st{font-family:var(--mono);font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;
  padding:2px 8px;border-radius:5px;white-space:nowrap;display:inline-block}
.ch-st.ready{background:var(--teal-soft);color:var(--teal);border:1px solid var(--teal-hair)}
.ch-st.done{background:var(--pos-soft);color:var(--pos);border:1px solid var(--pos-hair)}
.ch-st.hold{background:var(--warn-soft);color:var(--warn-ink);border:1px solid var(--warn-hair)}
.ch-st.bad{background:var(--red-soft);color:var(--red);border:1px solid var(--red)}
.ch-party{font-family:var(--mono);font-size:10.5px;color:var(--teal)}
.ch-calls{font-family:var(--mono);font-size:10.5px;line-height:1.75;white-space:pre-wrap;
  background:var(--canvas);border-radius:8px;padding:10px 12px;margin-top:9px;color:var(--ink2)}
.ch-note{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.8;margin-top:11px}
`;

const KEY     = "haustek.crm.handoff.v1";
const VERSION = "1.0.0";

/* Kỳ hiệu lực admin đang chọn. Để ngoài DOM để sau ctx.refresh() (ghi xong
   một deal) vẫn giữ nguyên lựa chọn, khỏi phải chọn lại từng lần. */
const ui = { period: "" };

/* ---------------------------------------------------------------------
   ĐỌC BẢN TIN
   Khoá có thể không tồn tại (chưa ai mở CRM), hỏng (người sửa tay), hoặc
   sai phiên bản. Cả ba đều trả null và màn hình hiện trạng thái rỗng —
   không vá, không đoán. Cùng luật với store.load() của lõi.
   --------------------------------------------------------------------- */
function readHandoff() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { return { err: "nostore" }; }
  if (!raw) return null;
  let j;
  try { j = JSON.parse(raw); } catch (e) { return { err: "parse" }; }
  if (!j || j.v !== VERSION) return { err: "version", got: j && j.v };
  if (!Array.isArray(j.deals)) return { err: "shape" };
  return j;
}

/* partyKey từ CRM là chuỗi người gõ tay, nên phải kiểm cả hình thức lẫn
   sự tồn tại. CRM không có danh mục portal nên nó chỉ kiểm được hình thức;
   chỗ duy nhất biết id nào có thật là đây. */
function partyOk(A, key) {
  if (typeof key !== "string") return false;
  const m = /^([AL]):(\d+)$/.exec(key);
  if (!m) return false;
  const id = Number(m[2]);
  return m[1] === "A" ? A.artists.some(x => x.id === id)
                      : A.labels.some(x => x.id === id);
}

/* Dấu vết một deal đã ghi vào sổ: ghi chú mở đầu bằng "CRM <dealId>".
   Dùng chính sổ làm nguồn sự thật thay vì nuôi thêm một danh sách "đã xử
   lý" ở đâu đó — hai nguồn thì kiểu gì cũng có ngày lệch nhau. */
function markRe(dealId) {
  return new RegExp("^CRM " + String(dealId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|$)");
}
function alreadyWritten(A, deal) {
  const re = markRe(deal.dealId), pk = deal.portalPartyKey;
  const rate = A.rates.scheduleFor(pk).some(r => re.test(r.note || ""));
  const adv  = A.advances.list().some(a => a.partyKey === pk && re.test(a.note || ""));
  return { rate, adv, any: rate || adv };
}

/* Trạng thái một dòng. Thứ tự kiểm quan trọng: chưa gắn thì chưa cần biết
   party có thật không, và đã ghi rồi thì không mời ghi lại. */
function classify(A, deal) {
  if (!deal.portalPartyKey) return "unbound";
  if (!partyOk(A, deal.portalPartyKey)) return "badparty";
  if (alreadyWritten(A, deal).any) return "done";
  if (!deal.terms) return "noterms";
  return "ready";
}

function advanceOf(deal) {
  return deal.terms ? Math.round(deal.terms.totalAdvanceUSD || 0) : 0;
}
function rateOf(deal) {
  return deal.terms ? (deal.terms.artistSharePct || 0) / 100 : 0;
}

/* ---------------------------------------------------------------------
   GHI MỘT DEAL VÀO SỔ
   Hai lời gọi, cả hai đều mang ghi chú "CRM <dealId> — …" để lần sau nhận
   ra đã ghi. advances.set() THAY THẾ số gốc chứ không cộng dồn, nên nếu
   bên nhận đã có một khoản ứng từ deal khác thì phải hỏi người — im lặng
   đè lên là xoá mất một khoản nợ có thật.
   --------------------------------------------------------------------- */
async function writeOne(A, ctx, deal, periodKey) {
  const pk = deal.portalPartyKey;
  const rate = rateOf(deal), adv = advanceOf(deal);
  const note = "CRM " + deal.dealId + " — " + deal.dealName;

  if (adv > 0) {
    const cur = A.advances.list().find(a => a.partyKey === pk);
    if (cur && !markRe(deal.dealId).test(cur.note || "")) {
      const ok = await ctx.confirm(
        "Bên này đã có khoản tạm ứng",
        A.partyName(pk) + " đang ghi " + ctx.money(cur.opening) + " (đã thu hồi "
          + ctx.money(cur.recouped) + ", còn " + ctx.money(cur.balance) + ") với ghi chú "
          + JSON.stringify(cur.note || "") + ". Ghi deal này sẽ THAY THẾ số gốc bằng "
          + ctx.money(adv) + ", không cộng dồn. Phần đã thu hồi giữ nguyên. "
          + "Muốn cộng hai khoản thì sửa tay ở màn hình Tạm ứng, đừng ghi từ đây.",
        "Thay thế", true);
      if (!ok) return false;
    }
  }

  if (rate > 0) A.rates.add(pk, rate, periodKey, "CRM handoff", note);
  if (adv  > 0) A.advances.set(pk, adv, note);
  A.audit.log("crm-handoff",
    deal.dealId + " → " + pk + " · tỷ lệ " + Math.round(rate * 100) + "% từ kỳ " + periodKey
    + " · ứng " + adv);
  return true;
}

/* ---------------------------------------------------------------------
   VẼ
   --------------------------------------------------------------------- */
HAUSTEK.registerScreen({
  id: "crm-handoff",
  nav: "Bàn giao CRM",
  group: "Quản trị",
  title: "Bàn giao từ CRM",
  subtitle: "Deal đã ký bên CRM, chuyển thành <b>tỷ lệ chia</b> và <b>tạm ứng</b> trong sổ.",

  badge(ctx) {
    const h = readHandoff();
    if (!h || h.err) return "";
    const A = ctx.admin;
    const n = h.deals.filter(d => classify(A, d) === "ready").length;
    return n ? String(n) : "";
  },

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc;
    if (!document.getElementById("ch-css")) {
      const st = document.createElement("style");
      st.id = "ch-css"; st.textContent = CSS;
      document.head.appendChild(st);
    }

    const h = readHandoff();

    if (h && h.err) {
      root.innerHTML = '<div class="panel"><div class="warn"><span class="ic">!</span><div>' +
        '<b>Không đọc được bản tin bàn giao</b><span>' + esc(
          h.err === "nostore" ? "Trình duyệt chặn localStorage. Mở qua một máy chủ tĩnh thay vì file:// — xem README."
        : h.err === "version" ? "Bản tin ghi phiên bản " + (h.got || "?") + ", màn hình này đọc " + VERSION + ". Hai bên phải cùng phiên bản; không vá tự động."
        : "Nội dung khoá " + KEY + " hỏng. Mở CRM và lưu lại một lần để nó ghi đè."
        ) + '</span></div></div></div>';
      return;
    }

    if (!h) {
      root.innerHTML = '<div class="panel"><div class="empty">' +
        'Chưa có bản tin nào. Mở <b>crm/index.html</b> trên cùng trình duyệt này — ' +
        'CRM tự ghi khoá <b>' + esc(KEY) + '</b> mỗi lần lưu trạng thái.' +
        '</div></div>';
      return;
    }

    /* Chỉ kỳ CÒN MỞ. Lõi ném lỗi nếu đặt tỷ lệ hiệu lực vào kỳ đã chốt —
       mời người chọn một kỳ chắc chắn bị từ chối là mời họ bấm vào lỗi. */
    const open = A.periods.filter(p => !A.isApproved(p.k));
    if (!ui.period || !open.some(p => p.k === ui.period)) ui.period = open.length ? open[0].k : "";

    const rows = h.deals.map(d => ({ d: d, st: classify(A, d) }));
    const nReady = rows.filter(r => r.st === "ready").length;
    const nDone  = rows.filter(r => r.st === "done").length;

    const stLabel = {
      ready:    ['ready', 'sẵn sàng'],
      done:     ['done',  'đã ghi'],
      unbound:  ['hold',  'chưa gắn'],
      noterms:  ['hold',  'chưa có điều khoản'],
      badparty: ['bad',   'party không có thật']
    };

    const body = rows.map((r, i) => {
      const d = r.d, s = stLabel[r.st];
      const pname = (r.st === "badparty" || !d.portalPartyKey) ? "" : A.partyName(d.portalPartyKey);
      return '<tr>' +
        '<td><b>' + esc(d.dealName) + '</b><span class="sub">' + esc(d.account) +
          ' · ' + esc(d.accountType || "—") + ' · ký ' + esc(d.closeDate || "—") + '</span></td>' +
        '<td>' + (d.portalPartyKey
            ? '<span class="ch-party">' + esc(d.portalPartyKey) + '</span>' +
              (pname ? '<span class="sub">' + esc(pname) + '</span>' : '')
            : '<span class="dim">—</span>') + '</td>' +
        '<td class="num">' + (d.terms ? Math.round(rateOf(d) * 100) + '%' : '<span class="dim">—</span>') + '</td>' +
        '<td class="num">' + (advanceOf(d) ? esc(ctx.money(advanceOf(d))) : '<span class="dim">—</span>') + '</td>' +
        '<td><span class="ch-st ' + s[0] + '">' + esc(s[1]) + '</span></td>' +
        '<td class="num">' + (r.st === "ready"
            ? '<button class="btn sm" data-write="' + i + '">Ghi vào sổ</button>'
            : '') + '</td>' +
      '</tr>';
    }).join("");

    root.innerHTML =
      '<div class="panel">' +
        '<div class="ch-head">' +
          '<div class="ch-src">Nguồn <b>' + esc(h.source || "?") + '</b> · phiên bản ' + esc(h.v) +
            ' · ghi lúc ' + esc(String(h.at || "—").replace("T", " ").slice(0, 16)) + '<br>' +
            esc(h.deals.length) + ' deal đã ký · <b>' + nReady + '</b> sẵn sàng · ' +
            nDone + ' đã ghi</div>' +
          '<div style="margin-left:auto" class="ch-pick">' +
            '<span>tỷ lệ hiệu lực từ kỳ</span>' +
            (open.length
              ? '<select id="chPeriod">' + open.map(p =>
                  '<option value="' + esc(p.k) + '"' + (p.k === ui.period ? ' selected' : '') + '>' +
                  esc(p.label) + '</option>').join("") + '</select>'
              : '<b style="color:var(--red)">không còn kỳ mở</b>') +
          '</div>' +
          (nReady && open.length
            ? '<button class="btn pri" id="chAll">Ghi cả ' + nReady + ' deal</button>' : '') +
        '</div>' +

        (open.length ? '' :
          '<div class="warn"><span class="ic">!</span><div><b>Mọi kỳ đều đã duyệt</b>' +
          '<span>Tỷ lệ chỉ đặt được cho kỳ còn mở — kỳ đã chốt thì tiền đã chia xong. ' +
          'Chờ kỳ mới hoặc thu hồi kỳ gần nhất ở màn hình Đối chiếu &amp; duyệt kỳ.</span></div></div>') +

        '<div class="tb-wrap"><table class="tb"><thead><tr>' +
          '<th>Deal</th><th>Party bên portal</th><th class="num">Tỷ lệ NS</th>' +
          '<th class="num">Tạm ứng</th><th>Trạng thái</th><th></th>' +
        '</tr></thead><tbody>' + (body || '<tr><td colspan="6" class="dim">Chưa có deal nào</td></tr>') +
        '</tbody></table></div>' +

        '<div class="ch-note">' +
          'CRM giữ toàn bộ lead, cơ hội và nhật ký của nó — chỉ sáu trường trên đi qua ranh giới.<br>' +
          'Deal "chưa gắn" phải gắn partyKey bên CRM trước; danh mục hai bên không khớp tên nên ' +
          'không có khớp tự động.<br>' +
          'Ghi xong, ghi chú trong sổ mang dấu <b>CRM &lt;mã deal&gt;</b> — chính nó là thứ màn hình ' +
          'này dùng để biết deal nào đã xử lý, nên đừng sửa tay ghi chú đó.' +
        '</div>' +
      '</div>';

    const sel = document.getElementById("chPeriod");
    if (sel) sel.onchange = () => { ui.period = sel.value; };

    root.querySelectorAll("[data-write]").forEach(btn => {
      btn.onclick = async () => {
        const r = rows[+btn.dataset.write];
        try {
          const done = await writeOne(A, ctx, r.d, ui.period);
          if (done) { ctx.toast("Đã ghi " + r.d.dealId + " vào sổ", "ok"); ctx.refresh(); }
        } catch (e) { ctx.toast(e.message, "no"); }
      };
    });

    const all = document.getElementById("chAll");
    if (all) all.onclick = async () => {
      const list = rows.filter(r => r.st === "ready");
      const ok = await ctx.confirm("Ghi " + list.length + " deal vào sổ",
        "Tỷ lệ hiệu lực từ kỳ " + ui.period + ". Bên nào đã có tạm ứng sẽ được hỏi riêng.",
        "Ghi hết");
      if (!ok) return;
      let n = 0, failed = [];
      for (const r of list) {
        try { if (await writeOne(A, ctx, r.d, ui.period)) n++; }
        catch (e) { failed.push(r.d.dealId + ": " + e.message); }
      }
      ctx.toast(failed.length ? (n + " deal đã ghi · " + failed.length + " hỏng — " + failed[0])
                              : (n + " deal đã ghi vào sổ"),
                failed.length ? "no" : "ok");
      ctx.refresh();
    };
  }
});

})();
