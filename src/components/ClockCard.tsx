"use client";

import { useActionState, useSyncExternalStore } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { clockOffAction, clockOnAction, type FormState } from "@/app/actions";
import { brisbaneLabel, brisbaneTime, formatElapsed } from "@/lib/brisbane";
import type { Job } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

function subscribeToTick(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

// Whole seconds so the snapshot is stable within a tick.
const getNowSeconds = () => Math.floor(Date.now() / 1000);

export function ClockCard({
  name,
  openShiftStartedAt,
  openShiftJobId,
  jobs,
  defaultBreakMinutes,
}: {
  name: string;
  openShiftStartedAt: string | null;
  openShiftJobId: string;
  jobs: Job[];
  defaultBreakMinutes: number;
}) {
  const [onState, onAction, clockingOn] = useActionState(
    clockOnAction,
    initialState
  );
  const [offState, offAction, clockingOff] = useActionState(
    clockOffAction,
    initialState
  );

  // The wall clock is an external system, so it's subscribed to rather than
  // pushed into state from an effect. The server snapshot is 0 so the first
  // paint matches the server markup, then it ticks once hydrated.
  const nowSeconds = useSyncExternalStore(subscribeToTick, getNowSeconds, () => 0);
  const now = nowSeconds ? new Date(nowSeconds * 1000) : null;

  const clockedOn = Boolean(openShiftStartedAt);
  const notice = offState.message ? offState : onState;
  const currentJob = jobs.find((j) => j.id === openShiftJobId);

  return (
    <Card
      className={`p-6 ${clockedOn ? "border-emerald-300 bg-emerald-50" : ""}`}
      data-testid="clock-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            {clockedOn ? `You're on the clock, ${name}` : `Morning, ${name}`}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {brisbaneLabel()} · Brisbane time{" "}
            <span
              className="font-mono font-semibold text-slate-900"
              suppressHydrationWarning
              data-testid="brisbane-clock"
            >
              {now ? brisbaneTime(now) : brisbaneTime()}
            </span>
          </p>
        </div>

        {clockedOn && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-emerald-700">
              Elapsed
            </p>
            <p
              className="font-display text-3xl font-bold text-emerald-700"
              suppressHydrationWarning
              data-testid="elapsed-timer"
            >
              {now ? formatElapsed(openShiftStartedAt!, now) : "0h 00m"}
            </p>
            <p className="text-xs text-slate-600">
              Since {brisbaneTime(new Date(openShiftStartedAt!))}
              {currentJob ? ` · ${currentJob.jobCode}` : ""}
            </p>
          </div>
        )}
      </div>

      {notice.message && (
        <p
          role="status"
          className={`mt-4 rounded-lg px-4 py-2 text-sm ${
            notice.ok
              ? "bg-emerald-100 text-emerald-900"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {notice.message}
        </p>
      )}

      {clockedOn ? (
        <form action={offAction} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Unpaid break" hint="Minutes taken today">
              <input
                name="breakMinutes"
                type="number"
                step="5"
                min="0"
                max="599"
                defaultValue={defaultBreakMinutes}
                className={inputClass}
              />
            </Field>
            <Field label="Notes">
              <input
                name="notes"
                className={inputClass}
                placeholder="What you worked on"
              />
            </Field>
          </div>
          <Button
            type="submit"
            variant="accent"
            disabled={clockingOff}
            className="w-full !min-h-[64px] !text-lg"
            data-testid="clock-off"
          >
            {clockingOff ? "Clocking off…" : "CLOCK OFF"}
          </Button>
        </form>
      ) : (
        <form action={onAction} className="mt-5 space-y-4">
          <Field label="Job (optional)">
            <select name="jobId" className={inputClass} defaultValue="">
              <option value="">Not job-specific</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobCode} — {j.title}
                </option>
              ))}
            </select>
          </Field>
          <Button
            type="submit"
            disabled={clockingOn}
            className="w-full !min-h-[64px] !text-lg"
            data-testid="clock-on"
          >
            {clockingOn ? "Clocking on…" : "CLOCK ON"}
          </Button>
        </form>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Hours are recorded against Brisbane time (AEST, UTC+10) and rounded to
        the nearest quarter hour.
      </p>
    </Card>
  );
}
