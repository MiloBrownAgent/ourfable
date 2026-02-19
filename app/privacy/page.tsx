import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — OurFable.ai',
  description: 'OurFable.ai privacy policy. Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-xl border-b border-brand-border">
        <Link href="/" className="font-display text-2xl font-extrabold text-brand-ink">
          Our<span className="text-brand-teal">Fable</span>
          <span className="text-brand-ink-muted text-sm font-body">.ai</span>
        </Link>
        <Link href="/" className="btn-secondary text-sm py-2 px-4">
          Back to Home
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display text-4xl font-extrabold text-brand-ink mb-2">Privacy Policy</h1>
        <p className="text-brand-ink-muted font-body text-sm mb-10">Last updated: February 19, 2026</p>

        <div className="prose prose-gray max-w-none font-body space-y-8">
          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">1. Information We Collect</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed mb-3">We collect the following types of information when you use OurFable.ai:</p>
            <ul className="list-disc pl-5 text-brand-ink-light text-sm leading-relaxed space-y-2">
              <li><strong className="text-brand-ink">Email address</strong> — provided when you sign up or join our waitlist.</li>
              <li><strong className="text-brand-ink">Photos you upload</strong> — used solely to generate personalized storybook illustrations for your child.</li>
              <li><strong className="text-brand-ink">Story details</strong> — character names, ages, descriptions, and preferences you provide when creating a book.</li>
              <li><strong className="text-brand-ink">Usage data</strong> — anonymous analytics such as pages visited, features used, and browser type to improve our service.</li>
              <li><strong className="text-brand-ink">Payment information</strong> — processed securely by Stripe. We never store your credit card details directly.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-brand-ink-light text-sm leading-relaxed space-y-2">
              <li>To create your personalized storybooks using AI generation.</li>
              <li>To send transactional emails (account confirmations, book-ready notifications).</li>
              <li>To process orders and deliver hardcover books.</li>
              <li>To improve our service and user experience.</li>
              <li>To communicate product updates if you opt in.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">3. Photo Privacy &amp; Deletion</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed mb-3">
              We take the privacy of your children&apos;s photos extremely seriously.
            </p>
            <ul className="list-disc pl-5 text-brand-ink-light text-sm leading-relaxed space-y-2">
              <li>Photos are used <strong className="text-brand-ink">only</strong> to generate your storybook illustrations.</li>
              <li>Photos are <strong className="text-brand-ink">automatically deleted</strong> after book generation is complete.</li>
              <li>Photos are <strong className="text-brand-ink">never shared</strong> with third parties, used for training AI models, or used for any purpose other than creating your book.</li>
              <li>You may request deletion of all your data at any time by contacting us.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">4. Children&apos;s Privacy (COPPA Compliance)</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed mb-3">
              OurFable.ai is designed for parents and guardians to create storybooks for their children. We are committed to complying with the Children&apos;s Online Privacy Protection Act (COPPA).
            </p>
            <ul className="list-disc pl-5 text-brand-ink-light text-sm leading-relaxed space-y-2">
              <li>We do not knowingly collect personal information directly from children under 13.</li>
              <li>All accounts must be created by a parent or legal guardian.</li>
              <li>Photos of children are uploaded by parents/guardians with their consent and are used solely for storybook generation.</li>
              <li>Parents may review, delete, or refuse further collection of their child&apos;s information at any time by contacting us.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">5. Data Sharing</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed mb-3">
              <strong className="text-brand-ink">We do not sell your personal information to third parties.</strong> We share data only with:
            </p>
            <ul className="list-disc pl-5 text-brand-ink-light text-sm leading-relaxed space-y-2">
              <li><strong className="text-brand-ink">Stripe</strong> — for secure payment processing.</li>
              <li><strong className="text-brand-ink">AI service providers</strong> — to generate story text and illustrations (photos are processed transiently and not retained by providers).</li>
              <li><strong className="text-brand-ink">Email delivery services</strong> — to send transactional notifications.</li>
              <li><strong className="text-brand-ink">Hosting providers</strong> — for secure cloud infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">6. Data Security</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed">
              We use industry-standard encryption (TLS/SSL) for data in transit and at rest. Access to user data is restricted to authorized personnel only. We regularly review our security practices to protect your information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">7. Cookies</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed">
              We use essential cookies for authentication and session management. We may use anonymous analytics cookies to understand how our service is used. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">8. Your Rights</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 text-brand-ink-light text-sm leading-relaxed space-y-2">
              <li>Access and download your personal data.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and all associated data.</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">9. Changes to This Policy</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of significant changes via email or a prominent notice on our website.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-brand-ink mb-3">10. Contact Us</h2>
            <p className="text-brand-ink-light text-sm leading-relaxed">
              If you have questions about this privacy policy or your data, please contact us at <a href="mailto:privacy@ourfable.ai" className="text-brand-teal hover:underline">privacy@ourfable.ai</a>.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-brand-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-brand-ink-muted text-sm font-body">
            &copy; 2026 OurFable.ai. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
