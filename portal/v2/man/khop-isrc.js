/* =====================================================================
   NỘI BỘ · KHỚP ISRC  ("black box")
   ---------------------------------------------------------------------
   Dòng doanh thu về mà không khớp bản ghi nào thì không thuộc về ai.
   Màn này là chỗ duy nhất tiền đó được nhìn thấy và được trả về chủ.

   Hai luật của màn:
     · Hệ thống KHÔNG tự khớp. Nó chấm điểm, xếp hạng, rồi dừng.
     · Khớp một dòng của kỳ ĐÃ DUYỆT không sửa lại kỳ đó — tiền đi vào
       kỳ đang mở dưới dạng khoản truy thu, và màn phải nói trước điều
       đó, trước khi người ta bấm.
   ===================================================================== */
"use strict";
(function () {

var LOC = { ky: 'ky-nay', luong: '', trangThai: 'pending', q: '' };
var DANG_CHON = null;

HT.dangKy({
  id: 'khop-isrc', nav: 'navKhop', nhom: 'nhomVanHanh', icon: 'ask',

  chu: {
    vi: {
      navKhop: 'Khớp ISRC', h1: 'Hàng chờ khớp ISRC',
      mo: 'Những dòng doanh thu về mà không tìm được bản ghi. Chưa khớp thì tiền chưa thuộc về ai.',
      treo: 'Đang treo', tienTreo: 'Tiền treo', daKhop: 'Đã khớp', deLai: 'Để lại chờ',
      tatCaKy: 'Mọi kỳ', kyNay: 'Kỳ đang xem', moiLuong: 'Mọi luồng',
      tim: 'Tìm mã, tên bài, nghệ sĩ…',
      cot_ma: 'Mã trong file', cot_bai: 'Tên bài trong file', cot_luong: 'Luồng',
      cot_ky: 'Kỳ', cot_tien: 'Số tiền', cot_lydo: 'Lý do không khớp', cot_tt: 'Trạng thái',
      goiY: 'Bản ghi gợi ý', diem: 'điểm', khop: 'Khớp vào đây',
      deLaiNut: 'Để lại chờ đối tác', traLai: 'Trả lại hàng chờ',
      chonDong: 'Chọn một dòng bên trái',
      chonDongMo: 'Mỗi dòng là một khoản tiền đang không có chủ. Bấm vào để xem hệ thống gợi ý bản ghi nào và vì sao.',
      truyThu: 'Khoản truy thu',
      truyThuMo: 'Kỳ của dòng này đã duyệt và đã chi tiền. Khớp bây giờ thì tiền KHÔNG sửa lại kỳ cũ — nó vào kỳ đang mở, ghi rõ là truy thu của kỳ nào.',
      vaoKy: 'Sẽ ghi vào kỳ',
      khongCon: 'Không còn kỳ nào đang mở để ghi khoản truy thu.',
      xacKhop: 'Khớp dòng này vào bản ghi',
      timTay: 'Không có gợi ý nào đúng? Tìm tay trong danh mục',
      timTayMo: 'Gõ mã ISRC hoặc tên bài. Hệ thống chỉ hiện, không tự chọn.',
      khongCoDong: 'Không còn dòng nào', khongCoDongMo: 'Với bộ lọc đang đặt thì hàng chờ trống.',
      xuat: 'Xuất CSV',
      pct: 'trên doanh thu kỳ', nguong: 'ngưỡng chặn duyệt'
    },
    en: {
      navKhop: 'ISRC matching', h1: 'ISRC matching queue',
      mo: 'Revenue lines that found no recording. Until they are matched the money belongs to nobody.',
      treo: 'On hold', tienTreo: 'Amount held', daKhop: 'Matched', deLai: 'Parked',
      tatCaKy: 'All periods', kyNay: 'Selected period', moiLuong: 'All feeds',
      tim: 'Search code, title, artist…',
      cot_ma: 'Code in file', cot_bai: 'Title in file', cot_luong: 'Feed',
      cot_ky: 'Period', cot_tien: 'Amount', cot_lydo: 'Why it failed', cot_tt: 'Status',
      goiY: 'Suggested recordings', diem: 'score', khop: 'Match to this',
      deLaiNut: 'Park, pending partner', traLai: 'Return to queue',
      chonDong: 'Pick a row on the left',
      chonDongMo: 'Each row is money with no owner. Open one to see what the system suggests and why.',
      truyThu: 'Back-claim',
      truyThuMo: 'This row’s period is approved and paid. Matching now does NOT rewrite the old period — the money lands in the open period, labelled as a back-claim.',
      vaoKy: 'Will be booked into',
      khongCon: 'No open period left to book a back-claim into.',
      xacKhop: 'Match this row to a recording',
      timTay: 'No suggestion right? Search the catalogue by hand',
      timTayMo: 'Type an ISRC or a title. The system only shows — it never picks.',
      khongCoDong: 'Nothing left', khongCoDongMo: 'With these filters the queue is empty.',
      xuat: 'Export CSV',
      pct: 'of period revenue', nguong: 'blocks approval above'
    }
  },

  dem: function (c) {
    var n = c.A.queue.list({ status: 'pending' }).length;
    return n ? '!' + n : '';
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var het = A.queue.list();
    var cho = het.filter(function (q) { return q.status === 'pending'; });
    var nay = HM.nho(A, 'agg:' + c.ky.idx, function () { return A.agg('admin', 0, c.ky.idx, 'rec'); });
    var tyLe = nay.gross ? A.queue.pendingTotal(c.kyKey) / nay.gross : 0;

    var ds = loc(A, c);
    if (DANG_CHON && !ds.some(function (q) { return q.id === DANG_CHON; })) DANG_CHON = null;
    if (!DANG_CHON && ds.length) DANG_CHON = ds[0].id;

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [
        { l: t('treo'), v: HT.fmt.n(cho.length) },
        { l: t('tienTreo'), v: c.tien(A.queue.pendingTotal()) },
        { l: c.ky.label + ' · ' + t('pct'), v: HT.fmt.pct(tyLe, 2),
          mau: tyLe > A.cfg.BLACKBOX_CAP ? HB.mau('danger') : '' }
      ]
    });

    if (tyLe > A.cfg.BLACKBOX_CAP) {
      html += HM.ghi({ kieu: 'no',
        tieuDe: HM.esc(c.lang === 'vi'
          ? 'Tiền treo của kỳ ' + c.ky.label + ' vượt ngưỡng ' + HT.fmt.pct(A.cfg.BLACKBOX_CAP, 1)
          : 'Held money in ' + c.ky.label + ' exceeds the ' + HT.fmt.pct(A.cfg.BLACKBOX_CAP, 1) + ' threshold'),
        than: HM.esc(c.lang === 'vi'
          ? 'Kỳ này không duyệt được cho tới khi phần treo giảm xuống dưới ngưỡng. Đây là chặn cứng, không phải lời nhắc.'
          : 'The period cannot be approved until the held amount drops below the threshold. This is a hard block, not a reminder.') });
    }

    /* ---- thanh lọc ---- */
    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') +
        '<input type="search" data-q placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.q) + '"></div>' +
      '<select class="in" data-f="ky" style="width:auto;height:34px">' +
        '<option value="">' + HM.esc(t('tatCaKy')) + '</option>' +
        '<option value="ky-nay"' + (LOC.ky === 'ky-nay' ? ' selected' : '') + '>' + HM.esc(t('kyNay')) + ' · ' + HM.esc(c.ky.label) + '</option>' +
        A.periods.slice().reverse().map(function (p) {
          return '<option value="' + p.k + '"' + (LOC.ky === p.k ? ' selected' : '') + '>' + HM.esc(p.label) + '</option>';
        }).join('') + '</select>' +
      '<select class="in" data-f="luong" style="width:auto;height:34px">' +
        '<option value="">' + HM.esc(t('moiLuong')) + '</option>' +
        A.feeds.map(function (f) {
          return '<option value="' + f.id + '"' + (LOC.luong === String(f.id) ? ' selected' : '') + '>' + HM.esc(c.song(f, 'short')) + '</option>';
        }).join('') + '</select>' +
      ['pending', 'matched', 'parked', ''].map(function (s) {
        var nhan = s === 'pending' ? t('treo') : s === 'matched' ? t('daKhop') : s === 'parked' ? t('deLai') : (c.lang === 'vi' ? 'Tất cả' : 'All');
        var dem = s ? het.filter(function (q) { return q.status === s; }).length : het.length;
        return '<button type="button" class="pill' + (LOC.trangThai === s ? ' on' : '') + '" data-tt="' + s + '">' +
          HM.esc(nhan) + ' <b>' + dem + '</b></button>';
      }).join('') +
      '<div class="sp"></div>' +
      '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>' +
      '</div>';

    /* ---- hai cột ---- */
    html += '<div class="two">' +
      HM.the({ thoBody: true, than: '<div data-bang></div>' }) +
      '<div data-ct></div>' + '</div>';

    root.innerHTML = html;

    /* ---- bảng bên trái ---- */
    var host = root.querySelector('[data-bang]');
    var b = c.bang({
      host: host, dong: function () { return ds; }, sort: 'amount', dir: -1, co: 12,
      /* Cột hẹp: bảng này nằm ở nửa trái của khung hai cột, nên bốn cột
         đầy đủ là đẩy cột tiền ra ngoài tầm nhìn — mà cột tiền mới là
         thứ người ta nhìn để quyết định xử dòng nào trước. Dồn luồng và
         trạng thái xuống dòng phụ. */
      cot: [
        { k: 'isrc', l: t('cot_ma'), w: '160px' },
        { k: 'title', l: t('cot_bai') },
        { k: 'amount', l: t('cot_tien'), num: true, w: '118px' }
      ],
      veDong: function (q) {
        return '<td' + (q.id === DANG_CHON ? ' class="band"' : '') + '>' +
            (q.isrc ? '<span class="mono">' + HM.esc(q.isrc) + '</span>'
                    : '<span class="nil">' + HM.esc(c.lang === 'vi' ? 'thiếu mã' : 'no code') + '</span>') +
            '<div class="t-sub">' + HM.esc(A.periods[A.pIndexOf(q.periodKey)].label) + ' · ' +
            HM.esc(c.song(A.feeds[q.feedId], 'short')) + '</div></td>' +
          '<td><div class="t-ttl">' + HM.esc(HM.dai(q.title, 26)) + '</div>' +
            '<div class="t-sub">' + HM.esc(HM.dai(q.artist, 22)) + ' · ' +
            (q.status === 'pending' ? HM.esc(c.lang === 'vi' ? 'treo' : 'held')
              : q.status === 'matched' ? '<span class="pos">' + HM.esc(t('daKhop')) + '</span>'
              : '<span class="muted">' + HM.esc(t('deLai')) + '</span>') + '</div></td>' +
          '<td class="num">' + HM.esc(c.tien2(q.amount)) +
            '<div class="t-sub">' + HM.esc(HT.fmt.n(q.streams)) + '</div></td>';
      },
      chon: function (q) { DANG_CHON = q.id; c.veLai(); },
      chan: function (rows) {
        return '<tr><td colspan="2">' + HM.esc(c.lang === 'vi' ? 'Tổng theo bộ lọc' : 'Filtered total') + '</td>' +
          '<td class="num">' + HM.esc(c.tien2(rows.reduce(function (s, q) { return s + q.amount; }, 0))) + '</td></tr>';
      },
      rongTieuDe: t('khongCoDong'), rongMoTa: t('khongCoDongMo')
    });
    b.ve();

    veChiTiet(root, c);

    /* ---- sự kiện ---- */
    HM.bam(root, '[data-tt]', function (el) { LOC.trangThai = el.getAttribute('data-tt'); DANG_CHON = null; c.veLai(); });
    HM.doi(root, '[data-f]', function (el) { LOC[el.getAttribute('data-f')] = el.value; DANG_CHON = null; c.veLai(); });
    HM.nhap(root, '[data-q]', function (el) { LOC.q = el.value; DANG_CHON = null; c.veLai(); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('hang-cho-khop-isrc.csv',
        ['ID', 'Kỳ', 'Luồng', 'Mã trong file', 'Tên bài', 'Nghệ sĩ', 'Cửa hàng', 'Lãnh thổ', 'Lượt', 'Số tiền USD', 'Lý do', 'Trạng thái'],
        ds.map(function (q) {
          return [q.id, A.periods[A.pIndexOf(q.periodKey)].label, c.song(A.feeds[q.feedId], 'short'), q.isrc,
                  q.title, q.artist, q.store, q.territory, q.streams,
                  q.amount.toFixed(2).replace('.', ','), q.reason, q.status];
        }));
    });
  }
});

