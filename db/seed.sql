-- Seed data mirroring the built-in demo dataset.
-- Run after schema.sql:  psql "$DATABASE_URL" -f db/seed.sql

-- Seeding runs as admin so RLS policies allow the writes.
select set_config('app.role', 'admin', false);

-- ---------- Price book ----------
insert into price_book (code, name, category, unit, price_cents) values
  ('PB-EXT-01',  'Full exterior respray — 2 pac (single axle van)', 'Exterior Painting', 'each',       650000),
  ('PB-EXT-02',  'Full exterior respray — 2 pac (tandem axle van)', 'Exterior Painting', 'each',       850000),
  ('PB-EXT-03',  'Feature band / two-tone upgrade',                 'Exterior Painting', 'each',       120000),
  ('PB-EXT-04',  'Decal removal',                                   'Exterior Painting', 'per hour',     9500),
  ('PB-SEAL-01', 'Roof reseal — Globalcote',                        'Reseals & Repairs', 'each',       185000),
  ('PB-SEAL-02', 'Window / hatch reseal',                           'Reseals & Repairs', 'per window',  18500),
  ('PB-WIN-01',  'Window winder or lock repair',                    'Windows',           'each',        12500),
  ('PB-WIN-02',  'Perspex supply & cut — flat',                     'Windows',           'per m²',      22000),
  ('PB-WIN-03',  'Perspex supply & cut — curved',                   'Windows',           'per window',  38000),
  ('PB-INT-01',  'Vinyl flooring supply & lay',                     'Interior',          'per m²',      14500),
  ('PB-INT-02',  'Gas lift bed install',                            'Interior',          'each',       145000),
  ('PB-LAB-01',  'General workshop labour',                         'Labour',            'per hour',    11000)
on conflict (code) do nothing;

-- ---------- Jobs ----------
insert into jobs (job_code, title, customer_name, customer_email, van_make_model, status, access_code, scheduled_start, scheduled_end, notes) values
  ('CCP-2026-001', 'Full Exterior Respray — Two-Tone Teal',  'Sarah Mitchell',      'sarah@example.com',  'Jayco Starcraft 2004',        'in_progress',   'VAN123', '2026-07-13', '2026-07-24', 'Customer chose 2 pac teal over white, new decals supplied.'),
  ('CCP-2026-002', 'Millard Louvre Window Restoration',      'Greg Thompson',       'greg@example.com',   'Millard 1978',                'awaiting_parts','VAN456', '2026-07-20', '2026-07-28', 'Curved perspex on order. Winder and lock repairs included.'),
  ('CCP-2026-003', 'Retro Two-Tone Restoration',             'Lisa & Mark Nguyen',  'nguyen@example.com', 'Viscount Grand Tourer 1976',  'booked',        'VAN789', '2026-08-03', '2026-08-21', 'Full resto: decal removal, rust repair, mustard/cream scheme.'),
  ('CCP-2026-004', 'Interior Reno + Roof Reseal',            'Dave Carter',         'dave@example.com',   'Coromal Excel 2010',          'quality_check', 'VAN321', '2026-06-29', '2026-07-22', 'Globalcote roof reseal, vinyl flooring, gas lift bed install.')
on conflict (job_code) do nothing;

-- ---------- Tasks ----------
insert into tasks (job_id, work_id, title, assignee, status)
select j.id, v.work_id, v.title, v.assignee, v.status
from (values
  ('CCP-2026-001', 'CCP-2026-001-W01', 'Sand and prep exterior panels',     'Jake', 'done'),
  ('CCP-2026-001', 'CCP-2026-001-W02', 'Mask windows and trim',             'Jake', 'done'),
  ('CCP-2026-001', 'CCP-2026-001-W03', 'Spray base coat — 2 pac white',     'Tim',  'in_progress'),
  ('CCP-2026-001', 'CCP-2026-001-W04', 'Spray feature band — teal',         'Tim',  'todo'),
  ('CCP-2026-001', 'CCP-2026-001-W05', 'Apply new decals + final polish',   'Jake', 'todo'),
  ('CCP-2026-002', 'CCP-2026-002-W01', 'Remove louvre panes and frames',    'Jake', 'done'),
  ('CCP-2026-002', 'CCP-2026-002-W02', 'Order curved perspex cut-to-size',  'Tim',  'in_progress'),
  ('CCP-2026-003', 'CCP-2026-003-W01', 'Strip old decals and assess rust',  'Jake', 'todo'),
  ('CCP-2026-004', 'CCP-2026-004-W01', 'Globalcote roof reseal',            'Tim',  'done'),
  ('CCP-2026-004', 'CCP-2026-004-W02', 'Lay vinyl flooring',                'Jake', 'done'),
  ('CCP-2026-004', 'CCP-2026-004-W03', 'Install gas lift bed',              'Jake', 'done'),
  ('CCP-2026-004', 'CCP-2026-004-W04', 'Final quality inspection',          'Tim',  'in_progress')
) as v(job_code, work_id, title, assignee, status)
join jobs j on j.job_code = v.job_code
on conflict (work_id) do nothing;

