"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

/**
 * Light/dark switch.
 *
 * The resolved theme is only knowable on the client, but the server still has
 * to render *something* — and if that something differs from the first client
 * render, React throws the whole tree away and rebuilds it. That exact
 * mismatch previously broke form submissions on mobile Safari elsewhere in this
 * app, so the same guard is used here: useSyncExternalStore hands the server a
 * deliberately different snapshot, and only after hydration does the real value
 * apply. The button's size and position are identical either way, so nothing
 * moves when it resolves.
 */
const subscribeNever = () => () => {};
const getMountedTrue = () => true;
const getMountedFalse = () => false;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNever,
    getMountedTrue,
    getMountedFalse
  );

  const isDark = mounted && resolvedTheme === "dark";
  const label = !mounted
    ? "Switch theme"
    : isDark
      ? "Switch to light mode"
      : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`grid h-11 w-11 place-items-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 ${className}`}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
    >
      <span aria-hidden className="text-lg">
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
