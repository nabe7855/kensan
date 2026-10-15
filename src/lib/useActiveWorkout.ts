"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { kvDelete, kvGet, kvSet } from "@/lib/offline/db";
import type { ActiveWorkout } from "@/lib/workout";

const KEY = "activeWorkout";

/** The workout in progress, persisted on the device so a reload or crash loses nothing. */
export function useActiveWorkout() {
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef<ActiveWorkout | null>(null);

  useEffect(() => {
    let cancelled = false;
    void kvGet<ActiveWorkout>(KEY).then((w) => {
      if (cancelled) return;
      latest.current = w ?? null;
      setWorkout(w ?? null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((fn: (w: ActiveWorkout) => ActiveWorkout) => {
    const current = latest.current;
    if (!current) return;
    const next = fn(current);
    latest.current = next;
    setWorkout(next);
    void kvSet(KEY, next);
  }, []);

  const start = useCallback(async (w: ActiveWorkout) => {
    latest.current = w;
    setWorkout(w);
    await kvSet(KEY, w);
  }, []);

  const clear = useCallback(async () => {
    latest.current = null;
    setWorkout(null);
    await kvDelete(KEY);
  }, []);

  return { workout, loaded, update, start, clear };
}

export async function readActiveWorkout(): Promise<ActiveWorkout | null> {
  return (await kvGet<ActiveWorkout>(KEY)) ?? null;
}

export async function saveActiveWorkout(w: ActiveWorkout): Promise<void> {
  await kvSet(KEY, w);
}
