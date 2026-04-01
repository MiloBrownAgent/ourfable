"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Google Analytics 4 for public-facing marketing and invite flows.
 * It never emits page views on authenticated family routes.
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
  const hasTrackedInitialPage = useRef(false);

  useEffect(() => {
    if (!isPublicRoute(pathname)) {
      hasTrackedInitialPage.current = true;
      return;
    }

    if (!hasTrackedInitialPage.current) {
      hasTrackedInitialPage.current = true;
      return;
    }

    if (typeof window.gtag !== "function") return;

    window.gtag("config", gaId, {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [gaId, pathname]);

  if (!isPublicRoute(pathname)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};
        window.gtag('js', new Date());
        window.gtag('config', '${gaId}', {
          page_path: window.location.pathname + window.location.search,
          page_location: window.location.href,
          page_title: document.title,
          send_page_view: true
        });
      `}</Script>
    </>
  );
}
