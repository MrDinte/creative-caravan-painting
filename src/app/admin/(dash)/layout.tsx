import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui";
import { adminLogout } from "@/app/actions";
import { getAdminSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/db";

export default async function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full bg-brand font-bold text-white"
            >
              CC
            </span>
            <span className="font-display text-base font-bold text-slate-900">
              Workshop Admin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-slate-600">
              Signed in as <strong>{session.name}</strong>
              {session.accessLevel === "staff" && (
                <span className="ml-1 text-slate-400">(staff)</span>
              )}
            </span>
            <Link
              href="/"
              className="hidden sm:inline text-sm font-medium text-brand hover:underline"
            >
              View site
            </Link>
            <form action={adminLogout}>
              <Button
                variant="outline"
                type="submit"
                className="!min-h-[40px] !px-4 !py-2 !text-sm"
                data-testid="admin-logout"
              >
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {isDemoMode() && (
        <p className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 border-b border-amber-200">
          Demo mode — data resets on server restart. Set{" "}
          <code className="font-mono">DATABASE_URL</code> to persist to Neon
          Postgres.
        </p>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <AdminNav accessLevel={session.accessLevel} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
