import Dexie, { type EntityTable } from "dexie";

export type OutboxOp = {
  id?: number;
  table: string;
  kind: "upsert" | "insert" | "delete";
  payload?: Record<string, unknown> | Record<string, unknown>[];
  onConflict?: string;
  /** Equality filter for deletes. */
  match?: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

class KensanDB extends Dexie {
  outbox!: EntityTable<OutboxOp, "id">;

  constructor() {
    super("kensan");
    this.version(1).stores({ outbox: "++id, createdAt" });
  }
}

let db: KensanDB | null = null;

export function localDb(): KensanDB {
  db ??= new KensanDB();
  return db;
}
