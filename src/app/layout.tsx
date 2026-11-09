import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

// Self-hosted so builds never fetch from Google Fonts (a failed fetch broke two
// Railway builds on 2026-11-09). Files are the Google Fonts latin subsets that
// next/font/google served before, licensed under the OFL (see ./fonts/*-OFL.txt).
// The metric-matched fallback faces live in globals.css with Google's values,
// so the swap before the font loads stays the same as before.

// Variable font with wght 200–900 and the opsz axis.
const sourceSerif4 = localFont({
  src: "./fonts/source-serif-4-latin-variable.woff2",
  weight: "200 900",
  style: "normal",
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["SourceSerif4 Fallback"],
});

// One variable file serves the three weights, matching what Google served.
const ibmPlexSans = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-latin-variable.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-variable.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-variable.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["IBM Plex Sans Fallback"],
});

const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-latin-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["IBM Plex Mono Fallback"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Imedica — Decision training for Canadian paramedics",
    template: "%s · Imedica",
  },
  description:
    "Physician-authored emergency scenarios that train the decisions paramedics make under pressure, with rule-based scoring, explained feedback and privacy built for Canadian health law.",
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Imedica",
    // Mirrors DEFAULT_OG_IMAGE in src/server/blog/seo.ts (server-only, so not imported here).
    images: [{ url: "/og/imedica-default.png", width: 1200, height: 630, alt: "Imedica: decision training for Canadian paramedics" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={`${sourceSerif4.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
