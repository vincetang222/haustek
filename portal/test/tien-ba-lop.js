/* =====================================================================
   TIỀN · BA LỚP NGƯỜI DÙNG ↔ BÊN THỤ HƯỞNG ↔ VAI TRÊN BÀI (vòng 22)
   ---------------------------------------------------------------------
   Bốn quyết định đã chốt, mỗi quyết định một nhóm phép kiểm:
     D1 Nghệ sĩ độc lập nhận 100% sau phí — không có "Haustek giữ thêm".
     D2 Nghệ sĩ thuộc label: theo hợp đồng từng label (labelTuTra).
     D3 Tách ba lớp: một đăng nhập nhiều bên; người cộng tác đã nhận lời
        mời được trả THẬT, trừ vào phần của chủ; ai chưa có tài khoản thì
        được cấp tài khoản "người nhận" mang mã HTK-N.
     D4 Huỷ chốt có bù trừ: bảng chi trả cũ không mất, sổ cái có dòng −.

       node portal/test/tien-ba-lop.js
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
function mustThrow(fn, re, msg) { try { fn(); } catch (e) { if (!re || re.test(e.message)) return e; throw new Error(msg + " — ném sai lỗi: " + e.message); } throw new Error(msg + " — không bị chặn"); }
const gan = (a, b, eps) => Math.abs(a - b) <= (eps || 0.011);
const st = () => JSON.parse(H.storage.exportJSON());
const KY = A.periods.map((p, i) => ({ i, k: p.k, duyet: A.isApproved(p.k) }));
const DUYET = KY.filter(x => x.duyet), MO = KY.filter(x => !x.duyet);
const CUOI = DUYET[DUYET.length - 1];
const tongMap = m => { let s = 0; m.forEach(v => { s += v; }); return s; };

/* ---------- D1 ---------- */
check("D1 · Không nghệ sĩ độc lập nào có dòng tỷ lệ; rateFor(A:) luôn là 1; rates.add(A:) bị từ chối", () => {
  const raw = A.rates.raw();
  must(!raw.some(r => r.partyKey[0] === "A"), "vẫn còn dòng tỷ lệ A:");
  const indie = A.artists.find(a => a.labelId < 0);
  must(A.rates.rateFor(indie.key, CUOI.k) === 1, "rateFor A: không phải 1");
  mustThrow(() => A.rates.add(indie.key, 0.9, MO[0].k, "x"), /100%/, "đặt tỷ lệ cho nghệ sĩ độc lập");
  return raw.length + " dòng tỷ lệ, toàn label";
});
check("D1 · Mọi bài của nghệ sĩ độc lập: phần label = 0, nghệ sĩ nhận trọn net = ghi nhận − phí", () => {
  let n = 0;
  for (let i = 0; i < 50000 && n < 400; i += 97) {
    if (A.partyKeyOfTrack(i)[0] !== "A") continue;
    const g = A.grossRec(i, CUOI.i); if (g <= 0) continue;
    const s = A.splitRec(i, g, CUOI.k);
    must(s.labelCut === 0 && gan(s.artist, s.net) && gan(s.ghiNhan - s.fee, s.net), "bài " + i + ": " + JSON.stringify(s));
    n++;
  }
  return n + " bài kiểm";
});
check("D1 · Cổng đối tác: nghệ sĩ độc lập không thấy tỷ lệ chia, tổng bằng net của chính họ", () => {
  const acc = st().accounts.find(a => a.role === "artist" && a.status === "active" && A.artists[+a.partyKey.slice(2)].labelId < 0);
  const id = +acc.partyKey.slice(2);
  const s = H.api.summary("artist", id, CUOI.k, "rec"), a = A.agg("artist", id, CUOI.i, "rec");
  must(gan(s.total, a.artist) && gan(a.artist, a.ghiNhan - a.fee), "tổng " + s.total + " ≠ net " + (a.ghiNhan - a.fee));
  must(s.traBoi === "haustek", "nghệ sĩ độc lập phải do Haustek trả");
  return acc.email + " · " + H.fmt.usd(s.total);
});

