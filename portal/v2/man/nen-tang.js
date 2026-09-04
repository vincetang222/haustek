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

var LOC = { metric: 'gross' };

HT.dangKy({
  id: 'nen-tang', nav: 'navNenTang', nhom: 'nhomDuLieu', icon: 'shop',

  chu: {
    vi: {
      nhomDuLieu: 'Danh mục', navNenTang: 'Nền tảng', h1: 'Nền tảng',
      mo: 'Lượt nghe và doanh thu gộp của toàn danh mục theo từng nền tảng, từng kỳ báo cáo, kể cả kỳ chưa xét duyệt.',
      kDanDau: 'Nền tảng dẫn đầu', kLuot: 'Lượt nghe', kGop: 'Doanh thu gộp', kSo: 'Nền tảng có doanh thu',
      chuaDuyet: 'Kỳ chưa xét duyệt',
      chuaDuyetMo: 'Số liệu của kỳ {k} là số đã nhập tới thời điểm này và còn thay đổi cho tới khi xét duyệt kỳ.',
      thieuNguon: 'Chưa nhập báo cáo: {n}. Nền tảng thuộc nguồn đó đang bằng 0 trong mọi bảng của kỳ này.',
      moNhap: 'Mở trang nhập báo cáo',
      dienBien: 'Diễn biến theo nền tảng',
      dienBienMo: 'Năm nền tảng lớn nhất theo thước đo đang chọn; phần còn lại gộp vào Nền tảng khác. Cột nét đứt là kỳ chưa xét duyệt, số liệu còn thay đổi.',
      tyTrong: 'Tỷ trọng kỳ', tyTrongMo: 'Chín nền tảng của kỳ {k} theo thước đo đang chọn.',
      moiLuot: 'Lượt nghe trên mỗi đô la',
      moiLuotMo: 'Doanh thu gộp trên 1.000 lượt nghe của kỳ {k}. Nền tảng đứng cuối trả ít nhất cho mỗi lượt nghe.',
      donVi: '{c} trên 1.000 lượt nghe', binhQuan: 'so với bình quân kỳ',
      bang: 'Bảng theo tháng',
      bangMo: 'Mỗi cột là một kỳ báo cáo. Cột cộng dọc bằng đúng doanh thu gộp của kỳ đó ở trang Tổng quan.',
      ghiChu: 'Kỳ chưa xét duyệt hiện số đã nhập tới thời điểm này. Kỳ chưa nhập báo cáo TikTok thì cột TikTok bằng 0: đó là do chưa nhập báo cáo, không phải nền tảng không có doanh thu.',
      chuaNhap: 'chưa nhập báo cáo cho kỳ này', khongLuot: 'chưa có lượt nghe',
      luotNghe: 'lượt nghe', khac: 'Nền tảng khác', xuat: 'Xuất CSV'
    },
    en: {
      nhomDuLieu: 'Data', navNenTang: 'Platforms', h1: 'Platforms',
      mo: 'Streams and gross revenue for the whole catalogue, by platform and by reporting period, unapproved periods included.',
      kDanDau: 'Leading platform', kLuot: 'Streams', kGop: 'Gross revenue', kSo: 'Platforms earning',
      chuaDuyet: 'Period not approved',
      chuaDuyetMo: 'Figures for {k} are what has been loaded so far and will move until the period is approved.',
      thieuNguon: 'Not loaded yet: {n}. Platforms on that feed show 0 in every table for this period.',
      moNhap: 'Open data loading',
      dienBien: 'Trend by platform',
      dienBienMo: 'The five largest platforms for the chosen measure; the rest is folded into Other platforms. Dashed columns are unapproved periods, still moving.',
      tyTrong: 'Share this period', tyTrongMo: 'All nine platforms for {k}, by the chosen measure.',
      moiLuot: 'Streams per dollar',
      moiLuotMo: 'Gross revenue per 1,000 streams for {k}. The platform at the bottom pays the least per stream.',
      donVi: '{c} per 1,000 streams', binhQuan: 'of the period average',
      bang: 'By month',
      bangMo: 'Each column is a reporting period. Columns add up to that period’s gross on the Overview page.',
      ghiChu: 'Unapproved periods show what has been loaded so far. A period without the TikTok feed shows 0 for TikTok: the feed is missing, the platform did not earn nothing.',
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
      return { j: j, ten: c.song(r, 'name'), gross: r.gross[col] || 0, streams: r.streams[col] || 0, khac: j === nR - 1 };
    });
    var tongG = data.totals.gross[col] || 0, tongS = data.totals.streams[col] || 0;
    var tongM = metric === 'streams' ? tongS : tongG;
    var xep = rows.slice().sort(function (a, b) { return b[metric] - a[metric]; });
    var dau = xep[0];
    var coDt = rows.filter(function (x) { return x.gross > 0; }).length;
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
                    : metric === 'streams' ? c.tien(x.gross) : HT.fmt.n(x.streams) + ' ' + t('luotNghe') };
      }) });

    var moi = rows.map(function (x) {
      return { ten: x.ten, j: x.j, khac: x.khac, streams: x.streams, chua: chuaNhapCua(x),
               v: x.streams > 0 ? x.gross / x.streams * 1000 : null };
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

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-mx]', function (el) { LOC.metric = el.getAttribute('data-mx'); c.veLai(); });
    HM.bam(root, '[data-csv]', function () { HTS.csvMaTran('nen-tang-' + LOC.metric + '.csv', data, LOC.metric); });
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
  }
});

})();
