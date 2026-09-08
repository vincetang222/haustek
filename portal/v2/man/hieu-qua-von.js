/* =====================================================================
   NỘI BỘ · HIỆU QUẢ SỬ DỤNG VỐN
   ---------------------------------------------------------------------
   Tạm ứng là tiền Haustek bỏ ra trước rồi thu lại dần từ doanh thu của
   chính đối tác ấy. Câu hỏi tài chính thật sự chỉ có ba:
     · tiền đã đi bao nhiêu, về được bao nhiêu, còn đọng bao nhiêu;
     · phần còn đọng có kịp về trước khi hợp đồng hết hạn không;
     · mỗi đồng vốn bỏ ra kéo về bao nhiêu doanh thu.

   Quá khứ đọc thẳng từ bảng chi trả của từng kỳ đã chốt sổ, không ước
   lượng. Tương lai nối tiếp bằng nhịp thu hồi ba kỳ gần nhất của đúng
   đối tác đó — nói rõ là dự báo và vẽ bằng nét đứt, để không ai nhầm hai
   phần với nhau.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'duong';
var LOC = { loc: 'tatCa' };

HT.dangKy({
  id: 'hieu-qua-von', nav: 'navVon', nhom: 'nhomTien', icon: 'chart',

  chu: {
    vi: {
      nhomTien: 'Tiền', navVon: 'Hiệu quả vốn', h1: 'Hiệu quả sử dụng vốn',
      mo: 'Tiền tạm ứng đã đi, đã về, còn đọng, và bao giờ về hết. Chỉ Level 1–2 mở được.',
      gd: 'Ngày giải ngân lấy theo ngày ký hợp đồng — bản mẫu chưa giữ ngày chuyển tiền riêng. Phần quá khứ của đường thu hồi đọc từ bảng chi trả các kỳ đã chốt; phần nét đứt là dự báo theo nhịp ba kỳ gần nhất.',

      kGiaiNgan: 'Đã giải ngân', kGiaiNganS: '{n} hợp đồng có tạm ứng',
      kDaThu: 'Đã thu hồi', kDaThuS: 'từ doanh thu của chính đối tác',
      kConDong: 'Vốn còn đọng', kConDongS: '{n} hợp đồng chưa thu hết',
      kTyLe: 'Tỷ lệ thu hồi', kTrenDong: 'Doanh thu trên mỗi đô vốn',
      kTrenDongS: 'doanh thu đối tác tạo ra ÷ vốn đã ứng',
      kHoaVon: 'Thời gian hoà vốn trung bình', kHoaVonS: 'trên {n} hợp đồng đã thu đủ', thang: 'tháng',

      tDuong: 'Đường thu hồi', tHopDong: 'Theo hợp đồng', tLop: 'Lứa ký và tuổi nợ',

      bdLuy: 'Thu hồi luỹ kế', bdKy: 'Thu hồi từng kỳ', duBao: 'dự báo',
      duongMo: 'Đường liền là tiền đã thu thật, nét đứt là dự báo mười hai tháng tới.',
      conSau: 'Còn đọng sau 12 tháng tới', conSauMo: 'phần dự báo không thu hồi kịp bằng nhịp hiện tại',

      cDoiTac: 'Đối tác', cLoai: 'Loại', cGiaiNgan: 'Đã ứng', cDaThu: 'Đã thu', cConLai: 'Còn lại',
      cTyLe: 'Thu hồi', cNhip: 'Nhịp mỗi kỳ', cConThang: 'Còn cần', cHopDong: 'Hợp đồng còn',
      cTinhTrang: 'Tình trạng', kip: 'Kịp hạn', khongKip: 'Không kịp', xongRoi: 'Đã thu đủ', khongNhip: 'Chưa có nhịp',
      loaiLabel: 'Label', loaiArtist: 'Nghệ sĩ',
      locTatCa: 'Mọi hợp đồng', locConNo: 'Còn đọng vốn', locTre: 'Không kịp hạn', locXong: 'Đã thu đủ',
      hdMo: 'Nhịp là số tiền thu hồi trung bình mỗi kỳ trong ba kỳ chốt gần nhất của chính đối tác đó. Còn cần là số tháng để thu hết phần còn lại theo nhịp ấy.',
      khongHd: 'Không có hợp đồng nào khớp bộ lọc.',

      cNam: 'Năm ký', cSo: 'Số hợp đồng', lopMo: 'Lứa ký nào thu hồi tốt hơn lứa nào. Lứa mới tất nhiên thu được ít hơn vì mới chạy chưa lâu.',
      cTuoi: 'Tuổi nợ', cSoHd: 'Hợp đồng', cTien: 'Vốn đọng',
      tuoiMo: 'Tính từ ngày ký. Vốn đọng quá hai năm thường là hợp đồng ký sai kỳ vọng doanh thu, không phải chậm thu.',

      in: 'Bản in', inTieu: 'Hiệu quả sử dụng vốn', inPhu: 'Tiền tạm ứng đã đi, đã về, còn đọng và dự báo thu hồi.',
      inTong: 'Số tổng', inHd: 'Hợp đồng còn đọng vốn', inLop: 'Theo lứa ký'
    },
    en: {
      nhomTien: 'Money', navVon: 'Capital efficiency', h1: 'Capital efficiency',
      mo: 'Advance money out, back, still out, and when the rest lands. Level 1–2 only.',
      gd: 'The disbursement date is taken from the contract signing date — this prototype does not hold a separate transfer date. The solid part of the recovery curve is read from the payout tables of closed periods; the dashed part is a forecast at the last three periods’ pace.',

      kGiaiNgan: 'Advanced', kGiaiNganS: '{n} contracts carrying an advance',
      kDaThu: 'Recouped', kDaThuS: 'out of the partner’s own revenue',
      kConDong: 'Still out', kConDongS: '{n} contracts not yet fully recouped',
      kTyLe: 'Recovery rate', kTrenDong: 'Revenue per dollar advanced',
      kTrenDongS: 'partner revenue generated ÷ capital advanced',
      kHoaVon: 'Average time to full recovery', kHoaVonS: 'across {n} fully recouped contracts', thang: 'months',

      tDuong: 'Recovery curve', tHopDong: 'By contract', tLop: 'Signing cohorts and ageing',

      bdLuy: 'Cumulative recouped', bdKy: 'Recouped per period', duBao: 'forecast',
      duongMo: 'The solid line is money actually recouped; the dashed line forecasts the next twelve months.',
      conSau: 'Still out after 12 months', conSauMo: 'the part the current pace does not reach in time',

      cDoiTac: 'Partner', cLoai: 'Kind', cGiaiNgan: 'Advanced', cDaThu: 'Recouped', cConLai: 'Outstanding',
      cTyLe: 'Recovered', cNhip: 'Pace per period', cConThang: 'Months needed', cHopDong: 'Contract left',
      cTinhTrang: 'Status', kip: 'On track', khongKip: 'Will not make it', xongRoi: 'Fully recouped', khongNhip: 'No pace yet',
      loaiLabel: 'Label', loaiArtist: 'Artist',
      locTatCa: 'All contracts', locConNo: 'Still outstanding', locTre: 'Will not make it', locXong: 'Fully recouped',
      hdMo: 'Pace is the average amount recouped per period over that partner’s last three closed periods. Months needed is how long the rest takes at that pace.',
      khongHd: 'No contract matches the filter.',

      cNam: 'Signed', cSo: 'Contracts', lopMo: 'Which signing cohort recovers better. Newer cohorts naturally show less — they have had less time.',
      cTuoi: 'Age', cSoHd: 'Contracts', cTien: 'Capital out',
      tuoiMo: 'Measured from the signing date. Capital out beyond two years usually means the deal was signed on the wrong revenue expectation, not that collection is slow.',

      in: 'Print view', inTieu: 'Capital efficiency', inPhu: 'Advance money out, back, still out, and the recovery forecast.',
      inTong: 'Headline figures', inHd: 'Contracts with capital still out', inLop: 'By signing cohort'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var tq = A.von.tongQuan();

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: '<button type="button" class="btn sm ghost" data-in>' + HM.icon('file') + HM.esc(t('in')) + '</button>'
    });
    html += HM.so([
      { l: t('kGiaiNgan'), v: c.tien(tq.giaiNgan), s: t('kGiaiNganS').replace('{n}', tq.soHopDong) },
      { l: t('kDaThu'), v: c.tien(tq.daThu), s: t('kDaThuS'), mau: HB.mau('ok') },
      { l: t('kConDong'), v: c.tien(tq.conLai), s: t('kConDongS').replace('{n}', tq.soHopDong - tq.daXong),
        mau: tq.conLai > 0 ? HB.mau('warn') : HB.mau('ok') },
      { l: t('kTyLe'), v: HT.fmt.pct(tq.tyLeThuHoi / 100), lon: true },
      { l: t('kTrenDong'), v: '$' + HT.fmt.n1(tq.trenMoiDong), s: t('kTrenDongS'),
        mau: HB.mau(tq.trenMoiDong >= 1 ? 'ok' : 'warn') },
      { l: t('kHoaVon'), v: tq.thangHoaVonTb == null ? '—' : tq.thangHoaVonTb + ' ' + t('thang'),
        s: t('kHoaVonS').replace('{n}', tq.daXong) }
    ]);
    html += HM.tabs([
      { k: 'duong', l: t('tDuong'), icon: 'chart' },
      { k: 'hd', l: t('tHopDong'), icon: 'list', dem: tq.soHopDong - tq.daXong },
      { k: 'lop', l: t('tLop'), icon: 'layers' }
    ], TAB);

    if (TAB === 'duong') html += veDuong(c);
    if (TAB === 'hd') html += veHopDong(c);
    if (TAB === 'lop') html += veLop(c);

    root.innerHTML = html;
    HB.gan(root);
    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-in]', function () { inRa(c); });
    HM.doi(root, '[data-loc]', function (el) { LOC.loc = el.value; c.veLai(); });
  }
});

function tinhTrang(c, r) {
  var t = c.t;
  if (r.conLai <= 0) return { chu: t('xongRoi'), kieu: 'ok' };
  if (r.conThang == null) return { chu: t('khongNhip'), kieu: 'warn' };
  return r.kip ? { chu: t('kip'), kieu: '' } : { chu: t('khongKip'), kieu: 'warn' };
}

/* =====================================================================
   TAB 1 — ĐƯỜNG THU HỒI: QUÁ KHỨ NỐI TƯƠNG LAI
   ===================================================================== */
