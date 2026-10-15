import type { HeatLevel, HeatRow } from "@/lib/analysis";
import { cn } from "@/lib/utils";

const LEVEL: Record<HeatLevel, string> = {
  none: "border border-dashed border-border bg-transparent",
  good: "bg-border",
  neutral: "bg-[#3a3a42]",
  low: "bg-warn/45",
  verylow: "bg-warn/90",
};

const LEVEL_LABEL: Record<HeatLevel, string> = {
  none: "未入力",
  good: "良い",
  neutral: "普通",
  low: "低め",
  verylow: "かなり低い",
};

/** 5 items × 7 days. Low wellness is amber; nothing is red. */
export function ConditionHeatmap({ rows }: { rows: HeatRow[] }) {
  const dates = rows[0]?.cells.map((c) => c.date) ?? [];
  return (
    <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] items-center gap-1.5">
      <span />
      {dates.map((d) => (
        <span key={d} className="num text-ghost text-center text-[10px]">
          {Number(d.slice(8))}
        </span>
      ))}
      {rows.map((r) => (
        <div key={r.key} className="contents">
          <span className="text-sm">{r.label}</span>
          {r.cells.map((c) => (
            <span
              key={c.date}
              title={`${c.date} ${r.label} ${c.value ?? "—"}（${LEVEL_LABEL[c.level]}）`}
              className={cn("h-8 rounded-sm", LEVEL[c.level])}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
