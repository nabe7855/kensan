import { cn } from "@/lib/utils";

const HEAD = ["月", "火", "水", "木", "金", "土", "日"];

type Props = {
  year: number;
  month: number; // 1-12
  marked: Set<number>;
  today?: number;
};

/** Monday-first month grid with a square marker on workout days. */
export function MonthCalendar({ year, month, marked, today }: Props) {
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
        {cells.map((d, i) => (
          <div
            key={i}
            className={cn(
              "border-border flex h-14 flex-col items-center gap-1.5 border-t border-l pt-2 [&:nth-child(7n+1)]:border-l-0",
              i < 7 && "border-t-0",
            )}
          >
            {d && (
              <>
                <span className={cn("num text-sm", d === today ? "text-accent" : "text-muted")}>
                  {d}
                </span>
                {marked.has(d) && (
                  <span aria-label="トレーニング実施" className="bg-accent size-2" />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
