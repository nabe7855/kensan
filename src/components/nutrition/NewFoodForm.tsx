"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { kcalCheck, labelToFood, type FoodValues } from "@/lib/label";
import { foodKcal } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

const UNITS = ["袋", "個", "本", "枚", "パック", "食"];
const KINDS: { id: number | null; label: string }[] = [
  { id: 11, label: "肉" },
  { id: 10, label: "魚介" },
  { id: 12, label: "卵" },
  { id: 13, label: "乳製品" },
  { id: 4, label: "大豆・豆" },
  { id: 1, label: "穀類（ご飯・パン・麺）" },
  { id: 2, label: "いも" },
  { id: 6, label: "野菜" },
  { id: 7, label: "果物" },
  { id: 18, label: "料理・加工品" },
  { id: null, label: "その他" },
];

const NUTRIENTS = [
  { key: "kcal", label: "エネルギー", unit: "kcal", required: true },
  { key: "protein_g", label: "たんぱく質", unit: "g", required: true },
  { key: "fat_g", label: "脂質", unit: "g", required: true },
  { key: "carb_g", label: "炭水化物", unit: "g", required: true },
  { key: "fiber_g", label: "食物繊維", unit: "g", required: false },
  { key: "salt_g", label: "食塩相当量", unit: "g", required: false },
] as const;

type NutrientKey = (typeof NUTRIENTS)[number]["key"];

const num = (s: string) => {
  const v = s.trim().replace(/[，,]/g, ".");
  return v === "" || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Number(v);
};

const chip = (on: boolean) =>
  cn(
    "h-10 rounded-md border px-3 text-sm whitespace-nowrap",
    on ? "border-accent bg-accent text-bg font-bold" : "border-border text-fg",
  );

export type NewFood = FoodValues & { name: string; food_group: number | null };

/** Register a food from its package label, per 100 g or per serving, then convert. */
export function NewFoodForm({
  initialName = "",
  onSave,
  onCancel,
}: {
  initialName?: string;
  onSave: (food: NewFood) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [basis, setBasis] = useState<"100g" | "serving">("serving");
  const [servingName, setServingName] = useState("袋");
  const [servingGrams, setServingGrams] = useState("");
  const [kind, setKind] = useState<number | null>(null);
  const [values, setValues] = useState<Record<NutrientKey, string>>({
    kcal: "",
    protein_g: "",
    fat_g: "",
    carb_g: "",
    fiber_g: "",
    salt_g: "",
  });

  const v = (k: NutrientKey) => num(values[k]);
  const ready =
    name.trim() !== "" &&
    NUTRIENTS.every((n) => !n.required || v(n.key) !== null) &&
    (basis === "100g" || (num(servingGrams) ?? 0) > 0);
  const food = ready
    ? labelToFood({
        basis,
        servingName,
        servingGrams: num(servingGrams),
        kcal: v("kcal")!,
        protein_g: v("protein_g")!,
        fat_g: v("fat_g")!,
        carb_g: v("carb_g")!,
        fiber_g: v("fiber_g"),
        salt_g: v("salt_g"),
      })
    : null;
  const check =
    v("kcal") !== null && v("protein_g") !== null && v("fat_g") !== null && v("carb_g") !== null
      ? kcalCheck(v("kcal")!, v("protein_g")!, v("fat_g")!, v("carb_g")!)
      : null;
  const basisLabel =
    basis === "100g"
      ? "100g 当たり"
      : `1${servingName || "食"}${num(servingGrams) ? `（${num(servingGrams)}g）` : ""}当たり`;

  return (
    <form
      className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (food) onSave({ ...food, name: name.trim(), food_group: kind });
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">食品名</span>
        <input
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：サラダチキン プレーン"
          className="border-border text-fg placeholder:text-ghost h-12 rounded-md border bg-transparent px-3 text-base focus:outline-none"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">パッケージの表示</legend>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            aria-pressed={basis === "serving"}
            onClick={() => setBasis("serving")}
            className={chip(basis === "serving")}
          >
            1袋・1個 当たり
          </button>
          <button
            type="button"
            aria-pressed={basis === "100g"}
            onClick={() => setBasis("100g")}
            className={chip(basis === "100g")}
          >
            100g 当たり
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {UNITS.map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={servingName === u}
              onClick={() => setServingName(u)}
              className={chip(servingName === u)}
            >
              {u}
            </button>
          ))}
        </div>
        <label className="surface flex h-12 items-center justify-between gap-3 px-3">
          <span className="text-sm">
            1{servingName}の重さ
            {basis === "100g" && <span className="text-ghost text-xs">（任意）</span>}
          </span>
          <span className="flex items-center gap-1">
            <input
              inputMode="decimal"
              value={servingGrams}
              onChange={(e) => setServingGrams(e.target.value)}
              placeholder="30"
              aria-label={`1${servingName}の重さ（g）`}
              className="num text-fg placeholder:text-ghost w-20 bg-transparent text-right text-xl focus:outline-none"
            />
            <span className="text-muted text-sm">g</span>
          </span>
        </label>
        <p className="text-ghost text-xs leading-relaxed">
          表示が「1袋（30g）当たり」なら 1袋・1個 当たりを選んで 30g
          と入力。食事の記録では「1袋」単位で量を入れられます
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-2 text-sm font-bold">
          栄養成分 <span className="text-muted text-xs font-normal">（{basisLabel}）</span>
        </legend>
        {NUTRIENTS.map((n) => (
          <label key={n.key} className="surface flex h-12 items-center justify-between gap-3 px-3">
            <span className="text-sm">
              {n.label}
              {!n.required && <span className="text-ghost text-xs">（任意）</span>}
            </span>
            <span className="flex items-center gap-1">
              <input
                inputMode="decimal"
                required={n.required}
                value={values[n.key]}
                onChange={(e) => setValues((s) => ({ ...s, [n.key]: e.target.value }))}
                aria-label={`${n.label}（${n.unit}）`}
                className="num text-fg w-24 bg-transparent text-right text-xl focus:outline-none"
              />
              <span className="text-muted w-8 text-sm">{n.unit}</span>
            </span>
          </label>
        ))}
        {check?.off && (
          <p className="text-warn text-xs leading-relaxed">
            P・F・C から計算すると約 {check.estimated}kcal
            です。入力した値をもう一度確認してください（食物繊維が多い食品などは差が出ることがあります）
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">
          種類{" "}
          <span className="text-muted text-xs font-normal">
            （献立の提案で主菜・主食の判定に使います）
          </span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.label}
              type="button"
              aria-pressed={kind === k.id}
              onClick={() => setKind(k.id)}
              className={chip(kind === k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </fieldset>

      {food && (
        <p className="text-muted num text-xs">
          100g 当たり {Math.round(foodKcal(food))}kcal・P{food.protein_g}・F{food.fat_g}・C
          {food.carb_g}
          {food.unit_name && `／1${food.unit_name} ${food.unit_grams}g`}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          やめる
        </Button>
        <Button type="submit" disabled={!food}>
          登録して量を入れる
        </Button>
      </div>
    </form>
  );
}
