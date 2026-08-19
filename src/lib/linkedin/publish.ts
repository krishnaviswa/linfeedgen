import fs from "node:fs/promises";
import path from "node:path";
import { dataDir } from "@/lib/config";
import { getDraft, listDrafts, updateDraft, type DraftRow } from "@/lib/db";
import { parseStoredPoster } from "@/lib/llm/types";
import { publishLinkedInShare } from "@/lib/linkedin/client";
import { renderPosterPng } from "@/lib/render/png";

export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishError";
  }
}

async function pngForDraft(draft: DraftRow): Promise<Buffer> {
  if (draft.png_path) {
    const abs = path.join(dataDir(), draft.png_path);
    try {
      return await fs.readFile(abs);
    } catch {
      /* redraw */
    }
  }
  const parsed = parseStoredPoster(draft.poster_json);
  if (!parsed.success) {
    throw new PublishError("Draft poster JSON is invalid; fail closed");
  }
  const rendered = await renderPosterPng(draft.id, parsed.data);
  await updateDraft(draft.id, { png_path: rendered.relative });
  return rendered.bytes;
}

/**
 * LinkedIn publish is approve-only. Any other status is a hard no.
 */
export async function publishApprovedDraft(draftId: string): Promise<{
  urn: string;
}> {
  const draft = await getDraft(draftId);
  if (!draft) throw new PublishError("Draft not found");
  if (draft.status !== "approved") {
    throw new PublishError(
      `Refusing to post: status is "${draft.status}", not approved`,
    );
  }
  const parsed = parseStoredPoster(draft.poster_json);
  if (!parsed.success) {
    throw new PublishError("Draft poster JSON is invalid; fail closed");
  }
  const png = await pngForDraft(draft);
  const caption = [
    parsed.data.caption,
    parsed.data.hashtags?.length
      ? parsed.data.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const urn = await publishLinkedInShare({ caption, png });
  await updateDraft(draft.id, {
    status: "posted",
    posted_at: new Date().toISOString(),
    linkedin_urn: urn,
  });
  return { urn };
}

export async function publishNextApproved(): Promise<{
  posted: number;
  skipped: string;
  urn?: string;
}> {
  const queue = await listDrafts({ status: "approved" });
  const next = queue[0];
  if (!next) {
    return { posted: 0, skipped: "no approved drafts" };
  }
  const { urn } = await publishApprovedDraft(next.id);
  return { posted: 1, skipped: "", urn };
}
