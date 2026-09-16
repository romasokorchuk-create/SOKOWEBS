-- ═══════════════════════════════════════════════════════════════════════
-- SOKO · схема для адмінки. Виконати ОДИН раз: Supabase → SQL Editor → Run.
--
-- Принцип: RLS на КОЖНІЙ таблиці. Ключ anon, що лежить у коді сайту, публічний
-- за призначенням — він дозволяє лише:
--   • надіслати заявку через функцію submit_lead (читати заявки — ні, навіть свою);
--   • читати опубліковане портфоліо й ціни.
-- Читати й міняти дані може лише користувач зі списку public.admins,
-- який увійшов із 2FA (aal2). Без 2FA адмін теж отримує нуль рядків.
-- ═══════════════════════════════════════════════════════════════════════

-- ── адміни ─────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
-- політик немає: через API цю таблицю не читає й не пише ніхто

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ── заявки ─────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name) between 1 and 80),
  phone        text not null check (char_length(phone) between 7 and 24),
  email        text not null check (char_length(email) between 5 and 120),
  message      text not null check (char_length(message) between 1 and 2000),
  project_type text check (char_length(project_type) <= 20),
  budget       text check (char_length(budget) <= 20),
  addons       text check (char_length(addons) <= 400),
  estimate     integer check (estimate between 0 and 100000),
  discount     boolean not null default false,
  lang         text check (lang in ('ua','en','pl')),
  status       text not null default 'new' check (status in ('new','in_progress','done','spam')),
  notes        text check (char_length(notes) <= 2000)
);
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
grant select, delete on public.leads to authenticated;
grant update (status, notes) on public.leads to authenticated;   -- змінювати можна лише статус і нотатку
drop policy if exists leads_admin_select on public.leads;
drop policy if exists leads_admin_update on public.leads;
drop policy if exists leads_admin_delete on public.leads;
create policy leads_admin_select on public.leads for select to authenticated using ((select public.is_admin()));
create policy leads_admin_update on public.leads for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy leads_admin_delete on public.leads for delete to authenticated using ((select public.is_admin()));
-- політики INSERT немає: заявка потрапляє в базу лише через submit_lead

