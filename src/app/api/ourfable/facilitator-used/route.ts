import { NextRequest, NextResponse } from "next/server";
import { CONVEX_URL } from "@/lib/convex";


export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({
      path: "ourfable:markOurFableFacilitatorTokenUsed",
      args: { token },
      format: "json",
    }),
  });

  return NextResponse.json({ ok: true });
}
