/* =====================================================================
   CHUỖI DÙNG MÀ CHƯA KHAI — bắt tên khoá lọt ra màn hình
   ---------------------------------------------------------------------
   Khung dịch chữ viết thế này:

       function t(k) { return (CHU[lang] && CHU[lang][k]) || k; }

   Khoá thiếu thì KHÔNG ném lỗi — nó trả về chính tên khoá. Hệ quả: gõ sai
   một chữ, hoặc thêm chỗ dùng mà quên thêm chuỗi, là người dùng nhìn thấy
   "cachMo" giữa trang mà mọi bài kiểm vẫn xanh. Bài quét DOM cũng không
   bắt được, vì "cachMo" trông y như một từ tiếng Anh viết liền.

   Đúng chuyện ấy đã xảy ra ở trang Phiếu giao việc vòng 17, và người dùng
   phát hiện chứ không phải bộ kiểm. Bài này bịt lại: đọc thẳng mã nguồn
   từng trang, gom mọi khoá được GỌI và mọi khoá được KHAI, rồi so.

   Bắt ba thứ:
     · khoá gọi mà chưa khai ở tiếng Việt  → tên khoá lọt ra màn hình
     · khoá gọi mà chưa khai ở tiếng Anh   → tên khoá lọt ra bản EN
     · khoá khai mà không chỗ nào gọi      → rác, dọn đi cho gọn

       node portal/test/chuoi-thieu.js
   ===================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const MAN = path.join(__dirname, "..", "v2", "man");

/* Cắt lấy thân một object literal bắt đầu ngay sau "ten:" bằng cách đếm
   ngoặc, có nhảy qua chuỗi và chú thích để dấu ngoặc trong chuỗi không
   làm lệch bộ đếm. */
