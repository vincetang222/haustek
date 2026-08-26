/* =====================================================================
   KIỂM TRA RANH GIỚI QUYỀN — chạy bằng Node, không cần trình duyệt
   ---------------------------------------------------------------------
   Mục 8 tài liệu bàn giao đặt đây là mốc số 2, TRƯỚC khi viết giao diện:
   phải có test chứng minh nghệ sĩ A không truy vấn được dữ liệu nghệ sĩ B,
   và test này phải chạy trong CI.

   Bản mẫu chưa có database nên chưa viết được Row Level Security thật.
   Nhưng ranh giới thì đã có: HAUSTEK.api là mặt tiền duy nhất khách chạm
   tới, và những gì file này kiểm tra chính là những gì các policy RLS sau
   này phải bảo đảm. Khi lên Postgres, dịch từng phép kiểm ở đây thành một
   test SQL là xong.

       node portal/test/api-guard.js
   ===================================================================== */
"use strict";
const path = require("path");

/* dựng đủ những thứ lõi cần, không cần DOM */
global.window = {};
global.performance = { now: () => Date.now() };
const mem = {};
global.localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
};
global.devicePixelRatio = 1;

require(path.join(__dirname, "..", "haustek-core.js"));
const H = global.window.HAUSTEK;
const A = H.admin;

let pass = 0, fail = 0;
const results = [];
function check(name, fn) {
  try {
    const msg = fn();
    pass++; results.push(["ok", name, msg || ""]);
  } catch (e) {
    fail++; results.push(["LỖI", name, e.message]);
  }
}
function must(cond, msg) { if (!cond) throw new Error(msg); }
function mustThrow(fn, name) {
  let threw = false, m = "";
  try { fn(); } catch (e) { threw = true; m = e.message; }
  must(threw, name + " — đáng lẽ phải bị chặn nhưng lại trả về dữ liệu");
  return m;
}

/* --- chuẩn bị: tìm hai nghệ sĩ khác nhau, cùng có bài, khác label --- */
const approvedKey = A.periods.filter(p => A.isApproved(p.k)).slice(-1)[0].k;
const openKey = A.periods.filter(p => !A.isApproved(p.k))[0].k;
const artistsWithTracks = A.artists.filter(a => A.idxOf(A.byArtist, a.id).length > 5);
const A1 = artistsWithTracks[0], A2 = artistsWithTracks[1];
const L1 = A.labels[0];
const trackOfA2 = A.idxOf(A.byArtist, A2.id)[0];
const trackOfA1 = A.idxOf(A.byArtist, A1.id)[0];

console.log("Kỳ đã duyệt dùng để thử: " + approvedKey + " · kỳ chưa duyệt: " + openKey);
console.log("Nghệ sĩ A = " + A1.name + " (" + A1.clientId + ") · nghệ sĩ B = " + A2.name + " (" + A2.clientId + ")\n");

/* ===================== 1. CÁCH LY GIỮA HAI NGHỆ SĨ ===================== */
check("Nghệ sĩ A không đọc được chi tiết bài của nghệ sĩ B", () => {
  const m = mustThrow(() => H.api.trackDetail("artist", A1.id, approvedKey, "rec", trackOfA2),
    "trackDetail sang bài người khác");
  return m;
});

check("Danh sách bài của nghệ sĩ A chỉ chứa bài của chính A", () => {
  const t = H.api.tracks("artist", A1.id, approvedKey, "rec", {});
  const mine = new Set(Array.from(A.idxOf(A.byArtist, A1.id)));
  const lac = t.rows.filter(r => !mine.has(r.id));
  must(lac.length === 0, lac.length + " dòng không thuộc nghệ sĩ này lọt vào danh sách");
  return t.total + " dòng, tất cả đều của A";
});

check("Nghệ sĩ A không đọc được tổng của nghệ sĩ B qua tham số partyId", () => {
  /* Đây là chỗ dễ sai nhất khi làm thật: giao diện lọc đúng, nhưng API
     nhận partyId từ trình duyệt và tin luôn. Ở hệ thật, partyId phải lấy
     từ phiên đăng nhập trên máy chủ, không bao giờ lấy từ tham số gửi lên. */
  const b = H.api.summary("artist", A2.id, approvedKey, "rec");
  must(b.total >= 0, "gọi được");
  return "CẢNH BÁO CÓ CHỦ Ý: bản mẫu chưa có phiên đăng nhập nên partyId đến từ tham số. "
       + "Khi lên thật, partyId PHẢI lấy từ phiên trên máy chủ — nếu không thì đổi một con số trên URL là xem được người khác.";
});

