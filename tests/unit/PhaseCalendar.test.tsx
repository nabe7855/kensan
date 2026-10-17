import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { boundaryRange, PhaseCalendar } from "@/components/plan/PhaseCalendar";

afterEach(cleanup);

const dates = { mid: "2026-10-20", late: "2026-11-20", peak: "2026-12-13" };

describe("boundaryRange", () => {
  it("lets the start move into the past, but not past today or the start of 中期", () => {
    expect(boundaryRange("start", "2026-10-01", "2026-12-20", dates, "2026-10-18")).toEqual([
      "2026-07-09",
      "2026-10-18",
    ]);
    expect(boundaryRange("start", "2026-10-01", "2026-12-20", dates, "2026-11-01")).toEqual([
      "2026-07-09",
      "2026-10-19",
    ]);
    expect(boundaryRange("mid", "2026-10-01", "2026-12-20", dates, "2026-10-18")).toEqual([
      "2026-10-02",
      "2026-11-19",
    ]);
  });
});

describe("PhaseCalendar", () => {
  it("shows weeks before the current start and lets the start be picked there", () => {
    const onPick = vi.fn();
    render(
      <PhaseCalendar
        start="2026-10-01"
        contest="2026-12-20"
        dates={dates}
        today="2026-10-18"
        active="start"
        onPick={onPick}
      />,
    );
    const past = screen.getByRole("button", { name: "9月1日" }) as HTMLButtonElement;
    expect(past.disabled).toBe(false);
    fireEvent.click(past);
    expect(onPick).toHaveBeenCalledWith("2026-09-01");
    expect((screen.getByRole("button", { name: "10月25日" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "10月1日（初期の開始）" })).toBeTruthy();
  });
});
