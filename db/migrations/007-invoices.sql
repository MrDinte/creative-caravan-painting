-- Migration 007 — invoices and payments
--
--   psql "$DATABASE_URL" -f db/migrations/007-invoices.sql
--   (or paste into the Neon SQL Editor)
--
-- Safe to run more than once. RLS is applied here rather than in a later pass,
-- so these tables are never briefly readable by everyone.

create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  job_id         uuid references jobs(id) on delete set null,
  customer_name  text not null,
  customer_email text default '',
  status         text not null default 'draft'
                   check (status in ('draft','sent','paid','cancelled')),
  issued_date    date not null default current_date,
  due_date       date not null,
  notes          text default '',
  created_at     timestamptz not null default now()
);

create table if not exists invoice_lines (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references invoices(id) on delete cascade,
  description      text not null,
  qty              numeric(10,2) not null default 1 check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at       timestamptz not null default now()
);

-- Payments are recorded, never edited: a part payment plus a later one leaves
-- an audit trail rather than a single mutated figure.
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  method       text not null default 'bank'
                 check (method in ('stripe','bank','cash','card')),
  reference    text default '',
  paid_at      timestamptz not null default now(),
  recorded_by  text default '',
  -- Stripe sends webhooks more than once; this keeps a retry from
  -- double-crediting an invoice.
  stripe_session_id text unique
);

create index if not exists invoices_job_idx      on invoices(job_id);
create index if not exists invoice_lines_inv_idx on invoice_lines(invoice_id);
create index if not exists payments_invoice_idx  on payments(invoice_id);

-- ---------- Row level security ----------

alter table invoices      enable row level security;
alter table invoices      force  row level security;
alter table invoice_lines enable row level security;
alter table invoice_lines force  row level security;
alter table payments      enable row level security;
alter table payments      force  row level security;

-- Owners and managers manage invoicing; ordinary staff have no business here.
drop policy if exists invoices_admin on invoices;
create policy invoices_admin on invoices
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists invoice_lines_admin on invoice_lines;
create policy invoice_lines_admin on invoice_lines
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists payments_admin on payments;
create policy payments_admin on payments
  for all using (app_is_admin()) with check (app_is_admin());

-- A customer sees invoices raised against their own job, and only once those
-- have been sent — a draft is still being worked on.
drop policy if exists invoices_customer_read on invoices;
create policy invoices_customer_read on invoices
  for select using (
    app_role() = 'customer'
    and job_id = app_current_job()
    and status in ('sent','paid')
  );

drop policy if exists invoice_lines_customer_read on invoice_lines;
create policy invoice_lines_customer_read on invoice_lines
  for select using (
    app_role() = 'customer'
    and exists (
      select 1 from invoices i
      where i.id = invoice_lines.invoice_id
        and i.job_id = app_current_job()
        and i.status in ('sent','paid')
    )
  );

drop policy if exists payments_customer_read on payments;
create policy payments_customer_read on payments
  for select using (
    app_role() = 'customer'
    and exists (
      select 1 from invoices i
      where i.id = payments.invoice_id
        and i.job_id = app_current_job()
        and i.status in ('sent','paid')
    )
  );

grant select, insert, update, delete on invoices, invoice_lines, payments to app_user;
