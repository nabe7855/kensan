"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/tokens";

type Props = {
  endsAt: number;
  totalSec: number;
  onAdd: (sec: number) => void;
  onSkip: () => void;
  onDone: () => void;
};

const R = 44;
const C = 2 * Math.PI * R;

function format(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function notifyRestOver() {
  navigator.vibrate?.([200, 100, 200]);
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("レスト終了", { body: "次のセットへ", tag: "kensan-rest", silent: false });
    } catch {
      // Some mobile browsers only allow notifications from a service worker.
    }
  }
}

export function RestTimer({ endsAt, totalSec, onAdd, onSkip, onDone }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    fired.current = false;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [endsAt]);

  const left = (endsAt - now) / 1000;
  useEffect(() => {
    if (left <= 0 && !fired.current) {
      fired.current = true;
      notifyRestOver();
      onDone();
    }
  }, [left, onDone]);

  const progress = Math.min(1, Math.max(0, left / totalSec));

  return (
    <div className="surface flex items-center gap-3 px-3 py-3" role="timer" aria-live="off">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" stroke={COLORS.border} strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth="6"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            strokeLinecap="round"
          />
        </svg>
        <span className="num absolute inset-0 flex items-center justify-center text-3xl">
          {format(left)}
        </span>
      </div>
      <Button size="lg" className="flex-1 text-xl" onClick={() => onAdd(30)}>
        +30s
      </Button>
      <Button size="lg" variant="secondary" className="flex-1" onClick={onSkip}>
        スキップ
      </Button>
    </div>
  );
}
