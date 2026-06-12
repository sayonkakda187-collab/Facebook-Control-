/**
 * Phase 3 CLI: pull a single Page's insights and print the normalized result.
 *
 *   npm run pull:page -- <pageId> [--posts]
 *
 * Reads secrets from .env.local. Use this to verify the pull against a real
 * token before any storage/UI/cron is involved.
 */
import { pullPageInsights, pullPagePosts } from "../src/lib/facebook";
import { getFacebookToken, getPageIds } from "../src/lib/env";

async function main() {
  // Load .env.local into process.env (Node 20.12+/22).
  const loadEnvFile = (process as unknown as {
    loadEnvFile?: (path?: string) => void;
  }).loadEnvFile;
  try {
    loadEnvFile?.(".env.local");
  } catch {
    // No .env.local — rely on the ambient environment.
  }

  const args = process.argv.slice(2);
  const withPosts = args.includes("--posts");
  const pageId = args.find((a) => !a.startsWith("--")) ?? getPageIds()[0];

  const token = getFacebookToken();
  if (!token) {
    console.error(
      "No token. Set FB_SYSTEM_USER_TOKEN or FB_PAGE_TOKEN in .env.local (see SETUP.md).",
    );
    process.exitCode = 1;
    return;
  }
  if (!pageId) {
    console.error("No page id. Pass one: npm run pull:page -- <pageId>  (or set FB_PAGE_IDS).");
    process.exitCode = 1;
    return;
  }

  console.log(`Pulling insights for page ${pageId} ...\n`);
  const snapshot = await pullPageInsights({ pageId, token });

  console.log(`Page:  ${snapshot.pageName ?? "(name unavailable)"} (${snapshot.pageId})`);
  console.log(`Date:  ${snapshot.date}\n`);
  console.log("Metrics:");
  for (const m of snapshot.metrics) {
    const status = m.available ? String(m.value) : "— not available from API";
    console.log(`  ${m.label.padEnd(28)} ${m.name.padEnd(34)} ${status}`);
  }
  if (snapshot.droppedMetrics?.length) {
    console.log(`\nDropped (invalid in this API version): ${snapshot.droppedMetrics.join(", ")}`);
  }

  if (withPosts) {
    console.log("\nRecent posts:");
    const posts = await pullPagePosts(pageId, token, 5);
    for (const p of posts) {
      const summary = p.metrics
        .filter((m) => m.available)
        .map((m) => `${m.name}=${m.value}`)
        .join(", ");
      console.log(`  ${p.postId}  ${(p.message ?? "").slice(0, 40).replace(/\n/g, " ")}`);
      console.log(`     ${summary || "(no metrics available)"}`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Pull failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
