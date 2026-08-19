function requiredInProd(name: string): string | undefined {
  return process.env[name];
}

export function dataDir(): string {
  return process.env.DATA_DIR?.trim() || `${process.cwd()}/data`;
}

export function isPostgres(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim();
}

export function llmProvider(): string {
  return (process.env.LLM_PROVIDER?.trim() || "gemini").toLowerCase();
}

export function llmApiKey(): string {
  const v =
    process.env.LLM_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  if (!v) {
    throw new Error("LLM_API_KEY is required to generate posters");
  }
  return v;
}

export function llmModel(): string | undefined {
  return process.env.LLM_MODEL?.trim();
}

export function llmBaseUrl(): string | undefined {
  return process.env.LLM_BASE_URL?.trim();
}

export function appUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit;
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${railway}`;
  return "http://localhost:3000";
}

export function linkedinConfig() {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI?.trim() ||
    `${appUrl()}/api/linkedin/callback`;
  return { clientId, clientSecret, redirectUri };
}

export { requiredInProd };
