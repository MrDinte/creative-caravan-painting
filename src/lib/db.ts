import { neon } from "@neondatabase/serverless";
import {
  demoContacts,
  demoGallery,
  demoJobs,
  demoOrders,
  demoPriceBook,
  demoProducts,
  demoQuotes,
  demoStaff,
  demoStaffPasswords,
  demoTasks,
  demoTimesheets,
  demoUpdates,
} from "./demo-data";
import type {
  AccessLevel,
  ContactSubmission,
  GalleryItem,
  Job,
  JobLocation,
  JobStatus,
  Staff,
  TimesheetEntry,
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
import { PAYROLL_DEFAULTS } from "./types";

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
  staff: Staff[];
  timesheets: TimesheetEntry[];
  staffPasswords: Record<string, string>;
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
      staff: structuredClone(demoStaff),
      timesheets: structuredClone(demoTimesheets),
      staffPasswords: { ...demoStaffPasswords },
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
  assignedTo: r.assigned_to ?? "",
  location: (r.location ?? "workshop") as JobLocation,
  notes: r.notes ?? "",
  createdAt: toIsoStr(r.created_at),
});

const staffFromRow = (r: any): Staff => ({
  id: r.id,
  name: r.name,
  role: r.role ?? "",
  active: r.active ?? true,
  username: r.username ?? "",
  accessLevel: (r.access_level ?? "staff") as AccessLevel,
  hasLogin: Boolean(r.password_hash),
  hourlyRateCents: Number(r.hourly_rate_cents ?? 0),
  overtimeMultiplier: Number(
    r.overtime_multiplier ?? PAYROLL_DEFAULTS.overtimeMultiplier
  ),
  overtimeAfterHours: Number(
    r.overtime_after_hours ?? PAYROLL_DEFAULTS.overtimeAfterHours
  ),
  defaultBreakMinutes: Number(
    r.default_break_minutes ?? PAYROLL_DEFAULTS.breakMinutes
  ),
  createdAt: toIsoStr(r.created_at),
});

const timesheetFromRow = (r: any): TimesheetEntry => ({
  id: r.id,
  staffId: r.staff_id,
  jobId: r.job_id ?? "",
  workDate: toDateStr(r.work_date),
  hours: Number(r.hours),
  breakMinutes: Number(r.break_minutes ?? PAYROLL_DEFAULTS.breakMinutes),
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
  photoUrls: parsePhotoUrls(r.photo_urls),
  createdAt: toIsoStr(r.created_at),
});

