"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProgressRing } from "@/components/ui/progress-ring";
import { COLORS } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { useTodayStatus } from "./useTodayStatus";

const RING_LABEL: Record<string, (pct: number) => string> = {
  "/home": (p) => `減量計画 ${p}% 経過`,
  "/training": (p) => (p >= 100 ? "今日はトレ記録済み" : "今日のトレは未記録"),
  "/nutrition": (p) => `たんぱく質 ${p}%`,
  "/condition": (p) => (p >= 100 ? "今日の体調は記録済み" : "今日の体調は未記録"),
};

export function BottomTabBar() {
  const pathname = usePathname();
  const status = useTodayStatus();

  return (
    <nav
      aria-label="メイン"
      className="border-border bg-bg fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-[480px] grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const s = status[href];
          const ring = s?.ring ?? null;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? "text-accent" : "text-ghost",
                )}
              >
                <ProgressRing
                  ratio={ring?.ratio ?? 0}
                  size={36}
                  stroke={3}
                  color={active || (ring?.ratio ?? 0) >= 1 ? COLORS.accent : COLORS.muted}
                  label={ring ? RING_LABEL[href]?.(ring.pct) : undefined}
                >
                  <Icon aria-hidden className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
                </ProgressRing>
                <span className="flex items-baseline gap-1 whitespace-nowrap">
                  {label}
                  {s?.note && <span className="num text-[11px] leading-none">{s.note}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
