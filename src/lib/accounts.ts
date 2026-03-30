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

export interface OurFableUserRecord {
  _id: string;
  email: string;
  passwordHash: string;
  passwordChangedAt?: number;
  familyId: string;
  name: string;
  role: "owner" | "parent";
}

/**
 * Look up account by email.
 * Checks ourfable_users first (new dual-parent system), falls back to ourfable_families (legacy).
 */
export async function getAccount(email: string): Promise<(OurFableAccount & {
  userId?: string;
  userName?: string;
  passwordChangedAt?: number;
}) | undefined> {
  const normalized = email.toLowerCase().trim();

  // Try user-based auth first
  const userResult = await internalConvexQuery<OurFableUserRecord | null>(
    "ourfable:getOurFableUserByEmail", { email: normalized }
  );

  if (userResult) {
    // Look up the family for childName
    const family = await internalConvexQuery<{ childName: string } | null>(
      "ourfable:getOurFableFamilyById", { familyId: userResult.familyId }
    );
    return {
      email: userResult.email,
      passwordHash: userResult.passwordHash,
      familyId: userResult.familyId,
      childName: family?.childName ?? "",
      parentNames: userResult.name,
      userId: userResult._id,
      userName: userResult.name,
      passwordChangedAt: userResult.passwordChangedAt,
    };
  }

  // Fall back to family-based auth (unmigrated accounts)
  const result = await internalConvexQuery<{
    email: string;
    passwordHash: string;
    passwordChangedAt?: number;
    familyId: string;
    childName: string;
    planType: string;
    parentNames?: string;
  } | null>("ourfable:getOurFableFamilyByEmail", { email: normalized });

  if (!result) return undefined;

  return {
    email: result.email,
    passwordHash: result.passwordHash,
    familyId: result.familyId,
    childName: result.childName,
    parentNames: result.parentNames ?? "",
    passwordChangedAt: result.passwordChangedAt,
  };
}

export async function addAccount(account: OurFableAccount & {
  planType?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  birthDate?: string;
}): Promise<void> {
  if (!account.passwordHash || !account.passwordHash.trim()) {
    throw new Error(`[addAccount] passwordHash is required for ${account.email}`);
  }

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

  // Also create a user record (dual-parent system)
  try {
    await internalConvexMutation("ourfable:createOurFableUser", {
      email: account.email.toLowerCase().trim(),
      passwordHash: account.passwordHash,
      familyId: account.familyId,
      name: account.parentNames || "Parent",
      role: "owner",
    });
  } catch (err) {
    // Non-fatal — user will be lazy-migrated on login
    console.warn("[addAccount] Failed to create user record:", err);
  }
}

export async function accountExists(email: string): Promise<boolean> {
  const account = await getAccount(email);
  return account !== undefined;
}
