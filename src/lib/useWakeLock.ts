"use client";

import { useEffect } from "react";

type Sentinel = { released: boolean; release: () => Promise<void> };
type WakeLockApi = { request: (type: "screen") => Promise<Sentinel> };

const api = (): WakeLockApi | null =>
  typeof navigator !== "undefined" && "wakeLock" in navigator
    ? (navigator as unknown as { wakeLock: WakeLockApi }).wakeLock
    : null;

/** Whether this browser can keep the screen on. */
export const canKeepAwake = () => api() !== null;

/**
 * Keeps the screen from sleeping while `active`, so the rest-over sound can play.
 * Browsers drop the lock when the page is hidden, so it is taken again when it comes back.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const wl = api();
    if (!active || !wl) return;
    let lock: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible" || (lock && !lock.released)) return;
      try {
        const l = await wl.request("screen");
        if (cancelled) void l.release();
        else lock = l;
      } catch {
        // Low battery mode or no permission; the screen just sleeps as usual.
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release().catch(() => undefined);
    };
  }, [active]);
}
