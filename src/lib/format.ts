/** Display formatting helpers. */

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(n / 1_000)}k`;
  return new Intl.NumberFormat("en-US").format(n);
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Percent change from the first to the last value of a series. */
export function deltaPct(series: { value: number }[]): number | null {
  if (series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (first === 0) return null;
  return Math.round(((last - first) / first) * 100);
}