function veDuong(c) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var d = A.von.duong(12);
  var truc = d.qua.map(function (x) { return x.label; }).concat(d.toi.map(function (x) { return x.label; }));
  var luy = d.qua.map(function (x) { return x.luyKe; }).concat(d.toi.map(function (x) { return x.luyKe; }));
  var ky = d.qua.map(function (x) { return x.thuHoi; }).concat(d.toi.map(function (x) { return x.thuHoi; }));

  return '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('bdLuy')), p: HM.esc(t('duongMo')),
      than: HB.o({ loai: 'duong', cao: 250, chuThich: false, dinhDang: 'tien',
        truc: truc,
        tieuDeTip: function (i) { return truc[i] + (i >= d.qua.length ? ' · ' + t('duBao') : ''); },
        chuoi: [{ ten: t('bdLuy'), gt: luy, mau: P[0], dubao: d.qua.length }] }),
      chan: HM.esc(t('conSau')) + ': <b>' + HM.esc(c.tien(d.conSauCung)) + '</b> · ' + HM.esc(t('conSauMo')) }) +
    HM.the({ h2: HM.esc(t('bdKy')), p: HM.esc(t('gd')),
      than: HB.o({ loai: 'cot', cao: 250, chuThich: false, dinhDang: 'tien',
        truc: truc,
        tieuDeTip: function (i) { return truc[i] + (i >= d.qua.length ? ' · ' + t('duBao') : ''); },
        chuoi: [{ ten: t('bdKy'), gt: ky, mau: HB.mau('ok') }] }) }) +
    '</div>';
}

