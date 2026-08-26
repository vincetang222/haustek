"use strict";
/* =====================================================================
   MÀN HÌNH: NẠP BÁO CÁO DOANH THU
   ---------------------------------------------------------------------
   Ba luồng tiền về từ ba mối khác nhau, ba định dạng, ba lịch. Ở đầu
   nguồn KHÔNG có con số tổng nào để đối chiếu, nên thiếu một luồng thì
   kỳ vẫn ra số — chỉ là số thấp hơn thực tế, và không có dấu hiệu nào
   báo, vì con số vẫn "có". Vì vậy màn hình này bám vào TỪNG Ô kỳ ×
   luồng chứ không bám vào kỳ: một kỳ "đã nạp" là câu nói vô nghĩa.
   ===================================================================== */
(function () {

const H = HAUSTEK, esc = H.esc, fmt = H.fmt;

/* tiếng Việt dùng dấu phẩy thập phân; fmt.pct của lõi trả dấu chấm */
const pc = v => (v * 100).toFixed(1).replace(/\.0$/, "").replace(".", ",") + "%";

/* Tên file gợi ý — mỗi mối một quy ước đặt tên riêng, người vận hành
   nhận file rồi gõ lại tên thật nếu khác. */
function suggestFile(fid, per) {
  const ym = per.year + String(per.month).padStart(2, "0");
  return fid === 0 ? "sales-report-" + ym + ".csv"
       : fid === 1 ? "yt-" + ym + "-partner.csv.gz"
       : "tiktok-" + ym + ".xlsx";
}

/* Tỷ trọng doanh thu của từng luồng, suy từ trọng số cửa hàng. Đây là
   con số biến "chưa nạp TikTok" từ lời cảnh báo suông thành một khoản
   tiền cụ thể đang thiếu. */
function feedShares(A) {
  const w = A.storeW, sf = A.storeFeed;
  const acc = {}; let tot = 0;
  A.feeds.forEach(f => { acc[f.id] = 0; });
  for (let j = 0; j < w.length; j++) {
    tot += w[j];
    if (acc[sf[j]] !== undefined) acc[sf[j]] += w[j];
  }
  A.feeds.forEach(f => { acc[f.id] = tot > 0 ? acc[f.id] / tot : 0; });
  return acc;
}

/* Tác quyền không nằm trong 100% của bản ghi — nó là dòng tiền khác.
   Đo bằng một vòng duy nhất qua danh mục, trên kỳ gần nhất đã có tác
   quyền về, để nói được nó lớn cỡ nào so với doanh thu bản ghi. */
function pubWeight(A) {
  let ref = -1;
  for (let i = A.periods.length - 1; i >= 0; i--) if (A.pubLoaded(i)) { ref = i; break; }
  if (ref < 0) return null;
  let rec = 0, pub = 0;
  for (let i = 0; i < A.trackCount; i++) { rec += A.grossRec(i, ref); pub += A.grossPub(i, ref); }
  return { per: A.periods[ref], rec, pub, ratio: rec > 0 ? pub / rec : 0 };
}

function stepsHTML(A) {
  return '<div class="steps">' + A.ingest.steps.map((s, i) =>
    '<div class="step" data-step="' + i + '">' +
      '<div class="n">' + (i + 1) + '</div>' +
      '<div><b>' + esc(s.t) +
        (s.k === "match" ? '<em class="ing-flag">dễ mất tiền nhất</em>' : "") +
      '</b><span>' + esc(s.d) + '</span></div>' +
      '<div class="mark"></div>' +
    '</div>').join("") + '</div>';
}

/* Hoạt cảnh 8 bước. Dừng hẳn nếu hộp thoại bị đóng giữa chừng — timer
   còn sống mà DOM đã mất thì bước cuối sẽ gọi load() sau lưng người dùng. */
function animate(bg, timers, done) {
  const steps = Array.prototype.slice.call(bg.querySelectorAll("[data-step]"));
  let n = 0;
  const tick = () => {
    if (!bg.isConnected) return;
    if (n > 0) {
      const prev = steps[n - 1];
      prev.classList.remove("run"); prev.classList.add("done");
      const m = prev.querySelector(".mark"); if (m) m.textContent = "✓";
    }
    if (n >= steps.length) { done(); return; }
    steps[n].classList.add("run");
    const m = steps[n].querySelector(".mark"); if (m) m.textContent = "···";
    n++;
    timers.push(setTimeout(tick, 260 + Math.round(Math.random() * 160)));
  };
  tick();
}

/* ---------------------------------------------------------------------
   HỘP THOẠI NẠP
   --------------------------------------------------------------------- */
async function openLoad(ctx, p, feed, isPub) {
  const A = ctx.admin, per = A.periods[p];
  const suggested = isPub ? "cmo-" + per.k + ".xlsx" : suggestFile(feed.id, per);
  const timers = [];
  let loaded = false, jumped = false;

  const body =
    '<label class="fld">Tên file nhận được</label>' +
    '<input type="text" data-field="file" style="width:100%" value="' + esc(suggested) + '"' +
      (isPub ? " disabled" : "") + '>' +
    '<p class="note" style="margin-top:7px">' + esc(feed.fmt) + ' — ' + esc(feed.note) +
      (isPub ? ' · bản mẫu đặt sẵn tên file theo kỳ' : '') + '</p>' +
    '<div class="btnrow" style="margin:14px 0 12px"><button type="button" class="btn pri" data-run>Chạy đường ống 8 bước</button>' +
      '<span class="note">nạp xong khách vẫn chưa thấy gì — còn bước duyệt kỳ</span></div>' +
    stepsHTML(A) +
    '<div data-out style="margin-top:13px"></div>';

  await ctx.modal({
    title: "Nạp " + feed.name + " · kỳ " + per.label,
    hint: "Bước 3 — khớp ISRC với danh mục — là khâu dễ mất tiền nhất của cả đường ống: dòng nào không khớp được sẽ vào hàng chờ xử lý tay, không bao giờ bị bỏ im.",
    body, ok: false, cancel: "Đóng",
    onMount(bg) {
      const run = bg.querySelector("[data-run]");
      const out = bg.querySelector("[data-out]");
      const inp = bg.querySelector("[data-field=file]");
      const closeBtn = bg.querySelector("[data-act=cancel]");
      run.onclick = () => {
        const name = ((inp && inp.value) || "").trim() || suggested;
        run.disabled = true; if (inp) inp.disabled = true;
        animate(bg, timers, () => {
          let res = null;
          try {
            if (isPub) A.ingest.loadPub(p);
            else res = A.ingest.load(p, feed.id, { file: name, replace: true });
          } catch (e) {
            ctx.toast(e.message, "no");
            out.innerHTML = '<div class="warn"><span class="ic">!</span><div>' +
              '<b>Không nạp được</b><span>' + esc(e.message) + '</span></div></div>';
            return;
          }
          loaded = true;
          const added = res ? res.added : 0;
          const pend = A.queue.list({ periodKey: per.k, status: "pending" }).length;
          const amt = A.queue.pendingTotal(per.k);
          out.innerHTML =
            '<div class="okbar"><span class="ic">✓</span><div>' +
              '<b>Đã nạp ' + esc(feed.name) + ' cho kỳ ' + esc(per.label) + '</b>' +
              '<span>' + esc(name) + (added ? ' · ' + added + ' dòng không khớp được ISRC, đã đẩy vào hàng chờ' :
                                              ' · tác quyền vào dòng tiền riêng, không cộng vào doanh thu bản ghi') + '</span>' +
              '<span>Hàng chờ kỳ ' + esc(per.label) + ': ' + fmt.num(pend) + ' dòng · ' +
                esc(ctx.money2(amt)) + ' đang treo, chưa về tay ai</span>' +
            '</div></div>' +
            '<div class="btnrow">' +
              (pend ? '<button type="button" class="btn pri" data-match>Sang hàng chờ khớp ISRC →</button>' : "") +
              '<button type="button" class="btn" data-close>Xong</button></div>';
          const mb = out.querySelector("[data-match]");
          if (mb) mb.onclick = () => {
            jumped = true;
            if (closeBtn) closeBtn.click();
            if (ctx.pIdx !== p) ctx.setPeriod(p);
            ctx.go("match");
          };
          const cb = out.querySelector("[data-close]");
          if (cb) cb.onclick = () => { if (closeBtn) closeBtn.click(); };
        });
      };
    }
  });

  timers.forEach(clearTimeout);          /* đóng giữa chừng thì không còn timer nào chạy tiếp */
  if (loaded && !jumped) ctx.refresh();
}

/* ---------------------------------------------------------------------
   HỘP THOẠI Ô ĐÃ NẠP
   --------------------------------------------------------------------- */
async function openLoaded(ctx, p, feed, isPub) {
  const A = ctx.admin, per = A.periods[p];
  const st = isPub ? A.state().pub[per.k] : A.state().feeds[per.k][feed.id];
  const pend = isPub ? 0 : A.queue.list({ periodKey: per.k, feedId: feed.id, status: "pending" }).length;
  let next = null;

  await ctx.modal({
    title: feed.name + " · kỳ " + per.label,
    hint: esc(feed.fmt) + " — " + esc(feed.note),
    body:
      '<table class="tb"><tbody>' +
        '<tr><td>Trạng thái</td><td class="num"><span class="chip ok">đã nạp</span></td></tr>' +
        '<tr><td>Nạp lúc</td><td class="num mono">' + esc(fmt.when(st && st.at)) + '</td></tr>' +
        '<tr><td>File</td><td class="num mono">' + esc((st && st.file) || "—") + '</td></tr>' +
        (isPub ? "" :
        '<tr><td>Dòng của luồng này còn treo trong hàng chờ</td><td class="num mono">' + fmt.num(pend) + '</td></tr>') +
      '</tbody></table>' +
      '<div class="btnrow" style="margin-top:14px">' +
        '<button type="button" class="btn" data-reload>Nạp đè file khác</button>' +
        (isPub ? "" : '<button type="button" class="btn dang" data-unload>Gỡ luồng này</button>') +
      '</div>' +
      (isPub ? '<p class="note" style="margin-top:9px">Tác quyền chưa có đường gỡ ở tầng dữ liệu — muốn sửa thì nạp đè.</p>' :
               '<p class="note" style="margin-top:9px">Gỡ luồng xong doanh thu của luồng này biến khỏi tổng kỳ ' + esc(per.label) + ' ngay, đúng như khi file chưa bao giờ về.</p>'),
    ok: false, cancel: "Đóng",
    onMount(bg) {
      const close = () => { const c = bg.querySelector("[data-act=cancel]"); if (c) c.click(); };
      const r = bg.querySelector("[data-reload]");
      if (r) r.onclick = () => { next = "reload"; close(); };
      const u = bg.querySelector("[data-unload]");
      if (u) u.onclick = () => { next = "unload"; close(); };
    }
  });

  if (next === "reload") return openLoad(ctx, p, feed, isPub);
  if (next === "unload") {
    const ok = await ctx.confirm(
      "Gỡ " + feed.name + " khỏi kỳ " + per.label + "?",
      "Doanh thu luồng này rút khỏi tổng kỳ ngay lập tức. Các dòng đã khớp tay từ hàng chờ vẫn nằm đó nhưng cũng ngừng được tính, vì chúng gắn với luồng.",
      "Gỡ luồng", true);
    if (!ok) return;
    try {
      A.ingest.unload(p, feed.id);
      ctx.toast("Đã gỡ " + feed.name + " khỏi kỳ " + per.label, "ok");
      ctx.refresh();
    } catch (e) { ctx.toast(e.message, "no"); }
  }
}

/* Kỳ đã duyệt là kỳ khách đã nhìn thấy số và bảng chi trả đã chốt —
   không đụng được vào dữ liệu nguồn nếu chưa thu hồi duyệt. */
async function openLocked(ctx, p, feed) {
  const per = ctx.admin.periods[p];
  const ok = await ctx.confirm(
    "Kỳ " + per.label + " đã duyệt",
    "Số của kỳ này đã mở cho label và nghệ sĩ, bảng chi trả cũng đã chốt. Muốn nạp lại hay gỡ " +
      esc(feed.name) + " thì phải thu hồi duyệt trước — thu hồi xong khách sẽ không thấy kỳ này nữa cho tới lần duyệt sau.",
    "Sang màn duyệt kỳ");
  if (ok) { if (ctx.pIdx !== p) ctx.setPeriod(p); ctx.go("close"); }
}

/* ---------------------------------------------------------------------
   VẼ MÀN HÌNH
   --------------------------------------------------------------------- */
H.registerScreen({
  id: "ingest",
  nav: "Nạp dữ liệu",
  group: "Vận hành",
  title: "Nạp báo cáo doanh thu",
  subtitle: "Ba luồng, ba định dạng, ba lịch về. <b>Thiếu một luồng thì cả kỳ sai mà không ai nhận ra</b> — nên trạng thái theo từng ô kỳ × luồng, không theo kỳ.",

  badge(ctx) {
    const A = ctx.admin;
    let n = 0;
    for (let i = 0; i < A.periods.length; i++) n += A.missingFeeds(i).length;
    return n ? String(n) : "";
  },

  render(root, ctx) {
    const A = ctx.admin, P = A.periods, per = P[ctx.pIdx];
    const share = feedShares(A);
    const pw = pubWeight(A);

    /* --- thống kê ô thiếu trên toàn 12 kỳ --- */
    const gaps = [];
    let missCells = 0;
    P.forEach((pr, i) => {
      const m = A.missingFeeds(i);
      if (m.length) { missCells += m.length; gaps.push({ per: pr, feeds: m }); }
    });
    const totalCells = P.length * A.feeds.length;

    const missNow = A.missingFeeds(ctx.pIdx);
    const missShareNow = missNow.reduce((s, f) => s + (share[f.id] || 0), 0);

    const quarters = P.filter(x => x.month % 3 === 0);
    const pubDone = P.filter((x, i) => A.pubLoaded(i)).length;
    const pubLate = quarters.filter((x) => !A.pubLoaded(A.pIndexOf(x.k)));

    const pendNow = A.queue.list({ periodKey: per.k, status: "pending" }).length;
    const prevPer = ctx.pIdx > 0 ? P[ctx.pIdx - 1] : null;
    const pendPrev = prevPer ? A.queue.list({ periodKey: prevPer.k, status: "pending" }).length : 0;
    const pendAll = A.queue.list({ status: "pending" }).length;

    /* --- KPI --- */
    const kpis =
      '<div class="kpis">' +
        '<div class="kpi ' + (missCells ? "hero" : "good") + '"><div class="lab">Ô còn thiếu</div>' +
          '<div class="val">' + missCells + '</div>' +
          '<div class="sub">trên ' + totalCells + ' ô (' + P.length + ' kỳ × ' + A.feeds.length + ' luồng)<br>' +
            (gaps.length ? esc(gaps.slice(0, 3).map(g => g.per.label + ": " + g.feeds.map(f => f.short).join(", ")).join(" · ")) +
              (gaps.length > 3 ? " · và " + (gaps.length - 3) + " kỳ nữa" : "")
            : "không kỳ nào hụt luồng") + '</div></div>' +

        '<div class="kpi ' + (missNow.length ? "bad" : "good") + '"><div class="lab">Kỳ ' + esc(per.label) + '</div>' +
          '<div class="val">' + (A.feeds.length - missNow.length) + '/' + A.feeds.length + ' luồng</div>' +
          '<div class="sub">' + (missNow.length
            ? "thiếu " + esc(missNow.map(f => f.short).join(", ")) + "<br>≈ " + pc(missShareNow) + " doanh thu kỳ chưa vào sổ"
            : "đủ ba luồng · số của kỳ này đã đầy đủ") + '</div></div>' +

        '<div class="kpi"><div class="lab">Hàng chờ khớp ISRC</div>' +
          '<div class="val">' + fmt.num(pendNow) + '</div>' +
          '<div class="sub">dòng treo ở kỳ ' + esc(per.label) + ' · ' + esc(ctx.money2(A.queue.pendingTotal(per.k))) + '<br>' +
            (prevPer ? "kỳ " + esc(prevPer.label) + ": " + fmt.num(pendPrev) + " dòng · " : "") +
            "toàn hệ " + fmt.num(pendAll) + " dòng</div></div>" +

        '<div class="kpi ' + (pubLate.length ? "bad" : "") + '"><div class="lab">Tác quyền</div>' +
          '<div class="val">' + pubDone + '/' + quarters.length + ' quý</div>' +
          '<div class="sub">về theo quý, trễ 1–2 quý · dòng tiền tách rời<br>' +
            (pubLate.length ? "chưa về: " + esc(pubLate.map(x => x.label).join(", ")) : "đã về đủ các quý tới hạn") +
          '</div></div>' +
      '</div>';

    /* --- ma trận kỳ × luồng --- */
    let rows = "";
    for (let i = P.length - 1; i >= 0; i--) {
      const pr = P[i], appr = A.isApproved(pr.k);
      const cells = A.feeds.map(f => '<td>' + cellHTML(A, i, f, false, appr) + '</td>').join("") +
                    '<td>' + cellHTML(A, i, A.pubFeed, true, appr) + '</td>';
      rows += '<tr><td class="per-cell' + (i === ctx.pIdx ? " ing-now" : "") + '">' +
          '<button class="ing-per" data-per="' + i + '">' + esc(pr.label) + '</button> ' +
          (appr ? '<span class="chip ok">đã duyệt</span>' : '<span class="chip wait">chưa duyệt</span>') +
        '</td>' + cells + '</tr>';
    }

    const matrix =
      '<div class="panel"><div class="panel-head"><div>' +
        '<h3>Ma trận kỳ × luồng</h3>' +
        '<p class="hint">Mỗi ô là một file thật phải về từ một mối thật. Bấm ô để nạp, nạp đè hoặc gỡ; bấm nhãn kỳ để chuyển cả trang sang kỳ đó.</p>' +
      '</div></div>' +
      '<div class="matrix ing-mx"><table><thead><tr><th>Kỳ</th>' +
        A.feeds.map(f => '<th>' + esc(f.short) + '<span class="ing-share">≈ ' + pc(share[f.id] || 0) + ' doanh thu</span></th>').join("") +
        '<th>Tác quyền<span class="ing-share">dòng tiền tách rời</span></th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="ing-legend">' +
        '<span><span class="dot ok"></span>đã nạp</span>' +
        '<span><span class="dot no"></span>thiếu — tiền của luồng này không có trong tổng kỳ</span>' +
        '<span><span class="dot off"></span>tác quyền chưa tới hạn (chỉ về cuối quý)</span>' +
        '<span>ô mờ = kỳ đã duyệt, khoá lại</span>' +
      '</div></div>';

    /* --- ba luồng, ba định dạng --- */
    const feedRow = (f, isPub) => {
      const on = isPub ? A.pubLoaded(ctx.pIdx) : A.feedLoaded(ctx.pIdx, f.id);
      const w = isPub ? null : (share[f.id] || 0);
      return '<tr><td><b>' + esc(f.name) + '</b><span class="sub">' + esc(f.note) + '</span></td>' +
        '<td class="note">' + esc(f.fmt) + '</td>' +
        '<td class="num">' + (isPub
          ? '<span class="chip info">tách rời</span>' +
            (pw ? '<span class="sub">≈ ' + pc(pw.ratio) + ' so với bản ghi (kỳ ' + esc(pw.per.label) + ')</span>' : "")
          : pc(w) + '<div class="ing-bar"><i style="width:' + (w * 100).toFixed(1) + '%"></i></div>') + '</td>' +
        '<td>' + (on ? '<span class="chip ok">đã nạp</span>'
                     : (isPub && per.month % 3 !== 0
                        ? '<span class="chip">chưa tới hạn</span>'
                        : '<span class="chip no">chưa nạp</span>')) + '</td></tr>';
    };

    const feedsPanel =
      '<div class="panel"><h3>Ba luồng, ba định dạng</h3>' +
      '<p class="hint">Không mối nào biết mối nào. Đầu nguồn không có một con số tổng để đối chiếu — nên trạng thái phải theo từng luồng.</p>' +
      '<table class="tb"><thead><tr><th>Luồng</th><th>Định dạng · lịch về</th><th class="num">Tỷ trọng doanh thu</th><th>Kỳ ' + esc(per.label) + '</th></tr></thead>' +
      '<tbody>' + A.feeds.map(f => feedRow(f, false)).join("") + feedRow(A.pubFeed, true) + '</tbody></table>' +
      '<p class="note" style="margin-top:12px">Vì sao phải theo dõi riêng từng luồng: nếu TikTok chưa về mà kỳ vẫn chốt, doanh thu kỳ hụt khoảng ' +
        pc(share[2] || 0) + ' và bảng của <b>mọi</b> nghệ sĩ đều thấp hơn thực tế. Không có cảnh báo nào tự nổi lên, vì con số vẫn có — chỉ là thiếu. ' +
        'Tác quyền thì ngược lại: nó là dòng tiền khác, về theo quý, label không được thấy — gộp vào "đủ luồng chưa" là sai từ gốc.</p></div>';

    /* --- đường ống nạp --- */
    const pipeline =
      '<div class="panel"><h3>Đường ống nạp</h3>' +
      '<p class="hint">Tám bước, chạy y hệt nhau cho cả ba luồng sau khi đã qua parser riêng. Đây mới là chỗ hệ thống sống hay chết.</p>' +
      stepsHTML(A) +
      '<div class="warn" style="margin-top:14px"><span class="ic">!</span><div>' +
        '<b>Dòng không khớp được ISRC phải vào hàng chờ xử lý tay</b>' +
        '<span>Không được bỏ im, cũng không được tự gán vào bài gần giống. Tiền đó là của một người cụ thể nào đó. ' +
          'Đang treo <span class="pill">' + fmt.num(pendAll) + ' dòng</span> ' + esc(ctx.money2(A.queue.pendingTotal())) + ' trên toàn hệ.</span>' +
      '</div></div>' +
      '<div class="infobar"><span class="ic">→</span><div>' +
        '<b>Phải có bước duyệt kỳ trước khi khách thấy số</b>' +
        '<span>Nạp xong mới chỉ là có dữ liệu trong hệ thống. Label và nghệ sĩ chỉ thấy kỳ đã duyệt — kỳ đối chiếu chưa sạch thì họ không thấy con số nào, kể cả con số đúng.</span>' +
      '</div></div>' +
      '<div class="btnrow"><button class="btn" data-go="match">Hàng chờ khớp ISRC</button>' +
        '<button class="btn" data-go="close">Đối chiếu &amp; duyệt kỳ</button></div></div>';

    /* --- nhật ký nạp --- */
    const NAME = { "ingest.load": "Nạp luồng", "ingest.unload": "Gỡ luồng", "ingest.pub": "Nạp tác quyền" };
    const logs = A.audit.list(60).filter(a => String(a.action).indexOf("ingest.") === 0);
    const logPanel =
      '<div class="panel"><h3>Nhật ký nạp gần đây</h3>' +
      '<p class="hint">Lọc từ 60 mục nhật ký mới nhất. Ai nạp gì, lúc nào — để khi số lệch còn lần ngược được.</p>' +
      (logs.length
        ? '<div class="tb-wrap"><table class="tb"><thead><tr><th>Lúc</th><th>Ai</th><th>Việc</th></tr></thead><tbody>' +
          logs.map(a =>
            '<tr><td class="mono">' + esc(fmt.when(a.at)) + '</td>' +
            '<td class="mono">' + esc(a.by) + '</td>' +
            '<td><b>' + esc(NAME[a.action] || a.action) + '</b><span class="sub">' + esc(a.detail) + '</span></td></tr>').join("") +
          '</tbody></table></div>'
        : '<div class="empty">Chưa có lần nạp nào trong 60 mục nhật ký gần đây.</div>') +
      '</div>';

    root.innerHTML = STYLE + kpis + matrix +
      '<div class="grid2 even"><div>' + feedsPanel + logPanel + '</div><div>' + pipeline + '</div></div>';

    /* --- gắn sự kiện lên phần tử đã tạo --- */
    root.querySelectorAll("[data-per]").forEach(b => {
      b.onclick = () => ctx.setPeriod(+b.dataset.per);
    });
    root.querySelectorAll("[data-go]").forEach(b => {
      b.onclick = () => ctx.go(b.dataset.go);
    });
    root.querySelectorAll("button.cell[data-p]").forEach(b => {
      b.onclick = async () => {
        const p = +b.dataset.p, isPub = b.dataset.f === "pub";
        const feed = isPub ? A.pubFeed : A.feeds.filter(f => f.id === +b.dataset.f)[0];
        if (!feed) return;
        try {
          if (A.isApproved(A.periods[p].k)) return await openLocked(ctx, p, feed);
          const on = isPub ? A.pubLoaded(p) : A.feedLoaded(p, feed.id);
          if (on) await openLoaded(ctx, p, feed, isPub);
          else await openLoad(ctx, p, feed, isPub);
        } catch (e) { ctx.toast(e.message, "no"); }
      };
    });
  }
});

/* Một ô = một file phải về. Ba trạng thái nói ba chuyện khác nhau:
   đã nạp · thiếu (tiền đang hụt) · chưa tới hạn (bình thường). */
function cellHTML(A, p, feed, isPub, approved) {
  const per = A.periods[p];
  const st = isPub ? A.state().pub[per.k] : A.state().feeds[per.k][feed.id];
  const on = isPub ? A.pubLoaded(p) : A.feedLoaded(p, feed.id);
  const due = isPub ? (per.month % 3 === 0) : true;

  const cls = [on ? "loaded" : (due ? "missing" : ""), approved ? "locked" : ""]
    .filter(Boolean).join(" ");

  let head, l1, l2 = "";
  if (on) {
    head = "Đã nạp";
    l1 = fmt.date(st && st.at);
    l2 = (st && st.file) || "";
  } else if (due) {
    head = isPub ? "Chưa về" : "Chưa nạp";
    l1 = approved ? "kỳ đã chốt mà vẫn hụt" : (isPub ? "quý này đã tới hạn" : "bấm để nạp");
    if (!approved && !isPub) l2 = suggestFile(feed.id, per);
  } else {
    head = "Chưa tới hạn";
    l1 = "tác quyền chỉ về cuối quý";
  }

  const tip = feed.name + " · kỳ " + per.label + " · " +
    (on ? "nạp lúc " + fmt.when(st && st.at) + " · " + ((st && st.file) || "") : head) +
    (approved ? " · kỳ đã duyệt, phải thu hồi duyệt mới sửa được" : "");

  return '<button class="cell' + (cls ? " " + cls : "") + '" data-p="' + p + '" data-f="' + (isPub ? "pub" : feed.id) + '"' +
    ' title="' + esc(tip) + '"><b>' + esc(head) + '</b>' + esc(l1) +
    (l2 ? '<span class="ing-file">' + esc(l2) + '</span>' : "") + '</button>';
}

const STYLE =
'<style>' +
'.ing-mx td{padding:0;vertical-align:top}' +
'.ing-file{display:block;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.82}' +
'.ing-per{font-family:var(--mono);font-size:11.5px;font-weight:600;color:var(--ink);padding:0 0 1px;border-bottom:1px dashed var(--hair2)}' +
'.ing-per:hover{color:var(--red);border-color:var(--red)}' +
'.ing-now{background:var(--red-soft);border-radius:7px}' +
'.ing-share{display:block;font-size:8.5px;letter-spacing:.03em;text-transform:none;color:var(--muted2);margin-top:3px;font-weight:400}' +
'.ing-legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;font-family:var(--mono);font-size:9.5px;color:var(--muted)}' +
'.ing-bar{height:3px;border-radius:3px;background:#EBECF0;margin-top:5px;overflow:hidden}' +
'.ing-bar i{display:block;height:100%;border-radius:3px;background:var(--teal)}' +
'.ing-flag{display:inline-block;font-family:var(--mono);font-style:normal;font-size:8.5px;letter-spacing:.06em;' +
  'text-transform:uppercase;background:var(--red-soft);color:var(--red);border-radius:5px;padding:1px 6px;margin-left:7px;vertical-align:middle}' +
'</style>';

})();
