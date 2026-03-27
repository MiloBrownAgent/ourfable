/**
 * analytics.ts — OurFable analytics utility
 *
 * Provides typed event helpers for Meta Pixel (fbq) + GA4 (gtag).
 * All functions are client-safe: check typeof window before firing.
 *
 * Pixel ID: pulled from NEXT_PUBLIC_META_PIXEL_ID (already in layout.tsx)
 * GA4 ID:   pulled from NEXT_PUBLIC_GA_MEASUREMENT_ID
 */

// ── Type shims ────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ── Event ID generation (for Pixel ↔ CAPI deduplication) ──────────────────────

export function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function fireFbq(eventType: "track" | "trackCustom", eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!window.fbq) return;
  if (params) {
    window.fbq(eventType, eventName, params);
  } else {
    window.fbq(eventType, eventName);
  }
}

function fireGtag(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  window.gtag("event", eventName, params ?? {});
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * trackLead — fires on waitlist form submit.
 * Maps to Meta Pixel standard event "Lead" + GA4 event "generate_lead".
 * Accepts an optional eventId for Pixel ↔ CAPI deduplication.
 */
export function trackLead(eventId?: string) {
  const params: Record<string, unknown> = {};
  if (eventId) params.eventID = eventId;
  fireFbq("track", "Lead", Object.keys(params).length > 0 ? params : undefined);
  fireGtag("generate_lead", { event_category: "waitlist", event_label: "waitlist_submit" });
}

/**
 * trackGiftPageView — fires when a user lands on /gift.
 * Custom event: "ViewGiftPage" on both Meta Pixel and GA4.
 */
export function trackGiftPageView() {
  fireFbq("trackCustom", "ViewGiftPage");
  fireGtag("ViewGiftPage", { event_category: "engagement", event_label: "gift_page" });
}

/**
 * trackPricingScroll — fires when the pricing section scrolls into view.
 * Uses IntersectionObserver; call this once with the pricing section ref.
 * Custom event: "PricingScroll".
 */
export function trackPricingScroll() {
  fireFbq("trackCustom", "PricingScroll");
  fireGtag("PricingScroll", { event_category: "engagement", event_label: "pricing_visible" });
}

/**
 * trackHIWView — fires when a user views the How It Works page.
 * Custom event: "ViewHIW".
 */
export function trackHIWView() {
  fireFbq("trackCustom", "ViewHIW");
  fireGtag("ViewHIW", { event_category: "engagement", event_label: "hiw_page" });
}