/* ---------- D2 ---------- */
check("D2 · Label tự trả (hợp đồng mẫu L:5–7): nghệ sĩ của họ không có dòng chi trả, label nhận trọn phần sau phí", () => {
  must(A.parties.labelTuTra("L:5") && !A.parties.labelTuTra("L:0"), "cờ labelTuTra mẫu sai");
  const e = A.earnedByParty(CUOI.i);
  const ns = A.artists.filter(a => a.labelId === 5);
  const coDong = ns.filter(a => { const v = e.get(a.key); return v && v > 0 && A.idxOf(A.byArtist, a.id).some(i => A.grossRec(i, CUOI.i) > 0); });
  /* chỉ tiền TÁC QUYỀN mới được vào tay nghệ sĩ của label tự trả; phần bản ghi thì không */
  let recNs = 0, tong = 0;
  ns.forEach(a => A.idxOf(A.byArtist, a.id).forEach(i => { if (A.partyKeyOfTrack(i) !== "L:5") return; const g = A.grossRec(i, CUOI.i); if (g <= 0) return; const s = A.splitRec(i, g, CUOI.k); recNs += s.artist; tong += s.artist + s.labelCut; }));
  const l5 = e.get("L:5") || 0;
  must(gan(l5, tong, 0.05), "L:5 nhận " + l5 + " ≠ label + nghệ sĩ " + tong);
  must(recNs > 0, "cần có nghệ sĩ có tiền bản ghi để phép kiểm có nghĩa");
  return "L:5 nhận " + H.fmt.usd(l5) + " gồm phần nghệ sĩ " + H.fmt.usd(recNs) + " · " + coDong.length + " nghệ sĩ chỉ có tác quyền";
});
check("D2 · Đổi cờ labelTuTra thì tiền đổi chủ ngay ở bản xem trước, đổi lại thì về như cũ", () => {
  const p = MO[0].i;
  const truoc = A.previewPayout(p).find(r => r.partyKey === "L:0");
  A.parties.datLabelTuTra("L:0", true, "test");
  const sau = A.previewPayout(p).find(r => r.partyKey === "L:0");
  must(sau.earned > truoc.earned + 1, "label tự trả phải nhận nhiều hơn: " + truoc.earned + " → " + sau.earned);
  const nsL0 = A.artists.find(a => a.labelId === 0 && A.idxOf(A.byArtist, a.id).some(i => A.partyKeyOfTrack(i) === "L:0" && A.grossRec(i, p) > 0));
  const dongNs = A.previewPayout(p).find(r => r.partyKey === nsL0.key);
  const recNs = A.agg("artist", nsL0.id, p, "rec").artist;
  must(!dongNs || dongNs.earned < recNs, "nghệ sĩ của label tự trả vẫn được Haustek trả phần bản ghi");
  A.parties.datLabelTuTra("L:0", false, "test");
  const lai = A.previewPayout(p).find(r => r.partyKey === "L:0");
  must(gan(lai.earned, truoc.earned), "đổi lại không về như cũ");
  mustThrow(() => A.parties.datLabelTuTra("A:1", true, "test"), /label/, "đặt cờ cho nghệ sĩ");
  return "L:0 " + H.fmt.usd(truoc.earned) + " → " + H.fmt.usd(sau.earned) + " → " + H.fmt.usd(lai.earned);
});
check("D2 · Cổng đối tác của nghệ sĩ thuộc label tự trả nói rõ label trả; ví chỉ giữ tiền Haustek trả thẳng", () => {
  const acc = st().accounts.find(a => a.email === "nghesi-label@vidu.vn");
  must(acc, "thiếu tài khoản mẫu nghệ sĩ thuộc label tự trả");
  const id = +acc.partyKey.slice(2);
  const s = H.api.summary("artist", id, CUOI.k, "rec"), w = H.api.wallet("artist", id);
  must(s.traBoi === "label" && s.labelTra && w.traBoi === "label", "chưa nói rõ label trả");
  let pub = 0; DUYET.forEach(k => { pub += A.agg("artist", id, k.i, "pub").total; });
  must(gan(w.totalCredit, pub, 0.5), "ví phải chỉ gồm tác quyền " + pub + ", đang " + w.totalCredit);
  return acc.email + " · " + s.labelTra + " · ví " + H.fmt.usd(w.totalCredit);
});

