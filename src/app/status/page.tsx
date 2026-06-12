import { getConnectionStatus } from "@/lib/status";
import { SiteHeader } from "@/components/site/header";
import { Card, CardTitle } from "@/components/ui/card";
import { ALL_CANDIDATE_PAGE_METRICS } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export const metadata = { title: "Status" };

type Tone = "good" | "warn" | "bad" | "idle";

function Dot({ tone }: { tone: Tone }) {
  const color =
    tone === "good"
      ? "bg-emerald-400"
      : tone === "warn"
        ? "bg-amber-400"
        : tone === "bad"
          ? "bg-rose-400"
          : "bg-zinc-500";
  return <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />;
}

function Row({
  tone,
  title,
  children,
}: {
  tone: Tone;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Dot tone={tone} />
      <div>
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        {children && <div className="mt-0.5 text-sm text-zinc-400">{children}</div>}
      </div>
    </div>
  );
}

export default async function StatusPage() {
  const s = await getConnectionStatus();

  // Headline connection state
  let headline: { tone: Tone; title: string; detail?: string };
  if (!s.token.present) {
    headline = { tone: "idle", title: "No token detected", detail: "Showing sample data. Add a token to start tracking." };
  } else if (s.token.valid === false) {
    headline = { tone: "bad", title: "Token invalid", detail: s.token.detail };
  } else if (s.token.valid === true) {
    headline = { tone: "good", title: `Connected — tracking ${s.pages.count} page${s.pages.count === 1 ? "" : "s"}`, detail: s.token.detail };
  } else {
    headline = { tone: "warn", title: "Token present", detail: "Couldn't verify (no page to probe)." };
  }

  const allMetricNames = ALL_CANDIDATE_PAGE_METRICS.map((m) => m.name);
  const unavailable = s.metrics?.unavailable ?? [];
  const resolved = s.metrics?.resolved ?? [];

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Connection status</h1>
          <span
            className={
              s.mode === "live"
                ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20"
                : "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20"
            }
          >
            {s.mode === "live" ? "Live data" : "Sample data"}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <Card>
            <Row tone={headline.tone} title={headline.title}>
              {headline.detail && <span className="break-words">{headline.detail}</span>}
            </Row>
          </Card>

          <Card>
            <CardTitle>Configuration</CardTitle>
            <div className="mt-2 divide-y divide-zinc-800/70">
              <Row
                tone={s.token.present ? "good" : "idle"}
                title="Facebook token"
              >
                {s.token.present ? "Detected in environment." : "Not set (FB_SYSTEM_USER_TOKEN / FB_PAGE_TOKEN)."}
              </Row>
              <Row
                tone={s.database.configured ? (s.database.hasData ? "good" : "warn") : "idle"}
                title="Database"
              >
                {s.database.configured
                  ? s.database.hasData
                    ? "Connected and contains data."
                    : "Configured, but empty (run the cron once)."
                  : "Not set (DATABASE_URL). Using sample data."}
              </Row>
              <Row
                tone={s.pages.count > 0 ? "good" : "idle"}
                title="Tracked pages"
              >
                {s.pages.count > 0 ? s.pages.ids.join(", ") : "None (FB_PAGE_IDS is empty)."}
              </Row>
              <Row tone="idle" title="Graph API version">
                {s.graphVersion}
              </Row>
            </div>
          </Card>

          <Card>
            <CardTitle>Metric resolution</CardTitle>
            {s.metrics ? (
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <p className="mb-1 font-medium text-emerald-400">
                    Resolved ({resolved.length})
                  </p>
                  <p className="font-mono text-xs text-zinc-400">
                    {resolved.length ? resolved.join(", ") : "—"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-zinc-300">
                    Unavailable / dropped ({unavailable.length})
                  </p>
                  <p className="font-mono text-xs text-zinc-500">
                    {unavailable.length ? unavailable.join(", ") : "none"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">
                Connect a token and add a page ID to probe which of the{" "}
                {allMetricNames.length} candidate metrics resolve in your account.
              </p>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
