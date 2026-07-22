import type { Product } from "./types";

// Stripe integration stub — ready to wire up when keys are added.
//
// To go live:
//   1. npm i stripe @stripe/stripe-js
//   2. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
//   3. Replace the body of createCheckoutSession() with a real Stripe Checkout call:
//
//        import Stripe from "stripe";
//        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//        const session = await stripe.checkout.sessions.create({
//          mode: "payment",
//          line_items: items.map((i) => ({
//            price_data: {
//              currency: "aud",
//              product_data: { name: i.name },
//              unit_amount: i.priceCents,
//            },
//            quantity: i.qty,
//          })),
//          success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
//          cancel_url: `${origin}/store/cart`,
//        });
//        return { url: session.url! };
//
//   4. Add a webhook route at /api/stripe/webhook to mark orders paid.

export interface CheckoutItem {
  product: Product;
  qty: number;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export interface CheckoutResult {
  mode: "stripe" | "enquiry";
  url?: string;
}

// In demo mode we record the order as an enquiry instead of charging a card.
export async function createCheckoutSession(): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { mode: "enquiry" };
  }
  // Placeholder — real Stripe call goes here once keys exist.
  return { mode: "stripe" };
}
