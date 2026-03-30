// OurFable Auth — HMAC-SHA256 signed sessions, Edge-compatible
// Uses Web Crypto API only (no Node.js crypto — runs in Vercel Edge Middleware)

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("SESSION_SECRET environment variable is required. Set it in your .env file or hosting provider.");
}
export const COOKIE = "ourfable_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
export const PRE_AUTH_CHALLENGE_MAX_AGE = 60 * 5; // 5 minutes

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

// ── Token format: base64url(JSON payload).signature ───────────

export interface SessionPayload {
  familyId: string;
  userId?: string;   // Convex _id of the ourfable_users record
  email?: string;
  name?: string;
  passwordChangedAt: number;
  issuedAt: number;
  expiresAt: number;
}

export interface PreAuthChallengePayload {
  familyId: string;
  email: string;
  userId?: string;
  issuedAt: number;
  expiresAt: number;
}

async function encodeSignedPayload(payload: object): Promise<string> {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const sig = await sign(encoded);
  return `${encoded}.${sig}`;
}

async function decodeSignedPayload<T>(token: string): Promise<T | null> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const valid = await verify(encoded, sig);
  if (!valid) return null;

  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (padded.length % 4)) % 4;
  return JSON.parse(atob(padded + "=".repeat(padding))) as T;
}

export async function createSession(
  familyId: string,
  extra?: { userId?: string; email?: string; name?: string; passwordChangedAt?: number }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    familyId,
    userId: extra?.userId,
    email: extra?.email,
    name: extra?.name,
    passwordChangedAt: extra?.passwordChangedAt ?? Math.floor(Date.now() / 1000),
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE,
  };
  return encodeSignedPayload(payload);
}

export async function createPreAuthChallenge(
  familyId: string,
  email: string,
  userId?: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return encodeSignedPayload({
    familyId,
    email: email.toLowerCase().trim(),
    userId,
    issuedAt: now,
    expiresAt: now + PRE_AUTH_CHALLENGE_MAX_AGE,
  } satisfies PreAuthChallengePayload);
}

export async function verifyPreAuthChallenge(token: string): Promise<PreAuthChallengePayload | null> {
  const payload = await decodeSignedPayload<PreAuthChallengePayload>(token);
  if (!payload) return null;
  const now = Math.floor(Date.now() / 1000);
  if (payload.expiresAt < now) return null;
  return payload;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const payload = await decodeSignedPayload<SessionPayload>(token);
    if (!payload) return null;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) return null;

    const { internalConvexQuery } = await import("@/lib/convex-internal");
    if (payload.userId) {
      const user = await internalConvexQuery<{
        passwordChangedAt?: number;
      } | null>("ourfable:getOurFableUserById", { userId: payload.userId });
      if (!user) return null;
      const currentPasswordChangedAt = Math.floor((user.passwordChangedAt ?? 0) / 1000);
      if (currentPasswordChangedAt !== payload.passwordChangedAt) return null;
    } else {
      const family = await internalConvexQuery<{
        passwordChangedAt?: number;
        deletedAt?: number;
        status?: string;
      } | null>("ourfable:getOurFableFamilyById", { familyId: payload.familyId });
      if (!family || family.deletedAt || family.status === "deleted") return null;
      const currentPasswordChangedAt = Math.floor((family.passwordChangedAt ?? 0) / 1000);
      if (currentPasswordChangedAt !== payload.passwordChangedAt) return null;
    }

    return payload;
  } catch { return null; }
}

// ── Rate limiting — Convex-backed for serverless (HIGH-3 fix) ──────────────
// Uses Convex to persist rate limit state across serverless invocations.
// Falls back to in-memory for non-login rate limiting (Edge middleware, etc.)
// Note: Dynamic import of convex-internal to avoid loading in Edge middleware context.

// Convex-backed login rate limiting (works on serverless)
export async function checkLoginRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const { internalConvexQuery } = await import("@/lib/convex-internal");
    const result = await internalConvexQuery<{
      allowed: boolean;
      remaining: number;
      lockedUntil?: number;
    }>("ourfable:checkLoginRateLimit", { ipKey: `auth:${ip}` });
    return result;
  } catch {
    // Fallback: allow if Convex is unreachable
    return { allowed: true, remaining: 5 };
  }
}

export async function recordLoginFailure(ip: string): Promise<void> {
  try {
    const { internalConvexMutation } = await import("@/lib/convex-internal");
    await internalConvexMutation("ourfable:recordLoginFailure", { ipKey: `auth:${ip}` });
  } catch {
    // Non-fatal
  }
}

export async function clearLoginRateLimit(ip: string): Promise<void> {
  try {
    const { internalConvexMutation } = await import("@/lib/convex-internal");
    await internalConvexMutation("ourfable:clearLoginAttempts", { ipKey: `auth:${ip}` });
  } catch {
    // Non-fatal
  }
}

// Legacy in-memory rate limiting (for Edge middleware and non-critical paths)
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