function loc(A, c) {
  var l = A.queue.list();
  if (LOC.ky === 'ky-nay') l = l.filter(function (q) { return q.periodKey === c.kyKey; });
  else if (LOC.ky) l = l.filter(function (q) { return q.periodKey === LOC.ky; });
  if (LOC.luong !== '') l = l.filter(function (q) { return String(q.feedId) === LOC.luong; });
  if (LOC.trangThai) l = l.filter(function (q) { return q.status === LOC.trangThai; });
  if (LOC.q) {
    var s = LOC.q.toLowerCase();
    l = l.filter(function (q) {
      return (q.isrc || '').toLowerCase().indexOf(s) >= 0 ||
             (q.title || '').toLowerCase().indexOf(s) >= 0 ||
             (q.artist || '').toLowerCase().indexOf(s) >= 0 ||
             q.id.toLowerCase().indexOf(s) >= 0;
    });
  }
  return l;
}

/* =====================================================================
   CỘT PHẢI — chi tiết một dòng
   ===================================================================== */
function veChiTiet(root, c) {
  var A = c.A, t = c.t;
  var host = root.querySelector('[data-ct]');
  var q = DANG_CHON ? A.queue.list().filter(function (x) { return x.id === DANG_CHON; })[0] : null;

  if (!q) {
    host.innerHTML = HM.the({ than: HM.trong({ icon: 'ask', tieuDe: t('chonDong'), moTa: t('chonDongMo') }) });
    return;
  }

  var dat = A.queue.landingPeriod(q.id);
  var goiY = q.status === 'pending' ? A.queue.suggest(q.id) : [];

  var html = HM.the({
    dai: q.status === 'matched'
      ? { kieu: 'ok', icon: 'check', chu: HM.esc(t('daKhop') + ' → ' + A.titleOf(q.resolvedTo) + ' · ' + HT.fmt.luc(q.at)) }
      : q.status === 'parked'
        ? { kieu: 'warn', icon: 'clock', chu: HM.esc(t('deLai') + (q.note ? ' · ' + q.note : '')) }
        : { kieu: 'no', icon: 'alert', chu: HM.esc(q.reason) },
    h2: HM.esc(q.title || (c.lang === 'vi' ? '(file không ghi tên bài)' : '(no title in file)')),
    p: HM.esc(q.id + ' · ' + c.song(A.feeds[q.feedId], 'name')),
    than: HM.kv([
      { t: t('cot_ma'), v: q.isrc || (c.lang === 'vi' ? 'thiếu hẳn' : 'missing'), vHtml: false },
      { t: c.lang === 'vi' ? 'Nghệ sĩ trong file' : 'Artist in file', v: q.artist },
      { t: c.lang === 'vi' ? 'Cửa hàng · lãnh thổ' : 'Store · territory', v: q.store + ' · ' + q.territory },
      { t: c.lang === 'vi' ? 'Lượt nghe' : 'Streams', v: HT.fmt.n(q.streams) },
      { t: t('cot_tien'), v: c.tien2(q.amount), manh: true },
      { t: t('cot_ky'), v: A.periods[A.pIndexOf(q.periodKey)].label +
          (A.isApproved(q.periodKey) ? ' · ' + (c.lang === 'vi' ? 'đã duyệt' : 'approved') : '') }
    ])
  });

  /* khoản truy thu — nói TRƯỚC khi bấm */
  if (q.status === 'pending' && dat && dat.adjustment) {
    html += HM.ghi({ kieu: 'warn', tieuDe: HM.esc(t('truyThu')),
      than: HM.esc(t('truyThuMo')) + '<br><b>' + HM.esc(t('vaoKy')) + ': ' + HM.esc(dat.label) + '</b>' });
  }
  if (q.status === 'pending' && !dat) {
    html += HM.ghi({ kieu: 'no', tieuDe: HM.esc(t('khongCon')), than: '' });
  }

  if (q.status === 'pending') {
    html += HM.the({
      h2: HM.esc(t('goiY')),
      p: c.lang === 'vi'
        ? 'Hệ thống chấm điểm và xếp hạng, rồi dừng. Quyết định cuối là của người — tự khớp là cách nhanh nhất để trả tiền cho nhầm người.'
        : 'The system scores and ranks, then stops. A person decides — auto-matching is the fastest way to pay the wrong person.',
      than: goiY.length ? '<div class="bars pick">' + goiY.map(function (g) {
        var tr = A.track(g.i);
        return '<div class="row" style="grid-template-columns:minmax(0,1fr) auto auto;gap:10px">' +
          '<div class="nm"><b>' + HM.esc(HM.dai(tr.title, 30)) + '</b>' +
            '<em>' + HM.esc(tr.isrc) + ' · ' + HM.esc(HM.dai(tr.artist, 24)) +
            (tr.label ? ' · ' + HM.esc(HM.dai(tr.label, 20)) : ' · ' + (c.lang === 'vi' ? 'độc lập' : 'independent')) + '</em>' +
            '<div class="bar" style="margin-top:6px"><i style="width:' + g.score + '%"></i></div>' +
            '<em style="margin-top:4px">' + HM.esc(g.why) + ' · ' + g.score + ' ' + HM.esc(t('diem')) + '</em></div>' +
          '<button type="button" class="btn sm" data-xem="' + g.i + '">' + HM.icon('info') + '</button>' +
          '<button type="button" class="btn sm pri" data-khop="' + g.i + '">' + HM.esc(t('khop')) + '</button>' +
          '</div>';
      }).join('') + '</div>'
        : HM.trong({ tieuDe: c.lang === 'vi' ? 'Không có gợi ý nào' : 'No suggestion',
            moTa: c.lang === 'vi' ? 'Mã trong file không giống mã nào trong danh mục, và tên bài cũng không khớp. Tìm tay bên dưới, hoặc để lại chờ đối tác xác nhận.'
                                  : 'The code in the file matches nothing in the catalogue, and the title does not match either. Search by hand below, or park it pending the partner.' }),
      chan: '<button type="button" class="btn sm" data-park>' + HM.icon('clock') + HM.esc(t('deLaiNut')) + '</button>'
    });

    html += HM.the({
      h2: HM.esc(t('timTay')), p: HM.esc(t('timTayMo')),
      than: '<div class="srch" style="flex:1 1 100%;max-width:none">' + HM.icon('tim') +
        '<input type="search" data-tay placeholder="VN25… / ' + HM.esc(c.lang === 'vi' ? 'tên bài' : 'title') + '"></div>' +
        '<div data-ketqua style="margin-top:12px"></div>'
    });
  } else {
    html += HM.the({
      h2: c.lang === 'vi' ? 'Đã xử lý' : 'Resolved',
      than: HM.kv([
        { t: c.lang === 'vi' ? 'Trạng thái' : 'Status', v: q.status === 'matched' ? t('daKhop') : t('deLai') },
        q.resolvedTo != null ? { t: c.lang === 'vi' ? 'Khớp vào bản ghi' : 'Matched to',
          v: A.titleOf(q.resolvedTo) + ' · ' + A.isrcOf(q.resolvedTo) } : null,
        q.intoPeriod ? { t: t('vaoKy'), v: A.periods[A.pIndexOf(q.intoPeriod)].label + ' · ' + t('truyThu'), manh: true } : null,
        { t: c.lang === 'vi' ? 'Lúc' : 'When', v: HT.fmt.luc(q.at) },
        q.by ? { t: c.lang === 'vi' ? 'Người làm' : 'By', v: q.by } : null,
        q.note ? { t: c.lang === 'vi' ? 'Ghi chú' : 'Note', v: q.note } : null
      ]),
      chan: '<button type="button" class="btn sm dang" data-unpark>' + HM.icon('swap') + HM.esc(t('traLai')) + '</button>'
    });
  }

  host.innerHTML = html;

  HM.bam(host, '[data-khop]', function (el) { xacNhanKhop(c, q, +el.getAttribute('data-khop')); });
  HM.bam(host, '[data-xem]', function (el) { xemBanGhi(c, +el.getAttribute('data-xem')); });
  HM.bam(host, '[data-park]', function () {
    c.hoiThoai({ tieuDe: t('deLaiNut'), moTa: HM.esc(c.lang === 'vi'
      ? 'Dòng ra khỏi hàng chờ nhưng tiền vẫn treo — nó vẫn được đếm vào phần treo của kỳ và vẫn chặn duyệt nếu vượt ngưỡng. Để lại chờ không phải là xoá.'
      : 'The row leaves the working queue but the money stays held — it still counts towards the period’s held total and still blocks approval above the threshold. Parking is not deleting.'),
      than: '<label class="fld">' + (c.lang === 'vi' ? 'Ghi chú (đang chờ ai, chờ gì)' : 'Note (waiting on whom, for what)') + '</label>' +
        '<textarea class="in" data-o="note" rows="3" placeholder="' +
        HM.esc(c.lang === 'vi' ? 'VD: đã gửi mail cho đối tác YouTube ngày 20.08, chờ họ xác nhận mã' : '') + '"></textarea>',
      dong: c.lang === 'vi' ? 'Để lại chờ' : 'Park' }).then(function (r) {
        if (!r) return;
        A.queue.park(q.id, r.note); c.thongBao(c.lang === 'vi' ? 'Đã để lại chờ ' + q.id : 'Parked ' + q.id);
        HM.quenHet(); c.veLai();
      });
  });
  HM.bam(host, '[data-unpark]', function () {
    try { A.queue.unpark(q.id); c.thongBao(c.lang === 'vi' ? 'Đã trả về hàng chờ' : 'Returned to queue'); HM.quenHet(); c.veLai(); }
    catch (e) { c.thongBao(e.message, 'no'); }
  });
  HM.nhap(host, '[data-tay]', function (el) { timTay(host, c, q, el.value); }, 240);
}

