/* =====================================================================
   CỔNG NGƯỜI CỘNG TÁC · TỔNG QUAN
   ---------------------------------------------------------------------
   Người cộng tác không sở hữu bài nào. Họ góp mặt trên bài của người
   khác — sản xuất, phối khí, hát cùng — và được chia một phần trăm trên
   phần của chủ bài. Nên trang này KHÔNG có doanh thu, không có lượt
   nghe, không có nền tảng: những thứ ấy là của chủ bài.

   Trang trả lời đúng bốn câu, theo thứ tự người ta thật sự hỏi:
     1. Tôi có bao nhiêu tiền, rút được chưa?
     2. Tiền ấy đến từ đâu — bài nào, ai là chủ, tôi giữ bao nhiêu phần?
     3. Còn ai mời tôi cộng tác mà tôi chưa trả lời không?
     4. Tôi cần làm gì tiếp (khai tài khoản nhận tiền, nhận lời mời)?
   ===================================================================== */
"use strict";
(function () {

HT.dangKy({
  id: 'k-toi', nav: 'navToi', nhom: '', icon: 'home',

  dem: function (c) {
    try {
      var s = c.phien.me;
      return s.loiMoi ? '!' + s.loiMoi : '';
    } catch (e) { return ''; }
  },

  chu: {
    vi: {
      navToi: 'Tổng quan', h1: 'Chào {ten}',
      mo: 'Bạn được chia phần trên bài của người khác. Trang này là toàn bộ những gì Haustek đang giữ cho bạn.',
      kVi: 'Trong ví', kViS: 'đã ghi qua các kỳ đã xét duyệt', kRut: 'Rút được ngay', kBai: 'Bài được chia', kLoiMoi: 'Lời mời chưa trả lời',
      duoiNguong: 'Dưới ngưỡng rút tối thiểu {n}', dangAm: 'Số dư đang âm',
      /* việc cần làm */
      canLam: 'Việc của bạn', canLamMo: 'Những bước còn thiếu để tiền về tới tài khoản của bạn.',
      vNganHang: 'Khai tài khoản nhận tiền', vNganHangMo: 'Haustek cần số tài khoản trước khi chuyển tiền. Tên chủ tài khoản phải trùng với tên trên thoả thuận.',
      vLoiMoi: 'Trả lời {n} lời mời cộng tác', vLoiMoiMo: 'Chưa nhận thì phần của bạn vẫn nằm ở chủ bài, không vào ví.',
      vRut: 'Gửi yêu cầu rút tiền', vRutMo: 'Số dư đã vượt ngưỡng tối thiểu. Haustek chuyển khoản trong 2 ngày làm việc.',
      vCho: 'Chờ kỳ tới', vChoMo: 'Số dư còn dưới ngưỡng rút {n}. Khoản này không mất, nó cộng dồn sang kỳ sau.',
      xong: 'Không còn việc nào', xongMo: 'Mọi thứ đã đủ. Kỳ tới có tiền là Haustek ghi thẳng vào ví bạn.',
      di: 'Mở',
      /* phần chia gọn */
      phan: 'Phần chia của bạn', phanMo: 'Mỗi dòng là một bài bạn có phần. Con số là tiền đã ghi vào ví bạn, không phải doanh thu của bài.',
      cBai: 'Bài', cChu: 'Chủ bài', cVai: 'Vai của bạn', cPhan: 'Phần của bạn', cDaNhan: 'Đã nhận',
      xemHet: 'Xem đầy đủ', trong: 'Chưa có bài nào', trongMo: 'Khi bạn nhận một lời mời cộng tác, bài ấy hiện ở đây.',
      /* dòng tiền theo kỳ */
      theoKy: 'Tiền vào ví theo kỳ', theoKyMo: 'Mỗi kỳ Haustek xét duyệt xong là một lần ghi vào ví.',
      cKy: 'Kỳ', cGhi: 'Ghi vào ví', cLuc: 'Xét duyệt lúc',
      trongKy: 'Chưa kỳ nào ghi vào ví', trongKyMo: 'Khoản đầu tiên được ghi khi kỳ đầu tiên có phần của bạn được xét duyệt.',
      /* giải thích */
      hieu: 'Cách phần của bạn được tính',
      hieuMo: 'Chủ bài nhận phần của họ sau khi Haustek trừ phí theo hợp đồng. Phần trăm của bạn cắt trên phần của CHỦ BÀI, không cắt trên doanh thu gộp. Có ngưỡng thu hồi thì chủ bài nhận trước cho tới khi đủ, rồi mới tới lượt bạn. Vì phần của bạn tính trên phần của người khác, cổng này không hiện doanh thu của bài.'
    },
    en: {
      navToi: 'Overview', h1: 'Hello {ten}',
      mo: 'You hold a share on other people’s tracks. This page is everything Haustek is holding for you.',
      kVi: 'In wallet', kViS: 'credited across approved periods', kRut: 'Withdrawable now', kBai: 'Tracks with a share', kLoiMoi: 'Invitations to answer',
      duoiNguong: 'Below the {n} minimum', dangAm: 'Balance is negative',
      canLam: 'Your next steps', canLamMo: 'What is still missing before the money reaches your account.',
      vNganHang: 'Add your payout account', vNganHangMo: 'Haustek needs your bank details before transferring. The account holder name must match the name on the agreement.',
      vLoiMoi: 'Answer {n} collaboration invitations', vLoiMoiMo: 'Until you accept, your share stays with the track owner and never reaches your wallet.',
      vRut: 'Request a withdrawal', vRutMo: 'Your balance is above the minimum. Haustek transfers within 2 working days.',
      vCho: 'Wait for the next period', vChoMo: 'Your balance is still below the {n} minimum. Nothing is lost; it adds up with the next period.',
      xong: 'Nothing to do', xongMo: 'Everything is in place. As soon as a period brings money in, Haustek credits your wallet.',
      di: 'Open',
      phan: 'Your shares', phanMo: 'Each row is a track you hold a share on. The figure is what was credited to your wallet, not the track’s revenue.',
      cBai: 'Track', cChu: 'Owner', cVai: 'Your role', cPhan: 'Your share', cDaNhan: 'Received',
      xemHet: 'See all', trong: 'No tracks yet', trongMo: 'Once you accept a collaboration invitation, that track appears here.',
      theoKy: 'Credited per period', theoKyMo: 'Each period Haustek approves is one credit to your wallet.',
      cKy: 'Period', cGhi: 'Credited', cLuc: 'Approved at',
      trongKy: 'Nothing credited yet', trongKyMo: 'The first credit lands when the first period containing your share is approved.',
      hieu: 'How your share is worked out',
      hieuMo: 'The track owner receives their share after Haustek deducts the contracted fee. Your percentage is taken from the OWNER’S share, not from gross revenue. Where a recoupment amount applies, the owner is paid first until it is met, and your share follows. Because your share is a percentage of someone else’s money, this portal does not show the track’s revenue.'
    }
  },

  ve: function (root, c) {
    var t = c.t, api = c.api, me = c.phien.me;
    var w = api.wallet(me.role, me.partyId);
    var pc = api.phanChia(me.role, me.partyId);
    var moi = api.loiMoiChiaSe(me.role, me.partyId);
    var choMoi = (moi.rows || []).filter(function (r) { return r.status === 'invited'; });

    var duoi = w.available > 0.004 && w.available < w.threshold;
    var html = HM.dau({
      h1: HM.esc(t('h1').replace('{ten}', me.name)),
      mo: HM.esc(t('mo'))
    });

    html += HM.so([
      { l: t('kVi'), v: HT.fmt.usd(w.totalCredit), lon: true, s: t('kViS') },
      { l: t('kRut'), v: HT.fmt.usd(Math.max(0, w.available)),
        s: w.amNo ? t('dangAm') : duoi ? t('duoiNguong').replace('{n}', HT.fmt.usd0(w.threshold)) : '',
        mau: w.amNo ? HB.mau('no') : duoi ? HB.mau('warn') : HB.mau('ok') },
      { l: t('kBai'), v: HT.fmt.n(pc.tracks) },
      { l: t('kLoiMoi'), v: HT.fmt.n(choMoi.length), mau: choMoi.length ? HB.mau('warn') : '' }
    ]);

    /* ---- việc cần làm: đúng thứ tự chặn tiền ---- */
    var viec = [];
    if (!w.bank) viec.push({ ten: t('vNganHang'), mo: t('vNganHangMo'), di: 'k-vi', kieu: 'warn' });
    if (choMoi.length) viec.push({ ten: t('vLoiMoi').replace('{n}', choMoi.length), mo: t('vLoiMoiMo'), di: 'k-phan-chia', kieu: 'warn' });
    if (w.bank && w.available >= w.threshold) viec.push({ ten: t('vRut'), mo: t('vRutMo'), di: 'k-vi', kieu: 'ok' });
    else if (w.bank && duoi) viec.push({ ten: t('vCho'), mo: t('vChoMo').replace('{n}', HT.fmt.usd0(w.threshold)), di: '', kieu: '' });

    html += HM.the({
      h2: HM.esc(t('canLam')), p: HM.esc(t('canLamMo')),
      than: viec.length
        ? '<div class="checks">' + viec.map(function (v) {
            return '<div class="check ' + (v.kieu || '') + '">' + HM.icon(v.kieu === 'ok' ? 'check' : 'alert') +
              '<div><b>' + HM.esc(v.ten) + '</b><span>' + HM.esc(v.mo) + '</span></div>' +
              (v.di ? '<div class="r"><a class="btn sm" href="#' + v.di + '">' + HM.esc(t('di')) + '</a></div>' : '') +
              '</div>';
          }).join('') + '</div>'
        : HM.trong({ tieuDe: t('xong'), moTa: t('xongMo'), icon: 'check' })
    });

    /* ---- phần chia, gọn: ba dòng nhiều tiền nhất ---- */
    var rows = (pc.rows || []).slice(0, 3);
    html += HM.the({
      h2: HM.esc(t('phan')), p: HM.esc(t('phanMo')), thoBody: true,
      hanhDong: pc.tracks > 3 ? '<a class="btn sm" href="#k-phan-chia">' + HM.esc(t('xemHet')) + '</a>' : '',
      than: rows.length
        ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cBai')) + '</th><th>' + HM.esc(t('cChu')) + '</th>' +
          '<th>' + HM.esc(t('cVai')) + '</th><th class="num">' + HM.esc(t('cPhan')) + '</th>' +
          '<th class="num">' + HM.esc(t('cDaNhan')) + '</th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr><td>' + HM.tenBia({ bia: r.trackId, ten: HM.dai(r.title, 34), phu: r.artist + ' · ' + r.isrc }) + '</td>' +
              '<td>' + HM.esc(HM.dai(r.chu, 22)) + '</td>' +
              '<td>' + HM.esc(c.song(r, 'vaiLabel')) + '</td>' +
              '<td class="num"><b>' + HM.esc(HT.fmt.n(r.pct)) + '%</b></td>' +
              '<td class="num band"><b>' + HM.esc(HT.fmt.usd(r.daTra)) + '</b></td></tr>';
          }).join('') + '</tbody></table></div>'
        : HM.trong({ tieuDe: t('trong'), moTa: t('trongMo'), icon: 'swap' })
    });

    /* ---- tiền vào ví theo kỳ ---- */
    var ky = w.credits || [];
    html += HM.the({
      h2: HM.esc(t('theoKy')), p: HM.esc(t('theoKyMo')), thoBody: true,
      than: ky.length
        ? '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cKy')) + '</th>' +
          '<th class="num">' + HM.esc(t('cGhi')) + '</th><th>' + HM.esc(t('cLuc')) + '</th></tr></thead><tbody>' +
          ky.slice().reverse().map(function (x) {
            return '<tr><td><b>' + HM.esc(x.label) + '</b></td>' +
              '<td class="num band"><b>' + HM.esc(HT.fmt.usd(x.credit)) + '</b></td>' +
              '<td class="mono">' + HM.esc(HT.fmt.luc(x.approvedAt)) + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : HM.trong({ tieuDe: t('trongKy'), moTa: t('trongKyMo'), icon: 'cash' })
    });

    html += HM.the({ h2: HM.esc(t('hieu')), than: '<p class="say">' + HM.esc(t('hieuMo')) + '</p>' });
    root.innerHTML = html;
  }
});

})();
