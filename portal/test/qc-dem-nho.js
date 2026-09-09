/* =====================================================================
   QC · ĐỆM KHÔNG ĐƯỢC PHÉP THIU
   ---------------------------------------------------------------------
   Đệm làm màn hình nhanh lên nhiều lần, nhưng đổi lại một rủi ro tệ hơn
   chậm: hiện số cũ mà không ai biết. Vòng QC này đã bắt được đúng một ca
   như thế — đổi bảng giá nền tảng xong, chuỗi thu nhập 12 kỳ dùng để tính
   tạm ứng vẫn là số trước khi đổi.

   Nên mỗi hàm có đệm phải chứng minh được: đổi thứ nó phụ thuộc thì số
   nó trả về đổi theo, và trả bảng giá về chỗ cũ thì số cũng về chỗ cũ.

       node portal/test/qc-dem-nho.js
   ===================================================================== */
"use strict";
global.window = global;
require("../haustek-core.js");
const H = window.HAUSTEK, A = H.admin;

let pass = 0, fail = 0; const ra = [];
function check(ten, fn) {
  try { const m = fn(); ra.push(["ok", ten, m || ""]); pass++; }
  catch (e) { ra.push(["LỖI", ten, e.message]); fail++; }
}
function must(ok, msg) { if (!ok) throw new Error(msg); }
const J = v => JSON.stringify(v);

const KY = A.periods.map((p, i) => ({ i, k: p.k, duyet: A.isApproved(p.k) }));
const DUYET = KY.filter(x => x.duyet);
const KY_CUOI = DUYET[DUYET.length - 1];
const DT = A.parties.list().rows;

/* đổi bảng giá một nền tảng rồi trả lại y như cũ */
function doiBangGia(fn) {
  const truoc = A.platformRatesFull().some(r => r.override);
  must(!truoc, "bàn chưa sạch: đã có nền tảng bị ghi đè trước khi thử");
  const s = A.platformRatesFull().find(r => r.name === "Spotify");
  A.setPlatformRate("Spotify", s.derived, "qc", "test", s.derived * 0.6);
  try { return fn(); } finally { A.clearPlatformRate("Spotify", "test"); }
}

/* Đổi bảng giá thì số nào PHẢI đổi theo — bảng giá quyết định gộp ghi nhận,
   nên chuỗi tiền của đối tác đổi hết. */
const PHAI_DOI = [
  ["agg(kỳ)",              () => J(A.agg("admin", 0, KY_CUOI.i, "rec"))],
  ["Mức trả tác động",     () => { const x = A.mucTraTacDong(KY_CUOI.i); delete x.rows; return J(x); }],
  ["chuỗi thu nhập 12 kỳ", () => J(A.partySeries(DT[0].partyKey, 12).map(x => x.net))],
  ["dự báo",               () => J(A.forecast().projected)]
];
/* …và số nào KHÔNG được đổi: tiền NỀN TẢNG trả về là chuyện của nền tảng,
   bảng giá của Haustek không đụng tới nó được. Đây là nửa còn lại của bài
   học vòng 20: hai khái niệm khác nhau thì phải phản ứng khác nhau. */
const PHAI_YEN = [
  ["nền tảng trả về (theo nền tảng)", () => J(A.platformReport().rows.map(r => r.revenue))],
  ["nền tảng nhỏ (đuôi)",             () => J(A.platformTail(KY_CUOI.k).rows.map(r => r.revenue))]
];

PHAI_DOI.forEach(([ten, doc]) => {
  check("Đổi bảng giá thì " + ten + " đổi theo, trả lại thì về đúng chỗ cũ", () => {
    const t0 = doc();
    const t1 = doiBangGia(doc);
    const t2 = doc();
    must(t0 !== t1, "đổi bảng giá mà số không đổi — đệm đang thiu");
    must(t0 === t2, "trả bảng giá về chỗ cũ mà số không về theo");
    return "đổi rồi về, đúng cả hai chiều";
  });
});

PHAI_YEN.forEach(([ten, doc]) => {
  check("Đổi bảng giá KHÔNG được làm " + ten + " nhúc nhích", () => {
    const t0 = doc();
    const t1 = doiBangGia(doc);
    must(t0 === t1, "bảng giá của Haustek làm đổi số nền tảng trả về — hai khái niệm lại lẫn vào nhau");
    return "tiền nền tảng trả về đứng yên, đúng";
  });
});

/* ================================================================= */
check("Nhập thêm số liệu tay thì đối soát và điều kiện chốt kỳ đổi theo", () => {
  const mo = KY.filter(x => !x.duyet)[0];
  must(mo, "không có kỳ chưa duyệt để thử");
  const t0 = J(A.recon(mo.i).rows.map(r => r.attributed));
  const c0 = J(A.approvalChecks(mo.i).map(c => c.ok));
  const f0 = A.feedTotals(mo.i, 0).attributed;
  A.nhapLieu.ghiKy(mo.i, 0, f0 + 1234, { nguon: "onerpm", ghiChu: "qc đệm" }, "test");
  const t1 = J(A.recon(mo.i).rows.map(r => r.attributed));
  const c1 = J(A.approvalChecks(mo.i).map(c => c.ok));
  must(t0 !== t1 || c0 !== c1, "gõ số mới vào mà đối soát lẫn điều kiện chốt đều không nhúc nhích");
  return "đối soát và điều kiện chốt kỳ theo kịp số mới";
});

