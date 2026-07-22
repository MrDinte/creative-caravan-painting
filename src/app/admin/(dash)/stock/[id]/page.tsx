import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { Barcode } from "@/components/Barcode";
import { AdjustStockForm } from "@/components/AdjustStockForm";
import { getAdminSession } from "@/lib/auth";
import {
  getStockItem,
  getSupplier,
  listStockMovements,
} from "@/lib/db";
import {
  STOCK_CATEGORY_LABELS,
  formatAud,
  isLowStock,
  marginCents,
  marginPercent,
  markupPercent,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Stock item",
  robots: { index: false, follow: false },
};

export default async function StockItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin");
  const isAdmin = session.accessLevel === "admin";

  const { id } = await params;
  const item = await getStockItem(id);
  if (!item) notFound();

  const [supplier, movements] = await Promise.all([
    isAdmin && item.supplierId
      ? getSupplier(item.supplierId)
      : Promise.resolve(null),
    listStockMovements(item.id),
  ]);

  const low = isLowStock(item);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/stock" className="hover:text-brand">
          Stock
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">{item.ccpCode}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-brand">
            {item.ccpCode}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900">
            {item.name}
          </h1>
          <p className="mt-1 text-slate-600">
            {STOCK_CATEGORY_LABELS[item.category]}
            {item.location && ` · ${item.location}`}
          </p>
        </div>
        {isAdmin && (
          <ButtonLink
            href={`/admin/stock/${item.id}/edit`}
            variant="outline"
            className="!min-h-[44px] !py-2"
          >
            Edit item
          </ButtonLink>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className={`p-6 ${low ? "border-amber-300 bg-amber-50" : ""}`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600">On hand</p>
                <p
                  className={`font-display text-4xl font-bold ${low ? "text-amber-700" : "text-slate-900"}`}
                  data-testid="qty-on-hand"
                >
                  {item.qtyOnHand}{" "}
                  <span className="text-lg font-normal text-slate-500">
                    {item.unit}
                  </span>
                </p>
              </div>
              {item.reorderLevel > 0 && (
                <p className="text-sm text-slate-600">
                  Reorder at {item.reorderLevel} {item.unit}
                  {low && (
                    <Badge tone="amber">
                      <span className="ml-2">Reorder now</span>
                    </Badge>
                  )}
                </p>
              )}
            </div>
          </Card>

          {isAdmin && (
            <Card className="p-6">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Pricing &amp; margin
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-sm text-slate-600">Cost</dt>
                  <dd className="font-display text-xl font-bold text-slate-900">
                    {formatAud(item.costCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Sale</dt>
                  <dd className="font-display text-xl font-bold text-brand">
                    {formatAud(item.saleCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Profit each</dt>
                  <dd
                    className={`font-display text-xl font-bold ${
                      marginCents(item) >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatAud(marginCents(item))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Margin</dt>
                  <dd
                    className={`font-display text-xl font-bold ${
                      marginPercent(item) >= 30
                        ? "text-emerald-700"
                        : marginPercent(item) > 0
                          ? "text-slate-900"
                          : "text-rose-700"
                    }`}
                    data-testid="margin-percent"
                  >
                    {marginPercent(item)}%
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                Margin is profit as a share of the sale price ({marginPercent(item)}%).
                Markup on cost is {markupPercent(item)}%. Stock on hand is worth{" "}
                {formatAud(item.qtyOnHand * item.costCents)} at cost,{" "}
                {formatAud(item.qtyOnHand * item.saleCents)} at sale.
              </p>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Recent movements
            </h2>
            {movements.length === 0 ? (
              <p className="mt-3 text-slate-600">Nothing recorded yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200">
                {movements.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <span
                        className={`font-display text-lg font-bold ${
                          m.delta > 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {m.delta > 0 ? "+" : ""}
                        {m.delta} {item.unit}
                      </span>
                      <span className="ml-2 text-sm text-slate-600">
                        {m.reason}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {m.author} · {new Date(m.createdAt).toLocaleDateString("en-AU")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Book stock in or out
            </h2>
            <div className="mt-4">
              <AdjustStockForm itemId={item.id} unit={item.unit} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              CCP label
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Print and stick this on the shelf. Any scanner reads it.
            </p>
            <div className="mt-4">
              <Barcode value={item.ccpCode} />
            </div>
            {item.barcode && (
              <p className="mt-4 text-xs text-slate-600">
                Supplier barcode:{" "}
                <code className="font-mono">{item.barcode}</code>
              </p>
            )}
          </Card>

          {isAdmin && supplier && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Supplier
              </h2>
              <Link
                href={`/admin/suppliers/${supplier.id}`}
                className="mt-2 block font-semibold text-brand hover:underline"
              >
                {supplier.name}
              </Link>
              <dl className="mt-2 space-y-1 text-sm text-slate-600">
                {supplier.contactName && <dd>{supplier.contactName}</dd>}
                {supplier.phone && (
                  <dd>
                    <a href={`tel:${supplier.phone}`} className="hover:text-brand">
                      {supplier.phone}
                    </a>
                  </dd>
                )}
                {supplier.accountNumber && (
                  <dd className="font-mono text-xs">
                    Acct {supplier.accountNumber}
                  </dd>
                )}
              </dl>
            </Card>
          )}

          {item.notes && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Notes
              </h2>
              <p className="mt-2 text-sm text-slate-600">{item.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
