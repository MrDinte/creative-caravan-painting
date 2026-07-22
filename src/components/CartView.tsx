"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useCart } from "./CartProvider";
import { Button, ButtonLink, Card, Field, inputClass } from "./ui";
import { VanArt } from "./VanArt";
import { submitOrder, type FormState } from "@/app/actions";
import { formatAud } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function CartView({ stripeLive }: { stripeLive: boolean }) {
  const { lines, setQty, remove, clear, totalCents, count } = useCart();
  const [state, formAction, pending] = useActionState(submitOrder, initialState);

  if (state.ok) {
    return (
      <Card className="mt-8 p-8 text-center" data-testid="order-success">
        <p className="text-4xl" aria-hidden>
          🎉
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">
          Order received
        </h2>
        <p className="mt-2 text-slate-600">{state.message}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <ButtonLink href="/store">Keep shopping</ButtonLink>
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
        </div>
      </Card>
    );
  }

  if (count === 0) {
    return (
      <Card className="mt-8 p-8 text-center" data-testid="cart-empty">
        <p className="text-4xl" aria-hidden>
          🛒
        </p>
        <h2 className="mt-3 font-display text-xl font-bold text-slate-900">
          Your cart is empty
        </h2>
        <p className="mt-2 text-slate-600">
          Have a look through the store — perspex, reseal kits, polish kits and
          more.
        </p>
        <ButtonLink href="/store" className="mt-6">
          Browse the store
        </ButtonLink>
      </Card>
    );
  }

  const itemsPayload = JSON.stringify(
    lines.map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      qty: l.qty,
      priceCents: l.product.priceCents,
    }))
  );

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {lines.map((l) => (
          <Card
            key={l.product.id}
            className="flex flex-col sm:flex-row gap-4 p-4"
            data-testid={`cart-line-${l.product.slug}`}
          >
            <div className="w-full sm:w-36 shrink-0 overflow-hidden rounded-xl border border-slate-200">
              <VanArt {...l.product.art} className="w-full h-auto" label={l.product.name} />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold text-slate-900">
                <Link href={`/store/${l.product.slug}`} className="hover:text-brand">
                  {l.product.name}
                </Link>
              </h2>
              <p className="text-sm text-slate-500">{l.product.category}</p>
              <p className="mt-1 font-semibold text-brand">
                {formatAud(l.product.priceCents)}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setQty(l.product.id, l.qty - 1)}
                    className="grid h-11 w-11 place-items-center rounded-l-full text-lg hover:bg-slate-100"
                    aria-label={`Decrease quantity of ${l.product.name}`}
                  >
                    −
                  </button>
                  <span
                    className="w-10 text-center font-semibold"
                    aria-live="polite"
                    data-testid={`qty-${l.product.slug}`}
                  >
                    {l.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(l.product.id, l.qty + 1)}
                    className="grid h-11 w-11 place-items-center rounded-r-full text-lg hover:bg-slate-100"
                    aria-label={`Increase quantity of ${l.product.name}`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(l.product.id)}
                  className="min-h-[44px] px-2 text-sm font-semibold text-rose-600 hover:underline"
                  aria-label={`Remove ${l.product.name} from cart`}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="font-display text-xl font-bold text-slate-900 sm:self-center">
              {formatAud(l.qty * l.product.priceCents)}
            </p>
          </Card>
        ))}

        <button
          type="button"
          onClick={clear}
          className="min-h-[44px] text-sm font-semibold text-slate-600 hover:text-rose-600 hover:underline"
        >
          Clear cart
        </button>
      </div>

      <Card className="h-fit p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Order summary
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Items</dt>
            <dd className="font-semibold">{count}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-lg">
            <dt className="font-semibold">Total (inc. GST)</dt>
            <dd className="font-display font-bold text-brand" data-testid="cart-total">
              {formatAud(totalCents)}
            </dd>
          </div>
        </dl>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="items" value={itemsPayload} />
          <Field label="Your name" required>
            <input
              name="customerName"
              required
              className={inputClass}
              placeholder="Jane Smith"
              autoComplete="name"
            />
          </Field>
          <Field label="Email" required>
            <input
              name="customerEmail"
              type="email"
              required
              className={inputClass}
              placeholder="jane@example.com"
              autoComplete="email"
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
            className="w-full"
            disabled={pending}
            data-testid="checkout-button"
          >
            {pending
              ? "Processing…"
              : stripeLive
                ? "Checkout with Stripe"
                : "Place order"}
          </Button>
        </form>

        {!stripeLive && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-900 border border-amber-200">
            Stripe is not connected yet, so this records your order as an
            enquiry and the team will send a payment link. Add{" "}
            <code className="font-mono">STRIPE_SECRET_KEY</code> to switch on
            card payments.
          </p>
        )}
      </Card>
    </div>
  );
}
