/* =====================================================================
   ROI HỢP ĐỒNG — ĐỐI CHIẾU VỚI BẢNG TÍNH GỐC
   ---------------------------------------------------------------------
   Neo hàm A.roi.tinh vào từng ô của ROI_Haustek.xlsx. Ba sheet còn đọc
   được (Catalog, Trigger 1, Trigger 2) cho ra ba bộ số; mỗi ô ở đây là
   một phép so. Sheet Trigger 3 và sheet Mail Merge trỏ sang hai workbook
   không gửi kèm nên chỉ còn hình dạng công thức, không có số để so.

   Bốn chỗ bảng tính tính lệch thì test này chốt cách tính ĐÚNG, không
   chốt theo số bảng tính in ra:
     · I3 để dấu âm (=(H3/G3)-1 rút gọn ra −B3/G3) → ở đây là số dương.
     · J11 nhân nhầm ô trống nên tổng chi phí luôn 0 → ở đây nhân đủ ba.
     · D7 sheet Catalog không trừ chi phí → ở đây trừ cả chi phí và môi giới.
     · Không sheet nào kiểm thu hồi có kịp trong kỳ hạn → ở đây có.

       node portal/test/roi-cong-thuc.js
   ===================================================================== */
"use strict";
const path = require("path");
global.window = {};
global.performance = { now: () => Date.now() };
const mem = {};
global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
global.devicePixelRatio = 1;
require(path.join(__dirname, "..", "haustek-core.js"));

const H = global.window.HAUSTEK, A = H.admin;
A.provideSecrets({ name: "Kiểm thử", code: "KT" });
A.staff.setMe(A.staff.list().find(x => x.role === "mgmt").id);

let loi = 0, dem = 0;
function must(ok, ten) { dem++; if (!ok) { loi++; console.log("  ✗ " + ten); } }
function gan(ten, duoc, can, eps) { dem++; const ok = Math.abs(duoc - can) <= (eps == null ? 0.005 : eps); if (!ok) { loi++; console.log("  ✗ " + ten + ": được " + duoc + ", cần " + can); } }
function muc(s) { console.log("\n### " + s); }

/* --------- sheet "Catalog ROI." : C2=.74 A3=3300 B3=50000 J3=60 K3=36 --------- */
muc("sheet Catalog ROI");
{
  const k = A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000, artistShare: 0.74, passThrough: 0, termMonths: 60, exclusivityMonths: 36 });
  gan("D3 phần Haustek mỗi tháng", k.companyMonthly, 858);
  gan("D4 phần nghệ sĩ mỗi tháng", k.artistMonthly, 2442);
  gan("E3 và F3 vẫn trả nghệ sĩ", k.passThroughMonthly, 0);
  gan("G3 thu hồi được mỗi tháng", k.recoupableMonthly, 2442);
  gan("H3 số dư sau tháng đầu", k.balanceMonth1, -47558);
  gan("I3 số tháng thu hồi (dương)", k.recoupMonths, 20.5, 0.06);
  gan("D5 hoa hồng cả kỳ hạn", k.totalOverTerm, 51480);
  gan("G7 thu hồi được mỗi năm", k.recoupableYearly, 29304);
  gan("J5 ROI kỳ hạn", k.roiTerm, 1.0296, 1e-4);
  gan("K5 ROI mỗi năm", k.roiYearly, 0.20592, 1e-4);
  gan("J12 ROI sau chi phí", k.roiAfterCosts, 1.0296, 1e-4);
  must(k.recommendation === "approve", "kết luận phải là đạt");
  must(k.shortfall === 0 && k.dat.thuHoiTrongDocQuyen === true, "thu hồi xong trong thời gian độc quyền");
}

