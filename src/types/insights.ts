/**
 * Normalized insight shapes shared by the engine (Phase 3), storage (Phase 4),
 * and the dashboard UI. Kept dependency-free.
 */

export interface NormalizedMetric {
  /** Exact Graph API metric name. */
  name: string;
  /** Human-friendly label. */
  label: string;
  /** Numeric value, or null when unavailable/dropped. */
  value: number | null;
  /** Optional structured breakdown (e.g. reactions by type). */
  breakdown?: Record<string, number>;
  /** False when the metric was dropped (e.g. Graph #100 invalid metric). */
  available: boolean;
}

export interface PageInsightsSnapshot {
  pageId: string;
  pageName?: string;
  /** ISO date (YYYY-MM-DD) the daily metrics cover. */
  date: string;
  metrics: NormalizedMetric[];
  /** Metric names that were dropped during the live probe, for diagnostics. */
  droppedMetrics?: string[];
}

export interface PostInsightsSnapshot {
  postId: string;
  pageId: string;
  /** ISO timestamp the post was created. */
  createdTime?: string;
  message?: string;
  metrics: NormalizedMetric[];
}
