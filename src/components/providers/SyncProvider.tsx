"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { enqueue, flushOutbox, OUTBOX_CHANGED, pendingOps } from "@/lib/offline/outbox";
import type { OutboxOp } from "@/lib/offline/db";
import { getSupabase } from "@/lib/supabase/client";

type Sync = {
  pending: number;
  failed: number;
  /** Queue a write; resolves once it has been stored locally and a send was attempted. */
  write: (op: Omit<OutboxOp, "id" | "createdAt" | "attempts">) => Promise<void>;
};

const SyncContext = createContext<Sync | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);

  const refreshCounts = useCallback(async () => {
    const ops = await pendingOps();
    setPending(ops.length);
    setFailed(ops.filter((o) => o.lastError).length);
  }, []);

  const flush = useCallback(async () => {
    const sent = await flushOutbox(getSupabase());
    if (sent > 0) await queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => {
    void refreshCounts();
    void flush();
    const onVisible = () => document.visibilityState === "visible" && void flush();
    window.addEventListener("online", flush);
    window.addEventListener(OUTBOX_CHANGED, refreshCounts);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", flush);
      window.removeEventListener(OUTBOX_CHANGED, refreshCounts);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [flush, refreshCounts]);

  const write = useCallback<Sync["write"]>(
    async (op) => {
      await enqueue(getSupabase(), op);
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  return <SyncContext.Provider value={{ pending, failed, write }}>{children}</SyncContext.Provider>;
}

export function useSync(): Sync {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used inside SyncProvider");
  return ctx;
}
