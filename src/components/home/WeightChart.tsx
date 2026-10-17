"use client";

import {
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS } from "@/lib/tokens";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

export type WeightChartPoint = {
  date: string;
  weightKg: number | null;
  trendKg: number | null;
  goalKg: number | null;
};

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;

/**
 * Daily weights as dots, the 7-day average as the line, the prep goal dashed.
 * Lines draw in when the chart appears. With `onSelect`, tapping or dragging picks a day.
 */
export function WeightChart({
  points,
  label = "直近30日の体重",
  height = "h-44",
  axisDates = false,
  selected = null,
  onSelect,
}: {
  points: WeightChartPoint[];
  label?: string;
  height?: string;
  axisDates?: boolean;
  selected?: string | null;
  onSelect?: (date: string | null) => void;
}) {
  const reduced = useReducedMotion();
  const values = points
    .flatMap((p) => [p.weightKg, p.trendKg, p.goalKg])
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  const min = Math.floor(Math.min(...values) - 0.5);
  const max = Math.ceil(Math.max(...values) + 0.5);
  const last = points.at(-1);
  const many = points.length > 120;
  const animate = !reduced;
  const pick = (state: { activeLabel?: string | number } | null) => {
    if (!onSelect) return;
    const d = state?.activeLabel;
    if (typeof d === "string") onSelect(d);
  };

  return (
    <div
      role="img"
      aria-label={`${label}。7日平均 ${last?.trendKg?.toFixed(1) ?? "—"}kg`}
      className={cn(height, "w-full", onSelect && "touch-pan-y")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          onClick={pick}
          onMouseMove={onSelect ? pick : undefined}
        >
          <XAxis
            dataKey="date"
            tickLine={{ stroke: COLORS.border }}
            axisLine={{ stroke: COLORS.border }}
            tick={axisDates ? { fill: COLORS.ghost, fontSize: 10 } : false}
            tickFormatter={md}
            minTickGap={28}
            interval={axisDates ? "preserveStartEnd" : 6}
          />
          <YAxis
            domain={[min, max]}
            tickCount={4}
            allowDecimals={false}
            tick={{ fill: COLORS.ghost, fontSize: 10 }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          {onSelect && <Tooltip content={() => null} cursor={false} />}
          {selected && <ReferenceLine x={selected} stroke={COLORS.muted} strokeDasharray="2 3" />}
          <Line
            dataKey="goalKg"
            stroke={COLORS.fg}
            strokeOpacity={0.7}
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={animate}
            animationDuration={900}
            animationEasing="ease-out"
            connectNulls
          />
          <Line
            dataKey="weightKg"
            stroke="none"
            dot={
              many
                ? { r: 1.5, fill: COLORS.ghost, stroke: "none" }
                : { r: 2.5, fill: COLORS.ghost, stroke: "none" }
            }
            activeDot={
              onSelect ? { r: 5, fill: COLORS.fg, stroke: COLORS.bg, strokeWidth: 2 } : false
            }
            isAnimationActive={animate}
            animationBegin={300}
            animationDuration={600}
          />
          <Line
            dataKey="trendKg"
            stroke={COLORS.accent}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            isAnimationActive={animate}
            animationDuration={1100}
            animationEasing="ease-out"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
