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

/* Phép kiểm này cần CẢ HAI nửa: CRM ở đây, và màn hình Bàn giao bên portal.
   Trên nhánh chỉ có CRM thì nửa portal không tồn tại — khi đó nói thẳng ra là
   BỎ QUA, đừng báo hỏng. Hỏng nghĩa là "có lỗi phải sửa"; ở đây chỉ là "nửa kia
   không nằm trên nhánh này", hai chuyện khác hẳn nhau.
   Khi tách repo, đây chính là phép kiểm phải chuyển sang repo nào giữ cả hai. */
/* HAI TÌNH HUỐNG RẤT KHÁC NHAU, ĐỪNG GỘP LÀM MỘT.

   (1) Nhánh KHÔNG CÓ portal. Nửa kia không nằm ở đây — bỏ qua là đúng.
   (2) Nhánh CÓ portal, nhưng portal đã đổi hình và những file bài này trỏ
       tới không còn. Đó KHÔNG phải "nửa kia vắng mặt", đó là bài kiểm đã
       lạc hậu — và bỏ qua nó là báo XANH trong khi không kiểm gì.

   Bản trước gộp cả hai vào một phép đếm file thiếu. Đo được: trộn portal v2
   vào main thì v1 (screens/, intranet.html) bị gỡ, bài này in "BỎ QUA" rồi
   thoát 0 — cổng kiểm thử xanh trong khi đường bàn giao CRM↔portal không
   còn được kiểm một dòng nào. Đây là lần thứ ba cùng một kiểu lỗi trong dự
   án này: xanh vì một lý do không liên quan đến thứ định kiểm. */
