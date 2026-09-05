/* =====================================================================
   NỘI BỘ · CHIẾN DỊCH QUẢNG BÁ
   ---------------------------------------------------------------------
   Mọi chiến dịch của mọi tài khoản: liên kết thông minh, pitch playlist,
   quảng cáo trả phí — ai đang chạy, tốn bao nhiêu, mang về bao nhiêu lượt
   nghe. Đội marketing dùng để xem hiệu quả theo kênh; kinh doanh dùng để
   biết tài khoản nào đang được đầu tư.
   ===================================================================== */
"use strict";
(function () {

var LOC = { loai: 'all', tt: 'all', tim: '', trang: 0 };

HT.dangKy({
  id: 'chien-dich', nav: 'navChienDich', nhom: 'nhomDoiTac', icon: 'up',
  vai: ['ops', 'sales', 'support', 'mgmt', 'accounting'],

  chu: {
    vi: {
      navChienDich: 'Chiến dịch', h1: 'Chiến dịch quảng bá',
      mo: 'Liên kết thông minh, pitch playlist và quảng cáo trả phí của mọi tài khoản. Mỗi dòng là một phễu kết quả; bấm để xem chi tiết.',
      kDang: 'Đang chạy', kDangS: '{a} sắp chạy · {b} đã xong', kLuu: 'Lưu trước', kPitch: 'Playlist nhận', kPitchS: 'trong {n} lượt pitch', kChi: 'Đã chi quảng cáo', kChiS: '{n} lượt nghe quy được', kGia: 'Giá mỗi lượt nghe',
      loaiAll: 'Mọi loại', loaiSl: 'Liên kết thông minh', loaiPitch: 'Pitch playlist', loaiAds: 'Quảng cáo', ttAll: 'Mọi trạng thái', ttRunning: 'Đang chạy', ttPlanned: 'Sắp chạy', ttDone: 'Đã xong', tim: 'Tìm bài, tài khoản…',
      khong: 'Không có chiến dịch khớp bộ lọc', khongMo: 'Đổi bộ lọc phía trên.', chiTiet: 'Chiến dịch', dong: 'Đóng'
    },
    en: {
      navChienDich: 'Campaigns', h1: 'Promotion campaigns',
      mo: 'Smart links, playlist pitching and paid ads across all accounts. Each row is a results funnel; click for detail.',
      kDang: 'Running', kDangS: '{a} planned · {b} done', kLuu: 'Pre-saves', kPitch: 'Playlists accepted', kPitchS: 'of {n} pitches', kChi: 'Ad spend', kChiS: '{n} attributed streams', kGia: 'Cost per stream',
      loaiAll: 'Any kind', loaiSl: 'Smart links', loaiPitch: 'Playlist pitching', loaiAds: 'Paid ads', ttAll: 'Any status', ttRunning: 'Running', ttPlanned: 'Planned', ttDone: 'Done', tim: 'Search track, account…',
      khong: 'No campaigns match the filters', khongMo: 'Change the filters above.', chiTiet: 'Campaign', dong: 'Close'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var d = HM.nho(A, 'chien-dich', function () { return A.campaigns(); });
    var k = d.counts, qq = LOC.tim.trim().toLowerCase();
    var rows = d.rows.filter(function (r) {
      if (LOC.loai !== 'all' && r.kind !== LOC.loai) return false;
      if (LOC.tt !== 'all' && r.status !== LOC.tt) return false;
      if (qq && (r.title + ' ' + r.artist + ' ' + A.partyName(r.partyKey)).toLowerCase().indexOf(qq) < 0) return false;
      return true;
    });
    var pt = HTM.phanTrang(rows, LOC);
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('kDang'), v: HT.fmt.n(k.running), lon: true, s: t('kDangS').replace('{a}', k.planned).replace('{b}', k.done) },
      { l: t('kLuu'), v: HT.fmt.n(k.presaves) },
      { l: t('kPitch'), v: HT.fmt.n(k.accepted), s: t('kPitchS').replace('{n}', k.pitched) },
      { l: t('kChi'), v: c.tien2(k.spent), s: t('kChiS').replace('{n}', HT.fmt.n(k.streamsFromAds)) },
      { l: t('kGia'), v: k.streamsFromAds ? c.tien2(k.spent / k.streamsFromAds) : '—' }
    ]);
    html += '<div class="bar">' +
      [['all', t('loaiAll')], ['smartlink', t('loaiSl')], ['pitch', t('loaiPitch')], ['ads', t('loaiAds')]].map(function (x) { return '<button type="button" class="pill' + (LOC.loai === x[0] ? ' on' : '') + '" data-loai="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
      '<span class="muted">·</span>' +
      [['all', t('ttAll')], ['running', t('ttRunning')], ['planned', t('ttPlanned')], ['done', t('ttDone')]].map(function (x) { return '<button type="button" class="pill' + (LOC.tt === x[0] ? ' on' : '') + '" data-tt="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
      '<div class="sp"></div><div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div></div>';
    html += HM.the({ thoBody: true,
      than: !rows.length ? HM.trong({ icon: 'empty', tieuDe: t('khong'), moTa: t('khongMo') }) : HTM.bangChienDich(pt.page, { noiBo: true, tenTk: function (pk) { return A.partyName(pk); }, tien: c.tien2 }) + pt.chan,
      chan: HM.esc(c.song(d, 'note')) });
    root.innerHTML = html;
    HTM.ganTrang(root, LOC, c.veLai);
    HM.bam(root, '[data-loai]', function (el) { LOC.loai = el.getAttribute('data-loai'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tt]', function (el) { LOC.tt = el.getAttribute('data-tt'); LOC.trang = 0; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); var i = root.querySelector('[data-tim]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
    HM.bam(root, 'tr[data-cd]', function (el) {
      var id = el.getAttribute('data-cd'), r = d.rows.filter(function (x) { return x.id === id; })[0]; if (!r) return;
      c.nganTruot('<div class="asset-h">' + HM.bia(r.trackId, r.title, 'xl') + '<div class="asset-t"><b>' + HM.esc(r.title) + '</b><span>' + HM.esc(r.artist + ' · ' + A.partyName(r.partyKey) + ' · ' + r.id) + '</span></div></div>' + HTM.theChienDich(r, c.tien2),
        { tieuDe: t('chiTiet'), phu: c.song(r, 'kindLabel'), khiMo: function (dr) { HB.gan(dr); } });
    });
  }
});

})();
