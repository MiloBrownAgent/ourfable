/**
 * OurFable Recovery Codes — client-side generation, hashing, verification
 *
 * Uses Web Crypto API (consistent with vault-encryption.ts).
 * Recovery codes are generated client-side, shown once to the user,
 * then ONLY SHA-256 hashes are stored server-side. We never store plaintext codes.
 *
 * Each recovery code can independently unwrap the family encryption key
 * via a PBKDF2-derived KEK (same pattern as password-based key wrapping).
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "undefined") return globalThis.crypto.subtle;
  throw new Error("SubtleCrypto not available in this environment");
}

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Code Generation ──────────────────────────────────────────────────────────

/**
 * Generate recovery codes. Each code is 8 alphanumeric characters formatted
 * as XXXX-XXXX for readability.
 *
 * @param count Number of codes to generate (default 10)
 * @returns Array of formatted recovery codes (e.g., "ABCD-1234")
 */
export function generateRecoveryCodes(count = 10): string[] {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const randomBytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(randomBytes);

    let code = "";
    for (let j = 0; j < 8; j++) {
      code += chars[randomBytes[j] % chars.length];
    }
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Normalize a recovery code for hashing — strip dashes, uppercase.
 */
export function normalizeCode(code: string): string {
  return code.replace(/[-\s]/g, "").toUpperCase();
}

// ── Hashing ──────────────────────────────────────────────────────────────────

/**
 * PBKDF2 hash a recovery code for storage with per-family salt.
 * H3 SECURITY: Uses PBKDF2 with 10,000 iterations instead of unsalted SHA-256.
 * This prevents rainbow table / GPU brute-force attacks on the small code space.
 *
 * @param code Recovery code (with or without dash)
 * @param salt Base64-encoded salt (family's keySalt)
 * @returns Hex-encoded PBKDF2 hash
 */
export async function hashRecoveryCode(code: string, salt?: string): Promise<string> {
  const normalized = normalizeCode(code);
  const subtle = getSubtleCrypto();

  // If salt provided, use PBKDF2 (new secure path)
  if (salt) {
    const keyMaterial = await subtle.importKey(
      "raw",
      new TextEncoder().encode(normalized),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
    const derived = await subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations: 10_000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    return toHex(derived);
  }

  // Legacy fallback: plain SHA-256 (for verifying old codes)
  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await subtle.digest("SHA-256", encoded);
  return toHex(hashBuffer);
}

/**
 * Verify a recovery code against a stored hash.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param code Recovery code to verify
 * @param hash Stored hex hash
 * @param salt Base64-encoded salt (family's keySalt)
 * @returns true if the code matches the hash
 */
export async function verifyRecoveryCode(
  code: string,
  hash: string,
  salt?: string
): Promise<boolean> {
  const codeHash = await hashRecoveryCode(code, salt);
  // Constant-time comparison
  if (codeHash.length !== hash.length) return false;
  let mismatch = 0;
  for (let i = 0; i < codeHash.length; i++) {
    mismatch |= codeHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Hash all recovery codes in batch.
 *
 * @param codes Array of recovery codes
 * @param salt Base64-encoded salt (family's keySalt)
 * @returns Array of hex-encoded hashes (same order)
 */
export async function hashAllRecoveryCodes(
  codes: string[],
  salt?: string
): Promise<string[]> {
  return Promise.all(codes.map((code) => hashRecoveryCode(code, salt)));
}

// ── Key Wrapping with Recovery Code ──────────────────────────────────────────

/**
 * Derive a KEK from a recovery code using PBKDF2.
 * This lets any single recovery code unwrap the family key.
 *
 * @param code Recovery code
 * @param salt PBKDF2 salt (base64, same as keySalt on the family)
 * @returns CryptoKey suitable for wrapping/unwrapping
 */
export async function deriveRecoveryKEK(
  code: string,
  salt: string
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const normalized = normalizeCode(code);

  const passwordKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(`recovery:${normalized}`),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Decode base64 salt
  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100_000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
  );
}

/**
 * Wrap the family key with a recovery-code-derived KEK.
 *
 * @param familyKey The unwrapped family CryptoKey
 * @param code Recovery code
 * @param salt PBKDF2 salt (base64)
 * @returns JSON-stringified { wrappedKey, iv } (same format as WrappedKey)
 */
export async function wrapFamilyKeyWithRecoveryCode(
  familyKey: CryptoKey,
  code: string,
  salt: string
): Promise<string> {
  const kek = await deriveRecoveryKEK(code, salt);
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);

  const wrapped = await getSubtleCrypto().wrapKey("raw", familyKey, kek, {
    name: "AES-GCM",
    iv,
  });

  const toBase64 = (buf: ArrayBuffer | Uint8Array) => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  return JSON.stringify({
    wrappedKey: toBase64(wrapped),
    iv: toBase64(iv),
  });
}

/**
 * Unwrap the family key using a recovery code.
 *
 * @param wrappedKeyJson JSON string of { wrappedKey, iv } format
 * @param code Recovery code
 * @param salt PBKDF2 salt (base64)
 * @returns The unwrapped family CryptoKey
 */
export async function unwrapFamilyKeyWithRecoveryCode(
  wrappedKeyJson: string,
  code: string,
  salt: string
): Promise<CryptoKey> {
  const kek = await deriveRecoveryKEK(code, salt);
  const { wrappedKey, iv } = JSON.parse(wrappedKeyJson);

  const fromBase64 = (b64: string) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  return getSubtleCrypto().unwrapKey(
    "raw",
    fromBase64(wrappedKey),
    kek,
    { name: "AES-GCM", iv: fromBase64(iv) },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
