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

// ---------- Stock and suppliers ----------

export type StockCategory =
  | "paint"
  | "parts"
  | "trim"
  | "acrylic"
  | "doors"
  | "windows"
  | "consumables"
  | "other";

export const STOCK_CATEGORY_LABELS: Record<StockCategory, string> = {
  paint: "Paint",
  parts: "Parts",
  trim: "Trim",
  acrylic: "Acrylic / Perspex",
  doors: "Doors",
  windows: "Windows",
  consumables: "Consumables",
  other: "Other",
};

export const STOCK_CATEGORIES = Object.keys(
  STOCK_CATEGORY_LABELS
) as StockCategory[];

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  accountNumber: string;
  notes: string;
  createdAt: string;
}

/** An entry in the supplier logbook — calls, orders, issues, price changes. */
export interface SupplierLogEntry {
  id: string;
  supplierId: string;
  entry: string;
  author: string;
  createdAt: string;
}

export interface StockItem {
  id: string;
  ccpCode: string; // CCP-S-0001 — our own barcode
  barcode: string; // manufacturer/EAN barcode, "" if none
  name: string;
  category: StockCategory;
  unit: string;
  qtyOnHand: number;
  reorderLevel: number;
  costCents: number; // what we pay
  saleCents: number; // what we charge
  supplierId: string;
  location: string; // shelf/bay
  notes: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  delta: number; // + received, − used
  reason: string;
  author: string;
  createdAt: string;
}

export function marginCents(item: Pick<StockItem, "costCents" | "saleCents">) {
  return item.saleCents - item.costCents;
}

/** Margin as a percentage of the sale price, which is how retail quotes it. */
export function marginPercent(
  item: Pick<StockItem, "costCents" | "saleCents">
): number {
  if (item.saleCents <= 0) return 0;
  return Math.round((marginCents(item) / item.saleCents) * 100);
}

/** Markup on cost — the number you multiply cost by. Distinct from margin. */
export function markupPercent(
  item: Pick<StockItem, "costCents" | "saleCents">
): number {
  if (item.costCents <= 0) return 0;
  return Math.round((marginCents(item) / item.costCents) * 100);
}

export function stockValueAtCost(items: StockItem[]): number {
  return items.reduce((sum, i) => sum + i.qtyOnHand * i.costCents, 0);
}

export function stockValueAtSale(items: StockItem[]): number {
  return items.reduce((sum, i) => sum + i.qtyOnHand * i.saleCents, 0);
}

export function isLowStock(item: StockItem): boolean {
  return item.reorderLevel > 0 && item.qtyOnHand <= item.reorderLevel;
}

// ---------- Invoicing ----------

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  cancelled: "Cancelled",
};

export type PaymentMethod = "stripe" | "bank" | "cash" | "card";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  stripe: "Card (Stripe)",
  bank: "Bank transfer",
  cash: "Cash",
  card: "Card (in person)",
};

export interface InvoiceLine {
  id: string;
  description: string;
  qty: number;
  unitPriceCents: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string;
  paidAt: string;
  recordedBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2026-001
  jobId: string; // "" when not tied to a job
  customerName: string;
  customerEmail: string;
  status: InvoiceStatus;
  issuedDate: string; // ISO date
  dueDate: string; // ISO date
  notes: string;
  lines: InvoiceLine[];
  payments: Payment[];
  createdAt: string;
}

export function invoiceSubtotalCents(inv: Pick<Invoice, "lines">): number {
  return inv.lines.reduce((sum, l) => sum + l.qty * l.unitPriceCents, 0);
}

export function invoiceTotalCents(inv: Pick<Invoice, "lines">): number {
  const sub = invoiceSubtotalCents(inv);
  return sub + gstCents(sub);
}

export function invoicePaidCents(inv: Pick<Invoice, "payments">): number {
  return inv.payments.reduce((sum, p) => sum + p.amountCents, 0);
}

export function invoiceBalanceCents(
  inv: Pick<Invoice, "lines" | "payments">
): number {
  return Math.max(0, invoiceTotalCents(inv) - invoicePaidCents(inv));
}

/** 0–100, for the payment progress bar. */
export function invoicePaidPercent(
  inv: Pick<Invoice, "lines" | "payments">
): number {
  const total = invoiceTotalCents(inv);
  if (total <= 0) return 0;
  return Math.min(100, Math.round((invoicePaidCents(inv) / total) * 100));
}

export function isInvoiceSettled(
  inv: Pick<Invoice, "lines" | "payments" | "status">
): boolean {
  if (inv.status === "cancelled") return false;
  return invoiceTotalCents(inv) > 0 && invoiceBalanceCents(inv) === 0;
}

export function isInvoiceOverdue(
  inv: Pick<Invoice, "lines" | "payments" | "status" | "dueDate">,
  today = new Date().toISOString().slice(0, 10)
): boolean {
  if (inv.status !== "sent") return false;
  return inv.dueDate < today && invoiceBalanceCents(inv) > 0;
}

/**
 * What the customer should see: the explicit status, unless payments or the
 * due date tell a truer story.
 */
export function invoiceDisplayStatus(
  inv: Pick<Invoice, "lines" | "payments" | "status" | "dueDate">
): { label: string; tone: "slate" | "brand" | "green" | "amber" | "red" } {
  if (inv.status === "cancelled") return { label: "Cancelled", tone: "slate" };
  if (inv.status === "draft") return { label: "Draft", tone: "slate" };
  if (isInvoiceSettled(inv)) return { label: "Paid in full", tone: "green" };
  if (invoicePaidCents(inv) > 0) {
    return { label: "Part paid", tone: "amber" };
  }
  if (isInvoiceOverdue(inv)) return { label: "Overdue", tone: "red" };
  return { label: "Awaiting payment", tone: "brand" };
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
