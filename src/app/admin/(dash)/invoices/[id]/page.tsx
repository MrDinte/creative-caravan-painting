import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFullAccess } from "@/lib/guard";
import { Badge, Button, Card } from "@/components/ui";
import { PaymentProgress } from "@/components/PaymentProgress";
import { RecordPaymentForm } from "@/components/RecordPaymentForm";
import { setInvoiceStatusAction } from "@/app/actions";
import { getInvoice, getJob } from "@/lib/db";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatAud,
  gstCents,
  invoiceBalanceCents,
  invoiceDisplayStatus,
  invoiceSubtotalCents,
  invoiceTotalCents,
  type InvoiceStatus,
} from "@/lib/types";
import { bankDetails, hasBankDetails, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFullAccess();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const job = invoice.jobId ? await getJob(invoice.jobId) : null;
  const subtotal = invoiceSubtotalCents(invoice);
  const gst = gstCents(subtotal);
  const total = invoiceTotalCents(invoice);
  const balance = invoiceBalanceCents(invoice);
  const display = invoiceDisplayStatus(invoice);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/invoices" className="hover:text-brand">
          Invoices
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">{invoice.invoiceNumber}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-brand">
            {invoice.invoiceNumber}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900">
            {invoice.customerName}
          </h1>
          <p className="mt-1 text-slate-600">
            Issued {invoice.issuedDate} · Due {invoice.dueDate}
            {job && (
              <>
                {" · "}
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="font-mono text-brand hover:underline"
                >
                  {job.jobCode}
                </Link>
              </>
            )}
          </p>
        </div>
        <Badge tone={display.tone}>{display.label}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <PaymentProgress invoice={invoice} size="large" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900">
                {site.name}
              </h2>
              <span className="text-sm text-slate-500">ABN {site.abn}</span>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2">Description</th>
                    <th className="w-20 pb-2 text-right">Qty</th>
                    <th className="w-32 pb-2 text-right">Unit</th>
                    <th className="w-32 pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3 pr-3 font-medium text-slate-900">
                        {l.description}
                      </td>
                      <td className="py-3 text-right text-slate-600">{l.qty}</td>
                      <td className="py-3 text-right text-slate-600">
                        {formatAud(l.unitPriceCents)}
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        {formatAud(l.qty * l.unitPriceCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="font-semibold">{formatAud(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">GST (10%)</dt>
                <dd className="font-semibold">{formatAud(gst)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg">
                <dt className="font-bold">Total</dt>
                <dd className="font-display font-bold text-brand">
                  {formatAud(total)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Balance</dt>
                <dd
                  className={`font-semibold ${balance > 0 ? "text-amber-700" : "text-emerald-700"}`}
                  data-testid="invoice-balance"
                >
                  {formatAud(balance)}
                </dd>
              </div>
            </dl>

            {invoice.notes && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Notes</h3>
                <p className="mt-1 text-sm text-slate-600">{invoice.notes}</p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Payments received
            </h2>
            {invoice.payments.length === 0 ? (
              <p className="mt-3 text-slate-600">Nothing recorded yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200">
                {invoice.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatAud(p.amountCents)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {PAYMENT_METHOD_LABELS[p.method]}
                        {p.reference && ` · ${p.reference}`}
                        {p.recordedBy && ` · recorded by ${p.recordedBy}`}
                      </p>
                    </div>
                    <time className="text-xs text-slate-500">
                      {new Date(p.paidAt).toLocaleDateString("en-AU")}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Record a payment
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              For bank transfers, cash or in-person card. Stripe payments record
              themselves.
            </p>
            <div className="mt-4">
              <RecordPaymentForm invoiceId={invoice.id} balanceCents={balance} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Status
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              A customer only sees this invoice in their portal once it is
              marked Sent.
            </p>
            <div className="mt-3 space-y-2">
              {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map(
                (s) => (
                  <form key={s} action={setInvoiceStatusAction}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input type="hidden" name="status" value={s} />
                    <Button
                      type="submit"
                      variant={invoice.status === s ? "primary" : "outline"}
                      className="w-full !min-h-[42px] !py-2 !text-sm"
                      data-testid={`set-invoice-${s}`}
                    >
                      {INVOICE_STATUS_LABELS[s]}
                    </Button>
                  </form>
                )
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              How the customer pays
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <strong className="text-slate-800">Card:</strong>{" "}
                {process.env.STRIPE_SECRET_KEY
                  ? "Stripe checkout from the portal."
                  : "Not available — Stripe isn't configured."}
              </li>
              <li>
                <strong className="text-slate-800">Bank transfer:</strong>{" "}
                {hasBankDetails()
                  ? `BSB ${bankDetails.bsb}, Acct ${bankDetails.accountNumber}`
                  : "Not shown — bank details aren't configured."}
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
