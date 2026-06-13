import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

export { schema };

/** True when DATABASE_URL is set — the UI uses this to choose live vs sample data. */
export function isDbConfigured(): boolean {
  return Boolean(getEnv().DATABASE_URL);
}

let cached: NeonHttpDatabase<typeof schema> | null = null;

/** Lazily-created Drizzle client over the Neon HTTP driver. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  const url = getEnv().DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — cannot connect to the database.");
  }
  if (!cached) {
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}
