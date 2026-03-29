/**
 * Convex HTTP Action Gateway — authenticated server-to-server API
 * 
 * Internal functions (internalQuery/internalMutation) are not accessible via
 * the public Convex HTTP API. This file exposes them through httpAction endpoints
 * that require a CONVEX_SERVER_SECRET for authentication.
 *
 * SECURITY: This is the ONLY way server-side Next.js API routes can call
 * internal Convex functions. The server secret prevents unauthenticated access.
 */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// ── Helper: validate server secret ──────────────────────────────────────────

async function validateSecret(req: Request): Promise<boolean> {
  const secret = req.headers.get("x-convex-server-secret");
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || !secret) return false;
  // Constant-time comparison
  if (secret.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < secret.length; i++) {
    mismatch |= secret.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ value: data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Generic internal function dispatcher ────────────────────────────────────
// POST /api/internal
// Body: { "fn": "ourfable:functionName", "args": {...}, "type": "query"|"mutation" }

http.route({
  path: "/api/internal",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!(await validateSecret(req))) return unauthorized();

    let body: { fn?: string; args?: Record<string, unknown>; type?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { fn, args = {}, type = "query" } = body;
    if (!fn || typeof fn !== "string") {
      return new Response(JSON.stringify({ error: "Missing fn" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse module:function format
    const [moduleName, funcName] = fn.split(":");
    if (!moduleName || !funcName) {
      return new Response(JSON.stringify({ error: "Invalid fn format, use module:function" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Use the internal API to look up and call the function
      // We need to map function names to their internal references
      const internalModule = (internal as Record<string, Record<string, unknown>>)[moduleName];
      if (!internalModule) {
        return new Response(JSON.stringify({ error: `Unknown module: ${moduleName}` }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const funcRef = internalModule[funcName];
      if (!funcRef) {
        return new Response(JSON.stringify({ error: `Unknown function: ${funcName}` }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      let result: unknown;
      if (type === "mutation") {
        result = await ctx.runMutation(funcRef as any, args);
      } else {
        result = await ctx.runQuery(funcRef as any, args);
      }

      return jsonResponse(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
