// Password hashing + signed session cookie, using only Node's built-in crypto.
// Server-side only (it imports next/headers).
import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "fr_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

function secret(): string {
  // Set JWT_SECRET in .env.local. The fallback is for local development only.
  return process.env.JWT_SECRET || "dev-only-secret-change-me";
}

export function hashPassword(password: string, salt?: string) {
  const usedSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, usedSalt, 64).toString("hex");
  return { salt: usedSalt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const test = crypto.scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, "hex");
    return test.length === stored.length && crypto.timingSafeEqual(test, stored);
  } catch {
    return false;
  }
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + SESSION_MAX_AGE * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.u !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) {
      return null;
    }
    return data.u;
  } catch {
    return null;
  }
}

/** Returns the logged-in username, or null. Use in server components and API routes. */
export function getSessionUser(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? readToken(token) : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};