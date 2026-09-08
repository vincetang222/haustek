/* =====================================================================
   NỘI BỘ · DANH MỤC BẢN GHI
   ---------------------------------------------------------------------
   Năm mươi nghìn bản ghi. Màn này phải làm được đúng những gì các nền
   tảng tham chiếu làm: tìm, lọc, sắp xếp, và mở một dòng ra xem tiền của
   riêng nó đi đâu — mà không đứng hình.

   Cách làm: lọc và sắp xếp trên mảng chỉ số, chỉ dựng HTML cho đúng số
   dòng đang nhìn thấy. Dựng 50.000 dòng rồi để trình duyệt cuộn là cách
   nhanh nhất để một máy tính văn phòng treo bốn giây.

   Mỗi dòng còn mang trạng thái quy trình phát hành (dải chấm 12 nền tảng
   + giai đoạn). Trạng thái đó chỉ tính cho các dòng đang hiển thị; khi bật
   lọc "Có vấn đề" / "Còn thiếu thông tin" thì mới quét cả danh mục
   (khoảng 100 đến 150 ms, chấp nhận được, nên hai bộ lọc này tắt mặc định).
   ===================================================================== */
"use strict";
(function () {

var LOC = { tab: 'ban-ghi', tim: '', loai: '', chu: '', coTien: true, maPhu: false, vanDe: false, thieu: false,
            sap: 'gross', huong: -1, trang: 0, co: 25 };

/* Chất lượng lượt nghe là SỐ LIỆU CỦA BÀI HÁT, nên nó nằm trong trang quản
   lý bài hát chứ không đứng riêng: cảnh báo lượt nghe bất thường gom theo
   tài khoản, và sức khoẻ metadata toàn danh mục. Chữ để trong từ điển
   riêng thay vì trộn vào chu: khoá của hai phần trùng tên nhau khá nhiều
   (tim, khong, cTk…), trộn vào là đè mất. */
var CLOC = { tab: 'tk', muc: 'all', tt: 'open', pk: null, tim: '', trang: 0, co: 25 };
var CL = {
  vi: { h1: 'Chất lượng lượt nghe',
      mo: 'Cảnh báo lượt nghe bất thường theo tài khoản, bài bị nền tảng gắn cờ và sức khoẻ metadata.',
      kCb: 'Cảnh báo', kCbS: '{a} nghiêm trọng · {b} cảnh báo · {c} theo dõi · {n} bài đã quét', kCo: 'Bài bị nền tảng gắn cờ', kCoS: 'lượt nghe đã bị gỡ khỏi báo cáo', kGo: 'Lượt nghe bị gỡ', kTk: 'Tài khoản nhiều bài tăng đồng loạt', kTkS: 'kiểu tách nhỏ để lách ngưỡng', kMo: 'Đang mở', kMoS: '{n} đang khiếu nại', kMd: 'Điểm metadata trung bình', kMdS: '{n} bản ghi thiếu mã quan trọng',
      tabTk: 'Theo tài khoản', tabCb: 'Cảnh báo', tabMd: 'Sức khoẻ metadata',
      cTk: 'Tài khoản', cMau: 'Kiểu', cAlerts: 'Cảnh báo', cNt: 'Nghiêm trọng', cCo: 'Bị gắn cờ', cGo: 'Lượt nghe bị gỡ', cMo: 'Đang mở',
      mucAll: 'Mọi mức', mucCritical: 'Nghiêm trọng', mucWarn: 'Cảnh báo', mucWatch: 'Theo dõi', ttAll: 'Mọi trạng thái', ttOpen: 'Đang mở', ttDisputed: 'Đang khiếu nại', ttConfirmed: 'Đã xác nhận', ttResolved: 'Đã gỡ',
      tim: 'Tìm bài, ISRC, tài khoản…', dangLoc: 'Đang xem tài khoản', boLoc: 'Bỏ lọc',
      xacNhan: 'Xác nhận gian lận', go: 'Gỡ cảnh báo', hoiXn: 'Xác nhận gian lận cho “{t}”?', hoiXnMo: 'Lượt nghe của bài bị giữ lại trong kỳ đang mở; đối tác thấy trạng thái này ở cổng của họ.', hoiGo: 'Gỡ cảnh báo cho “{t}”', hoiGoMo: 'Ghi lý do (chiến dịch hợp lệ, playlist biên tập, sự kiện) để lần sau không hỏi lại.', ghiChu: 'Ghi chú', daXn: 'Đã xác nhận gian lận', daGo: 'Đã gỡ cảnh báo',
      khong: 'Không có cảnh báo nào khớp bộ lọc', khongMo: 'Đổi bộ lọc phía trên.', khongTk: 'Không có tài khoản nào có cảnh báo',
      mdThieu: 'Mục còn thiếu nhiều nhất', mdThieuMo: 'Số bản ghi thiếu từng mục toàn danh mục (đã nhân theo mẫu).', mdBang: 'Bản ghi bị giữ lại hoặc dưới điểm A', mdBangMo: 'Bấm một bản ghi để xem từng mục và cách sửa.' },
  en: { h1: 'Stream quality',
      mo: 'Unusual-stream alerts by account, tracks platforms have flagged, and metadata health.',
      kCb: 'Alerts', kCbS: '{a} critical · {b} warning · {c} watch · {n} tracks scanned', kCo: 'Flagged by platforms', kCoS: 'streams already removed from reports', kGo: 'Streams removed', kTk: 'Accounts with many small lifts', kTkS: 'spreading streams thin to dodge thresholds', kMo: 'Open', kMoS: '{n} disputed', kMd: 'Average metadata score', kMdS: '{n} recordings missing key identifiers',
      tabTk: 'By account', tabCb: 'Alerts', tabMd: 'Metadata health',
      cTk: 'Account', cMau: 'Pattern', cAlerts: 'Alerts', cNt: 'Critical', cCo: 'Flagged', cGo: 'Streams removed', cMo: 'Open',
      mucAll: 'Any level', mucCritical: 'Critical', mucWarn: 'Warning', mucWatch: 'Watch', ttAll: 'Any status', ttOpen: 'Open', ttDisputed: 'Disputed', ttConfirmed: 'Confirmed', ttResolved: 'Cleared',
      tim: 'Search track, ISRC, account…', dangLoc: 'Showing account', boLoc: 'Clear',
      xacNhan: 'Confirm fraud', go: 'Clear alert', hoiXn: 'Confirm fraud on “{t}”?', hoiXnMo: 'The track’s streams are held in the open period; the partner sees this status in their portal.', hoiGo: 'Clear the alert on “{t}”', hoiGoMo: 'Note the reason (legitimate campaign, editorial playlist, event) so it is not asked again.', ghiChu: 'Note', daXn: 'Fraud confirmed', daGo: 'Alert cleared',
      khong: 'No alerts match the filters', khongMo: 'Change the filters above.', khongTk: 'No accounts with alerts',
      mdThieu: 'Most common gaps', mdThieuMo: 'Recordings missing each item across the catalogue (scaled from the sample).', mdBang: 'Recordings held or below grade A', mdBangMo: 'Click a recording to see each item and how to fix it.' }
};
function tc(k) { var d = CL[HT.lang] || CL.vi; return d[k] != null ? d[k] : k; }

/* Hai tab cha của trang: danh sách bản ghi, và chất lượng lượt nghe. */
function tabCha(c) {
  var A = c.A, vi = c.lang === 'vi';
  var dem = 0; try { dem = A.quality().counts.alerts || 0; } catch (e) {}
  return HM.tabs([{ k: 'ban-ghi', l: vi ? 'Bản ghi' : 'Recordings', icon: 'disc' },
                  { k: 'chat-luong', l: vi ? 'Chất lượng lượt nghe' : 'Stream quality', icon: 'alert', dem: dem || undefined }], LOC.tab);
}
function ganTabCha(root, c) {
  HM.bam(root, '[data-tab]', function (el) { LOC.tab = el.getAttribute('data-tab'); c.veLai(); });
}

/* Hồ sơ bản ghi dùng chung (HTS) định dạng ngày bằng HT.fmt.date, nhưng
   khung hiện chỉ có HT.fmt.ngay. Gán tạm ở đây để ngăn bản ghi mở được;
   khi khung bổ sung hàm này thì dòng dưới không làm gì nữa. */
if (typeof HT.fmt.date !== 'function') HT.fmt.date = HT.fmt.ngay;

HT.dangKy({
  id: 'danh-muc', nav: 'navDanhMuc', nhom: 'nhomDuLieu', icon: 'disc',

  chu: {
    vi: {
      themBai: 'Thêm bài hát',
      nhomDuLieu: 'Danh mục', navDanhMuc: 'Danh mục', h1: 'Danh mục bản ghi',
      mo: 'Mọi bản ghi Haustek đang phân phối. Bấm một dòng để xem dòng tiền, quy trình và số theo nền tảng.',
      tong: 'Tổng bản ghi', coTien: 'Có doanh thu kỳ này', nghesi: 'Nghệ sĩ', labelKho: 'Label',
      vanDe: 'Có vấn đề', thieu: 'Còn thiếu thông tin',
      tim: 'Tìm theo ISRC, tên bản ghi, nghệ sĩ…',
      moiLoai: 'Mọi loại', moiChu: 'Mọi chủ sở hữu', thuocLabel: 'Thuộc label', docLap: 'Độc lập',
      locCoTien: 'Chỉ bản ghi có doanh thu kỳ này', locMaPhu: 'Chỉ bản ghi có hai mã ISRC',
      cBai: 'Bản ghi', cLoai: 'Loại', cChu: 'Chủ sở hữu', cPh: 'Phát hành', cNt: 'Nền tảng',
      cLuot: 'Lượt nghe', cGop: 'Doanh thu gộp', cNs: 'Nghệ sĩ được hưởng', cTyLe: 'Tỷ lệ',
      khong: 'Không tìm thấy bản ghi nào',
      khongMo: 'Thử bỏ bớt bộ lọc, hoặc tìm theo mã ISRC.',
      tabTien: 'Dòng tiền', tabTt: 'Thông tin',
      ctGop: 'Doanh thu gộp kỳ này', ctChuoi: 'Chi tiết dòng tiền của bản ghi',
      ctKy: 'Doanh thu 12 kỳ', ctCh: 'Theo nền tảng', ctLt: 'Theo thị trường',
      ctTt: 'Mã và chủ sở hữu', ctSt: 'Tỷ lệ chia tác quyền', ctLuong: 'Theo nguồn báo cáo',
      maPhuMo: 'Bản ghi có hai mã ISRC; báo cáo về theo từng mã nên phải gộp, không thì tách thành hai dòng mỗi dòng nửa doanh thu (câu hỏi số 2).',
      chuaNhap: 'chưa nhập báo cáo cho kỳ này',
      xuat: 'Xuất CSV', hienThi: 'Đang hiển thị'
    },
    en: {
      themBai: 'Add a track',
      nhomDuLieu: 'Data', navDanhMuc: 'Catalogue', h1: 'Recording catalogue',
      mo: 'Every recording Haustek distributes. Open a row for money, pipeline and per-platform figures.',
      tong: 'Recordings', coTien: 'Earning this period', nghesi: 'Artists', labelKho: 'Labels',
      vanDe: 'Needs attention', thieu: 'Missing details',
      tim: 'Search ISRC, title, artist…',
      moiLoai: 'All types', moiChu: 'All owners', thuocLabel: 'Under a label', docLap: 'Independent',
      locCoTien: 'Only tracks earning this period', locMaPhu: 'Only tracks with a second ISRC',
      cBai: 'Recording', cLoai: 'Type', cChu: 'Owner', cPh: 'Released', cNt: 'Platforms',
      cLuot: 'Streams', cGop: 'Gross', cNs: 'To artist', cTyLe: 'Rate',
      khong: 'No recording matches',
      khongMo: 'Drop a filter, or search by ISRC.',
      tabTien: 'Money', tabTt: 'Details',
      ctGop: 'Gross this period', ctChuoi: 'Where this track’s money went',
      ctKy: 'Revenue, 12 periods', ctCh: 'By platform', ctLt: 'By territory',
      ctTt: 'Codes and ownership', ctSt: 'Writer split', ctLuong: 'By data feed',
      maPhuMo: 'Two ISRCs on one track; reports arrive per code and must be merged or the track splits into two half-revenue rows (question 2).',
      chuaNhap: 'not loaded for this period',
      xuat: 'Export CSV', hienThi: 'Showing'
    }
  },

  ve: function (root, c) {
    if (LOC.tab === 'chat-luong') return veChatLuong(root, c);
    var A = c.A, t = c.t, pi = c.ky.idx;

    /* ---- lọc: chạy trên chỉ số, không dựng đối tượng ----
       Hai bộ lọc theo quy trình phát hành đặt CUỐI vòng, sau các điều
       kiện rẻ, để chỉ tính assetSummary cho những dòng đã qua các lọc kia. */
    var tim = LOC.tim.trim().toLowerCase();
    var theoQt = LOC.vanDe || LOC.thieu;
    var idx = [];
    for (var i = 0; i < A.trackCount; i++) {
      if (LOC.loai && A.typeOf(i) !== LOC.loai) continue;
      var lb = A.labelOf(i);
      if (LOC.chu === 'label' && !lb) continue;
      if (LOC.chu === 'indie' && lb) continue;
      var g = A.grossRec(i, pi);
      if (LOC.coTien && g <= 0) continue;
      if (LOC.maPhu && !A.track(i).isrcAlt) continue;
      if (tim) {
        if (A.isrcOf(i).toLowerCase().indexOf(tim) < 0 &&
            A.titleOf(i).toLowerCase().indexOf(tim) < 0 &&
            A.artistOf(i).name.toLowerCase().indexOf(tim) < 0) continue;
      }
      if (theoQt) {
        var sq = A.assetSummary(i);
        if (LOC.vanDe && sq.stage !== 'issue') continue;
        if (LOC.thieu && !(sq.missing > 0)) continue;
      }
      idx.push(i);
    }

    /* ---- sắp xếp ---- */
    var khoa = LOC.sap, huong = LOC.huong;
    var gia = function (i) {
      if (khoa === 'gross') return A.grossRec(i, pi);
      if (khoa === 'streams') return A.streamsOf(i, pi);
      if (khoa === 'title') return A.titleOf(i);
      if (khoa === 'artist') return A.artistOf(i).name;
      if (khoa === 'isrc') return A.isrcOf(i);
      if (khoa === 'release') return A.track(i).releasePeriod;
      return 0;
    };
    idx.sort(function (a, b) {
      var x = gia(a), y = gia(b);
      if (typeof x === 'string') return x.localeCompare(y, 'vi') * huong;
      return (x - y) * huong;
    });

    var het = Math.max(0, Math.ceil(idx.length / LOC.co) - 1);
    if (LOC.trang > het) LOC.trang = het;
    var dau = LOC.trang * LOC.co;
    var trang = idx.slice(dau, dau + LOC.co);

    var tongGop = 0;
    for (var k = 0; k < idx.length; k++) tongGop += A.grossRec(idx[k], pi);

    var demCoTien = HM.nho(A, 'demCoTien:' + pi, function () {
      var n = 0;
      for (var i2 = 0; i2 < A.trackCount; i2++) if (A.grossRec(i2, pi) > 0) n++;
      return n;
    });
    /* Đếm bản ghi có vấn đề / còn thiếu trên toàn danh mục: một lần quét
       theo dấu mốc trạng thái, không phụ thuộc kỳ đang chọn. */
    var vande = HM.nho(A, 'vande', function () { return A.catalogue({ stage: 'issue', limit: 1 }).counts; });

    var html = '';
    html += HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: A.quyen.nhom('phatHanhHo') && HT.taoHoSoHo ? '<button type="button" class="btn pri" data-them-bai>' + HM.icon('file') + HM.esc(t('themBai')) + '</button>' : '',
      so: [
        { l: t('tong'), v: HT.fmt.n(A.trackCount) },
        { l: t('coTien'), v: HT.fmt.n(demCoTien) },
        { l: t('vanDe'), v: HT.fmt.n(vande.issue), mau: vande.issue ? HB.mau('danger') : '' },
        { l: t('nghesi'), v: HT.fmt.n(A.counts.artists) },
        { l: t('labelKho'), v: HT.fmt.n(A.counts.labels) }
      ]
    });

    /* ---- thanh lọc ---- */
    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
        HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      '<select class="in" data-loai style="width:auto;height:34px">' +
        '<option value="">' + HM.esc(t('moiLoai')) + '</option>' +
        ['Single', 'EP', 'Album'].map(function (x) {
          return '<option value="' + x + '"' + (LOC.loai === x ? ' selected' : '') + '>' + x + '</option>';
        }).join('') + '</select>' +
      '<select class="in" data-chu style="width:auto;height:34px">' +
        '<option value="">' + HM.esc(t('moiChu')) + '</option>' +
        '<option value="label"' + (LOC.chu === 'label' ? ' selected' : '') + '>' + HM.esc(t('thuocLabel')) + '</option>' +
        '<option value="indie"' + (LOC.chu === 'indie' ? ' selected' : '') + '>' + HM.esc(t('docLap')) + '</option></select>' +
      '<button type="button" class="pill' + (LOC.coTien ? ' on' : '') + '" data-cotien>' + HM.esc(t('locCoTien')) + '</button>' +
      '<button type="button" class="pill' + (LOC.maPhu ? ' on' : '') + '" data-maphu>' + HM.esc(t('locMaPhu')) + '</button>' +
      '<button type="button" class="pill' + (LOC.vanDe ? ' on' : '') + '" data-vande>' + HM.esc(t('vanDe')) +
        ' <b>' + HT.fmt.n(vande.issue) + '</b></button>' +
      '<button type="button" class="pill' + (LOC.thieu ? ' on' : '') + '" data-thieu>' + HM.esc(t('thieu')) +
        ' <b>' + HT.fmt.n(vande.missing) + '</b></button>' +
      '<div class="sp"></div>' +
      '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>' +
      '</div>';

    /* ---- chip cho biết đang lọc gì ---- */
    var chip = [];
    if (LOC.tim) chip.push(['tim', '"' + LOC.tim + '"']);
    if (LOC.loai) chip.push(['loai', LOC.loai]);
    if (LOC.chu) chip.push(['chu', LOC.chu === 'label' ? t('thuocLabel') : t('docLap')]);
    if (LOC.coTien) chip.push(['cotien', t('locCoTien')]);
    if (LOC.maPhu) chip.push(['maphu', t('locMaPhu')]);
    if (LOC.vanDe) chip.push(['vande', t('vanDe')]);
    if (LOC.thieu) chip.push(['thieu', t('thieu')]);
    if (chip.length) {
      html += '<div class="chips">' + chip.map(function (x) {
        return '<span class="chip"><b>' + HM.esc(x[1]) + '</b>' +
          '<button type="button" data-bo="' + x[0] + '">' + HM.icon('x') + '</button></span>';
      }).join('') +
        '<span class="chip q">' + HM.esc(t('hienThi')) + ' <b>' + HT.fmt.n(idx.length) + '</b> · ' +
        HM.esc(c.tien(tongGop)) + '</span></div>';
    }

    /* ---- bảng ---- */
    var cot = [
      { k: 'title', l: t('cBai') },
      { k: 'type', l: t('cLoai'), s: false, w: '80px' },
      { k: 'owner', l: t('cChu'), s: false },
      { k: 'release', l: t('cPh'), w: '96px' },
      { k: 'nt', l: t('cNt'), s: false, w: '210px' },
      { k: 'streams', l: t('cLuot'), num: true, w: '112px' },
      { k: 'gross', l: t('cGop'), num: true, w: '124px' },
      { k: 'artist2', l: t('cNs'), num: true, s: false, w: '124px' }
    ];

    html += HM.the({
      thoBody: true,
      than: '<div class="card-h" style="padding-bottom:12px"><div class="pager">' +
          '<button type="button" class="pg" data-tr="-1"' + (LOC.trang === 0 ? ' disabled' : '') + '>' + HM.icon('left') + '</button>' +
          '<button type="button" class="pg" data-tr="1"' + (dau + LOC.co >= idx.length ? ' disabled' : '') + '>' + HM.icon('right') + '</button>' +
        '</div><div class="range">' + (idx.length ? HT.fmt.n(dau + 1) + '–' + HT.fmt.n(Math.min(idx.length, dau + LOC.co)) : '0') +
        ' ' + HM.esc(c.CHU[c.lang].of) + ' ' + HT.fmt.n(idx.length) + '</div><div class="sp"></div>' +
        '<div class="range">' + HM.esc(c.tien(tongGop)) + ' · ' + HM.esc(c.ky.label) + '</div></div>' +
        (idx.length
          ? '<div class="tw"><table class="t"><thead><tr>' + cot.map(function (x) {
              var on = LOC.sap === x.k;
              return '<th class="' + (x.num ? 'num ' : '') + (x.s === false ? '' : 's ') + (on ? 'sorted band' : '') + '"' +
                (x.s === false ? '' : ' data-sx="' + x.k + '"') + (x.w ? ' style="width:' + x.w + '"' : '') + '>' +
                HM.esc(x.l) + (on ? '<span class="ar">' + (LOC.huong > 0 ? '↑' : '↓') + '</span>' : '') + '</th>';
            }).join('') + '</tr></thead><tbody>' +
            trang.map(function (i) {
              var tr = A.track(i);
              var g = A.grossRec(i, pi);
              var sp = g > 0 ? A.splitRec(i, g, c.kyKey) : null;
              /* trạng thái quy trình: chỉ tính cho dòng đang nhìn thấy */
              var s = A.assetSummary(i);
              return '<tr class="pick" data-bg="' + i + '">' +
                '<td><div class="t-bia">' + HM.bia(i, tr.title) + '<div><div class="t-ttl">' + HM.esc(HM.dai(tr.title, 30)) + '</div>' +
                  '<div class="t-sub">' + HM.esc(tr.isrc) +
                  (tr.isrcAlt ? ' <span class="tag info" style="font-size:10.5px;padding:1px 6px">+1</span>' : '') +
                  ' · ' + HM.esc(HM.dai(tr.artist, 24)) + '</div></div></div></td>' +
                '<td>' + HM.esc(tr.type) + '</td>' +
                '<td>' + (tr.label ? HM.esc(HM.dai(tr.label, 24))
                  : '<span class="muted">' + HM.esc(t('docLap')) + '</span>') + '</td>' +
                '<td class="mono">' + HM.esc(tr.releasePeriod) + '</td>' +
                '<td style="white-space:nowrap">' + HTS.chamNenTang(s.live, s.total, s.stage) + HTS.tagGiaiDoan(s.stage) + '</td>' +
                '<td class="num">' + (g > 0 ? HM.esc(HT.fmt.n(A.streamsOf(i, pi))) : '<span class="nil">—</span>') + '</td>' +
                '<td class="num band">' + (g > 0 ? HM.esc(c.tien2(g)) : '<span class="nil">—</span>') + '</td>' +
                '<td class="num">' + (sp ? HM.esc(c.tien2(sp.artist)) : '<span class="nil">—</span>') + '</td></tr>';
            }).join('') + '</tbody></table></div>'
          : HM.trong({ icon: 'disc', tieuDe: t('khong'), moTa: t('khongMo') })) +
        '<div class="card-f"><span class="sp" style="flex:1"></span>' + HM.esc(c.CHU[c.lang].showing) +
        ' <select class="inline-sel" data-co>' + [12, 25, 50, 100].map(function (n) {
          return '<option value="' + n + '"' + (n === LOC.co ? ' selected' : '') + '>' + n + '</option>';
        }).join('') + '</select> ' + HM.esc(c.CHU[c.lang].rows) + '</div>'
    });

    root.innerHTML = tabCha(c) + html;
    ganTabCha(root, c);

    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; LOC.trang = 0; c.veLai(); }, 260);
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; LOC.trang = 0; c.veLai(); });
    HM.doi(root, '[data-chu]', function (el) { LOC.chu = el.value; LOC.trang = 0; c.veLai(); });
    HM.doi(root, '[data-co]', function (el) { LOC.co = +el.value; LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-them-bai]', function () { HT.taoHoSoHo(c, null); });
    HM.bam(root, '[data-cotien]', function () { LOC.coTien = !LOC.coTien; LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-maphu]', function () { LOC.maPhu = !LOC.maPhu; LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-vande]', function () { LOC.vanDe = !LOC.vanDe; LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-thieu]', function () { LOC.thieu = !LOC.thieu; LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tr]', function (el) { LOC.trang += +el.getAttribute('data-tr'); c.veLai(); });
    HM.bam(root, '[data-sx]', function (el) {
      var k = el.getAttribute('data-sx');
      if (LOC.sap === k) LOC.huong = -LOC.huong;
      else { LOC.sap = k; LOC.huong = (k === 'title' || k === 'artist' || k === 'isrc') ? 1 : -1; }
      LOC.trang = 0; c.veLai();
    });
    HM.bam(root, '[data-bo]', function (el) {
      var k = el.getAttribute('data-bo');
      if (k === 'tim') LOC.tim = '';
      if (k === 'loai') LOC.loai = '';
      if (k === 'chu') LOC.chu = '';
      if (k === 'cotien') LOC.coTien = false;
      if (k === 'maphu') LOC.maPhu = false;
      if (k === 'vande') LOC.vanDe = false;
      if (k === 'thieu') LOC.thieu = false;
      LOC.trang = 0; c.veLai();
    });
    HM.bam(root, '[data-bg]', function (el) { moBanGhi(c, +el.getAttribute('data-bg')); });
    HM.bam(root, '[data-xuat]', function () {
      var lay = idx.slice(0, 5000);
      HM.csv('danh-muc-' + c.kyKey + '.csv',
        ['ISRC', 'ISRC phụ', 'UPC', 'Tên bản ghi', 'Loại', 'Nghệ sĩ', 'Mã nghệ sĩ', 'Chủ sở hữu', 'Phát hành',
         'Lượt nghe', 'Doanh thu gộp USD', 'Phí dịch vụ Haustek', 'Phần label/Haustek được hưởng', 'Phần nghệ sĩ được hưởng'],
        lay.map(function (i) {
          var tr = A.track(i), g = A.grossRec(i, pi);
          var sp = A.splitRec(i, g, c.kyKey);
          return [tr.isrc, tr.isrcAlt, tr.upc, tr.title, tr.type, tr.artist,
                  A.artistOf(i).clientId, tr.label || 'Độc lập', tr.releasePeriod,
                  A.streamsOf(i, pi), g.toFixed(2), sp.fee.toFixed(2), sp.labelCut.toFixed(2),
                  sp.artist.toFixed(2)];
        }));
      if (idx.length > 5000)
        c.thongBao(c.lang === 'vi' ? 'Chỉ xuất 5.000 dòng đầu trong tổng số ' + HT.fmt.n(idx.length) : 'First 5,000 of ' + HT.fmt.n(idx.length));
    });
  }
});

