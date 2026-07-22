import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { listContacts, listJobs, listOrders, listQuotes, listTasks } from "@/lib/db";
import {
  JOB_STATUS_LABELS,
  formatAud,
  gstCents,
  quoteSubtotalCents,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const [jobs, tasks, quotes, contacts, orders] = await Promise.all([
    listJobs(),
    listTasks(),
    listQuotes(),
    listContacts(),
    listOrders(),
  ]);

  const active = jobs.filter((j) => j.status !== "completed");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const openQuotes = quotes.filter(
    (q) => q.status === "draft" || q.status === "sent"
  );
  const pipelineCents = openQuotes.reduce((sum, q) => {
    const sub = quoteSubtotalCents(q);
    return sum + sub + gstCents(sub);
  }, 0);

  const stats = [
    { label: "Active jobs", value: String(active.length), href: "/admin/jobs" },
    { label: "Open tasks", value: String(openTasks.length), href: "/admin/tasks" },
    { label: "Open quotes", value: String(openQuotes.length), href: "/admin/quotes" },
    { label: "Quote pipeline", value: formatAud(pipelineCents), href: "/admin/quotes" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600">
            What&apos;s happening in the workshop today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/jobs/new" className="!min-h-[44px] !py-2">
            + New job
          </ButtonLink>
          <ButtonLink
            href="/admin/quotes/new"
            variant="outline"
            className="!min-h-[44px] !py-2"
          >
            + New quote
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="block">
            <Card className="p-5 transition-shadow hover:shadow-md">
              <p className="text-sm text-slate-600">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-brand">
                {s.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Jobs in the workshop
            </h2>
            <Link
              href="/admin/jobs"
              className="text-sm font-semibold text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-200">
            {active.length === 0 && (
              <li className="py-4 text-slate-600">No active jobs right now.</li>
            )}
            {active.map((j) => (
              <li key={j.id} className="py-3">
                <Link
                  href={`/admin/jobs/${j.id}`}
                  className="flex items-center justify-between gap-3 hover:text-brand"
                >
                  <span>
                    <span className="font-mono text-xs text-slate-500">
                      {j.jobCode}
                    </span>
                    <span className="block font-semibold">{j.title}</span>
                    <span className="text-sm text-slate-500">
                      {j.customerName} · {j.vanMakeModel}
                    </span>
                  </span>
                  <Badge
                    tone={j.status === "awaiting_parts" ? "amber" : "brand"}
                  >
                    {JOB_STATUS_LABELS[j.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Latest enquiries
              </h2>
              <Link
                href="/admin/enquiries"
                className="text-sm font-semibold text-brand hover:underline"
              >
                View all
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-slate-200">
              {contacts.length === 0 && (
                <li className="py-4 text-slate-600">
                  No contact form submissions yet.
                </li>
              )}
              {contacts.slice(0, 4).map((c) => (
                <li key={c.id} className="py-3">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-600">{c.service || "General enquiry"}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Store orders
              </h2>
              <Link
                href="/admin/enquiries"
                className="text-sm font-semibold text-brand hover:underline"
              >
                View all
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-slate-200">
              {orders.length === 0 && (
                <li className="py-4 text-slate-600">No store orders yet.</li>
              )}
              {orders.slice(0, 4).map((o) => (
                <li key={o.id} className="flex justify-between py-3">
                  <span className="font-semibold text-slate-900">
                    {o.customerName}
                  </span>
                  <span className="font-semibold text-brand">
                    {formatAud(o.totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
