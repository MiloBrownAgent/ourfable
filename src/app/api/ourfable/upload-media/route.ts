import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { internalConvexMutation, internalConvexQuery } from "@/lib/convex-internal";

type MemberTokenRecord = {
  _id: string;
  familyId: string;
};

type PromptTokenRecord =
  | {
      familyId: string;
      memberId: string;
      status?: string;
    }
  | {
      prompt?: { status?: string };
      member?: { _id: string };
      family?: { familyId: string };
    };

async function validateToken(token: string): Promise<{ familyId: string; memberId: string } | null> {
  const member = await internalConvexQuery<MemberTokenRecord | null>(
    "ourfable:getMemberByInviteToken",
    { token }
  ).catch(() => null);
  if (member?._id && member.familyId) {
    return { familyId: member.familyId, memberId: member._id };
  }

  const promptData = await internalConvexQuery<PromptTokenRecord | null>(
    "ourfable:getPromptByToken",
    { token }
  ).catch(() => null);
  if (!promptData) return null;

  const flatFamilyId = "familyId" in promptData ? promptData.familyId : promptData.family?.familyId;
  const flatMemberId = "memberId" in promptData ? promptData.memberId : promptData.member?._id;
  const status = "status" in promptData ? promptData.status : promptData.prompt?.status;
  if (!flatFamilyId || !flatMemberId || status === "responded") return null;

  return { familyId: flatFamilyId, memberId: flatMemberId };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : undefined;

    if (token) {
      const tokenData = await validateToken(token);
      if (!tokenData) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
    } else {
      const sessionToken = req.cookies.get(COOKIE)?.value;
      const session = sessionToken ? await verifySession(sessionToken) : null;
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const uploadUrl = await internalConvexMutation<string>("ourfable:generateUploadUrl", {});
    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error("[upload-media]", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}

