import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/dashboard/sparkline";
import { deltaPct, formatNumber } from "@/lib/format";
import type { Kpi } from "@/lib/data";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  if (!kpi.available) {
    return (
      <Card>
        <p className="text-sm text-zinc-400">{kpi.label}</p>
        <p className="mt-2 text-sm font-medium text-zinc-500">Not available from API</p>
        <p className="mt-3 font-mono text-[11px] text-zinc-600">{kpi.metric}</p>
      </Card>
    );
  }

  const d = deltaPct(kpi.series);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-zinc-400">{kpi.label}</p>
        {d !== null && (
          <span
            className={
              d >= 0
                ? "text-xs font-medium text-emerald-400"
                : "text-xs font-medium text-rose-400"
            }
          >
            {d >= 0 ? "▲" : "▼"} {Math.abs(d)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-50">
        {formatNumber(kpi.value)}
      </p>
      <div className="mt-3">
        <Sparkline data={kpi.series} />
      </div>
    </Card>
  );
}
