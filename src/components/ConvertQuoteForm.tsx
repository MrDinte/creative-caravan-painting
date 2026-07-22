"use client";

import { useActionState, useState } from "react";
import { Button, Field, inputClass } from "./ui";
import { AssigneeField, LocationField } from "./JobFields";
import { convertQuoteToJobAction, type FormState } from "@/app/actions";
import type { Quote, Staff } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

function isoPlusDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

export function ConvertQuoteForm({
  quote,
  staff,
}: {
  quote: Quote;
  staff: Staff[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    convertQuoteToJobAction,
    initialState
  );

  if (!open) {
    return (
      <Button
        type="button"
        variant="accent"
        className="w-full !min-h-[44px] !py-2"
        onClick={() => setOpen(true)}
        data-testid="convert-quote"
      >
        Convert to job
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-4" data-testid="convert-quote-form">
      <input type="hidden" name="quoteId" value={quote.id} />
      <input type="hidden" name="customerEmail" value={quote.customerEmail} />
      <input type="hidden" name="vanMakeModel" value={quote.vanMakeModel} />

      <Field label="Job title" required>
        <input
          name="title"
          required
          defaultValue={quote.lines[0]?.description ?? "Caravan work"}
          className={inputClass}
        />
      </Field>

      <Field label="Customer name" required>
        <input
          name="customerName"
          required
          defaultValue={quote.customerName}
          className={inputClass}
        />
      </Field>

      <Field label="Scheduled start" required>
        <input
          name="scheduledStart"
          type="date"
          required
          defaultValue={isoPlusDays(0)}
          className={inputClass}
        />
      </Field>

      <Field label="Scheduled end" required>
        <input
          name="scheduledEnd"
          type="date"
          required
          defaultValue={isoPlusDays(14)}
          className={inputClass}
        />
      </Field>

      <AssigneeField staff={staff} />
      <LocationField />

      {state.message && !state.ok && (
        <p
          role="alert"
          data-testid="form-error"
          className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="accent"
          disabled={pending}
          className="!min-h-[44px] flex-1 !py-2"
          data-testid="confirm-convert-quote"
        >
          {pending ? "Creating…" : "Create job"}
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
  );
}