/* =====================================================================
   TAB 2 — TỪNG HỢP ĐỒNG
   ===================================================================== */
function veHopDong(c) {
  var A = c.A, t = c.t;
  var rows = A.von.bang();
  var loc = rows.filter(function (r) {
    if (LOC.loc === 'conNo') return r.conLai > 0;
    if (LOC.loc === 'tre') return r.conLai > 0 && !r.kip;
    if (LOC.loc === 'xong') return r.conLai <= 0;
    return true;
  });

  var thanh = '<div class="bar"><select class="in" data-loc style="width:auto;height:34px" aria-label="' + HM.esc(t('tHopDong')) + '">' +
    [['tatCa', t('locTatCa')], ['conNo', t('locConNo')], ['tre', t('locTre')], ['xong', t('locXong')]].map(function (o) {
      return '<option value="' + o[0] + '"' + (LOC.loc === o[0] ? ' selected' : '') + '>' + HM.esc(o[1]) + '</option>';
    }).join('') + '</select></div>';

  if (!loc.length) return HM.the({ h2: HM.esc(t('tHopDong')), than: thanh + HM.trong({ icon: 'empty', tieuDe: t('khongHd'), moTa: t('hdMo') }) });

  var than = thanh + '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cDoiTac')) + '</th><th>' + HM.esc(t('cLoai')) + '</th>' +
    '<th class="num">' + HM.esc(t('cGiaiNgan')) + '</th><th class="num">' + HM.esc(t('cDaThu')) + '</th>' +
    '<th class="num">' + HM.esc(t('cConLai')) + '</th><th class="num">' + HM.esc(t('cTyLe')) + '</th>' +
    '<th class="num">' + HM.esc(t('cNhip')) + HM.hoi(t('hdMo')) + '</th>' +
    '<th class="num">' + HM.esc(t('cConThang')) + '</th><th class="num">' + HM.esc(t('cHopDong')) + '</th>' +
    '<th>' + HM.esc(t('cTinhTrang')) + '</th></tr></thead><tbody>' +
    loc.slice(0, 200).map(function (r) {
      var tt = tinhTrang(c, r);
      return '<tr>' +
        '<td>' + HM.tenBia({ ten: r.name, seed: r.clientId, phu: r.clientId + ' · ' + HT.fmt.ngay(r.kyHopDong) }) + '</td>' +
        '<td>' + HM.tag(r.kind === 'label' ? t('loaiLabel') : t('loaiArtist'), '') + '</td>' +
        '<td class="num mono">' + HM.esc(c.tien(r.giaiNgan)) + '</td>' +
        '<td class="num mono">' + HM.esc(c.tien(r.daThu)) + '</td>' +
        '<td class="num mono"><b>' + (r.conLai > 0 ? HM.esc(c.tien(r.conLai)) : '<span class="nil">—</span>') + '</b></td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.pct(r.tyLe / 100)) + '</td>' +
        '<td class="num mono muted">' + (r.nhip > 0 ? HM.esc(c.tien(r.nhip)) : '<span class="nil">—</span>') + '</td>' +
        '<td class="num mono">' + (r.conLai <= 0 ? '<span class="nil">—</span>' : r.conThang == null ? '<span class="neg">∞</span>' : HM.esc(HT.fmt.n(r.conThang))) + '</td>' +
        '<td class="num mono muted">' + (r.thangConHopDong > 0 ? HM.esc(HT.fmt.n(r.thangConHopDong)) : '<span class="neg">0</span>') + '</td>' +
        '<td>' + HM.tag(tt.chu, tt.kieu) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  return HM.the({ h2: HM.esc(t('tHopDong')), p: HM.esc(t('hdMo')), thoBody: true, than: than });
}

/* =====================================================================
   TAB 3 — LỨA KÝ VÀ TUỔI NỢ
   ===================================================================== */
function veLop(c) {
  var A = c.A, t = c.t, P = HB.dayMau();
  var lop = A.von.lop(), tuoi = A.von.tuoiNo();
  return '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('tLop')), p: HM.esc(t('lopMo')), thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr>' +
        '<th>' + HM.esc(t('cNam')) + '</th><th class="num">' + HM.esc(t('cSo')) + '</th>' +
        '<th class="num">' + HM.esc(t('cGiaiNgan')) + '</th><th class="num">' + HM.esc(t('cDaThu')) + '</th>' +
        '<th class="num">' + HM.esc(t('cConLai')) + '</th><th class="num">' + HM.esc(t('cTyLe')) + '</th></tr></thead><tbody>' +
        lop.map(function (x) {
          return '<tr><td><b>' + HM.esc(x.nam) + '</b></td><td class="num mono">' + HM.esc(HT.fmt.n(x.so)) + '</td>' +
            '<td class="num mono">' + HM.esc(c.tien(x.giaiNgan)) + '</td>' +
            '<td class="num mono">' + HM.esc(c.tien(x.daThu)) + '</td>' +
            '<td class="num mono">' + HM.esc(c.tien(x.conLai)) + '</td>' +
            '<td class="num mono"><b>' + HM.esc(HT.fmt.pct(x.tyLe / 100)) + '</b></td></tr>';
        }).join('') + '</tbody></table></div>' }) +
    HM.the({ h2: HM.esc(t('cTuoi')), p: HM.esc(t('tuoiMo')),
      than: HB.o({ loai: 'thanh', dinhDang: function (v) { return c.tien(v); },
        hang: tuoi.map(function (b, i) {
          return { ten: c.lang === 'en' ? b.en : b.vi, gt: b.tien,
            mau: i >= 3 ? HB.mau('no') : i === 2 ? HB.mau('warn') : P[0],
            phu: HT.fmt.n(b.so) + ' ' + t('cSoHd').toLowerCase() };
        }) }) }) +
    '</div>';
}

