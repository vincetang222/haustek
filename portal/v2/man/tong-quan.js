/* =====================================================================
   NỘI BỘ · TỔNG QUAN VẬN HÀNH
   ---------------------------------------------------------------------
   Màn hình đầu tiên người vận hành mở mỗi sáng. Nó phải trả lời đúng ba
   câu, theo thứ tự đó:
     1. Kỳ này đã đóng được chưa? Nếu chưa thì còn vướng gì?
     2. Tiền kỳ này bao nhiêu, chia đi đâu, so kỳ trước ra sao?
     3. Có gì đang treo mà không ai đụng tới không?
   Mọi thứ khác là phụ. Đưa biểu đồ đẹp lên trước ba câu đó là thiết kế
   cho người xem qua, không phải cho người làm việc.
   ===================================================================== */
"use strict";
HT.dangKy({
  id: 'tong-quan', nav: 'navTongQuan', nhom: 'nhomVanHanh', icon: 'grid',

  chu: {
    vi: {
      nhomVanHanh: 'Vận hành', navTongQuan: 'Tổng quan',
      h1: 'Tổng quan vận hành',
      mo: 'Trạng thái kỳ đang xem, phân bổ doanh thu của kỳ, và những việc còn chờ xử lý.',
      gop: 'Doanh thu gộp', phi: 'Phí dịch vụ Haustek', nghesi: 'Phần nghệ sĩ được hưởng',
      label: 'Phần label được hưởng', producer: 'Điểm producer', treo: 'Tiền chưa khớp ISRC',
      luot: 'Lượt nghe', bai: 'Bản ghi có doanh thu',
      dienBien: 'Diễn biến 12 kỳ', dienBienMo: 'Tách theo nguồn báo cáo. Cột nét đứt là kỳ chưa xét duyệt, số liệu còn thay đổi.',
      chiaTien: 'Phân bổ doanh thu kỳ này',
      cuaHang: 'Nền tảng', lanhTho: 'Thị trường',
      benNhan: 'Bên thụ hưởng lớn nhất kỳ này',
      dieuKien: 'Điều kiện xét duyệt kỳ', xemDoiChieu: 'Mở trang đối soát',
      hangCho: 'Danh sách chờ khớp ISRC', moHangCho: 'Mở danh sách chờ khớp',
      nhatKy: 'Nhật ký thao tác gần đây', xemHet: 'Xem tất cả',
      duyet: 'Kỳ đã xét duyệt', chuaDuyet: 'Kỳ chưa xét duyệt',
      dangMo: 'Kỳ này chưa mở cho label và nghệ sĩ. Số liệu chỉ mở ra sau khi kỳ được xét duyệt.',
      daMo: 'Kỳ này đã mở cho label và nghệ sĩ. Xét duyệt lúc',
      conThieu: 'Còn thiếu', xong: 'Đủ điều kiện xét duyệt kỳ',
      dong: 'dòng', tien: 'Số tiền', khong: 'Không có dòng nào chờ khớp',
      soVoi: 'so với', khac: 'nền tảng khác', luotNghe: 'lượt nghe'
    },
    en: {
      nhomVanHanh: 'Operations', navTongQuan: 'Overview',
      h1: 'Operations overview',
      mo: 'Status of the selected period, where its money went, and what is still open.',
      gop: 'Gross revenue', phi: 'Haustek fee', nghesi: 'To artists',
      label: 'Labels keep', producer: 'Producer points', treo: 'Unmatched, on hold',
      luot: 'Streams', bai: 'Recordings with revenue',
      dienBien: '12-period trend', dienBienMo: 'Split by data feed. Dashed columns are unapproved periods — figures still moving.',
      chiaTien: 'Where this period’s money went',
      cuaHang: 'Stores', lanhTho: 'Territories',
      benNhan: 'Largest payees this period',
      dieuKien: 'Period approval conditions', xemDoiChieu: 'Open reconciliation',
      hangCho: 'ISRC matching queue', moHangCho: 'Open queue',
      nhatKy: 'Recent activity', xemHet: 'See all',
      duyet: 'Period approved', chuaDuyet: 'Period not approved',
      dangMo: 'Clients cannot see this period yet. Figures open to labels and artists only after approval.',
      daMo: 'Clients can see this period.',
      conThieu: 'Still missing', xong: 'All conditions met — the period can be approved',
      dong: 'rows', tien: 'Amount', khong: 'Nothing on hold',
      soVoi: 'vs', khac: 'other stores', luotNghe: 'streams'
    }
  },

  dem: function (c) {
    var A = c.A;
    return A.canApprove(c.ky.idx) ? '' : '!' + (A.approvalChecks(c.ky.idx).filter(function (x) { return !x.ok; }).length);
  },

  ve: function (root, c) {
    var A = c.A, t = c.t, pi = c.ky.idx, pk = c.kyKey;
    var P = HB.dayMau();

    /* ---- số liệu ---- */
    var nay  = HM.nho(A, 'agg:' + pi, function () { return A.agg('admin', 0, pi, 'rec'); });
    var truoc = pi > 0 ? HM.nho(A, 'agg:' + (pi - 1), function () { return A.agg('admin', 0, pi - 1, 'rec'); }) : null;
    var pub  = HM.nho(A, 'pub:' + pi, function () { return A.agg('admin', 0, pi, 'pub'); });
    var duyet = A.isApproved(pk);
    var dk = A.approvalChecks(pi);
    var hong = dk.filter(function (x) { return !x.ok; });
    var qCho = A.queue.list({ status: 'pending' });
    var qKy = qCho.filter(function (q) { return q.periodKey === pk; });

    /* 12 kỳ × 3 luồng — nặng, nhớ lại theo dấu mốc trạng thái */
    var day = HM.nho(A, 'chuoiLuong', function () {
      var out = A.feeds.map(function (f) { return { ten: f.id, gt: [], mau: null }; });
      var luot = [];
      A.periods.forEach(function (p, i) {
        var s = 0;
        A.feeds.forEach(function (f, fi) {
          var v = 0;
          if (A.feedLoaded(i, f.id)) for (var k = 0; k < A.trackCount; k++) v += A.grossRecByFeed(k, i, f.id);
          out[fi].gt.push(Math.round(v * 100) / 100);
          s += v;
        });
        luot.push(A.agg('admin', 0, i, 'rec').streams);
      });
      return { chuoi: out, luot: luot };
    });
    /* Tên luồng gắn vào lúc VẼ, không lúc nhớ tạm: bộ nhớ tạm sống
       qua cả lần đổi ngôn ngữ, nên nhét tên vào đó là đổi sang EN mà
       chú thích biểu đồ vẫn tiếng Việt. */
    day.chuoi.forEach(function (s, i) { s.mau = P[i]; s.ten = c.song(A.feeds[i], 'short'); });

    var chuaDuyetIdx = A.periods.filter(function (p) { return !A.isApproved(p.k); }).map(function (p) { return p.idx; });

    /* ---- cửa hàng & lãnh thổ của kỳ đang xem ---- */
    var boc = HM.nho(A, 'boc:' + pi, function () {
      function dim(w, ten) {
        var acc = new Float64Array(ten.length), scale = 0;
        var buoc = Math.max(1, Math.floor(A.trackCount / 9000));
        for (var i = 0; i < A.trackCount; i += buoc) {
          var m = A.grossRec(i, pi);
          if (m <= 0) continue;
          scale += m;
          var pt = A.splitDim(i, m, w);
          for (var j = 0; j < ten.length; j++) acc[j] += pt[j];
        }
        var norm = scale > 0 ? nay.gross / scale : 0;
        return ten.map(function (n, j) { return { ten: n, gt: Math.round(acc[j] * norm * 100) / 100 }; })
          .sort(function (a, b) { return b.gt - a.gt; });
      }
      return { ch: dim(A.storeW, A.stores), lt: dim(A.territoryW, A.territories) };
    });
    var ch8 = boc.ch.slice(0, 8), chDuoi = boc.ch.slice(8);
    var chDuoiTong = chDuoi.reduce(function (s, x) { return s + x.gt; }, 0);

    /* ---- bên nhận lớn nhất ---- */
    var benNhan = HM.nho(A, 'ben:' + pi, function () {
      var m = A.earnedByParty(pi), r = [];
      m.forEach(function (v, k) {
        if (k[0] === 'P') return;
        r.push({ key: k, ten: A.partyName(k), ma: A.partyClientId(k),
                 loai: k[0] === 'L' ? 'label' : 'artist', gt: v, ung: A.advanceBalance(k) });
      });
      return r.sort(function (a, b) { return b.gt - a.gt; }).slice(0, 12);
    });

    /* =================================================================
       DỰNG TRANG
       ================================================================= */
    var html = '';

    html += HM.dau({
      h1: HM.esc(t('h1')) + ' <span>' + HM.esc(c.ky.label) + '</span>',
      mo: HM.esc(t('mo')),
      /* Dải ô số ngay dưới đã có doanh thu gộp; đầu trang chỉ giữ hai
         con số không nằm trong dải. Một con số hiện hai lần cách nhau
         80px là một lần thừa. */
      so: [
        { l: t('luot'), v: HB.gonSo(nay.streams) },
        { l: t('bai'), v: HT.fmt.n(nay.tracks) }
      ]
    });

    /* ---- dải trạng thái kỳ ---- */
    if (duyet) {
      html += HM.ghi({ kieu: 'ok', tieuDe: HM.esc(t('duyet')) + ' · ' + HM.esc(c.ky.label),
        than: HM.esc(t('daMo')) + ' ' + HM.esc(HT.fmt.luc(A.approvalOf(pk).at)) +
              ' · ' + HM.esc(A.approvalOf(pk).by),
        nut: '<button type="button" class="btn sm" data-di="doi-chieu">' + HM.icon('out') +
             (c.lang === 'vi' ? 'Xem hồ sơ xét duyệt' : 'Approval record') + '</button>' });
    } else if (hong.length) {
      html += HM.ghi({ kieu: 'warn', tieuDe: HM.esc(t('chuaDuyet')) + ' · ' + HM.esc(c.ky.label),
        /* Liệt kê CHI TIẾT của điều kiện hỏng, không phải nhãn của nó.
           Nhãn viết ở thể khẳng định ("Đã nạp đủ 3 luồng"), nên ghép sau
           chữ "Còn thiếu:" là ra một câu nói ngược hẳn nghĩa. */
        than: HM.esc(t('dangMo')) + '<br>' +
              hong.map(function (x) { return '<b>' + HM.esc(c.song(x, 'label')) + '</b>' + (c.lang === 'vi' ? ' · ' : ' — ') + HM.esc(c.song(x, 'detail')); }).join('<br>'),
        nut: '<button type="button" class="btn sm" data-di="doi-chieu">' + HM.esc(t('xemDoiChieu')) + '</button>' });
    } else {
      html += HM.ghi({ kieu: 'ok', tieuDe: HM.esc(t('xong')),
        than: HM.esc(t('dangMo')),
        nut: '<button type="button" class="btn sm pri" data-di="doi-chieu">' + HM.esc(t('xemDoiChieu')) + '</button>' });
    }

    /* ---- dải ô số ---- */
    html += HM.so([
      { l: t('gop'), v: c.tien(nay.gross), lon: true,
        s: truoc ? HM.lechHtml(nay.gross, truoc.gross, A.periods[pi - 1].label) : '', sHtml: true },
      { l: t('phi'), v: c.tien(nay.fee),
        s: HT.fmt.pct(nay.gross ? nay.fee / nay.gross : 0) + ' ' + (c.lang === 'vi' ? 'trên doanh thu gộp' : 'of gross') },
      { l: t('label'), v: c.tien(nay.labelCut),
        s: HT.fmt.pct(nay.gross ? nay.labelCut / nay.gross : 0) },
      { l: t('nghesi'), v: c.tien(nay.artist),
        s: HT.fmt.pct(nay.gross ? nay.artist / nay.gross : 0) },
      { l: t('treo'), v: c.tien(A.queue.pendingTotal(pk)), mau: qKy.length ? HB.mau('warn') : '',
        s: qKy.length ? HT.fmt.n(qKy.length) + ' ' + t('dong') : t('khong') }
    ]);

    /* ---- diễn biến 12 kỳ ---- */
    html += HM.the({
      h2: HM.esc(t('dienBien')), p: HM.esc(t('dienBienMo')),
      than: HB.o({
        loai: 'cot', cao: 250, hienGiaTri: false,
        truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
        tieuDeTip: function (i) { return (c.lang === 'vi' ? 'Kỳ ' : 'Period ') + A.periods[i].label; },
        chuoi: day.chuoi, dangDo: chuaDuyetIdx, noiBat: pi
      }) +
      /* Lượt nghe là thước đo khác đơn vị với tiền: vẽ riêng một biểu đồ nhỏ
         chung trục hoành, không phủ một đường lên cột tiền bằng trục thứ hai
         không ai đọc được. */
      '<h4 class="sec" style="margin-top:14px">' + HM.esc(t('luot')) + '</h4>' +
      HB.o({
        loai: 'cot', cao: 120, dinhDang: 'so', chuThich: false,
        truc: A.periods.map(function (p) { return p.label.slice(0, 2); }),
        tieuDeTip: function (i) { return (c.lang === 'vi' ? 'Kỳ ' : 'Period ') + A.periods[i].label; },
        chuoi: [{ ten: t('luot'), gt: day.luot, mau: P[3] }], dangDo: chuaDuyetIdx, noiBat: pi
      }),
      chan: (c.lang === 'vi'
        ? 'Doanh thu của một nguồn báo cáo chỉ được tính vào tổng khi nguồn đó đã nhập cho kỳ. Cột thấp bất thường thì kiểm tra trang Nhập báo cáo trước khi kết luận về thị trường.'
        : 'A feed’s money only enters the total once that feed is loaded for the period. Check Data loading before blaming the market.')
    });

    /* ---- chia tiền + cửa hàng ---- */
    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('chiaTien')),
        than: HB.o({
          loai: 'thac', cao: 230,
          buoc: [
            { l: t('gop'), v: nay.gross, kind: 'top', nt: c.lang === 'vi' ? 'trước các khoản khấu trừ' : 'before deductions' },
            { l: t('phi'), v: -nay.fee, kind: 'out', nt: HT.fmt.pct(A.cfg.HAUSTEK_FEE) },
            { l: t('label'), v: -nay.labelCut, kind: 'out',
              nt: c.lang === 'vi' ? 'gồm cả phần Haustek theo hợp đồng độc lập' : 'includes the extra Haustek share on independent artists' },
            { l: t('producer'), v: -nay.producer, kind: 'out',
              nt: c.lang === 'vi' ? 'trích từ phần nghệ sĩ được hưởng, không phải khoản khấu trừ thêm' : 'deducted from the artist share, not added on top' },
            { l: t('nghesi'), v: nay.artist, kind: 'final' }
          ]
        }) +
        '<div style="margin-top:14px">' + HB.chia([
          { ten: t('phi'), gt: nay.fee, mau: P[5] },
          { ten: t('label'), gt: nay.labelCut, mau: P[1] },
          { ten: t('producer'), gt: nay.producer, mau: P[2] },
          { ten: t('nghesi'), gt: nay.artist, mau: P[0] }
        ]) + '</div>',
        chan: (c.lang === 'vi' ? 'Bốn khoản cộng lại đúng bằng doanh thu gộp: ' : 'The four parts add back to gross: ') +
          '<b>' + HM.esc(c.tien2(nay.fee + nay.labelCut + nay.producer + nay.artist)) + '</b>'
      }) +
      HM.the({
        h2: HM.esc(t('cuaHang')),
        p: HM.esc(A.stores.length + (c.lang === 'vi' ? ' nền tảng · hiển thị 8 nền tảng lớn nhất' : ' stores · top 8 shown')),
        than: HB.o({ loai: 'thanh', hang: ch8.concat(chDuoiTong > 0
          ? [{ ten: chDuoi.length + ' ' + t('khac'), gt: chDuoiTong, mau: HB.mau('neutral-bar') }] : []) })
      }) + '</div>';

    /* ---- lãnh thổ + bên nhận ---- */
    html += '<div class="grid g2">' +
      HM.the({
        h2: HM.esc(t('lanhTho')),
        than: HB.o({ loai: 'thanh', hang: boc.lt.slice(0, 8).map(function (x, i) {
          return { ten: x.ten, gt: x.gt, mau: P[i % 8] }; }) })
      }) +
      HM.the({
        h2: HM.esc(t('benNhan')),
        p: c.lang === 'vi' ? 'Bấm một dòng để xem chi tiết dòng tiền của bên thụ hưởng đó.' : 'Click a row for that party’s money chain.',
        thoBody: true,
        than: '<div class="tw"><table class="t" style="min-width:0"><thead><tr>' +
          '<th>' + (c.lang === 'vi' ? 'Bên thụ hưởng' : 'Payee') + '</th>' +
          '<th class="num">' + (c.lang === 'vi' ? 'Được hưởng' : 'Earned') + '</th>' +
          '<th class="num">' + (c.lang === 'vi' ? 'Tạm ứng' : 'Advance') + '</th></tr></thead><tbody>' +
          benNhan.map(function (r) {
            return '<tr class="pick" data-ben="' + HM.esc(r.key) + '">' +
              '<td><div class="t-ttl">' + HM.esc(HM.dai(r.ten, 30)) + '</div>' +
              '<div class="t-sub">' + HM.esc(r.ma) + ' · ' +
              HM.esc(r.loai === 'label' ? 'Label' : (c.lang === 'vi' ? 'Nghệ sĩ' : 'Artist')) + '</div></td>' +
              '<td class="num">' + HM.esc(c.tien(r.gt)) + '</td>' +
              '<td class="num">' + (r.ung > 0
                ? '<span class="neg">' + HM.esc(c.tien(r.ung)) + '</span>'
                : '<span class="nil">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
      }) + '</div>';

    /* ---- điều kiện duyệt + hàng chờ ---- */
    html += '<div class="grid g2">' +
      HM.the({
        h2: HM.esc(t('dieuKien')),
        hanhDong: '<button type="button" class="btn sm" data-di="doi-chieu">' + HM.esc(t('xemDoiChieu')) + '</button>',
        than: '<div class="checks">' + dk.map(function (x) {
          return '<div class="check ' + (x.ok ? 'ok' : 'no') + '">' + HM.icon(x.ok ? 'check' : 'alert') +
            '<div style="min-width:0"><b>' + HM.esc(c.song(x, 'label')) + '</b><span>' + HM.esc(c.song(x, 'detail')) + '</span></div></div>';
        }).join('') + '</div>'
      }) +
      HM.the({
        h2: HM.esc(t('hangCho')),
        hanhDong: '<button type="button" class="btn sm" data-di="khop-isrc">' + HM.esc(t('moHangCho')) + '</button>',
        than: qCho.length
          ? HM.kv([
              { t: c.lang === 'vi' ? 'Chờ khớp ở tất cả các kỳ' : 'On hold, all periods',
                v: HT.fmt.n(qCho.length) + ' ' + t('dong') + ' · ' + c.tien(A.queue.pendingTotal()), manh: true },
              { t: c.lang === 'vi' ? 'Thuộc kỳ ' + c.ky.label : 'In period ' + c.ky.label,
                v: HT.fmt.n(qKy.length) + ' ' + t('dong') + ' · ' + c.tien(A.queue.pendingTotal(pk)) },
              { t: c.lang === 'vi' ? 'Tỷ lệ trên doanh thu kỳ' : 'Share of period revenue',
                v: HT.fmt.pct(nay.gross ? A.queue.pendingTotal(pk) / nay.gross : 0, 2) +
                   ' / ngưỡng ' + HT.fmt.pct(A.cfg.BLACKBOX_CAP, 1) },
              { t: c.lang === 'vi' ? 'Kỳ có nhiều dòng chờ khớp nhất' : 'Period with most held rows',
                v: (function () {
                  var d = {};
                  qCho.forEach(function (q) { d[q.periodKey] = (d[q.periodKey] || 0) + 1; });
                  var k = Object.keys(d).sort(function (a, b) { return d[b] - d[a]; })[0];
                  return k ? A.periods[A.pIndexOf(k)].label + ' · ' + d[k] + ' ' + t('dong') : '—';
                })() }
            ]) + '<div style="margin-top:14px">' + HB.o({ loai: 'thanh',
              tenTong: c.lang === 'vi' ? 'Tiền chưa khớp' : 'Held amount',
              hang: (function () {
                var d = {};
                qCho.forEach(function (q) { d[q.feedId] = (d[q.feedId] || 0) + q.amount; });
                return A.feeds.map(function (f, i) {
                  return { ten: c.song(f, 'short'), gt: Math.round((d[f.id] || 0) * 100) / 100, mau: P[i] };
                });
              })() }) + '</div>'
          : HM.trong({ tieuDe: t('khong'),
              moTa: c.lang === 'vi' ? 'Mọi dòng doanh thu đều đã khớp với bản ghi trong danh mục.'
                                    : 'Every revenue line has been matched to a catalogue recording.' })
      }) + '</div>';

    /* ---- nhật ký ---- */
    html += HM.the({
      h2: HM.esc(t('nhatKy')),
      hanhDong: '<button type="button" class="btn sm ghost" data-di="quan-tri">' + HM.esc(t('xemHet')) + '</button>',
      than: '<div class="steps">' + A.audit.list(7).map(function (a) {
        return '<div class="s ' + (a.action.indexOf('approve') >= 0 ? 'ok' : a.action.indexOf('revoke') >= 0 ? 'no' : '') + '">' +
          '<b>' + HM.esc(a.detail) + '</b>' +
          '<span>' + HM.esc(a.action) + ' · ' + HM.esc(a.by) + '</span>' +
          '<div class="tm">' + HM.esc(HT.fmt.luc(a.at)) + '</div></div>';
      }).join('') + '</div>'
    });

    root.innerHTML = html;
    HB.gan(root);

    /* ---- sự kiện ---- */
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    HM.bam(root, '[data-ben]', function (el) { moChiTietBen(c, el.getAttribute('data-ben'), pi); });
  }
});

