"use client";

import { ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { COLORS } from "@/lib/tokens";

export type WeightChartPoint = {
  date: string;
  weightKg: number | null;
  trendKg: number | null;
  goalKg: number | null;
};

export function WeightChart({ points }: { points: WeightChartPoint[] }) {
  const values = points
    .flatMap((p) => [p.weightKg, p.trendKg, p.goalKg])
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  const min = Math.floor(Math.min(...values) - 0.5);
  const max = Math.ceil(Math.max(...values) + 0.5);
  const last = points.at(-1);

  return (
    <div
      role="img"
      aria-label={`直近30日の体重。7日平均 ${last?.trendKg?.toFixed(1) ?? "—"}kg`}
      className="h-44 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <XAxis
            dataKey="date"
            tickLine={{ stroke: COLORS.border }}
            axisLine={{ stroke: COLORS.border }}
            tick={false}
            interval={6}
          />
          <YAxis
            domain={[min, max]}
            tickCount={4}
            allowDecimals={false}
            tick={{ fill: COLORS.ghost, fontSize: 10 }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          <Line
            dataKey="goalKg"
            stroke={COLORS.fg}
            strokeOpacity={0.7}
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            dataKey="weightKg"
            stroke="none"
            dot={{ r: 2.5, fill: COLORS.ghost, stroke: "none" }}
            isAnimationActive={false}
          />
          <Line
            dataKey="trendKg"
            stroke={COLORS.accent}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
