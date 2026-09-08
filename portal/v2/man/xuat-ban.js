/* =====================================================================
   NỘI BỘ · TÁC QUYỀN
   ---------------------------------------------------------------------
   Trang này KHÔNG thay Sentric. Sentric là bên đứng ra đăng ký tác phẩm
   với hội tác quyền từng nước và thu tiền về. Trang này là chỗ Haustek
   NHÌN vào công việc ấy và thấy chỗ nào đang hở.

   Bốn tab, xếp theo thứ tự đáng lo:
     · Tiền để trên bàn — lãnh thổ có doanh thu mà chưa đăng ký ở hội của
       lãnh thổ ấy. Hội vẫn thu, nhưng không biết trả cho ai.
     · Việc còn phải làm — thiếu ISWC, tỷ lệ không đủ 100%, hồ sơ bị trả lại
     · Tác phẩm — tra cứu, sửa tác giả và tỷ lệ, xem ma trận đăng ký
     · Nhập từ Sentric — dán bảng xuất của Sentric vào
   ===================================================================== */
"use strict";
(function () {

var CHON = { tab: 'ban', tp: null, tim: '', loc: '' };

var TT = {
  vi: { 'chua-gui': 'Chưa gửi', 'da-gui': 'Đã gửi', 'da-khop': 'Đã khớp', 'tu-choi': 'Bị trả lại', 'trung-lap': 'Trùng lặp' },
  en: { 'chua-gui': 'Not sent', 'da-gui': 'Sent', 'da-khop': 'Matched', 'tu-choi': 'Rejected', 'trung-lap': 'Duplicate' }
};
var TT_KIEU = { 'chua-gui': '', 'da-gui': 'info', 'da-khop': 'ok', 'tu-choi': 'no', 'trung-lap': 'warn' };

HT.dangKy({
  id: 'xuat-ban', nav: 'nav', nhom: 'nhomDuLieu', icon: 'book',
  vai: ['ops', 'accounting', 'mgmt'],

  chu: {
    vi: {
      nav: 'Tác quyền', h1: 'Tác quyền',
      mo: 'Tác phẩm, tác giả và đăng ký với hội tác quyền từng nước. Sentric đứng ra đăng ký; đây là chỗ theo dõi chỗ nào còn hở.',
      kTien: 'Tiền để trên bàn', kTienMo: 'Kỳ {k} · lãnh thổ có doanh thu mà tác phẩm chưa đăng ký ở hội của lãnh thổ ấy',
      kThu: 'Doanh thu tác quyền', kTp: 'Tác phẩm', kNhieu: 'Có nhiều bản ghi',
      tBan: 'Tiền để trên bàn', tViec: 'Việc còn phải làm', tTp: 'Tác phẩm', tNhap: 'Nhập từ Sentric',
      banTieu: 'Tiền đang để trên bàn', banMo: 'Hội tác quyền vẫn thu tiền ở lãnh thổ ấy, nhưng tác phẩm chưa đăng ký nên hội không biết trả cho ai. Tiền nằm trong quỹ chưa phân phối, và sau ba tới năm năm là mất hẳn.',
      banKhong: 'Không có lãnh thổ nào hở', banKhongMo: 'Mọi tác phẩm đang có doanh thu đều đã đăng ký ở hội của lãnh thổ ấy.',
      cTp: 'Tác phẩm', cIswc: 'Mã ISWC', cNuoc: 'Lãnh thổ chưa đăng ký', cTien: 'Ước tính kỳ này',
      viecIswc: 'Chưa có mã ISWC', viecIswcMo: 'Không có ISWC thì không đăng ký được ở hội nào. Xin mã qua Sentric.',
      viecTyLe: 'Tỷ lệ tác giả không đủ 100%', viecTyLeMo: 'Hội tác quyền nào cũng trả lại hồ sơ không đủ 100%. Thường là còn một người đồng sáng tác chưa khai.',
      viecHong: 'Hồ sơ bị hội trả lại', viecHongMo: 'Hội từ chối hoặc báo trùng lặp. Xem ghi chú của hội rồi gửi lại qua Sentric.',
      cTong: 'Tổng tỷ lệ', cHoi: 'Hội', cThu: 'Doanh thu kỳ',
      tim: 'Tìm tên tác phẩm, ISWC, tên tác giả…',
      locHet: 'Tất cả', locThieu: 'Thiếu ISWC', locLech: 'Lệch tỷ lệ', locNhieu: 'Nhiều bản ghi',
      cTacGia: 'Tác giả', cBanGhi: 'Bản ghi', cDk: 'Đã đăng ký',
      khong: 'Không tìm thấy tác phẩm nào', khongMo: 'Đổi từ khoá hoặc bỏ bộ lọc.',
      dong: 'Đóng', sua: 'Sửa tác giả và tỷ lệ', suaIswc: 'Đặt mã ISWC',
      hoiIswc: 'Mã ISWC của tác phẩm', hoiIswcMo: 'Dạng T-123456789-0. Sentric cấp mã này sau khi đăng ký lần đầu.',
      hoiTg: 'Tác giả và tỷ lệ', hoiTgMo: 'Mỗi dòng một người: Tên | Vai (C nhạc, A lời, CA cả hai, AR phối) | Tỷ lệ | IPI. Tổng phải đúng 100%.',
      daGhi: 'Đã lưu tác phẩm', daDk: 'Đã đặt {h} · {t}', daBoDk: 'Đã bỏ đặt tay ở {h}',
      dkTieu: 'Đăng ký theo hội', dkMo: 'Bấm một dòng để đổi trạng thái. Trạng thái đặt tay đè lên số Sentric trả về.',
      cNuocH: 'Nước', cLoai: 'Loại', cMaHoi: 'Mã hội', cNgay: 'Ngày', cTay: '',
      loaiBd: 'Biểu diễn', loaiCk: 'Cơ khí', loaiCid: 'Content ID',
      datTt: 'Đổi trạng thái', hoiDat: 'Đăng ký ở {h}', hoiDatMo: 'Ghi mã hội trả về để sau này lần ngược được.',
      lTt: 'Trạng thái', lMa: 'Mã hội', lGhi: 'Ghi chú', boTay: 'Bỏ đặt tay',
      trenBanTp: 'Tác phẩm này đang hở ở', trenBanKhong: 'Tác phẩm này đã đăng ký đủ ở mọi lãnh thổ đang có doanh thu.',
      nhapTieu: 'Nhập bảng xuất của Sentric', nhapMo: 'Dán bảng từ Sentric hoặc từ Excel. Bốn cột, ngăn bằng tab hoặc dấu chấm phẩy: ISRC · ISWC · Mã hội · Hội. Dòng tiêu đề tự bỏ qua.',
      nhapNut: 'Nhận bảng', nhapKq: 'Nhận {n} tác phẩm', nhapBo: '{n} dòng bỏ lại',
      nhapKhong: 'Không nhận được dòng nào. Kiểm lại cột ISRC.',
      apiTieu: 'Nối thẳng với Sentric thì sao', apiMo: 'Bản mẫu chưa có máy chủ nên chỉ dán tay được. Khi lên thật, thứ tự nên hỏi Sentric: (1) có API hoặc giao file SFTP cho khách label không; (2) nếu không thì xuất CSV theo kỳ và máy chủ Haustek tự tải; (3) cuối cùng mới là dán tay. Cả ba đường đều đổ vào đúng bảng này.',
      uoc: 'Số ước tính: quét mẫu một phần năm danh mục rồi nhân lên.'
    },
    en: {
      nav: 'Publishing', h1: 'Publishing',
      mo: 'Works, writers and society registrations by country. Sentric does the registering; this is where you watch for gaps.',
      kTien: 'Money on the table', kTienMo: 'Period {k} · territories earning where the work is not registered with that territory’s society',
      kThu: 'Publishing revenue', kTp: 'Works', kNhieu: 'With several recordings',
      tBan: 'Money on the table', tViec: 'Open items', tTp: 'Works', tNhap: 'Import from Sentric',
      banTieu: 'Money sitting on the table', banMo: 'The society still collects in that territory, but the work is not registered so it does not know who to pay. The money sits in the undistributed pool, and after three to five years it is gone.',
      banKhong: 'No territory is exposed', banKhongMo: 'Every earning work is registered with the society of the territory it earns in.',
      cTp: 'Work', cIswc: 'ISWC code', cNuoc: 'Territories not registered', cTien: 'Estimate this period',
      viecIswc: 'No ISWC yet', viecIswcMo: 'Without an ISWC a work cannot be registered anywhere. Request the code through Sentric.',
      viecTyLe: 'Writer splits do not total 100%', viecTyLeMo: 'Every society returns a filing that does not total 100%. Usually one co-writer has not been declared.',
      viecHong: 'Filing returned by the society', viecHongMo: 'Rejected or flagged as a duplicate. Read the society’s note and refile through Sentric.',
      cTong: 'Total split', cHoi: 'Society', cThu: 'Revenue this period',
      tim: 'Search title, ISWC, writer name…',
      locHet: 'All', locThieu: 'No ISWC', locLech: 'Split off', locNhieu: 'Several recordings',
      cTacGia: 'Writers', cBanGhi: 'Recordings', cDk: 'Registered',
      khong: 'No works found', khongMo: 'Change the search or clear the filter.',
      dong: 'Close', sua: 'Edit writers and splits', suaIswc: 'Set the ISWC',
      hoiIswc: 'ISWC for this work', hoiIswcMo: 'Format T-123456789-0. Sentric issues it after the first registration.',
      hoiTg: 'Writers and splits', hoiTgMo: 'One person per line: Name | Role (C music, A lyrics, CA both, AR arranger) | Split | IPI. Must total exactly 100%.',
      daGhi: 'Work saved', daDk: 'Set {h} · {t}', daBoDk: 'Cleared the manual state for {h}',
      dkTieu: 'Registration by society', dkMo: 'Click a row to change the state. A manual state overrides what Sentric reports.',
      cNuocH: 'Country', cLoai: 'Type', cMaHoi: 'Society code', cNgay: 'Date', cTay: '',
      loaiBd: 'Performance', loaiCk: 'Mechanical', loaiCid: 'Content ID',
      datTt: 'Change state', hoiDat: 'Registration with {h}', hoiDatMo: 'Record the code the society returned so it can be traced later.',
      lTt: 'State', lMa: 'Society code', lGhi: 'Note', boTay: 'Clear manual state',
      trenBanTp: 'This work is exposed in', trenBanKhong: 'This work is registered everywhere it earns.',
      nhapTieu: 'Import a Sentric export', nhapMo: 'Paste from Sentric or from Excel. Four columns, tab or semicolon separated: ISRC · ISWC · Society code · Society. A header row is skipped.',
      nhapNut: 'Take the table', nhapKq: 'Took {n} works', nhapBo: '{n} lines left behind',
      nhapKhong: 'No line could be taken. Check the ISRC column.',
      apiTieu: 'What about a direct Sentric connection', apiMo: 'The prototype has no server, so pasting is the only route. For the real thing, ask Sentric in this order: (1) is there an API or an SFTP drop for label clients; (2) if not, a per-period CSV export the Haustek server fetches; (3) manual paste last. All three land in this same table.',
      uoc: 'Estimated: one work in five is scanned, then scaled up.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var tq;
    try { tq = A.xuatBan.tongQuan(); } catch (e) { root.innerHTML = HM.the({ than: HM.trong({ icon: 'book', tieuDe: e.message }) }); return; }

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kTien'), v: c.tien(tq.tongTrenBan), lon: true, s: t('kTienMo').replace('{k}', tq.kyLabel),
        mau: tq.tongTrenBan > 0 ? HB.mau('warn') : HB.mau('ok') },
      { l: t('kThu'), v: c.tien(tq.doanhThuKy) },
      { l: t('kTp'), v: HT.fmt.n(tq.soTacPham), s: HT.fmt.n(tq.soNhieuBanGhi) + ' ' + t('kNhieu').toLowerCase() },
      { l: t('viecIswc'), v: HT.fmt.n(tq.dem.thieuIswc), mau: tq.dem.thieuIswc ? HB.mau('warn') : HB.mau('ok') },
      { l: t('viecHong'), v: HT.fmt.n(tq.dem.hong), mau: tq.dem.hong ? HB.mau('no') : HB.mau('ok') }
    ]);
    html += HM.tabs([
      { k: 'ban', l: t('tBan'), icon: 'cash', dem: tq.dem.trenBan || null },
      { k: 'viec', l: t('tViec'), icon: 'alert', dem: (tq.dem.thieuIswc + tq.dem.lechTyLe + tq.dem.hong) || null },
      { k: 'tp', l: t('tTp'), icon: 'book' },
      { k: 'nhap', l: t('tNhap'), icon: 'down2' }
    ], CHON.tab);

    if (CHON.tab === 'ban') html += veBan(c);
    else if (CHON.tab === 'viec') html += veViec(c);
    else if (CHON.tab === 'tp') html += veTp(c);
    else html += veNhap(c);

    root.innerHTML = html;
    HM.bam(root, '[data-tab]', function (el) { CHON.tab = el.getAttribute('data-tab'); c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { CHON.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-loc]', function (el) {
      var v = el.getAttribute('data-loc'); CHON.loc = CHON.loc === v ? '' : v; c.veLai();
    });
    HM.bam(root, '[data-tp]', function (el) { moTp(c, +el.getAttribute('data-tp')); });
    HM.bam(root, '[data-nhan-sentric]', function () {
      var o = root.querySelector('[data-sentric]');
      if (!o || !o.value.trim()) return;
      try {
        var kq = A.xuatBan.nhapSentric(o.value, A.staff.me.name);
        if (!kq.ok.length) { c.thongBao(t('nhapKhong'), 'no'); return; }
        c.thongBao(t('nhapKq').replace('{n}', kq.ok.length) +
          (kq.bo.length ? ' · ' + t('nhapBo').replace('{n}', kq.bo.length) : ''), kq.bo.length ? 'warn' : 'ok');
        HM.quenHet(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
  }
});

/* ================================================================= */
function veBan(c) {
  var A = c.A, t = c.t;
  var v = A.xuatBan.viecConLai(60);
  if (!v.trenBan.length) return HM.the({ than: HM.trong({ icon: 'check', tieuDe: t('banKhong'), moTa: t('banKhongMo') }) });
  return HM.the({
    h2: HM.esc(t('banTieu')), p: HM.esc(t('banMo')), icon: 'cash', thoBody: true,
    chan: HM.esc(t('uoc')),
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('cTp')) + '</th><th>' + HM.esc(t('cNuoc')) + '</th>' +
      '<th class="num">' + HM.esc(t('cTien')) + '</th></tr></thead><tbody>' +
      v.trenBan.map(function (x) {
        return '<tr class="pick canh" data-tp="' + x.w + '">' +
          '<td>' + HM.tenBia({ ten: x.ten, seed: 'w' + x.w, bia: x.w }) + '</td>' +
          '<td>' + x.nuoc.map(function (n) { return HM.tag(n, 'warn'); }).join(' ') + '</td>' +
          '<td class="num mono"><b>' + HM.esc(c.tien(x.tong)) + '</b></td></tr>';
      }).join('') + '</tbody></table></div>'
  });
}

function veViec(c) {
  var A = c.A, t = c.t;
  var v = A.xuatBan.viecConLai(40);
  function bang(rows, cot, ve) {
    return rows.length ? '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('cTp')) + '</th>' + cot + '<th class="num">' + HM.esc(t('cThu')) + '</th></tr></thead><tbody>' +
      rows.map(function (x) {
        return '<tr class="pick" data-tp="' + x.w + '">' +
          '<td>' + HM.tenBia({ ten: x.ten, seed: 'w' + x.w, bia: x.w }) + '</td>' + ve(x) +
          '<td class="num mono">' + HM.esc(c.tien(x.tien)) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : HM.trong({ icon: 'check', tieuDe: '—', moTa: t('banKhongMo') });
  }
  return HM.the({ h2: HM.esc(t('viecIswc')) + ' ' + HM.tag(HT.fmt.n(v.dem.thieuIswc), 'warn'),
      p: HM.esc(t('viecIswcMo')), icon: 'alert', thoBody: true, chan: HM.esc(t('uoc')),
      than: bang(v.thieuIswc, '', function () { return '<td>' + HM.tag('—', '') + '</td>'; }) }) +
    HM.the({ h2: HM.esc(t('viecTyLe')) + ' ' + HM.tag(HT.fmt.n(v.dem.lechTyLe), 'warn'),
      p: HM.esc(t('viecTyLeMo')), icon: 'alert', thoBody: true,
      than: bang(v.lechTyLe, '<th class="num">' + HM.esc(t('cTong')) + '</th>',
        function (x) { return '<td class="num mono"><span class="neg">' + HM.esc(x.tong) + '%</span></td>'; }) }) +
    HM.the({ h2: HM.esc(t('viecHong')) + ' ' + HM.tag(HT.fmt.n(v.dem.hong), 'no'),
      p: HM.esc(t('viecHongMo')), icon: 'alert', thoBody: true,
      than: bang(v.hong, '<th>' + HM.esc(t('cHoi')) + '</th>',
        function (x) { return '<td>' + x.hoi.slice(0, 4).map(function (h) { return HM.tag(h, 'no'); }).join(' ') + '</td>'; }) });
}

function veTp(c) {
  var A = c.A, t = c.t;
  var o = { q: CHON.tim, limit: 60 };
  if (CHON.loc === 'thieu') o.thieuIswc = true;
  else if (CHON.loc === 'lech') o.lechTyLe = true;
  else if (CHON.loc === 'nhieu') o.nhieuBanGhi = true;
  var d = A.xuatBan.tacPham(o);

  var html = '<div class="bar">' +
    '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim value="' + HM.esc(CHON.tim) + '" placeholder="' + HM.esc(t('tim')) + '"></div>' +
    [['', t('locHet')], ['thieu', t('locThieu')], ['lech', t('locLech')], ['nhieu', t('locNhieu')]].map(function (b) {
      return '<button type="button" class="pill' + (CHON.loc === b[0] ? ' on' : '') + '" data-loc="' + b[0] + '">' + HM.esc(b[1]) + '</button>';
    }).join('') + '</div>';

  html += HM.the({
    thoBody: true, chan: d.uocLuong ? HM.esc(t('uoc')) : '',
    than: d.rows.length ? '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('cTp')) + '</th><th>' + HM.esc(t('cIswc')) + '</th>' +
      '<th>' + HM.esc(t('cTacGia')) + '</th><th class="num">' + HM.esc(t('cTong')) + '</th>' +
      '<th class="num">' + HM.esc(t('cBanGhi')) + '</th></tr></thead><tbody>' +
      d.rows.map(function (x) {
        return '<tr class="pick' + (x.canTyLe ? '' : ' canh') + '" data-tp="' + x.id + '">' +
          '<td>' + HM.tenBia({ ten: x.ten, seed: 'w' + x.id, bia: x.id }) + '</td>' +
          '<td class="mono">' + (x.iswc ? HM.esc(x.iswc) : '<span class="nil">' + HM.esc(t('locThieu')) + '</span>') + '</td>' +
          '<td style="font-size:12px">' + x.tacGia.map(function (g) {
            return HM.esc(g.ten) + ' <span class="muted">' + HM.esc(g.vaiTro) + ' ' + g.tyLe + '%</span>';
          }).join('<br>') + '</td>' +
          '<td class="num mono">' + (x.canTyLe ? '<span class="pos">100%</span>' : '<span class="neg">' + x.tongTyLe + '%</span>') + '</td>' +
          '<td class="num mono">' + x.soBanGhi + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : HM.trong({ icon: 'book', tieuDe: t('khong'), moTa: t('khongMo') })
  });
  return html;
}

function veNhap(c) {
  var t = c.t;
  return HM.the({
    h2: HM.esc(t('nhapTieu')), p: HM.esc(t('nhapMo')), icon: 'down2',
    than: '<textarea class="in mono" rows="9" data-sentric placeholder="ISRC\tISWC\tMã hội\tHội&#10;VNHTK2600001\tT-123456789-0\tPRS9988\tPRS"></textarea>' +
      '<div class="btnrow" style="margin-top:10px"><button type="button" class="btn pri" data-nhan-sentric>' +
      HM.icon('down2') + HM.esc(t('nhapNut')) + '</button></div>'
  }) + HM.the({ h2: HM.esc(t('apiTieu')), icon: 'info', than: '<p class="say">' + HM.esc(t('apiMo')) + '</p>' });
}

/* ================================================================= */
function moTp(c, w) {
  var A = c.A, t = c.t, d;
  try { d = A.xuatBan.chiTiet(w); } catch (e) { c.thongBao(e.message, 'no'); return; }

  var loaiTen = { 'bieu-dien': t('loaiBd'), 'co-khi': t('loaiCk'), 'content-id': t('loaiCid') };
  var than = '<div class="btnrow" style="margin-bottom:14px">' +
    '<button type="button" class="btn sm" data-sua-iswc>' + HM.esc(t('suaIswc')) + '</button>' +
    '<button type="button" class="btn sm pri" data-sua-tg>' + HM.esc(t('sua')) + '</button></div>' +
    HM.kv([
    { t: t('cIswc'), v: d.iswc || '—', manh: !!d.iswc },
    { t: t('cTong'), vHtml: true, manh: true,
      v: d.canTyLe ? '<span class="pos">100%</span>' : '<span class="neg">' + d.tongTyLe + '%</span>' },
    { t: t('cBanGhi'), v: HT.fmt.n(d.soBanGhi) }
  ]);

  than += '<h4 class="sec">' + HM.esc(t('cTacGia')) + '</h4><div class="tw"><table class="t"><tbody>' +
    d.tacGia.map(function (g) {
      return '<tr><td>' + HM.esc(g.ten) + '</td><td>' + HM.tag(g.vaiTro, '') + '</td>' +
        '<td class="num mono">' + g.tyLe + '%</td><td class="mono muted">' + HM.esc(g.ipi || '—') + '</td>' +
        '<td>' + (g.kiemSoat ? HM.tag('Haustek', 'ok') : HM.tag('—', '')) + '</td></tr>';
    }).join('') + '</tbody></table></div>';

  than += '<h4 class="sec">' + HM.esc(t('trenBanTp')) + '</h4>';
  than += d.trenBan.rows.length
    ? '<div class="tw"><table class="t"><tbody>' + d.trenBan.rows.map(function (x) {
        return '<tr class="canh"><td>' + HM.esc(x.nuoc) + '</td><td>' + x.hoi.map(function (h) { return HM.tag(h, 'warn'); }).join(' ') +
          '</td><td class="num mono">' + HM.esc(c.tien(x.tienKy)) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    : '<p class="say">' + HM.esc(t('trenBanKhong')) + '</p>';

  than += '<h4 class="sec">' + HM.esc(t('dkTieu')) + '</h4><p class="say">' + HM.esc(t('dkMo')) + '</p>' +
    '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cHoi')) + '</th><th>' + HM.esc(t('cNuocH')) + '</th>' +
    '<th>' + HM.esc(t('cLoai')) + '</th><th>' + HM.esc(t('lTt')) + '</th><th>' + HM.esc(t('cMaHoi')) + '</th>' +
    '<th>' + HM.esc(t('cNgay')) + '</th><th></th></tr></thead><tbody>' +
    d.dangKy.map(function (x) {
      return '<tr' + (x.trangThai === 'tu-choi' || x.trangThai === 'trung-lap' ? ' class="canh"' : '') + '>' +
        '<td><b>' + HM.esc(x.ten) + '</b>' + (x.ghiChu ? '<div class="t-sub">' + HM.esc(x.ghiChu) + '</div>' : '') + '</td>' +
        '<td>' + HM.esc(x.nuoc) + '</td>' +
        '<td class="muted">' + HM.esc(loaiTen[x.loai] || x.loai) + '</td>' +
        '<td>' + HM.tag(TT[c.lang][x.trangThai] || x.trangThai, TT_KIEU[x.trangThai]) + (x.tay ? ' ' + HM.tag('tay', 'info') : '') + '</td>' +
        '<td class="mono">' + (x.maHoi ? HM.esc(x.maHoi) : '<span class="nil">—</span>') + '</td>' +
        '<td class="mono muted">' + (x.ngayKhop ? HM.esc(HT.fmt.ngay(x.ngayKhop)) : x.ngayGui ? HM.esc(HT.fmt.ngay(x.ngayGui)) : '<span class="nil">—</span>') + '</td>' +
        '<td><div class="btnrow" style="flex-wrap:nowrap">' +
          '<button type="button" class="btn sm ghost" data-dk="' + HM.esc(x.hoi) + '">' + HM.esc(t('datTt')) + '</button>' +
          (x.tay ? '<button type="button" class="btn sm ghost" data-dk-bo="' + HM.esc(x.hoi) + '">' + HM.esc(t('boTay')) + '</button>' : '') +
        '</div></td></tr>';
    }).join('') + '</tbody></table></div>';

  c.nganTruot(than, {
    tieuDe: d.ten, phu: (d.iswc || t('locThieu')) + ' · ' + HT.fmt.n(d.soBanGhi) + ' ' + t('cBanGhi').toLowerCase(),
    khiMo: function (ngan) {
      HM.bam(ngan, '[data-sua-iswc]', function () {
        c.hoiThoai({ tieuDe: t('hoiIswc'), moTa: HM.esc(t('hoiIswcMo')),
          than: '<input class="in mono" data-o="iswc" value="' + HM.esc(d.iswc || '') + '" placeholder="T-123456789-0">',
          dong: t('suaIswc') }).then(function (f) {
            if (!f) return;
            try { A.xuatBan.ghi(w, { iswc: f.iswc }, A.staff.me.name); c.thongBao(t('daGhi'), 'ok'); c.dongNgan(); HM.quenHet(); c.veLai(); }
            catch (e) { c.thongBao(e.message, 'no'); }
          });
      });
      HM.bam(ngan, '[data-sua-tg]', function () {
        var mau = d.tacGia.map(function (g) { return [g.ten, g.vaiTro, g.tyLe, g.ipi || ''].join(' | '); }).join('\n');
        c.hoiThoai({ tieuDe: t('hoiTg'), moTa: HM.esc(t('hoiTgMo')),
          than: '<textarea class="in mono" rows="6" data-o="tg">' + HM.esc(mau) + '</textarea>',
          dong: t('sua'), rong: true }).then(function (f) {
            if (!f) return;
            var ds = String(f.tg || '').split(/\n/).map(function (l) {
              var x = l.split('|').map(function (y) { return y.trim(); });
              return x[0] ? { ten: x[0], vaiTro: x[1] || 'CA', tyLe: parseFloat(x[2]) || 0, ipi: x[3] || '', kiemSoat: true } : null;
            }).filter(Boolean);
            try { A.xuatBan.ghi(w, { tacGia: ds }, A.staff.me.name); c.thongBao(t('daGhi'), 'ok'); c.dongNgan(); HM.quenHet(); c.veLai(); }
            catch (e) { c.thongBao(e.message, 'no'); }
          });
      });
      HM.bam(ngan, '[data-dk]', function (el) {
        var h = el.getAttribute('data-dk');
        var ten = (A.xuatBan.hoi().find(function (x) { return x.id === h; }) || {}).ten || h;
        c.hoiThoai({ tieuDe: t('hoiDat').replace('{h}', ten), moTa: HM.esc(t('hoiDatMo')),
          than: '<label class="fld">' + HM.esc(t('lTt')) + '</label>' +
            '<select class="in" data-o="tt">' + ['chua-gui', 'da-gui', 'da-khop', 'tu-choi', 'trung-lap'].map(function (k) {
              return '<option value="' + k + '">' + HM.esc(TT[c.lang][k]) + '</option>'; }).join('') + '</select>' +
            '<label class="fld">' + HM.esc(t('lMa')) + '</label><input class="in mono" data-o="ma">' +
            '<label class="fld">' + HM.esc(t('lGhi')) + '</label><input class="in" data-o="ghi">',
          dong: t('datTt') }).then(function (f) {
            if (!f) return;
            try {
              A.xuatBan.datDangKy(w, h, { trangThai: f.tt, maHoi: f.ma, ghiChu: f.ghi }, A.staff.me.name);
              c.thongBao(t('daDk').replace('{h}', ten).replace('{t}', TT[c.lang][f.tt]), 'ok');
              c.dongNgan(); HM.quenHet(); c.veLai();
            } catch (e) { c.thongBao(e.message, 'no'); }
          });
      });
      HM.bam(ngan, '[data-dk-bo]', function (el) {
        var h = el.getAttribute('data-dk-bo');
        try { A.xuatBan.boDangKy(w, h, A.staff.me.name); c.thongBao(t('daBoDk').replace('{h}', h), 'ok'); c.dongNgan(); HM.quenHet(); c.veLai(); }
        catch (e) { c.thongBao(e.message, 'no'); }
      });
    }
  });
}

})();
