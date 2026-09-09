/* =====================================================================
   QC · MA TRẬN QUYỀN CÓ NHẤT QUÁN KHÔNG
   ---------------------------------------------------------------------
   Phân quyền hỏng thì thường không kêu. Một quy tắc trỏ vào nhóm không
   tồn tại thì lúc CHẶN mới vỡ, mà chặn là đường ít ai đi. Một quy tắc
   trỏ vào tên hàm gõ sai thì hàm thật chạy tự do, không ai biết. Một
   trang mới quên khai vào danh sách thì mọi vai đều thấy.

   Bài này soát cả bốn hướng đó trên bảng thật của lõi.

       node portal/test/qc-quyen.js
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

const HAM  = A.quyen.ham(), MO = A.quyen.mo();
const BANG = A.quyen.bang();
const NHOM = BANG.nhom, MAN = BANG.man, KHOI = BANG.khoi;
const VAI  = A.quyen.vaiTatCa;

/* đi theo đường "a.b.c" trên mặt tiền admin */
function lay(duong) {
  return duong.split(".").reduce((o, k) => (o == null ? o : o[k]), A);
}

/* ================================================================= */
check("Mọi quy tắc đều trỏ vào một nhóm có thật", () => {
  const ma = Object.keys(HAM).filter(k => !NHOM[HAM[k]]);
  must(!ma.length, "nhóm không tồn tại: " + ma.map(k => k + " → " + HAM[k]).join(", "));
  return Object.keys(HAM).length + " quy tắc · " + Object.keys(NHOM).length + " nhóm";
});

check("Mọi quy tắc đều trỏ vào một hàm có thật trên mặt tiền", () => {
  const chet = Object.keys(HAM).filter(k => lay(k) === undefined);
  must(!chet.length, "quy tắc trỏ vào chỗ trống (hàm thật đang không ai gác): " + chet.join(", "));
  return "không quy tắc nào mồ côi";
});

check("Trong một đối tượng đã gác, không thành viên nào lọt ra ngoài", () => {
  /* boQuyen chỉ bọc đối tượng con khi nó CÓ nhóm hoặc có ít nhất một quy
     tắc "cha.con". Đối tượng có vài con được gác mà cha không có nhóm thì
     những con còn lại chạy tự do — đúng chỗ dễ quên nhất. Nên mọi hàm
     không gác phải nằm trong danh sách CỐ Ý để mở của lõi. */
  const cha = {};
  Object.keys(HAM).forEach(k => {
    const i = k.indexOf(".");
    if (i > 0) (cha[k.slice(0, i)] = cha[k.slice(0, i)] || []).push(k.slice(i + 1));
  });
  const ho = [];
  Object.keys(cha).forEach(ten => {
    if (HAM[ten]) return;                      /* cha có nhóm: con thừa hưởng */
    const o = A[ten]; if (!o || typeof o !== "object") return;
    Object.keys(o).forEach(k => {
      if (typeof o[k] !== "function") return;
      const d = ten + "." + k;
      if (cha[ten].indexOf(k) < 0 && MO.indexOf(d) < 0) ho.push(d);
    });
  });
  must(!ho.length, "hàm không ai gác mà cũng không khai là cố ý mở: " + ho.join(", "));
  const thua = MO.filter(d => lay(d) === undefined);
  must(!thua.length, "khai mở cho hàm không còn nữa: " + thua.join(", "));
  return Object.keys(cha).length + " đối tượng con · " + MO.length + " hàm đọc cố ý mở";
});

check("Không nhóm nào là quyền suông: nhóm nào cũng gác ít nhất một hàm", () => {
  /* Nhóm có trong bảng, có vai được cấp, mà không quy tắc nào trỏ tới thì
     nó chẳng gác gì — và những hàm lẽ ra nó gác đang chạy tự do. */
  const dung = {}; Object.keys(HAM).forEach(k => { dung[HAM[k]] = (dung[HAM[k]] || 0) + 1; });
  const suong = Object.keys(NHOM).filter(g => !dung[g]);
  must(!suong.length, "nhóm không gác gì: " + suong.join(", "));
  return Object.keys(NHOM).length + " nhóm · nhóm ít việc nhất gác " +
    Math.min.apply(null, Object.keys(NHOM).map(g => dung[g])) + " hàm";
});

