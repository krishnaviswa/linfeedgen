# Linfeedgen — Claude / Cursor project memory

**Sync rule:** `CLAUDE.md` and `AGENTS.md` must stay **byte-for-byte identical**. If you change one, change the other in the **same operation**. Also update `docs/ROLES.md` (and the README roles section) when roles or gates change. Cursor rule: `.cursor/rules/keep-claude-agents-sync.mdc`.

Personal LinkedIn studio. **3 posts/week.** This week’s sourced AI/data/architecture argument → Infography-style HTML poster → human approve → LinkedIn. No comment bots. No LinkedIn scrape.

## Product gates

- Nothing posts unless `status === "approved"`. Silent operator ≠ publish.
- LLM fills **JSON only**. Templates draw. No full-poster image models as the published asset.
- Generate routes import `completePoster()` only — never a vendor SDK.
- Bad JSON **fails closed**. Do not treat it as a draft you can publish.
- Default model: Gemini Flash via `LLM_PROVIDER=gemini`. Swap with env (`deepseek` / `qwen` / `openrouter`), not a rewrite.

## Roles (see `docs/ROLES.md`)

When implementing, name the role you are acting as. Do not skip **Validator**.

| Role | Owns | Must not |
| --- | --- | --- |
| **Content Creator** | Source pick, 2–3 poster variants, caption, sharp take | Approve, publish, invent trends |
| **Validator** | Source URL, JSON parse, approve-only publish, no scrape/bots | Auto-post, hype copy |
| **Designer** | `src/lib/posters/html.ts`, on-demand Playwright PNG | Always-on Chrome, AI-painted labels |
| **Tester** | Login → ingest → generate → export → approve/reject; build | Ship without the approve gate |
| **Publisher** | PNG+caption copy; LinkedIn OAuth cron for approved only | Likes/comments/DMs |
| **Platform** | Adapter, Railway+spend cap, SQLite local / Postgres prod | Redis, n8n-as-app, vector DB, agents |

Post order: Platform ingest → Creator → Designer → Validator → Tester → **human Approve** → Publisher.

## Stack pointers

- App: Next.js App Router (`src/app/**`)
- Adapter: `src/lib/llm/index.ts` + `src/lib/llm/providers/`
- Render: `src/lib/render/png.ts` (launch, paint, exit)
- Publish guard: `src/lib/linkedin/publish.ts` → `publishApprovedDraft`
- Ingest: `src/lib/feeds/ingest.ts` (public RSS/HN/arXiv only)
- Auth: one-user `APP_PASSWORD`
- Railway: [`docs/RAILWAY.md`](docs/RAILWAY.md)

## Every operation checklist

1. Edit `CLAUDE.md` and `AGENTS.md` together if instructions changed.
2. If roles/gates changed, update `docs/ROLES.md` and README “Roles” in the same change.
3. Prefer the smallest diff. Do not add n8n, Redis, agents, or image-gen poster paths unless the operator asked.
