/* =====================================================================
   TƯƠNG PHẢN — đo trên TRANG ĐÃ RENDER, không đo bảng biến
   ---------------------------------------------------------------------
   Bài này là bản chuyển từ portal/test/v2-tuong-phan.js của đội portal.
   Họ gửi sang sau khi chính nó bắt được của họ 45 chỗ dưới chuẩn mà mọi
   bài khác bỏ lọt, kèm một câu đáng chép lại:

       "Bảng màu chung chỉ là chung khi CẢ HAI BÊN chứng minh được. Một
        file token không chứng minh gì; một phép đo trên trang thật thì có."

   VÌ SAO KHÔNG ĐO BẢNG BIẾN
   Đo theo cặp biến CSS thì CRM ra 21/21 đạt. Nhưng biến đúng không có
   nghĩa thành phần ghép đúng cặp: nút Đăng xuất của portal lấy mực của
   TRANG trong khi nó nằm trên mặt chrome — biến đúng, cặp sai, và hỏng ở
   đúng một chế độ. Bài này đọc màu TÍNH TOÁN của từng phần tử có chữ, dò
   ngược lên tìm nền thật sự phía sau nó, rồi tính theo WCAG.

   Và nó khác bài "bảng màu" ở một chỗ nữa: chữ 10,5px VIẾT HOA đòi 4,5:1
   chứ không phải 3:1, nên ngưỡng phải theo CỠ CHỮ của từng phần tử.

       node crm/test/tuong-phan.mjs

   Cần Playwright. Máy chủ tĩnh nằm sẵn trong file này.
   ===================================================================== */
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";
import path from "node:path";
import http from "node:http";
import fs from "node:fs";

async function loadChromium() {
  for (const m of ["playwright", "playwright-core", "@playwright/test"]) {
    try { return (await import(m)).chromium; } catch (e) {}
  }
  try {
    const root = execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    return (await import(pathToFileURL(path.join(root, "playwright", "index.mjs")).href)).chromium;
  } catch (e) {}
  console.error("Cần Playwright:  npm i -D playwright   (hoặc npm i -g playwright)");
  process.exit(2);
}
const chromium = await loadChromium();
const ROOT = process.cwd();
const PORT = 8131;

const srv = http.createServer((q, s) => {
  let u = decodeURIComponent(q.url.split("?")[0]);
  if (u.endsWith("/")) u += "index.html";
  const f = path.resolve(ROOT, "." + u);
  if (!f.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { s.writeHead(404); return s.end("404"); }
    const t = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
                ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp",
                ".png": "image/png" }[path.extname(f)] || "application/octet-stream";
    s.writeHead(200, { "content-type": t, "cache-control": "no-store" });
    s.end(d);
  });
}).listen(PORT, "127.0.0.1");

/* Đo một màn: trả về danh sách chỗ dưới ngưỡng. Chạy TRONG trang. */
const DO_TRANG = () => {
  const L = c => { const s = c / 255; return s <= .03928 ? s / 12.92 : Math.pow((s + .055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => .2126 * L(r) + .7152 * L(g) + .0722 * L(b);
  /* Chrome trả color-mix() ra dạng "color(srgb 0.96 0.94 0.91)" — ba số
     trong khoảng 0–1 chứ không phải 0–255. Đọc nhầm thang là chấm một dòng
     bảng thành gần đen rồi báo hỏng một chỗ không hỏng. */
  const doc = s => {
    const n = (s.match(/-?\d+(\.\d+)?/g) || [0, 0, 0]).slice(0, 3).map(Number);
    return /^color\(/.test(s) ? n.map(v => Math.max(0, Math.min(1, v)) * 255) : n;
  };
  const alpha = s => {
    const m = s.match(/rgba?\([^)]*,\s*([\d.]+)\)/) || s.match(/\/\s*([\d.]+)\s*\)/);
    return m ? +m[1] : 1;
  };
  /* Nền THẬT SỰ phía sau: đi ngược lên tổ tiên cho tới lớp nền đục đầu tiên.
     Nền trong suốt không phải nền — chữ đặt trên nó đọc màu của lớp dưới. */
  function nen(el) {
    for (let a = el; a; a = a.parentElement) {
      const c = getComputedStyle(a).backgroundColor;
      if (c && c !== "transparent" && alpha(c) > .5) return doc(c);
    }
    return [255, 255, 255];
  }
  const out = [];
  document.querySelectorAll(".content *, .side *, .header *, .drawer *").forEach(e => {
    if (e.children.length) return;                       /* chỉ lá, để nền không bị tính hai lần */
    const t = (e.textContent || "").trim();
    if (!t || t.length < 2) return;
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || cs.display === "none") return;
    if (+cs.opacity < .3) return;                        /* phần tử cố ý mờ, không phải lỗi màu */
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const fg = doc(cs.color), bg = nen(e);
    const l1 = lum(fg), l2 = lum(bg);
    const ct = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
    const px = parseFloat(cs.fontSize), dam = +cs.fontWeight >= 600;
    const nguong = (px >= 24 || (px >= 18.66 && dam)) ? 3 : 4.5;
    if (ct < nguong) out.push({ t: t.slice(0, 26), ct: +ct.toFixed(2), nguong,
      cls: (e.getAttribute("class") || e.tagName).slice(0, 26) });
  });
  return out;
};

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
let hong = 0;
try {
  await p.goto(`http://127.0.0.1:${PORT}/crm/index.html`, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.click(".login-btn");
  await p.waitForTimeout(500);

  /* Mọi màn trong bảng NAV, không gõ cứng danh sách: thêm màn là tự quét. */
  const man = await p.evaluate(() => NAV.map(n => n.id));

  for (const che of ["light", "dark"]) {
    await p.evaluate(t => { document.documentElement.dataset.theme = t; }, che);
    await p.waitForTimeout(250);
    const xau = [];
    for (const m of man) {
      const vao = await p.evaluate(id => {
        if (typeof navAllowed === "function" && !navAllowed(id)) return false;
        go(id); return true;
      }, m);
      if (!vao) continue;
      await p.waitForTimeout(300);
      (await p.evaluate(DO_TRANG)).forEach(x =>
        xau.push(m + " · " + x.cls + ' "' + x.t + '" ' + x.ct + " < " + x.nguong));
    }
    const u = [...new Set(xau)];
    console.log("crm · " + che + ": " + (u.length ? u.length + " chỗ\n   " + u.slice(0, 12).join("\n   ") : "đạt hết"));
    hong += u.length;
  }
} finally {
  await b.close();
  srv.close();
}
console.log(hong ? "\n>>> " + hong + " chỗ dưới chuẩn" : "\n>>> tương phản đạt WCAG AA ở cả hai chế độ");
process.exit(hong ? 1 : 0);
