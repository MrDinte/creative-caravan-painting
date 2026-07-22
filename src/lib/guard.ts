import { redirect } from "next/navigation";
import { getAdminSession } from "./auth";

/**
 * Sections a staff-level login must not reach. The nav hides them, but this is
 * the check that actually matters — otherwise typing the URL would work.
 */
export async function requireFullAccess() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");
  if (session.accessLevel !== "admin") redirect("/admin/dashboard");
  return session;
}
