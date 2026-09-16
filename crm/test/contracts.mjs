/* =====================================================================
   KIỂM MODULE HỢP ĐỒNG — phần nhận từ bản R&D (crm-demo_091626_QC)

   Phép kiểm quan trọng nhất ở đây là phép đầu tiên: nó dựng lại ĐÚNG cú khai
   thác đã chạy được trên bản R&D. Ở đó, gõ một thẻ img kèm onerror vào ô
   "Ghi chú pháp lý" của một deal là chạy được mã khi pháp chế mở hợp đồng —
   vì fillTemplate() của họ trả chuỗi thô rồi được gán vào innerHTML. Không
   cần quyền gì đặc biệt để gài: ô đó là ô nhập bình thường của A&R.

   Nếu ai đó sau này sửa ctrFillHTML() về dạng nối chuỗi thô, phép kiểm này
   phải đỏ. Nó là lý do file này tồn tại.

       node crm/test/contracts.mjs
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

const PORT = 8641;
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
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
const page = await ctx.newPage();
const JSERR = [];
page.on("pageerror", e => JSERR.push(String(e).slice(0, 180)));
page.on("console", m => { if (m.type() === "error" && !/favicon|font|net::/i.test(m.text())) JSERR.push("console: " + m.text().slice(0, 180)); });

let PWNED = null;
await page.exposeFunction("__pwn", s => { PWNED = s; });

await page.goto(B + "/crm/index.html");
await page.evaluate(() => { try { window.STORE_READY = false; localStorage.clear(); } catch (e) {} });
await page.reload();
await page.waitForTimeout(700);
await page.click(".login-btn");
await page.waitForTimeout(400);

console.log("— mẫu có sẵn —");
{
  const d = await page.evaluate(() => ({
    n: DB.templates.length,
    fields: DB.templates.map(x => (String(x.body).match(/\{\{\w+\}\}/g) || []).length),
    defs: CONTRACT_FIELDS.length
  }));
  F("seed đủ ba mẫu", d.n === 3, d.n);
  F("mẫu nào cũng có chỗ tự điền", d.fields.every(x => x > 0), d.fields.join("/"));
  F("khai báo đủ 34 trường hợp đồng", d.defs === 34, d.defs);
}

console.log("\n— XSS: đúng cú đã ăn trên bản R&D —");
{
  const setup = await page.evaluate(() => {
    /* Kịch bản thật: A&R gõ payload vào một ô nhập bình thường của deal. */
    const o = DB.opps.find(x => ['legal','signature','won'].indexOf(x.stage) >= 0) || DB.opps[0];
    o.stage = 'legal';
    o.ext = o.ext || {};
    o.ext.legalNotes = '<img src=x onerror="window.__pwn(\'legalNotes\')">';
    o.ext.artistLegal = '<svg onload="window.__pwn(\'artistLegal\')">';
    const tp = DB.templates.find(x => x.body.indexOf('{{legal_notes}}') >= 0);
    const c = { id: 'ctx1', name: 'HĐ thử', oppId: o.id, templateId: tp.id, status: 'draft',
                by: ME, created: new Date(TODAY), manual: {}, snap: ctrFieldVals(o) };
    DB.contracts.unshift(c);
    return { deal: o.name, tpl: tp.name };
  });
  await page.evaluate(() => openContract('ctx1'));
  await page.waitForTimeout(800);
  F("mở hợp đồng KHÔNG chạy mã người dùng nhập", PWNED === null, PWNED);
  const dom = await page.evaluate(() => {
    const d = document.querySelector('.ctr-doc');
    return d ? { imgs: d.querySelectorAll('img').length, svgs: d.querySelectorAll('svg').length,
                 hasText: d.textContent.indexOf('onerror') >= 0 } : null;
  });
  F("thẻ độc không dựng thành node trong DOM", dom && dom.imgs === 0 && dom.svgs === 0,
    dom ? ('img=' + dom.imgs + ' svg=' + dom.svgs) : 'không thấy .ctr-doc');
  F("payload hiện ra dưới dạng CHỮ, không bị nuốt mất", dom && dom.hasText, JSON.stringify(dom));

  /* Đường thứ hai: giá trị gõ tay ngay trên form hợp đồng. */
  await page.evaluate(() => ctrSetManual('ctx1', 'address', '<img src=x onerror="window.__pwn(\'manual\')">'));
  await page.waitForTimeout(500);
  F("giá trị gõ tay cũng không chạy được mã", PWNED === null, PWNED);

  /* Đường thứ ba: chính nội dung MẪU — pháp chế sửa mẫu được. */
  await page.evaluate(() => {
    const tp = DB.templates.find(x => x.id === DB.contracts.find(c => c.id === 'ctx1').templateId);
    tp.body = 'Thử: <img src=x onerror="window.__pwn(\'tplBody\')"> {{today}}';
    openContract('ctx1');
  });
  await page.waitForTimeout(700);
  F("nội dung mẫu cũng không chạy được mã", PWNED === null, PWNED);
}

