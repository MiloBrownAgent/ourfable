import { NextRequest, NextResponse } from "next/server";
import { internalConvexMutation, internalConvexQuery } from "@/lib/convex-internal";

type SubmitEntryBody = {
  token?: string;
  type?: string;
  subject?: string;
  body?: string;
  encryptedBody?: string;
  contentHash?: string;
  encryptionVersion?: number;
  mediaStorageId?: string;
  mediaMimeType?: string;
  mediaEncryptionIv?: string;
  mediaEncryptionTag?: string;
  mediaEncryptionVersion?: number;
  openOn?: string;
  unlocksAtAge?: number;
  unlocksAtEvent?: string;
  contentType?: string;
};

type InviteMemberRecord = {
  _id: string;
  familyId: string;
};

type PromptTokenResult =
  | {
      familyId: string;
      memberId: string;
      childId?: string;
      promptText?: string;
      promptCategory?: string;
      promptUnlocksAtAge?: number;
      promptUnlocksAtEvent?: string;
      status?: string;
    }
  | {
      prompt?: {
        promptText?: string;
        promptCategory?: string;
        promptUnlocksAtAge?: number;
        promptUnlocksAtEvent?: string;
        status?: string;
      };
      member?: { _id: string };
      family?: { familyId: string };
      childId?: string;
    };

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as SubmitEntryBody;
    const token = pickString(body.token);
    const type = pickString(body.type);
    if (!token || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (pickString(body.body) || pickString(body.subject)) {
      return NextResponse.json({ error: "Plaintext vault content is not permitted" }, { status: 400 });
    }

    const inviteMember = await internalConvexQuery<InviteMemberRecord | null>(
      "ourfable:getMemberByInviteToken",
      { token }
    ).catch(() => null);

    if (inviteMember?._id && inviteMember.familyId) {
      const mutationArgs: Record<string, unknown> = {
        familyId: inviteMember.familyId,
        memberId: inviteMember._id,
        type,
        encryptedBody: pickString(body.encryptedBody),
        contentHash: pickString(body.contentHash),
        encryptionVersion: body.encryptionVersion,
        mediaStorageId: pickString(body.mediaStorageId),
        mediaMimeType: pickString(body.mediaMimeType),
        mediaEncryptionIv: pickString(body.mediaEncryptionIv),
        mediaEncryptionTag: pickString(body.mediaEncryptionTag),
        mediaEncryptionVersion: body.mediaEncryptionVersion,
        openOn: pickString(body.openOn),
        contentType: pickString(body.contentType),
      };
      const entryId = await internalConvexMutation<string>("ourfable:submitContribution", mutationArgs);
      return NextResponse.json({ entryId });
    }

    const promptData = await internalConvexQuery<PromptTokenResult | null>(
      "ourfable:getPromptByToken",
      { token }
    ).catch(() => null);
    if (!promptData) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const wrappedPrompt = "prompt" in promptData ? promptData.prompt : undefined;
    const familyId = "familyId" in promptData ? promptData.familyId : promptData.family?.familyId;
    const memberId = "memberId" in promptData ? promptData.memberId : promptData.member?._id;
    const childId = promptData.childId;
    const status = "status" in promptData ? promptData.status : wrappedPrompt?.status;
    const unlocksAtAge = body.unlocksAtAge ?? ("promptUnlocksAtAge" in promptData ? promptData.promptUnlocksAtAge : wrappedPrompt?.promptUnlocksAtAge);
    const unlocksAtEvent = body.unlocksAtEvent ?? ("promptUnlocksAtEvent" in promptData ? promptData.promptUnlocksAtEvent : wrappedPrompt?.promptUnlocksAtEvent);
    const promptText = "promptText" in promptData ? promptData.promptText : wrappedPrompt?.promptText;
    const promptCategory = "promptCategory" in promptData ? promptData.promptCategory : wrappedPrompt?.promptCategory;

    if (!familyId || !memberId || status === "responded") {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const entryId = await internalConvexMutation<string>("ourfable:submitVaultEntry", {
      familyId,
      memberId,
      childId,
      type,
      encryptedBody: pickString(body.encryptedBody),
      contentHash: pickString(body.contentHash),
      encryptionVersion: body.encryptionVersion,
      mediaStorageId: pickString(body.mediaStorageId),
      mediaMimeType: pickString(body.mediaMimeType),
      mediaEncryptionIv: pickString(body.mediaEncryptionIv),
      mediaEncryptionTag: pickString(body.mediaEncryptionTag),
      mediaEncryptionVersion: body.mediaEncryptionVersion,
      submissionToken: token,
      unlocksAtAge,
      unlocksAtEvent,
      prompt: promptText ?? promptCategory,
    });
    return NextResponse.json({ entryId });
  } catch (error) {
    console.error("[submit-entry]", error);
    return NextResponse.json({ error: "Failed to submit entry" }, { status: 500 });
  }
}
