import type { PosterJson } from "@/lib/llm/types";

export function captionText(poster: PosterJson): string {
  const tags = (poster.hashtags || [])
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");
  return [poster.caption, tags].filter(Boolean).join("\n\n");
}

export const LAYOUT_LABEL: Record<string, string> = {
  story: "Story",
  process: "Process",
  versus: "Versus",
  stats: "Stats",
  architecture: "Architecture",
};
