/* =====================================================================
   NỘI BỘ · ĐỐI TÁC
   ---------------------------------------------------------------------
   Sổ đối tác cho đội kinh doanh và quản lý: mọi label, label con và nghệ
   sĩ đang ký với Haustek, ai phụ trách, xếp hạng theo doanh thu quý, hạn
   hợp đồng, tình trạng tài khoản cổng. Tab thứ hai là chỉ tiêu kinh doanh
   theo từng nhân viên: doanh thu gộp quý của các tài khoản họ phụ trách
   so với chỉ tiêu. Số ở đây là số nội bộ (gộp), không phải số đối tác thấy.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'ds', tim: '', nv: '', tt: '', loai: '', hang: '' };
var TT = ['managed', 'renew', 'incomplete', 'never-logged', 'no-account', 'inactive'];
var KIEU_TT = { managed: 'ok', renew: 'warn', inactive: '', incomplete: 'no', 'never-logged': 'info', 'no-account': '' };
var CHU_TT = { managed: 'ttManaged', renew: 'ttRenew', inactive: 'ttInactive', incomplete: 'ttIncomplete', 'never-logged': 'ttNeverLogged', 'no-account': 'ttNoAccount' };
var KIEU_HANG = { A: 'ok', B: 'info', C: '' };

HT.dangKy({
  id: 'doi-tac', nav: 'navDoiTac', nhom: 'nhomDoiTac', icon: 'user',
  vai: ['sales', 'mgmt', 'ops', 'support', 'accounting'],
  dem: function (c) {
    try {
      var me = c.A.staff.me;
      if (me.role !== 'sales') return '';
      var n = c.A.parties.list({ manager: me.id, status: 'renew' }).rows.length;
      return n ? String(n) : '';
    } catch (e) { return ''; }
  },

  chu: {
    vi: {
      nhomDoiTac: 'Đối tác', navDoiTac: 'Đối tác', h1: 'Đối tác',
      mo: 'Mọi label, label con và nghệ sĩ đang ký với Haustek: ai phụ trách, xếp hạng, doanh thu gộp quý, hạn hợp đồng và tình trạng tài khoản cổng.',
      kTong: 'Đối tác', kQuanLy: 'Đang quản lý', kGiaHan: 'Sắp hết hạn hợp đồng', kGiaHanS: 'trong 90 ngày',
      kThieu: 'Thiếu hồ sơ', kChuaDn: 'Chưa đăng nhập', kChuaTk: 'Chưa có tài khoản cổng',
      tabDs: 'Danh sách', tabKd: 'Chỉ tiêu kinh doanh',
      tim: 'Tìm tên hoặc mã đối tác…', moiNv: 'Mọi người phụ trách', moiLoai: 'Mọi loại', moiHang: 'Mọi hạng', hangX: 'Hạng {c}',
      label: 'Label', sublabel: 'Label con', artist: 'Nghệ sĩ', xuat: 'Xuất CSV',
      ttManaged: 'Đang quản lý', ttRenew: 'Sắp hết hạn', ttInactive: 'Không hoạt động', ttIncomplete: 'Thiếu hồ sơ',
      ttNeverLogged: 'Chưa đăng nhập', ttNoAccount: 'Chưa có tài khoản', ttAll: 'Tất cả',
      cDoiTac: 'Đối tác', cNv: 'Người phụ trách', cHang: 'Hạng', cDtQ: 'Doanh thu gộp quý', cLuotQ: 'Lượt nghe quý', cBai: 'Bản ghi',
      cHopDong: 'Hết hạn hợp đồng', cTk: 'Tài khoản cổng', cTt: 'Tình trạng',
      conNgay: 'còn {n} ngày', daHet: 'đã hết hạn', chuaCoTk: 'chưa có', chuaDn: 'chưa đăng nhập', lanCuoi: 'lần cuối {d}',
      labelCon: '{n} label con', khong: 'Không có đối tác nào khớp bộ lọc', khongMo: 'Đổi bộ lọc phía trên.',
      /* ngăn */
      dNv: 'Người phụ trách', dDoi: 'Đổi người phụ trách…', daDoi: 'Đã đổi người phụ trách',
      dKy: 'Ký hợp đồng', dHet: 'Hết hạn hợp đồng', dTyLe: 'Tỷ lệ nghệ sĩ được hưởng', dHang: 'Xếp hạng',
      dHangMo: 'A từ $150,000 gộp một quý · B từ $40,000 · C còn lại',
      dTk: 'Tài khoản cổng', dNh: 'Tài khoản ngân hàng', coNh: 'đã khai', chuaNh: 'chưa khai',
      dVi: 'Ví của đối tác', viKhaDung: 'Khả dụng', viCho: 'Đang xử lý', viDaRut: 'Đã rút',
      dTicket: 'Ticket đang mở', khongTicket: 'Không có ticket nào đang mở', taoTicket: 'Tạo ticket hộ', moHoTro: 'Mở hỗ trợ',
      dCha: 'Thuộc label mẹ', dDtQ: 'Doanh thu gộp quý này', soQuyTruoc: 'so với quý trước', dienBien: 'Doanh thu gộp 12 kỳ gần nhất',
      /* chỉ tiêu */
      kdTieuDe: 'Chỉ tiêu kinh doanh quý {q}',
      kdMo: 'Doanh thu gộp quý của các đối tác do từng nhân viên kinh doanh phụ trách, so với chỉ tiêu quý. Kỳ đang chọn quyết định quý.',
      kdTk: 'Tài khoản phụ trách', kdLabel: 'label', kdNs: 'nghệ sĩ', kdDt: 'Doanh thu gộp quý', kdChiTieu: 'Chỉ tiêu quý',
      kdDat: 'Đạt {p} chỉ tiêu', kdMoi: 'Tài khoản mới trong quý', kdGiaHan: 'Cần gia hạn', kdChuaDn: 'Chưa đăng nhập', kdChuaTk: 'Chưa có tài khoản',
      kdTheoHang: 'Tài khoản theo hạng', kdTop: 'Đối tác lớn nhất', kdSoSanh: 'Doanh thu gộp quý so với chỉ tiêu', kdLoc: 'Xem danh sách của nhân viên này',
      kdQuyTruoc: 'quý trước'
    },
    en: {
      nhomDoiTac: 'Partners', navDoiTac: 'Partners', h1: 'Partners',
      mo: 'Every label, sub-label and artist signed with Haustek: account manager, classification, quarterly gross, contract end and portal account status.',
      kTong: 'Partners', kQuanLy: 'Managed', kGiaHan: 'Contracts ending', kGiaHanS: 'within 90 days',
      kThieu: 'Incomplete', kChuaDn: 'Never logged in', kChuaTk: 'No portal account',
      tabDs: 'Directory', tabKd: 'Sales targets',
      tim: 'Search name or client ID…', moiNv: 'Any account manager', moiLoai: 'Any kind', moiHang: 'Any class', hangX: 'Class {c}',
      label: 'Label', sublabel: 'Sub-label', artist: 'Artist', xuat: 'Export CSV',
      ttManaged: 'Managed', ttRenew: 'Renewal due', ttInactive: 'Inactive', ttIncomplete: 'Incomplete',
      ttNeverLogged: 'Never logged in', ttNoAccount: 'No account', ttAll: 'All',
      cDoiTac: 'Partner', cNv: 'Account manager', cHang: 'Class', cDtQ: 'Quarter gross', cLuotQ: 'Quarter streams', cBai: 'Recordings',
      cHopDong: 'Contract ends', cTk: 'Portal account', cTt: 'Status',
      conNgay: '{n} days left', daHet: 'expired', chuaCoTk: 'none', chuaDn: 'never logged in', lanCuoi: 'last seen {d}',
      labelCon: '{n} sub-labels', khong: 'No partner matches the filters', khongMo: 'Change the filters above.',
      dNv: 'Account manager', dDoi: 'Change manager…', daDoi: 'Account manager changed',
      dKy: 'Signed', dHet: 'Contract ends', dTyLe: 'Artist share rate', dHang: 'Classification',
      dHangMo: 'A from $150,000 gross a quarter · B from $40,000 · C otherwise',
      dTk: 'Portal account', dNh: 'Bank account', coNh: 'on file', chuaNh: 'missing',
      dVi: 'Partner wallet', viKhaDung: 'Available', viCho: 'In progress', viDaRut: 'Withdrawn',
      dTicket: 'Open tickets', khongTicket: 'No open ticket', taoTicket: 'Log a ticket', moHoTro: 'Open support',
      dCha: 'Parent label', dDtQ: 'Gross this quarter', soQuyTruoc: 'vs previous quarter', dienBien: 'Gross, last 12 periods',
      kdTieuDe: 'Sales targets, quarter {q}',
      kdMo: 'Quarterly gross of the partners each salesperson manages, against the quarterly target. The selected period sets the quarter.',
      kdTk: 'Accounts managed', kdLabel: 'labels', kdNs: 'artists', kdDt: 'Quarter gross', kdChiTieu: 'Quarter target',
      kdDat: '{p} of target', kdMoi: 'New accounts this quarter', kdGiaHan: 'Renewals due', kdChuaDn: 'Never logged in', kdChuaTk: 'No account',
      kdTheoHang: 'Accounts by class', kdTop: 'Largest partners', kdSoSanh: 'Quarter gross against target', kdLoc: 'Show this person’s accounts',
      kdQuyTruoc: 'previous quarter'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, vi = c.lang === 'vi', P = HB.dayMau(), me = A.staff.me;
    var tatCa = A.parties.list({});
    var dem = tatCa.counts;

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [
        { l: t('kTong'), v: HT.fmt.n(dem.all) },
        { l: t('kQuanLy'), v: HT.fmt.n(dem.managed) },
        { l: t('kGiaHan'), v: HT.fmt.n(dem.renew), mau: dem.renew ? HB.mau('warn') : '' },
        { l: t('kChuaTk'), v: HT.fmt.n(dem['no-account']) }
      ]
    });
    html += HM.tabs([
      { k: 'ds', l: t('tabDs'), icon: 'list' },
      { k: 'kd', l: t('tabKd'), icon: 'up' }
    ], LOC.tab);

    if (LOC.tab === 'kd') html += veChiTieu(c);
    else html += veDanhSach(c, tatCa);

    root.innerHTML = html;
    if (LOC.tab === 'ds') dungBang(root, c);
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-tt]', function (el) { LOC.tt = el.getAttribute('data-tt'); c.veLai(); });
    HM.doi(root, '[data-nv]', function (el) { LOC.nv = el.value; c.veLai(); });
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; c.veLai(); });
    HM.doi(root, '[data-hang]', function (el) { LOC.hang = el.value; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-kd-loc]', function (el) { LOC.tab = 'ds'; LOC.nv = el.getAttribute('data-kd-loc'); LOC.tt = ''; c.veLai(); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-xuat]', function () {
      var rows = A.parties.list({ q: LOC.tim, manager: LOC.nv, status: LOC.tt, kind: LOC.loai, classification: LOC.hang }).rows;
      HM.csv('doi-tac.csv',
        [vi ? 'Mã' : 'Client ID', vi ? 'Tên' : 'Name', vi ? 'Loại' : 'Kind', t('cNv'), t('cHang'), t('cDtQ') + ' USD', vi ? 'Quý trước USD' : 'Previous quarter USD',
         t('cLuotQ'), t('cBai'), t('dKy'), t('cHopDong'), t('cTk'), t('cTt')],
        rows.map(function (r) {
          return [r.clientId, r.name, r.kind, r.managerName || '', r.classification, r.revenueQ.toFixed(2), r.revenuePrevQ.toFixed(2),
                  r.streamsQ, r.tracks, r.signedAt || '', r.contractEnd || '', r.hasAccount ? (r.lastSeen || t('chuaDn')) : t('chuaCoTk'), t(CHU_TT[r.status])];
        }));
    });
  }
});

