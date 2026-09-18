/* ------------------------------------------------------------------
   TẠM ỨNG KHÔNG CÓ PHÍ · vòng 35

   Chủ sản phẩm chốt: "không nên có phí · việc có tiền lời là việc của
   mình · tôi không hề thu phí của khách." Portal ứng bao nhiêu thu hồi
   đúng bấy nhiêu; lợi nhuận đến từ phí dịch vụ theo hợp đồng, cắt trên
   doanh thu gộp, không từ một khoản thu của đối tác.

   Bài kiểm này khoá ba thứ:
     · khái niệm phí ứng không được quay lại bằng bất kỳ cửa nào
     · cửa cảnh báo đo bằng SỐ THÁNG thu hồi, không đo bằng ROI
     · chip cảnh báo và danh sách lý do không được nói ngược nhau

   Vì sao không đo bằng ROI: bỏ phí thì roi = retained/amount, mà
   retained = (amount/monthlyNet) × monthlyGross × margin, nên amount
   TRIỆT TIÊU. Đo trên L:38 trước khi viết bài này: ứng 0,25× / 0,5× /
   0,8× / 1,0× / 1,25× trần đều ra roi 0,489. Một ngưỡng đặt trên con số
   không nhúc nhích theo biến người duyệt gõ thì không phải một cửa.
   ------------------------------------------------------------------ */
const fs = require("fs"), path = require("path");
const GOC = path.join(__dirname, "..");
global.window = {};
let _kho = {};
global.localStorage = {
  getItem: k => (k in _kho ? _kho[k] : null),
  setItem: (k, v) => { _kho[k] = String(v); },
  removeItem: k => { delete _kho[k]; },
  clear: () => { _kho = {}; }
};
require(path.join(GOC, "haustek-core.js"));
const H = global.window.HAUSTEK, A = H.admin;

let pass = 0, fail = 0; const kq = [];
function check(ten, fn) {
  try { const m = fn(); pass++; kq.push(["ok", ten, m || ""]); }
  catch (e) { fail++; kq.push(["LỖI", ten, e.message]); }
}
function must(c, m) { if (!c) throw new Error(m); }

/* Danh sách mọi cách gọi tên khoản phí ứng, ở cả hai thứ tiếng. */
const CAM = /ADVANCE_FEE|phí ứng|phí tạm ứng|advance fee|advance charge/i;

/* MỘT dòng được miễn, khai bằng chuỗi chứ không bằng regex rộng: mẫu dịch
   cũ trong ghiChuEn. Các bản ghi sổ tạm ứng đã có trong state mang
   "+ phí 12%" mãi mãi; xoá mẫu là làm trang Tạm ứng in tiếng Việt khi
   bật EN cho đúng những dòng lịch sử ấy. */
const MIEN = ['m = /^(.+?) tạm ứng (.+?) \\+ phí (.+)$/.exec(vi); if (m) return m[1] + " advance " + m[2] + " + fee " + m[3];'];

/* BỎ CHÚ THÍCH TRƯỚC KHI QUÉT. Một chú thích nói "không có phí ứng" là
   đúng thứ cần giữ, không phải thứ cần bắt; chỉ chuỗi và tên biến mới ra
   được tới màn hình. Thay chú thích bằng khoảng trắng để số dòng không
   xê dịch, nên chỗ báo lỗi vẫn trỏ đúng dòng trong tệp thật. */
function boChuThich(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "))
          .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + m.slice(p1.length).replace(/./g, " "));
}
function quet(tep) {
  const s = boChuThich(fs.readFileSync(tep, "utf8"));
  return s.split("\n").map((d, i) => [i + 1, d])
    .filter(([, d]) => CAM.test(d))
    .filter(([, d]) => !MIEN.some(x => d.indexOf(x) >= 0));
}

check("Khái niệm phí ứng không còn ở bất kỳ tệp nào chạy ra màn hình", () => {
  const tep = [path.join(GOC, "haustek-core.js"), path.join(GOC, "v2", "haustek-them.js"), path.join(GOC, "goi-mot-trang.html")]
    .concat(fs.readdirSync(path.join(GOC, "v2", "man")).filter(f => f.endsWith(".js")).map(f => path.join(GOC, "v2", "man", f)))
    .filter(f => fs.existsSync(f));
  const bad = [];
  tep.forEach(f => quet(f).forEach(([n, d]) => bad.push(path.relative(GOC, f) + ":" + n + " · " + d.trim().slice(0, 70))));
  must(bad.length === 0, bad.length + " chỗ còn phí ứng:\n         " + bad.slice(0, 6).join("\n         "));
  return tep.length + " tệp quét, sạch · 1 dòng miễn trừ có khai";
});

