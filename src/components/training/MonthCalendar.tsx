import Link from "next/link";
import { cn } from "@/lib/utils";

const HEAD = ["月", "火", "水", "木", "金", "土", "日"];

type Props = {
  year: number;
  month: number; // 1-12
  /** Text under each day, e.g. trained body parts ("胸・肩"). */
  labels: Map<number, string>;
  today?: number;
  /** Link for a day (the day report). */
  hrefFor: (day: number) => string;
  /** Last day that can be opened (later days are not linked). */
  lastDay?: number;
};

/** Monday-first month grid. Each day links to its report and shows what was trained. */
export function MonthCalendar({ year, month, labels, today, hrefFor, lastDay }: Props) {
  const first = new Date(year, month - 1, 1);
  const days = new Date(year, month, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="border-border overflow-hidden rounded-md border">
      <div className="border-border grid grid-cols-7 border-b">
        {HEAD.map((h) => (
          <span key={h} className="text-ghost py-1 text-center text-[10px]">
            {h}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const cellClass = cn(
            "border-border flex h-16 flex-col items-center gap-1 border-t border-l px-0.5 pt-1.5 [&:nth-child(7n+1)]:border-l-0",
            i < 7 && "border-t-0",
          );
          if (!d) return <div key={i} className={cellClass} />;
          const label = labels.get(d);
          const content = (
            <>
              <span className={cn("num text-sm", d === today ? "text-accent" : "text-muted")}>
                {d}
              </span>
              {label && (
                <span className="text-accent line-clamp-2 text-center text-[10px] leading-tight font-bold">
                  {label}
                </span>
              )}
            </>
          );
          return lastDay !== undefined && d > lastDay ? (
            <div key={i} className={cn(cellClass, "opacity-40")}>
              {content}
            </div>
          ) : (
            <Link
              key={i}
              href={hrefFor(d)}
              aria-label={`${month}月${d}日のレポート${label ? `（${label}）` : ""}`}
              className={cn(cellClass, "active:bg-card")}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