/* ---------------------------------------------------------------------
   Tab danh sách: bộ lọc + bảng (bảng dựng sau khi gắn root, qua c.bang)
   --------------------------------------------------------------------- */
function veDanhSach(c, tatCa) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  var dem = tatCa.counts;
  var sales = A.staff.byRole('sales').concat(A.staff.byRole('mgmt'));
  var html = '<div class="bar">' +
    '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
    '<select class="in" data-nv style="width:auto;height:34px"><option value="">' + HM.esc(t('moiNv')) + '</option>' +
      sales.map(function (s) { return '<option value="' + s.id + '"' + (LOC.nv === s.id ? ' selected' : '') + '>' + HM.esc(s.name) + '</option>'; }).join('') + '</select>' +
    '<select class="in" data-loai style="width:auto;height:34px"><option value="">' + HM.esc(t('moiLoai')) + '</option>' +
      ['label', 'sublabel', 'artist'].map(function (k) { return '<option value="' + k + '"' + (LOC.loai === k ? ' selected' : '') + '>' + HM.esc(t(k)) + '</option>'; }).join('') + '</select>' +
    '<select class="in" data-hang style="width:auto;height:34px"><option value="">' + HM.esc(t('moiHang')) + '</option>' +
      ['A', 'B', 'C'].map(function (k) { return '<option value="' + k + '"' + (LOC.hang === k ? ' selected' : '') + '>' + HM.esc(t('hangX').replace('{c}', k)) + '</option>'; }).join('') + '</select>' +
    '<div class="sp"></div>' +
    '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button></div>';
  html += '<div class="bar">' +
    '<button type="button" class="pill' + (LOC.tt === '' ? ' on' : '') + '" data-tt="">' + HM.esc(t('ttAll')) + ' <b>' + HT.fmt.n(dem.all) + '</b></button>' +
    TT.map(function (k) {
      return '<button type="button" class="pill' + (LOC.tt === k ? ' on' : '') + '" data-tt="' + k + '">' + HM.esc(t(CHU_TT[k])) + ' <b>' + HT.fmt.n(dem[k] || 0) + '</b></button>';
    }).join('') + '</div>';
  html += HM.the({ thoBody: true, than: '<div data-bang></div>' });
  return html;
}

