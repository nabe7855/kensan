"use client";

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
