/* =====================================================================
   CỔNG ĐỐI TÁC · CHIA SẺ TÁC QUYỀN (splits)
   ---------------------------------------------------------------------
   Mời người cộng tác (producer, nghệ sĩ khách, đồng sáng tác, kỹ sư) nhận
   phần trăm trên số tiền của bạn cho một bài, tuỳ chọn ngưỡng thu hồi:
   bạn nhận trước cho đến khi đủ rồi mới chia. Người cộng tác chỉ thấy
   phần của họ. Đây là tính năng phổ biến nhất ở các nền tảng phân phối
   độc lập (DistroKid Splits, Symphonic SplitShare, TuneCore Splits).
   ===================================================================== */
"use strict";
(function () {

var LOC = { tim: '', loc: 'all', trang: 0 };
var NHO = { key: null, d: null };
function lay(c) {
  var me = c.phien.me, key = me.role + ':' + me.partyId;
  if (NHO.key !== key) { NHO.d = c.api.splits(me.role, me.partyId); NHO.key = key; }
  return NHO.d;
}
function lamMoi() { NHO.key = null; }

HT.dangKy({
  id: 'k-chia-se', nav: 'navChiaSe', nhom: 'nhomTaiChinh', icon: 'swap',
  dem: function (c) { try { return lay(c).counts.invited || null; } catch (e) { return null; } },

  chu: {
    vi: {
      navChiaSe: 'Chia sẻ tác quyền', h1: 'Chia sẻ tác quyền',
      mo: 'Chia phần trăm số tiền của một bài cho producer, nghệ sĩ khách, đồng sáng tác hay kỹ sư. Người cộng tác chỉ thấy phần của họ; có ngưỡng thu hồi thì bạn nhận trước cho đến khi đủ.',
      kBai: 'Bài có chia sẻ', kNg: 'Người cộng tác', kMoi: 'Lời mời chưa nhận', kMoiS: 'chưa được chia tiền cho tới khi nhận', kDaChia: 'Đã chia cho người cộng tác', kDaChiaS: 'tích luỹ các kỳ đã xét duyệt', kThuHoi: 'Đang thu hồi', kThuHoiS: 'bạn nhận trước cho tới khi đủ',
      locAll: 'Tất cả', locMoi: 'Có lời mời chưa nhận', locThuHoi: 'Đang thu hồi', tim: 'Tìm bài hát, ISRC, email…',
      themMoi: 'Thêm chia sẻ cho bài khác', them: 'Thêm người', bo: 'Bỏ',
      khong: 'Không có bài nào khớp', khongMo: 'Đổi bộ lọc hoặc thêm chia sẻ cho một bài.', trong: 'Chưa có bài nào được chia sẻ', trongMo: 'Bấm “Thêm chia sẻ cho bài khác”, nhập ISRC và người cộng tác.',
      hoiThem: 'Thêm người cộng tác', hoiThemMo: 'Người được mời sẽ nhận email; phần chia có hiệu lực từ kỳ tiếp theo sau khi họ nhận. Tổng phần chia không vượt 100%.',
      fIsrc: 'ISRC hoặc tên bài hát', fTen: 'Tên người cộng tác', fEmail: 'Email', fVai: 'Vai trò', fPct: 'Phần trăm trên số tiền của bạn', fRecoup: 'Ngưỡng thu hồi (USD, để 0 nếu không)', gui: 'Gửi lời mời',
      daThem: 'Đã gửi lời mời cho {e}', daBo: 'Đã bỏ {e} khỏi bài', khongThayBai: 'Không tìm thấy bài hát khớp “{q}” trong danh mục của bạn',
      hoiBo: 'Bỏ {e} khỏi “{t}”?', hoiBoMo: 'Phần chia dừng từ kỳ tiếp theo; các kỳ đã chia không đổi.'
    },
    en: {
      navChiaSe: 'Royalty splits', h1: 'Royalty splits',
      mo: 'Share a percentage of a track’s earnings with a producer, featured artist, co-writer or engineer. Collaborators only see their share; with a recoupment amount you are paid first until it is met.',
      kBai: 'Tracks with splits', kNg: 'Collaborators', kMoi: 'Pending invitations', kMoiS: 'not paid until accepted', kDaChia: 'Paid to collaborators', kDaChiaS: 'across approved periods', kThuHoi: 'Recouping', kThuHoiS: 'you are paid first until met',
      locAll: 'All', locMoi: 'Pending invitations', locThuHoi: 'Recouping', tim: 'Search track, ISRC, email…',
      themMoi: 'Add a split on another track', them: 'Add person', bo: 'Remove',
      khong: 'No tracks match', khongMo: 'Change the filter or add a split on a track.', trong: 'No splits yet', trongMo: 'Click “Add a split on another track”, enter the ISRC and the collaborator.',
      hoiThem: 'Add collaborator', hoiThemMo: 'The invitee receives an email; the split applies from the next period after acceptance. Shares cannot exceed 100% in total.',
      fIsrc: 'ISRC or track title', fTen: 'Collaborator name', fEmail: 'Email', fVai: 'Role', fPct: 'Percentage of your earnings', fRecoup: 'Recoupment amount (USD, 0 for none)', gui: 'Send invitation',
      daThem: 'Invitation sent to {e}', daBo: 'Removed {e} from the track', khongThayBai: 'No track matching “{q}” in your catalogue',
      hoiBo: 'Remove {e} from “{t}”?', hoiBoMo: 'The split stops from the next period; already-paid periods do not change.'
    }
  },

  ve: function (root, c) {
    var t = c.t, me = c.phien.me, api = c.api, d;
    try { d = lay(c); } catch (e) { root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) }) + HM.the({ than: '<p class="say">' + HM.esc(e.message) + '</p>' }); return; }
    var k = d.counts, qq = LOC.tim.trim().toLowerCase();
    var rows = d.rows.filter(function (r) {
      if (LOC.loc === 'moi' && !r.collaborators.some(function (x) { return x.status === 'invited'; })) return false;
      if (LOC.loc === 'thuhoi' && !r.collaborators.some(function (x) { return x.recouping; })) return false;
      if (qq && (r.title + ' ' + r.isrc + ' ' + r.artist + ' ' + r.collaborators.map(function (x) { return x.name + ' ' + x.email; }).join(' ')).toLowerCase().indexOf(qq) < 0) return false;
      return true;
    });
    var pt = HTM.phanTrang(rows, LOC, 15);
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')), nut: '<button type="button" class="btn pri" data-them-moi>' + HM.icon('user') + HM.esc(t('themMoi')) + '</button>' });
    html += HM.so([
      { l: t('kBai'), v: HT.fmt.n(k.tracks), lon: true },
      { l: t('kNg'), v: HT.fmt.n(k.collaborators) },
      { l: t('kMoi'), v: HT.fmt.n(k.invited), s: t('kMoiS'), mau: k.invited ? HB.mau('warn') : '' },
      { l: t('kDaChia'), v: HT.fmt.usd(k.paid), s: t('kDaChiaS') },
      { l: t('kThuHoi'), v: HT.fmt.n(k.recouping), s: t('kThuHoiS') }
    ]);
    html += '<div class="bar">' +
      [['all', t('locAll')], ['moi', t('locMoi')], ['thuhoi', t('locThuHoi')]].map(function (x) { return '<button type="button" class="pill' + (LOC.loc === x[0] ? ' on' : '') + '" data-loc="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      '</div>';
    html += HM.the({
      thoBody: true,
      than: !d.rows.length ? HM.trong({ icon: 'user', tieuDe: t('trong'), moTa: t('trongMo') })
        : !rows.length ? HM.trong({ icon: 'empty', tieuDe: t('khong'), moTa: t('khongMo') })
        : HTM.bangChiaSe(pt.page, { tien: HT.fmt.usd,
            nutCong: function (r, cg) { return '<button type="button" class="btn sm ghost dang" data-bo="' + r.trackId + '|' + HM.esc(cg.email) + '" title="' + HM.esc(t('bo')) + '">' + HM.icon('x') + '</button>'; },
            nutBai: function (r) { return '<button type="button" class="btn sm" data-them="' + r.trackId + '">' + HM.icon('user') + HM.esc(t('them')) + '</button>'; } }) + pt.chan,
      chan: HM.esc(c.song(d, 'note'))
    });
    root.innerHTML = html;
    HTM.ganTrang(root, LOC, c.veLai);
    HM.bam(root, '[data-loc]', function (el) { LOC.loc = el.getAttribute('data-loc'); LOC.trang = 0; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); var i = root.querySelector('[data-tim]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
    HM.bam(root, '[data-them-moi]', function () { hoiThem(c, d, null); });
    HM.bam(root, '[data-them]', function (el) { hoiThem(c, d, +el.getAttribute('data-them')); });
    HM.bam(root, '[data-bo]', function (el) {
      var p = el.getAttribute('data-bo').split('|'), id = +p[0], email = p.slice(1).join('|');
      var r = d.rows.filter(function (x) { return x.trackId === id; })[0];
      c.xacNhan(t('hoiBo').replace('{e}', email).replace('{t}', r ? r.title : id), HM.esc(t('hoiBoMo')), t('bo'), true).then(function (ok) {
        if (!ok) return;
        try { api.removeSplit(me.role, me.partyId, id, email); lamMoi(); c.thongBao(t('daBo').replace('{e}', email), 'ok'); c.veLai(); }
        catch (e) { c.thongBao(e.message, 'no'); }
      });
    });
  }
});

function hoiThem(c, d, trackId) {
  var t = c.t, me = c.phien.me, api = c.api;
  var r = trackId != null ? d.rows.filter(function (x) { return x.trackId === trackId; })[0] : null;
  c.hoiThoai({
    tieuDe: t('hoiThem') + (r ? ' · ' + r.title : ''), moTa: HM.esc(t('hoiThemMo')),
    than: (r ? '' : '<label class="fld">' + HM.esc(t('fIsrc')) + '</label><input class="in mono" data-o="isrc" placeholder="VN…">') +
      '<div class="grid g2" style="margin-top:' + (r ? 0 : 12) + 'px;margin-bottom:0"><div><label class="fld">' + HM.esc(t('fTen')) + '</label><input class="in" data-o="name"></div>' +
      '<div><label class="fld">' + HM.esc(t('fEmail')) + '</label><input class="in" type="email" data-o="email" placeholder="ten@vidu.vn"></div></div>' +
      '<div class="grid g3" style="margin-top:12px;margin-bottom:0"><div><label class="fld">' + HM.esc(t('fVai')) + '</label><select class="in" data-o="role">' + d.roles.map(function (x) { return '<option value="' + x.k + '">' + HM.esc(c.song(x, 'label')) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="fld">' + HM.esc(t('fPct')) + '</label><input class="in" type="number" data-o="pct" min="0.5" max="100" step="0.5" value="20"></div>' +
      '<div><label class="fld">' + HM.esc(t('fRecoup')) + '</label><input class="in" type="number" data-o="recoup" min="0" step="10" value="0"></div></div>' +
      (r ? '<div class="hint" style="margin-top:12px">' + HM.esc((c.lang === 'vi' ? 'Chủ bản ghi đang giữ ' : 'Owner currently keeps ') + HT.fmt.n(r.ownerPct) + '%') + '</div>' : ''),
    dong: t('gui')
  }).then(function (f) {
    if (!f) return;
    var id = trackId;
    try {
      if (id == null) {
        var q = String(f.isrc || '').trim();
        var kq = api.search(me.role, me.partyId, q, 1);
        if (!kq.tracks.length) throw new Error(t('khongThayBai').replace('{q}', q));
        id = kq.tracks[0].id;
      }
      api.setSplit(me.role, me.partyId, id, { name: f.name, email: f.email, role: f.role, pct: +f.pct, recoup: +f.recoup });
      lamMoi(); c.thongBao(t('daThem').replace('{e}', f.email), 'ok'); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

})();
