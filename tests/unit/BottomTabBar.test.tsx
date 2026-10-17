import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomTabBar } from "@/components/shell/BottomTabBar";

const pathname = vi.hoisted(() => ({ value: "/home" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));
vi.mock("@/components/shell/useTodayStatus", () => ({
  useTodayStatus: () => ({
    "/home": { ring: { ratio: 0.5, pct: 50 }, note: "23日" },
    "/training": { ring: { ratio: 1, pct: 100 } },
    "/nutrition": { ring: { ratio: 0.64, pct: 64 }, note: "64%" },
    "/condition": { ring: { ratio: 0, pct: 0 } },
  }),
}));

afterEach(cleanup);

const link = (label: string) =>
  screen.getAllByRole("link").find((a) => a.textContent?.startsWith(label))!;

describe("BottomTabBar", () => {
  it("renders the five tabs in order with today's numbers", () => {
    render(<BottomTabBar />);
    const labels = screen.getAllByRole("link").map((a) => a.textContent);
    expect(labels).toEqual(["ホーム23日", "トレ", "食事64%", "コンディション", "分析"]);
  });

  it("describes each ring for screen readers", () => {
    render(<BottomTabBar />);
    expect(screen.getByRole("img", { name: "たんぱく質 64%" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "今日はトレ記録済み" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "今日の体調は未記録" })).toBeTruthy();
  });

  it("marks the current tab, including nested routes", () => {
    pathname.value = "/training/workout/123";
    render(<BottomTabBar />);
    expect(link("トレ").getAttribute("aria-current")).toBe("page");
    expect(link("ホーム").getAttribute("aria-current")).toBeNull();
  });
});
