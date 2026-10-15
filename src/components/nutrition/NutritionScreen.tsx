"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { Button } from "@/components/ui/button";
import { DateNav } from "@/components/ui/date-nav";
import { fillReason, suggestFill } from "@/lib/fill";
import { dayTotals } from "@/lib/meal-plan";
import {
  dayTypeFor,
  slotForHour,
  subtractMacros,
  sumMacros,
  targetFor,
  type DayType,
} from "@/lib/nutrition";
import { todayISO } from "@/lib/prep";
import {
  useDayMeals,
  useDayOverride,
  useFrequentFoods,
  useTargets,
  useTemplates,
  type LogItem,
} from "@/lib/queries/nutrition";
import { useRoutines } from "@/lib/queries/training";
import { cn } from "@/lib/utils";
import { FoodSheet } from "./FoodSheet";
import { ItemSheet } from "./ItemSheet";
import { MealCard } from "./MealCard";
import { SaveSetSheet } from "./SaveSetSheet";
import { SetSheet } from "./SetSheet";
import { MacroCards } from "./MacroCards";
import { TargetsSheet } from "./TargetsSheet";
import { useMealActions } from "./useMealActions";

export function NutritionScreen() {
  const { mealSlots } = useAppData();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState(() => slotForHour(new Date().getHours(), mealSlots));
  const [adding, setAdding] = useState<string | null>(null);
  const [choosingSet, setChoosingSet] = useState<string | null>(null);
  const [savingSet, setSavingSet] = useState<string | null>(null);
  const [editing, setEditing] = useState<LogItem | null>(null);
  const [editingTargets, setEditingTargets] = useState(false);
  const [showAllFills, setShowAllFills] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const meals = useDayMeals(date);
  const templates = useTemplates();
  const targets = useTargets();
  const override = useDayOverride(date);
  const routines = useRoutines();
  const frequent = useFrequentFoods();
  const actions = useMealActions(date);

  const dayType: DayType = dayTypeFor(date, routines.data ?? [], override.data ?? null);
  const target = targetFor(targets.data ?? [], date, dayType);
  const { eaten, planned } = useMemo(() => dayTotals(meals.data ?? []), [meals.data]);
  // Fill suggestions cover what is left after everything planned is eaten.
  const remaining = target ? subtractMacros(target, sumMacros([eaten, planned])) : null;
  const fills = useMemo(
    () => (remaining && frequent.data ? suggestFill(remaining, frequent.data) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [remaining?.protein_g, remaining?.fat_g, remaining?.carb_g, frequent.data],
  );

  const slots = [
    ...mealSlots,
    ...(meals.data ?? []).map((m) => m.slot).filter((s) => !mealSlots.includes(s)),
  ];

  function flash(text: string) {
    setNotice(text);
    setTimeout(() => setNotice((n) => (n === text ? null : n)), 2000);
  }

  return (
    <div className="flex flex-col gap-3 pb-20">
      <DateNav date={date} today={today} onChange={setDate}>
        <button
          type="button"
          onClick={() => actions.setOverride(dayType === "train" ? "off" : "train")}
          className={cn(
            "ml-3 h-8 rounded-md border px-2 text-xs",
            dayType === "train" ? "border-accent text-accent" : "border-border text-muted",
          )}
          aria-label="トレ日とオフ日を切り替え"
        >
          {dayType === "train" ? "トレ日" : "オフ日"}
          {override.data ? "（手動）" : ""}
        </button>
      </DateNav>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <MacroCards eaten={eaten} planned={planned} target={target} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEditingTargets(true)}
        className="text-ghost -mt-1 self-end text-xs underline underline-offset-4"
      >
        {target ? "目標を変更" : "PFC 目標を設定する"}
      </button>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-bold">マイ定食</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {templates.data?.map((t) => (
            <div key={t.id} className="surface flex h-16 w-40 shrink-0 items-stretch">
              <button
                type="button"
                onClick={async () => {
                  await actions.addItems(
                    slot,
                    t.items.map((i) => ({ food: i.food, grams: i.grams })),
                  );
                  flash(`${t.name} を${slot}に記録した`);
                }}
                className="border-l-accent flex flex-1 items-center border-l-2 pl-3 text-left text-base font-bold"
              >
                {t.name}
              </button>
              <Link
                href={`/nutrition/templates/${t.id}`}
                aria-label={`${t.name} を編集`}
                className="text-ghost flex w-10 items-center justify-center"
              >
                <MoreHorizontal className="size-4" />
              </Link>
            </div>
          ))}
          <Link
            href="/nutrition/templates/new"
            className="border-border text-accent flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed"
            aria-label="マイ定食を作る"
          >
            <Plus className="size-5" />
          </Link>
        </div>
      </section>

      {notice && (
        <p role="status" className="text-muted text-sm">
          {notice}
        </p>
      )}

      {meals.isError && (
        <p className="text-warn text-sm">
          読み込めませんでした。電波の良い場所で開き直してください
        </p>
      )}

      {slots.map((s, index) => {
        const meal = meals.data?.find((m) => m.slot === s) ?? null;
        return (
          <MealCard
            key={`${date}:${s}`}
            index={index}
            slot={s}
            meal={meal}
            selected={s === slot}
            templates={templates.data ?? []}
            onSelect={() => setSlot(s)}
            onStep={(item, grams) =>
              void (grams > 0 ? actions.updateGrams(item.id, grams) : actions.removeItem(item.id))
            }
            onEditItem={setEditing}
            onAddFood={() => {
              setSlot(s);
              setAdding(s);
            }}
            onChangeSet={() => setChoosingSet(s)}
            onApplyTemplate={(t) =>
              void actions.applySet(s, {
                id: t.id,
                name: t.name,
                items: t.items.map((i) => ({ food: i.food, grams: i.grams })),
              })
            }
            onSaveSet={() => setSavingSet(s)}
            onToggleEaten={(e) => void actions.setEaten(s, e)}
            onClear={() => void actions.clearMeal(s)}
          />
        );
      })}

      {fills.length > 0 && (
        <section className="surface border-l-accent flex flex-col gap-2 border-l-2 px-3 py-3">
          <h2 className="text-base font-bold">残りを埋める</h2>
          {(showAllFills ? fills : fills.slice(0, 1)).map((f, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <p className="num text-base">
                {f.items.map((it) => `${it.food.name} ${it.grams}g`).join(" + ")}
              </p>
              <Button
                variant="secondary"
                className="h-10 shrink-0 px-3 text-sm"
                onClick={async () => {
                  await actions.addItems(slot, f.items);
                  flash(`${slot}に追加した`);
                }}
              >
                {slot}に追加
              </Button>
            </div>
          ))}
          <p className="text-ghost text-xs leading-relaxed">{fillReason(remaining!, fills[0]!)}</p>
          {fills.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllFills((v) => !v)}
              className="text-ghost self-start text-xs underline underline-offset-4"
            >
              {showAllFills ? "候補を閉じる" : `他の候補（${fills.length - 1}）`}
            </button>
          )}
        </section>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto max-w-[480px] px-4 pb-2">
          <Button size="lg" className="w-full" onClick={() => setAdding(slot)}>
            ＋ {slot}に食品を追加
          </Button>
        </div>
      </div>

      {adding && (
        <FoodSheet
          slot={adding}
          onClose={() => setAdding(null)}
          onAdd={(food, grams) => void actions.addItems(adding, [{ food, grams }])}
        />
      )}
      {choosingSet && (
        <SetSheet
          title={`${choosingSet}にセットを当てはめる`}
          templates={templates.data ?? []}
          onClose={() => setChoosingSet(null)}
          onPick={(t) => {
            void actions.applySet(choosingSet, {
              id: t.id,
              name: t.name,
              items: t.items.map((i) => ({ food: i.food, grams: i.grams })),
            });
            setChoosingSet(null);
          }}
        />
      )}
      {savingSet &&
        (() => {
          const meal = meals.data?.find((m) => m.slot === savingSet);
          const current = templates.data?.find((t) => t.id === meal?.templateId);
          return (
            <SaveSetSheet
              defaultName={meal?.title ?? ""}
              defaultGroup={current?.group_name ?? null}
              templates={templates.data ?? []}
              onClose={() => setSavingSet(null)}
              onSave={(name, group) =>
                void actions.saveAsSet(savingSet, {
                  name,
                  group,
                  items: (meal?.items ?? []).map((i) => ({ food: i.food, grams: i.grams })),
                })
              }
            />
          );
        })()}
      {editing && (
        <ItemSheet
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(g) => void actions.updateGrams(editing.id, g)}
          onDelete={() => void actions.removeItem(editing.id)}
        />
      )}
      {editingTargets && (
        <TargetsSheet
          today={today}
          targets={targets.data ?? []}
          onClose={() => setEditingTargets(false)}
          onSave={(rows) => void actions.saveTargets(rows, today)}
        />
      )}
    </div>
  );
}
