/* =====================================================================
   KIỂM RANH GIỚI CỔNG ĐỐI TÁC — chạy bằng Node, không cần trình duyệt
   ---------------------------------------------------------------------
   Portal v3 là sổ theo dõi việc và kênh thông báo. Nó giữ đúng một thứ
   nguy hiểm: những dòng nội bộ mà nhân viên viết về đối tác. Một câu ghi
   chú kiểu "đối tác này hay trả chậm, cẩn thận" lọt sang cổng đối tác là
   mất một khách hàng, và không có nút hoàn tác nào cứu được.

   Nên phép kiểm quan trọng nhất ở đây không phải là quyền đọc số liệu,
   mà là: MỘT DÒNG NỘI BỘ KHÔNG CÓ ĐƯỜNG NÀO RA ĐƯỢC CỔNG ĐỐI TÁC.

   Bản mẫu chưa có database nên chưa viết được Row Level Security thật.
   Nhưng ranh giới thì đã có: HAUSTEK.api là mặt tiền duy nhất đối tác
   chạm tới. Khi lên Postgres, dịch từng phép kiểm ở đây thành một policy
   RLS theo doiTacId.

       node portal/test/api-guard.js
   ===================================================================== */
"use strict";
const path = require("path");
const fs = require("fs");
const vm = require("vm");

/* Nạp lõi trong hộp cách ly, với localStorage giả. Không dùng require vì
   lõi là IIFE gắn vào global, không phải module. */
function napLoi() {
  const mem = {};
  const g = {
    console, JSON, Math, Object, Array, String, Number, Boolean, Error, RegExp,
    Date, isNaN, parseInt, parseFloat, Map, Set, Intl,
    localStorage: {
      getItem: k => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: k => { delete mem[k]; }
    }
  };
  g.globalThis = g;
  vm.createContext(g);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "haustek-loi.js"), "utf8"), g, { filename: "haustek-loi.js" });
  return g.HAUSTEK;
}

const H = napLoi();
const A = H.admin;
const api = H.api;

let pass = 0, fail = 0;
const results = [];
function check(name, fn) {
  try { const msg = fn(); pass++; results.push(["ok", name, msg || ""]); }
  catch (e) { fail++; results.push(["LỖI", name, e.message]); }
}
function must(cond, msg) { if (!cond) throw new Error(msg); }
function mustThrow(fn, name) {
  let threw = false, m = "";
  try { fn(); } catch (e) { threw = true; m = e.message; }
  must(threw, name + " — đáng lẽ phải bị chặn nhưng lại trả về dữ liệu");
  return m;
}
/* Tìm một chuỗi ở BẤT KỲ độ sâu nào của kết quả trả về. Kiểm từng trường
   một thì chỉ cần lõi thêm một trường mới là lỗ hổng đi qua lọt. */
function chua(o, chuoi) { return JSON.stringify(o).indexOf(chuoi) >= 0; }

const DT = A.doiTac.list();
/* Chọn hai đối tác ĐỀU có bảng kê và bản phát hành. Chọn bừa thì một nửa
   phép kiểm rơi vào nhánh "bỏ qua" mà bảng kết quả vẫn xanh mướt, và một
   test luôn xanh vì không chạy còn tệ hơn không có test. */
function daySo(id) {
  return A.bangKe.list({ doiTacId: id }).length > 0
      && A.banPhatHanh.list({ doiTacId: id }).length > 0
      && A.viec.list({ doiTacId: id }).length > 0;
}
const DAY = DT.filter(d => daySo(d.id));
if (DAY.length < 2) { console.error("dữ liệu mẫu không đủ để kiểm ranh giới"); process.exit(1); }
const A1 = DAY[0].id, A2 = DAY[Math.floor(DAY.length / 2)].id;

/* =====================================================================
   1. DÒNG NỘI BỘ KHÔNG RÒ — phần quan trọng nhất của cả file này
   ===================================================================== */

const BIMAT = "BIMAT-KHONG-DUOC-LO-" + A1;

