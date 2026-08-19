import { z } from "zod";

export const LAYOUTS = [
  "story",
  "process",
  "versus",
  "stats",
  "architecture",
] as const;

export type LayoutId = (typeof LAYOUTS)[number];

export const posterBlockSchema = z.object({
  title: z.string().min(1).max(90),
  body: z.string().min(1).max(480),
  metric: z.string().max(48).optional(),
});

export const posterJsonSchema = z.object({
  layout: z.enum(LAYOUTS),
  kicker: z.string().max(72).optional().default(""),
  headline: z.string().min(1).max(140),
  subhead: z.string().max(240).optional().default(""),
  blocks: z.array(posterBlockSchema).min(4).max(7),
  footer: z.string().max(100).optional().default(""),
  caption: z.string().min(1).max(2800),
  hashtags: z.array(z.string().max(40)).max(8).optional().default([]),
});

export type PosterBlock = z.infer<typeof posterBlockSchema>;
export type PosterJson = z.infer<typeof posterJsonSchema>;

export type PosterInput = {
  title: string;
  url: string;
  excerpt: string;
  layout: LayoutId;
  feed?: string;
};

export class AdapterError extends Error {
  constructor(
    message: string,
    readonly causeName?: string,
  ) {
    super(message);
    this.name = "AdapterError";
  }
}

export function extractJsonText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new AdapterError("Model returned empty output");
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new AdapterError("Model did not return JSON");
  }
  return raw.slice(start, end + 1);
}

export function parseStoredPoster(raw: string): {
  success: true;
  data: PosterJson;
} | { success: false } {
  try {
    const result = posterJsonSchema.safeParse(JSON.parse(raw));
    if (!result.success) return { success: false };
    return result;
  } catch {
    return { success: false };
  }
}

export function parsePosterJson(text: string, layout: LayoutId): PosterJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonText(text));
  } catch (err) {
    if (err instanceof AdapterError) throw err;
    throw new AdapterError("Model returned invalid JSON");
  }
  const result = posterJsonSchema.safeParse({
    ...(typeof parsed === "object" && parsed ? parsed : {}),
    layout,
  });
  if (!result.success) {
    throw new AdapterError(
      `Poster JSON failed validation: ${result.error.issues
        .slice(0, 4)
        .map((i) => i.path.join(".") + " " + i.message)
        .join("; ")}`,
    );
  }
  return result.data;
}
