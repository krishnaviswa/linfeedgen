import fs from "node:fs";
import path from "node:path";
import { dataDir, databaseUrl, isPostgres } from "@/lib/config";

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    excerpt TEXT NOT NULL DEFAULT '',
    feed TEXT NOT NULL,
    ingested_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    layout TEXT NOT NULL,
    poster_json TEXT NOT NULL,
    caption TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    png_path TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    approved_at TEXT,
    posted_at TEXT,
    linkedin_urn TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS drafts_status_idx ON drafts (status, approved_at)`,
  `CREATE INDEX IF NOT EXISTS sources_ingested_idx ON sources (ingested_at)`,
];

type SqlClient = {
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<void>;
};

let client: SqlClient | null = null;
let migrated = false;

function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function sqliteClient(): Promise<SqlClient> {
  const { DatabaseSync } = await import("node:sqlite");
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "studio.db");
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  const bind = (params: unknown[]) => params as never[];
  return {
    async all<T>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).all(...bind(params)) as T[];
    },
    async get<T>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).get(...bind(params)) as T | undefined;
    },
    async run(sql: string, params: unknown[] = []) {
      db.prepare(sql).run(...bind(params));
    },
  };
}

async function postgresClient(): Promise<SqlClient> {
  const postgres = (await import("postgres")).default;
  const sql = postgres(databaseUrl()!, { max: 4 });
  const all = async <T>(query: string, params: unknown[] = []) => {
    const rows = await sql.unsafe(
      toPg(query),
      params as (string | number | boolean | null)[],
    );
    return [...rows] as T[];
  };
  return {
    all,
    async get<T>(query: string, params: unknown[] = []) {
      const rows = await all<T>(query, params);
      return rows[0];
    },
    async run(query: string, params: unknown[] = []) {
      await sql.unsafe(
        toPg(query),
        params as (string | number | boolean | null)[],
      );
    },
  };
}

export async function getDb(): Promise<SqlClient> {
  if (!client) {
    client = isPostgres() ? await postgresClient() : await sqliteClient();
  }
  if (!migrated) {
    for (const stmt of MIGRATIONS) {
      await client.run(stmt);
    }
    migrated = true;
  }
  return client;
}

export function dbEngine(): "postgres" | "sqlite" {
  return isPostgres() ? "postgres" : "sqlite";
}

export type SourceRow = {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  feed: string;
  ingested_at: string;
};

export type DraftStatus = "draft" | "approved" | "posted" | "rejected";

export type DraftRow = {
  id: string;
  source_id: string;
  layout: string;
  poster_json: string;
  caption: string;
  status: DraftStatus;
  png_path: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  posted_at: string | null;
  linkedin_urn: string | null;
};

export async function listSources(limit = 80): Promise<SourceRow[]> {
  const db = await getDb();
  return db.all<SourceRow>(
    "SELECT * FROM sources ORDER BY ingested_at DESC LIMIT ?",
    [limit],
  );
}

export async function getSource(id: string): Promise<SourceRow | undefined> {
  const db = await getDb();
  return db.get<SourceRow>("SELECT * FROM sources WHERE id = ?", [id]);
}

export async function insertSource(row: SourceRow): Promise<boolean> {
  const db = await getDb();
  try {
    await db.run(
      "INSERT INTO sources (id, title, url, excerpt, feed, ingested_at) VALUES (?, ?, ?, ?, ?, ?)",
      [row.id, row.title, row.url, row.excerpt, row.feed, row.ingested_at],
    );
    return true;
  } catch {
    return false;
  }
}

export async function listDrafts(opts?: {
  status?: DraftStatus;
  sourceId?: string;
}): Promise<DraftRow[]> {
  const db = await getDb();
  if (opts?.sourceId) {
    return db.all<DraftRow>(
      "SELECT * FROM drafts WHERE source_id = ? ORDER BY created_at DESC",
      [opts.sourceId],
    );
  }
  if (opts?.status) {
    return db.all<DraftRow>(
      "SELECT * FROM drafts WHERE status = ? ORDER BY approved_at DESC, created_at DESC",
      [opts.status],
    );
  }
  return db.all<DraftRow>("SELECT * FROM drafts ORDER BY created_at DESC LIMIT 200");
}

export async function getDraft(id: string): Promise<DraftRow | undefined> {
  const db = await getDb();
  return db.get<DraftRow>("SELECT * FROM drafts WHERE id = ?", [id]);
}

export async function insertDraft(row: DraftRow): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO drafts (
      id, source_id, layout, poster_json, caption, status, png_path,
      created_at, updated_at, approved_at, posted_at, linkedin_urn
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.source_id,
      row.layout,
      row.poster_json,
      row.caption,
      row.status,
      row.png_path,
      row.created_at,
      row.updated_at,
      row.approved_at,
      row.posted_at,
      row.linkedin_urn,
    ],
  );
}

export async function updateDraft(
  id: string,
  patch: Partial<
    Pick<
      DraftRow,
      | "poster_json"
      | "caption"
      | "status"
      | "png_path"
      | "layout"
      | "approved_at"
      | "posted_at"
      | "linkedin_urn"
    >
  >,
): Promise<DraftRow | undefined> {
  const current = await getDraft(id);
  if (!current) return undefined;
  const next: DraftRow = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const db = await getDb();
  await db.run(
    `UPDATE drafts SET
      poster_json = ?, caption = ?, status = ?, png_path = ?, layout = ?,
      updated_at = ?, approved_at = ?, posted_at = ?, linkedin_urn = ?
     WHERE id = ?`,
    [
      next.poster_json,
      next.caption,
      next.status,
      next.png_path,
      next.layout,
      next.updated_at,
      next.approved_at,
      next.posted_at,
      next.linkedin_urn,
      id,
    ],
  );
  return next;
}

export async function kvGet(key: string): Promise<string | undefined> {
  const db = await getDb();
  const row = await db.get<{ value: string }>(
    "SELECT value FROM kv WHERE key = ?",
    [key],
  );
  return row?.value;
}

export async function kvSet(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.run(
    "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}

export async function kvDel(key: string): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM kv WHERE key = ?", [key]);
}
