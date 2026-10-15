"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { saveBody, type FormState } from "@/app/onboarding/actions";

type Props = {
  defaults: { height_cm?: number | null; sex?: string | null; unit_pref?: string | null };
};

export function BodyForm({ defaults }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBody, {});

  return (
    <form action={action} className="flex flex-1 flex-col gap-4">
      <label className="surface flex items-end justify-between px-4 py-4">
        <span className="pb-3 text-sm">身長</span>
        <span className="flex items-baseline gap-2">
          <input
            name="height_cm"
            inputMode="decimal"
            required
            defaultValue={defaults.height_cm ?? ""}
            placeholder="170.0"
            className="num text-fg placeholder:text-ghost w-36 bg-transparent text-right text-6xl leading-none focus:outline-none"
          />
          <span className="num text-muted text-lg">cm</span>
        </span>
      </label>

      <div className="surface flex flex-col gap-3 px-4 py-4">
        <span className="text-sm">性別</span>
        <Segmented
          name="sex"
          ariaLabel="性別"
          defaultValue={defaults.sex ?? undefined}
          options={[
            { value: "male", label: "男性" },
            { value: "female", label: "女性" },
            { value: "other", label: "その他" },
          ]}
        />
      </div>

      <div className="surface flex flex-col gap-3 px-4 py-4">
        <span className="text-sm">単位</span>
        <Segmented
          name="unit_pref"
          ariaLabel="単位"
          defaultValue={defaults.unit_pref ?? "kg"}
          options={[
            { value: "kg", label: "kg" },
            { value: "lb", label: "lb" },
          ]}
        />
        <span className="text-ghost text-xs">lb 表示は今後対応します。当面は kg で表示します</span>
      </div>

      {state.error && (
        <p role="alert" className="text-warn text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-auto w-full" disabled={pending}>
        次へ
      </Button>
    </form>
  );
}
