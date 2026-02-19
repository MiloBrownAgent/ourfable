const REPLICATE_API_BASE = "https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

function getToken(): string {
  const token = REPLICATE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not set in environment");
  }
  return token;
}

function extractOutputUrl(output: unknown): string | null {
  if (typeof output === "string" && output.startsWith("http")) return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string" && first.startsWith("http")) return first;
    if (first && typeof first === "object" && "url" in first && typeof (first as { url: string }).url === "string") {
      return (first as { url: string }).url;
    }
  }
  return null;
}

export async function generateIllustration(
  prompt: string,
  characterPhotoUrl?: string
): Promise<string | null> {
  console.log("[Replicate] Token prefix:", process.env.REPLICATE_API_TOKEN?.substring(0, 10));
  try {
    const token = getToken();
    const styledPrompt = "Whimsical children's storybook illustration in soft watercolor and gouache style, gentle pastel color palette with warm golden lighting, hand-painted texture with soft edges, expressive cartoon characters with large eyes and rounded features, dreamy background with subtle bokeh, consistent with a premium printed children's picture book. No photorealism, no 3D rendering, no sharp edges. " + prompt;
    const input: Record<string, unknown> = { prompt: styledPrompt, aspect_ratio: "1:1" };
    if (characterPhotoUrl) input.input_image = characterPhotoUrl;

    const maxRetries = 3;
    let response: Response | null = null;
    let data: Record<string, unknown> = {};

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(REPLICATE_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Prefer: "wait=60",
        },
        body: JSON.stringify({ input }),
      });

      data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      console.log("[Replicate] Response status:", response.status, "prediction status:", data?.status);

      if (response.status === 429 && attempt < maxRetries) {
        console.warn("[Replicate] Rate limited (429), waiting 5s before retry", attempt + 1, "/", maxRetries);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      if (!response.ok) {
        const detail = data?.detail ?? data?.title ?? response.statusText;
        console.error("[Replicate] API error:", response.status, detail);
        return null;
      }

      break;
    }

    if (!response!.ok) return null;

    if (data?.status === "succeeded" && data?.output != null) {
      const url = extractOutputUrl(data!.output);
      if (url) return url;
      console.error("[Replicate] Unexpected output shape:", typeof data?.output);
      return null;
    }

    if (data?.status === "processing" || data?.status === "starting") {
      const getUrl = (data?.urls as { get?: string } | undefined)?.get;
      if (!getUrl) {
        console.error("[Replicate] No polling URL in response");
        return null;
      }
      const token = getToken();
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(getUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pollData = await pollRes.json().catch(() => ({}));
        if (!pollRes.ok) {
          console.error("[Replicate] Poll request failed:", pollRes.status, pollData);
          return null;
        }
        if (pollData.status === "succeeded" && pollData.output != null) {
          const url = extractOutputUrl(pollData.output);
          if (url) return url;
        }
        if (pollData.status === "failed" || pollData.status === "canceled") {
          console.error("[Replicate] Prediction failed:", pollData.error);
          return null;
        }
      }
      console.error("[Replicate] Polling timed out");
    }

    console.error("[Replicate] Failed:", data?.error ?? data);
    return null;
  } catch (err) {
    console.error("[Replicate] Exception:", err);
    if (err instanceof Error && err.message === "REPLICATE_API_TOKEN is not set in environment") {
      throw err;
    }
    return null;
  }
}

export async function generateBookIllustrations(
  pages: { pageNumber: number; text: string; illustrationPrompt: string }[],
  characterPhotoUrl?: string
): Promise<{ pageNumber: number; imageUrl: string | null }[]> {
  const results: { pageNumber: number; imageUrl: string | null }[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const prompt = page.illustrationPrompt?.trim();
    if (!prompt) {
      console.warn(`[Replicate] Page ${page.pageNumber} has no illustration prompt, skipping`);
      results.push({ pageNumber: page.pageNumber, imageUrl: null });
      if (i < pages.length - 1) await new Promise((r) => setTimeout(r, 12000));
      continue;
    }
    console.log(`Generating illustration ${page.pageNumber}/${pages.length}...`);
    const imageUrl = await generateIllustration(prompt, characterPhotoUrl);
    results.push({ pageNumber: page.pageNumber, imageUrl });
    if (imageUrl) {
      console.log(`[Replicate] Page ${page.pageNumber} succeeded`);
    }
    if (i < pages.length - 1) {
      await new Promise((r) => setTimeout(r, 12000));
    }
  }

  const failed = results.filter((r) => !r.imageUrl).length;
  if (failed > 0) console.log(`${failed} illustrations failed to generate`);

  return results;
}
