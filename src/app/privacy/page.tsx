import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Our Fable is private by design. Read how we protect your family's letters, photos, and memories — and how you can export or delete your data at any time.",
  alternates: { canonical: "https://ourfable.ai/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <style>{`@media (max-width: 680px) { .nav-text-links { display: none !important; } }`}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64, display: "flex", alignItems: "center", padding: "0 40px", background: "rgba(253,251,247,0.96)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em" }}>Our Fable</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="nav-text-links" style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Link href="/" className="nav-link" style={{ fontSize: 14 }}>Home</Link>
              <Link href="/how-it-works" className="nav-link" style={{ fontSize: 14 }}>How it works</Link>
            </div>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 40px 80px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 16 }}>Legal</p>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 48 }}>Effective Date: March 24, 2026 · Last Updated: March 24, 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

          <Section>
            <SectionNote>A note before we begin</SectionNote>
            <p>Our Fable exists to preserve something irreplaceable: the love, memories, and voices of the people who matter most to your child. We take protecting your family's information as seriously as you take protecting your family. This Privacy Policy explains what we collect, why we collect it, how we protect it, and what rights you have. We've written it to be readable — not deliberately confusing.</p>
            <p>If you have questions, email us at <a href="mailto:privacy@ourfable.ai" style={{ color: "var(--green)" }}>privacy@ourfable.ai</a>. We're real people and we respond.</p>
          </Section>

          <Section>
            <SectionTitle>1. Who We Are</SectionTitle>
            <p>Our Fable is operated by Our Fable, Inc. ("Our Fable," "we," "us," or "our"). We provide a private digital memory platform that allows parents to create sealed vaults of letters, photos, voice recordings, and videos for their children, to be opened at milestone ages chosen by the parent.</p>
          </Section>

          <Section>
            <SectionTitle>2. Who Uses Our Fable — and Who Doesn't</SectionTitle>
            <p>Our Fable is a service <strong>for adults</strong>. Specifically:</p>
            <ul>
              <li><strong>Parents and guardians</strong> create accounts, manage vaults, and control all settings.</li>
              <li><strong>Circle members</strong> (grandparents, aunts, uncles, godparents, friends) contribute content when invited by a parent.</li>
              <li><strong>Children</strong> are the subject of the vaults — the people being celebrated — but they <strong>do not use Our Fable</strong>. Children do not create accounts, log in, submit information, or interact with the platform in any way. Content is sealed until milestone ages set by parents, and is only revealed at those times through parent-controlled access.</li>
            </ul>
          </Section>

          <Section>
            <SectionTitle>3. Information We Collect</SectionTitle>
            <SectionSubtitle>3a. Information You Give Us Directly</SectionSubtitle>
            <p><strong>Parent / Account Holder Information:</strong> Email address, password (stored as a secure hash — we never see your actual password), billing information (processed by our payment processor; we store only the last four digits of your card), and account preferences.</p>
            <p><strong>Child Information:</strong> Child's first name (or nickname — whatever you choose to use) and date of birth (used to calculate milestone unlock dates).</p>
            <p><strong>Circle Member Information:</strong> Name and email address of people you invite to contribute, and their relationship to the child if you provide it.</p>
            <p><strong>Content:</strong> Text letters, memories, messages, photos, videos, voice recordings and audio memos, captions, and descriptions.</p>
            <SectionSubtitle>3b. Information We Collect Automatically</SectionSubtitle>
            <p>When you use Our Fable, we automatically collect log data (IP address, browser type, pages visited), device information, and usage data (features used, actions taken). We use this to keep Our Fable running and diagnose problems. We do not use it to build advertising profiles.</p>
          </Section>

          <Section>
            <SectionTitle>4. Why We Collect This Information</SectionTitle>
            <p>We collect and process your information to provide the Our Fable service, send transactional emails, maintain security, improve the product, and comply with legal obligations. We do not collect your information to advertise to you or sell to third parties.</p>
          </Section>

          <Section>
            <SectionTitle>5. How We Share Your Information</SectionTitle>
            <p><strong>We do not sell your data. We do not run advertising. We do not share your family's content with third parties for marketing purposes. Full stop.</strong></p>
            <p>We share information only with infrastructure vendors (cloud storage providers, payment processor, email delivery) who are contractually prohibited from using your data for their own purposes. We may disclose information if required by law, and if Our Fable is acquired, you will be notified in advance.</p>
            <p>Our current third-party service providers are:</p>
            <ul>
              <li><strong>Stripe, Inc.</strong> — processes payments. Receives parent email address, child&apos;s first name, and date of birth as subscription metadata for account creation. Stripe&apos;s privacy policy is available at <a href="https://stripe.com/privacy" target="_blank" rel="noopener" style={{ color: "var(--green)" }}>stripe.com/privacy</a>.</li>
              <li><strong>Resend, Inc.</strong> — sends transactional emails (account confirmations, monthly prompts, delivery notifications). Receives parent email address only. Resend&apos;s privacy policy is available at <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener" style={{ color: "var(--green)" }}>resend.com/legal/privacy-policy</a>.</li>
            </ul>
          </Section>

          <Section>
            <SectionTitle>6. Children's Privacy — COPPA Disclosure</SectionTitle>
            <p><strong>Our Fable is not directed to children.</strong> Our Fable is directed to parents, grandparents, adult family members, and adult friends. Children do not use Our Fable — they do not create accounts, log in, or submit content. The service is designed, marketed, and operated exclusively for adults.</p>
            <p>While children do not use Our Fable, parents do provide limited information <em>about</em> their children (name and date of birth). We collect this solely to operate the vault and calculate milestone dates. We do not share it with third parties, use it for advertising, or process it for any purpose beyond vault operation.</p>
            <p>We collect limited information about children (first name and date of birth) only from a parent or legal guardian who has confirmed their guardian status during account creation.</p>
            <p>If you believe a child under 13 has accessed Our Fable directly, please contact us at <a href="mailto:privacy@ourfable.ai" style={{ color: "var(--green)" }}>privacy@ourfable.ai</a> and we will investigate and delete any such account promptly.</p>
            <p>To submit a COPPA-related inquiry, contact <a href="mailto:privacy@ourfable.ai" style={{ color: "var(--green)" }}>privacy@ourfable.ai</a>.</p>
          </Section>

          <Section>
            <div id="cookies" /><SectionTitle>7. Cookies & Tracking Technologies</SectionTitle>
            <p>We use cookies and similar technologies for the following purposes:</p>
            <ul>
              <li><strong>Session cookies:</strong> Keep you logged in across browser sessions.</li>
              <li><strong>Preference cookies:</strong> Remember your settings and choices.</li>
              <li><strong>Analytics:</strong> Understand how the service is being used (aggregated, non-personal data).</li>
              <li><strong>Meta Pixel:</strong> We use the Meta (Facebook) Pixel on our marketing pages to measure the effectiveness of our advertising and understand how visitors interact with our site. The Meta Pixel may collect your IP address, browser information, and pages visited. This data is shared with Meta Platforms, Inc. and is subject to <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener" style={{ color: "var(--green)" }}>Meta's Privacy Policy</a>. It is used solely for measuring ad performance — not for targeting ads to your family's vault content.</li>
            </ul>
            <p>We do not use third-party advertising cookies beyond the Meta Pixel described above. You can opt out of Meta's data collection by visiting <a href="https://www.facebook.com/help/568137493302217" target="_blank" rel="noopener" style={{ color: "var(--green)" }}>Meta's ad preferences</a> or configuring your browser to block cookies. Some features of Our Fable may not work correctly if cookies are disabled.</p>
          </Section>

          <Section>
            <SectionTitle>8. Data Retention</SectionTitle>
            <p>We keep your data as long as your account is active. When you delete your account, your data enters a 30-day retention period. During this window, you may contact us at <a href="mailto:privacy@ourfable.ai" style={{ color: "var(--green)" }}>privacy@ourfable.ai</a> to restore your account. After 30 days, all data — including vault entries, letters, photos, voice recordings, and child information — is permanently and irreversibly deleted from our systems and cannot be recovered.</p>
            <p>Billing records may be retained for up to 7 years as required by applicable tax law — these contain only transaction metadata, not your content.</p>
            <p><strong>Service discontinuation:</strong> In the event Our Fable ceases operations, all customers will receive a minimum of 60 days notice and the ability to export all vault data before any systems are shut down. Your family&apos;s memories will never disappear without warning.</p>
          </Section>

          <Section>
            <SectionTitle>9. Security</SectionTitle>
            <p>All vault content is encrypted client-side with your family&apos;s unique AES-256-GCM key before being transmitted to our servers &mdash; we never have access to your plaintext vault content. All data in transit uses TLS 1.2 or higher. All data at rest is additionally encrypted using AES-256. Vault content is programmatically locked until milestone dates. We do not store full payment card numbers. If we experience a breach affecting your information, we will notify you as required by applicable law.</p>
          </Section>

          <Section>
            <SectionTitle>10. Your Rights</SectionTitle>
            <p>You may access, correct, export, or delete your data at any time by contacting <a href="mailto:privacy@ourfable.ai" style={{ color: "var(--green)" }}>privacy@ourfable.ai</a>.</p>
            <p><strong>California residents (CCPA):</strong> You have the right to know what we collect, request deletion, and opt out of any sale of personal information (we don't sell data). To exercise rights, email privacy@ourfable.ai.</p>
            <p><strong>EEA/UK residents (GDPR):</strong> You have additional rights including restriction of processing, objection to legitimate-interest processing, and the right to lodge a complaint with your local data protection authority. Our legal bases are: performance of contract (providing the service), legitimate interest (security, improvement), legal obligation, and consent (optional marketing).</p>
          </Section>

          <Section>
            <SectionTitle>11. Changes to This Policy</SectionTitle>
            <p>We will notify you by email at least 30 days before any material changes to this policy take effect. Continued use of Our Fable after that date constitutes acceptance of the updated policy.</p>
          </Section>

          <Section>
            <SectionTitle>12. Contact</SectionTitle>
            <p>Our Fable, Inc.<br /><a href="mailto:privacy@ourfable.ai" style={{ color: "var(--green)" }}>privacy@ourfable.ai</a></p>
          </Section>

        </div>
      </div>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 40px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>Our Fable</span>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <Link href="/gift" className="nav-link" style={{ fontSize: 13 }}>Give as a gift</Link>
            <Link href="/faq" className="nav-link" style={{ fontSize: 13 }}>FAQ</Link>
            <Link href="/journal" className="nav-link" style={{ fontSize: 13 }}>Journal</Link>
            <Link href="/partners" className="nav-link" style={{ fontSize: 13 }}>Partner with us</Link>
            <Link href="/support" className="nav-link" style={{ fontSize: 13 }}>Support</Link>
            <Link href="/privacy" className="nav-link" style={{ fontSize: 13 }}>Privacy</Link>
            <Link href="/terms" className="nav-link" style={{ fontSize: 13 }}>Terms</Link>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-4)" }}>© {new Date().getFullYear()} Our Fable, Inc. · Private by design.</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {children}
      <style>{`
        p { font-size: 15px; line-height: 1.8; color: var(--text-2); margin: 0; }
        ul { font-size: 15px; line-height: 1.8; color: var(--text-2); padding-left: 20px; margin: 0; }
        li { margin-bottom: 6px; }
        strong { color: var(--text); }
      `}</style>
    </div>
  );
}

function SectionNote({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 18, color: "var(--text)", lineHeight: 1.6, fontWeight: 600 }}>{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.3, margin: 0 }}>{children}</h2>;
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em", margin: 0 }}>{children}</h3>;
}
