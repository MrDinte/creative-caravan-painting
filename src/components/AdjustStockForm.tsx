"use client";

import { useActionState, useState } from "react";
import { Button, Field, inputClass } from "./ui";
import { adjustStockAction, type FormState } from "@/app/actions";

const initialState: FormState = { ok: false, message: "" };

export function AdjustStockForm({
  itemId,
  unit,
}: {
  itemId: string;
  unit: string;
}) {
  const [state, formAction, pending] = useActionState(
    adjustStockAction,
    initialState
  );
  const [direction, setDirection] = useState<"in" | "out">("out");

  const [saves, setSaves] = useState(0);
  const [last, setLast] = useState(state);
  if (state !== last) {
    setLast(state);
    if (state.ok) setSaves((n) => n + 1);
  }

  return (
    <form action={formAction} className="space-y-4" key={saves} data-testid="adjust-stock-form">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="direction" value={direction} />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDirection("out")}
          className={`min-h-[48px] rounded-xl border-2 font-semibold transition-colors ${
            direction === "out"
              ? "border-rose-500 bg-rose-50 text-rose-800"
              : "border-slate-300 bg-white text-slate-600"
          }`}
          data-testid="direction-out"
        >
          − Used
        </button>
        <button
          type="button"
          onClick={() => setDirection("in")}
          className={`min-h-[48px] rounded-xl border-2 font-semibold transition-colors ${
            direction === "in"
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-slate-300 bg-white text-slate-600"
          }`}
          data-testid="direction-in"
        >
          + Received
        </button>
      </div>

      <Field label={`How many (${unit})`} required>
        <input
          name="qty"
          type="number"
          step="0.5"
          min="0.5"
          required
          className={inputClass}
          placeholder="1"
          data-testid="adjust-qty"
        />
      </Field>

      <Field label="Reason">
        <input
          name="reason"
          className={inputClass}
          placeholder={direction === "in" ? "Delivery from supplier" : "Used on CCP-2026-001"}
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
        className="w-full !min-h-[48px] !py-2"
        data-testid="adjust-stock-submit"
      >
        {pending ? "Saving…" : direction === "in" ? "Book in" : "Book out"}
      </Button>
    </form>
  );
}
