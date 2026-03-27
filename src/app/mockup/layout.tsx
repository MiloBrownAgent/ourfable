import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Fable — Before they can read, someone should be writing.",
  description: "A private vault of letters, memories, and love — sealed until your child is ready. Our Fable interviews the people who love them, every month.",
  openGraph: {
    type: "website",
    url: "https://ourfable.ai/mockup",
    siteName: "Our Fable",
    title: "Our Fable — Before they can read, someone should be writing.",
    description: "A private vault of letters, memories, and love — sealed until your child is ready. Our Fable interviews the people who love them, every month.",
    images: [
      {
        url: "https://ourfable.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "Our Fable — A private vault for your child's memories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Fable — Before they can read, someone should be writing.",
    description: "A private vault of letters, memories, and love — sealed until your child is ready.",
    images: ["https://ourfable.ai/og-image.png"],
  },
};

export default function MockupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
