/* =====================================================================
   KIỂM ĐƯỜNG NÂNG CẤP — dữ liệu người dùng có sống sót khi lên bản mới không

   Đây là phép kiểm quan trọng nhất trong repo, vì thứ nó bảo vệ là thứ duy
   nhất không dựng lại được: dữ liệu khách đã nhập.

   Tình huống dựng lại đúng như thật: người dùng đã làm việc trên bản cũ, công
   ty phát hành bản mới có đổi lược đồ (nên STORE_VERSION khác đi), người dùng
   mở lại trang.

   Bản trước đây xử lý phiên bản lạ bằng cách trả null — app tưởng chưa có dữ
   liệu, seed lại bộ mẫu, rồi lần lưu đầu tiên ghi đè. Đo được 115.509 byte dữ
   liệu thật biến mất ngay lúc mở trang.

       node crm/test/upgrade.mjs
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
  console.error("Cần Playwright:  npm i -D playwright");
  process.exit(2);
}

const PORT = 8617;
const ROOT = process.cwd();
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = http.createServer((rq, rs) => {
  const f = path.resolve(ROOT, decodeURIComponent(rq.url.split("?")[0]).replace(/^\/+/, ""));
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

const chromium = await loadChromium();
const browser = await chromium.launch();

/* Một phiên làm việc thật: sửa deal, thêm lead, rồi lưu. Trả về nguyên văn
   payload để các kịch bản sau cấy lại dưới dạng "dữ liệu của bản cũ". */
async function phienLamViec(ctx) {
  const p = await ctx.newPage();
  await p.goto(B + "/crm/index.html");
  await p.evaluate(() => { try { window.STORE_READY = false; localStorage.clear(); } catch (e) {} });
  await p.reload(); await p.waitForTimeout(600);
  await p.click(".login-btn"); await p.waitForTimeout(350);
  const raw = await p.evaluate(() => {
    DB.opps[0].name = "DEAL THẬT CỦA KHÁCH";
    DB.opps[0].amount = 999000;
    DB.leads.unshift({ id: "l9999", name: "LEAD THẬT", company: "Khách thật", status: "new",
                       source: "other", owner: ME, created: TODAY, rights: {} });
    saveNow();
    return localStorage.getItem(STORE_KEY);
  });
  await p.close();
  return raw;
}

/* Mở app với một payload được cấy sẵn TRƯỚC khi script của app chạy.
   Bắt buộc phải cấy qua addInitScript: nếu mở app rồi mới ghi localStorage thì
   handler pagehide sẽ lưu đè bản hiện tại lên, và phép kiểm đo nhầm. */
async function moBanMoi(ctx, payload) {
  const p = await ctx.newPage();
  await p.addInitScript(d => { localStorage.setItem("haustek.crm.v1", d); }, payload);
  await p.goto(B + "/crm/index.html");
  await p.waitForTimeout(900);
  return p;
}

const doc = p => p.evaluate(() => {
  const baks = Object.keys(localStorage).filter(k => k.indexOf("haustek.crm.bak.") === 0);
  const bak = baks.length ? localStorage.getItem(baks[0]) : null;
  return {
    baks, bakBytes: bak ? bak.length : 0,
    bakCoLeadThat: bak ? bak.indexOf("LEAD TH") >= 0 : false,
    bakCoDealThat: bak ? bak.indexOf("DEAL TH") >= 0 : false,
    rescued: STORE_RESCUED, locked: STORE_LOCKED,
    coBang: !!document.querySelector(".rescue"),
    bangDo: !!document.querySelector(".rescue-bad"),
    bangChu: (document.querySelector(".rescue") || {}).innerText || ""
  };
});

