import { describe, expect, it } from "vitest";
import { routineForDate } from "@/lib/routines";

describe("routineForDate", () => {
  const routines = [
    { name: "Legs", weekdays: [3], order_idx: 2 },
    { name: "Push A", weekdays: [1, 4], order_idx: 0 },
    { name: "Push B", weekdays: [4], order_idx: 1 },
  ];

  it("picks by weekday and order", () => {
    expect(routineForDate(routines, "2026-10-12")?.name).toBe("Push A"); // Monday
    expect(routineForDate(routines, "2026-10-14")?.name).toBe("Legs"); // Wednesday
    expect(routineForDate(routines, "2026-10-15")?.name).toBe("Push A"); // Thursday, first by order
  });

  it("returns null on off days", () => {
    expect(routineForDate(routines, "2026-10-18")).toBeNull(); // Sunday
  });
});
