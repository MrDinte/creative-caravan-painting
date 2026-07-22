import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { listJobs, listStaff, listTasks } from "@/lib/db";
import {
  JOB_LOCATIONS,
  JOB_LOCATION_LABELS,
  JOB_STATUS_LABELS,
  type JobLocation,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Jobs",
  robots: { index: false, follow: false },
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ loc?: string }>;
}) {
  const { loc } = await searchParams;
  const [jobs, tasks, staff] = await Promise.all([
    listJobs(),
    listTasks(),
    listStaff(),
  ]);

  const activeFilter = (JOB_LOCATIONS as string[]).includes(loc ?? "")
    ? (loc as JobLocation)
    : null;

  const visible = activeFilter
    ? jobs.filter((j) => j.location === activeFilter)
    : jobs;

  const staffById = new Map(staff.map((s) => [s.id, s]));
  const countFor = (l: JobLocation) =>
    jobs.filter((j) => j.location === l).length;

  const tabs = [
    { key: null, label: `All jobs (${jobs.length})`, href: "/admin/jobs" },
    ...JOB_LOCATIONS.map((l) => ({
      key: l,
      label: `${JOB_LOCATION_LABELS[l]} (${countFor(l)})`,
      href: `/admin/jobs?loc=${l}`,
    })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Jobs
          </h1>
          <p className="mt-1 text-slate-600">
            Every van in the system, with its job code, location and allocation.
          </p>
        </div>
        <ButtonLink href="/admin/jobs/new" className="!min-h-[44px] !py-2">
          + New job
        </ButtonLink>
      </div>

      <nav aria-label="Filter by location" className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const isActive = activeFilter === t.key;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-brand-solid text-white"
                  : "border border-slate-300 bg-[var(--surface)] text-slate-700 hover:border-brand hover:text-brand"
              }`}
              data-testid={`loc-filter-${t.key ?? "all"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Job code</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Allocated to</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-slate-600">
                    No jobs at this location yet.
                  </td>
                </tr>
              )}
              {visible.map((j) => {
                const jt = tasks.filter((t) => t.jobId === j.id);
                const done = jt.filter((t) => t.status === "done").length;
                const who = staffById.get(j.assignedTo);
                return (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/jobs/${j.id}`}
                        className="font-mono font-semibold text-brand hover:underline"
                      >
                        {j.jobCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/jobs/${j.id}`} className="font-semibold hover:text-brand">
                        {j.title}
                      </Link>
                      <span className="block text-xs text-slate-500">
                        {j.vanMakeModel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {j.customerName}
                      <span className="block text-xs text-slate-500">
                        Access: <code className="font-mono">{j.accessCode}</code>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="slate">
                        {JOB_LOCATION_LABELS[j.location]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {who ? (
                        <span className="text-slate-700">{who.name}</span>
                      ) : (
                        <span className="text-amber-700">Unallocated</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {j.scheduledStart}
                      <span className="block text-xs">→ {j.scheduledEnd}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {done}/{jt.length}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          j.status === "completed"
                            ? "green"
                            : j.status === "awaiting_parts"
                              ? "amber"
                              : "brand"
                        }
                      >
                        {JOB_STATUS_LABELS[j.status]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
