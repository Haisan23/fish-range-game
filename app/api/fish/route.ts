import { NextResponse } from "next/server";

// Server-side proxy for the lecturer's Fish API.
// Real response (verified): { "question": "<image url>", "fish": <number>, "chest": <number> }
// Calling it from the server avoids browser CORS problems and lets us validate the data.
export const dynamic = "force-dynamic";

const FISH_API_URL = "https://marcconrad.com/uob/fish/api.php";

export async function GET() {
  try {
    const res = await fetch(FISH_API_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Fish API HTTP ${res.status}`);

    // The API sends JSON with an HTML content-type, so parse the text ourselves.
    const data = JSON.parse(await res.text());
    const fish = Number(data?.fish);
    const chest = Number(data?.chest);
    if (typeof data?.question !== "string" || !Number.isFinite(fish) || !Number.isFinite(chest)) {
      throw new Error("Unexpected Fish API schema");
    }
    return NextResponse.json({ question: data.question, fish, chest, source: "api" });
  } catch (err) {
    console.warn("[fish] API unavailable, using local fallback:", err);
    // Clearly labelled local fallback: NOT API data.
    return NextResponse.json({
      question: null,
      fish: 4 + Math.floor(Math.random() * 5), // 4-8
      chest: 1 + Math.floor(Math.random() * 3), // 1-3
      source: "fallback",
    });
  }
}