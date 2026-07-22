-- Migration 005 — clock on / clock off
--
--   psql "$DATABASE_URL" -f db/migrations/005-clock-on.sql
--   (or paste into the Neon SQL Editor)
--
-- Safe to run more than once.
--
-- Holds only shifts currently in progress. Clocking off converts the shift
-- into a normal timesheet_entries row and deletes it from here, so completed
-- hours have exactly one home and payroll needs no second source.

create table if not exists open_shifts (
  staff_id    uuid primary key references staff(id) on delete cascade,
  started_at  timestamptz not null default now(),
  job_id      uuid references jobs(id) on delete set null
);

alter table open_shifts enable row level security;
alter table open_shifts force row level security;

drop policy if exists open_shifts_admin on open_shifts;
create policy open_shifts_admin on open_shifts
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists open_shifts_own on open_shifts;
create policy open_shifts_own on open_shifts
  for all using (app_role() = 'staff' and staff_id = app_current_staff())
  with check (app_role() = 'staff' and staff_id = app_current_staff());
