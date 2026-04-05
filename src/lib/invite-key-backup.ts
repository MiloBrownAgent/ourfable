import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  if (!key) {
    const fallback = process.env.SESSION_SECRET;
    if (!fallback) throw new Error("TOTP_ENCRYPTION_KEY or SESSION_SECRET required");
    return crypto.createHash("sha256").update(`invite-key-backup:${fallback}`).digest();
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length < 32) {
    throw new Error("TOTP_ENCRYPTION_KEY must be at least 32 bytes (base64 encoded)");
  }
  return buf.subarray(0, 32);
}

export function encryptInviteKeyBackup(rawKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(rawKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${Buffer.concat([iv, encrypted, tag]).toString("base64")}`;
}

export function decryptInviteKeyBackup(stored: string): string {
  if (!stored.startsWith("enc:")) return stored;
  const key = getEncryptionKey();
  const packed = Buffer.from(stored.slice(4), "base64");
  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(packed.length - TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH, packed.length - TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
