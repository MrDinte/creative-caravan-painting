import type { Metadata } from "next";
import { Badge, Card } from "@/components/ui";
import { listContacts, listOrders } from "@/lib/db";
import { formatAud } from "@/lib/types";

export const metadata: Metadata = {
  title: "Enquiries",
  robots: { index: false, follow: false },
};

export default async function EnquiriesPage() {
  const [contacts, orders] = await Promise.all([listContacts(), listOrders()]);

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
        Enquiries &amp; Orders
      </h1>
      <p className="mt-1 text-slate-600">
        Everything submitted through the website.
      </p>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Contact form submissions
        </h2>
        {contacts.length === 0 ? (
          <p className="mt-3 text-slate-600">
            Nothing yet. Submissions from the contact page land here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {contacts.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <time className="text-xs text-slate-500">
                    {new Date(c.createdAt).toLocaleString("en-AU")}
                  </time>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  <a href={`mailto:${c.email}`} className="text-brand hover:underline">
                    {c.email}
                  </a>
                  {c.phone && ` · ${c.phone}`}
                </p>
                {c.service && (
                  <p className="mt-2">
                    <Badge tone="slate">{c.service}</Badge>
                  </p>
                )}
                <p className="mt-2 leading-relaxed text-slate-700">{c.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Store orders
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-slate-600">
            No orders yet. Checkout submissions land here until Stripe is
            connected.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {orders.map((o) => (
              <li key={o.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {o.customerName}
                  </p>
                  <span className="font-display text-lg font-bold text-brand">
                    {formatAud(o.totalCents)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  <a href={`mailto:${o.customerEmail}`} className="text-brand hover:underline">
                    {o.customerEmail}
                  </a>
                </p>
                <ul className="mt-2 text-sm text-slate-700">
                  {o.items.map((i) => (
                    <li key={i.productId}>
                      {i.qty} × {i.name} — {formatAud(i.qty * i.priceCents)}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  <Badge tone={o.status === "paid" ? "green" : "amber"}>
                    {o.status === "paid" ? "Paid" : "Awaiting payment"}
                  </Badge>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
