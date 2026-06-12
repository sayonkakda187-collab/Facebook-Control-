"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateShort, formatNumber } from "@/lib/format";

interface Pt {
  date: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Pt }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <div className="text-zinc-400">{formatDateShort(p.date)}</div>
      <div className="font-semibold text-zinc-100">{formatNumber(p.value)}</div>
    </div>
  );
}

export function TrendChart({
  data,
  kind = "area",
  color = "#34d399",
  height = 260,
}: {
  data: Pt[];
  kind?: "area" | "bar";
  color?: string;
  height?: number;
}) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-zinc-500" style={{ height }}>
        No data yet
      </div>
    );
  }

  const tickStyle = { fill: "#a1a1aa", fontSize: 11 } as const;
  const gid = `trend-${color.replace("#", "")}`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === "bar" ? (
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDateShort} tick={tickStyle} axisLine={{ stroke: "#3f3f46" }} tickLine={false} minTickGap={24} />
            <YAxis tickFormatter={(v) => formatNumber(Number(v))} tick={tickStyle} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff14" }} />
            <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        ) : (
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDateShort} tick={tickStyle} axisLine={{ stroke: "#3f3f46" }} tickLine={false} minTickGap={24} />
            <YAxis tickFormatter={(v) => formatNumber(Number(v))} tick={tickStyle} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#52525b" }} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