-- ---------- Job updates ----------
-- job_updates has no natural unique key, so guard on (job_id, message) to keep
-- this file safe to re-run. Without this, every run appends another copy.
insert into job_updates (job_id, author, message, visible_to_customer)
select j.id, v.author, v.message, v.visible
from (values
  ('CCP-2026-001', 'Tim',  'Van booked in — colours confirmed: teal feature band over 2 pac white.', true),
  ('CCP-2026-001', 'Jake', 'Prep complete. Panels sanded back and masked, ready for spray booth.',   true),
  ('CCP-2026-001', 'Tim',  'Base coat down and looking great — feature band goes on this week.',     true),
  ('CCP-2026-001', 'Tim',  'Internal note: order extra teal tint for touch-up kit.',                 false),
  ('CCP-2026-002', 'Tim',  'Frames cleaned and polished. Curved perspex on order — ETA next week.',  true),
  ('CCP-2026-004', 'Jake', 'Interior fit-out finished! Final inspection underway, pickup Friday.',   true)
) as v(job_code, author, message, visible)
join jobs j on j.job_code = v.job_code
where not exists (
  select 1 from job_updates existing
  where existing.job_id = j.id and existing.message = v.message
);

-- ---------- Example quotes ----------
insert into quotes (quote_number, customer_name, customer_email, customer_phone, van_make_model, status, notes, valid_until) values
  ('Q-2026-014', 'Peter Hall', 'peter@example.com', '0400 111 222', 'Franklin Regent 1979', 'sent',
   'Includes colour matching to supplied swatch. Rust repair quoted separately if found during prep.', '2026-08-18'),
  ('Q-2026-015', 'Robyn West', 'robyn@example.com', '0400 333 444', 'Jayco Freedom 1998',   'draft', '', '2026-08-21')
on conflict (quote_number) do nothing;

-- Q-2026-014: note the feature band is discounted below the book rate (1200.00 -> 1000.00).
insert into quote_lines (quote_id, price_book_item_id, description, qty, unit_price_cents)
select q.id, pb.id, v.description, v.qty, v.unit_price
from (values
  ('Q-2026-014', 'PB-EXT-01', 'Full exterior respray — 2 pac (single axle van)', 1, 650000),
  ('Q-2026-014', 'PB-EXT-03', 'Feature band / two-tone upgrade',                 1, 100000),
  ('Q-2026-014', 'PB-EXT-04', 'Decal removal',                                   4,   9500),
  ('Q-2026-015', 'PB-SEAL-01','Roof reseal — Globalcote',                        1, 185000),
  ('Q-2026-015', 'PB-SEAL-02','Window / hatch reseal',                           6,  18500)
) as v(quote_number, code, description, qty, unit_price)
join quotes q     on q.quote_number = v.quote_number
join price_book pb on pb.code = v.code
where not exists (
  select 1 from quote_lines existing
  where existing.quote_id = q.id and existing.description = v.description
);

-- A custom line with no price book link.
insert into quote_lines (quote_id, price_book_item_id, description, qty, unit_price_cents)
select q.id, null, 'Supply + fit new roof hatch (custom)', 1, 42000
from quotes q
where q.quote_number = 'Q-2026-015'
  and not exists (
    select 1 from quote_lines existing
    where existing.quote_id = q.id
      and existing.description = 'Supply + fit new roof hatch (custom)'
  );
