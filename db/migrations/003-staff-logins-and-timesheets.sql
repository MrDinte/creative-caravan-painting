-- Migration 003 — per-staff logins and timesheets
--
--   psql "$DATABASE_URL" -f db/migrations/003-staff-logins-and-timesheets.sql
--   (or paste into the Neon SQL Editor)
--
-- Safe to run more than once.

-- Staff can now sign in individually. username stays null until a login is
-- created for them; password_hash is scrypt, "<saltHex>:<hashHex>".
alter table staff add column if not exists username      text;
alter table staff add column if not exists password_hash text;
alter table staff add column if not exists access_level  text not null default 'staff';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'staff_access_level_check'
  ) then
    alter table staff
      add constraint staff_access_level_check
      check (access_level in ('admin','staff'));
  end if;
end $$;

-- Usernames are unique where present. A partial index allows many nulls.
create unique index if not exists staff_username_key
  on staff (lower(username)) where username is not null;

-- Payroll settings, per person.
alter table staff add column if not exists hourly_rate_cents     integer not null default 0;
alter table staff add column if not exists overtime_multiplier   numeric(4,2) not null default 1.50;
alter table staff add column if not exists overtime_after_hours  numeric(5,2) not null default 38;
alter table staff add column if not exists default_break_minutes integer not null default 30;

create table if not exists timesheet_entries (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid not null references staff(id) on delete cascade,
  job_id        uuid references jobs(id) on delete set null,
  work_date     date not null,
  -- Hours on site. The unpaid break is deducted when pay is calculated.
  hours         numeric(5,2) not null check (hours > 0 and hours <= 24),
  break_minutes integer not null default 30 check (break_minutes >= 0 and break_minutes < 600),
  notes         text default '',
  created_at    timestamptz not null default now()
);

create index if not exists timesheet_staff_date_idx
  on timesheet_entries (staff_id, work_date desc);
create index if not exists timesheet_job_idx
  on timesheet_entries (job_id);