/* tìm tay trong danh mục — quét thẳng, không dựng chỉ mục cho một lần gõ */
function timTay(host, c, q, s) {
  var A = c.A, o = host.querySelector('[data-ketqua]');
  s = (s || '').trim().toLowerCase();
  if (s.length < 2) { o.innerHTML = ''; return; }
  var hit = [];
  for (var i = 0; i < A.trackCount && hit.length < 20; i++) {
    if (A.isrcOf(i).toLowerCase().indexOf(s) >= 0 || A.titleOf(i).toLowerCase().indexOf(s) >= 0) hit.push(i);
  }
  if (!hit.length) {
    o.innerHTML = '<p class="hint">' + HM.esc(c.lang === 'vi' ? 'Không có bản ghi nào khớp.' : 'No recording matches.') + '</p>';
    return;
  }
  o.innerHTML = '<div class="bars pick">' + hit.map(function (i) {
    var tr = A.track(i);
    return '<div class="row" style="grid-template-columns:minmax(0,1fr) auto;gap:10px">' +
      '<div class="nm"><b>' + HM.esc(HM.dai(tr.title, 32)) + '</b>' +
      '<em>' + HM.esc(tr.isrc) + ' · ' + HM.esc(HM.dai(tr.artist, 26)) + '</em></div>' +
      '<button type="button" class="btn sm pri" data-khop="' + i + '">' + HM.esc(c.t('khop')) + '</button></div>';
  }).join('') + '</div>';
}

