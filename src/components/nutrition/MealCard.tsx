"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { displayAmount, foodGroupLabel, hasUnit, stepGrams } from "@/lib/food-groups";
import {
  isOrdinalSlot,
  lowProteinNote,
  mealMacros,
  proteinShare,
  variantLabel,
  variantsOf,
  type PlanMeal,
} from "@/lib/meal-plan";
import { macrosFor } from "@/lib/nutrition";
import type { LogItem, Template } from "@/lib/queries/nutrition";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  slot: string;
  meal: PlanMeal | null;
  selected: boolean;
  templates: Template[];
  onSelect: () => void;
  onStep: (item: LogItem, grams: number) => void;
  onEditItem: (item: LogItem) => void;
  onAddFood: () => void;
  onChangeSet: () => void;
  onApplyTemplate: (t: Template) => void;
  onSaveSet: () => void;
  onToggleEaten: (eaten: boolean) => void;
  onClear: () => void;
  extraActions?: React.ReactNode;
};

const round = (n: number) => Math.round(n * 10) / 10;

function Stepper({
  item,
  onStep,
  onEdit,
}: {
  item: LogItem;
  onStep: (g: number) => void;
  onEdit: () => void;
}) {
  const step = stepGrams(item.food, item.grams);
  const shown = displayAmount(item.food, item.grams);
  return (
    <div className="grid grid-cols-[2.75rem_4.25rem_2.75rem] items-center gap-1.5">
      <button
        type="button"
        aria-label={`${item.food.name}を減らす`}
        onClick={() => onStep(Math.max(0, round(item.grams - step)))}
        className="border-border text-muted active:bg-card flex h-11 items-center justify-center rounded-md border"
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`${item.food.name}の量を入力`}
        onClick={onEdit}
        className="border-border flex h-11 items-baseline justify-center gap-0.5 rounded-md border pt-2"
      >
        <span className="num text-xl leading-none">{shown.value}</span>
        <span className="text-muted text-[10px]">{shown.unit}</span>
      </button>
      <button
        type="button"
        aria-label={`${item.food.name}を増やす`}
        onClick={() => onStep(round(item.grams + step))}
        className="border-border text-muted active:bg-card flex h-11 items-center justify-center rounded-md border"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/** One meal of the day: planned or eaten, with per-item steppers and set actions. */
export function MealCard(props: Props) {
  const { index, slot, meal, selected, templates } = props;
  const eaten = !!meal?.eatenAt;
  const [expanded, setExpanded] = useState(!eaten);
  const items = meal?.items ?? [];
  const empty = items.length === 0;
  const m = mealMacros({ items });
  const note = lowProteinNote(m);
  const variants = variantsOf(templates, meal?.templateId ?? null);
  const group = templates.find((t) => t.id === meal?.templateId)?.group_name ?? null;
  const showBody = !eaten || expanded;

  return (
    <section
      className={cn(
        "surface overflow-hidden",
        selected && "border-accent/60",
        eaten && !expanded && "opacity-80",
      )}
    >
      <button
        type="button"
        onClick={() => {
          props.onSelect();
          if (eaten) setExpanded((v) => !v);
        }}
        aria-pressed={selected}
        className="flex w-full items-center gap-3 px-3 pt-3 pb-2 text-left"
      >
        <span className="num bg-bg flex size-11 shrink-0 items-center justify-center rounded-md text-xl">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn("text-xs", selected ? "text-accent" : "text-muted")}>
            {index + 1}食目{isOrdinalSlot(slot) ? "" : ` ・ ${slot}`}
          </span>
          <span className="truncate text-lg font-bold">
            {meal?.title ?? (empty ? "未設定" : "記録")}
          </span>
        </span>
        {!empty && (
          <span
            className={cn(
              "shrink-0 rounded-md border px-2 py-0.5 text-[11px]",
              eaten ? "border-accent text-accent" : "border-border text-muted",
            )}
          >
            {eaten ? "食べた ✓" : "予定"}
          </span>
        )}
      </button>

      {!empty && (
        <p className="num text-muted px-3 pb-2 text-sm">
          <span className="text-fg">{Math.round(m.kcal)} kcal</span> ・ P{" "}
          <span className="text-fg">{Math.round(m.protein_g)}</span> / F {Math.round(m.fat_g)} / C{" "}
          {Math.round(m.carb_g)} g
          <span className="text-ghost ml-2 font-sans text-xs font-normal">
            たんぱく質 {Math.round(proteinShare(m) * 100)}%
          </span>
        </p>
      )}

      {showBody && (
        <div className="px-3 pb-3">
          {variants.length > 1 && (
            <div className="-mx-3 mb-1 flex gap-1.5 overflow-x-auto px-3 pb-1">
              {variants.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={t.id === meal?.templateId}
                  onClick={() => t.id !== meal?.templateId && props.onApplyTemplate(t)}
                  className={cn(
                    "h-9 shrink-0 rounded-md border px-3 text-sm",
                    t.id === meal?.templateId
                      ? "border-accent bg-accent text-bg font-bold"
                      : "border-border text-muted",
                  )}
                >
                  {variantLabel(t.name, group)}
                </button>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <ul>
              {items.map((i) => (
                <li
                  key={i.id}
                  className="border-border flex items-center justify-between gap-2 border-t py-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm leading-snug">{i.food.name}</span>
                    <span className="text-ghost text-[10px]">
                      {[
                        foodGroupLabel(i.food.food_group),
                        hasUnit(i.food) && `${Math.round(i.grams)}g`,
                        `${Math.round(macrosFor(i.food, i.grams).kcal)}kcal`,
                      ]
                        .filter(Boolean)
                        .join(" ・ ")}
                    </span>
                  </span>
                  <Stepper
                    item={i}
                    onStep={(g) => props.onStep(i, g)}
                    onEdit={() => props.onEditItem(i)}
                  />
                </li>
              ))}
            </ul>
          )}

          {note && <p className="text-warn mt-2 text-xs leading-relaxed">{note}</p>}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {props.extraActions}
            <button
              type="button"
              onClick={props.onChangeSet}
              className="text-muted h-10 text-sm underline underline-offset-4"
            >
              {empty ? "セットを当てはめる" : "セット変更"}
            </button>
            <button
              type="button"
              onClick={props.onAddFood}
              className="text-muted h-10 text-sm underline underline-offset-4"
            >
              ＋ 食材
            </button>
          </div>

          {!empty && (
            <div className="mt-2 grid grid-cols-[1fr_1.4fr] gap-2">
              <Button variant="outline" className="h-12 px-2 text-sm" onClick={props.onSaveSet}>
                この組み合わせを保存
              </Button>
              {eaten ? (
                <Button
                  variant="secondary"
                  className="h-12"
                  onClick={() => props.onToggleEaten(false)}
                >
                  予定に戻す
                </Button>
              ) : (
                <Button className="h-12 text-base" onClick={() => props.onToggleEaten(true)}>
                  食べた <Check className="size-4" strokeWidth={3} />
                </Button>
              )}
            </div>
          )}
          {!empty && (
            <button
              type="button"
              onClick={() =>
                window.confirm(`${index + 1}食目（${slot}）の内容を削除します`) && props.onClear()
              }
              className="text-ghost mt-2 h-10 text-xs"
            >
              この食事を削除
            </button>
          )}
        </div>
      )}
    </section>
  );
}
