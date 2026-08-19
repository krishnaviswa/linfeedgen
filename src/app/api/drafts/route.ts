import { NextRequest, NextResponse } from "next/server";
import { listDrafts, type DraftStatus } from "@/lib/db";
import { parseStoredPoster } from "@/lib/llm/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") as DraftStatus | null;
  const sourceId = req.nextUrl.searchParams.get("sourceId") || undefined;
  const rows = await listDrafts({
    status: status || undefined,
    sourceId,
  });
  const drafts = rows.map((row) => {
    const parsed = parseStoredPoster(row.poster_json || "{}");
    return {
      ...row,
      poster: parsed.success ? parsed.data : null,
      invalidJson: !parsed.success,
    };
  });
  return NextResponse.json({ drafts });
}
