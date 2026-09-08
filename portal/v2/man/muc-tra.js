/* =====================================================================
   NỘI BỘ · MỨC TRẢ NỀN TẢNG
   ---------------------------------------------------------------------
   Dự báo doanh thu = lượt nghe theo ngày × mức trả (USD gộp / 1.000 lượt)
   của từng nền tảng. Mặc định mức trả suy từ báo cáo ba kỳ đã xét duyệt
   gần nhất; dữ liệu mẫu đã hiệu chỉnh về thị trường Việt Nam (Spotify ≈
   1,6 · Apple Music ≈ 3,2 · YouTube Music ≈ 0,75 · Zing MP3 ≈ 0,4 · TikTok
   ≈ 0,35). Khi Haustek có số thật từ báo cáo nền tảng, nhập ở đây — ghi
   đè theo tên nền tảng, có ngày và người nhập — dự báo hai cổng, mức trả
   trong ngăn hồ sơ và giải thích số đổi theo ngay. Dán CSV để nhập nhanh.
   ===================================================================== */
"use strict";
(function () {

HT.dangKy({
  id: 'muc-tra', nav: 'navMucTra', nhom: 'nhomTien', icon: 'cash',

  chu: {
    vi: {
      navMucTra: 'Mức trả nền tảng', h1: 'Mức trả nền tảng',
      mo: 'Hai mức cho mỗi nền tảng: nền tảng trả về Haustek, và Haustek trả đối tác. Chênh lệch là biên. Trang này chỉ Level 1–2 mở được.',
      mat: 'Tuyệt mật', matMo: 'Biên của Haustek trên từng nền tảng nằm ở đây. Đối tác không bao giờ thấy hai cột bên phải, kể cả qua gói dữ liệu của cổng.',
      cKhach: 'Trả đối tác', cBien: 'Biên Haustek', lKhach: 'Mức trả đối tác (USD / 1.000)', kBien: 'Biên trung bình', kBienS: 'trên {n} nền tảng đã đặt hai mức',
      kTron: 'Mức trả trộn', kTronS: 'USD / 1.000 lượt, theo cơ cấu lượt nghe 3 kỳ', kGhiDe: 'Nền tảng đã nhập số thật', kGhiDeS: 'trong {n} nền tảng', kDuBao: 'Dự báo doanh thu kỳ mở', kDuBaoS: 'đổi theo mức trả ngay', kVn: 'Tham chiếu thị trường VN', kVnS: 'Spotify, USD / 1.000',
      cNt: 'Nền tảng', cSuy: 'Suy từ báo cáo', cVn: 'Tham chiếu VN', cDung: 'Đang dùng', cNguon: 'Nguồn', cNhap: 'Nhập số thật', cThaoTac: 'Thao tác',
      nguonSuy: 'báo cáo 3 kỳ', nguonNhap: 'nhập tay', luu: 'Lưu', bo: 'Bỏ ghi đè', daLuu: 'Đã lưu {n}: {v} USD / 1.000', daBo: 'Đã bỏ ghi đè {n}',
      dan: 'Dán CSV', danMo: 'Mỗi dòng: tên nền tảng, USD trên 1.000 lượt (nhận dấu phẩy, ; hoặc tab). Ví dụ: Spotify,1.52', nhap: 'Nhập', daNhap: 'Đã nhập {a} nền tảng, bỏ qua {b} dòng',
      soSanh: 'Suy từ báo cáo so với tham chiếu và số đang dùng', soSanhMo: 'USD / 1.000 lượt. Cột đỏ là nền tảng đang dùng số nhập tay.',
      ghiChu: 'Ghi chú (nguồn, kỳ báo cáo)', chua: 'chưa',
      note: 'Mức trả Việt Nam thấp hơn Âu–Mỹ 2–3 lần; nền tảng nội địa trả thấp nhất. Số ở đây là gộp về Haustek; đối tác thấy mức đã nhân tỷ lệ của họ.'
    },
    en: {
      navMucTra: 'Platform payout rates', h1: 'Platform payout rates',
      mo: 'Two rates per platform: what the platform pays Haustek, and what Haustek pays the partner. The gap is the margin. Level 1–2 only.',
      mat: 'Strictly confidential', matMo: 'Haustek’s per-platform margin lives here. Partners never see the two right-hand columns, not even through the portal’s data payloads.',
      cKhach: 'Paid to partner', cBien: 'Haustek margin', lKhach: 'Partner rate (USD / 1,000)', kBien: 'Average margin', kBienS: 'across {n} platforms with both rates set',
      kTron: 'Blended rate', kTronS: 'USD / 1,000 streams, weighted by 3-period stream mix', kGhiDe: 'Platforms with real figures', kGhiDeS: 'of {n} platforms', kDuBao: 'Open-period revenue forecast', kDuBaoS: 'moves with the rates', kVn: 'Vietnam market reference', kVnS: 'Spotify, USD / 1,000',
      cNt: 'Platform', cSuy: 'Derived from reports', cVn: 'VN reference', cDung: 'In use', cNguon: 'Source', cNhap: 'Enter real figure', cThaoTac: 'Actions',
      nguonSuy: '3-period reports', nguonNhap: 'entered', luu: 'Save', bo: 'Clear override', daLuu: 'Saved {n}: {v} USD / 1,000', daBo: 'Cleared override for {n}',
      dan: 'Paste CSV', danMo: 'One line per platform: name, USD per 1,000 (comma, ; or tab). Example: Spotify,1.52', nhap: 'Import', daNhap: 'Imported {a} platforms, skipped {b} lines',
      soSanh: 'Derived vs reference vs in use', soSanhMo: 'USD / 1,000 streams. Red bars are platforms using entered figures.',
      ghiChu: 'Note (source, report period)', chua: 'none',
      note: 'Vietnamese rates are 2–3× below Europe/US; domestic platforms pay least. Figures are gross to Haustek; partners see rates times their share.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, P = HB.dayMau();
    var rows = A.platformRatesFull(), ov = rows.filter(function (r) { return r.source === 'override'; }).length;
    var f = null; try { f = A.forecast(); } catch (e) { f = null; }
    var tron = f && f.byPlatform.length ? f.byPlatform.reduce(function (s, x) { return s + x.per1k * x.share; }, 0)
      : (rows.length ? rows.reduce(function (s, r) { return s + r.per1k; }, 0) / rows.length : 0);
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    var coHai = rows.filter(function (r) { return r.source === 'override' && r.bien > 0; });
    var bienTb = coHai.length ? coHai.reduce(function (a, r) { return a + r.bienPct; }, 0) / coHai.length : 0;
    html += HM.ghi({ kieu: 'warn', icon: 'alert', tieuDe: HM.esc(t('mat')), than: HM.esc(t('matMo')) });
    html += HM.so([
      { l: t('kTron'), v: HT.fmt.usd(tron), lon: true, s: t('kTronS') },
      { l: t('kBien'), v: bienTb ? HT.fmt.pct(bienTb) : '—', s: t('kBienS').replace('{n}', coHai.length), mau: bienTb ? HB.mau('ok') : '' },
      { l: t('kGhiDe'), v: HT.fmt.n(ov), s: t('kGhiDeS').replace('{n}', rows.length), mau: ov ? HB.mau('ok') : '' },
      f ? { l: t('kDuBao').replace('{k}', f.openPeriod), v: c.tien(f.projected.revenue), s: t('kDuBaoS') } : null,
      { l: t('kVn'), v: HT.fmt.usd(A.vnRef[0]), s: t('kVnS') }
    ].filter(Boolean));
    html += HM.the({ thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cNt')) + '</th><th class="num">' + HM.esc(t('cSuy')) + '</th><th class="num">' + HM.esc(t('cVn')) + '</th><th class="num">' + HM.esc(t('cDung')) + '</th><th class="num band">' + HM.esc(t('cKhach')) + '</th><th class="num">' + HM.esc(t('cBien')) + '</th><th>' + HM.esc(t('cNguon')) + '</th><th>' + HM.esc(t('cNhap')) + '</th><th>' + HM.esc(t('cThaoTac')) + '</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td>' + HM.tenBia({ ten: c.song(r, 'name'), seed: r.name, phu: r.source === 'override' && r.at ? HT.fmt.ngay(String(r.at).slice(0, 10)) + (r.note ? ' · ' + r.note : '') : '' }) + '</td>' +
            '<td class="num mono">' + HM.esc(HT.fmt.usd(r.derived)) + '</td><td class="num mono muted">' + (r.refVn != null ? HM.esc(HT.fmt.usd(r.refVn)) : '—') + '</td>' +
            '<td class="num mono"><b>' + HM.esc(HT.fmt.usd(r.per1k)) + '</b></td>' +
            '<td class="num band mono"><b>' + HM.esc(HT.fmt.usd(r.khach)) + '</b></td>' +
            '<td class="num mono">' + (r.bien > 0 ? '<span class="pos">' + HM.esc(HT.fmt.usd(r.bien)) + ' · ' + HM.esc(HT.fmt.pct(r.bienPct)) + '</span>' : '<span class="nil">—</span>') + '</td>' +
            '<td>' + HM.tag(r.source === 'override' ? t('nguonNhap') : t('nguonSuy'), r.source === 'override' ? 'ok' : '') + '</td>' +
            '<td><div class="bar" style="margin:0;gap:6px;flex-wrap:nowrap"><input class="in mono" type="number" step="0.0001" min="0.0001" max="99" style="width:86px" data-gia="' + HM.esc(r.name) + '" value="' + (r.source === 'override' ? r.per1k : '') + '" placeholder="' + HM.esc(HT.fmt.usd(r.refVn != null ? r.refVn : r.derived).replace('$', '')) + '" title="' + HM.esc(t('cDung')) + '"><input class="in mono" type="number" step="0.0001" min="0.0001" max="99" style="width:86px" data-khach="' + HM.esc(r.name) + '" value="' + (r.source === 'override' ? r.khach : '') + '" placeholder="' + HM.esc(t('cKhach')) + '" title="' + HM.esc(t('lKhach')) + '"><input class="in" style="width:118px" data-ghi="' + HM.esc(r.name) + '" placeholder="' + HM.esc(t('ghiChu')) + '" value="' + HM.esc(r.source === 'override' ? (r.note || '') : '') + '"></div></td>' +
            '<td><div class="btnrow" style="flex-wrap:nowrap"><button type="button" class="btn sm pri" data-luu="' + HM.esc(r.name) + '">' + HM.esc(t('luu')) + '</button>' + (r.source === 'override' ? '<button type="button" class="btn sm ghost" data-bo="' + HM.esc(r.name) + '">' + HM.esc(t('bo')) + '</button>' : '') + '</div></td></tr>';
        }).join('') + '</tbody></table></div>',
      chan: HM.esc(t('note')) });
    html += '<div class="grid g2">' +
      HM.the({ h2: HM.esc(t('soSanh')), p: HM.esc(t('soSanhMo')),
        than: HB.o({ loai: 'thanh', dinhDang: function (v) { return HT.fmt.usd(v); }, hang: rows.map(function (r, i) { return { ten: c.song(r, 'name'), gt: r.per1k, mau: r.source === 'override' ? HB.mau('no') : P[i % 8], phu: t('cSuy') + ' ' + HT.fmt.usd(r.derived) + (r.refVn != null ? ' · ' + t('cVn') + ' ' + HT.fmt.usd(r.refVn) : '') }; }) }) }) +
      HM.the({ h2: HM.esc(t('dan')), p: HM.esc(t('danMo')),
        than: '<textarea class="in mono" rows="7" data-csv placeholder="Spotify,1.52\nApple Music,3.05\nYouTube Music,0.71\nZing MP3,0.38"></textarea><div class="btnrow" style="margin-top:10px"><button type="button" class="btn pri" data-nhap>' + HM.icon('down2') + HM.esc(t('nhap')) + '</button></div>' }) +
      '</div>';
    root.innerHTML = html;
    HB.gan(root);
    HM.bam(root, '[data-luu]', function (el) {
      var n = el.getAttribute('data-luu');
      var q = function (k) { return root.querySelector('[data-' + k + '="' + n.replace(/"/g, '\\"') + '"]'); };
      var v = q('gia').value, kh = q('khach').value, ghi = q('ghi').value;
      var so = function (x) { return x === '' ? null : parseFloat(String(x).replace(',', '.')); };
      try { A.setPlatformRate(n, so(v), ghi, A.staff.me.name, so(kh)); c.thongBao(t('daLuu').replace('{n}', n).replace('{v}', v), 'ok'); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-bo]', function (el) { var n = el.getAttribute('data-bo'); A.clearPlatformRate(n, A.staff.me.name); c.thongBao(t('daBo').replace('{n}', n), 'ok'); c.veLai(); });
    HM.bam(root, '[data-nhap]', function () {
      var kq = A.importPlatformRates(root.querySelector('[data-csv]').value, A.staff.me.name);
      c.thongBao(t('daNhap').replace('{a}', kq.ok.length).replace('{b}', kq.skipped.length), kq.ok.length ? 'ok' : 'no'); if (kq.ok.length) c.veLai();
    });
  }
});

})();
