/* =====================================================================
   NỘI BỘ · NHẬP SỐ LIỆU
   ---------------------------------------------------------------------
   Trang này là chỗ điều phối viên ngồi mỗi ngày. Mọi trang khác chỉ đọc
   lại thứ được gõ ở đây, nên nếu có một trang phải chạy nhanh, gọn, không
   bắt bấm nhiều thì là trang này.

   Bốn việc, đúng theo nhịp thật của công việc:
     · mỗi ngày — soát lượt nghe, ngày nào nguồn chưa về thì gõ vào;
     · mỗi tháng — báo cáo nền tảng về thì gõ tổng của nguồn đó vào kỳ;
     · khi cần — gõ số của từng bài, đè lên phần chia đều;
     · bất cứ lúc nào — mở nhật ký xem ai gõ gì, gõ nhầm thì gỡ.

   Số gõ tay luôn thắng số máy sinh. Bảng luôn hiện cả hai để người gõ
   thấy mình vừa làm lệch bao nhiêu so với ước tính — lệch nhiều thường
   là gõ nhầm đơn vị tiền hoặc nhầm kỳ, không phải thị trường đổi.
   ===================================================================== */
"use strict";
(function () {

var TAB = 'ngay';
var CHON = { pIdx: null, fId: 0, q: '', ngay: null, bai: null, qBai: '' };

HT.dangKy({
  id: 'nhap-so-lieu', nav: 'navNhap', nhom: 'nhomVanHanh', icon: 'down2',
  vai: ['ops', 'accounting', 'mgmt'],

  chu: {
    vi: {
      navNhap: 'Nhập số liệu', h1: 'Nhập số liệu',
      mo: 'Chỗ gõ số từ OneRPM, Warner, Believe, YouTube CMS vào hệ thống. Số gõ tay thắng số ước tính.',
      tNgay: 'Lượt nghe hằng ngày', tSoat: 'Đối soát theo bài', tTien: 'Doanh thu theo kỳ', tBai: 'Doanh thu theo bài', tSu: 'Nhật ký nhập',
      dsTieu: 'Đối soát nền tảng ngày {d}', dsMo: 'Mở bảng điều khiển của từng nền tảng, đọc số của ngày đó rồi gõ vào. Lệch dưới {p} coi là khớp; lệch hơn thì đánh dấu đỏ để xem lại, không tự sửa số.',
      dsNt: 'Nền tảng', dsHt: 'Số hệ thống', dsTt: 'Số trên nền tảng', dsLech: 'Lệch', dsTrang: 'Trạng thái',
      dsKhop: 'Khớp', dsLechT: 'Lệch', dsCho: 'Chưa đối soát', dsLuu: 'Đối soát', dsBo: 'Bỏ đối soát',
      dsDa: 'Đã đối soát {n}: lệch {l}', dsDaBo: 'Đã bỏ đối soát {n}',
      dsChonNgay: 'Đối soát ngày này', dsDangXem: 'đang đối soát',
      dsTong: 'Tổng ngày sau đối soát', dsTongMo: 'Nền tảng đã đối soát lấy số vừa gõ, phần còn lại giữ số hệ thống. Cả sản phẩm chỉ có một con số cho một ngày.',

      sbTieu: 'Đối soát một bài theo đường dẫn store', sbMo: 'Mỗi bài đã lên kệ có đường dẫn tới từng nền tảng. Mở link, đọc số của ngày, gõ vào đây. Dùng khi một bài trông lạ, không phải để chạy hằng ngày.',
      sbTim: 'Tìm bài theo tên hoặc ISRC', sbChon: 'Chọn một bài để mở đường dẫn store',
      sbGoiY: 'Bài nghe nhiều nhất bảy ngày qua', sbGoiYMo: 'Chưa gõ gì thì đây là những bài đáng soát trước; gõ tên hoặc ISRC để tìm bài khác.',
      ckTieu: 'Số công khai trên store', ckKhongTien: 'không dùng để tính tiền',
      ckMo: 'Số nền tảng hiện công khai trên trang bài. Đây là số CỘNG DỒN từ ngày phát hành, và nền tảng đếm khác với lượt nghe được trả tiền. Dùng để thấy sớm bài đang lên hay bị gỡ, không dùng để tính tiền — tiền vẫn theo báo cáo của nhà phân phối.',
      ckNt: 'Nền tảng', ckSo: 'Số mới nhất', ckNgayDoc: 'Đọc ngày', ckNhip: 'Bình quân mỗi ngày', ckGo: 'Số đọc được',
      ckLuu: 'Ghi', ckXoa: 'Bỏ', ckMoLink: 'Mở trang', ckChuaCo: 'chưa đọc lần nào',
      ckKhongCo: 'Nền tảng này không công bố số ra ngoài',
      ckLui: 'Số lùi so với lần trước — nền tảng tính lại hoặc bài bị gỡ bớt. Kiểm lại trước khi tin.',
      ckLan: '{n} lần đọc', ckDa: 'Đã ghi {n}', ckDaXoa: 'Đã bỏ lần đọc ngày {d}',
      ckChuaLink: 'Bài này chưa có link store nào. Dán link ở trang Phiếu giao việc phát hành trước.',
      ckTuDong: 'Đọc tự động',
      sbNgay: 'Ngày đối soát', sbLuot: 'Lượt nghe cả bài trong ngày', sbMoLink: 'Mở link',
      sbCoCau: 'Số hệ thống của từng nền tảng suy từ cơ cấu nền tảng của chính bài ấy ở kỳ gần nhất; cơ cấu đổi chậm nên dùng cho một ngày là đủ sát.',
      sbKhongLink: 'Bài này chưa có đường dẫn store nào — thường là chưa lên kệ.',
      sbDa: 'Đã đối soát {n} cho {t}',
      kNgayThieu: 'Ngày chờ nhập', kNgayThieuS: 'nguồn nền tảng chậm 1–2 ngày là bình thường',
      kNguonThieu: 'Nguồn chưa có số', kNguonThieuS: 'trên mọi kỳ chưa xét duyệt',
      kDaGo: 'Dòng đã gõ tay', kDaGoS: 'đang đè lên số ước tính',
      kDoanhThu: 'Doanh thu đang ghi sổ', kDoanhThuS: 'cả 12 kỳ, chỉ nguồn đã có số',

      cNgay: 'Ngày', cLuot: 'Lượt nghe', cUoc: 'Ước tính', cTrangThai: 'Trạng thái', cNguoi: 'Người nhập', cTT: 'Thao tác',
      sTay: 'Đã nhập tay', sTuDong: 'Tự động', sCho: 'Chờ nhập',
      goNgay: 'Nhập lượt nghe ngày {d}', goNgayMo: 'Tổng lượt nghe cả danh mục trong ngày đó, cộng mọi nền tảng. Lấy trên bảng điều khiển của từng nền tảng rồi cộng lại.',
      lLuot: 'Tổng lượt nghe', traTuDong: 'Trả về số tự động', daGoNgay: 'Đã ghi {d}: {v} lượt', daTraNgay: 'Đã trả ngày {d} về số tự động',
      ngayMo: 'Phần mềm tự cập nhật những ngày đã có số. Chỉ ngày nào nguồn chưa về mới cần gõ, và chỉ cần tổng.',

      cKy: 'Kỳ', cTong: 'Đang ghi sổ', cChot: 'Số đã chốt', cLech: 'Lệch ước tính', cDuyet: 'Kỳ',
      chuaCo: 'chưa có số', daDuyet: 'đã xét duyệt', dangMo: 'đang mở',
      goKy: 'Nhập doanh thu · {f} · {p}', goKyMo: 'Tổng tiền của nguồn này trong kỳ này, lấy thẳng trên báo cáo. Những bài chưa gõ riêng sẽ chia theo tỷ trọng để cộng lại đúng bằng số này.',
      lTien: 'Tổng doanh thu nguồn (USD)', lNguon: 'Lấy số từ đâu', lGhiChu: 'Ghi chú (tên file, ngày tải)',
      daGoKy: 'Đã ghi {f} · {p}: {v}', uoc: 'Ước tính', dangCo: 'Đang ghi sổ',
      tienMo: 'Mỗi ô là một nguồn trong một kỳ. Bấm để gõ tổng lấy từ báo cáo. Kỳ đã xét duyệt thì khoá lại.',

      chonKy: 'Kỳ', chonNguon: 'Nguồn', timBai: 'Tìm tên bài hoặc ISRC', cBai: 'Bài hát', cIsrc: 'Mã ISRC',
      goBai: 'Gõ số cho bài này', luuBai: 'Lưu', daGoBai: 'Đã ghi {t}: {v}', goiY: 'Đang hiện những bài có doanh thu lớn nhất kỳ. Gõ để tìm bài khác.',
      dan: 'Dán từ bảng tính', danMo: 'Bôi đen cột ISRC và cột tiền trên báo cáo rồi dán vào đây. Mỗi dòng một bài, ngăn cách bằng tab, dấu phẩy hoặc chấm phẩy. Dòng nào không tra được ISRC thì bỏ qua và báo lại.',
      danNut: 'Nhận khối này', danXong: 'Đã nhận {a} dòng, bỏ qua {b} dòng', danKhong: 'Không nhận được dòng nào. Kiểm lại cột ISRC.',
      danBo: 'Dòng bị bỏ qua',
      baiMo: 'Chỉ gõ theo bài khi báo cáo có dòng riêng cho bài đó. Bài đã gõ tay không bị chia lại khi bạn sửa tổng của nguồn.',
      daTay: 'đã gõ tay',

      cLuc: 'Lúc', cKieu: 'Kiểu', cDoiTuong: 'Nội dung', cTruoc: 'Số trước', cSau: 'Số sau',
      kieuKy: 'Tổng nguồn', kieuBai: 'Theo bài', go: 'Gỡ', hoiGo: 'Gỡ dòng vừa nhập',
      hoiGoMo: 'Gỡ xong số quay về mức trước đó. Việc này có ghi nhật ký.', daGo: 'Đã gỡ dòng {id}',
      suMo: 'Sáu mươi dòng gần nhất. Gỡ một dòng là trả số về đúng mức trước khi gõ.',
      trongSu: 'Chưa ai gõ số nào. Bảng bên trái vẫn đang chạy bằng số ước tính.',

      in: 'Bản in', inTieu: 'Nhật ký nhập số liệu', inPhu: 'Ai gõ số nào, lúc nào, và số trước đó là bao nhiêu.',
      qt: 'Quy trình mỗi ngày'
    },
    en: {
      navNhap: 'Data entry', h1: 'Data entry',
      mo: 'Where figures from OneRPM, Warner, Believe and YouTube CMS are keyed in. Keyed figures beat estimates.',
      tNgay: 'Daily streams', tSoat: 'Reconcile a track', tTien: 'Revenue by period', tBai: 'Revenue by track', tSu: 'Entry log',
      dsTieu: 'Platform reconciliation for {d}', dsMo: 'Open each platform’s dashboard, read that day’s figure and key it in. Under {p} counts as matching; more than that is flagged red for review — nothing is silently corrected.',
      dsNt: 'Platform', dsHt: 'System figure', dsTt: 'Platform figure', dsLech: 'Difference', dsTrang: 'Status',
      dsKhop: 'Matches', dsLechT: 'Off', dsCho: 'Not reconciled', dsLuu: 'Reconcile', dsBo: 'Undo',
      dsDa: 'Reconciled {n}: off by {l}', dsDaBo: 'Undid the {n} reconciliation',
      dsChonNgay: 'Reconcile this day', dsDangXem: 'being reconciled',
      dsTong: 'Day total after reconciliation', dsTongMo: 'Reconciled platforms use the keyed figure; the rest keep the system figure. One number per day across the whole product.',

      sbTieu: 'Reconcile one track through its store links', sbMo: 'Every released track has a link to each platform. Open it, read the day’s figure, key it in. For when a track looks odd — not for the daily loop.',
      sbTim: 'Search by title or ISRC', sbChon: 'Pick a track to open its store links',
      sbGoiY: 'Most-streamed tracks of the last seven days', sbGoiYMo: 'With no search these are the ones worth checking first; type a title or ISRC to find another.',
      ckTieu: 'Public figures on the stores', ckKhongTien: 'not used for money',
      ckMo: 'What the platform shows publicly on the track page. It is CUMULATIVE since release, and platforms count plays differently from royalty-bearing streams. Use it to spot a track rising or being pulled, never to compute money — money still follows the distributor’s report.',
      ckNt: 'Platform', ckSo: 'Latest figure', ckNgayDoc: 'Read on', ckNhip: 'Average per day', ckGo: 'Figure you read',
      ckLuu: 'Save', ckXoa: 'Remove', ckMoLink: 'Open page', ckChuaCo: 'never read',
      ckKhongCo: 'This platform publishes no figure',
      ckLui: 'The figure went down since last time — the platform recounted, or content was pulled. Check before trusting it.',
      ckLan: '{n} readings', ckDa: 'Saved {n}', ckDaXoa: 'Removed the reading for {d}',
      ckChuaLink: 'This track has no store link yet. Paste one on the delivery worksheet first.',
      ckTuDong: 'Read automatically',
      sbNgay: 'Date', sbLuot: 'The track’s streams that day', sbMoLink: 'Open',
      sbCoCau: 'Each platform’s system figure comes from that track’s own platform mix in the most recent period; the mix moves slowly, so it is close enough for one day.',
      sbKhongLink: 'This track has no store links yet — usually it is not live.',
      sbDa: 'Reconciled {n} for {t}',
      kNgayThieu: 'Days awaiting entry', kNgayThieuS: 'platform feeds run one to two days behind',
      kNguonThieu: 'Feeds with no figure', kNguonThieuS: 'across all unapproved periods',
      kDaGo: 'Hand-keyed rows', kDaGoS: 'currently overriding the estimate',
      kDoanhThu: 'Revenue on the books', kDoanhThuS: 'all 12 periods, feeds with a figure only',

      cNgay: 'Date', cLuot: 'Streams', cUoc: 'Estimate', cTrangThai: 'Status', cNguoi: 'Entered by', cTT: 'Actions',
      sTay: 'Keyed in', sTuDong: 'Automatic', sCho: 'Awaiting entry',
      goNgay: 'Enter streams for {d}', goNgayMo: 'Total catalogue streams that day across every platform. Take each platform’s daily total and add them up.',
      lLuot: 'Total streams', traTuDong: 'Back to automatic', daGoNgay: 'Recorded {d}: {v} streams', daTraNgay: '{d} is back on the automatic figure',
      ngayMo: 'The software keeps the settled days up to date on its own. Only days the feed has not reached need keying, and only the total.',

      cKy: 'Period', cTong: 'On the books', cChot: 'Figure keyed', cLech: 'vs estimate', cDuyet: 'Period',
      chuaCo: 'no figure', daDuyet: 'approved', dangMo: 'open',
      goKy: 'Enter revenue · {f} · {p}', goKyMo: 'This feed’s total for this period, straight off the report. Tracks without their own figure are scaled so they add up to exactly this.',
      lTien: 'Feed revenue total (USD)', lNguon: 'Where the figure came from', lGhiChu: 'Note (file name, download date)',
      daGoKy: 'Recorded {f} · {p}: {v}', uoc: 'Estimate', dangCo: 'On the books',
      tienMo: 'Each cell is one feed in one period. Click to key in the report total. Approved periods are locked.',

      chonKy: 'Period', chonNguon: 'Feed', timBai: 'Search title or ISRC', cBai: 'Track', cIsrc: 'ISRC code',
      goBai: 'Key a figure for this track', luuBai: 'Save', daGoBai: 'Recorded {t}: {v}', goiY: 'Showing the period’s largest earners. Type to find another track.',
      dan: 'Paste from a spreadsheet', danMo: 'Select the ISRC column and the amount column on the report and paste them here. One track per line, separated by a tab, comma or semicolon. Lines whose ISRC cannot be matched are skipped and listed back.',
      danNut: 'Take this block', danXong: 'Took {a} lines, skipped {b}', danKhong: 'Nothing could be taken. Check the ISRC column.',
      danBo: 'Skipped lines',
      baiMo: 'Key a track only when the report itemises it. Hand-keyed tracks are not rescaled when you change the feed total.',
      daTay: 'keyed',

      cLuc: 'When', cKieu: 'Kind', cDoiTuong: 'What', cTruoc: 'Was', cSau: 'Now',
      kieuKy: 'Feed total', kieuBai: 'Per track', go: 'Undo', hoiGo: 'Undo this entry',
      hoiGoMo: 'The figure returns to what it was before. The undo is logged.', daGo: 'Undid {id}',
      suMo: 'The last sixty rows. Undoing one returns the figure to what it was before it was keyed.',
      trongSu: 'Nothing keyed yet. The tables are still running on estimates.',

      in: 'Print view', inTieu: 'Data entry log', inPhu: 'Who keyed what, when, and what it was before.',
      qt: 'The daily routine'
    }
  },

  dem: function (c) {
    try { var x = c.A.nhapLieu.conThieu(); return x.tong ? '!' + x.tong : ''; } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var thieu = A.nhapLieu.conThieu();
    var bang = A.nhapLieu.bang();
    var daGo = A.nhapLieu.nhatKy(999).length;
    var tongSo = bang.reduce(function (s, r) { return s + r.thuc; }, 0);
    if (CHON.pIdx == null) {
      var mo = bang.filter(function (r) { return !r.duyet; })[0];
      CHON.pIdx = mo ? mo.pIdx : bang.length - 1;
    }

    var html = HM.dau({
      h1: HM.esc(t('h1')), mo: HM.esc(t('mo')),
      nut: '<button type="button" class="btn sm ghost" data-in>' + HM.icon('file') + HM.esc(t('in')) + '</button>'
    });
    html += HM.so([
      { l: t('kNgayThieu'), v: HT.fmt.n(thieu.ngay), s: t('kNgayThieuS'), mau: thieu.ngay ? HB.mau('warn') : HB.mau('ok') },
      { l: t('kNguonThieu'), v: HT.fmt.n(thieu.ky), s: t('kNguonThieuS'), mau: thieu.ky ? HB.mau('warn') : HB.mau('ok') },
      { l: t('kDaGo'), v: HT.fmt.n(daGo), s: t('kDaGoS'), mau: daGo ? HB.mau('ok') : '' },
      { l: t('kDoanhThu'), v: c.tien(tongSo), s: t('kDoanhThuS'), lon: true }
    ]);
    html += HM.tabs([
      { k: 'ngay', l: t('tNgay'), icon: 'cal', dem: thieu.lech ? '!' + thieu.lech : undefined },
      { k: 'soat', l: t('tSoat'), icon: 'link' },
      { k: 'tien', l: t('tTien'), icon: 'cash' },
      { k: 'bai', l: t('tBai'), icon: 'disc' },
      { k: 'su', l: t('tSu'), icon: 'clock' }
    ], TAB);

    if (TAB === 'ngay') html += veNgay(c);
    if (TAB === 'soat') html += veSoatBai(c);
    if (TAB === 'tien') html += veTien(c, bang);
    if (TAB === 'bai') html += veBai(c, bang);
    if (TAB === 'su') html += veSu(c);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { TAB = el.getAttribute('data-tab'); c.veLai(); });
    HM.bam(root, '[data-in]', function () { inRa(c); });
    HM.bam(root, '[data-o-ngay]', function (el) { goNgay(c, el.getAttribute('data-o-ngay'), el.getAttribute('data-uoc')); });
    HM.bam(root, '[data-tra-ngay]', function (el) {
      var d = el.getAttribute('data-tra-ngay');
      try { A.nhapLieu.xoaNgay(d, A.staff.me.name); c.thongBao(t('daTraNgay').replace('{d}', HT.fmt.ngay(d)), 'ok'); HM.quenHet(); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-o-ky]', function (el) {
      var v = el.getAttribute('data-o-ky').split(':');
      goKy(c, +v[0], +v[1]);
    });
    HM.doi(root, '[data-chon-ky]', function (el) { CHON.pIdx = +el.value; c.veLai(); });
    HM.doi(root, '[data-chon-nguon]', function (el) { CHON.fId = +el.value; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { CHON.q = el.value; c.veLai(); });
    HM.bam(root, '[data-luu-bai]', function (el) {
      var i = +el.getAttribute('data-luu-bai');
      var o = root.querySelector('[data-so-bai="' + i + '"]');
      var v = o ? o.value : '';
      if (v === '') return;
      try {
        var e2 = A.nhapLieu.ghiBai(CHON.pIdx, CHON.fId, i, parseFloat(String(v).replace(',', '.')), { nguon: nguonMacDinh(A) }, A.staff.me.name);
        c.thongBao(t('daGoBai').replace('{t}', e2.tenBai).replace('{v}', c.tien2(e2.tien)), 'ok');
        HM.quenHet(); c.veLai();
      } catch (err) { c.thongBao(err.message, 'no'); }
    });
    HM.bam(root, '[data-soat-ngay]', function (el) { CHON.ngay = el.getAttribute('data-soat-ngay'); c.veLai(); });
    HM.doi(root, '[data-soat-chon-ngay]', function (el) { CHON.ngay = el.value; c.veLai(); });
    HM.nhap(root, '[data-tim-bai]', function (el) { CHON.qBai = el.value; c.veLai(); });
    HM.bam(root, '[data-chon-bai]', function (el) { CHON.bai = +el.getAttribute('data-chon-bai'); c.veLai(); });
    HM.bam(root, '[data-luu-nt]', function (el) {
      var nt = el.getAttribute('data-luu-nt');
      var o = root.querySelector('[data-so-nt="' + nt.replace(/"/g, '\\"') + '"]');
      if (!o || o.value === '') return;
      try {
        var kq = A.nhapLieu.ghiDoiSoat(CHON.ngay, nt, parseFloat(o.value), {}, A.staff.me.name);
        var h = kq.filter(function (x) { return x.plat === nt; })[0];
        c.thongBao(t('dsDa').replace('{n}', nt).replace('{l}', h.lechPct == null ? '—' : HT.fmt.pct(h.lechPct)), h.trangThai === 'lech' ? 'no' : 'ok');
        HM.quenHet(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-bo-nt]', function (el) {
      var nt = el.getAttribute('data-bo-nt');
      try { A.nhapLieu.boDoiSoat(CHON.ngay, nt, A.staff.me.name); c.thongBao(t('dsDaBo').replace('{n}', nt), 'ok'); HM.quenHet(); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-luu-bai-nt]', function (el) {
      var nt = el.getAttribute('data-luu-bai-nt');
      var o = root.querySelector('[data-so-bai-nt="' + nt.replace(/"/g, '\\"') + '"]');
      if (!o || o.value === '' || CHON.bai == null) return;
      try {
        var kq = A.nhapLieu.ghiDoiSoatBai(CHON.bai, CHON.ngay, nt, parseFloat(o.value), A.staff.me.name);
        c.thongBao(t('sbDa').replace('{n}', nt).replace('{t}', kq.title), 'ok');
        HM.quenHet(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-ck-luu]', function (el) {
      var nt = el.getAttribute('data-ck-luu');
      var o = root.querySelector('[data-ck="' + nt.replace(/"/g, '\\"') + '"]');
      if (!o || o.value === '' || CHON.bai == null) return;
      try {
        var isrc = A.nhapLieu.baiNgay(CHON.bai, CHON.ngay).isrc;
        A.soCongKhai.ghi(isrc, nt, CHON.ngay, parseInt(o.value, 10), A.staff.me.name);
        c.thongBao(t('ckDa').replace('{n}', nt), 'ok'); HM.quenHet(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-ck-xoa]', function (el) {
      var nt = el.getAttribute('data-ck-xoa');
      if (CHON.bai == null) return;
      try {
        var isrc = A.nhapLieu.baiNgay(CHON.bai, CHON.ngay).isrc;
        var hang = A.soCongKhai.cua(isrc).find(function (x) { return x.plat === nt; });
        if (!hang || !hang.moiNhat) return;
        A.soCongKhai.xoa(isrc, nt, hang.moiNhat.ngay, A.staff.me.name);
        c.thongBao(t('ckDaXoa').replace('{d}', HT.fmt.ngay(hang.moiNhat.ngay)), 'ok'); HM.quenHet(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-bo-bai-nt]', function (el) {
      var nt = el.getAttribute('data-bo-bai-nt');
      if (CHON.bai == null) return;
      try { A.nhapLieu.boDoiSoatBai(CHON.bai, CHON.ngay, nt, A.staff.me.name); c.thongBao(t('dsDaBo').replace('{n}', nt), 'ok'); HM.quenHet(); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-nhan-dan]', function () {
      var o = root.querySelector('[data-dan]');
      if (!o || !o.value.trim()) return;
      try {
        var kq = A.nhapLieu.danBai(CHON.pIdx, CHON.fId, o.value, { nguon: nguonMacDinh(A) }, A.staff.me.name);
        if (!kq.ok.length) { c.thongBao(t('danKhong'), 'no'); return; }
        c.thongBao(t('danXong').replace('{a}', kq.ok.length).replace('{b}', kq.bo.length), 'ok');
        if (kq.bo.length) {
          c.hoiThoai({ tieuDe: t('danBo') + ' · ' + kq.bo.length, moTa: HM.esc(t('danMo')),
            than: '<ul class="say-list">' + kq.bo.slice(0, 20).map(function (x) {
              return '<li>' + HM.esc((c.lang === 'en' ? 'Line ' : 'Dòng ') + x.dong + ' · ' + x.ly + ' · ' + HM.dai(x.chu, 40)) + '</li>';
            }).join('') + '</ul>', huy: false, dong: c.lang === 'en' ? 'Close' : 'Đóng' });
        }
        HM.quenHet(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
    HM.bam(root, '[data-go]', function (el) {
      var id = el.getAttribute('data-go');
      c.xacNhan(t('hoiGo'), HM.esc(t('hoiGoMo')), t('go'), true).then(function (ok) {
        if (!ok) return;
        try { A.nhapLieu.go(id, A.staff.me.name); c.thongBao(t('daGo').replace('{id}', id), 'ok'); HM.quenHet(); c.veLai(); }
        catch (e) { c.thongBao(e.message, 'no'); }
      });
    });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
  }
});

function nguonMacDinh(A) { return A.nhapLieu.nguon()[0].id; }

/* =====================================================================
   TAB 1 — LƯỢT NGHE HẰNG NGÀY
   Việc lặp mỗi ngày. Bảng xếp ngày mới nhất lên đầu vì đó là ngày duy
   nhất người dùng thật sự cần chạm tới.
   ===================================================================== */
function veNgay(c) {
  var A = c.A, t = c.t;
  var ds = A.nhapLieu.ngay(30);
  var cho = ds.filter(function (x) { return x.trangThai === 'cho'; });
  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cNgay')) + '</th>' +
    '<th class="num">' + HM.esc(t('cLuot')) + '</th>' +
    '<th class="num">' + HM.esc(t('cUoc')) + HM.hoi(t('ngayMo')) + '</th>' +
    '<th>' + HM.esc(t('cTrangThai')) + '</th>' +
    '<th>' + HM.esc(t('cNguoi')) + '</th>' +
    '<th>' + HM.esc(t('cTT')) + '</th></tr></thead><tbody>' +
    ds.map(function (x) {
      var tag = x.trangThai === 'tay' ? HM.tag(t('sTay'), 'ok')
        : x.trangThai === 'cho' ? HM.tag(t('sCho'), 'warn') : HM.tag(t('sTuDong'), '');
      return '<tr' + (x.trangThai === 'cho' ? ' class="canh"' : '') + '>' +
        '<td class="mono">' + HM.esc(HT.fmt.ngay(x.ngay)) + '</td>' +
        '<td class="num mono"><b>' + (x.tong > 0 ? HM.esc(HT.fmt.n(x.tong)) : '<span class="nil">—</span>') + '</b></td>' +
        '<td class="num mono muted">' + HM.esc(HT.fmt.n(x.tuSinh)) + '</td>' +
        '<td>' + tag + '</td>' +
        '<td class="muted">' + (x.by ? HM.esc(x.by) : '<span class="nil">—</span>') + '</td>' +
        '<td><div class="btnrow" style="flex-wrap:nowrap">' +
          '<button type="button" class="btn sm' + (x.trangThai === 'cho' ? ' pri' : ' ghost') + '" data-o-ngay="' + x.ngay + '" data-uoc="' + x.tuSinh + '">' +
            HM.esc(x.trangThai === 'tay' ? t('goBai') : t('lLuot')) + '</button>' +
          '<button type="button" class="btn sm ghost' + (CHON.ngay === x.ngay ? ' on' : '') + '" data-soat-ngay="' + x.ngay + '">' + HM.esc(t('dsChonNgay')) + '</button>' +
          (x.trangThai === 'tay' ? '<button type="button" class="btn sm ghost" data-tra-ngay="' + x.ngay + '">' + HM.esc(t('traTuDong')) + '</button>' : '') +
        '</div></td></tr>';
    }).join('') + '</tbody></table></div>';

  var html = '';
  if (cho.length) {
    html += HM.ghi({ kieu: 'warn', icon: 'clock',
      tieuDe: HM.esc(t('kNgayThieu')) + ' · ' + cho.length,
      than: HM.esc(cho.map(function (x) { return HT.fmt.ngay(x.ngay); }).join(' · ')) });
  }
  html += '<div class="grid g2">' +
    HM.the({ h2: HM.esc(t('tNgay')), p: HM.esc(t('ngayMo')), thoBody: true, than: than }) +
    HM.the({ h2: HM.esc(t('qt')), icon: 'list',
      than: HTS.soTay(c, 'nhap-so-lieu') }) +
    '</div>';
  html += veDoiSoat(c, ds);
  return html;
}

/* ---- đối soát từng nền tảng cho một ngày ---- */
function veDoiSoat(c, ds) {
  var A = c.A, t = c.t;
  if (!CHON.ngay) CHON.ngay = (ds.filter(function (x) { return x.trangThai !== 'cho'; })[0] || ds[0]).ngay;
  var rows;
  try { rows = A.nhapLieu.nenTangNgay(CHON.ngay); } catch (e) { return ''; }
  var nguong = A.nhapLieu.nguongLech();
  var tong = A.nhapLieu.ngay(30).filter(function (x) { return x.ngay === CHON.ngay; })[0];

  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('dsNt')) + '</th>' +
    '<th class="num">' + HM.esc(t('dsHt')) + '</th>' +
    '<th class="num">' + HM.esc(t('dsTt')) + '</th>' +
    '<th class="num">' + HM.esc(t('dsLech')) + '</th>' +
    '<th>' + HM.esc(t('dsTrang')) + '</th>' +
    '<th>' + HM.esc(t('cNguoi')) + '</th>' +
    '<th>' + HM.esc(t('cTT')) + HM.hoi(t('dsMo').replace('{p}', HT.fmt.pct(nguong))) + '</th></tr></thead><tbody>' +
    rows.map(function (r) {
      var tag = r.trangThai === 'khop' ? HM.tag(t('dsKhop'), 'ok')
        : r.trangThai === 'lech' ? HM.tag(t('dsLechT'), 'no') : HM.tag(t('dsCho'), '');
      return '<tr' + (r.trangThai === 'lech' ? ' class="canh"' : '') + '>' +
        '<td>' + HM.tenBia({ ten: r.plat, seed: r.plat }) + '</td>' +
        '<td class="num mono muted">' + HM.esc(HT.fmt.n(r.heThong)) + '</td>' +
        '<td class="num mono"><b>' + (r.thucTe == null ? '<span class="nil">—</span>' : HM.esc(HT.fmt.n(r.thucTe))) + '</b></td>' +
        '<td class="num mono">' + (r.lech == null ? '<span class="nil">—</span>'
          : '<span class="' + (r.trangThai === 'lech' ? 'neg' : 'pos') + '">' + (r.lech > 0 ? '+' : '') + HM.esc(HT.fmt.n(r.lech)) +
            (r.lechPct == null ? '' : ' · ' + HM.esc(HT.fmt.pct(r.lechPct))) + '</span>') + '</td>' +
        '<td>' + tag + '</td>' +
        '<td class="muted">' + (r.by ? HM.esc(r.by) : '<span class="nil">—</span>') + '</td>' +
        '<td><div class="bar" style="margin:0;gap:6px;flex-wrap:nowrap">' +
          '<input class="in mono" type="number" min="0" step="1" style="width:120px" data-so-nt="' + HM.esc(r.plat) + '" value="' + (r.thucTe == null ? '' : r.thucTe) + '" placeholder="' + HM.esc(HT.fmt.n(r.heThong)) + '">' +
          '<button type="button" class="btn sm pri" data-luu-nt="' + HM.esc(r.plat) + '">' + HM.esc(t('dsLuu')) + '</button>' +
          (r.thucTe == null ? '' : '<button type="button" class="btn sm ghost" data-bo-nt="' + HM.esc(r.plat) + '">' + HM.esc(t('dsBo')) + '</button>') +
        '</div></td></tr>';
    }).join('') + '</tbody></table></div>';

  return HM.the({
    h2: HM.esc(t('dsTieu').replace('{d}', HT.fmt.ngay(CHON.ngay))),
    p: HM.esc(t('dsMo').replace('{p}', HT.fmt.pct(nguong))), icon: 'swap', thoBody: true,
    than: than,
    chan: HM.esc(t('dsTong')) + ': <b>' + HM.esc(HT.fmt.n(tong ? tong.tong : 0)) + '</b> · ' + HM.esc(t('dsTongMo'))
  });
}

/* =====================================================================
   TAB — ĐỐI SOÁT MỘT BÀI THEO ĐƯỜNG DẪN STORE
   ===================================================================== */
function veSoatBai(c) {
  var A = c.A, t = c.t;
  var ngayDs = A.nhapLieu.ngay(30);
  if (!CHON.ngay) CHON.ngay = ngayDs[0].ngay;
  var thanh = '<div class="bar">' +
    '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim-bai placeholder="' +
      HM.esc(t('sbTim')) + '" value="' + HM.esc(CHON.qBai) + '"></div>' +
    '<select class="in" data-soat-chon-ngay style="width:auto;height:34px" aria-label="' + HM.esc(t('sbNgay')) + '">' +
      ngayDs.slice(0, 14).map(function (x) {
        return '<option value="' + x.ngay + '"' + (x.ngay === CHON.ngay ? ' selected' : '') + '>' + HM.esc(HT.fmt.ngay(x.ngay)) + '</option>';
      }).join('') + '</select></div>';

  /* Không gõ gì thì vẫn phải có việc để làm: mở tab ra là thấy ngay những
     bài nghe nhiều nhất tuần, tức là những bài lệch một chút cũng thành
     tiền. Gõ vào ô tìm thì danh sách đổi sang kết quả tìm. */
  var ds = [], goiY = false;
  if (CHON.qBai.trim().length >= 2) {
    try { ds = A.search(CHON.qBai.trim(), 8).tracks.map(function (x) {
      return { id: x.id, title: x.title, artist: x.artist, isrc: x.isrc, luot: x.streamsMonth }; }); } catch (e) { ds = []; }
  } else {
    goiY = true;
    try { ds = A.dailyTrends(7, 12).topTracks.slice(0, 8).map(function (x) {
      return { id: x.id, title: x.title, artist: x.artist, isrc: x.isrc, luot: x.streams }; }); } catch (e) { ds = []; }
  }
  var chon = '';
  if (ds.length) {
    chon = (goiY ? '<p class="say">' + HM.esc(t('sbGoiY')) + HM.hoi(t('sbGoiYMo')) + '</p>' : '') +
      '<div class="tw"><table class="t"><tbody>' + ds.map(function (x) {
      return '<tr class="pick" data-chon-bai="' + x.id + '">' +
        '<td>' + HM.tenBia({ ten: x.title, bia: x.id, seed: x.id, phu: x.artist + ' · ' + x.isrc }) + '</td>' +
        '<td class="num mono muted">' + HM.esc(HT.fmt.n(x.luot)) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  var khoi = '';
  if (CHON.bai != null) {
    khoi += veCongKhai(c);
    var b;
    try { b = A.nhapLieu.baiNgay(CHON.bai, CHON.ngay); } catch (e) { b = null; }
    if (b) {
      var co = b.rows.filter(function (r) { return r.url; });
      khoi += HM.the({
        h2: HM.esc(b.title), p: HM.esc(b.artist + ' · ' + b.isrc), icon: 'link', thoBody: true,
        than: HM.kv([
          { t: t('sbNgay'), v: HT.fmt.ngay(b.ngay) },
          { t: t('sbLuot'), v: HT.fmt.n(b.luotNgay), manh: true }
        ]) + (co.length ? '<div class="tw"><table class="t"><thead><tr>' +
          '<th>' + HM.esc(t('dsNt')) + '</th><th class="num">' + HM.esc(t('dsHt')) + '</th>' +
          '<th class="num">' + HM.esc(t('dsTt')) + '</th><th class="num">' + HM.esc(t('dsLech')) + '</th>' +
          '<th>' + HM.esc(t('dsTrang')) + '</th><th>' + HM.esc(t('cTT')) + HM.hoi(t('sbCoCau')) + '</th></tr></thead><tbody>' +
          co.map(function (r) {
            var tag = r.trangThai === 'khop' ? HM.tag(t('dsKhop'), 'ok')
              : r.trangThai === 'lech' ? HM.tag(t('dsLechT'), 'no') : HM.tag(t('dsCho'), '');
            return '<tr' + (r.trangThai === 'lech' ? ' class="canh"' : '') + '>' +
              '<td><a href="' + HM.esc(r.url) + '" target="_blank" rel="noopener">' + HM.esc(r.plat) + '</a>' +
                '<div class="t-sub">' + HM.esc(HM.dai(r.url.replace(/^https?:\/\//, ''), 40)) + '</div></td>' +
              '<td class="num mono muted">' + HM.esc(HT.fmt.n(r.heThong)) + '</td>' +
              '<td class="num mono"><b>' + (r.thucTe == null ? '<span class="nil">—</span>' : HM.esc(HT.fmt.n(r.thucTe))) + '</b></td>' +
              '<td class="num mono">' + (r.lech == null ? '<span class="nil">—</span>'
                : '<span class="' + (r.trangThai === 'lech' ? 'neg' : 'pos') + '">' + (r.lech > 0 ? '+' : '') + HM.esc(HT.fmt.n(r.lech)) + '</span>') + '</td>' +
              '<td>' + tag + '</td>' +
              '<td><div class="bar" style="margin:0;gap:6px;flex-wrap:nowrap">' +
                '<input class="in mono" type="number" min="0" step="1" style="width:104px" data-so-bai-nt="' + HM.esc(r.plat) + '" value="' + (r.thucTe == null ? '' : r.thucTe) + '" placeholder="' + HM.esc(HT.fmt.n(r.heThong)) + '">' +
                '<button type="button" class="btn sm pri" data-luu-bai-nt="' + HM.esc(r.plat) + '">' + HM.esc(t('dsLuu')) + '</button>' +
                (r.thucTe == null ? '' : '<button type="button" class="btn sm ghost" data-bo-bai-nt="' + HM.esc(r.plat) + '">' + HM.esc(t('dsBo')) + '</button>') +
              '</div></td></tr>';
          }).join('') + '</tbody></table></div>'
          : HM.trong({ icon: 'link', tieuDe: t('sbKhongLink'), moTa: t('sbMo') }))
      });
    }
  }

  return HM.the({ h2: HM.esc(t('sbTieu')), p: HM.esc(t('sbMo')), icon: 'link',
    than: thanh + (chon || (CHON.bai == null ? HM.trong({ icon: 'tim', tieuDe: t('sbChon'), moTa: t('sbMo') }) : '')) }) + khoi;
}

/* =====================================================================
   SỐ CÔNG KHAI TRÊN STORE — tín hiệu, không phải tiền
   ---------------------------------------------------------------------
   Nhân viên mở link store của bài, đọc con số nền tảng đang hiện, gõ vào
   đây. Con số ấy là CỘNG DỒN, nên bảng tính hiệu hai lần đọc liên tiếp
   rồi chia số ngày để ra bình quân mỗi ngày.

   Vì sao không nối vào chuỗi chia tiền: nền tảng đếm "lượt phát" khác
   với lượt nghe được trả tiền, và nhiều nền tảng không công bố gì cả.
   Nhãn "không dùng để tính tiền" nằm ngay cạnh tiêu đề để không ai
   nhầm — kể cả người mở trang lần đầu.
   ===================================================================== */
function veCongKhai(c) {
  var A = c.A, t = c.t;
  var ds;
  try { ds = A.soCongKhai.cuaBai(CHON.bai); } catch (e) { return ''; }
  var coLink = ds.some(function (x) { return x.url; });

  return HM.the({
    h2: HM.esc(t('ckTieu')) + ' ' + HM.tag(t('ckKhongTien'), 'warn'),
    p: HM.esc(t('ckMo')), icon: 'chart', thoBody: true,
    than: coLink ? '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('ckNt')) + '</th>' +
      '<th class="num">' + HM.esc(t('ckSo')) + '</th>' +
      '<th class="num">' + HM.esc(t('ckNhip')) + HM.hoi(t('ckMo')) + '</th>' +
      '<th>' + HM.esc(t('ckNgayDoc')) + '</th>' +
      '<th>' + HM.esc(t('ckGo')) + '</th></tr></thead><tbody>' +
      ds.map(function (x) {
        if (!x.co) return '<tr><td>' + HM.esc(c.lang === 'vi' ? x.plat : x.platEn) + '</td>' +
          '<td colspan="4" class="muted">' + HM.esc(t('ckKhongCo')) + ' · ' + HM.esc(c.lang === 'vi' ? x.ghi : x.ghiEn) + '</td></tr>';
        return '<tr' + (x.lui ? ' class="canh"' : '') + '>' +
          '<td>' + (x.url
            ? '<a href="' + HM.esc(x.url) + '" target="_blank" rel="noopener">' + HM.esc(c.lang === 'vi' ? x.plat : x.platEn) + '</a>'
            : HM.esc(c.lang === 'vi' ? x.plat : x.platEn)) +
            '<div class="t-sub">' + HM.esc(t('ckLan').replace('{n}', x.soLan)) + '</div></td>' +
          '<td class="num mono"><b>' + (x.moiNhat ? HM.esc(HT.fmt.n(x.moiNhat.so)) : '<span class="nil">' + HM.esc(t('ckChuaCo')) + '</span>') + '</b></td>' +
          '<td class="num mono">' + (x.moiNgay == null ? '<span class="nil">—</span>'
            : '<span class="' + (x.lui ? 'neg' : 'pos') + '">' + (x.moiNgay > 0 ? '+' : '') + HM.esc(HT.fmt.n(x.moiNgay)) + '</span>' +
              (x.lui ? HM.hoi(t('ckLui')) : '')) + '</td>' +
          '<td class="mono muted">' + (x.moiNhat ? HM.esc(HT.fmt.ngay(x.moiNhat.ngay)) : '<span class="nil">—</span>') + '</td>' +
          '<td><div class="bar" style="margin:0;gap:6px;flex-wrap:nowrap">' +
            '<input class="in mono" type="number" min="0" step="1" style="width:118px" data-ck="' + HM.esc(x.plat) + '" placeholder="' + HM.esc(x.moiNhat ? HT.fmt.n(x.moiNhat.so) : '0') + '">' +
            '<button type="button" class="btn sm pri" data-ck-luu="' + HM.esc(x.plat) + '">' + HM.esc(t('ckLuu')) + '</button>' +
            (x.moiNhat ? '<button type="button" class="btn sm ghost" data-ck-xoa="' + HM.esc(x.plat) + '">' + HM.esc(t('ckXoa')) + '</button>' : '') +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : HM.trong({ icon: 'link', tieuDe: t('ckChuaLink'), moTa: t('ckMo') })
  });
}

function goNgay(c, ngay, uoc) {
  var A = c.A, t = c.t;
  var hien = A.nhapLieu.ngay(30).filter(function (x) { return x.ngay === ngay; })[0] || {};
  c.hoiThoai({
    tieuDe: t('goNgay').replace('{d}', HT.fmt.ngay(ngay)),
    moTa: HM.esc(t('goNgayMo')),
    than: '<label class="fld">' + HM.esc(t('lLuot')) + '</label>' +
      '<input class="in mono" type="number" min="0" step="1" data-o="luot" value="' + (hien.trangThai === 'tay' ? hien.tong : '') + '" placeholder="' + HM.esc(HT.fmt.n(+uoc || 0)) + '">' +
      '<label class="fld">' + HM.esc(t('lGhiChu')) + '</label>' +
      '<input class="in" data-o="ghi" value="' + HM.esc(hien.ghiChu || '') + '">',
    dong: t('lLuot')
  }).then(function (r) {
    if (!r || r.luot === '') return;
    try {
      A.nhapLieu.ghiNgay(ngay, parseFloat(r.luot), { ghiChu: r.ghi }, A.staff.me.name);
      c.thongBao(t('daGoNgay').replace('{d}', HT.fmt.ngay(ngay)).replace('{v}', HT.fmt.n(parseFloat(r.luot))), 'ok');
      HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

/* =====================================================================
   TAB 2 — DOANH THU THEO KỲ × NGUỒN
   Ma trận mười hai dòng, ba cột. Ô nào chưa có số thật thì hiện số ước
   tính bằng chữ mờ, để phân biệt ngay bằng mắt.
   ===================================================================== */
function veTien(c, bang) {
  var t = c.t, A = c.A;
  var feeds = A.feeds;
  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cKy')) + '</th>' +
    feeds.map(function (f) { return '<th class="num">' + HM.esc(c.song(f, 'short')) + '</th>'; }).join('') +
    '<th class="num">' + HM.esc(t('cTong')) + '</th>' +
    '<th class="num">' + HM.esc(t('cLech')) + HM.hoi(t('tienMo')) + '</th>' +
    '<th>' + HM.esc(t('cDuyet')) + '</th></tr></thead><tbody>' +
    bang.slice().reverse().map(function (r) {
      var lech = r.tuSinh > 0 ? (r.thuc - r.tuSinh) / r.tuSinh : 0;
      return '<tr>' +
        '<td><b>' + HM.esc(r.label) + '</b></td>' +
        r.cot.map(function (o) {
          if (!o.nap) return '<td class="num"><button type="button" class="btn sm ghost" data-o-ky="' + r.pIdx + ':' + o.fId + '"' + (r.duyet ? ' disabled' : '') + '>' + HM.esc(t('chuaCo')) + '</button></td>';
          return '<td class="num mono">' +
            '<button type="button" class="o-tien' + (o.chot != null ? ' go' : '') + '" data-o-ky="' + r.pIdx + ':' + o.fId + '"' + (r.duyet ? ' disabled' : '') + '>' +
              '<b>' + HM.esc(c.tien(o.thuc)) + '</b>' +
              (o.chot != null ? '<span>' + HM.esc(t('cChot')) + '</span>' : '<span class="muted">' + HM.esc(t('uoc')) + '</span>') +
            '</button></td>';
        }).join('') +
        '<td class="num mono"><b>' + HM.esc(c.tien(r.thuc)) + '</b></td>' +
        '<td class="num mono">' + (Math.abs(lech) < 0.001 ? '<span class="nil">—</span>'
          : '<span class="' + (lech > 0 ? 'pos' : 'neg') + '">' + (lech > 0 ? '+' : '') + HM.esc(HT.fmt.pct(lech)) + '</span>') + '</td>' +
        '<td>' + (r.duyet ? HM.tag(t('daDuyet'), 'ok') : HM.tag(t('dangMo'), '')) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  return HM.the({ h2: HM.esc(t('tTien')), p: HM.esc(t('tienMo')), thoBody: true, than: than });
}

function goKy(c, pIdx, fId) {
  var A = c.A, t = c.t;
  var r = A.nhapLieu.bang()[pIdx];
  var o = r.cot.filter(function (x) { return x.fId === fId; })[0];
  var f = A.feeds[fId];
  var nguon = A.nhapLieu.nguon();
  c.hoiThoai({
    tieuDe: t('goKy').replace('{f}', c.song(f, 'short')).replace('{p}', r.label),
    moTa: HM.esc(t('goKyMo')),
    than: HM.kv([{ t: t('uoc'), v: c.tien2(o.tuSinh) }, { t: t('dangCo'), v: c.tien2(o.thuc), manh: true }]) +
      '<label class="fld">' + HM.esc(t('lTien')) + '</label>' +
      '<input class="in mono" type="number" min="0" step="0.01" data-o="tien" value="' + (o.chot != null ? o.chot : '') + '" placeholder="' + o.tuSinh.toFixed(2) + '">' +
      '<label class="fld">' + HM.esc(t('lNguon')) + '</label>' +
      '<select class="in" data-o="nguon">' + nguon.map(function (n) {
        return '<option value="' + n.id + '"' + (o.nguon === n.id ? ' selected' : '') + '>' + HM.esc(c.lang === 'en' ? n.en : n.vi) + '</option>';
      }).join('') + '</select>' +
      '<label class="fld">' + HM.esc(t('lGhiChu')) + '</label>' +
      '<input class="in" data-o="ghi" placeholder="onerpm-2026-06.csv">',
    dong: t('tTien')
  }).then(function (res) {
    if (!res || res.tien === '') return;
    try {
      var e = A.nhapLieu.ghiKy(pIdx, fId, parseFloat(String(res.tien).replace(',', '.')), { nguon: res.nguon, ghiChu: res.ghi }, A.staff.me.name);
      c.thongBao(t('daGoKy').replace('{f}', c.song(f, 'short')).replace('{p}', r.label).replace('{v}', c.tien2(e.tien)), 'ok');
      HM.quenHet(); c.veLai();
    } catch (err) { c.thongBao(err.message, 'no'); }
  });
}

/* =====================================================================
   TAB 3 — DOANH THU THEO BÀI
   Ô nhập nằm ngay trên dòng, không mở hộp thoại: gõ mười bài liên tiếp là
   việc thật, mở mười hộp thoại thì không ai làm.
   ===================================================================== */
function veBai(c, bang) {
  var A = c.A, t = c.t;
  var r = bang[CHON.pIdx];
  var kq = A.nhapLieu.baiTrongKy(CHON.pIdx, CHON.fId, { q: CHON.q, limit: 40 });
  var thanh = '<div class="bar">' +
    '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
      HM.esc(t('timBai')) + '" value="' + HM.esc(CHON.q) + '"></div>' +
    '<select class="in" data-chon-ky style="width:auto;height:34px" aria-label="' + HM.esc(t('chonKy')) + '">' + bang.map(function (x) {
      return '<option value="' + x.pIdx + '"' + (x.pIdx === CHON.pIdx ? ' selected' : '') + (x.duyet ? ' disabled' : '') + '>' + HM.esc(x.label) + (x.duyet ? ' · ' + HM.esc(t('daDuyet')) : '') + '</option>';
    }).join('') + '</select>' +
    '<select class="in" data-chon-nguon style="width:auto;height:34px" aria-label="' + HM.esc(t('chonNguon')) + '">' + A.feeds.map(function (f) {
      return '<option value="' + f.id + '"' + (f.id === CHON.fId ? ' selected' : '') + '>' + HM.esc(c.song(f, 'short')) + '</option>';
    }).join('') + '</select>' +
    '</div>';

  var than = thanh + '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cBai')) + '</th><th>' + HM.esc(t('cIsrc')) + '</th>' +
    '<th class="num">' + HM.esc(t('cUoc')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTong')) + '</th>' +
    '<th>' + HM.esc(t('goBai')) + HM.hoi(t('baiMo')) + '</th></tr></thead><tbody>' +
    kq.rows.map(function (x) {
      return '<tr>' +
        '<td>' + HM.tenBia({ ten: x.title, seed: x.i, bia: x.i, phu: x.artist }) + '</td>' +
        '<td class="mono muted">' + HM.esc(x.isrc) + '</td>' +
        '<td class="num mono muted">' + HM.esc(c.tien2(x.tuSinh)) + '</td>' +
        '<td class="num mono"><b>' + HM.esc(c.tien2(x.thuc)) + '</b>' + (x.goTay ? ' ' + HM.tag(t('daTay'), 'ok') : '') + '</td>' +
        '<td><div class="bar" style="margin:0;gap:6px;flex-wrap:nowrap">' +
          '<input class="in mono" type="number" min="0" step="0.01" style="width:110px" data-so-bai="' + x.i + '" value="' + (x.goTay ? x.thuc : '') + '" placeholder="' + x.tuSinh.toFixed(2) + '"' + (r.duyet ? ' disabled' : '') + '>' +
          '<button type="button" class="btn sm pri" data-luu-bai="' + x.i + '"' + (r.duyet ? ' disabled' : '') + '>' + HM.esc(t('luuBai')) + '</button>' +
        '</div></td></tr>';
    }).join('') + '</tbody></table></div>';

  if (!kq.rows.length) than = thanh + HM.trong({ icon: 'tim', tieuDe: t('timBai'), moTa: t('goiY') });
  return HM.the({ h2: HM.esc(t('tBai')), p: HM.esc(CHON.q ? t('baiMo') : t('goiY')), thoBody: true, than: than }) +
    HM.the({ h2: HM.esc(t('dan')), p: HM.esc(t('danMo')), icon: 'down2',
      than: '<textarea class="in mono" rows="6" data-dan placeholder="VNA2P2600123\t1520.40&#10;VNA2P2600124\t880.15"' + (r.duyet ? ' disabled' : '') + '></textarea>' +
        '<div class="btnrow" style="margin-top:10px"><button type="button" class="btn pri" data-nhan-dan' + (r.duyet ? ' disabled' : '') + '>' +
        HM.icon('down2') + HM.esc(t('danNut')) + '</button></div>' });
}

/* =====================================================================
   TAB 4 — NHẬT KÝ
   ===================================================================== */
function veSu(c) {
  var A = c.A, t = c.t;
  var ds = A.nhapLieu.nhatKy(60);
  if (!ds.length) return HM.the({ h2: HM.esc(t('tSu')), than: HM.trong({ icon: 'clock', tieuDe: t('trongSu'), moTa: t('suMo') }) });
  var than = '<div class="tw"><table class="t"><thead><tr>' +
    '<th>' + HM.esc(t('cLuc')) + '</th><th>' + HM.esc(t('cKieu')) + '</th><th>' + HM.esc(t('cDoiTuong')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTruoc')) + '</th><th class="num">' + HM.esc(t('cSau')) + '</th>' +
    '<th>' + HM.esc(t('cNguoi')) + '</th><th>' + HM.esc(t('cTT')) + '</th></tr></thead><tbody>' +
    ds.map(function (e) {
      return '<tr>' +
        '<td class="mono muted">' + HM.esc(HT.fmt.luc(e.at)) + '</td>' +
        '<td>' + HM.tag(e.kieu === 'ky' ? t('kieuKy') : t('kieuBai'), e.kieu === 'ky' ? '' : 'ok') + '</td>' +
        '<td>' + HM.esc((e.kieu === 'ky' ? e.nguonBaoCao : (e.tenBai || '')) + ' · ' + e.kyTen) +
          '<div class="t-sub">' + HM.esc(e.nguonTen + (e.ghiChu ? ' · ' + e.ghiChu : '')) + '</div></td>' +
        '<td class="num mono muted">' + HM.esc(c.tien2(e.truoc || 0)) + '</td>' +
        '<td class="num mono"><b>' + HM.esc(c.tien2(e.tien)) + '</b></td>' +
        '<td class="muted">' + HM.esc(e.by || '—') + '</td>' +
        '<td><button type="button" class="btn sm ghost" data-go="' + HM.esc(e.id) + '">' + HM.esc(t('go')) + '</button></td></tr>';
    }).join('') + '</tbody></table></div>';
  return HM.the({ h2: HM.esc(t('tSu')), p: HM.esc(t('suMo')), thoBody: true, than: than });
}

/* ---- bản in nhật ký ---- */
function inRa(c) {
  var A = c.A, t = c.t;
  var ds = A.nhapLieu.nhatKy(200);
  var than = '<h2>' + HM.esc(t('tSu')) + '</h2>' +
    '<table><thead><tr><th>' + HM.esc(t('cLuc')) + '</th><th>' + HM.esc(t('cKieu')) + '</th><th>' + HM.esc(t('cDoiTuong')) + '</th>' +
    '<th class="num">' + HM.esc(t('cTruoc')) + '</th><th class="num">' + HM.esc(t('cSau')) + '</th><th>' + HM.esc(t('cNguoi')) + '</th></tr></thead><tbody>' +
    (ds.length ? ds.map(function (e) {
      return '<tr><td>' + HM.esc(HT.fmt.luc(e.at)) + '</td><td>' + HM.esc(e.kieu === 'ky' ? t('kieuKy') : t('kieuBai')) + '</td>' +
        '<td>' + HM.esc((e.kieu === 'ky' ? e.nguonBaoCao : (e.tenBai || '')) + ' · ' + e.kyTen + ' · ' + e.nguonTen) + '</td>' +
        '<td class="num">' + HM.esc(c.tien2(e.truoc || 0)) + '</td><td class="num">' + HM.esc(c.tien2(e.tien)) + '</td>' +
        '<td>' + HM.esc(e.by || '—') + '</td></tr>';
    }).join('') : '<tr><td colspan="6">' + HM.esc(t('trongSu')) + '</td></tr>') + '</tbody></table>';
  HM.banIn({ tieuDe: t('inTieu'), phu: t('inPhu'), than: than, nguoi: A.staff.me.name });
}

})();