check("ghi chú nội bộ không ra cổng đối tác", () => {
  A.dong.ghiChuNoiBo({ doiTacId: A1, noiDung: BIMAT + " · đối tác hay trả chậm" });
  must(!chua(api.traoDoi(A1), BIMAT), "rò qua api.traoDoi");
  must(!chua(api.trangChu(A1), BIMAT), "rò qua api.trangChu");
  must(!chua(api.viec(A1), BIMAT), "rò qua api.viec");
  must(!chua(api.taiLieu(A1), BIMAT), "rò qua api.taiLieu");
  must(!chua(api.taiKhoan(A1), BIMAT), "rò qua api.taiKhoan");
  must(!chua(A.dong.choDoiTac(A1), BIMAT), "rò qua A.dong.choDoiTac (ô soi trước khi gửi)");
  return "kiểm cả bảy lối ra";
});

check("nhật ký liên lạc nội bộ không ra cổng đối tác", () => {
  const T = "LIENLAC-" + A1;
  A.dong.ghiLienLac({ doiTacId: A1, tomTat: T, kenh: "goi", ketQua: "da-chot" });
  must(!chua(api.traoDoi(A1), T), "rò qua api.traoDoi");
  must(!chua(A.dong.choDoiTac(A1), T), "rò qua A.dong.choDoiTac");
  return "";
});

check("A.dong.choDoiTac chỉ trả dòng hienChoDoiTac = true", () => {
  DT.slice(0, 12).forEach(d => {
    const ds = A.dong.choDoiTac(d.id);
    must(ds.every(x => x.hienChoDoiTac === true), d.ten + " có dòng hienChoDoiTac khác true");
    must(ds.every(x => x.loai !== "ghi-chu" && x.loai !== "lien-lac"), d.ten + " lọt loại dòng nội bộ");
    must(ds.every(x => x.doiTacId === d.id), d.ten + " lọt dòng của đối tác khác");
  });
  return "12 đối tác";
});

check("dòng ghi-chu bị ép hienChoDoiTac = false dù người gọi cố đặt true", () => {
  const T = "EPBUOC-" + Date.now();
  const d = A.dong.them({ doiTacId: A1, loai: "ghi-chu", tieuDe: T, noiDung: T, hienChoDoiTac: true });
  must(d.hienChoDoiTac === false, "lõi cho phép ghi chú nội bộ mang cờ hiện cho đối tác");
  must(!chua(api.traoDoi(A1), T), "và nó rò ra thật");
  return "";
});

check("A.dong.them ném lỗi nếu không nói rõ hienChoDoiTac", () => {
  mustThrow(() => A.dong.them({ doiTacId: A1, loai: "tin-nhan", tieuDe: "x" }), "thiếu hienChoDoiTac");
  mustThrow(() => A.dong.them({ loai: "tin-nhan", tieuDe: "x", hienChoDoiTac: true }), "thiếu doiTacId");
  return "mặc định im lặng là cách rò dữ liệu phổ biến nhất, nên ở đây không có mặc định";
});

/* =====================================================================
   2. ĐỐI TÁC A KHÔNG THẤY GÌ CỦA ĐỐI TÁC B
   ===================================================================== */

check("mọi lối đọc của cổng đối tác đều đóng khung theo doiTacId", () => {
  ["trangChu", "viec", "nhac", "thanhToan", "traoDoi", "taiLieu", "taiKhoan"].forEach(k => {
    const r1 = api[k](A1);
    must(!chua(r1, A2), "api." + k + " của " + A1 + " nhắc tới " + A2);
  });
  return "bảy lối";
});

check("việc của đối tác khác không mở được", () => {
  const vB = A.viec.list({ doiTacId: A2 })[0];
  must(vB, "không có việc nào của đối tác B để thử");
  const ds = api.viec(A1).viec || api.viec(A1);
  must(!chua(ds, vB.id), "việc " + vB.id + " của B lọt vào danh sách của A");
  mustThrow(() => api.traLoi(A1, vB.id, "chen vào việc của người khác"), "trả lời việc của đối tác khác");
  return "";
});

