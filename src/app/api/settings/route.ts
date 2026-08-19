import { NextResponse } from "next/server";
import { dbEngine } from "@/lib/db";
import { llmModel, llmProvider } from "@/lib/config";
import { linkedinConnected } from "@/lib/linkedin/client";
import { linkedinConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const { clientId } = linkedinConfig();
  return NextResponse.json({
    provider: llmProvider(),
    model:
      llmModel() ||
      {
        gemini: "gemini-2.0-flash",
        deepseek: "deepseek-chat",
        qwen: "qwen-plus",
        openrouter: "google/gemini-2.0-flash-001",
      }[llmProvider()] ||
      "default",
    db: dbEngine(),
    linkedinConnected: await linkedinConnected(),
    linkedinConfigured: Boolean(clientId),
  });
}
