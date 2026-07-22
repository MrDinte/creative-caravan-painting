import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/components/CustomerLoginForm";
import { Card, Section } from "@/components/ui";
import { getCustomerSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Customer Portal",
  description:
    "Track your caravan's progress live. Log in with your job code and access code.",
};

export default async function PortalLoginPage() {
  const session = await getCustomerSession();
  if (session) redirect("/portal/job");

  return (
    <Section>
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
          Customer Portal
        </h1>
        <p className="mt-3 text-slate-600">
          Track your van&apos;s progress live. Enter the job code and access
          code from your booking confirmation.
        </p>

        <div className="mt-8">
          <CustomerLoginForm />
        </div>

        {isDemoMode() && (
          <Card className="mt-6 border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-bold text-amber-900">
              Demo credentials
            </h2>
            <p className="mt-2 text-sm text-amber-900">
              Try job code{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold">
                CCP-2026-001
              </code>{" "}
              with access code{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold">
                VAN123
              </code>
              .
            </p>
          </Card>
        )}

        <p className="mt-6 text-sm text-slate-600">
          Lost your codes? Call us on{" "}
          <a href={site.phoneHref} className="font-semibold text-brand hover:underline">
            {site.phone}
          </a>{" "}
          and we&apos;ll sort you out.
        </p>
      </div>
    </Section>
  );
}
