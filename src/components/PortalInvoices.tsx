import { Badge, Card } from "./ui";
import { PaymentProgress } from "./PaymentProgress";
import {
  PAYMENT_METHOD_LABELS,
  formatAud,
  gstCents,
  invoiceBalanceCents,
  invoiceDisplayStatus,
  invoiceSubtotalCents,
  isInvoiceOverdue,
  type Invoice,
} from "@/lib/types";
import { bankDetails, hasBankDetails, site } from "@/lib/site";

/**
 * What the customer sees about money. Drafts never reach here — the database
 * policy only exposes invoices once they've been sent.
 */
export function PortalInvoices({
  invoices,
  stripeEnabled,
}: {
  invoices: Invoice[];
  stripeEnabled: boolean;
}) {
  if (invoices.length === 0) return null;

  const totalOutstanding = invoices.reduce(
    (sum, i) => sum + invoiceBalanceCents(i),
    0
  );

  return (
    <section className="mt-8" data-testid="portal-invoices">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Invoices &amp; payments
        </h2>
        {totalOutstanding > 0 && (
          <p className="text-sm font-semibold text-amber-700">
            {formatAud(totalOutstanding)} outstanding
          </p>
        )}
      </div>

      <div className="mt-4 space-y-5">
        {invoices.map((inv) => {
          const display = invoiceDisplayStatus(inv);
          const balance = invoiceBalanceCents(inv);
          const subtotal = invoiceSubtotalCents(inv);
          const overdue = isInvoiceOverdue(inv);

          return (
            <Card
              key={inv.id}
              className={`p-5 sm:p-6 ${overdue ? "border-rose-300" : ""}`}
              data-testid={`portal-invoice-${inv.invoiceNumber}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-slate-500">
                    {inv.invoiceNumber}
                  </p>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {formatAud(subtotal + gstCents(subtotal))} inc. GST
                  </p>
                  <p className="text-sm text-slate-500">
                    Issued {inv.issuedDate} · Due {inv.dueDate}
                  </p>
                </div>
                <Badge tone={display.tone}>{display.label}</Badge>
              </div>

              <div className="mt-5">
                <PaymentProgress invoice={inv} size="large" />
              </div>

              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-semibold text-brand">
                  What am I being charged for?
                </summary>
                <table className="mt-3 w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-200">
                    {inv.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 pr-3 text-slate-700">
                          {l.description}
                          {l.qty !== 1 && (
                            <span className="text-slate-500"> × {l.qty}</span>
                          )}
                        </td>
                        <td className="py-2 text-right font-medium text-slate-900">
                          {formatAud(l.qty * l.unitPriceCents)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-3 text-slate-600">GST (10%)</td>
                      <td className="py-2 text-right text-slate-700">
                        {formatAud(gstCents(subtotal))}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {inv.payments.length > 0 && (
                  <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      Payments received
                    </p>
                    <ul className="mt-1 space-y-1 text-sm text-emerald-900">
                      {inv.payments.map((p) => (
                        <li key={p.id} className="flex justify-between gap-3">
                          <span>
                            {new Date(p.paidAt).toLocaleDateString("en-AU")} ·{" "}
                            {PAYMENT_METHOD_LABELS[p.method]}
                          </span>
                          <span className="font-semibold">
                            {formatAud(p.amountCents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </details>

              {balance > 0 && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    Pay {formatAud(balance)}
                  </p>

                  {stripeEnabled ? (
                    <form
                      action={`/api/invoices/${inv.id}/checkout`}
                      method="POST"
                      className="mt-3"
                    >
                      <button
                        type="submit"
                        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-highlight-solid px-6 font-semibold text-slate-900 hover:brightness-95"
                        data-testid={`pay-now-${inv.invoiceNumber}`}
                      >
                        Pay by card
                      </button>
                    </form>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      Card payments aren&apos;t switched on yet — please use
                      bank transfer below or call the workshop.
                    </p>
                  )}

                  {hasBankDetails() ? (
                    <dl className="mt-4 space-y-1 text-sm">
                      <p className="font-semibold text-slate-800">
                        Or pay by bank transfer
                      </p>
                      <div className="flex justify-between">
                        <dt className="text-slate-600">Account name</dt>
                        <dd className="font-medium">{bankDetails.accountName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-600">BSB</dt>
                        <dd className="font-mono font-medium">
                          {bankDetails.bsb}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-600">Account</dt>
                        <dd className="font-mono font-medium">
                          {bankDetails.accountNumber}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-600">Reference</dt>
                        <dd className="font-mono font-medium">
                          {inv.invoiceNumber}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">
                      To arrange payment, call the workshop on{" "}
                      <a
                        href={site.phoneHref}
                        className="font-semibold text-brand hover:underline"
                      >
                        {site.phone}
                      </a>
                      .
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
