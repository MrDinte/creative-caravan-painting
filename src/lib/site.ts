// Central business info, reused across the site so contact details stay consistent.
export const site = {
  name: "Creative Caravan Painting",
  tagline: "Caravan Renovations · Brisbane QLD",
  phone: "0417 005 298",
  phoneHref: "tel:+61417005298",
  email: "teamccpr@gmail.com",
  address: "Shop 7B, 43/47 Morayfield Road, Caboolture South, QLD 4510",
  abn: "91 598 012 904",
  instagram: "https://www.instagram.com/creative.caravan.painting/",
  facebook: "https://www.facebook.com/creativecaravanpainting",
  instagramHandle: "@creative.caravan.painting",
} as const;

/**
 * Bank details shown on invoices for direct transfer. Set these in the
 * environment rather than committing real account numbers — the placeholders
 * make it obvious when they haven't been configured.
 */
export const bankDetails = {
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "Creative Caravan Painting",
  bsb: process.env.NEXT_PUBLIC_BANK_BSB ?? "",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "",
} as const;

export function hasBankDetails(): boolean {
  return Boolean(bankDetails.bsb && bankDetails.accountNumber);
}

export const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Our Work" },
  { href: "/store", label: "Store" },
  { href: "/contact", label: "Contact Us" },
] as const;
