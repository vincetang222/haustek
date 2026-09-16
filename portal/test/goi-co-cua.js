/* =====================================================================
   BẢN GÓI MỘT TRANG CÓ CỬA ĐĂNG NHẬP KHÔNG
   ---------------------------------------------------------------------
   Bài này ra đời vì một lỗi cụ thể, và nó chỉ có lý do tồn tại chừng nào
   người đọc còn nhớ lỗi ấy:

   Vòng 25 dựng trang đăng nhập, đấu vào cả hai trang thật, viết 22 phép
   kiểm trong cua-dang-nhap.js — tất cả đều xanh. Nhưng danh sách thư viện
   trong dung-goi.js gõ tay và không ai thêm haustek-cua.js vào đó, nên
   BẢN GÓI — thứ duy nhất người ngoài thật sự mở ra xem — không có cửa.
   Người dùng báo "vẫn chưa thấy screen đăng nhập" và họ đúng.

   Bài học không phải "nhớ thêm vào danh sách". Bài học là: mọi bài kiểm
   trình duyệt của kho này đều trỏ vào v2/*.html, nên bản gói có thể hỏng
   theo bất cứ kiểu nào mà cả bộ kiểm vẫn xanh. goi-du-trang.js chỉ so
   CHUỖI trong file, nó không mở trang ra chạy. Bài này mở.

   Vì thế: đừng thêm phép kiểm giao diện chi tiết vào đây. Nhiệm vụ của
   nó chỉ là "bản gói có chạy được như một sản phẩm không", còn chi tiết
   cửa thì cua-dang-nhap.js lo.

   Cần server tĩnh ở cổng 8099, chạy từ THƯ MỤC portal:
       cd portal && python3 -m http.server 8099 &
       NODE_PATH=$(npm root -g) node test/goi-co-cua.js
   ===================================================================== */
"use strict";
const { chromium } = require("playwright");
const GOI = "http://127.0.0.1:8099/goi-mot-trang.html";

let pass = 0; const hong = [];
function must(c, ten, m) {
  if (c) { pass++; console.log("  ok   " + ten); }
  else { hong.push(ten + " — " + m); console.log("  LỖI  " + ten + " — " + m); }
}

const oCua  = p => p.evaluate(() => !!document.querySelector(".cua"));
const oCong = p => p.evaluate(() => !!document.querySelector(".app .nav"));

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  /* KHÔNG gọi vao-cua.js: bài này kiểm đúng cái cửa mà bài khác đi vòng qua. */
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const loi = [];
  p.on("pageerror", e => loi.push(e.message));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) loi.push(m.text()); });

  /* 1 · mở bản gói ra là thấy CỬA, không phải cổng.
         Đây đúng là phép kiểm mà vòng 25 thiếu. */
  await p.goto(GOI, { waitUntil: "networkidle" });
  await p.waitForTimeout(1600);
  must(await oCua(p) && !(await oCong(p)),
    "mở bản gói ra thì thấy cửa đăng nhập, chưa thấy cổng",
    "cửa=" + await oCua(p) + " cổng=" + await oCong(p));

  /* 2 · cột phải có mặt, và ba con số của nó là số THẬT của bộ dữ liệu.
         A.counts.tracks = CFG.N_TRACKS; nếu ai đó gõ tay một con số cho
         đẹp thì phép kiểm này đỏ. */
  const phai = await p.evaluate(() => ({
    co: !!document.querySelector(".cua-phai"),
    so: [].slice.call(document.querySelectorAll(".cua-so b")).map(x => x.textContent.trim()),
    the: document.querySelectorAll(".cua-the i").length,
    that: (window.HAUSTEK && HAUSTEK.admin) ? HAUSTEK.admin.counts.tracks : null
  }));
  const soBai = phai.so[0] ? Number(phai.so[0].replace(/[^0-9]/g, "")) : -1;
  must(phai.co && phai.the >= 5 && soBai === phai.that,
    "cột phải có mặt, và số bài hát trên đó là số thật của lõi",
    "cột=" + phai.co + " thẻ=" + phai.the + " hiện=" + soBai + " lõi=" + phai.that);

  /* 3 · đổi cổng NGAY TỪ CỬA, chưa cần đăng nhập.
         Bản gói có hai cổng; bắt người ta đăng nhập vào cổng này mới đổi
         được sang cổng kia là một cái bẫy. */
  await p.click('[data-c2="khach"]');
  await p.waitForTimeout(2200);
  const sauDoi = await p.evaluate(() => ({
    cua: !!document.querySelector(".cua"),
    tieu: (document.querySelector(".cua-dau h1") || {}).textContent || ""
  }));
  must(sauDoi.cua && /đối tác|Partner/i.test(sauDoi.tieu),
    "đổi sang cổng đối tác ngay từ cửa, vẫn là một cửa",
    "cửa=" + sauDoi.cua + " tiêu đề=" + sauDoi.tieu);

  /* 4 · đăng nhập được, và cửa gỡ hẳn khỏi DOM */
  await p.fill("[data-cua-email]", "label1@vidu.vn");
  await p.click(".cua-nut");
  await p.waitForTimeout(2000);
  const sauVao = await p.evaluate(() => ({
    cua: !!document.querySelector(".cua"),
    nen: !!document.querySelector(".cua-nen"),
    nav: document.querySelectorAll(".app .nav a").length,
    ra: !!document.querySelector("[data-ra]")
  }));
  must(!sauVao.cua && !sauVao.nen && sauVao.nav > 0 && sauVao.ra,
    "đăng nhập vào được, cửa gỡ hẳn, có nút đăng xuất",
    JSON.stringify(sauVao));

  /* 5 · nạp lại vẫn ở trong */
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
  must(await oCong(p) && !(await oCua(p)), "nạp lại vẫn ở trong cổng", "bị đá ra cửa");

  /* 6 · đăng xuất thì về cửa */
  await p.click("[data-ra]");
  await p.waitForTimeout(2000);
  must(await oCua(p) && !(await oCong(p)), "đăng xuất thì về cửa", "vẫn ở trong cổng");

  must(!loi.length, "không lỗi JavaScript nào suốt cả luồng", loi[0]);

  await p.close(); await ctx.close(); await b.close();
  console.log("\n" + pass + " đạt · " + hong.length + " hỏng");
  process.exit(hong.length ? 1 : 0);
})();
