import { neon } from "@neondatabase/serverless";
import {
  demoContacts,
  demoGallery,
  demoJobs,
  demoOrders,
  demoPriceBook,
  demoProducts,
  demoQuotes,
  demoTasks,
  demoUpdates,
} from "./demo-data";
import type {
  ContactSubmission,
  GalleryItem,
  Job,
  JobStatus,
  JobUpdate,
  OrderEnquiry,
  PriceBookItem,
  Product,
  Quote,
  QuoteLine,
  QuoteStatus,
  Task,
  TaskStatus,
} from "./types";

// Data layer with two backends:
//  - Demo mode (default): seeded in-memory store so the deployed demo works with zero setup.
//  - Neon Postgres: set DATABASE_URL and run db/schema.sql + db/seed.sql. RLS policies included.

function makeId() {
  return crypto.randomUUID();
}

interface MemoryStore {
  jobs: Job[];
  tasks: Task[];
  updates: JobUpdate[];
  products: Product[];
  gallery: GalleryItem[];
  contacts: ContactSubmission[];
  orders: OrderEnquiry[];
  priceBook: PriceBookItem[];
  quotes: Quote[];
}

const globalStore = globalThis as unknown as { __ccpStore?: MemoryStore };

function mem(): MemoryStore {
  if (!globalStore.__ccpStore) {
    globalStore.__ccpStore = {
      jobs: structuredClone(demoJobs),
      tasks: structuredClone(demoTasks),
      updates: structuredClone(demoUpdates),
      products: structuredClone(demoProducts),
      gallery: structuredClone(demoGallery),
      contacts: structuredClone(demoContacts),
      orders: structuredClone(demoOrders),
      priceBook: structuredClone(demoPriceBook),
      quotes: structuredClone(demoQuotes),
    };
  }
  return globalStore.__ccpStore;
}

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// Lazy init — never create the client at module top level (build-time safety).
// The driver's return type is a union; we narrow it to plain rows for ergonomics.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Row[]>;
/* eslint-enable @typescript-eslint/no-explicit-any */

let _sql: SqlTag | null = null;
function sql(): SqlTag {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!) as unknown as SqlTag;
  return _sql;
}

// The Postgres driver hydrates `date` and `timestamptz` columns into JS Date
// objects. Calling String() on those yields a locale string ("Mon Jul 13 2026
// …"), which breaks the calendar's date-string comparisons and renders badly.
// Normalise to the same ISO shapes the demo dataset uses.
function toDateStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "").slice(0, 10);
}

function toIsoStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v ?? "");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const jobFromRow = (r: any): Job => ({
  id: r.id,
  jobCode: r.job_code,
  title: r.title,
  customerName: r.customer_name,
  customerEmail: r.customer_email ?? "",
  vanMakeModel: r.van_make_model ?? "",
  status: r.status,
  accessCode: r.access_code,
  scheduledStart: toDateStr(r.scheduled_start),
  scheduledEnd: toDateStr(r.scheduled_end),
  notes: r.notes ?? "",
  createdAt: toIsoStr(r.created_at),
});

const taskFromRow = (r: any): Task => ({
  id: r.id,
  jobId: r.job_id,
  workId: r.work_id,
  title: r.title,
  assignee: r.assignee ?? "",
  status: r.status,
  createdAt: toIsoStr(r.created_at),
});

const updateFromRow = (r: any): JobUpdate => ({
  id: r.id,
  jobId: r.job_id,
  author: r.author,
  message: r.message,
  visibleToCustomer: r.visible_to_customer,
  createdAt: toIsoStr(r.created_at),
});

const priceFromRow = (r: any): PriceBookItem => ({
  id: r.id,
  code: r.code,
  name: r.name,
  category: r.category,
  unit: r.unit,
  priceCents: Number(r.price_cents),
});

