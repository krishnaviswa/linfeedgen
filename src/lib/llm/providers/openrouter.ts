import { llmBaseUrl, llmModel } from "@/lib/config";
import type { PosterInput } from "@/lib/llm/types";
import { completeOpenAICompat } from "@/lib/llm/providers/openaiCompat";

export function completeOpenrouter(input: PosterInput) {
  return completeOpenAICompat({
    input,
    baseUrl: llmBaseUrl() || "https://openrouter.ai/api/v1",
    model: llmModel() || "google/gemini-2.0-flash-001",
    extraHeaders: {
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "linfeedgen",
    },
  });
}
