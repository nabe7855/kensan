"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, type SettingsState } from "@/app/(app)/settings/actions";
import { useRefreshAppData } from "@/components/providers/AppDataProvider";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

type Props = {
  displayName: string;
  heightCm: number | null;
  sex: string | null;
  unitPref: string;
  trackLibido: boolean;
};

export function ProfileForm(props: Props) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfile, {});
  const [libido, setLibido] = useState(props.trackLibido);
  const refreshAppData = useRefreshAppData();
  // The name and libido setting are used across the app; reload them once saved.
  useEffect(() => {
    if (state.saved) void refreshAppData();
  }, [state, refreshAppData]);

  return (
    <form action={action} className="flex flex-col gap-2">
      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">銘</span>
        <input
          name="display_name"
          required
          maxLength={20}
          defaultValue={props.displayName}
          className="text-fg min-w-0 flex-1 bg-transparent text-right text-base focus:outline-none"
        />
      </label>
      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">身長</span>
        <span className="flex items-baseline gap-1">
          <input
            name="height_cm"
            inputMode="decimal"
            required
            defaultValue={props.heightCm ?? ""}
            className="num w-20 bg-transparent text-right text-2xl focus:outline-none"
          />
          <span className="text-muted text-xs">cm</span>
        </span>
      </label>
      <div className="surface flex flex-col gap-2 px-4 py-3">
        <span className="text-sm">性別</span>
        <Segmented
          name="sex"
          ariaLabel="性別"
          defaultValue={props.sex ?? undefined}
          options={[
            { value: "male", label: "男性" },
            { value: "female", label: "女性" },
            { value: "other", label: "その他" },
          ]}
        />
      </div>
      <div className="surface flex flex-col gap-2 px-4 py-3">
        <span className="text-sm">単位</span>
        <Segmented
          name="unit_pref"
          ariaLabel="単位"
          defaultValue={props.unitPref}
          options={[
            { value: "kg", label: "kg" },
            { value: "lb", label: "lb" },
          ]}
        />
      </div>
      <div className="surface flex h-14 items-center justify-between px-4">
        <span id="libido-label" className="text-sm">
          チェックインで性欲を記録する
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={libido}
          aria-labelledby="libido-label"
          onClick={() => setLibido((v) => !v)}
          className="flex h-12 w-14 items-center justify-end"
        >
          <span
            className={cn(
              "border-border flex h-7 w-12 items-center rounded-full border px-0.5",
              libido ? "bg-accent justify-end" : "bg-card justify-start",
            )}
          >
            <span className="bg-fg size-6 rounded-full" />
          </span>
        </button>
        {libido && <input type="hidden" name="track_libido" value="on" />}
      </div>

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
        プロフィールを保存
      </Button>
    </form>
  );
}