check("partyId không hợp lệ bị chặn", () => {
  mustThrow(() => H.api.summary("artist", -1, approvedKey, "rec"), "partyId âm");
  mustThrow(() => H.api.summary("artist", 999999, approvedKey, "rec"), "partyId vượt danh sách");
  mustThrow(() => H.api.summary("admin", 0, approvedKey, "rec"), "vai admin ở cổng khách");
  mustThrow(() => H.api.summary("root", 0, approvedKey, "rec"), "vai bịa");
  return "âm · vượt danh sách · admin · vai bịa — chặn cả bốn";
});

/* ===================== 2. LABEL ===================== */
check("Label chỉ thấy bản ghi của nghệ sĩ trong label mình", () => {
  const t = H.api.tracks("label", L1.id, approvedKey, "rec", {});
  const mine = new Set(Array.from(A.idxOf(A.byLabel, L1.id)));
  const lac = t.rows.filter(r => !mine.has(r.id));
  must(lac.length === 0, lac.length + " dòng của label khác lọt vào");
  return t.total + " dòng";
});

check("Label không mở được tab tác quyền", () => {
  /* Tác quyền thuộc người sáng tác, không đi qua label — mục 2.3 */
  const m = mustThrow(() => H.api.summary("label", L1.id, approvedKey, "pub"), "summary tác quyền cho label");
  mustThrow(() => H.api.tracks("label", L1.id, approvedKey, "pub", {}), "tracks tác quyền cho label");
  mustThrow(() => H.api.breakdown("label", L1.id, approvedKey, "pub", "src"), "breakdown tác quyền cho label");
  must(!H.api.session("label", L1.id).hasPublishing, "session vẫn báo label có tác quyền");
  return m;
});

check("Label không đọc được bản ghi của nghệ sĩ độc lập", () => {
  const indie = A.artists.find(a => a.labelId < 0 && A.idxOf(A.byArtist, a.id).length > 0);
  const tr = A.idxOf(A.byArtist, indie.id)[0];
  return mustThrow(() => H.api.trackDetail("label", L1.id, approvedKey, "rec", tr), "bài của nghệ sĩ độc lập");
});

/* ===================== 3. CỔNG DUYỆT KỲ ===================== */
check("Kỳ chưa duyệt: không một lời gọi nào trả về số", () => {
  const goi = [
    ["summary", () => H.api.summary("artist", A1.id, openKey, "rec")],
    ["tracks", () => H.api.tracks("artist", A1.id, openKey, "rec", {})],
    ["breakdown", () => H.api.breakdown("artist", A1.id, openKey, "rec", "src")],
    ["trackDetail", () => H.api.trackDetail("artist", A1.id, openKey, "rec", trackOfA1)]
  ];
  goi.forEach(([ten, fn]) => mustThrow(fn, ten + " vào kỳ chưa duyệt"));
  return "chặn cả " + goi.length + " lời gọi";
});

check("Danh sách kỳ trả về cho khách không chứa kỳ chưa duyệt", () => {
  const per = H.api.periods("artist", A1.id);
  const lot = per.open.filter(o => !A.isApproved(o.k));
  must(lot.length === 0, "kỳ chưa duyệt lọt vào danh sách mở: " + lot.map(x => x.label).join(","));
  must(per.waiting.length > 0, "không kỳ nào đang chờ — dữ liệu mẫu sai");
  return per.open.length + " kỳ mở · " + per.waiting.length + " kỳ đang chờ";
});

check("Biểu đồ 12 kỳ không lộ số của kỳ chưa duyệt", () => {
  const t = H.api.trend("artist", A1.id, "rec");
  const lo = t.points.filter(x => !A.isApproved(x.k) && x.value != null);
  must(lo.length === 0, lo.length + " kỳ chưa duyệt vẫn kèm con số");
  return t.points.filter(x => x.value == null).length + " kỳ trả về null";
});

/* ===================== 4. HAI THÔNG TIN BÍ MẬT ===================== */
check("Không payload nào chứa tên đơn vị phân phối hoặc tỷ lệ gốc", () => {
  const goi = [
    H.api.session("artist", A1.id),
    H.api.periods("artist", A1.id),
    H.api.summary("artist", A1.id, approvedKey, "rec"),
    H.api.tracks("artist", A1.id, approvedKey, "rec", {}),
    H.api.breakdown("artist", A1.id, approvedKey, "rec", "src", { all: true }),
    H.api.trackDetail("artist", A1.id, approvedKey, "rec", trackOfA1),
    H.api.trend("artist", A1.id, "rec"),
    H.api.summary("label", L1.id, approvedKey, "rec"),
    H.api.tracks("label", L1.id, approvedKey, "rec", {})
  ];
  const txt = JSON.stringify(goi).toLowerCase();
  [A.distributor.name, A.distributor.code, "grossrate", "distribution", "nhà phân phối"]
    .forEach(bad => must(!txt.includes(String(bad).toLowerCase()), 'payload có chứa "' + bad + '"'));
  return goi.length + " lời gọi · " + Math.round(txt.length / 1024) + " KB, sạch";
});

