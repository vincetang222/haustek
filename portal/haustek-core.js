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
   đó, HAUSTEK.admin biến mất khỏi trình duyệt khách. Mở dev tools cũng
   không lấy được. Đây là bản mô phỏng trong trình duyệt của nguyên tắc
   ở mục 5.1 tài liệu bàn giao: lọc và tổng hợp thuộc về máy chủ.

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
  VERSION:      "1.0.0",
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
   Không bao giờ được có mặt trong bất kỳ gói dữ liệu nào gửi cho khách.
   Giá trị dưới đây là chỗ giữ chỗ; điền tên thật khi triển khai. */
const DISTRIBUTOR = {
  code:      "DIST-1",
  name:      "Đối tác phân phối chính (tên thật điền khi triển khai)",
  grossRate: 0.86,             /* Haustek nhận 86% từ đối tác, phần còn lại là phí của họ */
  contact:   "nội bộ · không hiển thị cho khách"
};
/* Những chuỗi tuyệt đối không được lọt xuống trình duyệt khách.
   Hàm scrub() bên dưới sẽ ném lỗi nếu thấy chúng trong payload. */
const FORBIDDEN = [DISTRIBUTOR.name, DISTRIBUTOR.code, "grossRate", "distributor", "nhà phân phối"];

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
const FEEDS = [
  { id: 0, name: "Đơn vị phân phối chính", short: "Chính",   fmt: "CSV · 41 cột · hằng tháng, ngày 20",
    note: "Gộp toàn bộ cửa hàng trừ YouTube và TikTok" },
  { id: 1, name: "YouTube (mối riêng)",     short: "YouTube", fmt: "CSV nén · 3 file/kỳ · hằng tháng, ngày 25",
    note: "Tách Content ID và YouTube Music thành hai loại dòng" },
  { id: 2, name: "TikTok (mối riêng)",      short: "TikTok",  fmt: "XLSX · 1 sheet/lãnh thổ · hằng tháng, thất thường",
    note: "Về trễ nhất, hay thiếu lãnh thổ nhỏ" }
];
const PUB_FEED = { id: 9, name: "Tác quyền (các tổ chức quản lý)", short: "Tác quyền",
  fmt: "mỗi tổ chức một định dạng · theo quý", note: "VCPMC, The MLC, ASCAP… về trễ 1–2 quý" };

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
                 note: "Phụ lục hợp đồng ký 02.04.2026 — chỉ áp cho kỳ 04/2026 trở đi" });

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
    if (!s || s.v !== CFG.VERSION) throw new Error("Snapshot không đúng phiên bản " + CFG.VERSION);
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
          reason: broken < 0.34 ? "Thiếu mã ISRC" : broken < 0.67 ? "Mã ISRC không có trong danh mục" : "Mã của nhà phát hành khác",
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
    for (let i = 0; i < N && out.length < 40; i++) if (tIsrc[i].startsWith(stem)) push(i, 82, "Lệch 1 ký tự cuối mã ISRC");
  }
  for (let i = 0; i < N && out.length < 60; i++) {
    const t = norm(tTitle[i]);
    if (!t) continue;
    const a = norm(ARTISTS[tArtist[i]].name);
    if (t === nq && a === na) push(i, 90, "Trùng tên bài và tên nghệ sĩ");
    else if (t === nq) push(i, 62, "Trùng tên bài");
    else if (na && a === na && nq.includes(t)) push(i, 55, "Cùng nghệ sĩ · tên bài gần giống");
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
    if (state.approved[fromPeriodKey]) throw new Error("Kỳ " + fromPeriodKey + " đã duyệt — không đặt tỷ lệ hiệu lực vào kỳ đã chốt");
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
  if (key === "P:*") return "Điểm producer — chưa gắn danh tính";
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
function splitDim(trackIdx, total, weights) {
  const out = new Float64Array(weights.length);
  let sum = 0;
  for (let j = 0; j < weights.length; j++) {
    const jitter = 0.55 + hash(trackIdx, j) * 0.9;
    out[j] = weights[j] * jitter; sum += out[j];
  }
  for (let j = 0; j < weights.length; j++) out[j] = out[j] / sum * total;
  return out;
}

/* =====================================================================
   14. PHẠM VI & TỔNG HỢP
   ===================================================================== */
function scopeOf(role, partyId, stream) {
  if (role === "admin") return null;                         /* null = toàn danh mục */
  if (role === "label") return idxOf(byLabel, partyId);
  return stream === "pub" ? idxOf(byWriter, partyId) : idxOf(byArtist, partyId);
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
    { id: "feeds", ok: miss.length === 0, label: "Đã nạp đủ " + FEEDS.length + " luồng dữ liệu",
      detail: miss.length ? "Còn thiếu: " + miss.map(f => f.name).join(", ") : "Đủ cả " + FEEDS.length + " luồng" },
    { id: "recon", ok: unresolvedDiff.length === 0, label: "Đối chiếu khớp tới từng xu",
      detail: unresolvedDiff.length ? unresolvedDiff.map(x => x.feed.short + " lệch " + fmt.usd(x.diff)).join(" · ")
                                    : "Tổng hệ thống khớp tổng trên file gốc" },
    { id: "queue", ok: ratio <= CFG.BLACKBOX_CAP, label: "Tiền treo dưới " + (CFG.BLACKBOX_CAP * 100).toFixed(1) + "% doanh thu kỳ",
      detail: fmt.usd(pendingAmt) + " đang treo · " + (ratio * 100).toFixed(2) + "% doanh thu kỳ" },
    { id: "fx", ok: !!state.fx.locked[pk], label: "Đã chốt tỷ giá cho kỳ",
      detail: state.fx.locked[pk] ? "1 USD = " + fmt.num(state.fx.locked[pk].rate) + " ₫ · chốt " + state.fx.locked[pk].at
                                  : "Chưa chốt — số quy đổi sang VND sẽ trôi theo tỷ giá hôm nay" }
  ];
}
function canApprove(pIdx) { return approvalChecks(pIdx).every(c => c.ok); }

