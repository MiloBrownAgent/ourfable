"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Google Analytics 4 — consent-gated, same as MetaPixel.
 * Only loads on public marketing pages after cookie consent.
 */

const PUBLIC_PATHS = [
  "/",
  "/faq",
  "/privacy",
  "/terms",
  "/gift",
  "/reserve",
  "/go",
  "/login",
  "/signup",
  "/welcome",
  "/how-it-works",
  "/journal",
  "/partners",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/journal/")) return true;
  if (pathname.startsWith("/join/") || pathname.startsWith("/respond/") || pathname.startsWith("/redeem/")) return true;
  return false;
}

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    try {
      setConsented(localStorage.getItem("cookie-consent") === "1");
    } catch {}

    const handler = () => {
      try {
        setConsented(localStorage.getItem("cookie-consent") === "1");
      } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!consented) return null;
  if (!isPublicRoute(pathname)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}', {
          page_path: window.location.pathname,
          send_page_view: true
        });
      `}</Script>
    </>
  );
}
