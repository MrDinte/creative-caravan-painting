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

export const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Our Work" },
  { href: "/store", label: "Store" },
  { href: "/contact", label: "Contact Us" },
] as const;
