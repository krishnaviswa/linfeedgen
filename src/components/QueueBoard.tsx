"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LAYOUT_LABEL } from "@/lib/caption";

type Draft = {
  id: string;
  layout: string;
  status: string;
  approved_at: string | null;
  posted_at: string | null;
  linkedin_urn: string | null;
  poster: { headline: string } | null;
};

export function QueueBoard() {
  const [approved, setApproved] = useState<Draft[]>([]);
  const [posted, setPosted] = useState<Draft[]>([]);
  const [notice, setNotice] = useState("");

  async function load() {
    const [a, p] = await Promise.all([
      fetch("/api/drafts?status=approved").then((r) => r.json()),
      fetch("/api/drafts?status=posted").then((r) => r.json()),
    ]);
    setApproved(a.drafts || []);
    setPosted(p.drafts || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function runPublishCron() {
    const res = await fetch("/api/cron/publish", { method: "POST" });
    const json = await res.json();
    setNotice(json.error || json.skipped || (json.urn ? `Posted ${json.urn}` : "Done"));
    await load();
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl">Queue</h1>
          <p className="text-[#b7aa98] mt-1">
            Approved drafts only. Cron will not post drafts or rejected items.
          </p>
        </div>
        <button
          onClick={() => void runPublishCron()}
          className="rounded-md border border-ink-600 px-3 py-2 text-sm hover:border-brass"
        >
          Run publish cron
        </button>
      </div>
      {notice ? <p className="text-brass text-sm mt-4">{notice}</p> : null}

      <h2 className="mt-10 text-xs uppercase tracking-[0.18em] text-brass">Approved</h2>
      <List items={approved} empty="Nothing approved." />

      <h2 className="mt-10 text-xs uppercase tracking-[0.18em] text-brass">Posted</h2>
      <List items={posted} empty="Nothing posted yet." />
    </div>
  );
}

function List({ items, empty }: { items: Draft[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-[#8a7d6d] mt-3">{empty}</p>;
  }
  return (
    <ul className="mt-3 space-y-2">
      {items.map((d) => (
        <li key={d.id}>
          <Link
            href={`/drafts/${d.id}`}
            className="block rounded-lg border border-ink-700 px-4 py-3 hover:border-brass"
          >
            <div className="text-xs uppercase tracking-wider text-brass">
              {LAYOUT_LABEL[d.layout] || d.layout}
              {d.linkedin_urn ? ` · ${d.linkedin_urn}` : ""}
            </div>
            <div className="font-serif text-xl mt-1">
              {d.poster?.headline || "—"}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
