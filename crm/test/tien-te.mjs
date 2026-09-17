/* =====================================================================
   TIỀN TỆ VÀ TỶ GIÁ
   ---------------------------------------------------------------------
   VÌ SAO CÓ FILE NÀY

   Bản trước giữ tỷ giá bằng `const FX = 25500` và quy đổi bằng
   `Math.round(x/FX)` ở bảy chỗ rời nhau. Ba hậu quả đo được:

     1. Gõ 1.000.000 ₫ vào một ô tiền → lưu 39 USD → hiện lại 994.500 ₫.
        5.500 ₫ bốc hơi ngay trước mắt người vừa gõ. Cận trên của mất mát
        là nửa tỷ giá: 12.750 ₫ mỗi ô mỗi lần lưu.
     2. Mọi số VND hiện với 2 số lẻ, và 35/35 bản ghi tiền đều ra đuôi
        ",00" — hai chữ số cố định bằng không, gợi ý một độ chính xác tới
        phần trăm đồng mà số lưu không hề có.
     3. Không ô tiền nào bị soát: -5000 lưu thẳng thành -5000, 1e12 lưu
        thành một nghìn tỷ đô la.

   Bài này ghim lại cả ba, và ghim thêm những chỗ dễ vỡ khi thêm EUR.

       node crm/test/tien-te.mjs
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
const chromium = await loadChromium();
const ROOT = process.cwd(), PORT = 8166;

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
  const p = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
  const loi = [];
  p.on("pageerror", e => loi.push(e.message));
  p.on("dialog", d => d.accept());          /* setFX hỏi confirm khi nhảy > 5% */
  await p.goto(`http://127.0.0.1:${PORT}/crm/index.html`, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.click(".login-btn");
  await p.waitForTimeout(400);

  /* ---------- 1. KHỨ HỒI: thứ người ta gõ phải quay về gần như nguyên vẹn ---------- */
  const kh = await p.evaluate(() => {
    const cu = cur; cur = "VND";
    const ra = [1000000, 12750, 26000, 100000000, 999999999].map(v =>
      ({ nhap: v, usd: toUSD(v), lai: fx(toUSD(v)) }));
    let max = 0;
    for (let v = 0; v < VCB.VND * 4; v += 3) {
      const d = Math.abs(fx(toUSD(v)) - v); if (d > max) max = d;
    }
    cur = cu;
    return { ra, max, nuaTyGia: 25500 / 2 };
  });
  F("khứ hồi VND lệch không quá 128 ₫ mỗi ô",
    kh.max <= 128, "lệch lớn nhất đo được " + kh.max.toFixed(2) + " ₫");
  F("và nhỏ hơn bản cũ (nửa tỷ giá = 12.750 ₫) ít nhất 90 lần",
    kh.max * 90 <= kh.nuaTyGia, "12750 / " + kh.max.toFixed(2) + " = " + (kh.nuaTyGia / kh.max).toFixed(0) + "×");
  F("gõ 1.000.000 ₫ không còn ra 994.500 ₫",
    Math.abs(kh.ra[0].lai - 1000000) < 200, kh.ra[0].lai + " ₫");

  /* ---------- 2. KHÔNG HIỆN SỐ LẺ GIẢ ---------- */
  const hien = await p.evaluate(() => {
    const cu = cur, o = {};
    ["USD", "VND", "EUR"].forEach(c => { cur = c; o[c] = [fmtMoney(1000, false), fmtMoney(39.22, false)]; });
    cur = "VND";
    /* mọi ô tiền thật trong DB, hiện bằng VND */
    o.mau = DB.opps.filter(x => typeof x.amount === "number").slice(0, 40).map(x => fmtMoney(x.amount, false));
    cur = cu;
    return o;
  });
  F("VND không còn đuôi ',00' — đồng không có đơn vị nhỏ hơn",
    hien.mau.every(x => !/,\d\d /.test(x)) && !/,\d\d /.test(hien.VND[0]),
    hien.VND[0] + " · " + hien.mau[0]);
  F("USD vẫn hiện tròn đô cho danh sách", /^1,000 USD$/.test(hien.USD[0]), hien.USD[0]);
  F("EUR hiện đúng đơn vị và có quy đổi", /EUR$/.test(hien.EUR[0]) && hien.EUR[0] !== "1.000 EUR", hien.EUR[0]);

  /* ---------- 3. EUR SUY RA TỪ HAI SỐ VCB, KHÔNG NHẬP RIÊNG ---------- */
  const eur = await p.evaluate(() => ({
    r: rate("EUR"), mong: VCB.VND / VCB.EUR,
    coRiêng: typeof window.EUR_RATE !== "undefined",
    ds: CURRENCIES.slice()
  }));
  F("rate('EUR') = VCB.VND / VCB.EUR, không có tỷ giá EUR nhập tay thứ ba",
    Math.abs(eur.r - eur.mong) < 1e-12 && !eur.coRiêng, String(eur.r));
  F("ba đồng tiền được khai báo", eur.ds.join(",") === "USD,VND,EUR", eur.ds.join(","));

  /* ---------- 4. TỶ GIÁ LÀ TRẠNG THÁI, CÓ KIỂM, CÓ LƯU ---------- */
  const hl = await p.evaluate(() =>
    [25500, 27720, 1000, 1000000, 999, 1000001, -25500, 0, NaN, "abc", Infinity]
      .map(x => ({ x: String(x), ok: fxHopLe(x) })));
  F("fxHopLe nhận đúng khoảng 1.000–1.000.000 và chặn phần còn lại",
    hl.filter(x => x.ok).map(x => x.x).join(",") === "25500,27720,1000,1000000",
    hl.filter(x => x.ok).map(x => x.x).join(","));

  /* đổi tỷ giá qua đúng màn hình quản trị, rồi kiểm dấu vết */
  const doi = await p.evaluate(() => {
    go("perms");
    const el = id => document.getElementById(id);
    if (!el("fxVnd")) return { loi: "không thấy ô tỷ giá trên màn Phân quyền" };
    const truoc = VCB.VND, nDangKy = FX_LOG.length, nAudit = DB.audit.length;
    el("fxVnd").value = "26100";                /* +2,35% — dưới ngưỡng hỏi lại */
    el("fxNote").value = "bảng VCB thử";
    setFX();
    return { truoc, sau: VCB.VND, themLog: FX_LOG.length - nDangKy,
             themAudit: DB.audit.length - nAudit,
             dong: FX_LOG[0] ? { cur: FX_LOG[0].cur, cu: FX_LOG[0].cu, moi: FX_LOG[0].moi,
                                 by: FX_LOG[0].by, note: FX_LOG[0].note } : null };
  });
  F("đổi được tỷ giá từ trong ứng dụng", !doi.loi && doi.sau === 26100, JSON.stringify(doi));
  F("mỗi lần đổi ghi một dòng lịch sử kèm người và nguồn",
    doi.themLog === 1 && doi.dong && doi.dong.cu === 25500 && doi.dong.moi === 26100
      && !!doi.dong.by && doi.dong.note === "bảng VCB thử", JSON.stringify(doi.dong));
  F("và ghi cả vào nhật ký kiểm toán", doi.themAudit >= 1, "thêm " + doi.themAudit + " dòng");

  /* số đã ký KHÔNG được đổi theo tỷ giá — chỉ cách HIỆN đổi */
  const giu = await p.evaluate(() => {
    const o = DB.opps.find(x => typeof x.amount === "number" && x.amount > 0);
    const usdTruoc = o.amount;
    const cu = cur; cur = "VND"; const vndTruoc = fx(o.amount);
    VCB.VND = 30000;                            /* giả lập đồng mất giá */
    const vndSau = fx(o.amount), usdSau = o.amount;
    VCB.VND = 26100; cur = cu;
    return { usdTruoc, usdSau, vndTruoc, vndSau };
  });
  F("đổi tỷ giá KHÔNG đụng vào con số đã lưu (USD đứng yên)",
    giu.usdTruoc === giu.usdSau, giu.usdTruoc + " → " + giu.usdSau);
  F("nhưng số VND hiện ra thì đổi theo — đúng bản chất quy đổi",
    giu.vndSau > giu.vndTruoc, giu.vndTruoc + " → " + giu.vndSau);

  /* ---------- 5. TỶ GIÁ VÀ LỊCH SỬ PHẢI SỐNG QUA LẦN TẢI LẠI ---------- */
  const luu = await p.evaluate(() => {
    const s = snapshot();
    return { coFx: !!(s.fx && s.fx.VND && s.fx.EUR), coLog: Array.isArray(s.fxLog) && s.fxLog.length > 0 };
  });
  F("snapshot mang theo tỷ giá", luu.coFx);
  F("snapshot mang theo lịch sử đổi tỷ giá — dấu vết mất khi tải lại là dấu vết giả", luu.coLog);

  const vong = await p.evaluate(() => {
    const s = JSON.parse(JSON.stringify(snapshot()));
    VCB.VND = 25500; FX_LOG = [];               /* xoá sạch rồi nạp lại */
    applySnapshot(s);
    return { vnd: VCB.VND, nLog: FX_LOG.length, ngayLaDate: FX_LOG[0] && FX_LOG[0].date instanceof Date };
  });
  F("nạp lại bản lưu thì tỷ giá trở về đúng giá trị đã đổi",
    vong.vnd === 26100, String(vong.vnd));
  F("và lịch sử trở lại với ngày là Date, không phải chuỗi",
    vong.nLog > 0 && vong.ngayLaDate === true, "n=" + vong.nLog + " date=" + vong.ngayLaDate);

  const ban = await p.evaluate(() => {
    /* bản lưu bị sửa tay / đến từ phiên bản khác */
    const s = snapshot(); s.fx = { VND: 5, EUR: -1 }; s.cur = "JPY"; s.fxLog = "không phải mảng";
    const cuV = VCB.VND, cuC = cur;
    applySnapshot(s);
    const ra = { vnd: VCB.VND, cur: cur, log: Array.isArray(FX_LOG) };
    VCB.VND = cuV; cur = cuC;
    return ra;
  });
  F("tỷ giá bậy trong bản lưu bị chặn, không nuốt vào",
    ban.vnd !== 5, "VCB.VND = " + ban.vnd);
  F("đồng tiền lạ trong bản lưu bị chặn", ban.cur !== "JPY", ban.cur);
  F("fxLog không phải mảng thì thành mảng rỗng, không nổ", ban.log === true);

  /* ---------- 6. setCur không nhận đồng tiền lạ ---------- */
  const sc = await p.evaluate(() => {
    const cu = cur; setCur("JPY"); const sau = cur; cur = cu; return sau;
  });
  F("setCur('JPY') không đổi gì — hàm này nằm trong onclick, ai cũng gọi được",
    sc !== "JPY", sc);

  /* ---------- 7. Ô TIỀN BỊ SOÁT ---------- */
  const soat = await p.evaluate(() => {
    if (typeof soatTien !== "function") return { thieu: true };
    document.body.insertAdjacentHTML("beforeend",
      '<div id="__st"><div class="curin"><input id="of_thu" type="number"></div></div>');
    const el = document.getElementById("of_thu");
    const thu = v => { el.value = v; const r = soatTien("of_"); return r ? r.msg : null; };
    const ra = { am: thu("-5000"), to: thu("1e12"), trong: thu(""), thuong: thu("15000") };
    document.getElementById("__st").remove();
    return ra;
  });
  F("soatTien chặn số âm", !soat.thieu && !!soat.am, JSON.stringify(soat.am));
  F("soatTien chặn số vượt trần", !!soat.to, JSON.stringify(soat.to));
  F("để trống thì không kêu — trống khác sai", soat.trong === null, JSON.stringify(soat.trong));
  F("số hợp lệ đi qua", soat.thuong === null, JSON.stringify(soat.thuong));

  /* và nó phải thật sự chặn được lượt lưu, không chỉ tồn tại */
  const chan = await p.evaluate(() => {
    go("opps"); openOppForm();
    const set = (id, v) => { const e = document.getElementById("of_" + id); if (e) e.value = v; };
    ["name", "account"].forEach(k => set(k, "Thử soát tiền"));
    set("type", "New client"); set("stage", "negotiation"); set("close", "2026-12-31");
    set("ytIncome", "1000"); set("audioIncome", "1000");
    set("advance", "-5000"); set("mktBudget", "0"); set("prodFund", "0");
    /* Bắt buộc: mọi ô required phải ĐẦY, nếu không saveOppForm dừng ở vòng
       kiểm required và phép kiểm này sẽ "đạt" vì một lý do khác hẳn. Đúng
       cái bẫy ấy đã xảy ra một lần: of_type là <select> chỉ nhận "New client"
       / "Contract renewal", gán "New" để lại ô rỗng, và lượt lưu bị chặn ở
       chặng trước — bài kiểm xanh mà chưa hề chạm tới soatTien. */
    const req = ["of_name","of_account","of_type","of_stage","of_close",
                 "of_ytIncome","of_audioIncome","of_advance","of_mktBudget","of_prodFund"];
    const conRong = req.filter(id => { const e=document.getElementById(id); return !e || !e.value.trim(); });
    const truoc = DB.opps.length;
    saveOppForm();
    const sau = DB.opps.length;
    const xau = document.getElementById("of_advance");
    const daDanhDau = xau && xau.classList.contains("err");
    closeDrawer();
    return { truoc, sau, daDanhDau, conRong };
  });
  F("biểu mẫu đã đầy các ô bắt buộc — nếu không, phép kiểm dưới vô nghĩa",
    chan.conRong.length === 0, "còn rỗng: " + chan.conRong.join(", "));
  F("lưu cơ hội với tạm ứng âm bị CHẶN, không tạo bản ghi",
    chan.sau === chan.truoc, chan.truoc + " → " + chan.sau);
  F("và ô sai được đánh dấu để người dùng biết sửa ở đâu", chan.daDanhDau === true);

  /* ---------- 8. MỘT ĐƠN VỊ DUY NHẤT QUA CẢ BIỂU MẪU ----------
     Đây là chỗ từng lệch 25.500 lần. Bộ tính advance đọc ô tiền bằng
     parseFloat thuần, tức làm việc bằng đơn vị đang hiển thị, trong khi
     các ô tiền của biểu mẫu cơ hội ngay cạnh lại đi qua toUSD(). Cùng một
     lượt lưu sinh ra hai con số cho cùng một khoản tiền, và con số SAI
     chính là con số đi sang portal. */
  const dv = await p.evaluate(() => {
    const cu = cur;
    setCur("VND");
    go("opps"); openOppForm();
    const s = (id, v) => { const e = document.getElementById("of_" + id); if (e) e.value = String(v); };
    s("name", "Deal gõ bằng đồng"); s("account", "Thử đơn vị"); s("type", "New client");
    s("stage", "won"); s("close", "2026-12-31");
    s("ytIncome", 255000000); s("audioIncome", 0);
    s("advance", 1275000000); s("mktBudget", 0); s("prodFund", 0);   /* = 50.000 USD */
    const cb = document.getElementById("of_advanceDeal");
    if (cb && cb.getAttribute("data-on") !== "1") togChk("of_advanceDeal");
    if (document.getElementById("ac_adv")) {
      const a = (id, v) => { const e = document.getElementById(id); if (e) e.value = String(v); };
      a("ac_avg", 255000000); a("ac_adv", 1275000000); a("ac_mkt", 0); a("ac_prod", 0);
      a("ac_share", 70); a("ac_pass", 0); a("ac_term", 60); a("ac_excl", 36); a("ac_fee", 0);
    }
    const n0 = DB.opps.length;
    saveOppForm();
    const o = DB.opps.find(x => x.name === "Deal gõ bằng đồng");
    const ra = (DB.opps.length === n0 || !o || !o.ext)
      ? { hong: "không lưu được" }
      : { extAdvance: o.ext.advance,
          calcInitAdv: o.ext.advCalcResult && o.ext.advCalcResult.initialAdvance,
          goiUSD: handoffOf(o).terms && handoffOf(o).terms.initialAdvanceUSD,
          tyGia: VCB.VND };
    if (o) DB.opps.splice(DB.opps.indexOf(o), 1);
    setCur(cu);
    return ra;
  });
  F("lưu được deal nhập bằng VND", !dv.hong, JSON.stringify(dv.hong));
  F("bộ tính advance và biểu mẫu ra CÙNG một con số USD",
    dv.extAdvance === dv.calcInitAdv,
    "biểu mẫu " + dv.extAdvance + " · bộ tính " + dv.calcInitAdv);
  /* Mong đợi tính theo TỶ GIÁ ĐANG CHẠY, không phải 25.500 đóng cứng: phép
     kiểm ở mục 4 phía trên đã đổi tỷ giá, và một con số mong đợi đóng cứng
     sẽ đỏ vì lý do chẳng liên quan gì tới chuyện đang kiểm. */
  const mongUSD = Math.round(1275000000 / dv.tyGia);
  F("gói gửi portal mang con số USD, không phải 1.275.000.000 thô",
    Math.abs(dv.goiUSD - mongUSD) <= 1 && dv.goiUSD < 1e6,
    "gói " + dv.goiUSD + " · mong " + mongUSD + " ở tỷ giá " + dv.tyGia);

  /* advNum vs advTien: ô tiền phải quy đổi, ô phần trăm thì không */
  const hai = await p.evaluate(() => {
    go("opps");
    if (!document.getElementById("ac_avg"))
      document.body.insertAdjacentHTML("beforeend", '<div id="__dv">' + advanceHTML() + "</div>");
    const a = (id, v) => { const e = document.getElementById(id); if (e) e.value = String(v); };
    const cu = cur, o = {};
    ["USD", "VND"].forEach(c => {
      cur = c;
      a("ac_avg", 25500); a("ac_adv", 25500); a("ac_mkt", 0); a("ac_prod", 0);
      a("ac_share", 70); a("ac_pass", 0); a("ac_term", 60); a("ac_excl", 36);
      a("ac_fee", 0); a("ac_ben", "artist"); a("ac_lrate", 70);
      const m = advModel();
      o[c] = { adv: m.adv, share: m.share, term: m.term };
    });
    cur = cu;
    return o;
  });
  F("cùng một con số gõ vào: ở VND ra ít USD hơn hẳn ở USD",
    hai.USD.adv === 25500 && hai.VND.adv > 0 && hai.VND.adv < 2,
    "USD " + hai.USD.adv + " · VND " + hai.VND.adv);
  F("nhưng ô phần trăm và số tháng thì KHÔNG bị quy đổi",
    hai.USD.share === hai.VND.share && hai.USD.term === hai.VND.term,
    JSON.stringify([hai.USD.share, hai.VND.share, hai.USD.term, hai.VND.term]));

  F("không lỗi JavaScript nào", loi.length === 0, loi[0]);
} finally {
  await b.close();
  srv.close();
}
console.log(FAILED ? "\n" + FAILED + " phép kiểm HỎNG" : "\n35 đạt · 0 hỏng");
process.exit(FAILED ? 1 : 0);
