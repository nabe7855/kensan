"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { GoalPoint } from "@/lib/prep";
import { COLORS } from "@/lib/tokens";

type Props = { points: GoalPoint[]; startKg: number; targetKg: number };

const MAX_DOTS = 9;

export function GoalLineChart({ points, startKg, targetKg }: Props) {
  const every = Math.max(1, Math.ceil(points.length / MAX_DOTS));
  const last = points.length - 1;
  const data = points.map((p, i) => ({ ...p, dot: i % every === 0 || i === last }));
  const end = points[last];

  return (
    <div
      role="img"
      aria-label={`目標ライン：${startKg.toFixed(1)}kg から大会日 ${end?.weightKg.toFixed(1)}kg`}
      className="h-32 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 6, bottom: 4, left: 6 }}>
          <CartesianGrid vertical horizontal={false} stroke={COLORS.border} strokeDasharray="2 4" />
          <XAxis dataKey="week" type="number" domain={[0, "dataMax"]} hide />
          <YAxis domain={[targetKg - 0.5, startKg + 0.2]} hide />
          <Area
            type="linear"
            dataKey="weightKg"
            stroke="none"
            fill={COLORS.accent}
            fillOpacity={0.08}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="weightKg"
            stroke={COLORS.accent}
            strokeWidth={2}
            isAnimationActive={false}
            dot={(props: {
              cx?: number;
              cy?: number;
              index?: number;
              payload?: { dot: boolean };
            }) =>
              props.payload?.dot ? (
                <circle key={props.index} cx={props.cx} cy={props.cy} r={3} fill={COLORS.accent} />
              ) : (
                <g key={props.index} />
              )
            }
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
