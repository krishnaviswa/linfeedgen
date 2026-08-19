import { NextRequest, NextResponse } from "next/server";
import { getDraft, getSource, updateDraft } from "@/lib/db";
import { parseStoredPoster, posterJsonSchema } from "@/lib/llm/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const draft = await getDraft(id);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = parseStoredPoster(draft.poster_json);
  const source = await getSource(draft.source_id);
  return NextResponse.json({
    draft: {
      ...draft,
      poster: parsed.success ? parsed.data : null,
      invalidJson: !parsed.success,
    },
    source,
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const draft = await getDraft(id);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (draft.status === "posted") {
    return NextResponse.json({ error: "Posted drafts are frozen" }, { status: 409 });
  }
  const body = (await req.json().catch(() => null)) as {
    poster?: unknown;
    status?: string;
  } | null;
  if (!body?.poster) {
    return NextResponse.json({ error: "poster required" }, { status: 400 });
  }
  const parsed = posterJsonSchema.safeParse({
    ...(typeof body.poster === "object" && body.poster ? body.poster : {}),
    layout: draft.layout,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid poster JSON (fail closed)",
        issues: parsed.error.issues.slice(0, 6),
      },
      { status: 422 },
    );
  }
  const next = await updateDraft(id, {
    poster_json: JSON.stringify(parsed.data),
    caption: parsed.data.caption,
    layout: parsed.data.layout,
    png_path: null,
  });
  return NextResponse.json({ draft: { ...next, poster: parsed.data } });
}
