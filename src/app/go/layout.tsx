import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist | Our Fable",
  description:
    "What if your child could open letters from everyone who loved them — years from now? Join the Our Fable waitlist. Free, no card required.",
  openGraph: {
    title: "What if your child could open letters from everyone who loved them?",
    description:
      "Grandparents, godparents, aunts, uncles — every month, Our Fable asks them a simple question. Their answers are sealed until your child is ready. Join the waitlist.",
    url: "https://ourfable.ai/go",
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
    title: "What if your child could open letters from everyone who loved them?",
    description:
      "Join the Our Fable waitlist — it's free. Letters, voice memos, and photos sealed until your child is ready.",
    images: ["https://ourfable.ai/og-image.png"],
  },
};

export default function GoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
