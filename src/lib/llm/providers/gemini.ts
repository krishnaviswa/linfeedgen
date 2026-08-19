import { llmApiKey, llmBaseUrl, llmModel } from "@/lib/config";
import { AdapterError, type PosterInput } from "@/lib/llm/types";
import { posterSystemPrompt, posterUserPrompt } from "@/lib/llm/prompt";

const DEFAULT_MODEL = "gemini-2.0-flash";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

export async function completeGemini(input: PosterInput): Promise<string> {
  const model = llmModel() || DEFAULT_MODEL;
  const key = llmApiKey();
  const base =
    llmBaseUrl() || "https://generativelanguage.googleapis.com/v1beta";
  const url = `${base.replace(/\/$/, "")}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: posterSystemPrompt() }] },
      contents: [{ role: "user", parts: [{ text: posterUserPrompt(input) }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });

  const body = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    throw new AdapterError(body.error?.message || `Gemini HTTP ${res.status}`);
  }
  const text = body.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("");
  if (!text) {
    throw new AdapterError("Gemini returned no text");
  }
  return text;
}
