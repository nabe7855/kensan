"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Search, X } from "lucide-react";
import { useCallback, useDeferredValue, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Sheet } from "@/components/ui/sheet";
import { foodGroupLabel } from "@/lib/food-groups";
import { ROLE_LABEL, roleOf, type Role } from "@/lib/menu";
import type { Food } from "@/lib/nutrition";
import { fridgeKey, useFoodSearch, useFrequentFoods, useFridge } from "@/lib/queries/nutrition";
import { cn } from "@/lib/utils";

/** Add and remove fridge items (queued offline like other writes). */
export function useFridgeActions() {
  const queryClient = useQueryClient();
  const { userId } = useAppData();
  const { write } = useSync();

  const add = useCallback(
    async (food: Food) => {
      queryClient.setQueryData<Food[]>(fridgeKey, (list = []) =>
        list.some((f) => f.id === food.id) ? list : [food, ...list],
      );
      await write({
        table: "fridge_items",
        kind: "upsert",
        ignoreDuplicates: true,
        onConflict: "user_id,food_id",
        payload: { user_id: userId, food_id: food.id },
      });
    },
    [queryClient, userId, write],
  );

  const remove = useCallback(
    async (foodId: string) => {
      queryClient.setQueryData<Food[]>(fridgeKey, (list = []) =>
        list.filter((f) => f.id !== foodId),
      );
      await write({
        table: "fridge_items",
        kind: "delete",
        match: { user_id: userId, food_id: foodId },
      });
    },
    [queryClient, userId, write],
  );

  return { add, remove };
}

const GROUPS: { key: Role | "other"; label: string }[] = [
  { key: "main", label: ROLE_LABEL.main },
  { key: "staple", label: ROLE_LABEL.staple },
  { key: "side", label: ROLE_LABEL.side },
  { key: "other", label: "その他" },
];

/** What's in the fridge: tap to add from search or frequent foods, × to remove. */
export function FridgeSheet({ onClose }: { onClose: () => void }) {
  const fridge = useFridge();
  const frequent = useFrequentFoods();
  const { add, remove } = useFridgeActions();
  const [q, setQ] = useState("");
  const search = useFoodSearch(useDeferredValue(q));

  const items = fridge.data ?? [];
  const have = new Set(items.map((f) => f.id));
  const toggle = (f: Food) => void (have.has(f.id) ? remove(f.id) : add(f));
  const quick = (frequent.data ?? []).filter((f) => !have.has(f.id)).slice(0, 12);
  const results = q.trim() ? (search.data ?? []) : [];

  return (
    <Sheet title="冷蔵庫" onClose={onClose}>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
        <label className="border-border flex h-12 items-center gap-2 rounded-md border px-3">
          <Search aria-hidden className="text-ghost size-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="食材を検索して追加（例：鶏むね、卵、ご飯）"
            aria-label="食材を検索"
            className="text-fg placeholder:text-ghost min-w-0 flex-1 bg-transparent text-base focus:outline-none"
          />
        </label>

        {results.length > 0 && (
          <ul className="flex flex-col">
            {results.slice(0, 20).map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  aria-pressed={have.has(f.id)}
                  onClick={() => toggle(f)}
                  className="border-border flex min-h-12 w-full items-center justify-between gap-2 border-b px-1 text-left"
                >
                  <span className="flex flex-col">
                    <span className="text-base leading-snug">{f.name}</span>
                    <span className="text-ghost text-[11px]">{foodGroupLabel(f.food_group)}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md border-2",
                      have.has(f.id) ? "border-accent bg-accent text-bg" : "border-ghost",
                    )}
                  >
                    {have.has(f.id) && <Check className="size-4" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!q.trim() && quick.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-muted text-xs">よく使う食品から</h3>
            <div className="flex flex-wrap gap-1.5">
              {quick.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => void add(f)}
                  className="border-border text-fg h-10 rounded-md border px-3 text-sm"
                >
                  ＋ {f.name}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold">
            今あるもの <span className="num text-accent">{items.length}</span>
          </h3>
          {items.length === 0 && (
            <p className="text-muted text-sm">
              冷蔵庫や棚にある食材を入れておくと、その中だけで 1 食の献立を組みます
            </p>
          )}
          {GROUPS.map((g) => {
            const list = items.filter((f) => (roleOf(f) ?? "other") === g.key);
            if (list.length === 0) return null;
            return (
              <div key={g.key} className="flex flex-col gap-1.5">
                <span className="text-ghost text-xs">{g.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((f) => (
                    <span
                      key={f.id}
                      className="border-border flex h-10 items-center gap-1 rounded-md border pl-3 text-sm"
                    >
                      {f.name}
                      <button
                        type="button"
                        aria-label={`${f.name} を冷蔵庫から外す`}
                        onClick={() => void remove(f.id)}
                        className="text-ghost flex size-10 items-center justify-center"
                      >
                        <X className="size-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </Sheet>
  );
}
