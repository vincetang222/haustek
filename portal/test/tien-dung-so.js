/* =====================================================================
   TIỀN NÓI ĐÚNG CON SỐ — bốn lỗi vòng 23, mỗi lỗi một phép kiểm
   ---------------------------------------------------------------------
   qc-bat-bien.js kiểm tiền có CÂN không. Bài này kiểm tiền có nói ĐÚNG
   con số không — hai chuyện khác nhau: một hệ có thể cân tuyệt đối mà vẫn
   in ra màn hình một số chẳng liên quan gì tới số sẽ chuyển đi.

   Bốn chỗ tìm được ở vòng 23, tất cả đều đo được bằng số:

   1. Một người đứng cả hai vai tác giả trên cùng một bài thì chỉ mục
      byWriter nạp bài ấy HAI lần. earnedByParty (đường tiền thật) trả
      đúng một lần, nhưng agg và danh mục cộng theo phạm vi nên cổng đối
      tác hiện thừa — đo được 7,40 USD trên một nghệ sĩ một kỳ, 12 nghệ sĩ
      dính.
   2. explain() đọc payout.carry, tên thật là carryOut — dòng "dồn sang kỳ
      sau" hiện rỗng trong khi số thật là 10,29 / 49,01 USD.
   3. Trang Chia sẻ báo "đã chia 38.132,54 USD" trong khi tiền thật đổi
      chủ là 44,14 USD (864×): con số cũ là phần trăm × doanh thu trọn
      đời, tính cho cả những người chưa nhận lời mời và không có ví.
   4. Tạm ứng: advanceBalance kẹp số dư về 0, nên hạ gốc xuống dưới phần
      đã thu hồi làm phần vượt bốc hơi không dấu vết.

       node portal/test/tien-dung-so.js
   ===================================================================== */
"use strict";
const path = require("path");
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
const H = global.window.HAUSTEK, A = H.admin, api = H.api;

let pass = 0; const hong = [];
function kiem(ten, fn) {
  try { const m = fn(); pass++; console.log("  ok   " + ten + (m ? " · " + m : "")); }
  catch (e) { hong.push(ten + " — " + e.message); console.log("  LỖI  " + ten + " — " + e.message); }
}
function must(c, m) { if (!c) throw new Error(m); }

/* ---------------------------------------------------------------------
   1. Chỉ mục người viết không bao giờ nạp một bài hai lần
   --------------------------------------------------------------------- */
kiem("không bài nào có cùng một người ở cả hai vai tác giả", () => {
  const xau = [];
  for (let i = 0; i < A.trackCount; i++) {
    const t = A.track(i);
    if (t.writer2Id >= 0 && t.writer2Id === t.writer1Id) xau.push(i);
  }
  must(!xau.length, xau.length + " bài trùng tác giả, ví dụ " + xau.slice(0, 5).join(", "));
  return A.trackCount + " bài";
});

kiem("phạm vi tác quyền của mỗi nghệ sĩ không chứa bài trùng", () => {
  const xau = [];
  for (let a = 0; a < A.artists.length; a++) {
    const sc = A.scopeOf("artist", a, "pub");
    if (!sc || !sc.length) continue;
    const co = new Set();
    for (let k = 0; k < sc.length; k++) {
      if (co.has(sc[k])) { xau.push("A:" + a + " bài " + sc[k]); break; }
      co.add(sc[k]);
    }
  }
  must(!xau.length, xau.length + " phạm vi có bài trùng: " + xau.slice(0, 3).join(" · "));
  return A.artists.length + " nghệ sĩ";
});

