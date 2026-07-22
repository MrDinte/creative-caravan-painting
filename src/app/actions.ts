"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addContact,
  addOrderEnquiry,
  addUpdate,
  createJob,
  createQuote,
  createStaff,
  createTask,
  addSupplierLogEntry,
  adjustStock,
  createInvoice,
  createTimesheetEntry,
  clearShift,
  deactivateStaff,
  deleteTimesheetEntry,
  deletePriceBookItem,
  findJobByCredentials,
  findPriceBookItemByCode,
  findStockByCode,
  getInvoice,
  getJob,
  getStockItem,
  getOpenShift,
  getQuote,
  getStaff,
  isUsernameTaken,
  listQuotes,
  nextJobCode,
  recordPayment,
  setInvoiceStatus,
  removeStaffLogin,
  setStaffLogin,
  setStaffPayroll,
  startShift,
  upsertStockItem,
  upsertSupplier,
  updateJob,
  updateJobStatus,
  updateQuoteStatus,
  updateStaff,
  updateTaskStatus,
  upsertPriceBookItem,
} from "@/lib/db";
import {
  clearAdminSession,
  clearCustomerSession,
  createAdminSession,
  createCustomerSession,
  getAdminSession,
  authenticate,
} from "@/lib/auth";
import { hashPassword, passwordProblem } from "@/lib/password";
import { brisbaneDate, brisbaneTime, hoursBetween } from "@/lib/brisbane";
import type {
  AccessLevel,
  InvoiceStatus,
  JobLocation,
  PaymentMethod,
  StockCategory,
  JobStatus,
  QuoteStatus,
  TaskStatus,
} from "@/lib/types";
import {
  JOB_LOCATIONS,
  STOCK_CATEGORIES,
  formatAud,
  invoiceBalanceCents,
} from "@/lib/types";
import { isPlausibleBarcode } from "@/lib/barcode";

function parseLocation(v: FormDataEntryValue | null): JobLocation {
  const s = String(v ?? "");
  return (JOB_LOCATIONS as string[]).includes(s)
    ? (s as JobLocation)
    : "workshop";
}

export interface FormState {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

// ---------- Contact ----------

export async function submitContact(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, message: "Please fill in your name, email and message." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  await addContact({ name, email, phone, service, message });

  // Wire an email provider here (Resend / SendGrid) to notify the workshop.
  return {
    ok: true,
    message:
      "Thanks! Your message has landed with the team — we'll be in touch shortly.",
  };
}

// ---------- Store checkout ----------

export async function submitOrder(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!customerName || !customerEmail) {
    return { ok: false, message: "Please enter your name and email." };
  }
  if (!EMAIL_RE.test(customerEmail)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  let items: { productId: string; name: string; qty: number; priceCents: number }[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { ok: false, message: "Your cart could not be read. Please try again." };
  }
  if (!items.length) {
    return { ok: false, message: "Your cart is empty." };
  }

  const totalCents = items.reduce((s, i) => s + i.qty * i.priceCents, 0);
  await addOrderEnquiry({ customerName, customerEmail, items, totalCents });

  // No email is sent yet — don't claim one was. See README "Not built yet".
  return {
    ok: true,
    message:
      "Order received! The team will be in touch shortly to arrange payment and delivery.",
  };
}

// ---------- Customer portal auth ----------

export async function customerLogin(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const jobCode = String(formData.get("jobCode") ?? "").trim();
  const accessCode = String(formData.get("accessCode") ?? "").trim();

  if (!jobCode || !accessCode) {
    return { ok: false, message: "Enter both your job code and access code." };
  }

  const job = await findJobByCredentials(jobCode, accessCode);
  if (!job) {
    return { ok: false, message: "We couldn't match that job code and access code." };
  }

  await createCustomerSession({
    jobId: job.id,
    jobCode: job.jobCode,
    customerName: job.customerName,
  });
  redirect("/portal/job");
}

export async function customerLogout() {
  await clearCustomerSession();
  redirect("/portal");
}

// ---------- Admin auth ----------

export async function adminLogin(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const session = await authenticate(username, password);
  if (!session) {
    return { ok: false, message: "Incorrect username or password." };
  }
  await createAdminSession(session);
  redirect("/admin/dashboard");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin");
}

// ---------- Admin: jobs, tasks, updates ----------

export async function createJobAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const vanMakeModel = String(formData.get("vanMakeModel") ?? "").trim();
  const scheduledStart = String(formData.get("scheduledStart") ?? "");
  const scheduledEnd = String(formData.get("scheduledEnd") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!title || !customerName || !scheduledStart || !scheduledEnd) {
    return {
      ok: false,
      message: "Title, customer name and both dates are required.",
    };
  }
  if (scheduledEnd < scheduledStart) {
    return { ok: false, message: "End date must be on or after the start date." };
  }

