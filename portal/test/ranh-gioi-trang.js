/* =====================================================================
   HẠ TẦNG · RANH GIỚI GIỮA TRANG VÀ LÕI
   ---------------------------------------------------------------------
   Kiến trúc: lõi (haustek-core.js) giữ state và luật; trang (v2/man/*.js)
   chỉ vẽ. Trang nội bộ nhận lõi qua c.A (HAUSTEK.admin đã bọc quyền),
   trang đối tác (k-*.js) qua c.api. Không trang nào được:
     · đọc state thô (A.state(...) — đã bỏ khỏi mặt tiền vòng 22),
     · chạm HAUSTEK.admin / HAUSTEK.api trực tiếp (trừ quan-tri: xuất/nhập
       file cần HAUSTEK.storage),
     · tự lưu vào localStorage trừ ba trang có ghi chú người dùng
       (roi: tham số; theo-doi: yêu thích; haustek-hoso: nháp hồ sơ) và
       hai file khung (haustek-man, haustek-shell: tuỳ chọn giao diện).
   Trang đối tác không được nhắc tới "admin" dù chỉ trong chuỗi, để lỡ có
   ai copy mã sang là bài kiểm bắt ngay.

       node portal/test/ranh-gioi-trang.js
   ===================================================================== */
"use strict";
const fs = require("fs"), path = require("path");
const V2 = path.join(__dirname, "..", "v2");
const MAN = path.join(V2, "man");

let pass = 0, fail = 0; const ra = [];
function check(ten, fn) {
  try { const m = fn(); ra.push(["ok", ten, m || ""]); pass++; }
  catch (e) { ra.push(["LỖI", ten, e.message]); fail++; }
}
function must(ok, msg) { if (!ok) throw new Error(msg); }
const boChuThich = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\'"])\/\/[^\n]*/g, "$1");
const docMa = f => boChuThich(fs.readFileSync(f, "utf8"));
/* bỏ luôn chuỗi ký tự: lời giải thích trên trang được phép nhắc tên HAUSTEK.admin */
const boChuoi = s => s.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, '""');

const trang = fs.readdirSync(MAN).filter(f => f.endsWith(".js")).sort();
const noiBo = trang.filter(f => !f.startsWith("k-"));
const doiTac = trang.filter(f => f.startsWith("k-"));
const khung = ["haustek-man.js", "haustek-shell.js", "haustek-hoso.js", "haustek-taisan.js", "haustek-ui.js"].filter(f => fs.existsSync(path.join(V2, f)));
const KHO_DUOC_PHEP = new Set(["roi.js", "theo-doi.js", "haustek-hoso.js", "haustek-man.js", "haustek-shell.js"]);

