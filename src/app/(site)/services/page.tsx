import type { Metadata } from "next";
import { VanArt } from "@/components/VanArt";
import { ButtonLink, Card, Section } from "@/components/ui";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Exterior caravan restorations, interior and exterior renovations, window repairs and polishing, insurance repairs and servicing, and perspex cut to size.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-soft to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900">
            OUR SERVICES
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Whatever your van needs, our Caboolture workshop can handle it.
            Call us today on{" "}
            <a href={site.phoneHref} className="font-semibold text-brand hover:underline">
              {site.phone}
            </a>{" "}
            for a FREE quote.
          </p>
        </div>
      </section>

      {services.map((s, i) => (
        <Section
          key={s.slug}
          id={s.slug}
          className={i % 2 === 1 ? "bg-slate-50" : ""}
        >
          <div
            className={`grid gap-10 lg:grid-cols-2 lg:items-center ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
              <VanArt
                body={s.art.body}
                stripe={s.art.stripe}
                accent={s.art.accent}
                className="w-full h-auto"
                label={s.heading}
              />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                {s.heading}
              </h2>
              <p className="mt-2 text-lg font-semibold text-brand">
                {s.strapline}
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">{s.body}</p>
              <ul className="mt-6 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3 text-slate-700">
                    <span aria-hidden className="mt-1 text-brand">
                      ✔
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/contact" className="mt-8">
                {s.cta}
              </ButtonLink>
            </div>
          </div>
        </Section>
      ))}

      <Section className="bg-brand-solid text-white">
        <Card className="border-none bg-white/10 p-8 text-center backdrop-blur">
          <h2 className="font-display text-3xl font-bold">
            Ready to give your caravan a fresh new look?
          </h2>
          <p className="mt-3 text-white/80">
            Call us today on {site.phone} for a FREE quote.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <ButtonLink href={site.phoneHref} variant="accent">
              Call {site.phone}
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="outline"
              className="!border-white !text-white hover:!bg-white hover:!text-brand"
            >
              Send us a message
            </ButtonLink>
          </div>
        </Card>
      </Section>
    </>
  );
}
