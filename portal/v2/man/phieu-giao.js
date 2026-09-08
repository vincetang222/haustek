/* =====================================================================
   NỘI BỘ · PHIẾU GIAO VIỆC PHÁT HÀNH
   ---------------------------------------------------------------------
   Haustek không tự phân phối. Đối tác gửi hồ sơ lên cổng, rồi nhân viên
   ngồi gõ lại metadata ấy sang OneRPM và các tool khác. Trang này là chỗ
   ngồi làm việc đó, xếp đúng thứ tự các bước của OneRPM để mắt đi từ
   trên xuống mà không phải nhớ, mỗi trường một nút chép.

   Ba việc, ba tab:
     · Metadata — chép sang tool, không gõ tay lại (gõ tay là sai ISRC)
     · Tool — đã đẩy lên đâu rồi, ai đẩy, tool trả về mã gì
     · Link — sau khi lên kệ, dán link store thật cho đối tác thấy
   ===================================================================== */
"use strict";
(function () {

var CHON = { hs: null, tab: 'meta', tim: '', loc: 'lam' };

HT.dangKy({
  id: 'phieu-giao', nav: 'nav', nhom: 'nhomVanHanh', icon: 'up',
  vai: ['ops', 'mgmt'],
  dem: function (A) {
    try {
      var n = A.releases.list().filter(function (r) {
        return (r.status === 'received' || r.status === 'coded') &&
          A.releases.tool.cua(r.id).filter(function (x) { return x.xong; }).length === 0;
      }).length;
      return n ? String(n) : '';
    } catch (e) { return ''; }
  },

  chu: {
    vi: {
      nav: 'Phiếu giao việc', h1: 'Phiếu giao việc phát hành',
      mo: 'Chép metadata sang tool phân phối, đánh dấu đã đẩy lên đâu, rồi dán link store về cho đối tác.',
      lLam: 'Đang làm', lLink: 'Chờ dán link', lHet: 'Tất cả',
      tim: 'Tìm mã hồ sơ, tên bản phát hành, nghệ sĩ…',
      cMa: 'Mã hồ sơ', cTen: 'Bản phát hành', cTt: 'Trạng thái', cTool: 'Đã đẩy tool', cLink: 'Link store',
      khong: 'Không có hồ sơ nào ở đây', khongMo: 'Hồ sơ vào đây sau khi vận hành tiếp nhận. Đổi bộ lọc để xem hồ sơ khác.',
      chon: 'Chọn một hồ sơ', chonMo: 'Bấm một dòng ở bảng trên để mở phiếu giao việc của hồ sơ ấy.',
      quayLai: 'Chọn hồ sơ khác',
      tMeta: 'Metadata', tTool: 'Tool phân phối', tLink: 'Link store', tStore: 'Store phân phối',
      chep: 'Chép', daChep: 'Đã chép: {v}', chepHong: 'Trình duyệt không cho chép. Bôi đen rồi Ctrl+C.',
      chepHet: 'Chép cả khối', daChepHet: 'Đã chép {n} dòng',
      b1: 'Bước 1 · Album Info', b2: 'Bước 2 · Track', b3: 'Bước 3 · Album Art', b4: 'Bước 4 · Distribution Preferences',
      b1Mo: 'Khớp với trang đầu của OneRPM. Chép từ trên xuống là hết một trang.',
      b2Mo: 'Mỗi track một khối. ISRC phải chép chứ đừng gõ lại — gõ nhầm một ký tự là tháng sau tiền không khớp.',
      b3Mo: 'Ảnh bìa tối thiểu 3000×3000, RGB, không có chữ quảng cáo hay ngày phát hành trên ảnh.',
      b4Mo: 'Lãnh thổ, ngày giờ phát hành, và danh sách store bên dưới.',
      fTen: 'Title of an Album, Single or EP', fNs: 'Primary Artist or Band Name', fThem: 'Additional Artists',
      fTl: 'Main Genre', fTl2: 'Secondary Genre', fNn: 'Language', fLabel: 'Label',
      fC: 'Copyright Date of Release (©)', fP: 'Copyright Date of Recording (℗)', fUpc: 'Bar Code (UPC)',
      fNgay: 'Release Date', fGio: 'Release Time', fMui: 'Release Timezone', fLanhTho: 'Select Territory',
      fBia: 'Album art', fLoai: 'Loại phát hành', fPreSave: 'Pre-order / pre-save',
      trackTen: 'Track title', trackNs: 'Track artist', trackFeat: 'Featuring', trackIsrc: 'ISRC',
      trackNn: 'Lyrics language', trackEx: 'Explicit', trackPro: 'Producer', trackSt: 'Songwriters',
      trackAudio: 'Audio file', trackPrev: 'Preview start', trackAi: 'AI declaration',
      exNo: 'Not explicit', exYes: 'Explicit', exClean: 'Clean',
      chuaCo: 'chưa có', tongTrack: '{n} track',
      toolMo: 'Tick từng tool ngay khi đẩy xong, đừng để cuối ngày. Hồ sơ chưa tick tool nào thì không đánh dấu phát hành được.',
      cTn: 'Tool', cMaTr: 'Mã tool trả về', cAi: 'Ai · lúc nào', cLam: '',
      daDay: 'Đã đẩy', chuaDay: 'Chưa đẩy', danhDau: 'Đánh dấu đã đẩy', boDanhDau: 'Bỏ đánh dấu', mo: 'Mở tool',
      hoiTool: 'Đánh dấu đã đẩy lên {t}?', hoiToolMo: 'Ghi mã tool trả về để sau này lần ngược được. Bỏ trống cũng được.',
      lMaTr: 'Mã tool trả về (nếu có)', lGhi: 'Ghi chú',
      daDanh: 'Đã đánh dấu {t}', daBo: 'Đã bỏ đánh dấu {t}',
      storeMo: 'Store nào sẽ có bài này. Để trống là toàn bộ store của nhà phân phối.',
      storeTatCa: 'Toàn bộ store', storeChon: 'Chọn riêng', storeLuu: 'Lưu danh sách store',
      daLuuStore: 'Đã lưu {n} store', daLuuHet: 'Đã đặt lại toàn bộ store',
      linkMo: 'Dán link store thật của từng bài sau khi lên kệ. Đối tác thấy link này ở cổng của họ.',
      linkChuaMa: 'Track chưa có ISRC thì chưa dán link được — cấp mã ở trang Phát hành trước.',
      linkDan: 'Dán link', linkBo: 'Bỏ', linkMoRa: 'Mở',
      cNt: 'Nền tảng', cLinkCot: 'Đường dẫn', cCk: 'Số công khai',
      ckCo: 'có công bố', ckKhong: 'không công bố',
      daDatLink: 'Đã lưu link {n}', daBoLink: 'Đã bỏ link {n}',
      chuaPh: 'Hồ sơ chưa đánh dấu phát hành. Dán link được, nhưng thường đợi bài lên kệ đã.',
      xong: 'xong', conThieu: 'còn {n}'
    },
    en: {
      nav: 'Delivery worksheet', h1: 'Release delivery worksheet',
      mo: 'Copy metadata into the distribution tools, tick off where it went, then paste the store links back for the partner.',
      lLam: 'In progress', lLink: 'Awaiting links', lHet: 'All',
      tim: 'Search submission ID, title, artist…',
      cMa: 'Submission', cTen: 'Release', cTt: 'Status', cTool: 'Tools done', cLink: 'Store links',
      khong: 'Nothing here', khongMo: 'Submissions arrive once operations receives them. Change the filter to see others.',
      chon: 'Pick a submission', chonMo: 'Click a row above to open its worksheet.',
      quayLai: 'Pick another submission',
      tMeta: 'Metadata', tTool: 'Distribution tools', tLink: 'Store links', tStore: 'Stores',
      chep: 'Copy', daChep: 'Copied: {v}', chepHong: 'The browser blocked copying. Select the text and press Ctrl+C.',
      chepHet: 'Copy the block', daChepHet: 'Copied {n} lines',
      b1: 'Step 1 · Album Info', b2: 'Step 2 · Track', b3: 'Step 3 · Album Art', b4: 'Step 4 · Distribution Preferences',
      b1Mo: 'Mirrors OneRPM’s first page. Copy top to bottom and the page is done.',
      b2Mo: 'One block per track. Copy the ISRC, never retype it — one wrong character and next month’s money will not match.',
      b3Mo: 'Cover art at least 3000×3000, RGB, no ad copy or release dates printed on the image.',
      b4Mo: 'Territory, release date and time, and the store list below.',
      fTen: 'Title of an Album, Single or EP', fNs: 'Primary Artist or Band Name', fThem: 'Additional Artists',
      fTl: 'Main Genre', fTl2: 'Secondary Genre', fNn: 'Language', fLabel: 'Label',
      fC: 'Copyright Date of Release (©)', fP: 'Copyright Date of Recording (℗)', fUpc: 'Bar Code (UPC)',
      fNgay: 'Release Date', fGio: 'Release Time', fMui: 'Release Timezone', fLanhTho: 'Select Territory',
      fBia: 'Album art', fLoai: 'Release type', fPreSave: 'Pre-order / pre-save',
      trackTen: 'Track title', trackNs: 'Track artist', trackFeat: 'Featuring', trackIsrc: 'ISRC',
      trackNn: 'Lyrics language', trackEx: 'Explicit', trackPro: 'Producer', trackSt: 'Songwriters',
      trackAudio: 'Audio file', trackPrev: 'Preview start', trackAi: 'AI declaration',
      exNo: 'Not explicit', exYes: 'Explicit', exClean: 'Clean',
      chuaCo: 'not set', tongTrack: '{n} tracks',
      toolMo: 'Tick each tool the moment you finish it, not at the end of the day. A submission with no tool ticked cannot be marked released.',
      cTn: 'Tool', cMaTr: 'ID the tool returned', cAi: 'Who · when', cLam: '',
      daDay: 'Delivered', chuaDay: 'Not yet', danhDau: 'Mark delivered', boDanhDau: 'Undo', mo: 'Open tool',
      hoiTool: 'Mark as delivered to {t}?', hoiToolMo: 'Record the ID the tool gave back so it can be traced later. Optional.',
      lMaTr: 'ID the tool returned (optional)', lGhi: 'Note',
      daDanh: 'Marked {t}', daBo: 'Unmarked {t}',
      storeMo: 'Which stores get this release. Leave it as all for the distributor’s full list.',
      storeTatCa: 'All stores', storeChon: 'Pick individually', storeLuu: 'Save store list',
      daLuuStore: 'Saved {n} stores', daLuuHet: 'Reset to all stores',
      linkMo: 'Paste each track’s real store link once it is live. Partners see these on their own portal.',
      linkChuaMa: 'A track without an ISRC cannot take links yet — assign codes on the Releases page first.',
      linkDan: 'Save link', linkBo: 'Remove', linkMoRa: 'Open',
      cNt: 'Platform', cLinkCot: 'URL', cCk: 'Public figure',
      ckCo: 'published', ckKhong: 'not published',
      daDatLink: 'Saved the {n} link', daBoLink: 'Removed the {n} link',
      chuaPh: 'This submission is not marked released yet. You can still paste links, but usually you wait for it to go live.',
      xong: 'done', conThieu: '{n} left'
    }
  },

  ve: function (root, c) {
    var A = c.A, t = c.t;
    var hs = CHON.hs ? A.releases.get(CHON.hs) : null;
    if (CHON.hs && !hs) CHON.hs = null;

    var html = HM.dau({ h1: HM.esc(t('h1')), mo: HM.esc(t('mo')) });
    html += hs ? veHoSo(c, hs) : veDanhSach(c);
    root.innerHTML = html;

    HM.nhap(root, '[data-tim]', function (el) { CHON.tim = el.value; c.veLai(); });
    HM.bam(root, '[data-loc]', function (el) { CHON.loc = el.getAttribute('data-loc'); c.veLai(); });
    HM.bam(root, '[data-hs]', function (el) { CHON.hs = el.getAttribute('data-hs'); CHON.tab = 'meta'; c.veLai(); });
    HM.bam(root, '[data-ve-ds]', function () { CHON.hs = null; c.veLai(); });
    HM.bam(root, '[data-di-ph]', function () { c.di('phat-hanh'); });
    HM.bam(root, '[data-tab]', function (el) { CHON.tab = el.getAttribute('data-tab'); c.veLai(); });

    HM.bam(root, '[data-chep]', function (el) {
      var v = el.getAttribute('data-chep');
      HM.chep(v).then(function (ok) {
        c.thongBao(ok ? t('daChep').replace('{v}', HM.dai(v, 40)) : t('chepHong'), ok ? 'ok' : 'no');
      });
    });
    HM.bam(root, '[data-chep-khoi]', function (el) {
      var o = root.querySelector('[data-khoi="' + el.getAttribute('data-chep-khoi') + '"]');
      if (!o) return;
      var dong = [].slice.call(o.querySelectorAll('[data-chep]')).map(function (x) {
        return (x.getAttribute('data-nhan') || '') + '\t' + x.getAttribute('data-chep');
      });
      HM.chep(dong.join('\n')).then(function (ok) {
        c.thongBao(ok ? t('daChepHet').replace('{n}', dong.length) : t('chepHong'), ok ? 'ok' : 'no');
      });
    });

    if (!hs) return;
    ganTool(root, c, hs);
    ganStore(root, c, hs);
    ganLink(root, c, hs);
  }
});

/* ================================================================= */
function veDanhSach(c) {
  var A = c.A, t = c.t;
  var tatCa = A.releases.list().filter(function (r) { return r.status !== 'submitted' && r.status !== 'returned'; });
  var ds = tatCa;
  if (CHON.loc === 'lam') ds = ds.filter(function (r) { return r.status !== 'released' || !linkXong(A, r); });
  else if (CHON.loc === 'link') ds = ds.filter(function (r) { return r.status === 'released' && !linkXong(A, r); });
  var q = CHON.tim.trim().toLowerCase();
  if (q) ds = ds.filter(function (r) {
    return (r.id + ' ' + r.title + ' ' + r.artistName).toLowerCase().indexOf(q) >= 0;
  });

  var html = '<div class="bar">' +
    '<div class="srch">' + HM.icon('tim') + '<input type="search" data-tim value="' + HM.esc(CHON.tim) + '" placeholder="' + HM.esc(t('tim')) + '"></div>' +
    [['lam', t('lLam')], ['link', t('lLink')], ['het', t('lHet')]].map(function (b) {
      return '<button type="button" class="pill' + (CHON.loc === b[0] ? ' on' : '') + '" data-loc="' + b[0] + '">' + HM.esc(b[1]) + '</button>';
    }).join('') + '</div>';

  html += HM.the({
    thoBody: true,
    than: ds.length ? '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('cMa')) + '</th><th>' + HM.esc(t('cTen')) + '</th>' +
      '<th>' + HM.esc(t('cTt')) + '</th><th>' + HM.esc(t('cTool')) + '</th><th>' + HM.esc(t('cLink')) + '</th>' +
      '</tr></thead><tbody>' + ds.map(function (r) {
        var tool = A.releases.tool.cua(r.id), xong = tool.filter(function (x) { return x.xong; }).length;
        var lk = A.releases.link.conThieu(r.id);
        return '<tr class="pick" data-hs="' + HM.esc(r.id) + '">' +
          '<td class="mono">' + HM.esc(r.id) + '</td>' +
          '<td>' + HM.tenBia({ bia: r.id, ten: r.title, phu: r.artistName + ' · ' + t('tongTrack').replace('{n}', r.tracks.length) }) + '</td>' +
          '<td>' + HM.tag(nhanTt(c, r.status), r.status === 'released' ? 'ok' : r.status === 'coded' ? 'warn' : 'info') + '</td>' +
          '<td>' + (xong ? HM.tag(xong + '/' + tool.length, xong === tool.length ? 'ok' : 'warn') : HM.tag('0/' + tool.length, 'no')) + '</td>' +
          '<td>' + (lk.xong ? HM.tag(t('xong'), 'ok') : HM.tag(t('conThieu').replace('{n}', lk.thieu), lk.co ? 'warn' : '')) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : HM.trong({ icon: 'file', tieuDe: t('khong'), moTa: t('khongMo') })
  });

  /* Hai thẻ dưới đây luôn hiện, kể cả khi bảng trống. Người mở trang lần
     đầu — hoặc mở đúng hôm không có hồ sơ nào — vẫn phải hiểu trang này
     dùng để làm gì và công ty đang đẩy bài lên những tool nào. */
  html += '<div class="grid g2">' +
    HM.the({
      h2: HM.esc(t('cachTieu')), p: HM.esc(t('cachMo')), icon: 'list',
      hanhDong: '<button type="button" class="btn sm ghost" data-di-ph>' + HM.esc(t('moPh')) + '</button>',
      than: HM.kv([
        { t: t('c1'), v: t('c1Mo') },
        { t: t('c2'), v: t('c2Mo') },
        { t: t('c3'), v: t('c3Mo') }
      ])
    }) +
    HM.the({
      h2: HM.esc(t('dsTool')), p: HM.esc(t('dsToolMo')), icon: 'up', thoBody: true,
      than: '<div class="tw"><table class="t"><tbody>' +
        A.releases.tool.danhSach().map(function (x) {
          return '<tr><td>' + HM.tenBia({ ten: x.ten, seed: x.id, phu: c.lang === 'vi' ? x.mo : (x.moEn || x.mo) }) + '</td>' +
            '<td style="width:1%">' + (x.web
              ? '<a class="btn sm ghost" href="' + HM.esc(x.web) + '" target="_blank" rel="noopener">' + HM.esc(t('mo')) + '</a>'
              : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>'
    }) + '</div>';
  return html;
}
function nhanTt(c, s) {
  var vi = { received: 'Đã tiếp nhận', coded: 'Đã cấp mã', released: 'Đã phát hành' };
  var en = { received: 'Received', coded: 'Codes assigned', released: 'Released' };
  return (c.lang === 'vi' ? vi : en)[s] || s;
}
function linkXong(A, r) { try { return A.releases.link.conThieu(r.id).xong; } catch (e) { return false; } }

/* ================================================================= */
function veHoSo(c, r) {
  var A = c.A, t = c.t;
  var tool = A.releases.tool.cua(r.id), toolXong = tool.filter(function (x) { return x.xong; }).length;
  var lk = A.releases.link.conThieu(r.id);
  var st = A.releases.storeCua(r.id);

  var html = '<div class="bar">' +
    '<button type="button" class="btn sm ghost" data-ve-ds>' + HM.icon('left') + HM.esc(t('quayLai')) + '</button>' +
    '<div class="sp"></div>' + HM.tag(nhanTt(c, r.status), r.status === 'released' ? 'ok' : 'warn') + '</div>';

  html += HM.the({
    h2: HM.esc(r.title) + (r.version ? ' <span class="muted">(' + HM.esc(r.version) + ')</span>' : ''),
    p: HM.esc(r.artistName + ' · ' + r.id + ' · ' + t('tongTrack').replace('{n}', r.tracks.length)),
    icon: 'file', thoBody: true,
    than: HM.so([
      { l: t('tTool'), v: toolXong + '/' + tool.length, mau: toolXong ? (toolXong === tool.length ? HB.mau('ok') : HB.mau('warn')) : HB.mau('no') },
      { l: t('tStore'), v: st.tatCa ? t('storeTatCa') : HT.fmt.n(st.so) },
      { l: t('tLink'), v: lk.co + '/' + lk.tong, mau: lk.xong ? HB.mau('ok') : '' }
    ]) + HM.tabs([
      { k: 'meta', l: t('tMeta') },
      { k: 'tool', l: t('tTool'), dem: tool.length - toolXong || null },
      { k: 'store', l: t('tStore') },
      { k: 'link', l: t('tLink'), dem: lk.thieu || null }
    ], CHON.tab)
  });

  if (CHON.tab === 'meta') html += veMeta(c, r);
  else if (CHON.tab === 'tool') html += veTool(c, r, tool);
  else if (CHON.tab === 'store') html += veStore(c, r, st);
  else html += veLink(c, r);
  return html;
}

/* ---- một dòng metadata có nút chép ---- */
function dong(nhan, gt, o) {
  o = o || {};
  var v = gt == null ? '' : String(gt);
  var co = v !== '';
  return '<tr>' +
    '<th style="width:38%;text-align:left;font-weight:500">' + HM.esc(nhan) + (o.hoi ? HM.hoi(o.hoi) : '') + '</th>' +
    '<td class="' + (o.mono ? 'mono' : '') + '">' + (co ? HM.esc(v) : '<span class="nil">—</span>') + '</td>' +
    '<td style="width:1%">' + (co
      ? '<button type="button" class="btn sm ghost" data-chep="' + HM.esc(v) + '" data-nhan="' + HM.esc(nhan) + '">' + HM.icon('copy') + '</button>'
      : '') + '</td></tr>';
}
function khoi(c, id, tieu, mo, than) {
  return HM.the({
    h2: HM.esc(tieu), p: HM.esc(mo), icon: 'file', thoBody: true,
    hanhDong: '<button type="button" class="btn sm" data-chep-khoi="' + id + '">' + HM.icon('copy') + HM.esc(c.t('chepHet')) + '</button>',
    than: '<div class="tw" data-khoi="' + id + '"><table class="t">' + than + '</table></div>'
  });
}

function veMeta(c, r) {
  var t = c.t;
  var nam = String(r.releaseDate || '').slice(0, 4);
  var html = khoi(c, 'b1', t('b1'), t('b1Mo'),
    dong(t('fTen'), r.title + (r.version ? ' (' + r.version + ')' : '')) +
    dong(t('fLoai'), r.type) +
    dong(t('fNs'), (r.artists && r.artists.length ? r.artists[0] : r.artistName)) +
    dong(t('fThem'), (r.artists || []).slice(1).concat(r.feats || []).join(', ')) +
    dong(t('fTl'), r.genre) + dong(t('fTl2'), r.genre2) +
    dong(t('fNn'), r.lang) +
    dong(t('fLabel'), r.label) +
    dong(t('fC'), r.cLine || (nam + ' ' + (r.label || ''))) +
    dong(t('fP'), r.pLine || (nam + ' ' + (r.label || ''))) +
    dong(t('fUpc'), r.upc, { mono: true }));

  html += khoi(c, 'b2', t('b2'), t('b2Mo'),
    r.tracks.map(function (tr) {
      var ex = { no: t('exNo'), yes: t('exYes'), clean: t('exClean') }[tr.explicit] || tr.explicit;
      return '<tr class="tong"><td colspan="3"><b>' + tr.pos + '. ' + HM.esc(tr.title) + '</b></td></tr>' +
        dong(t('trackTen'), tr.title + (tr.version ? ' (' + tr.version + ')' : '')) +
        dong(t('trackNs'), tr.artist) +
        dong(t('trackFeat'), tr.feat) +
        dong(t('trackIsrc'), tr.isrc, { mono: true }) +
        dong(t('trackNn'), tr.lyricsLang) +
        dong(t('trackEx'), ex) +
        dong(t('trackPro'), tr.producer) +
        dong(t('trackSt'), tr.writers.map(function (w) { return w.name + ' (' + w.role + ' ' + w.pct + '%)'; }).join('; ')) +
        dong(t('trackAudio'), tr.audioUrl) +
        dong(t('trackPrev'), tr.previewStart ? tr.previewStart + 's' : '') +
        dong(t('trackAi'), tr.ai === '0' ? '' : 'AI ' + tr.ai);
    }).join(''));

  html += khoi(c, 'b3', t('b3'), t('b3Mo'),
    dong(t('fBia'), r.artwork) +
    dong(c.lang === 'vi' ? 'Người thiết kế' : 'Designer', r.artworkDesigner));

  html += khoi(c, 'b4', t('b4'), t('b4Mo'),
    dong(t('fLanhTho'), r.territory === 'worldwide' ? 'World' : (r.territoryNote || r.territory)) +
    dong(t('fNgay'), r.releaseDate, { mono: true }) +
    dong(t('fGio'), r.releaseHour, { mono: true }) +
    dong(t('fMui'), '(GMT+7:00) Bangkok, Hanoi, Jakarta') +
    dong(t('fPreSave'), r.presaveDate, { mono: true }));
  return html;
}

/* ================================================================= */
function veTool(c, r, tool) {
  var t = c.t;
  return HM.the({
    h2: HM.esc(t('tTool')), p: HM.esc(t('toolMo')), icon: 'up', thoBody: true,
    than: '<div class="tw"><table class="t"><thead><tr>' +
      '<th>' + HM.esc(t('cTn')) + '</th><th>' + HM.esc(t('cMaTr')) + '</th>' +
      '<th>' + HM.esc(t('cAi')) + '</th><th></th></tr></thead><tbody>' +
      tool.map(function (x) {
        return '<tr' + (x.xong ? '' : ' class="canh"') + '>' +
          '<td><div class="t-ttl">' + HM.esc(x.ten) + ' ' + HM.tag(x.xong ? t('daDay') : t('chuaDay'), x.xong ? 'ok' : 'no') + '</div>' +
            '<div class="t-sub">' + HM.esc(c.lang === 'vi' ? x.mo : (x.moEn || x.mo)) +
            (x.web ? ' · <a href="' + HM.esc(x.web) + '" target="_blank" rel="noopener">' + HM.esc(t('mo')) + '</a>' : '') + '</div>' +
            (x.ghiChu ? '<div class="t-sub">' + HM.esc(x.ghiChu) + '</div>' : '') + '</td>' +
          '<td class="mono">' + (x.ma ? HM.esc(x.ma) : '<span class="nil">—</span>') + '</td>' +
          '<td class="mono muted">' + (x.at ? HM.esc(x.by + ' · ' + HT.fmt.luc(x.at)) : '<span class="nil">—</span>') + '</td>' +
          '<td><div class="btnrow" style="flex-wrap:nowrap">' + (x.xong
            ? '<button type="button" class="btn sm ghost" data-tool-bo="' + x.id + '">' + HM.esc(t('boDanhDau')) + '</button>'
            : '<button type="button" class="btn sm pri" data-tool="' + x.id + '">' + HM.esc(t('danhDau')) + '</button>') +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
  });
}
function ganTool(root, c, r) {
  var A = c.A, t = c.t;
  HM.bam(root, '[data-tool]', function (el) {
    var id = el.getAttribute('data-tool');
    var tl = A.releases.tool.danhSach().find(function (x) { return x.id === id; }) || { ten: id };
    c.hoiThoai({
      tieuDe: t('hoiTool').replace('{t}', tl.ten), moTa: HM.esc(t('hoiToolMo')),
      than: '<label class="fld">' + HM.esc(t('lMaTr')) + '</label><input class="in mono" data-o="ma">' +
        '<label class="fld">' + HM.esc(t('lGhi')) + '</label><input class="in" data-o="ghi">',
      dong: t('danhDau')
    }).then(function (f) {
      if (!f) return;
      try {
        A.releases.tool.danhDau(r.id, id, { ma: f.ma, ghiChu: f.ghi }, A.staff.me.name);
        c.thongBao(t('daDanh').replace('{t}', tl.ten), 'ok'); HM.quenHet(); c.veLai();
      } catch (e) { c.thongBao(e.message, 'no'); }
    });
  });
  HM.bam(root, '[data-tool-bo]', function (el) {
    var id = el.getAttribute('data-tool-bo');
    try { A.releases.tool.boDanhDau(r.id, id, A.staff.me.name); c.thongBao(t('daBo').replace('{t}', id), 'ok'); HM.quenHet(); c.veLai(); }
    catch (e) { c.thongBao(e.message, 'no'); }
  });
}

/* ================================================================= */
function veStore(c, r, st) {
  var t = c.t;
  return HM.the({
    h2: HM.esc(t('tStore')), p: HM.esc(t('storeMo')), icon: 'shop', thoBody: true,
    hanhDong: '<button type="button" class="btn sm pri" data-store-luu>' + HM.esc(t('storeLuu')) + '</button>',
    than: '<div class="bar"><label class="tickrow"><input type="checkbox" data-store-het' + (st.tatCa ? ' checked' : '') + '> ' + HM.esc(t('storeTatCa')) + '</label></div>' +
      '<div class="fldrow" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px">' +
      st.rows.map(function (x) {
        return '<label class="tickrow"><input type="checkbox" data-store="' + HM.esc(x.name) + '"' + (x.chon ? ' checked' : '') + '> ' +
          (x.lon ? '<b>' + HM.esc(x.name) + '</b>' : HM.esc(x.name)) + '</label>';
      }).join('') + '</div>' +
      '<p class="say">' + HM.esc(c.lang === 'vi'
        ? 'Bảng này liệt kê 8 nền tảng lớn và 24 store tiếp theo; ' + st.tong + ' store còn lại đi theo mặc định của nhà phân phối.'
        : 'This lists the 8 major platforms and the next 24 stores; the remaining ' + st.tong + ' follow the distributor’s default.') + '</p>'
  });
}
function ganStore(root, c, r) {
  var A = c.A, t = c.t;
  HM.bam(root, '[data-store-luu]', function () {
    var het = root.querySelector('[data-store-het]');
    if (het && het.checked) {
      try { A.releases.datStore(r.id, [], A.staff.me.name); c.thongBao(t('daLuuHet'), 'ok'); HM.quenHet(); c.veLai(); }
      catch (e) { c.thongBao(e.message, 'no'); }
      return;
    }
    var chon = [].slice.call(root.querySelectorAll('[data-store]:checked')).map(function (x) { return x.getAttribute('data-store'); });
    try {
      A.releases.datStore(r.id, chon, A.staff.me.name);
      c.thongBao(t('daLuuStore').replace('{n}', chon.length), 'ok'); HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

/* ================================================================= */
function veLink(c, r) {
  var A = c.A, t = c.t;
  var coMa = r.tracks.some(function (x) { return !!x.isrc; });
  if (!coMa) return HM.the({ than: HM.trong({ icon: 'link', tieuDe: t('linkChuaMa'), moTa: t('linkMo') }) });

  var html = r.status === 'released' ? '' :
    HM.ghi({ kieu: 'info', icon: 'info', tieuDe: HM.esc(t('tLink')), than: HM.esc(t('chuaPh')) });

  r.tracks.forEach(function (tr) {
    if (!tr.isrc) return;
    var rows = A.releases.link.cua(tr.isrc);
    html += HM.the({
      h2: HM.esc(tr.pos + '. ' + tr.title), p: HM.esc(tr.isrc + ' · ' + t('linkMo')), icon: 'link', thoBody: true,
      than: '<div class="tw"><table class="t"><thead><tr>' +
        '<th>' + HM.esc(t('cNt')) + '</th><th>' + HM.esc(t('cLinkCot')) + '</th>' +
        '<th>' + HM.esc(t('cCk')) + '</th><th></th></tr></thead><tbody>' +
        rows.map(function (x) {
          return '<tr>' +
            '<td>' + HM.esc(c.lang === 'vi' ? x.plat : x.platEn) + '</td>' +
            '<td><input class="in mono" style="min-width:230px" data-link="' + HM.esc(tr.isrc + '|' + x.plat) + '" value="' + HM.esc(x.url || '') + '" placeholder="https://…">' +
              (x.at ? '<div class="t-sub">' + HM.esc(x.by + ' · ' + HT.fmt.luc(x.at)) + '</div>' : '') + '</td>' +
            '<td>' + HM.tag(x.congKhai ? t('ckCo') : t('ckKhong'), x.congKhai ? 'ok' : '') + '</td>' +
            '<td><div class="btnrow" style="flex-wrap:nowrap">' +
              '<button type="button" class="btn sm pri" data-link-luu="' + HM.esc(tr.isrc + '|' + x.plat) + '">' + HM.esc(t('linkDan')) + '</button>' +
              (x.url ? '<a class="btn sm ghost" href="' + HM.esc(x.url) + '" target="_blank" rel="noopener">' + HM.esc(t('linkMoRa')) + '</a>' +
                '<button type="button" class="btn sm ghost" data-link-bo="' + HM.esc(tr.isrc + '|' + x.plat) + '">' + HM.esc(t('linkBo')) + '</button>' : '') +
            '</div></td></tr>';
        }).join('') + '</tbody></table></div>'
    });
  });
  return html;
}
function ganLink(root, c) {
  var A = c.A, t = c.t;
  HM.bam(root, '[data-link-luu]', function (el) {
    var k = el.getAttribute('data-link-luu'), p = k.split('|');
    var o = root.querySelector('[data-link="' + k.replace(/"/g, '\\"') + '"]');
    if (!o || !o.value.trim()) return;
    try {
      A.releases.link.dat(p[0], p[1], o.value.trim(), A.staff.me.name);
      c.thongBao(t('daDatLink').replace('{n}', p[1]), 'ok'); HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
  HM.bam(root, '[data-link-bo]', function (el) {
    var p = el.getAttribute('data-link-bo').split('|');
    try {
      A.releases.link.bo(p[0], p[1], A.staff.me.name);
      c.thongBao(t('daBoLink').replace('{n}', p[1]), 'ok'); HM.quenHet(); c.veLai();
    } catch (e) { c.thongBao(e.message, 'no'); }
  });
}

})();
