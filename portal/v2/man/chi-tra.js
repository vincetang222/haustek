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

var LOC = { nhom: 'chi', tim: '', loai: '' };
var SAU = [];

HT.dangKy({
  id: 'chi-tra', nav: 'navChiTra', nhom: 'nhomTien', icon: 'cash',

  chu: {
    vi: {
      navChiTra: 'Chi trả', h1: 'Chi trả',
      mo: 'Ai được nhận bao nhiêu trong kỳ này, và vì sao phần còn lại chưa về tay họ.',
      xemTruoc: 'Xem trước — kỳ chưa duyệt nên chưa có bảng nào được ghi vào sổ.',
      daGhi: 'Bảng chi trả đã ghi vào sổ lúc duyệt kỳ.',
      seChi: 'Sẽ chi kỳ này', soBen: 'Bên nhận được chi',
      thuUng: 'Trừ vào tạm ứng', donSang: 'Dồn sang kỳ sau', giuLai: 'Giữ lại chưa có chủ',
      nhomChi: 'Được chi', nhomDon: 'Dưới ngưỡng', nhomUng: 'Đang trừ tạm ứng', nhomHet: 'Tất cả',
      tim: 'Tìm tên hoặc mã bên nhận…', tatCaLoai: 'Mọi loại',
      cBen: 'Bên nhận', cLoai: 'Loại', cKiem: 'Kiếm được', cDon: 'Dồn từ kỳ trước',
      cThu: 'Trừ tạm ứng', cChi: 'Sẽ chi', cCon: 'Dồn tiếp', cUng: 'Dư nợ tạm ứng',
      xuat: 'Xuất bảng chuyển tiền', tong: 'Tổng cộng',
      nguong: 'Ngưỡng chi trả', nguongMo: 'Dưới ngưỡng thì tiền KHÔNG mất — nó dồn sang kỳ sau và được cộng vào. Ngưỡng tồn tại vì phí chuyển khoản quốc tế ăn hết một khoản nhỏ.',
      khongAi: 'Không có bên nhận nào khớp bộ lọc',
      chiTiet: 'Chuỗi tiền của bên nhận'
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
      chiTiet: 'Payee money chain'
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

    html += HM.ghi({ kieu: duyet ? 'ok' : 'info',
      tieuDe: HM.esc(duyet ? t('daGhi') : t('xemTruoc')),
      than: HM.esc(duyet
        ? (c.lang === 'vi' ? 'Duyệt lúc ' + HT.fmt.luc(A.approvalOf(c.kyKey).at) + ' bởi ' + A.approvalOf(c.kyKey).by +
            '. Con số dưới đây là con số đã chuyển đi — không tính lại.'
          : 'Approved ' + HT.fmt.luc(A.approvalOf(c.kyKey).at) + ' by ' + A.approvalOf(c.kyKey).by +
            '. These are the figures money moved on — not recomputed.')
        : (c.lang === 'vi' ? 'Bảng tính lại từ dữ liệu hiện có mỗi lần mở màn này. Nạp thêm luồng hay khớp thêm dòng là số đổi.'
          : 'Recomputed from current data each time this screen opens. Loading a feed or matching a row changes it.')),
      nut: '<button type="button" class="btn sm" data-di="doi-chieu">' +
        HM.esc(c.lang === 'vi' ? 'Màn duyệt kỳ' : 'Approval screen') + '</button>' });

    html += HM.so([
      { l: t('seChi'), v: c.tien(tong.payable), lon: true },
      { l: t('thuUng'), v: c.tien(tong.recoup), mau: tong.recoup > 0 ? HB.mau('warn') : '' },
      { l: t('donSang'), v: c.tien(tong.carryOut),
        s: HT.fmt.n(ds.filter(function (r) { return r.carryOut > 0; }).length) + (c.lang === 'vi' ? ' bên nhận' : ' payees') },
      { l: t('giuLai'), v: c.tien(tong.giu) },
      { l: c.lang === 'vi' ? 'Dồn từ kỳ trước' : 'Carried in', v: c.tien(tong.carryIn) }
    ]);

    html += '<div class="grid g3">' +
      HM.the({
        h2: c.lang === 'vi' ? 'Tiền kiếm được của kỳ đi đâu' : 'Where the period’s earnings went',
        than: HB.o({ loai: 'thac', cao: 210, buoc: [
          { l: c.lang === 'vi' ? 'Kiếm được' : 'Earned', v: tong.earned + tong.giu, kind: 'top',
            nt: c.lang === 'vi' ? 'toàn bộ phần thuộc về các bên nhận' : 'everything owed to payees' },
          { l: c.lang === 'vi' ? 'Producer' : 'Producers', v: -tong.giu, kind: 'out',
            nt: c.lang === 'vi' ? 'chưa gắn được danh tính' : 'no identity to pay' },
          { l: c.lang === 'vi' ? 'Tạm ứng' : 'Advances', v: -tong.recoup, kind: 'out',
            nt: c.lang === 'vi' ? 'trừ vào khoản đã ứng trước' : 'offset against money already advanced' },
          { l: c.lang === 'vi' ? 'Dồn tiếp' : 'Carried', v: -tong.carryOut, kind: 'out',
            nt: c.lang === 'vi' ? 'dưới ngưỡng ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) : 'below ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) },
          { l: c.lang === 'vi' ? 'Chi ra' : 'Paid', v: tong.payable, kind: 'final' }
        ] }),
        chan: c.lang === 'vi'
          ? 'Cột đầu chưa gồm phần dồn từ kỳ trước (' + HM.esc(c.tien2(tong.carryIn)) + ') — phần đó cũng nằm trong số chi ra.'
          : 'The first column excludes the carry-in (' + HM.esc(c.tien2(tong.carryIn)) + '), which is also inside the paid figure.'
      }) +
      HM.the({
        h2: HM.esc(t('nguong')),
        than: '<p class="say">' + HM.esc(t('nguongMo')) + '</p>' +
          '<div style="margin-top:14px">' + HB.o({ loai: 'vong', cao: 170,
            giua: { v: HT.fmt.n(demChi), l: c.lang === 'vi' ? 'được chi' : 'paid' },
            phan: [
              { ten: t('nhomChi'), gt: demChi, mau: P[0] },
              { ten: t('nhomDon'), gt: ds.filter(function (r) { return r.carryOut > 0; }).length, mau: P[7] },
              { ten: c.lang === 'vi' ? 'Hết sạch vì tạm ứng' : 'Fully recouped',
                gt: ds.filter(function (r) { return r.payable <= 0 && r.carryOut <= 0 && r.recoup > 0; }).length, mau: P[4] }
            ], dinhDang: 'so', tenTong: c.lang === 'vi' ? 'Số bên nhận' : 'Payees' }) + '</div>'
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

    HM.bam(root, '[data-nhom]', function (el) { LOC.nhom = el.getAttribute('data-nhom'); c.veLai(); });
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('chi-tra-' + c.kyKey + '.csv',
        ['Mã bên nhận', 'Tên', 'Loại', 'Kiếm được USD', 'Dồn từ kỳ trước', 'Trừ tạm ứng', 'Sẽ chi USD',
         'Quy VND (' + HT.fmt.n(A.fx.rateFor(c.kyKey)) + ')', 'Dồn tiếp', 'Dư nợ tạm ứng'],
        loc.filter(function (r) { return LOC.nhom !== 'chi' || r.payable > 0; }).map(function (r) {
          return [r.ma, r.ten, r.loai, r.earned.toFixed(2), r.carryIn.toFixed(2), r.recoup.toFixed(2),
                  r.payable.toFixed(2), Math.round(r.payable * A.fx.rateFor(c.kyKey)),
                  r.carryOut.toFixed(2), r.ung.toFixed(2)];
        }));
    });
  }
});

