"use client";

import { addDaysISO } from "@/lib/prep";
import { jstMidnight, useSessions } from "@/lib/queries/training";
import { partLabel } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import { rangeStatus, SET_RANGES, weeklyPartSets } from "@/lib/weekly-sets";

/** This week's hard sets per body part against a range, with how many days each was trained. */
export function PartSetsCard({ monday, today }: { monday: string; today: string }) {
  const thisWeek = useSessions(jstMidnight(monday), jstMidnight(addDaysISO(today, 1)));
  const lastWeek = useSessions(jstMidnight(addDaysISO(monday, -7)), jstMidnight(monday));
  const rows = weeklyPartSets(thisWeek.data ?? []);
  const last = new Map(weeklyPartSets(lastWeek.data ?? []).map((r) => [r.part, r.sets]));

  return (
    <section className="surface flex flex-col gap-3 px-4 py-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold">部位ごとのハードセット</h2>
        <span className="text-ghost text-xs">今週・月曜から</span>
      </div>
      {thisWeek.isPending ? (
        <div className="h-48 animate-pulse" aria-busy />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((r) => {
            const [min, max] = SET_RANGES[r.part];
            const scale = max * 1.25;
            const status = rangeStatus(r.sets, [min, max]);
            const prev = last.get(r.part) ?? 0;
            return (
              <li key={r.part} className="grid grid-cols-[2.5rem_1fr_4.5rem] items-center gap-2">
                <span className="text-sm">{partLabel(r.part)}</span>
                <div
                  className="bg-border relative h-2.5 overflow-hidden rounded-full"
                  role="img"
                  aria-label={`${partLabel(r.part)} ${r.sets}セット、目安 ${min}〜${max}`}
                >
                  <span
                    className="bg-muted/25 absolute inset-y-0"
                    style={{
                      left: `${(min / scale) * 100}%`,
                      width: `${((max - min) / scale) * 100}%`,
                    }}
                  />
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      status === "above" ? "bg-warn" : "bg-accent",
                      status === "below" && "bg-accent/50",
                    )}
                    style={{ width: `${Math.min(1, r.sets / scale) * 100}%` }}
                  />
                </div>
                <span className="flex flex-col items-end leading-tight">
                  <span className="num text-base">
                    <span
                      className={cn(
                        status === "in"
                          ? "text-accent"
                          : status === "above"
                            ? "text-warn"
                            : "text-fg",
                      )}
                    >
                      {r.sets}
                    </span>
                    <span className="text-ghost text-xs">
                      /{min}〜{max}
                    </span>
                  </span>
                  <span className="num text-ghost text-[10px]">
                    週{r.days}回・先週{prev}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-ghost text-xs leading-relaxed">
        ウォームアップ以外の回数を記録したセットを、その種目の主動筋の部位に数えています。目安は筋肥大でよく使われる週
        10〜20 セット（腕 8〜16、腹 6〜12）。同じ部位を週 2 回以上に分けると、1
        回あたりの質を保ちやすくなります。
      </p>
    </section>
  );
}
