/* =====================================================================
   HAUSTEK PORTAL — LÕI DÙNG CHUNG  ("máy chủ giả lập")
   ---------------------------------------------------------------------
   File này đóng vai trò cái mà sau này là DATABASE + API. Hai trang
   intranet.html (admin) và dashboard.html (label / nghệ sĩ) cùng nạp
   file này, nhưng KHÔNG được phép với tới cùng một thứ:

     · HAUSTEK.admin  — toàn bộ dữ liệu thô, tên đơn vị phân phối, tỷ lệ
                        gốc, hàng chờ khớp ISRC, nút duyệt kỳ.
                        CHỈ intranet được chạm vào.
     · HAUSTEK.api    — trả về gói dữ liệu ĐÃ TÍNH SẴN và ĐÃ CẮT BỚT cho
                        đúng một người xem, đúng một kỳ ĐÃ DUYỆT.
                        Đây là thứ duy nhất dashboard được gọi.

   dashboard.html gọi HAUSTEK.lockdown() ngay khi khởi động: sau lời gọi
   đó, HAUSTEK.admin biến mất khỏi trang khách và không lời gọi nào của
   trang đó lấy lại được.

   NÓI CHO ĐÚNG: đây là HÌNH DẠNG của ranh giới, không phải ranh giới đã
   được thực thi. Hai trang cùng chạy trong một trình duyệt, cùng một gốc
   (origin), nên vẫn còn đường vòng: nạp lại file lõi này trong một iframe
   cùng gốc là có lại .admin, và localStorage giữ toàn bộ quyết định của
   admin thì trang nào cùng gốc cũng đọc được. Bản mẫu không bịt được
   những đường đó, và cũng không nên giả vờ là bịt được.
   Thứ thật sự bảo đảm cách ly là ở mục 5.1 tài liệu bàn giao: dữ liệu thô
   nằm trong database, lọc và tổng hợp chạy ở máy chủ, và Row Level
   Security quyết định ai đọc được dòng nào. Cái ở đây chỉ nói rõ tầng API
   phải có hình dạng gì để RLS bên dưới có nghĩa.

   Số liệu sinh tại chỗ bằng bộ sinh số giả ngẫu nhiên CÓ HẠT GIỐNG cố
   định — nên hai trang mở riêng vẫn ra đúng cùng một con số. Chỉ những
   QUYẾT ĐỊNH của admin (đã nạp luồng nào, đã duyệt kỳ nào, tỷ lệ, tạm
   ứng, khớp tay) là được lưu lại và truyền qua dashboard.
   ===================================================================== */
"use strict";
(function(global){

const T_BOOT = performance.now();

/* ---------------------------------------------------------------------
   1. THÔNG SỐ
   --------------------------------------------------------------------- */
const CFG = {
  VERSION:      "1.3.0",   /* 1.3.0: đối tác chỉ thấy số NET; ví và rút tiền; ticket; dự báo */
  STORE_KEY:    "haustek.portal.v1",
  N_TRACKS:     50000,
  N_PERIODS:    12,
  N_ARTISTS:    900,
  N_LABELS:     40,
  HAUSTEK_FEE:  0.15,   /* phí Haustek trên doanh thu bản ghi */
  PUB_FEE:      0.10,   /* phí quản lý trên tác quyền */
  PAYOUT_MIN:   50,     /* dưới ngưỡng này thì dồn sang kỳ sau */
  BLACKBOX_CAP: 0.005   /* tiền treo vượt 0,5% doanh thu kỳ thì chặn duyệt */
};

/* Tên đơn vị phân phối và tỷ lệ gốc — MỤC 2.7: bí mật kinh doanh.
   KHÔNG viết chúng vào file này. Cổng khách cũng nạp chính file này, nên
   bất cứ thứ gì nằm đây đều tải về máy khách — mở dev tools hay chỉ cần
   `curl` file .js là đọc được, không cần chạy một dòng JavaScript nào.
   Vì vậy intranet.html tự nạp chúng vào lúc khởi động bằng
   HAUSTEK.admin.provideSecrets(); dashboard.html không bao giờ gọi hàm đó,
   nên bản sao lõi mà khách tải về không mang theo gì cả.
   Trong sản phẩm thật, tương đương là: những giá trị này nằm trong biến
   môi trường của máy chủ và chưa từng đi qua đường truyền tới khách. */
let DISTRIBUTOR = null;
const KHONG_CO_BI_MAT = {
  code: "—", name: "(chưa nhập, chỉ nội bộ mới có)", grossRate: null,
  contact: "chỉ có ở nội bộ"
};
/* Những chuỗi tuyệt đối không được lọt xuống trình duyệt khách.
   Hàm scrub() bên dưới ném lỗi nếu thấy chúng trong payload. Danh sách này
   nở ra khi intranet nạp bí mật vào. */
let FORBIDDEN = ["grossRate", "distributor", "nhà phân phối", "phân phối",
                 "rate_share", "rateShare", "ký trực tiếp",
                 /* Đối tác chỉ thấy số NET của mình. Doanh thu gộp, phí dịch vụ
                    và phần Haustek nằm trong bảng kê PDF mà Haustek gửi riêng,
                    không nằm trong bất kỳ gói dữ liệu nào của cổng đối tác. */
                 "gross", "haustekFee", "counterpartShare", "doanh thu gộp", "phí dịch vụ", "service fee"];

/* ---------------------------------------------------------------------
   2. BỘ SINH SỐ CÓ HẠT GIỐNG
   Cùng hạt giống → cùng con số ở mọi trang, mọi lần mở.
   --------------------------------------------------------------------- */
let _seed = 20260826;
const rnd = () => { _seed = (_seed * 1664525 + 1013904223) % 4294967296; return _seed / 4294967296; };
const pick = a => a[(rnd() * a.length) | 0];
const cents = v => Math.round(v * 100) / 100;

/* băm xác định: dùng để bóc doanh thu theo cửa hàng / lãnh thổ mà không
   phải lưu sẵn hàng trăm triệu dòng. Trong hệ thật đây là bảng rollup. */
function hash(a, b) {
  let h = (a * 2654435761 + b * 40503) >>> 0;
  h ^= h >>> 15; h = (h * 2246822507) >>> 0; h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/* ---------------------------------------------------------------------
   3. KỲ BÁO CÁO
   12 kỳ, kết thúc ở 07/2026 (kỳ gần nhất đã đóng sổ).
   --------------------------------------------------------------------- */
const PERIODS = [];
for (let i = CFG.N_PERIODS - 1; i >= 0; i--) {
  const d = new Date(2026, 6 - i, 1);
  const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  PERIODS.push({
    k, idx: CFG.N_PERIODS - 1 - i,
    label: String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(),
    year: d.getFullYear(), month: d.getMonth() + 1,
    quarter: Math.floor(d.getMonth() / 3) + 1
  });
}
const pIndexOf = k => PERIODS.findIndex(p => p.k === k);

/* ---------------------------------------------------------------------
   4. LUỒNG DỮ LIỆU & CỬA HÀNG
   Ba luồng doanh thu bản ghi, mỗi luồng một mối, một lịch, một định dạng.
   Tác quyền là dòng tiền tách rời, về theo quý — để riêng, không đếm vào
   "đủ 3 luồng".
   --------------------------------------------------------------------- */
/* Chuỗi hiển thị mang kèm bản tiếng Anh ngay tại chỗ.
   Giao diện có hai ngôn ngữ, mà những chuỗi này sinh ra ở TẦNG DỮ LIỆU chứ
   không ở màn hình — nên nếu chỉ có một bản thì bật EN xong vẫn đọc ra
   tiếng Việt, và bản dịch trông như làm dở. Đặt cạnh nhau ở đây để thêm
   một luồng mới là buộc phải nghĩ tới cả hai. */
const FEEDS = [
  { id: 0, name: "Đơn vị phân phối chính", short: "Chính",   fmt: "CSV · 41 cột · hằng tháng, ngày 20",
    note: "Một file gộp mọi nền tảng, trừ YouTube và TikTok",
    nameEn: "Main distribution partner", shortEn: "Main", fmtEn: "CSV · 41 columns · monthly, on the 20th",
    noteEn: "Every store except YouTube and TikTok, in one file" },
  { id: 1, name: "YouTube (ký trực tiếp)",  short: "YouTube", fmt: "CSV nén · 3 file/kỳ · hằng tháng, ngày 25",
    note: "Content ID và YouTube Music được báo cáo thành hai loại dòng riêng",
    nameEn: "YouTube (direct deal)", shortEn: "YouTube", fmtEn: "gzipped CSV · 3 files per period · monthly, on the 25th",
    noteEn: "Content ID and YouTube Music arrive as two different row types" },
  { id: 2, name: "TikTok (ký trực tiếp)",   short: "TikTok",  fmt: "XLSX · 1 sheet/thị trường · hằng tháng, không đều",
    note: "Về muộn nhất và thường thiếu các thị trường nhỏ",
    nameEn: "TikTok (direct deal)", shortEn: "TikTok", fmtEn: "XLSX · one sheet per territory · monthly, irregular",
    noteEn: "Arrives last, and often drops the smaller territories" }
];
const PUB_FEED = { id: 9, name: "Tác quyền (các tổ chức quản lý tác quyền)", short: "Tác quyền",
  fmt: "mỗi tổ chức một định dạng · theo quý", note: "VCPMC, The MLC, ASCAP… về muộn 1–2 quý",
  nameEn: "Publishing (collecting societies)", shortEn: "Publishing",
  fmtEn: "a different format per society · quarterly",
  noteEn: "VCPMC, The MLC, ASCAP… one to two quarters behind" };

const STORE_TOP = [
  { n: "Spotify",       w: .285, f: 0 }, { n: "YouTube Music", w: .155, f: 1 },
  { n: "TikTok",        w: .135, f: 2 }, { n: "Apple Music",   w: .125, f: 0 },
  { n: "Zing MP3",      w: .075, f: 0 }, { n: "NhacCuaTui",    w: .062, f: 0 },
  { n: "Facebook",      w: .048, f: 0 }, { n: "Instagram",     w: .035, f: 0 }
];
const STORE_TAIL_NAMES = ["Amazon Music","Deezer","Tidal","Pandora","Napster","Anghami",
"Boomplay","JioSaavn","Gaana","KKBOX","LINE Music","AWA","Joox","Melon","Genie","Bugs",
"VK Music","Yandex Music","Beatport","Traxsource","Juno","7digital","Qobuz","Nuuday",
"Peloton","Triller","Snapchat","Twitch","iHeartRadio","SiriusXM","Audiomack","Trebel",
"Resso","MelOn Kids","ClaroMúsica","Deezer HiFi","Musixmatch","Shazam","Netease",
"QQ Music","Kugou","Kuwo","Bilibili","Douyin","Kuaishou","Moov","MyMusic","friDay",
"Yinyuetai","Migu","Xiami","Soribada","Flo","Vibe","Naver Vibe","Spinlet","Mdundo",
"Simfy Africa","Vodafone","MTN","Orange","Etisalat","Zain","STC","Rotana","Deezer MENA"];

const STORES = [], STORE_W = [], STORE_FEED = [];
STORE_TOP.forEach(s => { STORES.push(s.n); STORE_W.push(s.w); STORE_FEED.push(s.f); });
const N_TAIL = 210;
for (let i = 0; i < N_TAIL; i++) {
  const base = STORE_TAIL_NAMES[i % STORE_TAIL_NAMES.length];
  STORES.push(i < STORE_TAIL_NAMES.length ? base : base + " " + (1 + ((i / STORE_TAIL_NAMES.length) | 0)));
  STORE_W.push(0.08 * Math.pow(0.975, i) / 12.6);
  STORE_FEED.push(0);
}
const N_TOP = STORE_TOP.length;
/* trọng số từng luồng = tổng trọng số các cửa hàng thuộc luồng đó */
const FEED_W = FEEDS.map(f => STORE_W.reduce((s, w, j) => s + (STORE_FEED[j] === f.id ? w : 0), 0));

const TERR = ["Việt Nam","Hoa Kỳ","Nhật Bản","Hàn Quốc","Đức","Anh","Pháp","Úc","Canada",
"Đài Loan","Thái Lan","Singapore","Brazil","Mexico","Indonesia","Khác"];
const TERR_W = [.34,.14,.075,.06,.045,.04,.035,.03,.028,.026,.025,.022,.02,.018,.016,.02];
const PUBSRC = ["VCPMC","The MLC","ASCAP","PRS","GEMA","SACEM","YouTube Content ID","JASRAC"];
const PUBSRC_W = [.34,.18,.11,.10,.07,.055,.075,.07];

/* ---------------------------------------------------------------------
   5. DANH MỤC — label, nghệ sĩ, bản ghi
   Tên có dấu và ký tự lạ là chuyện thường ngày ở đây: nae & de'lay,
   ling:chi, HƯƠNGMYBÔNG, Thiện Hí. Mọi chỗ in ra màn hình phải đi qua
   esc(); mọi chỗ phân quyền phải bám MÃ SỐ, không bao giờ bám tên.
   --------------------------------------------------------------------- */
const REAL = ["Trí Minh","nae & de'lay","JesiLyn","Cáp Anh Tài","Hà Quỳnh Như","ResQ",
"Bách Phan","Lope Dope","blackvelvetz","Rosewood","Qinie","Lazy noize","HƯƠNGMYBÔNG",
"TRO-Music","Microwave","BeeBB","Mezzo","Red Sheep","ling:chi","Chin","KONKRETE",
"Tarnoise Spaceman","Oumii","Attiss Ngo","Ro-TUNE","Thiện Hí"];
const SYL = ["Hạ","Vọng","Lam","Nguyên","Sơn","Thu","Vũ","Khuê","Minh","Trang","Diệp","Hạo",
"Bảo","Chi","Duy","Giang","Hà","Khánh","Lâm","Ngân","Phúc","Quân","Tú","Uyên","Vân","Yên"];
const SUR = ["Nguyễn","Trần","Lê","Phạm","Hoàng","Phan","Vũ","Đặng","Bùi","Đỗ","Hồ","Ngô"];
const W1 = ["Đêm","Sương","Vọng","Trôi","Lặng","Nhịp","Khói","Mưa","Xa","Tần số","Bóng","Rỗng",
"Chậm","Vỡ","Trắng","Gần","Hạ","Chờ","Mảnh","Nghiêng","Tro","Vệt","Lối","Nước"];
const W2 = ["thứ hai","không tên","cuối","của tôi","tháng sáu","ngược","lần nữa","muộn",
"trong mơ","đầu tiên","còn lại","đã cũ"];
const LAB_A = ["Nightform","Sông Ngầm","Kho 13","Bến Trắng","Vọng Âm","Tầng Hầm","Mạch",
"Bụi Đỏ","Cửa Bắc","Lệch Pha"];
const LAB_B = ["Records","Collective","Tapes","Audio","Sound","Music"];
const TYPES = ["Single","EP","Album"];

const LABELS = [];
for (let i = 0; i < CFG.N_LABELS; i++) {
  LABELS.push({
    id: i, key: "L:" + i,
    clientId: "HTK-L" + String(i + 1).padStart(3, "0"),
    name: LAB_A[i % LAB_A.length] + " " + LAB_B[((i / LAB_A.length) | 0) % LAB_B.length]
        + (i >= LAB_A.length * LAB_B.length ? " " + i : ""),
    baseRate: 0.62 + Math.round(rnd() * 13) / 100 * 2,   /* phần nghệ sĩ nhận trong phần label quản lý */
    isPublisher: false
  });
}
/* Label mẹ / label con. Label lớn có thể có các label con ký riêng, mỗi
   label con là một tài khoản riêng với roster riêng; label mẹ theo dõi
   được toàn bộ cây bên dưới. Ở bản mẫu: mười label đầu mỗi label có một
   label con (10–19), bốn label đầu có thêm label con thứ hai (20–23).
   Tên label con mang cùng tiền tố với label mẹ. */
LABELS.forEach(l => { l.parentId = -1; });
for (let i = 10; i < 20; i++) LABELS[i].parentId = i - 10;
for (let i = 20; i < 24; i++) LABELS[i].parentId = i - 20;

const ARTISTS = [];
for (let i = 0; i < CFG.N_ARTISTS; i++) {
  const name = i < REAL.length ? REAL[i]
    : pick(SUR) + " " + pick(SYL) + " " + pick(SYL);
  ARTISTS.push({
    id: i, key: "A:" + i,
    clientId: "HTK-A" + String(i + 1).padStart(4, "0"),
    name,
    labelId: rnd() < 0.55 ? (rnd() * CFG.N_LABELS) | 0 : -1,
    writer: rnd() < 0.6,
    indieRate: 0.80 + Math.round(rnd() * 10) / 100
  });
}

/* bản ghi: mảng song song cho gọn bộ nhớ */
const N = CFG.N_TRACKS, P = CFG.N_PERIODS;
const tTitle = new Array(N), tIsrc = new Array(N), tIsrcAlt = new Array(N), tUpc = new Array(N);
const tArtist = new Int32Array(N), tLabel = new Int32Array(N);
const tProd = new Float32Array(N), tRel = new Int8Array(N);
const tPop = new Float32Array(N), tType = new Int8Array(N);
const tW1 = new Int32Array(N), tW2 = new Int32Array(N), tW1s = new Float32Array(N);

/* Danh mục thật không chia đều. Một nhóm nghệ sĩ ra đều tay gánh phần lớn
   danh mục, phần còn lại mỗi người dăm bài. Chia đều cho 900 người thì ai
   cũng kiếm được vài nghìn đô một kỳ, và ngưỡng chi trả tối thiểu — cùng
   với phần tiền dồn sang kỳ sau — không bao giờ chạm tới, tức là một
   nhánh của hệ thống không bao giờ được thử.
   Thứ tự trong danh sách nghệ sĩ đã xáo trước, nên tên có thật không tự
   nhiên rơi hết vào nhóm đông bài. */
const RANK = [];
for (let i = 0; i < CFG.N_ARTISTS; i++) RANK.push(i);
for (let i = RANK.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = RANK[i]; RANK[i] = RANK[j]; RANK[j] = t; }
const CORE_N = Math.round(CFG.N_ARTISTS * 0.45);
for (let i = 0; i < N; i++) {
  const a = rnd() < 0.88
    ? RANK[(rnd() * CORE_N) | 0]
    : RANK[CORE_N + ((rnd() * (CFG.N_ARTISTS - CORE_N)) | 0)];
  tArtist[i] = a; tLabel[i] = ARTISTS[a].labelId;
  tTitle[i] = pick(W1) + (rnd() < 0.42 ? " " + pick(W2) : "");
  tIsrc[i] = "VN" + String(20 + ((rnd() * 6) | 0)) + String(100000 + ((rnd() * 899999) | 0)) + String(10 + ((rnd() * 89) | 0));
  /* ISRC (Optional 1): bài phát hành lại hoặc đổi nhà phân phối mang mã thứ hai.
     Câu hỏi treo số 2 — ở đây để bảng mã phụ, không nhét thêm cột. */
  tIsrcAlt[i] = rnd() < 0.06 ? "VN" + String(20 + ((rnd() * 6) | 0)) + String(100000 + ((rnd() * 899999) | 0)) + String(10 + ((rnd() * 89) | 0)) : "";
  tUpc[i] = String(880000000000 + ((rnd() * 99999999) | 0));
  tProd[i] = rnd() < 0.35 ? [0.03, 0.04, 0.05][(rnd() * 3) | 0] : 0;  /* điểm producer trên doanh thu ròng */
  tRel[i] = (rnd() * P) | 0;
  tPop[i] = 0.04 + Math.pow(rnd(), 2.2) * 0.96;   /* độ phổ biến cũng đuôi dài: nhiều bài rất ít nghe */
  tType[i] = rnd() < 0.72 ? 0 : (rnd() < 0.6 ? 1 : 2);
  let w = ARTISTS[a].writer ? a : ((rnd() * CFG.N_ARTISTS) | 0);
  let guard = 0; while (!ARTISTS[w].writer && guard++ < 12) w = (rnd() * CFG.N_ARTISTS) | 0;
  tW1[i] = w;
  if (rnd() < 0.3) { tW2[i] = (rnd() * CFG.N_ARTISTS) | 0; tW1s[i] = [0.5, 0.6, 0.65][(rnd() * 3) | 0]; }
  else { tW2[i] = -1; tW1s[i] = 1; }
}

/* ---------------------------------------------------------------------
   6. DOANH THU
   recGross[(i*P + p)*3 + f] — tách sẵn theo LUỒNG. Nhờ vậy "kỳ này chưa
   nạp TikTok" không phải là một lời cảnh báo suông: phần tiền của TikTok
   thật sự không có trong tổng, đúng như ngoài đời.
   Làm tròn tới xu ngay khi sinh, để bước đối chiếu so được tới từng xu.
   --------------------------------------------------------------------- */
const recGross = new Float64Array(N * P * 3);
const recStreams = new Int32Array(N * P);
const pubGross = new Float64Array(N * P);
for (let i = 0; i < N; i++) {
  const rel = tRel[i], pop = tPop[i];
  for (let p = rel; p < P; p++) {
    const decay = Math.pow(0.88, Math.max(p - rel - 1, 0));
    const season = 1 + 0.14 * Math.sin(p / 2.1);
    const st = Math.round(pop * decay * season * (9000 + rnd() * 260000));
    const idx = i * P + p;
    recStreams[idx] = st;
    const g = st * (0.0020 + rnd() * 0.0022);
    /* chia doanh thu bài đó cho ba luồng, mỗi bài một khẩu vị thị trường riêng */
    let sum = 0; const part = [0, 0, 0];
    for (let f = 0; f < 3; f++) { part[f] = FEED_W[f] * (0.6 + hash(i, 900 + f) * 0.8); sum += part[f]; }
    let acc = 0;
    for (let f = 0; f < 3; f++) {
      const v = f === 2 ? cents(g - acc) : cents(g * part[f] / sum);
      recGross[idx * 3 + f] = v; acc = cents(acc + v);
    }
    if (p >= rel + 2) pubGross[idx] = cents(pop * decay * (3 + rnd() * 70));
  }
}

/* ---------------------------------------------------------------------
   7. CHỈ MỤC — nghệ sĩ → bản ghi, label → bản ghi, người sáng tác → bản ghi
   --------------------------------------------------------------------- */
function buildIndex(getKey, size) {
  const cnt = new Int32Array(size);
  for (let i = 0; i < N; i++) { const k = getKey(i); if (k >= 0) cnt[k]++; }
  const off = new Int32Array(size + 1);
  for (let i = 0; i < size; i++) off[i + 1] = off[i] + cnt[i];
  const arr = new Int32Array(off[size]); const cur = off.slice(0, size);
  for (let i = 0; i < N; i++) { const k = getKey(i); if (k >= 0) arr[cur[k]++] = i; }
  return { off, arr };
}
const byArtist = buildIndex(i => tArtist[i], CFG.N_ARTISTS);
const byLabel  = buildIndex(i => tLabel[i],  CFG.N_LABELS);
const byWriter = (() => {
  const cnt = new Int32Array(CFG.N_ARTISTS);
  for (let i = 0; i < N; i++) { cnt[tW1[i]]++; if (tW2[i] >= 0) cnt[tW2[i]]++; }
  const off = new Int32Array(CFG.N_ARTISTS + 1);
  for (let i = 0; i < CFG.N_ARTISTS; i++) off[i + 1] = off[i] + cnt[i];
  const arr = new Int32Array(off[CFG.N_ARTISTS]); const cur = off.slice(0, CFG.N_ARTISTS);
  for (let i = 0; i < N; i++) { arr[cur[tW1[i]]++] = i; if (tW2[i] >= 0) arr[cur[tW2[i]]++] = i; }
  return { off, arr };
})();
const idxOf = (ix, k) => ix.arr.subarray(ix.off[k], ix.off[k + 1]);

/* =====================================================================
   8. TRẠNG THÁI VẬN HÀNH — phần DUY NHẤT được lưu lại
   ---------------------------------------------------------------------
   Danh mục và doanh thu sinh lại y hệt mỗi lần mở nhờ hạt giống cố định,
   nên không cần lưu. Thứ phải lưu là QUYẾT ĐỊNH của admin: đã nạp luồng
   nào, khớp tay dòng nào, tỷ lệ đổi từ ngày nào, đã duyệt kỳ nào. Đó
   cũng chính là thứ chảy sang dashboard.
   ===================================================================== */
function defaultState() {
  const s = {
    v: CFG.VERSION,
    feeds: {},        /* feeds[periodKey][feedId] = {status, at, file, rows, control} */
    pub:   {},        /* pub[periodKey] = {status, at, file} — tác quyền theo quý */
    match: {},        /* match["<track>:<p>"] = số tiền khớp tay cộng thêm */
    queue: [],        /* hàng chờ khớp ISRC — "black box" */
    rates: [],        /* bảng tỷ lệ có ngày hiệu lực */
    advances: {},     /* advances[partyKey] = {opening, note, byPeriod:{}} */
    carry: {},        /* dồn sang kỳ sau khi dưới ngưỡng chi trả */
    approved: {},     /* approved[periodKey] = {at, by, note} */
    payouts: {},      /* payouts[periodKey] = [{partyKey, earned, recoup, payable, carry}] */
    variance: {},     /* variance["<periodKey>:<feedId>"] = {amount, note, at} */
    fx: { rate: 26150, at: "2026-08-01", policy: "ngày chốt kỳ", locked: {} },
    accounts: [],
    audit: [],
    answers: {},      /* câu trả lời cho các câu hỏi còn treo (mục 3 tài liệu) */
    releases: [],     /* hồ sơ phát hành do đối tác gửi lên: đã gửi → tiếp nhận → cấp mã → phát hành */
    withdrawals: [],  /* yêu cầu rút tiền của đối tác: requested → processing → paid | rejected | cancelled */
    statements: {},   /* statements[periodKey][partyKey] = {file, at, by} — bảng kê PDF kế toán tải lên */
    bank: {},         /* bank[partyKey] = tài khoản nhận tiền */
    tickets: [],      /* yêu cầu hỗ trợ */
    claims: [],       /* xung đột Content ID / khiếu nại trên nền tảng */
    deliveries: [],   /* yêu cầu giao nhận nền tảng (vận hành) */
    bulk: [],         /* yêu cầu sửa hàng loạt (vận hành) */
    videoSettings: {},/* cài đặt video / Content ID theo tài khoản */
    partyManager: {}, /* partyKey → nhân viên kinh doanh phụ trách */
    publishedAt: null
  };

  /* --- tỷ lệ khởi tạo: mỗi label và mỗi nghệ sĩ độc lập một dòng, hiệu
     lực từ kỳ đầu tiên. Đây là BẢNG, không phải cột — đổi tỷ lệ hôm nay
     không được làm đổi báo cáo các kỳ đã chốt (mục 5.5). --- */
  const first = PERIODS[0].k;
  LABELS.forEach(l => s.rates.push({ partyKey: l.key, rate: l.baseRate, from: first, by: "khởi tạo", at: "2025-08-01" }));
  ARTISTS.forEach(a => { if (a.labelId < 0) s.rates.push({ partyKey: a.key, rate: a.indieRate, from: first, by: "khởi tạo", at: "2025-08-01" }); });
  /* một label đổi tỷ lệ giữa chừng, để thấy tác dụng của ngày hiệu lực */
  s.rates.push({ partyKey: "L:3", rate: 0.72, from: PERIODS[8].k, by: "khởi tạo", at: "2026-04-02",
                 note: "Phụ lục hợp đồng ký 02.04.2026, áp dụng từ kỳ 04/2026" });

  /* --- tạm ứng --- */
  ARTISTS.forEach(a => { if (rnd() < 0.18) s.advances[a.key] = { opening: Math.round(600 + rnd() * 22000), note: "Tạm ứng theo hợp đồng", byPeriod: {} }; });
  LABELS.forEach(l => { if (rnd() < 0.30) s.advances[l.key] = { opening: Math.round(4000 + rnd() * 90000), note: "Tạm ứng marketing / sản xuất", byPeriod: {} }; });

  /* --- lịch sử nạp: 11 kỳ đầu đã nạp đủ, kỳ mới nhất còn thiếu TikTok,
     một kỳ cũ từng thiếu YouTube rồi nạp bù muộn. Kỳ nào nạp đủ và đối
     chiếu sạch thì đã duyệt. --- */
  PERIODS.forEach((p, pi) => {
    s.feeds[p.k] = {};
    FEEDS.forEach(f => {
      const missing = (pi === P - 1 && f.id === 2);
      s.feeds[p.k][f.id] = missing
        ? { status: "missing", at: null, file: null, rows: 0, control: null }
        : { status: "loaded", at: p.year + "-" + String(p.month).padStart(2, "0") + "-22T09:14:00",
            file: fileNameFor(f, p), rows: 0, control: null };
    });
    /* tác quyền: chỉ về vào kỳ cuối mỗi quý, và trễ */
    s.pub[p.k] = (p.month % 3 === 0 && pi < P - 2)
      ? { status: "loaded", at: p.year + "-" + String(p.month).padStart(2, "0") + "-28T16:02:00", file: "vcpmc-quy" + p.quarter + "-" + p.year + ".xlsx" }
      : { status: "missing", at: null, file: null };
  });

  return s;
}
function fileNameFor(f, p) {
  const ym = p.year + String(p.month).padStart(2, "0");
  if (f.id === 0) return "sales-report-" + ym + ".csv";
  if (f.id === 1) return "yt-" + ym + "-partner.csv.gz";
  return "tiktok-" + ym + ".xlsx";
}

let state = null;
function ensureShape(s) {
  ["withdrawals", "tickets", "claims", "deliveries", "bulk", "releases"].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  ["statements", "bank", "videoSettings", "partyManager", "splits", "alerts", "notifRead"].forEach(k => { if (!s[k] || typeof s[k] !== "object") s[k] = {}; });
  return s;
}

/* ---------------------------------------------------------------------
   8b. HỒ SƠ PHÁT HÀNH
   Form metadata ở trang chủ (metadata.html) và bảng releases/tracks/
   publishing_splits trong schema Supabase là hai đầu của cùng một luồng.
   Ở bản mẫu, hồ sơ nằm trong state.releases và đi qua bốn bước:
     submitted → received → coded → released   (returned: trả lại bổ sung)
   Mỗi bước để lại một dòng lịch sử trên hồ sơ và một dòng nhật ký.
   --------------------------------------------------------------------- */
const RELEASE_TYPES = ["single", "ep", "album"];
const RELEASE_STATUS = ["submitted", "received", "coded", "released", "returned"];
let releaseSeq = 0;
function releaseId() {
  releaseSeq++;
  const d = new Date();
  return "HSTK-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(releaseSeq).padStart(3, "0");
}
function genIsrc(seed) {
  /* VN-HTK-26-NNNNN: mã quốc gia, mã đơn vị cấp, năm, số thứ tự */
  return "VNHTK26" + String((seed * 7919 + 10007) % 90000 + 10000).padStart(5, "0");
}
function genUpc(seed) { return "88" + String(1000000000 + (seed * 104729 + 7) % 8999999999); }
function releaseStamp(r, status, by, note) {
  r.status = status;
  r.updatedAt = nowISO();
  r.history.push({ at: r.updatedAt, status, by, note: note || null });
}
function normaliseTrack(tr, pos, artistName) {
  const writers = (tr.writers || []).filter(w => w && w.name).map(w => ({
    name: String(w.name).trim(), role: w.role || "Composer",
    pct: Math.max(0, Math.min(100, +w.pct || 0)) }));
  return { pos, title: String(tr.title || "").trim(), version: tr.version ? String(tr.version).trim() : "",
    artist: tr.artist ? String(tr.artist).trim() : artistName, feat: tr.feat ? String(tr.feat).trim() : "",
    isrc: tr.isrc ? String(tr.isrc).replace(/[^A-Za-z0-9]/g, "").toUpperCase() : "",
    producer: tr.producer ? String(tr.producer).trim() : "", publisher: tr.publisher ? String(tr.publisher).trim() : "",
    writers };
}
function validateRelease(payload, artistName) {
  if (!payload || !String(payload.title || "").trim()) throw new Error("Thiếu tên bản phát hành");
  if (RELEASE_TYPES.indexOf(payload.type) < 0) throw new Error("Loại phát hành không hợp lệ");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.releaseDate || "")) throw new Error("Ngày phát hành phải theo định dạng yyyy-mm-dd");
  const tracks = (payload.tracks || []).map((t, i) => normaliseTrack(t, i + 1, artistName)).filter(t => t.title);
  if (!tracks.length) throw new Error("Hồ sơ phải có ít nhất một track");
  tracks.forEach(t => {
    if (t.isrc && !/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(t.isrc)) throw new Error("Mã ISRC không đúng định dạng: " + t.isrc);
    const tong = t.writers.reduce((a, w) => a + w.pct, 0);
    if (tong > 100.001) throw new Error("Tổng tỷ lệ sáng tác của track \"" + t.title + "\" vượt 100%");
  });
  return tracks;
}
function buildRelease(payload, artistId, submittedBy, role) {
  const a = ARTISTS[artistId];
  const tracks = validateRelease(payload, a.name);
  const now = nowISO();
  const r = {
    id: releaseId(), artistId, artistName: a.name, artistClientId: a.clientId,
    labelId: a.labelId, submittedBy, submittedRole: role,
    title: String(payload.title).trim(), version: payload.version ? String(payload.version).trim() : "",
    type: payload.type, genre: payload.genre || "", lang: payload.lang || "vi",
    releaseDate: payload.releaseDate, upc: payload.upc ? String(payload.upc).replace(/\D/g, "") : "",
    artwork: payload.artwork || "", note: payload.note || "",
    tracks, status: "submitted", history: [], createdAt: now, updatedAt: now, releasedAt: null
  };
  r.history.push({ at: now, status: "submitted", by: submittedBy, note: null });
  return r;
}
/* Bản phát hành đã có trong danh mục, suy ra từ bản ghi: cùng nghệ sĩ,
   cùng kỳ phát hành, cùng loại. Single thì mỗi bản ghi một bản phát hành. */
function catalogueReleases(role, partyId, limit) {
  const sc = scopeOf(role, partyId, "rec");
  const n = sc ? sc.length : N;
  const groups = new Map();
  for (let k = 0; k < n; k++) {
    const i = sc ? sc[k] : k;
    const key = tType[i] === 0 ? "s:" + i : tArtist[i] + ":" + tRel[i] + ":" + tType[i];
    let g = groups.get(key);
    if (!g) {
      g = { key, artistId: tArtist[i], rel: tRel[i], type: tType[i], tracks: [], earning: false };
      groups.set(key, g);
    }
    g.tracks.push(i);
  }
  const arr = [...groups.values()];
  /* Doanh thu gộp cộng dồn qua các kỳ đã xét duyệt: để bản có doanh thu
     đứng trước, thay vì hai mươi bản mới nhất cùng một kỳ và cùng "chưa có". */
  const daDuyet = [];
  for (let p = 0; p < P; p++) if (state.approved[PERIODS[p].k]) daDuyet.push(p);
  arr.forEach(g => { let s = 0; for (const i of g.tracks) for (const p of daDuyet) s += revenueOf(i, p, role); g.revenue = cents(s); });
  arr.sort((a, b) => b.revenue - a.revenue || b.rel - a.rel || a.artistId - b.artistId);
  const total = arr.length;
  const rows = arr.slice(0, limit || 40).map(g => {
    const first = g.tracks[0];
    return { id: "CAT-" + g.key.replace(/[^0-9a-z]/gi, "-"), trackId: first, title: tTitle[first], type: TYPES[g.type] || "Single",
      artistId: g.artistId, artistName: ARTISTS[g.artistId].name,
      releasePeriod: PERIODS[g.rel].label, tracks: g.tracks.length, earning: g.revenue > 0, revenue: g.revenue,
      isrc: g.tracks.length === 1 ? tIsrc[first] : null, status: "released" };
  });
  return { rows, total };
}
function releaseVisible(r, role, partyId) {
  if (role === "admin") return true;
  if (role === "label") return r.labelId === partyId;
  return r.artistId === partyId;
}

/* ---------------------------------------------------------------------
   9. LƯU / NẠP / XUẤT
   localStorage là kênh chính. Mở bằng file:// trên Safari thì localStorage
   bị chặn — nên có thêm đường xuất/nhập một file JSON nhỏ.
   --------------------------------------------------------------------- */
const store = {
  save() {
    try { localStorage.setItem(CFG.STORE_KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  },
  load() {
    try {
      const raw = localStorage.getItem(CFG.STORE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return (s && s.v === CFG.VERSION) ? s : null;
    } catch (e) { return null; }
  },
  clear() { try { localStorage.removeItem(CFG.STORE_KEY); } catch (e) {} },
  exportJSON() { return JSON.stringify(state, null, 1); },
  importJSON(txt) {
    const s = JSON.parse(txt);
    if (!s || s.v !== CFG.VERSION) throw new Error("File trạng thái không đúng phiên bản " + CFG.VERSION);
    state = ensureShape(s); invalidateRates(); rebuildMatchIndex(); store.save(); return true;
  },
  available() { try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); return true; } catch (e) { return false; } }
};

const _saved = store.load();
const FRESH = !_saved;
state = ensureShape(_saved || defaultState());
if (FRESH) buildQueueSeed();

/* ---------------------------------------------------------------------
   10. HÀNG CHỜ KHỚP ISRC — "black box"
   Dòng doanh thu về mà không khớp được bản ghi nào thì KHÔNG được bỏ im.
   Riêng The MLC đang giữ hơn 424 triệu đô tiền chưa tìm ra chủ. Ở quy mô
   Haustek con số nhỏ hơn nhiều, nhưng đó vẫn là tiền của người khác.
   --------------------------------------------------------------------- */
function buildQueueSeed() {
  const BAD_TITLES = ["Đêm (Remix)","Sương - Acoustic","Vọng (feat. Chin)","Nhịp — live at Kho 13",
    "Mưa [sped up]","Trắng (Instrumental)","Khói (Radio Edit)","Lối về","Tro tàn","Vệt nắng"];
  let qid = 1;
  PERIODS.forEach((p, pi) => {
    FEEDS.forEach(f => {
      if (state.feeds[p.k][f.id].status !== "loaded") return;
      /* kỳ càng mới càng nhiều dòng chưa xử lý; kỳ cũ đã dọn gần hết */
      const n = pi >= P - 3 ? 3 + ((rnd() * 6) | 0) : (rnd() < 0.35 ? 1 : 0);
      for (let j = 0; j < n; j++) {
        const seedTrack = (rnd() * N) | 0;
        const broken = rnd();
        const isrc = broken < 0.34 ? ""                                  /* thiếu hẳn mã */
          : broken < 0.67 ? tIsrc[seedTrack].slice(0, -1) + "X"          /* sai một ký tự */
          : "QZ" + String(20 + ((rnd() * 6) | 0)) + String(100000 + ((rnd() * 899999) | 0)) + String(10 + ((rnd() * 89) | 0));
        state.queue.push({
          id: "Q" + String(qid++).padStart(5, "0"),
          periodKey: p.k, feedId: f.id,
          isrc,
          title: rnd() < 0.5 ? tTitle[seedTrack] : pick(BAD_TITLES),
          artist: ARTISTS[tArtist[seedTrack]].name,
          store: STORES[(rnd() * N_TOP) | 0],
          territory: pick(TERR),
          streams: Math.round(200 + rnd() * 90000),
          amount: cents(2 + rnd() * 900),
          reason: broken < 0.34 ? "Thiếu mã ISRC" : broken < 0.67 ? "Mã ISRC không có trong danh mục" : "Mã ISRC của nhà phát hành khác",
          hint: seedTrack,     /* bản ghi "đúng" — dùng để chấm điểm gợi ý, không hiện cho ai */
          status: "pending", resolvedTo: null, at: null
        });
      }
    });
  });
  store.save();
}

/* gợi ý khớp: so mã, so tên bài, so tên nghệ sĩ. Chấm điểm rồi xếp hạng —
   quyết định cuối vẫn là của người, hệ thống không tự khớp. */
function suggestFor(q, limit) {
  const out = [];
  const nq = norm(q.title), na = norm(q.artist);
  const seen = new Set();
  const push = (i, score, why) => { if (seen.has(i)) return; seen.add(i); out.push({ i, score, why }); };
  if (q.isrc) {
    for (let i = 0; i < N; i++) {
      if (tIsrc[i] === q.isrc || tIsrcAlt[i] === q.isrc) { push(i, 100, "Trùng mã ISRC"); break; }
    }
    /* sai một ký tự cuối là lỗi gõ tay hay gặp nhất */
    const stem = q.isrc.slice(0, -1);
    for (let i = 0; i < N && out.length < 40; i++) if (tIsrc[i].startsWith(stem)) push(i, 82, "Sai 1 ký tự cuối của mã ISRC");
  }
  for (let i = 0; i < N && out.length < 60; i++) {
    const t = norm(tTitle[i]);
    if (!t) continue;
    const a = norm(ARTISTS[tArtist[i]].name);
    if (t === nq && a === na) push(i, 90, "Trùng tên bài hát và tên nghệ sĩ");
    else if (t === nq) push(i, 62, "Trùng tên bài hát");
    else if (na && a === na && nq.includes(t)) push(i, 55, "Cùng nghệ sĩ · tên bài hát gần giống");
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit || 6);
}
function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/\(.*?\)|\[.*?\]/g, "").replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(remix|acoustic|live|instrumental|radio edit|sped up|feat|ft)\b/g, "")
    .replace(/\s+/g, " ").trim();
}

/* =====================================================================
   11. TỶ LỆ CHIA CÓ NGÀY HIỆU LỰC
   rate_share KHÔNG phải một cột trên bảng nghệ sĩ. Nếu label đổi tỷ lệ
   hôm nay mà báo cáo các kỳ đã chốt đổi theo thì đó là lỗi không sửa
   được sau khi đã chi tiền.
   ===================================================================== */
/* Tra tỷ lệ chạy 50.000 lần cho mỗi lần tổng hợp một kỳ. Quét lại cả
   bảng mỗi lần thì trang đứng hình — nên dựng chỉ mục một lần rồi nhớ
   kết quả, và xoá bộ nhớ đệm mỗi khi bảng tỷ lệ đổi. */
let _sched = null, _rateCache = new Map();
function invalidateRates() { _sched = null; _rateCache.clear(); }
function schedIndex() {
  if (_sched) return _sched;
  _sched = new Map();
  state.rates.forEach(r => {
    let a = _sched.get(r.partyKey);
    if (!a) { a = []; _sched.set(r.partyKey, a); }
    a.push(r);
  });
  _sched.forEach(a => a.sort((x, y) => x.from < y.from ? -1 : x.from > y.from ? 1 : 0));
  return _sched;
}
const rates = {
  invalidate: invalidateRates,
  scheduleFor(partyKey) { return (schedIndex().get(partyKey) || []).slice(); },
  rateFor(partyKey, periodKey) {
    const ck = partyKey + "|" + periodKey;
    const hit = _rateCache.get(ck);
    if (hit !== undefined) return hit;
    const list = schedIndex().get(partyKey) || [];
    let r = null;
    for (const e of list) { if (e.from <= periodKey) r = e; else break; }
    const v = r ? r.rate : 0.8;
    _rateCache.set(ck, v);
    return v;
  },
  add(partyKey, rate, fromPeriodKey, by, note) {
    if (!(rate > 0 && rate < 1)) throw new Error("Tỷ lệ phải nằm giữa 0 và 1");
    if (state.approved[fromPeriodKey]) throw new Error("Kỳ " + fromPeriodKey + " đã xét duyệt, không đặt được tỷ lệ mới cho kỳ đã chốt sổ");
    state.rates = state.rates.filter(r => !(r.partyKey === partyKey && r.from === fromPeriodKey));
    state.rates.push({ partyKey, rate, from: fromPeriodKey, by: by || "admin", at: nowISO(), note: note || "" });
    invalidateRates();
    audit.log("rate.add", partyKey + " → " + (rate * 100).toFixed(1) + "% từ kỳ " + fromPeriodKey);
    store.save();
  },
  remove(partyKey, fromPeriodKey) {
    const before = state.rates.length;
    state.rates = state.rates.filter(r => !(r.partyKey === partyKey && r.from === fromPeriodKey));
    if (state.rates.length !== before) { invalidateRates(); audit.log("rate.remove", partyKey + " · kỳ " + fromPeriodKey); store.save(); }
  }
};
function partyKeyOfTrack(i) { return tLabel[i] >= 0 ? "L:" + tLabel[i] : "A:" + tArtist[i]; }
function partyName(key) {
  if (key === "P:*") return "Điểm producer, chưa xác định người thụ hưởng";
  const id = +key.slice(2);
  return key[0] === "L" ? (LABELS[id] ? LABELS[id].name : key) : (ARTISTS[id] ? ARTISTS[id].name : key);
}
function partyClientId(key) {
  if (key === "P:*") return "—";
  const id = +key.slice(2);
  return key[0] === "L" ? (LABELS[id] ? LABELS[id].clientId : "") : (ARTISTS[id] ? ARTISTS[id].clientId : "");
}

/* =====================================================================
   12. CHUỖI CHIA TIỀN  (mục 2.2 tài liệu bàn giao)

     Doanh thu gộp
       − phí Haustek (15%)
       − phần label giữ, hoặc phần Haustek giữ thêm nếu nghệ sĩ độc lập
       − điểm producer      ← TRỪ VÀO PHẦN NGHỆ SĨ, không cộng thêm bên trên
       = về tay nghệ sĩ (trước khi trừ tạm ứng)

   Điểm producer trừ vào phần nghệ sĩ là chuẩn ngành. Làm ngược lại thì
   tổng các phần vượt quá 100%.
   ===================================================================== */
function splitRec(i, gross, periodKey) {
  const fee = cents(gross * CFG.HAUSTEK_FEE);
  const net = cents(gross - fee);
  const r = rates.rateFor(partyKeyOfTrack(i), periodKey);
  const artistBase = cents(net * r);
  const labelCut = cents(net - artistBase);
  const producer = Math.min(cents(net * tProd[i]), artistBase);
  return { gross, fee, net, labelCut, producer, artist: cents(artistBase - producer), rate: r };
}

/* =====================================================================
   13. DOANH THU NHÌN THẤY ĐƯỢC
   Chỉ luồng ĐÃ NẠP mới có tiền trong tổng. Cộng thêm những dòng admin đã
   khớp tay từ hàng chờ.
   ===================================================================== */
let MATCH = new Map();                     /* (i*P+p) → Float64Array(3) tiền khớp tay theo luồng */
function rebuildMatchIndex() {
  MATCH = new Map();
  for (const k in state.match) {
    const [i, p, f] = k.split(":").map(Number);
    const key = i * P + p;
    let a = MATCH.get(key);
    if (!a) { a = new Float64Array(3); MATCH.set(key, a); }
    a[f] += state.match[k];
  }
}
rebuildMatchIndex();

function feedLoaded(pIdx, fId) {
  const st = state.feeds[PERIODS[pIdx].k];
  return !!(st && st[fId] && st[fId].status === "loaded");
}
function loadedFeedIds(pIdx) { return FEEDS.filter(f => feedLoaded(pIdx, f.id)).map(f => f.id); }
function missingFeeds(pIdx)  { return FEEDS.filter(f => !feedLoaded(pIdx, f.id)); }
function pubLoaded(pIdx)     { const s = state.pub[PERIODS[pIdx].k]; return !!(s && s.status === "loaded"); }

/* doanh thu bản ghi của một bài trong một kỳ, chỉ tính luồng đã nạp */
function grossRec(i, p) {
  const base = i * P + p, o = base * 3;
  let g = 0;
  if (feedLoaded(p, 0)) g += recGross[o];
  if (feedLoaded(p, 1)) g += recGross[o + 1];
  if (feedLoaded(p, 2)) g += recGross[o + 2];
  if (MATCH.size) {
    const m = MATCH.get(base);
    if (m) { for (let f = 0; f < 3; f++) if (feedLoaded(p, f)) g += m[f]; }
  }
  return g;
}
function grossRecByFeed(i, p, f) {
  if (!feedLoaded(p, f)) return 0;
  const base = i * P + p;
  const m = MATCH.size ? MATCH.get(base) : null;
  return recGross[base * 3 + f] + (m ? m[f] : 0);
}
function grossPub(i, p) { return pubLoaded(p) ? pubGross[i * P + p] : 0; }
function grossOf(i, p, stream) { return stream === "pub" ? grossPub(i, p) : grossRec(i, p); }

/* bóc một số tiền theo cửa hàng / lãnh thổ — tính từ mã bài, không lưu sẵn */
function splitDim(trackIdx, total, weights, p) {
  const out = new Float64Array(weights.length);
  let sum = 0;
  /* có kỳ thì mỗi kỳ một khẩu vị riêng, không kỳ thì cố định theo bài */
  const seed = p ? trackIdx + p * 1000003 : trackIdx;
  for (let j = 0; j < weights.length; j++) {
    const jitter = 0.55 + hash(seed, j) * 0.9;
    out[j] = weights[j] * jitter; sum += out[j];
  }
  for (let j = 0; j < weights.length; j++) out[j] = out[j] / sum * total;
  return out;
}

/* =====================================================================
   14. PHẠM VI & TỔNG HỢP
   ===================================================================== */
const RONG = new Int32Array(0);
function scopeOf(role, partyId, stream) {
  if (role === "admin") return null;                         /* null = toàn danh mục */
  if (role === "label") {
    /* Tác quyền thuộc người sáng tác, không đi qua label. Trả danh mục bản
       ghi của label cho luồng tác quyền là mở toang cửa: bài thì đúng của
       label, nhưng TIỀN thì của người sáng tác — nhiều người trong số đó
       chẳng liên quan gì tới label. Chặn ngay ở đây, đừng chỉ chặn ở từng
       lời gọi: quên một lời gọi là quên cả một dòng tiền. */
    return stream === "pub" ? RONG : idxOf(byLabel, partyId);
  }
  return stream === "pub" ? idxOf(byWriter, partyId) : idxOf(byArtist, partyId);
}
/* Một chỗ duy nhất phát biểu luật, để không lời gọi nào quên. */
function chanTacQuyenChoLabel(role, stream) {
  if (stream === "pub" && role === "label")
    throw new Error("Tác quyền không đi qua label");
}
function writerShare(i, artistId) {
  if (tW1[i] === artistId) return tW1s[i];
  if (tW2[i] === artistId) return 1 - tW1s[i];
  return 0;
}
/* số tiền "của người này" trên một bài trong một kỳ */
function mineOf(i, p, role, partyId, stream) {
  const g = grossOf(i, p, stream);
  if (g <= 0) return 0;
  if (stream === "rec") {
    const s = splitRec(i, g, PERIODS[p].k);
    if (role === "admin") return s.gross;
    if (role === "label") return s.labelCut;
    return s.artist;
  }
  if (role === "admin") return g;
  return cents(g * (1 - CFG.PUB_FEE) * writerShare(i, partyId));
}

/* "Doanh thu" mà một vai nhìn thấy trên MỘT bài, MỘT kỳ. Nội bộ: doanh thu
   gộp. Label: phần sau phí dịch vụ, tức tổng phần trả nghệ sĩ và phần label.
   Nghệ sĩ: đúng phần của mình. Không vai đối tác nào nhìn thấy khoản phí. */
function revenueOf(i, p, role) {
  const g = grossRec(i, p);
  if (g <= 0 || role === "admin") return g;
  const s = splitRec(i, g, PERIODS[p].k);
  return role === "label" ? s.net : s.artist;
}
/* Cùng khái niệm ở cấp tổng hợp một kỳ */
function revenueAgg(a, role) {
  if (role === "admin") return a.gross;
  return role === "label" ? cents(a.gross - a.fee) : a.artist;
}

function agg(role, partyId, p, stream) {
  const sc = scopeOf(role, partyId, stream), n = sc ? sc.length : N;
  let total = 0, gross = 0, fee = 0, labelCut = 0, prod = 0, artist = 0, streams = 0, tracks = 0;
  for (let k = 0; k < n; k++) {
    const i = sc ? sc[k] : k;
    const g = grossOf(i, p, stream);
    if (g <= 0) continue;
    tracks++;
    if (stream === "rec") {
      const s = splitRec(i, g, PERIODS[p].k);
      gross += g; fee += s.fee; labelCut += s.labelCut; prod += s.producer; artist += s.artist;
      streams += recStreams[i * P + p];
      total += role === "admin" ? s.gross : (role === "label" ? s.labelCut : s.artist);
    } else {
      gross += g; fee += g * CFG.PUB_FEE;
      total += role === "admin" ? g : g * (1 - CFG.PUB_FEE) * writerShare(i, partyId);
    }
  }
  return { total: cents(total), gross: cents(gross), fee: cents(fee), labelCut: cents(labelCut),
           producer: cents(prod), artist: cents(artist), streams, tracks };
}

/* =====================================================================
   14b. NỀN TẢNG — chia doanh thu và lượt nghe theo nền tảng, nhất quán
   ---------------------------------------------------------------------
   Tám nền tảng lớn được tách riêng, hơn hai trăm nền tảng còn lại gộp
   thành một dòng "Nền tảng khác". Cùng MỘT phép chia dùng cho mọi chỗ:
   thu nhập theo nền tảng của một kỳ, ma trận nền tảng × kỳ của một bản
   ghi, và báo cáo nền tảng của cả tài khoản. Nhờ vậy ba bảng đó cộng
   lại luôn ra cùng một con số, và người đọc đối chiếu tay được.

   Tiền của mỗi nền tảng bám theo NGUỒN BÁO CÁO: YouTube Music là toàn bộ
   tiền nguồn 1, TikTok là toàn bộ tiền nguồn 2; sáu nền tảng lớn còn lại
   và phần đuôi chia nhau tiền nguồn 0 theo trọng số. Kỳ nào chưa nhập
   TikTok thì cột TikTok bằng 0, đúng như tổng của kỳ đó không có TikTok.
   ===================================================================== */
const PLAT_NAMES    = STORES.slice(0, N_TOP).concat(["Nền tảng khác"]);
const PLAT_NAMES_EN = STORES.slice(0, N_TOP).concat(["Other platforms"]);
const N_PLAT = PLAT_NAMES.length;
const TAIL_NAMES = STORES.slice(N_TOP);
const TAIL_W = STORE_W.slice(N_TOP);
const TAIL_SUM = TAIL_W.reduce((a, b) => a + b, 0);
/* trọng số của các ô thuộc nguồn 0 (mọi nền tảng trừ YouTube Music và TikTok) */
const PLAT_W0 = STORE_W.slice(0, N_TOP).map((w, j) => STORE_FEED[j] === 0 ? w : 0).concat([TAIL_SUM]);
const PLAT_FEED = STORE_FEED.slice(0, N_TOP).concat([0]);
/* lượt nghe trên mỗi đô la, so với Spotify = 1. TikTok và mạng xã hội trả
   rất ít cho mỗi lượt, Apple Music trả nhiều hơn. */
const PLAT_SPM = [1, 1.7, 4.4, 0.72, 2.3, 2.5, 3.2, 3.4, 1.35];

function splitStores(i, p, out) {
  out = out || new Float64Array(N_PLAT);
  const g0 = grossRecByFeed(i, p, 0), g1 = grossRecByFeed(i, p, 1), g2 = grossRecByFeed(i, p, 2);
  let sum = 0;
  const jit = new Float64Array(N_PLAT);
  for (let j = 0; j < N_PLAT; j++) {
    if (PLAT_W0[j] > 0) { jit[j] = PLAT_W0[j] * (0.55 + hash(i * 7 + p, 300 + j) * 0.9); sum += jit[j]; }
  }
  for (let j = 0; j < N_PLAT; j++) {
    out[j] = PLAT_FEED[j] === 1 ? g1 : PLAT_FEED[j] === 2 ? g2 : (sum > 0 ? g0 * jit[j] / sum : 0);
  }
  return out;
}
function splitStreams(i, p, rev, out) {
  out = out || new Float64Array(N_PLAT);
  const st = recStreams[i * P + p];
  let sum = 0;
  for (let j = 0; j < N_PLAT; j++) { out[j] = rev[j] * PLAT_SPM[j]; sum += out[j]; }
  for (let j = 0; j < N_PLAT; j++) out[j] = sum > 0 ? st * out[j] / sum : 0;
  return out;
}
/* Làm tròn từng ô tới xu rồi dồn phần dư vào ô lớn nhất, để cột cộng lại
   đúng bằng con số tổng đã công bố ở chỗ khác. */
function khopTong(arr, target, tron) {
  let sum = 0, big = 0;
  for (let j = 0; j < arr.length; j++) { arr[j] = tron(arr[j]); sum += arr[j]; if (arr[j] > arr[big]) big = j; }
  const du = tron(target - sum);
  if (Math.abs(du) > 0.0001) arr[big] = tron(arr[big] + du);
  return arr;
}

/* Ma trận nền tảng × kỳ của MỘT bản ghi. mineFactor(p, g) trả về tỷ lệ
   phần của người xem trên doanh thu gộp; null thì cột "mine" bằng gộp. */
function trackMatrix(i, pList, role, partyId) {
  const rows = PLAT_NAMES.map((n, j) => ({ name: n, nameEn: PLAT_NAMES_EN[j], revenue: [], streams: [], mine: [] }));
  const totals = { revenue: [], streams: [], mine: [] };
  const rev = new Float64Array(N_PLAT), st = new Float64Array(N_PLAT);
  pList.forEach(p => {
    splitStores(i, p, rev); splitStreams(i, p, rev, st);
    const g = grossRec(i, p);
    /* "revenue" là doanh thu theo vai (nội bộ: gộp; label: sau phí; nghệ sĩ:
       phần mình); "mine" là phần của người xem. Chia theo nền tảng theo cùng
       tỷ lệ với doanh thu gộp của bài. */
    const r = role === "admin" ? g : revenueOf(i, p, role);
    const m = role === "admin" ? g : mineOf(i, p, role, partyId, "rec");
    const fr = g > 0 ? r / g : 0, fm = g > 0 ? m / g : 0;
    const gv = khopTong(Array.from(rev, v => v * fr), cents(r), cents);
    const sv = khopTong(Array.from(st), recStreams[i * P + p], Math.round);
    const mv = khopTong(Array.from(rev, v => v * fm), cents(m), cents);
    for (let j = 0; j < N_PLAT; j++) { rows[j].revenue.push(gv[j]); rows[j].streams.push(sv[j]); rows[j].mine.push(mv[j]); }
    totals.revenue.push(cents(r)); totals.streams.push(recStreams[i * P + p]); totals.mine.push(cents(m));
  });
  return { rows, totals };
}

/* Báo cáo nền tảng × kỳ của cả một phạm vi (tài khoản đối tác, hoặc toàn
   danh mục cho nội bộ). Lấy mẫu như breakdown() rồi chuẩn hoá về đúng
   tổng của kỳ, nên cột nào cộng lại cũng bằng con số ở trang Tổng quan. */
function platformReport(role, partyId, pList) {
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const cap = Math.max(1, Math.min(n, 9000)), step = Math.max(1, Math.floor(n / cap));
  const rows = PLAT_NAMES.map((nm, j) => ({ name: nm, nameEn: PLAT_NAMES_EN[j], revenue: [], streams: [], mine: [] }));
  const totals = { revenue: [], streams: [], mine: [] };
  const rev = new Float64Array(N_PLAT), st = new Float64Array(N_PLAT);
  pList.forEach(p => {
    const accG = new Float64Array(N_PLAT), accS = new Float64Array(N_PLAT), accM = new Float64Array(N_PLAT);
    let sg = 0, ss = 0, sm = 0;
    for (let k = 0; k < n; k += step) {
      const i = sc ? sc[k] : k;
      const g = grossRec(i, p);
      if (g <= 0) continue;
      const r = revenueOf(i, p, role), m = mineOf(i, p, role, partyId, "rec");
      const fr = r / g, fm = m / g;
      splitStores(i, p, rev); splitStreams(i, p, rev, st);
      for (let j = 0; j < N_PLAT; j++) { accG[j] += rev[j] * fr; accS[j] += st[j]; accM[j] += rev[j] * fm; }
      sg += r; ss += recStreams[i * P + p]; sm += m;
    }
    const a = agg(role, partyId, p, "rec");
    const tongR = revenueAgg(a, role);
    const nG = sg > 0 ? tongR / sg : 0, nS = ss > 0 ? a.streams / ss : 0, nM = sm > 0 ? a.total / sm : 0;
    const gv = khopTong(Array.from(accG, v => v * nG), tongR, cents);
    const sv = khopTong(Array.from(accS, v => v * nS), a.streams, Math.round);
    const mv = khopTong(Array.from(accM, v => v * nM), a.total, cents);
    for (let j = 0; j < N_PLAT; j++) { rows[j].revenue.push(gv[j]); rows[j].streams.push(sv[j]); rows[j].mine.push(mv[j]); }
    totals.revenue.push(tongR); totals.streams.push(a.streams); totals.mine.push(a.total);
  });
  return {
    periods: pList.map(p => ({ k: PERIODS[p].k, label: PERIODS[p].label, open: !!state.approved[PERIODS[p].k] })),
    rows, totals
  };
}

/* Nhịp báo cáo của từng nhóm nền tảng: cái mà đối tác cần biết để hiểu vì
   sao tiền về ví không đều. Tên nguồn nội bộ không lộ ra: chỉ có tên nền
   tảng. TikTok trả theo quý (ghi nhận của Haustek); phần còn lại theo tháng. */
function reportCadence() {
  return [
    { cadence: "monthly", label: "Hằng tháng", labelEn: "Monthly",
      platforms: STORES.slice(0, N_TOP).filter(s => s !== "TikTok"),
      note: "Báo cáo về trong tháng kế tiếp; tiền được ghi vào ví sau khi kỳ được xét duyệt",
      noteEn: "Reports arrive the following month; money is credited to your wallet once the period is approved" },
    { cadence: "quarterly", label: "Hằng quý", labelEn: "Quarterly", platforms: ["TikTok"],
      note: "TikTok báo cáo và thanh toán theo quý; phần TikTok của các tháng trong quý được ghi vào ví khi báo cáo quý về",
      noteEn: "TikTok reports and pays quarterly; the TikTok part of each month is credited when the quarterly report lands" }
  ];
}

/* =====================================================================
   14c. TRẠNG THÁI PHÁT HÀNH — từng bước, từng nền tảng, còn thiếu gì
   ---------------------------------------------------------------------
   Câu hỏi của chủ label và nghệ sĩ về một bài hát không chỉ là "được bao
   nhiêu tiền" mà còn là: bài đã đi tới bước nào, đã có mặt ở nền tảng
   nào (đường dẫn đâu), nền tảng nào còn kẹt, và Haustek còn thiếu gì
   từ phía họ. Trong hệ thống thật, trạng thái từng nền tảng về từ phản
   hồi giao nhận (DDEX) của nền tảng đó; bản mẫu sinh xác định từ mã bản
   ghi để hai cổng luôn thấy cùng một trạng thái.
   ===================================================================== */
const DELIV_N = N_TOP + 4;                        /* 8 nền tảng lớn + Amazon Music, Deezer, Tidal, Pandora liệt kê riêng */
const DELIV_NAMES = STORES.slice(0, DELIV_N);
const OTHERS_N = STORES.length - DELIV_N;         /* phần còn lại gộp thành một dòng */
const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function slug(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function maNgauNhien(i, salt, len, bang) {
  let s = "";
  for (let k = 0; k < len; k++) s += bang[(hash(i * 31 + k, salt) * bang.length) | 0];
  return s;
}
const chuSo = (i, salt, len) => maNgauNhien(i, salt, len, "0123456789");
/* Đường dẫn công khai của bản ghi trên từng nền tảng. Facebook và
   Instagram chỉ có thư viện nhạc trong ứng dụng, không có trang riêng. */
function platformUrl(name, i) {
  const t = slug(tTitle[i]) || "track", a = slug(ARTISTS[tArtist[i]].name) || "artist";
  switch (name) {
    case "Spotify":       return "https://open.spotify.com/track/" + maNgauNhien(i, 11, 22, B62);
    case "Apple Music":   return "https://music.apple.com/vn/album/" + t + "/" + chuSo(i, 12, 10) + "?i=" + chuSo(i, 13, 10);
    case "YouTube Music": return "https://music.youtube.com/watch?v=" + maNgauNhien(i, 14, 11, B62 + "-_");
    case "TikTok":        return "https://www.tiktok.com/music/" + t + "-" + chuSo(i, 15, 19);
    case "Zing MP3":      return "https://zingmp3.vn/bai-hat/" + t + "-" + a + "/" + maNgauNhien(i, 16, 8, B62) + ".html";
    case "NhacCuaTui":    return "https://www.nhaccuatui.com/bai-hat/" + t + "-" + a + "." + maNgauNhien(i, 17, 7, B62) + ".html";
    case "Amazon Music":  return "https://music.amazon.com/tracks/B0" + maNgauNhien(i, 18, 8, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    case "Deezer":        return "https://www.deezer.com/track/" + chuSo(i, 19, 9);
    case "Tidal":         return "https://tidal.com/browse/track/" + chuSo(i, 20, 9);
    case "Pandora":       return "https://www.pandora.com/artist/" + a + "/" + t + "/TR" + maNgauNhien(i, 21, 10, B62);
  }
  return null;
}
function isoDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function addDays(iso, n) {
  const d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  d.setDate(d.getDate() + n);
  return isoDate(d);
}
function releaseDateOf(i) {
  const pr = PERIODS[tRel[i]];
  return isoDate(new Date(pr.year, pr.month - 1, 1 + ((hash(i, 41) * 27) | 0)));
}
const LY_DO = {
  rejected: [
    ["Ảnh bìa dưới 3000 × 3000 điểm ảnh", "Artwork below 3000 × 3000 pixels"],
    ["Tên bài hát trên ảnh bìa không khớp metadata", "Title on the artwork does not match the metadata"],
    ["File âm thanh không đạt chuẩn WAV 16-bit / 44,1 kHz", "Audio file is not 16-bit / 44.1 kHz WAV"]
  ],
  pending: [["Nền tảng chưa xác nhận đã nhận bản gửi lại", "The platform has not acknowledged the redelivery yet"]],
  processing: [["Nền tảng đang xử lý, thường mất 1 đến 5 ngày làm việc", "Being processed by the platform, usually 1 to 5 working days"]],
  takedown: [
    ["Gỡ theo yêu cầu của chủ sở hữu", "Taken down at the owner’s request"],
    ["Gỡ do khiếu nại bản quyền, đang xử lý", "Taken down after a rights claim, under review"]
  ]
};
/* nhe = true: chỉ cần trạng thái, bỏ qua đường dẫn và ngày (quét danh mục lớn) */
function deliveryOf(i, nhe) {
  const age = (P - 1) - tRel[i];
  const trouble = hash(i, 42) < 0.18;               /* 18% bản ghi có ít nhất một nền tảng chưa ổn */
  const rel = releaseDateOf(i);
  const rows = DELIV_NAMES.map((name, j) => {
    const h = hash(i, 100 + j);
    let status = "live";
    if (age === 0 && h < 0.35) status = "processing";
    else if (trouble && h < 0.28) status = h < 0.10 ? "rejected" : h < 0.19 ? "pending" : (age >= 3 && h < 0.23 ? "takedown" : "processing");
    if (status === "processing" && age >= 2) status = "pending";
    const r = { name, status };
    if (!nhe) {
      const off = j < N_TOP ? ((hash(i, 200 + j) * 4) | 0) : 2 + ((hash(i, 200 + j) * 9) | 0);
      r.liveAt = status === "live" ? addDays(rel, off) : null;
      r.url = status === "live" ? platformUrl(name, i) : null;
      const ly = LY_DO[status];
      if (ly) { const x = ly[(hash(i, 400 + j) * ly.length) | 0]; r.reason = x[0]; r.reasonEn = x[1]; }
    }
    return r;
  });
  const othersLive = trouble ? OTHERS_N - (3 + ((hash(i, 43) * 14) | 0))
                   : (age === 0 ? OTHERS_N - ((hash(i, 43) * 40) | 0) : OTHERS_N);
  return { releaseDate: rel, rows, others: { count: OTHERS_N, live: othersLive, pending: OTHERS_N - othersLive } };
}
function stepsOf(i, d) {
  const rel = d.releaseDate, age = (P - 1) - tRel[i];
  const liveAt = d.rows.filter(r => r.liveAt).map(r => r.liveAt).sort();
  const live = d.rows.filter(r => r.status === "live").length;
  const anyIssue = d.rows.some(r => r.status === "rejected" || r.status === "takedown");
  const allLive = live === d.rows.length && d.others.pending === 0;
  let firstRep = -1;
  for (let p = tRel[i]; p < P; p++) if (state.approved[PERIODS[p].k] && grossRec(i, p) > 0) { firstRep = p; break; }
  const tongNT = DELIV_N + OTHERS_N;
  /* Marketing là dịch vụ đăng ký thêm: bài không đăng ký thì bước đó ghi
     "không đăng ký" chứ không phải "chưa xong", để đối tác không tưởng
     Haustek bỏ sót. */
  const preSave = hash(i, 50) < 0.5, pitch = hash(i, 51) < 0.6, mkt = hash(i, 49) < 0.3;
  const daLen = age >= 1 || liveAt.length > 0;
  return [
    { key: "hoso", label: "Hồ sơ phát hành", labelEn: "Release submission", status: "done", at: addDays(rel, -28),
      note: "Đã nhận đủ metadata, file âm thanh và ảnh bìa", noteEn: "Metadata, audio and artwork received" },
    { key: "tiepnhan", label: "Tiếp nhận và kiểm tra hồ sơ", labelEn: "Received and checked", status: "done", at: addDays(rel, -26),
      note: "Hồ sơ đủ thông tin để xử lý", noteEn: "Submission complete enough to proceed" },
    { key: "ma", label: "Cấp mã ISRC và UPC", labelEn: "ISRC and UPC assigned", status: "done", at: addDays(rel, -24),
      note: "ISRC " + tIsrc[i] + " · UPC " + tUpc[i], noteEn: "ISRC " + tIsrc[i] + " · UPC " + tUpc[i] },
    { key: "noidung", label: "Kiểm tra nội dung, bản quyền và Content ID", labelEn: "Content, rights and Content ID check", status: "done", at: addDays(rel, -21),
      note: "Không phát hiện trùng bản ghi hay tranh chấp quyền; đã đăng ký tham chiếu Content ID", noteEn: "No duplicate or rights conflict found; Content ID reference registered" },
    { key: "lich", label: "Lên lịch phát hành và đặt trước (pre-save)", labelEn: "Release scheduling and pre-save", status: preSave ? "done" : "skip", at: preSave ? addDays(rel, -18) : null,
      note: preSave ? "Ngày phát hành " + fmt.date(rel) + " · đã mở đặt trước trên Spotify và Apple Music" : "Không đăng ký đặt trước; ngày phát hành " + fmt.date(rel),
      noteEn: preSave ? "Release date " + fmt.date(rel) + " · pre-save open on Spotify and Apple Music" : "No pre-save; release date " + fmt.date(rel) },
    { key: "gui", label: "Gửi tới các nền tảng", labelEn: "Delivered to platforms", status: "done", at: addDays(rel, -14),
      note: "Đã gửi tới " + tongNT + " nền tảng", noteEn: "Delivered to " + tongNT + " platforms" },
    { key: "pitch", label: "Đề xuất playlist biên tập", labelEn: "Editorial playlist pitch", status: pitch ? "done" : "skip", at: pitch ? addDays(rel, -10) : null,
      note: pitch ? "Đã gửi đề xuất tới Spotify, Apple Music và Zing MP3 trước ngày phát hành" : "Không đăng ký; có thể yêu cầu Haustek hỗ trợ cho bản phát hành tiếp theo",
      noteEn: pitch ? "Pitched to Spotify, Apple Music and Zing MP3 ahead of release" : "Not requested; you can ask Haustek for the next release" },
    { key: "len", label: "Có mặt trên nền tảng", labelEn: "Live on platforms",
      status: anyIssue ? "issue" : (allLive ? "done" : "doing"), at: liveAt.length ? liveAt[0] : null,
      note: live + "/" + d.rows.length + " nền tảng lớn đã lên · " + d.others.live + "/" + d.others.count + " nền tảng khác",
      noteEn: live + "/" + d.rows.length + " major platforms live · " + d.others.live + "/" + d.others.count + " others" },
    { key: "marketing", label: "Chiến dịch marketing sau phát hành", labelEn: "Post-release marketing campaign",
      status: mkt ? (age >= 2 ? "done" : "doing") : "skip", at: mkt ? addDays(rel, 1) : null,
      note: mkt ? (age >= 2 ? "Đã chạy 4 tuần: quảng cáo TikTok và Instagram, nội dung mạng xã hội, gửi báo chí" : "Đang chạy: quảng cáo TikTok và Instagram, nội dung mạng xã hội")
                : "Không đăng ký gói marketing; Haustek có thể chạy quảng cáo, nội dung mạng xã hội và gửi báo chí theo yêu cầu",
      noteEn: mkt ? (age >= 2 ? "4-week campaign done: TikTok and Instagram ads, social content, press" : "Running: TikTok and Instagram ads, social content")
                  : "No marketing package; Haustek can run ads, social content and press on request" },
    { key: "theodoi", label: "Theo dõi và tối ưu", labelEn: "Monitoring and optimisation",
      status: anyIssue ? "issue" : (daLen ? (age >= 1 ? "done" : "doing") : "todo"), at: daLen ? addDays(rel, 7) : null,
      note: anyIssue ? "Có nền tảng từ chối hoặc gỡ bản ghi, đang xử lý" : "Theo dõi Content ID, playlist, lỗi hiển thị và lượt nghe hằng ngày",
      noteEn: anyIssue ? "A platform rejected or took the recording down; being handled" : "Watching Content ID, playlists, display errors and daily streams" },
    { key: "baocao", label: "Báo cáo doanh thu", labelEn: "Revenue reporting",
      status: firstRep >= 0 ? "done" : (age <= 2 ? "doing" : "todo"),
      at: null,
      note: firstRep >= 0 ? "Có báo cáo từ kỳ " + PERIODS[firstRep].label
          : (age <= 2 ? "Nền tảng báo cáo doanh thu sau 1 đến 3 tháng kể từ ngày phát hành; xem dự báo từ lượt nghe hằng ngày trong lúc chờ" : "Chưa có nền tảng nào báo cáo doanh thu cho bản ghi này"),
      noteEn: firstRep >= 0 ? "Reported from " + PERIODS[firstRep].label
          : (age <= 2 ? "Platforms report revenue 1 to 3 months after release; see the daily-stream forecast meanwhile" : "No platform has reported revenue for this recording yet") }
  ];
}
function missingOf(i, d) {
  const out = [];
  const add = (key, muc, label, labelEn, viec, viecEn) => out.push({ key, muc, label, labelEn, viec, viecEn });
  d.rows.forEach(r => {
    const ly = r.reason || (LY_DO[r.status] ? LY_DO[r.status][0][0] : ""), lyEn = r.reasonEn || (LY_DO[r.status] ? LY_DO[r.status][0][1] : "");
    if (r.status === "rejected")
      add("tuchoi:" + r.name, "chan", r.name + " từ chối bản ghi: " + ly, r.name + " rejected the recording: " + lyEn,
        "Sửa theo lý do bên cạnh rồi gửi lại; Haustek gửi lại nền tảng trong đợt tiếp theo", "Fix the reason shown and resubmit; Haustek redelivers in the next batch");
    else if (r.status === "pending")
      add("chogui:" + r.name, "canh", r.name + " chưa xác nhận đã nhận bản ghi", r.name + " has not acknowledged the delivery",
        "Haustek theo dõi và gửi lại nếu quá 10 ngày chưa có xác nhận", "Haustek follows up and redelivers after 10 days without acknowledgement");
    else if (r.status === "takedown")
      add("go:" + r.name, "canh", r.name + " đã gỡ bản ghi: " + ly, r.name + " took the recording down: " + lyEn,
        "Liên hệ Haustek nếu cần khôi phục", "Contact Haustek to restore it");
  });
  if (d.others.pending > 0)
    add("khac", "goiY", d.others.pending + " nền tảng nhỏ chưa xác nhận đã nhận bản ghi", d.others.pending + " smaller platforms have not acknowledged yet",
      "Không ảnh hưởng đáng kể tới doanh thu; trạng thái tự cập nhật", "Negligible revenue impact; the status updates itself");
  if (tIsrcAlt[i])
    add("isrc2", "canh", "Bản ghi mang hai mã ISRC: " + tIsrc[i] + " và " + tIsrcAlt[i], "Two ISRCs on this recording: " + tIsrc[i] + " and " + tIsrcAlt[i],
      "Haustek gộp báo cáo của hai mã; xác nhận với Haustek nếu một mã không còn dùng", "Haustek merges reports for both codes; tell Haustek if one code is retired");
  if (tProd[i] > 0 && hash(i, 44) < 0.4)
    add("producer", "canh", "Producer chưa có mã đối tác để nhận điểm producer", "The producer has no client ID to receive producer points",
      "Cung cấp mã đối tác của producer để Haustek thanh toán " + fmt.pct(tProd[i]) + " điểm producer đang giữ lại", "Provide the producer’s client ID so Haustek can pay the " + fmt.pct(tProd[i]) + " producer points on hold");
  if (hash(i, 45) < 0.08)
    add("loi", "goiY", "Chưa có lời bài hát", "Lyrics not supplied",
      "Thêm lời để Spotify và Apple Music hiển thị lời và gợi ý bài hát tốt hơn", "Add lyrics so Spotify and Apple Music can show them and recommend the track");
  if (hash(i, 46) < 0.04)
    add("ngonngu", "canh", "Chưa khai ngôn ngữ của lời", "Lyric language not declared",
      "Khai ngôn ngữ để nền tảng xếp bài hát đúng thị trường", "Declare the language so platforms place the track in the right market");
  if (tW2[i] >= 0 && hash(i, 47) < 0.15)
    add("dongsangtac", "goiY", "Người đồng sáng tác " + ARTISTS[tW2[i]].name + " chưa xác nhận tỷ lệ chia tác quyền", "Co-writer " + ARTISTS[tW2[i]].name + " has not confirmed the writer split",
      "Tác quyền của bài hát này được giữ lại cho tới khi hai bên xác nhận", "Publishing for this track is held until both writers confirm");
  if (hash(i, 48) < 0.06)
    add("nxb", "goiY", "Chưa khai nhà xuất bản tác quyền", "Publisher not declared",
      "Khai nhà xuất bản để tác quyền quốc tế về đúng địa chỉ", "Declare the publisher so international publishing reaches the right party");
  return out;
}
function assetSummary(i) {
  const d = deliveryOf(i, true);
  const miss = missingOf(i, d);
  const live = d.rows.filter(r => r.status === "live").length;
  const issue = d.rows.some(r => r.status === "rejected" || r.status === "takedown") || miss.some(m => m.muc === "chan");
  const wait = d.rows.some(r => r.status === "processing" || r.status === "pending");
  /* "còn thiếu" là việc phải làm (chặn hoặc cảnh báo); gợi ý đếm riêng */
  const missing = miss.filter(m => m.muc !== "goiY").length;
  return { stage: issue ? "issue" : wait ? "processing" : "live", live, total: DELIV_N, missing, hints: miss.length - missing, releaseDate: d.releaseDate };
}
/* Hồ sơ đầy đủ của một bản ghi cho người xem: bước, nền tảng, còn thiếu,
   ma trận nền tảng × kỳ. Nội bộ thấy mọi kỳ; đối tác chỉ thấy kỳ đã duyệt. */
function assetOf(i, role, partyId) {
  const d = deliveryOf(i, false);
  const steps = stepsOf(i, d), missing = missingOf(i, d);
  const isAdmin = role === "admin";
  const pList = [];
  for (let p = 0; p < P; p++) if (isAdmin || state.approved[PERIODS[p].k]) pList.push(p);
  const mx = trackMatrix(i, pList, role, partyId);
  /* con số cạnh từng nền tảng: kỳ gần nhất có trong danh sách */
  const lastP = pList.length ? pList[pList.length - 1] : -1;
  let gv = null, sv = null, mv = null;
  if (lastP >= 0) {
    const col = pList.length - 1;
    gv = mx.rows.map(r => r.revenue[col]); sv = mx.rows.map(r => r.streams[col]); mv = mx.rows.map(r => r.mine[col]);
  }
  /* con số cạnh nền tảng chỉ hiện khi nền tảng đang lên; nền tảng bị từ
     chối, đã gỡ hay chưa xác nhận không có số của kỳ gần nhất (ma trận theo
     tháng vẫn giữ số các kỳ trước, vì đó là lịch sử) */
  const platforms = d.rows.map((r, j) => Object.assign({}, r, (j < N_TOP && gv && r.status === "live")
    ? { streams: sv[j], revenue: gv[j], mine: mv[j] } : { streams: null, revenue: null, mine: null }));
  const life = { revenue: 0, mine: 0, streams: 0 };
  mx.totals.revenue.forEach((v, k) => { life.revenue += v; life.mine += mx.totals.mine[k]; life.streams += mx.totals.streams[k]; });
  const live = d.rows.filter(r => r.status === "live").length;
  const issue = d.rows.some(r => r.status === "rejected" || r.status === "takedown") || missing.some(m => m.muc === "chan");
  const wait = d.rows.some(r => r.status === "processing" || r.status === "pending");
  const writers = [ARTISTS[tW1[i]].name];
  if (tW2[i] >= 0) writers.push(ARTISTS[tW2[i]].name);
  return {
    id: i, title: tTitle[i], isrc: tIsrc[i], isrcAlt: tIsrcAlt[i] || null, upc: tUpc[i], type: TYPES[tType[i]],
    artist: ARTISTS[tArtist[i]].name, artistClientId: ARTISTS[tArtist[i]].clientId,
    label: tLabel[i] >= 0 ? LABELS[tLabel[i]].name : null, labelClientId: tLabel[i] >= 0 ? LABELS[tLabel[i]].clientId : null,
    releaseDate: d.releaseDate, releasePeriod: PERIODS[tRel[i]].label,
    credits: { writers, producerPts: tProd[i] > 0 ? Math.round(tProd[i] * 1000) / 1000 : 0 },
    summary: { stage: issue ? "issue" : wait ? "processing" : "live", live, total: DELIV_N,
               missing: missing.filter(m => m.muc !== "goiY").length, hints: missing.filter(m => m.muc === "goiY").length },
    steps, missing, platforms, others: d.others,
    monthly: { periods: pList.map(p => ({ k: PERIODS[p].k, label: PERIODS[p].label, open: !!state.approved[PERIODS[p].k] })), rows: mx.rows, totals: mx.totals },
    lifetime: { revenue: cents(life.revenue), mine: cents(life.mine), streams: life.streams },
    lastPeriod: lastP >= 0 ? PERIODS[lastP].label : null
  };
}
/* Danh mục theo góc nhìn phát hành: mọi bản ghi trong phạm vi, kể cả bản
   chưa có doanh thu, kèm trạng thái quy trình và doanh thu tích luỹ của các
   kỳ đã xét duyệt. Lọc, sắp xếp và phân trang ngay tại đây để gói dữ liệu
   gửi xuống trình duyệt nhỏ. */
function catalogueOf(role, partyId, opts) {
  opts = opts || {};
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const q = (opts.q || "").trim().toLowerCase();
  const daDuyet = [];
  for (let p = 0; p < P; p++) if (state.approved[PERIODS[p].k]) daDuyet.push(p);
  const rows = [], counts = { all: n, live: 0, processing: 0, issue: 0, missing: 0 };
  for (let k = 0; k < n; k++) {
    const i = sc ? sc[k] : k;
    const s = assetSummary(i);
    counts[s.stage]++;
    if (s.missing) counts.missing++;
    if (opts.stage === "missing" ? !s.missing : (opts.stage && s.stage !== opts.stage)) continue;
    if (q && !(tTitle[i].toLowerCase().includes(q) || tIsrc[i].toLowerCase().includes(q)
               || ARTISTS[tArtist[i]].name.toLowerCase().includes(q))) continue;
    let g = 0, st = 0;
    for (const p of daDuyet) { g += revenueOf(i, p, role); st += recStreams[i * P + p]; }
    rows.push({ id: i, title: tTitle[i], isrc: tIsrc[i], type: TYPES[tType[i]], artist: ARTISTS[tArtist[i]].name,
      label: tLabel[i] >= 0 ? LABELS[tLabel[i]].name : null,
      releaseDate: s.releaseDate, releasePeriod: PERIODS[tRel[i]].label,
      stage: s.stage, live: s.live, total: s.total, missing: s.missing, hints: s.hints, revenue: cents(g), streams: st });
  }
  const key = opts.sort || "releaseDate", dir = opts.dir === 1 ? 1 : -1;
  rows.sort((a, b) => {
    const A = a[key], B = b[key];
    return typeof A === "string" ? A.localeCompare(B, "vi") * dir : ((A || 0) - (B || 0)) * dir;
  });
  const offset = Math.max(0, opts.offset | 0), limit = Math.min(200, Math.max(1, opts.limit || 25));
  return { total: rows.length, counts, offset, limit, rows: rows.slice(offset, offset + limit) };
}

/* =====================================================================
   14d. LABEL MẸ / LABEL CON
   ---------------------------------------------------------------------
   Label lớn có thể có các label con, mỗi label con là một tài khoản riêng
   với roster riêng và tỷ lệ riêng. Label mẹ theo dõi được toàn bộ cây bên
   dưới: từng label con, từng nghệ sĩ của label con, và xem được cổng của
   label con với tư cách người được uỷ quyền.

   Tiền KHÔNG đổi chủ theo cây này: phần label được hưởng của một bản ghi
   thuộc về label trực tiếp quản lý bản ghi đó. Label mẹ có được hưởng
   phần nào trên doanh thu của label con hay không là câu hỏi cần chốt
   số 9; bản mẫu giả định không.
   ===================================================================== */
function labelChildren(labelId) { return LABELS.filter(l => l.parentId === labelId); }
function canViewAs(role, partyId, labelId) {
  return role === "label" && LABELS[labelId] && (labelId === partyId || LABELS[labelId].parentId === partyId);
}
function labelSlice(lid, p) {
  const pk = PERIODS[p].k, l = LABELS[lid];
  const ids = idxOf(byLabel, lid);
  const per = new Map();
  let earning = 0, streams = 0, revenue = 0, artist = 0, labelCut = 0;
  for (const i of ids) {
    const g = grossRec(i, p);
    if (g <= 0) continue;
    const sp = splitRec(i, g, pk), a = tArtist[i];
    let o = per.get(a);
    if (!o) { o = { artistId: a, name: ARTISTS[a].name, clientId: ARTISTS[a].clientId, catalogue: idxOf(byArtist, a).length, tracks: 0, streams: 0, revenue: 0, artist: 0, labelCut: 0 }; per.set(a, o); }
    o.tracks++; o.streams += recStreams[i * P + p]; o.revenue += sp.net; o.artist += sp.artist + sp.producer; o.labelCut += sp.labelCut;
    earning++; streams += recStreams[i * P + p]; revenue += sp.net; artist += sp.artist + sp.producer; labelCut += sp.labelCut;
  }
  const artists = [];
  ARTISTS.forEach(a => {
    if (a.labelId !== lid) return;
    const o = per.get(a.id) || { artistId: a.id, name: a.name, clientId: a.clientId, catalogue: idxOf(byArtist, a.id).length, tracks: 0, streams: 0, revenue: 0, artist: 0, labelCut: 0 };
    o.revenue = cents(o.revenue); o.artist = cents(o.artist); o.labelCut = cents(o.labelCut);
    artists.push(o);
  });
  artists.sort((x, y) => y.revenue - x.revenue || x.name.localeCompare(y.name, "vi"));
  return { labelId: lid, name: l.name, clientId: l.clientId, parentId: l.parentId,
    rate: rates.rateFor(l.key, pk), artistsCount: artists.length, tracks: ids.length, earning,
    earningArtists: per.size, streams, revenue: cents(revenue), artist: cents(artist), labelCut: cents(labelCut),
    artists };
}
function labelTreeOf(labelId, p) {
  const me = labelSlice(labelId, p);
  const children = labelChildren(labelId).map(l => labelSlice(l.id, p));
  const total = { artists: me.artistsCount, tracks: me.tracks, earning: me.earning, streams: me.streams, revenue: me.revenue, artist: me.artist, labelCut: me.labelCut };
  children.forEach(ch => { total.artists += ch.artistsCount; total.tracks += ch.tracks; total.earning += ch.earning; total.streams += ch.streams;
    total.revenue = cents(total.revenue + ch.revenue); total.artist = cents(total.artist + ch.artist); total.labelCut = cents(total.labelCut + ch.labelCut); });
  /* doanh thu (sau phí) qua các kỳ đã xét duyệt, tách label mẹ và từng label con */
  const history = [];
  for (let q = 0; q < P; q++) {
    if (!state.approved[PERIODS[q].k]) continue;
    const sum = lid => { let s = 0; for (const i of idxOf(byLabel, lid)) s += revenueOf(i, q, "label"); return cents(s); };
    history.push({ k: PERIODS[q].k, label: PERIODS[q].label, own: sum(labelId), children: children.map(ch => sum(ch.labelId)) });
  }
  const parent = LABELS[labelId].parentId >= 0 ? LABELS[LABELS[labelId].parentId] : null;
  return { me: { labelId, name: me.name, clientId: me.clientId, rate: me.rate },
    parent: parent ? { labelId: parent.id, name: parent.name, clientId: parent.clientId } : null,
    own: me, children, total, history };
}

/* =====================================================================
   15. ĐỐI CHIẾU
   Tổng trên file gốc = phần đã khớp + phần treo. Chênh lệch phải bằng 0
   tới từng xu; nếu không, hoặc là parser sai, hoặc là file thiếu dòng —
   cả hai đều không được để lọt sang bước duyệt kỳ.
   ===================================================================== */
function feedTotals(pIdx, fId) {
  const pk = PERIODS[pIdx].k;
  let attributed = 0;
  for (let i = 0; i < N; i++) attributed += grossRecByFeed(i, pIdx, fId);
  attributed = cents(attributed);
  const pending = cents(state.queue
    .filter(q => q.periodKey === pk && q.feedId === fId && q.status === "pending")
    .reduce((s, q) => s + q.amount, 0));
  /* Khoản truy thu của kỳ khác đang được ghi vào kỳ này KHÔNG có trong file
     của kỳ này — phải trừ ra khỏi con số đem đi so với file gốc, không thì
     đối chiếu báo lệch trong khi chẳng có gì sai. */
  const adjustments = cents(state.queue
    .filter(q => q.status === "matched" && q.intoPeriod === pk && q.feedId === fId)
    .reduce((s, q) => s + q.amount, 0));
  const fromFile = cents(attributed - adjustments);
  const vKey = pk + ":" + fId;
  const injected = state.variance[vKey] ? 0 : builtinVariance(pIdx, fId);
  const control = cents(fromFile + pending + injected);
  return { attributed, adjustments, fromFile, pending, control,
           diff: cents(control - fromFile - pending),
           accepted: state.variance[vKey] || null };
}
/* một kỳ cố tình lệch, để thấy quy trình xử lý chênh lệch chứ không chỉ
   thấy màn hình toàn dấu tích xanh */
function builtinVariance(pIdx, fId) {
  return (pIdx === P - 2 && fId === 1) ? 41.37 : 0;
}
function recon(pIdx) {
  const rows = FEEDS.map(f => {
    const st = state.feeds[PERIODS[pIdx].k][f.id];
    const t = st.status === "loaded" ? feedTotals(pIdx, f.id)
            : { attributed: 0, adjustments: 0, fromFile: 0, pending: 0, control: 0, diff: 0, accepted: null };
    return { feed: f, status: st.status, at: st.at, file: st.file, ...t };
  });
  const sum = k => cents(rows.reduce((s, r) => s + (r[k] || 0), 0));
  return { rows, attributed: sum("attributed"), adjustments: sum("adjustments"),
           fromFile: sum("fromFile"), pending: sum("pending"),
           control: sum("control"), diff: sum("diff") };
}

/* =====================================================================
   16. DUYỆT KỲ — cánh cửa duy nhất mở số liệu cho khách
   ===================================================================== */
function approvalChecks(pIdx) {
  const pk = PERIODS[pIdx].k;
  const miss = missingFeeds(pIdx);
  const r = recon(pIdx);
  const a = agg("admin", 0, pIdx, "rec");
  const pendingAmt = r.pending;
  const ratio = a.gross > 0 ? pendingAmt / a.gross : 0;
  const unresolvedDiff = r.rows.filter(x => Math.abs(x.diff) > 0.005 && !x.accepted);
  return [
    { id: "feeds", ok: miss.length === 0, label: "Đủ " + FEEDS.length + " nguồn báo cáo",
      detail: miss.length ? "Còn thiếu: " + miss.map(f => f.name).join(", ") : "Đủ cả " + FEEDS.length + " nguồn",
      labelEn: "All " + FEEDS.length + " data feeds loaded",
      detailEn: miss.length ? "Still missing: " + miss.map(f => f.nameEn).join(", ") : "All " + FEEDS.length + " feeds are in" },
    { id: "recon", ok: unresolvedDiff.length === 0, label: "Đối soát khớp tới từng xu",
      detail: unresolvedDiff.length ? unresolvedDiff.map(x => x.feed.short + " chênh lệch " + fmt.usd(x.diff)).join(" · ")
                                    : "Tổng trên hệ thống khớp với file gốc",
      labelEn: "Reconciliation balances to the cent",
      detailEn: unresolvedDiff.length ? unresolvedDiff.map(x => x.feed.shortEn + " out by " + fmt.usd(x.diff)).join(" · ")
                                      : "The system total matches the source files" },
    { id: "queue", ok: ratio <= CFG.BLACKBOX_CAP, label: "Tiền chưa khớp dưới " + (CFG.BLACKBOX_CAP * 100).toFixed(1) + "% doanh thu kỳ",
      detail: fmt.usd(pendingAmt) + " chưa khớp ISRC · " + (ratio * 100).toFixed(2) + "% doanh thu kỳ",
      labelEn: "Money on hold under " + (CFG.BLACKBOX_CAP * 100).toFixed(1) + "% of period revenue",
      detailEn: fmt.usd(pendingAmt) + " on hold · " + (ratio * 100).toFixed(2) + "% of period revenue" },
    { id: "fx", ok: !!state.fx.locked[pk], label: "Đã chốt tỷ giá cho kỳ",
      detail: state.fx.locked[pk] ? "1 USD = " + fmt.num(state.fx.locked[pk].rate) + " ₫ · chốt " + state.fx.locked[pk].at
                                  : "Chưa chốt tỷ giá. Số quy đổi sang VND sẽ thay đổi theo tỷ giá hôm nay.",
      labelEn: "FX rate locked for the period",
      detailEn: state.fx.locked[pk] ? "1 USD = " + fmt.num(state.fx.locked[pk].rate) + " ₫ · locked " + state.fx.locked[pk].at
                                    : "Not locked — VND figures will drift with today’s rate" }
  ];
}
function canApprove(pIdx) { return approvalChecks(pIdx).every(c => c.ok); }

/* Kỳ phải đóng theo thứ tự. Phần tiền dưới ngưỡng chi trả được dồn từ kỳ
   này sang kỳ sau, và tạm ứng thu hồi dần qua từng kỳ — duyệt nhảy cóc thì
   hai chuỗi đó đứt, và không có cách nào phát hiện ra sau khi đã chi tiền. */
function approve(pIdx, by, note, force) {
  const pk = PERIODS[pIdx].k;
  if (state.approved[pk]) throw new Error("Kỳ " + pk + " đã được xét duyệt");
  const openBefore = PERIODS.slice(0, pIdx).filter(p => !state.approved[p.k]);
  if (openBefore.length)
    throw new Error("Phải xét duyệt xong các kỳ trước: " + openBefore.map(p => p.label).join(", ")
      + ", vì phần chuyển sang kỳ sau và thu hồi tạm ứng chạy nối tiếp qua từng kỳ");
  const checks = approvalChecks(pIdx);
  const failed = checks.filter(c => !c.ok);
  if (failed.length && !force) throw new Error("Chưa đủ điều kiện xét duyệt: " + failed.map(c => c.label).join(" · "));
  state.approved[pk] = { at: nowISO(), by: by || "admin", note: note || "",
                         overrides: failed.map(c => c.id) };
  state.payouts[pk] = runPayout(pIdx, true);
  state.publishedAt = nowISO();
  audit.log("period.approve", "Xét duyệt kỳ " + PERIODS[pIdx].label + (failed.length ? " (ghi nhận ngoại lệ: " + failed.map(c => c.label).join(", ") + ")" : ""));
  store.save();
  return state.payouts[pk];
}
function revoke(pIdx, why) {
  const pk = PERIODS[pIdx].k;
  if (!state.approved[pk]) return;
  const approvedAfter = PERIODS.slice(pIdx + 1).filter(p => state.approved[p.k]);
  if (approvedAfter.length)
    throw new Error("Phải huỷ xét duyệt các kỳ sau trước: " + approvedAfter.map(p => p.label).join(", ")
      + ", vì các kỳ sau đã tính dựa trên kết quả của kỳ này");
  /* Trả lại đúng trạng thái trước khi duyệt: hoàn phần đã thu hồi tạm ứng
     (không thì kỳ sau thu hồi hai lần) và trả phần dồn về đúng số dồn VÀO
     kỳ này, chứ không phải xoá trắng — xoá trắng là làm mất tiền của người ta. */
  (state.payouts[pk] || []).forEach(row => {
    const adv = state.advances[row.partyKey];
    if (adv && adv.byPeriod) delete adv.byPeriod[pk];
    if (row.carryIn > 0) state.carry[row.partyKey] = row.carryIn;
    else delete state.carry[row.partyKey];
  });
  delete state.payouts[pk]; delete state.approved[pk];
  state.publishedAt = nowISO();
  audit.log("period.revoke", "Huỷ xét duyệt kỳ " + PERIODS[pIdx].label + (why ? " · " + why : ""));
  store.save();
}

/* =====================================================================
   17. CHI TRẢ & THU HỒI TẠM ỨNG
   Ai đã nhận tạm ứng thì tiền kỳ này đi trừ dần vào khoản đã ứng, chưa
   về tay họ. Dưới ngưỡng chi trả thì dồn sang kỳ sau chứ không mất.
   ===================================================================== */
function advanceBalance(partyKey) {
  const a = state.advances[partyKey];
  if (!a) return 0;
  const used = Object.values(a.byPeriod || {}).reduce((s, v) => s + v, 0);
  return cents(Math.max(a.opening - used, 0));
}
function earnedByParty(pIdx) {
  const out = new Map();
  const pk = PERIODS[pIdx].k;
  const add = (key, v) => out.set(key, cents((out.get(key) || 0) + v));
  for (let i = 0; i < N; i++) {
    const g = grossRec(i, pIdx);
    if (g <= 0) continue;
    const s = splitRec(i, g, pk);
    const lb = tLabel[i];
    if (lb >= 0) { add("L:" + lb, s.labelCut); add("A:" + tArtist[i], s.artist); }
    else add("A:" + tArtist[i], s.artist);
    if (s.producer > 0) add("P:" + i, s.producer);   /* producer gom theo bài, gộp lại ở bước chi */
  }
  if (pubLoaded(pIdx)) {
    for (let i = 0; i < N; i++) {
      const g = grossPub(i, pIdx);
      if (g <= 0) continue;
      const net = cents(g * (1 - CFG.PUB_FEE));
      add("A:" + tW1[i], cents(net * tW1s[i]));
      if (tW2[i] >= 0) add("A:" + tW2[i], cents(net * (1 - tW1s[i])));
    }
  }
  return out;
}
/* GHI vào sổ: đặt lượt thu hồi tạm ứng và phần dồn sang kỳ sau. Chỉ được
   gọi từ approve(). Gọi lạc một lần ngoài đó là ghi khống một lượt thu hồi
   cho kỳ chưa duyệt — và vì lần chạy sau thấy dư nợ đã trừ rồi nên nó
   không ghi đè lại, kết quả là sổ tạm ứng nói đã thu còn bảng chi trả nói
   chưa trừ. Bên ngoài muốn xem trước thì dùng previewPayout(). */
function runPayout(pIdx, ghi) {
  const pk = PERIODS[pIdx].k;
  const earned = earnedByParty(pIdx);
  const rows = [];
  /* Điểm producer đã trừ khỏi phần nghệ sĩ, nhưng danh mục hiện tại chỉ có
     cột Producer ghi TÊN, không có mã. Không có mã thì không biết trả cho
     ai, nên khoản này phải nằm lại một dòng riêng và nhìn thấy được — chứ
     không phải lặng lẽ biến mất khỏi bảng chi trả.
     Đây chính là câu hỏi số 3 còn treo: một cột Rate Share có đủ không,
     hay phải tách bảng chia phần mỗi dòng một người. */
  let producerHeld = 0;
  earned.forEach((amount, key) => { if (key[0] === "P") producerHeld = cents(producerHeld + amount); });
  earned.forEach((amount, key) => {
    if (key[0] === "P") return;
    const carryIn = state.carry[key] || 0;
    const gross = cents(amount + carryIn);
    const bal = advanceBalance(key);
    const recoup = cents(Math.min(bal, gross));
    const after = cents(gross - recoup);
    const payable = after >= CFG.PAYOUT_MIN ? after : 0;
    const carryOut = after >= CFG.PAYOUT_MIN ? 0 : after;
    if (ghi && recoup > 0) {
      const adv = state.advances[key];
      adv.byPeriod = adv.byPeriod || {}; adv.byPeriod[pk] = recoup;
    }
    if (ghi) state.carry[key] = carryOut;
    rows.push({ partyKey: key, kind: key[0] === "L" ? "label" : "artist",
                earned: amount, carryIn, recoup, payable, carryOut,
                advanceLeft: cents(Math.max(bal - recoup, 0)) });
  });
  rows.sort((a, b) => b.payable - a.payable);
  if (producerHeld > 0) rows.push({
    partyKey: "P:*", kind: "producer", held: true,
    earned: producerHeld, carryIn: 0, recoup: 0, payable: 0, carryOut: producerHeld, advanceLeft: 0,
    note: "Chưa xác định người thụ hưởng: danh mục chỉ có tên producer, chưa có mã"
  });
  return rows;
}

/* =====================================================================
   18. TÀI KHOẢN — quyền bám MÃ SỐ, không bao giờ bám tên chữ
   "nae & de'lay", "ling:chi", "HƯƠNGMYBÔNG" sai một dấu là nghệ sĩ mất
   tiền hoặc nhìn thấy dữ liệu người khác.
   ===================================================================== */
function seedAccounts() {
  if (state.accounts.length) return;
  const mk = (email, role, partyKey, status) => ({
    id: "U" + String(state.accounts.length + 1).padStart(4, "0"),
    email, role, partyKey, status: status || "active",
    createdAt: "2026-08-01", lastSeen: null, mfa: role === "admin"
  });
  state.accounts.push(mk("mgmt@haustek-group.com", "admin", null));
  state.accounts.push(mk("ops@haustek-group.com", "admin", null));
  [0, 1, 2, 3].forEach(i => state.accounts.push(mk("label" + (i + 1) + "@vidu.vn", "label", LABELS[i].key)));
  /* Chọn tài khoản nghệ sĩ sao cho phủ đủ các trường hợp phải thử: thuộc
     label, độc lập, có phần sáng tác, không có phần sáng tác, đang còn nợ
     tạm ứng. Tên có ký tự lạ nằm ở nhóm đầu danh mục nên lấy luôn. */
  const wanted = [];
  const enough = i => idxOf(byArtist, i).length >= 12;
  const want = (test, n) => { let c = 0; for (let i = 0; i < REAL.length && c < n; i++) if (!wanted.includes(i) && enough(i) && test(ARTISTS[i])) { wanted.push(i); c++; } };
  want(a => a.labelId >= 0 && a.writer, 3);
  want(a => a.labelId < 0 && a.writer, 2);
  want(a => a.labelId < 0 && !a.writer, 1);
  want(a => a.labelId >= 0 && !a.writer, 1);
  wanted.forEach((i, n) => state.accounts.push(mk("nghesi" + (n + 1) + "@vidu.vn", "artist", ARTISTS[i].key)));
  state.accounts.push(mk("cho-moi@vidu.vn", "artist", ARTISTS[5].key, "invited"));
  /* Hai label con của label mẫu đầu tiên, để thấy cả góc nhìn label mẹ
     (cây label, xem thay) lẫn góc nhìn label con (tên label mẹ trên hợp đồng). */
  state.accounts.push(mk("labelcon1@vidu.vn", "label", LABELS[10].key));
  state.accounts.push(mk("labelcon2@vidu.vn", "label", LABELS[20].key));
  store.save();
}
seedAccounts();

/* Vài hồ sơ phát hành mẫu cho các tài khoản mẫu, ở đủ các bước, để trang
   Phát hành ở cả hai cổng không trống ngay lần mở đầu. */
function seedReleases() {
  if (!state.releases) state.releases = [];
  if (state.releases.length) return;
  const artists = state.accounts.filter(a => a.role === "artist" && a.status === "active")
    .map(a => +a.partyKey.slice(2)).filter(id => ARTISTS[id]);
  const labels = state.accounts.filter(a => a.role === "label" && a.status === "active")
    .map(a => +a.partyKey.slice(2)).filter(id => LABELS[id]);
  if (!artists.length) return;
  /* Xen nghệ sĩ thuộc label có tài khoản mẫu, để cổng của label cũng có
     hồ sơ để xem, không chỉ cổng của nghệ sĩ. */
  const cuaLabel = [];
  ARTISTS.forEach(a => { if (cuaLabel.length < 3 && labels.indexOf(a.labelId) >= 0 && artists.indexOf(a.id) < 0) cuaLabel.push(a.id); });
  const xen = [];
  for (let i = 0; i < 6; i++) xen.push(i % 2 === 0 ? artists[(i / 2) % artists.length] : (cuaLabel[(i - 1) / 2 % Math.max(1, cuaLabel.length)] ?? artists[i % artists.length]));
  const pick = (arr, i) => xen[i % xen.length];
  const mau = [
    { artist: pick(artists, 0), title: "Đêm thứ hai", type: "ep", date: "2026-10-03", genre: "Alternative", status: "released",
      tracks: [["Đêm thứ hai", "Lam Nguyên"], ["Vọng", "Lam Nguyên"], ["Trôi", ""]] },
    { artist: pick(artists, 1), title: "Lặng", type: "single", date: "2026-09-26", genre: "Pop", status: "coded",
      tracks: [["Lặng", "Thu Diệp"]] },
    { artist: pick(artists, 2), title: "Tần số cuối", type: "single", date: "2026-10-17", genre: "Electronic", status: "received",
      tracks: [["Tần số cuối", "ResQ"]] },
    { artist: pick(artists, 3), title: "Mưa tháng sáu (Live)", type: "single", date: "2026-10-24", genre: "Indie", status: "submitted",
      tracks: [["Mưa tháng sáu", ""]] },
    { artist: pick(artists, 4), title: "Khói", type: "album", date: "2026-11-14", genre: "R&B", status: "submitted",
      tracks: [["Khói", "Minh Hạo"], ["Xa", "Minh Hạo"], ["Bóng", ""], ["Chậm", "Khuê Trang"], ["Nghiêng", ""]] },
    { artist: pick(artists, 5), title: "Vệt nắng", type: "single", date: "2026-09-19", genre: "Pop", status: "returned",
      tracks: [["Vệt nắng", "Sơn Bảo"]], note: "Thiếu đường dẫn file WAV của track 1 và tên thật của người viết lời. Bổ sung rồi gửi lại." }
  ];
  const ngay = ["2026-08-11 09:42:00", "2026-08-14 15:10:00", "2026-08-19 10:05:00", "2026-08-25 16:48:00", "2026-08-28 11:30:00", "2026-09-01 08:55:00"];
  mau.forEach((m, k) => {
    const a = ARTISTS[m.artist];
    /* Hồ sơ của nghệ sĩ thuộc label: cứ hồ sơ thứ hai là do label gửi thay */
    const byLabel = a.labelId >= 0 && k % 2 === 1 && labels.indexOf(a.labelId) >= 0;
    const by = byLabel ? LABELS[a.labelId].clientId : a.clientId;
    const r = buildRelease({ title: m.title, type: m.type, releaseDate: m.date, genre: m.genre, lang: "vi",
      tracks: m.tracks.map(t => ({ title: t[0], producer: t[1], writers: t[1] ? [{ name: a.name, role: "Composer", pct: 60 }, { name: t[1], role: "Lyricist", pct: 40 }] : [{ name: a.name, role: "Composer", pct: 100 }] })) },
      m.artist, by, byLabel ? "label" : "artist");
    r.createdAt = r.updatedAt = r.history[0].at = ngay[k];
    const buoc = { received: 1, coded: 2, released: 3, returned: 1 };
    const cot = m.status === "returned" ? ["returned"] : ["received", "coded", "released"].slice(0, buoc[m.status] || 0);
    cot.forEach((st, j) => {
      const at = ngay[k].slice(0, 10) + " " + String(10 + j * 3).padStart(2, "0") + ":" + String(15 + j * 7).padStart(2, "0") + ":00";
      if (st === "coded") { r.tracks.forEach((t, ti) => { if (!t.isrc) t.isrc = genIsrc(k * 10 + ti); }); if (!r.upc) r.upc = genUpc(k + 1); }
      if (st === "released") r.releasedAt = m.date;
      r.status = st; r.updatedAt = at;
      r.history.push({ at, status: st, by: "ops@haustek-group.com", note: st === "returned" ? m.note : null });
    });
    state.releases.push(r);
  });
  state.releases.sort((x, y) => (x.updatedAt < y.updatedAt ? 1 : -1));
}
seedReleases();

/* =====================================================================
   19b. NHÂN VIÊN HAUSTEK — vai, người phụ trách từng đối tác
   ---------------------------------------------------------------------
   Cổng nội bộ không chỉ có vận hành. Kinh doanh cần biết mình phụ trách
   bao nhiêu tài khoản và doanh số; hỗ trợ cần hàng đợi ticket; kế toán
   cần yêu cầu rút tiền và bảng kê. Mỗi người một bàn làm việc.
   ===================================================================== */
const STAFF = [
  { id: "S01", email: "mgmt@haustek-group.com",     name: "Nguyễn Minh Quản",  role: "mgmt",       title: "Giám đốc",              titleEn: "Managing director" },
  { id: "S02", email: "ops@haustek-group.com",      name: "Trần Vận Hành",     role: "ops",        title: "Vận hành phát hành",    titleEn: "Release operations" },
  { id: "S03", email: "sales1@haustek-group.com",   name: "Lê Kinh Doanh",     role: "sales",      title: "Kinh doanh · label",     titleEn: "Sales · labels" },
  { id: "S04", email: "sales2@haustek-group.com",   name: "Phạm Thu Hà",       role: "sales",      title: "Kinh doanh · nghệ sĩ",   titleEn: "Sales · artists" },
  { id: "S05", email: "support1@haustek-group.com", name: "Hoàng Hỗ Trợ",      name2: "", role: "support", title: "Hỗ trợ đối tác",  titleEn: "Partner support" },
  { id: "S06", email: "support2@haustek-group.com", name: "Đỗ Quyền",          role: "support",    title: "Hỗ trợ · bản quyền",     titleEn: "Support · rights" },
  { id: "S07", email: "ketoan@haustek-group.com",   name: "Vũ Kế Toán",        role: "accounting", title: "Kế toán",               titleEn: "Accounting" }
];
const STAFF_TARGET = { S03: 3600000, S04: 6800000 };   /* chỉ tiêu doanh thu gộp một quý, USD */
let _me = STAFF[1];                                     /* nhân vật đang dùng cổng nội bộ (bản mẫu) */
const staffById = id => STAFF.find(s => s.id === id) || null;
const staffByRole = role => STAFF.filter(s => s.role === role);
/* Bên thụ hưởng chính: label (mọi cấp) và nghệ sĩ độc lập. Nghệ sĩ thuộc
   label là khách của label, không phải tài khoản kinh doanh riêng. */
function mainParties() {
  const out = [];
  LABELS.forEach(l => out.push({ partyKey: l.key, kind: l.parentId >= 0 ? "sublabel" : "label", id: l.id, name: l.name, clientId: l.clientId, parentId: l.parentId }));
  ARTISTS.forEach(a => { if (a.labelId < 0) out.push({ partyKey: a.key, kind: "artist", id: a.id, name: a.name, clientId: a.clientId, parentId: -1 }); });
  return out;
}
function seedPartyManager() {
  if (Object.keys(state.partyManager).length) return;
  const sales = staffByRole("sales");
  mainParties().forEach(pt => {
    const n = pt.kind === "artist" ? 1 : 0;
    /* label con theo người phụ trách của label mẹ */
    /* label chia đôi hai người; nghệ sĩ độc lập phần lớn về người phụ trách nghệ sĩ */
    state.partyManager[pt.partyKey] = pt.kind === "sublabel" ? state.partyManager["L:" + pt.parentId] || sales[0].id
      : (n === 1 ? (hash(pt.id, 71) < 0.75 ? "S04" : "S03") : (hash(pt.id, 72) < 0.5 ? "S03" : "S04"));
  });
}
/* Ngày ký hợp đồng và ngày hết hạn: sinh xác định, để bàn kinh doanh có
   "sắp hết hạn" và "mới ký" mà không cần master data thật. */
function signedAtOf(partyKey) {
  const id = +partyKey.slice(2), salt = partyKey[0] === "L" ? 81 : 82;
  const thang = (hash(id, salt) * 40) | 0;                  /* 0..39 tháng kể từ 01/2023 */
  return isoDate(new Date(2023, thang, 1 + ((hash(id, salt + 1) * 27) | 0)));
}
function contractEndOf(partyKey) {
  const s = signedAtOf(partyKey), id = +partyKey.slice(2);
  const nam = 2 + ((hash(id, 84) * 3) | 0);          /* hợp đồng 2, 3 hoặc 4 năm */
  return isoDate(new Date(+s.slice(0, 4) + nam, +s.slice(5, 7) - 1, +s.slice(8, 10)));
}
function classificationOf(revQ) { return revQ >= 150000 ? "A" : revQ >= 40000 ? "B" : revQ > 0 ? "C" : "—"; }
function partyRevenue(partyKey, pIdxList) {
  const id = +partyKey.slice(2);
  const ids = partyKey[0] === "L" ? idxOf(byLabel, id) : idxOf(byArtist, id);
  let g = 0, st = 0;
  for (const p of pIdxList) for (const i of ids) { g += grossRec(i, p); st += recStreams[i * P + p]; }
  return { gross: cents(g), streams: st, tracks: ids.length };
}
function lastQuarterIdx() { const ap = []; for (let p = 0; p < P; p++) if (state.approved[PERIODS[p].k]) ap.push(p); return ap.slice(-3); }
function prevQuarterIdx() { const ap = []; for (let p = 0; p < P; p++) if (state.approved[PERIODS[p].k]) ap.push(p); return ap.slice(-6, -3); }
function partiesList(opts) {
  opts = opts || {};
  const q = (opts.q || "").trim().toLowerCase();
  const qNay = lastQuarterIdx(), qTruoc = prevQuarterIdx();
  const homNay = isoDate(ASOF);
  const rows = mainParties().map(pt => {
    const acc = state.accounts.filter(a => a.partyKey === pt.partyKey);
    const rq = partyRevenue(pt.partyKey, qNay), rp = partyRevenue(pt.partyKey, qTruoc);
    const mgr = staffById(state.partyManager[pt.partyKey]);
    const signed = signedAtOf(pt.partyKey), end = contractEndOf(pt.partyKey);
    const daysToEnd = Math.round((new Date(end) - ASOF) / 864e5);
    const bank = state.bank[pt.partyKey] || null;
    const rateKey = pt.partyKey;
    /* Một trạng thái chính theo thứ tự ưu tiên; tài khoản đăng nhập là cờ riêng. */
    let status = "managed";
    if (rq.gross <= 0) status = "inactive";
    else if (daysToEnd <= 120) status = "renew";
    else if (acc.length && !bank) status = "incomplete";
    else if (acc.length && acc.every(a => !a.lastSeen)) status = "never-logged";
    return {
      partyKey: pt.partyKey, kind: pt.kind, name: pt.name, clientId: pt.clientId, parentId: pt.parentId,
      children: pt.kind !== "artist" ? labelChildren(pt.id).length : 0,
      manager: mgr ? mgr.id : null, managerName: mgr ? mgr.name : null,
      rate: rates.rateFor(rateKey, PERIODS[P - 1].k),
      revenueQ: rq.gross, revenuePrevQ: rp.gross, streamsQ: rq.streams, tracks: rq.tracks,
      classification: classificationOf(rq.gross),
      signedAt: signed, contractEnd: end, daysToEnd,
      accounts: acc.map(a => a.email), lastSeen: acc.map(a => a.lastSeen).filter(Boolean).sort().pop() || null,
      bank: !!bank, status, hasAccount: acc.length > 0, daysSinceSigned: Math.round((ASOF - new Date(signed)) / 864e5)
    };
  });
  let out = rows;
  if (opts.manager) out = out.filter(r => r.manager === opts.manager);
  if (opts.status && opts.status !== "no-account") out = out.filter(r => r.status === opts.status);
  if (opts.kind) out = out.filter(r => r.kind === opts.kind);
  if (opts.classification) out = out.filter(r => r.classification === opts.classification);
  if (q) out = out.filter(r => r.name.toLowerCase().includes(q) || r.clientId.toLowerCase().includes(q));
  const key = opts.sort || "revenueQ", dir = opts.dir === 1 ? 1 : -1;
  out.sort((a, b) => { const A = a[key], B = b[key]; return typeof A === "string" ? A.localeCompare(B, "vi") * dir : ((A || 0) - (B || 0)) * dir; });
  const counts = { all: rows.length };
  ["managed", "renew", "inactive", "incomplete", "never-logged"].forEach(s => { counts[s] = rows.filter(r => r.status === s).length; });
  counts["no-account"] = rows.filter(r => !r.hasAccount).length;
  if (opts.status === "no-account") out = out.filter(r => !r.hasAccount);
  return { total: out.length, counts, rows: out, homNay };
}
function salesKpi(staffId, pIdx) {
  const st = staffById(staffId);
  const mine = partiesList({ manager: staffId }).rows;
  const qNay = lastQuarterIdx();
  const kyNay = mine.reduce((s, r) => s + partyRevenue(r.partyKey, [pIdx]).gross, 0);
  const revQ = mine.reduce((s, r) => s + r.revenueQ, 0), revPrevQ = mine.reduce((s, r) => s + r.revenuePrevQ, 0);
  const target = STAFF_TARGET[staffId] || 0;
  return {
    staff: st, accounts: mine.length, labels: mine.filter(r => r.kind !== "artist").length, artists: mine.filter(r => r.kind === "artist").length,
    revenuePeriod: cents(kyNay), revenueQ: cents(revQ), revenuePrevQ: cents(revPrevQ), target, targetPct: target ? revQ / target : null,
    quarterLabel: qNay.length ? PERIODS[qNay[0]].label + " – " + PERIODS[qNay[qNay.length - 1]].label : "",
    newAccounts: mine.filter(r => r.daysSinceSigned <= 120).length,
    renewals: mine.filter(r => r.daysToEnd <= 120).sort((a, b) => a.daysToEnd - b.daysToEnd),
    neverLogged: mine.filter(r => r.hasAccount && r.status === "never-logged").length,
    noAccount: mine.filter(r => !r.hasAccount).length,
    incomplete: mine.filter(r => r.status === "incomplete").length,
    inactive: mine.filter(r => r.status === "inactive").length,
    top: mine.slice().sort((a, b) => b.revenueQ - a.revenueQ).slice(0, 8),
    byClass: ["A", "B", "C", "—"].map(c => ({ c, n: mine.filter(r => r.classification === c).length }))
  };
}

/* =====================================================================
   19c. VÍ VÀ RÚT TIỀN
   ---------------------------------------------------------------------
   Tiền của đối tác nằm trong ví: mỗi kỳ được xét duyệt ghi một khoản (phần
   được hưởng sau khấu trừ tạm ứng). Đối tác tự rút khi muốn, tối thiểu
   bằng ngưỡng; kế toán xử lý yêu cầu. Nguồn nào về trước thì ghi trước:
   YouTube theo tháng, TikTok theo quý.
   ===================================================================== */
function creditsOf(partyKey) {
  const out = [];
  PERIODS.forEach(p => {
    if (!state.approved[p.k]) return;
    const row = (state.payouts[p.k] || []).find(r => r.partyKey === partyKey);
    if (!row) return;
    out.push({ k: p.k, label: p.label, earned: row.earned, recoup: row.recoup, credit: cents(row.earned - row.recoup), approvedAt: state.approved[p.k].at });
  });
  return out;
}
function walletOf(partyKey) {
  const credits = creditsOf(partyKey);
  const totalCredit = cents(credits.reduce((s, c) => s + c.credit, 0));
  const ws = state.withdrawals.filter(w => w.partyKey === partyKey).slice().sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  const pending = cents(ws.filter(w => w.status === "requested" || w.status === "processing").reduce((s, w) => s + w.amount, 0));
  const paid = cents(ws.filter(w => w.status === "paid").reduce((s, w) => s + w.amount, 0));
  const nextOpen = PERIODS.find(p => !state.approved[p.k]);
  return { credits, totalCredit, pending, paid, available: cents(Math.max(totalCredit - pending - paid, 0)),
    threshold: CFG.PAYOUT_MIN, withdrawals: ws, bank: state.bank[partyKey] || null, cadence: reportCadence(),
    nextPeriod: nextOpen ? { k: nextOpen.k, label: nextOpen.label } : null };
}
let withdrawSeq = 0;
function withdrawalId(at) {
  withdrawSeq++;
  return "RT-" + String(at).slice(2, 4) + String(at).slice(5, 7) + "-" + String(withdrawSeq).padStart(3, "0");
}
function requestWithdrawal(partyKey, amount, note, by) {
  const w = walletOf(partyKey);
  amount = Math.round(+amount * 100) / 100;
  if (!(amount > 0)) throw new Error("Số tiền rút không hợp lệ");
  if (amount < CFG.PAYOUT_MIN) throw new Error("Số tiền rút tối thiểu là " + fmt.usd0(CFG.PAYOUT_MIN));
  if (amount > w.available + 0.004) throw new Error("Số tiền vượt số dư khả dụng " + fmt.usd(w.available));
  if (!w.bank) throw new Error("Bạn chưa khai thông tin tài khoản nhận tiền");
  const now = nowISO();
  const r = { id: withdrawalId(now), partyKey, party: { name: partyName(partyKey), clientId: partyClientId(partyKey) },
    amount, currency: "USD", requestedAt: now, updatedAt: now, status: "requested", bank: Object.assign({}, w.bank),
    note: note || "", by: by || partyClientId(partyKey), ref: null, paidAt: null, history: [{ at: now, status: "requested", by: by || partyClientId(partyKey) }],
    tax: withdrawalQuote(partyKey, amount) };
  state.withdrawals.unshift(r);
  audit.log("withdraw.request", r.id + " · " + r.party.name + " · " + fmt.usd(amount), by);
  store.save();
  return r;
}
function seedWithdrawals() {
  if (state.withdrawals.length) return;
  const parties = state.accounts.filter(a => a.role !== "admin" && a.partyKey && a.status === "active").map(a => a.partyKey);
  const seen = new Set();
  parties.forEach((pk, n) => {
    if (seen.has(pk)) return; seen.add(pk);
    /* ngân hàng: đủ cho phần lớn tài khoản mẫu, thiếu một vài để thấy trạng thái "chưa đủ hồ sơ" */
    if (n % 5 !== 3) state.bank[pk] = { bank: ["Vietcombank", "Techcombank", "MB Bank", "ACB", "BIDV"][n % 5], account: String(1000000000 + ((hash(n, 91) * 8999999999) | 0)), holder: partyName(pk).toUpperCase(), currency: "USD", swift: ["BFTVVNVX", "VTCBVNVX", "MSCBVNVX", "ASCBVNVX", "BIDVVNVX"][n % 5] };
    const credits = creditsOf(pk);
    let cum = 0, ruot = 0, k = 0;
    credits.forEach((c, ci) => {
      cum += c.credit;
      /* cứ ba kỳ rút một lần, khoảng 70% số dư lúc đó */
      if (ci % 3 === 2 && cum - ruot >= CFG.PAYOUT_MIN * 2 && state.bank[pk]) {
        const amt = Math.floor((cum - ruot) * 0.7);
        const at = addDays(c.approvedAt.slice(0, 10), 3 + (k % 4)) + " 10:" + String(12 + k * 7 % 40).padStart(2, "0") + ":00";
        const r = { id: "RT-" + at.slice(2, 4) + at.slice(5, 7) + "-" + String(++withdrawSeq).padStart(3, "0"), partyKey: pk,
          party: { name: partyName(pk), clientId: partyClientId(pk) }, amount: amt, currency: "USD", requestedAt: at, updatedAt: at,
          status: "paid", bank: Object.assign({}, state.bank[pk]), note: "", by: partyClientId(pk),
          ref: "TT" + at.slice(2, 4) + at.slice(5, 7) + at.slice(8, 10) + String(100 + n), paidAt: addDays(at.slice(0, 10), 2) + " 15:30:00",
          history: [{ at, status: "requested", by: partyClientId(pk) }, { at: addDays(at.slice(0, 10), 1) + " 09:05:00", status: "processing", by: "ketoan@haustek-group.com" }, { at: addDays(at.slice(0, 10), 2) + " 15:30:00", status: "paid", by: "ketoan@haustek-group.com" }] };
        state.withdrawals.push(r); ruot += amt; k++;
      }
    });
    /* tài khoản đầu tiên có một yêu cầu đang chờ, để bàn kế toán có việc */
    if (n === 0 && state.bank[pk] && cum - ruot > 200) {
      const at = "2026-09-02 09:12:00";
      state.withdrawals.push({ id: "RT-2609-" + String(++withdrawSeq).padStart(3, "0"), partyKey: pk, party: { name: partyName(pk), clientId: partyClientId(pk) },
        amount: Math.floor((cum - ruot) * 0.5), currency: "USD", requestedAt: at, updatedAt: at, status: "requested", bank: Object.assign({}, state.bank[pk]),
        note: "", by: partyClientId(pk), ref: null, paidAt: null, history: [{ at, status: "requested", by: partyClientId(pk) }] });
    }
  });
  state.withdrawals.sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
}
function statementsOf(role, partyId) {
  const partyKey = role === "label" ? "L:" + partyId : "A:" + partyId;
  return PERIODS.filter(p => state.approved[p.k]).map(p => {
    const a = agg(role, partyId, p.idx, "rec");
    const row = (state.payouts[p.k] || []).find(r => r.partyKey === partyKey) || null;
    const pdf = (state.statements[p.k] || {})[partyKey] || null;
    return { k: p.k, label: p.label, approvedAt: state.approved[p.k].at, revenue: revenueAgg(a, role), mine: a.total, streams: a.streams,
      credit: row ? cents(row.earned - row.recoup) : 0, recoup: row ? row.recoup : 0, pdf };
  }).reverse();
}

/* =====================================================================
   19d. DỰ BÁO — lượt nghe mỗi ngày × mức trả của từng nền tảng
   ---------------------------------------------------------------------
   Sau khi bài đã lên nền tảng, lượt nghe mỗi ngày là con số về sớm nhất
   (báo cáo doanh thu về sau một tới ba tháng). Nhân lượt nghe với mức trả
   trung bình của từng nền tảng (rút từ các kỳ đã xét duyệt) là có dự báo
   cho kỳ đang mở. Bản mẫu sinh lượt nghe hằng ngày xác định từ mã bài.
   ===================================================================== */
const ASOF = (() => { const d = new Date(); const min = new Date(2026, 8, 4); const x = d > min ? d : min; return new Date(x.getFullYear(), x.getMonth(), x.getDate()); })();
const N_DAYS = 60;
function dailyStreams(i, back) {
  const base = recStreams[i * P + (P - 1)] / 30;
  if (base <= 0) return 0;
  const trend = 0.85 + hash(i, 61) * 0.55;                      /* xu hướng 60 ngày: −15% … +40% */
  const t = 1 - back / N_DAYS;
  const dow = new Date(ASOF.getTime() - back * 864e5).getDay();
  const wk = dow === 5 || dow === 6 ? 1.07 : dow === 0 ? 1.03 : 0.985;
  /* nhiễu có nhớ: hai ngày kề nhau gần nhau, để đường không thành răng cưa */
  const n1 = hash(i * 97 + back, 62), n2 = hash(i * 97 + back + 1, 62), n3 = hash(i * 97 + back + 2, 62);
  const noise = 0.9 + (n1 + n2 + n3) / 3 * 0.2;
  return Math.round(base * Math.pow(trend, t) * wk * noise);
}
/* mức trả gộp USD trên 1.000 lượt nghe của từng nền tảng, từ 3 kỳ đã xét duyệt gần nhất */
let _rateCacheKey = null, _rateCacheVal = null;
function platformRates() {
  const key = Object.keys(state.approved).join(",");
  if (_rateCacheKey === key) return _rateCacheVal;
  const pList = lastQuarterIdx();
  const rev = new Float64Array(N_PLAT), st = new Float64Array(N_PLAT), accR = new Float64Array(N_PLAT), accS = new Float64Array(N_PLAT);
  const step = 25;
  pList.forEach(p => { for (let i = 0; i < N; i += step) { if (grossRec(i, p) <= 0) continue; splitStores(i, p, rev); splitStreams(i, p, rev, st); for (let j = 0; j < N_PLAT; j++) { accR[j] += rev[j]; accS[j] += st[j]; } } });
  _rateCacheKey = key;
  _rateCacheVal = PLAT_NAMES.map((n, j) => ({ name: n, nameEn: PLAT_NAMES_EN[j], per1k: accS[j] > 0 ? accR[j] / accS[j] * 1000 : 0 }));
  return _rateCacheVal;
}
function forecastOf(role, partyId) {
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const cap = Math.max(1, Math.min(n, 6000)), step = Math.max(1, Math.floor(n / cap));
  const scale = step;
  const lastP = P - 1;
  const days = new Float64Array(N_DAYS);
  const platShare = new Float64Array(N_PLAT);
  const rev = new Float64Array(N_PLAT), st = new Float64Array(N_PLAT);
  const perTrack = [];
  let g28 = 0, m28 = 0, r28 = 0;
  for (let k = 0; k < n; k += step) {
    const i = sc ? sc[k] : k;
    let s7 = 0, s7b = 0;
    for (let b = 0; b < N_DAYS; b++) { const v = dailyStreams(i, b); days[b] += v * scale; if (b < 7) s7 += v; else if (b < 14) s7b += v; }
    if (s7 > 0 || s7b > 0) perTrack.push({ id: i, title: tTitle[i], artist: ARTISTS[tArtist[i]].name, streams7: s7, prev7: s7b });
    /* tỷ trọng nền tảng của bài theo kỳ gần nhất */
    const g = grossRec(i, lastP);
    if (g > 0) {
      splitStores(i, lastP, rev); splitStreams(i, lastP, rev, st);
      for (let j = 0; j < N_PLAT; j++) platShare[j] += st[j] * scale;
      g28 += g; m28 += role === "admin" ? g : mineOf(i, lastP, role, partyId, "rec"); r28 += role === "admin" ? g : revenueOf(i, lastP, role);
    }
  }
  const tongShare = platShare.reduce((a, b) => a + b, 0) || 1;
  const factor = g28 > 0 ? m28 / g28 : 0;          /* phần của người xem trên mỗi đô doanh thu gộp */
  const factorR = g28 > 0 ? r28 / g28 : 0;         /* "doanh thu" theo vai trên mỗi đô doanh thu gộp */
  const rates = platformRates();
  const sum = (from, to) => { let s = 0; for (let b = from; b < to; b++) s += days[b]; return s; };
  const last7 = sum(0, 7), prev7 = sum(7, 14), last28 = sum(0, 28), prev28 = sum(28, 56);
  const blendedG = rates.reduce((s, r, j) => s + r.per1k * platShare[j] / tongShare, 0) / 1000;
  const blended = blendedG * factor;               /* USD của người xem trên mỗi lượt */
  const blendedR = blendedG * factorR;             /* doanh thu theo vai trên mỗi lượt */
  const dim = new Date(ASOF.getFullYear(), ASOF.getMonth() + 1, 0).getDate();
  const elapsed = ASOF.getDate();
  const mtd = sum(0, elapsed);
  const avg7 = last7 / 7;
  const projStreams = Math.round(mtd + avg7 * (dim - elapsed));
  const growth7 = prev7 > 0 ? (last7 - prev7) / prev7 : 0;
  const growth28 = prev28 > 0 ? (last28 - prev28) / prev28 : 0;
  const nextDim = new Date(ASOF.getFullYear(), ASOF.getMonth() + 2, 0).getDate();
  const nextStreams = Math.round(avg7 * Math.max(0.7, Math.min(1.3, 1 + growth28)) * nextDim);
  const lbl = d => String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  perTrack.sort((a, b) => b.streams7 - a.streams7);
  return {
    asOf: isoDate(ASOF), openPeriod: lbl(ASOF), nextPeriod: lbl(new Date(ASOF.getFullYear(), ASOF.getMonth() + 1, 1)),
    daysElapsed: elapsed, daysInMonth: dim,
    days: Array.from(days, (v, b) => ({ date: isoDate(new Date(ASOF.getTime() - b * 864e5)), streams: Math.round(v) })).reverse(),
    last7: Math.round(last7), prev7: Math.round(prev7), growth7, last28: Math.round(last28), prev28: Math.round(prev28), growth28,
    perStream: blended, perStreamRevenue: blendedR,
    byPlatform: rates.map((r, j) => {
      const share = platShare[j] / tongShare;
      const s7 = last7 * share, s28 = last28 * share;
      return { name: r.name, nameEn: r.nameEn, share, streams7: Math.round(s7), streams28: Math.round(s28),
        per1k: cents(r.per1k * factorR), per1kMine: cents(r.per1k * factor), projectedStreams: Math.round(projStreams * share),
        projectedRevenue: cents(projStreams * share * r.per1k / 1000 * factorR), projectedMine: cents(projStreams * share * r.per1k / 1000 * factor) };
    }).filter(x => x.share > 0.0005).sort((a, b) => b.projectedStreams - a.projectedStreams),
    projected: { streams: projStreams, revenue: cents(projStreams * blendedR), mine: cents(projStreams * blended), monthToDate: Math.round(mtd), monthToDateRevenue: cents(mtd * blendedR), monthToDateMine: cents(mtd * blended) },
    next: { streams: nextStreams, revenue: cents(nextStreams * blendedR), mine: cents(nextStreams * blended) },
    topTracks: perTrack.slice(0, 8).map(x => ({ id: x.id, title: x.title, artist: x.artist, streams7: x.streams7, growth: x.prev7 > 0 ? (x.streams7 - x.prev7) / x.prev7 : null, revenue7: cents(x.streams7 * blendedR), mine7: cents(x.streams7 * blended) })),
    tracksCounted: perTrack.length, sampled: step > 1,
    note: "Dự báo = lượt nghe mỗi ngày của các bài đã lên nền tảng × mức trả trung bình của từng nền tảng trong 3 kỳ gần nhất. Con số thật chỉ có khi nền tảng gửi báo cáo.",
    noteEn: "Forecast = daily streams of tracks live on platforms × each platform’s average payout over the last 3 approved periods. Actual figures arrive with the platforms’ reports."
  };
}

/* =====================================================================
   19e. TICKET HỖ TRỢ
   ===================================================================== */
/* =====================================================================
   19h. XU HƯỚNG NGÀY, PLAYLIST & BẢNG XẾP HẠNG, NHÂN KHẨU HỌC
   ---------------------------------------------------------------------
   Ba nguồn số liệu mà nền tảng cung cấp gần như tức thời, khác với báo
   cáo doanh thu về sau một tới ba tháng:
     · lượt nghe theo ngày (dailyStreams ở trên) gộp theo bài, bản phát
       hành, nghệ sĩ, thị trường, nền tảng cho một cửa sổ N ngày;
     · vị trí trong playlist biên tập, playlist thuật toán và bảng xếp
       hạng; mỗi bài có 0 tới 5 vị trí, sinh xác định theo mã bài và mức
       lượt nghe kỳ gần nhất, nên bài lớn có nhiều vị trí hơn;
     · nhân khẩu học người nghe (giới tính, độ tuổi, nguồn nghe, loại thuê
       bao), sinh xác định theo tài khoản.
   Hệ thống thật lấy ba thứ này từ API của từng nền tảng; hình dạng gói
   dữ liệu giữ như đây.
   ===================================================================== */
const PLAYLISTS = [
  { n: "Nhạc Việt Mới Thứ Sáu",      en: "New V-Pop Friday",        plat: "Spotify",       f: 1850000, kind: "editorial" },
  { n: "Hot Hits Việt Nam",           en: "Hot Hits Vietnam",        plat: "Spotify",       f: 2400000, kind: "editorial" },
  { n: "Top 50 Việt Nam",             en: "Top 50 Vietnam",          plat: "Spotify",       f: 0,       kind: "chart" },
  { n: "Viral 50 Việt Nam",           en: "Viral 50 Vietnam",        plat: "Spotify",       f: 0,       kind: "chart" },
  { n: "Indie Việt",                  en: "Indie Việt",              plat: "Spotify",       f: 620000,  kind: "editorial" },
  { n: "Chill Cùng Nhạc Việt",        en: "Chill with V-Pop",        plat: "Spotify",       f: 890000,  kind: "editorial" },
  { n: "Rap Việt Mới",                en: "New Vietnamese Rap",      plat: "Spotify",       f: 1100000, kind: "editorial" },
  { n: "Acoustic Việt",               en: "Acoustic Việt",           plat: "Spotify",       f: 410000,  kind: "editorial" },
  { n: "Radar Phát Hành",             en: "Release Radar",           plat: "Spotify",       f: 0,       kind: "algorithmic" },
  { n: "Gợi Ý Hằng Tuần",             en: "Weekly Mix",              plat: "Spotify",       f: 0,       kind: "algorithmic" },
  { n: "Nhạc Việt Hôm Nay",           en: "V-Pop Today",             plat: "Apple Music",   f: 1300000, kind: "editorial" },
  { n: "Top 100: Việt Nam",           en: "Top 100: Vietnam",        plat: "Apple Music",   f: 0,       kind: "chart" },
  { n: "Lofi Việt",                   en: "Lofi Việt",               plat: "Apple Music",   f: 350000,  kind: "editorial" },
  { n: "Ballad Việt",                 en: "Vietnamese Ballads",      plat: "Apple Music",   f: 720000,  kind: "editorial" },
  { n: "Top 100 Bài Hát Việt Nam",    en: "Top 100 Vietnam Songs",   plat: "Zing MP3",      f: 0,       kind: "chart" },
  { n: "Bảng Xếp Hạng Tuần",          en: "Weekly Chart",            plat: "Zing MP3",      f: 0,       kind: "chart" },
  { n: "Nhạc Trẻ Hay Nhất",           en: "Best of V-Pop",           plat: "Zing MP3",      f: 1600000, kind: "editorial" },
  { n: "Nhạc Hot Hôm Nay",            en: "Hot Today",               plat: "NhacCuaTui",    f: 980000,  kind: "editorial" },
  { n: "Việt Nam Top 100",            en: "Vietnam Top 100",         plat: "YouTube Music", f: 0,       kind: "chart" },
  { n: "V-Pop Thịnh Hành",            en: "Trending V-Pop",          plat: "YouTube Music", f: 540000,  kind: "editorial" },
  { n: "Xu Hướng Âm Nhạc",            en: "Music Trends",            plat: "TikTok",        f: 0,       kind: "chart" },
  { n: "Nhạc Việt Vươn Xa",           en: "V-Pop Going Global",      plat: "Deezer",        f: 120000,  kind: "editorial" }
];
const PL_KIND_LABEL = { editorial: ["Playlist biên tập", "Editorial playlist"], algorithmic: ["Playlist thuật toán", "Algorithmic playlist"], chart: ["Bảng xếp hạng", "Chart"] };
function playlistsOf(i) {
  const st = recStreams[i * P + (P - 1)];
  if (st <= 0) return [];
  const r = hash(i, 71);
  const k = st > 200000 ? 3 + (r > 0.5 ? 1 : 0) + (r > 0.85 ? 1 : 0)
          : st > 60000 ? 2 + (r > 0.6 ? 1 : 0)
          : st > 15000 ? (r > 0.35 ? 1 : 0) + (r > 0.8 ? 1 : 0)
          : (r > 0.9 ? 1 : 0);
  if (!k) return [];
  const start = Math.floor(hash(i, 72) * PLAYLISTS.length), step = 1 + Math.floor(hash(i, 73) * 7);
  const out = [];
  for (let j = 0; j < k; j++) {
    const pl = PLAYLISTS[(start + j * step) % PLAYLISTS.length];
    const position = 1 + Math.floor(hash(i, 80 + j) * (pl.kind === "chart" ? 100 : 60));
    const agoAdd = Math.floor(hash(i, 90 + j) * 75);
    const active = hash(i, 100 + j) > 0.22;
    const agoRem = active ? null : Math.max(0, agoAdd - 12 - Math.floor(hash(i, 110 + j) * 30));
    const perDay = st / 30;
    const streams7 = pl.kind === "chart" ? perDay * 7 * 0.12
                   : pl.kind === "algorithmic" ? perDay * 7 * 0.18
                   : pl.f * 0.004 * Math.max(0.2, 1 - position / 80) * 7 / 7;
    out.push({ playlist: pl.n, playlistEn: pl.en, platform: pl.plat, kind: pl.kind,
      kindLabel: PL_KIND_LABEL[pl.kind][0], kindLabelEn: PL_KIND_LABEL[pl.kind][1],
      followers: pl.f, position, addedAt: isoDate(new Date(ASOF.getTime() - agoAdd * 864e5)),
      status: active ? "active" : "removed", removedAt: active ? null : isoDate(new Date(ASOF.getTime() - agoRem * 864e5)),
      streams7: active ? Math.round(streams7) : 0 });
  }
  return out;
}
function playlistReport(role, partyId) {
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const rows = [], byPl = new Map();
  let active = 0, removed = 0, newMonth = 0, charts = 0;
  const cutNew = isoDate(new Date(ASOF.getTime() - 30 * 864e5));
  for (let k = 0; k < n; k++) {
    const i = sc ? sc[k] : k;
    const pls = playlistsOf(i);
    for (const pl of pls) {
      rows.push(Object.assign({ trackId: i, title: tTitle[i], artist: ARTISTS[tArtist[i]].name, isrc: tIsrc[i] }, pl));
      if (pl.status === "active") { active++; if (pl.kind === "chart") charts++; if (pl.addedAt >= cutNew) newMonth++; } else removed++;
      const key = pl.platform + "|" + pl.playlist;
      let g = byPl.get(key);
      if (!g) { g = { playlist: pl.playlist, playlistEn: pl.playlistEn, platform: pl.platform, kind: pl.kind, kindLabel: pl.kindLabel, kindLabelEn: pl.kindLabelEn, followers: pl.followers, tracks: 0, active: 0, streams7: 0, bestPosition: null }; byPl.set(key, g); }
      g.tracks++;
      if (pl.status === "active") { g.active++; g.streams7 += pl.streams7; if (g.bestPosition == null || pl.position < g.bestPosition) g.bestPosition = pl.position; }
    }
  }
  rows.sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1) || b.addedAt.localeCompare(a.addedAt) || b.streams7 - a.streams7);
  const playlists = [...byPl.values()].sort((a, b) => b.streams7 - a.streams7 || b.active - a.active);
  const reach = playlists.filter(p => p.active > 0).reduce((s, p) => s + p.followers, 0);
  return { asOf: isoDate(ASOF), counts: { active, removed, newMonth, charts, playlists: playlists.filter(p => p.active > 0).length, reach, total: rows.length },
    playlists: playlists.slice(0, 40), rows: rows.slice(0, 600), truncated: rows.length > 600,
    note: "Vị trí playlist và bảng xếp hạng cập nhật mỗi ngày từ nền tảng. Lượt nghe 7 ngày là ước tính phần playlist đóng góp.",
    noteEn: "Playlist and chart positions refresh daily from the platforms. 7-day streams are an estimate of the playlist’s contribution." };
}
/* ---- nhân khẩu học người nghe, sinh xác định theo tài khoản ---- */
function demoOf(role, partyId) {
  const s = role === "admin" ? 7 : role === "label" ? 1000 + partyId : 5000 + partyId;
  const nm = arr => { const t = arr.reduce((a, b) => a + b, 0); return arr.map(x => Math.round(x / t * 1000) / 10); };
  const g = nm([0.48 + hash(s, 201) * 0.12, 0.25 + hash(s, 202) * 0.15, 0.18 + hash(s, 203) * 0.1]);
  const a = nm([0.38 + hash(s, 211) * 0.15, 0.33 + hash(s, 212) * 0.15, 0.08 + hash(s, 213) * 0.06, 0.02 + hash(s, 214) * 0.03, 0.005 + hash(s, 215) * 0.01, 0.04 + hash(s, 216) * 0.04]);
  const src = nm([0.3 + hash(s, 221) * 0.15, 0.25 + hash(s, 222) * 0.12, 0.15 + hash(s, 223) * 0.1, 0.07 + hash(s, 224) * 0.05, 0.05 + hash(s, 225) * 0.04, 0.03 + hash(s, 226) * 0.03]);
  const sub = nm([0.62 + hash(s, 231) * 0.2, 0.2 + hash(s, 232) * 0.15, 0.03 + hash(s, 233) * 0.04, 0.01 + hash(s, 234) * 0.02]);
  return {
    gender: [["Nam", "Male"], ["Nữ", "Female"], ["Không xác định", "Not specified"]].map((x, j) => ({ label: x[0], labelEn: x[1], pct: g[j] })),
    age: ["18–24", "25–34", "35–44", "45–54", "55–64", "Không rõ"].map((x, j) => ({ label: x === "Không rõ" ? x : x, labelEn: x === "Không rõ" ? "Unknown" : x, pct: a[j] })),
    source: [["Playlist", "Playlist"], ["Thư viện người nghe", "Listener library"], ["Radio / tự động phát", "Radio / autoplay"], ["Trang nghệ sĩ", "Artist page"], ["Tìm kiếm", "Search"], ["Khác", "Other"]].map((x, j) => ({ label: x[0], labelEn: x[1], pct: src[j] })),
    subscription: [["Trả phí", "Paid"], ["Miễn phí", "Free"], ["Khuyến mại", "Promo"], ["Thử nghiệm", "Trial"]].map((x, j) => ({ label: x[0], labelEn: x[1], pct: sub[j] })),
    skippedPct: Math.round((0.15 + hash(s, 241) * 0.12) * 1000) / 10,
    providers: ["Apple Music", "Spotify"]
  };
}
/* ---- xu hướng ngày: một cửa sổ N ngày, gộp theo nhiều chiều ---- */
function dailyTrends(role, partyId, days, top) {
  top = top || 25;
  const W = Math.max(7, Math.min(days || 28, N_DAYS));
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const step = n > 3000 ? Math.ceil(n / 3000) : 1;
  const lastP = P - 1;
  const series = new Float64Array(W);
  const prevN = Math.min(W, N_DAYS - W);
  const byTrack = [], byArtist = new Map(), byRel = new Map();
  const byPlat = new Float64Array(N_PLAT), byTerr = new Float64Array(TERR.length);
  const rev = new Float64Array(N_PLAT), stPlat = new Float64Array(N_PLAT);
  let total = 0, prevTotal = 0;
  for (let k = 0; k < n; k += step) {
    const i = sc ? sc[k] : k;
    if (recStreams[i * P + lastP] <= 0) continue;
    let cur = 0, prv = 0;
    for (let b = 0; b < W; b++) { const v = dailyStreams(i, b) * step; cur += v; series[W - 1 - b] += v; }
    for (let b = W; b < W + prevN; b++) prv += dailyStreams(i, b) * step;
    if (prevN > 0 && prevN < W) prv = prv * W / prevN;
    total += cur; prevTotal += prv;
    byTrack.push({ id: i, title: tTitle[i], artist: ARTISTS[tArtist[i]].name, isrc: tIsrc[i], type: TYPES[tType[i]], streams: Math.round(cur), prev: Math.round(prv) });
    const a = tArtist[i];
    let ga = byArtist.get(a); if (!ga) { ga = { artistId: a, name: ARTISTS[a].name, clientId: ARTISTS[a].clientId, streams: 0, prev: 0, tracks: 0 }; byArtist.set(a, ga); }
    ga.streams += cur; ga.prev += prv; ga.tracks++;
    const rk = tType[i] === 0 ? "s:" + i : a + ":" + tRel[i] + ":" + tType[i];
    let gr = byRel.get(rk); if (!gr) { gr = { id: "CAT-" + rk.replace(/[^0-9a-z]/gi, "-"), trackId: i, title: tTitle[i], artist: ARTISTS[a].name, type: TYPES[tType[i]], releasePeriod: PERIODS[tRel[i]].label, tracks: 0, streams: 0, prev: 0 }; byRel.set(rk, gr); }
    gr.tracks++; gr.streams += cur; gr.prev += prv;
    splitStores(i, lastP, rev); splitStreams(i, lastP, rev, stPlat);
    let sp = 0; for (let j = 0; j < N_PLAT; j++) sp += stPlat[j];
    if (sp > 0) for (let j = 0; j < N_PLAT; j++) byPlat[j] += cur * stPlat[j] / sp;
    const tt = splitDim(i, cur, TERR_W, 0);
    for (let j = 0; j < TERR.length; j++) byTerr[j] += tt[j];
  }
  const fin = (arr, key) => arr.map(x => Object.assign({}, x, { streams: Math.round(x.streams), prev: Math.round(x.prev), change: x.prev > 0 ? (x.streams - x.prev) / x.prev : null })).sort((a, b) => b.streams - a.streams);
  const from = new Date(ASOF.getTime() - (W - 1) * 864e5);
  return {
    asOf: isoDate(ASOF), days: W, from: isoDate(from), to: isoDate(ASOF), sampled: step > 1,
    series: Array.from(series, (v, d) => ({ date: isoDate(new Date(from.getTime() + d * 864e5)), streams: Math.round(v) })),
    total: Array.from(series).reduce((s, v) => s + Math.round(v), 0), prevTotal: Math.round(prevTotal), growth: prevTotal > 0 ? (total - prevTotal) / prevTotal : null, avgPerDay: Math.round(total / W),
    topTracks: fin(byTrack).slice(0, top),
    topReleases: fin([...byRel.values()]).slice(0, Math.max(15, Math.round(top / 3))),
    topArtists: role === "artist" ? [] : fin([...byArtist.values()]).slice(0, Math.max(15, Math.round(top / 5))),
    byPlatform: PLAT_NAMES.map((nm, j) => ({ name: nm, nameEn: PLAT_NAMES_EN[j], streams: Math.round(byPlat[j]) })).filter(x => x.streams > 0).sort((a, b) => b.streams - a.streams),
    byCountry: TERR.map((nm, j) => ({ name: nm, streams: Math.round(byTerr[j]) })).sort((a, b) => b.streams - a.streams).slice(0, 12),
    demo: demoOf(role, partyId),
    tracksCounted: byTrack.length,
    note: "Lượt nghe theo ngày do nền tảng cung cấp, chưa qua đối soát doanh thu. Số này để theo dõi xu hướng; số tiền chỉ có khi kỳ được xét duyệt.",
    noteEn: "Daily streams come straight from the platforms, before revenue reconciliation. Use them for trends; money only appears once a period is approved."
  };
}

/* =====================================================================
   19i. CHIA SẺ TÁC QUYỀN · CHẤT LƯỢNG LƯỢT NGHE · NGƯỒNG TRẢ TIỀN ·
        SỨC KHOẺ METADATA · GIẢI THÍCH SỐ · THUẾ KHI RÚT · THÔNG BÁO ·
        TÌM NHANH · CHIẾN DỊCH
   ---------------------------------------------------------------------
   Từ nghiên cứu thị trường và học thuật (v2/NGHIEN-CUU-THI-TRUONG.md):
   · Splits với recoup là tính năng phổ biến nhất ở DistroKid, TuneCore,
     Symphonic, Amuse, Revelator; người cộng tác chỉ thấy phần của mình.
   · Spotify phạt ≈ €10 / bài / tháng khi phát hiện lượt nghe giả (từ
     4/2024), Deezer bỏ 7–8% lượt nghe khỏi quỹ, Apple phạt 10–50%; nền
     gian lận ngành 1–3% (CNM 2023). Bộ tín hiệu tính được từ số ngày:
     vọt so với nền 28 ngày, một nước chiếm quá nửa, lặp nghe cao, phụ
     thuộc playlist, tỷ lệ nghe ngắn.
   · Dòng không được trả tiền phải nói rõ luật: Spotify 1.000 lượt / 12
     tháng; Deezer 1.000 lượt/tháng và 500 người nghe.
   · Berklee 2015: 20–50% tiền không về đúng chủ vì metadata; MLC giữ
     424 triệu đô không khớp → điểm sức khoẻ metadata chặn trước khi giao.
   · Kulesza 2013: giải thích đủ chuỗi suy ra con số làm tăng niềm tin.
   · Ancker 2017: cảnh báo lặp làm giảm chấp nhận 10% mỗi 5 điểm → mỗi
     vấn đề một cảnh báo, gom theo ngày, ba mức.
   · Việt Nam: khấu trừ 10% thuế TNCN cho cá nhân từ 2 triệu đồng mỗi lần
     chi (Thông tư 111/2013, Điều 25); tổ chức tự xuất hoá đơn.
   ===================================================================== */
function lazyState(k, init) { if (!state[k] || typeof state[k] !== "object") state[k] = init; return state[k]; }

/* ---- chia sẻ tác quyền (splits) ---- */
const COLLAB_TEN = ["Minh", "An", "Khoa", "Linh", "Huy", "Thảo", "Nam", "Vy", "Đức", "Hà", "Quân", "Trang"];
const COLLAB_HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"];
const COLLAB_ROLES = [
  { k: "producer", vi: "Producer", en: "Producer" },
  { k: "featured", vi: "Nghệ sĩ khách", en: "Featured artist" },
  { k: "writer", vi: "Đồng sáng tác", en: "Co-writer" },
  { k: "mixer", vi: "Kỹ sư mix / master", en: "Mix & master engineer" }
];
function lifetimeMine(i, role, partyId) {
  let s = 0;
  for (let p = 0; p < P; p++) { if (!state.approved[PERIODS[p].k]) continue; if (grossRec(i, p) <= 0) continue; s += role === "admin" ? grossRec(i, p) : mineOf(i, p, role, partyId, "rec"); }
  return cents(s);
}
function baseSplits(i) {
  if (hash(i, 71) > 0.34 || recStreams[i * P + (P - 1)] <= 0) return [];
  const n = 1 + Math.floor(hash(i, 72) * 3), out = [];
  const pcts = [[30], [20, 15], [25, 15, 10]][n - 1];
  for (let k = 0; k < n; k++) {
    const ten = COLLAB_TEN[(Math.floor(hash(i, 73 + k) * 1000) + k) % COLLAB_TEN.length], ho = COLLAB_HO[Math.floor(hash(i, 76 + k) * 1000) % COLLAB_HO.length];
    const role = COLLAB_ROLES[(Math.floor(hash(i, 79 + k) * 1000) + k) % COLLAB_ROLES.length];
    const email = (ten + "." + ho).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d") + (i % 97) + "@vidu.vn";
    const recoup = hash(i, 82 + k) < 0.3 ? Math.round(150 + hash(i, 86 + k) * 2850) : 0;
    out.push({ name: ho + " " + ten, email, role: role.k, roleLabel: role.vi, roleLabelEn: role.en, pct: pcts[k],
      status: hash(i, 90 + k) < 0.82 ? "accepted" : "invited", recoup, invitedAt: isoDate(new Date(ASOF.getTime() - Math.floor(hash(i, 94 + k) * 400) * 864e5)) });
  }
  return out;
}
function splitsOf(i, role, partyId) {
  const st = lazyState("splits", {});
  const cols = st[i] ? st[i].slice() : baseSplits(i);
  const mine = lifetimeMine(i, role || "admin", partyId || 0);
  let sum = 0;
  const collaborators = cols.map(c => {
    sum += c.pct;
    const earnedRaw = cents(mine * c.pct / 100);
    const recouped = c.recoup ? Math.min(c.recoup, earnedRaw) : 0;
    return Object.assign({}, c, { earned: earnedRaw, recouped, payable: cents(c.status === "accepted" ? earnedRaw - recouped : 0), recouping: !!c.recoup && recouped < c.recoup });
  });
  return { trackId: i, partyKey: partyKeyOfTrack(i), title: tTitle[i], isrc: tIsrc[i], artist: ARTISTS[tArtist[i]].name, ownerPct: Math.max(0, 100 - sum), collaborators, hasSplits: collaborators.length > 0, lifetimeMine: mine };
}
function splitsReport(role, partyId) {
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const step = n > 4000 ? Math.ceil(n / 4000) : 1;
  const rows = []; const emails = new Set(); let invited = 0, paid = 0, recouping = 0;
  for (let k = 0; k < n; k += step) {
    const i = sc ? sc[k] : k;
    const s = splitsOf(i, role, partyId);
    if (!s.hasSplits) continue;
    rows.push(s);
    s.collaborators.forEach(c => { emails.add(c.email); if (c.status === "invited") invited++; if (c.recouping) recouping++; paid += c.payable; });
  }
  rows.sort((a, b) => b.lifetimeMine - a.lifetimeMine);
  return { asOf: isoDate(ASOF), counts: { tracks: rows.length, collaborators: emails.size, invited, paid: cents(paid), recouping }, rows: rows.slice(0, 300), truncated: rows.length > 300, sampled: step > 1,
    roles: COLLAB_ROLES.map(r => ({ k: r.k, label: r.vi, labelEn: r.en })),
    note: "Người cộng tác nhận phần trăm trên số tiền của bạn cho bài đó, không thấy con số của bạn — chỉ thấy phần của họ. Có ngưỡng thu hồi thì bạn nhận trước cho đến khi đủ, rồi mới chia.",
    noteEn: "Collaborators receive a percentage of your earnings on that track and only see their own share. With a recoupment amount you are paid first until it is met, then the split applies." };
}
function setSplit(role, partyId, trackId, c, by) {
  const i = +trackId;
  if (!(i >= 0 && i < N)) throw new Error("Không tìm thấy bản ghi");
  const sc = scopeOf(role, partyId, "rec");
  if (sc && !sc.includes(i)) throw new Error("Bản ghi không thuộc danh mục của bạn");
  const email = String(c.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Email người cộng tác không hợp lệ");
  const pct = Math.round(+c.pct * 10) / 10;
  if (!(pct > 0 && pct <= 100)) throw new Error("Phần trăm phải trong khoảng 0–100");
  const st = lazyState("splits", {});
  const cur = (st[i] || baseSplits(i)).filter(x => x.email !== email);
  const sum = cur.reduce((s, x) => s + x.pct, 0) + pct;
  if (sum > 100) throw new Error("Tổng phần chia vượt 100% (đang là " + sum + "%)");
  const role2 = COLLAB_ROLES.find(r => r.k === c.role) || COLLAB_ROLES[0];
  cur.push({ name: String(c.name || email.split("@")[0]).trim(), email, role: role2.k, roleLabel: role2.vi, roleLabelEn: role2.en, pct, status: "invited", recoup: Math.max(0, Math.round(+c.recoup || 0)), invitedAt: isoDate(ASOF) });
  st[i] = cur;
  audit.log("split.set", tTitle[i] + " · " + email + " · " + pct + "%", by);
  store.save();
  return splitsOf(i, role, partyId);
}
function removeSplit(role, partyId, trackId, email, by) {
  const i = +trackId; const sc = scopeOf(role, partyId, "rec");
  if (sc && !sc.includes(i)) throw new Error("Bản ghi không thuộc danh mục của bạn");
  const st = lazyState("splits", {});
  st[i] = (st[i] || baseSplits(i)).filter(x => x.email !== String(email).toLowerCase());
  audit.log("split.remove", tTitle[i] + " · " + email, by);
  store.save();
  return splitsOf(i, role, partyId);
}
function acceptSplit(trackId, email, by) {
  const i = +trackId; const st = lazyState("splits", {});
  st[i] = (st[i] || baseSplits(i)).map(x => x.email === String(email).toLowerCase() ? Object.assign({}, x, { status: "accepted" }) : x);
  audit.log("split.accept", tTitle[i] + " · " + email, by); store.save();
  return splitsOf(i);
}

/* ---- chất lượng lượt nghe: tín hiệu bất thường tính từ số ngày ---- */
function listenersOf(i, streams) { return Math.round(streams / (1.6 + hash(i, 101) * 3.2)); }
const PENALTY_USD = 10.8;   /* ≈ €10 / bài / tháng theo chính sách Spotify 4/2024 */
function qualityOf(i) {
  let last7 = 0; const base = [];
  for (let b = 0; b < 35; b++) { const v = dailyStreams(i, b); if (b < 7) last7 += v; else base.push(v); }
  if (last7 <= 0 && !base.length) return null;
  const mean = base.reduce((s, v) => s + v, 0) / (base.length || 1);
  const sd = Math.sqrt(base.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (base.length || 1)) || Math.max(1, mean * 0.08);
  /* Một số bài được "tiêm" bất thường để thấy hình dạng cảnh báo. Tỷ lệ
     nhỏ và độc lập từng tín hiệu (tổng ≈ 5% danh mục, gần nền gian lận
     1–3% của ngành); "bot" là kiểu ba tín hiệu cùng lúc → nghiêm trọng. */
  const injSpike = hash(i, 102) < 0.015, injCountry = hash(i, 113) < 0.01, injRepeat = hash(i, 114) < 0.008, injShort = hash(i, 115) < 0.008, bot = hash(i, 116) < 0.005;
  const spikeMul = (injSpike || bot) ? 2.2 + hash(i, 103) * 4 : 1;
  const z = ((last7 / 7) * spikeMul - mean) / sd;
  const tt = splitDim(i, 1, TERR_W, 0);
  const KHAC = TERR.length - 1;                       /* rổ "Khác" không phải một thị trường */
  let topIdx = 0; for (let j = 1; j < KHAC; j++) if (tt[j] > tt[topIdx]) topIdx = j;
  let topShare = tt[topIdx];
  if (injCountry) { topIdx = 1 + Math.floor(hash(i, 104) * (KHAC - 1)); topShare = 0.55 + hash(i, 105) * 0.35; }
  const rep = last7 > 0 ? last7 / Math.max(1, listenersOf(i, last7)) : 0;
  const repAdj = (injRepeat || bot) ? rep * (1.8 + hash(i, 106)) : rep;
  const pls = playlistsOf(i).filter(p => p.status === "active");
  const plStreams = pls.reduce((s, p) => s + p.streams7, 0);
  const plShare = last7 > 0 ? Math.min(1, plStreams / last7) : 0;
  const shortRatio = (injShort || bot) ? 0.6 + hash(i, 107) * 0.28 : 0.05 + hash(i, 108) * 0.22;
  const spikeHit = z >= 3 && last7 >= 350 && (last7 / 7) * spikeMul >= mean * 1.5;
  const countryHit = (topIdx !== 0 && topShare >= 0.55) || topShare >= 0.8;
  const repeatHit = repAdj >= 5 && last7 >= 350;
  const shortHit = shortRatio >= 0.45 && last7 >= 350;
  /* điểm: tín hiệu hành vi máy (lặp nghe, nghe ngắn, vọt mạnh) nặng hơn tín hiệu thị trường;
     phụ thuộc playlist chỉ là bằng chứng phụ, không tự tạo cảnh báo */
  let points = (spikeHit ? (z >= 6 ? 2 : 1) : 0) + (repeatHit ? 2 : 0) + (shortHit ? 2 : 0) + (countryHit ? 1 : 0);
  const playlistHit = points > 0 && plShare >= 0.7 && pls.length <= 2 && pls.length > 0;
  if (playlistHit) points += 1;
  const signals = [
    { k: "spike", label: "Vọt so với nền 28 ngày", labelEn: "Spike vs 28-day baseline", value: Math.round(z * 10) / 10, unit: "σ", threshold: 3, hit: spikeHit },
    { k: "country", label: "Một thị trường chiếm phần lớn", labelEn: "Single-market concentration", value: Math.round(topShare * 1000) / 10, unit: "%", threshold: 55, hit: countryHit, extra: TERR[topIdx] },
    { k: "repeat", label: "Lượt nghe trên mỗi người nghe", labelEn: "Streams per listener", value: Math.round(repAdj * 10) / 10, unit: "×", threshold: 5, hit: repeatHit },
    { k: "playlist", label: "Phụ thuộc một vài playlist", labelEn: "Playlist dependence", value: Math.round(plShare * 1000) / 10, unit: "%", threshold: 70, hit: playlistHit },
    { k: "short", label: "Tỷ lệ nghe ngắn 30–31 giây", labelEn: "Share of 30–31s plays", value: Math.round(shortRatio * 1000) / 10, unit: "%", threshold: 45, hit: shortHit }
  ];
  const hits = signals.filter(s => s.hit).length;
  const severity = points >= 4 ? "critical" : points >= 2 ? "warn" : points === 1 ? "watch" : null;
  const flagged = hash(i, 109) < 0.012 && last7 >= 500;
  const alerts = lazyState("alerts", {});
  const id = "CL-" + String(i).padStart(5, "0");
  const st = alerts[id] || null;
  const dsp = flagged ? { platform: "Spotify", at: isoDate(new Date(ASOF.getTime() - Math.floor(hash(i, 110) * 40) * 864e5)), removedStreams: Math.round(last7 * (0.5 + hash(i, 111) * 0.45)), penaltyUsd: PENALTY_USD,
    reason: "Lượt nghe giả trên mức cho phép", reasonEn: "Artificial streams above tolerance" } : null;
  if (!severity && !dsp) return null;
  return { id, trackId: i, title: tTitle[i], isrc: tIsrc[i], artist: ARTISTS[tArtist[i]].name, partyKey: partyKeyOfTrack(i),
    last7: Math.round(last7 * (spikeMul > 1 ? spikeMul : 1)), baselinePerDay: Math.round(mean), listeners7: listenersOf(i, last7), severity: dsp ? "critical" : severity, hits, signals, dsp,
    status: st ? st.status : "open", note: st ? st.note : "", history: st ? st.history : [], firstSeen: isoDate(new Date(ASOF.getTime() - Math.floor(hash(i, 112) * 6) * 864e5)) };
}
function qualityReport(role, partyId) {
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const step = n > 6000 ? Math.ceil(n / 6000) : 1;
  const rows = [];
  for (let k = 0; k < n; k += step) { const i = sc ? sc[k] : k; if (recStreams[i * P + (P - 1)] <= 0) continue; const q = qualityOf(i); if (q) rows.push(q); }
  const rank = { critical: 0, warn: 1, watch: 2 };
  rows.sort((a, b) => rank[a.severity] - rank[b.severity] || b.last7 - a.last7);
  const byParty = new Map();
  rows.forEach(r => {
    let g = byParty.get(r.partyKey);
    if (!g) { g = { partyKey: r.partyKey, name: partyName(r.partyKey), clientId: partyClientId(r.partyKey), alerts: 0, critical: 0, flagged: 0, spikes: 0, removedStreams: 0, penaltyUsd: 0, open: 0 }; byParty.set(r.partyKey, g); }
    g.alerts++; if (r.severity === "critical") g.critical++; if (r.dsp) { g.flagged++; g.removedStreams += r.dsp.removedStreams; g.penaltyUsd = cents(g.penaltyUsd + r.dsp.penaltyUsd); }
    if (r.signals[0].hit) g.spikes++; if (r.status === "open") g.open++;
  });
  const cases = [...byParty.values()].map(g => Object.assign(g, { pattern: g.spikes >= 5 ? "many-small-lifts" : g.flagged ? "dsp-flag" : g.critical ? "critical" : "watch",
    patternLabel: g.spikes >= 5 ? "Nhiều bài tăng đồng loạt" : g.flagged ? "Nền tảng đã gắn cờ" : g.critical ? "Nhiều tín hiệu cùng lúc" : "Theo dõi",
    patternLabelEn: g.spikes >= 5 ? "Many small lifts at once" : g.flagged ? "Flagged by platform" : g.critical ? "Several signals together" : "Watch" }))
    .sort((a, b) => (b.flagged - a.flagged) || (b.critical - a.critical) || (b.alerts - a.alerts));
  const flagged = rows.filter(r => r.dsp);
  return { asOf: isoDate(ASOF), counts: { alerts: rows.length, critical: rows.filter(r => r.severity === "critical").length, warn: rows.filter(r => r.severity === "warn").length, watch: rows.filter(r => r.severity === "watch").length,
      flagged: flagged.length, penaltyUsd: cents(flagged.reduce((s, r) => s + r.dsp.penaltyUsd, 0)), removedStreams: flagged.reduce((s, r) => s + r.dsp.removedStreams, 0),
      open: rows.filter(r => r.status === "open").length, disputed: rows.filter(r => r.status === "disputed").length, tracksChecked: Math.ceil(n / step) },
    baseline: { min: 1, max: 3, source: "CNM 2023" }, penaltyPerTrackUsd: PENALTY_USD, sampled: step > 1,
    cases: cases.slice(0, 60), rows: rows.slice(0, 400), truncated: rows.length > 400,
    note: "Tín hiệu tính từ lượt nghe theo ngày nền tảng gửi về: vọt so với nền 28 ngày, một thị trường chiếm quá nửa, lặp nghe cao, phụ thuộc một vài playlist, tỷ lệ nghe ngắn. Nền gian lận toàn ngành 1–3%; cảnh báo chỉ nhắm vào phần vượt xa mức đó. Bài bị nền tảng gắn cờ: lượt nghe bị gỡ khỏi báo cáo và có thể bị phạt theo bài mỗi tháng.",
    noteEn: "Signals computed from daily platform streams: spike vs 28-day baseline, single-market share, repeat listens, playlist dependence, share of short plays. Industry baseline fraud is 1–3%; alerts target what sits far above it. Tracks flagged by a platform have streams removed from reports and may carry a per-track monthly penalty." };
}
function setAlertStatus(trackId, status, note, by, role, partyId) {
  const i = +trackId; const sc = role && role !== "admin" ? scopeOf(role, partyId, "rec") : null;
  if (sc && !sc.includes(i)) throw new Error("Bản ghi không thuộc danh mục của bạn");
  if (!["open", "disputed", "resolved", "confirmed"].includes(status)) throw new Error("Trạng thái không hợp lệ");
  const alerts = lazyState("alerts", {}); const id = "CL-" + String(i).padStart(5, "0");
  const cur = alerts[id] || { status: "open", note: "", history: [] };
  cur.status = status; cur.note = note || cur.note; cur.history.push({ at: nowISO(), status, by: by || "", note: note || "" });
  alerts[id] = cur;
  audit.log("alert." + status, id + " · " + tTitle[i] + (note ? " · " + note : ""), by);
  store.save();
  return qualityOf(i);
}

/* ---- ngưỡng trả tiền của nền tảng ---- */
function monetizationOf(i) {
  const lastP = P - 1;
  let s12 = 0; for (let p = Math.max(0, P - 12); p < P; p++) s12 += recStreams[i * P + p];
  const sm = recStreams[i * P + lastP];
  const rev = new Float64Array(N_PLAT), st = new Float64Array(N_PLAT);
  if (sm > 0) { splitStores(i, lastP, rev); splitStreams(i, lastP, rev, st); }
  let sp = 0; for (let j = 0; j < N_PLAT; j++) sp += st[j];
  const share = j => sp > 0 ? st[j] / sp : 0;
  const jSpot = PLAT_NAMES.indexOf("Spotify");
  const spot12 = Math.round(s12 * (jSpot >= 0 ? share(jSpot) : 0.3));
  const dzMonth = Math.round(sm * 0.015);            /* Deezer nằm trong rổ nền tảng khác: ước tính 1,5% */
  const dzListeners = listenersOf(i, dzMonth);
  const rules = [
    { platform: "Spotify", rule: "Từ 1.000 lượt nghe trong 12 tháng gần nhất mới được tính tiền (từ 4/2024)", ruleEn: "At least 1,000 streams in the last 12 months to earn royalties (since April 2024)",
      value: spot12, threshold: 1000, ok: spot12 >= 1000, progress: Math.min(1, spot12 / 1000), unit: "streams" },
    { platform: "Deezer", rule: "Nghệ sĩ chuyên nghiệp: từ 1.000 lượt nghe/tháng và 500 người nghe; dưới đó không được nhân đôi trọng số", ruleEn: "Professional artist: 1,000 streams/month and 500 unique listeners, else no double weighting",
      value: dzMonth, threshold: 1000, value2: dzListeners, threshold2: 500, ok: dzMonth >= 1000 && dzListeners >= 500, progress: Math.min(1, Math.min(dzMonth / 1000, dzListeners / 500)), unit: "streams", estimated: true },
    { platform: "Apple Music", rule: "Không có ngưỡng tối thiểu; trả theo tỷ lệ lượt nghe", ruleEn: "No minimum threshold; pro-rata payout", value: null, threshold: null, ok: true, progress: 1 }
  ];
  return { trackId: i, streams12: s12, streamsMonth: sm, rules, eligibleAll: rules.every(r => r.ok), below: rules.filter(r => !r.ok).map(r => r.platform) };
}

/* ---- sức khoẻ metadata ---- */
const META_CHECKS = [
  { k: "isrc", w: 20, label: "Có ISRC", labelEn: "ISRC present", hint: "Haustek cấp ISRC khi tiếp nhận.", hintEn: "Haustek assigns an ISRC on intake." },
  { k: "upc", w: 10, label: "Có UPC cho bản phát hành", labelEn: "Release has a UPC", hint: "Cần UPC để nền tảng gom bài vào đúng bản phát hành.", hintEn: "Stores need a UPC to group tracks into the release." },
  { k: "iswc", w: 15, label: "Tác phẩm có ISWC", labelEn: "Work has an ISWC", hint: "Đăng ký tác phẩm với tổ chức quản lý tác quyền để nhận ISWC; thiếu mã này tiền tác quyền dễ rơi vào quỹ không khớp.", hintEn: "Register the work with a collecting society for an ISWC; without it publishing money lands in the unmatched pool." },
  { k: "ipi", w: 15, label: "Người sáng tác có mã IPI", labelEn: "Writers have IPI numbers", hint: "Mỗi người sáng tác cần mã IPI để đối soát với các tổ chức quản lý tác quyền.", hintEn: "Each writer needs an IPI to reconcile with societies." },
  { k: "splits", w: 15, label: "Phần chia cộng đủ 100%", labelEn: "Splits add up to 100%", hint: "Tổng phần chia của người cộng tác và chủ bản ghi phải bằng 100%.", hintEn: "Owner and collaborator shares must total 100%." },
  { k: "artwork", w: 10, label: "Ảnh bìa 3000×3000, không chữ mờ", labelEn: "Artwork 3000×3000, no blurry text", hint: "Nền tảng từ chối ảnh dưới 3000 điểm hoặc có URL, giá, chữ quảng cáo.", hintEn: "Stores reject artwork under 3000 px or carrying URLs, prices or promo text." },
  { k: "explicit", w: 5, label: "Đã khai cờ nội dung nhạy cảm", labelEn: "Explicit flag declared", hint: "Thiếu cờ thì Apple và Spotify giữ lại bài để rà soát.", hintEn: "Missing flag holds the track for review at Apple and Spotify." },
  { k: "language", w: 5, label: "Có ngôn ngữ lời bài hát", labelEn: "Lyric language set", hint: "Cần cho xếp bài vào đúng thị trường và playlist.", hintEn: "Needed for market and playlist placement." },
  { k: "lyrics", w: 5, label: "Có lời bài hát", labelEn: "Lyrics attached", hint: "Lời giúp bài lên Apple Music Sing và TikTok tìm được; không bắt buộc.", hintEn: "Lyrics unlock Apple Music Sing and TikTok search; optional." }
];
function metadataHealth(i, role, partyId) {
  const sp = splitsOf(i, role || "admin", partyId || 0);
  const okOf = { isrc: true, upc: !!tUpc[i], iswc: hash(i, 121) < 0.82, ipi: hash(i, 122) < 0.88, splits: sp.ownerPct + sp.collaborators.reduce((s, c) => s + c.pct, 0) === 100,
    artwork: hash(i, 123) < 0.9, explicit: hash(i, 124) < 0.86, language: hash(i, 125) < 0.92, lyrics: hash(i, 126) < 0.5 };
  let score = 0, max = 0; const checks = META_CHECKS.map(c => { max += c.w; if (okOf[c.k]) score += c.w; return Object.assign({ ok: !!okOf[c.k] }, c); });
  const pct = Math.round(score / max * 100);
  return { trackId: i, partyKey: partyKeyOfTrack(i), title: tTitle[i], isrc: tIsrc[i], artist: ARTISTS[tArtist[i]].name, score: pct, grade: pct >= 90 ? "A" : pct >= 70 ? "B" : "C", checks, missing: checks.filter(c => !c.ok).length, blocking: checks.filter(c => !c.ok && c.w >= 15).length };
}
function metadataReport(role, partyId) {
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const step = n > 4000 ? Math.ceil(n / 4000) : 1;
  const rows = []; const byGrade = { A: 0, B: 0, C: 0 }; const byCheck = {}; META_CHECKS.forEach(c => { byCheck[c.k] = 0; });
  for (let k = 0; k < n; k += step) { const i = sc ? sc[k] : k; const h = metadataHealth(i, role, partyId); byGrade[h.grade]++; h.checks.forEach(c => { if (!c.ok) byCheck[c.k]++; }); if (h.grade !== "A") rows.push(h); }
  rows.sort((a, b) => a.score - b.score || b.blocking - a.blocking);
  const tot = byGrade.A + byGrade.B + byGrade.C;
  return { asOf: isoDate(ASOF), counts: { tracks: tot, A: byGrade.A, B: byGrade.B, C: byGrade.C, blocking: rows.filter(r => r.blocking > 0).length, avg: tot ? Math.round((byGrade.A * 95 + byGrade.B * 80 + byGrade.C * 55) / tot) : 0 },
    byCheck: META_CHECKS.map(c => ({ k: c.k, label: c.label, labelEn: c.labelEn, missing: byCheck[c.k] * step })), rows: rows.slice(0, 200), truncated: rows.length > 200, sampled: step > 1,
    note: "Berklee (2015) ước tính 20–50% tiền tác quyền không về đúng chủ vì metadata thiếu hoặc lệch; The MLC giữ 424 triệu đô chưa khớp. Điểm dưới 70 hoặc thiếu mã quan trọng thì Haustek giữ lại trước khi giao nền tảng.",
    noteEn: "Berklee (2015) estimated 20–50% of royalties never reach the right owner because of missing or inconsistent metadata; the MLC held $424m unmatched. Below 70, or missing a key identifier, Haustek holds the release before delivery." };
}

/* ---- giải thích một con số của kỳ ---- */
function explainPeriod(role, partyId, pk) {
  const p = pIndexOf(pk);
  if (p < 0) throw new Error("Không có kỳ " + pk);
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const step = n > 6000 ? Math.ceil(n / 6000) : 1;
  const rev = new Float64Array(N_PLAT), st = new Float64Array(N_PLAT), accR = new Float64Array(N_PLAT), accS = new Float64Array(N_PLAT);
  let streams = 0, gross = 0, revenue = 0, mine = 0, tracks = 0;
  for (let k = 0; k < n; k += step) {
    const i = sc ? sc[k] : k; const g = grossRec(i, p); if (g <= 0) continue;
    tracks++; streams += recStreams[i * P + p] * step; gross += g * step; revenue += revenueOf(i, p, role) * step;
    mine += (role === "admin" ? g : mineOf(i, p, role, partyId, "rec")) * step;
    splitStores(i, p, rev); splitStreams(i, p, rev, st);
    for (let j = 0; j < N_PLAT; j++) { accR[j] += rev[j] * step; accS[j] += st[j] * step; }
  }
  const partyKey = role === "label" ? "L:" + partyId : role === "artist" ? "A:" + partyId : null;
  const payout = partyKey ? (state.payouts[pk] || []).find(r => r.partyKey === partyKey) : null;
  const matched = partyKey ? Object.keys(state.match).filter(k2 => k2.endsWith(":" + p)).reduce((s, k2) => { const i = +k2.split(":")[0]; return (sc ? sc.includes(i) : true) ? s + (state.match[k2] || 0) : s; }, 0) : 0;
  const platforms = PLAT_NAMES.map((nm, j) => ({ name: nm, nameEn: PLAT_NAMES_EN[j], streams: Math.round(accS[j]), per1k: accS[j] > 0 ? cents(accR[j] / accS[j] * 1000 * (gross > 0 ? mine / gross : 0)) : 0, amount: cents(accR[j] * (gross > 0 ? mine / gross : 0)) })).filter(x => x.streams > 0).sort((a, b) => b.amount - a.amount);
  const steps = [];
  steps.push({ k: "streams", label: "Lượt nghe nền tảng báo về", labelEn: "Streams reported by platforms", value: Math.round(streams), kind: "so", detail: tracks * step + " bản ghi · " + platforms.length + " nền tảng", detailEn: tracks * step + " recordings · " + platforms.length + " platforms" });
  steps.push({ k: "rate", label: "× mức trả bình quân trên 1.000 lượt (theo nền tảng)", labelEn: "× average payout per 1,000 streams (per platform)", value: streams > 0 ? cents(mine / streams * 1000) : 0, kind: "tien", detail: "Mỗi nền tảng một mức; bảng bên dưới", detailEn: "One rate per platform; table below" });
  if (role === "admin") {
    let partner = 0; earnedByParty(p).forEach(v => { partner += v; });
    steps.push({ k: "gross", label: "= Doanh thu gộp về Haustek", labelEn: "= Gross revenue to Haustek", value: cents(gross), kind: "tien" });
    steps.push({ k: "partner", label: "− Phần trả đối tác theo tỷ lệ chia", labelEn: "− Partner share by contract", value: cents(partner), kind: "tien" });
    steps.push({ k: "kept", label: "= Phần Haustek giữ lại", labelEn: "= Retained by Haustek", value: cents(gross - partner), kind: "tien", tong: true });
  } else {
    steps.push({ k: "mine", label: "= Số tiền của bạn cho kỳ này", labelEn: "= Your earnings for this period", value: cents(mine), kind: "tien", tong: true });
    if (matched) steps.push({ k: "matched", label: "+ Dòng khớp tay cộng thêm", labelEn: "+ Manually matched lines added", value: cents(matched), kind: "tien" });
    if (payout) {
      if (payout.recoup) steps.push({ k: "recoup", label: "− Thu hồi tạm ứng", labelEn: "− Advance recoupment", value: cents(payout.recoup), kind: "tien" });
      if (payout.carry) steps.push({ k: "carry", label: "→ Dồn sang kỳ sau (dưới ngưỡng " + fmt.usd0(CFG.PAYOUT_MIN) + ")", labelEn: "→ Carried to next period (below " + fmt.usd0(CFG.PAYOUT_MIN) + ")", value: cents(payout.carry), kind: "tien" });
      steps.push({ k: "credit", label: "= Ghi vào ví", labelEn: "= Credited to wallet", value: cents(payout.earned - payout.recoup), kind: "tien", tong: true });
    }
  }
  return { period: pk, label: PERIODS[p].label, approved: !!state.approved[pk], steps, platforms: platforms.slice(0, 12), sampled: step > 1,
    note: "Mỗi bước là một con số có thể kiểm: lượt nghe lấy từ báo cáo nền tảng, mức trả là tiền chia cho lượt nghe của chính nền tảng đó trong kỳ, các dòng điều chỉnh có ghi trong nhật ký.",
    noteEn: "Each step is checkable: streams come from platform reports, the rate is that platform’s money divided by its streams in the period, adjustments are logged." };
}

/* ---- thuế khấu trừ khi rút tiền ---- */
function withdrawalQuote(partyKey, amount) {
  amount = Math.round(+amount * 100) / 100;
  const fxRate = state.fx.rate, vnd = Math.round(amount * fxRate);
  const individual = partyKey[0] === "A";
  let rate = 0, rule, ruleEn;
  if (individual && vnd >= 2000000) { rate = 0.10; rule = "Cá nhân cư trú, chi trả từ 2.000.000 ₫ mỗi lần: khấu trừ 10% thuế TNCN tại nguồn (Thông tư 111/2013, Điều 25). Haustek cấp chứng từ khấu trừ."; ruleEn = "Resident individual, payment of 2,000,000 ₫ or more: 10% personal income tax withheld at source (Circular 111/2013, Art. 25). Haustek issues a withholding certificate."; }
  else if (individual) { rule = "Cá nhân, dưới 2.000.000 ₫ mỗi lần: không khấu trừ."; ruleEn = "Individual, under 2,000,000 ₫ per payment: no withholding."; }
  else { rule = "Tổ chức: không khấu trừ; đối tác xuất hoá đơn điện tử cho Haustek theo bảng kê."; ruleEn = "Organisation: no withholding; the partner issues an e-invoice to Haustek against the statement."; }
  const pit = cents(amount * rate);
  return { amount, fxRate, vnd, individual, rate, pit, pitVnd: Math.round(vnd * rate), net: cents(amount - pit), netVnd: Math.round(vnd * (1 - rate)), rule, ruleEn, certificate: pit > 0, invoice: !individual };
}

/* ---- thông báo: sự kiện mới, mỗi vấn đề một dòng, ba mức ---- */
function notificationsOf(role, partyId) {
  const out = [];
  const partyKey = role === "label" ? "L:" + partyId : role === "artist" ? "A:" + partyId : null;
  const cut = isoDate(new Date(ASOF.getTime() - 45 * 864e5));
  const push = (id, at, tier, title, titleEn, body, bodyEn, di) => out.push({ id, at, tier, title, titleEn, body: body || "", bodyEn: bodyEn || "", di: di || null });
  if (partyKey) {
    PERIODS.forEach(p => { const s = state.statements[p.k] && state.statements[p.k][partyKey]; if (s) push("bk:" + p.k, String(s.at).slice(0, 10), "info", "Bảng kê kỳ " + p.label + " đã sẵn sàng", "Statement for " + p.label + " is ready", "Tải PDF ở trang Bảng kê thanh toán.", "Download the PDF from Statements.", "k-bang-ke"); });
    state.withdrawals.filter(w => w.partyKey === partyKey).slice(0, 6).forEach(w => push("rt:" + w.id + ":" + w.status, String(w.updatedAt).slice(0, 10), w.status === "rejected" ? "warn" : "info",
      "Yêu cầu rút " + w.id + ": " + ({ requested: "đã nhận", processing: "đang xử lý", paid: "đã chuyển", rejected: "bị từ chối", cancelled: "đã huỷ" }[w.status] || w.status), "Withdrawal " + w.id + ": " + w.status, fmt.usd(w.amount), fmt.usd(w.amount), "k-vi"));
    const q = qualityReport(role, partyId);
    q.rows.filter(r => r.dsp && r.status === "open").slice(0, 5).forEach(r => push("dsp:" + r.id, r.dsp.at, "critical", "Nền tảng gắn cờ lượt nghe giả: " + r.title, "Platform flagged artificial streams: " + r.title, r.dsp.removedStreams + " lượt bị gỡ · phạt " + fmt.usd(r.dsp.penaltyUsd) + "/tháng · có thể khiếu nại", r.dsp.removedStreams + " streams removed · " + fmt.usd(r.dsp.penaltyUsd) + "/month penalty · dispute available", "k-chat-luong"));
    if (q.counts.critical - q.counts.flagged > 0) push("q:crit", q.asOf, "warn", (q.counts.critical - q.counts.flagged) + " bài có nhiều tín hiệu bất thường cùng lúc", (q.counts.critical - q.counts.flagged) + " tracks with several unusual signals", "Xem tín hiệu và bằng chứng ở Chất lượng lượt nghe.", "See signals and evidence in Stream quality.", "k-chat-luong");
    const pl = playlistReport(role, partyId);
    const moi = pl.rows.filter(r => r.status === "active" && r.addedAt >= cut);
    if (moi.length) push("pl:" + moi[0].addedAt, moi[0].addedAt, "info", moi.length + " vị trí playlist mới trong 45 ngày", moi.length + " new playlist placements in 45 days", "Mới nhất: " + moi[0].title + " · " + moi[0].playlist + " #" + moi[0].position, "Latest: " + moi[0].title + " · " + moi[0].playlistEn + " #" + moi[0].position, "k-playlist");
    state.releases.filter(r => (role === "label" ? r.labelId === partyId : r.artistId === partyId)).slice(0, 4).forEach(r => push("ph:" + r.id + ":" + r.status, String(r.updatedAt || r.submittedAt || "").slice(0, 10), r.status === "returned" ? "warn" : "info",
      "Hồ sơ phát hành " + r.id + " · " + ({ submitted: "đã gửi", received: "đã tiếp nhận", coded: "đã cấp mã", released: "đã phát hành", returned: "bị trả lại" }[r.status] || r.status), "Release " + r.id + " · " + r.status, r.title, r.title, "k-phat-hanh"));
    const sp = splitsReport(role, partyId);
    if (sp.counts.invited) push("sp:invited", sp.asOf, "info", sp.counts.invited + " lời mời chia sẻ tác quyền chưa được nhận", sp.counts.invited + " split invitations still pending", "Nhắc người cộng tác nhận lời mời để được chia tiền.", "Remind collaborators to accept so they get paid.", "k-chia-se");
  } else {
    const rut = state.withdrawals.filter(w => w.status === "requested");
    if (rut.length) push("rt:req", String(rut[0].requestedAt).slice(0, 10), "warn", rut.length + " yêu cầu rút tiền chờ xử lý", rut.length + " withdrawal requests waiting", fmt.usd(rut.reduce((s, w) => s + w.amount, 0)), fmt.usd(rut.reduce((s, w) => s + w.amount, 0)), "chi-tra");
    const tk = state.tickets.filter(t => t.status !== "done");
    if (tk.length) push("tk:open", isoDate(ASOF), "info", tk.length + " yêu cầu hỗ trợ đang mở", tk.length + " open support tickets", "", "", "ho-tro");
    const q = qualityReport("admin", 0);
    if (q.counts.flagged) push("dsp:all", q.asOf, "critical", q.counts.flagged + " bài bị nền tảng gắn cờ · phạt " + fmt.usd(q.counts.penaltyUsd) + "/tháng", q.counts.flagged + " tracks flagged by platforms · " + fmt.usd(q.counts.penaltyUsd) + "/month", q.counts.removedStreams + " lượt nghe bị gỡ khỏi báo cáo", q.counts.removedStreams + " streams removed from reports", "chat-luong");
    const cases = q.cases.filter(c => c.pattern === "many-small-lifts");
    if (cases.length) push("q:lift", q.asOf, "warn", cases.length + " tài khoản có nhiều bài tăng đồng loạt", cases.length + " accounts with many small lifts at once", "Kiểu tách nhỏ để lách ngưỡng (vụ Michael Smith 2024).", "Spreading streams thinly to stay under thresholds (Smith case, 2024).", "chat-luong");
    const ph = state.releases.filter(r => r.status === "submitted");
    if (ph.length) push("ph:sub", isoDate(ASOF), "info", ph.length + " hồ sơ phát hành chờ tiếp nhận", ph.length + " releases awaiting intake", "", "", "phat-hanh");
    const gn = state.deliveries.filter(d => d.status !== "done");
    if (gn.length) push("gn:open", isoDate(ASOF), "info", gn.length + " yêu cầu giao nhận nền tảng đang mở", gn.length + " open delivery requests", "", "", "giao-nhan");
    const md = metadataReport("admin", 0);
    if (md.counts.blocking) push("md:block", md.asOf, "warn", md.counts.blocking + " bản ghi thiếu mã quan trọng (ISWC / IPI)", md.counts.blocking + " recordings missing key identifiers (ISWC / IPI)", "Giữ lại trước khi giao; xem Sức khoẻ metadata.", "Held before delivery; see Metadata health.", "chat-luong");
  }
  const read = lazyState("notifRead", {})[partyKey || "admin"] || {};
  out.forEach(n => { n.read = !!read[n.id]; });
  const tier = { critical: 0, warn: 1, info: 2 };
  out.sort((a, b) => (a.read - b.read) || (tier[a.tier] - tier[b.tier]) || (b.at < a.at ? -1 : b.at > a.at ? 1 : 0));
  return { asOf: isoDate(ASOF), unread: out.filter(n => !n.read).length, items: out.slice(0, 30) };
}
function markNotifications(role, partyId, ids) {
  const partyKey = role === "label" ? "L:" + partyId : role === "artist" ? "A:" + partyId : "admin";
  const st = lazyState("notifRead", {}); st[partyKey] = st[partyKey] || {};
  const at = nowISO();
  (ids === "all" ? notificationsOf(role, partyId).items.map(n => n.id) : [].concat(ids)).forEach(id => { st[partyKey][id] = at; });
  store.save();
  return notificationsOf(role, partyId);
}

/* ---- tìm nhanh toàn cục ---- */
let _titleLow = null;
function boDau(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }
function searchAll(role, partyId, q, limit) {
  q = boDau(String(q || "").trim()); limit = limit || 8;
  if (q.length < 2) return { tracks: [], parties: [], docs: [] };
  if (!_titleLow) { _titleLow = new Array(N); for (let i = 0; i < N; i++) _titleLow[i] = boDau(tTitle[i]); }
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const tracks = [];
  const isIsrc = /^[a-z]{2}[a-z0-9]{3}\d{2}/i.test(q);
  for (let k = 0; k < n && tracks.length < limit; k++) {
    const i = sc ? sc[k] : k;
    if (isIsrc ? tIsrc[i].toLowerCase().startsWith(q) : _titleLow[i].includes(q)) tracks.push({ id: i, title: tTitle[i], artist: ARTISTS[tArtist[i]].name, isrc: tIsrc[i], streamsMonth: recStreams[i * P + (P - 1)] });
  }
  tracks.sort((a, b) => b.streamsMonth - a.streamsMonth);
  const parties = [];
  if (role === "admin") {
    LABELS.forEach(l => { if (parties.length < limit && (boDau(l.name).includes(q) || l.clientId.toLowerCase().includes(q))) parties.push({ key: l.key, name: l.name, clientId: l.clientId, kind: "label" }); });
    ARTISTS.forEach(a => { if (parties.length < limit && (boDau(a.name).includes(q) || a.clientId.toLowerCase().includes(q))) parties.push({ key: a.key, name: a.name, clientId: a.clientId, kind: "artist" }); });
  } else if (role === "label") {
    ARTISTS.forEach(a => { if (parties.length < limit && a.labelId === partyId && boDau(a.name).includes(q)) parties.push({ key: a.key, name: a.name, clientId: a.clientId, kind: "artist" }); });
  }
  const docs = [];
  if (role === "admin") {
    state.withdrawals.forEach(w => { if (docs.length < limit && w.id.toLowerCase().includes(q)) docs.push({ id: w.id, kind: "withdrawal", title: w.party.name + " · " + fmt.usd(w.amount), di: "chi-tra" }); });
    state.tickets.forEach(t => { if (docs.length < limit && (t.id.toLowerCase().includes(q) || boDau(t.title).includes(q))) docs.push({ id: t.id, kind: "ticket", title: t.title, di: "ho-tro" }); });
    state.releases.forEach(r => { if (docs.length < limit && (r.id.toLowerCase().includes(q) || boDau(r.title).includes(q))) docs.push({ id: r.id, kind: "release", title: r.title, di: "phat-hanh" }); });
  }
  return { tracks, parties, docs };
}

/* ---- chiến dịch marketing: liên kết thông minh, pitch playlist, quảng cáo ---- */
function campaignsOf(role, partyId) {
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const step = n > 6000 ? Math.ceil(n / 6000) : 1;
  const top = [];
  for (let k = 0; k < n; k += step) { const i = sc ? sc[k] : k; const s = recStreams[i * P + (P - 1)]; if (s > 0) top.push({ i, s }); }
  top.sort((a, b) => b.s - a.s);
  const pick = top.slice(0, role === "admin" ? 24 : 8);
  const rows = [];
  pick.forEach((x, k) => {
    const i = x.i, h = hash(i, 131);
    const kinds = ["smartlink", "pitch", "ads"];
    const nKinds = 1 + Math.floor(hash(i, 132) * 3);
    for (let m = 0; m < nKinds; m++) {
      const kind = kinds[(Math.floor(h * 10) + m) % 3];
      const startBack = Math.floor(hash(i, 133 + m) * 70), dur = 14 + Math.floor(hash(i, 137 + m) * 30);
      const start = new Date(ASOF.getTime() - startBack * 864e5), end = new Date(start.getTime() + dur * 864e5);
      const status = end < ASOF ? "done" : start > ASOF ? "planned" : "running";
      const base = { id: "CD-" + String(i).padStart(5, "0") + "-" + kind.slice(0, 2).toUpperCase(), trackId: i, title: tTitle[i], artist: ARTISTS[tArtist[i]].name, partyKey: partyKeyOfTrack(i), kind, status, start: isoDate(start), end: isoDate(end), days: dur };
      const daysRun = Math.max(0, Math.min(dur, Math.floor((Math.min(ASOF, end) - start) / 864e5)));
      if (kind === "smartlink") {
        const views = Math.round((400 + hash(i, 141 + m) * 6000) * daysRun / dur * (status === "planned" ? 0 : 1));
        const clicks = Math.round(views * (0.25 + hash(i, 142 + m) * 0.35)), presaves = Math.round(clicks * (0.12 + hash(i, 143 + m) * 0.25));
        Object.assign(base, { kindLabel: "Liên kết thông minh · pre-save", kindLabelEn: "Smart link · pre-save", url: "htk.link/" + tIsrc[i].slice(-6).toLowerCase(), views, clicks, presaves, conversion: views ? presaves / views : 0,
          byStore: [["Spotify", 0.46], ["Apple Music", 0.22], ["YouTube Music", 0.17], ["Zing MP3", 0.15]].map(s => ({ name: s[0], clicks: Math.round(clicks * s[1]) })) });
      } else if (kind === "pitch") {
        const pitched = 3 + Math.floor(hash(i, 144 + m) * 9), accepted = Math.round(pitched * (0.1 + hash(i, 145 + m) * 0.4));
        const names = PLAYLISTS.filter((p, idx) => idx % 3 === (i % 3)).slice(0, pitched);
        Object.assign(base, { kindLabel: "Pitch playlist biên tập", kindLabelEn: "Editorial playlist pitching", pitched, accepted, pending: status === "running" ? Math.max(0, Math.round((pitched - accepted) * 0.4)) : 0,
          playlists: names.map((p, idx) => ({ playlist: p.n, playlistEn: p.en || p.n, platform: p.plat, result: idx < accepted ? "accepted" : (status === "running" && idx < accepted + 2) ? "pending" : "declined" })) });
      } else {
        const budget = Math.round(100 + hash(i, 146 + m) * 900), spent = cents(budget * (status === "done" ? 1 : status === "planned" ? 0 : daysRun / dur));
        const impressions = Math.round(spent * (180 + hash(i, 147 + m) * 220)), clicks = Math.round(impressions * (0.008 + hash(i, 148 + m) * 0.02)), streams = Math.round(clicks * (0.9 + hash(i, 149 + m) * 1.6));
        Object.assign(base, { kindLabel: "Quảng cáo trả phí", kindLabelEn: "Paid ads", channel: ["Meta", "TikTok", "YouTube"][Math.floor(hash(i, 150 + m) * 3)], budget, spent, impressions, clicks, streams, cpc: clicks ? cents(spent / clicks) : 0, costPerStream: streams ? cents(spent / streams) : 0 });
      }
      rows.push(base);
    }
  });
  const order = { running: 0, planned: 1, done: 2 };
  rows.sort((a, b) => order[a.status] - order[b.status] || (b.start < a.start ? -1 : 1));
  const running = rows.filter(r => r.status === "running");
  return { asOf: isoDate(ASOF), counts: { total: rows.length, running: running.length, planned: rows.filter(r => r.status === "planned").length, done: rows.filter(r => r.status === "done").length,
      spent: cents(rows.filter(r => r.kind === "ads").reduce((s, r) => s + r.spent, 0)), streamsFromAds: rows.filter(r => r.kind === "ads").reduce((s, r) => s + r.streams, 0),
      presaves: rows.filter(r => r.kind === "smartlink").reduce((s, r) => s + r.presaves, 0), accepted: rows.filter(r => r.kind === "pitch").reduce((s, r) => s + r.accepted, 0), pitched: rows.filter(r => r.kind === "pitch").reduce((s, r) => s + r.pitched, 0) },
    rows, sampled: step > 1,
    note: "Ba loại chiến dịch: liên kết thông minh có pre-save (lượt xem → bấm → lưu trước), pitch playlist biên tập (gửi → nhận), quảng cáo trả phí (ngân sách → hiển thị → bấm → lượt nghe quy được). Số liệu mẫu; hệ thống thật nhận từ công cụ liên kết và tài khoản quảng cáo.",
    noteEn: "Three campaign kinds: smart links with pre-save (views → clicks → saves), editorial playlist pitching (sent → accepted), paid ads (budget → impressions → clicks → attributed streams). Sample figures; the real system reads from the link tool and ad accounts." };
}

const TICKET_TYPES = [
  { id: "phat-hanh",  label: "Phát hành",         labelEn: "Release" },
  { id: "nen-tang",   label: "Nền tảng",          labelEn: "Platform" },
  { id: "thanh-toan", label: "Thanh toán",        labelEn: "Payment" },
  { id: "marketing",  label: "Marketing",         labelEn: "Marketing" },
  { id: "quyen",      label: "Bản quyền",         labelEn: "Rights" },
  { id: "tai-khoan",  label: "Tài khoản",         labelEn: "Account" },
  { id: "khac",       label: "Khác",              labelEn: "Other" }
];
const TICKET_STATUS = ["open", "in_progress", "waiting", "done"];
let ticketSeq = 0;
function ticketId(at) { ticketSeq++; return "HT-" + String(at).slice(2, 4) + String(at).slice(5, 7) + "-" + String(ticketSeq).padStart(3, "0"); }
function slaDue(at, priority) { return addDays(String(at).slice(0, 10), priority === "urgent" ? 1 : priority === "high" ? 2 : priority === "low" ? 7 : 3) + " 17:00:00"; }
function createTicket(o) {
  const at = o.at || nowISO();
  const t = { id: ticketId(at), type: TICKET_TYPES.some(x => x.id === o.type) ? o.type : "khac",
    title: String(o.title || "").trim(), partyKey: o.partyKey, party: { name: partyName(o.partyKey), clientId: partyClientId(o.partyKey) },
    trackId: o.trackId != null ? +o.trackId : null, track: o.trackId != null && tTitle[+o.trackId] ? { title: tTitle[+o.trackId], isrc: tIsrc[+o.trackId] } : null,
    createdBy: o.createdBy || partyClientId(o.partyKey), source: o.source || "portal",
    createdAt: at, updatedAt: at, status: o.status || "open", priority: o.priority || "normal",
    assignee: o.assignee || null, dueAt: slaDue(at, o.priority || "normal"),
    messages: [{ at, by: o.createdBy || partyClientId(o.partyKey), who: o.who || "partner", text: String(o.body || "").trim() }] };
  if (!t.title) throw new Error("Thiếu tiêu đề yêu cầu");
  state.tickets.unshift(t);
  return t;
}
function seedTickets() {
  if (state.tickets.length) return;
  const parties = []; const seen = new Set();
  state.accounts.filter(a => a.role !== "admin" && a.partyKey && a.status === "active").forEach(a => { if (!seen.has(a.partyKey)) { seen.add(a.partyKey); parties.push(a.partyKey); } });
  const sup = staffByRole("support"), acc = staffByRole("accounting")[0], ops = staffByRole("ops")[0];
  const mau = [
    ["nen-tang", "Bài hát chưa hiện trên Apple Music sau 5 ngày", "Bài đã lên Spotify từ tuần trước nhưng tìm trên Apple Music vẫn chưa thấy. Nhờ Haustek kiểm tra giúp.", "in_progress", "high"],
    ["thanh-toan", "Chưa nhận được tiền của yêu cầu rút tháng trước", "Yêu cầu rút ngày 12/08 báo đã thanh toán nhưng tài khoản ngân hàng chưa thấy tiền về.", "waiting", "high"],
    ["phat-hanh", "Đổi ngày phát hành của single sắp tới", "Xin dời ngày phát hành từ 26/09 sang 10/10 vì MV chưa xong.", "open", "normal"],
    ["quyen", "Video trên YouTube bị bên khác nhận quyền", "Kênh của tôi bị claim bài của chính tôi, tiền quảng cáo đang chảy sang bên khác.", "in_progress", "urgent"],
    ["marketing", "Đăng ký gói pitch playlist cho EP mới", "Muốn được gửi đề xuất lên playlist biên tập của Spotify và Zing cho EP phát hành tháng 10.", "open", "normal"],
    ["tai-khoan", "Cập nhật tài khoản ngân hàng nhận tiền", "Đổi sang tài khoản Techcombank mới, đính kèm giấy xác nhận.", "done", "normal"],
    ["nen-tang", "Ảnh bìa hiển thị sai trên Zing MP3", "Zing đang hiện ảnh bìa cũ của bản single, không phải bản EP.", "done", "low"],
    ["phat-hanh", "Bổ sung lời bài hát cho 3 bài", "Gửi kèm lời bài hát để hiện trên Spotify và Apple Music.", "in_progress", "low"],
    ["thanh-toan", "Xin bảng kê PDF kỳ 05/2026", "Kế toán bên tôi cần bảng kê có dấu để hạch toán.", "done", "normal"],
    ["quyen", "Bài bị gỡ khỏi TikTok vì khiếu nại bản quyền", "Bài bị gỡ từ hôm qua, tôi là chủ sở hữu hợp pháp, xin hỗ trợ khiếu nại lại.", "open", "urgent"],
    ["marketing", "Chạy quảng cáo TikTok cho bài mới", "Ngân sách khoảng $500, muốn Haustek tư vấn và chạy giúp.", "waiting", "normal"],
    ["khac", "Hỏi về thuế khấu trừ trên bảng kê", "Bảng kê có dòng thuế khấu trừ tại nguồn, xin giải thích cách tính.", "open", "low"],
    ["nen-tang", "Tên nghệ sĩ bị gộp nhầm với nghệ sĩ khác trên Spotify", "Trang nghệ sĩ Spotify của tôi đang hiện bài của một người trùng tên.", "in_progress", "high"],
    ["phat-hanh", "Hồ sơ album bị trả lại, cần hướng dẫn", "Hồ sơ HSTK bị trả lại vì thiếu file WAV, xin hướng dẫn định dạng chuẩn.", "done", "normal"]
  ];
  const ngay = ["2026-08-05 09:14:00", "2026-08-08 14:02:00", "2026-08-12 10:30:00", "2026-08-14 16:45:00", "2026-08-18 11:20:00", "2026-08-19 09:05:00",
    "2026-08-21 15:12:00", "2026-08-24 10:48:00", "2026-08-26 13:33:00", "2026-08-28 08:56:00", "2026-08-30 17:20:00", "2026-09-01 09:41:00", "2026-09-02 14:15:00", "2026-09-03 10:07:00"];
  mau.forEach((m, k) => {
    const pk = parties[k % parties.length];
    const id = +pk.slice(2);
    const ids = pk[0] === "L" ? idxOf(byLabel, id) : idxOf(byArtist, id);
    const trackId = (m[0] === "nen-tang" || m[0] === "quyen" || m[0] === "marketing") && ids.length ? ids[(k * 7) % ids.length] : null;
    const t = createTicket({ type: m[0], title: m[1], body: m[2], partyKey: pk, trackId, at: ngay[k], status: m[3], priority: m[4],
      assignee: m[0] === "thanh-toan" || m[0] === "khac" ? acc.id : (m[0] === "quyen" ? sup[1].id : (m[0] === "phat-hanh" ? ops.id : sup[0].id)) });
    const nv = staffById(t.assignee);
    if (m[3] !== "open") {
      t.messages.push({ at: addDays(ngay[k].slice(0, 10), 1) + " 09:30:00", by: nv.email, who: "staff",
        text: m[3] === "done" ? "Đã xử lý xong. Bạn kiểm tra lại giúp và phản hồi nếu còn vướng." : m[3] === "waiting" ? "Haustek đã gửi yêu cầu sang nền tảng, đang chờ phản hồi (thường 3 đến 5 ngày làm việc)." : "Đã tiếp nhận, đang xử lý. Sẽ cập nhật trong 2 ngày làm việc." });
      t.updatedAt = t.messages[t.messages.length - 1].at;
    }
    if (m[3] === "done") t.closedAt = t.updatedAt;
  });
  state.tickets.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/* =====================================================================
   19f. QUẢN LÝ QUYỀN — xung đột Content ID và khiếu nại trên nền tảng
   ===================================================================== */
const CLAIM_CAT = [
  { id: "ownership-conflict", label: "Xung đột sở hữu", labelEn: "Ownership conflict", mo: "Hai bên cùng khai sở hữu bản ghi ở cùng thị trường" },
  { id: "invalid-reference",  label: "Tham chiếu không hợp lệ", labelEn: "Invalid reference", mo: "Tham chiếu Content ID chứa đoạn không thuộc bản ghi (nhạc nền, mẫu âm thanh)" },
  { id: "duplicate",          label: "Trùng bản ghi", labelEn: "Duplicate", mo: "Cùng một bản ghi được giao hai lần dưới hai mã" },
  { id: "unauthorized-use",   label: "Sử dụng trái phép", labelEn: "Unauthorized use", mo: "Kênh bên ngoài dùng bản ghi mà không có quyền" },
  { id: "monetization-off",   label: "Chưa bật kiếm tiền", labelEn: "Monetisation off", mo: "Video của chủ sở hữu chưa được bật kiếm tiền" }
];
const CLAIM_STATUS = ["open", "disputed", "escalated", "resolved", "released"];
const OTHER_PARTIES = ["Blue Harbor Music", "Northline Records", "Sakura Wave Ent.", "Delta Sound Co.", "Mirage Digital", "Kênh Nhạc Trẻ 24h", "Lofi Corner VN", "Tổng hợp Bolero"];
function seedClaims() {
  if (state.claims.length) return;
  const parties = []; const seen = new Set();
  state.accounts.filter(a => a.role !== "admin" && a.partyKey && a.status === "active").forEach(a => { if (!seen.has(a.partyKey)) { seen.add(a.partyKey); parties.push(a.partyKey); } });
  const sup = staffByRole("support");
  for (let k = 0; k < 44; k++) {
    const h = hash(k, 95);
    let i;
    if (k < 30) { const pk = parties[k % parties.length]; const id = +pk.slice(2); const ids = pk[0] === "L" ? idxOf(byLabel, id) : idxOf(byArtist, id); i = ids[(k * 13) % ids.length]; }
    else i = (hash(k, 96) * N) | 0;
    const cat = CLAIM_CAT[(h * CLAIM_CAT.length) | 0];
    const store = h < 0.7 ? "YouTube" : h < 0.85 ? "Facebook" : "TikTok";
    const st = CLAIM_STATUS[(hash(k, 97) * 5) | 0];
    const created = addDays("2026-06-01", (hash(k, 98) * 90) | 0);
    const upd = addDays(created, 1 + ((hash(k, 99) * 12) | 0));
    state.claims.push({ id: "CL-" + String(k + 1).padStart(4, "0"), trackId: i, track: { title: tTitle[i], isrc: tIsrc[i], artist: ARTISTS[tArtist[i]].name, upc: tUpc[i] },
      partyKey: partyKeyOfTrack(i), party: { name: partyName(partyKeyOfTrack(i)), clientId: partyClientId(partyKeyOfTrack(i)) },
      store, category: cat.id, assetId: "A" + maNgauNhien(k + 1, 100, 16, "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"),
      otherParty: cat.id === "monetization-off" ? null : OTHER_PARTIES[(hash(k, 101) * OTHER_PARTIES.length) | 0],
      country: TERR[(hash(k, 102) * 6) | 0], dailyViews: Math.round(200 + hash(k, 103) * 48000), status: st,
      priority: hash(k, 104) < 0.15 ? "urgent" : hash(k, 104) < 0.45 ? "high" : "normal",
      createdAt: created + " 08:30:00", updatedAt: upd + " 14:10:00", expiresAt: st === "disputed" || st === "escalated" ? addDays(created, 30) : null,
      assignee: sup[k % sup.length].id, notes: st === "open" ? [] : [{ at: upd + " 14:10:00", by: sup[k % sup.length].email, text: st === "resolved" ? "Nền tảng đã xác nhận quyền về Haustek." : st === "released" ? "Đã nhả claim, bản ghi không thuộc danh mục." : "Đã gửi tranh chấp kèm hợp đồng và file master." }] });
  }
  state.claims.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/* =====================================================================
   19g. GIAO NHẬN NỀN TẢNG và SỬA HÀNG LOẠT — công cụ vận hành
   ===================================================================== */
const DELIVERY_SUBJECTS = [
  { id: "producer",  label: "Theo nhà sản xuất / label", labelEn: "By producer / label" },
  { id: "upc-list",  label: "Theo danh sách UPC",          labelEn: "By UPC list" },
  { id: "upc-file",  label: "Theo file UPC",               labelEn: "By UPC file" },
  { id: "albums",    label: "Chọn bản phát hành",          labelEn: "Pick releases" }
];
const BULK_ACTIONS = [
  { id: "lock",         label: "Khoá / mở khoá danh sách bản phát hành", labelEn: "Lock or unlock a list of releases" },
  { id: "price",        label: "Đổi giá album",                          labelEn: "Change album price" },
  { id: "release-date", label: "Đổi ngày phát hành số của album",        labelEn: "Change albums’ digital release date" },
  { id: "track-price",  label: "Đổi giá track trên bản phát hành",       labelEn: "Change track price on releases" }
];
let deliverySeq = 0, bulkSeq = 0;
function createDelivery(o, by) {
  if (!String(o.name || "").trim()) throw new Error("Thiếu tên yêu cầu");
  if (!o.platforms || !o.platforms.length) throw new Error("Chưa chọn nền tảng");
  if (!o.subject || !DELIVERY_SUBJECTS.some(s => s.id === o.subject.type)) throw new Error("Chưa chọn đối tượng giao");
  const at = o.at || nowISO();
  const count = o.subject.count || (o.subject.value ? String(o.subject.value).split(/[\s,;]+/).filter(Boolean).length : 0);
  const d = { id: "GN-" + at.slice(2, 4) + at.slice(5, 7) + "-" + String(++deliverySeq).padStart(3, "0"), name: String(o.name).trim(),
    subject: { type: o.subject.type, value: String(o.subject.value || ""), count }, platforms: o.platforms.slice(),
    createdAt: at, updatedAt: at, by: by || "ops@haustek-group.com", status: o.status || "queued",
    progress: { sent: o.status === "done" ? count * o.platforms.length : 0, total: count * o.platforms.length } };
  state.deliveries.unshift(d);
  return d;
}
function createBulk(o, by) {
  if (!BULK_ACTIONS.some(a => a.id === o.action)) throw new Error("Thao tác không hợp lệ");
  const upcs = String(o.upcs || "").split(/[\s,;]+/).filter(Boolean);
  if (!upcs.length) throw new Error("Chưa có UPC nào");
  const at = o.at || nowISO();
  const r = { id: "SL-" + at.slice(2, 4) + at.slice(5, 7) + "-" + String(++bulkSeq).padStart(3, "0"), action: o.action, upcs, count: upcs.length,
    value: o.value == null ? "" : String(o.value), createdAt: at, updatedAt: at, by: by || "ops@haustek-group.com", status: o.status || "queued", note: o.note || "" };
  state.bulk.unshift(r);
  return r;
}
function seedOps() {
  if (!state.deliveries.length) {
    [["Giao lại catalog Nightform sang Apple Music", { type: "producer", value: "HTK-L001", count: 451 }, ["Apple Music"], "2026-08-20 10:15:00", "done"],
     ["Bổ sung 12 UPC thiếu trên Zing MP3", { type: "upc-list", value: "880012345678 880012345679 880012345680", count: 12 }, ["Zing MP3", "NhacCuaTui"], "2026-08-27 15:40:00", "done"],
     ["Giao EP Đêm thứ hai lên TikTok và Instagram", { type: "albums", value: "HSTK-2608-001", count: 3 }, ["TikTok", "Instagram", "Facebook"], "2026-09-01 09:20:00", "sending"],
     ["Giao lại toàn bộ cho Amazon Music sau lỗi metadata", { type: "upc-file", value: "amazon-redeliver-0903.csv", count: 1180 }, ["Amazon Music"], "2026-09-03 11:05:00", "queued"]
    ].forEach(m => { const d = createDelivery({ name: m[0], subject: m[1], platforms: m[2], at: m[3], status: m[4] }); if (m[4] === "sending") d.progress.sent = Math.round(d.progress.total * 0.4); });
  }
  if (!state.bulk.length) {
    [["lock", "880038358681 880084563223 880012345678", "locked", "2026-08-11 09:00:00", "done"],
     ["price", "880012345679 880012345680 880012345681 880012345682", "9.99 USD", "2026-08-15 14:20:00", "done"],
     ["release-date", "880012345690", "2026-10-10", "2026-08-22 10:10:00", "done"],
     ["track-price", "880012345700 880012345701", "1.29 USD", "2026-08-26 16:00:00", "failed"],
     ["lock", "880012345710 880012345711 880012345712 880012345713 880012345714", "unlocked", "2026-08-29 11:30:00", "done"],
     ["price", "880012345720", "7.99 USD", "2026-09-02 09:45:00", "queued"],
     ["release-date", "880012345730 880012345731", "2026-11-14", "2026-09-03 15:25:00", "queued"]
    ].forEach(m => createBulk({ action: m[0], upcs: m[1], value: m[2], at: m[3], status: m[4], note: m[4] === "failed" ? "2 UPC không tồn tại trong danh mục" : "" }));
  }
  if (!Object.keys(state.videoSettings).length) {
    const seen = new Set();
    state.accounts.filter(a => a.role !== "admin" && a.partyKey && a.status === "active").forEach((a, n) => {
      if (seen.has(a.partyKey)) return; seen.add(a.partyKey);
      state.videoSettings[a.partyKey] = { channel: "UC" + maNgauNhien(n + 3, 110, 22, B62), policy: ["monetize", "monetize", "track", "block"][n % 4],
        autoClaim: n % 3 !== 2, whitelist: n % 4 === 0 ? ["Kênh chính thức", "Fanpage"] : [], updatedAt: "2026-08-0" + (1 + n % 9) + " 10:00:00" };
    });
  }
}

const audit = {
  log(action, detail, by) {
    state.audit.unshift({ at: nowISO(), action, detail, by: by || "mgmt@haustek-group.com" });
    if (state.audit.length > 400) state.audit.length = 400;
  },
  list(limit) { return state.audit.slice(0, limit || 100); }
};
function nowISO() { return new Date().toISOString().slice(0, 19).replace("T", " "); }

/* =====================================================================
   19. CÂU HỎI CÒN TREO  (mục 3 tài liệu bàn giao)
   Bản mẫu phải đoán ở sáu chỗ. Đoán sai là làm lại từ gốc, nên để hẳn
   một màn hình cho chúng, admin trả lời tới đâu ghi lại tới đó rồi xuất
   ra cho người viết schema.
   ===================================================================== */
const QUESTIONS = [
  { id: "q1", t: "Client ID có duy nhất cho mỗi nghệ sĩ không?",
    why: "Đây là chỗ quyết định ai đăng nhập thì thấy dòng nào. Nếu một bản ghi mang nhiều Client ID thì phải có bảng nối riêng, không thể để một cột.",
    guess: "Bản mẫu đang giả định 1 nghệ sĩ = 1 Client ID, và bản ghi trỏ về đúng một nghệ sĩ chính." ,
    tEn: "Is a Client ID unique per artist?",
    whyEn: "This decides who sees which rows when they log in. If one recording can carry several Client IDs, that needs its own join table — it cannot be a single column.",
    guessEn: "The prototype assumes 1 artist = 1 Client ID, and that a recording points at exactly one main artist." },
  { id: "q2", t: "ISRC (Optional 1) nghĩa là gì?",
    why: "Tên cột hàm ý sau này còn Optional 2. Nếu một bài mang hai mã (phát hành lại, đổi nhà phân phối) thì báo cáo về theo từng mã riêng và phải gộp lại, không thì một bài hát hiện thành hai dòng rời rạc.",
    guess: "Bản mẫu để mã phụ thành bảng riêng (mỗi bài 0..n mã), không thêm cột." ,
    tEn: "What does ISRC (Optional 1) mean?",
    whyEn: "The column name implies an Optional 2 will follow. If one track carries two codes (a re-release, a change of distributor), reports arrive against each code separately and have to be merged — otherwise one track shows as two disconnected rows.",
    guessEn: "The prototype keeps alternate codes in a separate table (0..n per track) rather than adding columns." },
  { id: "q3", t: "Rate Share một cột có đủ không?",
    why: "Nếu là 'phần đối tác và phần Haustek' thì đủ. Nếu nghệ sĩ, producer, người sáng tác mỗi người một phần thì phải tách bảng chia phần, mỗi dòng một người.",
    guess: "Bản mẫu tách: tỷ lệ của bên thụ hưởng chính nằm ở bảng có ngày hiệu lực, điểm producer là trường riêng trên bản ghi, phần sáng tác là bảng riêng." ,
    tEn: "Is one Rate Share column enough?",
    whyEn: "If it means 'the client's share vs Haustek's', then yes. If artist / producer / songwriter each have their own share, it needs a split table with one row per person.",
    guessEn: "The prototype separates them: the main payee's rate lives in a dated table, producer points are a field on the recording, and writer shares are their own table." },
  { id: "q4", t: "Tính bằng tiền gì, quy đổi lúc nào?",
    why: "Chuẩn ngành là giữ tiền tệ gốc của từng nền tảng rồi quy đổi sang đồng tiền thanh toán. Cần chốt: quy đổi sang VND hay giữ USD, dùng tỷ giá ngày nhận báo cáo, ngày chốt kỳ hay ngày thanh toán.",
    guess: "Bản mẫu tính bằng USD, chốt một tỷ giá cho mỗi kỳ lúc xét duyệt kỳ, và giữ nguyên tỷ giá đó về sau." ,
    tEn: "Which currency, converted when?",
    whyEn: "Industry practice is to keep each platform's source currency and convert at payout. We need to settle: convert to VND or stay in USD, and use the rate on the report date, the period-close date, or the payment date.",
    guessEn: "The prototype computes in USD, locks one rate per period at approval, and freezes it." },
  { id: "q5", t: "Album / Track / Composition có tách làm ba thực thể không?",
    why: "Hệ thống tham chiếu tách hẳn ba mục. Bản mẫu đang gộp track với composition, biết là sai nhưng phải chốt cùng lúc với schema.",
    guess: "Bản mẫu vẫn gộp track với composition, chỉ tách phần sáng tác thành bảng chia phần." ,
    tEn: "Are Album / Track / Composition three separate entities?",
    whyEn: "The reference system keeps all three apart. The prototype merges track with composition — we know that is wrong, but it has to be settled together with the schema.",
    guessEn: "The prototype still merges track with composition, and only separates writer shares into their own split table." },
  { id: "q6", t: "Label có kiêm publisher không?",
    why: "Quyết định label có thấy tab tác quyền hay không.",
    guess: "Bản mẫu giả định là không: tác quyền thuộc người sáng tác, không đi qua label." ,
    tEn: "Does a label also act as publisher?",
    whyEn: "This decides whether a label sees a publishing tab at all.",
    guessEn: "The prototype assumes NOT — publishing belongs to the writers and never passes through a label." },
  { id: "q7", t: "Con số ở cột doanh thu trong file báo cáo là trước hay sau khi đơn vị phân phối giữ phần của họ?",
    why: "Đây là câu hỏi đắt nhất trong danh sách, và tài liệu bàn giao chưa nêu. "
       + "Nếu con số trong file đã trừ phần của đối tác rồi mà hệ thống lại tính phí dịch vụ Haustek 15% trên đó, "
       + "thì cái mà nghệ sĩ đọc là 'doanh thu gộp' thật ra không phải doanh thu gộp, và mọi chặng phía sau "
       + "đều sai lệch theo. Ngược lại, nếu là số gộp thật mà hệ thống không trừ phần đối tác thì Haustek thiếu tiền. "
       + "Chênh lệch giữa hai cách hiểu là hơn 10% trên từng dòng, từng kỳ, từng người. "
       + "Không đoán được, phải nhìn file báo cáo doanh thu mẫu.",
    guess: "Bản mẫu đang coi con số trong file là doanh thu gộp thật, và phí dịch vụ Haustek 15% tính trên đó. "
         + "Phần đối tác phân phối giữ nằm ngoài mô hình. Nếu thực tế ngược lại thì phải sửa chuỗi chia tiền, "
         + "không phải sửa giao diện." ,
    tEn: "Is the revenue figure in the report file BEFORE or AFTER the distributor takes their share?",
    whyEn: "This is the most expensive question on the list, and the handoff document does not address it. If the figure in the file is already net of the partner's share and the system then charges the 15% Haustek fee on top of it, then what an artist reads as 'gross revenue' is not gross revenue — and every step after it is off by the same amount. Conversely, if it is a true gross figure and the system does not deduct the partner's share, Haustek is short. The gap between the two readings is over 10% on every line, every period, every person. It cannot be guessed — it needs a sample revenue report.",
    guessEn: "The prototype treats the figure in the file as a true gross number and charges the 15% Haustek fee on it. The distributor's own share sits outside the model. If reality is the other way round, the money chain has to change — not the interface." },
  { id: "q8", t: "Nghệ sĩ thuộc label nhận tiền từ Haustek hay từ label?",
    why: "Quyết định toàn bộ trang của nghệ sĩ thuộc label. Nếu Haustek thanh toán thẳng cho nghệ sĩ theo tỷ lệ label khai, "
       + "nghệ sĩ có bảng kê và số thanh toán riêng như bản mẫu đang vẽ. Nếu Haustek chuyển cả gói cho label rồi label tự chia, "
       + "nghệ sĩ chỉ có 'phần được hưởng theo bảng chia của label' và không có khoản thanh toán nào từ Haustek; bảng kê, "
       + "ngưỡng thanh toán, tạm ứng của họ đều là chuyện giữa họ với label.",
    guess: "Bản mẫu giả định Haustek thanh toán thẳng cho từng nghệ sĩ theo tỷ lệ label đặt, và label nhận phần còn lại. "
         + "Trang Hợp đồng & tỷ lệ của nghệ sĩ nói rõ giả định này." ,
    tEn: "Are artists under a label paid by Haustek or by the label?",
    whyEn: "This decides the whole label-artist experience. If Haustek pays artists directly at the rate the label declared, they have their own statement and payout as the prototype draws. If Haustek pays the label in full and the label splits it, the artist only has 'a share per the label's split table' and no payout from Haustek; their statement, threshold and advance are between them and the label.",
    guessEn: "The prototype assumes Haustek pays each artist directly at the label's rate, with the label receiving the remainder. The artist's Agreement & rate card states this assumption." },
  { id: "q9", t: "Label mẹ có được hưởng phần nào trên doanh thu của label con không?",
    why: "Quyết định label mẹ chỉ THEO DÕI label con hay còn có DÒNG TIỀN từ label con. Nếu có, cần thêm một tỷ lệ nữa trong bảng tỷ lệ (phần label mẹ trên phần label con được hưởng), "
       + "bảng kê của label con phải hiện khoản khấu trừ đó, và bảng thanh toán của Haustek có thêm một dòng cho label mẹ. Nếu không, cây label chỉ là uỷ quyền xem.",
    guess: "Bản mẫu giả định KHÔNG: phần label được hưởng của một bản ghi thuộc về label trực tiếp quản lý bản ghi đó. Label mẹ xem được toàn bộ số liệu của label con và nghệ sĩ bên dưới, nhưng không có dòng tiền nào đi qua label mẹ.",
    tEn: "Does a parent label take a share of its sub-labels’ revenue?",
    whyEn: "This decides whether the parent label only MONITORS sub-labels or also has a MONEY FLOW from them. If it does, the rate table needs one more rate (the parent’s share of the sub-label’s cut), the sub-label’s statement must show that deduction, and Haustek’s payout run gains a row for the parent. If not, the label tree is a viewing delegation only.",
    guessEn: "The prototype assumes NO: the label share on a recording belongs to the label that directly manages it. The parent sees every figure of its sub-labels and their artists, but no money passes through the parent." },
  { id: "q10", t: "Báo cáo về muộn (TikTok theo quý) ghi vào kỳ nào?",
    why: "Đối tác rút tiền theo số dư ví: nguồn nào về trước thì ghi trước. Nếu TikTok của tháng 7 về cuối quý 3, phần đó là 'điều chỉnh của kỳ 07' (sửa lại kỳ đã xét duyệt) hay là 'khoản mới của kỳ 09' (kỳ đang mở)? Cách một giữ bảng kê đúng theo tháng nhưng phải mở lại kỳ; cách hai giữ kỳ đã chốt bất biến nhưng bảng kê tháng 9 mang cả tiền tháng 7.",
    guess: "Bản mẫu chọn cách hai cho ví: kỳ đã xét duyệt là bất biến, nguồn về muộn được nhập vào kỳ đang mở và ghi rõ 'TikTok kỳ 07/2026, về muộn'. Bảng kê PDF ghi chú dòng này.",
    tEn: "Where do late reports (quarterly TikTok) land?",
    whyEn: "Partners withdraw from a wallet balance: whatever arrives first is credited first. If July’s TikTok arrives at the end of Q3, is it an 'adjustment to July' (reopening an approved period) or a 'new credit in September' (the open period)? The first keeps statements true to the month but reopens periods; the second keeps approved periods immutable but September’s statement carries July money.",
    guessEn: "The prototype chooses the second for the wallet: approved periods are immutable, late sources are loaded into the open period and labelled 'TikTok 07/2026, late'. The PDF statement notes the line." }
];
const SAMPLES_NEEDED = [
  { id: "s1", t: "File mẫu master data 10–15 dòng",
    why: "Đã xoá hai cột Distribution và Rate Share. Cần thấy định dạng giá trị thật, không phải tên cột: ISRC viết hoa hay thường, ngày kiểu nào, Client ID có tiền tố gì, tên nghệ sĩ có dấu ra sao." ,
    tEn: "A sample master-data file, 10–15 rows",
    whyEn: "The Distribution and Rate Share columns have been removed. What we need to see is the ACTUAL VALUE FORMAT, not the column names: is the ISRC upper or lower case, which date format, does the Client ID carry a prefix, how are Vietnamese artist names accented." },
  { id: "s2", t: "File báo cáo doanh thu mẫu của cả 3 nguồn",
    why: "Che số tiền, giữ nguyên tên cột và 1–2 dòng. Cấu trúc ba file này quyết định toàn bộ thiết kế quy trình nhập: phần khó nhất, và cũng là phần không đoán được." ,
    tEn: "A sample revenue report from each of the 3 feeds",
    whyEn: "Mask the amounts, keep the column names and one or two rows. The structure of these three files determines the entire ingest design — the hardest part of the project, and the part that cannot be guessed." }
];

/* =====================================================================
   20. TỶ GIÁ
   ===================================================================== */
const fx = {
  get() { return state.fx; },
  set(rate, at, policy) {
    if (!(rate > 0)) throw new Error("Tỷ giá phải lớn hơn 0");
    state.fx.rate = rate; state.fx.at = at || state.fx.at; state.fx.policy = policy || state.fx.policy;
    audit.log("fx.set", "1 USD = " + fmt.num(rate) + " ₫ · " + state.fx.at);
    store.save();
  },
  lock(pIdx, rate) {
    const pk = PERIODS[pIdx].k;
    if (state.approved[pk]) throw new Error("Kỳ đã xét duyệt, tỷ giá đã chốt, không thay đổi được nữa");
    state.fx.locked[pk] = { rate: rate || state.fx.rate, at: nowISO().slice(0, 10) };
    audit.log("fx.lock", "Chốt tỷ giá kỳ " + PERIODS[pIdx].label + ": 1 USD = " + fmt.num(state.fx.locked[pk].rate) + " ₫");
    store.save();
  },
  rateFor(periodKey) { return (state.fx.locked[periodKey] || state.fx).rate; }
};

/* =====================================================================
   21. NẠP DỮ LIỆU
   Ở bản mẫu, "nạp" là mô phỏng: bật cờ luồng đó lên và sinh ra vài dòng
   chưa khớp được. Trong hệ thật đây là 8 bước ở mục 5.4 tài liệu, và
   chính đường ống này mới là chỗ hệ thống sống hay chết — không phải
   giao diện.
   ===================================================================== */
const INGEST_STEPS = [
  { k: "parse",     t: "Đọc file thô",              d: "Mỗi nguồn một parser riêng, định dạng khác hẳn nhau",
    tEn: "Read the raw file",           dEn: "One parser per feed — the formats have nothing in common" },
  { k: "normalise", t: "Chuẩn hoá về một schema",    d: "Tên cột, đơn vị, kiểu ngày, cách viết tên nền tảng",
    tEn: "Normalise to one schema",     dEn: "Column names, units, date formats, how each store spells its own name" },
  { k: "match",     t: "Khớp ISRC với danh mục",     d: "Khâu dễ thất thoát tiền nhất: dòng không khớp phải đưa vào danh sách chờ khớp, không được bỏ qua",
    tEn: "Match ISRCs to the catalogue", dEn: "Where money goes missing — an unmatched row goes to the queue, never quietly nowhere" },
  { k: "fxconv",    t: "Quy đổi tiền tệ",            d: "Theo tỷ giá đã chốt cho kỳ",
    tEn: "Convert currency",            dEn: "At the rate locked for the period" },
  { k: "write",     t: "Ghi vào bảng thô",           d: "Ghi rõ về từ nguồn nào, kỳ nào",
    tEn: "Write to the raw table",      dEn: "Stamped with which feed and which period it came from" },
  { k: "rollup",    t: "Dựng lại bảng tổng hợp",     d: "Theo bản ghi × kỳ, rồi theo nền tảng, thị trường, bên thụ hưởng",
    tEn: "Rebuild the rollups",         dEn: "By recording × period, then by store, by territory, by payee" },
  { k: "flag",      t: "Đánh dấu nguồn đã nhập",      d: "Để hệ thống biết kỳ nào còn thiếu gì",
    tEn: "Flag the feed as loaded",     dEn: "So the system knows which period is still short of what" },
  { k: "notify",    t: "Báo cho người đối soát",    d: "Kỳ chưa xét duyệt thì đối tác chưa thấy số liệu nào",
    tEn: "Tell the reconciler",         dEn: "Until the period is approved, no client sees anything" }
];
const ingest = {
  steps: INGEST_STEPS,
  load(pIdx, fId, opts) {
    const pk = PERIODS[pIdx].k;
    if (state.approved[pk]) throw new Error("Kỳ đã xét duyệt. Muốn nhập lại phải huỷ xét duyệt trước");
    const f = FEEDS.find(x => x.id === fId);
    const st = state.feeds[pk][fId];
    if (st.status === "loaded" && !(opts && opts.replace)) throw new Error("Nguồn này đã nhập cho kỳ " + PERIODS[pIdx].label);
    st.status = "loaded";
    st.at = nowISO();
    st.file = (opts && opts.file) || fileNameFor(f, PERIODS[pIdx]);
    /* nạp xong thì luôn có một ít dòng không khớp được — đó là chuyện bình thường */
    const n = 2 + ((Math.random() * 5) | 0);
    let qid = state.queue.length + 1;
    for (let j = 0; j < n; j++) {
      const seedTrack = (Math.random() * N) | 0;
      state.queue.push({
        id: "Q" + String(Date.now() % 100000 + qid++).padStart(5, "0"),
        periodKey: pk, feedId: fId,
        isrc: Math.random() < 0.4 ? "" : tIsrc[seedTrack].slice(0, -1) + "X",
        title: tTitle[seedTrack], artist: ARTISTS[tArtist[seedTrack]].name,
        store: STORES[(Math.random() * N_TOP) | 0], territory: TERR[(Math.random() * TERR.length) | 0],
        streams: Math.round(200 + Math.random() * 90000), amount: cents(2 + Math.random() * 900),
        reason: Math.random() < 0.4 ? "Thiếu mã ISRC" : "Mã ISRC không có trong danh mục",
        hint: seedTrack, status: "pending", resolvedTo: null, at: null
      });
    }
    audit.log("ingest.load", "Nhập " + f.name + " · kỳ " + PERIODS[pIdx].label + " · " + st.file + " · " + n + " dòng vào danh sách chờ khớp");
    store.save();
    return { added: n };
  },
  unloadPub(pIdx) {
    const pk = PERIODS[pIdx].k;
    if (state.approved[pk]) throw new Error("Kỳ đã xét duyệt, phải huỷ xét duyệt trước");
    state.pub[pk] = { status: "missing", at: null, file: null };
    audit.log("ingest.pub", "Gỡ báo cáo tác quyền kỳ " + PERIODS[pIdx].label);
    store.save();
  },
  unload(pIdx, fId) {
    const pk = PERIODS[pIdx].k;
    if (state.approved[pk]) throw new Error("Kỳ đã xét duyệt, phải huỷ xét duyệt trước");
    state.feeds[pk][fId] = { status: "missing", at: null, file: null, rows: 0, control: null };
    audit.log("ingest.unload", "Gỡ nguồn " + FEEDS[fId].name + " khỏi kỳ " + PERIODS[pIdx].label);
    store.save();
  },
  loadPub(pIdx, opts) {
    const pk = PERIODS[pIdx].k;
    /* Tác quyền chốt theo quý. Nạp một báo cáo quý vào tháng giữa quý là
       đặt cả quý tiền vào sai kỳ — và không ai phát hiện ra, vì con số vẫn
       "có". Chặn ở đây; muốn cố tình thì phải nói rõ ra. */
    if (PERIODS[pIdx].month % 3 !== 0 && !(opts && opts.force))
      throw new Error("Kỳ " + PERIODS[pIdx].label + " không phải kỳ cuối quý. Tác quyền chốt theo quý, nhập vào kỳ này là đặt tiền của cả quý vào sai kỳ");
    if (state.approved[pk]) throw new Error("Kỳ đã xét duyệt, phải huỷ xét duyệt trước");
    state.pub[pk] = { status: "loaded", at: nowISO(), file: (opts && opts.file) || ("cmo-" + pk + ".xlsx") };
    audit.log("ingest.pub", "Nhập báo cáo tác quyền kỳ " + PERIODS[pIdx].label);
    store.save();
  },
  acceptVariance(pIdx, fId, note) {
    const t = feedTotals(pIdx, fId);
    state.variance[PERIODS[pIdx].k + ":" + fId] = { amount: t.diff, note: note || "", at: nowISO() };
    audit.log("recon.accept", "Ghi nhận chênh lệch " + fmt.usd(t.diff) + " · " + FEEDS[fId].short + " kỳ " + PERIODS[pIdx].label + " · " + (note || "không có ghi chú"));
    store.save();
  }
};

/* hàng chờ khớp ISRC */
const queue = {
  list(filter) {
    let l = state.queue;
    if (filter && filter.periodKey) l = l.filter(q => q.periodKey === filter.periodKey);
    if (filter && filter.status) l = l.filter(q => q.status === filter.status);
    if (filter && filter.feedId != null) l = l.filter(q => q.feedId === filter.feedId);
    return l;
  },
  pendingTotal(periodKey) {
    return cents(state.queue.filter(q => q.status === "pending" && (!periodKey || q.periodKey === periodKey))
      .reduce((s, q) => s + q.amount, 0));
  },
  suggest(qid) { const q = state.queue.find(x => x.id === qid); return q ? suggestFor(q, 6) : []; },
  /* Khớp một dòng của kỳ ĐÃ DUYỆT không được sửa lại kỳ đó. Kỳ đã chốt,
     đã đối chiếu, đã chi tiền, và khách đã đọc con số ấy — sửa lại là làm
     hai người cùng nhìn một kỳ mà ra hai số khác nhau.
     Cách làm của ngành: tiền vẫn về đúng chủ, nhưng cộng vào KỲ ĐANG MỞ
     gần nhất, ghi rõ là khoản truy thu của kỳ nào. Kỳ cũ giữ nguyên. */
  resolve(qid, trackIdx, by) {
    const q = state.queue.find(x => x.id === qid);
    if (!q) throw new Error("Không tìm thấy dòng " + qid);
    if (q.status !== "pending") throw new Error("Dòng này đã được xử lý");
    if (!(trackIdx >= 0 && trackIdx < N)) throw new Error("Bản ghi không hợp lệ");
    let p = pIndexOf(q.periodKey);
    let intoKey = null;
    if (state.approved[q.periodKey]) {
      const open = PERIODS.find(x => !state.approved[x.k]);
      if (!open) throw new Error("Kỳ của dòng này đã xét duyệt và không còn kỳ nào đang mở để ghi khoản truy thu. Mở kỳ mới rồi khớp lại");
      p = open.idx; intoKey = open.k;
    }
    const key = trackIdx + ":" + p + ":" + q.feedId;
    state.match[key] = cents((state.match[key] || 0) + q.amount);
    q.status = "matched"; q.resolvedTo = trackIdx; q.at = nowISO(); q.by = by || "admin";
    q.intoPeriod = intoKey;
    rebuildMatchIndex();
    audit.log("queue.resolve", q.id + " → " + tIsrc[trackIdx] + " (" + tTitle[trackIdx] + ") · " + fmt.usd(q.amount)
      + (intoKey ? " · truy thu của kỳ " + q.periodKey + ", ghi vào kỳ " + intoKey : ""));
    store.save();
  },
  /* Kỳ nào sẽ nhận khoản truy thu nếu khớp dòng này bây giờ — để giao diện
     nói trước cho người bấm, đừng để họ ngạc nhiên sau khi đã bấm. */
  landingPeriod(qid) {
    const q = state.queue.find(x => x.id === qid);
    if (!q) return null;
    if (!state.approved[q.periodKey]) return { k: q.periodKey, label: PERIODS[pIndexOf(q.periodKey)].label, adjustment: false };
    const open = PERIODS.find(x => !state.approved[x.k]);
    return open ? { k: open.k, label: open.label, adjustment: true } : null;
  },
  park(qid, note) {
    const q = state.queue.find(x => x.id === qid);
    if (!q) return;
    q.status = "parked"; q.at = nowISO(); q.note = note || "";
    audit.log("queue.park", q.id + " · tạm hoãn, chờ đối tác xác nhận · " + (note || ""));
    store.save();
  },
  unpark(qid) {
    const q = state.queue.find(x => x.id === qid);
    if (!q) return;
    if (q.status === "matched") {
      /* Gỡ đúng ở kỳ đã ghi vào — với khoản truy thu thì đó không phải kỳ
         gốc của dòng. Gỡ nhầm kỳ là để lại tiền ma trong sổ. */
      const landed = q.intoPeriod || q.periodKey;
      if (state.approved[landed]) throw new Error("Khoản này đã ghi vào kỳ " + landed + " và kỳ đó đã xét duyệt. Huỷ xét duyệt kỳ đó trước");
      const p = pIndexOf(landed);
      const key = q.resolvedTo + ":" + p + ":" + q.feedId;
      state.match[key] = cents((state.match[key] || 0) - q.amount);
      if (state.match[key] <= 0.004) delete state.match[key];
      rebuildMatchIndex();
    }
    q.status = "pending"; q.resolvedTo = null; q.at = null; q.intoPeriod = null;
    audit.log("queue.unpark", q.id + " · trả lại danh sách chờ khớp");
    store.save();
  }
};

/* =====================================================================
   22. ĐỊNH DẠNG & TIỆN ÍCH
   ===================================================================== */
const fmt = {
  usd:  v => "$" + (v < 0 ? "-" : "") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  usd0: v => "$" + (v < 0 ? "-" : "") + Math.round(Math.abs(v)).toLocaleString("en-US"),
  vnd:  (v, rate) => Math.round(v * (rate || state.fx.rate)).toLocaleString("vi-VN") + " ₫",
  money(v, cur, rate) { return cur === "VND" ? fmt.vnd(v, rate) : fmt.usd0(v); },
  money2(v, cur, rate) { return cur === "VND" ? fmt.vnd(v, rate) : fmt.usd(v); },
  num:  v => Math.round(v).toLocaleString("vi-VN"),
  pct:  v => (v * 100).toFixed(1).replace(/\.0$/, "") + "%",
  date: s => s ? String(s).slice(0, 10).split("-").reverse().join(".") : "—",
  when: s => s ? String(s).slice(8, 10) + "." + String(s).slice(5, 7) + "." + String(s).slice(0, 4) + " " + String(s).slice(11, 16) : "—",
  bytes: n => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB"
};
/* Mọi chuỗi do người nhập hoặc do dữ liệu mang theo đều phải đi qua đây
   trước khi ghép vào HTML. Tên nghệ sĩ ở đây có &, ', :, dấu tiếng Việt. */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

if (!FRESH) { try { seedPartyManager(); seedWithdrawals(); seedTickets(); seedClaims(); seedOps(); } catch (e) { console.warn("[haustek-core] gieo dữ liệu mẫu: " + e.message); } }

/* =====================================================================
   23. MẶT TIỀN CHO ADMIN — chỉ intranet.html được chạm
   ===================================================================== */
const admin = {
  cfg: CFG,
  get distributor() { return DISTRIBUTOR || KHONG_CO_BI_MAT; },
  /* Chỉ intranet.html gọi. Gọi xong, hai giá trị này có mặt trong bộ nhớ
     của TRANG ADMIN — và chỉ trang đó. */
  provideSecrets(obj) {
    if (!obj || !obj.name) throw new Error("Thiếu tên đơn vị phân phối");
    DISTRIBUTOR = Object.assign({}, KHONG_CO_BI_MAT, obj);
    FORBIDDEN = FORBIDDEN.concat([DISTRIBUTOR.name, DISTRIBUTOR.code].filter(Boolean));
    return true;
  },
  periods: PERIODS, feeds: FEEDS, pubFeed: PUB_FEED,
  stores: STORES, storeW: STORE_W, storeFeed: STORE_FEED, storeTopCount: N_TOP,
  territories: TERR, territoryW: TERR_W, pubSources: PUBSRC, pubSourceW: PUBSRC_W,
  labels: LABELS, artists: ARTISTS,
  questions: QUESTIONS, samplesNeeded: SAMPLES_NEEDED,
  counts: { tracks: N, periods: P, artists: CFG.N_ARTISTS, labels: CFG.N_LABELS, stores: STORES.length, territories: TERR.length },

  state: () => state,
  pIndexOf, partyName, partyClientId, partyKeyOfTrack,
  track(i) {
    return { i, title: tTitle[i], isrc: tIsrc[i], isrcAlt: tIsrcAlt[i], upc: tUpc[i],
             type: TYPES[tType[i]], artistId: tArtist[i], artist: ARTISTS[tArtist[i]].name,
             labelId: tLabel[i], label: tLabel[i] >= 0 ? LABELS[tLabel[i]].name : null,
             producerPts: tProd[i], releasePeriod: PERIODS[tRel[i]].label,
             writer1: ARTISTS[tW1[i]].name, writer1Id: tW1[i], writer1Share: tW1s[i],
             writer2: tW2[i] >= 0 ? ARTISTS[tW2[i]].name : null, writer2Id: tW2[i],
             partyKey: partyKeyOfTrack(i) };
  },
  trackCount: N,
  titleOf: i => tTitle[i], isrcOf: i => tIsrc[i], typeOf: i => TYPES[tType[i]],
  artistOf: i => ARTISTS[tArtist[i]], labelOf: i => (tLabel[i] >= 0 ? LABELS[tLabel[i]] : null),
  streamsOf: (i, p) => recStreams[i * P + p],
  grossRec, grossPub, grossRecByFeed, grossOf, splitRec, splitDim, mineOf, agg, scopeOf,
  /* nền tảng, quy trình phát hành, cây label */
  platformNames: PLAT_NAMES, platformNamesEn: PLAT_NAMES_EN, platformSpm: PLAT_SPM,
  splitStores, splitStreams, trackMatrix,
  platformReport: pList => platformReport("admin", 0, pList || PERIODS.map(p => p.idx)),
  asset: i => assetOf(i, "admin", 0), assetSummary, deliveryOf, releaseDateOf, deliveryNames: DELIV_NAMES, othersCount: OTHERS_N,
  catalogue: opts => catalogueOf("admin", 0, opts),
  labelChildren, labelTree: (labelId, pIdx) => labelTreeOf(labelId, pIdx), labelSlice,
  idxOf, byArtist, byLabel, byWriter,
  feedLoaded, loadedFeedIds, missingFeeds, pubLoaded,
  recon, feedTotals, approvalChecks, canApprove, approve, revoke,
  /* Xem trước bảng chi trả mà KHÔNG đụng vào sổ. Màn hình nào cũng chỉ
     được dùng cái này; bản ghi thật chỉ chạy đúng một lần, lúc duyệt kỳ. */
  previewPayout: pIdx => runPayout(pIdx, false),
  earnedByParty, advanceBalance,
  isApproved: pk => !!state.approved[pk],
  approvalOf: pk => state.approved[pk] || null,
  payoutOf: pk => state.payouts[pk] || null,
  rates, fx, ingest, queue, audit,
  advances: {
    list() {
      return Object.keys(state.advances).map(k => ({
        partyKey: k, name: partyName(k), clientId: partyClientId(k),
        kind: k[0] === "L" ? "label" : "artist",
        opening: state.advances[k].opening, note: state.advances[k].note,
        recouped: cents(Object.values(state.advances[k].byPeriod || {}).reduce((s, v) => s + v, 0)),
        balance: advanceBalance(k)
      })).sort((a, b) => b.balance - a.balance);
    },
    set(partyKey, opening, note) {
      if (!(opening >= 0)) throw new Error("Số tiền tạm ứng không hợp lệ");
      state.advances[partyKey] = state.advances[partyKey] || { byPeriod: {} };
      state.advances[partyKey].opening = opening;
      state.advances[partyKey].note = note || state.advances[partyKey].note || "";
      audit.log("advance.set", partyName(partyKey) + " · " + fmt.usd0(opening));
      store.save();
    },
    remove(partyKey) { delete state.advances[partyKey]; audit.log("advance.remove", partyName(partyKey)); store.save(); },
    total() { return cents(Object.keys(state.advances).reduce((s, k) => s + advanceBalance(k), 0)); }
  },
  accounts: {
    list() { return state.accounts.slice(); },
    add(email, role, partyKey) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Email không hợp lệ");
      if (state.accounts.some(a => a.email.toLowerCase() === email.toLowerCase())) throw new Error("Email này đã có tài khoản");
      if (role !== "admin" && !partyKey) throw new Error("Tài khoản label hoặc nghệ sĩ phải gắn với một mã bên thụ hưởng");
      state.accounts.push({ id: "U" + String(state.accounts.length + 1).padStart(4, "0"),
        email, role, partyKey: role === "admin" ? null : partyKey, status: "invited",
        createdAt: nowISO().slice(0, 10), lastSeen: null, mfa: role === "admin" });
      audit.log("account.add", email + " · " + role + (partyKey ? " · " + partyKey + " (" + partyName(partyKey) + ")" : ""));
      store.save();
    },
    setStatus(id, status) {
      const a = state.accounts.find(x => x.id === id); if (!a) return;
      a.status = status; audit.log("account.status", a.email + " → " + status); store.save();
    },
    remove(id) {
      const a = state.accounts.find(x => x.id === id); if (!a) return;
      state.accounts = state.accounts.filter(x => x.id !== id);
      audit.log("account.remove", a.email); store.save();
    }
  },
  releases: {
    list(filter) {
      let ds = state.releases.slice();
      if (filter && filter.status) ds = ds.filter(r => r.status === filter.status);
      return ds;
    },
    get(id) { return state.releases.find(r => r.id === id) || null; },
    counts() {
      const c = { submitted: 0, received: 0, coded: 0, released: 0, returned: 0 };
      state.releases.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
      return c;
    },
    receive(id, by, note) {
      const r = this.get(id); if (!r) throw new Error("Không tìm thấy hồ sơ " + id);
      if (r.status !== "submitted") throw new Error("Hồ sơ này không ở trạng thái đã gửi");
      releaseStamp(r, "received", by || "ops@haustek-group.com", note);
      audit.log("release.receive", r.id + " · " + r.title + " · " + r.artistName, by); store.save(); return r;
    },
    assignCodes(id, by) {
      const r = this.get(id); if (!r) throw new Error("Không tìm thấy hồ sơ " + id);
      if (r.status !== "received") throw new Error("Phải tiếp nhận hồ sơ trước khi cấp mã");
      let n = 0, seed = state.releases.indexOf(r) * 10 + 1;
      r.tracks.forEach((t, i) => { if (!t.isrc) { t.isrc = genIsrc(seed + i + (Date.now() % 977)); n++; } });
      if (!r.upc) r.upc = genUpc(seed + (Date.now() % 4441));
      releaseStamp(r, "coded", by || "ops@haustek-group.com", n + " ISRC mới");
      audit.log("release.code", r.id + " · " + r.title + " · " + n + " ISRC mới · UPC " + r.upc, by); store.save(); return r;
    },
    publish(id, by, date) {
      const r = this.get(id); if (!r) throw new Error("Không tìm thấy hồ sơ " + id);
      if (r.status !== "coded") throw new Error("Phải cấp mã trước khi đánh dấu đã phát hành");
      r.releasedAt = date || r.releaseDate;
      releaseStamp(r, "released", by || "ops@haustek-group.com", null);
      audit.log("release.publish", r.id + " · " + r.title + " · " + r.releasedAt, by); store.save(); return r;
    },
    returnFix(id, by, note) {
      const r = this.get(id); if (!r) throw new Error("Không tìm thấy hồ sơ " + id);
      if (!note) throw new Error("Phải ghi rõ nội dung cần bổ sung");
      if (r.status === "released") throw new Error("Hồ sơ đã phát hành, không trả lại được");
      releaseStamp(r, "returned", by || "ops@haustek-group.com", note);
      audit.log("release.return", r.id + " · " + r.title + " · " + note.slice(0, 80), by); store.save(); return r;
    }
  },
  /* ---- nhân viên, đối tác, kinh doanh ---- */
  staff: {
    list() { return STAFF.slice(); },
    get: staffById, byRole: staffByRole,
    get me() { return _me; },
    setMe(id) { const s = staffById(id); if (s) _me = s; return _me; },
    targets: STAFF_TARGET
  },
  parties: { list: partiesList, managerOf: pk => staffById(state.partyManager[pk]) || null,
    setManager(pk, staffId, by) { if (!staffById(staffId)) throw new Error("Không có nhân viên " + staffId); state.partyManager[pk] = staffId; audit.log("party.manager", partyName(pk) + " → " + staffById(staffId).name, by); store.save(); },
    signedAt: signedAtOf, contractEnd: contractEndOf },
  sales: { kpi: salesKpi },
  wallet: walletOf, credits: creditsOf, statementsOf,
  withdrawals: {
    list(f) {
      let ds = state.withdrawals.slice();
      if (f && f.status) ds = ds.filter(w => w.status === f.status);
      if (f && f.q) { const q = f.q.toLowerCase(); ds = ds.filter(w => w.id.toLowerCase().includes(q) || w.party.name.toLowerCase().includes(q) || w.party.clientId.toLowerCase().includes(q)); }
      return ds;
    },
    get(id) { return state.withdrawals.find(w => w.id === id) || null; },
    counts() { const c = { requested: 0, processing: 0, paid: 0, rejected: 0, cancelled: 0, pendingAmount: 0 }; state.withdrawals.forEach(w => { c[w.status] = (c[w.status] || 0) + 1; if (w.status === "requested" || w.status === "processing") c.pendingAmount = cents(c.pendingAmount + w.amount); }); return c; },
    process(id, by) { const w = this.get(id); if (!w) throw new Error("Không tìm thấy " + id); if (w.status !== "requested") throw new Error("Yêu cầu không ở trạng thái chờ xử lý"); w.status = "processing"; w.updatedAt = nowISO(); w.history.push({ at: w.updatedAt, status: "processing", by }); audit.log("withdraw.process", w.id + " · " + w.party.name, by); store.save(); return w; },
    pay(id, by, ref) { const w = this.get(id); if (!w) throw new Error("Không tìm thấy " + id); if (w.status !== "requested" && w.status !== "processing") throw new Error("Yêu cầu không ở trạng thái xử lý được"); if (!ref) throw new Error("Cần số tham chiếu lệnh chuyển khoản"); w.status = "paid"; w.ref = ref; w.paidAt = nowISO(); w.updatedAt = w.paidAt; w.history.push({ at: w.paidAt, status: "paid", by, ref }); audit.log("withdraw.pay", w.id + " · " + w.party.name + " · " + fmt.usd(w.amount) + " · " + ref, by); store.save(); return w; },
    reject(id, by, why) { const w = this.get(id); if (!w) throw new Error("Không tìm thấy " + id); if (w.status === "paid") throw new Error("Đã thanh toán, không từ chối được"); if (!why) throw new Error("Cần ghi lý do từ chối"); w.status = "rejected"; w.why = why; w.updatedAt = nowISO(); w.history.push({ at: w.updatedAt, status: "rejected", by, note: why }); audit.log("withdraw.reject", w.id + " · " + w.party.name + " · " + why, by); store.save(); return w; },
    /* kế toán tạo hộ (đối tác gọi điện, gửi email) */
    create(partyKey, amount, by, note) { return requestWithdrawal(partyKey, amount, note, by); }
  },
  statements: {
    list(pk) {
      const rows = (state.payouts[pk] || []).filter(r => !r.held).map(r => ({ partyKey: r.partyKey, name: partyName(r.partyKey), clientId: partyClientId(r.partyKey), kind: r.kind, earned: r.earned, credit: cents(r.earned - r.recoup), pdf: (state.statements[pk] || {})[r.partyKey] || null }));
      return { rows, attached: rows.filter(r => r.pdf).length, total: rows.length };
    },
    attach(pk, partyKey, file, by) {
      if (!state.approved[pk]) throw new Error("Kỳ chưa xét duyệt, chưa lập được bảng kê");
      if (!file) throw new Error("Thiếu tên file PDF");
      state.statements[pk] = state.statements[pk] || {};
      state.statements[pk][partyKey] = { file: String(file), at: nowISO(), by: by || "ketoan@haustek-group.com", size: 120000 + ((hash(pk.length + partyKey.length, 120) * 300000) | 0) };
      audit.log("statement.attach", PERIODS[pIndexOf(pk)].label + " · " + partyName(partyKey) + " · " + file, by); store.save();
      return state.statements[pk][partyKey];
    },
    attachAll(pk, by) {
      let n = 0;
      (state.payouts[pk] || []).forEach(r => { if (r.held) return; state.statements[pk] = state.statements[pk] || {}; if (!state.statements[pk][r.partyKey]) { state.statements[pk][r.partyKey] = { file: "bang-ke-" + pk + "-" + partyClientId(r.partyKey) + ".pdf", at: nowISO(), by: by || "ketoan@haustek-group.com", size: 140000 + ((hash(n, 121) * 200000) | 0) }; n++; } });
      audit.log("statement.attachAll", PERIODS[pIndexOf(pk)].label + " · " + n + " bảng kê", by); store.save();
      return n;
    },
    remove(pk, partyKey, by) { if (state.statements[pk]) delete state.statements[pk][partyKey]; audit.log("statement.remove", pk + " · " + partyName(partyKey), by); store.save(); }
  },
  bank: { get: pk => state.bank[pk] || null, all: () => Object.assign({}, state.bank) },
  forecast: () => forecastOf("admin", 0),
  forecastFor: (role, id) => forecastOf(role, id),
  platformRates, dailyStreams, asOf: () => isoDate(ASOF),
  dailyTrends: (days, top) => dailyTrends("admin", 0, days, top),
  dailyTrendsFor: (role, id, days) => dailyTrends(role, id, days),
  playlists: () => playlistReport("admin", 0),
  playlistsFor: (role, id) => playlistReport(role, id),
  playlistsOf,
  catalogueReleases: limit => catalogueReleases("admin", 0, limit),
  catalogueFor: (role, id, opts) => catalogueOf(role, id, opts),
  /* 19i */
  splits: () => splitsReport("admin", 0), splitsFor: (role, id) => splitsReport(role, id), splitsOf: i => splitsOf(i),
  setSplit: (trackId, c, by) => setSplit("admin", 0, trackId, c, by), removeSplit: (trackId, email, by) => removeSplit("admin", 0, trackId, email, by), acceptSplit,
  quality: () => qualityReport("admin", 0), qualityFor: (role, id) => qualityReport(role, id), qualityOf,
  setAlertStatus: (trackId, status, note, by) => setAlertStatus(trackId, status, note, by, "admin"),
  monetizationOf, metadataHealth: i => metadataHealth(i), metadataReport: () => metadataReport("admin", 0), metadataReportFor: (role, id) => metadataReport(role, id),
  explain: pk => explainPeriod("admin", 0, pk), explainFor: (role, id, pk) => explainPeriod(role, id, pk),
  withdrawalQuote, notifications: () => notificationsOf("admin", 0), markNotifications: ids => markNotifications("admin", 0, ids),
  search: (q, limit) => searchAll("admin", 0, q, limit), campaigns: () => campaignsOf("admin", 0), campaignsFor: (role, id) => campaignsOf(role, id),
  penaltyPerTrackUsd: PENALTY_USD,
  tickets: {
    types: TICKET_TYPES, statuses: TICKET_STATUS,
    list(f) {
      let ds = state.tickets.slice();
      if (f && f.status) ds = ds.filter(t => f.status === "open-all" ? t.status !== "done" : t.status === f.status);
      if (f && f.type) ds = ds.filter(t => t.type === f.type);
      if (f && f.assignee) ds = ds.filter(t => t.assignee === f.assignee);
      if (f && f.priority) ds = ds.filter(t => t.priority === f.priority);
      if (f && f.q) { const q = f.q.toLowerCase(); ds = ds.filter(t => t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.party.name.toLowerCase().includes(q) || t.party.clientId.toLowerCase().includes(q)); }
      return ds;
    },
    get(id) { return state.tickets.find(t => t.id === id) || null; },
    counts(assignee) {
      const ds = assignee ? state.tickets.filter(t => t.assignee === assignee) : state.tickets;
      const now = nowISO();
      return { open: ds.filter(t => t.status === "open").length, in_progress: ds.filter(t => t.status === "in_progress").length, waiting: ds.filter(t => t.status === "waiting").length,
        done: ds.filter(t => t.status === "done").length, overdue: ds.filter(t => t.status !== "done" && t.dueAt < now).length, urgent: ds.filter(t => t.status !== "done" && t.priority === "urgent").length, total: ds.length };
    },
    create(o, by) { const t = createTicket(Object.assign({}, o, { createdBy: by, who: "staff", source: "staff" })); audit.log("ticket.create", t.id + " · " + t.party.name + " · " + t.title, by); store.save(); return t; },
    assign(id, staffId, by) { const t = this.get(id); if (!t) throw new Error("Không tìm thấy " + id); if (!staffById(staffId)) throw new Error("Không có nhân viên " + staffId); t.assignee = staffId; t.updatedAt = nowISO(); if (t.status === "open") t.status = "in_progress"; audit.log("ticket.assign", t.id + " → " + staffById(staffId).name, by); store.save(); return t; },
    setStatus(id, status, by) { const t = this.get(id); if (!t) throw new Error("Không tìm thấy " + id); if (TICKET_STATUS.indexOf(status) < 0) throw new Error("Trạng thái không hợp lệ"); t.status = status; t.updatedAt = nowISO(); if (status === "done") t.closedAt = t.updatedAt; audit.log("ticket.status", t.id + " → " + status, by); store.save(); return t; },
    setPriority(id, priority, by) { const t = this.get(id); if (!t) throw new Error("Không tìm thấy " + id); t.priority = priority; t.dueAt = slaDue(t.createdAt, priority); t.updatedAt = nowISO(); audit.log("ticket.priority", t.id + " → " + priority, by); store.save(); return t; },
    reply(id, text, by) { const t = this.get(id); if (!t) throw new Error("Không tìm thấy " + id); if (!String(text || "").trim()) throw new Error("Nội dung trống"); t.messages.push({ at: nowISO(), by, who: "staff", text: String(text).trim() }); t.updatedAt = nowISO(); if (t.status === "open") t.status = "in_progress"; store.save(); return t; }
  },
  claims: {
    categories: CLAIM_CAT, statuses: CLAIM_STATUS,
    list(f) {
      let ds = state.claims.slice();
      if (f && f.status) ds = ds.filter(c => f.status === "open-all" ? (c.status !== "resolved" && c.status !== "released") : c.status === f.status);
      if (f && f.store) ds = ds.filter(c => c.store === f.store);
      if (f && f.category) ds = ds.filter(c => c.category === f.category);
      if (f && f.assignee) ds = ds.filter(c => c.assignee === f.assignee);
      if (f && f.country) ds = ds.filter(c => c.country === f.country);
      if (f && f.q) { const q = f.q.toLowerCase(); ds = ds.filter(c => [c.id, c.track.title, c.track.isrc, c.track.upc, c.assetId, c.party.name, c.party.clientId, c.otherParty || ""].some(x => String(x).toLowerCase().includes(q))); }
      return ds;
    },
    get(id) { return state.claims.find(c => c.id === id) || null; },
    counts(assignee) { const ds = assignee ? state.claims.filter(c => c.assignee === assignee) : state.claims; const c = { total: ds.length, views: 0 }; CLAIM_STATUS.forEach(s => { c[s] = ds.filter(x => x.status === s).length; }); ds.forEach(x => { if (x.status !== "resolved" && x.status !== "released") c.views += x.dailyViews; }); return c; },
    setStatus(id, status, by, note) { const c = this.get(id); if (!c) throw new Error("Không tìm thấy " + id); if (CLAIM_STATUS.indexOf(status) < 0) throw new Error("Trạng thái không hợp lệ"); c.status = status; c.updatedAt = nowISO(); if (status === "disputed" || status === "escalated") c.expiresAt = addDays(c.updatedAt.slice(0, 10), 30); c.notes.push({ at: c.updatedAt, by, text: note || ("→ " + status) }); audit.log("claim.status", c.id + " → " + status, by); store.save(); return c; },
    assign(id, staffId, by) { const c = this.get(id); if (!c) throw new Error("Không tìm thấy " + id); c.assignee = staffId; c.updatedAt = nowISO(); audit.log("claim.assign", c.id + " → " + (staffById(staffId) || {}).name, by); store.save(); return c; }
  },
  videoSettings: {
    get: pk => state.videoSettings[pk] || null,
    set(pk, o, by) { state.videoSettings[pk] = Object.assign({}, state.videoSettings[pk] || {}, o, { updatedAt: nowISO() }); audit.log("video.settings", partyName(pk) + " · " + JSON.stringify(o).slice(0, 80), by); store.save(); return state.videoSettings[pk]; }
  },
  deliveries: {
    subjects: DELIVERY_SUBJECTS,
    list() { return state.deliveries.slice(); },
    create(o, by) { const d = createDelivery(o, by); audit.log("delivery.create", d.id + " · " + d.name + " · " + d.platforms.join(", "), by); store.save(); return d; },
    setStatus(id, status, by) { const d = state.deliveries.find(x => x.id === id); if (!d) throw new Error("Không tìm thấy " + id); d.status = status; d.updatedAt = nowISO(); if (status === "done") d.progress.sent = d.progress.total; audit.log("delivery.status", d.id + " → " + status, by); store.save(); return d; }
  },
  bulk: {
    actions: BULK_ACTIONS,
    list() { return state.bulk.slice(); },
    create(o, by) { const r = createBulk(o, by); audit.log("bulk.create", r.id + " · " + r.action + " · " + r.count + " UPC", by); store.save(); return r; },
    setStatus(id, status, by) { const r = state.bulk.find(x => x.id === id); if (!r) throw new Error("Không tìm thấy " + id); r.status = status; r.updatedAt = nowISO(); audit.log("bulk.status", r.id + " → " + status, by); store.save(); return r; }
  },
  answers: {
    get(id) { return state.answers[id] || ""; },
    set(id, text) { state.answers[id] = text; audit.log("answer.set", id + " · " + (text ? text.slice(0, 60) : "(xoá)")); store.save(); },
    all() { return Object.assign({}, state.answers); }
  },
  store,
  reset() { store.clear(); location.reload(); }
};

/* =====================================================================
   24. API CHO KHÁCH — thứ DUY NHẤT dashboard được gọi
   ---------------------------------------------------------------------
   Ba luật của tầng này:
     1. Chỉ trả về kỳ ĐÃ DUYỆT. Kỳ chưa đối chiếu xong thì khách không
        thấy con số nào, kể cả số đúng.
     2. Chỉ trả về dòng thuộc phạm vi của người gọi, và kiểm tra lại
        phạm vi ở mọi lời gọi — kể cả khi giao diện đã lọc rồi.
     3. Mọi phép tính xong ở đây. Trình duyệt khách nhận số, không nhận
        công thức, không nhận tỷ lệ gốc, không nhận tên đơn vị phân phối.
   ===================================================================== */
function scrub(payload) {
  const s = JSON.stringify(payload);
  for (const bad of FORBIDDEN) {
    if (s.toLowerCase().includes(String(bad).toLowerCase())) {
      throw new Error("Chặn ở tầng API: payload chứa thông tin nội bộ (" + bad + ")");
    }
  }
  payload._bytes = s.length;
  return payload;
}
function partyClientIdOf(role, partyId) { return role === "label" ? LABELS[partyId].clientId : role === "artist" ? ARTISTS[partyId].clientId : "admin"; }
function assertParty(role, partyId) {
  if (role === "label") { if (!(partyId >= 0 && partyId < CFG.N_LABELS)) throw new Error("Không có quyền"); }
  else if (role === "artist") { if (!(partyId >= 0 && partyId < CFG.N_ARTISTS)) throw new Error("Không có quyền"); }
  else throw new Error("Vai trò không hợp lệ ở cổng đối tác");
}
function inScope(role, partyId, stream, i) {
  const sc = scopeOf(role, partyId, stream);
  if (!sc) return false;
  for (let k = 0; k < sc.length; k++) if (sc[k] === i) return true;
  return false;
}
function approvedPeriods() { return PERIODS.filter(p => !!state.approved[p.k]); }
function requireApproved(periodKey) {
  const pi = pIndexOf(periodKey);
  if (pi < 0 || !state.approved[periodKey]) throw new Error("Kỳ này chưa chốt sổ");
  return pi;
}

const api = {
  /* đọc lại quyết định mới nhất của admin (khi intranet vừa duyệt xong) */
  refresh() { const s = store.load(); if (s) { state = ensureShape(s); invalidateRates(); rebuildMatchIndex(); } return !!s; },

  /* Bản mẫu: liệt kê những tài khoản đã được cấp, để mô phỏng bước đăng
     nhập. Hệ thật KHÔNG có hàm này — trang đăng nhập không bao giờ nói cho
     ai biết những ai đang có tài khoản. */
  demoLogins() {
    return scrub({ accounts: state.accounts
      .filter(a => a.role !== "admin" && a.partyKey && a.status !== "suspended")
      .map(a => {
        const id = +a.partyKey.slice(2), isL = a.partyKey[0] === "L";
        const who = isL ? LABELS[id] : ARTISTS[id];
        if (!who) return null;
        return { email: a.email, role: a.role, partyId: id, name: who.name,
                 clientId: who.clientId, status: a.status,
                 kind: isL ? (who.parentId >= 0 ? "sublabel" : "label") : (who.labelId >= 0 ? "artist-label" : "artist-indie") };
      }).filter(Boolean) });
  },

  session(role, partyId) {
    assertParty(role, partyId);
    const isLabel = role === "label";
    const me = isLabel ? LABELS[partyId] : ARTISTS[partyId];
    const recCount = isLabel ? idxOf(byLabel, partyId).length : idxOf(byArtist, partyId).length;
    const pubCount = isLabel ? 0 : idxOf(byWriter, partyId).length;
    return scrub({
      role, partyId, clientId: me.clientId, name: me.name,
      belongsTo: isLabel ? null : (me.labelId >= 0 ? LABELS[me.labelId].name : "Độc lập"),
      belongsToEn: isLabel ? null : (me.labelId >= 0 ? LABELS[me.labelId].name : "Independent"),
      independent: isLabel ? false : me.labelId < 0,
      /* cây label: label con biết label mẹ; label mẹ biết mình có bao nhiêu label con */
      parentLabel: (isLabel && me.parentId >= 0) ? { labelId: me.parentId, name: LABELS[me.parentId].name, clientId: LABELS[me.parentId].clientId } : null,
      childLabels: isLabel ? labelChildren(partyId).length : 0,
      hasRecording: recCount > 0,
      openTickets: state.tickets.filter(t => t.partyKey === (isLabel ? "L:" : "A:") + partyId && t.status !== "done").length,
      /* Tác quyền thuộc người sáng tác, không đi qua label — mục 2.3 */
      hasPublishing: !isLabel && pubCount > 0,
      trackCount: recCount, compositionCount: pubCount,
      currency: "USD", fxNote: "Số liệu tính bằng USD · tỷ giá quy đổi được chốt lúc xét duyệt kỳ",
      fxNoteEn: "Figures are in USD · the conversion rate is locked when the period is approved"
    });
  },

  periods(role, partyId) {
    assertParty(role, partyId);
    const open = approvedPeriods().map(p => ({
      k: p.k, label: p.label, approvedAt: state.approved[p.k].at
    }));
    const waiting = PERIODS.filter(p => !state.approved[p.k]).map(p => ({ k: p.k, label: p.label }));
    /* Tác quyền về theo quý và về trễ, nên rất nhiều kỳ đơn giản là không
       có báo cáo nào — khách phải biết điều đó, không thì họ tưởng mất tiền. */
    const pubOpen = PERIODS.filter(p => state.approved[p.k] && pubLoaded(p.idx)).map(p => ({ k: p.k, label: p.label }));
    return scrub({ open, waiting, pubOpen, latest: open.length ? open[open.length - 1].k : null });
  },

  summary(role, partyId, periodKey, stream) {
    assertParty(role, partyId);
    const p = requireApproved(periodKey);
    stream = stream === "pub" ? "pub" : "rec";
    chanTacQuyenChoLabel(role, stream);
    const a = agg(role, partyId, p, stream);
    const prevIdx = approvedPeriods().map(x => x.idx).filter(x => x < p).pop();
    const prev = prevIdx != null ? agg(role, partyId, prevIdx, stream) : null;
    const partyKey = role === "label" ? "L:" + partyId : "A:" + partyId;
    const advOpening = state.advances[partyKey] ? state.advances[partyKey].opening : 0;
    const advLeft = advanceBalance(partyKey);
    const payoutRow = (state.payouts[periodKey] || []).find(r => r.partyKey === partyKey) || null;

    /* Chuỗi tiền của đối tác: bắt đầu từ DOANH THU (số sau phí, tức số của
       họ), không bắt đầu từ doanh thu gộp. Phí dịch vụ và các khoản Haustek
       giữ nằm trong bảng kê PDF gửi riêng, không nằm ở đây. */
    const chain = [];
    const rev = revenueAgg(a, role);
    if (stream === "rec") {
      if (role === "label") {
        chain.push({ key: "revenue", label: "Doanh thu của nghệ sĩ trong label", labelEn: "Revenue, artists on your label",
                     value: rev, note: "tổng phần của nghệ sĩ và của label trong kỳ", noteEn: "artists’ and label’s parts combined", kind: "top" });
        chain.push({ key: "artist", label: "Thanh toán cho nghệ sĩ", labelEn: "Paid to your artists",
                     value: -cents(a.artist + a.producer),
                     note: "theo tỷ lệ bạn đã đặt, áp dụng mức có hiệu lực trong kỳ",
                     noteEn: "at the rate you set, as it stood during the period", kind: "out" });
        chain.push({ key: "final", label: "Phần label được hưởng", labelEn: "Your label keeps",
                     value: a.labelCut, note: "phần của bạn trong kỳ này", noteEn: "your share this period", kind: "final" });
      } else {
        if (advLeft > 0 || (payoutRow && payoutRow.recoup > 0)) {
          chain.push({ key: "revenue", label: "Thu nhập từ bài hát của bạn", labelEn: "Income from your tracks",
                       value: a.artist, note: "số của kỳ này, trước khấu trừ tạm ứng", noteEn: "this period, before your advance", kind: "top" });
          const recAll = payoutRow ? payoutRow.recoup : Math.min(advLeft, a.artist);
          const earnedAll = payoutRow ? payoutRow.earned : a.artist;
          const phan = earnedAll > 0 ? Math.min(a.artist / earnedAll, 1) : 1;
          const rec = Math.min(cents(recAll * phan), a.artist);
          const conNo = payoutRow ? payoutRow.advanceLeft : Math.max(advLeft - recAll, 0);
          chain.push({ key: "recoup", label: "Khấu trừ tạm ứng", labelEn: "Offset against your advance", value: -rec,
                       note: "số đã tạm ứng " + fmt.usd0(advOpening) + " · còn phải khấu trừ " + fmt.usd0(conNo),
                       noteEn: fmt.usd0(advOpening) + " advanced · " + fmt.usd0(conNo) + " still to recover", kind: "out" });
          chain.push({ key: "final", label: "Thu nhập kỳ này", labelEn: "Yours this period", value: cents(a.artist - rec),
                       note: conNo <= 0 ? "đã khấu trừ hết khoản tạm ứng" : "đang khấu trừ dần khoản tạm ứng",
                       noteEn: conNo <= 0 ? "your advance is now fully recovered" : "still being offset against your advance", kind: "final" });
        } else {
          chain.push({ key: "final", label: "Thu nhập của bạn", labelEn: "Yours", value: a.artist,
                       note: "số tiền của kỳ này", noteEn: "the amount for this period", kind: "final" });
        }
      }
    } else {
      chain.push({ key: "final", label: "Thu nhập tác quyền của bạn", labelEn: "Your publishing income", value: a.total,
                   note: "theo phần sáng tác đã đăng ký", noteEn: "per your registered writer share", kind: "final" });
    }

    /* Kỳ trống vì hai lý do rất khác nhau: chưa có báo cáo về (tác quyền
       theo quý), hay có báo cáo mà bài của người này không phát sinh gì.
       Nói nhầm lý do là làm người ta hoang mang vô cớ. */
    let emptyReason = null, emptyReasonEn = null, nextPub = null;
    if (rev <= 0) {
      if (stream === "pub") {
        if (!pubLoaded(p)) {
          emptyReason = "Tác quyền về theo quý, không phải hằng tháng. Kỳ này chưa có tổ chức quản lý tác quyền nào gửi báo cáo.";
          emptyReasonEn = "Publishing settles quarterly, not monthly — no society has reported for this period.";
          const withPub = PERIODS.filter(x => state.approved[x.k] && pubLoaded(x.idx));
          const before = withPub.filter(x => x.idx < p).pop() || withPub[withPub.length - 1];
          nextPub = before ? { k: before.k, label: before.label } : null;
        } else {
          emptyReason = "Kỳ này có báo cáo tác quyền, nhưng chưa có bài hát nào của bạn phát sinh tiền tác quyền.";
          emptyReasonEn = "There is a publishing report for this period, but none of your works earned.";
        }
      } else {
        emptyReason = "Kỳ này chưa có bài hát nào của bạn phát sinh doanh thu.";
        emptyReasonEn = "None of your tracks earned anything this period.";
      }
    }
    /* Tỷ giá của kỳ KHÔNG phải bí mật — đó là tỷ giá dùng để trả tiền cho
       chính người đang xem, họ có quyền biết. Gửi kèm cả ngày khoá: đọc
       lại báo cáo cũ sau nửa năm vẫn phải ra đúng con số đã chuyển đi. */
    const lockedFx = state.fx.locked[periodKey] || null;
    return scrub({
      periodKey, stream, emptyReason, emptyReasonEn, nextPub,
      fx: { rate: lockedFx ? lockedFx.rate : state.fx.rate,
            at: lockedFx ? lockedFx.at : null,
            locked: !!lockedFx },
      total: a.total, revenue: rev, streams: a.streams, tracks: a.tracks,
      paidToArtists: role === "label" ? cents(a.artist + a.producer) : null,
      prevTotal: prev ? prev.total : null, prevStreams: prev ? prev.streams : null,
      prevRevenue: prev ? revenueAgg(prev, role) : null,
      prevLabel: prevIdx != null ? PERIODS[prevIdx].label : null,
      chain,
      advance: advOpening > 0 ? {
        opening: advOpening, left: payoutRow ? payoutRow.advanceLeft : advLeft,
        recoupedThisPeriod: payoutRow ? payoutRow.recoup : 0,
        periodsLeft: (() => {
          const left = payoutRow ? payoutRow.advanceLeft : advLeft;
          const rate = payoutRow ? payoutRow.recoup : Math.min(advLeft, a.artist);
          return left <= 0 ? 0 : Math.max(1, Math.ceil(left / Math.max(rate, 1)));
        })()
      } : null,
      /* Khối này ở cấp BÊN NHẬN: một lần chi trả cho cả hai dòng tiền cộng
         lại, không phải riêng dòng đang xem. Nói rõ ra, đừng để người đọc
         cộng nhầm nó vào chuỗi phía trên. */
      payout: payoutRow ? { payable: payoutRow.payable, carryOut: payoutRow.carryOut,
        earnedAllStreams: payoutRow.earned, carryIn: payoutRow.carryIn,
        coversBothStreams: payoutRow.earned > a.artist + 0.005,
        threshold: CFG.PAYOUT_MIN,
        note: payoutRow.payable > 0 ? "sẽ thanh toán trong đợt thanh toán tới"
          : (payoutRow.carryOut > 0 ? "dưới ngưỡng thanh toán tối thiểu " + fmt.usd0(CFG.PAYOUT_MIN) + ", chuyển sang kỳ sau" : ""),
        noteEn: payoutRow.payable > 0 ? "will be transferred in the next payout run"
          : (payoutRow.carryOut > 0 ? "below the " + fmt.usd0(CFG.PAYOUT_MIN) + " threshold — carried to the next period" : "") } : null,
      approvedAt: state.approved[periodKey].at
    });
  },

  /* Hợp đồng & tỷ lệ của chính người đang xem. Tỷ lệ là tỷ lệ áp cho họ,
     lấy từ bảng có kỳ hiệu lực: nghệ sĩ thuộc label lấy dòng của label;
     nghệ sĩ độc lập và label lấy dòng của chính mình. */
  contract(role, partyId, periodKey) {
    assertParty(role, partyId);
    const pi = pIndexOf(periodKey);
    const pk = pi >= 0 ? periodKey : PERIODS[P - 1].k;
    const isLabel = role === "label";
    const me = isLabel ? LABELS[partyId] : ARTISTS[partyId];
    const rateKey = isLabel ? me.key : (me.labelId >= 0 ? LABELS[me.labelId].key : me.key);
    const sched = rates.scheduleFor(rateKey).slice().sort((a, b) => pIndexOf(a.from) - pIndexOf(b.from));
    const cur = rates.rateFor(rateKey, pk);
    const row = sched.filter(r => pIndexOf(r.from) <= pIndexOf(pk)).pop() || null;
    let producerTracks = 0;
    if (!isLabel) idxOf(byArtist, partyId).forEach(i => { if (tProd[i] > 0) producerTracks++; });
    const partyKey = isLabel ? "L:" + partyId : "A:" + partyId;
    return scrub({
      kind: isLabel ? "label" : (me.labelId >= 0 ? "artist-label" : "artist-indie"),
      party: { name: me.name, clientId: me.clientId },
      label: (!isLabel && me.labelId >= 0) ? { name: LABELS[me.labelId].name, clientId: LABELS[me.labelId].clientId } : null,
      parentLabel: (isLabel && me.parentId >= 0) ? { name: LABELS[me.parentId].name, clientId: LABELS[me.parentId].clientId } : null,
      childLabels: isLabel ? labelChildren(partyId).length : 0,
      /* Tỷ lệ chia giữa label và nghệ sĩ là thoả thuận của HAI BÊN ĐÓ, nên
         label và nghệ sĩ thuộc label đều thấy. Nghệ sĩ độc lập không có tỷ lệ
         nào ở đây: mọi khoản Haustek giữ nằm trong bảng kê PDF gửi riêng. */
      artistShare: (isLabel || me.labelId >= 0) ? cur : null,
      labelShare: (isLabel || me.labelId >= 0) ? cents(1 - cur) : null,
      effectiveFrom: (isLabel || me.labelId >= 0) && row ? PERIODS[pIndexOf(row.from)].label : null,
      basis: (isLabel || me.labelId >= 0) && row ? (row.note || null) : null,
      history: (isLabel || me.labelId >= 0) ? sched.map(r => ({ from: PERIODS[pIndexOf(r.from)].label, artistShare: r.rate, note: r.note || null })) : [],
      producerTracks,
      hasAdvance: !!(state.advances[partyKey] && state.advances[partyKey].opening > 0),
      payoutThreshold: CFG.PAYOUT_MIN,
      /* nhịp báo cáo của các nền tảng: cái quyết định khi nào tiền về ví */
      cadence: reportCadence(),
      statementNote: "Bảng kê PDF do Haustek gửi riêng từng kỳ ghi đầy đủ căn cứ tính và các khoản khấu trừ.",
      statementNoteEn: "The PDF statement Haustek sends each period carries the full basis of calculation and every deduction.",
      /* Giả định của bản mẫu, ghi thẳng vào payload để giao diện nói ra */
      paidBy: "Haustek",
      assumptionQuestion: (!isLabel && me.labelId >= 0) ? "q8" : null
    });
  },

  /* Danh sách nghệ sĩ trong roster của label, theo kỳ đã xét duyệt. Chỉ label
     mới gọi được; nghệ sĩ không có roster. Tạm ứng cá nhân của nghệ sĩ là
     chuyện giữa nghệ sĩ với Haustek, không đưa vào đây. */
  roster(role, partyId, periodKey) {
    assertParty(role, partyId);
    if (role !== "label") throw new Error("Chỉ label mới có danh sách nghệ sĩ");
    const p = requireApproved(periodKey);
    const ids = idxOf(byLabel, partyId);
    const per = new Map();
    for (const i of ids) {
      const g = grossOf(i, p, "rec");
      if (g <= 0) continue;
      const sp = splitRec(i, g, PERIODS[p].k);
      const a = tArtist[i];
      let o = per.get(a);
      if (!o) { o = { artistId: a, name: ARTISTS[a].name, clientId: ARTISTS[a].clientId, tracks: 0, streams: 0, revenue: 0, artist: 0, labelCut: 0 }; per.set(a, o); }
      /* revenue = phần sau phí (trả nghệ sĩ + phần label); artist = số trả cho
         nghệ sĩ, gồm cả điểm producer của bài. Không có khoản phí nào ở đây. */
      o.tracks++; o.streams += recStreams[i * P + p]; o.revenue += sp.net; o.artist += sp.artist + sp.producer; o.labelCut += sp.labelCut;
    }
    const rows = [...per.values()].map(o => Object.assign(o, { revenue: cents(o.revenue), artist: cents(o.artist), labelCut: cents(o.labelCut) }))
      .sort((a, b) => b.revenue - a.revenue);
    const idle = [];
    ARTISTS.forEach(a => { if (a.labelId === partyId && !per.has(a.id)) idle.push({ artistId: a.id, name: a.name, clientId: a.clientId, tracks: idxOf(byArtist, a.id).length, streams: 0, revenue: 0, artist: 0, labelCut: 0 }); });
    const total = rows.reduce((t, r) => ({ revenue: t.revenue + r.revenue, artist: t.artist + r.artist, labelCut: t.labelCut + r.labelCut, streams: t.streams + r.streams }), { revenue: 0, artist: 0, labelCut: 0, streams: 0 });
    return scrub({ periodKey, rows: rows.concat(idle), earning: rows.length, count: rows.length + idle.length,
      total: { revenue: cents(total.revenue), artist: cents(total.artist), labelCut: cents(total.labelCut), streams: total.streams } });
  },

  /* Nghệ sĩ mà bên này được gửi hồ sơ thay: label thì cả roster, nghệ sĩ thì chính mình. */
  rosterArtists(role, partyId) {
    assertParty(role, partyId);
    if (role === "label") return scrub({ rows: ARTISTS.filter(a => a.labelId === partyId).map(a => ({ artistId: a.id, name: a.name, clientId: a.clientId })) });
    const a = ARTISTS[partyId];
    return scrub({ rows: [{ artistId: a.id, name: a.name, clientId: a.clientId }] });
  },

  /* Bản phát hành: hồ sơ đã gửi (state.releases) và bản đã có trong danh mục. */
  releases(role, partyId) {
    assertParty(role, partyId);
    const mine = state.releases.filter(r => releaseVisible(r, role, partyId));
    const cat = catalogueReleases(role, partyId, 40);
    return scrub({ submissions: mine, catalogue: cat.rows, catalogueTotal: cat.total,
      statuses: RELEASE_STATUS.slice() });
  },
  submitRelease(role, partyId, payload) {
    assertParty(role, partyId);
    const artistId = role === "label" ? +(payload && payload.artistId) : partyId;
    if (!ARTISTS[artistId]) throw new Error("Chưa chọn nghệ sĩ chính");
    if (role === "label" && ARTISTS[artistId].labelId !== partyId) throw new Error("Nghệ sĩ này không thuộc label của bạn");
    const who = role === "label" ? LABELS[partyId] : ARTISTS[partyId];
    const r = buildRelease(payload, artistId, who.clientId, role);
    state.releases.unshift(r);
    audit.log("release.submit", r.id + " · " + r.title + " · " + r.artistName + " · " + r.tracks.length + " track", who.clientId);
    store.save();
    return scrub({ id: r.id, status: r.status, tracks: r.tracks.length });
  },

  /* Hồ sơ phát hành của MỘT bản ghi trong danh mục: bước nào đã xong, nền
     tảng nào đã lên (kèm đường dẫn), còn thiếu gì, và lượt nghe, doanh thu
     theo từng nền tảng qua từng kỳ đã xét duyệt. Không cần kỳ: trạng thái
     phát hành là của bản ghi, không phải của kỳ. */
  trackAsset(role, partyId, trackId) {
    assertParty(role, partyId);
    const i = +trackId;
    if (!inScope(role, partyId, "rec", i)) throw new Error("Bản ghi này không thuộc phạm vi của bạn");
    return scrub(assetOf(i, role, partyId));
  },
  /* Danh mục theo góc nhìn phát hành: mọi bản ghi trong phạm vi, kể cả
     bản chưa có doanh thu. opts: q, stage (live|processing|issue|missing),
     sort, dir, offset, limit. */
  catalogue(role, partyId, opts) {
    assertParty(role, partyId);
    return scrub(catalogueOf(role, partyId, opts));
  },
  /* Lượt nghe và doanh thu theo từng nền tảng, từng kỳ đã xét duyệt, cho cả
     tài khoản. Cột nào cộng lại cũng bằng con số ở trang Tổng quan. */
  platformReport(role, partyId) {
    assertParty(role, partyId);
    const pList = [];
    for (let p = 0; p < P; p++) if (state.approved[PERIODS[p].k]) pList.push(p);
    return scrub(platformReport(role, partyId, pList));
  },
  /* Cây label: label mẹ thấy chính mình, từng label con và nghệ sĩ bên
     dưới mỗi label con. Nghệ sĩ không có cây; label con chỉ thấy cây của
     chính mình (không có label con) và tên label mẹ. */
  labelTree(role, partyId, periodKey) {
    assertParty(role, partyId);
    if (role !== "label") throw new Error("Chỉ label mới có cây label");
    const p = requireApproved(periodKey);
    return scrub(Object.assign({ periodKey }, labelTreeOf(partyId, p)));
  },
  /* Những tài khoản mà người này được xem thay: label mẹ xem được từng
     label con. Hệ thống thật kiểm tra uỷ quyền này ở máy chủ theo phiên
     đăng nhập; bản mẫu kiểm ở đây và cổng đối tác gọi trước khi đổi phiên. */
  delegations(role, partyId) {
    assertParty(role, partyId);
    if (role !== "label") return scrub({ viewAs: [], parent: null });
    const parent = LABELS[partyId].parentId >= 0 ? LABELS[LABELS[partyId].parentId] : null;
    return scrub({
      viewAs: labelChildren(partyId).map(l => ({ labelId: l.id, name: l.name, clientId: l.clientId })),
      parent: parent ? { labelId: parent.id, name: parent.name, clientId: parent.clientId } : null
    });
  },
  /* ---- xu hướng ngày, playlist ---- */
  dailyTrends(role, partyId, days) {
    assertParty(role, partyId);
    return scrub(dailyTrends(role, partyId, days));
  },
  playlists(role, partyId) {
    assertParty(role, partyId);
    return scrub(playlistReport(role, partyId));
  },
  /* ---- 19i: chia sẻ tác quyền, chất lượng lượt nghe, ngưỡng, metadata, giải thích, thông báo, tìm, chiến dịch ---- */
  splits(role, partyId) { assertParty(role, partyId); return scrub(splitsReport(role, partyId)); },
  splitsOf(role, partyId, trackId) { assertParty(role, partyId); const sc = scopeOf(role, partyId, "rec"); if (sc && !sc.includes(+trackId)) throw new Error("Không có quyền"); return scrub(splitsOf(+trackId, role, partyId)); },
  setSplit(role, partyId, trackId, c) { assertParty(role, partyId); return scrub(setSplit(role, partyId, trackId, c, partyClientIdOf(role, partyId))); },
  removeSplit(role, partyId, trackId, email) { assertParty(role, partyId); return scrub(removeSplit(role, partyId, trackId, email, partyClientIdOf(role, partyId))); },
  quality(role, partyId) { assertParty(role, partyId); return scrub(qualityReport(role, partyId)); },
  disputeAlert(role, partyId, trackId, note) { assertParty(role, partyId); return scrub(setAlertStatus(trackId, "disputed", note, partyClientIdOf(role, partyId), role, partyId)); },
  monetization(role, partyId, trackId) { assertParty(role, partyId); const sc = scopeOf(role, partyId, "rec"); if (sc && !sc.includes(+trackId)) throw new Error("Không có quyền"); return scrub(monetizationOf(+trackId)); },
  metadataHealth(role, partyId, trackId) { assertParty(role, partyId); const sc = scopeOf(role, partyId, "rec"); if (sc && !sc.includes(+trackId)) throw new Error("Không có quyền"); return scrub(metadataHealth(+trackId, role, partyId)); },
  metadataReport(role, partyId) { assertParty(role, partyId); return scrub(metadataReport(role, partyId)); },
  explain(role, partyId, pk) { assertParty(role, partyId); return scrub(explainPeriod(role, partyId, pk)); },
  withdrawalQuote(role, partyId, amount) { assertParty(role, partyId); return scrub(withdrawalQuote(role === "label" ? "L:" + partyId : "A:" + partyId, amount)); },
  notifications(role, partyId) { assertParty(role, partyId); return scrub(notificationsOf(role, partyId)); },
  markNotifications(role, partyId, ids) { assertParty(role, partyId); return scrub(markNotifications(role, partyId, ids)); },
  search(role, partyId, q, limit) { assertParty(role, partyId); return scrub(searchAll(role, partyId, q, limit)); },
  campaigns(role, partyId) { assertParty(role, partyId); return scrub(campaignsOf(role, partyId)); },
  /* ---- ví, rút tiền, bảng kê ---- */
  wallet(role, partyId) {
    assertParty(role, partyId);
    return scrub(walletOf(role === "label" ? "L:" + partyId : "A:" + partyId));
  },
  requestWithdrawal(role, partyId, o) {
    assertParty(role, partyId);
    const pk = role === "label" ? "L:" + partyId : "A:" + partyId;
    const r = requestWithdrawal(pk, o && o.amount, o && o.note, partyClientId(pk));
    return scrub({ id: r.id, status: r.status, amount: r.amount, requestedAt: r.requestedAt });
  },
  cancelWithdrawal(role, partyId, id) {
    assertParty(role, partyId);
    const pk = role === "label" ? "L:" + partyId : "A:" + partyId;
    const w = state.withdrawals.find(x => x.id === id && x.partyKey === pk);
    if (!w) throw new Error("Không tìm thấy yêu cầu");
    if (w.status !== "requested") throw new Error("Yêu cầu đang được xử lý, không huỷ được");
    w.status = "cancelled"; w.updatedAt = nowISO(); w.history.push({ at: w.updatedAt, status: "cancelled", by: partyClientId(pk) });
    audit.log("withdraw.cancel", w.id + " · " + w.party.name, partyClientId(pk)); store.save();
    return scrub({ id: w.id, status: w.status });
  },
  setBank(role, partyId, b) {
    assertParty(role, partyId);
    const pk = role === "label" ? "L:" + partyId : "A:" + partyId;
    if (!b || !String(b.bank || "").trim() || !String(b.account || "").trim() || !String(b.holder || "").trim()) throw new Error("Cần đủ tên ngân hàng, số tài khoản và tên chủ tài khoản");
    state.bank[pk] = { bank: String(b.bank).trim(), account: String(b.account).replace(/\s+/g, ""), holder: String(b.holder).trim().toUpperCase(),
      currency: b.currency === "VND" ? "VND" : "USD", swift: String(b.swift || "").trim().toUpperCase(), updatedAt: nowISO() };
    audit.log("bank.set", partyName(pk) + " · " + state.bank[pk].bank + " ····" + state.bank[pk].account.slice(-4), partyClientId(pk)); store.save();
    return scrub({ ok: true, bank: state.bank[pk] });
  },
  statements(role, partyId) {
    assertParty(role, partyId);
    return scrub({ rows: statementsOf(role, partyId) });
  },

  /* ---- dự báo ---- */
  forecast(role, partyId) {
    assertParty(role, partyId);
    return scrub(forecastOf(role, partyId));
  },

  /* ---- hỗ trợ ---- */
  tickets(role, partyId) {
    assertParty(role, partyId);
    const pk = role === "label" ? "L:" + partyId : "A:" + partyId;
    const rows = state.tickets.filter(t => t.partyKey === pk).map(t => Object.assign({}, t, {
      assigneeName: t.assignee && staffById(t.assignee) ? staffById(t.assignee).name : null, assignee: undefined }));
    return scrub({ rows, types: TICKET_TYPES, counts: { open: rows.filter(t => t.status !== "done").length, done: rows.filter(t => t.status === "done").length } });
  },
  createTicket(role, partyId, o) {
    assertParty(role, partyId);
    const pk = role === "label" ? "L:" + partyId : "A:" + partyId;
    if (o && o.trackId != null && !inScope(role, partyId, "rec", +o.trackId)) throw new Error("Bài hát này không thuộc phạm vi của bạn");
    if (!o || !String(o.body || "").trim()) throw new Error("Bạn hãy mô tả yêu cầu");
    const t = createTicket({ type: o.type, title: o.title, body: o.body, partyKey: pk, trackId: o.trackId, priority: o.priority === "high" ? "high" : "normal",
      assignee: (o.type === "thanh-toan" ? staffByRole("accounting")[0] : o.type === "phat-hanh" ? staffByRole("ops")[0] : staffByRole("support")[0]).id });
    audit.log("ticket.create", t.id + " · " + t.party.name + " · " + t.title, partyClientId(pk)); store.save();
    return scrub({ id: t.id, status: t.status, dueAt: t.dueAt });
  },
  replyTicket(role, partyId, id, text) {
    assertParty(role, partyId);
    const pk = role === "label" ? "L:" + partyId : "A:" + partyId;
    const t = state.tickets.find(x => x.id === id && x.partyKey === pk);
    if (!t) throw new Error("Không tìm thấy yêu cầu");
    if (!String(text || "").trim()) throw new Error("Nội dung trống");
    t.messages.push({ at: nowISO(), by: partyClientId(pk), who: "partner", text: String(text).trim() });
    t.updatedAt = nowISO(); if (t.status === "waiting" || t.status === "done") t.status = "open";
    store.save();
    return scrub({ id: t.id, status: t.status });
  },

  /* ---- bản quyền: khiếu nại trên bài của mình ---- */
  claims(role, partyId) {
    assertParty(role, partyId);
    const sc = scopeOf(role, partyId, "rec");
    const mine = new Set(Array.from(sc || []));
    const rows = state.claims.filter(c => mine.has(c.trackId)).map(c => ({
      id: c.id, track: c.track, store: c.store, category: c.category,
      categoryLabel: (CLAIM_CAT.find(x => x.id === c.category) || {}).label, categoryLabelEn: (CLAIM_CAT.find(x => x.id === c.category) || {}).labelEn,
      otherParty: c.otherParty, country: c.country, dailyViews: c.dailyViews, status: c.status, priority: c.priority,
      createdAt: c.createdAt, updatedAt: c.updatedAt, expiresAt: c.expiresAt,
      lastNote: c.notes.length ? c.notes[c.notes.length - 1].text : null
    }));
    return scrub({ rows, categories: CLAIM_CAT, counts: { open: rows.filter(r => r.status !== "resolved" && r.status !== "released").length, total: rows.length } });
  },

  canViewAs(role, partyId, labelId) {
    assertParty(role, partyId);
    return !!canViewAs(role, partyId, +labelId);
  },

  trend(role, partyId, stream) {
    assertParty(role, partyId);
    stream = stream === "pub" ? "pub" : "rec";
    chanTacQuyenChoLabel(role, stream);
    return scrub({ points: PERIODS.map(p => state.approved[p.k]
      ? { k: p.k, label: p.label, value: agg(role, partyId, p.idx, stream).total, open: true }
      : { k: p.k, label: p.label, value: null, open: false }) });
  },

  breakdown(role, partyId, periodKey, stream, dim, opts) {
    assertParty(role, partyId);
    const p = requireApproved(periodKey);
    stream = stream === "pub" ? "pub" : "rec";
    chanTacQuyenChoLabel(role, stream);
    const isTerr = dim === "terr";
    const isStore = !isTerr && stream === "rec";
    const expanded = !!(opts && opts.all);
    /* Khách chỉ thấy tên NỀN TẢNG — thứ họ vốn đã biết. Không có tên đơn
       vị nào khác, không có "nguồn báo cáo" nào ở đây: đó là chuyện vận
       hành nội bộ của Haustek. */
    const names = isTerr ? TERR : (isStore ? PLAT_NAMES : PUBSRC);
    const wts   = isTerr ? TERR_W : (isStore ? null : PUBSRC_W);
    const acc = new Float64Array(names.length);
    const accTail = (isStore && expanded) ? new Float64Array(TAIL_W.length) : null;
    const sc = scopeOf(role, partyId, stream), n = sc ? sc.length : 0;
    const cap = Math.max(1, Math.min(n, 9000)), step = Math.max(1, Math.floor(n / cap));
    const rev = new Float64Array(N_PLAT);
    let scale = 0;
    for (let k = 0; k < n; k += step) {
      const i = sc[k];
      const m = mineOf(i, p, role, partyId, stream);
      if (m <= 0) continue;
      scale += m;
      if (isStore) {
        /* cùng phép chia với ma trận nền tảng × kỳ của từng bản ghi */
        const g = grossOf(i, p, stream), f = m / g;
        splitStores(i, p, rev);
        for (let j = 0; j < N_PLAT; j++) acc[j] += rev[j] * f;
        if (accTail) {
          const parts = splitDim(i, rev[N_PLAT - 1] * f, TAIL_W, p);
          for (let j = 0; j < TAIL_W.length; j++) accTail[j] += parts[j];
        }
      } else {
        const parts = splitDim(i, m, wts, p);
        for (let j = 0; j < names.length; j++) acc[j] += parts[j];
      }
    }
    const total = agg(role, partyId, p, stream).total;
    const norm = scale > 0 ? total / scale : 0;
    let hien, tail, totalStores;
    if (isStore) {
      /* 8 nền tảng lớn đứng riêng; phần còn lại là MỘT dòng, hoặc bóc ra
         theo từng nền tảng nhỏ khi mở rộng. Không bao giờ cắt mất tiền:
         phần đuôi bị cắt vẫn nằm lại một dòng. */
      const top = PLAT_NAMES.slice(0, N_TOP).map((s, j) => ({ name: s, value: cents(acc[j] * norm) })).filter(x => x.value > 0.004);
      top.sort((a, b) => b.value - a.value);
      const tailTotal = cents(acc[N_PLAT - 1] * norm);
      if (!expanded) {
        hien = top;
        tail = tailTotal > 0.004 ? { count: TAIL_W.length, value: tailTotal, name: PLAT_NAMES[N_PLAT - 1], nameEn: PLAT_NAMES_EN[N_PLAT - 1] } : null;
        totalStores = top.length + (tail ? tail.count : 0);
      } else {
        const list = TAIL_NAMES.map((s, j) => ({ name: s, value: cents(accTail[j] * norm) })).filter(x => x.value > 0.004);
        list.sort((a, b) => b.value - a.value);
        const N_HIEN = Math.max(0, 40 - top.length);
        hien = top.concat(list.slice(0, N_HIEN));
        const duoi = list.slice(N_HIEN);
        tail = duoi.length ? { count: duoi.length, value: cents(duoi.reduce((s, x) => s + x.value, 0)), name: PLAT_NAMES[N_PLAT - 1], nameEn: PLAT_NAMES_EN[N_PLAT - 1] } : null;
        totalStores = top.length + list.length;
      }
    } else {
      let list = names.map((s, j) => ({ name: s, value: cents(acc[j] * norm) })).filter(x => x.value > 0.004);
      list.sort((a, b) => b.value - a.value);
      const N_HIEN = expanded ? 40 : list.length;
      hien = list.slice(0, N_HIEN);
      const duoi = list.slice(N_HIEN);
      tail = duoi.length ? { count: duoi.length, value: cents(duoi.reduce((s, x) => s + x.value, 0)) } : null;
      totalStores = list.length;
    }
    /* Làm tròn từng dòng tới xu thì tổng lệch vài xu so với ô lớn — nhỏ,
       nhưng đây là báo cáo tiền, và người đọc cộng tay được. Dồn phần dư
       vào dòng "còn lại" (hoặc dòng lớn nhất) để bảng luôn cộng đúng. */
    const dangCo = cents(hien.reduce((x, r) => x + r.value, 0) + (tail ? tail.value : 0));
    const du = cents(total - dangCo);
    if (Math.abs(du) > 0.004) {
      if (tail) tail.value = cents(tail.value + du);
      else if (hien.length) hien[0].value = cents(hien[0].value + du);
    }
    return scrub({ dim, rows: hien, tail, shown: hien.length, totalStores, expanded });
  },

  tracks(role, partyId, periodKey, stream, opts) {
    assertParty(role, partyId);
    const p = requireApproved(periodKey);
    stream = stream === "pub" ? "pub" : "rec";
    chanTacQuyenChoLabel(role, stream);
    opts = opts || {};
    const q = (opts.q || "").trim().toLowerCase();
    const sc = scopeOf(role, partyId, stream), n = sc ? sc.length : 0;
    const rows = [];
    for (let k = 0; k < n; k++) {
      const i = sc[k];
      const g = grossOf(i, p, stream);
      if (g <= 0) continue;
      if (q && !(tTitle[i].toLowerCase().includes(q) || tIsrc[i].toLowerCase().includes(q)
                 || ARTISTS[tArtist[i]].name.toLowerCase().includes(q))) continue;
      rows.push({
        id: i, title: tTitle[i], isrc: tIsrc[i], type: TYPES[tType[i]],
        artist: ARTISTS[tArtist[i]].name,
        streams: stream === "rec" ? recStreams[i * P + p] : null,
        revenue: stream === "rec" ? cents(revenueOf(i, p, role)) : mineOf(i, p, role, partyId, stream),
        mine: mineOf(i, p, role, partyId, stream)
      });
    }
    const key = opts.sort || "mine", dir = opts.dir === 1 ? 1 : -1;
    rows.sort((a, b) => {
      const A = a[key], B = b[key];
      return typeof A === "string" ? A.localeCompare(B, "vi") * dir : ((A || 0) - (B || 0)) * dir;
    });
    return scrub({ total: rows.length, rows });
  },

  trackDetail(role, partyId, periodKey, stream, trackId) {
    assertParty(role, partyId);
    const p = requireApproved(periodKey);
    stream = stream === "pub" ? "pub" : "rec";
    chanTacQuyenChoLabel(role, stream);
    const i = +trackId;
    /* kiểm tra quyền lần nữa ở đây, không tin giao diện đã lọc đúng */
    if (!inScope(role, partyId, stream, i)) throw new Error("Bản ghi này không thuộc phạm vi của bạn");
    const g = grossOf(i, p, stream);
    const m = mineOf(i, p, role, partyId, stream);
    const byTerr = splitDim(i, m, TERR_W, p);
    const mk = (ns, vs, nsEn) => ns.map((nm, j) => ({ name: nm, nameEn: nsEn ? nsEn[j] : nm, value: cents(vs[j]) }))
      .sort((a, b) => b.value - a.value).slice(0, 9).filter(x => x.value > 0.004);
    let byStore;
    if (stream === "rec") {
      /* cùng phép chia với ma trận nền tảng × kỳ, nên hai chỗ khớp nhau */
      const rev = splitStores(i, p), f = g > 0 ? m / g : 0;
      /* làm tròn y như ma trận nền tảng × kỳ, để hai bảng khớp nhau tới xu */
      byStore = mk(PLAT_NAMES, khopTong(Array.from(rev, v => v * f), m, cents), PLAT_NAMES_EN);
    } else byStore = mk(PUBSRC, splitDim(i, m, PUBSRC_W, p));
    const out = {
      id: i, title: tTitle[i], isrc: tIsrc[i], type: TYPES[tType[i]],
      artist: ARTISTS[tArtist[i]].name,
      streams: stream === "rec" ? recStreams[i * P + p] : null,
      revenue: stream === "rec" ? cents(revenueOf(i, p, role)) : m, mine: m,
      byStore, byTerritory: mk(TERR, byTerr), steps: []
    };
    /* Chuỗi tiền của một bài cũng chỉ có số của người xem: label thấy doanh
       thu (sau phí) → trả nghệ sĩ → phần label; nghệ sĩ chỉ thấy phần mình. */
    if (stream === "rec") {
      const s = splitRec(i, g, periodKey);
      if (role === "label") out.steps = [
        { label: "Doanh thu của bài hát", labelEn: "Track revenue", value: s.net },
        { label: "Thanh toán cho nghệ sĩ", labelEn: "Paid to the artist", value: -cents(s.artist + s.producer) },
        { label: "Phần label được hưởng", labelEn: "Label keeps", value: s.labelCut, strong: true }
      ];
      else out.steps = [
        { label: "Thu nhập của bạn từ bài hát này", labelEn: "Your income from this track", value: s.artist, strong: true }
      ];
    } else {
      const share = writerShare(i, partyId);
      out.steps = [
        { label: "Phần sáng tác của bạn", labelEn: "Your writer share", value: null, text: fmt.pct(share) },
        { label: "Thu nhập tác quyền của bạn", labelEn: "Your publishing income", value: m, strong: true }
      ];
    }
    return scrub(out);
  }
};

/* =====================================================================
   25. TIỆN ÍCH GIAO DIỆN DÙNG CHUNG
   Bảng ảo hoá: chỉ vẽ chừng 30 dòng đang nhìn thấy, dù danh sách 50.000
   dòng. Cùng một hàm cho danh mục ở intranet và bảng bài ở dashboard.
   ===================================================================== */
function vtable(opts) {
  const body = opts.body, spacer = opts.spacer, head = opts.head;
  const RH = opts.rowHeight || 44;
  let rows = opts.rows || [], cols = opts.cols || [];
  function grid() { return cols.map(c => c.w).join(" "); }
  function paintHead() {
    if (!head) return;
    head.style.display = "grid";
    head.style.gridTemplateColumns = grid();
    head.innerHTML = cols.map(c =>
      `<span class="${c.num ? "num" : ""}" data-k="${esc(c.k)}">${esc(c.lab)}${
        opts.sortKey === c.k ? (opts.sortDir > 0 ? " ↑" : " ↓") : ""}</span>`).join("");
  }
  function paint() {
    const top = body.scrollTop, h = body.clientHeight;
    const first = Math.max(0, Math.floor(top / RH) - 4);
    const last = Math.min(rows.length, Math.ceil((top + h) / RH) + 4);
    let out = "";
    for (let r = first; r < last; r++) {
      out += `<div class="vt-row${opts.isSelected && opts.isSelected(rows[r]) ? " sel" : ""}" style="top:${r * RH}px;grid-template-columns:${grid()};display:grid" data-r="${r}">${opts.rowHTML(rows[r], r)}</div>`;
    }
    spacer.innerHTML = out;
  }
  function refresh(newRows, newCols) {
    if (newRows) rows = newRows;
    if (newCols) cols = newCols;
    spacer.style.height = (rows.length * RH) + "px";
    paintHead(); paint();
  }
  body.onscroll = () => { if (!body._raf) body._raf = requestAnimationFrame(() => { body._raf = 0; paint(); }); };
  refresh();
  return { refresh, paint, rowAt: r => rows[r], get length() { return rows.length; } };
}

/* biểu đồ cột 12 kỳ — dùng ở cả hai trang */
function barChart(canvas, points, opt) {
  opt = opt || {};
  const c = canvas.getContext("2d");
  const d = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
  const H = opt.height || 150;
  canvas.width = Math.max(r.width * d, 1); canvas.height = H * d;
  const W = canvas.width, HH = canvas.height;
  c.clearRect(0, 0, W, HH);
  const vals = points.map(p => p.value || 0);
  const peak = Math.max(...vals, 0.01);
  const padB = 22 * d, padT = 16 * d, bw = W / points.length;
  /* Ba trạng thái, đừng gộp làm hai:
       value == null   → chưa có số nào (cổng khách với kỳ chưa duyệt) → vạch cụt
       open === false  → có số nhưng chưa chốt (intranet) → cột viền đứt, vẫn đúng độ cao
       còn lại         → đã chốt → cột đặc
     Vẽ kỳ chưa chốt thành vạch cụt ở intranet là giấu mất thứ người vận
     hành cần nhìn nhất: kỳ đang làm dở to cỡ nào. */
  points.forEach((p, i) => {
    const h = (p.value || 0) / peak * (HH - padB - padT);
    const x = i * bw, y = HH - padB - h, cur = i === opt.current;
    const bx = x + bw * 0.2, bwid = bw * 0.6;
    if (p.value == null) {
      c.fillStyle = "#EDEEF2";
      c.fillRect(bx, HH - padB - 8 * d, bwid, 8 * d);
    } else if (p.open === false) {
      c.fillStyle = cur ? "#FFD8DF" : "#EDEEF2";
      c.fillRect(bx, y, bwid, Math.max(h, 0));
      c.strokeStyle = cur ? "#FF2E4C" : "#B6B7C2";
      c.lineWidth = 1.4 * d;
      if (c.setLineDash) c.setLineDash([3 * d, 2.6 * d]);
      c.strokeRect(bx + c.lineWidth / 2, y + c.lineWidth / 2, bwid - c.lineWidth, Math.max(h - c.lineWidth, 0));
      if (c.setLineDash) c.setLineDash([]);
    } else {
      c.fillStyle = cur ? "#FF2E4C" : "#D7D9E0";
      c.fillRect(bx, y, bwid, Math.max(h, 0));
    }
    if (cur && p.value > 0) {
      c.fillStyle = "#C8102E";
      c.font = `600 ${9.5 * d}px 'IBM Plex Mono',monospace`; c.textAlign = "center";
      c.fillText(fmt.usd0(p.value), x + bw / 2, Math.max(y - 5 * d, 12 * d));
    }
    c.fillStyle = cur ? "#C8102E" : (p.open === false ? "#B6B7C2" : "#8A8A99");
    c.font = `400 ${8.5 * d}px 'IBM Plex Mono',monospace`; c.textAlign = "center";
    c.fillText(String(p.label).slice(0, 2), x + bw / 2, HH - 7 * d);
  });
  c.fillStyle = "#E2E3E8"; c.fillRect(0, HH - padB, W, 1 * d);
}

/* =====================================================================
   26. ĐĂNG KÝ MÀN HÌNH (intranet nạp từng module vào đây)
   ===================================================================== */
const screens = [];
function registerScreen(def) {
  if (!def || !def.id || typeof def.render !== "function")
    throw new Error("Trang phải có id và hàm render(root, ctx)");
  screens.push(def);
}

/* =====================================================================
   26b. TRẠNG THÁI KHỞI ĐIỂM
   Mở bản mẫu lần đầu thì 10 kỳ đầu đã đối chiếu xong và đã duyệt — như
   một hệ thống đã chạy được gần một năm. Hai kỳ cuối cố tình để dở:
     · 06/2026 — đủ ba luồng nhưng đối chiếu còn lệch $41,37 ở YouTube
     · 07/2026 — chưa nạp TikTok
   Hai kỳ đó chính là việc phải làm ở màn hình "Đối chiếu & duyệt kỳ",
   và cũng là lý do dashboard của label / nghệ sĩ chưa thấy chúng.
   ===================================================================== */
if (FRESH) {
  for (let pi = 0; pi <= P - 3; pi++) {
    try {
      fx.lock(pi, 25800 + pi * 30);
      approve(pi, "ops@haustek-group.com", "Đối soát xong, đã xét duyệt");
      /* approve() đóng dấu thời điểm HIỆN TẠI — đúng cho lần duyệt thật,
         nhưng mười kỳ lịch sử duyệt lúc khởi tạo thì mang chung một dấu
         thời gian, và bảng kê của khách hiện mười kỳ cùng ngày chốt sổ.
         Đặt lại thành ngày hợp lý: khoảng ba tuần sau khi kỳ kết thúc,
         là lúc luồng cuối cùng về đủ và đối chiếu xong. */
      const p = PERIODS[pi];
      const d = new Date(p.year, p.month, 18 + (pi % 5), 9, 40 + (pi * 7) % 20);
      state.approved[p.k].at = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")
        + "-" + String(d.getDate()).padStart(2, "0") + " "
        + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":00";
      state.fx.locked[p.k].at = state.approved[p.k].at.slice(0, 10);
    } catch (e) { console.warn("[haustek-core] không xét duyệt được kỳ " + PERIODS[pi].label + ": " + e.message); }
  }
  seedPartyManager(); seedWithdrawals(); seedTickets(); seedClaims(); seedOps();
  /* Những lần nạp trong lịch sử cũng phải để lại dấu vết, không thì mở
     nhật ký ra thấy trống trơn và tưởng hệ thống không ghi gì. */
  PERIODS.forEach((p, pi) => {
    FEEDS.forEach(f => {
      const st = state.feeds[p.k][f.id];
      if (st.status !== "loaded") return;
      state.audit.push({ at: String(st.at).replace("T", " "), action: "ingest.load",
        by: "ops@haustek-group.com",
        detail: "Nhập " + f.name + " · kỳ " + p.label + " · " + st.file });
    });
    const pb = state.pub[p.k];
    if (pb && pb.status === "loaded")
      state.audit.push({ at: String(pb.at).replace("T", " "), action: "ingest.pub",
        by: "ops@haustek-group.com", detail: "Nhập báo cáo tác quyền quý " + p.quarter + "/" + p.year + " · " + pb.file });
  });
  state.audit.sort((a, b) => a.at < b.at ? 1 : a.at > b.at ? -1 : 0);
  state.audit = state.audit.slice(0, 120);
  store.save();
}

/* =====================================================================
   27. XUẤT RA & KHOÁ CỬA
   ===================================================================== */
const H = {
  VERSION: CFG.VERSION,
  bootMs: () => Math.round(performance.now() - T_BOOT),
  fmt, esc, vtable, barChart, cents,
  screens, registerScreen,
  api, admin,
  storage: { available: store.available, exportJSON: () => store.exportJSON(), importJSON: t => store.importJSON(t) },

  /* dashboard.html gọi hàm này ngay dòng đầu. Sau đó HAUSTEK.admin không
     còn tồn tại trong trình duyệt khách — cả dữ liệu thô, cả tên đơn vị
     phân phối, cả tỷ lệ gốc — hai thứ sau thì ngay từ đầu đã không nằm
     trong file này (xem provideSecrets ở trên).
     Nhắc lại cho khỏi hiểu nhầm: lời gọi này gỡ mặt tiền admin khỏi TRANG
     đang chạy, chứ không dựng được tường giữa hai trang cùng gốc. Nạp lại
     lõi trong iframe cùng gốc là có lại; localStorage cũng đọc được. Muốn
     thật thì dữ liệu phải ở phía máy chủ.
     Trong hệ thật, thứ tương đương là: những thứ này chưa bao giờ rời
     khỏi máy chủ. */
  lockdown() {
    delete H.admin; delete H.screens; delete H.registerScreen;
    H.storage = { available: store.available };
    H.locked = true;
    Object.freeze(H);
    return true;
  },
  locked: false
};

global.HAUSTEK = H;
console.log("[haustek-core] dựng xong trong " + H.bootMs() + "ms · "
  + fmt.num(N) + " bản ghi · " + fmt.num(N * P * 3) + " ô doanh thu theo nguồn");

})(window);
