"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MacroCards } from "@/components/nutrition/MacroCards";
import { DateNav, dateLabel } from "@/components/ui/date-nav";
import { activeItems, isConcerning } from "@/lib/condition";
import { displayAmount } from "@/lib/food-groups";
import { dayTotals, mealMacros, mealOrder } from "@/lib/meal-plan";
import { dayTypeFor, targetFor } from "@/lib/nutrition";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useDayMeals, useDayOverride, useTargets } from "@/lib/queries/nutrition";
import { jstMidnight, useSessions } from "@/lib/queries/training";
import { averageInterval, formatRest, setIntervals } from "@/lib/rest-timer";
import { exercisesOf, partsText, sessionParts, sessionVolume } from "@/lib/sessions";
import { SET_TYPES } from "@/lib/strength";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { weightLabel } from "@/components/workout/SetTable";
import { readActiveWorkout, saveActiveWorkout } from "@/lib/useActiveWorkout";
import { workoutFromSaved } from "@/lib/workout";
import type { Session } from "@/lib/sessions";
import { cn } from "@/lib/utils";

const FEEL = ["", "低", "中", "高", "最大"];
const BOWEL: Record<string, string> = { good: "良", normal: "普通", bad: "悪" };
const hm = (iso: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

function Section({
  title,
  children,
  empty,
}: {
  title: string;
  children?: React.ReactNode;
  empty?: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-muted text-xs">{title}</h2>
      {children ?? <p className="surface text-ghost px-4 py-4 text-sm">{empty}</p>}
    </section>
  );
}

/** Everything about one day on one screen: condition, training and meals. */
export function DayReport({ date }: { date: string }) {
  const router = useRouter();
  const today = todayISO();
  const { trackLibido, userId } = useAppData();
  const { write } = useSync();

  /** Reopen a finished workout in the workout screen to fix weights, reps or sets. */
  async function editSession(s: Session) {
    if (await readActiveWorkout()) {
      window.alert("進行中のワークアウトがあります。先に完了するか破棄してから編集してください。");
      return;
    }
    await saveActiveWorkout(
      workoutFromSaved(
        {
          id: s.id,
          title: partsText(sessionParts(s)) || "トレーニング",
          started_at: s.started_at,
          ended_at: s.ended_at,
        },
        s.sets.map((x) => ({
          id: x.id,
          exercise_id: x.exercise_id,
          set_no: x.set_no,
          set_type: x.set_type,
          weight_kg: x.weight_kg,
          reps: x.reps,
          rir: x.rir,
          done_at: x.done_at,
          bodyweight_kg: x.bodyweight_kg,
        })),
      ),
    );
    router.push("/training/workout");
  }

  /** Delete a workout and its sets (e.g. one entered twice by mistake). */
  async function deleteSession(s: Session) {
    const name = partsText(sessionParts(s)) || "トレーニング";
    if (
      !window.confirm(
        `${hm(s.started_at)} の「${name}」（${s.sets.length} セット）を削除します。元に戻せません。`,
      )
    )
      return;
    await write({ table: "workouts", kind: "delete", match: { id: s.id, user_id: userId } });
  }
  const checkins = useCheckins(date, date);
  const sessions = useSessions(jstMidnight(date), jstMidnight(addDaysISO(date, 1)));
  const meals = useDayMeals(date);
  const targets = useTargets();
  const override = useDayOverride(date);

  const checkin = checkins.data?.[0] ?? null;
  const daySessions = [...(sessions.data ?? [])].sort((a, b) =>
    a.started_at.localeCompare(b.started_at),
  );
  const dayType = dayTypeFor(daySessions.length > 0, override.data ?? null);
  const target = targetFor(targets.data ?? [], date, dayType);
  const { eaten, planned } = dayTotals(meals.data ?? []);
  const loggedMeals = (meals.data ?? []).filter((m) => m.items.length > 0);
  const order = mealOrder(loggedMeals, []);
  const loading = checkins.isPending || sessions.isPending || meals.isPending;

  return (
    <div className="flex flex-col gap-5">
      <DateNav date={date} today={today} onChange={(d) => router.replace(`/report/${d}`)}>
        <span className="text-ghost ml-2 text-xs">のレポート</span>
      </DateNav>

      {loading ? (
        <div className="surface h-64 animate-pulse" aria-busy />
      ) : (
        <>
          <Section title="コンディション" empty="記録なし">
            {checkin ? (
              <div className="surface flex flex-col gap-3 px-4 py-4">
                {checkin.weight_kg != null && (
                  <p className="flex items-baseline gap-2">
                    <span className="text-muted text-xs">体重</span>
                    <span className="num text-4xl leading-none">
                      {Number(checkin.weight_kg).toFixed(1)}
                    </span>
                    <span className="num text-muted">kg</span>
                  </p>
                )}
                <div className="grid grid-cols-5 gap-1.5">
                  {activeItems(trackLibido).map((it) => {
                    const v = checkin[it.key];
                    return (
                      <div
                        key={it.key}
                        className="bg-bg flex flex-col items-center rounded-md py-2"
                      >
                        <span className="text-muted text-[11px]">{it.label}</span>
                        <span
                          className={cn(
                            "num text-2xl leading-none",
                            v == null
                              ? "text-ghost"
                              : isConcerning(it.key, v)
                                ? "text-warn"
                                : "text-fg",
                          )}
                        >
                          {v ?? "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-muted text-xs">
                  {checkin.bowel && <>便通 {BOWEL[checkin.bowel] ?? checkin.bowel}　</>}
                  {checkin.rhr != null && <>心拍 {checkin.rhr}　</>}
                  {checkin.temp_c != null && <>体温 {Number(checkin.temp_c).toFixed(1)}℃</>}
                </p>
                {checkin.note && (
                  <blockquote className="border-accent border-l-2 pl-3 text-base leading-relaxed">
                    {checkin.note}
                  </blockquote>
                )}
              </div>
            ) : undefined}
          </Section>

          <Section title="トレーニング" empty="トレーニングなし">
            {daySessions.length > 0
              ? daySessions.map((s) => {
                  const minutes = s.ended_at
                    ? Math.round(
                        (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) /
                          60_000,
                      )
                    : null;
                  const working = s.sets.filter((x) => x.set_type !== "warmup").length;
                  return (
                    <div key={s.id} className="surface flex flex-col gap-3 px-4 py-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-bold">
                          {partsText(sessionParts(s)) || "トレーニング"}
                        </span>
                        <span className="num text-muted text-sm">
                          {hm(s.started_at)}
                          {minutes != null && ` ・ ${minutes}分`}
                        </span>
                      </div>
                      <p className="num text-muted text-sm">
                        総ボリューム{" "}
                        <span className="text-fg">
                          {Math.round(sessionVolume(s)).toLocaleString("ja-JP")}
                        </span>{" "}
                        kg ・ {working}セット
                      </p>
                      <ul className="flex flex-col gap-2">
                        {exercisesOf(s).map((e) => {
                          const rest = averageInterval(setIntervals(e.sets.map((x) => x.done_at)));
                          return (
                            <li key={e.exerciseId}>
                              <p className="flex items-baseline justify-between gap-2 text-base">
                                {e.name}
                                {rest !== null && (
                                  <span className="num text-ghost text-xs">
                                    セット間 平均 {formatRest(rest)}
                                  </span>
                                )}
                              </p>
                              <p className="num text-muted flex flex-wrap gap-x-3 text-sm">
                                {e.sets.map((x, i) => (
                                  <span
                                    key={i}
                                    className={cn(
                                      x.set_type === "warmup" && "text-ghost",
                                      x.is_pr && "text-accent",
                                    )}
                                  >
                                    {weightLabel(x.weight_kg, x.bodyweight_kg) || "—"}×
                                    {x.reps ?? "—"}
                                    {x.set_type !== "normal" && x.set_type !== "warmup" && (
                                      <span className="text-accent ml-0.5 text-[10px]">
                                        {SET_TYPES.find((t) => t.key === x.set_type)?.short}
                                      </span>
                                    )}
                                    {x.is_pr && " PR"}
                                  </span>
                                ))}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                      {[s.pump, s.soreness, s.joint, s.load_feel].some((v) => v != null) && (
                        <p className="text-muted text-xs">
                          感触：
                          {(
                            [
                              ["パンプ", s.pump],
                              ["筋肉痛", s.soreness],
                              ["関節", s.joint],
                              ["負荷感", s.load_feel],
                            ] as const
                          )
                            .filter(([, v]) => v != null)
                            .map(([l, v]) => `${l} ${FEEL[v!] ?? v}`)
                            .join(" ・ ")}
                        </p>
                      )}
                      <div className="border-border flex gap-2 border-t pt-2">
                        <button
                          type="button"
                          onClick={() => void editSession(s)}
                          className="text-accent h-10 flex-1 rounded-md text-sm underline underline-offset-4"
                        >
                          このトレを編集
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteSession(s)}
                          className="text-ghost h-10 flex-1 rounded-md text-sm underline underline-offset-4"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  );
                })
              : undefined}
          </Section>

          <Section title={`食事（${dayType === "train" ? "トレ日" : "オフ日"}）`} empty="記録なし">
            {loggedMeals.length > 0 ? (
              <div className="flex flex-col gap-2">
                <MacroCards eaten={eaten} planned={planned} target={target} />
                {order.map((slot, i) => {
                  const m = loggedMeals.find((x) => x.slot === slot);
                  if (!m) return null;
                  const mm = mealMacros(m);
                  return (
                    <div key={slot} className="surface flex flex-col gap-1 px-4 py-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-base font-bold">
                          {i + 1}食目{m.title ? ` ・ ${m.title}` : ""}
                        </span>
                        <span
                          className={cn("text-[11px]", m.eatenAt ? "text-accent" : "text-ghost")}
                        >
                          {m.eatenAt ? "食べた" : "予定"}
                        </span>
                      </div>
                      <p className="num text-muted text-xs">
                        {Math.round(mm.kcal)} kcal ・ P {Math.round(mm.protein_g)} / F{" "}
                        {Math.round(mm.fat_g)} / C {Math.round(mm.carb_g)}
                      </p>
                      <p className="text-sm leading-relaxed">
                        {m.items
                          .filter((it) => it.food)
                          .map((it) => {
                            const a = displayAmount(it.food, it.grams);
                            return `${it.food.name} ${a.value}${a.unit}`;
                          })
                          .join("、")}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : undefined}
          </Section>

          {date === today && (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/condition"
                className="border-border text-muted flex h-12 items-center justify-center rounded-md border text-sm"
              >
                チェックインを書く
              </Link>
              <Link
                href="/nutrition"
                className="border-border text-muted flex h-12 items-center justify-center rounded-md border text-sm"
              >
                食事を記録する
              </Link>
            </div>
          )}
          <p className="text-ghost text-center text-xs">{dateLabel(date, today)}のレポート</p>
        </>
      )}
    </div>
  );
}
