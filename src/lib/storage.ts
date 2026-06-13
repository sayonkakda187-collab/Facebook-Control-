import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { dailyInsights, pages, postInsights } from "@/lib/db/schema";
import type { PageInsightsSnapshot, PostInsightsSnapshot } from "@/types/insights";
import { addDaysISO, todayISO } from "@/lib/dates";

// ── Writes ───────────────────────────────────────────────────────────────────

export async function upsertPage(id: string, name?: string): Promise<void> {
  const db = getDb();
  await db
    .insert(pages)
    .values({ id, name: name ?? null })
    .onConflictDoUpdate({
      target: pages.id,
      set: {
        name: name ? sql`excluded.name` : sql`${pages.name}`,
        updatedAt: sql`now()`,
      },
    });
}

/** Store a daily snapshot. Deduped by (page_id, metric, date) — a re-run updates. */
export async function storeDailySnapshot(snap: PageInsightsSnapshot): Promise<number> {
  const db = getDb();
  await upsertPage(snap.pageId, snap.pageName);

  const rows = snap.metrics.map((m) => ({
    pageId: snap.pageId,
    date: snap.date,
    metric: m.name,
    value: m.value,
    breakdown: m.breakdown ?? null,
    available: m.available,
  }));
  if (rows.length === 0) return 0;

  await db
    .insert(dailyInsights)
    .values(rows)
    .onConflictDoUpdate({
      target: [dailyInsights.pageId, dailyInsights.metric, dailyInsights.date],
      set: {
        value: sql`excluded.value`,
        breakdown: sql`excluded.breakdown`,
        available: sql`excluded.available`,
        capturedAt: sql`now()`,
      },
    });
  return rows.length;
}

/** Store post snapshots. Deduped by (post_id, metric). */
export async function storePostSnapshots(posts: PostInsightsSnapshot[]): Promise<number> {
  const db = getDb();
  const rows = posts.flatMap((p) =>
    p.metrics.map((m) => ({
      postId: p.postId,
      pageId: p.pageId,
      createdTime: p.createdTime ? new Date(p.createdTime) : null,
      message: p.message ?? null,
      metric: m.name,
      value: m.value,
      breakdown: m.breakdown ?? null,
      available: m.available,
    })),
  );
  if (rows.length === 0) return 0;

  await db
    .insert(postInsights)
    .values(rows)
    .onConflictDoUpdate({
      target: [postInsights.postId, postInsights.metric],
      set: {
        value: sql`excluded.value`,
        breakdown: sql`excluded.breakdown`,
        available: sql`excluded.available`,
        message: sql`excluded.message`,
        createdTime: sql`excluded.created_time`,
        capturedAt: sql`now()`,
      },
    });
  return rows.length;
}

// ── Reads (used by the dashboard) ────────────────────────────────────────────

export async function hasAnyData(): Promise<boolean> {
  const db = getDb();
  const rows = await db.select({ id: pages.id }).from(pages).limit(1);
  return rows.length > 0;
}

export async function getTrackedPages(): Promise<{ id: string; name: string | null }[]> {
  const db = getDb();
  return db
    .select({ id: pages.id, name: pages.name })
    .from(pages)
    .where(eq(pages.tracked, true))
    .orderBy(pages.name);
}

export interface HistoryPoint {
  date: string;
  value: number | null;
}

/** Time series for one metric over the last `days` days. */
export async function getMetricHistory(
  pageId: string,
  metric: string,
  days = 30,
): Promise<HistoryPoint[]> {
  const db = getDb();
  const since = addDaysISO(todayISO(), -days);
  return db
    .select({ date: dailyInsights.date, value: dailyInsights.value })
    .from(dailyInsights)
    .where(
      and(
        eq(dailyInsights.pageId, pageId),
        eq(dailyInsights.metric, metric),
        gte(dailyInsights.date, since),
      ),
    )
    .orderBy(dailyInsights.date);
}

/** Latest stored row per metric for a page (most recent date wins). */
export async function getLatestDailyByMetric(
  pageId: string,
): Promise<Map<string, { value: number | null; available: boolean; date: string }>> {
  const db = getDb();
  const rows = await db
    .select({
      metric: dailyInsights.metric,
      value: dailyInsights.value,
      available: dailyInsights.available,
      date: dailyInsights.date,
    })
    .from(dailyInsights)
    .where(eq(dailyInsights.pageId, pageId))
    .orderBy(desc(dailyInsights.date));

  const latest = new Map<string, { value: number | null; available: boolean; date: string }>();
  for (const r of rows) {
    if (!latest.has(r.metric)) {
      latest.set(r.metric, { value: r.value, available: r.available, date: r.date });
    }
  }
  return latest;
}

export interface StoredPost {
  postId: string;
  message: string | null;
  createdTime: Date | null;
  metrics: { metric: string; value: number | null; available: boolean }[];
}

/** Recent posts (grouped from post_insights rows) for a page. */
export async function getRecentPosts(pageId: string, limit = 10): Promise<StoredPost[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(postInsights)
    .where(eq(postInsights.pageId, pageId))
    .orderBy(desc(postInsights.createdTime));

  const byPost = new Map<string, StoredPost>();
  for (const r of rows) {
    let post = byPost.get(r.postId);
    if (!post) {
      post = { postId: r.postId, message: r.message, createdTime: r.createdTime, metrics: [] };
      byPost.set(r.postId, post);
    }
    post.metrics.push({ metric: r.metric, value: r.value, available: r.available });
  }
  return Array.from(byPost.values()).slice(0, limit);
}
