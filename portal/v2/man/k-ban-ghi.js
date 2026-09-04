/* =====================================================================
   CỔNG KHÁCH · BÀI CỦA TÔI
   ---------------------------------------------------------------------
   Danh sách bài, tìm được, sắp xếp được, mở ra xem được. Với label thì
   đây là bài của các nghệ sĩ trong label; với nghệ sĩ là bài của chính
   họ; với dòng tác quyền là bài họ có phần sáng tác.

   Điều màn này phải nói rõ: cột "về tay bạn" KHÁC cột "doanh thu gộp",
   và khác bao nhiêu thì mở một bài ra là thấy từng chặng.
   ===================================================================== */
"use strict";
(function () {

var LUONG = 'rec';
var LOC = { tim: '', sap: 'mine', huong: -1, trang: 0, co: 25 };

HT.dangKy({
  id: 'k-ban-ghi', nav: 'navBai', icon: 'disc',

  chu: {
    vi: {
      navBai: 'Bài hát của tôi', h1: 'Bài hát của tôi',
      moNs: 'Từng bài hát của bạn trong kỳ này, cùng thu nhập của bạn trên mỗi bài hát.',
      moLb: 'Từng bài hát của các nghệ sĩ thuộc label của bạn, cùng phần label được hưởng trên mỗi bài hát.',
      banGhi: 'Doanh thu bản ghi', tacQuyen: 'Tác quyền',
      tim: 'Tìm theo tên bài hát, mã ISRC hoặc nghệ sĩ…',
      cBai: 'Bài hát', cNs: 'Nghệ sĩ', cLoai: 'Loại', cLuot: 'Lượt nghe',
      cGop: 'Doanh thu gộp', cToi: 'Thu nhập của bạn', cLabel: 'Phần label được hưởng',
      tongBai: 'Bài hát có doanh thu', tongGop: 'Tổng doanh thu gộp', tongToi: 'Tổng thu nhập của bạn',
      khong: 'Không tìm thấy bài hát nào',
      khongMo: 'Bạn thử tìm bằng mã ISRC, hoặc xoá nội dung ô tìm kiếm.',
      chuaMo: 'Kỳ này chưa chốt sổ',
      chuaMoMo: 'Số liệu chỉ hiển thị sau khi Haustek đối soát xong với tất cả các nền tảng.',
      trong: 'Kỳ này chưa có bài hát nào của bạn có doanh thu',
      xuat: 'Tải danh sách (CSV)', hienThi: 'Đang hiển thị',
      tqTrong: 'Kỳ này chưa có báo cáo tác quyền',
      tqTrongMo: 'Tác quyền được chốt theo quý, và các tổ chức quản lý tác quyền thường báo cáo trễ một đến hai quý. Phần lớn các kỳ không có báo cáo tác quyền, đây là điều bình thường.',
      tqCo: 'Các kỳ đã có báo cáo tác quyền', soSangTac: 'Bài hát bạn có phần sáng tác',
      tqGiaiThich: 'Tác quyền khác doanh thu bản ghi như thế nào',
      tqG1: 'Doanh thu bản ghi được trả cho <b>bản thu</b>: người tạo ra bản thu đó được nhận. Khoản này được thanh toán hằng tháng qua các nền tảng.',
      tqG2: 'Tác quyền được trả cho <b>bài hát</b>: người viết giai điệu và lời được nhận, kể cả khi người khác trình bày. Khoản này được thanh toán theo quý qua các tổ chức quản lý tác quyền.',
      tqG3: 'Hai dòng tiền này độc lập với nhau. Một bài hát có thể có doanh thu ở dòng này mà chưa có ở dòng kia, và ngược lại.',
      xemHoSo: 'Xem quy trình phát hành và nền tảng'
    },
    en: {
      navBai: 'My tracks', h1: 'My tracks',
      moNs: 'Every track of yours this period, and your share on each.',
      moLb: 'Every track by artists on your label, and the label’s share on each.',
      banGhi: 'Recording revenue', tacQuyen: 'Publishing',
      tim: 'Search title, ISRC, artist…',
      cBai: 'Track', cNs: 'Artist', cLoai: 'Type', cLuot: 'Streams',
      cGop: 'Gross', cToi: 'Yours', cLabel: 'Label keeps',
      tongBai: 'Earning tracks', tongGop: 'Total gross', tongToi: 'Total yours',
      khong: 'No track matches',
      khongMo: 'Try an ISRC, or clear the search box.',
      chuaMo: 'Period not open',
      chuaMoMo: 'This period is not closed yet. Figures open once reconciliation with every platform is finished.',
      trong: 'None of your tracks earned this period',
      xuat: 'Download list (CSV)', hienThi: 'Showing',
      tqTrong: 'No publishing report for this period',
      tqTrongMo: 'Publishing settles quarterly and societies usually report one to two quarters late. Most periods have no report at all — that is normal.',
      tqCo: 'Periods with a publishing report', soSangTac: 'Works you co-wrote',
      tqGiaiThich: 'How publishing differs from recording revenue',
      tqG1: 'Recording revenue pays for the <b>master</b> — whoever made that recording is paid. It arrives monthly through the platforms.',
      tqG2: 'Publishing pays for the <b>song</b> — whoever wrote the melody and lyric is paid, even when someone else sings it. It arrives quarterly through collecting societies.',
      tqG3: 'The two streams are independent. A track can be earning in one and not yet in the other, and the other way round.',
      xemHoSo: 'Pipeline and platforms'
    }
  },

  dem: function (c) {
    try {
      return HT.fmt.n(c.api.tracks(c.phien.me.role, c.phien.me.partyId, c.kyKey, 'rec', {}).total);
    } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t;
    var coPub = me.hasPublishing;
    if (!coPub) LUONG = 'rec';
    var la = me.role === 'label';

    var kq;
    try { kq = api.tracks(me.role, me.partyId, c.kyKey, LUONG, { q: LOC.tim, sort: LOC.sap, dir: LOC.huong }); }
    catch (e) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) }) +
        HM.the({ than: HM.trong({ icon: 'clock', tieuDe: t('chuaMo'), moTa: t('chuaMoMo') }) });
      return;
    }

    var tongGop = 0, tongToi = 0;
    kq.rows.forEach(function (r) { tongGop += r.gross; tongToi += r.mine; });

    var het = Math.max(0, Math.ceil(kq.rows.length / LOC.co) - 1);
    if (LOC.trang > het) LOC.trang = het;
    var dau = LOC.trang * LOC.co;
    var trang = kq.rows.slice(dau, dau + LOC.co);

    var html = HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>',
      mo: HM.esc(la ? t('moLb') : t('moNs')),
      so: [
        { l: t('tongBai'), v: HT.fmt.n(kq.rows.length) },
        { l: t('tongGop'), v: HT.fmt.usd0(tongGop) },
        { l: la ? t('cLabel') : t('cToi'), v: HT.fmt.usd0(tongToi) }
      ]
    });

    if (coPub) {
      html += HM.tabs([
        { k: 'rec', l: t('banGhi'), icon: 'disc' },
        { k: 'pub', l: t('tacQuyen'), icon: 'book' }
      ], LUONG);
    }

    html += '<div class="bar">' +
      '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim placeholder="' +
        HM.esc(t('tim')) + '" value="' + HM.esc(LOC.tim) + '"></div>' +
      '<div class="sp"></div>' +
      (kq.rows.length ? '<button type="button" class="btn sm" data-xuat>' + HM.icon('down2') + HM.esc(t('xuat')) + '</button>' : '') +
      '</div>';

    var cot = [
      { k: 'title', l: t('cBai') },
      la ? { k: 'artist', l: t('cNs') } : null,
      { k: 'type', l: t('cLoai'), s: false, w: '80px' },
      LUONG === 'rec' ? { k: 'streams', l: t('cLuot'), num: true, w: '116px' } : null,
      { k: 'gross', l: t('cGop'), num: true, w: '124px' },
      { k: 'mine', l: la ? t('cLabel') : t('cToi'), num: true, w: '130px' }
    ].filter(Boolean);

    html += HM.the({
      thoBody: true,
      than: kq.rows.length
        ? '<div class="card-h" style="padding-bottom:12px"><div class="pager">' +
            '<button type="button" class="pg" data-tr="-1"' + (LOC.trang === 0 ? ' disabled' : '') + '>' + HM.icon('left') + '</button>' +
            '<button type="button" class="pg" data-tr="1"' + (dau + LOC.co >= kq.rows.length ? ' disabled' : '') + '>' + HM.icon('right') + '</button>' +
          '</div><div class="range">' + HT.fmt.n(dau + 1) + '–' + HT.fmt.n(Math.min(kq.rows.length, dau + LOC.co)) +
            ' ' + HM.esc(c.CHU[c.lang].of) + ' ' + HT.fmt.n(kq.rows.length) + '</div>' +
            '<div class="sp"></div><div class="range">' + HM.esc(HT.fmt.usd(tongToi)) + '</div></div>' +
          '<div class="tw"><table class="t"><thead><tr>' + cot.map(function (x) {
            var on = LOC.sap === x.k;
            return '<th class="' + (x.num ? 'num ' : '') + (x.s === false ? '' : 's ') + (on ? 'sorted band' : '') + '"' +
              (x.s === false ? '' : ' data-sx="' + x.k + '"') + (x.w ? ' style="width:' + x.w + '"' : '') + '>' +
              HM.esc(x.l) + (on ? '<span class="ar">' + (LOC.huong > 0 ? '↑' : '↓') + '</span>' : '') + '</th>';
          }).join('') + '</tr></thead><tbody>' +
          trang.map(function (r) {
            return '<tr class="pick" data-bg="' + r.id + '">' +
              '<td><div class="t-ttl">' + HM.esc(HM.dai(r.title, 36)) + '</div>' +
              '<div class="t-sub">' + HM.esc(r.isrc) + '</div></td>' +
              (la ? '<td>' + HM.esc(HM.dai(r.artist, 26)) + '</td>' : '') +
              '<td>' + HM.esc(r.type) + '</td>' +
              (LUONG === 'rec' ? '<td class="num">' + HM.esc(HT.fmt.n(r.streams)) + '</td>' : '') +
              '<td class="num">' + HM.esc(HT.fmt.usd0(r.gross)) + '</td>' +
              '<td class="num band"><b>' + HM.esc(HT.fmt.usd(r.mine)) + '</b></td></tr>';
          }).join('') + '</tbody><tfoot><tr>' +
          '<td colspan="' + (cot.length - 2) + '">' + HM.esc(c.lang === 'vi' ? 'Tổng cộng' : 'Total') + '</td>' +
          '<td class="num">' + HM.esc(HT.fmt.usd(tongGop)) + '</td>' +
          '<td class="num band">' + HM.esc(HT.fmt.usd(tongToi)) + '</td></tr></tfoot></table></div>' +
          '<div class="card-f"><span class="sp" style="flex:1"></span>' + HM.esc(c.CHU[c.lang].showing) +
            ' <select class="inline-sel" data-co>' + [12, 25, 50, 100].map(function (n) {
              return '<option value="' + n + '"' + (n === LOC.co ? ' selected' : '') + '>' + n + '</option>';
            }).join('') + '</select> ' + HM.esc(c.CHU[c.lang].rows) + '</div>'
        : HM.trong({ icon: LOC.tim ? 'tim' : (LUONG === 'pub' ? 'cal' : 'disc'),
            tieuDe: LOC.tim ? t('khong') : (LUONG === 'pub' ? t('tqTrong') : t('trong')),
            moTa: LOC.tim ? t('khongMo')
              : LUONG === 'pub' ? t('tqTrongMo')
              : (c.lang === 'vi'
                 ? 'Kỳ này chưa có nền tảng nào báo cáo doanh thu cho bài hát của bạn.'
                 : 'No platform reported revenue for your tracks this period.') })
    });

    /* Danh sách trống ở tab tác quyền là chuyện xảy ra ở phần lớn các kỳ.
       Để trống trơn thì người đọc tưởng mình mất tiền — nên ở đây nói rõ
       hai dòng tiền khác nhau chỗ nào, và chỉ sang đúng kỳ có số. */
    if (!kq.rows.length && !LOC.tim && LUONG === 'pub') {
      var kyCo = c.phien.kyTacQuyen || [];
      html += '<div class="grid g2">' +
        HM.the({
          h2: HM.esc(t('tqGiaiThich')),
          than: '<p class="say">' + t('tqG1') + '</p>' +
            '<p class="say">' + t('tqG2') + '</p>' +
            '<p class="say">' + t('tqG3') + '</p>'
        }) +
        HM.the({
          h2: HM.esc(t('tqCo')),
          than: HM.so([{ l: t('soSangTac'), v: HT.fmt.n(me.compositionCount) }]) +
            (kyCo.length
              ? '<div class="btnrow" style="margin-top:14px">' + kyCo.slice().reverse().map(function (pp) {
                  return '<button type="button" class="pill" data-kyto="' + HM.esc(pp.k) + '">' +
                    HM.esc(pp.label) + '</button>';
                }).join('') + '</div>'
              : '<p class="hint" style="margin-top:12px">' + HM.esc(c.lang === 'vi'
                  ? 'Chưa có kỳ nào có báo cáo tác quyền đã chốt sổ.'
                  : 'No period has a closed publishing report yet.') + '</p>')
        }) + '</div>';
    }

    root.innerHTML = html;
    HB.gan(root);

    HM.bam(root, '[data-tab]', function (el) { LUONG = el.getAttribute('data-tab'); LOC.trang = 0; c.veLai(); });
    HM.nhap(root, '[data-tim]', function (el) { LOC.tim = el.value; LOC.trang = 0; c.veLai(); }, 240);
    HM.doi(root, '[data-co]', function (el) { LOC.co = +el.value; LOC.trang = 0; c.veLai(); });
    HM.bam(root, '[data-tr]', function (el) { LOC.trang += +el.getAttribute('data-tr'); c.veLai(); });
    HM.bam(root, '[data-sx]', function (el) {
      var k = el.getAttribute('data-sx');
      if (LOC.sap === k) LOC.huong = -LOC.huong;
      else { LOC.sap = k; LOC.huong = (k === 'title' || k === 'artist' || k === 'isrc') ? 1 : -1; }
      LOC.trang = 0; c.veLai();
    });
    HM.bam(root, '[data-bg]', function (el) { moBai(c, +el.getAttribute('data-bg'), LUONG, la); });
    HM.bam(root, '[data-kyto]', function (el) { c.doiKy(el.getAttribute('data-kyto')); });
    HM.bam(root, '[data-xuat]', function () {
      HM.csv('bai-cua-toi-' + c.kyKey + '.csv',
        ['ISRC', 'Tên bài hát', 'Loại', 'Nghệ sĩ', 'Lượt nghe', 'Doanh thu gộp USD',
         (la ? 'Phần label được hưởng' : 'Thu nhập của bạn') + ' USD'],
        kq.rows.map(function (r) {
          return [r.isrc, r.title, r.type, r.artist, r.streams == null ? '' : r.streams,
                  r.gross.toFixed(2), r.mine.toFixed(2)];
        }));
    });
  }
});

