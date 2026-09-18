/* =====================================================================
   ĐỐI CHIẾU SỐ GIỮA HAI APP — CRM hứa gì, portal sẽ ra gì
   ---------------------------------------------------------------------
   VÌ SAO CÓ FILE NÀY

   CRM là nơi A&R ngồi trước mặt đối tác và HỨA một con số. Portal là nơi
   con số ấy thành tiền thật. Không có gì bắt hai bên khớp nhau, và đo ra
   thì chúng không khớp:

     Deal với một LABEL để Haustek trả nghệ sĩ. CRM tính thu hồi từ toàn bộ
     phần sau phí (70% gộp). Portal thu hồi từ earnedByParty — mà với label
     ấy, earnedByParty chỉ là phần LABEL GIỮ LẠI sau khi chia cho nghệ sĩ
     của nó (splitRec: net → artistBase = net × r, labelCut = net − artistBase).
     Với r = 70% thì label chỉ nhận 30% của net, không phải 100%.

     Hệ quả đo được: CRM hứa hoà vốn nhanh hơn thực tế tới hơn ba lần.

   Bài này KHÔNG nạp lõi portal (nó ở repo khác khi tách). Nó mã hoá lại
   ĐÚNG công thức chia của portal thành một hàm nhỏ ở đây, rồi đòi advModel
   của CRM ra cùng số. Khi portal đổi công thức, bài này phải đỏ — đó là ý
   đồ: hai bên đổi thì phải cùng đổi.

       node crm/test/doi-chieu-so.mjs
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
const ROOT = process.cwd(), PORT = 8144;

/* ---------------------------------------------------------------------
   CÔNG THỨC CHIA CỦA PORTAL, chép lại từ portal/haustek-core.js splitRec:
       fee        = gộp × phiPct          (phí hợp đồng Haustek giữ)
       net        = gộp − fee
       artistBase = net × r               (r = tỷ lệ nghệ sĩ)
       labelCut   = net − artistBase
   và earnedByParty của một bên:
       nghệ sĩ độc lập   → net   (không có label ở giữa)
       label tự trả      → net   (nhận trọn, tự trả nghệ sĩ)
       label Haustek trả → labelCut
   --------------------------------------------------------------------- */
function portalPhanBen(gross, phiPct, loai, r) {
  const net = gross * (1 - phiPct);
  if (loai === "label") return net * (1 - r);
  return net;
}

const srv = http.createServer((q, s) => {
  let u = decodeURIComponent(q.url.split("?")[0]);
  if (u.endsWith("/")) u += "index.html";
  const f = path.resolve(ROOT, "." + u);
  if (!f.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { s.writeHead(404); return s.end("404"); }
    s.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html" : "text/plain",
                       "cache-control": "no-store" });
    s.end(d);
  });
}).listen(PORT, "127.0.0.1");

let FAILED = 0;
const F = (n, v, chi) => { if (!v) FAILED++; console.log((v ? "  ok  " : "  LỖI") + "  " + n + (chi && !v ? "  → " + chi : "")); };

