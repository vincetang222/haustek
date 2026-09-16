/* =====================================================================
   SONG NGỮ HAI CHIỀU · BẬT EN KHÔNG CÒN TIẾNG VIỆT, BẬT VI KHÔNG CÒN
   CHỮ KHUNG TIẾNG ANH
   ---------------------------------------------------------------------
   Vòng 22. Mở từng cổng, đổi ngôn ngữ, đi hết mọi trang và mọi tab, rồi
   soi MỌI text node và thuộc tính (placeholder, aria-label, title).
   Dữ liệu — tên nghệ sĩ, tên bài, tên label, tên nhân sự, tên người cộng
   tác, tên playlist, ghi chú do người gõ — được phép giữ nguyên ngôn ngữ
   gốc nên bị loại trước khi soi; phần còn lại là chữ của giao diện hoặc
   chữ lõi sinh, và phải sạch (ngưỡng 0).

       cd portal && python3 -m http.server 8099 &
       node test/i18n-hai-chieu.js [v2/intranet.html | v2/khach.html]
   ===================================================================== */
const { chromium } = require('playwright');
const TRANG = process.argv[2] ? [process.argv[2]] : ['v2/intranet.html', 'v2/khach.html'];

async function bamHien(p, sel) {
  await p.evaluate(s => {
    const ds = [...document.querySelectorAll(s)];
    const el = ds.find(e => e.getBoundingClientRect().width > 0) || ds[0];
    if (!el) throw new Error('không thấy ' + s);
    el.click();
  }, sel);
}

/* chạy trong trang: gom tên riêng để loại trừ */
const DUNG_TEN = () => {
  const H = window.HAUSTEK, A = H.admin || null, api = H.api;
  const ten = new Set();
  const them = s => { if (s && typeof s === 'string' && s.length > 1) { ten.add(s); ten.add(s.toUpperCase()); } };
  try { A.artists.forEach(a => them(a.name)); A.labels.forEach(l => them(l.name)); } catch (e) {}
  try { A.staff.list().forEach(s => { them(s.name); them(s.email); }); } catch (e) {}
  try { for (let i = 0; i < A.trackCount; i++) them(A.titleOf(i)); } catch (e) {}
  try { A.stores.forEach(them); } catch (e) {}
  try { (A.splits().rows || []).forEach(r => (r.collaborators || []).forEach(c => { them(c.name); them(c.email); })); } catch (e) {}
  try { (A.playlists ? A.playlists().rows || A.playlists() : []).forEach(x => them(x.name || x.playlist)); } catch (e) {}
  try { A.accounts.list().forEach(a => { them(a.email); them(a.ten); }); } catch (e) {}
  if (!A && api) {
    const dl = api.demoLogins().accounts;
    dl.forEach(a => { them(a.name); them(a.email); });
    dl.forEach(a => {
      try { const c = api.catalogue(a.role, a.partyId, {}); (c.rows || []).forEach(x => { them(x.title); them(x.artist); them(x.label); }); } catch (e) {}
      try { (api.splits(a.role, a.partyId).rows || []).forEach(r => { them(r.title); them(r.artist); (r.collaborators || []).forEach(c => { them(c.name); them(c.email); }); }); } catch (e) {}
      try { (api.loiMoiChiaSe(a.role, a.partyId).rows || []).forEach(r => { them(r.title); them(r.artist); them(r.chu); }); } catch (e) {}
      try { const s = api.session(a.role, a.partyId); if (s) { them(s.name); (s.artists || []).forEach(x => them(x.name)); if (s.parentLabel) them(s.parentLabel.name); } } catch (e) {}
      try { (api.playlists(a.role, a.partyId).rows || []).forEach(x => them(x.name || x.playlist)); } catch (e) {}
      try { (api.artists(a.role, a.partyId).rows || []).forEach(x => them(x.name)); } catch (e) {}
      try { (api.tickets(a.role, a.partyId).rows || []).forEach(t => { (t.comments || []).forEach(c => them(c.text)); if (t.track) them(t.track.title); }); } catch (e) {}
      try { (api.claims(a.role, a.partyId).rows || []).forEach(c => { them(c.otherParty); them(c.lastNote); (c.notes || []).forEach(n => them(n.text)); if (c.track) them(c.track.title); }); } catch (e) {}
    });
  }
  if (A) {
    try { A.tickets.list({}).forEach(t => { (t.comments || []).forEach(c => them(c.text)); if (t.track) them(t.track.title); }); } catch (e) {}
    try { A.claims.list({}).forEach(c => { them(c.otherParty); them(c.lastNote); (c.notes || []).forEach(n => them(n.text)); if (c.track) them(c.track.title); }); } catch (e) {}
    try { A.parties.list({}).rows.forEach(p => them(p.name)); } catch (e) {}
    try { A.queue.list({}).forEach(q => { them(q.title); them(q.artist); }); } catch (e) {}
  }
  window.__TEN = [...ten].filter(Boolean);
  return window.__TEN.length;
};

