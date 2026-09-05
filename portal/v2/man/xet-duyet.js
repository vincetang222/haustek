/* =====================================================================
   NỘI BỘ · XÉT DUYỆT (tạm ứng, hợp đồng)
   ---------------------------------------------------------------------
   Một hàng chờ cho mọi vai: kinh doanh (hoặc đối tác từ cổng) đề xuất →
   kế toán kiểm số → giám đốc xét duyệt. Mỗi đề xuất mang bản tính chụp
   lúc tạo: thu nhập ròng 12 kỳ, tăng trưởng, độ dao động, độ tập trung,
   mức nên ứng tối đa, thời gian thu hồi, phí ứng và phần Haustek giữ trong
   thời gian thu hồi (ROI), hạng rủi ro, khuyến nghị. Giám đốc bấm duyệt /
   từ chối / trả lại ngay trên dòng; mọi thao tác ghi nhật ký. Duyệt xong
   thì sổ tạm ứng hoặc phí hợp đồng đổi theo từ kỳ mở tiếp theo.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'cho', loai: 'all', tim: '', trang: 0 };
var VAI_DUYET = ['mgmt'], VAI_KIEM = ['accounting', 'mgmt'];

var CHU = null; /* gán sau khi đăng ký, để hộp thoại dùng chung tra được chữ từ màn khác */
function tx(k) { var d = (CHU && CHU[HT.lang]) || (CHU && CHU.vi) || {}; return d[k] != null ? d[k] : k; }

