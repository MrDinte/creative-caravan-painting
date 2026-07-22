import type { Metadata } from "next";
import Link from "next/link";
import { requireFullAccess } from "@/lib/guard";
import { InvoiceBuilder } from "@/components/InvoiceBuilder";
import { listJobs, nextInvoiceNumber } from "@/lib/db";

export const metadata: Metadata = {
  title: "New Invoice",
  robots: { index: false, follow: false },
};

export default async function NewInvoicePage() {
  await requireFullAccess();
  const [jobs, invoiceNumber] = await Promise.all([
    listJobs(),
    nextInvoiceNumber(),
  ]);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/admin/invoices" className="hover:text-brand">
          Invoices
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">New invoice</span>
      </nav>

      <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Raise an invoice
      </h1>
      <p className="mt-1 text-slate-600">
        This will be{" "}
        <code className="font-mono font-semibold text-brand">
          {invoiceNumber}
        </code>
        . It stays a draft until you mark it Sent — only then does the customer
        see it in their portal.
      </p>

      <div className="mt-6">
        <InvoiceBuilder jobs={jobs} />
      </div>
    </div>
  );
}
