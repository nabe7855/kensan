import { describe, expect, it } from "vitest";
import {
  daysApart,
  filterPhotos,
  fitWithin,
  parseTags,
  photoPath,
  pickEncoding,
  usedValues,
} from "@/lib/poses";

const photo = (id: string, taken_on: string, pose: string, tags: string[] = []) => ({
  id,
  taken_on,
  pose,
  tags,
});

describe("parseTags", () => {
  it("splits on spaces and commas, strips #, dedupes", () => {
    expect(parseTags("朝, #パンプ後　大会前、朝")).toEqual(["朝", "パンプ後", "大会前"]);
    expect(parseTags("   ")).toEqual([]);
  });

  it("caps count and length", () => {
    expect(parseTags(Array.from({ length: 15 }, (_, i) => `t${i}`).join(" "))).toHaveLength(10);
    expect(parseTags("あ".repeat(30))[0]).toHaveLength(20);
  });
});

describe("filtering", () => {
  const photos = [
    photo("a", "2026-09-01", "フロント", ["朝"]),
    photo("b", "2026-10-01", "バック", ["朝", "パンプ後"]),
    photo("c", "2026-10-10", "フロント", ["パンプ後"]),
  ];

  it("filters by pose and tag, newest first", () => {
    expect(filterPhotos(photos, { pose: "フロント", tag: null }).map((p) => p.id)).toEqual([
      "c",
      "a",
    ]);
    expect(filterPhotos(photos, { pose: null, tag: "朝" }).map((p) => p.id)).toEqual(["b", "a"]);
    expect(filterPhotos(photos, { pose: "フロント", tag: "朝" }).map((p) => p.id)).toEqual(["a"]);
    expect(filterPhotos(photos, { pose: null, tag: null })).toHaveLength(3);
  });

  it("lists used poses and tags by count", () => {
    expect(usedValues(photos)).toEqual({ poses: ["フロント", "バック"], tags: ["パンプ後", "朝"] });
  });
});

describe("helpers", () => {
  it("fits images inside the max size", () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("builds per-user paths and day gaps", () => {
    expect(photoPath("u1", "p1")).toBe("u1/p1.webp");
    expect(photoPath("u1", "p1", "jpg")).toBe("u1/p1.jpg");
    expect(daysApart("2026-10-01", "2026-10-13")).toBe("12日差");
    expect(daysApart("2026-10-01", "2026-10-01")).toBe("同じ日");
  });
});

describe("pickEncoding", () => {
  it("accepts WebP or JPEG and rejects the PNG a canvas falls back to", () => {
    expect(pickEncoding("image/webp")?.ext).toBe("webp");
    expect(pickEncoding("image/jpeg")?.ext).toBe("jpg");
    expect(pickEncoding("image/png")).toBeNull();
  });
});
