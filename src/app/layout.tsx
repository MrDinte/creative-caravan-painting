import type { Metadata } from "next";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Creative Caravan Painting | Caravan Renovations | Brisbane QLD",
    template: "%s | Creative Caravan Painting",
  },
  description:
    "Creative Caravan Painting gives old vans a new lease on life — exterior resprays, restorations, window repairs, reseals and insurance work in Caboolture, Brisbane QLD. Call 0417 005 298 for a FREE quote.",
  keywords: [
    "caravan painting",
    "caravan restoration",
    "caravan respray",
    "Brisbane",
    "Caboolture",
    "perspex cut to size",
    "caravan reseal",
  ],
  openGraph: {
    title: "Creative Caravan Painting | Caravan Renovations",
    description:
      "Giving old vans a new lease on life. Resprays, restorations, window repairs and reseals in Brisbane QLD.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${poppins.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
