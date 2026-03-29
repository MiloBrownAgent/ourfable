/**
 * Convex Internal Function Client
 * 
 * Calls internal Convex functions through the authenticated HTTP action gateway.
 * The gateway is hosted at the Convex site URL (.convex.site).
 */

const CONVEX_CLOUD_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://rightful-eel-502.convex.cloud";
const CONVEX_SITE_URL = CONVEX_CLOUD_URL.replace(".convex.cloud", ".convex.site");
const CONVEX_SERVER_SECRET = process.env.CONVEX_SERVER_SECRET;

export async function internalConvexQuery<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${CONVEX_SITE_URL}/internal`, {
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
    throw new Error(`Convex query ${fn} failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.value as T;
}

export async function internalConvexMutation<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${CONVEX_SITE_URL}/internal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-convex-server-secret": CONVEX_SERVER_SECRET ?? "",
    },
    body: JSON.stringify({ fn, args, type: "mutation" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex mutation ${fn} failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.value as T;
}
