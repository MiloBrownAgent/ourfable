/**
 * Convex Internal Function Client — for server-side API routes only
 * 
 * Calls internal Convex functions through the authenticated HTTP action gateway.
 * These functions are NOT accessible via the public Convex HTTP API.
 * 
 * SECURITY: Uses CONVEX_SERVER_SECRET for authentication. This secret
 * must NEVER be exposed to the client. Only use from server-side code.
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://rightful-eel-502.convex.cloud";
const CONVEX_SERVER_SECRET = process.env.CONVEX_SERVER_SECRET;

if (!CONVEX_SERVER_SECRET && process.env.NODE_ENV === "production") {
  console.error("[convex-internal] CONVEX_SERVER_SECRET is not set — internal function calls will fail");
}

/**
 * Call an internal Convex query function.
 * Server-side only — requires CONVEX_SERVER_SECRET.
 */
export async function internalConvexQuery<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/internal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-convex-server-secret": CONVEX_SERVER_SECRET ?? "",
    },
    body: JSON.stringify({ fn, args, type: "query" }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Internal Convex query ${fn} failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.value as T;
}

/**
 * Call an internal Convex mutation function.
 * Server-side only — requires CONVEX_SERVER_SECRET.
 */
export async function internalConvexMutation<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/internal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-convex-server-secret": CONVEX_SERVER_SECRET ?? "",
    },
    body: JSON.stringify({ fn, args, type: "mutation" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Internal Convex mutation ${fn} failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.value as T;
}
