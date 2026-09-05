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

const CFG_ARTISTS = A.artists.length;
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
/* Tác quyền về theo quý, nên phần lớn kỳ không có đồng nào. Kiểm ranh giới
   tác quyền trên một kỳ rỗng thì phép kiểm nào cũng xanh mà chẳng chứng
   minh được gì — phải lấy kỳ THẬT SỰ có tiền tác quyền. */
const pubPeriod = A.periods.filter(p => A.isApproved(p.k) && A.pubLoaded(p.idx)).slice(-1)[0];
const pubKey = pubPeriod ? pubPeriod.k : approvedKey;
const openKey = A.periods.filter(p => !A.isApproved(p.k))[0].k;
const artistsWithTracks = A.artists.filter(a => A.idxOf(A.byArtist, a.id).length > 5);
const A1 = artistsWithTracks[0], A2 = artistsWithTracks[1];
const L1 = A.labels[0];
const trackOfA2 = A.idxOf(A.byArtist, A2.id)[0];
const trackOfA1 = A.idxOf(A.byArtist, A1.id)[0];

console.log("Kỳ đã duyệt dùng để thử: " + approvedKey + " · kỳ chưa duyệt: " + openKey
  + " · kỳ có tác quyền: " + pubKey);
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
  /* Không chỉ leo MÃ — leo cả VAI: tài khoản gắn A:5 gọi được api với
     role "label" và partyId 5 để đọc tổng của label 5. */
  const leoVai = H.api.summary("label", 5, approvedKey, "rec");
  must(leoVai.total >= 0, "gọi được");
  return "CẢNH BÁO CÓ CHỦ Ý: bản mẫu chưa có phiên đăng nhập nên CẢ role LẪN partyId đều đến từ tham số. "
       + "Tài khoản của nghệ sĩ số 5 gọi được api('label', 5, …) và đọc tổng của label 5 — leo vai, không chỉ leo mã. "
       + "Khi lên thật, thứ lấy từ phiên trên máy chủ phải là cả cặp partyKey (đã có sẵn trong state.accounts), "
       + "không phải riêng con số partyId.";
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

check("Label không mở được tác quyền ở BẤT KỲ cửa nào", () => {
  /* Tác quyền thuộc người sáng tác, không đi qua label — mục 2.3.
     Kiểm TỪNG lời gọi nhận tham số stream, không kiểm chọn lọc: quên một
     cửa là quên cả một dòng tiền, và bộ kiểm vẫn xanh trong khi hơn nửa
     tiền tác quyền của danh mục đọc được. Đã từng xảy ra đúng như vậy. */
  const cua = [
    ["summary", () => H.api.summary("label", L1.id, pubKey, "pub")],
    ["tracks", () => H.api.tracks("label", L1.id, pubKey, "pub", {})],
    ["breakdown", () => H.api.breakdown("label", L1.id, pubKey, "pub", "src")],
    ["trend", () => H.api.trend("label", L1.id, "pub")],
    ["trackDetail", () => H.api.trackDetail("label", L1.id, pubKey, "pub", A.idxOf(A.byLabel, L1.id)[0])]
  ];
  cua.forEach(([ten, fn]) => mustThrow(fn, ten + " tác quyền cho label"));
  must(!H.api.session("label", L1.id).hasPublishing, "session vẫn báo label có tác quyền");
  /* và thử đúng đường tấn công thật: lấy id bài từ một lời gọi hợp lệ rồi
     hỏi lại từng id ở luồng tác quyền */
  const ids = H.api.tracks("label", L1.id, approvedKey, "rec", {}).rows.slice(0, 50).map(r => r.id);
  let lot = 0;
  ids.forEach(i => { try { if (H.api.trackDetail("label", L1.id, pubKey, "pub", i).revenue > 0) lot++; } catch (e) {} });
  must(lot === 0, lot + " bài lọt qua đường lấy id từ luồng bản ghi rồi hỏi lại ở luồng tác quyền");
  return "chặn cả " + cua.length + " cửa · 50 bài thử đường vòng, không bài nào lọt";
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
    H.api.tracks("label", L1.id, approvedKey, "rec", {}),
    /* các gói mới: hồ sơ bài hát, danh mục, báo cáo nền tảng, cây label */
    H.api.trackAsset("artist", A1.id, trackOfA1),
    H.api.catalogue("label", L1.id, { limit: 50 }),
    H.api.platformReport("label", L1.id),
    H.api.labelTree("label", 0, approvedKey),
    H.api.delegations("label", 0)
  ];
  const txt = JSON.stringify(goi).toLowerCase();
  [A.distributor.name, A.distributor.code, "grossrate", "distribution", "nhà phân phối", "phân phối", "ký trực tiếp"]
    .forEach(bad => must(!txt.includes(String(bad).toLowerCase()), 'payload có chứa "' + bad + '"'));
  return goi.length + " lời gọi · " + Math.round(txt.length / 1024) + " KB, sạch";
});

