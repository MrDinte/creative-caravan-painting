import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { setTaskStatusAction } from "@/app/actions";
import { listJobs, listTasks } from "@/lib/db";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Task Manager",
  robots: { index: false, follow: false },
};

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export default async function TasksPage() {
  const [tasks, jobs] = await Promise.all([listTasks(), listJobs()]);
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Task Manager
      </h1>
      <p className="mt-1 text-slate-600">
        Every work item across all jobs. Each task has a unique work ID so staff
        can track exactly what&apos;s been done.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div key={col}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {TASK_STATUS_LABELS[col]}
                </h2>
                <Badge
                  tone={
                    col === "done" ? "green" : col === "in_progress" ? "amber" : "slate"
                  }
                >
                  {colTasks.length}
                </Badge>
              </div>

              <div className="mt-3 space-y-3">
                {colTasks.length === 0 && (
                  <Card className="p-4 text-sm text-slate-500">
                    Nothing here.
                  </Card>
                )}
                {colTasks.map((t) => {
                  const job = jobById.get(t.jobId);
                  return (
                    <Card key={t.id} className="p-4">
                      <p className="font-medium text-slate-900">{t.title}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {t.workId}
                      </p>
                      {job && (
                        <Link
                          href={`/admin/jobs/${job.id}`}
                          className="mt-1 block text-xs font-semibold text-brand hover:underline"
                        >
                          {job.jobCode} · {job.customerName}
                        </Link>
                      )}
                      {t.assignee && (
                        <p className="mt-2 text-xs text-slate-600">
                          Assigned to {t.assignee}
                        </p>
                      )}
                      <form action={setTaskStatusAction} className="mt-3">
                        <input type="hidden" name="taskId" value={t.id} />
                        <input type="hidden" name="jobId" value={t.jobId} />
                        <input
                          type="hidden"
                          name="status"
                          value={NEXT_STATUS[col]}
                        />
                        <Button
                          type="submit"
                          variant={col === "done" ? "outline" : "primary"}
                          className="w-full !min-h-[40px] !py-2 !text-sm"
                        >
                          Move to {TASK_STATUS_LABELS[NEXT_STATUS[col]]}
                        </Button>
                      </form>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
