import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { convexQuery, convexMutation } from "@/lib/convex";
import { encryptInviteKeyBackup } from "@/lib/invite-key-backup";

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(COOKIE)?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;
  if (!session?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  const rawKey = typeof body.rawKey === "string" ? body.rawKey : "";
  if (!memberId || !rawKey) {
    return NextResponse.json({ error: "Missing memberId/rawKey" }, { status: 400 });
  }

  const circle = await convexQuery<Array<{ _id: string }>>("ourfable:listCircle", { familyId: session.familyId }).catch(() => []);
  if (!circle.some((member) => member._id === memberId)) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const serverEncryptedInviteKey = encryptInviteKeyBackup(rawKey);
  await convexMutation("ourfable:setMemberInviteKey", {
    memberId,
    encryptedInviteKey: body.encryptedInviteKey,
    serverEncryptedInviteKey,
  });

  return NextResponse.json({ success: true });
}
