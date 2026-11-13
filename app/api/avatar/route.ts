import { NextResponse } from "next/server";

// Second external API: DiceBear avatars (https://api.dicebear.com, free, no API key).
// Same seed => same avatar, so every player gets a stable profile picture.
// We call it from the server (like /api/fish) so we can validate the response,
// cache it, and fall back to a locally generated avatar if DiceBear is unreachable.
export const dynamic = "force-dynamic";

const DICEBEAR_URL = "https://api.dicebear.com/9.x/thumbs/svg";

function fallbackSvg(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const letter = (seed[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="hsl(${h} 55% 45%)"/><text x="32" y="32" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="30" font-weight="700" fill="#fff">${letter}</text></svg>`;
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("seed") ?? "player";
  // Only allow safe seeds (our usernames are letters/numbers/underscore).
  const seed = /^[a-zA-Z0-9_-]{1,32}$/.test(raw) ? raw : "player";

  const headers: Record<string, string> = {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
  };

  try {
    const res = await fetch(`${DICEBEAR_URL}?seed=${encodeURIComponent(seed)}&radius=50`, {
      signal: AbortSignal.timeout(4000),
    });
    const body = await res.text();
    if (!res.ok || !body.trimStart().startsWith("<svg")) throw new Error(`DiceBear HTTP ${res.status}`);
    return new NextResponse(body, { headers: { ...headers, "X-Avatar-Source": "dicebear" } });
  } catch (err) {
    console.warn("[avatar] DiceBear unavailable, using local fallback:", err);
    return new NextResponse(fallbackSvg(seed), {
      headers: { ...headers, "Cache-Control": "public, max-age=60", "X-Avatar-Source": "fallback" },
    });
  }
}