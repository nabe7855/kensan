"use client";

import Link from "next/link";
import { Sheet } from "@/components/ui/sheet";
import { mealMacros } from "@/lib/meal-plan";
import type { Template } from "@/lib/queries/nutrition";

type Props = {
  title: string;
  templates: Template[];
  onClose: () => void;
  onPick: (template: Template) => void;
};

/** Pick a set from the library (grouped by variant group). */
export function SetSheet({ title, templates, onClose, onPick }: Props) {
  const groups = new Map<string, Template[]>();
  for (const t of templates) {
    const key = t.group_name ?? "";
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) =>
    a === "" ? 1 : b === "" ? -1 : a.localeCompare(b),
  );

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
        {templates.length === 0 && (
          <p className="text-muted text-sm leading-relaxed">
            セットがまだありません。食事カードの「この組み合わせを保存」か、下のボタンから作れます。
          </p>
        )}
        {ordered.map(([group, list]) => (
          <section key={group || "_"} className="flex flex-col gap-1.5">
            <h3 className="text-muted text-xs">{group || "グループなし"}</h3>
            {list.map((t) => {
              const m = mealMacros(t);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onPick(t)}
                  className="surface flex min-h-14 flex-col items-start justify-center px-3 py-2 text-left"
                >
                  <span className="text-base font-bold">{t.name}</span>
                  <span className="num text-ghost text-xs">
                    {Math.round(m.kcal)} kcal ・ P {Math.round(m.protein_g)} / F{" "}
                    {Math.round(m.fat_g)} / C {Math.round(m.carb_g)} ・ {t.items.length}品
                  </span>
                </button>
              );
            })}
          </section>
        ))}
        <Link
          href="/nutrition/templates/new"
          className="border-border text-accent flex h-12 items-center justify-center rounded-md border border-dashed text-sm"
        >
          ＋ 新しいセットを作る
        </Link>
      </div>
    </Sheet>
  );
}
