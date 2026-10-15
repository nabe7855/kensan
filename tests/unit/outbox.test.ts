import "fake-indexeddb/auto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import { localDb } from "@/lib/offline/db";
import { enqueue, flushOutbox, pendingOps } from "@/lib/offline/outbox";

type Call = { table: string; kind: string; arg: unknown };
type Result = { error: { message: string } | null; status?: number };

function fakeClient(respond: (call: Call) => Result) {
  const calls: Call[] = [];
  const exec = (call: Call) => {
    calls.push(call);
    return Promise.resolve(respond(call));
  };
  const client = {
    from: (table: string) => ({
      upsert: (arg: unknown) => exec({ table, kind: "upsert", arg }),
      insert: (arg: unknown) => exec({ table, kind: "insert", arg }),
      delete: () => ({ match: (arg: unknown) => exec({ table, kind: "delete", arg }) }),
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

const ok: Result = { error: null, status: 201 };

beforeEach(async () => {
  await localDb().outbox.clear();
});

describe("outbox", () => {
  it("sends queued writes in order and clears them", async () => {
    const { client, calls } = fakeClient(() => ok);
    await enqueue(client, { table: "a", kind: "upsert", payload: { n: 1 } });
    await enqueue(client, { table: "b", kind: "insert", payload: { n: 2 } });
    expect(calls.map((c) => c.table)).toEqual(["a", "b"]);
    expect(await pendingOps()).toHaveLength(0);
  });

  it("keeps writes and stops at a transient (network) failure", async () => {
    let online = false;
    const { client, calls } = fakeClient(() =>
      online ? ok : { error: { message: "TypeError: Failed to fetch" }, status: 0 },
    );
    await enqueue(client, { table: "a", kind: "upsert", payload: {} });
    await enqueue(client, { table: "b", kind: "upsert", payload: {} });
    expect(await pendingOps()).toHaveLength(2);
    const attemptsBefore = (await pendingOps()).map((o) => o.attempts);
    expect(attemptsBefore).toEqual([0, 0]);

    online = true;
    calls.length = 0;
    expect(await flushOutbox(client)).toBe(2);
    expect(calls.map((c) => c.table)).toEqual(["a", "b"]);
    expect(await pendingOps()).toHaveLength(0);
  });

  it("records permanent failures and moves on", async () => {
    const { client } = fakeClient((c) =>
      c.table === "bad" ? { error: { message: "violates check constraint" }, status: 400 } : ok,
    );
    await enqueue(client, { table: "bad", kind: "insert", payload: {} });
    await enqueue(client, { table: "good", kind: "insert", payload: {} });
    const left = await pendingOps();
    expect(left).toHaveLength(1);
    expect(left[0]!.table).toBe("bad");
    expect(left[0]!.attempts).toBeGreaterThan(0);
    expect(left[0]!.lastError).toMatch(/check constraint/);
  });

  it("refuses deletes without a filter", async () => {
    const { client, calls } = fakeClient(() => ok);
    await enqueue(client, { table: "a", kind: "delete" });
    expect(calls).toHaveLength(0);
    expect((await pendingOps())[0]!.lastError).toMatch(/without match/);
  });
});
