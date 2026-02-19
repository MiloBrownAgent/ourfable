// app/api/books/route.ts
// Create and list storybooks

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper to get authenticated user from Supabase session
async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// GET /api/books — List the user's books
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: books, error } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ books });
  } catch (err) {
    console.error("GET /api/books error:", err);
    const message =
      err instanceof Error ? err.message : (err && typeof (err as { message?: string }).message === "string" ? (err as { message: string }).message : "Internal server error");
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/books — Create a new book (DRAFT)
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      characterName,
      characterAge,
      photoUrl,
      storyPrompt,
      inclusions = [],
      artStyle = "watercolor",
    } = body;

    // Basic validation
    if (!characterName || !storyPrompt || !photoUrl) {
      return NextResponse.json(
        { error: "characterName, storyPrompt, and photoUrl are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: book, error } = await supabase
      .from("books")
      .insert({
        user_id: user.id,
        character_name: characterName,
        character_age: characterAge || null,
        character_photo_url: photoUrl,
        story_prompt: storyPrompt,
        included_elements: inclusions,
        art_style: artStyle,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ book }, { status: 201 });
  } catch (err) {
    console.error("POST /api/books error:", err);
    const message =
      err instanceof Error ? err.message : (err && typeof (err as { message?: string }).message === "string" ? (err as { message: string }).message : "Internal server error");
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "Internal server error" },
      { status: 500 }
    );
  }
}