/* ---------------------------------------------------------------------
   Ngăn trượt: chuỗi chia tiền của một bên nhận trong kỳ đang xem
   --------------------------------------------------------------------- */
function moChiTietBen(c, key, pi) {
  var A = c.A, la = key[0] === 'L';
  var id = +key.slice(2);
  var a = A.agg(la ? 'label' : 'artist', id, pi, 'rec');
  var pub = la ? null : A.agg('artist', id, pi, 'pub');
  var dong = A.previewPayout(pi).filter(function (r) { return r.partyKey === key; })[0];
  var ung = A.advanceBalance(key);
  var P = HB.dayMau();

  var buoc = [{ l: 'Doanh thu gộp', v: a.gross, kind: 'top', nt: 'doanh thu gộp của các bản ghi liên quan' },
              { l: 'Phí dịch vụ', v: -a.fee, kind: 'out', nt: HT.fmt.pct(A.cfg.HAUSTEK_FEE) + ' phí dịch vụ Haustek' }];
  if (la) {
    buoc.push({ l: 'Phần nghệ sĩ', v: -(a.artist + a.producer), kind: 'out', nt: 'phần nghệ sĩ được hưởng và điểm producer' });
    buoc.push({ l: 'Phần label được hưởng', v: a.labelCut, kind: 'final' });
  } else {
    buoc.push({ l: 'Phần bên quản lý', v: -a.labelCut, kind: 'out', nt: 'phần label được hưởng; với nghệ sĩ độc lập là phần Haustek theo hợp đồng độc lập' });
    if (a.producer > 0.004) buoc.push({ l: 'Điểm producer', v: -a.producer, kind: 'out', nt: 'trích từ phần nghệ sĩ được hưởng' });
    buoc.push({ l: 'Phần nghệ sĩ được hưởng', v: a.artist, kind: 'final' });
  }

  c.nganTruot(
    HM.so([
      { l: c.lang === 'vi' ? 'Tổng được hưởng kỳ này' : 'Earned this period', v: c.tien(dong ? dong.earned : a.total), lon: true },
      { l: c.lang === 'vi' ? 'Bản ghi có doanh thu' : 'Earning recordings', v: HT.fmt.n(a.tracks) }
    ]) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Chi tiết dòng tiền kỳ ' + c.ky.label : 'Money chain, ' + c.ky.label) + '</h4>' +
    HB.o({ loai: 'thac', cao: 190, buoc: buoc }) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Thanh toán' : 'Payout') + '</h4>' +
    HM.kv([
      { t: c.lang === 'vi' ? 'Doanh thu bản ghi' : 'Recording revenue', v: c.tien2(a.total) },
      !la && pub ? { t: c.lang === 'vi' ? 'Tác quyền' : 'Publishing',
        v: pub.total > 0 ? c.tien2(pub.total) : (c.lang === 'vi' ? 'kỳ này chưa có báo cáo' : 'no report this period') } : null,
      dong ? { t: c.lang === 'vi' ? 'Chuyển từ kỳ trước' : 'Carried in', v: c.tien2(dong.carryIn) } : null,
      dong ? { t: c.lang === 'vi' ? 'Thu hồi tạm ứng' : 'Advance recouped', v: '−' + c.tien2(dong.recoup), mau: dong.recoup > 0 ? 'neg' : '' } : null,
      dong ? { t: c.lang === 'vi' ? 'Sẽ thanh toán' : 'Payable', v: c.tien2(dong.payable), manh: true } : null,
      dong && dong.carryOut > 0 ? { t: c.lang === 'vi' ? 'Chuyển sang kỳ sau (dưới ngưỡng thanh toán tối thiểu ' + HT.fmt.usd0(A.cfg.PAYOUT_MIN) + ')' : 'Carried out',
        v: c.tien2(dong.carryOut) } : null,
      { t: c.lang === 'vi' ? 'Tạm ứng còn phải thu hồi' : 'Advance balance', v: ung > 0 ? c.tien2(ung) : '—' }
    ]) +
    '<h4 class="sec">' + (c.lang === 'vi' ? 'Tỷ lệ chia đang áp dụng' : 'Applied rate') + '</h4>' +
    '<div class="say">' + (function () {
      var lich = A.rates.scheduleFor(key);
      if (!lich.length) return c.lang === 'vi'
        ? 'Bên thụ hưởng này không có dòng tỷ lệ riêng. Nghệ sĩ thuộc label áp dụng tỷ lệ của label.'
        : 'No rate row for this party — an artist under a label inherits the label’s rate.';
      return lich.map(function (r) {
        return '<div class="stat"><b>' + HM.esc(HT.fmt.pct(r.rate)) + ' ' +
          (c.lang === 'vi' ? 'từ kỳ ' : 'from ') + HM.esc(A.periods[A.pIndexOf(r.from)].label) + '</b>' +
          '<span class="v">' + HM.esc(r.note || r.by) + '</span></div>';
      }).join('');
    })() + '</div>',
    { tieuDe: A.partyName(key), phu: A.partyClientId(key) + ' · ' + (la ? 'Label' : 'Nghệ sĩ'),
      khiMo: function (dr) { HB.gan(dr); } }
  );
}
