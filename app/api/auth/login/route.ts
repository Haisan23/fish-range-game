import { NextResponse } from "next/server";
import { findUser } from "@/lib/store";
import { createToken, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");

  let user;
  try {
    user = await findUser(username);
  } catch (err) {
    console.error("[login] storage error:", err);
    return NextResponse.json({ error: "Database unavailable. Please try again." }, { status: 503 });
  }
  if (!user || !verifyPassword(password, user.salt, user.hash)) {
    // Same message for both cases so attackers can't discover valid usernames.
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set(SESSION_COOKIE, createToken(user.username), sessionCookieOptions);
  return res;
}