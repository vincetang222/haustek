/* Kiểm thử xuyên suốt: đi đúng con đường một người vận hành đi hằng tháng. */
const { chromium } = require('playwright');
const OUT = process.env.SHOTS || (__dirname + '/shots');
const errs = [];
const log = (...a) => console.log(...a);

async function btn(page, text, scope) {
  const l = (scope || page).locator('button, a.btn').filter({ hasText: text });
  const n = await l.count();
  return n ? l.first() : null;
}
async function clickText(page, text, scope) {
  try {
    const b = await btn(page, text, scope);
    if (!b) { log('   ✗ không thấy nút chứa "' + text + '"'); return false; }
    await b.click({ timeout: 4000 });
    return true;
  } catch (e) { log('   ✗ bấm "' + text + '" không được: ' + String(e.message).split('\n')[0]); return false; }
}
/* nút xác nhận của hộp thoại luôn nằm ở .modal-foot — tìm ở đó cho khỏi
   trúng chữ trong thân hộp thoại */
async function confirmDialog(page, ...texts) {
  const foot = page.locator('.modal-bg .modal-foot');
  if (!(await foot.count())) { log('   ✗ không có hộp thoại nào đang mở'); return false; }
  for (const t of texts) if (await clickText(page, t, foot)) return true;
  const pri = foot.locator('button.pri, button.go, button.dang').first();
  if (await pri.count()) { await pri.click({ timeout: 4000 }); return true; }
  return false;
}
async function closeDialog(page) {
  if (await page.locator('.modal-bg').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
}

(async () => {
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1050 } });
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' | ' + (e.stack||'').split('\n')[1]));
p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('Failed to load resource')) errs.push('console.error: ' + t); });

const state = () => p.evaluate(() => {
  const A = HAUSTEK.admin, s = A.state();
  return { approved: Object.keys(s.approved).length,
    miss11: A.missingFeeds(11).map(f => f.short),
    diff10: A.recon(10).diff,
    pending: A.queue.list({status:'pending'}).length,
    fxLocked: Object.keys(s.fx.locked).length,
    accounts: s.accounts.length,
    answers: Object.keys(s.answers).length };
});

log('--- 1. NẠP LUỒNG CÒN THIẾU (07/2026 · TikTok) ---');
await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/intranet.html#ingest', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1600);
log('   trước:', JSON.stringify(await state()));
const cell = p.locator('.cell.missing').first();
if (await cell.count()) {
  await cell.click(); await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + '/flow-1-dialog.png' });
  const runBtn = p.locator('.modal-bg [data-run]').first();
  const ok = await runBtn.count() ? (await runBtn.click({timeout:4000}), true)
                                  : await confirmDialog(p, 'Chạy', 'Nạp');
  log('   bấm nạp:', ok);
  await p.waitForTimeout(6000);
  await p.screenshot({ path: OUT + '/flow-2-loaded.png', fullPage: true });
  await closeDialog(p);
} else log('   ✗ không thấy ô .cell.missing');
log('   sau  :', JSON.stringify(await state()));

log('--- 2. KHỚP MỘT DÒNG TREO ---');
await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/intranet.html#match', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1800);
const before = await state();
const find = await btn(p, 'Tìm bản ghi');
if (find) {
  await find.click(); await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/flow-3-match.png' });
  const pick = p.locator('.modal-bg button').filter({ hasText: /Chọn|Khớp/ }).first();
  if (await pick.count()) { await pick.click({ timeout: 4000 }).catch(e => log('   ✗ ' + e.message.split('\n')[0])); await p.waitForTimeout(1600); }
  else log('   ✗ không thấy nút chọn gợi ý');
  await closeDialog(p);
} else log('   ✗ không thấy nút tìm bản ghi khớp');
const after2 = await state();
log('   dòng chờ:', before.pending, '→', after2.pending);

log('--- 3. ĐỐI CHIẾU & DUYỆT KỲ 06/2026 ---');
await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/intranet.html#close', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1200);
await p.selectOption('#period', '10'); await p.waitForTimeout(1600);
await p.screenshot({ path: OUT + '/flow-4-close.png', fullPage: true });
if (await clickText(p, 'Ghi nhận chênh lệch')) {
  await p.waitForTimeout(800);
  const ta = p.locator('.modal-bg [data-field]').first();
  if (await ta.count()) await ta.fill('Đối tác gửi bù dòng thiếu ngày 26.08, đã đối chiếu lại');
  await confirmDialog(p, 'Ghi nhận', 'Xác nhận');
  await p.waitForTimeout(1600); await closeDialog(p);
}
if (await clickText(p, 'Chốt tỷ giá')) {
  await p.waitForTimeout(800);
  await confirmDialog(p, 'Chốt', 'Xác nhận');
  await p.waitForTimeout(1600); await closeDialog(p);
}
log('   điều kiện duyệt:', JSON.stringify(await p.evaluate(() => HAUSTEK.admin.approvalChecks(10).map(c => (c.ok?'OK':'XX')+' '+c.id))));
await p.screenshot({ path: OUT + '/flow-5-ready.png', fullPage: true });
if (await clickText(p, 'Duyệt kỳ')) {
  await p.waitForTimeout(900);
  await confirmDialog(p, 'Duyệt', 'Xác nhận');
  await p.waitForTimeout(2600); await closeDialog(p);
}
const after3 = await state();
log('   kỳ đã duyệt:', before.approved, '→', after3.approved, '· tỷ giá đã khoá:', after3.fxLocked);
await p.screenshot({ path: OUT + '/flow-6-approved.png', fullPage: true });

log('--- 4. CỔNG KHÁCH CÓ THẤY KỲ MỚI KHÔNG ---');
const d = await ctx.newPage();
d.on('pageerror', e => errs.push('[dash] pageerror: ' + e.message));
await d.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/dashboard.html', { waitUntil: 'networkidle' });
await d.waitForTimeout(1500);
const opts = await d.evaluate(() => Array.from(document.getElementById('period').options).map(o => o.textContent));
log('   kỳ khách thấy:', opts.join(' · '));
await d.screenshot({ path: OUT + '/flow-7-dash.png', fullPage: true });

log('--- 5. CÁC MÀN HÌNH CÒN LẠI ---');
for (const id of ['payouts', 'advances', 'accounts', 'questions']) {
  const has = await p.evaluate(x => HAUSTEK.screens.some(s => s.id === x), id);
  if (!has) { log('   ' + id + ': chưa có'); continue; }
  await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/intranet.html#' + id, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const e = document.getElementById('screen');
    return { bad: e.innerHTML.includes('Màn hình này lỗi'), txt: e.innerText.replace(/\n+/g,' | ').slice(0,140) }; });
  log('   ' + (r.bad ? 'LỖI ' : 'ok  ') + id + ': ' + r.txt);
  await p.screenshot({ path: OUT + '/flow-' + id + '.png', fullPage: true });
}

await browser.close();
log('\n=== LỖI (' + errs.length + ') ==='); errs.slice(0,20).forEach(e => log(e));
})().catch(e => { console.error('HARNESS:', e); process.exit(2); });
