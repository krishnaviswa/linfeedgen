import { NextRequest, NextResponse } from "next/server";
import { isCronRequest, requireUserOrCron, unauthorized } from "@/lib/auth";
import { PublishError, publishNextApproved } from "@/lib/linkedin/publish";
import { linkedinConnected } from "@/lib/linkedin/client";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  if (!(await requireUserOrCron(req))) return unauthorized();
  if (!(await linkedinConnected())) {
    return NextResponse.json({
      ok: true,
      posted: 0,
      skipped: "linkedin not connected — use copy-paste export",
    });
  }
  try {
    const result = await publishNextApproved();
    return NextResponse.json({
      ok: true,
      via: isCronRequest(req) ? "cron" : "user",
      ...result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "publish failed";
    const status = err instanceof PublishError ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
