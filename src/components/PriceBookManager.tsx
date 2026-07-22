"use client";

import { useActionState, useState } from "react";
import { Button, Field, inputClass } from "./ui";
import {
  deletePriceBookItemAction,
  savePriceBookItemAction,
  type FormState,
} from "@/app/actions";
import { formatAud, type PriceBookItem } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function PriceBookManager({ items }: { items: PriceBookItem[] }) {
  const [state, formAction, pending] = useActionState(
    savePriceBookItemAction,
    initialState
  );
  const [editing, setEditing] = useState<PriceBookItem | null>(null);

  // Drop out of edit mode as soon as a save succeeds. Adjusting state during
  // render (rather than in an effect) is the supported pattern for reacting to
  // a changed value; the keyed <form> below then remounts with fresh inputs.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.ok && editing) setEditing(null);
  }

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900">
          Rates ({items.length})
        </h2>

        {categories.map((cat) => (
          <div key={cat} className="mt-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {cat}
            </h3>
            <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {items
                .filter((i) => i.category === cat)
                .map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{i.name}</p>
                      <p className="font-mono text-xs text-slate-500">
                        {i.code} · {i.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-brand">
                        {formatAud(i.priceCents)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditing(i)}
                        className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand"
                        data-testid={`edit-price-${i.code}`}
                      >
                        Edit
                      </button>
                      <form action={deletePriceBookItemAction}>
                        <input type="hidden" name="id" value={i.id} />
                        <button
                          type="submit"
                          className="min-h-[40px] rounded-lg px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                          aria-label={`Delete ${i.name}`}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <div className="sticky top-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {editing ? "Edit rate" : "Add a rate"}
          </h2>

          <form
            action={formAction}
            className="mt-4 space-y-4"
            data-testid="price-book-form"
            key={`${editing?.id ?? "new"}-${lastState.ok ? "saved" : "editing"}`}
          >
            <input type="hidden" name="id" value={editing?.id ?? ""} />

            <Field label="Code" required>
              <input
                name="code"
                required
                defaultValue={editing?.code ?? ""}
                className={`${inputClass} font-mono`}
                placeholder="PB-EXT-01"
              />
            </Field>

            <Field label="Description" required>
              <input
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                className={inputClass}
                placeholder="Full exterior respray — 2 pac"
              />
            </Field>

            <Field label="Category" required>
              <input
                name="category"
                required
                defaultValue={editing?.category ?? ""}
                className={inputClass}
                placeholder="Exterior Painting"
                list="pb-categories"
              />
              <datalist id="pb-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Unit">
                <input
                  name="unit"
                  defaultValue={editing?.unit ?? "each"}
                  className={inputClass}
                  placeholder="each"
                />
              </Field>
              <Field label="Price (AUD)" required>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={
                    editing ? (editing.priceCents / 100).toFixed(2) : ""
                  }
                  className={inputClass}
                  placeholder="6500.00"
                />
              </Field>
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

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={pending}
                className="!min-h-[44px] flex-1 !py-2"
                data-testid="save-price-submit"
              >
                {pending ? "Saving…" : editing ? "Save changes" : "Add rate"}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  className="!min-h-[44px] !py-2"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
