import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

// Supabase Auth Webhook
// Configure in Supabase Dashboard → Auth → Hooks → Send webhook on user signup
// URL: https://your-domain.com/api/webhooks/auth
// Events: user.created

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const eventType =
      payload.type || payload.event || payload.event_type;

    if (eventType === "user.created" || eventType === "signup") {
      const user = payload.record || payload.user || payload;
      const email = user.email;
      const name =
        user.raw_user_meta_data?.full_name ||
        user.user_metadata?.full_name ||
        user.raw_user_meta_data?.name ||
        user.user_metadata?.name;

      if (email) {
        sendWelcomeEmail(email, name);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Auth webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
