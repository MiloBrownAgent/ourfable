"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Google Analytics 4 for public-facing marketing and invite flows.
 * Defaults to tracking on public routes, but respects an explicit user decline.
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

function readOptOut(): boolean {
  try {
    return localStorage.getItem("cookie-consent") === "0";
  } catch {
    return false;
  }
}

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const hasTrackedInitialPage = useRef(false);
  const [optedOut, setOptedOut] = useState(() => readOptOut());

  useEffect(() => {
    const handler = () => setOptedOut(readOptOut());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window[`ga-disable-${gaId}`] = optedOut;

    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: optedOut ? "denied" : "granted",
        ad_storage: optedOut ? "denied" : "granted",
        ad_user_data: optedOut ? "denied" : "granted",
        ad_personalization: optedOut ? "denied" : "granted",
      });
    }
  }, [gaId, optedOut]);

  useEffect(() => {
    if (!isPublicRoute(pathname)) {
      hasTrackedInitialPage.current = true;
      return;
    }

    if (optedOut) return;

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
  }, [gaId, optedOut, pathname]);

  if (!isPublicRoute(pathname) || optedOut) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};
        window['ga-disable-${gaId}'] = ${optedOut ? "true" : "false"};
        window.gtag('js', new Date());
        window.gtag('consent', 'default', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted'
        });
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
