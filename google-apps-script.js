/**
 * ============================================================================
 * HAUSTEK — CẦU NỐI METADATA → GOOGLE SHEETS
 * ============================================================================
 *
 * File này KHÔNG chạy trên website. Bạn dán nó vào Google Apps Script,
 * gắn với một Google Sheet, rồi lấy link về dán vào metadata.html.
 *
 * ---------------------------------------------------------------------------
 * CÁCH CÀI — làm một lần, khoảng 10 phút
 * ---------------------------------------------------------------------------
 *
 * BƯỚC 1 — Tạo Google Sheet
 *   Vào sheets.new, đặt tên "Haustek — Metadata Submissions".
 *   KHÔNG cần tự tạo tab hay tiêu đề cột, script tự tạo hết ở lần chạy đầu.
 *   Nhìn lên thanh địa chỉ, copy đoạn ID nằm giữa /d/ và /edit:
 *   docs.google.com/spreadsheets/d/[ĐÂY_LÀ_ID_CẦN_COPY]/edit
 *
 * BƯỚC 2 — Dán script
 *   Trong Sheet đó: menu Tiện ích mở rộng → Apps Script.
 *   Xoá hết code mẫu, dán toàn bộ file này vào.
 *   Sửa 2 dòng CẤU HÌNH ngay bên dưới (SHEET_ID và NOTIFY_EMAIL).
 *   Bấm biểu tượng đĩa mềm để lưu.
 *
 * BƯỚC 3 — Xuất bản
 *   Bấm nút "Triển khai" (Deploy) góc trên phải → "Tạo bản triển khai mới".
 *   Chọn loại: "Ứng dụng web" (Web app).
 *   Thực thi với tư cách: "Tôi" (Me).
 *   Người có quyền truy cập: "Bất kỳ ai" (Anyone) — bắt buộc chọn cái này,
 *     nếu chọn "Bất kỳ ai có tài khoản Google" thì form sẽ không gửi được.
 *   Bấm Triển khai. Google sẽ hỏi cấp quyền — chọn tài khoản, bấm
 *     "Nâng cao" → "Chuyển đến ... (không an toàn)" → Cho phép.
 *     (Cảnh báo này là bình thường vì script do chính bạn viết, chưa qua Google duyệt.)
 *   Copy "URL ứng dụng web" hiện ra, dạng:
 *     https://script.google.com/macros/s/AKfycb....../exec
 *
 * BƯỚC 4 — Gắn vào website
 *   Mở metadata.html, tìm dòng gần cuối file:
 *       const ENDPOINT = "";
 *   Dán URL vừa copy vào giữa hai dấu nháy:
 *       const ENDPOINT = "https://script.google.com/macros/s/AKfycb....../exec";
 *   Lưu, upload lại. Xong.
 *
 * BƯỚC 5 — Kiểm tra
 *   Mở metadata.html, điền đại một hồ sơ thử, bấm "Kiểm tra & xuất hồ sơ".
 *   Mở Google Sheet ra xem, phải thấy 3 tab với dữ liệu vừa gửi.
 *
 * ---------------------------------------------------------------------------
 * LƯU Ý KHI SỬA VỀ SAU
 * ---------------------------------------------------------------------------
 * Mỗi lần sửa code này, phải Deploy lại thì thay đổi mới có hiệu lực.
 * Chọn "Quản lý bản triển khai" → biểu tượng bút chì → Phiên bản: "Phiên bản mới"
 * → Triển khai. Làm cách này thì URL giữ nguyên, không phải sửa lại website.
 * ============================================================================
 */

/* ======================= CẤU HÌNH — SỬA 2 DÒNG NÀY ======================= */

const SHEET_ID     = 'DÁN_ID_GOOGLE_SHEET_VÀO_ĐÂY';
const NOTIFY_EMAIL = 'mgmt@haustek-group.com';   // để trống '' nếu không muốn nhận mail báo

/* ======================= CẤU TRÚC 3 TAB ======================= */

