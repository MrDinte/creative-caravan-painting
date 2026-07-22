import type { Metadata } from "next";
import Link from "next/link";
import { VanArt } from "@/components/VanArt";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Badge, Card, Section, SectionHeading } from "@/components/ui";
import { listProducts } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { formatAud } from "@/lib/types";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Shop perspex cut to size, reseal kits, polish kits, window seals, gift vouchers and restoration booking deposits from Creative Caravan Painting.",
};

export default async function StorePage() {
  const products = await listProducts();
  const categories = [...new Set(products.map((p) => p.category))];
  const stripeLive = isStripeConfigured();

  return (
    <>
      <section className="bg-gradient-to-b from-brand-soft to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900">
            Store
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Workshop-grade products and services, shipped Australia-wide or
            ready for pickup from our Caboolture South workshop.
          </p>
          {!stripeLive && (
            <p className="mt-4 inline-flex rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 border border-amber-200">
              <strong className="mr-1">Demo mode:</strong> checkout records your
              order as an enquiry — Stripe payments are ready to switch on.
            </p>
          )}
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="Shop"
          title="Products &amp; services"
          intro="Everything here is what we use in the workshop every day."
        />

        <nav aria-label="Product categories" className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <a
              key={c}
              href={`#${c.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand"
            >
              {c}
            </a>
          ))}
        </nav>

        {categories.map((category) => (
          <div
            key={category}
            id={category.toLowerCase().replace(/[^a-z]+/g, "-")}
            className="mt-12 scroll-mt-24"
          >
            <h3 className="font-display text-xl font-bold text-slate-900">
              {category}
            </h3>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products
                .filter((p) => p.category === category)
                .map((p) => (
                  <Card key={p.id} className="flex flex-col overflow-hidden">
                    <Link
                      href={`/store/${p.slug}`}
                      aria-label={`View ${p.name}`}
                    >
                      <VanArt
                        body={p.art.body}
                        stripe={p.art.stripe}
                        accent={p.art.accent}
                        className="w-full h-auto"
                        label={p.name}
                      />
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
                      <Badge tone="slate">{p.category}</Badge>
                      <h4 className="mt-2 font-display text-lg font-bold text-slate-900">
                        <Link
                          href={`/store/${p.slug}`}
                          className="hover:text-brand"
                        >
                          {p.name}
                        </Link>
                      </h4>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                        {p.description}
                      </p>
                      <p className="mt-4 font-display text-2xl font-bold text-brand">
                        {formatAud(p.priceCents)}
                      </p>
                      <div className="mt-4 flex flex-col gap-2">
                        <AddToCartButton product={p} className="w-full" />
                        <Link
                          href={`/store/${p.slug}`}
                          className="inline-flex min-h-[44px] items-center justify-center text-sm font-semibold text-brand hover:underline"
                        >
                          View details →
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </Section>
    </>
  );
}
