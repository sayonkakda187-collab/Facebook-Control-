import { z } from "zod";

/**
 * Zod-validated environment loader.
 *
 * Validation is lazy (on first `getEnv()` call) so that a production build does
 * not fail when secrets are absent. Secrets are only needed at request time
 * (the insights pull in Phase 3, the DB in Phase 4).
 */
const envSchema = z.object({
  // Facebook / Graph API
  FB_GRAPH_VERSION: z.string().default("v25.0"),
  FB_APP_ID: z.string().optional(),
  FB_APP_SECRET: z.string().optional(),
  FB_SYSTEM_USER_TOKEN: z.string().optional(),
  FB_PAGE_TOKEN: z.string().optional(),
  FB_PAGE_IDS: z.string().optional(),

  // Database (Phase 4)
  DATABASE_URL: z.string().optional(),

  // Cron / job security (Phase 4)
  CRON_SECRET: z.string().optional(),

  // Dashboard gate (optional)
  DASHBOARD_PASSWORD: z.string().optional(),
  AUTH_SECRET: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_NAME: z.string().default("PagePulse"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}

/** Parsed list of Page IDs from FB_PAGE_IDS. */
export function getPageIds(): string[] {
  return (getEnv().FB_PAGE_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** The access token to use, preferring a non-expiring system-user token. */
export function getFacebookToken(): string | undefined {
  const env = getEnv();
  return env.FB_SYSTEM_USER_TOKEN || env.FB_PAGE_TOKEN || undefined;
}
