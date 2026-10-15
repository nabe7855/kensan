import { daysUntilContest, prepDay } from "@/lib/prep";

type Props = {
  contestDate: string;
  startDate: string;
  today: string;
};

export function PrepHeader({ contestDate, startDate, today }: Props) {
  const d = daysUntilContest(contestDate, today);
  const day = prepDay(startDate, today);

  return (
    <header className="border-border bg-bg/95 sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)]">
      <p className="label-en num text-fg/80 flex h-11 items-center justify-center gap-3 text-sm">
        <span>D-{d}</span>
        <span aria-hidden className="text-ghost">
          |
        </span>
        <span>PREP DAY {day}</span>
      </p>
    </header>
  );
}