HT.dangKy({
  id: 'xet-duyet', nav: 'navXetDuyet', nhom: 'nhomTien', icon: 'check',
  vai: ['ops', 'sales', 'support', 'mgmt', 'accounting'],
  dem: function (c) { try { var k = c.A.proposals.counts(), r = c.A.staff.me.role; if (r === 'accounting') return k.submitted ? '!' + k.submitted : ''; if (r === 'mgmt') return k.checked ? '!' + k.checked : (k.pending ? String(k.pending) : ''); return k.pending ? String(k.pending) : ''; } catch (e) { return ''; } },

  chu: {
    vi: {
      navXetDuyet: 'Xét duyệt', h1: 'Xét duyệt đề xuất',
      mo: 'Tạm ứng và hợp đồng: kinh doanh hoặc đối tác đề xuất, kế toán kiểm số, giám đốc xét duyệt. Mỗi đề xuất có bản tính ROI và hạng rủi ro chụp lúc tạo.',
      kCho: 'Chờ xét duyệt', kChoS: '{a} chờ kiểm số · {b} đã kiểm', kUng: 'Tạm ứng đề xuất đang chờ', kUngS: 'tổng số tiền', kDuyet: 'Đã duyệt', kDuyetS: '{a} tạm ứng · {b} hợp đồng', kTuChoi: 'Từ chối / trả lại', kRoi: 'ROI trung bình', kRoiS: 'trên vốn ứng · các tạm ứng đang chờ',
      tabCho: 'Đang chờ', tabXong: 'Đã xử lý', tabToi: 'Của tôi',
      loaiAll: 'Mọi loại', loaiUng: 'Tạm ứng', loaiHd: 'Hợp đồng', tim: 'Tìm đối tác, mã đề xuất…',
      cDx: 'Đề xuất', cTk: 'Đối tác', cNoiDung: 'Nội dung', cRoi: 'ROI', cHang: 'Hạng', cKn: 'Khuyến nghị', cTt: 'Trạng thái', cTuoi: 'Tuổi', cThaoTac: 'Thao tác', ngay: 'ngày',
      themUng: 'Đề xuất tạm ứng', themHd: 'Đề xuất hợp đồng',
      duyet: 'Duyệt', tuChoi: 'Từ chối', traLai: 'Trả lại', kiem: 'Đã kiểm số', rut: 'Rút', guiLai: 'Gửi lại',
      hoiDuyet: 'Duyệt {id} cho {t}?', hoiDuyetUng: 'Khoản {a} cộng phí ứng {f} được ghi vào sổ tạm ứng của đối tác và thu hồi từ phần họ được hưởng mỗi kỳ.', hoiDuyetHd: 'Phí Haustek {f} áp cho đối tác từ kỳ mở tiếp theo, hạn {m} tháng; hợp đồng cũ hết hiệu lực.',
      hoiTuChoi: 'Từ chối {id}', hoiTraLai: 'Trả lại {id} để bổ sung', lyDo: 'Lý do (đối tác và người đề xuất đều thấy)', hoiKiem: 'Xác nhận đã kiểm số {id}', hoiKiemMo: 'Bạn đã đối chiếu thu nhập 12 kỳ với bảng kê và sổ tạm ứng.', ghiChu: 'Ghi chú',
      daDuyet: 'Đã duyệt {id}', daTuChoi: 'Đã từ chối {id}', daTraLai: 'Đã trả lại {id}', daKiem: 'Đã ghi kiểm số {id}', daRut: 'Đã rút {id}', daGuiLai: 'Đã gửi lại {id}',
      khong: 'Không có đề xuất nào', khongMo: 'Đề xuất mới bấm ở góc phải, hoặc từ ngăn hồ sơ đối tác.',
      fTk: 'Đối tác (tên hoặc mã)', fSo: 'Số tiền tạm ứng (USD)', fPhi: 'Phí ứng', fGhi: 'Mục đích / ghi chú', fHan: 'Kỳ hạn (tháng)', fPhiHd: 'Phí Haustek trên doanh thu gộp', fDocQuyen: 'Độc quyền', xemTinh: 'Bản tính theo số đang nhập', khongThayTk: 'Không tìm thấy đối tác “{q}”', daTao: 'Đã tạo đề xuất {id}',
      chiTiet: 'Đề xuất', cuaDoiTac: 'gửi từ cổng đối tác'
    },
    en: {
      navXetDuyet: 'Approvals', h1: 'Proposal approvals',
      mo: 'Advances and contracts: sales or the partner proposes, accounting checks the figures, the director approves. Each proposal carries an ROI calculation and risk grade snapshotted at creation.',
      kCho: 'Awaiting approval', kChoS: '{a} awaiting check · {b} checked', kUng: 'Advances proposed, pending', kUngS: 'total amount', kDuyet: 'Approved', kDuyetS: '{a} advances · {b} contracts', kTuChoi: 'Rejected / returned', kRoi: 'Average ROI', kRoiS: 'on capital · pending advances',
      tabCho: 'Pending', tabXong: 'Handled', tabToi: 'Mine',
      loaiAll: 'Any kind', loaiUng: 'Advances', loaiHd: 'Contracts', tim: 'Search partner, proposal id…',
      cDx: 'Proposal', cTk: 'Partner', cNoiDung: 'Terms', cRoi: 'ROI', cHang: 'Grade', cKn: 'Recommendation', cTt: 'Status', cTuoi: 'Age', cThaoTac: 'Actions', ngay: 'days',
      themUng: 'Propose advance', themHd: 'Propose contract',
      duyet: 'Approve', tuChoi: 'Reject', traLai: 'Return', kiem: 'Checked', rut: 'Withdraw', guiLai: 'Resubmit',
      hoiDuyet: 'Approve {id} for {t}?', hoiDuyetUng: '{a} plus the {f} advance fee is booked to the partner’s advance ledger and recouped from their share each period.', hoiDuyetHd: 'Haustek fee {f} applies to the partner from the next open period for {m} months; the old contract ends.',
      hoiTuChoi: 'Reject {id}', hoiTraLai: 'Return {id} for changes', lyDo: 'Reason (visible to the partner and the proposer)', hoiKiem: 'Confirm figures checked for {id}', hoiKiemMo: 'You have reconciled 12 periods of earnings against statements and the advance ledger.', ghiChu: 'Note',
      daDuyet: 'Approved {id}', daTuChoi: 'Rejected {id}', daTraLai: 'Returned {id}', daKiem: 'Recorded check for {id}', daRut: 'Withdrew {id}', daGuiLai: 'Resubmitted {id}',
      khong: 'No proposals', khongMo: 'Create one at the top right, or from a partner’s drawer.',
      fTk: 'Partner (name or id)', fSo: 'Advance amount (USD)', fPhi: 'Advance fee', fGhi: 'Purpose / note', fHan: 'Term (months)', fPhiHd: 'Haustek fee on gross revenue', fDocQuyen: 'Exclusive', xemTinh: 'Calculation for the figures entered', khongThayTk: 'No partner matching “{q}”', daTao: 'Created proposal {id}',
      chiTiet: 'Proposal', cuaDoiTac: 'sent from the partner portal'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, me = A.staff.me, vi = c.lang === 'vi';
    var all = A.proposals.list(), k = A.proposals.counts(), qq = LOC.tim.trim().toLowerCase();
    var choUng = all.filter(function (p) { return p.type === 'advance' && ['submitted', 'checked', 'returned'].indexOf(p.status) >= 0; });
    var roiTb = choUng.length ? choUng.reduce(function (s, p) { return s + (p.calc.roi || 0); }, 0) / choUng.length : null;
    var rows = all.filter(function (p) {
      if (LOC.tab === 'cho' && ['submitted', 'checked', 'returned'].indexOf(p.status) < 0) return false;
      if (LOC.tab === 'xong' && ['approved', 'rejected', 'withdrawn'].indexOf(p.status) < 0) return false;
      if (LOC.tab === 'toi' && p.by !== me.name) return false;
      if (LOC.loai !== 'all' && p.type !== LOC.loai) return false;
      if (qq && (p.id + ' ' + p.party.name + ' ' + p.party.clientId + ' ' + p.by).toLowerCase().indexOf(qq) < 0) return false;
      return true;
    });
    var pt = HTM.phanTrang(rows, LOC);
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: '<button type="button" class="btn" data-them-hd>' + HM.icon('file') + HM.esc(t('themHd')) + '</button><button type="button" class="btn pri" data-them-ung>' + HM.icon('cash') + HM.esc(t('themUng')) + '</button>' });
    html += HM.so([
      { l: t('kCho'), v: HT.fmt.n(k.pending), lon: true, s: t('kChoS').replace('{a}', k.submitted).replace('{b}', k.checked) },
      { l: t('kUng'), v: c.tien2(choUng.reduce(function (s, p) { return s + p.terms.amount; }, 0)), s: t('kUngS') },
      { l: t('kDuyet'), v: HT.fmt.n(k.approved), s: t('kDuyetS').replace('{a}', c.tien2(k.approvedAdvance)).replace('{b}', k.approvedContract), mau: k.approved ? HB.mau('ok') : '' },
      { l: t('kTuChoi'), v: HT.fmt.n(k.rejected + k.returned) },
      { l: t('kRoi'), v: roiTb == null ? '—' : HT.fmt.pct(roiTb), s: t('kRoiS') }
    ]);
    html += HM.tabs([{ k: 'cho', l: t('tabCho'), dem: k.pending }, { k: 'xong', l: t('tabXong'), dem: k.approved + k.rejected + k.withdrawn || undefined }, { k: 'toi', l: t('tabToi') }], LOC.tab);
    html += '<div class="bar">' +
      [['all', t('loaiAll')], ['advance', t('loaiUng')], ['contract', t('loaiHd')]].map(function (x) { return '<button type="button" class="pill' + (LOC.loai === x[0] ? ' on' : '') + '" data-loai="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div></div>';
    html += HM.the({ thoBody: true,
      than: !rows.length ? HM.trong({ icon: 'check', tieuDe: t('khong'), moTa: t('khongMo') }) :
        '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cTk')) + '</th><th>' + HM.esc(t('cNoiDung')) + '</th><th class="num">' + HM.esc(t('cRoi')) + '</th><th>' + HM.esc(t('cKn')) + '</th><th>' + HM.esc(t('cTt')) + '</th><th>' + HM.esc(t('cThaoTac')) + '</th></tr></thead><tbody>' +
        pt.page.map(function (p) { return dongDx(c, p, me); }).join('') + '</tbody></table></div>' + pt.chan });
    root.innerHTML = html;
    HTM.ganTrang(root, LOC, c.veLai);
    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-loai]', function (el) { LOC.loai = el.getAttribute('data-loai'); LOC.trang = 0; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; LOC.trang = 0; c.veLai(); var i = root.querySelector('[data-tim]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
    HM.bam(root, '[data-them-ung]', function () { HT.deXuatTamUng(c, null); });
    HM.bam(root, '[data-them-hd]', function () { HT.deXuatHopDong(c, null); });
    HM.bam(root, '[data-dx]', function (el, e) { e.stopPropagation(); thaoTac(c, el.getAttribute('data-dx'), el.getAttribute('data-id')); });
    HM.bam(root, 'tr[data-pr]', function (el, e) { if (e.target.closest('button,details')) return; moDx(c, el.getAttribute('data-pr')); });
  }
});