/* ---- bản in ---- */
function inRa(c) {
  var A = c.A, t = c.t;
  var tq = A.von.tongQuan();
  var rows = A.von.bang().filter(function (r) { return r.conLai > 0; }).slice(0, 60);
  var lop = A.von.lop();
  var than = '<h2>' + HM.esc(t('inTong')) + '</h2><dl>' +
    [[t('kGiaiNgan'), c.tien2(tq.giaiNgan)], [t('kDaThu'), c.tien2(tq.daThu)],
     [t('kConDong'), c.tien2(tq.conLai)], [t('kTyLe'), HT.fmt.pct(tq.tyLeThuHoi / 100)],
     [t('kTrenDong'), '$' + HT.fmt.n1(tq.trenMoiDong)],
     [t('kHoaVon'), tq.thangHoaVonTb == null ? '—' : tq.thangHoaVonTb + ' ' + t('thang')]]
      .map(function (r) { return '<dt>' + HM.esc(r[0]) + '</dt><dd>' + HM.esc(r[1]) + '</dd>'; }).join('') + '</dl>' +
    '<h2>' + HM.esc(t('inHd')) + '</h2><table><thead><tr>' +
      '<th>' + HM.esc(t('cDoiTac')) + '</th><th class="num">' + HM.esc(t('cGiaiNgan')) + '</th>' +
      '<th class="num">' + HM.esc(t('cDaThu')) + '</th><th class="num">' + HM.esc(t('cConLai')) + '</th>' +
      '<th class="num">' + HM.esc(t('cConThang')) + '</th><th>' + HM.esc(t('cTinhTrang')) + '</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + HM.esc(r.name + ' · ' + r.clientId) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(r.giaiNgan)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(r.daThu)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(r.conLai)) + '</td>' +
          '<td class="num">' + (r.conThang == null ? '—' : HM.esc(String(r.conThang))) + '</td>' +
          '<td>' + HM.esc(tinhTrang(c, r).chu) + '</td></tr>';
      }).join('') + '</tbody></table>' +
    '<h2>' + HM.esc(t('inLop')) + '</h2><table><thead><tr>' +
      '<th>' + HM.esc(t('cNam')) + '</th><th class="num">' + HM.esc(t('cSo')) + '</th>' +
      '<th class="num">' + HM.esc(t('cGiaiNgan')) + '</th><th class="num">' + HM.esc(t('cDaThu')) + '</th>' +
      '<th class="num">' + HM.esc(t('cTyLe')) + '</th></tr></thead><tbody>' +
      lop.map(function (x) {
        return '<tr><td>' + HM.esc(x.nam) + '</td><td class="num">' + HM.esc(HT.fmt.n(x.so)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(x.giaiNgan)) + '</td><td class="num">' + HM.esc(c.tien2(x.daThu)) + '</td>' +
          '<td class="num">' + HM.esc(HT.fmt.pct(x.tyLe / 100)) + '</td></tr>';
      }).join('') + '</tbody></table>' +
    '<div class="in-ghi">' + HM.esc(t('gd')) + '</div>';
  HM.banIn({ tieuDe: t('inTieu'), phu: t('inPhu'), than: than, nguoi: A.staff.me.name });
}

})();
