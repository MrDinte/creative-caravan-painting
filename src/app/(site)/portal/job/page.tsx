import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@/components/ui";
import { customerLogout } from "@/app/actions";
import { getCustomerSession } from "@/lib/auth";
import { getJob, listTasks, listUpdates } from "@/lib/db";
import { JOB_STATUS_LABELS, TASK_STATUS_LABELS } from "@/lib/types";
import type { JobStatus } from "@/lib/types";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "My Van",
  description: "Live progress updates on your caravan.",
};

const STATUS_ORDER: JobStatus[] = [
  "booked",
  "in_progress",
  "awaiting_parts",
  "quality_check",
  "completed",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PortalJobPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/portal");

  const job = await getJob(session.jobId);
  if (!job) redirect("/portal");

  const [tasks, updates] = await Promise.all([
    listTasks(job.id),
    listUpdates(job.id, true),
  ]);

  const done = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const stepIndex = STATUS_ORDER.indexOf(job.status);

  return (
    <Section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-brand">
            {job.jobCode}
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-slate-900">
            {job.title}
          </h1>
          <p className="mt-2 text-slate-600">
            {job.vanMakeModel} · Hi {session.customerName.split(" ")[0]}, here&apos;s
            where your van is at.
          </p>
        </div>
        <form action={customerLogout}>
          <Button variant="outline" type="submit" data-testid="portal-logout">
            Log out
          </Button>
        </form>
      </div>

      {/* Status tracker */}
      <Card className="mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Current status
          </h2>
          <Badge tone={job.status === "completed" ? "green" : "brand"}>
            {JOB_STATUS_LABELS[job.status]}
          </Badge>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-5">
          {STATUS_ORDER.map((s, i) => {
            const reached = i <= stepIndex;
            return (
              <li key={s} className="flex sm:flex-col items-center sm:items-start gap-2">
                <span
                  aria-hidden
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    reached
                      ? "bg-brand text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {reached ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm ${
                    reached ? "font-semibold text-slate-900" : "text-slate-500"
                  }`}
                >
                  {JOB_STATUS_LABELS[s]}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-800">
              Work completed
            </span>
            <span className="text-slate-600" data-testid="portal-progress">
              {done} of {tasks.length} tasks ({pct}%)
            </span>
          </div>
          <div
            className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Job completion"
          >
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="font-semibold text-slate-800">Booked in</dt>
            <dd className="text-slate-600">{formatDate(job.scheduledStart)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Estimated ready</dt>
            <dd className="text-slate-600">{formatDate(job.scheduledEnd)}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Updates feed */}
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Live updates
          </h2>
          <div className="mt-4 space-y-4" data-testid="portal-updates">
            {updates.length === 0 && (
              <Card className="p-6 text-slate-600">
                No updates yet — we&apos;ll post here as soon as work starts.
              </Card>
            )}
            {updates.map((u) => (
              <Card key={u.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{u.author}</p>
                  <time className="text-xs text-slate-500">
                    {formatDateTime(u.createdAt)}
                  </time>
                </div>
                <p className="mt-2 leading-relaxed text-slate-700">
                  {u.message}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Task checklist */}
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Work checklist
          </h2>
          <Card className="mt-4 divide-y divide-slate-200">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-4">
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    t.status === "done"
                      ? "bg-emerald-100 text-emerald-700"
                      : t.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {t.status === "done" ? "✓" : "•"}
                </span>
                <div className="flex-1">
                  <p
                    className={
                      t.status === "done"
                        ? "text-slate-500 line-through"
                        : "font-medium text-slate-900"
                    }
                  >
                    {t.title}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    {t.workId} · {TASK_STATUS_LABELS[t.status]}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Card className="mt-8 bg-slate-50 p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Questions about your van?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Call the workshop on{" "}
          <a href={site.phoneHref} className="font-semibold text-brand hover:underline">
            {site.phone}
          </a>{" "}
          and quote your job code {job.jobCode}.
        </p>
      </Card>
    </Section>
  );
}
