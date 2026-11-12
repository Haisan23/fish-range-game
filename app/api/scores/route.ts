import { NextResponse } from "next/server";
import { addScore, topScores } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/scores -> top 10 runs (public)
export async function GET() {
  try {
    return NextResponse.json(await topScores(10));
  } catch (err) {
    console.error("[scores] read error:", err);
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }
}

// POST /api/scores -> save the finished run of the logged-in player
// NOTE: the score is reported by the browser, so a determined cheater could fake it.
// That is acceptable for coursework; mention it as a limitation.
export async function POST(req: Request) {
  const username = getSessionUser();
  if (!username) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const score = Number(body?.score);
  const level = Number(body?.level);
  const accuracy = Number(body?.accuracy);

  const valid =
    [score, level, accuracy].every(Number.isFinite) &&
    score >= 0 && score <= 1_000_000 &&
    level >= 1 && level <= 100 &&
    accuracy >= 0 && accuracy <= 100;
  if (!valid) {
    return NextResponse.json({ error: "Invalid score data." }, { status: 400 });
  }

  try {
    await addScore({
      username,
      score: Math.round(score),
      level: Math.round(level),
      accuracy: Math.round(accuracy),
      date: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[scores] write error:", err);
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}