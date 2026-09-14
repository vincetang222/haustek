/* =====================================================================
   NHẬT KÝ ĐĂNG NHẬP — tám phép kiểm
   ---------------------------------------------------------------------
   Bản mẫu chạy trong trình duyệt, không có máy chủ, nên nó KHÔNG BIẾT
   địa chỉ IP của ai. Cột Địa chỉ IP vì thế luôn trống.

   Phép kiểm số 1 tồn tại để chặn đúng một việc, và việc ấy rất dễ xảy
   ra: một vòng sau có người thấy cột trống trông như chưa làm xong, rồi
   điền "113.161.44.12" vào cho đẹp. Từ giây phút đó mọi ảnh chụp màn
   hình của bản mẫu là một bằng chứng giả. Ba lớp chặn: ghiDangNhap()
   không có tham số ip nên không có chỗ nhét, phép kiểm này quét cả kho
   bằng regex bốn nhóm số, và lõi có một chú thích nói vì sao.

   Bảy phép còn lại kiểm luật gộp, lần bị từ chối, ranh giới gói của
   cổng đối tác, cách ly theo bên, trần, chính sách lưu và quyền đọc.

       node portal/test/dang-nhap.js
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
/* CỐ Ý không dựng global.navigator: shim Node không có nó, và mayNay()
   phải sống sót qua chuyện đó. Quên câu phòng thân trong lõi thì mọi
   phép kiểm dưới đây chết ở lời gọi moPhien đầu tiên bằng một
   ReferenceError lạc đề, chứ không phải bằng "1 hỏng". */
require(path.join(__dirname, "..", "haustek-core.js"));
const H = global.window.HAUSTEK, A = H.admin, api = H.api;

let pass = 0; const hong = [];
function kiem(ten, fn) {
  try { const m = fn(); pass++; console.log("  ok   " + ten + (m ? " · " + m : "")); }
  catch (e) { hong.push(ten + " — " + e.message); console.log("  LỖI  " + ten + " — " + e.message); }
}
function must(c, m) { if (!c) throw new Error(m); }
function phaiChan(fn, m) {
  let nem = false;
  try { fn(); } catch (e) { nem = true; }
  must(nem, m);
}

const TK = api.demoLogins().accounts.filter(a => a.status === "active");
must(TK.length >= 2, "cần ít nhất hai tài khoản đang hoạt động để chạy bài này");

/* Mở vài phiên ở cả hai cổng để có dữ liệu thật mà soi. */
TK.slice(0, 4).forEach(t => { try { api.moPhien(t.role, t.partyId); } catch (e) {} });
A.dangNhap.ghi();

/* ---------------------------------------------------------------------
   1. Không dòng nào có địa chỉ IP — phép canh chính
   --------------------------------------------------------------------- */
kiem("không dòng nhật ký nào mang địa chỉ IP", () => {
  const ds = A.dangNhap.list({ gioiHan: 999 });
  must(ds.length > 4, "chỉ có " + ds.length + " dòng, quá ít để kết luận");
  ds.forEach((d, i) => {
    must(d.ip === null, "dòng " + i + " có ip = " + JSON.stringify(d.ip));
    must(d.ipNguon === "khong-co", "dòng " + i + " khai ipNguon = " + d.ipNguon);
  });
  /* Quét cả kho: một địa chỉ nhét vào bất kỳ trường nào cũng lộ ra đây. */
  const kho = JSON.stringify(ds);
  const bat = kho.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
  must(!bat, "kho nhật ký chứa một chuỗi trông như địa chỉ IP: " + (bat && bat[0]));
  return ds.length + " dòng, không dòng nào có địa chỉ";
});

/* ---------------------------------------------------------------------
   2. Luật gộp: vào lại trong 30 phút thì cộng số lần, không thêm dòng
   --------------------------------------------------------------------- */
kiem("vào lại trong 30 phút thì gộp vào dòng cũ", () => {
  const t = TK[0];
  api.moPhien(t.role, t.partyId);
  const truoc = A.dangNhap.list({ gioiHan: 999 }).length;
  api.moPhien(t.role, t.partyId);
  api.moPhien(t.role, t.partyId);
  const ds = A.dangNhap.list({ gioiHan: 999 });
  must(ds.length === truoc, "gộp hỏng: " + truoc + " → " + ds.length + " dòng");
  must(ds[0].soLan >= 3, "số lần không cộng lên: " + ds[0].soLan);
  must(ds[0].denLuc >= ds[0].at, "denLuc " + ds[0].denLuc + " sớm hơn at " + ds[0].at);
  return "ba lần vào → một dòng, soLan = " + ds[0].soLan;
});