function xemBanGhi(c, i) {
  var A = c.A, tr = A.track(i);
  var gt = A.periods.map(function (p, pi) { return A.grossRec(i, pi); });
  c.nganTruot(
    HM.kv([
      { t: 'ISRC', v: tr.isrc },
      tr.isrcAlt ? { t: 'ISRC (Optional 1)', v: tr.isrcAlt } : null,
      { t: 'UPC', v: tr.upc },
      { t: c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist', v: tr.artist },
      { t: c.lang === 'vi' ? 'Chủ sở hữu' : 'Owner', v: tr.label || (c.lang === 'vi' ? 'Nghệ sĩ độc lập' : 'Independent') },
      { t: c.lang === 'vi' ? 'Loại' : 'Type', v: tr.type },
      { t: c.lang === 'vi' ? 'Phát hành' : 'Released', v: tr.releasePeriod },
      { t: c.lang === 'vi' ? 'Điểm producer' : 'Producer points', v: tr.producerPts ? HT.fmt.pct(tr.producerPts) : '—' }
    ]) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Doanh thu 12 kỳ' : 'Revenue, 12 periods') + '</h4>' +
    HB.o({ loai: 'cot', cao: 150, anTruc: true, chuThich: false,
      truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
      tieuDeTip: function (k) { return 'Kỳ ' + A.periods[k].label; },
      chuoi: [{ ten: c.lang === 'vi' ? 'Doanh thu gộp' : 'Gross', gt: gt }] }),
    { tieuDe: tr.title, phu: tr.isrc, khiMo: function (dr) { HB.gan(dr); } });
}

function xacNhanKhop(c, q, i) {
  var A = c.A, tr = A.track(i);
  var dat = A.queue.landingPeriod(q.id);
  c.hoiThoai({
    tieuDe: c.t('xacKhop'),
    moTa: '<b>' + HM.esc(q.amount.toFixed(2)) + ' USD</b> ' + HM.esc(c.lang === 'vi' ? 'sẽ được ghi về bản ghi ' : 'will be booked to ') +
      '<b>' + HM.esc(tr.title) + '</b> (' + HM.esc(tr.isrc) + ') — ' + HM.esc(tr.artist) + '.' +
      (dat && dat.adjustment
        ? '<br><br><span class="neg">' + HM.esc(c.t('truyThuMo')) + '</span>'
        : ''),
    than: HM.kv([
      { t: c.lang === 'vi' ? 'Dòng trong file' : 'Row in file', v: (q.isrc || '—') + ' · ' + q.title },
      { t: c.lang === 'vi' ? 'Kỳ của dòng' : 'Row’s period', v: A.periods[A.pIndexOf(q.periodKey)].label },
      { t: c.t('vaoKy'), v: dat ? dat.label + (dat.adjustment ? ' · ' + c.t('truyThu') : '') : '—', manh: true },
      { t: c.lang === 'vi' ? 'Bên nhận tiền này' : 'Payee', v: A.partyName(tr.partyKey) + ' · ' + A.partyClientId(tr.partyKey) }
    ]),
    dong: c.t('khop')
  }).then(function (r) {
    if (!r) return;
    try {
      A.queue.resolve(q.id, i, 'ops@haustek-group.com');
      c.thongBao((c.lang === 'vi' ? 'Đã khớp ' : 'Matched ') + q.id + ' → ' + tr.isrc, 'ok');
      DANG_CHON = null; HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

})();
