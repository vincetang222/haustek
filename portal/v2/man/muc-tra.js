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
  id: 'muc-tra', nav: 'navMucTra', nhom: 'nhomTien', icon: 'chart',
  vai: ['ops', 'mgmt', 'accounting'],

  chu: {
    vi: {
      navMucTra: 'Mức trả nền tảng', h1: 'Mức trả nền tảng',
      mo: 'USD gộp trên 1.000 lượt nghe của từng nền tảng, dùng cho dự báo và giải thích số. Mặc định suy từ báo cáo 3 kỳ gần nhất; nhập số thật để ghi đè.',
      kTron: 'Mức trả trộn', kTronS: 'USD / 1.000 lượt, theo cơ cấu lượt nghe 3 kỳ', kGhiDe: 'Nền tảng đã nhập số thật', kGhiDeS: 'trong {n} nền tảng', kDuBao: 'Dự báo doanh thu kỳ mở', kDuBaoS: 'đổi theo mức trả ngay', kVn: 'Tham chiếu thị trường VN', kVnS: 'Spotify, USD / 1.000',
      cNt: 'Nền tảng', cSuy: 'Suy từ báo cáo', cVn: 'Tham chiếu VN', cDung: 'Đang dùng', cNguon: 'Nguồn', cNhap: 'Nhập số thật', cThaoTac: 'Thao tác',
      nguonSuy: 'báo cáo 3 kỳ', nguonNhap: 'nhập tay', luu: 'Lưu', bo: 'Bỏ ghi đè', daLuu: 'Đã lưu {n}: {v} USD / 1.000', daBo: 'Đã bỏ ghi đè {n}',
      dan: 'Dán CSV', danMo: 'Mỗi dòng: tên nền tảng, USD trên 1.000 lượt (chấp nhận dấu phẩy thập phân, dấu ; hoặc tab). Ví dụ: Spotify,1.52', nhap: 'Nhập', daNhap: 'Đã nhập {a} nền tảng, bỏ qua {b} dòng',
      soSanh: 'Suy từ báo cáo so với tham chiếu và số đang dùng', soSanhMo: 'USD / 1.000 lượt. Cột đỏ là nền tảng đang dùng số nhập tay.',
      ghiChu: 'Ghi chú (nguồn, kỳ báo cáo)', chua: 'chưa',
      note: 'Mức trả thị trường Việt Nam thấp hơn Âu–Mỹ 2–3 lần vì giá thuê bao và CPM quảng cáo thấp; nền tảng nội địa (Zing MP3, NhacCuaTui) trả thấp nhất. Số ở đây là gộp về Haustek trước khi chia; đối tác thấy mức trả đã nhân với tỷ lệ của họ.'
    },
    en: {
      navMucTra: 'Platform payout rates', h1: 'Platform payout rates',
      mo: 'Gross USD per 1,000 streams per platform, used by forecasts and number explanations. Derived from the last three approved reports by default; enter real figures to override.',
      kTron: 'Blended rate', kTronS: 'USD / 1,000 streams, weighted by 3-period stream mix', kGhiDe: 'Platforms with real figures', kGhiDeS: 'of {n} platforms', kDuBao: 'Open-period revenue forecast', kDuBaoS: 'moves with the rates', kVn: 'Vietnam market reference', kVnS: 'Spotify, USD / 1,000',
      cNt: 'Platform', cSuy: 'Derived from reports', cVn: 'VN reference', cDung: 'In use', cNguon: 'Source', cNhap: 'Enter real figure', cThaoTac: 'Actions',
      nguonSuy: '3-period reports', nguonNhap: 'entered', luu: 'Save', bo: 'Clear override', daLuu: 'Saved {n}: {v} USD / 1,000', daBo: 'Cleared override for {n}',
      dan: 'Paste CSV', danMo: 'One line per platform: name, USD per 1,000 streams (decimal comma, ; or tab accepted). Example: Spotify,1.52', nhap: 'Import', daNhap: 'Imported {a} platforms, skipped {b} lines',
      soSanh: 'Derived vs reference vs in use', soSanhMo: 'USD / 1,000 streams. Red bars are platforms using entered figures.',
      ghiChu: 'Note (source, report period)', chua: 'none',
      note: 'Vietnamese market rates are 2–3× below Europe/US because subscription prices and ad CPMs are low; domestic platforms (Zing MP3, NhacCuaTui) pay the least. Figures here are gross to Haustek before the split; partners see rates multiplied by their share.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, P = HB.dayMau();
    var rows = A.platformRatesFull(), ov = rows.filter(function (r) { return r.source === 'override'; }).length;
    var f = null; try { f = A.forecast(); } catch (e) { f = null; }
    var tron = f && f.byPlatform.length ? f.byPlatform.reduce(function (s, x) { return s + x.per1k * x.share; }, 0) : 0;
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kTron'), v: HT.fmt.usd(tron), lon: true, s: t('kTronS') },
      { l: t('kGhiDe'), v: HT.fmt.n(ov), s: t('kGhiDeS').replace('{n}', rows.length), mau: ov ? HB.mau('ok') : '' },
      f ? { l: t('kDuBao').replace('{k}', f.openPeriod), v: c.tien(f.projected.revenue), s: t('kDuBaoS') } : null,
      { l: t('kVn'), v: HT.fmt.usd(A.vnRef[0]), s: t('kVnS') }
    ].filter(Boolean));
    html += HM.the({ thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cNt')) + '</th><th class="num">' + HM.esc(t('cSuy')) + '</th><th class="num">' + HM.esc(t('cVn')) + '</th><th class="num band">' + HM.esc(t('cDung')) + '</th><th>' + HM.esc(t('cNguon')) + '</th><th>' + HM.esc(t('cNhap')) + '</th><th>' + HM.esc(t('cThaoTac')) + '</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td>' + HM.tenBia({ ten: c.song(r, 'name'), seed: r.name, phu: r.source === 'override' && r.at ? HT.fmt.ngay(String(r.at).slice(0, 10)) + (r.note ? ' · ' + r.note : '') : '' }) + '</td>' +
            '<td class="num mono">' + HM.esc(HT.fmt.usd(r.derived)) + '</td><td class="num mono muted">' + (r.refVn != null ? HM.esc(HT.fmt.usd(r.refVn)) : '—') + '</td>' +
            '<td class="num band"><b>' + HM.esc(HT.fmt.usd(r.per1k)) + '</b></td>' +
            '<td>' + HM.tag(r.source === 'override' ? t('nguonNhap') : t('nguonSuy'), r.source === 'override' ? 'ok' : '') + '</td>' +
            '<td><div class="bar" style="margin:0;gap:6px;flex-wrap:nowrap"><input class="in mono" type="number" step="0.01" min="0.01" max="99" style="width:96px" data-gia="' + HM.esc(r.name) + '" value="' + (r.source === 'override' ? r.per1k : '') + '" placeholder="' + HM.esc(HT.fmt.usd(r.refVn != null ? r.refVn : r.derived).replace('$', '')) + '"><input class="in" style="width:150px" data-ghi="' + HM.esc(r.name) + '" placeholder="' + HM.esc(t('ghiChu')) + '" value="' + HM.esc(r.source === 'override' ? (r.note || '') : '') + '"></div></td>' +
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
      var n = el.getAttribute('data-luu'), v = root.querySelector('[data-gia="' + n.replace(/"/g, '\\"') + '"]').value, ghi = root.querySelector('[data-ghi="' + n.replace(/"/g, '\\"') + '"]').value;
      try { A.setPlatformRate(n, parseFloat(String(v).replace(',', '.')), ghi, A.staff.me.name); c.thongBao(t('daLuu').replace('{n}', n).replace('{v}', v), 'ok'); c.veLai(); }
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
