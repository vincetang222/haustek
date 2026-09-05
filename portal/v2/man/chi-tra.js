/* =====================================================================
   NỘI BỘ · CHI TRẢ
   ---------------------------------------------------------------------
   Bảng này là thứ người làm ngân hàng cầm đi chuyển tiền. Nó phải trả
   lời được ba câu cho từng dòng:
     · vì sao số này, không phải số khác;
     · vì sao người này kỳ trước có tiền mà kỳ này không;
     · phần chênh giữa "kiếm được" và "được nhận" đi đâu.
   Ba câu đó chính là ba cột: thu hồi tạm ứng, ngưỡng chi trả, và phần
   dồn sang kỳ sau.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'ky', nhom: 'chi', tim: '', loai: '', rutTt: '', rutTim: '', bkTim: '' };
var KIEU_RUT = { requested: 'info', processing: 'warn', paid: 'ok', rejected: 'no', cancelled: '' };
var SAU = [];

HT.dangKy({
  id: 'chi-tra', nav: 'navChiTra', nhom: 'nhomTien', icon: 'cash',

  chu: {
    vi: {
      navChiTra: 'Thanh toán', h1: 'Thanh toán',
      mo: 'Bên nào được thanh toán bao nhiêu trong kỳ này, và vì sao phần còn lại chưa được thanh toán.',
      xemTruoc: 'Bản xem trước: kỳ chưa xét duyệt nên chưa có bảng thanh toán nào ghi vào sổ.',
      daGhi: 'Bảng thanh toán đã ghi vào sổ lúc xét duyệt kỳ.',
      seChi: 'Sẽ thanh toán kỳ này', soBen: 'Số bên được thanh toán',
      thuUng: 'Thu hồi tạm ứng', donSang: 'Chuyển sang kỳ sau', giuLai: 'Giữ lại, chưa xác định người thụ hưởng',
      nhomChi: 'Được thanh toán', nhomDon: 'Dưới ngưỡng thanh toán', nhomUng: 'Đang thu hồi tạm ứng', nhomHet: 'Tất cả',
      tim: 'Tìm theo tên hoặc mã bên thụ hưởng…', tatCaLoai: 'Mọi loại',
      cBen: 'Bên thụ hưởng', cLoai: 'Loại', cKiem: 'Được hưởng', cDon: 'Chuyển từ kỳ trước',
      cThu: 'Thu hồi tạm ứng', cChi: 'Sẽ thanh toán', cCon: 'Chuyển sang kỳ sau', cUng: 'Tạm ứng còn phải thu hồi',
      xuat: 'Xuất danh sách chuyển khoản', tong: 'Tổng cộng',
      nguong: 'Ngưỡng thanh toán tối thiểu', nguongMo: 'Khoản dưới ngưỡng không mất đi, mà được chuyển sang kỳ sau và cộng vào số thanh toán của kỳ đó. Ngưỡng tồn tại vì phí chuyển khoản quốc tế có thể bằng hoặc vượt cả một khoản nhỏ.',
      khongAi: 'Không có bên thụ hưởng nào khớp bộ lọc',
      chiTiet: 'Chi tiết dòng tiền: từ doanh thu đến số thanh toán',
      tabKy: 'Thanh toán theo kỳ', tabRut: 'Yêu cầu rút tiền', tabBk: 'Bảng kê PDF',
      rTong: 'Đang chờ chuyển khoản', rTongS: 'yêu cầu chờ xử lý', rXuLy: 'Đang chuyển khoản', rDaChuyen: 'Đã chuyển khoản', rTuChoi: 'Từ chối hoặc huỷ',
      rMo: 'Đối tác gửi yêu cầu rút tiền từ ví trên cổng của họ. Kế toán tiếp nhận, chuyển khoản rồi ghi số tham chiếu; đối tác thấy trạng thái ngay trên cổng.',
      rTim: 'Tìm mã yêu cầu, tên hoặc mã đối tác…', rTatCa: 'Tất cả',
      requested: 'Chờ xử lý', processing: 'Đang chuyển', paid: 'Đã chuyển', rejected: 'Từ chối', cancelled: 'Đã huỷ',
      rcDoiTac: 'Đối tác', rcSoTien: 'Số tiền', rcNgay: 'Ngày yêu cầu', rcNh: 'Tài khoản nhận', rcTt: 'Trạng thái', rcThaoTac: 'Thao tác',
      tiepNhan: 'Tiếp nhận', daChuyen: 'Đã chuyển khoản', tuChoi: 'Từ chối', taoHo: 'Tạo yêu cầu hộ đối tác',
      hoiChuyen: 'Xác nhận đã chuyển khoản', hoiChuyenMo: 'Ghi số tham chiếu lệnh chuyển khoản. Đối tác thấy số này trên cổng của họ.', hThamChieu: 'Số tham chiếu lệnh chuyển khoản',
      hoiTuChoi: 'Từ chối yêu cầu rút tiền', hoiTuChoiMo: 'Số tiền quay lại số dư khả dụng của đối tác. Lý do hiện trên cổng đối tác.', hLyDo: 'Lý do từ chối',
      hoiTaoHo: 'Tạo yêu cầu rút tiền hộ đối tác', hoiTaoHoMo: 'Dùng khi đối tác gọi điện hoặc gửi email. Số tiền phải từ ngưỡng tối thiểu tới số dư khả dụng và đối tác đã khai tài khoản ngân hàng.',
      hDoiTac: 'Mã đối tác', hSoTien: 'Số tiền (USD)', hGhi: 'Ghi chú',
      daTiepNhan: 'Đã tiếp nhận yêu cầu', daGhiChuyen: 'Đã ghi chuyển khoản', daTuChoi: 'Đã từ chối yêu cầu', daTaoHo: 'Đã tạo yêu cầu',
      khongRut: 'Không có yêu cầu nào', khongRutMo: 'Đổi bộ lọc phía trên, hoặc tạo yêu cầu hộ đối tác.',
      lichSu: 'Lịch sử', viDoiTac: 'Ví của đối tác', viKhaDung: 'Khả dụng', viCho: 'Đang xử lý', viDaRut: 'Đã rút',
      thamChieu: 'Số tham chiếu', lyDo: 'Lý do', ghiChu: 'Ghi chú', khongGhi: 'không có', chuyenLuc: 'Chuyển khoản lúc', nguoiTao: 'Người tạo',
      bkMo: 'Mỗi bên thụ hưởng của kỳ đã xét duyệt nhận một bảng kê PDF do Haustek lập, ghi đầy đủ căn cứ tính và các khoản khấu trừ. Đối tác tải ở trang Bảng kê trên cổng của họ.',
      bkDaDinh: 'Đã đính kèm', bkThieu: 'Còn thiếu', bkTong: 'Bên thụ hưởng', bkDinhHet: 'Đính kèm tất cả (bản mẫu)', bkDinh: 'Đính kèm', bkGo: 'Gỡ', bkTim: 'Tìm bên thụ hưởng…',
      cGhiVi: 'Ghi vào ví', cPdf: 'Bảng kê PDF',
      hoiDinh: 'Đính kèm bảng kê PDF', hoiDinhMo: 'Bản mẫu chỉ ghi tên tệp; hệ thống thật tải tệp lên kho tài liệu và đối tác nhận thông báo.', hTep: 'Tên tệp PDF',
      daDinh: 'Đã đính kèm bảng kê', daGo: 'Đã gỡ bảng kê', daDinhHet: 'Đã đính kèm bảng kê cho mọi bên thụ hưởng của kỳ',
      bkChuaDuyet: 'Kỳ chưa xét duyệt', bkChuaDuyetMo: 'Bảng kê chỉ lập được sau khi kỳ được xét duyệt. Chọn một kỳ đã xét duyệt ở thanh trên hoặc ở danh sách dưới.',
      bkTheoKy: 'Bảng kê theo kỳ', bkTheoKyMo: 'Số bảng kê đã đính kèm trên tổng số bên thụ hưởng của từng kỳ đã xét duyệt. Bấm để chuyển kỳ.'
    },
    en: {
      navChiTra: 'Payouts', h1: 'Payouts',
      mo: 'Who receives what this period, and why the rest has not reached them.',
      xemTruoc: 'Preview — the period is unapproved so no table has been written.',
      daGhi: 'The payout table was written when the period was approved.',
      seChi: 'Payable this period', soBen: 'Payees paid',
      thuUng: 'Recouped against advances', donSang: 'Carried to next period', giuLai: 'Held, no owner',
      nhomChi: 'Being paid', nhomDon: 'Below threshold', nhomUng: 'Recouping', nhomHet: 'All',
      tim: 'Search payee name or code…', tatCaLoai: 'All kinds',
      cBen: 'Payee', cLoai: 'Kind', cKiem: 'Earned', cDon: 'Carried in',
      cThu: 'Recouped', cChi: 'Payable', cCon: 'Carried out', cUng: 'Advance left',
      xuat: 'Export transfer list', tong: 'Total',
      nguong: 'Payout threshold', nguongMo: 'Below the threshold nothing is lost — it carries forward and is added to the next period. The threshold exists because international transfer fees eat a small amount whole.',
      khongAi: 'No payee matches the filters',
      chiTiet: 'Payee money chain',
      tabKy: 'Payouts by period', tabRut: 'Withdrawal requests', tabBk: 'PDF statements',
      rTong: 'Waiting to be transferred', rTongS: 'requests waiting', rXuLy: 'Being transferred', rDaChuyen: 'Transferred', rTuChoi: 'Rejected or cancelled',
      rMo: 'Partners request withdrawals from their wallet on the portal. Accounting accepts, transfers and records the reference; the partner sees the status on the portal at once.',
      rTim: 'Search request ID, partner name or client ID…', rTatCa: 'All',
      requested: 'Requested', processing: 'Processing', paid: 'Paid', rejected: 'Rejected', cancelled: 'Cancelled',
      rcDoiTac: 'Partner', rcSoTien: 'Amount', rcNgay: 'Requested', rcNh: 'Payout account', rcTt: 'Status', rcThaoTac: 'Actions',
      tiepNhan: 'Accept', daChuyen: 'Mark transferred', tuChoi: 'Reject', taoHo: 'Log a request for a partner',
      hoiChuyen: 'Confirm the transfer', hoiChuyenMo: 'Record the bank transfer reference. The partner sees it on their portal.', hThamChieu: 'Transfer reference',
      hoiTuChoi: 'Reject the withdrawal', hoiTuChoiMo: 'The amount returns to the partner’s available balance. The reason is shown on their portal.', hLyDo: 'Reason',
      hoiTaoHo: 'Log a withdrawal for a partner', hoiTaoHoMo: 'For partners who phone or email. The amount must be between the minimum and the available balance, and the partner needs a bank account on file.',
      hDoiTac: 'Client ID', hSoTien: 'Amount (USD)', hGhi: 'Note',
      daTiepNhan: 'Request accepted', daGhiChuyen: 'Transfer recorded', daTuChoi: 'Request rejected', daTaoHo: 'Request logged',
      khongRut: 'No requests', khongRutMo: 'Change the filters above, or log one for a partner.',
      lichSu: 'History', viDoiTac: 'Partner wallet', viKhaDung: 'Available', viCho: 'In progress', viDaRut: 'Withdrawn',
      thamChieu: 'Reference', lyDo: 'Reason', ghiChu: 'Note', khongGhi: 'none', chuyenLuc: 'Transferred at', nguoiTao: 'Created by',
      bkMo: 'Every payee of an approved period gets a PDF statement prepared by Haustek with the full basis of calculation and every deduction. Partners download it on their Statement page.',
      bkDaDinh: 'Attached', bkThieu: 'Missing', bkTong: 'Payees', bkDinhHet: 'Attach all (prototype)', bkDinh: 'Attach', bkGo: 'Remove', bkTim: 'Search payee…',
      cGhiVi: 'Credited', cPdf: 'PDF statement',
      hoiDinh: 'Attach a PDF statement', hoiDinhMo: 'The prototype records the file name; the real system uploads the file and notifies the partner.', hTep: 'PDF file name',
      daDinh: 'Statement attached', daGo: 'Statement removed', daDinhHet: 'Statements attached for every payee of the period',
      bkChuaDuyet: 'Period not approved', bkChuaDuyetMo: 'Statements exist only after the period is approved. Pick an approved period in the top bar or in the list below.',
      bkTheoKy: 'Statements by period', bkTheoKyMo: 'Attached statements over the number of payees for each approved period. Click to switch period.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, pi = c.ky.idx, duyet = A.isApproved(c.kyKey);
    var rows = duyet ? A.payoutOf(c.kyKey) : HM.nho(A, 'xem:' + pi, function () { return A.previewPayout(pi); });
    var P = HB.dayMau();
    SAU = [];

    var tong = { earned: 0, carryIn: 0, recoup: 0, payable: 0, carryOut: 0, giu: 0 };
    rows.forEach(function (r) {
      if (r.held) { tong.giu += r.earned; return; }
      tong.earned += r.earned; tong.carryIn += r.carryIn; tong.recoup += r.recoup;
      tong.payable += r.payable; tong.carryOut += r.carryOut;
    });

    var ds = rows.filter(function (r) { return !r.held; }).map(function (r) {
      return {
        key: r.partyKey, ten: A.partyName(r.partyKey), ma: A.partyClientId(r.partyKey),
        loai: r.kind, earned: r.earned, carryIn: r.carryIn, recoup: r.recoup,
        payable: r.payable, carryOut: r.carryOut, ung: r.advanceLeft
      };
    });
    var loc = ds.filter(function (r) {
      if (LOC.nhom === 'chi' && !(r.payable > 0)) return false;
      if (LOC.nhom === 'don' && !(r.carryOut > 0)) return false;
      if (LOC.nhom === 'ung' && !(r.recoup > 0)) return false;
      if (LOC.loai && r.loai !== LOC.loai) return false;
      if (LOC.tim) {
        var q = LOC.tim.toLowerCase();
        if (r.ten.toLowerCase().indexOf(q) < 0 && r.ma.toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
    var demChi = ds.filter(function (r) { return r.payable > 0; }).length;

    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>',
      mo: HM.esc(t('mo')),
      so: [
        { l: t('seChi'), v: c.tien(tong.payable) },
        { l: t('soBen'), v: HT.fmt.n(demChi) },
        { l: t('nguong'), v: HT.fmt.usd0(A.cfg.PAYOUT_MIN) }
      ]
    });
    var wc = A.withdrawals.counts();
    html += HM.tabs([
      { k: 'ky', l: t('tabKy'), icon: 'cash' },
      { k: 'rut', l: t('tabRut'), icon: 'swap', dem: wc.requested + wc.processing ? String(wc.requested + wc.processing) : undefined },
      { k: 'bk', l: t('tabBk'), icon: 'file' }
    ], LOC.tab);
    if (LOC.tab === 'rut' || LOC.tab === 'bk') {
      html += LOC.tab === 'rut' ? veRut(c) : veBangKe(c);
      root.innerHTML = html;
      if (LOC.tab === 'bk') dungBangBk(root, c);
      HB.gan(root);
      ganTab(root, c);
      return;
    }

    html += HM.ghi({ kieu: duyet ? 'ok' : 'info',
      tieuDe: HM.esc(duyet ? t('daGhi') : t('xemTruoc')),
      than: HM.esc(duyet
        ? (c.lang === 'vi' ? 'Xét duyệt lúc ' + HT.fmt.luc(A.approvalOf(c.kyKey).at) + ', người xét duyệt: ' + A.approvalOf(c.kyKey).by +
            '. Các số dưới đây là số đã thanh toán, không tính lại.'
          : 'Approved ' + HT.fmt.luc(A.approvalOf(c.kyKey).at) + ' by ' + A.approvalOf(c.kyKey).by +
            '. These are the figures money moved on — not recomputed.')
        : (c.lang === 'vi' ? 'Bảng được tính lại từ dữ liệu hiện có mỗi lần mở trang này. Nhập thêm nguồn báo cáo hoặc khớp thêm dòng thì con số sẽ thay đổi.'
          : 'Recomputed from current data each time this screen opens. Loading a feed or matching a row changes it.')),
      nut: '<button type="button" class="btn sm" data-di="doi-chieu">' +
        HM.esc(c.lang === 'vi' ? 'Mở trang xét duyệt kỳ' : 'Approval screen') + '</button>' });

    html += HM.so([
      { l: t('seChi'), v: c.tien(tong.payable), lon: true },
      { l: t('thuUng'), v: c.tien(tong.recoup), mau: tong.recoup > 0 ? HB.mau('warn') : '' },
      { l: t('donSang'), v: c.tien(tong.carryOut),
        s: HT.fmt.n(ds.filter(function (r) { return r.carryOut > 0; }).length) + (c.lang === 'vi' ? ' bên thụ hưởng' : ' payees') },
      { l: t('giuLai'), v: c.tien(tong.giu) },
      { l: c.lang === 'vi' ? 'Chuyển từ kỳ trước' : 'Carried in', v: c.tien(tong.carryIn) }
    ]);

    html += '<div class="grid g3">' +
      HM.the({
        h2: c.lang === 'vi' ? 'Phân bổ phần được hưởng của kỳ này' : 'Where the period’s earnings went',
        than: HB.o({ loai: 'thac', cao: 210, buoc: [
          { l: c.lang === 'vi' ? 'Được hưởng' : 'Earned', v: tong.earned + tong.giu, kind: 'top',
            nt: c.lang === 'vi' ? 'tổng phần được hưởng của mọi bên thụ hưởng' : 'everything owed to payees' },
          { l: c.lang === 'vi' ? 'Producer' : 'Producers', v: -tong.giu, kind: 'out',
            nt: c.lang === 'vi' ? 'chưa xác định người thụ hưởng' : 'no identity to pay' },
          { l: c.lang === 'vi' ? 'Tạm ứng' : 'Advances', v: -tong.recoup, kind: 'out',
            nt: c.lang === 'vi' ? 'thu hồi khoản đã tạm ứng' : 'offset against money already advanced' },
          { l: c.lang === 'vi' ? 'Chuyển kỳ sau' : 'Carried', v: -tong.carryOut, kind: 'out',
            nt: c.lang === 'vi' ? 'dưới ngưỡng ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) : 'below ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) },
          { l: c.lang === 'vi' ? 'Thanh toán' : 'Paid', v: tong.payable, kind: 'final' }
        ] }),
        chan: c.lang === 'vi'
          ? 'Cột đầu chưa gồm phần chuyển từ kỳ trước (' + HM.esc(c.tien2(tong.carryIn)) + '). Phần đó cũng nằm trong số thanh toán.'
          : 'The first column excludes the carry-in (' + HM.esc(c.tien2(tong.carryIn)) + '), which is also inside the paid figure.'
      }) +
      HM.the({
        h2: HM.esc(t('nguong')),
        than: '<p class="say">' + HM.esc(t('nguongMo')) + '</p>' +
          '<div style="margin-top:14px">' + HB.o({ loai: 'vong', cao: 170,
            giua: { v: HT.fmt.n(demChi), l: c.lang === 'vi' ? 'được thanh toán' : 'paid' },
            phan: [
              { ten: t('nhomChi'), gt: demChi, mau: P[0] },
              { ten: t('nhomDon'), gt: ds.filter(function (r) { return r.carryOut > 0; }).length, mau: P[7] },
              { ten: c.lang === 'vi' ? 'Thu hồi toàn bộ vào tạm ứng' : 'Fully recouped',
                gt: ds.filter(function (r) { return r.payable <= 0 && r.carryOut <= 0 && r.recoup > 0; }).length, mau: P[4] }
            ], dinhDang: 'so', tenTong: c.lang === 'vi' ? 'Số bên thụ hưởng' : 'Payees' }) + '</div>'
      }) + '</div>';

    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
        HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      [['chi', t('nhomChi'), demChi],
       ['ung', t('nhomUng'), ds.filter(function (r) { return r.recoup > 0; }).length],
       ['don', t('nhomDon'), ds.filter(function (r) { return r.carryOut > 0; }).length],
       ['het', t('nhomHet'), ds.length]].map(function (x) {
        return '<button type="button" class="pill' + (LOC.nhom === x[0] ? ' on' : '') + '" data-nhom="' + x[0] + '">' +
          HM.esc(x[1]) + ' <b>' + HT.fmt.n(x[2]) + '</b></button>';
      }).join('') +
      '<select class="in" data-loai style="width:auto;height:34px">' +
        '<option value="">' + HM.esc(t('tatCaLoai')) + '</option>' +
        '<option value="label"' + (LOC.loai === 'label' ? ' selected' : '') + '>Label</option>' +
        '<option value="artist"' + (LOC.loai === 'artist' ? ' selected' : '') + '>' +
          HM.esc(c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist') + '</option></select>' +
      '<div class="sp"></div>' +
      '<button type="button" class="btn sm pri" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>' +
      '</div>';

    html += HM.the({ thoBody: true, than: '<div data-bang></div>' });

    root.innerHTML = html;
    var host = root.querySelector('[data-bang]');
    var b = c.bang({
      host: host, dong: function () { return loc; }, sort: 'payable', dir: -1, co: 25,
      cot: [
        { k: 'ten', l: t('cBen') },
        { k: 'loai', l: t('cLoai'), w: '86px' },
        { k: 'earned', l: t('cKiem'), num: true, w: '118px' },
        { k: 'carryIn', l: t('cDon'), num: true, w: '106px' },
        { k: 'recoup', l: t('cThu'), num: true, w: '110px' },
        { k: 'payable', l: t('cChi'), num: true, w: '124px' },
        { k: 'carryOut', l: t('cCon'), num: true, w: '104px' },
        { k: 'ung', l: t('cUng'), num: true, w: '116px' }
      ],
      veDong: function (r) {
        return '<td><div class="t-ttl">' + HM.esc(HM.dai(r.ten, 30)) + '</div>' +
            '<div class="t-sub">' + HM.esc(r.ma) + '</div></td>' +
          '<td>' + HM.tag(r.loai === 'label' ? 'Label' : (c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist'),
            r.loai === 'label' ? 'info' : 'link') + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(r.earned)) + '</td>' +
          '<td class="num">' + (r.carryIn > 0.004 ? HM.esc(c.tien2(r.carryIn)) : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (r.recoup > 0.004 ? '<span class="neg">−' + HM.esc(c.tien2(r.recoup)) + '</span>' : '<span class="nil">—</span>') + '</td>' +
          '<td class="num band">' + (r.payable > 0.004 ? '<b>' + HM.esc(c.tien2(r.payable)) + '</b>' : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (r.carryOut > 0.004 ? '<span class="tag warn">' + HM.esc(c.tien2(r.carryOut)) + '</span>' : '<span class="nil">—</span>') + '</td>' +
          '<td class="num">' + (r.ung > 0.004 ? HM.esc(c.tien(r.ung)) : '<span class="nil">—</span>') + '</td>';
      },
      chon: function (r) { moChuoi(c, r, duyet); },
      chan: function (rs) {
        var g = { earned: 0, carryIn: 0, recoup: 0, payable: 0, carryOut: 0 };
        rs.forEach(function (r) { g.earned += r.earned; g.carryIn += r.carryIn; g.recoup += r.recoup; g.payable += r.payable; g.carryOut += r.carryOut; });
        return '<tr><td colspan="2">' + HM.esc(t('tong')) + ' · ' + HT.fmt.n(rs.length) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(g.earned)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(g.carryIn)) + '</td>' +
          '<td class="num">−' + HM.esc(c.tien2(g.recoup)) + '</td>' +
          '<td class="num band">' + HM.esc(c.tien2(g.payable)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(g.carryOut)) + '</td><td></td></tr>';
      },
      rongTieuDe: t('khongAi'),
      rongMoTa: c.lang === 'vi' ? 'Đổi bộ lọc phía trên để xem nhóm khác.' : 'Change the filters above.'
    });
    b.ve();
    HB.gan(root);

    ganTab(root, c);
    HM.bam(root, '[data-nhom]', function (el) { LOC.nhom = el.getAttribute('data-nhom'); c.veLai(); });
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('chi-tra-' + c.kyKey + '.csv',
        ['Mã bên thụ hưởng', 'Tên', 'Loại', 'Được hưởng USD', 'Chuyển từ kỳ trước', 'Thu hồi tạm ứng', 'Sẽ thanh toán USD',
         'Quy đổi VND (' + HT.fmt.n(A.fx.rateFor(c.kyKey)) + ')', 'Chuyển sang kỳ sau', 'Tạm ứng còn phải thu hồi'],
        loc.filter(function (r) { return LOC.nhom !== 'chi' || r.payable > 0; }).map(function (r) {
          return [r.ma, r.ten, r.loai, r.earned.toFixed(2), r.carryIn.toFixed(2), r.recoup.toFixed(2),
                  r.payable.toFixed(2), Math.round(r.payable * A.fx.rateFor(c.kyKey)),
                  r.carryOut.toFixed(2), r.ung.toFixed(2)];
        }));
    });
  }
});

function ganTab(root, c) {
  var A = c.A, t = c.t, me = A.staff.me;
  HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
  HM.bam(root, '[data-rut-tt]', function (el) { LOC.rutTt = el.getAttribute('data-rut-tt'); c.veLai(); });
  HM.nhap(root, '[data-rut-tim]', function (el) { LOC.rutTim = el.value; c.veLai(); });
  HM.nhap(root, '[data-bk-tim]', function (el) { LOC.bkTim = el.value; var h = root.querySelector('[data-bang-bk]'); if (h) dungBangBk(root, c); });
  HM.bam(root, '[data-xl]', function (el, e) { e.stopPropagation(); xuLyRut(c, el.getAttribute('data-id'), el.getAttribute('data-xl')); });
  HM.bam(root, '[data-rut]', function (el, e) { if (e.target.closest('button')) return; moRut(c, el.getAttribute('data-rut')); });
  HM.bam(root, '[data-tao-ho]', function () { taoHo(c); });
  HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
  HM.bam(root, '[data-dinh-het]', function () {
    try { A.statements.attachAll(c.kyKey, me.email); c.thongBao(t('daDinhHet'), 'ok'); c.veLai(); } catch (err) { c.thongBao(err.message, 'no'); }
  });
  HM.bam(root, '[data-dinh]', function (el, e) {
    e.stopPropagation();
    var pk = el.getAttribute('data-dinh');
    c.hoiThoai({ tieuDe: t('hoiDinh'), moTa: HM.esc(t('hoiDinhMo')),
      than: '<label class="fld">' + HM.esc(t('hTep')) + '</label><input class="in" data-o="file" value="bang-ke-' + HM.esc(c.kyKey) + '-' + HM.esc(A.partyClientId(pk)) + '.pdf">',
      dong: t('bkDinh') }).then(function (f) {
      if (!f) return;
      try { A.statements.attach(c.kyKey, pk, f.file, me.email); c.thongBao(t('daDinh'), 'ok'); c.veLai(); } catch (err) { c.thongBao(err.message, 'no'); }
    });
  });
  HM.bam(root, '[data-go]', function (el, e) {
    e.stopPropagation();
    try { A.statements.remove(c.kyKey, el.getAttribute('data-go'), me.email); c.thongBao(t('daGo'), 'ok'); c.veLai(); } catch (err) { c.thongBao(err.message, 'no'); }
  });
}

/* =====================================================================
   Tab yêu cầu rút tiền: đối tác gửi từ ví, kế toán tiếp nhận, chuyển
   khoản, ghi số tham chiếu (hoặc từ chối kèm lý do).
   ===================================================================== */
