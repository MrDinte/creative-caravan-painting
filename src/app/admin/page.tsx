import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { Card } from "@/components/ui";
import { getAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Staff Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin/dashboard");

  const showDemo = !process.env.ADMIN_PASSWORD;

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-900 px-4 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-white"
        >
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-full bg-brand font-bold"
          >
            CC
          </span>
          <span className="font-display text-lg font-bold">
            Creative Caravan Painting
          </span>
        </Link>

        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Staff Login
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Workshop management — jobs, calendar, timesheets and customer
            updates. Sign in with your own username.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>

          {showDemo && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>
                <strong>Owner login:</strong>{" "}
                <code className="font-mono font-semibold">admin</code> /{" "}
                <code className="font-mono font-semibold">caravan2026</code>
              </p>
              <p className="mt-1">
                <strong>Staff login:</strong>{" "}
                <code className="font-mono font-semibold">jake</code> /{" "}
                <code className="font-mono font-semibold">workshop2026</code>{" "}
                — limited access, own timesheet only
              </p>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/" className="hover:text-white">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
