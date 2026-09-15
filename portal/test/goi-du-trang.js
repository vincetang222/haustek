/* =====================================================================
   BẢN GÓI MỘT TRANG CÓ ĐỦ MỌI TRANG KHÔNG
   ---------------------------------------------------------------------
   Vòng 15 thêm ba trang vào intranet.html mà quên thêm vào danh sách gõ
   cứng trong dung-goi.js. Hệ quả: suốt hai vòng, bản gói một trang — tức
   bản người ngoài mở ra xem — thiếu hẳn ba trang mới, trong khi TOÀN BỘ
   bài kiểm vẫn xanh, vì bài nào cũng kiểm trang thật chứ không kiểm gói.

   Bài này bịt đúng khe ấy: so danh sách <script src="man/…"> của hai
   trang thật với những gì thực sự nằm trong bản gói. Lệch một trang là
   đỏ, và đỏ ngay tại chỗ gây ra chứ không phải hai vòng sau.

       node portal/test/goi-du-trang.js
   ===================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const V = path.join(__dirname, "..", "v2");
const GOI = path.join(__dirname, "..", "goi-mot-trang.html");

let hong = 0;
function must(ok, ten, them) {
  console.log((ok ? "  ok   " : "  HỎNG ") + ten + (them ? "\n         " + them : ""));
  if (!ok) hong++;
}

function manCua(trang) {
  const html = fs.readFileSync(path.join(V, trang), "utf8");
  const ra = [];
  const re = /<script\s+src="man\/([a-z0-9-]+)\.js"><\/script>/gi;
  let m;
  while ((m = re.exec(html))) ra.push(m[1]);
  return ra;
}

if (!fs.existsSync(GOI)) {
  console.log("Chưa dựng gói. Chạy: node portal/dung-goi.js");
  process.exit(1);
}
const goi = fs.readFileSync(GOI, "utf8");
const noiBo = manCua("intranet.html");
const khach = manCua("khach.html");

must(noiBo.length >= 20, "đọc được danh sách trang nội bộ", noiBo.length + " trang");
must(khach.length >= 15, "đọc được danh sách trang đối tác", khach.length + " trang");

[["nội bộ", noiBo], ["đối tác", khach]].forEach(([ten, ds]) => {
  const thieu = ds.filter(n => goi.indexOf("man/" + n + ".js ----") < 0);
  must(thieu.length === 0, "bản gói có đủ " + ds.length + " trang " + ten,
    thieu.length ? "THIẾU: " + thieu.join(", ") : ds.length + " trang đều có mặt");
});

/* Thư viện dùng chung cũng phải có mặt, không thì trang dựng ra rỗng.
   Danh sách này TỪNG gõ cứng ngay tại đây — và đó là lý do bài kiểm này
   vẫn xanh suốt vòng 25 trong khi bản gói thiếu hẳn haustek-cua.js, tức
   thiếu hẳn trang đăng nhập. Bài kiểm chép lại cùng một danh sách gõ tay
   với thứ nó đi kiểm thì nó chỉ kiểm được rằng hai bản chép giống nhau.
   Giờ đọc từ trang thật, đúng cách danh sách trang vẫn làm ở trên. */
function thuVienCua(trang) {
  const html = fs.readFileSync(path.join(V, trang), "utf8");
  const ra = [];
  const re = /<script\s+src="((?:\.\.\/)?[a-z0-9-]+\.js)"><\/script>/gi;
  let m;
  while ((m = re.exec(html))) ra.push(m[1]);
  return ra;
}
const THU_VIEN = [];
thuVienCua("intranet.html").concat(thuVienCua("khach.html")).forEach(f => {
  if (THU_VIEN.indexOf(f) < 0) THU_VIEN.push(f);
});
must(THU_VIEN.length >= 7, "đọc được danh sách thư viện từ trang thật",
  THU_VIEN.length + " file: " + THU_VIEN.join(", "));
THU_VIEN.forEach(f => {
  const dau = fs.readFileSync(path.join(V, f), "utf8")
    .split("\n").find(l => l.trim().length > 30 && l.indexOf("=====") < 0);
  must(dau != null && goi.indexOf(dau.trim().slice(0, 60)) >= 0, "bản gói có " + f);
});

/* Và mọi file trang trong thư mục man/ phải được MỘT trong hai trang thật
   nạp — file mồ côi nghĩa là viết xong rồi quên đấu dây. */
const tren = fs.readdirSync(path.join(V, "man")).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3));
const daNap = noiBo.concat(khach);
const moCoi = tren.filter(n => daNap.indexOf(n) < 0);
must(moCoi.length === 0, "không có file trang nào mồ côi",
  moCoi.length ? "MỒ CÔI: " + moCoi.join(", ") : tren.length + " file đều được nạp");

console.log(hong ? "\n>>> " + hong + " chỗ lệch giữa trang thật và bản gói"
                 : "\n>>> bản gói khớp đúng hai trang thật");
process.exit(hong ? 1 : 0);
