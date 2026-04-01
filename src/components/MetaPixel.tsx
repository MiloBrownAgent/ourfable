"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

// Public-facing marketing and invite routes where Meta Pixel may fire.
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

export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const hasTrackedInitialPage = useRef(false);
  const [optedOut, setOptedOut] = useState(() => readOptOut());

  useEffect(() => {
    const handler = () => setOptedOut(readOptOut());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    if (typeof window.fbq !== "function") return;
    window.fbq("consent", optedOut ? "revoke" : "grant");
  }, [optedOut]);

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

    if (typeof window.fbq !== "function") return;

    window.fbq("track", "PageView");
  }, [optedOut, pathname]);

  if (!isPublicRoute(pathname) || optedOut) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('consent', 'grant');
        fbq('track', 'PageView');
      `}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
