import { llmProvider } from "@/lib/config";
import {
  AdapterError,
  parsePosterJson,
  type PosterInput,
  type PosterJson,
} from "@/lib/llm/types";
import { completeGemini } from "@/lib/llm/providers/gemini";
import { completeDeepseek } from "@/lib/llm/providers/deepseek";
import { completeQwen } from "@/lib/llm/providers/qwen";
import { completeOpenrouter } from "@/lib/llm/providers/openrouter";

/**
 * Single entry for all generate paths. Routes must import this — never a vendor SDK.
 */
export async function completePoster(input: PosterInput): Promise<PosterJson> {
  const provider = llmProvider();
  let raw: string;
  switch (provider) {
    case "gemini":
      raw = await completeGemini(input);
      break;
    case "deepseek":
      raw = await completeDeepseek(input);
      break;
    case "qwen":
      raw = await completeQwen(input);
      break;
    case "openrouter":
      raw = await completeOpenrouter(input);
      break;
    default:
      throw new AdapterError(
        `Unknown LLM_PROVIDER "${provider}". Use gemini, deepseek, qwen, or openrouter.`,
      );
  }
  return parsePosterJson(raw, input.layout);
}

export { AdapterError } from "@/lib/llm/types";
export type { PosterInput, PosterJson, LayoutId } from "@/lib/llm/types";
export { LAYOUTS } from "@/lib/llm/types";