console.log("\n— đếm trường còn trống —");
{
  await page.evaluate(() => {
    DB.contracts.length = 0;
    const tp = DB.templates.find(x => x.id === 'tp3') || DB.templates[0];
    tp.body = 'A={{artist_legal_name}} B={{address}} C={{today}}';
    const o = DB.opps.find(x => x.stage === 'legal');
    o.ext.artistLegal = 'Nguyễn Văn A';
    o.ext.address = '';
    DB.contracts.push({ id:'ctm', name:'đếm', oppId:o.id, templateId:tp.id, status:'draft',
                        by:ME, created:new Date(TODAY), manual:{}, snap:ctrFieldVals(o) });
  });
  const m1 = await page.evaluate(() => {
    const c = DB.contracts.find(x=>x.id==='ctm'), o = DB.opps.find(x=>x.id===c.oppId);
    return ctrMissing(c, o);
  });
  F("chỉ báo trống đúng trường đang trống", m1.length === 1 && m1[0] === 'address', m1.join(','));
  const m2 = await page.evaluate(() => {
    ctrSetManual('ctm', 'address', '12 Nguyễn Huệ, Q1');
    const c = DB.contracts.find(x=>x.id==='ctm'), o = DB.opps.find(x=>x.id===c.oppId);
    return { miss: ctrMissing(c,o).length, html: ctrFillHTML(tplBody(c), ctrVals(c,o)) };
  });
  F("điền tay xong thì hết trống", m2.miss === 0, m2.miss);
  F("giá trị gõ tay vào đúng chỗ", m2.html.indexOf('12 Nguyễn Huệ') >= 0, m2.html.slice(0,80));
  F("không còn dấu ô trống nào", m2.html.indexOf('<mark>') < 0, m2.html.slice(0,80));
  const gap = await page.evaluate(() => {
    ctrSetManual('ctm', 'address', '');
    const c = DB.contracts.find(x=>x.id==='ctm'), o = DB.opps.find(x=>x.id===c.oppId);
    return ctrFillHTML(tplBody(c), ctrVals(c,o));
  });
  F("bỏ trống lại thì ô trống được đánh dấu", gap.indexOf('<mark>') >= 0 && gap.indexOf('address') >= 0, gap.slice(0,90));
}

console.log("\n— deal đổi sau khi soạn —");
{
  const d = await page.evaluate(() => {
    const c = DB.contracts.find(x=>x.id==='ctm'), o = DB.opps.find(x=>x.id===c.oppId);
    const before = ctrDrift(c, o).length;
    o.ext.artistLegal = 'TÊN ĐÃ ĐỔI SAU KHI SOẠN';
    return { before, after: ctrDrift(c, o) };
  });
  F("lúc vừa soạn thì không lệch gì", d.before === 0, d.before);
  F("deal đổi thì chỉ ra đúng trường đã lệch",
    d.after.length === 1 && d.after[0] === 'artist_legal_name', d.after.join(','));
}

