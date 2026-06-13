/**
 * PagePulse — Graph API v25.0 insight metric catalog.
 *
 * This file is DATA, not logic. The insights engine (lib/facebook.ts, Phase 3)
 * consumes it: it requests the Tier-A + Tier-B candidates, and DROPS any metric
 * that Graph rejects with error #100 ("(#100) ... is not valid for ... metric").
 *
 * Context (verified June 2026): Meta is deprecating many Page Insights metrics
 * across ALL API versions. `impressions` and `page_fans` were removed 2025-11-15;
 * a second batch (legacy reach, unique-impressions, 3-second video views) goes
 * invalid on 2026-06-15. The exact replacement field names for content
 * views/reach are not reliably documented yet, so we treat those as Tier B and
 * confirm them live against a real token in Phase 3.
 */

export const GRAPH_API_VERSION = "v25.0" as const;

export type InsightPeriod = "day" | "week" | "days_28" | "lifetime";

export type MetricGroup = "page" | "post" | "video" | "demographics";

/** A → confirmed valid, not on the deprecation list. B → probe live; may not exist. */
export type MetricTier = "A" | "B";

export interface MetricDef {
  /** Exact Graph API metric string. */
  name: string;
  /** Human-friendly label for the dashboard. */
  label: string;
  period: InsightPeriod;
  tier: MetricTier;
  group: MetricGroup;
  note?: string;
}

/**
 * Tier A — high confidence these are valid in v25.0 and NOT on the June 15 2026
 * deprecation list. Page-level, period=day unless noted.
 */
export const PAGE_METRICS_SAFE: MetricDef[] = [
  {
    name: "page_views_total",
    label: "Page profile views",
    period: "day",
    tier: "A",
    group: "page",
    note: "Profile/timeline views — distinct from content impressions.",
  },
  {
    name: "page_post_engagements",
    label: "Post engagements",
    period: "day",
    tier: "A",
    group: "page",
  },
  {
    name: "page_actions_post_reactions_total",
    label: "Reactions (by type)",
    period: "day",
    tier: "A",
    group: "page",
    note: "Breakdown: like / love / wow / haha / sorry / anger.",
  },
  {
    name: "page_daily_follows_unique",
    label: "New follows",
    period: "day",
    tier: "A",
    group: "page",
  },
  {
    name: "page_video_views",
    label: "Video views",
    period: "day",
    tier: "A",
    group: "video",
  },
];

/**
 * Tier B — replacement / uncertain metrics to PROBE live. If Graph returns
 * error #100 for any of these, the engine drops it and the dashboard hides it.
 * These cover the "views / viewers" framework that replaces impressions/reach.
 */
export const PAGE_METRICS_PROBE: MetricDef[] = [
  {
    name: "page_fan_adds_unique",
    label: "New follows (fan adds)",
    period: "day",
    tier: "B",
    group: "page",
    note: 'Alternative new-follows metric ("adds", not the dead total page_fans).',
  },
  {
    name: "page_daily_unfollows_unique",
    label: "Unfollows",
    period: "day",
    tier: "B",
    group: "page",
  },
  {
    name: "page_consumptions_unique",
    label: "Post clicks (unique)",
    period: "day",
    tier: "B",
    group: "page",
    note: "Click metric; may be partially affected by the 2026 deprecation.",
  },
  {
    name: "page_video_views_paid",
    label: "Video views (paid)",
    period: "day",
    tier: "B",
    group: "video",
  },
  {
    name: "page_video_views_organic",
    label: "Video views (organic)",
    period: "day",
    tier: "B",
    group: "video",
  },
];

/**
 * Per-post candidate metrics (read from /{post-id}/insights). Reach/impressions
 * replacements are uncertain, so most are Tier B. Probed in Phase 3.
 */
export const POST_METRICS_PROBE: MetricDef[] = [
  {
    name: "post_reactions_by_type_total",
    label: "Post reactions (by type)",
    period: "lifetime",
    tier: "A",
    group: "post",
  },
  {
    name: "post_clicks",
    label: "Post clicks",
    period: "lifetime",
    tier: "A",
    group: "post",
  },
  {
    name: "post_video_views",
    label: "Post video views",
    period: "lifetime",
    tier: "B",
    group: "video",
    note: "3-second-view variants are deprecated; confirm the views-based field.",
  },
];

/**
 * Tier C — DEPRECATED. DO NOT request these. Listed so the engine can assert it
 * never sends a known-dead metric (and so the catalog documents the migration).
 */
export const DEPRECATED_METRICS: readonly string[] = [
  "impressions",
  "page_impressions",
  "page_impressions_unique",
  "page_impressions_paid",
  "page_impressions_organic",
  "page_impressions_viral",
  "page_impressions_viral_unique",
  "page_posts_impressions",
  "page_posts_impressions_unique",
  "post_impressions",
  "post_impressions_unique",
  "post_impressions_organic",
  "post_impressions_paid",
  "page_fans",
  "page_fans_country",
  "page_fans_city",
  "page_fans_locale",
  "page_fans_gender_age",
] as const;

/** Everything the page-level pull will attempt (Tier A first, then probes). */
export const ALL_CANDIDATE_PAGE_METRICS: MetricDef[] = [
  ...PAGE_METRICS_SAFE,
  ...PAGE_METRICS_PROBE,
];

const DEPRECATED_SET = new Set(DEPRECATED_METRICS);

/** Guard: true if a metric name is on the known deprecation list. */
export function isDeprecatedMetric(name: string): boolean {
  return DEPRECATED_SET.has(name);
}
