-- ============================================================================
-- HAUSTEK — SCHEMA SUPABASE v1.0
-- ============================================================================
--
-- CÁCH DÙNG
--   1. Vào Supabase → project của bạn → SQL Editor → New query
--   2. Dán TOÀN BỘ file này vào, bấm Run
--   3. Chạy được một lần là xong. Muốn chạy lại từ đầu, bỏ chú thích khối
--      "RESET" ở cuối file rồi chạy trước.
--
-- TRIẾT LÝ THIẾT KẾ — đọc phần này trước khi sửa gì
--
--   Database này KHÔNG tính royalty. Nó chỉ lưu và phân quyền hiển thị.
--   Bạn vẫn tính bằng Excel/Sheets như đang làm, rồi nạp kết quả vào bảng
--   royalty_lines. Lý do: tính royalty có tạm ứng, thu hồi, quy đổi tiền tệ,
--   thuế — viết code cho mấy thứ đó tốn hàng tháng và rất dễ sai. Sai tiền
--   của nghệ sĩ là mất niềm tin, không lấy lại được.
--
--   Có HAI dòng tiền hoàn toàn khác nhau, đừng bao giờ gộp:
--     • MASTER      — tiền từ bản ghi, đi theo mã ISRC, về tay nghệ sĩ/producer
--     • PUBLISHING  — tiền từ tác phẩm, đi theo người sáng tác, về chậm hơn
--                     6–9 tháng, thường qua VCPMC hoặc tổ chức tương ứng
--   Một người có thể vừa là nghệ sĩ vừa là người sáng tác, và hai phần tiền
--   đó về vào hai thời điểm khác nhau với tỉ lệ khác nhau. Gộp chung là sau
--   này không tách ra được nữa.
--
--   Phân quyền nằm ở TẦNG DATABASE (Row Level Security), không nằm ở giao
--   diện. Nghĩa là kể cả ai đó mở DevTools sửa code frontend, câu truy vấn
--   vẫn trả về rỗng. Với dữ liệu tiền bạc thì đây là điều kiện bắt buộc.
-- ============================================================================


-- ============================================================================
-- PHẦN 1 — KIỂU DỮ LIỆU
-- ============================================================================

create type user_role as enum (
  'artist',    -- nghệ sĩ biểu diễn, xem tiền master
  'writer',    -- nhạc sĩ / songwriter, xem tiền publishing
  'producer',  -- nhà sản xuất, thường ăn % master
  'staff',     -- nhân sự Haustek, xem tất cả nhưng không sửa được cấu hình
  'admin'      -- toàn quyền
);

create type revenue_stream as enum ('master', 'publishing');

create type release_status as enum (
  'draft',      -- nghệ sĩ mới gửi metadata
  'reviewing',  -- Haustek đang kiểm tra
  'approved',   -- metadata sạch, chờ đẩy
  'delivered',  -- đã đẩy lên hệ thống phân phối
  'live',       -- đã lên sóng
  'takedown'    -- đã gỡ
);

create type payout_status as enum ('pending', 'processing', 'paid', 'held', 'failed');


-- ============================================================================
-- PHẦN 2 — NGƯỜI DÙNG
-- ============================================================================

-- Mỗi người đăng nhập có đúng 1 dòng ở đây, khoá theo auth.users của Supabase
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null,               -- HỌ TÊN THẬT, dùng cho hợp đồng và thuế
  stage_name    text,                        -- nghệ danh, chỉ để hiển thị
  role          user_role not null default 'artist',
  phone         text,
  -- thông tin chi trả: chỉ chính chủ và admin đọc được (xem policy bên dưới)
  tax_id        text,                        -- mã số thuế cá nhân
  national_id   text,                        -- CCCD, cần cho chứng từ khấu trừ thuế
  bank_name     text,
  bank_account  text,
  bank_holder   text,
  payout_min_vnd numeric(14,2) default 500000,  -- dưới ngưỡng này thì cộng dồn sang kỳ sau
  country       text default 'VN',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column profiles.full_name is 'Họ tên thật. Metadata tác quyền BẮT BUỘC dùng tên thật, không dùng nghệ danh, nếu không tiền publishing không về được.';
comment on column profiles.payout_min_vnd is 'Ngưỡng chi trả tối thiểu. Dưới ngưỡng thì cộng dồn, tránh phí chuyển khoản ăn hết tiền.';

-- Tự tạo profile khi có người đăng ký mới
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ============================================================================
-- PHẦN 3 — NGHỆ SĨ VÀ THÀNH VIÊN
-- ============================================================================