// jsonb comes back as a parsed array, but older drivers hand back a string.
function parsePhotoUrls(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((u): u is string => typeof u === "string");
  if (typeof v === "string" && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.filter((u) => typeof u === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

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
                        status, access_code, scheduled_start, scheduled_end, assigned_to,
                        location, notes, created_at)
      values (${job.id}, ${job.jobCode}, ${job.title}, ${job.customerName}, ${job.customerEmail},
              ${job.vanMakeModel}, ${job.status}, ${job.accessCode}, ${job.scheduledStart},
              ${job.scheduledEnd}, ${job.assignedTo || null}, ${job.location},
              ${job.notes}, ${job.createdAt})`;
    return job;
  }
  mem().jobs.push(job);
  return job;
}

/** Editable fields on an existing job. Job code and access code never change. */
export type JobEdit = Pick<
  Job,
  | "title"
  | "customerName"
  | "customerEmail"
  | "vanMakeModel"
  | "scheduledStart"
  | "scheduledEnd"
  | "assignedTo"
  | "location"
  | "notes"
>;

export async function updateJob(
  id: string,
  edit: JobEdit
): Promise<Job | null> {
  if (hasDatabase()) {
    await sql()`
      update jobs
         set title = ${edit.title},
             customer_name = ${edit.customerName},
             customer_email = ${edit.customerEmail},
             van_make_model = ${edit.vanMakeModel},
             scheduled_start = ${edit.scheduledStart},
             scheduled_end = ${edit.scheduledEnd},
             assigned_to = ${edit.assignedTo || null},
             location = ${edit.location},
             notes = ${edit.notes}
       where id = ${id}`;
    return getJob(id);
  }
  const job = mem().jobs.find((j) => j.id === id);
  if (!job) return null;
  Object.assign(job, edit);
  return job;
}

// ---------- Staff ----------

export async function listStaff(activeOnly = false): Promise<Staff[]> {
  if (hasDatabase()) {
    const rows = activeOnly
      ? await sql()`select * from staff where active order by name`
      : await sql()`select * from staff order by active desc, name`;
    return rows.map(staffFromRow);
  }
  const all = [...mem().staff].sort(
    (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)
  );
  return activeOnly ? all.filter((s) => s.active) : all;
}

export async function getStaff(id: string): Promise<Staff | null> {
  if (hasDatabase()) {
    const rows = await sql()`select * from staff where id = ${id}`;
    return rows[0] ? staffFromRow(rows[0]) : null;
  }
  return mem().staff.find((s) => s.id === id) ?? null;
}

export async function createStaff(
  name: string,
  role: string
): Promise<Staff> {
  const member: Staff = {
    id: makeId(),
    name,
    role,
    active: true,
    username: "",
    accessLevel: "staff",
    hasLogin: false,
    hourlyRateCents: 0,
    overtimeMultiplier: PAYROLL_DEFAULTS.overtimeMultiplier,
    overtimeAfterHours: PAYROLL_DEFAULTS.overtimeAfterHours,
    defaultBreakMinutes: PAYROLL_DEFAULTS.breakMinutes,
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    await sql()`
      insert into staff (id, name, role, active, access_level, created_at)
      values (${member.id}, ${member.name}, ${member.role}, true, 'staff', ${member.createdAt})`;
    return member;
  }
  mem().staff.push(member);
  return member;
}

export async function updateStaff(
  id: string,
  changes: { name: string; role: string; active: boolean }
): Promise<Staff | null> {
  if (hasDatabase()) {
    await sql()`
      update staff set name = ${changes.name}, role = ${changes.role},
                       active = ${changes.active}
       where id = ${id}`;
    return getStaff(id);
  }
  const member = mem().staff.find((s) => s.id === id);
  if (!member) return null;
  Object.assign(member, changes);
  return member;
}

// ---------- Staff logins ----------

export async function findStaffByUsername(
  username: string
): Promise<{ staff: Staff; passwordHash: string } | null> {
  const uname = username.trim().toLowerCase();
  if (!uname) return null;

  if (hasDatabase()) {
    const rows =
      await sql()`select * from staff where lower(username) = ${uname}`;
    const row = rows[0];
    if (!row?.password_hash) return null;
    return { staff: staffFromRow(row), passwordHash: row.password_hash };
  }
  const store = mem();
  const member = store.staff.find(
    (s) => s.username.toLowerCase() === uname
  );
  const hash = member ? store.staffPasswords[member.id] : undefined;
  if (!member || !hash) return null;
  return { staff: member, passwordHash: hash };
}

export async function isUsernameTaken(
  username: string,
  exceptStaffId?: string
): Promise<boolean> {
  const uname = username.trim().toLowerCase();
  if (!uname) return false;

  if (hasDatabase()) {
    const rows = exceptStaffId
      ? await sql()`select id from staff where lower(username) = ${uname} and id <> ${exceptStaffId}`
      : await sql()`select id from staff where lower(username) = ${uname}`;
    return rows.length > 0;
  }
  return mem().staff.some(
    (s) => s.username.toLowerCase() === uname && s.id !== exceptStaffId
  );
}

export async function setStaffLogin(
  id: string,
  username: string,
  passwordHash: string | null,
  accessLevel: AccessLevel
): Promise<Staff | null> {
  if (hasDatabase()) {
    if (passwordHash) {
      await sql()`
        update staff set username = ${username}, password_hash = ${passwordHash},
                         access_level = ${accessLevel}
         where id = ${id}`;
    } else {
      await sql()`
        update staff set username = ${username}, access_level = ${accessLevel}
         where id = ${id}`;
    }
    return getStaff(id);
  }
  const store = mem();
  const member = store.staff.find((s) => s.id === id);
  if (!member) return null;
  member.username = username;
  member.accessLevel = accessLevel;
  if (passwordHash) {
    store.staffPasswords[id] = passwordHash;
    member.hasLogin = true;
  }
  return member;
}

export async function setStaffPayroll(
  id: string,
  pay: {
    hourlyRateCents: number;
    overtimeMultiplier: number;
    overtimeAfterHours: number;
    defaultBreakMinutes: number;
  }
): Promise<Staff | null> {
  if (hasDatabase()) {
    await sql()`
      update staff
         set hourly_rate_cents = ${pay.hourlyRateCents},
             overtime_multiplier = ${pay.overtimeMultiplier},
             overtime_after_hours = ${pay.overtimeAfterHours},
             default_break_minutes = ${pay.defaultBreakMinutes}
       where id = ${id}`;
    return getStaff(id);
  }
  const member = mem().staff.find((s) => s.id === id);
  if (!member) return null;
  Object.assign(member, pay);
  return member;
}

export async function removeStaffLogin(id: string): Promise<void> {
  if (hasDatabase()) {
    await sql()`update staff set username = null, password_hash = null where id = ${id}`;
    return;
  }
  const store = mem();
  const member = store.staff.find((s) => s.id === id);
  if (member) {
    member.username = "";
    member.hasLogin = false;
    delete store.staffPasswords[id];
  }
}

// ---------- Timesheets ----------

export async function listTimesheets(filter?: {
  staffId?: string;
  from?: string;
  to?: string;
}): Promise<TimesheetEntry[]> {
  if (hasDatabase()) {
    const rows = filter?.staffId
      ? await sql()`
          select * from timesheet_entries
           where staff_id = ${filter.staffId}
           order by work_date desc, created_at desc`
      : await sql()`
          select * from timesheet_entries
           order by work_date desc, created_at desc`;
    const all = rows.map(timesheetFromRow);
    return applyDateRange(all, filter);
  }
  const all = [...mem().timesheets]
    .filter((t) => !filter?.staffId || t.staffId === filter.staffId)
    .sort(
      (a, b) =>
        b.workDate.localeCompare(a.workDate) ||
        b.createdAt.localeCompare(a.createdAt)
    );
  return applyDateRange(all, filter);
}

function applyDateRange(
  entries: TimesheetEntry[],
  filter?: { from?: string; to?: string }
): TimesheetEntry[] {
  return entries.filter(
    (t) =>
      (!filter?.from || t.workDate >= filter.from) &&
      (!filter?.to || t.workDate <= filter.to)
  );
}

export async function createTimesheetEntry(
  input: Omit<TimesheetEntry, "id" | "createdAt">
): Promise<TimesheetEntry> {
  const entry: TimesheetEntry = {
    ...input,
    id: makeId(),
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    await sql()`
      insert into timesheet_entries (id, staff_id, job_id, work_date, hours, notes, created_at)
      values (${entry.id}, ${entry.staffId}, ${entry.jobId || null},
              ${entry.workDate}, ${entry.hours}, ${entry.notes}, ${entry.createdAt})`;
    return entry;
  }
  mem().timesheets.push(entry);
  return entry;
}

export async function deleteTimesheetEntry(
  id: string,
  onlyStaffId?: string
): Promise<boolean> {
  if (hasDatabase()) {
    const rows = onlyStaffId
      ? await sql()`delete from timesheet_entries where id = ${id} and staff_id = ${onlyStaffId} returning id`
      : await sql()`delete from timesheet_entries where id = ${id} returning id`;
    return rows.length > 0;
  }
  const store = mem();
  const before = store.timesheets.length;
  store.timesheets = store.timesheets.filter(
    (t) => t.id !== id || (onlyStaffId ? t.staffId !== onlyStaffId : false)
  );
  return store.timesheets.length < before;
}

/**
 * Staff are deactivated rather than deleted so historical job allocations and
 * task assignees keep resolving to a real person.
 */
export async function deactivateStaff(id: string): Promise<void> {
  if (hasDatabase()) {
    await sql()`update staff set active = false where id = ${id}`;
    return;
  }
  const member = mem().staff.find((s) => s.id === id);
  if (member) member.active = false;
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
  visibleToCustomer: boolean,
  photoUrls: string[] = []
): Promise<JobUpdate> {
  const update: JobUpdate = {
    id: makeId(),
    jobId,
    author,
    message,
    visibleToCustomer,
    photoUrls,
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    await sql()`
      insert into job_updates (id, job_id, author, message, visible_to_customer,
                               photo_urls, created_at)
      values (${update.id}, ${update.jobId}, ${update.author}, ${update.message},
              ${update.visibleToCustomer}, ${JSON.stringify(photoUrls)},
              ${update.createdAt})`;
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

export async function findPriceBookItemByCode(
  code: string
): Promise<PriceBookItem | null> {
  if (hasDatabase()) {
    const rows =
      await sql()`select * from price_book where upper(code) = upper(${code})`;
    return rows[0] ? priceFromRow(rows[0]) : null;
  }
  return (
    mem().priceBook.find(
      (p) => p.code.toUpperCase() === code.trim().toUpperCase()
    ) ?? null
  );
}

/**
 * `code` is the natural key, not `id`. Adding a rate whose code already exists
 * updates that rate rather than raising a unique violation; editing an existing
 * rate is keyed on its id so the code itself can be changed.
 */
export async function upsertPriceBookItem(
  input: Omit<PriceBookItem, "id"> & { id?: string }
): Promise<PriceBookItem> {
  const item: PriceBookItem = { ...input, id: input.id ?? makeId() };

  if (hasDatabase()) {
    if (input.id) {
      await sql()`
        update price_book
           set code = ${item.code}, name = ${item.name}, category = ${item.category},
               unit = ${item.unit}, price_cents = ${item.priceCents}
         where id = ${input.id}`;
      return item;
    }
    const rows = await sql()`
      insert into price_book (id, code, name, category, unit, price_cents)
      values (${item.id}, ${item.code}, ${item.name}, ${item.category},
              ${item.unit}, ${item.priceCents})
      on conflict (code) do update
        set name = excluded.name, category = excluded.category,
            unit = excluded.unit, price_cents = excluded.price_cents
      returning id`;
    return { ...item, id: rows[0]?.id ?? item.id };
  }

  const store = mem();
  const idx = input.id
    ? store.priceBook.findIndex((p) => p.id === input.id)
    : store.priceBook.findIndex(
        (p) => p.code.toUpperCase() === item.code.toUpperCase()
      );
  if (idx >= 0) {
    store.priceBook[idx] = { ...item, id: store.priceBook[idx].id };
    return store.priceBook[idx];
  }
  store.priceBook.push(item);
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
