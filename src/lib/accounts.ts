// OurFable Accounts — Convex-backed persistent store
// Replaces the old in-memory Map that wiped on every Vercel cold start.
// Uses Convex HTTP API (fetch to /api/mutation and /api/query).

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

const SECRET: string = process.env.SESSION_SECRET ?? "";
if (!SECRET) throw new Error("SESSION_SECRET environment variable is required");

const BCRYPT_ROUNDS = 12;

export interface OurFableAccount {
  email: string;       // lowercase
  passwordHash: string; // bcrypt hash (or legacy HMAC-SHA256 hex)
  familyId: string;
  childName: string;
  parentNames: string;
}

// Legacy HMAC-SHA256 hash (for migration compatibility)
function legacyHashPassword(password: string): string {
  return crypto.createHmac("sha256", SECRET).update(password).digest("hex");
}

function isLegacyHash(hash: string): boolean {
  // HMAC-SHA256 produces a 64-char hex string; bcrypt starts with $2a$ or $2b$
  return /^[0-9a-f]{64}$/.test(hash);
}

// Hash a plaintext password using bcrypt
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

// Verify password against hash — supports both bcrypt and legacy HMAC-SHA256
export function verifyPassword(password: string, hash: string): boolean {
  if (isLegacyHash(hash)) {
    // Legacy HMAC-SHA256 verification
    const candidate = legacyHashPassword(password);
    if (candidate.length !== hash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
  }
  // bcrypt verification
  return bcrypt.compareSync(password, hash);
}

// Check if a hash needs upgrading from legacy to bcrypt
export function needsHashUpgrade(hash: string): boolean {
  return isLegacyHash(hash);
}

// ── Convex-backed account operations ──────────────────────────────────────────
export async function getAccount(email: string): Promise<OurFableAccount | undefined> {
  const normalized = email.toLowerCase().trim();
  const result = await internalConvexQuery<{
    email: string;
    passwordHash: string;
    familyId: string;
    childName: string;
    planType: string;
  } | null>("ourfable:getOurFableFamilyByEmail", { email: normalized });

  if (!result) return undefined;

  return {
    email: result.email,
    passwordHash: result.passwordHash,
    familyId: result.familyId,
    childName: result.childName,
    parentNames: "",
  };
}

export async function addAccount(account: OurFableAccount & {
  planType?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  birthDate?: string;
}): Promise<void> {
  await internalConvexMutation("ourfable:createOurFableFamily", {
    familyId: account.familyId,
    email: account.email.toLowerCase().trim(),
    passwordHash: account.passwordHash,
    childName: account.childName,
    planType: account.planType ?? "annual",
    stripeCustomerId: account.stripeCustomerId,
    stripeSubscriptionId: account.stripeSubscriptionId,
    birthDate: account.birthDate,
  });
}

export async function accountExists(email: string): Promise<boolean> {
  const account = await getAccount(email);
  return account !== undefined;
}
