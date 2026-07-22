import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VanArt } from "@/components/VanArt";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Badge, ButtonLink, Card, Section } from "@/components/ui";
import { getProductBySlug, listProducts } from "@/lib/db";
import { formatAud } from "@/lib/types";
import { site } from "@/lib/site";

export async function generateStaticParams() {
  const products = await listProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await listProducts())
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <Section>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <Link href="/store" className="hover:text-brand">
          Store
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-800">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
          <VanArt
            body={product.art.body}
            stripe={product.art.stripe}
            accent={product.art.accent}
            className="w-full h-auto"
            label={product.name}
          />
        </div>

        <div>
          <Badge tone="slate">{product.category}</Badge>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-slate-900">
            {product.name}
          </h1>
          <p className="mt-4 font-display text-3xl font-bold text-brand">
            {formatAud(product.priceCents)}
          </p>
          <p className="mt-5 leading-relaxed text-slate-600">
            {product.description}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <AddToCartButton product={product} className="flex-1" />
            <AddToCartButton
              product={product}
              variant="accent"
              goToCart
              className="flex-1"
            >
              Buy now
            </AddToCartButton>
          </div>

          <Card className="mt-8 p-5">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Need it customised?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Perspex cut to size, odd window shapes, bulk orders — give us a
              call on{" "}
              <a href={site.phoneHref} className="font-semibold text-brand hover:underline">
                {site.phone}
              </a>{" "}
              and we&apos;ll sort it out.
            </p>
            <ButtonLink href="/contact" variant="outline" className="mt-4">
              Ask a question
            </ButtonLink>
          </Card>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          You might also need
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {related.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <Link href={`/store/${p.slug}`} aria-label={`View ${p.name}`}>
                <VanArt
                  body={p.art.body}
                  stripe={p.art.stripe}
                  accent={p.art.accent}
                  className="w-full h-auto"
                  label={p.name}
                />
              </Link>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">
                  <Link href={`/store/${p.slug}`} className="hover:text-brand">
                    {p.name}
                  </Link>
                </h3>
                <p className="mt-1 font-bold text-brand">
                  {formatAud(p.priceCents)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}
