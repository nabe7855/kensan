/** A half-ring split into segments (5 matches the 1–5 condition scale). */
export const SEGMENTS = 5;
const GAP_DEG = 5;

const point = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)] as const;
};

const arc = (cx: number, cy: number, r: number, from: number, to: number) => {
  const [x1, y1] = point(cx, cy, r, from);
  const [x2, y2] = point(cx, cy, r, to);
  const f = (n: number) => Math.round(n * 100) / 100;
  // Sweeping clockwise over the top, from the left end (180°) to the right (0°).
  return `M${f(x1)} ${f(y1)} A${r} ${r} 0 0 1 ${f(x2)} ${f(y2)}`;
};

export type GaugeSegment = { track: string; fill: string | null };

/**
 * SVG paths for each segment: the grey track, and the lit part. `ratio` (0–1) lights
 * segments left to right; the last lit one can be partly filled.
 */
export function gaugeSegments(cx: number, cy: number, r: number, ratio: number): GaugeSegment[] {
  const span = 180 / SEGMENTS;
  const lit = Math.max(0, Math.min(1, ratio)) * SEGMENTS;
  return Array.from({ length: SEGMENTS }, (_, i) => {
    const from = 180 - i * span - GAP_DEG / 2;
    const to = 180 - (i + 1) * span + GAP_DEG / 2;
    const part = Math.max(0, Math.min(1, lit - i));
    return {
      track: arc(cx, cy, r, from, to),
      fill: part > 0.001 ? arc(cx, cy, r, from, from - (from - to) * part) : null,
    };
  });
}

/** Words for the day's average condition (1 = bad … 5 = good). Never alarming. */
export function conditionLabel(score: number): string {
  return score >= 4 ? "良好" : score >= 3 ? "ふつう" : score > 2 ? "やや低め" : "低め";
}
