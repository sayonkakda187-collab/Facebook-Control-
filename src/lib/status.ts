import { getFacebookToken, getPageIds, getEnv } from "@/lib/env";
import { isDbConfigured } from "@/lib/db";
import { hasAnyData } from "@/lib/storage";
import { graphGet } from "@/lib/graph";
import { pullPageInsights } from "@/lib/facebook";

export interface ConnectionStatus {
  mode: "sample" | "live";
  graphVersion: string;
  token: {
    present: boolean;
    /** null when we couldn't check (no token, or no page to probe). */
    valid: boolean | null;
    detail?: string;
  };
  database: { configured: boolean; hasData: boolean };
  pages: { count: number; ids: string[] };
  metrics?: { resolved: string[]; unavailable: string[] };
}

/**
 * Inspect the live connection. With no token this returns instantly ("No token
 * detected"). With a token it does a live probe of the first page to report
 * which metrics resolved vs. came back unavailable.
 */
export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const env = getEnv();
  const token = getFacebookToken();
  const pageIds = getPageIds();
  const dbConfigured = isDbConfigured();

  let dbHasData = false;
  if (dbConfigured) {
    try {
      dbHasData = await hasAnyData();
    } catch {
      dbHasData = false;
    }
  }

  let valid: boolean | null = null;
  let detail: string | undefined;
  let metrics: ConnectionStatus["metrics"];

  if (token) {
    try {
      if (pageIds[0]) {
        const snap = await pullPageInsights({ pageId: pageIds[0], token });
        valid = true;
        metrics = {
          resolved: snap.metrics.filter((m) => m.available).map((m) => m.name),
          unavailable: snap.metrics.filter((m) => !m.available).map((m) => m.name),
        };
      } else {
        await graphGet("me", { fields: "id,name" }, token);
        valid = true;
        detail = "Token is valid, but FB_PAGE_IDS is empty — add page IDs to pull insights.";
      }
    } catch (e) {
      valid = false;
      detail = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    mode: dbConfigured && dbHasData ? "live" : "sample",
    graphVersion: env.FB_GRAPH_VERSION,
    token: { present: Boolean(token), valid, detail },
    database: { configured: dbConfigured, hasData: dbHasData },
    pages: { count: pageIds.length, ids: pageIds },
    metrics,
  };
}
