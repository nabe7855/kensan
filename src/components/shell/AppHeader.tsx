"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { daysUntilContest, prepDay, todayISO } from "@/lib/prep";
import { cn } from "@/lib/utils";
import { PendingSheet } from "./PendingSheet";

export function AppHeader() {
  const { prep } = useAppData();
  const { pending, failed } = useSync();
  const [open, setOpen] = useState(false);
  const today = todayISO();

  return (
    <header className="border-border bg-bg/95 sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)]">
      <div className="mx-auto grid h-12 max-w-[480px] grid-cols-[3rem_1fr_3rem] items-center px-1">
        <span role="status" className="flex justify-center">
          {pending > 0 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={`未送信の記録 ${pending} 件${failed > 0 ? "（送信できないものあり）" : ""}。タップで詳細`}
              className={cn(
                "num flex size-12 flex-col items-center justify-center text-[10px] leading-tight",
                failed > 0 ? "text-warn" : "text-ghost",
              )}
            >
              未送信
              <span>{pending}</span>
            </button>
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
      {open && <PendingSheet onClose={() => setOpen(false)} />}
    </header>
  );
}
