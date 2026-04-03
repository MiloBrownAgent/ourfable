import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { internalConvexMutation, internalConvexQuery } from "@/lib/convex-internal";
import { checkStorageWarnings } from "@/lib/storage-warnings";

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
  const wrappedPrompt = "prompt" in promptData ? promptData.prompt : undefined;
  const status = "status" in promptData ? promptData.status : wrappedPrompt?.status;
  if (!flatFamilyId || !flatMemberId || status === "responded") return null;

  return { familyId: flatFamilyId, memberId: flatMemberId };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : undefined;
    const fileSize = typeof body.fileSize === "number" && Number.isFinite(body.fileSize) ? body.fileSize : 0;

    if (fileSize <= 0) {
      return NextResponse.json({ error: "fileSize is required" }, { status: 400 });
    }

    const maxUploadBytes = 2 * 1024 * 1024 * 1024;
    if (fileSize > maxUploadBytes) {
      return NextResponse.json({ error: "File too large. Max size is 2GB" }, { status: 413 });
    }

    let familyId: string | null = null;
    if (token) {
      const tokenData = await validateToken(token);
      if (!tokenData) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
      familyId = tokenData.familyId;
    } else {
      const sessionToken = req.cookies.get(COOKIE)?.value;
      const session = sessionToken ? await verifySession(sessionToken) : null;
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      familyId = session.familyId;
    }

    if (!familyId) {
      return NextResponse.json({ error: "Missing family context" }, { status: 400 });
    }

    const storage = await internalConvexQuery("ourfable:getOurFableStorageUsage", { familyId }) as {
      used: number;
      limit: number;
      planType?: string;
    } | null;

    if (storage && storage.used + fileSize > storage.limit) {
      const limitGB = Math.round(storage.limit / (1024 * 1024 * 1024));
      const isStandard = storage.planType !== "plus";
      return NextResponse.json(
        {
          error: `Storage limit reached (${limitGB}GB).${isStandard ? " Upgrade to Our Fable+ for 25GB of storage." : " Contact support for additional storage."}`,
        },
        { status: 413 },
      );
    }

    const storageCheck = await checkStorageWarnings(familyId, fileSize);
    if (storageCheck.blocked) {
      return NextResponse.json(
        { error: storageCheck.message ?? "Storage limit reached. Upgrade for more space." },
        { status: 413 },
      );
    }

    const uploadUrl = await internalConvexMutation<string>("ourfable:generateUploadUrl", {});

    internalConvexMutation("ourfable:incrementOurFableStorage", { familyId, bytes: fileSize }).catch((error) => {
      console.warn("[upload-media] Failed to increment storage (non-fatal):", error);
    });

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error("[upload-media]", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
