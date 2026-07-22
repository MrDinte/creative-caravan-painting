import Link from "next/link";
import {
  Button as HeroButton,
  Card as HeroCard,
  Chip as HeroChip,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles";

/*
  Design primitives, rebuilt on HeroUI v3.

  The public shape of this module is deliberately unchanged from the original
  hand-rolled version — same names, same props — because 60-odd files and the
  Playwright suite are written against it. Swapping the implementation
  underneath keeps that blast radius at zero.

  HeroUI's Button is a React Aria button, so `disabled` has to be forwarded as
  `isDisabled`; passing the raw DOM attribute would grey it out visually while
  leaving React Aria's press handling live.
*/

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

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger";

/** This app's variant vocabulary mapped onto HeroUI's. */
const HERO_VARIANT = {
  primary: "primary",
  accent: "primary", // recoloured to orange by the class below
  outline: "outline",
  ghost: "ghost",
  danger: "danger",
} as const;

/** Orange is not one of HeroUI's semantic colours, so the accent variant
 *  overrides the accent tokens locally rather than adding a whole theme colour
 *  that only one button uses. */
const VARIANT_EXTRA: Record<ButtonVariant, string> = {
  primary: "",
  accent:
    "[--accent:var(--highlight-solid)] [--accent-hover:var(--highlight)] text-white",
  outline: "",
  ghost: "",
  danger: "",
};

/** 48px keeps every control above the 44px touch-target floor the mobile
 *  Playwright project asserts. */
const SIZING = "min-h-[48px] px-6 text-base font-semibold rounded-full";

/*
  Props are derived from HeroUI's own button rather than from
  React.ButtonHTMLAttributes. React Aria types its events against the generic
  `FocusableElement`, not `HTMLButtonElement`, so the two sets are structurally
  incompatible for every handler — onClick, onFocus, onBlur and the rest.
  Inheriting from the component being wrapped avoids papering over that with
  casts. `disabled` is kept as the outward name (call sites already use it) and
  translated to React Aria's `isDisabled` below.
*/
type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "color"
> & {
  variant?: ButtonVariant;
  /**
   * Kept as `onClick` because every call site already says that. On the React
   * Aria path it is forwarded to `onPress`, which is the event that library
   * actually fires — a plain `onClick` was intermittently dropped on mobile
   * Safari, which the suite caught as a job-edit form that sometimes refused
   * to open.
   *
   * Takes no argument: no handler here uses the event, and PressEvent is not a
   * MouseEvent, so promising one would be a lie.
   */
  onClick?: () => void;
};

/*
  Submit and reset buttons render as native <button>; everything else uses
  HeroUI's.

  React Aria synthesises presses from pointer events rather than relying on the
  browser's click, and on mobile Safari that intermittently failed to trigger
  the form submission underneath — measured at roughly 1 run in 25 against the
  task-advance form. A dropped click on a menu toggle is a visual annoyance; a
  dropped submit silently loses the user's work.

  This is the same line already drawn for inputs: presentation comes from
  HeroUI, form mechanics stay native, because these forms post to Server
  Actions. buttonVariants() supplies the identical classes, and HeroUI's CSS
  styles hover and active through real pseudo-classes as well as its own data
  attributes, so the two paths look and behave the same.
*/
export function Button({
  children,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
  onClick,
  ...props
}: ButtonProps) {
  const cls = `${buttonVariants({ variant: HERO_VARIANT[variant] })} ${SIZING} ${
    VARIANT_EXTRA[variant]
  } ${className}`;

  if (type === "submit" || type === "reset") {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cls}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <HeroButton
      type="button"
      variant={HERO_VARIANT[variant]}
      isDisabled={disabled}
      onPress={onClick}
      className={`${SIZING} ${VARIANT_EXTRA[variant]} ${className}`}
      {...(props as React.ComponentProps<typeof HeroButton>)}
    >
      {children}
    </HeroButton>
  );
}

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
  // An anchor rather than a HeroUI Button, so Next.js keeps prefetching and
  // middle-click/"open in new tab" behave as links should. buttonVariants gives
  // it the identical HeroUI styling.
  const cls = `${buttonVariants({ variant: HERO_VARIANT[variant] })} ${SIZING} ${
    VARIANT_EXTRA[variant]
  } ${className}`;

  if (
    external ||
    href.startsWith("http") ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:")
  ) {
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

/* -------------------------------------------------------------------------- */
/* Containers                                                                 */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // HeroUI's Card supplies its own padding and gap; call sites pass their own
  // `p-*`, so those are stripped back here and the caller stays in control.
  return (
    <HeroCard className={`gap-0 p-0 ${className}`} {...props}>
      {children}
    </HeroCard>
  );
}

const CHIP_COLOR = {
  brand: "accent",
  amber: "warning",
  slate: "default",
  green: "success",
  red: "danger",
} as const;

export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: keyof typeof CHIP_COLOR;
}) {
  return (
    <HeroChip color={CHIP_COLOR[tone]} variant="soft" size="sm">
      {children}
    </HeroChip>
  );
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

/*
  Fields stay native <input>/<select>/<textarea> rather than becoming HeroUI
  TextFields. Every form here posts to a Server Action and reads FormData by
  `name`, and two of them had to be made uncontrolled to fix a mobile-Safari
  submission bug. Native elements keep both of those properties; only the
  styling comes from HeroUI's field tokens.
*/

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
  "w-full min-h-[48px] rounded-xl border px-4 py-3 text-base outline-none " +
  "border-[var(--field-border)] bg-[var(--field-background)] text-[var(--field-foreground)] " +
  "placeholder:text-[var(--field-placeholder)] shadow-[var(--field-shadow)] " +
  "transition-colors hover:border-[var(--line-strong)] " +
  "focus:border-brand focus:ring-4 focus:ring-brand/15";