check("proposeAdvance bỏ qua feePct người gọi truyền vào, sổ mở đúng số đã ứng", () => {
  const pk = A.parties.list({ limit: 50 }).rows.find(r => A.advanceCalc(r.partyKey, 0).maxAdvance >= 1000).partyKey;
  const pr = A.proposals.proposeAdvance(pk, { amount: 1000, feePct: 0.3, note: "kiểm" }, "kiểm", "sales");
  must(pr.terms.feePct === undefined, "terms còn giữ feePct người gọi truyền vào");
  must(pr.calc.amount === 1000 && pr.calc.repayment === undefined, "bản tính còn khoản phải thu hồi tách khỏi khoản ứng");
  const truoc = (A.advances.get ? 0 : 0);
  A.proposals.review(pr.id, "approve", "", "Giám đốc", "mgmt");
  const so = A.advances.list().find(x => x.partyKey === pk);
  must(so, "không tìm thấy sổ tạm ứng sau khi duyệt");
  return "ứng 1000 với feePct 0,3 truyền vào · terms sạch · sổ mở " + so.opening + " (trước đó " + truoc + ")";
});

check("Gói gửi cổng đối tác không mang phí, không mang khoản phải thu hồi", () => {
  const nghe = A.parties.list({ limit: 200 }).rows.find(r => String(r.partyKey)[0] === "A");
  const id = +String(nghe.partyKey).slice(2);
  const goi = [H.api.advanceOffer("artist", id), H.api.proposals("artist", id)];
  goi.forEach(g => {
    const s = JSON.stringify(g);
    must(s.indexOf('"feePct"') < 0, "gói đối tác còn khoá feePct");
    must(s.indexOf('"repayment"') < 0, "gói đối tác còn khoá repayment");
    must(!CAM.test(s), "gói đối tác còn chữ nói về phí ứng");
  });
  return "advanceOffer và proposals · hai gói sạch";
});

check("Cửa cảnh báo đi theo SỐ THÁNG: im khi ứng trong mức đã cấp, kêu khi vượt", () => {
  const rows = A.parties.list({ limit: 5000 }).rows;
  function dem(boi) {
    const d = { ok: 0, canh: 0, cao: 0 };
    rows.forEach(r => {
      const probe = A.advanceCalc(r.partyKey, 0);
      if (!(probe.maxAdvance >= 100)) return;
      const c = A.advanceCalc(r.partyKey, Math.round(probe.maxAdvance * boi));
      d[c.ruiRo.muc] = (d[c.ruiRo.muc] || 0) + 1;
    });
    return d;
  }
  const a = dem(0.8), b = dem(1.25), c = dem(2.0);
  must(a.ok >= 420, "ở 0,8× trần chỉ có " + a.ok + " bên trong ngưỡng, phải từ 420");
  must(b.ok === 0, "ở 1,25× trần vẫn còn " + b.ok + " bên trong ngưỡng");
  must(c.cao >= 300, "ở 2,0× trần chỉ có " + c.cao + " bên rủi ro cao, phải từ 300");
  return "0,8× → " + a.ok + " ok · 1,25× → " + b.canh + " cần cân nhắc · 2,0× → " + c.cao + " rủi ro cao";
});

check("Chip cảnh báo và danh sách lý do không nói ngược nhau", () => {
  /* Trước khi mốc 12 cứng nhường cho ADVANCE_THANG, phép này đỏ 140 bên ở
     0,8× trần và 79 bên ở 1,0× trần: chip ghi "Trong ngưỡng" còn lý do
     ngay dưới nó ghi "quá 12 tháng". */
  const rows = A.parties.list({ limit: 5000 }).rows;
  const xau = [];
  [0.8, 1.0].forEach(boi => rows.forEach(r => {
    const probe = A.advanceCalc(r.partyKey, 0);
    if (!(probe.maxAdvance >= 100)) return;
    const c = A.advanceCalc(r.partyKey, Math.round(probe.maxAdvance * boi));
    if (c.ruiRo.muc === "ok" && c.reasons.some(x => /quá \d+ tháng/.test(x.vi))) xau.push(r.partyKey + " @" + boi);
  }));
  must(xau.length === 0, xau.length + " bên vừa 'Trong ngưỡng' vừa in lý do quá hạn: " + xau.slice(0, 4).join(", "));
  return "428 bên × 2 mức, không bên nào mâu thuẫn";
});

check("Thang ROI của bảng tính hợp đồng KHÔNG bị đụng tới", () => {
  /* ROI_RUI_RO phục vụ dealRoiCalc ở trang Tính ROI, là một thang khác
     hẳn. Bỏ phí tạm ứng không được phép kéo theo nó. */
  const m = A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 3000, artistShare: 0.74, termMonths: 60, exclusivityMonths: 36 });
  must(m.ruiRo.roiSan === 0.2 && m.ruiRo.thangTot === 12 && m.ruiRo.thangToiDa === 28, "ngưỡng của thang hợp đồng bị đổi");
  return "roiSan 0,20 · thangTot 12 · thangToiDa 28, nguyên vẹn";
});

kq.forEach(([t, n, m]) => { console.log("  " + (t === "ok" ? "ok  " : "LỖI") + "  " + n); if (m) console.log("         " + m); });
console.log("\n" + pass + " đạt · " + fail + " hỏng");
if (fail) process.exit(1);
