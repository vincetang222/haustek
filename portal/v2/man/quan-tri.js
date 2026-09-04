/* =====================================================================
   NỘI BỘ · QUẢN TRỊ
   ---------------------------------------------------------------------
   Năm việc không thuộc dòng tiền nhưng quyết định xem dòng tiền có tin
   được không:
     · ai được vào cổng khách, và họ nhìn thấy dòng nào;
     · mọi việc đã làm được ghi lại ở đâu;
     · sáu câu hỏi còn treo mà bản mẫu phải ĐOÁN — đoán sai là làm lại
       từ gốc, nên để hẳn một chỗ và ghi câu trả lời vào đó;
     · dữ liệu bản mẫu đang nằm ở đâu, xuất nhập thế nào;
     · ranh giới giữa hai cửa thật sự chặn được gì, và không chặn được gì.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'taikhoan';
var LOC = { tim: '', vt: '', viec: '' };

HT.dangKy({
  id: 'quan-tri', nav: 'navQuanTri', nhom: 'nhomHeThong', icon: 'gear',

  chu: {
    vi: {
      nhomHeThong: 'Quản trị', navQuanTri: 'Quản trị', h1: 'Quản trị',
      tTk: 'Tài khoản', tNk: 'Nhật ký thao tác', tCh: 'Câu hỏi cần chốt', tDl: 'Dữ liệu bản mẫu', tBm: 'Phân quyền hai cổng',
      soTk: 'Tài khoản', soHd: 'Đang hoạt động', soMoi: 'Đã mời, chưa đăng nhập',
      themTk: 'Cấp tài khoản', tim: 'Tìm theo email hoặc bên thụ hưởng…', moiVt: 'Tất cả vai trò',
      cEmail: 'Email', cVt: 'Vai trò', cBen: 'Gắn với bên thụ hưởng', cTt: 'Trạng thái', cNgay: 'Ngày cấp', cMfa: 'Xác thực 2 lớp',
      hd: 'đang hoạt động', moi: 'đã mời', khoa: 'đã khoá',
      khoaLai: 'Khoá tài khoản', moLai: 'Mở lại tài khoản', xoaTk: 'Xoá tài khoản',
      hoiEmail: 'Email', hoiVt: 'Vai trò', hoiBen: 'Gắn với bên thụ hưởng',
      canhQuyen: 'Quyền truy cập gắn với mã số, không bao giờ gắn với tên hiển thị. Với những tên như "nae & de\'lay", "ling:chi", "HƯƠNGMYBÔNG", sai một ký tự là nghệ sĩ mất tiền hoặc xem được dữ liệu của người khác.',
      labelConCua: 'Label con của', labelCon: 'label con',
      cauTruc: 'Cấu trúc label',
      cauTrucMo: 'Label mẹ và các label con đã ký riêng. Mỗi label con là một tài khoản riêng với roster riêng và tỷ lệ riêng.',
      ngheSi: 'nghệ sĩ', banGhi: 'bản ghi', chuaTk: 'chưa có tài khoản', xemCauHoi: 'Xem câu hỏi cần chốt',
      ghiQ9: 'Label mẹ được uỷ quyền xem toàn bộ số liệu của label con; không có dòng tiền đi qua label mẹ (câu hỏi cần chốt số 9).',
      nkTim: 'Lọc theo thao tác…', nkHet: 'Tất cả',
      chTraLoi: 'Câu trả lời', chDoan: 'Giả định hiện tại của bản mẫu', chViSao: 'Vì sao câu này quan trọng',
      chLuu: 'Lưu câu trả lời', chXuat: 'Xuất toàn bộ câu trả lời',
      chMau: 'File mẫu cần cung cấp',
      dlXuat: 'Xuất trạng thái ra JSON', dlNhap: 'Nhập trạng thái từ file JSON',
      dlXoa: 'Xoá toàn bộ và dựng lại từ đầu',
      dlCanh: 'Xoá toàn bộ sẽ mất mọi quyết định đã thực hiện trong bản mẫu: kỳ đã xét duyệt, dòng đã khớp, tỷ lệ, tạm ứng, tài khoản. Danh mục và doanh thu sẽ được sinh lại y hệt nhờ giá trị gốc cố định.',
      bmChay: 'Chạy phép thử phân quyền'
    },
    en: {
      nhomHeThong: 'System', navQuanTri: 'Administration', h1: 'Administration',
      tTk: 'Accounts', tNk: 'Audit log', tCh: 'Open questions', tDl: 'Prototype data', tBm: 'The boundary',
      soTk: 'Accounts', soHd: 'Active', soMoi: 'Invited, not yet in',
      themTk: 'Create an account', tim: 'Search email or payee…', moiVt: 'All roles',
      cEmail: 'Email', cVt: 'Role', cBen: 'Bound to payee', cTt: 'Status', cNgay: 'Created', cMfa: 'Two-factor',
      hd: 'active', moi: 'invited', khoa: 'suspended',
      khoaLai: 'Suspend', moLai: 'Reactivate', xoaTk: 'Delete account',
      hoiEmail: 'Email', hoiVt: 'Role', hoiBen: 'Bound to payee',
      canhQuyen: 'Access binds to the ID, never to the display name. "nae & de\'lay", "ling:chi", "HƯƠNGMYBÔNG" — one wrong character and an artist loses money or sees someone else’s data.',
      labelConCua: 'Sub-label of', labelCon: 'sub-labels',
      cauTruc: 'Label structure',
      cauTrucMo: 'Parent labels and the sub-labels signed under them. Each sub-label is its own account with its own roster and rate.',
      ngheSi: 'artists', banGhi: 'recordings', chuaTk: 'no account yet', xemCauHoi: 'Open questions',
      ghiQ9: 'A parent label is delegated to see everything about its sub-labels; no money flows through the parent (open question 9).',
      nkTim: 'Filter by action…', nkHet: 'All',
      chTraLoi: 'Your answer', chDoan: 'What the prototype assumes', chViSao: 'Why this matters',
      chLuu: 'Save answer', chXuat: 'Export all answers',
      chMau: 'Sample files still needed',
      dlXuat: 'Export state as JSON', dlNhap: 'Import from JSON',
      dlXoa: 'Wipe and rebuild from scratch',
      dlCanh: 'Wiping drops every decision made in the prototype: approved periods, matched rows, rates, advances, accounts. Catalogue and revenue regenerate identically from the fixed seed.',
      bmChay: 'Run the boundary probes'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var tk = A.accounts.list();

    var html = HM.dau({
      h1: HM.esc(t('h1')),
      so: [
        { l: t('soTk'), v: HT.fmt.n(tk.length) },
        { l: t('soHd'), v: HT.fmt.n(tk.filter(function (x) { return x.status === 'active'; }).length) },
        { l: c.lang === 'vi' ? 'Phiên bản lõi' : 'Core version', v: HAUSTEK.VERSION }
      ]
    });

    html += HM.tabs([
      { k: 'taikhoan', l: t('tTk'), icon: 'user', dem: tk.length },
      { k: 'nhatky', l: t('tNk'), icon: 'clock' },
      { k: 'cauhoi', l: t('tCh'), icon: 'ask', dem: A.questions.length },
      { k: 'dulieu', l: t('tDl'), icon: 'file' },
      { k: 'bienmoi', l: t('tBm'), icon: 'alert' }
    ], TAB);

    if (TAB === 'taikhoan') html += veTaiKhoan(c, tk);
    if (TAB === 'nhatky') html += veNhatKy(c);
    if (TAB === 'cauhoi') html += veCauHoi(c);
    if (TAB === 'dulieu') html += veDuLieu(c);
    if (TAB === 'bienmoi') html += veBienMoi(c);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.doi(root, '[data-vt]', function (el) { LOC.vt = el.value; c.veLai(); });
    HM.bam(root, '[data-viec]', function (el) { LOC.viec = el.getAttribute('data-viec'); c.veLai(); });
    HM.bam(root, '[data-themtk]', function () { hoiTaiKhoan(c); });
    HM.bam(root, '[data-tt]', function (el) {
      var v = el.getAttribute('data-tt').split('|');
      A.accounts.setStatus(v[0], v[1]);
      c.thongBao(c.lang === 'vi' ? 'Đã đổi trạng thái tài khoản' : 'Account status changed');
      c.veLai();
    });
    HM.bam(root, '[data-xoatk]', function (el) {
      var id = el.getAttribute('data-xoatk');
      var a = tk.filter(function (x) { return x.id === id; })[0];
      c.xacNhan(t('xoaTk') + ' · ' + a.email,
        HM.esc(c.lang === 'vi'
          ? 'Người này mất quyền truy cập cổng ngay lập tức. Dữ liệu của bên thụ hưởng không bị ảnh hưởng: tài khoản và bên thụ hưởng là hai đối tượng khác nhau.'
          : 'They lose portal access immediately. The payee’s data is untouched — an account and a payee are two different things.'),
        t('xoaTk'), true).then(function (ok) {
          if (!ok) return;
          A.accounts.remove(id); c.thongBao(c.lang === 'vi' ? 'Đã xoá tài khoản' : 'Account deleted'); c.veLai();
        });
    });
    HM.bam(root, '[data-luuch]', function (el) {
      var id = el.getAttribute('data-luuch');
      var o = root.querySelector('[data-ch="' + id + '"]');
      A.answers.set(id, o.value.trim());
      c.thongBao(c.lang === 'vi' ? 'Đã lưu câu trả lời cho ' + id : 'Answer saved', 'ok');
      c.veLai();
    });
    HM.bam(root, '[data-xuatch]', function () {
      var all = A.answers.all();
      HM.csv('cau-hoi-can-chot.csv',
        ['Mã', 'Câu hỏi', 'Vì sao quan trọng', 'Giả định của bản mẫu', 'Câu trả lời'],
        A.questions.map(function (q) { return [q.id, q.t, q.why, q.guess, all[q.id] || '']; }));
    });
    HM.bam(root, '[data-xuatjson]', function () { xuatJson(c); });
    HM.bam(root, '[data-nhapjson]', function () { nhapJson(c); });
    HM.bam(root, '[data-xoahet]', function () {
      c.xacNhan(t('dlXoa'), HM.esc(t('dlCanh')), t('dlXoa'), true).then(function (ok) {
        if (ok) A.reset();
      });
    });
    HM.bam(root, '[data-probe]', function () { chayProbe(c, root); });
  }
});

/* =====================================================================
   TAB 1 — TÀI KHOẢN
   ===================================================================== */