/* --------- sheet "Trigger 1 ROI" : C2=.70 A3=3000 B3=50000 J3=58 K3=36 --------- */
muc("sheet Trigger 1 ROI");
{
  const k = A.roi.tinh({ monthlyIncome: 3000, cashAdvance: 50000, artistShare: 0.70, termMonths: 58, exclusivityMonths: 36 });
  gan("D3", k.companyMonthly, 900);
  gan("G3", k.recoupableMonthly, 2100);
  gan("H3", k.balanceMonth1, -47900);
  gan("I3", k.recoupMonths, 23.8, 0.06);
  gan("D5", k.totalOverTerm, 52200);
  gan("G7", k.recoupableYearly, 25200);
  gan("J5", k.roiTerm, 1.044, 1e-4);
  gan("K5", k.roiYearly, 0.216, 1e-4);
  must(k.recommendation === "approve", "kết luận phải là đạt");
}

/* --------- sheet "Trigger 2 ROI " : C2=.75 A3=3000 B3=50000 J3=57-18 K3=33-18 --------- */
muc("sheet Trigger 2 ROI");
{
  const k = A.roi.tinh({ monthlyIncome: 3000, cashAdvance: 50000, artistShare: 0.75, termMonths: 39, exclusivityMonths: 15 });
  gan("D3", k.companyMonthly, 750);
  gan("G3", k.recoupableMonthly, 2250);
  gan("H3", k.balanceMonth1, -47750);
  gan("I3", k.recoupMonths, 22.2, 0.06);
  gan("D5", k.totalOverTerm, 29250);
  gan("G7", k.recoupableYearly, 27000);
  gan("J5", k.roiTerm, 0.585, 1e-4);
  gan("K5", k.roiYearly, 0.18, 1e-4);
  must(k.recommendation === "decline", "thu hồi 22,2 tháng vượt 15 tháng độc quyền nên phải là chưa đạt");
  must(k.dat.thuHoiTrongDocQuyen === false, "cờ thu hồi trong độc quyền phải là sai");
}

/* --------- bốn chỗ tính lại --------- */
muc("bốn chỗ bảng tính tính lệch");
{
  const k = A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000, artistShare: 0.74, termMonths: 60, exclusivityMonths: 36,
    releases: 12, hoursPerRelease: 6, costPerHour: 25, findersFeePct: 0.05 });
  must(k.recoupMonths > 0, "I3 phải dương");
  gan("J11 tổng chi phí = số bản × giờ × đơn giá", k.totalCost, 1800);
  gan("J10 phí môi giới", k.findersFee, 2574);
  gan("D7 trừ cả chi phí và phí môi giới", k.netForCompany, 51480 - 1800 - 2574);
  gan("J12 ROI sau chi phí", k.roiAfterCosts, (51480 - 1800 - 2574) / 50000, 1e-4);

  const xau = A.roi.tinh({ monthlyIncome: 600, cashAdvance: 50000, artistShare: 0.74, termMonths: 24, exclusivityMonths: 12 });
  must(xau.shortfall > 0, "hết kỳ hạn phải còn nợ");
  must(xau.roiNet < xau.roiTerm, "ROI thực phải thấp hơn ROI thô khi còn nợ");
  must(xau.recommendation === "decline", "còn nợ thì phải là chưa đạt");
}

/* --------- ngân sách truyền thông và sản xuất --------- */
muc("ngân sách cộng vào khoản phải thu hồi");
{
  const co = A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000, marketing: 8000, production: 12000, artistShare: 0.74, termMonths: 60 });
  const khong = A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000, marketing: 8000, production: 12000, recoupBudgets: false, artistShare: 0.74, termMonths: 60 });
  gan("có thu hồi thì khoản ứng là 70.000", co.advance, 70000);
  gan("không thu hồi thì khoản ứng vẫn 50.000", khong.advance, 50000);
  must(co.roiTerm < khong.roiTerm, "ứng nhiều hơn thì ROI phải thấp hơn");
}

