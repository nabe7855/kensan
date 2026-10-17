import { describe, expect, it } from "vitest";
import { describeOp, explainError } from "@/lib/offline/describe";

describe("queued write labels", () => {
  it("names the record and the action", () => {
    expect(describeOp({ table: "preps", kind: "update" })).toBe("減量計画の変更");
    expect(describeOp({ table: "fridge_items", kind: "upsert" })).toBe("冷蔵庫の保存");
    expect(describeOp({ table: "unknown_table", kind: "delete" })).toBe("unknown_tableの削除");
  });

  it("explains common server errors", () => {
    expect(explainError('[23514] new row for relation "preps" violates check constraint')).toMatch(
      /ルールに合わず/,
    );
    expect(explainError("new row violates row-level security policy")).toMatch(/権限/);
    expect(explainError("[PGRST204] Could not find the 'x' column in the schema cache")).toMatch(
      /DB の更新待ち/,
    );
    expect(explainError("something else")).toBeNull();
    expect(explainError(undefined)).toBeNull();
  });
});
