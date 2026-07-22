import Link from "next/link";
import { VanArt } from "@/components/VanArt";
import { ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import { listGallery } from "@/lib/db";

export default async function HomePage() {
  const gallery = await listGallery();

  return (
    <>
      {/* Hero */}
      {/* Two soft washes — blue from the left, orange from the right — so the
          hero carries both brand colours without a hard block of either.
          --highlight-soft, not --accent-soft: HeroUI owns the latter and
          defines it as a tint of its own accent, which is the blue. */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,var(--brand-soft),transparent_55%),radial-gradient(ellipse_at_top_right,var(--highlight-soft),transparent_50%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                Caravan Renovations · Brisbane QLD
              </p>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
                Giving old vans a{" "}
                <span className="text-brand">new lease on life</span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                Ready to give your caravan a fresh new look? From full 2 pac
                resprays and restorations to window repairs, reseals and
                insurance work — our Caboolture workshop does it all.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <ButtonLink href={site.phoneHref} variant="accent">
                  Call {site.phone} — FREE quote
                </ButtonLink>
                <ButtonLink href="/contact" variant="outline">
                  Contact Us Today!
                </ButtonLink>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Already booked in?{" "}
                <Link
                  href="/portal"
                  className="font-semibold text-brand underline underline-offset-2 hover:text-brand-dark"
                  data-testid="hero-portal-link"
                >
                  Track your van in the customer portal →
                </Link>
              </p>
              <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { k: "2 pac", v: "Lasting quality paint" },
                  { k: "Free", v: "No-obligation quotes" },
                  { k: "Insurance", v: "Repairs welcome" },
                ].map((s) => (
                  <div key={s.k}>
                    <dt className="font-display text-2xl font-bold text-brand">
                      {s.k}
                    </dt>
                    <dd className="text-xs text-slate-600">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="animate-fade-up">
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 shadow-[0_8px_16px_rgb(15_23_42_/_0.06),0_24px_56px_rgb(15_23_42_/_0.12)]">
                <VanArt
                  body="#ffffff"
                  stripe="#1a5fd0"
                  accent="#ea6f0e"
                  className="w-full h-auto"
                  label="Freshly resprayed caravan in deep blue and white with an orange pinstripe"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <Section id="services">
        <SectionHeading
          eyebrow="What we do"
          title="Services"
          intro="Everything your van needs under one roof — inside, outside and everywhere in between."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.slug} className="overflow-hidden flex flex-col">
              <VanArt
                body={s.art.body}
                stripe={s.art.stripe}
                accent={s.art.accent}
                className="w-full h-auto"
                label={s.heading}
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {s.heading}
                </h3>
                <p className="mt-1 text-sm font-semibold text-brand">
                  {s.strapline}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {s.body}
                </p>
                <Link
                  href={`/services#${s.slug}`}
                  className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand hover:underline"
                >
                  Learn more →
                </Link>
              </div>
            </Card>
          ))}
          <Card className="flex flex-col justify-center bg-brand-solid p-6 text-white">
            <h3 className="font-display text-xl font-bold">
              Not sure what you need?
            </h3>
            <p className="mt-2 text-sm text-white/80">
              Call us today on {site.phone} for a FREE quote — we&apos;ll talk
              you through the options.
            </p>
            <ButtonLink
              href="/contact"
              variant="accent"
              className="mt-5 w-full"
            >
              Get in touch today!
            </ButtonLink>
          </Card>
        </div>
      </Section>

      {/* Our work preview */}
      <Section className="bg-slate-50">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Our work"
            title="Previous customer caravans"
            intro="Real vans, real transformations. Slide through the before and after on any job."
          />
          <ButtonLink href="/gallery" variant="outline">
            View full gallery
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {gallery.slice(0, 4).map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <div className="grid grid-cols-2">
                <div className="relative">
                  <VanArt {...g.before} className="w-full h-auto" label={`${g.title} before`} />
                  <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-bold uppercase text-white">
                    Before
                  </span>
                </div>
                <div className="relative">
                  <VanArt {...g.after} className="w-full h-auto" label={`${g.title} after`} />
                  <span className="absolute left-2 top-2 rounded-full bg-brand-solid px-2 py-1 text-[10px] font-bold uppercase text-white">
                    After
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {g.title}
                </h3>
                <p className="text-xs text-slate-500">{g.vanMakeModel}</p>
                <p className="mt-2 text-sm text-slate-600">{g.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="From tired to transformed"
          center
        />
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Free quote", d: "Call or send photos and we'll price the job with no obligation." },
            { n: "02", t: "Book it in", d: "We lock in a workshop date and give you a job code to track progress." },
            { n: "03", t: "Live updates", d: "Log into the customer portal any time to see photos and progress notes." },
            { n: "04", t: "Hit the road", d: "Final inspection, then pick up a van that looks better than new." },
          ].map((step) => (
            <li key={step.n}>
              <span className="font-display text-4xl font-bold text-brand/25">
                {step.n}
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                {step.t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.d}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Instagram / social */}
      <Section className="bg-slate-50">
        <SectionHeading
          eyebrow="Social"
          title="Follow us on Instagram"
          intro={`See the latest transformations as they happen at ${site.instagramHandle}.`}
          center
        />
        <div className="mt-10 flex justify-center gap-3 flex-wrap">
          <ButtonLink href={site.instagram} variant="primary">
            Instagram
          </ButtonLink>
          <ButtonLink href={site.facebook} variant="outline">
            Facebook
          </ButtonLink>
        </div>
      </Section>

      {/* Contact CTA */}
      <Section className="bg-brand-solid text-white">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              CONTACT US
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Questions, requests, or in need of a quote? Feel free to reach
              out, we&apos;d love to hear from you.
            </p>
            <div className="mt-6 space-y-2 text-white/80">
              <p>
                <a href={site.phoneHref} className="font-semibold hover:underline">
                  {site.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${site.email}`} className="hover:underline">
                  {site.email}
                </a>
              </p>
              <p>{site.address}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 lg:justify-end">
            <ButtonLink href="/contact" variant="accent">
              Contact Us Today!
            </ButtonLink>
            <ButtonLink
              href="/portal"
              variant="outline"
              className="!border-white !text-white hover:!bg-white hover:!text-brand"
              data-testid="cta-portal-link"
            >
              Track my van
            </ButtonLink>
            <ButtonLink
              href="/store"
              variant="outline"
              className="!border-white !text-white hover:!bg-white hover:!text-brand"
            >
              Visit the store
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
