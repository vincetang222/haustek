/* =====================================================================
   HẠ TẦNG · LƯỢC ĐỒ STATE VÀ DI TRÚ
   ---------------------------------------------------------------------
   Vòng 22 tách phiên bản ứng dụng (CFG.VERSION) khỏi phiên bản lược đồ
   (CFG.LUOC_DO_VER). Ba điều phải đúng mãi:
     1. Mọi khoá của state đều khai trong LUOC_DO, và LUOC_DO không khai
        khoá nào state không có — thêm khoá mà quên khai là hỏng ở đây.
     2. State cũ (lược đồ 1, còn messages[] trong ticket, còn deliveries)
        nạp lên là được nâng, không bị bỏ; chạy di trú hai lần cho cùng
        kết quả.
     3. File thuộc lược đồ mới hơn bị từ chối khi nhập, file thiếu feeds
        cũng thế.

       node portal/test/luoc-do.js
   ===================================================================== */
"use strict";
const KHO = {};
global.window = global;
global.localStorage = {
  getItem: k => (k in KHO ? KHO[k] : null),
  setItem: (k, v) => { KHO[k] = String(v); },
  removeItem: k => { delete KHO[k]; }
};
require("../haustek-core.js");
const H = window.HAUSTEK, A = H.admin;

let pass = 0, fail = 0; const ra = [];
function check(ten, fn) {
  try { const m = fn(); ra.push(["ok", ten, m || ""]); pass++; }
  catch (e) { ra.push(["LỖI", ten, e.message]); fail++; }
}
function must(ok, msg) { if (!ok) throw new Error(msg); }

const tt = H.storage.thongTin();
const luocDo = H.storage.luocDo();
const stateXuat = JSON.parse(H.storage.exportJSON());

check("Mọi khoá state đều được khai trong LUOC_DO", () => {
  const thieu = Object.keys(stateXuat).filter(k => !luocDo[k]);
  must(!thieu.length, "state có khoá chưa khai: " + thieu.join(", "));
  return Object.keys(stateXuat).length + " khoá";
});
check("LUOC_DO không khai khoá nào state không có", () => {
  const thua = Object.keys(luocDo).filter(k => !(k in stateXuat));
  must(!thua.length, "khai thừa: " + thua.join(", "));
  return Object.keys(luocDo).length + " mục";
});
check("Mỗi mục có kieu ∈ {mang,bang,gia}, nhom ∈ {nghiep-vu,van-hanh,he-thong}, mo không rỗng", () => {
  Object.keys(luocDo).forEach(k => {
    const d = luocDo[k];
    must(["mang", "bang", "gia"].includes(d.kieu), k + ": kieu lạ " + d.kieu);
    must(["nghiep-vu", "van-hanh", "he-thong"].includes(d.nhom), k + ": nhom lạ " + d.nhom);
    must(typeof d.mo === "string" && d.mo.length > 8, k + ": thiếu mô tả");
  });
});
check("Kiểu khai khớp kiểu thật của state", () => {
  Object.keys(luocDo).forEach(k => {
    const d = luocDo[k], v = stateXuat[k];
    if (d.kieu === "mang") must(Array.isArray(v), k + " khai mảng nhưng không phải mảng");
    if (d.kieu === "bang") must(v && typeof v === "object" && !Array.isArray(v), k + " khai bảng nhưng không phải object");
  });
});
check("Mã chết vòng 14 không còn trong state: deliveries, bulk, priceExtra, bkSentric", () => {
  ["deliveries", "bulk", "priceExtra", "bkSentric"].forEach(k => must(!(k in stateXuat), "vẫn còn " + k));
});
check("thongTin() báo phiên bản và lược đồ; kích thước từng khoá cộng lại xấp xỉ tổng", () => {
  must(tt.luocDoVer === H.storage.luocDoVer(), "luocDoVer lệch");
  must(/^\d+\.\d+\.\d+$/.test(tt.phienBan), "phienBan không dạng x.y.z: " + tt.phienBan);
  const tong = Object.keys(tt.theoKhoa).reduce((s, k) => s + tt.theoKhoa[k], 0);
  must(tong > tt.kichThuoc * 0.9 && tong < tt.kichThuoc * 1.1, "tổng theo khoá " + tong + " lệch xa " + tt.kichThuoc);
  return "lược đồ v" + tt.luocDoVer + " · " + Math.round(tt.kichThuoc / 1024) + " KB";
});

