import type { SupabaseClient } from "@supabase/supabase-js";
import { localDb, type OutboxOp } from "./db";

export const OUTBOX_CHANGED = "kensan:outbox-changed";
const MAX_ATTEMPTS = 5;

type Result = {
  error: { message: string; code?: string; details?: string | null; hint?: string | null } | null;
  status?: number;
};

function isTransient(result: Result): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (result.status === 0) return true;
  return /fetch|network|timeout/i.test(result.error?.message ?? "");
}

async function run(client: SupabaseClient, op: OutboxOp): Promise<Result> {
  // Table names come from our own call sites; the typed client can't express them dynamically.
  const table = client.from(op.table);
  switch (op.kind) {
    case "upsert":
      return table.upsert(op.payload ?? {}, {
        ...(op.onConflict ? { onConflict: op.onConflict } : {}),
        ...(op.ignoreDuplicates ? { ignoreDuplicates: true } : {}),
      });
    case "insert":
      return table.insert(op.payload ?? {});
    case "update":
    case "delete": {
      if (!op.match || Object.keys(op.match).length === 0) {
        return { error: { message: `${op.kind} without match` } };
      }
      return op.kind === "update"
        ? table.update(op.payload ?? {}).match(op.match)
        : table.delete().match(op.match);
    }
  }
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OUTBOX_CHANGED));
}

async function flushOnce(client: SupabaseClient): Promise<number> {
  let sent = 0;
  const ops = await localDb().outbox.orderBy("id").toArray();
  for (const op of ops) {
    if (op.attempts >= MAX_ATTEMPTS) continue;
    let result: Result;
    try {
      result = await run(client, op);
    } catch (e) {
      result = { error: { message: String(e) }, status: 0 };
    }
    if (!result.error) {
      await localDb().outbox.delete(op.id!);
      sent++;
      continue;
    }
    if (isTransient(result)) break;
    const { code, message, details } = result.error;
    await localDb().outbox.update(op.id!, {
      attempts: op.attempts + 1,
      // Keep the code and details: they are what tells a stuck write apart.
      lastError: [code && `[${code}]`, message, details].filter(Boolean).join(" "),
    });
  }
  return sent;
}

let flushing: Promise<number> | null = null;
let rerun = false;

/** Send queued writes in order. Stops at the first transient failure. Returns ops sent. */
export function flushOutbox(client: SupabaseClient): Promise<number> {
  if (flushing) {
    rerun = true;
    return flushing;
  }
  flushing = (async () => {
    let sent = 0;
    try {
      do {
        rerun = false;
        sent += await flushOnce(client);
      } while (rerun);
    } finally {
      flushing = null;
      notify();
    }
    return sent;
  })();
  return flushing;
}

/** Queue a write locally, then try to send it right away. */
export async function enqueue(
  client: SupabaseClient,
  op: Omit<OutboxOp, "id" | "createdAt" | "attempts">,
): Promise<void> {
  await localDb().outbox.add({ ...op, createdAt: Date.now(), attempts: 0 });
  notify();
  await flushOutbox(client);
}

/** Give every queued write a fresh set of attempts and send again. */
export async function retryAll(client: SupabaseClient): Promise<number> {
  await localDb()
    .outbox.toCollection()
    .modify((op) => {
      op.attempts = 0;
      delete op.lastError;
    });
  notify();
  return flushOutbox(client);
}

/** Drop one queued write for good (it will never reach the server). */
export async function discardOp(id: number): Promise<void> {
  await localDb().outbox.delete(id);
  notify();
}

export async function pendingOps(): Promise<OutboxOp[]> {
  return localDb().outbox.orderBy("id").toArray();
}
