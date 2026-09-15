/* =====================================================================
   KIỂM ĐƯỜNG NÂNG CẤP — sổ portal có sống sót khi lên bản mới không

   Đây là phép kiểm bảo vệ thứ duy nhất trong portal không dựng lại được:
   tỷ lệ chia, khoản tạm ứng và các kỳ đã duyệt. Danh mục và doanh thu thì
   sinh lại y hệt từ seed; ba thứ trên thì không — mất là mất tiền thật.

   Tình huống dựng lại đúng như thật: người vận hành đã làm việc trên bản
   cũ, Haustek đẩy bản mới có đổi lược đồ (CFG.VERSION khác đi), người vận
   hành mở lại trang.

   Bản trước đây xử lý phiên bản lạ bằng cách trả null — lõi tưởng máy
   trắng, seed lại, rồi lần store.save() đầu tiên ghi đè.

       node portal/test/upgrade.js

   Cần Playwright. Máy chủ tĩnh nằm sẵn trong file này, phải chạy qua HTTP:
   Chromium coi mỗi file:// là một origin mờ riêng nên localStorage không
   giữ được qua các lần mở trang, và mọi phép kiểm ở đây sẽ xanh vô nghĩa.
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

const PORT = 8623;
const ROOT = path.resolve(process.cwd(), "portal");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
               ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
               ".ico": "image/x-icon", ".webp": "image/webp", ".jpg": "image/jpeg" };
const srv = http.createServer((rq, rs) => {
  let u = decodeURIComponent(rq.url.split("?")[0]);
  if (u.endsWith("/")) u += "index.html";
  const f = path.resolve(ROOT, u.replace(/^\/+/, ""));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
  rs.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(f).pipe(rs);
});
await new Promise(r => srv.listen(PORT, "127.0.0.1", r));
const B = "http://127.0.0.1:" + PORT;

let FAILED = 0;
const F = (n, v, got) => {
  if (v) console.log("  ok    " + n);
  else { FAILED++; console.log("  LỖI  " + n + (got !== undefined ? "  → " + got : "")); }
};

const KEY = "haustek.portal.v1";
const BAK = "haustek.portal.bak.";
const chromium = await loadChromium();
const browser = await chromium.launch();

/* Một phiên vận hành thật: đặt một tỷ lệ chia, ghi một khoản tạm ứng, duyệt
   một kỳ. Đúng ba thứ không dựng lại được. Trả về nguyên văn payload để các
   kịch bản sau cấy lại dưới dạng "sổ của bản cũ". */
async function phienVanHanh(ctx) {
  const p = await ctx.newPage();
  await p.goto(B + "/intranet.html");
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForFunction(() => window.HAUSTEK && window.HAUSTEK.admin, null, { timeout: 20000 });
  const raw = await p.evaluate(() => {
    const A = HAUSTEK.admin;
    const pk = Object.keys(A.state().advances)[0] || "A:0";
    /* rates.add từ chối kỳ đã duyệt — lấy kỳ còn mở gần nhất */
    const mo = A.periods.filter(x => !A.isApproved(x.k)).pop();
    A.rates.add(pk, 0.81, mo.k, "kiem-thu", "SỔ THẬT CỦA VẬN HÀNH");
    A.advances.set(pk, 777777, "SỔ THẬT CỦA VẬN HÀNH");
    return { raw: localStorage.getItem("haustek.portal.v1"), pk, per: mo.k };
  });
  await p.close();
  return raw;
}

/* Cấy payload TRƯỚC khi script của app chạy. Bắt buộc: lõi gọi store.load()
   ngay lúc nạp file, nên ghi localStorage sau khi trang mở là đã muộn. */
async function moBanMoi(ctx, payload, initExtra) {
  const p = await ctx.newPage();
  await p.addInitScript(({ d, extra }) => {
    localStorage.setItem("haustek.portal.v1", d);
    if (extra) eval(extra);
  }, { d: payload, extra: initExtra || null });
  await p.goto(B + "/intranet.html");
  await p.waitForFunction(() => window.HAUSTEK && window.HAUSTEK.storage, null, { timeout: 20000 });
  await p.waitForTimeout(400);
  return p;
}

