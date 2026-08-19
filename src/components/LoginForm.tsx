"use client";

import { useState } from "react";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Wrong password.");
      return;
    }
    window.location.href = nextPath.startsWith("/") ? nextPath : "/";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm text-[#b7aa98]">
        Studio password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2.5 outline-none focus:border-brass"
        />
      </label>
      {error ? <p className="text-rust text-sm">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-paper text-ink-950 font-semibold py-2.5 hover:bg-white disabled:opacity-60"
      >
        {busy ? "Opening…" : "Enter"}
      </button>
    </form>
  );
}
