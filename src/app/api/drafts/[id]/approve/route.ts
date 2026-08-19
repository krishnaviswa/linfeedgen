import { NextRequest, NextResponse } from "next/server";
import { getDraft, updateDraft } from "@/lib/db";
import { posterJsonSchema } from "@/lib/llm/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const draft = await getDraft(id);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (draft.status === "posted") {
    return NextResponse.json({ error: "Already posted" }, { status: 409 });
  }
  const body = (await req.json().catch(() => ({}))) as { approve?: boolean };
  const approve = body.approve !== false;

  if (approve) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(draft.poster_json);
    } catch {
      return NextResponse.json(
        { error: "Corrupt JSON; refuse approve (fail closed)" },
        { status: 422 },
      );
    }
    const parsed = posterJsonSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid poster JSON; refuse approve (fail closed)" },
        { status: 422 },
      );
    }
    const next = await updateDraft(id, {
      status: "approved",
      approved_at: new Date().toISOString(),
    });
    return NextResponse.json({ draft: next });
  }

  const next = await updateDraft(id, {
    status: "draft",
    approved_at: null,
  });
  return NextResponse.json({ draft: next });
}
