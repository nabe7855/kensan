"use client";

import { Camera } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DateNav } from "@/components/ui/date-nav";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { CheckinForm } from "./CheckinForm";

export function CheckinScreen() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const { data, isPending, isError } = useCheckins(addDaysISO(date, -14), date);

  const existing = data?.find((c) => c.date === date) ?? null;
  const lastWeight =
    data?.filter((c) => c.date < date && c.weight_kg != null).at(-1)?.weight_kg ?? null;

  return (
    <div className="flex flex-col gap-3">
      <DateNav date={date} today={today} onChange={setDate}>
        {existing && <span className="text-ghost ml-2 text-xs">記録済み</span>}
      </DateNav>

      <Link
        href="/album"
        className="surface flex min-h-12 items-center justify-between gap-2 px-4 py-2 text-sm"
      >
        <span className="flex items-center gap-2">
          <Camera aria-hidden className="text-accent size-4" />
          ポーズ写真
        </span>
        <span className="text-ghost text-xs">ポーズごとに比べる</span>
      </Link>

      {isError ? (
        <p className="text-warn text-sm">
          読み込めませんでした。電波の良い場所で開き直してください
        </p>
      ) : isPending ? (
        <div className="surface h-[520px] animate-pulse" aria-busy />
      ) : (
        <CheckinForm
          key={`${date}:${existing ? "edit" : "new"}`}
          date={date}
          existing={existing}
          lastWeightKg={lastWeight}
        />
      )}
    </div>
  );
}
