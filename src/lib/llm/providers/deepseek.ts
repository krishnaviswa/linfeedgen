import { llmBaseUrl, llmModel } from "@/lib/config";
import type { PosterInput } from "@/lib/llm/types";
import { completeOpenAICompat } from "@/lib/llm/providers/openaiCompat";

export function completeDeepseek(input: PosterInput) {
  return completeOpenAICompat({
    input,
    baseUrl: llmBaseUrl() || "https://api.deepseek.com",
    model: llmModel() || "deepseek-chat",
  });
}
