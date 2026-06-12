import { InstallPrompt } from "@/components/pwa/install-prompt";

const PLACEHOLDER_KPIS = [
  { label: "Page profile views", metric: "page_views_total" },
  { label: "Post engagements", metric: "page_post_engagements" },
  { label: "New follows", metric: "page_daily_follows_unique" },
  { label: "Video views", metric: "page_video_views" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-emerald-400 ring-1 ring-zinc-800"
          >
            {/* pulse glyph */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12h4l2-6 4 12 2-6h4" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">PagePulse</h1>
            <p className="text-sm text-zinc-400">
              Daily Facebook Page insights &amp; history
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Phase 2 · scaffold
        </span>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_KPIS.map((kpi) => (
          <div
            key={kpi.metric}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <p className="text-sm text-zinc-400">{kpi.label}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-600">—</p>
            <p className="mt-3 font-mono text-[11px] text-zinc-600">
              {kpi.metric}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">No data yet</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          This is the empty dashboard shell. The insights engine (Graph API
          v25.0) is built in <span className="text-zinc-200">Phase 3</span>, and
          history storage + the daily cron in{" "}
          <span className="text-zinc-200">Phase 4</span>. Metric names for the
          new “views / viewers” framework are probed live against your token so
          the June 15 2026 deprecation can’t break the pull.
        </p>
      </section>

      <InstallPrompt />
    </main>
  );
}
