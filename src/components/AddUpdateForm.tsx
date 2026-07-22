"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, inputClass } from "./ui";
import { addUpdateAction, type FormState } from "@/app/actions";

const initialState: FormState = { ok: false, message: "" };

export function AddUpdateForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(
    addUpdateAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3"
      data-testid="add-update-form"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <label className="block">
        <span className="sr-only">Update message</span>
        <textarea
          name="message"
          required
          rows={3}
          className={`${inputClass} min-h-[90px]`}
          placeholder="Base coat is down and looking great…"
        />
      </label>

      <label className="flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="visibleToCustomer"
          defaultChecked
          className="h-5 w-5 rounded border-slate-300 accent-teal-700"
        />
        Visible to the customer in their portal
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
        data-testid="add-update-submit"
      >
        {pending ? "Posting…" : "Post update"}
      </Button>
    </form>
  );
}