function than(src, tuKhoa) {
  /* Tìm theo BIÊN TỪ, không phải theo chuỗi con: "en:" nằm lọt trong
     "chuyen:" và "benNhan:", nên indexOf bắt nhầm chỗ rồi cắt ra một khối
     vô nghĩa — và bài kiểm báo sai hàng trăm khoá. */
    const co = tuKhoa.replace(/[:=\s]+$/, "").replace(/^var\s+/, "");
  const kieu = /^var /.test(tuKhoa) ? "var\\s+" + co + "\\s*=" : / =$/.test(tuKhoa) ? co + "\\s*=" : co + "\\s*:";
  const re = new RegExp("(^|[^A-Za-z0-9_$.])" + kieu);
  const m = re.exec(src);
  if (!m) return null;
  const i = m.index;
  let j = src.indexOf("{", i);
  if (j < 0) return null;
  let sau = 0, k = j, trong = null;
  for (; k < src.length; k++) {
    const c = src[k], truoc = src[k - 1];
    if (trong) {
      if (c === trong && truoc !== "\\") trong = null;
      else if (trong === "//" && c === "\n") trong = null;
      else if (trong === "/*" && c === "/" && truoc === "*") trong = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { trong = c; continue; }
    if (c === "/" && src[k + 1] === "/") { trong = "//"; continue; }
    if (c === "/" && src[k + 1] === "*") { trong = "/*"; k++; continue; }
    if (c === "{") sau++;
    else if (c === "}") { sau--; if (!sau) return { than: src.slice(j + 1, k), het: k + 1 }; }
  }
  return null;
}

/* Khoá ở ĐỘ SÂU 1 của một object literal — bỏ qua khoá trong object con. */
function khoaCap1(s) {
  const ra = new Set();
  let sau = 0, trong = null;
  for (let k = 0; k < s.length; k++) {
    const c = s[k], truoc = s[k - 1];
    if (trong) {
      if (trong === "//" ? c === "\n" : trong === "/*" ? (c === "/" && truoc === "*") : (c === trong && truoc !== "\\")) trong = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { trong = c; continue; }
    if (c === "/" && s[k + 1] === "/") { trong = "//"; continue; }
    if (c === "/" && s[k + 1] === "*") { trong = "/*"; k++; continue; }
    if (c === "{" || c === "[" || c === "(") { sau++; continue; }
    if (c === "}" || c === "]" || c === ")") { sau--; continue; }
    if (sau === 0 && /[A-Za-z_$]/.test(c) && !/[A-Za-z0-9_$.]/.test(truoc || " ")) {
      const m = /^([A-Za-z_$][\w$]*)\s*:/.exec(s.slice(k));
      if (m) { ra.add(m[1]); k += m[0].length - 1; }
    }
  }
  return ra;
}

let hong = 0, soTrang = 0, tongKhoa = 0;
const bao = [];

fs.readdirSync(MAN).filter(f => f.endsWith(".js")).sort().forEach(f => {
  const src = fs.readFileSync(path.join(MAN, f), "utf8");
  /* Bảng chữ có hai kiểu viết: đặt thẳng "chu: { vi: …, en: … }", hoặc
     tách ra "var CHU = { vi: …, en: … }" rồi "chu: CHU". Lấy khối vi
     trước, rồi tìm khối en TỪ CHỖ KHỐI VI KẾT THÚC — tìm từ đầu thì cụm
     "en:" nằm trong một chuỗi hay chú thích của khối vi sẽ bắt nhầm. */
  const giaoTiep = /\bchu:\s*([A-Za-z_$][\w$]*)\s*[,}\n]/.exec(src);
  const khoi = giaoTiep ? than(src, "var " + giaoTiep[1]) || than(src, giaoTiep[1] + " =") : than(src, "chu:");
  if (!khoi) return;                                 /* trang không có bảng chữ */
  const vi = than(khoi.than, "vi:");
  if (!vi) return;
  const en = than(khoi.than.slice(vi.het), "en:");
  if (!en) { bao.push([f, "có bảng vi mà không tìm được bảng en"]); hong++; return; }
  const kVi = khoaCap1(vi.than), kEn = khoaCap1(en.than);
  if (kVi.size < 3) return;                          /* không phải bảng chữ của trang */
  soTrang++; tongKhoa += kVi.size;

  /* Chỉ bắt t('...') của CHÍNH trang: HTS.t(...) và HTM.t(...) tra bảng
     chữ riêng của thư viện dùng chung, không phải bảng của trang này. */
  const goi = new Set();
  [/(?<![.\w$])t\(\s*(['"])([A-Za-z_$][\w$]*)\1\s*\)/g,
   /\bc\.t\(\s*(['"])([A-Za-z_$][\w$]*)\1\s*\)/g].forEach(re => {
    let m;
    while ((m = re.exec(src))) goi.add(m[2]);
  });

  const thieuVi = [...goi].filter(k => !kVi.has(k));
  const thieuEn = [...goi].filter(k => !kEn.has(k));
  const lechEn = [...kVi].filter(k => !kEn.has(k));
  const lechVi = [...kEn].filter(k => !kVi.has(k));
  const thua = [...kVi].filter(k => !goi.has(k) && !/^(nav|nhom)/.test(k));

  if (thieuVi.length) { bao.push([f, "GỌI MÀ CHƯA KHAI (vi): " + thieuVi.join(", ")]); hong++; }
  if (thieuEn.length) { bao.push([f, "GỌI MÀ CHƯA KHAI (en): " + thieuEn.join(", ")]); hong++; }
  if (lechEn.length)  { bao.push([f, "có ở vi mà thiếu ở en: " + lechEn.join(", ")]); hong++; }
  if (lechVi.length)  { bao.push([f, "có ở en mà thiếu ở vi: " + lechVi.join(", ")]); hong++; }
  if (thua.length > 6) bao.push([f, "· khai mà không dùng (" + thua.length + "): " + thua.slice(0, 8).join(", ") + "…"]);
});

bao.forEach(([f, m]) => console.log((m[0] === "·" ? "  ghi   " : "  HỎNG ") + f + "\n         " + m.replace(/^· /, "")));
console.log("\n" + soTrang + " trang · " + tongKhoa + " khoá tiếng Việt");
console.log(hong ? ">>> " + hong + " chỗ chuỗi lệch — tên khoá sẽ lọt ra màn hình"
                 : ">>> mọi khoá dùng đều đã khai ở cả hai ngôn ngữ");
process.exit(hong ? 1 : 0);
