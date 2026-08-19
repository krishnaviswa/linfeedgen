import { NextRequest, NextResponse } from "next/server";
import { isCronRequest, requireUserOrCron, unauthorized } from "@/lib/auth";
import { ingestFeeds } from "@/lib/feeds/ingest";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  if (!(await requireUserOrCron(req))) return unauthorized();
  const result = await ingestFeeds();
  return NextResponse.json({
    ok: true,
    via: isCronRequest(req) ? "cron" : "user",
    ...result,
  });
}