function anSo(s) { s = String(s || ''); return s.length > 4 ? '••••' + s.slice(-4) : s; }
function nutRut(c, w, lon) {
  var t = c.t, k = lon ? '' : ' sm';
  if (w.status === 'requested') return '<button type="button" class="btn pri' + k + '" data-xl="process" data-id="' + HM.esc(w.id) + '">' + HM.esc(t('tiepNhan')) + '</button>' +
    '<button type="button" class="btn ghost' + k + '" data-xl="reject" data-id="' + HM.esc(w.id) + '">' + HM.esc(t('tuChoi')) + '</button>';
  if (w.status === 'processing') return '<button type="button" class="btn pri' + k + '" data-xl="pay" data-id="' + HM.esc(w.id) + '">' + HM.esc(t('daChuyen')) + '</button>' +
    '<button type="button" class="btn ghost' + k + '" data-xl="reject" data-id="' + HM.esc(w.id) + '">' + HM.esc(t('tuChoi')) + '</button>';
  if (w.status === 'paid') return '<span class="mono muted">' + HM.esc(w.ref || '') + '</span>';
  return '';
}
function veRut(c) {
  var A = c.A, t = c.t;
  var wc = A.withdrawals.counts();
  var ds = A.withdrawals.list({ status: LOC.rutTt || undefined, q: LOC.rutTim || undefined });
  var html = HM.ghi({ kieu: 'info', tieuDe: HM.esc(t('tabRut')), than: HM.esc(t('rMo')) });
  html += HM.so([
    { l: t('rTong'), v: HT.fmt.usd(wc.pendingAmount), lon: true, s: HT.fmt.n(wc.requested) + ' ' + t('rTongS') },
    { l: t('rXuLy'), v: HT.fmt.n(wc.processing), mau: wc.processing ? HB.mau('warn') : '' },
    { l: t('rDaChuyen'), v: HT.fmt.n(wc.paid) },
    { l: t('rTuChoi'), v: HT.fmt.n(wc.rejected + wc.cancelled) }
  ]);
  html += '<div class="bar">' +
    '<div class="srch">' + HM.icon('tim') + '<input type="search" data-rut-tim placeholder="' + HM.esc(t('rTim')) + '" value="' + HM.esc(LOC.rutTim) + '"></div>' +
    [['', t('rTatCa'), ds.length && !LOC.rutTt ? ds.length : A.withdrawals.list({}).length], ['requested', t('requested'), wc.requested], ['processing', t('processing'), wc.processing],
     ['paid', t('paid'), wc.paid], ['rejected', t('rejected'), wc.rejected], ['cancelled', t('cancelled'), wc.cancelled]].map(function (x) {
      return '<button type="button" class="pill' + (LOC.rutTt === x[0] ? ' on' : '') + '" data-rut-tt="' + x[0] + '">' + HM.esc(x[1]) + ' <b>' + HT.fmt.n(x[2]) + '</b></button>';
    }).join('') +
    '<div class="sp"></div><button type="button" class="btn sm" data-tao-ho>' + HM.icon('user') + HM.esc(t('taoHo')) + '</button></div>';
  html += HM.the({ thoBody: true, than: ds.length
    ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('rcDoiTac')) + '</th><th class="num">' + HM.esc(t('rcSoTien')) + '</th><th>' + HM.esc(t('rcNgay')) + '</th>' +
      '<th>' + HM.esc(t('rcNh')) + '</th><th>' + HM.esc(t('rcTt')) + '</th><th>' + HM.esc(t('rcThaoTac')) + '</th></tr></thead><tbody>' +
      ds.map(function (w) {
        return '<tr class="pick" data-rut="' + HM.esc(w.id) + '">' +
          '<td><div class="t-ttl">' + HM.esc(HM.dai(w.party.name, 30)) + '</div><div class="t-sub">' + HM.esc(w.id + ' · ' + w.party.clientId) + '</div></td>' +
          '<td class="num band"><b>' + HM.esc(HT.fmt.usd(w.amount)) + '</b></td>' +
          '<td style="white-space:nowrap">' + HM.esc(HT.fmt.luc(w.requestedAt)) + '</td>' +
          '<td>' + (w.bank ? HM.esc(w.bank.bank) + '<div class="t-sub">' + HM.esc(w.bank.holder + ' · ' + anSo(w.bank.account)) + '</div>' : '<span class="nil">—</span>') + '</td>' +
          '<td>' + HM.tag(t(w.status), KIEU_RUT[w.status]) + '</td>' +
          '<td><div class="btnrow">' + nutRut(c, w) + '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
    : HM.trong({ icon: 'cash', tieuDe: t('khongRut'), moTa: t('khongRutMo') }) });
  return html;
}
function xuLyRut(c, id, viec) {
  var A = c.A, t = c.t, me = A.staff.me;
  var xong = function (msg) { c.thongBao(msg, 'ok'); c.dongNgan(); c.veLai(); };
  try {
    if (viec === 'process') { A.withdrawals.process(id, me.email); return xong(t('daTiepNhan')); }
  } catch (e) { return c.thongBao(e.message, 'no'); }
  if (viec === 'pay') {
    c.hoiThoai({ tieuDe: t('hoiChuyen') + ' · ' + id, moTa: HM.esc(t('hoiChuyenMo')),
      than: '<label class="fld">' + HM.esc(t('hThamChieu')) + '</label><input class="in mono" data-o="ref" value="TT' + HM.esc(String(A.asOf()).replace(/-/g, '').slice(2)) + String(Math.floor(Math.random() * 900) + 100) + '">',
      dong: t('daChuyen') }).then(function (f) {
      if (!f) return;
      try { A.withdrawals.pay(id, me.email, f.ref); xong(t('daGhiChuyen')); } catch (e) { c.thongBao(e.message, 'no'); }
    });
  }
  if (viec === 'reject') {
    c.hoiThoai({ tieuDe: t('hoiTuChoi') + ' · ' + id, moTa: HM.esc(t('hoiTuChoiMo')),
      than: '<label class="fld">' + HM.esc(t('hLyDo')) + '</label><input class="in" data-o="why">', dong: t('tuChoi'), nguyHiem: true }).then(function (f) {
      if (!f) return;
      try { A.withdrawals.reject(id, me.email, f.why); xong(t('daTuChoi')); } catch (e) { c.thongBao(e.message, 'no'); }
    });
  }
}
function taoHo(c) {
  var A = c.A, t = c.t, me = A.staff.me;
  c.hoiThoai({ tieuDe: t('hoiTaoHo'), moTa: HM.esc(t('hoiTaoHoMo')),
    than: '<label class="fld">' + HM.esc(t('hDoiTac')) + '</label><input class="in" data-o="party" list="ds-dt-rut" placeholder="HTK-L001">' +
      '<datalist id="ds-dt-rut">' + A.parties.list({}).rows.slice(0, 300).map(function (r) { return '<option value="' + HM.esc(r.clientId) + '">' + HM.esc(r.name) + '</option>'; }).join('') + '</datalist>' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(t('hSoTien')) + '</label><input class="in" type="number" step="0.01" data-o="amount">' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(t('hGhi')) + '</label><input class="in" data-o="note">',
    dong: t('taoHo') }).then(function (f) {
    if (!f) return;
    var pk = null;
    A.parties.list({ q: f.party }).rows.forEach(function (r) { if (r.clientId.toLowerCase() === String(f.party).trim().toLowerCase()) pk = r.partyKey; });
    if (!pk) return c.thongBao((c.lang === 'vi' ? 'Không tìm thấy đối tác ' : 'No partner ') + f.party, 'no');
    try { var w = A.withdrawals.create(pk, +f.amount, me.email, f.note); c.thongBao(t('daTaoHo') + ' · ' + w.id, 'ok'); c.veLai(); }
    catch (e) { c.thongBao(e.message, 'no'); }
  });
}
function moRut(c, id) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  var w = A.withdrawals.get(id); if (!w) return;
  var vi2 = null; try { vi2 = A.wallet(w.partyKey); } catch (e) { vi2 = null; }
  c.nganTruot(
    HM.so([
      { l: t('rcSoTien'), v: HT.fmt.usd(w.amount), lon: true },
      { l: t('rcTt'), html: HM.tag(t(w.status), KIEU_RUT[w.status]) },
      { l: t('rcNgay'), v: HT.fmt.luc(w.requestedAt) }
    ]) +
    '<div class="btnrow" style="margin:12px 0">' + nutRut(c, w, true) + '</div>' +
    HM.kv([
      { t: t('rcDoiTac'), v: w.party.name + ' · ' + w.party.clientId, manh: true },
      w.bank ? { t: t('rcNh'), v: w.bank.bank + ' · ' + w.bank.holder + ' · ' + anSo(w.bank.account) + (w.bank.swift ? ' · ' + w.bank.swift : '') } : null,
      { t: t('nguoiTao'), v: w.by },
      w.ref ? { t: t('thamChieu'), v: w.ref, manh: true } : null,
      w.paidAt ? { t: t('chuyenLuc'), v: HT.fmt.luc(w.paidAt) } : null,
      w.why ? { t: t('lyDo'), v: w.why, mau: 'neg' } : null,
      { t: t('ghiChu'), v: w.note || t('khongGhi') }
    ]) +
    (vi2 ? '<h4 class="sec">' + HM.esc(t('viDoiTac')) + '</h4>' + HM.so([
      { l: t('viKhaDung'), v: HT.fmt.usd(vi2.available), mau: HB.mau('ok') },
      { l: t('viCho'), v: HT.fmt.usd(vi2.pending) },
      { l: t('viDaRut'), v: HT.fmt.usd(vi2.paid) }
    ]) : '') +
    '<h4 class="sec">' + HM.esc(t('lichSu')) + '</h4><div class="wf">' + (w.history || []).map(function (h) {
      return '<div class="st' + (h.status === 'paid' ? ' fin' : h.status === 'rejected' || h.status === 'cancelled' ? ' out' : '') + '"><div class="mk"></div>' +
        '<div><div class="lbl">' + HM.esc(t(h.status)) + '</div><div class="nt">' + HM.esc(HT.fmt.luc(h.at) + ' · ' + h.by + (h.ref ? ' · ' + h.ref : '') + (h.note ? ' · ' + h.note : '')) + '</div></div></div>';
    }).join('') + '</div>',
    { tieuDe: w.id, phu: w.party.name,
      khiMo: function (dr) { HM.bam(dr, '[data-xl]', function (el) { xuLyRut(c, el.getAttribute('data-id'), el.getAttribute('data-xl')); }); } });
}

