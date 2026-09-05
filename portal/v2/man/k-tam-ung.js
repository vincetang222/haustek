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
  id: 'k-tam-ung', nav: 'navUng', nhom: 'nhomTaiChinh', icon: 'up',

  chu: {
    vi: {
      navUng: 'Tạm ứng', h1: 'Khoản tạm ứng',
      mo: 'Số tiền Haustek đã tạm ứng cho bạn, và phần đã khấu trừ qua từng kỳ.',
      daUng: 'Số đã tạm ứng', daTru: 'Đã khấu trừ', conLai: 'Còn phải khấu trừ', conKy: 'Còn khoảng',
      ky: 'kỳ nữa', truKy: 'Khấu trừ kỳ này',
      tienDo: 'Tiến độ khấu trừ', quaCacKy: 'Khấu trừ qua từng kỳ',
      quaCacKyMo: 'Mỗi kỳ bạn được hưởng bao nhiêu thì khấu trừ bấy nhiêu, cho đến khi hết. Kỳ chưa chốt sổ để trống.',
      giaiThich: 'Tạm ứng là gì và được khấu trừ như thế nào',
      gt1: 'Tạm ứng là khoản tiền Haustek thanh toán trước cho bạn, thường để sản xuất sản phẩm hoặc quảng bá. Đây không phải quà tặng, cũng không phải khoản vay có lãi, mà là thu nhập tương lai của bạn được nhận sớm.',
      gt2: 'Từ thời điểm đó, mỗi kỳ bạn được hưởng bao nhiêu thì khoản tạm ứng giảm bấy nhiêu. Trong những kỳ đó bạn <b>vẫn có thu nhập</b>, nhưng thu nhập này được khấu trừ vào phần đã nhận trước, nên chưa có khoản thanh toán thêm.',
      gt3: 'Khi khoản tạm ứng về 0, từ kỳ tiếp theo việc thanh toán trở lại bình thường. Ngay trong kỳ khấu trừ hết, phần vượt quá cũng được thanh toán, không phải chờ.',
      gt4: 'Khoản tạm ứng được khấu trừ trên cả doanh thu bản ghi và tác quyền cộng lại, không tách riêng từng dòng tiền.',
      khongCo: 'Bạn không có khoản tạm ứng nào',
      khongCoMo: 'Toàn bộ phần bạn được hưởng mỗi kỳ được đưa vào đợt thanh toán, không bị khấu trừ.',
      veTongQuan: 'Quay về trang Tổng quan',
      lichSu: 'Lịch sử khấu trừ', cKy: 'Kỳ', cTru: 'Khấu trừ trong kỳ', cCon: 'Còn phải khấu trừ sau kỳ',
      chuaTru: 'Chưa khấu trừ được kỳ nào',
      chuaTruMo: 'Kể từ khi nhận khoản tạm ứng, bạn chưa có doanh thu ở kỳ đã chốt sổ nào.',
      xong: 'Đã khấu trừ xong', xongMo: 'Khoản tạm ứng của bạn đã được khấu trừ hết. Từ kỳ sau, việc thanh toán trở lại bình thường.',
      chuaMo: 'Kỳ này chưa chốt sổ',
      dnH2: 'Đề nghị tạm ứng', dnMo: 'Haustek có thể tạm ứng trước một phần thu nhập 12 tháng tới của bạn, tính từ thu nhập ròng các kỳ đã xét duyệt. Khoản ứng được khấu trừ dần từ phần bạn được hưởng mỗi kỳ.',
      dnNet: 'Thu nhập ròng / tháng', dnNetS: 'trung bình {n} kỳ đã xét duyệt', dnProj: 'Thu nhập 12 tháng dự kiến', dnMax: 'Có thể tạm ứng tới', dnMaxS: 'hạng {g} · tăng trưởng {t}', dnVd: 'Ví dụ: phải khấu trừ', dnVdS: 'nếu ứng {a}, hết sau khoảng {m} tháng',
      dnChua: 'Chưa thể đề nghị tạm ứng', dnNut: 'Đề nghị tạm ứng', dnHoiMo: 'Tối đa {max}. Kế toán Haustek kiểm số, giám đốc xét duyệt; bạn nhận thông báo khi có kết quả.', dnSo: 'Số tiền đề nghị (USD)', dnMucDich: 'Mục đích (sản xuất, quảng bá…)', dnGui: 'Gửi đề nghị', dnDaGui: 'Đã gửi đề nghị {id}',
      dnTinh: 'Phải khấu trừ {r} (gồm phí ứng {f}), dự kiến hết sau khoảng {m} tháng.', dnVuot: 'Vượt mức tối đa.', dnDangCho: 'Bạn có đề nghị đang chờ xử lý. Gửi đề nghị mới sau khi có kết quả.', dnDangUng: 'Khấu trừ hết khoản hiện tại rồi mới đề nghị khoản mới.',
      dnDs: 'Đề nghị đã gửi', dnDsMo: 'Trạng thái đổi khi Haustek kiểm số và xét duyệt. Bạn có thể rút đề nghị đang chờ.', cDx: 'Mã', cNoiDung: 'Nội dung', cTt: 'Trạng thái', cNgay: 'Cập nhật', cThaoTac: 'Thao tác', dnRut: 'Rút', dnDaRut: 'Đã rút {id}', dnRutHoi: 'Rút đề nghị {id}?', dnRutMo: 'Đề nghị sẽ đóng; bạn có thể gửi đề nghị mới sau.'
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
      chuaMo: 'Period not open',
      dnH2: 'Request an advance', dnMo: 'Haustek can advance part of your next 12 months of earnings, based on net earnings in approved periods. The advance is recouped from your share each period.',
      dnNet: 'Net earnings / month', dnNetS: 'average over {n} approved periods', dnProj: 'Projected 12-month earnings', dnMax: 'You can request up to', dnMaxS: 'grade {g} · growth {t}', dnVd: 'Example: amount to recoup', dnVdS: 'for a {a} advance, cleared in about {m} months',
      dnChua: 'An advance is not available yet', dnNut: 'Request an advance', dnHoiMo: 'Up to {max}. Haustek accounting checks the figures and the director approves; you are notified of the outcome.', dnSo: 'Amount requested (USD)', dnMucDich: 'Purpose (production, promotion…)', dnGui: 'Send request', dnDaGui: 'Request {id} sent',
      dnTinh: '{r} to recoup (including the {f} advance fee), cleared in about {m} months.', dnVuot: 'Above the maximum.', dnDangCho: 'You have a request in progress. Send a new one once it is decided.', dnDangUng: 'Your current advance must be recouped before a new request.',
      dnDs: 'Requests sent', dnDsMo: 'Status moves as Haustek checks and approves. You can withdraw a pending request.', cDx: 'Id', cNoiDung: 'Terms', cTt: 'Status', cNgay: 'Updated', cThaoTac: 'Actions', dnRut: 'Withdraw', dnDaRut: 'Withdrew {id}', dnRutHoi: 'Withdraw request {id}?', dnRutMo: 'The request closes; you can send a new one later.'
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
          moTa: c.lang === 'vi' ? 'Bạn chọn một kỳ đã chốt sổ ở thanh phía trên.' : 'Pick a closed period in the top bar.' }) });
      return;
    }

    var dn = layDeNghi(c);
    if (!s.advance) {
      root.innerHTML = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) }) +
        veDeNghi(c, dn, false) +
        HM.the({ than: HM.trong({ icon: 'check', tieuDe: t('khongCo'), moTa: t('khongCoMo'),
          nut: '<button type="button" class="btn" data-di="k-tong-quan">' + HM.esc(t('veTongQuan')) + '</button>' }) }) +
        veGiaiThich(c);
      HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
      ganDeNghi(root, c, dn);
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
        s: c.lang === 'vi' ? 'theo mức thu nhập kỳ này' : 'at this period’s rate' } : null
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
            return x ? (c.lang === 'vi' ? 'Còn phải khấu trừ sau kỳ: ' : 'Left after: ') + HT.fmt.usd(x.con) : '';
          },
          chuTrong: c.lang === 'vi' ? 'Kỳ này chưa khấu trừ được khoản nào' : 'Nothing offset this period',
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

    html += veDeNghi(c, dn, a.left > 0.004);
    html += veGiaiThich(c);

    root.innerHTML = html;
    HB.gan(root);
    HM.bam(root, '[data-di]', function (el) { c.di(el.getAttribute('data-di')); });
    ganDeNghi(root, c, dn);
  }
});