/* =====================================================================
   NGĂN TRƯỢT — một bản ghi
   ---------------------------------------------------------------------
   Khuôn dùng chung HTS.moNgan lo ba tab Quy trình · Nền tảng · Theo tháng
   từ gói A.asset(i). Màn này đưa thêm hai tab của riêng nội bộ:
     · Dòng tiền: chuỗi chia tiền kỳ đang chọn, theo nguồn báo cáo, 12 kỳ,
       theo nền tảng (cùng 9 ô với tab Theo tháng), theo thị trường;
     · Thông tin: mã, chủ sở hữu, tỷ lệ chia tác quyền.
   ===================================================================== */
function moBanGhi(c, i) {
  var A = c.A, tr = A.track(i), pi = c.ky.idx, vi = c.lang === 'vi';
  var d = A.asset(i);
  var g = A.grossRec(i, pi);
  var sp = A.splitRec(i, g, c.kyKey);
  var P = HB.dayMau();
  var tenNt = vi ? A.platformNames : A.platformNamesEn;
  var chuaDuyetIdx = A.periods.filter(function (p) { return !A.isApproved(p.k); }).map(function (p) { return p.idx; });

  /* 9 ô nền tảng của kỳ đang chọn: cùng cách bóc với tab Theo tháng, nên
     hai chỗ luôn ra cùng con số. Nền tảng thuộc nguồn chưa nhập vẫn hiện
     dòng, ghi rõ lý do, thay vì biến mất và để người đọc tưởng bằng 0. */
  var theoNenTang = function () {
    if (g <= 0) return [];
    var pt = A.splitStores(i, pi);
    return tenNt.map(function (x, j) {
      var fid = j < A.storeFeed.length && j < tenNt.length - 1 ? A.storeFeed[j] : null;
      var chua = fid != null && !A.feedLoaded(pi, fid);
      return { ten: x, gt: Math.round(pt[j] * 100) / 100,
               mau: j === tenNt.length - 1 ? HB.mau('neutral-bar') : P[j % 8],
               phu: chua ? c.t('chuaNhap') : '' };
    }).sort(function (a, b) { return b.gt - a.gt; })
      .filter(function (x) { return x.gt > 0.004 || x.phu; });
  };
  var theoThiTruong = function () {
    if (g <= 0) return [];
    var pt = A.splitDim(i, g, A.territoryW, pi);
    return A.territories.map(function (x, j) { return { ten: x, gt: Math.round(pt[j] * 100) / 100, mau: P[j % 8] }; })
      .sort(function (a, b) { return b.gt - a.gt; }).slice(0, 8)
      .filter(function (x) { return x.gt > 0.004; });
  };

  var buoc = [
    { l: vi ? 'Doanh thu gộp' : 'Gross', v: sp.gross, kind: 'top' },
    { l: vi ? 'Phí dịch vụ' : 'Fee', v: -sp.fee, kind: 'out', nt: HT.fmt.pct(A.cfg.HAUSTEK_FEE) },
    { l: tr.label ? 'Label' : 'Haustek', v: -sp.labelCut, kind: 'out',
      nt: tr.label || (vi ? 'phần Haustek theo hợp đồng độc lập' : 'extra share on independents') }
  ];
  if (sp.producer > 0.004) buoc.push({ l: 'Producer', v: -sp.producer, kind: 'out', nt: HT.fmt.pct(tr.producerPts) });
  buoc.push({ l: vi ? 'Nghệ sĩ' : 'Artist', v: sp.artist, kind: 'final' });

  /* ---- tab Dòng tiền ---- */
  var tienHtml =
    (tr.isrcAlt ? HM.ghi({ kieu: 'warn',
      tieuDe: HM.esc(vi ? 'Bản ghi này có hai mã ISRC' : 'Two ISRCs on this track'),
      than: '<span class="mono">' + HM.esc(tr.isrc) + '</span> · <span class="mono">' + HM.esc(tr.isrcAlt) + '</span><br>' +
        HM.esc(c.t('maPhuMo')) }) : '') +
    HM.so([
      { l: c.t('ctGop') + ' · ' + c.ky.label, v: c.tien2(g), lon: true },
      { l: vi ? 'Lượt nghe' : 'Streams', v: HT.fmt.n(A.streamsOf(i, pi)) }
    ]) +
    '<h4 class="sec">' + HM.esc(c.t('ctChuoi')) + '</h4>' +
    (g > 0
      ? HB.o({ loai: 'thac', cao: 190, buoc: buoc }) +
        '<div class="hint">' + HM.esc(vi
          ? 'Tỷ lệ áp dụng cho kỳ ' + c.ky.label + ': ' + HT.fmt.pct(sp.rate) + '. Tỷ lệ này lấy từ bảng tỷ lệ theo ngày hiệu lực, không phải từ một cột trên hồ sơ nghệ sĩ.'
          : 'Rate for ' + c.ky.label + ': ' + HT.fmt.pct(sp.rate) + ' — read from the dated rate table, not a column on the artist row.') + '</div>'
      : '<p class="hint">' + HM.esc(vi
          ? 'Bản ghi này không có doanh thu trong kỳ ' + c.ky.label + '.'
          : 'This track earned nothing in ' + c.ky.label + '.') + '</p>') +
    '<h4 class="sec">' + HM.esc(c.t('ctLuong')) + '</h4>' +
    HB.o({ loai: 'thanh', hang: A.feeds.map(function (f, fi) {
      return { ten: c.song(f, 'short'), gt: A.grossRecByFeed(i, pi, f.id), mau: P[fi],
               phu: A.feedLoaded(pi, f.id) ? '' : c.t('chuaNhap') };
    }) }) +
    '<h4 class="sec">' + HM.esc(c.t('ctKy')) + '</h4>' +
    HB.o({ loai: 'cot', cao: 160, anTruc: true, chuThich: false,
      truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
      tieuDeTip: function (k) { return (vi ? 'Kỳ ' : 'Period ') + A.periods[k].label; },
      ghiChuTip: function (k) { return HT.fmt.n(A.streamsOf(i, k)) + (vi ? ' lượt nghe' : ' streams'); },
      chuoi: [{ ten: vi ? 'Doanh thu gộp' : 'Gross',
        gt: A.periods.map(function (p, k) { return A.grossRec(i, k); }) }],
      dangDo: chuaDuyetIdx, noiBat: pi }) +
    (g > 0 ? '<h4 class="sec">' + HM.esc(c.t('ctCh')) + ' · ' + HM.esc(c.ky.label) + '</h4>' +
      HB.o({ loai: 'thanh', hang: theoNenTang() }) +
      '<h4 class="sec">' + HM.esc(c.t('ctLt')) + ' · ' + HM.esc(c.ky.label) + '</h4>' +
      HB.o({ loai: 'thanh', hang: theoThiTruong() }) : '');

  /* ---- tab Thông tin ---- */
  var ttHtml =
    '<h4 class="sec" style="margin-top:0">' + HM.esc(c.t('ctTt')) + '</h4>' +
    HM.kv([
      { t: 'ISRC', v: tr.isrc },
      tr.isrcAlt ? { t: 'ISRC (Optional 1)', v: tr.isrcAlt } : null,
      { t: 'UPC', v: tr.upc },
      { t: vi ? 'Loại' : 'Type', v: tr.type },
      { t: vi ? 'Nghệ sĩ chính' : 'Main artist', v: tr.artist + ' · ' + A.artists[tr.artistId].clientId },
      { t: vi ? 'Chủ sở hữu' : 'Owner',
        v: tr.label ? tr.label + ' · ' + A.labels[tr.labelId].clientId : (vi ? 'Nghệ sĩ độc lập' : 'Independent') },
      { t: vi ? 'Ngày phát hành' : 'Release date', v: HT.fmt.ngay(d.releaseDate) + ' · ' + tr.releasePeriod },
    ]) +
    '<h4 class="sec">' + HM.esc(c.t('ctSt')) + '</h4>' +
    HM.kv([
      { t: tr.writer1, v: HT.fmt.pct(tr.writer1Share) },
      tr.writer2 ? { t: tr.writer2, v: HT.fmt.pct(1 - tr.writer1Share) } : null
    ]) +
    '<div class="hint">' + HM.esc(vi
      ? 'Tác quyền được chia theo bảng này, tách riêng khỏi doanh thu bản ghi và không đi qua label.'
      : 'Publishing follows this table, entirely separate from the recording revenue, and never passes through a label.') + '</div>';

  var coTien = !!(A.quyen && A.quyen.nhom('tien'));
  HTS.moNgan(c, d, {
    noiBo: true, tien: c.tien2, tien0: c.tien, tabDau: coTien ? 'tien' : 'thongtin',
    them: (coTien ? [{ k: 'tien', l: c.t('tabTien'), html: tienHtml, khiMo: function (panel) { HB.gan(panel); } }] : []).concat([
      { k: 'thongtin', l: c.t('tabTt'), html: ttHtml }
    ])
  });
}



