/* =====================================================================
   KIỂM TRA BÀN GIAO CRM → PORTAL — hai app, một trình duyệt
   ---------------------------------------------------------------------
   Phải chạy qua HTTP chứ không mở bằng file://. Chromium coi mỗi file://
   là một origin mờ riêng, nên hai app sẽ không thấy localStorage của nhau
   và phép kiểm nào cũng xanh một cách vô nghĩa. File này tự dựng một máy
   chủ tĩnh ở gốc repo rồi mở cả hai trang trên cùng origin — đúng hình
   dạng lúc deploy thật, khi Vercel phục vụ /crm và /portal cùng tên miền.

       node crm/test/handoff-e2e.mjs

   Cần Playwright (npm i -D playwright). Máy chủ tĩnh nằm sẵn trong file này.
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

const PORT = 8129;
const B = "http://127.0.0.1:" + PORT;
let FAILED = 0;
const F = (n, v) => { if (!v) FAILED++; console.log((v ? "  ok  " : "  LỖI") + "  " + n); };

/* Máy chủ tĩnh tí hon, đủ cho hai trang HTML + vài file js/css. Tự viết thay vì
   gọi npx http-server: bớt một phụ thuộc, và không phải giết tiến trình con —
   giết nhầm process group là cách dễ nhất để test tự tắt chính nó. */
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
               ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
               ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" };
const ROOT = process.cwd();
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
      const file = path.resolve(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); return res.end("not found");
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
                           "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(PORT, "127.0.0.1", () => resolve(srv));
  });
}

