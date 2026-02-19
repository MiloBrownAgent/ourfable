// app/api/generate-images/route.ts
// Generates illustrations for all pages of a book using Replicate + Ideogram Character
// Called after story text has been generated

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBookIllustrations } from "@/lib/replicate";

export const maxDuration = 300; // Allow up to 5 minutes for all images

const FALLBACK_CHARACTER_IMAGE_URL =
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=800&fit=crop";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId } = await req.json();
    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }

    // Fetch the book with its pages
    const { data: book, error: fetchError } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (!book.pages || !Array.isArray(book.pages) || book.pages.length === 0) {
      return NextResponse.json(
        { error: "Book has no pages. Generate the story first." },
        { status: 400 }
      );
    }

    const characterPhotoUrl =
      book.character_photo_url?.trim() || FALLBACK_CHARACTER_IMAGE_URL;

    type PageWithPrompt = { text?: string; imagePrompt?: string; image_prompt?: string };
    const pagesForReplicate = (book.pages as PageWithPrompt[]).map((p, i) => ({
      pageNumber: i + 1,
      text: p.text ?? "",
      illustrationPrompt: p.imagePrompt ?? p.image_prompt ?? "",
    }));

    const results = await generateBookIllustrations(
      pagesForReplicate,
      characterPhotoUrl
    );

    // Apply image URLs back to pages and save
    const updatedPages = [...(book.pages as any[])];
    for (const r of results) {
      if (r.imageUrl) {
        const idx = r.pageNumber - 1;
        if (idx >= 0 && idx < updatedPages.length) {
          updatedPages[idx] = {
            ...updatedPages[idx],
            imageUrl: r.imageUrl,
            image_url: r.imageUrl,
          };
        }
      }
    }
    await supabase
      .from("books")
      .update({ pages: updatedPages })
      .eq("id", bookId);

    // Set the first page's image as the cover
    const firstSuccessful = results.find((r) => r.imageUrl);
    if (firstSuccessful?.imageUrl) {
      await supabase
        .from("books")
        .update({ cover_image_url: firstSuccessful.imageUrl })
        .eq("id", bookId);
    }

    const failed = results.filter((r) => !r.imageUrl);
    const succeeded = results.filter((r) => r.imageUrl);

    if (failed.length === results.length) {
      return NextResponse.json(
        { error: "Illustrations failed to generate. Please try again." },
        { status: 502 }
      );
    }

    // Fetch the final book state
    const { data: updatedBook } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    return NextResponse.json({
      book: updatedBook,
      stats: {
        total: results.length,
        succeeded: succeeded.length,
        failed: failed.length,
      },
      ...(failed.length > 0 && {
        failedPages: failed.map((f) => ({
          page: f.pageNumber,
          error: "Failed to generate",
        })),
      }),
    });
  } catch (err) {
    console.error("POST /api/generate-images error:", err);
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
