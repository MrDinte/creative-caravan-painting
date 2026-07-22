import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { Section } from "@/components/ui";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your Creative Caravan Painting order and check out.",
};

export default function CartPage() {
  return (
    <Section>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
        Your Cart
      </h1>
      <CartView stripeLive={isStripeConfigured()} />
    </Section>
  );
}
