/* =====================================================================
   NỘI BỘ · NỀN TẢNG
   ---------------------------------------------------------------------
   Lượt nghe và doanh thu gộp của TOÀN danh mục theo từng nền tảng, từng
   kỳ báo cáo, kể cả kỳ chưa xét duyệt. Trang này trả lời ba câu của người
   vận hành:
     1. Kỳ này nền tảng nào gánh phần lớn, và tỷ trọng đang dịch chuyển
        theo hướng nào qua 12 kỳ?
     2. Cột nào bằng 0 vì chưa nhập báo cáo (không phải vì nền tảng không
        có doanh thu)?
     3. Nền tảng nào trả ít nhất cho mỗi lượt nghe?
   Số liệu lấy một lần từ A.platformReport() (khoảng 200 ms cho 50.000 bản
   ghi) và nhớ theo dấu mốc trạng thái; đổi kỳ hay đổi thước đo chỉ vẽ lại.
   ===================================================================== */
"use strict";
(function () {

var LOC = { metric: 'revenue' };

HT.dangKy({
  id: 'nen-tang', nav: 'navNenTang', nhom: 'nhomDuLieu', icon: 'shop',

  chu: {
    vi: {
      themNt: 'Thêm nền tảng', ntThem: 'Nền tảng đang kết nối', ntThemMo: 'Nền tảng mới thêm bằng tay: đang kết nối, thử, đã lên hay tạm dừng. Doanh thu chỉ về sau khi có báo cáo kỳ.', fTenNt: 'Tên nền tảng', fLoaiNt: 'Loại', fVung: 'Khu vực', fTt: 'Trạng thái', fNhip: 'Nhịp báo cáo', fLh: 'Đầu mối bên nền tảng', fChu: 'Người phụ trách (Vận hành)', fGhiNt: 'Ghi chú', daThemNt: 'Đã thêm nền tảng {t}', daDoi: 'Đã đổi trạng thái', ttConnecting: 'Đang kết nối', ttTesting: 'Đang thử', ttLive: 'Đã lên', ttPaused: 'Tạm dừng', cNt: 'Nền tảng', cChu: 'Phụ trách', cTuNgay: 'Từ ngày', lStreaming: 'Streaming', lDownload: 'Bán tải về', lVideo: 'Video', lSocial: 'Mạng xã hội', lTelco: 'Nhà mạng', nMonthly: 'Hằng tháng', nQuarterly: 'Hằng quý', khongNt: 'Chưa thêm nền tảng nào bằng tay',
      nhomDuLieu: 'Danh mục', navNenTang: 'Nền tảng', h1: 'Nền tảng',
      mo: 'Lượt nghe và doanh thu gộp của toàn danh mục theo từng nền tảng, từng kỳ báo cáo, kể cả kỳ chưa xét duyệt.',
      kDanDau: 'Nền tảng dẫn đầu', kLuot: 'Lượt nghe', kGop: 'Doanh thu gộp', kSo: 'Nền tảng có doanh thu',
      chuaDuyet: 'Kỳ chưa xét duyệt',
      chuaDuyetMo: 'Số liệu của kỳ {k} là số đã nhập tới thời điểm này và còn thay đổi cho tới khi xét duyệt kỳ.',
      thieuNguon: 'Chưa nhập báo cáo: {n}. Nền tảng thuộc nguồn đó đang bằng 0 trong mọi bảng của kỳ này.',
      moNhap: 'Mở trang nhập báo cáo',
      dienBien: 'Diễn biến theo nền tảng',
      dienBienMo: 'Năm nền tảng lớn nhất theo thước đo đang chọn, còn lại gộp vào Nền tảng khác. Cột nét đứt là kỳ chưa xét duyệt.',
      tyTrong: 'Tỷ trọng kỳ', tyTrongMo: 'Chín nền tảng của kỳ {k} theo thước đo đang chọn.',
      moiLuot: 'Lượt nghe trên mỗi đô la',
      moiLuotMo: 'Doanh thu gộp trên 1.000 lượt nghe của kỳ {k}. Nền tảng đứng cuối trả ít nhất cho mỗi lượt nghe.',
      donVi: '{c} trên 1.000 lượt nghe', binhQuan: 'so với bình quân kỳ',
      bang: 'Bảng theo tháng',
      bangMo: 'Mỗi cột là một kỳ báo cáo. Cột cộng dọc bằng đúng doanh thu gộp của kỳ đó ở trang Tổng quan.',
      ghiChu: 'Kỳ chưa xét duyệt hiện số đã nhập tới nay. Chưa nhập TikTok thì cột TikTok bằng 0 vì thiếu báo cáo, không phải không có doanh thu.',
      chuaNhap: 'chưa nhập báo cáo cho kỳ này', khongLuot: 'chưa có lượt nghe',
      luotNghe: 'lượt nghe', khac: 'Nền tảng khác', xuat: 'Xuất CSV'
    },
    en: {
      themNt: 'Add a platform', ntThem: 'Platforms being connected', ntThemMo: 'Platforms added by hand: connecting, testing, live or paused. Revenue arrives only once period reports come in.', fTenNt: 'Platform name', fLoaiNt: 'Kind', fVung: 'Region', fTt: 'Status', fNhip: 'Reporting cadence', fLh: 'Platform contact', fChu: 'Owner (Operations)', fGhiNt: 'Note', daThemNt: 'Added platform {t}', daDoi: 'Status updated', ttConnecting: 'Connecting', ttTesting: 'Testing', ttLive: 'Live', ttPaused: 'Paused', cNt: 'Platform', cChu: 'Owner', cTuNgay: 'Since', lStreaming: 'Streaming', lDownload: 'Download store', lVideo: 'Video', lSocial: 'Social', lTelco: 'Telco', nMonthly: 'Monthly', nQuarterly: 'Quarterly', khongNt: 'No platform added by hand yet',
      nhomDuLieu: 'Data', navNenTang: 'Platforms', h1: 'Platforms',
      mo: 'Streams and gross revenue for the whole catalogue, by platform and by reporting period, unapproved periods included.',
      kDanDau: 'Leading platform', kLuot: 'Streams', kGop: 'Gross revenue', kSo: 'Platforms earning',
      chuaDuyet: 'Period not approved',
      chuaDuyetMo: 'Figures for {k} are what has been loaded so far and will move until the period is approved.',
      thieuNguon: 'Not loaded yet: {n}. Platforms on that feed show 0 in every table for this period.',
      moNhap: 'Open data loading',
      dienBien: 'Trend by platform',
      dienBienMo: 'Top five platforms for the chosen measure, the rest folded into Other. Dashed columns are unapproved periods.',
      tyTrong: 'Share this period', tyTrongMo: 'All nine platforms for {k}, by the chosen measure.',
      moiLuot: 'Streams per dollar',
      moiLuotMo: 'Gross revenue per 1,000 streams for {k}. The platform at the bottom pays the least per stream.',
      donVi: '{c} per 1,000 streams', binhQuan: 'of the period average',
      bang: 'By month',
      bangMo: 'Each column is a reporting period. Columns add up to that period’s gross on the Overview page.',
      ghiChu: 'Unapproved periods show what is loaded so far. Without the TikTok feed the TikTok column is 0: missing feed, not zero earnings.',
      chuaNhap: 'not loaded for this period', khongLuot: 'no streams yet',
      luotNghe: 'streams', khac: 'Other platforms', xuat: 'Export CSV'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, pi = c.ky.idx, vi = c.lang === 'vi';
    var P = HB.dayMau();
    var metric = LOC.metric;
    var data = HM.nho(A, 'platformReport', function () { return A.platformReport(); });
    /* data.periods cùng thứ tự với A.periods, nên c.ky.idx là chỉ số cột */
    var col = pi, nR = data.rows.length;
    var rows = data.rows.map(function (r, j) {
      return { j: j, ten: c.song(r, 'name'), revenue: r.revenue[col] || 0, streams: r.streams[col] || 0, khac: j === nR - 1 };
    });
    var tongG = data.totals.revenue[col] || 0, tongS = data.totals.streams[col] || 0;
    var tongM = metric === 'streams' ? tongS : tongG;
    var xep = rows.slice().sort(function (a, b) { return b[metric] - a[metric]; });
    var dau = xep[0];
    var coDt = rows.filter(function (x) { return x.revenue > 0; }).length;
    var chuaDuyetIdx = A.periods.filter(function (p) { return !A.isApproved(p.k); }).map(function (p) { return p.idx; });
    var thieu = A.missingFeeds(pi);
    var mauCua = function (x) { return x.khac ? HB.mau('neutral-bar') : P[x.j % 8]; };
    var chuaNhapCua = function (x) {
      /* 8 nền tảng lớn bám theo nguồn báo cáo của cửa hàng cùng chỉ số */
      if (x.khac) return false;
      var fid = A.storeFeed[x.j];
      return fid != null && !A.feedLoaded(pi, fid);
    };

    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>', mo: HM.esc(t('mo')),
      nut: A.quyen.nhom('vanHanh') ? '<button type="button" class="btn pri" data-them-nt>' + HM.icon('shop') + HM.esc(t('themNt')) + '</button>' : '',
      so: [
        { l: t('kDanDau'), v: dau && dau[metric] > 0 ? dau.ten + ' · ' + HT.fmt.pct(tongM ? dau[metric] / tongM : 0) : '—' },
        { l: t('kLuot'), v: HB.gonSo(tongS) },
        { l: t('kGop'), v: c.tien(tongG) },
        { l: t('kSo'), v: coDt + '/' + nR }
      ]
    });

    if (!A.isApproved(c.kyKey)) {
      html += HM.ghi({ kieu: 'warn', tieuDe: HM.esc(t('chuaDuyet')) + ' · ' + HM.esc(c.ky.label),
        than: HM.esc(t('chuaDuyetMo').replace('{k}', c.ky.label)) +
          (thieu.length ? ' ' + HM.esc(t('thieuNguon').replace('{n}', thieu.map(function (f) { return c.song(f, 'short'); }).join(', '))) : ''),
        nut: '<button type="button" class="btn sm" data-di="nap-du-lieu">' + HM.icon('down2') + HM.esc(t('moNhap')) + '</button>' });
    }

    /* ---- diễn biến 12 kỳ: 5 nền tảng lớn nhất + phần còn lại ---- */
    var tongHang = function (r) { return r[metric].reduce(function (a, b) { return a + b; }, 0); };
    var tam = data.rows.slice(0, nR - 1).map(function (r, j) { return { j: j, r: r, tong: tongHang(r) }; })
      .sort(function (a, b) { return b.tong - a.tong; });
    var top5 = tam.slice(0, 5);
    var conLai = tam.slice(5).map(function (x) { return x.r; }).concat([data.rows[nR - 1]]);
    var chuoi = top5.map(function (x) { return { ten: c.song(x.r, 'name'), gt: x.r[metric].slice(), mau: P[x.j % 8] }; });
    chuoi.push({ ten: t('khac'), mau: HB.mau('neutral-bar'),
      gt: data.periods.map(function (p, k) { return conLai.reduce(function (s, r) { return s + (r[metric][k] || 0); }, 0); }) });

    html += HM.the({
      h2: HM.esc(t('dienBien')), p: HM.esc(t('dienBienMo')),
      hanhDong: HTS.chonThuocDo(metric),
      than: HB.o({
        loai: 'cot', cao: 260, hienGiaTri: false, dinhDang: metric === 'streams' ? 'so' : 'tien',
        truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
        tieuDeTip: function (k) { return (vi ? 'Kỳ ' : 'Period ') + A.periods[k].label; },
        chuoi: chuoi, dangDo: chuaDuyetIdx, noiBat: pi
      })
    });

    /* ---- tỷ trọng kỳ + lượt nghe trên mỗi đô la ---- */
    var tyTrong = HB.o({ loai: 'thanh', dinhDang: metric === 'streams' ? 'so' : undefined,
      tenTong: metric === 'streams' ? HTS.t('luot') : HTS.t('gop'),
      hang: xep.map(function (x) {
        return { ten: x.ten, gt: x[metric], mau: mauCua(x),
                 phu: chuaNhapCua(x) ? t('chuaNhap')
                    : metric === 'streams' ? c.tien(x.revenue) : HT.fmt.n(x.streams) + ' ' + t('luotNghe') };
      }) });

    var moi = rows.map(function (x) {
      return { ten: x.ten, j: x.j, khac: x.khac, streams: x.streams, chua: chuaNhapCua(x),
               v: x.streams > 0 ? x.revenue / x.streams * 1000 : null };
    }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); });
    var maxV = Math.max.apply(null, moi.map(function (x) { return x.v || 0; }).concat([0.0001]));
    var bqV = tongS > 0 ? tongG / tongS * 1000 : 0;
    var moiHtml = '<div class="bars">' + moi.map(function (x) {
      var w = x.v != null ? (x.v / maxV * 100).toFixed(1) : 0;
      return '<div class="row"><div class="nm">' + HM.esc(x.ten) +
        '<em>' + HM.esc(x.v != null ? HT.fmt.n(x.streams) + ' ' + t('luotNghe') : (x.chua ? t('chuaNhap') : t('khongLuot'))) + '</em>' +
        '<div class="bar"><i style="width:' + w + '%;background:' + mauCua(x) + '"></i></div></div>' +
        '<div class="vv">' + (x.v != null ? HM.esc(c.tien2(x.v)) : '<span class="nil">—</span>') +
        '<em>' + (x.v != null && bqV > 0 ? HM.esc(HT.fmt.pct(x.v / bqV, 0) + ' ' + t('binhQuan')) : '') + '</em></div></div>';
    }).join('') + '</div>';

    html += '<div class="grid g2">' +
      HM.the({ h2: HM.esc(t('tyTrong')), p: HM.esc(t('tyTrongMo').replace('{k}', c.ky.label)), than: tyTrong }) +
      HM.the({ h2: HM.esc(t('moiLuot')), p: HM.esc(t('moiLuotMo').replace('{k}', c.ky.label)), than: moiHtml,
        chan: HM.esc(t('donVi').replace('{c}', c.cur === 'VND' ? 'VND' : 'USD')) +
          (bqV > 0 ? ' · ' + HM.esc((vi ? 'bình quân kỳ ' : 'period average ') + c.tien2(bqV)) : '') }) +
      '</div>';

    /* ---- bảng theo tháng ---- */
    html += HM.the({
      h2: HM.esc(t('bang')), p: HM.esc(t('bangMo')),
      hanhDong: '<button type="button" class="btn sm" data-di="nap-du-lieu">' + HM.esc(t('moNhap')) + '</button>',
      than: '<div class="bar" style="margin-bottom:10px">' + HTS.chonThuocDo(metric) + '<div class="sp"></div>' +
        '<button type="button" class="btn sm" data-csv>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button></div>' +
        HTS.maTran(data, { metric: metric, tien: c.tien, tien2: c.tien2 }),
      chan: HM.esc(t('ghiChu'))
    });

    html += veNenTangThem(c);
    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-mx]', function (el) { LOC.metric = el.getAttribute('data-mx'); c.veLai(); });
    HM.bam(root, '[data-csv]', function () { HTS.csvMaTran('nen-tang-' + LOC.metric + '.csv', data, LOC.metric); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-them-nt]', function () { hoiNenTang(c); });
    HM.doi(root, '[data-nt-tt]', function (el) { try { A.platforms.setStatus(el.getAttribute('data-nt-tt'), el.value, A.staff.me.email); c.thongBao(t('daDoi'), 'ok'); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); } });
  }
});

