"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メイン"
      className="border-border bg-bg kb-open:hidden fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-[480px] grid-cols-5">
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
    </nav>
  );
}
