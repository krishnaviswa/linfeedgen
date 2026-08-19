"use client";

import { useEffect, useState } from "react";

type Settings = {
  provider: string;
  model: string;
  db: string;
  linkedinConnected: boolean;
  linkedinConfigured: boolean;
};

export function SettingsPanel() {
  const [s, setS] = useState<Settings | null>(null);
  const [notice, setNotice] = useState("");

  async function load() {
    const res = await fetch("/api/settings");
    setS(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function disconnect() {
    await fetch("/api/linkedin/disconnect", { method: "POST" });
    setNotice("LinkedIn disconnected.");
    await load();
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-serif text-4xl">Settings</h1>
      <p className="text-[#b7aa98] mt-1">
        Swap models with env vars. The review UI does not change.
      </p>
      {notice ? <p className="text-brass text-sm mt-4">{notice}</p> : null}

      <section className="mt-10 rounded-xl border border-ink-700 p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-brass">LLM adapter</h2>
        <dl className="mt-4 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt className="text-[#8a7d6d]">LLM_PROVIDER</dt>
          <dd>{s?.provider || "…"}</dd>
          <dt className="text-[#8a7d6d]">LLM_MODEL</dt>
          <dd>{s?.model || "…"}</dd>
          <dt className="text-[#8a7d6d]">Database</dt>
          <dd>{s?.db || "…"}</dd>
        </dl>
        <p className="text-sm text-[#b7aa98] mt-4">
          Later: <code className="text-paper">LLM_PROVIDER=deepseek</code> /{" "}
          <code className="text-paper">qwen</code> /{" "}
          <code className="text-paper">openrouter</code> plus{" "}
          <code className="text-paper">LLM_API_KEY</code> and optional{" "}
          <code className="text-paper">LLM_MODEL</code>.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-ink-700 p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-brass">LinkedIn</h2>
        <p className="text-sm text-[#b7aa98] mt-3">
          Copy-paste export always works. The API path only fires for{" "}
          <strong className="text-paper font-medium">approved</strong> drafts.
        </p>
        <p className="text-sm mt-3">
          Status:{" "}
          {s?.linkedinConnected
            ? "connected"
            : s?.linkedinConfigured
              ? "configured, not connected"
              : "not configured"}
        </p>
        <div className="mt-4 flex gap-2">
          {s?.linkedinConfigured ? (
            <a
              href="/api/linkedin/start"
              className="rounded-md bg-paper text-ink-950 font-semibold px-3 py-2 text-sm"
            >
              Connect LinkedIn
            </a>
          ) : null}
          {s?.linkedinConnected ? (
            <button
              onClick={() => void disconnect()}
              className="rounded-md border border-ink-600 px-3 py-2 text-sm"
            >
              Disconnect
            </button>
          ) : null}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-ink-700 p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-brass">
          Railway spend cap
        </h2>
        <p className="text-sm text-[#b7aa98] mt-3 leading-relaxed">
          Hobby includes $5 usage. Set a hard spend limit in the Railway project:
          Settings → Usage → Spend Limit. $15–25/mo is enough for this studio.
          Always-on Chromium is not used; Playwright starts only when you export a PNG.
        </p>
      </section>
    </div>
  );
}
