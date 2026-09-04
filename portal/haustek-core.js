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
  VERSION:      "1.2.0",   /* 1.2.0: label mẹ / label con, trạng thái phát hành theo nền tảng */
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
                 "rate_share", "rateShare", "ký trực tiếp"];

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
  arr.forEach(g => { let s = 0; for (const i of g.tracks) for (const p of daDuyet) s += grossOf(i, p, "rec"); g.gross = cents(s); });
  arr.sort((a, b) => b.gross - a.gross || b.rel - a.rel || a.artistId - b.artistId);
  const total = arr.length;
  const rows = arr.slice(0, limit || 40).map(g => {
    const first = g.tracks[0];
    return { id: "CAT-" + g.key.replace(/[^0-9a-z]/gi, "-"), title: tTitle[first], type: TYPES[g.type] || "Single",
      artistId: g.artistId, artistName: ARTISTS[g.artistId].name,
      releasePeriod: PERIODS[g.rel].label, tracks: g.tracks.length, earning: g.gross > 0, gross: g.gross,
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
    state = s; invalidateRates(); rebuildMatchIndex(); store.save(); return true;
  },
  available() { try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); return true; } catch (e) { return false; } }
};

const _saved = store.load();
const FRESH = !_saved;
state = _saved || defaultState();
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
function trackMatrix(i, pList, mineFactor) {
  const rows = PLAT_NAMES.map((n, j) => ({ name: n, nameEn: PLAT_NAMES_EN[j], gross: [], streams: [], mine: [] }));
  const totals = { gross: [], streams: [], mine: [] };
  const rev = new Float64Array(N_PLAT), st = new Float64Array(N_PLAT);
  pList.forEach(p => {
    splitStores(i, p, rev); splitStreams(i, p, rev, st);
    const g = grossRec(i, p);
    const f = mineFactor ? mineFactor(p, g) : 1;
    const m = mineFactor ? cents(g * f) : cents(g);
    const gv = khopTong(Array.from(rev), cents(g), cents);
    const sv = khopTong(Array.from(st), recStreams[i * P + p], Math.round);
    const mv = khopTong(Array.from(rev, v => v * f), m, cents);
    for (let j = 0; j < N_PLAT; j++) { rows[j].gross.push(gv[j]); rows[j].streams.push(sv[j]); rows[j].mine.push(mv[j]); }
    totals.gross.push(cents(g)); totals.streams.push(recStreams[i * P + p]); totals.mine.push(m);
  });
  return { rows, totals };
}

/* Báo cáo nền tảng × kỳ của cả một phạm vi (tài khoản đối tác, hoặc toàn
   danh mục cho nội bộ). Lấy mẫu như breakdown() rồi chuẩn hoá về đúng
   tổng của kỳ, nên cột nào cộng lại cũng bằng con số ở trang Tổng quan. */
