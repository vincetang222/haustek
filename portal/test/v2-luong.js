/* Chuỗi vận hành thật, bấm bằng chuột chứ không gọi hàm: nạp luồng còn
   thiếu → ghi nhận chênh lệch → chốt tỷ giá → duyệt kỳ → khách nhìn thấy
   → sổ kế toán cân → thu hồi duyệt → mọi thứ trả về như cũ.
   Đây là chỗ dễ hỏng nhất và cũng là chỗ hỏng thì mất tiền. */
const { chromium } = require('playwright');
const dungFontThat = require('./font-that.js');
const B = 'http://127.0.0.1:8099/v2/';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 } });
  const p = await ctx.newPage();
  await dungFontThat(p);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('CONSOLE ' + t); });
  let hong = 0;
  const kiem = (ten, ok, chiTiet) => { console.log((ok ? '  ok   ' : '  HỎNG ') + ten + (chiTiet ? ' · ' + chiTiet : '')); if (!ok) hong++; };

  await p.goto(B + 'intranet.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.removeItem('haustek.portal.v1'));
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  const dat = async () => p.evaluate(() => {
    const A = HAUSTEK.admin;
    const chua = A.periods.filter(x => !A.isApproved(x.k));
    return { soDuyet: A.periods.filter(x => A.isApproved(x.k)).length,
             kyMo: chua.map(x => x.label),
             treo: A.queue.list({ status: 'pending' }).length };
  });
  let d0 = await dat();
  console.log('trạng thái đầu: ' + d0.soDuyet + ' kỳ đã duyệt · kỳ mở: ' + d0.kyMo.join(', '));
  kiem('mở lần đầu có đúng 2 kỳ chưa duyệt', d0.kyMo.length === 2, d0.kyMo.join(','));

  /* ---- 1. kỳ 06/2026: điều kiện duyệt phải báo lệch YouTube ---- */
  const k06 = await p.evaluate(() => HAUSTEK.admin.periods[10].k);
  await p.selectOption('[data-ky]', k06);
  await p.waitForTimeout(500);
  await p.evaluate(() => { location.hash = '#doi-chieu'; });
  await p.waitForTimeout(600);
  let dk = await p.$$eval('.check', cs => cs.map(c => ({ ten: c.querySelector('b').textContent, ok: c.classList.contains('ok') })));
  await p.click('main [data-tab="dk"]'); await p.waitForTimeout(400);
  dk = await p.$$eval('.check', cs => cs.map(c => ({ ten: c.querySelector('b').textContent, ok: c.classList.contains('ok') })));
  const hongDk = dk.filter(x => !x.ok);
  kiem('kỳ 06/2026 báo đúng hai điều kiện hỏng: đối chiếu lệch và chưa chốt tỷ giá',
    hongDk.length === 2 && hongDk.some(x => /Đối (chiếu|soát)/.test(x.ten)) && hongDk.some(x => /tỷ giá/.test(x.ten)),
    hongDk.map(x => x.ten).join(' | '));

  /* ---- 2. ghi nhận chênh lệch qua hộp thoại ---- */
  await p.click('main [data-tab="doi"]'); await p.waitForTimeout(400);
  const nutGhi = await p.$('[data-ghinhan]');
  kiem('có nút ghi nhận chênh lệch', !!nutGhi);
  if (nutGhi) {
    await nutGhi.click(); await p.waitForTimeout(350);
    /* bấm xác nhận khi chưa điền lý do → phải bị chặn */
    await p.click('.modal [data-act=ok]'); await p.waitForTimeout(350);
    let conLech = await p.evaluate(() => !HAUSTEK.admin.recon(10).rows.some(r => r.accepted));
    kiem('không ghi nhận được khi bỏ trống lý do', conLech);
    const soHopThoai = await p.$$eval('.modal-bg', e => e.length);
    kiem('không chồng hộp thoại lên nhau', soHopThoai === 0, soHopThoai + ' hộp đang mở');
    await p.click('[data-ghinhan]');
    await p.waitForTimeout(350);
    await p.fill('.modal [data-o=note]', 'Đối tác xác nhận qua mail 22.08: bản gửi lần đầu thiếu 3 dòng lãnh thổ nhỏ.');
    await p.click('.modal [data-act=ok]'); await p.waitForTimeout(600);
    const daGhi = await p.evaluate(() => HAUSTEK.admin.recon(10).rows.filter(r => r.accepted).length);
    kiem('ghi nhận chênh lệch có lý do thì được', daGhi === 1);
  }

  /* ---- 3. chốt tỷ giá ---- */
  await p.click('main [data-tab="tg"]'); await p.waitForTimeout(400);
  await p.click('[data-chottg]'); await p.waitForTimeout(350);
  await p.fill('.modal [data-o=rate]', '26200');
  await p.click('.modal [data-act=ok]'); await p.waitForTimeout(600);
  const tg = await p.evaluate(k => HAUSTEK.admin.fx.get().locked[k], k06);
  kiem('chốt được tỷ giá kỳ', !!tg && tg.rate === 26200, tg ? tg.rate : '—');

  /* ---- 4. duyệt kỳ ---- */
  /* Chụp dư nợ tạm ứng TRƯỚC khi duyệt. Duyệt là trừ tạm ứng, thu hồi là
     hoàn lại — nên mốc để so sau khi thu hồi là mốc trước khi duyệt, chứ
     không phải sau. Lấy nhầm mốc thì bài kiểm báo hỏng trong khi hệ thống
     đang làm đúng. */
  const ungTruocDuyet = await p.evaluate(() => HAUSTEK.admin.advances.total());
  await p.evaluate(() => { location.hash = '#doi-chieu'; });
  await p.waitForTimeout(600);
  const nutDuyet = await p.$('[data-duyet]');
  kiem('đủ điều kiện thì hiện nút duyệt', !!nutDuyet);
  if (nutDuyet) {
    await nutDuyet.click(); await p.waitForTimeout(400);
    await p.click('.modal [data-act=ok]'); await p.waitForTimeout(900);
    const xong = await p.evaluate(k => HAUSTEK.admin.isApproved(k), k06);
    kiem('duyệt được kỳ 06/2026', xong);
  }

  /* ---- 5. tiền vẫn cân sau khi duyệt ---- */
  const can = await p.evaluate(() => {
    const A = HAUSTEK.admin, c = v => Math.round(v * 100) / 100;
    const out = [];
    A.periods.forEach((pp, i) => {
      const a = A.agg('admin', 0, i, 'rec');
      const cong = c(a.fee + a.labelCut + a.producer + a.artist);
      if (Math.abs(cong - a.gross) > 0.02) out.push(pp.label + ' chia: ' + cong + ' ≠ ' + a.gross);
      if (!A.isApproved(pp.k)) return;
      const rows = A.payoutOf(pp.k) || [];
      rows.forEach(r => {
        if (r.held) return;
        const trai = c(r.carryIn + r.earned - r.recoup), phai = c(r.payable + r.carryOut);
        if (Math.abs(trai - phai) > 0.02) out.push(pp.label + ' ' + r.partyKey + ': ' + trai + ' ≠ ' + phai);
      });
    });
    return out;
  });
  kiem('mọi kỳ: phí + label + producer + nghệ sĩ = gộp, và công nợ từng bên cân',
    can.length === 0, can.slice(0, 3).join(' | '));

  /* ---- 6. sổ kế toán cân tới từng xu ---- */
  await p.evaluate(() => { location.hash = '#ke-toan'; });
  await p.waitForTimeout(900);
  const kt = await p.evaluate(() => {
    const t = document.querySelector('main').textContent;
    return { canBang: /Tổng Nợ bằng tổng Có (tới|đến) từng xu/.test(t), lech: /LỆCH|Chênh lệch \$[\d.,]+\. Lỗi/.test(t) };
  });
  kiem('bút toán kỳ cân: tổng Nợ = tổng Có', kt.canBang && !kt.lech);

  /* ---- 7. cổng khách phải thấy kỳ vừa duyệt ---- */
  const p2 = await ctx.newPage();
  await dungFontThat(p2);
  p2.on('pageerror', e => errs.push('KHÁCH PAGEERROR ' + e.message));
  await p2.goto(B + 'khach.html', { waitUntil: 'networkidle' });
  await p2.waitForTimeout(800);
  const thay = await p2.$$eval('[data-ky] option', os => os.map(o => o.value));
  kiem('khách thấy kỳ 06/2026 sau khi duyệt', thay.indexOf(k06) >= 0, thay.length + ' kỳ mở');
  await p2.selectOption('[data-ky]', k06);
  await p2.waitForTimeout(700);
  const soKhach = await p2.evaluate(() => {
    const v = document.querySelector('.kpi .v');
    return v ? v.textContent.trim() : null;
  });
  kiem('khách đọc được con số của kỳ vừa mở', !!soKhach && !/NaN/.test(soKhach), soKhach);

  /* khách KHÔNG được thấy kỳ chưa duyệt */
  const chuaMo = await p2.evaluate(() => {
    const A = HAUSTEK.api;
    try { A.summary('artist', 0, '2026-07', 'rec'); return 'LỌT'; }
    catch (e) { return 'chặn: ' + e.message; }
  });
  kiem('kỳ chưa duyệt vẫn bị chặn ở cổng khách', chuaMo.indexOf('chặn') === 0, chuaMo);
  await p2.close();

  /* ---- 8. thu hồi duyệt, mọi thứ trả về ---- */
  const ungSauDuyet = await p.evaluate(() => HAUSTEK.admin.advances.total());
  kiem('duyệt kỳ có trừ tạm ứng thật', ungSauDuyet < ungTruocDuyet - 0.02,
    ungTruocDuyet.toFixed(2) + ' → ' + ungSauDuyet.toFixed(2));
  await p.evaluate(() => { location.hash = '#doi-chieu'; });
  await p.waitForTimeout(700);
  await p.click('[data-thuhoi]'); await p.waitForTimeout(400);
  await p.fill('.modal [data-o=why]', 'Kiểm thử: đối tác gửi lại file.');
  await p.click('.modal [data-act=ok]'); await p.waitForTimeout(900);
  const sau = await p.evaluate(k => {
    const A = HAUSTEK.admin;
    return { duyet: A.isApproved(k), ung: A.advances.total() };
  }, k06);
  kiem('thu hồi duyệt được', !sau.duyet);
  kiem('thu hồi xong dư nợ tạm ứng trả về đúng số trước khi duyệt',
    Math.abs(sau.ung - ungTruocDuyet) < 0.02,
    ungTruocDuyet.toFixed(2) + ' → ' + sau.ung.toFixed(2));

  /* ---- 9. duyệt nhảy cóc phải bị chặn ---- */
  const nhayCoc = await p.evaluate(() => {
    try { HAUSTEK.admin.approve(11, 'test', '', true); return 'LỌT'; }
    catch (e) { return 'chặn'; }
  });
  kiem('duyệt nhảy cóc kỳ bị chặn', nhayCoc === 'chặn');

  if (errs.length) { console.log('LỖI JS:\n  ' + [...new Set(errs)].slice(0, 6).join('\n  ')); hong += errs.length; }
  await b.close();
  console.log(hong ? '\n>>> ' + hong + ' vấn đề' : '\n>>> chuỗi vận hành chạy đúng đầu đến cuối');
  process.exit(hong ? 1 : 0);
})();