/* ---- đề nghị tạm ứng từ cổng đối tác: mức có thể ứng, gửi đề nghị, theo dõi ---- */
var DN_CHO = ['submitted', 'checked', 'returned'];
function layDeNghi(c) {
  var api = c.api, me = c.phien.me, out = { offer: null, ds: [] };
  try { out.offer = api.advanceOffer(me.role, me.partyId); } catch (e) { out.offer = null; }
  try { out.ds = api.proposals(me.role, me.partyId); } catch (e) { out.ds = []; }
  return out;
}
function veDeNghi(c, dn, dangUng) {
  var t = c.t, o = dn.offer, ds = dn.ds, vi = c.lang === 'vi';
  var cho = ds.filter(function (p) { return p.type === 'advance' && DN_CHO.indexOf(p.status) >= 0; });
  var html = '';
  if (o) {
    var than, nut = '';
    if (o.eligible) {
      than = '<div class="sig">' +
        HTM.oSo(t('dnNet'), HT.fmt.usd(o.monthlyNet), t('dnNetS').replace('{n}', o.periods)) +
        HTM.oSo(t('dnProj'), HT.fmt.usd0(o.projected12)) +
        HTM.oSo(t('dnMax'), HT.fmt.usd0(o.maxAdvance), t('dnMaxS').replace('{g}', o.grade).replace('{t}', o.growth == null ? '—' : (o.growth >= 0 ? '+' : '') + HT.fmt.pct(o.growth))) +
        (o.example ? HTM.oSo(t('dnVd'), HT.fmt.usd0(o.example.repayment), t('dnVdS').replace('{a}', HT.fmt.usd0(o.example.amount)).replace('{m}', o.example.recoupMonths == null ? '—' : o.example.recoupMonths)) : '') +
        '</div><p class="hint" style="margin-top:10px">' + HM.esc(c.song(o, 'note')) + '</p>';
      if (cho.length) than += HM.ghi({ kieu: 'info', tieuDe: HM.esc(t('dnDangCho')) });
      else if (dangUng) than += HM.ghi({ kieu: 'info', tieuDe: HM.esc(t('dnDangUng')) });
      else nut = '<button type="button" class="btn sm pri" data-de-nghi>' + HM.icon('cash') + HM.esc(t('dnNut')) + '</button>';
    } else {
      than = HM.ghi({ kieu: 'info', tieuDe: HM.esc(t('dnChua')), than: HM.esc(o.reason ? (vi ? o.reason.vi : o.reason.en) : '') });
    }
    html += HM.the({ h2: HM.esc(t('dnH2')), p: HM.esc(t('dnMo')), hanhDong: nut, than: than });
  }
  if (ds.length) {
    html += HM.the({ h2: HM.esc(t('dnDs')) + ' <span class="muted">(' + ds.length + ')</span>', p: HM.esc(t('dnDsMo')), thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr><th>' + HM.esc(t('cDx')) + '</th><th>' + HM.esc(t('cNoiDung')) + '</th><th>' + HM.esc(t('cTt')) + '</th><th>' + HM.esc(t('cNgay')) + '</th><th>' + HM.esc(t('cThaoTac')) + '</th></tr></thead><tbody>' +
        ds.map(function (p) {
          var cuoi = p.history[p.history.length - 1];
          return '<tr><td class="mono">' + HM.esc(p.id) + '</td><td><div class="t-ttl">' + HM.esc(c.song(p, 'moTa')) + '</div>' +
            (p.terms.note ? '<div class="t-sub" style="font-family:var(--f)">' + HM.esc(p.terms.note) + '</div>' : '') +
            (cuoi && cuoi.note ? '<div class="t-sub" style="font-family:var(--f)">' + HM.esc((vi ? 'Haustek: ' : 'Haustek: ') + cuoi.note) + '</div>' : '') + '</td>' +
            '<td>' + HTM.tagDx(p.status) + '</td><td class="mono" style="font-size:12.5px">' + HM.esc(String(p.updatedAt).slice(0, 10)) + '</td>' +
            '<td>' + (DN_CHO.indexOf(p.status) >= 0 ? '<button type="button" class="btn sm ghost" data-rut="' + HM.esc(p.id) + '">' + HM.esc(t('dnRut')) + '</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' });
  }
  return html;
}
function ganDeNghi(root, c, dn) {
  var t = c.t, api = c.api, me = c.phien.me;
  HM.bam(root, '[data-de-nghi]', function () { hoiDeNghi(c, dn.offer); });
  HM.bam(root, '[data-rut]', function (el) {
    var id = el.getAttribute('data-rut');
    c.xacNhan(t('dnRutHoi').replace('{id}', id), HM.esc(t('dnRutMo')), t('dnRut'), true).then(function (ok) {
      if (!ok) return;
      try { api.withdrawProposal(me.role, me.partyId, id); c.thongBao(t('dnDaRut').replace('{id}', id), 'ok'); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
    });
  });
}
function hoiDeNghi(c, o) {
  var t = c.t, api = c.api, me = c.phien.me;
  var goiY = Math.max(100, Math.min(o.maxAdvance, Math.round(o.maxAdvance / 2 / 100) * 100));
  c.hoiThoai({
    tieuDe: t('dnNut'), moTa: HM.esc(t('dnHoiMo').replace('{max}', HT.fmt.usd0(o.maxAdvance))),
    than: '<label class="fld">' + HM.esc(t('dnSo')) + '</label><input class="in" type="number" data-o="amount" min="100" max="' + o.maxAdvance + '" step="100" value="' + goiY + '">' +
      '<label class="fld" style="margin-top:12px">' + HM.esc(t('dnMucDich')) + '</label><input class="in" data-o="note">' +
      '<p class="hint" data-tinh style="margin-top:12px"></p>',
    dong: t('dnGui')
  }).then(function (f) {
    if (!f) return;
    try { var pr = api.requestAdvance(me.role, me.partyId, { amount: +f.amount, note: f.note }); c.thongBao(t('dnDaGui').replace('{id}', pr.id), 'ok'); c.veLai(); }
    catch (e) { c.thongBao(e.message, 'no'); }
  });
  setTimeout(function () {
    var md = document.querySelector('.modal'); if (!md) return;
    function tinh() {
      var a = +md.querySelector('[data-o="amount"]').value || 0, rp = a * (1 + o.feePct), th = o.monthlyNet > 0 ? Math.ceil(rp / o.monthlyNet) : null;
      md.querySelector('[data-tinh]').innerHTML = HM.esc(t('dnTinh').replace('{r}', HT.fmt.usd0(rp)).replace('{f}', HT.fmt.pct(o.feePct)).replace('{m}', th == null ? '—' : th)) + (a > o.maxAdvance ? ' <b class="neg">' + HM.esc(t('dnVuot')) + '</b>' : '');
    }
    tinh(); md.addEventListener('input', tinh);
  }, 30);
}

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