function veTaiKhoan(c, tk) {
  var A = c.A, t = c.t;
  /* Tài khoản label: cho biết ngay đây là label con của ai, hoặc có bao
     nhiêu label con bên dưới, vì quyền xem của label mẹ phủ cả cây. */
  var nhanLabel = function (key) {
    if (!key || key[0] !== 'L') return '';
    var lid = +key.slice(2), lb = A.labels[lid];
    if (!lb) return '';
    var out = '';
    if (lb.parentId >= 0) out += HM.tag(t('labelConCua') + ' ' + A.labels[lb.parentId].name, 'info');
    var con = A.labelChildren(lid).length;
    if (con) out += (out ? ' ' : '') + HM.tag(con + ' ' + t('labelCon'), 'link');
    return out ? '<div style="margin-top:4px">' + out + '</div>' : '';
  };
  var loc = tk.filter(function (a) {
    if (LOC.vt && a.role !== LOC.vt) return false;
    if (LOC.tim) {
      var q = LOC.tim.toLowerCase();
      var ten = a.partyKey ? A.partyName(a.partyKey).toLowerCase() : '';
      if (a.email.toLowerCase().indexOf(q) < 0 && ten.indexOf(q) < 0) return false;
    }
    return true;
  });

  return HM.ghi({ kieu: 'info',
    tieuDe: HM.esc(c.lang === 'vi' ? 'Quyền truy cập gắn với mã số' : 'Access binds to IDs'),
    than: HM.esc(t('canhQuyen')) }) +
  HM.the({
    h2: HM.esc(t('tTk')),
    hanhDong: '<button type="button" class="btn sm pri" data-themtk>' + HM.icon('user') + HM.esc(t('themTk')) + '</button>',
    thoBody: true,
    than: '<div class="card-h" style="padding-bottom:12px">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
        HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      '<select class="in" data-vt style="width:auto;height:34px">' +
        '<option value="">' + HM.esc(t('moiVt')) + '</option>' +
        ['admin', 'label', 'artist'].map(function (v) {
          return '<option value="' + v + '"' + (LOC.vt === v ? ' selected' : '') + '>' + v + '</option>';
        }).join('') + '</select></div>' +
      '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('cEmail')) + '</th><th>' + HM.esc(t('cVt')) + '</th>' +
      '<th>' + HM.esc(t('cBen')) + '</th><th>' + HM.esc(t('cTt')) + '</th>' +
      '<th>' + HM.esc(t('cMfa')) + '</th><th>' + HM.esc(t('cNgay')) + '</th>' +
      '<th style="width:190px">' + HM.esc(c.lang === 'vi' ? 'Thao tác' : 'Actions') + '</th></tr></thead><tbody>' +
      loc.map(function (a) {
        return '<tr><td><div class="t-ttl mono">' + HM.esc(a.email) + '</div>' +
            '<div class="t-sub">' + HM.esc(a.id) + '</div></td>' +
          '<td>' + HM.tag(a.role, a.role === 'admin' ? 'no' : a.role === 'label' ? 'info' : 'link') + '</td>' +
          '<td>' + (a.partyKey
            ? '<div class="t-ttl">' + HM.esc(HM.dai(A.partyName(a.partyKey), 26)) + '</div>' +
              '<div class="t-sub">' + HM.esc(a.partyKey) + ' · ' + HM.esc(A.partyClientId(a.partyKey)) + '</div>' +
              nhanLabel(a.partyKey)
            : '<span class="muted">' + HM.esc(c.lang === 'vi' ? 'toàn hệ thống' : 'whole system') + '</span>') + '</td>' +
          '<td>' + HM.tag(a.status === 'active' ? t('hd') : a.status === 'invited' ? t('moi') : t('khoa'),
            a.status === 'active' ? 'ok' : a.status === 'invited' ? 'warn' : 'no') + '</td>' +
          '<td>' + (a.mfa ? '<span class="pos">' + HM.icon('check') + '</span>' : '<span class="nil">—</span>') + '</td>' +
          '<td class="mono">' + HM.esc(HT.fmt.ngay(a.createdAt)) + '</td>' +
          '<td><div class="btnrow">' +
            (a.status === 'suspended'
              ? '<button type="button" class="btn sm" data-tt="' + a.id + '|active">' + HM.esc(t('moLai')) + '</button>'
              : '<button type="button" class="btn sm" data-tt="' + a.id + '|suspended">' + HM.esc(t('khoaLai')) + '</button>') +
            '<button type="button" class="btn sm ghost dang" data-xoatk="' + a.id + '">' + HM.icon('x') + '</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>',
    chan: c.lang === 'vi'
      ? 'Bản mẫu <b>không</b> có đăng nhập thật. Cổng đối tác mô phỏng đăng nhập bằng ô chọn tài khoản ở cột trái. Trên hệ thống thật, phiên đăng nhập ở máy chủ quyết định partyId, còn Row Level Security quyết định dòng nào được đọc.'
      : 'The prototype has NO real login. The client portal simulates one with the account picker in its sidebar. A real system: a server session decides the partyId, and row-level security decides which rows can be read.'
  }) + veCauTrucLabel(c);
}

/* ---------------------------------------------------------------------
   Cấu trúc label: label mẹ và các label con, dạng cây. Mỗi nút: tên, mã,
   số nghệ sĩ, số bản ghi, và tài khoản đã cấp cho label đó (nếu có).
   --------------------------------------------------------------------- */
function veCauTrucLabel(c) {
  var A = c.A, t = c.t;
  var tkCua = {};
  A.accounts.list().forEach(function (a) {
    if (a.partyKey) (tkCua[a.partyKey] = tkCua[a.partyKey] || []).push(a.email);
  });
  var me = A.labels.filter(function (l) { return A.labelChildren(l.id).length > 0; });
  var nut = function (l, con) {
    var soNs = A.artists.filter(function (a) { return a.labelId === l.id; }).length;
    var soBg = A.idxOf(A.byLabel, l.id).length;
    var tk = tkCua['L:' + l.id] || [];
    return '<div class="nd"><span class="ic' + (con ? ' ns' : '') + '">' + HM.icon(con ? 'layers' : 'tree') + '</span>' +
      '<div><b>' + HM.esc(l.name) + '</b><span>' +
        HM.esc(l.clientId + ' · ' + HT.fmt.n(soNs) + ' ' + t('ngheSi') + ' · ' + HT.fmt.n(soBg) + ' ' + t('banGhi')) + '</span></div>' +
      '<div class="v">' + (tk.length
        ? '<span class="mono">' + HM.esc(tk.join(', ')) + '</span>'
        : '<span class="muted">' + HM.esc(t('chuaTk')) + '</span>') + '</div></div>';
  };
  return HM.the({
    h2: HM.esc(t('cauTruc')), p: HM.esc(t('cauTrucMo')),
    hanhDong: '<button type="button" class="btn sm" data-tab="cauhoi">' + HM.icon('ask') + HM.esc(t('xemCauHoi')) + '</button>',
    than: me.length
      ? '<ul class="tree">' + me.map(function (l) {
          return '<li>' + nut(l, false) + '<ul>' +
            A.labelChildren(l.id).map(function (k) { return '<li>' + nut(k, true) + '</li>'; }).join('') +
            '</ul></li>';
        }).join('') + '</ul>'
      : HM.trong({ icon: 'tree', tieuDe: c.lang === 'vi' ? 'Chưa có label mẹ nào' : 'No parent label yet', moTa: '' }),
    chan: HM.esc(t('ghiQ9'))
  });
}

/* =====================================================================
   TAB 2 — NHẬT KÝ
   ===================================================================== */
function veNhatKy(c) {
  var A = c.A;
  var het = A.audit.list(400);
  var viec = {};
  het.forEach(function (a) { viec[a.action] = (viec[a.action] || 0) + 1; });
  var ds = LOC.viec ? het.filter(function (a) { return a.action === LOC.viec; }) : het;

  return HM.the({
    h2: c.lang === 'vi' ? 'Nhật ký thao tác' : 'Audit log',
    p: c.lang === 'vi'
      ? 'Mọi quyết định ảnh hưởng đến dòng tiền đều để lại một dòng ở đây: nhập báo cáo, gỡ báo cáo, khớp ISRC, đặt tỷ lệ, đặt tạm ứng, chốt tỷ giá, xét duyệt kỳ, huỷ xét duyệt. Không dòng nào có thể xoá.'
      : 'Every decision that moves money leaves a line here: load, unload, match, set rate, set advance, lock FX, approve, revoke. No line can be deleted.',
    thoBody: true,
    than: '<div class="card-h" style="padding-bottom:12px;gap:7px;flex-wrap:wrap">' +
      '<button type="button" class="pill' + (LOC.viec ? '' : ' on') + '" data-viec="">' +
        HM.esc(c.lang === 'vi' ? 'Tất cả' : 'All') + ' <b>' + het.length + '</b></button>' +
      Object.keys(viec).sort().map(function (k) {
        return '<button type="button" class="pill' + (LOC.viec === k ? ' on' : '') + '" data-viec="' + HM.esc(k) + '">' +
          HM.esc(k) + ' <b>' + viec[k] + '</b></button>';
      }).join('') + '</div>' +
      '<div class="tw"><table class="t"><thead><tr>' +
      '<th style="width:150px">' + (c.lang === 'vi' ? 'Thời điểm' : 'When') + '</th>' +
      '<th style="width:150px">' + (c.lang === 'vi' ? 'Thao tác' : 'Action') + '</th>' +
      '<th>' + (c.lang === 'vi' ? 'Chi tiết' : 'Detail') + '</th>' +
      '<th style="width:210px">' + (c.lang === 'vi' ? 'Người thực hiện' : 'By') + '</th></tr></thead><tbody>' +
      ds.slice(0, 150).map(function (a) {
        var kieu = a.action.indexOf('approve') >= 0 ? 'ok'
          : (a.action.indexOf('revoke') >= 0 || a.action.indexOf('remove') >= 0 || a.action.indexOf('unload') >= 0) ? 'no'
          : 'info';
        return '<tr><td class="num mono">' + HM.esc(HT.fmt.luc(a.at)) + '</td>' +
          '<td>' + HM.tag(a.action, kieu) + '</td>' +
          '<td>' + HM.esc(a.detail) + '</td>' +
          '<td class="mono">' + HM.esc(a.by) + '</td></tr>';
      }).join('') + '</tbody></table></div>',
    chan: HT.fmt.n(ds.length) + (c.lang === 'vi' ? ' dòng · đang hiển thị 150 dòng gần nhất' : ' entries · latest 150 shown')
  });
}

/* =====================================================================
   TAB 3 — CÂU HỎI CÒN TREO
   ===================================================================== */
function veCauHoi(c) {
  var A = c.A, t = c.t;
  var tl = A.answers.all();
  var daTL = A.questions.filter(function (q) { return tl[q.id]; }).length;

  return HM.ghi({ kieu: daTL === A.questions.length ? 'ok' : 'warn',
    tieuDe: HM.esc(c.lang === 'vi'
      ? 'Đã trả lời ' + daTL + '/' + A.questions.length + ' câu'
      : daTL + ' of ' + A.questions.length + ' answered'),
    than: HM.esc(c.lang === 'vi'
      ? 'Mỗi câu chưa trả lời là một điểm bản mẫu phải tự giả định. Giả định sai thì không chỉ sửa giao diện, mà phải làm lại từ schema. Khi có câu trả lời, ghi vào đây rồi xuất ra cho người viết schema.'
      : 'Every unanswered question is a place the prototype had to GUESS. A wrong guess is not an interface fix — it is a rebuild from the schema up. Record answers here, then export them for whoever writes the schema.'),
    nut: '<button type="button" class="btn sm" data-xuatch>' + HM.icon('down2') + HM.esc(t('chXuat')) + '</button>' }) +
  A.questions.map(function (q, i) {
    var da = tl[q.id];
    return HM.the({
      dai: da ? { kieu: 'ok', icon: 'check', chu: HM.esc(c.lang === 'vi' ? 'Đã trả lời' : 'Answered') }
              : { kieu: 'warn', icon: 'ask', chu: HM.esc(c.lang === 'vi' ? 'Chưa trả lời, bản mẫu đang giả định' : 'Unanswered — the prototype is guessing') },
      h2: (i + 1) + '. ' + HM.esc(c.song(q, 't')),
      than: '<h4 class="sec">' + HM.esc(t('chViSao')) + '</h4>' +
        '<p class="say">' + HM.esc(c.song(q, 'why')) + '</p>' +
        '<h4 class="sec">' + HM.esc(t('chDoan')) + '</h4>' +
        '<p class="say">' + HM.esc(c.song(q, 'guess')) + '</p>' +
        '<h4 class="sec">' + HM.esc(t('chTraLoi')) + '</h4>' +
        '<textarea class="in" data-ch="' + q.id + '" rows="3" placeholder="' +
        HM.esc(c.lang === 'vi' ? 'Nhập câu trả lời tại đây…' : 'Write the answer here…') + '">' +
        HM.esc(da || '') + '</textarea>' +
        '<div class="btnrow" style="margin-top:10px">' +
        '<button type="button" class="btn sm pri" data-luuch="' + q.id + '">' + HM.esc(t('chLuu')) + '</button></div>'
    });
  }).join('') +
  HM.the({
    h2: HM.esc(t('chMau')),
    p: c.lang === 'vi'
      ? 'Hai file này quyết định toàn bộ thiết kế quy trình nhập báo cáo: phần khó nhất, và cũng là phần không thể giả định.'
      : 'These two files determine the whole ingest design — the hardest part, and the part that cannot be guessed.',
    than: A.samplesNeeded.map(function (s) {
      return '<div class="stat" style="align-items:flex-start"><b style="max-width:none">' + HM.esc(c.song(s, 't')) +
        '<p>' + HM.esc(c.song(s, 'why')) + '</p></b></div>';
    }).join('')
  });
}

/* =====================================================================
   TAB 4 — DỮ LIỆU BẢN MẪU
   ===================================================================== */
function veDuLieu(c) {
  var A = c.A, t = c.t, st = A.state();
  var co = HAUSTEK.storage.available;
  var kich = 0;
  try { kich = JSON.stringify(st).length; } catch (e) {}

  return HM.the({
    h2: c.lang === 'vi' ? 'Nơi lưu dữ liệu bản mẫu' : 'Where the prototype’s data lives',
    p: c.lang === 'vi'
      ? 'Danh mục và doanh thu <b>không</b> được lưu: mỗi lần mở đều được sinh lại y hệt nhờ giá trị gốc cố định. Phần được lưu là <b>quyết định</b> của người vận hành, và đó cũng chính là dữ liệu được chuyển sang cổng đối tác.'
      : 'Catalogue and revenue are NOT stored — they regenerate identically from a fixed seed. What is stored are the operator’s DECISIONS, and that is exactly what flows to the client portal.',
    than: HM.kv([
      { t: c.lang === 'vi' ? 'Nơi lưu' : 'Storage', v: co ? 'localStorage · ' + 'haustek.portal.v1' : (c.lang === 'vi' ? 'trình duyệt đang chặn, chỉ giữ trong bộ nhớ phiên' : 'blocked — memory only') },
      { t: c.lang === 'vi' ? 'Kích thước' : 'Size', v: HT.fmt.n(Math.round(kich / 1024)) + ' KB' },
      { t: c.lang === 'vi' ? 'Kỳ đã xét duyệt' : 'Approved periods', v: Object.keys(st.approved).length + '/' + A.periods.length },
      { t: c.lang === 'vi' ? 'Dòng khớp thủ công' : 'Hand-matched rows', v: HT.fmt.n(Object.keys(st.match).length) },
      { t: c.lang === 'vi' ? 'Dòng tỷ lệ' : 'Rate rows', v: HT.fmt.n(st.rates.length) },
      { t: c.lang === 'vi' ? 'Khoản tạm ứng' : 'Advances', v: HT.fmt.n(Object.keys(st.advances).length) },
      { t: c.lang === 'vi' ? 'Dòng nhật ký thao tác' : 'Audit entries', v: HT.fmt.n(st.audit.length) },
      { t: c.lang === 'vi' ? 'Bản ghi đã sinh' : 'Generated recordings', v: HT.fmt.n(A.trackCount) },
      { t: c.lang === 'vi' ? 'Ô doanh thu theo nguồn' : 'Revenue cells by feed', v: HT.fmt.n(A.trackCount * A.periods.length * 3) }
    ]),
    chan: '<div class="btnrow">' +
      '<button type="button" class="btn sm" data-xuatjson>' + HM.icon('down2') + HM.esc(t('dlXuat')) + '</button>' +
      '<button type="button" class="btn sm" data-nhapjson>' + HM.icon('up') + HM.esc(t('dlNhap')) + '</button>' +
      '<span class="sp" style="flex:1"></span>' +
      '<button type="button" class="btn sm dang" data-xoahet>' + HM.esc(t('dlXoa')) + '</button></div>'
  }) +
  (co ? '' : HM.ghi({ kieu: 'warn',
    tieuDe: HM.esc(c.lang === 'vi' ? 'Trình duyệt đang chặn localStorage' : 'The browser is blocking localStorage'),
    than: HM.esc(c.lang === 'vi'
      ? 'Mở bằng file:// trên Safari thường gặp tình trạng này. Mọi thay đổi vẫn có hiệu lực trong phiên, nhưng sẽ mất khi đóng tab. Dùng nút xuất trạng thái ra JSON để giữ lại.'
      : 'Opening via file:// in Safari does this. Changes still work in the session but vanish when the tab closes. Use the JSON export to keep them.') }));
}

/* =====================================================================
   TAB 5 — RANH GIỚI HAI CỬA
   Nói cho đúng cái bản mẫu chặn được và cái nó KHÔNG chặn được.
   ===================================================================== */
function veBienMoi(c) {
  var t = c.t;
  return HM.ghi({ kieu: 'no',
    tieuDe: HM.esc(c.lang === 'vi'
      ? 'Đây là thiết kế của phân quyền hai cổng, chưa phải phân quyền đang được thực thi'
      : 'This is the SHAPE of the boundary, not an enforced boundary'),
    than: HM.esc(c.lang === 'vi'
      ? 'Hai cổng chạy trong cùng một trình duyệt, cùng một gốc. Tải lại file lõi trong một iframe cùng gốc là khôi phục được HAUSTEK.admin. localStorage giữ toàn bộ quyết định của admin, nên trang nào cùng gốc cũng đọc được. Bản mẫu không chặn được những đường đó, và không nên giả định là chặn được.'
      : 'Both pages run in one browser, same origin. Reloading the core in a same-origin iframe brings HAUSTEK.admin back; localStorage holds every admin decision and any same-origin page can read it. The prototype cannot close those routes and should not pretend otherwise.') }) +
  HM.the({
    h2: c.lang === 'vi' ? 'Những gì bản mẫu thật sự làm được' : 'What the prototype genuinely does',
    than: '<div class="checks">' + [
      [true, c.lang === 'vi' ? 'Tên đơn vị phân phối và tỷ lệ gốc không nằm trong file lõi' : 'Distributor name and gross rate are not in the core file',
       c.lang === 'vi' ? 'Cổng đối tác tải đúng file lõi đó. Bất cứ gì nằm trong file đều về tới máy của đối tác: mở dev tools hay chỉ cần curl file .js là đọc được, không cần chạy một dòng JavaScript. Vì vậy intranet.html tự chèn hai giá trị đó lúc khởi động; bản lõi mà đối tác tải về không mang theo giá trị nào.'
                       : 'The client portal loads that same core file. Anything inside it reaches the client — devtools, or just curl on the .js, no JavaScript needed. So intranet.html injects those two values at boot; the copy the client downloads carries nothing.'],
      [true, c.lang === 'vi' ? 'Tầng API kiểm tra lại phạm vi ở từng lời gọi' : 'The API layer re-checks scope on EVERY call',
       c.lang === 'vi' ? 'Kể cả khi giao diện đã lọc đúng. Tin vào bộ lọc của giao diện là nguyên nhân lộ dữ liệu phổ biến nhất.'
                       : 'Even when the interface already filtered correctly. Trusting the interface’s filter is the most common way data leaks.'],
      [true, c.lang === 'vi' ? 'Chặn label xem tác quyền ở đúng một chỗ' : 'Publishing is blocked for labels in exactly one place',
       c.lang === 'vi' ? 'scopeOf() trả về mảng rỗng cho label + tác quyền, và chanTacQuyenChoLabel() ném lỗi ở cả năm điểm vào. Chặn rải rác theo từng lời gọi thì chỉ cần bỏ sót một lời gọi là để lộ cả một dòng tiền.'
                       : 'scopeOf() returns an empty array for label + publishing, and one guard throws at all five entry points. Guarding call by call means one forgotten call opens a whole money stream.'],
      [true, c.lang === 'vi' ? 'Mọi gói dữ liệu gửi cho đối tác đều được soát chuỗi cấm' : 'Every client payload is scanned for forbidden strings',
       c.lang === 'vi' ? 'scrub() ném lỗi nếu phát hiện tên đơn vị phân phối, tỷ lệ gốc hay các chuỗi liên quan trong payload. Trang bị lỗi vẫn tốt hơn lộ thông tin mật.'
                       : 'scrub() throws if the distributor name, gross rate, or related strings appear in a payload — better a broken screen than a leak.'],
      [false, c.lang === 'vi' ? 'Không chặn được iframe cùng gốc' : 'Does NOT stop a same-origin iframe',
       c.lang === 'vi' ? 'Tải lại haustek-core.js trong iframe cùng gốc là khôi phục được toàn bộ HAUSTEK.admin.'
                       : 'Reloading haustek-core.js in a same-origin iframe restores the whole admin surface.'],
      [false, c.lang === 'vi' ? 'Không chặn được việc đọc localStorage' : 'Does NOT stop reading localStorage',
       c.lang === 'vi' ? 'Toàn bộ quyết định của admin nằm ở đó dưới dạng JSON, trang nào cùng gốc cũng đọc được.'
                       : 'Every admin decision sits there as JSON, readable by any same-origin page.']
    ].map(function (x) {
      return '<div class="check ' + (x[0] ? 'ok' : 'no') + '">' + HM.icon(x[0] ? 'check' : 'alert') +
        '<div style="min-width:0"><b>' + HM.esc(x[1]) + '</b><span>' + HM.esc(x[2]) + '</span></div></div>';
    }).join('') + '</div>',
    chan: c.lang === 'vi'
      ? 'Cách ly thật sự nằm ở mục 5.1 của tài liệu bàn giao: dữ liệu thô nằm trong database, lọc và tổng hợp chạy ở máy chủ, Row Level Security quyết định ai đọc được dòng nào. Phần ở đây chỉ chốt <b>thiết kế</b> mà tầng API phải có để RLS bên dưới có ý nghĩa.'
      : 'Real isolation is section 5.1 of the handoff: raw data in the database, filtering and aggregation on the server, row-level security deciding who reads which row. This only fixes the SHAPE the API layer must have for that to mean anything.'
  }) +
  HM.the({
    h2: HM.esc(t('bmChay')),
    p: c.lang === 'vi'
      ? 'Chạy thử ngay trong trang này: gọi API cổng đối tác bằng những tham số mà một người tò mò sẽ thử.'
      : 'Actually run them, here in this page: call the client API with the parameters a curious person would try.',
    hanhDong: '<button type="button" class="btn sm pri" data-probe>' + HM.icon('check') + HM.esc(t('bmChay')) + '</button>',
    than: '<div data-kqprobe><p class="hint">' + HM.esc(c.lang === 'vi'
      ? 'Chưa chạy. Bấm nút để chạy phép thử.' : 'Not run yet.') + '</p></div>'
  });
}

function chayProbe(c, root) {
  var api = HAUSTEK.api, A = c.A;
  var kyDuyet = A.periods.filter(function (p) { return A.isApproved(p.k); });
  var pk = kyDuyet.length ? kyDuyet[kyDuyet.length - 1].k : null;
  var chuaDuyet = A.periods.filter(function (p) { return !A.isApproved(p.k); })[0];

  var thu = function (ten, mong, fn) {
    var kq;
    try { var v = fn(); kq = { chan: false, mo: c.lang === 'vi' ? 'Trả về dữ liệu' : 'Returned data', v: v }; }
    catch (e) { kq = { chan: true, mo: e.message }; }
    return { ten: ten, mongChan: mong, dat: kq.chan === mong, mo: kq.mo };
  };

  var ds = [
    thu(c.lang === 'vi' ? 'Label đọc dòng tiền tác quyền' : 'A label reads the publishing stream', true,
      function () { return api.summary('label', 0, pk, 'pub'); }),
    thu(c.lang === 'vi' ? 'Label lấy xu hướng tác quyền 12 kỳ' : 'A label pulls a 12-period publishing trend', true,
      function () { return api.trend('label', 0, 'pub'); }),
    thu(c.lang === 'vi' ? 'Label tách tác quyền theo tổ chức quản lý tác quyền' : 'A label breaks publishing down by CMO', true,
      function () { return api.breakdown('label', 0, pk, 'pub', 'src'); }),
    thu(c.lang === 'vi' ? 'Đối tác đọc kỳ chưa xét duyệt' : 'A client reads an unapproved period', true,
      function () { return api.summary('artist', 0, chuaDuyet ? chuaDuyet.k : pk, 'rec'); }),
    thu(c.lang === 'vi' ? 'Nghệ sĩ mở bản ghi của người khác' : 'An artist opens a recording that is not theirs', true,
      function () {
        var sc = A.scopeOf('artist', 0, 'rec');
        var la = {};
        for (var i = 0; i < sc.length; i++) la[sc[i]] = 1;
        for (var j = 0; j < A.trackCount; j++) if (!la[j] && A.grossRec(j, A.pIndexOf(pk)) > 0) return api.trackDetail('artist', 0, pk, 'rec', j);
        throw new Error('Không tìm thấy bản ghi để thử');
      }),
    thu(c.lang === 'vi' ? 'Gọi API với vai trò "admin"' : 'Calling the API with role "admin"', true,
      function () { return api.summary('admin', 0, pk, 'rec'); }),
    thu(c.lang === 'vi' ? 'Gọi API với mã bên thụ hưởng ngoài phạm vi' : 'Calling with an out-of-range payee id', true,
      function () { return api.summary('artist', 99999, pk, 'rec'); }),
    thu(c.lang === 'vi' ? 'Nghệ sĩ đọc dữ liệu của chính mình' : 'An artist reads their own data', false,
      function () { return api.summary('artist', 0, pk, 'rec'); })
  ];

  var dat = ds.filter(function (x) { return x.dat; }).length;
  var o = root.querySelector('[data-kqprobe]');
  o.innerHTML = '<div class="checks">' + ds.map(function (x) {
    return '<div class="check ' + (x.dat ? 'ok' : 'no') + '">' + HM.icon(x.dat ? 'check' : 'alert') +
      '<div style="min-width:0"><b>' + HM.esc(x.ten) + '</b>' +
      '<span>' + HM.esc((x.mongChan ? (c.lang === 'vi' ? 'phải bị chặn: ' : 'must be blocked — ')
                                     : (c.lang === 'vi' ? 'phải được cho qua: ' : 'must pass — ')) + x.mo) + '</span></div></div>';
  }).join('') + '</div>' +
    '<p class="hint" style="margin-top:10px">' +
    (dat === ds.length
      ? '<span class="pos">' + HM.esc(c.lang === 'vi' ? 'Đạt ' + dat + '/' + ds.length + '. Mọi phép thử đều cho kết quả đúng như mong đợi.'
                                                      : dat + '/' + ds.length + ' — every probe behaved as expected.') + '</span>'
      : '<span class="neg">' + HM.esc(c.lang === 'vi' ? 'Đạt ' + dat + '/' + ds.length + '. Có phép thử không cho kết quả như mong đợi.'
                                                      : dat + '/' + ds.length + ' — a probe did not behave as expected.') + '</span>') +
    '</p>';
  c.thongBao(c.lang === 'vi' ? 'Đã chạy xong ' + ds.length + ' phép thử' : 'Ran ' + ds.length + ' probes',
    dat === ds.length ? 'ok' : 'no');
}

/* =====================================================================
   Cấp tài khoản
   ===================================================================== */
function hoiTaiKhoan(c) {
  var A = c.A;
  c.hoiThoai({
    tieuDe: c.t('themTk'),
    moTa: HM.esc(c.t('canhQuyen')),
    than: '<label class="fld">' + HM.esc(c.t('hoiEmail')) + '</label>' +
      '<input class="in" data-o="email" type="email" placeholder="ten@vidu.vn">' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(c.t('hoiVt')) + '</label>' +
      '<select class="in" data-o="vt"><option value="artist">artist</option>' +
      '<option value="label">label</option><option value="admin">admin</option></select>' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(c.t('hoiBen')) + '</label>' +
      '<input class="in" data-timben placeholder="' +
      HM.esc(c.lang === 'vi' ? 'Nhập tên hoặc mã bên thụ hưởng' : 'Type a payee name or code') + '">' +
      '<input type="hidden" data-o="key" value="">' +
      '<div data-kq style="margin-top:8px;max-height:180px;overflow:auto"></div>' +
      '<div class="hint">' + HM.esc(c.lang === 'vi'
        ? 'Vai trò admin không gắn với bên thụ hưởng nào và xem được toàn hệ thống.'
        : 'An admin account binds to no payee — they see the whole system.') + '</div>',
    dong: c.t('themTk'),
    khiMo: function (bg) {
      var o = bg.querySelector('[data-timben]'), kq = bg.querySelector('[data-kq]');
      var an = bg.querySelector('[data-o=key]'), vt = bg.querySelector('[data-o=vt]');
      var hen = null;
      var lam = function () {
        var s = o.value.trim().toLowerCase();
        if (s.length < 2) { kq.innerHTML = ''; return; }
        var hit = [], la = vt.value === 'label';
        if (vt.value === 'admin') { kq.innerHTML = '<p class="hint">' +
          HM.esc(c.lang === 'vi' ? 'Vai trò admin không gắn với bên thụ hưởng.' : 'Admin binds to no payee.') + '</p>'; return; }
        (la ? A.labels : A.artists).forEach(function (x) {
          if (hit.length < 24 && (x.name.toLowerCase().indexOf(s) >= 0 || x.clientId.toLowerCase().indexOf(s) >= 0))
            hit.push(x);
        });
        kq.innerHTML = hit.length
          ? '<div class="bars pick">' + hit.map(function (h) {
              return '<div class="row" data-pick="' + HM.esc(h.key) + '" style="grid-template-columns:minmax(0,1fr) auto">' +
                '<div class="nm"><b>' + HM.esc(HM.dai(h.name, 32)) + '</b><em>' + HM.esc(h.clientId) + '</em></div>' +
                '<div class="vv" style="font-size:12px">' + HM.esc(h.key) + '</div></div>';
            }).join('') + '</div>'
          : '<p class="hint">' + HM.esc(c.lang === 'vi' ? 'Không tìm thấy kết quả' : 'Not found') + '</p>';
      };
      o.addEventListener('input', function () { clearTimeout(hen); hen = setTimeout(lam, 200); });
      vt.addEventListener('change', lam);
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
    try {
      A.accounts.add(r.email, r.vt, r.vt === 'admin' ? null : r.key);
      c.thongBao(c.lang === 'vi' ? 'Đã cấp tài khoản cho ' + r.email : 'Account created', 'ok');
      c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

function xuatJson(c) {
  try {
    var txt = HAUSTEK.storage.exportJSON();
    var b = new Blob([txt], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'haustek-trang-thai.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    c.thongBao(c.lang === 'vi' ? 'Đã xuất trạng thái' : 'State exported', 'ok');
  } catch (e) { c.thongBao(e.message, 'no'); }
}

function nhapJson(c) {
  var inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.addEventListener('change', function () {
    var f = inp.files && inp.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        HAUSTEK.storage.importJSON(String(r.result));
        c.thongBao(c.lang === 'vi' ? 'Đã nhập trạng thái, đang tải lại trang' : 'State imported — reloading', 'ok');
        setTimeout(function () { location.reload(); }, 600);
      } catch (e) { c.thongBao(e.message, 'no'); }
    };
    r.readAsText(f);
  });
  inp.click();
}

})();
