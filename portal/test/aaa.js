/* =====================================================================
   AAA · HỘI ĐỒNG ĐI QUA MỌI CỬA, GIÁM ĐỐC QUA CỬA NHƯ MỌI VAI
   ---------------------------------------------------------------------
   Vòng 22. Trước đó "role === mgmt" rải ở 11 chỗ trong lõi và 20 chỗ trên
   trang: giám đốc đi qua mọi cửa mà bảng quyền không nói thế. Giờ:
     · vai hội đồng (bod) là đường tắt DUY NHẤT, nằm ngoài mọi bảng;
     · giám đốc đi qua bảng: thấy hết trừ Nhập số liệu, không gõ số, không
       bỏ qua sai lệch, không tạo hồ sơ thay đối tác;
     · "thấy việc của mọi bộ phận" là một nhóm có tên (giamSat), không phải
       một ngoại lệ trong mã;
     · không ai ngoài hội đồng đưa người vào / ra khối hội đồng hay khoá
       thành viên hội đồng; thành viên cuối cùng không khoá được.

       node portal/test/aaa.js
   ===================================================================== */
"use strict";
global.window = global;
require("../haustek-core.js");
const H = window.HAUSTEK, A = H.admin;

let pass = 0, fail = 0; const ra = [];
function check(ten, fn) {
  try { const m = fn(); ra.push(["ok", ten, m || ""]); pass++; }
  catch (e) { ra.push(["LỖI", ten, e.message]); fail++; }
}
function must(ok, msg) { if (!ok) throw new Error(msg); }
function mustThrow(fn, re, msg) { try { fn(); } catch (e) { if (!re || re.test(e.message)) return e; throw new Error(msg + " — ném sai lỗi: " + e.message); } throw new Error(msg + " — không bị chặn"); }
const nhu = id => { A.staff.setMe(id); return A.staff.me; };
const AAA = A.quyen.vaiAAA, B = A.quyen.bang();
const HD = A.staff.list().find(x => x.role === AAA);

