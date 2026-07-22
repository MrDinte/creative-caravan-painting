"use client";

import { useActionState } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { customerLogin, type FormState } from "@/app/actions";

const initialState: FormState = { ok: false, message: "" };

export function CustomerLoginForm() {
  const [state, formAction, pending] = useActionState(
    customerLogin,
    initialState
  );

  return (
    <Card className="p-6 sm:p-8">
      <form action={formAction} className="space-y-5" data-testid="portal-login-form">
        <Field label="Job code" required hint="Looks like CCP-2026-001">
          <input
            name="jobCode"
            required
            className={`${inputClass} font-mono uppercase`}
            placeholder="CCP-2026-001"
            autoComplete="off"
          />
        </Field>
        <Field label="Access code" required>
          <input
            name="accessCode"
            required
            className={`${inputClass} font-mono uppercase`}
            placeholder="VAN123"
            autoComplete="off"
          />
        </Field>

        {state.message && !state.ok && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
            data-testid="portal-login-error"
          >
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={pending}
          data-testid="portal-login-submit"
        >
          {pending ? "Checking…" : "View my van"}
        </Button>
      </form>
    </Card>
  );
}
