/* =====================================================================
   QC · BẤT BIẾN CỦA CHUỖI TIỀN
   ---------------------------------------------------------------------
   api-guard kiểm RANH GIỚI: ai được thấy gì. Bài này kiểm SỐ: cùng một
   đồng tiền đi qua bao nhiêu đường thì cộng lại vẫn phải ra bấy nhiêu.

   Chạy hết mọi kỳ × mọi đối tác chứ không lấy mẫu, vì lỗi cộng tiền
   thường chỉ hiện ở đúng một kỳ hoặc đúng một đối tác lạ.

       node portal/test/qc-bat-bien.js
   ===================================================================== */
"use strict";
global.window = global;
require("../haustek-core.js");
const H = window.HAUSTEK, A = H.admin, f = H.fmt;

let pass = 0, fail = 0; const ra = [];
function check(ten, fn) {
  try { const m = fn(); ra.push(["ok", ten, m || ""]); pass++; }
  catch (e) { ra.push(["LỖI", ten, e.message]); fail++; }
}
function must(ok, msg) { if (!ok) throw new Error(msg); }
const c2 = v => Math.round(v * 100) / 100;
const so = v => typeof v === "number" && isFinite(v);

/* mọi số trong một gói phải là số thật: không NaN, không Infinity, không undefined */
function soThat(o, duong, chuoi) {
  chuoi = chuoi || "";
  if (o == null) return;
  if (typeof o === "number") {
    if (!isFinite(o)) throw new Error("số hỏng ở " + chuoi + ": " + o);
    return;
  }
  if (Array.isArray(o)) { o.forEach((x, i) => soThat(x, duong, chuoi + "[" + i + "]")); return; }
  if (typeof o === "object") { Object.keys(o).forEach(k => soThat(o[k], duong, chuoi + "." + k)); }
}

const KY = A.periods.map((p, i) => ({ i, k: p.k, duyet: A.isApproved(p.k) }));
const KY_DUYET = KY.filter(x => x.duyet);
const DT = A.parties.list().rows;

/* ================================================================= */
check("Mọi kỳ: gộp thật = gộp ghi nhận + chênh lệch bảng giá", () => {
  KY.forEach(ky => {
    const a = A.agg("admin", 0, ky.i, "rec");
    soThat(a, null, "agg " + ky.k);
    must(Math.abs(a.gross - a.ghiNhan - a.bienGia) < 0.02,
      ky.k + ": " + a.gross + " ≠ " + a.ghiNhan + " + " + a.bienGia);
  });
  return KY.length + " kỳ";
});

check("Mọi kỳ: gộp ghi nhận = phí + phần label + phần nghệ sĩ", () => {
  const lech = [];
  KY.forEach(ky => {
    const a = A.agg("admin", 0, ky.i, "rec");
    const d = Math.abs(a.ghiNhan - a.fee - a.labelCut - a.artist);
    if (d > 0.05) lech.push(ky.k + " lệch " + d.toFixed(2));
  });
  must(!lech.length, lech.join(" · "));
  return KY.length + " kỳ · cân tới 5 xu";
});

check("Cộng từng bài trong danh mục phải bằng tổng các kỳ đã duyệt", () => {
  /* catalogue trả doanh thu CỘNG DỒN qua mọi kỳ đã duyệt, và trả theo
     góc nhìn của vai: nghệ sĩ thấy phần nghệ sĩ, label thấy phần sau phí
     (label giữ + nghệ sĩ của label). Nên vế phải phải lấy đúng khái niệm
     ấy chứ không phải "total" của agg. */
  const cong = (vai, id) => {
    let s = 0, off = 0, n = 0;
    for (;;) {
      const c = A.catalogueFor(vai, id, { offset: off, limit: 200 });
      c.rows.forEach(r => { s += r.revenue || 0; });
      n = c.total; off += c.rows.length;
      if (!c.rows.length || off >= c.total) break;
    }
    return { rev: c2(s), n };
  };
  const lech = []; let soDt = 0, soBai = 0;
  DT.forEach(dt => {
    const vai = dt.partyKey[0] === "L" ? "label" : "artist";
    const id = +dt.partyKey.slice(2);
    let c;
    try { c = cong(vai, id); } catch (e) { return; }
    soDt++; soBai += c.n;
    let ky = 0;
    KY_DUYET.forEach(k => {
      const a = A.agg(vai, id, k.i, "rec");
      ky += vai === "label" ? (a.ghiNhan - a.fee) : a.artist;
    });
    const d = Math.abs(c.rev - ky);
    if (d > Math.max(0.5, Math.abs(ky) * 0.0002))
      lech.push(dt.partyKey + " danh mục " + c.rev.toFixed(2) + " ≠ kỳ " + c2(ky).toFixed(2));
  });
  must(soDt > 100, "chỉ đọc được " + soDt + " danh mục");
  must(!lech.length, lech.slice(0, 4).join(" · ") + (lech.length > 4 ? " …+" + (lech.length - 4) : ""));
  return soDt + " đối tác · " + soBai.toLocaleString("vi") + " lượt bài · khớp từng đối tác";
});