kiem("số tác quyền cổng đối tác thấy = cộng từng bài, không thừa đồng nào", () => {
  const kys = A.periods.filter(p => A.isApproved(p.k) && A.pubLoaded(p.idx));
  must(kys.length, "không có kỳ tác quyền nào đã duyệt để kiểm");
  const xau = [];
  let n = 0;
  for (let a = 0; a < A.artists.length; a++) {
    const sc = A.scopeOf("artist", a, "pub");
    if (!sc || !sc.length) continue;
    kys.forEach(ky => {
      n++;
      const agg = A.agg("artist", a, ky.idx, "pub");
      const co = new Set(); let tay = 0;
      for (let k = 0; k < sc.length; k++) {
        const i = sc[k]; if (co.has(i)) continue; co.add(i);
        tay += A.mineOf(i, ky.idx, "artist", a, "pub");
      }
      /* Dung sai theo SỐ BÀI: mỗi bài làm tròn về xu một lần nên sai số
         cộng dồn theo số bài. Đếm đôi thì lệch ~100%, không lẫn vào được. */
      const dungSai = 0.05 + 0.01 * co.size;
      if (Math.abs(agg.total - tay) > dungSai)
        xau.push("A:" + a + " " + ky.k + " agg " + agg.total.toFixed(2) + " ≠ từng bài " + tay.toFixed(2));
    });
  }
  must(!xau.length, xau.length + " chỗ lệch: " + xau.slice(0, 3).join(" · "));
  return n + " cặp nghệ sĩ × kỳ";
});

/* ---------------------------------------------------------------------
   2. explain(): không bước nào rỗng, dòng dồn kỳ đúng số
   --------------------------------------------------------------------- */
kiem("bảng giải thích kỳ không có bước nào rỗng hay NaN", () => {
  const xau = []; let n = 0, coDon = 0;
  A.periods.filter(p => A.isApproved(p.k)).forEach(p => {
    /* Lấy cả dòng CÓ dồn kỳ, không phải 40 dòng đầu: dòng dồn kỳ là dòng
       nhỏ, nằm cuối bảng đã xếp theo số tiền, nên cắt 40 dòng đầu là không
       bao giờ chạm tới đúng chỗ lỗi cần canh. */
    const ds = A.payoutOf(p.k) || [];
    const donKy = ds.filter(r => r.carryOut > 0.004).slice(0, 20);
    donKy.concat(ds.slice(0, 20)).forEach(r => {
      if (r.partyKey[0] === "N") return;                 /* bên nhận chưa có cổng ở bước này */
      const role = r.partyKey[0] === "L" ? "label" : "artist", id = +r.partyKey.slice(2);
      let ex; try { ex = api.explain(role, id, p.k); } catch (e) { return; }
      n++;
      (ex.steps || []).forEach(s => {
        if (s.value == null || !isFinite(s.value)) xau.push(p.k + " " + r.partyKey + " bước " + s.k + " = " + s.value);
        if (s.k === "carry") {
          coDon++;
          if (Math.abs(s.value - r.carryOut) > 0.005)
            xau.push(p.k + " " + r.partyKey + " dồn kỳ " + s.value + " ≠ bảng chốt " + r.carryOut);
        }
      });
    });
  });
  must(n > 20, "chỉ đọc được " + n + " bảng giải thích");
  must(coDon > 0, "không chạm được dòng dồn kỳ nào — phép kiểm không chứng minh gì");
  must(!xau.length, xau.length + " chỗ hỏng: " + xau.slice(0, 3).join(" · "));
  return n + " bảng · " + coDon + " dòng dồn kỳ khớp bảng chốt";
});

/* ---------------------------------------------------------------------
   3. Chia sẻ: "đã trả" là tiền thật, "ước tính" là ước tính
   --------------------------------------------------------------------- */
kiem("tổng đã trả người cộng tác = tổng tiền chia sẻ trong các bảng chốt", () => {
  let that = 0;
  A.periods.filter(p => A.isApproved(p.k)).forEach(p => {
    (A.payoutOf(p.k) || []).forEach(r => { if (r.chiaSeVao > 0) that += r.chiaSeVao; });
  });
  const bao = A.splits("admin", 0).counts;
  must(Math.abs(bao.daTra - that) < 0.05, "trang báo " + bao.daTra + " ≠ bảng chốt " + that.toFixed(2));
  must(bao.uocTinh >= bao.daTra, "ước tính " + bao.uocTinh + " nhỏ hơn đã trả " + bao.daTra);
  return "đã trả " + that.toFixed(2) + " USD · ước tính " + bao.uocTinh.toFixed(2) + " USD · " + bao.hieuLuc + " chia sẻ có hiệu lực";
});

