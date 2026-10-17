import { describe, expect, it } from "vitest";
import { isChunkLoadError, shouldReloadForChunk } from "@/lib/chunk-error";

describe("chunk load errors", () => {
  it("recognises stale-deploy chunk failures", () => {
    const e = new Error("Loading chunk 8123 failed.");
    expect(isChunkLoadError(e)).toBe(true);
    const named = new Error("x");
    named.name = "ChunkLoadError";
    expect(isChunkLoadError(named)).toBe(true);
    expect(isChunkLoadError(new TypeError("Cannot read properties of null"))).toBe(false);
    expect(isChunkLoadError("Loading chunk 1 failed")).toBe(false);
  });

  it("reloads at most once a minute", () => {
    const e = new Error("Loading chunk 1 failed");
    expect(shouldReloadForChunk(e, 100_000, null)).toBe(true);
    expect(shouldReloadForChunk(e, 100_000, 90_000)).toBe(false);
    expect(shouldReloadForChunk(e, 200_000, 90_000)).toBe(true);
    expect(shouldReloadForChunk(new Error("boom"), 100_000, null)).toBe(false);
  });
});
