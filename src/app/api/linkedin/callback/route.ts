import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";
import { exchangeLinkedInCode } from "@/lib/linkedin/client";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");
  const settings = new URL("/settings", req.url);
  if (err) {
    settings.searchParams.set("li", err);
    return NextResponse.redirect(settings);
  }
  if (!code || !state || !(await verifySessionCookie(state))) {
    settings.searchParams.set("li", "bad_state");
    return NextResponse.redirect(settings);
  }
  try {
    await exchangeLinkedInCode(code);
    settings.searchParams.set("li", "ok");
  } catch (e) {
    settings.searchParams.set(
      "li",
      e instanceof Error ? e.message : "exchange_failed",
    );
  }
  return NextResponse.redirect(settings);
}
