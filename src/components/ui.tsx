import Link from "next/link";

// Shared building blocks. Buttons are min 44px tall for comfortable mobile tapping.

export function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-14 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-slate-900">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
          {intro}
        </p>
      )}
    </div>
  );
}

const buttonBase =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold " +
  "transition-all duration-150 active:scale-[0.98] " +
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100";

const variants = {
  primary:
    "bg-brand text-white shadow-[0_1px_2px_rgb(15_23_42_/_0.08),0_4px_12px_rgb(13_114_104_/_0.25)] " +
    "hover:bg-brand-dark hover:shadow-[0_2px_4px_rgb(15_23_42_/_0.08),0_8px_20px_rgb(13_114_104_/_0.3)]",
  accent:
    "bg-accent text-slate-900 shadow-[0_1px_2px_rgb(15_23_42_/_0.08),0_4px_12px_rgb(245_165_36_/_0.3)] " +
    "hover:brightness-[0.97] hover:shadow-[0_2px_4px_rgb(15_23_42_/_0.08),0_8px_20px_rgb(245_165_36_/_0.35)]",
  outline:
    "border-2 border-slate-200 bg-white text-slate-800 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)] " +
    "hover:border-brand hover:text-brand hover:bg-brand-soft",
  ghost: "text-brand hover:bg-brand-soft",
} as const;

export type ButtonVariant = keyof typeof variants;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = `${buttonBase} ${variants[variant]} ${className}`;
  if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={cls}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...props}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={`${buttonBase} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "rounded-[--radius-lg] border border-slate-200/80 bg-white " +
        "shadow-[0_1px_2px_rgb(15_23_42_/_0.04),0_6px_16px_rgb(15_23_42_/_0.06)] " +
        `${className}`
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "amber" | "slate" | "green" | "red";
}) {
  // Ring rather than a hard border: reads as a soft pill at small sizes.
  const tones = {
    brand: "bg-brand-soft text-brand ring-brand/15",
    amber: "bg-amber-50 text-amber-800 ring-amber-500/20",
    slate: "bg-slate-100 text-slate-700 ring-slate-500/15",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-500/20",
    red: "bg-rose-50 text-rose-800 ring-rose-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full min-h-[48px] rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-base text-slate-900 " +
  "shadow-[inset_0_1px_2px_rgb(15_23_42_/_0.04)] placeholder:text-slate-400 " +
  "transition-colors hover:border-slate-300 " +
  "focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none";
