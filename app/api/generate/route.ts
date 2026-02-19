// app/api/generate/route.ts
// Triggers AI story generation via Replicate LLM + illustration generation
// Generates page text + image prompts for each page

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStory } from "@/lib/story-gen";
import { generateBookIllustrations } from "@/lib/replicate";

export const maxDuration = 300; // Allow up to 5 minutes for story + images

// Fallback when book has no character photo
const FALLBACK_CHARACTER_IMAGE_URL =
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=800&fit=crop";

// Map art style slugs to descriptive image prompts
const ART_STYLE_PROMPTS: Record<string, string> = {
  watercolor:
    "soft watercolor illustration, gentle washes of color, hand-painted storybook feel, warm and inviting",
  whimsical:
    "whimsical cartoon illustration, playful exaggerated features, bright cheerful colors, fun and bouncy",
  soft_pastel:
    "soft pastel illustration, dreamy gentle palette, cotton candy colors, soothing and warm",
  bold_pop:
    "bold colorful pop art illustration, vibrant saturated colors, graphic and punchy, modern picture book",
  fantasy:
    "fantasy illustration, magical ethereal atmosphere, glowing light effects, enchanted and dreamy",
  classic:
    "classic children's book illustration, timeless warm style, detailed and cozy, like Beatrix Potter",
};

// POST /api/generate — Generate story for a book
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

    // Fetch the book
    const { data: book, error: fetchError } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.status === "generating") {
      return NextResponse.json(
        { error: "Book is already being generated" },
        { status: 409 }
      );
    }

    // Mark as generating
    await supabase
      .from("books")
      .update({ status: "generating" })
      .eq("id", bookId);

    try {
      // ── Generate story via Replicate LLM ──────────────────────────
      const artStyleDesc = ART_STYLE_PROMPTS[book.art_style] || ART_STYLE_PROMPTS.watercolor;
      const inclusions = (book.included_elements || []) as string[];

      const prompt = `You are a beloved children's book author creating a personalized storybook.

CHARACTER:
- Name: ${book.character_name}
- Age: ${book.character_age || "young child"}

STORY REQUEST FROM THE PARENT:
"${book.story_prompt}"

ELEMENTS TO INCLUDE:
${inclusions.length > 0 ? inclusions.map((i: string) => `- ${i}`).join("\n") : "- (none specified)"}

ART STYLE: ${artStyleDesc}

INSTRUCTIONS:
1. Write a 12-page children's picture book (2-4 sentences per page, age-appropriate)
2. Create a charming title
3. Give the story a clear beginning, middle, and satisfying ending
4. Naturally weave in ${book.character_name}'s name and the requested elements
5. Make it warm, imaginative, and positive

For EACH page, also write an IMAGE_PROMPT describing what the illustration should depict:
- Describe the scene, characters, actions, and mood
- Include "${artStyleDesc}" as the style reference
- Be specific enough for an AI image generator
- The main character is a ${book.character_age || "young"} year old child named ${book.character_name}
- Do NOT include any text or words in the illustration

Return ONLY this JSON (no markdown fences, no extra text):
{
  "title": "The Book Title",
  "pages": [
    { "text": "Story text for this page.", "imagePrompt": "Detailed scene description for illustration..." }
  ]
}`;

      console.log("[Generate] Starting story generation via Replicate LLM...");
      const responseText = await generateStory(prompt);

      if (!responseText.trim()) {
        throw new Error("No story text in AI response");
      }

      // Parse JSON from response
      const cleaned = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      const story = JSON.parse(cleaned);

      if (!story.title || !Array.isArray(story.pages) || story.pages.length === 0) {
        throw new Error("Invalid story structure from AI");
      }

      console.log(`[Generate] Story created: "${story.title}" with ${story.pages.length} pages`);

      // Update book with generated content
      await supabase
        .from("books")
        .update({
          title: story.title,
          pages: story.pages,
          status: "ready",
        })
        .eq("id", bookId);

      // ── Generate illustrations via Replicate Flux Kontext ──
      const characterPhotoUrl =
        book.character_photo_url?.trim() || FALLBACK_CHARACTER_IMAGE_URL;
      if (!book.character_photo_url?.trim()) {
        console.log("Using fallback character image (no character_photo_url set).");
      }
      console.log("[Generate] Starting illustration generation...");

      const pagesForReplicate = story.pages.map(
        (p: { text: string; imagePrompt?: string; image_prompt?: string }, i: number) => ({
          pageNumber: i + 1,
          text: p.text ?? "",
          illustrationPrompt: p.imagePrompt ?? (p as { image_prompt?: string }).image_prompt ?? "",
        })
      );

      const imageResults = await generateBookIllustrations(
        pagesForReplicate,
        characterPhotoUrl
      );

      // Apply image URLs back to pages and save once
      const currentPages = [...story.pages];
      for (const r of imageResults) {
        if (r.imageUrl) {
          const idx = r.pageNumber - 1;
          if (idx >= 0 && idx < currentPages.length) {
            currentPages[idx] = {
              ...currentPages[idx],
              imageUrl: r.imageUrl,
              image_url: r.imageUrl,
            };
          }
        }
      }
      await supabase
        .from("books")
        .update({ pages: currentPages })
        .eq("id", bookId);

      // Set cover image from first successful page
      const firstImage = imageResults.find((r) => r.imageUrl);
      if (firstImage?.imageUrl) {
        await supabase
          .from("books")
          .update({ cover_image_url: firstImage.imageUrl })
          .eq("id", bookId);
      }

      const failedCount = imageResults.filter((r) => !r.imageUrl).length;
      if (failedCount > 0) {
        console.warn(`${failedCount} illustrations failed to generate`);
      }

      if (failedCount === imageResults.length) {
        return NextResponse.json(
          { error: "Illustrations failed to generate. Please try again." },
          { status: 502 }
        );
      }

      // Fetch final book state
      const { data: finalBook } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();

      return NextResponse.json({ book: finalBook });

    } catch (genError: unknown) {
      // Mark as failed
      await supabase
        .from("books")
        .update({ status: "failed" })
        .eq("id", bookId);

      console.error("Generation error:", genError);

      const err = genError as { response?: { status?: number }; message?: string };
      const msg = String(err?.message ?? "");
      const is402 = err?.response?.status === 402;

      if (is402) {
        return NextResponse.json(
          { error: "Replicate account has insufficient credit. Add credit at https://replicate.com/account/billing then try again." },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: msg ? "Generation failed: " + msg : "Story generation failed. Please try again." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("POST /api/generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
