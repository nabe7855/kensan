import { volumeIntensity } from "@/lib/analysis";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/muscles";
import { COLORS } from "@/lib/tokens";

type Shape =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; r?: number }
  | { kind: "path"; d: string };

type Region = { group: MuscleGroup | null; shapes: Shape[] };

const mirror = (s: Shape): Shape =>
  s.kind === "ellipse"
    ? { ...s, cx: 100 - s.cx }
    : s.kind === "rect"
      ? { ...s, x: 100 - s.x - s.w }
      : s;

const pair = (group: MuscleGroup | null, shape: Shape): Region => ({
  group,
  shapes: [shape, mirror(shape)],
});

// Simplified, geometric body map (front / back), 100 × 210 units each.
const FRONT: Region[] = [
  pair("shoulders", { kind: "ellipse", cx: 31, cy: 50, rx: 7, ry: 6 }),
  pair("chest", { kind: "rect", x: 36, y: 46, w: 13.5, h: 17, r: 5 }),
  pair("biceps", { kind: "ellipse", cx: 26, cy: 70, rx: 4.5, ry: 10 }),
  pair("forearms", { kind: "ellipse", cx: 22, cy: 95, rx: 4, ry: 12 }),
  { group: "abs", shapes: [{ kind: "rect", x: 40, y: 66, w: 20, h: 34, r: 4 }] },
  pair("quads", { kind: "ellipse", cx: 41, cy: 132, rx: 8, ry: 22 }),
  pair(null, { kind: "ellipse", cx: 41, cy: 180, rx: 5.5, ry: 16 }),
];

const BACK: Region[] = [
  { group: "traps", shapes: [{ kind: "path", d: "M50 36 L63 48 L50 62 L37 48 Z" }] },
  pair("shoulders", { kind: "ellipse", cx: 31, cy: 50, rx: 7, ry: 6 }),
  { group: "back", shapes: [{ kind: "path", d: "M36 56 L64 56 L60 96 L50 102 L40 96 Z" }] },
  pair("triceps", { kind: "ellipse", cx: 26, cy: 70, rx: 4.5, ry: 10 }),
  pair("forearms", { kind: "ellipse", cx: 22, cy: 95, rx: 4, ry: 12 }),
  pair("glutes", { kind: "ellipse", cx: 42.5, cy: 112, rx: 8, ry: 9 }),
  pair("hamstrings", { kind: "ellipse", cx: 41, cy: 140, rx: 7.5, ry: 18 }),
  pair("calves", { kind: "ellipse", cx: 41, cy: 180, rx: 5.5, ry: 16 }),
];

function Figure({
  regions,
  sets,
  label,
}: {
  regions: Region[];
  sets: Record<string, number>;
  label: string;
}) {
  return (
    <svg viewBox="0 0 100 210" className="h-64 w-auto" role="img" aria-label={label}>
      <circle cx="50" cy="22" r="10" fill="none" stroke={COLORS.ghost} strokeWidth="1" />
      {regions.map((r, i) => {
        const n = r.group ? (sets[r.group] ?? 0) : 0;
        const t = volumeIntensity(n);
        return (
          <g
            key={i}
            className={n > 0 ? "animate-fade-in" : undefined}
            style={n > 0 ? { animationDelay: `${150 + i * 50}ms` } : undefined}
            fill={n > 0 ? COLORS.accent : COLORS.border}
            fillOpacity={n > 0 ? 0.2 + 0.8 * t : 1}
          >
            {r.shapes.map((s, j) =>
              s.kind === "ellipse" ? (
                <ellipse key={j} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} />
              ) : s.kind === "rect" ? (
                <rect key={j} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0} />
              ) : (
                <path key={j} d={s.d} />
              ),
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Weekly working sets per muscle group on a front/back body map, with exact counts below. */
export function BodyHeatmap({ sets }: { sets: Record<string, number> }) {
  const ranked = MUSCLE_GROUPS.map((m) => ({ ...m, n: sets[m.key] ?? 0 })).sort(
    (a, b) => b.n - a.n,
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-6">
        <Figure regions={FRONT} sets={sets} label="前面の筋群別セット数" />
        <Figure regions={BACK} sets={sets} label="背面の筋群別セット数" />
      </div>
      <ul className="grid grid-cols-4 gap-x-3 gap-y-1">
        {ranked.map((m) => (
          <li key={m.key} className="flex items-baseline justify-between">
            <span className="text-muted text-xs">{m.label}</span>
            <span className={m.n > 0 ? "num text-accent text-lg" : "num text-ghost text-lg"}>
              {m.n}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
