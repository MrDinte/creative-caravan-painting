"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/lib/site";
import { useCart } from "./CartProvider";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-lg font-bold text-brand"
            aria-label={`${site.name} home`}
          >
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white font-bold"
            >
              CC
            </span>
            <span className="hidden sm:inline leading-tight">
              Creative Caravan
              <span className="block text-xs font-medium text-slate-500">
                Painting · Brisbane QLD
              </span>
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Primary"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-brand/10 text-brand"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/store/cart"
              className="relative ml-1 grid h-11 w-11 place-items-center rounded-full text-slate-700 hover:bg-slate-100"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              data-testid="cart-link"
            >
              <span aria-hidden className="text-lg">
                🛒
              </span>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <a
              href={site.phoneHref}
              className="ml-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:brightness-95"
            >
              Call {site.phone}
            </a>
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <Link
              href="/store/cart"
              className="relative grid h-11 w-11 place-items-center rounded-lg text-slate-700"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              data-testid="cart-link-mobile"
            >
              <span aria-hidden className="text-lg">
                🛒
              </span>
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-lg border border-slate-300"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-xl" aria-hidden>
              {open ? "✕" : "☰"}
            </span>
          </button>
          </div>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block rounded-lg px-4 py-3 text-base font-medium ${
                    isActive(item.href)
                      ? "bg-brand/10 text-brand"
                      : "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={site.phoneHref}
                className="mt-1 block rounded-lg bg-accent px-4 py-3 text-center text-base font-semibold text-slate-900"
              >
                Call {site.phone} — FREE quote
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