create table if not exists public.lead_rate (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists lead_rate_ip_at on public.lead_rate (ip, at);
alter table public.lead_rate enable row level security;
revoke all on public.lead_rate from anon, authenticated;

create or replace function public.submit_lead(
  p_name text, p_phone text, p_email text, p_message text,
  p_type text default null, p_budget text default null, p_addons text default null,
  p_estimate integer default null, p_discount boolean default false,
  p_lang text default 'ua', p_website text default ''
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  h    json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := coalesce(h ->> 'cf-connecting-ip', nullif(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1), ''), 'unknown');
begin
  if coalesce(p_website, '') <> '' then return; end if;           -- пастка для ботів: людина цього поля не бачить
  if (select count(*) from public.lead_rate r where r.ip = v_ip and r.at > now() - interval '10 minutes') >= 3 then
    raise exception 'too_many_requests' using errcode = 'P0001';
  end if;
  p_name := btrim(coalesce(p_name, '')); p_phone := btrim(coalesce(p_phone, ''));
  p_email := lower(btrim(coalesce(p_email, ''))); p_message := btrim(coalesce(p_message, ''));
  if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'bad_email' using errcode = 'P0001'; end if;
  if p_phone !~ '^[0-9+() -]{7,24}$' then raise exception 'bad_phone' using errcode = 'P0001'; end if;
  insert into public.lead_rate (ip) values (v_ip);
  delete from public.lead_rate where at < now() - interval '1 day';
  insert into public.leads (name, phone, email, message, project_type, budget, addons, estimate, discount, lang)
  values (p_name, p_phone, p_email, p_message, left(p_type, 20), left(p_budget, 20), left(p_addons, 400),
          p_estimate, coalesce(p_discount, false), case when p_lang in ('ua','en','pl') then p_lang end);
end $$;
revoke all on function public.submit_lead(text,text,text,text,text,text,text,integer,boolean,text,text) from public;
grant execute on function public.submit_lead(text,text,text,text,text,text,text,integer,boolean,text,text) to anon, authenticated;

-- ── портфоліо ──────────────────────────────────────────────────────────
create table if not exists public.works (
  id         uuid primary key default gen_random_uuid(),
  sort       integer not null default 0,
  visible    boolean not null default true,
  slug       text not null unique check (slug ~ '^[a-z0-9-]{1,40}$'),
  name       text not null check (char_length(name) between 1 and 60),
  cat_ua     text not null default '' check (char_length(cat_ua) <= 80),
  cat_en     text not null default '' check (char_length(cat_en) <= 80),
  cat_pl     text not null default '' check (char_length(cat_pl) <= 80),
  bg         text not null default '#0A0A0C' check (bg ~ '^#[0-9A-Fa-f]{6}$'),
  accent     text not null default '#4ADE2E' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  href       text not null check (char_length(href) between 12 and 300 and href ~ '^(demo/[a-z0-9-]{1,40}/index\.html|https://[^[:space:]"<>'']{4,})$'),   -- у Postgres повторення не більше 255, тож довжину — окремо
  updated_at timestamptz not null default now()
);
alter table public.works enable row level security;
revoke all on public.works from anon, authenticated;
grant select on public.works to anon, authenticated;
grant insert, update, delete on public.works to authenticated;
drop policy if exists works_read_anon    on public.works;
drop policy if exists works_read_auth    on public.works;
drop policy if exists works_admin_insert on public.works;
drop policy if exists works_admin_update on public.works;
drop policy if exists works_admin_delete on public.works;
create policy works_read_anon    on public.works for select to anon          using (visible);
create policy works_read_auth    on public.works for select to authenticated using (visible or (select public.is_admin()));
create policy works_admin_insert on public.works for insert to authenticated with check ((select public.is_admin()));
create policy works_admin_update on public.works for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy works_admin_delete on public.works for delete to authenticated using ((select public.is_admin()));

-- ── ціни ───────────────────────────────────────────────────────────────
create or replace function public.valid_pricing(v jsonb)
returns boolean
language plpgsql immutable set search_path = ''
as $$
declare k text; x jsonb;
begin
  if jsonb_typeof(v) is distinct from 'object' then return false; end if;
  if jsonb_typeof(v -> 'tiers') is distinct from 'object' then return false; end if;
  if jsonb_typeof(v -> 'addons') is distinct from 'object' then return false; end if;
  if jsonb_typeof(v -> 'discount') is distinct from 'number' then return false; end if;
  if jsonb_typeof(v -> 'support') is distinct from 'array' then return false; end if;
  if (select count(*) from jsonb_object_keys(v -> 'tiers')) <> 3 then return false; end if;
  foreach k in array array['START','PRO','MAX'] loop
    x := v -> 'tiers' -> k;
    if jsonb_typeof(x) is distinct from 'number' then return false; end if;
    if x::text::numeric not between 0 and 100000 then return false; end if;
  end loop;
  for k, x in select * from jsonb_each(v -> 'addons') loop
    if k !~ '^[a-z]{2,12}$' then return false; end if;
    if jsonb_typeof(x) is distinct from 'number' then return false; end if;
    if x::text::numeric not between 0 and 100000 then return false; end if;
  end loop;
  if (v ->> 'discount')::numeric not between 0 and 10000 then return false; end if;
  if jsonb_array_length(v -> 'support') <> 2 then return false; end if;
  for x in select * from jsonb_array_elements(v -> 'support') loop
    if jsonb_typeof(x) is distinct from 'number' then return false; end if;
    if x::text::numeric not between 0 and 10000 then return false; end if;
  end loop;
  return true;
end $$;
revoke all on function public.valid_pricing(jsonb) from public, anon;
grant execute on function public.valid_pricing(jsonb) to authenticated;

create table if not exists public.settings (
  key        text primary key check (key in ('pricing')),
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  constraint settings_pricing_shape check (key <> 'pricing' or public.valid_pricing(value))
);
alter table public.settings enable row level security;
revoke all on public.settings from anon, authenticated;
grant select on public.settings to anon, authenticated;
grant update (value, updated_at) on public.settings to authenticated;
drop policy if exists settings_read         on public.settings;
drop policy if exists settings_admin_update on public.settings;
create policy settings_read         on public.settings for select to anon, authenticated using (true);
create policy settings_admin_update on public.settings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── стартові дані (поточний сайт) ──────────────────────────────────────
insert into public.settings (key, value) values ('pricing',
  '{"tiers":{"START":350,"PRO":690,"MAX":1290},"addons":{"cms":220,"admin":370,"pay":300,"lang":110,"seo":180,"stats":70,"bot":300,"host":90},"discount":50,"support":[70,140]}')
on conflict (key) do nothing;

insert into public.works (sort, slug, name, cat_ua, cat_en, cat_pl, bg, accent, href) values
  (10, 'marque',          'MARQUE',          'SHOPIFY-ТЕМА · ЕЛІТНІ АВТО',     'SHOPIFY THEME · LUXURY CARS',          'MOTYW SHOPIFY · AUTA PREMIUM',        '#FFFFFF', '#3E9E77', 'demo/marque/index.html'),
  (20, 'arden-bespoke',   'ARDEN BESPOKE',   'БІЗНЕС-САЙТ · АВТОСТУДІЯ',       'BUSINESS SITE · CAR STUDIO',           'STRONA FIRMOWA · STUDIO AUT',         '#0B1626', '#7FB0D6', 'demo/arden-bespoke/index.html'),
  (30, 'bilderfashion',   'bilderfashion',   'БІЗНЕС-САЙТ · РЕМОНТ, НЬЮ-ЙОРК', 'BUSINESS SITE · RENOVATION, NEW YORK', 'STRONA FIRMOWA · REMONTY, NOWY JORK', '#E5DBD7', '#F2A0B5', 'demo/bilderfashion/index.html'),
  (40, 'tork',            'ТОРК',            'БІЗНЕС-САЙТ · АВТОСЕРВІС',       'BUSINESS SITE · AUTO REPAIR',          'STRONA FIRMOWA · SERWIS SAMOCHODOWY', '#0D0D0D', '#C89211', 'demo/tork/index.html'),
  (50, 'moto-moto',       'moto-moto',       'МАГАЗИН · МОТОЦИКЛИ ЗІ США',     'STORE · MOTORCYCLES FROM THE USA',     'SKLEP · MOTOCYKLE Z USA',             '#0D0D0B', '#C3D68A', 'demo/moto-moto/index.html'),
  (60, 'verse-detailing', 'VERSE DETAILING', 'ЛЕНДІНГ · США',                  'LANDING · USA',                        'LANDING · USA',                       '#0B0A0B', '#ED1C24', 'demo/verse-detailing/index.html'),
  (70, 'xwash',           'XWASH',           'ЛЕНДІНГ · АВТОДЕТЕЙЛІНГ',        'LANDING · AUTO DETAILING',             'LANDING · AUTO DETAILING',            '#0A0A0C', '#E4002B', 'demo/xwash/index.html'),
  (80, 'marea',           'MAREA',           'ЛЕНДІНГ · ПРОКАТ ЧОВНІВ',        'LANDING · BOAT RENTAL',                'LANDING · WYNAJEM ŁODZI',             '#241A0E', '#C9A15C', 'demo/marea/index.html')
on conflict (slug) do nothing;

-- ── ОДИН РАЗ після створення свого користувача (Authentication → Users) ─
-- insert into public.admins (user_id) select id from auth.users where email = 'ТВОЯ@ПОШТА';
