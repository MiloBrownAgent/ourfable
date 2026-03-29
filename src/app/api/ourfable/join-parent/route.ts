import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { hashPassword } from "@/lib/accounts";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { token, name, email, password, encryptedFamilyKey, keySalt } = body as {
    token?: string;
    name?: string;
    email?: string;
    password?: string;
    encryptedFamilyKey?: string;
    keySalt?: string;
  };

  if (!token || !name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // Look up invite
  const invite = await internalConvexQuery<{
    familyId: string;
    email: string;
    status: string;
    expiresAt: number;
    invitedByName: string;
    encryptedFamilyKeyForInvite?: string;
    inviteKeySalt?: string;
  } | null>("ourfable:getParentInviteByToken", { token });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
  }

  if (Date.now() > invite.expiresAt) {
    return NextResponse.json({ error: "This invite has expired. Ask the other parent to send a new one." }, { status: 400 });
  }

  // Check email matches
  if (email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json({ error: "Email doesn't match the invite" }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await internalConvexQuery<{ _id: string } | null>(
    "ourfable:getOurFableUserByEmail", { email: email.toLowerCase() }
  );
  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
  }

  // Hash password and create user
  const passwordHash = hashPassword(password);
  const userId = await internalConvexMutation("ourfable:createOurFableUser", {
    email: email.toLowerCase(),
    passwordHash,
    familyId: invite.familyId,
    name: name.trim(),
    role: "parent" as const,
    encryptedFamilyKey,
    keySalt,
  });

  // Mark invite as accepted
  await internalConvexMutation("ourfable:acceptParentInvite", { token });

  // Create session for the new user
  const sessionToken = await createSession(invite.familyId, {
    userId: String(userId),
    email: email.toLowerCase(),
    name: name.trim(),
  });

  const res = NextResponse.json({
    success: true,
    familyId: invite.familyId,
    userId: String(userId),
  });

  res.cookies.set(COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return res;
}

// GET — look up invite details for the join page
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const invite = await internalConvexQuery<{
    familyId: string;
    email: string;
    status: string;
    expiresAt: number;
    invitedByName: string;
    encryptedFamilyKeyForInvite?: string;
    inviteKeySalt?: string;
  } | null>("ourfable:getParentInviteByToken", { token });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Invite already used" }, { status: 400 });
  }

  if (Date.now() > invite.expiresAt) {
    return NextResponse.json({ error: "Invite expired" }, { status: 400 });
  }

  // Get family info
  const family = await internalConvexQuery<{
    childName: string;
    parentNames?: string;
  } | null>("ourfable:getOurFableFamilyById", { familyId: invite.familyId });

  return NextResponse.json({
    email: invite.email,
    invitedByName: invite.invitedByName,
    childName: family?.childName ?? "",
    familyId: invite.familyId,
    hasEncryptedKey: !!invite.encryptedFamilyKeyForInvite,
  });
}
