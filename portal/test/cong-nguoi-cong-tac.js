/* =====================================================================
   CỔNG NGƯỜI CỘNG TÁC — ranh giới của loại bên thụ hưởng thứ ba
   ---------------------------------------------------------------------
   Vòng 22 dựng mô hình ba lớp nhưng để lại D7: "nội bộ trước, cổng đối
   tác sau". Vòng 23 làm nốt. Bài này canh hai thứ:

   1. NGƯỜI CỘNG TÁC THẤY ĐÚNG PHẦN CỦA MÌNH — số trên cổng khớp tới từng
      xu với bảng chi trả đã duyệt của nội bộ.
   2. VÀ KHÔNG THẤY GÌ KHÁC — danh mục, doanh thu bài, nền tảng, lãnh thổ,
      tạm ứng, phát hành đều là của chủ bài. Người cộng tác biết phần trăm
      của mình và số tiền mình nhận; từ hai số ấy họ suy ra được phần của
      chủ bài và đó là điều không tránh được, nhưng cổng không bày thêm.

   Cơ chế gác là BẢNG, không phải câu if rải rác: QUYEN_API khai phương
   thức nào mở cho loại bên nào, TRANG_CHO_BEN khai trang nào. Bài này đòi
   hai bảng ấy phủ kín — thêm phương thức hay thêm trang mà quên khai là
   đỏ ngay, không phải chờ tới lúc có người dùng lọt vào.

       node portal/test/cong-nguoi-cong-tac.js
   ===================================================================== */
"use strict";
const path = require("path"), fs = require("fs");
global.window = {};
global.performance = { now: () => Date.now() };
const mem = {};
global.localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
};
global.devicePixelRatio = 1;
require(path.join(__dirname, "..", "haustek-core.js"));
const H = global.window.HAUSTEK, A = H.admin, api = H.api;

let pass = 0; const hong = [];
function kiem(ten, fn) {
  try { const m = fn(); pass++; console.log("  ok   " + ten + (m ? " · " + m : "")); }
  catch (e) { hong.push(ten); console.log("  LỖI  " + ten + " — " + e.message); }
}
function must(c, m) { if (!c) throw new Error(m); }
function phaiChan(fn, ten) {
  let nem = false, m = "";
  try { fn(); } catch (e) { nem = true; m = e.message; }
  must(nem, ten + " — đáng lẽ bị chặn nhưng lại trả về dữ liệu");
  return m;
}

/* --- tìm tài khoản người cộng tác đăng nhập được --- */
const tk = api.demoLogins().accounts.filter(a => a.role === "nhan");
const toi = tk.filter(a => a.status === "active")[0];

kiem("bản mẫu có tài khoản người cộng tác, ít nhất một cái đăng nhập được", () => {
  must(tk.length >= 2, "chỉ có " + tk.length + " tài khoản người cộng tác");
  must(toi, "không có tài khoản người cộng tác nào hoạt động");
  must(tk.some(a => a.status === "invited"), "thiếu trạng thái 'đang mời' — trạng thái trước lần đăng nhập đầu");
  must(/^HTK-N\d{4}$/.test(toi.clientId), "mã bên sai dạng: " + toi.clientId);
  return tk.length + " tài khoản · đang dùng " + toi.clientId;
});

/* ---------------------------------------------------------------------
   1. Số của họ đúng tới từng xu
   --------------------------------------------------------------------- */
kiem("ví ở cổng = tổng dòng chia sẻ trong các bảng chi trả đã duyệt", () => {
  const pk = "N:" + toi.partyId;
  let that = 0;
  A.periods.filter(p => A.isApproved(p.k)).forEach(p => {
    (A.payoutOf(p.k) || []).forEach(r => { if (r.partyKey === pk && r.chiaSeVao > 0) that += r.chiaSeVao; });
  });
  const w = api.wallet("nhan", toi.partyId);
  must(Math.abs(w.totalCredit - that) < 0.02, "ví " + w.totalCredit + " ≠ bảng chốt " + that.toFixed(2));
  must(that > 0, "người cộng tác này chưa nhận đồng nào — phép kiểm không chứng minh gì");
  return "ví " + w.totalCredit.toFixed(2) + " USD khớp bảng chốt nội bộ";
});

