import type { LayoutId, PosterInput } from "@/lib/llm/types";

const LAYOUT_HINT: Record<LayoutId, string> = {
  story: "Narrative beats in order. Each block is a scene: title = beat name, body = one sharp sentence.",
  process: "Sequential steps a practitioner would actually take. Titles are short verbs. Keep order causal.",
  versus: "Split the 4–7 blocks into two camps (first half vs second half). Contrast a real tradeoff, not a strawman.",
  stats: "Lead with numbers. Put the figure in metric (or in title). Body is the claim the number supports. Inventing precise fake stats is forbidden — use qualitative magnitudes or clearly labeled ranges if the source has no numbers.",
  architecture: "Layers or pipeline from input to output. Titles are component names. Body is what that layer does. Top block is the top of the stack.",
};

export function posterSystemPrompt(): string {
  return [
    "You write Infography-style LinkedIn poster copy for a practitioner who posts 3 times a week.",
    "Return ONLY a JSON object. No markdown, no preamble.",
    "Voice: specific, slightly opinionated, no hype adjectives, no 'delve', no 'landscape', no emoji.",
    "The poster is HTML/CSS later — you only supply text. Do not describe colors or images.",
    "JSON keys: kicker, headline, subhead, blocks, footer, caption, hashtags.",
    "blocks: array of 4 to 7 objects { title, body, metric? }.",
    "caption: LinkedIn post body, 500–1300 characters, line breaks as \\n, ends with a question or a concrete takeaway. Include 3–6 hashtags inside the hashtags array (no # in the strings).",
    "headline: max ~10 words. kicker: 2–5 words, uppercase-friendly. footer: source hint, not a URL spam.",
    "Fail closed: if the source is too thin, still produce a rigorous argument from the title + excerpt without inventing paper results.",
  ].join(" ");
}

export function posterUserPrompt(input: PosterInput): string {
  return [
    `Layout: ${input.layout}`,
    `Layout rules: ${LAYOUT_HINT[input.layout]}`,
    `Source title: ${input.title}`,
    `Source URL: ${input.url}`,
    `Source feed: ${input.feed || "unknown"}`,
    `Excerpt: ${input.excerpt || "(none)"}`,
    "Write poster JSON for this source and layout.",
  ].join("\n");
}