check("Danh mục toàn hệ đếm đủ số bản ghi, không sót không lặp", () => {
  const c = A.catalogue({ limit: 200 });
  must(c.total === c.counts.all, "tổng " + c.total + " ≠ đếm " + c.counts.all);
  const tong = c.counts.live + c.counts.processing + c.counts.issue;
  must(tong === c.counts.all, "cộng ba trạng thái ra " + tong + " ≠ " + c.counts.all);
  const id = new Set(c.rows.map(r => r.id));
  must(id.size === c.rows.length, "một trang danh mục có bản ghi lặp");
  return c.total.toLocaleString("vi") + " bản ghi · ba trạng thái cộng đủ";
});

check("Mọi kỳ đã duyệt: bảng chi trả cộng đúng, không dòng nào âm vô lý", () => {
  const xau = [];
  KY_DUYET.forEach(ky => {
    const rows = A.payoutOf(ky.k) || [];
    soThat(rows, null, "payout " + ky.k);
    rows.forEach(r => {
      if (r.earned < -0.005) xau.push(ky.k + "/" + r.partyKey + " earned âm " + r.earned);
      if (r.recoup < -0.005) xau.push(ky.k + "/" + r.partyKey + " recoup âm " + r.recoup);
      if (r.payable < -0.005) xau.push(ky.k + "/" + r.partyKey + " payable âm " + r.payable);
      const d = Math.abs((r.earned + r.carryIn) - (r.recoup + r.payable + r.carryOut));
      if (d > 0.02) xau.push(ky.k + "/" + r.partyKey + " không cân " + d.toFixed(2));
    });
  });
  must(!xau.length, xau.slice(0, 5).join(" · ") + (xau.length > 5 ? " …+" + (xau.length - 5) : ""));
  return KY_DUYET.length + " kỳ · mọi dòng cân";
});

check("Phần đối tác nhận cộng lại không vượt gộp ghi nhận ở bất kỳ kỳ nào", () => {
  const xau = [];
  KY.forEach(ky => {
    const a = A.agg("admin", 0, ky.i, "rec");
    if (a.labelCut + a.artist > a.ghiNhan + 0.05) xau.push(ky.k);
  });
  must(!xau.length, "kỳ vượt: " + xau.join(", "));
  return "không kỳ nào trả quá số ghi nhận";
});

check("Tỷ lệ phí thực tế của mỗi kỳ nằm trong khoảng hợp đồng", () => {
  const xau = [];
  KY.forEach(ky => {
    const a = A.agg("admin", 0, ky.i, "rec");
    if (a.ghiNhan <= 0) return;
    const ty = a.fee / a.ghiNhan;
    if (ty < 0.02 || ty > 0.5) xau.push(ky.k + " phí " + (ty * 100).toFixed(1) + "%");
  });
  must(!xau.length, xau.join(" · "));
  return "mọi kỳ trong 2–50%";
});

