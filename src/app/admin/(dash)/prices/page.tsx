import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { PriceBookManager } from "@/components/PriceBookManager";
import { listPriceBook } from "@/lib/db";

export const metadata: Metadata = {
  title: "Price Book",
  robots: { index: false, follow: false },
};

export default async function PricesPage() {
  const items = await listPriceBook();

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Master Price Book
      </h1>
      <p className="mt-1 text-slate-600">
        The single source of truth for job pricing. Quotes pull these rates in
        automatically — and you can still override any price on an individual
        quote without changing the master rate.
      </p>

      <Card className="mt-6 p-6">
        <PriceBookManager items={items} />
      </Card>
    </div>
  );
}
