/* =====================================================================
   NỘI BỘ · TẠM ỨNG
   ---------------------------------------------------------------------
   Tạm ứng là tiền Haustek đã trả trước. Nó không phải chi phí — nó là
   khoản phải thu, và chỉ hết khi bên nhận kiếm đủ để trừ.

   Điều màn này phải nói rõ, vì đây là chỗ nghệ sĩ hay hiểu nhầm nhất:
   "kỳ này tôi không nhận được đồng nào" và "kỳ này tôi không kiếm được
   đồng nào" là hai chuyện khác nhau. Người đang trừ tạm ứng thuộc vế
   thứ nhất, và họ có quyền nhìn thấy khoản nợ đang ngắn lại.
   ===================================================================== */
"use strict";
(function () {

var LOC = { nhom: 'no', tim: '' };

HT.dangKy({
  id: 'tam-ung', nav: 'navUng', nhom: 'nhomTien', icon: 'up',

  chu: {
    vi: {
      navUng: 'Tạm ứng', h1: 'Tạm ứng',
      mo: 'Các khoản Haustek đã trả trước cho đối tác, và tiến độ thu hồi qua từng kỳ.',
      tongUng: 'Tổng đã tạm ứng', daThu: 'Đã thu hồi', conLai: 'Còn phải thu hồi', soBen: 'Số bên còn nợ',
      themUng: 'Thêm khoản tạm ứng', sua: 'Sửa', xoa: 'Xoá tạm ứng',
      nhomNo: 'Còn nợ', nhomXong: 'Đã tất toán', nhomHet: 'Tất cả',
      tim: 'Tìm theo tên hoặc mã…',
      cBen: 'Bên thụ hưởng', cUng: 'Số đã tạm ứng', cThu: 'Đã thu hồi', cCon: 'Còn phải thu hồi',
      cTd: 'Tiến độ thu hồi', cKy: 'Số kỳ còn lại', cGhi: 'Ghi chú',
      khong: 'Chưa có khoản tạm ứng nào',
      khongMo: 'Thêm một khoản tạm ứng để theo dõi tiến độ thu hồi qua từng kỳ thanh toán.',
      hoiTen: 'Bên thụ hưởng', hoiSo: 'Số tiền tạm ứng (USD)', hoiGhi: 'Ghi chú',
      canhSua: 'Thay đổi số tiền tạm ứng không tính lại các kỳ đã xét duyệt. Phần đã thu hồi ở những kỳ đó giữ nguyên, chỉ số còn phải thu hồi thay đổi theo.',
      canhXoa: 'Xoá tạm ứng đồng nghĩa với việc coi như bên này chưa từng nhận khoản trả trước. Phần đã thu hồi ở các kỳ đã xét duyệt vẫn nằm trong bảng thanh toán của những kỳ đó và không được hoàn lại.',
      chonBen: 'Chọn bên thụ hưởng', goTen: 'Nhập tên hoặc mã để tìm',
      xuat: 'Xuất CSV', khongTim: 'Không tìm thấy bên thụ hưởng nào'
    },
    en: {
      navUng: 'Advances', h1: 'Advances',
      mo: 'Money Haustek paid up front, and how it is being recovered period by period.',
      tongUng: 'Total advanced', daThu: 'Recovered', conLai: 'Outstanding', soBen: 'Payees owing',
      themUng: 'Add an advance', sua: 'Edit', xoa: 'Delete advance',
      nhomNo: 'Outstanding', nhomXong: 'Cleared', nhomHet: 'All',
      tim: 'Search name or code…',
      cBen: 'Payee', cUng: 'Advanced', cThu: 'Recovered', cCon: 'Outstanding',
      cTd: 'Progress', cKy: 'Periods to clear', cGhi: 'Note',
      khong: 'No advances yet',
      khongMo: 'Add one to see how it is offset period by period against payouts.',
      hoiTen: 'Payee', hoiSo: 'Amount advanced (USD)', hoiGhi: 'Note',
      canhSua: 'Changing the advanced amount does NOT rewrite approved periods. What was already recouped there stays; only the outstanding balance changes.',
      canhXoa: 'Deleting treats this payee as never having received money up front. Amounts already recouped in approved periods remain in those payout records — they are not refunded.',
      chonBen: 'Pick a payee', goTen: 'Type a name or code to search',
      xuat: 'Export CSV', khongTim: 'No payee found'
    }
  },

  dem: function (c) {
    var n = c.A.advances.list().filter(function (x) { return x.balance > 0; }).length;
    return n ? String(n) : '';
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, P = HB.dayMau();
    var ds = A.advances.list();
    var conNo = ds.filter(function (x) { return x.balance > 0; });
    var tongGoc = ds.reduce(function (s, x) { return s + x.opening; }, 0);
    var tongThu = ds.reduce(function (s, x) { return s + x.recouped; }, 0);
    var kiem = HM.nho(A, 'kiem:' + c.ky.idx, function () { return A.earnedByParty(c.ky.idx); });

    var loc = ds.filter(function (x) {
      if (LOC.nhom === 'no' && !(x.balance > 0)) return false;
      if (LOC.nhom === 'xong' && x.balance > 0) return false;
      if (LOC.tim) {
        var q = LOC.tim.toLowerCase();
        if (x.name.toLowerCase().indexOf(q) < 0 && x.clientId.toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    }).map(function (x) {
      var nhip = kiem.get(x.partyKey) || 0;
      return {
        key: x.partyKey, ten: x.name, ma: x.clientId, loai: x.kind,
        opening: x.opening, recouped: x.recouped, balance: x.balance,
        note: x.note || '',
        pc: x.opening > 0 ? x.recouped / x.opening : 1,
        soKy: x.balance <= 0 ? 0 : (nhip > 0 ? Math.ceil(x.balance / nhip) : null)
      };
    });

    var theoKy = HM.nho(A, 'ungTheoKy', function () {
      var st = A.state();
      return A.periods.map(function (p) {
        var s = 0;
        Object.keys(st.advances).forEach(function (k) {
          var b = st.advances[k].byPeriod || {};
          s += b[p.k] || 0;
        });
        return Math.round(s * 100) / 100;
      });
    });

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [
        { l: t('tongUng'), v: c.tien(tongGoc) },
        { l: t('conLai'), v: c.tien(A.advances.total()) },
        { l: t('soBen'), v: HT.fmt.n(conNo.length) }
      ]
    });

    html += HM.so([
      { l: t('tongUng'), v: c.tien(tongGoc), lon: true, s: HT.fmt.n(ds.length) + (c.lang === 'vi' ? ' bên thụ hưởng' : ' payees') },
      { l: t('daThu'), v: c.tien(tongThu), s: HT.fmt.pct(tongGoc ? tongThu / tongGoc : 0), mau: HB.mau('ok') },
      { l: t('conLai'), v: c.tien(A.advances.total()), mau: HB.mau('warn') },
      { l: c.lang === 'vi' ? 'Thu hồi kỳ này' : 'Recovered this period', v: c.tien(theoKy[c.ky.idx] || 0),
        s: A.isApproved(c.kyKey) ? (c.lang === 'vi' ? 'đã ghi sổ' : 'posted') : (c.lang === 'vi' ? 'kỳ chưa xét duyệt' : 'not yet posted') }
    ]);

    html += '<div class="grid g3">' +
      HM.the({
        h2: c.lang === 'vi' ? 'Thu hồi qua 12 kỳ' : 'Recovery across 12 periods',
        p: c.lang === 'vi'
          ? 'Chỉ kỳ đã xét duyệt mới ghi nhận thu hồi. Kỳ chưa xét duyệt hiển thị cột trống: chưa phát sinh, không phải bằng 0.'
          : 'Only approved periods record a recoupment. An unapproved period is an empty column — not yet happened, not zero.',
        than: HB.o({ loai: 'cot', cao: 200, hienGiaTri: true, chuThich: false,
          truc: A.periods.map(function (p) { return p.label; }),
          tieuDeTip: function (i) { return 'Kỳ ' + A.periods[i].label; },
          chuTrong: c.lang === 'vi' ? 'Kỳ chưa xét duyệt' : 'Period not approved',
          chuoi: [{ ten: t('daThu'), gt: theoKy.map(function (v, i) { return A.isApproved(A.periods[i].k) ? v : null; }), mau: P[6] }],
          noiBat: c.ky.idx })
      }) +
      HM.the({
        h2: c.lang === 'vi' ? 'Tiến độ chung' : 'Overall progress',
        than: HB.o({ loai: 'vong', cao: 180,
          giua: { v: HT.fmt.pct(tongGoc ? tongThu / tongGoc : 0, 0), l: c.lang === 'vi' ? 'đã thu hồi' : 'recovered' },
          phan: [
            { ten: t('daThu'), gt: tongThu, mau: P[6] },
            { ten: t('conLai'), gt: A.advances.total(), mau: P[4] }
          ] }) +
          '<div class="hint" style="margin-top:12px">' + HM.esc(c.lang === 'vi'
            ? 'Trong mô hình này, tạm ứng không tính lãi và không có thời hạn hoàn trả. Nếu hợp đồng thực tế có lãi hoặc có thời hạn thì phải bổ sung tại đây.'
            : 'Advances bear no interest and have no due date in this model. If the real contracts have either, this is where it must be added.') + '</div>'
      }) + '</div>';

    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
        HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      [['no', t('nhomNo'), conNo.length],
       ['xong', t('nhomXong'), ds.length - conNo.length],
       ['het', t('nhomHet'), ds.length]].map(function (x) {
        return '<button type="button" class="pill' + (LOC.nhom === x[0] ? ' on' : '') + '" data-nhom="' + x[0] + '">' +
          HM.esc(x[1]) + ' <b>' + HT.fmt.n(x[2]) + '</b></button>';
      }).join('') +
      '<div class="sp"></div>' +
      '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>' +
      '<button type="button" class="btn sm pri" data-them>' + HM.icon('up') + HM.esc(t('themUng')) + '</button>' +
      '</div>';

    html += HM.the({ thoBody: true, than: '<div data-bang></div>' });

    root.innerHTML = html;

    var host = root.querySelector('[data-bang]');
    var b = c.bang({
      host: host, dong: function () { return loc; }, sort: 'balance', dir: -1, co: 25,
      cot: [
        { k: 'ten', l: t('cBen') },
        { k: 'opening', l: t('cUng'), num: true, w: '120px' },
        { k: 'recouped', l: t('cThu'), num: true, w: '120px' },
        { k: 'balance', l: t('cCon'), num: true, w: '120px' },
        { k: 'pc', l: t('cTd'), num: false, w: '150px' },
        { k: 'soKy', l: t('cKy'), num: true, w: '110px' },
        { k: 'x', l: c.lang === 'vi' ? 'Thao tác' : 'Actions', s: false, w: '92px' }
      ],
      veDong: function (r) {
        return '<td><div class="t-ttl">' + HM.esc(HM.dai(r.ten, 30)) + '</div>' +
            '<div class="t-sub">' + HM.esc(r.ma) + (r.note ? ' · ' + HM.esc(HM.dai(r.note, 28)) : '') + '</div></td>' +
          '<td class="num">' + HM.esc(c.tien(r.opening)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien(r.recouped)) + '</td>' +
          '<td class="num band">' + (r.balance > 0
            ? '<span class="neg">' + HM.esc(c.tien(r.balance)) + '</span>'
            : '<span class="pos">' + HM.esc(c.lang === 'vi' ? 'đã tất toán' : 'clear') + '</span>') + '</td>' +
          '<td><div class="meter thin"><i style="width:' + Math.min(100, r.pc * 100).toFixed(1) +
            '%;background:' + (r.balance > 0 ? HB.dayMau()[4] : HB.mau('ok')) + '"></i></div>' +
            '<div class="t-sub">' + HT.fmt.pct(r.pc) + '</div></td>' +
          '<td class="num">' + (r.balance <= 0 ? '—' : r.soKy == null
            ? '<span class="nil">' + HM.esc(c.lang === 'vi' ? 'chưa có doanh thu' : 'n/a') + '</span>'
            : HM.esc(String(r.soKy))) + '</td>' +
          '<td><div class="btnrow"><button type="button" class="btn sm ghost" data-sua="' + HM.esc(r.key) + '">' +
            HM.esc(t('sua')) + '</button></div></td>';
      },
      chon: function (r) { moChiTiet(c, r); },
      chan: function (rs) {
        var g = { o: 0, r: 0, b: 0 };
        rs.forEach(function (x) { g.o += x.opening; g.r += x.recouped; g.b += x.balance; });
        return '<tr><td>' + (c.lang === 'vi' ? 'Tổng cộng · ' : 'Total · ') + HT.fmt.n(rs.length) + '</td>' +
          '<td class="num">' + HM.esc(c.tien(g.o)) + '</td>' +
          '<td class="num">' + HM.esc(c.tien(g.r)) + '</td>' +
          '<td class="num band">' + HM.esc(c.tien(g.b)) + '</td><td></td><td></td><td></td></tr>';
      },
      rongTieuDe: t('khong'), rongMoTa: t('khongMo'),
      rongNut: '<button type="button" class="btn pri" data-them>' + HM.esc(t('themUng')) + '</button>'
    });
    b.ve();
    HB.gan(root);

    HM.bam(root, '[data-nhom]', function (el) { LOC.nhom = el.getAttribute('data-nhom'); c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-them]', function () { hoiUng(c, null); });
    HM.bam(root, '[data-sua]', function (el) { hoiUng(c, el.getAttribute('data-sua')); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('tam-ung.csv',
        ['Mã bên thụ hưởng', 'Tên', 'Loại', 'Số đã tạm ứng (USD)', 'Đã thu hồi', 'Còn phải thu hồi', 'Ghi chú'],
        loc.map(function (r) {
          return [r.ma, r.ten, r.loai, r.opening.toFixed(2), r.recouped.toFixed(2), r.balance.toFixed(2), r.note];
        }));
    });
  }
});

/* =====================================================================
   Chi tiết một khoản ứng
   ===================================================================== */
function moChiTiet(c, r) {
  var A = c.A, st = A.state().advances[r.key] || { byPeriod: {} };
  var theo = st.byPeriod || {};
  var la = r.key[0] === 'L';

  c.nganTruot(
    HM.so([
      { l: c.t('cUng'), v: c.tien(r.opening) },
      { l: c.t('cCon'), v: c.tien(r.balance), mau: r.balance > 0 ? HB.mau('warn') : HB.mau('ok') }
    ]) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Thu hồi qua từng kỳ' : 'Recovery by period') + '</h4>' +
    HB.o({ loai: 'cot', cao: 150, anTruc: true, chuThich: false,
      truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
      tieuDeTip: function (i) { return 'Kỳ ' + A.periods[i].label; },
      chuTrong: c.lang === 'vi' ? 'Kỳ chưa xét duyệt' : 'Not approved',
      chuoi: [{ ten: c.t('daThu'),
        gt: A.periods.map(function (p) { return A.isApproved(p.k) ? (theo[p.k] || 0) : null; }),
        mau: HB.dayMau()[6] }] }) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Chi tiết từng lần thu hồi' : 'Each recoupment') + '</h4>' +
    (Object.keys(theo).length
      ? '<div class="tw"><table class="t" style="min-width:0"><thead><tr>' +
        '<th>' + (c.lang === 'vi' ? 'Kỳ' : 'Period') + '</th>' +
        '<th class="num">' + (c.lang === 'vi' ? 'Thu hồi' : 'Recouped') + '</th>' +
        '<th class="num">' + (c.lang === 'vi' ? 'Còn lại sau kỳ' : 'Left after') + '</th></tr></thead><tbody>' +
        (function () {
          var con = r.opening, out = '';
          A.periods.forEach(function (p) {
            var v = theo[p.k];
            if (!v) return;
            con = Math.round((con - v) * 100) / 100;
            out += '<tr><td class="mono">' + HM.esc(p.label) + '</td>' +
              '<td class="num">−' + HM.esc(c.tien2(v)) + '</td>' +
              '<td class="num">' + HM.esc(c.tien2(con)) + '</td></tr>';
          });
          return out;
        })() + '</tbody></table></div>'
      : '<p class="hint">' + HM.esc(c.lang === 'vi'
          ? 'Chưa thu hồi được khoản nào: bên này chưa có doanh thu trong kỳ đã xét duyệt nào.'
          : 'Nothing recovered yet — this payee has earned nothing in any approved period.') + '</p>') +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Ghi chú' : 'Note') + '</h4>' +
    '<p class="say">' + HM.esc(r.note || (c.lang === 'vi' ? '(không có)' : '(none)')) + '</p>' +
    '<div class="btnrow" style="margin-top:18px">' +
      '<button type="button" class="btn" data-sua2="' + HM.esc(r.key) + '">' + HM.esc(c.t('sua')) + '</button>' +
      '<button type="button" class="btn dang" data-xoa="' + HM.esc(r.key) + '">' + HM.esc(c.t('xoa')) + '</button>' +
    '</div>',
    { tieuDe: r.ten, phu: r.ma + ' · ' + (la ? 'Label' : (c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist')),
      khiMo: function (dr) {
        HB.gan(dr);
        HM.bam(dr, '[data-sua2]', function (el) { c.dongNgan(); hoiUng(c, el.getAttribute('data-sua2')); });
        HM.bam(dr, '[data-xoa]', function (el) { xoaUng(c, el.getAttribute('data-xoa'), r); });
      } });
}

/* =====================================================================
   Thêm / sửa
   ===================================================================== */
function hoiUng(c, key) {
  var A = c.A;
  var cu = key ? A.advances.list().filter(function (x) { return x.partyKey === key; })[0] : null;
  var chon = key || '';

  c.hoiThoai({
    tieuDe: cu ? c.t('sua') + ' · ' + cu.name : c.t('themUng'),
    moTa: cu ? HM.esc(c.t('canhSua'))
             : HM.esc(c.lang === 'vi'
               ? 'Tạm ứng sẽ được thu hồi dần từ phần bên thụ hưởng được hưởng ở mọi kỳ xét duyệt sau này, cho tới khi tất toán. Kỳ đã xét duyệt không tính lại.'
               : 'The advance is offset against everything the payee earns in EVERY period approved after this, until it clears. Already-approved periods are not recomputed.'),
    than: (cu
      ? '<label class="fld">' + HM.esc(c.t('hoiTen')) + '</label>' +
        '<input class="in" value="' + HM.esc(cu.name + ' · ' + cu.clientId) + '" disabled>' +
        '<input type="hidden" data-o="key" value="' + HM.esc(key) + '">'
      : '<label class="fld">' + HM.esc(c.t('chonBen')) + '</label>' +
        '<input class="in" data-timben placeholder="' + HM.esc(c.t('goTen')) + '">' +
        '<input type="hidden" data-o="key" value="">' +
        '<div data-kq style="margin-top:8px;max-height:190px;overflow:auto"></div>') +
      '<div class="fldrow two-up" style="margin-top:14px">' +
        '<div><label class="fld">' + HM.esc(c.t('hoiSo')) + '</label>' +
        '<input class="in" data-o="so" type="number" min="0" step="1" value="' + (cu ? cu.opening : '') + '"></div>' +
        '<div><label class="fld">' + (c.lang === 'vi' ? 'Đã thu hồi' : 'Already recouped') + '</label>' +
        '<input class="in" value="' + (cu ? HM.esc(HT.fmt.usd(cu.recouped)) : '—') + '" disabled></div></div>' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(c.t('hoiGhi')) + '</label>' +
      '<input class="in" data-o="ghi" value="' + HM.esc(cu ? cu.note : '') + '" placeholder="' +
      HM.esc(c.lang === 'vi' ? 'Ví dụ: tạm ứng sản xuất album, phụ lục hợp đồng 12.03.2026' : '') + '">',
    dong: cu ? c.CHU[c.lang].save : c.t('themUng'),
    khiMo: function (bg) {
      if (cu) return;
      var o = bg.querySelector('[data-timben]'), kq = bg.querySelector('[data-kq]');
      var an = bg.querySelector('[data-o=key]');
      var hen = null;
      o.addEventListener('input', function () {
        clearTimeout(hen);
        hen = setTimeout(function () {
          var s = o.value.trim().toLowerCase();
          if (s.length < 2) { kq.innerHTML = ''; return; }
          var hit = [];
          A.labels.forEach(function (l) {
            if (hit.length < 24 && (l.name.toLowerCase().indexOf(s) >= 0 || l.clientId.toLowerCase().indexOf(s) >= 0))
              hit.push({ key: l.key, ten: l.name, ma: l.clientId, loai: 'Label' });
          });
          A.artists.forEach(function (a) {
            if (hit.length < 24 && (a.name.toLowerCase().indexOf(s) >= 0 || a.clientId.toLowerCase().indexOf(s) >= 0))
              hit.push({ key: a.key, ten: a.name, ma: a.clientId, loai: c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist' });
          });
          kq.innerHTML = hit.length
            ? '<div class="bars pick">' + hit.map(function (h) {
                return '<div class="row" data-pick="' + HM.esc(h.key) + '" style="grid-template-columns:minmax(0,1fr) auto">' +
                  '<div class="nm"><b>' + HM.esc(HM.dai(h.ten, 32)) + '</b><em>' + HM.esc(h.ma) + '</em></div>' +
                  '<div class="vv" style="font-size:12px">' + HM.esc(h.loai) + '</div></div>';
              }).join('') + '</div>'
            : '<p class="hint">' + HM.esc(c.t('khongTim')) + '</p>';
        }, 200);
      });
      kq.addEventListener('click', function (e) {
        var el = e.target.closest('[data-pick]');
        if (!el) return;
        an.value = el.getAttribute('data-pick');
        o.value = el.querySelector('b').textContent;
        kq.innerHTML = '<p class="hint pos">' + HM.esc(c.lang === 'vi' ? 'Đã chọn: ' : 'Selected: ') +
          HM.esc(an.value) + '</p>';
      });
    }
  }).then(function (r) {
    if (!r) return;
    if (!r.key) { c.thongBao(c.lang === 'vi' ? 'Chưa chọn bên thụ hưởng' : 'Pick a payee', 'no'); return; }
    var so = parseFloat(r.so);
    if (!(so >= 0)) { c.thongBao(c.lang === 'vi' ? 'Số tiền không hợp lệ' : 'Invalid amount', 'no'); return; }
    try {
      A.advances.set(r.key, so, r.ghi);
      c.thongBao(c.lang === 'vi' ? 'Đã lưu tạm ứng cho ' + A.partyName(r.key) : 'Advance saved', 'ok');
      HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

function xoaUng(c, key, r) {
  c.xacNhan(c.t('xoa') + ' · ' + r.ten, HM.esc(c.t('canhXoa')), c.t('xoa'), true).then(function (ok) {
    if (!ok) return;
    c.A.advances.remove(key);
    c.dongNgan();
    c.thongBao(c.lang === 'vi' ? 'Đã xoá tạm ứng' : 'Advance deleted');
    HM.quenHet(); c.veLai();
  });
}

})();
