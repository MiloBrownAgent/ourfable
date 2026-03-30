import crypto from "node:crypto";

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? process.env.SESSION_SECRET ?? "";

function getSecret(): string {
  if (!SECRET) {
    throw new Error("UNSUBSCRIBE_SECRET or SESSION_SECRET is required");
  }
  return SECRET;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function createUnsubscribeToken(email: string): string {
  const normalized = normalizeEmail(email);
  const payload = Buffer.from(normalized).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(normalized).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const email = Buffer.from(payload, "base64url").toString("utf8");
    const normalized = normalizeEmail(email);
    const expected = crypto.createHmac("sha256", getSecret()).update(normalized).digest("base64url");
    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);
    if (expectedBuf.length !== signatureBuf.length) return null;
    if (!crypto.timingSafeEqual(expectedBuf, signatureBuf)) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(email: string): string {
  return `https://ourfable.ai/unsubscribe?token=${createUnsubscribeToken(email)}`;
}

export function buildUnsubscribeApiUrl(email: string): string {
  return `https://ourfable.ai/api/ourfable/unsubscribe?token=${createUnsubscribeToken(email)}`;
}

export function buildUnsubscribeHeaders(email: string): Record<string, string> {
  const url = buildUnsubscribeApiUrl(email);
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
