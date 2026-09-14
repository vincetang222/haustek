/* =====================================================================
   HẠ TẦNG · MÃ ĐỊNH DANH KHÔNG TRÙNG
   ---------------------------------------------------------------------
   Trước vòng 22 bộ đếm mã là biến module: nạp lại trang là về 0, và
   HSTK-2609-001, U0018, BT-202607-002 đã từng trùng. Giờ mọi mã đi qua
   sinhMa() với bộ đếm trong state.maDem. Bài này chứng minh:
     1. Mã hiện có trong mọi bảng đều không trùng.
     2. Tạo liên tiếp nhiều bản ghi → mã khác nhau, đúng mẫu.
     3. Kiểm thử hồ sơ (preview) KHÔNG ăn bộ đếm.
     4. Nạp lại lõi từ localStorage (mô phỏng tải lại trang) rồi tạo tiếp
        → mã mới không trùng mã đã có.

       node portal/test/ma-dinh-danh.js
   ===================================================================== */
"use strict";
const KHO = {};
global.window = global;
global.localStorage = {
  getItem: k => (k in KHO ? KHO[k] : null),
  setItem: (k, v) => { KHO[k] = String(v); },
  removeItem: k => { delete KHO[k]; }
};
const CORE = require.resolve("../haustek-core.js");
function napLoi() { delete require.cache[CORE]; delete global.HAUSTEK; require(CORE); return global.HAUSTEK; }
let H = napLoi(), A = H.admin;

let pass = 0, fail = 0; const ra = [];
function check(ten, fn) {
  try { const m = fn(); ra.push(["ok", ten, m || ""]); pass++; }
  catch (e) { ra.push(["LỖI", ten, e.message]); fail++; }
}
function must(ok, msg) { if (!ok) throw new Error(msg); }
const stateCua = () => JSON.parse(H.storage.exportJSON());

const BANG = [
  ["releases", /^HSTK-\d{4}-\d{3,}$/], ["tickets", /^HT-\d{4}-\d{3,}$/], ["withdrawals", /^RT-\d{4}-\d{3,}$/],
  ["proposals", /^DX-\d{4}-\d{3,}$/], ["adjustments", /^BT-\d{6}-\d{3,}$/], ["accounts", /^U\d{4,}$/],
  ["claims", /^CL-\d{4,}$/], ["campaigns", /^CD-\d{5}-[A-Z]{2}-\d{2,}$/], ["queue", /^Q\d{5,}$/], ["nhapTay", /^N-\d{4,}/]
];
check("Mã hiện có trong mọi bảng: không trùng, đúng mẫu", () => {
  const s = stateCua(); const dem = [];
  BANG.forEach(([bang, re]) => {
    const ids = (s[bang] || []).map(r => r.id);
    const tap = new Set(ids);
    must(tap.size === ids.length, bang + " có mã trùng: " + ids.filter((x, i) => ids.indexOf(x) !== i).slice(0, 5).join(", "));
    const sai = ids.filter(x => !re.test(x));
    must(!sai.length, bang + " có mã sai mẫu: " + sai.slice(0, 5).join(", "));
    dem.push(bang + " " + ids.length);
  });
  const nv = A.staff.list().map(x => x.id);
  must(new Set(nv).size === nv.length, "nhân sự trùng mã");
  return dem.join(" · ");
});

