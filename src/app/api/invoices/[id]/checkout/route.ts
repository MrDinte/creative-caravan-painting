import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/session";
import { getInvoice } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { invoiceBalanceCents } from "@/lib/types";

/**
 * Starts a card payment for an invoice.
 *
 * Deliberately server-side and session-scoped: the amount comes from the
 * invoice in the database, never from the request, so a customer cannot post a
 * smaller figure. The session must also own the job the invoice belongs to.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.redirect(new URL("/portal", request.url), 303);
  }

  const invoice = await getInvoice(id);
  // RLS already scopes this read, but check explicitly so a mistake there
  // cannot turn into someone paying against another customer's invoice.
  if (!invoice || invoice.jobId !== session.jobId) {
    return NextResponse.redirect(new URL("/portal/job", request.url), 303);
  }

  const balanceCents = invoiceBalanceCents(invoice);
  if (balanceCents <= 0) {
    return NextResponse.redirect(new URL("/portal/job", request.url), 303);
  }

  if (!isStripeConfigured()) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "card payment attempted without Stripe configured",
        route: "/api/invoices/[id]/checkout",
        invoice: invoice.invoiceNumber,
      })
    );
    return NextResponse.redirect(
      new URL("/portal/job?pay=unavailable", request.url),
      303
    );
  }

  // Wiring for when STRIPE_SECRET_KEY exists:
  //
  //   import Stripe from "stripe";
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  //   const checkout = await stripe.checkout.sessions.create({
  //     mode: "payment",
  //     line_items: [{
  //       price_data: {
  //         currency: "aud",
  //         product_data: { name: `Invoice ${invoice.invoiceNumber}` },
  //         unit_amount: balanceCents,
  //       },
  //       quantity: 1,
  //     }],
  //     metadata: { invoiceId: invoice.id },
  //     success_url: `${origin}/portal/job?paid=1`,
  //     cancel_url: `${origin}/portal/job`,
  //   });
  //   return NextResponse.redirect(checkout.url!, 303);
  //
  // The webhook at /api/stripe/webhook then calls recordPayment() with the
  // checkout session id, which is unique in the payments table — so a retried
  // webhook cannot credit the invoice twice.

  return NextResponse.redirect(
    new URL("/portal/job?pay=unavailable", request.url),
    303
  );
}