/* ================================================================= */
check("Mọi trang khối được giao đều nằm trong danh sách trang của lõi", () => {
  const la = [];
  KHOI.forEach(k => k.man.forEach(m => { if (!(m in MAN)) la.push(k.vai + " → " + m); }));
  must(!la.length, "trang không có trong MAN_TAT_CA (giao mà không ai nhận): " + la.join(", "));
  return KHOI.length + " khối";
});

check("Mọi nhóm khối được giao đều là nhóm có thật", () => {
  const la = [];
  KHOI.forEach(k => k.nhom.forEach(g => { if (!NHOM[g]) la.push(k.vai + " → " + g); }));
  must(!la.length, "nhóm không có thật: " + la.join(", "));
  return "mọi khối trỏ đúng";
});

check("Không trang nào bị bỏ rơi: trang nào cũng có ít nhất một vai vào được", () => {
  const cua = {}; VAI.forEach(v => { cua[v] = A.quyen.cua(v); });
  const roi = Object.keys(MAN).filter(id => !VAI.some(v => cua[v].man.indexOf(id) >= 0));
  must(!roi.length, "không vai nào mở được: " + roi.join(", "));
  return Object.keys(MAN).length + " trang · vai nào cũng có chủ";
});

check("Không nhóm nào bị bỏ rơi: nhóm nào cũng có ít nhất một vai gọi được", () => {
  const cua = {}; VAI.forEach(v => { cua[v] = A.quyen.cua(v).nhom; });
  const roi = Object.keys(NHOM).filter(g => !VAI.some(v => cua[v].indexOf(g) >= 0));
  must(!roi.length, "không vai nào gọi được: " + roi.join(", "));
  /* Nhóm nào CHỈ giám đốc có — đó là quyết định tách bạch nhiệm vụ, nên in
     ra để đọc lại mỗi lần chạy chứ không phải lỗi. */
  const chiGD = Object.keys(NHOM).filter(g => NHOM[g].vai.join() === "mgmt");
  return chiGD.length + " nhóm chỉ giám đốc: " + chiGD.join(", ");
});

