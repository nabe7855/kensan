"use client";

import { Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checklist, countdownLabel, type ChecklistItem } from "@/lib/contest";
import { addDaysISO, daysUntilContest, todayISO } from "@/lib/prep";
import { useContestChecks, useContestRoutines, useContests } from "@/lib/queries/contests";
import { cn } from "@/lib/utils";
import { useContestActions } from "./useContestActions";

const when = (days: number) => (days === 0 ? "当日" : `${days}日前から`);

function Item({ item, onToggle }: { item: ChecklistItem; onToggle: (done: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="surface flex items-start gap-2 px-2 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={`${item.title}${item.done ? "（済み）" : ""}`}
        onClick={() => onToggle(!item.done)}
        className="flex size-12 shrink-0 items-center justify-center"
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md border-2",
            item.done ? "border-accent bg-accent text-bg" : "border-ghost",
          )}
        >
          {item.done && <Check className="size-4" strokeWidth={3} />}
        </span>
      </button>
      <button
        type="button"
        onClick={() => item.note && setOpen((v) => !v)}
        className="flex min-h-12 min-w-0 flex-1 flex-col justify-center py-1 text-left"
      >
        <span className={cn("text-base leading-snug", item.done && "text-muted line-through")}>
          {item.title}
        </span>
        <span className="text-ghost text-xs">
          {item.own ? "自分のルーティン・" : ""}
          {item.daily ? `${when(item.days)}毎日` : when(item.days)}
        </span>
        {open && item.note && (
          <span className="text-muted mt-1 text-xs leading-relaxed">{item.note}</span>
        )}
      </button>
    </li>
  );
}

function RoutineEditor() {
  const routines = useContestRoutines();
  const { saveRoutine, removeRoutine } = useContestActions();
  const [title, setTitle] = useState("");
  const [days, setDays] = useState(7);
  const [daily, setDaily] = useState(false);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold">自分のルーティン</h2>
      <p className="text-ghost text-xs">すべての大会に共通で、日にちが来るとやることに並びます</p>
      <ul className="flex flex-col gap-1.5">
        {(routines.data ?? []).map((r) => (
          <li key={r.id} className="surface flex min-h-12 items-center justify-between gap-2 pl-3">
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{r.title}</span>
              <span className="text-ghost text-xs">
                {r.daily ? `${when(r.days_before)}毎日` : when(r.days_before)}
              </span>
            </span>
            <button
              type="button"
              aria-label={`${r.title} を削除`}
              onClick={() => void removeRoutine(r.id)}
              className="text-ghost flex size-12 items-center justify-center"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="surface flex flex-col gap-2 px-3 py-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await saveRoutine({
            id: crypto.randomUUID(),
            title: title.trim(),
            days_before: days,
            daily,
          });
          setTitle("");
        }}
      >
        <input
          maxLength={60}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：ポージング練習 30 分"
          aria-label="ルーティンの内容"
          className="border-border text-fg placeholder:text-ghost h-12 rounded-md border bg-transparent px-3 text-base focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="1 日減らす"
              onClick={() => setDays((d) => Math.max(0, d - 1))}
              className="border-border size-12 rounded-md border text-lg"
            >
              −
            </button>
            <span className="num w-16 text-center text-lg">
              {days === 0 ? "当日" : `${days}日前`}
            </span>
            <button
              type="button"
              aria-label="1 日増やす"
              onClick={() => setDays((d) => Math.min(120, d + 1))}
              className="border-border size-12 rounded-md border text-lg"
            >
              ＋
            </button>
          </div>
          <button
            type="button"
            aria-pressed={daily}
            onClick={() => setDaily((v) => !v)}
            className={cn(
              "h-12 rounded-md border px-3 text-sm",
              daily ? "border-accent text-accent" : "border-border text-muted",
            )}
          >
            {daily ? "そこから毎日" : "1 回だけ"}
          </button>
        </div>
        <Button type="submit" variant="secondary" disabled={!title.trim()}>
          ルーティンに追加
        </Button>
      </form>
    </section>
  );
}

/** One contest: big countdown, what to do now, what comes next, and the user's own routine. */
export function ContestDetail({ id }: { id: string }) {
  const router = useRouter();
  const today = todayISO();
  const contests = useContests();
  const routines = useContestRoutines();
  const checks = useContestChecks(id);
  const { setChecked, removeContest } = useContestActions();
  const [showDone, setShowDone] = useState(false);

  const contest = contests.data?.find((c) => c.id === id);
  if (contests.isPending) return <div className="surface h-64 animate-pulse" aria-busy />;
  if (!contest) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted text-sm">この大会は見つかりませんでした</p>
        <Button onClick={() => router.push("/contest")}>大会一覧へ</Button>
      </div>
    );
  }

  const left = daysUntilContest(contest.date, today);
  const list = checklist(contest.date, today, routines.data ?? [], checks.data ?? []);
  const toggle = (item: ChecklistItem, done: boolean) =>
    void setChecked(contest.id, { task_key: item.key, on_date: today }, done, !item.daily);
  const nextOpen = list.upcoming.at(0);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <section className="flex flex-col gap-1">
        <p className="text-muted text-sm">{contest.name}</p>
        <p className="flex items-baseline gap-2">
          {left > 0 ? (
            <>
              <span className="text-muted text-lg">あと</span>
              <span className="num text-accent text-[88px] leading-none">{left}</span>
              <span className="text-muted text-lg">日</span>
            </>
          ) : (
            <span className="num text-accent text-5xl">{countdownLabel(contest.date, today)}</span>
          )}
        </p>
        <p className="num text-ghost text-xs">
          {contest.date.replaceAll("-", ".")}
          {contest.category && `・${contest.category}`}
          {contest.location && `・${contest.location}`}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-bold">
          今やること
          {list.now.length > 0 && <span className="num text-accent ml-2">{list.now.length}</span>}
        </h2>
        {list.now.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {list.now.map((i) => (
              <Item key={i.key} item={i} onToggle={(d) => toggle(i, d)} />
            ))}
          </ul>
        ) : (
          <p className="surface text-muted px-4 py-4 text-sm">
            {left < 0
              ? "おつかれさまでした"
              : nextOpen
                ? `今はありません。次は ${addDaysISO(contest.date, -nextOpen.days).slice(5).replace("-", "/")} から`
                : "今はありません"}
          </p>
        )}
        <p className="text-ghost text-xs">項目をタップすると理由が出ます</p>
      </section>

      {list.upcoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-bold">これから</h2>
          <ul className="flex flex-col gap-1.5">
            {list.upcoming.map((i) => (
              <Item key={i.key} item={i} onToggle={(d) => toggle(i, d)} />
            ))}
          </ul>
        </section>
      )}

      {list.done.length > 0 && (
        <section className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="text-ghost h-10 self-start text-xs underline underline-offset-4"
          >
            {showDone ? "済みを閉じる" : `済み（${list.done.length}）`}
          </button>
          {showDone && (
            <ul className="flex flex-col gap-1.5">
              {list.done.map((i) => (
                <Item key={i.key} item={i} onToggle={(d) => toggle(i, d)} />
              ))}
            </ul>
          )}
        </section>
      )}

      <Button asChild variant="secondary">
        <Link href="/album">ポーズ写真を撮る・比べる</Link>
      </Button>

      <RoutineEditor />

      <Button
        variant="ghost"
        onClick={async () => {
          if (!window.confirm(`${contest.name} を削除します。チェックした記録も消えます。`)) return;
          await removeContest(contest.id);
          router.push("/contest");
        }}
      >
        この大会を削除
      </Button>
    </div>
  );
}
