import { fillError } from "./fill";
import { macrosFor, sumMacros, type Macros } from "./nutrition";

export type MenuFood = Macros & {
  id: string;
  name: string;
  food_group: number | null;
  unit_name: string | null;
  unit_grams: number | null;
};

export type Role = "main" | "staple" | "side";

export const ROLE_LABEL: Record<Role, string> = { main: "主菜", staple: "主食", side: "副菜" };

const MAIN_GROUPS = new Set([4, 10, 11, 12, 13]);
const STAPLE_GROUPS = new Set([1, 2]);
const SIDE_GROUPS = new Set([6, 7, 8, 9]);

/** What a food plays in a meal, by food group and, for dishes and others, by its macros. */
export function roleOf(f: MenuFood): Role | null {
  const pShare = f.kcal > 0 ? (f.protein_g * 4) / f.kcal : 0;
  const cShare = f.kcal > 0 ? (f.carb_g * 4) / f.kcal : 0;
  if (f.food_group !== null && SIDE_GROUPS.has(f.food_group)) return "side";
  if (f.food_group !== null && STAPLE_GROUPS.has(f.food_group) && cShare >= 0.5) return "staple";
  if (pShare >= 0.35 && f.protein_g >= 8) return "main";
  if (f.food_group !== null && MAIN_GROUPS.has(f.food_group) && f.protein_g >= 5) return "main";
  if (cShare >= 0.6 && f.carb_g >= 15) return "staple";
  return null;
}

export type MenuItem<F extends MenuFood = MenuFood> = { food: F; grams: number; role: Role };

export type Menu<F extends MenuFood = MenuFood> = {
  items: MenuItem<F>[];
  provides: Macros;
  error: number;
  reason: string;
};

/** Amounts to try: whole units for countable foods (卵 1〜4 個), otherwise grams in steps. */
function amounts(f: MenuFood, role: Role): number[] {
  if (f.unit_grams && f.unit_grams > 0 && f.unit_name && f.unit_name !== "人前") {
    return [1, 2, 3, 4].map((n) => n * f.unit_grams!);
  }
  if (f.unit_name === "人前" && f.unit_grams) return [f.unit_grams];
  const [min, max, step] =
    role === "main" ? [60, 300, 20] : role === "staple" ? [80, 400, 20] : [50, 150, 50];
  const list: number[] = [];
  for (let g = min; g <= max; g += step) list.push(g);
  return list;
}

const fmt = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(Math.round(n))}`;

function reasonFor(target: Macros, provides: Macros, roles: Role[]): string {
  const missing = (["main", "staple"] as const).filter((r) => !roles.includes(r));
  const diff = `目安との差 P${fmt(provides.protein_g - target.protein_g)}・C${fmt(provides.carb_g - target.carb_g)}・F${fmt(provides.fat_g - target.fat_g)}g`;
  return missing.length
    ? `冷蔵庫に${missing.map((r) => ROLE_LABEL[r]).join("・")}になる食材がないため、あるもので近づけた案。${diff}`
    : `主菜でたんぱく質、主食で炭水化物をとる組み合わせ。${diff}`;
}

/**
 * Up to `limit` menus from the fridge for one meal: a main and a staple (plus a side when there
 * is one), each sized to the per-meal target. Different mains are preferred across menus.
 */
export function buildMenus<F extends MenuFood>(target: Macros, fridge: F[], limit = 3): Menu<F>[] {
  if (target.protein_g + target.carb_g + target.fat_g < 10) return [];
  const byRole: Record<Role, F[]> = { main: [], staple: [], side: [] };
  for (const f of fridge) {
    const r = roleOf(f);
    if (r) byRole[r].push(f);
  }
  const mains: (F | null)[] = byRole.main.length ? byRole.main : [null];
  const staples: (F | null)[] = byRole.staple.length ? byRole.staple : [null];
  const sides = byRole.side;
  if (!byRole.main.length && !byRole.staple.length) return [];

  const menus: Menu<F>[] = [];
  let sideTurn = 0;
  for (const main of mains) {
    for (const staple of staples) {
      const side = sides.length ? sides[sideTurn++ % sides.length]! : null;
      const sideItem = side
        ? { food: side, grams: amounts(side, "side")[1] ?? 100, role: "side" as const }
        : null;
      let best: Menu<F> | null = null;
      for (const gm of main ? amounts(main, "main") : [0]) {
        for (const gs of staple ? amounts(staple, "staple") : [0]) {
          const items: MenuItem<F>[] = [
            ...(main ? [{ food: main, grams: gm, role: "main" as const }] : []),
            ...(staple ? [{ food: staple, grams: gs, role: "staple" as const }] : []),
            ...(sideItem ? [sideItem] : []),
          ];
          const provides = sumMacros(items.map((i) => macrosFor(i.food, i.grams)));
          const error = fillError(target, provides);
          if (!best || error < best.error) best = { items, provides, error, reason: "" };
        }
      }
      if (best) menus.push(best);
    }
  }

  menus.sort((a, b) => a.error - b.error);
  const picked: Menu<F>[] = [];
  const usedMains = new Set<string>();
  for (const m of menus) {
    const mainId = m.items.find((i) => i.role === "main")?.food.id ?? "";
    if (usedMains.has(mainId) && menus.length > limit) continue;
    usedMains.add(mainId);
    picked.push(m);
    if (picked.length === limit) break;
  }
  for (const m of menus) {
    if (picked.length >= limit) break;
    if (!picked.includes(m)) picked.push(m);
  }
  return picked.map((m) => ({
    ...m,
    reason: reasonFor(
      target,
      m.provides,
      m.items.map((i) => i.role),
    ),
  }));
}

/** Saved sets whose every ingredient is in the fridge. */
export function setsFromFridge<T extends { items: { food: { id: string } }[] }>(
  sets: T[],
  fridgeIds: Set<string>,
): T[] {
  return sets.filter((s) => s.items.length > 0 && s.items.every((i) => fridgeIds.has(i.food.id)));
}
