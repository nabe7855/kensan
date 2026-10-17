"use client";

import { useEffect, useState } from "react";
import { dashOffset } from "@/lib/rings";
import { COLORS } from "@/lib/tokens";

type Props = {
  ratio: number;
  /** Lighter arc stacked after the main one (e.g. food planned but not eaten yet). */
  extra?: number;
  size: number;
  stroke: number;
  color?: string;
  children?: React.ReactNode;
  label?: string;
};

/** Circular progress that grows from empty when it first appears. */
export function ProgressRing({
  ratio,
  extra = 0,
  size,
  stroke,
  color = COLORS.accent,
  children,
  label,
}: Props) {
  const [shown, setShown] = useState(0);
  const [shownExtra, setShownExtra] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setShown(ratio);
      setShownExtra(extra);
    });
    return () => cancelAnimationFrame(id);
  }, [ratio, extra]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const main = Math.min(1, shown);
  const after = Math.min(1 - main, Math.max(0, shownExtra));
  const arc = "transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={stroke}
        />
        {after > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={dashOffset(c, main + after)}
            className={arc}
          />
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap={main > 0 && main < 1 ? "round" : "butt"}
          strokeDasharray={c}
          strokeDashoffset={dashOffset(c, main)}
          className={arc}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
