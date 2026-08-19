import { NextResponse } from "next/server";
import { linkedinAuthUrl } from "@/lib/linkedin/client";
import { sessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const state = await sessionToken();
    const url = linkedinAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "LinkedIn not configured";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
