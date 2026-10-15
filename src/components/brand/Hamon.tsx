import { cn } from "@/lib/utils";
import { hamonPaths } from "./hamon-paths";

const PATHS = hamonPaths();

type Props = { className?: string; rise?: boolean };

export function Hamon({ className, rise = false }: Props) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 240"
      preserveAspectRatio="none"
      className={cn(
        "text-fg pointer-events-none absolute inset-x-0 bottom-0 h-[55%] w-full",
        rise && "animate-hamon-rise",
        className,
      )}
    >
      <g fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}>
        {PATHS.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
