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
/* Điều khoản mẫu, đúng dạng CRM gửi. Deal thật của CRM hầu như luôn kèm
   tạm ứng, nên 16.100 ở đây là con số thực tế — nhưng bước 1 CHƯA nối chân
   tạm ứng, và nay nó từ chối thẳng những deal ấy thay vì nuốt im lặng (mục
   8b). Nên deal() mặc định dùng bản KHÔNG tạm ứng để các phép kiểm khác
   trình được; phép kiểm nào cần khoản tạm ứng thật thì truyền DK vào. */
const DK = { artistSharePct: 70, initialAdvanceUSD: 14000, marketingFundUSD: 2100,
             totalAdvanceUSD: 16100, termMonths: 60, exclusivityMonths: 36, findersFeePct: 0 };
const khongUng = extra => Object.assign({}, DK,
  { initialAdvanceUSD: 0, marketingFundUSD: 0, totalAdvanceUSD: 0 }, extra || {});

function deal(id, extra) {
  return Object.assign({
    dealId: id, dealName: "Deal " + id, account: "Bên nào đó", accountType: "label",
    country: "VN", amountUSD: 18000, closeDate: "2026-09-11", owner: "Ethan Nguyen",
    rights: { dist: true, pub: false, yt: true },
    terms: khongUng(),
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
/* Mỗi phép kiểm cần trình phải có BÊN RIÊNG: lõi từ chối hai đề xuất hợp
   đồng đang chờ cho cùng một bên, nên dùng lại bên cũ thì phép kiểm "bị
   chặn" hoá ra chỉ đang đo cái chặn trùng — xanh vì lý do không liên quan. */
let iBenRieng = 0;
function benRieng() {
  const dung = [BEN.partyKey, BEN2.partyKey];
  const con = HANG.filter(p => dung.indexOf(p.partyKey) < 0);
  return con[iBenRieng++ % con.length];
}
/* Trình một deal rồi trả về câu lỗi (chuỗi rỗng nghĩa là KHÔNG bị chặn). */
function thuTrinh(dealId, terms) {
  A.thuongVu.nhanGoi(goi([deal(dealId, { terms })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === dealId);
  A.thuongVu.ganBen(tv.id, benRieng().partyKey, "Kiểm thử");
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); return ""; }
  catch (e) { return e.message; }
}

check("Tỷ lệ chia vô lý bị chặn, và câu lỗi nêu giá trị nhận được", () => {
  /* Kiểm CẢ CÂU LỖI, không chỉ "có chặn không". Chặn mà nói sai nguyên nhân
     thì người đọc đi sửa nhầm chỗ — và phép kiểm chỉ đòi !ok vẫn xanh kể cả
     khi thứ chặn là một hàng rào khác hẳn. */
  const m = thuTrinh("o20", { artistSharePct: 0, termMonths: 24 });
  must(/artistSharePct/.test(m), "câu lỗi phải gọi đúng tên trường, thấy: " + m);
  must(/50/.test(m) && /97/.test(m), "câu lỗi phải nêu khoảng chấp nhận, thấy: " + m);
  return m.slice(0, 56) + "…";
});

check("Phân số gửi vào chỗ đòi phần trăm bị gọi ĐÚNG TÊN là sai đơn vị", () => {
  /* 0,85 chia 100 ra 0,0085 — lọt mọi kiểm khoảng, rồi bị trần phí 3–50%
     của contractCalc chặn. Chặn thì có chặn, nhưng câu lỗi là "Phí 99,2%
     nằm ngoài khoảng Portal nhận, chốt lại trước khi trình" — tức bảo nhân
     viên đi đàm phán lại với khách, trong khi lỗi thật là CRM gửi sai đơn
     vị. Và nếu ai nới trần phí thì gói sai đơn vị lại đi lọt câm. */
  const m = thuTrinh("o20b", { artistSharePct: 0.85, termMonths: 24 });
  must(/phân số/.test(m), "phải nói đúng là sai đơn vị, thấy: " + m);
  must(!/Chốt lại trước khi trình/.test(m), "không được đổ cho mức phí, thấy: " + m);
  must(/85/.test(m), "phải mách giá trị đúng cần gửi, thấy: " + m);
  return m.slice(0, 56) + "…";
});

/* ---------- 5b. KHÔNG điều khoản tiền nào được biến mất im lặng ----------
   Đề xuất hợp đồng chỉ mang {months, feePct, exclusive, note}. Trường tiền
   nào của CRM không nằm trong đó thì trình đi là mất. Bản trước chỉ soát
   totalAdvanceUSD, nên CRM chỉ cần bỏ trống ô tổng là đúng khoản ấy lại đi
   lọt: đo được {initialAdvanceUSD: 14000, marketingFundUSD: 2100} trình
   thành hợp đồng và 16.100 không đi đâu cả. */
check("Trường tiền KHÔNG có đích đến vẫn bị chặn", () => {
  /* Đây là phần còn sống của chốt chặn: trường tiền mới thêm sau này mà
     chưa ai nối chân thì tự bị chặn, thay vì tự bị nuốt. */
  const m = thuTrinh("o22-x", { artistSharePct: 70, termMonths: 24, bonusPoolUSD: 5000 });
  must(/chưa nối chân/.test(m), "phải chặn vì chưa nối chân, thấy: " + (m || "(không chặn)"));
  must(/5,000/.test(m), "phải nêu đúng số tiền, thấy: " + m);
  return m.slice(0, 50) + "…";
});
[["số âm", -5000], ["chuỗi rác", "nhiều"]].forEach(([ten, v], i) => {
  check("Rác không được tự hiểu thành 0: " + ten, () => {
    /* tvSo() nắn rác và số âm về 0, nên chốt chặn không thấy gì. Một lần
       lật dấu bên CRM là khoản tiền đi mất lặng lẽ.
       Phải kiểm RÁC TRƯỚC rồi mới lọc đích đến: lọc trước thì ba ô tạm ứng
       (vốn CÓ đích đến từ bước 3) không bao giờ được soi, và -5000 lại đi
       lọt câm. Bài này canh đúng thứ tự ấy. */
    const m = thuTrinh("o24-" + i, { artistSharePct: 70, termMonths: 24, totalAdvanceUSD: v });
    must(/không đọc ra số/.test(m), "phải chặn vì không đọc ra số, thấy: " + (m || "(không chặn)"));
    return m.slice(0, 50) + "…";
  });
});
check("Deal sạch vẫn trình được, kể cả khi mọi ô tiền ghi 0", () => {
  const m = thuTrinh("o25", { artistSharePct: 70, termMonths: 24, exclusivityMonths: 0,
                              totalAdvanceUSD: 0, initialAdvanceUSD: 0, marketingFundUSD: 0, findersFeePct: 0 });
  must(m === "", "không được chặn oan, thấy: " + m);
});
[["mép dưới phí 3%", 97], ["mép trên phí 50%", 50]].forEach(([ten, pct], i) => {
  check("Không chặn oan ở " + ten, () => {
    const m = thuTrinh("o26-" + i, { artistSharePct: pct, termMonths: 24 });
    must(m === "", "không được chặn oan, thấy: " + m);
  });
});
check("Thiếu thời hạn thì chặn, không đoán", () => {
  A.thuongVu.nhanGoi(goi([deal("o21", { terms: { artistSharePct: 70 } })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === "o21");
  A.thuongVu.ganBen(tv.id, BEN.partyKey, "Kiểm thử");
  let nem = false;
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); } catch (e) { nem = /thời hạn/.test(e.message); }
  must(nem, "lẽ ra phải chặn");
});

/* ---------- 5c. gói bẩn không được lọt vào kho ---------- */
check("Khoá prototype không mở được cửa nào", () => {
  /* kho[id] với id = "__proto__" trả về Object.prototype — một thứ TRUTHY —
     nên `if (!tv) throw` mở toang và hàm ghi thẳng lên Object.prototype.
     Đo được trước khi sửa: bo("__proto__") không ném, và ngay sau đó MỌI
     object trong hệ mang trangThai "daBo" — kể cả parties, proposals,
     tickets, releases. Mã thương vụ đến từ dữ liệu CRM, không phải chỗ để
     tin. */
  const truoc = ({}).trangThai;
  ["__proto__", "constructor", "toString", "valueOf", "hasOwnProperty"].forEach(k => {
    let nem = false;
    try { A.thuongVu.bo(k, "phá thử", "ke-la"); } catch (e) { nem = /Không có thương vụ/.test(e.message); }
    must(nem, "bo(" + JSON.stringify(k) + ") lẽ ra phải ném");
    try { A.thuongVu.ganBen(k, BEN.partyKey, "ke-la"); } catch (e) { /* phải ném */ }
    try { A.thuongVu.trinh(k, "ke-la", "sales"); } catch (e) { /* phải ném */ }
  });
  must(({}).trangThai === truoc, "Object.prototype bị ghi: ({}).trangThai = " + ({}).trangThai);
  must(({}).khoa === undefined && ({}).lyDo === undefined, "Object.prototype bị ghi khoá/lyDo");
  must(A.parties.list().rows[0].trangThai === undefined, "ô nhiễm lan sang parties");
  return "5 khoá prototype · 3 cửa vào";
});
check("Mã deal phải là chuỗi, không ép kiểu", () => {
  /* String() ép mọi object thành "[object Object]": hai deal khác nhau dồn
     vào MỘT bản ghi, deal trước biến mất không dấu vết, và kết quả trả về
     trông y hệt một lần đồng bộ lại bình thường. */
  const truoc = A.thuongVu.list().length;
  [[{ crm: 1 }, "object"], [true, "boolean"], [123, "number"], [[1, 2], "object"]].forEach(([id, kieu]) => {
    let m = "";
    try { A.thuongVu.nhanGoi(goi([{ dealId: id, dealName: "X" }]), "Kiểm thử"); } catch (e) { m = e.message; }
    must(/không phải chuỗi/.test(m), "dealId kiểu " + kieu + " lẽ ra phải chặn, thấy: " + (m || "(nhận)"));
  });
  let m = "";
  try { A.thuongVu.nhanGoi(goi([{ dealId: "   ", dealName: "X" }]), "Kiểm thử"); } catch (e) { m = e.message; }
  must(/khoảng trắng/.test(m), "mã toàn khoảng trắng phải có câu riêng, thấy: " + (m || "(nhận)"));
  must(A.thuongVu.list().length === truoc, "không được lọt bản ghi nào vào kho");
});
check("Hai deal cùng mã trong MỘT gói bị chặn, không im lặng lấy cái cuối", () => {
  /* Cơ chế đóng băng + ghi lệch chỉ lo xung đột GIỮA các gói. Trong một gói
     thì deal sau rơi vào nhánh "làm mới" và ghi đè deal trước: không lệch,
     không cờ, và {them:1, capNhat:1} trông y hệt một lần đồng bộ hợp lệ. */
  let m = "";
  try {
    A.thuongVu.nhanGoi(goi([{ dealId: "TRUNG", terms: { artistSharePct: 60 } },
                            { dealId: "TRUNG", terms: { artistSharePct: 70 } },
                            { dealId: "TRUNG", terms: { artistSharePct: 80 } }]), "Kiểm thử");
  } catch (e) { m = e.message; }
  must(/xuất hiện 3 lần/.test(m), "phải nêu số lần, thấy: " + (m || "(nhận)"));
  must(!A.thuongVu.list().some(x => x.dealId === "TRUNG"), "không được lọt bản ghi nào");
  return m;
});

/* ---------- 5d. thương vụ đã bỏ là trạng thái kết thúc ---------- */
check("Thương vụ đã bỏ thì KHÔNG trình được — kiểm bằng cách gọi trinh()", () => {
  /* Bài kiểm cũ mang đúng cái tên này nhưng thân bài chưa bao giờ gọi
     trinh(): nó chỉ đọc trangThai và lyDo rồi xanh. Đo được lúc ấy: deal đã
     bỏ vẫn trình thẳng lên bàn giám đốc, mang theo lyDo treo lại mâu thuẫn
     với trạng thái mới. */
  A.thuongVu.nhanGoi(goi([deal("o40", { terms: { artistSharePct: 70, termMonths: 24 } })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === "o40");
  const ben = benRieng();
  A.thuongVu.ganBen(tv.id, ben.partyKey, "Kiểm thử");
  A.thuongVu.bo(tv.id, "Khách đổi ý", "Kiểm thử");
  const soDeXuat = A.proposals.list().length;
  let m = "";
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); } catch (e) { m = e.message; }
  must(/đã bỏ/.test(m), "phải chặn vì đã bỏ, thấy: " + (m || "(trình được)"));
  must(/Khách đổi ý/.test(m), "câu lỗi nên nhắc lý do đã ghi, thấy: " + m);
  must(A.proposals.list().length === soDeXuat, "không được sinh đề xuất nào");
  const lai = A.thuongVu.list().find(x => x.id === tv.id);
  must(lai.trangThai === "daBo" && lai.deXuatId === null, "phải ở lại daBo");
  /* gắn bên và bỏ lần hai cũng phải chặn */
  let m2 = "", m3 = "";
  try { A.thuongVu.ganBen(tv.id, ben.partyKey, "Kiểm thử"); } catch (e) { m2 = e.message; }
  try { A.thuongVu.bo(tv.id, "lý do khác hẳn", "Kiểm thử"); } catch (e) { m3 = e.message; }
  must(/đã bỏ/.test(m2), "gắn bên trên thương vụ đã bỏ phải chặn");
  must(/đã bỏ/.test(m3), "bỏ lần hai phải chặn");
  must(A.thuongVu.list().find(x => x.id === tv.id).lyDo === "Khách đổi ý", "lý do đầu tiên là lý do thật");
  return m.slice(0, 50) + "…";
});

/* ---------- 5e. hồ sơ lệch không lớn mãi ---------- */
check("Gửi lại cùng một bản sửa 60 lần chỉ ghi MỘT dòng lệch", () => {
  /* terms đã đóng băng nên truoc/sau không bao giờ đổi, mà CRM đồng bộ lại
     cả bộ mỗi lần nó lưu. Đo được trước khi sửa: 450 lần → 450 bản ghi
     giống hệt nhau, 149 KB cho MỘT thương vụ trong localStorage. */
  A.thuongVu.nhanGoi(goi([deal("o41", { terms: { artistSharePct: 70, termMonths: 24 } })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === "o41");
  A.thuongVu.ganBen(tv.id, benRieng().partyKey, "Kiểm thử");
  A.thuongVu.trinh(tv.id, "Kiểm thử", "sales");
  for (let i = 0; i < 60; i++)
    A.thuongVu.nhanGoi(goi([deal("o41", { terms: { artistSharePct: 80, termMonths: 24 } })]), "Kiểm thử");
  const sau = A.thuongVu.list().find(x => x.id === tv.id);
  must((sau.lech || []).length === 1, "phải đúng 1 dòng lệch, thấy: " + (sau.lech || []).length);
  must(sau.terms.artistSharePct === 70, "terms phải còn đóng băng ở 70");
  /* bản sửa KHÁC thì vẫn phải ghi thêm */
  A.thuongVu.nhanGoi(goi([deal("o41", { terms: { artistSharePct: 90, termMonths: 24 } })]), "Kiểm thử");
  must((A.thuongVu.list().find(x => x.id === tv.id).lech || []).length === 2, "bản sửa khác phải ghi thêm");
  return "60 lần trùng → 1 dòng · bản sửa khác → 2";
});
check("Đảo thứ tự khoá không phải là lệch", () => {
  /* JSON.stringify giữ nguyên thứ tự khoá, nên terms y hệt mà khác thứ tự
     ra hai chuỗi khác nhau → ghi một dòng lệch OAN với truoc và sau giống
     hệt nhau. */
  A.thuongVu.nhanGoi(goi([deal("o42", { terms: { artistSharePct: 70, termMonths: 24 } })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === "o42");
  A.thuongVu.ganBen(tv.id, benRieng().partyKey, "Kiểm thử");
  A.thuongVu.trinh(tv.id, "Kiểm thử", "sales");
  const r = A.thuongVu.nhanGoi(goi([deal("o42", { terms: { termMonths: 24, artistSharePct: 70 } })]), "Kiểm thử");
  must(r.lech === 0 && r.bo === 1, "phải coi là gửi lại y nguyên, thấy: " + JSON.stringify(r));
  must((A.thuongVu.list().find(x => x.id === tv.id).lech || []).length === 0, "không được ghi lệch oan");
});

/* ---------- 5f. bước 3: một deal sinh HAI đề xuất ---------- */
/* Bên chưa có đề xuất nào đang chờ. Dùng lại bên đã có là phép kiểm "bị
   chặn" hoá ra đang đo cái chặn trùng — xanh vì lý do không liên quan. */
const CHO_XU_LY = ["submitted", "checked", "returned"];
function benRanh() {
  return A.parties.list().rows.find(p => p.partyKey[0] === "L"
    && !A.proposals.list().some(q => q.partyKey === p.partyKey && CHO_XU_LY.indexOf(q.status) >= 0));
}
function trinhDeal(dealId, terms) {
  const ben = benRanh();
  A.thuongVu.nhanGoi(goi([deal(dealId, { terms })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === dealId);
  A.thuongVu.ganBen(tv.id, ben.partyKey, "Kiểm thử");
  return { ben, tv, ra: A.thuongVu.trinh(tv.id, "Kiểm thử", "sales") };
}
const soDu = k => { const a = snap().advances || {}; return a[k] ? a[k].opening : null; };

check("Deal có tạm ứng sinh hai đề xuất, KHÔNG chạm sổ lúc trình", () => {
  /* Đo được trước bước 3: deal mang 16.100 bị chặn thẳng, nên 6/6 deal thật
     của CRM đứng lại ở bước 1 — cầu nối không dùng được. Nay tạm ứng đi qua
     proposeAdvance, đúng cửa duy nhất được phép, và tiền vẫn chỉ chạm sổ ở
     nhánh duyệt (applyApproved CỘNG DỒN, không GÁN ĐÈ như advances.set). */
  const goc = (() => { const b = benRanh(); return { b, truoc: JSON.stringify(soDu(b.partyKey)) }; })();
  const { ben, ra } = trinhDeal("o50", { artistSharePct: 70, termMonths: 24, exclusivityMonths: 12,
    initialAdvanceUSD: 14000, marketingFundUSD: 2100, totalAdvanceUSD: 16100, findersFeePct: 3 });
  must(ra.deXuat.length === 2, "phải có hai đề xuất, thấy " + ra.deXuat.length);
  must(ra.deXuat[0].loai === "hopDong" && ra.deXuat[1].loai === "tamUng", "sai loại đề xuất");
  must(ra.deXuatTamUng.terms.amount === 16100, "tạm ứng phải là 16100, thấy " + ra.deXuatTamUng.terms.amount);
  must(JSON.stringify(soDu(ben.partyKey)) === goc.truoc, "TRÌNH không được chạm sổ tạm ứng");
  /* phí môi giới không có sổ nào bên Portal — phải nằm trong ghi chú, không bị nuốt */
  must(/môi giới 3%/.test(ra.deXuatHopDong.terms.note), "ghi chú phải nêu phí môi giới, thấy: " + ra.deXuatHopDong.terms.note);
  return ra.deXuat.map(x => x.loai + "=" + x.id).join(" · ");
});
check("Duyệt rồi tiền mới vào sổ", () => {
  const { ben, ra } = trinhDeal("o51", { artistSharePct: 70, termMonths: 24, totalAdvanceUSD: 16100 });
  const truoc = soDu(ben.partyKey) || 0;
  ra.deXuat.forEach(d => A.proposals.review(d.id, "approve", "ok", "Giám đốc", "mgmt"));
  const sau = soDu(ben.partyKey) || 0;
  must(sau > truoc, "duyệt xong tiền phải vào sổ, " + truoc + " → " + sau);
  /* CỘNG DỒN, không GÁN ĐÈ: phần tăng phải là khoản mới, không phải khoản
     mới thay chỗ khoản cũ. Đây đúng là lỗi advances.set() từng gây ra. */
  must(sau - truoc >= 16100, "phần tăng phải ít nhất bằng khoản gốc, thấy " + (sau - truoc));
  return truoc + " → " + sau;
});
check("Hợp đồng duyệt mà tạm ứng bị trả thì sổ vẫn trống", () => {
  /* Hai đề xuất độc lập — đúng hình các bạn portal mô tả ở mục 5 tài liệu
     hợp đồng dữ liệu: một cái duyệt, một cái trả. */
  const { ben, ra } = trinhDeal("o52", { artistSharePct: 70, termMonths: 24, totalAdvanceUSD: 16100 });
  /* So TRƯỚC với SAU, không đòi null: bên nào cũng có thể đã có tạm ứng từ
     dữ liệu gieo sẵn, và "vắng mặt" khác "không đổi". */
  const truoc = JSON.stringify(soDu(ben.partyKey));
  ra.deXuat.forEach(d => A.proposals.review(d.id, d.loai === "tamUng" ? "reject" : "approve", "ok", "Giám đốc", "mgmt"));
  must(JSON.stringify(soDu(ben.partyKey)) === truoc, "tạm ứng bị trả thì sổ không được đổi");
  const lai = A.thuongVu.list().find(x => x.dealId === "o52");
  must(lai.deXuat.map(d => d.loai + "=" + d.trangThai).join(" ") === "hopDong=approved tamUng=rejected",
       "tvList phải đọc trạng thái SỐNG, thấy: " + JSON.stringify(lai.deXuat));
  return "hopDong=approved · tamUng=rejected · sổ trống";
});
/* Bốn cách CRM diễn đạt cùng một khoản 16.100 — không được đếm đôi. */
[["đủ ba ô",          { initialAdvanceUSD: 14000, marketingFundUSD: 2100, totalAdvanceUSD: 16100 }, 16100],
 ["bỏ trống ô tổng",  { initialAdvanceUSD: 14000, marketingFundUSD: 2100 },                        16100],
 ["ô tổng = 0",       { initialAdvanceUSD: 14000, marketingFundUSD: 2100, totalAdvanceUSD: 0 },    16100],
 ["chỉ có ô tổng",    { totalAdvanceUSD: 16100 },                                                  16100]
].forEach(([ten, tien, mong], i) => {
  check("Không đếm đôi tạm ứng: " + ten, () => {
    const { ra } = trinhDeal("o53-" + i, Object.assign({ artistSharePct: 70, termMonths: 24 }, tien));
    must(ra.deXuatTamUng && ra.deXuatTamUng.terms.amount === mong,
         "phải là " + mong + ", thấy " + (ra.deXuatTamUng ? ra.deXuatTamUng.terms.amount : "(không có)"));
  });
});
check("Deal không tạm ứng chỉ sinh MỘT đề xuất", () => {
  const { ra } = trinhDeal("o54", { artistSharePct: 70, termMonths: 24, findersFeePct: 2 });
  must(ra.deXuat.length === 1 && ra.deXuat[0].loai === "hopDong", "chỉ được một đề xuất hợp đồng");
  must(ra.deXuatTamUng === null, "không được dựng đề xuất tạm ứng");
});
check("Tạm ứng dưới mức Portal dựng được thì chặn, không dựng nửa vời", () => {
  /* proposeAdvance từ chối dưới $100. Nếu dựng hợp đồng trước rồi mới vấp
     hàng rào ấy thì để lại một đề xuất hợp đồng mồ côi trên bàn giám đốc
     cho một thương vụ vẫn ở trạng thái "moi". Hỏi trước, dựng sau. */
  const ben = benRanh();
  A.thuongVu.nhanGoi(goi([deal("o55", { terms: { artistSharePct: 70, termMonths: 24, totalAdvanceUSD: 50 } })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === "o55");
  A.thuongVu.ganBen(tv.id, ben.partyKey, "Kiểm thử");
  const truoc = A.proposals.list().length;
  let m = "";
  try { A.thuongVu.trinh(tv.id, "Kiểm thử", "sales"); } catch (e) { m = e.message; }
  must(/nhỏ hơn mức tối thiểu/.test(m), "phải chặn vì dưới mức tối thiểu, thấy: " + (m || "(trình được)"));
  must(A.proposals.list().length === truoc, "không được để lại đề xuất mồ côi nào");
  must(A.thuongVu.list().find(x => x.id === tv.id).trangThai === "moi", "thương vụ phải ở lại moi");
  return m.slice(0, 50) + "…";
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

/* ---------- 8. ba chỗ soát vòng 27 ---------- */
/* Mỗi bài dưới đây ghim một lỗi ĐO ĐƯỢC trên bản trước, không phải suy đoán.

   Hai hàm giúp việc: lõi từ chối hai đề xuất hợp đồng đang chờ cho CÙNG một
   bên, nên mỗi phép trình phải có bên riêng. benTrong() cấp phát từ CUỐI
   danh sách để không giẫm lên BEN/BEN2/ben3 mà các mục trên đã dùng. */
const CHUA_DUNG = HANG.map(p => p.partyKey)
  .filter(k => k[0] === "L")
  .reverse();
/* Bên "trống" phải trống CẢ HAI loại đề xuất, không chỉ hợp đồng. Từ bước 3
   một deal có tạm ứng sinh thêm đề xuất tạm ứng, và lõi cũng từ chối hai đề
   xuất tạm ứng đang chờ cho cùng một bên. Bên mang sẵn đề xuất tạm ứng từ dữ
   liệu gieo sẵn mà lọt vào đây thì bài kiểm "phải trình được" hoá ra đang đo
   cái chặn trùng — đỏ vì một lý do không liên quan. */
const CHO_XU_LY_HD = ["submitted", "checked", "returned"];
function benBan(k) {
  return A.proposals.list().some(p => p.partyKey === k && CHO_XU_LY_HD.indexOf(p.status) >= 0);
}
function benTrong() {
  let k;
  while ((k = CHUA_DUNG.shift()) && benBan(k)) { /* bỏ qua bên đang có việc */ }
  if (!k) throw new Error("hết bên trống để kiểm");
  return k;
}
/* Dựng một deal riêng, gắn bên, rồi THỬ trình. Trả kết quả thay vì ném, để
   mỗi bài nói rõ nó chờ đạt hay chờ chặn. */
let demThu = 0;
function trinhThu(pk, terms) {
  const ma = "THU-" + (++demThu);
  A.thuongVu.nhanGoi(goi([deal(ma, { terms: terms })]), "Kiểm thử");
  const tv = A.thuongVu.list().find(x => x.dealId === ma);
  A.thuongVu.ganBen(tv.id, pk, "Kiểm thử");
  try {
    const r = A.thuongVu.trinh(tv.id, "Kiểm thử", "sales");
    /* r.deXuat nay là MẢNG (một deal sinh hai đề xuất). Phép kiểm nào cần
       riêng đề xuất hợp đồng thì lấy deXuatHopDong. */
    return { ok: true, pr: r.deXuatHopDong, prUng: r.deXuatTamUng, ds: r.deXuat, loi: "" };
  } catch (e) { return { ok: false, pr: null, prUng: null, ds: [], loi: e.message }; }
}

/* (a) Đơn vị phần trăm: chia 100 vô điều kiện, không đoán theo độ lớn.
   Bản trước (n > 1 ? n / 100 : n): 85 và 0,85 CÙNG ra phí 0.15 — gói sai
   đơn vị đi lọt y hệt gói đúng, lệch 100 lần, vào thẳng hợp đồng. */
check("Gói sai đơn vị phần trăm bị chặn, không đi lọt như gói đúng", () => {
  const dung = trinhThu(benTrong(), { artistSharePct: 85, termMonths: 24, totalAdvanceUSD: 0 });
  must(dung.ok, "gói đúng chuẩn (85) phải trình được: " + dung.loi);
  must(Math.abs(dung.pr.terms.feePct - 0.15) < 1e-9, "85% cho bên → phí 15%, nhận được " + dung.pr.terms.feePct);

  const sai = trinhThu(benTrong(), { artistSharePct: 0.85, termMonths: 24, totalAdvanceUSD: 0 });
  must(!sai.ok, "gói gửi 0,85 (sai đơn vị) VẪN TRÌNH ĐƯỢC — đây chính là lỗi cũ, lệch 100 lần");

  /* Phần chia thấp không còn bị đo bằng "lớn hơn 1 hay nhỏ hơn 1" nữa: nó
     đi tiếp và được lõi đo bằng đúng thước của lõi. 60% cho bên → phí 40%,
     nằm trong khoảng 3–50% nên qua. */
  const thap = trinhThu(benTrong(), { artistSharePct: 60, termMonths: 24, totalAdvanceUSD: 0 });
  must(thap.ok, "60% cho bên là hợp lệ, không được ném: " + thap.loi);
  must(Math.abs(thap.pr.terms.feePct - 0.40) < 1e-9, "phí phải là 40%, nhận được " + thap.pr.terms.feePct);

  /* 1% thì Haustek giữ 99% — ngoài khoảng lõi nhận. Vẫn phải bị từ chối,
     nhưng bằng câu nói ĐÚNG lý do và nêu mức gần nhất, không phải bằng câu
     "tỷ lệ không hợp lệ" của phép đoán đơn vị cũ. */
  const mot = trinhThu(benTrong(), { artistSharePct: 1, termMonths: 24, totalAdvanceUSD: 0 });
  must(!mot.ok, "1% cho bên nghĩa là Haustek giữ 99% — phải bị chặn");
  must(/99/.test(mot.loi) && /50/.test(mot.loi), "phải nói rõ 99% và mức gần nhất 50%, thấy: " + mot.loi);
  return "85 đạt · 0,85 bị chặn · 60 đạt · 1 chặn đúng lý do";
});

/* (b) Chân tạm ứng chưa nối thì phải TỪ CHỐI, không nuốt im lặng một điều
   khoản tiền. Đo được: deal mang 16.100 trình được thành đề xuất hợp đồng
   và khoản ấy không đi đâu cả. */
check("Thương vụ có tạm ứng đi qua ĐỀ XUẤT, không biến mất và không ghi thẳng", () => {
  /* Trước bước 3, bài này đòi CHẶN: lúc ấy chưa có đường nào nhận khoản
     tiền, nên chặn đúng hơn nuốt. Nhưng đo trên dữ liệu thật của CRM thì
     6/6 deal có điều khoản đều mang tạm ứng — chặn tức là cầu nối không
     dùng được cho deal nào. Bước 3 mở đúng một cửa: proposeAdvance. Khoản
     tiền thành đề xuất thứ hai, giám đốc bấm riêng, và chỉ chạm sổ ở nhánh
     duyệt (applyApproved CỘNG DỒN) — không bao giờ qua advances.set(). */
  const r = trinhThu(benTrong(), DK);   /* điều khoản mẫu: 16.100 tạm ứng */
  must(r.ok, "deal mang 16.100 phải trình được qua đề xuất tạm ứng: " + r.loi);
  must(r.prUng && r.prUng.terms.amount === 16100, "phải có đề xuất tạm ứng 16.100, thấy: "
       + (r.prUng ? r.prUng.terms.amount : "(không có)"));
  must(r.prUng.status === "submitted", "đề xuất tạm ứng phải đang chờ duyệt");
  const con = trinhThu(benTrong(), { artistSharePct: 70, termMonths: 24, totalAdvanceUSD: 0 });
  must(con.ok, "deal không có tạm ứng vẫn phải trình được bình thường: " + con.loi);
  must(con.prUng === null, "deal không tạm ứng không được sinh đề xuất tạm ứng");
  return "có tạm ứng → 2 đề xuất · không tạm ứng → 1";
});

/* Ba ô tạm ứng có ĐÍCH ĐẾN (đề xuất tạm ứng) nên đi tiếp; khoản dưới mức
   tối thiểu và trường tiền KHÔNG có đích đến thì vẫn phải chặn. Bản trước
   chặn tất, kể cả thứ chặn là chặn vĩnh viễn. */
[["tổng tạm ứng",                      { totalAdvanceUSD: 16100 },  16100],
 ["tạm ứng ban đầu, không có ô tổng",   { initialAdvanceUSD: 14000 }, 14000],
 ["quỹ marketing",                      { marketingFundUSD: 2100 },   2100]
].forEach(([ten, tien, mong], i) => {
  check("Tạm ứng đi qua đề xuất, không bị nuốt: " + ten, () => {
    const r = trinhThu(benTrong(), Object.assign({ artistSharePct: 70, termMonths: 24 }, tien));
    must(r.ok, "phải trình được: " + r.loi);
    must(r.prUng && r.prUng.terms.amount === mong, "tạm ứng phải là " + mong + ", thấy "
         + (r.prUng ? r.prUng.terms.amount : "(không có)"));
  });
});
check("Phí môi giới không có sổ nào bên Portal nên KHÔNG chặn, mà ghi vào ghi chú", () => {
  /* findersFeePct chỉ là đầu vào bảng ROI — khoản Haustek trả cho người môi
     giới, không phải số dư của bên cấp quyền. Chặn vì nó là chặn vĩnh viễn,
     vì sẽ không bao giờ có sổ để nối. */
  const r = trinhThu(benTrong(), { artistSharePct: 70, termMonths: 24, findersFeePct: 5 });
  must(r.ok, "không được chặn: " + r.loi);
  must(/môi giới 5%/.test(r.pr.terms.note), "phải ghi vào ghi chú đề xuất, thấy: " + r.pr.terms.note);
});

/* (c) CRM sửa deal rồi gửi lại cùng dealId. Bản trước bỏ qua vô điều kiện,
   nên bản sửa mất hẳn: Portal giữ 70% trong khi CRM tin là đã gửi 80%. */
check("Gửi lại deal đã sửa: chưa trình thì làm mới, đã trình thì ghi lệch", () => {
  const goiSua = pct => goi([deal("GUI-LAI", { terms: { artistSharePct: pct, termMonths: 24, totalAdvanceUSD: 0 } })]);

  A.thuongVu.nhanGoi(goiSua(70), "lần 1");
  const r2 = A.thuongVu.nhanGoi(goiSua(80), "lần 2");
  must(r2.capNhat === 1, "chưa trình mà gửi lại bản sửa thì phải làm mới, nhận được capNhat=" + r2.capNhat);
  let tv = A.thuongVu.list().find(x => x.dealId === "GUI-LAI");
  must(tv.terms.artistSharePct === 80, "điều khoản phải thành 80, còn " + tv.terms.artistSharePct);

  A.thuongVu.ganBen(tv.id, benTrong(), "Kiểm thử");
  A.thuongVu.trinh(tv.id, "Kiểm thử", "sales");

  const r3 = A.thuongVu.nhanGoi(goiSua(90), "lần 3");
  must(r3.lech === 1, "đã trình rồi mà gửi lại thì phải ghi lệch, nhận được lech=" + r3.lech);
  tv = A.thuongVu.list().find(x => x.dealId === "GUI-LAI");
  must(tv.terms.artistSharePct === 80, "đã trình rồi thì điều khoản phải ĐÓNG BĂNG ở 80, thành " + tv.terms.artistSharePct);
  must(tv.lech && tv.lech.length === 1, "phải có đúng một dòng lệch");
  must(tv.lech[0].sau.artistSharePct === 90, "dòng lệch phải giữ lại số CRM gửi tới (90)");
  return "chưa trình thì làm mới · đã trình thì đóng băng và ghi lệch";
});
check("Gửi lại gói Y NGUYÊN vẫn là bỏ qua, không đánh thức gì", () => {
  const goiY = () => goi([deal("Y-NGUYEN", { terms: { artistSharePct: 70, termMonths: 24, totalAdvanceUSD: 0 } })]);
  A.thuongVu.nhanGoi(goiY(), "lần 1");
  const r = A.thuongVu.nhanGoi(goiY(), "lần 2");
  must(r.bo === 1 && r.capNhat === 0 && r.lech === 0,
    "gửi lại y nguyên phải chỉ là bỏ qua, nhận được " + JSON.stringify(r));
});

/* ---------- kết ---------- */
ra.forEach(r => console.log("  " + (r[0] === "ok" ? "ok  " : "LỖI") + "  " + r[1] + (r[2] ? "  → " + r[2] : "")));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