const TABS = {
  releases: {
    name: 'Releases',
    headers: ['submission_id','thoi_diem_gui','trang_thai','nguoi_khai','vai_tro','dien_thoai','email',
      'gio_tien_goi','mang_xa_hoi','lien_he_du_phong',
      'loai_phat_hanh','ten_ban_phat_hanh','phien_ban','nhan_phat_hanh','nghe_si_chinh',
      'nghe_si_khach_moi','spotify_artist','apple_artist','the_loai_chinh','the_loai_phu',
      'ngon_ngu_metadata','ngay_phat_hanh','ngay_pre_save','upc','lanh_tho','p_line','c_line',
      'link_anh_bia','so_track','ghi_chu']
  },
  tracks: {
    name: 'Tracks',
    headers: ['submission_id','so_thu_tu','ten_track','phien_ban','nghe_si_chinh','khach_moi',
      'remixer','isrc','ngon_ngu_loi','noi_dung_nhay_cam','link_wav','preview_bat_dau',
      'nha_san_xuat','xuat_ban_pro','sample_cover','thong_tin_goc','tong_ti_le','loi_bai_hat']
  },
  // Tab này là quan trọng nhất về lâu dài: nó chính là bảng chia tiền publishing.
  // Sau này khi dựng Supabase, bạn import thẳng tab này vào bảng splits.
  splits: {
    name: 'Splits',
    headers: ['submission_id','so_thu_tu','ten_track','ho_ten','vai_tro','ti_le_phan_tram']
  }
};

/* ======================= XỬ LÝ CHÍNH ======================= */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Khoá 20 giây để hai người gửi cùng lúc không ghi đè lên nhau
    lock.waitLock(20000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'Không nhận được dữ liệu.' });
    }

    const data = JSON.parse(e.postData.contents);
    const rel = data.release || {};
    const tracks = data.tracks || [];
    const sub = data.submitter || {};

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const subId = makeId(rel.nghe_si_chinh, rel.ten_ban_phat_hanh);
    const now = new Date();

    // --- tab Releases: 1 dòng ---
    sheetOf(ss, TABS.releases).appendRow([
      subId, now, 'Mới nhận', sub.nguoi_khai || '', sub.vai_tro || '', sub.dien_thoai || '',
      sub.email || '', sub.gio_tien_goi || '', sub.mang_xa_hoi || '', sub.lien_he_du_phong || '',
      rel.loai_phat_hanh || '', rel.ten_ban_phat_hanh || '', rel.phien_ban || '',
      rel.nhan_phat_hanh || '', rel.nghe_si_chinh || '', rel.nghe_si_khach_moi || '',
      rel.spotify_artist || '', rel.apple_artist || '', rel.the_loai_chinh || '',
      rel.the_loai_phu || '', rel.ngon_ngu_metadata || '', rel.ngay_phat_hanh || '',
      rel.ngay_pre_save || '', asText(rel.upc), rel.lanh_tho || '', rel.p_line || '',
      rel.c_line || '', rel.link_anh_bia || '', tracks.length, rel.ghi_chu || ''
    ]);

    // --- tab Tracks: mỗi track 1 dòng ---
    const trackRows = tracks.map(function (t) {
      return [
        subId, t.so_thu_tu, t.ten_track || '', t.phien_ban || '', t.nghe_si_chinh || '',
        t.khach_moi || '', t.remixer || '', asText(t.isrc), t.ngon_ngu_loi || '',
        t.noi_dung_nhay_cam || '', t.link_wav || '', t.preview_bat_dau || '',
        t.nha_san_xuat || '', t.xuat_ban_pro || '', t.sample_cover || '',
        t.thong_tin_goc || '', t.tong_ti_le || 0, t.loi_bai_hat || ''
      ];
    });
    if (trackRows.length) appendRows(sheetOf(ss, TABS.tracks), trackRows);

    // --- tab Splits: mỗi người sáng tác của mỗi track 1 dòng ---
    const splitRows = [];
    tracks.forEach(function (t) {
      (t.nguoi_sang_tac || []).forEach(function (w) {
        splitRows.push([subId, t.so_thu_tu, t.ten_track || '', w.ho_ten || '', w.vai_tro || '', w.ti_le || 0]);
      });
    });
    if (splitRows.length) appendRows(sheetOf(ss, TABS.splits), splitRows);

    notify(subId, rel, tracks, sub);

    return jsonOut({ ok: true, submission_id: subId });

  } catch (err) {
    // Ghi lỗi lại để còn truy được, đừng để nó biến mất im lặng
    try {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let log = ss.getSheetByName('_Errors');
      if (!log) { log = ss.insertSheet('_Errors'); log.appendRow(['thoi_diem', 'loi', 'du_lieu_tho']); }
      log.appendRow([new Date(), String(err), e && e.postData ? String(e.postData.contents).slice(0, 5000) : '']);
    } catch (ignore) {}
    return jsonOut({ ok: false, error: String(err) });

  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

// Mở bằng trình duyệt để kiểm tra script còn sống không
function doGet() {
  return jsonOut({ ok: true, service: 'Haustek metadata intake', time: new Date().toISOString() });
}

/* ======================= HÀM PHỤ ======================= */

function sheetOf(ss, cfg) {
  let sh = ss.getSheetByName(cfg.name);
  if (!sh) {
    sh = ss.insertSheet(cfg.name);
    sh.appendRow(cfg.headers);
    sh.getRange(1, 1, 1, cfg.headers.length)
      .setFontWeight('bold')
      .setBackground('#1a1a22')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, Math.min(cfg.headers.length, 12));
  }
  return sh;
}

