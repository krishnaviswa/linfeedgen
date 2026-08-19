import { NextRequest, NextResponse } from "next/server";
import { getDraft, updateDraft } from "@/lib/db";
import { posterJsonSchema } from "@/lib/llm/types";
import { renderPosterPng } from "@/lib/render/png";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const draft = await getDraft(id);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(draft.poster_json);
  } catch {
    return NextResponse.json(
      { error: "Stored poster JSON is corrupt (fail closed)" },
      { status: 422 },
    );
  }
  const parsed = posterJsonSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Poster JSON invalid (fail closed)" },
      { status: 422 },
    );
  }
  const rendered = await renderPosterPng(draft.id, parsed.data);
  await updateDraft(draft.id, { png_path: rendered.relative });
  return new NextResponse(new Uint8Array(rendered.bytes), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="linfeedgen-${draft.id.slice(0, 8)}.png"`,
    },
  });
}
