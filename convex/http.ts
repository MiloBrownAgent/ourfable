import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

// Store the server secret in a Convex query that reads from env
// This works because internalQuery CAN access process.env
http.route({
  path: "/internal",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Get the expected secret via an internal query that CAN read process.env
    const expected = await ctx.runQuery(internal.ourfable.getServerSecret, {}) as string | null;
    const secret = req.headers.get("x-convex-server-secret");

    if (!expected || !secret || expected.length !== secret.length) {
      return unauthorized();
    }

    // Constant-time comparison
    let mismatch = 0;
    for (let i = 0; i < secret.length; i++) {
      mismatch |= secret.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (mismatch !== 0) return unauthorized();

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

    const [moduleName, funcName] = fn.split(":");
    if (!moduleName || !funcName) {
      return new Response(JSON.stringify({ error: "Invalid fn format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const internalModule = (internal as Record<string, Record<string, unknown>>)[moduleName];
      if (!internalModule) {
        return new Response(JSON.stringify({ error: "Unknown module: " + moduleName }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const funcRef = internalModule[funcName];
      if (!funcRef) {
        return new Response(JSON.stringify({ error: "Unknown function: " + funcName }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      let result: unknown;
      if (type === "mutation") {
        result = await ctx.runMutation(funcRef as any, args);
      } else if (type === "action") {
        result = await ctx.runAction(funcRef as any, args);
      } else {
        result = await ctx.runQuery(funcRef as any, args);
      }

      return new Response(JSON.stringify({ value: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
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
