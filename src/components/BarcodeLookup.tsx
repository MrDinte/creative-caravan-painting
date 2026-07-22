"use client";

import { useActionState, useRef } from "react";
import { Button, inputClass } from "./ui";
import { BarcodeScanner } from "./BarcodeScanner";
import { lookupBarcodeAction, type FormState } from "@/app/actions";

const initialState: FormState = { ok: false, message: "" };

export function BarcodeLookup() {
  const [state, formAction, pending] = useActionState(
    lookupBarcodeAction,
    initialState
  );

  // Uncontrolled on purpose. A controlled value can lag behind the form
  // submission — observed on mobile Safari, where the action received an
  // empty code. Keeping the value in the DOM means what's on screen is
  // exactly what gets submitted. The scanner writes into it via the ref.
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <BarcodeScanner
        onScan={(value) => {
          if (inputRef.current) inputRef.current.value = value;
        }}
      />

      <form action={formAction} className="flex flex-wrap gap-2">
        <label className="min-w-[200px] flex-1">
          <span className="sr-only">Barcode or CCP code</span>
          <input
            ref={inputRef}
            name="code"
            className={`${inputClass} font-mono`}
            placeholder="Scan, or type CCP-S-0001"
            data-testid="barcode-input"
          />
        </label>
        <Button
          type="submit"
          disabled={pending}
          className="!min-h-[48px] !py-2"
          data-testid="barcode-lookup-submit"
        >
          {pending ? "Looking…" : "Find item"}
        </Button>
      </form>

      {state.message && !state.ok && (
        <p
          role="alert"
          data-testid="form-error"
          className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