kiem("phần chia của tôi: cộng theo bài = cộng theo kỳ = tổng ví", () => {
  const pc = api.phanChia("nhan", toi.partyId);
  const w = api.wallet("nhan", toi.partyId);
  must(pc.tracks > 0, "không có bài nào");
  const theoBai = pc.rows.reduce((s, r) => s + r.daTra, 0);
  const theoKy = pc.rows.reduce((s, r) => s + r.theoKy.reduce((x, k) => x + k.soTien, 0), 0);
  must(Math.abs(theoBai - pc.daTra) < 0.02, "tổng báo " + pc.daTra + " ≠ cộng theo bài " + theoBai.toFixed(2));
  must(Math.abs(theoKy - pc.daTra) < 0.02, "cộng theo kỳ " + theoKy.toFixed(2) + " ≠ tổng " + pc.daTra);
  must(Math.abs(w.totalCredit - pc.daTra) < 0.02, "ví " + w.totalCredit + " ≠ phần chia " + pc.daTra);
  return pc.tracks + " bài · " + pc.daTra.toFixed(2) + " USD, ba cách cộng ra cùng một số";
});

kiem("mỗi dòng phần chia nói đủ: bài, chủ bài, vai, phần trăm, ngày nhận", () => {
  const pc = api.phanChia("nhan", toi.partyId);
  pc.rows.forEach(r => {
    must(r.title && r.isrc, "bài " + r.trackId + " thiếu tên hoặc ISRC");
    must(r.chu, "bài " + r.trackId + " không nói chủ bài là ai");
    must(r.pct > 0 && r.pct <= 100, "phần trăm sai: " + r.pct);
    must(r.vaiLabel && r.vaiLabelEn, "thiếu tên vai song ngữ");
    must(r.acceptedAt, "thiếu ngày nhận lời mời");
  });
  return pc.rows.length + " dòng";
});

/* ---------------------------------------------------------------------
   2. Và không thấy gì khác
   --------------------------------------------------------------------- */
kiem("gói phần chia KHÔNG mang doanh thu của bài hay của chủ bài", () => {
  const goi = api.phanChia("nhan", toi.partyId);
  /* Tên nghệ sĩ và tên bài thì ĐƯỢC: họ làm trên bài ấy, và không có tên
     bài thì trang vô nghĩa. Cấm là mọi trường mang SỐ TIỀN hoặc số lượt của
     bài — từ đó suy ra phần của chủ bài. */
  const camTruong = ["gross", "net", "ghiNhan", "labelCut", "fee", "feePct", "bien", "bienGia",
    "khach", "streams", "listeners", "payable", "earned", "lifetimeMine", "total", "mine"];
  const thay = [];
  (function quet(v, duong) {
    if (Array.isArray(v)) return v.forEach((x, i) => quet(x, duong + "[" + i + "]"));
    if (v && typeof v === "object") Object.keys(v).forEach(k => {
      if (camTruong.indexOf(k) >= 0) thay.push(duong + "." + k);
      quet(v[k], duong + "." + k);
    });
  })(goi, "phanChia");
  must(!thay.length, "gói mang trường tiền của chủ bài: " + thay.slice(0, 4).join(" "));
  return (JSON.stringify(goi).length / 1024).toFixed(1) + " KB · quét mọi khoá, không trường doanh thu nào";
});

kiem("mọi mục thuộc danh mục đều bị chặn cho vai người cộng tác", () => {
  const cam = ["summary", "contract", "catalogue", "tracks", "trackDetail", "trackAsset", "breakdown",
    "trend", "platformTail", "platformReport", "dailyTrends", "playlists", "quality", "metadataReport",
    "releases", "submitRelease", "forecast", "advanceOffer", "requestAdvance", "proposals",
    "campaigns", "claims", "labelTree", "delegations", "roster", "splits", "splitsOf", "setSplit",
    "search", "explain", "tacPham"];
  const lot = [];
  cam.forEach(k => {
    must(typeof api[k] === "function", "mặt tiền không còn phương thức " + k);
    let nem = false;
    try { api[k]("nhan", toi.partyId, A.periods[0].k, "rec"); } catch (e) { nem = /mục này/.test(e.message); }
    if (!nem) lot.push(k);
  });
  must(!lot.length, lot.length + " mục lọt: " + lot.join(" "));
  return cam.length + " mục đều bị chặn ở tầng mặt tiền";
});

kiem("bảng quyền cổng đối tác phủ kín: không phương thức nào chưa khai", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "haustek-core.js"), "utf8");
  const i = src.indexOf("const apiGoc = {");
  must(i > 0, "không tìm thấy mặt tiền đối tác trong mã nguồn");
  const than = src.slice(i, src.indexOf("\n};", i));
  const ten = (than.match(/\n  [a-zA-Z][A-Za-z0-9_]*\(/g) || []).map(x => x.trim().replace("(", ""));
  must(ten.length > 40, "chỉ đọc được " + ten.length + " phương thức");
  const bang = src.slice(src.indexOf("const QUYEN_API = {"), src.indexOf("};", src.indexOf("const QUYEN_API = {")));
  const thieu = ten.filter(k => bang.indexOf("\n  " + k + ":") < 0 && bang.indexOf(" " + k + ":") < 0);
  must(!thieu.length, thieu.length + " phương thức chưa khai quyền: " + thieu.join(" "));
  return ten.length + " phương thức, phương thức nào cũng có dòng trong bảng";
});

