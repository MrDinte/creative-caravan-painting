import type { Metadata } from "next";
import Link from "next/link";
import { requireFullAccess } from "@/lib/guard";
import { Card } from "@/components/ui";
import { SupplierForm } from "@/components/SupplierForm";
import { listStockItems, listSuppliers } from "@/lib/db";
import { formatAud } from "@/lib/types";

export const metadata: Metadata = {
  title: "Suppliers",
  robots: { index: false, follow: false },
};

export default async function SuppliersPage() {
  await requireFullAccess();
  const [suppliers, items] = await Promise.all([
    listSuppliers(),
    listStockItems(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Suppliers
      </h1>
      <p className="mt-1 text-slate-600">
        Who you buy from, who to call, and a logbook of every dealing.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {suppliers.length === 0 && (
            <Card className="p-6 text-slate-600">
              No suppliers yet — add your first one.
            </Card>
          )}
          {suppliers.map((s) => {
            const supplied = items.filter((i) => i.supplierId === s.id);
            const onHandValue = supplied.reduce(
              (sum, i) => sum + i.qtyOnHand * i.costCents,
              0
            );
            return (
              <Card key={s.id} className="p-5" data-testid={`supplier-${s.name}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/suppliers/${s.id}`}
                      className="font-display text-lg font-bold text-slate-900 hover:text-brand"
                    >
                      {s.name}
                    </Link>
                    <p className="text-sm text-slate-600">
                      {s.contactName || "No contact set"}
                      {s.phone && (
                        <>
                          {" · "}
                          <a href={`tel:${s.phone}`} className="hover:text-brand">
                            {s.phone}
                          </a>
                        </>
                      )}
                    </p>
                    {s.accountNumber && (
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        Acct {s.accountNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">
                      {supplied.length} item{supplied.length === 1 ? "" : "s"}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {formatAud(onHandValue)} on hand
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Add a supplier
          </h2>
          <div className="mt-3">
            <SupplierForm />
          </div>
        </div>
      </div>
    </div>
  );
}