/* =====================================================================
   Tab bảng kê PDF: mỗi bên thụ hưởng của kỳ đã xét duyệt một tệp
   ===================================================================== */
function veBangKe(c) {
  var A = c.A, t = c.t;
  var theoKy = HM.the({
    h2: HM.esc(t('bkTheoKy')), p: HM.esc(t('bkTheoKyMo')),
    than: '<div class="btnrow">' + A.periods.filter(function (p) { return A.isApproved(p.k); }).map(function (p) {
      var s = A.statements.list(p.k), du = s.attached >= s.total;
      return '<button type="button" class="pill' + (p.k === c.kyKey ? ' on' : '') + '" data-kyto="' + HM.esc(p.k) + '">' + HM.esc(p.label) +
        ' <b style="color:' + (du ? 'var(--ok)' : 'var(--warn)') + '">' + HT.fmt.n(s.attached) + '/' + HT.fmt.n(s.total) + '</b></button>';
    }).join('') + '</div>'
  });
  if (!A.isApproved(c.kyKey)) return HM.ghi({ kieu: 'info', tieuDe: HM.esc(t('bkChuaDuyet')), than: HM.esc(t('bkChuaDuyetMo')) }) + theoKy;
  var st = A.statements.list(c.kyKey);
  var html = HM.ghi({ kieu: 'info', tieuDe: HM.esc(t('tabBk')) + ' · ' + HM.esc(c.ky.label), than: HM.esc(t('bkMo')) });
  html += HM.so([
    { l: t('bkDaDinh'), v: HT.fmt.n(st.attached) + ' / ' + HT.fmt.n(st.total), lon: true },
    { l: t('bkThieu'), v: HT.fmt.n(st.total - st.attached), mau: st.total - st.attached ? HB.mau('warn') : HB.mau('ok') },
    { l: t('bkTong'), v: HT.fmt.n(st.total) }
  ]);
  html += '<div class="bar"><div class="srch">' + HM.icon('tim') + '<input type="search" data-bk-tim placeholder="' + HM.esc(t('bkTim')) + '" value="' + HM.esc(LOC.bkTim) + '"></div>' +
    '<div class="sp"></div>' + (st.attached < st.total ? '<button type="button" class="btn sm pri" data-dinh-het>' + HM.icon('file') + HM.esc(t('bkDinhHet')) + '</button>' : '') + '</div>';
  html += HM.the({ thoBody: true, than: '<div data-bang-bk></div>' });
  return html + theoKy;
}
function dungBangBk(root, c) {
  var A = c.A, t = c.t;
  var host = root.querySelector('[data-bang-bk]'); if (!host) return;
  var q = LOC.bkTim.trim().toLowerCase();
  var rows = A.statements.list(c.kyKey).rows.filter(function (r) { return !q || r.name.toLowerCase().indexOf(q) >= 0 || r.clientId.toLowerCase().indexOf(q) >= 0; });
  var b = c.bang({
    host: host, dong: function () { return rows; }, sort: 'credit', dir: -1, co: 25,
    cot: [
      { k: 'name', l: t('cBen') }, { k: 'kind', l: t('cLoai'), w: '90px' },
      { k: 'earned', l: t('cKiem'), num: true, w: '130px' }, { k: 'credit', l: t('cGhiVi'), num: true, w: '130px' },
      { k: 'pdf', l: t('cPdf'), s: false, w: '300px' }
    ],
    veDong: function (r) {
      return '<td><div class="t-ttl">' + HM.esc(HM.dai(r.name, 30)) + '</div><div class="t-sub">' + HM.esc(r.clientId) + '</div></td>' +
        '<td>' + HM.tag(r.kind === 'label' ? 'Label' : (c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist'), r.kind === 'label' ? 'info' : 'link') + '</td>' +
        '<td class="num">' + HM.esc(c.tien2(r.earned)) + '</td>' +
        '<td class="num band"><b>' + HM.esc(c.tien2(r.credit)) + '</b></td>' +
        '<td>' + (r.pdf
          ? '<div class="btnrow"><span class="tag ok">' + HM.icon('file') + HM.esc(HM.dai(r.pdf.file, 34)) + '</span><span class="muted" style="font-size:12px">' + HM.esc(HT.fmt.ngay(r.pdf.at)) + '</span>' +
            '<button type="button" class="btn sm ghost" data-go="' + HM.esc(r.partyKey) + '" title="' + HM.esc(t('bkGo')) + '">' + HM.icon('x') + '</button></div>'
          : '<button type="button" class="btn sm" data-dinh="' + HM.esc(r.partyKey) + '">' + HM.icon('up') + HM.esc(t('bkDinh')) + '</button>') + '</td>';
    },
    rongTieuDe: t('khongAi'), rongMoTa: ''
  });
  b.ve();
}

function moChuoi(c, r, duyet) {
  var A = c.A, la = r.loai === 'label', id = +r.key.slice(2);
  var a = A.agg(la ? 'label' : 'artist', id, c.ky.idx, 'rec');
  var pub = la ? null : A.agg('artist', id, c.ky.idx, 'pub');
  var lyDo = r.payable > 0
    ? (c.lang === 'vi' ? 'Được thanh toán trong kỳ này.' : 'Paid this period.')
    : r.recoup > 0 && r.carryOut <= 0
      ? (c.lang === 'vi' ? 'Toàn bộ phần được hưởng kỳ này đã được thu hồi vào tạm ứng, không còn số để thanh toán.'
                         : 'Everything earned went against the advance — nothing left to transfer.')
      : (c.lang === 'vi' ? 'Số còn lại dưới ngưỡng thanh toán tối thiểu ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) + ' nên được chuyển sang kỳ sau, không mất đi.'
                         : 'What remains is below the ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) + ' threshold, so it carries forward. Nothing is lost.');

  c.nganTruot(
    HM.ghi({ kieu: r.payable > 0 ? 'ok' : 'warn', tieuDe: HM.esc(lyDo), than: '' }) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Chi tiết dòng tiền: từ doanh thu đến số thanh toán' : 'From revenue to transfer') + '</h4>' +
    HM.kv([
      { t: c.lang === 'vi' ? 'Doanh thu gộp các bản ghi liên quan' : 'Gross on related recordings', v: c.tien2(a.gross) },
      { t: c.lang === 'vi' ? 'Phần bên này được hưởng (bản ghi)' : 'This party’s share (recording)', v: c.tien2(la ? a.labelCut : a.artist) },
      !la && pub && pub.total > 0.004 ? { t: c.lang === 'vi' ? 'Tác quyền' : 'Publishing', v: c.tien2(pub.total) } : null,
      { t: c.lang === 'vi' ? 'Tổng được hưởng kỳ này' : 'Total earned', v: c.tien2(r.earned), manh: true },
      { t: c.lang === 'vi' ? 'Cộng phần chuyển từ kỳ trước' : 'Plus carried in', v: c.tien2(r.carryIn) },
      { t: c.lang === 'vi' ? 'Trừ thu hồi tạm ứng' : 'Less advance recouped', v: r.recoup > 0.004 ? '−' + c.tien2(r.recoup) : '—', mau: 'neg' },
      { t: c.lang === 'vi' ? 'Còn lại' : 'Remaining', v: c.tien2(r.earned + r.carryIn - r.recoup) },
      { t: c.lang === 'vi' ? 'Ngưỡng thanh toán tối thiểu' : 'Threshold', v: HT.fmt.usd0(A.cfg.PAYOUT_MIN) },
      { t: c.lang === 'vi' ? 'Số thanh toán' : 'TRANSFER', v: c.tien2(r.payable), manh: true },
      r.carryOut > 0.004 ? { t: c.lang === 'vi' ? 'Chuyển sang kỳ sau' : 'Carried out', v: c.tien2(r.carryOut) } : null,
      { t: c.lang === 'vi' ? 'Quy đổi VND (theo tỷ giá của kỳ)' : 'In VND (period rate)',
        v: HT.fmt.n(r.payable * A.fx.rateFor(c.kyKey)) + ' ₫' }
    ]) +
    (r.ung > 0.004
      ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Tạm ứng còn phải thu hồi' : 'Advance outstanding') + '</h4>' +
        '<div class="meter"><i style="width:' + Math.min(100, (1 - r.ung / Math.max(r.ung + r.recoup, 1)) * 100).toFixed(1) + '%"></i></div>' +
        '<div class="hint">' + HM.esc(c.lang === 'vi'
          ? 'Còn phải thu hồi ' + c.tien2(r.ung) + '. Với mức được hưởng như kỳ này, dự kiến còn khoảng ' +
            (r.recoup > 0 ? Math.ceil(r.ung / r.recoup) : '—') + ' kỳ nữa.'
          : c.tien2(r.ung) + ' still to recover — roughly ' +
            (r.recoup > 0 ? Math.ceil(r.ung / r.recoup) : '—') + ' more periods at this rate.') + '</div>'
      : '') +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Được hưởng qua 12 kỳ' : 'Earned across 12 periods') + '</h4>' +
    HB.o({ loai: 'cot', cao: 150, anTruc: true, chuThich: false,
      truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
      tieuDeTip: function (i) { return 'Kỳ ' + A.periods[i].label; },
      chuoi: [{ ten: c.lang === 'vi' ? 'Được hưởng' : 'Earned',
        gt: A.periods.map(function (p, i) { return A.agg(la ? 'label' : 'artist', id, i, 'rec').total; }) }],
      noiBat: c.ky.idx }),
    { tieuDe: r.ten, phu: r.ma + ' · ' + (duyet ? (c.lang === 'vi' ? 'đã ghi sổ' : 'posted')
                                               : (c.lang === 'vi' ? 'bản xem trước' : 'preview')),
      khiMo: function (dr) { HB.gan(dr); } });
}

})();
