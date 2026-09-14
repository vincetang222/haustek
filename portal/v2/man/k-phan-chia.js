/* =====================================================================
   CỔNG NGƯỜI CỘNG TÁC · PHẦN CHIA CỦA TÔI
   ---------------------------------------------------------------------
   Đây là góc nhìn NGƯỢC LẠI với trang Chia sẻ tác quyền của chủ bài.
   Chủ bài hỏi "tôi chia cho những ai"; người cộng tác hỏi "tôi được chia
   trên bài nào, bao nhiêu, và đã nhận đủ chưa".

   Ranh giới quan trọng nhất của trang này là thứ nó KHÔNG hiện: doanh
   thu của bài, lượt nghe, nền tảng, lãnh thổ. Người cộng tác biết phần
   trăm của mình và số tiền mình nhận; từ hai số ấy họ suy ra được phần
   của chủ bài, và đó là điều không tránh được — nhưng portal không tự
   mình bày thêm gì nữa.
   ===================================================================== */
"use strict";
(function () {

HT.dangKy({
  id: 'k-phan-chia', nav: 'navPhanChia', nhom: '', icon: 'swap',

  dem: function (c) {
    try {
      var m = c.api.loiMoiChiaSe(c.phien.me.role, c.phien.me.partyId);
      return m.invited ? '!' + m.invited : '';
    } catch (e) { return ''; }
  },

  chu: {
    vi: {
      navPhanChia: 'Phần chia của tôi', h1: 'Phần chia của tôi',
      mo: 'Bài nào bạn có phần, chủ bài là ai, bạn giữ bao nhiêu phần trăm và đã nhận được bao nhiêu.',
      kBai: 'Bài có phần', kDaNhan: 'Đã nhận', kDaNhanS: 'cộng dồn các kỳ đã xét duyệt', kMoi: 'Lời mời chưa trả lời',
      /* lời mời */
      loiMoi: 'Lời mời cộng tác', loiMoiMo: 'Ai đó mời bạn nhận một phần trên bài của họ. Nhận rồi thì từ kỳ xét duyệt kế tiếp, phần ấy vào ví bạn.',
      cBai: 'Bài', cChu: 'Chủ bài', cVai: 'Vai', cPhan: 'Phần', cThuHoi: 'Ngưỡng thu hồi', cTt: 'Trạng thái', cNhan: 'Đã nhận', cTu: 'Nhận từ',
      nhan: 'Nhận lời mời', daNhan: 'Đã nhận lời mời', dangCho: 'Chờ bạn trả lời',
      hoiNhan: 'Nhận phần chia trên "{t}"?',
      hoiNhanMo: 'Bạn nhận {p}% phần của {c} trên bài này. Từ kỳ xét duyệt kế tiếp, phần ấy được ghi thẳng vào ví bạn thay vì vào ví họ.',
      dongY: 'Nhận', daNhanXong: 'Đã nhận lời mời cộng tác',
      trongMoi: 'Không có lời mời nào đang chờ', trongMoiMo: 'Khi ai đó mời bạn cộng tác, lời mời hiện ở đây.',
      /* bảng phần chia */
      bang: 'Bài bạn có phần', bangMo: 'Con số là tiền đã ghi vào ví bạn, không phải doanh thu của bài.',
      thuHoiCon: 'chủ bài nhận trước {n}', khongThuHoi: 'không có',
      trong: 'Chưa có bài nào', trongMo: 'Nhận một lời mời cộng tác là bài ấy hiện ở đây, kèm số tiền theo từng kỳ.',
      /* chi tiết theo kỳ */
      chiTiet: 'Theo kỳ', dongKy: '{n} kỳ đã ghi', chuaKy: 'chưa kỳ nào',
      cKy: 'Kỳ', cSoTien: 'Ghi vào ví', cLuc: 'Xét duyệt lúc'
    },
    en: {
      navPhanChia: 'My shares', h1: 'My shares',
      mo: 'Which tracks you hold a share on, who owns them, what percentage you hold and how much you have received.',
      kBai: 'Tracks', kDaNhan: 'Received', kDaNhanS: 'across approved periods', kMoi: 'Invitations to answer',
      loiMoi: 'Collaboration invitations', loiMoiMo: 'Someone invited you to take a share on their track. Once you accept, that share goes to your wallet from the next approved period.',
      cBai: 'Track', cChu: 'Owner', cVai: 'Role', cPhan: 'Share', cThuHoi: 'Recoupment', cTt: 'Status', cNhan: 'Accepted', cTu: 'Accepted on',
      nhan: 'Accept', daNhan: 'Accepted', dangCho: 'Waiting for you',
      hoiNhan: 'Accept your share on “{t}”?',
      hoiNhanMo: 'You take {p}% of {c}’s share on this track. From the next approved period it is credited to your wallet instead of theirs.',
      dongY: 'Accept', daNhanXong: 'Invitation accepted',
      trongMoi: 'No pending invitations', trongMoiMo: 'When someone invites you to collaborate, the invitation appears here.',
      bang: 'Tracks you hold a share on', bangMo: 'The figure is what was credited to your wallet, not the track’s revenue.',
      thuHoiCon: 'owner paid first up to {n}', khongThuHoi: 'none',
      trong: 'No tracks yet', trongMo: 'Accept a collaboration invitation and the track appears here with the amount per period.',
      chiTiet: 'By period', dongKy: '{n} periods credited', chuaKy: 'none yet',
      cKy: 'Period', cSoTien: 'Credited', cLuc: 'Approved at'
    }
  },

  ve: function (root, c) {
    var t = c.t, api = c.api, me = c.phien.me;
    var pc = api.phanChia(me.role, me.partyId);
    var moi = api.loiMoiChiaSe(me.role, me.partyId);
    var cho = (moi.rows || []).filter(function (r) { return r.status === 'invited'; });

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kBai'), v: HT.fmt.n(pc.tracks), lon: true },
      { l: t('kDaNhan'), v: HT.fmt.usd(pc.daTra), s: t('kDaNhanS') },
      { l: t('kMoi'), v: HT.fmt.n(cho.length), mau: cho.length ? HB.mau('warn') : '' }
    ]);

    /* ---- lời mời đang chờ ---- */
    html += HM.the({
      h2: HM.esc(t('loiMoi')) + (cho.length ? ' <span class="muted">(' + cho.length + ')</span>' : ''),
      p: HM.esc(t('loiMoiMo')), thoBody: true,
      than: cho.length
        ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cBai')) + '</th><th>' + HM.esc(t('cChu')) + '</th>' +
          '<th>' + HM.esc(t('cVai')) + '</th><th class="num">' + HM.esc(t('cPhan')) + '</th>' +
          '<th>' + HM.esc(t('cThuHoi')) + '</th><th></th></tr></thead><tbody>' +
          cho.map(function (r) {
            return '<tr><td>' + HM.tenBia({ bia: r.trackId, ten: HM.dai(r.title, 32), phu: r.artist + ' · ' + r.isrc }) + '</td>' +
              '<td>' + HM.esc(HM.dai(r.chu, 20)) + '</td>' +
              '<td>' + HM.esc(c.song(r, 'roleLabel')) + '</td>' +
              '<td class="num"><b>' + HM.esc(HT.fmt.n(r.pct)) + '%</b></td>' +
              '<td>' + (r.recoup ? '<span class="muted">' + HM.esc(t('thuHoiCon').replace('{n}', HT.fmt.usd0(r.recoup))) + '</span>'
                                 : '<span class="nil">' + HM.esc(t('khongThuHoi')) + '</span>') + '</td>' +
              '<td><button type="button" class="btn sm pri" data-nhan="' + r.trackId + '" data-email="' + HM.esc(r.email) +
                '" data-ten="' + HM.esc(r.title) + '" data-pct="' + HM.esc(String(r.pct)) + '" data-chu="' + HM.esc(r.chu) + '">' +
                HM.icon('check') + HM.esc(t('nhan')) + '</button></td></tr>';
          }).join('') + '</tbody></table></div>'
        : HM.trong({ tieuDe: t('trongMoi'), moTa: t('trongMoiMo'), icon: 'check' })
    });

    /* ---- bài đã có phần ---- */
    html += HM.the({
      h2: HM.esc(t('bang')), p: HM.esc(t('bangMo')), thoBody: true,
      than: pc.rows.length
        ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cBai')) + '</th><th>' + HM.esc(t('cChu')) + '</th>' +
          '<th>' + HM.esc(t('cVai')) + '</th><th class="num">' + HM.esc(t('cPhan')) + '</th>' +
          '<th>' + HM.esc(t('cTu')) + '</th><th class="num">' + HM.esc(t('cNhan')) + '</th>' +
          '<th>' + HM.esc(t('chiTiet')) + '</th></tr></thead><tbody>' +
          pc.rows.map(function (r) {
            return '<tr><td>' + HM.tenBia({ bia: r.trackId, ten: HM.dai(r.title, 32), phu: r.artist + ' · ' + r.isrc }) + '</td>' +
              '<td>' + HM.esc(HM.dai(r.chu, 20)) + '</td>' +
              '<td>' + HM.esc(c.song(r, 'vaiLabel')) + '</td>' +
              '<td class="num"><b>' + HM.esc(HT.fmt.n(r.pct)) + '%</b>' +
                (r.recoup ? '<div class="muted" style="font-size:11px">' + HM.esc(t('thuHoiCon').replace('{n}', HT.fmt.usd0(r.recoup))) + '</div>' : '') + '</td>' +
              '<td class="mono">' + HM.esc(r.acceptedAt ? HT.fmt.ngay(r.acceptedAt) : '—') + '</td>' +
              '<td class="num band"><b>' + HM.esc(HT.fmt.usd(r.daTra)) + '</b></td>' +
              '<td>' + (r.theoKy.length
                ? '<button type="button" class="btn sm" data-ky-bai="' + r.trackId + '">' +
                    HM.esc(t('dongKy').replace('{n}', r.theoKy.length)) + '</button>'
                : '<span class="nil">' + HM.esc(t('chuaKy')) + '</span>') + '</td></tr>' +
              '<tr class="ky-bai" data-cua="' + r.trackId + '" hidden><td colspan="7">' +
                '<table class="t"><thead><tr><th>' + HM.esc(t('cKy')) + '</th>' +
                '<th class="num">' + HM.esc(t('cSoTien')) + '</th><th>' + HM.esc(t('cLuc')) + '</th></tr></thead><tbody>' +
                r.theoKy.map(function (x) {
                  return '<tr><td><b>' + HM.esc(x.label) + '</b></td>' +
                    '<td class="num">' + HM.esc(HT.fmt.usd(x.soTien)) + '</td>' +
                    '<td class="mono">' + HM.esc(HT.fmt.luc(x.approvedAt)) + '</td></tr>';
                }).join('') + '</tbody></table></td></tr>';
          }).join('') + '</tbody></table></div>'
        : HM.trong({ tieuDe: t('trong'), moTa: t('trongMo'), icon: 'swap' })
    });

    html += HM.the({ h2: HM.esc(c.lang === 'vi' ? 'Cách tính' : 'How it works'),
      than: '<p class="say">' + HM.esc(c.song(pc, 'note')) + '</p>' });

    root.innerHTML = html;

    /* mở / đóng bảng theo kỳ của một bài */
    HM.bam(root, '[data-ky-bai]', function (el) {
      var id = el.getAttribute('data-ky-bai');
      var d = root.querySelector('.ky-bai[data-cua="' + id + '"]');
      if (d) d.hidden = !d.hidden;
    });

    /* nhận lời mời — xác nhận trước, vì nhận rồi là tiền đổi chủ từ kỳ sau */
    HM.bam(root, '[data-nhan]', function (el) {
      var id = el.getAttribute('data-nhan'), email = el.getAttribute('data-email');
      c.hoiThoai({
        tieuDe: t('hoiNhan').replace('{t}', el.getAttribute('data-ten')),
        moTa: HM.esc(t('hoiNhanMo').replace('{p}', el.getAttribute('data-pct')).replace('{c}', el.getAttribute('data-chu'))),
        dong: t('dongY')
      }).then(function (ok) {
        if (!ok) return;
        try {
          api.acceptSplit(me.role, me.partyId, +id, email);
          c.thongBao(t('daNhanXong'), 'ok');
          c.veLai();
        } catch (e) { c.thongBao(e.message, 'no'); }
      });
    });
  }
});

})();
