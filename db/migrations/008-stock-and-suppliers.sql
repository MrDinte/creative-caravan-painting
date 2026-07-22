-- Migration 008 — stock control and suppliers
--
--   psql "$DATABASE_URL" -f db/migrations/008-stock-and-suppliers.sql
--   (or paste into the Neon SQL Editor)
--
-- Safe to run more than once. RLS applied up front.

create table if not exists suppliers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  contact_name   text default '',
  phone          text default '',
  email          text default '',
  website        text default '',
  address        text default '',
  account_number text default '',
  notes          text default '',
  created_at     timestamptz not null default now()
);

-- Running log of dealings with a supplier: calls, orders, price rises, issues.
create table if not exists supplier_log (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  entry       text not null,
  author      text default '',
  created_at  timestamptz not null default now()
);

create table if not exists stock_items (
  id            uuid primary key default gen_random_uuid(),
  -- Our own label. Unique so a scan resolves to exactly one item.
  ccp_code      text unique not null,
  -- The manufacturer's barcode, when the product carries one.
  barcode       text,
  name          text not null,
  category      text not null default 'other'
                  check (category in ('paint','parts','trim','acrylic','doors','windows','consumables','other')),
  unit          text not null default 'each',
  qty_on_hand   numeric(10,2) not null default 0,
  reorder_level numeric(10,2) not null default 0,
  cost_cents    integer not null default 0 check (cost_cents >= 0),
  sale_cents    integer not null default 0 check (sale_cents >= 0),
  supplier_id   uuid references suppliers(id) on delete set null,
  location      text default '',
  notes         text default '',
  created_at    timestamptz not null default now()
);

-- Manufacturer barcodes are unique where present, but many items have none.
create unique index if not exists stock_items_barcode_key
  on stock_items (barcode) where barcode is not null and barcode <> '';

-- Every change to qty_on_hand leaves a row here, so a discrepancy can be
-- traced rather than argued about.
create table if not exists stock_movements (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references stock_items(id) on delete cascade,
  delta      numeric(10,2) not null check (delta <> 0),
  reason     text default '',
  author     text default '',
  created_at timestamptz not null default now()
);

create index if not exists stock_items_supplier_idx on stock_items(supplier_id);
create index if not exists stock_items_category_idx on stock_items(category);
create index if not exists stock_movements_item_idx on stock_movements(item_id);
create index if not exists supplier_log_supplier_idx on supplier_log(supplier_id);

-- ---------- Row level security ----------

alter table suppliers       enable row level security;
alter table suppliers       force  row level security;
alter table supplier_log    enable row level security;
alter table supplier_log    force  row level security;
alter table stock_items     enable row level security;
alter table stock_items     force  row level security;
alter table stock_movements enable row level security;
alter table stock_movements force  row level security;

-- Buying prices and supplier terms are commercial information: owners only.
drop policy if exists suppliers_admin on suppliers;
create policy suppliers_admin on suppliers
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists supplier_log_admin on supplier_log;
create policy supplier_log_admin on supplier_log
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists stock_items_admin on stock_items;
create policy stock_items_admin on stock_items
  for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists stock_movements_admin on stock_movements;
create policy stock_movements_admin on stock_movements
  for all using (app_is_admin()) with check (app_is_admin());

-- Staff need to see what's on the shelf and book stock in and out, but not
-- what it cost or who supplies it. Column-level grants enforce that: the
-- policy lets them read the row, the grant withholds the money columns.
drop policy if exists stock_items_staff_read on stock_items;
create policy stock_items_staff_read on stock_items
  for select using (app_is_staff());

drop policy if exists stock_movements_staff on stock_movements;
create policy stock_movements_staff on stock_movements
  for all using (app_is_staff()) with check (app_is_staff());

grant select, insert, update, delete
  on suppliers, supplier_log, stock_items, stock_movements to app_user;
