import type { LayoutId, PosterJson } from "@/lib/llm/types";

const W = 1080;
const H = 1350;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseCss(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Source+Sans+3:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #111; }
    .poster {
      width: ${W}px; height: ${H}px;
      font-family: "Source Sans 3", sans-serif;
      position: relative;
      overflow: hidden;
    }
    .kicker {
      font-size: 18px; letter-spacing: 0.22em; text-transform: uppercase;
      font-weight: 700;
    }
    .headline {
      font-family: Fraunces, Georgia, serif;
      font-weight: 650;
      line-height: 1.05;
      letter-spacing: -0.03em;
    }
    .sub { font-size: 28px; line-height: 1.35; }
    .foot {
      position: absolute; left: 64px; right: 64px; bottom: 48px;
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: 16px; letter-spacing: 0.08em; text-transform: uppercase;
    }
  `;
}

function storyHtml(p: PosterJson): string {
  const blocks = p.blocks
    .map(
      (b, i) => `
      <div class="beat">
        <div class="n">${String(i + 1).padStart(2, "0")}</div>
        <div>
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.body)}</p>
        </div>
      </div>`,
    )
    .join("");
  return `
    <style>
      ${baseCss()}
      .poster { background: #f3ecde; color: #1c1710; }
      .inner { padding: 72px 64px 110px; height: 100%; display: flex; flex-direction: column; }
      .kicker { color: #c45c26; margin-bottom: 18px; }
      .headline { font-size: 64px; max-width: 980px; }
      .sub { margin-top: 18px; color: #5a5146; max-width: 860px; }
      .rule { height: 2px; background: #1c1710; opacity: 0.12; margin: 36px 0 28px; }
      .beats { display: flex; flex-direction: column; gap: 22px; flex: 1; }
      .beat { display: grid; grid-template-columns: 70px 1fr; gap: 18px; }
      .n { font-family: Fraunces, serif; font-size: 28px; color: #c45c26; }
      h3 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
      .beat p { font-size: 22px; color: #3f382f; line-height: 1.4; }
      .foot { color: #8a7d6d; }
    </style>
    <div class="poster"><div class="inner">
      <div class="kicker">${esc(p.kicker || "The argument")}</div>
      <h1 class="headline">${esc(p.headline)}</h1>
      ${p.subhead ? `<p class="sub">${esc(p.subhead)}</p>` : ""}
      <div class="rule"></div>
      <div class="beats">${blocks}</div>
    </div>
    <div class="foot"><span>${esc(p.footer || "")}</span><span>Story</span></div>
    </div>`;
}

function processHtml(p: PosterJson): string {
  const blocks = p.blocks
    .map(
      (b, i) => `
      <div class="step">
        <div class="idx">${i + 1}</div>
        <div class="card">
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.body)}</p>
        </div>
      </div>`,
    )
    .join("");
  return `
    <style>
      ${baseCss()}
      .poster { background: #0e1a24; color: #e8f1f6; }
      .inner { padding: 72px 64px 110px; height: 100%; display: flex; flex-direction: column; }
      .kicker { color: #5ad0c8; margin-bottom: 16px; }
      .headline { font-size: 58px; }
      .sub { margin-top: 14px; color: #9bb3c2; }
      .steps { margin-top: 36px; display: flex; flex-direction: column; gap: 16px; flex: 1; }
      .step { display: grid; grid-template-columns: 56px 1fr; gap: 16px; align-items: stretch; }
      .idx {
        width: 56px; height: 56px; border-radius: 999px; background: #5ad0c8; color: #0e1a24;
        font-weight: 700; font-size: 22px; display: flex; align-items: center; justify-content: center;
        margin-top: 8px;
      }
      .card { background: #152533; border: 1px solid #264155; border-radius: 16px; padding: 20px 24px; }
      h3 { font-size: 24px; margin-bottom: 6px; }
      .card p { font-size: 20px; color: #c5d5e0; line-height: 1.4; }
      .foot { color: #6f8b9c; }
    </style>
    <div class="poster"><div class="inner">
      <div class="kicker">${esc(p.kicker || "Process")}</div>
      <h1 class="headline">${esc(p.headline)}</h1>
      ${p.subhead ? `<p class="sub">${esc(p.subhead)}</p>` : ""}
      <div class="steps">${blocks}</div>
    </div>
    <div class="foot"><span>${esc(p.footer || "")}</span><span>Process</span></div>
    </div>`;
}

function versusHtml(p: PosterJson): string {
  const mid = Math.ceil(p.blocks.length / 2);
  const left = p.blocks.slice(0, mid);
  const right = p.blocks.slice(mid);
  const col = (items: PosterJson["blocks"], label: string) => `
    <div class="col">
      <div class="label">${esc(label)}</div>
      ${items
        .map(
          (b) => `
        <div class="item">
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.body)}</p>
        </div>`,
        )
        .join("")}
    </div>`;
  return `
    <style>
      ${baseCss()}
      .poster { background: #161412; color: #f3ece1; }
      .inner { padding: 64px 48px 110px; height: 100%; display: flex; flex-direction: column; }
      .kicker { color: #c4a574; margin-bottom: 14px; }
      .headline { font-size: 56px; }
      .sub { margin-top: 12px; color: #b7aa98; }
      .split { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 0; flex: 1; min-height: 0; }
      .col { padding: 28px 32px; }
      .col:first-child { background: #f3ece1; color: #1a1612; border-radius: 20px 0 0 20px; }
      .col:last-child { background: #2a231c; color: #f3ece1; border-radius: 0 20px 20px 0; }
      .label { font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; margin-bottom: 22px; opacity: 0.7; }
      .item { margin-bottom: 22px; }
      h3 { font-size: 24px; margin-bottom: 6px; }
      .item p { font-size: 19px; line-height: 1.4; opacity: 0.85; }
      .foot { color: #8a7d6d; }
    </style>
    <div class="poster"><div class="inner">
      <div class="kicker">${esc(p.kicker || "Versus")}</div>
      <h1 class="headline">${esc(p.headline)}</h1>
      ${p.subhead ? `<p class="sub">${esc(p.subhead)}</p>` : ""}
      <div class="split">
        ${col(left, left[0]?.title ? "Side A" : "A")}
        ${col(right, "Side B")}
      </div>
    </div>
    <div class="foot"><span>${esc(p.footer || "")}</span><span>Versus</span></div>
    </div>`;
}

function statsHtml(p: PosterJson): string {
  const blocks = p.blocks
    .map(
      (b) => `
      <div class="stat">
        <div class="metric">${esc(b.metric || b.title)}</div>
        <div class="label">${esc(b.metric ? b.title : "")}</div>
        <p>${esc(b.body)}</p>
      </div>`,
    )
    .join("");
  return `
    <style>
      ${baseCss()}
      .poster { background: #0c0c0c; color: #f7f4ee; }
      .inner { padding: 68px 56px 110px; height: 100%; display: flex; flex-direction: column; }
      .kicker { color: #e8c547; margin-bottom: 14px; }
      .headline { font-size: 54px; }
      .sub { margin-top: 12px; color: #a9a297; }
      .grid { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px; flex: 1; }
      .stat { background: #171717; border: 1px solid #2a2a2a; border-radius: 18px; padding: 22px 24px; }
      .metric { font-family: Fraunces, serif; font-size: 42px; color: #e8c547; letter-spacing: -0.03em; }
      .label { font-size: 16px; letter-spacing: 0.12em; text-transform: uppercase; color: #8d877c; margin: 6px 0 10px; }
      .stat p { font-size: 18px; color: #d5cfc3; line-height: 1.4; }
      .foot { color: #6f6a62; }
    </style>
    <div class="poster"><div class="inner">
      <div class="kicker">${esc(p.kicker || "Numbers")}</div>
      <h1 class="headline">${esc(p.headline)}</h1>
      ${p.subhead ? `<p class="sub">${esc(p.subhead)}</p>` : ""}
      <div class="grid">${blocks}</div>
    </div>
    <div class="foot"><span>${esc(p.footer || "")}</span><span>Stats</span></div>
    </div>`;
}

function architectureHtml(p: PosterJson): string {
  const blocks = p.blocks
    .map(
      (b, i) => `
      <div class="layer">
        <div class="meta">
          <span>L${i + 1}</span>
          ${i < p.blocks.length - 1 ? `<span class="arrow">↓</span>` : ""}
        </div>
        <div class="box">
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.body)}</p>
        </div>
      </div>`,
    )
    .join("");
  return `
    <style>
      ${baseCss()}
      .poster { background: #102033; color: #e6eef6; }
      .poster::before {
        content: ""; position: absolute; inset: 0;
        background-image: linear-gradient(#1c3a55 1px, transparent 1px),
          linear-gradient(90deg, #1c3a55 1px, transparent 1px);
        background-size: 48px 48px; opacity: 0.35;
      }
      .inner { padding: 68px 56px 110px; height: 100%; display: flex; flex-direction: column; position: relative; }
      .kicker { color: #7eb6ff; margin-bottom: 14px; }
      .headline { font-size: 52px; }
      .sub { margin-top: 12px; color: #9db4c9; }
      .stack { margin-top: 28px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
      .layer { display: grid; grid-template-columns: 54px 1fr; gap: 12px; }
      .meta { display: flex; flex-direction: column; align-items: center; color: #7eb6ff; font-size: 13px; letter-spacing: 0.12em; padding-top: 16px; }
      .arrow { margin-top: 8px; opacity: 0.6; }
      .box {
        background: rgba(16, 40, 64, 0.85); border: 1px solid #3a6a96;
        border-radius: 14px; padding: 16px 22px;
      }
      h3 { font-size: 22px; margin-bottom: 4px; }
      .box p { font-size: 18px; color: #c5d7e8; line-height: 1.35; }
      .foot { color: #7d97ad; }
    </style>
    <div class="poster"><div class="inner">
      <div class="kicker">${esc(p.kicker || "Architecture")}</div>
      <h1 class="headline">${esc(p.headline)}</h1>
      ${p.subhead ? `<p class="sub">${esc(p.subhead)}</p>` : ""}
      <div class="stack">${blocks}</div>
    </div>
    <div class="foot"><span>${esc(p.footer || "")}</span><span>Architecture</span></div>
    </div>`;
}

const RENDERERS: Record<LayoutId, (p: PosterJson) => string> = {
  story: storyHtml,
  process: processHtml,
  versus: versusHtml,
  stats: statsHtml,
  architecture: architectureHtml,
};

export function posterDocument(poster: PosterJson): string {
  const inner = RENDERERS[poster.layout](poster);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>poster</title></head>
<body>${inner}</body></html>`;
}

export const POSTER_SIZE = { width: W, height: H };
