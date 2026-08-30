/* =====================================================================
   NỘI BỘ · TỶ LỆ CHIA
   ---------------------------------------------------------------------
   rate_share KHÔNG phải một cột trên bảng nghệ sĩ. Nếu label đổi tỷ lệ
   hôm nay mà báo cáo các kỳ đã chốt đổi theo, thì đó là lỗi không sửa
   được sau khi đã chi tiền — hai người cùng mở một báo cáo, hai lần mở
   cách nhau một tháng, ra hai con số.

   Nên nó là một BẢNG có ngày hiệu lực. Mỗi dòng nói: từ kỳ này trở đi,
   bên này nhận bao nhiêu. Kỳ trước đó giữ nguyên tỷ lệ cũ, mãi mãi.
   ===================================================================== */
"use strict";
(function () {

var LOC = { loai: '', tim: '', chiDoi: false };

HT.dangKy({
  id: 'ty-le', nav: 'navTyLe', nhom: 'nhomTien', icon: 'swap',

  chu: {
    vi: {
      navTyLe: 'Tỷ lệ chia', h1: 'Tỷ lệ chia',
      mo: 'Bảng có ngày hiệu lực. Đổi tỷ lệ hôm nay không được làm đổi báo cáo các kỳ đã chốt.',
      soDong: 'Dòng tỷ lệ', soBen: 'Bên nhận có tỷ lệ riêng', daDoi: 'Bên đã đổi tỷ lệ',
      them: 'Thêm dòng tỷ lệ', xoaDong: 'Xoá dòng này',
      cBen: 'Bên nhận', cLoai: 'Loại', cTyLe: 'Tỷ lệ bên nhận', cTu: 'Hiệu lực từ kỳ',
      cNguoi: 'Người đặt', cGhi: 'Ghi chú', cDang: 'Đang áp cho kỳ',
      tim: 'Tìm tên hoặc mã…', tatCa: 'Mọi loại', chiDoi: 'Chỉ bên đã đổi tỷ lệ',
      hoiTyLe: 'Tỷ lệ bên nhận giữ (%)', hoiTu: 'Hiệu lực từ kỳ', hoiGhi: 'Ghi chú (số phụ lục hợp đồng, ngày ký)',
      chiKyMo: 'Chỉ đặt được vào kỳ chưa duyệt. Kỳ đã duyệt là kỳ đã chi tiền — đặt tỷ lệ hiệu lực lùi vào đó là sửa lại số đã chuyển đi.',
      anhHuong: 'Nếu áp từ kỳ đang xem',
      anhHuongMo: 'Ước tính trên số liệu kỳ đang xem. Không ghi gì cả, chỉ để thấy độ lớn.',
      truoc: 'Theo tỷ lệ hiện tại', sau: 'Theo tỷ lệ mới', chenh: 'Chênh lệch',
      khong: 'Chưa có dòng tỷ lệ nào khớp bộ lọc',
      lichSu: 'Lịch sử tỷ lệ của bên này',
      macDinh: 'Nghệ sĩ thuộc label không có dòng riêng — tỷ lệ nằm ở dòng của label quản lý họ.',
      xuat: 'Xuất CSV'
    },
    en: {
      navTyLe: 'Split rates', h1: 'Split rates',
      mo: 'A table with effective dates. Changing a rate today must not change an already-closed period’s statement.',
      soDong: 'Rate rows', soBen: 'Payees with own rate', daDoi: 'Payees that changed',
      them: 'Add a rate row', xoaDong: 'Delete this row',
      cBen: 'Payee', cLoai: 'Kind', cTyLe: 'Payee share', cTu: 'Effective from',
      cNguoi: 'Set by', cGhi: 'Note', cDang: 'Applies to selected period',
      tim: 'Search name or code…', tatCa: 'All kinds', chiDoi: 'Only payees that changed',
      hoiTyLe: 'Payee share (%)', hoiTu: 'Effective from period', hoiGhi: 'Note (contract annex number, signature date)',
      chiKyMo: 'Only an unapproved period can be chosen. An approved period is a paid period — backdating a rate into it rewrites money already sent.',
      anhHuong: 'If applied from the selected period',
      anhHuongMo: 'Estimated on the selected period’s figures. Nothing is written — this only shows the size.',
      truoc: 'At the current rate', sau: 'At the new rate', chenh: 'Difference',
      khong: 'No rate row matches the filters',
      lichSu: 'Rate history for this payee',
      macDinh: 'Artists under a label have no row of their own — the rate sits on their label’s row.',
      xuat: 'Export CSV'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var raw = A.state().rates;

    var demTheoBen = {};
    raw.forEach(function (r) { demTheoBen[r.partyKey] = (demTheoBen[r.partyKey] || 0) + 1; });
    var daDoi = Object.keys(demTheoBen).filter(function (k) { return demTheoBen[k] > 1; });

    var ds = raw.map(function (r) {
      return {
        key: r.partyKey, ten: A.partyName(r.partyKey), ma: A.partyClientId(r.partyKey),
        loai: r.partyKey[0] === 'L' ? 'label' : 'artist',
        rate: r.rate, from: r.from,
        fromLabel: A.periods[A.pIndexOf(r.from)] ? A.periods[A.pIndexOf(r.from)].label : r.from,
        by: r.by, at: r.at, note: r.note || '',
        dangAp: A.rates.rateFor(r.partyKey, c.kyKey) === r.rate &&
                r.from <= c.kyKey &&
                !raw.some(function (x) { return x.partyKey === r.partyKey && x.from > r.from && x.from <= c.kyKey; }),
        nhieu: demTheoBen[r.partyKey] > 1
      };
    });

    var loc = ds.filter(function (r) {
      if (LOC.loai && r.loai !== LOC.loai) return false;
      if (LOC.chiDoi && !r.nhieu) return false;
      if (LOC.tim) {
        var q = LOC.tim.toLowerCase();
        if (r.ten.toLowerCase().indexOf(q) < 0 && r.ma.toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [
        { l: t('soDong'), v: HT.fmt.n(raw.length) },
        { l: t('soBen'), v: HT.fmt.n(Object.keys(demTheoBen).length) },
        { l: t('daDoi'), v: HT.fmt.n(daDoi.length) }
      ]
    });

    html += HM.ghi({ kieu: 'info',
      tieuDe: HM.esc(c.lang === 'vi' ? 'Vì sao tỷ lệ là bảng, không phải cột' : 'Why the rate is a table, not a column'),
      than: HM.esc(c.lang === 'vi'
        ? 'Một cột trên bảng nghệ sĩ chỉ giữ được giá trị hôm nay. Mở lại báo cáo kỳ 01/2026 sau khi label đổi tỷ lệ vào tháng 4, con số sẽ đổi theo — và không ai biết nó từng là số khác. Bảng có cột "hiệu lực từ" giữ được cả hai: tỷ lệ cũ cho kỳ cũ, tỷ lệ mới cho kỳ mới.'
        : 'A column on the artist table can only hold today’s value. Reopen the January statement after the label changed its rate in April and the figure changes with it — with no trace that it was ever different. A table with an effective-from column keeps both: the old rate for old periods, the new one for new.') });

    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
        HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      '<select class="in" data-loai style="width:auto;height:34px">' +
        '<option value="">' + HM.esc(t('tatCa')) + '</option>' +
        '<option value="label"' + (LOC.loai === 'label' ? ' selected' : '') + '>Label</option>' +
        '<option value="artist"' + (LOC.loai === 'artist' ? ' selected' : '') + '>' +
          HM.esc(c.lang === 'vi' ? 'Nghệ sĩ độc lập' : 'Independent artist') + '</option></select>' +
      '<button type="button" class="pill' + (LOC.chiDoi ? ' on' : '') + '" data-chidoi>' +
        HM.esc(t('chiDoi')) + ' <b>' + daDoi.length + '</b></button>' +
      '<div class="sp"></div>' +
      '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>' +
      '<button type="button" class="btn sm pri" data-them>' + HM.icon('swap') + HM.esc(t('them')) + '</button>' +
      '</div>';

    html += HM.the({ thoBody: true, than: '<div data-bang></div>' });

    html += HM.the({
      h2: c.lang === 'vi' ? 'Nghệ sĩ thuộc label' : 'Artists under a label',
      than: '<p class="say">' + HM.esc(t('macDinh')) + ' ' + HM.esc(c.lang === 'vi'
        ? 'Chuỗi chia tiền của họ là: doanh thu gộp → trừ phí Haustek → phần còn lại chia theo tỷ lệ của label → trừ điểm producer trên bản ghi đó. Muốn một nghệ sĩ trong label có tỷ lệ riêng thì phải thêm dòng cho chính nghệ sĩ đó, và bảng chia phần phải nói rõ dòng nào thắng — đây là câu hỏi số 3 còn treo.'
        : 'Their chain is: gross → less the Haustek fee → the remainder split at the label’s rate → less producer points on that recording. Giving one artist inside a label their own rate needs a row for that artist, and the split table must say which row wins — this is open question 3.') + '</p>'
    });

    root.innerHTML = html;

    var host = root.querySelector('[data-bang]');
    var b = c.bang({
      host: host, dong: function () { return loc; }, sort: 'from', dir: -1, co: 25,
      cot: [
        { k: 'ten', l: t('cBen') },
        { k: 'loai', l: t('cLoai'), w: '110px' },
        { k: 'rate', l: t('cTyLe'), num: true, w: '120px' },
        { k: 'from', l: t('cTu'), w: '120px' },
        { k: 'note', l: t('cGhi') },
        { k: 'dangAp', l: t('cDang'), w: '130px' }
      ],
      veDong: function (r) {
        return '<td><div class="t-ttl">' + HM.esc(HM.dai(r.ten, 30)) + '</div>' +
            '<div class="t-sub">' + HM.esc(r.ma) + '</div></td>' +
          '<td>' + HM.tag(r.loai === 'label' ? 'Label' : (c.lang === 'vi' ? 'Độc lập' : 'Independent'),
            r.loai === 'label' ? 'info' : 'link') + '</td>' +
          '<td class="num"><b>' + HM.esc(HT.fmt.pct(r.rate)) + '</b>' +
            '<div class="t-sub">' + HM.esc(c.lang === 'vi' ? 'còn lại ' : 'other side ') +
            HM.esc(HT.fmt.pct(1 - r.rate)) + '</div></td>' +
          '<td class="mono">' + HM.esc(r.fromLabel) +
            (A.isApproved(r.from) ? '<div class="t-sub">' + HM.esc(c.lang === 'vi' ? 'kỳ đã duyệt' : 'approved') + '</div>' : '') + '</td>' +
          '<td>' + (r.note ? HM.esc(HM.dai(r.note, 46)) : '<span class="nil">—</span>') +
            '<div class="t-sub">' + HM.esc(r.by) + ' · ' + HM.esc(HT.fmt.ngay(r.at)) + '</div></td>' +
          '<td>' + (r.dangAp ? HM.tag(c.ky.label, 'ok') : '<span class="nil">—</span>') + '</td>';
      },
      chon: function (r) { moLichSu(c, r); },
      rongTieuDe: t('khong'),
      rongMoTa: c.lang === 'vi' ? 'Đổi bộ lọc, hoặc thêm một dòng tỷ lệ mới.' : 'Change the filters, or add a rate row.'
    });
    b.ve();
    HB.gan(root);

    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; c.veLai(); });
    HM.bam(root, '[data-chidoi]', function () { LOC.chiDoi = !LOC.chiDoi; c.veLai(); });
    HM.bam(root, '[data-them]', function () { hoiTyLe(c, null); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('ty-le-chia.csv',
        ['Mã bên nhận', 'Tên', 'Loại', 'Tỷ lệ bên nhận', 'Hiệu lực từ kỳ', 'Người đặt', 'Đặt lúc', 'Ghi chú'],
        loc.map(function (r) {
          return [r.ma, r.ten, r.loai, (r.rate * 100).toFixed(1).replace('.', ',') + '%',
                  r.fromLabel, r.by, r.at, r.note];
        }));
    });
  }
});

/* =====================================================================
   Lịch sử tỷ lệ của một bên
   ===================================================================== */
function moLichSu(c, r) {
  var A = c.A;
  var lich = A.rates.scheduleFor(r.key);
  var la = r.loai === 'label';
  var id = +r.key.slice(2);

  /* tỷ lệ áp cho từng kỳ — nhìn thấy được là hiểu ngay vì sao cần bảng */
  var theoKy = A.periods.map(function (p) { return A.rates.rateFor(r.key, p.k); });

  c.nganTruot(
    HM.so([
      { l: c.lang === 'vi' ? 'Tỷ lệ đang áp cho kỳ ' + c.ky.label : 'Rate for ' + c.ky.label,
        v: HT.fmt.pct(A.rates.rateFor(r.key, c.kyKey)), lon: true },
      { l: c.lang === 'vi' ? 'Số dòng tỷ lệ' : 'Rate rows', v: String(lich.length) }
    ]) +
    '<h4 class="sec">' + HM.esc(c.t('lichSu')) + '</h4>' +
    '<div class="steps">' + lich.slice().reverse().map(function (x, i) {
      return '<div class="s ' + (i === 0 ? 'now' : 'ok') + '">' +
        '<b>' + HM.esc(HT.fmt.pct(x.rate)) + ' ' +
        HM.esc(c.lang === 'vi' ? 'từ kỳ ' : 'from ') +
        HM.esc(A.periods[A.pIndexOf(x.from)] ? A.periods[A.pIndexOf(x.from)].label : x.from) + '</b>' +
        '<span>' + HM.esc(x.note || (c.lang === 'vi' ? '(không ghi chú)' : '(no note)')) + '</span>' +
        '<div class="tm">' + HM.esc(x.by) + ' · ' + HM.esc(HT.fmt.ngay(x.at)) + '</div>' +
        (A.isApproved(x.from) ? '' :
          '<div class="btnrow" style="margin-top:8px"><button type="button" class="btn sm dang" ' +
          'data-xoa="' + HM.esc(r.key) + '|' + HM.esc(x.from) + '">' + HM.esc(c.t('xoaDong')) + '</button></div>') +
        '</div>';
    }).join('') + '</div>' +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Tỷ lệ áp cho từng kỳ' : 'Rate applied per period') + '</h4>' +
    '<div class="tw"><table class="t" style="min-width:0"><thead><tr>' +
      '<th>' + (c.lang === 'vi' ? 'Kỳ' : 'Period') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Tỷ lệ' : 'Rate') + '</th>' +
      '<th class="num">' + (c.lang === 'vi' ? 'Bên này nhận' : 'This party earned') + '</th>' +
      '<th>' + (c.lang === 'vi' ? 'Sổ' : 'Books') + '</th></tr></thead><tbody>' +
      A.periods.slice().reverse().map(function (p) {
        var g = A.agg(la ? 'label' : 'artist', id, p.idx, 'rec');
        var doi = p.idx > 0 && theoKy[p.idx] !== theoKy[p.idx - 1];
        return '<tr' + (doi ? ' style="box-shadow:inset 3px 0 0 var(--warn)"' : '') + '>' +
          '<td class="mono">' + HM.esc(p.label) + '</td>' +
          '<td class="num">' + HM.esc(HT.fmt.pct(theoKy[p.idx])) +
            (doi ? ' <span class="tag warn">' + HM.esc(c.lang === 'vi' ? 'đổi' : 'change') + '</span>' : '') + '</td>' +
          '<td class="num">' + HM.esc(c.tien(g.total)) + '</td>' +
          '<td>' + (A.isApproved(p.k) ? HM.tag(c.lang === 'vi' ? 'đã khoá' : 'closed', 'ok')
            : HM.tag(c.lang === 'vi' ? 'đang mở' : 'open', 'warn')) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
    '<div class="btnrow" style="margin-top:18px">' +
      '<button type="button" class="btn pri" data-them2="' + HM.esc(r.key) + '">' + HM.esc(c.t('them')) + '</button>' +
    '</div>',
    { tieuDe: r.ten, phu: r.ma + ' · ' + (la ? 'Label' : (c.lang === 'vi' ? 'Nghệ sĩ độc lập' : 'Independent artist')),
      khiMo: function (dr) {
        HM.bam(dr, '[data-them2]', function (el) { c.dongNgan(); hoiTyLe(c, el.getAttribute('data-them2')); });
        HM.bam(dr, '[data-xoa]', function (el) {
          var v = el.getAttribute('data-xoa').split('|');
          c.xacNhan(c.t('xoaDong'),
            HM.esc(c.lang === 'vi'
              ? 'Xoá dòng này thì các kỳ từ ' + v[1] + ' trở đi quay lại tỷ lệ của dòng trước đó. Kỳ đã duyệt không đổi.'
              : 'Deleting this row returns periods from ' + v[1] + ' onwards to the previous row’s rate. Approved periods are unaffected.'),
            c.t('xoaDong'), true).then(function (ok) {
              if (!ok) return;
              A.rates.remove(v[0], v[1]);
              c.dongNgan(); c.thongBao(c.lang === 'vi' ? 'Đã xoá dòng tỷ lệ' : 'Rate row deleted');
              HM.quenHet(); c.veLai();
            });
        });
      } });
}

/* =====================================================================
   Thêm dòng tỷ lệ
   ===================================================================== */
function hoiTyLe(c, key) {
  var A = c.A;
  var kyMo = A.periods.filter(function (p) { return !A.isApproved(p.k); });
  if (!kyMo.length) {
    c.thongBao(c.lang === 'vi' ? 'Mọi kỳ đều đã duyệt — không đặt được tỷ lệ hiệu lực vào kỳ nào' : 'Every period is approved', 'no');
    return;
  }
  var hienTai = key ? A.rates.rateFor(key, kyMo[0].k) : 0.8;

  c.hoiThoai({
    tieuDe: c.t('them'),
    moTa: HM.esc(c.t('chiKyMo')),
    than: (key
      ? '<label class="fld">' + HM.esc(c.t('cBen')) + '</label>' +
        '<input class="in" value="' + HM.esc(A.partyName(key) + ' · ' + A.partyClientId(key)) + '" disabled>' +
        '<input type="hidden" data-o="key" value="' + HM.esc(key) + '">'
      : '<label class="fld">' + (c.lang === 'vi' ? 'Chọn bên nhận' : 'Pick a payee') + '</label>' +
        '<input class="in" data-timben placeholder="' + HM.esc(c.lang === 'vi' ? 'Gõ tên label hoặc nghệ sĩ độc lập' : 'Type a label or independent artist') + '">' +
        '<input type="hidden" data-o="key" value="">' +
        '<div data-kq style="margin-top:8px;max-height:190px;overflow:auto"></div>') +
      '<div class="fldrow two-up" style="margin-top:14px">' +
        '<div><label class="fld">' + HM.esc(c.t('hoiTyLe')) + '</label>' +
        '<input class="in" data-o="rate" type="number" min="1" max="99" step="0.5" value="' + (hienTai * 100).toFixed(1) + '"></div>' +
        '<div><label class="fld">' + HM.esc(c.t('hoiTu')) + '</label>' +
        '<select class="in" data-o="from">' + kyMo.map(function (p) {
          return '<option value="' + p.k + '"' + (p.k === c.kyKey ? ' selected' : '') + '>' + HM.esc(p.label) + '</option>';
        }).join('') + '</select></div></div>' +
      '<div class="hint">' + HM.esc(c.lang === 'vi'
        ? 'Con số này là phần BÊN NHẬN giữ, tính trên doanh thu sau khi trừ phí Haustek ' + HT.fmt.pct(A.cfg.HAUSTEK_FEE) + '. Phần còn lại là của label, hoặc của Haustek nếu nghệ sĩ độc lập.'
        : 'This is the share the PAYEE keeps, of revenue after the ' + HT.fmt.pct(A.cfg.HAUSTEK_FEE) + ' Haustek fee. The rest goes to the label, or to Haustek for an independent artist.') + '</div>' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(c.t('hoiGhi')) + '</label>' +
      '<input class="in" data-o="note" placeholder="' +
        HM.esc(c.lang === 'vi' ? 'VD: Phụ lục 02 hợp đồng HT-2024-118, ký 12.06.2026' : '') + '">',
    dong: c.t('them'),
    khiMo: function (bg) {
      if (key) return;
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
            if (hit.length < 24 && a.labelId < 0 &&
                (a.name.toLowerCase().indexOf(s) >= 0 || a.clientId.toLowerCase().indexOf(s) >= 0))
              hit.push({ key: a.key, ten: a.name, ma: a.clientId, loai: c.lang === 'vi' ? 'Độc lập' : 'Independent' });
          });
          kq.innerHTML = hit.length
            ? '<div class="bars pick">' + hit.map(function (h) {
                return '<div class="row" data-pick="' + HM.esc(h.key) + '" style="grid-template-columns:minmax(0,1fr) auto">' +
                  '<div class="nm"><b>' + HM.esc(HM.dai(h.ten, 32)) + '</b><em>' + HM.esc(h.ma) + '</em></div>' +
                  '<div class="vv" style="font-size:12px">' + HM.esc(h.loai) + '</div></div>';
              }).join('') + '</div>'
            : '<p class="hint">' + HM.esc(c.lang === 'vi'
                ? 'Không tìm thấy. Nghệ sĩ thuộc label không có dòng riêng — tìm label của họ.'
                : 'Not found. Artists under a label have no own row — search for their label.') + '</p>';
        }, 200);
      });
      kq.addEventListener('click', function (e) {
        var el = e.target.closest('[data-pick]');
        if (!el) return;
        an.value = el.getAttribute('data-pick');
        o.value = el.querySelector('b').textContent;
        kq.innerHTML = '<p class="hint pos">' + HM.esc(c.lang === 'vi' ? 'Đã chọn: ' : 'Selected: ') + HM.esc(an.value) + '</p>';
      });
    }
  }).then(function (r) {
    if (!r) return;
    if (!r.key) { c.thongBao(c.lang === 'vi' ? 'Phải chọn một bên nhận' : 'Pick a payee', 'no'); return; }
    var v = parseFloat(r.rate) / 100;
    try {
      A.rates.add(r.key, v, r.from, 'ops@haustek-group.com', r.note);
      c.thongBao((c.lang === 'vi' ? 'Đã đặt ' : 'Set ') + HT.fmt.pct(v) + (c.lang === 'vi' ? ' từ kỳ ' : ' from ') +
        A.periods[A.pIndexOf(r.from)].label, 'ok');
      HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

})();
