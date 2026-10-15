"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { daysUntilContest, prepDay, todayISO } from "@/lib/prep";

export function AppHeader() {
  const { prep } = useAppData();
  const { pending, failed } = useSync();
  const today = todayISO();

  return (
    <header className="border-border bg-bg/95 sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)]">
      <div className="mx-auto grid h-12 max-w-[480px] grid-cols-[3rem_1fr_3rem] items-center px-1">
        <span
          role="status"
          className="num text-center text-[10px] leading-tight"
          title={failed > 0 ? "送信できない記録があります" : undefined}
        >
          {pending > 0 && (
            <span className={failed > 0 ? "text-warn" : "text-ghost"}>
              未送信
              <br />
              {pending}
            </span>
          )}
        </span>
        <p className="label-en num text-fg/80 flex items-center justify-center gap-3 text-sm">
          {prep && (
            <>
              <span>D-{daysUntilContest(prep.contest_date, today)}</span>
              <span aria-hidden className="text-ghost">
                |
              </span>
              <span>PREP DAY {prepDay(prep.start_date, today)}</span>
            </>
          )}
        </p>
        <Link
          href="/settings"
          aria-label="設定"
          className="text-ghost active:text-fg flex size-12 items-center justify-center"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