  const jobCode = await nextJobCode();
  const accessCode = `VAN${Math.floor(100 + Math.random() * 900)}`;

  await createJob({
    jobCode,
    title,
    customerName,
    customerEmail,
    vanMakeModel,
    status: "booked",
    accessCode,
    scheduledStart,
    scheduledEnd,
    assignedTo: String(formData.get("assignedTo") ?? ""),
    location: parseLocation(formData.get("location")),
    notes,
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/calendar");
  return {
    ok: true,
    message: `Job ${jobCode} created. Customer access code: ${accessCode}`,
  };
}

export async function updateJobAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const id = String(formData.get("jobId"));
  const title = String(formData.get("title") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const scheduledStart = String(formData.get("scheduledStart") ?? "");
  const scheduledEnd = String(formData.get("scheduledEnd") ?? "");

  if (!title || !customerName || !scheduledStart || !scheduledEnd) {
    return {
      ok: false,
      message: "Title, customer name and both dates are required.",
    };
  }
  if (scheduledEnd < scheduledStart) {
    return { ok: false, message: "End date must be on or after the start date." };
  }

  const updated = await updateJob(id, {
    title,
    customerName,
    customerEmail: String(formData.get("customerEmail") ?? "").trim(),
    vanMakeModel: String(formData.get("vanMakeModel") ?? "").trim(),
    scheduledStart,
    scheduledEnd,
    assignedTo: String(formData.get("assignedTo") ?? ""),
    location: parseLocation(formData.get("location")),
    notes: String(formData.get("notes") ?? "").trim(),
  });
  if (!updated) return { ok: false, message: "That job no longer exists." };

  revalidatePath(`/admin/jobs/${id}`);
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/dashboard");
  revalidatePath("/portal/job");
  return { ok: true, message: "Job updated." };
}

// ---------- Admin: staff ----------

export async function createStaffAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!name) return { ok: false, message: "Enter a name." };

  await createStaff(name, role);
  revalidatePath("/admin/staff");
  revalidatePath("/admin/jobs");
  return { ok: true, message: `${name} added to the team.` };
}

export async function updateStaffAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!name) return { ok: false, message: "Enter a name." };

  const updated = await updateStaff(id, { name, role, active });
  if (!updated) return { ok: false, message: "That person no longer exists." };

  revalidatePath("/admin/staff");
  revalidatePath("/admin/jobs");
  return { ok: true, message: `Saved ${name}.` };
}

async function requireFullAdmin() {
  const session = await requireAdmin();
  if (session.accessLevel !== "admin") throw new Error("Forbidden");
  return session;
}

export async function setStaffLoginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireFullAdmin();

  const id = String(formData.get("id"));
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const accessLevel: AccessLevel =
    formData.get("accessLevel") === "admin" ? "admin" : "staff";

  if (!username) return { ok: false, message: "Enter a username." };
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return {
      ok: false,
      message: "Username must be 3–32 characters: letters, numbers, dot, dash or underscore.",
    };
  }
  if (await isUsernameTaken(username, id)) {
    return { ok: false, message: `Username "${username}" is already taken.` };
  }

  const member = await getStaff(id);
  if (!member) return { ok: false, message: "That person no longer exists." };

  // A blank password on an existing login means "leave it unchanged".
  let hash: string | null = null;
  if (password) {
    const problem = passwordProblem(password);
    if (problem) return { ok: false, message: problem };
    hash = await hashPassword(password);
  } else if (!member.hasLogin) {
    return { ok: false, message: "Set a password for their first login." };
  }

  await setStaffLogin(id, username, hash, accessLevel);
  revalidatePath("/admin/staff");
  return {
    ok: true,
    message: `Login saved for ${member.name} (${username}).`,
  };
}

