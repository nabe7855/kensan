"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { macrosFor, type Food } from "@/lib/nutrition";
import { nutritionKeys, useFoodSearch, useFrequentFoods } from "@/lib/queries/nutrition";
import { Keypad } from "./Keypad";

type Props = {
  slot: string;
  onClose: () => void;
  onAdd: (food: Food, grams: number) => void;
};

function FoodRow({ food, onPick }: { food: Food; onPick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="border-border flex min-h-14 w-full items-center justify-between gap-3 border-b px-1 py-2 text-left"
      >
        <span className="text-base leading-snug">
          {food.name}
          {food.user_id && <span className="text-ghost ml-2 text-xs">マイ食品</span>}
        </span>
        <span className="num text-ghost shrink-0 text-xs">
          {Math.round(food.kcal)}kcal・P{food.protein_g}
        </span>
      </button>
    </li>
  );
}

const num = (s: string) => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

/** Search a food, then enter grams on the keypad. Also creates "マイ食品". */
export function FoodSheet({ slot, onClose, onAdd }: Props) {
  const { userId } = useAppData();
  const { write } = useSync();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const deferred = useDeferredValue(q);
  const search = useFoodSearch(deferred);
  const frequent = useFrequentFoods();
  const [picked, setPicked] = useState<Food | null>(null);
  const [grams, setGrams] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", kcal: "", p: "", f: "", c: "" });

  if (picked) {
    const g = Number(grams) || 0;
    const m = macrosFor(picked, g);
    return (
      <Sheet title={`${slot}に追加`} onClose={onClose}>
        <div className="flex flex-1 flex-col justify-end gap-3 pb-3">
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="text-ghost self-start text-sm underline underline-offset-4"
          >
            食品を選び直す
          </button>
          <p className="text-lg">{picked.name}</p>
          <p className="flex items-baseline justify-end gap-2">
            <span className="num text-accent text-7xl leading-none">{grams || "0"}</span>
            <span className="num text-muted text-2xl">g</span>
          </p>
          <p className="num text-muted text-right text-sm">
            {Math.round(m.kcal)} kcal ・ P {m.protein_g.toFixed(1)} ・ F {m.fat_g.toFixed(1)} ・ C{" "}
            {m.carb_g.toFixed(1)}
          </p>
          <Keypad
            value={grams}
            onChange={setGrams}
            disabled={g <= 0}
            onSubmit={() => {
              onAdd(picked, g);
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
    };
    queryClient.setQueryData<Food[]>(nutritionKeys.frequent, (list) => [food, ...(list ?? [])]);
    setPicked(food);
    await write({ table: "foods", kind: "insert", payload: { ...food, source: "user" } });
  }

  const results = deferred.trim() ? (search.data ?? []) : (frequent.data ?? []);

  return (
    <Sheet title={`${slot}に追加`} onClose={onClose}>
      <label className="surface flex h-12 shrink-0 items-center gap-2 px-3">
        <Search className="text-ghost size-4" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="食品名で検索（例: 鶏むね）"
          aria-label="食品名で検索"
          className="placeholder:text-ghost flex-1 bg-transparent text-base focus:outline-none"
        />
      </label>
      <p className="text-ghost mt-2 text-xs">
        {deferred.trim() ? "検索結果（100g あたり）" : "よく使う食品（100g あたり）"}
      </p>
      <ul className="flex-1 overflow-y-auto">
        {results.map((f) => (
          <FoodRow key={f.id} food={f} onPick={() => setPicked(f)} />
        ))}
        {deferred.trim() && search.isFetched && results.length === 0 && (
          <li className="text-muted py-6 text-sm">見つかりません。マイ食品として登録できます</li>
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