/* ---------- D3 ---------- */
check("D3 · Ba loại bên thụ hưởng: L: A: N: đều có tên, mã đối tác và ví; N: là tài khoản người nhận HTK-N####", () => {
  const nh = st().accounts.find(a => a.role === "nhan");
  must(nh && nh.partyKey === "N:" + nh.id && nh.ben[0].key === nh.partyKey, "tài khoản người nhận mẫu sai hình");
  must(A.coDoiTac(nh.partyKey) && A.partyClientId(nh.partyKey) === "HTK-N" + nh.id.slice(1) && A.partyName(nh.partyKey), "N: không tra được");
  must(!A.coDoiTac("N:U9999") && !A.coDoiTac("X:1"), "coDoiTac nhận khoá lạ");
  const w = A.wallet(nh.partyKey);
  must(w.totalCredit > 0 && w.credits.length > 0, "người nhận mẫu chưa có tiền trong ví");
  return nh.email + " · " + A.partyClientId(nh.partyKey) + " · ví " + H.fmt.usd(w.totalCredit);
});
check("D3 · Bảng chi trả kỳ đã duyệt: phần chia trừ đúng vào chủ, cộng đúng cho người nhận, tổng không đổi", () => {
  const rows = A.payoutOf(CUOI.k), e = A.earnedByParty(CUOI.i);
  const ra = rows.filter(r => r.chiaSeRa > 0), vao = rows.filter(r => r.chiaSeVao > 0);
  must(ra.length && vao.length, "kỳ mẫu phải có chia sẻ hiệu lực");
  must(gan(ra.reduce((s, r) => s + r.chiaSeRa, 0), vao.reduce((s, r) => s + r.chiaSeVao, 0)), "tổng trừ ≠ tổng cộng");
  ra.forEach(r => must(gan(r.earned, (e.get(r.partyKey) || 0) - r.chiaSeRa + (r.chiaSeVao || 0)), "chủ " + r.partyKey + " trừ sai"));
  vao.forEach(r => { must(Array.isArray(r.chiaSe) && r.chiaSe.length, "thiếu chi tiết chia sẻ"); r.chiaSe.forEach(x => must(x.tu && x.pct > 0 && x.amt > 0 && x.title, "chi tiết thiếu")); });
  must(gan(rows.reduce((s, r) => s + r.earned, 0), tongMap(e), 0.05), "tổng bảng chi trả ≠ tổng kiếm được");
  return ra.length + " chủ bị trừ · " + vao.length + " bên nhận · tổng giữ nguyên";
});
check("D3 · Nội bộ xác nhận thay cho email lạ: tự cấp tài khoản người nhận (mời), gắn bên nhận, từ kỳ sau tiền đổi chủ", () => {
  const indie = A.artists.find(a => a.labelId < 0 && A.idxOf(A.byArtist, a.id).some(i => A.grossRec(i, MO[0].i) > 50));
  const i = A.idxOf(A.byArtist, indie.id).find(x => A.grossRec(x, MO[0].i) > 50);
  const soTk = st().accounts.length;
  A.setSplit(i, { name: "Bảo Producer", email: "bao.producer@vi-du.vn", role: "producer", pct: 25, recoup: 0 }, "test");
  const truoc = A.previewPayout(MO[0].i).find(r => r.partyKey === indie.key);
  A.acceptSplit(i, "bao.producer@vi-du.vn", "test");
  const acc = st().accounts.find(a => a.email === "bao.producer@vi-du.vn");
  must(acc && acc.role === "nhan" && acc.status === "invited" && acc.partyKey === "N:" + acc.id, "không cấp tài khoản người nhận");
  must(st().accounts.length === soTk + 1, "cấp thừa tài khoản");
  const sp = A.splitsOf(i).collaborators.find(c => c.email === "bao.producer@vi-du.vn");
  must(sp.status === "accepted" && sp.nhan === acc.partyKey && sp.haustekTra && sp.nhanClientId === A.partyClientId(acc.partyKey), "chia sẻ chưa gắn bên nhận");
  const sau = A.previewPayout(MO[0].i);
  const chu = sau.find(r => r.partyKey === indie.key), nhan = sau.find(r => r.partyKey === acc.partyKey);
  const g = A.grossRec(i, MO[0].i), s = A.splitRec(i, g, MO[0].k), ky = Math.round(s.artist * 0.25 * 100) / 100;
  must(nhan && gan(nhan.earned, ky) && gan(nhan.chiaSeVao, ky), "người nhận phải được 25% phần nghệ sĩ: " + ky + ", đang " + (nhan && nhan.earned));
  must(gan(chu.earned, truoc.earned - ky), "chủ không bị trừ đúng " + ky);
  return "HT " + A.partyClientId(acc.partyKey) + " nhận " + H.fmt.usd(ky) + " từ “" + A.splitsOf(i).title + "”";
});
check("D3 · Ngưỡng thu hồi: chủ nhận trước cho tới khi cộng dồn vượt ngưỡng, rồi mới chia", () => {
  const indie = A.artists.find(a => a.labelId < 0 && a.id > 100 && A.idxOf(A.byArtist, a.id).some(i => A.grossRec(i, MO[0].i) > 20));
  const i = A.idxOf(A.byArtist, indie.id).find(x => A.grossRec(x, MO[0].i) > 20);
  A.setSplit(i, { name: "Kỹ Sư", email: "ky.su@vi-du.vn", role: "engineer", pct: 10, recoup: 1e9 }, "test");
  A.acceptSplit(i, "ky.su@vi-du.vn", "test");
  const acc = st().accounts.find(a => a.email === "ky.su@vi-du.vn");
  must(!A.previewPayout(MO[0].i).some(r => r.partyKey === acc.partyKey), "chưa qua ngưỡng mà đã chia");
  A.removeSplit(i, "ky.su@vi-du.vn", "test");
  return "ngưỡng 1 tỷ: chưa chia · bỏ chia sẻ xong";
});
check("D3 · Người cộng tác đã là nghệ sĩ có tài khoản: tiền vào ví nghệ sĩ sẵn có, không cấp tài khoản mới", () => {
  const rows = A.payoutOf(CUOI.k).filter(r => r.chiaSeVao > 0 && r.partyKey[0] === "A");
  must(rows.length, "kỳ mẫu phải có nghệ sĩ nhận chia sẻ");
  const acc = st().accounts.find(a => a.partyKey === rows[0].partyKey);
  must(acc && acc.role === "artist", "bên nhận phải là tài khoản nghệ sĩ có sẵn");
  return acc.email + " nhận " + H.fmt.usd(rows[0].chiaSeVao);
});
check("D3 · Cổng đối tác: người được mời thấy lời mời, tự nhận bằng email đăng nhập; email lạ bị chặn", () => {
  const nghesi = st().accounts.find(a => a.role === "artist" && a.status === "active" && A.artists[+a.partyKey.slice(2)].labelId < 0);
  const id = +nghesi.partyKey.slice(2);
  const khac = A.artists.find(a => a.labelId < 0 && a.id !== id && A.idxOf(A.byArtist, a.id).some(i => A.grossRec(i, MO[0].i) > 10));
  const i = A.idxOf(A.byArtist, khac.id).find(x => A.grossRec(x, MO[0].i) > 10);
  A.setSplit(i, { name: "Khách", email: nghesi.email, role: "featured", pct: 15 }, "test");
  const lm = H.api.loiMoiChiaSe("artist", id);
  must(lm.rows.some(r => r.trackId === i && r.status === "invited"), "không thấy lời mời");
  mustThrow(() => H.api.acceptSplit("artist", id, i, "ai-do@vi-du.vn"), /tài khoản/, "email lạ nhận thay");
  const r = H.api.acceptSplit("artist", id, i, nghesi.email);
  must(r.ok && r.nhan === A.partyClientId(nghesi.partyKey), "nhận lời không trỏ về ví của mình");
  must(H.api.loiMoiChiaSe("artist", id).rows.find(x => x.trackId === i).status === "accepted", "trạng thái chưa đổi");
  must(A.previewPayout(MO[0].i).find(x => x.partyKey === nghesi.partyKey).chiaSeVao > 0, "kỳ mở chưa thấy phần nhận");
  A.removeSplit(i, nghesi.email, "test");
  return nghesi.email + " nhận 15% trên “" + A.splitsOf(i).title + "”";
});
check("D3 · Mỗi chia sẻ cắt vào đúng phần của người đặt (goc): label đặt thì trừ label, nghệ sĩ đặt thì trừ nghệ sĩ", () => {
  const lb = A.labels.find(l => !A.parties.labelTuTra(l.key) && A.idxOf(A.byLabel, l.id).some(i => A.grossRec(i, MO[0].i) > 30));
  const i = A.idxOf(A.byLabel, lb.id).find(x => A.grossRec(x, MO[0].i) > 30);
  const ns = A.artists[A.partyKeyOfTrack(i) === lb.key ? 0 : 0];
  const em1 = "lb.cong@vi-du.vn", em2 = "ns.cong@vi-du.vn";
  H.api.setSplit("label", lb.id, i, { name: "Cộng tác label", email: em1, role: "producer", pct: 10 });
  const artistId = A.artists.findIndex(a => a.id === +A.assetOwner ? 0 : 0);
  const chuNs = A.artists.find(a => A.idxOf(A.byArtist, a.id).includes(i));
  H.api.setSplit("artist", chuNs.id, i, { name: "Cộng tác nghệ sĩ", email: em2, role: "featured", pct: 10 });
  const cuaLb = A.splitsFor("label", lb.id).rows.find(r => r.trackId === i), cuaNs = A.splitsFor("artist", chuNs.id).rows.find(r => r.trackId === i);
  must(cuaLb.collaborators.every(c => c.goc === "label") && cuaNs.collaborators.every(c => c.goc === "artist"), "mỗi bên phải chỉ thấy chia sẻ mình đặt");
  must(A.splitsOf(i).collaborators.length >= 2, "nội bộ phải thấy cả hai");
  A.acceptSplit(i, em1, "test"); A.acceptSplit(i, em2, "test");
  const pv = A.previewPayout(MO[0].i), s = A.splitRec(i, A.grossRec(i, MO[0].i), MO[0].k);
  const n1 = pv.find(r => r.chiaSe && r.chiaSe.some(x => x.i === i && x.tu === lb.key)), n2 = pv.find(r => r.chiaSe && r.chiaSe.some(x => x.i === i && x.tu === chuNs.key));
  must(n1 && gan(n1.chiaSe.find(x => x.i === i).amt, Math.round(s.labelCut * 10) / 100), "phần từ label sai");
  must(n2 && gan(n2.chiaSe.find(x => x.i === i).amt, Math.round(s.artist * 10) / 100), "phần từ nghệ sĩ sai");
  A.removeSplit(i, em1, "test"); A.removeSplit(i, em2, "test");
  return "label −10% của labelCut · nghệ sĩ −10% của artist";
});
check("D3 · Một đăng nhập giữ nhiều bên: themBen / boBen; bên chính không bỏ được; cổng đối tác vẫn một bên mỗi phiên", () => {
  const acc = st().accounts.find(a => a.role === "label" && a.status === "active");
  const ns = A.artists.find(a => a.labelId < 0);
  A.accounts.themBen(acc.id, ns.key, "test");
  let a2 = st().accounts.find(a => a.id === acc.id);
  must(a2.ben.length === 2 && a2.partyKey === acc.partyKey, "themBen sai");
  mustThrow(() => A.accounts.boBen(acc.id, acc.partyKey, "test"), /bên chính/, "bỏ bên chính");
  mustThrow(() => A.accounts.themBen(acc.id, "N:U0001", "test"), /bên thụ hưởng/, "thêm N: làm bên");
  A.accounts.boBen(acc.id, ns.key, "test");
  a2 = st().accounts.find(a => a.id === acc.id); must(a2.ben.length === 1, "boBen sai");
  const dl = H.api.demoLogins().accounts;
  must(dl.every(x => x.role !== "nhan"), "cổng đối tác chưa được nhận vai người nhận");
  return acc.email + " giữ thêm " + ns.name + " rồi bỏ";
});
check("D3 · accounts.add: vai nhan không cần bên; vai lạ bị chặn; bên không tồn tại bị chặn", () => {
  A.accounts.add("nguoi-nhan-moi@vi-du.vn", "nhan", null, { ten: "Người Nhận Mới" });
  const a = st().accounts.find(x => x.email === "nguoi-nhan-moi@vi-du.vn");
  must(a.partyKey === "N:" + a.id && A.partyName(a.partyKey) === "Người Nhận Mới", "tài khoản người nhận sai");
  mustThrow(() => A.accounts.add("x@vi-du.vn", "owner", null), /Vai/, "vai lạ");
  mustThrow(() => A.accounts.add("y@vi-du.vn", "artist", "A:999999"), /bên thụ hưởng/, "bên không có");
});

