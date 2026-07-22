import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { ButtonLink, Card, Section } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions, requests, or in need of a quote? Call Creative Caravan Painting on 0417 005 298 or send us a message.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-soft to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900">
            CONTACT US
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Questions, requests, or in need of a quote? Feel free to reach out,
            we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Send us a message
            </h2>
            <p className="mt-2 text-slate-600">
              We usually reply within one business day.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Get in touch today!
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-800">Phone</dt>
                  <dd>
                    <a
                      href={site.phoneHref}
                      className="text-brand hover:underline"
                    >
                      {site.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${site.email}`}
                      className="text-brand hover:underline break-all"
                    >
                      {site.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">Workshop</dt>
                  <dd className="text-slate-600">{site.address}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">ABN</dt>
                  <dd className="text-slate-600">{site.abn}</dd>
                </div>
              </dl>
              <ButtonLink
                href={site.phoneHref}
                variant="accent"
                className="mt-6 w-full"
              >
                Call for a FREE quote
              </ButtonLink>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Follow along
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                See the latest transformations on {site.instagramHandle}.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <ButtonLink href={site.instagram} variant="outline">
                  Instagram
                </ButtonLink>
                <ButtonLink href={site.facebook} variant="outline">
                  Facebook
                </ButtonLink>
              </div>
            </Card>

            <Card className="bg-brand-solid p-6 text-white">
              <h2 className="font-display text-xl font-bold">
                Already booked in?
              </h2>
              <p className="mt-2 text-sm text-white/80">
                Track your van&apos;s progress live with your job code and
                access code.
              </p>
              <ButtonLink href="/portal" variant="accent" className="mt-4 w-full">
                Customer portal
              </ButtonLink>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
