"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LAYOUT_LABEL } from "@/lib/caption";

type Draft = {
  id: string;
  layout: string;
  status: string;
  created_at: string;
  poster: { headline: string } | null;
  invalidJson: boolean;
};

export function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/drafts")
      .then((r) => r.json())
      .then((d) => {
        setDrafts(d.drafts || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-serif text-4xl">Drafts</h1>
      <p className="text-[#b7aa98] mt-1">Edit text, export PNG, approve when ready.</p>
      <ul className="mt-8 space-y-2">
        {loading ? (
          <li className="text-[#8a7d6d]">Loading…</li>
        ) : drafts.length === 0 ? (
          <li className="text-[#8a7d6d]">No drafts yet. Generate from Sources.</li>
        ) : (
          drafts.map((d) => (
            <li key={d.id}>
              <Link
                href={`/drafts/${d.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-ink-700 px-4 py-3 hover:border-brass"
              >
                <div>
                  <div className="text-xs uppercase tracking-wider text-brass">
                    {LAYOUT_LABEL[d.layout] || d.layout} · {d.status}
                    {d.invalidJson ? " · invalid JSON" : ""}
                  </div>
                  <div className="font-serif text-xl mt-1">
                    {d.poster?.headline || "Unreadable poster JSON"}
                  </div>
                </div>
                <span className="text-sm text-[#8a7d6d]">
                  {d.created_at.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
