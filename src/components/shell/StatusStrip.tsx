"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRestTimer } from "@/components/providers/RestTimerProvider";
import { ProgressRing } from "@/components/ui/progress-ring";
import { COLORS } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { stripPage, useStatusStrip, type StripItem } from "./useStatusStrip";

export function StripRings({ items }: { items: StripItem[] }) {
  return (
    <ul
      className={cn(
        "mx-auto grid h-14 max-w-[480px] items-center gap-2 px-3",
        items.length === 3 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      {items.map((it) => {
        const full = (it.ring?.ratio ?? 0) >= 1;
        return (
          <li key={it.key} className="flex min-w-0 items-center gap-2">
            <ProgressRing
              ratio={it.ring?.ratio ?? 0}
              size={38}
              stroke={4}
              color={it.warn ? COLORS.warn : COLORS.accent}
              label={it.aria}
            >
              {it.centre === "check" ? (
                <Check
                  aria-hidden
                  className={cn("size-4", full ? "text-accent" : "text-ghost")}
                  strokeWidth={3}
                />
              ) : (
                <span
                  className={cn(
                    "num text-[13px] leading-none",
                    it.warn ? "text-warn" : it.ring ? "text-fg" : "text-ghost",
                  )}
                >
                  {it.ring ? it.ring.pct : "—"}
                </span>
              )}
            </ProgressRing>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="text-muted truncate text-[10px]">{it.label}</span>
              <span className="num truncate text-sm">{it.value}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Key numbers for the current tab, as small rings just above the tab bar. */
export function StatusStrip() {
  const items = useStatusStrip(stripPage(usePathname()));
  const { timer } = useRestTimer();
  // A running rest countdown takes this spot; it matters more right now.
  if (items.length === 0 || timer) return null;

  return (
    <>
      <div aria-hidden className="h-14" />
      <section
        aria-label="今日の状況"
        className="border-border bg-bg fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t"
      >
        <StripRings items={items} />
      </section>
    </>
  );
}
