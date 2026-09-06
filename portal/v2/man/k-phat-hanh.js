/* =====================================================================
   CỔNG ĐỐI TÁC · PHÁT HÀNH
   ---------------------------------------------------------------------
   Nối cổng với luồng metadata ở trang chủ: đối tác thấy bản phát hành đã
   có trong danh mục, hồ sơ đã gửi đang ở bước nào, và gửi hồ sơ mới ngay
   trong cổng bằng đúng các trường bắt buộc của biểu mẫu metadata.
   Label gửi thay được cho nghệ sĩ trong roster; nghệ sĩ chỉ gửi cho mình.
   ===================================================================== */
"use strict";
(function () {

var NHAN = {
  vi: { submitted: 'Đã gửi', received: 'Đã tiếp nhận', coded: 'Đã cấp mã', released: 'Đã phát hành', returned: 'Cần bổ sung' },
  en: { submitted: 'Submitted', received: 'Received', coded: 'Codes assigned', released: 'Released', returned: 'Needs fixes' }
};
var KIEU = { submitted: 'info', received: 'link', coded: 'warn', released: 'ok', returned: 'no' };
var THE_LOAI = ['Pop', 'Indie', 'R&B', 'Hip-hop', 'Electronic', 'Alternative', 'Ballad', 'Rock', 'Lo-fi', 'Folk', 'Khác'];
var VAI = { vi: { Composer: 'Sáng tác', Lyricist: 'Viết lời', 'Composer/Lyricist': 'Sáng tác & viết lời', ComposerLyricist: 'Sáng tác & viết lời', Arranger: 'Phối khí' },
            en: { Composer: 'Composer', Lyricist: 'Lyricist', ComposerLyricist: 'Composer & lyricist', 'Composer/Lyricist': 'Composer & lyricist', Arranger: 'Arranger' } };

HT.dangKy({
  id: 'k-phat-hanh', nav: 'navPh', nhom: 'nhomBai', icon: 'file',

  chu: {
    vi: {
      navPh: 'Phát hành', h1: 'Phát hành',
      mo: 'Bản phát hành đã có trong danh mục, hồ sơ đang xử lý, và gửi hồ sơ phát hành mới.',
      dangXuLy: 'Hồ sơ đang xử lý', canBoSung: 'Cần bạn bổ sung', daPh: 'Đã phát hành', trongDm: 'Trong danh mục',
      gui: 'Gửi hồ sơ phát hành', haustekTao: 'Haustek tạo thay bạn', hoSo: 'Hồ sơ đã gửi', hoSoMo: 'Bấm một hồ sơ để xem chi tiết và lịch sử xử lý.',
      danhMuc: 'Bản phát hành trong danh mục', danhMucMo: 'Suy ra từ các bài hát đã gửi tới nền tảng. Bản phát hành có doanh thu ở kỳ đã xét duyệt được đánh dấu.',
      cMa: 'Mã hồ sơ', cTen: 'Bản phát hành', cLoai: 'Loại', cNgay: 'Ngày phát hành mong muốn', cTt: 'Trạng thái', cCapNhat: 'Cập nhật lần cuối',
      cKy: 'Kỳ phát hành', cTrack: 'Track', cDt: 'Doanh thu các kỳ đã xét duyệt', coDt: 'đã có', chuaDt: 'chưa có',
      khongHs: 'Bạn chưa gửi hồ sơ phát hành nào', khongHsMo: 'Hồ sơ đầu tiên mất khoảng 15 phút, có lưu nháp. Haustek tiếp nhận trong 2 ngày làm việc. Hoặc gửi file qua email để Haustek tạo thay bạn.',
      quyTrinh: 'Hồ sơ đi qua những bước nào',
      b1: 'Đã gửi', b1m: 'Hồ sơ đã vào danh sách chờ xử lý của Haustek. Bạn chưa cần làm gì thêm.',
      b2: 'Đã tiếp nhận', b2m: 'Haustek đã kiểm tra đủ thông tin. Nếu thiếu, hồ sơ được trả lại kèm ghi chú cần bổ sung.',
      b3: 'Đã cấp mã', b3m: 'Track được cấp ISRC, bản phát hành được cấp UPC. Đây là các mã dùng để khớp doanh thu về sau.',
      b4: 'Đã phát hành', b4m: 'Đã phát hành trên nền tảng. Doanh thu về từ kỳ kế tiếp, trong trang Bài hát của bạn.',
      lichSu: 'Lịch sử xử lý', track: 'Danh sách track', chuaCoMa: 'chưa có mã',
      ghiChuTra: 'Haustek cần bạn bổ sung',
      formNs: 'Nghệ sĩ chính', formLoai: 'Loại phát hành', formTen: 'Tên bản phát hành', formPb: 'Phiên bản',
      formTl: 'Thể loại chính', formNn: 'Ngôn ngữ lời', formNgay: 'Ngày phát hành mong muốn', formUpc: 'UPC (nếu đã có)',
      formBia: 'Đường dẫn ảnh bìa', formGhi: 'Ghi chú cho bộ phận phát hành', formTracks: 'Danh sách track',
      themTrack: 'Thêm track', xoaTrack: 'Xoá track', trTen: 'Tên track', trFeat: 'Nghệ sĩ khách mời (feat.)', trIsrc: 'ISRC (nếu đã có)',
      trProducer: 'Producer', trSangTac: 'Người sáng tác và tỷ lệ', themNguoi: 'Thêm người sáng tác', tenThat: 'Họ tên theo giấy tờ', vaiTro: 'Vai trò', tiLe: 'Tỷ lệ %',
      formMo: 'Sau khi Haustek tiếp nhận, bạn không sửa được nữa. Nếu cần chỉnh, Haustek trả hồ sơ về để bạn bổ sung.',
      daGui: 'Đã gửi hồ sơ', formDay: 'Mở hồ sơ metadata đầy đủ trên trang chủ',
      tongTiLe: 'Tổng tỷ lệ sáng tác phải bằng 100%'
    },
    en: {
      navPh: 'Releases', h1: 'Releases',
      mo: 'Releases already in the catalogue, submissions in progress, and submitting a new release.',
      dangXuLy: 'In progress', canBoSung: 'Needs your input', daPh: 'Released', trongDm: 'In the catalogue',
      gui: 'Submit a release', haustekTao: 'Created by Haustek for you', hoSo: 'Submissions', hoSoMo: 'Open a submission for details and its history.',
      danhMuc: 'Releases in the catalogue', danhMucMo: 'Derived from the tracks delivered to platforms. Releases earning in an approved period are marked.',
      cMa: 'Submission', cTen: 'Release', cLoai: 'Type', cNgay: 'Requested date', cTt: 'Status', cCapNhat: 'Updated',
      cKy: 'Release period', cTrack: 'Tracks', cDt: 'Revenue across approved periods', coDt: 'earning', chuaDt: 'none yet',
      khongHs: 'You have not sent a release yet', khongHsMo: 'The first one takes about 15 minutes and saves as a draft. Haustek takes it in within 2 business days. Or email the files and Haustek creates it for you.',
      quyTrinh: 'The steps a submission goes through',
      b1: 'Submitted', b1m: 'The submission is in Haustek’s queue. Nothing else is needed from you.',
      b2: 'Received', b2m: 'Haustek has checked the submission. If something is missing it is returned with a note.',
      b3: 'Codes assigned', b3m: 'Tracks receive ISRCs and the release a UPC. These codes match revenue later.',
      b4: 'Released', b4m: 'Live on platforms. Revenue arrives from the next period under My tracks.',
      lichSu: 'History', track: 'Tracks', chuaCoMa: 'no code yet',
      ghiChuTra: 'Haustek needs you to add',
      formNs: 'Main artist', formLoai: 'Release type', formTen: 'Release title', formPb: 'Version',
      formTl: 'Main genre', formNn: 'Lyric language', formNgay: 'Requested release date', formUpc: 'UPC (if you have one)',
      formBia: 'Artwork link', formGhi: 'Note for the release team', formTracks: 'Tracks',
      themTrack: 'Add track', xoaTrack: 'Remove', trTen: 'Track title', trFeat: 'Featuring', trIsrc: 'ISRC (if you have one)',
      trProducer: 'Producer', trSangTac: 'Writers and splits', themNguoi: 'Add writer', tenThat: 'Legal name', vaiTro: 'Role', tiLe: 'Share %',
      formMo: 'The short metadata form, required fields only. Cannot be edited after sending; Haustek returns it if needed.',
      daGui: 'Submission sent', formDay: 'Full form on the homepage',
      tongTiLe: 'Writer shares must add up to 100%'
    }
  },

  dem: function (c) {
    try {
      var r = c.api.releases(c.phien.me.role, c.phien.me.partyId);
      var tra = r.submissions.filter(function (x) { return x.status === 'returned'; }).length;
      return tra ? '!' + tra : '';
    } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t;
    var r = api.releases(me.role, me.partyId);
    var hs = r.submissions;
    var dang = hs.filter(function (x) { return x.status !== 'released' && x.status !== 'returned'; }).length;
    var tra = hs.filter(function (x) { return x.status === 'returned'; }).length;
    var daPh = hs.filter(function (x) { return x.status === 'released'; }).length;

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('dangXuLy'), v: HT.fmt.n(dang), lon: true },
      { l: t('canBoSung'), v: HT.fmt.n(tra), mau: tra ? HB.mau('danger') : '' },
      { l: t('daPh'), v: HT.fmt.n(daPh) },
      { l: t('trongDm'), v: HT.fmt.n(r.catalogueTotal) }
    ]);

    html += HM.the({
      h2: HM.esc(t('hoSo')) + ' <span class="muted">(' + hs.length + ')</span>', p: HM.esc(t('hoSoMo')),
      hanhDong: '<button type="button" class="btn pri" data-gui>' + HM.icon('up') + HM.esc(t('gui')) + '</button>',
      thoBody: true,
      than: hs.length ? '<div class="tw"><table class="t"><thead><tr>' +
        '<th>' + HM.esc(t('cMa')) + '</th><th>' + HM.esc(t('cTen')) + '</th><th>' + HM.esc(t('cLoai')) + '</th>' +
        '<th>' + HM.esc(t('cNgay')) + '</th><th>' + HM.esc(t('cTt')) + '</th><th>' + HM.esc(t('cCapNhat')) + '</th></tr></thead><tbody>' +
        hs.map(function (x) {
          return '<tr class="pick" data-hs="' + HM.esc(x.id) + '">' +
            '<td class="mono">' + HM.esc(x.id) + '</td>' +
            '<td>' + HM.tenBia({ bia: x.id, ten: x.title, phu: x.artistName + ' · ' + x.tracks.length + ' track' + (x.submittedRole === 'staff' ? ' · ' + t('haustekTao') : '') }) + '</td>' +
            '<td>' + HM.esc(x.type === 'single' ? 'Single' : x.type === 'ep' ? 'EP' : 'Album') + '</td>' +
            '<td class="mono">' + HM.esc(HT.fmt.ngay(x.releaseDate)) + '</td>' +
            '<td>' + HM.tag(NHAN[c.lang][x.status], KIEU[x.status]) + '</td>' +
            '<td class="mono muted">' + HM.esc(HT.fmt.luc(x.updatedAt)) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : HM.trong({ icon: 'file', tieuDe: t('khongHs'), moTa: t('khongHsMo') })
    });

    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('danhMuc')) + ' <span class="muted">(' + HM.esc(HT.fmt.n(r.catalogueTotal)) + ')</span>', p: HM.esc(t('danhMucMo')),
        thoBody: true,
        than: '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + HM.esc(t('cTen')) + '</th><th>' + HM.esc(t('cLoai')) + '</th>' +
          '<th>' + HM.esc(t('cKy')) + '</th><th class="num">' + HM.esc(t('cTrack')) + '</th><th class="num">' + HM.esc(t('cDt')) + '</th></tr></thead><tbody>' +
          r.catalogue.slice(0, 20).map(function (x) {
            return '<tr><td>' + HM.tenBia({ bia: x.trackId != null ? x.trackId : x.id, ten: HM.dai(x.title, 32), phu: me.role === 'label' ? x.artistName : (x.isrc || '') }) + '</td>' +
              '<td>' + HM.esc(x.type) + '</td><td class="mono">' + HM.esc(x.releasePeriod) + '</td>' +
              '<td class="num">' + x.tracks + '</td><td class="num">' + (x.earning ? HM.esc(HT.fmt.usd0(x.revenue)) : '<span class="nil">' + HM.esc(t('chuaDt')) + '</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
      }) +
      HM.the({
        h2: HM.esc(t('quyTrinh')),
        than: '<div class="steps">' + [['b1', 'ok'], ['b2', 'ok'], ['b3', 'ok'], ['b4', 'ok']].map(function (b) {
          return '<div class="s ' + b[1] + '"><b>' + HM.esc(t(b[0])) + '</b><span>' + HM.esc(t(b[0] + 'm')) + '</span></div>';
        }).join('') + '</div>' +
        '<div class="btnrow" style="margin-top:14px"><a class="btn sm" href="https://haustek-group.com/metadata" target="_blank" rel="noopener">' +
        HM.icon('out') + HM.esc(t('formDay')) + '</a></div>'
      }) + '</div>';

    root.innerHTML = html;
    HM.bam(root, '[data-hs]', function (el) { moHoSo(c, hs.filter(function (x) { return x.id === el.getAttribute('data-hs'); })[0]); });
    HM.bam(root, '[data-gui]', function () { guiHoSo(c); });
  }
});

function moHoSo(c, r) {
  if (!r) return;
  var t = c.t;
  var tra = r.status === 'returned' ? r.history.slice().reverse().filter(function (h) { return h.status === 'returned'; })[0] : null;
  c.nganTruot(
    '<div class="btnrow" style="margin-bottom:14px">' + HM.tag(NHAN[c.lang][r.status], KIEU[r.status]) + '</div>' +
    (tra && tra.note ? HM.ghi({ kieu: 'no', tieuDe: HM.esc(t('ghiChuTra')), than: HM.esc(tra.note) }) : '') +
    (r.kiem ? HHS.bangKiem(r.kiem, { gon: r.status === 'released' }) : '') +
    HM.kv([r.releasedAt ? { t: t('b4'), v: HT.fmt.ngay(r.releasedAt), manh: true } : null].concat(HHS.chiTiet(r, HT.fmt))) +
    '<h4 class="sec">' + HM.esc(t('track')) + ' (' + r.tracks.length + ')</h4>' +
    '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>#</th><th>Track</th><th>ISRC</th><th>' + HM.esc(t('trSangTac')) + '</th></tr></thead><tbody>' +
    r.tracks.map(function (tr) {
      return '<tr><td class="mono">' + tr.pos + '</td><td><div class="t-ttl">' + HM.esc(tr.title) + '</div>' +
        '<div class="t-sub">' + HM.esc([tr.artist, HHS.trackChiTiet(tr), tr.producer].filter(Boolean).join(' · ')) + '</div></td>' +
        '<td class="mono">' + (tr.isrc ? HM.esc(tr.isrc) : '<span class="nil">' + HM.esc(t('chuaCoMa')) + '</span>') + '</td>' +
        '<td style="font-size:12px">' + tr.writers.map(function (w) { return HM.esc(w.name) + ' <span class="muted">' + HM.esc(VAI[c.lang][w.role] || w.role) + ' · ' + w.pct + '%</span>'; }).join('<br>') + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<h4 class="sec">' + HM.esc(t('lichSu')) + '</h4>' +
    '<div class="steps">' + r.history.map(function (h, i) {
      var cuoi = i === r.history.length - 1;
      return '<div class="s ' + (h.status === 'returned' ? 'no' : cuoi ? 'now' : 'ok') + '"><b>' + HM.esc(NHAN[c.lang][h.status]) + '</b>' +
        (h.note ? '<span>' + HM.esc(h.note) + '</span>' : '') + '<div class="tm">' + HM.esc(HT.fmt.luc(h.at)) + '</div></div>';
    }).join('') + '</div>',
    { tieuDe: r.title, phu: r.id });
}

/* ---- gửi hồ sơ mới: form bốn bước dùng chung (haustek-hoso.js) ---- */
function guiHoSo(c) {
  var api = c.api, me = c.phien.me, t = c.t;
  var ns = api.rosterArtists(me.role, me.partyId).rows.map(function (a) { return { id: a.artistId, name: a.name, clientId: a.clientId }; });
  var rl = api.releases(me.role, me.partyId);
  HHS.mo({
    ns: ns, fields: rl.fields, ten: me.name, nhan: me.role === 'label' ? me.name : 'Haustek', khoa: me.role + '-' + me.partyId,
    lienHe: { name: me.role === 'artist' ? me.name : '', email: '' },
    kiem: function (payload) { return api.checkRelease(me.role, me.partyId, payload); },
    gui: function (payload) { return api.submitRelease(me.role, me.partyId, payload); },
    xong: function (kq) { c.thongBao(HHS.T('daGui', { id: kq.id }), 'ok'); c.veLai(); }
  });
}

})();
