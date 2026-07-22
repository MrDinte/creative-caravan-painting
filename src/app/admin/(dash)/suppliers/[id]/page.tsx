import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFullAccess } from "@/lib/guard";
import { Card } from "@/components/ui";
import { SupplierForm } from "@/components/SupplierForm";
import { SupplierLogForm } from "@/components/SupplierLogForm";
import { getSupplier, listStockItems, listSupplierLog } from "@/lib/db";
import { formatAud, isLowStock } from "@/lib/types";

export const metadata: Metadata = {
  title: "Supplier",
  robots: { index: false, follow: false },
};

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFullAccess();
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const [items, log] = await Promise.all([
    listStockItems(),
    listSupplierLog(id),
  ]);
  const supplied = items.filter((i) => i.supplierId === id);
  const needsReorder = supplied.filter(isLowStock);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/suppliers" className="hover:text-brand">
          Suppliers
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">{supplier.name}</span>
      </nav>

      <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-slate-900">
        {supplier.name}
      </h1>
      <p className="mt-1 text-slate-600">
        {supplier.contactName || "No contact set"}
        {supplier.phone && (
          <>
            {" · "}
            <a
              href={`tel:${supplier.phone}`}
              className="text-brand hover:underline"
            >
              {supplier.phone}
            </a>
          </>
        )}
        {supplier.email && (
          <>
            {" · "}
            <a
              href={`mailto:${supplier.email}`}
              className="text-brand hover:underline"
            >
              {supplier.email}
            </a>
          </>
        )}
      </p>

      <div className="mt-6">
        <SupplierForm supplier={supplier} />
      </div>

      {needsReorder.length > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50 p-5">
          <h2 className="font-display text-lg font-bold text-amber-900">
            {needsReorder.length} item{needsReorder.length === 1 ? "" : "s"} to
            reorder
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {needsReorder.map((i) => (
              <li key={i.id}>
                <Link href={`/admin/stock/${i.id}`} className="hover:underline">
                  {i.name} — {i.qtyOnHand} {i.unit} left
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Items supplied ({supplied.length})
          </h2>
          {supplied.length === 0 ? (
            <p className="mt-3 text-slate-600">
              Nothing linked to this supplier yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200">
              {supplied.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <Link
                    href={`/admin/stock/${i.id}`}
                    className="hover:text-brand"
                  >
                    <span className="font-medium">{i.name}</span>
                    <span className="block font-mono text-xs text-slate-500">
                      {i.ccpCode}
                    </span>
                  </Link>
                  <span className="text-sm text-slate-600">
                    {i.qtyOnHand} {i.unit} · {formatAud(i.costCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Logbook
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Calls, orders, price changes, problems — anything worth remembering.
          </p>
          <div className="mt-4">
            <SupplierLogForm supplierId={supplier.id} />
          </div>

          <ul className="mt-5 space-y-3" data-testid="supplier-log">
            {log.length === 0 && (
              <li className="text-sm text-slate-500">Nothing logged yet.</li>
            )}
            {log.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <p className="text-sm text-slate-700">{entry.entry}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.author} ·{" "}
                  {new Date(entry.createdAt).toLocaleString("en-AU")}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {supplier.notes && (
        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Notes
          </h2>
          <p className="mt-2 text-sm text-slate-600">{supplier.notes}</p>
        </Card>
      )}
    </div>
  );
}
