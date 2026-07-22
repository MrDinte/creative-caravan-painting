"use client";

import { useActionState } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { submitContact, type FormState } from "@/app/actions";
import { services } from "@/lib/services";

const initialState: FormState = { ok: false, message: "" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContact,
    initialState
  );

  if (state.ok) {
    return (
      <Card className="p-8 text-center" data-testid="contact-success">
        <p className="text-4xl" aria-hidden>
          ✅
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">
          Message sent
        </h2>
        <p className="mt-2 text-slate-600">{state.message}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form action={formAction} className="space-y-5" data-testid="contact-form">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" required>
            <input
              name="name"
              required
              className={inputClass}
              placeholder="Jane Smith"
              autoComplete="name"
            />
          </Field>
          <Field label="Phone">
            <input
              name="phone"
              type="tel"
              className={inputClass}
              placeholder="0400 000 000"
              autoComplete="tel"
            />
          </Field>
        </div>

        <Field label="Email" required>
          <input
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder="jane@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="What do you need?">
          <select name="service" className={inputClass} defaultValue="">
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s.slug} value={s.heading}>
                {s.heading}
              </option>
            ))}
            <option value="Something else">Something else</option>
          </select>
        </Field>

        <Field label="Your message" required hint="Tell us about your van — make, model, and what you'd like done.">
          <textarea
            name="message"
            required
            rows={5}
            className={`${inputClass} min-h-[140px]`}
            placeholder="Hi team, I've got a 1998 Jayco that needs a full respray…"
          />
        </Field>

        {state.message && !state.ok && (
          <p
            role="alert"
            data-testid="form-error"
            className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          variant="accent"
          className="w-full sm:w-auto"
          disabled={pending}
          data-testid="contact-submit"
        >
          {pending ? "Sending…" : "Send message"}
        </Button>
      </form>
    </Card>
  );
}
