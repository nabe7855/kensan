"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRestTimer } from "@/components/providers/RestTimerProvider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { addPreset, MAX_PRESETS, presetLabel, removePreset } from "@/lib/rest-timer";

/** Edit the user's countdown presets (stored on this device). */
function PresetSheet({ onClose }: { onClose: () => void }) {
  const { presets, setPresets, selected, select } = useRestTimer();
  const [min, setMin] = useState("1");
  const [sec, setSec] = useState("30");
  const total = (Number(min) || 0) * 60 + (Number(sec) || 0);

  return (
    <Sheet title="レストのセット" onClose={onClose}>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
        <ul className="surface overflow-hidden">
          {presets.map((p) => (
            <li
              key={p}
              className="border-border flex h-14 items-center justify-between border-b px-4 last:border-b-0"
            >
              <span className="num text-xl">{presetLabel(p)}</span>
              <button
                type="button"
                aria-label={`${presetLabel(p)}を削除`}
                disabled={presets.length <= 1}
                onClick={() => {
                  const next = removePreset(presets, p);
                  setPresets(next);
                  if (selected === p) select(next[0]!);
                }}
                className="text-muted flex size-12 items-center justify-center disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="surface flex flex-col gap-3 px-4 py-4">
          <span className="text-sm">新しいセット</span>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              aria-label="分"
              value={min}
              onChange={(e) => setMin(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="num bg-bg border-border h-12 w-16 rounded-md border text-center text-2xl focus:outline-none"
            />
            <span className="text-muted text-sm">分</span>
            <input
              inputMode="numeric"
              aria-label="秒"
              value={sec}
              onChange={(e) => setSec(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="num bg-bg border-border h-12 w-16 rounded-md border text-center text-2xl focus:outline-none"
            />
            <span className="text-muted text-sm">秒</span>
            <Button
              className="ml-auto"
              disabled={total < 5 || presets.length >= MAX_PRESETS || presets.includes(total)}
              onClick={() => {
                setPresets(addPreset(presets, total));
                select(total);
              }}
            >
              追加
            </Button>
          </div>
          <span className="text-ghost text-xs">最大 {MAX_PRESETS} 個。この端末に保存されます</span>
        </div>
      </div>
    </Sheet>
  );
}

/** Pick a preset from the dropdown and start the countdown. */
export function RestPicker({ compact = false }: { compact?: boolean }) {
  const { presets, selected, select, start } = useRestTimer();
  const [editing, setEditing] = useState(false);
  const value = presets.includes(selected) ? selected : presets[0]!;

  return (
    <div className="flex items-center gap-2">
      <label className="flex-1">
        <span className="sr-only">レスト時間</span>
        <select
          value={value}
          onChange={(e) => select(Number(e.target.value))}
          className="num bg-bg border-border focus:border-accent h-12 w-full rounded-md border px-3 text-xl focus:outline-none"
        >
          {presets.map((p) => (
            <option key={p} value={p}>
              {presetLabel(p)}
            </option>
          ))}
        </select>
      </label>
      <Button className={compact ? "h-12 px-4" : "h-12 px-6"} onClick={() => start(value)}>
        開始
      </Button>
      <Button variant="ghost" className="h-12 px-2 text-sm" onClick={() => setEditing(true)}>
        編集
      </Button>
      {editing && <PresetSheet onClose={() => setEditing(false)} />}
    </div>
  );
}
