"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { AssigneeField, LocationField } from "./JobFields";
import { createJobAction, type FormState } from "@/app/actions";
import type { Staff } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function NewJobForm({ staff = [] }: { staff?: Staff[] }) {
  const [state, formAction, pending] = useActionState(
    createJobAction,
    initialState
  );

  return (
    <Card className="p-6">
      {state.ok ? (
        <div data-testid="job-created">
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {state.message}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/jobs"
              className="inline-flex min-h-[44px] items-center rounded-full bg-brand-solid px-5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              View all jobs
            </Link>
            <Link
              href="/admin/jobs/new"
              className="inline-flex min-h-[44px] items-center rounded-full border-2 border-slate-300 px-5 text-sm font-semibold text-slate-800 hover:border-brand hover:text-brand"
            >
              Book another
            </Link>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-5" data-testid="new-job-form">
          <Field label="Job title" required>
            <input
              name="title"
              required
              className={inputClass}
              placeholder="Full exterior respray — two-tone"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Customer name" required>
              <input
                name="customerName"
                required
                className={inputClass}
                placeholder="Sarah Mitchell"
              />
            </Field>
            <Field label="Customer email">
              <input
                name="customerEmail"
                type="email"
                className={inputClass}
                placeholder="sarah@example.com"
              />
            </Field>
          </div>

          <Field label="Van make &amp; model">
            <input
              name="vanMakeModel"
              className={inputClass}
              placeholder="Jayco Starcraft 2004"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Scheduled start" required>
              <input
                name="scheduledStart"
                type="date"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Scheduled end" required>
              <input
                name="scheduledEnd"
                type="date"
                required
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <AssigneeField staff={staff} />
            <LocationField />
          </div>

          <Field label="Notes">
            <textarea
              name="notes"
              rows={4}
              className={`${inputClass} min-h-[110px]`}
              placeholder="Colours, customer preferences, parts on order…"
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

          <Button
            type="submit"
            disabled={pending}
            data-testid="create-job-submit"
          >
            {pending ? "Creating…" : "Create job"}
          </Button>
        </form>
      )}
    </Card>
  );
}