/* --------- bốn kịch bản: mốc thưởng mở khoá theo HOÀ VỐN --------- */
muc("bốn kịch bản · mốc thưởng mở theo hoà vốn");
{
  const nen = { monthlyIncome: 3300, cashAdvance: 50000, artistShare: 0.74, termMonths: 60, exclusivityMonths: 36 };
  const kb = A.roi.kichBan(Object.assign({}, nen, { triggers: [
    { reach: 3000, multiplier: 16.67, withinMonths: 24 },
    { reach: 5000, multiplier: 12, withinMonths: 24 },
    { reach: 8000, multiplier: 10, withinMonths: 24 } ] }));
  must(kb.rows.length === 4, "phải có bốn dòng");
  must(kb.rows[0].id === "catalog" && kb.rows[0].moKhoa, "dòng đầu là danh mục nền và luôn mở");
  must(kb.rows.every(r => r.moKhoa), "cả ba mốc phải mở với cửa sổ 24 tháng");

  /* mốc i mở đúng ở tháng hoà vốn của khoản ứng NGAY TRƯỚC, và tháng trôi
     cộng dồn từ các lần hoà vốn đó chứ không từ cửa sổ khai trong hợp đồng */
  gan("mốc 1 mở ở tháng hoà vốn của khoản gốc", kb.rows[1].hoaVonTruoc, kb.rows[0].calc.paybackMonth, 0);
  gan("tháng trôi của mốc 1", kb.rows[1].troi, kb.rows[0].calc.paybackMonth, 0);
  gan("mốc 2 mở ở tháng hoà vốn của mốc 1", kb.rows[2].hoaVonTruoc, kb.rows[1].calc.paybackMonth, 0);
  gan("tháng trôi của mốc 2 là cộng dồn", kb.rows[2].troi, kb.rows[1].troi + kb.rows[1].calc.paybackMonth, 0);
  gan("mốc 3 mở ở tháng hoà vốn của mốc 2", kb.rows[3].hoaVonTruoc, kb.rows[2].calc.paybackMonth, 0);
  gan("kỳ hạn còn lại của mốc 1", kb.rows[1].calc.termMonths, 60 - kb.rows[1].troi, 0);
  gan("kỳ hạn còn lại của mốc 3", kb.rows[3].calc.termMonths, 60 - kb.rows[3].troi, 0);
  gan("mốc 3: khoản ứng = 8000 × 10", kb.rows[3].calc.advance, 80000);
  must(kb.tong.advance === kb.rows.filter(r => r.moKhoa).reduce((s, r) => s + r.calc.advance, 0), "tổng khoản ứng chỉ cộng các mốc đã mở");

  /* cửa sổ hẹp hơn thời gian hoà vốn: mốc đó khoá, và mọi mốc sau khoá theo */
  const hep = A.roi.kichBan(Object.assign({}, nen, { triggers: [
    { reach: 3000, multiplier: 16.67, withinMonths: 6 },
    { reach: 5000, multiplier: 12, withinMonths: 24 } ] }));
  must(hep.rows[0].moKhoa, "danh mục nền vẫn phải mở");
  must(!hep.rows[1].moKhoa && /muộn hơn hạn/.test(hep.rows[1].lyDoKhoa.vi), "mốc 1 phải khoá vì hoà vốn muộn hơn cửa sổ");
  must(!hep.rows[2].moKhoa && /Mốc trước/.test(hep.rows[2].lyDoKhoa.vi), "mốc 2 phải khoá dây chuyền theo mốc 1");
  must(hep.rows[1].calc.advance === 0 && hep.rows[2].calc.advance === 0, "mốc bị khoá không được mang khoản ứng");
  gan("tổng khoản ứng chỉ còn khoản gốc", hep.tong.advance, 50000);
  must(hep.moKhoa === 1 && hep.khoaLai === 2, "đếm mở / khoá sai");

  /* khoản gốc không bao giờ hoà vốn thì không mốc nào mở */
  const xau = A.roi.kichBan({ monthlyIncome: 300, cashAdvance: 50000, artistShare: 0.74, termMonths: 24,
    triggers: [{ reach: 3000, multiplier: 10, withinMonths: 24 }] });
  must(!xau.rows[1].moKhoa && /không hoà vốn/.test(xau.rows[1].lyDoKhoa.vi), "gốc không hoà vốn thì mốc 1 phải khoá");

  const trong = A.roi.kichBan(nen);
  must(trong.rows.length === 1 && trong.khoaLai === 0, "không nhập mốc thì chỉ có một dòng");
}