/* ================================================================= */
check("Mọi lời gọi A.* trong 45 trang đều trỏ vào hàm có thật", () => {
  /* Lỗi này chỉ hiện khi người dùng mở đúng trang đó, đúng tab đó — có khi
     hàng tháng sau. Đọc tĩnh thì bắt được ngay: gõ sai tên hàm, hoặc gọi
     một hàm nội bộ chưa từng đưa ra mặt tiền. */
  const fs = require("fs"), path = require("path");
  const thu = path.join(__dirname, "..", "v2", "man");
  const co = (o, d) => d.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  const xau = []; let soGoi = 0;
  fs.readdirSync(thu).filter(f => f.endsWith(".js")).forEach(f => {
    const src = fs.readFileSync(path.join(thu, f), "utf8");
    /* trang k-*.js chạy sau lockdown: c.A của chúng là HAUSTEK.api */
    const goc = /^k-/.test(f) ? H.api : A;
    const re = /\bA\.([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)?)\s*\(/g;
    const thay = new Set(); let m;
    while ((m = re.exec(src))) {
      if (thay.has(m[1])) continue;
      thay.add(m[1]); soGoi++;
      if (co(goc, m[1]) === undefined) xau.push(f + " → A." + m[1]);
    }
  });
  must(!xau.length, "gọi hàm không có trên mặt tiền: " + xau.join(" · "));
  return soGoi + " lời gọi khác nhau · trỏ đúng hết";
});

check("Cấm rồi thì phải báo cấm, không được vỡ", () => {
  /* chanQuyen dựng câu lỗi từ QUYEN_NHOM[nhom].vai — nhóm sai thì chỗ này
     ném TypeError, và người dùng thấy "Cannot read properties of
     undefined" thay vì "Không có quyền". Chạy thử từng nhóm. */
  const me = A.staff.me;
  const xau = [];
  try {
    VAI.filter(v => v !== "mgmt").forEach(vai => {
      const ai = A.staff.list().find(x => x.role === vai && x.active !== false);
      if (!ai) return;
      A.staff.setMe(ai.id);
      Object.keys(HAM).forEach(ten => {
        const g = HAM[ten];
        if (A.quyen.nhom(g)) return;                 /* vai này được phép: không gọi, tránh chạm dữ liệu */
        const fn = lay(ten);
        if (typeof fn !== "function") return;
        try { fn(); xau.push(vai + "/" + ten + ": gọi lọt, không chặn"); }
        catch (e) {
          if (e.code !== "NO_QUYEN") xau.push(vai + "/" + ten + ": " + e.message);
        }
      });
    });
  } finally { if (me) A.staff.setMe(me.id); }
  must(!xau.length, xau.slice(0, 6).join(" · ") + (xau.length > 6 ? " …+" + (xau.length - 6) : ""));
  return "mọi lệnh bị cấm đều ném đúng NO_QUYEN";
});

check("Giám đốc đi qua được mọi nhóm; vai khác thì đúng bảng", () => {
  const gd = A.quyen.cua("mgmt").nhom;
  Object.keys(NHOM).forEach(g => must(gd.indexOf(g) >= 0, "giám đốc bị chặn ở nhóm " + g));
  const xau = [];
  VAI.filter(v => v !== "mgmt").forEach(v => {
    const co = A.quyen.cua(v).nhom;
    Object.keys(NHOM).forEach(g => {
      const nen = NHOM[g].vai.indexOf(v) >= 0;
      if ((co.indexOf(g) >= 0) !== nen) xau.push(v + "/" + g);
    });
  });
  must(!xau.length, "lệch bảng: " + xau.join(", "));
  return VAI.length + " vai × " + Object.keys(NHOM).length + " nhóm";
});

check("Trang chỉ giám đốc thì trưởng bộ phận cũng không vào", () => {
  const me = A.staff.me;
  const xau = [];
  try {
    A.staff.list().filter(x => x.active !== false && x.role !== "mgmt").forEach(ai => {
      A.staff.setMe(ai.id);
      if (A.quyen.man("muc-tra")) xau.push(ai.role + "/" + (ai.title || ai.chucDanh) + " vào được Mức trả");
    });
  } finally { if (me) A.staff.setMe(me.id); }
  must(!xau.length, xau.join(" · "));
  return "Mức trả nền tảng đóng với mọi vai ngoài giám đốc";
});

/* ================================================================= */
check("Ba tay khác nhau: nhập số, kiểm sai lệch, chốt kỳ", () => {
  /* Giám đốc đi qua mọi nhóm — đó là ngoại lệ đã biết và đã ghi trong
     README, nên xét tách bạch trên các vai còn lại. */
  const bo = a => a.filter(v => v !== "mgmt");
  const nhap = bo(NHOM.nhapLieu.vai), kiem = bo(NHOM.kiemSo.vai), chot = NHOM.chotKy.vai;
  must(nhap.length, "không ai được nhập số liệu");
  must(kiem.length, "không ai được bỏ qua sai lệch");
  must(chot.join() === "mgmt", "chốt kỳ phải là quyền riêng của giám đốc, đang mở cho: " + chot.join(", "));
  must(!nhap.some(v => kiem.indexOf(v) >= 0), "một vai vừa nhập số vừa duyệt sai lệch: " + nhap.join(","));
  must(!nhap.some(v => chot.indexOf(v) >= 0), "một vai vừa nhập số vừa chốt kỳ: " + nhap.join(","));
  must(!kiem.some(v => chot.indexOf(v) >= 0), "một vai vừa duyệt sai lệch vừa chốt kỳ: " + kiem.join(","));
  const tg = bo(NHOM.tien.vai);
  must(!tg.some(v => chot.indexOf(v) >= 0), "vai nhập tỷ giá cũng chốt được kỳ: " + tg.join(","));
  return "nhập: " + nhap.join(",") + " · kiểm: " + kiem.join(",") + " · chốt: giám đốc";
});

check("Vai nào cũng có việc: không vai nào trắng bảng", () => {
  const trong = VAI.filter(v => { const q = A.quyen.cua(v); return !q.man.length || !q.nhom.length; });
  must(!trong.length, "vai không có gì để làm: " + trong.join(", "));
  return VAI.map(v => v + " " + A.quyen.cua(v).man.length + " trang").join(" · ");
});

/* ===================== KẾT QUẢ ===================== */
console.log(ra.map(([k, n, m]) => (k === "ok" ? "  ok   " : "  LỖI  ") + n + (m ? "\n         " + m : "")).join("\n"));
console.log("\n" + pass + " đạt · " + fail + " hỏng");
process.exit(fail ? 1 : 0);
