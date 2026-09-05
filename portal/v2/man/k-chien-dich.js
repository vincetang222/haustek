/* =====================================================================
   CỔNG ĐỐI TÁC · CHIẾN DỊCH
   ---------------------------------------------------------------------
   Ba loại chiến dịch quảng bá (tham chiếu ONErpm Amplifier, DistroKid
   HyperFollow, TuneCore Accelerator): liên kết thông minh có pre-save,
   pitch playlist biên tập, quảng cáo trả phí. Mỗi dòng là một phễu:
   xem → bấm → lưu trước; gửi → nhận; ngân sách → hiển thị → bấm → lượt
   nghe quy được. Muốn chạy chiến dịch mới thì gửi yêu cầu marketing.
   ===================================================================== */
"use strict";
(function () {

var LOC = { loai: 'all', tt: 'all', trang: 0 };
var NHO = { key: null, d: null };
function lay(c) {
  var me = c.phien.me, key = me.role + ':' + me.partyId;
  if (NHO.key !== key) { NHO.d = c.api.campaigns(me.role, me.partyId); NHO.key = key; }
  return NHO.d;
}

HT.dangKy({
  id: 'k-chien-dich', nav: 'navChienDich', nhom: 'nhomBai', icon: 'up',
  dem: function (c) { try { return lay(c).counts.running || null; } catch (e) { return null; } },

  chu: {
    vi: {
      navChienDich: 'Chiến dịch', h1: 'Chiến dịch quảng bá',
      mo: 'Liên kết thông minh có pre-save, pitch playlist biên tập và quảng cáo trả phí cho bài của bạn. Mỗi dòng là một phễu kết quả.',
      kDang: 'Đang chạy', kDangS: '{a} sắp chạy · {b} đã xong', kLuu: 'Lưu trước (pre-save)', kLuuS: 'từ liên kết thông minh', kPitch: 'Playlist nhận', kPitchS: 'trong {n} lượt pitch', kChi: 'Đã chi quảng cáo', kChiS: '{n} lượt nghe quy được', kGia: 'Giá mỗi lượt nghe', kGiaS: 'bình quân quảng cáo',
      loaiAll: 'Mọi loại', loaiSl: 'Liên kết thông minh', loaiPitch: 'Pitch playlist', loaiAds: 'Quảng cáo', ttAll: 'Mọi trạng thái', ttRunning: 'Đang chạy', ttPlanned: 'Sắp chạy', ttDone: 'Đã xong',
      yeuCau: 'Yêu cầu chiến dịch mới', trong: 'Chưa có chiến dịch nào', trongMo: 'Gửi yêu cầu marketing để đội Haustek dựng liên kết thông minh, pitch playlist hoặc chạy quảng cáo.', khong: 'Không có chiến dịch khớp bộ lọc', khongMo: 'Đổi bộ lọc phía trên.',
      chiTiet: 'Chiến dịch', dong: 'Đóng'
    },
    en: {
      navChienDich: 'Campaigns', h1: 'Promotion campaigns',
      mo: 'Smart links with pre-save, editorial playlist pitching and paid ads for your tracks. Each row is a results funnel.',
      kDang: 'Running', kDangS: '{a} planned · {b} done', kLuu: 'Pre-saves', kLuuS: 'from smart links', kPitch: 'Playlists accepted', kPitchS: 'of {n} pitches', kChi: 'Ad spend', kChiS: '{n} attributed streams', kGia: 'Cost per stream', kGiaS: 'average across ads',
      loaiAll: 'Any kind', loaiSl: 'Smart links', loaiPitch: 'Playlist pitching', loaiAds: 'Paid ads', ttAll: 'Any status', ttRunning: 'Running', ttPlanned: 'Planned', ttDone: 'Done',
      yeuCau: 'Request a campaign', trong: 'No campaigns yet', trongMo: 'Send a marketing request and the Haustek team sets up smart links, pitching or ads.', khong: 'No campaigns match the filters', khongMo: 'Change the filters above.',
      chiTiet: 'Campaign', dong: 'Close'
    }
  },

  ve: function (root, c) {
    var t = c.t, d;
    try { d = lay(c); } catch (e) { root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) }) + HM.the({ than: '<p class="say">' + HM.esc(e.message) + '</p>' }); return; }
    var k = d.counts;
    var rows = d.rows.filter(function (r) { return (LOC.loai === 'all' || r.kind === LOC.loai) && (LOC.tt === 'all' || r.status === LOC.tt); });
    var pt = HTM.phanTrang(rows, LOC);
    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')), nut: '<button type="button" class="btn pri" data-yc>' + HM.icon('up') + HM.esc(t('yeuCau')) + '</button>' });
    html += HM.so([
      { l: t('kDang'), v: HT.fmt.n(k.running), lon: true, s: t('kDangS').replace('{a}', k.planned).replace('{b}', k.done) },
      { l: t('kLuu'), v: HT.fmt.n(k.presaves), s: t('kLuuS') },
      { l: t('kPitch'), v: HT.fmt.n(k.accepted), s: t('kPitchS').replace('{n}', k.pitched) },
      { l: t('kChi'), v: HT.fmt.usd0(k.spent), s: t('kChiS').replace('{n}', HT.fmt.n(k.streamsFromAds)) },
      { l: t('kGia'), v: k.streamsFromAds ? HT.fmt.usd(k.spent / k.streamsFromAds) : '—', s: t('kGiaS') }
    ]);
    html += '<div class="bar">' +
      [['all', t('loaiAll')], ['smartlink', t('loaiSl')], ['pitch', t('loaiPitch')], ['ads', t('loaiAds')]].map(function (x) { return '<button type="button" class="pill' + (LOC.loai === x[0] ? ' on' : '') + '" data-loai="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
      '<span class="muted">·</span>' +
      [['all', t('ttAll')], ['running', t('ttRunning')], ['planned', t('ttPlanned')], ['done', t('ttDone')]].map(function (x) { return '<button type="button" class="pill' + (LOC.tt === x[0] ? ' on' : '') + '" data-tt="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
      '</div>';
    html += HM.the({
      thoBody: true,
      than: !d.rows.length ? HM.trong({ icon: 'up', tieuDe: t('trong'), moTa: t('trongMo') })
        : !rows.length ? HM.trong({ icon: 'empty', tieuDe: t('khong'), moTa: t('khongMo') })
        : HTM.bangChienDich(pt.page, { tien: HT.fmt.usd }) + pt.chan,
      chan: HM.esc(c.song(d, 'note'))
    });
    root.innerHTML = html;
    HTM.ganTrang(root, LOC, c.veLai);
    HM.bam(root, '[data-loai]', function (el) { LOC.loai = el.getAttribute('data-loai'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tt]', function (el) { LOC.tt = el.getAttribute('data-tt'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-yc]', function () { if (HT.moTicket) HT.moTicket(c, { type: 'marketing' }); else c.di('k-ho-tro'); });
    HM.bam(root, 'tr[data-cd]', function (el) {
      var id = el.getAttribute('data-cd'), r = d.rows.filter(function (x) { return x.id === id; })[0]; if (!r) return;
      c.nganTruot('<div class="asset-h">' + HM.bia(r.trackId, r.title, 'xl') + '<div class="asset-t"><b>' + HM.esc(r.title) + '</b><span>' + HM.esc(r.artist + ' · ' + r.id) + '</span></div></div>' + HTM.theChienDich(r, HT.fmt.usd),
        { tieuDe: t('chiTiet'), phu: c.song(r, 'kindLabel'), khiMo: function (dr) { HB.gan(dr); } });
    });
  }
});

})();