/* ---------------------------------------------------------------------
   3. Lần bị từ chối cũng để lại dấu vết
   --------------------------------------------------------------------- */
kiem("vào bằng tài khoản đã khoá thì bị chặn VÀ bị ghi lại", () => {
  const nhan = A.accounts.list().find(a => a.role === "nhan" && a.status === "active");
  must(nhan, "không có tài khoản người cộng tác nào đang hoạt động");
  A.accounts.setStatus(nhan.id, "suspended");
  try {
    const truoc = A.dangNhap.list({ gioiHan: 999, ket: "tu-choi" }).length;
    phaiChan(() => api.moPhien("nhan", nhan.id), "tài khoản đã khoá mà vẫn vào được");
    const sau = A.dangNhap.list({ gioiHan: 999, ket: "tu-choi" });
    must(sau.length === truoc + 1, "lần bị từ chối không được ghi (" + truoc + " → " + sau.length + ")");
    must(sau[0].ip === null, "dòng bị từ chối lại có địa chỉ IP");
    return "chặn đúng, ghi đúng một dòng · " + nhan.id;
  } finally { A.accounts.setStatus(nhan.id, "active"); }
});

/* ---------------------------------------------------------------------
   4. Gói của cổng đối tác không mang gì thừa
   --------------------------------------------------------------------- */
kiem("gói dangNhapCuaToi không có khoá ip, email hay mã nội bộ", () => {
  const t = TK[0];
  const goi = api.dangNhapCuaToi(t.role, t.partyId, 20);
  const cam = ["ip", "email", "cua", "ben", "nhanSu", "cong"];
  const thay = [];
  (function quet(o, duong) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach((x, i) => quet(x, duong + "[" + i + "]")); return; }
    Object.keys(o).forEach(k => {
      if (cam.indexOf(k) >= 0) thay.push(duong + "." + k);
      quet(o[k], duong + "." + k);
    });
  })(goi, "goi");
  must(!thay.length, "gói mang khoá cấm: " + thay.join(", "));
  must(JSON.stringify(goi).indexOf("@haustek-group.com") < 0, "gói mang email nhân sự Haustek");
  must(goi.coIp === 0, "coIp = " + goi.coIp + ", phải là 0");
  must(goi.chinhSach && goi.chinhSach.giuNgay > 0, "gói thiếu chính sách lưu");
  return goi.rows.length + " dòng · " + Object.keys(goi.rows[0] || {}).length + " trường mỗi dòng";
});

/* ---------------------------------------------------------------------
   5. Bên này không đọc được lần đăng nhập của bên kia
   --------------------------------------------------------------------- */
kiem("mỗi bên chỉ thấy lần đăng nhập của chính mình", () => {
  const a = TK[0], b = TK.find(x => x.partyId !== a.partyId || x.role !== a.role);
  must(b, "không tìm được hai bên khác nhau");
  api.moPhien(a.role, a.partyId);
  api.moPhien(b.role, b.partyId);
  const ga = api.dangNhapCuaToi(a.role, a.partyId, 99);
  const gb = api.dangNhapCuaToi(b.role, b.partyId, 99);
  must(ga.rows.length > 0 && gb.rows.length > 0, "một trong hai bên không có dòng nào");
  /* Hai gói không được trùng nhau về số dòng lẫn nội dung: nếu lọc theo
     bên hỏng thì cả hai sẽ trả về cùng một tập. */
  const toanBo = A.dangNhap.list({ gioiHan: 999, cong: "doi-tac" }).length;
  must(ga.tong < toanBo, "bên A thấy " + ga.tong + "/" + toanBo + " dòng — lọc theo bên không chạy");
  must(gb.tong < toanBo, "bên B thấy " + gb.tong + "/" + toanBo + " dòng — lọc theo bên không chạy");
  return "A " + ga.tong + " dòng · B " + gb.tong + " dòng · toàn cổng " + toanBo;
});

/* ---------------------------------------------------------------------
   6. Trần 300 dòng cắt ngay lúc ghi
   --------------------------------------------------------------------- */