function dungBang(root, c) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  var host = root.querySelector('[data-bang]');
  if (!host) return;
  var kq = A.parties.list({ q: LOC.tim, manager: LOC.nv, status: LOC.tt, kind: LOC.loai, classification: LOC.hang });
  var rows = kq.rows;
  var b = c.bang({
    host: host, dong: function () { return rows; }, sort: 'revenueQ', dir: -1, co: 25,
    cot: [
      { k: 'name', l: t('cDoiTac') },
      { k: 'managerName', l: t('cNv'), w: '128px' },
      { k: 'classification', l: t('cHang'), w: '58px' },
      { k: 'revenueQ', l: t('cDtQ'), num: true, w: '128px' },
      { k: 'streamsQ', l: t('cLuotQ'), num: true, w: '110px' },
      { k: 'tracks', l: t('cBai'), num: true, w: '76px' },
      { k: 'daysToEnd', l: t('cHopDong'), w: '124px' },
      { k: 'lastSeen', l: t('cTk'), w: '128px' },
      { k: 'status', l: t('cTt'), w: '118px' }
    ],
    veDong: function (r) {
      var hd = r.contractEnd
        ? '<div>' + HM.esc(HT.fmt.date(r.contractEnd)) + '</div><div class="t-sub" style="color:' +
          (r.daysToEnd < 0 ? 'var(--danger)' : r.daysToEnd <= 90 ? 'var(--warn)' : 'inherit') + '">' +
          HM.esc(r.daysToEnd < 0 ? t('daHet') : t('conNgay').replace('{n}', HT.fmt.n(r.daysToEnd))) + '</div>'
        : '<span class="nil">—</span>';
      var tk = !r.hasAccount ? HM.cham('off', t('chuaCoTk'))
        : r.lastSeen ? HM.cham('ok', t('lanCuoi').replace('{d}', HT.fmt.date(r.lastSeen)))
        : HM.cham('warn', t('chuaDn'));
      return '<td style="min-width:200px"><div class="t-ttl">' + HM.esc(HM.dai(r.name, 34)) + '</div>' +
          '<div class="t-sub" style="white-space:nowrap">' + HM.tag(t(r.kind), r.kind === 'artist' ? 'link' : 'info') + ' ' + HM.esc(r.clientId) + (r.children ? ' · ' + HM.esc(t('labelCon').replace('{n}', r.children)) : '') + '</div></td>' +
        '<td>' + (r.managerName ? HM.esc(r.managerName) : '<span class="nil">—</span>') + '</td>' +
        '<td>' + HM.tag(r.classification, KIEU_HANG[r.classification] || '') + '</td>' +
        '<td class="num band"><b>' + HM.esc(c.tien(r.revenueQ)) + '</b><div class="t-sub">' + HM.lechHtml(r.revenueQ, r.revenuePrevQ) + '</div></td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(r.streamsQ)) + '</td>' +
        '<td class="num">' + HM.esc(HT.fmt.n(r.tracks)) + '</td>' +
        '<td>' + hd + '</td>' +
        '<td>' + tk + '</td>' +
        '<td>' + HM.tag(t(CHU_TT[r.status]), KIEU_TT[r.status]) + '</td>';
    },
    chon: function (r) { moDoiTac(c, r); },
    rongTieuDe: t('khong'), rongMoTa: t('khongMo')
  });
  b.ve();
  HM.bam(host, '[data-sx]', function (el) {
    var k = el.getAttribute('data-sx');
    if (b.st.sort === k) b.st.dir = -b.st.dir; else { b.st.sort = k; b.st.dir = (k === 'name' || k === 'managerName' || k === 'classification') ? 1 : -1; }
    b.ve(); HB.gan(host);
  });
  HM.bam(host, '[data-tr]', function (el) { b.st.trang += +el.getAttribute('data-tr'); b.ve(); });
  HM.doi(host, '[data-co]', function (el) { b.st.co = +el.value; b.st.trang = 0; b.ve(); });
  HM.bam(host, 'tr.pick', function (el) { var r = b.rows[+el.getAttribute('data-r')]; if (r) moDoiTac(c, r); });
}

