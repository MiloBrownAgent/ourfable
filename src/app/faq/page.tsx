import type { Metadata } from "next";
import Link from "next/link";
import { FAQAccordion } from "./FAQAccordion";

export const metadata: Metadata = {
  title: "FAQ — How Our Fable Works",
  description:
    "Everything you need to know about Our Fable — how letters get delivered to your child, who can contribute, pricing, data privacy & security, and milestone ages.",
  alternates: { canonical: "https://ourfable.ai/faq" },
  robots: { index: true, follow: true },
};

export const FAQS = [
  {
    q: "What is Our Fable?",
    a: "Our Fable is a private platform where parents set up a memory vault for their child. Each month, Our Fable automatically sends personalized prompts to grandparents, family members, and friends — asking them to record a letter, voice memo, photo, or video message addressed to the child. Everything is stored inside a sealed vault and delivered when the child reaches a milestone age: 13, 18, 21, graduation, or wedding day.",
  },
  {
    q: "How does message delivery work?",
    a: "When setting up the vault, parents choose milestone ages for delivery (for example, age 13 or age 18). Each piece of content — a letter from grandma, a voice memo from a godparent, a photo from an old family friend — is locked inside the vault until that milestone date arrives. When your child reaches the milestone, they unlock the vault and experience all of it.",
  },
  {
    q: "Who can contribute to the vault?",
    a: "Anyone the parent invites: grandparents, aunts, uncles, godparents, family friends, neighbors, college friends — anyone worth preserving. Each person receives a personal invitation link. No account or app download is required. They simply receive a monthly prompt and respond with text, a photo, a voice recording, or a short video.",
  },
  {
    q: "What kinds of content can people submit?",
    a: "Circle members can submit written letters, voice memos, photos, and short video messages. Our Fable sends them a prompt tailored to their relationship with the child — grandma gets a different question than the old family friend from college. They respond however feels natural.",
  },
  {
    q: "What are the milestone ages for delivery?",
    a: "Parents can choose any milestone: age 13, 16, 18, 21, graduation day, or wedding day. Different pieces of content can be locked to different milestones. For example, a letter from grandma might open at 13, while a voice memo from a godparent opens at 18.",
  },
  {
    q: "What does Our Fable cost?",
    a: "Our Fable has two tiers. Our Fable is $12/month or $99/year — it includes the vault, up to 10 circle members, monthly prompts, and 5 GB of storage. Our Fable+ is $19/month or $149/year — it includes everything in Our Fable plus Dispatches, unlimited circle members, voice messages, one additional child included, and 25 GB of storage.",
  },
  {
    q: "Is my family's content private?",
    a: "Yes. Our Fable is private by design. The vault is accessible only to the parents who created it. No content is shared publicly, on social media, or with third parties. You can export everything — every letter, photo, voice memo, and video — at any time, no questions asked.",
  },
  {
    q: "Can I give Our Fable as a baby shower gift?",
    a: "Yes. Our Fable can be gifted as a gift code — perfect for baby showers, birth announcements, or as a meaningful gift from a grandparent. Visit ourfable.ai/gift to send a gift code by email. The recipient activates it when they're ready.",
  },
  {
    q: "What is the World Snapshot?",
    a: "Every month, Our Fable automatically creates a one-page 'snapshot' of the world during that month of your child's life — top news, the #1 song, weather, and other cultural markers. By the time your child turns 18, they'll have 216 of these snapshots. It's a living record of the world they grew up in.",
  },
  {
    q: "What is 'Day They Were Born'?",
    a: "Our Fable creates a permanent front page for your child's birthday — capturing everything happening in the world the day they arrived. Weather, headlines, the #1 song. A permanent record of the exact moment they entered the world.",
  },
  {
    q: "What are Dispatches?",
    a: "Dispatches let parents send photos, videos, notes, or voice memos to their whole circle — or just a few people — privately. No group chat. No social media. Parents can send an update like 'She said her first word today' and their whole circle (grandparents, godparents, family friends) receives it privately.",
  },
  {
    q: "What happens to the vault if I cancel?",
    a: "Your content is always yours. You can export everything — every letter, photo, voice memo, and video — at any time before or after cancelling. If you leave, you leave with everything. We'll never hold your family's memories hostage.",
  },
  {
    q: "Can I download all my data?",
    a: "Yes, at any time, all of it — every letter, voice memo, photo, and video. It's your family's data and you can take it with you whenever you want. But the magic of Our Fable is the sealed vault, the timed delivery, the ceremony of your child opening it at 18. The data is yours. The experience is ours to protect.",
  },
  {
    q: "What happens if Our Fable goes out of business?",
    a: "If Our Fable ever ceases operations, all customers will receive a minimum of 60 days notice and the ability to export all vault data before any systems are shut down. Your family's memories will never disappear without warning. We are building Our Fable to last 18 years and beyond — but if the worst happens, you will always have time to save everything.",
  },
  {
    q: "Does the person contributing need to create an account?",
    a: "No. Circle members receive a personal link. They click it, see their prompt, and respond. No account creation, no app download, no password. It's designed so that grandma who 'isn't good with technology' can still participate.",
  },
  {
    q: "How is my family's data protected?",
    a: "We take security seriously. All vault content is encrypted with your family\u2019s unique AES-256 key before it ever leaves your browser \u2014 we can\u2019t read it even if we wanted to. All data is also encrypted in transit and at rest. Parents can enable two-factor authentication for additional account security. Vault guardians can trigger delivery if something happens to you, but they can never see sealed content. We never sell your data or share it with advertisers. You own your content \u2014 you can export everything at any time and delete your account whenever you choose.",
  },
  {
    q: "How do I get started?",
    a: "Reserve your spot at ourfable.ai/reserve. Our Fable is currently in founding-family mode — founding members get first access and locked-in pricing for life. Setup takes about five minutes: you add your child's name and birthday, set up a family password, and start adding people to their circle.",
  },
];

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <style>{`
        @media (max-width: 680px) {
          .nav-text-links { display: none !important; }
          .faq-hero { padding: 80px 20px 40px !important; }
          .faq-content { padding: 0 20px 80px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        display: "flex", alignItems: "center", padding: "0 40px",
        background: "rgba(253,251,247,0.96)", borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(16px)",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em" }}>Our Fable</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="nav-text-links" style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Link href="/" className="nav-link" style={{ fontSize: 14 }}>Home</Link>
              <Link href="/faq" className="nav-link" style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>FAQ</Link>
              <Link href="/reserve" className="nav-link" style={{ fontSize: 14 }}>Give as a gift</Link>
              <Link href="/login" className="nav-link" style={{ fontSize: 14 }}>Sign in</Link>
            </div>
            <Link href="/reserve" className="btn-primary" style={{ padding: "9px 20px", fontSize: 14, textDecoration: "none" }}>
              Reserve your spot
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="faq-hero" style={{ padding: "120px 40px 48px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 16 }}>
          Frequently asked questions
        </p>
        <h1 style={{
          fontFamily: "var(--font-playfair)", fontWeight: 800,
          fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.15,
          letterSpacing: "-0.025em", marginBottom: 20,
        }}>
          Everything you want to know about Our Fable
        </h1>
        <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.75, maxWidth: 520, margin: "0 auto" }}>
          How letters get delivered, who can contribute, pricing, data security, and how to get started.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="faq-content" style={{ maxWidth: 800, margin: "0 auto", padding: "0 40px 100px" }}>
        <FAQAccordion faqs={FAQS} />

        {/* CTA */}
        <div style={{
          marginTop: 64, padding: "40px", background: "var(--bg-2)",
          border: "1.5px solid var(--border)", borderRadius: 20, textAlign: "center",
        }}>
          <p style={{
            fontFamily: "var(--font-playfair)", fontWeight: 700,
            fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", marginBottom: 12,
          }}>
            Still have questions?
          </p>
          <p style={{ fontSize: 15, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.7 }}>
            Reserve your spot and we&apos;ll reach out personally to founding families.
          </p>
          <Link href="/reserve" style={{
            display: "inline-block", padding: "14px 28px", borderRadius: 100,
            background: "var(--green)", color: "#fff", fontWeight: 700,
            fontSize: 15, textDecoration: "none",
          }}>
            Reserve your spot →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 40px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>Our Fable</span>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <Link href="/reserve" className="nav-link" style={{ fontSize: 13 }}>Give as a gift</Link>
            <Link href="/faq" className="nav-link" style={{ fontSize: 13 }}>FAQ</Link>
            <Link href="/journal" className="nav-link" style={{ fontSize: 13 }}>Journal</Link>
            <Link href="/partners" className="nav-link" style={{ fontSize: 13 }}>Partner with us</Link>
            <Link href="/support" className="nav-link" style={{ fontSize: 13 }}>Support</Link>
            <Link href="/privacy" className="nav-link" style={{ fontSize: 13 }}>Privacy</Link>
            <Link href="/terms" className="nav-link" style={{ fontSize: 13 }}>Terms</Link>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-4)" }}>© {new Date().getFullYear()} Our Fable, Inc.</p>
        </div>
      </footer>
    </div>
  );
}
