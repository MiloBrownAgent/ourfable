// app/api/webhooks/stripe/route.ts
// Handles Stripe payment events (checkout completed, refunds)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendOrderConfirmation } from "@/lib/email";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  const stripe = getStripe();

  // Use service role — webhooks have no user session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Payment succeeded ──────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { orderId, format } = session.metadata || {};

        if (!orderId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        // Update order to PAID
        await supabase
          .from("orders")
          .update({
            status: "paid",
            stripe_payment_intent_id: paymentIntentId,
            // Save shipping if hardcover
            ...(session.shipping_details && {
              shipping_address: session.shipping_details.address,
            }),
          })
          .eq("id", orderId);

        if (format === "digital") {
          // Digital: mark as delivered immediately
          // TODO: Generate a signed download URL for the book PDF
          await supabase
            .from("orders")
            .update({ status: "delivered" })
            .eq("id", orderId);
        } else if (format === "hardcover") {
          // Hardcover: send to print-on-demand partner
          // TODO: Call Lulu/Blurb API to submit print job
          await supabase
            .from("orders")
            .update({ status: "processing" })
            .eq("id", orderId);
        }

        // ── Send order confirmation email ───────────────────
        try {
          // Fetch order + book details for email
          const { data: orderData } = await supabase
            .from("orders")
            .select("id, amount_cents, book_id, books(id, title, character_name, user_id)")
            .eq("id", orderId)
            .single();

          const customerEmail = session.customer_details?.email;

          if (orderData && customerEmail) {
            // Supabase returns the joined relation as an object (single) or array
            const booksRaw = orderData.books as unknown;
            const book = (Array.isArray(booksRaw) ? booksRaw[0] : booksRaw) as {
              id: string;
              title: string;
              character_name: string;
              user_id: string;
            } | null;

            // Try to get customer name from Stripe session
            const customerName = session.customer_details?.name ?? undefined;

            await sendOrderConfirmation({
              email: customerEmail,
              customerName: customerName || undefined,
              bookTitle: book?.title || "Your Storybook",
              characterName: book?.character_name || "your little one",
              format: (format === "hardcover" ? "hardcover" : "digital") as "digital" | "hardcover",
              amountCents: orderData.amount_cents,
              orderId: orderData.id,
              bookId: book?.id || orderData.book_id,
            });

            console.log(`[Webhook] Order confirmation sent to ${customerEmail} for order ${orderId}`);
          } else {
            console.warn(`[Webhook] Could not send order confirmation — orderData: ${!!orderData}, email: ${customerEmail}`);
          }
        } catch (emailErr) {
          // Don't fail the webhook if email fails — order is already updated
          console.error("[Webhook] Order confirmation email failed:", emailErr);
        }

        break;
      }

      // ── Refund processed ───────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (paymentIntentId) {
          await supabase
            .from("orders")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", paymentIntentId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
