import Dexie, { type EntityTable } from "dexie";

export type OutboxOp = {
  id?: number;
  table: string;
  kind: "upsert" | "insert" | "update" | "delete";
  payload?: Record<string, unknown> | Record<string, unknown>[];
  onConflict?: string;
  /** Equality filter for updates and deletes. */
  match?: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

/** Small key/value store for local-only state such as the workout in progress. */
export type KvEntry = { key: string; value: unknown };

class KensanDB extends Dexie {
  outbox!: EntityTable<OutboxOp, "id">;
  kv!: EntityTable<KvEntry, "key">;

  constructor() {
    super("kensan");
    this.version(1).stores({ outbox: "++id, createdAt" });
    this.version(2).stores({ outbox: "++id, createdAt", kv: "key" });
  }
}

let db: KensanDB | null = null;

export function localDb(): KensanDB {
  db ??= new KensanDB();
  return db;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await localDb().kv.get(key))?.value as T | undefined;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  await localDb().kv.put({ key, value });
}

export async function kvDelete(key: string): Promise<void> {
  await localDb().kv.delete(key);
}