const doc = p => p.evaluate(() => {
  const baks = Object.keys(localStorage).filter(k => k.indexOf("haustek.portal.bak.") === 0).sort();
  const bak = baks.length ? localStorage.getItem(baks[baks.length - 1]) : null;
  const bar = document.getElementById("rescueBar");
  return {
    baks, bakBytes: bak ? bak.length : 0,
    bakCoSoThat: bak ? bak.indexOf("SỔ THẬT CỦA VẬN HÀNH") >= 0 : false,
    rescued: HAUSTEK.storage.rescued(),
    locked: HAUSTEK.storage.locked(),
    backups: HAUSTEK.storage.backups(),
    coBang: !!(bar && bar.innerText.trim()),
    bangChu: bar ? bar.innerText : "",
    coNutTai: !!document.getElementById("rescGet")
  };
});

console.log("— lên bản mới có đổi lược đồ —");
{
  const ctx = await browser.newContext();
  const { raw } = await phienVanHanh(ctx);
  const cu = JSON.parse(raw); cu.v = "0.9.0";
  const p = await moBanMoi(ctx, JSON.stringify(cu));
  const d = await doc(p);

  F("sổ bản cũ được cất sang khoá sao lưu", d.baks.length === 1, d.baks.join());
  F("cất nguyên vẹn từng byte", d.bakBytes === JSON.stringify(cu).length,
    d.bakBytes + " vs " + JSON.stringify(cu).length);
  F("khoản tạm ứng người vận hành ghi vẫn còn trong bản sao", d.bakCoSoThat);
  F("lõi ghi nhận đã cứu được, kèm phiên bản cũ",
    d.rescued && d.rescued.v === "0.9.0", JSON.stringify(d.rescued));
  F("đường ghi KHÔNG bị khoá vì đã cứu xong", d.locked === false, d.locked);
  F("người vận hành THẤY băng báo, không phải sổ trắng im lặng", d.coBang, d.bangChu.slice(0, 50));
  F("băng nói rõ phiên bản cũ là bản nào", d.bangChu.indexOf("0.9.0") >= 0, d.bangChu.slice(0, 80));
  F("băng có nút tải sổ cũ về", d.coNutTai);
  F("storage.backups() trả đúng khoá vừa cất",
    d.backups.length === 1 && d.backups[0].indexOf(BAK + "0.9.0") === 0, d.backups.join());
  F("readBackup đọc lại đúng nguyên văn",
    await p.evaluate(() => HAUSTEK.storage.readBackup(HAUSTEK.storage.backups()[0]).length) === d.bakBytes);

  /* băng phải theo người dùng qua MỌI màn hình, không nấp trong một tab */
  const khapNoi = await p.evaluate(async () => {
    const ids = HAUSTEK.screens.map(s => s.id);
    const thieu = [];
    for (const id of ids) {
      location.hash = "#" + id;
      await new Promise(r => setTimeout(r, 90));
      const bar = document.getElementById("rescueBar");
      if (!bar || !bar.innerText.trim()) thieu.push(id);
    }
    return { n: ids.length, thieu };
  });
  F("băng hiện ở cả " + khapNoi.n + " màn hình", khapNoi.thieu.length === 0, khapNoi.thieu.join());

  /* làm việc tiếp rồi mới tải bản cũ về — bản sao phải sống qua các lần lưu */
  await p.evaluate(() => HAUSTEK.admin.advances.set("A:1", 1, "sau nâng cấp"));
  await p.waitForTimeout(300);
  const d2 = await doc(p);
  F("bản sao vẫn nguyên sau khi lõi lưu tiếp", d2.bakBytes === d.bakBytes, d2.bakBytes);
  await p.close(); await ctx.close();
}

console.log("\n— bấm 'Để sau' chỉ giấu băng, KHÔNG được xoá bản sao —");
{
  const ctx = await browser.newContext();
  const { raw } = await phienVanHanh(ctx);
  const cu = JSON.parse(raw); cu.v = "0.9.0";
  const p = await moBanMoi(ctx, JSON.stringify(cu));
  await p.click("#rescLater"); await p.waitForTimeout(250);
  const d = await doc(p);
  F("băng biến mất khỏi màn hình", d.coBang === false, d.bangChu.slice(0, 40));
  F("khoá sao lưu VẪN CÒN trên máy", d.baks.length === 1, d.baks.join());
  F("nội dung sao lưu không suy suyển", d.bakCoSoThat);
  await p.close(); await ctx.close();
}

