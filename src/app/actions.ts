"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addContact,
  addOrderEnquiry,
  addUpdate,
  createJob,
  createQuote,
  createTask,
  deletePriceBookItem,
  findJobByCredentials,
  findPriceBookItemByCode,
  nextJobCode,
  updateJobStatus,
  updateQuoteStatus,
  updateTaskStatus,
  upsertPriceBookItem,
} from "@/lib/db";
import {
  clearAdminSession,
  clearCustomerSession,
  createAdminSession,
  createCustomerSession,
  getAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth";
import type { JobStatus, QuoteStatus, TaskStatus } from "@/lib/types";

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

  return {
    ok: true,
    message:
      "Order received! We've emailed you a confirmation — payment link to follow once Stripe is live.",
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

  if (!verifyAdminCredentials(username, password)) {
    return { ok: false, message: "Incorrect username or password." };
  }
  await createAdminSession(username);
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

  if (!message) return { ok: false, message: "Write an update first." };

  await addUpdate(jobId, session.name, message, visibleToCustomer);
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/portal/job");
  return {
    ok: true,
    message: visibleToCustomer
      ? "Update posted — the customer can see this now."
      : "Internal note saved (not visible to the customer).",
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

// Turn an accepted quote into a scheduled job.
export async function convertQuoteToJobAction(formData: FormData) {
  await requireAdmin();
  const quoteId = String(formData.get("quoteId"));
  const customerName = String(formData.get("customerName"));
  const customerEmail = String(formData.get("customerEmail"));
  const vanMakeModel = String(formData.get("vanMakeModel"));
  const title = String(formData.get("title"));

  const jobCode = await nextJobCode();
  const accessCode = `VAN${Math.floor(100 + Math.random() * 900)}`;
  const start = new Date().toISOString().slice(0, 10);
  const end = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const job = await createJob({
    jobCode,
    title,
    customerName,
    customerEmail,
    vanMakeModel,
    status: "booked",
    accessCode,
    scheduledStart: start,
    scheduledEnd: end,
    notes: `Created from quote ${quoteId}.`,
  });

  await updateQuoteStatus(quoteId, "accepted");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/jobs");
  redirect(`/admin/jobs/${job.id}`);
}
