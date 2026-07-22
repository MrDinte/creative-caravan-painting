"use client";

import { useActionState, useState } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { saveSupplierAction, type FormState } from "@/app/actions";
import type { Supplier } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const [state, formAction, pending] = useActionState(
    saveSupplierAction,
    initialState
  );
  const [open, setOpen] = useState(!supplier);

  // Collapse after a successful save on an existing supplier.
  const [last, setLast] = useState(state);
  if (state !== last) {
    setLast(state);
    if (state.ok && supplier && open) setOpen(false);
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="!min-h-[42px] !py-2 !text-sm"
          onClick={() => setOpen(true)}
          data-testid="edit-supplier-open"
        >
          Edit supplier details
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
    <Card className="p-6">
      <form action={formAction} className="space-y-5" data-testid="supplier-form">
        {supplier && <input type="hidden" name="id" value={supplier.id} />}

        <Field label="Supplier name" required>
          <input
            name="name"
            required
            defaultValue={supplier?.name}
            className={inputClass}
            placeholder="Brisbane Paint Supplies"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact name">
            <input
              name="contactName"
              defaultValue={supplier?.contactName}
              className={inputClass}
              placeholder="Dan Whitfield"
            />
          </Field>
          <Field label="Phone">
            <input
              name="phone"
              type="tel"
              defaultValue={supplier?.phone}
              className={inputClass}
              placeholder="07 3888 1200"
            />
          </Field>
          <Field label="Email">
            <input
              name="email"
              type="email"
              defaultValue={supplier?.email}
              className={inputClass}
            />
          </Field>
          <Field label="Website">
            <input
              name="website"
              defaultValue={supplier?.website}
              className={inputClass}
              placeholder="https://…"
            />
          </Field>
          <Field label="Address">
            <input
              name="address"
              defaultValue={supplier?.address}
              className={inputClass}
            />
          </Field>
          <Field label="Our account number">
            <input
              name="accountNumber"
              defaultValue={supplier?.accountNumber}
              className={`${inputClass} font-mono`}
              placeholder="CCP-4471"
            />
          </Field>
        </div>

        <Field label="Notes" hint="Terms, delivery, lead times">
          <textarea
            name="notes"
            rows={3}
            defaultValue={supplier?.notes}
            className={`${inputClass} min-h-[90px]`}
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

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={pending}
            className="!min-h-[44px] !py-2"
            data-testid="save-supplier-submit"
          >
            {pending ? "Saving…" : supplier ? "Save changes" : "Add supplier"}
          </Button>
          {supplier && (
            <Button
              type="button"
              variant="outline"
              className="!min-h-[44px] !py-2"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
