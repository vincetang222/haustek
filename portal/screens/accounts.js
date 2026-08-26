"use strict";
/* =====================================================================
   MÀN HÌNH: TÀI KHOẢN & NHẬT KÝ KIỂM TOÁN
   ---------------------------------------------------------------------
   Cả màn hình này đứng trên một câu: quyền truy cập bám MÃ SỐ, không bao
   giờ bám tên chữ. Tên trong danh mục có dấu &, có dấu nháy, có dấu hai
   chấm, có dấu tiếng Việt, có cả chữ hoa toàn phần. Đem tên đi so để
   quyết định ai được thấy dòng nào thì chỉ cần một dấu lệch là nghệ sĩ
   mất tiền — hoặc tệ hơn, nhìn thấy dữ liệu của người khác.

   Nửa dưới màn hình là nhật ký. Nó không phải để trang trí: khi có tranh
   chấp, câu hỏi luôn là "ai đổi cái này, lúc nào", và nhật ký là chỗ duy
   nhất trả lời được. Nên nó nằm cùng trang với tài khoản, không giấu
   trong một mục cài đặt nào đó.
   ===================================================================== */
(function () {

const CSS = `
.ac-live{display:block;font-family:var(--mono);font-size:10.5px;color:var(--teal);margin-top:7px;line-height:1.6}
.ac-bar{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:11px}
.ac-count{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.75;margin-bottom:9px}
.ac-acts{display:flex;gap:6px;justify-content:flex-end}
.ac-k{margin-left:6px}
.ac-id{font-family:var(--mono);font-size:11px;color:var(--teal);font-variant-numeric:tabular-nums}
.ac-trap td{vertical-align:middle}
.ac-trap .ac-nm{font-size:13.5px;font-weight:500;word-break:break-word}
.ac-why{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.75}
.ac-gate td{vertical-align:top;font-size:12px;line-height:1.65}
.ac-gate .ac-role{white-space:nowrap}
.ac-gate .ac-no{color:var(--red)}
.ac-note{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.8;margin-top:10px}
.ac-log td{vertical-align:top}
.ac-when{white-space:nowrap;font-family:var(--mono);font-size:11px;color:var(--ink2)}
.ac-act{white-space:nowrap}
.ac-raw{display:block;font-family:var(--mono);font-size:9px;color:var(--muted2);margin-top:3px}
`;

/* 900 nghệ sĩ nhét hết vào một thẻ select là danh sách không ai cuộn nổi
   — cắt ở 200 và bắt gõ tìm, giống các màn hình khác. */
const OPT_LIMIT = 200;

const fold = s => String(s == null ? "" : s).toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d");

/* Trạng thái riêng của màn hình, để ngoài DOM: sau ctx.refresh() (mời,
   khoá, xoá một tài khoản) bộ lọc nhật ký còn nguyên chỗ đang đứng. */
const ui = { q: "", grp: "" };

const ROLE = {
  admin:  { lab: "Admin",   chip: "no"  },
  label:  { lab: "Label",   chip: "lbl" },
  artist: { lab: "Nghệ sĩ", chip: "ind" }
};
const ROLE_RANK = { admin: 0, label: 1, artist: 2 };
const STATUS = {
  active:    { lab: "Đang dùng",         chip: "ok"   },
  invited:   { lab: "Đã mời, chưa nhận", chip: "wait" },
  suspended: { lab: "Tạm khoá",          chip: "no"   }
};

/* Bốn cái tên này có thật trong danh mục và mỗi cái hỏng theo một kiểu
   khác nhau. Để chúng ngay đầu màn hình vì đây là lý do tồn tại của cột
   Client ID — nói suông "bám mã số" thì không ai nhớ. */
const TRAPS = [
  { name: "nae & de'lay",
    why: "Có <code>&amp;</code> và dấu nháy đơn. Ghép thẳng vào HTML là vỡ trang; cho đi qua một vòng thoát ký tự rồi đem so tên thì <code>&amp;amp;</code> không còn bằng <code>&amp;</code> nữa." },
  { name: "ling:chi",
    why: "Dấu hai chấm trùng đúng ký tự ngăn trong khoá bên nhận (<code>A:18</code>). Cắt khoá bằng dấu hai chấm mà lại bám tên là cắt nhầm chỗ, im lặng." },
  { name: "HƯƠNGMYBÔNG",
    why: "Hoa toàn phần, lại có dấu. Phép so “không phân biệt hoa thường” trên chữ tiếng Việt không quay về đúng chuỗi ban đầu ở mọi ngôn ngữ, mọi cơ sở dữ liệu." },
  { name: "Thiện Hí",
    why: "Dấu tiếng Việt có hai cách mã hoá (dựng sẵn và tổ hợp). Hai chuỗi nhìn y hệt nhau vẫn khác nhau từng byte — so bằng dấu bằng là trượt." }
];

/* Bảng phân quyền trong tài liệu bàn giao, viết lại đúng ba dòng cho mỗi
   vai. Đây là bản để người vận hành đối chiếu, nên phải khớp từng chữ với
   thứ cổng khách thật sự trả về. */
const GATE = [
  { role: "admin", where: "chỉ trang intranet này",
    see: "Toàn bộ danh mục, cả 12 kỳ, kể cả kỳ chưa duyệt · doanh thu gộp trước mọi khoản trừ · phí Haustek · tỷ lệ gốc của mọi bên · hàng chờ khớp ISRC và tiền treo.",
    edit: "Tỷ lệ chia mặc định · phí · đối chiếu từng luồng · duyệt và thu hồi duyệt kỳ · tạm ứng · tỷ giá · tài khoản.",
    hide: "Không mục nào bị che. Đây cũng là vai DUY NHẤT thấy tên đơn vị phân phối và tỷ lệ gốc — hai thứ đó không bao giờ rời khỏi trang này." },
  { role: "label", where: "cổng khách",
    see: "Bản ghi của nghệ sĩ trong label mình · doanh thu gộp · phần label nhận · phần trả cho nghệ sĩ · từng kỳ đã duyệt.",
    edit: "Tỷ lệ chia cho nghệ sĩ của mình, trong khung Haustek cho phép. Sửa hôm nay chỉ ăn vào kỳ chưa chốt.",
    hide: "Label khác · nghệ sĩ độc lập · tên đơn vị phân phối. Không có tab tác quyền: tác quyền thuộc người sáng tác, không đi qua label." },
  { role: "artist", where: "cổng khách",
    see: "Bài của mình · bóc theo cửa hàng và lãnh thổ · từng chặng tiền đi từ doanh thu gộp tới số cuối · số thực nhận sau khi trừ tạm ứng.",
    edit: "Không sửa gì. Thấy số, không đổi số.",
    hide: "Nghệ sĩ khác · tên đơn vị phân phối · doanh thu tổng của label." }
];

/* Nhóm hành động = phần trước dấu chấm của trường action. Màu chip theo
   sức nặng của hành động, không theo trang trí: đỏ là thứ mở hoặc đóng số
   liệu trước mặt khách, vàng là thứ đụng vào tiền, xanh là quyền truy cập. */
const GROUPS = [
  { k: "ingest",  lab: "Nạp dữ liệu",   chip: ""     },
  { k: "queue",   lab: "Hàng chờ khớp", chip: ""     },
  { k: "recon",   lab: "Đối chiếu",     chip: ""     },
  { k: "rate",    lab: "Tỷ lệ chia",    chip: "wait" },
  { k: "advance", lab: "Tạm ứng",       chip: "wait" },
  { k: "fx",      lab: "Tỷ giá",        chip: "wait" },
  { k: "period",  lab: "Duyệt kỳ",      chip: "no"   },
  { k: "payout",  lab: "Chi trả",       chip: "wait" },
  { k: "account", lab: "Tài khoản",     chip: "info" },
  { k: "answer",  lab: "Câu hỏi treo",  chip: ""     }
];
const groupOf = k => GROUPS.find(g => g.k === k) || { k, lab: k, chip: "" };

/* Admin còn vào được trang: tài khoản admin chưa bị khoá. Tài khoản admin
   đang tạm khoá không cứu được ai cả, nên không tính vào số này. */
function usableAdmins(A, exceptId) {
  return A.accounts.list().filter(a =>
    a.role === "admin" && a.status !== "suspended" && a.id !== exceptId);
}

/* ---------------------------------------------------------------------
   HỘP THOẠI MỜI TÀI KHOẢN
   --------------------------------------------------------------------- */
async function askInvite(ctx) {
  const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;

  /* Một bên nhận có thể có nhiều người cùng xem (quản lý, kế toán) — lõi
     không chặn. Nhưng phải nói ra, không thì admin tưởng mình nhầm. */
  const have = new Map();
  A.accounts.list().forEach(a => {
    if (!a.partyKey) return;
    have.set(a.partyKey, (have.get(a.partyKey) || 0) + 1);
  });

  const res = await ctx.modal({
    title: "Mời tài khoản",
    hint: "Tài khoản mới nằm ở trạng thái <b>đã mời, chưa nhận</b> cho tới khi được kích hoạt. "
        + "Email chỉ để gửi lời mời — thứ quyết định người này thấy dòng nào là <b>mã bên nhận</b> chọn bên dưới.",
    body: '<label class="fld">Email</label>'
      + '<input type="email" data-field="email" style="width:100%" placeholder="ten@congty.vn" autocomplete="off">'
      + '<label class="fld" style="margin-top:13px">Vai trò</label>'
      + '<select data-field="role" style="max-width:100%;width:100%">'
      + '<option value="artist">Nghệ sĩ — chỉ thấy bài của mình</option>'
      + '<option value="label">Label — thấy nghệ sĩ trong label mình</option>'
      + '<option value="admin">Admin — thấy toàn bộ, kể cả tên đơn vị phân phối</option>'
      + '</select>'
      + '<div data-ac-party>'
      + '<label class="fld" style="margin-top:13px">Tìm bên nhận</label>'
      + '<input type="search" data-ac-find placeholder="Gõ tên hoặc mã Client ID để thu hẹp…" style="width:100%">'
      + '<label class="fld" style="margin-top:13px">Bên nhận — quyền bám vào mã này</label>'
      + '<select data-field="party" size="6" style="width:100%;max-width:100%;font-size:11px"></select>'
      + '<span class="ac-live" data-ac-live></span>'
      + '</div>'
      + '<p class="note" style="margin-top:10px">Admin không gắn với bên nhận nào: vai này thấy cả danh mục, '
      + 'cả tỷ lệ gốc, cả tên đơn vị phân phối. Chỉ cấp cho người trong đội vận hành.</p>',
    ok: "Gửi lời mời",
    onMount(bg) {
      const roleEl  = bg.querySelector('[data-field="role"]');
      const partyEl = bg.querySelector('[data-field="party"]');
      const wrapEl  = bg.querySelector("[data-ac-party]");
      const qEl     = bg.querySelector("[data-ac-find]");
      const live    = bg.querySelector("[data-ac-live]");
      let matched = 0;

      function paintLive() {
        const key = partyEl.value;
        const n = key ? (have.get(key) || 0) : 0;
        live.textContent = !key
          ? "Không có bên nhận nào khớp — sửa lại ô tìm."
          : n
            ? "Bên này đã có " + n + " tài khoản. Thêm nữa là thêm một người cùng xem, không thay người cũ."
            : "Đang hiện " + Math.min(matched, OPT_LIMIT) + "/" + matched + " bên nhận"
              + (matched > OPT_LIMIT ? " — còn " + (matched - OPT_LIMIT) + " người nữa, gõ thêm vào ô tìm." : ".");
      }
      function fill() {
        const isLabel = roleEl.value === "label";
        const all = isLabel ? A.labels : A.artists;
        const needle = fold(qEl.value.trim());
        const hit = [];
        for (let i = 0; i < all.length; i++) {
          const p = all[i];
          if (needle && fold(p.name + " " + p.clientId).indexOf(needle) < 0) continue;
          hit.push(p);
        }
        /* Select nhiều dòng mở ra không chọn sẵn gì — không đánh dấu dòng
           đầu thì bấm Gửi ngay sẽ báo chưa chọn bên nhận. */
        partyEl.innerHTML = hit.slice(0, OPT_LIMIT).map((p, n) => {
          const cnt = have.get(p.key) || 0;
          return '<option value="' + esc(p.key) + '"' + (n === 0 ? " selected" : "") + ">"
            + esc(p.name) + " · " + esc(p.clientId)
            + (isLabel ? "" : " · " + esc(p.labelId >= 0 ? A.labels[p.labelId].name : "độc lập"))
            + (cnt ? " · đã có " + cnt + " tài khoản" : "") + "</option>";
        }).join("");
        matched = hit.length;
        paintLive();
      }
      function syncRole() {
        const admin = roleEl.value === "admin";
        wrapEl.classList.toggle("hide", admin);
        if (!admin) { qEl.value = ""; fill(); }
      }
      roleEl.addEventListener("change", syncRole);
      qEl.addEventListener("input", fill);
      partyEl.addEventListener("change", paintLive);
      syncRole();
    }
  });
  if (!res) return;

  const email = String(res.email || "").trim();
  const role = String(res.role || "artist");
  const partyKey = role === "admin" ? null : String(res.party || "");
  if (role !== "admin" && !partyKey) {
    ctx.toast("Chưa chọn được bên nhận — sửa lại ô tìm rồi chọn một dòng", "no");
    return;
  }
  try {
    A.accounts.add(email, role, partyKey);
    ctx.toast("Đã mời " + email + (partyKey ? " · " + A.partyClientId(partyKey) : " · admin"), "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

/* ---------------------------------------------------------------------
   ĐỔI TRẠNG THÁI
   --------------------------------------------------------------------- */
async function askStatus(ctx, acc) {
  const A = ctx.admin, esc = ctx.esc;
  const next = acc.status === "active" ? "suspended" : "active";

  /* Khoá nốt admin cuối cùng thì không còn ai mở khoá lại được — cùng một
     tai nạn với xoá, chặn ở cùng một chỗ. Trong hệ thật phép kiểm này phải
     nằm ở máy chủ; ở đây nó chỉ giữ cho bản mẫu không tự khoá mình. */
  if (next === "suspended" && acc.role === "admin" && usableAdmins(A, acc.id).length === 0) {
    ctx.toast("Đây là admin duy nhất còn dùng được — khoá xong không ai mở lại được. Mời thêm một admin trước.", "no");
    return;
  }

  if (next === "suspended") {
    /* partyName không nhận null — tài khoản admin không gắn bên nhận nào. */
    const who = acc.partyKey ? A.partyName(acc.partyKey) : null;
    const ok = await ctx.confirm("Tạm khoá " + acc.email + "?",
      "Người này mất quyền vào ngay lập tức, kể cả phiên đang mở. "
      + (who ? "Dữ liệu và các kỳ đã duyệt của <b>" + esc(who) + "</b> giữ nguyên — mở lại là thấy lại."
             : "Tài khoản vẫn còn trong danh sách, mở lại được bất cứ lúc nào."),
      "Tạm khoá", true);
    if (!ok) return;
  }
  try {
    A.accounts.setStatus(acc.id, next);
    ctx.toast(next === "active"
      ? (acc.status === "invited" ? "Đã kích hoạt " : "Đã mở lại ") + acc.email
      : "Đã tạm khoá " + acc.email, "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

/* ---------------------------------------------------------------------
   XOÁ TÀI KHOẢN
   --------------------------------------------------------------------- */
async function askRemove(ctx, acc) {
  const A = ctx.admin, esc = ctx.esc;

  if (acc.role === "admin" && usableAdmins(A, acc.id).length === 0) {
    ctx.toast("Không xoá được: đây là tài khoản admin cuối cùng còn dùng được. Xoá xong không ai vào được trang này nữa.", "no");
    return;
  }
  const who = acc.partyKey ? A.partyName(acc.partyKey) + " · " + A.partyClientId(acc.partyKey) : "toàn quyền admin";
  const ok = await ctx.confirm("Xoá tài khoản " + acc.email + "?",
    "Đang gắn với <b>" + esc(who) + "</b>.<br>"
    + "Xoá tài khoản không xoá bên nhận, không đụng tới bản ghi, tiền hay các kỳ đã chốt — chỉ cắt đường vào. "
    + "Muốn cắt tạm thì dùng <b>Tạm khoá</b>, mở lại được. "
    + "Dòng xoá này vẫn nằm lại trong nhật ký bên dưới.",
    "Xoá tài khoản", true);
  if (!ok) return;
  try {
    A.accounts.remove(acc.id);
    ctx.toast("Đã xoá tài khoản " + acc.email, "ok");
    ctx.refresh();
  } catch (e) { ctx.toast(e.message, "no"); }
}

/* =====================================================================
   MÀN HÌNH
   ===================================================================== */
HAUSTEK.registerScreen({
  id: "accounts",
  nav: "Tài khoản & nhật ký",
  group: "Quản trị",
  title: "Tài khoản và nhật ký",
  subtitle: "Quyền truy cập bám <b>mã số</b> — Client ID — chứ không bao giờ bám tên chữ. "
          + "Tên đổi được, viết hoa viết thường khác nhau, có dấu và ký tự lạ; mã số thì không đổi. "
          + "Nhật ký bên dưới là thứ trả lời câu “ai đổi cái này, lúc nào” khi có tranh chấp.",

  badge(ctx) {
    const n = ctx.admin.accounts.list().filter(a => a.status === "invited").length;
    return n ? String(n) : "";
  },

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;

    /* ---------- dữ liệu ---------- */
    const accounts = A.accounts.list().slice().sort((a, b) => {
      const d = (ROLE_RANK[a.role] || 9) - (ROLE_RANK[b.role] || 9);
      return d || a.email.localeCompare(b.email, "vi");
    });
    const nBy = { admin: 0, label: 0, artist: 0 };
    const nSt = { active: 0, invited: 0, suspended: 0 };
    const parties = { L: new Set(), A: new Set() };
    let nMfa = 0;
    accounts.forEach(a => {
      nBy[a.role] = (nBy[a.role] || 0) + 1;
      nSt[a.status] = (nSt[a.status] || 0) + 1;
      if (a.mfa) nMfa++;
      if (a.partyKey && parties[a.partyKey[0]]) parties[a.partyKey[0]].add(a.partyKey);
    });
    const nParty = parties.L.size + parties.A.size;
    const totalParty = A.labels.length + A.artists.length;
    const liveAdmins = usableAdmins(A, null).length;

    /* Nhật ký: 150 dòng gần nhất, một vòng duy nhất để dựng sẵn khoá tìm. */
    const logAll = A.audit.list(150).map(r => {
      const action = String(r.action || "");
      const dot = action.indexOf(".");
      const grp = dot > 0 ? action.slice(0, dot) : action;
      return { at: r.at, by: r.by || "—", action, grp, detail: r.detail || "",
               f: fold([r.at, r.by, action, groupOf(grp).lab, r.detail].join(" ")) };
    });
    const kept = (A.state().audit || []).length;
    const grpCount = new Map();
    logAll.forEach(r => grpCount.set(r.grp, (grpCount.get(r.grp) || 0) + 1));
    const grpList = GROUPS.filter(g => grpCount.has(g.k))
      .concat([...grpCount.keys()].filter(k => !GROUPS.some(g => g.k === k)).map(k => groupOf(k)));

    /* ---------- 1. thẻ số ---------- */
    function kpis() {
      return `<div class="kpis">
        <div class="kpi hero">
          <div class="lab">Tài khoản đang dùng</div>
          <div class="val">${fmt.num(nSt.active || 0)}</div>
          <div class="sub">trên ${fmt.num(accounts.length)} tài khoản đã cấp${
            nSt.invited ? " · " + nSt.invited + " mời chưa nhận" : ""}${
            nSt.suspended ? " · " + nSt.suspended + " đang tạm khoá" : ""}<br>${
            nBy.admin} admin · ${nBy.label} label · ${nBy.artist} nghệ sĩ</div>
        </div>
        <div class="kpi">
          <div class="lab">Bên nhận đã có người xem</div>
          <div class="val">${fmt.num(nParty)}</div>
          <div class="sub">${fmt.pct(totalParty > 0 ? nParty / totalParty : 0)} của ${fmt.num(totalParty)} bên nhận trong danh mục<br>
            còn ${fmt.num(A.labels.length - parties.L.size)} label và ${fmt.num(A.artists.length - parties.A.size)} nghệ sĩ chưa ai đăng nhập được</div>
        </div>
        <div class="kpi ${nMfa < accounts.length ? "bad" : "good"}">
          <div class="lab">Xác thực hai lớp</div>
          <div class="val">${fmt.num(nMfa)}/${fmt.num(accounts.length)}</div>
          <div class="sub">bản mẫu chỉ bật sẵn cho admin<br>
            ${fmt.num(accounts.length - nMfa)} tài khoản thấy tiền mà vào bằng mật khẩu suông — khi làm thật phải bắt buộc cả ba vai</div>
        </div>
        <div class="kpi">
          <div class="lab">Nhật ký đang giữ</div>
          <div class="val">${fmt.num(kept)}</div>
          <div class="sub">dòng · hiện ${fmt.num(logAll.length)} dòng gần nhất bên dưới<br>${
            logAll.length
              ? "gần nhất: " + esc(groupOf(logAll[0].grp).lab).toLowerCase() + " lúc " + esc(fmt.when(logAll[0].at))
              : "chưa có dòng nào"}</div>
        </div>
      </div>`;
    }

    /* ---------- 2. quyền bám mã số ---------- */
    function idPanel() {
      const rows = TRAPS.map(t => {
        const a = A.artists.find(x => x.name === t.name);
        const cnt = a ? accounts.filter(x => x.partyKey === a.key).length : 0;
        return `<tr>
          <td><span class="ac-nm">${esc(t.name)}</span></td>
          <td class="mono"><span class="ac-id">${a ? esc(a.clientId) : "—"}</span>
            <span class="sub">${a ? esc(a.key) : "không có trong danh mục"}${
              cnt ? " · " + cnt + " tài khoản" : " · chưa có tài khoản"}</span></td>
          <td class="ac-why">${t.why}</td>
        </tr>`;
      }).join("");
      return `<div class="panel">
        <h3>Quyền bám mã số</h3>
        <div class="hint">Tài khoản không trỏ vào tên nghệ sĩ, nó trỏ vào <b>mã bên nhận</b>
          (<code>A:18</code>, <code>L:3</code>) và mã đó hiện ra ngoài dưới dạng Client ID.
          Tên chỉ để người đọc nhìn. Bốn cái tên dưới đây có thật trong danh mục, mỗi cái hỏng một kiểu
          nếu đem tên đi so thay vì đem mã.</div>
        <div class="tb-wrap"><table class="tb ac-trap">
          <thead><tr><th>Tên hiện ra</th><th>Mã bám vào</th><th>Bám tên thì hỏng ở đâu</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="ac-note">Sai một dấu ở đây không báo lỗi: nó chỉ lặng lẽ trả về rỗng — nghệ sĩ mở lên
          thấy kỳ này không có tiền — hoặc tệ hơn, khớp trúng người khác và trả về dữ liệu của người ta.
          Mã số đổi tên bao nhiêu lần cũng vẫn là mã đó.</div>
      </div>`;
    }

    /* ---------- 3. bảng tài khoản ---------- */
    function accountsPanel() {
      const rows = accounts.map(a => {
        const role = ROLE[a.role] || { lab: a.role, chip: "" };
        const st = STATUS[a.status] || { lab: a.status, chip: "" };
        /* Xoá admin cuối cùng là mất đường vào hẳn — chặn cả khi tài khoản
           đó đang tạm khoá, vì xoá xong không còn ai để mở lại.
           Ngược lại, nút MỞ LẠI thì không bao giờ chặn: nó chỉ trả lại
           quyền, chặn nó mới đúng là khoá cứng cả hệ thống. */
        const lastAdmin = a.role === "admin" && usableAdmins(A, a.id).length === 0;
        const blockSuspend = lastAdmin && a.status === "active";
        let party = `<span class="dim">—</span><span class="sub">không gắn bên nhận · thấy toàn bộ</span>`;
        if (a.partyKey) {
          const id = +a.partyKey.slice(2);
          const who = a.partyKey[0] === "A" ? A.artists[id] : null;
          party = `<b>${esc(A.partyName(a.partyKey))}</b>
            <span class="sub"><span class="ac-id">${esc(A.partyClientId(a.partyKey))}</span> · ${esc(a.partyKey)}${
              who ? " · " + esc(who.labelId >= 0 ? A.labels[who.labelId].name : "độc lập") : ""}</span>`;
        }
        const nextBtn = a.status === "invited"
          ? `<button class="btn sm" data-ac-st="${esc(a.id)}">Kích hoạt</button>`
          : a.status === "active"
            ? `<button class="btn sm" data-ac-st="${esc(a.id)}"${blockSuspend ? " disabled title=\"Admin cuối cùng còn dùng được — mời thêm một admin rồi hãy khoá\"" : ""}>Tạm khoá</button>`
            : `<button class="btn sm" data-ac-st="${esc(a.id)}">Mở lại</button>`;
        return `<tr>
          <td><b>${esc(a.email)}</b><span class="sub">${esc(a.id)}${
            a.lastSeen ? " · vào lần cuối " + esc(fmt.when(a.lastSeen)) : " · chưa vào lần nào"}</span></td>
          <td><span class="chip ${role.chip}">${esc(role.lab)}</span></td>
          <td>${party}</td>
          <td><span class="chip ${st.chip}">${esc(st.lab)}</span></td>
          <td>${a.mfa ? `<span class="chip ok">Bật</span>` : `<span class="chip wait">Chưa</span>`}</td>
          <td class="mono">${esc(fmt.date(a.createdAt))}</td>
          <td><div class="ac-acts">${nextBtn}
            <button class="btn sm dang" data-ac-del="${esc(a.id)}"${lastAdmin ? " disabled title=\"Admin cuối cùng — xoá xong không ai vào được nữa\"" : ""}>Xoá</button>
          </div></td>
        </tr>`;
      }).join("");

      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Tài khoản đã cấp</h3>
            <div class="hint">Ba vai, ba phạm vi khác hẳn nhau. Cột <b>bên nhận</b> mới là thứ quyết định
              người này thấy dòng nào — email chỉ là chỗ nhận thư.</div>
          </div>
          <div class="btnrow"><button class="btn pri" data-ac-add>Mời tài khoản</button></div>
        </div>
        <div class="ac-count">${fmt.num(accounts.length)} tài khoản · ${liveAdmins} admin còn dùng được${
          liveAdmins <= 1 ? " — chỉ còn một, không xoá và không khoá được tài khoản đó" : ""}</div>
        <div class="tb-wrap"><table class="tb">
          <thead><tr>
            <th>Email</th><th>Vai trò</th><th>Bên nhận gắn kèm</th><th>Trạng thái</th>
            <th>Hai lớp</th><th>Ngày tạo</th><th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="ac-note">Tạm khoá cắt đường vào nhưng giữ lại tài khoản; xoá thì mất hẳn, phải mời lại từ đầu.
          Cả hai đều để lại một dòng trong nhật ký kèm giờ và người thao tác.</div>
      </div>`;
    }

    /* ---------- 4. mỗi vai thấy gì ---------- */
    function gatePanel() {
      const rows = GATE.map(g => {
        const role = ROLE[g.role];
        return `<tr>
          <td class="ac-role"><span class="chip ${role.chip}">${esc(role.lab)}</span>
            <span class="sub">${esc(g.where)}</span></td>
          <td>${esc(g.see)}</td>
          <td>${esc(g.edit)}</td>
          <td class="ac-no">${esc(g.hide)}</td>
        </tr>`;
      }).join("");
      return `<div class="panel">
        <h3>Mỗi vai thấy gì</h3>
        <div class="hint">Bảng này để đối chiếu khi có người hỏi “sao tôi không thấy mục kia”.
          Việc cắt dữ liệu làm ở tầng máy chủ chứ không phải ở giao diện: cổng khách nhận về số đã tính sẵn,
          đã cắt sẵn cho đúng một người xem, đúng một kỳ đã duyệt.</div>
        <div class="tb-wrap"><table class="tb ac-gate">
          <thead><tr><th>Vai</th><th>Thấy gì</th><th>Sửa được gì</th><th>KHÔNG thấy gì</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="ac-note">Khách chỉ thấy số của kỳ <b>đã duyệt</b>. Kỳ chưa đối chiếu xong thì không hiện
          con số nào, kể cả số đúng.<br>
          Doanh thu bản ghi và doanh thu tác quyền là hai dòng tiền tách rời — label không thấy tác quyền.</div>
      </div>`;
    }

    /* ---------- 5. nhật ký ---------- */
    function logPanel() {
      const opts = [`<option value="">Tất cả nhóm · ${logAll.length} dòng</option>`]
        .concat(grpList.map(g =>
          `<option value="${esc(g.k)}"${ui.grp === g.k ? " selected" : ""}>${esc(g.lab)} · ${grpCount.get(g.k)}</option>`))
        .join("");
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Nhật ký kiểm toán</h3>
            <div class="hint">Mỗi thao tác đổi trạng thái đều để lại một dòng ở đây: nạp luồng, khớp tay,
              đổi tỷ lệ, duyệt kỳ, tạm ứng, tỷ giá, tài khoản. Khi có tranh chấp, câu hỏi luôn là
              <b>“ai đổi cái này, lúc nào”</b> — và đây là chỗ duy nhất trả lời được.</div>
          </div>
        </div>
        <div class="ac-bar">
          <input type="search" class="search" data-ac-q placeholder="Tìm trong nhật ký…" value="${esc(ui.q)}" aria-label="Tìm trong nhật ký">
          <select data-ac-grp aria-label="Nhóm hành động">${opts}</select>
          <button class="btn sm" data-ac-clear>Bỏ lọc</button>
        </div>
        <div data-ac-log></div>
        <div class="ac-note">Nhật ký ở bản mẫu giữ 400 dòng gần nhất trong trình duyệt.
          Khi làm thật nó phải là bảng chỉ ghi thêm, không sửa, không xoá, và giữ đủ lâu để soi lại một kỳ đã chi tiền.</div>
      </div>`;
    }

    function logRows() {
      const needle = fold(ui.q.trim());
      const list = logAll.filter(r =>
        (!ui.grp || r.grp === ui.grp) && (!needle || r.f.indexOf(needle) >= 0));
      const head = `<div class="ac-count">Đang hiện ${fmt.num(list.length)}/${fmt.num(logAll.length)} dòng${
        ui.grp ? " · nhóm " + esc(groupOf(ui.grp).lab) : ""}${ui.q ? " · lọc “" + esc(ui.q) + "”" : ""}</div>`;
      if (!list.length) return head + `<div class="empty">Không có dòng nhật ký nào khớp bộ lọc.</div>`;
      return head + `<div class="tb-wrap"><table class="tb ac-log">
        <thead><tr><th>Lúc nào</th><th>Ai</th><th>Hành động</th><th>Chi tiết</th></tr></thead>
        <tbody>${list.map(r => {
          const g = groupOf(r.grp);
          return `<tr>
            <td class="ac-when">${esc(fmt.when(r.at))}</td>
            <td class="mono" style="font-size:11px">${esc(r.by)}</td>
            <td class="ac-act"><span class="chip ${g.chip}">${esc(g.lab)}</span>
              <span class="ac-raw">${esc(r.action)}</span></td>
            <td>${esc(r.detail)}</td>
          </tr>`;
        }).join("")}</tbody></table></div>`;
    }

    /* ---------- dựng ---------- */
    root.innerHTML = `<style>${CSS}</style>`
      + kpis() + idPanel() + accountsPanel() + gatePanel() + logPanel();

    /* ---------- gắn sự kiện ---------- */
    /* Ba hộp thoại đều là hàm async: lỗi ném ra sau lần await đầu tiên
       không rơi vào try/catch quanh lời gọi nữa, nên bắt ở nhánh promise —
       không thì hộp thoại tắt ngóm mà không ai thấy lý do. */
    const guard = p => p.catch(e => ctx.toast((e && e.message) || "Không làm được, xem console", "no"));

    root.querySelector("[data-ac-add]").addEventListener("click", () => guard(askInvite(ctx)));
    root.querySelectorAll("[data-ac-st]").forEach(b => {
      b.addEventListener("click", () => {
        /* Đọc lại từ lõi thay vì dùng dòng đã vẽ: bảng có thể đã cũ hơn
           trạng thái sau một thao tác khác. */
        const a = A.accounts.list().find(x => x.id === b.dataset.acSt);
        if (!a) return ctx.toast("Tài khoản này không còn nữa", "no");
        guard(askStatus(ctx, a));
      });
    });
    root.querySelectorAll("[data-ac-del]").forEach(b => {
      b.addEventListener("click", () => {
        const a = A.accounts.list().find(x => x.id === b.dataset.acDel);
        if (!a) return ctx.toast("Tài khoản này không còn nữa", "no");
        guard(askRemove(ctx, a));
      });
    });

    /* Lọc nhật ký chỉ vẽ lại phần bảng — vẽ lại cả màn hình là mất ô đang gõ dở. */
    const logHost = root.querySelector("[data-ac-log]");
    const qEl = root.querySelector("[data-ac-q]");
    const grpEl = root.querySelector("[data-ac-grp]");
    const paintLog = () => { logHost.innerHTML = logRows(); };
    qEl.addEventListener("input", () => { ui.q = qEl.value; paintLog(); });
    grpEl.addEventListener("change", () => { ui.grp = grpEl.value; paintLog(); });
    root.querySelector("[data-ac-clear]").addEventListener("click", () => {
      ui.q = ""; ui.grp = ""; qEl.value = ""; grpEl.value = ""; paintLog(); qEl.focus();
    });
    paintLog();
  }
});

})();
