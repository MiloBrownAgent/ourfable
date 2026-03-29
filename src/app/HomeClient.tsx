"use client";
import { useEffect, useState } from "react";
import {
  MobileNav,
  HeroSection,
  VignettesSection,
  LetterMomentSection,
  VideoMomentSection,
  StatsSection,
  CircleSection,
  HowItWorksSection,
  FeaturesSection,
  PricingSection,
  FounderNote,
  FooterSection,
  StickyNav,
  ProofStrip,
  DispatchSection,

  MidPageCapture,
  MultiChildSection,
  TrustSection,
  VaultOpeningSection,
} from "../components/home";

export default function HomeClient() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [showSecondNav, setShowSecondNav] = useState(false);

  useEffect(() => {
    const h = () => {
      setScrolled(window.scrollY > 30);
      setShowSecondNav(window.scrollY > 600);
      const sections = ["why-it-matters", "how-it-works", "whats-inside", "pricing"];
      let current = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }

        /* Hero sub-headline: show desktop, hide mobile */
        .hero-sub-desktop { display: block; }
        .hero-sub-mobile { display: none; }

        /* Sticky bottom CTA: mobile only */
        .sticky-bottom-cta { display: block; }

        @media (min-width: 769px) {
          .sticky-bottom-cta { display: none !important; }
        }

        @media (max-width: 768px) {
          .hero-sub-desktop { display: none !important; }
          .hero-sub-mobile { display: block !important; }
        }

        @media (max-width: 860px) {
          .hero-cols { grid-template-columns: 1fr !important; }
          .hero-right { margin-top: 48px !important; }
          .mockup-tabs { display: none !important; }
          .mockup-mobile-label { display: block !important; }
          .mockup-dots { display: flex !important; }
          .mockup-height-container { animation: none !important; max-height: 420px; overflow: hidden; border-radius: 16px; }
          .mockup-scale-wrapper { transform: scale(0.78); transform-origin: top center; }
        }
        @media (max-width: 640px) { .features-grid { grid-template-columns: 1fr 1fr !important; } .stats-row { grid-template-columns: 1fr !important; } }
        @media (max-width: 680px) {
          .nav-links { display: none !important; }
          .nav-cta { padding: 9px 18px !important; font-size: 13px !important; }
          .hero-section { padding: 100px 20px 60px !important; }
          .section-pad { padding-left: 20px !important; padding-right: 20px !important; }
          .stats-row { gap: 0 !important; }
          .stats-row > div { border-right: none !important; border-bottom: 1px solid var(--border); padding: 24px 20px !important; }
          .vignettes-grid { grid-template-columns: 1fr !important; }
          .dark-section { padding: 72px 24px !important; }
          .cta-section { padding: 60px 24px 100px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .waitlist-row { flex-direction: column !important; }
          .waitlist-row input { flex: none !important; width: 100% !important; }
          .waitlist-row button { width: 100% !important; justify-content: center !important; }
          .circle-svg-wrap { max-width: 100% !important; overflow-x: auto !important; }
          .circle-mobile { display: block !important; }
          .circle-desktop { display: none !important; }
          .section-subnav { display: none !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .hiw-grid { grid-template-columns: 1fr !important; }
          .hiw-mockup { display: none !important; }
        }
      `}</style>

      <MobileNav scrolled={scrolled} />
      <StickyNav scrolled={scrolled} showSecondNav={showSecondNav} activeSection={activeSection} />
      <HeroSection />
      <ProofStrip />
      <VignettesSection />
      <DispatchSection />
      <TrustSection />
      <LetterMomentSection />
      <VideoMomentSection />
      <CircleSection />
      <VaultOpeningSection />
      <HowItWorksSection />
      <FeaturesSection />
      <MultiChildSection />
      <StatsSection />
      <FounderNote />
      <MidPageCapture />
      <PricingSection />
      <FooterSection />

    </div>
  );
}
