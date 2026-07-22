import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { redirect } from "next/navigation";
import { ClockCard } from "@/components/ClockCard";
import { getAdminSession } from "@/lib/auth";
import {
  getOpenShift,
  getStaff,
  listContacts,
  listJobs,
  listOrders,
  listQuotes,
  listTasks,
} from "@/lib/db";
import {
  JOB_LOCATIONS,
  JOB_LOCATION_LABELS,
  JOB_STATUS_LABELS,
  type JobLocation,
  formatAud,
  gstCents,
  quoteSubtotalCents,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ loc?: string }>;
}) {
  const { loc } = await searchParams;
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const isAdmin = session.accessLevel === "admin";

  const [jobs, tasks, quotes, contacts, orders, shift, me] = await Promise.all([
    listJobs(),
    listTasks(),
    // Quotes, enquiries and orders are owner-only, so don't fetch them for
    // staff — with RLS on, those reads return nothing anyway.
    isAdmin ? listQuotes() : Promise.resolve([]),
    isAdmin ? listContacts() : Promise.resolve([]),
    isAdmin ? listOrders() : Promise.resolve([]),
    getOpenShift(session.staffId),
    session.staffId ? getStaff(session.staffId) : Promise.resolve(null),
  ]);

  const activeFilter = (JOB_LOCATIONS as string[]).includes(loc ?? "")
    ? (loc as JobLocation)
    : null;

  const active = jobs
    .filter((j) => j.status !== "completed")
    .filter((j) => !activeFilter || j.location === activeFilter);

  const activeAllLocations = jobs.filter((j) => j.status !== "completed");
  const countFor = (l: JobLocation) =>
    activeAllLocations.filter((j) => j.location === l).length;

  const locationTabs = [
    {
      key: null,
      label: `All (${activeAllLocations.length})`,
      href: "/admin/dashboard",
    },
    ...JOB_LOCATIONS.map((l) => ({
      key: l,
      label: `${JOB_LOCATION_LABELS[l]} (${countFor(l)})`,
      href: `/admin/dashboard?loc=${l}`,
    })),
  ];

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
    // Quote figures are commercial information — owners only.
    ...(isAdmin
      ? [
          { label: "Open quotes", value: String(openQuotes.length), href: "/admin/quotes" },
          { label: "Quote pipeline", value: formatAud(pipelineCents), href: "/admin/quotes" },
        ]
      : [{ label: "My timesheets", value: "View", href: "/admin/timesheets" }]),
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
        {isAdmin && (
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
        )}
      </div>

      {/* First thing on the page: are you on the clock or not. */}
      {session.staffId && (
        <div className="mt-6">
          <ClockCard
            name={session.name}
            openShiftStartedAt={shift?.startedAt ?? null}
            openShiftJobId={shift?.jobId ?? ""}
            jobs={jobs.filter((j) => j.status !== "completed")}
            defaultBreakMinutes={me?.defaultBreakMinutes ?? 30}
          />
        </div>
      )}

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
              {activeFilter
                ? `Jobs in ${JOB_LOCATION_LABELS[activeFilter]}`
                : "Jobs in progress"}
            </h2>
            <Link
              href="/admin/jobs"
              className="text-sm font-semibold text-brand hover:underline"
            >
              View all
            </Link>
          </div>

          <nav
            aria-label="Filter by location"
            className="mt-3 flex flex-wrap gap-2"
          >
            {locationTabs.map((t) => {
              const isActive = activeFilter === t.key;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-[36px] items-center rounded-full px-3 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-brand text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-brand hover:text-brand"
                  }`}
                  data-testid={`dash-loc-${t.key ?? "all"}`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <ul className="mt-4 divide-y divide-slate-200">
            {active.length === 0 && (
              <li className="py-4 text-slate-600">
                {activeFilter
                  ? `No active jobs at ${JOB_LOCATION_LABELS[activeFilter]}.`
                  : "No active jobs right now."}
              </li>
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
                      {j.customerName} · {j.vanMakeModel} · {JOB_LOCATION_LABELS[j.location]}
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

        {isAdmin && (
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
        )}
      </div>
    </div>
  );
}
