/**
 * OurFable Vault Encryption — AES-256-GCM client-side encryption
 *
 * All crypto uses Web Crypto API (SubtleCrypto) — no external libraries.
 * Works in both browser and Node.js (via crypto.subtle).
 *
 * Architecture:
 *  - Each family gets a random AES-256-GCM key (the "family key")
 *  - The family key is wrapped (encrypted) with a KEK derived from the user's password via PBKDF2
 *  - Vault content is encrypted client-side with the family key before being sent to the server
 *  - The server NEVER sees plaintext vault content
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "undefined") return globalThis.crypto.subtle;
  throw new Error("SubtleCrypto not available in this environment");
}

function getRandomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  globalThis.crypto.getRandomValues(buf);
  return buf;
}

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Key Generation ───────────────────────────────────────────────────────────

/**
 * Generate a random AES-256-GCM family key (32 bytes).
 * Returns the raw key as a CryptoKey.
 */
export async function generateFamilyKey(): Promise<CryptoKey> {
  return getSubtleCrypto().generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable — needed for wrapping
    ["encrypt", "decrypt"]
  );
}

/**
 * Export a CryptoKey to base64 for transport/storage.
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await getSubtleCrypto().exportKey("raw", key);
  return toBase64(raw);
}

/**
 * Import a base64-encoded raw key into a CryptoKey.
 */
export async function importKey(b64Key: string): Promise<CryptoKey> {
  const raw = fromBase64(b64Key);
  return getSubtleCrypto().importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Derive a Key Encryption Key (KEK) from the user's password using PBKDF2.
 * @param password - User's plaintext password
 * @param salt - Random salt (base64 encoded)
 * @returns CryptoKey suitable for wrapping/unwrapping
 */
export async function deriveKeyEncryptionKey(
  password: string,
  salt: string
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const passwordKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(salt),
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
 * Generate a random PBKDF2 salt (16 bytes), returned as base64.
 */
export function generateSalt(): string {
  return toBase64(getRandomBytes(16));
}

// ── Key Wrapping ─────────────────────────────────────────────────────────────

export interface WrappedKey {
  wrappedKey: string; // base64
  iv: string; // base64
}

/**
 * Wrap (encrypt) the family key with the KEK using AES-GCM.
 */
export async function wrapFamilyKey(
  familyKey: CryptoKey,
  kek: CryptoKey
): Promise<WrappedKey> {
  const iv = getRandomBytes(12);
  const wrapped = await getSubtleCrypto().wrapKey("raw", familyKey, kek, {
    name: "AES-GCM",
    iv,
  });
  return {
    wrappedKey: toBase64(wrapped),
    iv: toBase64(iv),
  };
}

/**
 * Unwrap (decrypt) the family key with the KEK.
 */
export async function unwrapFamilyKey(
  wrapped: WrappedKey,
  kek: CryptoKey
): Promise<CryptoKey> {
  return getSubtleCrypto().unwrapKey(
    "raw",
    fromBase64(wrapped.wrappedKey),
    kek,
    { name: "AES-GCM", iv: fromBase64(wrapped.iv) },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// ── Content Encryption ───────────────────────────────────────────────────────

export interface EncryptedText {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64 (included in ciphertext for AES-GCM, but we store it explicitly for verification)
}

/**
 * Encrypt plaintext with the family key using AES-256-GCM.
 * AES-GCM appends the auth tag to the ciphertext, so we split it out.
 */
export async function encryptText(
  plaintext: string,
  familyKey: CryptoKey
): Promise<EncryptedText> {
  const iv = getRandomBytes(12);
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await getSubtleCrypto().encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    familyKey,
    encoded
  );

  // AES-GCM output = ciphertext + 16-byte auth tag
  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

  return {
    ciphertext: toBase64(ciphertextBytes),
    iv: toBase64(iv),
    tag: toBase64(tagBytes),
  };
}

/**
 * Decrypt ciphertext back to plaintext.
 */
export async function decryptText(
  encrypted: EncryptedText,
  familyKey: CryptoKey
): Promise<string> {
  // Reconstruct: ciphertext + tag
  const ciphertextBytes = fromBase64(encrypted.ciphertext);
  const tagBytes = fromBase64(encrypted.tag);
  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combined.set(ciphertextBytes, 0);
  combined.set(tagBytes, ciphertextBytes.length);

  const decrypted = await getSubtleCrypto().decrypt(
    { name: "AES-GCM", iv: fromBase64(encrypted.iv), tagLength: 128 },
    familyKey,
    combined
  );

  return new TextDecoder().decode(decrypted);
}

// ── Blob Encryption ──────────────────────────────────────────────────────────

export interface EncryptedBlob {
  data: ArrayBuffer; // encrypted bytes
  iv: string; // base64
  tag: string; // base64
}

/**
 * Encrypt a Blob (file/media) with the family key.
 */
export async function encryptBlob(
  blob: Blob,
  familyKey: CryptoKey
): Promise<EncryptedBlob> {
  const iv = getRandomBytes(12);
  const arrayBuffer = await blob.arrayBuffer();

  const encrypted = await getSubtleCrypto().encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    familyKey,
    arrayBuffer
  );

  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

  return {
    data: ciphertextBytes.buffer,
    iv: toBase64(iv),
    tag: toBase64(tagBytes),
  };
}

/**
 * Decrypt encrypted data back to a Blob.
 */
export async function decryptBlob(
  encryptedData: EncryptedBlob,
  familyKey: CryptoKey,
  mimeType: string = "application/octet-stream"
): Promise<Blob> {
  const ciphertextBytes = new Uint8Array(encryptedData.data);
  const tagBytes = fromBase64(encryptedData.tag);
  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combined.set(ciphertextBytes, 0);
  combined.set(tagBytes, ciphertextBytes.length);

  const decrypted = await getSubtleCrypto().decrypt(
    { name: "AES-GCM", iv: fromBase64(encryptedData.iv), tagLength: 128 },
    familyKey,
    combined
  );

  return new Blob([decrypted], { type: mimeType });
}

// ── Content Hashing ──────────────────────────────────────────────────────────

/**
 * SHA-256 hash for integrity verification. Returns hex string.
 */
export async function hashContent(content: string): Promise<string> {
  const encoded = new TextEncoder().encode(content);
  const hashBuffer = await getSubtleCrypto().digest("SHA-256", encoded);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * SHA-256 hash of an ArrayBuffer/Blob for media integrity.
 */
export async function hashBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await getSubtleCrypto().digest("SHA-256", arrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Invite Key Derivation ────────────────────────────────────────────────────

/**
 * Derive an encryption key from an invite token (for circle members).
 * The invite token contains entropy from the URL fragment (after #).
 * This lets circle members encrypt content without having the family key directly.
 */
export async function deriveInviteKey(inviteToken: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const tokenKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(inviteToken),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Use a fixed salt for invite keys (token itself provides entropy)
  const salt = new TextEncoder().encode("ourfable-invite-v1");

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 50_000,
      hash: "SHA-256",
    },
    tokenKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// ── Serialization Helpers ────────────────────────────────────────────────────

/**
 * Serialize EncryptedText to a single JSON string for storage in Convex.
 */
export function serializeEncryptedText(encrypted: EncryptedText): string {
  return JSON.stringify(encrypted);
}

/**
 * Deserialize a stored encrypted text string.
 */
export function deserializeEncryptedText(stored: string): EncryptedText {
  return JSON.parse(stored);
}
