/* =====================================================================
   CỬA ĐĂNG NHẬP — bài kiểm DUY NHẤT cố ý KHÔNG gieo sẵn phiên
   ---------------------------------------------------------------------
   Mọi bài kiểm trình duyệt khác gọi vao-cua.js để đi thẳng vào cổng. Bài
   này thì không: nó kiểm chính cái cửa.

   Chín phép, chia ba nhóm:
     · cửa có đứng đúng chỗ không — chưa vào thì không thấy cổng
     · từ chối có đúng cách không — câu lỗi không tiết lộ ai có tài khoản,
       và mỗi lần bị từ chối để lại một dòng nhật ký
     · phiên có sống đúng không — nhớ qua lần nạp lại, đăng xuất thì hết,
       và tài khoản bị khoá giữa chừng thì lần nạp sau bị đá ra

   Cần một server tĩnh ở cổng 8099:
       cd portal && python3 -m http.server 8099 &
       NODE_PATH=$(npm root -g) node test/cua-dang-nhap.js
   ===================================================================== */
"use strict";
const { chromium } = require("playwright");
const G = "http://127.0.0.1:8099/v2/";

let pass = 0; const hong = [];
function kiem(ten, m) { pass++; console.log("  ok   " + ten + (m ? " · " + m : "")); }
function fail(ten, m) { hong.push(ten + " — " + m); console.log("  LỖI  " + ten + " — " + m); }
function must(c, ten, m) { if (c) kiem(ten, typeof c === "string" ? c : ""); else fail(ten, m); }

