"use strict";
/* =====================================================================
   TỔNG QUAN VẬN HÀNH — màn hình mở đầu mỗi sáng
   ---------------------------------------------------------------------
   Thứ tự trên xuống là có chủ ý: TÌNH TRẠNG KỲ đứng trước mọi con số.
   Một kỳ còn thiếu luồng thì mọi con số bên dưới đều nhỏ hơn sự thật;
   đọc số trước rồi mới đọc cảnh báo là đã kịp tin nhầm một lần.
   ===================================================================== */
(function () {

const CSS = `
.ov-t{display:block;font-size:12.5px;font-weight:600;margin-bottom:3px}
.ov-act{margin-top:9px}
.ov-go{margin-left:auto;flex:none;align-self:center}
.ov-note{font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.75;margin-top:10px}
.ov-chart{height:170px}
.ov-tasks{display:flex;flex-direction:column;gap:5px}
`;

/* Việc tồn — dùng chung cho badge ở cột điều hướng và panel "Việc cần làm".
   Chỉ đụng tới cờ trạng thái và hàng chờ, tuyệt đối không quét 50.000 bản
   ghi: badge được tính lại ở MỌI lần vẽ của MỌI màn hình. */
function work(A) {
  let missCells = 0, waitClose = 0;
  A.periods.forEach((p, i) => {
    const n = A.missingFeeds(i).length;
    missCells += n;
    if (!n && !A.isApproved(p.k)) waitClose++;
  });
  const qRows = A.queue.list({ status: "pending" }).length;
  const unanswered = A.questions.filter(q => !String(A.answers.get(q.id) || "").trim()).length;
  return {
    missCells, waitClose, qRows, unanswered,
    qAmount: A.queue.pendingTotal(),
    lines: (missCells ? 1 : 0) + (qRows ? 1 : 0) + (waitClose ? 1 : 0) + (unanswered ? 1 : 0)
  };
}

/* Phần doanh thu mỗi luồng gánh, suy từ trọng số cửa hàng. Nhờ nó câu
   "thiếu TikTok" nói được thành "thiếu chừng bao nhiêu tiền" thay vì một
   lời cảnh báo suông. Danh mục cửa hàng cố định nên tính một lần. */
let _share = null;
function feedShare(A) {
  if (_share) return _share;
  const tot = A.storeW.reduce((s, w) => s + w, 0);
  _share = {};
  A.feeds.forEach(f => {
    let s = 0;
    for (let j = 0; j < A.storeW.length; j++) if (A.storeFeed[j] === f.id) s += A.storeW[j];
    _share[f.id] = tot > 0 ? s / tot : 0;
  });
  return _share;
}

HAUSTEK.registerScreen({
  id: "overview",
  nav: "Tổng quan",
  group: "Vận hành",
  title: "Tổng quan vận hành",
  subtitle: "Nhìn năm giây là biết hôm nay phải làm gì. Tình trạng kỳ đứng <b>trước</b> mọi con số — kỳ còn thiếu luồng thì con số nào cũng nhỏ hơn sự thật.",

  badge(ctx) {
    const n = work(ctx.admin).lines;
    return n ? String(n) : "";
  },

  render(root, ctx) {
    const A = ctx.admin, esc = ctx.esc, fmt = ctx.fmt;
    const P = A.periods, pi = ctx.pIdx, pk = ctx.periodKey;
    const m = v => ctx.money(v);

    /* Một vòng 50.000 cho mỗi kỳ, nhớ lại dùng chung cho thẻ số, biểu đồ
       và chuỗi chia tiền — không kỳ nào bị tổng hợp hai lần. */
    const aggs = P.map((p, i) => A.agg("admin", 0, i, "rec"));
    const a = aggs[pi];
    const prev = pi > 0 ? aggs[pi - 1] : null;

    const miss = A.missingFeeds(pi);
    const appr = A.approvalOf(pk);
    const w = work(A);
    const share = feedShare(A);
    const pctOf = v => a.gross > 0 ? fmt.pct(v / a.gross) : "—";

    /* ---------- 1. dải tình trạng kỳ ---------- */
    function statusBar() {
      if (miss.length) {
        const lost = miss.reduce((s, f) => s + share[f.id], 0);
        /* Suy ngược tiền thiếu từ doanh thu ĐANG CÓ chỉ đúng khi còn luồng
           nào đó đã nạp. Thiếu cả ba thì a.gross = 0, và công thức đó nói
           "thiếu 100% doanh thu, tức chừng $0" — đúng lúc cần cảnh báo nhất
           thì lại tự bác bỏ chính mình. Không còn gì để suy thì lấy kỳ gần
           nhất có đủ luồng làm mốc, và nói rõ đó là ước theo kỳ nào. */
        let money = 0, mocKy = null;
        if (lost < 0.999 && a.gross > 0) {
          money = a.gross / (1 - lost) * lost;
        } else {
          for (let i = pi - 1; i >= 0; i--) {
            if (A.missingFeeds(i).length === 0) {
              const g = aggs[i].gross;
              if (g > 0) { money = g * lost; mocKy = P[i].label; break; }
            }
          }
        }
        return `<div class="warn">
          <div class="ic">▲</div>
          <div>
            <b>Kỳ ${esc(P[pi].label)} còn thiếu ${miss.length}/${A.feeds.length} luồng — mọi con số bên dưới đang nhỏ hơn sự thật</b>
            <span>${miss.map(f =>
              `<span class="pill">${esc(f.short)}</span>${esc(f.name)} · gánh chừng ${fmt.pct(share[f.id])} doanh thu kỳ`).join("<br>")}</span>
            <span>Thiếu tất cả khoảng ${fmt.pct(lost)} doanh thu kỳ${
              money > 0 ? `, tức chừng ${m(money)} chưa có mặt trong bảng${
                mocKy ? ` (ước theo kỳ ${esc(mocKy)} — kỳ này chưa có luồng nào để suy)` : ""}`
                       : ` — chưa nạp luồng nào nên chưa có gì để ước ra tiền`}.
            Chưa nên gửi báo cáo hoặc chi trả cho kỳ này trước khi nạp nốt.</span>
            <div class="btnrow ov-act"><button class="btn sm" data-go="ingest">Sang nạp dữ liệu</button></div>
          </div></div>`;
      }
      if (!appr) {
        return `<div class="infobar">
          <div class="ic">◆</div>
          <div>
            <b class="ov-t">Đủ ${A.feeds.length} luồng — còn chờ đối chiếu và duyệt</b>
            <span>Dữ liệu kỳ ${esc(P[pi].label)} đã về đủ, số ở đây dùng được để soát nội bộ.
            Khách chưa thấy đồng nào cho tới khi kỳ này được duyệt.</span>
            <div class="btnrow ov-act"><button class="btn sm" data-go="close">Sang đối chiếu &amp; duyệt kỳ</button></div>
          </div></div>`;
      }
      const over = (appr.overrides || []).length;
      return `<div class="okbar">
        <div class="ic">✓</div>
        <div>
          <b class="ov-t">Đã duyệt ${esc(fmt.when(appr.at))} · ${esc(appr.by)}</b>
          <span>Khách đã thấy số của kỳ ${esc(P[pi].label)}${appr.note ? " · " + esc(appr.note) : ""}.${
            over ? " Lưu ý: có " + over + " điều kiện bị bỏ qua khi duyệt." : ""}</span>
        </div></div>`;
    }

    /* ---------- 2. thẻ số ---------- */
    function kpis() {
      let cmp;
      if (!prev) cmp = "kỳ sớm nhất trong danh sách, chưa có gì để so";
      else if (A.missingFeeds(pi - 1).length) cmp = "kỳ trước thiếu luồng, không so được";
      else if (!(prev.gross > 0)) cmp = "kỳ trước chưa có doanh thu, không so được";
      else {
        const d = (a.gross - prev.gross) / prev.gross;
        cmp = `<span class="${d >= 0 ? "up" : "down"}">${d >= 0 ? "▲" : "▼"} ${fmt.pct(Math.abs(d))}</span> so kỳ ${esc(P[pi - 1].label)}`
            + (miss.length ? "<br>kỳ này còn thiếu luồng nên so chưa sòng phẳng" : "");
      }
      const perK = a.streams > 0 ? ctx.money2(a.gross / a.streams * 1000) + " / 1.000 lượt" : "chưa có lượt nghe";
      return `<div class="kpis">
        <div class="kpi hero">
          <div class="lab">Doanh thu gộp · bản ghi</div>
          <div class="val">${m(a.gross)}</div>
          <div class="sub">${cmp}</div>
        </div>
        <div class="kpi">
          <div class="lab">Phí Haustek</div>
          <div class="val">${m(a.fee)}</div>
          <div class="sub">${pctOf(a.fee)} doanh thu gộp</div>
        </div>
        <div class="kpi">
          <div class="lab">Phải trả nghệ sĩ</div>
          <div class="val">${m(a.artist)}</div>
          <div class="sub">${pctOf(a.artist)} doanh thu gộp · trước khi trừ tạm ứng</div>
        </div>
        <div class="kpi">
          <div class="lab">Phần label giữ</div>
          <div class="val">${m(a.labelCut)}</div>
          <div class="sub">${pctOf(a.labelCut)} doanh thu gộp · gồm phần giữ thêm với nghệ sĩ độc lập</div>
        </div>
        <div class="kpi">
          <div class="lab">Bản ghi có doanh thu</div>
          <div class="val">${fmt.num(a.tracks)}</div>
          <div class="sub">trên ${fmt.num(A.trackCount)} bản ghi danh mục · ${
            A.trackCount ? fmt.pct(a.tracks / A.trackCount) : "—"}</div>
        </div>
        <div class="kpi">
          <div class="lab">Lượt nghe</div>
          <div class="val">${fmt.num(a.streams)}</div>
          <div class="sub">${esc(perK)}</div>
        </div>
      </div>`;
    }

    /* ---------- 3. việc cần làm ---------- */
    function todo() {
      const rows = [];
      if (w.missCells) rows.push({
        go: "ingest", btn: "Nạp dữ liệu",
        t: "Còn " + w.missCells + " ô dữ liệu chưa nạp",
        d: "Đếm trên cả " + P.length + " kỳ × " + A.feeds.length + " luồng. Thiếu một ô thì cả kỳ đó sai mà không ai nhận ra."
      });
      if (w.qRows) rows.push({
        go: "match", btn: "Khớp ISRC",
        t: w.qRows + " dòng treo ở hàng chờ khớp · " + m(w.qAmount),
        d: "Tiền treo là tiền của người khác đang nằm chờ. Riêng The MLC đang giữ hơn 424 triệu đô chưa tìm ra chủ."
      });
      if (w.waitClose) rows.push({
        go: "close", btn: "Duyệt kỳ",
        t: w.waitClose + " kỳ đã đủ luồng nhưng chưa duyệt",
        d: "Đủ dữ liệu rồi mà chưa duyệt thì khách vẫn chưa thấy gì."
      });
      if (w.unanswered) rows.push({
        go: "questions", btn: "Trả lời",
        t: w.unanswered + "/" + A.questions.length + " câu hỏi schema chưa trả lời",
        d: "Đoán sai một câu ở đây là làm lại từ gốc, không phải sửa giao diện."
      });
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>Việc cần làm</h3>
            <div class="hint">Việc mở được, mỗi dòng một nút nhảy thẳng tới chỗ làm</div>
          </div>
        </div>
        ${rows.length ? `<div class="ov-tasks">${rows.map((r, i) => `<div class="step">
            <div class="n">${i + 1}</div>
            <div><b>${esc(r.t)}</b><span>${esc(r.d)}</span></div>
            <button class="btn sm ov-go" data-go="${esc(r.go)}">${esc(r.btn)} →</button>
          </div>`).join("")}</div>`
          : `<div class="empty">Không còn việc tồn.</div>`}
      </div>`;
    }

    /* ---------- 4. biểu đồ 12 kỳ + chuỗi chia tiền ---------- */
    function panels() {
      const step = (name, val, note, cls) => `<div class="chain-step${cls ? " " + cls : ""}">
        <div class="chain-top"><span class="chain-name">${esc(name)}</span><span class="chain-val">${m(val)}</span></div>
        <div class="chain-note">${esc(note)}</div>
        <div class="chain-bar"><i style="width:${a.gross > 0 ? Math.min(100, Math.abs(val) / a.gross * 100).toFixed(1) : 0}%"></i></div>
      </div>`;
      return `<div class="grid2">
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3>Doanh thu gộp ${P.length} kỳ</h3>
              <div class="hint">Toàn danh mục · cột đỏ là kỳ đang chọn</div>
            </div>
          </div>
          <canvas class="ov-chart" data-ov="chart"></canvas>
          <div class="ov-note">Cột <b>viền đứt</b> = kỳ chưa duyệt: cao đúng số đã tính được, nhưng chưa
          đối chiếu xong nên chưa coi là chốt và khách chưa thấy. Cột đặc = kỳ đã duyệt.</div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3>Tiền đi đâu · kỳ ${esc(P[pi].label)}</h3>
              <div class="hint">Toàn danh mục, theo tỷ lệ có hiệu lực đúng kỳ này</div>
            </div>
          </div>
          <div class="chain">
            ${step("Doanh thu gộp", a.gross, fmt.num(a.tracks) + " bản ghi có doanh thu", "")}
            ${step("− Phí Haustek", a.fee, fmt.pct(A.cfg.HAUSTEK_FEE) + " trên doanh thu gộp", "out")}
            ${step("− Phần label & giữ lại", a.labelCut, "phần label giữ, hoặc Haustek giữ thêm nếu nghệ sĩ độc lập · " + pctOf(a.labelCut), "out")}
            ${step("− Điểm producer", a.producer, "trừ vào phần nghệ sĩ, không cộng thêm bên trên · " + pctOf(a.producer), "out")}
            ${step("= Về tay nghệ sĩ", a.artist, "trước khi trừ tạm ứng · " + pctOf(a.artist), "final")}
          </div>
          <div class="ov-note">Đây là dòng tiền bản ghi. Tác quyền chảy đường riêng, không gộp vào chuỗi này.</div>
        </div>
      </div>`;
    }

    /* ---------- 5. mười bên nhận lớn nhất ---------- */
    function top10() {
      let rows, note;
      const paid = appr ? A.payoutOf(pk) : null;
      if (paid) {
        rows = paid.slice().sort((x, y) => y.earned - x.earned).slice(0, 10);
        note = "Số đã chốt tại thời điểm duyệt kỳ — đúng bằng số khách đang thấy";
      } else {
        /* earnedByParty quét cả 50.000 bản ghi: gọi ĐÚNG MỘT LẦN ở đây. */
        const earned = A.earnedByParty(pi);
        const carry = A.state().carry || {};
        rows = [];
        earned.forEach((amount, key) => {
          if (key[0] === "P") return;            /* điểm producer trả qua nghệ sĩ chính */
          const carryIn = carry[key] || 0;
          const gross = amount + carryIn;
          const bal = A.advanceBalance(key);
          const recoup = Math.min(bal, gross);
          const after = gross - recoup;
          rows.push({
            partyKey: key, kind: key[0] === "L" ? "label" : "artist",
            earned: amount, carryIn, recoup,
            payable: after >= A.cfg.PAYOUT_MIN ? after : 0,
            advanceLeft: Math.max(bal - recoup, 0)
          });
        });
        rows.sort((x, y) => y.earned - x.earned);
        rows = rows.slice(0, 10);
        note = "Kỳ chưa duyệt — đây là ước tính từ dữ liệu đang có, số chốt lại đúng lúc duyệt kỳ";
      }
      return `<div class="panel">
        <div class="panel-head">
          <div>
            <h3>10 nghệ sĩ / label lớn nhất kỳ ${esc(P[pi].label)}</h3>
            <div class="hint">${esc(note)}</div>
          </div>
        </div>
        ${rows.length ? `<div class="tb-wrap"><table class="tb">
          <thead><tr>
            <th>Bên nhận</th><th class="num">Kiếm được</th>
            <th class="num">Trừ tạm ứng</th><th class="num">Thực trả kỳ này</th>
          </tr></thead>
          <tbody>${rows.map(r => {
            const name = A.partyName(r.partyKey), cid = A.partyClientId(r.partyKey);
            return `<tr>
              <td><b>${esc(name)}</b> <span class="chip ${r.kind === "label" ? "lbl" : "ind"}">${
                r.kind === "label" ? "Label" : "Nghệ sĩ"}</span><span class="sub">${esc(cid || r.partyKey)}</span></td>
              <td class="num">${m(r.earned)}${r.carryIn > 0 ? `<span class="sub">dồn từ kỳ trước ${m(r.carryIn)}</span>` : ""}</td>
              <td class="num">${r.recoup > 0 ? "−" + m(r.recoup) : "—"}${
                r.recoup > 0 ? `<span class="sub">còn ứng ${m(r.advanceLeft)}</span>` : ""}</td>
              <td class="num">${m(r.payable)}${
                r.payable > 0 || r.earned <= 0 ? ""
                : r.recoup >= r.earned + r.carryIn - 0.005
                  ? `<span class="sub">đi hết vào tạm ứng</span>`
                  : `<span class="sub">dưới ngưỡng, dồn sang kỳ sau</span>`}</td>
            </tr>`;
          }).join("")}</tbody></table></div>`
        : `<div class="empty">Kỳ này chưa có đồng nào về tay ai.</div>`}
      </div>`;
    }

    root.innerHTML = `<style>${CSS}</style>` + statusBar() + kpis() + todo() + panels() + top10();

    /* Khung không có hàm toàn cục — mọi nút gắn sự kiện sau khi đã dựng DOM. */
    root.querySelectorAll("[data-go]").forEach(b => {
      b.addEventListener("click", () => {
        try { ctx.go(b.dataset.go); }
        catch (e) { ctx.toast(e.message, "no"); }
      });
    });

    const cv = root.querySelector('[data-ov="chart"]');
    if (cv) {
      try {
        ctx.H.barChart(cv, P.map((p, i) => ({
          label: p.label, value: aggs[i].gross, open: A.isApproved(p.k)
        })), { current: pi, height: 170 });
      } catch (e) { ctx.toast(e.message, "no"); }
    }
  }
});

})();
