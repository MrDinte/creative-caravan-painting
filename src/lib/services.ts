// Service content mirrored from the original site's Services page.
export interface Service {
  slug: string;
  heading: string;
  strapline: string;
  body: string;
  points: string[];
  cta: string;
  art: { body: string; stripe: string; accent: string };
}

export const services: Service[] = [
  {
    slug: "exterior-caravan-restorations",
    heading: "EXTERIOR CARAVAN RESTORATIONS",
    strapline: "Lasting Quality Paint",
    body: "We apply high-quality 2 pac paint for a durable, showroom finish that stands up to Australian sun and road grime. You pick the colours and the design — our team does the rest.",
    points: [
      "High-quality 2 pac paint systems",
      "Full colour and design customisation",
      "Panel prep, sand back and priming",
      "Cut, polish and finishing",
    ],
    cta: "Talk to Us About Your Van Today",
    // The lead service wears the house colours; the rest below deliberately
    // vary, to show the range of schemes a customer can pick from.
    art: { body: "#ffffff", stripe: "#1a5fd0", accent: "#ea6f0e" },
  },
  {
    slug: "interior-exterior-renovations",
    heading: "INTERIOR & EXTERIOR CARAVAN RENOVATIONS",
    strapline: "Restorations and Refurbishments",
    body: "Complete interior renovations and restorations, from layout changes right through to the finishing touches — plus all the exterior work needed to keep your van weather-tight.",
    points: [
      "Layout modifications, electrical and plumbing",
      "Bunk beds, kitchen remodels and gas lift beds",
      "Vinyl flooring, composting toilets, cushion reupholstering",
      "Roof reseals with Globalcote and checker-plate application",
      "Decal removal, reapplication and damage repairs",
    ],
    cta: "Talk to Us About Your Van Today",
    art: { body: "#fef3c7", stripe: "#d97706", accent: "#f59e0b" },
  },
  {
    slug: "window-repairs-restorations-polishing",
    heading: "WINDOW REPAIRS, RESTORATIONS & POLISHING",
    strapline: "Exceptional Window Repairs",
    body: "We supply, cut and install perspex or glass for most caravan windows — including curved variants that are hard to find anywhere else.",
    points: [
      "Perspex and glass supply, cut and install",
      "Curved window specialists",
      "Winder and lock repairs",
      "Frame cleaning and polishing",
      "Rubber, fly-screen and dust seal replacement",
      "Millard louvre window repairs",
    ],
    cta: "Talk to Us About Your Van Today",
    art: { body: "#e0f2fe", stripe: "#0369a1", accent: "#0ea5e9" },
  },
  {
    slug: "insurance-repairs-servicing",
    heading: "INSURANCE REPAIRS & CARAVAN SERVICING",
    strapline: "Attention to Detail",
    body: "We work directly with insurance companies to take the stress out of repairs, and we service the running gear that keeps you safe on the road.",
    points: [
      "Insurance company liaison and repairs",
      "Undercarriage, chassis and brakes",
      "Hatches, gas struts, windows and lighting",
      "Water tanks, pumps, batteries and solar",
      "Fridge servicing and repairs",
    ],
    cta: "Talk to Us About Your Van Today",
    art: { body: "#f1f5f9", stripe: "#334155", accent: "#64748b" },
  },
  {
    slug: "perspex-supplies-cut-to-size",
    heading: "PERSPEX SUPPLIES & CUT TO SIZE",
    strapline: "All Your Perspex Needs",
    body: "We supply and custom-cut perspex for caravans, boats, houses and just about anything else — including curved perspex for those tricky vintage windows.",
    points: [
      "Cut to size for any application",
      "Caravans, boats, houses and more",
      "Curved perspex available",
      "Quality sheets, sharp pricing",
    ],
    cta: "Talk to Us About Your Perspex Needs",
    art: { body: "#ede9fe", stripe: "#6d28d9", accent: "#a78bfa" },
  },
];