function appendRows(sh, rows) {
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

// Giữ UPC/ISRC ở dạng chữ, nếu không Sheets sẽ tự cắt số 0 đầu và biến thành số khoa học
function asText(v) {
  if (v === null || v === undefined || v === '') return '';
  return "'" + String(v);
}

function makeId(artist, title) {
  const d = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyMMdd-HHmm');
  const s = String(artist || 'HSTK').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'HSTK';
  return 'HSTK-' + d + '-' + s;
}

function notify(subId, rel, tracks, sub) {
  if (!NOTIFY_EMAIL) return;
  try {
    const list = tracks.map(function (t) {
      return '  ' + t.so_thu_tu + '. ' + (t.ten_track || '(chưa đặt tên)') +
             (t.phien_ban ? ' (' + t.phien_ban + ')' : '') + '\n     WAV: ' + (t.link_wav || '—');
    }).join('\n');

    const body =
      'Có hồ sơ metadata mới.\n\n' +
      'Mã hồ sơ:      ' + subId + '\n' +
      'Nghệ sĩ:       ' + (rel.nghe_si_chinh || '') + '\n' +
      'Bản phát hành: ' + (rel.ten_ban_phat_hanh || '') + ' (' + (rel.loai_phat_hanh || '') + ', ' + tracks.length + ' track)\n' +
      'Ngày mong muốn:' + (rel.ngay_phat_hanh || '') + '\n' +
      'Người khai:    ' + (sub.nguoi_khai || '') + ' (' + (sub.vai_tro || '') + ')\n' +
      'Điện thoại:    ' + (sub.dien_thoai || '') +
        (sub.gio_tien_goi ? '  — tiện gọi: ' + sub.gio_tien_goi : '') + '\n' +
      'Email:         ' + (sub.email || '') + '\n' +
      (sub.mang_xa_hoi ? 'Mạng xã hội:   ' + sub.mang_xa_hoi + '\n' : '') +
      (sub.lien_he_du_phong ? 'Dự phòng:      ' + sub.lien_he_du_phong + '\n' : '') +
      'Ảnh bìa:       ' + (rel.link_anh_bia || '') + '\n\n' +
      'Track:\n' + list + '\n\n' +
      (rel.ghi_chu ? 'Ghi chú: ' + rel.ghi_chu + '\n\n' : '') +
      'Xem đầy đủ trong Google Sheet:\n' +
      'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit\n';

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: '[METADATA] ' + (rel.nghe_si_chinh || '?') + ' — ' + (rel.ten_ban_phat_hanh || '?'),
      body: body,
      replyTo: sub.email || NOTIFY_EMAIL
    });
  } catch (err) {
    // Gửi mail hỏng thì kệ, dữ liệu đã vào Sheet rồi là được
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ======================= CHẠY THỬ ======================= */
/**
 * Chọn hàm testInsert ở thanh trên rồi bấm Chạy, để kiểm tra script ghi được
 * vào Sheet chưa mà không cần mở website.
 */
function testInsert() {
  const fake = {
    release: {
      loai_phat_hanh: 'Single', ten_ban_phat_hanh: 'Bản Thử Nghiệm', nhan_phat_hanh: 'Haustek',
      nghe_si_chinh: 'Test Artist', the_loai_chinh: 'Electronic', ngon_ngu_metadata: 'vi',
      ngay_phat_hanh: '2026-12-01', lanh_tho: 'Worldwide', p_line: '2026 Haustek',
      c_line: '2026 Haustek', link_anh_bia: 'https://example.com/art.jpg', ghi_chu: 'Dòng chạy thử.'
    },
    tracks: [{
      so_thu_tu: 1, ten_track: 'Track Thử', nghe_si_chinh: 'Test Artist',
      ngon_ngu_loi: 'vi', noi_dung_nhay_cam: 'No', link_wav: 'https://example.com/a.wav',
      sample_cover: 'No', tong_ti_le: 100,
      nguoi_sang_tac: [{ ho_ten: 'Nguyễn Văn A', vai_tro: 'Composer', ti_le: 100 }]
    }],
    submitter: { nguoi_khai: 'Nguyễn Văn A', email: 'test@example.com' }
  };
  const res = doPost({ postData: { contents: JSON.stringify(fake) } });
  Logger.log(res.getContent());
}
