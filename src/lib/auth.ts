import { findStaffByUsername } from "./db";
import { verifyPassword } from "./password";
import type { AdminSession } from "./session";

export {
  createAdminSession,
  getAdminSession,
  clearAdminSession,
  createCustomerSession,
  getCustomerSession,
  clearCustomerSession,
} from "./session";
export type { AdminSession, CustomerSession } from "./session";

const ADMIN_USER = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "caravan2026";

/** Sections only a full-access user may open. */
export const ADMIN_ONLY_PATHS = [
  "/admin/staff",
  "/admin/prices",
  "/admin/quotes",
  "/admin/invoices",
  "/admin/enquiries",
] as const;

export function canAccessPath(
  session: AdminSession,
  pathname: string
): boolean {
  if (session.accessLevel === "admin") return true;
  return !ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
}

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
