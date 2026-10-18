"use client";

import { useState } from "react";
import {
  useAppData,
  type TrainingPhase,
  useRefreshAppData,
} from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { RestAlertSettings } from "@/components/rest/RestAlertSettings";
import { cn } from "@/lib/utils";

const PHASES: { key: TrainingPhase; label: string; note: string }[] = [
  { key: "bulk", label: "増量", note: "重量や回数が伸びていないと停滞として知らせる" },
  { key: "maintain", label: "維持", note: "伸びが止まったら種目変更やディロードを提案" },
  { key: "cut", label: "減量", note: "維持できていれば十分。はっきり落ちたときだけ知らせる" },
];

function Toggle({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="surface flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-left"
    >
      <span className="flex flex-col">
        <span className="text-base">{label}</span>
        <span className="text-muted text-xs leading-relaxed">{note}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-border",
        )}
      >
        <span
          className={cn(
            "bg-fg absolute top-1 size-5 rounded-full transition-[left]",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}

/** Training preferences saved straight to the profile. */
export function TrainingSettings() {
  const refreshAppData = useRefreshAppData();
  const { userId, showRir, trainingPhase, plateauAlerts, mutedExercises } = useAppData();
  const [muted, setMuted] = useState(mutedExercises.length);
  const { write } = useSync();
  const [state, setState] = useState({ showRir, trainingPhase, plateauAlerts });

  async function save(patch: Partial<typeof state>) {
    const next = { ...state, ...patch };
    setState(next);
    await write({
      table: "profiles",
      kind: "update",
      match: { user_id: userId },
      payload: {
        show_rir: next.showRir,
        training_phase: next.trainingPhase,
        plateau_alerts: next.plateauAlerts,
      },
    });
    void refreshAppData();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="surface flex flex-col gap-2 px-4 py-3">
        <span className="text-base">今の時期</span>
        <div className="grid grid-cols-3 gap-1.5">
          {PHASES.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={state.trainingPhase === p.key}
              onClick={() => void save({ trainingPhase: p.key })}
              className={cn(
                "h-12 rounded-md border text-base font-bold",
                state.trainingPhase === p.key
                  ? "border-accent bg-accent text-bg"
                  : "border-border text-fg",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-muted text-xs leading-relaxed">
          {PHASES.find((p) => p.key === state.trainingPhase)?.note}
        </p>
      </div>
      <Toggle
        label="停滞のお知らせ"
        note="今の時期に合わせて、伸び悩んでいる種目を知らせる"
        checked={state.plateauAlerts}
        onChange={(v) => void save({ plateauAlerts: v })}
      />
      {state.plateauAlerts && muted > 0 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-muted text-xs">
            知らせない種目 <span className="num">{muted}</span> 件
          </span>
          <button
            type="button"
            onClick={async () => {
              setMuted(0);
              await write({
                table: "profiles",
                kind: "update",
                match: { user_id: userId },
                payload: { muted_exercises: [] },
              });
              void refreshAppData();
            }}
            className="text-muted h-10 text-xs underline underline-offset-4"
          >
            すべて知らせるに戻す
          </button>
        </div>
      )}
      <RestAlertSettings />
      <Toggle
        label="RIR（余力）を記録する"
        note="毎セット限界まで追い込むなら不要。オンにするとセット表に列が出る"
        checked={state.showRir}
        onChange={(v) => void save({ showRir: v })}
      />
    </div>
  );
}