check("Có đúng một tài khoản hội đồng, nằm trong khối AAA duy nhất, không thuộc VAI_NB", () => {
  must(HD && HD.id === "S00" && HD.boPhan === "hoi-dong", "thiếu S00 ở khối hoi-dong");
  must(A.quyen.vaiTatCa.indexOf(AAA) < 0, "vai AAA lọt vào VAI_NB");
  const aaaKhoi = B.khoi.filter(k => k.aaa);
  must(aaaKhoi.length === 1 && aaaKhoi[0].vai === AAA, "khối AAA phải đúng một và mang vai hội đồng");
  return HD.name + " · " + HD.title;
});
check("Vai AAA không có trong bất kỳ dòng nào của bảng trang / bảng nhóm", () => {
  const trang = Object.keys(B.man).filter(m => B.man[m].indexOf(AAA) >= 0), nhom = Object.keys(B.nhom).filter(g => B.nhom[g].vai.indexOf(AAA) >= 0);
  must(!trang.length && !nhom.length, "AAA ghi trong bảng: " + trang.concat(nhom).join(","));
  return Object.keys(B.man).length + " trang · " + Object.keys(B.nhom).length + " nhóm · không dòng nào có AAA";
});
check("Hội đồng đi qua mọi trang (kể cả Mức trả, chặn theo cấp) và mọi nhóm", () => {
  nhu("S00");
  must(A.quyen.aaa(), "quyen.aaa() phải đúng với hội đồng");
  const chan = Object.keys(B.man).filter(m => !A.quyen.man(m)).concat(Object.keys(B.nhom).filter(g => !A.quyen.nhom(g)));
  must(!chan.length, "hội đồng bị chặn: " + chan.join(","));
  must(A.quyen.man("muc-tra") && A.quyen.nhom("nhapLieu") && A.quyen.nhom("chotKy"), "hội đồng thiếu mức trả / nhập liệu / chốt kỳ");
  return "0 chỗ chặn";
});
check("Hội đồng thấy như giám sát: mọi việc hỗ trợ, đối tác trong tìm nhanh, bản tính đầy đủ", () => {
  nhu("S00");
  const tatCa = A.tickets.list({}).length;
  nhu("S05"); const hoTro = A.tickets.list({}).length;
  must(tatCa > hoTro, "hội đồng phải thấy nhiều việc hơn hỗ trợ: " + tatCa + " vs " + hoTro);
  nhu("S00");
  must(A.search("night", 8).parties.length > 0, "hội đồng mất đối tác trong tìm nhanh");
  const dx = A.proposals.list({ type: "advance" })[0];
  must(dx && dx.calc && dx.calc.roi != null, "hội đồng mất ROI trong bản tính");
  return tatCa + " việc";
});
check("Giám đốc qua cửa: không gõ số, không bỏ qua sai lệch, không tạo hồ sơ thay; lệnh gọi thẳng bị chặn đúng mã NO_QUYEN", () => {
  nhu("S01");
  must(!A.quyen.aaa(), "giám đốc không phải AAA");
  must(!A.quyen.nhom("nhapLieu") && !A.quyen.nhom("kiemSo") && !A.quyen.nhom("phatHanhHo") && !A.quyen.man("nhap-so-lieu"), "giám đốc vẫn cầm nhóm phải bỏ");
  const e1 = mustThrow(() => A.nhapLieu.ghiKy(0, 0, 1, { nguon: "x" }, "gd"), /Không có quyền/, "giám đốc gõ số");
  const e2 = mustThrow(() => A.ingest.acceptVariance(0, "onerpm", "gd"), /Không có quyền/, "giám đốc bỏ qua sai lệch");
  const e3 = mustThrow(() => A.releases.createFor("A:1", {}, "gd"), /Không có quyền/, "giám đốc tạo hồ sơ thay");
  const e4 = mustThrow(() => A.fx.set(27000, "2026-09-30"), /Không có quyền/, "giám đốc gõ tỷ giá");
  must([e1, e2, e3, e4].every(e => e.code === "NO_QUYEN"), "phải ném NO_QUYEN");
  must(A.quyen.nhom("chotKy") && A.quyen.nhom("giamSat") && A.quyen.man("muc-tra"), "giám đốc mất chốt kỳ / giám sát / mức trả");
  return "4 lệnh bị chặn · chốt kỳ và giám sát còn nguyên";
});
check("giamSat là nhóm có tên, chỉ giám đốc có; nó thay cho mọi đường tắt mgmt trong lõi", () => {
  must(B.nhom.giamSat && B.nhom.giamSat.vai.join() === "mgmt", "giamSat phải chỉ có giám đốc: " + (B.nhom.giamSat ? B.nhom.giamSat.vai.join() : "không có"));
  const src = require("fs").readFileSync(require("path").join(__dirname, "..", "haustek-core.js"), "utf8");
  const tat = src.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => /role\s*[!=]==\s*"mgmt"|vaiHienTai\(\)\s*[!=]==\s*"mgmt"|k\.vai\s*===\s*"mgmt"/.test(l));
  must(!tat.length, "còn đường tắt mgmt trong lõi ở dòng " + tat.map(x => x[0]).join(", "));
  nhu("S01"); const gd = A.tickets.list({}).length; nhu("S05"); const ht = A.tickets.list({}).length;
  must(gd > ht, "giám đốc (giamSat) phải thấy mọi việc");
  return "0 đường tắt · giám đốc thấy " + gd + " việc, hỗ trợ " + ht;
});
check("Trang không còn hỏi role === 'mgmt' để giấu / hiện nút; hỏi quyen.nhom / quyen.aaa", () => {
  const fs = require("fs"), path = require("path"), thu = path.join(__dirname, "..", "v2", "man");
  const xau = [];
  fs.readdirSync(thu).filter(f => f.endsWith(".js")).forEach(f => {
    const src = fs.readFileSync(path.join(thu, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    if (/role\s*[!=]==\s*'mgmt'/.test(src)) xau.push(f);
  });
  const shell = fs.readFileSync(path.join(__dirname, "..", "v2", "haustek-shell.js"), "utf8");
  if (/role\s*[!=]==\s*'mgmt'/.test(shell)) xau.push("haustek-shell.js");
  must(!xau.length, "còn hỏi thẳng mgmt: " + xau.join(", "));
});
check("Không ai ngoài hội đồng đưa người vào / ra khối hội đồng", () => {
  nhu("S01");
  mustThrow(() => A.toChuc.chuyenNhanSu("S02", { boPhan: "hoi-dong" }, "gd"), /hội đồng/, "giám đốc chuyển người vào hội đồng");
  mustThrow(() => A.toChuc.themNhanSu({ name: "Kẻ Lạ", email: "la@haustek-group.com", boPhan: "hoi-dong" }, "gd"), /hội đồng/, "giám đốc thêm người vào hội đồng");
  mustThrow(() => A.toChuc.chuyenNhanSu("S00", { boPhan: "ban-giam-doc" }, "gd"), /hội đồng/, "giám đốc chuyển thành viên hội đồng ra");
  mustThrow(() => A.toChuc.khoaNhanSu("S00", false, "gd"), /hội đồng/, "giám đốc khoá thành viên hội đồng");
  must(A.staff.list().find(x => x.id === "S00").active !== false && A.staff.list().find(x => x.id === "S02").boPhan === "van-hanh", "trạng thái bị đổi dù đã chặn");
});
check("Hội đồng thêm được thành viên; thành viên cuối cùng không khoá / không chuyển ra được", () => {
  nhu("S00");
  mustThrow(() => A.toChuc.khoaNhanSu("S00", false, "hd"), /chính mình/, "tự khoá");
  mustThrow(() => A.toChuc.chuyenNhanSu("S00", { boPhan: "ban-giam-doc" }, "hd"), /cuối cùng/, "chuyển thành viên cuối cùng ra");
  const moi = A.toChuc.themNhanSu({ name: "Trần Hội Đồng", email: "hd2@haustek-group.com", boPhan: "hoi-dong", chucDanh: "thanh-vien-hd" }, "hd");
  must(moi.role === AAA && moi.boPhan === "hoi-dong", "thành viên mới không mang vai hội đồng");
  nhu(moi.id); must(A.quyen.aaa() && A.quyen.man("muc-tra"), "thành viên mới không đi qua cửa");
  nhu("S01"); mustThrow(() => A.toChuc.khoaNhanSu(moi.id, false, "gd"), /hội đồng/, "giám đốc khoá thành viên mới");
  nhu("S00"); A.toChuc.khoaNhanSu(moi.id, false, "hd");
  must(A.staff.list().find(x => x.id === moi.id).active === false, "hội đồng không khoá được thành viên khác");
  mustThrow(() => A.toChuc.khoaNhanSu("S00", false, "hd"), /chính mình/, "giờ S00 lại là người cuối");
  return moi.id + " thêm rồi khoá bởi hội đồng";
});
check("Hội đồng duyệt được đề xuất dù không nằm trong bảng luồng; nhật ký ghi đúng người", () => {
  nhu("S00");
  const dx = A.proposals.list({ status: "submitted" })[0] || A.proposals.list({ status: "checked" })[0];
  must(dx, "không có đề xuất đang chờ để thử");
  const r = A.proposals.review(dx.id, "approve", "hội đồng duyệt", "Đặng Toàn Quyền", AAA);
  must(r.status === "approved", "hội đồng không duyệt được: " + r.status);
  A.accounts.add("aaa-nhat-ky@vi-du.vn", "artist", "A:1");
  const nk = A.audit.list(1)[0];
  must(nk.by === HD.email, "nhật ký mặc định phải ghi người đang dùng, đang ghi: " + nk.by);
  return dx.id + " duyệt · nhật ký by " + nk.by;
});
check("Vai không có trong cây (ví dụ 'admin' của cổng đối tác) không lọt qua cửa nội bộ", () => {
  must(!A.quyen.cua("admin").man.length && !A.quyen.cua("admin").nhom.length, "vai lạ đi qua được cửa");
  must(!A.quyen.cua("BOD").man.length && !A.quyen.cua("Bod").nhom.length, "vai AAA viết hoa lọt qua cửa");
});

ra.forEach(([k, ten, m]) => console.log("  " + (k === "ok" ? "ok  " : "LỖI ") + " " + ten + (m ? "\n         " + m : "")));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