function dongDx(c, p, me) {
  var t = tx, roi = p.type === 'advance' ? p.calc.roi : null;
  return '<tr class="pick" data-pr="' + HM.esc(p.id) + '"><td>' + HM.tenBia({ ten: p.party.name, seed: p.party.clientId, phu: p.id + ' · ' + p.ageDays + ' ' + t('ngay') }) + '</td>' +
    '<td style="min-width:220px"><div class="t-ttl">' + HM.esc(c.song(p, 'moTa')) + '</div><div class="t-sub" style="font-family:var(--f)">' + HM.esc((p.byRole === 'partner' ? t('cuaDoiTac') : p.by) + (p.terms.note ? ' · ' + HM.dai(p.terms.note, 48) : '')) + '</div></td>' +
    '<td class="num" style="white-space:nowrap">' + (roi == null ? '<span class="nil">—</span>' : '<b>' + HM.esc(HT.fmt.pct(roi)) + '</b><div class="t-sub" style="font-family:var(--f)">' + HM.esc((c.lang === 'vi' ? 'thu hồi ' : 'recoup ') + (p.calc.recoupMonths == null ? '—' : p.calc.recoupMonths + (c.lang === 'vi' ? ' tháng' : ' mo')) + (p.calc.grade ? ' · ' + (c.lang === 'vi' ? 'hạng ' : 'grade ') + p.calc.grade : '')) + '</div>') + '</td>' +
    '<td>' + HTM.tagKn(p.calc.recommendation) + '</td>' +
    '<td>' + HTM.tagDx(p.status) + '</td>' +
    '<td>' + nutDx(c, p, me) + '</td></tr>';
}
/* Mỗi vai thấy tối đa hai nút chính; thao tác phụ nằm trong menu ⋯ để dòng
   bảng không thành một dãy năm nút. */
