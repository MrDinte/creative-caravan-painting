import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { findStaffByUsername } from "./db";
import { verifyPassword } from "./password";
import type { AccessLevel } from "./types";

// Lightweight session auth using signed JWT cookies (jose).
// Two roles: "admin" (staff dashboard) and "customer" (portal, scoped to one job).
// For production, AUTH_SECRET must be set. A dev fallback keeps the demo working locally.

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me-1234567890"
);

const ADMIN_COOKIE = "ccp_admin";
const CUSTOMER_COOKIE = "ccp_customer";

export interface AdminSession {
  role: "admin";
  name: string;
  staffId: string; // "" for the environment owner account
  accessLevel: AccessLevel;
}

/** Sections only a full-access user may open. */
export const ADMIN_ONLY_PATHS = [
  "/admin/staff",
  "/admin/prices",
  "/admin/quotes",
  "/admin/enquiries",
] as const;

export function canAccessPath(
  session: AdminSession,
  pathname: string
): boolean {
  if (session.accessLevel === "admin") return true;
  return !ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
}

export interface CustomerSession {
  role: "customer";
  jobId: string;
  jobCode: string;
  customerName: string;
}

async function sign(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

// Mark cookies Secure only when the request actually arrived over HTTPS.
// Keying off NODE_ENV instead would break plain-HTTP local runs of a production
// build (Safari/WebKit silently drops Secure cookies on http://).
async function isSecureRequest(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  const host = h.get("host") ?? "";
  return !/^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
}

async function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: await isSecureRequest(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

// ---------- Admin ----------

const ADMIN_USER = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "caravan2026";

/**
 * Staff sign in with their own credentials. The environment account is kept as
 * an owner fallback so nobody can be locked out of the workshop admin — for
 * example if the only admin's password is lost.
 */
export async function authenticate(
  username: string,
  password: string
): Promise<Omit<AdminSession, "role"> | null> {
  const found = await findStaffByUsername(username);
  if (found) {
    if (!found.staff.active) return null;
    const ok = await verifyPassword(password, found.passwordHash);
    if (!ok) return null;
    return {
      name: found.staff.name,
      staffId: found.staff.id,
      accessLevel: found.staff.accessLevel,
    };
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return { name: username, staffId: "", accessLevel: "admin" };
  }
  return null;
}

export async function createAdminSession(
  session: Omit<AdminSession, "role">
): Promise<void> {
  const token = await sign({ role: "admin", ...session });
  (await cookies()).set(ADMIN_COOKIE, token, await baseCookieOptions());
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "admin") return null;
    return {
      role: "admin",
      name: String(payload.name ?? "Staff"),
      staffId: String(payload.staffId ?? ""),
      accessLevel: payload.accessLevel === "admin" ? "admin" : "staff",
    };
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

// ---------- Customer ----------

export async function createCustomerSession(session: {
  jobId: string;
  jobCode: string;
  customerName: string;
}): Promise<void> {
  const token = await sign({ role: "customer", ...session });
  (await cookies()).set(CUSTOMER_COOKIE, token, await baseCookieOptions());
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "customer") return null;
    return {
      role: "customer",
      jobId: String(payload.jobId),
      jobCode: String(payload.jobCode),
      customerName: String(payload.customerName),
    };
  } catch {
    return null;
  }
}

export async function clearCustomerSession(): Promise<void> {
  (await cookies()).delete(CUSTOMER_COOKIE);
}
