"use client";

import { useRouter } from "next/navigation";

export function PageSelector({
  pages,
  current,
}: {
  pages: { id: string; name: string | null }[];
  current: string;
}) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={(e) => router.push(`/?page=${encodeURIComponent(e.target.value)}`)}
      className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500/40"
      aria-label="Select page"
    >
      {pages.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name ?? p.id}
        </option>
      ))}
    </select>
  );
}
