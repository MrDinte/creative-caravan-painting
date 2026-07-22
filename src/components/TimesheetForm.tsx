"use client";

import { useActionState, useState } from "react";
import { Button, Field, inputClass } from "./ui";
import { addTimesheetEntryAction, type FormState } from "@/app/actions";
import type { Job, Staff } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function TimesheetForm({
  staff,
  jobs,
  isAdmin,
  ownStaffId,
  defaultBreakMinutes,
  today,
}: {
  staff: Staff[];
  jobs: Job[];
  isAdmin: boolean;
  ownStaffId: string;
  defaultBreakMinutes: number;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    addTimesheetEntryAction,
    initialState
  );

  // Remount the form after a successful save so the inputs clear.
  const [saveCount, setSaveCount] = useState(0);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.ok) setSaveCount((n) => n + 1);
  }

  return (
    <form
      action={formAction}
      className="space-y-4"
      key={saveCount}
      data-testid="timesheet-form"
    >
      {isAdmin ? (
        <Field label="Who" required>
          <select name="staffId" className={inputClass} defaultValue={ownStaffId}>
            <option value="">Choose a team member…</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="staffId" value={ownStaffId} />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date worked" required>
          <input
            name="workDate"
            type="date"
            required
            defaultValue={today}
            className={inputClass}
          />
        </Field>
        <Field label="Hours on site" required hint="Before the break">
          <input
            name="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            required
            placeholder="8.5"
            className={inputClass}
          />
        </Field>
        <Field label="Unpaid break" hint="Minutes">
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
      </div>

      <Field label="Job">
        <select name="jobId" className={inputClass} defaultValue="">
          <option value="">Not job-specific</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.jobCode} — {j.title}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes">
        <input
          name="notes"
          className={inputClass}
          placeholder="Sanding and prep"
        />
      </Field>

      {state.message && (
        <p
          role="status"
          className={`rounded-lg px-4 py-2 text-sm ${
            state.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="!min-h-[44px] !py-2"
        data-testid="add-timesheet-submit"
      >
        {pending ? "Saving…" : "Log hours"}
      </Button>
    </form>
  );
}
