"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { Button } from "@/components/ui/button";
import { countdownLabel, type Contest } from "@/lib/contest";
import { todayISO } from "@/lib/prep";
import { useContests } from "@/lib/queries/contests";
import { cn } from "@/lib/utils";
import { useContestActions } from "./useContestActions";

const field =
  "text-fg placeholder:text-ghost min-w-0 flex-1 bg-transparent text-right text-base focus:outline-none";

function AddContest({
  today,
  initial,
  onDone,
}: {
  today: string;
  initial?: Partial<Contest>;
  onDone: () => void;
}) {
  const { saveContest } = useContestActions();
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || !date) return;
        await saveContest({
          id: crypto.randomUUID(),
          name: name.trim(),
          date,
          category: category.trim() || null,
          location: location.trim() || null,
          note: null,
        });
        onDone();
      }}
    >
      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">大会名</span>
        <input
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="FWJ 東京オープン"
          className={field}
        />
      </label>
      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">大会日</span>
        <input
          type="date"
          required
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={cn(field, "num text-lg [color-scheme:dark]")}
        />
      </label>
      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">カテゴリー</span>
        <input
          maxLength={40}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="メンズフィジーク 176cm以下"
          className={field}
        />
      </label>
      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">会場</span>
        <input
          maxLength={60}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="任意"
          className={field}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          やめる
        </Button>
        <Button type="submit">登録する</Button>
      </div>
    </form>
  );
}

/** Contests the user enters: upcoming ones with a countdown, past ones folded away. */
export function ContestList() {
  const today = todayISO();
  const { prep } = useAppData();
  const contests = useContests();
  const [adding, setAdding] = useState<Partial<Contest> | null>(null);
  const [showPast, setShowPast] = useState(false);

  const list = contests.data ?? [];
  const upcoming = list.filter((c) => c.date >= today);
  const past = list.filter((c) => c.date < today).reverse();
  const prepMissing =
    prep &&
    prep.contest_date >= today &&
    !list.some((c) => c.date === prep.contest_date && c.name === prep.contest_name);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h1 className="text-xl font-bold">大会</h1>

      {contests.isPending ? (
        <div className="surface h-32 animate-pulse" aria-busy />
      ) : contests.isError ? (
        <p className="text-warn text-sm">
          読み込めませんでした。電波の良い場所で開き直してください
        </p>
      ) : (
        <>
          {upcoming.length === 0 && !adding && (
            <p className="text-muted text-sm">
              出場する大会を登録すると、カレンダーに表示され、日にちに合わせてやることを提案します
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {upcoming.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contest/${c.id}`}
                  className="surface border-l-accent flex min-h-16 items-center justify-between gap-3 border-l-2 px-4 py-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-base font-bold">{c.name}</span>
                    <span className="num text-muted text-xs">
                      {c.date.replaceAll("-", ".")}
                      {c.category && `・${c.category}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="num text-accent text-xl whitespace-nowrap">
                      {countdownLabel(c.date, today)}
                    </span>
                    <ChevronRight aria-hidden className="text-ghost size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {adding ? (
            <AddContest today={today} initial={adding} onDone={() => setAdding(null)} />
          ) : (
            <div className="flex flex-col gap-2">
              {prepMissing && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setAdding({ name: prep.contest_name, date: prep.contest_date })}
                >
                  プレップの大会（{prep.contest_name}）を登録
                </Button>
              )}
              <Button size="lg" onClick={() => setAdding({})}>
                ＋ 大会を追加
              </Button>
            </div>
          )}

          {past.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="text-ghost h-10 self-start text-xs underline underline-offset-4"
              >
                {showPast ? "過去の大会を閉じる" : `過去の大会（${past.length}）`}
              </button>
              {showPast &&
                past.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contest/${c.id}`}
                    className="surface text-muted flex min-h-12 items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="num">{c.date.replaceAll("-", ".")}</span>
                  </Link>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