-- "Nghệ sĩ" ở đây là một thực thể phát hành (có thể là cá nhân, có thể là band)
create table artists (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  slug          text generated always as (lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) stored,
  spotify_id    text,
  apple_id      text,
  bio           text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Một người có thể thuộc nhiều nghệ sĩ (band), một nghệ sĩ có nhiều người.
-- Bảng này chính là căn cứ để RLS quyết định ai xem được gì.
create table artist_members (
  artist_id   uuid not null references artists(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  role        user_role not null default 'artist',
  share_pct   numeric(6,3) not null default 100 check (share_pct >= 0 and share_pct <= 100),
  can_view_finances boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (artist_id, profile_id)
);

comment on table artist_members is 'Với band: mỗi thành viên 1 dòng, share_pct cộng lại nên bằng 100. can_view_finances=false cho thành viên không được xem tiền.';


-- ============================================================================
-- PHẦN 4 — CATALOG
-- ============================================================================

create table releases (
  id              uuid primary key default gen_random_uuid(),
  submission_id   text unique,                  -- mã HSTK-... từ form metadata
  upc             text unique,
  title           text not null,
  version         text,
  artist_id       uuid not null references artists(id) on delete restrict,
  release_type    text not null default 'Single',
  label           text not null default 'Haustek',
  genre           text,
  release_date    date,
  status          release_status not null default 'draft',
  artwork_url     text,
  territory       text default 'Worldwide',
  p_line          text,
  c_line          text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table tracks (
  id            uuid primary key default gen_random_uuid(),
  release_id    uuid not null references releases(id) on delete cascade,
  position      int not null default 1,
  isrc          text unique,                  -- khoá nối với báo cáo doanh thu
  title         text not null,
  version       text,
  display_artist text,
  is_explicit   boolean default false,
  lyric_language text default 'vi',
  duration_sec  int,
  audio_url     text,
  created_at    timestamptz not null default now(),
  unique (release_id, position)
);

create index on tracks (isrc);
create index on releases (artist_id, status);


-- ============================================================================
-- PHẦN 5 — TỈ LỆ CHIA (quan trọng nhất)
-- ============================================================================

-- Chia tiền BẢN GHI (master) — nghệ sĩ, producer
create table master_splits (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references tracks(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  payee_name  text not null,                -- giữ tên kể cả khi người đó chưa có tài khoản
  role        text not null default 'artist',
  pct         numeric(6,3) not null check (pct >= 0 and pct <= 100),
  created_at  timestamptz not null default now()
);

-- Chia tiền TÁC PHẨM (publishing) — người sáng tác, viết lời, phối khí
create table publishing_splits (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references tracks(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  writer_name text not null,                -- HỌ TÊN THẬT
  role        text not null default 'Composer',
  pct         numeric(6,3) not null check (pct >= 0 and pct <= 100),
  publisher   text,
  pro         text,                          -- VCPMC, ASCAP, BMI...
  created_at  timestamptz not null default now()
);

create index on master_splits (track_id);
create index on master_splits (profile_id);
create index on publishing_splits (track_id);
create index on publishing_splits (profile_id);

-- Chốt chặn: tổng tỉ lệ mỗi track phải đúng 100%.
-- Đây là lỗi phổ biến nhất và tốn kém nhất trong ngành, nên chặn ngay ở DB.
create or replace function check_split_total()
returns trigger
language plpgsql
as $$
declare
  total numeric(9,3);
  tid uuid;
begin
  tid := coalesce(new.track_id, old.track_id);

  if tg_table_name = 'master_splits' then
    select coalesce(sum(pct),0) into total from master_splits where track_id = tid;
  else
    select coalesce(sum(pct),0) into total from publishing_splits where track_id = tid;
  end if;

  if total > 100.001 then
    raise exception 'Tổng tỉ lệ chia của track % đang là %%%, vượt quá 100%%.', tid, total;
  end if;
  return null;
end;
$$;

create constraint trigger master_split_total
  after insert or update or delete on master_splits
  deferrable initially deferred
  for each row execute function check_split_total();

create constraint trigger publishing_split_total
  after insert or update or delete on publishing_splits
  deferrable initially deferred
  for each row execute function check_split_total();


-- ============================================================================
-- PHẦN 6 — DOANH THU
-- ============================================================================

-- Mỗi lần bạn nạp một bảng kê từ nhà phân phối = 1 dòng ở đây
create table statements (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,               -- tên nhà phân phối / nguồn
  period_start  date not null,
  period_end    date not null,
  currency      text not null default 'USD',
  fx_rate_vnd   numeric(14,4),               -- tỉ giá dùng cho kỳ này
  fx_date       date,                        -- chốt tỉ giá ngày nào — GHI RÕ TRONG HỢP ĐỒNG
  gross_total   numeric(16,2),
  imported_by   uuid references profiles(id),
  imported_at   timestamptz not null default now(),
  is_published  boolean not null default false,  -- false = nghệ sĩ CHƯA nhìn thấy
  note          text
);

comment on column statements.is_published is 'Bật true chỉ khi bạn đã đối soát xong. Nghệ sĩ không nhìn thấy kỳ chưa publish — tránh việc họ thấy số nháp rồi hỏi tại sao đổi.';
comment on column statements.fx_date is 'Tỉ giá lấy ngày nào phải ghi rõ trong hợp đồng, nếu không sẽ tranh cãi mỗi kỳ.';

-- Chi tiết doanh thu. Đây là bảng to nhất, mỗi kỳ vài nghìn tới vài trăm nghìn dòng.
create table royalty_lines (
  id            bigserial primary key,
  statement_id  uuid not null references statements(id) on delete cascade,
  stream        revenue_stream not null default 'master',
  isrc          text,
  upc           text,
  track_id      uuid references tracks(id) on delete set null,
  artist_id     uuid references artists(id) on delete set null,
  store         text,                        -- Spotify, Apple Music, TikTok, Snapchat, Alive...
  country       text,
  units         bigint default 0,            -- lượt nghe / lượt tải
  gross_amount  numeric(16,6) default 0,     -- tiền gốc theo currency của statement
  currency      text default 'USD',
  haustek_pct   numeric(6,3) default 0,      -- phần Haustek giữ lại
  net_amount    numeric(16,6) default 0,     -- phần thuộc về nghệ sĩ, sau khi trừ
  net_vnd       numeric(16,2) default 0,     -- đã quy đổi, đây là số nghệ sĩ nhìn thấy
  created_at    timestamptz not null default now()
);

create index on royalty_lines (statement_id);
create index on royalty_lines (artist_id);
create index on royalty_lines (track_id);
create index on royalty_lines (isrc);
create index on royalty_lines (store);

-- Tạm ứng và chi phí cần thu hồi trước khi chia tiền
create table advances (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  label       text not null,               -- "Tạm ứng ký hợp đồng", "Chi phí mastering"...
  amount_vnd  numeric(16,2) not null,
  recouped_vnd numeric(16,2) not null default 0,
  is_recoupable boolean not null default true,
  created_at  timestamptz not null default now()
);

create table payouts (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete restrict,
  artist_id     uuid references artists(id) on delete set null,
  period_start  date,
  period_end    date,
  gross_vnd     numeric(16,2) not null default 0,
  tax_vnd       numeric(16,2) not null default 0,   -- khấu trừ TNCN nếu áp dụng
  net_vnd       numeric(16,2) not null default 0,   -- số thực chuyển
  status        payout_status not null default 'pending',
  paid_at       timestamptz,
  reference     text,
  note          text,
  created_at    timestamptz not null default now()
);

comment on column payouts.tax_vnd is 'Khoản khấu trừ thuế TNCN nếu có. Hỏi kế toán về mức và ngưỡng áp dụng — quy định thay đổi theo thời gian.';


-- ============================================================================
-- PHẦN 7 — HÀM HỖ TRỢ PHÂN QUYỀN
-- ============================================================================
-- Đặt security definer để hàm tự đọc được bảng mà không bị chính RLS chặn.
-- Nếu không làm vậy, policy gọi hàm, hàm lại bị policy chặn → đệ quy vô hạn.

create or replace function my_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role in ('staff','admin') from profiles where id = auth.uid()), false);
$$;

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- Danh sách artist_id mà người đang đăng nhập được xem tài chính
create or replace function my_artist_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select artist_id from artist_members
  where profile_id = auth.uid() and can_view_finances = true;
$$;

-- Danh sách track_id mà người đang đăng nhập có phần trong đó
-- (qua nghệ sĩ, qua chia master, hoặc qua chia publishing)
create or replace function my_track_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select t.id from tracks t
    join releases r on r.id = t.release_id
   where r.artist_id in (select my_artist_ids())
  union
  select track_id from master_splits where profile_id = auth.uid()
  union
  select track_id from publishing_splits where profile_id = auth.uid();
$$;


-- ============================================================================
-- PHẦN 8 — BẬT RLS
-- ============================================================================

alter table profiles           enable row level security;
alter table artists            enable row level security;
alter table artist_members     enable row level security;
alter table releases           enable row level security;
alter table tracks             enable row level security;
alter table master_splits      enable row level security;
alter table publishing_splits  enable row level security;
alter table statements         enable row level security;
alter table royalty_lines      enable row level security;
alter table advances           enable row level security;
alter table payouts            enable row level security;


-- ---------- profiles ----------
create policy "tu doc profile cua minh"
  on profiles for select using (id = auth.uid());

create policy "staff doc moi profile"
  on profiles for select using (is_staff());

create policy "tu sua profile cua minh"
  on profiles for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin sua moi profile"
  on profiles for all using (is_admin()) with check (is_admin());

-- LƯU Ý: cột role người dùng KHÔNG được tự đổi. Policy update ở trên cho phép
-- họ sửa dòng của mình, nên phải chặn riêng bằng trigger dưới đây.
create or replace function lock_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Chỉ admin mới đổi được vai trò người dùng.';
  end if;
  return new;
end;
$$;

create trigger profiles_lock_role
  before update on profiles
  for each row execute function lock_role_change();


-- ---------- artists ----------
create policy "ai dang nhap cung xem duoc danh sach nghe si"
  on artists for select using (auth.uid() is not null);

create policy "staff quan ly nghe si"
  on artists for all using (is_staff()) with check (is_staff());


-- ---------- artist_members ----------
create policy "xem lien ket cua chinh minh"
  on artist_members for select
  using (profile_id = auth.uid() or artist_id in (select my_artist_ids()));

create policy "staff quan ly lien ket"
  on artist_members for all using (is_staff()) with check (is_staff());


-- ---------- releases ----------
create policy "nghe si xem release cua minh"
  on releases for select using (artist_id in (select my_artist_ids()));

create policy "staff xem moi release"
  on releases for select using (is_staff());

create policy "staff sua release"
  on releases for all using (is_staff()) with check (is_staff());


-- ---------- tracks ----------
create policy "nghe si xem track cua minh"
  on tracks for select using (id in (select my_track_ids()));

create policy "staff xem moi track"
  on tracks for select using (is_staff());

create policy "staff sua track"
  on tracks for all using (is_staff()) with check (is_staff());


-- ---------- splits ----------
-- Người liên quan chỉ nhìn thấy DÒNG CỦA CHÍNH MÌNH, không thấy tỉ lệ của
-- người khác trong cùng track. Đây là lựa chọn có chủ ý: tỉ lệ chia là
-- chuyện riêng giữa từng người với label.
create policy "xem phan chia cua chinh minh (master)"
  on master_splits for select using (profile_id = auth.uid());

create policy "staff xem het master splits"
  on master_splits for select using (is_staff());

create policy "staff sua master splits"
  on master_splits for all using (is_staff()) with check (is_staff());

create policy "xem phan chia cua chinh minh (publishing)"
  on publishing_splits for select using (profile_id = auth.uid());

create policy "staff xem het publishing splits"
  on publishing_splits for select using (is_staff());

create policy "staff sua publishing splits"
  on publishing_splits for all using (is_staff()) with check (is_staff());


-- ---------- statements ----------
create policy "nghe si chi xem ky da chot"
  on statements for select using (is_published = true);

create policy "staff xem moi ky"
  on statements for select using (is_staff());

create policy "staff quan ly ky"
  on statements for all using (is_staff()) with check (is_staff());


-- ---------- royalty_lines : trái tim của phân quyền ----------
create policy "nghe si xem doanh thu cua minh"
  on royalty_lines for select
  using (
    exists (select 1 from statements s where s.id = statement_id and s.is_published = true)
    and (
      artist_id in (select my_artist_ids())
      or track_id in (
        select track_id from master_splits where profile_id = auth.uid()
        union
        select track_id from publishing_splits where profile_id = auth.uid()
      )
    )
  );

create policy "staff xem moi doanh thu"
  on royalty_lines for select using (is_staff());

create policy "staff nap doanh thu"
  on royalty_lines for all using (is_staff()) with check (is_staff());


-- ---------- advances ----------
create policy "xem tam ung cua minh"
  on advances for select
  using (profile_id = auth.uid() or artist_id in (select my_artist_ids()));

create policy "staff quan ly tam ung"
  on advances for all using (is_staff()) with check (is_staff());


-- ---------- payouts ----------
create policy "xem lich su chi tra cua minh"
  on payouts for select using (profile_id = auth.uid());

create policy "staff quan ly chi tra"
  on payouts for all using (is_staff()) with check (is_staff());


-- ============================================================================
-- PHẦN 9 — VIEW CHO DASHBOARD
-- ============================================================================
-- View kế thừa RLS của bảng gốc, nên không cần viết lại policy.
-- security_invoker = on là bắt buộc, nếu thiếu thì view chạy bằng quyền của
-- người tạo và MỌI NGƯỜI SẼ THẤY MỌI THỨ. Đây là lỗi bảo mật kinh điển.

create or replace view v_monthly_revenue
with (security_invoker = on) as
select
  s.period_start,
  s.period_end,
  rl.artist_id,
  a.name              as artist_name,
  rl.stream,
  rl.store,
  sum(rl.units)       as units,
  sum(rl.net_vnd)     as net_vnd
from royalty_lines rl
join statements s on s.id = rl.statement_id
left join artists a on a.id = rl.artist_id
where s.is_published = true
group by 1,2,3,4,5,6;

create or replace view v_track_revenue
with (security_invoker = on) as
select
  t.id                as track_id,
  t.isrc,
  t.title             as track_title,
  r.title             as release_title,
  a.name              as artist_name,
  s.period_start,
  rl.stream,
  sum(rl.units)       as units,
  sum(rl.net_vnd)     as net_vnd
from royalty_lines rl
join statements s on s.id = rl.statement_id
join tracks t on t.id = rl.track_id
join releases r on r.id = t.release_id
join artists a on a.id = r.artist_id
where s.is_published = true
group by 1,2,3,4,5,6,7;

create or replace view v_country_revenue
with (security_invoker = on) as
select
  rl.country,
  rl.artist_id,
  s.period_start,
  sum(rl.units)   as units,
  sum(rl.net_vnd) as net_vnd
from royalty_lines rl
join statements s on s.id = rl.statement_id
where s.is_published = true
group by 1,2,3;

-- Tổng quan: số nghệ sĩ nhìn thấy đầu tiên khi đăng nhập
create or replace view v_my_summary
with (security_invoker = on) as
select
  rl.artist_id,
  sum(rl.net_vnd) filter (where s.period_start >= date_trunc('year', current_date))  as ytd_vnd,
  sum(rl.net_vnd)                                                                    as lifetime_vnd,
  sum(rl.units)                                                                      as lifetime_units,
  count(distinct rl.store)                                                           as stores,
  max(s.period_end)                                                                  as latest_period
from royalty_lines rl
join statements s on s.id = rl.statement_id
where s.is_published = true
group by 1;


-- ============================================================================
-- PHẦN 10 — CẬP NHẬT updated_at TỰ ĐỘNG
-- ============================================================================

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger t_profiles_touch before update on profiles
  for each row execute function touch_updated_at();
create trigger t_releases_touch before update on releases
  for each row execute function touch_updated_at();


-- ============================================================================
-- PHẦN 11 — KIỂM TRA SAU KHI CHẠY
-- ============================================================================
-- Chạy 2 câu này, kết quả phải như ghi chú thì mới đúng.

-- (a) Mọi bảng phải có rowsecurity = true
-- select tablename, rowsecurity from pg_tables
--  where schemaname = 'public' order by tablename;

-- (b) Mọi view phải có security_invoker=on trong reloptions
-- select c.relname, c.reloptions from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname='public' and c.relkind='v';


-- ============================================================================
-- PHẦN 12 — DỮ LIỆU MẪU ĐỂ THỬ (tuỳ chọn)
-- ============================================================================
-- Chạy phần này sau khi đã tạo ít nhất 1 tài khoản qua Supabase Auth.
-- Thay UUID bên dưới bằng id thật lấy từ bảng auth.users.
/*
insert into artists (name, spotify_id) values ('Tarnoise', null);

-- gán mình làm admin
update profiles set role = 'admin' where email = 'ban@haustek-group.com';

-- nối một người vào nghệ sĩ
insert into artist_members (artist_id, profile_id, role)
select a.id, p.id, 'artist'
from artists a, profiles p
where a.name = 'Tarnoise' and p.email = 'nghesi@example.com';
*/


-- ============================================================================
-- RESET — chỉ bỏ chú thích khi muốn xoá sạch làm lại
-- ============================================================================
/*
drop view if exists v_my_summary, v_country_revenue, v_track_revenue, v_monthly_revenue cascade;
drop table if exists payouts, advances, royalty_lines, statements,
  publishing_splits, master_splits, tracks, releases,
  artist_members, artists, profiles cascade;
drop function if exists my_role, is_staff, is_admin, my_artist_ids, my_track_ids,
  handle_new_user, check_split_total, touch_updated_at, lock_role_change cascade;
drop type if exists user_role, revenue_stream, release_status, payout_status cascade;
*/
