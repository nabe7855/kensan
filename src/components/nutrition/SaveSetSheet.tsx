"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { Template } from "@/lib/queries/nutrition";
import { cn } from "@/lib/utils";

type Props = {
  defaultName: string;
  defaultGroup: string | null;
  templates: Template[];
  onClose: () => void;
  onSave: (name: string, group: string | null) => void;
};

/** Save the meal's current items as a set; optionally put it in a variant group. */
export function SaveSetSheet({ defaultName, defaultGroup, templates, onClose, onSave }: Props) {
  const [name, setName] = useState(defaultName);
  const [group, setGroup] = useState(defaultGroup ?? "");
  const groups = [...new Set(templates.map((t) => t.group_name).filter((g): g is string => !!g))];

  return (
    <Sheet title="この組み合わせを保存" onClose={onClose}>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs">セット名</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="例: 鯖＋卵"
            className="surface placeholder:text-ghost h-12 px-3 text-base focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs">グループ（任意）</span>
          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            maxLength={20}
            placeholder="例: 1食目"
            className="surface placeholder:text-ghost h-12 px-3 text-base focus:outline-none"
          />
          <span className="text-ghost text-xs leading-relaxed">
            同じグループのセットは、食事カードのチップでワンタップで切り替えられます（例：鯖 /
            鶏むね / 鶏もも）
          </span>
        </label>
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={cn(
                  "h-9 rounded-md border px-3 text-xs",
                  group === g ? "border-accent text-accent" : "border-border text-muted",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <Button
          size="lg"
          disabled={!name.trim()}
          onClick={() => {
            onSave(name.trim(), group.trim() || null);
            onClose();
          }}
        >
          ライブラリに保存
        </Button>
      </div>
    </Sheet>
  );
}
