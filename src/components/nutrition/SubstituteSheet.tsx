"use client";

import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { displayAmount, foodGroupLabel } from "@/lib/food-groups";
import { macrosFor, type Food } from "@/lib/nutrition";
import { useFoodSearch, useFrequentFoods, type LogItem } from "@/lib/queries/nutrition";
import { BASIS_LABEL, basisFor, signed, suggestSubstitutes } from "@/lib/substitute";
import { cn } from "@/lib/utils";

type Props = {
  items: LogItem[];
  onClose: () => void;
  onReplace: (item: LogItem, food: Food, grams: number) => void;
};

const amount = (food: Food, grams: number) => {
  const a = displayAmount(food, grams);
  return `${a.value}${a.unit}`;
};

function Suggestions({
  item,
  onPick,
}: {
  item: LogItem;
  onPick: (food: Food, grams: number) => void;
}) {
  const group = item.food.food_group;
  const sameGroup = useFoodSearch("", group ? { kind: "group", group } : { kind: "all" });
  const frequent = useFrequentFoods();
  const original = macrosFor(item.food, item.grams);
  const basis = basisFor(original);
  const list = useMemo(
    () => suggestSubstitutes(item, [...(frequent.data ?? []), ...(sameGroup.data ?? [])], 6),
    [item, frequent.data, sameGroup.data],
  );

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <p className="text-muted text-xs leading-relaxed">
        {item.food.name} {amount(item.food, item.grams)} と{BASIS_LABEL[basis]}
        がそろう量で置き換えます。 差は P / F / C（g）と kcal です。
      </p>
      <ul className="flex-1 overflow-y-auto">
        {list.map((s) => (
          <li key={s.food.id}>
            <button
              type="button"
              onClick={() => onPick(s.food, s.grams)}
              className="border-border flex min-h-16 w-full flex-col justify-center gap-0.5 border-b px-1 py-2 text-left"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-base leading-snug">{s.food.name}</span>
                <span className="num text-accent shrink-0 text-lg">{amount(s.food, s.grams)}</span>
              </span>
              <span className="num text-ghost text-xs">
                {foodGroupLabel(s.food.food_group) ?? "—"} ・ P {signed(s.delta.protein_g)} / F{" "}
                <span className={cn(s.delta.fat_g > 5 && "text-warn")}>
                  {signed(s.delta.fat_g)}
                </span>{" "}
                / C {signed(s.delta.carb_g)} ・ {signed(s.delta.kcal)} kcal
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && (sameGroup.isFetched || frequent.isFetched) && (
          <li className="text-muted py-6 text-sm">
            近い代わりが見つかりません。「＋ 食材」から自由に選べます
          </li>
        )}
      </ul>
    </div>
  );
}

/** 代わりを探す: pick an item in the meal, then a replacement with matched nutrition. */
export function SubstituteSheet({ items, onClose, onReplace }: Props) {
  const [target, setTarget] = useState<LogItem | null>(items.length === 1 ? items[0]! : null);

  return (
    <Sheet title="代わりを探す" onClose={onClose}>
      {target ? (
        <div className="flex flex-1 flex-col gap-3 overflow-hidden pb-3">
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="text-ghost self-start text-sm underline underline-offset-4"
            >
              置き換える食材を選び直す
            </button>
          )}
          <Suggestions
            item={target}
            onPick={(food, grams) => {
              onReplace(target, food, grams);
              onClose();
            }}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-3">
          <p className="text-muted text-sm">どの食材を置き換えますか</p>
          {items.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setTarget(i)}
              className="surface flex min-h-14 items-center justify-between px-3 text-left"
            >
              <span className="text-base">{i.food.name}</span>
              <span className="num text-muted">{amount(i.food, i.grams)}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
