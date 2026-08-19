import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionToken,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password || "";
  if (!(await checkPassword(password))) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const token = await sessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
