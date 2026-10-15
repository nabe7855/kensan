import { isOver, type Macros } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

const KEYS = [
  { key: "protein_g", label: "P", unit: "g" },
  { key: "fat_g", label: "F", unit: "g" },
  { key: "carb_g", label: "C", unit: "g" },
  { key: "kcal", label: "kcal", unit: "" },
] as const;

/** Eaten / target per macro. Over the tolerance band turns amber; nothing turns red. */
export function MacroCards({ eaten, target }: { eaten: Macros; target: Macros | null }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {KEYS.map(({ key, label, unit }) => {
        const v = Math.round(eaten[key]);
        const t = target ? Math.round(target[key]) : null;
        const over = t !== null && isOver(key, eaten[key], t);
        const ratio = t ? Math.min(1, eaten[key] / t) : 0;
        return (
          <div key={key} className="surface flex flex-col px-2 pt-2 pb-2.5">
            <span className="label-en num text-sm">{label}</span>
            <span className="flex items-baseline gap-0.5 whitespace-nowrap">
              <span className={cn("num text-2xl leading-none", over ? "text-warn" : "text-accent")}>
                {v.toLocaleString("ja-JP")}
              </span>
              {t !== null && (
                <span className="num text-muted text-[11px]">
                  /{t.toLocaleString("ja-JP")}
                  {unit}
                </span>
              )}
            </span>
            <span className="bg-border mt-2 h-1.5 overflow-hidden rounded-full">
              <span
                className={cn("block h-full", over ? "bg-warn" : "bg-accent")}
                style={{ width: `${ratio * 100}%` }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