const chromium = await loadChromium();
const srv = await serve();
try {
  const errs = [];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });

  /* --- CRM: gắn ba deal, trong đó một cái trỏ vào party không tồn tại --- */
  const crm = await ctx.newPage();
  crm.on("pageerror", e => errs.push("CRM " + e.message));
  await crm.goto(B + "/crm/index.html");
  await crm.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await crm.reload(); await crm.waitForTimeout(600);
  await crm.click(".login-btn"); await crm.waitForTimeout(400);
  const deals = await crm.evaluate(() => {
    const r = handoffRows().filter(x => x.terms);
    HANDOFF_BIND[r[0].dealId] = "L:0";
    HANDOFF_BIND[r[1].dealId] = "A:0";
    HANDOFF_BIND[r[2].dealId] = "L:9999";
    saveNow();
    return r.slice(0, 2).map(x => ({ id: x.dealId, share: x.terms.artistSharePct / 100, adv: x.terms.totalAdvanceUSD }));
  });
  F("CRM ghi khoá bàn giao", await crm.evaluate(() => !!localStorage.getItem("haustek.crm.handoff.v1")));
  F("CRM không bao giờ đụng khoá portal", await crm.evaluate(() => localStorage.getItem("haustek.portal.v1") === null));

  /* --- Intranet: cùng origin nên đọc được --- */
  const intr = await ctx.newPage();
  intr.on("pageerror", e => errs.push("PORTAL " + e.message));
  await intr.goto(B + "/portal/intranet.html");
  await intr.waitForFunction(() => window.HAUSTEK && window.HAUSTEK.admin && window.HAUSTEK.admin.rates, null, { timeout: 60000 });
  F("cùng origin → intranet đọc được bản tin", await intr.evaluate(() => !!localStorage.getItem("haustek.crm.handoff.v1")));
  F("màn hình tự đăng ký vào khung", await intr.evaluate(() => HAUSTEK.screens.some(s => s.id === "crm-handoff")));

  await intr.evaluate(() => { location.hash = "#crm-handoff"; });
  await intr.waitForTimeout(900);
  const periods = await intr.evaluate(() => [...(document.getElementById("chPeriod")?.options || [])].map(o => o.value));
  F("chỉ mời kỳ CÒN MỞ (lõi từ chối kỳ đã chốt)",
    periods.length > 0 && await intr.evaluate(p => p.every(k => !HAUSTEK.admin.isApproved(k)), periods));
  F("party không có thật bị chặn, không cho ghi",
    await intr.evaluate(() => [...document.querySelectorAll(".tb tbody tr")]
      .some(tr => /không có thật/.test(tr.textContent) && !tr.querySelector("[data-write]"))));
  F("deal chưa gắn partyKey thì không cho ghi",
    await intr.evaluate(() => [...document.querySelectorAll(".tb tbody tr")]
      .some(tr => /chưa gắn/.test(tr.textContent) && !tr.querySelector("[data-write]"))));

  /* --- Ghi một deal vào sổ --- */
  await intr.click('[data-write="0"]'); await intr.waitForTimeout(700);
  const after = await intr.evaluate(() => {
    const A = HAUSTEK.admin, sch = A.rates.scheduleFor("L:0");
    return { last: sch[sch.length - 1], adv: A.advances.list().find(a => a.partyKey === "L:0"),
             audit: A.audit.list(8).filter(x => x.action === "crm-handoff").length };
  });
  F("tỷ lệ vào sổ đúng giá trị", Math.abs(after.last.rate - deals[0].share) < 1e-9);
  F("kỳ hiệu lực đúng kỳ đã chọn", after.last.from === periods[0]);
  F("ghi chú mang dấu CRM <mã deal>", after.last.note.startsWith("CRM " + deals[0].id + " "));
  F("tạm ứng vào sổ đúng số", !!after.adv && after.adv.opening === deals[0].adv);
  F("portal có ghi nhật ký", after.audit > 0);
  F("dòng chuyển sang trạng thái đã ghi",
    await intr.evaluate(() => document.querySelector(".tb tbody tr .ch-st").textContent.trim() === "đã ghi"));

  /* --- Bất biến: nguồn sự thật là SỔ, không phải biến trong RAM --- */
  await intr.reload();
  await intr.waitForFunction(() => window.HAUSTEK && window.HAUSTEK.admin && window.HAUSTEK.admin.rates, null, { timeout: 60000 });
  await intr.evaluate(() => { location.hash = "#crm-handoff"; });
  await intr.waitForTimeout(900);
  F("tải lại intranet vẫn nhớ deal đã ghi",
    await intr.evaluate(() => document.querySelector(".tb tbody tr .ch-st").textContent.trim() === "đã ghi"));
  F("không ghi trùng lần hai",
    await intr.evaluate(() => HAUSTEK.admin.rates.scheduleFor("L:0").filter(r => /^CRM /.test(r.note || "")).length === 1));

  /* --- Chốt chặn: advances.set() THAY THẾ chứ không cộng dồn --- */
  await intr.evaluate(() => HAUSTEK.admin.advances.set("A:0", 99999, "khoản cũ không phải từ CRM"));
  await intr.evaluate(() => { location.hash = "#overview"; }); await intr.waitForTimeout(300);
  await intr.evaluate(() => { location.hash = "#crm-handoff"; }); await intr.waitForTimeout(800);
  const guard = await intr.evaluate(async () => {
    const btn = document.querySelector("[data-write]"); if (!btn) return "";
    btn.click(); await new Promise(r => setTimeout(r, 500));
    const m = document.querySelector(".modal"); const txt = m ? m.textContent : "";
    const cancel = [...(m ? m.querySelectorAll("button") : [])].find(x => /Hu[ỷỵ]|Cancel/i.test(x.textContent));
    if (cancel) cancel.click();
    return txt;
  });
  F("cảnh báo trước khi đè khoản tạm ứng đang có", /THAY TH[ẾE]/i.test(guard));
  F("bấm huỷ thì sổ không đổi",
    await intr.evaluate(() => HAUSTEK.admin.advances.list().find(a => a.partyKey === "A:0").opening === 99999));

  if (errs.length) FAILED++;
  console.log("\nLỗi JS: " + errs.length);
  errs.slice(0, 5).forEach(e => console.log("  " + e));
  await b.close();
} finally {
  srv.close();
}
console.log(FAILED ? "\n" + FAILED + " phép kiểm HỎNG" : "\n17 đạt · 0 hỏng");
process.exit(FAILED ? 1 : 0);