console.log("— lên bản mới có đổi lược đồ —");
{
  const ctx = await browser.newContext();
  const payload = await phienLamViec(ctx);
  const cu = JSON.parse(payload); cu.v = "0.9.0";
  const p = await moBanMoi(ctx, JSON.stringify(cu));
  const d = await doc(p);

  F("dữ liệu bản cũ được cất sang khoá sao lưu", d.baks.length === 1, d.baks.join());
  F("cất nguyên vẹn từng byte", d.bakBytes === payload.length, d.bakBytes + " vs " + payload.length);
  F("lead người dùng nhập vẫn còn trong bản sao", d.bakCoLeadThat);
  F("deal người dùng sửa vẫn còn trong bản sao", d.bakCoDealThat);
  F("app ghi nhận đã cứu được, kèm phiên bản cũ",
    d.rescued && d.rescued.v === "0.9.0", JSON.stringify(d.rescued));
  F("đường ghi KHÔNG bị khoá vì đã cứu xong", d.locked === false, d.locked);
  F("người dùng thấy băng báo ngay màn hình đầu tiên", d.coBang);
  F("băng nói rõ phiên bản cũ là bản nào", d.bangChu.indexOf("0.9.0") >= 0, d.bangChu.slice(0, 60));

  /* làm việc tiếp rồi mới tải bản cũ về — bản sao phải sống qua các lần lưu */
  await p.click(".login-btn"); await p.waitForTimeout(300);
  await p.evaluate(() => { DB.leads[0].name = "sửa sau khi nâng cấp"; saveNow(); });
  await p.waitForTimeout(500);
  const d2 = await doc(p);
  F("bản sao vẫn nguyên sau khi app lưu tiếp", d2.bakBytes === payload.length, d2.bakBytes);
  await p.close(); await ctx.close();
}

console.log("\n— mở lại nhiều lần thì không đẻ ra vô số bản sao —");
{
  const ctx = await browser.newContext();
  const payload = await phienLamViec(ctx);
  const cu = JSON.parse(payload); cu.v = "0.9.0";
  let n = 0;
  for (let i = 0; i < 5; i++) {
    const p = await moBanMoi(ctx, JSON.stringify(cu));
    n = (await doc(p)).baks.length;
    await p.close();
  }
  F("năm lần mở, số bản sao vẫn bị chặn trần", n <= 3, n);
  await ctx.close();
}

console.log("\n— JSON hỏng (bị cắt giữa chừng) cũng phải cứu —");
{
  const ctx = await browser.newContext();
  const payload = await phienLamViec(ctx);
  const p = await moBanMoi(ctx, payload.slice(0, Math.floor(payload.length * 0.6)));
  const d = await doc(p);
  F("payload hỏng vẫn được cất đi thay vì vứt", d.baks.length === 1, d.baks.join());
  F("cất dưới nhãn 'không rõ phiên bản'", d.baks[0] && d.baks[0].indexOf("khong-ro") >= 0, d.baks[0]);
  F("app vẫn chạy được, không trắng màn hình",
    await p.evaluate(() => !!document.querySelector(".login-btn") || !!document.querySelector("#nav")));
  await p.close(); await ctx.close();
}

console.log("\n— không cất được thì phải KHOÁ đường ghi, không nuốt dữ liệu —");
{
  const ctx = await browser.newContext();
  const payload = await phienLamViec(ctx);
  const cu = JSON.parse(payload); cu.v = "0.9.0";
  const p = await ctx.newPage();
  /* chặn mọi lượt ghi khoá sao lưu để giả lập hết dung lượng */
  await p.addInitScript(d => {
    localStorage.setItem("haustek.crm.v1", d);
    const goc = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (String(k).indexOf("haustek.crm.bak.") === 0) throw new DOMException("QuotaExceededError");
      return goc.call(this, k, v);
    };
  }, JSON.stringify(cu));
  await p.goto(B + "/crm/index.html"); await p.waitForTimeout(900);
  const d = await doc(p);
  F("không cất được thì đường ghi bị khoá", d.locked === true, d.locked);
  F("băng đỏ cảnh báo hiện ra", d.bangDo === true);
  const giuNguyen = await p.evaluate(() => {
    const truoc = localStorage.getItem("haustek.crm.v1");
    saveNow();
    return localStorage.getItem("haustek.crm.v1") === truoc;
  });
  F("bị khoá thì saveNow() KHÔNG ghi đè dữ liệu cũ", giuNguyen);
  await p.close(); await ctx.close();
}

console.log("\n— cùng phiên bản thì không đụng gì cả —");
{
  const ctx = await browser.newContext();
  const payload = await phienLamViec(ctx);
  const p = await moBanMoi(ctx, payload);
  const d = await doc(p);
  F("không tạo bản sao thừa", d.baks.length === 0, d.baks.join());
  F("không hiện băng", d.coBang === false);
  F("dữ liệu nạp lên bình thường",
    await p.evaluate(() => DB.leads.some(l => l.id === "l9999")));
  await p.close(); await ctx.close();
}

await browser.close();
srv.close();
console.log(FAILED ? "\n" + FAILED + " phép kiểm HỎNG" : "\n19 đạt · 0 hỏng");
process.exit(FAILED ? 1 : 0);
