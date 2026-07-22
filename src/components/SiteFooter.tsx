import Link from "next/link";
import { nav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            {site.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Giving old vans a new lease on life. Resprays, restorations, window
            repairs and reseals across Brisbane QLD.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Explore
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/portal" className="hover:text-white">
                Customer Portal
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Contact
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={site.phoneHref} className="hover:text-white">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </li>
            <li>{site.address}</li>
            <li className="text-slate-400">ABN {site.abn}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Follow
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                Instagram {site.instagramHandle}
              </a>
            </li>
            <li>
              <a
                href={site.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                Facebook
              </a>
            </li>
            <li>
              <Link href="/admin" className="text-slate-400 hover:text-white">
                Staff Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} Creative Caravan Painting. All rights reserved.</p>
          <p>Demo rebuild — Next.js, Tailwind CSS &amp; Neon.</p>
        </div>
      </div>
    </footer>
  );
}