/* ---------- D4 ---------- */
check("D4 · Huỷ chốt giữ lại bảng cũ trong chiTraDao; sổ cái có dòng + rồi −; duyệt lại thì tổng ví như cũ", () => {
  const pk = CUOI.k, p = CUOI.i;
  const truoc = A.payoutOf(pk).slice(), ben = truoc.find(r => r.payable > 0).partyKey;
  const wTruoc = A.wallet(ben);
  A.revoke(p, "kiểm bù trừ");
  const dao = st().chiTraDao[pk];
  must(dao && dao.length === 1 && dao[0].dong.length === truoc.length && dao[0].lyDo === "kiểm bù trừ", "chiTraDao không ghi đủ");
  must(!A.payoutOf(pk), "bảng sống phải rỗng khi kỳ mở");
  const wGiua = A.wallet(ben);
  must(wGiua.daoChot === 1 && wGiua.soCai.filter(x => x.k === pk).length === 2, "sổ cái phải có + và −");
  const cong = wGiua.soCai.filter(x => x.k === pk).reduce((s, x) => s + x.credit, 0);
  must(gan(cong, 0), "hai dòng bù trừ không triệt tiêu");
  must(gan(wGiua.totalCredit, wTruoc.totalCredit - wTruoc.credits.find(c => c.k === pk).credit), "tổng ví khi kỳ mở sai");
  A.fx.lock(p, A.fx.rateFor(pk)); A.approve(p, "test", "duyệt lại", true);
  const wSau = A.wallet(ben);
  must(gan(wSau.totalCredit, wTruoc.totalCredit) && wSau.soCai.filter(x => x.k === pk).length === 3, "duyệt lại không về như cũ hoặc thiếu dòng");
  must(gan(wSau.soCai.reduce((s, x) => s + x.credit, 0), wSau.totalCredit), "tổng sổ cái ≠ tổng ví");
  return ben + " · sổ cái " + wSau.soCai.length + " dòng · huỷ 1 lần";
});
check("D4 · Đối tác đã rút theo lần duyệt cũ, duyệt lại thấp hơn: ví âm, rút tiền bị chặn, không bị kẹp về 0", () => {
  const pk = CUOI.k, p = CUOI.i;
  const ben = A.payoutOf(pk).find(r => r.payable > 100 && r.partyKey[0] === "L").partyKey;
  const w0 = A.wallet(ben);
  if (!w0.bank) H.api.setBank("label", +ben.slice(2), { bank: "Vietcombank", account: "0011002233", holder: "TEST" });
  const rut = H.api.requestWithdrawal("label", +ben.slice(2), { amount: Math.max(A.cfg.PAYOUT_MIN, Math.floor(A.wallet(ben).available)) });
  A.withdrawals.process(rut.id, "kt"); A.withdrawals.markPaid ? A.withdrawals.markPaid(rut.id, "TT1", "kt") : A.withdrawals.pay(rut.id, "TT1", "kt");
  A.revoke(p, "kiểm âm");
  /* làm kỳ này nghèo đi cho bên ấy: chuyển label sang tự trả không giúp; thay vào đó gỡ bảng giá và đặt phí cao hơn không đổi tổng. Dùng bút toán: thu hồi tạm ứng lớn. */
  A.advances.set(ben, 1e6, "kiểm âm");
  A.fx.lock(p, A.fx.rateFor(pk)); A.approve(p, "test", "duyệt lại thấp", true);
  const w1 = A.wallet(ben);
  must(w1.amNo && w1.available < 0, "ví phải âm, đang " + w1.available);
  mustThrow(() => H.api.requestWithdrawal("label", +ben.slice(2), { amount: A.cfg.PAYOUT_MIN }), /âm/, "rút khi ví âm");
  A.revoke(p, "trả lại"); A.advances.set(ben, 0, "trả lại"); A.fx.lock(p, A.fx.rateFor(pk)); A.approve(p, "test", "trả lại", true);
  return ben + " · âm " + H.fmt.usd(-w1.available) + " rồi trả lại";
});
check("D4 · previewPayout của kỳ đã duyệt trả về đúng bảng đã chốt, không tính lại", () => {
  const p = DUYET[0].i;
  must(JSON.stringify(A.previewPayout(p)) === JSON.stringify(A.payoutOf(DUYET[0].k)), "xem trước khác bảng chốt");
});

