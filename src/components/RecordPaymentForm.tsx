"use client";

import { useActionState, useState } from "react";
import { Button, Field, inputClass } from "./ui";
import { recordPaymentAction, type FormState } from "@/app/actions";
import {
  PAYMENT_METHOD_LABELS,
  formatAud,
  type PaymentMethod,
} from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function RecordPaymentForm({
  invoiceId,
  balanceCents,
}: {
  invoiceId: string;
  balanceCents: number;
}) {
  const [state, formAction, pending] = useActionState(
    recordPaymentAction,
    initialState
  );

  // Remount after a successful save so the amount field clears.
  const [saves, setSaves] = useState(0);
  const [last, setLast] = useState(state);
  if (state !== last) {
    setLast(state);
    if (state.ok) setSaves((n) => n + 1);
  }

  if (balanceCents === 0) {
    return (
      <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
        Nothing outstanding — this invoice is paid in full.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4"
      key={saves}
      data-testid="record-payment-form"
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Amount"
          required
          hint={`${formatAud(balanceCents)} outstanding`}
        >
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={(balanceCents / 100).toFixed(2)}
            className={inputClass}
          />
        </Field>
        <Field label="Method" required>
          <select name="method" className={inputClass} defaultValue="bank">
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[])
              // Stripe payments record themselves; this form is for the rest.
              .filter((m) => m !== "stripe")
              .map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
          </select>
        </Field>
      </div>

      <Field label="Reference">
        <input
          name="reference"
          className={inputClass}
          placeholder="Bank reference, receipt number…"
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
        data-testid="record-payment-submit"
      >
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}
