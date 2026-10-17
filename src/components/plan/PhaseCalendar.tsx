"use client";

import type { PhaseDates } from "@/lib/cut-phases";
import { addDaysISO } from "@/lib/prep";
import { cn } from "@/lib/utils";

export type Boundary = keyof PhaseDates;

const HEAD = ["月", "火", "水", "木", "金", "土", "日"];
const PHASE_CLASS = {
  early: "bg-accent/15",
  mid: "bg-accent/35",
  late: "bg-accent/60",
  peak: "bg-accent text-bg",
} as const;
const START_LABEL: Record<Boundary, string> = { mid: "中期", late: "後期", peak: "最終" };

type PhaseKey = keyof typeof PHASE_CLASS;

function phaseOf(date: string, start: string, contest: string, d: PhaseDates): PhaseKey | null {
  if (date < start || date >= contest) return null;
  return date < d.mid ? "early" : date < d.late ? "mid" : date < d.peak ? "late" : "peak";
}

/** First and last day a boundary can move to: after the previous one, before the next. */
export function boundaryRange(
  key: Boundary,
  start: string,
  contest: string,
  d: PhaseDates,
): [string, string] {
  const prev = key === "mid" ? start : key === "late" ? d.mid : d.late;
  const next = key === "mid" ? d.late : key === "late" ? d.peak : contest;
  return [addDaysISO(prev, 1), addDaysISO(next, -1)];
}

function months(start: string, contest: string): { y: number; m: number }[] {
  const out: { y: number; m: number }[] = [];
  let y = Number(start.slice(0, 4));
  let m = Number(start.slice(5, 7));
  const endKey = contest.slice(0, 7);
  while (`${y}-${String(m).padStart(2, "0")}` <= endKey) {
    out.push({ y, m });
    m = m === 12 ? 1 : m + 1;
    if (m === 1) y++;
  }
  return out;
}

/**
 * The prep on a calendar, each day tinted by its phase. While editing, tap a day to move the
 * chosen phase's start there; days it can't move to are dimmed.
 */
export function PhaseCalendar({
  start,
  contest,
  dates,
  today,
  active,
  onPick,
}: {
  start: string;
  contest: string;
  dates: PhaseDates;
  today: string;
  active: Boundary;
  onPick: (date: string) => void;
}) {
  const [min, max] = boundaryRange(active, start, contest, dates);
  const starts = new Map<string, Boundary>(
    (Object.keys(START_LABEL) as Boundary[]).map((k) => [dates[k], k]),
  );

  return (
    <div className="flex flex-col gap-4">
      {months(start, contest).map(({ y, m }) => {
        const first = new Date(Date.UTC(y, m - 1, 1));
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const offset = (first.getUTCDay() + 6) % 7;
        const cells: (string | null)[] = [
          ...Array.from({ length: offset }, () => null),
          ...Array.from(
            { length: days },
            (_, i) => `${y}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
          ),
        ];
        return (
          <section key={`${y}-${m}`} aria-label={`${y}年${m}月`}>
            <h3 className="mb-1 text-sm font-bold">
              <span className="num">{y}</span>年<span className="num">{m}</span>月
            </h3>
            <div className="grid grid-cols-7 gap-0.5">
              {HEAD.map((h) => (
                <span key={h} className="text-ghost py-0.5 text-center text-[10px]">
                  {h}
                </span>
              ))}
              {cells.map((date, i) => {
                if (!date) return <span key={i} />;
                const phase = phaseOf(date, start, contest, dates);
                const isContest = date === contest;
                const pickable = date >= min && date <= max;
                const boundary = starts.get(date);
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!pickable}
                    onClick={() => onPick(date)}
                    aria-label={`${m}月${Number(date.slice(8))}日${boundary ? `（${START_LABEL[boundary]}の開始）` : ""}`}
                    aria-pressed={dates[active] === date}
                    className={cn(
                      "relative flex h-11 flex-col items-center justify-center rounded-sm",
                      phase ? PHASE_CLASS[phase] : "text-ghost",
                      !pickable && "opacity-50",
                      isContest && "border-accent border-2 font-bold",
                      dates[active] === date && "ring-fg ring-2",
                      date === today && "underline underline-offset-2",
                    )}
                  >
                    <span className="num text-sm leading-none">{Number(date.slice(8))}</span>
                    {(boundary || isContest) && (
                      <span className="text-[9px] leading-tight font-bold">
                        {isContest ? "大会" : START_LABEL[boundary!]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
