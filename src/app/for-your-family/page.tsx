import type { Metadata } from "next";
import WarmConversionClient from "./WarmConversionClient";

export const metadata: Metadata = {
  title: "For Your Family",
  description: "If receiving prompts and updates for someone you love made you wish you had this for your own child, you can start one too.",
  alternates: { canonical: "https://ourfable.ai/for-your-family" },
  robots: { index: true, follow: true },
};

export default function WarmConversionPage() {
  return <WarmConversionClient />;
}
