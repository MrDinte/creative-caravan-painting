import type { Metadata } from "next";
import Link from "next/link";
import { requireFullAccess } from "@/lib/guard";
import { StockItemForm } from "@/components/StockItemForm";
import { listSuppliers, nextStockCode } from "@/lib/db";

export const metadata: Metadata = {
  title: "New stock item",
  robots: { index: false, follow: false },
};

export default async function NewStockItemPage() {
  await requireFullAccess();
  const [suppliers, nextCode] = await Promise.all([
    listSuppliers(),
    nextStockCode(),
  ]);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/stock" className="hover:text-brand">
          Stock
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">New item</span>
      </nav>

      <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Add a stock item
      </h1>
      <p className="mt-1 text-slate-600">
        Scan the supplier barcode if it has one. Either way it gets its own CCP
        label you can print and stick on the shelf.
      </p>

      <div className="mt-6">
        <StockItemForm suppliers={suppliers} nextCode={nextCode} />
      </div>
    </div>
  );
}