console.log("\n— mở lại nhiều lần thì không đẻ ra vô số bản sao —");
{
  const ctx = await browser.newContext();
  const { raw } = await phienVanHanh(ctx);
  const cu = JSON.parse(raw); cu.v = "0.9.0";
  let n = 0;
  for (let i = 0; i < 5; i++) {
    const p = await moBanMoi(ctx, JSON.stringify(cu));
    n = (await doc(p)).baks.length;
    await p.close();
  }
  F("năm lần mở, số bản sao vẫn bị chặn trần ở 3", n <= 3, n);
  await ctx.close();
}

console.log("\n— JSON hỏng (bị cắt giữa chừng) cũng phải cứu —");
{
  const ctx = await browser.newContext();
  const { raw } = await phienVanHanh(ctx);
  const p = await moBanMoi(ctx, raw.slice(0, Math.floor(raw.length * 0.6)));
  const d = await doc(p);
  F("payload hỏng vẫn được cất đi thay vì vứt", d.baks.length === 1, d.baks.join());
  F("cất dưới nhãn 'không rõ phiên bản'",
    !!d.baks[0] && d.baks[0].indexOf("khong-ro") >= 0, d.baks[0]);
  F("portal vẫn chạy được, không trắng màn hình",
    await p.evaluate(() => document.getElementById("screen").innerText.length > 200));
  await p.close(); await ctx.close();
}

console.log("\n— không cất được thì phải KHOÁ đường ghi, không nuốt sổ —");
{
  const ctx = await browser.newContext();
  const { raw } = await phienVanHanh(ctx);
  const cu = JSON.parse(raw); cu.v = "0.9.0";
  /* chặn mọi lượt ghi khoá sao lưu để giả lập hết dung lượng trình duyệt */
  const p = await moBanMoi(ctx, JSON.stringify(cu), `
    const goc = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (String(k).indexOf("haustek.portal.bak.") === 0) throw new DOMException("QuotaExceededError");
      return goc.call(this, k, v);
    };`);
  const d = await doc(p);
  F("không cất được thì đường ghi bị khoá", d.locked === true, d.locked);
  F("băng đỏ cảnh báo hiện ra", d.coBang && /KHÔNG lưu được/.test(d.bangChu), d.bangChu.slice(0, 60));
  const giuNguyen = await p.evaluate(() => {
    const truoc = localStorage.getItem("haustek.portal.v1");
    HAUSTEK.admin.advances.set("A:1", 5, "phải KHÔNG ghi được");
    return localStorage.getItem("haustek.portal.v1") === truoc;
  });
  F("bị khoá thì mọi lượt ghi KHÔNG đè lên sổ cũ", giuNguyen);
  await p.close(); await ctx.close();
}

console.log("\n— cùng phiên bản thì không đụng gì cả —");
{
  const ctx = await browser.newContext();
  const { raw, pk } = await phienVanHanh(ctx);
  const p = await moBanMoi(ctx, raw);
  const d = await doc(p);
  F("không tạo bản sao thừa", d.baks.length === 0, d.baks.join());
  F("không hiện băng", d.coBang === false, d.bangChu.slice(0, 40));
  F("tỷ lệ chia người vận hành đặt vẫn còn",
    await p.evaluate(k => HAUSTEK.admin.state().rates.some(r => r.partyKey === k && r.rate === 0.81), pk));
  F("khoản tạm ứng vẫn còn đúng số",
    await p.evaluate(k => (HAUSTEK.admin.state().advances[k] || {}).opening === 777777, pk));
  await p.close(); await ctx.close();
}

await browser.close();
srv.close();
console.log(FAILED ? "\n" + FAILED + " phép kiểm HỎNG" : "\n25 đạt · 0 hỏng");
process.exit(FAILED ? 1 : 0);
