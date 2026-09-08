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
   doanh thu, hoặc phần của bạn; giữ trong LOC.
   ===================================================================== */
"use strict";
(function () {

var LOC = { metric: 'revenue', timDuoi: '' };

HT.dangKy({
  id: 'k-nen-tang', nav: 'navNenTang', nhom: 'nhomBai', icon: 'shop',

  chu: {
    vi: {
      navNenTang: 'Nền tảng', h1: 'Nền tảng',
      moLb: 'Từng nền tảng mang về bao nhiêu lượt nghe và tiền mỗi kỳ, trên mọi bài của nghệ sĩ thuộc label.',
      moNs: 'Từng nền tảng mang về bao nhiêu lượt nghe và bao nhiêu tiền mỗi kỳ, tính trên toàn bộ bài hát của bạn.',
      danDau: 'Nền tảng dẫn đầu', luotKy: 'Lượt nghe', gopKy: 'Doanh thu',
      phanLabel: 'Phần label được hưởng', thuNhap: 'Thu nhập của bạn',
      dienBien: 'Diễn biến theo nền tảng',
      dienBienMo: 'Mỗi cột một kỳ đã xét duyệt, chồng theo nền tảng; năm nền tảng lớn nhất hiện riêng, còn lại gom vào Nền tảng khác.',
      tyTrong: 'Tỷ trọng kỳ {k}',
      tyTrongMo: 'Theo {m}, tính trên tổng của kỳ. Dòng nhỏ dưới tên là mức thay đổi so với kỳ trước.',
      bangThang: 'Bảng theo tháng', bangThangMo: 'Từng nền tảng theo từng kỳ đã xét duyệt, theo {m}.',
      ghiChuBang: 'Mỗi cột là một kỳ đã xét duyệt; cột cộng dọc bằng đúng tổng ở trang Tổng quan của kỳ đó.',
      xuat: 'Xuất CSV', nenTangKhac: 'Nền tảng khác', ky: 'Kỳ',
      chuaKy: 'Chưa có kỳ nào đã xét duyệt',
      chuaKyMo: 'Số liệu theo nền tảng chỉ hiển thị sau khi Haustek xét duyệt kỳ đầu tiên có doanh thu của bạn.',
      tacQuyen: 'Chỉ doanh thu bản ghi. Tác quyền báo cáo theo quý và không tách theo nền tảng nên không có ở đây.',
      kyKhac: 'Kỳ đang chọn ({a}) chưa có trong báo cáo theo nền tảng, nên các ô số ở trên là của kỳ {b}.',
      duoiH2: 'Trong "Nền tảng khác" có gì', cNt: 'Nền tảng', cLuot: 'Lượt nghe', duoiCua: 'Của bạn',
      duoiMo: 'Từng nền tảng nhỏ của kỳ {k}, xếp theo số bạn được hưởng.',
      duoiHoi: 'Bài của bạn lên hơn hai trăm nền tảng ngoài tám nền tảng lớn. Bảng phía trên gộp chúng thành một dòng cho dễ đọc; bảng này bóc dòng ấy ra. Cộng lại đúng bằng dòng "Nền tảng khác", không thiếu đồng nào.',
      duoiTim: 'Tìm tên nền tảng…',
      duoiTong: 'Cộng {n} nền tảng', duoiLoc: 'Cộng {n} nền tảng đang lọc',
      duoiKhong: 'Không có nền tảng nào khớp', duoiKhongMo: 'Xoá bớt chữ trong ô tìm để xem lại cả danh sách.',
      duoiChua: 'Kỳ này chưa có số để bóc'
    },
    en: {
      navNenTang: 'Platforms', h1: 'Platforms',
      moLb: 'Streams and money per platform per period, across every track by your artists.',
      moNs: 'How many streams and how much money each platform brought in per period, across every track of yours.',
      danDau: 'Top platform', luotKy: 'Streams', gopKy: 'Revenue',
      phanLabel: 'Label keeps', thuNhap: 'Yours',
      dienBien: 'Platforms across periods',
      dienBienMo: 'One column per approved period, stacked by platform; top five shown, the rest folded into Other.',
      tyTrong: 'Share in {k}',
      tyTrongMo: 'By {m}, as a share of the period total. The small line under each name is the change from the previous period.',
      bangThang: 'Month by month', bangThangMo: 'Every platform, every approved period, by {m}.',
      ghiChuBang: 'Each column is an approved period; the column total equals the Overview figure for that period.',
      xuat: 'Export CSV', nenTangKhac: 'Other platforms', ky: 'Period',
      chuaKy: 'No approved period yet',
      chuaKyMo: 'Per-platform figures appear once Haustek approves your first earning period.',
      tacQuyen: 'Recording revenue only. Publishing is quarterly and not split by platform, so it is not here.',
      kyKhac: 'The selected period ({a}) is not in the platform report yet, so the figures above are for {b}.',
      duoiH2: 'What is inside "Other platforms"', cNt: 'Platform', cLuot: 'Streams', duoiCua: 'Yours',
      duoiMo: 'Every smaller platform in {k}, by what you earned.',
      duoiHoi: 'Your tracks reach more than two hundred platforms beyond the big eight. The table above folds them into one line so it stays readable; this one unfolds it. The total matches the "Other platforms" row exactly.',
      duoiTim: 'Search platform name…',
      duoiTong: '{n} platforms', duoiLoc: '{n} platforms in this filter',
      duoiKhong: 'No platform matches', duoiKhongMo: 'Clear some of the search text to see the whole list again.',
      duoiChua: 'No figures to unfold for this period'
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
    var TEN = { streams: HTS.t('luot'), revenue: HTS.t('gop'), mine: mineLabel };
    var dinhDang = metric === 'streams' ? 'so' : 'tien';

    /* Kỳ đang chọn; không có trong báo cáo thì lấy kỳ mới nhất và nói rõ. */
    var idx = -1;
    per.forEach(function (p, i) { if (p.k === c.kyKey) idx = i; });
    var kyKhac = idx < 0;
    if (kyKhac) idx = per.length - 1;
    var ky = per[idx];

    /* ---- ô số đầu trang: kỳ đang chọn ---- */
    var dan = null;
    rows.forEach(function (r) { if (!dan || (r.revenue[idx] || 0) > (dan.revenue[idx] || 0)) dan = r; });
    var gopKy = tot.revenue[idx] || 0;
    var html = HM.dau({
      h1: HM.esc(t('h1')),
      mo: HM.esc(la ? t('moLb') : t('moNs')),
      so: [
        { l: t('danDau') + ' ' + ky.label,
          v: dan && gopKy > 0 ? c.song(dan, 'name') + ' · ' + HT.fmt.pct((dan.revenue[idx] || 0) / gopKy) : '—' },
        { l: t('luotKy') + ' ' + ky.label, v: HT.fmt.n(tot.streams[idx] || 0) },
        { l: t('gopKy') + ' ' + ky.label, v: HT.fmt.usd0(gopKy) },
        la ? { l: mineLabel + ' ' + ky.label, v: HT.fmt.usd0(tot.mine[idx] || 0), mau: 'var(--ok)' } : null
      ].filter(Boolean)
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
        hanhDong: HTS.chonThuocDo(metric, { mineLabel: mineLabel, revenueLabel: t('gopKy'), anMine: !la }),
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

    html += veDuoi(c, ky);

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-mx]', function (el) { LOC.metric = el.getAttribute('data-mx'); c.veLai(); });
    HM.bam(root, '[data-xuat]', function () {
      HTS.csvMaTran('nen-tang-' + me.clientId + '-' + metric + '.csv', d, metric);
    });
    HM.nhap(root, '[data-tim-duoi]', function (el) {
      LOC.timDuoi = el.value;
      var o = root.querySelector('#k-nt-duoi'); if (o) o.innerHTML = bangDuoi(c, ky);
    });
  }
});

/* ---------------------------------------------------------------
   Bảng trên gộp hơn hai trăm nền tảng nhỏ vào một dòng cho dễ đọc.
   Đối tác vẫn có quyền biết dòng ấy gồm những gì — tiền của họ nằm
   trong đó. Bóc ra ở đây, cùng một phép chia nên tổng khớp.
   --------------------------------------------------------------- */
function veDuoi(c, ky) {
  var t = c.t;
  return HM.the({
    h2: HM.esc(t('duoiH2')), p: HM.esc(t('duoiMo').replace('{k}', ky.label)), thoBody: true,
    hanhDong: HM.hoi(t('duoiHoi')),
    than: '<div class="bar" style="padding:10px 14px 0">' +
        '<input class="in" type="search" data-tim-duoi placeholder="' + HM.esc(t('duoiTim')) + '" value="' + HM.esc(LOC.timDuoi) + '" style="max-width:260px">' +
      '</div><div id="k-nt-duoi">' + bangDuoi(c, ky) + '</div>'
  });
}
function bangDuoi(c, ky) {
  var api = c.api, me = c.phien.me, t = c.t;
  var d;
  try { d = api.platformTail(me.role, me.partyId, ky.k); } catch (e) { return HM.trong({ icon: 'shop', tieuDe: t('duoiChua'), moTa: '' }); }
  var q = (LOC.timDuoi || '').trim().toLowerCase();
  var ds = q ? d.rows.filter(function (r) { return r.name.toLowerCase().indexOf(q) >= 0; }) : d.rows;
  if (!ds.length) return HM.trong({ icon: 'shop', tieuDe: t('duoiKhong'), moTa: t('duoiKhongMo') });
  var max = ds[0].mine || 1;
  var tongLoc = ds.reduce(function (s2, r) { return s2 + r.mine; }, 0);
  return '<div class="tw" style="max-height:400px;overflow:auto">' +
    '<table class="t"><thead><tr><th>' + HM.esc(t('cNt')) + '</th><th class="num">' + HM.esc(t('duoiCua')) +
      '</th><th class="num">' + HM.esc(t('cLuot')) + '</th></tr></thead><tbody>' +
    ds.map(function (r, i) {
      return '<tr><td>' + HM.tenBia({ ten: r.name, seed: r.name, phu: (i + 1) + '/' + d.coSo }) + '</td>' +
        '<td class="num">' + HM.oThanh(r.mine, max, { chu: HT.fmt.usd(r.mine) }) + '</td>' +
        '<td class="num mono">' + HM.esc(HT.fmt.n(r.streams)) + '</td></tr>';
    }).join('') +
    '<tr class="sum"><td><b>' + HM.esc(q ? t('duoiLoc').replace('{n}', ds.length) : t('duoiTong').replace('{n}', d.coSo)) + '</b></td>' +
      '<td class="num mono"><b>' + HM.esc(HT.fmt.usd(tongLoc)) + '</b></td>' +
      '<td class="num mono"><b>' + HM.esc(HT.fmt.n(ds.reduce(function (s2, r) { return s2 + r.streams; }, 0))) + '</b></td></tr>' +
    '</tbody></table></div>';
}

})();
