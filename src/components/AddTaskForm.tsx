"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, inputClass } from "./ui";
import { createTaskAction, type FormState } from "@/app/actions";

const initialState: FormState = { ok: false, message: "" };

export function AddTaskForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(
    createTaskAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the inputs once a task is successfully added.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3"
      data-testid="add-task-form"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="block">
          <span className="sr-only">Task title</span>
          <input
            name="title"
            required
            className={inputClass}
            placeholder="Sand and prep exterior panels"
          />
        </label>
        <label className="block">
          <span className="sr-only">Assignee</span>
          <input
            name="assignee"
            className={inputClass}
            placeholder="Assign to…"
          />
        </label>
      </div>

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
        data-testid="add-task-submit"
      >
        {pending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}