/* ---------------------------------------------------------------------
   Tab chỉ tiêu kinh doanh: một thẻ cho mỗi nhân viên kinh doanh
   --------------------------------------------------------------------- */
function veChiTieu(c) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', P = HB.dayMau();
  var ds = A.staff.byRole('sales').map(function (s) { return A.sales.kpi(s.id, c.ky.idx); });
  if (!ds.length) return HM.the({ than: HM.trong({ icon: 'user', tieuDe: t('khong'), moTa: '' }) });
  var q = ds[0].quarterLabel;
  var html = HM.the({
    h2: HM.esc(t('kdTieuDe').replace('{q}', q)), p: HM.esc(t('kdMo')),
    than: HB.o({ loai: 'thanh', tenTong: t('kdDt'), hang: ds.map(function (k, i) {
      return { ten: k.staff.name, gt: k.revenueQ, mau: k.targetPct >= 1 ? HB.mau('ok') : P[i % 8],
               phu: t('kdChiTieu') + ' ' + HT.fmt.usd0(k.target) + ' · ' + t('kdDat').replace('{p}', HT.fmt.pct(k.targetPct)) };
    }) })
  });
  html += '<div class="grid g2">' + ds.map(function (k, i) {
    var pct = Math.max(0, Math.min(100, k.targetPct * 100));
    return HM.the({
      h2: HM.esc(k.staff.name), p: HM.esc(vi ? k.staff.title : k.staff.titleEn),
      hanhDong: '<button type="button" class="btn sm" data-kd-loc="' + k.staff.id + '">' + HM.esc(t('kdLoc')) + '</button>',
      than: HM.so([
        { l: t('kdDt'), v: HT.fmt.usd0(k.revenueQ), d: HM.lech(k.revenueQ, k.revenuePrevQ, t('kdQuyTruoc')), mau: k.targetPct >= 1 ? HB.mau('ok') : '' },
        { l: t('kdTk'), v: HT.fmt.n(k.accounts), s: HT.fmt.n(k.labels) + ' ' + t('kdLabel') + ' · ' + HT.fmt.n(k.artists) + ' ' + t('kdNs') },
        { l: t('kdChiTieu'), v: HT.fmt.usd0(k.target), s: t('kdDat').replace('{p}', HT.fmt.pct(k.targetPct)) }
      ]) +
      '<div class="meter" style="margin-top:12px"><i style="width:' + pct.toFixed(1) + '%;background:' + (k.targetPct >= 1 ? HB.mau('ok') : P[i % 8]) + '"></i></div>' +
      '<div class="grid g2" style="margin:14px 0 0">' +
        '<div><h4 class="sec" style="margin-top:0">' + HM.esc(t('kdTheoHang')) + '</h4>' +
          HB.o({ loai: 'vong', cao: 150, dinhDang: 'so', tenTong: t('kdTk'), giua: { v: HT.fmt.n(k.accounts), l: t('kdTk').toLowerCase() },
            phan: k.byClass.map(function (x, j) { return { ten: t('hangX').replace('{c}', x.c), gt: x.n, mau: P[j % 8] }; }) }) +
        '</div>' +
        '<div><h4 class="sec" style="margin-top:0">' + HM.esc(t('kdTop')) + '</h4>' +
          HB.o({ loai: 'thanh', tenTong: t('kdDt'), hang: (k.top || []).slice(0, 5).map(function (x, j) { return { ten: x.name, gt: x.revenueQ, mau: P[j % 8], phu: x.clientId }; }) }) +
        '</div></div>' +
      HM.kv([
        { t: t('kdMoi'), v: HT.fmt.n(k.newAccounts) },
        { t: t('kdGiaHan'), v: HT.fmt.n((k.renewals || []).length), mau: (k.renewals || []).length ? 'neg' : '' },
        { t: t('kdChuaDn'), v: HT.fmt.n(k.neverLogged) },
        { t: t('kdChuaTk'), v: HT.fmt.n(k.noAccount) }
      ])
    });
  }).join('') + '</div>';
  return html;
}

