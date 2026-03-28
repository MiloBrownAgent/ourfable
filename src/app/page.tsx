import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Our Fable — Letters to Your Child, Sealed Until They're Ready",
  description:
    "Record a letter, voice memo, or video for your child — delivered when they turn 13, 18, or 21. Our Fable asks the people who love them every month. Starting at $99/year — founding rate $79/year, limited to 1,000 families.",
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
};

export default function HomePage() {
  return <HomeClient />;
}
