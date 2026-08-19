export function appPassword(): string {
  const v = process.env.APP_PASSWORD?.trim();
  if (!v) {
    throw new Error("APP_PASSWORD is required");
  }
  return v;
}

export function sessionSecret(): string {
  const v = process.env.SESSION_SECRET?.trim();
  if (!v) {
    throw new Error("SESSION_SECRET is required");
  }
  return v;
}

export function cronSecret(): string | undefined {
  return process.env.CRON_SECRET?.trim();
}
