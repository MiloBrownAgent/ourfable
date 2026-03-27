// OurFable Auth — HMAC-SHA256 signed sessions, Edge-compatible
// Uses Web Crypto API only (no Node.js crypto — runs in Vercel Edge Middleware)

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("SESSION_SECRET environment variable is required. Set it in your .env file or hosting provider.");
}
export const COOKIE = "ourfable_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

// ── HMAC helpers ──────────────────────────────────────────────────────────────

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(data: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  // base64url encode (no +/= padding issues in cookies)
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function verify(data: string, signature: string): Promise<boolean> {
  try {
    const expected = await sign(data);
    // Constant-time comparison
    if (expected.length !== signature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch { return false; }
}

// ── Token format: base64url(familyId:issuedAt:expiresAt).signature ───────────

export interface SessionPayload {
  familyId: string;
  issuedAt: number;
  expiresAt: number;
}

export async function createSession(familyId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    familyId,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE,
  };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const sig = await sign(encoded);
  return `${encoded}.${sig}`;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const encoded = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const valid = await verify(encoded, sig);
    if (!valid) return null;

    // Decode payload (add back base64 padding)
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (padded.length % 4)) % 4;
    const payload: SessionPayload = JSON.parse(atob(padded + "=".repeat(padding)));

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) return null;

    return payload;
  } catch { return null; }
}

// ── Rate limiting (in-memory, per Edge instance) ──────────────────────────────
// Lightweight — resets on cold start but good enough for auth brute-force protection

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxAttempts - entry.count };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}
