export type JobStatus =
  | "booked"
  | "in_progress"
  | "awaiting_parts"
  | "quality_check"
  | "completed";

export type TaskStatus = "todo" | "in_progress" | "done";

/** Where the van physically is. Add sites here as the business grows. */
export type JobLocation = "workshop" | "bellmere";

export const JOB_LOCATION_LABELS: Record<JobLocation, string> = {
  workshop: "Workshop",
  bellmere: "Bellmere",
};

export const JOB_LOCATIONS = Object.keys(JOB_LOCATION_LABELS) as JobLocation[];

/** "admin" sees everything; "staff" is limited to work and their own hours. */
export type AccessLevel = "admin" | "staff";

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  admin: "Full access (owner/manager)",
  staff: "Staff — jobs, tasks and own timesheet",
};

export interface Staff {
  id: string;
  name: string;
  role: string;
  active: boolean;
  username: string; // "" when they have no login yet
  accessLevel: AccessLevel;
  hasLogin: boolean;
  // Payroll
  hourlyRateCents: number;
  overtimeMultiplier: number; // e.g. 2.5 = time and a half plus
  overtimeAfterHours: number; // weekly threshold before overtime applies
  defaultBreakMinutes: number; // unpaid, prefilled on new entries
  createdAt: string;
}

export interface TimesheetEntry {
  id: string;
  staffId: string;
  jobId: string; // "" when not against a specific job
  workDate: string; // ISO date
  hours: number; // hours on site, before the break is taken off
  breakMinutes: number; // unpaid
  notes: string;
  createdAt: string;
}

export const PAYROLL_DEFAULTS = {
  breakMinutes: 30,
  overtimeMultiplier: 1.5,
  overtimeAfterHours: 38,
} as const;

/** Hours actually paid for one entry — on-site time less the unpaid break. */
export function paidHours(entry: Pick<TimesheetEntry, "hours" | "breakMinutes">): number {
  return Math.max(0, entry.hours - entry.breakMinutes / 60);
}

export interface WeekPay {
  weekStart: string;
  paidHours: number;
  ordinaryHours: number;
  overtimeHours: number;
  ordinaryPayCents: number;
  overtimePayCents: number;
  totalPayCents: number;
}

/**
 * Splits a week's paid hours into ordinary and overtime, then values them.
 * Overtime applies past the staff member's weekly threshold.
 */
export function calculateWeekPay(
  weekStartDate: string,
  entries: TimesheetEntry[],
  staff: Pick<
    Staff,
    "hourlyRateCents" | "overtimeMultiplier" | "overtimeAfterHours"
  >
): WeekPay {
  const total = entries.reduce((sum, e) => sum + paidHours(e), 0);
  const threshold = staff.overtimeAfterHours;
  const ordinaryHours = Math.min(total, threshold);
  const overtimeHours = Math.max(0, total - threshold);

  const ordinaryPayCents = Math.round(ordinaryHours * staff.hourlyRateCents);
  const overtimePayCents = Math.round(
    overtimeHours * staff.hourlyRateCents * staff.overtimeMultiplier
  );

  return {
    weekStart: weekStartDate,
    paidHours: total,
    ordinaryHours,
    overtimeHours,
    ordinaryPayCents,
    overtimePayCents,
    totalPayCents: ordinaryPayCents + overtimePayCents,
  };
}

/** Monday-start week key, used to group hours for payroll. */
export function weekStart(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(2).replace(/\.00$/, "")} h`;
}

export interface Job {
  id: string;
  jobCode: string; // e.g. CCP-2026-001
  title: string;
  customerName: string;
  customerEmail: string;
  vanMakeModel: string;
  status: JobStatus;
  accessCode: string; // customer portal access code
  scheduledStart: string; // ISO date
  scheduledEnd: string; // ISO date
  assignedTo: string; // staff id, "" when unallocated
  location: JobLocation;
  notes: string;
  createdAt: string;
}

export interface Task {
  id: string;
  jobId: string;
  workId: string; // e.g. CCP-2026-001-W01
  title: string;
  assignee: string;
  status: TaskStatus;
  createdAt: string;
}

export interface JobUpdate {
  id: string;
  jobId: string;
  author: string;
  message: string;
  visibleToCustomer: boolean;
  photoUrls: string[];
  createdAt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  description: string;
  art: { body: string; stripe: string; accent: string };
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  createdAt: string;
}

export interface OrderEnquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { productId: string; name: string; qty: number; priceCents: number }[];
  totalCents: number;
  status: "enquiry" | "paid";
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  vanMakeModel: string;
  description: string;
  jobType: string;
  before: { body: string; stripe: string; accent: string };
  after: { body: string; stripe: string; accent: string };
}

export interface PriceBookItem {
  id: string;
  code: string; // e.g. PB-EXT-01
  name: string;
  category: string;
  unit: string; // "each" | "per panel" | "per hour" | "per m²" ...
  priceCents: number;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export interface QuoteLine {
  id: string;
  priceBookItemId: string | null; // null = custom line
  description: string;
  qty: number;
  unitPriceCents: number; // prefilled from price book, editable per quote
}

export interface Quote {
  id: string;
  quoteNumber: string; // e.g. Q-2026-001
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vanMakeModel: string;
  status: QuoteStatus;
  lines: QuoteLine[];
  notes: string;
  validUntil: string; // ISO date
  createdAt: string;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
};

export function quoteSubtotalCents(q: Pick<Quote, "lines">): number {
  return q.lines.reduce((sum, l) => sum + l.qty * l.unitPriceCents, 0);
}

export function gstCents(subtotalCents: number): number {
  return Math.round(subtotalCents * 0.1);
}

export function formatAud(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  booked: "Booked In",
  in_progress: "In Progress",
  awaiting_parts: "Awaiting Parts",
  quality_check: "Quality Check",
  completed: "Completed",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};
