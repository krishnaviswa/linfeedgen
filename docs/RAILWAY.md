# Railway setup

**Why this exists:** [`ARCHITECTURE.md`](ARCHITECTURE.md) (flow + what each Railway screen is for).

This file is the **click list** only.

## 1. Project

1. New Railway project → this GitHub repo (`krishnaviswa/linfeedgen`).
2. Builder must be **Dockerfile** (`Dockerfile` + Playwright image). If Railway picks Nixpacks, switch to Dockerfile.

## 2. Database (do **not** require Railway Postgres)

Railway **free** accounts often **cannot** add their Postgres plugin. You do not need it.

**Default (free / cheapest): SQLite on a volume**

1. Do **not** add PostgreSQL. Leave `DATABASE_URL` **unset**.
2. On the web service, add a **volume** mounted at `/data`.
3. Set `DATA_DIR=/data`. The app creates `/data/studio.db` plus PNGs.
4. Keep **one replica**. SQLite is for a single instance (this studio).

If the free plan also blocks **volumes**, either:

- Upgrade to Railway **Hobby ($5/mo)** and add the `/data` volume, still **no** Railway Postgres, or
- Use a **free hosted Postgres** and set `DATABASE_URL` yourself (see below). PNGs still want a volume; without one, images vanish on redeploy but drafts in Postgres remain.

**Optional later: Postgres you control (not Railway’s plugin)**

Set `DATABASE_URL` to a `postgres://…` URL from:

- [Neon](https://neon.tech) free
- [Supabase](https://supabase.com) free
- [CockroachDB serverless](https://www.cockroachlabs.com) / similar

The app switches automatically when the URL starts with `postgres://` or `postgresql://`.

**Skip:** paying Railway only to unlock their database addon.

## 3. Environment variables

| Variable | Required | Value |
| --- | --- | --- |
| `APP_PASSWORD` | yes | Solo login password |
| `SESSION_SECRET` | yes | Long random string |
| `CRON_SECRET` | yes | Long random string (cron + ingest) |
| `LLM_PROVIDER` | no | `gemini` (default). Later: `deepseek` / `qwen` / `openrouter` |
| `LLM_API_KEY` | to generate | Gemini key (or `GEMINI_API_KEY`) |
| `DATA_DIR` | yes on Railway | `/data` |
| `APP_URL` | after first URL | `https://<your-service>.up.railway.app` |
| `DATABASE_URL` | **omit on free** | Unset → SQLite at `$DATA_DIR/studio.db`. Set only if you use Neon/Supabase/etc. |

Generate a public HTTP URL on the web service. Health check: `/api/health`.

## 4. Spend cap

Project → Settings → Usage → **Spend Limit** → **$15–25**.

Hobby includes **$5** usage. Without a cap, a stuck PNG render can run.

## 5. Cron

Railway cron is UTC, minimum every 5 minutes. Header:

`Authorization: Bearer <CRON_SECRET>`

| When | URL | What it does |
| --- | --- | --- |
| Daily (e.g. `0 6 * * *`) | `GET https://<app>/api/cron/ingest` | Pull HN / arXiv RSS |
| Every 10–15 min | `GET https://<app>/api/cron/publish` | Posts **only** if a draft is `approved` **and** LinkedIn is connected; otherwise no-op |

You can skip ingest cron and click **Refresh feeds** in the app.

## 6. Prove the deploy

1. Open the public URL.
2. Sign in with `APP_PASSWORD`.
3. Refresh feeds (or wait for ingest).
4. Pick a source → generate 2–3 posters → edit → Export PNG / Copy caption → **Approve**.
5. Paste into LinkedIn yourself.

That is a complete v1. Nothing posts without Approve.

## Not Railway (pending later)

- **LinkedIn auto-post:** developer app, scope `w_member_social`, then:
  - `LINKEDIN_CLIENT_ID`
  - `LINKEDIN_CLIENT_SECRET`
  - `LINKEDIN_REDIRECT_URI` = `https://<app>/api/linkedin/callback`
  - Connect from **Settings** in the app.
- **Other models:** change `LLM_PROVIDER` + API key only. Do not rewrite the app.
- **Local try:** `npm run dev` with `.env.local` (SQLite if `DATABASE_URL` is unset).

No Redis, n8n, extra worker, or always-on Chrome. Playwright starts only when exporting a PNG.
