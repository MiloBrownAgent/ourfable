import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Our Fable terms of service. One family vault. Your content, your data, always exportable. Read the full terms for our founding member memory platform.",
  alternates: { canonical: "https://ourfable.ai/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
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
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 12 }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 48 }}>Effective Date: March 24, 2026 · Last Updated: March 24, 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

          <Section>
            <p>These Terms of Service ("Terms") govern your use of Our Fable, operated by Our Fable, Inc. ("Our Fable," "we," "us," or "our"). By creating an account or using Our Fable, you agree to these Terms. If you do not agree, do not use Our Fable.</p>
            <p>Questions? Email <a href="mailto:legal@ourfable.ai" style={{ color: "var(--green)" }}>legal@ourfable.ai</a>.</p>
          </Section>

          <Section>
            <SectionTitle>1. The Service</SectionTitle>
            <p>Our Fable is a private digital memory platform. Parents and guardians create a private vault for their child. Invited circle members (family, friends, godparents) contribute letters, photos, voice memos, and videos in response to monthly prompts. Content is sealed and delivered to the child at milestone ages chosen by the parent. Our Fable also preserves milestone context like The Day They Were Born.</p>
            <p>Our Fable is intended for use by adults (18+) only. Children are the subject of vaults but do not use the service directly.</p>
          </Section>

          <Section>
            <SectionTitle>2. Accounts</SectionTitle>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials and for all activity under your account. Notify us immediately at <a href="mailto:legal@ourfable.ai" style={{ color: "var(--green)" }}>legal@ourfable.ai</a> if you suspect unauthorized access.</p>
            <p>You may not create accounts on behalf of others, impersonate any person or entity, or use Our Fable for any unlawful purpose.</p>
          </Section>

          <Section>
            <SectionTitle>3. Subscription and Billing</SectionTitle>
            <p><strong>Pricing:</strong> Our Fable is available for $12.00 per month or $99.00 per year, billed in advance according to the billing period you choose. Our Fable+ is available for $19.00 per month or $149.00 per year.</p>
            <p><strong>Auto-renewal:</strong> Subscriptions renew automatically at the end of each billing period. You authorize us to charge your payment method on file for the renewal amount unless you cancel before the renewal date.</p>
            <p><strong>Cancellation:</strong> You may cancel your subscription at any time through your account settings or by contacting us. Cancellation takes effect at the end of your current billing period. We do not offer prorated refunds for unused portions of a subscription period, except where required by applicable law.</p>
            <p><strong>Price changes:</strong> We will provide at least 30 days' notice before changing subscription pricing. Continued use after the effective date constitutes acceptance of the new price.</p>
            <p><strong>Waitlist:</strong> Joining the waitlist does not create a subscription or billing obligation. Waitlist membership is free and non-binding.</p>
          </Section>

          <Section>
            <SectionTitle>4. Content and Ownership</SectionTitle>
            <p><strong>Your content is yours.</strong> You and your circle members retain full ownership of all content you submit to Our Fable — photos, videos, voice recordings, letters, and text.</p>
            <p><strong>License to Our Fable:</strong> By submitting content, you grant Our Fable a limited, non-exclusive, non-transferable license to store, process, and display your content solely for the purpose of providing the service to you and your authorized circle members. We do not use your content for any other purpose.</p>
            <p><strong>No public display:</strong> Our Fable does not publicly display, share, or index your content. All vault content is private to your family's circle.</p>
            <p><strong>Your responsibility:</strong> You are responsible for ensuring you have the right to upload any content you submit. Do not upload content that infringes third-party intellectual property rights, contains illegal material, or violates anyone's privacy without their consent.</p>
          </Section>

          <Section>
            <SectionTitle>5. Acceptable Use</SectionTitle>
            <p>You agree not to use Our Fable to:</p>
            <ul>
              <li>Upload, share, or store illegal content of any kind, including content that exploits or harms minors</li>
              <li>Harass, threaten, or abuse any other user</li>
              <li>Impersonate any person or misrepresent your relationship to a child</li>
              <li>Attempt to gain unauthorized access to Our Fable's systems or another user's account</li>
              <li>Use Our Fable for commercial solicitation, spam, or unsolicited communications</li>
              <li>Reverse engineer, decompile, or otherwise attempt to extract Our Fable's source code</li>
              <li>Violate any applicable law or regulation</li>
            </ul>
            <p>Our Fable reserves the right to suspend or terminate accounts that violate these terms, at our sole discretion.</p>
          </Section>

          <Section>
            <SectionTitle>6. Data Deletion and Account Termination</SectionTitle>
            <p>If you cancel your subscription or request account deletion, your vault content and personal data will be retained for 30 days from the cancellation date. During this window, you may export your content. After 30 days, all data is permanently deleted from our systems.</p>
            <p>If Our Fable terminates your account for violation of these Terms, you forfeit any right to a data retention window and your account may be deleted immediately.</p>
            <p>You can request a data export at any time by emailing <a href="mailto:privacy@ourfable.ai" style={{ color: "var(--green)" }}>privacy@ourfable.ai</a>.</p>
          </Section>

          <Section>
            <SectionTitle>7. Service Availability</SectionTitle>
            <p>Our Fable will make reasonable efforts to maintain service availability, but we do not guarantee uninterrupted or error-free service. We may temporarily suspend the service for maintenance, updates, or circumstances beyond our control. We will provide advance notice of planned maintenance when feasible.</p>
          </Section>

          <Section>
            <SectionTitle>8. Vault Encryption and Recovery Codes</SectionTitle>
            <p>Our Fable encrypts vault content using a unique encryption key generated for each family. This key is protected by your account password and can only be recovered using recovery codes or vault guardians that you configure during account setup.</p>
            <p><strong>Recovery codes are your responsibility.</strong> During account setup, you will receive a set of one-time recovery codes. These codes are the only way to restore access to your encrypted vault content if you forget your password and have no vault guardian configured. Our Fable does not store these codes in readable form and cannot recover them for you.</p>
            <p><strong>If you lose your recovery codes and have no vault guardian, your encrypted vault content will be permanently and irreversibly inaccessible.</strong> Our Fable is not liable for any loss of data resulting from lost, misplaced, or forgotten recovery codes. You agree that the security of your recovery codes and vault guardian configuration is solely your responsibility.</p>
            <p>By using Our Fable&apos;s encryption features, you acknowledge and accept this risk. You agree to indemnify and hold harmless Our Fable from any claims, damages, or losses arising from your inability to access encrypted vault content due to lost recovery codes or the absence of a configured vault guardian.</p>
            <p>We strongly recommend printing your recovery codes and storing them in a safe physical location, and assigning at least one vault guardian.</p>
          </Section>

          <Section>
            <SectionTitle>9. Disclaimer of Warranties</SectionTitle>
            <p>Our Fable is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that Our Fable will be error-free, secure, or continuously available.</p>
          </Section>

          <Section>
            <SectionTitle>10. Limitation of Liability</SectionTitle>
            <p>To the fullest extent permitted by applicable law, Our Fable's total liability to you for any claim arising out of or relating to these Terms or your use of the service shall not exceed the amount you paid to Our Fable in the 12 months preceding the claim.</p>
            <p>In no event shall Our Fable be liable for indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of profits, or loss of goodwill, even if advised of the possibility of such damages.</p>
            <p>Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.</p>
          </Section>

          <Section>
            <SectionTitle>11. Indemnification</SectionTitle>
            <p>You agree to indemnify, defend, and hold harmless Our Fable and its officers, directors, employees, and agents from any claims, damages, liabilities, and expenses (including reasonable attorneys' fees) arising out of your use of the service, your content, or your violation of these Terms.</p>
          </Section>

          <Section>
            <SectionTitle>12. Governing Law and Disputes</SectionTitle>
            <p>These Terms are governed by the laws of the State of Minnesota, without regard to conflict of law principles. Any dispute arising out of or relating to these Terms or the service shall be resolved in the state or federal courts located in Hennepin County, Minnesota, and you consent to personal jurisdiction in those courts.</p>
          </Section>

          <Section>
            <SectionTitle>13. Changes to These Terms</SectionTitle>
            <p>We will notify you by email at least 30 days before any material changes to these Terms take effect. For non-material changes (such as clarifications or corrections), we may update the Terms without notice. The current version of these Terms is always available at ourfable.ai/terms. Continued use of Our Fable after the effective date of any changes constitutes acceptance of the updated Terms.</p>
          </Section>

          <Section>
            <SectionTitle>14. Miscellaneous</SectionTitle>
            <p><strong>Entire Agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement between you and Our Fable regarding the service.</p>
            <p><strong>Severability:</strong> If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force and effect.</p>
            <p><strong>No Waiver:</strong> Our failure to enforce any right or provision of these Terms does not constitute a waiver of that right or provision.</p>
            <p><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent. Our Fable may assign its rights in connection with a merger, acquisition, or sale of assets.</p>
          </Section>

          <Section>
            <SectionTitle>14. Contact</SectionTitle>
            <p>Our Fable, Inc.<br /><a href="mailto:legal@ourfable.ai" style={{ color: "var(--green)" }}>legal@ourfable.ai</a></p>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.3, margin: 0 }}>{children}</h2>;
}
