/** Small UTC date helpers for daily insight windows. */

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return isoDate(d);
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

/** Unix seconds for 00:00:00 UTC of the given ISO date. */
export function isoToUnix(dateISO: string): number {
  return Math.floor(new Date(`${dateISO}T00:00:00Z`).getTime() / 1000);
}
