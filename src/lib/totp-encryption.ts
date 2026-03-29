/**
 * Server-side TOTP secret encryption at rest (C3 security fix).
 *
 * Uses AES-256-GCM with a server-side key (TOTP_ENCRYPTION_KEY env var)
 * to encrypt TOTP secrets before storing in the database. This prevents
 * database compromise from exposing valid TOTP secrets.
 *
 * IMPORTANT: Add TOTP_ENCRYPTION_KEY to Vercel env vars.
 * Generate with: openssl rand -base64 32
 */

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  if (!key) {
    // Fallback to SESSION_SECRET if TOTP_ENCRYPTION_KEY not set
    // (less ideal but better than plaintext)
    const fallback = process.env.SESSION_SECRET;
    if (!fallback) throw new Error("TOTP_ENCRYPTION_KEY or SESSION_SECRET required");
    // Derive a 32-byte key from SESSION_SECRET using SHA-256
    return crypto.createHash("sha256").update(`totp-encryption:${fallback}`).digest();
  }
  // Decode base64 key
  const buf = Buffer.from(key, "base64");
  if (buf.length < 32) {
    throw new Error("TOTP_ENCRYPTION_KEY must be at least 32 bytes (base64 encoded)");
  }
  return buf.subarray(0, 32);
}

/**
 * Encrypt a TOTP secret for storage.
 * Returns a string format: base64(iv + ciphertext + tag)
 */
export function encryptTOTPSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack: iv (12) + ciphertext + tag (16)
  const packed = Buffer.concat([iv, encrypted, tag]);
  return `enc:${packed.toString("base64")}`;
}

/**
 * Decrypt a TOTP secret from storage.
 * Handles both encrypted (prefixed with "enc:") and legacy plaintext secrets.
 */
export function decryptTOTPSecret(stored: string): string {
  // Legacy: plaintext secrets (not prefixed)
  if (!stored.startsWith("enc:")) {
    return stored;
  }

  const key = getEncryptionKey();
  const packed = Buffer.from(stored.slice(4), "base64");
  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(packed.length - TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH, packed.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