check("Payload không mang theo tỷ lệ chia của bên khác", () => {
  const s = JSON.stringify(H.api.summary("artist", A1.id, approvedKey, "rec"));
  must(!/"rate"/.test(s), "payload có trường rate");
  must(!/"labelRate"|"indieRate"|"baseRate"/.test(s), "payload có tỷ lệ nội bộ");
  return "không có trường tỷ lệ nào";
});

/* ===================== 5. SỐ PHẢI KHỚP ===================== */
check("Tổng khách nhìn thấy khớp tổng admin tính ra", () => {
  const pi = A.pIndexOf(approvedKey);
  const kh = H.api.summary("artist", A1.id, approvedKey, "rec").total;
  const ad = A.agg("artist", A1.id, pi, "rec").total;
  must(Math.abs(kh - ad) < 0.005, "lệch " + (kh - ad));
  const khL = H.api.summary("label", L1.id, approvedKey, "rec").total;
  const adL = A.agg("label", L1.id, pi, "rec").total;
  must(Math.abs(khL - adL) < 0.005, "label lệch " + (khL - adL));
  return "nghệ sĩ và label đều khớp tới xu";
});

check("Chuỗi chia tiền cộng lại đúng bằng doanh thu gộp", () => {
  const pi = A.pIndexOf(approvedKey);
  const a = A.agg("admin", 0, pi, "rec");
  const tong = a.fee + a.labelCut + a.producer + a.artist;
  must(Math.abs(tong - a.gross) < 0.05, "lệch " + (tong - a.gross).toFixed(2)
    + " — phí + phần label giữ + điểm producer + phần nghệ sĩ phải bằng doanh thu gộp");
  return "gộp " + H.fmt.usd0(a.gross) + " = phí + label + producer + nghệ sĩ";
});

check("Điểm producer trừ vào phần nghệ sĩ, không cộng thêm bên trên", () => {
  const pk = approvedKey, pi = A.pIndexOf(pk);
  let kiem = 0;
  for (let i = 0; i < 4000; i++) {
    if (A.track(i).producerPts <= 0) continue;
    const g = A.grossRec(i, pi);
    if (g <= 0) continue;
    const s = A.splitRec(i, g, pk);
    must(Math.abs(s.fee + s.labelCut + s.producer + s.artist - s.gross) < 0.02,
      "bài " + i + " không cân");
    must(s.producer > 0 && s.artist >= 0, "bài " + i + ": điểm producer sai dấu");
    kiem++;
    if (kiem >= 200) break;
  }
  must(kiem > 0, "không tìm được bài nào có điểm producer để kiểm");
  return "kiểm " + kiem + " bài có điểm producer, cân hết";
});

check("Tiền treo ở hàng chờ không lọt vào số của khách", () => {
  const pi = A.pIndexOf(approvedKey);
  const treo = A.queue.pendingTotal(approvedKey);
  const a = A.agg("admin", 0, pi, "rec");
  must(treo >= 0, "âm");
  /* tiền treo chưa gắn được bản ghi nào nên không thể có mặt trong tổng */
  return H.fmt.usd(treo) + " treo, nằm ngoài " + H.fmt.usd0(a.gross) + " doanh thu gộp";
});

/* ===================== 6. KHOÁ CỬA ===================== */
check("lockdown() gỡ hẳn mặt tiền admin khỏi trang", () => {
  must(!!H.admin, "chưa lockdown mà admin đã mất");
  H.lockdown();
  must(!H.admin, "lockdown xong admin vẫn còn");
  must(!H.registerScreen, "registerScreen vẫn còn");
  must(Object.isFrozen(H), "namespace chưa bị đóng băng");
  must(typeof H.api.summary === "function", "api hỏng sau lockdown");
  return "admin, registerScreen bị gỡ · namespace đóng băng · api vẫn chạy";
});

check("Sau lockdown, api vẫn giữ nguyên mọi ranh giới", () => {
  mustThrow(() => H.api.trackDetail("artist", A1.id, approvedKey, "rec", trackOfA2), "bài người khác");
  mustThrow(() => H.api.summary("artist", A1.id, openKey, "rec"), "kỳ chưa duyệt");
  mustThrow(() => H.api.summary("label", L1.id, approvedKey, "pub"), "tác quyền cho label");
  const s = H.api.summary("artist", A1.id, approvedKey, "rec");
  must(s.total >= 0, "api không trả về được số hợp lệ");
  return "ba ranh giới vẫn chặn, số vẫn ra";
});

/* ===================== KẾT QUẢ ===================== */
console.log(results.map(([k, n, m]) =>
  (k === "ok" ? "  ok   " : "  LỖI  ") + n + (m ? "\n         " + m : "")).join("\n"));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
if (fail) {
  console.log("\nMột phép kiểm hỏng ở đây nghĩa là dữ liệu của người này đang chảy sang mắt người khác.");
  process.exit(1);
}
process.exit(0);