function veNenTangThem(c) {
  var A = c.A, t = c.t, vi = c.lang === 'vi';
  var ds = A.platforms.list().filter(function (p) { return p.manual; });
  var TT = { connecting: 'ttConnecting', testing: 'ttTesting', live: 'ttLive', paused: 'ttPaused' }, KIEU = { connecting: 'info', testing: 'warn', live: 'ok', paused: '' };
  return HM.the({ h2: HM.esc(t('ntThem')) + (ds.length ? ' <span class="muted">(' + ds.length + ')</span>' : ''), p: HM.esc(t('ntThemMo')), thoBody: true,
    than: !ds.length ? HM.trong({ icon: 'shop', tieuDe: t('khongNt'), moTa: '' }) :
      '<div class="tw"><table class="t" style="min-width:0"><thead><tr><th>' + HM.esc(t('cNt')) + '</th><th>' + HM.esc(t('fLoaiNt')) + '</th><th>' + HM.esc(t('fTt')) + '</th><th>' + HM.esc(t('cChu')) + '</th><th>' + HM.esc(t('cTuNgay')) + '</th></tr></thead><tbody>' +
      ds.map(function (p) {
        return '<tr><td><div class="t-ttl">' + HM.esc(p.name) + '</div><div class="t-sub" style="font-family:var(--f)">' + HM.esc(p.region + (p.contact ? ' · ' + p.contact : '')) + '</div></td><td>' + HM.esc(t('l' + p.kind.charAt(0).toUpperCase() + p.kind.slice(1)) === 'l' + p.kind.charAt(0).toUpperCase() + p.kind.slice(1) ? p.kind : t('l' + p.kind.charAt(0).toUpperCase() + p.kind.slice(1))) + '</td>' +
          '<td>' + (A.quyen.nhom('vanHanh') ? '<select class="inline-sel" data-nt-tt="' + HM.esc(p.name) + '">' + A.platforms.statuses.map(function (s) { return '<option value="' + s + '"' + (s === p.status ? ' selected' : '') + '>' + HM.esc(t(TT[s])) + '</option>'; }).join('') + '</select>' : HM.tag(t(TT[p.status]), KIEU[p.status])) + '</td>' +
          '<td>' + HM.esc(p.owner || '—') + '</td><td class="mono">' + HM.esc(HT.fmt.ngay(p.addedAt)) + '</td></tr>';
      }).join('') + '</tbody></table></div>' });
}
function hoiNenTang(c) {
  var A = c.A, t = c.t, ops = A.staff.byRole('ops').filter(function (x) { return x.active !== false; });
  HTM.hoiForm(c, { tieuDe: t('themNt'), dong: t('themNt'), fields: [
    { k: 'name', l: t('fTenNt'), req: true }, { k: 'kind', l: t('fLoaiNt'), kieu: 'select', opts: [['streaming', t('lStreaming')], ['download', t('lDownload')], ['video', t('lVideo')], ['social', t('lSocial')], ['telco', t('lTelco')]], kbb: false },
    { k: 'region', l: t('fVung'), v: 'Việt Nam' }, { k: 'status', l: t('fTt'), kieu: 'select', opts: [['connecting', t('ttConnecting')], ['testing', t('ttTesting')], ['live', t('ttLive')]], kbb: false },
    { k: 'cadence', l: t('fNhip'), kieu: 'select', opts: [['monthly', t('nMonthly')], ['quarterly', t('nQuarterly')]], kbb: false }, { k: 'ownerId', l: t('fChu'), kieu: 'select', opts: ops.map(function (x) { return [x.id, x.name]; }), kbb: false },
    { k: 'contact', l: t('fLh') }, { k: 'note', l: t('fGhiNt') }
  ] }).then(function (f) {
    if (!f) return;
    try { var p = A.platforms.add(f, A.staff.me.email); c.thongBao(t('daThemNt').replace('{t}', p.name), 'ok'); c.veLai(); } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

})();
