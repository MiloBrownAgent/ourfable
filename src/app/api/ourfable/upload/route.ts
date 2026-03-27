import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifySession, COOKIE } from "@/lib/auth";
import { checkStorageWarnings } from "@/lib/storage-warnings";
import { CONVEX_URL } from "@/lib/convex";


async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function convexMutation(path: string, args: Record<string, unknown>) {
  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
}

// ── R2 client configuration ────────────────────────────────────────────────────
// All credentials are placeholders — Dave fills these in via Vercel env vars.

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "your-cloudflare-account-id";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "placeholder";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "placeholder";
const R2_BUCKET = process.env.R2_BUCKET ?? "ourfable-media";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://media.ourfable.ai";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ── File type + size policy ────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "application/pdf",
]);

const MAX_SIZES: Record<string, number> = {
  image: 50 * 1024 * 1024,      // 50 MB — covers iPhone RAW/HEIC
  video: 2 * 1024 * 1024 * 1024, // 2 GB — 4K iPhone video
  audio: 50 * 1024 * 1024,      // 50 MB — generous for voice memos
  application: 20 * 1024 * 1024, // 20 MB (PDFs)
};

function getMediaType(fileType: string): "photo" | "video" | "voice" | "document" {
  if (fileType.startsWith("image/")) return "photo";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.startsWith("audio/")) return "voice";
  return "document";
}

function getMaxSize(fileType: string): number {
  const category = fileType.split("/")[0];
  return MAX_SIZES[category] ?? 20 * 1024 * 1024;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

// ── POST /api/ourfable/upload ────────────────────────────────────────────────────
// Body: { fileName, fileType, fileSize, familyId, contributionType? }
// Returns: { uploadUrl, r2Key, r2Url, mediaType }

export async function POST(req: NextRequest) {
  // Auth check
  const sessionToken = req.cookies.get(COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  let body: { fileName?: string; fileType?: string; fileSize?: number; familyId?: string; contributionType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { fileName, fileType, fileSize, familyId, contributionType } = body;

  // Validate required fields
  if (!fileName || !fileType || !familyId) {
    return NextResponse.json({ error: "fileName, fileType, and familyId are required" }, { status: 400 });
  }

  // Ensure requester can only upload to their own family
  if (familyId !== session.familyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.has(fileType)) {
    return NextResponse.json(
      { error: `File type not allowed: ${fileType}` },
      { status: 415 }
    );
  }

  // Validate file size if provided
  if (fileSize !== undefined) {
    const maxSize = getMaxSize(fileType);
    if (fileSize > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        { error: `File too large. Max size for this type is ${maxMB}MB` },
        { status: 413 }
      );
    }

    // Check storage limit
    const storage = await convexQuery("ourfable:getOurFableStorageUsage", { familyId }) as {
      used: number; limit: number; planType: string;
    } | null;

    if (storage && (storage.used + fileSize) > storage.limit) {
      const limitGB = Math.round(storage.limit / (1024 * 1024 * 1024));
      const isStandard = storage.planType !== "plus";
      return NextResponse.json(
        {
          error: `Storage limit reached (${limitGB}GB).${isStandard ? " Upgrade to Our Fable+ for 25GB of storage." : " Contact support for additional storage."}`,
        },
        { status: 413 }
      );
    }
  }

  // Check storage warnings and block if at capacity
  const storageCheck = await checkStorageWarnings(familyId, fileSize ?? 0);
  if (storageCheck.blocked) {
    return NextResponse.json(
      { error: storageCheck.message ?? "Storage limit reached. Upgrade for more space." },
      { status: 413 }
    );
  }

  // Build R2 key: familyId/mediaType/timestamp-sanitizedName
  const mediaType = getMediaType(fileType);
  const sanitized = sanitizeFileName(fileName);
  const timestamp = Date.now();
  const r2Key = `${familyId}/${mediaType}/${timestamp}-${sanitized}`;
  const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      ContentType: fileType,
      // Optional: tag with metadata for S3-compatible filtering
      Metadata: {
        familyId,
        mediaType,
        contributionType: contributionType ?? "direct",
        uploadedAt: String(timestamp),
      },
    });

    // Presigned URL valid for 15 minutes
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

    // Track storage usage
    if (fileSize) {
      convexMutation("ourfable:incrementOurFableStorage", { familyId, bytes: fileSize }).catch((err) => {
        console.warn("[ourfable/upload] Failed to increment storage (non-fatal):", err);
      });
    }

    return NextResponse.json({
      uploadUrl,
      r2Key,
      r2Url,
      mediaType,
    });
  } catch (err) {
    console.error("[ourfable/upload] Failed to create presigned URL:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
