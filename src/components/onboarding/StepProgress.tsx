import { cn } from "@/lib/utils";

type Props = { step: number; total?: number };

export function StepProgress({ step, total = 4 }: Props) {
  return (
    <div
      className="flex items-center justify-center gap-3"
      aria-label={`ステップ ${step} / ${total}`}
    >
      <div className="flex gap-2" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn("h-[2px] w-6 -rotate-[35deg]", i < step ? "bg-accent" : "bg-ghost/60")}
          />
        ))}
      </div>
      <span className="num text-muted text-xs">
        {step} / {total}
      </span>
    </div>
  );
}
