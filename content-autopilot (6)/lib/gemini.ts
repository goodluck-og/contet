import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Gemini 1.5 Flash - vision-capable, free tier (15 req/min, 1500/day),
// plenty of headroom for 3 captions/day.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Takes a base64 frame from the video + the account's niche, and asks Gemini
 * to identify the character/source and write platform-tuned captions.
 * Same return shape as the old Anthropic version, so nothing else in the
 * app (Post model, dashboard, digest) needs to change.
 */
export async function generateCaption({
  frameBase64,
  niche,
}: {
  frameBase64: string; // base64 jpeg/png, no data: prefix
  niche: string; // e.g. "Genshin Impact MMD edits"
}) {
  const prompt = `This is a frame from a short-form video in the "${niche}" niche.
Identify the character(s) shown and which game/franchise they're from if visible.

Also check: does this frame show any visible watermark, logo, or username overlay
from another app (like CapCut, a TikTok username watermark, or a downloader site logo)?
This matters because watermarked/reposted-looking content gets suppressed by TikTok's
algorithm - so flag it honestly if you see one, even a faint one in a corner.

Then write THREE tuned captions for the same clip, since each platform rewards a
different style:
- tiktok: punchy, hook-first, max 150 chars, casual tone
- youtube: slightly longer, keyword-rich for search/SEO, can mention the franchise name explicitly
- instagram: concise, aesthetic/mood-focused, light emoji use okay

Also suggest 6-10 relevant hashtags (mix of niche-specific and broad).

Respond ONLY as JSON, no markdown fences, no extra text:
{
  "character": "",
  "source": "",
  "captionVariants": { "tiktok": "", "youtube": "", "instagram": "" },
  "hashtags": [],
  "watermarkDetected": false,
  "watermarkNote": ""
}`;

  const result = await model.generateContent([
    { inlineData: { mimeType: "image/jpeg", data: frameBase64 } },
    { text: prompt },
  ]);

  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    return {
      character: "",
      source: "",
      captionVariants: { tiktok: "", youtube: "", instagram: "" },
      hashtags: [],
      watermarkDetected: false,
      watermarkNote: "",
    };
  }
}

/**
 * Text-only Gemini call, used for the weekly digest summary
 * (no image needed there, just performance data as text).
 */
export async function generateText(prompt: string) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}
