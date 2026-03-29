import { NextRequest, NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  await convexMutation("ourfable:markOurFableFacilitatorTokenUsed", { token });

  return NextResponse.json({ ok: true });
}