export async function removeStaffLoginAction(formData: FormData) {
  await requireFullAdmin();
  await removeStaffLogin(String(formData.get("id")));
  revalidatePath("/admin/staff");
}

export async function setStaffPayrollAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireFullAdmin();

  const id = String(formData.get("id"));
  const rate = Number(formData.get("hourlyRate") ?? 0);
  const multiplier = Number(formData.get("overtimeMultiplier") ?? 0);
  const afterHours = Number(formData.get("overtimeAfterHours") ?? 0);
  const breakMinutes = Number(formData.get("defaultBreakMinutes") ?? 0);

  if (!Number.isFinite(rate) || rate < 0) {
    return { ok: false, message: "Enter a valid hourly rate." };
  }
  if (!Number.isFinite(multiplier) || multiplier < 1) {
    return { ok: false, message: "Overtime multiplier must be at least 1." };
  }
  if (!Number.isFinite(afterHours) || afterHours < 0 || afterHours > 168) {
    return { ok: false, message: "Overtime threshold must be between 0 and 168 hours." };
  }
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0 || breakMinutes >= 600) {
    return { ok: false, message: "Break must be between 0 and 599 minutes." };
  }

  const updated = await setStaffPayroll(id, {
    hourlyRateCents: Math.round(rate * 100),
    overtimeMultiplier: multiplier,
    overtimeAfterHours: afterHours,
    defaultBreakMinutes: Math.round(breakMinutes),
  });
  if (!updated) return { ok: false, message: "That person no longer exists." };

  revalidatePath("/admin/staff");
  revalidatePath("/admin/timesheets");
  return { ok: true, message: `Pay settings saved for ${updated.name}.` };
}

// ---------- Timesheets ----------

export async function addTimesheetEntryAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireAdmin();

  const requestedStaffId = String(formData.get("staffId") ?? "");
  // Staff may only log their own hours; full admins can log for anyone.
  const staffId =
    session.accessLevel === "admin" ? requestedStaffId : session.staffId;

  if (!staffId) {
    return {
      ok: false,
      message:
        session.accessLevel === "admin"
          ? "Choose whose hours these are."
          : "Your login isn't linked to a staff record, so hours can't be logged.",
    };
  }

  const workDate = String(formData.get("workDate") ?? "");
  const hours = Number(formData.get("hours") ?? 0);
  const breakMinutes = Number(formData.get("breakMinutes") ?? 0);

  if (!workDate) return { ok: false, message: "Pick the date worked." };
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
    return { ok: false, message: "Hours must be between 0 and 24." };
  }
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0 || breakMinutes >= 600) {
    return { ok: false, message: "Break must be between 0 and 599 minutes." };
  }
  if (breakMinutes / 60 >= hours) {
    return { ok: false, message: "The break can't be longer than the hours worked." };
  }

  await createTimesheetEntry({
    staffId,
    jobId: String(formData.get("jobId") ?? ""),
    workDate,
    hours,
    breakMinutes: Math.round(breakMinutes),
    notes: String(formData.get("notes") ?? "").trim(),
  });

  revalidatePath("/admin/timesheets");
  return { ok: true, message: `Logged ${hours} h on ${workDate}.` };
}

// ---------- Stock and suppliers ----------

function parseStockCategory(v: FormDataEntryValue | null): StockCategory {
  const s = String(v ?? "");
  return (STOCK_CATEGORIES as string[]).includes(s)
    ? (s as StockCategory)
    : "other";
}

