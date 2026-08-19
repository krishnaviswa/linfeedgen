import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { appPassword, cronSecret, sessionSecret } from "@/lib/secrets";

export const SESSION_COOKIE = "lf_session";

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return hex(sig);
}

function timingEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function sessionToken(): Promise<string> {
  return hmac("linfeedgen-ok", sessionSecret());
}

export async function verifySessionCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  try {
    const expected = await sessionToken();
    return timingEqual(value, expected);
  } catch {
    return false;
  }
}

export async function checkPassword(password: string): Promise<boolean> {
  try {
    return timingEqual(password, appPassword());
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function isAuthedFromCookies(): Promise<boolean> {
  const store = await cookies();
  return verifySessionCookie(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<boolean> {
  return isAuthedFromCookies();
}

export function bearerOrQuerySecret(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  const x = req.headers.get("x-cron-secret")?.trim();
  if (x) return x;
  return req.nextUrl.searchParams.get("secret")?.trim() || undefined;
}

export function isCronRequest(req: NextRequest): boolean {
  const expected = cronSecret();
  if (!expected) return false;
  const got = bearerOrQuerySecret(req);
  if (!got) return false;
  return timingEqual(got, expected);
}

export async function requireUserOrCron(req: NextRequest): Promise<boolean> {
  if (isCronRequest(req)) return true;
  return verifySessionCookie(req.cookies.get(SESSION_COOKIE)?.value);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
