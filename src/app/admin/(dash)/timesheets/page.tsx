import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { TimesheetForm } from "@/components/TimesheetForm";
import { deleteTimesheetEntryAction } from "@/app/actions";
import { getAdminSession } from "@/lib/auth";
import { listJobs, listStaff, listTimesheets } from "@/lib/db";
import {
  calculateWeekPay,
  formatAud,
  formatHours,
  paidHours,
  weekStart,
  type TimesheetEntry,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Timesheets",
  robots: { index: false, follow: false },
};

export default async function TimesheetsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const isAdmin = session.accessLevel === "admin";

  const [allStaff, jobs, entries] = await Promise.all([
    listStaff(true),
    listJobs(),
    // Staff only ever load their own rows.
    listTimesheets(isAdmin ? undefined : { staffId: session.staffId }),
  ]);

  const staffById = new Map(allStaff.map((s) => [s.id, s]));
  const jobById = new Map(jobs.map((j) => [j.id, j]));
  const me = staffById.get(session.staffId);
  const today = new Date().toISOString().slice(0, 10);

  // Group into weeks per person for payroll.
  const byStaffWeek = new Map<string, TimesheetEntry[]>();
  for (const e of entries) {
    const key = `${e.staffId}|${weekStart(e.workDate)}`;
    byStaffWeek.set(key, [...(byStaffWeek.get(key) ?? []), e]);
  }

  const weeks = [...byStaffWeek.entries()]
    .map(([key, rows]) => {
      const [staffId, ws] = key.split("|");
      const person = staffById.get(staffId);
      return {
        staffId,
        person,
        weekStart: ws,
        rows,
        pay: person
          ? calculateWeekPay(ws, rows, person)
          : calculateWeekPay(ws, rows, {
              hourlyRateCents: 0,
              overtimeMultiplier: 1,
              overtimeAfterHours: 38,
            }),
      };
    })
    .sort(
      (a, b) =>
        b.weekStart.localeCompare(a.weekStart) ||
        (a.person?.name ?? "").localeCompare(b.person?.name ?? "")
    );

  const grandTotal = weeks.reduce((s, w) => s + w.pay.totalPayCents, 0);
  const totalHours = weeks.reduce((s, w) => s + w.pay.paidHours, 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Timesheets
          </h1>
          <p className="mt-1 text-slate-600">
            {isAdmin
              ? "Everyone's hours, grouped by week with pay calculated."
              : "Your hours. Breaks are unpaid and taken off automatically."}
          </p>
        </div>
        {isAdmin && weeks.length > 0 && (
          <Card className="px-5 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total across all weeks shown
            </p>
            <p className="font-display text-2xl font-bold text-brand">
              {formatAud(grandTotal)}
            </p>
            <p className="text-xs text-slate-500">
              {formatHours(totalHours)} paid
            </p>
          </Card>
        )}
      </div>

      {!isAdmin && !session.staffId && (
        <Card className="mt-6 border-amber-200 bg-amber-50 p-5 text-amber-900">
          Your login isn&apos;t linked to a staff record, so hours can&apos;t be
          logged. Ask the owner to create your login from Admin → Staff.
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit p-6">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Log hours
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter time on site; the unpaid break is deducted when pay is worked
            out.
          </p>
          <div className="mt-4">
            <TimesheetForm
              staff={allStaff}
              jobs={jobs}
              isAdmin={isAdmin}
              ownStaffId={session.staffId}
              defaultBreakMinutes={me?.defaultBreakMinutes ?? 30}
              today={today}
            />
          </div>
        </Card>

        <div className="space-y-6">
          {weeks.length === 0 && (
            <Card className="p-6 text-slate-600">
              No hours logged yet.
            </Card>
          )}

          {weeks.map((w) => (
            <Card key={`${w.staffId}-${w.weekStart}`} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {w.person?.name ?? "Unknown"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Week beginning {w.weekStart}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold text-brand">
                    {formatAud(w.pay.totalPayCents)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatHours(w.pay.paidHours)} paid
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-slate-600">Ordinary</dt>
                  <dd className="font-semibold">
                    {formatHours(w.pay.ordinaryHours)} ·{" "}
                    {formatAud(w.pay.ordinaryPayCents)}
                  </dd>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    w.pay.overtimeHours > 0 ? "bg-amber-50" : "bg-slate-50"
                  }`}
                >
                  <dt className="text-slate-600">
                    Overtime ×{w.person?.overtimeMultiplier ?? 1}
                  </dt>
                  <dd className="font-semibold">
                    {formatHours(w.pay.overtimeHours)} ·{" "}
                    {formatAud(w.pay.overtimePayCents)}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-slate-600">Rate</dt>
                  <dd className="font-semibold">
                    {formatAud(w.person?.hourlyRateCents ?? 0)}/h
                  </dd>
                </div>
              </dl>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Job</th>
                      <th className="pb-2 text-right">On site</th>
                      <th className="pb-2 text-right">Break</th>
                      <th className="pb-2 text-right">Paid</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {w.rows.map((e) => (
                      <tr key={e.id} data-testid="timesheet-row">
                        <td className="py-2">{e.workDate}</td>
                        <td className="py-2">
                          {e.jobId ? (
                            <span className="font-mono text-xs text-brand">
                              {jobById.get(e.jobId)?.jobCode ?? "—"}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {e.notes && (
                            <span className="block text-xs text-slate-500">
                              {e.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">{e.hours} h</td>
                        <td className="py-2 text-right text-slate-500">
                          {e.breakMinutes} m
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {formatHours(paidHours(e))}
                        </td>
                        <td className="py-2 text-right">
                          <form action={deleteTimesheetEntryAction}>
                            <input type="hidden" name="id" value={e.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              className="!min-h-[36px] !px-2 !py-1 !text-xs !text-rose-600"
                              aria-label={`Delete entry for ${e.workDate}`}
                            >
                              Delete
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {w.pay.overtimeHours > 0 && (
                <p className="mt-3">
                  <Badge tone="amber">
                    Over {w.person?.overtimeAfterHours ?? 38} h — overtime applied
                  </Badge>
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
