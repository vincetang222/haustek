/* =====================================================================
   HAUSTEK PORTAL v2 — HỒ SƠ PHÁT HÀNH DÙNG CHUNG HAI CỔNG  (HHS)
   ---------------------------------------------------------------------
   Form bốn bước theo form metadata ở trang chủ: Bản phát hành · Track ·
   Liên hệ · Xem lại & gửi. Cùng một form cho đối tác tự gửi (khach.html)
   và nhân viên tạo thay (intranet.html); khác nhau ở hàm gửi và hàm kiểm.
   Nguyên tắc (form-cro): mỗi bước một chủ đề, dễ trước khó sau, trường
   không bắt buộc ghi rõ "không bắt buộc" thay vì rải dấu *, kiểm khi rời
   ô chứ không khi đang gõ, lỗi nói rõ sai gì và sửa thế nào, nháp tự lưu
   trong trình duyệt để đóng rồi mở lại không mất.
   HHS.mo(opts)        mở form
   HHS.bangKiem(kiem)  bảng kiểm hồ sơ (ngăn chi tiết hai cổng)
   HHS.chiTiet(r)      các trường của hồ sơ để hiện trong ngăn
   ===================================================================== */
"use strict";
(function (global) {

var CHU = {
  vi: {
    tieuDe: 'Hồ sơ phát hành', tieuDeHo: 'Tạo hồ sơ thay đối tác', buoc: 'Bước {a}/{b}',
    b1: 'Bản phát hành', b2: 'Track', b3: 'Liên hệ', b4: 'Xem lại & gửi',
    tiep: 'Tiếp tục', lui: 'Quay lại', gui: 'Gửi hồ sơ phát hành', guiHo: 'Tạo hồ sơ', luuDong: 'Lưu nháp và đóng', boNhap: 'Bỏ bản nháp',
    daLuu: 'Đã lưu nháp lúc {t}', coNhap: 'Bạn có hồ sơ dở dang: {t}. Tiếp tục hay bỏ?', tiepNhap: 'Tiếp tục bản nháp',
    kbb: 'không bắt buộc', themTt: 'Thông tin thêm', loiTom: 'Còn {n} chỗ cần sửa ở bước này',
    ns: 'Nghệ sĩ chính', ten: 'Tên bản phát hành', tenHint: 'Viết đúng như bạn muốn hiện trên Spotify, Apple Music.', pb: 'Phiên bản', pbHint: 'Deluxe, Live, Remastered… bỏ trống nếu là bản gốc.',
    loai: 'Loại', single: 'Single (1–3 track)', ep: 'EP (4–6 track)', album: 'Album (7 track trở lên)',
    nhan: 'Nhãn phát hành', nhanHint: 'Tên hiện ở dòng "℗" trên nền tảng. Không có nhãn riêng thì để Haustek.',
    feat: 'Nghệ sĩ khách mời (feat.)', featHint: 'Nhiều người thì cách nhau bằng dấu phẩy.',
    spotify: 'Link Spotify của nghệ sĩ', spotifyHint: 'Thiếu link này, nhạc dễ bị đẩy nhầm sang hồ sơ trùng tên.', apple: 'Link Apple Music của nghệ sĩ',
    tl: 'Thể loại', tl2: 'Thể loại phụ', nn: 'Ngôn ngữ metadata', ngay: 'Ngày phát hành mong muốn', ngayHint: 'Nên cách hôm nay ít nhất 3 tuần để nền tảng kịp xếp lịch và pitch playlist.',
    gio: 'Giờ phát hành', presave: 'Ngày mở pre-save', upc: 'UPC / EAN', upcHint: 'Chưa có thì Haustek cấp.', catalog: 'Số catalog', nam: 'Năm sản xuất',
    pLine: 'Dòng ℗ (bản thu)', cLine: 'Dòng © (tác phẩm, bìa)', lineHint: 'Năm + chủ sở hữu, ví dụ: 2026 Haustek.',
    taiPh: 'Đây là bản phát hành lại', ngayGoc: 'Ngày phát hành gốc', lanhTho: 'Lãnh thổ', toanCau: 'Toàn cầu', loaiTru: 'Toàn cầu, trừ một số nước', lanhThoGhi: 'Nước loại trừ',
    bia: 'Link ảnh bìa', biaHint: 'JPG hoặc PNG vuông 3000×3000, không chữ mờ, không logo nền tảng. Nhớ mở quyền cho bất kỳ ai có link.', biaTk: 'Người thiết kế bìa', ghi: 'Ghi chú cho Haustek',
    trk: 'Track', themTrack: 'Thêm một track', xoa: 'Xoá', nhanBan: 'Nhân bản', chuaTen: 'Track chưa đặt tên',
    trTen: 'Tên track', trPb: 'Phiên bản / bản mix', trPbGoc: 'Bản gốc, không ghi gì thêm', trPbKhac: 'Ghi rõ tên phiên bản', trFeat: 'Khách mời (feat.)', trRemixer: 'Remixer', trRemixerHint: 'Bỏ trống nếu không phải bản remix.',
    wav: 'Link file WAV', wavHint: 'WAV 16 hoặc 24 bit, 44.1 kHz trở lên. Nhớ mở quyền cho bất kỳ ai có link.', nnLoi: 'Ngôn ngữ lời', khongLoi: 'Không lời',
    nhayCam: 'Nội dung nhạy cảm', sach: 'Không, lời sạch', coNc: 'Có, nội dung người lớn', clean: 'Bản đã kiểm duyệt (clean)',
    gSangTac: 'Người sáng tác & tỷ lệ', gCredit: 'Credits', gMa: 'Mã', gKhac: 'Sample, AI, lời, preview',
    tenThat: 'Họ tên thật', vaiTro: 'Vai trò', tiLe: 'Tỉ lệ %', nxb: 'Đơn vị xuất bản / PRO', themNguoi: 'Thêm người sáng tác', tong: 'Tổng', tongThieu: 'Tổng tỉ lệ đang là {p}%, cần đúng 100%. Còn thiếu {c}%.', tongVuot: 'Tổng tỉ lệ đang là {p}%, vượt 100%.',
    producer: 'Nhà sản xuất (producer)', mixing: 'Kỹ sư phối âm (mixing)', mastering: 'Kỹ sư mastering', isrc: 'ISRC', isrcHint: 'Chưa có thì Haustek cấp.',
    sample: 'Bản thu có dùng sample hoặc là bản cover?', sampleNguon: 'Nguồn gốc', sampleHint: 'Tên bài gốc, tác giả gốc, tình trạng xin phép.', ai: 'Mức độ dùng AI', aiHint: 'Nền tảng bắt đầu yêu cầu khai báo này. Khai đúng thì không bị từ chối.',
    preview: 'Giây bắt đầu đoạn preview', previewHint: 'Mốc bắt đầu đoạn hay nhất, dùng cho TikTok và trang xem trước.', loi: 'Lời bài hát', loiHint: 'Dán nguyên lời. Có lời thì Spotify, Apple Music hiện karaoke.',
    lhTen: 'Họ tên người khai', lhVai: 'Bạn là', lhDt: 'Số điện thoại', lhDtHint: 'Số gọi được. Hồ sơ gần như lần nào cũng có một chi tiết cần hỏi lại; một cuộc gọi là xong.', lhEmail: 'Email', lhGio: 'Giờ gọi tiện', lhGioAny: 'Giờ nào cũng được', lhSang: 'Sáng (9h–12h)', lhChieu: 'Chiều (13h–18h)', lhToi: 'Tối (18h–21h)', lhNhan: 'Đừng gọi, nhắn tin thôi',
    lhMxh: 'Facebook hoặc Instagram', lhPhu: 'Người liên hệ dự phòng', lhPhuHint: 'Tên và số của quản lý hoặc người trong nhóm.', lhNvHint: 'Nhân viên tạo thay: người liên hệ là bạn, đối tác thấy tên bạn trên hồ sơ.',
    xemLai: 'Xem lại hồ sơ', sua: 'Sửa', camKet: 'Cam kết bản quyền', camKetHint: 'Bốn cam kết này thay cho chữ ký. Hồ sơ nhân viên tạo thay không cần tick.',
    kiem: 'Bảng kiểm hồ sơ', kiemDiem: 'Đủ {ok}/{tong} mục bắt buộc', kiemThieu: 'Còn thiếu {n} mục bắt buộc', kiemKhuyen: 'Khuyến nghị', kiemDu: 'Đã đủ', kiemMo: 'Thiếu mục bắt buộc vẫn gửi được; Haustek sẽ gọi bạn để bổ sung trước khi giao tới nền tảng.',
    daGui: 'Đã gửi hồ sơ {id}. Haustek tiếp nhận trong 2 ngày làm việc; bạn theo dõi trạng thái ở trang Phát hành.',
    eTen: 'Cần tên bản phát hành.', eNs: 'Chưa chọn nghệ sĩ chính.', eNgay: 'Ngày phát hành chưa hợp lệ.', eTl: 'Chưa chọn thể loại.', eBia: 'Link ảnh bìa phải bắt đầu bằng https://.', eTrTen: 'Track {n} chưa có tên.', eWav: 'Track {n}: link WAV phải bắt đầu bằng https://.',
    eIsrc: 'Track {n}: ISRC phải có 12 ký tự dạng VNHTK2600001.', eTong: 'Track {n}: tổng tỉ lệ sáng tác đang {p}%, không được vượt 100%.', eLh: 'Cần họ tên và số điện thoại hoặc email của người liên hệ.', eCam: 'Cần tick đủ bốn cam kết để gửi.', eUpc: 'UPC phải có 12–13 chữ số.',
    soTrack: '{n} track', chuaCo: 'chưa có'
  },
  en: {
    tieuDe: 'Release submission', tieuDeHo: 'Create a release for a partner', buoc: 'Step {a} of {b}',
    b1: 'Release', b2: 'Tracks', b3: 'Contact', b4: 'Review & send',
    tiep: 'Continue', lui: 'Back', gui: 'Send release submission', guiHo: 'Create file', luuDong: 'Save draft and close', boNhap: 'Discard draft',
    daLuu: 'Draft saved at {t}', coNhap: 'You have an unfinished submission: {t}. Continue or discard?', tiepNhap: 'Continue draft',
    kbb: 'optional', themTt: 'More details', loiTom: '{n} things to fix on this step',
    ns: 'Primary artist', ten: 'Release title', tenHint: 'Exactly as it should appear on Spotify and Apple Music.', pb: 'Version', pbHint: 'Deluxe, Live, Remastered… leave empty for the original.',
    loai: 'Type', single: 'Single (1–3 tracks)', ep: 'EP (4–6 tracks)', album: 'Album (7+ tracks)',
    nhan: 'Release label', nhanHint: 'Shown on the ℗ line. Use Haustek if you have no label of your own.',
    feat: 'Featured artists', featHint: 'Separate several names with commas.',
    spotify: 'Artist Spotify link', spotifyHint: 'Without it the release may be mapped to a namesake profile.', apple: 'Artist Apple Music link',
    tl: 'Genre', tl2: 'Secondary genre', nn: 'Metadata language', ngay: 'Requested release date', ngayHint: 'At least 3 weeks out so stores can schedule and pitch playlists.',
    gio: 'Release hour', presave: 'Pre-save date', upc: 'UPC / EAN', upcHint: 'Haustek assigns one if empty.', catalog: 'Catalogue number', nam: 'Production year',
    pLine: '℗ line (recording)', cLine: '© line (composition, artwork)', lineHint: 'Year + owner, e.g. 2026 Haustek.',
    taiPh: 'This is a re-release', ngayGoc: 'Original release date', lanhTho: 'Territory', toanCau: 'Worldwide', loaiTru: 'Worldwide except some countries', lanhThoGhi: 'Excluded countries',
    bia: 'Artwork link', biaHint: 'Square JPG or PNG 3000×3000, no blurry text, no store logos. Allow access to anyone with the link.', biaTk: 'Artwork designer', ghi: 'Note for Haustek',
    trk: 'Track', themTrack: 'Add another track', xoa: 'Remove', nhanBan: 'Duplicate', chuaTen: 'Untitled track',
    trTen: 'Track title', trPb: 'Version / mix', trPbGoc: 'Original, nothing to add', trPbKhac: 'Specify the version name', trFeat: 'Featured (feat.)', trRemixer: 'Remixer', trRemixerHint: 'Leave empty if this is not a remix.',
    wav: 'WAV file link', wavHint: 'WAV 16 or 24 bit, 44.1 kHz or higher. Allow access to anyone with the link.', nnLoi: 'Lyrics language', khongLoi: 'Instrumental',
    nhayCam: 'Explicit content', sach: 'No, clean lyrics', coNc: 'Yes, explicit', clean: 'Cleaned version',
    gSangTac: 'Writers & splits', gCredit: 'Credits', gMa: 'Codes', gKhac: 'Sample, AI, lyrics, preview',
    tenThat: 'Legal name', vaiTro: 'Role', tiLe: 'Split %', nxb: 'Publisher / PRO', themNguoi: 'Add a writer', tong: 'Total', tongThieu: 'Splits total {p}%; they must total 100%. {c}% unassigned.', tongVuot: 'Splits total {p}%, above 100%.',
    producer: 'Producer', mixing: 'Mixing engineer', mastering: 'Mastering engineer', isrc: 'ISRC', isrcHint: 'Haustek assigns one if empty.',
    sample: 'Does this recording use a sample, or is it a cover?', sampleNguon: 'Source', sampleHint: 'Original title, original writer, clearance status.', ai: 'Level of AI use', aiHint: 'Platforms are starting to require this. Accurate disclosure is what matters.',
    preview: 'Preview start (seconds)', previewHint: 'Where the strongest part starts, used for TikTok and preview players.', loi: 'Lyrics', loiHint: 'Paste the full lyrics. Spotify and Apple Music show them in sync.',
    lhTen: 'Your full name', lhVai: 'You are', lhDt: 'Phone number', lhDtHint: 'A number we can actually call. Almost every file has one detail to check; one call settles it.', lhEmail: 'Email', lhGio: 'Best time to call', lhGioAny: 'Any time', lhSang: 'Morning (9–12)', lhChieu: 'Afternoon (1–6pm)', lhToi: 'Evening (6–9pm)', lhNhan: 'Do not call, message only',
    lhMxh: 'Facebook or Instagram', lhPhu: 'Backup contact', lhPhuHint: 'Name and number of your manager or a bandmate.', lhNvHint: 'Created by staff: you are the contact; the partner sees your name on the file.',
    xemLai: 'Review', sua: 'Edit', camKet: 'Rights commitments', camKetHint: 'These four commitments stand in for a signature. Files created by staff do not need them.',
    kiem: 'Submission checklist', kiemDiem: '{ok}/{tong} required items complete', kiemThieu: '{n} required items missing', kiemKhuyen: 'Recommended', kiemDu: 'Complete', kiemMo: 'You can still send with missing items; Haustek will call you to complete them before delivery.',
    daGui: 'Submission {id} sent. Haustek takes it in within 2 business days; follow the status on the Releases page.',
    eTen: 'Enter the release title.', eNs: 'Choose the primary artist.', eNgay: 'Release date is not valid.', eTl: 'Choose a genre.', eBia: 'Artwork link must start with https://.', eTrTen: 'Track {n} has no title.', eWav: 'Track {n}: WAV link must start with https://.',
    eIsrc: 'Track {n}: ISRC must be 12 characters like VNHTK2600001.', eTong: 'Track {n}: writer splits total {p}%, cannot exceed 100%.', eLh: 'Enter a contact name and a phone number or email.', eCam: 'Tick all four commitments to send.', eUpc: 'UPC must have 12–13 digits.',
    soTrack: '{n} tracks', chuaCo: 'none'
  }
};
function T(k, o) { var l = (global.HT && HT.lang) || 'vi'; var s = (CHU[l] && CHU[l][k]) || CHU.vi[k] || k; if (o) Object.keys(o).forEach(function (x) { s = s.split('{' + x + '}').join(o[x]); }); return s; }
var esc = function (s) { return HM.esc(s == null ? '' : String(s)); };
var lang = function () { return (global.HT && HT.lang) || 'vi'; };
var url = function (v) { return /^https?:\/\/\S+$/i.test(v || ''); };

/* ---- dữ liệu mẫu và trường ---- */
function trackMoi(tenNs) {
  return { title: '', version: '', versionOther: '', feat: '', remixer: '', isrc: '', lyricsLang: 'vi', explicit: 'no', audioUrl: '', previewStart: '', lyrics: '',
    producer: '', mixing: '', mastering: '', sampleKind: 'none', sampleSource: '', ai: '0', writers: [{ name: tenNs || '', role: 'ComposerLyricist', pct: 100, publisher: '' }] };
}
function duLieuMoi(o) {
  var nam = String(new Date().getFullYear());
  var ns = o.ns && o.ns[0];
  var ngay = new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10);
  return { artistId: ns ? String(ns.id) : '', title: '', version: '', type: 'single', label: o.nhan || 'Haustek', feats: '', spotify: '', apple: '',
    genre: '', genre2: '', lang: 'vi', releaseDate: ngay, releaseHour: '', presaveDate: '', upc: '', catalogNo: '', prodYear: nam, reissue: false, origDate: '',
    territory: 'worldwide', territoryNote: '', pLine: nam + ' ' + (o.nhan || 'Haustek'), cLine: nam + ' ' + (o.nhan || 'Haustek'), artwork: '', artworkDesigner: '', note: '',
    tracks: [trackMoi(ns ? ns.name : '')],
    contact: { name: o.lienHe && o.lienHe.name || '', role: o.staff ? 'staff' : 'artist', phone: o.lienHe && o.lienHe.phone || '', email: o.lienHe && o.lienHe.email || '', when: 'any', social: '', backup: '' },
    cam: { rights: false, samples: false, splits: false, artwork: false } };
}
function goi(d, o) {
  var ns = (o.ns || []).filter(function (a) { return String(a.id) === String(d.artistId); })[0];
  return { artistId: d.artistId, title: d.title, version: d.version, type: d.type, label: d.label, artists: [ns ? ns.name : ''], feats: d.feats, links: { spotify: d.spotify, apple: d.apple },
    genre: d.genre, genre2: d.genre2, lang: d.lang, releaseDate: d.releaseDate, releaseHour: d.releaseHour, presaveDate: d.presaveDate, upc: d.upc, catalogNo: d.catalogNo, prodYear: d.prodYear,
    reissue: d.reissue, origDate: d.origDate, territory: d.territory, territoryNote: d.territoryNote, pLine: d.pLine, cLine: d.cLine, artwork: d.artwork, artworkDesigner: d.artworkDesigner, note: d.note,
    tracks: d.tracks.map(function (t) { return Object.assign({}, t, { version: t.version === 'Khác' ? t.versionOther : t.version, writers: t.writers.map(function (w) { return { name: w.name, role: w.role, pct: +w.pct || 0, publisher: w.publisher }; }) }); }),
    contact: d.contact, commitments: d.cam };
}

/* ---- ô nhập ---- */
function o(nhan, than, hint, opt) {
  /* chú thích vào dấu ? cạnh nhãn: biểu mẫu này hơn ba mươi ô */
  return '<div class="fgrp">' + '<label class="fld">' + esc(nhan) + (opt ? ' <span class="kbb">(' + esc(T('kbb')) + ')</span>' : '') + HM.hoi(hint) + '</label>' + than + '</div>';
}
var attr = function (f, extra) { return ' data-f="' + esc(f) + '"' + (extra || ''); };
function chu(f, v, ph, extra) { return '<input class="in"' + attr(f, extra) + ' value="' + esc(v) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>'; }
function chon(f, v, ds) { return '<select class="in"' + attr(f) + '>' + ds.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(v) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select>'; }
function vung(f, v, rows, ph) { return '<textarea class="in"' + attr(f) + ' rows="' + (rows || 3) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>' + esc(v) + '</textarea>'; }
function tick(f, v, nhan) { return '<label class="tickrow"><input type="checkbox"' + attr(f) + (v ? ' checked' : '') + '><span>' + esc(nhan) + '</span></label>'; }
function radio(f, v, ds) { return '<div class="radios">' + ds.map(function (x) { return '<label class="tickrow"><input type="radio" name="' + esc(f) + '"' + attr(f) + ' value="' + esc(x[0]) + '"' + (String(x[0]) === String(v) ? ' checked' : '') + '><span>' + esc(x[1]) + '</span></label>'; }).join('') + '</div>'; }
function ds3(list) { var l = lang(); return list.map(function (x) { return [x[0], l === 'en' ? x[2] : x[1]]; }); }

/* ---- bước 1 ---- */
function veBuoc1(d, o2) {
  var F = o2.fields, l = lang();
  var nsHtml = o2.ns.length > 1 ? o(T('ns'), chon('artistId', d.artistId, o2.ns.map(function (a) { return [a.id, a.name + ' · ' + (a.clientId || '')]; }))) :
    o(T('ns'), '<div class="in ro">' + esc(o2.ns[0] ? o2.ns[0].name : '') + '</div>');
  var tl = ['', l === 'en' ? 'Choose a genre' : 'Chọn thể loại'];
  return '<div class="fldrow two-up">' +
    nsHtml +
    o(T('loai'), chon('type', d.type, [['single', T('single')], ['ep', T('ep')], ['album', T('album')]])) +
    o(T('ten'), chu('title', d.title), T('tenHint')) +
    o(T('pb'), chu('version', d.version, 'Deluxe / Live / Remastered'), T('pbHint'), true) +
    o(T('nhan'), chu('label', d.label), T('nhanHint')) +
    o(T('feat'), chu('feats', d.feats), T('featHint'), true) +
    o(T('spotify'), chu('spotify', d.spotify, 'https://open.spotify.com/artist/…'), T('spotifyHint'), true) +
    o(T('apple'), chu('apple', d.apple, 'https://music.apple.com/…'), null, true) +
    o(T('tl'), chon('genre', d.genre, [tl].concat(F.genres.map(function (g) { return [g, g]; })))) +
    o(T('nn'), chon('lang', d.lang, ds3(F.langs))) +
    o(T('ngay'), chu('releaseDate', d.releaseDate, '', ' type="date"'), T('ngayHint')) +
    o(T('bia'), chu('artwork', d.artwork, 'https://drive.google.com/…', ' type="url"'), T('biaHint')) +
    o(T('pLine'), chu('pLine', d.pLine), T('lineHint')) +
    o(T('cLine'), chu('cLine', d.cLine)) +
    '</div>' +
    '<details class="hoc fmore"' + (d.upc || d.catalogNo || d.presaveDate || d.reissue || d.territory !== 'worldwide' || d.genre2 || d.note ? ' open' : '') + '><summary>' + esc(T('themTt')) + '</summary><div class="fldrow two-up">' +
    o(T('upc'), chu('upc', d.upc, '', ' inputmode="numeric"'), T('upcHint'), true) +
    o(T('catalog'), chu('catalogNo', d.catalogNo), null, true) +
    o(T('nam'), chu('prodYear', d.prodYear, '', ' inputmode="numeric" maxlength="4"')) +
    o(T('tl2'), chon('genre2', d.genre2, [['', '—']].concat(F.genres.map(function (g) { return [g, g]; }))), null, true) +
    o(T('presave'), chu('presaveDate', d.presaveDate, '', ' type="date"'), null, true) +
    o(T('gio'), chu('releaseHour', d.releaseHour, '', ' type="time"'), null, true) +
    o(T('lanhTho'), chon('territory', d.territory, [['worldwide', T('toanCau')], ['exclude', T('loaiTru')]])) +
    (d.territory === 'exclude' ? o(T('lanhThoGhi'), chu('territoryNote', d.territoryNote, 'CN, KR')) : '') +
    '<div class="fgrp">' + tick('reissue', d.reissue, T('taiPh')) + '</div>' +
    (d.reissue ? o(T('ngayGoc'), chu('origDate', d.origDate, '', ' type="date"')) : '') +
    o(T('biaTk'), chu('artworkDesigner', d.artworkDesigner), null, true) +
    o(T('ghi'), chu('note', d.note), null, true) +
    '</div></details>';
}

/* ---- bước 2 ---- */
function tongTiLe(t) { return Math.round(t.writers.reduce(function (s, w) { return s + (+w.pct || 0); }, 0) * 10) / 10; }
function veTrack(t, i, d, o2) {
  var F = o2.fields, l = lang(), p = 'tracks.' + i + '.', tong = tongTiLe(t);
  var tongCls = Math.abs(tong - 100) < 0.01 ? 'ok' : tong > 100 ? 'no' : 'warn';
  var pbDs = [['', T('trPbGoc')]].concat(F.versions.slice(1).map(function (v) { return [v, v === 'Khác' ? (l === 'en' ? 'Other, specify below' : 'Khác, ghi rõ ở ô bên dưới') : v]; }));
  return '<div class="trk" data-trk="' + i + '"><div class="trk-h"><b>' + esc(T('trk')) + ' ' + (i + 1) + '</b><span class="muted">' + esc(t.title || T('chuaTen')) + '</span><span class="sp"></span>' +
    '<button type="button" class="btn sm ghost" data-hs-nhanban="' + i + '">' + esc(T('nhanBan')) + '</button>' + (d.tracks.length > 1 ? '<button type="button" class="btn sm ghost" data-hs-xoatrack="' + i + '">' + esc(T('xoa')) + '</button>' : '') + '</div>' +
    '<div class="fldrow two-up">' +
    o(T('trTen'), chu(p + 'title', t.title)) +
    o(T('trPb'), chon(p + 'version', t.version, pbDs), null, true) +
    (t.version === 'Khác' ? o(T('trPbKhac'), chu(p + 'versionOther', t.versionOther, 'Lo-fi Version, Piano Version…')) : '') +
    o(T('trFeat'), chu(p + 'feat', t.feat), null, true) +
    o(T('trRemixer'), chu(p + 'remixer', t.remixer), T('trRemixerHint'), true) +
    o(T('wav'), chu(p + 'audioUrl', t.audioUrl, 'https://drive.google.com/…', ' type="url"'), T('wavHint')) +
    o(T('nnLoi'), chon(p + 'lyricsLang', t.lyricsLang, ds3(F.langs))) +
    o(T('nhayCam'), radio(p + 'explicit', t.explicit, [['no', T('sach')], ['yes', T('coNc')], ['clean', T('clean')]])) +
    '</div>' +
    '<details class="hoc" open><summary>' + esc(T('gSangTac')) + ' <span class="cnt ' + tongCls + '">' + t.writers.length + ' · ' + tong + '%</span></summary><div>' +
    t.writers.map(function (w, j) {
      var q = p + 'writers.' + j + '.';
      return '<div class="wrow"><input class="in"' + attr(q + 'name') + ' value="' + esc(w.name) + '" placeholder="' + esc(T('tenThat')) + '">' +
        chon(q + 'role', w.role, ds3(F.writerRoles)) +
        '<input class="in" type="number" min="0" max="100" step="0.1" inputmode="decimal"' + attr(q + 'pct') + ' value="' + esc(w.pct) + '">' +
        '<input class="in"' + attr(q + 'publisher') + ' value="' + esc(w.publisher) + '" placeholder="' + esc(T('nxb')) + '">' +
        '<button type="button" class="x" data-hs-xoaw="' + i + ':' + j + '" aria-label="' + esc(T('xoa')) + '">' + HM.icon('x') + '</button></div>';
    }).join('') +
    '<div class="wrow-f"><button type="button" class="btn sm ghost" data-hs-themw="' + i + '">' + esc(T('themNguoi')) + '</button>' +
    (tongCls === 'ok' ? '<span class="fhint ok">' + esc(T('tong')) + ' 100%</span>' : '<span class="fhint ' + tongCls + '">' + esc(tong > 100 ? T('tongVuot', { p: tong }) : T('tongThieu', { p: tong, c: Math.round((100 - tong) * 10) / 10 })) + '</span>') + '</div>' +
    '</div></details>' +
    '<details class="hoc"' + (t.producer || t.mixing || t.mastering ? ' open' : '') + '><summary>' + esc(T('gCredit')) + '</summary><div class="fldrow two-up">' +
    o(T('producer'), chu(p + 'producer', t.producer), null, true) + o(T('mixing'), chu(p + 'mixing', t.mixing), null, true) + o(T('mastering'), chu(p + 'mastering', t.mastering), null, true) +
    '</div></details>' +
    '<details class="hoc"' + (t.isrc ? ' open' : '') + '><summary>' + esc(T('gMa')) + '</summary><div class="fldrow two-up">' + o(T('isrc'), chu(p + 'isrc', t.isrc, 'VNHTK2600001'), T('isrcHint'), true) + '</div></details>' +
    '<details class="hoc"' + (t.sampleKind !== 'none' || t.ai !== '0' || t.lyrics || t.previewStart ? ' open' : '') + '><summary>' + esc(T('gKhac')) + '</summary><div class="fldrow two-up">' +
    o(T('sample'), chon(p + 'sampleKind', t.sampleKind, ds3(F.sampleKinds))) +
    (t.sampleKind !== 'none' ? o(T('sampleNguon'), chu(p + 'sampleSource', t.sampleSource), T('sampleHint')) : '') +
    o(T('ai'), chon(p + 'ai', t.ai, ds3(F.aiLevels)), T('aiHint')) +
    o(T('preview'), chu(p + 'previewStart', t.previewStart, '45', ' type="number" min="0" inputmode="numeric"'), T('previewHint'), true) +
    '</div>' + o(T('loi'), vung(p + 'lyrics', t.lyrics, 5), T('loiHint'), true) + '</details>' +
    '</div>';
}
function veBuoc2(d, o2) {
  return d.tracks.map(function (t, i) { return veTrack(t, i, d, o2); }).join('') +
    '<div class="btnrow" style="margin-top:12px"><button type="button" class="btn" data-hs-themtrack>' + HM.icon('up') + esc(T('themTrack')) + '</button></div>';
}

/* ---- bước 3 ---- */
function veBuoc3(d, o2) {
  var F = o2.fields, c = d.contact;
  return (o2.staff ? '<p class="say">' + esc(T('lhNvHint')) + '</p>' : '') + '<div class="fldrow two-up">' +
    o(T('lhTen'), chu('contact.name', c.name)) +
    o(T('lhVai'), chon('contact.role', c.role, ds3(F.contactRoles))) +
    o(T('lhDt'), chu('contact.phone', c.phone, '09xx xxx xxx', ' type="tel" inputmode="tel"'), T('lhDtHint'), !!o2.staff) +
    o(T('lhEmail'), chu('contact.email', c.email, '', ' type="email" inputmode="email"')) +
    o(T('lhGio'), chon('contact.when', c.when, [['any', T('lhGioAny')], ['morning', T('lhSang')], ['afternoon', T('lhChieu')], ['evening', T('lhToi')], ['message', T('lhNhan')]]), null, true) +
    o(T('lhMxh'), chu('contact.social', c.social, 'facebook.com/… hoặc @tenban'), null, true) +
    '</div>' + o(T('lhPhu'), chu('contact.backup', c.backup), T('lhPhuHint'), true);
}

/* ---- bước 4 ---- */
function bangKiem(kiem, opts) {
  var l = lang(), gon = opts && opts.gon;
  if (!kiem || !kiem.muc) return '';
  var thieuBb = kiem.muc.filter(function (m) { return m.bat && !m.ok; }), thieuKn = kiem.muc.filter(function (m) { return !m.bat && !m.ok; });
  var mot = function (m) { return '<li>' + (m.track ? '<span class="mono muted">' + esc(m.track) + '</span> ' : '') + esc(l === 'en' ? m.en : m.vi) + '</li>'; };
  return '<div class="kiem"><div class="kiem-h"><b>' + esc(T('kiem')) + '</b><span class="tag ' + (thieuBb.length ? 'warn' : 'ok') + '">' + esc(thieuBb.length ? T('kiemThieu', { n: thieuBb.length }) : T('kiemDiem', { ok: kiem.batBuoc, tong: kiem.batBuoc })) + '</span></div>' +
    '<div class="kiem-bar"><i style="width:' + kiem.diem + '%"></i></div>' +
    (thieuBb.length ? '<ul class="kiem-thieu">' + thieuBb.map(mot).join('') + '</ul>' : '') +
    (thieuKn.length && !gon ? '<div class="kiem-kn"><b>' + esc(T('kiemKhuyen')) + '</b><ul>' + thieuKn.map(mot).join('') + '</ul></div>' : '') +
    (!gon ? '<div class="fhint">' + esc(T('kiemMo')) + '</div>' : '') + '</div>';
}
function veBuoc4(d, o2, kq) {
  var l = lang(), F = o2.fields;
  var ns = (o2.ns || []).filter(function (a) { return String(a.id) === String(d.artistId); })[0];
  var dong = function (k, v) { return v ? '<dl class="kv"><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></dl>' : ''; };
  var tom = '<div class="rv"><div class="rv-h"><b>' + esc(T('b1')) + '</b><button type="button" class="btn sm ghost" data-hs-den="0">' + esc(T('sua')) + '</button></div>' +
    dong(T('ten'), d.title + (d.version ? ' (' + d.version + ')' : '')) + dong(T('ns'), ns ? ns.name : '') + dong(T('loai'), { single: 'Single', ep: 'EP', album: 'Album' }[d.type]) + dong(T('nhan'), d.label) + dong(T('tl'), d.genre + (d.genre2 ? ' · ' + d.genre2 : '')) +
    dong(T('ngay'), HT.fmt.ngay ? HT.fmt.ngay(d.releaseDate) : d.releaseDate) + dong('℗ / ©', d.pLine + ' · ' + d.cLine) + dong(T('bia'), d.artwork || T('chuaCo')) + '</div>' +
    '<div class="rv"><div class="rv-h"><b>' + esc(T('b2')) + ' · ' + esc(T('soTrack', { n: d.tracks.length })) + '</b><button type="button" class="btn sm ghost" data-hs-den="1">' + esc(T('sua')) + '</button></div>' +
    '<ol class="rv-tracks">' + d.tracks.map(function (t) { return '<li><b>' + esc(t.title || T('chuaTen')) + '</b>' + (t.version ? ' <span class="muted">' + esc(t.version === 'Khác' ? t.versionOther : t.version) + '</span>' : '') + '<div class="fhint">' + esc(t.writers.map(function (w) { return w.name + ' ' + w.pct + '%'; }).join(' · ')) + (t.audioUrl ? '' : ' · ' + T('wav') + ': ' + T('chuaCo')) + '</div></li>'; }).join('') + '</ol></div>' +
    '<div class="rv"><div class="rv-h"><b>' + esc(T('b3')) + '</b><button type="button" class="btn sm ghost" data-hs-den="2">' + esc(T('sua')) + '</button></div>' + dong(T('lhTen'), d.contact.name) + dong(T('lhDt'), d.contact.phone) + dong(T('lhEmail'), d.contact.email) + '</div>';
  var kiemHtml = kq ? (kq.ok ? bangKiem(kq.kiem) : '<div class="err-sum">' + esc(kq.loi) + '</div>') : '';
  var cam = o2.staff ? '' : '<div class="rv"><div class="rv-h"><b>' + esc(T('camKet')) + '</b></div><div class="fhint" style="margin-bottom:8px">' + esc(T('camKetHint')) + '</div>' +
    F.commitments.map(function (c) { return '<div class="cam">' + tick('cam.' + c.id, d.cam[c.id], l === 'en' ? c.en : c.vi) + '</div>'; }).join('') + '</div>';
  return tom + kiemHtml + cam;
}

/* ---- kiểm từng bước ---- */
function loiBuoc(b, d, o2) {
  var e = [];
  if (b === 0) {
    if (!d.title.trim()) e.push(['title', T('eTen')]);
    if (!d.artistId) e.push(['artistId', T('eNs')]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.releaseDate)) e.push(['releaseDate', T('eNgay')]);
    if (!d.genre) e.push(['genre', T('eTl')]);
    if (d.artwork && !url(d.artwork)) e.push(['artwork', T('eBia')]);
    if (d.upc && !/^\d{12,13}$/.test(d.upc.replace(/\D/g, ''))) e.push(['upc', T('eUpc')]);
  }
  if (b === 1) d.tracks.forEach(function (t, i) {
    var p = 'tracks.' + i + '.';
    if (!t.title.trim()) e.push([p + 'title', T('eTrTen', { n: i + 1 })]);
    if (t.audioUrl && !url(t.audioUrl)) e.push([p + 'audioUrl', T('eWav', { n: i + 1 })]);
    if (t.isrc && !/^[A-Za-z]{2}[A-Za-z0-9]{3}\d{7}$/.test(t.isrc.replace(/[^A-Za-z0-9]/g, ''))) e.push([p + 'isrc', T('eIsrc', { n: i + 1 })]);
    var tong = tongTiLe(t); if (tong > 100.01) e.push([p + 'writers.0.pct', T('eTong', { n: i + 1, p: tong })]);
  });
  if (b === 2 && !o2.staff && !(d.contact.name.trim() && (d.contact.phone.trim() || d.contact.email.trim()))) e.push(['contact.name', T('eLh')]);
  if (b === 2 && o2.staff && !d.contact.name.trim()) e.push(['contact.name', T('eLh')]);
  if (b === 3 && !o2.staff && !(d.cam.rights && d.cam.samples && d.cam.splits && d.cam.artwork)) e.push(['cam.rights', T('eCam')]);
  return e;
}

/* ---- đường dẫn trong dữ liệu ---- */
function dat(d, path, v) { var p = path.split('.'), x = d; for (var i = 0; i < p.length - 1; i++) x = x[p[i]]; x[p[p.length - 1]] = v; }

/* ---- mở form ---- */
function mo(o2) {
  var KHOA = 'haustek.hoso.nhap.' + (o2.khoa || 'x');
  var d = duLieuMoi(o2), buoc = 0, kq = null, loi = [], hen = null, luuLuc = '';
  var nhap = null; try { nhap = JSON.parse(localStorage.getItem(KHOA) || 'null'); } catch (e) { nhap = null; }
  var cu = document.querySelector('.modal-bg'); if (cu) cu.remove();
  var bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = '<div class="modal rong hoso" role="dialog" aria-modal="true">' +
    '<div class="hoso-h"><div><h3>' + esc(o2.tieuDe || T(o2.staff ? 'tieuDeHo' : 'tieuDe')) + (o2.ten ? ' <span class="muted">· ' + esc(o2.ten) + '</span>' : '') + '</h3><div class="hoso-sub" data-hs-sub></div></div>' +
    '<button type="button" class="x" data-hs-dong aria-label="' + esc(T('luuDong')) + '">' + HM.icon('x') + '</button></div>' +
    '<ol class="stepper" data-hs-steps></ol>' +
    (nhap && nhap.d ? '<div class="note info hoso-nhap" data-hs-nhapbar><span>' + esc(T('coNhap', { t: nhap.d.title || T('chuaTen') })) + '</span><span class="sp"></span><button type="button" class="btn sm pri" data-hs-nhap-tiep>' + esc(T('tiepNhap')) + '</button><button type="button" class="btn sm ghost" data-hs-nhap-bo>' + esc(T('boNhap')) + '</button></div>' : '') +
    '<div class="hoso-b" data-hs-body></div>' +
    '<div class="hoso-f"><span class="fhint" data-hs-luu>' + esc(luuLuc) + '</span><span class="sp"></span><button type="button" class="btn ghost" data-hs-luudong>' + esc(T('luuDong')) + '</button><button type="button" class="btn" data-hs-lui>' + esc(T('lui')) + '</button><button type="button" class="btn pri" data-hs-tiep>' + esc(T('tiep')) + '</button></div>' +
    '</div>';
  document.body.appendChild(bg);
  var than = bg.querySelector('[data-hs-body]');
  function dong() { bg.remove(); document.removeEventListener('keydown', phim); }
  function phim(e) { if (e.key === 'Escape') { luu(); dong(); } }
  document.addEventListener('keydown', phim);
  function luu() { try { localStorage.setItem(KHOA, JSON.stringify({ d: d, buoc: buoc, at: Date.now() })); luuLuc = new Date().toTimeString().slice(0, 5); bg.querySelector('[data-hs-luu]').textContent = T('daLuu', { t: luuLuc }); } catch (e) {} }
  function luuTre() { clearTimeout(hen); hen = setTimeout(luu, 600); }
  function ve() {
    var TEN = [T('b1'), T('b2'), T('b3'), T('b4')];
    bg.querySelector('[data-hs-sub]').textContent = T('buoc', { a: buoc + 1, b: 4 }) + ' · ' + TEN[buoc];
    bg.querySelector('[data-hs-steps]').innerHTML = TEN.map(function (n, i) { return '<li class="' + (i === buoc ? 'on' : i < buoc ? 'ok' : '') + '"><button type="button" data-hs-den="' + i + '"' + (i > buoc ? ' disabled' : '') + '><i>' + (i < buoc ? HM.icon('check') : (i + 1)) + '</i><span>' + esc(n) + '</span></button></li>'; }).join('');
    var tom = loi.length ? '<div class="err-sum" role="alert"><b>' + esc(T('loiTom', { n: loi.length })) + '</b><ul>' + loi.map(function (x) { return '<li><a href="#" data-hs-toi="' + esc(x[0]) + '">' + esc(x[1]) + '</a></li>'; }).join('') + '</ul></div>' : '';
    than.innerHTML = tom + (buoc === 0 ? veBuoc1(d, o2) : buoc === 1 ? veBuoc2(d, o2) : buoc === 2 ? veBuoc3(d, o2) : veBuoc4(d, o2, kq));
    loi.forEach(function (x) { var el = than.querySelector('[data-f="' + x[0] + '"]'); if (el) el.classList.add('err'); });
    bg.querySelector('[data-hs-lui]').hidden = buoc === 0;
    bg.querySelector('[data-hs-tiep]').textContent = buoc === 3 ? T(o2.staff ? 'guiHo' : 'gui') : T('tiep');
    than.scrollTop = 0;
  }
  function den(b) {
    if (b > buoc) { loi = loiBuoc(buoc, d, o2); if (loi.length) { ve(); var dau = than.querySelector('.in.err'); if (dau) dau.focus(); return; } }
    loi = []; buoc = b;
    if (buoc === 3) { try { kq = o2.kiem(goi(d, o2)); } catch (e) { kq = { ok: false, loi: e.message }; } }
    luu(); ve();
  }
  bg.addEventListener('input', function (e) {
    var el = e.target, f = el.getAttribute('data-f'); if (!f) return;
    var v = el.type === 'checkbox' ? el.checked : el.value;
    dat(d, f, v); el.classList.remove('err');
    if (f === 'title') { var s = than.querySelector('.rv b'); }
    if (/^tracks\.\d+\.writers\.\d+\.pct$/.test(f) || /^tracks\.\d+\.title$/.test(f)) { var i = +f.split('.')[1]; var card = than.querySelector('[data-trk="' + i + '"]'); if (card) { var cnt = card.querySelector('.cnt'); var t = d.tracks[i], tong = tongTiLe(t); if (cnt) { cnt.textContent = t.writers.length + ' · ' + tong + '%'; cnt.className = 'cnt ' + (Math.abs(tong - 100) < 0.01 ? 'ok' : tong > 100 ? 'no' : 'warn'); } var h = card.querySelector('.trk-h .muted'); if (h) h.textContent = t.title || T('chuaTen'); } }
    luuTre();
  });
  bg.addEventListener('change', function (e) {
    var el = e.target, f = el.getAttribute('data-f'); if (!f) return;
    var v = el.type === 'checkbox' ? el.checked : el.value; dat(d, f, v);
    if (f === 'territory' || f === 'reissue' || /\.version$/.test(f) || /\.sampleKind$/.test(f) || f === 'artistId') {
      if (f === 'artistId') { var ns = (o2.ns || []).filter(function (a) { return String(a.id) === String(v); })[0]; d.tracks.forEach(function (t) { if (t.writers.length === 1 && !t.writers[0].name) t.writers[0].name = ns ? ns.name : ''; }); }
      ve();
    }
    luuTre();
  });
  bg.addEventListener('click', function (e) {
    var b = e.target.closest('button,a'); if (!b) return;
    if (b.hasAttribute('data-hs-dong') || b.hasAttribute('data-hs-luudong')) { luu(); dong(); return; }
    if (b.hasAttribute('data-hs-nhap-tiep')) { d = nhap.d; buoc = Math.min(3, nhap.buoc || 0); if (buoc === 3) buoc = 2; bg.querySelector('[data-hs-nhapbar]').remove(); ve(); return; }
    if (b.hasAttribute('data-hs-nhap-bo')) { try { localStorage.removeItem(KHOA); } catch (err) {} bg.querySelector('[data-hs-nhapbar]').remove(); return; }
    if (b.hasAttribute('data-hs-lui')) { den(buoc - 1); return; }
    if (b.hasAttribute('data-hs-den')) { den(+b.getAttribute('data-hs-den')); return; }
    if (b.hasAttribute('data-hs-toi')) { e.preventDefault(); var el = than.querySelector('[data-f="' + b.getAttribute('data-hs-toi') + '"]'); if (el) { var dt = el.closest('details'); if (dt) dt.open = true; el.focus(); el.scrollIntoView({ block: 'center' }); } return; }
    if (b.hasAttribute('data-hs-themtrack')) { var ns = (o2.ns || []).filter(function (a) { return String(a.id) === String(d.artistId); })[0]; d.tracks.push(trackMoi(ns ? ns.name : '')); ve(); luuTre(); return; }
    if (b.hasAttribute('data-hs-xoatrack')) { d.tracks.splice(+b.getAttribute('data-hs-xoatrack'), 1); ve(); luuTre(); return; }
    if (b.hasAttribute('data-hs-nhanban')) { var i = +b.getAttribute('data-hs-nhanban'); d.tracks.splice(i + 1, 0, JSON.parse(JSON.stringify(Object.assign({}, d.tracks[i], { title: '', isrc: '', audioUrl: '', lyrics: '' })))); ve(); luuTre(); return; }
    if (b.hasAttribute('data-hs-themw')) { d.tracks[+b.getAttribute('data-hs-themw')].writers.push({ name: '', role: 'Composer', pct: 0, publisher: '' }); ve(); luuTre(); return; }
    if (b.hasAttribute('data-hs-xoaw')) { var p = b.getAttribute('data-hs-xoaw').split(':'); if (d.tracks[+p[0]].writers.length > 1) d.tracks[+p[0]].writers.splice(+p[1], 1); ve(); luuTre(); return; }
    if (b.hasAttribute('data-hs-tiep')) {
      if (buoc < 3) { den(buoc + 1); return; }
      loi = loiBuoc(3, d, o2); if (loi.length) { ve(); return; }
      b.disabled = true; b.setAttribute('aria-busy', 'true');
      try { var r = o2.gui(goi(d, o2)); try { localStorage.removeItem(KHOA); } catch (err) {} dong(); if (o2.xong) o2.xong(r); }
      catch (err) { b.disabled = false; b.removeAttribute('aria-busy'); loi = [['title', err.message]]; ve(); }
    }
  });
  ve();
  var dau = than.querySelector('.in:not(.ro)'); if (dau) dau.focus();
}

/* ---- các trường của hồ sơ, dùng trong ngăn chi tiết hai cổng ---- */
function chiTiet(r, fmt) {
  var l = lang(), rows = [];
  var add = function (k, v) { if (v) rows.push({ t: k, v: v }); };
  add(T('loai'), { single: 'Single', ep: 'EP', album: 'Album' }[r.type] || r.type);
  add(T('ns'), (r.artists || [r.artistName]).join(', ') + (r.feats && r.feats.length ? ' feat. ' + r.feats.join(', ') : ''));
  add(T('nhan'), r.label); add(T('tl'), (r.genre || '') + (r.genre2 ? ' · ' + r.genre2 : '')); add(T('nn'), r.lang);
  add(T('ngay'), fmt && fmt.ngay ? fmt.ngay(r.releaseDate) + (r.releaseHour ? ' ' + r.releaseHour : '') : r.releaseDate);
  add(T('presave'), r.presaveDate && fmt && fmt.ngay ? fmt.ngay(r.presaveDate) : r.presaveDate);
  add('UPC', r.upc); add(T('catalog'), r.catalogNo); add(T('nam'), r.prodYear); add('℗', r.pLine); add('©', r.cLine);
  add(T('lanhTho'), r.territory === 'exclude' ? T('loaiTru') + (r.territoryNote ? ': ' + r.territoryNote : '') : (r.territory ? T('toanCau') : ''));
  if (r.reissue) add(T('taiPh'), r.origDate || '✓');
  add(T('spotify'), r.links && r.links.spotify); add(T('apple'), r.links && r.links.apple);
  add(T('bia'), r.artwork); add(T('biaTk'), r.artworkDesigner);
  if (r.contact && r.contact.name) add(T('b3'), r.contact.name + (r.contact.phone ? ' · ' + r.contact.phone : '') + (r.contact.email ? ' · ' + r.contact.email : ''));
  add(T('ghi'), r.note);
  return rows;
}
function trackChiTiet(t) {
  var l = lang(), F = { explicit: { no: T('sach'), yes: T('coNc'), clean: T('clean') } };
  var phu = [];
  if (t.version) phu.push(t.version === 'Khác' ? t.versionOther : t.version);
  if (t.feat) phu.push('feat. ' + t.feat); if (t.remixer) phu.push('remix: ' + t.remixer);
  if (t.lyricsLang) phu.push(t.lyricsLang); if (t.explicit && t.explicit !== 'no') phu.push(F.explicit[t.explicit]);
  if (t.sampleKind && t.sampleKind !== 'none') phu.push(t.sampleKind + (t.sampleSource ? ': ' + t.sampleSource : ''));
  if (t.ai && t.ai !== '0') phu.push('AI ' + t.ai);
  return phu.join(' · ');
}

global.HHS = { mo: mo, bangKiem: bangKiem, chiTiet: chiTiet, trackChiTiet: trackChiTiet, T: T };
})(typeof window !== 'undefined' ? window : globalThis);
