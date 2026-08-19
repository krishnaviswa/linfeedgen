import { NextRequest, NextResponse } from "next/server";
import { getSource, insertDraft } from "@/lib/db";
import {
  completePoster,
  AdapterError,
  LAYOUTS,
  type LayoutId,
} from "@/lib/llm";
import { z } from "zod";

export const maxDuration = 60;
/** Adapter only — never import Gemini/DeepSeek/Qwen SDKs from this route. */

const bodySchema = z.object({
  sourceId: z.string().min(1),
  layouts: z
    .array(z.enum(LAYOUTS))
    .min(2)
    .max(3)
    .optional(),
});

const DEFAULT_LAYOUTS: LayoutId[] = ["story", "versus", "stats"];

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Need sourceId and 2–3 layouts" },
      { status: 400 },
    );
  }
  const source = await getSource(parsed.data.sourceId);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }
  const layouts = parsed.data.layouts ?? DEFAULT_LAYOUTS;

  const settled = await Promise.allSettled(
    layouts.map((layout) =>
      completePoster({
        title: source.title,
        url: source.url,
        excerpt: source.excerpt,
        layout,
        feed: source.feed,
      }),
    ),
  );

  const drafts = [];
  const errors: string[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    const layout = layouts[i];
    if (result.status === "rejected") {
      const msg =
        result.reason instanceof AdapterError
          ? result.reason.message
          : result.reason instanceof Error
            ? result.reason.message
            : "generate failed";
      errors.push(`${layout}: ${msg}`);
      continue;
    }
    const poster = result.value;
    const id = crypto.randomUUID();
    await insertDraft({
      id,
      source_id: source.id,
      layout: poster.layout,
      poster_json: JSON.stringify(poster),
      caption: poster.caption,
      status: "draft",
      png_path: null,
      created_at: now,
      updated_at: now,
      approved_at: null,
      posted_at: null,
      linkedin_urn: null,
    });
    drafts.push({
      id,
      layout: poster.layout,
      poster,
      status: "draft",
    });
  }

  if (drafts.length === 0) {
    return NextResponse.json(
      { error: "All variants failed (fail closed)", errors },
      { status: 422 },
    );
  }

  return NextResponse.json({ drafts, errors });
}