export async function saveSupplierAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireFullAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Supplier name is required." };

  const supplier = await upsertSupplier({
    id: String(formData.get("id") ?? "") || undefined,
    name,
    contactName: String(formData.get("contactName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    accountNumber: String(formData.get("accountNumber") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });

  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${supplier.id}`);
  revalidatePath("/admin/stock");
  return { ok: true, message: `Saved ${supplier.name}.` };
}

export async function addSupplierLogAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireFullAdmin();
  const supplierId = String(formData.get("supplierId"));
  const entry = String(formData.get("entry") ?? "").trim();

  if (!entry) return { ok: false, message: "Write something to log first." };

  await addSupplierLogEntry(supplierId, entry, session.name);
  revalidatePath(`/admin/suppliers/${supplierId}`);
  return { ok: true, message: "Logged." };
}

export async function saveStockItemAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireFullAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Item name is required." };

  const barcode = String(formData.get("barcode") ?? "").trim();
  if (barcode && !isPlausibleBarcode(barcode)) {
    return {
      ok: false,
      message: "That barcode doesn't look right — 4 to 48 characters, no spaces.",
    };
  }

  // A barcode must point at one item, or scanning it is ambiguous.
  if (barcode) {
    const clash = await findStockByCode(barcode);
    const id = String(formData.get("id") ?? "");
    if (clash && clash.id !== id) {
      return {
        ok: false,
        message: `Barcode ${barcode} is already on "${clash.name}".`,
      };
    }
  }

  const cost = Number(formData.get("cost") ?? 0);
  const sale = Number(formData.get("sale") ?? 0);
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(sale) || sale < 0) {
    return { ok: false, message: "Enter valid cost and sale prices." };
  }

  const item = await upsertStockItem({
    id: String(formData.get("id") ?? "") || undefined,
    ccpCode: String(formData.get("ccpCode") ?? "") || undefined,
    barcode,
    name,
    category: parseStockCategory(formData.get("category")),
    unit: String(formData.get("unit") ?? "").trim() || "each",
    qtyOnHand: Number(formData.get("qtyOnHand") ?? 0),
    reorderLevel: Number(formData.get("reorderLevel") ?? 0),
    costCents: Math.round(cost * 100),
    saleCents: Math.round(sale * 100),
    supplierId: String(formData.get("supplierId") ?? ""),
    location: String(formData.get("location") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });

  revalidatePath("/admin/stock");
  revalidatePath(`/admin/stock/${item.id}`);
  return {
    ok: true,
    message: `Saved ${item.name} — code ${item.ccpCode}.`,
  };
}

export async function adjustStockAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  // Staff book stock in and out; only owners change prices.
  const session = await requireAdmin();

  const itemId = String(formData.get("itemId"));
  const qty = Number(formData.get("qty") ?? 0);
  const direction = String(formData.get("direction") ?? "out");

  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false, message: "Enter how many." };
  }

  const item = await getStockItem(itemId);
  if (!item) return { ok: false, message: "That item no longer exists." };

  const delta = direction === "in" ? qty : -qty;
  if (direction === "out" && qty > item.qtyOnHand) {
    return {
      ok: false,
      message: `Only ${item.qtyOnHand} ${item.unit} on hand.`,
    };
  }

  const updated = await adjustStock(
    itemId,
    delta,
    String(formData.get("reason") ?? "").trim() ||
      (direction === "in" ? "Stock received" : "Used on job"),
    session.name
  );

  revalidatePath("/admin/stock");
  revalidatePath(`/admin/stock/${itemId}`);
  return {
    ok: true,
    message: `${direction === "in" ? "Added" : "Removed"} ${qty} ${item.unit}. ${updated?.qtyOnHand ?? 0} now on hand.`,
  };
}

/** Used by the scanner: resolves a scanned code to an item page. */
export async function lookupBarcodeAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { ok: false, message: "Scan or type a code first." };

  const item = await findStockByCode(code);
  if (!item) {
    return {
      ok: false,
      message: `Nothing found for "${code}". Add it as a new item to record it against this barcode.`,
    };
  }
  redirect(`/admin/stock/${item.id}`);
}

// ---------- Invoicing ----------

export async function createInvoiceAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireFullAdmin();

  const customerName = String(formData.get("customerName") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  const linesRaw = String(formData.get("lines") ?? "[]");

  if (!customerName) return { ok: false, message: "Customer name is required." };
  if (!dueDate) return { ok: false, message: "Pick a due date." };

  let parsed: { description: string; qty: number; unitPriceCents: number }[];
  try {
    parsed = JSON.parse(linesRaw);
  } catch {
    return { ok: false, message: "Invoice lines could not be read." };
  }

  const lines = parsed.filter((l) => l.description.trim() && l.qty > 0);
  if (!lines.length) {
    return { ok: false, message: "Add at least one line to the invoice." };
  }

  const invoice = await createInvoice({
    jobId: String(formData.get("jobId") ?? ""),
    customerName,
    customerEmail: String(formData.get("customerEmail") ?? "").trim(),
    status: "draft",
    issuedDate: new Date().toISOString().slice(0, 10),
    dueDate,
    notes: String(formData.get("notes") ?? "").trim(),
    lines,
  });

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${invoice.id}`);
}

export async function setInvoiceStatusAction(formData: FormData) {
  await requireFullAdmin();
  const id = String(formData.get("invoiceId"));
  const status = String(formData.get("status")) as InvoiceStatus;
  await setInvoiceStatus(id, status);
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
  revalidatePath("/portal/job");
}

export async function recordPaymentAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireFullAdmin();

  const invoiceId = String(formData.get("invoiceId"));
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "bank") as PaymentMethod;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Enter a payment amount." };
  }

  const invoice = await getInvoice(invoiceId);
  if (!invoice) return { ok: false, message: "That invoice no longer exists." };

  const amountCents = Math.round(amount * 100);
  const balance = invoiceBalanceCents(invoice);
  if (amountCents > balance) {
    return {
      ok: false,
      message: `That's more than the ${formatAud(balance)} outstanding. Enter ${formatAud(balance)} or less.`,
    };
  }

  await recordPayment(invoiceId, {
    amountCents,
    method,
    reference: String(formData.get("reference") ?? "").trim(),
    paidAt: new Date().toISOString(),
    recordedBy: session.name,
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/portal/job");

  const after = await getInvoice(invoiceId);
  const remaining = after ? invoiceBalanceCents(after) : 0;
  return {
    ok: true,
    message:
      remaining === 0
        ? `${formatAud(amountCents)} recorded — invoice paid in full.`
        : `${formatAud(amountCents)} recorded. ${formatAud(remaining)} still outstanding.`,
  };
}

/** Builds an invoice straight from a job's accepted quote lines. */
export async function invoiceFromJobAction(formData: FormData) {
  await requireFullAdmin();
  const jobId = String(formData.get("jobId"));
  const job = await getJob(jobId);
  if (!job) return;

  const quotes = await listQuotes();
  const accepted = quotes.find(
    (q) => q.status === "accepted" && q.customerName === job.customerName
  );

  const lines = accepted?.lines.length
    ? accepted.lines.map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPriceCents: l.unitPriceCents,
      }))
    : [{ description: job.title, qty: 1, unitPriceCents: 0 }];

  const invoice = await createInvoice({
    jobId: job.id,
    customerName: job.customerName,
    customerEmail: job.customerEmail,
    status: "draft",
    issuedDate: new Date().toISOString().slice(0, 10),
    // Two weeks is the workshop's normal term.
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    notes: accepted ? `From quote ${accepted.quoteNumber}.` : "",
    lines,
  });

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${invoice.id}`);
}

// ---------- Clock on / off ----------

export async function clockOnAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireAdmin();
  if (!session.staffId) {
    return {
      ok: false,
      message:
        "This login isn't linked to a staff record, so it can't clock on. Sign in as a staff member.",
    };
  }

  const existing = await getOpenShift(session.staffId);
  if (existing) {
    return { ok: false, message: "You're already clocked on." };
  }

  await startShift(session.staffId, String(formData.get("jobId") ?? ""));
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/timesheets");
  return { ok: true, message: `Clocked on at ${brisbaneTime()} Brisbane time.` };
}

export async function clockOffAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireAdmin();
  if (!session.staffId) {
    return { ok: false, message: "This login isn't linked to a staff record." };
  }

  const shift = await getOpenShift(session.staffId);
  if (!shift) return { ok: false, message: "You're not clocked on." };

  const endedAt = new Date().toISOString();
  const hours = hoursBetween(shift.startedAt, endedAt);

  if (hours <= 0) {
    // Under 7½ minutes rounds to zero, and the hours column must be positive.
    await clearShift(session.staffId);
    return {
      ok: true,
      message: "Clocked off — under 15 minutes, so nothing was recorded.",
    };
  }

  const member = await getStaff(session.staffId);
  const breakMinutes = Number(
    formData.get("breakMinutes") ?? member?.defaultBreakMinutes ?? 30
  );
  // Never let the break exceed the shift, which the hours check would reject.
  const safeBreak = Math.max(
    0,
    Math.min(Math.round(breakMinutes), Math.floor(hours * 60) - 1)
  );

  await createTimesheetEntry({
    staffId: session.staffId,
    jobId: shift.jobId,
    // Date the shift by when it started, in Brisbane — a shift beginning at
    // 5pm shouldn't land on the next day just because UTC has ticked over.
    workDate: brisbaneDate(new Date(shift.startedAt)),
    hours,
    breakMinutes: safeBreak,
    notes: String(formData.get("notes") ?? "").trim() || "Clocked shift",
  });

  await clearShift(session.staffId);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/timesheets");
  return {
    ok: true,
    message: `Clocked off at ${brisbaneTime()} — ${hours} h recorded, ${safeBreak} min unpaid break.`,
  };
}

export async function deleteTimesheetEntryAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id"));
  // Staff can only remove their own rows.
  await deleteTimesheetEntry(
    id,
    session.accessLevel === "admin" ? undefined : session.staffId
  );
  revalidatePath("/admin/timesheets");
}

export async function deactivateStaffAction(formData: FormData) {
  await requireAdmin();
  await deactivateStaff(String(formData.get("id")));
  revalidatePath("/admin/staff");
  revalidatePath("/admin/jobs");
}

export async function setJobStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("jobId"));
  const status = String(formData.get("status")) as JobStatus;
  await updateJobStatus(id, status);
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${id}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/portal/job");
}

export async function createTaskAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const jobId = String(formData.get("jobId"));
  const title = String(formData.get("title") ?? "").trim();
  const assignee = String(formData.get("assignee") ?? "").trim();

  if (!title) return { ok: false, message: "Task title is required." };

  const task = await createTask(jobId, title, assignee);
  if (!task) return { ok: false, message: "That job no longer exists." };

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/tasks");
  return { ok: true, message: `Work ID ${task.workId} created.` };
}

export async function setTaskStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("taskId"));
  const jobId = String(formData.get("jobId"));
  const status = String(formData.get("status")) as TaskStatus;
  await updateTaskStatus(id, status);
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/tasks");
}

export async function addUpdateAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireAdmin();
  const jobId = String(formData.get("jobId"));
  const message = String(formData.get("message") ?? "").trim();
  const visibleToCustomer = formData.get("visibleToCustomer") === "on";

  // Photos upload straight from the browser to Blob; only their URLs arrive
  // here. Restrict to our own Blob host so arbitrary URLs can't be injected.
  let photoUrls: string[] = [];
  try {
    const raw = JSON.parse(String(formData.get("photoUrls") ?? "[]"));
    if (Array.isArray(raw)) {
      photoUrls = raw
        .filter((u): u is string => typeof u === "string")
        .filter((u) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(u))
        .slice(0, 12);
    }
  } catch {
    photoUrls = [];
  }

  if (!message && photoUrls.length === 0) {
    return { ok: false, message: "Write an update or attach a photo first." };
  }

  await addUpdate(jobId, session.name, message, visibleToCustomer, photoUrls);
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/portal/job");

  const photoNote =
    photoUrls.length > 0
      ? ` ${photoUrls.length} photo${photoUrls.length === 1 ? "" : "s"} attached.`
      : "";
  return {
    ok: true,
    message:
      (visibleToCustomer
        ? "Update posted — the customer can see this now."
        : "Internal note saved (not visible to the customer).") + photoNote,
  };
}

// ---------- Admin: price book ----------

export async function savePriceBookItemAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || undefined;
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || "each";
  const price = Number(formData.get("price") ?? 0);

  if (!code || !name || !category) {
    return { ok: false, message: "Code, name and category are required." };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, message: "Enter a valid price." };
  }

  // Codes are unique. Renaming one rate onto another's code would otherwise
  // fail as a database constraint violation rather than a readable message.
  const clash = await findPriceBookItemByCode(code);
  if (clash && id && clash.id !== id) {
    return {
      ok: false,
      message: `Code ${code} is already used by "${clash.name}". Pick a different code.`,
    };
  }

  await upsertPriceBookItem({
    id,
    code,
    name,
    category,
    unit,
    priceCents: Math.round(price * 100),
  });

  revalidatePath("/admin/prices");
  revalidatePath("/admin/quotes/new");
  return { ok: true, message: `Saved ${code} — ${name}.` };
}

export async function deletePriceBookItemAction(formData: FormData) {
  await requireAdmin();
  await deletePriceBookItem(String(formData.get("id")));
  revalidatePath("/admin/prices");
  revalidatePath("/admin/quotes/new");
}

// ---------- Admin: quotes ----------

export async function createQuoteAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const vanMakeModel = String(formData.get("vanMakeModel") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const validUntil = String(formData.get("validUntil") ?? "");
  const linesRaw = String(formData.get("lines") ?? "[]");

  if (!customerName) {
    return { ok: false, message: "Customer name is required." };
  }

  let parsed: {
    priceBookItemId: string | null;
    description: string;
    qty: number;
    unitPriceCents: number;
  }[];
  try {
    parsed = JSON.parse(linesRaw);
  } catch {
    return { ok: false, message: "Quote lines could not be read." };
  }

  const lines = parsed.filter((l) => l.description.trim() && l.qty > 0);
  if (!lines.length) {
    return { ok: false, message: "Add at least one line to the quote." };
  }

  const quote = await createQuote({
    customerName,
    customerEmail,
    customerPhone,
    vanMakeModel,
    status: "draft",
    notes,
    validUntil:
      validUntil ||
      new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    lines,
  });

  revalidatePath("/admin/quotes");
  redirect(`/admin/quotes/${quote.id}`);
}

export async function setQuoteStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("quoteId"));
  const status = String(formData.get("status")) as QuoteStatus;
  await updateQuoteStatus(id, status);
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
}

// Turn an accepted quote into a scheduled job. Dates, staff and location are
// chosen at conversion time rather than defaulted, so nothing needs correcting
// afterwards.
export async function convertQuoteToJobAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const quoteId = String(formData.get("quoteId"));
  const title = String(formData.get("title") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const scheduledStart = String(formData.get("scheduledStart") ?? "");
  const scheduledEnd = String(formData.get("scheduledEnd") ?? "");

  if (!title || !customerName || !scheduledStart || !scheduledEnd) {
    return {
      ok: false,
      message: "Job title, customer name and both dates are required.",
    };
  }
  if (scheduledEnd < scheduledStart) {
    return { ok: false, message: "End date must be on or after the start date." };
  }

  const quote = await getQuote(quoteId);
  if (!quote) return { ok: false, message: "That quote no longer exists." };

  const jobCode = await nextJobCode();
  const accessCode = `VAN${Math.floor(100 + Math.random() * 900)}`;

  const job = await createJob({
    jobCode,
    title,
    customerName,
    customerEmail: String(formData.get("customerEmail") ?? "").trim(),
    vanMakeModel: String(formData.get("vanMakeModel") ?? "").trim(),
    status: "booked",
    accessCode,
    scheduledStart,
    scheduledEnd,
    assignedTo: String(formData.get("assignedTo") ?? ""),
    location: parseLocation(formData.get("location")),
    notes: `Created from quote ${quote.quoteNumber}.`,
  });

  await updateQuoteStatus(quoteId, "accepted");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/calendar");
  redirect(`/admin/jobs/${job.id}`);
}