/* --------- số biên --------- */
muc("số biên");
{
  must(A.roi.tinh({}).recommendation === "incomplete", "rỗng thì phải báo còn thiếu số");
  const het = A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000, artistShare: 0.74, passThrough: 1, termMonths: 60 });
  must(het.recoupMonths === null && het.reasons.length > 0, "trả nghệ sĩ 100% thì không thu hồi được và phải nêu lý do");
  const chia0 = A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 0, artistShare: 0.74, termMonths: 60 });
  must(chia0.roiTerm === null && isFinite(chia0.companyMonthly), "khoản ứng bằng 0 thì ROI là null, không phải Infinity");
  const am = A.roi.tinh({ monthlyIncome: -5000, cashAdvance: -100, artistShare: 3, passThrough: -1, termMonths: 0, exclusivityMonths: -9 });
  must(am.monthlyIncome === 0 && am.advance === 0 && am.artistShare === 1 && am.passThrough === 0 && am.termMonths >= 1 && am.exclusivityMonths === 0, "số âm và tỷ lệ quá 100% phải bị kẹp lại");
  const rac = A.roi.tinh({ monthlyIncome: "ba nghìn", cashAdvance: NaN, termMonths: Infinity });
  must(isFinite(rac.companyMonthly) && isFinite(rac.termMonths), "chữ và NaN không được lọt thành NaN");
  A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000, artistShare: 0.74, termMonths: 600 }).series.forEach(s => {
    must(isFinite(s.conNo) && isFinite(s.hoaHong), "mọi điểm trên đường thu hồi phải là số");
  });
  must(A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000, artistShare: 0.74, termMonths: 600 }).series.length <= 74, "đường thu hồi không quá 74 điểm");
}

/* --------- nối với đối tác --------- */
muc("nối với đối tác có sẵn");
{
  const pk = "A:" + A.artists[0].id, d = A.roi.tuDoiTac(pk);
  must(d && d.name === A.artists[0].name, "tuDoiTac trả đúng tên");
  must(d.monthlyIncome >= 0 && d.artistShare > 0 && d.artistShare < 1, "doanh thu tháng và tỷ lệ hưởng hợp lệ");
  must(A.roi.tuDoiTac("A:khong-co-that") === null, "mã đối tác sai thì trả null");
}

/* --------- quyền: ba vai được, hai vai không --------- */
muc("quyền theo vai");
{
  const dsVai = {};
  A.staff.list().forEach(x => { if (!dsVai[x.role]) dsVai[x.role] = x.id; });
  ["sales", "accounting", "mgmt"].forEach(vai => {
    A.staff.setMe(dsVai[vai]);
    let ok = true; try { A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000 }); } catch (e) { ok = false; }
    must(ok, "vai " + vai + " phải gọi được A.roi");
    must(A.quyen.man("roi") === true, "vai " + vai + " phải mở được màn ROI");
  });
  ["ops", "support"].forEach(vai => {
    if (!dsVai[vai]) return;
    A.staff.setMe(dsVai[vai]);
    let chan = false; try { A.roi.tinh({ monthlyIncome: 3300, cashAdvance: 50000 }); } catch (e) { chan = e.code === "NO_QUYEN"; }
    must(chan, "vai " + vai + " phải bị chặn khi gọi A.roi");
    must(A.quyen.man("roi") === false, "vai " + vai + " không được mở màn ROI");
  });
  A.staff.setMe(dsVai.mgmt);
}

/* --------- đối tác ở cổng khách không chạm được --------- */
muc("cổng đối tác không có ROI");
{
  const api = H.api;
  must(api.roi === undefined, "HAUSTEK.api không được có mặt roi");
  must(JSON.stringify(Object.keys(api)).indexOf("roi") < 0, "không khoá nào của api tên roi");
}

console.log("\n" + (loi ? "✗ " + loi + "/" + dem + " phép sai" : "✓ " + dem + "/" + dem + " phép đúng"));
process.exit(loi ? 1 : 0);
