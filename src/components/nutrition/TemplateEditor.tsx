"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { macrosFor, sumMacros } from "@/lib/nutrition";
import { nutritionKeys, type Template, type TemplateItem } from "@/lib/queries/nutrition";
import { FoodSheet } from "./FoodSheet";

export function TemplateEditor({
  template,
  nextOrder,
}: {
  template: Template | null;
  nextOrder: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAppData();
  const { write } = useSync();
  const [id] = useState(() => template?.id ?? crypto.randomUUID());
  const [name, setName] = useState(template?.name ?? "");
  const [items, setItems] = useState<TemplateItem[]>(template?.items ?? []);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = sumMacros(items.map((i) => macrosFor(i.food, i.grams)));

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const saved: Template = {
      id,
      name: name.trim(),
      order_idx: template?.order_idx ?? nextOrder,
      items,
    };
    queryClient.setQueryData<Template[]>(nutritionKeys.templates, (list) =>
      [...(list ?? []).filter((t) => t.id !== id), saved].sort((a, b) => a.order_idx - b.order_idx),
    );
    await write({
      table: "meal_templates",
      kind: "upsert",
      payload: { id, user_id: userId, name: saved.name, order_idx: saved.order_idx },
    });
    await write({ table: "meal_template_items", kind: "delete", match: { template_id: id } });
    if (items.length > 0) {
      await write({
        table: "meal_template_items",
        kind: "insert",
        payload: items.map((i) => ({
          id: i.id,
          user_id: userId,
          template_id: id,
          food_id: i.food.id,
          grams: i.grams,
        })),
      });
    }
    router.push("/nutrition");
  }

  async function remove() {
    if (!template || !window.confirm(`「${template.name}」を削除します。過去の記録は残ります。`))
      return;
    queryClient.setQueryData<Template[]>(nutritionKeys.templates, (list) =>
      (list ?? []).filter((t) => t.id !== template.id),
    );
    await write({ table: "meal_templates", kind: "delete", match: { id: template.id } });
    router.push("/nutrition");
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        placeholder="名前（例: 減量朝食）"
        aria-label="マイ定食の名前"
        className="surface placeholder:text-ghost h-14 px-4 text-xl font-bold focus:outline-none"
      />

      <ul className="surface overflow-hidden">
        {items.map((i) => (
          <li
            key={i.id}
            className="border-border flex items-center gap-2 border-b px-3 py-2 last:border-b-0"
          >
            <span className="flex-1 text-sm leading-snug">{i.food.name}</span>
            <input
              inputMode="numeric"
              aria-label={`${i.food.name} のグラム`}
              value={i.grams}
              onChange={(e) => {
                const g = Number(e.target.value) || 0;
                setItems((list) => list.map((x) => (x.id === i.id ? { ...x, grams: g } : x)));
              }}
              className="num bg-bg border-border h-10 w-20 rounded-md border text-center text-lg focus:outline-none"
            />
            <span className="text-muted text-xs">g</span>
            <button
              type="button"
              aria-label="外す"
              onClick={() => setItems((list) => list.filter((x) => x.id !== i.id))}
              className="text-muted flex size-10 items-center justify-center"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-muted px-3 py-4 text-sm">食品を追加してください</li>
        )}
      </ul>

      <p className="num text-muted text-right text-sm">
        {Math.round(total.kcal)} kcal ・ P {total.protein_g.toFixed(1)} ・ F{" "}
        {total.fat_g.toFixed(1)} ・ C {total.carb_g.toFixed(1)}
      </p>

      <Button variant="outline" className="text-accent" onClick={() => setAdding(true)}>
        ＋ 食品を追加
      </Button>
      <Button size="lg" className="mt-2" disabled={saving || !name.trim()} onClick={save}>
        保存
      </Button>
      {template && (
        <Button variant="ghost" onClick={remove}>
          このマイ定食を削除
        </Button>
      )}

      {adding && (
        <FoodSheet
          slot={name || "マイ定食"}
          onClose={() => setAdding(false)}
          onAdd={(food, grams) =>
            setItems((list) => [...list, { id: crypto.randomUUID(), food, grams }])
          }
        />
      )}
    </div>
  );
}
