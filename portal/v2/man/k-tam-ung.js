/* =====================================================================
   CỔNG KHÁCH · TẠM ỨNG
   ---------------------------------------------------------------------
   Màn này tồn tại vì một câu hỏi cụ thể: "kỳ này tôi thấy có doanh thu,
   sao không nhận được đồng nào?"

   Câu trả lời — nếu người đó đang có tạm ứng — là: bạn đã nhận rồi, nhận
   trước. Và đây là chỗ nhìn thấy khoản đó ngắn lại qua từng kỳ, cùng với
   con số còn phải trừ bao nhiêu nữa.

   Người không có tạm ứng vẫn vào được màn này và phải thấy một câu trả
   lời rõ ràng, chứ không phải màn trắng.
   ===================================================================== */
"use strict";

HT.dangKy({
  id: 'k-tam-ung', nav: 'navUng', icon: 'up',

  chu: {
    vi: {
      navUng: 'Tạm ứng', h1: 'Khoản tạm ứng',
      mo: 'Số Haustek đã ứng trước cho bạn, và phần đã được trừ dần qua từng kỳ.',
      daUng: 'Đã ứng', daTru: 'Đã trừ', conLai: 'Còn phải trừ', conKy: 'Còn khoảng',
      ky: 'kỳ nữa', truKy: 'Trừ kỳ này',
      tienDo: 'Tiến độ', quaCacKy: 'Trừ qua từng kỳ',
      quaCacKyMo: 'Mỗi kỳ bạn kiếm được bao nhiêu thì trừ bấy nhiêu, cho tới khi hết. Kỳ chưa chốt sổ không có vạch.',
      giaiThich: 'Tạm ứng hoạt động thế nào',
      gt1: 'Tạm ứng là tiền Haustek trả trước cho bạn, thường để làm sản phẩm hoặc chạy quảng bá. Nó không phải quà và cũng không phải khoản vay có lãi — nó là phần thu nhập tương lai của bạn, nhận sớm.',
      gt2: 'Từ lúc đó, mỗi kỳ bạn kiếm được bao nhiêu thì khoản ứng ngắn lại bấy nhiêu. Trong những kỳ đó bạn <b>vẫn đang kiếm được tiền</b> — chỉ là tiền đó đi trả cho phần đã nhận trước, chưa chuyển thêm lần nữa.',
      gt3: 'Khi khoản ứng về 0, kỳ tiếp theo tiền lại chuyển bình thường. Phần vượt quá trong chính kỳ trả hết cũng được chuyển, không phải chờ.',
      gt4: 'Khoản ứng tính trên cả doanh thu bản ghi lẫn tác quyền cộng lại, không phải riêng từng dòng.',
      khongCo: 'Bạn không có khoản tạm ứng nào',
      khongCoMo: 'Toàn bộ phần bạn kiếm được ở mỗi kỳ đi thẳng vào bảng chi trả, không bị trừ gì.',
      veTongQuan: 'Về trang tổng quan',
      lichSu: 'Lịch sử trừ', cKy: 'Kỳ', cTru: 'Trừ trong kỳ', cCon: 'Còn lại sau kỳ',
      chuaTru: 'Chưa có kỳ nào trừ được',
      chuaTruMo: 'Bạn chưa phát sinh doanh thu trong kỳ đã chốt nào kể từ khi nhận khoản ứng.',
      xong: 'Đã trả xong', xongMo: 'Khoản tạm ứng của bạn đã được trừ hết. Từ kỳ sau tiền chuyển bình thường.',
      chuaMo: 'Kỳ chưa mở'
    },
    en: {
      navUng: 'Advance', h1: 'Your advance',
      mo: 'What Haustek paid you up front, and how much has been offset period by period.',
      daUng: 'Advanced', daTru: 'Offset so far', conLai: 'Still to offset', conKy: 'About',
      ky: 'more periods', truKy: 'Offset this period',
      tienDo: 'Progress', quaCacKy: 'Offset period by period',
      quaCacKyMo: 'Whatever you earn in a period is offset that period, until it clears. Unclosed periods have no bar.',
      giaiThich: 'How an advance works',
      gt1: 'An advance is money Haustek pays you up front, usually to make a record or run a campaign. It is not a gift and not an interest-bearing loan — it is your own future income, received early.',
      gt2: 'From then on, whatever you earn each period shortens the advance by that much. In those periods you are <b>still earning</b> — the money is simply repaying what you already received.',
      gt3: 'Once the advance reaches zero, transfers resume normally. Anything above it in the very period that clears it is transferred too, not held back.',
      gt4: 'The advance is offset against recording and publishing combined, not stream by stream.',
      khongCo: 'You have no advance',
      khongCoMo: 'Everything you earn each period goes straight into the payout run, with nothing deducted.',
      veTongQuan: 'Back to overview',
      lichSu: 'Offset history', cKy: 'Period', cTru: 'Offset', cCon: 'Left after',
      chuaTru: 'Nothing offset yet',
      chuaTruMo: 'You have earned nothing in a closed period since the advance was recorded.',
      xong: 'Fully repaid', xongMo: 'Your advance is fully offset. Transfers resume from the next period.',
      chuaMo: 'Period not open'
    }
  },

  dem: function (c) {
    try {
      var s = c.api.summary(c.phien.me.role, c.phien.me.partyId, c.kyKey, 'rec');
      return s.advance && s.advance.left > 0 ? '!' + HB.gonTien(s.advance.left) : '';
    } catch (e) { return ''; }
  },

  ve: function (root, c) {
    var api = c.api, me = c.phien.me, t = c.t, P = HB.dayMau();

    var s;
    try { s = api.summary(me.role, me.partyId, c.kyKey, 'rec'); }
    catch (e) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')) }) +
        HM.the({ than: HM.trong({ icon: 'clock', tieuDe: t('chuaMo'),
          moTa: c.lang === 'vi' ? 'Chọn một kỳ đã chốt sổ ở thanh trên.' : 'Pick a closed period in the top bar.' }) });
      return;
    }

    if (!s.advance) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) }) +
        HM.the({ than: HM.trong({ icon: 'check', tieuDe: t('khongCo'), moTa: t('khongCoMo'),
          nut: '<button type="button" class="btn" data-di="k-tong-quan">' + HM.esc(t('veTongQuan')) + '</button>' }) }) +
        veGiaiThich(c);
      HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
      return;
    }

    var a = s.advance;
    var daTru = Math.round((a.opening - a.left) * 100) / 100;
    var pc = a.opening > 0 ? daTru / a.opening : 1;

    /* Lịch sử trừ dựng lại từ các kỳ đã chốt: gọi summary từng kỳ. Máy
       chủ trả về phần thu hồi của chính kỳ đó, nên số này là số đã ghi,
       không phải số tính lại. */
    var lich = [];
    c.kys.forEach(function (p) {
      try {
        var x = api.summary(me.role, me.partyId, p.k, 'rec');
        if (x.advance) lich.push({ k: p.k, label: p.label, tru: x.advance.recoupedThisPeriod, con: x.advance.left });
      } catch (e) {}
    });
    var coTru = lich.filter(function (x) { return x.tru > 0.004; });

    var html = HM.dau({
      h1: HM.esc(t('h1')),
      mo: HM.esc(t('mo')),
      so: [
        { l: t('daUng'), v: HT.fmt.usd0(a.opening) },
        { l: t('conLai'), v: HT.fmt.usd(a.left) }
      ]
    });

    if (a.left <= 0.004) {
      html += HM.ghi({ kieu: 'ok', tieuDe: HM.esc(t('xong')), than: HM.esc(t('xongMo')) });
    }

    html += HM.so([
      { l: t('daUng'), v: HT.fmt.usd0(a.opening), lon: true },
      { l: t('daTru'), v: HT.fmt.usd(daTru), s: HT.fmt.pct(pc), mau: HB.mau('ok') },
      { l: t('conLai'), v: HT.fmt.usd(a.left), mau: a.left > 0 ? HB.mau('warn') : HB.mau('ok') },
      { l: t('truKy') + ' · ' + c.ky.label, v: HT.fmt.usd(a.recoupedThisPeriod) },
      a.left > 0 && a.periodsLeft ? { l: t('conKy'), v: a.periodsLeft + ' ' + t('ky'),
        s: c.lang === 'vi' ? 'theo nhịp kiếm tiền kỳ này' : 'at this period’s rate' } : null
    ].filter(Boolean));

    html += '<div class="grid g3">' +
      HM.the({
        h2: HM.esc(t('quaCacKy')), p: HM.esc(t('quaCacKyMo')),
        than: HB.o({
          loai: 'cot', cao: 210, hienGiaTri: true, chuThich: false,
          truc: c.kys.map(function (p) { return p.label; }),
          tieuDeTip: function (i) { return (c.lang === 'vi' ? 'Kỳ ' : 'Period ') + c.kys[i].label; },
          ghiChuTip: function (i) {
            var x = lich.filter(function (y) { return y.k === c.kys[i].k; })[0];
            return x ? (c.lang === 'vi' ? 'Còn lại sau kỳ: ' : 'Left after: ') + HT.fmt.usd(x.con) : '';
          },
          chuTrong: c.lang === 'vi' ? 'Kỳ này chưa trừ được đồng nào' : 'Nothing offset this period',
          chuoi: [{ ten: t('daTru'), mau: P[6],
            gt: c.kys.map(function (p) {
              var x = lich.filter(function (y) { return y.k === p.k; })[0];
              return x ? x.tru : null;
            }) }],
          noiBat: (function () {
            for (var i = 0; i < c.kys.length; i++) if (c.kys[i].k === c.kyKey) return i;
            return -1;
          })()
        })
      }) +
      HM.the({
        h2: HM.esc(t('tienDo')),
        than: HB.o({ loai: 'vong', cao: 180,
          giua: { v: HT.fmt.pct(pc, 0), l: t('daTru') },
          phan: [
            { ten: t('daTru'), gt: daTru, mau: P[6] },
            { ten: t('conLai'), gt: a.left, mau: P[4] }
          ] }) +
          '<div class="meter" style="margin-top:14px"><i style="width:' +
          Math.min(100, pc * 100).toFixed(1) + '%;background:' + P[6] + '"></i></div>' +
          '<div class="hint">' + HM.esc(HT.fmt.usd(daTru) + ' / ' + HT.fmt.usd0(a.opening)) + '</div>'
      }) + '</div>';

    html += HM.the({
      h2: HM.esc(t('lichSu')),
      thoBody: true,
      than: coTru.length
        ? '<div class="tw"><table class="t" style="min-width:0"><thead><tr>' +
          '<th>' + HM.esc(t('cKy')) + '</th>' +
          '<th class="num">' + HM.esc(t('cTru')) + '</th>' +
          '<th class="num">' + HM.esc(t('cCon')) + '</th>' +
          '<th style="width:190px">' + HM.esc(t('tienDo')) + '</th></tr></thead><tbody>' +
          coTru.slice().reverse().map(function (x) {
            var p2 = a.opening > 0 ? (a.opening - x.con) / a.opening : 1;
            return '<tr' + (x.k === c.kyKey ? ' style="box-shadow:inset 3px 0 0 var(--accent)"' : '') + '>' +
              '<td class="mono">' + HM.esc(x.label) + '</td>' +
              '<td class="num">−' + HM.esc(HT.fmt.usd(x.tru)) + '</td>' +
              '<td class="num">' + HM.esc(HT.fmt.usd(x.con)) + '</td>' +
              '<td><div class="meter thin"><i style="width:' + Math.min(100, p2 * 100).toFixed(1) +
                '%;background:' + P[6] + '"></i></div></td></tr>';
          }).join('') + '</tbody></table></div>'
        : HM.trong({ icon: 'clock', tieuDe: t('chuaTru'), moTa: t('chuaTruMo') })
    });

    html += veGiaiThich(c);

    root.innerHTML = html;
    HB.gan(root);
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
  }
});

function veGiaiThich(c) {
  var t = c.t;
  return HM.the({
    h2: HM.esc(t('giaiThich')),
    than: '<p class="say">' + t('gt1') + '</p>' +
      '<p class="say">' + t('gt2') + '</p>' +
      '<p class="say">' + t('gt3') + '</p>' +
      '<p class="say">' + t('gt4') + '</p>'
  });
}