kiem("chưa nhận lời mời hoặc chưa có bên nhận thì đã trả phải bằng 0", () => {
  const d = A.splits("admin", 0); const xau = [];
  (d.rows || []).forEach(r => (r.collaborators || []).forEach(c => {
    if (!c.hieuLuc && c.daTra > 0.004) xau.push(r.trackId + " " + c.email + " daTra " + c.daTra);
    if (c.hieuLuc && !c.nhanClientId) xau.push(r.trackId + " " + c.email + " có hiệu lực mà không có mã bên nhận");
  }));
  must(!xau.length, xau.slice(0, 3).join(" · "));
  return (d.rows || []).length + " bài trong báo cáo";
});

kiem("bài có chia sẻ thật luôn có mặt trong báo cáo, không bị lấy mẫu bỏ qua", () => {
  const d = A.splits("admin", 0);
  const co = new Set((d.rows || []).map(r => r.trackId));
  let thieu = 0, n = 0;
  A.periods.filter(p => A.isApproved(p.k)).forEach(p => {
    (A.payoutOf(p.k) || []).forEach(r => (r.chiaSe || []).forEach(x => { n++; if (!co.has(x.i)) thieu++; }));
  });
  must(n > 0, "không có dòng chia sẻ nào trong bảng chốt để kiểm");
  must(!thieu, thieu + "/" + n + " dòng chia sẻ đã trả mà bài không có trong báo cáo");
  return n + " dòng chia sẻ đã trả, bài nào cũng có mặt";
});

/* ---------------------------------------------------------------------
   4. Tạm ứng: không bốc hơi phần đã thu hồi
   --------------------------------------------------------------------- */
kiem("không hạ gốc tạm ứng xuống dưới phần đã thu hồi", () => {
  const ds = A.advances.list().filter(a => a.recouped > 0.01);
  must(ds.length, "không có khoản tạm ứng nào đã thu hồi để kiểm");
  const a = ds[0];
  let chan = false, m = "";
  try { A.advances.set(a.partyKey, Math.max(0, a.recouped - 1), "kiểm thử"); }
  catch (e) { chan = true; m = e.message; }
  must(chan, a.partyKey + ": hạ gốc xuống dưới " + a.recouped.toFixed(2) + " mà không bị chặn");
  /* và gốc không bị đổi */
  const sau = A.advances.list().find(x => x.partyKey === a.partyKey);
  must(Math.abs(sau.opening - a.opening) < 0.005, "gốc đã bị đổi dù lệnh bị chặn");
  return a.partyKey + " · " + m.slice(0, 60);
});

kiem("không xoá khoản tạm ứng đã thu hồi một phần", () => {
  const a = A.advances.list().filter(x => x.recouped > 0.01)[0];
  must(a, "không có khoản nào đã thu hồi");
  let chan = false;
  try { A.advances.remove(a.partyKey); } catch (e) { chan = true; }
  must(chan, a.partyKey + ": xoá được khoản đã thu hồi " + a.recouped.toFixed(2));
  must(A.advances.list().some(x => x.partyKey === a.partyKey), "khoản đã biến mất dù lệnh bị chặn");
  return a.partyKey + " · đã thu hồi " + a.recouped.toFixed(2) + " USD";
});

kiem("mọi khoản tạm ứng: đã thu hồi không vượt gốc", () => {
  const xau = A.advances.list().filter(a => a.recouped > a.opening + 0.005)
    .map(a => a.partyKey + " thu hồi " + a.recouped.toFixed(2) + " > gốc " + a.opening.toFixed(2));
  must(!xau.length, xau.slice(0, 3).join(" · "));
  return A.advances.list().length + " khoản";
});

