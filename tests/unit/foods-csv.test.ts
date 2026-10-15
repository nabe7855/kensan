import { describe, expect, it } from "vitest";
import { foodsToSql, parseCsv, parseMextFoods, parseMextNumber } from "@/lib/foods-csv";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes and CRLF", () => {
    expect(parseCsv('a,"b,c","d ""e"""\r\n1,2,3\n')).toEqual([
      ["a", "b,c", 'd "e"'],
      ["1", "2", "3"],
    ]);
  });
});

describe("parseMextNumber", () => {
  it("reads MEXT notation", () => {
    expect(parseMextNumber("23.3")).toBe(23.3);
    expect(parseMextNumber("Tr")).toBe(0);
    expect(parseMextNumber("(0.1)")).toBe(0.1);
    expect(parseMextNumber("-")).toBeNull();
    expect(parseMextNumber("")).toBeNull();
    expect(parseMextNumber("1,234")).toBe(1234);
  });
});

describe("parseMextFoods", () => {
  const csv = [
    "日本食品標準成分表2020年版（八訂）,,,,,,,,,",
    "食品番号,食品名,エネルギー(kJ),エネルギー(kcal),アミノ酸組成によるたんぱく質,たんぱく質,脂肪酸のトリアシルグリセロール当量,脂質,炭水化物,食物繊維総量,ナトリウム",
    '11220,"にわとり　［若どり・主品目］　むね　皮なし　生",439,105,19.2,23.3,1.6,1.9,0.1,(0),42',
    "01088,こめ　［水稲めし］　精白米　うるち米,656,156,2.0,2.5,0.2,0.3,37.1,1.5,1",
    "99999,注記行,,,,,,,,,",
  ].join("\n");

  it("picks the plain protein/fat/carb columns and skips rows without energy", () => {
    const { foods, skipped } = parseMextFoods(csv);
    expect(skipped).toBe(1);
    expect(foods).toHaveLength(2);
    expect(foods[0]).toEqual({
      name: "にわとり　［若どり・主品目］　むね　皮なし　生",
      kcal: 105,
      protein_g: 23.3,
      fat_g: 1.9,
      carb_g: 0.1,
      fiber_g: 0,
      sodium_mg: 42,
    });
    expect(foods[1]!.carb_g).toBe(37.1);
  });

  it("fails clearly without a name column", () => {
    expect(() => parseMextFoods("a,b\n1,2")).toThrow(/食品名/);
  });

  it("generates idempotent SQL with escaped names", () => {
    const sql = foodsToSql([
      {
        name: "O'Brien めし",
        kcal: 1,
        protein_g: 0,
        fat_g: 0,
        carb_g: 0,
        fiber_g: null,
        sodium_mg: null,
      },
    ]);
    expect(sql).toContain("'O''Brien めし', 1, 0, 0, 0, null, null, true");
    expect(sql).toContain("where not exists");
  });
});