function platformReport(role, partyId, pList) {
  const sc = scopeOf(role, partyId, "rec"), n = sc ? sc.length : N;
  const cap = Math.max(1, Math.min(n, 9000)), step = Math.max(1, Math.floor(n / cap));
  const rows = PLAT_NAMES.map((nm, j) => ({ name: nm, nameEn: PLAT_NAMES_EN[j], gross: [], streams: [], mine: [] }));
  const totals = { gross: [], streams: [], mine: [] };
  const rev = new Float64Array(N_PLAT), st = new Float64Array(N_PLAT);
  pList.forEach(p => {
    const accG = new Float64Array(N_PLAT), accS = new Float64Array(N_PLAT), accM = new Float64Array(N_PLAT);
    let sg = 0, ss = 0, sm = 0;
    for (let k = 0; k < n; k += step) {
      const i = sc ? sc[k] : k;
      const g = grossRec(i, p);
      if (g <= 0) continue;
      const m = mineOf(i, p, role, partyId, "rec"), f = m / g;
      splitStores(i, p, rev); splitStreams(i, p, rev, st);
      for (let j = 0; j < N_PLAT; j++) { accG[j] += rev[j]; accS[j] += st[j]; accM[j] += rev[j] * f; }
      sg += g; ss += recStreams[i * P + p]; sm += m;
    }
    const a = agg(role, partyId, p, "rec");
    const nG = sg > 0 ? a.gross / sg : 0, nS = ss > 0 ? a.streams / ss : 0, nM = sm > 0 ? a.total / sm : 0;
    const gv = khopTong(Array.from(accG, v => v * nG), a.gross, cents);
    const sv = khopTong(Array.from(accS, v => v * nS), a.streams, Math.round);
    const mv = khopTong(Array.from(accM, v => v * nM), a.total, cents);
    for (let j = 0; j < N_PLAT; j++) { rows[j].gross.push(gv[j]); rows[j].streams.push(sv[j]); rows[j].mine.push(mv[j]); }
    totals.gross.push(a.gross); totals.streams.push(a.streams); totals.mine.push(a.total);
  });
  return {
    periods: pList.map(p => ({ k: PERIODS[p].k, label: PERIODS[p].label, open: !!state.approved[PERIODS[p].k] })),
    rows, totals
  };
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
  return [
    { key: "hoso", label: "Hồ sơ phát hành", labelEn: "Release submission", status: "done", at: addDays(rel, -21),
      note: "Đã nhận đủ metadata, file âm thanh và ảnh bìa", noteEn: "Metadata, audio and artwork received" },
    { key: "tiepnhan", label: "Tiếp nhận và kiểm tra hồ sơ", labelEn: "Received and checked", status: "done", at: addDays(rel, -19),
      note: "Hồ sơ đủ thông tin để xử lý", noteEn: "Submission complete enough to proceed" },
    { key: "ma", label: "Cấp mã ISRC và UPC", labelEn: "ISRC and UPC assigned", status: "done", at: addDays(rel, -17),
      note: "ISRC " + tIsrc[i] + " · UPC " + tUpc[i], noteEn: "ISRC " + tIsrc[i] + " · UPC " + tUpc[i] },
    { key: "noidung", label: "Kiểm tra nội dung và quyền", labelEn: "Content and rights check", status: "done", at: addDays(rel, -14),
      note: "Không phát hiện trùng bản ghi hay tranh chấp quyền", noteEn: "No duplicate recording or rights conflict found" },
    { key: "gui", label: "Gửi tới các nền tảng", labelEn: "Delivered to platforms", status: "done", at: addDays(rel, -10),
      note: "Đã gửi tới " + tongNT + " nền tảng, ngày phát hành " + fmt.date(rel),
      noteEn: "Delivered to " + tongNT + " platforms, release date " + fmt.date(rel) },
    { key: "len", label: "Có mặt trên nền tảng", labelEn: "Live on platforms",
      status: anyIssue ? "issue" : (allLive ? "done" : "doing"), at: liveAt.length ? liveAt[0] : null,
      note: live + "/" + d.rows.length + " nền tảng lớn đã lên · " + d.others.live + "/" + d.others.count + " nền tảng khác",
      noteEn: live + "/" + d.rows.length + " major platforms live · " + d.others.live + "/" + d.others.count + " others" },
    { key: "baocao", label: "Báo cáo doanh thu", labelEn: "Revenue reporting",
      status: firstRep >= 0 ? "done" : (age <= 2 ? "doing" : "todo"),
      at: null,   /* bước này tính theo kỳ, không theo ngày: ghi trong note */
      note: firstRep >= 0 ? "Có báo cáo từ kỳ " + PERIODS[firstRep].label
          : (age <= 2 ? "Nền tảng báo cáo doanh thu sau 1 đến 2 tháng kể từ ngày phát hành" : "Chưa có nền tảng nào báo cáo doanh thu cho bản ghi này"),
      noteEn: firstRep >= 0 ? "Reported from " + PERIODS[firstRep].label
          : (age <= 2 ? "Platforms report revenue 1 to 2 months after release" : "No platform has reported revenue for this recording yet") }
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
  const mineFactor = isAdmin ? null : (p, g) => (g > 0 ? mineOf(i, p, role, partyId, "rec") / g : 0);
  const mx = trackMatrix(i, pList, mineFactor);
  /* con số cạnh từng nền tảng: kỳ gần nhất có trong danh sách */
  const lastP = pList.length ? pList[pList.length - 1] : -1;
  let gv = null, sv = null, mv = null;
  if (lastP >= 0) {
    const col = pList.length - 1;
    gv = mx.rows.map(r => r.gross[col]); sv = mx.rows.map(r => r.streams[col]); mv = mx.rows.map(r => r.mine[col]);
  }
  /* con số cạnh nền tảng chỉ hiện khi nền tảng đang lên; nền tảng bị từ
     chối, đã gỡ hay chưa xác nhận không có số của kỳ gần nhất (ma trận theo
     tháng vẫn giữ số các kỳ trước, vì đó là lịch sử) */
  const platforms = d.rows.map((r, j) => Object.assign({}, r, (j < N_TOP && gv && r.status === "live")
    ? { streams: sv[j], gross: gv[j], mine: mv[j] } : { streams: null, gross: null, mine: null }));
  const life = { gross: 0, mine: 0, streams: 0 };
  mx.totals.gross.forEach((v, k) => { life.gross += v; life.mine += mx.totals.mine[k]; life.streams += mx.totals.streams[k]; });
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
    lifetime: { gross: cents(life.gross), mine: cents(life.mine), streams: life.streams },
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
    for (const p of daDuyet) { g += grossRec(i, p); st += recStreams[i * P + p]; }
    rows.push({ id: i, title: tTitle[i], isrc: tIsrc[i], type: TYPES[tType[i]], artist: ARTISTS[tArtist[i]].name,
      label: tLabel[i] >= 0 ? LABELS[tLabel[i]].name : null,
      releaseDate: s.releaseDate, releasePeriod: PERIODS[tRel[i]].label,
      stage: s.stage, live: s.live, total: s.total, missing: s.missing, hints: s.hints, gross: cents(g), streams: st });
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
  let earning = 0, streams = 0, gross = 0, artist = 0, labelCut = 0, producer = 0;
  for (const i of ids) {
    const g = grossRec(i, p);
    if (g <= 0) continue;
    const sp = splitRec(i, g, pk), a = tArtist[i];
    let o = per.get(a);
    if (!o) { o = { artistId: a, name: ARTISTS[a].name, clientId: ARTISTS[a].clientId, catalogue: idxOf(byArtist, a).length, tracks: 0, streams: 0, gross: 0, artist: 0, labelCut: 0 }; per.set(a, o); }
    o.tracks++; o.streams += recStreams[i * P + p]; o.gross += g; o.artist += sp.artist; o.labelCut += sp.labelCut;
    earning++; streams += recStreams[i * P + p]; gross += g; artist += sp.artist; labelCut += sp.labelCut; producer += sp.producer;
  }
  const artists = [];
  ARTISTS.forEach(a => {
    if (a.labelId !== lid) return;
    const o = per.get(a.id) || { artistId: a.id, name: a.name, clientId: a.clientId, catalogue: idxOf(byArtist, a.id).length, tracks: 0, streams: 0, gross: 0, artist: 0, labelCut: 0 };
    o.gross = cents(o.gross); o.artist = cents(o.artist); o.labelCut = cents(o.labelCut);
    artists.push(o);
  });
  artists.sort((x, y) => y.gross - x.gross || x.name.localeCompare(y.name, "vi"));
  return { labelId: lid, name: l.name, clientId: l.clientId, parentId: l.parentId,
    rate: rates.rateFor(l.key, pk), artistsCount: artists.length, tracks: ids.length, earning,
    earningArtists: per.size, streams, gross: cents(gross), artist: cents(artist), labelCut: cents(labelCut), producer: cents(producer),
    artists };
}
function labelTreeOf(labelId, p) {
  const me = labelSlice(labelId, p);
  const children = labelChildren(labelId).map(l => labelSlice(l.id, p));
  const total = { artists: me.artistsCount, tracks: me.tracks, earning: me.earning, streams: me.streams, gross: me.gross, artist: me.artist, labelCut: me.labelCut };
  children.forEach(ch => { total.artists += ch.artistsCount; total.tracks += ch.tracks; total.earning += ch.earning; total.streams += ch.streams;
    total.gross = cents(total.gross + ch.gross); total.artist = cents(total.artist + ch.artist); total.labelCut = cents(total.labelCut + ch.labelCut); });
  /* doanh thu gộp qua các kỳ đã xét duyệt, tách label mẹ và từng label con */
  const history = [];
  for (let q = 0; q < P; q++) {
    if (!state.approved[PERIODS[q].k]) continue;
    const sum = lid => { let s = 0; for (const i of idxOf(byLabel, lid)) s += grossRec(i, q); return cents(s); };
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
    guessEn: "The prototype assumes NO: the label share on a recording belongs to the label that directly manages it. The parent sees every figure of its sub-labels and their artists, but no money passes through the parent." }
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
  refresh() { const s = store.load(); if (s) { state = s; if (!state.releases) state.releases = []; invalidateRates(); rebuildMatchIndex(); } return !!s; },

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

    /* chuỗi "Tiền đi đâu" — máy chủ quyết định có những chặng nào */
    const chain = [];
    if (stream === "rec") {
      chain.push({ key: "gross", label: role === "label" ? "Doanh thu gộp của nghệ sĩ trong label" : "Doanh thu gộp bài hát của bạn",
                   labelEn: role === "label" ? "Gross revenue, artists on your label" : "Gross revenue on your tracks",
                   value: a.gross, note: "trước mọi khoản khấu trừ", noteEn: "before any deduction", kind: "top" });
      chain.push({ key: "fee", label: "Phí dịch vụ Haustek", labelEn: "Haustek fee", value: -a.fee,
                   note: fmt.pct(CFG.HAUSTEK_FEE) + " doanh thu gộp · theo hợp đồng",
                   noteEn: fmt.pct(CFG.HAUSTEK_FEE) + " of gross · per your contract", kind: "out" });
      if (role === "label") {
        chain.push({ key: "artist", label: "Thanh toán cho nghệ sĩ", labelEn: "Paid to your artists",
                     value: -cents(a.artist + a.producer),
                     note: "theo tỷ lệ bạn đã đặt, áp dụng mức có hiệu lực trong kỳ",
                     noteEn: "at the rate you set, as it stood during the period", kind: "out" });
        chain.push({ key: "final", label: "Phần label được hưởng", labelEn: "Your label keeps",
                     value: a.labelCut, note: "phần của bạn trong kỳ này", noteEn: "your share this period", kind: "final" });
      } else {
        const me = ARTISTS[partyId];
        chain.push({ key: "cut", label: me.labelId >= 0 ? "Phần label được hưởng" : "Phần Haustek theo hợp đồng độc lập",
                     labelEn: me.labelId >= 0 ? "Your label’s share" : "Haustek’s additional share",
                     value: -a.labelCut,
                     note: me.labelId >= 0 ? LABELS[me.labelId].name : "theo hợp đồng nghệ sĩ độc lập của bạn",
                     noteEn: me.labelId >= 0 ? LABELS[me.labelId].name : "per your independent agreement", kind: "out" });
        if (a.producer > 0.005)
          chain.push({ key: "producer", label: "Điểm producer", labelEn: "Producer points", value: -a.producer,
                       note: "khấu trừ vào phần của bạn, không cộng thêm lên doanh thu gộp",
                       noteEn: "taken off your share, not added on top", kind: "out" });
        if (advLeft > 0 || (payoutRow && payoutRow.recoup > 0)) {
          /* Thu hồi tạm ứng chạy ở cấp BÊN NHẬN — gộp cả doanh thu bản ghi
             lẫn tác quyền lẫn phần dồn từ kỳ trước. Nhưng chuỗi này chỉ nói
             về MỘT dòng tiền, nên phải lấy đúng phần thu hồi rơi vào dòng
             tiền đó, chia theo tỷ lệ đóng góp. Bê nguyên con số cấp bên nhận
             xuống đây là để tiền tác quyền chui vào cột bản ghi, và chuỗi
             cộng lại không ra dòng cuối — đúng cái mà cả khối này sinh ra để
             trả lời. */
          const recAll = payoutRow ? payoutRow.recoup : Math.min(advLeft, a.artist);
          const earnedAll = payoutRow ? payoutRow.earned : a.artist;
          const phan = earnedAll > 0 ? Math.min(a.artist / earnedAll, 1) : 1;
          const rec = Math.min(cents(recAll * phan), a.artist);
          const conNo = payoutRow ? payoutRow.advanceLeft : Math.max(advLeft - recAll, 0);
          const camCaHai = payoutRow && payoutRow.earned > a.artist + 0.005;
          chain.push({ key: "recoup", label: "Khấu trừ tạm ứng", labelEn: "Offset against your advance", value: -rec,
                       note: "số đã tạm ứng " + fmt.usd0(advOpening) + " · còn phải khấu trừ " + fmt.usd0(conNo)
                           + (camCaHai ? " · tạm ứng được khấu trừ trên cả bản ghi lẫn tác quyền, đây là phần thuộc dòng tiền này" : ""),
                       noteEn: fmt.usd0(advOpening) + " advanced · " + fmt.usd0(conNo) + " still to recover"
                           + (camCaHai ? " · recoupment covers recording and publishing together; this is the part falling on this stream" : ""),
                       kind: "out" });
          chain.push({ key: "final", label: "Thu nhập kỳ này", labelEn: "Yours this period", value: cents(a.artist - rec),
                       note: conNo <= 0 ? "đã khấu trừ hết khoản tạm ứng" : "đang khấu trừ dần khoản tạm ứng",
                       noteEn: conNo <= 0 ? "your advance is now fully recovered" : "still being offset against your advance",
                       kind: "final" });
        } else {
          chain.push({ key: "final", label: "Thu nhập của bạn", labelEn: "Yours", value: a.artist,
                       note: "số tiền của kỳ này", noteEn: "the amount for this period", kind: "final" });
        }
      }
    } else {
      const net = cents(a.gross - a.fee);
      chain.push({ key: "gross", label: "Tác quyền thu được", labelEn: "Publishing collected", value: a.gross,
                   note: "từ VCPMC, The MLC và các tổ chức khác",
                   noteEn: "from VCPMC, The MLC and other societies", kind: "top" });
      chain.push({ key: "fee", label: "Phí quản lý", labelEn: "Administration fee", value: -a.fee,
                   note: fmt.pct(CFG.PUB_FEE), noteEn: fmt.pct(CFG.PUB_FEE), kind: "out" });
      if (net - a.total > 0.005)
        chain.push({ key: "co", label: "Phần đồng tác giả", labelEn: "Co-writers’ shares", value: -cents(net - a.total),
                     note: "theo phần sáng tác đã đăng ký", noteEn: "per the registered writer splits", kind: "out" });
      chain.push({ key: "final", label: "Thu nhập của bạn", labelEn: "Yours", value: a.total,
                   note: "số tiền của kỳ này", noteEn: "the amount for this period", kind: "final" });
    }

    /* Kỳ trống vì hai lý do rất khác nhau: chưa có báo cáo về (tác quyền
       theo quý), hay có báo cáo mà bài của người này không phát sinh gì.
       Nói nhầm lý do là làm người ta hoang mang vô cớ. */
    let emptyReason = null, emptyReasonEn = null, nextPub = null;
    if (a.gross <= 0) {
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
      total: a.total, gross: a.gross, streams: a.streams, tracks: a.tracks,
      prevTotal: prev ? prev.total : null, prevStreams: prev ? prev.streams : null,
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
      haustekFee: CFG.HAUSTEK_FEE, pubFee: CFG.PUB_FEE,
      artistShare: cur, counterpartShare: cents(1 - cur),
      effectiveFrom: row ? PERIODS[pIndexOf(row.from)].label : null,
      basis: row ? (row.note || null) : null,
      history: sched.map(r => ({ from: PERIODS[pIndexOf(r.from)].label, artistShare: r.rate, note: r.note || null })),
      producerTracks,
      hasAdvance: !!(state.advances[partyKey] && state.advances[partyKey].opening > 0),
      payoutThreshold: CFG.PAYOUT_MIN,
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
      if (!o) { o = { artistId: a, name: ARTISTS[a].name, clientId: ARTISTS[a].clientId, tracks: 0, streams: 0, gross: 0, artist: 0, labelCut: 0, producer: 0 }; per.set(a, o); }
      o.tracks++; o.streams += recStreams[i * P + p]; o.gross += g; o.artist += sp.artist; o.labelCut += sp.labelCut; o.producer += sp.producer;
    }
    const rows = [...per.values()].map(o => Object.assign(o, { gross: cents(o.gross), artist: cents(o.artist), labelCut: cents(o.labelCut), producer: cents(o.producer) }))
      .sort((a, b) => b.gross - a.gross);
    const idle = [];
    ARTISTS.forEach(a => { if (a.labelId === partyId && !per.has(a.id)) idle.push({ artistId: a.id, name: a.name, clientId: a.clientId, tracks: idxOf(byArtist, a.id).length, streams: 0, gross: 0, artist: 0, labelCut: 0, producer: 0 }); });
    const total = rows.reduce((t, r) => ({ gross: t.gross + r.gross, artist: t.artist + r.artist, labelCut: t.labelCut + r.labelCut, producer: t.producer + r.producer, streams: t.streams + r.streams }), { gross: 0, artist: 0, labelCut: 0, producer: 0, streams: 0 });
    return scrub({ periodKey, rows: rows.concat(idle), earning: rows.length, count: rows.length + idle.length,
      total: { gross: cents(total.gross), artist: cents(total.artist), labelCut: cents(total.labelCut), producer: cents(total.producer), streams: total.streams } });
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
        gross: cents(g),
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
      gross: cents(g), mine: m,
      byStore, byTerritory: mk(TERR, byTerr), steps: []
    };
    if (stream === "rec") {
      const s = splitRec(i, g, periodKey);
      out.steps = [
        { label: "Doanh thu gộp", labelEn: "Gross revenue", value: s.gross },
        { label: "Phí dịch vụ Haustek", labelEn: "Haustek fee", value: -s.fee },
        { label: tLabel[i] >= 0 ? "Phần label được hưởng" : "Phần Haustek theo hợp đồng độc lập",
          labelEn: tLabel[i] >= 0 ? "Label’s share" : "Haustek’s additional share", value: -s.labelCut }
      ];
      if (s.producer > 0.004) out.steps.push({ label: "Điểm producer", labelEn: "Producer points", value: -s.producer });
      out.steps.push({ label: role === "label" ? "Thu nhập của nghệ sĩ" : "Thu nhập của bạn",
                       labelEn: role === "label" ? "To the artist" : "Yours", value: s.artist, strong: true });
      if (role === "label") out.steps = [
        { label: "Doanh thu gộp", labelEn: "Gross revenue", value: s.gross },
        { label: "Phí dịch vụ Haustek", labelEn: "Haustek fee", value: -s.fee },
        { label: "Thanh toán cho nghệ sĩ", labelEn: "Paid to the artist", value: -cents(s.artist + s.producer) },
        { label: "Phần label được hưởng", labelEn: "Label keeps", value: s.labelCut, strong: true }
      ];
    } else {
      const share = writerShare(i, partyId);
      out.steps = [
        { label: "Tác quyền thu được", labelEn: "Publishing collected", value: cents(g) },
        { label: "Phí quản lý", labelEn: "Administration fee", value: -cents(g * CFG.PUB_FEE) },
        { label: "Phần sáng tác của bạn", labelEn: "Your writer share", value: null, text: fmt.pct(share) },
        { label: "Thu nhập của bạn", labelEn: "Yours", value: m, strong: true }
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
