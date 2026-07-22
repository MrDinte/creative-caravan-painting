"use client";

import { useActionState, useState } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { AssigneeField, LocationField } from "./JobFields";
import { updateJobAction, type FormState } from "@/app/actions";
import type { Job, Staff } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function EditJobForm({ job, staff }: { job: Job; staff: Staff[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateJobAction,
    initialState
  );

  // Collapse the form once a save succeeds.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.ok && open) setOpen(false);
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="!min-h-[42px] !py-2 !text-sm"
          onClick={() => setOpen(true)}
          data-testid="edit-job-open"
        >
          Edit job details
        </Button>
        {state.ok && state.message && (
          <span role="status" className="text-sm font-semibold text-emerald-700">
            {state.message}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="p-6" data-testid="edit-job-card">
      <h2 className="font-display text-xl font-bold text-slate-900">
        Edit job details
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Job code {job.jobCode} and the customer access code stay the same.
      </p>

      <form action={formAction} className="mt-5 space-y-5" data-testid="edit-job-form">
        <input type="hidden" name="jobId" value={job.id} />

        <Field label="Job title" required>
          <input
            name="title"
            required
            defaultValue={job.title}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Customer name" required>
            <input
              name="customerName"
              required
              defaultValue={job.customerName}
              className={inputClass}
            />
          </Field>
          <Field label="Customer email">
            <input
              name="customerEmail"
              type="email"
              defaultValue={job.customerEmail}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Van make &amp; model">
          <input
            name="vanMakeModel"
            defaultValue={job.vanMakeModel}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Scheduled start" required>
            <input
              name="scheduledStart"
              type="date"
              required
              defaultValue={job.scheduledStart}
              className={inputClass}
            />
          </Field>
          <Field label="Scheduled end" required>
            <input
              name="scheduledEnd"
              type="date"
              required
              defaultValue={job.scheduledEnd}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <AssigneeField staff={staff} defaultValue={job.assignedTo} />
          <LocationField defaultValue={job.location} />
        </div>

        <Field label="Notes">
          <textarea
            name="notes"
            rows={3}
            defaultValue={job.notes}
            className={`${inputClass} min-h-[90px]`}
          />
        </Field>

        {state.message && !state.ok && (
          <p
            role="alert"
            data-testid="form-error"
            className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={pending}
            className="!min-h-[44px] !py-2"
            data-testid="save-job-submit"
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="!min-h-[44px] !py-2"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
