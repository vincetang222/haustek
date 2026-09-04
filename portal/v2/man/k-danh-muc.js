/* =====================================================================
   CỔNG ĐỐI TÁC · DANH MỤC BÀI HÁT
   ---------------------------------------------------------------------
   Trang "Bài hát của tôi" chỉ liệt kê bài có doanh thu trong một kỳ.
   Trang này trả lời câu hỏi còn lại: TOÀN BỘ bài hát của tôi, kể cả bài
   chưa có doanh thu, đang ở bước nào của quy trình phát hành, đã lên
   nền tảng nào, còn thiếu gì. Với label là bài của các nghệ sĩ trong
   label; với nghệ sĩ là bài của chính mình.

   Danh mục là của bài hát, không của kỳ, nên trang không đổi theo kỳ
   đang chọn. Hai cột số cuối (lượt nghe, doanh thu gộp) là tích luỹ các
   kỳ đã xét duyệt.

   Lọc, sắp xếp, phân trang đều do api.catalogue làm; trang chỉ giữ
   trạng thái đang xem trong LOC rồi vẽ lại.
   ===================================================================== */
"use strict";
(function () {

/* Hồ sơ bài hát dùng chung (haustek-taisan.js) gọi HT.fmt.date() khi vẽ
   quy trình và đầu ngăn, nhưng khung chỉ có HT.fmt.ngay(). Bù tạm ở đây
   để ngăn mở được; chỗ đúng của dòng này là haustek-shell.js. */
if (HT.fmt && !HT.fmt.date) HT.fmt.date = HT.fmt.ngay;

var LOC = { tim: '', giaiDoan: '', sap: 'releaseDate', huong: -1, trang: 0, co: 25 };
var GIAI_DOAN = ['', 'live', 'processing', 'issue', 'missing'];
var NHAN_LOC = { '': 'locAll', live: 'locLive', processing: 'locProcessing', issue: 'locIssue', missing: 'locMissing' };
var CHU_GD = { live: 'gdLive', processing: 'gdProcessing', issue: 'gdIssue' };
var XUAT_TOI_DA = 1000;

HT.dangKy({
  id: 'k-danh-muc', nav: 'navDanhMuc', icon: 'layers',

  chu: {
    vi: {
      navDanhMuc: 'Danh mục', h1: 'Danh mục bài hát',
      moLb: 'Toàn bộ bài hát của các nghệ sĩ thuộc label, kể cả bài chưa có doanh thu: đang ở bước nào của quy trình phát hành, đã lên nền tảng nào và còn thiếu gì.',
      moNs: 'Toàn bộ bài hát của bạn, kể cả bài chưa có doanh thu: đang ở bước nào của quy trình phát hành, đã lên nền tảng nào và còn thiếu gì.',
      kTong: 'Bài hát', kLive: 'Đã lên đủ nền tảng', kProcessing: 'Đang xử lý', kIssue: 'Có vấn đề', kMissing: 'Còn thiếu thông tin',
      locAll: 'Tất cả', locLive: 'Đã lên đủ', locProcessing: 'Đang xử lý', locIssue: 'Có vấn đề', locMissing: 'Còn thiếu',
      tim: 'Tìm theo tên bài hát, mã ISRC hoặc nghệ sĩ…',
      cBai: 'Bài hát', cNs: 'Nghệ sĩ', cLoai: 'Loại', cPhatHanh: 'Phát hành', cNenTang: 'Nền tảng',
      cTrangThai: 'Trạng thái', cThieu: 'Còn thiếu', cLuot: 'Lượt nghe', cGop: 'Doanh thu gộp',
      goiY1: 'gợi ý', goiYN: 'gợi ý',
      dangLoc: 'Đang lọc', xoaLoc: 'Xoá bộ lọc', xuat: 'Xuất CSV',
      khong: 'Không tìm thấy bài hát nào',
      khongMo: 'Bạn thử tìm bằng mã ISRC, hoặc xoá nội dung ô tìm kiếm.',
      trongLoc: 'Không có bài hát nào ở trạng thái này',
      trongLocMo: 'Bạn chọn "Tất cả" để xem toàn bộ danh mục.',
      trong: 'Chưa có bài hát nào trong danh mục',
      trongMo: 'Khi Haustek tiếp nhận hồ sơ phát hành của bạn, bài hát sẽ xuất hiện ở đây.',
      loi: 'Chưa tải được danh mục',
      ghiChu: 'Lượt nghe và doanh thu gộp là số tích luỹ của các kỳ đã xét duyệt. Bấm một dòng để xem quy trình phát hành, nền tảng và số liệu theo tháng của bài hát đó.',
      phanLabel: 'Phần label được hưởng', thuNhap: 'Thu nhập của bạn',
      csvLive: 'Nền tảng đã lên', csvTong: 'Tổng nền tảng', csvGoiY: 'Gợi ý', csvNgay: 'Ngày phát hành',
      daCat: 'Danh sách quá dài nên chỉ xuất {n} dòng đầu theo thứ tự đang sắp xếp. Bạn thu hẹp bộ lọc để xuất phần còn lại.'
    },
    en: {
      navDanhMuc: 'Catalogue', h1: 'Track catalogue',
      moLb: 'Every track by artists on your label, earning or not: where it is in the release pipeline, which platforms it is on, and what is still missing.',
      moNs: 'Every track of yours, earning or not: where it is in the release pipeline, which platforms it is on, and what is still missing.',
      kTong: 'Tracks', kLive: 'Live everywhere', kProcessing: 'Processing', kIssue: 'Needs attention', kMissing: 'Missing info',
      locAll: 'All', locLive: 'Live', locProcessing: 'Processing', locIssue: 'Issues', locMissing: 'Missing',
      tim: 'Search title, ISRC, artist…',
      cBai: 'Track', cNs: 'Artist', cLoai: 'Type', cPhatHanh: 'Released', cNenTang: 'Platforms',
      cTrangThai: 'Status', cThieu: 'Missing', cLuot: 'Streams', cGop: 'Gross',
      goiY1: 'suggestion', goiYN: 'suggestions',
      dangLoc: 'Filtered', xoaLoc: 'Clear filters', xuat: 'Export CSV',
      khong: 'No track matches',
      khongMo: 'Try an ISRC, or clear the search box.',
      trongLoc: 'No track in this state',
      trongLocMo: 'Choose "All" to see the whole catalogue.',
      trong: 'No tracks in your catalogue yet',
      trongMo: 'Tracks appear here once Haustek receives your release submission.',
      loi: 'The catalogue could not be loaded',
      ghiChu: 'Streams and gross are cumulative across approved periods. Open a row to see the track’s pipeline, platforms and monthly figures.',
      phanLabel: 'Label keeps', thuNhap: 'Yours',
      csvLive: 'Platforms live', csvTong: 'Platforms total', csvGoiY: 'Suggestions', csvNgay: 'Release date',
      daCat: 'The list is long, so only the first {n} rows in the current order were exported. Narrow the filter to export the rest.'
    }
  },

  /* Số cạnh tên trang: bài đang có vấn đề, tô đỏ. Không có thì để trống. */
  dem: function (c) {
    try {
      var n = c.api.catalogue(c.phien.me.role, c.phien.me.partyId, { limit: 1 }).counts.issue;
      return n ? '!' + HT.fmt.n(n) : '';
    } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t;
    var la = me.role === 'label';

    var tuyChon = function (offset, limit) {
      return { q: LOC.tim, stage: LOC.giaiDoan || undefined, sort: LOC.sap, dir: LOC.huong, offset: offset, limit: limit };
    };
    var kq;
    try {
      kq = api.catalogue(me.role, me.partyId, tuyChon(LOC.trang * LOC.co, LOC.co));
      /* Đổi bộ lọc mà vẫn giữ số trang cũ thì có thể rơi ra ngoài danh
         sách: kéo về trang cuối còn có dòng rồi hỏi lại. */
      var het = Math.max(0, Math.ceil(kq.total / LOC.co) - 1);
      if (LOC.trang > het) { LOC.trang = het; kq = api.catalogue(me.role, me.partyId, tuyChon(LOC.trang * LOC.co, LOC.co)); }
    } catch (e) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) }) +
        HM.the({ than: HM.trong({ icon: 'alert', tieuDe: t('loi'), moTa: e.message }) });
      return;
    }
    var dem = kq.counts, dau = kq.offset;
    var dangLoc = !!(LOC.tim || LOC.giaiDoan);

    var html = HM.dau({
      h1: HM.esc(t('h1')),
      mo: HM.esc(la ? t('moLb') : t('moNs')),
      so: [
        { l: t('kTong'), v: HT.fmt.n(dem.all) },
        { l: t('kLive'), v: HT.fmt.n(dem.live), mau: dem.live ? 'var(--ok)' : '' },
        { l: t('kProcessing'), v: HT.fmt.n(dem.processing) },
        { l: t('kIssue'), v: HT.fmt.n(dem.issue), mau: dem.issue ? 'var(--danger)' : '' },
        { l: t('kMissing'), v: HT.fmt.n(dem.missing), mau: dem.missing ? 'var(--warn)' : '' }
      ]
    });

    /* Thanh lọc: ô tìm, một nút cho mỗi giai đoạn kèm số đếm của toàn
       danh mục (số đếm không đổi theo ô tìm, để người đọc luôn biết bức
       tranh chung), nút xuất. */
    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
        HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      GIAI_DOAN.map(function (k) {
        return '<button type="button" class="pill' + (LOC.giaiDoan === k ? ' on' : '') + '" data-gd="' + k + '">' +
          HM.esc(t(NHAN_LOC[k])) + ' <span class="muted">' + HM.esc(HT.fmt.n(k ? dem[k] : dem.all)) + '</span></button>';
      }).join('') +
      '<div class="sp"></div>' +
      (kq.total ? '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>' : '') +
      '</div>';

    var cot = [
      { k: 'title', l: t('cBai') },
      la ? { k: 'artist', l: t('cNs') } : null,
      { k: 'type', l: t('cLoai'), s: false },
      { k: 'releaseDate', l: t('cPhatHanh') },
      { k: 'live', l: t('cNenTang') },
      { k: 'stage', l: t('cTrangThai'), s: false },
      { k: 'missing', l: t('cThieu'), num: true },
      { k: 'streams', l: t('cLuot'), num: true },
      { k: 'gross', l: t('cGop'), num: true }
    ].filter(Boolean);

    html += HM.the({
      thoBody: true,
      than: kq.rows.length
        ? '<div class="card-h" style="padding-bottom:12px"><div class="pager">' +
            '<button type="button" class="pg" data-tr="-1"' + (LOC.trang === 0 ? ' disabled' : '') + '>' + HM.icon('left') + '</button>' +
            '<button type="button" class="pg" data-tr="1"' + (dau + LOC.co >= kq.total ? ' disabled' : '') + '>' + HM.icon('right') + '</button>' +
          '</div><div class="range">' + HT.fmt.n(dau + 1) + '–' + HT.fmt.n(Math.min(kq.total, dau + kq.rows.length)) +
            ' ' + HM.esc(c.CHU[c.lang].of) + ' ' + HT.fmt.n(kq.total) + '</div>' +
            '<div class="sp"></div>' +
            (dangLoc ? '<button type="button" class="btn sm" data-xoa-loc>' + HM.icon('x') + HM.esc(t('xoaLoc')) + '</button>' : '') +
          '</div>' +
          '<div class="tw"><table class="t"><thead><tr>' + cot.map(function (x) {
            var on = LOC.sap === x.k;
            return '<th class="' + (x.num ? 'num ' : '') + (x.s === false ? '' : 's ') + (on ? 'sorted band' : '') + '"' +
              (x.s === false ? '' : ' data-sx="' + x.k + '"') + '>' +
              HM.esc(x.l) + (on ? '<span class="ar">' + (LOC.huong > 0 ? '↑' : '↓') + '</span>' : '') + '</th>';
          }).join('') + '</tr></thead><tbody>' +
          kq.rows.map(function (r) {
            var thieu = r.missing
              ? '<b style="color:' + (r.stage === 'issue' ? 'var(--danger)' : 'var(--warn)') + '">' + HM.esc(HT.fmt.n(r.missing)) + '</b>'
              : '<span class="nil">—</span>';
            if (r.hints) thieu += '<div class="hint" style="margin-top:0">' +
              HM.esc(HT.fmt.n(r.hints) + ' ' + t(r.hints === 1 ? 'goiY1' : 'goiYN')) + '</div>';
            return '<tr class="pick" data-bg="' + r.id + '">' +
              '<td><div class="t-ttl">' + HM.esc(HM.dai(r.title, 36)) + '</div>' +
              '<div class="t-sub">' + HM.esc(r.isrc) + '</div></td>' +
              (la ? '<td>' + HM.esc(HM.dai(r.artist, 26)) + '</td>' : '') +
              '<td>' + HM.esc(r.type) + '</td>' +
              '<td style="white-space:nowrap">' + HM.esc(HT.fmt.date(r.releaseDate)) + '</td>' +
              '<td style="white-space:nowrap">' + HTS.chamNenTang(r.live, r.total, r.stage) +
                '<b>' + HM.esc(r.live + '/' + r.total) + '</b></td>' +
              '<td>' + HTS.tagGiaiDoan(r.stage) + '</td>' +
              '<td class="num">' + thieu + '</td>' +
              '<td class="num">' + (r.streams ? HM.esc(HT.fmt.n(r.streams)) : '<span class="nil">—</span>') + '</td>' +
              '<td class="num band">' + (r.gross ? HM.esc(HT.fmt.usd0(r.gross)) : '<span class="nil">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="card-f"><span style="flex:1;min-width:0">' + HM.esc(t('ghiChu')) + '</span>' +
            '<span style="white-space:nowrap">' + HM.esc(c.CHU[c.lang].showing) +
            ' <select class="inline-sel" data-co>' + [12, 25, 50, 100].map(function (n) {
              return '<option value="' + n + '"' + (n === LOC.co ? ' selected' : '') + '>' + n + '</option>';
            }).join('') + '</select> ' + HM.esc(c.CHU[c.lang].rows) + '</span></div>'
        : HM.trong({
            icon: LOC.tim ? 'tim' : 'layers',
            tieuDe: LOC.tim ? t('khong') : (LOC.giaiDoan ? t('trongLoc') : t('trong')),
            moTa: LOC.tim ? t('khongMo') : (LOC.giaiDoan ? t('trongLocMo') : t('trongMo')),
            nut: dangLoc ? '<button type="button" class="btn sm" data-xoa-loc>' + HM.esc(t('xoaLoc')) + '</button>' : ''
          })
    });

    root.innerHTML = html;
    HB.gan(root);

    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; LOC.trang = 0; c.veLai(); }, 240);
    HM.bam(root, '[data-gd]', function (el) { LOC.giaiDoan = el.getAttribute('data-gd'); LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-xoa-loc]', function () { LOC.tim = ''; LOC.giaiDoan = ''; LOC.trang = 0; c.veLai(); });
    HM.doi(root, '[data-co]', function (el) { LOC.co = +el.value; LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tr]', function (el) { LOC.trang += +el.getAttribute('data-tr'); c.veLai(); });
    HM.bam(root, '[data-sx]', function (el) {
      var k = el.getAttribute('data-sx');
      if (LOC.sap === k) LOC.huong = -LOC.huong;
      else { LOC.sap = k; LOC.huong = (k === 'title' || k === 'artist') ? 1 : -1; }
      LOC.trang = 0; c.veLai();
    });
    HM.bam(root, '[data-bg]', function (el) { moHoSo(c, +el.getAttribute('data-bg'), la); });
    HM.bam(root, '[data-xuat]', function () { xuatCsv(c, kq.total, tuyChon); });
  }
});

/* Ngăn trượt hồ sơ một bài hát: quy trình, nền tảng, theo tháng. Bộ khuôn
   dùng chung với cổng nội bộ, chỉ khác nhãn cột tiền cuối. */
function moHoSo(c, id, la) {
  var d;
  try { d = c.api.trackAsset(c.phien.me.role, c.phien.me.partyId, id); }
  catch (e) { c.thongBao(e.message, 'no'); return; }
  HTS.moNgan(c, d, { mineLabel: la ? c.t('phanLabel') : c.t('thuNhap'), tien: HT.fmt.usd, tien0: HT.fmt.usd0 });
}

/* Xuất toàn bộ kết quả đang lọc theo thứ tự đang sắp xếp. API trả tối đa
   200 dòng một lần nên gọi nhiều lần; quá 1000 dòng thì dừng và nói rõ. */
function xuatCsv(c, tong, tuyChon) {
  var api = c.api, me = c.phien.me, t = c.t;
  var dong = [], off = 0, muc = Math.min(tong, XUAT_TOI_DA);
  while (off < muc) {
    var r = api.catalogue(me.role, me.partyId, tuyChon(off, Math.min(200, muc - off)));
    if (!r.rows.length) break;
    dong = dong.concat(r.rows);
    off += r.rows.length;
  }
  HM.csv('danh-muc-' + me.clientId + '.csv',
    ['ISRC', t('cBai'), t('cNs'), t('cLoai'), t('csvNgay'), t('cTrangThai'), t('csvLive'), t('csvTong'),
     t('cThieu'), t('csvGoiY'), t('cLuot'), t('cGop') + ' USD'],
    dong.map(function (r) {
      return [r.isrc, r.title, r.artist, r.type, r.releaseDate, HTS.t(CHU_GD[r.stage] || r.stage),
              r.live, r.total, r.missing, r.hints, r.streams, r.gross.toFixed(2)];
    }));
  if (tong > XUAT_TOI_DA) c.thongBao(t('daCat').replace('{n}', HT.fmt.n(XUAT_TOI_DA)), 'no');
}

})();
