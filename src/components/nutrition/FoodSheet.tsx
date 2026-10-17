"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { FOOD_GROUPS, foodGroupLabel, hasUnit } from "@/lib/food-groups";
import { type Food } from "@/lib/nutrition";
import {
  nutritionKeys,
  useFoodSearch,
  useFrequentFoods,
  type FoodFilter,
} from "@/lib/queries/nutrition";
import { cn } from "@/lib/utils";
import { AmountEntry } from "./AmountEntry";

type Props = {
  slot: string;
  onClose: () => void;
  onAdd: (food: Food, grams: number) => void;
};

function FoodRow({ food, onPick }: { food: Food; onPick: () => void }) {
  const unit = hasUnit(food) ? food : null;
  const serving = unit ? Math.round((food.kcal * unit.unit_grams) / 100) : null;
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="border-border flex min-h-14 w-full items-center justify-between gap-3 border-b px-1 py-2 text-left"
      >
        <span className="flex flex-col">
          <span className="text-base leading-snug">
            {food.name}
            {food.user_id && <span className="text-ghost ml-2 text-xs">マイ食品</span>}
          </span>
          <span className="text-ghost text-[11px]">
            {[foodGroupLabel(food.food_group), unit && `1${unit.unit_name} ${unit.unit_grams}g`]
              .filter(Boolean)
              .join(" ・ ")}
          </span>
        </span>
        <span className="num text-ghost shrink-0 text-right text-xs">
          {unit && food.source === "dish" ? (
            <>
              {serving}kcal
              <br />
              /1{unit.unit_name}
            </>
          ) : (
            <>
              {Math.round(food.kcal)}kcal・P{food.protein_g}
              <br />
              /100g
            </>
          )}
        </span>
      </button>
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-md border px-3 text-xs",
        active ? "border-accent bg-accent text-bg font-bold" : "border-border text-muted",
      )}
    >
      {children}
    </button>
  );
}

const num = (s: string) => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

const sameFilter = (a: FoodFilter, b: FoodFilter) =>
  a.kind === b.kind && (a.kind !== "group" || (b.kind === "group" && a.group === b.group));

/** Search a food or dish (by name, food group or dish list), then enter the amount. Also creates "マイ食品". */
export function FoodSheet({ slot, onClose, onAdd }: Props) {
  const { userId } = useAppData();
  const { write } = useSync();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const deferred = useDeferredValue(q);
  const [filter, setFilter] = useState<FoodFilter>({ kind: "all" });
  const search = useFoodSearch(deferred, filter);
  const frequent = useFrequentFoods();
  const [picked, setPicked] = useState<Food | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", kcal: "", p: "", f: "", c: "" });

  if (picked) {
    return (
      <Sheet title={`${slot}に追加`} onClose={onClose}>
        <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto pb-3">
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="text-ghost self-start text-sm underline underline-offset-4"
          >
            食品を選び直す
          </button>
          <AmountEntry
            food={picked}
            onSubmit={(grams) => {
              onAdd(picked, grams);
              onClose();
            }}
          />
        </div>
      </Sheet>
    );
  }

  async function createFood() {
    const kcal = num(draft.kcal);
    if (!draft.name.trim() || kcal === null) return;
    const food: Food = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: draft.name.trim(),
      kcal,
      protein_g: num(draft.p) ?? 0,
      fat_g: num(draft.f) ?? 0,
      carb_g: num(draft.c) ?? 0,
      is_cooked: false,
      source: "user",
      food_group: null,
      unit_name: null,
      unit_grams: null,
    };
    queryClient.setQueryData<Food[]>(nutritionKeys.frequent, (list) => [food, ...(list ?? [])]);
    setPicked(food);
    await write({ table: "foods", kind: "insert", payload: food });
  }

  const browsing = !!deferred.trim() || filter.kind !== "all";
  const results = browsing ? (search.data ?? []) : (frequent.data ?? []);
  const toggle = (f: FoodFilter) => setFilter((cur) => (sameFilter(cur, f) ? { kind: "all" } : f));

  return (
    <Sheet title={`${slot}に追加`} onClose={onClose}>
      <label className="surface flex h-12 shrink-0 items-center gap-2 px-3">
        <Search className="text-ghost size-4" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="食品名・料理名で検索（例: 鶏むね、親子丼）"
          aria-label="食品名・料理名で検索"
          className="placeholder:text-ghost flex-1 bg-transparent text-base focus:outline-none"
        />
      </label>
      <div className="-mx-4 mt-2 flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-1">
        <FilterChip active={filter.kind === "dish"} onClick={() => toggle({ kind: "dish" })}>
          料理
        </FilterChip>
        {FOOD_GROUPS.filter((g) => g.id !== 18).map((g) => (
          <FilterChip
            key={g.id}
            active={filter.kind === "group" && filter.group === g.id}
            onClick={() => toggle({ kind: "group", group: g.id })}
          >
            {g.label}
          </FilterChip>
        ))}
      </div>
      <p className="text-ghost mt-1 text-xs">
        {browsing ? "検索結果" : "よく使う食品"}
        {filter.kind === "dish" && "（料理の値は目安です）"}
      </p>
      <ul className="flex-1 overflow-y-auto">
        {results.map((f) => (
          <FoodRow key={f.id} food={f} onPick={() => setPicked(f)} />
        ))}
        {browsing && search.isFetched && results.length === 0 && (
          <li className="text-muted py-6 text-sm">見つかりません。マイ食品として登録できます</li>
        )}
        {browsing && (
          <li className="text-ghost py-3 text-[10px] leading-relaxed">
            食品データ：文部科学省「日本食品標準成分表（八訂）増補2023年」。料理・一部の食品は目安値です
          </li>
        )}
      </ul>
      <div className="border-border border-t py-3">
        {creating ? (
          <div className="flex flex-col gap-2">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="食品名"
              aria-label="食品名"
              className="surface placeholder:text-ghost h-12 px-3 focus:outline-none"
            />
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ["kcal", "kcal"],
                  ["p", "P"],
                  ["f", "F"],
                  ["c", "C"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex flex-col items-center gap-0.5">
                  <span className="text-ghost text-[10px]">{label} /100g</span>
                  <input
                    inputMode="decimal"
                    value={draft[k]}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                    className="num bg-card border-border h-11 w-full rounded-md border text-center text-lg focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <Button onClick={createFood} disabled={!draft.name.trim() || num(draft.kcal) === null}>
              登録して量を入れる
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="text-accent w-full"
            onClick={() => setCreating(true)}
          >
            ＋ マイ食品を登録
          </Button>
        )}
      </div>
    </Sheet>
  );
}
