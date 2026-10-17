import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomTabBar } from "@/components/shell/BottomTabBar";

const pathname = vi.hoisted(() => ({ value: "/home" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

afterEach(cleanup);

describe("BottomTabBar", () => {
  it("renders the five tabs in order", () => {
    render(<BottomTabBar />);
    const labels = screen.getAllByRole("link").map((a) => a.textContent);
    expect(labels).toEqual(["ホーム", "トレ", "食事", "コンディション", "分析"]);
  });

  it("marks the current tab, including nested routes", () => {
    pathname.value = "/training/workout/123";
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "トレ" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "ホーム" }).getAttribute("aria-current")).toBeNull();
  });
});
