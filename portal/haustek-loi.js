/* =====================================================================
   HAUSTEK PORTAL — LÕI (v3)
   ---------------------------------------------------------------------
   Portal là SỔ THEO DÕI VIỆC và KÊNH THÔNG BÁO giữa Haustek với đối tác.
   Chỉ vậy.

   Việc thật diễn ra ở OneRPM, Believe, Warner và YouTube CMS: đưa nhạc
   lên nền tảng, gỡ claim, đọc báo cáo doanh thu, xem tiền. Lõi này KHÔNG
   làm lại, KHÔNG chép về, KHÔNG tính lại. Con số nào portal tự tính ra mà
   bên phân phối cũng có thì là con số thứ hai, và con số thứ hai luôn là
   con số sai.

   Lõi giữ đúng thứ không nơi nào khác giữ:
     ai phụ trách đối tác nào · đã gọi ai lúc nào và chốt gì · Haustek hứa
     ngày nào · việc đang tới đâu · đã đưa đối tác tệp gì.

   Xương sống là VIỆC (viec), gắn một DỊCH VỤ trong mười mảng Haustek bán.
   Một hồ sơ phát hành, một đêm diễn, một buổi thu, một tháng chăm kênh
   đều là một việc, đi qua cùng một hàng đợi và cùng một dòng thời gian.

   Hai cửa:
     HAUSTEK.admin — cổng nội bộ, đọc hết, ghi theo vai.
     HAUSTEK.api   — cổng đối tác, chỉ thấy phần của chính mình và chỉ
                     thấy dòng có hienChoDoiTac = true.
     HAUSTEK.lockdown() — cổng đối tác gọi lúc khởi động, gỡ hẳn admin.
   ===================================================================== */
