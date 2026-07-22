-- Migration 001 — staff allocation and job location
--
-- Brings an existing database up to date with db/schema.sql without touching
-- the rows already in it. Safe to run more than once.
--
--   psql "$DATABASE_URL" -f db/migrations/001-staff-and-location.sql
--   (or paste into the Neon SQL Editor)

create table if not exists staff (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table jobs add column if not exists assigned_to uuid;
alter table jobs add column if not exists location text not null default 'workshop';

-- Add the constraints separately so re-running doesn't error on duplicates.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'jobs_assigned_to_fkey'
  ) then
    alter table jobs
      add constraint jobs_assigned_to_fkey
      foreign key (assigned_to) references staff(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'jobs_location_check'
  ) then
    alter table jobs
      add constraint jobs_location_check
      check (location in ('workshop','bellmere'));
  end if;
end $$;

create index if not exists jobs_assigned_to_idx on jobs(assigned_to);
create index if not exists jobs_location_idx    on jobs(location);

-- Seed the workshop team. Names match the assignees on the seeded tasks.
insert into staff (name, role)
select v.name, v.role
from (values
  ('Tim',  'Owner / Spray Painter'),
  ('Jake', 'Panel & Prep'),
  ('Mel',  'Interiors & Upholstery')
) as v(name, role)
where not exists (select 1 from staff existing where existing.name = v.name);