kiem("nhật ký không vượt quá trần 300 dòng", () => {
  const t = TK[0], pk = t.role === "label" ? "L:" : t.role === "artist" ? "A:" : "N:";
  /* Đẩy thẳng vào state qua cửa xuất/nhập: sinh 350 dòng giả lập rồi
     nạp lại, để kiểm trần mà không phải chờ 350 lần gộp hết hạn. */
  const goc = JSON.parse(A.store.exportJSON());
  goc.dangNhap = [];
  for (let i = 0; i < 350; i++) {
    goc.dangNhap.push({
      at: "2026-09-01 00:" + String(i % 60).padStart(2, "0") + ":00",
      denLuc: "2026-09-01 00:" + String(i % 60).padStart(2, "0") + ":00", soLan: 1,
      cong: "doi-tac", ket: "ok", cua: null, nhanSu: null, email: "", vai: "label",
      ben: pk + t.partyId, thietBi: "khac", trinhDuyet: "", heDieuHanh: "",
      ip: null, ipNguon: "khong-co"
    });
  }
  A.store.importJSON(JSON.stringify(goc));
  api.moPhien(t.role, t.partyId);           /* một lần ghi kích hoạt cắt trần */
  const n = A.dangNhap.list({ gioiHan: 999 }).length;
  must(n <= 300, "còn " + n + " dòng, trần là 300");
  must(n >= 290, "cắt quá tay: còn " + n + " dòng");
  return "đẩy 350 dòng → còn " + n;
});

/* ---------------------------------------------------------------------
   7. Chính sách lưu 180 ngày, chạy hai lần cho cùng kết quả
   --------------------------------------------------------------------- */
kiem("dòng quá 180 ngày bị xoá, và dọn lần hai không xoá thêm gì", () => {
  const t = TK[0];
  const goc = JSON.parse(A.store.exportJSON());
  const cu = new Date(Date.now() - 200 * 86400000).toISOString().slice(0, 19).replace("T", " ");
  goc.dangNhap = [{
    at: cu, denLuc: cu, soLan: 1, cong: "doi-tac", ket: "ok", cua: null, nhanSu: null,
    email: "", vai: "label", ben: "L:0", thietBi: "khac", trinhDuyet: "", heDieuHanh: "",
    ip: null, ipNguon: "khong-co"
  }];
  A.store.importJSON(JSON.stringify(goc));
  must(A.dangNhap.list({ gioiHan: 999 }).some(d => d.at === cu), "dòng cũ không nạp được");
  api.moPhien(t.role, t.partyId);           /* ghi → kích donNhatKyDangNhap */
  const sau = A.dangNhap.list({ gioiHan: 999 });
  must(!sau.some(d => d.at === cu), "dòng 200 ngày tuổi vẫn còn");
  must(A.audit.list(50).some(a => a.action === "dangnhap.don"), "không có dòng audit chứng minh đã dọn");
  const n1 = sau.length;
  api.moPhien(t.role, t.partyId);           /* gộp, không sinh dòng mới */
  must(A.dangNhap.list({ gioiHan: 999 }).length === n1, "dọn lần hai xoá thêm dòng");
  return "xoá dòng 200 ngày tuổi · còn " + n1 + " dòng · dọn hai lần cùng kết quả";
});

/* ---------------------------------------------------------------------
   8. Quyền: ai cũng ghi được dòng của mình, chỉ quản trị đọc được toàn hệ
   --------------------------------------------------------------------- */
kiem("vai vận hành ghi được dòng của mình nhưng không đọc được toàn hệ", () => {
  const goc = A.staff.me.id;
  const ops = A.staff.list().find(s => s.role === "ops");
  must(ops, "không có nhân sự vai vận hành");
  try {
    A.staff.setMe(ops.id);
    A.dangNhap.ghi();                       /* phải chạy lọt */
    let ma = "";
    try { A.dangNhap.list(); } catch (e) { ma = e.code || e.message; }
    must(ma === "NO_QUYEN", "vai ops đọc được nhật ký toàn hệ (mã lỗi: " + (ma || "không ném") + ")");
    const cs = A.dangNhap.chinhSach();
    must(cs.giuNgay === 180, "vai ops không đọc được chính sách lưu");
  } finally { A.staff.setMe(goc); }         /* _me là biến toàn cục — quên trả lại là mọi dòng sau mang sai tên */
  must(A.dangNhap.list().length > 0, "trả lại vai cũ xong vẫn không đọc được");
  return "ops ghi được, không đọc được · " + A.staff.me.role + " đọc được";
});

console.log("\n" + pass + " đạt · " + hong.length + " hỏng");
process.exit(hong.length ? 1 : 0);
