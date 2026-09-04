/* =====================================================================
   CỔNG ĐỐI TÁC · NỀN TẢNG
   ---------------------------------------------------------------------
   Câu hỏi của trang: từng nền tảng (Spotify, YouTube Music, TikTok,
   Apple Music, Zing MP3, NhacCuaTui, Facebook, Instagram và phần còn
   lại) mang về bao nhiêu lượt nghe và bao nhiêu tiền MỖI KỲ, tính trên
   toàn bộ bài hát của tài khoản.

   Trang không đổi theo kỳ đang chọn (mọi kỳ đã xét duyệt đều có mặt),
   nhưng kỳ đang chọn được làm nổi trong biểu đồ và là kỳ của các ô số
   đầu trang và của thẻ tỷ trọng. Một thước đo cho cả ba thẻ: lượt nghe,
   doanh thu gộp, hoặc phần của bạn; giữ trong LOC.
   ===================================================================== */
"use strict";
(function () {

var LOC = { metric: 'gross' };

HT.dangKy({
  id: 'k-nen-tang', nav: 'navNenTang', nhom: 'nhomBai', icon: 'shop',

  chu: {
    vi: {
      navNenTang: 'Nền tảng', h1: 'Nền tảng',
      moLb: 'Từng nền tảng mang về bao nhiêu lượt nghe và bao nhiêu tiền mỗi kỳ, tính trên toàn bộ bài hát của các nghệ sĩ thuộc label.',
      moNs: 'Từng nền tảng mang về bao nhiêu lượt nghe và bao nhiêu tiền mỗi kỳ, tính trên toàn bộ bài hát của bạn.',
      danDau: 'Nền tảng dẫn đầu', luotKy: 'Lượt nghe', gopKy: 'Doanh thu gộp',
      phanLabel: 'Phần label được hưởng', thuNhap: 'Thu nhập của bạn',
      dienBien: 'Diễn biến theo nền tảng',
      dienBienMo: 'Mỗi cột là một kỳ đã xét duyệt, chồng theo nền tảng. Năm nền tảng lớn nhất hiện riêng, phần còn lại gộp vào "Nền tảng khác".',
      tyTrong: 'Tỷ trọng kỳ {k}',
      tyTrongMo: 'Theo {m}, tính trên tổng của kỳ. Dòng nhỏ dưới tên là mức thay đổi so với kỳ trước.',
      bangThang: 'Bảng theo tháng', bangThangMo: 'Từng nền tảng theo từng kỳ đã xét duyệt, theo {m}.',
      ghiChuBang: 'Mỗi cột là một kỳ đã xét duyệt; cột cộng dọc bằng đúng tổng ở trang Tổng quan của kỳ đó.',
      xuat: 'Xuất CSV', nenTangKhac: 'Nền tảng khác', ky: 'Kỳ',
      chuaKy: 'Chưa có kỳ nào đã xét duyệt',
      chuaKyMo: 'Số liệu theo nền tảng chỉ hiển thị sau khi Haustek xét duyệt kỳ đầu tiên có doanh thu của bạn.',
      tacQuyen: 'Trang này chỉ nói về doanh thu bản ghi. Tác quyền được các tổ chức quản lý tác quyền báo cáo theo quý và không tách theo nền tảng, nên không có ở đây.',
      kyKhac: 'Kỳ đang chọn ({a}) chưa có trong báo cáo theo nền tảng, nên các ô số ở trên là của kỳ {b}.'
    },
    en: {
      navNenTang: 'Platforms', h1: 'Platforms',
      moLb: 'How many streams and how much money each platform brought in per period, across every track by artists on your label.',
      moNs: 'How many streams and how much money each platform brought in per period, across every track of yours.',
      danDau: 'Top platform', luotKy: 'Streams', gopKy: 'Gross revenue',
      phanLabel: 'Label keeps', thuNhap: 'Yours',
      dienBien: 'Platforms across periods',
      dienBienMo: 'One column per approved period, stacked by platform. The five largest platforms are shown on their own; the rest are folded into “Other platforms”.',
      tyTrong: 'Share in {k}',
      tyTrongMo: 'By {m}, as a share of the period total. The small line under each name is the change from the previous period.',
      bangThang: 'Month by month', bangThangMo: 'Every platform, every approved period, by {m}.',
      ghiChuBang: 'Each column is an approved period; the column total equals the Overview figure for that period.',
      xuat: 'Export CSV', nenTangKhac: 'Other platforms', ky: 'Period',
      chuaKy: 'No approved period yet',
      chuaKyMo: 'Per-platform figures appear once Haustek approves your first earning period.',
      tacQuyen: 'This page covers recording revenue only. Publishing is reported quarterly by collecting societies and is not split by platform, so it is not shown here.',
      kyKhac: 'The selected period ({a}) is not in the platform report yet, so the figures above are for {b}.'
    }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, P = HB.dayMau();
    var la = me.role === 'label';
    var mineLabel = la ? t('phanLabel') : t('thuNhap');

    var d = null;
    try { d = api.platformReport(me.role, me.partyId); } catch (e) { d = null; }
    if (!d || !d.periods || !d.periods.length) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(la ? t('moLb') : t('moNs')) }) +
        HM.the({ than: HM.trong({ icon: 'clock', tieuDe: t('chuaKy'), moTa: t('chuaKyMo') }) });
      return;
    }

    var metric = LOC.metric;
    var per = d.periods, rows = d.rows, tot = d.totals;
    var TEN = { streams: HTS.t('luot'), gross: HTS.t('gop'), mine: mineLabel };
    var dinhDang = metric === 'streams' ? 'so' : 'tien';

    /* Kỳ đang chọn; không có trong báo cáo thì lấy kỳ mới nhất và nói rõ. */
    var idx = -1;
    per.forEach(function (p, i) { if (p.k === c.kyKey) idx = i; });
    var kyKhac = idx < 0;
    if (kyKhac) idx = per.length - 1;
    var ky = per[idx];

    /* ---- ô số đầu trang: kỳ đang chọn ---- */
    var dan = null;
    rows.forEach(function (r) { if (!dan || (r.gross[idx] || 0) > (dan.gross[idx] || 0)) dan = r; });
    var gopKy = tot.gross[idx] || 0;
    var html = HM.dau({
      h1: HM.esc(t('h1')),
      mo: HM.esc(la ? t('moLb') : t('moNs')),
      so: [
        { l: t('danDau') + ' ' + ky.label,
          v: dan && gopKy > 0 ? c.song(dan, 'name') + ' · ' + HT.fmt.pct((dan.gross[idx] || 0) / gopKy) : '—' },
        { l: t('luotKy') + ' ' + ky.label, v: HT.fmt.n(tot.streams[idx] || 0) },
        { l: t('gopKy') + ' ' + ky.label, v: HT.fmt.usd0(gopKy) },
        { l: mineLabel + ' ' + ky.label, v: HT.fmt.usd0(tot.mine[idx] || 0), mau: 'var(--ok)' }
      ]
    });
    if (kyKhac) html += '<p class="hint" style="margin:0 0 14px">' +
      HM.esc(t('kyKhac').replace('{a}', c.ky ? c.ky.label : String(c.kyKey)).replace('{b}', ky.label)) + '</p>';
    /* Nghệ sĩ có tác quyền: nói rõ trang này không có dòng tiền đó, kẻo
       tưởng thiếu. */
    if (me.hasPublishing) html += '<p class="hint" style="margin:0 0 14px">' + HM.esc(t('tacQuyen')) + '</p>';

    /* ---- xếp hạng theo tổng của thước đo, dòng "Nền tảng khác" của API
       luôn gộp vào phần còn lại; mỗi nền tảng một màu dùng chung cho cả
       hai biểu đồ, năm nền tảng lớn nhất màu riêng, còn lại chung màu thứ
       sáu vì trên biểu đồ cột chúng là một chuỗi. ---- */
    var tongHang = function (r) { return r[metric].reduce(function (a, b) { return a + b; }, 0); };
    var laKhac = function (r) { return r.name === 'Nền tảng khác' || r.nameEn === 'Other platforms'; };
    var xep = rows.filter(function (r) { return !laKhac(r); }).sort(function (a, b) { return tongHang(b) - tongHang(a); });
    var top = xep.slice(0, 5), conLai = xep.slice(5).concat(rows.filter(laKhac));
    var mauCua = {};
    top.forEach(function (r, i) { mauCua[r.name] = P[i]; });
    conLai.forEach(function (r) { mauCua[r.name] = P[5]; });

    var chuoi = top.map(function (r) { return { ten: c.song(r, 'name'), gt: r[metric].slice(), mau: mauCua[r.name] }; });
    if (conLai.length) chuoi.push({
      ten: t('nenTangKhac'), mau: P[5],
      gt: per.map(function (_, i) { return conLai.reduce(function (s, r) { return s + (r[metric][i] || 0); }, 0); })
    });
    var bieuDo = HB.o({
      loai: 'cot', cao: 250, chuThich: true, noiBat: idx, dinhDang: dinhDang,
      truc: per.map(function (p) { return p.label; }),
      tieuDeTip: function (i) { return t('ky') + ' ' + per[i].label; },
      chuoi: chuoi
    });

    /* ---- tỷ trọng kỳ đang chọn: 9 nền tảng, phần trăm do HB tự ghi;
       dòng phụ là thay đổi so với kỳ trước. ---- */
    var truoc = idx > 0 ? per[idx - 1] : null;
    var hang = rows.slice().sort(function (a, b) { return (b[metric][idx] || 0) - (a[metric][idx] || 0); });
    var thanh = HB.o({
      loai: 'thanh', dinhDang: dinhDang, tenTong: TEN[metric],
      hang: hang.map(function (r) {
        var l = truoc ? HM.lech(r[metric][idx] || 0, r[metric][idx - 1] || 0, truoc.label) : null;
        return { ten: c.song(r, 'name'), gt: r[metric][idx] || 0, mau: mauCua[r.name] || P[5], phu: l ? l.chu : '' };
      })
    });

    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('dienBien')), p: HM.esc(t('dienBienMo')),
        hanhDong: HTS.chonThuocDo(metric, { mineLabel: mineLabel }),
        than: bieuDo
      }) +
      HM.the({
        h2: HM.esc(t('tyTrong').replace('{k}', ky.label)),
        p: HM.esc(t('tyTrongMo').replace('{m}', TEN[metric].toLowerCase())),
        than: thanh
      }) + '</div>';

    /* ---- bảng nền tảng × kỳ ---- */
    html += HM.the({
      h2: HM.esc(t('bangThang')), p: HM.esc(t('bangThangMo').replace('{m}', TEN[metric].toLowerCase())),
      hanhDong: '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>',
      thoBody: true,
      than: '<div style="height:12px"></div>' + HTS.maTran(d, { metric: metric, tien: HT.fmt.usd0, tien2: HT.fmt.usd }),
      chan: HM.esc(t('ghiChuBang'))
    });

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-mx]', function (el) { LOC.metric = el.getAttribute('data-mx'); c.veLai(); });
    HM.bam(root, '[data-xuat]', function () {
      HTS.csvMaTran('nen-tang-' + me.clientId + '-' + metric + '.csv', d, metric);
    });
  }
});

})();
