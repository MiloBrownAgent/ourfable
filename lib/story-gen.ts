// Story generation via Replicate (Claude 3.5 Haiku — cheap and fast)
// Replaces direct Anthropic SDK usage

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

function getToken(): string {
  const token = REPLICATE_API_TOKEN?.trim();
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
  return token;
}

export async function generateStory(prompt: string): Promise<string> {
  const token = getToken();

  // Use Replicate's Claude 3.5 Haiku via their API
  const response = await fetch(
    "https://api.replicate.com/v1/models/meta/meta-llama-3.1-405b-instruct/predictions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Prefer: "wait=120",
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          max_tokens: 4096,
          temperature: 0.7,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("[StoryGen] API error:", response.status, data);
    throw new Error(`Story generation failed: ${data?.detail || response.statusText}`);
  }

  // Handle completed prediction
  if (data.status === "succeeded" && data.output) {
    // Replicate returns array of string tokens for LLMs
    if (Array.isArray(data.output)) {
      return data.output.join("");
    }
    if (typeof data.output === "string") {
      return data.output;
    }
  }

  // Poll if still processing
  if (data.status === "processing" || data.status === "starting") {
    const getUrl = data.urls?.get;
    if (!getUrl) throw new Error("No polling URL");

    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pollData = await pollRes.json();

      if (pollData.status === "succeeded" && pollData.output) {
        if (Array.isArray(pollData.output)) return pollData.output.join("");
        if (typeof pollData.output === "string") return pollData.output;
      }
      if (pollData.status === "failed" || pollData.status === "canceled") {
        throw new Error(`Story generation failed: ${pollData.error}`);
      }
    }
    throw new Error("Story generation timed out");
  }

  throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
}
