/* =====================================================================
   NỘI BỘ · TỔ CHỨC
   ---------------------------------------------------------------------
   Cây công ty: khối → tổ → chức danh. Mỗi khối mang hồ sơ quyền (màn,
   nhóm hàm), chức năng, lớp tài sản phụ trách; mỗi tổ mang nhiệm vụ đếm
   sống từ dữ liệu. Nhân sự gắn vào khối / tổ / chức danh: vai và phạm vi
   suy ra từ đó. Giám đốc sửa cây và nhân sự; vai khác xem cây và thấy vị
   trí, nhiệm vụ, tài sản của mình.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'so-do', tim: '' };

HT.dangKy({
  id: 'to-chuc', nav: 'navToChuc', nhom: 'nhomHeThong', icon: 'tree',
  dem: function (c) { try { var me = c.A.staff.me; if (me.role !== 'mgmt') return null; var n = c.A.toChuc.nhanSu().filter(function (x) { return x.active && (!x.to || !x.chucDanh); }).length; return n || null; } catch (e) { return null; } },

  chu: {
    vi: {
      nhomHeThong: 'Hệ thống', navToChuc: 'Tổ chức', h1: 'Tổ chức',
      mo: 'Cây công ty: khối, tổ, chức danh. Quyền, chức năng, nhiệm vụ và tài sản của mỗi người suy ra từ vị trí trong cây.',
      soNs: 'Nhân sự', soKhoi: 'Khối', soTo: 'Tổ',
      tSoDo: 'Sơ đồ', tNs: 'Nhân sự', tTs: 'Tài sản', tQuyen: 'Quyền suy ra',
      themNs: 'Thêm nhân sự', themKhoi: 'Thêm khối', themTo: 'Thêm tổ',
      toi: 'Vị trí của tôi', toiMo: 'Khối, tổ, chức danh và việc đang chờ của bạn, đếm sống từ dữ liệu.', chucNang: 'Chức năng', nhiemVu: 'Nhiệm vụ', taiSan: 'Tài sản phụ trách', taiSanToi: 'Đang giữ đích danh',
      nhanSu: 'Nhân sự', truong: 'Trưởng bộ phận', chuaCo: 'chưa có', quyen: 'Quyền', man: 'màn', nhom: 'nhóm hàm', xemMan: 'Mở màn',
      cTen: 'Nhân viên', cKhoi: 'Khối', cTo: 'Tổ', cCd: 'Chức danh', cTs: 'Tài sản đang giữ', cTt: 'Trạng thái', dangLam: 'Đang làm', daKhoa: 'Đã khoá',
      chuyen: 'Chuyển vị trí', khoa: 'Khoá', moLai: 'Mở lại', sua: 'Sửa thông tin', chiTiet: 'Nhân viên',
      fTen: 'Họ tên', fEmail: 'Email', fDt: 'Số điện thoại', fKhoi: 'Khối', fTo: 'Tổ', fCd: 'Chức danh', fVai: 'Hồ sơ quyền', fVaiHint: 'Khối mới dùng quyền của một khối có sẵn.', fTenEn: 'Tên tiếng Anh', fCn: 'Chức năng', fCnHint: 'Mỗi dòng một chức năng.', fNv: 'Nhiệm vụ', fNvHint: 'Mỗi dòng một nhiệm vụ.', fTs: 'Lớp tài sản',
      daThem: 'Đã thêm {t}', daChuyen: 'Đã chuyển {t}', daKhoa: 'Đã khoá {t}', daMo: 'Đã mở lại {t}',
      cTaiSan: 'Lớp tài sản', cBoPhan: 'Bộ phận phụ trách', cSo: 'Số lượng', cGiao: 'Giao đích danh', giaoMo: 'Tài khoản đối tác giao ở trang Đối tác; nền tảng giao ở trang Nền tảng; ticket và khiếu nại giao ở trang Hỗ trợ và Quản lý quyền.',
      qMo: 'Quyền không khai riêng cho từng người: khối nào mở màn nào, gọi nhóm hàm nào; chức danh từ Trưởng bộ phận trở lên thấy cả bộ phận thay vì chỉ phần mình.',
      cMan: 'Trang', cap: 'Level', capMo: 'Level 1–2 thấy cả bộ phận', thang: 'Thang cấp', thangMo: 'Số nhỏ là cấp cao. Hệ thống dừng ở Level 6, sâu hơn thì không ai biết ai báo cáo cho ai.', soNguoi: 'người'
    },
    en: {
      nhomHeThong: 'System', navToChuc: 'Organisation', h1: 'Organisation',
      mo: 'Company tree: units, teams, titles. Each person’s permissions, functions, duties and assets follow from their place in it.',
      soNs: 'People', soKhoi: 'Units', soTo: 'Teams',
      tSoDo: 'Chart', tNs: 'People', tTs: 'Assets', tQuyen: 'Derived permissions',
      themNs: 'Add a person', themKhoi: 'Add a unit', themTo: 'Add a team',
      toi: 'My position', toiMo: 'Your unit, team, title and open work, counted live from the data.', chucNang: 'Functions', nhiemVu: 'Duties', taiSan: 'Assets in charge', taiSanToi: 'Assigned to me',
      nhanSu: 'People', truong: 'Head', chuaCo: 'none', quyen: 'Permissions', man: 'screens', nhom: 'function groups', xemMan: 'Open',
      cTen: 'Person', cKhoi: 'Unit', cTo: 'Team', cCd: 'Title', cTs: 'Assets held', cTt: 'Status', dangLam: 'Active', daKhoa: 'Locked',
      chuyen: 'Move', khoa: 'Lock', moLai: 'Reactivate', sua: 'Edit details', chiTiet: 'Person',
      fTen: 'Full name', fEmail: 'Email', fDt: 'Phone', fKhoi: 'Unit', fTo: 'Team', fCd: 'Title', fVai: 'Permission profile', fVaiHint: 'A new unit reuses the permissions of an existing one.', fTenEn: 'English name', fCn: 'Functions', fCnHint: 'One per line.', fNv: 'Duties', fNvHint: 'One per line.', fTs: 'Asset classes',
      daThem: 'Added {t}', daChuyen: 'Moved {t}', daKhoa: 'Locked {t}', daMo: 'Reactivated {t}',
      cTaiSan: 'Asset class', cBoPhan: 'Unit in charge', cSo: 'Count', cGiao: 'Assigned by name', giaoMo: 'Partner accounts are assigned on Partners; platforms on Platforms; tickets and claims on Support and Rights.',
      qMo: 'Permissions are not set per person: a unit opens screens and calls function groups; heads of department and above see the whole department instead of only their own share.',
      cMan: 'Screen', cap: 'Level', capMo: 'Level 1–2 see the whole department', thang: 'Levels', thangMo: 'Lower number is more senior. The ladder stops at Level 6; deeper than that and nobody knows who reports to whom.', soNguoi: 'people'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, vi = c.lang === 'vi', me = A.staff.me, mgmt = me.role === 'mgmt';
    var cay = A.toChuc.cay(), toi = A.toChuc.cuaToi();
    var ten = function (x) { return vi ? x.vi : x.en; };
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      so: [{ l: t('soNs'), v: HT.fmt.n(cay.tongNhanSu) }, { l: t('soKhoi'), v: HT.fmt.n(cay.khoi.length) }, { l: t('soTo'), v: HT.fmt.n(cay.khoi.reduce(function (s, k) { return s + k.to.length; }, 0)) }],
      nut: mgmt ? '<button type="button" class="btn" data-them-khoi>' + HM.esc(t('themKhoi')) + '</button><button type="button" class="btn" data-them-to>' + HM.esc(t('themTo')) + '</button><button type="button" class="btn pri" data-them-ns>' + HM.icon('user') + HM.esc(t('themNs')) + '</button>' : '' });
    html += HM.tabs([{ k: 'so-do', l: t('tSoDo'), icon: 'tree' }, { k: 'nhan-su', l: t('tNs'), icon: 'user', dem: cay.tongNhanSu }, { k: 'tai-san', l: t('tTs'), icon: 'layers' }, { k: 'quyen', l: t('tQuyen'), icon: 'check' }], LOC.tab);
    if (LOC.tab === 'so-do') html += veToi(c, toi) + veSoDo(c, cay, toi);
    else if (LOC.tab === 'nhan-su') html += veNhanSu(c, cay);
    else if (LOC.tab === 'tai-san') html += veTaiSan(c, cay);
    else html += veQuyen(c, cay);
    root.innerHTML = html;
    HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-them-ns]', function () { hoiNhanSu(c, cay); });
    HM.bam(root, '[data-them-khoi]', function () { hoiKhoi(c); });
    HM.bam(root, '[data-them-to]', function () { hoiTo(c, cay); });
    HM.bam(root, '[data-ns]', function (el, e) { e.stopPropagation(); moNhanSu(c, cay, el.getAttribute('data-ns')); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); var i = root.querySelector('[data-tim]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
  }
});

function chipNs(x, vi) {
  var cd = x.cap <= 2 ? ' truong' : '';
  return '<button type="button" class="chip' + cd + '" data-ns="' + HM.esc(x.id) + '" title="' + HM.esc(vi ? x.title : x.titleEn) + '"><span class="av">' + HM.esc(HM.hashChu ? x.name.split(' ').slice(-1)[0].charAt(0) : x.name.charAt(0)) + '</span>' + HM.esc(x.name) + '</button>';
}
function veNhiemVu(ds, vi) {
  if (!ds.length) return '';
  return '<ul class="org-nv">' + ds.map(function (n) {
    return '<li>' + (n.man ? '<a href="#' + HM.esc(n.man) + '">' + HM.esc(vi ? n.vi : n.en) + '</a>' : '<span>' + HM.esc(vi ? n.vi : n.en) + '</span>') +
      (n.dem == null ? '' : '<span class="n' + (n.dem ? '' : ' zero') + '">' + HT.fmt.n(n.dem) + '</span>') + '</li>';
  }).join('') + '</ul>';
}
function veToi(c, toi) {
  var t = c.t, vi = c.lang === 'vi';
  if (!toi.khoi) return '';
  var cd = vi ? toi.chucDanh.vi : toi.chucDanh.en;
  return HM.the({ h2: HM.esc(t('toi')), p: HM.esc(t('toiMo')),
    than: '<div class="toi"><div>' +
      '<div class="bar" style="margin-bottom:8px"><b>' + HM.esc(toi.name) + '</b><span class="tag info">' + HM.esc(cd) + '</span><span class="muted">' + HM.esc((vi ? toi.khoi.vi : toi.khoi.en) + (toi.to ? ' · ' + (vi ? toi.to.vi : toi.to.en) : '')) + '</span>' + (toi.truong ? '<span class="tag ok">' + HM.esc(t('capMo')) + '</span>' : '') + '</div>' +
      '<h4 class="sec">' + HM.esc(t('nhiemVu')) + '</h4>' + (toi.nhiemVu.length ? veNhiemVu(toi.nhiemVu, vi) : '<p class="say">' + HM.esc(t('chuaCo')) + '</p>') +
      '</div><div>' +
      '<h4 class="sec">' + HM.esc(t('chucNang')) + '</h4><ul class="org-cn">' + (vi ? toi.khoi.chucNang.vi : toi.khoi.chucNang.en).map(function (x) { return '<li>' + HM.esc(x) + '</li>'; }).join('') + '</ul>' +
      '<h4 class="sec">' + HM.esc(t('taiSanToi')) + '</h4>' + (toi.taiSan.length ? '<div class="org-ts">' + toi.taiSan.map(function (a) { return '<span><b>' + HT.fmt.n(a.dem) + '</b> ' + HM.esc(vi ? a.vi : a.en) + '</span>'; }).join('') + '</div>' : '<p class="say">' + HM.esc(t('chuaCo')) + '</p>') +
      '</div></div>' });
}
function veSoDo(c, cay, toi) {
  var t = c.t, vi = c.lang === 'vi';
  return '<div class="org">' + cay.khoi.map(function (k) {
    var truong = k.nhanSu.filter(function (x) { return x.cap <= 2; });
    return '<div class="org-k' + (toi.khoi && toi.khoi.id === k.id ? ' me' : '') + '">' +
      '<div class="org-kh"><div><h3>' + HM.esc(vi ? k.vi : k.en) + '</h3><div class="sub">' + HM.esc(k.nhanSu.length + ' ' + t('soNs').toLowerCase() + ' · ' + k.man.length + ' ' + t('man') + ' · ' + k.nhom.length + ' ' + t('nhom')) + '</div></div></div>' +
      '<ul class="org-cn">' + (vi ? k.chucNang.vi : k.chucNang.en).map(function (x) { return '<li>' + HM.esc(x) + '</li>'; }).join('') + '</ul>' +
      k.to.map(function (to) {
        return '<div class="org-to"><b>' + HM.esc(vi ? to.vi : to.en) + '<span class="cnt">' + to.nhanSu.length + '</span></b>' + veNhiemVu(to.nhiemVu, vi) +
          (to.nhanSu.length ? '<div class="org-ns">' + to.nhanSu.map(function (x) { return chipNs(x, vi); }).join('') + '</div>' : '') + '</div>';
      }).join('') +
      (k.nhanSu.some(function (x) { return !k.to.some(function (to) { return to.id === x.to; }); }) ? '<div class="org-to"><b>' + HM.esc(t('nhanSu')) + '</b><div class="org-ns">' + k.nhanSu.filter(function (x) { return !k.to.some(function (to) { return to.id === x.to; }); }).map(function (x) { return chipNs(x, vi); }).join('') + '</div></div>' : '') +
      (k.taiSan.length ? '<div class="org-to"><b>' + HM.esc(t('taiSan')) + '</b><div class="org-ts" style="margin-top:6px">' + k.taiSan.map(function (a) { return '<span><b>' + HT.fmt.n(a.dem) + '</b> ' + HM.esc(vi ? a.vi : a.en) + '</span>'; }).join('') + '</div></div>' : '') +
      '<div class="org-q"><b>' + HM.esc(t('truong')) + ':</b> ' + HM.esc(truong.length ? truong.map(function (x) { return x.name; }).join(', ') : t('chuaCo')) + '</div>' +
      '</div>';
  }).join('') + '</div>';
}
function veNhanSu(c, cay) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', me = A.staff.me, q = LOC.tim.trim().toLowerCase();
  var ds = A.toChuc.nhanSu().filter(function (x) { return !q || (x.name + ' ' + x.email + ' ' + x.title).toLowerCase().indexOf(q) >= 0; });
  var ts = A.toChuc.taiSan().filter(function (a) { return ['taiKhoanDoiTac', 'nenTang', 'ticket', 'khieuNai'].indexOf(a.id) >= 0; });
  /* Thang cấp hiện thành một hàng bậc: mỗi bậc một viên, kèm số người đang
     ở bậc đó. Nhìn một cái là thấy tổ chức đang phình ở tầng nào. */
  var bac = A.quyen.capBac();
  var demBac = {};
  A.toChuc.nhanSu().forEach(function (x) { demBac[x.cap] = (demBac[x.cap] || 0) + 1; });
  var gom = [];
  bac.forEach(function (b) { var g = gom.filter(function (y) { return y.cap === b.cap; })[0];
    if (g) g.ten.push(vi ? b.vi : b.en); else gom.push({ cap: b.cap, ten: [vi ? b.vi : b.en] }); });
  var thang = HM.the({ h2: HM.esc(t('thang')), p: HM.esc(t('thangMo')), icon: 'tree',
    than: '<div class="bac-row">' + gom.map(function (g) {
      var n = demBac[g.cap] || 0;
      return '<div class="bac' + (g.cap <= 2 ? ' cao' : '') + (n ? '' : ' rong') + '">' +
        '<div class="bac-n">' + HM.esc(t('cap')) + ' ' + g.cap + '</div>' +
        '<div class="bac-t">' + HM.esc(g.ten.join(' · ')) + '</div>' +
        '<div class="bac-d">' + HT.fmt.n(n) + ' ' + HM.esc(t('soNguoi')) + '</div></div>';
    }).join('') + '</div>' });
  return thang +
    '<div class="bar"><div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('cTen')) + '…" value="' + HM.esc(LOC.tim) + '"></div></div>' +
    HM.the({ thoBody: true, than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cTen')) + '</th><th>' + HM.esc(t('cKhoi')) + '</th><th>' + HM.esc(t('cTo')) + '</th><th>' + HM.esc(t('cCd')) + '</th><th>' + HM.esc(t('cTs')) + '</th><th>' + HM.esc(t('cTt')) + '</th></tr></thead><tbody>' +
      ds.map(function (x) {
        var k = cay.khoi.filter(function (y) { return y.id === x.boPhan; })[0], to = k ? k.to.filter(function (y) { return y.id === x.to; })[0] : null;
        var giu = ts.map(function (a) { var n = demGiu(A, a.id, x.id); return n ? HT.fmt.n(n) + ' ' + (vi ? a.vi : a.en).toLowerCase() : null; }).filter(Boolean).join(' · ');
        return '<tr class="pick" data-ns="' + HM.esc(x.id) + '"><td>' + HM.tenBia({ ten: x.name, seed: x.email, phu: x.email + (x.id === me.id ? ' · ' + (vi ? 'bạn' : 'you') : '') }) + '</td>' +
          '<td>' + HM.esc(k ? (vi ? k.vi : k.en) : x.boPhan) + '</td><td>' + HM.esc(to ? (vi ? to.vi : to.en) : '—') + '</td>' +
          '<td>' + HM.esc(vi ? x.title.split(' · ')[0] : x.titleEn.split(' · ')[0]) + ' <span class="tag ' + (x.cap <= 2 ? 'ok' : '') + '">' + HM.esc(t('cap')) + ' ' + x.cap + '</span>' + '</td>' +
          '<td style="font-size:12.5px">' + (giu || '<span class="nil">—</span>') + '</td>' +
          '<td>' + HM.tag(x.active ? t('dangLam') : t('daKhoa'), x.active ? 'ok' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' });
}
function demGiu(A, loai, staffId) {
  try {
    if (loai === 'taiKhoanDoiTac') return A.parties.list({ manager: staffId }).rows.length;
    if (loai === 'nenTang') return A.platforms.list().filter(function (p) { return p.ownerId === staffId; }).length;
    if (loai === 'ticket') return A.tickets.counts(staffId).total;
    if (loai === 'khieuNai') return A.claims.counts(staffId).total;
  } catch (e) { return 0; }
  return 0;
}
function veTaiSan(c, cay) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  var ds = A.toChuc.taiSan();
  return HM.the({ h2: HM.esc(t('tTs')), p: HM.esc(t('giaoMo')), thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cTaiSan')) + '</th><th>' + HM.esc(t('cBoPhan')) + '</th><th class="num">' + HM.esc(t('cSo')) + '</th><th>' + HM.esc(t('cGiao')) + '</th><th></th></tr></thead><tbody>' +
      ds.map(function (a) {
        var k = cay.khoi.filter(function (x) { return x.taiSan.some(function (y) { return y.id === a.id; }); });
        var giao = ['taiKhoanDoiTac', 'nenTang', 'ticket', 'khieuNai'].indexOf(a.id) >= 0 ? A.toChuc.nhanSu().filter(function (x) { return x.active; }).map(function (x) { var n = demGiu(A, a.id, x.id); return n ? HM.esc(x.name) + ' <b>' + HT.fmt.n(n) + '</b>' : null; }).filter(Boolean).join(' · ') : '';
        return '<tr><td><b>' + HM.esc(vi ? a.vi : a.en) + '</b></td><td>' + HM.esc(k.map(function (x) { return vi ? x.vi : x.en; }).join(', ') || (vi ? 'Ban giám đốc' : 'Management')) + '</td><td class="num">' + HT.fmt.n(a.dem) + '</td><td style="font-size:12.5px">' + (giao || '<span class="nil">—</span>') + '</td>' +
          '<td>' + (a.man && A.quyen.man(a.man) ? '<button type="button" class="btn sm ghost" data-di="' + HM.esc(a.man) + '">' + HM.esc(t('xemMan')) + '</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' });
}
function veQuyen(c, cay) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', bang = A.quyen.bang();
  var manDs = Object.keys(bang.man), tenMan = function (id) { var m = HT.man.filter(function (x) { return x.id === id; })[0]; return m && m.chu && m.chu[c.lang] && m.chu[c.lang][m.nav || id] ? m.chu[c.lang][m.nav || id] : id; };
  var cot = cay.khoi.filter(function (k) { return !k.them; });
  return HM.the({ h2: HM.esc(t('tQuyen')), p: HM.esc(t('qMo')), thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cMan')) + '</th>' + cot.map(function (k) { return '<th style="text-align:center">' + HM.esc(vi ? k.vi : k.en) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      manDs.map(function (id) { return '<tr><td>' + HM.esc(tenMan(id)) + '</td>' + cot.map(function (k) { return '<td style="text-align:center">' + (k.man.indexOf(id) >= 0 ? '<span class="tag ok">✓</span>' : '') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div>',
    chan: cot.map(function (k) { return '<b>' + HM.esc(vi ? k.vi : k.en) + '</b>: ' + HM.esc(k.nhom.map(function (g) { return bang.nhom[g] ? (vi ? bang.nhom[g].vi : bang.nhom[g].en).split(/[:;,]/)[0] : g; }).join(' · ')); }).join('<br>') });
}

/* ---- hộp thoại ---- */
function dsKhoi(cay, vi) { return cay.khoi.map(function (k) { return [k.id, vi ? k.vi : k.en]; }); }
function dsTo(cay, khoiId, vi) { var k = cay.khoi.filter(function (x) { return x.id === khoiId; })[0]; return k ? k.to.map(function (x) { return [x.id, vi ? x.vi : x.en]; }) : []; }
function dsCd(A, vi) { return A.toChuc.chucDanh.filter(function (x) { return x.id !== 'giam-doc'; }).map(function (x) { return [x.id, vi ? x.vi : x.en]; }); }
function noiKhoiTo(bg, cay, vi) {
  var k = bg.querySelector('[data-o="boPhan"]'), to = bg.querySelector('[data-o="to"]');
  if (!k || !to) return;
  function ve() { to.innerHTML = dsTo(cay, k.value, vi).map(function (x) { return '<option value="' + HM.esc(x[0]) + '">' + HM.esc(x[1]) + '</option>'; }).join('') || '<option value="">—</option>'; }
  k.addEventListener('change', ve); ve();
}
function hoiNhanSu(c, cay) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  HTM.hoiForm(c, { tieuDe: t('themNs'), dong: t('themNs'), fields: [
    { k: 'name', l: t('fTen'), req: true }, { k: 'email', l: t('fEmail'), kieu: 'email', req: true },
    { k: 'phone', l: t('fDt'), kieu: 'tel' }, { k: 'chucDanh', l: t('fCd'), kieu: 'select', opts: dsCd(A, vi), v: 'nhan-vien', kbb: false },
    { k: 'boPhan', l: t('fKhoi'), kieu: 'select', opts: dsKhoi(cay, vi), v: cay.khoi[1] ? cay.khoi[1].id : '', kbb: false }, { k: 'to', l: t('fTo'), kieu: 'select', opts: [], kbb: false }
  ], khiMo: function (bg) { noiKhoiTo(bg, cay, vi); } }).then(function (f) {
    if (!f) return;
    try { var x = A.toChuc.themNhanSu(f, A.staff.me.email); c.thongBao(t('daThem').replace('{t}', x.name + ' · ' + (vi ? x.title : x.titleEn)), 'ok'); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); }
  });
}
function hoiKhoi(c) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', ts = A.toChuc.taiSan();
  HTM.hoiForm(c, { tieuDe: t('themKhoi'), dong: t('themKhoi'), fields: [
    { k: 'vi', l: t('fTen'), req: true }, { k: 'en', l: t('fTenEn') },
    { k: 'vai', l: t('fVai'), kieu: 'select', opts: A.quyen.bang().khoi.map(function (k) { return [k.vai, vi ? k.vi : k.en]; }), v: 'support', hint: t('fVaiHint'), kbb: false },
    { k: 'taiSan', l: t('fTs'), kieu: 'select', opts: [['', '—']].concat(ts.map(function (a) { return [a.id, vi ? a.vi : a.en]; })) },
    { k: 'chucNang', l: t('fCn'), kieu: 'textarea', hint: t('fCnHint'), rong: true }
  ] }).then(function (f) {
    if (!f) return;
    try { var k = A.toChuc.themKhoi(f, A.staff.me.email); c.thongBao(t('daThem').replace('{t}', vi ? k.vi : k.en), 'ok'); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); }
  });
}
function hoiTo(c, cay) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  var manDs = [['', '—']].concat(HT.man.filter(function (m) { return A.quyen.man(m.id); }).map(function (m) { return [m.id, m.chu && m.chu[c.lang] && m.chu[c.lang][m.nav || m.id] || m.id]; }));
  HTM.hoiForm(c, { tieuDe: t('themTo'), dong: t('themTo'), fields: [
    { k: 'boPhan', l: t('fKhoi'), kieu: 'select', opts: dsKhoi(cay, vi), kbb: false }, { k: 'vi', l: t('fTen'), req: true }, { k: 'en', l: t('fTenEn') },
    { k: 'man', l: t('cMan'), kieu: 'select', opts: manDs }, { k: 'nhiemVu', l: t('fNv'), kieu: 'textarea', hint: t('fNvHint'), rong: true }
  ] }).then(function (f) {
    if (!f) return;
    try { var to = A.toChuc.themTo(f.boPhan, f, A.staff.me.email); c.thongBao(t('daThem').replace('{t}', vi ? to.vi : to.en), 'ok'); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); }
  });
}
function moNhanSu(c, cay, id) {
  var A = c.A, t = c.t, vi = c.lang === 'vi', mgmt = A.staff.me.role === 'mgmt';
  var x = A.toChuc.nhanSu().filter(function (y) { return y.id === id; })[0]; if (!x) return;
  var k = cay.khoi.filter(function (y) { return y.id === x.boPhan; })[0], to = k ? k.to.filter(function (y) { return y.id === x.to; })[0] : null;
  var ts = A.toChuc.taiSan().filter(function (a) { return ['taiKhoanDoiTac', 'nenTang', 'ticket', 'khieuNai'].indexOf(a.id) >= 0; }).map(function (a) { return { a: a, n: demGiu(A, a.id, x.id) }; }).filter(function (y) { return y.n; });
  c.nganTruot(
    HM.kv([{ t: t('fEmail'), v: x.email }, x.phone ? { t: t('fDt'), v: x.phone } : null, { t: t('cKhoi'), v: k ? (vi ? k.vi : k.en) : x.boPhan }, { t: t('cTo'), v: to ? (vi ? to.vi : to.en) : '—' }, { t: t('cCd'), v: (vi ? x.title : x.titleEn).split(' · ')[0] + ' · ' + t('cap') + ' ' + x.cap + (x.cap <= 2 ? ' · ' + t('capMo') : '') }, { t: t('cTt'), v: x.active ? t('dangLam') : t('daKhoa') }]) +
    '<h4 class="sec">' + HM.esc(t('cTs')) + '</h4>' + (ts.length ? '<div class="org-ts">' + ts.map(function (y) { return '<span><b>' + HT.fmt.n(y.n) + '</b> ' + HM.esc(vi ? y.a.vi : y.a.en) + '</span>'; }).join('') + '</div>' : '<p class="say">' + HM.esc(t('chuaCo')) + '</p>') +
    (to && to.nhiemVu.length ? '<h4 class="sec">' + HM.esc(t('nhiemVu')) + '</h4>' + veNhiemVu(to.nhiemVu, vi) : '') +
    (mgmt ? '<div class="btnrow" style="margin-top:16px"><button type="button" class="btn pri" data-chuyen>' + HM.esc(t('chuyen')) + '</button><button type="button" class="btn" data-sua>' + HM.esc(t('sua')) + '</button>' +
      (x.id !== A.staff.me.id ? '<button type="button" class="btn ' + (x.active ? 'dang' : '') + '" data-khoa>' + HM.esc(x.active ? t('khoa') : t('moLai')) + '</button>' : '') + '</div>' : ''),
    { tieuDe: x.name, phu: vi ? x.title : x.titleEn, khiMo: function (dr) {
      HM.bam(dr, '[data-chuyen]', function () {
        HTM.hoiForm(c, { tieuDe: t('chuyen') + ' · ' + x.name, dong: t('chuyen'), fields: [
          { k: 'boPhan', l: t('fKhoi'), kieu: 'select', opts: dsKhoi(cay, vi), v: x.boPhan, kbb: false }, { k: 'to', l: t('fTo'), kieu: 'select', opts: [], kbb: false },
          { k: 'chucDanh', l: t('fCd'), kieu: 'select', opts: dsCd(A, vi), v: x.chucDanh, kbb: false }
        ], khiMo: function (bg) { noiKhoiTo(bg, cay, vi); var to2 = bg.querySelector('[data-o="to"]'); if (to2) to2.value = x.to; } }).then(function (f) {
          if (!f) return;
          try { var y = A.toChuc.chuyenNhanSu(x.id, f, A.staff.me.email); c.thongBao(t('daChuyen').replace('{t}', y.name + ' → ' + (vi ? y.title : y.titleEn)), 'ok'); c.dongNgan(); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
      HM.bam(dr, '[data-sua]', function () {
        HTM.hoiForm(c, { tieuDe: t('sua') + ' · ' + x.name, dong: t('sua'), fields: [{ k: 'name', l: t('fTen'), v: x.name, req: true }, { k: 'email', l: t('fEmail'), kieu: 'email', v: x.email, req: true }, { k: 'phone', l: t('fDt'), kieu: 'tel', v: x.phone }] }).then(function (f) {
          if (!f) return;
          try { A.toChuc.suaNhanSu(x.id, f, A.staff.me.email); c.thongBao(t('daThem').replace('{t}', f.name), 'ok'); c.dongNgan(); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
      HM.bam(dr, '[data-khoa]', function () {
        c.xacNhan(x.active ? t('khoa') : t('moLai'), HM.esc(x.name), x.active ? t('khoa') : t('moLai'), x.active).then(function (ok) {
          if (!ok) return;
          try { A.toChuc.khoaNhanSu(x.id, !x.active, A.staff.me.email); c.thongBao((x.active ? t('daKhoa') : t('daMo')).replace('{t}', x.name), 'ok'); c.dongNgan(); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
    } });
}

})();