const oCua = p => p.evaluate(() => !!document.querySelector(".cua"));
const oCong = p => p.evaluate(() => !!document.querySelector(".app .nav"));

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });

  for (const [ten, tep, dung, sai] of [
    ["nội bộ", "intranet.html", "mgmt@haustek-group.com", "khong-ai@haustek-group.com"],
    ["đối tác", "khach.html", "label1@vidu.vn", "khong-ai@vidu.vn"]
  ]) {
    console.log("\n--- cổng " + ten);
    const p = await b.newPage();
    const loi = [];
    p.on("pageerror", e => loi.push(e.message));
    p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) loi.push(m.text()); });

    /* 1 · chưa đăng nhập thì thấy cửa, KHÔNG thấy cổng */
    await p.goto(G + tep, { waitUntil: "networkidle" });
    await p.waitForTimeout(700);
    must(await oCua(p) && !(await oCong(p)),
      ten + ": chưa đăng nhập thì thấy cửa chứ không thấy cổng",
      "cửa=" + await oCua(p) + " cổng=" + await oCong(p));

    /* 2 · ô mật khẩu có mặt VÀ tự khai là bản mẫu không kiểm */
    const mk = await p.evaluate(() => ({
      co: !!document.querySelector('input[type=password]'),
      noi: [...document.querySelectorAll(".cua-nho")].some(e => /không kiểm mật khẩu|does not check passwords/i.test(e.textContent))
    }));
    must(mk.co && mk.noi, ten + ": có ô mật khẩu và nói rõ bản mẫu không kiểm",
      "ô=" + mk.co + " lời khai=" + mk.noi);

    /* 3 · email lạ bị từ chối, và câu lỗi KHÔNG nói email có tồn tại hay không */
    await p.fill("[data-cua-email]", sai);
    await p.click(".cua-nut");
    await p.waitForTimeout(250);
    const cauLoi = (await p.textContent("[data-cua-loi]") || "").trim();
    must(await oCua(p) && cauLoi.length > 0, ten + ": email lạ bị chặn ở cửa", "vào lọt hoặc không báo lỗi");
    must(!/không tồn tại|chưa có tài khoản|bị khoá|not found|no such|locked|suspended/i.test(cauLoi),
      ten + ": câu lỗi không tiết lộ ai có tài khoản", "câu lỗi: " + cauLoi);

    /* 4 · bấm một tài khoản mẫu thì điền email vào ô */
    await p.click(".cua-mau-hop summary");
    await p.waitForTimeout(150);
    const soMau = await p.evaluate(() => document.querySelectorAll("[data-mau]").length);
    await p.click("[data-mau]");
    const daDien = await p.inputValue("[data-cua-email]");
    must(daDien.indexOf("@") > 0, ten + ": bấm tài khoản mẫu thì điền email", "ô vẫn là: " + daDien);

    /* 5 · đăng nhập đúng thì vào cổng VÀ cửa biến mất khỏi DOM */
    await p.fill("[data-cua-email]", dung);
    await p.click(".cua-nut");
    await p.waitForTimeout(1000);
    const sau = await p.evaluate(() => ({
      cua: !!document.querySelector(".cua"),
      nen: !!document.querySelector(".cua-nen"),
      nav: document.querySelectorAll(".app .nav a").length
    }));
    must(!sau.cua && !sau.nen && sau.nav > 0,
      ten + ": vào được, và cửa gỡ hẳn khỏi DOM",
      "cửa còn=" + sau.cua + " nền còn=" + sau.nen + " điều hướng=" + sau.nav);

    /* 6 · nạp lại thì vẫn ở trong */
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(900);
    must(await oCong(p) && !(await oCua(p)), ten + ": nạp lại vẫn ở trong cổng", "bị đá ra cửa");

    /* 7 · đăng xuất thì về cửa, và nạp lại vẫn ở cửa */
    await p.click("[data-ra]");
    await p.waitForTimeout(1000);
    const raRoi = await oCua(p);
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    must(raRoi && await oCua(p), ten + ": đăng xuất rồi thì nạp lại vẫn ở cửa", "quay lại được vào trong");

    must(!loi.length, ten + ": không lỗi JavaScript nào suốt cả luồng", loi[0]);
    await p.close();
  }

  /* ---------------------------------------------------------------------
     8 · Mỗi lần bị từ chối để lại một dòng nhật ký đăng nhập
     --------------------------------------------------------------------- */
  console.log("\n--- nhật ký ghi được gì");
  {
    /* MỘT context cho cả hai tab. browser.newPage() dựng một context RIÊNG
       mỗi lần, tức hai localStorage khác nhau — tab nội bộ sẽ không thấy
       dòng nhật ký mà tab đối tác vừa ghi. Đã mất mười lăm phút vì chuyện
       này lúc dựng bài kiểm. */
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    await p.goto(G + "khach.html", { waitUntil: "networkidle" });
    await p.waitForTimeout(700);
    for (const e of ["ai-do@vidu.vn", "nguoi-khac@vidu.vn"]) {
      await p.fill("[data-cua-email]", e);
      await p.click(".cua-nut");
      await p.waitForTimeout(200);
    }
    await p.fill("[data-cua-email]", "label1@vidu.vn");
    await p.click(".cua-nut");
    await p.waitForTimeout(900);

    /* Đọc bằng cổng NỘI BỘ vì chỉ nội bộ mới có admin.dangNhap.list */
    const q = await ctx.newPage();
    await q.addInitScript(() => {
      try { sessionStorage.setItem("haustek.phien.internal", JSON.stringify({ email: "mgmt@haustek-group.com" })); } catch (e) {}
    });
    await q.goto(G + "intranet.html", { waitUntil: "networkidle" });
    await q.waitForTimeout(900);
    const ds = await q.evaluate(() => HAUSTEK.admin.dangNhap.list({ gioiHan: 99 }).map(d => ({
      cong: d.cong, ket: d.ket, email: d.email, ip: d.ip, soLan: d.soLan
    })));

    const tuChoi = ds.filter(d => d.ket === "tu-choi" && d.cong === "doi-tac");
    must(tuChoi.length >= 2, "hai email sai khác nhau thành HAI dòng, không gộp làm một",
      tuChoi.length + " dòng bị từ chối, cần ít nhất 2");
    must(tuChoi.some(d => d.email === "ai-do@vidu.vn") && tuChoi.some(d => d.email === "nguoi-khac@vidu.vn"),
      "nhật ký giữ đúng email đã gõ, kể cả email không có tài khoản",
      "email ghi được: " + tuChoi.map(d => d.email).join(", "));
    must(ds.every(d => d.ip === null), "không dòng nào có địa chỉ IP",
      "có dòng mang ip: " + JSON.stringify(ds.find(d => d.ip !== null)));
    must(ds.some(d => d.cong === "doi-tac" && d.ket === "ok"),
      "lần vào thành công cũng được ghi", "không thấy dòng ok nào của cổng đối tác");
    await p.close(); await q.close(); await ctx.close();
  }

  await b.close();
  console.log("\n" + pass + " đạt · " + hong.length + " hỏng");
  process.exit(hong.length ? 1 : 0);
})();