check("bảng kê của đối tác khác không đọc được", () => {
  const bkB = A.bangKe.list({ doiTacId: A2 })[0];
  if (!bkB) return "đối tác B chưa có bảng kê, bỏ qua";
  must(!chua(api.thanhToan(A1), bkB.id), "bảng kê " + bkB.id + " của B lọt sang A");
  return "";
});

check("bản phát hành của đối tác khác không đọc được", () => {
  const bB = A.banPhatHanh.list({ doiTacId: A2 })[0];
  if (!bB) return "đối tác B chưa có bản phát hành, bỏ qua";
  must(!chua(api.nhac(A1), bB.id), "bản phát hành " + bB.id + " của B lọt sang A");
  return "";
});

check("doiTacId không có thật thì ném lỗi, không trả rỗng", () => {
  mustThrow(() => api.trangChu("DT-KHONG-CO"), "trangChu với mã bịa");
  mustThrow(() => api.thanhToan(""), "thanhToan với mã rỗng");
  return "trả rỗng thì lỗi phân quyền trông y hệt 'chưa có dữ liệu'";
});

/* =====================================================================
   3. LƯỢT ĐỌC THÔNG BÁO LÀ CỦA TỪNG NGƯỜI, KHÔNG PHẢI CỦA CẢ CÔNG TY
   ===================================================================== */

check("hai người dùng cùng một đối tác có lượt đọc riêng", () => {
  const nds = A.doiTac.nguoiDung(A1);
  if (nds.length < 2) return "đối tác này chỉ có một người dùng, bỏ qua";
  const chua1 = api.chuaDoc(A1, nds[0].id);
  if (!chua1.length) return "không có thông báo chưa đọc, bỏ qua";
  const tb = chua1[0].thongBaoId;
  api.danhDauDaDoc(A1, tb, nds[0].id);
  must(!api.chuaDoc(A1, nds[0].id).some(x => x.thongBaoId === tb), "người thứ nhất vẫn thấy chưa đọc");
  must(api.chuaDoc(A1, nds[1].id).some(x => x.thongBaoId === tb), "đánh dấu hộ cả người thứ hai");
  return "";
});

/* =====================================================================
   4. CỔNG ĐỐI TÁC CHỈ THẤY VIỆC ĐƯỢC PHÉP THẤY
   ===================================================================== */

check("việc hienChoDoiTac = false không lọt sang cổng đối tác", () => {
  /* Sửa thẳng trên state: A.viec.list() trả BẢN SAO, nên đặt cờ trên bản
     sao thì chẳng kiểm được gì mà test vẫn xanh. */
  const v = A.state().viec.filter(x => x.doiTacId === A1)[0];
  must(v, "không có việc nào để thử");
  v.hienChoDoiTac = false;
  const ds = api.viec(A1);
  must(!chua(ds, v.id), "việc bị ẩn vẫn hiện ở cổng đối tác");
  v.hienChoDoiTac = true;
  return "";
});

check("api.viec chỉ trả việc của chính đối tác đó", () => {
  DT.slice(0, 8).forEach(d => {
    const r = api.viec(d.id);
    const ds = r.viec || r;
    (Array.isArray(ds) ? ds : []).forEach(v => {
      must(!v.doiTacId || v.doiTacId === d.id, d.ten + " thấy việc của đối tác khác");
    });
  });
  return "8 đối tác";
});

/* =====================================================================
   5. LỜI HỨA CÔNG KHAI PHẢI ĐẾN TỪ MỘT NƠI DUY NHẤT
   ===================================================================== */

