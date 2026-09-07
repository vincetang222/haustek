/* =====================================================================
   NỘI BỘ · TÍNH ROI HỢP ĐỒNG
   ---------------------------------------------------------------------
   Bản dựng lại của file ROI_Haustek.xlsx cho ba vai có quyền đề xuất:
   kinh doanh dựng thương vụ, kế toán kiểm số, giám đốc quyết. Số nhập tay
   nên chưa cần đối tác đã có trên hệ thống — vẫn tính được cho một hồ sơ
   mới đang chào. Có đối tác rồi thì bấm "Lấy số từ đối tác" để điền sẵn
   doanh thu tháng và tỷ lệ đang hưởng.

   Bốn kịch bản đúng như bốn sheet: danh mục nền và ba mốc thưởng. Mỗi ô
   kết quả ghi kèm ô Excel tương ứng để đối chiếu.
   ===================================================================== */
"use strict";
(function () {

var KHO = 'haustek.roi.v1';
var IN = {
  monthlyIncome: 3300, cashAdvance: 50000, marketing: 0, production: 0, recoupBudgets: true,
  artistShare: 74, passThrough: 0, termMonths: 60, exclusivityMonths: 36,
  findersFeePct: 0, releases: 0, hoursPerRelease: 0, costPerHour: 0,
  nguongRoi: 1, nguongThuHoi: 24, moc: false,
  t1r: '', t1x: '', t1m: '', t2r: '', t2x: '', t2m: '', t3r: '', t3x: '', t3m: ''
};
try { var luu = JSON.parse(localStorage.getItem(KHO) || 'null'); if (luu) Object.keys(IN).forEach(function (k) { if (luu[k] != null) IN[k] = luu[k]; }); } catch (e) {}
function ghiKho() { try { localStorage.setItem(KHO, JSON.stringify(IN)); } catch (e) {} }

/* Đọc lại MỌI ô nhập chứ không chỉ ô vừa gõ: HM.nhap dùng chung một đồng hồ
   hoãn cho cả trang, gõ nhanh qua vài ô thì chỉ ô cuối gọi được hàm. Quét lại
   cả trang thì mất bao nhiêu ô cũng không sao. */
function thuSo(root) {
  var ds = root.querySelectorAll('[data-r]');
  for (var i = 0; i < ds.length; i++) {
    var el = ds[i], k = el.getAttribute('data-r');
    if (el.type === 'checkbox') IN[k] = el.checked;
    else IN[k] = el.value === '' ? '' : +el.value;
  }
  ghiKho();
}

function soVao() {
  var d = { monthlyIncome: +IN.monthlyIncome || 0, cashAdvance: +IN.cashAdvance || 0,
    marketing: +IN.marketing || 0, production: +IN.production || 0, recoupBudgets: !!IN.recoupBudgets,
    artistShare: (+IN.artistShare || 0) / 100, passThrough: (+IN.passThrough || 0) / 100,
    termMonths: +IN.termMonths || 1, exclusivityMonths: +IN.exclusivityMonths || 0,
    findersFeePct: (+IN.findersFeePct || 0) / 100, releases: +IN.releases || 0,
    hoursPerRelease: +IN.hoursPerRelease || 0, costPerHour: +IN.costPerHour || 0,
    nguongRoi: +IN.nguongRoi || 0, nguongThuHoi: +IN.nguongThuHoi || 0 };
  d.triggers = [1, 2, 3].map(function (i) {
    return { reach: +IN['t' + i + 'r'] || 0, multiplier: +IN['t' + i + 'x'] || 0, withinMonths: +IN['t' + i + 'm'] || 0 };
  }).filter(function (t) { return t.reach > 0 && t.multiplier > 0; });
  return d;
}

/* một ô nhập; hau = đuôi (%, tháng, giờ…) */
function o(k, nhan, opt) {
  opt = opt || {};
  var v = IN[k] == null ? '' : IN[k];
  return '<div class="fgrp' + (opt.rong ? ' span2' : '') + '"><label class="fld" for="roi-' + k + '">' + HM.esc(nhan) + '</label>' +
    '<div class="roi-in' + (opt.hau ? ' co-hau' : '') + '"><input class="in mono" id="roi-' + k + '" data-r="' + k + '" type="number" inputmode="decimal"' +
    (opt.min != null ? ' min="' + opt.min + '"' : ' min="0"') + (opt.max != null ? ' max="' + opt.max + '"' : '') +
    ' step="' + (opt.step || 'any') + '" value="' + HM.esc(String(v)) + '">' +
    (opt.hau ? '<span class="hau">' + HM.esc(opt.hau) + '</span>' : '') + '</div>' +
    (opt.hint ? '<div class="fhint">' + HM.esc(opt.hint) + '</div>' : '') + '</div>';
}
function tick(k, nhan, hint) {
  return '<div class="fgrp span2"><label class="tickrow"><input type="checkbox" data-r="' + k + '" value="1"' + (IN[k] ? ' checked' : '') + '><span>' + HM.esc(nhan) + '</span></label>' +
    (hint ? '<div class="fhint">' + HM.esc(hint) + '</div>' : '') + '</div>';
}

HT.dangKy({
  id: 'roi', nav: 'navRoi', nhom: 'nhomTien', icon: 'chart',
  vai: ['sales', 'accounting', 'mgmt'],

  chu: {
    vi: {
      navRoi: 'Tính ROI', h1: 'Tính ROI hợp đồng',
      mo: 'Nhập điều khoản một thương vụ mua danh mục, xem Haustek thu về bao nhiêu và trong bao lâu. Số nhập tay, chưa cần đối tác có trên hệ thống.',
      dieuKhoan: 'Điều khoản thương vụ', dieuKhoanP: 'Đúng các ô đầu vào của bảng tính: doanh thu tháng, khoản ứng, tỷ lệ chia, kỳ hạn, độc quyền.',
      lDoanhThu: 'Doanh thu danh mục mỗi tháng', lUngTien: 'Ứng tiền mặt', lMkt: 'Ngân sách truyền thông', lSx: 'Ngân sách sản xuất',
      lNganSachThuHoi: 'Hai ngân sách trên cũng thu hồi được', hNganSach: 'Bỏ dấu nếu Haustek chịu, không tính vào khoản phải thu hồi.',
      lTyLe: 'Nghệ sĩ hưởng', lFlow: 'Vẫn trả nghệ sĩ trong lúc thu hồi', hFlow: 'Bảng tính gọi là pass through / flow through.',
      lKyHan: 'Kỳ hạn hợp đồng', lDocQuyen: 'Độc quyền', thang: 'tháng',
      chiPhi: 'Chi phí và ngưỡng', chiPhiP: 'Để trống thì tính như bảng tính gốc: không chi phí.',
      lMoiGioi: 'Phí môi giới', hMoiGioi: 'Phần trăm trên hoa hồng Haustek cả kỳ hạn.',
      lSoBan: 'Số bản phát hành', lGio: 'Giờ mỗi bản', lDonGia: 'Đơn giá giờ', gio: 'giờ',
      lNguongRoi: 'Ngưỡng ROI đạt', lNguongThuHoi: 'Ngưỡng tháng thu hồi',
      mocTt: 'Ba mốc thưởng', mocP: 'Nghệ sĩ đạt mốc doanh thu tháng thì ứng thêm. Kỳ hạn còn lại trừ đi số tháng đã trôi.',
      moc: 'Mốc {i}', lReach: 'Doanh thu tháng đạt mốc', lHeSo: 'Hệ số ứng', hHeSo: 'Khoản ứng = doanh thu tại mốc × hệ số.', lTrong: 'Trong vòng', batMoc: 'Tính thêm ba mốc thưởng',
      kq: 'Kết quả', roiKy: 'ROI cả kỳ hạn', roiKyS: 'hoa hồng cả kỳ hạn ÷ khoản ứng · ô J5',
      roiNam: 'ROI mỗi năm', roiNamS: 'ô K5', thuHoi: 'Thu hồi xong sau', thuHoiS: 'ô I3 · bảng gốc để dấu âm',
      hoaVon: 'Hoà vốn tháng', hoaVonS: 'tính cả hoa hồng và phần thu hồi', ung: 'Khoản ứng', ungS: 'ô B3',
      dongTien: 'Dòng tiền mỗi tháng', dongTienP: 'Doanh thu tháng chia làm ba đường.',
      rHaustek: 'Hoa hồng Haustek', rNgheSi: 'Phần nghệ sĩ', rTra: 'Vẫn trả nghệ sĩ', rThuHoi: 'Giữ lại để thu hồi',
      caKy: 'Cả kỳ hạn', rHoaHong: 'Hoa hồng cả kỳ hạn', rMoiGioi: 'Trừ phí môi giới', rChiPhi: 'Trừ chi phí bản phát hành', rNet: 'Haustek còn lại',
      rConNo: 'Hết kỳ hạn còn chưa thu hồi', rRoiThuc: 'ROI thực sau phần chưa thu hồi',
      duong: 'Đường thu hồi', duongP: 'Khoản ứng còn nợ giảm dần theo phần giữ lại mỗi tháng.', conNo: 'Còn nợ', hoaHong: 'Hoa hồng cộng dồn',
      bang: 'Bốn kịch bản', bangP: 'Danh mục nền và ba mốc thưởng, như bốn sheet trong bảng tính.',
      cKb: 'Kịch bản', cUng: 'Khoản ứng', cDt: 'Doanh thu tháng', cKyHan: 'Kỳ hạn', cThuHoi: 'Thu hồi', cRoi: 'ROI kỳ hạn', cRoiNam: 'ROI năm', cKl: 'Kết luận',
      tong: 'Cộng cả bốn', klDat: 'Đạt', klCanXem: 'Cần cân nhắc', klKhong: 'Chưa đạt', klThieu: 'Còn thiếu số',
      lyDo: 'Vì sao', ganDoiTac: 'Lấy số từ đối tác', datLai: 'Đặt lại', chonDoiTac: 'Đối tác (tên hoặc mã)',
      daLay: 'Đã lấy số của {t}', khongThay: 'Không tìm thấy đối tác “{q}”', chuaCoSo: '{t} chưa có kỳ nào có số để lấy',
      daDatLai: 'Đã đặt lại về số mẫu', taoDx: 'Tạo đề xuất tạm ứng',
      soSanh: 'Hai thang ROI trong phần mềm', soSanhP: 'Trang này và trang Xét duyệt trả lời hai câu khác nhau, đừng so thẳng hai con số.',
      ss1: 'ROI ở trang này', ss1v: 'Hoa hồng Haustek trên toàn kỳ hạn chia cho khoản ứng. Dùng lúc chào một thương vụ mua danh mục.',
      ss2: 'ROI ở trang Xét duyệt', ss2v: 'Phí ứng cộng phần Haustek giữ trong thời gian thu hồi, chia cho khoản ứng. Dùng cho tạm ứng trên tài khoản đã chạy.',
      sua: 'Bốn chỗ bảng tính tính lệch', suaP: 'Trang này tính lại; bảng gốc nên sửa theo.',
      sua1: 'Ô I3 =(H3/G3)-1 rút gọn thành −B3/G3 nên số tháng thu hồi luôn âm. Đúng là B3/G3.',
      sua2: 'Ô J11 =J9*J6*J7 lấy J6 là ô trống không nhãn, nên tổng chi phí luôn bằng 0 và ROI sau chi phí luôn bằng ROI.',
      sua3: 'Ô D7 ở sheet Catalog không trừ chi phí, ba sheet Trigger thì có; cả bốn đều không trừ phí môi giới.',
      sua4: 'Không sheet nào kiểm khoản ứng có thu hồi kịp trong kỳ hạn không. Hết hạn còn nợ thì phần đó là lỗ.',
      trong: 'Nhập doanh thu tháng và khoản ứng để bắt đầu', trongMo: 'Hai ô đầu ở khung bên trái là đủ để ra kết quả.'
    },
    en: {
      navRoi: 'Deal ROI', h1: 'Deal ROI calculator',
      mo: 'Enter the terms of a catalogue deal and see what Haustek gets back and how fast. Figures are typed in, so the partner need not exist in the system yet.',
      dieuKhoan: 'Deal terms', dieuKhoanP: 'The same inputs as the spreadsheet: monthly income, advance, split, term, exclusivity.',
      lDoanhThu: 'Catalogue income per month', lUngTien: 'Cash advance', lMkt: 'Marketing budget', lSx: 'Production budget',
      lNganSachThuHoi: 'Both budgets are recoupable too', hNganSach: 'Untick if Haustek carries them outside the recoupable amount.',
      lTyLe: 'Artist keeps', lFlow: 'Still paid to the artist while recouping', hFlow: 'The spreadsheet calls it pass through / flow through.',
      lKyHan: 'Deal term', lDocQuyen: 'Exclusivity', thang: 'months',
      chiPhi: 'Costs and targets', chiPhiP: 'Leave empty to match the original spreadsheet: no costs.',
      lMoiGioi: 'Finder’s fee', hMoiGioi: 'Percentage of Haustek’s commission over the term.',
      lSoBan: 'Releases', lGio: 'Hours per release', lDonGia: 'Cost per hour', gio: 'hours',
      lNguongRoi: 'ROI target', lNguongThuHoi: 'Recoupment target',
      mocTt: 'Three triggers', mocP: 'Reaching a monthly-income milestone unlocks another advance. The remaining term drops by the months elapsed.',
      moc: 'Trigger {i}', lReach: 'Monthly income at the milestone', lHeSo: 'Advance multiple', hHeSo: 'Advance = income at the milestone × multiple.', lTrong: 'Within', batMoc: 'Include the three triggers',
      kq: 'Result', roiKy: 'ROI over the term', roiKyS: 'commission over the term ÷ advance · cell J5',
      roiNam: 'ROI per year', roiNamS: 'cell K5', thuHoi: 'Recouped after', thuHoiS: 'cell I3 · negative in the original',
      hoaVon: 'Break-even month', hoaVonS: 'commission plus recoupment', ung: 'Advance', ungS: 'cell B3',
      dongTien: 'Monthly cash flow', dongTienP: 'The monthly income splits three ways.',
      rHaustek: 'Haustek commission', rNgheSi: 'Artist share', rTra: 'Still paid to the artist', rThuHoi: 'Held to recoup',
      caKy: 'Over the term', rHoaHong: 'Commission over the term', rMoiGioi: 'Less finder’s fee', rChiPhi: 'Less release costs', rNet: 'Haustek keeps',
      rConNo: 'Unrecouped at the end of the term', rRoiThuc: 'ROI after the unrecouped part',
      duong: 'Recoupment curve', duongP: 'The outstanding advance falls by the amount held back each month.', conNo: 'Outstanding', hoaHong: 'Cumulative commission',
      bang: 'Four scenarios', bangP: 'The base catalogue and three triggers, as in the four sheets.',
      cKb: 'Scenario', cUng: 'Advance', cDt: 'Monthly income', cKyHan: 'Term', cThuHoi: 'Recoup', cRoi: 'ROI / term', cRoiNam: 'ROI / year', cKl: 'Verdict',
      tong: 'All four', klDat: 'Passes', klCanXem: 'Worth a look', klKhong: 'Below target', klThieu: 'Figures missing',
      lyDo: 'Why', ganDoiTac: 'Pull from a partner', datLai: 'Reset', chonDoiTac: 'Partner (name or id)',
      daLay: 'Pulled {t}’s figures', khongThay: 'No partner matching “{q}”', chuaCoSo: '{t} has no periods with figures yet',
      daDatLai: 'Reset to the sample figures', taoDx: 'Create an advance proposal',
      soSanh: 'Two ROI scales in the software', soSanhP: 'This page and Approvals answer different questions; do not compare the two numbers directly.',
      ss1: 'ROI on this page', ss1v: 'Haustek’s commission over the whole term divided by the advance. For pitching a catalogue deal.',
      ss2: 'ROI in Approvals', ss2v: 'Advance fee plus what Haustek keeps during recoupment, divided by the advance. For an advance on an account already running.',
      sua: 'Four figures the spreadsheet gets wrong', suaP: 'This page recomputes them; the original is worth fixing too.',
      sua1: 'Cell I3 =(H3/G3)-1 reduces to −B3/G3, so months to recoup always comes out negative. It should be B3/G3.',
      sua2: 'Cell J11 =J9*J6*J7 reads J6, an unlabelled empty cell, so total cost is always 0 and ROI after costs always equals ROI.',
      sua3: 'Cell D7 on the Catalog sheet does not subtract cost while the three Trigger sheets do; none of the four subtract the finder’s fee.',
      sua4: 'No sheet checks whether the advance recoups inside the term. Anything left at the end is a loss.',
      trong: 'Enter a monthly income and an advance to start', trongMo: 'The first two boxes on the left are enough for a result.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: '<button type="button" class="btn" data-lay>' + HM.icon('down2') + HM.esc(t('ganDoiTac')) + '</button>' +
           '<button type="button" class="btn ghost" data-dat-lai>' + HM.esc(t('datLai')) + '</button>' });

    html += '<div class="grid g3">' +
      /* ---- cột trái: đầu vào ---- */
      '<div>' + '<div id="roi-kq"></div>' + '</div>' +
      '<div>' +
        HM.the({ h2: HM.esc(t('dieuKhoan')), p: HM.esc(t('dieuKhoanP')),
          than: '<div class="fldrow two-up">' +
            o('monthlyIncome', t('lDoanhThu'), { hau: '$', step: '1' }) +
            o('cashAdvance', t('lUngTien'), { hau: '$', step: '100' }) +
            o('marketing', t('lMkt'), { hau: '$', step: '100' }) +
            o('production', t('lSx'), { hau: '$', step: '100' }) +
            tick('recoupBudgets', t('lNganSachThuHoi'), t('hNganSach')) +
            o('artistShare', t('lTyLe'), { hau: '%', max: 100, step: '0.5' }) +
            o('passThrough', t('lFlow'), { hau: '%', max: 100, step: '1', hint: t('hFlow') }) +
            o('termMonths', t('lKyHan'), { hau: t('thang'), step: '1', min: 1 }) +
            o('exclusivityMonths', t('lDocQuyen'), { hau: t('thang'), step: '1' }) +
          '</div>' }) +
        HM.the({ h2: HM.esc(t('chiPhi')), p: HM.esc(t('chiPhiP')),
          than: '<div class="fldrow two-up">' +
            o('findersFeePct', t('lMoiGioi'), { hau: '%', max: 100, step: '0.5', hint: t('hMoiGioi') }) +
            o('releases', t('lSoBan'), { step: '1' }) +
            o('hoursPerRelease', t('lGio'), { hau: t('gio'), step: '0.5' }) +
            o('costPerHour', t('lDonGia'), { hau: '$', step: '1' }) +
            o('nguongRoi', t('lNguongRoi'), { hau: '×', step: '0.05' }) +
            o('nguongThuHoi', t('lNguongThuHoi'), { hau: t('thang'), step: '1' }) +
          '</div>' }) +
        HM.the({ h2: HM.esc(t('mocTt')), p: HM.esc(t('mocP')),
          than: '<div class="fldrow two-up">' + tick('moc', t('batMoc')) + '</div>' +
            (IN.moc ? [1, 2, 3].map(function (i) {
              return '<div class="roi-moc"><div class="roi-moc-t">' + HM.esc(t('moc').replace('{i}', i)) + '</div><div class="fldrow two-up">' +
                o('t' + i + 'r', t('lReach'), { hau: '$', step: '100' }) +
                o('t' + i + 'x', t('lHeSo'), { hau: '×', step: '0.5', hint: i === 1 ? t('hHeSo') : '' }) +
                o('t' + i + 'm', t('lTrong'), { hau: t('thang'), step: '1' }) +
              '</div></div>';
            }).join('') : '') }) +
      '</div>' +
    '</div>';

    root.innerHTML = html;

    /* --------------- vẽ lại riêng phần kết quả --------------- */
    function veKq() {
      var d = soVao();
      var k = A.roi.tinh(d);
      var kb = A.roi.kichBan(d);
      var box = root.querySelector('#roi-kq');
      if (!box) return;
      if (!(k.monthlyIncome > 0 && k.advance > 0)) {
        box.innerHTML = HM.the({ h2: HM.esc(t('kq')), than: HM.trong({ icon: 'chart', tieuDe: t('trong'), moTa: t('trongMo') }) });
        return;
      }
      var h = '';
      var mauKl = k.recommendation === 'approve' ? HB.mau('ok') : k.recommendation === 'review' ? HB.mau('warn') : HB.mau('no');
      var chuKl = k.recommendation === 'approve' ? t('klDat') : k.recommendation === 'review' ? t('klCanXem') : k.recommendation === 'incomplete' ? t('klThieu') : t('klKhong');

      h += HM.so([
        { l: t('roiKy'), v: k.roiAfterCosts == null ? '—' : k.roiAfterCosts.toFixed(2) + '×', lon: true, s: t('roiKyS'), mau: mauKl },
        { l: t('roiNam'), v: k.roiAfterCostsYearly == null ? '—' : HT.fmt.pct(k.roiAfterCostsYearly), s: t('roiNamS') },
        { l: t('thuHoi'), v: k.recoupMonths == null ? '—' : k.recoupWhole + ' ' + t('thang'), s: t('thuHoiS') },
        { l: t('hoaVon'), v: k.paybackMonth == null ? '—' : k.paybackMonth + ' ' + t('thang'), s: t('hoaVonS') },
        { l: t('ung'), v: c.tien(k.advance), s: t('ungS') }
      ]);

      h += HM.the({ dai: { kieu: k.recommendation === 'approve' ? 'ok' : k.recommendation === 'review' ? 'warn' : 'no',
          icon: k.recommendation === 'approve' ? 'check' : 'alert', chu: HM.esc(chuKl) },
        h2: HM.esc(t('dongTien')), p: HM.esc(t('dongTienP')),
        than: HM.kv([
          { t: t('rHaustek') + ' · D3', v: c.tien(k.companyMonthly), manh: true },
          { t: t('rNgheSi') + ' · D4', v: c.tien(k.artistMonthly) },
          k.passThroughMonthly > 0 ? { t: t('rTra') + ' · F3', v: c.tien(k.passThroughMonthly) } : null,
          { t: t('rThuHoi') + ' · G3', v: c.tien(k.recoupableMonthly), manh: true }
        ]) + '<div class="roi-chia"></div>' + HM.kv([
          { t: t('rHoaHong') + ' · D5', v: c.tien(k.totalOverTerm) },
          k.findersFee > 0 ? { t: t('rMoiGioi') + ' · J10', v: '− ' + c.tien(k.findersFee) } : null,
          k.totalCost > 0 ? { t: t('rChiPhi') + ' · J11', v: '− ' + c.tien(k.totalCost) } : null,
          { t: t('rNet') + ' · D7', v: c.tien(k.netForCompany), manh: true },
          k.shortfall > 0 ? { t: t('rConNo'), v: c.tien(k.shortfall), mau: 'neg' } : null,
          k.shortfall > 0 ? { t: t('rRoiThuc'), v: k.roiNet.toFixed(2) + '×', manh: true, mau: 'neg' } : null
        ]),
        chan: k.reasons.length ? '<b>' + HM.esc(t('lyDo')) + ':</b> ' + HM.esc(k.reasons.map(function (r) { return c.lang === 'en' ? r.en : r.vi; }).join(' · ')) : '' });

      var truc = k.series.map(function (s) { return String(s.month); });
      h += HM.the({ h2: HM.esc(t('duong')), p: HM.esc(t('duongP')),
        than: HB.o({ loai: 'duong', cao: 190, chuThich: true, truc: truc,
          tieuDeTip: function (i) { return truc[i] + ' ' + t('thang'); },
          chuoi: [{ ten: t('conNo'), gt: k.series.map(function (s) { return s.conNo; }), mau: HB.mau('no') },
                  { ten: t('hoaHong'), gt: k.series.map(function (s) { return s.hoaHong; }), mau: HB.mau('ok') }] }) });

      if (kb.rows.length > 1) {
        h += HM.the({ h2: HM.esc(t('bang')), p: HM.esc(t('bangP')),
          than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cKb')) + '</th><th class="num">' + HM.esc(t('cDt')) + '</th><th class="num">' + HM.esc(t('cUng')) +
            '</th><th class="num">' + HM.esc(t('cKyHan')) + '</th><th class="num">' + HM.esc(t('cThuHoi')) + '</th><th class="num band">' + HM.esc(t('cRoi')) +
            '</th><th class="num">' + HM.esc(t('cRoiNam')) + '</th><th>' + HM.esc(t('cKl')) + '</th></tr></thead><tbody>' +
            kb.rows.map(function (r) {
              var x = r.calc, kl = x.recommendation;
              return '<tr><td>' + HM.esc(c.lang === 'en' ? r.en : r.vi) + '</td>' +
                '<td class="num mono">' + HM.esc(c.tien(x.monthlyIncome)) + '</td>' +
                '<td class="num mono">' + HM.esc(c.tien(x.advance)) + '</td>' +
                '<td class="num mono">' + x.termMonths + '</td>' +
                '<td class="num mono">' + (x.recoupWhole == null ? '—' : x.recoupWhole) + '</td>' +
                '<td class="num band mono"><b>' + (x.roiAfterCosts == null ? '—' : x.roiAfterCosts.toFixed(2) + '×') + '</b></td>' +
                '<td class="num mono">' + (x.roiAfterCostsYearly == null ? '—' : HM.esc(HT.fmt.pct(x.roiAfterCostsYearly))) + '</td>' +
                '<td>' + HM.tag(kl === 'approve' ? t('klDat') : kl === 'review' ? t('klCanXem') : kl === 'incomplete' ? t('klThieu') : t('klKhong'),
                  kl === 'approve' ? 'ok' : kl === 'review' ? 'warn' : 'no') + '</td></tr>';
            }).join('') +
            '<tr class="sum"><td><b>' + HM.esc(t('tong')) + '</b></td><td></td><td class="num mono"><b>' + HM.esc(c.tien(kb.tong.advance)) +
            '</b></td><td></td><td></td><td class="num band mono"><b>' + (kb.tong.roi == null ? '—' : kb.tong.roi.toFixed(2) + '×') + '</b></td><td></td><td></td></tr>' +
            '</tbody></table></div>' });
      }

      h += '<div class="grid g2">' +
        HM.the({ h2: HM.esc(t('soSanh')), p: HM.esc(t('soSanhP')),
          than: HM.kv([{ t: t('ss1'), v: t('ss1v') }, { t: t('ss2'), v: t('ss2v') }]) }) +
        HM.the({ h2: HM.esc(t('sua')), p: HM.esc(t('suaP')),
          than: '<ul class="say-list">' + [t('sua1'), t('sua2'), t('sua3'), t('sua4')].map(function (x) { return '<li>' + HM.esc(x) + '</li>'; }).join('') + '</ul>' }) +
      '</div>';

      box.innerHTML = h;
      HB.gan(box);
    }
    veKq();

    /* --------------- nhập liệu --------------- */
    HM.nhap(root, 'input[data-r]', function () { thuSo(root); veKq(); }, 200);
    HM.doi(root, 'input[data-r]', function (el) {
      thuSo(root);
      if (el.getAttribute('data-r') === 'moc') c.veLai(); else veKq();
    });

    HM.bam(root, '[data-dat-lai]', function () {
      try { localStorage.removeItem(KHO); } catch (e) {}
      IN.monthlyIncome = 3300; IN.cashAdvance = 50000; IN.marketing = 0; IN.production = 0; IN.recoupBudgets = true;
      IN.artistShare = 74; IN.passThrough = 0; IN.termMonths = 60; IN.exclusivityMonths = 36;
      IN.findersFeePct = 0; IN.releases = 0; IN.hoursPerRelease = 0; IN.costPerHour = 0;
      IN.nguongRoi = 1; IN.nguongThuHoi = 24; IN.moc = false;
      [1, 2, 3].forEach(function (i) { IN['t' + i + 'r'] = ''; IN['t' + i + 'x'] = ''; IN['t' + i + 'm'] = ''; });
      c.thongBao(t('daDatLai'), 'ok'); c.veLai();
    });

    HM.bam(root, '[data-lay]', function () {
      HTM.hoiForm(c, { tieuDe: t('ganDoiTac'), rong: false,
        fields: [{ k: 'q', l: t('chonDoiTac'), req: true, ph: 'Trí Minh' }] }).then(function (f) {
        if (!f) return;
        var q = String(f.q).trim().toLowerCase();
        var ds = A.parties.list({ q: q }).rows || [];
        var hit = ds[0];
        if (!hit) { c.thongBao(t('khongThay').replace('{q}', f.q), 'no'); return; }
        var d = A.roi.tuDoiTac(hit.partyKey);
        if (!d || !d.monthlyIncome) { c.thongBao(t('chuaCoSo').replace('{t}', hit.name), 'warn'); return; }
        IN.monthlyIncome = Math.round(d.monthlyIncome);
        if (d.artistShare != null) IN.artistShare = Math.round(d.artistShare * 1000) / 10;
        if (d.termMonths) IN.termMonths = d.termMonths;
        ghiKho(); c.thongBao(t('daLay').replace('{t}', hit.name), 'ok'); c.veLai();
      });
    });
  }
});

})();