/* ---- di trú từ state lược đồ 1 ---- */
function stateCu() {
  const s = JSON.parse(H.storage.exportJSON());
  delete s.luocDoVer; delete s.maDem; delete s.chiTraDao;
  s.v = "1.3.0";
  s.deliveries = [{ id: "D1" }]; s.bulk = []; s.priceExtra = {}; s.bkSentric = {};
  s.tickets = s.tickets.slice(0, 3).map(t => {
    const u = JSON.parse(JSON.stringify(t));
    delete u.body; delete u.comments; delete u.done;
    u.messages = [{ who: "partner", by: "HTK-L001", at: u.createdAt, text: "Mô tả ban đầu của đối tác" },
                  { who: "staff", by: "S03", at: u.createdAt, text: "Đã nhận" }];
    return u;
  });
  s.accounts.forEach(a => { delete a.ben; });
  return s;
}
check("Nhập state lược đồ 1: được nhận và nâng lên lược đồ hiện tại, không mất ticket", () => {
  const cu = stateCu(), soTicket = cu.tickets.length;
  H.storage.importJSON(JSON.stringify(cu));
  const moi = JSON.parse(H.storage.exportJSON());
  must(moi.luocDoVer === tt.luocDoVer, "không nâng lược đồ: " + moi.luocDoVer);
  must(moi.v === tt.phienBan, "v không theo CFG.VERSION");
  must(!("deliveries" in moi) && !("bulk" in moi), "chưa bỏ deliveries/bulk");
  must(moi.tickets.length === soTicket, "mất ticket");
  moi.tickets.forEach(t => {
    must(!t.messages, "ticket " + t.id + " vẫn còn messages");
    must(t.body === "Mô tả ban đầu của đối tác", "body sai: " + t.body);
    must(t.comments.length === 1 && t.comments[0].by === "S03", "comments sai");
    must("done" in t, "thiếu done");
  });
  must(moi.accounts.every(a => Array.isArray(a.ben)), "accounts thiếu ben[]");
  must(moi.chiTraDao && typeof moi.chiTraDao === "object", "thiếu chiTraDao");
  return soTicket + " ticket được chuyển messages → body + comments";
});
check("Di trú idempotent: nhập lại kết quả đã nâng, không đổi gì", () => {
  const a = H.storage.exportJSON();
  H.storage.importJSON(a);
  const b = H.storage.exportJSON();
  const ja = JSON.parse(a), jb = JSON.parse(b);
  delete ja.audit; delete jb.audit;
  must(JSON.stringify(ja) === JSON.stringify(jb), "nhập lại làm state đổi");
});
check("Bộ đếm mã được đọc lại từ dữ liệu cũ (maDem không về 0)", () => {
  const s = JSON.parse(H.storage.exportJSON());
  const soHoSo = s.releases.length;
  const tongDem = Object.keys(s.maDem).filter(k => k.startsWith("hoSo|")).reduce((n, k) => n + s.maDem[k], 0);
  must(tongDem >= soHoSo, "đếm hồ sơ " + tongDem + " < số hồ sơ " + soHoSo);
  return Object.keys(s.maDem).length + " bộ đếm";
});
check("Từ chối file lược đồ mới hơn", () => {
  const s = JSON.parse(H.storage.exportJSON()); s.luocDoVer = tt.luocDoVer + 1;
  let loi = null; try { H.storage.importJSON(JSON.stringify(s)); } catch (e) { loi = e; }
  must(loi && /mới hơn/.test(loi.message), "không từ chối: " + (loi && loi.message));
});
check("Từ chối file không phải state Haustek (thiếu feeds)", () => {
  let loi = null; try { H.storage.importJSON(JSON.stringify({ a: 1 })); } catch (e) { loi = e; }
  must(loi && /feeds/.test(loi.message), "không từ chối");
});
check("Ghi rồi nạp lại qua localStorage: luocDoVer và maDem còn nguyên", () => {
  must(H.storage.available(), "localStorage giả không dùng được");
  const raw = KHO[tt.khoa];
  must(raw, "chưa có gì trong kho ở khoá " + tt.khoa);
  const s = JSON.parse(raw);
  must(s.luocDoVer === tt.luocDoVer, "kho lưu luocDoVer sai");
  must(s.maDem && Object.keys(s.maDem).length, "kho không có maDem");
});

ra.forEach(([k, ten, m]) => console.log("  " + (k === "ok" ? "ok  " : "LỖI ") + " " + ten + (m ? "\n         " + m : "")));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
