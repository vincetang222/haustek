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
  /* Bảng giá là quyết định thương mại của giám đốc, không phải việc vận
     hành. Trước vòng 21 trưởng bộ phận phát hành mở được trang này: nút
     lưu thì hỏng, nhưng cả bảng giá chào khách và chênh lệch thì đọc
     được sạch. Khoá ở đây và khoá luôn ở lõi (MAN_CAP + nhóm tong). */
  vai: ['mgmt'],

  chu: {
    vi: {
      navMucTra: 'Mức trả nền tảng', h1: 'Mức trả nền tảng',
      mo: 'Bảng giá của công ty: nền tảng trả về Haustek bao nhiêu, và Haustek chào khách bao nhiêu trên 1.000 lượt. Chênh lệch hai mức là CHÊNH LỆCH BẢNG GIÁ, không phải phí Haustek — phí là phần trăm trong hợp đồng của từng khách, cắt trên số đã quy theo bảng giá. Trang này chỉ Level 1–2 mở được.',
      mat: 'Tuyệt mật', matMo: 'Mức nền tảng trả về và chênh lệch bảng giá nằm ở đây. Đối tác không bao giờ thấy hai cột ấy, kể cả qua gói dữ liệu của cổng.',
      cKhach: 'Giá chào khách', cBien: 'Chênh lệch bảng giá', lKhach: 'Giá Haustek chào khách (USD / 1.000)', kBien: 'Chênh lệch bảng giá bình quân', kBienS: 'trên {n} nền tảng đã đặt hai mức',
      kTron: 'Mức trả trộn', kTronS: 'USD / 1.000 lượt, theo cơ cấu lượt nghe 3 kỳ', kGhiDe: 'Nền tảng đã nhập số thật', kGhiDeS: 'trong {n} nền tảng', kDuBao: 'Dự báo doanh thu kỳ mở', kDuBaoS: 'đổi theo mức trả ngay', kVn: 'Tham chiếu thị trường VN', kVnS: 'Spotify, USD / 1.000',
      cNt: 'Nền tảng', cSuy: 'Suy từ báo cáo', cVn: 'Tham chiếu VN', cDung: 'Đang dùng', cNguon: 'Nguồn', cNhap: 'Nhập số thật', cThaoTac: 'Thao tác',
      nguonSuy: 'báo cáo 3 kỳ', nguonNhap: 'nhập tay', luu: 'Lưu', bo: 'Bỏ ghi đè', daLuu: 'Đã lưu {n}: {v} USD / 1.000', daBo: 'Đã bỏ ghi đè {n}',
      dan: 'Dán CSV', danMo: 'Mỗi dòng: tên nền tảng, USD trên 1.000 lượt (nhận dấu phẩy, ; hoặc tab). Ví dụ: Spotify,1.52', nhap: 'Nhập', daNhap: 'Đã nhập {a} nền tảng, bỏ qua {b} dòng',
      soSanh: 'Suy từ báo cáo so với tham chiếu và số đang dùng', soSanhMo: 'USD / 1.000 lượt. Cột đỏ là nền tảng đang dùng số nhập tay.',
      ghiChu: 'Ghi chú (nguồn, kỳ báo cáo)', chua: 'chưa',
      note: 'Mức trả Việt Nam thấp hơn Âu–Mỹ 2–3 lần; nền tảng nội địa trả thấp nhất. Số ở đây là gộp về Haustek; đối tác thấy số ròng của chính họ.',
      td: 'Đặt mức này thì kỳ {k} ra sao', tdMo: 'Bảng giá quy lượt nghe ra doanh thu ghi nhận, rồi phí hợp đồng mới cắt trên số ấy. Bảng dưới lấy kỳ chốt gần nhất mà tính lại.',
      tdLuot: 'Lượt nghe', tdGop: 'Nền tảng trả về', tdGhi: 'Gộp ghi nhận', tdPhi: 'Phí hợp đồng', tdTra: 'Trả đối tác', tdBien: 'Chênh lệch bảng giá', tdGiu: 'Haustek giữ', tdKieu: 'Tính theo',
      kieuMuc: 'Bảng giá', kieuPt: 'Phần trăm', tdThuc: 'Thực tế / 1.000',
      tdTong: 'Cả kỳ', tdSo: 'Phí hợp đồng bình quân', tdSoMo: 'bình quân có trọng số theo doanh thu của từng hợp đồng',
      tdHoi: 'Haustek có hai dòng thu nhập và chúng do hai thứ khác nhau quyết định. Phí hợp đồng là phần trăm thoả thuận với từng khách, cắt trên doanh thu đã quy theo bảng giá — sửa hợp đồng thì nó đổi. Chênh lệch bảng giá là gộp thật trừ gộp ghi nhận — sửa bảng giá thì nó đổi. Gộp hai số ấy làm một là mất khả năng biết mình lãi nhờ đâu.',
      tdAm: 'Có {n} nền tảng đang chào cao hơn số nền tảng trả về. Tháng ấy chênh lệch bảng giá âm và Haustek bù phần chênh — phí hợp đồng vẫn thu bình thường. Xem lại giá đã chào hoặc đàm phán lại với nền tảng.',
      tdChua: 'Chưa nền tảng nào có giá chào, nên gộp ghi nhận bằng đúng gộp thật và chênh lệch bảng giá bằng 0. Nhập giá ở bảng trên là bảng này đổi theo ngay.',
      tdUoc: 'Số lấy mẫu thưa trên danh mục lớn, sai số dưới một phần trăm.'
    },
    en: {
      navMucTra: 'Platform payout rates', h1: 'Platform payout rates',
      mo: 'The company price list: what each platform pays Haustek per 1,000 streams, and what Haustek quotes its clients. The gap between them is the RATE SPREAD, not Haustek\u2019s fee — the fee is the percentage in each client\u2019s contract, taken on the revenue the price list recognises. Level 1–2 only.',
      mat: 'Strictly confidential', matMo: 'What platforms pay in, and the rate spread, live here. Partners never see those columns, not even through the portal\u2019s data payloads.',
      cKhach: 'Quoted to client', cBien: 'Rate spread', lKhach: 'Rate quoted to clients (USD / 1,000)', kBien: 'Average rate spread', kBienS: 'across {n} platforms with both rates set',
      kTron: 'Blended rate', kTronS: 'USD / 1,000 streams, weighted by 3-period stream mix', kGhiDe: 'Platforms with real figures', kGhiDeS: 'of {n} platforms', kDuBao: 'Open-period revenue forecast', kDuBaoS: 'moves with the rates', kVn: 'Vietnam market reference', kVnS: 'Spotify, USD / 1,000',
      cNt: 'Platform', cSuy: 'Derived from reports', cVn: 'VN reference', cDung: 'In use', cNguon: 'Source', cNhap: 'Enter real figure', cThaoTac: 'Actions',
      nguonSuy: '3-period reports', nguonNhap: 'entered', luu: 'Save', bo: 'Clear override', daLuu: 'Saved {n}: {v} USD / 1,000', daBo: 'Cleared override for {n}',
      dan: 'Paste CSV', danMo: 'One line per platform: name, USD per 1,000 (comma, ; or tab). Example: Spotify,1.52', nhap: 'Import', daNhap: 'Imported {a} platforms, skipped {b} lines',
      soSanh: 'Derived vs reference vs in use', soSanhMo: 'USD / 1,000 streams. Red bars are platforms using entered figures.',
      ghiChu: 'Note (source, report period)', chua: 'none',
      note: 'Vietnamese rates are 2–3× below Europe/US; domestic platforms pay least. Figures are gross to Haustek; partners see their own net.',
      td: 'What these rates did to {k}', tdMo: 'The price list turns streams into recognised revenue; only then does the contract fee take its cut. The table recomputes the most recent closed period.',
      tdLuot: 'Streams', tdGop: 'Platform paid in', tdGhi: 'Recognised revenue', tdPhi: 'Contract fee', tdTra: 'Paid to partner', tdBien: 'Rate spread', tdGiu: 'Haustek keeps', tdKieu: 'Basis',
      kieuMuc: 'Rate card', kieuPt: 'Percentage', tdThuc: 'Actual / 1,000',
      tdTong: 'Whole period', tdSo: 'Average contract fee', tdSoMo: 'weighted by each contract\u2019s revenue',
      tdHoi: 'Haustek has two income lines and two different things drive them. The contract fee is the percentage agreed with each client, taken on the revenue the price list recognises — change a contract and it moves. The rate spread is actual platform revenue minus recognised revenue — change the price list and it moves. Merge them into one number and you lose the ability to know where the profit came from.',
      tdAm: '{n} platforms are quoted above what the platform paid in. The rate spread is negative those months and Haustek covers the gap — the contract fee is collected as usual. Revisit the quoted rate or renegotiate with the platform.',
      tdChua: 'No platform has a quoted rate yet, so recognised revenue equals actual revenue and the rate spread is zero. Enter a rate above and this table follows immediately.',
      tdUoc: 'Sampled across the large catalogue; the error is under one percent.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, P = HB.dayMau();
    var rows = A.platformRatesFull(), ov = rows.filter(function (r) { return r.source === 'override'; }).length;
    var f = null; try { f = A.forecast(); } catch (e) { f = null; }
    var tron = f && f.byPlatform.length ? f.byPlatform.reduce(function (s, x) { return s + x.per1k * x.share; }, 0)
      : (rows.length ? rows.reduce(function (s, r) { return s + r.per1k; }, 0) / rows.length : 0);
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    /* Chênh lệch âm cũng phải vào bình quân: lọc bỏ nó đi là bảng giá lỗ
       mà ô số vẫn xanh. */
    var coHai = rows.filter(function (r) { return r.source === 'override' && r.bienGia !== 0; });
    var bienTb = coHai.length ? coHai.reduce(function (a, r) { return a + r.bienGiaPct; }, 0) / coHai.length : 0;
    html += HM.ghi({ kieu: 'warn', icon: 'alert', tieuDe: HM.esc(t('mat')), than: HM.esc(t('matMo')) });
    html += HM.so([
      { l: t('kTron'), v: HT.fmt.usd(tron), lon: true, s: t('kTronS') },
      { l: t('kBien'), v: bienTb ? HT.fmt.pct(bienTb) : '—', s: t('kBienS').replace('{n}', coHai.length),
        mau: bienTb > 0 ? HB.mau('ok') : bienTb < 0 ? HB.mau('no') : '' },
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
            '<td class="num mono">' + (r.bienGia === 0 ? '<span class="nil">—</span>'
              : '<span class="' + (r.bienGia > 0 ? 'pos' : 'neg') + '">' + HM.esc(HT.fmt.usd(r.bienGia)) + ' · ' + HM.esc(HT.fmt.pct(r.bienGiaPct)) + '</span>') + '</td>' +
            '<td>' + HM.tag(r.source === 'override' ? t('nguonNhap') : t('nguonSuy'), r.source === 'override' ? 'ok' : '') + '</td>' +
            '<td><div class="bar" style="margin:0;gap:6px;flex-wrap:nowrap"><input class="in mono" type="number" step="0.0001" min="0.0001" max="99" style="width:86px" data-gia="' + HM.esc(r.name) + '" value="' + (r.source === 'override' ? r.per1k : '') + '" placeholder="' + HM.esc(HT.fmt.usd(r.refVn != null ? r.refVn : r.derived).replace('$', '')) + '" title="' + HM.esc(t('cDung')) + '"><input class="in mono" type="number" step="0.0001" min="0.0001" max="99" style="width:86px" data-khach="' + HM.esc(r.name) + '" value="' + (r.source === 'override' ? r.khach : '') + '" placeholder="' + HM.esc(t('cKhach')) + '" title="' + HM.esc(t('lKhach')) + '"><input class="in" style="width:118px" data-ghi="' + HM.esc(r.name) + '" placeholder="' + HM.esc(t('ghiChu')) + '" value="' + HM.esc(r.source === 'override' ? (r.note || '') : '') + '"></div></td>' +
            '<td><div class="btnrow" style="flex-wrap:nowrap"><button type="button" class="btn sm pri" data-luu="' + HM.esc(r.name) + '">' + HM.esc(t('luu')) + '</button>' + (r.source === 'override' ? '<button type="button" class="btn sm ghost" data-bo="' + HM.esc(r.name) + '">' + HM.esc(t('bo')) + '</button>' : '') + '</div></td></tr>';
        }).join('') + '</tbody></table></div>',
      chan: HM.esc(t('note')) });
    html += veTacDong(c);
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

