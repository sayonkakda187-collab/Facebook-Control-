import { isDbConfigured } from "@/lib/db";
import {
  getLatestDailyByMetric,
  getMetricHistory,
  getRecentPosts,
  getTrackedPages,
  hasAnyData,
} from "@/lib/storage";
import { SAMPLE_PAGES, samplePosts, sampleSeries } from "@/lib/sample";

export type DashboardMode = "sample" | "live";

/** The KPI metrics shown on the dashboard (all Tier-A / confirmed-safe). */
export const KPI_METRICS: { metric: string; label: string }[] = [
  { metric: "page_views_total", label: "Page views" },
  { metric: "page_post_engagements", label: "Engagement" },
  { metric: "page_actions_post_reactions_total", label: "Reactions" },
  { metric: "page_daily_follows_unique", label: "New follows" },
  { metric: "page_video_views", label: "Video views" },
];

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface Kpi {
  metric: string;
  label: string;
  value: number | null;
  available: boolean;
  series: SeriesPoint[];
}

export interface PostRow {
  postId: string;
  message: string | null;
  createdTime: string | null;
  clicks: number | null;
  reactions: number | null;
  videoViews: number | null;
}

export interface PageDashboard {
  mode: DashboardMode;
  page: { id: string; name: string | null };
  pages: { id: string; name: string | null }[];
  kpis: Kpi[];
  posts: PostRow[];
}

async function isLive(): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    return await hasAnyData();
  } catch {
    return false;
  }
}

export async function getDashboard(requestedPageId?: string): Promise<PageDashboard> {
  return (await isLive()) ? liveDashboard(requestedPageId) : sampleDashboard(requestedPageId);
}

// ── Sample ───────────────────────────────────────────────────────────────────

function sampleDashboard(requestedPageId?: string): PageDashboard {
  const page =
    SAMPLE_PAGES.find((p) => p.id === requestedPageId) ?? SAMPLE_PAGES[0];

  const kpis: Kpi[] = KPI_METRICS.map(({ metric, label }) => {
    const series = sampleSeries(page.id, metric);
    return {
      metric,
      label,
      value: series[series.length - 1]?.value ?? null,
      available: true,
      series,
    };
  });

  const posts: PostRow[] = samplePosts(page.id).map((p) => ({
    postId: p.postId,
    message: p.message,
    createdTime: p.createdTime,
    clicks: p.clicks,
    reactions: p.reactions,
    videoViews: p.videoViews,
  }));

  return {
    mode: "sample",
    page: { id: page.id, name: page.name },
    pages: SAMPLE_PAGES.map((p) => ({ id: p.id, name: p.name })),
    kpis,
    posts,
  };
}

// ── Live ─────────────────────────────────────────────────────────────────────

async function liveDashboard(requestedPageId?: string): Promise<PageDashboard> {
  const pages = await getTrackedPages();
  if (pages.length === 0) return sampleDashboard(requestedPageId);

  const page = pages.find((p) => p.id === requestedPageId) ?? pages[0];
  const latest = await getLatestDailyByMetric(page.id);

  const kpis: Kpi[] = await Promise.all(
    KPI_METRICS.map(async ({ metric, label }) => {
      const entry = latest.get(metric);
      const history = await getMetricHistory(page.id, metric, 30);
      const series = history
        .filter((h): h is { date: string; value: number } => h.value !== null)
        .map((h) => ({ date: h.date, value: h.value }));
      return {
        metric,
        label,
        value: entry ? entry.value : null,
        available: entry ? entry.available : true,
        series,
      };
    }),
  );

  const stored = await getRecentPosts(page.id, 10);
  const posts: PostRow[] = stored.map((p) => ({
    postId: p.postId,
    message: p.message,
    createdTime: p.createdTime ? p.createdTime.toISOString() : null,
    clicks: metricValue(p.metrics, "post_clicks"),
    reactions: metricValue(p.metrics, "post_reactions_by_type_total"),
    videoViews: metricValue(p.metrics, "post_video_views"),
  }));

  return {
    mode: "live",
    page: { id: page.id, name: page.name },
    pages,
    kpis,
    posts,
  };
}

function metricValue(
  metrics: { metric: string; value: number | null; available: boolean }[],
  name: string,
): number | null {
  const m = metrics.find((x) => x.metric === name);
  if (!m || !m.available) return null;
  return m.value;
}
