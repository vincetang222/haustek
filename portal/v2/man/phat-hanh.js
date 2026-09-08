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

var LOC = { loc: 'dang', tim: '', nv: '', tk: '' };
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
      mo: 'Hồ sơ phát hành mới: tiếp nhận, cấp ISRC/UPC, phân phối. Bản ghi chỉ khớp doanh thu khi đã có ISRC trong danh mục.',
      choTiep: 'Chờ tiếp nhận', choMa: 'Chờ cấp mã', choPh: 'Chờ phát hành', daPh: 'Đã phát hành', traLai: 'Trả lại bổ sung',
      locDang: 'Đang xử lý', locHet: 'Tất cả',
      tim: 'Tìm mã hồ sơ, tên bản phát hành, nghệ sĩ…',
      cMa: 'Mã hồ sơ', cTen: 'Bản phát hành', cLoai: 'Loại', cNgay: 'Ngày mong muốn', cGui: 'Người gửi', cTt: 'Trạng thái', cCapNhat: 'Cập nhật',
      khong: 'Không có hồ sơ nào', khongMo: 'Đổi bộ lọc, hoặc chờ đối tác gửi hồ sơ mới.', moiNv: 'Mọi người phụ trách', timTk: 'Tài khoản (tên label hoặc nghệ sĩ)',
      tiepNhan: 'Tiếp nhận hồ sơ', capMa: 'Cấp mã ISRC/UPC', danhDau: 'Đánh dấu đã phát hành', traLaiNut: 'Trả lại để bổ sung',
      hoiTra: 'Cần đối tác bổ sung gì?', hoiTraMo: 'Ghi rõ từng thứ còn thiếu. Đối tác nhìn thấy nguyên văn ghi chú này trên cổng của họ.',
      hoiPh: 'Ngày phát hành thực tế', hoiPhMo: 'Ngày bản ghi lên các nền tảng. Mặc định là ngày đối tác mong muốn.',
      hoiMa: 'Cấp mã cho hồ sơ này?', hoiMaMo: 'Track chưa có ISRC được cấp mã VN-HTK; bản phát hành chưa có UPC được cấp UPC. Mã đã cấp không đổi.',
      hoiTiep: 'Tiếp nhận hồ sơ này?', hoiTiepMo: 'Tiếp nhận nghĩa là hồ sơ đã kiểm, đủ thông tin để xử lý tiếp. Đối tác thấy trạng thái ngay.',
      lichSu: 'Lịch sử hồ sơ', track: 'Danh sách track', sangTac: 'Sáng tác', producer: 'Producer',
      chuaCoMa: 'chưa có mã', quyTrinh: 'Sau khi phát hành',
      quyTrinhMo: 'Có ISRC trong danh mục thì doanh thu tự khớp theo mã; không có mã thì chắc chắn rơi vào hàng chờ khớp ISRC.',
      tiep: 'Tiếp tục', taoHo: 'Tạo hồ sơ thay đối tác', taoHoMo: 'Đối tác gửi file qua email hoặc gọi điện: nhân viên nhập hồ sơ thay, đối tác thấy trên cổng với nhãn "Haustek tạo thay bạn".',
      fDoiTac: 'Đối tác (tên hoặc mã)', fNs: 'Nghệ sĩ chính', fLoai: 'Loại', fTen: 'Tên bản phát hành', fPb: 'Phiên bản', fTl: 'Thể loại', fNn: 'Ngôn ngữ', fNgay: 'Ngày phát hành', fUpc: 'UPC (nếu có)', fBia: 'Link ảnh bìa', fGhi: 'Ghi chú', fTracks: 'Danh sách track', fTracksMo: 'Mỗi dòng một track: Tên | ISRC (nếu có) | Producer. Sáng tác mặc định 100% cho nghệ sĩ chính.',
      khongThayDt: 'Không tìm thấy đối tác "{q}"', daTaoHo: 'Đã tạo hồ sơ {id} thay {t}', nhanStaff: 'Haustek tạo thay',
      guiBoi: 'Người gửi', ngayGui: 'Thời điểm gửi', ngayMong: 'Ngày phát hành mong muốn', ngayThuc: 'Ngày phát hành thực tế',
      theLoai: 'Thể loại', ngonNgu: 'Ngôn ngữ lời', anhBia: 'Ảnh bìa', ghiChu: 'Ghi chú của đối tác',
      daTiepNhan: 'Đã tiếp nhận hồ sơ', daCapMa: 'Đã cấp mã', daPhatHanh: 'Đã đánh dấu phát hành', daTraLai: 'Đã trả lại hồ sơ',
      xuat: 'Xuất CSV'
    },
    en: {
      navPhatHanh: 'Releases', h1: 'Release submissions',
      mo: 'New release submissions: receive, assign ISRC/UPC, deliver. A recording matches revenue only once its ISRC is in the catalogue.',
      choTiep: 'Awaiting receipt', choMa: 'Awaiting codes', choPh: 'Awaiting release', daPh: 'Released', traLai: 'Returned',
      locDang: 'In progress', locHet: 'All',
      tim: 'Search submission ID, title, artist…',
      cMa: 'Submission', cTen: 'Release', cLoai: 'Type', cNgay: 'Requested date', cGui: 'Submitted by', cTt: 'Status', cCapNhat: 'Updated',
      khong: 'No submissions', khongMo: 'Change the filter, or wait for partners to submit.', moiNv: 'Any account manager', timTk: 'Account (label or artist name)',
      tiepNhan: 'Receive', capMa: 'Assign ISRC/UPC', danhDau: 'Mark as released', traLaiNut: 'Return for fixes',
      hoiTra: 'What does the partner need to add?', hoiTraMo: 'List each missing item. The partner sees this note verbatim on their portal.',
      hoiPh: 'Actual release date', hoiPhMo: 'The date the recording went live on platforms. Defaults to the requested date.',
      hoiMa: 'Assign codes to this submission?', hoiMaMo: 'Tracks without an ISRC get a VN-HTK code; a release without a UPC gets one. Codes cannot change.',
      hoiTiep: 'Receive this submission?', hoiTiepMo: 'Receiving means the submission is checked and complete. The partner sees the status at once.',
      lichSu: 'Submission history', track: 'Tracks', sangTac: 'Writers', producer: 'Producer',
      chuaCoMa: 'no code yet', quyTrinh: 'After release',
      quyTrinhMo: 'With the ISRC in the catalogue revenue matches itself; without it the release lands in the ISRC queue.',
      tiep: 'Continue', taoHo: 'Create for a partner', taoHoMo: 'When a partner sends files by email or phones in, staff enter the release; the partner sees it on the portal labelled "Created by Haustek for you".',
      fDoiTac: 'Partner (name or id)', fNs: 'Main artist', fLoai: 'Type', fTen: 'Release title', fPb: 'Version', fTl: 'Genre', fNn: 'Language', fNgay: 'Release date', fUpc: 'UPC (if any)', fBia: 'Artwork link', fGhi: 'Note', fTracks: 'Track list', fTracksMo: 'One track per line: Title | ISRC (optional) | Producer. Writers default to 100% for the main artist.',
      khongThayDt: 'No partner matching “{q}”', daTaoHo: 'Created {id} for {t}', nhanStaff: 'Created by Haustek',
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
    var q = LOC.tim.trim().toLowerCase(), qTk = LOC.tk.trim().toLowerCase();
    var nvCua = function (r) { var m = A.parties.managerOf(r.labelId >= 0 ? 'L:' + r.labelId : 'A:' + r.artistId); return m ? m.id : ''; };
    var tkCua = function (r) { return (r.artistName + ' ' + (r.labelId >= 0 ? A.partyName('L:' + r.labelId) : '')).toLowerCase(); };
    var rows = tatCa.filter(function (r) {
      if (LOC.nv && nvCua(r) !== LOC.nv) return false;
      if (qTk && tkCua(r).indexOf(qTk) < 0) return false;
      if (LOC.loc === 'dang' && (r.status === 'released' || r.status === 'returned')) return false;
      if (LOC.loc !== 'dang' && LOC.loc !== 'het' && r.status !== LOC.loc) return false;
      if (q && (r.id + ' ' + r.title + ' ' + r.artistName).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')), nut: A.quyen && A.quyen.nhom('phatHanhHo') ? '<button type="button" class="btn pri" data-tao-ho>' + HM.icon('up') + HM.esc(t('taoHo')) + '</button>' : '' });
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
      '<select class="in" data-nv style="width:auto;height:34px"><option value="">' + HM.esc(t('moiNv')) + '</option>' +
        A.staff.byRole('sales').concat(A.staff.byRole('mgmt')).map(function (s) { return '<option value="' + s.id + '"' + (LOC.nv === s.id ? ' selected' : '') + '>' + HM.esc(s.name) + '</option>'; }).join('') + '</select>' +
      '<input class="in" data-tk style="width:200px;height:34px" placeholder="' + HM.esc(t('timTk')) + '" value="' + HM.esc(LOC.tk) + '">' +
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
            '<td>' + HM.tenBia({ bia: r.id, ten: r.title, tenHtml: HM.esc(r.title) + (r.version ? ' <span class="muted">(' + HM.esc(r.version) + ')</span>' : ''), phu: r.artistName + (r.labelId >= 0 ? ' · ' + A.partyName('L:' + r.labelId) : '') }) + '</td>' +
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
    HM.doi(root, '[data-nv]', function (el) { LOC.nv = el.value; c.veLai(); });
    HM.nhap(root, '[data-tk]', function (el) { LOC.tk = el.value; c.veLai(); });
    HM.bam(root, '[data-loc]', function (el) { LOC.loc = el.getAttribute('data-loc'); c.veLai(); });
    HM.bam(root, '[data-hs]', function (el) { moHoSo(c, el.getAttribute('data-hs')); });
    HM.bam(root, '[data-tao-ho]', function () { taoHoSoHo(c, null); });
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
  var coXuLy = !!(A.quyen && A.quyen.nhom('vanHanh'));
  if (!coXuLy) nut = '';
  else if (r.status === 'submitted') nut = '<button type="button" class="btn pri" data-tiep>' + HM.esc(t('tiepNhan')) + '</button>' +
    '<button type="button" class="btn dang" data-tra>' + HM.esc(t('traLaiNut')) + '</button>';
  else if (r.status === 'received') nut = '<button type="button" class="btn pri" data-ma>' + HM.esc(t('capMa')) + '</button>' +
    '<button type="button" class="btn dang" data-tra>' + HM.esc(t('traLaiNut')) + '</button>';
  else if (r.status === 'coded') nut = '<button type="button" class="btn go" data-ph>' + HM.esc(t('danhDau')) + '</button>';

  c.nganTruot(
    '<div class="btnrow" style="margin-bottom:14px">' + HM.tag(NHAN[c.lang][r.status], KIEU[r.status]) + nut + '</div>' +
    (r.kiem ? HHS.bangKiem(r.kiem, { gon: r.status === 'released' }) : '') +
    HM.kv([
      { t: t('guiBoi'), v: r.submittedBy + (r.submittedRole === 'label' ? (c.lang === 'vi' ? ' (label gửi thay nghệ sĩ)' : ' (label on behalf of the artist)') : r.submittedRole === 'staff' ? ' (' + t('nhanStaff') + ')' : '') },
      { t: t('ngayGui'), v: HT.fmt.luc(r.createdAt) },
      r.releasedAt ? { t: t('ngayThuc'), v: HT.fmt.ngay(r.releasedAt), manh: true } : null
    ].concat(HHS.chiTiet(r, HT.fmt))) +
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
    '<h4 class="sec">' + HM.esc(HTS.t('bvTieu')) + '</h4>' +
    HTS.buocViec(c, 'phat-hanh', r.id) +
    '<h4 class="sec">' + HM.esc(t('lichSu')) + '</h4>' +
    '<div class="steps">' + r.history.map(function (h, i) {
      var cuoi = i === r.history.length - 1;
      return '<div class="s ' + (h.status === 'returned' ? 'no' : cuoi ? 'now' : 'ok') + '"><b>' + HM.esc(NHAN[c.lang][h.status]) + '</b>' +
        (h.note ? '<span>' + HM.esc(h.note) + '</span>' : '') + '<div class="tm">' + HM.esc(HT.fmt.luc(h.at) + ' · ' + h.by) + '</div></div>';
    }).join('') + '</div>',
    { tieuDe: r.title, phu: r.id + ' · ' + r.artistName, khiMo: function (dr) {
      HTS.ganBuoc(c, dr, 'phat-hanh', r.id, function () { moHoSo(c, r.id); });
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

/* ---------------------------------------------------------------------
   Tạo hồ sơ phát hành thay đối tác. Dùng từ tiêu đề màn Phát hành và từ
   ngăn Đối tác (partyKey có sẵn). Tự chọn nghệ sĩ khi đối tác là nghệ sĩ;
   label thì chọn nghệ sĩ thuộc label. Track nhập nhanh mỗi dòng một track.
   --------------------------------------------------------------------- */
var THE_LOAI_HO = ['Pop', 'Indie', 'R&B', 'Hip-hop', 'Electronic', 'Alternative', 'Ballad', 'Rock', 'Lo-fi', 'Folk', 'Khác'];
function tx(c, k) { var m = HT.man.filter(function (x) { return x.id === 'phat-hanh'; })[0]; var d = m && m.chu && m.chu[c.lang]; return d && d[k] != null ? d[k] : k; }
function taoHoSoHo(c, partyKey) {
  var A = c.A, me = A.staff.me, t = function (k) { return tx(c, k); };
  function nsCua(pk) {
    if (!pk) return [];
    if (pk[0] === 'A') { var a = A.artists[+pk.slice(2)]; return a ? [a] : []; }
    var id = +pk.slice(2); return A.artists.filter(function (a) { return a.labelId === id; });
  }
  function moForm(pk) {
    var ns = nsCua(pk).map(function (a) { return { id: a.id, name: a.name, clientId: a.clientId }; });
    if (!ns.length) { c.thongBao(t('fDoiTac'), 'no'); return; }
    HHS.mo({
      staff: true, ns: ns, fields: A.releases.fields, ten: A.partyName(pk), nhan: pk[0] === 'L' ? A.partyName(pk) : 'Haustek', khoa: 'staff-' + me.id + '-' + pk,
      lienHe: { name: me.name, email: me.email, phone: me.phone || '' },
      kiem: function (payload) { return A.releases.check(pk, payload); },
      gui: function (payload) { return A.releases.createFor(pk, payload, me.name); },
      xong: function (r2) { c.thongBao(t('daTaoHo').replace('{id}', r2.id).replace('{t}', A.partyName(pk)), 'ok'); c.dongNgan(); c.veLai(); }
    });
  }
  if (partyKey) { moForm(partyKey); return; }
  /* chưa có đối tác: hỏi trước một bước, rồi mở form */
  c.hoiThoai({ tieuDe: t('taoHo'), moTa: HM.esc(t('taoHoMo')),
    than: '<label class="fld">' + HM.esc(t('fDoiTac')) + ' *</label><input class="in" data-o="tk" list="ds-ho-dt" placeholder="Nightform Records · HTK-L001"><datalist id="ds-ho-dt">' +
      A.parties.list({}).rows.slice(0, 300).map(function (r) { return '<option value="' + HM.esc(r.clientId) + '">' + HM.esc(r.name) + '</option>'; }).join('') + '</datalist>',
    dong: t('tiep') }).then(function (f) {
    if (!f) return;
    var r = A.parties.list({ q: f.tk || '' }).rows[0];
    if (!r) { c.thongBao(t('khongThayDt').replace('{q}', f.tk || ''), 'no'); return; }
    moForm(r.partyKey);
  });
}
HT.taoHoSoHo = taoHoSoHo;

})();
