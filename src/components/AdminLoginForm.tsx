"use client";

import { useActionState } from "react";
import { Button, Field, inputClass } from "./ui";
import { adminLogin, type FormState } from "@/app/actions";

const initialState: FormState = { ok: false, message: "" };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);

  return (
    <form action={formAction} className="space-y-5" data-testid="admin-login-form">
      <Field label="Username" required>
        <input
          name="username"
          required
          className={inputClass}
          autoComplete="username"
          placeholder="admin"
        />
      </Field>
      <Field label="Password" required>
        <input
          name="password"
          type="password"
          required
          className={inputClass}
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>

      {state.message && !state.ok && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
          data-testid="admin-login-error"
        >
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={pending}
        data-testid="admin-login-submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
