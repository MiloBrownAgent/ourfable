import { NextRequest, NextResponse } from "next/server";

// Deprecated route.
// Gift purchases now go through the secure Stripe checkout flow and the live
// confirmation emails are sent from src/app/api/stripe/webhook/route.ts.
// This endpoint is intentionally kept as a hard 410 so old links fail clearly.

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: "Deprecated route. Gifts must be purchased through the secure Stripe checkout flow.",
    },
    { status: 410 },
  );
}
