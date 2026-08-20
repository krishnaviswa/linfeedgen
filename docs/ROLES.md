# Studio roles

These roles are how work is split. The human operator still **approves** every post. Agents and contributors pick a role (or rotate) and do not skip Validator.

Canonical copy lives here. `CLAUDE.md` and `AGENTS.md` must match each other. README summarizes; this file is the checklist.

## Content Creator

**Job:** turn this week’s sourced industry argument into poster JSON + a LinkedIn caption.

**Does**

- Pick a public source (RSS / HN / arXiv). Never invent a trend. Never scrape LinkedIn.
- Call `completePoster()` only — never a vendor SDK in routes.
- Produce 2–3 layout variants (story, process, versus, stats, architecture).
- Sharp take, not an article summary. Short lines. Architect tone.

**Does not**

- Approve or publish.
- Draw posters with image models.
- Hard-code Gemini (or any vendor) outside `src/lib/llm/providers/`.

**Done when:** draft exists with valid `PosterJson`, source URL, caption, and preview.

## Validator

**Job:** keep posts contextually accurate and fail closed.

**Does**

- Require a real source URL on every draft.
- Reject bad JSON (`parsePosterJson` / `parseStoredPoster`). No publishable draft from garbage.
- Check headline, blocks, and diagram labels match the source (no fake Kafka boxes).
- Enforce **approve-only** LinkedIn: `status === "approved"` in `publishApprovedDraft`.
- Block comment bots, engagement pods, LinkedIn scrape.

**Does not**

- Rewrite voice to hype (“excited to share”, emoji walls).
- Auto-post if the operator is silent.

**Done when:** draft is `approved` or `rejected` with a reason. Cron publish is a no-op otherwise.

## Designer

**Job:** Infography-like posters: tall, high contrast, readable type. Templates draw; the model only fills text.

**Does**

- Own `src/lib/posters/html.ts` layouts and brand (two colors, footer name).
- Keep text as real HTML/CSS — never a full-poster AI painting as the published asset.
- Architecture cards: editable boxes/arrows with correct names.
- Playwright PNG is **on demand** (`src/lib/render/png.ts`): launch, paint, exit.

**Does not**

- Run always-on Chromium.
- Add random one-off styles that break the profile look.

**Done when:** PNG export matches the JSON, letters are sharp, layout is 1080-class portrait.

## Tester

**Job:** prove the loop before Railway.

**Does**

- Login, ingest feeds, generate, edit, export PNG, copy caption, approve, reject.
- Confirm generate fails closed on bad LLM JSON.
- Confirm publish/cron refuse `draft` / `rejected`.
- Confirm `LLM_PROVIDER` switch (gemini default; deepseek / qwen / openrouter adapters exist).
- Smoke `npm run build` / typecheck after behavior changes.

**Does not**

- Ship without checking the approve gate.

**Done when:** local path works without Postgres; Railway free path is SQLite on `/data` (see `docs/RAILWAY.md`).

## Publisher (needed)

**Job:** get an approved poster onto LinkedIn without extra automation.

**Does**

- v1: download PNG + copy caption.
- v2: OAuth (`w_member_social`), token in DB, cron `/api/cron/publish` only for approved rows.
- Copy-paste remains if OAuth is unset.

**Does not**

- Like, comment, or DM. Rate-limit is irrelevant at 3 posts/week; still no spray.

## Platform (needed)

**Job:** keep the adapter, host, and cost boring.

**Does**

- LLM adapter: `completePoster(input) → PosterJson`. New Chinese/other models = new file under `providers/` + env.
- Railway: web + volume `/data` + **spend cap $15–25**. SQLite if `DATABASE_URL` unset. Optional Neon/Supabase Postgres later.
- No Redis, n8n-as-app, vector DB, or agents in v1.

---

## Role order for one post

1. Platform — feeds ingested  
2. Creator — generate variants  
3. Designer — template/PNG looks right  
4. Validator — source + claims  
5. Tester — export/approve guards  
6. Human operator — Approve  
7. Publisher — copy-paste or cron  
