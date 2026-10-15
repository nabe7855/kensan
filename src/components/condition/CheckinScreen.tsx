"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { CheckinForm } from "./CheckinForm";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function dateLabel(date: string, today: string) {
  if (date === today) return "今日";
  if (date === addDaysISO(today, -1)) return "昨日";
  const [, m, d] = date.split("-").map(Number);
  const wd = WEEKDAYS[new Date(`${date}T00:00:00`).getDay()];
  return `${m}/${d}（${wd}）`;
}

export function CheckinScreen() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const { data, isPending, isError } = useCheckins(addDaysISO(date, -14), date);

  const existing = data?.find((c) => c.date === date) ?? null;
  const lastWeight =
    data?.filter((c) => c.date < date && c.weight_kg != null).at(-1)?.weight_kg ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="前の日"
          onClick={() => setDate((d) => addDaysISO(d, -1))}
          className="text-muted flex size-12 items-center justify-center"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-sm">
          {dateLabel(date, today)}
          {existing && <span className="text-ghost ml-2 text-xs">記録済み</span>}
        </p>
        <button
          type="button"
          aria-label="次の日"
          disabled={date >= today}
          onClick={() => setDate((d) => addDaysISO(d, 1))}
          className="text-muted flex size-12 items-center justify-center disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

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