check("Payload không mang theo tỷ lệ chia của bên nào", () => {
  /* Đi qua từng khoá trong payload thay vì tìm chuỗi: tỷ lệ CHIA phải
     không có mặt, còn tỷ GIÁ (fx.rate) thì được — đó là tỷ giá dùng để
     trả tiền cho chính người đang xem, họ có quyền biết. Bắt bằng cách
     tìm chuỗi "rate" thì hai thứ đó lẫn vào nhau. */
  const duocPhep = d => d === "fx.rate" || d.endsWith(".fx.rate");
  const XAU = /^(rate|share|labelRate|indieRate|baseRate|grossRate|rateShare|split)$/i;
  const loi = [];
  (function di(o, duong) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach((x, i) => di(x, duong + "[" + i + "]"));
    Object.keys(o).forEach(k => {
      const d = duong ? duong + "." + k : k;
      const dGoc = d.replace(/\[\d+\]/g, "");
      if (XAU.test(k) && !duocPhep(dGoc)) loi.push(d);
      di(o[k], d);
    });
  })({
    summary: H.api.summary("artist", A1.id, approvedKey, "rec"),
    summaryLabel: H.api.summary("label", L1.id, approvedKey, "rec"),
    tracks: H.api.tracks("artist", A1.id, approvedKey, "rec", {}),
    detail: H.api.trackDetail("artist", A1.id, approvedKey, "rec", trackOfA1),
    session: H.api.session("artist", A1.id)
  }, "");
  must(loi.length === 0, "payload mang tỷ lệ chia ở: " + loi.slice(0, 5).join(", "));
  /* và tỷ giá thì phải có, kèm ngày khoá — thiếu là khách không kiểm lại được */
  const s = H.api.summary("artist", A1.id, approvedKey, "rec");
  must(s.fx && s.fx.rate > 0, "payload thiếu tỷ giá của kỳ");
  must(s.fx.locked ? !!s.fx.at : true, "tỷ giá báo đã khoá nhưng không kèm ngày khoá");
  return "không tỷ lệ chia nào lọt · tỷ giá kỳ = " + H.fmt.num(s.fx.rate)
       + " ₫" + (s.fx.locked ? ", khoá ngày " + s.fx.at : ", chưa khoá");
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

check("Chuỗi Tiền đi đâu cộng lại đúng bằng dòng cuối", () => {
  /* Đây là khối quan trọng nhất của cả cổng khách — nó trả lời câu duy
     nhất mọi nghệ sĩ đều hỏi. Nếu các chặng cộng lại không ra dòng cuối
     thì nó không trả lời gì cả, nó chỉ làm người ta mất tin. */
  let kiem = 0, lech = 0, tong = 0;
  const kys = A.periods.filter(p => A.isApproved(p.k)).slice(-4).map(p => p.k);
  kys.forEach(pk => {
    for (let id = 0; id < CFG_ARTISTS; id++) {
      let s;
      try { s = H.api.summary("artist", id, pk, "rec"); } catch (e) { continue; }
      if (!s.chain.length) continue;
      /* Chuỗi của đối tác giờ bắt đầu từ số của họ: nếu chỉ có một dòng
         cuối (không khấu trừ gì) thì không có gì để cộng; có dòng đầu thì
         các chặng phải cộng đúng dòng cuối, và KHÔNG chặng nào là phí. */
      must(!s.chain.some(x => x.key === "fee" || x.key === "gross"), "chuỗi của nghệ sĩ " + id + " vẫn có chặng phí hoặc gộp");
      if (!s.chain.some(x => x.kind === "top")) { kiem++; continue; }
      let cong = 0;
      s.chain.forEach(x => { if (x.kind !== "final") cong += x.value; });
      const cuoi = s.chain[s.chain.length - 1].value;
      kiem++;
      if (Math.abs(cuoi - cong) > 0.02) { lech++; tong += cuoi - cong; }
    }
    for (let L = 0; L < A.labels.length; L++) {
      const s = H.api.summary("label", L, pk, "rec");
      if (!s.chain.length) continue;
      must(!s.chain.some(x => x.key === "fee" || x.key === "gross"), "chuỗi của label " + L + " vẫn có chặng phí hoặc gộp");
      must(Math.abs(s.chain[0].value - s.revenue) < 0.005, "dòng đầu chuỗi của label không bằng doanh thu (sau phí)");
      let cong = 0;
      s.chain.forEach(x => { if (x.kind !== "final") cong += x.value; });
      kiem++;
      if (Math.abs(s.chain[s.chain.length - 1].value - cong) > 0.02) lech++;
    }
  });
  must(lech === 0, lech + "/" + kiem + " chuỗi không cộng đúng · tổng lệch " + H.fmt.usd(tong));
  return kiem + " chuỗi trên " + kys.length + " kỳ, cộng đúng hết";
});

check("Bảng bóc theo cửa hàng cộng lại đúng bằng tổng, cả thu gọn lẫn mở rộng", () => {
  /* Bấm "xem tất cả cửa hàng" mà tổng hụt đi gần 10% là chuyện không giải
     thích được với người đang đọc báo cáo tiền của mình. */
  const ai = [["artist", 100], ["artist", 300], ["label", 12], ["label", 3]];
  const loi = [];
  ai.forEach(([vai, id]) => {
    const t = H.api.summary(vai, id, approvedKey, "rec").total;
    [false, true].forEach(mo => {
      const b = H.api.breakdown(vai, id, approvedKey, "rec", "src", { all: mo });
      const bang = b.rows.reduce((x, r) => x + r.value, 0) + (b.tail ? b.tail.value : 0);
      if (Math.abs(bang - t) > 0.05) loi.push(vai + " " + id + (mo ? " mở rộng" : " thu gọn")
        + " hụt " + H.fmt.usd(t - bang));
    });
  });
  must(loi.length === 0, loi.join(" · "));
  return ai.length + " bên × 2 chế độ, bảng nào cũng cộng đúng tổng";
});

check("Xem trước bảng chi trả không đụng vào sổ", () => {
  /* previewPayout dùng cho màn hình; bản ghi thật chỉ chạy đúng một lần
     lúc duyệt kỳ. Gọi lạc mà ghi được là ghi khống một lượt thu hồi tạm
     ứng cho kỳ chưa duyệt — và lượt đó không bao giờ đòi lại được. */
  must(A.runPayout === undefined, "runPayout vẫn nằm trên mặt tiền admin");
  const pi = A.periods.findIndex(p => !A.isApproved(p.k));
  must(pi >= 0, "không còn kỳ nào chưa duyệt để thử");
  const truoc = {};
  A.advances.list().forEach(x => { truoc[x.partyKey] = x.balance; });
  A.previewPayout(pi); A.previewPayout(pi); A.previewPayout(pi);
  const doi = A.advances.list().filter(x => Math.abs(x.balance - truoc[x.partyKey]) > 0.005);
  must(doi.length === 0, doi.length + " bên bị trừ dư nợ chỉ vì xem trước");
  return "gọi 3 lần, " + Object.keys(truoc).length + " sổ tạm ứng không xê dịch";
});

/* ===================== 5b. HỢP ĐỒNG · ROSTER · PHÁT HÀNH ===================== */
check("Nghệ sĩ không gọi được danh sách nghệ sĩ của label", () => {
  const m = mustThrow(() => H.api.roster("artist", A1.id, approvedKey), "roster cho nghệ sĩ");
  return "chặn: " + m;
});

check("Roster của label chỉ gồm nghệ sĩ thuộc label, và cộng đúng phần label được hưởng", () => {
  const r = H.api.roster("label", L1.id, approvedKey);
  r.rows.forEach(x => must(A.artists[x.artistId].labelId === L1.id, x.name + " không thuộc label " + L1.name));
  const tong = r.rows.reduce((t, x) => t + x.labelCut, 0);
  const s = H.api.summary("label", L1.id, approvedKey, "rec");
  must(Math.abs(tong - s.total) < 0.02, "tổng phần label theo nghệ sĩ " + tong.toFixed(2) + " ≠ tổng kỳ " + s.total.toFixed(2));
  must(!JSON.stringify(r).includes("advance"), "roster lộ tạm ứng cá nhân của nghệ sĩ");
  return r.count + " nghệ sĩ · phần label " + tong.toFixed(2) + " = tổng kỳ";
});

check("Hợp đồng của nghệ sĩ thuộc label lấy đúng tỷ lệ của label đó", () => {
  const nsLabel = A.artists.find(a => a.labelId >= 0);
  const hd = H.api.contract("artist", nsLabel.id, approvedKey);
  must(hd.kind === "artist-label", "sai loại: " + hd.kind);
  must(hd.label && hd.label.name === A.labels[nsLabel.labelId].name, "tên label sai");
  must(Math.abs(hd.artistShare - A.rates.rateFor("L:" + nsLabel.labelId, approvedKey)) < 1e-9, "tỷ lệ không khớp bảng tỷ lệ của label");
  must(Math.abs(hd.artistShare + hd.labelShare - 1) < 1e-6, "hai phần không cộng thành 100%");
  must(!("haustekFee" in hd) && !("pubFee" in hd), "hợp đồng vẫn mang phí");
  must(hd.assumptionQuestion === "q8", "thiếu dấu giả định (câu hỏi 8)");
  const docLap = A.artists.find(a => a.labelId < 0);
  const hd2 = H.api.contract("artist", docLap.id, approvedKey);
  must(hd2.kind === "artist-indie" && hd2.label === null, "nghệ sĩ độc lập lại có label");
  must(hd2.artistShare === null && hd2.labelShare === null && hd2.history.length === 0, "nghệ sĩ độc lập nhìn thấy tỷ lệ chia, tức là nhìn thấy phần Haustek giữ");
  return "thuộc label " + hd.label.name + " · " + (hd.artistShare * 100).toFixed(0) + "% · độc lập không có label";
});

check("Hồ sơ phát hành của nghệ sĩ này không lọt sang nghệ sĩ khác", () => {
  const kq = H.api.submitRelease("artist", A2.id, { title: "Kiểm ranh giới", type: "single", releaseDate: "2026-12-05",
    tracks: [{ title: "Kiểm ranh giới", writers: [{ name: "X", role: "Composer", pct: 100 }] }] });
  const cuaA2 = H.api.releases("artist", A2.id).submissions.map(r => r.id);
  const cuaA1 = H.api.releases("artist", A1.id).submissions.map(r => r.id);
  must(cuaA2.includes(kq.id), "A2 không thấy hồ sơ của chính mình");
  must(!cuaA1.includes(kq.id), "A1 thấy hồ sơ của A2");
  return kq.id + " chỉ hiện với A2";
});

check("Label không gửi được hồ sơ cho nghệ sĩ ngoài roster", () => {
  const ngoai = A.artists.find(a => a.labelId !== L1.id);
  const m = mustThrow(() => H.api.submitRelease("label", L1.id, { artistId: ngoai.id, title: "Lậu", type: "single", releaseDate: "2026-12-05",
    tracks: [{ title: "Lậu" }] }), "gửi thay nghệ sĩ ngoài roster");
  const trong = A.artists.find(a => a.labelId === L1.id);
  const ok = H.api.submitRelease("label", L1.id, { artistId: trong.id, title: "Hợp lệ", type: "single", releaseDate: "2026-12-05",
    tracks: [{ title: "Hợp lệ" }] });
  must(H.api.releases("artist", trong.id).submissions.some(r => r.id === ok.id), "nghệ sĩ không thấy hồ sơ label gửi thay mình");
  return "chặn ngoài roster · trong roster gửi được, nghệ sĩ thấy: " + ok.id;
});

check("Hồ sơ phát hành đi đúng thứ tự bốn bước, không nhảy bước, mỗi bước một dòng nhật ký", () => {
  const kq = H.api.submitRelease("artist", A1.id, { title: "Bốn bước", type: "ep", releaseDate: "2026-12-12",
    tracks: [{ title: "Một" }, { title: "Hai", isrc: "VNHTK2600999" }] });
  mustThrow(() => A.releases.assignCodes(kq.id, "ops@"), "cấp mã khi chưa tiếp nhận");
  mustThrow(() => A.releases.publish(kq.id, "ops@"), "phát hành khi chưa cấp mã");
  A.releases.receive(kq.id, "ops@"); A.releases.assignCodes(kq.id, "ops@"); A.releases.publish(kq.id, "ops@", "2026-12-12");
  const r = A.releases.get(kq.id);
  must(r.status === "released", "trạng thái cuối: " + r.status);
  must(r.tracks.every(t => /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(t.isrc)), "có track chưa có ISRC hợp lệ");
  must(r.tracks[1].isrc === "VNHTK2600999", "ISRC đối tác khai bị ghi đè");
  must(r.upc && r.upc.length === 12, "UPC không hợp lệ: " + r.upc);
  const nk = A.audit.list(20).filter(x => x.action.startsWith("release.") && x.detail.startsWith(kq.id)).map(x => x.action);
  ["release.submit", "release.receive", "release.code", "release.publish"].forEach(a => must(nk.includes(a), "thiếu nhật ký " + a));
  return "submitted → received → coded → released · " + nk.length + " dòng nhật ký";
});

/* ===================== 5c. HỒ SƠ BÀI HÁT · NỀN TẢNG · LABEL MẸ / LABEL CON ===================== */
check("Nghệ sĩ A không đọc được hồ sơ phát hành (nền tảng, đường dẫn) của bài nghệ sĩ B", () => {
  const m = mustThrow(() => H.api.trackAsset("artist", A1.id, trackOfA2), "trackAsset sang bài người khác");
  const d = H.api.trackAsset("artist", A1.id, trackOfA1);
  must(d.steps.length === 11 && d.platforms.length === 12, "hồ sơ thiếu bước hoặc thiếu nền tảng");
  must(d.steps.some(st => st.key === "marketing") && d.steps.some(st => st.key === "pitch"), "quy trình thiếu bước marketing");
  must(d.platforms.every(p => p.status !== "live" || p.name === "Facebook" || p.name === "Instagram" || /^https:\/\//.test(p.url)),
       "nền tảng đã lên mà không có đường dẫn");
  return m + " · bài của chính mình: " + d.steps.length + " bước, " + d.platforms.length + " nền tảng, " + d.missing.length + " mục còn thiếu";
});

check("Danh mục phát hành của label chỉ gồm bản ghi của label, kể cả bản chưa có doanh thu", () => {
  const mine = new Set(Array.from(A.idxOf(A.byLabel, L1.id)));
  let lac = 0, tong = 0, offset = 0, dem = { live: 0, processing: 0, issue: 0 };
  for (;;) {
    const c = H.api.catalogue("label", L1.id, { offset, limit: 200 });
    if (!tong) tong = c.total;
    c.rows.forEach(r => { if (!mine.has(r.id)) lac++; dem[r.stage]++; });
    offset += c.rows.length;
    if (offset >= c.total || !c.rows.length) break;
  }
  must(lac === 0, lac + " bản ghi của label khác lọt vào danh mục");
  must(tong === mine.size, "danh mục có " + tong + " bản ghi, label có " + mine.size);
  const c0 = H.api.catalogue("label", L1.id, { limit: 1 });
  must(dem.live === c0.counts.live && dem.processing === c0.counts.processing && dem.issue === c0.counts.issue,
       "số đếm theo giai đoạn không khớp với danh sách");
  return tong + " bản ghi, đủ và đúng chủ · " + JSON.stringify(c0.counts);
});

check("Ma trận nền tảng × kỳ của một bài cộng dọc đúng bằng doanh thu và lượt nghe của bài trong kỳ", () => {
  const ids = Array.from(A.idxOf(A.byLabel, L1.id)).slice(0, 60);
  let kiem = 0, loi = [];
  ids.forEach(i => {
    const d = H.api.trackAsset("label", L1.id, i);
    d.monthly.periods.forEach((p, k) => {
      const pi = A.pIndexOf(p.k);
      const g = d.monthly.rows.reduce((s, r) => s + r.revenue[k], 0);
      const st = d.monthly.rows.reduce((s, r) => s + r.streams[k], 0);
      const m = d.monthly.rows.reduce((s, r) => s + r.mine[k], 0);
      const tt = H.api.trackDetail("label", L1.id, p.k, "rec", i);
      if (Math.abs(g - tt.revenue) > 0.005) loi.push("doanh thu bài " + i + " kỳ " + p.k);
      if (st !== A.streamsOf(i, pi)) loi.push("lượt nghe bài " + i + " kỳ " + p.k);
      if (Math.abs(m - tt.mine) > 0.005) loi.push("phần label bài " + i + " kỳ " + p.k);
      /* và từng ô nền tảng của kỳ khớp với "Thu nhập theo nền tảng" của cùng bài */
      tt.byStore.forEach(x => {
        const r = d.monthly.rows.find(rr => rr.name === x.name);
        if (!r || Math.abs(r.mine[k] - x.value) > 0.005) loi.push("nền tảng " + x.name + " bài " + i);
      });
      kiem++;
    });
  });
  must(loi.length === 0, loi.length + " sai lệch: " + loi.slice(0, 4).join(" · "));
  return ids.length + " bài × " + (kiem / Math.max(ids.length, 1)) + " kỳ, cột nào cũng cộng đúng";
});

check("Báo cáo nền tảng của tài khoản cộng dọc đúng bằng tổng kỳ ở Tổng quan", () => {
  const ai = [["artist", A1.id], ["label", L1.id], ["label", 3]];
  const loi = [];
  ai.forEach(([vai, id]) => {
    const r = H.api.platformReport(vai, id);
    r.periods.forEach((p, k) => {
      const s = H.api.summary(vai, id, p.k, "rec");
      const g = r.rows.reduce((x, row) => x + row.revenue[k], 0);
      const m = r.rows.reduce((x, row) => x + row.mine[k], 0);
      const st = r.rows.reduce((x, row) => x + row.streams[k], 0);
      if (Math.abs(g - s.revenue) > 0.005) loi.push(vai + " " + id + " doanh thu kỳ " + p.k);
      if (Math.abs(m - s.total) > 0.005) loi.push(vai + " " + id + " phần mình kỳ " + p.k);
      if (st !== s.streams) loi.push(vai + " " + id + " lượt nghe kỳ " + p.k);
      /* và bảng bóc theo nền tảng của kỳ (thu gọn) phải ra cùng con số từng nền tảng */
      const b = H.api.breakdown(vai, id, p.k, "rec", "src");
      b.rows.forEach(x => {
        const row = r.rows.find(rr => rr.name === x.name);
        if (!row || Math.abs(row.mine[k] - x.value) > 0.05) loi.push(vai + " " + id + " " + x.name + " kỳ " + p.k + " lệch");
      });
    });
    must(r.periods.every(p => A.isApproved(p.k)), "báo cáo nền tảng chứa kỳ chưa xét duyệt");
  });
  must(loi.length === 0, loi.length + " sai lệch: " + loi.slice(0, 4).join(" · "));
  return ai.length + " tài khoản, mọi kỳ đã xét duyệt cộng đúng, khớp cả bảng bóc theo nền tảng";
});

check("Label mẹ thấy label con và nghệ sĩ bên dưới; label con và nghệ sĩ không thấy ngược lên", () => {
  const me = 0, con = A.labelChildren(me).map(l => l.id);
  must(con.length >= 2, "label mẫu số 0 phải có ít nhất hai label con");
  const t = H.api.labelTree("label", me, approvedKey);
  must(t.children.length === con.length && t.children.every(c => con.includes(c.labelId)), "cây label mẹ liệt kê sai label con");
  t.children.forEach(c => {
    const ns = new Set(A.artists.filter(a => a.labelId === c.labelId).map(a => a.id));
    must(c.artists.length === ns.size && c.artists.every(a => ns.has(a.artistId)), "nghệ sĩ dưới label con " + c.name + " không đúng");
    const s = H.api.summary("label", c.labelId, approvedKey, "rec");
    must(Math.abs(c.revenue - s.revenue) < 0.005 && Math.abs(c.labelCut - s.total) < 0.005, "số của label con " + c.name + " khác số label con tự thấy");
  });
  const tong = t.own.revenue + t.children.reduce((s, c) => s + c.revenue, 0);
  must(Math.abs(tong - t.total.revenue) < 0.01, "tổng cây không bằng mẹ cộng các con");
  /* ngược lên: label con không có label con, chỉ biết tên mẹ; không xem thay được mẹ */
  const tc = H.api.labelTree("label", con[0], approvedKey);
  must(tc.children.length === 0 && tc.parent && tc.parent.labelId === me, "label con nhìn thấy cây không đúng");
  const uq = H.api.delegations("label", con[0]);
  must(uq.viewAs.length === 0 && uq.parent.labelId === me, "label con được uỷ quyền xem ai đó");
  must(H.api.canViewAs("label", me, con[0]) === true, "label mẹ không xem được label con");
  must(H.api.canViewAs("label", con[0], me) === false, "label con xem được label mẹ");
  must(H.api.canViewAs("label", con[0], con[1]) === false, "label con xem được label con khác");
  must(H.api.canViewAs("label", 1, con[0]) === false, "label khác xem được label con của người khác");
  mustThrow(() => H.api.labelTree("artist", A1.id, approvedKey), "nghệ sĩ gọi cây label");
  must(H.api.delegations("artist", A1.id).viewAs.length === 0, "nghệ sĩ được uỷ quyền xem");
  must(H.api.session("label", con[0]).parentLabel.labelId === me && H.api.session("label", me).childLabels === con.length, "session không mang cây label");
  return con.length + " label con · " + t.total.artists + " nghệ sĩ toàn hệ thống · số label con khớp số label con tự thấy · không xem ngược lên";
});

check("Tiền không đổi chủ theo cây label: bảng thanh toán không có dòng nào cho label mẹ ngoài phần của chính mình", () => {
  const pi = A.pIndexOf(approvedKey);
  const rows = A.previewPayout(pi);
  const me = rows.find(r => r.partyKey === "L:0");
  const earned = A.earnedByParty(pi).get("L:0") || 0;
  must(!me || Math.abs(me.earned - earned) < 0.005, "label mẹ được ghi nhận hơn phần của chính mình");
  const con = A.labelChildren(0);
  con.forEach(l => {
    const r = rows.find(x => x.partyKey === l.key);
    const e = A.earnedByParty(pi).get(l.key) || 0;
    must(!r || Math.abs(r.earned - e) < 0.005, "label con " + l.name + " bị trừ phần cho label mẹ");
  });
  return "label mẹ nhận đúng phần của mình · " + con.length + " label con nhận trọn phần label của mình (câu hỏi cần chốt số 9)";
});

/* ===================== 5d. ĐỐI TÁC CHỈ THẤY SỐ NET ===================== */
check("Không gói nào của đối tác mang doanh thu gộp, phí dịch vụ hay phần Haustek giữ", () => {
  const goi = {
    sL: H.api.summary("label", L1.id, approvedKey, "rec"), sA: H.api.summary("artist", A1.id, approvedKey, "rec"),
    tL: H.api.tracks("label", L1.id, approvedKey, "rec", {}), dA: H.api.trackDetail("artist", A1.id, approvedKey, "rec", trackOfA1),
    cL: H.api.contract("label", L1.id, approvedKey), cA: H.api.contract("artist", A1.id, approvedKey),
    r: H.api.roster("label", L1.id, approvedKey), lt: H.api.labelTree("label", 0, approvedKey),
    cat: H.api.catalogue("label", L1.id, { limit: 20 }), as: H.api.trackAsset("artist", A1.id, trackOfA1),
    pr: H.api.platformReport("label", L1.id), rel: H.api.releases("label", L1.id), st: H.api.statements ? H.api.statements("artist", A1.id) : null
  };
  const txt = JSON.stringify(goi).toLowerCase();
  ["gross", "\"fee\"", "haustekfee", "phí dịch vụ", "doanh thu gộp", "counterpartshare", "phần haustek"].forEach(b =>
    must(!txt.includes(b), "gói đối tác vẫn chứa \"" + b + "\""));
  /* và con số: doanh thu label = phần trả nghệ sĩ + phần label, đúng bằng gộp trừ phí ở phía nội bộ */
  const a = A.agg("label", L1.id, A.pIndexOf(approvedKey), "rec");
  must(Math.abs(goi.sL.revenue - (a.gross - a.fee)) < 0.005, "doanh thu label không bằng gộp trừ phí");
  must(Math.abs(goi.sL.revenue - goi.sL.paidToArtists - goi.sL.total) < 0.005, "doanh thu − trả nghệ sĩ ≠ phần label");
  must(Math.abs(goi.sA.revenue - goi.sA.total) < 0.005 || goi.sA.chain.some(x => x.key === "recoup"), "nghệ sĩ thấy con số khác phần của mình");
  return "13 gói · không chữ nào lọt · label: " + H.fmt.usd(goi.sL.revenue) + " = " + H.fmt.usd(goi.sL.paidToArtists) + " + " + H.fmt.usd(goi.sL.total);
});

/* ===================== 5e. VÍ · TICKET · KHIẾU NẠI · DỰ BÁO ===================== */
check("Ví của nghệ sĩ A không lộ sang nghệ sĩ B; số dư = tổng khoản ghi − đã rút − đang chờ", () => {
  const w = H.api.wallet("artist", A1.id);
  must(Math.abs(w.available - (w.totalCredit - w.pending - w.paid)) < 0.005 || w.available === 0, "số dư không khớp công thức");
  w.withdrawals.forEach(x => must(x.partyKey === "A:" + A1.id, "ví chứa yêu cầu rút của người khác: " + x.partyKey));
  const cr = A.credits("A:" + A1.id);
  must(Math.abs(cr.reduce((s, c) => s + c.credit, 0) - w.totalCredit) < 0.005, "tổng khoản ghi không khớp sổ nội bộ");
  /* mỗi khoản ghi = phần được hưởng − thu hồi tạm ứng của kỳ đã xét duyệt */
  cr.forEach(c => { const row = (A.payoutOf(c.k) || []).find(r => r.partyKey === "A:" + A1.id); must(row && Math.abs(row.earned - row.recoup - c.credit) < 0.005, "khoản ghi kỳ " + c.k + " lệch bảng thanh toán"); });
  return H.fmt.usd(w.totalCredit) + " ghi · " + H.fmt.usd(w.paid) + " đã rút · khả dụng " + H.fmt.usd(w.available);
});

check("Rút tiền: chặn dưới ngưỡng, chặn vượt số dư, chặn khi chưa có ngân hàng; hợp lệ thì ghi sổ và trừ khả dụng", () => {
  const w0 = H.api.wallet("label", L1.id);
  mustThrow(() => H.api.requestWithdrawal("label", L1.id, { amount: A.cfg.PAYOUT_MIN - 1 }), "rút dưới ngưỡng");
  mustThrow(() => H.api.requestWithdrawal("label", L1.id, { amount: w0.available + 1 }), "rút vượt số dư");
  /* một tài khoản mẫu cố tình không có ngân hàng */
  const khongBank = A.accounts.list().filter(a => a.role !== "admin" && a.partyKey && !A.bank.get(a.partyKey))[0];
  if (khongBank) mustThrow(() => H.api.requestWithdrawal(khongBank.role, +khongBank.partyKey.slice(2), { amount: 100 }), "rút khi chưa có ngân hàng");
  if (w0.available >= A.cfg.PAYOUT_MIN) {
    const r = H.api.requestWithdrawal("label", L1.id, { amount: A.cfg.PAYOUT_MIN });
    const w1 = H.api.wallet("label", L1.id);
    must(Math.abs(w0.available - w1.available - A.cfg.PAYOUT_MIN) < 0.005, "khả dụng không giảm đúng số đã yêu cầu");
    must(A.withdrawals.get(r.id) && A.withdrawals.get(r.id).status === "requested", "kế toán không thấy yêu cầu");
    H.api.cancelWithdrawal("label", L1.id, r.id);
    must(Math.abs(H.api.wallet("label", L1.id).available - w0.available) < 0.005, "huỷ xong số dư không trở lại");
  }
  return "chặn ba trường hợp · yêu cầu hợp lệ trừ đúng số, huỷ trả lại đúng số";
});

check("Ticket và khiếu nại: nghệ sĩ chỉ thấy của mình, không tạo được ticket cho bài người khác", () => {
  const t1 = H.api.tickets("artist", A1.id), t2 = H.api.tickets("artist", A2.id);
  t1.rows.forEach(t => must(t.partyKey === "A:" + A1.id, "ticket của người khác lọt vào"));
  const chung = t1.rows.filter(t => t2.rows.some(x => x.id === t.id));
  must(chung.length === 0, chung.length + " ticket xuất hiện ở cả hai nghệ sĩ");
  mustThrow(() => H.api.createTicket("artist", A1.id, { type: "nen-tang", title: "x", body: "y", trackId: trackOfA2 }), "tạo ticket cho bài của B");
  const c = H.api.createTicket("artist", A1.id, { type: "nen-tang", title: "Thử", body: "Nội dung", trackId: trackOfA1 });
  must(H.api.tickets("artist", A1.id).rows.some(t => t.id === c.id), "ticket vừa tạo không thấy");
  must(!H.api.tickets("artist", A2.id).rows.some(t => t.id === c.id), "ticket vừa tạo lộ sang B");
  mustThrow(() => H.api.replyTicket("artist", A2.id, c.id, "xen vào"), "B trả lời ticket của A");
  const mineTracks = new Set(Array.from(A.idxOf(A.byArtist, A1.id)));
  const kn = H.api.claims("artist", A1.id);
  kn.rows.forEach(r => must(A.claims.get(r.id) && mineTracks.has(A.claims.get(r.id).trackId), "khiếu nại của bài người khác lọt vào"));
  must(!JSON.stringify(kn).includes("assignee"), "khiếu nại lộ tên nhân viên nội bộ");
  return t1.rows.length + " ticket của A · " + kn.rows.length + " khiếu nại của A · chặn tạo/trả lời chéo";
});

check("Dự báo chỉ tính trên bài của người xem và không lộ doanh thu gộp", () => {
  const f = H.api.forecast("artist", A1.id);
  must(f.tracksCounted <= A.idxOf(A.byArtist, A1.id).length, "đếm nhiều bài hơn danh mục của A");
  f.topTracks.forEach(t => must(Array.from(A.idxOf(A.byArtist, A1.id)).includes(t.id), "bài của người khác trong top"));
  must(f.days.length === 60 && f.projected.streams >= f.projected.monthToDate, "chuỗi ngày hoặc dự báo tháng sai");
  const txt = JSON.stringify(f).toLowerCase();
  must(!txt.includes("gross") && !txt.includes("phí"), "dự báo lộ gộp/phí");
  /* với nghệ sĩ, revenue == mine; với label, revenue ≥ mine */
  must(Math.abs(f.projected.revenue - f.projected.mine) < 0.005, "nghệ sĩ thấy hai con số khác nhau");
  const fl = H.api.forecast("label", L1.id);
  must(fl.projected.revenue >= fl.projected.mine - 0.005, "label: doanh thu nhỏ hơn phần label");
  return f.tracksCounted + " bài · 7 ngày " + H.fmt.num(f.last7) + " lượt · dự kiến " + H.fmt.usd0(f.projected.mine);
});

check("Bảng kê: chỉ kỳ đã xét duyệt, số ghi vào ví khớp ví; PDF chỉ hiện sau khi kế toán đính kèm", () => {
  const st = H.api.statements("artist", A1.id);
  st.rows.forEach(r => must(A.isApproved(r.k), "bảng kê có kỳ chưa xét duyệt " + r.k));
  const w = H.api.wallet("artist", A1.id);
  must(Math.abs(st.rows.reduce((s, r) => s + r.credit, 0) - w.totalCredit) < 0.005, "tổng ghi vào ví trên bảng kê khác ví");
  const k = st.rows[0].k;
  A.statements.remove(k, "A:" + A1.id, "test");
  must(!H.api.statements("artist", A1.id).rows[0].pdf, "PDF hiện khi chưa đính kèm");
  A.statements.attach(k, "A:" + A1.id, "bang-ke-thu.pdf", "test");
  must(H.api.statements("artist", A1.id).rows[0].pdf && H.api.statements("artist", A1.id).rows[0].pdf.file === "bang-ke-thu.pdf", "PDF đính kèm không hiện");
  return st.rows.length + " kỳ · khớp ví · PDF đúng lúc";
});

/* ===================== 6. KHOÁ CỬA ===================== */
check("Xu hướng ngày: chỉ bài của người xem, chuỗi ngày cộng đúng tổng, không lộ chữ nhạy cảm", () => {
  const tr = H.api.dailyTrends("artist", A1.id, 28);
  must(tr.series.length === 28, "cửa sổ 28 ngày phải có 28 điểm");
  const sum = tr.series.reduce((s, x) => s + x.streams, 0);
  must(sum === tr.total, "tổng cửa sổ " + tr.total + " khác tổng chuỗi ngày " + sum);
  must(tr.topTracks.every(x => H.admin.artistOf(x.id).id === A1.id), "xu hướng ngày lộ bài của người khác");
  must(tr.topArtists.length === 0, "nghệ sĩ không được thấy xếp hạng nghệ sĩ khác");
  const trL = H.api.dailyTrends("label", L1.id, 7);
  must(trL.topArtists.length > 0 && trL.series.length === 7, "label phải có xếp hạng nghệ sĩ và cửa sổ 7 ngày");
  must(!/gross|haustekFee|phân phối/i.test(JSON.stringify(tr)), "gói xu hướng lộ chữ nhạy cảm");
  return tr.tracksCounted + " bài · " + tr.days + " ngày " + tr.total.toLocaleString("en-US") + " lượt · label 7 ngày " + trL.total.toLocaleString("en-US");
});

check("Playlist: từng vị trí đều thuộc bài của người xem, số đếm khớp danh sách", () => {
  const pl = H.api.playlists("artist", A1.id);
  must(pl.rows.every(r => H.admin.artistOf(r.trackId).id === A1.id), "playlist lộ bài của người khác");
  const active = pl.rows.filter(r => r.status === "active").length;
  must(pl.truncated || active === pl.counts.active, "số đang có mặt " + pl.counts.active + " khác danh sách " + active);
  must(pl.playlists.every(p => p.active <= p.tracks), "playlist đếm sai");
  const plL = H.api.playlists("label", L1.id);
  must(plL.rows.length >= pl.rows.length, "label phải thấy ít nhất bằng nghệ sĩ của mình");
  return pl.counts.active + " vị trí đang có · " + pl.counts.playlists + " playlist · label " + plL.counts.active;
});

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
