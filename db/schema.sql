-- Creative Caravan Painting — Neon Postgres schema
--
-- Apply with:
--   psql "$DATABASE_URL" -f db/schema.sql
--   psql "$DATABASE_URL" -f db/seed.sql
--
-- Row Level Security is enabled on every table. The app connects as one of
-- two roles and sets request-scoped GUCs so policies can scope each query:
--
--   app.role     = 'admin' | 'customer'
--   app.job_id   = the job UUID a logged-in customer may read
--
-- Example (run at the start of a request):
--   SELECT set_config('app.role', 'customer', true);
--   SELECT set_config('app.job_id', '<uuid>', true);

create extension if not exists "pgcrypto";

-- ---------- Tables ----------

-- Workshop staff. Deactivated rather than deleted so historical allocations
-- keep resolving to a real person.
create table if not exists staff (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists jobs (
  id               uuid primary key default gen_random_uuid(),
  job_code         text unique not null,
  title            text not null,
  customer_name    text not null,
  customer_email   text,
  van_make_model   text,
  status           text not null default 'booked'
                     check (status in ('booked','in_progress','awaiting_parts','quality_check','completed')),
  access_code      text not null,
  scheduled_start  date not null,
  scheduled_end    date not null,
  assigned_to      uuid references staff(id) on delete set null,
  location         text not null default 'workshop'
                     check (location in ('workshop','bellmere')),
  notes            text default '',
  created_at       timestamptz not null default now()
);

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references jobs(id) on delete cascade,
  work_id     text unique not null,
  title       text not null,
  assignee    text default '',
  status      text not null default 'todo'
                check (status in ('todo','in_progress','done')),
  created_at  timestamptz not null default now()
);

create table if not exists job_updates (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references jobs(id) on delete cascade,
  author              text not null,
  message             text not null,
  visible_to_customer boolean not null default true,
  -- Public URLs of photos held in Vercel Blob.
  photo_urls          jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now()
);

create table if not exists contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text default '',
  service     text default '',
  message     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists order_enquiries (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null,
  customer_email  text not null,
  items           jsonb not null default '[]'::jsonb,
  total_cents     integer not null default 0,
  status          text not null default 'enquiry' check (status in ('enquiry','paid')),
  stripe_session_id text,
  created_at      timestamptz not null default now()
);

-- Master price book — the source of truth for quoting.
create table if not exists price_book (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  name         text not null,
  category     text not null,
  unit         text not null default 'each',
  price_cents  integer not null check (price_cents >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists quotes (
  id              uuid primary key default gen_random_uuid(),
  quote_number    text unique not null,
  customer_name   text not null,
  customer_email  text default '',
  customer_phone  text default '',
  van_make_model  text default '',
  status          text not null default 'draft'
                    check (status in ('draft','sent','accepted','declined')),
  notes           text default '',
  valid_until     date not null,
  created_at      timestamptz not null default now()
);

-- unit_price_cents is copied from price_book at line-creation time and can then
-- be edited per quote, so historical quotes never change when rates are updated.
create table if not exists quote_lines (
  id                 uuid primary key default gen_random_uuid(),
  quote_id           uuid not null references quotes(id) on delete cascade,
  price_book_item_id uuid references price_book(id) on delete set null,
  description        text not null,
  qty                numeric(10,2) not null default 1 check (qty > 0),
  unit_price_cents   integer not null check (unit_price_cents >= 0),
  created_at         timestamptz not null default now()
);

create index if not exists tasks_job_id_idx        on tasks(job_id);
create index if not exists job_updates_job_id_idx  on job_updates(job_id);
create index if not exists quote_lines_quote_idx   on quote_lines(quote_id);
create index if not exists jobs_schedule_idx       on jobs(scheduled_start, scheduled_end);

-- ---------- Row Level Security ----------

alter table jobs                enable row level security;
alter table tasks               enable row level security;
alter table job_updates         enable row level security;
alter table contact_submissions enable row level security;
alter table order_enquiries     enable row level security;
alter table price_book          enable row level security;
alter table quotes              enable row level security;
alter table quote_lines         enable row level security;

-- Helper predicates
create or replace function app_is_admin() returns boolean
  language sql stable as $$
    select coalesce(current_setting('app.role', true), '') = 'admin'
  $$;

create or replace function app_current_job() returns uuid
  language sql stable as $$
    select nullif(current_setting('app.job_id', true), '')::uuid
  $$;

-- Admin: full access to everything.
drop policy if exists jobs_admin_all on jobs;
create policy jobs_admin_all on jobs
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists tasks_admin_all on tasks;
create policy tasks_admin_all on tasks
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists updates_admin_all on job_updates;
create policy updates_admin_all on job_updates
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists contacts_admin_all on contact_submissions;
create policy contacts_admin_all on contact_submissions
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists orders_admin_all on order_enquiries;
create policy orders_admin_all on order_enquiries
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists price_book_admin_all on price_book;
create policy price_book_admin_all on price_book
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists quotes_admin_all on quotes;
create policy quotes_admin_all on quotes
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists quote_lines_admin_all on quote_lines;
create policy quote_lines_admin_all on quote_lines
  for all using (app_is_admin()) with check (app_is_admin());

-- Customer: read-only, and only their own job.
drop policy if exists jobs_customer_read on jobs;
create policy jobs_customer_read on jobs
  for select using (id = app_current_job());

drop policy if exists tasks_customer_read on tasks;
create policy tasks_customer_read on tasks
  for select using (job_id = app_current_job());

-- Customers never see internal notes.
drop policy if exists updates_customer_read on job_updates;
create policy updates_customer_read on job_updates
  for select using (job_id = app_current_job() and visible_to_customer);

-- Anonymous visitors may submit the contact form and place store orders,
-- but may never read them back.
drop policy if exists contacts_public_insert on contact_submissions;
create policy contacts_public_insert on contact_submissions
  for insert with check (true);

drop policy if exists orders_public_insert on order_enquiries;
create policy orders_public_insert on order_enquiries
  for insert with check (true);

-- ---------- Maintenance ----------

create or replace function touch_updated_at() returns trigger
  language plpgsql as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;

drop trigger if exists price_book_touch on price_book;
create trigger price_book_touch before update on price_book
  for each row execute function touch_updated_at();
