"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDaysISO } from "@/lib/prep";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function dateLabel(date: string, today: string) {
  if (date === today) return "今日";
  if (date === addDaysISO(today, -1)) return "昨日";
  const [, m, d] = date.split("-").map(Number);
  const wd = WEEKDAYS[new Date(`${date}T00:00:00`).getDay()];
  return `${m}/${d}（${wd}）`;
}

type Props = {
  date: string;
  today: string;
  onChange: (date: string) => void;
  children?: React.ReactNode;
};

/** Previous / next day switcher; never goes past today. */
export function DateNav({ date, today, onChange, children }: Props) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        aria-label="前の日"
        onClick={() => onChange(addDaysISO(date, -1))}
        className="text-muted flex size-12 items-center justify-center"
      >
        <ChevronLeft className="size-5" />
      </button>
      <p className="text-sm">
        {dateLabel(date, today)}
        {children}
      </p>
      <button
        type="button"
        aria-label="次の日"
        disabled={date >= today}
        onClick={() => onChange(addDaysISO(date, 1))}
        className="text-muted flex size-12 items-center justify-center disabled:opacity-30"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
