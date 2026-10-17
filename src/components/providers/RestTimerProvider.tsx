"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { kvGet, kvSet, kvDelete } from "@/lib/offline/db";
import {
  addTime,
  REST_PRESETS,
  remainingSec,
  startTimer,
  type RestTimerState,
} from "@/lib/rest-timer";

const KEYS = { timer: "restTimer", presets: "restPresets", selected: "restSelected" };

type RestTimer = {
  timer: RestTimerState | null;
  presets: number[];
  selected: number;
  /** Start a countdown (defaults to the selected preset). */
  start: (sec?: number) => void;
  add: (sec: number) => void;
  stop: () => void;
  select: (sec: number) => void;
  setPresets: (presets: number[]) => void;
};

const Ctx = createContext<RestTimer | null>(null);

function notifyRestOver() {
  navigator.vibrate?.([200, 100, 200]);
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const options = { body: "次のセットへ", tag: "kensan-rest" };
  // Android Chrome and installed PWAs only allow notifications from the service worker.
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    void navigator.serviceWorker.ready.then((reg) => reg.showNotification("レスト終了", options));
    return;
  }
  try {
    new Notification("レスト終了", options);
  } catch {
    // No notification support in this context; vibration already fired.
  }
}

/** One rest countdown for the whole app, kept on the device so it survives reloads. */
export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState<RestTimerState | null>(null);
  const [presets, setPresetsState] = useState<number[]>([...REST_PRESETS]);
  const [selected, setSelected] = useState<number>(90);
  const fired = useRef(false);

  useEffect(() => {
    void Promise.all([
      kvGet<RestTimerState>(KEYS.timer),
      kvGet<number[]>(KEYS.presets),
      kvGet<number>(KEYS.selected),
    ]).then(([t, p, s]) => {
      if (t && remainingSec(t) > 0) setTimer(t);
      if (p?.length) setPresetsState(p);
      if (s) setSelected(s);
    });
  }, []);

  // Fire once when the countdown reaches zero, wherever the user is in the app.
  useEffect(() => {
    if (!timer) return;
    fired.current = false;
    const id = setInterval(() => {
      if (remainingSec(timer) <= 0 && !fired.current) {
        fired.current = true;
        notifyRestOver();
        setTimer(null);
        void kvDelete(KEYS.timer);
      }
    }, 250);
    return () => clearInterval(id);
  }, [timer]);

  const save = (t: RestTimerState | null) => {
    setTimer(t);
    void (t ? kvSet(KEYS.timer, t) : kvDelete(KEYS.timer));
  };

  const start = useCallback(
    (sec?: number) => {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission();
      }
      save(startTimer(sec ?? selected));
    },
    [selected],
  );
  const add = useCallback(
    (sec: number) =>
      setTimer((t) => {
        if (!t) return t;
        const next = addTime(t, sec);
        void kvSet(KEYS.timer, next);
        return next;
      }),
    [],
  );
  const stop = useCallback(() => save(null), []);
  const select = useCallback((sec: number) => {
    setSelected(sec);
    void kvSet(KEYS.selected, sec);
  }, []);
  const setPresets = useCallback((p: number[]) => {
    setPresetsState(p);
    void kvSet(KEYS.presets, p);
  }, []);

  return (
    <Ctx.Provider value={{ timer, presets, selected, start, add, stop, select, setPresets }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRestTimer(): RestTimer {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRestTimer must be used inside RestTimerProvider");
  return ctx;
}

/** Re-render on a short interval while a countdown is running. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}
