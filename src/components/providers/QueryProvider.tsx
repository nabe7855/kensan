"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";
import { kvDelete, kvGet, kvSet } from "@/lib/offline/db";

const WEEK = 7 * 24 * 60 * 60_000;
export const QUERY_CACHE_KEY = "queryCache";

/** Reads come from the TanStack Query cache, persisted to IndexedDB so they work offline. */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, gcTime: WEEK, retry: 1 },
        },
      }),
  );
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      key: QUERY_CACHE_KEY,
      throttleTime: 2000,
      storage: {
        getItem: (key) => kvGet<string>(key).then((v) => v ?? null),
        setItem: (key, value) => kvSet(key, value),
        removeItem: (key) => kvDelete(key),
      },
    }),
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: WEEK, buster: "v1" }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
