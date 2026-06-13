import { getDashboard } from "@/lib/data";
import { getEnv } from "@/lib/env";
import { SiteHeader } from "@/components/site/header";
import { Card, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PostsTable } from "@/components/dashboard/posts-table";
import { PageSelector } from "@/components/dashboard/page-selector";
import { SampleBadge } from "@/components/dashboard/sample-badge";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export const dynamic = "force-dynamic";

function ChartUnavailable() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-zinc-500">
      Not available from this API version
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const dash = await getDashboard(typeof sp.page === "string" ? sp.page : undefined);
  const gated = Boolean(getEnv().DASHBOARD_PASSWORD);

  const pageViews = dash.kpis.find((k) => k.metric === "page_views_total");
  const engagement = dash.kpis.find((k) => k.metric === "page_post_engagements");

  return (
    <div>
      <SiteHeader gated={gated} />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {dash.page.name ?? dash.page.id}
            </h1>
            <p className="text-sm text-zinc-400">Last 30 days</p>
          </div>
          <div className="flex items-center gap-3">
            {dash.mode === "sample" && <SampleBadge />}
            {dash.pages.length > 1 && (
              <PageSelector pages={dash.pages} current={dash.page.id} />
            )}
          </div>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {dash.kpis.map((kpi) => (
            <KpiCard key={kpi.metric} kpi={kpi} />
          ))}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Page views</CardTitle>
            <div className="mt-4">
              {pageViews?.available ? (
                <TrendChart data={pageViews.series} kind="area" color="#34d399" />
              ) : (
                <ChartUnavailable />
              )}
            </div>
          </Card>
          <Card>
            <CardTitle>Engagement</CardTitle>
            <div className="mt-4">
              {engagement?.available ? (
                <TrendChart data={engagement.series} kind="bar" color="#38bdf8" />
              ) : (
                <ChartUnavailable />
              )}
            </div>
          </Card>
        </section>

        <section className="mt-4">
          <Card>
            <CardTitle>Recent posts</CardTitle>
            <div className="mt-4">
              <PostsTable posts={dash.posts} />
            </div>
          </Card>
        </section>

        <InstallPrompt />
      </main>
    </div>
  );
}
