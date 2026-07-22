import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { listJobs } from "@/lib/db";
import { JOB_STATUS_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLOURS: Record<string, string> = {
  booked: "bg-sky-100 text-sky-900 border-sky-300",
  in_progress: "bg-teal-100 text-teal-900 border-teal-300",
  awaiting_parts: "bg-amber-100 text-amber-900 border-amber-300",
  quality_check: "bg-violet-100 text-violet-900 border-violet-300",
  completed: "bg-emerald-100 text-emerald-900 border-emerald-300",
};

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const jobs = await listJobs();

  // Month to display: ?m=YYYY-MM, defaults to current month.
  const now = new Date();
  const [yy, mm] = (m ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    .split("-")
    .map(Number);
  const year = Number.isFinite(yy) ? yy : now.getFullYear();
  const month = Number.isFinite(mm) ? mm - 1 : now.getMonth();

  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  // Monday-first offset
  const startOffset = (first.getUTCDay() + 6) % 7;

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: last.getUTCDate() }, (_, i) =>
      new Date(Date.UTC(year, month, i + 1))
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = new Date(Date.UTC(year, month - 1, 1));
  const next = new Date(Date.UTC(year, month + 1, 1));
  const monthParam = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  const monthLabel = first.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const jobsOn = (key: string) =>
    jobs.filter((j) => key >= j.scheduledStart && key <= j.scheduledEnd);

  const todayKey = toKey(new Date());

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Calendar
          </h1>
          <p className="mt-1 text-slate-600">
            Workshop bookings across the month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendar?m=${monthParam(prev)}`}
            className="grid min-h-[44px] min-w-[44px] place-items-center rounded-lg border border-slate-300 bg-white px-3 hover:border-brand hover:text-brand"
            aria-label="Previous month"
          >
            ←
          </Link>
          <span className="min-w-[10rem] text-center font-display text-lg font-bold text-slate-900">
            {monthLabel}
          </span>
          <Link
            href={`/admin/calendar?m=${monthParam(next)}`}
            className="grid min-h-[44px] min-w-[44px] place-items-center rounded-lg border border-slate-300 bg-white px-3 hover:border-brand hover:text-brand"
            aria-label="Next month"
          >
            →
          </Link>
        </div>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-600"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                const key = date ? toKey(date) : "";
                const dayJobs = date ? jobsOn(key) : [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={i}
                    className={`min-h-[110px] border-b border-r border-slate-200 p-1.5 ${
                      date ? "" : "bg-slate-50"
                    } ${isToday ? "bg-teal-50" : ""}`}
                  >
                    {date && (
                      <>
                        <span
                          className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-brand text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {date.getUTCDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayJobs.map((j) => (
                            <Link
                              key={j.id}
                              href={`/admin/jobs/${j.id}`}
                              className={`block truncate rounded border px-1.5 py-1 text-[11px] font-medium hover:brightness-95 ${
                                STATUS_COLOURS[j.status]
                              }`}
                              title={`${j.jobCode} — ${j.title}`}
                            >
                              {j.jobCode.split("-").slice(-1)} {j.customerName}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(JOB_STATUS_LABELS).map(([k, label]) => (
          <span
            key={k}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLOURS[k]}`}
          >
            {label}
          </span>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Scheduled this month
        </h2>
        <ul className="mt-4 divide-y divide-slate-200">
          {jobs
            .filter((j) => {
              const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
              return (
                j.scheduledStart.startsWith(ym) || j.scheduledEnd.startsWith(ym)
              );
            })
            .map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link href={`/admin/jobs/${j.id}`} className="hover:text-brand">
                  <span className="font-mono text-xs text-slate-500">
                    {j.jobCode}
                  </span>
                  <span className="block font-semibold">{j.title}</span>
                  <span className="text-sm text-slate-500">
                    {j.scheduledStart} → {j.scheduledEnd}
                  </span>
                </Link>
                <Badge tone={j.status === "awaiting_parts" ? "amber" : "brand"}>
                  {JOB_STATUS_LABELS[j.status]}
                </Badge>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