/* ---------------------------------------------------------------------
   TAB CHẤT LƯỢNG LƯỢT NGHE
   Gộp từ trang riêng cũ: số liệu lượt nghe là số liệu của bài hát nên
   thuộc về trang quản lý bài hát. Vận hành nhìn theo TÀI KHOẢN trước,
   theo bài sau — vụ tách 660.000 lượt/ngày thành nhiều bài nhỏ để lách
   ngưỡng từng bài chỉ lộ ra khi gom theo tài khoản.
   --------------------------------------------------------------------- */
function veChatLuong(root, c) {
    var A = c.A, P = HB.dayMau();
    var q = HM.nho(A, 'chat-luong:q', function () { return A.quality(); });
    var md = HM.nho(A, 'chat-luong:md', function () { return A.metadataReport(); });
    var k = q.counts, lifts = q.cases.filter(function (x) { return x.pattern === 'many-small-lifts'; }).length;
    var html = '';
    html += HM.so([
      { l: tc('kCb'), v: HT.fmt.n(k.alerts), lon: true, s: tc('kCbS').replace('{a}', k.critical).replace('{b}', k.warn).replace('{c}', k.watch).replace('{n}', HT.fmt.n(k.tracksChecked)) },
      { l: tc('kCo'), v: HT.fmt.n(k.flagged), s: tc('kCoS'), mau: k.flagged ? HB.mau('no') : '' },
      { l: tc('kGo'), v: HT.fmt.n(k.removedStreams) },
      { l: tc('kTk'), v: HT.fmt.n(lifts), s: tc('kTkS'), mau: lifts ? HB.mau('warn') : '' },
      { l: tc('kMo'), v: HT.fmt.n(k.open), s: tc('kMoS').replace('{n}', k.disputed) },
      { l: tc('kMd'), v: String(md.counts.avg), s: tc('kMdS').replace('{n}', HT.fmt.n(md.counts.blocking)), mau: md.counts.avg >= 90 ? HB.mau('ok') : HB.mau('warn') }
    ]);
    html += HM.tabs([{ k: 'tk', l: tc('tabTk'), dem: q.cases.length }, { k: 'cb', l: tc('tabCb'), dem: k.alerts }, { k: 'md', l: tc('tabMd'), dem: md.counts.blocking || undefined }], CLOC.tab).split('data-tab=').join('data-cltab=');

    if (CLOC.tab === 'tk') {
      html += HM.the({ thoBody: true,
        than: !q.cases.length ? HM.trong({ icon: 'check', tieuDe: tc('khongTk'), moTa: '' }) :
          '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(tc('cTk')) + '</th><th>' + HM.esc(tc('cMau')) + '</th><th class="num">' + HM.esc(tc('cAlerts')) + '</th><th class="num">' + HM.esc(tc('cNt')) + '</th><th class="num">' + HM.esc(tc('cCo')) + '</th><th class="num band">' + HM.esc(tc('cGo')) + '</th><th class="num">' + HM.esc(tc('cMo')) + '</th></tr></thead><tbody>' +
          q.cases.map(function (x) {
            return '<tr class="pick" data-pk="' + HM.esc(x.partyKey) + '"><td>' + HM.tenBia({ ten: x.name, seed: x.clientId, phu: x.clientId + ' · ' + x.partyKey }) + '</td>' +
              '<td>' + HM.tag(c.song(x, 'patternLabel'), x.pattern === 'many-small-lifts' ? 'warn' : x.pattern === 'dsp-flag' ? 'no' : x.pattern === 'critical' ? 'no' : '') + '</td>' +
              '<td class="num"><b>' + HT.fmt.n(x.alerts) + '</b></td><td class="num">' + (x.critical ? '<span class="neg">' + x.critical + '</span>' : '<span class="nil">—</span>') + '</td>' +
              '<td class="num">' + (x.flagged ? '<span class="neg">' + x.flagged + '</span>' : '<span class="nil">—</span>') + '</td>' +
              '<td class="num band">' + (x.removedStreams ? '<b>' + HM.esc(HT.fmt.n(x.removedStreams)) + '</b>' : '<span class="nil">—</span>') + '</td>' +
              '<td class="num">' + HT.fmt.n(x.open) + '</td></tr>';
          }).join('') + '</tbody></table></div>',
        chan: HM.esc(c.song(q, 'note')) });
    } else if (CLOC.tab === 'cb') {
      var qq = CLOC.tim.trim().toLowerCase();
      var rows = q.rows.filter(function (r) {
        if (CLOC.pk && r.partyKey !== CLOC.pk) return false;
        if (CLOC.muc !== 'all' && r.severity !== CLOC.muc) return false;
        if (CLOC.tt !== 'all' && r.status !== CLOC.tt) return false;
        if (qq && (r.title + ' ' + r.isrc + ' ' + r.artist + ' ' + A.partyName(r.partyKey)).toLowerCase().indexOf(qq) < 0) return false;
        return true;
      });
      var pt = HTM.phanTrang(rows, CLOC);
      html += '<div class="bar">' +
        (CLOC.pk ? '<span class="chip on">' + HM.esc(tc('dangLoc') + ': ' + A.partyName(CLOC.pk)) + ' <button type="button" data-bo-pk title="' + HM.esc(tc('boLoc')) + '">' + HM.icon('x') + '</button></span>' : '') +
        [['all', tc('mucAll')], ['critical', tc('mucCritical')], ['warn', tc('mucWarn')], ['watch', tc('mucWatch')]].map(function (x) { return '<button type="button" class="pill' + (CLOC.muc === x[0] ? ' on' : '') + '" data-muc="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
        '<span class="muted">·</span>' +
        [['all', tc('ttAll')], ['open', tc('ttOpen')], ['disputed', tc('ttDisputed')], ['confirmed', tc('ttConfirmed')], ['resolved', tc('ttResolved')]].map(function (x) { return '<button type="button" class="pill' + (CLOC.tt === x[0] ? ' on' : '') + '" data-tt="' + x[0] + '">' + HM.esc(x[1]) + '</button>'; }).join('') +
        '<div class="sp"></div><div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' + HM.esc(tc('tim')) + '" value="' + HM.esc(CLOC.tim) + '"></div></div>';
      html += HM.the({ thoBody: true,
        than: !rows.length ? HM.trong({ icon: 'empty', tieuDe: tc('khong'), moTa: tc('khongMo') })
          : HTM.bangCanhBao(pt.page, { noiBo: true, tenTk: function (pk) { return A.partyName(pk); },
              nut: function (r) { return r.status === 'open' || r.status === 'disputed' ? '<div class="btnrow" style="flex-wrap:nowrap"><button type="button" class="btn sm dang" data-xn="' + r.trackId + '">' + HM.esc(tc('xacNhan')) + '</button><button type="button" class="btn sm" data-go="' + r.trackId + '">' + HM.esc(tc('go')) + '</button></div>' : '<span class="nil">—</span>'; } }) + pt.chan,
        chan: HM.esc(c.song(q, 'note')) });
    } else {
      var thieu = md.byCheck.filter(function (x) { return x.missing > 0; });
      var pm = HTM.phanTrang(md.rows, CLOC);
      html += '<div class="grid g3">' +
        HM.the({ h2: HM.esc(tc('mdThieu')), p: HM.esc(tc('mdThieuMo')),
          than: HB.o({ loai: 'thanh', dinhDang: 'so', hang: thieu.map(function (x) { return { ten: c.song(x, 'label'), gt: x.missing, mau: ['iswc', 'ipi', 'splits'].indexOf(x.k) >= 0 ? HB.mau('no') : P[0] }; }) }) }) +
        HM.the({ h2: HM.esc(tc('mdBang')), p: HM.esc(tc('mdBangMo')), thoBody: true, than: HTM.bangMeta(pm.page, { noiBo: true, tenTk: function (pk) { return A.partyName(pk); } }) + pm.chan, chan: HM.esc(c.song(md, 'note')) }) +
        '</div>';
    }
    root.innerHTML = tabCha(c) + html;
    HB.gan(root);
    HTM.ganTrang(root, CLOC, c.veLai);
    HM.bam(root, '[data-cltab]', function (el) { CLOC.tab = el.getAttribute('data-cltab'); CLOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-muc]', function (el) { CLOC.muc = el.getAttribute('data-muc'); CLOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tt]', function (el) { CLOC.tt = el.getAttribute('data-tt'); CLOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-bo-pk]', function () { CLOC.pk = null; CLOC.trang = 0; c.veLai(); });
    HM.bam(root, 'tr[data-pk]', function (el) { CLOC.pk = el.getAttribute('data-pk'); CLOC.tab = 'cb'; CLOC.tt = 'all'; CLOC.trang = 0; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { CLOC.tim = el.value; c.veLai(); var i = root.querySelector('[data-tim]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
    function hanhDong(id, status, tieuDe, moTa, xong) {
      var r = q.rows.filter(function (x) { return x.trackId === id; })[0];
      c.hoiThoai({ tieuDe: tieuDe.replace('{t}', r ? r.title : id), moTa: HM.esc(moTa),
        than: (r ? HTM.tinHieu(r) : '') + '<label class="fld" style="margin-top:12px">' + HM.esc(tc('ghiChu')) + '</label><textarea class="in" rows="3" data-o="note"></textarea>', dong: status === 'confirmed' ? tc('xacNhan') : tc('go') })
      .then(function (f) {
        if (!f) return;
        try { A.setAlertStatus(id, status, f.note, A.staff.me.name); c.thongBao(xong, 'ok'); c.veLai(); }
        catch (err) { c.thongBao(err.message, 'no'); }
      });
    }
    HM.bam(root, '[data-xn]', function (el, e) { e.stopPropagation(); hanhDong(+el.getAttribute('data-xn'), 'confirmed', tc('hoiXn'), tc('hoiXnMo'), tc('daXn')); });
    HM.bam(root, '[data-go]', function (el, e) { e.stopPropagation(); hanhDong(+el.getAttribute('data-go'), 'resolved', tc('hoiGo'), tc('hoiGoMo'), tc('daGo')); });
    HM.bam(root, 'tr[data-cl], tr[data-md]', function (el, e) {
      if (e.target.closest('button')) return;
      var id = +(el.getAttribute('data-cl') || el.getAttribute('data-md')), a;
      try { a = A.asset(id); } catch (err) { return; }
      HTS.moNgan(c, a, { noiBo: true, tien: c.tien2, tien0: c.tien, playlists: A.playlistsOf(id), tabDau: 'cl' });
    });
    ganTabCha(root, c);
}

})();
