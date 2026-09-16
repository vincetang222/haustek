/* =====================================================================
   THƯƠNG VỤ TỪ CRM — nhận gói, gắn bên, trình đề xuất
   ---------------------------------------------------------------------
   Bài kiểm quan trọng nhất ở đây là nhóm "không mở đường ghi tiền".

   Bản trước của cầu nối này gọi thẳng advances.set() và rates.add() từ
   phía CRM. advances.set() GÁN ĐÈ số dư gốc, trong khi nhánh duyệt
   applyApproved() CỘNG DỒN — nên một lượt đẩy từ CRM xoá mất khoản tạm
   ứng giám đốc đã duyệt kỳ trước. Đo được, không phải suy đoán.

   Ở đây trinh() chỉ dựng một đề xuất. Nếu ai đó sau này cho nó ghi thẳng
   vào state.advances hay state.rates, nhóm bài kiểm ấy phải đỏ.

       node portal/test/thuong-vu.js
   ===================================================================== */
"use strict";
const KHO = {};
global.window = global;
global.localStorage = {
  getItem: k => (k in KHO ? KHO[k] : null),
  setItem: (k, v) => { KHO[k] = String(v); },
  removeItem: k => { delete KHO[k]; }
};
require("../haustek-core.js");
const H = window.HAUSTEK, A = H.admin;

let pass = 0, fail = 0; const ra = [];
function check(ten, fn) {
  try { const m = fn(); ra.push(["ok", ten, m || ""]); pass++; }
  catch (e) { ra.push(["LỖI", ten, e.message]); fail++; }
}
function must(ok, msg) { if (!ok) throw new Error(msg); }
const snap = () => JSON.parse(H.storage.exportJSON());

/* Một bên có thật để gắn vào. parties.list() trả {total, counts, rows, …}
   và phần tử dùng partyKey — không phải mảng, không phải .key. */
const HANG = A.parties.list().rows;
const BEN = HANG.find(p => p.partyKey[0] === "L") || HANG[0];
/* Bên thứ hai: lõi từ chối hai đề xuất hợp đồng cùng lúc cho CÙNG một bên,
   nên mỗi phép kiểm cần trình phải có bên riêng. */
const BEN2 = HANG.find(p => p.partyKey !== BEN.partyKey && p.partyKey[0] === "L") || HANG[1];

function goi(deals, v) {
  return { v: v || A.thuongVu.goiVer, source: "haustek-crm", at: "2026-09-16T00:00:00.000Z",
           total: deals.length, deals };
}
function deal(id, extra) {
  return Object.assign({
    dealId: id, dealName: "Deal " + id, account: "Bên nào đó", accountType: "label",
    country: "VN", amountUSD: 18000, closeDate: "2026-09-11", owner: "Ethan Nguyen",
    rights: { dist: true, pub: false, yt: true },
    terms: { artistSharePct: 70, initialAdvanceUSD: 14000, marketingFundUSD: 2100,
             totalAdvanceUSD: 16100, termMonths: 60, exclusivityMonths: 36, findersFeePct: 0 },
    portalPartyKey: null
  }, extra || {});
}

/* ---------- 1. phong bì gói ---------- */
check("Gói đúng dấu và đúng phiên bản thì nhận", () => {
  const k = A.thuongVu.kiemGoi(goi([deal("o1")]));
  must(k.ok, k.loi.join(" · "));
  return k.deals.length + " deal";
});
check("Gói không mang dấu haustek-crm bị từ chối", () => {
  const k = A.thuongVu.kiemGoi({ v: "1.0.0", source: "ai-do-khac", deals: [] });
  must(!k.ok, "lẽ ra phải từ chối");
  must(k.loi.some(x => /haustek-crm/.test(x)), "sai lý do: " + k.loi.join(" · "));
});
check("Gói lệch phiên bản LỚN bị từ chối", () => {
  const k = A.thuongVu.kiemGoi(goi([deal("o9")], "2.0.0"));
  must(!k.ok, "lẽ ra phải từ chối");
  must(k.loi.some(x => /phiên bản/.test(x)), "sai lý do: " + k.loi.join(" · "));
});
check("Chuỗi không phải JSON bị từ chối, không ném", () => {
  const k = A.thuongVu.kiemGoi("{ hỏng");
  must(!k.ok && k.loi.length === 1, "lẽ ra báo đúng một lỗi");
});
check("Deal thiếu mã bị chỉ đích danh, deal lành vẫn qua", () => {
  const k = A.thuongVu.kiemGoi(goi([deal("o2"), { dealName: "thiếu mã" }]));
  must(!k.ok, "lẽ ra phải báo lỗi");
  must(k.deals.length === 1, "deal lành phải được giữ, thấy " + k.deals.length);
});

