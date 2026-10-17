import { describe, expect, it } from "vitest";
import { checklist, countdownLabel, nextContest, ownKey, sysKey } from "@/lib/contest";

const routines = [
  { id: "pose", title: "ポージング 30 分", days_before: 14, daily: true },
  { id: "tan", title: "日焼けサロン予約", days_before: 21, daily: false },
];

describe("checklist", () => {
  it("opens items on their day and keeps the rest upcoming", () => {
    const list = checklist("2026-11-01", "2026-10-18", routines, []); // 14 days left
    const now = list.now.map((i) => i.key);
    expect(now).toContain(sysKey("entry"));
    expect(now).toContain(sysKey("photo"));
    expect(now).toContain(ownKey("pose"));
    expect(now).toContain(ownKey("tan"));
    expect(list.upcoming.map((i) => i.key)).toContain(sysKey("meals"));
    expect(now[0]).toBe(sysKey("entry"));
  });

  it("keeps one-off items done once checked, and resets daily ones each day", () => {
    const checks = [
      { task_key: sysKey("entry"), on_date: "2026-10-05" },
      { task_key: ownKey("pose"), on_date: "2026-10-17" },
    ];
    const list = checklist("2026-11-01", "2026-10-18", routines, checks);
    expect(list.done.map((i) => i.key)).toEqual([sysKey("entry")]);
    expect(list.now.map((i) => i.key)).toContain(ownKey("pose"));
    const sameDay = checklist("2026-11-01", "2026-10-17", routines, checks);
    expect(sameDay.done.map((i) => i.key)).toContain(ownKey("pose"));
  });

  it("has nothing upcoming and no daily items after the contest", () => {
    const list = checklist("2026-10-01", "2026-10-18", routines, []);
    expect(list.upcoming).toEqual([]);
    expect(list.now.some((i) => i.daily)).toBe(false);
  });
});

describe("contest helpers", () => {
  it("finds the next contest", () => {
    const cs = [
      { id: "a", date: "2026-09-01" },
      { id: "c", date: "2026-12-01" },
      { id: "b", date: "2026-11-01" },
    ];
    expect(nextContest(cs, "2026-10-18")?.id).toBe("b");
    expect(nextContest(cs, "2027-01-01")).toBeNull();
  });

  it("labels the countdown", () => {
    expect(countdownLabel("2026-11-01", "2026-10-18")).toBe("あと 14 日");
    expect(countdownLabel("2026-10-18", "2026-10-18")).toBe("今日");
    expect(countdownLabel("2026-10-01", "2026-10-18")).toBe("終了");
  });
});
