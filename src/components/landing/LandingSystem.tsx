"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function LandingPageStyles() {
  return (
    <style>{`
      .of-landing-root {
        min-height: 100vh;
        background: linear-gradient(180deg, var(--bg) 0%, #F8F4EE 100%);
        color: var(--text);
      }
      .of-landing-shell {
        max-width: 1180px;
        margin: 0 auto;
        padding: 0 24px 96px;
      }
      .of-landing-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 28px 0 18px;
      }
      .of-landing-logo {
        text-decoration: none;
        color: var(--green);
        font-family: var(--font-playfair);
        font-size: 25px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .of-landing-nav-links {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
      }
      .of-landing-nav-link {
        text-decoration: none;
        color: var(--text-2);
        font-size: 14px;
      }
      .of-landing-nav-link:hover { color: var(--text); }
      .of-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        border: 1px solid var(--green-border, #C9D6C8);
        background: var(--green-light, #F3F8F3);
        color: var(--green);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .of-primary-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--green);
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 14px 22px;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: opacity 180ms ease, transform 180ms ease;
      }
      .of-primary-btn:hover { opacity: 0.92; }
      .of-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .of-secondary-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--text-2);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
      }
      .of-secondary-link:hover { color: var(--text); }
      .of-hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
        gap: 40px;
        align-items: start;
        padding: 22px 0 42px;
      }
      .of-hero-display {
        font-family: var(--font-playfair);
        font-size: clamp(2.7rem, 5.8vw, 4.8rem);
        line-height: 1.02;
        letter-spacing: -0.035em;
        margin: 0 0 18px;
      }
      .of-hero-copy {
        font-size: 17px;
        line-height: 1.85;
        color: var(--text-2);
        max-width: 660px;
        margin: 0 0 16px;
      }
      .of-muted-copy {
        font-size: 15px;
        line-height: 1.8;
        color: var(--text-3);
        margin: 0;
      }
      .of-card {
        background: rgba(255,255,255,0.92);
        border: 1px solid var(--border);
        border-radius: 22px;
        box-shadow: 0 18px 48px rgba(22, 22, 19, 0.06);
      }
      .of-section {
        padding: 34px 0;
        border-top: 1px solid rgba(87, 94, 86, 0.08);
      }
      .of-section:first-of-type { border-top: none; }
      .of-section-label {
        margin: 0 0 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--green);
      }
      .of-section-title {
        margin: 0 0 12px;
        font-family: var(--font-playfair);
        font-size: clamp(1.8rem, 3vw, 2.55rem);
        line-height: 1.14;
        letter-spacing: -0.02em;
        color: var(--text);
      }
      .of-section-copy {
        margin: 0;
        font-size: 15px;
        line-height: 1.82;
        color: var(--text-3);
        max-width: 760px;
      }
      .of-feature-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 24px;
      }
      .of-feature-card {
        padding: 22px 20px;
        border-radius: 18px;
        background: rgba(255,255,255,0.8);
        border: 1px solid var(--border);
      }
      .of-step-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 24px;
      }
      .of-step-card {
        padding: 24px 20px;
        border-radius: 18px;
        background: var(--bg-2, #F8F5F0);
        border: 1px solid var(--border);
      }
      .of-step-number {
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--green);
        color: white;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 12px;
      }
      .of-trust-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 24px;
      }
      .of-proof-placeholder {
        margin-top: 24px;
        padding: 22px;
        border-radius: 18px;
        border: 1px dashed rgba(87, 94, 86, 0.18);
        background: rgba(255,255,255,0.65);
      }
      .of-close-cta {
        margin-top: 18px;
        padding: 28px;
        border-radius: 22px;
        background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(246,249,246,0.96) 100%);
        border: 1px solid var(--border);
      }
      .of-field-label {
        display: block;
        margin-bottom: 8px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-3);
      }
      .of-input, .of-textarea, .of-select {
        width: 100%;
        box-sizing: border-box;
        padding: 13px 14px;
        border-radius: 12px;
        border: 1.5px solid var(--border);
        background: white;
        color: var(--text);
        font-size: 15px;
        font-family: inherit;
        outline: none;
      }
      .of-input:focus, .of-textarea:focus, .of-select:focus { border-color: var(--green); }
      .of-mini-list {
        display: grid;
        gap: 8px;
        margin-top: 14px;
      }
      .of-mini-item {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        font-size: 14px;
        line-height: 1.65;
        color: var(--text-2);
      }
      @media (max-width: 980px) {
        .of-hero-grid, .of-feature-grid, .of-step-grid, .of-trust-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 680px) {
        .of-landing-shell { padding: 0 18px 72px; }
        .of-landing-nav { padding: 20px 0 12px; }
        .of-landing-nav-links { gap: 14px; }
      }
    `}</style>
  );
}

export function LandingNav({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <nav className="of-landing-nav">
      <Link href="/" className="of-landing-logo">Our Fable</Link>
      <div className="of-landing-nav-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="of-landing-nav-link">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function LandingSection({ label, title, copy, children }: { label: string; title: string; copy?: string; children?: ReactNode }) {
  return (
    <section className="of-section">
      <p className="of-section-label">{label}</p>
      <h2 className="of-section-title">{title}</h2>
      {copy ? <p className="of-section-copy">{copy}</p> : null}
      {children}
    </section>
  );
}