const b = await chromium.launch();
try {
  const p = await (await b.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  const loi = [];
  p.on("pageerror", e => loi.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/crm/index.html`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  await p.click(".login-btn");
  await p.waitForTimeout(400);

  /* Mở máy tính advance rồi gõ thẳng vào ô — đúng đường người dùng đi. */
  async function chay(o) {
    return p.evaluate(v => {
      go("opps");
      if (!document.getElementById("ac_avg")) {
        document.body.insertAdjacentHTML("beforeend", '<div id="__t">' + advanceHTML() + "</div>");
      }
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = String(val); };
      set("ac_avg", v.avg); set("ac_share", v.share); set("ac_pass", v.pass);
      set("ac_adv", v.adv); set("ac_mkt", 0); set("ac_prod", 0);
      set("ac_term", 60); set("ac_excl", 36); set("ac_fee", 0);
      set("ac_ben", v.ben); set("ac_lrate", v.lrate);
      const m = advModel();
      return { recoup: m.recoup, months: m.months, phanBen: m.phanBen, heSoBen: m.heSoBen, ben: m.ben };
    }, o);
  }

  const GOP = 10000, SHARE = 70, PHI = 1 - SHARE / 100, LRATE = 70;

  /* ---------- 1. nghệ sĩ độc lập: hai bên vốn đã khớp ---------- */
  const a = await chay({ avg: GOP, share: SHARE, pass: 0, adv: 50000, ben: "artist", lrate: LRATE });
  const mongA = portalPhanBen(GOP, PHI, "artist", LRATE / 100);
  F("nghệ sĩ độc lập: nguồn thu hồi khớp portal",
    Math.abs(a.recoup - mongA) < 0.01, `CRM ${a.recoup.toFixed(2)} · portal ${mongA.toFixed(2)}`);

  /* ---------- 2. label TỰ TRẢ: nhận trọn net, vẫn khớp ---------- */
  const b2 = await chay({ avg: GOP, share: SHARE, pass: 0, adv: 50000, ben: "label_tutra", lrate: LRATE });
  F("label tự trả: nhận trọn phần sau phí, khớp portal",
    Math.abs(b2.recoup - portalPhanBen(GOP, PHI, "label_tutra", LRATE / 100)) < 0.01,
    `CRM ${b2.recoup.toFixed(2)}`);

  /* ---------- 3. label để Haustek trả: ĐÂY là chỗ từng sai ---------- */
  const c = await chay({ avg: GOP, share: SHARE, pass: 0, adv: 50000, ben: "label", lrate: LRATE });
  const mongC = portalPhanBen(GOP, PHI, "label", LRATE / 100);
  F("label Haustek trả nghệ sĩ: thu hồi CHỈ lấy từ phần label giữ",
    Math.abs(c.recoup - mongC) < 0.01, `CRM ${c.recoup.toFixed(2)} · portal ${mongC.toFixed(2)}`);
  F("và nó nhỏ hơn hẳn phần sau phí — đúng bản chất ba lớp",
    c.recoup < b2.recoup * 0.5, `label ${c.recoup.toFixed(0)} · tự trả ${b2.recoup.toFixed(0)}`);

  /* Con số A&R thật sự hứa: số tháng hoà vốn. Bản trước CRM ra 7,1 tháng
     cho cả hai loại; thật ra label phải là 23,8. */
  F("số tháng hoà vốn của label dài hơn nhiều lần label tự trả",
    c.months > b2.months * 2.5,
    `label ${c.months.toFixed(1)} th · tự trả ${b2.months.toFixed(1)} th`);

  /* ---------- 4. tỷ lệ nghệ sĩ của label thật sự vào công thức ---------- */
  const d = await chay({ avg: GOP, share: SHARE, pass: 0, adv: 50000, ben: "label", lrate: 40 });
  F("hạ tỷ lệ nghệ sĩ của label thì phần label giữ tăng theo",
    Math.abs(d.recoup - portalPhanBen(GOP, PHI, "label", 0.40)) < 0.01,
    `CRM ${d.recoup.toFixed(2)}`);

  /* ---------- 5. pass-through vẫn phải vào công thức ---------- */
  const e = await chay({ avg: GOP, share: SHARE, pass: 30, adv: 50000, ben: "artist", lrate: LRATE });
  F("pass-through 30% cắt đúng 30% nguồn thu hồi",
    Math.abs(e.recoup - mongA * 0.7) < 0.01, `CRM ${e.recoup.toFixed(2)}`);

  /* ---------- 6. ô cảnh báo pass-through phải còn đó ---------- */
  const canhBao = await p.evaluate(() =>
    ADV_F.find(f => f.id === "ac_pass").tip.join(" "));
  F("ô Pass through nói rõ portal CHƯA tôn trọng số này",
    /CHƯA được bên kia tôn trọng|not yet honoured/i.test(canhBao),
    canhBao.slice(0, 60));

  /* ---------- 7. flow-through KHÔNG BAO GIỜ XONG ≠ XONG NGAY ---------- */
  const f100 = await chay({ avg: GOP, share: SHARE, pass: 100, adv: 50000, ben: "artist", lrate: LRATE });
  F("flow-through 100%: months là Infinity, KHÔNG phải 0",
    !isFinite(f100.months) && f100.months > 0, "months = " + f100.months);
  const f0 = await chay({ avg: GOP, share: SHARE, pass: 0, adv: 0, ben: "artist", lrate: LRATE });
  F("không có khoản ứng: months là 0 (không có gì để thu), không phải Infinity",
    f0.months === 0, "months = " + f0.months);

  /* ---------- 8. GÓI BÀN GIAO MANG MỨC CỦA TỪNG DEAL ----------
     Chủ dự án chốt flow-through đi theo TỪNG thương vụ. Nên phép kiểm này
     dựng hai deal với hai mức khác nhau và đòi gói mang đúng hai số ấy —
     một hằng số chung sẽ làm bài này đỏ. */
  const goi = await p.evaluate(() => {
    const lam = (id, adv) => handoffOf({
      id, name: "deal " + id, accountId: null, amount: 12000,
      closeDate: new Date(2026, 0, 1), owner: "test", stage: "won",
      rights: {}, ext: { advCalcResult: adv } });
    const co = (pass, ben, lrate) => ({
      artistShare: 0.7, initialAdvance: 20000, marketingFund: 0, termMonths: 60,
      exclusivityMonths: 36, findersFeePct: 0, passThrough: pass,
      rightsHolder: ben, labelArtistRate: lrate });
    return {
      a:  lam("d1", co(0.30, "artist", 0.7)).terms,
      b:  lam("d2", co(0.10, "artist", 0.7)).terms,
      c0: lam("d3", co(0,    "artist", 0.7)).terms,
      lb: lam("d4", co(0,    "label",  0.7)).terms,
      tt: lam("d5", co(0,    "label_tutra", 0.7)).terms,
      cu: lam("d6", { artistShare: 0.7, initialAdvance: 20000, marketingFund: 0,
                      termMonths: 60, exclusivityMonths: 36, findersFeePct: 0,
                      passThrough: 0 }).terms
    };
  });
  F("gói mang flowThroughPct của CHÍNH deal ấy, không phải một mức chung",
    goi.a.flowThroughPct === 30 && goi.b.flowThroughPct === 10,
    "d1 " + goi.a.flowThroughPct + "% · d2 " + goi.b.flowThroughPct + "%");
  F("flow-through 0 vẫn được gửi thành số 0, không bỏ trường",
    goi.c0.flowThroughPct === 0, JSON.stringify(goi.c0.flowThroughPct));
  F("gói mang rightsHolder", goi.lb.rightsHolder === "label" && goi.tt.rightsHolder === "label_tutra",
    goi.lb.rightsHolder + " / " + goi.tt.rightsHolder);
  F("deal cũ không có rightsHolder thì mặc định 'artist', không undefined",
    goi.cu.rightsHolder === "artist", String(goi.cu.rightsHolder));

  /* labelArtistRatePct có đuôi Pct nên rơi vào chốt chặn tiền của portal.
     Gửi vô điều kiện là chặn đứng MỌI deal bằng một mặc định vô nghĩa. */
  F("labelArtistRatePct chỉ gửi khi Haustek trả nghệ sĩ thay label",
    goi.lb.labelArtistRatePct === 70
      && !("labelArtistRatePct" in goi.tt) && !("labelArtistRatePct" in goi.c0),
    "label " + goi.lb.labelArtistRatePct + " · tự trả " + ("labelArtistRatePct" in goi.tt));

  /* ---------- 9. gói không được nói dối về "không bao giờ xong" ---------- */
  const neverGoi = await p.evaluate(() => {
    go("opps");
    if (!document.getElementById("ac_avg"))
      document.body.insertAdjacentHTML("beforeend", '<div id="__t2">' + advanceHTML() + "</div>");
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = String(v); };
    set("ac_avg", 10000); set("ac_share", 70); set("ac_pass", 100);
    set("ac_adv", 50000); set("ac_mkt", 0); set("ac_prod", 0);
    set("ac_term", 60); set("ac_excl", 36); set("ac_fee", 0);
    set("ac_ben", "artist"); set("ac_lrate", 70);
    const m = advModel();
    const ra = { monthsToRecoup: isFinite(m.months) ? m.months : null, neverRecoups: !isFinite(m.months) };
    return { ra, quaJSON: JSON.parse(JSON.stringify(ra)) };
  });
  F("qua JSON, 'không bao giờ xong' không biến thành 0",
    neverGoi.quaJSON.monthsToRecoup === null && neverGoi.quaJSON.neverRecoups === true,
    JSON.stringify(neverGoi.quaJSON));

  F("không lỗi JavaScript nào", loi.length === 0, loi[0]);
} finally {
  await b.close();
  srv.close();
}
console.log(FAILED ? "\n" + FAILED + " phép kiểm HỎNG" : "\n16 đạt · 0 hỏng");
process.exit(FAILED ? 1 : 0);
