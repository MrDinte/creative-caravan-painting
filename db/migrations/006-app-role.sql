-- Migration 006 — the role that makes RLS real
--
-- The policies in 004 are inert while the application connects as
-- neondb_owner, because that role carries BYPASSRLS. This grants an existing
-- non-bypass role exactly the privileges the app needs.
--
-- Create the role first, in the Neon Console → Roles → New Role, named
-- app_user. Creating it there means Neon generates the password and hands you
-- a ready-made connection string; no credential has to be copied around by
-- hand. Then run this file, then swap DATABASE_URL in Vercel to the app_user
-- connection string and redeploy.
--
-- Confirm it worked:
--   select rolname, rolbypassrls from pg_roles where rolname = 'app_user';
--   -- expect: app_user | false
--
-- Safe to run more than once.

grant usage on schema public to app_user;

grant select, insert, update, delete on all tables in schema public to app_user;
grant usage, select on all sequences in schema public to app_user;

-- Anything created later is covered too, so a new table doesn't silently
-- become unreadable after the next migration.
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_user;
alter default privileges in schema public
  grant usage, select on sequences to app_user;

-- The policy helper functions must be callable by the app role.
grant execute on function app_role() to app_user;
grant execute on function app_is_staff() to app_user;
grant execute on function app_is_admin() to app_user;
grant execute on function app_current_job() to app_user;
grant execute on function app_current_staff() to app_user;

-- Belt and braces: this role must never be able to sidestep the policies.
alter role app_user nobypassrls;
