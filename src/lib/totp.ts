/**
 * OurFable TOTP (Time-based One-Time Password) — RFC 6238 compliant
 *
 * Uses Web Crypto API only (SubtleCrypto). No external libraries.
 * Generates 6-digit codes with 30-second windows.
 */

// ── Base32 encoding/decoding ─────────────────────────────────────────────────

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/[=\s]/g, "").toUpperCase();
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) throw new Error(`Invalid base32 character: ${cleaned[i]}`);
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

// ── HMAC-SHA1 ────────────────────────────────────────────────────────────────

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, message);
  return new Uint8Array(sig);
}

// ── TOTP Generation ──────────────────────────────────────────────────────────

/**
 * Generate a random TOTP secret (20 bytes = 160 bits, base32 encoded).
 */
export function generateTOTPSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Generate an otpauth:// URI for QR code generation.
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = "Our Fable"
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate a TOTP code for the current time (or a given timestamp).
 */
export async function generateTOTP(
  secret: string,
  timestamp?: number
): Promise<string> {
  const time = timestamp ?? Date.now();
  const counter = Math.floor(time / 1000 / 30);

  // Convert counter to 8-byte big-endian buffer
  const counterBuf = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuf[i] = c & 0xff;
    c = Math.floor(c / 256);
  }

  const key = base32Decode(secret);
  const hmac = await hmacSha1(key, counterBuf);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, "0");
}

/**
 * Verify a TOTP code. Checks current window ±1 (90-second tolerance).
 */
export async function verifyTOTP(
  token: string,
  secret: string,
  timestamp?: number
): Promise<boolean> {
  const time = timestamp ?? Date.now();
  const cleanToken = token.replace(/\s/g, "");

  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  // Check current time slot and ±1 (allows for clock drift)
  for (const offset of [0, -30_000, 30_000]) {
    const expected = await generateTOTP(secret, time + offset);
    if (timingSafeEqual(cleanToken, expected)) {
      return true;
    }
  }

  return false;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
