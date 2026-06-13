import {
  graphGet,
  GraphError,
  type GraphInsightEntry,
  type GraphInsightsResponse,
} from "@/lib/graph";
import {
  ALL_CANDIDATE_PAGE_METRICS,
  POST_METRICS_PROBE,
  isDeprecatedMetric,
  type MetricDef,
} from "@/lib/metrics";
import type {
  NormalizedMetric,
  PageInsightsSnapshot,
  PostInsightsSnapshot,
} from "@/types/insights";
import { addDaysISO, isoToUnix, yesterdayISO } from "@/lib/dates";

export interface PullOptions {
  pageId: string;
  token: string;
  /** ISO date (YYYY-MM-DD) the daily metrics should cover. Defaults to yesterday (UTC). */
  date?: string;
}

interface SelfHealResult {
  data: GraphInsightEntry[];
  dropped: string[];
}

/**
 * Find which candidate metric a Graph #100 error is complaining about, by
 * matching whole metric names inside the error message. Returns the longest
 * match so e.g. "page_video_views_paid" wins over "page_video_views".
 */
export function identifyBadMetric(message: string, names: string[]): string | null {
  let found: string | null = null;
  for (const name of names) {
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(message) && (found === null || name.length > found.length)) {
      found = name;
    }
  }
  return found;
}

/** Probe metrics one at a time; keep those that resolve, drop those that error. */
async function perMetricProbe(
  insightsPath: string,
  token: string,
  metrics: MetricDef[],
  extra: Record<string, string | number>,
  dropped: string[],
): Promise<SelfHealResult> {
  const data: GraphInsightEntry[] = [];
  for (const metric of metrics) {
    try {
      const json = await graphGet<GraphInsightsResponse>(
        insightsPath,
        { metric: metric.name, ...extra },
        token,
      );
      if (json.data?.length) data.push(...json.data);
    } catch (e) {
      if (e instanceof GraphError && e.code === 100) {
        dropped.push(metric.name);
      } else {
        throw e;
      }
    }
  }
  return { data, dropped };
}

/**
 * Request all metrics at once. On Graph #100 (invalid metric), identify and DROP
 * the offending metric, then retry. If the offender can't be identified from the
 * message, fall back to probing each metric individually. One bad metric name
 * never sinks the whole pull.
 */
async function fetchInsightsSelfHealing(
  insightsPath: string,
  token: string,
  candidates: MetricDef[],
  extra: Record<string, string | number>,
): Promise<SelfHealResult> {
  // Never send a known-deprecated metric.
  let working = candidates.filter((m) => !isDeprecatedMetric(m.name));
  const dropped: string[] = candidates
    .filter((m) => isDeprecatedMetric(m.name))
    .map((m) => m.name);

  for (let attempt = 0; attempt <= candidates.length; attempt++) {
    if (working.length === 0) return { data: [], dropped };
    try {
      const json = await graphGet<GraphInsightsResponse>(
        insightsPath,
        { metric: working.map((m) => m.name).join(","), ...extra },
        token,
      );
      return { data: json.data ?? [], dropped };
    } catch (e) {
      if (e instanceof GraphError && e.code === 100) {
        const bad = identifyBadMetric(e.message, working.map((m) => m.name));
        if (bad) {
          dropped.push(bad);
          working = working.filter((m) => m.name !== bad);
          continue;
        }
        // Couldn't pinpoint the offender — probe individually.
        return perMetricProbe(insightsPath, token, working, extra, dropped);
      }
      throw e;
    }
  }
  return { data: [], dropped };
}

/** Pull the latest value out of an insight entry's values array. */
function latestValue(entry: GraphInsightEntry | undefined): GraphInsightEntry["values"][number] | undefined {
  if (!entry?.values?.length) return undefined;
  return entry.values[entry.values.length - 1];
}

/** Turn raw Graph entries + the dropped list into normalized metrics. */
function normalize(
  candidates: MetricDef[],
  entries: GraphInsightEntry[],
  dropped: string[],
): NormalizedMetric[] {
  const byName = new Map(entries.map((e) => [e.name, e]));
  const droppedSet = new Set(dropped);

  return candidates.map((def) => {
    if (droppedSet.has(def.name)) {
      return { name: def.name, label: def.label, value: null, available: false };
    }
    const v = latestValue(byName.get(def.name));
    if (v === undefined) {
      // Metric was accepted but returned no data point → treat as 0, available.
      return { name: def.name, label: def.label, value: 0, available: true };
    }
    if (typeof v.value === "object" && v.value !== null) {
      const breakdown = v.value as Record<string, number>;
      const sum = Object.values(breakdown).reduce((a, b) => a + (Number(b) || 0), 0);
      return {
        name: def.name,
        label: def.label,
        value: sum,
        breakdown,
        available: true,
      };
    }
    return {
      name: def.name,
      label: def.label,
      value: Number(v.value) || 0,
      available: true,
    };
  });
}

/**
 * Pull a single Page's daily insights for the target date, self-healing around
 * deprecated/invalid metrics, and normalize the result.
 */
export async function pullPageInsights(
  options: PullOptions,
): Promise<PageInsightsSnapshot> {
  const { pageId, token } = options;
  const date = options.date ?? yesterdayISO();

  // Use a small window around the target day to be robust to day-boundary/timezone fuzz.
  const since = isoToUnix(addDaysISO(date, -2));
  const until = isoToUnix(addDaysISO(date, 1));

  const { data, dropped } = await fetchInsightsSelfHealing(
    `${pageId}/insights`,
    token,
    ALL_CANDIDATE_PAGE_METRICS,
    { period: "day", since, until },
  );

  let pageName: string | undefined;
  try {
    const meta = await graphGet<{ name?: string }>(pageId, { fields: "name" }, token);
    pageName = meta.name;
  } catch {
    // Page name is best-effort.
  }

  return {
    pageId,
    pageName,
    date,
    metrics: normalize(ALL_CANDIDATE_PAGE_METRICS, data, dropped),
    droppedMetrics: dropped,
  };
}

interface GraphPost {
  id: string;
  message?: string;
  created_time?: string;
}

interface GraphPostsResponse {
  data: GraphPost[];
  paging?: { next?: string };
}

/**
 * Pull recent posts for a Page and each post's insights (self-healing the same
 * way). Follows pagination until `limit` posts are collected.
 */
export async function pullPagePosts(
  pageId: string,
  token: string,
  limit = 10,
): Promise<PostInsightsSnapshot[]> {
  const posts: GraphPost[] = [];
  let resp = await graphGet<GraphPostsResponse>(
    `${pageId}/posts`,
    { fields: "id,message,created_time", limit: Math.min(limit, 25) },
    token,
  );
  posts.push(...(resp.data ?? []));

  while (posts.length < limit && resp.paging?.next) {
    try {
      const next: GraphPostsResponse = await fetch(resp.paging.next, {
        cache: "no-store",
      }).then((r) => r.json());
      if (!next.data?.length) break;
      posts.push(...next.data);
      resp = next;
    } catch {
      break;
    }
  }

  const results: PostInsightsSnapshot[] = [];
  for (const post of posts.slice(0, limit)) {
    const { data, dropped } = await fetchInsightsSelfHealing(
      `${post.id}/insights`,
      token,
      POST_METRICS_PROBE,
      {},
    );
    results.push({
      postId: post.id,
      pageId,
      createdTime: post.created_time,
      message: post.message,
      metrics: normalize(POST_METRICS_PROBE, data, dropped),
    });
  }
  return results;
}