const CO_PORTAL = fs.existsSync(path.resolve(ROOT, "portal/haustek-core.js"));
if (!CO_PORTAL) {
  console.log("BỎ QUA — nhánh này không có portal, phép kiểm cần cả hai app trên cùng một cây nguồn.");
  console.log("   Chạy nó trên nhánh có cả hai nửa.");
  process.exit(0);
}
const CAN_PORTAL = ["portal/screens/crm-handoff.js", "portal/intranet.html"];
const MISSING = CAN_PORTAL.filter(f => !fs.existsSync(path.resolve(ROOT, f)));
if (MISSING.length) {
  console.error("HỎNG — portal CÓ mặt nhưng đã đổi hình, bài kiểm này đang trỏ vào chỗ không còn:");
  MISSING.forEach(f => console.error("   thiếu: " + f));
  console.error("\nĐường bàn giao CRM→portal nay đi qua màn Thương vụ (A.thuongVu), không còn");
  console.error("qua portal/screens/crm-handoff.js. Sửa bài kiểm trỏ sang đường mới —");
  console.error("đừng nới điều kiện bỏ qua, vì như thế là báo xanh mà không kiểm gì.");
  process.exit(1);
}
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
    return r.slice(0, 2).map(x => ({ id: x.dealId, name: x.dealName,
      share: x.terms.artistSharePct / 100, adv: x.terms.totalAdvanceUSD }));
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

  /* Bảng sắp theo ngày đóng nên chỉ số dòng không đoán được — tìm theo tên. */
  const rowIdx = async (name, attr) => intr.evaluate(([nm, at]) => {
    const rows = [...document.querySelectorAll(".tb tbody tr")];
    const i = rows.findIndex(tr => tr.textContent.includes(nm) && tr.querySelector("[" + at + "]"));
    return i < 0 ? null : rows[i].querySelector("[" + at + "]").getAttribute(at);
  }, [name, attr]);

  /* --- CEO duyệt TRƯỚC, ghi sổ SAU --- */
  F("CEO chưa duyệt thì không có nút ghi sổ",
    await intr.evaluate(() => [...document.querySelectorAll(".tb tbody tr")]
      .some(tr => /chờ CEO duyệt/.test(tr.textContent) && !tr.querySelector("[data-write]"))));
  const beforeLedger = await intr.evaluate(() =>
    HAUSTEK.admin.rates.scheduleFor("L:0").filter(r => /^CRM /.test(r.note || "")).length);
  F("sổ chưa bị ghi gì khi CEO chưa gật", beforeLedger === 0);

  const iYes = await rowIdx(deals[0].name, "data-yes");
  F("tìm được dòng deal cần CEO duyệt", iYes !== null);
  await intr.click('[data-yes="' + iYes + '"]'); await intr.waitForTimeout(600);
  F("CEO duyệt ghi vào khoá chiều về",
    await intr.evaluate(() => {
      const j = JSON.parse(localStorage.getItem("haustek.portal.contracts.v1") || "null");
      return !!j && j.deals.some(d => d.status === "ceo_approved");
    }));
  F("CEO duyệt xong mới hiện nút ghi sổ",
    await intr.evaluate(() => !!document.querySelector('[data-write]')));

  const iWrite = await rowIdx(deals[0].name, "data-write");
  await intr.click('[data-write="' + iWrite + '"]'); await intr.waitForTimeout(700);
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
  F("ghi sổ xong chuyển sang Legal đang soạn",
    await intr.evaluate(() => {
      const j = JSON.parse(localStorage.getItem("haustek.portal.contracts.v1"));
      return j.deals.some(d => d.status === "drafting");
    }));

  /* --- Bất biến: nguồn sự thật là SỔ, không phải biến trong RAM --- */
  await intr.reload();
  await intr.waitForFunction(() => window.HAUSTEK && window.HAUSTEK.admin && window.HAUSTEK.admin.rates, null, { timeout: 60000 });
  await intr.evaluate(() => { location.hash = "#crm-handoff"; });
  await intr.waitForTimeout(900);
  F("tải lại intranet vẫn nhớ deal đã ghi",
    await intr.evaluate(nm => [...document.querySelectorAll(".tb tbody tr")]
      .some(tr => tr.textContent.includes(nm) && /đã ghi sổ/.test(tr.textContent)), deals[0].name));
  F("không ghi trùng lần hai",
    await intr.evaluate(() => HAUSTEK.admin.rates.scheduleFor("L:0").filter(r => /^CRM /.test(r.note || "")).length === 1));

  /* --- Legal đẩy hợp đồng tới "sẵn sàng" --- */
  const iFlow = await rowIdx(deals[0].name, "data-flow");
  await intr.selectOption('[data-flow="' + iFlow + '"]', "ready"); await intr.waitForTimeout(600);
  F("legal đổi được trạng thái hợp đồng",
    await intr.evaluate(() => {
      const j = JSON.parse(localStorage.getItem("haustek.portal.contracts.v1"));
      return j.deals.some(d => d.status === "ready");
    }));

  /* --- Đường dẫn hợp đồng: legal gắn bên portal, A&R bấm từ CRM --- */
  const iLink = await rowIdx(deals[0].name, "data-link");
  F("dòng đã ghi sổ có nút gắn link", iLink !== null);
  await intr.evaluate(([id, u]) => {
    /* gọi thẳng backSet thay vì lái modal — phép kiểm ở đây là hợp đồng dữ liệu
       giữa hai app, không phải thao tác chuột trên hộp thoại */
    const j = JSON.parse(localStorage.getItem("haustek.portal.contracts.v1"));
    const i = j.deals.findIndex(d => d.dealId === id);
    j.deals[i].url = u;
    localStorage.setItem("haustek.portal.contracts.v1", JSON.stringify(j));
  }, [deals[0].id, "https://haustek-group.com/portal/contracts/" + deals[0].id]);

  /* --- CHIỀU NGƯỢC: A&R mở CRM và thấy deal của mình đi tới đâu --- */
  await crm.reload(); await crm.waitForTimeout(900);
  const back = await crm.evaluate(id => {
    const o = DB.opps.find(x => x.id === id);
    return { stage: o.stage, contract: o.contract };
  }, deals[0].id);
  F("CRM nhận trạng thái hợp đồng từ portal (" + (back.contract || {}).status + ")",
    !!back.contract && back.contract.status === "ready");
  F("CRM tự chuyển giai đoạn theo portal (" + back.stage + ")", back.stage === "signature");
  F("CRM KHÔNG ghi vào khoá chiều về",
    await crm.evaluate(() => {
      const before = localStorage.getItem("haustek.portal.contracts.v1");
      go("opps"); saveNow();
      return localStorage.getItem("haustek.portal.contracts.v1") === before;
    }));
  F("CRM đọc được đường dẫn hợp đồng",
    await crm.evaluate(id => {
      const o = DB.opps.find(x => x.id === id);
      return !!o.contract && /haustek-group\.com\/portal\/contracts\//.test(o.contract.url || "");
    }, deals[0].id));
  F("nút Mở hợp đồng hiện trên trang chi tiết",
    await crm.evaluate(id => { openOpp(id);
      const a = document.querySelector(".ct-link");
      return !!a && a.getAttribute("rel") === "noopener noreferrer" && a.target === "_blank";
    }, deals[0].id));
  /* URL độc do phía khác ghi vào — CRM phải chặn, không phải hiển thị */
  const BAD = await crm.evaluate(() => {
    const T = String.fromCharCode(9);
    return ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "  javascript:alert(1)",
            "java" + T + "script:alert(1)", "data:text/html,<script>alert(1)</script>",
            "vbscript:msgbox(1)"].map(u => safeUrl(u));
  });
  F("mọi URL độc bị chặn (" + BAD.filter(x => x === null).length + "/6)",
    BAD.every(x => x === null));
  F("đường dẫn tương đối vẫn giải đúng",
    await crm.evaluate(() => (safeUrl("/portal/contracts/o164") || "").indexOf("/portal/contracts/o164") > 0));
  F("URL độc không lọt vào DOM",
    await crm.evaluate(id => {
      const o = DB.opps.find(x => x.id === id);
      o.contract = {status:"ready", at:"x", note:"", by:"portal", url:safeUrl("javascript:alert(1)")};
      openOpp(id);
      return !document.querySelector(".ct-link") &&
             !/javascript:/i.test(document.getElementById("view").innerHTML);
    }, deals[0].id));

  F("giai đoạn portal cầm lái thì CRM không đẩy tiếp được",
    await crm.evaluate(id => {
      const o = DB.opps.find(x => x.id === id);
      const s0 = o.stage; advance(id, 1); return DB.opps.find(x => x.id === id).stage === s0;
    }, deals[0].id));

  /* --- Chốt chặn: advances.set() THAY THẾ chứ không cộng dồn --- */
  await intr.evaluate(() => HAUSTEK.admin.advances.set("A:0", 99999, "khoản cũ không phải từ CRM"));
  /* Cho deal thứ hai qua cửa CEO để có nút ghi sổ mà thử chốt chặn. Truyền id
     thẳng qua tham số — gán vào window thì mất sạch ở lần reload phía trên. */
  await intr.evaluate(id => {
    const j = JSON.parse(localStorage.getItem("haustek.portal.contracts.v1"));
    j.deals.push({dealId: id, status: "ceo_approved", note: "", by: "portal", updatedAt: "2026-09-15T00:00:00Z"});
    localStorage.setItem("haustek.portal.contracts.v1", JSON.stringify(j));
  }, deals[1].id);
  await intr.evaluate(() => { location.hash = "#overview"; }); await intr.waitForTimeout(300);
  await intr.evaluate(() => { location.hash = "#crm-handoff"; }); await intr.waitForTimeout(800);
  const iGuard = await rowIdx(deals[1].name, "data-write");
  F("deal thứ hai qua cửa CEO, hiện nút ghi sổ", iGuard !== null);
  const guard = await intr.evaluate(async (i) => {
    const btn = document.querySelector('[data-write="' + i + '"]'); if (!btn) return "";
    btn.click(); await new Promise(r => setTimeout(r, 500));
    const m = document.querySelector(".modal"); const txt = m ? m.textContent : "";
    const cancel = [...(m ? m.querySelectorAll("button") : [])].find(x => /Hu[ỷỵ]|Cancel/i.test(x.textContent));
    if (cancel) cancel.click();
    return txt;
  }, iGuard);
  F("cảnh báo trước khi đè khoản tạm ứng đang có", /THAY TH[ẾE]/i.test(guard));
  F("bấm huỷ thì sổ không đổi",
    await intr.evaluate(() => HAUSTEK.admin.advances.list().find(a => a.partyKey === "A:0").opening === 99999));

  /* ---------- KÊNH NGƯỢC 1.1: MỘT DEAL, HAI ĐỀ XUẤT ----------
     Từ bước 3 bên portal, một deal sinh hai đề xuất — hợp đồng và tạm ứng —
     hai lần giám đốc bấm, và có thể một cái duyệt còn cái kia bị trả. Bảng
     INBOX_STAGE của CRM giả định MỘT deal có MỘT trạng thái, nên đúng ca ấy
     không ô nào trong bảng đúng. Ba phép dưới ghim cách xử lý mới. */
  const dealId = await crm.evaluate(() => {
    const o = DB.opps.find(x => PORTAL_OWNED.includes(x.stage));
    return o ? o.id : null;
  });
  F("có deal đang ở phần portal cầm lái để kiểm", !!dealId);

  async function goiVe(goi) {
    await crm.evaluate(([k, g]) => {
      localStorage.setItem(k, JSON.stringify(g));
      INBOX_SEEN = {};            /* để lần áp này không bị coi là đã áp */
      inboxApply();
    }, ["haustek.portal.contracts.v1", goi]);
    await crm.waitForTimeout(120);
    return crm.evaluate(id => {
      const o = DB.opps.find(x => x.id === id);
      return { stage: o.stage, ct: o.contract, khoa: HANDOFF_BIND[id] || null,
               lech: inboxLech(o), badge: contractBadge(o) };
    }, dealId);
  }

  const r11 = await goiVe({
    v: "1.1.0", deals: [{
      dealId, updatedAt: "2026-09-16T10:00:00.000Z", by: "portal",
      portalPartyKey: "L:38", giaiDoan: "legal",
      chiTiet: "Hợp đồng đã duyệt · tạm ứng bị trả lại, chờ dựng lại đề xuất",
      deXuat: [{ id: "DX-2609-011", loai: "hopDong", trangThai: "approved" },
               { id: "DX-2609-012", loai: "tamUng",  trangThai: "rejected" }]
    }]
  });
  F("gói 1.1 dùng giaiDoan do PORTAL tính, không tự suy từ deXuat[]",
    r11.stage === "legal");
  F("giữ đủ hai đề xuất trên deal", (r11.ct.deXuat || []).length === 2);
  F("đề xuất bị trả KHÔNG bị cột giai đoạn nuốt — có huy hiệu riêng",
    !!r11.lech && /bị trả lại|sent back/i.test(r11.badge));
  F("chiTiet của portal hiện nguyên văn, CRM không ánh xạ lại",
    r11.ct.chiTiet === "Hợp đồng đã duyệt · tạm ứng bị trả lại, chờ dựng lại đề xuất");
  F("khoá bên portal trả về được lưu để lần sau gửi kèm",
    r11.khoa === "L:38");

  /* Giai đoạn là dữ liệu của PHÍA KHÁC. Gói bịa một giai đoạn không có thật
     thì phải bị bỏ qua, không được ghi vào deal. */
  const rBay = await goiVe({
    v: "1.1.0", deals: [{ dealId, updatedAt: "2026-09-16T11:00:00.000Z",
      giaiDoan: "khong-co-that", portalPartyKey: "<script>", deXuat: [] }]
  });
  F("giai đoạn lạ bị bỏ qua, deal không bị kéo đi",
    rBay.stage === "legal");
  F("khoá bên sai hình thức bị bỏ qua", rBay.khoa === "L:38");

  /* Gói 1.0 cũ vẫn phải chạy y như trước — portal chưa đổi thì CRM không được vỡ. */
  const r10 = await goiVe({
    v: "1.0.0", deals: [{ dealId, updatedAt: "2026-09-16T12:00:00.000Z",
      status: "signed", by: "portal" }]
  });
  F("gói 1.0 vẫn tra bảng INBOX_STAGE như cũ", r10.stage === "won");
  F("gói 1.0 không có đề xuất nào thì không hiện huy hiệu lệch", r10.lech === null);

  /* CRM KHÔNG ĐƯỢC DỰNG SẴN LỜI GỌI GHI SỔ CHO NGƯỜI TA CHÉP.
     Bản trước in ra hai chuỗi để người vận hành dán sang portal:
         A.rates.add("L:38", 0.7, …)
         A.advances.set("L:38", 16100, …)
     CRM không tự chạy chúng, nhưng in ra công thức của lỗi đắt nhất hai đội
     đã gặp rồi mời người ta gõ vào thì cũng vậy: advances.set() GÁN ĐÈ số dư
     gốc, còn nhánh duyệt applyApproved() CỘNG DỒN — một lượt chép tay là xoá
     mất khoản tạm ứng giám đốc đã duyệt kỳ trước, và không gì báo.
     Kiểm trên MÃ NGUỒN, không trên giao diện: chỗ nguy hiểm là phép nối
     chuỗi dựng ra lời gọi, và nó có thể sống ở một nhánh giao diện mà phép
     kiểm không bấm tới. Câu cảnh báo nhắc TÊN hai hàm thì vẫn được — thứ bị
     cấm là dựng ra lời gọi. */
  const nguon = fs.readFileSync(path.resolve(ROOT, "crm", "index.html"), "utf8");
  F("CRM không dựng sẵn lời gọi advances.set để người ta chép",
    !/['"`]\s*A\.advances\.set\s*\(/.test(nguon));
  F("CRM không dựng sẵn lời gọi rates.add để người ta chép",
    !/['"`]\s*A\.rates\.add\s*\(/.test(nguon));

  if (errs.length) FAILED++;
  console.log("\nLỗi JS: " + errs.length);
  errs.slice(0, 5).forEach(e => console.log("  " + e));
  await b.close();
} finally {
  srv.close();
}
console.log(FAILED ? "\n" + FAILED + " phép kiểm HỎNG" : "\n45 đạt · 0 hỏng");
process.exit(FAILED ? 1 : 0);
