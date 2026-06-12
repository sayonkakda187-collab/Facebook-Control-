import type { PageInsightsSnapshot } from "@/types/insights";

/**
 * PagePulse — Facebook Graph API insights engine.
 *
 * IMPLEMENTED IN PHASE 3. This module will, given a page id and a token:
 *   - call the Graph API v25.0 insights endpoints for the Tier-A + Tier-B
 *     candidate metrics in lib/metrics.ts,
 *   - probe Tier-B metrics and DROP any that return Graph error #100
 *     (invalid metric) so the June 15 2026 deprecation can't break the pull,
 *   - handle pagination, and gracefully handle metrics that return errors or 0,
 *   - normalize the result into a PageInsightsSnapshot.
 *
 * It is intentionally a stub for now (Phases gated on approval).
 */

export interface PullOptions {
  pageId: string;
  token: string;
  /** ISO date (YYYY-MM-DD) the daily metrics should cover. Defaults to yesterday. */
  date?: string;
}

export async function pullPageInsights(
  _options: PullOptions,
): Promise<PageInsightsSnapshot> {
  throw new Error(
    "Not implemented — the PagePulse insights engine is built in Phase 3.",
  );
}