/* ---------- 2. nhận gói ---------- */
check("Nhận gói tạo thương vụ mới", () => {
  const r = A.thuongVu.nhanGoi(goi([deal("o10"), deal("o11")]), "Kiểm thử");
  must(r.them === 2, "nhận được " + r.them);
  return r.ids.join(" · ");
});
check("Nhận lại cùng deal thì BỎ QUA, không nhân đôi", () => {
  const truoc = A.thuongVu.list().length;
  const r = A.thuongVu.nhanGoi(goi([deal("o10"), deal("o12")]), "Kiểm thử");
  must(r.them === 1 && r.bo === 1, "them=" + r.them + " bo=" + r.bo);
  must(A.thuongVu.list().length === truoc + 1, "danh sách phải chỉ dài thêm 1");
});
check("Điều khoản giữ NGUYÊN VĂN theo đơn vị CRM", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  must(tv.terms.artistSharePct === 70, "phải giữ 70, thấy " + tv.terms.artistSharePct);
  must(tv.terms.termMonths === 60, "phải giữ 60 tháng");
});
check("khoaCrm và khoa tách nhau; lúc nhận thì khoa còn trống", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  must(tv.khoa === null, "khoa phải trống lúc nhận, thấy " + tv.khoa);
  must("khoaCrm" in tv, "phải giữ lại điều CRM khai");
});

/* ---------- 3. gắn bên ---------- */
check("Gắn bên không có thật bị chặn", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  let nem = false;
  try { A.thuongVu.ganBen(tv.id, "L:999999", "Kiểm thử"); } catch (e) { nem = true; }
  must(nem, "lẽ ra phải ném");
});
check("Gắn bên có thật thì ghi khoa, và list trả tên bên", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  A.thuongVu.ganBen(tv.id, BEN.partyKey, "Kiểm thử");
  const sau = A.thuongVu.list().find(x => x.id === tv.id);
  must(sau.khoa === BEN.partyKey, "khoa = " + sau.khoa);
  must(sau.tenBen === BEN.name, "tenBen = " + sau.tenBen);
  return BEN.name;
});
check("Chưa gắn bên thì KHÔNG trình được", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o11");
  let nem = false;
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); } catch (e) { nem = /gắn bên/.test(e.message); }
  must(nem, "lẽ ra phải chặn vì chưa gắn bên");
});

/* ---------- 4. KHÔNG MỞ ĐƯỜNG GHI TIỀN ---------- */
check("trinh() KHÔNG đụng vào state.advances", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  const truoc = JSON.stringify(snap().advances);
  A.thuongVu.trinh(tv.id, "Kiểm thử", "sales");
  must(JSON.stringify(snap().advances) === truoc, "sổ tạm ứng đã đổi — đây chính là lỗi cũ");
});
check("trinh() KHÔNG đụng vào state.rates", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o12");
  A.thuongVu.ganBen(tv.id, BEN2.partyKey, "Kiểm thử");
  const truoc = JSON.stringify(snap().rates);
  A.thuongVu.trinh(tv.id, "Kiểm thử", "sales");
  must(JSON.stringify(snap().rates) === truoc, "bảng tỷ lệ đã đổi — rates.add nhắm sai bảng");
});
check("trinh() sinh ra một ĐỀ XUẤT đang chờ, không phải một sổ", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  must(tv.trangThai === "daTrinh", "trạng thái = " + tv.trangThai);
  must(/^DX-/.test(tv.deXuatId), "phải là mã đề xuất, thấy " + tv.deXuatId);
  const pr = A.proposals.get(tv.deXuatId);
  must(pr.status === "submitted", "đề xuất phải đang chờ, thấy " + pr.status);
  return tv.deXuatId;
});
check("Tiền chỉ chạm sổ KHI GIÁM ĐỐC DUYỆT, qua nhánh duyệt sẵn có", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  const truoc = JSON.stringify(snap().contracts[BEN.partyKey] || null);
  A.proposals.review(tv.deXuatId, "approve", "Đồng ý", "Giám đốc", "mgmt");
  const sau = snap().contracts[BEN.partyKey];
  must(JSON.stringify(sau) !== truoc, "duyệt xong hợp đồng phải được ghi");
  must(sau.proposalId === tv.deXuatId, "phải mang mã đề xuất " + tv.deXuatId);
  return "phí " + Math.round(sau.feePct * 100) + "%";
});

/* ---------- 5. quy đổi đơn vị đúng MỘT chỗ ---------- */
check("artistSharePct 70 → phí Haustek 30%, không phải 70%", () => {
  const hd = snap().contracts[BEN.partyKey];
  must(Math.abs(hd.feePct - 0.30) < 1e-9, "feePct = " + hd.feePct + " (lấy nhầm chiều là 0.70)");
});
check("Thời hạn giữ nguyên qua ranh giới quy đổi", () => {
  const hd = snap().contracts[BEN.partyKey];
  must(hd.months === 60, "months = " + hd.months);
});
/* Lỗi thật tìm ra khi viết bộ kiểm này: contractCalc chặn trần 60 tháng,
   mà CRM thường ra deal 72. Trước bản sửa, 72 vào thì hợp đồng ghi 60 và
   không ai biết — CRM đã hứa với khách 72. Nay chặn và bắt người quyết. */