check("đổi cam kết phản hồi thì câu ở cổng đối tác đổi theo", () => {
  const truoc = api.camKet("phat-hanh");
  A.caiDat.datCamKet("phat-hanh", 5);
  const sau = api.camKet("phat-hanh");
  must(truoc !== sau, "đổi cam kết mà câu công khai không đổi: đang có hai nguồn sự thật");
  must(String(sau).indexOf("5") >= 0, "câu công khai không nhắc con số mới: " + sau);
  const bn = api.guiYeuCau(A1, { dichVu: "phat-hanh", tieuDe: "Thử biên nhận", noiDung: "kiểm" });
  must(bn.hanPhanHoi, "biên nhận không có hạn phản hồi");
  must(String(bn.bienNhan).length > 20, "biên nhận không phải một câu tử tế");
  return sau;
});

check("cam kết mới ghi một dòng nhật ký, không đổi lén", () => {
  const nk = A.nhatKy(20);
  must(nk.some(x => x.hanhDong === "dich-vu.cam-ket"), "đổi lời hứa với đối tác mà không ai biết ai đổi");
  return "";
});

/* =====================================================================
   6. GỬI THÔNG BÁO SINH ĐÚNG SỐ DÒNG, KHÔNG THỪA KHÔNG THIẾU
   ===================================================================== */

check("gửi theo nhóm dịch vụ sinh đúng một dòng cho mỗi đối tác nhận", () => {
  const truoc = A.state().dong.length;
  const guiToi = { kieu: "theo-dich-vu", dichVu: ["su-kien"] };
  const nhan = A.thongBao.nguoiNhan(guiToi);
  must(nhan.doiTac.length > 0, "không đối tác nào mua su-kien, không kiểm được");
  A.thongBao.gui({ tieuDe: "Thử gửi nhóm", noiDung: "kiểm số dòng sinh ra", guiToi: guiToi });
  const them = A.state().dong.length - truoc;
  must(them === nhan.doiTac.length,
    "gửi cho " + nhan.doiTac.length + " đối tác mà sinh " + them + " dòng");
  return nhan.doiTac.length + " đối tác, " + them + " dòng";
});

check("thông báo gửi đi thì đối tác nhận đọc được, đối tác ngoài nhóm thì không", () => {
  const guiToi = { kieu: "chon", doiTacIds: [A1] };
  const tb = A.thongBao.gui({ tieuDe: "Chỉ gửi riêng " + A1, noiDung: "riêng", guiToi: guiToi });
  must(chua(api.traoDoi(A1), tb.id) || chua(api.traoDoi(A1), "Chỉ gửi riêng"), "đối tác nhận không thấy");
  must(!chua(api.traoDoi(A2), "Chỉ gửi riêng"), "đối tác ngoài danh sách lại thấy");
  return "";
});

/* =====================================================================
   7. PORTAL KHÔNG TỰ TÍNH TIỀN — con số thứ hai luôn là con số sai
   ===================================================================== */

check("số tiền cổng đối tác thấy đúng bằng số ghi trên bảng kê, kèm nguồn", () => {
  const bk = A.bangKe.list({ doiTacId: A1 });
  if (!bk.length) return "đối tác này chưa có bảng kê, bỏ qua";
  const tt = api.thanhToan(A1);
  const ds = tt.bangKe || tt.ky || [];
  must(ds.length > 0, "cổng đối tác không thấy bảng kê nào");
  ds.forEach(x => {
    const goc = bk.filter(b => b.id === x.id)[0];
    if (!goc) return;
    must(x.soTien === goc.soTien, "số tiền bị tính lại: " + x.soTien + " ≠ " + goc.soTien);
    must(!!x.nguon, "số tiền không kèm nguồn, người đọc không biết nó từ đâu ra");
  });
  return ds.length + " kỳ";
});

check("không có lối nào ở cổng đối tác trả về tổng doanh thu tự cộng", () => {
  const r = JSON.stringify([api.trangChu(A1), api.thanhToan(A1), api.nhac(A1)]);
  ["doanhThu", "tongThu", "luotNghe", "duBao", "soDu", "viTien", "grossRate"].forEach(k => {
    must(r.indexOf(k) < 0, "cổng đối tác trả về trường '" + k + "' — thứ này thuộc OneRPM / Believe / YouTube CMS");
  });
  return "";
});