check("Không trang nào đọc state thô qua A.state(", () => {
  const vi = [];
  trang.forEach(f => { const m = docMa(path.join(MAN, f)); if (/\bA\.state\s*\(/.test(m)) vi.push(f); });
  khung.forEach(f => { const m = docMa(path.join(V2, f)); if (/\bA\.state\s*\(/.test(m)) vi.push(f); });
  must(!vi.length, "còn A.state( ở: " + vi.join(", "));
  return trang.length + " trang · " + khung.length + " file khung";
});
check("Trang nội bộ chỉ chạm lõi qua c.A; HAUSTEK.admin / HAUSTEK.api không xuất hiện (trừ quan-tri dùng HAUSTEK.storage)", () => {
  const vi = [];
  noiBo.forEach(f => {
    const m = boChuoi(docMa(path.join(MAN, f)));
    if (/HAUSTEK\.admin\b/.test(m)) vi.push(f + " (HAUSTEK.admin)");
    if (f !== "quan-tri.js" && /HAUSTEK\.(api|storage)\b/.test(m)) vi.push(f + " (HAUSTEK.api/storage)");
    if (/window\.HAUSTEK\b/.test(m)) vi.push(f + " (window.HAUSTEK)");
  });
  must(!vi.length, vi.join(", "));
  return noiBo.length + " trang nội bộ";
});
check("Trang đối tác không nhắc tới admin, không chạm HAUSTEK.* trực tiếp, không lockdown", () => {
  const vi = [];
  doiTac.forEach(f => {
    const m = boChuoi(docMa(path.join(MAN, f)));
    if (/\badmin\b/i.test(m)) vi.push(f + " (admin)");
    if (/HAUSTEK\./.test(m)) vi.push(f + " (HAUSTEK.)");
    if (/\bc\.A\b|\bA\.\w+\(/.test(m)) vi.push(f + " (c.A)");
    if (/lockdown/.test(m)) vi.push(f + " (lockdown)");
  });
  must(!vi.length, vi.join(", "));
  return doiTac.length + " trang đối tác";
});
check("localStorage / sessionStorage chỉ ở nơi được phép", () => {
  const vi = [];
  trang.forEach(f => { if (!KHO_DUOC_PHEP.has(f) && /(local|session)Storage\s*\./.test(docMa(path.join(MAN, f)))) vi.push(f); });
  khung.forEach(f => { if (!KHO_DUOC_PHEP.has(f) && /(local|session)Storage\s*\./.test(docMa(path.join(V2, f)))) vi.push(f); });
  must(!vi.length, "tự lưu ngoài lõi: " + vi.join(", "));
  return [...KHO_DUOC_PHEP].join(", ");
});
check("Trang được phép lưu chỉ dùng khoá riêng có tiền tố haustek., không đụng khoá state của lõi", () => {
  const vi = [], khoa = [];
  [...KHO_DUOC_PHEP].forEach(f => {
    const p = fs.existsSync(path.join(MAN, f)) ? path.join(MAN, f) : path.join(V2, f);
    if (!fs.existsSync(p)) return;
    const m = docMa(p);
    const bien = {};
    m.replace(/\b(?:var|const|let)\s+(\w+)\s*=\s*'([^']+)'/g, (_, t, v) => { bien[t] = v; return _; });
    const re = /(?:local|session)Storage\.(?:getItem|setItem|removeItem)\(\s*(?:'([^']+)'|(\w+))/g;
    const goi = /\b(?:docKho|ghiKho)\(\s*'([^']+)'/g;
    let x;
    while ((x = re.exec(m))) { const k = x[1] != null ? x[1] : (bien[x[2]] != null ? bien[x[2]] : (x[2] === "k" || x[2] === "KHOA" || x[2] === "KHO" ? null : x[2])); if (k != null) khoa.push([f, k]); }
    while ((x = goi.exec(m))) khoa.push([f, x[1]]);
    if (/haustek\.(state|store|core)\b/.test(m)) vi.push(f + " đụng khoá lõi");
  });
  khoa.forEach(([f, k]) => { if (!/^haustek\./.test(k)) vi.push(f + " khoá '" + k + "'"); });
  must(!vi.length, vi.join(", "));
  return khoa.map(x => x[1]).filter((k, i, a) => a.indexOf(k) === i).join(" · ");
});
check("Mỗi trang đăng ký đúng một lần qua HT.dangKy và không tự require/import gì", () => {
  const vi = [];
  trang.forEach(f => {
    const m = docMa(path.join(MAN, f));
    const n = (m.match(/HT\.dangKy\s*\(/g) || []).length;
    if (n !== 1) vi.push(f + " dangKy×" + n);
    if (/\brequire\s*\(|^\s*import\s/m.test(m)) vi.push(f + " require/import");
  });
  must(!vi.length, vi.join(", "));
});
check("Trang không tự gọi store/audit/ghi state qua đường vòng (A.store, A.audit.log, A.save)", () => {
  const vi = [];
  trang.forEach(f => {
    const m = docMa(path.join(MAN, f));
    if (/\bA\.(store|save|audit\.log|_state|state_)\b/.test(m)) vi.push(f);
  });
  must(!vi.length, vi.join(", "));
});

ra.forEach(([k, ten, m]) => console.log("  " + (k === "ok" ? "ok  " : "LỖI ") + " " + ten + (m ? "\n         " + m : "")));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
