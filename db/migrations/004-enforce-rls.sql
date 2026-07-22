-- Migration 004 — turn row-level security on for real
--
--   psql "$DATABASE_URL" -f db/migrations/004-enforce-rls.sql
--   (or paste into the Neon SQL Editor)
--
-- Safe to run more than once.
--
-- IMPORTANT — apply this only after the application that sets the request
-- context is deployed. The app declares who is asking at the start of every
-- query:
--
--   set_config('app.role',     'admin'|'staff'|'customer'|'anon', true)
--   set_config('app.staff_id', '<uuid>', true)
--   set_config('app.job_id',   '<uuid>', true)
--
-- With an older build that doesn't set these, every policy evaluates to false
-- and the site reads as empty. That is deliberate — it fails closed.
--
-- FORCE ROW LEVEL SECURITY matters: Postgres exempts a table's owner from RLS
-- by default, and Neon's default role owns these tables. Without FORCE the
-- policies below would be decorative.
--
-- Scope, honestly stated: this constrains the application, so a missing WHERE
-- clause or an injection cannot return another customer's rows. It is not a
-- boundary against someone holding the connection string, who can set
-- app.role themselves. Real isolation from that needs separate database roles
-- with policies keyed on current_user.

create or replace function app_role() returns text
  language sql stable as $$
    select coalesce(nullif(current_setting('app.role', true), ''), 'anon')
  $$;

create or replace function app_is_staff() returns boolean
  language sql stable as $$
    select app_role() in ('admin', 'staff')
  $$;

create or replace function app_is_admin() returns boolean
  language sql stable as $$
    select app_role() = 'admin'
  $$;

create or replace function app_current_job() returns uuid
  language sql stable as $$
    select nullif(current_setting('app.job_id', true), '')::uuid
  $$;

create or replace function app_current_staff() returns uuid
  language sql stable as $$
    select nullif(current_setting('app.staff_id', true), '')::uuid
  $$;

do $$
declare t text;
begin
  foreach t in array array[
    'jobs','tasks','job_updates','contact_submissions','order_enquiries',
    'price_book','quotes','quote_lines','staff','timesheet_entries'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

-- ---------- Work the whole team needs ----------

drop policy if exists jobs_staff on jobs;
create policy jobs_staff on jobs
  for all using (app_is_staff()) with check (app_is_staff());

drop policy if exists tasks_staff on tasks;
create policy tasks_staff on tasks
  for all using (app_is_staff()) with check (app_is_staff());

drop policy if exists updates_staff on job_updates;
create policy updates_staff on job_updates
  for all using (app_is_staff()) with check (app_is_staff());

drop policy if exists price_book_staff_read on price_book;
create policy price_book_staff_read on price_book
  for select using (app_is_staff());

-- ---------- Owner/manager only ----------

drop policy if exists price_book_admin on price_book;
create policy price_book_admin on price_book
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists quotes_admin on quotes;
create policy quotes_admin on quotes
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists quote_lines_admin on quote_lines;
create policy quote_lines_admin on quote_lines
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists contacts_admin on contact_submissions;
create policy contacts_admin on contact_submissions
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists orders_admin on order_enquiries;
create policy orders_admin on order_enquiries
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists staff_admin on staff;
create policy staff_admin on staff
  for all using (app_is_admin()) with check (app_is_admin());

-- Staff may read the team list so allocation dropdowns and names resolve,
-- but never write to it.
drop policy if exists staff_read on staff;
create policy staff_read on staff
  for select using (app_is_staff());

-- ---------- Timesheets ----------

drop policy if exists timesheets_admin on timesheet_entries;
create policy timesheets_admin on timesheet_entries
  for all using (app_is_admin()) with check (app_is_admin());

-- Staff see and write only their own hours.
drop policy if exists timesheets_own on timesheet_entries;
create policy timesheets_own on timesheet_entries
  for all using (app_role() = 'staff' and staff_id = app_current_staff())
  with check (app_role() = 'staff' and staff_id = app_current_staff());

-- ---------- Customer portal ----------

drop policy if exists jobs_customer_read on jobs;
create policy jobs_customer_read on jobs
  for select using (app_role() = 'customer' and id = app_current_job());

drop policy if exists tasks_customer_read on tasks;
create policy tasks_customer_read on tasks
  for select using (app_role() = 'customer' and job_id = app_current_job());

-- Internal notes are unreachable for a customer at the database layer, not
-- only filtered in the query the application happens to write.
drop policy if exists updates_customer_read on job_updates;
create policy updates_customer_read on job_updates
  for select using (
    app_role() = 'customer'
    and job_id = app_current_job()
    and visible_to_customer
  );

-- ---------- Public forms ----------

-- Anyone may submit an enquiry or place an order; nobody anonymous may read
-- either table back.
drop policy if exists contacts_public_insert on contact_submissions;
create policy contacts_public_insert on contact_submissions
  for insert with check (app_role() = 'anon');

drop policy if exists orders_public_insert on order_enquiries;
create policy orders_public_insert on order_enquiries
  for insert with check (app_role() = 'anon');
