"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LAYOUTS, type LayoutId } from "@/lib/llm/types";
import { LAYOUT_LABEL } from "@/lib/caption";

type Source = {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  feed: string;
  ingested_at: string;
};

type Variant = { id: string; layout: string; poster: { headline: string } };

export function SourcesBoard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [layouts, setLayouts] = useState<LayoutId[]>(["story", "versus", "stats"]);
  const [genBusy, setGenBusy] = useState(false);
  const [error, setError] = useState("");
  const [variants, setVariants] = useState<Variant[] | null>(null);

  async function load() {
    const res = await fetch("/api/sources");
    const data = await res.json();
    setSources(data.sources || []);
    setLoading(false);
    return (data.sources || []) as Source[];
  }

  useEffect(() => {
    void (async () => {
      const list = await load();
      if (list.length === 0) {
        setIngestBusy(true);
        await fetch("/api/cron/ingest", { method: "POST" });
        setIngestBusy(false);
        await load();
      }
    })();
  }, []);

  async function ingest() {
    setIngestBusy(true);
    setError("");
    const res = await fetch("/api/cron/ingest", { method: "POST" });
    const data = await res.json();
    setIngestBusy(false);
    if (!res.ok) {
      setError(data.error || "Ingest failed");
      return;
    }
    await load();
  }

  function toggleLayout(id: LayoutId) {
    setLayouts((cur) => {
      if (cur.includes(id)) {
        if (cur.length <= 2) return cur;
        return cur.filter((x) => x !== id);
      }
      if (cur.length >= 3) return cur;
      return [...cur, id];
    });
  }

  async function generate() {
    if (!selected) return;
    setGenBusy(true);
    setError("");
    setVariants(null);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: selected, layouts }),
    });
    const data = await res.json();
    setGenBusy(false);
    if (!res.ok) {
      setError(data.error || data.errors?.join(" · ") || "Generate failed");
      return;
    }
    setVariants(data.drafts);
  }

  const current = sources.find((s) => s.id === selected);

  return (
    <div className="grid grid-cols-[1.1fr_0.9fr] min-h-screen">
      <section className="border-r border-ink-700 p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl">Sources</h1>
            <p className="text-[#b7aa98] mt-1">
              Public RSS / HN / arXiv. No LinkedIn scrape.
            </p>
          </div>
          <button
            onClick={() => void ingest()}
            disabled={ingestBusy}
            className="rounded-md border border-ink-600 px-3 py-2 text-sm hover:border-brass disabled:opacity-50"
          >
            {ingestBusy ? "Fetching…" : "Refresh feeds"}
          </button>
        </div>
        {error ? <p className="text-rust text-sm mt-4">{error}</p> : null}
        <ul className="mt-8 space-y-2">
          {loading ? (
            <li className="text-[#8a7d6d]">Loading…</li>
          ) : sources.length === 0 ? (
            <li className="text-[#8a7d6d]">
              Nothing ingested yet. Click Refresh feeds.
            </li>
          ) : (
            sources.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setSelected(s.id);
                    setVariants(null);
                  }}
                  className={`w-full text-left rounded-lg px-4 py-3 border ${
                    selected === s.id
                      ? "border-brass bg-ink-800"
                      : "border-transparent hover:bg-ink-800"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-brass">
                    <span>{s.feed}</span>
                    <span className="text-[#6f6a62]">
                      {s.ingested_at.slice(0, 10)}
                    </span>
                  </div>
                  <div className="mt-1 leading-snug">{s.title}</div>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
      <aside className="p-8">
        {!current ? (
          <p className="text-[#8a7d6d]">Pick a source to generate 2–3 poster variants.</p>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brass">Selected</p>
            <h2 className="font-serif text-3xl mt-2 leading-tight">{current.title}</h2>
            <a
              href={current.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#b7aa98] underline mt-2 inline-block break-all"
            >
              {current.url}
            </a>
            {current.excerpt ? (
              <p className="text-sm text-[#b7aa98] mt-4 line-clamp-6">{current.excerpt}</p>
            ) : null}

            <p className="mt-8 text-sm text-[#b7aa98]">Layouts (2–3)</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {LAYOUTS.map((id) => (
                <button
                  key={id}
                  onClick={() => toggleLayout(id)}
                  className={`rounded-full px-3 py-1 text-sm border ${
                    layouts.includes(id)
                      ? "border-brass bg-ink-700"
                      : "border-ink-600 text-[#8a7d6d]"
                  }`}
                >
                  {LAYOUT_LABEL[id]}
                </button>
              ))}
            </div>
            <button
              onClick={() => void generate()}
              disabled={genBusy || layouts.length < 2}
              className="mt-6 rounded-lg bg-paper text-ink-950 font-semibold px-4 py-2.5 disabled:opacity-50"
            >
              {genBusy ? "Generating…" : `Generate ${layouts.length} variants`}
            </button>
            {variants ? (
              <div className="mt-8 space-y-3">
                <p className="text-sm text-[#b7aa98]">Open a variant to edit and export.</p>
                {variants.map((v) => (
                  <Link
                    key={v.id}
                    href={`/drafts/${v.id}`}
                    className="block rounded-lg border border-ink-600 px-4 py-3 hover:border-brass"
                  >
                    <span className="text-xs uppercase tracking-wider text-brass">
                      {LAYOUT_LABEL[v.layout] || v.layout}
                    </span>
                    <div className="font-serif text-xl mt-1">{v.poster.headline}</div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </aside>
    </div>
  );
}
