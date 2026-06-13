import { getEnv, getFacebookToken, getPageIds } from "@/lib/env";
import { isDbConfigured } from "@/lib/db";
import { pullPageInsights, pullPagePosts } from "@/lib/facebook";
import { storeDailySnapshot, storePostSnapshots } from "@/lib/storage";
import { yesterdayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set
 * on the project. We also accept `?secret=` for manual triggering.
 */
function authorized(request: Request): boolean {
  const secret = getEnv().CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const token = getFacebookToken();
  if (!token) {
    return Response.json({ ok: false, error: "No Facebook token configured" }, { status: 400 });
  }
  if (!isDbConfigured()) {
    return Response.json({ ok: false, error: "DATABASE_URL not configured" }, { status: 400 });
  }

  const pageIds = getPageIds();
  if (pageIds.length === 0) {
    return Response.json({ ok: false, error: "No FB_PAGE_IDS configured" }, { status: 400 });
  }

  const date = yesterdayISO();
  const results: unknown[] = [];

  for (const pageId of pageIds) {
    try {
      const snapshot = await pullPageInsights({ pageId, token, date });
      const metricsStored = await storeDailySnapshot(snapshot);

      let postsStored = 0;
      try {
        const posts = await pullPagePosts(pageId, token, 10);
        postsStored = await storePostSnapshots(posts);
      } catch {
        // Posts are best-effort; never fail the daily metrics over them.
      }

      results.push({
        pageId,
        ok: true,
        metricsStored,
        postsStored,
        droppedMetrics: snapshot.droppedMetrics ?? [],
      });
    } catch (e) {
      results.push({ pageId, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return Response.json({ ok: true, date, pages: results });
}