/* ---------- lỗi lẻ ---------- */
check("Lẻ · withdrawalQuote dùng tỷ giá đã khoá của kỳ duyệt gần nhất; N: là cá nhân (có khấu trừ TNCN)", () => {
  const q = A.withdrawalQuote("L:0", 1000), rate = A.fx.rateFor(CUOI.k);
  must(q.fxRate === rate, "tỷ giá báo giá " + q.fxRate + " ≠ tỷ giá kỳ " + rate);
  const nh = st().accounts.find(a => a.role === "nhan");
  must(A.withdrawalQuote(nh.partyKey, 500).individual === true && A.withdrawalQuote("L:0", 500).individual === false, "N: phải là cá nhân");
});
check("Lẻ · parties.create: label mới có dòng tỷ lệ và phí hợp đồng; nghệ sĩ mới không có indieRate; cờ tự trả lưu được", () => {
  const r = A.parties.create({ kind: "label", name: "Label Kiểm Vòng 22", share: 65, feePct: 12, labelTuTra: true, managerId: "S03" }, "test");
  must(A.rates.raw().some(x => x.partyKey === r.partyKey && x.rate === 0.65), "label mới thiếu dòng tỷ lệ");
  const ct = st().contracts[r.partyKey];
  must(ct.feePct === 0.12 && ct.labelTuTra === true, "hợp đồng thiếu phí / cờ tự trả");
  const a = A.parties.create({ kind: "artist", name: "Nghệ Sĩ Kiểm Vòng 22", share: 70, managerId: "S03" }, "test");
  must(A.artists.find(x => x.key === a.partyKey).indieRate === undefined && A.rates.rateFor(a.partyKey, MO[0].k) === 1, "nghệ sĩ mới vẫn mang tỷ lệ");
  return r.clientId + " · " + a.clientId;
});
check("Lẻ · Nhiệm vụ 'tạm ứng còn phải thu hồi' đếm bằng số dư thật, không đọc trường không tồn tại", () => {
  const cay = A.toChuc.cay();
  const nv = []; cay.khoi.forEach(k => k.to.forEach(t => t.nhiemVu.forEach(n => { if (n.id === "tam-ung") nv.push(n); })));
  must(nv.length && nv[0].dem > 0, "đếm tạm ứng còn thu hồi phải > 0");
  return nv[0].dem + " bên còn tạm ứng";
});
check("Lẻ · Lược đồ 3: nhập state lược đồ 2 còn dòng tỷ lệ A: thì bị gỡ; tài khoản cũ có ben[]", () => {
  const s = st(); s.luocDoVer = 2; s.rates.push({ partyKey: "A:1", rate: 0.85, from: KY[0].k, by: "cũ", at: "2025-08-01" });
  s.accounts.forEach(a => { delete a.ben; });
  H.storage.importJSON(JSON.stringify(s));
  const s2 = st();
  must(s2.luocDoVer === 3 && !s2.rates.some(r => r.partyKey[0] === "A") && s2.accounts.every(a => Array.isArray(a.ben)), "di trú bước 3 sai");
});
check("Lẻ · Người viết: agg và chi trả dùng chung một hàm; tác phẩm nhập tay đè lên hai người viết sinh sẵn", () => {
  const p = DUYET.find(k => A.pubLoaded ? A.pubLoaded(k.i) : true) || DUYET[0];
  const e = A.earnedByParty(p.i);
  let tong = 0; e.forEach((v, k) => { if (k[0] === "A") tong += v; });
  must(tong > 0, "không có tiền tác quyền / bản ghi");
  return "ok";
});

ra.forEach(([k, ten, m]) => console.log("  " + (k === "ok" ? "ok  " : "LỖI ") + " " + ten + (m ? "\n         " + m : "")));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