check("Tạo việc hỗ trợ mới thì chuông thông báo đếm lại", () => {
  const t0 = A.notifications().items.length;
  const dem0 = A.tickets.counts ? J(A.tickets.counts()) : null;
  const dt = DT[0];
  A.tickets.create({ partyKey: dt.partyKey, title: "QC đệm", body: "kiểm đệm thông báo", type: "khac" }, "test");
  const t1 = A.notifications().items.length;
  const dem1 = A.tickets.counts ? J(A.tickets.counts()) : null;
  must(t1 !== t0 || dem1 !== dem0, "thêm việc mới mà chuông vẫn đếm số cũ");
  return "chuông đếm lại sau khi có việc mới";
});

check("Đổi người đăng nhập thì thông báo đổi theo người", () => {
  const me = A.staff.me;
  try {
    const goi = {};
    A.quyen.vaiTatCa.forEach(v => {
      const ai = A.staff.list().find(x => x.role === v && x.active !== false);
      if (!ai) return;
      A.staff.setMe(ai.id);
      goi[v] = A.notifications().items.map(x => x.id).join(",");
    });
    const so = Object.keys(goi).length;
    must(so >= 4, "chỉ đọc được " + so + " vai");
    /* Số có thể trùng nhau một cách hợp lệ, nên so NỘI DUNG chứ không so số. */
    must(new Set(Object.values(goi)).size >= 1, "không đọc được thông báo của vai nào");
    must(new Set(Object.values(goi)).size > 1, "mọi vai nhận ĐÚNG cùng một danh sách thông báo — đệm không phân biệt người");
    return Object.keys(goi).map(v => v + " " + goi[v].split(",").filter(Boolean).length).join(" · ");
  } finally { if (me) A.staff.setMe(me.id); }
});

check("Đệm trả bản sao: người gọi sắp xếp tại chỗ không làm hỏng lần sau", () => {
  const a = A.platformReport();
  const truoc = a.rows.map(r => r.name).join(",");
  a.rows.sort((x, y) => (x.name < y.name ? -1 : 1));      /* cố tình phá */
  a.rows.length = 2;
  const b = A.platformReport();
  must(b.rows.map(r => r.name).join(",") === truoc, "sửa kết quả trả về làm hỏng cả bản trong đệm");
  const c = A.agg("admin", 0, KY_CUOI.i, "rec");
  const g = c.gross; c.gross = -1;
  must(A.agg("admin", 0, KY_CUOI.i, "rec").gross === g, "sửa gói agg làm hỏng bản trong đệm");
  return "sửa bản trả về không đụng tới đệm";
});

check("Hàm có đệm phải là hàm ĐỌC: gọi bao nhiêu lần cũng không ghi gì", () => {
  /* Đệm một hàm có ghi là hỏng theo hai đường cùng lúc: lần sau không chạy
     nữa nên việc không xảy ra, mà mỗi lần chạy lại tự làm chính đệm rụng.
     A.ver() đổi khi và chỉ khi có đường ghi nào chạy, nên gọi hết một lượt
     rồi so là đủ chứng minh. */
  const ky = KY_CUOI;
  const v0 = A.ver();
  const goi = [
    () => A.agg("admin", 0, ky.i, "rec"),
    () => A.forecast(),
    () => A.notifications(),
    () => A.platformReport(),
    () => A.platformTail(ky.k),
    () => A.catalogue({ limit: 25 }),
    () => A.catalogue({ limit: 25, offset: 25 }),
    () => A.quality(),
    () => A.splits(),
    () => A.dailyTrends(28, 8),
    () => A.approvalChecks(ky.i),
    () => A.canApprove(ky.i),
    () => A.feedTotals(ky.i, 0),
    () => A.recon(ky.i),
    () => A.payoutOf(ky.k),
    () => A.mucTraTacDong(ky.i),
    () => A.xuatBan.tongQuan()
  ];
  let n = 0;
  goi.forEach(f => { try { f(); f(); n++; } catch (e) {} });
  must(n >= 14, "chỉ gọi được " + n + " hàm");
  must(A.ver() === v0, "một hàm đọc đang ghi vào trạng thái: " + v0 + " → " + A.ver());
  return n + " hàm đọc · gọi hai lượt · không hàm nào ghi";
});

check("Xét duyệt một kỳ thì mọi con số phụ thuộc kỳ ấy đổi theo", () => {
  const mo = KY.filter(x => !x.duyet)[0];
  const t0 = A.catalogue({ limit: 50 }).rows.map(r => r.revenue).reduce((s, v) => s + v, 0);
  const d0 = A.payoutOf(mo.k);
  let daDuyet = false;
  try { A.approve(mo.k, "test"); daDuyet = true; } catch (e) { /* thiếu điều kiện: bỏ qua */ }
  if (!daDuyet) return "kỳ mở chưa đủ điều kiện chốt, không thử được (không phải lỗi)";
  const t1 = A.catalogue({ limit: 50 }).rows.map(r => r.revenue).reduce((s, v) => s + v, 0);
  const d1 = A.payoutOf(mo.k);
  A.revoke(mo.k, "test");
  must(Math.abs(t1 - t0) > 0.5, "chốt thêm một kỳ mà doanh thu cộng dồn của danh mục không đổi");
  must(!d0 && d1, "chốt kỳ mà bảng chi trả vẫn trống");
  return "chốt kỳ làm danh mục và bảng chi trả đổi theo";
});

/* ===================== KẾT QUẢ ===================== */
console.log(ra.map(([k, n, m]) => (k === "ok" ? "  ok   " : "  LỖI  ") + n + (m ? "\n         " + m : "")).join("\n"));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
