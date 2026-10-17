import { describe, expect, it } from "vitest";
import { buildMenus, roleOf, setsFromFridge, type MenuFood } from "@/lib/menu";

const food = (
  id: string,
  group: number | null,
  kcal: number,
  p: number,
  f: number,
  c: number,
  unit: [string, number] | null = null,
): MenuFood => ({
  id,
  name: id,
  food_group: group,
  kcal,
  protein_g: p,
  fat_g: f,
  carb_g: c,
  unit_name: unit?.[0] ?? null,
  unit_grams: unit?.[1] ?? null,
});

const chicken = food("鶏むね", 11, 105, 23.3, 1.9, 0.1);
const salmon = food("鮭", 10, 124, 22.3, 4.1, 0.1);
const egg = food("卵", 12, 142, 12.2, 10.2, 0.4, ["個", 50]);
const rice = food("ご飯", 1, 156, 2.5, 0.3, 37.1);
const oats = food("オートミール", 1, 350, 13.7, 5.7, 69.1);
const broccoli = food("ブロッコリー", 6, 37, 5.4, 0.6, 6.6);
const butter = food("バター", 14, 700, 0.6, 81, 0.2);
const protein = food("プロテイン", 18, 380, 75, 5, 10);

describe("roleOf", () => {
  it("sorts foods into main, staple and side", () => {
    expect(roleOf(chicken)).toBe("main");
    expect(roleOf(egg)).toBe("main");
    expect(roleOf(rice)).toBe("staple");
    expect(roleOf(broccoli)).toBe("side");
    expect(roleOf(protein)).toBe("main");
    expect(roleOf(butter)).toBeNull();
  });
});

describe("buildMenus", () => {
  const target = { kcal: 600, protein_g: 40, fat_g: 10, carb_g: 70 };

  it("builds main + staple + side sized to the target", () => {
    const menus = buildMenus(target, [chicken, rice, broccoli, butter]);
    expect(menus).toHaveLength(1);
    const [m] = menus;
    expect(m!.items.map((i) => i.role)).toEqual(["main", "staple", "side"]);
    expect(Math.abs(m!.provides.protein_g - 40)).toBeLessThan(8);
    expect(Math.abs(m!.provides.carb_g - 70)).toBeLessThan(12);
    expect(m!.reason).toMatch(/主菜でたんぱく質/);
  });

  it("prefers different mains across up to three menus", () => {
    const menus = buildMenus(target, [chicken, salmon, egg, rice, oats, broccoli]);
    expect(menus).toHaveLength(3);
    const mains = menus.map((m) => m.items.find((i) => i.role === "main")!.food.id);
    expect(new Set(mains).size).toBe(3);
  });

  it("uses whole units for countable foods", () => {
    const [m] = buildMenus(target, [egg, rice]);
    const eggs = m!.items.find((i) => i.food.id === "卵")!;
    expect(eggs.grams % 50).toBe(0);
  });

  it("says what is missing when there is no staple", () => {
    const [m] = buildMenus(target, [chicken]);
    expect(m!.items).toHaveLength(1);
    expect(m!.reason).toMatch(/主食になる食材がない/);
  });

  it("returns nothing without a main or staple, or without room left", () => {
    expect(buildMenus(target, [broccoli, butter])).toEqual([]);
    expect(buildMenus({ kcal: 0, protein_g: 2, fat_g: 1, carb_g: 3 }, [chicken, rice])).toEqual([]);
  });
});

describe("setsFromFridge", () => {
  it("keeps sets that can be made entirely from the fridge", () => {
    const sets = [
      { id: "a", items: [{ food: { id: "鶏むね" } }, { food: { id: "ご飯" } }] },
      { id: "b", items: [{ food: { id: "鶏むね" } }, { food: { id: "パスタ" } }] },
      { id: "c", items: [] },
    ];
    expect(setsFromFridge(sets, new Set(["鶏むね", "ご飯"])).map((s) => s.id)).toEqual(["a"]);
  });
});
