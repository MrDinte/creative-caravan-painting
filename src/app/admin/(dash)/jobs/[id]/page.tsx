import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { AddTaskForm } from "@/components/AddTaskForm";
import { AddUpdateForm } from "@/components/AddUpdateForm";
import { EditJobForm } from "@/components/EditJobForm";
import { isBlobConfigured } from "@/lib/blob";
import { setJobStatusAction, setTaskStatusAction } from "@/app/actions";
import { getJob, listStaff, listTasks, listUpdates } from "@/lib/db";
import {
  JOB_LOCATION_LABELS,
  JOB_STATUS_LABELS,
  TASK_STATUS_LABELS,
  type JobStatus,
  type TaskStatus,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Job detail",
  robots: { index: false, follow: false },
};

const NEXT_TASK_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const [tasks, updates, staff] = await Promise.all([
    listTasks(job.id),
    listUpdates(job.id),
    listStaff(true),
  ]);

  const done = tasks.filter((t) => t.status === "done").length;
  const assignee = staff.find((s) => s.id === job.assignedTo);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/jobs" className="hover:text-brand">
          Jobs
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">{job.jobCode}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-brand">
            {job.jobCode}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900">
            {job.title}
          </h1>
          <p className="mt-1 text-slate-600">
            {job.customerName} · {job.vanMakeModel}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="slate">📍 {JOB_LOCATION_LABELS[job.location]}</Badge>
            <Badge tone={assignee ? "brand" : "amber"}>
              👷 {assignee ? assignee.name : "Unallocated"}
            </Badge>
          </div>
        </div>
        <Badge tone={job.status === "completed" ? "green" : "brand"}>
          {JOB_STATUS_LABELS[job.status]}
        </Badge>
      </div>

      <div className="mt-6">
        <EditJobForm job={job} staff={staff} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Task manager */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Task manager
              </h2>
              <span className="text-sm text-slate-600">
                {done} of {tasks.length} complete
              </span>
            </div>

            <ul className="mt-4 divide-y divide-slate-200">
              {tasks.length === 0 && (
                <li className="py-4 text-slate-600">
                  No tasks yet — add the first one below.
                </li>
              )}
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
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
                      {t.workId}
                      {t.assignee && ` · ${t.assignee}`}
                    </p>
                  </div>
                  <form action={setTaskStatusAction}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={NEXT_TASK_STATUS[t.status]}
                    />
                    <Button
                      type="submit"
                      variant={t.status === "done" ? "outline" : "primary"}
                      className="!min-h-[40px] !px-4 !py-2 !text-sm"
                      data-testid={`task-advance-${t.workId}`}
                    >
                      {TASK_STATUS_LABELS[t.status]} →{" "}
                      {TASK_STATUS_LABELS[NEXT_TASK_STATUS[t.status]]}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-900">Add a task</h3>
              <p className="text-sm text-slate-600">
                A work ID is generated automatically ({job.jobCode}-Wxx).
              </p>
              <div className="mt-3">
                <AddTaskForm jobId={job.id} staff={staff} />
              </div>
            </div>
          </Card>

          {/* Updates */}
          <Card className="p-6">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Customer updates
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Anything marked visible appears instantly in the customer portal.
            </p>
            <div className="mt-4">
              <AddUpdateForm
                jobId={job.id}
                photoUploadsEnabled={isBlobConfigured()}
              />
            </div>

            <ul className="mt-6 space-y-3">
              {updates.map((u) => (
                <li
                  key={u.id}
                  className={`rounded-xl border p-4 ${
                    u.visibleToCustomer
                      ? "border-slate-200 bg-white"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{u.author}</p>
                    <div className="flex items-center gap-2">
                      <Badge tone={u.visibleToCustomer ? "green" : "amber"}>
                        {u.visibleToCustomer ? "Customer visible" : "Internal"}
                      </Badge>
                      <time className="text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleString("en-AU", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                  </div>
                  {u.message && (
                    <p className="mt-2 text-slate-700">{u.message}</p>
                  )}
                  {u.photoUrls.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {u.photoUrls.map((url) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt="Job progress photo"
                              className="h-24 w-24 rounded-lg border border-slate-200 object-cover hover:brightness-95"
                            />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Job status
            </h2>
            <div className="mt-3 space-y-2">
              {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((s) => (
                <form key={s} action={setJobStatusAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <input type="hidden" name="status" value={s} />
                  <Button
                    type="submit"
                    variant={job.status === s ? "primary" : "outline"}
                    className="w-full !min-h-[42px] !py-2 !text-sm"
                    data-testid={`set-status-${s}`}
                  >
                    {JOB_STATUS_LABELS[s]}
                  </Button>
                </form>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Customer access
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-800">Job code</dt>
                <dd className="font-mono text-brand">{job.jobCode}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Access code</dt>
                <dd className="font-mono text-brand">{job.accessCode}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Email</dt>
                <dd className="break-all text-slate-600">
                  {job.customerEmail || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Scheduled</dt>
                <dd className="text-slate-600">
                  {job.scheduledStart} → {job.scheduledEnd}
                </dd>
              </div>
            </dl>
          </Card>

          {job.notes && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Notes
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {job.notes}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