function nutDx(c, p, me) {
  var t = tx, role = me.role, chinh = [], phu = [];
  var cho = ['submitted', 'checked'].indexOf(p.status) >= 0;
  function nut(act, nhan, cls) { return '<button type="button" class="btn sm ' + (cls || '') + '" data-dx="' + act + '" data-id="' + p.id + '">' + HM.esc(t(nhan)) + '</button>'; }
  function muc(act, nhan, cls) { return '<button type="button" class="' + (cls || '') + '" data-dx="' + act + '" data-id="' + p.id + '">' + HM.esc(t(nhan)) + '</button>'; }
  if (cho && role === 'mgmt') { chinh.push(nut('approve', 'duyet', 'pri')); chinh.push(nut('reject', 'tuChoi', 'dang')); }
  if (p.status === 'submitted' && (role === 'accounting' || role === 'mgmt')) (role === 'mgmt' ? phu : chinh).push(role === 'mgmt' ? muc('check', 'kiem') : nut('check', 'kiem', 'pri'));
  if (cho && (role === 'accounting' || role === 'mgmt')) phu.push(muc('return', 'traLai'));
  if (p.status === 'returned' && (p.byRole === role || role === 'mgmt')) chinh.push(nut('resubmit', 'guiLai', 'pri'));
  if (['submitted', 'checked', 'returned'].indexOf(p.status) >= 0 && (p.byRole === role || role === 'mgmt') && p.byRole !== 'partner') (chinh.length ? phu : chinh).push(chinh.length ? muc('withdraw', 'rut', 'dang') : nut('withdraw', 'rut', 'ghost'));
  if (!chinh.length && !phu.length) return '<span class="nil">—</span>';
  return '<div class="btnrow" style="flex-wrap:nowrap">' + chinh.join('') + HM.menu(phu) + '</div>';
}
function thaoTac(c, act, id) {
  var A = c.A, t = tx, me = A.staff.me, p = A.proposals.get(id); if (!p) return;
  var xong = { approve: 'daDuyet', reject: 'daTuChoi', return: 'daTraLai', check: 'daKiem', withdraw: 'daRut', resubmit: 'daGuiLai' }[act];
  function chay(note) {
    try { A.proposals.review(id, act, note || '', me.name, me.role); c.thongBao(t(xong).replace('{id}', id), 'ok'); c.dongNgan(); c.veLai(); }
    catch (e) { c.thongBao(e.message, 'no'); }
  }
  if (act === 'approve') {
    var mo = p.type === 'advance' ? t('hoiDuyetUng').replace('{a}', c.tien2(p.terms.amount)).replace('{f}', HT.fmt.pct(p.terms.feePct)) : t('hoiDuyetHd').replace('{f}', HT.fmt.pct(p.terms.feePct)).replace('{m}', p.terms.months);
    c.hoiThoai({ tieuDe: t('hoiDuyet').replace('{id}', id).replace('{t}', p.party.name), moTa: HM.esc(mo), than: HTM.theDeXuat(p, { tien: c.tien2 }) + '<label class="fld" style="margin-top:12px">' + HM.esc(t('ghiChu')) + '</label><input class="in" data-o="note">', dong: t('duyet'), rong: true })
      .then(function (f) { if (f) chay(f.note); setTimeout(function () { var m = document.querySelector('.modal'); if (m) HB.gan(m); }, 20); });
    setTimeout(function () { var m = document.querySelector('.modal'); if (m) HB.gan(m); }, 20);
    return;
  }
  if (act === 'reject' || act === 'return') {
    c.hoiThoai({ tieuDe: t(act === 'reject' ? 'hoiTuChoi' : 'hoiTraLai').replace('{id}', id), moTa: HM.esc(c.song(p, 'moTa') + ' · ' + p.party.name),
      than: '<label class="fld">' + HM.esc(t('lyDo')) + '</label><textarea class="in" rows="3" data-o="note"></textarea>', dong: t(act === 'reject' ? 'tuChoi' : 'traLai'), nguyHiem: act === 'reject' })
      .then(function (f) { if (f) chay(f.note); });
    return;
  }
  if (act === 'check') {
    c.hoiThoai({ tieuDe: t('hoiKiem').replace('{id}', id), moTa: HM.esc(t('hoiKiemMo')), than: '<label class="fld">' + HM.esc(t('ghiChu')) + '</label><input class="in" data-o="note">', dong: t('kiem') })
      .then(function (f) { if (f) chay(f.note); });
    return;
  }
  chay('');
}
function moDx(c, id) {
  var A = c.A, t = tx, me = A.staff.me, p = A.proposals.get(id); if (!p) return;
  var html = '<div class="asset-h">' + HM.hinh(p.party.name, p.party.clientId, 'lon') + '<div class="asset-t"><b>' + HM.esc(p.party.name) + '</b><span>' + HM.esc(p.party.clientId + ' · ' + p.id + ' · ' + (p.byRole === 'partner' ? t('cuaDoiTac') : t('cDx').toLowerCase() + ' ' + p.by)) + '</span></div></div>' +
    HTM.theDeXuat(p, { tien: c.tien2 }) + '<div class="btnrow" style="margin-top:14px">' + nutDx(c, p, me) + '</div>';
  c.nganTruot(html, { tieuDe: t('chiTiet') + ' ' + p.id, phu: c.song(p, 'moTa'), khiMo: function (dr) {
    HB.gan(dr);
    HM.bam(dr, '[data-dx]', function (el) { thaoTac(c, el.getAttribute('data-dx'), el.getAttribute('data-id')); });
  } });
}

