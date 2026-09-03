/* =====================================================================
   NỘI BỘ · PHÁT HÀNH
   ---------------------------------------------------------------------
   Hàng chờ hồ sơ phát hành do đối tác gửi lên (từ form metadata ở trang
   chủ, hoặc từ trang Phát hành của cổng đối tác). Vận hành đi qua bốn
   bước: tiếp nhận → cấp mã ISRC/UPC → đánh dấu đã phát hành; hoặc trả
   lại để bổ sung. Mỗi bước để lại một dòng lịch sử trên hồ sơ và một dòng
   nhật ký thao tác.
   ===================================================================== */
"use strict";
(function () {

var LOC = { loc: 'dang', tim: '' };
var NHAN = {
  vi: { submitted: 'Đã gửi', received: 'Đã tiếp nhận', coded: 'Đã cấp mã', released: 'Đã phát hành', returned: 'Trả lại bổ sung' },
  en: { submitted: 'Submitted', received: 'Received', coded: 'Codes assigned', released: 'Released', returned: 'Returned' }
};
var KIEU = { submitted: 'info', received: 'link', coded: 'warn', released: 'ok', returned: 'no' };
var LOAI = { vi: { single: 'Single', ep: 'EP', album: 'Album' }, en: { single: 'Single', ep: 'EP', album: 'Album' } };

HT.dangKy({
  id: 'phat-hanh', nav: 'navPhatHanh', nhom: 'nhomVanHanh', icon: 'file',

  chu: {
    vi: {
      navPhatHanh: 'Phát hành', h1: 'Hồ sơ phát hành',
      mo: 'Hồ sơ đối tác gửi lên để phát hành bản ghi mới: tiếp nhận, cấp mã ISRC/UPC, phân phối lên nền tảng. Bản ghi chỉ khớp được doanh thu khi đã có ISRC trong danh mục.',
      choTiep: 'Chờ tiếp nhận', choMa: 'Chờ cấp mã', choPh: 'Chờ phát hành', daPh: 'Đã phát hành', traLai: 'Trả lại bổ sung',
      locDang: 'Đang xử lý', locHet: 'Tất cả',
      tim: 'Tìm mã hồ sơ, tên bản phát hành, nghệ sĩ…',
      cMa: 'Mã hồ sơ', cTen: 'Bản phát hành', cLoai: 'Loại', cNgay: 'Ngày mong muốn', cGui: 'Người gửi', cTt: 'Trạng thái', cCapNhat: 'Cập nhật',
      khong: 'Không có hồ sơ nào', khongMo: 'Đổi bộ lọc, hoặc chờ đối tác gửi hồ sơ mới.',
      tiepNhan: 'Tiếp nhận hồ sơ', capMa: 'Cấp mã ISRC/UPC', danhDau: 'Đánh dấu đã phát hành', traLaiNut: 'Trả lại để bổ sung',
      hoiTra: 'Cần đối tác bổ sung gì?', hoiTraMo: 'Ghi rõ từng thứ còn thiếu. Đối tác nhìn thấy nguyên văn ghi chú này trên cổng của họ.',
      hoiPh: 'Ngày phát hành thực tế', hoiPhMo: 'Ngày bản ghi lên các nền tảng. Mặc định là ngày đối tác mong muốn.',
      hoiMa: 'Cấp mã cho hồ sơ này?', hoiMaMo: 'Track chưa có ISRC sẽ được cấp mã VN-HTK; bản phát hành chưa có UPC sẽ được cấp UPC. Mã đã cấp không thể thay đổi.',
      hoiTiep: 'Tiếp nhận hồ sơ này?', hoiTiepMo: 'Tiếp nhận nghĩa là hồ sơ đã được kiểm tra và đủ thông tin để xử lý tiếp. Đối tác sẽ thấy trạng thái thay đổi ngay.',
      lichSu: 'Lịch sử hồ sơ', track: 'Danh sách track', sangTac: 'Sáng tác', producer: 'Producer',
      chuaCoMa: 'chưa có mã', quyTrinh: 'Sau khi phát hành',
      quyTrinhMo: 'Bản ghi có ISRC trong danh mục thì doanh thu báo cáo về sẽ tự khớp theo mã. Bản ghi đã phát hành mà không có mã trong danh mục chắc chắn sẽ rơi vào danh sách chờ khớp ISRC.',
      guiBoi: 'Người gửi', ngayGui: 'Thời điểm gửi', ngayMong: 'Ngày phát hành mong muốn', ngayThuc: 'Ngày phát hành thực tế',
      theLoai: 'Thể loại', ngonNgu: 'Ngôn ngữ lời', anhBia: 'Ảnh bìa', ghiChu: 'Ghi chú của đối tác',
      daTiepNhan: 'Đã tiếp nhận hồ sơ', daCapMa: 'Đã cấp mã', daPhatHanh: 'Đã đánh dấu phát hành', daTraLai: 'Đã trả lại hồ sơ',
      xuat: 'Xuất CSV'
    },
    en: {
      navPhatHanh: 'Releases', h1: 'Release submissions',
      mo: 'Submissions from partners for new releases: receive, assign ISRC/UPC, deliver to platforms. A recording only matches revenue once its ISRC is in the catalogue.',
      choTiep: 'Awaiting receipt', choMa: 'Awaiting codes', choPh: 'Awaiting release', daPh: 'Released', traLai: 'Returned',
      locDang: 'In progress', locHet: 'All',
      tim: 'Search submission ID, title, artist…',
      cMa: 'Submission', cTen: 'Release', cLoai: 'Type', cNgay: 'Requested date', cGui: 'Submitted by', cTt: 'Status', cCapNhat: 'Updated',
      khong: 'No submissions', khongMo: 'Change the filter, or wait for partners to submit.',
      tiepNhan: 'Receive', capMa: 'Assign ISRC/UPC', danhDau: 'Mark as released', traLaiNut: 'Return for fixes',
      hoiTra: 'What does the partner need to add?', hoiTraMo: 'List each missing item. The partner sees this note verbatim on their portal.',
      hoiPh: 'Actual release date', hoiPhMo: 'The date the recording went live on platforms. Defaults to the requested date.',
      hoiMa: 'Assign codes to this submission?', hoiMaMo: 'Tracks without an ISRC receive a VN-HTK code; a release without a UPC receives one. Assigned codes cannot change.',
      hoiTiep: 'Receive this submission?', hoiTiepMo: 'Receiving means the submission has been checked and is complete enough to proceed. The partner sees the status change immediately.',
      lichSu: 'Submission history', track: 'Tracks', sangTac: 'Writers', producer: 'Producer',
      chuaCoMa: 'no code yet', quyTrinh: 'After release',
      quyTrinhMo: 'A recording whose ISRC is in the catalogue matches incoming revenue automatically. A release without a code in the catalogue is guaranteed to land in the ISRC matching queue.',
      guiBoi: 'Submitted by', ngayGui: 'Submitted at', ngayMong: 'Requested release date', ngayThuc: 'Actual release date',
      theLoai: 'Genre', ngonNgu: 'Lyric language', anhBia: 'Artwork', ghiChu: 'Partner’s note',
      daTiepNhan: 'Submission received', daCapMa: 'Codes assigned', daPhatHanh: 'Marked as released', daTraLai: 'Submission returned',
      xuat: 'Export CSV'
    }
  },

  dem: function (c) {
    var n = c.A.releases.counts().submitted;
    return n ? '!' + n : '';
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var dem = A.releases.counts();
    var tatCa = A.releases.list();
    var q = LOC.tim.trim().toLowerCase();
    var rows = tatCa.filter(function (r) {
      if (LOC.loc === 'dang' && (r.status === 'released' || r.status === 'returned')) return false;
      if (LOC.loc !== 'dang' && LOC.loc !== 'het' && r.status !== LOC.loc) return false;
      if (q && (r.id + ' ' + r.title + ' ' + r.artistName).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += HM.so([
      { l: t('choTiep'), v: HT.fmt.n(dem.submitted), lon: true, mau: dem.submitted ? HB.mau('warn') : '' },
      { l: t('choMa'), v: HT.fmt.n(dem.received) },
      { l: t('choPh'), v: HT.fmt.n(dem.coded) },
      { l: t('daPh'), v: HT.fmt.n(dem.released) },
      { l: t('traLai'), v: HT.fmt.n(dem.returned), mau: dem.returned ? HB.mau('danger') : '' }
    ]);

    var boLoc = [['dang', t('locDang'), tatCa.filter(function (r) { return r.status !== 'released' && r.status !== 'returned'; }).length]]
      .concat(['submitted', 'received', 'coded', 'released', 'returned'].map(function (k) { return [k, NHAN[c.lang][k], dem[k]]; }))
      .concat([['het', t('locHet'), tatCa.length]]);
    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim value="' + HM.esc(LOC.tim) + '" placeholder="' + HM.esc(t('tim')) + '"></div>' +
      boLoc.map(function (b) {
        return '<button type="button" class="pill' + (LOC.loc === b[0] ? ' on' : '') + '" data-loc="' + b[0] + '">' + HM.esc(b[1]) + ' <span class="muted">' + b[2] + '</span></button>';
      }).join('') +
      '<div class="sp"></div><button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button></div>';

    html += HM.the({
      thoBody: true,
      than: rows.length ? '<div class="tw"><table class="t"><thead><tr>' +
        '<th>' + HM.esc(t('cMa')) + '</th><th>' + HM.esc(t('cTen')) + '</th><th>' + HM.esc(t('cLoai')) + '</th>' +
        '<th>' + HM.esc(t('cNgay')) + '</th><th>' + HM.esc(t('cGui')) + '</th><th>' + HM.esc(t('cTt')) + '</th><th>' + HM.esc(t('cCapNhat')) + '</th>' +
        '</tr></thead><tbody>' + rows.map(function (r) {
          return '<tr class="pick" data-hs="' + HM.esc(r.id) + '">' +
            '<td class="mono">' + HM.esc(r.id) + '</td>' +
            '<td><div class="t-ttl">' + HM.esc(r.title) + (r.version ? ' <span class="muted">(' + HM.esc(r.version) + ')</span>' : '') + '</div>' +
            '<div class="t-sub">' + HM.esc(r.artistName) + (r.labelId >= 0 ? ' · ' + HM.esc(A.partyName('L:' + r.labelId)) : '') + '</div></td>' +
            '<td>' + HM.esc(LOAI[c.lang][r.type] || r.type) + ' <span class="muted">· ' + r.tracks.length + ' track</span></td>' +
            '<td class="mono">' + HM.esc(HT.fmt.ngay(r.releaseDate)) + '</td>' +
            '<td class="mono">' + HM.esc(r.submittedBy) + '</td>' +
            '<td>' + HM.tag(NHAN[c.lang][r.status], KIEU[r.status]) + '</td>' +
            '<td class="mono muted">' + HM.esc(HT.fmt.luc(r.updatedAt)) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : HM.trong({ icon: 'file', tieuDe: t('khong'), moTa: t('khongMo') })
    });

    html += HM.the({ h2: HM.esc(t('quyTrinh')), than: '<p class="say">' + HM.esc(t('quyTrinhMo')) + '</p>' });

    root.innerHTML = html;
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-loc]', function (el) { LOC.loc = el.getAttribute('data-loc'); c.veLai(); });
    HM.bam(root, '[data-hs]', function (el) { moHoSo(c, el.getAttribute('data-hs')); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('ho-so-phat-hanh.csv', [t('cMa'), t('cTen'), c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist', t('cLoai'), 'Track', t('cNgay'), t('cGui'), t('cTt'), t('cCapNhat')],
        rows.map(function (r) { return [r.id, r.title, r.artistName, r.type, r.tracks.length, r.releaseDate, r.submittedBy, NHAN[c.lang][r.status], r.updatedAt]; }));
    });
  }
});

function moHoSo(c, id) {
  var A = c.A, t = c.t, r = A.releases.get(id);
  if (!r) return;
  var nut = '';
  if (r.status === 'submitted') nut = '<button type="button" class="btn pri" data-tiep>' + HM.esc(t('tiepNhan')) + '</button>' +
    '<button type="button" class="btn dang" data-tra>' + HM.esc(t('traLaiNut')) + '</button>';
  else if (r.status === 'received') nut = '<button type="button" class="btn pri" data-ma>' + HM.esc(t('capMa')) + '</button>' +
    '<button type="button" class="btn dang" data-tra>' + HM.esc(t('traLaiNut')) + '</button>';
  else if (r.status === 'coded') nut = '<button type="button" class="btn go" data-ph>' + HM.esc(t('danhDau')) + '</button>';

  c.nganTruot(
    '<div class="btnrow" style="margin-bottom:14px">' + HM.tag(NHAN[c.lang][r.status], KIEU[r.status]) + nut + '</div>' +
    HM.kv([
      { t: t('guiBoi'), v: r.submittedBy + (r.submittedRole === 'label' ? (c.lang === 'vi' ? ' (label gửi thay nghệ sĩ)' : ' (label on behalf of the artist)') : '') },
      { t: t('ngayGui'), v: HT.fmt.luc(r.createdAt) },
      { t: t('ngayMong'), v: HT.fmt.ngay(r.releaseDate) },
      r.releasedAt ? { t: t('ngayThuc'), v: HT.fmt.ngay(r.releasedAt), manh: true } : null,
      { t: 'UPC', v: r.upc || t('chuaCoMa') },
      { t: t('theLoai'), v: r.genre || '—' },
      { t: t('ngonNgu'), v: r.lang || '—' },
      r.artwork ? { t: t('anhBia'), v: r.artwork } : null,
      r.note ? { t: t('ghiChu'), v: r.note } : null
    ]) +
    '<h4 class="sec">' + HM.esc(t('track')) + ' (' + r.tracks.length + ')</h4>' +
    '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>#</th><th>Track</th><th>ISRC</th><th>' + HM.esc(t('producer')) + '</th><th>' + HM.esc(t('sangTac')) + '</th></tr></thead><tbody>' +
    r.tracks.map(function (tr) {
      return '<tr><td class="mono">' + tr.pos + '</td>' +
        '<td><div class="t-ttl">' + HM.esc(tr.title) + (tr.version ? ' (' + HM.esc(tr.version) + ')' : '') + '</div>' +
        '<div class="t-sub">' + HM.esc(tr.artist) + (tr.feat ? ' feat. ' + HM.esc(tr.feat) : '') + '</div></td>' +
        '<td class="mono">' + (tr.isrc ? HM.esc(tr.isrc) : '<span class="nil">' + HM.esc(t('chuaCoMa')) + '</span>') + '</td>' +
        '<td>' + (tr.producer ? HM.esc(tr.producer) : '<span class="nil">—</span>') + '</td>' +
        '<td style="font-size:12px">' + (tr.writers.length ? tr.writers.map(function (w) { return HM.esc(w.name) + ' <span class="muted">' + HM.esc(w.role) + ' · ' + w.pct + '%</span>'; }).join('<br>') : '<span class="nil">—</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<h4 class="sec">' + HM.esc(t('lichSu')) + '</h4>' +
    '<div class="steps">' + r.history.map(function (h, i) {
      var cuoi = i === r.history.length - 1;
      return '<div class="s ' + (h.status === 'returned' ? 'no' : cuoi ? 'now' : 'ok') + '"><b>' + HM.esc(NHAN[c.lang][h.status]) + '</b>' +
        (h.note ? '<span>' + HM.esc(h.note) + '</span>' : '') + '<div class="tm">' + HM.esc(HT.fmt.luc(h.at) + ' · ' + h.by) + '</div></div>';
    }).join('') + '</div>',
    { tieuDe: r.title, phu: r.id + ' · ' + r.artistName, khiMo: function (dr) {
      HM.bam(dr, '[data-tiep]', function () {
        c.xacNhan(t('hoiTiep'), HM.esc(t('hoiTiepMo')), t('tiepNhan')).then(function (ok) {
          if (!ok) return;
          try { A.releases.receive(r.id, 'ops@haustek-group.com'); c.thongBao(t('daTiepNhan') + ' · ' + r.id, 'ok'); c.dongNgan(); c.veLai(); }
          catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
      HM.bam(dr, '[data-ma]', function () {
        c.xacNhan(t('hoiMa'), HM.esc(t('hoiMaMo')), t('capMa')).then(function (ok) {
          if (!ok) return;
          try { A.releases.assignCodes(r.id, 'ops@haustek-group.com'); c.thongBao(t('daCapMa') + ' · ' + r.id, 'ok'); c.dongNgan(); c.veLai(); }
          catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
      HM.bam(dr, '[data-ph]', function () {
        c.hoiThoai({
          tieuDe: t('danhDau'), moTa: HM.esc(t('hoiPhMo')),
          than: '<label class="fld">' + HM.esc(t('hoiPh')) + '</label><input class="in" data-o="ngay" type="date" value="' + HM.esc(r.releaseDate) + '">',
          dong: t('danhDau')
        }).then(function (f) {
          if (!f) return;
          try { A.releases.publish(r.id, 'ops@haustek-group.com', f.ngay || r.releaseDate); c.thongBao(t('daPhatHanh') + ' · ' + r.id, 'ok'); c.dongNgan(); c.veLai(); }
          catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
      HM.bam(dr, '[data-tra]', function () {
        c.hoiThoai({
          tieuDe: t('traLaiNut'), moTa: HM.esc(t('hoiTraMo')),
          than: '<label class="fld">' + HM.esc(t('hoiTra')) + '</label><textarea class="in" data-o="ghi" rows="3"></textarea>',
          dong: t('traLaiNut'), nguyHiem: true
        }).then(function (f) {
          if (!f) return;
          try { A.releases.returnFix(r.id, 'ops@haustek-group.com', (f.ghi || '').trim()); c.thongBao(t('daTraLai') + ' · ' + r.id, 'ok'); c.dongNgan(); c.veLai(); }
          catch (e) { c.thongBao(e.message, 'no'); }
        });
      });
    } });
}

})();