check("Thời hạn 72 tháng của CRM bị CHẶN, không bị cắt câm thành 60", () => {
  A.thuongVu.nhanGoi(goi([deal("o30", { terms: { artistSharePct: 70, termMonths: 72 } })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === "o30");
  const ben3 = HANG.find(p => [BEN.partyKey, BEN2.partyKey].indexOf(p.partyKey) < 0);
  A.thuongVu.ganBen(tv.id, ben3.partyKey, "Kiểm thử");
  /* Bên nào cũng đã có sẵn hợp đồng từ seed, nên kiểm "không ghi gì" phải so
     TRƯỚC với SAU, không phải kiểm vắng mặt. */
  const truoc = JSON.stringify(snap().contracts[ben3.partyKey] || null);
  let msg = "";
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); } catch (e) { msg = e.message; }
  must(/72/.test(msg) && /60/.test(msg), "phải nói rõ 72 và mức gần nhất 60, thấy: " + msg);
  must(JSON.stringify(snap().contracts[ben3.partyKey] || null) === truoc, "hợp đồng không được đổi");
  must(A.thuongVu.list().find(x => x.id === tv.id).trangThai === "moi", "thương vụ phải còn ở trạng thái moi");
  return msg.slice(0, 58) + "…";
});
check("Tỷ lệ chia vô lý bị chặn trước khi thành đề xuất", () => {
  A.thuongVu.nhanGoi(goi([deal("o20", { terms: { artistSharePct: 0, termMonths: 24 } })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === "o20");
  A.thuongVu.ganBen(tv.id, BEN.partyKey, "Kiểm thử");
  let nem = false;
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); } catch (e) { nem = /Tỷ lệ chia/.test(e.message); }
  must(nem, "lẽ ra phải chặn");
});
check("Thiếu thời hạn thì chặn, không đoán", () => {
  A.thuongVu.nhanGoi(goi([deal("o21", { terms: { artistSharePct: 70 } })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === "o21");
  A.thuongVu.ganBen(tv.id, BEN.partyKey, "Kiểm thử");
  let nem = false;
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); } catch (e) { nem = /thời hạn/.test(e.message); }
  must(nem, "lẽ ra phải chặn");
});

/* ---------- 6. không trình hai lần ---------- */
check("Thương vụ đã trình thì không trình lại được", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  let nem = false;
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); } catch (e) { nem = /đã trình/.test(e.message); }
  must(nem, "lẽ ra phải chặn");
});
check("Thương vụ đã trình thì không đổi bên được nữa", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o10");
  let nem = false;
  try { A.thuongVu.ganBen(tv.id, BEN.partyKey, "Kiểm thử"); } catch (e) { nem = /đã trình/.test(e.message); }
  must(nem, "lẽ ra phải chặn");
});

/* ---------- 7. lược đồ và nhật ký ---------- */
check("Hai bảng mới đều khai trong LUOC_DO", () => {
  const ld = H.storage.luocDo();
  must(ld.thuongVu && ld.thuongVu.kieu === "bang", "thuongVu chưa khai đúng");
  must(ld.thuongVuDay && ld.thuongVuDay.kieu === "bang", "thuongVuDay chưa khai đúng");
});
check("Không cần nâng phiên bản lược đồ", () => {
  const tt = H.storage.thongTin();
  must(tt.luocDoVer === snap().luocDoVer, "lược đồ lệch");
});
check("Mỗi bước đều vào nhật ký", () => {
  const nk = snap().audit.map(x => x.action);
  ["thuongVu.nhan", "thuongVu.ganBen", "thuongVu.trinh"].forEach(a =>
    must(nk.includes(a), "thiếu nhật ký " + a));
});
check("Bỏ thương vụ ghi lý do, và không trình được nữa", () => {
  const tv = A.thuongVu.list().find(x => x.dealId === "o11");
  A.thuongVu.bo(tv.id, "Khách đổi ý", "Kiểm thử");
  const sau = A.thuongVu.list().find(x => x.id === tv.id);
  must(sau.trangThai === "daBo" && sau.lyDo === "Khách đổi ý", "trạng thái = " + sau.trangThai);
});
check("Đếm theo trạng thái khớp danh sách", () => {
  const d = A.thuongVu.dem(), ds = A.thuongVu.list();
  must(d.moi === ds.filter(x => x.trangThai === "moi").length, "lệch số 'moi'");
  must(d.daTrinh === ds.filter(x => x.trangThai === "daTrinh").length, "lệch số 'daTrinh'");
  return JSON.stringify(d);
});

/* ---------- kết ---------- */
ra.forEach(r => console.log("  " + (r[0] === "ok" ? "ok  " : "LỖI") + "  " + r[1] + (r[2] ? "  → " + r[2] : "")));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
