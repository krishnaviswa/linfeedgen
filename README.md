# Linfeedgen

Personal LinkedIn studio: **3 posts/week**. This week’s AI/data argument → Infography-style poster → you approve → LinkedIn.

Nothing posts unless a draft is **approved**. There are no comment bots and no LinkedIn scraping. Sources come from public RSS (Hacker News + arXiv).

## Roles

Work is split so copy, facts, look, and publish stay separate. The human still clicks **Approve**. Full checklists: [`docs/ROLES.md`](docs/ROLES.md). Agent memory: [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md) (must stay identical).

| Role | Does | Stops at |
| --- | --- | --- |
| **Content Creator** | Pick a sourced topic, generate 2–3 poster variants, write the caption | Does not approve or post |
| **Validator** | Source URL, true claims, fail-closed JSON, approve-only LinkedIn | Does not invent trends or auto-post |
| **Designer** | HTML/CSS templates, on-demand PNG, consistent brand | Does not paint posters with image models |
| **Tester** | Login → ingest → generate → export → approve/reject | Does not skip the approve gate |
| **Publisher** | Copy PNG + caption, or LinkedIn cron after approve | No likes, comments, or DMs |
| **Platform** | LLM adapter, Railway, spend cap | No Redis, n8n-as-app, or agents |

One post: ingest → create → design → validate → test → **you approve** → publish.

When roles or product gates change, update `docs/ROLES.md`, this section, `CLAUDE.md`, and `AGENTS.md` in the **same change**.

## Stack

- Next.js App Router
- SQLite locally, Postgres on Railway (`DATABASE_URL`)
- One-user password auth
- LLM **adapter** (default Gemini Flash). Generate routes never import a vendor SDK.
- HTML/CSS poster templates (story / process / versus / stats / architecture)
- Playwright starts, draws a PNG, exits — not an always-on Chromium process
- No n8n, Redis, agents, or vector DB

## Local run

```bash
npm install
npx playwright install chromium
cp .env.example .env.local
```

Edit `.env.local` (required: `APP_PASSWORD`, `SESSION_SECRET`, `LLM_API_KEY`).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, **Refresh feeds**, pick a source, generate 2–3 variants, edit copy, **Export PNG** / **Copy caption**, **Approve**.

If `DATABASE_URL` is unset, SQLite is created at `./data/studio.db` via Node's built-in `node:sqlite` (no native addon).

## Env vars

| Variable | Required | Notes |
|---|---|---|
| `APP_PASSWORD` | yes | Solo login |
| `SESSION_SECRET` | yes | Cookie HMAC |
| `LLM_API_KEY` | to generate | Also accepts `GEMINI_API_KEY` |
| `LLM_PROVIDER` | no | Default `gemini`. Later: `deepseek`, `qwen`, `openrouter` |
| `LLM_MODEL` | no | Provider default if omitted |
| `LLM_BASE_URL` | no | Override API host |
| `DATABASE_URL` | Railway | `postgres://…` → Postgres; omit → SQLite |
| `DATA_DIR` | no | Default `./data`. Mount a Railway volume here |
| `CRON_SECRET` | Railway cron | Bearer / `x-cron-secret` / `?secret=` |
| `LINKEDIN_CLIENT_ID` | optional | Copy-paste export works without LinkedIn |
| `LINKEDIN_CLIENT_SECRET` | optional | |
| `LINKEDIN_REDIRECT_URI` | optional | Must match the LinkedIn app exactly |
| `APP_URL` | optional | Public origin, e.g. `https://….up.railway.app` |

### Switch models later (no rewrite)

```env
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
LLM_API_KEY=…

# later
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
LLM_API_KEY=…

# or
LLM_PROVIDER=qwen
LLM_MODEL=qwen-plus

# or
LLM_PROVIDER=openrouter
LLM_MODEL=google/gemini-2.0-flash-001
```

The adapter contract is `completePoster(input) → PosterJson`. Bad JSON **fails closed**: the UI shows an error, no draft is treated as publishable, LinkedIn is not called.

## Railway

1. New project → this repo.
2. Add **PostgreSQL**. Railway sets `DATABASE_URL`.
3. Add a **volume** mounted at `/data`. Set `DATA_DIR=/data`.
4. Deploy with the included `Dockerfile` (Playwright base image so Chromium exists on disk; the app still only launches it during PNG export).
5. Set env vars from the table above. `APP_URL` = your public `https://…up.railway.app`.
6. **Spend cap:** Project → Settings → Usage → **Spend Limit**. Hobby includes **$5** usage. Cap at **$15–25**. This studio should sit ~$10–25/mo (web + Postgres + Gemini Flash), not Taplio money.
7. Two HTTP cron jobs (Authorization: `Bearer $CRON_SECRET`):
   - Daily ingest: `GET/POST https://<app>/api/cron/ingest`
   - After you approve: `GET/POST https://<app>/api/cron/publish` (no-ops if nothing is approved or LinkedIn is disconnected)

Publish cron will **not** post `draft` or `rejected` items. Manual **Publish now** on a draft uses the same guard.

## LinkedIn

v1: download PNG + copy caption.

v2: create a LinkedIn app (scope `openid profile w_member_social`), set redirect URI, connect from Settings. Tokens sit in the database, not in git.

## Cost notes

Wasted money this repo avoids: always-on Chrome, painting diagrams with image models, Redis, n8n Cloud. Image-gen models are out of the default poster path (wrong labels). The LLM fills **text/layout JSON** only; templates draw.

## Docs for agents

- [`docs/ROLES.md`](docs/ROLES.md) — Creator, Validator, Designer, Tester, Publisher, Platform
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) — same file; keep in lockstep on every operation
- [`.cursor/rules/`](.cursor/rules/) — Cursor always-on rules (sync + roles)
