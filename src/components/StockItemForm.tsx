"use client";

import { useActionState, useRef, useState } from "react";
import { Button, Card, Field, inputClass } from "./ui";
import { BarcodeScanner } from "./BarcodeScanner";
import { saveStockItemAction, type FormState } from "@/app/actions";
import {
  STOCK_CATEGORIES,
  STOCK_CATEGORY_LABELS,
  formatAud,
  type StockItem,
  type Supplier,
} from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function StockItemForm({
  item,
  suppliers,
  nextCode,
}: {
  item?: StockItem;
  suppliers: Supplier[];
  nextCode: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveStockItemAction,
    initialState
  );
  // Uncontrolled: a controlled value can lag the form submission on mobile
  // Safari and post empty. The scanner writes straight into the DOM node.
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [cost, setCost] = useState(
    item ? (item.costCents / 100).toFixed(2) : "0.00"
  );
  const [sale, setSale] = useState(
    item ? (item.saleCents / 100).toFixed(2) : "0.00"
  );

  // Live margin, so pricing decisions are made with the number visible.
  const costCents = Math.round(Number(cost || 0) * 100);
  const saleCents = Math.round(Number(sale || 0) * 100);
  const profit = saleCents - costCents;
  const margin = saleCents > 0 ? Math.round((profit / saleCents) * 100) : 0;

  return (
    <form action={formAction} className="space-y-6" data-testid="stock-item-form">
      {item && <input type="hidden" name="id" value={item.id} />}
      {item && <input type="hidden" name="ccpCode" value={item.ccpCode} />}
      {!item && <input type="hidden" name="qtyOnHand" value="0" />}

      <Card className="p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Item details
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          CCP code:{" "}
          <code className="font-mono font-semibold text-brand">
            {item?.ccpCode ?? nextCode}
          </code>{" "}
          — generated automatically and printed as a barcode label.
        </p>

        <div className="mt-4 space-y-5">
          <Field label="Item name" required>
            <input
              name="name"
              required
              defaultValue={item?.name}
              className={inputClass}
              placeholder="2 pac topcoat — Gloss White 4L"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Category" required>
              <select
                name="category"
                className={inputClass}
                defaultValue={item?.category ?? "other"}
              >
                {STOCK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {STOCK_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit">
              <input
                name="unit"
                defaultValue={item?.unit ?? "each"}
                className={inputClass}
                placeholder="tin, sheet, each"
              />
            </Field>
            <Field label="Shelf location">
              <input
                name="location"
                defaultValue={item?.location}
                className={inputClass}
                placeholder="Paint store A2"
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Supplier barcode
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Scan the barcode on the product so it can be looked up later. Optional
          — our own CCP label works regardless.
        </p>
        <div className="mt-4 space-y-3">
          <BarcodeScanner
            onScan={(value) => {
              if (barcodeRef.current) barcodeRef.current.value = value;
            }}
          />
          <Field label="Barcode">
            <input
              ref={barcodeRef}
              name="barcode"
              defaultValue={item?.barcode ?? ""}
              className={`${inputClass} font-mono`}
              placeholder="9310872001234"
              data-testid="stock-barcode-input"
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Pricing
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Cost price (what you pay)" required>
            <input
              name="cost"
              type="number"
              step="0.01"
              min="0"
              required
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Sale price (what you charge)" required>
            <input
              name="sale"
              type="number"
              step="0.01"
              min="0"
              required
              value={sale}
              onChange={(e) => setSale(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div
          className={`mt-4 rounded-xl p-4 ${
            margin >= 30
              ? "bg-emerald-50"
              : margin > 0
                ? "bg-slate-50"
                : "bg-rose-50"
          }`}
          data-testid="live-margin"
        >
          <p className="text-sm">
            <strong className="text-slate-900">
              {formatAud(profit)} profit per {item?.unit ?? "unit"}
            </strong>{" "}
            <span
              className={
                margin >= 30
                  ? "text-emerald-800"
                  : margin > 0
                    ? "text-slate-600"
                    : "text-rose-800"
              }
            >
              — {margin}% margin
              {margin <= 0 && saleCents > 0 && " (you're losing money on this)"}
            </span>
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Reorder level" hint="Flagged when on hand drops to this">
            <input
              name="reorderLevel"
              type="number"
              step="0.5"
              min="0"
              defaultValue={item?.reorderLevel ?? 0}
              className={inputClass}
            />
          </Field>
          <Field label="Supplier">
            <select
              name="supplierId"
              className={inputClass}
              defaultValue={item?.supplierId ?? ""}
            >
              <option value="">No supplier set</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <Field label="Notes">
          <textarea
            name="notes"
            rows={3}
            defaultValue={item?.notes}
            className={`${inputClass} min-h-[90px]`}
          />
        </Field>
      </Card>

      {state.message && (
        <p
          role="status"
          data-testid={state.ok ? "stock-saved" : "form-error"}
          className={`rounded-lg px-4 py-3 text-sm ${
            state.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} data-testid="save-stock-submit">
        {pending ? "Saving…" : item ? "Save changes" : "Add item"}
      </Button>
    </form>
  );
}
