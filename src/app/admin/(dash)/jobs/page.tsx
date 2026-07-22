import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { listJobs, listTasks } from "@/lib/db";
import { JOB_STATUS_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Jobs",
  robots: { index: false, follow: false },
};

export default async function JobsPage() {
  const [jobs, tasks] = await Promise.all([listJobs(), listTasks()]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Jobs
          </h1>
          <p className="mt-1 text-slate-600">
            Every van in the system, with its job code and work IDs.
          </p>
        </div>
        <ButtonLink href="/admin/jobs/new" className="!min-h-[44px] !py-2">
          + New job
        </ButtonLink>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Job code</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {jobs.map((j) => {
                const jt = tasks.filter((t) => t.jobId === j.id);
                const done = jt.filter((t) => t.status === "done").length;
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
