/* =====================================================================
   CỔNG ĐỐI TÁC · VIỆC CỦA TÔI
   ---------------------------------------------------------------------
   Mọi việc Haustek đang làm cho đối tác này, bất kể thuộc mảng dịch vụ
   nào, trong MỘT danh sách. Mỗi dòng là một câu đọc được, không phải một
   hàng bảng mười cột bắt người ta tự ghép nghĩa.

   Nút "Gửi yêu cầu mới" là cửa vào duy nhất cho chín mảng dịch vụ chưa có
   biểu mẫu công khai riêng. Câu biên nhận sau khi gửi lấy nguyên văn từ
   lõi, không viết lại ở đây: đó là một LỜI HỨA của công ty, và lời hứa
   thì chỉ được có một bản.
   ===================================================================== */
"use strict";
(function () {

var e = function (x) { return HM.esc(x == null ? '' : String(x)); };
var CHIP = [
  { k: 'dang-lam', l: 'Đang làm' },
  { k: 'cho-ban',  l: 'Chờ bạn' },
  { k: 'xong',     l: 'Đã xong' },
  { k: 'tat-ca',   l: 'Tất cả' }
];

function locViec(ds, k) {
  if (k === 'cho-ban') return ds.filter(function (v) { return v.canBan; });
  if (k === 'xong') return ds.filter(function (v) { return v.trangThai === 'xong'; });
  if (k === 'dang-lam') return ds.filter(function (v) { return v.trangThai !== 'xong' && !v.canBan; });
  return ds;
}

/* Việc chưa phân công thì người phụ trách đối tác đứng tên. Nối thẳng
   v.nguoiPhuTrachTen vào câu thì đối tác đọc được chữ "null phụ trách",
   và đó là kiểu lỗi làm người ta thôi tin cả trang. Với đối tác thì luôn
   có một cái tên: người phụ trách của họ. */
function ai(c, v) {
  if (v.nguoiPhuTrachTen) return v.nguoiPhuTrachTen;
  var ns = c.phien && c.phien.nguoiPhuTrach;
  return ns ? ns.ten : 'Haustek';
}

/* Một câu kể việc này đang ở đâu và ai đang nợ ai. */
function cauViec(api, v, c) {
  if (v.canBan) return 'Haustek đang chờ bạn ' + String(v.canBan.viec).toLowerCase() +
    (v.canBan.han ? ', mong nhận trước ' + api.ngayVi(v.canBan.han) : '') + '.';
  if (v.trangThai === 'xong') return 'Đã xong ngày ' + api.ngayVi(v.xongLuc) + '.';
  if (v.camKet) return v.camKet;
  var xong = (v.moc || []).filter(function (m) { return m.xong; }).length;
  if (v.moc && v.moc.length) {
    var tiep = (v.moc || []).filter(function (m) { return !m.xong; })[0];
    return 'Đã qua ' + xong + '/' + v.moc.length + ' chặng' + (tiep ? ', đang tới bước ' + String(tiep.ten).toLowerCase() : '') + '.';
  }
  return ai(c, v) + ' đang phụ trách việc này.';
}

function veChiTiet(c, v) {
  var api = c.api, ph = c.phien;
  var moc = (v.moc || []).length
    ? '<h3>Các chặng</h3><div style="max-width:420px;margin-bottom:6px">' +
        HM.thanh((v.moc || []).filter(function (m) { return m.xong; }).length, v.moc.length, 'chặng đã qua') + '</div>' +
      '<p class="say">' + v.moc.map(function (m) {
        return (m.xong ? '✓ ' : '· ') + e(m.ten); }).join(' &nbsp; ') + '</p>'
    : '';

  var dong = (v.dong || []).length
    ? '<h3>Đã xảy ra</h3><div class="dt">' + v.dong.map(function (x) {
        return '<div class="m ta"><div class="h"><b>' + e(x.tieuDe) + '</b>' +
          '<time>' + e(api.gioVi(x.luc)) + '</time>' +
          '<span class="ai">' + e(api.ngayVi(x.luc)) + (x.boi && x.boi.ten ? ' · ' + e(x.boi.ten) : '') + '</span></div>' +
          (x.noiDung ? '<p>' + e(x.noiDung) + '</p>' : '') + '</div>';
      }).join('') + '</div>'
    : '';

  c.nganTruot(
    '<h2>' + e(v.tieuDe) + '</h2>' +
    '<p class="say">' + e(v.dichVuTen + ' · mã ' + v.id + ' · ' + ai(c, v) + ' phụ trách') + '</p>' +
    (v.canBan
      ? '<div class="tomtat" style="margin:14px 0"><b>Haustek đang chờ bạn: ' + e(v.canBan.viec) + '</b>' +
        (v.canBan.han ? '<br>Mong nhận trước ' + e(api.ngayVi(v.canBan.han)) + '.' : '') + '</div>'
      : '<div class="tomtat" style="margin:14px 0">' + e(cauViec(api, v, c)) + '</div>') +
    (v.tomTat ? '<p style="font-size:13.5px;line-height:1.6">' + e(v.tomTat) + '</p>' : '') +
    moc + dong +
    '<div class="soan" style="position:static;margin-top:18px;border-radius:var(--r);border:1px solid var(--line)">' +
      '<label class="fld">Nhắn cho Haustek</label>' +
      '<textarea class="in" data-tra-loi rows="3" placeholder="Bạn hỏi hoặc gửi thêm thông tin ở đây."></textarea>' +
      '<div class="ft"><span class="hint">' + e(ph.nguoiPhuTrach ? ph.nguoiPhuTrach.ten + ' sẽ đọc và trả lời bạn.' : 'Haustek sẽ đọc và trả lời bạn.') + '</span>' +
      '<button type="button" class="btn pri" data-gui-tl="' + e(v.id) + '">Gửi</button></div></div>',
    { ten: 'Việc của bạn', khiMo: function (dr) {
      HM.bam(dr, '[data-gui-tl]', function (el) {
        var o = dr.querySelector('[data-tra-loi]'), chu = o ? o.value.trim() : '';
        if (!chu) { c.thongBao('Bạn viết vài chữ rồi gửi nhé.', 'warn'); return; }
        try {
          api.traLoi(ph.doiTacId, el.getAttribute('data-gui-tl'), chu, ph.nguoiDungId);
          c.thongBao('Đã gửi cho Haustek.', 'ok');
          c.dongNgan(); c.veLai();
        } catch (err) { c.thongBao('Chưa gửi được. Bạn thử lại giúp, hoặc gọi thẳng người phụ trách.', 'warn'); }
      });
    } });
}

function guiYeuCau(c) {
  var api = c.api, ph = c.phien;
  var dv = api.dichVu().filter(function (x) { return ph.dichVu.indexOf(x.id) >= 0; });
  if (!dv.length) dv = api.dichVu();
  HM.hoiForm(c, {
    tieuDe: 'Gửi yêu cầu mới',
    moTa: 'Haustek nhận và trả lời theo cam kết của từng mảng dịch vụ.',
    fields: [
      { k: 'dichVu', l: 'Việc thuộc mảng nào', kieu: 'select', opts: dv.map(function (x) { return [x.id, x.vi]; }), rong: true },
      { k: 'tieuDe', l: 'Tóm tắt trong một dòng', req: true, rong: true, ph: 'Ví dụ: Đặt lịch quay MV cho single tháng 11' },
      { k: 'noiDung', l: 'Mô tả', kieu: 'textarea', rows: 5, req: true, rong: true,
        ph: 'Bạn cần gì, mong xong khi nào, có ràng buộc gì.' }
    ]
  }).then(function (f) {
    if (!f) return;
    try {
      var kq = api.guiYeuCau(ph.doiTacId, f);
      /* Câu biên nhận lấy nguyên văn từ lõi. Đây là lời hứa của công ty,
         nên nó chỉ được có một bản, và bản đó không nằm trong tệp này. */
      c.hoiThoai({ tieuDe: 'Haustek đã nhận yêu cầu của bạn',
        moTa: HM.esc(kq.bienNhan),
        than: '<p class="say">Mã yêu cầu: <b>' + e(kq.id) + '</b>. Bạn dùng mã này khi hỏi lại cho nhanh.</p>',
        dong: 'Đã hiểu' }).then(function () { c.veLai(); });
    } catch (err) { c.thongBao('Chưa gửi được yêu cầu. Bạn thử lại, hoặc gọi thẳng người phụ trách.', 'warn'); }
  });
}

HT.dangKy({
  id: 'k-viec', nav: 'Việc của tôi', icon: 'list',
  chu: { vi: { nav: 'Việc của tôi' } },
  dem: function (c) {
    try {
      var n = c.api.viec(c.phien.doiTacId).filter(function (v) { return v.canBan; }).length;
      return { n: n, muc: 'thuong' };
    } catch (e) { return null; }
  },
  ve: function (root, c) {
    var api = c.api, ph = c.phien;
    var tatCa = api.viec(ph.doiTacId);
    var chip = c.loc.chip || 'dang-lam';
    var ds = locViec(tatCa, chip);

    if (c.loc.id) {
      var v = tatCa.filter(function (x) { return x.id === c.loc.id; })[0];
      if (v) setTimeout(function () { veChiTiet(c, v); }, 0);
    }

    var dem = {};
    CHIP.forEach(function (x) { dem[x.k] = locViec(tatCa, x.k).length; });

    root.innerHTML = HM.dau({
      h1: 'Việc của tôi',
      mo: 'Mọi việc Haustek đang làm cho bạn, ở mọi mảng dịch vụ.',
      nut: '<button type="button" class="btn pri" data-yc>Gửi yêu cầu mới</button>'
    }) +
      HM.tabs(CHIP.map(function (x) { return { k: x.k, l: x.l, dem: dem[x.k] }; }), chip) +
      HM.the({ thoBody: true, than: ds.length
        ? '<div class="hang">' + ds.map(function (v) {
            return '<div class="d' + (v.canBan ? ' tre' : '') + '">' +
              '<div class="c"><b>' + e(v.tieuDe) + '</b>' +
              '<span class="khi">' + e(cauViec(api, v, c)) + '</span>' +
              '<span class="khi">' + e(v.dichVuTen + ' · ' + ai(c, v) + ' phụ trách') + '</span></div>' +
              '<div class="btnrow"><button type="button" class="btn' + (v.canBan ? ' pri' : '') + ' sm" data-xem="' + e(v.id) + '">' +
                (v.canBan ? 'Xem việc cần bạn' : 'Xem') + '</button></div></div>';
          }).join('') + '</div>'
        : (chip === 'cho-ban'
            ? HM.trong({ xong: true, tieuDe: 'Không có gì cần bạn lúc này.',
                moTa: 'Haustek sẽ nhắn khi cần bạn gửi hoặc duyệt gì đó.',
                diem: [{ n: dem['xong'], l: 'việc đã xong' }, { n: dem['dang-lam'], l: 'việc đang chạy' }]
                  .filter(function (x) { return x.n > 0; }) })
            : HM.trong({ tieuDe: 'Chưa có việc nào ở mục này',
                moTa: 'Việc Haustek nhận cho bạn sẽ hiện ở đây, kèm bước tiếp theo và ngày dự kiến.',
                nut: '<button type="button" class="btn pri" data-yc>Gửi yêu cầu mới</button>' }))
      });

    HM.bam(root, '[data-tab]', function (el) { c.datLoc({ chip: el.getAttribute('data-tab'), id: '' }); });
    HM.bam(root, '[data-xem]', function (el) {
      var v = tatCa.filter(function (x) { return x.id === el.getAttribute('data-xem'); })[0];
      if (v) veChiTiet(c, v);
    });
    HM.bam(root, '[data-yc]', function () { guiYeuCau(c); });
  }
});

})();
