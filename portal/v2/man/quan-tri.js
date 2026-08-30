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
      nhomHeThong: 'Hệ thống', navQuanTri: 'Quản trị', h1: 'Quản trị',
      tTk: 'Tài khoản', tNk: 'Nhật ký', tCh: 'Câu hỏi còn treo', tDl: 'Dữ liệu bản mẫu', tBm: 'Ranh giới hai cửa',
      soTk: 'Tài khoản', soHd: 'Đang hoạt động', soMoi: 'Đã mời, chưa vào',
      themTk: 'Cấp tài khoản', tim: 'Tìm email hoặc bên nhận…', moiVt: 'Mọi vai trò',
      cEmail: 'Email', cVt: 'Vai trò', cBen: 'Gắn với bên nhận', cTt: 'Trạng thái', cNgay: 'Cấp ngày', cMfa: 'Xác thực 2 lớp',
      hd: 'đang hoạt động', moi: 'đã mời', khoa: 'đã khoá',
      khoaLai: 'Khoá', moLai: 'Mở lại', xoaTk: 'Xoá tài khoản',
      hoiEmail: 'Email', hoiVt: 'Vai trò', hoiBen: 'Gắn với bên nhận',
      canhQuyen: 'Quyền bám MÃ SỐ, không bao giờ bám tên chữ. "nae & de\'lay", "ling:chi", "HƯƠNGMYBÔNG" — sai một dấu là nghệ sĩ mất tiền hoặc nhìn thấy dữ liệu người khác.',
      nkTim: 'Lọc theo việc…', nkHet: 'Tất cả',
      chTraLoi: 'Câu trả lời của bạn', chDoan: 'Bản mẫu đang đoán', chViSao: 'Vì sao câu này quan trọng',
      chLuu: 'Lưu câu trả lời', chXuat: 'Xuất toàn bộ câu trả lời',
      chMau: 'File mẫu cần xin',
      dlXuat: 'Xuất trạng thái ra file JSON', dlNhap: 'Nhập lại từ file JSON',
      dlXoa: 'Xoá hết và dựng lại từ đầu',
      dlCanh: 'Xoá hết là bỏ mọi quyết định đã làm trong bản mẫu: kỳ đã duyệt, dòng đã khớp, tỷ lệ, tạm ứng, tài khoản. Danh mục và doanh thu sinh lại y hệt nhờ hạt giống cố định.',
      bmChay: 'Chạy thử ranh giới'
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
        { l: c.lang === 'vi' ? 'Bản lõi' : 'Core version', v: HAUSTEK.VERSION }
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
          ? 'Người này mất quyền vào cổng ngay lập tức. Dữ liệu của bên nhận không bị ảnh hưởng — tài khoản và bên nhận là hai thứ khác nhau.'
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
      HM.csv('cau-hoi-con-treo.csv',
        ['Mã', 'Câu hỏi', 'Vì sao quan trọng', 'Bản mẫu đang đoán', 'Câu trả lời'],
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
    tieuDe: HM.esc(c.lang === 'vi' ? 'Quyền bám mã số' : 'Access binds to IDs'),
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
      '<th style="width:190px"></th></tr></thead><tbody>' +
      loc.map(function (a) {
        return '<tr><td><div class="t-ttl mono">' + HM.esc(a.email) + '</div>' +
            '<div class="t-sub">' + HM.esc(a.id) + '</div></td>' +
          '<td>' + HM.tag(a.role, a.role === 'admin' ? 'no' : a.role === 'label' ? 'info' : 'link') + '</td>' +
          '<td>' + (a.partyKey
            ? '<div class="t-ttl">' + HM.esc(HM.dai(A.partyName(a.partyKey), 26)) + '</div>' +
              '<div class="t-sub">' + HM.esc(a.partyKey) + ' · ' + HM.esc(A.partyClientId(a.partyKey)) + '</div>'
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
      ? 'Bản mẫu KHÔNG có đăng nhập thật. Cổng khách dùng ô chọn tài khoản ở cột trái để mô phỏng. Hệ thật: một phiên đăng nhập trên máy chủ quyết định partyId, và Row Level Security quyết định dòng nào đọc được.'
      : 'The prototype has NO real login. The client portal simulates one with the account picker in its sidebar. A real system: a server session decides the partyId, and row-level security decides which rows can be read.'
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
      ? 'Mọi quyết định làm đổi tiền đều để lại một dòng ở đây: nạp, gỡ, khớp, đặt tỷ lệ, đặt tạm ứng, chốt tỷ giá, duyệt, thu hồi. Không có dòng nào xoá được.'
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
      '<th style="width:150px">' + (c.lang === 'vi' ? 'Lúc' : 'When') + '</th>' +
      '<th style="width:150px">' + (c.lang === 'vi' ? 'Việc' : 'Action') + '</th>' +
      '<th>' + (c.lang === 'vi' ? 'Chi tiết' : 'Detail') + '</th>' +
      '<th style="width:210px">' + (c.lang === 'vi' ? 'Người làm' : 'By') + '</th></tr></thead><tbody>' +
      ds.slice(0, 150).map(function (a) {
        var kieu = a.action.indexOf('approve') >= 0 ? 'ok'
          : (a.action.indexOf('revoke') >= 0 || a.action.indexOf('remove') >= 0 || a.action.indexOf('unload') >= 0) ? 'no'
          : 'info';
        return '<tr><td class="num mono">' + HM.esc(HT.fmt.luc(a.at)) + '</td>' +
          '<td>' + HM.tag(a.action, kieu) + '</td>' +
          '<td>' + HM.esc(a.detail) + '</td>' +
          '<td class="mono">' + HM.esc(a.by) + '</td></tr>';
      }).join('') + '</tbody></table></div>',
    chan: HT.fmt.n(ds.length) + (c.lang === 'vi' ? ' dòng · hiện 150 dòng gần nhất' : ' entries · latest 150 shown')
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
      ? 'Mỗi câu chưa trả lời là một chỗ bản mẫu phải ĐOÁN. Đoán sai thì không phải sửa giao diện — phải làm lại từ schema. Trả lời được câu nào thì ghi vào đây, rồi xuất ra cho người viết schema.'
      : 'Every unanswered question is a place the prototype had to GUESS. A wrong guess is not an interface fix — it is a rebuild from the schema up. Record answers here, then export them for whoever writes the schema.'),
    nut: '<button type="button" class="btn sm" data-xuatch>' + HM.icon('down2') + HM.esc(t('chXuat')) + '</button>' }) +
  A.questions.map(function (q, i) {
    var da = tl[q.id];
    return HM.the({
      dai: da ? { kieu: 'ok', icon: 'check', chu: HM.esc(c.lang === 'vi' ? 'Đã có câu trả lời' : 'Answered') }
              : { kieu: 'warn', icon: 'ask', chu: HM.esc(c.lang === 'vi' ? 'Chưa trả lời — bản mẫu đang đoán' : 'Unanswered — the prototype is guessing') },
      h2: (i + 1) + '. ' + HM.esc(c.song(q, 't')),
      than: '<h4 class="sec">' + HM.esc(t('chViSao')) + '</h4>' +
        '<p class="say">' + HM.esc(c.song(q, 'why')) + '</p>' +
        '<h4 class="sec">' + HM.esc(t('chDoan')) + '</h4>' +
        '<p class="say">' + HM.esc(c.song(q, 'guess')) + '</p>' +
        '<h4 class="sec">' + HM.esc(t('chTraLoi')) + '</h4>' +
        '<textarea class="in" data-ch="' + q.id + '" rows="3" placeholder="' +
        HM.esc(c.lang === 'vi' ? 'Viết câu trả lời ở đây…' : 'Write the answer here…') + '">' +
        HM.esc(da || '') + '</textarea>' +
        '<div class="btnrow" style="margin-top:10px">' +
        '<button type="button" class="btn sm pri" data-luuch="' + q.id + '">' + HM.esc(t('chLuu')) + '</button></div>'
    });
  }).join('') +
  HM.the({
    h2: HM.esc(t('chMau')),
    p: c.lang === 'vi'
      ? 'Hai file này quyết định toàn bộ thiết kế đường ống nạp — phần khó nhất, và cũng là phần không đoán được.'
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
    h2: c.lang === 'vi' ? 'Dữ liệu bản mẫu nằm ở đâu' : 'Where the prototype’s data lives',
    p: c.lang === 'vi'
      ? 'Danh mục và doanh thu KHÔNG được lưu — chúng sinh lại y hệt mỗi lần mở nhờ hạt giống cố định. Thứ được lưu là QUYẾT ĐỊNH của người vận hành, và đó cũng chính là thứ chảy sang cổng khách.'
      : 'Catalogue and revenue are NOT stored — they regenerate identically from a fixed seed. What is stored are the operator’s DECISIONS, and that is exactly what flows to the client portal.',
    than: HM.kv([
      { t: c.lang === 'vi' ? 'Nơi lưu' : 'Storage', v: co ? 'localStorage · ' + 'haustek.portal.v1' : (c.lang === 'vi' ? 'trình duyệt chặn — chỉ giữ trong bộ nhớ' : 'blocked — memory only') },
      { t: c.lang === 'vi' ? 'Kích thước' : 'Size', v: HT.fmt.n(Math.round(kich / 1024)) + ' KB' },
      { t: c.lang === 'vi' ? 'Kỳ đã duyệt' : 'Approved periods', v: Object.keys(st.approved).length + '/' + A.periods.length },
      { t: c.lang === 'vi' ? 'Dòng đã khớp tay' : 'Hand-matched rows', v: HT.fmt.n(Object.keys(st.match).length) },
      { t: c.lang === 'vi' ? 'Dòng tỷ lệ' : 'Rate rows', v: HT.fmt.n(st.rates.length) },
      { t: c.lang === 'vi' ? 'Khoản tạm ứng' : 'Advances', v: HT.fmt.n(Object.keys(st.advances).length) },
      { t: c.lang === 'vi' ? 'Dòng nhật ký' : 'Audit entries', v: HT.fmt.n(st.audit.length) },
      { t: c.lang === 'vi' ? 'Bản ghi sinh ra' : 'Generated recordings', v: HT.fmt.n(A.trackCount) },
      { t: c.lang === 'vi' ? 'Ô doanh thu theo luồng' : 'Revenue cells by feed', v: HT.fmt.n(A.trackCount * A.periods.length * 3) }
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
      ? 'Mở bằng file:// trên Safari là gặp chuyện này. Mọi thay đổi vẫn chạy trong phiên, nhưng đóng tab là mất. Dùng nút xuất JSON để giữ lại.'
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
      ? 'Đây là HÌNH DẠNG của ranh giới, không phải ranh giới đã được thực thi'
      : 'This is the SHAPE of the boundary, not an enforced boundary'),
    than: HM.esc(c.lang === 'vi'
      ? 'Hai trang cùng chạy trong một trình duyệt, cùng một gốc. Nạp lại file lõi trong một iframe cùng gốc là có lại HAUSTEK.admin; localStorage giữ toàn bộ quyết định của admin thì trang nào cùng gốc cũng đọc được. Bản mẫu không bịt được những đường đó, và không nên giả vờ là bịt được.'
      : 'Both pages run in one browser, same origin. Reloading the core in a same-origin iframe brings HAUSTEK.admin back; localStorage holds every admin decision and any same-origin page can read it. The prototype cannot close those routes and should not pretend otherwise.') }) +
  HM.the({
    h2: c.lang === 'vi' ? 'Cái bản mẫu thật sự làm được' : 'What the prototype genuinely does',
    than: '<div class="checks">' + [
      [true, c.lang === 'vi' ? 'Tên đơn vị phân phối và tỷ lệ gốc không nằm trong file lõi' : 'Distributor name and gross rate are not in the core file',
       c.lang === 'vi' ? 'Cổng khách nạp chính file lõi đó. Bất cứ gì nằm trong file đều tải về máy khách — mở dev tools hay chỉ cần curl file .js là đọc được, không cần chạy một dòng JavaScript. Nên intranet.html tự nạp hai giá trị đó lúc khởi động; bản sao lõi khách tải về không mang theo gì cả.'
                       : 'The client portal loads that same core file. Anything inside it reaches the client — devtools, or just curl on the .js, no JavaScript needed. So intranet.html injects those two values at boot; the copy the client downloads carries nothing.'],
      [true, c.lang === 'vi' ? 'Tầng API kiểm tra lại phạm vi ở MỌI lời gọi' : 'The API layer re-checks scope on EVERY call',
       c.lang === 'vi' ? 'Kể cả khi giao diện đã lọc đúng rồi. Tin giao diện đã lọc là cách mất dữ liệu phổ biến nhất.'
                       : 'Even when the interface already filtered correctly. Trusting the interface’s filter is the most common way data leaks.'],
      [true, c.lang === 'vi' ? 'Tác quyền bị chặn với label ở một chỗ duy nhất' : 'Publishing is blocked for labels in exactly one place',
       c.lang === 'vi' ? 'scopeOf() trả về mảng rỗng cho label + tác quyền, và chanTacQuyenChoLabel() ném lỗi ở cả năm cửa vào. Chặn ở từng lời gọi thì quên một lời gọi là mở toang một dòng tiền.'
                       : 'scopeOf() returns an empty array for label + publishing, and one guard throws at all five entry points. Guarding call by call means one forgotten call opens a whole money stream.'],
      [true, c.lang === 'vi' ? 'Mọi gói dữ liệu gửi cho khách đều bị soát chuỗi cấm' : 'Every client payload is scanned for forbidden strings',
       c.lang === 'vi' ? 'scrub() ném lỗi nếu thấy tên đơn vị phân phối, tỷ lệ gốc, hay các chuỗi liên quan trong payload — thà hỏng màn hình còn hơn rò bí mật.'
                       : 'scrub() throws if the distributor name, gross rate, or related strings appear in a payload — better a broken screen than a leak.'],
      [false, c.lang === 'vi' ? 'KHÔNG chặn được iframe cùng gốc' : 'Does NOT stop a same-origin iframe',
       c.lang === 'vi' ? 'Nạp lại haustek-core.js trong iframe cùng gốc là có lại toàn bộ mặt tiền admin.'
                       : 'Reloading haustek-core.js in a same-origin iframe restores the whole admin surface.'],
      [false, c.lang === 'vi' ? 'KHÔNG chặn được đọc localStorage' : 'Does NOT stop reading localStorage',
       c.lang === 'vi' ? 'Toàn bộ quyết định của admin nằm ở đó dưới dạng JSON, và trang nào cùng gốc cũng đọc được.'
                       : 'Every admin decision sits there as JSON, readable by any same-origin page.']
    ].map(function (x) {
      return '<div class="check ' + (x[0] ? 'ok' : 'no') + '">' + HM.icon(x[0] ? 'check' : 'alert') +
        '<div style="min-width:0"><b>' + HM.esc(x[1]) + '</b><span>' + HM.esc(x[2]) + '</span></div></div>';
    }).join('') + '</div>',
    chan: c.lang === 'vi'
      ? 'Thứ thật sự bảo đảm cách ly nằm ở mục 5.1 tài liệu bàn giao: dữ liệu thô ở trong database, lọc và tổng hợp chạy ở máy chủ, Row Level Security quyết định ai đọc được dòng nào. Cái ở đây chỉ nói rõ tầng API phải có HÌNH DẠNG gì để RLS bên dưới có nghĩa.'
      : 'Real isolation is section 5.1 of the handoff: raw data in the database, filtering and aggregation on the server, row-level security deciding who reads which row. This only fixes the SHAPE the API layer must have for that to mean anything.'
  }) +
  HM.the({
    h2: HM.esc(t('bmChay')),
    p: c.lang === 'vi'
      ? 'Thử thật, ngay trong trang này: gọi API của khách bằng những tham số mà một người tò mò sẽ thử.'
      : 'Actually run them, here in this page: call the client API with the parameters a curious person would try.',
    hanhDong: '<button type="button" class="btn sm pri" data-probe>' + HM.icon('check') + HM.esc(t('bmChay')) + '</button>',
    than: '<div data-kqprobe><p class="hint">' + HM.esc(c.lang === 'vi'
      ? 'Chưa chạy. Bấm nút để thử.' : 'Not run yet.') + '</p></div>'
  });
}

function chayProbe(c, root) {
  var api = HAUSTEK.api, A = c.A;
  var kyDuyet = A.periods.filter(function (p) { return A.isApproved(p.k); });
  var pk = kyDuyet.length ? kyDuyet[kyDuyet.length - 1].k : null;
  var chuaDuyet = A.periods.filter(function (p) { return !A.isApproved(p.k); })[0];

  var thu = function (ten, mong, fn) {
    var kq;
    try { var v = fn(); kq = { chan: false, mo: c.lang === 'vi' ? 'Trả về được dữ liệu' : 'Returned data', v: v }; }
    catch (e) { kq = { chan: true, mo: e.message }; }
    return { ten: ten, mongChan: mong, dat: kq.chan === mong, mo: kq.mo };
  };

  var ds = [
    thu(c.lang === 'vi' ? 'Label đọc dòng tiền tác quyền' : 'A label reads the publishing stream', true,
      function () { return api.summary('label', 0, pk, 'pub'); }),
    thu(c.lang === 'vi' ? 'Label lấy xu hướng tác quyền 12 kỳ' : 'A label pulls a 12-period publishing trend', true,
      function () { return api.trend('label', 0, 'pub'); }),
    thu(c.lang === 'vi' ? 'Label bóc tác quyền theo tổ chức' : 'A label breaks publishing down by CMO', true,
      function () { return api.breakdown('label', 0, pk, 'pub', 'src'); }),
    thu(c.lang === 'vi' ? 'Khách đọc kỳ chưa duyệt' : 'A client reads an unapproved period', true,
      function () { return api.summary('artist', 0, chuaDuyet ? chuaDuyet.k : pk, 'rec'); }),
    thu(c.lang === 'vi' ? 'Nghệ sĩ mở bản ghi không thuộc mình' : 'An artist opens a recording that is not theirs', true,
      function () {
        var sc = A.scopeOf('artist', 0, 'rec');
        var la = {};
        for (var i = 0; i < sc.length; i++) la[sc[i]] = 1;
        for (var j = 0; j < A.trackCount; j++) if (!la[j] && A.grossRec(j, A.pIndexOf(pk)) > 0) return api.trackDetail('artist', 0, pk, 'rec', j);
        throw new Error('Không tìm được bản ghi để thử');
      }),
    thu(c.lang === 'vi' ? 'Gọi API với vai trò "admin"' : 'Calling the API with role "admin"', true,
      function () { return api.summary('admin', 0, pk, 'rec'); }),
    thu(c.lang === 'vi' ? 'Gọi với mã bên nhận ngoài phạm vi' : 'Calling with an out-of-range payee id', true,
      function () { return api.summary('artist', 99999, pk, 'rec'); }),
    thu(c.lang === 'vi' ? 'Nghệ sĩ đọc chính dữ liệu của mình' : 'An artist reads their own data', false,
      function () { return api.summary('artist', 0, pk, 'rec'); })
  ];

  var dat = ds.filter(function (x) { return x.dat; }).length;
  var o = root.querySelector('[data-kqprobe]');
  o.innerHTML = '<div class="checks">' + ds.map(function (x) {
    return '<div class="check ' + (x.dat ? 'ok' : 'no') + '">' + HM.icon(x.dat ? 'check' : 'alert') +
      '<div style="min-width:0"><b>' + HM.esc(x.ten) + '</b>' +
      '<span>' + HM.esc((x.mongChan ? (c.lang === 'vi' ? 'phải bị chặn — ' : 'must be blocked — ')
                                     : (c.lang === 'vi' ? 'phải cho qua — ' : 'must pass — ')) + x.mo) + '</span></div></div>';
  }).join('') + '</div>' +
    '<p class="hint" style="margin-top:10px">' +
    (dat === ds.length
      ? '<span class="pos">' + HM.esc(c.lang === 'vi' ? 'Đạt ' + dat + '/' + ds.length + ' — mọi đường thử đều ra đúng như mong đợi.'
                                                      : dat + '/' + ds.length + ' — every probe behaved as expected.') + '</span>'
      : '<span class="neg">' + HM.esc(c.lang === 'vi' ? 'Đạt ' + dat + '/' + ds.length + ' — có đường không đúng như mong đợi.'
                                                      : dat + '/' + ds.length + ' — a probe did not behave as expected.') + '</span>') +
    '</p>';
  c.thongBao(c.lang === 'vi' ? 'Chạy xong ' + ds.length + ' phép thử' : 'Ran ' + ds.length + ' probes',
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
      HM.esc(c.lang === 'vi' ? 'Gõ tên hoặc mã bên nhận' : 'Type a payee name or code') + '">' +
      '<input type="hidden" data-o="key" value="">' +
      '<div data-kq style="margin-top:8px;max-height:180px;overflow:auto"></div>' +
      '<div class="hint">' + HM.esc(c.lang === 'vi'
        ? 'Vai trò admin không gắn với bên nhận nào — họ nhìn thấy toàn hệ thống.'
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
          HM.esc(c.lang === 'vi' ? 'Vai trò admin không gắn bên nhận.' : 'Admin binds to no payee.') + '</p>'; return; }
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
          : '<p class="hint">' + HM.esc(c.lang === 'vi' ? 'Không tìm thấy' : 'Not found') + '</p>';
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
        c.thongBao(c.lang === 'vi' ? 'Đã nhập trạng thái — đang nạp lại' : 'State imported — reloading', 'ok');
        setTimeout(function () { location.reload(); }, 600);
      } catch (e) { c.thongBao(e.message, 'no'); }
    };
    r.readAsText(f);
  });
  inp.click();
}

})();
