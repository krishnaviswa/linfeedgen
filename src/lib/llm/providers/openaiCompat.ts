import { llmApiKey } from "@/lib/config";
import { AdapterError, type PosterInput } from "@/lib/llm/types";
import { posterSystemPrompt, posterUserPrompt } from "@/lib/llm/prompt";

export async function completeOpenAICompat(opts: {
  input: PosterInput;
  baseUrl: string;
  model: string;
  extraHeaders?: Record<string, string>;
}): Promise<string> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${llmApiKey()}`,
      ...opts.extraHeaders,
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: posterSystemPrompt() },
        { role: "user", content: posterUserPrompt(opts.input) },
      ],
    }),
  });

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new AdapterError(body.error?.message || `LLM HTTP ${res.status}`);
  }
  const text = body.choices?.[0]?.message?.content;
  if (!text) {
    throw new AdapterError("Provider returned no text");
  }
  return text;
}
