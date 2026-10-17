"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wheel } from "@/components/ui/wheel";
import { joinKg, KG_FRACTIONS, MAX_KG, MAX_REPS, MAX_RIR, range, splitKg } from "@/lib/wheel";

export type SetValues = { weight: number; reps: number; rir: number };

const WHOLE_KG = range(MAX_KG);
const REPS = range(MAX_REPS);
const RIR = range(MAX_RIR);
const fracLabel = (f: number) => `.${String(Math.round(f * 100)).padStart(2, "0")}`;

/**
 * Bottom panel with wheels for one set: kilograms (whole + quarter), reps and optionally RIR.
 * No keyboard; "記録して完了" saves the numbers and checks the set off in one tap.
 */
export function SetPicker({
  title,
  initial,
  previous,
  showRir,
  canComplete,
  onApply,
  onComplete,
  onClose,
}: {
  title: string;
  initial: SetValues;
  previous?: { weight_kg: number | null; reps: number | null } | null;
  showRir: boolean;
  canComplete: boolean;
  onApply: (v: SetValues) => void;
  onComplete: (v: SetValues) => void;
  onClose: () => void;
}) {
  const start = splitKg(initial.weight);
  const [whole, setWhole] = useState(start.whole);
  const [frac, setFrac] = useState(start.frac);
  const [reps, setReps] = useState(initial.reps);
  const [rir, setRir] = useState(initial.rir);
  // Remount the wheels when jumping to last time's numbers so they scroll there.
  const [jump, setJump] = useState(0);
  const values = (): SetValues => ({ weight: joinKg(whole, frac), reps, rir });

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label={title}>
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="bg-bg/70 absolute inset-0"
      />
      <div className="bg-bg border-border absolute inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col gap-3 rounded-t-xl border-t px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold">{title}</h2>
          <div className="flex items-center gap-1">
            {previous?.weight_kg != null && previous.reps != null && (
              <button
                type="button"
                onClick={() => {
                  const p = splitKg(previous.weight_kg!);
                  setWhole(p.whole);
                  setFrac(p.frac);
                  setReps(previous.reps!);
                  setJump((n) => n + 1);
                }}
                className="border-border text-muted num h-10 rounded-md border px-3 text-sm"
              >
                前回 {previous.weight_kg}×{previous.reps}
              </button>
            )}
            <button
              type="button"
              aria-label="閉じる"
              onClick={onClose}
              className="text-muted flex size-10 items-center justify-center"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div key={jump} className="flex items-center gap-1">
          <Wheel
            values={WHOLE_KG}
            value={whole}
            onChange={setWhole}
            label="重さ（kg）"
            className="flex-[1.3]"
          />
          <Wheel
            values={KG_FRACTIONS}
            value={frac}
            onChange={setFrac}
            label="重さの小数"
            format={fracLabel}
            className="flex-1"
          />
          <span className="text-muted text-sm">kg</span>
          <span className="text-ghost px-1 text-lg">×</span>
          <Wheel values={REPS} value={reps} onChange={setReps} label="回数" className="flex-1" />
          <span className="text-muted text-sm">回</span>
          {showRir && (
            <>
              <Wheel
                values={RIR}
                value={rir}
                onChange={setRir}
                label="RIR"
                className="flex-[0.8]"
              />
              <span className="text-muted text-xs">RIR</span>
            </>
          )}
        </div>

        <div className={canComplete ? "grid grid-cols-2 gap-2" : "grid"}>
          <Button
            variant={canComplete ? "secondary" : "primary"}
            size="lg"
            onClick={() => {
              onApply(values());
              onClose();
            }}
          >
            決定
          </Button>
          {canComplete && (
            <Button
              size="lg"
              disabled={reps <= 0}
              onClick={() => {
                onComplete(values());
                onClose();
              }}
            >
              記録して完了
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