function moChuoi(c, r, duyet) {
  var A = c.A, la = r.loai === 'label', id = +r.key.slice(2);
  var a = A.agg(la ? 'label' : 'artist', id, c.ky.idx, 'rec');
  var pub = la ? null : A.agg('artist', id, c.ky.idx, 'pub');
  var lyDo = r.payable > 0
    ? (c.lang === 'vi' ? 'Được chi kỳ này.' : 'Paid this period.')
    : r.recoup > 0 && r.carryOut <= 0
      ? (c.lang === 'vi' ? 'Toàn bộ phần kiếm được kỳ này đi trừ vào khoản tạm ứng — chưa còn gì để chuyển.'
                         : 'Everything earned went against the advance — nothing left to transfer.')
      : (c.lang === 'vi' ? 'Số còn lại dưới ngưỡng ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) + ' nên dồn sang kỳ sau, không mất.'
                         : 'What remains is below the ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) + ' threshold, so it carries forward. Nothing is lost.');

  c.nganTruot(
    HM.ghi({ kieu: r.payable > 0 ? 'ok' : 'warn', tieuDe: HM.esc(lyDo), than: '' }) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Từ doanh thu tới số chuyển đi' : 'From revenue to transfer') + '</h4>' +
    HM.kv([
      { t: c.lang === 'vi' ? 'Doanh thu gộp các bài liên quan' : 'Gross on related recordings', v: c.tien2(a.gross) },
      { t: c.lang === 'vi' ? 'Phần thuộc bên này (bản ghi)' : 'This party’s share (recording)', v: c.tien2(la ? a.labelCut : a.artist) },
      !la && pub && pub.total > 0.004 ? { t: c.lang === 'vi' ? 'Tác quyền' : 'Publishing', v: c.tien2(pub.total) } : null,
      { t: c.lang === 'vi' ? 'Tổng kiếm được kỳ này' : 'Total earned', v: c.tien2(r.earned), manh: true },
      { t: c.lang === 'vi' ? 'Cộng phần dồn từ kỳ trước' : 'Plus carried in', v: c.tien2(r.carryIn) },
      { t: c.lang === 'vi' ? 'Trừ thu hồi tạm ứng' : 'Less advance recouped', v: r.recoup > 0.004 ? '−' + c.tien2(r.recoup) : '—', mau: 'neg' },
      { t: c.lang === 'vi' ? 'Còn lại' : 'Remaining', v: c.tien2(r.earned + r.carryIn - r.recoup) },
      { t: c.lang === 'vi' ? 'Ngưỡng chi trả' : 'Threshold', v: HT.fmt.usd0(A.cfg.PAYOUT_MIN) },
      { t: c.lang === 'vi' ? 'SỐ CHUYỂN ĐI' : 'TRANSFER', v: c.tien2(r.payable), manh: true },
      r.carryOut > 0.004 ? { t: c.lang === 'vi' ? 'Dồn sang kỳ sau' : 'Carried out', v: c.tien2(r.carryOut) } : null,
      { t: c.lang === 'vi' ? 'Quy đổi VND (tỷ giá kỳ)' : 'In VND (period rate)',
        v: HT.fmt.n(r.payable * A.fx.rateFor(c.kyKey)) + ' ₫' }
    ]) +
    (r.ung > 0.004
      ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Tạm ứng còn lại' : 'Advance outstanding') + '</h4>' +
        '<div class="meter"><i style="width:' + Math.min(100, (1 - r.ung / Math.max(r.ung + r.recoup, 1)) * 100).toFixed(1) + '%"></i></div>' +
        '<div class="hint">' + HM.esc(c.lang === 'vi'
          ? 'Còn ' + c.tien2(r.ung) + ' phải thu hồi. Với nhịp kiếm tiền như kỳ này thì còn khoảng ' +
            (r.recoup > 0 ? Math.ceil(r.ung / r.recoup) : '—') + ' kỳ nữa.'
          : c.tien2(r.ung) + ' still to recover — roughly ' +
            (r.recoup > 0 ? Math.ceil(r.ung / r.recoup) : '—') + ' more periods at this rate.') + '</div>'
      : '') +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Kiếm được qua 12 kỳ' : 'Earned across 12 periods') + '</h4>' +
    HB.o({ loai: 'cot', cao: 150, anTruc: true, chuThich: false,
      truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
      tieuDeTip: function (i) { return 'Kỳ ' + A.periods[i].label; },
      chuoi: [{ ten: c.lang === 'vi' ? 'Kiếm được' : 'Earned',
        gt: A.periods.map(function (p, i) { return A.agg(la ? 'label' : 'artist', id, i, 'rec').total; }) }],
      noiBat: c.ky.idx }),
    { tieuDe: r.ten, phu: r.ma + ' · ' + (duyet ? (c.lang === 'vi' ? 'đã ghi sổ' : 'posted')
                                               : (c.lang === 'vi' ? 'xem trước' : 'preview')),
      khiMo: function (dr) { HB.gan(dr); } });
}

})();
