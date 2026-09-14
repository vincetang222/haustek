/* =====================================================================
   SONG NGỮ · MỌI LỖI LÕI NÉM ĐỀU CÓ BẢN TIẾNG ANH
   ---------------------------------------------------------------------
   Lõi ném lỗi bằng tiếng Việt; khung dịch lúc hiện qua HAUSTEK.i18n.loi.
   Bài này đọc mã nguồn lõi, lấy mọi chuỗi new Error(...), rồi đòi mỗi
   chuỗi (thay phần động bằng "X") phải dịch ra một câu KHÔNG còn dấu
   tiếng Việt. Thêm lỗi mới mà quên thêm bản dịch là đỏ ngay ở đây.

       node portal/test/i18n-loi.js
   ===================================================================== */
"use strict";
global.window = global;
require("../haustek-core.js");
const H = window.HAUSTEK;
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "haustek-core.js"), "utf8");
const VN = /[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/;

/* Dựng "câu mẫu" từ biểu thức new Error(...): literal giữ nguyên, mỗi
   đoạn động (biến, lời gọi) thay bằng X. */
const re = /new Error\(((?:[^()]|\([^()]*\))*)\)/g;
const mau = new Set(); let m;
while ((m = re.exec(src))) {
  const parts = [];
  const lit = /"((?:[^"\\]|\\.)*)"/g; let last = 0, x;
  while ((x = lit.exec(m[1]))) {
    if (m[1].slice(last, x.index).trim().replace(/\+/g, "").trim()) parts.push("X");
    parts.push(JSON.parse('"' + x[1] + '"'));
    last = x.index + x[0].length;
  }
  if (m[1].slice(last).trim().replace(/\+/g, "").trim()) parts.push("X");
  const cau = parts.join("");
  if (cau.trim() && cau !== "X") mau.add(cau);
}
let pass = 0; const hong = [];
mau.forEach(cau => {
  const en = H.i18n.loi(cau, "en");
  if (VN.test(en) || en === cau) hong.push(cau + "  =>  " + en); else pass++;
});
/* vài mẫu động thật, kể cả phần động có dấu (tên kỳ, tên nền tảng) */
[["Kỳ 05/2026 đã được xét duyệt", "Period 05/2026 is already approved"],
 ["Không có quyền: nhapLieu.ghiKy (vai mgmt · cần ops)", "Not permitted: nhapLieu.ghiKy (role mgmt · needs ops)"],
 ["Zing MP3 không công bố số ra ngoài", "Zing MP3 publishes no public figures"],
 ["Không tìm thấy HT-2609-001", "HT-2609-001 not found"]].forEach(([vi, en]) => {
  const r = H.i18n.loi(vi, "en"); if (r === en) pass++; else hong.push(vi + "  =>  " + r + "  (mong: " + en + ")");
});
if (H.i18n.loi("Không có quyền", "vi") !== "Không có quyền") hong.push("chiều VI phải để nguyên");
console.log("  " + mau.size + " câu lỗi trong lõi · " + pass + " dịch được");
hong.forEach(x => console.log("  LỖI  " + x));
console.log("\n" + pass + " đạt · " + hong.length + " hỏng");
process.exit(hong.length ? 1 : 0);