/* ---------------------------------------------------------------------
   Ngăn: một đối tác
   --------------------------------------------------------------------- */
function moDoiTac(c, r) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', P = HB.dayMau(), me = A.staff.me;
  var pk = r.partyKey, id = +pk.slice(2), laNs = r.kind === 'artist';
  var w = null; try { w = A.wallet(pk); } catch (e) { w = null; }
  var tk = []; try { tk = A.tickets.list({ status: 'open-all' }).filter(function (x) { return x.partyKey === pk; }); } catch (e) { tk = []; }
  var sales = A.staff.byRole('sales').concat(A.staff.byRole('mgmt'));
  var lich = A.periods.map(function (p, i) { return A.agg(laNs ? 'artist' : 'label', id, i, 'rec').gross; });

  c.nganTruot(
    HM.so([
      { l: t('dDtQ'), v: c.tien(r.revenueQ), lon: true, d: HM.lech(r.revenueQ, r.revenuePrevQ, t('soQuyTruoc')) },
      { l: t('cLuotQ'), v: HT.fmt.n(r.streamsQ) },
      { l: t('cBai'), v: HT.fmt.n(r.tracks) }
    ]) +
    HM.kv([
      { t: t('dNv'), vHtml: true, v: '<select class="inline-sel" data-nv-moi>' + sales.map(function (s) {
          return '<option value="' + s.id + '"' + (s.id === r.manager ? ' selected' : '') + '>' + HM.esc(s.name) + '</option>';
        }).join('') + (r.manager ? '' : '<option value="" selected>—</option>') + '</select>' },
      { t: t('dHang'), v: r.classification + ' · ' + t('dHangMo') },
      r.parentId >= 0 && r.kind === 'sublabel' ? { t: t('dCha'), v: A.partyName('L:' + r.parentId) } : null,
      { t: t('dTyLe'), v: HT.fmt.pct(r.rate) },
      { t: t('dKy'), v: r.signedAt ? HT.fmt.date(r.signedAt) : '—' },
      { t: t('dHet'), v: r.contractEnd ? HT.fmt.date(r.contractEnd) + ' · ' + (r.daysToEnd < 0 ? t('daHet') : t('conNgay').replace('{n}', HT.fmt.n(r.daysToEnd))) : '—',
        manh: r.daysToEnd != null && r.daysToEnd <= 90 },
      { t: t('dTk'), v: r.hasAccount ? ((r.accounts || []).join(', ') || '1') + ' · ' + (r.lastSeen ? t('lanCuoi').replace('{d}', HT.fmt.date(r.lastSeen)) : t('chuaDn')) : t('chuaCoTk') },
      { t: t('dNh'), v: r.bank ? t('coNh') : t('chuaNh'), mau: r.bank ? '' : 'neg' },
      { t: t('cTt'), v: t(CHU_TT[r.status]) }
    ]) +
    (w ? '<h4 class="sec">' + HM.esc(t('dVi')) + '</h4>' + HM.so([
      { l: t('viKhaDung'), v: HT.fmt.usd(w.available), mau: HB.mau('ok') },
      { l: t('viCho'), v: HT.fmt.usd(w.pending) },
      { l: t('viDaRut'), v: HT.fmt.usd(w.paid) }
    ]) : '') +
    '<h4 class="sec">' + HM.esc(t('dTicket')) + ' <span class="muted">(' + tk.length + ')</span></h4>' +
    (tk.length ? '<div class="tw"><table class="t" style="min-width:0"><tbody>' + tk.slice(0, 6).map(function (x) {
      return '<tr class="pick" data-tk="' + HM.esc(x.id) + '"><td><div class="t-ttl">' + HM.esc(HM.dai(x.title, 40)) + '</div><div class="t-sub">' + HM.esc(x.id) + '</div></td>' +
        '<td>' + HM.tag(x.status, x.status === 'done' ? 'ok' : x.status === 'waiting' ? 'warn' : 'info') + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="say">' + HM.esc(t('khongTicket')) + '</p>') +
    '<div class="btnrow" style="margin-top:10px">' +
      '<button type="button" class="btn sm pri" data-tao-tk>' + HM.icon('info') + HM.esc(t('taoTicket')) + '</button>' +
      '<button type="button" class="btn sm" data-di="ho-tro">' + HM.esc(t('moHoTro')) + '</button></div>' +
    '<h4 class="sec">' + HM.esc(t('dienBien')) + '</h4>' +
    HB.o({ loai: 'cot', cao: 150, anTruc: true, chuThich: false,
      truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
      tieuDeTip: function (i) { return (vi ? 'Kỳ ' : 'Period ') + A.periods[i].label; },
      chuoi: [{ ten: t('cDtQ'), gt: lich, mau: P[0] }], noiBat: c.ky.idx }),
    { tieuDe: r.name, phu: r.clientId + ' · ' + t(r.kind),
      khiMo: function (dr) {
        HB.gan(dr);
        HM.doi(dr, '[data-nv-moi]', function (el) {
          try { A.parties.setManager(pk, el.value, me.email); c.thongBao(t('daDoi'), 'ok'); c.veLai(); }
          catch (e) { c.thongBao(e.message, 'no'); }
        });
        HM.bam(dr, '[data-tao-tk]', function () { if (HT.moTicketNoiBo) HT.moTicketNoiBo(c, { partyKey: pk, name: r.name, clientId: r.clientId }); });
        HM.bam(dr, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
        HM.bam(dr, '[data-tk]', function (el) { if (HT.hoTroMo) HT.hoTroMo(c, el.getAttribute('data-tk')); });
      } });
}

})();