function moBai(c, id, luong, la) {
  var api = c.api, me = c.phien.me, P = HB.dayMau();
  var d;
  try { d = api.trackDetail(me.role, me.partyId, c.kyKey, luong, id); }
  catch (e) { c.thongBao(e.message, 'no'); return; }

  c.nganTruot(
    HM.so([
      { l: la ? c.t('cLabel') : c.t('cToi'), v: HT.fmt.usd(d.mine), lon: true },
      { l: c.t('cGop'), v: HT.fmt.usd0(d.gross) },
      d.streams != null ? { l: c.t('cLuot'), v: HT.fmt.n(d.streams) } : null
    ].filter(Boolean)) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Chi tiết dòng tiền của bài hát này' : 'Where this track’s money went') + '</h4>' +
    '<div class="wf">' + d.steps.map(function (st) {
      return '<div class="st ' + (st.strong ? 'fin' : (st.value != null && st.value < 0 ? 'out' : '')) + '">' +
        '<div class="mk"></div><div><div class="lbl">' + HM.esc(c.song(st, 'label')) + '</div></div>' +
        '<div class="amt">' + HM.esc(st.value != null ? HT.fmt.usd(st.value) : st.text) + '</div></div>';
    }).join('') + '</div>' +
    (d.byStore.length ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Thu nhập theo nền tảng' : 'Where it was played') + '</h4>' +
      HB.o({ loai: 'thanh', hang: d.byStore.map(function (x, i) { return { ten: c.song(x, 'name'), gt: x.value, mau: P[i % 8] }; }) }) : '') +
    (d.byTerritory.length ? '<h4 class="sec">' + (c.lang === 'vi' ? 'Thu nhập theo thị trường' : 'From where') + '</h4>' +
      HB.o({ loai: 'thanh', hang: d.byTerritory.map(function (x, i) { return { ten: c.song(x, 'name'), gt: x.value, mau: P[i % 8] }; }) }) : '') +
    '<div class="hint" style="margin-top:14px">' + HM.esc(c.lang === 'vi'
      ? 'Số liệu tách theo nền tảng và thị trường là phần bạn được hưởng trên bài hát này, không phải doanh thu gộp, nên cộng lại đúng bằng con số lớn ở trên.'
      : 'The store and territory splits show YOUR share of this track, not gross — so they add back to the figure at the top.') + '</div>' +
    /* Sang hồ sơ bài hát (quy trình phát hành, nền tảng, theo tháng). Chỉ
       với doanh thu bản ghi: tác quyền không tách theo nền tảng. */
    (luong === 'rec'
      ? '<div class="btnrow" style="margin-top:14px"><button type="button" class="btn sm" data-ho-so>' +
        HM.icon('layers') + HM.esc(c.t('xemHoSo')) + '</button></div>'
      : ''),
    { tieuDe: d.title, phu: d.isrc + ' · ' + d.type + (d.artist ? ' · ' + d.artist : ''),
      khiMo: function (dr) {
        HB.gan(dr);
        HM.bam(dr, '[data-ho-so]', function () {
          var hs;
          try { hs = api.trackAsset(me.role, me.partyId, id); }
          catch (e) { c.thongBao(e.message, 'no'); return; }
          /* c.nganTruot tự thay ngăn cũ bằng ngăn mới */
          HTS.moNgan(c, hs, { mineLabel: la ? c.t('cLabel') : c.t('cToi'), tien: HT.fmt.usd, tien0: HT.fmt.usd0, tabDau: 'nt' });
        });
      } });
}

})();