"use strict";
(function (global) {

/* =====================================================================
   1. CẤU HÌNH
   ===================================================================== */
var CFG = {
  VERSION: 3,
  STORE_KEY: "haustek.portal.v3",
  KHOA_CU: ["haustek.portal.v1", "haustek.portal.v2"],
  N_NHAN_SU: 10, N_DOI_TAC: 40, N_VIEC_XONG: 86, N_BAN_PHAT_HANH: 500,
  N_THONG_BAO: 150, N_TEP: 400
};

/* Hôm nay. Dữ liệu mẫu sinh tương đối theo mốc này nên bản mẫu không bao
   giờ trông cũ. */
var ASOF = (function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();

/* =====================================================================
   2. TIỆN ÍCH
   ===================================================================== */
/* Ngẫu nhiên xác định: cùng hạt thì cùng kết quả, mọi lần tải trang. */
function hash(i, k) { var x = Math.sin((i + 1) * 12.9898 + (k || 0) * 78.233) * 43758.5453; return x - Math.floor(x); }
function chon(ds, i, k) { return ds[Math.floor(hash(i, k) * ds.length) % ds.length]; }
function so(i, k, a, b) { return a + Math.floor(hash(i, k) * (b - a + 1)); }
/* Giờ phải có hai chữ số. "2026-09-24 9:22" so chuỗi với "2026-09-24 17:05"
   thì 9 giờ sáng đứng SAU 5 giờ chiều, và cả dòng thời gian đảo lộn mà
   không ai thấy sai ở đâu, vì từng dòng một đều đúng. */
function hai(n) { return (n < 10 ? "0" : "") + n; }

function isoNgay(d) {
  var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), n = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + n;
}
function isoLuc(d) { return isoNgay(d) + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
function ngay(iso) { var p = String(iso).slice(0, 10).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function themNgay(iso, n) { var d = ngay(iso); d.setDate(d.getDate() + n); return isoNgay(d); }
function cachNgay(a, b) { return Math.round((ngay(b || isoNgay(ASOF)) - ngay(a)) / 864e5); }
function homNay() { return isoNgay(ASOF); }
function bayGio() { return isoLuc(new Date()); }
function thuTrongTuan(iso) { return ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][ngay(iso).getDay()]; }
/* "6 tháng 9, 2026" chứ không phải "06/09/2026". Câu "Haustek trả lời chậm
   nhất ngày 6 tháng 9" đọc ra thành lời hứa của một người; cùng câu đó với
   "06/09/2026" đọc ra thành một dòng trong bảng. Đây là phần mềm mà nửa số
   chữ trên màn hình là lời hứa với đối tác, nên chọn cách đọc ra lời hứa. */
function ngayVi(iso) {
  var p = String(iso).slice(0, 10).split("-");
  return (+p[2]) + " tháng " + (+p[1]) + ", " + p[0];
}
/* Dạng gọn cho chỗ chật (cạnh một dòng hàng đợi, trong một ô bảng). */
function ngayGonVi(iso) { var p = String(iso).slice(0, 10).split("-"); return (+p[2]) + "/" + (+p[1]); }
function gioVi(luc) { return String(luc).slice(11, 16); }

/* Hạn tính bằng ngày làm việc: bỏ thứ Bảy, Chủ nhật và ngày nghỉ lễ.
   Không có nó thì câu "chậm nhất ngày 09/09" sai cả tuần dịp Tết. */
function hanLamViec(tu, soNgay) {
  var d = ngay(tu), con = Math.max(0, soNgay | 0), nghi = (state.caiDat && state.caiDat.ngayNghi) || [];
  while (con > 0) {
    d.setDate(d.getDate() + 1);
    var t = d.getDay();
    if (t === 0 || t === 6) continue;
    if (nghi.indexOf(isoNgay(d)) >= 0) continue;
    con--;
  }
  return isoNgay(d);
}
var tien0 = function (v) { return "$" + Math.round(v || 0).toLocaleString("en-US"); };
var chuoi = function (v) { return v == null ? "" : String(v).trim(); };

/* =====================================================================
   3. DỊCH VỤ — mười mảng Haustek bán, cộng một loại kỹ thuật
   ---------------------------------------------------------------------
   camKetPhanHoi tính bằng NGÀY LÀM VIỆC và là NGUỒN DUY NHẤT của mọi lời
   hứa thời gian: trang metadata công khai, hàng đợi nội bộ, dòng biên
   nhận ở cổng đối tác đều đọc từ đây. Sửa ở Quản trị, ghi nhật ký.
   ===================================================================== */
var DICH_VU = [
  { id: "phat-hanh",     vi: "Phát hành và khai thác bản ghi", boPhan: "van-hanh",   camKetPhanHoi: 2, nhipCapNhat: 30, coNhac: true,  coTien: true },
  { id: "label",         vi: "Hãng thu âm",                    boPhan: "van-hanh",   camKetPhanHoi: 2, nhipCapNhat: 30, coNhac: true,  coTien: true },
  { id: "su-kien",       vi: "Tổ chức sự kiện",                boPhan: "san-xuat",   camKetPhanHoi: 1, nhipCapNhat: 7,  coNhac: false, coTien: false },
  { id: "san-xuat-nhac", vi: "Sản xuất âm nhạc",               boPhan: "san-xuat",   camKetPhanHoi: 2, nhipCapNhat: 14, coNhac: true,  coTien: false },
  { id: "booking",       vi: "Booking nghệ sĩ",                boPhan: "kinh-doanh", camKetPhanHoi: 1, nhipCapNhat: 7,  coNhac: false, coTien: false },
  { id: "chien-luoc",    vi: "Chiến lược và kế hoạch marketing", boPhan: "noi-dung", camKetPhanHoi: 2, nhipCapNhat: 14, coNhac: false, coTien: false },
  { id: "digital",       vi: "Chiến dịch digital",             boPhan: "noi-dung",   camKetPhanHoi: 2, nhipCapNhat: 14, coNhac: false, coTien: false },
  { id: "mang-xa-hoi",   vi: "Quản lý mạng xã hội",            boPhan: "noi-dung",   camKetPhanHoi: 2, nhipCapNhat: 14, coNhac: false, coTien: false },
  { id: "content",       vi: "Content marketing",              boPhan: "noi-dung",   camKetPhanHoi: 2, nhipCapNhat: 14, coNhac: false, coTien: false },
  { id: "media",         vi: "Sản xuất media",                 boPhan: "san-xuat",   camKetPhanHoi: 2, nhipCapNhat: 14, coNhac: false, coTien: false },
  { id: "ho-tro",        vi: "Yêu cầu hỗ trợ",                 boPhan: "kinh-doanh", camKetPhanHoi: 2, nhipCapNhat: 30, coNhac: false, coTien: false, kyThuat: true }
];
var dvCua = function (id) { for (var i = 0; i < DICH_VU.length; i++) if (DICH_VU[i].id === id) return DICH_VU[i]; return DICH_VU[DICH_VU.length - 1]; };
var BO_PHAN = [
  { id: "ban-giam-doc", vi: "Ban giám đốc" }, { id: "van-hanh", vi: "Phát hành" },
  { id: "kinh-doanh", vi: "Đối tác" }, { id: "san-xuat", vi: "Sản xuất và sự kiện" },
  { id: "noi-dung", vi: "Marketing và nội dung" }, { id: "ke-toan", vi: "Kế toán" }
];
var TRANG_THAI_VIEC = [
  { id: "moi", vi: "Mới" }, { id: "dang-lam", vi: "Đang làm" },
  { id: "cho-doi-tac", vi: "Chờ đối tác" }, { id: "xong", vi: "Xong" }, { id: "huy", vi: "Huỷ" }
];
var TRANG_THAI_PH = [
  { id: "da-gui", vi: "Đã gửi" }, { id: "dang-kiem", vi: "Đang kiểm" }, { id: "can-bo-sung", vi: "Cần bổ sung" },
  { id: "da-cap-ma", vi: "Đã cấp mã" }, { id: "da-phat-hanh", vi: "Đã phát hành" }
];
var NEN_TANG_PH = [
  { id: "dang-xu-ly", vi: "Đang xử lý" }, { id: "da-len", vi: "Đã lên nền tảng" }, { id: "co-van-de", vi: "Có vấn đề" }
];

/* =====================================================================
   4. DỮ LIỆU NGUỒN CHO BẢN MẪU
   ===================================================================== */
var NHAN_SU_MAU = [
  { id: "S01", ten: "Nguyễn Minh Quản", email: "mgmt@haustek-group.com",      boPhan: "ban-giam-doc", chucDanh: "Giám đốc",              vai: "quan-ly" },
  { id: "S02", ten: "Trần Vận Hành",    email: "ops@haustek-group.com",       boPhan: "van-hanh",     chucDanh: "Trưởng bộ phận phát hành", vai: "quan-ly" },
  { id: "S03", ten: "Lê Kinh Doanh",    email: "sales1@haustek-group.com",    boPhan: "kinh-doanh",   chucDanh: "Phụ trách đối tác",     vai: "nhan-vien" },
  { id: "S04", ten: "Phạm Thu Hà",      email: "sales2@haustek-group.com",    boPhan: "kinh-doanh",   chucDanh: "Phụ trách đối tác",     vai: "nhan-vien" },
  { id: "S05", ten: "Hoàng Sự Kiện",    email: "events@haustek-group.com",    boPhan: "san-xuat",     chucDanh: "Trưởng bộ phận sự kiện", vai: "quan-ly" },
  { id: "S06", ten: "Đỗ Quyền",         email: "studio@haustek-group.com",    boPhan: "san-xuat",     chucDanh: "Sản xuất âm nhạc",      vai: "nhan-vien" },
  { id: "S07", ten: "Vũ Kế Toán",       email: "ketoan@haustek-group.com",    boPhan: "ke-toan",      chucDanh: "Kế toán",               vai: "nhan-vien" },
  { id: "S08", ten: "Ngô Nội Dung",     email: "content@haustek-group.com",   boPhan: "noi-dung",     chucDanh: "Trưởng bộ phận nội dung", vai: "quan-ly" },
  { id: "S09", ten: "Bùi Digital",      email: "digital@haustek-group.com",   boPhan: "noi-dung",     chucDanh: "Chiến dịch digital",    vai: "nhan-vien" },
  { id: "S10", ten: "Lý Hậu Kỳ",        email: "media@haustek-group.com",     boPhan: "san-xuat",     chucDanh: "Sản xuất media",        vai: "nhan-vien" }
];
var LAB_A = ["Nightform", "Mây", "Cửa Bắc", "Vọng Âm", "Lệch Pha", "Tầng Hầm", "Bụi Đỏ", "Sông Ngầm", "Kho 13", "Bến Trắng", "Mạch", "Rosewood"];
var LAB_B = ["Records", "Collective", "Audio", "Tapes", "Studio"];
var NGHE_SI = ["Đặng Trang Uyên", "Lê Uyên Lam", "Vũ Minh Vũ", "Bùi Lam Sơn", "Đặng Phúc Tú", "Lê Văn Hạo", "Hồ Tú Băng", "Cáp Anh Tài", "JesiLyn", "Nguyễn Chi Hạo", "Lope Dope", "Trí Minh", "Bách Phan", "ResQ", "Qinie", "nae & de'lay", "Hoàng Giang Vọng", "Nguyễn Lâm Khánh", "Trần Giang Hà", "Hồ Khuê Giang"];
var THUONG_HIEU = ["Sunhouse Việt", "Cà phê Ban Mê", "Vietjet Sky", "Nhà hát Lớn", "Boiler Room VN", "Trung Nguyên Legend"];
var BAI_HAT = ["Đêm Thành Phố", "Say Một Đời Vì Em", "Đà Lạt Còn Mưa Không Em", "Tìm Lại", "Để Gió Cuốn Đi", "Đắp Chăn Bông", "Chờ Lời Anh Nói", "Harla", "Đừng Trách Câu Ví Dặm", "Giận Mà Thương", "Lọ Vương", "Love Me Right", "Mùa hè bất tận", "Xe Đạp", "Tao Muốn Ngủ Ngon", "Natural Order of Life", "Remote Land", "Thin Tails", "Long Way Home", "Đành Thôi Xa Cách", "Mưa tháng Chín", "Vọng thứ hai", "Tần số", "Lối", "Vệt đầu tiên"];
var HO_VN = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô", "Dương", "Lý"];
var TEN_VN = ["An", "Bình", "Chi", "Dũng", "Giang", "Hà", "Hải", "Khoa", "Linh", "Mai", "Nam", "Ngân", "Phúc", "Quân", "Thảo", "Trang", "Tuấn", "Vy"];

var VIEC_MAU = {
  "phat-hanh": ["Phát hành single {b}", "Phát hành EP {b}", "Phát hành album {b}", "Cập nhật metadata {b}"],
  "label": ["Ký hợp đồng label {t}", "Kế hoạch phát hành quý cho {t}", "Rà danh mục cũ của {t}"],
  "su-kien": ["Đêm diễn {t} tại Hà Nội", "Đêm diễn {t} tại TP.HCM", "Line-up và sân khấu cho {t}", "Hậu cần đêm nhạc {t}"],
  "san-xuat-nhac": ["Thu và mix {b}", "Master lại {b}", "Phối khí {b}", "Nhạc nền quảng cáo cho {t}"],
  "booking": ["Booking DJ set cho {t}", "Booking live band cho {t}", "Chốt lịch diễn quý cho {t}"],
  "chien-luoc": ["Kế hoạch marketing quý cho {t}", "Định vị thương hiệu {t}", "Lộ trình ra mắt {b}"],
  "digital": ["Chiến dịch quảng cáo {b}", "Chạy pre-save {b}", "Đẩy TikTok cho {b}"],
  "mang-xa-hoi": ["Chăm kênh tháng này cho {t}", "Dựng lịch đăng cho {t}", "Xây kênh TikTok {t}"],
  "content": ["Bài viết ra mắt {b}", "Bộ nội dung tháng cho {t}", "Kịch bản podcast {t}"],
  "media": ["Quay MV {b}", "Chụp bộ ảnh cho {t}", "Dựng teaser {b}", "Thiết kế ảnh bìa {b}"],
  "ho-tro": ["Hỏi về bảng kê kỳ gần nhất", "Đổi thông tin tài khoản nhận tiền", "Hỏi tiến độ {b}", "Nhờ gỡ claim trên YouTube", "Xin lại đường dẫn Spotify"]
};
var BUOC_TIEP_MAU = {
  "phat-hanh": ["Đưa hồ sơ lên OneRPM", "Kiểm metadata lần cuối", "Gửi đường dẫn cho đối tác", "Chờ nền tảng duyệt"],
  "label": ["Soạn phụ lục hợp đồng", "Hẹn lịch gặp", "Gửi bản kế hoạch"],
  "su-kien": ["Chốt địa điểm", "Gửi bảng chi phí", "Xác nhận line-up", "Duyệt bản dựng sân khấu"],
  "san-xuat-nhac": ["Gửi bản dựng 2", "Đặt lịch phòng thu", "Master và gửi nghe"],
  "booking": ["Gửi báo giá", "Chốt ngày diễn", "Gửi hợp đồng biểu diễn"],
  "chien-luoc": ["Gửi bản kế hoạch", "Hẹn buổi trình bày", "Chốt ngân sách"],
  "digital": ["Dựng bộ quảng cáo", "Gửi báo cáo tuần", "Tối ưu nhóm quảng cáo"],
  "mang-xa-hoi": ["Gửi lịch đăng tháng", "Duyệt nội dung tuần", "Báo cáo tăng trưởng kênh"],
  "content": ["Gửi bản thảo", "Chỉnh theo góp ý", "Đăng và gửi đường dẫn"],
  "media": ["Gửi bản dựng 1", "Chốt lịch quay", "Gửi bản màu cuối"],
  "ho-tro": ["Trả lời đối tác", "Kiểm tra trên nền tảng", "Gửi lại tệp"]
};
var LIEN_LAC_MAU = [
  "đã chốt ngày phát hành", "đối tác xin lùi một tuần", "đã gửi bản dựng, chờ nghe",
  "đã nhắc bảng kê quý", "đối tác báo sẽ gửi file trong tuần", "đã trao đổi kế hoạch quý sau",
  "đã xác nhận line-up", "đối tác hỏi tiến độ, đã cập nhật", "đã gửi báo giá, chờ duyệt"
];
var MAU_THONG_BAO = [
  { id: "cap-nhat", ten: "Cập nhật định kỳ", tieuDe: "Cập nhật công việc tháng {thang}",
    noiDung: "Chào bạn,\n\nHaustek gửi bạn cập nhật các việc đang chạy trong tháng.\n\n{tomTat}\n\nCó gì cần trao đổi thêm, bạn nhắn lại trong mục Trao đổi hoặc gọi thẳng cho người phụ trách." },
  { id: "can-bo-sung", ten: "Hồ sơ cần bổ sung", tieuDe: "Hồ sơ {ma} cần bạn bổ sung",
    noiDung: "Chào bạn,\n\nHồ sơ {ma} còn thiếu vài mục để Haustek đưa lên nền tảng:\n\n{danhSach}\n\nBạn gửi giúp trong mục Việc của tôi. Cần hỗ trợ thì nhắn lại, Haustek làm cùng bạn." },
  { id: "da-len", ten: "Đã lên nền tảng", tieuDe: "{ten} đã lên nền tảng",
    noiDung: "Chào bạn,\n\n{ten} đã lên các nền tảng. Bạn nghe thử và chia sẻ nhé:\n\n{duongDan}\n\nSố liệu chi tiết cập nhật dần trong vài ngày tới." },
  { id: "bang-ke", ten: "Bảng kê đã chuyển", tieuDe: "Bảng kê kỳ {ky} đã chuyển",
    noiDung: "Chào bạn,\n\nHaustek đã chuyển khoản kỳ {ky}. Bảng kê chi tiết bạn tải trong mục Thanh toán.\n\nSố tiền: {soTien}\nNgày chuyển: {ngay}" },
  { id: "lich-doi", ten: "Lịch sự kiện thay đổi", tieuDe: "Đổi lịch: {ten}",
    noiDung: "Chào bạn,\n\nLịch của {ten} có thay đổi:\n\n{chiTiet}\n\nBạn xác nhận giúp Haustek để chốt lại với các bên." },
  { id: "ban-giao", ten: "Bàn giao tệp mới", tieuDe: "Đã gửi bạn {ten}",
    noiDung: "Chào bạn,\n\nHaustek vừa gửi bạn {ten}. Bạn xem trong mục Trao đổi, tab Tài liệu.\n\nCó góp ý gì bạn nhắn lại giúp, Haustek chỉnh trong hai ngày làm việc." }
];
/* Ngày nghỉ Việt Nam trong khoảng bản mẫu chạy. */
var NGAY_NGHI = ["2026-01-01", "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", "2026-04-26", "2026-04-30", "2026-05-01", "2026-09-02", "2027-01-01"];

/* =====================================================================
   5. TRẠNG THÁI VÀ LƯU TRỮ
   ===================================================================== */
var state = null;

var kho = {
  doc: function () {
    try {
      CFG.KHOA_CU.forEach(function (k) { if (localStorage.getItem(k)) { localStorage.removeItem(k); console.info("[haustek] đã xoá dữ liệu bản cũ " + k + ", gieo lại dữ liệu mẫu."); } });
      var raw = localStorage.getItem(CFG.STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return s && s.v === CFG.VERSION ? s : null;
    } catch (e) { return null; }
  },
  ghi: function () { try { localStorage.setItem(CFG.STORE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; } },
  xoa: function () { try { localStorage.removeItem(CFG.STORE_KEY); } catch (e) {} },
  dungDuoc: function () { try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); return true; } catch (e) { return false; } }
};

/* =====================================================================
   6. GIEO DỮ LIỆU MẪU
   ---------------------------------------------------------------------
   Quy mô thật của một agency mười người: vài chục đối tác, việc đang mở
   đếm trên đầu ngón tay. Số nhỏ thì đầu óc chứa được.
   ===================================================================== */
function gieo() {
  var s = {
    v: CFG.VERSION,
    nhanSu: [], doiTac: [], nguoiDung: [], viec: [], dong: [], banPhatHanh: [],
    thongBao: [], luotDoc: [], bangKe: [], tamUng: [], tep: [], nhatKy: [],
    caiDat: { tenCongTy: "Haustek Group", ngayNghi: NGAY_NGHI.slice(), mauThongBao: MAU_THONG_BAO.map(function (m) { return Object.assign({}, m); }) }
  };
  state = s;
  var dongSeq = 0, tepSeq = 0;
  function themDong(o) {
    o.id = "D-" + String(++dongSeq).padStart(5, "0");
    if (o.hienChoDoiTac === undefined) o.hienChoDoiTac = o.loai !== "ghi-chu";
    if (o.loai === "ghi-chu") o.hienChoDoiTac = false;
    s.dong.push(o); return o;
  }

  /* ---- nhân sự ---- */
  s.nhanSu = NHAN_SU_MAU.map(function (n, i) {
    return Object.assign({ dienThoai: "090" + so(i, 3, 1000000, 9999999), dichVuPhuTrach: [], hoatDong: true }, n);
  });
  var nsTheoBoPhan = function (bp) { return s.nhanSu.filter(function (n) { return n.boPhan === bp; }); };
  DICH_VU.forEach(function (dv) {
    nsTheoBoPhan(dv.boPhan).forEach(function (n) { if (n.dichVuPhuTrach.indexOf(dv.id) < 0) n.dichVuPhuTrach.push(dv.id); });
  });
  var pt = s.nhanSu.filter(function (n) { return n.boPhan === "kinh-doanh" || n.boPhan === "van-hanh"; });

  /* ---- đối tác ---- */
  var GOI_DV = [
    ["phat-hanh"], ["phat-hanh", "digital"], ["phat-hanh", "media"], ["label", "phat-hanh"],
    ["phat-hanh", "san-xuat-nhac"], ["su-kien", "booking"], ["su-kien", "media", "mang-xa-hoi"],
    ["digital", "mang-xa-hoi", "content"], ["chien-luoc", "digital"], ["phat-hanh", "label", "media", "digital"],
    ["booking"], ["media"], ["san-xuat-nhac", "media"], ["mang-xa-hoi", "content"]
  ];
  for (var i = 0; i < CFG.N_DOI_TAC; i++) {
    var laLabel = i < 12, laThuongHieu = i >= 33;
    var ten = laLabel ? (LAB_A[i % LAB_A.length] + " " + chon(LAB_B, i, 11))
            : laThuongHieu ? THUONG_HIEU[(i - 33) % THUONG_HIEU.length]
            : NGHE_SI[(i - 12) % NGHE_SI.length];
    var loai = laLabel ? "label" : laThuongHieu ? "thuong-hieu" : "nghe-si";
    var dichVu = laThuongHieu ? chon([["digital", "mang-xa-hoi", "content"], ["chien-luoc", "digital"], ["su-kien", "media"], ["booking"], ["media"]], i, 21)
                              : chon(GOI_DV, i, 21);
    var kyKet = themNgay(homNay(), -so(i, 22, 60, 1400));
    var hetHan = themNgay(kyKet, so(i, 23, 730, 1460));
    var nguoiPt = pt[i % pt.length];
    var trangThai = hash(i, 24) < 0.08 ? "tam-dung" : hash(i, 24) > 0.97 ? "da-ket-thuc" : "dang-hop-tac";
    var lh = [];
    var nLh = laLabel ? 2 : 1;
    for (var j = 0; j < nLh; j++) {
      lh.push({
        ten: laLabel && j === 0 ? (chon(HO_VN, i, 30 + j) + " " + chon(TEN_VN, i, 40 + j)) : (loai === "nghe-si" ? ten : chon(HO_VN, i, 30 + j) + " " + chon(TEN_VN, i, 40 + j)),
        vaiTro: j === 0 ? (laLabel ? "Quản lý label" : laThuongHieu ? "Marketing" : "Nghệ sĩ") : "Trợ lý",
        dienThoai: "09" + so(i, 41 + j, 10000000, 89999999),
        zalo: "09" + so(i, 41 + j, 10000000, 89999999),
        email: "lienhe" + (i + 1) + (j ? "b" : "") + "@example.com",
        gioTienGoi: chon(["Giờ nào cũng được", "Sáng 9h đến 12h", "Chiều 14h đến 17h", "Tối sau 19h"], i, 42 + j),
        laChinh: j === 0
      });
    }
    var coNhac = dichVu.some(function (d) { return dvCua(d).coNhac; });
    s.doiTac.push({
      id: "DT-" + String(i + 1).padStart(4, "0"),
      ten: ten, loai: loai, labelMeId: null, dichVu: dichVu,
      nguoiPhuTrachId: nguoiPt.id, trangThai: trangThai,
      hopDong: { tuNgay: kyKet, denNgay: hetHan, tyLeDoiTacHuong: so(i, 25, 60, 85), nhipBaoCao: hash(i, 26) < 0.4 ? "thang" : "quy", tepId: null, ghiChu: "" },
      lienHe: lh,
      nganHang: hash(i, 27) < 0.82 ? { chuTaiKhoan: ten.toUpperCase(), soTaiKhoanMask: "••" + so(i, 28, 1000, 9999), nganHang: chon(["Techcombank", "Vietcombank", "BIDV", "ACB", "MB Bank"], i, 29) } : null,
      maNgoai: {
        onerpm: coNhac ? "HTK-" + so(i, 31, 1000, 9999) : "",
        believe: coNhac && hash(i, 32) < 0.3 ? "BLV-" + so(i, 33, 100, 999) : "",
        warner: "", ytcms: coNhac && hash(i, 34) < 0.5 ? "UC" + so(i, 35, 100000, 999999) : "",
        doiTacTuDangNhap: coNhac && hash(i, 36) < 0.35
      },
      tomTat: "", tomTatCapNhatLuc: null, tomTatBoiId: null,
      taoLuc: kyKet + " 09:00", capNhatLuc: kyKet + " 09:00"
    });
  }
  /* label con: bốn nghệ sĩ đầu gắn vào label đầu tiên */
  for (var k = 12; k < 16; k++) s.doiTac[k].labelMeId = s.doiTac[0].id;

  /* tóm tắt quan hệ: đoạn văn bàn giao, bắt buộc có */
  s.doiTac.forEach(function (dt, ix) {
    var dv1 = dvCua(dt.dichVu[0]).vi.toLowerCase();
    var cau = [
      "Ký từ " + ngayVi(dt.hopDong.tuNgay) + ", đang dùng " + dv1 + ".",
      dt.loai === "label" ? "Label có roster riêng, thường gửi hồ sơ theo đợt." : dt.loai === "thuong-hieu" ? "Bên thương hiệu, làm việc qua phòng marketing." : "Nghệ sĩ tự quản lý, trả lời nhanh qua Zalo.",
      chon(["Ưu tiên gọi trước khi gửi email.", "Thích nhận cập nhật ngắn, mỗi tháng một lần.", "Hay hỏi lại về ngày lên nền tảng.", "Cần nhắc trước hai ngày mỗi khi có hạn."], ix, 51)
    ].join(" ");
    dt.tomTat = cau;
    dt.tomTatCapNhatLuc = themNgay(homNay(), -so(ix, 52, 3, 70)) + " 10:00";
    dt.tomTatBoiId = dt.nguoiPhuTrachId;
  });

  /* ---- người dùng cổng ---- */
  var nd = 0;
  s.doiTac.forEach(function (dt, ix) {
    var n = dt.loai === "label" ? 2 : 1;
    for (var j = 0; j < n && nd < 55; j++) {
      var lh2 = dt.lienHe[j] || dt.lienHe[0];
      var tt = hash(ix, 60 + j) < 0.12 ? "da-moi" : hash(ix, 60 + j) > 0.96 ? "khoa" : "dang-dung";
      s.nguoiDung.push({
        id: "U-" + String(++nd).padStart(4, "0"), email: lh2.email, doiTacId: dt.id, ten: lh2.ten,
        trangThai: tt, moiLuc: themNgay(dt.hopDong.tuNgay, 2) + " 09:00",
        lanDangNhapCuoi: tt === "dang-dung" ? themNgay(homNay(), -so(ix, 61 + j, 0, 60)) + " " + hai(so(ix, 62, 8, 21)) + ":10" : null
      });
    }
  });

  /* ---- bản phát hành ---- */
  var dtNhac = s.doiTac.filter(function (d) { return d.dichVu.some(function (x) { return dvCua(x).coNhac; }); });
  for (var r = 0; r < CFG.N_BAN_PHAT_HANH; r++) {
    var dt2 = dtNhac[r % dtNhac.length];
    var dangXuLy = r < 12;
    var ngayPh = dangXuLy ? themNgay(homNay(), so(r, 70, -10, 45)) : themNgay(homNay(), -so(r, 70, 20, 2200));
    var loaiPh = hash(r, 71) < 0.72 ? "single" : hash(r, 71) < 0.92 ? "ep" : "album";
    var nTrack = loaiPh === "single" ? 1 : loaiPh === "ep" ? so(r, 72, 3, 5) : so(r, 72, 7, 11);
    var tenPh = chon(BAI_HAT, r, 73) + (hash(r, 74) < 0.18 ? " (" + chon(["Acoustic", "Remix", "Live"], r, 75) + ")" : "");
    var tracks = [];
    for (var t = 0; t < nTrack; t++) {
      tracks.push({
        thuTu: t + 1, ten: t === 0 ? tenPh : chon(BAI_HAT, r + t * 7, 76),
        isrc: dangXuLy && hash(r, 77) < 0.4 ? "" : "VNHTK" + String(ngayPh).slice(2, 4) + String(so(r + t, 78, 10000, 99999)),
        featuring: hash(r + t, 79) < 0.12 ? chon(NGHE_SI, r + t, 80) : "",
        nguoiSangTac: [{ ten: dt2.loai === "nghe-si" ? dt2.ten : chon(NGHE_SI, r, 81), vaiTro: "Sáng tác và viết lời", tyLe: 100 }]
      });
    }
    var ttPh = !dangXuLy ? "da-phat-hanh" : chon(["da-gui", "dang-kiem", "can-bo-sung", "da-cap-ma"], r, 82);
    var conThieu = [];
    if (ttPh === "can-bo-sung") {
      conThieu.push({ muc: "Link file WAV chất lượng gốc", mucDo: "chan", doiTacTuBoSungDuoc: true });
      if (hash(r, 83) < 0.5) conThieu.push({ muc: "Họ tên thật của người sáng tác", mucDo: "chan", doiTacTuBoSungDuoc: true });
      if (hash(r, 84) < 0.4) conThieu.push({ muc: "Đăng ký mã ISRC với bên phân phối", mucDo: "can-bo-sung", doiTacTuBoSungDuoc: false });
    }
    var nenTang = !dangXuLy ? "da-len" : ttPh === "da-cap-ma" ? chon(["dang-xu-ly", "da-len"], r, 85) : "dang-xu-ly";
    if (dangXuLy && hash(r, 86) < 0.12) nenTang = "co-van-de";
    s.banPhatHanh.push({
      id: "HSTK-" + String(ngayPh).slice(2, 4) + String(ngayPh).slice(5, 7) + "-" + String(r + 1).padStart(3, "0"),
      doiTacId: dt2.id, viecId: null, ten: tenPh, phienBan: "", loai: loaiPh, ngayPhatHanh: ngayPh,
      upc: ttPh === "da-gui" || ttPh === "dang-kiem" ? "" : "88" + so(r, 87, 10000000000, 99999999999),
      anhBia: "", trangThai: ttPh, conThieu: conThieu, track: tracks,
      duongDan: nenTang === "da-len" ? { spotify: "https://open.spotify.com/album/" + so(r, 88, 100000, 999999), apple: "https://music.apple.com/vn/album/" + so(r, 89, 100000, 999999), youtube: "" } : { spotify: "", apple: "", youtube: "" },
      nenTang: nenTang,
      nenTangCapNhatLuc: themNgay(homNay(), -(dangXuLy ? so(r, 90, 1, 22) : so(r, 90, 30, 900))) + " 14:00",
      nenTangGhiChu: nenTang === "co-van-de" ? "Bên phân phối báo trùng ISRC, Haustek đang làm việc lại." : ""
    });
  }

  /* ---- việc ---- */
  var viecSeq = 0;
  function taoViec(ix, dt3, dichVu, dangMo, xongCach) {
    var dv = dvCua(dichVu);
    /* Việc đã xong neo theo NGÀY XONG, không neo theo ngày mở: có thế thì
       khối "đã xong" của hôm nay và tuần này mới có gì để khoe. */
    var keoDai = so(ix, 100, 10, 60);
    var moLuc = dangMo ? themNgay(homNay(), -so(ix, 100, 0, 40)) : themNgay(homNay(), -(xongCach + keoDai));
    var bph = null;
    if (dichVu === "phat-hanh") {
      bph = s.banPhatHanh.filter(function (b) { return b.doiTacId === dt3.id && (dangMo ? b.trangThai !== "da-phat-hanh" : true); })[0]
         || s.banPhatHanh.filter(function (b) { return b.doiTacId === dt3.id; })[0];
    }
    var mauTen = VIEC_MAU[dichVu] || VIEC_MAU["ho-tro"];
    var tieuDe = chon(mauTen, ix, 101).replace("{b}", bph ? bph.ten : chon(BAI_HAT, ix, 102)).replace("{t}", dt3.ten);
    var trangThai = dangMo ? chon(["moi", "dang-lam", "dang-lam", "dang-lam", "cho-doi-tac"], ix, 103) : "xong";
    var nguoiPhuTrach = null;
    var ungVien = s.nhanSu.filter(function (n) { return n.boPhan === dv.boPhan; });
    if (!(trangThai === "moi" && hash(ix, 104) < 0.45)) nguoiPhuTrach = (ungVien[ix % ungVien.length] || s.nhanSu[1]).id;
    var moc = [];
    var tenMoc = { "phat-hanh": ["Nhận hồ sơ", "Kiểm metadata", "Đưa lên nền tảng", "Đã lên"], "su-kien": ["Chốt địa điểm", "Chốt line-up", "Dựng sân khấu", "Đêm diễn"], "media": ["Kịch bản", "Quay", "Dựng", "Bàn giao"], "san-xuat-nhac": ["Thu", "Mix", "Master", "Bàn giao"] }[dichVu];
    if (tenMoc) {
      var xongDen = trangThai === "xong" ? tenMoc.length : so(ix, 105, 1, tenMoc.length - 1);
      var buoc = dangMo ? 7 : Math.max(2, Math.round(keoDai / tenMoc.length));
      tenMoc.forEach(function (m, mi) {
        var hanM = themNgay(moLuc, (mi + 1) * buoc);
        var xongM = mi < xongDen ? themNgay(moLuc, (mi + 1) * buoc - so(ix, 106 + mi, 0, 2)) : null;
        /* Một mốc không thể đã xong vào ngày mai. Cộng thẳng ngày vào moLuc
           thì việc mới mở sinh ra mốc "đã xong" nằm ở tuần sau, và dòng
           thời gian có những việc chưa xảy ra. */
        if (xongM && xongM > homNay()) xongM = null;
        moc.push({ id: "M" + mi, ten: m, han: hanM, xongLuc: xongM ? xongM + " 15:00" : null });
      });
    }
    var buocTiepDs = BUOC_TIEP_MAU[dichVu] || BUOC_TIEP_MAU["ho-tro"];
    var canDoiTac = null;
    if (trangThai === "cho-doi-tac") {
      canDoiTac = { viec: chon(["Nghe và duyệt bản dựng 2", "Gửi file WAV chất lượng gốc", "Xác nhận ngày phát hành", "Duyệt bảng chi phí", "Gửi ảnh bìa 3000×3000"], ix, 107), han: themNgay(homNay(), so(ix, 108, -3, 9)) };
    }
    var chiTiet;
    if (dichVu === "phat-hanh") chiTiet = { banPhatHanhId: bph ? bph.id : null, isrcDaCap: bph ? bph.track.filter(function (x) { return x.isrc; }).length : 0, upc: bph ? bph.upc : "" };
    else if (dichVu === "su-kien") chiTiet = { ngayGio: themNgay(moLuc, so(ix, 109, 20, 90)) + " 20:00", diaDiem: chon(["Nhà hát Lớn Hà Nội", "The Bridge TP.HCM", "Savage Club", "Sân vận động Quân khu 7", "Hầm Trú Ẩn"], ix, 110), lineup: [chon(NGHE_SI, ix, 111), chon(NGHE_SI, ix + 3, 111)], phanCong: [] };
    else chiTiet = { moTa: "Theo trao đổi với đối tác, phạm vi và mốc bàn giao đã thống nhất qua Zalo.", mocThoiGian: "", khoangNganSach: "" };
    var v = {
      id: dichVu === "phat-hanh" && bph ? bph.id : "V-" + String(moLuc).slice(2, 4) + String(moLuc).slice(5, 7) + "-" + String(++viecSeq).padStart(3, "0"),
      dichVu: dichVu, doiTacId: dt3.id, tieuDe: tieuDe, trangThai: trangThai, nguoiPhuTrachId: nguoiPhuTrach,
      tomTat: chon(["Đối tác đã thống nhất phạm vi qua điện thoại.", "Việc phát sinh từ đợt làm trước, giữ nguyên người phụ trách.", "Đối tác cần gấp, đã hẹn mốc bàn giao rõ ràng.", "Việc định kỳ hằng tháng, làm theo lịch đã chốt."], ix, 112),
      buocTiep: trangThai === "xong" ? null : { viec: chon(buocTiepDs, ix, 113), aiLam: trangThai === "cho-doi-tac" ? "doi-tac" : "haustek", hanNgay: themNgay(homNay(), so(ix, 114, -4, 12)) },
      canDoiTac: canDoiTac,
      moLuc: moLuc + " " + hai(so(ix, 115, 8, 17)) + ":" + chon(["05", "20", "35", "50"], ix, 116),
      hanPhanHoi: hanLamViec(moLuc, dv.camKetPhanHoi),
      hanGiao: hash(ix, 117) < 0.6 ? themNgay(moLuc, so(ix, 118, 14, 75)) : null,
      moc: moc, chiTiet: chiTiet, baoGia: null,
      banPhatHanhId: bph ? bph.id : null,
      hienChoDoiTac: true,
      capNhatLuc: trangThai === "xong" ? themNgay(homNay(), -xongCach) + " " + hai(so(ix, 120, 9, 17)) + ":40" : themNgay(homNay(), -so(ix, 119, 0, 12)) + " " + hai(so(ix, 120, 9, 17)) + ":15",
      xongLuc: trangThai === "xong" ? themNgay(homNay(), -xongCach) + " " + hai(so(ix, 120, 9, 17)) + ":40" : null
    };
    if (bph && dangMo) bph.viecId = v.id;
    s.viec.push(v);
    return v;
  }
  /* 34 việc đang mở, chia đều cho các dịch vụ đối tác thật sự mua */
  var dtHoatDong = s.doiTac.filter(function (d) { return d.trangThai === "dang-hop-tac"; });
  for (var m2 = 0; m2 < 34; m2++) {
    var dtm = dtHoatDong[(m2 * 3) % dtHoatDong.length];
    var dvm = m2 % 7 === 6 ? "ho-tro" : chon(dtm.dichVu, m2, 130);
    taoViec(m2, dtm, dvm, true);
  }
  /* Rải ngày xong: vài việc hôm nay, một nhúm trong tuần, còn lại trải ra
     cả năm. Mở phần mềm lên là thấy việc vừa xong, không phải bãi trống. */
  for (var x2 = 0; x2 < CFG.N_VIEC_XONG; x2++) {
    var dtx = dtHoatDong[(x2 * 5) % dtHoatDong.length];
    var cach = x2 < 5 ? 0 : x2 < 14 ? so(x2, 132, 1, 6) : so(x2, 132, 7, 330);
    taoViec(1000 + x2, dtx, x2 % 9 === 8 ? "ho-tro" : chon(dtx.dichVu, x2, 131), false, cach);
  }

  /* ---- tệp ---- */
  for (var f = 0; f < CFG.N_TEP; f++) {
    var dtf = s.doiTac[f % s.doiTac.length];
    var loaiTep = chon(["ban-giao", "ban-giao", "hop-dong", "khac"], f, 140);
    s.tep.push({
      id: "T-" + String(f + 1).padStart(4, "0"), doiTacId: dtf.id, viecId: null,
      ten: loaiTep === "hop-dong" ? "Hop-dong-" + dtf.id + ".pdf" : chon(["Ban-dung-2.mp4", "Master-final.wav", "Anh-bia-3000.jpg", "Ke-hoach-thang.pdf", "Bao-cao-chien-dich.pdf", "Teaser-15s.mp4"], f, 141),
      loai: loaiTep, url: "#", co: so(f, 142, 200, 48000) + " KB", phienBan: so(f, 143, 1, 3),
      taiLenBoiId: s.nhanSu[f % s.nhanSu.length].id,
      taiLenLuc: themNgay(homNay(), -so(f, 144, 1, 400)) + " 11:20",
      doiTacDaXemLuc: hash(f, 145) < 0.7 ? themNgay(homNay(), -so(f, 146, 0, 300)) + " 20:10" : null,
      doiTacDaDuyetLuc: null
    });
  }

  /* ---- bảng kê ---- */
  var kyDs = [];
  for (var q = 5; q >= 0; q--) {
    var d3 = new Date(ASOF.getFullYear(), ASOF.getMonth() - q * 3, 1);
    kyDs.push(d3.getFullYear() + "-Q" + (Math.floor(d3.getMonth() / 3) + 1));
  }
  var dtTien = s.doiTac.filter(function (d) { return d.dichVu.some(function (x) { return dvCua(x).coTien; }); });
  var bkSeq = 0;
  kyDs.forEach(function (ky, ki) {
    dtTien.forEach(function (dt4, di) {
      if (ki === kyDs.length - 1 && hash(di, 150) < 0.25) return;  /* kỳ mới nhất còn vài đối tác chưa tải lên */
      if (hash(di + ki, 151) < 0.12) return;
      var soTien = so(di + ki * 7, 152, 120, 9800);
      var daChuyen = ki < kyDs.length - 1 || hash(di, 153) < 0.6;
      s.bangKe.push({
        id: "BK-" + String(++bkSeq).padStart(4, "0"), doiTacId: dt4.id, ky: ky,
        nguon: chon(["OneRPM", "OneRPM", "Believe", "YouTube CMS"], di + ki, 154),
        soTien: soTien, tienTe: "USD",
        khauTruTamUng: 0, ghiChuKhauTru: "", tepId: null,
        ngayChuyen: daChuyen ? themNgay(homNay(), -(kyDs.length - ki) * 90 + so(di, 155, 10, 40)) : null,
        taiKhoanNhanMask: dt4.nganHang ? dt4.nganHang.nganHang + " " + dt4.nganHang.soTaiKhoanMask : "",
        trangThai: daChuyen ? "da-chuyen" : "da-tai-len",
        nguoiTaiLenId: "S07", taiLenLuc: themNgay(homNay(), -(kyDs.length - ki) * 90 + so(di, 156, 5, 20)) + " 10:30"
      });
    });
  });

  /* ---- tạm ứng ---- */
  for (var u = 0; u < 8; u++) {
    var dtu = dtTien[u * 4 % dtTien.length];
    var soU = so(u, 160, 500, 6000);
    s.tamUng.push({
      id: "TU-" + String(u + 1).padStart(3, "0"), doiTacId: dtu.id, soTien: soU,
      ngayUng: themNgay(homNay(), -so(u, 161, 60, 500)),
      daHoan: Math.round(soU * (0.2 + hash(u, 162) * 0.75)),
      ghiChu: "Ứng trước theo thoả thuận, khấu trừ dần vào bảng kê.", dongLuc: null
    });
  }

  /* ---- dòng thời gian ---- */
  function nsNgauNhien(ix) { var n = s.nhanSu[ix % s.nhanSu.length]; return { kieu: "nhanSu", id: n.id, ten: n.ten }; }
  s.viec.forEach(function (v, vi) {
    var dt5 = s.doiTac.filter(function (d) { return d.id === v.doiTacId; })[0];
    var nguoi = v.nguoiPhuTrachId ? s.nhanSu.filter(function (n) { return n.id === v.nguoiPhuTrachId; })[0] : s.nhanSu[1];
    themDong({ doiTacId: v.doiTacId, viecId: v.id, luc: v.moLuc, boi: { kieu: "heThong", id: "", ten: "Haustek" }, loai: "trang-thai",
      tieuDe: "Mở việc " + v.tieuDe, noiDung: null, hienChoDoiTac: true });
    var nLl = so(vi, 170, 1, 4);
    for (var l = 0; l < nLl; l++) {
      /* Liên lạc phải rơi vào QUÁ KHỨ và rải ra. Cộng thẳng ngày vào
         moLuc thì việc mới mở kéo cả nắm liên lạc về hôm nay, và trang
         Hôm nay báo "đội đã ghi 35 cuộc liên lạc" trong một buổi sáng. */
      var lucLl = themNgay(String(v.moLuc).slice(0, 10), so(vi, 171 + l, 1, 30));
      if (lucLl >= homNay()) lucLl = themNgay(homNay(), -so(vi, 181 + l, 1, 25));
      themDong({ doiTacId: v.doiTacId, viecId: v.id, luc: lucLl + " " + hai(so(vi, 172 + l, 9, 17)) + ":" + chon(["05", "22", "40"], vi, 173 + l),
        boi: { kieu: "nhanSu", id: nguoi.id, ten: nguoi.ten }, loai: "lien-lac",
        tieuDe: nguoi.ten.split(" ").pop() + " " + chon(["gọi điện", "nhắn Zalo", "gửi email", "gặp trực tiếp"], vi, 174 + l) + " · " + chon(LIEN_LAC_MAU, vi, 175 + l),
        noiDung: null, kenh: chon(["goi", "zalo", "email", "gap"], vi, 174 + l), ketQua: chon(["da-chot", "cho-doi-tac", "goi-lai"], vi, 176 + l), hienChoDoiTac: false });
    }
    if (hash(vi, 177) < 0.5) {
      var lucGc = themNgay(String(v.moLuc).slice(0, 10), so(vi, 178, 2, 20));
      if (lucGc >= homNay()) lucGc = themNgay(homNay(), -so(vi, 182, 1, 20));
      themDong({ doiTacId: v.doiTacId, viecId: v.id, luc: lucGc + " 10:15",
        boi: { kieu: "nhanSu", id: nguoi.id, ten: nguoi.ten }, loai: "ghi-chu",
        tieuDe: "Ghi chú nội bộ", noiDung: chon(["Đối tác nhạy cảm chuyện lịch, nhắc trước hai ngày.", "Người ký hợp đồng khác người liên hệ, cần gửi cả hai.", "Đợt trước bị trễ vì thiếu file gốc, lần này hỏi sớm."], vi, 179), hienChoDoiTac: false });
    }
    if (v.trangThai === "xong") {
      themDong({ doiTacId: v.doiTacId, viecId: v.id, luc: v.xongLuc, boi: { kieu: "nhanSu", id: nguoi.id, ten: nguoi.ten }, loai: "trang-thai",
        tieuDe: "Đã xong: " + v.tieuDe, noiDung: null, hienChoDoiTac: true });
    }
    (v.moc || []).forEach(function (mc) {
      if (mc.xongLuc) themDong({ doiTacId: v.doiTacId, viecId: v.id, luc: mc.xongLuc, boi: { kieu: "nhanSu", id: nguoi.id, ten: nguoi.ten }, loai: "moc", tieuDe: "Mốc " + mc.ten + " đã xong", noiDung: null, hienChoDoiTac: true });
    });
    if (v.trangThai === "cho-doi-tac" && v.canDoiTac) {
      themDong({ doiTacId: v.doiTacId, viecId: v.id, luc: v.capNhatLuc, boi: { kieu: "nhanSu", id: nguoi.id, ten: nguoi.ten }, loai: "tin-nhan",
        tieuDe: "Haustek nhắn: " + v.canDoiTac.viec, noiDung: "Bạn giúp Haustek " + v.canDoiTac.viec.toLowerCase() + " trước ngày " + ngayVi(v.canDoiTac.han) + " nhé.", canTraLoi: false, hienChoDoiTac: true });
    }
    if (v.dichVu === "ho-tro" && v.trangThai !== "xong") {
      var nd2 = s.nguoiDung.filter(function (u2) { return u2.doiTacId === v.doiTacId; })[0];
      themDong({ doiTacId: v.doiTacId, viecId: v.id, luc: v.moLuc, boi: { kieu: "nguoiDung", id: nd2 ? nd2.id : "", ten: nd2 ? nd2.ten : (dt5 ? dt5.ten : "") }, loai: "tin-nhan",
        tieuDe: v.tieuDe, noiDung: "Chào Haustek, " + chon(["mình muốn hỏi tiến độ giúp.", "nhờ Haustek kiểm tra lại giúp mình.", "cho mình xin cập nhật với ạ."], vi, 180), canTraLoi: true, hienChoDoiTac: true });
    }
  });
  s.bangKe.forEach(function (bk, bi) {
    themDong({ doiTacId: bk.doiTacId, viecId: null, luc: bk.taiLenLuc, boi: { kieu: "nhanSu", id: "S07", ten: "Vũ Kế Toán" }, loai: "bang-ke",
      tieuDe: "Bảng kê kỳ " + bk.ky + " · " + tien0(bk.soTien) + (bk.ngayChuyen ? " · đã chuyển " + ngayVi(bk.ngayChuyen) : " · chờ chuyển"),
      noiDung: null, ky: bk.ky, hienChoDoiTac: true });
  });
  s.tep.slice(0, 160).forEach(function (tp, ti) {
    themDong({ doiTacId: tp.doiTacId, viecId: null, luc: tp.taiLenLuc, boi: nsNgauNhien(ti), loai: "tep",
      tieuDe: "Gửi tệp " + tp.ten + " · phiên bản " + tp.phienBan, noiDung: null, tepId: tp.id,
      hienChoDoiTac: tp.loai !== "khac", daXem: tp.doiTacDaXemLuc ? { luc: tp.doiTacDaXemLuc, nguoiDungId: "", ten: "" } : null });
  });

  /* ---- thông báo ---- */
  var tbSeq = 0;
  for (var tb = 0; tb < CFG.N_THONG_BAO; tb++) {
    var mau = MAU_THONG_BAO[tb % MAU_THONG_BAO.length];
    var nguoiGui = s.nhanSu[(tb * 3) % s.nhanSu.length];
    var luc = themNgay(homNay(), -so(tb, 190, 0, 360)) + " " + hai(so(tb, 191, 9, 17)) + ":" + chon(["05", "18", "32", "47"], tb, 192);
    var kieu = hash(tb, 193) < 0.55 ? "chon" : hash(tb, 193) < 0.85 ? "theo-dich-vu" : "tat-ca";
    var nhan = [];
    if (kieu === "chon") nhan = [dtHoatDong[(tb * 7) % dtHoatDong.length].id];
    else if (kieu === "theo-dich-vu") {
      var dvChon = chon(DICH_VU.filter(function (d) { return !d.kyThuat; }), tb, 194).id;
      nhan = dtHoatDong.filter(function (d) { return d.dichVu.indexOf(dvChon) >= 0; }).map(function (d) { return d.id; });
    } else nhan = dtHoatDong.map(function (d) { return d.id; });
    if (!nhan.length) continue;
    /* Điền ĐỦ mọi chỗ trống của mẫu. Bản trước cắt nội dung ở dấu "{" đầu
       tiên rồi dán một câu chung vào, nên mọi thông báo đều đứt giữa chừng
       kiểu "Hồ sơ" rồi nhảy sang một câu không liên quan. Một lá thư gửi
       đối tác mà đứt giữa câu là thứ khách nhớ lâu hơn cả nội dung. */
    var oMau = {
      thang: String(ngay(luc).getMonth() + 1),
      ma: "HSTK-" + so(tb, 195, 1000, 9999),
      ten: chon(BAI_HAT, tb, 196),
      ky: kyDs[kyDs.length - 1 - (tb % 3)],
      soTien: tien0(so(tb, 199, 200, 7400)),
      ngay: ngayVi(themNgay(String(luc).slice(0, 10), -so(tb, 200, 1, 5))),
      tomTat: chon([
        "Hai việc đang chạy đúng tiến độ, một việc chờ bạn duyệt bản dựng.",
        "Hồ sơ phát hành đã qua kiểm metadata, đang chờ nền tảng nhận.",
        "Chiến dịch tháng này đã lên lịch xong, bắt đầu chạy từ tuần sau."], tb, 201),
      danhSach: chon([
        "· Ảnh bìa 3000×3000\n· File WAV chất lượng gốc",
        "· Mã ISRC cho hai track cuối\n· Tên người sáng tác đầy đủ",
        "· Ngày phát hành mong muốn\n· Thông tin nhà xuất bản"], tb, 202),
      duongDan: "· Spotify\n· Apple Music\n· YouTube Music",
      chiTiet: chon([
        "Giờ diễn lùi từ 20h sang 20h30, địa điểm giữ nguyên.",
        "Đổi ngày sang cuối tuần kế tiếp theo đề nghị của địa điểm."], tb, 203)
    };
    function dienMau(chu) {
      return String(chu).replace(/\{([a-zA-Z]+)\}/g, function (_, k) { return oMau[k] != null ? oMau[k] : ""; });
    }
    var t2 = {
      id: "TB-" + String(++tbSeq).padStart(4, "0"),
      tieuDe: dienMau(mau.tieuDe),
      noiDung: dienMau(mau.noiDung),
      viecId: null, guiToi: { kieu: kieu, doiTacIds: nhan }, noiBo: false,
      nguoiGuiId: nguoiGui.id, nhap: false, guiLuc: luc, tepId: null
    };
    s.thongBao.push(t2);
    nhan.forEach(function (dtid, ni) {
      var d4 = themDong({ doiTacId: dtid, viecId: null, luc: luc, boi: { kieu: "nhanSu", id: nguoiGui.id, ten: nguoiGui.ten }, loai: "thong-bao",
        tieuDe: t2.tieuDe, noiDung: t2.noiDung, thongBaoId: t2.id, hienChoDoiTac: true });
      if (hash(tb + ni, 197) < 0.72) {
        var nd3 = s.nguoiDung.filter(function (u3) { return u3.doiTacId === dtid; })[0];
        if (nd3) {
          s.luotDoc.push({ thongBaoId: t2.id, nguoiDungId: nd3.id, doiTacId: dtid, luc: themNgay(String(luc).slice(0, 10), so(tb + ni, 198, 0, 3)) + " 20:15" });
          d4.daXem = { luc: themNgay(String(luc).slice(0, 10), so(tb + ni, 198, 0, 3)) + " 20:15", nguoiDungId: nd3.id, ten: nd3.ten };
        }
      }
    });
  }

  /* ---- một buổi sáng đã có việc xảy ra ----
     Mở phần mềm lên mà khối "đội đã làm hôm nay" trống trơn thì cái khối
     ấy vô nghĩa, và người dùng học được rằng nó luôn trống. Nên hôm nay
     phải có vài cuộc liên lạc và một thông báo, đúng như một buổi sáng
     thật của mười người. */
  var dtSang = s.doiTac.filter(function (d) { return d.trangThai === "dang-hop-tac"; });
  ["S03", "S04", "S02", "S06"].forEach(function (nsid, gi) {
    var ns6 = s.nhanSu.filter(function (n) { return n.id === nsid; })[0];
    var dt6 = dtSang[(gi * 7 + 3) % dtSang.length];
    var kenh6 = chon(["goi", "zalo", "goi", "gap"], gi, 210);
    themDong({ doiTacId: dt6.id, viecId: null,
      luc: homNay() + " " + hai(8 + gi * 2) + ":" + chon(["05", "20", "35", "50"], gi, 211),
      boi: { kieu: "nhanSu", id: ns6.id, ten: ns6.ten }, loai: "lien-lac",
      tieuDe: ns6.ten.split(" ").pop() + " " + ({ goi: "gọi điện", zalo: "nhắn Zalo", gap: "gặp trực tiếp" }[kenh6]) +
        " · " + chon(LIEN_LAC_MAU, gi, 212),
      noiDung: null, kenh: kenh6, ketQua: chon(["da-chot", "da-chot", "cho-doi-tac"], gi, 213), hienChoDoiTac: false });
  });

  /* ---- nhật ký thao tác ----
     Sổ nhật ký trống thì trang Nhật ký chỉ là một ô rỗng, và không ai biết
     nó dùng để làm gì cho tới khi có sự cố cần tra. */
  var NK_MAU = [
    ["dich-vu.cam-ket", "phat-hanh", "còn 2 ngày làm việc", "S01"],
    ["doi-tac.nguoi-phu-trach", null, "chuyển sang Phạm Thu Hà", "S01"],
    ["nguoi-dung.moi", null, "", "S02"],
    ["doi-tac.lien-he", null, "", "S03"],
    ["nhan-su.sua", "S09", "Bùi Digital", "S01"],
    ["doi-tac.them", null, "", "S04"],
    ["doi-tac.lien-he", null, "", "S04"],
    ["dich-vu.cam-ket", "su-kien", "còn 1 ngày làm việc", "S01"]
  ];
  NK_MAU.forEach(function (x, i) {
    var dtn = dtHoatDong[(i * 5) % dtHoatDong.length];
    s.nhatKy.push({
      id: "NK-" + (i + 1),
      luc: themNgay(homNay(), -so(i, 220, 0, 40)) + " " + hai(so(i, 221, 9, 17)) + ":" + chon(["08", "26", "41"], i, 222),
      boiId: x[3], hanhDong: x[0], doiTuong: x[1] || dtn.id,
      chiTiet: x[2] || dtn.ten
    });
  });
  s.nhatKy.sort(function (a, b) { return a.luc < b.luc ? 1 : -1; });

  s.dong.sort(function (a, b) { return a.luc < b.luc ? 1 : a.luc > b.luc ? -1 : 0; });
  return s;
}

/* =====================================================================
   7. CHỈ MỤC DẪN XUẤT — dựng một lượt, huỷ khi có hàm ghi chạy
   ===================================================================== */
var CHI_MUC = null;
function dungChiMuc() {
  var ix = { dongTheoDoiTac: {}, dongTheoViec: {}, lienLacCuoi: {}, viecTheoDoiTac: {}, viecTheoNguoi: {}, banPhatHanhTheoDoiTac: {} };
  state.dong.forEach(function (d) {
    (ix.dongTheoDoiTac[d.doiTacId] = ix.dongTheoDoiTac[d.doiTacId] || []).push(d);
    if (d.viecId) (ix.dongTheoViec[d.viecId] = ix.dongTheoViec[d.viecId] || []).push(d);
    if (d.loai === "lien-lac") {
      var cu = ix.lienLacCuoi[d.doiTacId];
      if (!cu || d.luc > cu.luc) ix.lienLacCuoi[d.doiTacId] = { luc: d.luc, tomTat: d.tieuDe, boiTen: d.boi ? d.boi.ten : "" };
    }
  });
  state.viec.forEach(function (v) {
    var o = ix.viecTheoDoiTac[v.doiTacId] = ix.viecTheoDoiTac[v.doiTacId] || { dangMo: [], daXong: [] };
    (v.trangThai === "xong" || v.trangThai === "huy" ? o.daXong : o.dangMo).push(v.id);
    if (v.nguoiPhuTrachId) (ix.viecTheoNguoi[v.nguoiPhuTrachId] = ix.viecTheoNguoi[v.nguoiPhuTrachId] || []).push(v.id);
  });
  state.banPhatHanh.forEach(function (b) { (ix.banPhatHanhTheoDoiTac[b.doiTacId] = ix.banPhatHanhTheoDoiTac[b.doiTacId] || []).push(b); });
  Object.keys(ix.banPhatHanhTheoDoiTac).forEach(function (k) { ix.banPhatHanhTheoDoiTac[k].sort(function (a, b) { return a.ngayPhatHanh < b.ngayPhatHanh ? 1 : -1; }); });
  CHI_MUC = ix;
  return ix;
}
function chiMuc() { return CHI_MUC || dungChiMuc(); }
function doiState() { CHI_MUC = null; kho.ghi(); }

/* =====================================================================
   8. HÀM ĐỌC DÙNG CHUNG
   ===================================================================== */
var _toi = null;                                    /* nhân sự đang dùng cổng nội bộ */
function toi() { return _toi || state.nhanSu[0]; }
function nsCua(id) { for (var i = 0; i < state.nhanSu.length; i++) if (state.nhanSu[i].id === id) return state.nhanSu[i]; return null; }
function dtCua(id) { for (var i = 0; i < state.doiTac.length; i++) if (state.doiTac[i].id === id) return state.doiTac[i]; return null; }
function viecCua(id) { for (var i = 0; i < state.viec.length; i++) if (state.viec[i].id === id) return state.viec[i]; return null; }
function bphCua(id) { for (var i = 0; i < state.banPhatHanh.length; i++) if (state.banPhatHanh[i].id === id) return state.banPhatHanh[i]; return null; }
function ndCua(id) { for (var i = 0; i < state.nguoiDung.length; i++) if (state.nguoiDung[i].id === id) return state.nguoiDung[i]; return null; }

/* Việc đang mở, kèm các trường tiện cho giao diện. */
function lamDayViec(v) {
  var dt = dtCua(v.doiTacId), ns = v.nguoiPhuTrachId ? nsCua(v.nguoiPhuTrachId) : null, dv = dvCua(v.dichVu);
  return Object.assign({}, v, {
    doiTacTen: dt ? dt.ten : "", doiTacLoai: dt ? dt.loai : "",
    nguoiPhuTrachTen: ns ? ns.ten : null, boPhan: dv.boPhan,
    dichVuTen: dv.vi, dichVuKyThuat: !!dv.kyThuat,
    treHanPhanHoi: v.trangThai === "moi" && v.hanPhanHoi < homNay(),
    treBuocTiep: !!(v.buocTiep && v.buocTiep.aiLam === "haustek" && v.buocTiep.hanNgay < homNay()),
    ngayImLang: v.capNhatLuc ? cachNgay(v.capNhatLuc) : null
  });
}

/* Sáu bộ sinh dòng cho khối "Cần bạn hôm nay". Một việc sinh tối đa một
   dòng: bậc nhỏ nhất thắng. Không bao giờ sắp lại theo màu. */
function viecCanToi(nhanSuId) {
  var me = nsCua(nhanSuId) || toi(), hn = homNay(), ra = [], daCo = {};
  function them(bac, v, cau, nut, nhanNgay) {
    if (daCo[v.id]) return;
    daCo[v.id] = true;
    ra.push({ bac: bac, viecId: v.id, doiTacId: v.doiTacId, cau: cau, nut: nut, nhanNgay: nhanNgay || null, ngay: v.hanPhanHoi || (v.buocTiep && v.buocTiep.hanNgay) || v.moLuc, doiTacTen: (dtCua(v.doiTacId) || {}).ten || "" });
  }
  state.viec.forEach(function (v) {
    if (v.trangThai === "xong" || v.trangThai === "huy") return;
    var dt = dtCua(v.doiTacId), dv = dvCua(v.dichVu), cuaToi = v.nguoiPhuTrachId === me.id;
    var tenDt = dt ? dt.ten : "";
    /* g0 · việc chưa có người phụ trách, thuộc bộ phận của tôi.
       Ban giám đốc bao mọi bộ phận: không việc nào được rơi xuống đất. */
    if (!v.nguoiPhuTrachId && (dv.boPhan === me.boPhan || me.boPhan === "ban-giam-doc")) {
      them(0, v, "Việc mới của <b>" + tenDt + "</b> chưa có người phụ trách.", { nhan: "Nhận việc", hanh: "nhan" });
      return;
    }
    if (!cuaToi) return;
    /* g1 · quá hạn phản hồi */
    if (v.trangThai === "moi" && v.hanPhanHoi < hn) {
      var lh = dt && dt.lienHe && dt.lienHe[0];
      them(1, v, v.tieuDe + " · <b>" + tenDt + "</b> quá hạn phản hồi " + cachNgay(v.hanPhanHoi) + " ngày."
        + (lh ? " Gọi hoặc nhắn Zalo cho " + lh.ten + " (" + lh.dienThoai + ")." : ""),
        { nhan: "Mở việc", hanh: "mo" }, ngayGonVi(v.hanPhanHoi));
      return;
    }
    /* g2 · hôm nay là hạn phản hồi */
    if (v.hanPhanHoi === hn && v.trangThai === "moi") { them(2, v, "Hôm nay là hạn phản hồi cho " + v.tieuDe + " · <b>" + tenDt + "</b>.", { nhan: "Mở việc", hanh: "mo" }); return; }
    /* g3 · bước tiếp của Haustek đã tới hạn */
    if (v.buocTiep && v.buocTiep.aiLam === "haustek" && v.buocTiep.hanNgay <= hn) { them(3, v, v.buocTiep.viec + " · <b>" + tenDt + "</b>.", { nhan: "Cập nhật", hanh: "mo" }); return; }
    /* g4 · đối tác nhắn quá 24 giờ chưa ai trả lời */
    var ds = (chiMuc().dongTheoViec[v.id] || []);
    var moiNhat = ds[0];
    if (moiNhat && moiNhat.loai === "tin-nhan" && moiNhat.boi && moiNhat.boi.kieu === "nguoiDung" && moiNhat.canTraLoi && cachNgay(moiNhat.luc) >= 1) {
      them(4, v, "<b>" + moiNhat.boi.ten + "</b> đã nhắn lúc " + gioVi(moiNhat.luc) + " ngày " + ngayGonVi(moiNhat.luc) + ", chưa có ai trả lời.", { nhan: "Trả lời", hanh: "mo" });
      return;
    }
    /* g5 · mốc tới hạn hôm nay, hoặc bản phát hành mốc quá 14 ngày */
    var mocHomNay = (v.moc || []).filter(function (m) { return !m.xongLuc && m.han === hn; })[0];
    if (mocHomNay) { them(5, v, "Mốc " + mocHomNay.ten + " của " + v.tieuDe + " là hôm nay.", { nhan: "Mở việc", hanh: "mo" }); return; }
    if (v.banPhatHanhId) {
      var b = bphCua(v.banPhatHanhId);
      if (b && b.nenTang !== "da-len" && cachNgay(b.nenTangCapNhatLuc) > 14) them(5, v, b.ten + " · <b>" + tenDt + "</b> chưa cập nhật trạng thái nền tảng " + cachNgay(b.nenTangCapNhatLuc) + " ngày.", { nhan: "Mở việc", hanh: "mo" });
    }
  });
  /* g6 · kế toán: bảng kê là việc của họ, không nằm trong bảng viec.
     Cùng hàng đợi, cùng cách bấm, chỉ khác nguồn. */
  if (me.boPhan === "ke-toan" || me.boPhan === "ban-giam-doc") {
    var kyNay = admin.bangKe.ky().slice(-1)[0];
    var thieu = admin.bangKe.thieu(kyNay);
    if (thieu.length) {
      ra.push({ bac: 3, viecId: null, doiTacId: thieu[0].id, di: "thong-bao", loc: { tab: "bang-ke" }, ngay: hn, doiTacTen: thieu[0].ten,
        cau: "Kỳ " + kyNay + " còn <b>" + thieu.length + " đối tác</b> chưa có bảng kê. Tải từ OneRPM hoặc Believe rồi đưa lên đây.",
        nut: { nhan: "Mở bảng kê", hanh: "di" } });
    }
    state.bangKe.filter(function (b) { return b.trangThai === "da-tai-len"; })
      .sort(function (a, b) { return a.taiLenLuc < b.taiLenLuc ? -1 : 1; }).slice(0, 4).forEach(function (b) {
        var dtb = dtCua(b.doiTacId);
        ra.push({ bac: 4, viecId: null, doiTacId: b.doiTacId, di: "thong-bao", loc: { tab: "bang-ke" }, ngay: String(b.taiLenLuc).slice(0, 10), doiTacTen: dtb ? dtb.ten : "",
          cau: "Bảng kê kỳ " + b.ky + " của <b>" + (dtb ? dtb.ten : "") + "</b> đã lên " + cachNgay(b.taiLenLuc) + " ngày mà chưa đánh dấu đã chuyển khoản.",
          nut: { nhan: "Đánh dấu đã chuyển", hanh: "chuyen", id: b.id } });
      });
  }
  ra.sort(function (a, b) { return a.bac - b.bac || (a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : a.doiTacTen.localeCompare(b.doiTacTen, "vi")); });
  return ra;
}

/* Câu cam kết mà ĐỐI TÁC đọc.

   Khi còn hạn thì nói ngày. Khi đã quá hạn thì KHÔNG đếm ngược sự chậm
   trễ của Haustek trước mặt họ, và cũng không im lặng giữ nguyên một ngày
   đã trôi qua như thể không ai để ý. Nói thật việc đang ở đâu, kèm tên
   người gọi được. Cùng sự thật đó, ở cổng nội bộ, là một dòng quá hạn
   nằm trên đầu hàng đợi của người phụ trách, nơi có người xử lý được. */
function camKetChoDoiTac(v) {
  if (v.trangThai !== "moi") return null;
  var ns = v.nguoiPhuTrachId ? nsCua(v.nguoiPhuTrachId) : null;
  if (v.hanPhanHoi >= homNay()) return "Haustek phản hồi chậm nhất ngày " + ngayVi(v.hanPhanHoi) + ".";
  return "Haustek đang xem việc này." + (ns ? " Người phụ trách là " + ns.ten + ", bạn gọi hoặc nhắn bất cứ lúc nào." : "");
}

/* Việc cần đối tác bấm là xong. Đúng danh sách này hiện ở cả hai cổng. */
function viecCanDoiTac(doiTacId) {
  return state.viec.filter(function (v) {
    return v.doiTacId === doiTacId && v.trangThai === "cho-doi-tac" && v.canDoiTac && v.hienChoDoiTac;
  }).map(function (v) {
    return { viecId: v.id, tieuDe: v.tieuDe, dichVu: v.dichVu, viec: v.canDoiTac.viec, han: v.canDoiTac.han, choTuNgay: v.capNhatLuc, soNgayCho: cachNgay(v.capNhatLuc) };
  }).sort(function (a, b) { return a.han < b.han ? -1 : 1; });
}

/* Đối tác im lặng quá nhịp cập nhật của dịch vụ họ mua. */
function imLangQua() {
  var ix = chiMuc(), ra = [];
  state.doiTac.forEach(function (dt) {
    if (dt.trangThai !== "dang-hop-tac") return;
    var nhip = Math.max.apply(null, dt.dichVu.map(function (d) { return dvCua(d).nhipCapNhat; }).concat([7]));
    var ll = ix.lienLacCuoi[dt.id];
    /* Chưa từng ghi liên lạc thì KHÔNG quy ra một con số ngày. "Đã 1057
       ngày chưa có tin" là câu sai: chưa ai ghi không có nghĩa là chưa ai
       gọi. Nói đúng cái mình biết, và cái mình biết là sổ đang trống. */
    if (!ll) { ra.push({ doiTacId: dt.id, ten: dt.ten, soNgay: null, nhip: nhip, lanCuoi: null, tomTat: null, chuaGhi: true }); return; }
    var soNgay = cachNgay(ll.luc);
    if (soNgay > nhip) ra.push({ doiTacId: dt.id, ten: dt.ten, soNgay: soNgay, nhip: nhip, lanCuoi: ll.luc, tomTat: ll.tomTat, chuaGhi: false });
  });
  /* Người có sổ trống xếp cuối: chưa biết thì chưa gấp bằng biết là đã lâu. */
  return ra.sort(function (a, b) {
    if (a.chuaGhi !== b.chuaGhi) return a.chuaGhi ? 1 : -1;
    return (b.soNgay || 0) - (a.soNgay || 0);
  });
}

function daXongTrong(tu, nhanSuId) {
  var v = state.viec.filter(function (x) { return x.xongLuc && x.xongLuc >= tu && (!nhanSuId || x.nguoiPhuTrachId === nhanSuId); });
  var tb = state.thongBao.filter(function (x) { return !x.nhap && x.guiLuc >= tu && (!nhanSuId || x.nguoiGuiId === nhanSuId); });
  var ll = state.dong.filter(function (d) { return d.loai === "lien-lac" && d.luc >= tu && (!nhanSuId || (d.boi && d.boi.id === nhanSuId)); });
  return { viec: v.length, thongBao: tb.length, lienLac: ll.length, dsViec: v, dsThongBao: tb, dsLienLac: ll };
}
function daXongHomNay(nhanSuId) { return daXongTrong(homNay() + " 00:00", nhanSuId); }
function daXongTuanNay(nhanSuId) {
  var d = new Date(ASOF), t = d.getDay(); d.setDate(d.getDate() - (t === 0 ? 6 : t - 1));
  return daXongTrong(isoNgay(d) + " 00:00", nhanSuId);
}
function dichVuCua(doiTacId) { var dt = dtCua(doiTacId); return dt ? dt.dichVu.slice() : []; }
function banPhatHanhMoc() {
  return state.banPhatHanh.filter(function (b) { return b.nenTang !== "da-len" && cachNgay(b.nenTangCapNhatLuc) > 14; });
}

/* Sắp tới: gộp bốn nguồn theo ngày, 14 ngày tới. */
function sapToi(soNgay) {
  var den = themNgay(homNay(), soNgay || 14), ra = [];
  state.viec.forEach(function (v) {
    if (v.trangThai === "xong" || v.trangThai === "huy") return;
    var dt = dtCua(v.doiTacId), ten = dt ? dt.ten : "";
    if (v.hanGiao && v.hanGiao >= homNay() && v.hanGiao <= den) ra.push({ ngay: v.hanGiao, cau: "Hạn giao: " + v.tieuDe, doiTacTen: ten, viecId: v.id });
    if (v.dichVu === "su-kien" && v.chiTiet && v.chiTiet.ngayGio) {
      var n = String(v.chiTiet.ngayGio).slice(0, 10);
      if (n >= homNay() && n <= den) ra.push({ ngay: n, cau: v.tieuDe + " · " + (v.chiTiet.diaDiem || ""), doiTacTen: ten, viecId: v.id });
    }
  });
  state.banPhatHanh.forEach(function (b) {
    if (b.ngayPhatHanh >= homNay() && b.ngayPhatHanh <= den && b.nenTang !== "da-len") {
      var dt = dtCua(b.doiTacId); ra.push({ ngay: b.ngayPhatHanh, cau: "Phát hành " + b.ten, doiTacTen: dt ? dt.ten : "", viecId: b.viecId });
    }
  });
  state.doiTac.forEach(function (dt) {
    if (dt.trangThai !== "dang-hop-tac") return;
    if (dt.hopDong.denNgay >= homNay() && dt.hopDong.denNgay <= den) ra.push({ ngay: dt.hopDong.denNgay, cau: "Hợp đồng hết hạn", doiTacTen: dt.ten, doiTacId: dt.id });
  });
  return ra.sort(function (a, b) { return a.ngay < b.ngay ? -1 : 1; });
}

/* Dòng thời gian của một đối tác, đã sắp mới nhất trước. */
function dongTheoDoiTac(doiTacId, loc) {
  var ds = (chiMuc().dongTheoDoiTac[doiTacId] || []).slice();
  if (loc && loc.loai && loc.loai !== "tat-ca") ds = ds.filter(function (d) { return d.loai === loc.loai; });
  if (loc && loc.viecId) ds = ds.filter(function (d) { return d.viecId === loc.viecId; });
  if (loc && loc.chiDoiTacThay) ds = ds.filter(function (d) { return d.hienChoDoiTac; });
  return ds;
}

/* =====================================================================
   9. HÀM GHI
   ===================================================================== */
function nhatKy(hanhDong, doiTuong, chiTiet, boiId) {
  state.nhatKy.unshift({ id: "NK-" + (state.nhatKy.length + 1), luc: bayGio(), boiId: boiId || toi().id, hanhDong: hanhDong, doiTuong: doiTuong, chiTiet: chiTiet || "" });
  if (state.nhatKy.length > 300) state.nhatKy.length = 300;
}
/* Hàm ghi dòng DUY NHẤT. Luôn đặt hienChoDoiTac tường minh. */
function themDong(o) {
  if (!o || !o.doiTacId) throw new Error("dong.them: thiếu doiTacId");
  if (o.hienChoDoiTac === undefined) throw new Error("dong.them: phải nói rõ hienChoDoiTac");
  var d = Object.assign({ id: "D-" + (state.dong.length + 1) + "-" + Date.now().toString(36), luc: bayGio(), viecId: null, noiDung: null, daXem: null }, o);
  if (d.loai === "ghi-chu") d.hienChoDoiTac = false;   /* ghi chú nội bộ không có đường nào lộ ra */
  state.dong.unshift(d);
  var v = d.viecId ? viecCua(d.viecId) : null;
  if (v) { v.capNhatLuc = d.luc; }
  doiState();
  return d;
}

var admin = {
  /* ---- tra cứu ---- */
  cfg: CFG, dichVu: DICH_VU, boPhan: BO_PHAN, trangThaiViec: TRANG_THAI_VIEC,
  trangThaiPhatHanh: TRANG_THAI_PH, nenTangPhatHanh: NEN_TANG_PH,
  homNay: homNay, bayGio: bayGio, hanLamViec: hanLamViec, cachNgay: cachNgay, themNgay: themNgay,
  ngayVi: ngayVi, ngayGonVi: ngayGonVi, gioVi: gioVi, thuTrongTuan: thuTrongTuan, tien0: tien0,
  dvCua: dvCua, state: function () { return state; },

  nhanSu: {
    list: function () { return state.nhanSu.slice(); },
    get: nsCua,
    get toi() { return toi(); },
    datToi: function (id) { var n = nsCua(id); if (n) _toi = n; return toi(); },
    theoBoPhan: function (bp) { return state.nhanSu.filter(function (n) { return n.boPhan === bp; }); },
    sua: function (id, o) {
      var n = nsCua(id); if (!n) throw new Error("khong-thay-nhan-su");
      if (toi().vai !== "quan-ly") throw new Error("chi-quan-ly");
      ["ten", "email", "dienThoai", "boPhan", "chucDanh", "vai"].forEach(function (k) { if (o[k] != null && o[k] !== "") n[k] = o[k]; });
      if (o.hoatDong != null) n.hoatDong = !!o.hoatDong;
      nhatKy("nhan-su.sua", id, n.ten); doiState(); return n;
    },
    them: function (o) {
      if (toi().vai !== "quan-ly") throw new Error("chi-quan-ly");
      if (!chuoi(o.ten)) throw new Error("thieu-ten");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(chuoi(o.email))) throw new Error("email-khong-hop-le");
      var id = "S" + String(state.nhanSu.length + 1).padStart(2, "0");
      var n = { id: id, ten: chuoi(o.ten), email: chuoi(o.email), dienThoai: chuoi(o.dienThoai), boPhan: o.boPhan || "kinh-doanh", chucDanh: chuoi(o.chucDanh) || "Nhân viên", vai: o.vai === "quan-ly" ? "quan-ly" : "nhan-vien", dichVuPhuTrach: [], hoatDong: true };
      state.nhanSu.push(n); nhatKy("nhan-su.them", id, n.ten); doiState(); return n;
    }
  },

  doiTac: {
    list: function (loc) {
      var ix = chiMuc();
      var ds = state.doiTac.map(function (dt) {
        var vt = ix.viecTheoDoiTac[dt.id] || { dangMo: [], daXong: [] };
        var ll = ix.lienLacCuoi[dt.id];
        var ns = nsCua(dt.nguoiPhuTrachId);
        return Object.assign({}, dt, {
          nguoiPhuTrachTen: ns ? ns.ten : "", soViecDangMo: vt.dangMo.length, soViecDaXong: vt.daXong.length,
          /* Chưa ghi liên lạc nào là CHƯA BIẾT, không phải "đã lâu lắm rồi".
             Quy nó ra một con số ngày kể từ lúc ký hợp đồng thì đối tác mới
             ký tuần trước lại nhảy lên đầu danh sách "lâu chưa có tin". */
          lienLacCuoi: ll || null, chuaGhiLienLac: !ll,
          ngayImLang: ll ? cachNgay(ll.luc) : null,
          conHan: cachNgay(homNay(), dt.hopDong.denNgay)
        });
      });
      if (loc && loc.q) {
        var q = String(loc.q).toLowerCase();
        ds = ds.filter(function (d) { return d.ten.toLowerCase().indexOf(q) >= 0 || d.id.toLowerCase().indexOf(q) >= 0; });
      }
      if (loc && loc.dichVu) ds = ds.filter(function (d) { return d.dichVu.indexOf(loc.dichVu) >= 0; });
      if (loc && loc.nguoiPhuTrachId) ds = ds.filter(function (d) { return d.nguoiPhuTrachId === loc.nguoiPhuTrachId; });
      if (loc && loc.trangThai) ds = ds.filter(function (d) { return d.trangThai === loc.trangThai; });
      return ds;
    },
    get: function (id) {
      var dt = dtCua(id); if (!dt) return null;
      var ix = chiMuc(), vt = ix.viecTheoDoiTac[id] || { dangMo: [], daXong: [] };
      return Object.assign({}, dt, {
        nguoiPhuTrach: nsCua(dt.nguoiPhuTrachId),
        viecDangMo: vt.dangMo.map(viecCua).filter(Boolean).map(lamDayViec),
        viecDaXong: vt.daXong.map(viecCua).filter(Boolean).map(lamDayViec),
        canDoiTac: viecCanDoiTac(id),
        banPhatHanh: (ix.banPhatHanhTheoDoiTac[id] || []).slice(),
        bangKe: state.bangKe.filter(function (b) { return b.doiTacId === id; }).sort(function (a, b) { return a.ky < b.ky ? 1 : -1; }),
        tamUng: state.tamUng.filter(function (t) { return t.doiTacId === id && t.daHoan < t.soTien; }),
        tep: state.tep.filter(function (t) { return t.doiTacId === id; }).sort(function (a, b) { return a.taiLenLuc < b.taiLenLuc ? 1 : -1; }),
        nguoiDung: state.nguoiDung.filter(function (u) { return u.doiTacId === id; }),
        lienLacCuoi: ix.lienLacCuoi[id] || null,
        conHan: cachNgay(homNay(), dt.hopDong.denNgay)
      });
    },
    suaTomTat: function (id, chu) {
      var dt = dtCua(id); if (!dt) throw new Error("khong-thay-doi-tac");
      dt.tomTat = chuoi(chu); dt.tomTatCapNhatLuc = bayGio(); dt.tomTatBoiId = toi().id; dt.capNhatLuc = bayGio();
      doiState(); return dt;
    },
    doiNguoiPhuTrach: function (id, nhanSuId) {
      var dt = dtCua(id), ns = nsCua(nhanSuId);
      if (!dt || !ns) throw new Error("khong-thay-doi-tac");
      dt.nguoiPhuTrachId = nhanSuId; dt.capNhatLuc = bayGio();
      nhatKy("doi-tac.nguoi-phu-trach", id, ns.ten); doiState(); return dt;
    },
    them: function (o) {
      if (!chuoi(o.ten)) throw new Error("thieu-ten");
      if (state.doiTac.some(function (d) { return d.ten.toLowerCase() === chuoi(o.ten).toLowerCase(); })) throw new Error("trung-ten");
      var dv = (o.dichVu || []).filter(function (x) { return DICH_VU.some(function (d) { return d.id === x && !d.kyThuat; }); });
      if (!dv.length) throw new Error("thieu-dich-vu");
      var id = "DT-" + String(state.doiTac.length + 1).padStart(4, "0");
      var dt = {
        id: id, ten: chuoi(o.ten), loai: o.loai || "nghe-si", labelMeId: o.labelMeId || null, dichVu: dv,
        nguoiPhuTrachId: o.nguoiPhuTrachId || toi().id, trangThai: "dang-hop-tac",
        hopDong: { tuNgay: o.tuNgay || homNay(), denNgay: o.denNgay || themNgay(homNay(), 730), tyLeDoiTacHuong: +o.tyLeDoiTacHuong || 70, nhipBaoCao: o.nhipBaoCao || "quy", tepId: null, ghiChu: chuoi(o.ghiChu) },
        lienHe: [{ ten: chuoi(o.lienHeTen) || chuoi(o.ten), vaiTro: "Liên hệ chính", dienThoai: chuoi(o.dienThoai), zalo: chuoi(o.dienThoai), email: chuoi(o.email), gioTienGoi: "Giờ nào cũng được", laChinh: true }],
        nganHang: null, maNgoai: { onerpm: chuoi(o.onerpm), believe: "", warner: "", ytcms: chuoi(o.ytcms), doiTacTuDangNhap: false },
        tomTat: chuoi(o.tomTat) || "Đối tác mới, chưa có ghi chú bàn giao.", tomTatCapNhatLuc: bayGio(), tomTatBoiId: toi().id,
        taoLuc: bayGio(), capNhatLuc: bayGio()
      };
      state.doiTac.push(dt);
      if (chuoi(o.email)) state.nguoiDung.push({ id: "U-" + String(state.nguoiDung.length + 1).padStart(4, "0"), email: chuoi(o.email), doiTacId: id, ten: dt.lienHe[0].ten, trangThai: "da-moi", moiLuc: bayGio(), lanDangNhapCuoi: null });
      nhatKy("doi-tac.them", id, dt.ten); doiState(); return dt;
    },
    themLienHe: function (id, o) {
      var dt = dtCua(id); if (!dt) throw new Error("khong-thay-doi-tac");
      if (!chuoi(o && o.ten)) throw new Error("thieu-ten");
      var lh = { ten: chuoi(o.ten), vaiTro: chuoi(o.vaiTro) || "Liên hệ", dienThoai: chuoi(o.dienThoai),
                 zalo: chuoi(o.zalo) || chuoi(o.dienThoai), email: chuoi(o.email),
                 gioTienGoi: chuoi(o.gioTienGoi) || "Giờ nào cũng được",
                 laChinh: !dt.lienHe.length };
      dt.lienHe.push(lh); dt.capNhatLuc = bayGio();
      nhatKy("doi-tac.lien-he", id, lh.ten); doiState(); return lh;
    },
    xoaLienHe: function (id, i) {
      var dt = dtCua(id); if (!dt) throw new Error("khong-thay-doi-tac");
      if (dt.lienHe.length <= 1) throw new Error("phai-con-mot-lien-he");
      dt.lienHe.splice(i, 1);
      if (!dt.lienHe.some(function (x) { return x.laChinh; })) dt.lienHe[0].laChinh = true;
      doiState(); return dt.lienHe;
    },
    nguoiDung: function (id) {
      return state.nguoiDung.filter(function (u) { return u.doiTacId === id; })
        .map(function (u) { return Object.assign({}, u); });
    },
    moiVaoCong: function (id, email, ten) {
      var dt = dtCua(id); if (!dt) throw new Error("khong-thay-doi-tac");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(chuoi(email))) throw new Error("email-khong-hop-le");
      if (state.nguoiDung.some(function (u) { return u.email.toLowerCase() === chuoi(email).toLowerCase(); })) throw new Error("email-da-co");
      var u = { id: "U-" + String(state.nguoiDung.length + 1).padStart(4, "0"), email: chuoi(email), doiTacId: id, ten: chuoi(ten) || chuoi(email).split("@")[0], trangThai: "da-moi", moiLuc: bayGio(), lanDangNhapCuoi: null };
      state.nguoiDung.push(u); nhatKy("nguoi-dung.moi", id, u.email); doiState(); return u;
    }
  },

  viec: {
    list: function (loc) {
      var ds = state.viec.map(lamDayViec);
      loc = loc || {};
      if (loc.trangThai && loc.trangThai !== "tat-ca") {
        if (loc.trangThai === "dang-mo") ds = ds.filter(function (v) { return v.trangThai !== "xong" && v.trangThai !== "huy"; });
        else ds = ds.filter(function (v) { return v.trangThai === loc.trangThai; });
      }
      if (loc.dichVu) ds = ds.filter(function (v) { return v.dichVu === loc.dichVu; });
      if (loc.doiTacId) ds = ds.filter(function (v) { return v.doiTacId === loc.doiTacId; });
      if (loc.nguoiPhuTrachId) ds = ds.filter(function (v) { return v.nguoiPhuTrachId === loc.nguoiPhuTrachId; });
      if (loc.chuaGan) ds = ds.filter(function (v) { return !v.nguoiPhuTrachId; });
      if (loc.boPhan) ds = ds.filter(function (v) { return v.boPhan === loc.boPhan; });
      if (loc.tre) ds = ds.filter(function (v) { return v.treHanPhanHoi || v.treBuocTiep; });
      if (loc.q) {
        var q = String(loc.q).toLowerCase();
        ds = ds.filter(function (v) { return (v.tieuDe + " " + v.id + " " + v.doiTacTen).toLowerCase().indexOf(q) >= 0; });
      }
      return ds.sort(function (a, b) { return (b.capNhatLuc || "") < (a.capNhatLuc || "") ? -1 : 1; });
    },
    get: function (id) {
      var v = viecCua(id); if (!v) return null;
      var day = lamDayViec(v);
      day.dong = (chiMuc().dongTheoViec[id] || []).slice();
      day.doiTac = dtCua(v.doiTacId);
      day.banPhatHanh = v.banPhatHanhId ? bphCua(v.banPhatHanhId) : null;
      return day;
    },
    dem: function () {
      var ds = state.viec, hn = homNay();
      var dangMo = ds.filter(function (v) { return v.trangThai !== "xong" && v.trangThai !== "huy"; });
      return {
        dangMo: dangMo.length,
        moi: ds.filter(function (v) { return v.trangThai === "moi"; }).length,
        dangLam: ds.filter(function (v) { return v.trangThai === "dang-lam"; }).length,
        choDoiTac: ds.filter(function (v) { return v.trangThai === "cho-doi-tac"; }).length,
        xong: ds.filter(function (v) { return v.trangThai === "xong"; }).length,
        chuaGan: dangMo.filter(function (v) { return !v.nguoiPhuTrachId; }).length,
        tre: dangMo.filter(function (v) { return (v.trangThai === "moi" && v.hanPhanHoi < hn) || (v.buocTiep && v.buocTiep.aiLam === "haustek" && v.buocTiep.hanNgay < hn); }).length,
        cuaToi: dangMo.filter(function (v) { return v.nguoiPhuTrachId === toi().id; }).length
      };
    },
    them: function (o) {
      var dt = dtCua(o.doiTacId); if (!dt) throw new Error("thieu-doi-tac");
      var dv = DICH_VU.filter(function (d) { return d.id === o.dichVu; })[0]; if (!dv) throw new Error("thieu-dich-vu");
      if (!chuoi(o.tieuDe)) throw new Error("thieu-tieu-de");
      var luc = bayGio(), hn = homNay();
      var v = {
        id: chuoi(o.id) || ("V-" + hn.slice(2, 4) + hn.slice(5, 7) + "-" + String(state.viec.length + 1).padStart(3, "0")),
        dichVu: dv.id, doiTacId: dt.id, tieuDe: chuoi(o.tieuDe), trangThai: "moi",
        nguoiPhuTrachId: o.nguoiPhuTrachId || null, tomTat: chuoi(o.tomTat) || "Việc mới tạo, chưa có tóm tắt.",
        buocTiep: chuoi(o.buocTiep) ? { viec: chuoi(o.buocTiep), aiLam: "haustek", hanNgay: o.hanBuocTiep || hanLamViec(hn, dv.camKetPhanHoi) } : null,
        canDoiTac: null, moLuc: luc, hanPhanHoi: hanLamViec(hn, dv.camKetPhanHoi),
        hanGiao: chuoi(o.hanGiao) || null, moc: [], chiTiet: o.chiTiet || { moTa: chuoi(o.moTa), mocThoiGian: "", khoangNganSach: "" },
        baoGia: null, banPhatHanhId: o.banPhatHanhId || null, hienChoDoiTac: o.hienChoDoiTac !== false,
        capNhatLuc: luc, xongLuc: null
      };
      state.viec.push(v);
      CHI_MUC = null;
      themDong({ doiTacId: dt.id, viecId: v.id, loai: "trang-thai", tieuDe: "Mở việc " + v.tieuDe, boi: { kieu: "nhanSu", id: toi().id, ten: toi().ten }, hienChoDoiTac: true });
      return v;
    },
    nhan: function (id, nhanSuId) {
      var v = viecCua(id); if (!v) throw new Error("khong-thay-viec");
      var ns = nsCua(nhanSuId || toi().id); if (!ns) throw new Error("khong-thay-nhan-su");
      v.nguoiPhuTrachId = ns.id;
      if (v.trangThai === "moi") v.trangThai = "dang-lam";
      v.capNhatLuc = bayGio(); CHI_MUC = null;
      themDong({ doiTacId: v.doiTacId, viecId: v.id, loai: "trang-thai", tieuDe: ns.ten + " nhận việc", boi: { kieu: "nhanSu", id: ns.id, ten: ns.ten }, hienChoDoiTac: false });
      return v;
    },
    doiTrangThai: function (id, tt, ghiChu) {
      var v = viecCua(id); if (!v) throw new Error("khong-thay-viec");
      if (!TRANG_THAI_VIEC.some(function (x) { return x.id === tt; })) throw new Error("trang-thai-khong-hop-le");
      var cu = v.trangThai;
      v.trangThai = tt; v.capNhatLuc = bayGio();
      if (tt === "xong") { v.xongLuc = bayGio(); v.buocTiep = null; v.canDoiTac = null; }
      else if (cu === "xong") v.xongLuc = null;
      CHI_MUC = null;
      var ten = (TRANG_THAI_VIEC.filter(function (x) { return x.id === tt; })[0] || {}).vi;
      themDong({ doiTacId: v.doiTacId, viecId: v.id, loai: "trang-thai",
        tieuDe: tt === "xong" ? "Đã xong: " + v.tieuDe : "Chuyển sang " + ten + ": " + v.tieuDe,
        noiDung: chuoi(ghiChu) || null, boi: { kieu: "nhanSu", id: toi().id, ten: toi().ten }, hienChoDoiTac: true });
      return v;
    },
    datBuocTiep: function (id, o) {
      var v = viecCua(id); if (!v) throw new Error("khong-thay-viec");
      if (!chuoi(o.viec)) { v.buocTiep = null; }
      else v.buocTiep = { viec: chuoi(o.viec), aiLam: o.aiLam === "doi-tac" ? "doi-tac" : "haustek", hanNgay: o.hanNgay || hanLamViec(homNay(), 2) };
      if (o.aiLam === "doi-tac") { v.trangThai = "cho-doi-tac"; v.canDoiTac = { viec: chuoi(o.viec), han: o.hanNgay || hanLamViec(homNay(), 3) }; }
      else if (v.trangThai === "cho-doi-tac") { v.trangThai = "dang-lam"; v.canDoiTac = null; }
      v.capNhatLuc = bayGio(); CHI_MUC = null; doiState(); return v;
    },
    xongMoc: function (id, mocId) {
      var v = viecCua(id); if (!v) throw new Error("khong-thay-viec");
      var m = (v.moc || []).filter(function (x) { return x.id === mocId; })[0]; if (!m) throw new Error("khong-thay-moc");
      m.xongLuc = bayGio(); v.capNhatLuc = m.xongLuc; CHI_MUC = null;
      themDong({ doiTacId: v.doiTacId, viecId: v.id, loai: "moc", tieuDe: "Mốc " + m.ten + " đã xong", boi: { kieu: "nhanSu", id: toi().id, ten: toi().ten }, hienChoDoiTac: true });
      return v;
    },
    suaTomTat: function (id, chu) {
      var v = viecCua(id); if (!v) throw new Error("khong-thay-viec");
      v.tomTat = chuoi(chu); v.capNhatLuc = bayGio(); doiState(); return v;
    }
  },

  dong: {
    theoDoiTac: dongTheoDoiTac,
    /* Đúng những dòng đối tác nhìn thấy. Dùng để soi trước khi gửi. */
    choDoiTac: function (doiTacId, loc) {
      return dongTheoDoiTac(doiTacId, Object.assign({}, loc, { chiDoiTacThay: true }));
    },
    theoViec: function (viecId) { return (chiMuc().dongTheoViec[viecId] || []).slice(); },
    them: themDong,
    ghiLienLac: function (o) {
      var dt = dtCua(o.doiTacId); if (!dt) throw new Error("thieu-doi-tac");
      if (!chuoi(o.tomTat)) throw new Error("thieu-tom-tat");
      var me = toi();
      var kenhTen = { goi: "gọi điện", zalo: "nhắn Zalo", email: "gửi email", gap: "gặp trực tiếp" }[o.kenh] || "liên lạc";
      return themDong({ doiTacId: dt.id, viecId: o.viecId || null, loai: "lien-lac",
        tieuDe: me.ten.split(" ").pop() + " " + kenhTen + " · " + chuoi(o.tomTat),
        noiDung: null, kenh: o.kenh || "goi", ketQua: o.ketQua || "da-chot",
        boi: { kieu: "nhanSu", id: me.id, ten: me.ten }, hienChoDoiTac: false });
    },
    nhanChoDoiTac: function (o) {
      var dt = dtCua(o.doiTacId); if (!dt) throw new Error("thieu-doi-tac");
      if (!chuoi(o.noiDung)) throw new Error("thieu-noi-dung");
      var me = toi();
      return themDong({ doiTacId: dt.id, viecId: o.viecId || null, loai: "tin-nhan",
        tieuDe: "Haustek nhắn: " + chuoi(o.noiDung).split("\n")[0].slice(0, 90),
        noiDung: chuoi(o.noiDung), boi: { kieu: "nhanSu", id: me.id, ten: me.ten }, hienChoDoiTac: true });
    },
    ghiChuNoiBo: function (o) {
      var dt = dtCua(o.doiTacId); if (!dt) throw new Error("thieu-doi-tac");
      if (!chuoi(o.noiDung)) throw new Error("thieu-noi-dung");
      var me = toi();
      return themDong({ doiTacId: dt.id, viecId: o.viecId || null, loai: "ghi-chu", tieuDe: "Ghi chú nội bộ",
        noiDung: chuoi(o.noiDung), boi: { kieu: "nhanSu", id: me.id, ten: me.ten }, hienChoDoiTac: false });
    }
  },

  thongBao: {
    mau: function () { return state.caiDat.mauThongBao.slice(); },
    list: function (loc) {
      var ds = state.thongBao.slice().sort(function (a, b) { return a.guiLuc < b.guiLuc ? 1 : -1; });
      if (loc && loc.nguoiGuiId) ds = ds.filter(function (t) { return t.nguoiGuiId === loc.nguoiGuiId; });
      return ds.map(function (t) {
        var nhan = (t.guiToi.doiTacIds || []);
        var doc = state.luotDoc.filter(function (l) { return l.thongBaoId === t.id; });
        var ns = nsCua(t.nguoiGuiId);
        /* Trả về TÊN đối tác chưa đọc, không phải mã. "DT-0007 chưa xem"
           không giúp ai; "Cửa Bắc Tapes chưa xem" thì gọi được ngay. */
        var chua = nhan.filter(function (id) { return !doc.some(function (l) { return l.doiTacId === id; }); })
          .map(function (id) { var d = dtCua(id); return { id: id, ten: d ? d.ten : id }; });
        return Object.assign({}, t, { soNhan: nhan.length, soDoc: doc.length, nguoiGuiTen: ns ? ns.ten : "", chuaDoc: chua });
      });
    },
    /* Xem trước bắt buộc khi gửi từ hai đối tác trở lên. */
    nguoiNhan: function (guiToi) {
      var ds = state.doiTac.filter(function (d) { return d.trangThai === "dang-hop-tac"; });
      if (guiToi.kieu === "chon") ds = ds.filter(function (d) { return (guiToi.doiTacIds || []).indexOf(d.id) >= 0; });
      else if (guiToi.kieu === "theo-dich-vu") ds = ds.filter(function (d) { return (guiToi.dichVu || []).some(function (x) { return d.dichVu.indexOf(x) >= 0; }); });
      var nd = state.nguoiDung.filter(function (u) { return ds.some(function (d) { return d.id === u.doiTacId; }) && u.trangThai !== "khoa"; });
      return { doiTac: ds, soDoiTac: ds.length, soNguoiDung: nd.length };
    },
    gui: function (o) {
      if (!chuoi(o.tieuDe)) throw new Error("thieu-tieu-de");
      if (!chuoi(o.noiDung)) throw new Error("thieu-noi-dung");
      var nn = admin.thongBao.nguoiNhan(o.guiToi || { kieu: "tat-ca" });
      if (!nn.soDoiTac) throw new Error("khong-co-nguoi-nhan");
      var me = toi(), luc = bayGio();
      var t = {
        id: "TB-" + String(state.thongBao.length + 1).padStart(4, "0"), tieuDe: chuoi(o.tieuDe), noiDung: chuoi(o.noiDung),
        viecId: o.viecId || null, guiToi: { kieu: (o.guiToi || {}).kieu || "tat-ca", dichVu: (o.guiToi || {}).dichVu || null, doiTacIds: nn.doiTac.map(function (d) { return d.id; }) },
        noiBo: !!o.noiBo, nguoiGuiId: me.id, nhap: false, guiLuc: luc, tepId: null, hanTraLoi: o.hanTraLoi || null
      };
      state.thongBao.push(t);
      if (!t.noiBo) nn.doiTac.forEach(function (d) {
        themDong({ doiTacId: d.id, viecId: t.viecId, loai: "thong-bao", tieuDe: t.tieuDe, noiDung: t.noiDung,
          thongBaoId: t.id, boi: { kieu: "nhanSu", id: me.id, ten: me.ten }, hienChoDoiTac: true });
      });
      doiState();
      return { id: t.id, soDoiTac: nn.soDoiTac, soNguoiDung: nn.soNguoiDung, luc: luc };
    }
  },

  bangKe: {
    ky: function () {
      var ra = [];
      for (var q = 5; q >= 0; q--) { var d = new Date(ASOF.getFullYear(), ASOF.getMonth() - q * 3, 1); ra.push(d.getFullYear() + "-Q" + (Math.floor(d.getMonth() / 3) + 1)); }
      return ra;
    },
    list: function (loc) {
      var ds = state.bangKe.slice();
      if (loc && loc.ky) ds = ds.filter(function (b) { return b.ky === loc.ky; });
      if (loc && loc.doiTacId) ds = ds.filter(function (b) { return b.doiTacId === loc.doiTacId; });
      return ds.map(function (b) { var dt = dtCua(b.doiTacId); return Object.assign({}, b, { doiTacTen: dt ? dt.ten : "" }); })
        .sort(function (a, b2) { return a.ky < b2.ky ? 1 : a.doiTacTen.localeCompare(b2.doiTacTen, "vi"); });
    },
    thieu: function (ky) {
      var co = {}; state.bangKe.forEach(function (b) { if (b.ky === ky) co[b.doiTacId] = true; });
      return state.doiTac.filter(function (d) { return d.trangThai === "dang-hop-tac" && d.dichVu.some(function (x) { return dvCua(x).coTien; }) && !co[d.id]; });
    },
    them: function (o) {
      var dt = dtCua(o.doiTacId); if (!dt) throw new Error("thieu-doi-tac");
      var soTien = Math.round((+o.soTien || 0) * 100) / 100;
      if (!(soTien > 0)) throw new Error("so-tien-khong-hop-le");
      if (!chuoi(o.ky)) throw new Error("thieu-ky");
      var b = {
        id: "BK-" + String(state.bangKe.length + 1).padStart(4, "0"), doiTacId: dt.id, ky: chuoi(o.ky),
        nguon: chuoi(o.nguon) || "OneRPM", soTien: soTien, tienTe: o.tienTe === "VND" ? "VND" : "USD",
        khauTruTamUng: Math.max(0, +o.khauTruTamUng || 0), ghiChuKhauTru: chuoi(o.ghiChuKhauTru), tepId: null,
        ngayChuyen: chuoi(o.ngayChuyen) || null,
        taiKhoanNhanMask: dt.nganHang ? dt.nganHang.nganHang + " " + dt.nganHang.soTaiKhoanMask : "",
        trangThai: chuoi(o.ngayChuyen) ? "da-chuyen" : "da-tai-len", nguoiTaiLenId: toi().id, taiLenLuc: bayGio()
      };
      state.bangKe.push(b);
      themDong({ doiTacId: dt.id, loai: "bang-ke", ky: b.ky,
        tieuDe: "Bảng kê kỳ " + b.ky + " · " + tien0(b.soTien) + (b.ngayChuyen ? " · đã chuyển " + ngayVi(b.ngayChuyen) : " · chờ chuyển"),
        boi: { kieu: "nhanSu", id: toi().id, ten: toi().ten }, hienChoDoiTac: true });
      return b;
    },
    danhDauDaChuyen: function (id, ngayChuyen) {
      var b = state.bangKe.filter(function (x) { return x.id === id; })[0]; if (!b) throw new Error("khong-thay-bang-ke");
      b.ngayChuyen = chuoi(ngayChuyen) || homNay(); b.trangThai = "da-chuyen";
      themDong({ doiTacId: b.doiTacId, loai: "bang-ke", ky: b.ky, tieuDe: "Đã chuyển khoản kỳ " + b.ky + " · " + tien0(b.soTien),
        boi: { kieu: "nhanSu", id: toi().id, ten: toi().ten }, hienChoDoiTac: true });
      return b;
    }
  },

  banPhatHanh: {
    list: function (loc) {
      var ds = state.banPhatHanh.slice();
      if (loc && loc.doiTacId) ds = ds.filter(function (b) { return b.doiTacId === loc.doiTacId; });
      if (loc && loc.dangXuLy) ds = ds.filter(function (b) { return b.trangThai !== "da-phat-hanh"; });
      if (loc && loc.q) { var q = String(loc.q).toLowerCase(); ds = ds.filter(function (b) { return (b.ten + " " + b.id).toLowerCase().indexOf(q) >= 0; }); }
      return ds.map(function (b) { var dt = dtCua(b.doiTacId); return Object.assign({}, b, { doiTacTen: dt ? dt.ten : "", ngayImLang: cachNgay(b.nenTangCapNhatLuc) }); })
        .sort(function (a, b2) { return a.ngayPhatHanh < b2.ngayPhatHanh ? 1 : -1; });
    },
    get: bphCua,
    moc: banPhatHanhMoc,
    datNenTang: function (id, tt, ghiChu, duongDan) {
      var b = bphCua(id); if (!b) throw new Error("khong-thay-ban-phat-hanh");
      if (!NEN_TANG_PH.some(function (x) { return x.id === tt; })) throw new Error("trang-thai-khong-hop-le");
      b.nenTang = tt; b.nenTangCapNhatLuc = bayGio(); b.nenTangGhiChu = chuoi(ghiChu);
      if (duongDan) b.duongDan = Object.assign({}, b.duongDan, duongDan);
      if (tt === "da-len") b.trangThai = "da-phat-hanh";
      var ten = (NEN_TANG_PH.filter(function (x) { return x.id === tt; })[0] || {}).vi;
      themDong({ doiTacId: b.doiTacId, viecId: b.viecId, loai: "trang-thai", tieuDe: b.ten + " · " + ten,
        noiDung: chuoi(ghiChu) || null, boi: { kieu: "nhanSu", id: toi().id, ten: toi().ten }, hienChoDoiTac: true });
      return b;
    },
    /* Nhận hồ sơ từ trang metadata công khai: giữ nguyên mã hồ sơ. */
    /* Nhận đúng cái biểu mẫu công khai metadata.html xuất ra:
         { submission_id, release: {...}, tracks: [...], submitter: {...} }
       với khoá tiếng Việt không dấu (ten_ban_phat_hanh, ngay_phat_hanh...).

       MÃ HỒ SƠ GIỮ NGUYÊN làm id của cả việc lẫn bản phát hành. Portal
       KHÔNG sinh mã. Đối tác đã được đưa một mã lúc gửi biểu mẫu; sinh mã
       thứ hai ở đây là biến một không gian mã thành hai, và từ đó mọi câu
       "bạn cho mình xin mã hồ sơ" đều có hai câu trả lời đúng. */
    nhanHoSo: function (payload, doiTacId) {
      var dt = dtCua(doiTacId); if (!dt) throw new Error("thieu-doi-tac");
      if (!payload || typeof payload !== "object") throw new Error("ho-so-khong-doc-duoc");
      var r = payload.release || payload;
      var ma = chuoi(payload.submission_id) || chuoi(payload.id) || chuoi(r.submission_id);
      if (!ma) throw new Error("thieu-ma-ho-so");
      if (bphCua(ma)) throw new Error("ma-da-co");
      var ten = chuoi(r.ten_ban_phat_hanh) || chuoi(r.ten) || chuoi(r.title);
      if (!ten) throw new Error("thieu-ten");
      var loaiVi = chuoi(r.loai_phat_hanh).toLowerCase();
      var loai = loaiVi.indexOf("album") >= 0 ? "album" : loaiVi.indexOf("ep") >= 0 ? "ep" : "single";
      var tr = (payload.tracks || payload.track || []).map(function (t, i) {
        return {
          thuTu: t.so_thu_tu || i + 1,
          ten: chuoi(t.ten_track) || chuoi(t.ten) || ten,
          isrc: chuoi(t.isrc),
          featuring: chuoi(t.khach_moi) || chuoi(t.featuring),
          nguoiSangTac: (t.nguoi_sang_tac || t.nguoiSangTac || []).map(function (w) {
            return { ten: chuoi(w.ho_ten) || chuoi(w.ten), vaiTro: chuoi(w.vai_tro), tyLe: +w.ti_le || 0 };
          })
        };
      });
      if (!tr.length) tr = [{ thuTu: 1, ten: ten, isrc: "", featuring: "", nguoiSangTac: [] }];
      var b = {
        id: ma, doiTacId: dt.id, viecId: null, ten: ten,
        phienBan: chuoi(r.phien_ban) || chuoi(r.phienBan), loai: loai,
        ngheSi: chuoi(r.nghe_si_chinh), nhan: chuoi(r.nhan_phat_hanh),
        ngayPhatHanh: chuoi(r.ngay_phat_hanh) || chuoi(r.ngayPhatHanh) || themNgay(homNay(), 21),
        upc: chuoi(r.upc), anhBia: chuoi(r.link_anh_bia) || chuoi(r.anhBia),
        theLoai: chuoi(r.the_loai_chinh), pLine: chuoi(r.p_line), cLine: chuoi(r.c_line),
        trangThai: "da-gui", conThieu: [],
        track: tr,
        duongDan: { spotify: "", apple: "", youtube: "" },
        nenTang: "dang-xu-ly", nenTangCapNhatLuc: bayGio(), nenTangGhiChu: "",
        nguoiGui: payload.submitter ? chuoi(payload.submitter.ho_ten) || chuoi(payload.submitter.s_name) : ""
      };
      /* Thiếu gì thì nói ngay, đừng để tới lúc đẩy lên nền tảng mới biết. */
      if (!b.upc) b.conThieu.push("Mã UPC");
      if (!b.anhBia) b.conThieu.push("Ảnh bìa");
      if (!tr.filter(function (t) { return t.isrc; }).length) b.conThieu.push("Mã ISRC cho track");
      state.banPhatHanh.push(b);
      var v = admin.viec.them({ doiTacId: dt.id, dichVu: "phat-hanh", tieuDe: "Phát hành " + ten,
        id: ma, banPhatHanhId: ma,
        tomTat: "Hồ sơ nhận từ biểu mẫu công khai, mã " + ma + ". Giữ nguyên mã này ở mọi nơi." });
      b.viecId = v.id; CHI_MUC = null; doiState();
      return b;
    }
  },

  tep: {
    list: function (doiTacId) { return state.tep.filter(function (t) { return !doiTacId || t.doiTacId === doiTacId; }).sort(function (a, b) { return a.taiLenLuc < b.taiLenLuc ? 1 : -1; }); },
    them: function (o) {
      var dt = dtCua(o.doiTacId); if (!dt) throw new Error("thieu-doi-tac");
      if (!chuoi(o.ten)) throw new Error("thieu-ten");
      var t = { id: "T-" + String(state.tep.length + 1).padStart(4, "0"), doiTacId: dt.id, viecId: o.viecId || null,
        ten: chuoi(o.ten), loai: o.loai || "ban-giao", url: chuoi(o.url) || "#", co: chuoi(o.co), phienBan: +o.phienBan || 1,
        taiLenBoiId: toi().id, taiLenLuc: bayGio(), doiTacDaXemLuc: null, doiTacDaDuyetLuc: null };
      state.tep.push(t);
      themDong({ doiTacId: dt.id, viecId: t.viecId, loai: "tep", tieuDe: "Gửi tệp " + t.ten + " · phiên bản " + t.phienBan,
        tepId: t.id, boi: { kieu: "nhanSu", id: toi().id, ten: toi().ten }, hienChoDoiTac: o.hienChoDoiTac !== false });
      return t;
    }
  },

  caiDat: {
    get: function () { return state.caiDat; },
    datCamKet: function (dichVuId, soNgay) {
      if (toi().vai !== "quan-ly") throw new Error("chi-quan-ly");
      var dv = DICH_VU.filter(function (d) { return d.id === dichVuId; })[0]; if (!dv) throw new Error("khong-thay-dich-vu");
      var n = Math.max(1, Math.min(10, soNgay | 0));
      dv.camKetPhanHoi = n;
      state.caiDat.camKet = state.caiDat.camKet || {}; state.caiDat.camKet[dichVuId] = n;
      nhatKy("dich-vu.cam-ket", dichVuId, "còn " + n + " ngày làm việc");
      doiState(); return dv;
    },
    /* Câu này là LỜI HỨA công khai, và nó phải ra từ đúng MỘT chỗ: trang
       Việc, biên nhận ở cổng đối tác, và ô sửa ở Quản trị đều đọc hàm này.
       Viết lại câu ở ba nơi thì sớm muộn ba nơi hứa ba kiểu.

       Mỗi mảng dịch vụ nhận một thứ khác nhau, nên câu mở đầu khác nhau:
       phát hành nhận "hồ sơ", sự kiện nhận "yêu cầu đặt lịch". Dùng chung
       một câu "sau khi nhận hồ sơ" cho cả mười mảng thì tám mảng đọc sai. */
    cauCongKhai: function (dichVuId) {
      var dv = dvCua(dichVuId);
      var nhan = {
        "phat-hanh": "Sau khi bạn gửi hồ sơ phát hành",
        "label": "Sau khi bạn gửi yêu cầu về hợp tác label",
        "su-kien": "Sau khi bạn gửi yêu cầu tổ chức sự kiện",
        "san-xuat-nhac": "Sau khi bạn gửi yêu cầu sản xuất",
        "booking": "Sau khi bạn gửi yêu cầu booking",
        "chien-luoc": "Sau khi bạn gửi đề bài marketing",
        "digital": "Sau khi bạn gửi yêu cầu chạy chiến dịch",
        "mang-xa-hoi": "Sau khi bạn gửi yêu cầu về kênh mạng xã hội",
        "content": "Sau khi bạn gửi đề bài nội dung",
        "media": "Sau khi bạn gửi yêu cầu sản xuất media",
        "ho-tro": "Sau khi bạn gửi câu hỏi"
      }[dichVuId] || "Sau khi bạn gửi yêu cầu";
      return nhan + ", Haustek trả lời trong " + dv.camKetPhanHoi +
        " ngày làm việc và gọi hoặc nhắn cho bạn nếu cần trao đổi thêm.";
    }
  },

  nhatKy: function (n) { return state.nhatKy.slice(0, n || 100).map(function (x) { var ns = nsCua(x.boiId); return Object.assign({}, x, { boiTen: ns ? ns.ten : x.boiId }); }); },

  /* ---- tổng hợp cho trang Hôm nay ---- */
  homNayCua: function (nhanSuId) {
    var me = nsCua(nhanSuId) || toi();
    return {
      ngay: homNay(), thu: thuTrongTuan(homNay()),
      canToi: viecCanToi(me.id),
      dangChay: state.viec.filter(function (v) { return v.nguoiPhuTrachId === me.id && (v.trangThai === "dang-lam" || v.trangThai === "moi"); }).map(lamDayViec)
        .sort(function (a, b) { var x = (a.buocTiep && a.buocTiep.hanNgay) || "9999", y = (b.buocTiep && b.buocTiep.hanNgay) || "9999"; return x < y ? -1 : 1; }),
      choBenNgoai: state.viec.filter(function (v) { return v.nguoiPhuTrachId === me.id && v.trangThai === "cho-doi-tac"; }).map(lamDayViec)
        .sort(function (a, b) { return (a.capNhatLuc || "") < (b.capNhatLuc || "") ? -1 : 1; }),
      imLang: imLangQua(), sapToi: sapToi(14),
      daXongHomNay: daXongHomNay(null), daXongTuanNay: daXongTuanNay(null),
      cuaToiHomNay: daXongHomNay(me.id),
      deme: admin.viec.dem()
    };
  },
  moiVeTuDoiTac: function (tuLuc) {
    return state.dong.filter(function (d) {
      return d.boi && d.boi.kieu === "nguoiDung" && (!tuLuc || d.luc > tuLuc);
    }).slice(0, 20).map(function (d) {
      var dt = dtCua(d.doiTacId), v = d.viecId ? viecCua(d.viecId) : null;
      return { dong: d, doiTacTen: dt ? dt.ten : "", viecId: d.viecId, viecTieuDe: v ? v.tieuDe : "", chuaGan: v ? !v.nguoiPhuTrachId : false };
    });
  },
  timKiem: function (q, gioiHan) {
    q = String(q || "").trim().toLowerCase();
    if (q.length < 2) return { doiTac: [], viec: [], banPhatHanh: [] };
    var n = gioiHan || 6;
    return {
      doiTac: state.doiTac.filter(function (d) { return d.ten.toLowerCase().indexOf(q) >= 0 || d.id.toLowerCase().indexOf(q) >= 0; }).slice(0, n),
      viec: state.viec.filter(function (v) { return (v.tieuDe + " " + v.id).toLowerCase().indexOf(q) >= 0; }).slice(0, n).map(lamDayViec),
      banPhatHanh: state.banPhatHanh.filter(function (b) { return (b.ten + " " + b.id).toLowerCase().indexOf(q) >= 0; }).slice(0, n)
    };
  },
  /* Chuông nội bộ: việc cần tôi, không phải mọi biến động của hệ thống. */
  chuong: function () {
    var ds = viecCanToi(toi().id).slice(0, 8).map(function (r) {
      return { id: r.viecId, title: r.cau.replace(/<[^>]+>/g, ""), di: "viec", doiTacId: r.doiTacId, tier: r.bac <= 1 ? "warn" : "info" };
    });
    return { items: ds, unread: ds.length };
  },

  /* bản mẫu: gieo lại từ đầu */
  gieoLai: function () { state = gieo(); CHI_MUC = null; kho.ghi(); return true; },
  kho: kho
};

/* =====================================================================
   10. CỔNG ĐỐI TÁC — chỉ thấy phần của chính mình, chỉ thấy dòng công khai
   ===================================================================== */
function batBuocDoiTac(doiTacId) {
  var dt = dtCua(doiTacId);
  if (!dt) throw new Error("khong-co-quyen");
  return dt;
}
var api = {
  phien: function (doiTacId, nguoiDungId) {
    var dt = batBuocDoiTac(doiTacId);
    var nd = nguoiDungId ? ndCua(nguoiDungId) : state.nguoiDung.filter(function (u) { return u.doiTacId === doiTacId; })[0];
    var ns = nsCua(dt.nguoiPhuTrachId);
    return {
      doiTacId: dt.id, ten: dt.ten, loai: dt.loai, dichVu: dt.dichVu.slice(),
      nguoiDungId: nd ? nd.id : null, nguoiDungTen: nd ? nd.ten : "",
      nguoiPhuTrach: ns ? { ten: ns.ten, email: ns.email, dienThoai: ns.dienThoai, chucDanh: ns.chucDanh } : null,
      coNhac: dt.dichVu.some(function (x) { return dvCua(x).coNhac; }),
      coTien: dt.dichVu.some(function (x) { return dvCua(x).coTien; }),
      tuDangNhapNenTang: !!(dt.maNgoai && dt.maNgoai.doiTacTuDangNhap)
    };
  },
  trangChu: function (doiTacId) {
    var dt = batBuocDoiTac(doiTacId);
    var ix = chiMuc(), vt = ix.viecTheoDoiTac[doiTacId] || { dangMo: [], daXong: [] };
    var bk = state.bangKe.filter(function (b) { return b.doiTacId === doiTacId; }).sort(function (a, b) { return a.ky < b.ky ? 1 : -1; })[0] || null;
    var bph = (ix.banPhatHanhTheoDoiTac[doiTacId] || []).filter(function (b) { return b.nenTang !== "da-len"; });
    return {
      canBan: viecCanDoiTac(doiTacId),
      dangLam: vt.dangMo.map(viecCua).filter(function (v) { return v && v.hienChoDoiTac && v.trangThai !== "cho-doi-tac"; }).map(function (v) {
        var ns = nsCua(v.nguoiPhuTrachId), dv = dvCua(v.dichVu);
        return { id: v.id, tieuDe: v.tieuDe, dichVu: v.dichVu, dichVuTen: dv.vi, trangThai: v.trangThai,
          nguoiPhuTrachTen: ns ? ns.ten : null, buocTiep: v.buocTiep ? v.buocTiep.viec : null,
          camKet: camKetChoDoiTac(v),
          capNhatLuc: v.capNhatLuc };
      }),
      ganDay: dongTheoDoiTac(doiTacId, { chiDoiTacThay: true }).slice(0, 6),
      bangKeGanNhat: bk, banPhatHanhDangXuLy: bph.length, soViecXong: vt.daXong.length,
      hopDongDenNgay: dt.hopDong.denNgay
    };
  },
  viec: function (doiTacId, loc) {
    batBuocDoiTac(doiTacId);
    var ds = state.viec.filter(function (v) { return v.doiTacId === doiTacId && v.hienChoDoiTac; });
    if (loc && loc.trangThai === "dang-mo") ds = ds.filter(function (v) { return v.trangThai !== "xong" && v.trangThai !== "huy"; });
    if (loc && loc.trangThai === "xong") ds = ds.filter(function (v) { return v.trangThai === "xong"; });
    return ds.map(function (v) {
      var ns = nsCua(v.nguoiPhuTrachId), dv = dvCua(v.dichVu);
      return {
        id: v.id, tieuDe: v.tieuDe, dichVu: v.dichVu, dichVuTen: dv.vi, trangThai: v.trangThai,
        nguoiPhuTrachTen: ns ? ns.ten : null, tomTat: v.tomTat,
        canBan: v.canDoiTac, moc: (v.moc || []).map(function (m) { return { ten: m.ten, xong: !!m.xongLuc }; }),
        camKet: camKetChoDoiTac(v),
        hanGiao: v.hanGiao, capNhatLuc: v.capNhatLuc, xongLuc: v.xongLuc,
        dong: (chiMuc().dongTheoViec[v.id] || []).filter(function (d) { return d.hienChoDoiTac; })
      };
    }).sort(function (a, b) { return (a.capNhatLuc || "") < (b.capNhatLuc || "") ? 1 : -1; });
  },
  nhac: function (doiTacId) {
    batBuocDoiTac(doiTacId);
    return (chiMuc().banPhatHanhTheoDoiTac[doiTacId] || []).map(function (b) {
      var ten = (NEN_TANG_PH.filter(function (x) { return x.id === b.nenTang; })[0] || {}).vi;
      return {
        id: b.id, ten: b.ten, loai: b.loai, ngayPhatHanh: b.ngayPhatHanh, upc: b.upc,
        trangThai: b.trangThai, nenTang: b.nenTang, nenTangTen: ten,
        nenTangCau: b.nenTang === "da-len" ? "Đã lên nền tảng" : "Haustek đang xử lý với nền tảng · cập nhật " + ngayGonVi(b.nenTangCapNhatLuc),
        duongDan: b.duongDan, soTrack: b.track.length,
        track: b.track.map(function (t) { return { thuTu: t.thuTu, ten: t.ten, isrc: t.isrc, featuring: t.featuring }; }),
        /* chỉ hiện mục đối tác tự bổ sung được */
        canBoSung: (b.conThieu || []).filter(function (c) { return c.doiTacTuBoSungDuoc; }).map(function (c) { return c.muc; })
      };
    });
  },
  thanhToan: function (doiTacId) {
    var dt = batBuocDoiTac(doiTacId);
    var bk = state.bangKe.filter(function (b) { return b.doiTacId === doiTacId; }).sort(function (a, b) { return a.ky < b.ky ? 1 : -1; });
    var tu = state.tamUng.filter(function (t) { return t.doiTacId === doiTacId; });
    var kyTiep = null;
    if (bk.length) {
      var p = bk[0].ky.split("-Q");
      var q2 = +p[1] + 1, y2 = +p[0]; if (q2 > 4) { q2 = 1; y2++; }
      kyTiep = y2 + "-Q" + q2;
    }
    return {
      bangKe: bk.map(function (b) {
        return { id: b.id, ky: b.ky, soTien: b.soTien, tienTe: b.tienTe, nguon: b.nguon,
          ngayChuyen: b.ngayChuyen, taiKhoanNhanMask: b.taiKhoanNhanMask, trangThai: b.trangThai,
          khauTruTamUng: b.khauTruTamUng, ghiChuKhauTru: b.ghiChuKhauTru };
      }),
      kyTiep: kyTiep, nhipBaoCao: dt.hopDong.nhipBaoCao,
      nganHang: dt.nganHang, tyLeDoiTacHuong: dt.hopDong.tyLeDoiTacHuong,
      tamUng: tu.filter(function (t) { return t.daHoan < t.soTien; }).map(function (t) {
        return { id: t.id, soTien: t.soTien, daHoan: t.daHoan, phanTram: Math.round(t.daHoan / t.soTien * 100), ghiChu: t.ghiChu };
      })
    };
  },
  traoDoi: function (doiTacId, loc) {
    batBuocDoiTac(doiTacId);
    var ds = dongTheoDoiTac(doiTacId, { chiDoiTacThay: true });
    if (loc && loc.loai && loc.loai !== "tat-ca") ds = ds.filter(function (d) { return d.loai === loc.loai; });
    return ds;
  },
  taiLieu: function (doiTacId) {
    batBuocDoiTac(doiTacId);
    return state.tep.filter(function (t) { return t.doiTacId === doiTacId && t.loai !== "khac"; })
      .map(function (t) { var ns = nsCua(t.taiLenBoiId); return { id: t.id, ten: t.ten, loai: t.loai, co: t.co, phienBan: t.phienBan, luc: t.taiLenLuc, boiTen: ns ? ns.ten : "" }; })
      .sort(function (a, b) { return a.luc < b.luc ? 1 : -1; });
  },
  taiKhoan: function (doiTacId) {
    var dt = batBuocDoiTac(doiTacId), ns = nsCua(dt.nguoiPhuTrachId);
    return {
      ten: dt.ten, loai: dt.loai, maDoiTac: dt.id,
      nguoiPhuTrach: ns ? { ten: ns.ten, chucDanh: ns.chucDanh, email: ns.email, dienThoai: ns.dienThoai } : null,
      lienHe: dt.lienHe, hopDong: { tuNgay: dt.hopDong.tuNgay, denNgay: dt.hopDong.denNgay, tyLeDoiTacHuong: dt.hopDong.tyLeDoiTacHuong, nhipBaoCao: dt.hopDong.nhipBaoCao },
      nganHang: dt.nganHang, dichVu: dt.dichVu.map(function (x) { return { id: x, vi: dvCua(x).vi }; }),
      nguoiDung: state.nguoiDung.filter(function (u) { return u.doiTacId === doiTacId; }).map(function (u) { return { ten: u.ten, email: u.email, trangThai: u.trangThai }; }),
      nghesiThuocLabel: state.doiTac.filter(function (d) { return d.labelMeId === doiTacId; }).map(function (d) { return { id: d.id, ten: d.ten }; })
    };
  },
  /* Đối tác hỏi Haustek: tạo một việc loại ho-tro, chưa gán ai. */
  guiYeuCau: function (doiTacId, o) {
    var dt = batBuocDoiTac(doiTacId);
    if (!chuoi(o && o.noiDung)) throw new Error("thieu-noi-dung");
    var dichVu = DICH_VU.some(function (d) { return d.id === o.dichVu; }) ? o.dichVu : "ho-tro";
    var dv = dvCua(dichVu), hn = homNay(), luc = bayGio();
    var nd = o.nguoiDungId ? ndCua(o.nguoiDungId) : state.nguoiDung.filter(function (u) { return u.doiTacId === doiTacId; })[0];
    var v = {
      id: "V-" + hn.slice(2, 4) + hn.slice(5, 7) + "-" + String(state.viec.length + 1).padStart(3, "0"),
      dichVu: dichVu, doiTacId: dt.id, tieuDe: chuoi(o.tieuDe) || chuoi(o.noiDung).split("\n")[0].slice(0, 70),
      trangThai: "moi", nguoiPhuTrachId: null, tomTat: "Yêu cầu do đối tác gửi từ cổng.",
      buocTiep: null, canDoiTac: null, moLuc: luc, hanPhanHoi: hanLamViec(hn, dv.camKetPhanHoi),
      hanGiao: null, moc: [], chiTiet: { moTa: chuoi(o.noiDung), mocThoiGian: "", khoangNganSach: "" },
      baoGia: null, banPhatHanhId: chuoi(o.banPhatHanhId) || null, hienChoDoiTac: true, capNhatLuc: luc, xongLuc: null
    };
    state.viec.push(v); CHI_MUC = null;
    themDong({ doiTacId: dt.id, viecId: v.id, loai: "tin-nhan", tieuDe: v.tieuDe, noiDung: chuoi(o.noiDung),
      canTraLoi: true, boi: { kieu: "nguoiDung", id: nd ? nd.id : "", ten: nd ? nd.ten : dt.ten }, hienChoDoiTac: true });
    return { id: v.id, hanPhanHoi: v.hanPhanHoi,
      bienNhan: "Cảm ơn bạn đã gửi. Haustek đã nhận lúc " + gioVi(luc) + ". Haustek trả lời chậm nhất ngày " + ngayVi(v.hanPhanHoi) + "." };
  },
  traLoi: function (doiTacId, viecId, noiDung, nguoiDungId) {
    var dt = batBuocDoiTac(doiTacId);
    var v = viecCua(viecId);
    if (!v || v.doiTacId !== doiTacId) throw new Error("khong-co-quyen");
    if (!chuoi(noiDung)) throw new Error("thieu-noi-dung");
    var nd = nguoiDungId ? ndCua(nguoiDungId) : state.nguoiDung.filter(function (u) { return u.doiTacId === doiTacId; })[0];
    if (v.trangThai === "cho-doi-tac") { v.trangThai = "dang-lam"; v.canDoiTac = null; CHI_MUC = null; }
    return themDong({ doiTacId: dt.id, viecId: viecId, loai: "tin-nhan", tieuDe: chuoi(noiDung).split("\n")[0].slice(0, 90),
      noiDung: chuoi(noiDung), canTraLoi: true, boi: { kieu: "nguoiDung", id: nd ? nd.id : "", ten: nd ? nd.ten : dt.ten }, hienChoDoiTac: true });
  },
  danhDauDaDoc: function (doiTacId, thongBaoId, nguoiDungId) {
    batBuocDoiTac(doiTacId);
    var nd = nguoiDungId ? ndCua(nguoiDungId) : state.nguoiDung.filter(function (u) { return u.doiTacId === doiTacId; })[0];
    if (!nd) return false;
    if (state.luotDoc.some(function (l) { return l.thongBaoId === thongBaoId && l.nguoiDungId === nd.id; })) return true;
    var luc = bayGio();
    state.luotDoc.push({ thongBaoId: thongBaoId, nguoiDungId: nd.id, doiTacId: doiTacId, luc: luc });
    state.dong.forEach(function (d) { if (d.thongBaoId === thongBaoId && d.doiTacId === doiTacId) d.daXem = { luc: luc, nguoiDungId: nd.id, ten: nd.ten }; });
    doiState(); return true;
  },
  chuaDoc: function (doiTacId, nguoiDungId) {
    batBuocDoiTac(doiTacId);
    var nd = nguoiDungId ? ndCua(nguoiDungId) : state.nguoiDung.filter(function (u) { return u.doiTacId === doiTacId; })[0];
    return dongTheoDoiTac(doiTacId, { chiDoiTacThay: true }).filter(function (d) {
      return d.loai === "thong-bao" && nd && !state.luotDoc.some(function (l) { return l.thongBaoId === d.thongBaoId && l.nguoiDungId === nd.id; });
    });
  },
  /* Cổng đối tác không có mặt tiền nội bộ, nên nó cần đúng những hàm hiển
     thị này. Không đưa thì sáu trang tự viết lại sáu lần cách viết ngày,
     và sớm muộn có trang viết khác. */
  ngayVi: ngayVi, ngayGonVi: ngayGonVi, gioVi: gioVi, thuTrongTuan: thuTrongTuan,
  cachNgay: cachNgay, homNay: homNay, tien0: tien0,
  camKet: function (dichVuId) { return admin.caiDat.cauCongKhai(dichVuId); },
  /* CHỈ DÙNG CHO BẢN MẪU. Hệ thật không có hàm này: phiên đăng nhập trên
     máy chủ mới là thứ quyết định doiTacId, và một người chỉ vào được
     chính tài khoản của mình. Ở bản mẫu tĩnh thì phải có một ô chọn, nếu
     không thì không xem được cổng đối tác trông ra sao. */
  dangNhapMau: function () {
    return state.doiTac.filter(function (d) { return d.trangThai === "dang-hop-tac"; })
      .map(function (d) {
        var nd = state.nguoiDung.filter(function (u) { return u.doiTacId === d.id; })[0];
        /* Kèm số việc đối tác nhìn thấy, để cửa mẫu chọn được đối tác có
           dữ liệu thật mà mở mặc định. Mở lần đầu vào một đối tác chỉ có
           một dòng thì người xem tưởng phần mềm rỗng. */
        var soViec = state.viec.filter(function (v) { return v.doiTacId === d.id && v.hienChoDoiTac; }).length;
        return { doiTacId: d.id, ten: d.ten, loai: d.loai, dichVu: d.dichVu.slice(), soViec: soViec,
                 coNhac: d.dichVu.some(function (x) { return dvCua(x).coNhac; }),
                 coTien: d.dichVu.some(function (x) { return dvCua(x).coTien; }),
                 nguoiDungId: nd ? nd.id : null, nguoiDungTen: nd ? nd.ten : "" };
      })
      .sort(function (x, y) { return x.ten.localeCompare(y.ten, "vi"); });
  },
  dichVu: function () { return DICH_VU.filter(function (d) { return !d.kyThuat; }).map(function (d) { return { id: d.id, vi: d.vi }; }); }
};

/* =====================================================================
   11. KHỞI ĐỘNG
   ===================================================================== */
var daLuu = kho.doc();
state = daLuu || gieo();
if (!daLuu) kho.ghi();

var H = {
  VERSION: CFG.VERSION,
  admin: admin,
  api: api,
  /* Cổng đối tác gọi ngay lúc khởi động: gỡ hẳn mặt tiền nội bộ. */
  lockdown: function () {
    delete H.admin;
    H.admin = undefined;
    try { Object.freeze(H); } catch (e) {}
    return true;
  }
};
global.HAUSTEK = H;

})(typeof window !== "undefined" ? window : globalThis);
