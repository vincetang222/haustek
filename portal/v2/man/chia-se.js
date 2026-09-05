/* =====================================================================
   NỘI BỘ · CHIA SẺ TÁC QUYỀN
   ---------------------------------------------------------------------
   Toàn cảnh splits của mọi tài khoản: bài nào đang chia cho ai, bao nhiêu
   phần trăm, ai chưa nhận lời mời, ai đang trong giai đoạn thu hồi. Kế
   toán cần bảng này khi chi trả: phần của người cộng tác đã nhận lời mời
   được tách khỏi số trả cho chủ bản ghi. Hỗ trợ có thể xác nhận thay khi
   người cộng tác gửi xác nhận qua email.
   ===================================================================== */
"use strict";
(function () {

var LOC = { tim: '', loc: 'all', trang: 0 };

HT.dangKy({
  id: 'chia-se', nav: 'navChiaSe', nhom: 'nhomTien', icon: 'swap',
  vai: ['ops', 'sales', 'support', 'mgmt', 'accounting'],
  dem: function (c) { try { return c.A.splits().counts.invited || null; } catch (e) { return null; } },

  chu: {
    vi: {
      navChiaSe: 'Chia sẻ tác quyền', h1: 'Chia sẻ tác quyền',
      mo: 'Bài nào đang chia phần trăm cho ai, lời mời nào chưa được nhận, khoản thu hồi nào còn dở. Phần của người cộng tác đã nhận được tách khỏi số trả cho chủ bản ghi khi chi trả.',
      kBai: 'Bài có chia sẻ', kNg: 'Người cộng tác', kMoi: 'Lời mời chưa nhận', kMoiS: 'chưa được chia tiền', kDaChia: 'Đã chia cho người cộng tác', kDaChiaS: 'tích luỹ các kỳ đã xét duyệt', kThuHoi: 'Đang thu hồi',
      locAll: 'Tất cả', locMoi: 'Có lời mời chưa nhận', locThuHoi: 'Đang thu hồi', tim: 'Tìm bài, ISRC, tài khoản, email…',
      xacNhanThay: 'Xác nhận thay', hoiXn: 'Xác nhận thay {e}?', hoiXnMo: 'Chỉ làm khi người cộng tác đã gửi xác nhận bằng văn bản; hành động được ghi nhật ký.', daXn: 'Đã xác nhận cho {e}',
      khong: 'Không có bài nào khớp', khongMo: 'Đổi bộ lọc phía trên.'
    },
    en: {
      navChiaSe: 'Royalty splits', h1: 'Royalty splits',
      mo: 'Which tracks share a percentage with whom, which invitations are pending, which recoupments are still running. Accepted collaborator shares are separated from the owner’s payout.',
      kBai: 'Tracks with splits', kNg: 'Collaborators', kMoi: 'Pending invitations', kMoiS: 'not paid yet', kDaChia: 'Paid to collaborators', kDaChiaS: 'across approved periods', kThuHoi: 'Recouping',
      locAll: 'All', locMoi: 'Pending invitations', locThuHoi: 'Recouping', tim: 'Search track, ISRC, account, email…',
      xacNhanThay: 'Accept on behalf', hoiXn: 'Accept on behalf of {e}?', hoiXnMo: 'Only when the collaborator has confirmed in writing; the action is logged.', daXn: 'Accepted for {e}',
      khong: 'No tracks match', khongMo: 'Change the filters above.'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var d = HM.nho(A, 'chia-se', function () { return A.splits(); });
    var k = d.counts, qq = LOC.tim.trim().toLowerCase();
    var rows = d.rows.filter(function (r) {
      if (LOC.loc === 'moi' && !r.collaborators.some(function (x) { return x.status === 'invited'; })) return false;
      if (LOC.loc === 'thuhoi' && !r.collaborators.some(function (x) { return x.recouping; })) return false;
      if (qq && (r.title + ' ' + r.isrc + ' ' + r.artist + ' ' + A.partyName(r.partyKey) + ' ' + r.collaborators.map(function (x) { return x.name + ' ' + x.email; }).join(' ')).toLowerCase().indexOf(qq) < 0) return false;
      return true;
    });
    var pt = HTM.phanTrang(rows, LOC, 15);
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kBai'), v: HT.fmt.n(k.tracks), lon: true, s: d.sampled ? (c.lang === 'vi' ? 'đã lấy mẫu' : 'sampled') : '' },
      { l: t('kNg'), v: HT.fmt.n(k.collaborators) },
      { l: t('kMoi'), v: HT.fmt.n(k.invited), s: t('kMoiS'), mau: k.invited ? HB.mau('warn') : '' },
      { l: t('kDaChia'), v: c.tien2(k.paid), s: t('kDaChiaS') },
      { l: t('kThuHoi'), v: HT.fmt.n(k.recouping) }
    ]);
    html += '<div class="bar">' +
      [['all', t('locAll')], ['moi', t('locMoi')], ['thuhoi', t('locThuHoi')]].map(function (x) { return '<button type="button" class="pill' + (LOC.loc === x[0] ? ' on' : '') + '" data-loc="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div></div>';
    html += HM.the({ thoBody: true,
      than: !rows.length ? HM.trong({ icon: 'empty', tieuDe: t('khong'), moTa: t('khongMo') })
        : HTM.bangChiaSe(pt.page, { noiBo: true, tenTk: function (pk) { return A.partyName(pk); }, tien: c.tien2,
            nutCong: function (r, cg) { return cg.status === 'invited' ? '<button type="button" class="btn sm" data-xn="' + r.trackId + '|' + HM.esc(cg.email) + '">' + HM.esc(t('xacNhanThay')) + '</button>' : ''; } }) + pt.chan,
      chan: HM.esc(c.song(d, 'note')) });
    root.innerHTML = html;
    HTM.ganTrang(root, LOC, c.veLai);
    HM.bam(root, '[data-loc]', function (el) { LOC.loc = el.getAttribute('data-loc'); LOC.trang = 0; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); var i = root.querySelector('[data-tim]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
    HM.bam(root, '[data-xn]', function (el) {
      var p = el.getAttribute('data-xn').split('|'), id = +p[0], email = p.slice(1).join('|');
      c.xacNhan(t('hoiXn').replace('{e}', email), HM.esc(t('hoiXnMo')), t('xacNhanThay')).then(function (ok) {
        if (!ok) return;
        try { A.acceptSplit(id, email, A.staff.me.name); c.thongBao(t('daXn').replace('{e}', email), 'ok'); c.veLai(); }
        catch (e) { c.thongBao(e.message, 'no'); }
      });
    });
    HM.bam(root, 'tr[data-cs]', function (el, e) {
      if (e.target.closest('button')) return;
      var id = +el.getAttribute('data-cs'), a;
      try { a = A.asset(id); } catch (err) { return; }
      HTS.moNgan(c, a, { noiBo: true, tien: c.tien2, tien0: c.tien, playlists: A.playlistsOf(id), tabDau: 'cl' });
    });
  }
});

})();
