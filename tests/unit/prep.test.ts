import { describe, expect, it } from "vitest";
import { daysUntilContest, formatPrepHeader, prepDay, todayISO } from "@/lib/prep";

describe("daysUntilContest", () => {
  it("counts calendar days to the contest", () => {
    expect(daysUntilContest("2027-04-18", "2027-03-07")).toBe(42);
  });

  it("is 0 on contest day and negative after", () => {
    expect(daysUntilContest("2027-04-18", "2027-04-18")).toBe(0);
    expect(daysUntilContest("2027-04-18", "2027-04-20")).toBe(-2);
  });
});

describe("prepDay", () => {
  it("is 1 on the start date", () => {
    expect(prepDay("2027-01-10", "2027-01-10")).toBe(1);
  });

  it("counts across month boundaries", () => {
    expect(prepDay("2027-01-10", "2027-03-06")).toBe(56);
  });
});

describe("formatPrepHeader", () => {
  it("matches the mockup format", () => {
    expect(formatPrepHeader("2027-04-18", "2027-01-11", "2027-03-07")).toBe("D-42 | PREP DAY 56");
  });
});

describe("todayISO", () => {
  it("uses the given time zone, not UTC", () => {
    const utcLateEvening = new Date("2026-10-15T20:00:00Z");
    expect(todayISO("Asia/Tokyo", utcLateEvening)).toBe("2026-10-16");
    expect(todayISO("UTC", utcLateEvening)).toBe("2026-10-15");
  });
});
