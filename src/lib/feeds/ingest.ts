import { XMLParser } from "fast-xml-parser";
import { insertSource } from "@/lib/db";

export const FEEDS = [
  {
    id: "hn-ai",
    name: "Hacker News",
    url: "https://hnrss.org/newest?q=AI+OR+LLM+OR+%22machine+learning%22+OR+dataset",
  },
  {
    id: "arxiv-ai",
    name: "arXiv cs.AI",
    url: "https://rss.arxiv.org/rss/cs.AI",
  },
  {
    id: "arxiv-lg",
    name: "arXiv cs.LG",
    url: "https://rss.arxiv.org/rss/cs.LG",
  },
  {
    id: "arxiv-cl",
    name: "arXiv cs.CL",
    url: "https://rss.arxiv.org/rss/cs.CL",
  },
] as const;

type RssItem = {
  title?: string;
  link?: string | { href?: string };
  description?: string;
  summary?: string;
  id?: string;
  guid?: string | { "#text"?: string };
};

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function linkOf(item: RssItem): string {
  if (typeof item.link === "string") return item.link.trim();
  if (item.link && typeof item.link === "object" && item.link.href) {
    return item.link.href.trim();
  }
  if (typeof item.guid === "string" && item.guid.startsWith("http")) {
    return item.guid;
  }
  if (item.guid && typeof item.guid === "object" && item.guid["#text"]) {
    return item.guid["#text"];
  }
  return "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFeed(url: string): Promise<RssItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "linfeedgen/0.1 (personal studio)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Feed HTTP ${res.status} for ${url}`);
  }
  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const rss = doc.rss as { channel?: { item?: RssItem | RssItem[] } } | undefined;
  if (rss?.channel?.item) return asArray(rss.channel.item);
  const feed = doc.feed as { entry?: RssItem | RssItem[] } | undefined;
  if (feed?.entry) return asArray(feed.entry);
  return [];
}

export async function ingestFeeds(perFeed = 8): Promise<{
  inserted: number;
  feeds: Array<{ id: string; ok: boolean; error?: string; added: number }>;
}> {
  const reports: Array<{ id: string; ok: boolean; error?: string; added: number }> =
    [];
  let inserted = 0;
  const now = new Date().toISOString();

  for (const feed of FEEDS) {
    try {
      const items = await fetchFeed(feed.url);
      let added = 0;
      for (const item of items.slice(0, perFeed)) {
        const url = linkOf(item);
        const title = stripHtml(String(item.title || "")).slice(0, 300);
        if (!url || !title) continue;
        const excerpt = stripHtml(
          String(item.description || item.summary || ""),
        ).slice(0, 1200);
        const ok = await insertSource({
          id: crypto.randomUUID(),
          title,
          url,
          excerpt,
          feed: feed.id,
          ingested_at: now,
        });
        if (ok) {
          added += 1;
          inserted += 1;
        }
      }
      reports.push({ id: feed.id, ok: true, added });
    } catch (err) {
      reports.push({
        id: feed.id,
        ok: false,
        added: 0,
        error: err instanceof Error ? err.message : "feed failed",
      });
    }
  }

  return { inserted, feeds: reports };
}