/* chạy trong trang: trích chữ nhìn thấy, lọc theo chiều */
const TRICH = (chieu) => {
  const VN = /[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/;
  const EN = /\b(Loading|Saved?|Cancel|Close|Showing|No data|Search|Total|Rows|Page|Select(ed)?|Clear|Export|Download|Confirm|Delete|Remove|Apply|Filter|Sort|Back|Next|Previous|None|Error|Failed|Pending|Approved|Rejected|Unpaid|Status|Amount|Period|Currency|Platform|Territory|Statement|Release|Unknown|Untitled|Details|Summary|Overview|Print|Copied|Retry|Refresh|Reload|Submit|Sent|Expand|Collapse|Settings|Sign (in|out)|Welcome|yesterday|days ago|Streams|Revenue|Gross|Fee|Balance|Wallet|Withdraw|Advance|Contract|Approve|Reject|Review|Queue|Support|Notifications|Unread|Missing|optional|required|Archived|Dense|Compact|per page|Forecast|Trend|Quality|Alert|Owner|Manager|Staff|Department|Team|Workflow|Undo|Mark done|Client portal|Quick search)\b/;
  const CODE = /^(ISRC|ISWC|UPC|USD|VND|ROI|CSV|PDF|API|ID|URL|WAV|MP3|AI|CMS|DSP|KPI|FX|NET|EP|LP|OK|VI|EN|HTK|DIST|Content ID|YouTube|Spotify|TikTok|Apple Music|Zing MP3|NhacCuaTui|Facebook|Instagram|Sentric|Believe|OneRPM|ADA|Lark|Excel|Playlist|Ticket|Track)[\w\-\s:./·]*$/;
  const TENSET = new Set(window.__TEN || []);
  const TEN = [...TENSET].filter(x => x.length > 3).sort((a, b) => b.length - a.length);
  /* tên người Việt: 2–4 từ viết hoa đầu, mỗi từ có thể mang dấu — dữ liệu, không phải chữ khung */
  const TEN_NGUOI = /^[A-ZĐ][a-zà-ỹ]+(?: [A-ZĐ][a-zà-ỹ]+){1,3}$/;
  const out = [], seen = new Set();
  function bo(t) {
    if (TENSET.has(t) || TENSET.has(t.replace(/\s*\((Live|Remix|Acoustic|Demo|Remastered)\)$/i, ''))) return '';
    /* chuỗi ghép "A · B · C": bỏ từng đoạn là tên riêng, kể cả tên rất ngắn */
    let s = t.split(' · ').map(d => (TENSET.has(d.trim()) ? ' ' : d)).join(' · ');
    s = s.replace(/["“”][^"“”]{1,80}["“”]/g, ' ');
    for (const n of TEN) { if (s.includes(n)) s = s.split(n).join(' '); if (!VN.test(s)) break; }
    return s;
  }
  function ghi(e, raw, loai) {
    const t = raw.replace(/\s+/g, ' ').trim();
    if (!t || t.length < 2) return;
    if (chieu === 'en' && TEN_NGUOI.test(t)) return;
    const s = bo(t);
    let hit = false;
    if (chieu === 'en') hit = VN.test(s);
    else {
      if (VN.test(t) || CODE.test(t) || TENSET.has(t)) return;
      if (/^[\d\s.,%$€£:+\-−–—/()·|]+$/.test(t)) return;
      hit = EN.test(s) && !/^[A-Z]{2,6}$/.test(t);
    }
    if (!hit) return;
    const key = loai + '|' + t.slice(0, 80);
    if (seen.has(key)) return;
    seen.add(key);
    let x = e, sel = [];
    for (let i = 0; i < 3 && x && x !== document.body; i++, x = x.parentElement) sel.unshift(x.tagName.toLowerCase() + (x.className && typeof x.className === 'string' ? '.' + x.className.trim().split(/\s+/)[0] : ''));
    out.push({ sel: sel.join('>'), loai, chuoi: t.slice(0, 110) });
  }
  document.querySelectorAll('body *').forEach(e => {
    if (/^(SCRIPT|STYLE|PATH|NOSCRIPT|TEMPLATE|SVG|TEXT)$/i.test(e.tagName)) return;
    /* ảnh đại diện (chữ cái đầu) và tên bài / tên bên trong ô ảnh bìa là DỮ LIỆU */
    if (e.classList && (e.classList.contains('hinh') || (e.classList.contains('t-ttl') && e.closest('.t-bia')))) return;
    for (const n of e.childNodes) if (n.nodeType === 3) ghi(e, n.nodeValue, 'text');
    for (const a of ['placeholder', 'aria-label', 'title']) { const v = e.getAttribute && e.getAttribute(a); if (v) ghi(e, v, a); }
  });
  return out;
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  require('./vao-cua.js').gan(b);   /* vòng 25: mỗi trang mở ra đã có phiên, khỏi qua cửa */
  let tongHong = 0;
  for (const trang of TRANG) {
    const p = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8099/' + trang, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    const soTen = await p.evaluate(DUNG_TEN);
    const man = await p.$$eval('.nav a', a => a.map(x => x.getAttribute('href').slice(1)));
    const kq = { en: [], vi: [] };
    for (const chieu of ['en', 'vi']) {
      await bamHien(p, '[data-l="' + chieu + '"]');
      await p.waitForTimeout(400);
      for (const m of man) {
        await p.evaluate(id => { location.hash = '#' + id; }, m);
        await p.waitForTimeout(320);
        const daBam = new Set(); const hang = [null]; let lan = 0;
        while (hang.length && lan < 30) {
          const tb = hang.shift();
          if (tb) {
            if (daBam.has(tb)) continue; daBam.add(tb);
            const ok = await p.evaluate(t => { const b = document.querySelector('main [data-tab="' + t + '"]'); if (!b) return false; b.click(); return true; }, tb);
            if (!ok) continue;
            await p.waitForTimeout(280);
          }
          lan++;
          const r = await p.evaluate(TRICH, chieu);
          r.forEach(x => kq[chieu].push(Object.assign({ man: m, tab: tb || '' }, x)));
          const tabs = await p.$$eval('main [data-tab]', bs => bs.map(x => x.getAttribute('data-tab')));
          tabs.forEach(t => { if (!daBam.has(t) && !hang.includes(t)) hang.push(t); });
        }
      }
    }
    const gop = ds => { const m = new Map(); ds.forEach(x => { const k = x.man + '|' + x.loai + '|' + x.chuoi; if (!m.has(k)) m.set(k, x); }); return [...m.values()]; };
    const en = gop(kq.en), vi = gop(kq.vi);
    console.log('\n### ' + trang + ' · ' + man.length + ' trang · ' + soTen + ' tên riêng loại trừ');
    console.log('  EN còn tiếng Việt: ' + en.length + ' · VI còn chữ khung tiếng Anh: ' + vi.length + (errs.length ? ' · LỖI JS: ' + errs.length : ''));
    en.slice(0, 60).forEach(x => console.log('  ✗ EN ' + x.man.padEnd(14) + (x.tab || '-').padEnd(10) + x.loai.padEnd(11) + x.chuoi + '   [' + x.sel + ']'));
    vi.slice(0, 20).forEach(x => console.log('  ✗ VI ' + x.man.padEnd(14) + (x.tab || '-').padEnd(10) + x.loai.padEnd(11) + x.chuoi + '   [' + x.sel + ']'));
    errs.slice(0, 5).forEach(e => console.log('  JS: ' + e));
    tongHong += en.length + vi.length + errs.length;
    await p.close();
  }
  await b.close();
  console.log('\n' + (tongHong ? tongHong + ' chỗ chưa sạch' : 'hai cổng sạch ở cả hai chiều'));
  process.exit(tongHong ? 1 : 0);
})();
