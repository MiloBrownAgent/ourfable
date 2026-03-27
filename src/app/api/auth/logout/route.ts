import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "https://ourfable.ai"));
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET() {
  const res = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "https://ourfable.ai"));
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
