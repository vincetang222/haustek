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

/* Dựng "câu mẫu" từ một biểu thức: literal giữ nguyên, mỗi đoạn động
   (biến, lời gọi) thay bằng X. */
function cauMau(bieuThuc) {
  const parts = [];
  /* Nhận cả nháy đơn lẫn nháy kép. Câu 'Gói không mang dấu "haustek-crm"'
     dùng nháy đơn bọc ngoài vì bên trong có nháy kép; bộ đọc chỉ biết nháy
     kép thì nó lấy nhầm phần BÊN TRONG làm literal và dựng ra câu mẫu
     "Xhaustek-crmX" — một câu không tồn tại, không dịch được, và che mất
     câu thật. */
  const lit = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g; let last = 0, x;
  while ((x = lit.exec(bieuThuc))) {
    if (bieuThuc.slice(last, x.index).trim().replace(/\+/g, "").trim()) parts.push("X");
    const noiDung = x[1] !== undefined
      ? JSON.parse('"' + x[1] + '"')
      : JSON.parse('"' + x[2].replace(/\\'/g, "'").replace(/"/g, '\\"') + '"');
    parts.push(noiDung);
    last = x.index + x[0].length;
  }
  if (bieuThuc.slice(last).trim().replace(/\+/g, "").trim()) parts.push("X");
  const cau = parts.join("");
  return (cau.trim() && cau !== "X") ? cau : null;
}

/* HAI NGUỒN, KHÔNG PHẢI MỘT.

   Bản trước chỉ thu new Error(...). Nhưng tvKiemGoi không ném từng lỗi —
   nó dồn vào một mảng bằng loi.push("…") rồi mới join(" · ") và ném một
   lần. Tám câu lỗi của nó vì thế VÔ HÌNH với bài kiểm này, và con số
   "đạt" không nói gì về chúng. Đã đo: tám câu ấy không nằm trong 215 câu
   thu được, trong khi ba câu ghép từ chúng dịch ra vẫn còn tiếng Việt.

   Một bài kiểm không thấy thứ nó được lập ra để canh thì nó chỉ canh
   chính nó. Thu cả hai nguồn. */
const NGUON = [
  /new Error\(((?:[^()]|\([^()]*\))*)\)/g,
  /\bloi\.push\(((?:[^()]|\([^()]*\))*)\)/g,
  /* Vòng 35 · mười lăm cửa của tvTrinh tách ra tvSoat và đổi throw thành
     ch("ma", cau). Không có mẫu này thì số câu canh tụt từ 237 xuống 227:
     mười câu lỗi rời khỏi lưới i18n vĩnh viễn, mà bài kiểm vẫn xanh vì nó
     chỉ hỏng khi một câu ĐÃ THU ĐƯỢC dịch không ra. Một bài kiểm mất đối
     tượng mà không kêu là một bài kiểm bảo lãnh cho một bảo đảm không còn. */
  /\bch\("[a-zA-Z]+",\s*((?:[^()]|\([^()]*\))*)\)/g
];
const mau = new Set();
for (const re of NGUON) {
  let m;
  while ((m = re.exec(src))) { const c = cauMau(m[1]); if (c) mau.add(c); }
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
 ["Không tìm thấy HT-2609-001", "HT-2609-001 not found"],
 /* Câu ghép nhiều lỗi bằng " · ": phải dịch TỪNG VẾ. Dò mẫu nguyên câu thì
    mẫu đuôi mở nuốt trọn, hoặc mẫu kết thúc bằng literal khớp xuyên dấu
    phân cách và cho ra câu lai — số của vế đầu dán vào đuôi tiếng Anh của
    vế cuối. Ba câu dưới là ba ca đã đo được là hỏng. */
 ["Deal thứ 1 thiếu mã deal · Deal thứ 2 thiếu mã deal",
  "Deal 1 has no deal id · Deal 2 has no deal id"],
 ["Deal thứ 1 không đọc được · Deal thứ 2 không đọc được",
  "Deal 1 could not be read · Deal 2 could not be read"],
 ["Gói thuộc phiên bản 2.0.0, bản này đọc 1.0.0 · Deal thứ 1 thiếu mã deal",
  "The payload is version 2.0.0; this build reads 1.0.0 · Deal 1 has no deal id"]].forEach(([vi, en]) => {
  const r = H.i18n.loi(vi, "en"); if (r === en) pass++; else hong.push(vi + "  =>  " + r + "  (mong: " + en + ")");
});
if (H.i18n.loi("Không có quyền", "vi") !== "Không có quyền") hong.push("chiều VI phải để nguyên");
console.log("  " + mau.size + " câu lỗi trong lõi · " + pass + " dịch được");
hong.forEach(x => console.log("  LỖI  " + x));
console.log("\n" + pass + " đạt · " + hong.length + " hỏng");
process.exit(hong.length ? 1 : 0);
