import { NextResponse } from "next/server";
import { addUser, findUser } from "@/lib/store";
import { createToken, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-16 characters: letters, numbers or underscore." },
      { status: 400 }
    );
  }
  if (password.length < 6 || password.length > 100) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  try {
    if (await findUser(username)) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    const { salt, hash } = hashPassword(password);
    await addUser({ username, salt, hash, createdAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof Error && err.message === "USERNAME_TAKEN") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    console.error("[register] storage error:", err);
    return NextResponse.json({ error: "Database unavailable. Please try again." }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true, username });
  res.cookies.set(SESSION_COOKIE, createToken(username), sessionCookieOptions);
  return res;
}