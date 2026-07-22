"use client";

import { useActionState, useState } from "react";
import { Button, inputClass } from "./ui";
import { addSupplierLogAction, type FormState } from "@/app/actions";

const initialState: FormState = { ok: false, message: "" };

export function SupplierLogForm({ supplierId }: { supplierId: string }) {
  const [state, formAction, pending] = useActionState(
    addSupplierLogAction,
    initialState
  );

  // Remount after a save so the textarea clears.
  const [saves, setSaves] = useState(0);
  const [last, setLast] = useState(state);
  if (state !== last) {
    setLast(state);
    if (state.ok) setSaves((n) => n + 1);
  }

  return (
    <form
      action={formAction}
      className="space-y-3"
      key={saves}
      data-testid="supplier-log-form"
    >
      <input type="hidden" name="supplierId" value={supplierId} />
      <label className="block">
        <span className="sr-only">Log entry</span>
        <textarea
          name="entry"
          rows={3}
          className={`${inputClass} min-h-[80px]`}
          placeholder="Called about the teal order — 3 day lead, price up $6 a tin."
        />
      </label>

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
        data-testid="add-log-submit"
      >
        {pending ? "Saving…" : "Add to logbook"}
      </Button>
    </form>
  );
}