const PK = () => A.parties.list().rows[0].partyKey;
check("Tạo 5 việc hỗ trợ liên tiếp: 5 mã khác nhau, cùng tháng, số tăng dần", () => {
  const ids = [];
  for (let i = 0; i < 5; i++) ids.push(A.tickets.create({ type: "khac", title: "Kiểm mã " + i, partyKey: PK() }, "S05").id);
  must(new Set(ids).size === 5, "trùng: " + ids.join(","));
  const so = ids.map(x => +x.slice(-3));
  must(so.every((n, i) => i === 0 || n === so[i - 1] + 1), "không tăng dần: " + ids.join(","));
  const tatCa = stateCua().tickets.map(t => t.id);
  must(new Set(tatCa).size === tatCa.length, "trùng với mã cũ");
  return ids[0] + " → " + ids[4];
});
check("Tạo 3 tài khoản: U#### không trùng và không tái dùng số cũ", () => {
  const truoc = stateCua().accounts.map(a => a.id);
  const max = Math.max(...truoc.map(x => +x.slice(1)));
  for (let i = 0; i < 3; i++) A.accounts.add("kiem-ma-" + i + "@vi-du.vn", "artist", "A:1");
  const sau = stateCua().accounts.map(a => a.id);
  must(new Set(sau).size === sau.length, "trùng mã tài khoản");
  const moi = sau.filter(x => !truoc.includes(x));
  must(moi.every(x => +x.slice(1) > max), "tái dùng số cũ: " + moi.join(","));
  return moi.join(" ");
});
check("Xoá tài khoản rồi tạo lại: không lấy lại mã đã xoá", () => {
  const s = stateCua(); const cuoi = s.accounts[s.accounts.length - 1].id;
  A.accounts.remove(cuoi);
  A.accounts.add("kiem-ma-x@vi-du.vn", "artist", "A:1");
  const ids = stateCua().accounts.map(a => a.id);
  must(!ids.includes(cuoi), "mã " + cuoi + " bị tái dùng");
  must(new Set(ids).size === ids.length, "trùng");
});
check("Kiểm thử hồ sơ phát hành (preview) không ăn bộ đếm", () => {
  const truoc = JSON.stringify(stateCua().maDem);
  const pk = A.parties.list().rows.find(r => r.partyKey[0] === "A").partyKey;
  const r = A.releases.check(pk, { title: "Xem trước", type: "single", tracks: [{ title: "Bài 1" }] });
  must(r && typeof r.ok === "boolean", "check không trả kết quả");
  must(JSON.stringify(stateCua().maDem) === truoc, "maDem đổi sau preview");
  must(!stateCua().releases.some(x => x.id === "HSTK-XEM-TRUOC"), "preview lọt vào releases");
});
check("Bút toán theo tháng: BT-YYYYMM-nnn, hai tháng khác nhau đếm riêng", () => {
  const ky = A.periods.filter(p => !A.isApproved(p.k));
  must(ky.length >= 2, "cần ít nhất hai kỳ đang mở");
  const k1 = ky[0].k, k2 = ky[1].k;
  const a = A.ledger.addAdjustment({ periodKey: k1, kind: "dieu-chinh", amount: 1, note: "kiểm mã" }, "S07");
  const b = A.ledger.addAdjustment({ periodKey: k2, kind: "dieu-chinh", amount: 1, note: "kiểm mã" }, "S07");
  must(a.id.startsWith("BT-" + k1.replace("-", "")), "sai tháng: " + a.id);
  must(b.id.startsWith("BT-" + k2.replace("-", "")), "sai tháng: " + b.id);
  const ids = stateCua().adjustments.map(x => x.id);
  must(new Set(ids).size === ids.length, "trùng bút toán");
  return a.id + " · " + b.id;
});
check("Nạp lại lõi từ localStorage (tải lại trang): bộ đếm giữ nguyên, mã mới không trùng", () => {
  const truoc = stateCua();
  const idsCu = truoc.tickets.map(t => t.id);
  const demCu = JSON.stringify(truoc.maDem);
  H = napLoi(); A = H.admin;
  const sau = stateCua();
  must(JSON.stringify(sau.maDem) === demCu, "maDem đổi sau khi nạp lại");
  must(sau.tickets.length === truoc.tickets.length, "mất ticket sau nạp lại");
  const t = A.tickets.create({ type: "khac", title: "Sau nạp lại", partyKey: PK() }, "S05");
  must(!idsCu.includes(t.id), "mã mới trùng mã cũ: " + t.id);
  const ids = stateCua().tickets.map(x => x.id);
  must(new Set(ids).size === ids.length, "trùng");
  return t.id;
});
check("Nạp state KHÔNG có maDem (lược đồ 1): khoiTaoMaDem đọc lại từ dữ liệu, mã mới vẫn không trùng", () => {
  const s = stateCua(); delete s.maDem; delete s.luocDoVer;
  KHO[H.storage.thongTin().khoa] = JSON.stringify(s);
  H = napLoi(); A = H.admin;
  const idsCu = s.tickets.map(t => t.id);
  const t = A.tickets.create({ type: "khac", title: "Sau di trú", partyKey: PK() }, "S05");
  must(!idsCu.includes(t.id), "mã mới trùng: " + t.id);
  A.accounts.add("kiem-ma-y@vi-du.vn", "artist", "A:1");
  const acc = stateCua().accounts.map(a => a.id);
  must(new Set(acc).size === acc.length, "tài khoản trùng sau di trú");
  return t.id;
});

ra.forEach(([k, ten, m]) => console.log("  " + (k === "ok" ? "ok  " : "LỖI ") + " " + ten + (m ? "\n         " + m : "")));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
