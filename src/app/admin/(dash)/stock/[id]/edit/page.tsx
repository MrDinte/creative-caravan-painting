import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFullAccess } from "@/lib/guard";
import { StockItemForm } from "@/components/StockItemForm";
import { getStockItem, listSuppliers } from "@/lib/db";

export const metadata: Metadata = {
  title: "Edit stock item",
  robots: { index: false, follow: false },
};

export default async function EditStockItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFullAccess();
  const { id } = await params;
  const [item, suppliers] = await Promise.all([
    getStockItem(id),
    listSuppliers(),
  ]);
  if (!item) notFound();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/stock" className="hover:text-brand">
          Stock
        </Link>
        <span className="mx-2" aria-hidden>/</span>
        <Link href={`/admin/stock/${item.id}`} className="hover:text-brand">
          {item.ccpCode}
        </Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-slate-800">Edit</span>
      </nav>

      <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Edit {item.name}
      </h1>
      <p className="mt-1 text-slate-600">
        Quantity on hand isn&apos;t edited here — book stock in or out from the
        item page so every change is recorded.
      </p>

      <div className="mt-6">
        <StockItemForm item={item} suppliers={suppliers} nextCode={item.ccpCode} />
      </div>
    </div>
  );
}
