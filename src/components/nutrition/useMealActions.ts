"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { mealLogId, type DayType, type Food, type Target } from "@/lib/nutrition";
import { nutritionKeys, type DayMeals, type Template } from "@/lib/queries/nutrition";

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

  /** Make sure the meal row exists. A new meal starts eaten unless `planned`; an existing one is untouched. */
  const ensureMeal = useCallback(
    async (slot: string, planned: boolean) => {
      const logId = mealLogId(userId, date, slot);
      const eatenAt = planned ? null : new Date().toISOString();
      patchDay((day) =>
        day.some((m) => m.slot === slot)
          ? day
          : [
              ...day,
              {
                slot,
                createdAt: new Date().toISOString(),
                eatenAt,
                title: null,
                templateId: null,
                items: [],
              },
            ],
      );
      await write({
        table: "meal_logs",
        kind: "upsert",
        onConflict: "user_id,date,slot",
        ignoreDuplicates: true,
        payload: { id: logId, user_id: userId, date, slot, eaten_at: eatenAt },
      });
      return logId;
    },
    [date, patchDay, userId, write],
  );

  const addItems = useCallback(
    async (slot: string, items: NewItem[], opts: { planned?: boolean } = {}) => {
      if (items.length === 0) return;
      const logId = await ensureMeal(slot, !!opts.planned);
      const rows = items.map((it) => ({ id: crypto.randomUUID(), ...it }));
      patchDay((day) =>
        day.map((m) =>
          m.slot === slot
            ? {
                ...m,
                items: [
                  ...m.items,
                  ...rows.map((r) => ({ id: r.id, grams: r.grams, food: r.food })),
                ],
              }
            : m,
        ),
      );
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
    [ensureMeal, patchDay, userId, write],
  );

  /** Replace a meal's contents with a set (new meals start as planned). */
  const applySet = useCallback(
    async (slot: string, set: { id: string | null; name: string; items: NewItem[] }) => {
      const logId = await ensureMeal(slot, true);
      const rows = set.items.map((it) => ({ id: crypto.randomUUID(), ...it }));
      patchDay((day) =>
        day.map((m) =>
          m.slot === slot
            ? {
                ...m,
                title: set.name,
                templateId: set.id,
                items: rows.map((r) => ({ id: r.id, grams: r.grams, food: r.food })),
              }
            : m,
        ),
      );
      await write({ table: "meal_log_items", kind: "delete", match: { meal_log_id: logId } });
      if (rows.length > 0) {
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
      }
      await write({
        table: "meal_logs",
        kind: "update",
        match: { id: logId },
        payload: { title: set.name, template_id: set.id },
      });
    },
    [ensureMeal, patchDay, userId, write],
  );

  const setEaten = useCallback(
    async (slot: string, eaten: boolean) => {
      const eatenAt = eaten ? new Date().toISOString() : null;
      patchDay((day) => day.map((m) => (m.slot === slot ? { ...m, eatenAt } : m)));
      await write({
        table: "meal_logs",
        kind: "update",
        match: { id: mealLogId(userId, date, slot) },
        payload: { eaten_at: eatenAt },
      });
    },
    [date, patchDay, userId, write],
  );

  /** Remove the whole meal (its items go with it). */
  const clearMeal = useCallback(
    async (slot: string) => {
      patchDay((day) => day.filter((m) => m.slot !== slot));
      await write({
        table: "meal_logs",
        kind: "delete",
        match: { id: mealLogId(userId, date, slot) },
      });
    },
    [date, patchDay, userId, write],
  );

  /** Save items as a set in the library and link the meal to it. */
  const saveAsSet = useCallback(
    async (slot: string, set: { name: string; group: string | null; items: NewItem[] }) => {
      const templateId = crypto.randomUUID();
      const existing = queryClient.getQueryData<Template[]>(nutritionKeys.templates) ?? [];
      const order = Math.max(-1, ...existing.map((t) => t.order_idx)) + 1;
      const template: Template = {
        id: templateId,
        name: set.name,
        order_idx: order,
        group_name: set.group,
        items: set.items.map((it) => ({ id: crypto.randomUUID(), ...it })),
      };
      queryClient.setQueryData<Template[]>(nutritionKeys.templates, [...existing, template]);
      patchDay((day) =>
        day.map((m) => (m.slot === slot ? { ...m, title: set.name, templateId } : m)),
      );
      await write({
        table: "meal_templates",
        kind: "insert",
        payload: {
          id: templateId,
          user_id: userId,
          name: set.name,
          order_idx: order,
          group_name: set.group,
        },
      });
      await write({
        table: "meal_template_items",
        kind: "insert",
        payload: template.items.map((i) => ({
          id: i.id,
          user_id: userId,
          template_id: templateId,
          food_id: i.food.id,
          grams: i.grams,
        })),
      });
      await write({
        table: "meal_logs",
        kind: "update",
        match: { id: mealLogId(userId, date, slot) },
        payload: { title: set.name, template_id: templateId },
      });
    },
    [date, patchDay, queryClient, userId, write],
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

  /** Swap an item for another food (used by 代わりを探す). */
  const replaceItem = useCallback(
    async (itemId: string, food: Food, grams: number) => {
      patchDay((day) =>
        day.map((m) => ({
          ...m,
          items: m.items.map((i) => (i.id === itemId ? { ...i, food, grams } : i)),
        })),
      );
      await write({
        table: "meal_log_items",
        kind: "update",
        match: { id: itemId },
        payload: { food_id: food.id, grams },
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

  return {
    addItems,
    applySet,
    setEaten,
    clearMeal,
    saveAsSet,
    updateGrams,
    replaceItem,
    removeItem,
    setOverride,
    saveTargets,
  };
}
