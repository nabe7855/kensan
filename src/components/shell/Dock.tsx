"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRestTimer } from "@/components/providers/RestTimerProvider";
import { gaugeSegments } from "@/lib/gauge";
import { COLORS } from "@/lib/tokens";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import {
  dockPage,
  useDockMetrics,
  type DockHero,
  type DockMetrics,
  type DockSide,
} from "./useDockMetrics";

/** Raised middle of the dock: width, how far it rises, and the metrics row height. */
const HUMP_W = 144;
const RISE = 26;
const ROW_H = 58;
/** Space the page keeps clear above the tabs when the metrics row is shown. */
export const DOCK_EXTRA = RISE + ROW_H;

function Side({ side, align }: { side: DockSide; align: "left" | "right" }) {
  return (
    <Link
      href={side.href}
      className={cn(
        "flex min-w-0 flex-1 flex-col justify-center px-4 pt-1",
        align === "right" && "items-end text-right",
      )}
    >
      <span className="text-muted truncate text-[11px] leading-tight">{side.label}</span>
      <span className="num truncate text-xl leading-tight">
        {side.value}
        {side.unit && <span className="text-muted ml-0.5 text-xs">{side.unit}</span>}
      </span>
    </Link>
  );
}

/** Counts from 0 up to `target` (ease-out) after `delay` ms; instant with reduced motion. */
function useTween(target: number, delay = 0): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return setValue(target);
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / 700));
      setValue(target * (1 - (1 - t) ** 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, reduced]);
  return value;
}

/** Gap between segments lighting up when the gauge is drawn. */
const SEGMENT_STAGGER_MS = 70;

/** The raised middle: its outline with the quench-orange slopes, and the segmented half gauge. */
function Hump({ hero }: { hero: DockHero }) {
  // The track draws in segment by segment, then the lit part fills up.
  const shown = useTween(hero.ratio, SEGMENT_STAGGER_MS * 5);
  const color = hero.warn ? COLORS.warn : COLORS.accent;
  const H = RISE + ROW_H;
  return (
    <Link
      href={hero.href}
      aria-label={hero.aria}
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: -RISE, width: HUMP_W, height: H }}
    >
      <svg viewBox={`0 0 ${HUMP_W} ${H}`} width={HUMP_W} height={H} aria-hidden>
        <path
          d={`M0 ${RISE} L24 0 H${HUMP_W - 24} L${HUMP_W} ${RISE} V${H} H0 Z`}
          fill={COLORS.card}
        />
        <path
          d={`M0 ${RISE + 0.5} L24 0.5 H${HUMP_W - 24} L${HUMP_W} ${RISE + 0.5}`}
          fill="none"
          stroke={COLORS.border}
        />
        <path d={`M0 ${RISE} L24 0`} stroke={COLORS.accent} strokeWidth="2" />
        <path d={`M${HUMP_W - 24} 0 L${HUMP_W} ${RISE}`} stroke={COLORS.accent} strokeWidth="2" />
        <g fill="none" strokeWidth="7">
          {gaugeSegments(HUMP_W / 2, 66, 44, shown).map((s, i) => (
            <g key={i}>
              <path
                d={s.track}
                stroke={COLORS.border}
                className="animate-fade-in"
                style={{ animationDelay: `${i * SEGMENT_STAGGER_MS}ms` }}
              />
              {s.fill && !hero.empty && <path d={s.fill} stroke={color} />}
            </g>
          ))}
        </g>
      </svg>
      <span
        className="animate-fade-in absolute inset-x-0 flex flex-col items-center"
        style={{ top: 34, animationDelay: "120ms" }}
      >
        <span
          className={cn(
            "num text-[26px] leading-none",
            hero.empty ? "text-ghost" : hero.warn ? "text-warn" : "text-fg",
          )}
        >
          {hero.value}
          {hero.unit && <span className="text-muted text-xs">{hero.unit}</span>}
        </span>
        <span
          className={cn(
            "mt-1 text-[10px] leading-tight whitespace-nowrap",
            hero.empty ? "text-accent" : "text-muted",
          )}
        >
          {hero.caption}
        </span>
      </span>
    </Link>
  );
}

/**
 * One dock for the bottom of the app: on the main tabs, a metrics row whose middle rises
 * around a half gauge, flowing straight into the tabs with no divider between them.
 * Elsewhere (and while a rest countdown has the spot) it is just the tabs.
 */
export function Dock() {
  const pathname = usePathname();
  const { timer } = useRestTimer();
  const page = timer ? null : dockPage(pathname);
  const metrics = useDockMetrics(page);
  return <DockView pathname={pathname} metrics={metrics} />;
}

/** The dock as drawn, from the current path and its metrics (null: tabs only). */
export function DockView({ pathname, metrics }: { pathname: string; metrics: DockMetrics | null }) {
  return (
    <nav
      aria-label="メイン"
      className="kb-open:hidden fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
      style={{ background: metrics ? "transparent" : COLORS.card }}
    >
      <div className="relative mx-auto max-w-[480px]">
        {metrics && (
          <section aria-label="今日の状況" className="relative flex" style={{ height: ROW_H }}>
            <div className="border-border bg-card relative flex flex-1 border-t">
              <span aria-hidden className="bg-accent/45 absolute top-[-1px] right-0 h-px w-12" />
              <Side side={metrics.left} align="left" />
            </div>
            <div aria-hidden className="bg-card shrink-0" style={{ width: HUMP_W }} />
            <div className="border-border bg-card relative flex flex-1 border-t">
              <span aria-hidden className="bg-accent/45 absolute top-[-1px] left-0 h-px w-12" />
              <Side side={metrics.right} align="right" />
            </div>
            {/* Keyed by tab so the gauge draws itself again on every switch. */}
            <Hump key={pathname} hero={metrics.hero} />
          </section>
        )}
        <ul className={cn("bg-card grid grid-cols-5", !metrics && "border-border border-t")}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium",
                    active ? "text-accent" : "text-ghost",
                  )}
                >
                  <Icon aria-hidden className="size-6" strokeWidth={active ? 2.5 : 2} />
                  <span className="whitespace-nowrap">{label}</span>
                  {active && (
                    <span aria-hidden className="bg-accent absolute inset-x-4 bottom-1 h-0.5" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div
        aria-hidden
        className="bg-card absolute inset-x-0 bottom-0 h-[env(safe-area-inset-bottom)]"
      />
    </nav>
  );
}

/** Keeps page content clear of the metrics row and the raised middle. */
export function DockSpacer() {
  const pathname = usePathname();
  const { timer } = useRestTimer();
  if (timer || !dockPage(pathname)) return null;
  return <div aria-hidden style={{ height: DOCK_EXTRA }} />;
}
