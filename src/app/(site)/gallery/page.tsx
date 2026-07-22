import type { Metadata } from "next";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Badge, ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { listGallery } from "@/lib/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "A gallery of previous customer caravans transformed by Creative Caravan Painting — full resprays, restorations and makeovers with before and after comparisons.",
};

export default async function GalleryPage() {
  const gallery = await listGallery();

  return (
    <>
      <section className="bg-gradient-to-b from-brand-soft to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900">
            Our Work
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            A look at previous customer caravans that have come through our
            workshop. Drag the slider on any van to reveal the before and after.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          {gallery.map((g) => (
            <Card key={g.id} className="p-5 sm:p-6">
              <BeforeAfter item={g} />
              <div className="mt-5">
                <Badge>{g.jobType}</Badge>
                <h2 className="mt-3 font-display text-xl font-bold text-slate-900">
                  {g.title}
                </h2>
                <p className="text-sm text-slate-500">{g.vanMakeModel}</p>
                <p className="mt-3 leading-relaxed text-slate-600">
                  {g.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionHeading
          title="Want your van to look like this?"
          intro={`Call us today on ${site.phone} for a FREE quote, or send through some photos and we'll price it up.`}
          center
        />
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <ButtonLink href="/contact" variant="primary">
            Get a free quote
          </ButtonLink>
          <ButtonLink href={site.instagram} variant="outline">
            See more on Instagram
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