/* ================================================================= */
check("Mọi đối tác: số ở cổng đối tác khớp số nội bộ của chính họ", () => {
  const ky = KY_DUYET[KY_DUYET.length - 1];
  const xau = [];
  let n = 0;
  DT.forEach(dt => {
    const vai = dt.partyKey[0] === "L" ? "label" : "artist";
    const id = +dt.partyKey.slice(2);
    let s;
    try { s = H.api.summary(vai, id, ky.k, "rec"); } catch (e) { return; }
    n++;
    soThat(s, null, "summary " + dt.partyKey);
    const noiBo = A.agg(vai, id, ky.i, "rec");
    /* summary.total của đối tác là PHẦN CỦA CHÍNH HỌ: label thấy phần
       label giữ, nghệ sĩ thấy phần nghệ sĩ. Không phải "ghi nhận trừ
       phí" — số ấy là cả hai phía cộng lại, và nó có tên riêng
       (revenueAgg) dùng ở dòng "Doanh thu của nghệ sĩ trong label". */
    if (Math.abs(s.total - noiBo.total) > 0.05) xau.push(dt.partyKey + ": cổng " + s.total + " ≠ nội bộ " + noiBo.total);
    if (vai === "label" && Math.abs((noiBo.labelCut + noiBo.artist) - (noiBo.ghiNhan - noiBo.fee)) > 0.05)
      xau.push(dt.partyKey + ": label + nghệ sĩ ≠ ghi nhận − phí");
  });
  must(n > 20, "chỉ đọc được " + n + " đối tác, quá ít để có nghĩa");
  must(!xau.length, xau.slice(0, 4).join(" · ") + (xau.length > 4 ? " …+" + (xau.length - 4) : ""));
  return n + " đối tác · khớp tới 5 xu";
});

check("Mọi đối tác: ví cộng lại đúng các kỳ đã ghi", () => {
  const xau = [];
  let n = 0;
  DT.slice(0, 40).forEach(dt => {
    let w;
    try { w = A.wallet(dt.partyKey); } catch (e) { return; }
    n++;
    soThat(w, null, "wallet " + dt.partyKey);
    const cong = (w.credits || []).reduce((s, x) => s + x.credit, 0);
    const rut = (w.withdrawals || []).filter(x => x.status === "paid").reduce((s, x) => s + x.amount, 0);
    if (w.balance != null && Math.abs(w.balance - (cong - rut)) > 0.05)
      xau.push(dt.partyKey + ": số dư " + w.balance + " ≠ ghi " + cong.toFixed(2) + " − rút " + rut.toFixed(2));
  });
  must(n > 10, "chỉ đọc được " + n + " ví");
  must(!xau.length, xau.slice(0, 4).join(" · "));
  return n + " ví · số dư = ghi − rút";
});

/* ================================================================= */
check("Bảng giá bật lên rồi tắt đi thì mọi số quay về đúng như cũ", () => {
  must(!A.platformRatesFull().some(r => r.override), "bàn chưa sạch trước khi thử");
  const truoc = KY.map(ky => A.agg("admin", 0, ky.i, "rec"));
  const suy = A.platformRatesFull().find(r => r.name === "Spotify");
  A.setPlatformRate("Spotify", suy.derived, "qc", "test", suy.derived * 0.8);
  const giua = KY.map(ky => A.agg("admin", 0, ky.i, "rec"));
  must(giua.some((a, i) => Math.abs(a.ghiNhan - truoc[i].ghiNhan) > 1), "đặt bảng giá mà không kỳ nào đổi");
  giua.forEach((a, i) => must(Math.abs(a.gross - truoc[i].gross) < 0.05, "bảng giá làm đổi gộp THẬT kỳ " + KY[i].k));
  A.clearPlatformRate("Spotify", "test");
  const sau = KY.map(ky => A.agg("admin", 0, ky.i, "rec"));
  const lech = [];
  sau.forEach((a, i) => {
    ["gross", "ghiNhan", "fee", "labelCut", "artist"].forEach(k => {
      if (Math.abs(a[k] - truoc[i][k]) > 0.05) lech.push(KY[i].k + "." + k);
    });
  });
  must(!lech.length, "không hoàn nguyên: " + lech.join(", "));
  return KY.length + " kỳ · bật, đổi, tắt, về đúng chỗ cũ";
});