console.log("\n— lưu được qua F5 (chỗ bản R&D không có) —");
{
  await page.evaluate(() => {
    DB.contracts.length = 0;
    const o = DB.opps.find(x => x.stage === 'legal');
    DB.contracts.push({ id:'ctp', name:'HỢP ĐỒNG PHẢI CÒN SAU F5', oppId:o.id,
      templateId:'tp1', status:'pending', by:ME, created:new Date(TODAY),
      manual:{address:'GIÁ TRỊ GÕ TAY'}, snap:{} });
    DB.templates.unshift({id:'tpX', name:'MẪU TỰ TẠO', type:'Thử', body:'x {{today}}',
      owner:ME, updated:new Date(TODAY)});
    saveNow();
  });
  await page.reload(); await page.waitForTimeout(900);
  const after = await page.evaluate(() => {
    const c = DB.contracts.find(x=>x.id==='ctp');
    const tp = DB.templates.find(x=>x.id==='tpX');
    return { name: c && c.name, manual: c && c.manual && c.manual.address, status: c && c.status,
             created: c && Object.prototype.toString.call(c.created),
             tpl: tp && tp.name, tplUpd: tp && Object.prototype.toString.call(tp.updated) };
  });
  F("hợp đồng còn nguyên sau khi nạp lại", after.name === 'HỢP ĐỒNG PHẢI CÒN SAU F5', after.name);
  F("giá trị gõ tay còn nguyên", after.manual === 'GIÁ TRỊ GÕ TAY', after.manual);
  F("trạng thái còn nguyên", after.status === 'pending', after.status);
  F("mẫu tự tạo còn nguyên", after.tpl === 'MẪU TỰ TẠO', after.tpl);
  /* Đây là chỗ dễ vỡ âm thầm: không khai trong DATE_FIELDS thì sau khi nạp lại
     created là chuỗi, fdate() nhận chuỗi rồi trả ra rác mà không ném lỗi. */
  F("created hồi sinh thành Date, không phải chuỗi", after.created === '[object Date]', after.created);
  F("updated của mẫu cũng hồi sinh thành Date", after.tplUpd === '[object Date]', after.tplUpd);
}

console.log("\n— quyền —");
{
  await page.click(".login-btn").catch(()=>{});
  await page.waitForTimeout(300);
  const d = await page.evaluate(() => {
    const out = {};
    ['manager','legal','ar'].forEach(r => {
      const u = USERS.find(x => x.role === r);
      out[r] = u ? { name: u.name, can: !!ROLES[r].perms.contracts } : null;
    });
    out.navHasContracts = NAV.some(n => n.id === 'contracts');
    out.navPerm = NAV_PERM.contracts;
    return out;
  });
  F("vai trò legal có mặt trong USERS", !!d.legal, JSON.stringify(d.legal));
  F("legal được quyền hợp đồng", d.legal && d.legal.can === true);
  F("A&R KHÔNG được quyền hợp đồng", d.ar && d.ar.can === false, d.ar && d.ar.can);
  F("Manager được quyền hợp đồng", d.manager && d.manager.can === true);
  F("nav có mục Hợp đồng, gắn đúng quyền", d.navHasContracts && d.navPerm === 'contracts', d.navPerm);

  /* render() có sẵn một lớp chặn: view nào navAllowed() từ chối thì bị bật về
     Trang chính. Nên A&R KHÔNG thấy ô "không có quyền" — họ bị đưa đi chỗ
     khác hẳn. Kiểm đúng hành vi đó, đừng kiểm cái mình tưởng. */
  const blocked = await page.evaluate(() => {
    const before = ME;
    const u = USERS.find(x => x.role === 'ar');
    setUser(u.name); go('contracts');
    const out = { view: state.view,
                  navShows: NAV.filter(n => navAllowed(n.id)).some(n => n.id === 'contracts'),
                  leaked: document.getElementById('view').innerHTML.indexOf('ctr-doc') >= 0 };
    setUser(before);
    return out;
  });
  F("A&R bị bật khỏi tab Hợp đồng về Trang chính", blocked.view === 'home', blocked.view);
  F("A&R không thấy mục Hợp đồng trên thanh điều hướng", blocked.navShows === false);
  F("không rò nội dung hợp đồng nào ra màn hình A&R", blocked.leaked === false);
}

console.log("\n— màn hình vẽ được ở cả hai ngôn ngữ —");
{
  for (const lg of ['vi', 'en']) {
    const r = await page.evaluate(l => {
      setLang(l); go('contracts');
      const a = document.getElementById('view').innerText.length;
      state.ctrTab = 'tpl'; render();
      const b = document.getElementById('view').innerText.length;
      state.ctrTab = 'list'; render();
      return { a, b };
    }, lg);
    F(lg + ': tab hợp đồng và tab mẫu đều có nội dung', r.a > 50 && r.b > 50, JSON.stringify(r));
  }
  await page.evaluate(() => setLang('vi'));
}

console.log("\nLỗi JS: " + JSERR.length);
JSERR.slice(0, 6).forEach(e => console.log("  ✗ " + e));
if (JSERR.length) FAILED += JSERR.length;

await browser.close();
srv.close();
console.log(FAILED ? "\n" + FAILED + " phép kiểm HỎNG" : "\n27 đạt · 0 hỏng");
process.exit(FAILED ? 1 : 0);