/* ---------------------------------------------------------------------
   5. Nghệ sĩ độc lập VẪN chia sẻ doanh thu với Haustek
   ---------------------------------------------------------------------
   "Độc lập nhận toàn bộ phần sau phí" rất dễ bị đọc thành "Haustek không
   thu gì của họ". Không phải: phí hợp đồng cắt trước, y như mọi đối tác.
   Cái họ không có là lớp cắt THỨ HAI (bảng tỷ lệ label ↔ nghệ sĩ), vì
   không có label đứng giữa. Cổng của họ chỉ hiện số sau phí; đối soát nội
   bộ phải tách phí ra, không thì không ai nhìn thấy con số ấy.
   --------------------------------------------------------------------- */
kiem("Haustek thu phí hợp đồng của nghệ sĩ độc lập, không phải thu 0", () => {
  const ky = A.periods.filter(p => A.isApproved(p.k)).slice(-1)[0];
  const d = A.phiTheoLoaiChu(ky.idx);
  const indie = d.rows.find(r => r.loai === "indie");
  must(indie, "đối soát không tách riêng nghệ sĩ độc lập");
  must(indie.gopGhiNhan > 0, "kỳ này nghệ sĩ độc lập không có doanh thu để kiểm");
  must(indie.phi > 0, "phí thu của nghệ sĩ độc lập bằng 0 — họ phải chia sẻ doanh thu như mọi đối tác");
  must(indie.phiPct > 1, "tỷ lệ phí của nghệ sĩ độc lập chỉ " + indie.phiPct + "%");
  const lb = d.rows.find(r => r.loai === "label");
  must(Math.abs(indie.phiPct - lb.phiPct) < 5, "phí độc lập " + indie.phiPct + "% lệch xa phí label " + lb.phiPct + "%");
  return "độc lập: gộp " + indie.gopGhiNhan.toFixed(2) + " · phí " + indie.phi.toFixed(2) + " (" + indie.phiPct + "%) · trả họ " + indie.traDoiTac.toFixed(2);
});

kiem("đối soát cân từng dòng: gộp ghi nhận = phí + trả đối tác", () => {
  const xau = [];
  A.periods.forEach(p => {
    const d = A.phiTheoLoaiChu(p.idx);
    d.rows.forEach(r => {
      if (Math.abs(r.gopGhiNhan - (r.phi + r.traDoiTac)) > 0.05)
        xau.push(p.k + " " + r.loai + ": " + r.gopGhiNhan + " ≠ " + r.phi + " + " + r.traDoiTac);
    });
    if (Math.abs(d.tong.gopGhiNhan - (d.tong.phi + d.tong.traDoiTac)) > 0.05)
      xau.push(p.k + " tổng lệch");
  });
  must(!xau.length, xau.slice(0, 3).join(" · "));
  return A.periods.length + " kỳ × 2 loại chủ bài";
});

kiem("cổng của nghệ sĩ độc lập không mang một trường phí nào", () => {
  const ky = A.periods.filter(p => A.isApproved(p.k)).slice(-1)[0];
  const a = A.artists.find(x => x.labelId < 0);
  const goi = JSON.stringify([api.summary("artist", a.id, ky.k, "rec"), api.explain("artist", a.id, ky.k)]);
  ["\"fee\"", "\"feePct\"", "\"gross\"", "\"ghiNhan\"", "\"bienGia\"", "phiHaustek"].forEach(x => {
    must(goi.indexOf(x) < 0, "gói của nghệ sĩ độc lập mang " + x);
  });
  const s = api.summary("artist", a.id, ky.k, "rec");
  const d = A.phiTheoLoaiChu(ky.idx);
  must(s.total > 0, "nghệ sĩ này không có tiền ở kỳ " + ky.k);
  must(s.total < d.rows.find(r => r.loai === "indie").gopGhiNhan, "số cổng hiện lớn hơn cả gộp ghi nhận của nhóm");
  return "cổng hiện " + s.total.toFixed(2) + " USD, không trường phí nào";
});

console.log("\n" + pass + " đạt · " + hong.length + " hỏng");
process.exit(hong.length ? 1 : 0);