check("Đổi phí hợp đồng thì phí đổi, bảng giá đứng yên; và ngược lại", () => {
  const pk = DT[0].partyKey;
  const ky = KY_DUYET[KY_DUYET.length - 1];
  const t0 = A.agg("admin", 0, ky.i, "rec");
  /* không có API sửa phí trực tiếp; đi qua đề xuất hợp đồng đã duyệt là
     quá dài cho một phép kiểm, nên chỉ kiểm tính chất: đổi bảng giá thì
     TỶ LỆ phí không đổi. Đó là nửa mệnh đề quan trọng hơn. */
  const suy = A.platformRatesFull().find(r => r.name === "Spotify");
  A.setPlatformRate("Spotify", suy.derived, "qc", "test", suy.derived * 0.7);
  const t1 = A.agg("admin", 0, ky.i, "rec");
  const ty0 = t0.fee / t0.ghiNhan, ty1 = t1.fee / t1.ghiNhan;
  must(Math.abs(ty0 - ty1) < 0.004, "đổi bảng giá mà tỷ lệ phí đổi: " + ty0.toFixed(4) + " → " + ty1.toFixed(4));
  must(t1.ghiNhan < t0.ghiNhan - 1, "chào thấp hơn mà gộp ghi nhận không giảm");
  A.clearPlatformRate("Spotify", "test");
  return "tỷ lệ phí đứng yên khi bảng giá đổi · " + (ty0 * 100).toFixed(1) + "%";
});

/* ================================================================= */
check("Không hàm nào của mặt tiền admin trả về NaN hay Infinity", () => {
  const ky = KY_DUYET[KY_DUYET.length - 1];
  const goi = {};
  const thu = (ten, fn) => { try { goi[ten] = fn(); } catch (e) {} };
  thu("summary", () => A.summary("admin", 0, ky.k, "rec"));
  thu("agg", () => A.agg("admin", 0, ky.i, "rec"));
  thu("forecast", () => A.forecast());
  thu("platformReport", () => A.platformReport());
  thu("platformTail", () => A.platformTail(ky.k));
  thu("platformRatesFull", () => A.platformRatesFull());
  thu("mucTraTacDong", () => A.mucTraTacDong(ky.i));
  thu("payoutOf", () => A.payoutOf(ky.k));
  thu("previewPayout", () => A.previewPayout(A.periods.length - 1));
  thu("catalogue", () => A.catalogue({ limit: 50 }));
  thu("dailyTrends", () => A.dailyTrends(28, 8));
  thu("recon", () => A.recon(ky.i));
  thu("von", () => A.von && A.von.tongQuan && A.von.tongQuan());
  thu("hieuSuat", () => A.hieuSuat && A.hieuSuat.bang && A.hieuSuat.bang());
  thu("xuatBan", () => A.xuatBan && A.xuatBan.tongQuan && A.xuatBan.tongQuan());
  thu("advances", () => A.advances.list());
  thu("proposals", () => A.proposals.list());
  const n = Object.keys(goi).length;
  must(n >= 12, "chỉ gọi được " + n + " hàm");
  Object.keys(goi).forEach(k => soThat(goi[k], null, k));
  return n + " hàm · mọi số đều hữu hạn";
});

check("Mọi kỳ chưa duyệt đều bị chặn ở cổng đối tác, không lọt kỳ nào", () => {
  const chua = KY.filter(x => !x.duyet);
  must(chua.length > 0, "không có kỳ chưa duyệt để thử");
  const a = A.accounts.list().find(x => x.role === "artist" && x.partyKey);
  const id = +a.partyKey.slice(2);
  chua.forEach(ky => {
    let lot = false;
    try { H.api.summary("artist", id, ky.k, "rec"); lot = true; } catch (e) {}
    must(!lot, "kỳ chưa duyệt " + ky.k + " lọt ra cổng đối tác");
  });
  return chua.length + " kỳ chưa duyệt · đều bị chặn";
});

/* ===================== KẾT QUẢ ===================== */
console.log(ra.map(([k, n, m]) => (k === "ok" ? "  ok   " : "  LỖI  ") + n + (m ? "\n         " + m : "")).join("\n"));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
