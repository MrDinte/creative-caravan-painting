"use client";

import { useActionState, useMemo, useState } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { createQuoteAction, type FormState } from "@/app/actions";
import { formatAud, gstCents, type PriceBookItem } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

interface DraftLine {
  key: string;
  priceBookItemId: string | null;
  description: string;
  qty: number;
  unitPriceCents: number;
  masterPriceCents: number | null; // to flag overrides
}

let counter = 0;
const nextKey = () => `line-${++counter}`;

export function QuoteBuilder({ priceBook }: { priceBook: PriceBookItem[] }) {
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [picker, setPicker] = useState("");
  const [state, formAction, pending] = useActionState(
    createQuoteAction,
    initialState
  );

  const byId = useMemo(
    () => new Map(priceBook.map((p) => [p.id, p])),
    [priceBook]
  );

  const addFromPriceBook = (id: string) => {
    const item = byId.get(id);
    if (!item) return;
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        priceBookItemId: item.id,
        description: item.name,
        qty: 1,
        unitPriceCents: item.priceCents,
        masterPriceCents: item.priceCents,
      },
    ]);
    setPicker("");
  };

  const addCustomLine = () => {
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        priceBookItemId: null,
        description: "",
        qty: 1,
        unitPriceCents: 0,
        masterPriceCents: null,
      },
    ]);
  };

  const patch = (key: string, changes: Partial<DraftLine>) =>
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...changes } : l))
    );

  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key));

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPriceCents, 0);
  const gst = gstCents(subtotal);
  const total = subtotal + gst;

  const payload = JSON.stringify(
    lines.map((l) => ({
      priceBookItemId: l.priceBookItemId,
      description: l.description,
      qty: l.qty,
      unitPriceCents: l.unitPriceCents,
    }))
  );

  const categories = [...new Set(priceBook.map((p) => p.category))];

  return (
    <form action={formAction} className="space-y-6" data-testid="quote-builder">
      <input type="hidden" name="lines" value={payload} />

      <Card className="p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Customer details
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Customer name" required>
            <input
              name="customerName"
              required
              className={inputClass}
              placeholder="Peter Hall"
            />
          </Field>
          <Field label="Email">
            <input
              name="customerEmail"
              type="email"
              className={inputClass}
              placeholder="peter@example.com"
            />
          </Field>
          <Field label="Phone">
            <input
              name="customerPhone"
              type="tel"
              className={inputClass}
              placeholder="0400 000 000"
            />
          </Field>
          <Field label="Van make &amp; model">
            <input
              name="vanMakeModel"
              className={inputClass}
              placeholder="Franklin Regent 1979"
            />
          </Field>
          <Field label="Valid until">
            <input name="validUntil" type="date" className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Quote lines
          </h2>
          <span className="text-sm text-slate-600">
            Prices prefill from the price book — edit any of them for this quote.
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="sr-only">Add from price book</span>
            <select
              value={picker}
              onChange={(e) => addFromPriceBook(e.target.value)}
              className={inputClass}
              data-testid="price-book-picker"
            >
              <option value="">+ Add a line from the price book…</option>
              {categories.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {priceBook
                    .filter((p) => p.category === cat)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name} ({formatAud(p.priceCents)} /{" "}
                        {p.unit})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={addCustomLine}
            className="!min-h-[48px] !py-2"
            data-testid="add-custom-line"
          >
            + Custom line
          </Button>
        </div>

        {lines.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
            No lines yet. Add one from the price book above, or create a custom
            line.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2">Description</th>
                  <th className="w-24 pb-2">Qty</th>
                  <th className="w-40 pb-2">Unit price</th>
                  <th className="w-32 pb-2 text-right">Line total</th>
                  <th className="w-16 pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lines.map((l) => {
                  const overridden =
                    l.masterPriceCents !== null &&
                    l.masterPriceCents !== l.unitPriceCents;
                  return (
                    <tr key={l.key} data-testid="quote-line">
                      <td className="py-3 pr-3">
                        <input
                          value={l.description}
                          onChange={(e) =>
                            patch(l.key, { description: e.target.value })
                          }
                          className={inputClass}
                          placeholder="Describe the work"
                          aria-label="Line description"
                        />
                        {overridden && (
                          <span className="mt-1 block text-xs font-semibold text-amber-700">
                            Price overridden (book rate{" "}
                            {formatAud(l.masterPriceCents!)})
                          </span>
                        )}
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
                          data-testid="line-unit-price"
                        />
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        {formatAud(l.qty * l.unitPriceCents)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(l.key)}
                          className="min-h-[44px] px-2 text-sm font-semibold text-rose-600 hover:underline"
                          aria-label={`Remove line ${l.description || "untitled"}`}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
              data-testid="quote-total"
            >
              {formatAud(total)}
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
            placeholder="Includes colour matching. Rust repairs quoted separately if found during prep."
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
        disabled={pending || lines.length === 0}
        data-testid="save-quote-submit"
      >
        {pending ? "Saving…" : "Save quote"}
      </Button>
    </form>
  );
}
