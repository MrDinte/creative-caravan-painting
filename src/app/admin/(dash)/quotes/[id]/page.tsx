import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { setQuoteStatusAction } from "@/app/actions";
import { ConvertQuoteForm } from "@/components/ConvertQuoteForm";
import { getQuote, listPriceBook, listStaff } from "@/lib/db";
import {
  QUOTE_STATUS_LABELS,
  formatAud,
  gstCents,
  quoteSubtotalCents,
  type QuoteStatus,
} from "@/lib/types";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quote detail",
  robots: { index: false, follow: false },
};

const TONE: Record<QuoteStatus, "slate" | "brand" | "green" | "red"> = {
  draft: "slate",
  sent: "brand",
  accepted: "green",
  declined: "red",
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const [priceBook, staff] = await Promise.all([
    listPriceBook(),
    listStaff(true),
  ]);
  const bookById = new Map(priceBook.map((p) => [p.id, p]));

  const subtotal = quoteSubtotalCents(quote);
  const gst = gstCents(subtotal);
  const total = subtotal + gst;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/quotes" className="hover:text-brand">
          Quotes
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">{quote.quoteNumber}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-brand">
            {quote.quoteNumber}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900">
            {quote.customerName}
          </h1>
          <p className="mt-1 text-slate-600">
            {quote.vanMakeModel || "Van not specified"} · Valid until{" "}
            {quote.validUntil}
          </p>
        </div>
        <Badge tone={TONE[quote.status]}>
          {QUOTE_STATUS_LABELS[quote.status]}
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900">
                {site.name}
              </h2>
              <span className="text-sm text-slate-500">ABN {site.abn}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {site.address} · {site.phone}
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2">Description</th>
                    <th className="w-20 pb-2 text-right">Qty</th>
                    <th className="w-32 pb-2 text-right">Unit</th>
                    <th className="w-32 pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quote.lines.map((l) => {
                    const book = l.priceBookItemId
                      ? bookById.get(l.priceBookItemId)
                      : null;
                    const overridden =
                      book && book.priceCents !== l.unitPriceCents;
                    return (
                      <tr key={l.id}>
                        <td className="py-3 pr-3">
                          <span className="font-medium text-slate-900">
                            {l.description}
                          </span>
                          {book && (
                            <span className="block font-mono text-xs text-slate-500">
                              {book.code}
                            </span>
                          )}
                          {overridden && (
                            <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              Custom price (book rate{" "}
                              {formatAud(book.priceCents)})
                            </span>
                          )}
                          {!l.priceBookItemId && (
                            <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              Custom line
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right text-slate-600">
                          {l.qty}
                        </td>
                        <td className="py-3 text-right text-slate-600">
                          {formatAud(l.unitPriceCents)}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900">
                          {formatAud(l.qty * l.unitPriceCents)}
                        </td>
                      </tr>
                    );
                  })}
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
            </dl>

            {quote.notes && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Notes &amp; terms
                </h3>
                <p className="mt-1 text-sm text-slate-600">{quote.notes}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Quote status
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Records where the quote is up to. Marking it “Sent” does not
              email the customer — send it yourself for now.
            </p>
            <div className="mt-3 space-y-2">
              {(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map((s) => (
                <form key={s} action={setQuoteStatusAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="status" value={s} />
                  <Button
                    type="submit"
                    variant={quote.status === s ? "primary" : "outline"}
                    className="w-full !min-h-[42px] !py-2 !text-sm"
                    data-testid={`set-quote-status-${s}`}
                  >
                    {QUOTE_STATUS_LABELS[s]}
                  </Button>
                </form>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Won the job?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Convert this quote into a scheduled job with its own job code and
              customer portal access.
            </p>
            <div className="mt-4">
              <ConvertQuoteForm quote={quote} staff={staff} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Customer
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-semibold text-slate-800">Email</dt>
                <dd className="break-all">
                  {quote.customerEmail ? (
                    <a
                      href={`mailto:${quote.customerEmail}`}
                      className="text-brand hover:underline"
                    >
                      {quote.customerEmail}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Phone</dt>
                <dd className="text-slate-600">{quote.customerPhone || "—"}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
