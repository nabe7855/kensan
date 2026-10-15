"use client";

import { useActionState } from "react";
import { updateMealSlots, type SettingsState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";

export function MealSlotsForm({ slots }: { slots: string[] }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateMealSlots, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <label className="surface flex flex-col gap-1 px-4 py-3">
        <span className="text-sm">食事枠</span>
        <input
          name="meal_slots"
          defaultValue={slots.join("、")}
          className="bg-transparent text-base focus:outline-none"
        />
        <span className="text-ghost text-xs">「、」区切り。例: 朝、昼、トレ前、トレ後、夜</span>
      </label>
      {state.error && (
        <p role="alert" className="text-warn text-sm">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="text-muted text-sm">
          保存した
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending}>
        食事枠を保存
      </Button>
    </form>
  );
}
