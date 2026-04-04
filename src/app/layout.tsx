import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MetaPixel } from "../components/MetaPixel";
import { GoogleAnalytics } from "../components/GoogleAnalytics";
import { CookieBanner } from "../components/CookieBanner";
import "./globals.css";

const playfair = localFont({
  src: "../../public/playfair-800.woff2",
  variable: "--font-playfair",
  weight: "800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ourfable.ai"),
  title: {
    default: "Our Fable — Letters & Memories for Your Child's Future",
    template: "%s | Our Fable",
  },
  description:
    "Record letters, voice memos, and photos for your child — sealed until they turn 13, 18, or 21. Our Fable automatically asks the people who love them every month.",
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Our Fable" },
  openGraph: {
    type: "website",
    url: "https://ourfable.ai",
    siteName: "Our Fable",
    title: "Our Fable — Letters & Memories Sealed Until Your Child Is Ready",
    description:
      "Record letters, voice memos, and photos for your child — sealed until they turn 13, 18, or 21. Our Fable automatically asks the people who love them every month.",
    images: [
      {
        url: "https://ourfable.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "Our Fable — A private vault of letters and memories for your child",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Fable — Letters & Memories Sealed Until Your Child Is Ready",
    description:
      "Record letters, voice memos, and photos for your child — sealed until they turn 13, 18, or 21.",
    images: ["https://ourfable.ai/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FDFBF7",
  viewportFit: "cover",
  colorScheme: "light",
};

// ── JSON-LD Structured Data ────────────────────────────────────────────────────
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Our Fable",
  url: "https://ourfable.ai",
  logo: "https://ourfable.ai/og-image.png",
  description:
    "Our Fable is a private platform where parents, grandparents, and loved ones record letters, voice memos, photos, and videos for a child — sealed until milestone ages like 13, 18, or 21.",
  foundingLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Minneapolis",
      addressRegion: "MN",
      addressCountry: "US",
    },
  },
  sameAs: [],
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Our Fable",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  url: "https://ourfable.ai",
  description:
    "A private vault for letters, voice memos, photos, and videos addressed to your child — automatically collected from family and friends, then delivered at milestone ages (13, 18, 21, graduation, wedding).",
  offers: [
    {
      "@type": "Offer",
      name: "Our Fable — Monthly",
      price: "12.00",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "Founding price. The Vault, unlimited circle members, monthly prompts, 5 GB storage",
    },
    {
      "@type": "Offer",
      name: "Our Fable — Annual",
      price: "99.00",
      priceCurrency: "USD",
      billingIncrement: "P1Y",
      description: "Founding price. The Vault, unlimited circle members, monthly prompts, 5 GB storage",
    },
    {
      "@type": "Offer",
      name: "Our Fable+ — Monthly",
      price: "19.00",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "Founding price. Everything in Our Fable, plus Dispatches, unlimited circle members, one additional child included, and 25 GB storage",
    },
    {
      "@type": "Offer",
      name: "Our Fable+ — Annual",
      price: "149.00",
      priceCurrency: "USD",
      billingIncrement: "P1Y",
      description: "Founding price. Everything in Our Fable, plus Dispatches, unlimited circle members, one additional child included, and 25 GB storage",
    },
  ],
  featureList: [
    "Private vault sealed until milestone ages (13, 18, 21)",
    "Monthly automated prompts sent to grandparents, family, friends",
    "Letters, voice memos, photos, and video messages",
    "Born Day Snapshot — the vault captures the world the day your child arrived",
    "Dispatches — private family updates included in Our Fable+",
    "Full data export at any time",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const bodyStyle = {
    "--font-inter": "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  } as CSSProperties;

  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />

        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={playfair.variable} style={bodyStyle}>
        <a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>
        <div id="main-content">
        {children}
        </div>
        {pixelId && <MetaPixel pixelId={pixelId} />}
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <CookieBanner />
      </body>
    </html>
  );
}
