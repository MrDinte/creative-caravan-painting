# Creative Caravan Painting — Demo Rebuild

A modern rebuild of [creativecaravanpainting.com](https://www.creativecaravanpainting.com/) as a
full-stack Next.js application: marketing site, online store, customer job-tracking portal, and a
workshop admin back office with a calendar, task manager and quoting system.

> **Demo project.** Built as a working demonstration for Creative Caravan Painting
> (Caboolture South, QLD). Runs with zero configuration using a seeded in-memory dataset, and
> switches to Neon Postgres the moment `DATABASE_URL` is set.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Styling | Tailwind CSS v4 |
| Database | Neon Postgres via `@neondatabase/serverless` (with RLS policies) |
| Auth | Signed JWT cookies via `jose` — separate staff and customer sessions |
| Payments | Stripe-ready (enquiry mode until keys are added) |
| Testing | Playwright — 155 tests across desktop Chrome + mobile Safari |
| Hosting | Vercel |

## Features

### Public site
- **Home** — hero, services grid, work preview, process, Instagram and contact sections. Keeps the
  original site's headings (`Services`, `Follow us on Instagram`, `CONTACT US`) and CTAs.
- **Services** — all five services from the original site with full detail and per-service CTAs.
- **Our Work** — gallery of previous customer caravans with draggable before/after sliders
  (works with mouse, touch and keyboard).
- **Store** — categorised product catalogue, product detail pages, persistent cart, checkout.
- **Contact** — validated contact form that writes to the database and surfaces in the admin.
- Mobile-first throughout: 44px+ tap targets, no horizontal overflow, visible focus rings.

### Customer portal (`/portal`)
Customers log in with the **job code** and **access code** from their booking:
- Live status tracker across the five job stages
- Completion progress bar driven by real task data
- Update feed — **only** updates staff mark customer-visible are ever exposed
- Work checklist with individual work IDs

### Workshop admin (`/admin`)
Staff login gates everything behind a session cookie.
- **Dashboard** — active jobs, open tasks, open quotes, quote pipeline value
- **Calendar** — real month grid with jobs laid across their scheduled dates, colour-coded by
  status, month navigation, click through to any job
- **Jobs** — auto-generated job codes (`CCP-2026-001`) and customer access codes
- **Task Manager** — kanban across To Do / In Progress / Done, each task with a unique work ID
  (`CCP-2026-001-W03`) so employees can track exactly what's been done
- **Quotes** — build a quote from the master price book, **override any line price for that quote
  only**, GST totals, status lifecycle, and one-click conversion of an accepted quote into a job
- **Price Book** — the master rate card; add, edit and delete rates in one place
- **Enquiries** — contact form submissions and store orders

### Quoting and pricing
The master price book is the single source of truth. Adding a line to a quote copies the current
rate onto that quote, then it becomes independently editable — so changing a master rate never
rewrites historical quotes, and discounting one job never touches the master rate. Overridden lines
are flagged against the book rate on both the builder and the finished quote.

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000
```

### Demo credentials

| Area | Credentials |
|---|---|
| Staff admin (`/admin`) | `admin` / `caravan2026` |
| Customer portal (`/portal`) | Job code `CCP-2026-001`, access code `VAN123` |

Other seeded jobs: `CCP-2026-002` / `VAN456`, `CCP-2026-003` / `VAN789`, `CCP-2026-004` / `VAN321`.

## Testing

```bash
npm run build          # Playwright runs against the production build
npm test               # all 155 tests, desktop + mobile
npm run test:ui        # interactive runner
```

Coverage includes: every page returning 200 with a single `<h1>`, **every internal link on every
page asserted to resolve**, desktop and mobile navigation, cart and checkout maths, contact form
success and validation paths, portal auth (including that internal notes never leak to customers),
admin auth on every route, calendar rendering and navigation, job/task creation with generated
codes, quote maths with GST, and price-override isolation from the master rate.

## Database

Demo mode needs nothing. To use Neon:

```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql
```

`db/schema.sql` enables **Row Level Security on every table**. Policies are driven by two
request-scoped settings the app sets per request:

```sql
select set_config('app.role',   'customer', true);
select set_config('app.job_id', '<uuid>',   true);
```

- Admin role: full access to all tables
- Customer role: read-only, scoped to their own job, and `job_updates` is additionally filtered to
  `visible_to_customer` — internal notes are unreachable at the database layer, not just in the UI
- Anonymous: may insert contact submissions and store orders, never read them

## Stripe

The store runs in enquiry mode until keys are present: orders are recorded and shown in the admin,
and the UI states clearly that a payment link will follow. `src/lib/stripe.ts` contains the
commented Checkout Session implementation — add `STRIPE_SECRET_KEY`, uncomment, and add a webhook
route at `/api/stripe/webhook` to mark orders paid.

## Environment variables

See `.env.example`. All are optional for the demo; set `AUTH_SECRET`, `ADMIN_USERNAME` and
`ADMIN_PASSWORD` before any real deployment.

## Notes on the rebuild

Imagery is inline SVG rather than photography — the original site's photos are the client's, so the
demo uses illustrated caravans whose colours are data-driven (this is what powers the before/after
gallery). Swapping in real photos means replacing `VanArt` with `next/image`.
