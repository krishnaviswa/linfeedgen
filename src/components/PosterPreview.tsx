"use client";

import { posterDocument } from "@/lib/posters/html";
import type { PosterJson } from "@/lib/llm/types";

export function PosterPreview({
  poster,
  scale = 0.32,
}: {
  poster: PosterJson;
  scale?: number;
}) {
  const html = posterDocument(poster);
  return (
    <div
      className="relative overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
      style={{ width: 1080 * scale, height: 1350 * scale }}
    >
      <iframe
        title={poster.headline}
        srcDoc={html}
        className="absolute top-0 left-0 border-0 pointer-events-none"
        style={{
          width: 1080,
          height: 1350,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