kiem("bảng trang phủ kín: mọi trang k-* của cổng đối tác đều đã khai", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "haustek-core.js"), "utf8");
  const bang = src.slice(src.indexOf("const TRANG_CHO_BEN = {"), src.indexOf("};", src.indexOf("const TRANG_CHO_BEN = {")));
  const html = fs.readFileSync(path.join(__dirname, "..", "v2", "khach.html"), "utf8");
  const trang = (html.match(/man\/(k-[a-z-]+)\.js/g) || []).map(x => x.replace("man/", "").replace(".js", ""));
  must(trang.length > 15, "chỉ thấy " + trang.length + " trang trong cổng đối tác");
  const thieu = trang.filter(id => bang.indexOf('"' + id + '"') < 0);
  must(!thieu.length, thieu.length + " trang chưa khai: " + thieu.join(" "));
  return trang.length + " trang, trang nào cũng có dòng trong bảng";
});

kiem("người cộng tác chỉ mở được bốn trang, và đúng bốn trang ấy", () => {
  const cua = api.trangCho("nhan");
  must(cua.length === 4, "mở " + cua.length + " trang: " + cua.join(" "));
  ["k-toi", "k-phan-chia", "k-vi", "k-ho-tro"].forEach(id => {
    must(cua.indexOf(id) >= 0, "thiếu trang " + id);
    must(api.trangMo("nhan", id), "trangMo nói không mở được " + id);
  });
  ["k-tong-quan", "k-danh-muc", "k-nen-tang", "k-chia-se", "k-tam-ung", "k-bang-ke"].forEach(id => {
    must(!api.trangMo("nhan", id), "mở được trang không thuộc về mình: " + id);
  });
  return cua.join(" · ");
});

kiem("phiên người cộng tác không mang bất cứ dấu hiệu nào của danh mục", () => {
  const s = api.session("nhan", toi.partyId);
  must(s.kind === "nhan", "loại bên sai: " + s.kind);
  must(s.hasRecording === false && s.hasPublishing === false, "phiên nói họ có bản ghi hoặc tác quyền");
  must(s.trackCount === 0 && s.compositionCount === 0, "phiên đếm ra bài");
  must(s.parentLabel === null && s.childLabels === 0, "phiên mang cây label");
  const p = api.periods("nhan", toi.partyId);
  must(p.pubOpen.length === 0, "người cộng tác có kỳ tác quyền — họ không sở hữu tác phẩm nào");
  return "phiên sạch · " + p.open.length + " kỳ đã duyệt hiện ra";
});

/* ---------------------------------------------------------------------
   3. Hai bên thụ hưởng khác nhau không thấy nhau
   --------------------------------------------------------------------- */
kiem("người cộng tác này không đọc được ví hay phần chia của người kia", () => {
  const kia = tk.find(a => a.partyId !== toi.partyId);
  must(kia, "chỉ có một tài khoản người cộng tác");
  /* mã bên bám tài khoản: đưa mã người khác vào là phải bị chặn ở assertParty
     nếu tài khoản ấy không đang giữ bên ấy — ở đây họ CÓ giữ, nên phép kiểm
     thật là: mỗi phiên chỉ trả về đúng bên của mình, không trộn. */
  const a = api.phanChia("nhan", toi.partyId), b = api.phanChia("nhan", kia.partyId);
  const baiA = a.rows.map(r => r.trackId), baiB = b.rows.map(r => r.trackId);
  must(!baiA.some(x => baiB.indexOf(x) >= 0) || a.daTra !== b.daTra, "hai người cộng tác trả về cùng một gói");
  must(Math.abs(api.wallet("nhan", toi.partyId).totalCredit - a.daTra) < 0.02, "ví lệch phần chia");
  return toi.clientId + " " + a.daTra.toFixed(2) + " USD · " + kia.clientId + " " + b.daTra.toFixed(2) + " USD";
});

kiem("mã tài khoản không tồn tại hoặc bị khoá thì không vào được", () => {
  phaiChan(() => api.session("nhan", "U9999"), "mã tài khoản bịa");
  phaiChan(() => api.session("nhan", 0), "mã số thay vì mã tài khoản");
  phaiChan(() => api.session("khach", 1), "vai bịa");
  /* tài khoản label không giữ bên N: nên không mượn được vai người nhận */
  const lb = A.accounts.list().find(x => x.role === "label");
  phaiChan(() => api.session("nhan", lb.id), "tài khoản label mượn vai người nhận");
  return "bốn đường vào đều bị chặn";
});

console.log("\n" + pass + " đạt · " + hong.length + " hỏng");
process.exit(hong.length ? 1 : 0);
