import type { Metadata } from "next";
import Link from "next/link";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { listPriceBook, nextQuoteNumber } from "@/lib/db";

export const metadata: Metadata = {
  title: "New Quote",
  robots: { index: false, follow: false },
};

export default async function NewQuotePage() {
  const [priceBook, quoteNumber] = await Promise.all([
    listPriceBook(),
    nextQuoteNumber(),
  ]);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/quotes" className="hover:text-brand">
          Quotes
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">New quote</span>
      </nav>

      <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Build a quote
      </h1>
      <p className="mt-1 text-slate-600">
        This will be quote{" "}
        <code className="font-mono font-semibold text-brand">
          {quoteNumber}
        </code>
        . Add lines from the price book, then edit any price for this job only —
        the master rate stays untouched.
      </p>

      <div className="mt-6">
        <QuoteBuilder priceBook={priceBook} />
      </div>
    </div>
  );
}
