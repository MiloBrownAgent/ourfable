"use client";
import { useEffect, useRef } from "react";
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

export function MetaPixel({ pixelId }: { pixelId: string }) {
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

    if (typeof window.fbq !== "function") return;

    window.fbq("track", "PageView");
  }, [pathname]);

  if (!isPublicRoute(pathname)) return null;

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
