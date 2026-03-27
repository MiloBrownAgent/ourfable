/**
 * utm.ts — UTM parameter capture & persistence
 *
 * Extracts utm_source, utm_medium, utm_campaign, utm_content, utm_term
 * from the URL on first load, persists them in sessionStorage so they
 * survive client-side navigation, and exposes a clean getter.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const STORAGE_KEY = "ourfable_utm";

/**
 * Call once on page load (client-side only).
 * Reads UTM params from the current URL and stashes them in sessionStorage.
 * Does NOT overwrite if already captured (first-touch attribution).
 */
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;

  // If we already captured UTMs this session, keep them (first touch wins)
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return;

  const params = new URLSearchParams(window.location.search);
  const utms: UtmParams = {};
  let hasAny = false;

  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) {
      utms[key] = val;
      hasAny = true;
    }
  }

  if (hasAny) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
  }
}

/**
 * Retrieve captured UTM params. Returns empty object if none captured.
 */
export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}
