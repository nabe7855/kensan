"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { mealLogId, type DayType, type Food, type Target } from "@/lib/nutrition";
import { nutritionKeys, type DayMeals } from "@/lib/queries/nutrition";

export type NewItem = { food: Food; grams: number };

export function useMealActions(date: string) {
  const queryClient = useQueryClient();
  const { userId } = useAppData();
  const { write } = useSync();

  const patchDay = useCallback(
    (fn: (day: DayMeals) => DayMeals) =>
      queryClient.setQueryData<DayMeals>(nutritionKeys.day(date), (d) => fn(d ?? [])),
    [queryClient, date],
  );

  const addItems = useCallback(
    async (slot: string, items: NewItem[]) => {
      if (items.length === 0) return;
      const logId = mealLogId(userId, date, slot);
      const rows = items.map((it) => ({ id: crypto.randomUUID(), ...it }));
      patchDay((day) => {
        const existing = day.find((m) => m.slot === slot);
        const added = rows.map((r) => ({ id: r.id, grams: r.grams, food: r.food }));
        return existing
          ? day.map((m) => (m.slot === slot ? { ...m, items: [...m.items, ...added] } : m))
          : [...day, { slot, items: added }];
      });
      await write({
        table: "meal_logs",
        kind: "upsert",
        onConflict: "user_id,date,slot",
        payload: { id: logId, user_id: userId, date, slot },
      });
      await write({
        table: "meal_log_items",
        kind: "insert",
        payload: rows.map((r) => ({
          id: r.id,
          user_id: userId,
          meal_log_id: logId,
          food_id: r.food.id,
          grams: r.grams,
        })),
      });
    },
    [date, patchDay, userId, write],
  );

  const updateGrams = useCallback(
    async (itemId: string, grams: number) => {
      patchDay((day) =>
        day.map((m) => ({
          ...m,
          items: m.items.map((i) => (i.id === itemId ? { ...i, grams } : i)),
        })),
      );
      await write({
        table: "meal_log_items",
        kind: "update",
        match: { id: itemId },
        payload: { grams },
      });
    },
    [patchDay, write],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      patchDay((day) => day.map((m) => ({ ...m, items: m.items.filter((i) => i.id !== itemId) })));
      await write({ table: "meal_log_items", kind: "delete", match: { id: itemId } });
    },
    [patchDay, write],
  );

  const setOverride = useCallback(
    async (dayType: DayType | null) => {
      queryClient.setQueryData(nutritionKeys.override(date), dayType);
      await write(
        dayType
          ? {
              table: "day_overrides",
              kind: "upsert",
              onConflict: "user_id,date",
              payload: { user_id: userId, date, day_type: dayType },
            }
          : { table: "day_overrides", kind: "delete", match: { user_id: userId, date } },
      );
    },
    [date, queryClient, userId, write],
  );

  const saveTargets = useCallback(
    async (rows: Omit<Target, "effective_from">[], effectiveFrom: string) => {
      queryClient.setQueryData<Target[]>(nutritionKeys.targets, (t) => [
        ...rows.map((r) => ({ ...r, effective_from: effectiveFrom })),
        ...(t ?? []).filter((x) => x.effective_from !== effectiveFrom),
      ]);
      await write({
        table: "nutrition_targets",
        kind: "upsert",
        onConflict: "user_id,effective_from,day_type",
        payload: rows.map((r) => ({ ...r, user_id: userId, effective_from: effectiveFrom })),
      });
    },
    [queryClient, userId, write],
  );

  return { addItems, updateGrams, removeItem, setOverride, saveTargets };
}
