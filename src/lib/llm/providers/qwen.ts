import { llmBaseUrl, llmModel } from "@/lib/config";
import type { PosterInput } from "@/lib/llm/types";
import { completeOpenAICompat } from "@/lib/llm/providers/openaiCompat";

export function completeQwen(input: PosterInput) {
  return completeOpenAICompat({
    input,
    baseUrl:
      llmBaseUrl() ||
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: llmModel() || "qwen-plus",
  });
}
