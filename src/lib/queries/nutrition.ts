"use client";

import { useQuery } from "@tanstack/react-query";
import type { DayType, Food, Target } from "@/lib/nutrition";
import { getSupabase } from "@/lib/supabase/client";

const FOOD_COLUMNS = "id, name, user_id, kcal, protein_g, fat_g, carb_g, is_cooked";

export type LogItem = { id: string; grams: number; food: Food };
export type DayMeals = { slot: string; items: LogItem[] }[];

export type TemplateItem = { id: string; grams: number; food: Food };
export type Template = { id: string; name: string; order_idx: number; items: TemplateItem[] };

export const nutritionKeys = {
  day: (date: string) => ["meals", date] as const,
  allDays: ["meals"] as const,
  templates: ["meal-templates"] as const,
  targets: ["nutrition-targets"] as const,
  override: (date: string) => ["day-override", date] as const,
  frequent: ["frequent-foods"] as const,
  search: (q: string) => ["food-search", q] as const,
};

async function unwrap<T>(p: PromiseLike<{ data: unknown; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

type RawItem = { id: string; grams: number; created_at: string; foods: Food };

export function useDayMeals(date: string) {
  return useQuery({
    queryKey: nutritionKeys.day(date),
    queryFn: async (): Promise<DayMeals> => {
      const rows = await unwrap<{ slot: string; meal_log_items: RawItem[] }[]>(
        getSupabase()
          .from("meal_logs")
          .select(`slot, meal_log_items(id, grams, created_at, foods(${FOOD_COLUMNS}))`)
          .eq("date", date),
      );
      return rows.map((r) => ({
        slot: r.slot,
        items: [...r.meal_log_items]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((i) => ({ id: i.id, grams: i.grams, food: i.foods })),
      }));
    },
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: nutritionKeys.templates,
    queryFn: async (): Promise<Template[]> => {
      const rows = await unwrap<
        {
          id: string;
          name: string;
          order_idx: number;
          meal_template_items: { id: string; grams: number; foods: Food }[];
        }[]
      >(
        getSupabase()
          .from("meal_templates")
          .select(`id, name, order_idx, meal_template_items(id, grams, foods(${FOOD_COLUMNS}))`)
          .order("order_idx")
          .order("created_at"),
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        order_idx: r.order_idx,
        items: r.meal_template_items.map((i) => ({ id: i.id, grams: i.grams, food: i.foods })),
      }));
    },
  });
}

export function useTargets() {
  return useQuery({
    queryKey: nutritionKeys.targets,
    queryFn: () =>
      unwrap<Target[]>(
        getSupabase()
          .from("nutrition_targets")
          .select("effective_from, day_type, kcal, protein_g, fat_g, carb_g")
          .order("effective_from", { ascending: false }),
      ),
  });
}

export function useDayOverride(date: string) {
  return useQuery({
    queryKey: nutritionKeys.override(date),
    queryFn: async () => {
      const row = await unwrap<{ day_type: DayType } | null>(
        getSupabase().from("day_overrides").select("day_type").eq("date", date).maybeSingle(),
      );
      return row?.day_type ?? null;
    },
  });
}

/** The user's own foods plus the foods they log most, most used first (top 20). */
export function useFrequentFoods() {
  return useQuery({
    queryKey: nutritionKeys.frequent,
    queryFn: async (): Promise<Food[]> => {
      const [items, own] = await Promise.all([
        unwrap<{ foods: Food }[]>(
          getSupabase()
            .from("meal_log_items")
            .select(`foods(${FOOD_COLUMNS})`)
            .order("created_at", { ascending: false })
            .limit(500),
        ),
        unwrap<Food[]>(getSupabase().from("foods").select(FOOD_COLUMNS).not("user_id", "is", null)),
      ]);
      const count = new Map<string, { food: Food; n: number }>();
      for (const { foods: f } of items) {
        const c = count.get(f.id) ?? { food: f, n: 0 };
        c.n++;
        count.set(f.id, c);
      }
      for (const f of own) if (!count.has(f.id)) count.set(f.id, { food: f, n: 0 });
      return [...count.values()]
        .sort((a, b) => b.n - a.n)
        .slice(0, 20)
        .map((c) => c.food);
    },
  });
}

export function useFoodSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: nutritionKeys.search(query),
    enabled: query.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const escaped = query.replace(/[%_,()]/g, " ");
      const rows = await unwrap<Food[]>(
        getSupabase().from("foods").select(FOOD_COLUMNS).ilike("name", `%${escaped}%`).limit(60),
      );
      return rows.sort(
        (a, b) => Number(!!b.user_id) - Number(!!a.user_id) || a.name.length - b.name.length,
      );
    },
  });
}
