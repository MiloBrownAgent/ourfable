import type { Metadata } from "next";
import GiftClient from "./GiftClient";

export const metadata: Metadata = {
  title: "Give Our Fable as a Gift",
  description: "Give the gift of a lifetime — a private vault where the people who love a child record letters, voice memos, and photos sealed until they're ready.",
  alternates: { canonical: "https://ourfable.ai/gift" },
  robots: { index: true, follow: true },
};

export default function GiftPage() {
  return <GiftClient />;
}
