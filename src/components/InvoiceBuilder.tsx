"use client";

import { useActionState, useState } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { createInvoiceAction, type FormState } from "@/app/actions";
import { formatAud, gstCents, type Job } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

interface DraftLine {
  key: string;
  description: string;
  qty: number;
  unitPriceCents: number;
}

let counter = 0;
const nextKey = () => `inv-line-${++counter}`;

function isoPlusDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

export function InvoiceBuilder({ jobs }: { jobs: Job[] }) {
  const [lines, setLines] = useState<DraftLine[]>([
    { key: nextKey(), description: "", qty: 1, unitPriceCents: 0 },
  ]);
  const [state, formAction, pending] = useActionState(
    createInvoiceAction,
    initialState
  );

  const patch = (key: string, changes: Partial<DraftLine>) =>
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...changes } : l))
    );

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPriceCents, 0);
  const gst = gstCents(subtotal);

  const payload = JSON.stringify(
    lines.map((l) => ({
      description: l.description,
      qty: l.qty,
      unitPriceCents: l.unitPriceCents,
    }))
  );

  return (
    <form action={formAction} className="space-y-6" data-testid="invoice-builder">
      <input type="hidden" name="lines" value={payload} />

      <Card className="p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Customer
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Customer name" required>
            <input
              name="customerName"
              required
              className={inputClass}
              placeholder="Sarah Mitchell"
            />
          </Field>
          <Field label="Email">
            <input
              name="customerEmail"
              type="email"
              className={inputClass}
              placeholder="sarah@example.com"
            />
          </Field>
          <Field label="Against job" hint="Links it to the customer's portal">
            <select name="jobId" className={inputClass} defaultValue="">
              <option value="">Not job-specific</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobCode} — {j.customerName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date" required>
            <input
              name="dueDate"
              type="date"
              required
              defaultValue={isoPlusDays(14)}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Lines
          </h2>
          <Button
            type="button"
            variant="outline"
            className="!min-h-[44px] !py-2"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                { key: nextKey(), description: "", qty: 1, unitPriceCents: 0 },
              ])
            }
            data-testid="add-invoice-line"
          >
            + Add line
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2">Description</th>
                <th className="w-24 pb-2">Qty</th>
                <th className="w-40 pb-2">Unit price</th>
                <th className="w-32 pb-2 text-right">Total</th>
                <th className="w-16 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lines.map((l) => (
                <tr key={l.key} data-testid="invoice-line">
                  <td className="py-3 pr-3">
                    <input
                      value={l.description}
                      onChange={(e) =>
                        patch(l.key, { description: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Work carried out"
                      aria-label="Line description"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={l.qty}
                      onChange={(e) =>
                        patch(l.key, { qty: Number(e.target.value) })
                      }
                      className={inputClass}
                      aria-label="Quantity"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(l.unitPriceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        patch(l.key, {
                          unitPriceCents: Math.round(
                            Number(e.target.value) * 100
                          ),
                        })
                      }
                      className={inputClass}
                      aria-label="Unit price"
                    />
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {formatAud(l.qty * l.unitPriceCents)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setLines((prev) =>
                          prev.filter((x) => x.key !== l.key)
                        )
                      }
                      className="min-h-[44px] px-2 text-sm font-semibold text-rose-600 hover:underline"
                      aria-label={`Remove line ${l.description || "untitled"}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Subtotal</dt>
            <dd className="font-semibold">{formatAud(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">GST (10%)</dt>
            <dd className="font-semibold">{formatAud(gst)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-lg">
            <dt className="font-bold">Total</dt>
            <dd
              className="font-display font-bold text-brand"
              data-testid="invoice-total"
            >
              {formatAud(subtotal + gst)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6">
        <Field label="Notes / terms">
          <textarea
            name="notes"
            rows={3}
            className={`${inputClass} min-h-[90px]`}
            placeholder="Payment terms, thanks, reference…"
          />
        </Field>
      </Card>

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
        disabled={pending || subtotal <= 0}
        data-testid="save-invoice-submit"
      >
        {pending ? "Creating…" : "Create invoice"}
      </Button>
    </form>
  );
}
