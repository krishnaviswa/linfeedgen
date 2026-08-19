import fs from "node:fs/promises";
import path from "node:path";
import { dataDir } from "@/lib/config";
import { posterDocument, POSTER_SIZE } from "@/lib/posters/html";
import type { PosterJson } from "@/lib/llm/types";

/**
 * Launch Chromium, paint one poster, write PNG, close the browser.
 * Never keep a browser process around between jobs.
 */
export async function renderPosterPng(
  draftId: string,
  poster: PosterJson,
): Promise<{ absPath: string; relative: string; bytes: Buffer }> {
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error("Playwright is not installed. Run: npx playwright install chromium");
  }
  const dir = path.join(dataDir(), "pngs");
  await fs.mkdir(dir, { recursive: true });
  const relative = path.join("pngs", `${draftId}.png`);
  const absPath = path.join(dataDir(), relative);

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "launch failed";
    throw new Error(
      `Could not start Chromium for PNG render (${msg}). Local: npx playwright install chromium`,
    );
  }
  try {
    const page = await browser.newPage({
      viewport: POSTER_SIZE,
      deviceScaleFactor: 1,
    });
    await page.setContent(posterDocument(poster), { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await new Promise((r) => setTimeout(r, 120));
    const bytes = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, ...POSTER_SIZE },
    });
    await fs.writeFile(absPath, bytes);
    return { absPath, relative: relative.replaceAll("\\", "/"), bytes };
  } finally {
    await browser.close();
  }
}
