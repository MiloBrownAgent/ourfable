// app/api/orders/route.ts
// Create orders + Stripe checkout sessions, list user's orders

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICES } from "@/lib/stripe";

// POST /api/orders — Create order + Stripe checkout
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId, format } = await req.json();

    if (!bookId || !["digital", "hardcover"].includes(format)) {
      return NextResponse.json(
        { error: "bookId and format (digital/hardcover) are required" },
        { status: 400 }
      );
    }

    // Verify book exists, belongs to user, and is ready
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .eq("status", "ready")
      .single();

    if (bookErr || !book) {
      return NextResponse.json(
        { error: "Book not found or not ready for purchase" },
        { status: 404 }
      );
    }

    const amount = format === "digital" ? PRICES.digital : PRICES.hardcover;

    // Create order record
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        book_id: bookId,
        format,
        amount_cents: amount,
        status: "pending",
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `${book.title || "Your Storybook"} — ${format === "digital" ? "Digital Edition" : "Hardcover Edition"}`,
              description: `A personalized storybook starring ${book.character_name}`,
              images: book.cover_image_url ? [book.cover_image_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order.id,
        bookId: book.id,
        userId: user.id,
        format,
      },
      ...(format === "hardcover" && {
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "GB", "AU"],
        },
      }),
      success_url: `${appUrl}/dashboard?order=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?order=cancelled`,
    });

    // Save Stripe session ID
    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({
      order,
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/orders — List user's orders
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, books(id, title, character_name, cover_image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