/* =====================================================================
   8. LOCKDOWN GỠ HẲN MẶT TIỀN NỘI BỘ
   ===================================================================== */

check("sau lockdown() không còn đường nào tới admin", () => {
  const H2 = napLoi();
  const dt = H2.admin.doiTac.list()[0].id;
  H2.lockdown();
  must(!H2.admin, "H.admin vẫn còn sau lockdown");
  must(typeof H2.api.traoDoi === "function", "lockdown gỡ nhầm cả cổng đối tác");
  /* và ranh giới vẫn giữ nguyên sau đó */
  const ds = H2.api.traoDoi(dt);
  must(JSON.stringify(ds).indexOf("ghi-chu") < 0, "sau lockdown vẫn lọt dòng nội bộ");
  return "";
});

/* Danh sách đăng nhập mẫu là chỗ dễ phình nhất trong cả mặt tiền đối tác:
   cửa mẫu cần thêm một trường để chọn mặc định cho đẹp, rồi thêm một
   trường nữa, và một ngày nào đó nó trả về cả doanh thu. Nên ghim cứng
   danh sách khoá ở đây: thêm trường mới thì phép kiểm này đỏ, và người
   thêm phải viết ra vì sao trường đó không phải dữ liệu kinh doanh. */
check("dangNhapMau chỉ là danh sách tên, không kèm dữ liệu kinh doanh", () => {
  const ds = api.dangNhapMau();
  must(ds.length > 0, "không có tài khoản mẫu nào");
  /* doiTacId, ten, loai, nguoiDungId, nguoiDungTen — để đăng nhập giả.
     dichVu, coNhac, coTien — dịch vụ đối tác mua, quyết định họ thấy mấy
       trang; cổng đối tác đằng nào cũng đọc được qua api.phien.
     soViec — đếm việc của CHÍNH họ, để cửa mẫu mở mặc định vào một đối
       tác có dữ liệu. Không phải số của ai khác. */
  const CHO_PHEP = "coNhac,coTien,dichVu,doiTacId,loai,nguoiDungId,nguoiDungTen,soViec,ten";
  const k = Object.keys(ds[0]).sort().join(",");
  must(k === CHO_PHEP, "dangNhapMau trả thêm trường ngoài dự kiến: " + k);
  /* Và tuyệt đối không có tiền, doanh thu hay lượt nghe của bất kỳ ai. */
  const r = JSON.stringify(ds);
  ["soTien", "doanhThu", "bangKe", "luotNghe", "nganHang", "hopDong"].forEach(x => {
    must(r.indexOf(x) < 0, "dangNhapMau lộ trường '" + x + "'");
  });
  return ds.length + " đối tác";
});

/* =====================================================================
   9. CẢNH BÁO CÓ CHỦ Ý
   ===================================================================== */

check("CẢNH BÁO · doiTacId đến từ tham số, không từ phiên máy chủ", () => {
  const r = api.trangChu(A2);
  must(r, "");
  return "Bản mẫu tĩnh nên api nhận doiTacId làm tham số. Khi lên thật, doiTacId " +
         "PHẢI lấy từ phiên trên máy chủ; không thì sửa một chuỗi trên URL là xem " +
         "được đối tác khác, và mọi phép kiểm phía trên thành vô nghĩa.";
});

/* ---- in kết quả ---- */
const W = Math.max.apply(null, results.map(r => r[1].length));
results.forEach(r => {
  const dau = r[0] === "ok" ? "  ✓" : "  ✗";
  console.log(dau + " " + r[1].padEnd(W) + (r[2] ? "   " + r[2] : ""));
});
console.log("\n" + (fail ? "✗ " + fail + " lỗi / " + (pass + fail) + " phép kiểm"
                        : "✓ " + pass + "/" + pass + " phép kiểm đạt"));
process.exit(fail ? 1 : 0);
