import { NextRequest, NextResponse } from "next/server";
import { PublishError, publishApprovedDraft } from "@/lib/linkedin/publish";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const result = await publishApprovedDraft(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "publish failed";
    const status = err instanceof PublishError ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
