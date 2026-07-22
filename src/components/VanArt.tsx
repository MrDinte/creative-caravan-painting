// Inline SVG caravan illustration — no external images needed, scales crisply on mobile.
// Colours are data-driven so the gallery can show distinct before/after paint schemes.

// Defaults are the house colours — blue stripe, orange pinstripe. Gallery and
// store entries pass their own, because those are real paint schemes on real
// customers' vans and must not follow the site theme.
export function VanArt({
  body = "#ffffff",
  stripe = "#1a5fd0",
  accent = "#ea6f0e",
  className = "",
  label,
}: {
  body?: string;
  stripe?: string;
  accent?: string;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label={label ?? "Caravan illustration"}
    >
      <defs>
        {/* The scene behind the van *does* follow the theme, so the artwork
            doesn't glare as a white block on a dark page. */}
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--art-sky-top)" />
          <stop offset="100%" stopColor="var(--art-sky-bottom)" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#sky)" />
      {/* ground */}
      <rect y="160" width="320" height="40" fill="var(--art-ground)" />
      {/* tow hitch */}
      <rect x="20" y="120" width="46" height="8" rx="4" fill="#475569" />
      {/* body */}
      <rect x="52" y="60" width="224" height="76" rx="18" fill={body} stroke="#0f172a" strokeWidth="3" />
      {/* roof line */}
      <rect x="60" y="52" width="208" height="16" rx="8" fill={body} stroke="#0f172a" strokeWidth="3" />
      {/* feature stripe */}
      <path d="M52 104 h224 v14 a18 18 0 0 1 -18 18 H70 a18 18 0 0 1 -18 -18 Z" fill={stripe} />
      <rect x="52" y="96" width="224" height="10" fill={accent} />
      {/* window */}
      <rect x="76" y="74" width="60" height="26" rx="5" fill="#bae6fd" stroke="#0f172a" strokeWidth="2.5" />
      {/* door */}
      <rect x="190" y="72" width="52" height="60" rx="5" fill={body} stroke="#0f172a" strokeWidth="2.5" />
      <circle cx="234" cy="104" r="3" fill="#0f172a" />
      {/* wheels */}
      <circle cx="110" cy="150" r="16" fill="#1e293b" />
      <circle cx="110" cy="150" r="6" fill="#94a3b8" />
      <circle cx="220" cy="150" r="16" fill="#1e293b" />
      <circle cx="220" cy="150" r="6" fill="#94a3b8" />
    </svg>
  );
}
