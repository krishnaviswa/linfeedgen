"use client";

import { useEffect, useMemo, useState } from "react";
import { PosterPreview } from "@/components/PosterPreview";
import { captionText, LAYOUT_LABEL } from "@/lib/caption";
import type { PosterBlock, PosterJson } from "@/lib/llm/types";

type Payload = {
  draft: {
    id: string;
    status: string;
    layout: string;
    poster: PosterJson | null;
    invalidJson: boolean;
    png_path: string | null;
  };
  source: { title: string; url: string; feed: string } | null;
};

const emptyBlock = (): PosterBlock => ({ title: "", body: "" });

export function DraftEditor({ id }: { id: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [poster, setPoster] = useState<PosterJson | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/drafts/${id}`);
    const json = (await res.json()) as Payload & { error?: string };
    if (!res.ok) {
      setError(json.error || "Failed to load");
      return;
    }
    setData(json);
    setPoster(json.draft.poster);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const caption = useMemo(() => (poster ? captionText(poster) : ""), [poster]);

  function patch<K extends keyof PosterJson>(key: K, value: PosterJson[K]) {
    setPoster((p) => (p ? { ...p, [key]: value } : p));
  }

  function patchBlock(i: number, next: PosterBlock) {
    setPoster((p) => {
      if (!p) return p;
      const blocks = p.blocks.map((b, idx) => (idx === i ? next : b));
      return { ...p, blocks };
    });
  }

  async function save(): Promise<boolean> {
    if (!poster) return false;
    setBusy("save");
    setError("");
    const res = await fetch(`/api/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poster }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(json.error || "Save failed (fail closed)");
      return false;
    }
    setNotice("Saved. PNG will redraw on export.");
    setPoster(json.draft.poster);
    await load();
    return true;
  }

  async function exportPng() {
    setBusy("png");
    setError("");
    const ok = await save();
    if (!ok) {
      setBusy(null);
      return;
    }
    const res = await fetch(`/api/drafts/${id}/export`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error || "Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linfeedgen-${id.slice(0, 8)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("PNG downloaded.");
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(caption);
    setNotice("Caption copied.");
  }

  async function setApproved(approve: boolean) {
    setBusy("approve");
    setError("");
    const res = await fetch(`/api/drafts/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(json.error || "Approve failed");
      return;
    }
    setNotice(
      approve
        ? "Approved. Eligible for LinkedIn cron / Publish now. Nothing posted yet."
        : "Returned to draft.",
    );
    await load();
  }

  async function publishNow() {
    setBusy("publish");
    setError("");
    const res = await fetch(`/api/drafts/${id}/publish`, { method: "POST" });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(json.error || "Publish refused");
      return;
    }
    setNotice(`Posted to LinkedIn (${json.urn || "ok"}).`);
    await load();
  }

  if (error && !data) {
    return <div className="p-8 text-rust">{error}</div>;
  }
  if (!poster) {
    return <div className="p-8 text-[#8a7d6d]">Loading draft…</div>;
  }

  const status = data?.draft.status || "draft";

  return (
    <div className="grid grid-cols-[auto_1fr] min-h-screen">
      <div className="p-8 bg-ink-900 border-r border-ink-700">
        <PosterPreview poster={poster} scale={0.42} />
      </div>
      <div className="p-8 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-brass">
          {LAYOUT_LABEL[poster.layout]} · {status}
        </p>
        <h1 className="font-serif text-3xl mt-2">Edit poster text</h1>
        {data?.source ? (
          <a
            href={data.source.url}
            className="text-sm text-[#b7aa98] underline mt-1 inline-block"
            target="_blank"
            rel="noreferrer"
          >
            {data.source.title}
          </a>
        ) : null}

        {error ? <p className="text-rust text-sm mt-4">{error}</p> : null}
        {notice ? <p className="text-brass text-sm mt-4">{notice}</p> : null}

        <div className="mt-6 space-y-4">
          <Field label="Kicker" value={poster.kicker || ""} onChange={(v) => patch("kicker", v)} />
          <Field label="Headline" value={poster.headline} onChange={(v) => patch("headline", v)} />
          <Field
            label="Subhead"
            value={poster.subhead || ""}
            onChange={(v) => patch("subhead", v)}
          />
          {poster.blocks.map((b, i) => (
            <div key={i} className="rounded-lg border border-ink-700 p-3 space-y-2">
              <div className="text-xs uppercase tracking-wider text-[#8a7d6d]">
                Block {i + 1}
              </div>
              <Field
                label="Title"
                value={b.title}
                onChange={(v) => patchBlock(i, { ...b, title: v })}
              />
              <Field
                label="Metric (optional)"
                value={b.metric || ""}
                onChange={(v) => patchBlock(i, { ...b, metric: v })}
              />
              <Area
                label="Body"
                value={b.body}
                onChange={(v) => patchBlock(i, { ...b, body: v })}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={poster.blocks.length >= 7}
              onClick={() =>
                setPoster((p) =>
                  p && p.blocks.length < 7
                    ? { ...p, blocks: [...p.blocks, emptyBlock()] }
                    : p,
                )
              }
              className="text-sm border border-ink-600 rounded-md px-3 py-1.5 disabled:opacity-40"
            >
              Add block
            </button>
            <button
              type="button"
              disabled={poster.blocks.length <= 4}
              onClick={() =>
                setPoster((p) =>
                  p && p.blocks.length > 4
                    ? { ...p, blocks: p.blocks.slice(0, -1) }
                    : p,
                )
              }
              className="text-sm border border-ink-600 rounded-md px-3 py-1.5 disabled:opacity-40"
            >
              Remove last
            </button>
          </div>
          <Field label="Footer" value={poster.footer || ""} onChange={(v) => patch("footer", v)} />
          <Area
            label="LinkedIn caption"
            value={poster.caption}
            onChange={(v) => patch("caption", v)}
            rows={8}
          />
          <Field
            label="Hashtags (comma-separated, no # needed)"
            value={(poster.hashtags || []).join(", ")}
            onChange={(v) =>
              patch(
                "hashtags",
                v
                  .split(",")
                  .map((s) => s.trim().replace(/^#/, ""))
                  .filter(Boolean),
              )
            }
          />
        </div>

        <div className="sticky bottom-0 bg-ink-950/95 backdrop-blur py-4 mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => void save()}
            disabled={Boolean(busy) || status === "posted"}
            className="rounded-md border border-ink-600 px-3 py-2 text-sm"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => void exportPng()}
            disabled={Boolean(busy)}
            className="rounded-md bg-paper text-ink-950 font-semibold px-3 py-2 text-sm"
          >
            {busy === "png" ? "Rendering…" : "Export PNG"}
          </button>
          <button
            onClick={() => void copyCaption()}
            className="rounded-md border border-ink-600 px-3 py-2 text-sm"
          >
            Copy caption
          </button>
          {status === "approved" ? (
            <button
              onClick={() => void setApproved(false)}
              disabled={Boolean(busy)}
              className="rounded-md border border-ink-600 px-3 py-2 text-sm"
            >
              Unapprove
            </button>
          ) : status !== "posted" ? (
            <button
              onClick={() => void setApproved(true)}
              disabled={Boolean(busy)}
              className="rounded-md border border-brass text-brass px-3 py-2 text-sm"
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </button>
          ) : null}
          {status === "approved" ? (
            <button
              onClick={() => void publishNow()}
              disabled={Boolean(busy)}
              className="rounded-md border border-rust text-rust px-3 py-2 text-sm"
            >
              {busy === "publish" ? "Posting…" : "Publish now (LinkedIn)"}
            </button>
          ) : null}
        </div>
        <p className="text-xs text-[#6f6a62] pb-8">
          Publish now and the daily publish cron both refuse unless status is approved.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm text-[#b7aa98]">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md bg-ink-800 border border-ink-600 px-3 py-2 text-paper outline-none focus:border-brass"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm text-[#b7aa98]">
      {label}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md bg-ink-800 border border-ink-600 px-3 py-2 text-paper outline-none focus:border-brass"
      />
    </label>
  );
}
