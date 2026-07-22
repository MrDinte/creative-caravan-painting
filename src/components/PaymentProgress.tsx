import {
  formatAud,
  invoiceBalanceCents,
  invoicePaidCents,
  invoicePaidPercent,
  invoiceTotalCents,
  type Invoice,
} from "@/lib/types";

/**
 * Payment progress as a single filled bar. Colour carries meaning — green when
 * settled, amber part paid, teal awaiting — but every state is also labelled,
 * so it doesn't rely on colour alone.
 */
export function PaymentProgress({
  invoice,
  size = "normal",
}: {
  invoice: Pick<Invoice, "lines" | "payments">;
  size?: "normal" | "large";
}) {
  const total = invoiceTotalCents(invoice);
  const paid = invoicePaidCents(invoice);
  const balance = invoiceBalanceCents(invoice);
  const percent = invoicePaidPercent(invoice);

  const settled = balance === 0 && total > 0;
  const barColour = settled
    ? "bg-emerald-500"
    : percent > 0
      ? "bg-amber-500"
      : "bg-slate-300";

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span
          className={`font-display font-bold text-slate-900 ${
            size === "large" ? "text-2xl" : "text-lg"
          }`}
        >
          {formatAud(paid)}{" "}
          <span className="font-sans text-sm font-normal text-slate-500">
            of {formatAud(total)} paid
          </span>
        </span>
        <span
          className={`text-sm font-semibold ${
            settled ? "text-emerald-700" : "text-slate-700"
          }`}
        >
          {settled ? "Paid in full" : `${formatAud(balance)} outstanding`}
        </span>
      </div>

      <div
        className={`mt-2 w-full overflow-hidden rounded-full bg-slate-200 ${
          size === "large" ? "h-4" : "h-3"
        }`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Payment progress: ${percent}% paid`}
      >
        <div
          className={`h-full rounded-full transition-all ${barColour}`}
          style={{ width: `${percent}%` }}
          data-testid="payment-progress-bar"
        />
      </div>

      <p className="mt-1 text-xs text-slate-500" data-testid="payment-percent">
        {percent}% paid
      </p>
    </div>
  );
}
