"use client";

type Props = {
  weight: number | null;
  reps: number | null;
  onWeight: (v: number) => void;
  onReps: (v: number) => void;
};

const round = (n: number) => Math.round(n * 100) / 100;

function Step({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="num border-border bg-bg active:bg-card h-12 rounded-md border text-lg"
    >
      {label}
    </button>
  );
}

/** Weight (±0.25 / ±2.5 kg) and reps (±1) steppers for the active set. */
export function StepperBar({ weight, reps, onWeight, onReps }: Props) {
  const w = weight ?? 0;
  const r = reps ?? 0;
  return (
    <div className="surface grid grid-cols-6 gap-1.5 px-2 py-2">
      <Step label="−2.5" onClick={() => onWeight(Math.max(0, round(w - 2.5)))} />
      <Step label="−.25" onClick={() => onWeight(Math.max(0, round(w - 0.25)))} />
      <Step label="+.25" onClick={() => onWeight(round(w + 0.25))} />
      <Step label="+2.5" onClick={() => onWeight(round(w + 2.5))} />
      <Step label="回−" onClick={() => onReps(Math.max(0, r - 1))} />
      <Step label="回+" onClick={() => onReps(r + 1)} />
    </div>
  );
}