const quoteFromRow = (r: any, lines: QuoteLine[]): Quote => ({
  id: r.id,
  quoteNumber: r.quote_number,
  customerName: r.customer_name,
  customerEmail: r.customer_email ?? "",
  customerPhone: r.customer_phone ?? "",
  vanMakeModel: r.van_make_model ?? "",
  status: r.status,
  notes: r.notes ?? "",
  validUntil: toDateStr(r.valid_until),
  createdAt: toIsoStr(r.created_at),
  lines,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- Jobs ----------

export async function listJobs(): Promise<Job[]> {
  if (hasDatabase()) {
    const rows = await sql()`select * from jobs order by scheduled_start`;
    return rows.map(jobFromRow);
  }
  return [...mem().jobs].sort((a, b) =>
    a.scheduledStart.localeCompare(b.scheduledStart)
  );
}

export async function getJob(id: string): Promise<Job | null> {
  if (hasDatabase()) {
    const rows = await sql()`select * from jobs where id = ${id}`;
    return rows[0] ? jobFromRow(rows[0]) : null;
  }
  return mem().jobs.find((j) => j.id === id) ?? null;
}

export async function findJobByCredentials(
  jobCode: string,
  accessCode: string
): Promise<Job | null> {
  if (hasDatabase()) {
    const rows = await sql()`
      select * from jobs
      where upper(job_code) = upper(${jobCode})
        and upper(access_code) = upper(${accessCode})`;
    return rows[0] ? jobFromRow(rows[0]) : null;
  }
  return (
    mem().jobs.find(
      (j) =>
        j.jobCode.toUpperCase() === jobCode.trim().toUpperCase() &&
        j.accessCode.toUpperCase() === accessCode.trim().toUpperCase()
    ) ?? null
  );
}

export async function nextJobCode(): Promise<string> {
  const year = new Date().getFullYear();
  const jobs = await listJobs();
  const nums = jobs
    .map((j) => /^CCP-(\d{4})-(\d+)$/.exec(j.jobCode))
    .filter((m): m is RegExpExecArray => !!m && Number(m[1]) === year)
    .map((m) => Number(m[2]));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `CCP-${year}-${String(next).padStart(3, "0")}`;
}

export async function createJob(
  input: Omit<Job, "id" | "createdAt">
): Promise<Job> {
  const job: Job = {
    ...input,
    id: makeId(),
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    await sql()`
      insert into jobs (id, job_code, title, customer_name, customer_email, van_make_model,
                        status, access_code, scheduled_start, scheduled_end, notes, created_at)
      values (${job.id}, ${job.jobCode}, ${job.title}, ${job.customerName}, ${job.customerEmail},
              ${job.vanMakeModel}, ${job.status}, ${job.accessCode}, ${job.scheduledStart},
              ${job.scheduledEnd}, ${job.notes}, ${job.createdAt})`;
    return job;
  }
  mem().jobs.push(job);
  return job;
}

export async function updateJobStatus(
  id: string,
  status: JobStatus
): Promise<Job | null> {
  if (hasDatabase()) {
    await sql()`update jobs set status = ${status} where id = ${id}`;
    return getJob(id);
  }
  const job = mem().jobs.find((j) => j.id === id);
  if (job) job.status = status;
  return job ?? null;
}

// ---------- Tasks ----------

export async function listTasks(jobId?: string): Promise<Task[]> {
  if (hasDatabase()) {
    const rows = jobId
      ? await sql()`select * from tasks where job_id = ${jobId} order by work_id`
      : await sql()`select * from tasks order by work_id`;
    return rows.map(taskFromRow);
  }
  const all = [...mem().tasks].sort((a, b) => a.workId.localeCompare(b.workId));
  return jobId ? all.filter((t) => t.jobId === jobId) : all;
}

export async function createTask(
  jobId: string,
  title: string,
  assignee: string
): Promise<Task | null> {
  const job = await getJob(jobId);
  if (!job) return null;
  const existing = await listTasks(jobId);
  const nums = existing
    .map((t) => /-W(\d+)$/.exec(t.workId))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => Number(m[1]));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  const task: Task = {
    id: makeId(),
    jobId,
    workId: `${job.jobCode}-W${String(next).padStart(2, "0")}`,
    title,
    assignee,
    status: "todo",
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    await sql()`
      insert into tasks (id, job_id, work_id, title, assignee, status, created_at)
      values (${task.id}, ${task.jobId}, ${task.workId}, ${task.title},
              ${task.assignee}, ${task.status}, ${task.createdAt})`;
    return task;
  }
  mem().tasks.push(task);
  return task;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<Task | null> {
  if (hasDatabase()) {
    await sql()`update tasks set status = ${status} where id = ${id}`;
    const rows = await sql()`select * from tasks where id = ${id}`;
    return rows[0] ? taskFromRow(rows[0]) : null;
  }
  const task = mem().tasks.find((t) => t.id === id);
  if (task) task.status = status;
  return task ?? null;
}

// ---------- Job updates ----------

export async function listUpdates(
  jobId: string,
  customerVisibleOnly = false
): Promise<JobUpdate[]> {
  if (hasDatabase()) {
    const rows = customerVisibleOnly
      ? await sql()`select * from job_updates where job_id = ${jobId} and visible_to_customer order by created_at desc`
      : await sql()`select * from job_updates where job_id = ${jobId} order by created_at desc`;
    return rows.map(updateFromRow);
  }
  return mem()
    .updates.filter(
      (u) =>
        u.jobId === jobId && (!customerVisibleOnly || u.visibleToCustomer)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addUpdate(
  jobId: string,
  author: string,
  message: string,
  visibleToCustomer: boolean
): Promise<JobUpdate> {
  const update: JobUpdate = {
    id: makeId(),
    jobId,
    author,
    message,
    visibleToCustomer,
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    await sql()`
      insert into job_updates (id, job_id, author, message, visible_to_customer, created_at)
      values (${update.id}, ${update.jobId}, ${update.author}, ${update.message},
              ${update.visibleToCustomer}, ${update.createdAt})`;
    return update;
  }
  mem().updates.push(update);
  return update;
}

// ---------- Products / gallery ----------

export async function listProducts(): Promise<Product[]> {
  return mem().products; // static catalogue; move to DB when Stripe lands
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await listProducts()).find((p) => p.slug === slug) ?? null;
}

export async function listGallery(): Promise<GalleryItem[]> {
  return mem().gallery;
}

// ---------- Contact + orders ----------

export async function addContact(
  input: Omit<ContactSubmission, "id" | "createdAt">
): Promise<ContactSubmission> {
  const c: ContactSubmission = {
    ...input,
    id: makeId(),
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    await sql()`
      insert into contact_submissions (id, name, email, phone, service, message, created_at)
      values (${c.id}, ${c.name}, ${c.email}, ${c.phone}, ${c.service}, ${c.message}, ${c.createdAt})`;
    return c;
  }
  mem().contacts.push(c);
  return c;
}

export async function listContacts(): Promise<ContactSubmission[]> {
  if (hasDatabase()) {
    const rows =
      await sql()`select * from contact_submissions order by created_at desc`;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone ?? "",
      service: r.service ?? "",
      message: r.message,
      createdAt: toIsoStr(r.created_at),
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
  return [...mem().contacts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function addOrderEnquiry(
  input: Omit<OrderEnquiry, "id" | "createdAt" | "status">
): Promise<OrderEnquiry> {
  const o: OrderEnquiry = {
    ...input,
    id: makeId(),
    status: "enquiry",
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    await sql()`
      insert into order_enquiries (id, customer_name, customer_email, items, total_cents, status, created_at)
      values (${o.id}, ${o.customerName}, ${o.customerEmail}, ${JSON.stringify(o.items)},
              ${o.totalCents}, ${o.status}, ${o.createdAt})`;
    return o;
  }
  mem().orders.push(o);
  return o;
}

export async function listOrders(): Promise<OrderEnquiry[]> {
  if (hasDatabase()) {
    const rows =
      await sql()`select * from order_enquiries order by created_at desc`;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return rows.map((r: any) => ({
      id: r.id,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      items: typeof r.items === "string" ? JSON.parse(r.items) : r.items,
      totalCents: Number(r.total_cents),
      status: r.status,
      createdAt: toIsoStr(r.created_at),
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
  return [...mem().orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

// ---------- Price book ----------

export async function listPriceBook(): Promise<PriceBookItem[]> {
  if (hasDatabase()) {
    const rows = await sql()`select * from price_book order by category, code`;
    return rows.map(priceFromRow);
  }
  return [...mem().priceBook].sort(
    (a, b) => a.category.localeCompare(b.category) || a.code.localeCompare(b.code)
  );
}

export async function upsertPriceBookItem(
  input: Omit<PriceBookItem, "id"> & { id?: string }
): Promise<PriceBookItem> {
  const item: PriceBookItem = { ...input, id: input.id ?? makeId() };
  if (hasDatabase()) {
    await sql()`
      insert into price_book (id, code, name, category, unit, price_cents)
      values (${item.id}, ${item.code}, ${item.name}, ${item.category}, ${item.unit}, ${item.priceCents})
      on conflict (id) do update
        set code = excluded.code, name = excluded.name, category = excluded.category,
            unit = excluded.unit, price_cents = excluded.price_cents`;
    return item;
  }
  const store = mem();
  const idx = store.priceBook.findIndex((p) => p.id === item.id);
  if (idx >= 0) store.priceBook[idx] = item;
  else store.priceBook.push(item);
  return item;
}

export async function deletePriceBookItem(id: string): Promise<void> {
  if (hasDatabase()) {
    await sql()`delete from price_book where id = ${id}`;
    return;
  }
  const store = mem();
  store.priceBook = store.priceBook.filter((p) => p.id !== id);
}

// ---------- Quotes ----------

export async function listQuotes(): Promise<Quote[]> {
  if (hasDatabase()) {
    const rows = await sql()`select * from quotes order by created_at desc`;
    const lineRows = await sql()`select * from quote_lines order by created_at`;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return rows.map((r: any) =>
      quoteFromRow(
        r,
        lineRows
          .filter((l: any) => l.quote_id === r.id)
          .map((l: any) => ({
            id: l.id,
            priceBookItemId: l.price_book_item_id,
            description: l.description,
            qty: Number(l.qty),
            unitPriceCents: Number(l.unit_price_cents),
          }))
      )
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
  return [...mem().quotes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getQuote(id: string): Promise<Quote | null> {
  return (await listQuotes()).find((q) => q.id === id) ?? null;
}

export async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const quotes = await listQuotes();
  const nums = quotes
    .map((q) => /^Q-(\d{4})-(\d+)$/.exec(q.quoteNumber))
    .filter((m): m is RegExpExecArray => !!m && Number(m[1]) === year)
    .map((m) => Number(m[2]));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `Q-${year}-${String(next).padStart(3, "0")}`;
}

export async function createQuote(
  input: Omit<Quote, "id" | "createdAt" | "quoteNumber" | "lines"> & {
    lines: Omit<QuoteLine, "id">[];
  }
): Promise<Quote> {
  const quote: Quote = {
    ...input,
    id: makeId(),
    quoteNumber: await nextQuoteNumber(),
    createdAt: new Date().toISOString(),
    lines: input.lines.map((l) => ({ ...l, id: makeId() })),
  };
  if (hasDatabase()) {
    await sql()`
      insert into quotes (id, quote_number, customer_name, customer_email, customer_phone,
                          van_make_model, status, notes, valid_until, created_at)
      values (${quote.id}, ${quote.quoteNumber}, ${quote.customerName}, ${quote.customerEmail},
              ${quote.customerPhone}, ${quote.vanMakeModel}, ${quote.status}, ${quote.notes},
              ${quote.validUntil}, ${quote.createdAt})`;
    for (const l of quote.lines) {
      await sql()`
        insert into quote_lines (id, quote_id, price_book_item_id, description, qty, unit_price_cents)
        values (${l.id}, ${quote.id}, ${l.priceBookItemId}, ${l.description}, ${l.qty}, ${l.unitPriceCents})`;
    }
    return quote;
  }
  mem().quotes.push(quote);
  return quote;
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<Quote | null> {
  if (hasDatabase()) {
    await sql()`update quotes set status = ${status} where id = ${id}`;
    return getQuote(id);
  }
  const quote = mem().quotes.find((q) => q.id === id);
  if (quote) quote.status = status;
  return quote ?? null;
}

export function isDemoMode(): boolean {
  return !hasDatabase();
}
