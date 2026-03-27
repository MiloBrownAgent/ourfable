"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

// Public routes where Meta Pixel should fire
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
];

function isPublicRoute(pathname: string): boolean {
  // Exact match or starts with a known public prefix
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Also allow /join/ and /respond/ (public invite flows) and /redeem/
  if (pathname.startsWith("/join/") || pathname.startsWith("/respond/") || pathname.startsWith("/redeem/")) return true;
  return false;
}

export function MetaPixel({ pixelId }: { pixelId: string }) {
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

  // Don't load pixel until user has consented
  if (!consented) return null;

  // Don't load pixel on authenticated/family routes
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
