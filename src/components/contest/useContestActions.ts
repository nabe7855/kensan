"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import type { Check, Contest, Routine } from "@/lib/contest";
import { contestKeys } from "@/lib/queries/contests";

/** Optimistic writes for contests, routine items and checks (queued offline). */
export function useContestActions() {
  const queryClient = useQueryClient();
  const { userId } = useAppData();
  const { write } = useSync();

  const saveContest = useCallback(
    async (c: Contest) => {
      queryClient.setQueryData<Contest[]>(contestKeys.all, (list = []) =>
        [...list.filter((x) => x.id !== c.id), c].sort((a, b) => a.date.localeCompare(b.date)),
      );
      await write({ table: "contests", kind: "upsert", payload: { ...c, user_id: userId } });
    },
    [queryClient, userId, write],
  );

  const removeContest = useCallback(
    async (id: string) => {
      queryClient.setQueryData<Contest[]>(contestKeys.all, (list = []) =>
        list.filter((x) => x.id !== id),
      );
      await write({ table: "contests", kind: "delete", match: { id, user_id: userId } });
    },
    [queryClient, userId, write],
  );

  const saveRoutine = useCallback(
    async (r: Routine) => {
      queryClient.setQueryData<Routine[]>(contestKeys.routines, (list = []) =>
        [...list.filter((x) => x.id !== r.id), r].sort((a, b) => b.days_before - a.days_before),
      );
      await write({
        table: "contest_routines",
        kind: "upsert",
        payload: { ...r, user_id: userId },
      });
    },
    [queryClient, userId, write],
  );

  const removeRoutine = useCallback(
    async (id: string) => {
      queryClient.setQueryData<Routine[]>(contestKeys.routines, (list = []) =>
        list.filter((x) => x.id !== id),
      );
      await write({ table: "contest_routines", kind: "delete", match: { id, user_id: userId } });
    },
    [queryClient, userId, write],
  );

  const setChecked = useCallback(
    async (contestId: string, check: Check, done: boolean, oneOff: boolean) => {
      const key = contestKeys.checks(contestId);
      const matches = (c: Check) =>
        c.task_key === check.task_key && (oneOff || c.on_date === check.on_date);
      const existing = queryClient.getQueryData<Check[]>(key) ?? [];
      queryClient.setQueryData<Check[]>(key, (list = []) =>
        done ? [...list, check] : list.filter((c) => !matches(c)),
      );
      if (done) {
        await write({
          table: "contest_checks",
          kind: "upsert",
          ignoreDuplicates: true,
          onConflict: "user_id,contest_id,task_key,on_date",
          payload: { ...check, contest_id: contestId, user_id: userId },
        });
        return;
      }
      // A one-off item may have been checked on another day; clear every record of it.
      for (const c of existing.filter(matches)) {
        await write({
          table: "contest_checks",
          kind: "delete",
          match: {
            user_id: userId,
            contest_id: contestId,
            task_key: c.task_key,
            on_date: c.on_date,
          },
        });
      }
    },
    [queryClient, userId, write],
  );

  return { saveContest, removeContest, saveRoutine, removeRoutine, setChecked };
}
