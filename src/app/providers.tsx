"use client";

import { ThemeProvider } from "next-themes";

/**
 * Theme plumbing for HeroUI.
 *
 * HeroUI reads `.dark` (Tailwind's variant hook) and `data-theme` (its own
 * selector), so next-themes is told to write both. `defaultTheme="system"`
 * means a visitor whose phone is in dark mode gets dark on first paint rather
 * than a flash of white.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute={["class", "data-theme"]}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