/* Kỳ phải đóng theo thứ tự. Phần tiền dưới ngưỡng chi trả được dồn từ kỳ
   này sang kỳ sau, và tạm ứng thu hồi dần qua từng kỳ — duyệt nhảy cóc thì
   hai chuỗi đó đứt, và không có cách nào phát hiện ra sau khi đã chi tiền. */
function approve(pIdx, by, note, force) {
  const pk = PERIODS[pIdx].k;
  if (state.approved[pk]) throw new Error("Kỳ " + pk + " đã duyệt rồi");
  const openBefore = PERIODS.slice(0, pIdx).filter(p => !state.approved[p.k]);
  if (openBefore.length)
    throw new Error("Phải duyệt xong kỳ trước đã: " + openBefore.map(p => p.label).join(", ")
      + " — tiền dồn và thu hồi tạm ứng chạy nối tiếp qua từng kỳ");
  const checks = approvalChecks(pIdx);
  const failed = checks.filter(c => !c.ok);
  if (failed.length && !force) throw new Error("Chưa đủ điều kiện duyệt: " + failed.map(c => c.label).join(" · "));
  state.approved[pk] = { at: nowISO(), by: by || "admin", note: note || "",
                         overrides: failed.map(c => c.id) };
  state.payouts[pk] = runPayout(pIdx);
  state.publishedAt = nowISO();
  audit.log("period.approve", "Duyệt kỳ " + PERIODS[pIdx].label + (failed.length ? " (bỏ qua: " + failed.map(c => c.label).join(", ") + ")" : ""));
  store.save();
  return state.payouts[pk];
}
function revoke(pIdx, why) {
  const pk = PERIODS[pIdx].k;
  if (!state.approved[pk]) return;
  const approvedAfter = PERIODS.slice(pIdx + 1).filter(p => state.approved[p.k]);
  if (approvedAfter.length)
    throw new Error("Phải thu hồi kỳ sau trước: " + approvedAfter.map(p => p.label).join(", ")
      + " — các kỳ sau đã tính dựa trên kết quả của kỳ này");
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
  audit.log("period.revoke", "Thu hồi duyệt kỳ " + PERIODS[pIdx].label + (why ? " · " + why : ""));
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
function runPayout(pIdx) {
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
    if (recoup > 0) {
      const adv = state.advances[key];
      adv.byPeriod = adv.byPeriod || {}; adv.byPeriod[pk] = recoup;
    }
    state.carry[key] = carryOut;
    rows.push({ partyKey: key, kind: key[0] === "L" ? "label" : "artist",
                earned: amount, carryIn, recoup, payable, carryOut,
                advanceLeft: cents(Math.max(bal - recoup, 0)) });
  });
  rows.sort((a, b) => b.payable - a.payable);
  if (producerHeld > 0) rows.push({
    partyKey: "P:*", kind: "producer", held: true,
    earned: producerHeld, carryIn: 0, recoup: 0, payable: 0, carryOut: producerHeld, advanceLeft: 0,
    note: "Chưa gắn được danh tính producer — danh mục chỉ có tên, chưa có mã"
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
  store.save();
}
seedAccounts();

const audit = {
  log(action, detail) {
    state.audit.unshift({ at: nowISO(), action, detail, by: "mgmt@haustek-group.com" });
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
    guess: "Bản mẫu đang giả định 1 nghệ sĩ = 1 Client ID, và bản ghi trỏ về đúng một nghệ sĩ chính." },
  { id: "q2", t: "ISRC (Optional 1) nghĩa là gì?",
    why: "Tên cột hàm ý sau này còn Optional 2. Nếu một bài mang hai mã (phát hành lại, đổi nhà phân phối) thì báo cáo về theo từng mã riêng và phải gộp lại, không thì một bài hiện thành hai dòng rời rạc.",
    guess: "Bản mẫu để mã phụ thành bảng riêng (mỗi bài 0..n mã), không thêm cột." },
  { id: "q3", t: "Rate Share một cột có đủ không?",
    why: "Nếu là 'phần khách vs phần Haustek' thì đủ. Nếu nghệ sĩ / producer / songwriter mỗi người một phần thì phải tách bảng chia phần, mỗi dòng một người.",
    guess: "Bản mẫu tách: tỷ lệ bên nhận chính nằm ở bảng có ngày hiệu lực, điểm producer là trường riêng trên bản ghi, phần sáng tác là bảng riêng." },
  { id: "q4", t: "Tính bằng tiền gì, quy đổi lúc nào?",
    why: "Chuẩn ngành là giữ tiền tệ gốc của từng nền tảng rồi quy đổi sang tiền chi trả. Cần chốt: quy sang VND hay giữ USD, dùng tỷ giá ngày nhận báo cáo, ngày chốt kỳ hay ngày chi trả.",
    guess: "Bản mẫu tính bằng USD, chốt một tỷ giá cho mỗi kỳ tại thời điểm duyệt kỳ, và khoá tỷ giá đó lại." },
  { id: "q5", t: "Album / Track / Composition có tách làm ba thực thể không?",
    why: "Hệ thống tham chiếu đang xài tách hẳn ba mục. Bản mẫu đang gộp track với composition — biết là sai nhưng phải chốt cùng lúc với schema.",
    guess: "Bản mẫu vẫn gộp track với composition, chỉ tách phần sáng tác thành bảng chia phần." },
  { id: "q6", t: "Label có kiêm publisher không?",
    why: "Quyết định label có thấy tab tác quyền hay không.",
    guess: "Bản mẫu giả định KHÔNG — tác quyền thuộc người sáng tác, không đi qua label." }
];
const SAMPLES_NEEDED = [
  { id: "s1", t: "File mẫu master data 10–15 dòng",
    why: "Đã xoá hai cột Distribution và Rate Share. Cần thấy ĐỊNH DẠNG GIÁ TRỊ THẬT, không phải tên cột: ISRC viết hoa hay thường, ngày kiểu nào, Client ID có tiền tố gì, tên nghệ sĩ có dấu ra sao." },
  { id: "s2", t: "File báo cáo doanh thu mẫu của cả 3 luồng",
    why: "Che số tiền, giữ nguyên tên cột và 1–2 dòng. Cấu trúc ba file này quyết định toàn bộ thiết kế đường ống nạp — đây là phần khó nhất và cũng là phần không đoán được." }
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
    if (state.approved[pk]) throw new Error("Kỳ đã duyệt — tỷ giá đã khoá, không đổi được nữa");
    state.fx.locked[pk] = { rate: rate || state.fx.rate, at: nowISO().slice(0, 10) };
    audit.log("fx.lock", "Khoá tỷ giá kỳ " + PERIODS[pIdx].label + ": 1 USD = " + fmt.num(state.fx.locked[pk].rate) + " ₫");
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
  { k: "parse",     t: "Đọc file thô",              d: "Mỗi luồng một parser riêng — định dạng khác nhau hoàn toàn" },
  { k: "normalise", t: "Chuẩn hoá về một schema",    d: "Tên cột, đơn vị, kiểu ngày, cách viết tên cửa hàng" },
  { k: "match",     t: "Khớp ISRC với danh mục",     d: "Khâu dễ mất tiền nhất — dòng không khớp phải vào hàng chờ, không được bỏ im" },
  { k: "fxconv",    t: "Quy đổi tiền tệ",            d: "Theo tỷ giá đã chốt cho kỳ" },
  { k: "write",     t: "Ghi vào bảng thô",           d: "Đánh dấu rõ về từ luồng nào, kỳ nào" },
  { k: "rollup",    t: "Dựng lại bảng tổng hợp",     d: "rollup theo bản ghi × kỳ, thêm cửa hàng, thêm lãnh thổ, theo bên nhận" },
  { k: "flag",      t: "Đánh dấu đã nạp luồng",      d: "Để hệ thống biết kỳ nào còn thiếu gì" },
  { k: "notify",    t: "Báo cho người đối chiếu",    d: "Chưa duyệt kỳ thì khách chưa thấy gì" }
];
const ingest = {
  steps: INGEST_STEPS,
  load(pIdx, fId, opts) {
    const pk = PERIODS[pIdx].k;
    if (state.approved[pk]) throw new Error("Kỳ đã duyệt — muốn nạp lại phải thu hồi duyệt trước");
    const f = FEEDS.find(x => x.id === fId);
    const st = state.feeds[pk][fId];
    if (st.status === "loaded" && !(opts && opts.replace)) throw new Error("Luồng này đã nạp cho kỳ " + PERIODS[pIdx].label);
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
    audit.log("ingest.load", "Nạp " + f.name + " · kỳ " + PERIODS[pIdx].label + " · " + st.file + " · " + n + " dòng vào hàng chờ");
    store.save();
    return { added: n };
  },
  unload(pIdx, fId) {
    const pk = PERIODS[pIdx].k;
    if (state.approved[pk]) throw new Error("Kỳ đã duyệt — thu hồi duyệt trước đã");
    state.feeds[pk][fId] = { status: "missing", at: null, file: null, rows: 0, control: null };
    audit.log("ingest.unload", "Gỡ luồng " + FEEDS[fId].name + " khỏi kỳ " + PERIODS[pIdx].label);
    store.save();
  },
  loadPub(pIdx) {
    const pk = PERIODS[pIdx].k;
    state.pub[pk] = { status: "loaded", at: nowISO(), file: "cmo-" + pk + ".xlsx" };
    audit.log("ingest.pub", "Nạp báo cáo tác quyền kỳ " + PERIODS[pIdx].label);
    store.save();
  },
  acceptVariance(pIdx, fId, note) {
    const t = feedTotals(pIdx, fId);
    state.variance[PERIODS[pIdx].k + ":" + fId] = { amount: t.diff, note: note || "", at: nowISO() };
    audit.log("recon.accept", "Ghi nhận chênh lệch " + fmt.usd(t.diff) + " · " + FEEDS[fId].short + " kỳ " + PERIODS[pIdx].label + " · " + (note || "không ghi chú"));
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
    if (q.status !== "pending") throw new Error("Dòng này đã xử lý rồi");
    if (!(trackIdx >= 0 && trackIdx < N)) throw new Error("Bản ghi không hợp lệ");
    let p = pIndexOf(q.periodKey);
    let intoKey = null;
    if (state.approved[q.periodKey]) {
      const open = PERIODS.find(x => !state.approved[x.k]);
      if (!open) throw new Error("Kỳ của dòng này đã duyệt và không còn kỳ nào đang mở để ghi khoản truy thu — mở kỳ mới rồi khớp lại");
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
    audit.log("queue.park", q.id + " · để lại chờ đối tác xác nhận · " + (note || ""));
    store.save();
  },
  unpark(qid) {
    const q = state.queue.find(x => x.id === qid);
    if (!q) return;
    if (q.status === "matched") {
      /* Gỡ đúng ở kỳ đã ghi vào — với khoản truy thu thì đó không phải kỳ
         gốc của dòng. Gỡ nhầm kỳ là để lại tiền ma trong sổ. */
      const landed = q.intoPeriod || q.periodKey;
      if (state.approved[landed]) throw new Error("Khoản này đã nằm trong kỳ " + landed + " và kỳ đó đã duyệt — thu hồi duyệt kỳ đó trước");
      const p = pIndexOf(landed);
      const key = q.resolvedTo + ":" + p + ":" + q.feedId;
      state.match[key] = cents((state.match[key] || 0) - q.amount);
      if (state.match[key] <= 0.004) delete state.match[key];
      rebuildMatchIndex();
    }
    q.status = "pending"; q.resolvedTo = null; q.at = null; q.intoPeriod = null;
    audit.log("queue.unpark", q.id + " · trả lại hàng chờ");
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
  distributor: DISTRIBUTOR,
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
  idxOf, byArtist, byLabel, byWriter,
  feedLoaded, loadedFeedIds, missingFeeds, pubLoaded,
  recon, feedTotals, approvalChecks, canApprove, approve, revoke,
  runPayout, earnedByParty, advanceBalance,
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
      if (role !== "admin" && !partyKey) throw new Error("Tài khoản label hoặc nghệ sĩ phải gắn với một mã bên nhận");
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
  else throw new Error("Vai trò không hợp lệ ở cổng khách");
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
  if (pi < 0 || !state.approved[periodKey]) throw new Error("Kỳ này chưa mở — chưa duyệt xong");
  return pi;
}

const api = {
  /* đọc lại quyết định mới nhất của admin (khi intranet vừa duyệt xong) */
  refresh() { const s = store.load(); if (s) { state = s; invalidateRates(); rebuildMatchIndex(); } return !!s; },

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
                 kind: isL ? "label" : (who.labelId >= 0 ? "artist-label" : "artist-indie") };
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
      independent: isLabel ? false : me.labelId < 0,
      hasRecording: recCount > 0,
      /* Tác quyền thuộc người sáng tác, không đi qua label — mục 2.3 */
      hasPublishing: !isLabel && pubCount > 0,
      trackCount: recCount, compositionCount: pubCount,
      currency: "USD", fxNote: "Số liệu tính bằng USD · tỷ giá quy đổi chốt tại thời điểm duyệt kỳ"
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
    if (stream === "pub" && role === "label") throw new Error("Tác quyền không đi qua label");
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
      chain.push({ key: "gross", label: role === "label" ? "Doanh thu gộp nghệ sĩ trong label" : "Doanh thu gộp bài của bạn",
                   value: a.gross, note: "trước mọi khoản trừ", kind: "top" });
      chain.push({ key: "fee", label: "Phí Haustek", value: -a.fee,
                   note: fmt.pct(CFG.HAUSTEK_FEE) + " doanh thu gộp · theo hợp đồng", kind: "out" });
      if (role === "label") {
        chain.push({ key: "artist", label: "Trả cho nghệ sĩ", value: -cents(a.artist + a.producer),
                     note: "theo tỷ lệ bạn đặt, tính theo tỷ lệ có hiệu lực trong kỳ", kind: "out" });
        chain.push({ key: "final", label: "Label giữ lại", value: a.labelCut, note: "phần của bạn kỳ này", kind: "final" });
      } else {
        const me = ARTISTS[partyId];
        chain.push({ key: "cut", label: me.labelId >= 0 ? "Phần label giữ" : "Phần Haustek giữ thêm",
                     value: -a.labelCut,
                     note: me.labelId >= 0 ? LABELS[me.labelId].name : "theo hợp đồng độc lập", kind: "out" });
        if (a.producer > 0.005)
          chain.push({ key: "producer", label: "Điểm producer", value: -a.producer,
                       note: "trừ vào phần của bạn, không cộng thêm bên trên", kind: "out" });
        if (advLeft > 0 || (payoutRow && payoutRow.recoup > 0)) {
          const rec = payoutRow ? payoutRow.recoup : Math.min(advLeft, a.artist);
          chain.push({ key: "recoup", label: "Trừ vào khoản tạm ứng", value: -rec,
                       note: "đã ứng " + fmt.usd0(advOpening) + " · còn phải thu hồi " + fmt.usd0(payoutRow ? payoutRow.advanceLeft : Math.max(advLeft - rec, 0)), kind: "out" });
          chain.push({ key: "final", label: "Thực nhận kỳ này", value: payoutRow ? cents(payoutRow.payable + payoutRow.carryOut) : cents(a.artist - rec),
                       note: (payoutRow && payoutRow.advanceLeft <= 0) ? "đã thu hồi xong khoản tạm ứng" : "đang trừ dần vào khoản tạm ứng", kind: "final" });
        } else {
          chain.push({ key: "final", label: "Về tay bạn", value: a.artist, note: "số tiền kỳ này", kind: "final" });
        }
      }
    } else {
      const net = cents(a.gross - a.fee);
      chain.push({ key: "gross", label: "Tác quyền thu được", value: a.gross, note: "từ VCPMC, The MLC và các tổ chức khác", kind: "top" });
      chain.push({ key: "fee", label: "Phí quản lý", value: -a.fee, note: fmt.pct(CFG.PUB_FEE), kind: "out" });
      if (net - a.total > 0.005)
        chain.push({ key: "co", label: "Phần đồng tác giả", value: -cents(net - a.total), note: "theo phần sáng tác đã đăng ký", kind: "out" });
      chain.push({ key: "final", label: "Về tay bạn", value: a.total, note: "số tiền kỳ này", kind: "final" });
    }

    /* Kỳ trống vì hai lý do rất khác nhau: chưa có báo cáo về (tác quyền
       theo quý), hay có báo cáo mà bài của người này không phát sinh gì.
       Nói nhầm lý do là làm người ta hoang mang vô cớ. */
    let emptyReason = null, nextPub = null;
    if (a.gross <= 0) {
      if (stream === "pub") {
        if (!pubLoaded(p)) {
          emptyReason = "Tác quyền về theo quý, không phải hằng tháng — kỳ này chưa có tổ chức nào báo cáo.";
          const withPub = PERIODS.filter(x => state.approved[x.k] && pubLoaded(x.idx));
          const before = withPub.filter(x => x.idx < p).pop() || withPub[withPub.length - 1];
          nextPub = before ? { k: before.k, label: before.label } : null;
        } else emptyReason = "Kỳ này có báo cáo tác quyền, nhưng chưa bài nào của bạn phát sinh.";
      } else {
        emptyReason = "Kỳ này chưa bài nào của bạn phát sinh doanh thu.";
      }
    }
    return scrub({
      periodKey, stream, emptyReason, nextPub,
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
      payout: payoutRow ? { payable: payoutRow.payable, carryOut: payoutRow.carryOut,
        threshold: CFG.PAYOUT_MIN,
        note: payoutRow.payable > 0 ? "sẽ chi trong kỳ chi trả tới"
          : (payoutRow.carryOut > 0 ? "dưới ngưỡng " + fmt.usd0(CFG.PAYOUT_MIN) + " — dồn sang kỳ sau" : "") } : null,
      approvedAt: state.approved[periodKey].at
    });
  },

  trend(role, partyId, stream) {
    assertParty(role, partyId);
    stream = stream === "pub" ? "pub" : "rec";
    return scrub({ points: PERIODS.map(p => state.approved[p.k]
      ? { k: p.k, label: p.label, value: agg(role, partyId, p.idx, stream).total, open: true }
      : { k: p.k, label: p.label, value: null, open: false }) });
  },

  breakdown(role, partyId, periodKey, stream, dim, opts) {
    assertParty(role, partyId);
    const p = requireApproved(periodKey);
    stream = stream === "pub" ? "pub" : "rec";
    if (stream === "pub" && role === "label") throw new Error("Tác quyền không đi qua label");
    const isTerr = dim === "terr";
    /* Khách chỉ thấy tên CỬA HÀNG — thứ họ vốn đã biết. Không có tên đơn
       vị phân phối, không có "luồng dữ liệu" nào ở đây: đó là chuyện vận
       hành nội bộ của Haustek. */
    const names = isTerr ? TERR : (stream === "rec" ? STORES : PUBSRC);
    const wts   = isTerr ? TERR_W : (stream === "rec" ? STORE_W : PUBSRC_W);
    const acc = new Float64Array(names.length);
    const sc = scopeOf(role, partyId, stream), n = sc ? sc.length : 0;
    const cap = Math.min(n, 9000), step = Math.max(1, Math.floor(n / cap));
    let scale = 0;
    for (let k = 0; k < n; k += step) {
      const i = sc[k];
      const m = mineOf(i, p, role, partyId, stream);
      if (m <= 0) continue;
      scale += m;
      const parts = splitDim(i, m, wts);
      for (let j = 0; j < names.length; j++) acc[j] += parts[j];
    }
    const total = agg(role, partyId, p, stream).total;
    const norm = scale > 0 ? total / scale : 0;
    let list = names.map((s, j) => ({ name: s, value: cents(acc[j] * norm) })).filter(x => x.value > 0.004);
    list.sort((a, b) => b.value - a.value);
    const topN = (!isTerr && stream === "rec") ? N_TOP : list.length;
    const head = list.slice(0, topN);
    const tail = list.slice(topN);
    return scrub({
      dim, rows: (opts && opts.all) ? list.slice(0, 40) : head,
      tail: (opts && opts.all) ? null : (tail.length ? { count: tail.length, value: cents(tail.reduce((s, x) => s + x.value, 0)) } : null),
      totalStores: list.length
    });
  },

  tracks(role, partyId, periodKey, stream, opts) {
    assertParty(role, partyId);
    const p = requireApproved(periodKey);
    stream = stream === "pub" ? "pub" : "rec";
    if (stream === "pub" && role === "label") throw new Error("Tác quyền không đi qua label");
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
    const i = +trackId;
    /* kiểm tra quyền lần nữa ở đây, không tin giao diện đã lọc đúng */
    if (!inScope(role, partyId, stream, i)) throw new Error("Bản ghi này không thuộc phạm vi của bạn");
    const g = grossOf(i, p, stream);
    const m = mineOf(i, p, role, partyId, stream);
    const names = stream === "rec" ? STORES : PUBSRC, wts = stream === "rec" ? STORE_W : PUBSRC_W;
    const bySrc = splitDim(i, m, wts), byTerr = splitDim(i, m, TERR_W);
    const mk = (ns, vs) => ns.map((nm, j) => ({ name: nm, value: cents(vs[j]) }))
      .sort((a, b) => b.value - a.value).slice(0, 8).filter(x => x.value > 0.004);
    const out = {
      id: i, title: tTitle[i], isrc: tIsrc[i], type: TYPES[tType[i]],
      artist: ARTISTS[tArtist[i]].name,
      streams: stream === "rec" ? recStreams[i * P + p] : null,
      gross: cents(g), mine: m,
      byStore: mk(names, bySrc), byTerritory: mk(TERR, byTerr), steps: []
    };
    if (stream === "rec") {
      const s = splitRec(i, g, periodKey);
      out.steps = [
        { label: "Doanh thu gộp", value: s.gross },
        { label: "Phí Haustek", value: -s.fee },
        { label: tLabel[i] >= 0 ? "Label giữ" : "Haustek giữ thêm", value: -s.labelCut }
      ];
      if (s.producer > 0.004) out.steps.push({ label: "Điểm producer", value: -s.producer });
      out.steps.push({ label: role === "label" ? "Về tay nghệ sĩ" : "Về tay bạn", value: s.artist, strong: true });
      if (role === "label") out.steps = [
        { label: "Doanh thu gộp", value: s.gross },
        { label: "Phí Haustek", value: -s.fee },
        { label: "Trả cho nghệ sĩ", value: -cents(s.artist + s.producer) },
        { label: "Label giữ", value: s.labelCut, strong: true }
      ];
    } else {
      const share = writerShare(i, partyId);
      out.steps = [
        { label: "Tác quyền thu được", value: cents(g) },
        { label: "Phí quản lý", value: -cents(g * CFG.PUB_FEE) },
        { label: "Phần sáng tác của bạn", value: null, text: fmt.pct(share) },
        { label: "Về tay bạn", value: m, strong: true }
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
    throw new Error("Màn hình phải có id và hàm render(root, ctx)");
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
      approve(pi, "ops@haustek-group.com", "Đối chiếu xong, đã duyệt");
    } catch (e) { console.warn("[haustek-core] không duyệt được kỳ " + PERIODS[pi].label + ": " + e.message); }
  }
  /* Những lần nạp trong lịch sử cũng phải để lại dấu vết, không thì mở
     nhật ký ra thấy trống trơn và tưởng hệ thống không ghi gì. */
  PERIODS.forEach((p, pi) => {
    FEEDS.forEach(f => {
      const st = state.feeds[p.k][f.id];
      if (st.status !== "loaded") return;
      state.audit.push({ at: String(st.at).replace("T", " "), action: "ingest.load",
        by: "ops@haustek-group.com",
        detail: "Nạp " + f.name + " · kỳ " + p.label + " · " + st.file });
    });
    const pb = state.pub[p.k];
    if (pb && pb.status === "loaded")
      state.audit.push({ at: String(pb.at).replace("T", " "), action: "ingest.pub",
        by: "ops@haustek-group.com", detail: "Nạp báo cáo tác quyền quý " + p.quarter + "/" + p.year + " · " + pb.file });
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
     phân phối, cả tỷ lệ gốc. Mở dev tools cũng không lấy được.
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
  + fmt.num(N) + " bản ghi · " + fmt.num(N * P * 3) + " ô doanh thu theo luồng");

})(window);
