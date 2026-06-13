import { getFacebookToken, getPageIds } from "@/lib/env";
import { pullPageInsights, pullPagePosts } from "@/lib/facebook";

/**
 * Phase 3 test endpoint: pull a single page's insights and return the normalized
 * result, so the pull can be verified once a real token exists.
 *
 *   GET /api/insights/test                 → first page in FB_PAGE_IDS
 *   GET /api/insights/test?pageId=123      → a specific page
 *   GET /api/insights/test?pageId=123&posts=1  → also include recent posts
 */
export async function GET(request: Request) {
  const token = getFacebookToken();
  if (!token) {
    return Response.json(
      {
        ok: false,
        error: "No token detected",
        hint: "Set FB_SYSTEM_USER_TOKEN or FB_PAGE_TOKEN in .env.local (see SETUP.md).",
      },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId") ?? getPageIds()[0];
  if (!pageId) {
    return Response.json(
      {
        ok: false,
        error: "No pageId",
        hint: "Pass ?pageId=<id> or set FB_PAGE_IDS in .env.local.",
      },
      { status: 400 },
    );
  }

  try {
    const snapshot = await pullPageInsights({ pageId, token });
    const includePosts = url.searchParams.get("posts") === "1";
    const posts = includePosts ? await pullPagePosts(pageId, token, 5) : undefined;

    const resolved = snapshot.metrics.filter((m) => m.available).map((m) => m.name);
    return Response.json({
      ok: true,
      summary: {
        pageId: snapshot.pageId,
        pageName: snapshot.pageName,
        date: snapshot.date,
        resolvedMetrics: resolved,
        droppedMetrics: snapshot.droppedMetrics ?? [],
      },
      snapshot,
      posts,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
