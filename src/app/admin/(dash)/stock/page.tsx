import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { BarcodeLookup } from "@/components/BarcodeLookup";
import { getAdminSession } from "@/lib/auth";
import { listStockItems, listSuppliers } from "@/lib/db";
import {
  STOCK_CATEGORIES,
  STOCK_CATEGORY_LABELS,
  formatAud,
  isLowStock,
  marginPercent,
  stockValueAtCost,
  stockValueAtSale,
  type StockCategory,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Stock",
  robots: { index: false, follow: false },
};

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; low?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin");
  const isAdmin = session.accessLevel === "admin";

  const { cat, low } = await searchParams;
  const [items, suppliers] = await Promise.all([
    listStockItems(),
    isAdmin ? listSuppliers() : Promise.resolve([]),
  ]);

  const supplierById = new Map(suppliers.map((s) => [s.id, s]));
  const activeCat = (STOCK_CATEGORIES as string[]).includes(cat ?? "")
    ? (cat as StockCategory)
    : null;
  const lowOnly = low === "1";

  const visible = items
    .filter((i) => !activeCat || i.category === activeCat)
    .filter((i) => !lowOnly || isLowStock(i));

  const lowCount = items.filter(isLowStock).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Stock
          </h1>
          <p className="mt-1 text-slate-600">
            {isAdmin
              ? "What's on the shelf, what it cost and what it earns."
              : "What's on the shelf. Book stock in and out as you use it."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/stock/new" className="!min-h-[44px] !py-2">
              + New item
            </ButtonLink>
            <ButtonLink
              href="/admin/suppliers"
              variant="outline"
              className="!min-h-[44px] !py-2"
            >
              Suppliers
            </ButtonLink>
          </div>
        )}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Scan an item
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Scan the supplier&apos;s barcode or our own CCP label to jump straight
          to the item.
        </p>
        <div className="mt-4">
          <BarcodeLookup />
        </div>
      </Card>

      {isAdmin && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-slate-600">Stock at cost</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900">
              {formatAud(stockValueAtCost(items))}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-600">Stock at sale value</p>
            <p className="mt-1 font-display text-2xl font-bold text-brand">
              {formatAud(stockValueAtSale(items))}
            </p>
          </Card>
          <Card
            className={`p-5 ${lowCount > 0 ? "border-amber-200 bg-amber-50" : ""}`}
          >
            <p
              className={`text-sm ${lowCount > 0 ? "text-amber-800" : "text-slate-600"}`}
            >
              Needs reordering
            </p>
            <p
              className={`mt-1 font-display text-2xl font-bold ${
                lowCount > 0 ? "text-amber-700" : "text-slate-900"
              }`}
              data-testid="low-stock-count"
            >
              {lowCount}
            </p>
          </Card>
        </div>
      )}

      <nav aria-label="Filter stock" className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/stock"
          aria-current={!activeCat && !lowOnly ? "page" : undefined}
          className={`inline-flex min-h-[38px] items-center rounded-full px-4 text-sm font-semibold ${
            !activeCat && !lowOnly
              ? "bg-brand-solid text-white"
              : "border border-slate-300 bg-[var(--surface)] text-slate-700 hover:border-brand"
          }`}
          data-testid="stock-filter-all"
        >
          All ({items.length})
        </Link>
        <Link
          href="/admin/stock?low=1"
          aria-current={lowOnly ? "page" : undefined}
          className={`inline-flex min-h-[38px] items-center rounded-full px-4 text-sm font-semibold ${
            lowOnly
              ? "bg-amber-500 text-white"
              : "border border-amber-300 bg-[var(--surface)] text-amber-800 hover:bg-amber-50"
          }`}
          data-testid="stock-filter-low"
        >
          Low stock ({lowCount})
        </Link>
        {STOCK_CATEGORIES.map((c) => {
          const count = items.filter((i) => i.category === c).length;
          if (count === 0) return null;
          return (
            <Link
              key={c}
              href={`/admin/stock?cat=${c}`}
              aria-current={activeCat === c ? "page" : undefined}
              className={`inline-flex min-h-[38px] items-center rounded-full px-4 text-sm font-semibold ${
                activeCat === c
                  ? "bg-brand-solid text-white"
                  : "border border-slate-300 bg-[var(--surface)] text-slate-700 hover:border-brand"
              }`}
              data-testid={`stock-filter-${c}`}
            >
              {STOCK_CATEGORY_LABELS[c]} ({count})
            </Link>
          );
        })}
      </nav>

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">On hand</th>
                {isAdmin && <th className="px-4 py-3 text-right">Cost</th>}
                {isAdmin && <th className="px-4 py-3 text-right">Sale</th>}
                {isAdmin && <th className="px-4 py-3 text-right">Margin</th>}
                {isAdmin && <th className="px-4 py-3">Supplier</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 3} className="px-4 py-6 text-slate-600">
                    Nothing here.
                  </td>
                </tr>
              )}
              {visible.map((item) => {
                const lowNow = isLowStock(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/stock/${item.id}`}
                        className="font-mono text-xs font-semibold text-brand hover:underline"
                      >
                        {item.ccpCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/stock/${item.id}`}
                        className="font-semibold hover:text-brand"
                      >
                        {item.name}
                      </Link>
                      <span className="block text-xs text-slate-500">
                        {STOCK_CATEGORY_LABELS[item.category]}
                        {item.location && ` · ${item.location}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          lowNow ? "font-bold text-amber-700" : "text-slate-700"
                        }
                      >
                        {item.qtyOnHand} {item.unit}
                      </span>
                      {lowNow && (
                        <Badge tone="amber">
                          <span className="ml-1">Reorder</span>
                        </Badge>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatAud(item.costCents)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatAud(item.saleCents)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            marginPercent(item) >= 30
                              ? "font-semibold text-emerald-700"
                              : marginPercent(item) > 0
                                ? "text-slate-700"
                                : "text-rose-700"
                          }
                        >
                          {marginPercent(item)}%
                        </span>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-4 py-3 text-slate-600">
                        {item.supplierId ? (
                          <Link
                            href={`/admin/suppliers/${item.supplierId}`}
                            className="hover:text-brand"
                          >
                            {supplierById.get(item.supplierId)?.name ?? "—"}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
