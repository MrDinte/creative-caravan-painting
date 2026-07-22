import type { Metadata } from "next";
import Link from "next/link";
import { requireFullAccess } from "@/lib/guard";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { PaymentProgress } from "@/components/PaymentProgress";
import { listInvoices } from "@/lib/db";
import {
  formatAud,
  invoiceBalanceCents,
  invoiceDisplayStatus,
  invoicePaidCents,
  invoiceTotalCents,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false, follow: false },
};

export default async function InvoicesPage() {
  await requireFullAccess();
  const invoices = await listInvoices();

  const outstanding = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + invoiceBalanceCents(i), 0);
  const collected = invoices.reduce((sum, i) => sum + invoicePaidCents(i), 0);
  const invoiced = invoices
    .filter((i) => i.status !== "draft" && i.status !== "cancelled")
    .reduce((sum, i) => sum + invoiceTotalCents(i), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Invoices
          </h1>
          <p className="mt-1 text-slate-600">
            Raise invoices, record payments and see what&apos;s still owed.
          </p>
        </div>
        <ButtonLink href="/admin/invoices/new" className="!min-h-[44px] !py-2">
          + New invoice
        </ButtonLink>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-600">Invoiced</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900">
            {formatAud(invoiced)}
          </p>
        </Card>
        <Card className="p-5 border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-800">Collected</p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-700">
            {formatAud(collected)}
          </p>
        </Card>
        <Card
          className={`p-5 ${outstanding > 0 ? "border-amber-200 bg-amber-50" : ""}`}
        >
          <p
            className={`text-sm ${outstanding > 0 ? "text-amber-800" : "text-slate-600"}`}
          >
            Outstanding
          </p>
          <p
            className={`mt-1 font-display text-2xl font-bold ${
              outstanding > 0 ? "text-amber-700" : "text-slate-900"
            }`}
            data-testid="total-outstanding"
          >
            {formatAud(outstanding)}
          </p>
        </Card>
      </div>

      <div className="mt-6 space-y-4">
        {invoices.length === 0 && (
          <Card className="p-6 text-slate-600">
            No invoices yet. Raise one from a job, or start a blank invoice.
          </Card>
        )}

        {invoices.map((inv) => {
          const display = invoiceDisplayStatus(inv);
          return (
            <Card key={inv.id} className="p-5" data-testid={`invoice-${inv.invoiceNumber}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="font-mono text-sm font-semibold text-brand hover:underline"
                  >
                    {inv.invoiceNumber}
                  </Link>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {inv.customerName}
                  </p>
                  <p className="text-sm text-slate-500">
                    Issued {inv.issuedDate} · Due {inv.dueDate}
                  </p>
                </div>
                <Badge tone={display.tone}>{display.label}</Badge>
              </div>

              <div className="mt-4">
                <PaymentProgress invoice={inv} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
