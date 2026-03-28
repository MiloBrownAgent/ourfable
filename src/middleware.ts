import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";

// Public paths — no auth required
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/how-it-works",
  "/join/",
  "/respond/",
  "/api/",
  "/_next",
  "/favicon",
  "/icon",
  "/apple-icon",
  "/welcome",
  "/gift",
  "/redeem/",
  "/privacy",
  "/terms",
  "/mockup",
  "/og-image.png",
  "/unsubscribe",
  "/faq",
  "/delivery/",
  "/facilitate/",
  "/partners",
  "/reserve",
  "/go",
  "/view/",
  "/reset-password",
  "/journal",
  "/invite/",
  "/demo",
  "/support",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/googlee054f0458cc7f091.html",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  return PUBLIC_PREFIXES.some(p =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + "/")
  );
}

// Share paths — /{family}/share/{token} are public
function isSharePath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 3 && parts[1] === "share";
}

// SEO-indexable pages — these should NOT get noindex
const INDEXABLE_PATHS = new Set([
  "/",
  "/faq",
  "/privacy",
  "/terms",
  "/gift",
  "/how-it-works",
  "/journal",
  "/demo",
]);

function isBlogPath(pathname: string): boolean {
  return pathname === "/journal" || pathname.startsWith("/journal/");
}

function isIndexable(pathname: string): boolean {
  return INDEXABLE_PATHS.has(pathname) || isBlogPath(pathname);
}

// Shared security headers applied to all responses
function applySecurityHeaders(res: NextResponse): void {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.facebook.com https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://rightful-eel-502.convex.cloud https://api.resend.com https://www.facebook.com https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://*.googletagmanager.com",
      "frame-src 'self' https://js.stripe.com https://www.facebook.com",
      "media-src 'self' blob: https:",
    ].join("; ")
  );
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(), interest-cohort=()"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (isPublic(pathname) || isSharePath(pathname)) {
    const res = NextResponse.next();
    applySecurityHeaders(res);
    // Only add noindex on non-indexable public pages (login, signup, api, join, respond, etc.)
    if (!isIndexable(pathname)) {
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return res;
  }

  // Verify session
  const token = req.cookies.get(COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(COOKIE);
    return res;
  }

  // Ensure the user is accessing their own family's pages
  // /{family}/... — first segment is the familyId
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && !segments[0].startsWith("api")) {
    const routeFamilyId = segments[0];
    if (routeFamilyId !== session.familyId && !routeFamilyId.startsWith("_")) {
      // Wrong family — redirect to their own family hub
      return NextResponse.redirect(new URL(`/${session.familyId}`, req.url));
    }
  }

  const res = NextResponse.next();

  // Security headers — authenticated routes always get noindex
  applySecurityHeaders(res);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store, max-age=0");

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest\\.json|icon-.*\\.png|google.*\\.html).*)"],
};
