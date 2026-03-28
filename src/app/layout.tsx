import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { MetaPixel } from "../components/MetaPixel";
import { GoogleAnalytics } from "../components/GoogleAnalytics";
import { CookieBanner } from "../components/CookieBanner";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  alternates: {
    canonical: "https://ourfable.ai",
  },
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
      addressLocality: "New York",
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
      description: "Vault, up to 10 circle members, monthly prompts, 5 GB storage",
    },
    {
      "@type": "Offer",
      name: "Our Fable — Annual",
      price: "99.00",
      priceCurrency: "USD",
      billingIncrement: "P1Y",
      description: "Vault, up to 10 circle members, monthly prompts, 5 GB storage",
    },
    {
      "@type": "Offer",
      name: "Our Fable+ — Monthly",
      price: "19.00",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "Everything in Our Fable plus Dispatches, unlimited circle, voice messages, 25 GB storage",
    },
    {
      "@type": "Offer",
      name: "Our Fable+ — Annual",
      price: "149.00",
      priceCurrency: "USD",
      billingIncrement: "P1Y",
      description: "Everything in Our Fable plus Dispatches, unlimited circle, voice messages, 25 GB storage",
    },
  ],
  featureList: [
    "Private vault sealed until milestone ages (13, 18, 21)",
    "Monthly automated prompts sent to grandparents, family, friends",
    "Letters, voice memos, photos, and video messages",
    "World Snapshot — one page per month of your child's life",
    "Day They Were Born — a permanent record of birth day events",
    "Dispatches — send updates to your whole circle privately",
    "Full data export at any time",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Our Fable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our Fable is a private platform where parents set up a vault for their child. Each month, Our Fable sends personalized prompts to grandparents, family members, and loved ones — asking them to record a letter, voice memo, photo, or video. Everything is sealed inside the vault until the child reaches a milestone age (13, 18, 21, graduation, or wedding day).",
      },
    },
    {
      "@type": "Question",
      name: "How does message delivery work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Parents choose milestone ages when setting up the vault (for example, age 13 or age 18). Each piece of content — a letter from grandma, a voice memo from a godparent, a photo from a friend — is locked inside the vault until that milestone date arrives. When your child is ready, they unlock the vault and experience all of it at once.",
      },
    },
    {
      "@type": "Question",
      name: "Who can contribute to the vault?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Anyone the parent invites — grandparents, aunts, uncles, godparents, family friends, neighbors, old college friends. Each person receives a personal invitation link. No account or app is required. They simply receive a prompt and respond with text, a photo, a voice recording, or a short video.",
      },
    },
    {
      "@type": "Question",
      name: "What does Our Fable cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our Fable has two tiers. Our Fable is $99/year ($79/year founding member rate) — it includes the vault, up to 10 circle members, monthly prompts, and 5 GB of storage. Our Fable+ is $149/year ($99/year founding member rate) — it includes everything in Our Fable plus Dispatches, unlimited circle members, voice messages, one additional child included, and 25 GB of storage. Founding member pricing is locked for life — limited to the first 1,000 families.",
      },
    },
    {
      "@type": "Question",
      name: "Is my family's data private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Our Fable is private by design. The vault is accessible only to the parents who created it. No content is shared publicly or with third parties. You can export everything — every letter, photo, voice memo, and video — at any time.",
      },
    },
    {
      "@type": "Question",
      name: "What milestone ages can I choose?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Parents can choose any milestone: age 13, 16, 18, 21, graduation day, or wedding day. Different pieces of content can be locked to different milestones — for example, a letter from grandma might open at 13, while a voice memo from a godparent opens at 18.",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${playfair.variable} ${inter.variable}`}>
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
