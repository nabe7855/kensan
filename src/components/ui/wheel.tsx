"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { indexAt } from "@/lib/wheel";
import { cn } from "@/lib/utils";

const ITEM = 44;
const VISIBLE = 5;

type Props = {
  values: readonly number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
  format?: (v: number) => string;
  className?: string;
};

/** Drum-roll picker: scroll or flick, it snaps to the row in the middle. Arrow keys work too. */
export function Wheel({ values, value, onChange, label, format = String, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<number | undefined>(undefined);
  const index = Math.max(0, values.indexOf(value));

  // Start at the given value; afterwards the scroll position is the source of truth.
  useLayoutEffect(() => {
    ref.current?.scrollTo({ top: index * ITEM });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const goTo = (i: number, smooth = true) => {
    const clamped = Math.max(0, Math.min(values.length - 1, i));
    ref.current?.scrollTo({ top: clamped * ITEM, behavior: smooth ? "smooth" : "auto" });
    if (values[clamped] !== value) onChange(values[clamped]!);
  };

  return (
    <div className={cn("relative", className)} style={{ height: ITEM * VISIBLE }}>
      <div
        aria-hidden
        className="border-accent/70 bg-card pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md border-y"
        style={{ height: ITEM }}
      />
      <div
        ref={ref}
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        tabIndex={0}
        onScroll={() => {
          window.clearTimeout(settle.current);
          settle.current = window.setTimeout(() => {
            const el = ref.current;
            if (!el) return;
            const v = values[indexAt(el.scrollTop, ITEM, values.length)]!;
            if (v !== value) {
              onChange(v);
              navigator.vibrate?.(5);
            }
          }, 90);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            goTo(index - 1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            goTo(index + 1);
          }
        }}
        className="relative h-full snap-y snap-mandatory [scrollbar-width:none] overflow-y-auto overscroll-contain focus:outline-none [&::-webkit-scrollbar]:hidden"
        style={{ paddingBlock: ITEM * 2 }}
      >
        {values.map((v, i) => (
          <div
            key={v}
            aria-hidden
            onClick={() => goTo(i)}
            className={cn(
              "num flex snap-center items-center justify-center text-2xl",
              v === value ? "text-fg" : "text-ghost",
            )}
            style={{ height: ITEM }}
          >
            {format(v)}
          </div>
        ))}
      </div>
    </div>
  );
}
