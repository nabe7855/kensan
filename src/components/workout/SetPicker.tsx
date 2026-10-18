"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wheel } from "@/components/ui/wheel";
import { joinKg, KG_FRACTIONS, MAX_KG, MAX_REPS, MAX_RIR, range, splitKg } from "@/lib/wheel";

/** `weight` is the total load; `bw` is the body weight in it for a bodyweight set. */
export type SetValues = { weight: number; reps: number; rir: number; bw?: number | null };

const WHOLE_KG = range(MAX_KG);
const REPS = range(MAX_REPS);
const RIR = range(MAX_RIR);
const fracLabel = (f: number) => `.${String(Math.round(f * 100)).padStart(2, "0")}`;
const r2 = (n: number) => Math.round(n * 100) / 100;
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;

/**
 * Bottom panel with wheels for one set: kilograms (whole + quarter), reps and optionally RIR.
 * No keyboard; "記録して完了" saves the numbers and checks the set off in one tap.
 */
export function SetPicker({
  title,
  initial,
  previous,
  bodyweight,
  showRir,
  canComplete,
  onApply,
  onComplete,
  onClose,
}: {
  title: string;
  initial: SetValues;
  previous?: {
    weight_kg: number | null;
    reps: number | null;
    bodyweight_kg?: number | null;
  } | null;
  /** The day's body weight (or the latest before it), for bodyweight exercises. */
  bodyweight?: { kg: number; date: string } | null;
  showRir: boolean;
  canComplete: boolean;
  onApply: (v: SetValues) => void;
  onComplete: (v: SetValues) => void;
  onClose: () => void;
}) {
  // A set already saved as bodyweight keeps the weight it had; new ones use the day's weight.
  const bwKg = initial.bw ?? bodyweight?.kg ?? null;
  const [bwOn, setBwOn] = useState(initial.bw != null && bwKg !== null);
  // With bodyweight on, the kg wheels are the added load (加重); otherwise the total.
  const start = splitKg(
    bwOn && bwKg !== null ? Math.max(0, initial.weight - bwKg) : initial.weight,
  );
  const [whole, setWhole] = useState(start.whole);
  const [frac, setFrac] = useState(start.frac);
  const [reps, setReps] = useState(initial.reps);
  const [rir, setRir] = useState(initial.rir);
  // Remount the wheels when jumping to last time's numbers so they scroll there.
  const [jump, setJump] = useState(0);
  const wheelKg = joinKg(whole, frac);
  const values = (): SetValues =>
    bwOn && bwKg !== null
      ? { weight: r2(bwKg + wheelKg), reps, rir, bw: bwKg }
      : { weight: wheelKg, reps, rir, bw: null };
  const setWheels = (kg: number) => {
    const p = splitKg(kg);
    setWhole(p.whole);
    setFrac(p.frac);
    setJump((n) => n + 1);
  };
  const toggleBw = () => {
    if (bwKg === null) return;
    // Keep the total the same when switching: total ↔ body weight + added.
    setWheels(bwOn ? r2(bwKg + wheelKg) : Math.max(0, r2(wheelKg - bwKg)));
    setBwOn(!bwOn);
  };

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
                  const prevBw = previous.bodyweight_kg ?? null;
                  if (prevBw !== null && bwKg !== null) {
                    setBwOn(true);
                    setWheels(Math.max(0, r2(previous.weight_kg! - prevBw)));
                  } else {
                    setBwOn(false);
                    setWheels(previous.weight_kg!);
                  }
                  setReps(previous.reps!);
                }}
                className="border-border text-muted num h-10 rounded-md border px-3 text-sm"
              >
                前回{" "}
                {previous.bodyweight_kg != null
                  ? `自重${previous.weight_kg! > previous.bodyweight_kg ? `+${r2(previous.weight_kg! - previous.bodyweight_kg)}` : ""}`
                  : previous.weight_kg}
                ×{previous.reps}
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

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={bwOn}
            disabled={bwKg === null}
            onClick={toggleBw}
            className={
              bwOn
                ? "border-accent text-accent h-10 rounded-md border px-3 text-sm font-bold"
                : "border-border text-muted h-10 rounded-md border px-3 text-sm disabled:opacity-40"
            }
          >
            自重
          </button>
          <span className="text-muted min-w-0 text-right text-xs leading-snug">
            {bwKg === null ? (
              "体重の記録がないため使えません"
            ) : bwOn ? (
              <>
                体重 <span className="num text-fg">{bwKg}</span>kg
                {bodyweight && initial.bw == null && `（${md(bodyweight.date)}）`}＋ 加重 ＝ 合計{" "}
                <span className="num text-fg text-sm">{r2(bwKg + wheelKg)}</span>kg
              </>
            ) : (
              "懸垂・ディップスなどは自重に"
            )}
          </span>
        </div>

        <div key={jump} className="flex items-center gap-1">
          <Wheel
            values={WHOLE_KG}
            value={whole}
            onChange={setWhole}
            label={bwOn ? "加重（kg）" : "重さ（kg）"}
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
          <span className="text-muted text-sm">{bwOn ? "加重" : "kg"}</span>
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