/* =====================================================================
   BẢNG GIÁ NÀY LÀM GÌ VỚI TIỀN THẬT
   ---------------------------------------------------------------------
   Đặt một con số vào ô rồi không thấy gì đổi thì không ai tin con số ấy
   có tác dụng. Khối này lấy kỳ chốt gần nhất tính lại: từng nền tảng
   nhận bao nhiêu lượt, nền tảng trả về bao nhiêu, Haustek trả đối tác
   bao nhiêu, giữ lại bao nhiêu — và tổng lệch bao nhiêu so với cách tính
   cũ. Nền tảng nào âm thì đỏ, không giấu.
   ===================================================================== */
function veTacDong(c) {
  var A = c.A, t = c.t;
  var kys = A.periods.filter(function (p) { return A.isApproved(p.k); });
  var pi = kys.length ? kys[kys.length - 1].idx : A.periods.length - 1;
  var d = null;
  try { d = A.mucTraTacDong(pi); } catch (e) { return ''; }
  if (!d) return '';

  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cNt')) + '</th>' +
    '<th class="num">' + HM.esc(t('tdLuot')) + '</th>' +
    '<th class="num">' + HM.esc(t('tdThuc')) + '</th>' +
    '<th class="num">' + HM.esc(t('tdGop')) + '</th>' +
    '<th class="num">' + HM.esc(t('tdGhi')) + '</th>' +
    '<th class="num">' + HM.esc(t('tdPhi')) + '</th>' +
    '<th class="num band">' + HM.esc(t('tdTra')) + '</th>' +
    '<th class="num">' + HM.esc(t('tdBien')) + '</th>' +
    '<th>' + HM.esc(t('tdKieu')) + '</th></tr></thead><tbody>' +
    d.rows.map(function (r) {
      return '<tr' + (r.am ? ' class="canh"' : '') + '>' +
        '<td>' + HM.tenBia({ ten: r.name, seed: r.name }) + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(r.streams)) + '</td>' +
        '<td class="num mono muted">' + HM.esc(HT.fmt.usd(r.thucTe1k)) + '</td>' +
        '<td class="num mono">' + HM.esc(c.tien(r.gross)) + '</td>' +
        '<td class="num mono">' + HM.esc(c.tien(r.ghiNhan)) +
          (r.theoMucTra ? '<div class="t-sub">' + HM.esc(HT.fmt.usd(r.khach) + ' / 1.000') + '</div>' : '') + '</td>' +
        '<td class="num mono">' + HM.esc(c.tien(r.phi)) + '</td>' +
        '<td class="num band mono"><b>' + HM.esc(c.tien(r.tra)) + '</b></td>' +
        '<td class="num mono">' + (r.am
          ? '<span class="neg">' + HM.esc(c.tien(r.bienGia)) + ' · ' + HM.esc(HT.fmt.pct(r.bienGiaPct)) + '</span>'
          : '<span class="pos">' + HM.esc(c.tien(r.bienGia)) + ' · ' + HM.esc(HT.fmt.pct(r.bienGiaPct)) + '</span>') + '</td>' +
        '<td>' + HM.tag(r.theoMucTra ? t('kieuMuc') : t('kieuPt'), r.theoMucTra ? 'ok' : '') + '</td></tr>';
    }).join('') +
    '<tr class="sum"><td><b>' + HM.esc(t('tdTong')) + '</b></td><td></td><td></td>' +
    '<td class="num mono"><b>' + HM.esc(c.tien(d.gross)) + '</b></td>' +
    '<td class="num mono"><b>' + HM.esc(c.tien(d.ghiNhan)) + '</b></td>' +
    '<td class="num mono"><b>' + HM.esc(c.tien(d.phi)) + '</b></td>' +
    '<td class="num band mono"><b>' + HM.esc(c.tien(d.tra)) + '</b></td>' +
    '<td class="num mono"><b>' + HM.esc(c.tien(d.bienGia)) + ' · ' + HM.esc(HT.fmt.pct(d.bienGiaPct)) + '</b></td>' +
    '<td></td></tr></tbody></table></div>';

  var canh = '';
  if (!d.soTheoMuc) canh = HM.ghi({ kieu: 'info', icon: 'info', tieuDe: HM.esc(t('tdKieu')), than: HM.esc(t('tdChua')) });
  else if (d.soAm) canh = HM.ghi({ kieu: 'no', icon: 'alert', tieuDe: HM.esc(t('cBien')), than: HM.esc(t('tdAm').replace('{n}', d.soAm)) });

  /* Năm ô số đọc thành một câu: nền tảng trả về bấy nhiêu, bảng giá ghi
     nhận bấy nhiêu, phí hợp đồng cắt bấy nhiêu, đối tác nhận bấy nhiêu,
     và Haustek giữ lại bằng phí CỘNG chênh lệch bảng giá — hai dòng thu
     nhập khác nhau, không gộp thành một con số "biên". */
  return canh + HM.the({
    h2: HM.esc(t('td').replace('{k}', d.label)), p: HM.esc(t('tdMo')), icon: 'cash', thoBody: true,
    hanhDong: HM.hoi(t('tdHoi')),
    than: HM.so([
      { l: t('tdGop'), v: c.tien(d.gross) },
      { l: t('tdGhi'), v: c.tien(d.ghiNhan) },
      { l: t('tdTra'), v: c.tien(d.tra), lon: true },
      { l: t('tdPhi'), v: c.tien(d.phi), s: t('tdSo') + ' ' + HT.fmt.pct(d.phiPct), mau: HB.mau('ok') },
      { l: t('tdBien'), v: c.tien(d.bienGia) + ' · ' + HT.fmt.pct(d.bienGiaPct),
        s: t('tdGiu') + ' ' + c.tien(d.giuLai),
        mau: d.bienGia >= 0 ? HB.mau('ok') : HB.mau('no') }
    ]) + than,
    chan: d.uocLuong ? HM.esc(t('tdUoc')) : ''
  });
}

})();
