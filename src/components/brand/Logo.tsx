import { cn } from "@/lib/utils";
import { serif } from "./fonts";

type Props = { size?: "lg" | "md"; tagline?: boolean; className?: string };

export function Logo({ size = "lg", tagline = false, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <h1
        className={cn(
          serif.className,
          "quench font-black tracking-[0.04em]",
          size === "lg" ? "text-[88px] leading-none" : "text-[56px] leading-none",
        )}
      >
        研鑽
      </h1>
      <p
        className={cn(
          "label-en mt-3 text-[11px] tracking-[0.5em]",
          size === "lg" ? "text-accent" : "text-ghost",
        )}
      >
        KENSAN
      </p>
      {tagline && <p className="text-fg/80 mt-6 text-sm tracking-[0.4em]">最後まで、研ぎ切る</p>}
    </div>
  );
}
