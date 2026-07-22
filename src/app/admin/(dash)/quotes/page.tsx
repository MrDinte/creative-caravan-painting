import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { listQuotes } from "@/lib/db";
import {
  QUOTE_STATUS_LABELS,
  formatAud,
  gstCents,
  quoteSubtotalCents,
  type QuoteStatus,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Quotes",
  robots: { index: false, follow: false },
};

const TONE: Record<QuoteStatus, "slate" | "brand" | "green" | "red"> = {
  draft: "slate",
  sent: "brand",
  accepted: "green",
  declined: "red",
};

export default async function QuotesPage() {
  const quotes = await listQuotes();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Quotes
          </h1>
          <p className="mt-1 text-slate-600">
            Build quotes from the master price book, adjust any line, then
            convert accepted quotes straight into a job.
          </p>
        </div>
        <ButtonLink href="/admin/quotes/new" className="!min-h-[44px] !py-2">
          + New quote
        </ButtonLink>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Quote</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Van</th>
                <th className="px-4 py-3">Valid until</th>
                <th className="px-4 py-3 text-right">Total (inc GST)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-slate-600">
                    No quotes yet — create your first one.
                  </td>
                </tr>
              )}
              {quotes.map((q) => {
                const sub = quoteSubtotalCents(q);
                return (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/quotes/${q.id}`}
                        className="font-mono font-semibold text-brand hover:underline"
                      >
                        {q.quoteNumber}
                      </Link>
                      <span className="block text-xs text-slate-500">
                        {q.lines.length} line{q.lines.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{q.customerName}</span>
                      <span className="block text-xs text-slate-500">
                        {q.customerEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {q.vanMakeModel || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{q.validUntil}</td>
                    <td className="px-4 py-3 text-right font-display font-bold text-brand">
                      {formatAud(sub + gstCents(sub))}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={TONE[q.status]}>
                        {QUOTE_STATUS_LABELS[q.status]}
                      </Badge>
                    </td>
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
