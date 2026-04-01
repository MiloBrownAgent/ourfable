import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Our Fable — Letters to Your Child, Sealed Until They're Ready",
  description:
    "Record a letter, voice memo, or video for your child — delivered when they turn 13, 18, or 21. Our Fable asks the people who love them every month. Plans start at $12/month or $99/year.",
  alternates: { canonical: "https://ourfable.ai" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://ourfable.ai",
    title: "Our Fable — Letters to Your Child, Sealed Until They're Ready",
    description:
      "Record a letter, voice memo, or video for your child — delivered when they turn 13, 18, or 21. Our Fable asks the people who love them every month.",
    images: [{ url: "https://ourfable.ai/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Fable — Letters to Your Child, Sealed Until They're Ready",
    description:
      "Record a letter, voice memo, or video for your child — delivered when they turn 13, 18, or 21. Our Fable asks the people who love them every month.",
    images: ["https://ourfable.ai/og-image.png"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
