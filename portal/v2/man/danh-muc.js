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

var LOC = { tim: '', loai: '', chu: '', coTien: true, maPhu: false, vanDe: false, thieu: false,
            sap: 'gross', huong: -1, trang: 0, co: 25 };

/* Hồ sơ bản ghi dùng chung (HTS) định dạng ngày bằng HT.fmt.date, nhưng
   khung hiện chỉ có HT.fmt.ngay. Gán tạm ở đây để ngăn bản ghi mở được;
   khi khung bổ sung hàm này thì dòng dưới không làm gì nữa. */
if (typeof HT.fmt.date !== 'function') HT.fmt.date = HT.fmt.ngay;

HT.dangKy({
  id: 'danh-muc', nav: 'navDanhMuc', nhom: 'nhomDuLieu', icon: 'disc',

  chu: {
    vi: {
      nhomDuLieu: 'Danh mục', navDanhMuc: 'Danh mục', h1: 'Danh mục bản ghi',
      mo: 'Toàn bộ bản ghi Haustek đang phân phối. Bấm vào một dòng để xem dòng tiền, quy trình phát hành và số liệu theo nền tảng của bản ghi đó.',
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
      maPhuMo: 'Bản ghi này có hai mã ISRC. Báo cáo về theo từng mã riêng nên phải gộp lại. Nếu không gộp, một bản ghi sẽ tách thành hai dòng rời, mỗi dòng chỉ có một nửa doanh thu. Đây là câu hỏi cần chốt số 2.',
      chuaNhap: 'chưa nhập báo cáo cho kỳ này',
      xuat: 'Xuất CSV', hienThi: 'Đang hiển thị'
    },
    en: {
      nhomDuLieu: 'Data', navDanhMuc: 'Catalogue', h1: 'Recording catalogue',
      mo: 'Every recording Haustek distributes. Open a row to see its money, its release pipeline and its per-platform figures.',
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
      maPhuMo: 'This track carries two ISRCs. Reports arrive against each code separately and must be merged — unmerged, one track shows as two disconnected rows, each with half the money. This is open question 2.',
      chuaNhap: 'not loaded for this period',
      xuat: 'Export CSV', hienThi: 'Showing'
    }
  },

  ve: function (root, c) {
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

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
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

    root.innerHTML = html;

    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; LOC.trang = 0; c.veLai(); }, 260);
    HM.doi(root, '[data-loai]', function (el) { LOC.loai = el.value; LOC.trang = 0; c.veLai(); });
    HM.doi(root, '[data-chu]', function (el) { LOC.chu = el.value; LOC.trang = 0; c.veLai(); });
    HM.doi(root, '[data-co]', function (el) { LOC.co = +el.value; LOC.trang = 0; c.veLai(); });
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
         'Lượt nghe', 'Doanh thu gộp USD', 'Phí dịch vụ Haustek', 'Phần label/Haustek được hưởng', 'Điểm producer', 'Phần nghệ sĩ được hưởng'],
        lay.map(function (i) {
          var tr = A.track(i), g = A.grossRec(i, pi);
          var sp = A.splitRec(i, g, c.kyKey);
          return [tr.isrc, tr.isrcAlt, tr.upc, tr.title, tr.type, tr.artist,
                  A.artistOf(i).clientId, tr.label || 'Độc lập', tr.releasePeriod,
                  A.streamsOf(i, pi), g.toFixed(2), sp.fee.toFixed(2), sp.labelCut.toFixed(2),
                  sp.producer.toFixed(2), sp.artist.toFixed(2)];
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
      { t: vi ? 'Điểm producer' : 'Producer points',
        v: tr.producerPts ? HT.fmt.pct(tr.producerPts) + (vi ? ', khấu trừ từ phần nghệ sĩ' : ' — off the artist share') : '—' }
    ]) +
    '<h4 class="sec">' + HM.esc(c.t('ctSt')) + '</h4>' +
    HM.kv([
      { t: tr.writer1, v: HT.fmt.pct(tr.writer1Share) },
      tr.writer2 ? { t: tr.writer2, v: HT.fmt.pct(1 - tr.writer1Share) } : null
    ]) +
    '<div class="hint">' + HM.esc(vi
      ? 'Tác quyền được chia theo bảng này, tách riêng khỏi doanh thu bản ghi và không đi qua label.'
      : 'Publishing follows this table, entirely separate from the recording revenue, and never passes through a label.') + '</div>';

  HTS.moNgan(c, d, {
    noiBo: true, tien: c.tien2, tien0: c.tien, tabDau: 'tien',
    them: [
      { k: 'tien', l: c.t('tabTien'), html: tienHtml, khiMo: function (panel) { HB.gan(panel); } },
      { k: 'thongtin', l: c.t('tabTt'), html: ttHtml }
    ]
  });
}

})();