/* ---- hộp thoại đề xuất, dùng chung từ Xét duyệt, Bàn làm việc và ngăn Đối tác ---- */
function chonTk(c, q) {
  var A = c.A; q = String(q || '').trim().toLowerCase(); if (!q) return null;
  var ds = A.parties.list({ q: q }).rows;
  return ds.length ? ds[0] : null;
}
function xemTinh(c, loai) {
  var A = c.A, md = document.querySelector('.modal'); if (!md) return;
  var host = md.querySelector('[data-tinh]'), tkIn = md.querySelector('[data-o="tk"]'), pkIn = md.querySelector('[data-o="pk"]');
  var pk = pkIn && pkIn.value; if (!pk && tkIn) { var r = chonTk(c, tkIn.value); pk = r ? r.partyKey : null; }
  if (!pk) { host.innerHTML = '<p class="say">' + HM.esc(tx('fTk')) + '</p>'; return; }
  try {
    var calc = loai === 'advance' ? A.advanceCalc(pk, +md.querySelector('[data-o="amount"]').value || 0, (+md.querySelector('[data-o="fee"]').value || 12) / 100)
      : A.contractCalc(pk, { months: +md.querySelector('[data-o="months"]').value || 24, feePct: (+md.querySelector('[data-o="fee"]').value || 15) / 100 });
    var gia = { type: loai, status: 'submitted', calc: calc, terms: loai === 'advance' ? { amount: calc.amount, feePct: calc.feePct } : { months: calc.months, feePct: calc.feePct }, history: [], moTa: A.partyName(pk), moTaEn: A.partyName(pk) };
    host.innerHTML = '<h4 class="sec">' + HM.esc(tx('xemTinh')) + ' · ' + HM.esc(A.partyName(pk)) + '</h4>' + HTM.theDeXuat(gia, { tien: c.tien2 });
    HB.gan(host);
  } catch (e) { host.innerHTML = '<p class="say">' + HM.esc(e.message) + '</p>'; }
}
function hoiDeXuat(c, loai, partyKey) {
  var A = c.A, t = tx, me = A.staff.me;
  var ten = partyKey ? A.partyName(partyKey) : '';
  var than = (partyKey ? '<input type="hidden" data-o="pk" value="' + HM.esc(partyKey) + '"><div class="bar" style="margin-bottom:10px">' + HM.hinh(ten, A.partyClientId(partyKey), 'sm') + '<b>' + HM.esc(ten) + '</b><span class="muted mono" style="font-size:12px">' + HM.esc(A.partyClientId(partyKey)) + '</span></div>'
      : '<label class="fld">' + HM.esc(t('fTk')) + '</label><input class="in" data-o="tk" placeholder="Nightform Records · HTK-L001">') +
    (loai === 'advance'
      ? '<div class="grid g2" style="margin-bottom:0"><div><label class="fld">' + HM.esc(t('fSo')) + '</label><input class="in" type="number" data-o="amount" min="100" step="100" value="2000"></div><div><label class="fld">' + HM.esc(t('fPhi')) + ' (%)</label><input class="in" type="number" data-o="fee" min="0" max="50" step="1" value="' + Math.round(A.advanceFee * 100) + '"></div></div>'
      : '<div class="grid g3" style="margin-bottom:0"><div><label class="fld">' + HM.esc(t('fHan')) + '</label><input class="in" type="number" data-o="months" min="6" max="60" step="6" value="24"></div><div><label class="fld">' + HM.esc(t('fPhiHd')) + ' (%)</label><input class="in" type="number" data-o="fee" min="3" max="50" step="1" value="15"></div><div><label class="fld">' + HM.esc(t('fDocQuyen')) + '</label><select class="in" data-o="exclusive"><option value="">—</option><option value="1">' + HM.esc(t('fDocQuyen')) + '</option></select></div></div>') +
    '<label class="fld" style="margin-top:12px">' + HM.esc(t('fGhi')) + '</label><input class="in" data-o="note">' +
    '<div data-tinh style="margin-top:14px"></div>';
  c.hoiThoai({ tieuDe: t(loai === 'advance' ? 'themUng' : 'themHd') + (ten ? ' · ' + ten : ''), moTa: HM.esc(t('mo')), than: than, dong: t(loai === 'advance' ? 'themUng' : 'themHd'), rong: true })
    .then(function (f) {
      if (!f) return;
      var pk = f.pk; if (!pk) { var r = chonTk(c, f.tk); if (!r) { c.thongBao(t('khongThayTk').replace('{q}', f.tk || ''), 'no'); return; } pk = r.partyKey; }
      try {
        var pr = loai === 'advance' ? A.proposals.proposeAdvance(pk, { amount: +f.amount, feePct: (+f.fee || 0) / 100, note: f.note }, me.name, me.role)
          : A.proposals.proposeContract(pk, { months: +f.months, feePct: (+f.fee || 0) / 100, exclusive: !!f.exclusive, note: f.note }, me.name, me.role);
        c.thongBao(t('daTao').replace('{id}', pr.id), 'ok'); c.dongNgan(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
  setTimeout(function () {
    var md = document.querySelector('.modal'); if (!md) return;
    xemTinh(c, loai);
    md.addEventListener('input', function () { clearTimeout(md._hen); md._hen = setTimeout(function () { xemTinh(c, loai); }, 220); });
    md.addEventListener('change', function () { xemTinh(c, loai); });
  }, 30);
}
HT.deXuatTamUng = function (c, partyKey) { hoiDeXuat(c, 'advance', partyKey); };
HT.deXuatHopDong = function (c, partyKey) { hoiDeXuat(c, 'contract', partyKey); };
/* Bàn làm việc dùng lại: nút theo vai, xử lý một thao tác, mở ngăn chi tiết */
HT.nutDeXuat = function (c, p) { return nutDx(c, p, c.A.staff.me); };
HT.xuLyDeXuat = function (c, act, id) { thaoTac(c, act, id); };
HT.moDeXuat = function (c, id) { moDx(c, id); };
(function () { for (var i = 0; i < HT.man.length; i++) if (HT.man[i].id === 'xet-duyet') CHU = HT.man[i].chu; })();

})();
